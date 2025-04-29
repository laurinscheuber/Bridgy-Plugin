// aWall Synch plugin
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

// Collect all variables and components from the document
async function collectDocumentData() {
  // Collection variables
  const variableCollections = figma.variables.getLocalVariableCollections();
  const variablesData: any[] = [];

  for (const collection of variableCollections) {
    const variables = collection.variableIds.map(id => {
      const variable = figma.variables.getVariableById(id);
      if (!variable) return null;

      const valuesByModeEntries: any[] = [];

      // Handle valuesByMode in a TypeScript-friendly way
      for (const modeId in variable.valuesByMode) {
        const value = variable.valuesByMode[modeId];
        const mode = collection.modes.find(m => m.modeId === modeId);
        valuesByModeEntries.push({
          modeName: mode ? mode.name : 'Unknown',
          value: value
        });
      }

      return {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        valuesByMode: valuesByModeEntries
      };
    }).filter(item => item !== null);

    variablesData.push({
      name: collection.name,
      variables: variables
    });
  }

  // Collecting components
  const componentsData: any[] = [];

  // Fixed type definition to handle both PageNode and other nodes with children
  async function traverseNode(node: BaseNode) {
    if ('type' in node) {
      if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
        const componentStyles = await node.getCSSAsync();
        componentsData.push({
          id: node.id,
          name: node.name,
          type: node.type,
          styles: componentStyles,
        });
      }

      if ('children' in node) {
        for (const child of node.children) {
          await traverseNode(child);
        }
      }
    }
  }

  // Traverse all pages to find components
  for (const page of figma.root.children) {
    await traverseNode(page);
  }

  // Send the data to the UI
  figma.ui.postMessage({
    type: 'document-data',
    variablesData,
    componentsData
  });
}

// Run the collection when the plugin starts
collectDocumentData();

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on('generate', (_event) => {
  try {
    return [
      {
        language: 'PLAINTEXT',
        code: 'aWall Synch - Use the plugin interface to view variables and components',
        title: 'aWall Synch',
      },
    ];
  } catch (error: any) {
    console.error('Plugin error:', error);
    return [
      {
        language: 'PLAINTEXT',
        code: 'Error occurred during code generation',
        title: 'Error',
      },
    ];
  }
});
