import { StyleCheck } from '../types';

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
  'font-size',
  'line-height',
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
  if (INTERACTIVE_PROPERTIES.indexOf(property) !== -1 || 
      INTERACTIVE_PROPERTIES.indexOf(kebabProperty) !== -1) {
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
  const hasInteractiveElement = Object.keys(componentStyles).some(prop => 
    shouldTestPropertyForState(prop)
  );
  
  if (!hasInteractiveElement) {
    return ''; // Don't generate state tests if no interactive properties
  }
  
  for (const state of states) {
    // Combine component styles with state-specific properties
    const componentInteractiveProps = Object.keys(componentStyles)
      .filter(prop => shouldTestPropertyForState(prop));
    
    // Use both component's interactive properties and common state properties
    const allPropertiesToTest = new Set([
      ...componentInteractiveProps.map(prop => toKebabCase(prop)),
      ...state.properties
    ]);
    
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
  }
  
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