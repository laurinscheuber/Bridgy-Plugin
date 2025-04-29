// aWall Synch plugin
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

// Collect all variables and components from the document
async function collectDocumentData() {
  // Collection variables
  const variableCollections =
    await figma.variables.getLocalVariableCollectionsAsync();
  const variablesData: Array<{ name: string; variables: Array<any> }> = [];

  for (const collection of variableCollections) {
    const variablesPromises = collection.variableIds.map(async (id) => {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (!variable) return null;

      const valuesByModeEntries: Array<{ modeName: string; value: any }> = [];

      // Handle valuesByMode in a TypeScript-friendly way
      for (const modeId in variable.valuesByMode) {
        const value = variable.valuesByMode[modeId];
        const mode = collection.modes.find((m) => m.modeId === modeId);
        valuesByModeEntries.push({
          modeName: mode ? mode.name : "Unknown",
          value: value,
        });
      }

      return {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        valuesByMode: valuesByModeEntries,
      };
    });

    const variablesResult = await Promise.all(variablesPromises);
    const variables = variablesResult.filter((item) => item !== null);

    variablesData.push({
      name: collection.name,
      variables: variables as any[],
    });
  }

  // Collecting components with hierarchy
  const componentsData: any[] = [];
  const componentSets: any[] = [];
  const componentMap = new Map<string, any>();

  // First pass to collect all components and component sets
  async function collectNodes(node: BaseNode) {
    if ("type" in node) {
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        const componentStyles = await node.getCSSAsync();
        const componentData = {
          id: node.id,
          name: node.name,
          type: node.type,
          styles: componentStyles,
          pageName:
            node.parent && "name" in node.parent ? node.parent.name : "Unknown",
          parentId: node.parent?.id,
          children: [],
        };

        componentMap.set(node.id, componentData);

        if (node.type === "COMPONENT_SET") {
          componentSets.push(componentData);
        } else {
          componentsData.push(componentData);
        }
      }

      if ("children" in node) {
        for (const child of node.children) {
          await collectNodes(child);
        }
      }
    }
  }

  // Traverse all pages to find components
  for (const page of figma.root.children) {
    await collectNodes(page);
  }

  // Second pass to establish parent-child relationships for component sets
  for (const component of componentsData) {
    if (component.parentId) {
      const parent = componentMap.get(component.parentId);
      if (parent && parent.type === "COMPONENT_SET") {
        parent.children.push(component);
        component.isChild = true; // Mark as child for UI rendering
      }
    }
  }

  // Create final hierarchical data with only top-level components and component sets
  const hierarchicalComponents = [
    ...componentSets,
    ...componentsData.filter((comp) => !comp.isChild),
  ];

  // Send the data to the UI
  figma.ui.postMessage({
    type: "document-data",
    variablesData,
    componentsData: hierarchicalComponents,
  });
}

// Run the collection when the plugin starts
collectDocumentData();

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on("generate", (_event) => {
  try {
    return [
      {
        language: "PLAINTEXT",
        code: "aWall Synch - Use the plugin interface to view variables and components",
        title: "aWall Synch",
      },
    ];
  } catch (error) {
    console.error("Plugin error:", error);
    return [
      {
        language: "PLAINTEXT",
        code: "Error occurred during code generation",
        title: "Error",
      },
    ];
  }
});

// Handle messages from the UI
figma.ui.onmessage = async (msg: { type: string; language?: string }) => {
  if (msg.type === "export-css") {
    // Existing CSS export functionality
  } else if (msg.type === "export-angular") {
    // Existing Angular export functionality
  }
};
