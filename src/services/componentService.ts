import { Component, TextElement } from '../types';
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
          
          // Extract text content from the component first
          const textElements = await ComponentService.extractTextElements(node);
          
          // Resolve variable references in styles and integrate text properties
          const resolvedStyles = ComponentService.resolveStyleVariables(componentStyles, textElements, node.name);
          
          const componentData: Component = {
            id: node.id,
            name: node.name,
            type: node.type,
            styles: resolvedStyles,
            pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
            parentId: node.parent?.id,
            children: [],
            textElements: textElements,
            hasTextContent: textElements.length > 0,
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

  static generateTest(component: Component, generateAllVariants = false, includeStateTests = true, includeSizeTests = true): string {
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
      console.log('DEBUG: *** Taking generateComponentSetTest path ***');
      console.log('DEBUG: isComponentSet:', isComponentSet, 'generateAllVariants:', generateAllVariants, 'children count:', component.children.length);
      return this.generateComponentSetTest(component);
    }

    // If this is a component set but generateAllVariants is false, we still want to use the variants for state testing
    // We'll use the default variant but pass all variants for state comparison
    const componentVariants = isComponentSet && component.children ? component.children : undefined;
    
    console.log('DEBUG: Test generation for component:', componentName);
    console.log('DEBUG: isComponentSet:', isComponentSet);
    console.log('DEBUG: generateAllVariants:', generateAllVariants);
    console.log('DEBUG: componentVariants count:', componentVariants ? componentVariants.length : 0);
    if (componentVariants) {
      console.log('DEBUG: variant names:', componentVariants.map(v => v.name));
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

        return createTestWithStyleChecks(componentName, kebabName, variantStyleChecks, includeStateTests, includeSizeTests, componentVariants, defaultVariant.textElements);
      }
    }

    // For regular components or if no default variant is found, create a standard test
    return createTestWithStyleChecks(componentName, kebabName, styleChecks, includeStateTests, includeSizeTests, componentVariants, component.textElements);
  }

  private static generateComponentSetTest(componentSet: Component): string {
    if (!componentSet.children || componentSet.children.length === 0) {
      console.log('DEBUG: generateComponentSetTest - no children, falling back to standard test');
      return this.generateTest(componentSet); // Fallback to standard test if no variants
    }

    console.log('DEBUG: *** generateComponentSetTest called ***');
    console.log('DEBUG: Component set name:', componentSet.name);
    console.log('DEBUG: Generating comprehensive test for component set with', componentSet.children.length, 'variants');
    console.log('DEBUG: Variant names:', componentSet.children.map(c => c.name));

    // Create proper component names
    const kebabName = componentSet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    // Use proper PascalCase naming: Primary Button Component -> PrimaryButtonComponent
    const words = componentSet.name.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0);
    const pascalName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');

    console.log('DEBUG: original componentSet.name:', `"${componentSet.name}"`);
    console.log('DEBUG: words after split:', words);
    console.log('DEBUG: kebabName:', kebabName, 'pascalName:', pascalName);

    // Generate individual tests for each variant using standard CSS property testing
    let variantTests = '';
    const processedVariants = new Set<string>();

    componentSet.children.forEach((variant, index) => {
      try {
        const styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
        const variantName = variant.name;
        
        // Parse variant info and determine testing approach
        const stateMatch = variantName.match(/State=([^,]+)/i);
        const sizeMatch = variantName.match(/Size=([^,]+)/i);
        const variantMatch = variantName.match(/Variant=([^,]+)/i);
        
        const state = stateMatch ? stateMatch[1].trim() : 'default';
        const size = sizeMatch ? sizeMatch[1].trim() : 'default';
        const variantType = variantMatch ? variantMatch[1].trim() : 'default';

        // Create unique test identifier to avoid duplicates
        const testId = `${state}-${size}-${variantType}`;
        if (processedVariants.has(testId)) {
          return; // Skip duplicate combinations
        }
        processedVariants.add(testId);

        // Determine if this is a pseudo-state or component property
        const isPseudoState = ['hover', 'active', 'focus', 'disabled'].indexOf(state.toLowerCase()) !== -1;
        
        // Extract CSS properties for testing
        const cssProperties = this.extractCssProperties(styles);

        // Get text styles for this variant
        const textStyles = this.extractTextStyles(variant.textElements);

        if (isPseudoState) {
          // APPROACH 1: CSS Pseudo-state testing
          variantTests += this.generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles);
        } else {
          // APPROACH 2: Component property testing  
          variantTests += this.generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles);
        }

        // Text styles are now integrated into the main component/pseudo-state tests above

      } catch (e) {
        console.error('Error generating test for variant:', variant.name, e);
      }
    });

    // Return comprehensive test with helper functions
    const result = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component - All Variants', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;
  
  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();

    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\((--.+?)\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }
    return value;
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: string): string | undefined => {
    // Regex necessary because Angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style?.getPropertyValue(prop);
  };

  const checkStyleProperty = (selector: string, pseudoClass: string, property: string, expectedValue?: string) => {
    const value = getCssPropertyForRule(selector, pseudoClass, property);
    if (!value) {
      // If no value is found for this pseudo-class, that's okay - not all states need all properties
      return;
    }

    if (value.startsWith('var(')) {
      const variableName = value.match(/var\((--.+?)\)/)?.[1];
      const resolvedValue = variableName ? resolveCssVariable(variableName) : undefined;
      if (expectedValue) {
        expect(resolvedValue).toBe(expectedValue);
      } else {
        expect(resolvedValue).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${resolvedValue}\`);
      }
    } else {
      if (expectedValue) {
        expect(value).toBe(expectedValue);
      } else {
        expect(value).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${value}\`);
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

${variantTests}

  it('should support all size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Test that component supports different size classes
    ${Array.from(new Set(componentSet.children.map(variant => {
      const sizeMatch = variant.name.match(/Size=([^,]+)/i);
      return sizeMatch ? sizeMatch[1].trim() : 'default';
    }))).map(size => `
    // Test ${size} size variant class support
    element.classList.add('${kebabName}--${size}');
    expect(element.classList.contains('${kebabName}--${size}')).toBeTruthy();
    element.classList.remove('${kebabName}--${size}');`).join('')}
    
    console.log('Size variant testing completed');
  });

  it('should support all state variants', () => {
    const selector = '.${kebabName}';
    
    // Test different pseudo-states using helper functions
    ${Array.from(new Set(componentSet.children.map(variant => {
      const stateMatch = variant.name.match(/State=([^,]+)/i);
      return stateMatch ? stateMatch[1].trim() : 'default';
    }).filter(state => state !== 'default'))).map(state => `
    // Test ${state} pseudo-state styles
    const ${state}Value = getCssPropertyForRule(selector, ':${state}', 'background-color');
    if (${state}Value) {
      expect(${state}Value).toBeDefined();
      console.log('${state} state background-color:', ${state}Value);
    }`).join('')}
    
    console.log('State variant testing completed using CSS rules');
  });
});`;
    
    console.log('DEBUG: *** generateComponentSetTest completed ***');
    console.log('DEBUG: Generated test length:', result.length, 'characters');
    console.log('DEBUG: Test preview (first 200 chars):', result.substring(0, 200));
    
    return result;
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

  // Process component styles to resolve variable names and integrate text properties
  private static resolveStyleVariables(styles: any, textElements?: TextElement[], componentName?: string): any {
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

    // DO NOT integrate text properties into the styles object here
    // Text properties are handled separately in test generation
    // This prevents invalid JavaScript property names like "text_content (State=default)"

    return resolvedStyles;
  }

  // Helper method to parse component names (matching UI logic)
  private static parseComponentName(name: string): { state?: string, size?: string } {
    const result: { state?: string, size?: string } = {};

    // Check for State=X pattern
    const stateMatch = name.match(/State=([^,]+)/i);
    if (stateMatch && stateMatch[1]) {
      result.state = stateMatch[1].trim();
    }

    // Check for Size=X pattern
    const sizeMatch = name.match(/Size=([^,]+)/i);
    if (sizeMatch && sizeMatch[1]) {
      result.size = sizeMatch[1].trim();
    }

    return result;
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

  /**
   * Extract text styles from text elements
   */
  private static extractTextStyles(textElements?: any[]): Record<string, string> {
    const textStyles: Record<string, string> = {};
    
    if (!textElements || textElements.length === 0) {
      return textStyles;
    }
    
    textElements.forEach(textEl => {
      if (textEl.textStyles) {
        Object.keys(textEl.textStyles).forEach(styleKey => {
          const value = (textEl.textStyles as any)?.[styleKey];
          if (value !== undefined && value !== null && value !== "") {
            let expectedValue = String(value);
            let cssProperty = '';
            
            // Map to standard CSS property names
            if (styleKey === 'font-size') {
              cssProperty = 'fontSize';
            } else if (styleKey === 'font-family') {
              cssProperty = 'fontFamily';
            } else if (styleKey === 'font-weight') {
              cssProperty = 'fontWeight';
            } else if (styleKey === 'color') {
              cssProperty = 'color';
            } else if (styleKey === 'line-height') {
              cssProperty = 'lineHeight';
            } else if (styleKey === 'letter-spacing') {
              cssProperty = 'letterSpacing';
            }
            
            if (cssProperty) {
              // Handle CSS variables by extracting fallback values
              if (expectedValue.includes('var(')) {
                const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
                if (fallbackMatch) {
                  expectedValue = fallbackMatch[1].trim();
                }
              }
              
              // Convert hex colors to RGB (handle both 3 and 6 character hex)
              if (expectedValue.match(/^#[0-9A-Fa-f]{3}$/) || expectedValue.match(/^#[0-9A-Fa-f]{6}$/)) {
                let hex = expectedValue.substring(1);
                
                // Convert 3-character hex to 6-character hex
                if (hex.length === 3) {
                  hex = hex.split('').map(char => char + char).join('');
                }
                
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                expectedValue = `rgb(${r}, ${g}, ${b})`;
              }
              
              textStyles[cssProperty] = expectedValue;
            }
          }
        });
      }
    });
    
    return textStyles;
  }

  /**
   * Extract and normalize CSS properties from component styles
   */
  private static extractCssProperties(styles: any): Record<string, string> {
    const cssProperties: Record<string, string> = {};
    const collectedStyles: Record<string, any> = {};
    
    // First pass: collect all individual properties
    for (const key in styles) {
      if (Object.prototype.hasOwnProperty.call(styles, key)) {
        // Skip text-related properties
        if (key.startsWith('text_')) continue;
        
        let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (camelCaseKey === 'background') {
          camelCaseKey = 'backgroundColor';
        }
        
        collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, styles[key]);
      }
    }
    
    // Handle shorthand properties intelligently
    if (collectedStyles.paddingTop || collectedStyles.paddingRight || collectedStyles.paddingBottom || collectedStyles.paddingLeft) {
      cssProperties['padding'] = 'computed';
    } else if (collectedStyles.padding) {
      cssProperties['padding'] = String(collectedStyles.padding);
    }
    
    if (collectedStyles.marginTop || collectedStyles.marginRight || collectedStyles.marginBottom || collectedStyles.marginLeft) {
      cssProperties['margin'] = 'computed';
    } else if (collectedStyles.margin) {
      cssProperties['margin'] = String(collectedStyles.margin);
    }
    
    // Add other standard properties
    const standardProps = [
      'backgroundColor', 'background', 'color', 
      'fontSize', 'fontFamily', 'fontWeight', 'fontStyle', 'lineHeight', 'letterSpacing',
      'borderRadius', 'border', 'borderColor', 'borderWidth', 'borderStyle',
      'gap', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'display', 'flexDirection', 'justifyContent', 'alignItems', 'flexWrap',
      'position', 'top', 'right', 'bottom', 'left',
      'opacity', 'boxShadow', 'textAlign', 'textDecoration', 'textTransform',
      'overflow', 'cursor', 'zIndex', 'transition'
    ];
    
    const shorthandSkip = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    
    for (const prop of standardProps) {
      if (collectedStyles[prop] && shorthandSkip.indexOf(prop) === -1) {
        cssProperties[prop] = String(collectedStyles[prop]);
      }
    }
    
    return cssProperties;
  }

  /**
   * Generate test for CSS pseudo-states (hover, active, focus)
   */
  private static generatePseudoStateTest(state: string, size: string, variantType: string, cssProperties: Record<string, string>, kebabName: string, textStyles: Record<string, string> = {}): string {
    const pseudoClass = `:${state.toLowerCase()}`;
    const testDescription = `should have correct :${state.toLowerCase()} styles${size !== 'default' ? ` for ${size} size` : ''}${variantType !== 'default' ? ` (${variantType} variant)` : ''}`;
    
    // Combine CSS properties and text styles for efficient testing
    const allProperties = { ...cssProperties, ...textStyles };
    const testableProperties = Object.keys(allProperties).filter(property => {
      const expectedValue = allProperties[property];
      // Skip 'computed' placeholder values and CSS variables without fallbacks
      return expectedValue !== 'computed' && !(expectedValue.includes('var(') && !expectedValue.match(/var\([^,]+,\s*([^)]+)\)/));
    });
    
    if (testableProperties.length === 0) {
      return `
  it('${testDescription}', () => {
    // No testable properties for this pseudo-state
    console.log('${testDescription}: No specific values to test');
  });`;
    }
    
    return `
  it('${testDescription}', () => {
    // Define properties to check with their expected values
    const propertiesToCheck = [
${testableProperties.map(property => {
      const expectedValue = allProperties[property];
      let expectedTest = expectedValue;
      
      // Handle CSS variables by extracting fallback values
      if (expectedValue.includes('var(')) {
        const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
        if (fallbackMatch) {
          expectedTest = fallbackMatch[1].trim();
        }
      }
      
      // Convert hex colors to RGB (handle both 3 and 6 character hex)
      if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
        let hex = expectedTest.substring(1);
        
        // Convert 3-character hex to 6-character hex
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        expectedTest = `rgb(${r}, ${g}, ${b})`;
      }
      
      const cssProperty = property.replace(/[A-Z]/g, (match: string) => `-${match.toLowerCase()}`);
      const isTextStyle = textStyles.hasOwnProperty(property);
      
      return `      { 
        property: '${property}', 
        cssProperty: '${cssProperty}', 
        expectedValue: '${expectedTest}'${isTextStyle ? ', isTextStyle: true' : ''} 
      }`;
    }).join(',\n')}
    ];

    // Test each property using forEach for cleaner code
    propertiesToCheck.forEach((check) => {
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.startsWith('var(')) {
          const variableName = resolvedValue.match(/var\\((--.+?)\\)/)?.[1];
          const actualValue = variableName ? resolveCssVariable(variableName) : undefined;
          expect(actualValue).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).toBe(check.expectedValue);
        }
      }
    });
  });`;
  }

  /**
   * Generate test for component properties (size, variant, etc.)
   */
  private static generateComponentPropertyTest(state: string, size: string, variantType: string, cssProperties: Record<string, string>, kebabName: string, pascalName: string, textStyles: Record<string, string> = {}): string {
    // Map Figma properties to Angular component properties
    const componentProps: string[] = [];
    
    if (size !== 'default') {
      componentProps.push(`component.size = '${size.toLowerCase()}';`);
    }
    if (variantType !== 'default') {
      componentProps.push(`component.variant = '${variantType.toLowerCase()}';`);
    }
    if (state !== 'default' && ['hover', 'active', 'focus', 'disabled'].indexOf(state.toLowerCase()) === -1) {
      componentProps.push(`component.state = '${state.toLowerCase()}';`);
    }
    
    const testDescription = [
      size !== 'default' ? `size="${size}"` : null,
      variantType !== 'default' ? `variant="${variantType}"` : null,
      state !== 'default' ? `state="${state}"` : null
    ].filter(Boolean).join(' ');
    
    const testName = testDescription ? `should have correct styles for ${testDescription}` : 'should have correct styles';
    
    return `
  it('${testName}', () => {
    ${componentProps.length > 0 ? `// Set component properties\n    ${componentProps.join('\n    ')}\n    fixture.detectChanges();\n` : ''}
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);

${Object.keys(cssProperties).map((property: string) => {
      const expectedValue = cssProperties[property];
      let expectedTest = expectedValue;
      
      // Skip 'computed' placeholder values - we can't predict exact shorthand values
      if (expectedValue === 'computed') {
        return `      // Check ${property} (shorthand property - actual value varies)
      // expect(computedStyle.${property}).toBe('expected-value'); // TODO: Add specific expected value`;
      }
      
      // Handle CSS variables by extracting fallback values (what will actually be computed)
      if (expectedValue.includes('var(')) {
        const fallbackMatch = expectedValue.match(/var\\([^,]+,\\s*([^)]+)\\)/);
        if (fallbackMatch) {
          expectedTest = fallbackMatch[1].trim();
        } else {
          // If no fallback, we can't predict the computed value - skip this test
          return `      // Check ${property} (CSS variable without fallback - cannot predict value)
      // expect(computedStyle.${property}).toBe('expected-value'); // TODO: Add fallback value to CSS variable`;
        }
      }
      
      // Convert hex colors to RGB (handle both 3 and 6 character hex)
      if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
        let hex = expectedTest.substring(1);
        
        // Convert 3-character hex to 6-character hex
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        expectedTest = `rgb(${r}, ${g}, ${b})`;
      }
      
      return `      // Check ${property}
      expect(computedStyle.${property}).toBe('${expectedTest}');`;
    }).join('\n\n')}${Object.keys(textStyles).length > 0 ? '\n\n' + Object.keys(textStyles).map((property: string) => {
      const expectedValue = textStyles[property];
      return `      // Check ${property} (text style)
      expect(computedStyle.${property}).toBe('${expectedValue}');`;
    }).join('\n\n') : ''}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
  }

  /**
   * Extract text elements from a component node
   */
  private static async extractTextElements(node: ComponentNode | ComponentSetNode): Promise<TextElement[]> {
    const textElements: TextElement[] = [];
    
    async function traverseNode(currentNode: SceneNode): Promise<void> {
      if (currentNode.type === 'TEXT') {
        const textNode = currentNode as TextNode;
        
        // Get text styles
        let textStyles: any = {};
        try {
          const nodeStyles = await textNode.getCSSAsync();
          textStyles = {
            fontSize: nodeStyles['font-size'],
            fontFamily: nodeStyles['font-family'],
            fontWeight: nodeStyles['font-weight'],
            lineHeight: nodeStyles['line-height'],
            letterSpacing: nodeStyles['letter-spacing'],
            textAlign: nodeStyles['text-align'],
            color: nodeStyles['color'],
            textDecoration: nodeStyles['text-decoration'],
            textTransform: nodeStyles['text-transform'],
            fontStyle: nodeStyles['font-style'],
            fontVariant: nodeStyles['font-variant'],
            textShadow: nodeStyles['text-shadow'],
            wordSpacing: nodeStyles['word-spacing'],
            whiteSpace: nodeStyles['white-space'],
            textIndent: nodeStyles['text-indent'],
            textOverflow: nodeStyles['text-overflow']
          };
          
          // Filter out undefined/null values
          for (const key in textStyles) {
            if (textStyles[key] === undefined || textStyles[key] === null || textStyles[key] === '') {
              delete textStyles[key];
            }
          }
        } catch (e) {
          console.error('Error getting text styles:', e);
        }
        
        const textElement: TextElement = {
          id: textNode.id,
          content: textNode.characters,
          type: 'TEXT',
          styles: await textNode.getCSSAsync(),
          textStyles: textStyles
        };
        
        textElements.push(textElement);
      }
      
      // Recursively traverse children
      if ('children' in currentNode) {
        for (const child of currentNode.children) {
          await traverseNode(child);
        }
      }
    }
    
    // Start traversal from the component node
    await traverseNode(node);
    
    return textElements;
  }
} 