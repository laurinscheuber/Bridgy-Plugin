import { VariableCollection } from '../types';

export class CSSExportService {
  static async exportVariables(): Promise<string> {
    try {
      // Get all variable collections
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      let cssContent = "/* Figma Variables Export */\n";
      cssContent += `/* Generated: ${new Date().toLocaleString()} */\n\n`;
      cssContent += ":root {\n";

      // Process each collection
      for (const collection of collections) {
        let hasValidVariables = false;
        let collectionContent = `  /* ${collection.name} */\n`;

        // Get all variables in the collection
        for (const variableId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) continue;

          // Get the default mode (first mode)
          const defaultModeId = collection.modes[0].modeId;
          const value = variable.valuesByMode[defaultModeId];

          // Skip variables that reference other variables
          if (
            value &&
            typeof value === "object" &&
            "type" in value &&
            value.type === "VARIABLE_ALIAS"
          ) {
            continue;
          }

          // Format the variable name (replace spaces and special characters)
          const formattedName = variable.name
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();

          // Format the value based on the variable type
          const formattedValue = this.formatVariableValue(variable.resolvedType, value, variable.name);
          if (formattedValue === null) continue;

          // Add the CSS variable
          collectionContent += `  --${formattedName}: ${formattedValue};\n`;
          hasValidVariables = true;
        }

        // Only add the collection content if it has valid variables
        if (hasValidVariables) {
          cssContent += collectionContent + "\n";
        }
      }

      // Close the root selector
      cssContent += "}\n\n";

      // Add media query for dark mode if needed
      cssContent += "@media (prefers-color-scheme: dark) {\n";
      cssContent += "  :root {\n";
      cssContent += "    /* Dark mode overrides can be added here */\n";
      cssContent += "  }\n";
      cssContent += "}\n";

      // Add usage examples and documentation
      cssContent += this.addUsageExamples();

      return cssContent;
    } catch (error: any) {
      console.error("Error exporting CSS:", error);
      throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
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
          const color = value as RGB;
          return `rgb(${Math.round(color.r * 255)}, ${Math.round(
            color.g * 255
          )}, ${Math.round(color.b * 255)})`;
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

  private static addUsageExamples(): string {
    return `/* ---------------------------------------------------------- */
/* Usage Examples */
/* ---------------------------------------------------------- */

/* Example usage of variables */
.example-element {
  color: var(--primary-color);
  background-color: var(--background-color);
  padding: var(--spacing-medium);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}
`;
  }
} 