// aWall Synch plugin
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

// Store component data for later use
let componentMap = new Map<string, any>();

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
  componentMap = new Map<string, any>();

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

// Load saved GitLab settings if available
async function loadSavedGitLabSettings() {
  try {
    // Try to load settings from the document (available to all team members)
    const documentSettings = await figma.root.getSharedPluginData(
      "aWallSync",
      "gitlab-settings"
    );
    if (documentSettings) {
      try {
        const settings = JSON.parse(documentSettings);
        figma.ui.postMessage({
          type: "gitlab-settings-loaded",
          settings: settings,
        });
        console.log("GitLab settings loaded from document storage");
        return;
      } catch (parseError) {
        console.error("Error parsing document settings:", parseError);
      }
    }

    // Fallback to client storage if document storage doesn't have settings
    const clientSettings = await figma.clientStorage.getAsync(
      "gitlab-settings"
    );
    if (clientSettings) {
      figma.ui.postMessage({
        type: "gitlab-settings-loaded",
        settings: clientSettings,
        isPersonal: true,
      });
      console.log("GitLab settings loaded from client storage");
    }
  } catch (error) {
    console.error("Error loading GitLab settings:", error);
    // Silently fail - we'll just prompt the user for settings
  }
}

// Run the collection when the plugin starts
collectDocumentData();

// Load saved GitLab settings
loadSavedGitLabSettings();

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

// Generate Jest test for a component
function generateJestTest(component: any, generateAllVariants = false): string {
  // Extract component name and create a kebab case version for file naming
  const componentName = component.name;
  const kebabName = componentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Determine if this is a component set or a regular component
  const isComponentSet = component.type === "COMPONENT_SET";

  // If this is a component set and we want to generate tests for all variants
  if (
    isComponentSet &&
    generateAllVariants &&
    component.children &&
    component.children.length > 0
  ) {
    return generateComponentSetTest(component);
  }

  // Parse the styles to extract the relevant CSS properties
  let styles;
  try {
    styles =
      typeof component.styles === "string"
        ? JSON.parse(component.styles)
        : component.styles;
  } catch (e) {
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
        value: typeof styles[key] === 'string' && styles[key].includes('var(--')
               ? styles[key].replace(/var\(--[^)]+,\s*([^)]+)\)/g, '$1').trim() // Extract just the fallback value
               : styles[key],
      });
    }
  }

  // For component sets, we'll create a test that checks the default variant
  // For regular components, we'll create a standard test
  let testContent = "";

  if (isComponentSet) {
    // For component sets, we need to find the default variant
    // This is a simplified approach - in a real implementation, you might need to
    // determine the default variant more accurately
    const defaultVariant =
      component.children && component.children.length > 0
        ? component.children[0]
        : null;

    if (defaultVariant) {
      // Use the default variant's styles
      let variantStyles;
      try {
        variantStyles =
          typeof defaultVariant.styles === "string"
            ? JSON.parse(defaultVariant.styles)
            : defaultVariant.styles;
      } catch (e) {
        console.error("Error parsing variant styles:", e);
        variantStyles = {};
      }

      // Extract all CSS properties that are present in the variant styles object
      const variantStyleChecks = [];

      // Process all style properties
      for (const key in variantStyles) {
        if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
          // Convert kebab-case to camelCase for JavaScript property access
          const camelCaseKey = key.replace(/-([a-z])/g, (g) =>
            g[1].toUpperCase()
          );

          variantStyleChecks.push({
            property: camelCaseKey,
            value: typeof variantStyles[key] === 'string' && variantStyles[key].includes('var(--')
                   ? variantStyles[key].replace(/var\(--[^)]+,\s*([^)]+)\)/g, '$1').trim() // Extract just the fallback value
                   : variantStyles[key],
          });
        }
      }

      testContent = createTestWithStyleChecks(
        componentName,
        kebabName,
        variantStyleChecks
      );
    } else {
      // If no default variant is found, create a standard test
      testContent = createTestWithStyleChecks(
        componentName,
        kebabName,
        styleChecks
      );
    }
  } else {
    // For regular components, create a standard test
    testContent = createTestWithStyleChecks(
      componentName,
      kebabName,
      styleChecks
    );
  }

  return testContent;
}

