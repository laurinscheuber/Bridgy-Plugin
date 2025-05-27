import { VariableCollectionData } from '../../shared/types';
import { formatCSSVariableName, rgbaToHex } from '../../shared/utils';

/**
 * Generates CSS from Figma variables
 */
export class CSSGenerator {
  /**
   * Generates CSS content from variable collections
   */
  static async generate(collections: VariableCollectionData[]): Promise<string> {
    let cssContent = "/* Figma Variables Export */\n";
    cssContent += `/* Generated: ${new Date().toLocaleString()} */\n\n`;

    // Create separate sections for base tokens and semantic tokens
    let baseTokensContent = "";
    let semanticTokensContent = "\n  /* Semantic Variables */\n";

    cssContent += ":root {\n";

    // Process each collection
    const processedCollections = new Set();

    for (const collection of collections) {
      let hasValidVariables = false;

      // Add minimal collection header to base tokens section if not already added
      if (!processedCollections.has(collection.name)) {
        baseTokensContent += `\n  /* ${collection.name} */\n`;
        processedCollections.add(collection.name);
      }

      // Get all variables in the collection
      for (const variable of collection.variables) {
        const variableFromFigma = await figma.variables.getVariableByIdAsync(variable.id);
        if (!variableFromFigma) continue;

        // Get the default mode value
        const defaultModeId = Object.keys(variableFromFigma.valuesByMode)[0];
        const value = variableFromFigma.valuesByMode[defaultModeId];

        // Handle variable aliases (references to other variables)
        if (
          value &&
          typeof value === "object" &&
          "type" in value &&
          value.type === "VARIABLE_ALIAS"
        ) {
          const semanticVar = await this.handleVariableAlias(
            variableFromFigma,
            collection.name,
            value.id
          );
          if (semanticVar) {
            semanticTokensContent += semanticVar;
            hasValidVariables = true;
          }
          continue;
        }

        // Format the CSS variable
        const cssVar = this.formatVariable(
          collection.name,
          variableFromFigma.name,
          value,
          variableFromFigma.resolvedType
        );

        if (cssVar) {
          baseTokensContent += cssVar;
          hasValidVariables = true;
        }
      }
    }

    // Combine the base tokens and semantic tokens
    cssContent += baseTokensContent + "\n";
    cssContent += semanticTokensContent;

    // Close the root selector
    cssContent += "}\n\n";

    // Add media query for dark mode if needed
    cssContent += "@media (prefers-color-scheme: dark) {\n";
    cssContent += "  :root {\n";
    cssContent += "    /* Dark mode overrides can be added here */\n";
    cssContent += "  }\n";
    cssContent += "}\n";

    return cssContent;
  }

  /**
   * Handles variable aliases (semantic tokens)
   */
  private static async handleVariableAlias(
    variable: Variable,
    collectionName: string,
    referencedVariableId: string
  ): Promise<string | null> {
    const referencedVariable = await figma.variables.getVariableByIdAsync(referencedVariableId);
    if (!referencedVariable) return null;

    const referencedVarCollection = await figma.variables.getVariableCollectionByIdAsync(
      referencedVariable.variableCollectionId
    );
    if (!referencedVarCollection) return null;

    // Create the full reference path with collection name prefix
    const referencedVarName = formatCSSVariableName(
      referencedVarCollection.name,
      referencedVariable.name
    );

    // Format the current variable name
    const fullVarName = formatCSSVariableName(collectionName, variable.name);

    return `  ${fullVarName}: var(${referencedVarName});\n`;
  }

  /**
   * Formats a single variable to CSS
   */
  private static formatVariable(
    collectionName: string,
    variableName: string,
    value: any,
    variableType: string
  ): string | null {
    const cssVarName = formatCSSVariableName(collectionName, variableName);
    let formattedValue = "";

    if (variableType === "COLOR") {
      if (
        value &&
        typeof value === "object" &&
        "r" in value &&
        "g" in value &&
        "b" in value
      ) {
        const color = value as RGB;
        formattedValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(
          color.g * 255
        )}, ${Math.round(color.b * 255)})`;
      } else {
        return null; // Skip invalid color values
      }
    } else if (variableType === "FLOAT") {
      if (typeof value === "number" && !isNaN(value)) {
        // Add 'px' unit for size-related values
        if (this.isSizeValue(variableName)) {
          formattedValue = `${value}px`;
        } else {
          formattedValue = String(value);
        }
      } else {
        return null; // Skip invalid float values
      }
    } else if (variableType === "STRING") {
      if (typeof value === "string") {
        formattedValue = `"${value}"`;
      } else {
        return null; // Skip invalid string values
      }
    } else if (variableType === "BOOLEAN") {
      if (typeof value === "boolean") {
        formattedValue = value ? "true" : "false";
      } else {
        return null; // Skip invalid boolean values
      }
    } else {
      return null; // Skip unknown types
    }

    return `  ${cssVarName}: ${formattedValue};\n`;
  }

  /**
   * Checks if a variable name indicates a size-related value
   */
  private static isSizeValue(variableName: string): boolean {
    const sizeKeywords = ["size", "padding", "margin", "radius", "gap", "stroke"];
    const lowerName = variableName.toLowerCase();
    return sizeKeywords.some(keyword => lowerName.includes(keyword));
  }
}