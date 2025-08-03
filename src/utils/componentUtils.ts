import { ParsedComponentName, StyleCheck } from '../types';
import { generateTestHelpers, generateStateTests, INTERACTIVE_STATES, shouldTestPropertyForState } from './stateTestingUtils';
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

export function createTestWithStyleChecks(
  componentName: string,
  kebabName: string,
  styleChecks: StyleCheck[],
  includeStateTests: boolean = true,
  includeSizeTests: boolean = true,
  componentVariants?: any[]
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

  const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");
  const componentSelector = `.${kebabName}`;
  
  // Extract styles object for state testing
  const stylesObject: Record<string, any> = {};
  styleChecks.forEach(check => {
    stylesObject[check.property] = check.value;
  });
  
  // Generate state tests if requested and there are interactive properties
  const hasInteractiveProperties = styleChecks.some(check => shouldTestPropertyForState(check.property));
  const stateTestsCode = includeStateTests && hasInteractiveProperties 
    ? generateStateTests(componentSelector, INTERACTIVE_STATES, stylesObject)
    : '';
  
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
  
  const helperFunctions = includeStateTests && hasInteractiveProperties
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
  });${stateTestsCode}${sizeTestsCode}
});`;
} 