// Generate comprehensive test for a component set with all variants
function generateComponentSetTest(componentSet: any): string {
  if (!componentSet.children || componentSet.children.length === 0) {
    return generateJestTest(componentSet); // Fallback to standard test if no variants
  }

  const componentName = componentSet.name;
  const kebabName = componentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");

  // Start building the test file
  let testContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

`;

  // Add tests for each variant
  componentSet.children.forEach((variant: any, index: number) => {
    // Extract state and type information from the variant name
    const parsedName = parseVariantName(variant.name);
    const variantDesc = parsedName.state
      ? `in '${parsedName.state}' state`
      : parsedName.type
      ? `of type '${parsedName.type}'`
      : `variant ${index + 1}`;

    // Parse the variant styles
    let variantStyles;
    try {
      variantStyles =
        typeof variant.styles === "string"
          ? JSON.parse(variant.styles)
          : variant.styles;
    } catch (e) {
      console.error("Error parsing variant styles:", e);
      variantStyles = {};
    }

    // Extract all CSS properties for this variant
    const styleChecks: Array<{ property: string; value: string }> = [];
    for (const key in variantStyles) {
      if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
        const camelCaseKey = key.replace(/-([a-z])/g, (g) =>
          g[1].toUpperCase()
        );
        styleChecks.push({
          property: camelCaseKey,
          value: typeof variantStyles[key] === 'string' && variantStyles[key].includes('var(--')
                 ? variantStyles[key].replace(/var\(--[^)]+,\s*([^)]+)\)/g, '$1').trim() // Extract just the fallback value
                 : variantStyles[key],
        });
      }
    }

    // Generate test for this variant
    const stateVar = parsedName.state
      ? parsedName.state.toLowerCase().replace(/\s+/g, "")
      : "default";
    testContent += `  describe('${variantDesc}', () => {
    it('should have correct styles', () => {
      // Set component to the ${variantDesc} state
      component.state = '${stateVar}';
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
      if (element) {
        const computedStyle = window.getComputedStyle(element);

${generateStyleChecks(styleChecks)}
      } else {
        console.warn('No suitable element found to test styles');
      }
    });
  });

`;
  });

  // Close the main describe block
  testContent += `});
`;

  return testContent;
}

// Helper function to parse variant names to extract type and state
function parseVariantName(name: string): {
  name: string;
  type: string | null;
  state: string | null;
} {
  const result = {
    name: name,
    type: null as string | null,
    state: null as string | null,
  };

  // Check for Type=X pattern
  const typeMatch = name.match(/Type=([^,]+)/i);
  if (typeMatch && typeMatch[1]) {
    result.type = typeMatch[1].trim();
  }

  // Check for State=X pattern
  const stateMatch = name.match(/State=([^,]+)/i);
  if (stateMatch && stateMatch[1]) {
    result.state = stateMatch[1].trim();
  }

  return result;
}

// Helper function to generate style checks
function generateStyleChecks(
  styleChecks: Array<{ property: string; value: string }>
): string {
  if (styleChecks.length === 0) {
    return "        // No style properties to check";
  }

  return styleChecks
    .map((check) => {
      return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${check.value}');`;
    })
    .join("\n\n");
}

// Helper function to create a test with dynamic style checks
function createTestWithStyleChecks(
  componentName: string,
  kebabName: string,
  styleChecks: Array<{ property: string; value: string }>
): string {
  // Generate the style check code based on the available style checks
  let styleCheckCode = "";

  if (styleChecks.length > 0) {
    styleCheckCode = styleChecks
      .map((check) => {
        return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${check.value}');`;
      })
      .join("\n\n");
  } else {
    styleCheckCode = "      // No style properties to check";
  }

  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${componentName.replace(
    /[^a-zA-Z0-9]/g,
    ""
  )}Component } from './${kebabName}.component';

