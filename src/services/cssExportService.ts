import { VariableCollection } from '../types';

export class CSSExportService {
  private static allVariables = new Map<string, any>();

  static async exportVariables(): Promise<string> {
    try {
      // Clear cache
      this.allVariables.clear();

      // Get all variable collections
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      // First pass: collect all variables for reference lookup
      await this.collectAllVariables(collections);

      // Build CSS content with actual collection structure
      let cssContent = ":root {\n";
      
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
              cssValue = `var(--${referencedName})`;
            } else {
              continue;
            }
          } else {
            const formattedValue = this.formatVariableValue(variable.resolvedType, value, variable.name);
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
          cssContent += `\n  /* ===== ${collection.name.toUpperCase()} ===== */\n`;
          
          // Add standalone variables first
          collectionVariables.forEach((variable: any) => {
            cssContent += `  --${variable.name}: ${variable.value};\n`;
          });
          
          // Add grouped variables with subheadings
          groupedVariables.forEach((variables, groupName) => {
            if (variables.length > 0) {
              const displayName = groupName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
              cssContent += `\n  /* ${displayName} */\n`;
              variables.forEach((variable: any) => {
                cssContent += `  --${variable.name}: ${variable.value};\n`;
              });
            }
          });
        }
      }

      cssContent += "}\n";

      return cssContent;
    } catch (error: any) {
      console.error("Error exporting CSS:", error);
      throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
    }
  }

  // Collect all variables for resolution purposes
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



  private static formatVariableValue(type: string, value: any, name: string): string | null {
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
          // Add 'px' unit for size-related values
          if (
            name.toLowerCase().includes("size") ||
            name.toLowerCase().includes("padding") ||
            name.toLowerCase().includes("margin") ||
            name.toLowerCase().includes("radius") ||
            name.toLowerCase().includes("gap") ||
            name.toLowerCase().includes("stroke")
          ) {
            return `${value}px`;
          }
          return String(value);
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

}