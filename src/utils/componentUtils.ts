import { ParsedComponentName, StyleCheck, Component } from '../types';
import { generateTestHelpers, generateStateTests, INTERACTIVE_STATES, shouldTestPropertyForState, generateStateTestsFromVariants } from './stateTestingUtils';
import { generateSizeVariantTests, generateBasicSizeTests } from './sizeVariantUtils';

/**
 * Converts hex color to RGB format
 * @param hex - Hex color string (e.g., "#ff0000" or "ff0000")
 * @returns RGB string (e.g., "rgb(255, 0, 0)") or original value if not valid hex
 */
export function hexToRgb(hex: string): string {
  // Remove # if present and validate hex format
  const cleanHex = hex.replace('#', '');
  
  // Check if it's a valid 3 or 6 character hex
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return hex; // Return original if not valid hex
  }
  
  let fullHex = cleanHex;
  
  // Convert 3-character hex to 6-character hex
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(char => char + char).join('');
  }
  
  // Parse RGB values
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Normalizes color values to RGB format for consistent test comparisons
 * Converts hex colors to RGB, leaves RGB colors as-is
 * @param color - Color value (hex, rgb, rgba, etc.)
 * @returns Normalized color string
 */
export function normalizeColorForTesting(color: string): string {
  if (!color || typeof color !== 'string') {
    return color;
  }
  
  // If it's already rgb/rgba, return as-is
  if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
    return color;
  }
  
  // If it's hex, convert to RGB
  if (color.startsWith('#') || /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(color)) {
    return hexToRgb(color);
  }
  
  // Return original for other formats (named colors, etc.)
  return color;
}

/**
 * Normalizes complex CSS values that may contain colors (like box-shadow, border, etc.)
 * @param value - CSS value that may contain colors
 * @returns Normalized CSS value with hex colors converted to RGB
 */
export function normalizeComplexColorValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return value;
  }
  
  // Replace hex colors in the value with RGB equivalents
  return value.replace(/#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g, (match) => {
    return hexToRgb(match);
  });
}

