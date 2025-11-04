import { Component, TextElement, StyleCheck } from '../types';
import { parseComponentName, generateStyleChecks, createTestWithStyleChecks, normalizeColorForTesting, normalizeComplexColorValue } from '../utils/componentUtils';
import { objectEntries, arrayIncludes, arrayFlatMap } from '../utils/es2015-helpers';
import { CSS_PROPERTIES } from '../config/css';
import { ErrorHandler } from '../utils/errorHandler';

// Constants for better maintainability
const PSEUDO_STATES = ['hover', 'active', 'focus', 'disabled'];
const DEFAULT_ELEMENT_SELECTORS = 'button, div, span, a, p, h1, h2, h3, h4, h5, h6';

type PseudoState = typeof PSEUDO_STATES[number];

// Dynamic variant properties - all properties are collected from Figma
// State has special handling for pseudo-states
type VariantProps = Record<string, string> & {
  state?: string; // Optional, has special logic for pseudo-states
};

interface ParsedComponentName {
  kebabName: string;
  pascalName: string;
}


export class ComponentService {
  private static componentMap = new Map<string, Component>();
  private static allVariables = new Map<string, unknown>();
  
  // Performance optimization caches with size limits
  private static styleCache = new Map<string, Record<string, unknown>>();
  private static testCache = new Map<string, string>();
  private static nameCache = new Map<string, ParsedComponentName>();
  
  // Cache size limits to prevent memory leaks
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_CLEANUP_THRESHOLD = 800;

  // Cache management with LRU eviction
  static clearCaches(): void {
    this.styleCache.clear();
    this.testCache.clear();
    this.nameCache.clear();
  }

