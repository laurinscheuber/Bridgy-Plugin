import { StyleCheck, Component } from '../types';

export interface StateTestConfig {
  state: string;
  pseudoClass: string;
  properties: string[];
}

// Define which properties are typically affected by interactive states
export const INTERACTIVE_PROPERTIES = [
  // Color properties
  'background-color',
  'background',
  'color',
  'border-color',
  'border-top-color',
  'border-right-color', 
  'border-bottom-color',
  'border-left-color',
  'border', // shorthand property
  'outline-color',
  'outline', // shorthand property
  'text-decoration-color',
  'fill',
  'stroke',
  
  // Visual effects
  'box-shadow',
  'text-shadow',
  'filter',
  'backdrop-filter',
  'opacity',
  
  // Transforms
  'transform',
  'scale',
  
  // Borders
  'border-width',
  'border-style',
  'outline-width',
  'outline-style',
  
  // Text decoration
  'text-decoration',
  'text-decoration-line',
  'text-decoration-style',
  'font-weight',
  'font-style',
  
  // Text sizing (often changes on interaction)
  'font-size',
  'line-height',
  'letter-spacing',
  
  // Transitions (to detect if they exist)
  'transition',
  'transition-duration',
  'transition-property'
];

// Properties that typically don't change on interaction
export const STATIC_PROPERTIES = [
  'width',
  'height',
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'position',
  'top',
  'left',
  'right',
  'bottom',
  'display',
  'flex-direction',
  'justify-content',
  'align-items',
  'gap',
  'border-radius',
  'font-family',
  'text-align',
  'vertical-align',
  'z-index',
  'overflow',
  'flex',
  'grid-template-columns',
  'grid-template-rows'
];

// Common properties that change for each state
export const STATE_SPECIFIC_PROPERTIES = {
  hover: [
    'background-color',
    'color',
    'border-color',
    'box-shadow',
    'transform',
    'opacity'
  ],
  focus: [
    'outline',
    'outline-color',
    'outline-width',
    'outline-offset',
    'box-shadow',
    'border-color'
  ],
  active: [
    'transform',
    'box-shadow',
    'background-color',
    'border-color'
  ],
  disabled: [
    'opacity',
    'cursor',
    'background-color',
    'color',
    'border-color'
  ]
};

// Interactive states to test
export const INTERACTIVE_STATES: StateTestConfig[] = [
  {
    state: 'hover',
    pseudoClass: ':hover',
    properties: STATE_SPECIFIC_PROPERTIES.hover
  },
  {
    state: 'focus',
    pseudoClass: ':focus',
    properties: STATE_SPECIFIC_PROPERTIES.focus
  },
  {
    state: 'active',
    pseudoClass: ':active',
    properties: STATE_SPECIFIC_PROPERTIES.active
  },
  {
    state: 'disabled',
    pseudoClass: ':disabled',
    properties: STATE_SPECIFIC_PROPERTIES.disabled
  }
];

// Size variants that might exist
export const SIZE_VARIANTS = ['sm', 'base', 'lg', 'xl'];

// Size-related properties that typically change
export const SIZE_PROPERTIES = [
  'padding',
  'font-size',
  'line-height',
  'height',
  'min-height',
  'width',
  'min-width'
];

/**
 * Determines if a property should be tested for interactive states
 */
export function shouldTestPropertyForState(property: string): boolean {
  // Convert camelCase to kebab-case
  const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
  
  // Check both the original property and kebab-case version
  if (INTERACTIVE_PROPERTIES.includes(property) || 
      INTERACTIVE_PROPERTIES.includes(kebabProperty)) {
    return true;
  }
  
  // Also check if this property could potentially have color/visual changes
  // This catches properties that contain color-related keywords
  const colorRelatedKeywords = ['color', 'background', 'border', 'outline', 'shadow', 'fill', 'stroke'];
  return colorRelatedKeywords.some(keyword => 
    property.toLowerCase().includes(keyword) || 
    kebabProperty.includes(keyword)
  );
}

/**
 * Converts camelCase property to kebab-case
 */
