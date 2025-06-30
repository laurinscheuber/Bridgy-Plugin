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

      // Categorize variables by type and purpose (matching UI logic)
      const categorizedVariables: any = {
        // Definition variables (base tokens)
        colorPalette: [],
        radius: [],
        padding: [],
        spacing: [],
        sizing: [],
        opacity: [],
        typography: [],
        colorScheme: [],
        other: [],
        
        // Component variables (comes last)
        components: []
      };

      // Process each collection and categorize variables
      for (const collection of collections) {
        for (const variableId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) continue;

          const defaultModeId = collection.modes[0].modeId;
          const value = variable.valuesByMode[defaultModeId];
          const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();

          // Use same categorization logic as UI
          const category = this.categorizeVariableByPurpose(variable, collection);

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

          categorizedVariables[category].push({
            name: formattedName,
            value: cssValue
          });
        }
      }

      // Build structured CSS content in same order as UI
      let cssContent = ":root {\n";
      
      // Definition sections first (same order as UI)
      const definitionSections = [
        { key: 'colorPalette', title: 'Color Palette' },
        { key: 'radius', title: 'Border Radius' },
        { key: 'padding', title: 'Padding' },
        { key: 'spacing', title: 'Spacing' },
        { key: 'sizing', title: 'Sizing' },
        { key: 'opacity', title: 'Opacity' },
        { key: 'typography', title: 'Typography' },
        { key: 'colorScheme', title: 'Color Scheme' },
        { key: 'other', title: 'Other' }
      ];

      definitionSections.forEach(section => {
        if (categorizedVariables[section.key].length > 0) {
          cssContent += this.buildVariableSection(categorizedVariables[section.key], section.title);
        }
      });

      // Component variables last
      if (categorizedVariables.components.length > 0) {
        cssContent += this.buildVariableSection(categorizedVariables.components, "Component Variables");
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

  // Categorize variables by their purpose and type (same logic as UI)
  private static categorizeVariableByPurpose(variable: any, collection: any): string {
    const name = variable.name.toLowerCase();
    
    // Component variables (must contain component-specific keywords with "/" separator)
    if ((name.includes("button/") || name.includes("card/") || name.includes("modal/") || 
        name.includes("input/") || name.includes("form/") || name.includes("nav/") ||
        name.includes("header/") || name.includes("footer/") || name.includes("sidebar/") ||
        name.includes("widget/") || name.includes("dropdown/") || name.includes("label/") ||
        name.includes("increment/") || name.includes("functional/") || name.includes("icon/") ||
        name.includes("ghost/") || name.includes("delete/")) ||
        // Also catch component names at the start with specific patterns
        (name.match(/^(primary|secondary|teritary|delete|functional)-(button|icon|ghost|dropdown)/))) {
      return "components";
    }
    
    // Definition variables by type
    if (variable.resolvedType === "COLOR") {
      // Check if it's a semantic color or base palette color
      // We check the default mode value specifically (consistent with processing)
      const defaultModeId = collection.modes[0].modeId;
      const defaultValue = variable.valuesByMode[defaultModeId];
      const hasAlias = defaultValue && typeof defaultValue === "object" && defaultValue.type === "VARIABLE_ALIAS";
      
      // If it has an alias (references another variable), it goes to Color Scheme regardless of name
      if (hasAlias) {
        return "colorScheme";
      }
      
      // Base palette colors (only direct values, no aliases)
      const isBasePaletteColor = name.match(/^(gray|grey|red|blue|green|yellow|orange|purple|magenta|cyan|pink|brown|ultramarine|darkblue)([\/\-]|$)/) ||
                               name.match(/^monochrome[\/\-](white|black)$/);
      
      // Semantic color patterns
      const isSemanticColor = name === 'white' || name === 'black' ||
                             ['background', 'primary-color', 'secondary', 'teritary', 'critical'].some(keyword => 
                             name === keyword || name.startsWith(keyword + '-') || name.endsWith('-' + keyword)) ||
                             name.includes('-text') || name.includes('text-') ||
                             (name.includes('primary') && !name.includes('/')) ||
                             (name.includes('secondary') && !name.includes('/')) ||
                             (name.includes('teritary') && !name.includes('/'));
      
      if (isSemanticColor) {
        return "colorScheme";
      } else if (isBasePaletteColor) {
        return "colorPalette";
      } else {
        return "colorPalette";
      }
    }
    
    if (variable.resolvedType === "FLOAT") {
      if (name.includes("radius")) return "radius";
      if (name.includes("padding")) return "padding";
      if (name.includes("spacing") || name.includes("gap") || name.includes("margin")) return "spacing";
      if (name.includes("size") || name.includes("width") || name.includes("height")) return "sizing";
      if (name.includes("opacity")) return "opacity";
    }
    
    if (variable.resolvedType === "STRING") {
      if (name.includes("font") || name.includes("text") || name.includes("weight") || 
          name.includes("style") || name.startsWith("weight-") || name.startsWith("wieght-")) return "typography";
    }

    if (variable.resolvedType === "BOOLEAN") {
      return "other";
    }
    
    return "other";
  }

  // Build a variable section with clean formatting
  private static buildVariableSection(variables: any[], sectionName: string): string {
    if (variables.length === 0) {
      return "";
    }
    
    let content = `\n  /* ===== ${sectionName.toUpperCase()} ===== */\n`;
    
    variables.forEach((variable: any) => {
      content += `  --${variable.name}: ${variable.value};\n`;
    });
    
    return content;
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