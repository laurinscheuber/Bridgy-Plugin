import { Component } from '../types';
import { parseComponentName, generateStyleChecks, createTestWithStyleChecks } from '../utils/componentUtils';

export class ComponentService {
  private static componentMap = new Map<string, Component>();

  static async collectComponents(): Promise<Component[]> {
    const componentsData: Component[] = [];
    const componentSets: Component[] = [];
    this.componentMap = new Map<string, Component>();

    // First pass to collect all components and component sets
    async function collectNodes(node: BaseNode) {
      if ("type" in node) {
        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
          const componentStyles = await node.getCSSAsync();
          const componentData: Component = {
            id: node.id,
            name: node.name,
            type: node.type,
            styles: componentStyles,
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
        const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

        styleChecks.push({
          property: camelCaseKey,
          value: styles[key],
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
            const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

            variantStyleChecks.push({
              property: camelCaseKey,
              value: variantStyles[key],
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
    componentSet.children.forEach((variant: Component, index: number) => {
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
        variantStyles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
      } catch (e) {
        console.error("Error parsing variant styles:", e);
        variantStyles = {};
      }

      // Extract all CSS properties for this variant
      const styleChecks = [];
      for (const key in variantStyles) {
        if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
          const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          styleChecks.push({
            property: camelCaseKey,
            value: variantStyles[key],
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
} 