  private static enforcesCacheLimit<K, V>(cache: Map<K, V>): void {
    if (cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries (LRU approximation)
      const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - this.CACHE_CLEANUP_THRESHOLD);
      keysToDelete.forEach(key => cache.delete(key));
    }
  }

  private static addToCache<K, V>(cache: Map<K, V>, key: K, value: V): void {
    // If key exists, delete it first to move it to end (LRU)
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);
    this.enforcesCacheLimit(cache);
  }


  private static isSimpleColorProperty(property: string): boolean {
    return arrayIncludes(CSS_PROPERTIES.SIMPLE_COLORS, property);
  }

  private static isComplexColorProperty(property: string): boolean {
    return arrayIncludes(CSS_PROPERTIES.COMPLEX_COLORS, property);
  }

  private static hasDecimalPixelValues(value: string): boolean {
    // Check for decimal pixel values like "1.5px", "0.8px", etc.
    const decimalPixelRegex = /\d+\.\d+px/;
    return decimalPixelRegex.test(value);
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
    return await ErrorHandler.withErrorHandling(async () => {
      await this.collectAllVariables();
      const componentsData: Component[] = [];
      const componentSets: Component[] = [];
      this.componentMap = new Map<string, Component>();

      async function collectNodes(node: BaseNode) {
        try {
          if (!("type" in node)) {
            return;
          }

          if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
            try {
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
            } catch (nodeError) {
              ErrorHandler.handleError(nodeError as Error, {
                operation: `process_component_${node.name}`,
                component: 'ComponentService',
                severity: 'medium'
              });
              // Continue processing other components
            }
          }

          if ("children" in node) {
            for (const child of node.children) {
              await collectNodes(child);
            }
          }
        } catch (childError) {
          ErrorHandler.handleError(childError as Error, {
            operation: 'collect_component_children',
            component: 'ComponentService',
            severity: 'medium'
          });
          // Continue processing other nodes
        }
      }

      // With dynamic-page access, only scan the current page
      try {
        await collectNodes(figma.currentPage);
      } catch (pageError) {
        ErrorHandler.handleError(pageError as Error, {
          operation: `collect_current_page_components`,
          component: 'ComponentService',
          severity: 'medium'
        });
      }

      try {
        componentsData.forEach(component => {
          if (component.parentId) {
            const parent = this.componentMap.get(component.parentId);
            if (parent && parent.type === "COMPONENT_SET") {
              parent.children.push(component);
              component.isChild = true;
            }
          }
        });
      } catch (organizationError) {
        ErrorHandler.handleError(organizationError as Error, {
          operation: 'organize_component_hierarchy',
          component: 'ComponentService',
          severity: 'low'
        });
      }

      return componentSets.concat(componentsData.filter(comp => !comp.isChild));
    }, {
      operation: 'collect_components',
      component: 'ComponentService',
      severity: 'high'
    });
  }

  static getComponentById(id: string): Component | undefined {
    return this.componentMap.get(id);
  }

  static generateTest(component: Component, includeStateTests = true, includeSizeTests = true): string {
    const componentName = component.name;
    const kebabName = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const isComponentSet = component.type === "COMPONENT_SET";
    // Always generate tests for all variants when dealing with component sets
    if (isComponentSet && component.children && component.children.length > 0) {
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
      component.textElements
        .filter(textElement => textElement.textStyles)
        .forEach(textElement => {
          objectEntries(textElement.textStyles).forEach(([key, value]) => {
            if (value) {
              styleChecks.push({
                property: key,
                value: this.normalizeStyleValue(key, value),
              });
            }
          });
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
    const variantResult = this.generateVariantTests(componentSet, kebabName, pascalName);
    
    return this.buildComponentSetTestTemplate(pascalName, kebabName, variantResult.tests, variantResult.variantProps);
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

  private static generateVariantTests(componentSet: Component, kebabName: string, pascalName: string): { tests: string, variantProps: VariantProps[] } {
    // Check cache first using component set ID and children hash
    const childrenHash = componentSet.children ? componentSet.children.map(c => c.id + c.name).join('|') : '';
    const cacheKey = `variants-${componentSet.id}-${childrenHash}`;
    const cached = this.testCache.get(cacheKey);
    if (cached) {
      // For cached results, we don't have variant props, so return empty array
      return { tests: cached, variantProps: [] };
    }

    const variantTestParts: string[] = [];
    const processedVariants = new Set<string>();
    const allVariantProps: VariantProps[] = []; // Collect all variant properties for @Input generation

    componentSet.children.forEach(variant => {
      try {
        const variantProps = this.parseVariantName(variant.name);
        const testId = variant.name; // Use full variant name as unique ID
        
        if (processedVariants.has(testId)) {
          return;
        }
        processedVariants.add(testId);
        
        // Collect variant properties for @Input generation
        allVariantProps.push(variantProps);

        const styles = this.parseStyles(variant.styles);
        const cssProperties = this.extractCssProperties(styles);
        const textStyles = this.extractTextStyles(variant.textElements);

        const state = variantProps.state || 'default';
        const isPseudoState = this.isPseudoState(state);
        
        if (isPseudoState) {
          variantTestParts.push(this.generatePseudoStateTest(variantProps, cssProperties, kebabName, textStyles));
        } else {
          variantTestParts.push(this.generateComponentPropertyTest(variantProps, cssProperties, kebabName, pascalName, textStyles));
        }

      } catch (error) {
        console.error('Error generating test for variant:', variant.name, error);
      }
    });

    const result = {
      tests: variantTestParts.join(''),
      variantProps: allVariantProps
    };
    // Cache the result - cache just the tests for backward compatibility
    this.testCache.set(cacheKey, result.tests);
    return result;
  }

  private static parseVariantName(variantName: string): VariantProps {
    if (!variantName || typeof variantName !== 'string') {
      throw new Error(`Invalid variant name: ${variantName}`);
    }

    const props: VariantProps = {};
    
    // Split by comma and parse each property
    const parts = variantName.split(',');
    
    parts.forEach(part => {
      const trimmedPart = part.trim();
      // Match any property in format "PropertyName=Value"
      const propertyMatch = trimmedPart.match(/^([^=]+)=(.+)$/);
      
      if (propertyMatch) {
        const propertyName = propertyMatch[1].trim();
        const propertyValue = propertyMatch[2].trim();
        
        // Convert property name to camelCase for consistency
        const camelCaseName = propertyName
          .replace(/\s+/g, '') // Remove spaces
          .replace(/^(.)/g, (match) => match.toLowerCase()) // Lowercase first letter
          .replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters
        
        props[camelCaseName] = propertyValue;
        
        // Keep original 'state' property name for backward compatibility
        if (propertyName.toLowerCase() === 'state') {
          props.state = propertyValue;
        }
      }
    });
    
    // If no properties found, return empty object (no defaults)
    return props;
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

  private static generateInputDeclarations(allVariantProps: VariantProps[]): string {
    const propertyValues = new Map<string, Set<string>>();
    
    // Collect all unique values for each property
    allVariantProps.forEach(variantProps => {
      objectEntries(variantProps).forEach(([propName, propValue]) => {
        if (propName === 'state') {
          // Skip ALL state properties - they don't become @Input properties
          return;
        }
        
        if (!propertyValues.has(propName)) {
          propertyValues.set(propName, new Set());
        }
        propertyValues.get(propName)!.add(propValue);
      });
    });
    
    // Generate @Input() declarations
    const inputDeclarations: string[] = [];
    
    propertyValues.forEach((values, propName) => {
      const uniqueValues = Array.from(values).sort();
      
      if (uniqueValues.length === 1) {
        // Single value - use string type
        inputDeclarations.push(`  @Input() ${propName}: string = '${uniqueValues[0]}';`);
      } else {
        // Multiple values - create union type
        const unionType = uniqueValues.map(val => `'${val}'`).join(' | ');
        const defaultValue = uniqueValues[0]; // Use first value as default
        inputDeclarations.push(`  @Input() ${propName}: ${unionType} = '${defaultValue}';`);
      }
    });
    
    if (inputDeclarations.length === 0) {
      return '';
    }
    
    return `/*
TODO: Add these @Input() properties to your component:

${inputDeclarations.join('\n')}

Don't forget to add this import:
import { CommonModule } from '@angular/common';

IMPORTANT: Ensure your variables file is imported in your stylesheets to make CSS variables available for testing.
*/`;
  }


  private static buildComponentSetTestTemplate(pascalName: string, kebabName: string, variantTests: string, variantProps?: VariantProps[]): string {
    const inputDeclarations = variantProps ? this.generateInputDeclarations(variantProps) : '';
    
    return `${inputDeclarations}${inputDeclarations ? '\n\n' : ''}import { ComponentFixture, TestBed } from '@angular/core/testing';
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
      const nestedVar = value.match(/var\\((--[^)]+)\\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }

    return value;
  };

  const resolveCssValueWithVariables = (cssValue: string, stylesheetHrefPart = 'styles.css'): string => {
    if (!cssValue || typeof cssValue !== 'string') {
      return cssValue;
    }

    // Replace all var() functions in the CSS value
    return cssValue.replace(/var\\((--[^,)]+)(?:,\\s*([^)]+))?\\)/g, (match, varName, fallback) => {
      const resolvedValue = resolveCssVariable(varName, stylesheetHrefPart);
      return resolvedValue || fallback || match;
    });
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: any) => {
    // Regex necessairy because angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style!.getPropertyValue(prop);
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

${variantTests}
});`;
  }

  private static async collectAllVariables(): Promise<void> {
    return await ErrorHandler.withErrorHandling(async () => {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      this.allVariables.clear();
      
      const variablePromises = arrayFlatMap(collections, collection =>
        collection.variableIds.map(variableId =>
          figma.variables.getVariableByIdAsync(variableId).catch(error => {
            ErrorHandler.handleError(error as Error, {
              operation: `get_variable_${variableId}`,
              component: 'ComponentService',
              severity: 'low'
            });
            return null; // Return null for failed variables
          })
        )
      );
      
      const variables = await Promise.all(variablePromises);
      
      variables.forEach(variable => {
        if (variable) {
          try {
            this.allVariables.set(variable.id, variable);
            const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
            this.allVariables.set(formattedName, variable);
          } catch (error) {
            ErrorHandler.handleError(error as Error, {
              operation: `process_variable_${variable.name}`,
              component: 'ComponentService',
              severity: 'low'
            });
          }
        }
      });
    }, {
      operation: 'collect_all_variables',
      component: 'ComponentService',
      severity: 'medium'
    });
  }

  private static resolveStyleVariables(styles: any, textElements?: TextElement[], componentName?: string): any {
    if (!styles || typeof styles !== 'object') {
      return styles;
    }

    const resolvedStyles = Object.assign({}, styles);
    
    Object.keys(styles).forEach(property => {
      if (styles.hasOwnProperty(property)) {
        const value = styles[property];
        if (typeof value === 'string') {
          resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
        }
      }
    });

    // Merge text styles into resolved styles
    if (textElements && textElements.length > 0) {
      textElements.forEach(textElement => {
        if (textElement.textStyles) {
          Object.keys(textElement.textStyles).forEach(key => {
            if (textElement.textStyles.hasOwnProperty(key)) {
              const value = textElement.textStyles[key];
              if (value) {
                const resolvedValue = typeof value === 'string' ? this.replaceVariableIdsWithNames(value) : value;
                // Convert camelCase to kebab-case for consistent property naming
                const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                resolvedStyles[kebabKey] = resolvedValue;
              }
            }
          });
        }
      });
    }

    return resolvedStyles;
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
      Array.from(this.allVariables.values()).forEach(variable => {
        const figmaVariable = variable as any; // Figma variable object
        if (figmaVariable && figmaVariable.id && (figmaVariable.id.indexOf(varId) !== -1 || varId.indexOf(figmaVariable.id) !== -1)) {
          const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
          return `var(--${formattedName})`;
        }
      });
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

    Object.keys(styles).forEach(key => {
      if (styles.hasOwnProperty(key)) {
        const value = styles[key];
        let camelCaseKey = key.replace(/-([a-z])/g, function(g) { 
          return g[1].toUpperCase(); 
        });
        if (camelCaseKey === 'background') {
          camelCaseKey = 'backgroundColor';
        }
        collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, value);
      }
    });
    
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

    const shorthandSkip = new Set(paddingProps.concat(marginProps));
    
    // Dynamic approach: use ALL properties that Figma provides (no predefined list needed)
    Object.keys(collectedStyles)
      .filter(prop => collectedStyles[prop] && !shorthandSkip.has(prop))
      .forEach(prop => {
        cssProperties[prop] = String(collectedStyles[prop]);
      });
    
    return cssProperties;
  }

  private static generatePseudoStateTest(variantProps: VariantProps, cssProperties: Record<string, string>, kebabName: string, textStyles: Record<string, string> = {}): string {
    const state = variantProps.state || 'default';
    const pseudoClass = `:${state.toLowerCase()}`;
    
    // Build test description from all variant properties except state
    const propDescriptions = objectEntries(variantProps)
      .filter(([key, value]) => key !== 'state' && value !== 'default')
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    const testDescription = `should have correct :${state.toLowerCase()} styles${propDescriptions ? ` for ${propDescriptions}` : ''}`;
    
    const allProperties = Object.assign({}, cssProperties, textStyles);
    const testableProperties = Object.keys(allProperties).filter(property => {
      const expectedValue = allProperties[property];
      if (expectedValue === 'computed') return false;
      
      if (expectedValue.indexOf('var(') !== -1) {
        // Check if var() has fallback by attempting replacement
        const replaced = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => fallback.trim());
        return replaced !== expectedValue; // If replacement happened, there was a fallback
      }
      
      return true;
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
        // Replace var() with its fallback value while preserving surrounding content
        expectedTest = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => {
          return fallback.trim();
        });
        
        // If no fallback was found, the replace won't change anything
        if (expectedTest === expectedValue) {
          expectedTest = null; // Indicate no fallback available
        }
      }
      
      // Convert any hex colors to RGB (handles hex colors anywhere within the value)
      expectedTest = expectedTest.replace(/#([0-9A-Fa-f]{3,6})\b/g, (match, hex) => {
        let fullHex = hex;
        
        if (hex.length === 3) {
          fullHex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(fullHex.substring(0, 2), 16);
        const g = parseInt(fullHex.substring(2, 4), 16);
        const b = parseInt(fullHex.substring(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
      });
      
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
      // TODO: please check whether the selector is correct
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.indexOf('var(') !== -1) {
          const actualValue = resolveCssValueWithVariables(resolvedValue);
          expect(actualValue).withContext(check.property).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).withContext(check.property).toBe(check.expectedValue);
        }
      } else {
        // Fallback to computed style if CSS rule not found
        console.log('No CSS rule found for:', check.cssProperty);
        ${Object.keys(variantProps).filter(key => key !== 'state').map(key => `component.${key} = '${variantProps[key]}';`).join('\n        ')}
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.getPropertyValue(check.cssProperty)).withContext(check.property).toBe(check.expectedValue);
      }
    });
  });`;
  }

  private static generateComponentPropertyTest(variantProps: VariantProps, cssProperties: Record<string, string>, kebabName: string, pascalName: string, textStyles: Record<string, string> = {}): string {
    const componentProps: string[] = [];
    const testDescriptionParts: string[] = [];
    
    // Generate component property assignments for all variant properties
    objectEntries(variantProps).forEach(([propName, propValue]) => {
      if (propValue !== 'default') {
        // Skip pseudo-states in component properties
        if (propName === 'state' && ['hover', 'active', 'focus', 'disabled'].indexOf(propValue.toLowerCase()) !== -1) {
          return;
        }
        
        // Handle special property name mappings if needed
        let componentPropName = propName;
        if (propName === 'variantType' || propName === 'variant') {
          componentPropName = 'variant';
        }
        
        componentProps.push(`component.${componentPropName} = '${propValue.toLowerCase()}';`);
        testDescriptionParts.push(`${propName}="${propValue}"`);
      }
    });
    
    const testDescription = testDescriptionParts.join(' ');
    
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
        // Replace var() with its fallback value while preserving surrounding content
        expectedTest = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => {
          return fallback.trim();
        });
        
        // If no fallback was found, the replace won't change anything
        if (expectedTest === expectedValue) {
          return `      // ${property} (CSS variable without fallback)
      // expect(computedStyle.${property}).toBe('expected-value');`;
        }
      }
      
      // Convert any hex colors to RGB (handles hex colors anywhere within the value)
      expectedTest = expectedTest.replace(/#([0-9A-Fa-f]{3,6})\b/g, (match, hex) => {
        let fullHex = hex;
        
        if (hex.length === 3) {
          fullHex = hex.split('').map(char => char + char).join('');
        }
        
        const r = parseInt(fullHex.substring(0, 2), 16);
        const g = parseInt(fullHex.substring(2, 4), 16);
        const b = parseInt(fullHex.substring(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
      });
      
      // Check if the original Figma value likely had decimal pixels that got rounded
      const hasDecimalWarning = this.hasDecimalPixelValues(expectedValue) || 
        (expectedValue !== expectedTest && this.hasDecimalPixelValues(expectedTest));
      
      if (hasDecimalWarning) {
        return `      // Note: Figma may have rounded decimal pixel values - test may fail due to rounding
      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedTest}');`;
      } else {
        return `      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedTest}');`;
      }
    }).join('\n\n')}${Object.keys(textStyles).length > 0 ? '\n\n' + Object.keys(textStyles).map((property: string) => {
      const expectedValue = textStyles[property];
      return `      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedValue}');`;
    }).join('\n\n') : ''}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
  }

  private static async extractTextElements(node: ComponentNode | ComponentSetNode): Promise<TextElement[]> {
    return await ErrorHandler.withErrorHandling(async () => {
      const textElements: TextElement[] = [];
      
      async function traverseNode(currentNode: SceneNode): Promise<void> {
        try {
          if (currentNode.type === 'TEXT') {
            const textNode = currentNode as TextNode;
            
            let textStyles: any = {};
            let nodeStyles: any = {};
            
            try {
              nodeStyles = await textNode.getCSSAsync();
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
            } catch (styleError) {
              ErrorHandler.handleError(styleError as Error, {
                operation: `get_text_styles_${textNode.id}`,
                component: 'ComponentService',
                severity: 'low'
              });
              // Continue with empty styles
            }
            
            try {
              const textElement: TextElement = {
                id: textNode.id,
                content: textNode.characters || '',
                type: 'TEXT',
                styles: nodeStyles,
                textStyles: textStyles
              };
              
              textElements.push(textElement);
            } catch (elementError) {
              ErrorHandler.handleError(elementError as Error, {
                operation: `create_text_element_${textNode.id}`,
                component: 'ComponentService',
                severity: 'low'
              });
              // Continue processing other text elements
            }
          }
          
          if ('children' in currentNode) {
            for (const child of currentNode.children) {
              await traverseNode(child);
            }
          }
        } catch (nodeError) {
          ErrorHandler.handleError(nodeError as Error, {
            operation: `traverse_text_node_${currentNode.id}`,
            component: 'ComponentService',
            severity: 'low'
          });
          // Continue processing other nodes
        }
      }
      
      await traverseNode(node);
      
      return textElements;
    }, {
      operation: 'extract_text_elements',
      component: 'ComponentService',
      severity: 'medium'
    });
  }
} 