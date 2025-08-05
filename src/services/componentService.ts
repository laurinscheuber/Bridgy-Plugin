import { Component, TextElement, StyleCheck } from '../types';
import { parseComponentName, generateStyleChecks, createTestWithStyleChecks, normalizeColorForTesting, normalizeComplexColorValue } from '../utils/componentUtils';
import { objectEntries, arrayIncludes, arrayFlatMap } from '../utils/es2015-helpers';

// Constants for better maintainability
const PSEUDO_STATES = ['hover', 'active', 'focus', 'disabled'];
const DEFAULT_ELEMENT_SELECTORS = 'button, div, span, a, p, h1, h2, h3, h4, h5, h6';

type PseudoState = typeof PSEUDO_STATES[number];

interface VariantProps {
  state: string;
  size: string;
  variantType: string;
}

interface ParsedComponentName {
  kebabName: string;
  pascalName: string;
}

interface ComponentTestError extends Error {
  componentName: string;
  variant?: string;
}

export class ComponentService {
  private static componentMap = new Map<string, Component>();
  private static allVariables = new Map<string, unknown>();
  
  // Performance optimization caches
  private static styleCache = new Map<string, Record<string, unknown>>();
  private static testCache = new Map<string, string>();
  private static nameCache = new Map<string, ParsedComponentName>();

  // Cache management
  static clearCaches(): void {
    this.styleCache.clear();
    this.testCache.clear();
    this.nameCache.clear();
  }

