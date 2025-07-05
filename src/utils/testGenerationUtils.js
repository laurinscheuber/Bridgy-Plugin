/**
 * Utility functions for generating Angular component tests from Figma designs
 */

/**
 * Generates style assertions for a set of style properties
 * @param {Array} styleChecks - Array of style properties to check
 * @returns {string} - Generated code for style assertions
 */
export function generateStyleChecks(styleChecks) {
  if (!styleChecks || styleChecks.length === 0) {
    return '        // No style checks defined';
  }

  return styleChecks.map(check => {
    return `        expect(computedStyle.${check.property}).toBe('${check.value}'); // From Figma design`;
  }).join('\n');
}

/**
 * Generates tests for pseudo-state styles like hover, focus, active
 * @param {Array} styleChecks - Array of style properties to check
 * @param {string} stateName - The pseudo-state name (hover, focus, active, etc.)
 * @returns {string} - Generated code for pseudo-state testing
 */
export function generatePseudoStateTests(styleChecks, stateName) {
  if (!styleChecks || styleChecks.length === 0) {
    return '';
  }

  let code = '';
  
  if (stateName === 'hover') {
    code += `
      // Simulate hover state
      const hoverEvent = new MouseEvent('mouseover');
      element.dispatchEvent(hoverEvent);
      
      // Test hover state styles
      ${generateStyleChecks(styleChecks)}
      
      // Reset state
      element.dispatchEvent(new MouseEvent('mouseout'));
    `;
  } else if (stateName === 'focus') {
    code += `
      // Simulate focus state
      element.focus();
      
      // Test focus state styles
      ${generateStyleChecks(styleChecks)}
      
      // Reset state
      element.blur();
    `;
  } else if (stateName === 'active' || stateName === 'pressed') {
    code += `
      // Simulate active/pressed state
      const mousedownEvent = new MouseEvent('mousedown');
      element.dispatchEvent(mousedownEvent);
      
      // Test active state styles
      ${generateStyleChecks(styleChecks)}
      
      // Reset state
      element.dispatchEvent(new MouseEvent('mouseup'));
    `;
  } else if (stateName === 'disabled') {
    code += `
      // Test for disabled state
      // First save the current disabled state
      const wasDisabled = element.disabled;
      
      // Set to disabled
      element.disabled = true;
      fixture.detectChanges();
      
      // Test disabled state styles
      ${generateStyleChecks(styleChecks)}
      
      // Restore original disabled state
      element.disabled = wasDisabled;
      fixture.detectChanges();
    `;
  }
  
  return code;
}

/**
 * Generates code to set up component state
 * @param {string} stateVar - The state variable name
 * @param {string} variantDesc - Description of the variant state
 * @returns {string} - Generated code for setting component state
 */
export function generateStateSetup(stateVar, variantDesc) {
  return `
    // Try different approaches to set the component state
    try {
      // Method 1: Direct state property
      if ('state' in component) {
        component.state = '${stateVar}';
      } 
      // Method 2: Input property
      else if ('${stateVar}' in component) {
        component['${stateVar}'] = true;
      }
      // Method 3: Property setter method
      else if (typeof component.setState === 'function') {
        component.setState('${stateVar}');
      }
      // Method 4: CSS class approach
      else {
        const hostElement = fixture.nativeElement;
        hostElement.classList.add('${stateVar}-state');
      }
      
      fixture.detectChanges();
    } catch (e) {
      console.warn('Could not set component to ${variantDesc} state:', e);
    }
  `;
}

/**
 * Parses a component name to extract state, type, and base name information
 * @param {string} name - Component name to parse
 * @returns {Object} - Parsed component information
 */
export function parseComponentName(name) {
  if (!name) {
    return { name: "Unnamed", type: null, state: null };
  }
  
  const baseName = name.split("/").pop();
  const [componentNameWithType, state = null] = baseName.split(", ");
  const [componentName, type = null] = componentNameWithType.split("=");
  
  return { name: componentName, type, state };
}