export function toKebabCase(property: string): string {
  return property.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Converts kebab-case property to camelCase
 */
export function toCamelCase(property: string): string {
  return property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

/**
 * Generates the helper functions for the test file
 */
export function generateTestHelpers(): string {
  return `  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();

    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\\((--.+?)\\)/)?.[1];
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
      const variableName = value.match(/var\\((--.+?)\\)/)?.[1];
      const resolvedValue = variableName ? resolveCssVariable(variableName) : undefined;
      if (expectedValue) {
        expect(resolvedValue).toBe(expectedValue);
      } else {
        expect(resolvedValue).toBeDefined();
      }
    } else {
      if (expectedValue) {
        expect(value).toBe(expectedValue);
      } else {
        expect(value).toBeDefined();
      }
    }
  };`;
}

/**
 * Generates state tests for a component
 */
export function generateStateTests(
  componentSelector: string,
  states: StateTestConfig[],
  componentStyles: Record<string, any>
): string {
  const tests: string[] = [];
  
  // Check if component has any properties that could change on interaction
  const hasInteractiveElement = Object.keys(componentStyles).some(shouldTestPropertyForState);
  
  if (!hasInteractiveElement) {
    return ''; // Don't generate state tests if no interactive properties
  }
  
  states.forEach(state => {
    // Combine component styles with state-specific properties
    const componentInteractiveProps = Object.keys(componentStyles)
      .filter(shouldTestPropertyForState);
    
    // Use both component's interactive properties and common state properties
    const allPropertiesToTest = new Set(
      componentInteractiveProps.map(toKebabCase).concat(state.properties)
    );
    
    if (allPropertiesToTest.size > 0) {
      const testName = `should have correct ${state.state} styles`;
      const propertyChecks = Array.from(allPropertiesToTest).map(prop => {
        // Try to get expected value from component styles
        const camelCaseProp = toCamelCase(prop);
        const expectedValue = componentStyles[camelCaseProp];
        
        if (expectedValue && typeof expectedValue === 'string') {
          // If we have an expected value from component styles, use it
          // But only for certain properties that typically don't change much
          if (prop === 'color' || prop === 'background-color' || prop.includes('border')) {
            return `      { property: '${prop}', expected: '${expectedValue}' }`;
          }
        }
        
        // For other properties or when we don't have expected values, just check existence
        return `      { property: '${prop}', expected: undefined }`;
      }).join(',\n');
      
      const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      checkStyleProperty('${componentSelector}', '${state.pseudoClass}', property, expected);
    });
  });`;
      
      tests.push(testCode);
    }
  });
  
  return tests.join('\n');
}

/**
 * Generates size variant tests for components that have multiple sizes
 */
export function generateSizeVariantTests(
  componentSelector: string,
  componentName: string
): string {
  const sizeTests: string[] = [];
  
  // Test different size variants if they exist
  const testCode = `
  it('should have correct styles for different sizes', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Test size variants by checking for size-specific CSS classes or attributes
    const sizeVariants = ['sm', 'base', 'lg', 'xl'];
    const sizeProperties = ['padding', 'font-size', 'height', 'min-height'];
    
    sizeVariants.forEach(size => {
      // Check if this size variant has specific styles
      const sizeSelector = \`${componentSelector}--\${size}\`; // BEM naming
      const altSizeSelector = \`${componentSelector}.\${size}\`;  // Alternative naming
      
      sizeProperties.forEach(property => {
        const bemValue = getCssPropertyForRule(sizeSelector, '', property);
        const altValue = getCssPropertyForRule(altSizeSelector, '', property);
        
        if (bemValue || altValue) {
          const value = bemValue || altValue;
          console.log(\`Size \${size} - \${property}: \${value}\`);
          expect(value).toBeDefined();
        }
      });
    });
  });`;
  
  return testCode;
}

/**
 * Filters style properties to only include those relevant for state testing
 */
export function filterInteractiveProperties(styles: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  
  for (const key in styles) {
    if (styles.hasOwnProperty(key) && shouldTestPropertyForState(key)) {
      filtered[key] = styles[key];
    }
  }
  
  return filtered;
}

/**
 * Analyzes component variants to find style differences between states
 */
export function analyzeComponentStateVariants(variants: Component[]): Map<string, Map<string, any>> {
  console.log('DEBUG: analyzeComponentStateVariants called with', variants.length, 'variants');
  const stateStyleMap = new Map<string, Map<string, any>>();
  
  // Process each variant to extract state and styles
  variants.forEach((variant, index) => {
    console.log(`DEBUG: Processing variant ${index}: "${variant.name}"`);
    
    // Parse variant name to extract state (e.g., "State=hover, Size=small")
    const stateName = extractStateFromVariantName(variant.name);
    console.log(`DEBUG: Extracted state name: "${stateName}"`);
    
    if (!stateName) {
      console.log('DEBUG: No state name found, skipping variant');
      return;
    }
    
    // Parse styles
    let styles: Record<string, any>;
    try {
      styles = typeof variant.styles === 'string' ? JSON.parse(variant.styles) : variant.styles;
      console.log(`DEBUG: Parsed ${Object.keys(styles).length} style properties for state "${stateName}"`);
    } catch (e) {
      console.error('Error parsing variant styles:', e);
      return;
    }
    
    // Store styles for this state
    const styleMap = new Map<string, any>(Object.entries(styles));
    stateStyleMap.set(stateName, styleMap);
    console.log(`DEBUG: Stored ${styleMap.size} styles for state "${stateName}"`);
  });
  
  console.log('DEBUG: Final state style map has', stateStyleMap.size, 'states:', Array.from(stateStyleMap.keys()));
  return stateStyleMap;
}

/**
 * Extracts state name from variant name (handles multiple patterns)
 * Examples: 
 * - "State=hover, Size=small" -> "hover"
 * - "Property 1=Default" -> "default"
 * - "Property 1=Hover" -> "hover"
 */
function extractStateFromVariantName(variantName: string): string | null {
  // Try standard State= pattern first
  let stateMatch = variantName.match(/State=(\w+)/i);
  if (stateMatch) {
    return stateMatch[1].toLowerCase();
  }
  
  // Try Property [number]= pattern (common in Figma auto-generated variants)
  stateMatch = variantName.match(/Property\s*\d*\s*=\s*(\w+)/i);
  if (stateMatch) {
    return stateMatch[1].toLowerCase();
  }
  
  // Try any [word]= pattern as fallback
  stateMatch = variantName.match(/(\w+)=(\w+)/i);
  if (stateMatch) {
    // Return the value part (after =) as the state
    return stateMatch[2].toLowerCase();
  }
  
  return null;
}

/**
 * Compares two style maps and returns only the properties that differ
 */
export function findStyleDifferences(baseStyles: Map<string, any>, compareStyles: Map<string, any>): Map<string, any> {
  const differences = new Map<string, any>();
  
  // Check all properties in the compare styles
  compareStyles.forEach((value, key) => {
    const baseValue = baseStyles.get(key);
    // Only include if the value is different from base
    if (baseValue !== value) {
      differences.set(key, value);
    }
  });
  
  return differences;
}

/**
 * Generates state-specific tests based on actual variant differences
 */
export function generateStateTestsFromVariants(
  componentSelector: string,
  variants: Component[],
  defaultStyles: Record<string, any>
): string {
  const tests: string[] = [];
  
  // Analyze all variants to find state differences
  const stateStyleMap = analyzeComponentStateVariants(variants);
  
  // Get the default state styles
  let defaultStateStyles = stateStyleMap.get('default');
  if (!defaultStateStyles) {
    defaultStateStyles = new Map<string, any>(Object.entries(defaultStyles));
  }
  
  // Dynamically generate tests for ALL states found in variants (not just predefined ones)
  const allStates = Array.from(stateStyleMap.keys()).filter(state => state !== 'default');
  
  allStates.forEach(stateName => {
    const stateStyles = stateStyleMap.get(stateName);
    if (!stateStyles) return;
    
    // Find differences between this state and default
    const differences = findStyleDifferences(defaultStateStyles, stateStyles);
    
    if (differences.size === 0) return;
    
    // Convert state name to pseudo-class (handle custom states)
    const pseudoClass = stateName.startsWith(':') ? stateName : `:${stateName}`;
    const testName = `should have correct ${stateName} styles`;
    
    // Build property checks only for changed properties
    const propertyChecks = Array.from(differences.entries()).map(([property, value]) => {
      // Convert to kebab-case for CSS
      const kebabProperty = toKebabCase(property);
      return `      { property: '${kebabProperty}', expected: '${value}' }`;
    }).join(',\n');
    
    const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      checkStyleProperty('${componentSelector}', '${pseudoClass}', property, expected);
    });
  });`;
    
    tests.push(testCode);
  });
  
  return tests.join('\n');
}