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
figma.showUI(__html__, { width: 850, height: 800 });
// Store component data for later use
let componentMap = new Map();
// Collect all variables and components from the document
function collectDocumentData() {
    return __awaiter(this, void 0, void 0, function* () {
        // Collection variables
        const variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
        const variablesData = [];
        for (const collection of variableCollections) {
            const variablesPromises = collection.variableIds.map((id) => __awaiter(this, void 0, void 0, function* () {
                const variable = yield figma.variables.getVariableByIdAsync(id);
                if (!variable)
                    return null;
                const valuesByModeEntries = [];
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
            }));
            const variablesResult = yield Promise.all(variablesPromises);
            const variables = variablesResult.filter((item) => item !== null);
            variablesData.push({
                name: collection.name,
                variables: variables,
            });
        }
        // Collecting components with hierarchy
        const componentsData = [];
        const componentSets = [];
        componentMap = new Map();
        // First pass to collect all components and component sets
        function collectNodes(node) {
            return __awaiter(this, void 0, void 0, function* () {
                var _a;
                if ("type" in node) {
                    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                        const componentStyles = yield node.getCSSAsync();
                        const componentData = {
                            id: node.id,
                            name: node.name,
                            type: node.type,
                            styles: componentStyles,
                            pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
                            parentId: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.id,
                            children: [],
                        };
                        componentMap.set(node.id, componentData);
                        if (node.type === "COMPONENT_SET") {
                            componentSets.push(componentData);
                        }
                        else {
                            componentsData.push(componentData);
                        }
                    }
                    if ("children" in node) {
                        for (const child of node.children) {
                            yield collectNodes(child);
                        }
                    }
                }
            });
        }
        // Traverse all pages to find components
        for (const page of figma.root.children) {
            yield collectNodes(page);
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
    }
    catch (error) {
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
// Generate Jest test for a component
function generateJestTest(component) {
    // Extract component name and create a kebab case version for file naming
    const componentName = component.name;
    const kebabName = componentName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    // Parse the styles to extract the relevant CSS properties
    let styles;
    try {
        styles = typeof component.styles === 'string'
            ? JSON.parse(component.styles)
            : component.styles;
    }
    catch (e) {
        console.error("Error parsing component styles:", e);
        styles = {};
    }
    // Extract all CSS properties that are present in the styles object
    const styleChecks = [];
    // Process all style properties
    for (const key in styles) {
        if (Object.prototype.hasOwnProperty.call(styles, key)) {
            // Convert kebab-case to camelCase for JavaScript property access
            const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            styleChecks.push({
                property: camelCaseKey,
                value: styles[key]
            });
        }
    }
    // Determine if this is a component set or a regular component
    const isComponentSet = component.type === 'COMPONENT_SET';
    // For component sets, we'll create a test that checks the default variant
    // For regular components, we'll create a standard test
    let testContent = '';
    if (isComponentSet) {
        // For component sets, we need to find the default variant
        // This is a simplified approach - in a real implementation, you might need to
        // determine the default variant more accurately
        const defaultVariant = component.children && component.children.length > 0
            ? component.children[0]
            : null;
        if (defaultVariant) {
            // Use the default variant's styles
            let variantStyles;
            try {
                variantStyles = typeof defaultVariant.styles === 'string'
                    ? JSON.parse(defaultVariant.styles)
                    : defaultVariant.styles;
            }
            catch (e) {
                console.error("Error parsing variant styles:", e);
                variantStyles = {};
            }
            // Extract all CSS properties that are present in the variant styles object
            const variantStyleChecks = [];
            // Process all style properties
            for (const key in variantStyles) {
                if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
                    // Convert kebab-case to camelCase for JavaScript property access
                    const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    variantStyleChecks.push({
                        property: camelCaseKey,
                        value: variantStyles[key]
                    });
                }
            }
            testContent = createTestWithStyleChecks(componentName, kebabName, variantStyleChecks);
        }
        else {
            // If no default variant is found, create a standard test
            testContent = createTestWithStyleChecks(componentName, kebabName, styleChecks);
        }
    }
    else {
        // For regular components, create a standard test
        testContent = createTestWithStyleChecks(componentName, kebabName, styleChecks);
    }
    return testContent;
}
// Helper function to create a test with dynamic style checks
function createTestWithStyleChecks(componentName, kebabName, styleChecks) {
    // Generate the style check code based on the available style checks
    let styleCheckCode = '';
    if (styleChecks.length > 0) {
        styleCheckCode = styleChecks.map(check => {
            return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${check.value}');`;
        }).join('\n\n');
    }
    else {
        styleCheckCode = '      // No style properties to check';
    }
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component } from './${kebabName}.component';

describe('${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component', () => {
  let component: ${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component;
  let fixture: ComponentFixture<${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${componentName.replace(/[^a-zA-Z0-9]/g, '')}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
${styleCheckCode}
    } else {
      console.warn('No suitable element found to test styles');
    }
  });
});
`;
}
// Handle messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === "export-css") {
        try {
            // Get all variable collections
            const collections = yield figma.variables.getLocalVariableCollectionsAsync();
            let cssContent = '/* Figma Variables Export */\n';
            cssContent += `/* Generated: ${new Date().toLocaleString()} */\n\n`;
            cssContent += ':root {\n';
            // Process each collection
            for (const collection of collections) {
                let hasValidVariables = false;
                let collectionContent = `  /* ${collection.name} */\n`;
                // Get all variables in the collection
                for (const variableId of collection.variableIds) {
                    const variable = yield figma.variables.getVariableByIdAsync(variableId);
                    if (!variable)
                        continue;
                    // Get the default mode (first mode)
                    const defaultModeId = collection.modes[0].modeId;
                    const value = variable.valuesByMode[defaultModeId];
                    // Skip variables that reference other variables
                    if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                        continue;
                    }
                    // Format the variable name (replace spaces and special characters)
                    const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
                    // Format the value based on the variable type
                    let formattedValue = '';
                    if (variable.resolvedType === 'COLOR') {
                        if (value && typeof value === 'object' && 'r' in value && 'g' in value && 'b' in value) {
                            const color = value;
                            formattedValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
                        }
                        else {
                            continue; // Skip invalid color values
                        }
                    }
                    else if (variable.resolvedType === 'FLOAT') {
                        if (typeof value === 'number' && !isNaN(value)) {
                            // Add 'px' unit for size-related values
                            if (variable.name.toLowerCase().includes('size') ||
                                variable.name.toLowerCase().includes('padding') ||
                                variable.name.toLowerCase().includes('margin') ||
                                variable.name.toLowerCase().includes('radius') ||
                                variable.name.toLowerCase().includes('gap') ||
                                variable.name.toLowerCase().includes('stroke')) {
                                formattedValue = `${value}px`;
                            }
                            else {
                                formattedValue = String(value);
                            }
                        }
                        else {
                            continue; // Skip invalid float values
                        }
                    }
                    else if (variable.resolvedType === 'STRING') {
                        if (typeof value === 'string') {
                            // Handle font names and other string values
                            formattedValue = `"${value}"`;
                        }
                        else {
                            continue; // Skip invalid string values
                        }
                    }
                    else if (variable.resolvedType === 'BOOLEAN') {
                        if (typeof value === 'boolean') {
                            formattedValue = value ? 'true' : 'false';
                        }
                        else {
                            continue; // Skip invalid boolean values
                        }
                    }
                    else {
                        continue; // Skip unknown types
                    }
                    // Add the CSS variable
                    collectionContent += `  --${formattedName}: ${formattedValue};\n`;
                    hasValidVariables = true;
                }
                // Only add the collection content if it has valid variables
                if (hasValidVariables) {
                    cssContent += collectionContent + '\n';
                }
            }
            // Close the root selector
            cssContent += '}\n\n';
            // Add media query for dark mode if needed
            cssContent += '@media (prefers-color-scheme: dark) {\n';
            cssContent += '  :root {\n';
            cssContent += '    /* Dark mode overrides can be added here */\n';
            cssContent += '  }\n';
            cssContent += '}\n';
            // Add usage examples and documentation
            cssContent += '\n/* ---------------------------------------------------------- */\n';
            cssContent += '/* Usage Examples */\n';
            cssContent += '/* ---------------------------------------------------------- */\n\n';
            cssContent += '/* Example usage of variables */\n';
            cssContent += '.example-element {\n';
            cssContent += '  color: var(--primary-color);\n';
            cssContent += '  background-color: var(--background-color);\n';
            cssContent += '  padding: var(--spacing-medium);\n';
            cssContent += '  border-radius: var(--border-radius);\n';
            cssContent += '  font-family: var(--font-family);\n';
            cssContent += '}\n';
            // Send the CSS content back to the UI
            figma.ui.postMessage({
                type: "css-export",
                cssData: cssContent
            });
        }
        catch (error) {
            console.error("Error exporting CSS:", error);
            figma.ui.postMessage({
                type: "error",
                message: `Error exporting CSS: ${error.message || 'Unknown error'}`
            });
        }
    }
    else if (msg.type === "export-angular") {
        // Existing Angular export functionality
    }
    else if (msg.type === "generate-test") {
        try {
            // Get the component data
            const componentId = msg.componentId || '';
            const component = componentMap.get(componentId);
            if (!component) {
                figma.ui.postMessage({
                    type: "error",
                    message: `Component with ID ${componentId} not found`,
                });
                return;
            }
            // Generate the test
            const testContent = generateJestTest(component);
            // Send the test content back to the UI
            figma.ui.postMessage({
                type: "test-generated",
                componentName: msg.componentName || component.name,
                testContent: testContent,
            });
        }
        catch (error) {
            console.error("Error generating test:", error);
            figma.ui.postMessage({
                type: "error",
                message: `Error generating test: ${error.message || 'Unknown error'}`,
            });
        }
    }
    else if (msg.type === "commit-to-gitlab") {
        try {
            if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
                throw new Error("Missing required fields for GitLab commit");
            }
            // Construct the GitLab API URL using the project ID
            const gitlabApiUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/commits`;
            const filePath = msg.filePath || 'variables.css';
            // First, check if the file exists
            const checkFileUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/files/${encodeURIComponent(filePath)}`;
            const checkResponse = yield fetch(checkFileUrl, {
                method: 'GET',
                headers: {
                    'PRIVATE-TOKEN': msg.gitlabToken
                }
            });
            // Determine if we should create or update the file
            const fileExists = checkResponse.ok;
            const action = fileExists ? 'update' : 'create';
            // Prepare the commit data
            const commitData = {
                branch: 'main', // Default to main branch
                commit_message: msg.commitMessage,
                actions: [
                    {
                        action: action,
                        file_path: filePath,
                        content: msg.cssData
                    }
                ]
            };
            // Make the API request to GitLab
            const response = yield fetch(gitlabApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'PRIVATE-TOKEN': msg.gitlabToken
                },
                body: JSON.stringify(commitData)
            });
            if (!response.ok) {
                const errorData = yield response.json();
                throw new Error(errorData.message || 'Failed to commit to GitLab');
            }
            // Send success message back to UI
            figma.ui.postMessage({
                type: "commit-success"
            });
        }
        catch (error) {
            console.error("Error committing to GitLab:", error);
            figma.ui.postMessage({
                type: "commit-error",
                error: error.message || 'Unknown error occurred'
            });
        }
    }
});
