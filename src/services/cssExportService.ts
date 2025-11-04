import { VariableCollection } from '../types';
import { UnitsService } from './unitsService';
import { ErrorHandler } from '../utils/errorHandler';

// Constants for better maintainability
const CSS_VARIABLE_PREFIX = '--';
const SCSS_VARIABLE_PREFIX = '$';
const DEFAULT_FORMAT = 'css' as const;

// Types for internal use
interface CSSVariable {
  name: string;
  value: string;
  originalName: string;
}

interface GroupedVariables {
  [groupName: string]: CSSVariable[];
}

interface FormattedCollection {
  name: string;
  variables: CSSVariable[];
  groups: GroupedVariables;
}

export type CSSFormat = 'css' | 'scss';

export class CSSExportService {
  private static readonly variableCache = new Map<string, any>();
  private static readonly collectionCache = new Map<string, FormattedCollection>();

  /**
   * Export variables in the specified format (CSS or SCSS)
   */
  static async exportVariables(format: CSSFormat = DEFAULT_FORMAT): Promise<string> {
    return await ErrorHandler.withErrorHandling(async () => {
      // Validate format
      const validFormats = ['css', 'scss'];
      if (validFormats.indexOf(format.toLowerCase()) === -1) {
        throw new Error(`Invalid export format: ${format}. Must be 'css' or 'scss'.`);
      }

      await this.initialize();
      const collections = await this.getProcessedCollections();
      
      if (!collections || collections.length === 0) {
        throw new Error('No variables found to export. Please ensure you have created variables in your Figma file.');
      }

      return this.buildExportContent(collections, format);
    }, {
      operation: 'export_variables',
      component: 'CSSExportService',
      severity: 'high'
    });
  }

  /**
   * Initialize the service by clearing caches and loading settings
   */
  private static async initialize(): Promise<void> {
    return await ErrorHandler.withErrorHandling(async () => {
      this.clearCaches();
      await UnitsService.loadUnitSettings();
    }, {
      operation: 'initialize_css_export_service',
      component: 'CSSExportService',
      severity: 'medium'
    });
  }

  /**
   * Clear all internal caches
   */
  private static clearCaches(): void {
    this.variableCache.clear();
    this.collectionCache.clear();
  }

  /**
   * Get processed collections with variables organized by groups
   */
  private static async getProcessedCollections(): Promise<FormattedCollection[]> {
    return await ErrorHandler.withErrorHandling(async () => {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      if (!collections || collections.length === 0) {
        throw new Error('No variable collections found in this Figma file.');
      }

      await this.populateVariableCache(collections);
      
      const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
      const processedCollections: FormattedCollection[] = [];
      
      for (const collection of sortedCollections) {
        try {
          const processed = await this.processCollection(collection);
          if (processed.variables.length > 0 || Object.keys(processed.groups).length > 0) {
            processedCollections.push(processed);
          }
        } catch (collectionError) {
          ErrorHandler.handleError(collectionError as Error, {
            operation: `process_collection_${collection.name}`,
            component: 'CSSExportService',
            severity: 'medium'
          });
          // Continue processing other collections
        }
      }
      
      return processedCollections;
    }, {
      operation: 'get_processed_collections',
      component: 'CSSExportService',
      severity: 'high'
    });
  }