/**
 * Generates documentation for a component based on Figma metadata
 * @param {string} componentName - The component name
 * @param {Array} styleChecks - Array of style properties
 * @param {Object} figmaData - Additional Figma metadata
 * @returns {string} - Generated documentation
 */
export function generateDocumentation(componentName, styleChecks, figmaData = {}) {
  return `/**
 * Component styling specifications from Figma
 * 
 * Component: ${componentName}
 * Last updated: ${new Date().toISOString()}
 * Figma link: ${figmaData.link || 'Not specified'}
 * 
 * Style properties:
 ${styleChecks.map(check => ` * - ${check.property}: ${check.value}`).join('\n')}
 */`;
}

/**
 * Creates test code that can find elements in nested component structures
 * @param {Array} styleChecks - Array of style properties to check
 * @returns {string} - Generated code for nested element testing
 */
export function generateNestedElementFinder(styleChecks) {
  return `
  // Define a recursive function to find nested elements
  function findElementWithStyles(element, maxDepth = 3, currentDepth = 0) {
    // Check if current element has the styles we're looking for
    const style = window.getComputedStyle(element);
    const hasRequiredStyles = ${styleChecks.map(check => 
      `style.${check.property} === '${check.value}'`).join(' || ')};
    
    if (hasRequiredStyles || currentDepth >= maxDepth) {
      return element;
    }
    
    // Check children
    for (const child of Array.from(element.children)) {
      const match = findElementWithStyles(child, maxDepth, currentDepth + 1);
      if (match) return match;
    }
    
    return null;
  }
  
  const targetElement = findElementWithStyles(fixture.nativeElement);
  return targetElement;
  `;
}

/**
 * Generates code for testing a component at different screen sizes
 * @param {Array} styleChecks - Default style checks
 * @param {Array} mobileStyleChecks - Mobile-specific style checks
 * @param {Array} desktopStyleChecks - Desktop-specific style checks
 * @returns {string} - Generated code for responsive testing
 */
export function generateResponsiveTests(styleChecks, mobileStyleChecks = [], desktopStyleChecks = []) {
  // Use default styles if specific ones aren't provided
  mobileStyleChecks = mobileStyleChecks.length ? mobileStyleChecks : styleChecks;
  desktopStyleChecks = desktopStyleChecks.length ? desktopStyleChecks : styleChecks;
  
  return `
  it('should apply correct styles at different screen sizes', () => {
    // Save original matchMedia
    const originalMatchMedia = window.matchMedia;
    
    // Test mobile view
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('max-width: 768px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    fixture.detectChanges();
    let element = fixture.nativeElement.querySelector('[data-test="component"]') || 
                  fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    let computedStyle = window.getComputedStyle(element);
    
    // Test mobile styles
    ${generateStyleChecks(mobileStyleChecks)}
    
    // Test desktop view
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('min-width: 1024px'),
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    
    fixture.detectChanges();
    element = fixture.nativeElement.querySelector('[data-test="component"]') || 
              fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    computedStyle = window.getComputedStyle(element);
    
    // Test desktop styles
    ${generateStyleChecks(desktopStyleChecks)}
    
    // Restore original matchMedia
    window.matchMedia = originalMatchMedia;
  });`;
}

/**
 * Generates code to test Angular Material components
 * @param {Array} styleChecks - Style properties to check
 * @returns {string} - Generated code for Material component testing
 */
export function generateMaterialComponentTests(styleChecks) {
  return `
  it('should have correct Material component styles', () => {
    fixture.detectChanges();
    
    // Handle specific Material components
    const matComponent = fixture.nativeElement.querySelector('.mat-button, .mat-card, .mat-form-field');
    if (matComponent) {
      // For Material, we often need to check inner elements
      const innerElement = matComponent.querySelector('.mat-button-wrapper, .mat-card-content, .mat-form-field-infix') || matComponent;
      
      if (innerElement) {
        const computedStyle = window.getComputedStyle(innerElement);
        ${generateStyleChecks(styleChecks)}
      } else {
        console.warn('Could not find inner Material component element');
      }
    } else {
      // Skip this test if not a Material component
      console.log('No Material component detected, skipping Material-specific tests');
    }
  });`;
}