describe('${componentName.replace(/[^a-zA-Z0-9]/g, "")}Component', () => {
  let component: ${componentName.replace(/[^a-zA-Z0-9]/g, "")}Component;
  let fixture: ComponentFixture<${componentName.replace(
    /[^a-zA-Z0-9]/g,
    ""
  )}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${componentName.replace(/[^a-zA-Z0-9]/g, "")}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${componentName.replace(
      /[^a-zA-Z0-9]/g,
      ""
    )}Component);
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
figma.ui.onmessage = async (msg: {
  type: string;
  language?: string;
  componentId?: string;
  componentName?: string;
  projectId?: string;
  gitlabToken?: string;
  commitMessage?: string;
  filePath?: string;
  cssData?: string;
  testContent?: string;
  shareWithTeam?: boolean;
  saveToken?: boolean;
  generateAllVariants?: boolean;
  shouldDownload?: boolean;
  forceCreate?: boolean; // Add new option to force creating a new file
  commitToGitLab?: boolean;
  branchName?: string;
  testPath?: string;
  componentTestPath?: string;
  createMergeRequest?: boolean;
  branchStrategy?: string;
  featurePrefix?: string;
}) => {
  if (msg.type === "export-css") {
    try {
      // Get all variable collections
      const collections =
        await figma.variables.getLocalVariableCollectionsAsync();
      let cssContent = "/* Figma Variables Export */\n";
      cssContent += `/* Generated: ${new Date().toLocaleString()} */\n\n`;

      // Create separate sections for base tokens and semantic tokens
      let baseTokensContent = "";
      let semanticTokensContent = "\n  /* Semantic Variables */\n";

      cssContent += ":root {\n";

      // Process each collection
      let processedCollections = new Set();

      for (const collection of collections) {
        let hasValidVariables = false;

        // Add minimal collection header to base tokens section if not already added
        if (!processedCollections.has(collection.name)) {
          baseTokensContent += `\n  /* ${collection.name} */\n`;
          processedCollections.add(collection.name);
        }

        // Get all variables in the collection
        for (const variableId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(
            variableId
          );
          if (!variable) continue;

          // Get the default mode (first mode)
          const defaultModeId = collection.modes[0].modeId;
          const value = variable.valuesByMode[defaultModeId];

          // Handle variable aliases (references to other variables)
          if (
            value &&
            typeof value === "object" &&
            "type" in value &&
            value.type === "VARIABLE_ALIAS"
          ) {
            // Get the referenced variable
            const referencedVariableId = value.id;
            const referencedVariable = await figma.variables.getVariableByIdAsync(referencedVariableId);

            if (!referencedVariable) continue;

            // Format the referenced variable name
            const referencedVarCollection = await figma.variables.getVariableCollectionByIdAsync(referencedVariable.variableCollectionId);
            if (!referencedVarCollection) continue;

            // Create the full reference path with collection name prefix
            const referencedVarCollectionName = referencedVarCollection.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
            const referencedVarName = referencedVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
            const fullReferencePath = `${referencedVarCollectionName}-${referencedVarName}`;

            // Format the variable name (replace spaces and special characters)
            const formattedName = variable.name
              .replace(/[^a-zA-Z0-9]/g, "-")
              .toLowerCase();

            // Format the current collection name
            const collectionName = collection.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, "-");
            const fullVarName = `${collectionName}-${formattedName}`;

            // Add the CSS variable reference to semantic tokens section without excessive comments
            semanticTokensContent += `  --${fullVarName}: var(--${fullReferencePath});\n`;
            hasValidVariables = true;

            continue;
          }

          // Format the variable name (replace spaces and special characters)
          const varName = variable.name
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();

          // Format the collection name for prefix
          const collectionPrefix = collection.name
            .toLowerCase()
            .replace(/[^a-zA-Z0-9]/g, "-");

          // Combine for the full variable name
          const formattedName = `${collectionPrefix}-${varName}`;

          // Format the value based on the variable type
          let formattedValue = "";

          if (variable.resolvedType === "COLOR") {
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
              continue; // Skip invalid color values
            }
          } else if (variable.resolvedType === "FLOAT") {
            if (typeof value === "number" && !isNaN(value)) {
              // Add 'px' unit for size-related values
              if (
                variable.name.toLowerCase().includes("size") ||
                variable.name.toLowerCase().includes("padding") ||
                variable.name.toLowerCase().includes("margin") ||
                variable.name.toLowerCase().includes("radius") ||
                variable.name.toLowerCase().includes("gap") ||
                variable.name.toLowerCase().includes("stroke")
              ) {
                formattedValue = `${value}px`;
              } else {
                formattedValue = String(value);
              }
            } else {
              continue; // Skip invalid float values
            }
          } else if (variable.resolvedType === "STRING") {
            if (typeof value === "string") {
              // Handle font names and other string values
              formattedValue = `"${value}"`;
            } else {
              continue; // Skip invalid string values
            }
          } else if (variable.resolvedType === "BOOLEAN") {
            if (typeof value === "boolean") {
              formattedValue = value ? "true" : "false";
            } else {
              continue; // Skip invalid boolean values
            }
          } else {
            continue; // Skip unknown types
          }

          // Add to base tokens section without excessive comments
          if (variable.resolvedType === "COLOR" &&
             typeof value === "object" &&
             "r" in value && "g" in value && "b" in value) {
            const r = Math.round(value.r * 255);
            const g = Math.round(value.g * 255);
            const b = Math.round(value.b * 255);
            const a = 'a' in value ? value.a : 1;

            // Convert to hex for reference
            const toHex = (val: number) => {
              const hex = val.toString(16);
              return hex.length === 1 ? '0' + hex : hex;
            };

            // Keep only the base variable definition without additional commentary
            baseTokensContent += `  --${formattedName}: ${formattedValue};\n`;
          } else {
            // Other variable types (numbers, strings, booleans)
            baseTokensContent += `  --${formattedName}: ${formattedValue};\n`;
          }
          hasValidVariables = true;
        }

        // Collection content is now processed into baseTokensContent
        // and semanticTokensContent, no need to append here anymore
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

      // Send the CSS content back to the UI
      figma.ui.postMessage({
        type: "css-export",
        cssData: cssContent,
        shouldDownload: msg.shouldDownload
      });
    } catch (error: any) {
      console.error("Error exporting CSS:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Error exporting CSS: ${error.message || "Unknown error"}`,
      });
    }
  } else if (msg.type === "export-angular") {
    // Existing Angular export functionality
  } else if (msg.type === "generate-test") {
    try {
      // Get the component data
      const componentId = msg.componentId || "";
      const component = componentMap.get(componentId);
      const generateAllVariants = msg.generateAllVariants === true;
      const commitToGitLab = msg.commitToGitLab === true;

      if (!component) {
        figma.ui.postMessage({
          type: "error",
          message: `Component with ID ${componentId} not found`,
        });
        return;
      }

      // Generate the test
      const testContent = generateJestTest(component, generateAllVariants);

      // Send the test content back to the UI
      figma.ui.postMessage({
        type: "test-generated",
        componentName: msg.componentName || component.name,
        testContent: testContent,
        commitToGitLab: commitToGitLab,
        isComponentSet: component.type === "COMPONENT_SET",
        hasAllVariants: generateAllVariants,
      });
    } catch (error: any) {
      console.error("Error generating test:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Error generating test: ${error.message || "Unknown error"}`,
      });
    }
  } else if (msg.type === "save-gitlab-settings") {
    try {
      const settings = {
        projectId: msg.projectId,
        gitlabToken: msg.gitlabToken,
        saveToken: msg.saveToken || false, // Whether to save the token
        savedAt: new Date().toISOString(),
        savedBy: figma.currentUser?.name || "Unknown user",
        branchName: msg.branchName || "feature",
        filePath: msg.filePath || "variables.css"
      };

      // If user didn't opt to save the token, don't store it
      if (!settings.saveToken) {
        delete settings.gitlabToken;
      }

      // Determine where to save based on sharing preference
      if (msg.shareWithTeam) {
        // Save to document storage (available to all team members)
        figma.root.setSharedPluginData(
          "aWallSync",
          "gitlab-settings",
          JSON.stringify(settings)
        );
        console.log("GitLab settings saved to document storage");

        // Also save to client storage as a backup
        await figma.clientStorage.setAsync("gitlab-settings", settings);
      } else {
        // Save only to client storage (personal)
        await figma.clientStorage.setAsync("gitlab-settings", settings);
        console.log("GitLab settings saved to client storage only");
      }

      figma.ui.postMessage({
        type: "gitlab-settings-saved",
        success: true,
        sharedWithTeam: msg.shareWithTeam,
      });
    } catch (error: any) {
      console.error("Error saving GitLab settings:", error);
      figma.ui.postMessage({
        type: "error",
        message: `Error saving GitLab settings: ${
          error.message || "Unknown error"
        }`,
      });
    }
  } else if (msg.type === "commit-test-to-gitlab") {
    try {
      if (
        !msg.projectId ||
        !msg.gitlabToken ||
        !msg.commitMessage ||
        !msg.testContent ||
        !msg.filePath
      ) {
        throw new Error("Missing required fields for GitLab test commit");
      }

      // Update UI with progress
      figma.ui.postMessage({
        type: "commit-progress",
        progress: 10,
        message: "Preparing to commit test file...",
      });

      // Construct the GitLab API URL using the project ID
      const gitlabApiUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/commits`;
      const filePath = msg.filePath;
      const branchName = msg.branchName || "feature";

      // First, check if the file exists
      const checkFileUrl = `https://gitlab.fhnw.ch/api/v4/projects/${
        msg.projectId
      }/repository/files/${encodeURIComponent(filePath)}?ref=${branchName}`;

      figma.ui.postMessage({
        type: "commit-progress",
        progress: 20,
        message: "Checking if file exists...",
      });

      const checkResponse = await fetch(checkFileUrl, {
        method: "GET",
        headers: {
          "PRIVATE-TOKEN": msg.gitlabToken,
        },
      });

      // Determine if we should create or update the file
      const fileExists = checkResponse.ok;
      let fileData = null;
      let action = "create";

      if (fileExists) {
        // Get the current content info for update
        fileData = await checkResponse.json();
        action = "update";

        figma.ui.postMessage({
          type: "commit-progress",
          progress: 40,
          message: "Updating existing test file...",
        });
      } else {
        figma.ui.postMessage({
          type: "commit-progress",
          progress: 40,
          message: "Creating new test file...",
        });
      }

      // Prepare the commit data
      const commitAction: {
        action: string;
        file_path: string;
        content: string;
        last_commit_id?: string;
        encoding?: string;
      } = {
        action: action,
        file_path: filePath,
        content: msg.testContent,
        encoding: "text"
      };

      // For file updates, if we have the last commit ID, use it for proper versioning
      if (action === "update" && fileData && fileData.last_commit_id) {
        commitAction.last_commit_id = fileData.last_commit_id;
      }

      const commitData = {
        branch: branchName,
        commit_message: msg.commitMessage,
        actions: [commitAction],
      };

      figma.ui.postMessage({
        type: "commit-progress",
        progress: 70,
        message: "Committing to GitLab...",
      });

      // Make the API request to GitLab
      const response = await fetch(gitlabApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PRIVATE-TOKEN": msg.gitlabToken,
        },
        body: JSON.stringify(commitData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Enhanced error handling for common GitLab issues
        if (response.status === 403) {
          throw new Error(`403 Forbidden - You are not allowed to push into branch '${branchName}'. This could be due to:\n\n1. Insufficient token permissions\n2. Branch protection rules\n3. Repository access restrictions\n\nPlease check:\n- Your GitLab token has 'write_repository' scope\n- You have Developer/Maintainer role on the project\n- The branch '${branchName}' allows pushes`);
        } else if (response.status === 401) {
          throw new Error("401 Unauthorized - Invalid or expired GitLab token. Please check your token in the Configuration tab.");
        } else if (response.status === 404) {
          throw new Error(`404 Not Found - Project ID '${msg.projectId}' not found. Please verify the project ID in the Configuration tab.`);
        }

        throw new Error(errorData.message || `Failed to commit test to GitLab (${response.status})`);
      }

      figma.ui.postMessage({
        type: "commit-progress",
        progress: 100,
        message: "Test file committed successfully!",
      });

      // Send success message back to UI
      figma.ui.postMessage({
        type: "commit-test-success",
        filePath: filePath
      });
    } catch (error: any) {
      console.error("Error committing test to GitLab:", error);
      figma.ui.postMessage({
        type: "commit-error",
        error: error.message || "Unknown error occurred while committing test",
      });
    }
  } else if (msg.type === "commit-to-gitlab") {
    try {
      // Enhanced logging for debugging
      console.log("=== GitLab Commit Debug Start ===");
      console.log("Message received:", {
        type: msg.type,
        projectId: msg.projectId,
        hasToken: !!msg.gitlabToken,
        tokenLength: msg.gitlabToken ? msg.gitlabToken.length : 0,
        commitMessage: msg.commitMessage,
        filePath: msg.filePath,
        hasCssData: !!msg.cssData,
        cssDataLength: msg.cssData ? msg.cssData.length : 0
      });

      if (
        !msg.projectId ||
        !msg.gitlabToken ||
        !msg.commitMessage ||
        !msg.cssData
      ) {
        throw new Error("Missing required fields for GitLab commit");
      }

      // Construct the GitLab API URL using the project ID
      const gitlabApiUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/commits`;
      const filePath = msg.filePath || 'variables.css'; // Revert to simple file path

      console.log("GitLab API Details:", {
        apiUrl: gitlabApiUrl,
        filePath: filePath,
        tokenPrefix: msg.gitlabToken.substring(0, 8) + "..." // Safe token logging
      });

      // Step 1: Test basic project access
      console.log("Step 1: Testing project access...");
      const projectTestUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}`;
      const projectTestResponse = await fetch(projectTestUrl, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': msg.gitlabToken
        }
      });

      console.log("Project access test:", {
        status: projectTestResponse.status,
        statusText: projectTestResponse.statusText,
        ok: projectTestResponse.ok
      });

      if (!projectTestResponse.ok) {
        const projectError = await projectTestResponse.json();
        console.error("Project access failed:", projectError);
        throw new Error(`Cannot access project: ${projectTestResponse.status} ${projectTestResponse.statusText}`);
      }

      const projectInfo = await projectTestResponse.json();
      console.log("Project info:", {
        name: projectInfo.name,
        defaultBranch: projectInfo.default_branch,
        permissions: projectInfo.permissions
      });

      // Step 2: Check file existence
      const targetBranch = msg.branchName || 'feature';
      console.log("Step 2: Checking file existence...");
      const checkFileUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${targetBranch}`;
      console.log("File check URL:", checkFileUrl);

      const checkResponse = await fetch(checkFileUrl, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': msg.gitlabToken
        }
      });

      console.log("File existence check:", {
        status: checkResponse.status,
        statusText: checkResponse.statusText,
        ok: checkResponse.ok
      });

      // Determine if we should create or update the file
      const fileExists = checkResponse.ok;
      const action = fileExists ? 'update' : 'create';

      console.log("File action determined:", {
        fileExists: fileExists,
        action: action
      });

      // Step 3: Check branch permissions
      console.log("Step 3: Testing branch access...");
      const branchTestUrl = `https://gitlab.fhnw.ch/api/v4/projects/${msg.projectId}/repository/branches/${targetBranch}`;
      const branchTestResponse = await fetch(branchTestUrl, {
        method: 'GET',
        headers: {
          'PRIVATE-TOKEN': msg.gitlabToken
        }
      });

      console.log("Branch access test:", {
        status: branchTestResponse.status,
        statusText: branchTestResponse.statusText,
        ok: branchTestResponse.ok
      });

      if (branchTestResponse.ok) {
        const branchInfo = await branchTestResponse.json();
        console.log("Branch info:", {
          name: branchInfo.name,
          protected: branchInfo.protected,
          can_push: branchInfo.can_push,
          developers_can_push: branchInfo.developers_can_push,
          developers_can_merge: branchInfo.developers_can_merge
        });

        if (branchInfo.protected && !branchInfo.can_push) {
          console.warn("WARNING: Branch is protected and user cannot push!");
        }
      }

      // Prepare the commit data (simplified version)
      const commitData = {
        branch: msg.branchName || 'feature',
        commit_message: msg.commitMessage,
        actions: [
          {
            action: action,
            file_path: filePath,
            content: msg.cssData
          }
        ]
      };

      console.log("Commit data prepared:", {
        branch: commitData.branch,
        message: commitData.commit_message,
        actionType: commitData.actions[0].action,
        filePath: commitData.actions[0].file_path,
        contentLength: commitData.actions[0].content.length
      });

      // Step 4: Attempt the commit
      console.log("Step 4: Attempting GitLab commit...");
      const response = await fetch(gitlabApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PRIVATE-TOKEN": msg.gitlabToken,
        },
        body: JSON.stringify(commitData),
      });

      console.log("Commit response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: 'Headers object (cannot enumerate in this environment)'
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("GitLab API Error Response:", errorData);
        } catch (jsonError) {
          console.error("Failed to parse error response as JSON:", jsonError);
          errorData = { message: `HTTP ${response.status} ${response.statusText}` };
        }

        // Enhanced error handling for common GitLab issues
        if (response.status === 403) {
          console.error("=== 403 FORBIDDEN ERROR ANALYSIS ===");
          console.error("This means the API call was authenticated but not authorized");
          console.error("Possible causes:");
          console.error("1. Token missing 'write_repository' or 'api' scope");
          console.error("2. User role insufficient (needs Developer+ for unprotected, Maintainer+ for protected)");
          console.error("3. Branch protection rules blocking the push");
          console.error("4. Repository settings preventing commits");
          console.error("Error details:", errorData);

          throw new Error(`403 Forbidden - You are not allowed to push into this branch. This could be due to:\n\n1. Insufficient token permissions\n2. Branch protection rules\n3. Repository access restrictions\n\nPlease check:\n- Your GitLab token has 'write_repository' scope\n- You have Developer/Maintainer role on the project\n- The target branch allows pushes\n\nDetailed error: ${errorData.message || 'No additional details'}`);
        } else if (response.status === 401) {
          console.error("=== 401 UNAUTHORIZED ERROR ===");
          console.error("Token authentication failed");
          console.error("Error details:", errorData);
          throw new Error("401 Unauthorized - Invalid or expired GitLab token. Please check your token in the Configuration tab.");
        } else if (response.status === 404) {
          console.error("=== 404 NOT FOUND ERROR ===");
          console.error("Project or resource not found");
          console.error("Error details:", errorData);
          throw new Error(`404 Not Found - Project ID '${msg.projectId}' not found. Please verify the project ID in the Configuration tab.`);
        }

        console.error("=== UNEXPECTED ERROR ===");
        console.error("Status:", response.status);
        console.error("Error data:", errorData);
        throw new Error(errorData.message || `Failed to commit to GitLab (${response.status})`);
      }

      const successData = await response.json();
      console.log("=== COMMIT SUCCESS ===");
      console.log("Success response:", successData);

      // Send success message back to UI
      figma.ui.postMessage({
        type: "commit-success",
      });
    } catch (error: any) {
      console.error("=== GitLab Commit Error ===");
      console.error("Error object:", error);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);

      figma.ui.postMessage({
        type: "commit-error",
        error: error.message || "Unknown error occurred",
      });
    } finally {
      console.log("=== GitLab Commit Debug End ===");
    }
  }
};