  /**
   * Process a single collection and organize its variables
   */
  private static async processCollection(collection: any): Promise<FormattedCollection> {
    const cacheKey = `${collection.id}-${collection.variableIds.length}`;
    const cached = this.collectionCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const variables: CSSVariable[] = [];
    const groups: GroupedVariables = {};

    await Promise.all(collection.variableIds.map(async (variableId: string) => {
      const cssVariable = await this.processVariable(variableId, collection);
      if (!cssVariable) return;

      // Group by prefix if contains /
      const pathMatch = cssVariable.originalName.match(/^([^\/]+)\//);
      if (pathMatch) {
        const groupName = pathMatch[1];
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(cssVariable);
      } else {
        variables.push(cssVariable);
      }
    }));
    
    const result: FormattedCollection = {
      name: collection.name,
      variables,
      groups
    };
    
    this.collectionCache.set(cacheKey, result);
    return result;
  }

  /**
   * Process a single variable and return formatted CSS variable
   */
  private static async processVariable(variableId: string, collection: any): Promise<CSSVariable | null> {
    const variable = await figma.variables.getVariableByIdAsync(variableId);
    if (!variable) return null;

    const defaultModeId = collection.modes[0].modeId;
    const value = variable.valuesByMode[defaultModeId];
    const formattedName = this.formatVariableName(variable.name);

    const cssValue = this.resolveCSSValue(variable, value, collection);
    if (cssValue === null) return null;

    return {
      name: formattedName,
      value: cssValue,
      originalName: variable.name
    };
  }

  /**
   * Resolve the CSS value for a variable (handles aliases and type formatting)
   */
  private static resolveCSSValue(variable: any, value: any, collection: any): string | null {
    const isAlias = value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
    
    if (isAlias) {
      return this.resolveVariableAlias(value.id);
    }
    
    const pathMatch = variable.name.match(/^([^\/]+)\//);
    const groupName = pathMatch ? pathMatch[1] : undefined;
    return this.formatVariableValue(variable.resolvedType, value, variable.name, collection.name, groupName);
  }

  /**
   * Resolve a variable alias to its CSS reference
   */
  private static resolveVariableAlias(aliasId: string): string | null {
    const referencedVariable = this.variableCache.get(aliasId);
    if (!referencedVariable) return null;
    
    const referencedName = this.formatVariableName(referencedVariable.name);
    return `var(${CSS_VARIABLE_PREFIX}${referencedName})`;
  }

  /**
   * Format variable name to valid CSS custom property name
   */
  private static formatVariableName(name: string): string {
    return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
  }

  /**
   * Build the final export content from processed collections
   */
  private static buildExportContent(collections: FormattedCollection[], format: CSSFormat): string {
    const contentParts: string[] = [];
    
    if (format === 'css') {
      contentParts.push(':root {');
    }

    collections.forEach(collection => {
      contentParts.push(this.buildCollectionContent(collection, format));
    });
    
    if (format === 'css') {
      contentParts.push('}');
    }
    
    return contentParts.join('\n');
  }

  /**
   * Build content for a single collection
   */
  private static buildCollectionContent(collection: FormattedCollection, format: CSSFormat): string {
    const parts: string[] = [];
    const commentPrefix = format === 'scss' ? '//' : '  /*';
    const commentSuffix = format === 'scss' ? '' : ' */';
    
    // Collection header
    parts.push(`\n${commentPrefix} ===== ${collection.name.toUpperCase()} =====${commentSuffix}`);

    // Standalone variables
    collection.variables.forEach(variable => {
      parts.push(this.formatVariableDeclaration(variable, format));
    });
    
    // Grouped variables
    const sortedGroupNames = Object.keys(collection.groups).sort();
    sortedGroupNames.forEach(groupName => {
      const displayName = this.formatGroupDisplayName(groupName);
      parts.push(`\n${commentPrefix} ${displayName}${commentSuffix}`);

      collection.groups[groupName].forEach(variable => {
        parts.push(this.formatVariableDeclaration(variable, format));
      });
    });
    
    return parts.join('\n');
  }

  /**
   * Format a variable declaration for the given format
   */
  private static formatVariableDeclaration(variable: CSSVariable, format: CSSFormat): string {
    if (format === 'scss') {
      return `${SCSS_VARIABLE_PREFIX}${variable.name}: ${variable.value};`;
    }
    return `  ${CSS_VARIABLE_PREFIX}${variable.name}: ${variable.value};`;
  }

  /**
   * Format group name for display
   */
  private static formatGroupDisplayName(groupName: string): string {
    return groupName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Populate the variable cache for alias resolution
   */
  private static async populateVariableCache(collections: any[]): Promise<void> {
    return await ErrorHandler.withErrorHandling(async () => {
      await Promise.all(collections.map(async (collection) => {
        try {
          await Promise.all(collection.variableIds.map(async (variableId: string) => {
            try {
              const variable = await figma.variables.getVariableByIdAsync(variableId);
              if (variable) {
                this.variableCache.set(variable.id, variable);
              }
            } catch (variableError) {
              ErrorHandler.handleError(variableError as Error, {
                operation: `cache_variable_${variableId}`,
                component: 'CSSExportService',
                severity: 'low'
              });
              // Continue caching other variables
            }
          }));
        } catch (collectionError) {
          ErrorHandler.handleError(collectionError as Error, {
            operation: `cache_collection_variables_${collection.name}`,
            component: 'CSSExportService',
            severity: 'medium'
          });
          // Continue processing other collections
        }
      }));
    }, {
      operation: 'populate_variable_cache',
      component: 'CSSExportService',
      severity: 'medium'
    });
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use populateVariableCache instead
   */
  private static async collectAllVariables(collections: any[]): Promise<void> {
    await this.populateVariableCache(collections);
  }

  private static formatVariableValue(type: string, value: any, name: string, collectionName: string, groupName?: string): string | null {
    switch (type) {
      case "COLOR":
        return this.formatColorValue(value);

      case "FLOAT":
        return this.formatFloatValue(value, name, collectionName, groupName);

      case "STRING":
        return this.formatStringValue(value);

      case "BOOLEAN":
        return this.formatBooleanValue(value);

      default:
        return null;
    }
  }

  /**
   * Format color values with proper RGB/RGBA handling
   */
  private static formatColorValue(value: any): string | null {
    if (!value || typeof value !== "object" || !("r" in value) || !("g" in value) || !("b" in value)) {
      return null;
    }

    const color = value as RGB & { a?: number };
    const r = Math.round(color.r * 255);
    const g = Math.round(color.g * 255);
    const b = Math.round(color.b * 255);
    
    // Check if the color has an alpha channel and it's less than 1
    if (typeof color.a === "number" && color.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
    }
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  /**
   * Format float values with appropriate units
   */
  private static formatFloatValue(value: any, name: string, collectionName: string, groupName?: string): string | null {
    if (typeof value !== "number" || isNaN(value)) {
      return null;
    }

    const unit = UnitsService.getUnitForVariable(name, collectionName, groupName);
    return UnitsService.formatValueWithUnit(value, unit);
  }

  /**
   * Format string values with proper quoting
   */
  private static formatStringValue(value: any): string | null {
    if (typeof value !== "string") {
      return null;
    }
    return `"${value}"`;
  }

  /**
   * Format boolean values
   */
  private static formatBooleanValue(value: any): string | null {
    if (typeof value !== "boolean") {
      return null;
    }
    return value ? "true" : "false";
  }

  // Get unit settings data for the settings interface
  static async getUnitSettingsData(): Promise<{
    collections: Array<{name: string, defaultUnit: string, currentUnit: string}>,
    groups: Array<{collectionName: string, groupName: string, defaultUnit: string, currentUnit: string}>
  }> {
    return await ErrorHandler.withErrorHandling(async () => {
      await UnitsService.loadUnitSettings();
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      if (!collections || collections.length === 0) {
        return { collections: [], groups: [] };
      }

      const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
      
      const collectionsData = [];
      const groupsData = [];
      const unitSettings = UnitsService.getUnitSettings();

      await Promise.all(sortedCollections.map(async (collection) => {
        try {
          // Collection data - show actual smart default if no setting exists
          const hasCollectionSetting = unitSettings.collections[collection.name] !== undefined;
          const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : 'Smart defaults';
          const currentUnit = unitSettings.collections[collection.name] || '';
          collectionsData.push({
            name: collection.name,
            defaultUnit,
            currentUnit
          });
          
          // Find all groups in this collection
          const groups = new Set<string>();
          await Promise.all(collection.variableIds.map(async (variableId: string) => {
            try {
              const variable = await figma.variables.getVariableByIdAsync(variableId);
              if (variable) {
                const pathMatch = variable.name.match(/^([^\/]+)\//);
                if (pathMatch) {
                  groups.add(pathMatch[1]);
                }
              }
            } catch (variableError) {
              ErrorHandler.handleError(variableError as Error, {
                operation: `get_variable_for_groups_${variableId}`,
                component: 'CSSExportService',
                severity: 'low'
              });
              // Continue processing other variables
            }
          }));

          // Group data
          Array.from(groups).sort().forEach(groupName => {
            try {
              const groupKey = `${collection.name}/${groupName}`;
              const hasGroupSetting = unitSettings.groups[groupKey] !== undefined;
              const hasCollectionSetting = unitSettings.collections[collection.name] !== undefined;
              
              let defaultUnit: string;
              if (hasGroupSetting) {
                defaultUnit = unitSettings.groups[groupKey];
              } else if (hasCollectionSetting) {
                defaultUnit = `Inherits: ${unitSettings.collections[collection.name]}`;
              } else {
                defaultUnit = 'Smart defaults';
              }
              
              const groupCurrentUnit: string = unitSettings.groups[groupKey] || '';
              groupsData.push({
                collectionName: collection.name,
                groupName,
                defaultUnit,
                currentUnit: groupCurrentUnit
              });
            } catch (groupError) {
              ErrorHandler.handleError(groupError as Error, {
                operation: `process_group_${groupName}`,
                component: 'CSSExportService',
                severity: 'low'
              });
              // Continue processing other groups
            }
          });
        } catch (collectionError) {
          ErrorHandler.handleError(collectionError as Error, {
            operation: `get_unit_settings_for_collection_${collection.name}`,
            component: 'CSSExportService',
            severity: 'medium'
          });
          // Continue processing other collections
        }
      }));
      
      return { collections: collectionsData, groups: groupsData };
    }, {
      operation: 'get_unit_settings_data',
      component: 'CSSExportService',
      severity: 'medium'
    });
  }

  // Update unit settings
  static updateUnitSettings(settings: {collections?: {[key: string]: string}, groups?: {[key: string]: string}}): void {
    UnitsService.updateUnitSettings(settings);
  }

  // Save unit settings
  static async saveUnitSettings(): Promise<void> {
    await UnitsService.saveUnitSettings();
  }
}