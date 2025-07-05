import { Component } from '../types';
import { parseComponentName, generateStyleChecks, createTestWithStyleChecks, normalizeColorForTesting, normalizeComplexColorValue } from '../utils/componentUtils';

export class ComponentService {
  private static componentMap = new Map<string, Component>();
  private static allVariables = new Map<string, any>();

  /**
   * Checks if a CSS property is a simple color property (contains only color values)
   */
  private static isSimpleColorProperty(property: string): boolean {
    const simpleColorProperties = [
      'accentColor',
      'backgroundColor',
      'borderColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'borderBlockColor',
      'borderInlineColor',
      'borderBlockStartColor',
      'borderBlockEndColor',
      'borderInlineStartColor',
      'borderInlineEndColor',
      'caretColor',
      'color',
      'outlineColor',
      'textDecorationColor',
      'textEmphasisColor',
      'columnRuleColor',
      'fill',
      'stroke',
      'floodColor',
      'lightingColor',
      'stopColor',
      'scrollbarColor',
      'selectionBackgroundColor',
      'selectionColor'
    ];
    return simpleColorProperties.indexOf(property) !== -1;
  }

  /**
   * Checks if a CSS property is a complex property that may contain colors
   */
  private static isComplexColorProperty(property: string): boolean {
    const complexColorProperties = [
      'background',
      'border',
      'borderTop',
      'borderRight',
      'borderBottom',
      'borderLeft',
      'outline',
      'boxShadow',
      'textShadow',
      'dropShadow'
    ];
    return complexColorProperties.indexOf(property) !== -1;
  }

  /**
   * Normalizes style values, especially colors for consistent testing
   */
  private static normalizeStyleValue(property: string, value: any): any {
    if (typeof value !== 'string') {
      return value;
    }

    if (this.isSimpleColorProperty(property)) {
      return normalizeColorForTesting(value);
    }
    
    if (this.isComplexColorProperty(property)) {
      return normalizeComplexColorValue(value);
    }
    
    return value;
  }

  static async collectComponents(): Promise<Component[]> {
    // Collect all variables for resolution
    await this.collectAllVariables();
    const componentsData: Component[] = [];
    const componentSets: Component[] = [];
    this.componentMap = new Map<string, Component>();

    // First pass to collect all components and component sets
    async function collectNodes(node: BaseNode) {
      if ("type" in node) {
        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
          const componentStyles = await node.getCSSAsync();
          // Resolve variable references in styles
          const resolvedStyles = ComponentService.resolveStyleVariables(componentStyles);
          
          const componentData: Component = {
            id: node.id,
            name: node.name,
            type: node.type,
            styles: resolvedStyles,
            pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
            parentId: node.parent?.id,
            children: [],
          };

          ComponentService.componentMap.set(node.id, componentData);

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
        const parent = this.componentMap.get(component.parentId);
        if (parent && parent.type === "COMPONENT_SET") {
          parent.children.push(component);
          component.isChild = true; // Mark as child for UI rendering
        }
      }
    }

    // Create final hierarchical data with only top-level components and component sets
    return [...componentSets, ...componentsData.filter((comp) => !comp.isChild)];
  }

  static getComponentById(id: string): Component | undefined {
    return this.componentMap.get(id);
  }

  static generateTest(component: Component, generateAllVariants = false): string {
    // Extract component name and create a kebab case version for file naming
    const componentName = component.name;
    const kebabName = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Determine if this is a component set or a regular component
    const isComponentSet = component.type === "COMPONENT_SET";

    // If this is a component set and we want to generate tests for all variants
    if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
      return this.generateComponentSetTest(component);
    }