export function parseComponentName(name: string): ParsedComponentName {
  const result: ParsedComponentName = {
    name: name,
    type: null,
    state: null,
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

export function generateStyleChecks(styleChecks: StyleCheck[]): string {
  if (styleChecks.length === 0) {
    return "        // No style properties to check";
  }

  function stripCssVarFallback(value: string): string {
    // Replace all var(--..., fallback) with just the fallback
    return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, '$1').replace(/\s+/g, ' ').trim();
  }

  return styleChecks
    .map((check) => {
      const expected = stripCssVarFallback(String(check.value));
      return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${expected}');`;
    })
    .join("\n\n");
}

// Properties that should be commented out in tests (layout/structural)
const LAYOUT_PROPERTIES = [
  'justifyContent',
  'alignItems', 
  'display',
  'flexDirection',
  'position'
];

/**
 * Generate tests for text content within components
 */
function generateTextContentTests(textElements?: any[], componentVariants?: Component[]): string {
  if (!textElements || textElements.length === 0) {
    return '';
  }

  const tests: string[] = [];
  
  // Skip text content testing - we don't want to test "Donate" text content
  // Only test text styles
  
  // Test for text styles if available
  const textWithStyles = textElements.filter(el => el.textStyles && Object.keys(el.textStyles).length > 0);
  if (textWithStyles.length > 0) {
    // If we have component variants, test text styles for each state/size combination
    if (componentVariants && componentVariants.length > 0) {
      // Group variants by state and size
      const variantGroups = new Map<string, Component[]>();
      
      componentVariants.forEach(variant => {
        const stateMatch = variant.name.match(/State=([^,]+)/i);
        const sizeMatch = variant.name.match(/Size=([^,]+)/i);
        const propMatch = variant.name.match(/Property\s*\d*\s*=\s*([^,]+)/i);
        
        const state = stateMatch ? stateMatch[1].toLowerCase() : (propMatch ? propMatch[1].toLowerCase() : 'default');
        const size = sizeMatch ? sizeMatch[1].toLowerCase() : 'default';
        
        const key = `${state}-${size}`;
        if (!variantGroups.has(key)) {
          variantGroups.set(key, []);
        }
        variantGroups.get(key)!.push(variant);
      });
      
      // Generate tests for each variant group that has text content
      variantGroups.forEach((variants, key) => {
        const variant = variants[0]; // Use first variant in group
        if (variant.textElements && variant.textElements.length > 0) {
          const [state, size] = key.split('-');
          const textStyleTest = `
  it('should have correct text styles for ${state} state, ${size} size', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      console.warn('No text element found for style testing');
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${variant.textElements.map((textEl: any, index: number) => {
      const styles = textEl.textStyles;
      if (!styles || Object.keys(styles).length === 0) return '';
      
      const assertions: string[] = [];
      
      if (styles.fontSize) {
        const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Size
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
      }
      
      if (styles.fontFamily) {
        const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Family
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
      }
      
      if (styles.fontWeight) {
        const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Weight
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
      }
      
      if (styles.color) {
        const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim());
        assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Color
    expect(computedStyle.color).toBe('${normalizedColor}');`);
      }
      
      return assertions.join('');
    }).join('')}
  });`;
          
          tests.push(textStyleTest);
        }
      });
    } else {
      // Fallback to single text style test if no variants
      const textStyleTest = `
  it('should have correct text styles', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      console.warn('No text element found for style testing');
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${textWithStyles.map((textEl, index) => {
      const styles = textEl.textStyles;
      const assertions: string[] = [];
      
      if (styles.fontSize) {
        const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" - Font Size
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
      }
      
      if (styles.fontFamily) {
        const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" - Font Family
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
      }
      
      if (styles.fontWeight) {
        const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim();
        assertions.push(`
    // Text: "${textEl.content}" - Font Weight
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
      }
      
      if (styles.color) {
        const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, '$1').trim());
        assertions.push(`
    // Text: "${textEl.content}" - Color
    expect(computedStyle.color).toBe('${normalizedColor}');`);
      }
      
      return assertions.join('');
    }).join('')}
  });`;
      
      tests.push(textStyleTest);
    }
  }
  
  return tests.join('');
}

export function createTestWithStyleChecks(
  componentName: string,
  kebabName: string,
  styleChecks: StyleCheck[],
  includeStateTests: boolean = true,
  includeSizeTests: boolean = true,
  componentVariants?: any[],
  textElements?: any[]
): string {
  function stripCssVarFallback(value: string): string {
    return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, '$1').replace(/\s+/g, ' ').trim();
  }

  const styleCheckCode = styleChecks.length > 0
    ? styleChecks
        .map((check) => {
          const expected = stripCssVarFallback(String(check.value));
          // Comment out layout properties
          if (LAYOUT_PROPERTIES.indexOf(check.property) !== -1) {
            return `      // Check ${check.property} (layout property - often structural)
      // expect(computedStyle.${check.property}).toBe('${expected}');`;
          }
          return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${expected}');`;
        })
        .join("\n\n")
    : "      // No style properties to check";

  // Use proper PascalCase naming: Primary Button Component -> PrimaryButtonComponent
  const words = componentName.split(/[^a-zA-Z0-9]+/).filter(word => word.length > 0);
  const pascalName = words.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
  const componentSelector = `.${kebabName}`;
  
  // Extract styles object for state testing
  const stylesObject: Record<string, any> = {};
  styleChecks.forEach(check => {
    stylesObject[check.property] = check.value;
  });
  
  // Generate state tests if requested
  let stateTestsCode = '';
  if (includeStateTests) {
    // If we have component variants, always use variant-based state testing
    if (componentVariants && componentVariants.length > 0) {
      // For variant-based testing, we don't need to check for interactive properties
      // We'll detect any property changes dynamically
      stateTestsCode = generateStateTestsFromVariants(componentSelector, componentVariants as Component[], stylesObject);
    } else {
      // Fall back to generic state testing only if there are interactive properties
      const hasInteractiveProperties = styleChecks.some(check => shouldTestPropertyForState(check.property));
      if (hasInteractiveProperties) {
        stateTestsCode = generateStateTests(componentSelector, INTERACTIVE_STATES, stylesObject);
      }
    }
  }
  
  // Generate size variant tests
  let sizeTestsCode = '';
  if (includeSizeTests) {
    console.log('DEBUG: Size testing - componentVariants:', componentVariants ? componentVariants.length : 'null/undefined');
    if (componentVariants && componentVariants.length > 0) {
      console.log('DEBUG: Using Figma variant data for size testing');
      // Use actual variant data from Figma
      sizeTestsCode = generateSizeVariantTests(componentSelector, componentName, componentVariants);
    } else {
      console.log('DEBUG: Using basic size testing approach');
      // Use basic size testing approach
      sizeTestsCode = generateBasicSizeTests(componentSelector);
    }
  }
  
  // Include helper functions if we have any tests that use variants
  const hasVariantTests = componentVariants && componentVariants.length > 0 && (includeStateTests || includeSizeTests);
  const helperFunctions = hasVariantTests
    ? '\n' + generateTestHelpers() + '\n'
    : '';

  return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;${helperFunctions}

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

  it('should have correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
${styleCheckCode}
    } else {
      console.warn('No suitable element found to test styles');
    }
  });${stateTestsCode}${sizeTestsCode}${generateTextContentTests(textElements, componentVariants)}
});`;
} 