// aWall Synch plugin - Refactored modular code
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"

/// <reference types="@figma/plugin-typings" />

// ================== SHARED TYPES ==================
// Shared types for the aWall Synch plugin

interface VariableData {
  id: string;
  name: string;
  variableType: string;
  valuesByMode: Array<{
    modeName: string;
    value: any;
  }>;
}

interface VariableCollectionData {
  name: string;
  variables: VariableData[];
}

interface ComponentData {
  id: string;
  name: string;
  type: string;
  styles: string;
  pageName: string;
  parentId?: string;
  children: ComponentData[];
  isChild?: boolean;
}

interface GitLabSettings {
  projectId: string;
  gitlabToken?: string;
  saveToken?: boolean;
  savedAt?: string;
  savedBy?: string;
  branchName?: string;
  filePath?: string;
  testPath?: string;
  componentTestPath?: string;
  createMergeRequest?: boolean;
  branchStrategy?: string;
  featurePrefix?: string;
}

interface PluginMessage {
  type: string;
  [key: string]: any;
}

interface TestGenerationOptions {
  componentId: string;
  componentName: string;
  generateAllVariants?: boolean;
  commitToGitLab?: boolean;
}

interface GitLabCommitOptions {
  projectId: string;
  gitlabToken: string;
  commitMessage: string;
  filePath: string;
  branchName?: string;
  content: string;
  createMergeRequest?: boolean;
}

// ================== SHARED CONSTANTS ==================
// Shared constants for the aWall Synch plugin

const PLUGIN_NAME = "aWallSync";
const GITLAB_API_BASE = "https://gitlab.fhnw.ch/api/v4";

const MESSAGE_TYPES = {
  EXPORT_CSS: "export-css",
  GENERATE_TEST: "generate-test",
  COMMIT_TO_GITLAB: "commit-to-gitlab",
  COMMIT_TEST_TO_GITLAB: "commit-test-to-gitlab",
  SAVE_GITLAB_SETTINGS: "save-gitlab-settings",
  DOCUMENT_DATA: "document-data",
  CSS_EXPORT: "css-export",
  TEST_GENERATED: "test-generated",
  COMMIT_SUCCESS: "commit-success",
  COMMIT_ERROR: "commit-error",
  COMMIT_PROGRESS: "commit-progress",
  ERROR: "error",
  GITLAB_SETTINGS_LOADED: "gitlab-settings-loaded",
  GITLAB_SETTINGS_SAVED: "gitlab-settings-saved"
} as const;

const DEFAULT_PATHS = {
  CSS_VARIABLES: "src/variables.css",
  TEST_FILES: "src/tests",
  COMPONENT_TESTS: "src/components/{component-name}/test"
} as const;

const BRANCH_STRATEGIES = {
  DEFAULT: "default",
  FEATURE: "feature"
} as const;

// ================== SHARED UTILS ==================
// Shared utility functions

/**
 * Converts a string to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Converts a string to PascalCase
 */