    // Parse the styles to extract the relevant CSS properties
    let styles;
    try {
      styles = typeof component.styles === "string" ? JSON.parse(component.styles) : component.styles;
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
        let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        
        // Handle special cases where CSS property names need to be mapped to correct JS property names
        if (camelCaseKey === 'background') {
          camelCaseKey = 'backgroundColor';
        }

        styleChecks.push({
          property: camelCaseKey,
          value: this.normalizeStyleValue(camelCaseKey, styles[key]),
        });
      }
    }

    // For component sets, we'll create a test that checks the default variant
    // For regular components, we'll create a standard test
    if (isComponentSet) {
      // For component sets, we need to find the default variant
      const defaultVariant = component.children && component.children.length > 0 ? component.children[0] : null;

      if (defaultVariant) {
        // Use the default variant's styles
        let variantStyles;
        try {
          variantStyles = typeof defaultVariant.styles === "string" ? JSON.parse(defaultVariant.styles) : defaultVariant.styles;
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
            let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            
            // Handle special cases where CSS property names need to be mapped to correct JS property names
            if (camelCaseKey === 'background') {
              camelCaseKey = 'backgroundColor';
            }

            variantStyleChecks.push({
              property: camelCaseKey,
              value: this.normalizeStyleValue(camelCaseKey, variantStyles[key]),
            });
          }
        }

        return createTestWithStyleChecks(componentName, kebabName, variantStyleChecks);
      }
    }

    // For regular components or if no default variant is found, create a standard test
    return createTestWithStyleChecks(componentName, kebabName, styleChecks);
  }

  private static generateComponentSetTest(componentSet: Component): string {
    if (!componentSet.children || componentSet.children.length === 0) {
      return this.generateTest(componentSet); // Fallback to standard test if no variants
    }

    // Only use the first variant (default variant)
    const defaultVariant = componentSet.children[0];
    
    // Parse the default variant styles
    let variantStyles;
    try {
      variantStyles = typeof defaultVariant.styles === "string" ? JSON.parse(defaultVariant.styles) : defaultVariant.styles;
    } catch (e) {
      console.error("Error parsing default variant styles:", e);
      variantStyles = {};
    }

    // Extract all CSS properties for the default variant
    const styleChecks = [];
    for (const key in variantStyles) {
      if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
        let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        
        // Handle special cases where CSS property names need to be mapped to correct JS property names
        if (camelCaseKey === 'background') {
          camelCaseKey = 'backgroundColor';
        }
        styleChecks.push({
          property: camelCaseKey,
          value: this.normalizeStyleValue(camelCaseKey, variantStyles[key]),
        });
      }
    }

    // Generate test for the default variant only
    return createTestWithStyleChecks(componentSet.name, 
      componentSet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), 
      styleChecks);
  }

  // Collect all variables for resolution purposes
  private static async collectAllVariables(): Promise<void> {
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      this.allVariables.clear();
      
      for (const collection of collections) {
        for (const variableId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (variable) {
            this.allVariables.set(variable.id, variable);
            // Also map by formatted name for easier lookup
            const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
            this.allVariables.set(formattedName, variable);
          }
        }
      }
    } catch (error) {
      console.error("Error collecting variables:", error);
    }
  }

  // Process component styles to resolve variable names for better readability
  private static resolveStyleVariables(styles: any): any {
    if (!styles || typeof styles !== 'object') {
      return styles;
    }

    const resolvedStyles = { ...styles };
    
    // Convert CSS with variable IDs to readable variable names
    for (const property in styles) {
      if (styles.hasOwnProperty(property)) {
        const value = styles[property];
        if (typeof value === 'string') {
          // Replace variable IDs with readable names
          resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
        }
      }
    }

    return resolvedStyles;
  }

  // Replace variable IDs in CSS values with readable variable names
  private static replaceVariableIdsWithNames(cssValue: string): string {
    // Match patterns like: VariableID:123:456/1.0 or var(--internal-variable-id)
    return cssValue.replace(/VariableID:([a-f0-9:]+)\/[\d.]+/g, (match, variableId) => {
      // Find the variable by ID
      for (const variable of this.allVariables.values()) {
        if (variable.id === variableId.replace(/:/g, ':')) {
          const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          return `var(--${formattedName})`;
        }
      }
      return match; // Return original if not found
    }).replace(/var\(--[a-f0-9-]+\)/g, (match) => {
      // Handle internal Figma variable references
      const varId = match.replace(/var\(--([^)]+)\)/, '$1');
      for (const variable of this.allVariables.values()) {
        if (variable.id.includes(varId) || varId.includes(variable.id)) {
          const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          return `var(--${formattedName})`;
        }
      }
      return match; // Return original if not found
    });
  }
} 