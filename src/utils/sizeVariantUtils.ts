import { StyleCheck } from '../types';
import { CSS_PROPERTIES, TEST_CONFIG, PATTERNS, LoggingService } from '../config';
import { objectEntries } from './es2015-helpers';

export interface SizeVariant {
  name: string;
  selector: string;
  expectedStyles: Record<string, string>;
  state?: string;
}

/**
 * Generates size variant tests based on component data from Figma
 */
// Properties that make sense to test in responsive design
const TESTABLE_SIZE_PROPERTIES = CSS_PROPERTIES.TESTABLE_SIZE;

// Properties that should be commented out (often don't work in responsive design)
const COMMENTED_SIZE_PROPERTIES = CSS_PROPERTIES.COMMENTED_SIZE;

export function generateSizeVariantTests(
  componentSelector: string,
  componentName: string,
  allVariants: any[] // This would be the component children/variants from Figma
): string {
  
  LoggingService.debug('generateSizeVariantTests called', {
    componentSelector, 
    componentName, 
    variantCount: allVariants ? allVariants.length : 0,
    variants: allVariants ? allVariants.map(v => v.name) : 'none'
  }, LoggingService.CATEGORIES.TESTING);
  
  // Extract size information from variant names and group by size
  const sizeVariantMap: Map<string, SizeVariant[]> = new Map();
  
  if (allVariants && allVariants.length > 0) {
    allVariants.forEach(variant => {
      LoggingService.debug('Checking variant', { variantName: variant.name }, LoggingService.CATEGORIES.TESTING);
      const sizeMatch = variant.name.match(PATTERNS.COMPONENT_NAME.SIZE);
      const stateMatch = variant.name.match(PATTERNS.COMPONENT_NAME.STATE);
      LoggingService.debug('Size match result', { sizeMatch, variant: variant.name }, LoggingService.CATEGORIES.TESTING);
      
      if (sizeMatch) {
        const sizeName = sizeMatch[1].toLowerCase();
        const stateName = stateMatch && stateMatch[1] ? stateMatch[1].toLowerCase() : 'default';
        LoggingService.debug('Found size variant', { sizeName, stateName }, LoggingService.CATEGORIES.TESTING);
        
        // Parse variant styles
        let styles;
        try {
          styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
        } catch (e) {
          LoggingService.error("Error parsing variant styles", e, LoggingService.CATEGORIES.TESTING);
          styles = {};
        }
        
        // Get existing variants for this size or create new array
        const existingVariants = sizeVariantMap.get(sizeName) || [];
        
        existingVariants.push({
          name: sizeName,
          selector: `${componentSelector}--${sizeName}`, // BEM naming convention
          expectedStyles: styles,
          state: stateName
        });
        
        sizeVariantMap.set(sizeName, existingVariants);
      }
    });
  }
  
  LoggingService.debug('Size variants processing complete', { 
    uniqueSizes: sizeVariantMap.size, 
    sizes: Array.from(sizeVariantMap.keys()) 
  }, LoggingService.CATEGORIES.TESTING);
  
  if (sizeVariantMap.size === 0) {
    LoggingService.debug('No size variants found, returning empty string', undefined, LoggingService.CATEGORIES.TESTING);
    return ''; // No size variants found
  }
  
  // Get only default state styles for each size
  const sizeVariants: SizeVariant[] = [];
  sizeVariantMap.forEach((variants, sizeName) => {
    // Find default state or first variant
    const defaultVariant = variants.find(v => v.state === 'default') || variants[0];
    if (defaultVariant) {
      sizeVariants.push(defaultVariant);
    }
  });
  
  const sizeTestCode = `
  it('should have correct styles for different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    ${sizeVariants.map(variant => {
      // Extract specific size properties from the variant styles
      const sizeSpecificProps: Record<string, string> = {};
      
      // Look for properties that commonly change with size
      const sizeRelatedProperties = ['padding', 'gap', 'font-size', 'line-height', 'width', 'height', 'min-width', 'min-height', 'margin'];
      
      sizeRelatedProperties.forEach(prop => {
        if (variant.expectedStyles[prop]) {
          sizeSpecificProps[prop] = variant.expectedStyles[prop];
        }
        // Also check camelCase versions
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (variant.expectedStyles[camelProp]) {
          sizeSpecificProps[camelProp] = variant.expectedStyles[camelProp];
        }
      });
      
      // Generate tests for each size
      const testCases: string[] = [];
      
      objectEntries(sizeSpecificProps).forEach(([prop, value]) => {
        const kebabProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        testCases.push(`checkStyleProperty('${variant.selector}', '', '${kebabProp}', '${value}');`);
      });
      
      if (!testCases.length) {
        return `
    // ${variant.name} size variant - no size-specific properties found`;
      }
      
      return `
    // Test ${variant.name} size variant
    ${testCases.join('\n    ')}`;
    }).join('\n')}
    
    // Also test hover states for each size if they have different padding
    ${sizeVariantMap.size > 0 ? Array.from(sizeVariantMap.entries()).map(([sizeName, variants]) => {
      const hoverVariant = variants.find(v => v.state === 'hover');
      if (!hoverVariant) return '';
      
      // Check if hover has different padding than default
      const defaultVariant = variants.find(v => v.state === 'default') || variants[0];
      if (defaultVariant && hoverVariant.expectedStyles.padding !== defaultVariant.expectedStyles.padding) {
        return `
    // Test ${sizeName} size hover state padding
    checkStyleProperty('.${componentSelector.substring(1)}--${sizeName}', ':hover', 'padding', '${hoverVariant.expectedStyles.padding}');`;
      }
      return '';
    }).join('') : ''}
  });`;
  
  return sizeTestCode;
}

/**
 * Simpler approach: Generate size tests with common size class patterns
 */
export function generateBasicSizeTests(componentSelector: string): string {
  return `
  it('should support different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Common size variant naming conventions
    const sizeVariants = TEST_CONFIG.SIZES.STANDARD;
    const altSizeVariants = TEST_CONFIG.SIZES.ALTERNATIVE;
    
    // Properties that typically change with size
    const sizeProperties = ['padding', 'font-size', 'line-height', 'border-radius', 'gap', 'width', 'height', 'min-width', 'min-height'];
    
    // Test both standard size variants and alternative naming
    const allSizeVariants = sizeVariants.concat(altSizeVariants);
    
    allSizeVariants.forEach(size => {
      sizeProperties.forEach(property => {
        // Check BEM naming: .component--size
        const bemValue = getCssPropertyForRule('${componentSelector}--' + size, '', property);
        // Check modifier class: .component.size
        const modifierValue = getCssPropertyForRule('${componentSelector}.' + size, '', property);
        
        const value = bemValue || modifierValue;
        if (value) {
          expect(value).toBeDefined();
        }
      });
    });
  });`;
}