function toPascalCase(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Formats a CSS variable name with collection prefix
 */
function formatCSSVariableName(collectionName: string, variableName: string): string {
  const collection = toKebabCase(collectionName);
  const variable = toKebabCase(variableName);
  return `--${collection}-${variable}`;
}

/**
 * Converts RGBA values to hex color
 */
function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (value: number) => {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  if (a === 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const alphaHex = Math.round(a * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaHex)}`;
}

/**
 * Parses component name to extract type and state information
 */
function parseComponentName(name: string): {
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

/**
 * Generates a timestamp for feature branches
 */
function generateTimestamp(): string {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 12);
}

/**
 * Creates a feature branch name from commit message
 */
function createFeatureBranchName(commitMessage: string, prefix: string = "feature/"): string {
  const timestamp = generateTimestamp();
  const branchBase = commitMessage
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  
  return `${prefix}${branchBase}-${timestamp}`;
}

// ================== VARIABLE COLLECTOR ==================
/**
 * Collects variables from Figma document
 */
class VariableCollector {
  /**
   * Collects all variables from the Figma document
   */
  static async collectAll(): Promise<VariableCollectionData[]> {
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const variablesData: VariableCollectionData[] = [];

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
          variableType: variable.resolvedType,
          valuesByMode: valuesByModeEntries,
        } as VariableData;
      });

      const variablesResult = await Promise.all(variablesPromises);
      const variables = variablesResult.filter((item) => item !== null) as VariableData[];

      variablesData.push({
        name: collection.name,
        variables: variables,
      });
    }

    return variablesData;
  }
}

// ================== COMPONENT COLLECTOR ==================
/**
 * Collects components from Figma document
 */
class ComponentCollector {
  private static componentMap = new Map<string, ComponentData>();

  /**
   * Collects all components from the Figma document
   */
  static async collectAll(): Promise<ComponentData[]> {
    const componentsData: ComponentData[] = [];
    const componentSets: ComponentData[] = [];
    this.componentMap = new Map<string, ComponentData>();

    // First pass to collect all components and component sets
    for (const page of figma.root.children) {
      await this.collectNodes(page, componentsData, componentSets);
    }

    // Second pass to establish parent-child relationships for component sets
    for (const component of componentsData) {
      if (component.parentId) {
        const parent = this.componentMap.get(component.parentId);
        if (parent && parent.type === "COMPONENT_SET") {
          parent.children.push(component);
          component.isChild = true; // Mark as child for UI rendering
        }
      }
    }

    // Create final hierarchical data with only top-level components and component sets
    return [
      ...componentSets,
      ...componentsData.filter((comp) => !comp.isChild),
    ];
  }

  /**
   * Gets a component by ID from the internal map
   */
  static getComponent(id: string): ComponentData | undefined {
    return this.componentMap.get(id);
  }

  /**
   * Recursively collects nodes from the document
   */
  private static async collectNodes(
    node: BaseNode,
    componentsData: ComponentData[],
    componentSets: ComponentData[]
  ): Promise<void> {
    if ("type" in node) {
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        const componentStyles = await node.getCSSAsync();
        const componentData: ComponentData = {
          id: node.id,
          name: node.name,
          type: node.type,
          styles: JSON.stringify(componentStyles),
          pageName:
            node.parent && "name" in node.parent ? node.parent.name : "Unknown",
          parentId: node.parent?.id,
          children: [],
        };

        this.componentMap.set(node.id, componentData);

        if (node.type === "COMPONENT_SET") {
          componentSets.push(componentData);
        } else {
          componentsData.push(componentData);
        }
      }

      if ("children" in node) {
        for (const child of node.children) {
          await this.collectNodes(child, componentsData, componentSets);
        }
      }
    }
  }
}

// ================== CSS GENERATOR ==================
/**
 * Generates CSS from Figma variables
 */
class CSSGenerator {
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

// ================== TEST GENERATOR ==================
/**
 * Generates Jest tests for Angular components
 */
class TestGenerator {
  /**
   * Generates a Jest test for a component
   */
  static generate(component: ComponentData, generateAllVariants = false): string {
    const componentName = component.name;
    const kebabName = toKebabCase(componentName);

    // Determine if this is a component set or a regular component
    const isComponentSet = component.type === "COMPONENT_SET";

    // If this is a component set and we want to generate tests for all variants
    if (
      isComponentSet &&
      generateAllVariants &&
      component.children &&
      component.children.length > 0
    ) {
      return this.generateComponentSetTest(component);
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
    const styleChecks = this.extractStyleChecks(styles);

    // For component sets, we'll create a test that checks the default variant
    let testContent = "";

    if (isComponentSet) {
      // For component sets, we need to find the default variant
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

        const variantStyleChecks = this.extractStyleChecks(variantStyles);
        testContent = this.createTestWithStyleChecks(
          componentName,
          kebabName,
          variantStyleChecks
        );
      } else {
        testContent = this.createTestWithStyleChecks(
          componentName,
          kebabName,
          styleChecks
        );
      }
    } else {
      // For regular components, create a standard test
      testContent = this.createTestWithStyleChecks(
        componentName,
        kebabName,
        styleChecks
      );
    }

    return testContent;
  }

  /**
   * Generates comprehensive test for a component set with all variants
   */
  private static generateComponentSetTest(componentSet: ComponentData): string {
    if (!componentSet.children || componentSet.children.length === 0) {
      return this.generate(componentSet); // Fallback to standard test if no variants
    }

    const componentName = componentSet.name;
    const kebabName = toKebabCase(componentName);
    const pascalName = toPascalCase(componentName);

    // Start building the test file
    let testContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';

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
    componentSet.children.forEach((variant: ComponentData, index: number) => {
      // Extract state and type information from the variant name
      const parsedName = parseComponentName(variant.name);
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
      const styleChecks = this.extractStyleChecks(variantStyles);

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

${this.generateStyleChecks(styleChecks)}
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

  /**
   * Extracts style checks from styles object
   */
  private static extractStyleChecks(styles: any): Array<{ property: string; value: string }> {
    const styleChecks: Array<{ property: string; value: string }> = [];

    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        // Convert kebab-case to camelCase for JavaScript property access
        const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        let value = styles[key];
        
        // Extract fallback value from CSS variables
        if (typeof value === 'string' && value.includes('var(--')) {
          value = value.replace(/var\(--[^)]+,\s*([^)]+)\)/g, '$1').trim();
        }

        styleChecks.push({
          property: camelCaseKey,
          value: value,
        });
      }
    }

    return styleChecks;
  }

  /**
   * Helper function to generate style checks
   */
  private static generateStyleChecks(
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

  /**
   * Helper function to create a test with dynamic style checks
   */
  private static createTestWithStyleChecks(
    componentName: string,
    kebabName: string,
    styleChecks: Array<{ property: string; value: string }>
  ): string {
    const pascalName = toPascalCase(componentName);

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
}

// ================== GITLAB API ==================
/**
 * GitLab API integration
 */
class GitLabAPI {
  /**
   * Commits content to GitLab repository
   */
  static async commitFile(options: GitLabCommitOptions): Promise<void> {
    const {
      projectId,
      gitlabToken,
      commitMessage,
      filePath,
      branchName = "main",
      content
    } = options;

    // Construct the GitLab API URL
    const gitlabApiUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/commits`;

    // First, check if the file exists
    const fileExists = await this.checkFileExists(projectId, gitlabToken, filePath, branchName);
    
    // Prepare the commit action
    const commitAction: any = {
      action: fileExists ? "update" : "create",
      file_path: filePath,
      content: content,
      encoding: "text"
    };

    // For file updates, get the last commit ID for proper versioning
    if (fileExists) {
      const fileData = await this.getFileInfo(projectId, gitlabToken, filePath, branchName);
      if (fileData && fileData.last_commit_id) {
        commitAction.last_commit_id = fileData.last_commit_id;
      }
    }

    const commitData = {
      branch: branchName,
      commit_message: commitMessage,
      actions: [commitAction],
    };

    // Make the API request to GitLab
    const response = await fetch(gitlabApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify(commitData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to commit to GitLab");
    }
  }

  /**
   * Commits a test file to GitLab with progress updates
   */
  static async commitTestFile(
    options: GitLabCommitOptions,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      progressCallback?.(10, "Preparing to commit test file...");

      const {
        projectId,
        gitlabToken,
        commitMessage,
        filePath,
        branchName = "main",
        content
      } = options;

      // Construct the GitLab API URL
      const gitlabApiUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/commits`;

      progressCallback?.(20, "Checking if file exists...");

      // Check if the file exists
      const fileExists = await this.checkFileExists(projectId, gitlabToken, filePath, branchName);
      
      progressCallback?.(40, fileExists ? "Updating existing test file..." : "Creating new test file...");

      // Prepare the commit action
      const commitAction: any = {
        action: fileExists ? "update" : "create",
        file_path: filePath,
        content: content,
        encoding: "text"
      };

      // For file updates, get the last commit ID
      if (fileExists) {
        const fileData = await this.getFileInfo(projectId, gitlabToken, filePath, branchName);
        if (fileData && fileData.last_commit_id) {
          commitAction.last_commit_id = fileData.last_commit_id;
        }
      }

      const commitData = {
        branch: branchName,
        commit_message: commitMessage,
        actions: [commitAction],
      };

      progressCallback?.(70, "Committing to GitLab...");

      // Make the API request to GitLab
      const response = await fetch(gitlabApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PRIVATE-TOKEN": gitlabToken,
        },
        body: JSON.stringify(commitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to commit test to GitLab");
      }

      progressCallback?.(100, "Test file committed successfully!");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checks if a file exists in the repository
   */
  private static async checkFileExists(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    branchName: string
  ): Promise<boolean> {
    const checkFileUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${branchName}`;
    
    const checkResponse = await fetch(checkFileUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    return checkResponse.ok;
  }

  /**
   * Gets file information from the repository
   */
  private static async getFileInfo(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    branchName: string
  ): Promise<any> {
    const checkFileUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${branchName}`;
    
    const response = await fetch(checkFileUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  }
}

// ================== SETTINGS MANAGER ==================
/**
 * Manages plugin settings storage
 */
class SettingsManager {
  /**
   * Saves GitLab settings to Figma storage
   */
  static async saveGitLabSettings(settings: GitLabSettings, shareWithTeam: boolean = false): Promise<void> {
    const settingsWithMetadata = {
      ...settings,
      savedAt: new Date().toISOString(),
      savedBy: figma.currentUser?.name || "Unknown user",
    };

    // If user didn't opt to save the token, don't store it
    if (!settings.saveToken) {
      delete settingsWithMetadata.gitlabToken;
    }

    // Determine where to save based on sharing preference
    if (shareWithTeam) {
      // Save to document storage (available to all team members)
      figma.root.setSharedPluginData(
        PLUGIN_NAME,
        "gitlab-settings",
        JSON.stringify(settingsWithMetadata)
      );
      console.log("GitLab settings saved to document storage");

      // Also save to client storage as a backup
      await figma.clientStorage.setAsync("gitlab-settings", settingsWithMetadata);
    } else {
      // Save only to client storage (personal)
      await figma.clientStorage.setAsync("gitlab-settings", settingsWithMetadata);
      console.log("GitLab settings saved to client storage only");
    }
  }

  /**
   * Loads GitLab settings from Figma storage
   */
  static async loadGitLabSettings(): Promise<GitLabSettings | null> {
    try {
      // Try to load settings from the document (available to all team members)
      const documentSettings = await figma.root.getSharedPluginData(
        PLUGIN_NAME,
        "gitlab-settings"
      );
      
      if (documentSettings) {
        try {
          const settings = JSON.parse(documentSettings);
          console.log("GitLab settings loaded from document storage");
          return settings;
        } catch (parseError) {
          console.error("Error parsing document settings:", parseError);
        }
      }

      // Fallback to client storage if document storage doesn't have settings
      const clientSettings = await figma.clientStorage.getAsync("gitlab-settings");
      if (clientSettings) {
        console.log("GitLab settings loaded from client storage");
        return clientSettings;
      }

      return null;
    } catch (error) {
      console.error("Error loading GitLab settings:", error);
      return null;
    }
  }

  /**
   * Clears GitLab settings from storage
   */
  static async clearGitLabSettings(): Promise<void> {
    try {
      // Clear from document storage
      figma.root.setSharedPluginData(PLUGIN_NAME, "gitlab-settings", "");
      
      // Clear from client storage
      await figma.clientStorage.setAsync("gitlab-settings", null);
      
      console.log("GitLab settings cleared");
    } catch (error) {
      console.error("Error clearing GitLab settings:", error);
    }
  }
}

// ================== MAIN PLUGIN CODE ==================
// Main plugin entry point

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

/**
 * Main plugin initialization
 */
async function initializePlugin() {
  try {
    // Collect all data from the document
    const [variablesData, componentsData] = await Promise.all([
      VariableCollector.collectAll(),
      ComponentCollector.collectAll()
    ]);

    // Send the data to the UI
    figma.ui.postMessage({
      type: MESSAGE_TYPES.DOCUMENT_DATA,
      variablesData,
      componentsData,
    });

    // Load saved GitLab settings
    const settings = await SettingsManager.loadGitLabSettings();
    if (settings) {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.GITLAB_SETTINGS_LOADED,
        settings: settings,
      });
    }
  } catch (error) {
    console.error("Plugin initialization error:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles CSS export requests
 */
async function handleCSSExport(msg: PluginMessage) {
  try {
    const variablesData = await VariableCollector.collectAll();
    const cssContent = await CSSGenerator.generate(variablesData);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.CSS_EXPORT,
      cssData: cssContent,
      shouldDownload: msg.shouldDownload
    });
  } catch (error) {
    console.error("Error exporting CSS:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error exporting CSS: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles test generation requests
 */
async function handleTestGeneration(msg: TestGenerationOptions) {
  try {
    const component = ComponentCollector.getComponent(msg.componentId);
    if (!component) {
      throw new Error(`Component with ID ${msg.componentId} not found`);
    }

    const testContent = TestGenerator.generate(component, msg.generateAllVariants);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.TEST_GENERATED,
      componentName: msg.componentName || component.name,
      testContent: testContent,
      commitToGitLab: msg.commitToGitLab,
      isComponentSet: component.type === "COMPONENT_SET",
      hasAllVariants: msg.generateAllVariants,
    });
  } catch (error) {
    console.error("Error generating test:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error generating test: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles GitLab settings save requests
 */
async function handleSaveGitLabSettings(msg: PluginMessage) {
  try {
    const settings = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      saveToken: msg.saveToken || false,
      branchName: msg.branchName || "main",
      filePath: msg.filePath || DEFAULT_PATHS.CSS_VARIABLES,
      testPath: msg.testPath || DEFAULT_PATHS.TEST_FILES,
      componentTestPath: msg.componentTestPath || DEFAULT_PATHS.COMPONENT_TESTS,
      createMergeRequest: msg.createMergeRequest || false,
      branchStrategy: msg.branchStrategy || "default",
      featurePrefix: msg.featurePrefix || "feature/",
    };

    await SettingsManager.saveGitLabSettings(settings, msg.shareWithTeam);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.GITLAB_SETTINGS_SAVED,
      success: true,
      sharedWithTeam: msg.shareWithTeam,
    });
  } catch (error) {
    console.error("Error saving GitLab settings:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error saving GitLab settings: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles GitLab commit requests
 */
async function handleGitLabCommit(msg: PluginMessage) {
  try {
    if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
      throw new Error("Missing required fields for GitLab commit");
    }

    const filePath = msg.filePath || DEFAULT_PATHS.CSS_VARIABLES;
    const branchName = msg.branchName || "main";

    const commitOptions: GitLabCommitOptions = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      commitMessage: msg.commitMessage,
      filePath: filePath,
      branchName: branchName,
      content: msg.cssData,
      createMergeRequest: msg.createMergeRequest,
    };

    await GitLabAPI.commitFile(commitOptions);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_SUCCESS,
    });
  } catch (error) {
    console.error("Error committing to GitLab:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_ERROR,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Handles GitLab test commit requests
 */
async function handleGitLabTestCommit(msg: PluginMessage) {
  try {
    if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.testContent || !msg.filePath) {
      throw new Error("Missing required fields for GitLab test commit");
    }

    const commitOptions: GitLabCommitOptions = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      commitMessage: msg.commitMessage,
      filePath: msg.filePath,
      branchName: msg.branchName || "main",
      content: msg.testContent,
    };

    // Use GitLabAPI with progress callback
    await GitLabAPI.commitTestFile(commitOptions, (progress, message) => {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.COMMIT_PROGRESS,
        progress,
        message,
      });
    });

    figma.ui.postMessage({
      type: "commit-test-success",
      filePath: msg.filePath
    });
  } catch (error) {
    console.error("Error committing test to GitLab:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_ERROR,
      error: error instanceof Error ? error.message : "Unknown error occurred while committing test",
    });
  }
}

// Message handler
figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case MESSAGE_TYPES.EXPORT_CSS:
      await handleCSSExport(msg);
      break;
    
    case MESSAGE_TYPES.GENERATE_TEST:
      await handleTestGeneration({
        componentId: msg.componentId,
        componentName: msg.componentName,
        generateAllVariants: msg.generateAllVariants,
        commitToGitLab: msg.commitToGitLab
      });
      break;
    
    case MESSAGE_TYPES.SAVE_GITLAB_SETTINGS:
      await handleSaveGitLabSettings(msg);
      break;
    
    case MESSAGE_TYPES.COMMIT_TO_GITLAB:
      await handleGitLabCommit(msg);
      break;
    
    case MESSAGE_TYPES.COMMIT_TEST_TO_GITLAB:
      await handleGitLabTestCommit(msg);
      break;
    
    default:
      console.warn(`Unknown message type: ${msg.type}`);
  }
};

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

// Initialize the plugin
initializePlugin();