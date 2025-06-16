// testColorTransparency.js
// Test helper to demonstrate transparent color handling in CSSExportService

// Mock the Figma API
global.figma = {
  variables: {
    getLocalVariableCollectionsAsync: async () => {
      return [
        {
          name: "Colors",
          modes: [{ modeId: "mode1", name: "Default" }],
          variableIds: ["color1", "color2", "color3"]
        }
      ];
    },
    getVariableByIdAsync: async (id) => {
      const variables = {
        "color1": {
          name: "Primary Color",
          resolvedType: "COLOR",
          valuesByMode: { 
            "mode1": { r: 0.2, g: 0.4, b: 0.8, a: 1 } 
          }
        },
        "color2": {
          name: "Secondary Color Transparent",
          resolvedType: "COLOR",
          valuesByMode: { 
            "mode1": { r: 0.8, g: 0.2, b: 0.4, a: 0.5 } 
          }
        },
        "color3": {
          name: "Tertiary Color Semitransparent",
          resolvedType: "COLOR",
          valuesByMode: { 
            "mode1": { r: 0.3, g: 0.7, b: 0.1, a: 0.75 } 
          }
        }
      };
      return variables[id];
    }
  }
};

// Import the CSSExportService
const CSSExportService = {
  exportVariables: async function() {
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
      cssContent += "}\n";

      return cssContent;
    } catch (error) {
      console.error("Error exporting CSS:", error);
      throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
    }
  },

  formatVariableValue: function(type, value, name) {
    switch (type) {
      case "COLOR":
        if (
          value &&
          typeof value === "object" &&
          "r" in value &&
          "g" in value &&
          "b" in value
        ) {
          const color = value;
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
};

// Run the test
async function runTest() {
  try {
    console.log("Testing CSSExportService color transparency handling...\n");
    const css = await CSSExportService.exportVariables();
    console.log(css);
    console.log("\nTest completed successfully!");
    
    // Check for transparent values
    const hasRgba = css.includes("rgba(");
    console.log(`\nTransparent colors detected: ${hasRgba ? "YES" : "NO"}`);
    console.log("Note that transparent colors should appear as rgba() values,");
    console.log("while solid colors should use rgb() format.");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Execute the test
runTest();