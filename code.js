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
    // Extract the CSS properties we want to test
    const borderRadius = styles['border-radius'] || styles['borderRadius'] || '0px';
    const border = styles['border'] || 'none';
    const color = styles['color'] || 'inherit';
    const backgroundColor = styles['background-color'] || styles['backgroundColor'] || 'transparent';
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
            const variantBorderRadius = variantStyles['border-radius'] || variantStyles['borderRadius'] || '0px';
            const variantBorder = variantStyles['border'] || 'none';
            const variantColor = variantStyles['color'] || 'inherit';
            const variantBackgroundColor = variantStyles['background-color'] || variantStyles['backgroundColor'] || 'transparent';
            testContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
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

  it('should render the default variant with correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
      // Check border-radius
      expect(computedStyle.borderRadius).toBe('${variantBorderRadius}');
      
      // Check border
      expect(computedStyle.border).toBe('${variantBorder}');
      
      // Check color
      expect(computedStyle.color).toBe('${variantColor}');
      
      // Check background-color
      expect(computedStyle.backgroundColor).toBe('${variantBackgroundColor}');
    } else {
      console.warn('No suitable element found to test styles');
    }
  });
});
`;
        }
        else {
            // If no default variant is found, create a standard test
            testContent = createStandardTest(componentName, kebabName, borderRadius, border, color, backgroundColor);
        }
    }
    else {
        // For regular components, create a standard test
        testContent = createStandardTest(componentName, kebabName, borderRadius, border, color, backgroundColor);
    }
    return testContent;
}
// Helper function to create a standard test
function createStandardTest(componentName, kebabName, borderRadius, border, color, backgroundColor) {
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
      
      // Check border-radius
      expect(computedStyle.borderRadius).toBe('${borderRadius}');
      
      // Check border
      expect(computedStyle.border).toBe('${border}');
      
      // Check color
      expect(computedStyle.color).toBe('${color}');
      
      // Check background-color
      expect(computedStyle.backgroundColor).toBe('${backgroundColor}');
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
        // Existing CSS export functionality
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
});
