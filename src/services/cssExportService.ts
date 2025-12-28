import { VariableCollection } from '../types';
import { UnitsService } from './unitsService';
import { ErrorHandler } from '../utils/errorHandler';
import { TailwindV4Service } from './tailwindV4Service';

// Constants for better maintainability
const CSS_VARIABLE_PREFIX = '--';
const SCSS_VARIABLE_PREFIX = '$';
const DEFAULT_FORMAT = 'css' as const;

// Types for internal use
interface CSSVariable {
  name: string;
  value: string;
  originalName: string;
  modes?: { [modeName: string]: string } | null; // Support for multiple modes (themes)
}

interface GroupedVariables {
  [groupName: string]: CSSVariable[];
}

interface FormattedCollection {
  name: string;
  variables: CSSVariable[];
  groups: GroupedVariables;
}

export type CSSFormat = 'css' | 'scss' | 'tailwind-v4';

export class CSSExportService {
  private static readonly variableCache = new Map<string, any>();
  private static readonly collectionCache = new Map<string, FormattedCollection>();

  /**
   * Export variables in the specified format (CSS, SCSS, or Tailwind v4)
   */
  static async exportVariables(format: CSSFormat = DEFAULT_FORMAT): Promise<string> {
    return await ErrorHandler.withErrorHandling(async () => {
      // Validate format
      const validFormats = ['css', 'scss', 'tailwind-v4'];
      if (validFormats.indexOf(format.toLowerCase()) === -1) {
        throw new Error(`Invalid export format: ${format}. Must be 'css', 'scss', or 'tailwind-v4'.`);
      }

      // For Tailwind v4, validate namespaces first
      if (format === 'tailwind-v4') {
        const validation = await TailwindV4Service.validateVariableGroups();
        if (!validation.isValid) {
          throw new Error(
            `Cannot export to Tailwind v4 format. Invalid variable group namespaces: ${validation.invalidGroups.join(', ')}. ` +
            `All variable groups must use valid Tailwind v4 namespaces (e.g., color, spacing, radius).`
          );
        }
      }

      await this.initialize();
      await this.initialize();
      const collections = await this.getProcessedCollections();
      
      let css = '';
      
      // Export Variables
      if (collections && collections.length > 0) {
        css += this.buildExportContent(collections, format);
      }
      
      // Export Styles (Text, Paint, Effect, Grid)
      if (format !== 'tailwind-v4') { // Skip styles for tailwind-v4 for now or implement later
         css += await this.buildStylesContent(format);
      }
      
      if (!css) {
        throw new Error('No variables or styles found to export.');
      }

      return css;
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

    const formattedName = this.formatVariableName(variable.name);
    
    // Process all modes, not just the first one
    const modes: { [modeName: string]: string } = {};
    const hasMultipleModes = collection.modes.length > 1;
    
    for (const mode of collection.modes) {
      const value = variable.valuesByMode[mode.modeId];
      const cssValue = this.resolveCSSValue(variable, value, collection);
      if (cssValue !== null) {
        modes[mode.name] = cssValue;
      }
    }
    
    if (Object.keys(modes).length === 0) {
      return null;
    }

    return {
      name: formattedName,
      value: modes[collection.modes[0].name], // Default value (for :root)
      modes: hasMultipleModes ? modes : null, // All mode values
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

  // Helper: Round to max 2 decimal places to avoid excessive precision
  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // Helper: Map Figma font style to CSS font-weight
  private static mapFontWeight(style: string): string | number {
    const lowerStyle = style.toLowerCase();
    if (lowerStyle.includes('thin') || lowerStyle.includes('hairline')) return 100;
    if (lowerStyle.includes('extra light') || lowerStyle.includes('extralight')) return 200;
    if (lowerStyle.includes('light')) return 300;
    if (lowerStyle.includes('normal') || lowerStyle.includes('regular')) return 400;
    if (lowerStyle.includes('medium')) return 500;
    if (lowerStyle.includes('semi bold') || lowerStyle.includes('semibold')) return 600;
    if (lowerStyle.includes('bold')) return 700;
    if (lowerStyle.includes('extra bold') || lowerStyle.includes('extrabold')) return 800;
    if (lowerStyle.includes('black') || lowerStyle.includes('heavy')) return 900;
    return 400; // Default
  }
  
  // Helper: Sanitize variable names
  private static sanitizeName(name: string): string {
    // Remove common URL prefixes that might appear in import names
    let cleanName = name.replace(/^(www\.|https?:\/\/)?(figma\.com\/)?/, '');
    
    // Replace invalid characters with hyphens
    cleanName = cleanName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
    
    // Remove duplicate hyphens
    cleanName = cleanName.replace(/-+/g, '-');
    
    // Remove leading/trailing hyphens
    return cleanName.replace(/^-+|-+$/g, '');
  }

  /**
   * Format variable name to valid CSS custom property name
   */
  private static formatVariableName(name: string): string {
    return this.sanitizeName(name);
  }

  /**
   * Build the final export content from processed collections
   */
  private static buildExportContent(collections: FormattedCollection[], format: CSSFormat): string {
    // Handle Tailwind v4 format separately
    if (format === 'tailwind-v4') {
      return TailwindV4Service.buildTailwindV4CSS(collections);
    }
    
    const contentParts: string[] = [];
    
    // Check if any variables have multiple modes
    const hasMultiModeVariables = collections.some(collection => 
      collection.variables.some(variable => variable.modes !== null) ||
      Object.keys(collection.groups).some(groupKey => 
        collection.groups[groupKey].some(variable => variable.modes !== null)
      )
    );
    
    if (format === 'css') {
      contentParts.push(':root {');
      collections.forEach(collection => {
        contentParts.push(this.buildCollectionContent(collection, format, false));
      });
      contentParts.push('}');
      
      // If there are multi-mode variables, generate data-theme selectors
      if (hasMultiModeVariables) {
        const allModeNames = this.getAllModeNames(collections);
        allModeNames.slice(1).forEach((modeName) => {
          contentParts.push(`\n[data-theme="${modeName}"] {`);
          collections.forEach(collection => {
            contentParts.push(this.buildCollectionContent(collection, format, true, modeName));
          });
          contentParts.push('}');
        });
      }
    } else {
      // SCSS format - keep original behavior for now
      collections.forEach(collection => {
        contentParts.push(this.buildCollectionContent(collection, format, false));
      });
    }
    
    return contentParts.join('\n');
  }

  /**
   * Build content for styles (Paint, Text, Effect, Grid)
   */
  private static async buildStylesContent(format: CSSFormat): Promise<string> {
      const parts: string[] = [];
      const commentPrefix = format === 'scss' ? '//' : '  /*';
      const commentSuffix = format === 'scss' ? '' : ' */';
      
      parts.push(`\n${commentPrefix} ===== STYLES =====${commentSuffix}`);
      if (format === 'css') parts.push(':root {');

      // Track used names to prevent duplicates
      const usedNames = new Set<string>();

      // Paint Styles
      const paintStyles = await figma.getLocalPaintStylesAsync();
      if (paintStyles.length > 0) {
          parts.push(`\n${commentPrefix} Colors${commentSuffix}`);
          paintStyles.forEach(style => {
              const baseName = this.formatVariableName(style.name);
              // Handle duplicates
              let name = baseName;
              let i = 1;
              while(usedNames.has(name)) {
                  name = `${baseName}-${i++}`;
              }
              usedNames.add(name);

              const paint = style.paints[0];
              if (paint) {
                  const val = this.formatPaintValue(paint);
                  if (val) parts.push(`  ${CSS_VARIABLE_PREFIX}color-${name}: ${val};`);
              }
          });
      }

      // Text Styles
      const textStyles = await figma.getLocalTextStylesAsync();
      if (textStyles.length > 0) {
          parts.push(`\n${commentPrefix} Typography${commentSuffix}`);
          textStyles.forEach(style => {
             const baseName = this.formatVariableName(style.name);
             // Unique names for text styles are tricky because they generate multiple variables.
             // We'll rely on baseName being reasonably unique or just overwrite.
             
             parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-family: "${style.fontName.family}";`);
             parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-size: ${this.round(style.fontSize)}px;`);
             parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-weight: ${this.mapFontWeight(style.fontName.style)};`);
             if (style.lineHeight && style.lineHeight.unit !== 'AUTO') {
                 const lh = style.lineHeight.unit === 'PIXELS' 
                    ? `${this.round(style.lineHeight.value)}px` 
                    : this.round(style.lineHeight.value);
                 parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-line-height: ${lh};`);
             }
             if (style.letterSpacing && style.letterSpacing.unit === 'PIXELS') {
                 parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-letter-spacing: ${this.round(style.letterSpacing.value)}px;`);
             }
          });
      }

      // Effect Styles
      const effectStyles = await figma.getLocalEffectStylesAsync();
      if (effectStyles.length > 0) {
          parts.push(`\n${commentPrefix} Effects${commentSuffix}`);
          effectStyles.forEach(style => {
              const name = this.formatVariableName(style.name);
              const val = this.formatEffectsValue(style.effects);
              if (val) parts.push(`  ${CSS_VARIABLE_PREFIX}effect-${name}: ${val};`);
          });
      }
      
      // Grid Styles
      const gridStyles = await figma.getLocalGridStylesAsync();
      if (gridStyles.length > 0) {
          parts.push(`\n${commentPrefix} Grids${commentSuffix}`);
          gridStyles.forEach(style => {
              const name = this.formatVariableName(style.name);
              const val = this.formatGridsValue(style.layoutGrids);
              if (val) parts.push(`  ${CSS_VARIABLE_PREFIX}grid-${name}: ${val};`);
          });
      }

      if (format === 'css') parts.push('}');
      return parts.join('\n');
  }

  private static formatPaintValue(paint: Paint): string | null {
      if (paint.type === 'SOLID') {
          const { r, g, b } = paint.color;
           const a = paint.opacity !== undefined ? paint.opacity : 1;
           if (a >= 1) {
             return `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
           }
           return `rgba(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)}, ${this.round(a)})`;
      } else if (paint.type === 'GRADIENT_LINEAR') {
          // TODO: Implement cleaner gradient export
          return 'linear-gradient(...)'; 
      }
      return null;
  }
  
  private static formatEffectsValue(effects: readonly Effect[]): string | null {
      return effects.map(effect => {
          if (effect.type === 'DROP_SHADOW' || effect.type === 'INNER_SHADOW') {
              const { r, g, b, a } = effect.color;
              const inset = effect.type === 'INNER_SHADOW' ? 'inset ' : '';
              const blur = this.round(effect.radius);
              const spread = effect.spread ? this.round(effect.spread) : 0;
              const x = this.round(effect.offset.x);
              const y = this.round(effect.offset.y);
              return `${inset}${x}px ${y}px ${blur}px ${spread}px rgba(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)}, ${this.round(a)})`;
          } else if (effect.type === 'LAYER_BLUR') {
              return `blur(${this.round(effect.radius)}px)`;
          }
          return null;
      }).filter(Boolean).join(', ');
  }
  
  private static formatGridsValue(grids: readonly LayoutGrid[]): string | null {
      return grids.map(grid => {
         if (grid.pattern === 'COLUMNS') {
             return `columns(${grid.count}, ${this.round(grid.gutterSize)}px)`;
         } else if (grid.pattern === 'ROWS') {
             return `rows(${grid.count}, ${this.round(grid.gutterSize)}px)`; 
         } else if (grid.pattern === 'GRID') {
             return `grid(${this.round(grid.sectionSize)}px)`;
         }
         return null;
      }).filter(Boolean).join(', ');
  }


  /**
   * Build content for a single collection
   */
  private static buildCollectionContent(collection: FormattedCollection, format: CSSFormat, isThemeSpecific: boolean = false, themeName: string | null = null): string {
    const parts: string[] = [];
    const commentPrefix = format === 'scss' ? '//' : '  /*';
    const commentSuffix = format === 'scss' ? '' : ' */';
    
    // Collection header
    if (!isThemeSpecific) {
      parts.push(`\n${commentPrefix} ===== ${collection.name.toUpperCase()} =====${commentSuffix}`);
    }

    // Standalone variables
    collection.variables.forEach(variable => {
      const declaration = this.formatVariableDeclaration(variable, format, isThemeSpecific, themeName);
      if (declaration && declaration.trim()) {
        parts.push(declaration);
      }
    });

    // Grouped variables
    const sortedGroupNames = Object.keys(collection.groups).sort();
    sortedGroupNames.forEach(groupName => {
      const displayName = this.formatGroupDisplayName(groupName);
      if (!isThemeSpecific) {
        parts.push(`\n${commentPrefix} ${displayName}${commentSuffix}`);
      }
      
      collection.groups[groupName].forEach(variable => {
        const declaration = this.formatVariableDeclaration(variable, format, isThemeSpecific, themeName);
        if (declaration && declaration.trim()) {
          parts.push(declaration);
        }
      });
    });

    return parts.join('\n');
  }

  /**
   * Format a variable declaration for the given format
   */
  private static formatVariableDeclaration(variable: CSSVariable, format: CSSFormat, isThemeSpecific: boolean = false, themeName: string | null = null): string {
    let value = variable.value;
    
    // For theme-specific declarations, use the value for that specific theme
    if (isThemeSpecific && variable.modes && themeName && variable.modes[themeName]) {
      value = variable.modes[themeName];
    } else if (isThemeSpecific && (!variable.modes || !variable.modes[themeName])) {
      // Skip variables that don't have this theme mode
      return '';
    }
    
    if (format === 'scss') {
      return `${SCSS_VARIABLE_PREFIX}${variable.name}: ${value};`;
    }
    return `  ${CSS_VARIABLE_PREFIX}${variable.name}: ${value};`;
  }

  /**
   * Format group name for display
   */
  private static formatGroupDisplayName(groupName: string): string {
    return groupName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get all unique mode names from collections
   */
  private static getAllModeNames(collections: FormattedCollection[]): string[] {
    const modeNames = new Set<string>();
    
    collections.forEach(collection => {
      collection.variables.forEach(variable => {
        if (variable.modes) {
          Object.keys(variable.modes).forEach(modeName => modeNames.add(modeName));
        }
      });
      
      Object.keys(collection.groups).forEach(groupKey => {
        collection.groups[groupKey].forEach(variable => {
          if (variable.modes) {
            Object.keys(variable.modes).forEach(modeName => modeNames.add(modeName));
          }
        });
      });
    });
    
    return Array.from(modeNames).sort();
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
      return `rgba(${r}, ${g}, ${b}, ${this.round(color.a)})`;
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
    const formattedVal = this.round(value);
    return UnitsService.formatValueWithUnit(formattedVal, unit);
  }

  /**
   * Format string values with proper quoting
   */
  private static formatStringValue(value: any): string | null {
    if (typeof value !== "string") {
      return null;
    }
    // Remove extra quotes if they exist in the value already
    const cleanValue = value.replace(/^['"]|['"]$/g, '');
    return `"${cleanValue}"`;
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
          const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : UnitsService.getDefaultUnit(collection.name);
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
                defaultUnit = UnitsService.getDefaultUnit(groupName);
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

  // Get Tailwind v4 validation status
  static async getTailwindV4ValidationStatus(): Promise<{
    isValid: boolean;
    groups: Array<{name: string; isValid: boolean; namespace?: string; variableCount: number}>;
    invalidGroups: string[];
  }> {
    return await TailwindV4Service.validateVariableGroups();
  }
}