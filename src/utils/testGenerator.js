/**
 * Enhanced test generator for Angular components
 * This module combines all the test generation utilities and provides a clean API
 */

import {
  createAdvancedTest,
  createVariantTest,
  generatePseudoStateTests,
  generateStateSetup,
  parseComponentName,
  generateDocumentation
} from './testGenerationUtils';

/**
 * Extracts style information from a Figma component
 * @param {Object} component - The Figma component data
 * @returns {Array} - Array of style properties and values
 */
function extractStylesFromComponent(component) {
  let styles;
  try {
    styles = typeof component.styles === 'string' ? JSON.parse(component.styles) : component.styles;
  } catch (e) {
    console.error("Error parsing component styles:", e);
    styles = {};
  }

  // Transform styles to the format needed for tests
  return Object.entries(styles)
    .filter(([key]) => Object.prototype.hasOwnProperty.call(styles, key))
    .map(([key, value]) => ({
      property: key.replace(/-([a-z])/g, (g) => g[1].toUpperCase()),
      value
    }));
}

/**
 * Determines if a state is a pseudo-state (hover, focus, etc)
 * @param {string} state - State name to check
 * @returns {boolean} - True if it's a pseudo-state
 */
function isPseudoState(state) {
  if (!state) return false;
  
  const pseudoStates = [
    'hover', 'focus', 'active', 'visited', 
    'disabled', 'checked', 'selected'
  ];
  
  return pseudoStates.some(ps => 
    state.toLowerCase().includes(ps.toLowerCase()));
}

/**
 * Generates a complete test file for a component
 * @param {Object} component - The component data
 * @param {Object} options - Additional options for test generation
 * @returns {string} - Generated test file content
 */
export function generateComponentTest(component, options = {}) {
  const {
    generateAllVariants = false,
    pseudoStates = true,
    responsiveTests = true,
    materialComponent = false,
    findNested = true
  } = options;
  
  const componentName = component.name;
  const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const isComponentSet = component.type === 'COMPONENT_SET';
  
  // For component sets with variants, generate a variant test
  if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
    return generateComponentSetTest(component);
  }
  
  // Extract styles from the component
  const styleChecks = extractStylesFromComponent(component);
  
  // For component sets, use the first variant's styles if available
  if (isComponentSet && component.children && component.children.length > 0) {
    const defaultVariant = component.children[0];
    const variantStyleChecks = extractStylesFromComponent(defaultVariant);
    
    // Generate test with the variant's styles
    return createAdvancedTest(componentName, kebabName, variantStyleChecks, {
      pseudoStates,
      responsiveTests,
      materialComponent,
      findNested,
      figmaData: {
        link: `https://www.figma.com/file/${figma.fileKey}?node-id=${component.id}`
      }
    });
  }
  
  // Generate test with the component's styles
  return createAdvancedTest(componentName, kebabName, styleChecks, {
    pseudoStates,
    responsiveTests,
    materialComponent,
    findNested,
    figmaData: {
      link: `https://www.figma.com/file/${figma.fileKey}?node-id=${component.id}`
    }
  });
}

/**
 * Generates a complete test file for a component set with variants
 * @param {Object} componentSet - The component set data
 * @returns {string} - Generated test file content
 */
export function generateComponentSetTest(componentSet) {
  // If there are no children, use the basic test generator
  if (!componentSet.children || componentSet.children.length === 0) {
    return generateComponentTest(componentSet);
  }

  const componentName = componentSet.name;
  const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  // Process each variant
  const variants = componentSet.children.map((variant) => {
    const parsedName = parseComponentName(variant.name);
    const styleChecks = extractStylesFromComponent(variant);
    
    // Check if this is a pseudo-state variant
    const isPseudo = parsedName.state ? isPseudoState(parsedName.state) : false;
    
    return {
      name: variant.name,
      parsedName,
      styleChecks,
      isPseudoState: isPseudo
    };
  });
  
  // Generate test with all variants
  return createVariantTest(componentName, kebabName, variants);
}

export default {
  generateComponentTest,
  generateComponentSetTest,
  isPseudoState,
  extractStylesFromComponent
};