  static getCacheStats(): { styles: number; tests: number; names: number } {
    return {
      styles: this.styleCache.size,
      tests: this.testCache.size,
      names: this.nameCache.size
    };
  }

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
    return arrayIncludes(simpleColorProperties, property);
  }

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
    return arrayIncludes(complexColorProperties, property);
  }

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
    await this.collectAllVariables();
    const componentsData: Component[] = [];
    const componentSets: Component[] = [];
    this.componentMap = new Map<string, Component>();

    async function collectNodes(node: BaseNode) {
      if ("type" in node) {
        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
          const componentStyles = await node.getCSSAsync();
          
          const textElements = await ComponentService.extractTextElements(node);
          const resolvedStyles = ComponentService.resolveStyleVariables(componentStyles, textElements, node.name);
          
          const componentData: Component = {
            id: node.id,
            name: node.name,
            type: node.type,
            styles: resolvedStyles,
            pageName: node.parent && node.parent.name ? node.parent.name : "Unknown",
            parentId: node.parent && node.parent.id,
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

    for (const page of figma.root.children) {
      await collectNodes(page);
    }

    componentsData.forEach(component => {
      if (component.parentId) {
        const parent = this.componentMap.get(component.parentId);
        if (parent && parent.type === "COMPONENT_SET") {
          parent.children.push(component);
          component.isChild = true;
        }
      }
    });

    return componentSets.concat(componentsData.filter(comp => !comp.isChild));
  }

  static getComponentById(id: string): Component | undefined {
    return this.componentMap.get(id);
  }

  static generateTest(component: Component, generateAllVariants = false, includeStateTests = true, includeSizeTests = true): string {
    const componentName = component.name;
    const kebabName = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const isComponentSet = component.type === "COMPONENT_SET";

    if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
      return this.generateComponentSetTest(component);
    }

    const componentVariants = isComponentSet ? component.children : undefined;

    let styles;
    try {
      styles = typeof component.styles === "string" ? JSON.parse(component.styles) : component.styles;
    } catch (e) {
      console.error("Error parsing component styles:", e);
      styles = {};
    }

    const styleChecks: StyleCheck[] = [];

    objectEntries(styles).forEach(([key, value]) => {
      let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      
      if (camelCaseKey === 'background') {
        camelCaseKey = 'backgroundColor';
      }

      styleChecks.push({
        property: camelCaseKey,
        value: this.normalizeStyleValue(camelCaseKey, value),
      });
    });

    // Add text styles from textElements
    if (component.textElements) {
      component.textElements.forEach(textElement => {
        if (textElement.textStyles) {
          objectEntries(textElement.textStyles).forEach(([key, value]) => {
            if (value) {
              styleChecks.push({
                property: key,
                value: this.normalizeStyleValue(key, value),
              });
            }
          });
        }
      });
    }

    if (isComponentSet) {
      const defaultVariant = component.children && component.children.length > 0 ? component.children[0] : null;

      if (defaultVariant) {
        let variantStyles;
        try {
          variantStyles = typeof defaultVariant.styles === "string" ? JSON.parse(defaultVariant.styles) : defaultVariant.styles;
        } catch (e) {
          console.error("Error parsing variant styles:", e);
          variantStyles = {};
        }

        const variantStyleChecks: StyleCheck[] = [];

        objectEntries(variantStyles).forEach(([key, value]) => {
          let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
          
          if (camelCaseKey === 'background') {
            camelCaseKey = 'backgroundColor';
          }

          variantStyleChecks.push({
            property: camelCaseKey,
            value: this.normalizeStyleValue(camelCaseKey, value),
          });
        });

        return createTestWithStyleChecks(componentName, kebabName, variantStyleChecks, includeStateTests, includeSizeTests, componentVariants, defaultVariant.textElements);
      }
    }

    return createTestWithStyleChecks(componentName, kebabName, styleChecks, includeStateTests, includeSizeTests, componentVariants, component.textElements);
  }

  private static generateComponentSetTest(componentSet: Component): string {
    if (!componentSet.children || componentSet.children.length === 0) {
      return this.generateTest(componentSet);
    }

    const { kebabName, pascalName } = this.parseComponentName(componentSet.name);
    const variantTests = this.generateVariantTests(componentSet, kebabName, pascalName);
    const sizeTests = this.generateSizeTests(componentSet, kebabName);
    const stateTests = this.generateStateTests(componentSet, kebabName);
    
    return this.buildComponentSetTestTemplate(pascalName, kebabName, variantTests, sizeTests, stateTests);
  }

  private static parseComponentName(name: string): ParsedComponentName {
    if (!name || typeof name !== 'string') {
      throw new Error(`Invalid component name: ${name}`);
    }

    // Check cache first
    const cached = this.nameCache.get(name);
    if (cached) {
      return cached;
    }

    const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!kebabName) {
      throw new Error(`Could not generate valid kebab-case name from: ${name}`);
    }

    const words = name.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0);
    if (words.length === 0) {
      throw new Error(`Could not extract words from component name: ${name}`);
    }

    const pascalName = words
      .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join('');
    const result = { kebabName, pascalName };
    
    // Cache the result
    this.nameCache.set(name, result);
    return result;
  }

  private static generateVariantTests(componentSet: Component, kebabName: string, pascalName: string): string {
    // Check cache first using component set ID and children hash
    const childrenHash = componentSet.children ? componentSet.children.map(c => c.id + c.name).join('|') : '';
    const cacheKey = `variants-${componentSet.id}-${childrenHash}`;
    const cached = this.testCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const variantTestParts: string[] = [];
    const processedVariants = new Set<string>();

    for (const variant of componentSet.children) {
      try {
        const { state, size, variantType } = this.parseVariantName(variant.name);
        const testId = `${state}-${size}-${variantType}`;
        
        if (processedVariants.has(testId)) {
          continue;
        }
        processedVariants.add(testId);

        const styles = this.parseStyles(variant.styles);
        const cssProperties = this.extractCssProperties(styles);
        const textStyles = this.extractTextStyles(variant.textElements);

        const isPseudoState = this.isPseudoState(state);
        
        if (isPseudoState) {
          variantTestParts.push(this.generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles));
        } else {
          variantTestParts.push(this.generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles));
        }

      } catch (error) {
        console.error('Error generating test for variant:', variant.name, error);
      }
    }

    const result = variantTestParts.join('');
    // Cache the result
    this.testCache.set(cacheKey, result);
    return result;
  }

  private static parseVariantName(variantName: string): VariantProps {
    if (!variantName || typeof variantName !== 'string') {
      throw new Error(`Invalid variant name: ${variantName}`);
    }

    const stateMatch = variantName.match(/State=([^,]+)/i);
    const sizeMatch = variantName.match(/Size=([^,]+)/i);
    const variantMatch = variantName.match(/Variant=([^,]+)/i);
    
    return {
      state: stateMatch && stateMatch[1] ? stateMatch[1].trim() : 'default',
      size: sizeMatch && sizeMatch[1] ? sizeMatch[1].trim() : 'default',
      variantType: variantMatch && variantMatch[1] ? variantMatch[1].trim() : 'default'
    };
  }

  private static parseStyles(styles: unknown): Record<string, unknown> {
    if (!styles) {
      return {};
    }

    // Create cache key for string styles
    if (typeof styles === 'string') {
      const cached = this.styleCache.get(styles);
      if (cached) {
        return cached;
      }

      try {
        const parsed = JSON.parse(styles);
        const result = typeof parsed === 'object' && parsed !== null ? parsed : {};
        this.styleCache.set(styles, result);
        return result;
      } catch (error) {
        console.error('Failed to parse styles JSON:', error);
        const emptyResult = {};
        this.styleCache.set(styles, emptyResult);
        return emptyResult;
      }
    }

    return typeof styles === 'object' && styles !== null ? styles as Record<string, unknown> : {};
  }

  private static isPseudoState(state: string): boolean {
    return arrayIncludes(PSEUDO_STATES, state.toLowerCase());
  }

  private static generateSizeTests(componentSet: Component, kebabName: string): string {
    try {
      const uniqueSizes = new Set(
        componentSet.children
          .map(variant => this.parseVariantName(variant.name).size)
          .filter(size => size !== 'default')
      );

      if (uniqueSizes.size === 0) return '';

      const sizeTestCases = Array.from(uniqueSizes)
        .map(size => `
    element.classList.add('${kebabName}--${size}');
    expect(element.classList.contains('${kebabName}--${size}')).toBeTruthy();
    element.classList.remove('${kebabName}--${size}');`).join('');

      return `
  it('should support all size variants', () => {
    const element = fixture.nativeElement.querySelector('${DEFAULT_ELEMENT_SELECTORS}');
    if (!element) return;
${sizeTestCases}
  });`;
    } catch (error) {
      console.error('Error generating size tests:', error);
      return '';
    }
  }

  private static generateStateTests(componentSet: Component, kebabName: string): string {
    const hasInteractiveStates = componentSet.children.some(variant => 
      this.isPseudoState(this.parseVariantName(variant.name).state)
    );

    if (!hasInteractiveStates) return '';

    return `
  it('should support all state variants', () => {
    const selector = '.${kebabName}';
    
    const hoverValue = getCssPropertyForRule(selector, ':hover', 'background-color');
    if (hoverValue) {
      expect(hoverValue).toBeDefined();
    }
  });`;
  }

  private static buildComponentSetTestTemplate(pascalName: string, kebabName: string, variantTests: string, sizeTests: string, stateTests: string): string {
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component - All Variants', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  const resolveCssVariable = (
    variableName: string,
    stylesheetHrefPart = 'styles.css'
  ): string | undefined => {
    const targetSheet = Array.from(document.styleSheets).find((sheet) =>
      sheet.href && sheet.href.indexOf(stylesheetHrefPart) !== -1
    );

    const rootRule = Array.from(targetSheet && targetSheet.cssRules ? targetSheet.cssRules : [])
      .filter((rule) => rule instanceof CSSStyleRule)
      .find((rule) => rule.selectorText === ':root');

    const value = rootRule && rootRule.style ? rootRule.style.getPropertyValue(variableName) : undefined;
    const trimmedValue = value ? value.trim() : undefined;

    if (trimmedValue && trimmedValue.startsWith('var(')) {
      const varMatch = trimmedValue.match(/var\((--.+?)\)/);
      const nestedVar = varMatch ? varMatch[1] : undefined;
      return nestedVar
        ? resolveCssVariable(nestedVar, stylesheetHrefPart)
        : undefined;
    }
    return trimmedValue;
  };

  const getCssPropertyForRule = (
    cssSelector: string,
    pseudoClass: string,
    prop: string
  ): string | undefined => {
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const foundRule = arrayFlatMap(Array.from(document.styleSheets), (sheet) => Array.from(sheet.cssRules || []))
      .filter((r) => r instanceof CSSStyleRule)
      .find((r) => regex.test(r.selectorText));
    
    const style = foundRule ? foundRule.style : undefined;
    return style ? style.getPropertyValue(prop) : undefined;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${pascalName}Component],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

