import { VariableCollection } from '../types';
import { UnitsService } from './unitsService';

export class CSSExportService {
  private static allVariables = new Map<string, any>();

  static async exportVariables(format: 'css' | 'scss' = 'css'): Promise<string> {
    try {
      // Clear cache
      this.allVariables.clear();

      // Load unit settings
      await UnitsService.loadUnitSettings();

      // Get all variable collections
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      // First pass: collect all variables for reference lookup
      await this.collectAllVariables(collections);

      // Build content with actual collection structure
      let content = format === 'scss' ? '' : ':root {\n';
      
      // Sort collections alphabetically by name
      const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
      
      // Process each collection exactly as it appears in Figma
      for (const collection of sortedCollections) {
        const collectionVariables = [];
        const groupedVariables = new Map<string, any[]>();
        
        for (const variableId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) continue;

          const defaultModeId = collection.modes[0].modeId;
          const value = variable.valuesByMode[defaultModeId];
          const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

          let cssValue: string;
          const isAlias = value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
          
          if (isAlias) {
            const referencedVariable = this.allVariables.get(value.id);
            if (referencedVariable) {
              const referencedName = referencedVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
              cssValue = format === 'scss' ? `$${referencedName}` : `var(--${referencedName})`;
            } else {
              continue;
            }
          } else {
            const pathMatch = variable.name.match(/^([^\/]+)\//);
            const groupName = pathMatch ? pathMatch[1] : undefined;
            const formattedValue = this.formatVariableValue(variable.resolvedType, value, variable.name, collection.name, groupName);
            if (formattedValue === null) continue;
            cssValue = formattedValue;
          }

          const cssVariable = {
            name: formattedName,
            value: cssValue,
            originalName: variable.name
          };

          // Group by prefix if contains /
          const pathMatch = variable.name.match(/^([^\/]+)\//);
          if (pathMatch) {
            const prefix = pathMatch[1];
            if (!groupedVariables.has(prefix)) {
              groupedVariables.set(prefix, []);
            }
            groupedVariables.get(prefix)!.push(cssVariable);
          } else {
            collectionVariables.push(cssVariable);
          }
        }
        
        // Add collection section if it has variables
        if (collectionVariables.length > 0 || groupedVariables.size > 0) {
          content += `\n${format === 'scss' ? '//' : '  /*'} ===== ${collection.name.toUpperCase()} ===== ${format === 'scss' ? '' : '*/'}\n`;
          
          // Add standalone variables first
          collectionVariables.forEach((variable: any) => {
            if (format === 'scss') {
              content += `$${variable.name}: ${variable.value};\n`;
            } else {
              content += `  --${variable.name}: ${variable.value};\n`;
            }
          });
          
          // Add grouped variables with subheadings
          groupedVariables.forEach((variables, groupName) => {
            if (variables.length > 0) {
              const displayName = groupName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              content += `\n${format === 'scss' ? '//' : '  /*'} ${displayName} ${format === 'scss' ? '' : '*/'}\n`;
              variables.forEach((variable: any) => {
                if (format === 'scss') {
                  content += `$${variable.name}: ${variable.value};\n`;
                } else {
                  content += `  --${variable.name}: ${variable.value};\n`;
                }
              });
            }
          });
        }
      }

      if (format === 'css') {
        content += "}\n";
      }

      return content;
    } catch (error: any) {
      console.error("Error exporting CSS:", error);
      throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
    }
  }

  private static async collectAllVariables(collections: any[]): Promise<void> {
    for (const collection of collections) {
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          this.allVariables.set(variable.id, variable);
        }
      }
    }
  }


  private static formatVariableValue(type: string, value: any, name: string, collectionName: string, groupName?: string): string | null {
    switch (type) {
      case "COLOR":
        if (
          value &&
          typeof value === "object" &&
          "r" in value &&
          "g" in value &&
          "b" in value
        ) {
          const color = value as RGB & { a?: number };
          const r = Math.round(color.r * 255);
          const g = Math.round(color.g * 255);
          const b = Math.round(color.b * 255);
          
          // Check if the color has an alpha channel and it's less than 1
          if (typeof color.a === "number" && color.a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
          }
          
          // Regular RGB color without transparency
          return `rgb(${r}, ${g}, ${b})`;
        }
        return null;

      case "FLOAT":
        if (typeof value === "number" && !isNaN(value)) {
          const unit = UnitsService.getUnitForVariable(name, collectionName, groupName);
          return UnitsService.formatValueWithUnit(value, unit);
        }
        return null;

      case "STRING":
        if (typeof value === "string") {
          return `"${value}"`;
        }
        return null;

      case "BOOLEAN":
        if (typeof value === "boolean") {
          return value ? "true" : "false";
        }
        return null;

      default:
        return null;
    }
  }

  // Get unit settings data for the settings interface
  static async getUnitSettingsData(): Promise<{
    collections: Array<{name: string, defaultUnit: string, currentUnit: string}>,
    groups: Array<{collectionName: string, groupName: string, defaultUnit: string, currentUnit: string}>
  }> {
    await UnitsService.loadUnitSettings();
    const collections = await figma.variables.getLocalVariableCollectionsAsync();
    const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
    
    const collectionsData = [];
    const groupsData = [];
    const unitSettings = UnitsService.getUnitSettings();
    
    for (const collection of sortedCollections) {
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
      for (const variableId of collection.variableIds) {
        const variable = await figma.variables.getVariableByIdAsync(variableId);
        if (variable) {
          const pathMatch = variable.name.match(/^([^\/]+)\//);
          if (pathMatch) {
            groups.add(pathMatch[1]);
          }
        }
      }
      
      // Group data
      for (const groupName of Array.from(groups).sort()) {
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
      }
    }
    
    return { collections: collectionsData, groups: groupsData };
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