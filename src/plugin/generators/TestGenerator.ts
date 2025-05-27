import { ComponentData } from '../../shared/types';
import { toKebabCase, toPascalCase, parseComponentName } from '../../shared/utils';

/**
 * Generates Jest tests for Angular components
 */
export class TestGenerator {
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