/**
 * Creates a complete Angular test with all advanced features
 * @param {string} componentName - The component name
 * @param {string} kebabName - Kebab-case version of the component name
 * @param {Array} styleChecks - Style properties to check
 * @param {Object} options - Additional options (variants, states, etc.)
 * @returns {string} - Complete test file content
 */
export function createAdvancedTest(componentName, kebabName, styleChecks, options = {}) {
  const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");
  const hasNestedFinding = options.findNested !== false;
  const hasMaterialTests = options.materialComponent === true;
  const hasResponsiveTests = options.responsiveTests !== false;
  const hasPseudoStates = options.pseudoStates === true;
  
  // Generate documentation
  const docs = generateDocumentation(componentName, styleChecks, options.figmaData);
  
  let testContent = `${docs}
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    
    // Enable test mode if the component supports it
    if ('testMode' in component) {
      component.testMode = true;
    }
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct base styles', () => {
    fixture.detectChanges();
    
    // Find the element to test - try multiple selectors
    const element = fixture.nativeElement.querySelector('[data-test="component"]') || 
                    fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      ${generateStyleChecks(styleChecks)}
    } else {
      fail('No suitable element found to test styles');
    }
  });
`;

  // Add pseudo-state tests if requested
  if (hasPseudoStates) {
    testContent += `
  it('should have correct hover state styles', () => {
    fixture.detectChanges();
    
    const element = fixture.nativeElement.querySelector('[data-test="component"]') || 
                    fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (element) {
      ${generatePseudoStateTests(styleChecks, 'hover')}
    } else {
      fail('No suitable element found to test hover styles');
    }
  });
`;
  }

  // Add nested element finder if requested
  if (hasNestedFinding) {
    testContent += `
  it('should have correct styles in nested elements', () => {
    fixture.detectChanges();
    
    ${generateNestedElementFinder(styleChecks)}
    
    if (targetElement) {
      const computedStyle = window.getComputedStyle(targetElement);
      ${generateStyleChecks(styleChecks)}
    } else {
      console.warn('No element with matching styles found in component hierarchy');
    }
  });
`;
  }

  // Add Material tests if requested
  if (hasMaterialTests) {
    testContent += generateMaterialComponentTests(styleChecks);
  }

  // Add responsive tests if requested
  if (hasResponsiveTests) {
    testContent += generateResponsiveTests(styleChecks);
  }

  // Close the describe block
  testContent += `
});
`;

  return testContent;
}

/**
 * Creates a complete Angular test with variant states
 * @param {string} componentName - The component name
 * @param {string} kebabName - Kebab-case version of the component name
 * @param {Array} variants - Component variants with their states and styles
 * @returns {string} - Complete test file content
 */
export function createVariantTest(componentName, kebabName, variants) {
  const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");
  const docs = generateDocumentation(componentName, [], { variants: variants.length });
  
  let testContent = `${docs}
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
`;

  // Add tests for each variant
  variants.forEach((variant, index) => {
    const parsedName = parseComponentName(variant.name);
    const variantDesc = parsedName.state ? 
      `in '${parsedName.state}' state` : 
      (parsedName.type ? `of type '${parsedName.type}'` : `variant ${index + 1}`);
    
    const stateVar = parsedName.state ? 
      parsedName.state.toLowerCase().replace(/\s+/g, "") : 
      "default";

    testContent += `
  describe('${variantDesc}', () => {
    it('should have correct styles', () => {
      ${generateStateSetup(stateVar, variantDesc)}

      const element = fixture.nativeElement.querySelector('[data-test="component"]') || 
                      fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
      
      if (element) {
        const computedStyle = window.getComputedStyle(element);
        ${generateStyleChecks(variant.styleChecks)}
      } else {
        fail('No suitable element found to test styles');
      }
    });
  });
`;
  });

  // Close the describe block
  testContent += `
});
`;

  return testContent;
}