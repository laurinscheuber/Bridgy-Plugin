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

        // --- Component Fetching with Enhanced Debug Logging ---
        try {
             if (!errorOccurred) {
                 console.log("Attempting to find components across all pages...");
                 const componentsDataWithCode = []; // Create a new array here
                 
                 // Debug info about the document
                 console.log(`Document name: ${figma.root.name}`);
                 console.log(`Page count: ${figma.root.children.length}`);
                 figma.root.children.forEach(page => {
                     console.log(`Page: ${page.name} (${page.type})`);
                 });

                 // Define our node traversal function with enhanced debugging
                 const traverseNodeAsync = (node) => __awaiter(this, void 0, void 0, function* () {
                     if (!node) {
                         console.log(`Warning: Null/undefined node encountered`);
                         return;
                     }
                     
                     // More detailed node info for debugging
                     const nodeInfo = `Node: ${node.name} | Type: ${node.type} | ID: ${node.id}`;
                     if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                         console.log(`🎯 FOUND COMPONENT: ${nodeInfo}`);
                     } else {
                         console.log(`Traversing ${nodeInfo}`);
                     }

                     // Check if node is a component or component set
                     if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                         // Get page name safely without using optional chaining
                         let pageName = 'unknown';
                         if (node.parent && node.parent.type === 'PAGE') {
                             pageName = node.parent.name;
                         }
                         
                         console.log(`Found component: ${node.name} on page: ${pageName}`);
                         const componentName = node.name || 'UnnamedComponent';
                         componentsDataWithCode.push({
                             id: node.id,
                             name: componentName,
                             type: node.type,
                             pageName: pageName,
                             angularHtml: generateAngularHtml(componentName),
                             angularTs: generateAngularTs(componentName),
                             kebabName: kebabCase(componentName)
                         });
                     }
                     
                     // Get children using getChildrenAsync - with enhanced error handling
                     try {
                         // Check if the node can have children
                         if ('children' in node) {
                             if (typeof node.getChildrenAsync === 'function') {
                                 console.log(`Getting children for node: ${node.name}`);
                                 // Use yield since we're inside __awaiter
                                 const children = yield node.getChildrenAsync();
                                 console.log(`Node ${node.name} has ${children.length} children`);
                                 
                                 // Process children sequentially
                                 for (let i = 0; i < children.length; i++) {
                                     yield traverseNodeAsync(children[i]);
                                 }
                             } else {
                                 console.warn(`Node ${node.name} has 'children' property but no getChildrenAsync method`);
                                 if (Array.isArray(node.children)) {
                                     console.log(`Falling back to synchronous children access for ${node.name}`);
                                     // Direct .children access as fallback (shouldn't be needed with document access)
                                     for (let i = 0; i < node.children.length; i++) {
                                         yield traverseNodeAsync(node.children[i]);
                                     }
                                 }
                             }
                         } else {
                             console.log(`Node ${node.name} has no children`);
                         }
                     } catch (childError) {
                         console.warn(`Error getting children of node ${node.name}:`, childError);
                     }
                 });

                 // With full document access, we can iterate through all pages
                 if (figma.root && figma.root.children) {
                     console.log(`Document has ${figma.root.children.length} pages. Starting traversal...`);
                     
                     // Process each page in the document
                     for (const page of figma.root.children) {
                         console.log(`Processing page: ${page.name}`);
                         yield traverseNodeAsync(page);
                     }
                 }
                 
                 console.log(`Component search complete. Found ${componentsDataWithCode.length} components across all pages.`);
                 if (componentsDataWithCode.length > 0) {
                     console.log("Components found:", componentsDataWithCode.map(c => c.name).join(", "));
                 } else {
                     console.log("No components found. Check if your document actually contains components.");
                     console.log("Remember: A component must be created using 'Create Component' in Figma (not just a group or frame).");
                 }
                 
                 // Store components data globally to make it accessible
                 collectedComponentsData = componentsDataWithCode;
             }
        } catch (error) {
             console.error('Error traversing nodes for components or generating code:', error);
             figma.ui.postMessage({ type: 'error', message: `Error finding components: ${error.message}` });
             errorOccurred = true;
        }

        // Send the data to the UI
        console.log("Sending data to UI...");
        figma.ui.postMessage({
            type: 'document-data',
            variablesData,
            componentsData: collectedComponentsData || [] // Use the global variable we just populated
        });
        
        // Log what we're sending to help debug
        console.log(`Sending ${variablesData ? variablesData.length : 0} variable collections and ${collectedComponentsData ? collectedComponentsData.length : 0} components to UI`);

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
        console.log(`Received request to export Angular components in ${msg.language || 'angular'} format.`);
        if (collectedComponentsData) {
            // Send the component data (which includes the generated code) to the UI for zipping
            figma.ui.postMessage({ 
                type: 'angular-export-data', 
                files: collectedComponentsData,
                language: msg.language || 'angular'  // Pass the selected language back
            });
            console.log("Sent Angular component data to UI for zipping.");
        } else {
             figma.ui.postMessage({ type: 'error', message: 'Component data not available for export. Please reload the plugin.' });
             console.error("Component data not available for Angular export.");
        }
    }
});

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on('generate', (event) => {
    try {
        const node = event.node;
        const language = event.language; // Get the selected language
        
        // If no node is selected or node isn't a valid component type
        if (!node) {
            return [
                {
                    language: 'PLAINTEXT',
                    code: 'Select a component or frame to generate Angular code.',
                    title: 'aWall Synch',
                }
            ];
        }
        
        const componentName = node.name;
        const kebabName = kebabCase(componentName);
        const pascalName = pascalCase(componentName);
        
        // If Angular is selected or no specific language is specified
        if (language === 'angular' || !language) {
            // Generate HTML
            const htmlCode = generateAngularHtml(componentName);
            
            // Generate TypeScript
            const tsCode = generateAngularTs(componentName);
            
            // Generate basic SCSS with component dimensions
            const scssCode = `// Styles for ${componentName}
.${kebabName} {
  width: ${node.width}px;
  height: ${node.height}px;
  // Add your custom styles here
}`;
            
            // Return the Angular component files
            return [
                {
                    language: 'HTML',
                    code: htmlCode,
                    title: `${kebabName}.component.html`,
                },
                {
                    language: 'TYPESCRIPT',
                    code: tsCode,
                    title: `${kebabName}.component.ts`,
                },
                {
                    language: 'CSS',
                    code: scssCode,
                    title: `${kebabName}.component.scss`,
                }
            ];
        } 
        else if (language === 'typescript') {
            // TypeScript only - just the component class
            return [
                {
                    language: 'TYPESCRIPT',
                    code: generateAngularTs(componentName),
                    title: `${kebabName}.component.ts`,
                }
            ];
        }
        else if (language === 'javascript') {
            // JavaScript version - convert TypeScript to JavaScript
            const jsCode = generateAngularTs(componentName)
                .replace(/: [A-Za-z<>[\]]+/g, '') // Remove type annotations
                .replace(/interface [^}]+}/g, '') // Remove interfaces
                .replace('import { Component } from \'@angular/core\';', 
                         'import { Component } from \'@angular/core\';'); // Keep imports
                
            return [
                {
                    language: 'JAVASCRIPT',
                    code: jsCode,
                    title: `${kebabName}.component.js`,
                }
            ];
        }
    }
    catch (error) {
        console.error('Plugin error in codegen:', error);
        return [
            {
                language: 'PLAINTEXT',
                code: `Error occurred during code generation: ${error.message}`,
                title: 'Error',
            },
        ];
    }
});
