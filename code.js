"use strict";
// aWall Synch plugin
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 450, height: 500 });

// Helper functions for naming conventions
function pascalCase(str) {
    // Convert string to PascalCase (e.g., my-button -> MyButton)
    return str.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase())
              .replace(/^./, chr => chr.toUpperCase());
}

function kebabCase(str) {
    // Convert string to kebab-case (e.g., MyButton -> my-button)
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
              .replace(/[^a-zA-Z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')
              .toLowerCase();
}

// Function to generate basic Angular HTML template
function generateAngularHtml(componentName) {
    const kebabName = kebabCase(componentName);
    return `<div class="${kebabName}">
  <!-- Content for ${componentName} -->
  <p>${componentName} works!</p>
</div>\n`;
}

// Function to generate basic Angular TypeScript class
function generateAngularTs(componentName) {
    const pascalName = pascalCase(componentName);
    const kebabName = kebabCase(componentName);
    return `import { Component } from '@angular/core';

@Component({
  selector: 'app-${kebabName}',
  templateUrl: './${kebabName}.component.html',
  styleUrls: ['./${kebabName}.component.scss']
})
export class ${pascalName}Component {
  constructor() { }
}
`;
}

// Store collected data globally in this script scope
let collectedVariablesData = null;
let collectedComponentsData = null; // Store component data including generated code

// Collect all variables and components from the document
function collectDocumentData() {
    return __awaiter(this, void 0, void 0, function* () {
        let variableCollections = [];
        let variablesData = [];
        // Rename to clarify content
        let componentsDataWithCode = []; 
        let errorOccurred = false;

        // --- Variable Fetching (No changes here) ---
        try {
            // Collection variables
            console.log("Attempting to fetch local variables...");
            variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
            console.log(`Fetched ${variableCollections.length} variable collections.`);

            for (const collection of variableCollections) {
                const currentCollectionVariables = [];
                 // Use Promise.all with async map to fetch variables concurrently
                 const variablePromises = collection.variableIds.map(async (id) => {
                    try {
                        // *** Use the async version ***
                        return await figma.variables.getVariableByIdAsync(id);
                    } catch (e) {
                        console.warn(`Could not get variable by ID ${id}:`, e);
                        return null; // Return null if fetching a specific variable fails
                    }
                 });
                 
                 // Wait for all variable fetches to complete
                 const variables = (yield Promise.all(variablePromises)).filter(v => v !== null);

                for (const variable of variables) {
                    // Process the successfully fetched variable
                    const valuesByModeEntries = [];
                    for (const modeId in variable.valuesByMode) {
                        const value = variable.valuesByMode[modeId];
                        const mode = collection.modes.find(m => m.modeId === modeId);
                        valuesByModeEntries.push({
                            modeName: mode ? mode.name : 'Unknown Mode',
                            value: value
                        });
                    }
                    currentCollectionVariables.push({
                        id: variable.id,
                        name: variable.name,
                        resolvedType: variable.resolvedType,
                        valuesByMode: valuesByModeEntries
                    });
                }
                 variablesData.push({
                     name: collection.name,
                     variables: currentCollectionVariables
                 });
            }
             console.log("Successfully processed variables.");
        } catch (error) {
            console.error('Error fetching or processing variables:', error);
            // Check if error is the specific WASM error
            if (error instanceof Error && error.message.includes('table index is out of bounds')) {
                 figma.ui.postMessage({ type: 'error', message: `Figma internal error processing variables (table index out of bounds). Please check variables for issues or try restarting Figma.` });
            } else {
                 figma.ui.postMessage({ type: 'error', message: `Error fetching variables: ${error.message}` });
            }
            errorOccurred = true; // Mark that an error happened
        }

        // --- Component Fetching (Updated for async children access) ---
        try {
             if (!errorOccurred) {
                 console.log("Attempting to find components and generate code (async)...");

                 // Make traverseNode async
                 async function traverseNode(node) {
                     if (node && typeof node === 'object' && 'type' in node) {
                         if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                             const componentName = node.name || 'UnnamedComponent';
                             componentsDataWithCode.push({
                                 id: node.id,
                                 name: componentName,
                                 type: node.type,
                                 angularHtml: generateAngularHtml(componentName),
                                 angularTs: generateAngularTs(componentName),
                                 kebabName: kebabCase(componentName)
                             });
                         }
                         // Check if children exist and use getChildrenAsync
                         if ('children' in node && typeof node.getChildrenAsync === 'function') {
                             try {
                                 const children = await node.getChildrenAsync(); // Await async children access
                                 // Traverse children concurrently
                                 await Promise.all(children.map(child => traverseNode(child)));
                             } catch (childError) {
                                 console.warn(`Could not get children for node ${node.id} (${node.name}):`, childError);
                             }
                         }
                     }
                 }

                 // Await directly within the main async function body (using yield for generator context)
                 if (figma.root && Array.isArray(figma.root.children)) {
                     // Use Promise.all to handle async traversal of multiple pages concurrently
                     yield Promise.all(figma.root.children.map(page => traverseNode(page)));
                 }

                 console.log(`Found and generated code for ${componentsDataWithCode.length} components.`);
             }
        } catch (error) {
             console.error('Error traversing nodes for components or generating code:', error);
             errorOccurred = true;
        }

        // Send the data to the UI
        console.log("Sending data to UI...");
        figma.ui.postMessage({
            type: 'document-data',
            variablesData,
            componentsData: componentsDataWithCode
        });

        // Store the collected data for potential export later, only if no error
        if (!errorOccurred) {
             collectedVariablesData = variablesData;
             collectedComponentsData = componentsDataWithCode;
             console.log("Stored variable and component data for export.");
        } else {
             collectedVariablesData = null;
             collectedComponentsData = null;
             console.log("Cleared stored data due to errors.");
        }
    });
}

// Function to convert Figma variable value to CSS string
function formatCssValue(variable) {
    // Assuming we use the first mode's value for simplicity
    // A more robust solution might let the user choose a mode or handle multiple modes
    if (!variable.valuesByMode || variable.valuesByMode.length === 0) {
        return null; // No value to format
    }
    // Find the first mode entry (often there's only one value anyway)
    const firstModeEntry = variable.valuesByMode[0];
    if (!firstModeEntry) return null;
    const valueObj = firstModeEntry.value;

    switch (variable.resolvedType) {
        case 'COLOR':
            if (typeof valueObj === 'object' && valueObj.r !== undefined) {
                const r = Math.round(valueObj.r * 255);
                const g = Math.round(valueObj.g * 255);
                const b = Math.round(valueObj.b * 255);
                // Use rgba if alpha is less than 1
                if (valueObj.a !== undefined && valueObj.a < 1) {
                    return `rgba(${r}, ${g}, ${b}, ${valueObj.a.toFixed(2)})`;
                } else {
                    // Convert solid RGB to Hex
                    const toHex = (c) => c.toString(16).padStart(2, '0');
                    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
                }
            }
            return null; // Invalid color format
        case 'FLOAT':
            // Assuming numbers are pixel values, adjust if needed (e.g., for unitless numbers)
            return `${valueObj}px`;
        case 'STRING':
            return `"${valueObj}"`; // Add quotes for strings
        case 'BOOLEAN':
            return valueObj.toString(); // 'true' or 'false'
        default:
            console.warn(`Unsupported variable type for CSS export: ${variable.resolvedType}`);
            return null; // Unsupported type
    }
}

// Function to generate CSS custom properties from variables
function generateCssFromVariables(variablesData) {
    let cssString = ':root {\n';

    variablesData.forEach(collection => {
        cssString += `  /* ${collection.name} */\n`;
        let collectionHasVariables = false;
        collection.variables.forEach(variable => {
            // Sanitize variable name for CSS: replace slashes/spaces with dashes, convert to lowercase
            const cssVarName = `--${variable.name.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase()}`;
            const cssValue = formatCssValue(variable);
            if (cssValue !== null) {
                cssString += `  ${cssVarName}: ${cssValue};\n`;
                collectionHasVariables = true;
            }
        });
        if (collectionHasVariables) {
             cssString += '\n'; // Add a newline after each collection with variables
        }
    });

    cssString += '}';
    return cssString;
}

// Run the collection when the plugin starts
collectDocumentData();

// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(this, void 0, void 0, function* () {
    if (msg.type === 'export-css') {
        // Handle CSS export request
        if (collectedVariablesData) {
            const cssData = generateCssFromVariables(collectedVariablesData);
            figma.ui.postMessage({ type: 'css-export', cssData: cssData });
        } else {
             figma.ui.postMessage({ type: 'error', message: 'Variable data not available for export. Please reload the plugin.' });
             console.error("Variable data not available for export.");
        }
    } else if (msg.type === 'export-angular') {
        // Handle Angular export request
        console.log("Received request to export Angular components.");
        if (collectedComponentsData) {
            // Send the component data (which includes the generated code) to the UI for zipping
            figma.ui.postMessage({ type: 'angular-export-data', files: collectedComponentsData });
            console.log("Sent Angular component data to UI for zipping.");
        } else {
             figma.ui.postMessage({ type: 'error', message: 'Component data not available for export. Please reload the plugin.' });
             console.error("Component data not available for Angular export.");
        }
    }
});

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
    }
    catch (error) {
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