${variantTests}${sizeTests}${stateTests}
});`;
  }

  private static async collectAllVariables(): Promise<void> {
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      this.allVariables.clear();
      
      const variablePromises = arrayFlatMap(collections, collection =>
        collection.variableIds.map(variableId =>
          figma.variables.getVariableByIdAsync(variableId)
        )
      );
      
      const variables = await Promise.all(variablePromises);
      
      variables.forEach(variable => {
        if (variable) {
          this.allVariables.set(variable.id, variable);
          const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          this.allVariables.set(formattedName, variable);
        }
      });
    } catch (error) {
      console.error("Error collecting variables:", error);
    }
  }

  private static resolveStyleVariables(styles: any, textElements?: TextElement[], componentName?: string): any {
    if (!styles || typeof styles !== 'object') {
      return styles;
    }

    const resolvedStyles = Object.assign({}, styles);
    
    for (const property in styles) {
      if (styles.hasOwnProperty(property)) {
        const value = styles[property];
        if (typeof value === 'string') {
          resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
        }
      }
    }

    // Merge text styles into resolved styles
    if (textElements && textElements.length > 0) {
      textElements.forEach(textElement => {
        if (textElement.textStyles) {
          for (const key in textElement.textStyles) {
            if (textElement.textStyles.hasOwnProperty(key)) {
              const value = textElement.textStyles[key];
              if (value) {
                const resolvedValue = typeof value === 'string' ? this.replaceVariableIdsWithNames(value) : value;
                // Convert camelCase to kebab-case for consistent property naming
                const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                resolvedStyles[kebabKey] = resolvedValue;
              }
            }
          }
        }
      });
    }

    return resolvedStyles;
  }

  private static parseComponentVariantName(name: string): { state?: string, size?: string } {
    const result: { state?: string, size?: string } = {};

    const stateMatch = name.match(/State=([^,]+)/i);
    if (stateMatch && stateMatch[1]) {
      result.state = stateMatch[1].trim();
    }

    const sizeMatch = name.match(/Size=([^,]+)/i);
    if (sizeMatch && sizeMatch[1]) {
      result.size = sizeMatch[1].trim();
    }

    return result;
  }

  private static replaceVariableIdsWithNames(cssValue: string): string {
    return cssValue.replace(/VariableID:([a-f0-9:]+)\/[\d.]+/g, (match, variableId) => {
      Array.from(this.allVariables.values()).find(variable => {
        const figmaVariable = variable as any; // Figma variable object
        if (figmaVariable && figmaVariable.id === variableId.replace(/:/g, ':')) {
          const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          return `var(--${formattedName})`;
        }
      });
      return match;
    }).replace(/var\(--[a-f0-9-]+\)/g, (match) => {
      const varId = match.replace(/var\(--([^)]+)\)/, '$1');
      for (const variable of this.allVariables.values()) {
        const figmaVariable = variable as any; // Figma variable object
        if (figmaVariable && figmaVariable.id && (figmaVariable.id.indexOf(varId) !== -1 || varId.indexOf(figmaVariable.id) !== -1)) {
          const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          return `var(--${formattedName})`;
        }
      }
      return match;
    });
  }

  private static extractTextStyles(textElements?: any[]): Record<string, string> {
    if (!textElements || textElements.length === 0) {
      return {};
    }

    // Style key mapping for consistent property names
    const styleKeyMap: Record<string, string> = {
      'font-size': 'fontSize',
      'font-family': 'fontFamily',
      'font-weight': 'fontWeight',
      'color': 'color',
      'line-height': 'lineHeight',
      'letter-spacing': 'letterSpacing'
    };

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string): string => {
      let cleanHex = hex.substring(1);
      
      // Convert 3-character hex to 6-character hex
      if (cleanHex.length === 3) {
        cleanHex = cleanHex.split('').map(char => char + char).join('');
      }
      
      const r = parseInt(cleanHex.substring(0, 2), 16);
      const g = parseInt(cleanHex.substring(2, 4), 16);
      const b = parseInt(cleanHex.substring(4, 6), 16);
      return `rgb(${r}, ${g}, ${b})`;
    };

    // Process text styles using functional approach
    return arrayFlatMap(
      textElements.filter(textEl => textEl.textStyles),
      textEl => 
        objectEntries(textEl.textStyles)
          .filter(([_, value]) => value != null && value !== "")
          .map(([styleKey, value]) => {
            const cssProperty = styleKeyMap[styleKey];
            if (!cssProperty) return null;

            let expectedValue = String(value);
            
            // Extract fallback from CSS variable
            if (expectedValue.indexOf('var(') !== -1) {
              const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
              if (fallbackMatch) {
                expectedValue = fallbackMatch[1].trim();
              }
            }
            
            // Convert hex colors to RGB
            if (/^#[0-9A-Fa-f]{3,6}$/.test(expectedValue)) {
              expectedValue = hexToRgb(expectedValue);
            }
            
            return [cssProperty, expectedValue];
          })
          .filter(Boolean)
      )
      .reduce((acc, [property, value]) => {
        acc[property as string] = value as string;
        return acc;
      }, {} as Record<string, string>);
  }

  private static extractCssProperties(styles: any): Record<string, string> {
    const cssProperties: Record<string, string> = {};
    
    // Convert styles to normalized format - ES5 compatible
    const collectedStyles: Record<string, string> = {};
    
    for (var key in styles) {
      if (styles.hasOwnProperty(key)) {
        var value = styles[key];
        var camelCaseKey = key.replace(/-([a-z])/g, function(g) { 
          return g[1].toUpperCase(); 
        });
        if (camelCaseKey === 'background') {
          camelCaseKey = 'backgroundColor';
        }
        collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, value);
      }
    }
    
    // Handle shorthand properties
    const paddingProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'];
    const marginProps = ['marginTop', 'marginRight', 'marginBottom', 'marginLeft'];
    
    if (paddingProps.some(prop => collectedStyles[prop])) {
      cssProperties['padding'] = 'computed';
    } else if (collectedStyles.padding) {
      cssProperties['padding'] = String(collectedStyles.padding);
    }
    
    if (marginProps.some(prop => collectedStyles[prop])) {
      cssProperties['margin'] = 'computed';
    } else if (collectedStyles.margin) {
      cssProperties['margin'] = String(collectedStyles.margin);
    }
    
    // Standard properties to extract
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
    
    const shorthandSkip = new Set(paddingProps.concat(marginProps));
    
    // Filter and assign standard properties using functional approach
    standardProps
      .filter(prop => collectedStyles[prop] && !shorthandSkip.has(prop))
      .forEach(prop => {
        cssProperties[prop] = String(collectedStyles[prop]);
      });
    
    return cssProperties;
  }

  private static generatePseudoStateTest(state: string, size: string, variantType: string, cssProperties: Record<string, string>, kebabName: string, textStyles: Record<string, string> = {}): string {
    const pseudoClass = `:${state.toLowerCase()}`;
    const testDescription = `should have correct :${state.toLowerCase()} styles${size !== 'default' ? ` for ${size} size` : ''}${variantType !== 'default' ? ` (${variantType} variant)` : ''}`;
    
    const allProperties = Object.assign({}, cssProperties, textStyles);
    const testableProperties = Object.keys(allProperties).filter(property => {
      const expectedValue = allProperties[property];
      return expectedValue !== 'computed' && !(expectedValue.indexOf('var(') !== -1 && !expectedValue.match(/var\([^,]+,\s*([^)]+)\)/));
    });
    
    if (testableProperties.length === 0) {
      return `
  it('${testDescription}', () => {
    console.log('${testDescription}: No specific values to test');
  });`;
    }
    
    return `
  it('${testDescription}', () => {
    const propertiesToCheck = [
${testableProperties.map(property => {
      const expectedValue = allProperties[property];
      let expectedTest = expectedValue;
      
      if (expectedValue.indexOf('var(') !== -1) {
        const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
        if (fallbackMatch) {
          expectedTest = fallbackMatch[1].trim();
        }
      }
      
      if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
        let hex = expectedTest.substring(1);
        
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

    propertiesToCheck.forEach((check) => {
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.startsWith('var(')) {
          const varMatch = resolvedValue.match(/var\\((--.+?)\\)/);\n          const variableName = varMatch ? varMatch[1] : undefined;
          const actualValue = variableName ? resolveCssVariable(variableName) : undefined;
          expect(actualValue).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).toBe(check.expectedValue);
        }
      }
    });
  });`;
  }

  private static generateComponentPropertyTest(state: string, size: string, variantType: string, cssProperties: Record<string, string>, kebabName: string, pascalName: string, textStyles: Record<string, string> = {}): string {
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
    ${componentProps.length > 0 ? `${componentProps.join('\n    ')}\n    fixture.detectChanges();\n` : ''}
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);

${Object.keys(cssProperties).map((property: string) => {
      const expectedValue = cssProperties[property];
      let expectedTest = expectedValue;
      
      if (expectedValue === 'computed') {
        return `      // ${property} (shorthand property)
      // expect(computedStyle.${property}).toBe('expected-value');`;
      }
      
      if (expectedValue.indexOf('var(') !== -1) {
        const fallbackMatch = expectedValue.match(/var\\([^,]+,\\s*([^)]+)\\)/);
        if (fallbackMatch) {
          expectedTest = fallbackMatch[1].trim();
        } else {
          return `      // ${property} (CSS variable without fallback)
      // expect(computedStyle.${property}).toBe('expected-value');`;
        }
      }
      
      if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
        let hex = expectedTest.substring(1);
        
        if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        expectedTest = `rgb(${r}, ${g}, ${b})`;
      }
      
      return `      expect(computedStyle.${property}).toBe('${expectedTest}');`;
    }).join('\n\n')}${Object.keys(textStyles).length > 0 ? '\n\n' + Object.keys(textStyles).map((property: string) => {
      const expectedValue = textStyles[property];
      return `      expect(computedStyle.${property}).toBe('${expectedValue}');`;
    }).join('\n\n') : ''}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
  }

  private static async extractTextElements(node: ComponentNode | ComponentSetNode): Promise<TextElement[]> {
    const textElements: TextElement[] = [];
    
    async function traverseNode(currentNode: SceneNode): Promise<void> {
      if (currentNode.type === 'TEXT') {
        const textNode = currentNode as TextNode;
        
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
          
          Object.keys(textStyles).forEach(key => {
            if (textStyles[key] == null || textStyles[key] === '') {
              delete textStyles[key];
            }
          });
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
      
      if ('children' in currentNode) {
        for (const child of currentNode.children) {
          await traverseNode(child);
        }
      }
    }
    
    await traverseNode(node);
    
    return textElements;
  }
} 