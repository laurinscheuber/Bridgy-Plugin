/**
 * Extract Component Styles Script
 * This script extracts component styles from the Bridgy UI for easier Figma recreation
 */

const fs = require('fs');
const path = require('path');

// Read the CSS file
const cssPath = path.join(__dirname, '../src/ui/styles.css');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Component patterns to extract
const componentPatterns = {
  buttons: /\.btn[^{]*\{[^}]+\}/g,
  modals: /\.modal[^{]*\{[^}]+\}/g,
  inputs: /\.(input|form-group|search-input)[^{]*\{[^}]+\}/g,
  cards: /\.(card|feedback-section)[^{]*\{[^}]+\}/g,
  tabs: /\.(tab|sub-tab)[^{]*\{[^}]+\}/g,
  headers: /\.header[^{]*\{[^}]+\}/g,
  notifications: /\.(notification|success-message|error-message)[^{]*\{[^}]+\}/g,
  loading: /\.(loading|spinner|progress)[^{]*\{[^}]+\}/g
};

// Extract root variables
const rootVars = cssContent.match(/:root\s*\{[^}]+\}/s);

// Extract component styles
const extractedStyles = {
  variables: rootVars ? rootVars[0] : '',
  components: {}
};

Object.entries(componentPatterns).forEach(([componentType, pattern]) => {
  const matches = cssContent.match(pattern);
  if (matches) {
    extractedStyles.components[componentType] = matches;
  }
});

// Create a formatted output
let output = `# Bridgy Component Styles Reference

## CSS Variables
\`\`\`css
${extractedStyles.variables}
\`\`\`

`;

// Add component styles
Object.entries(extractedStyles.components).forEach(([componentType, styles]) => {
  output += `## ${componentType.charAt(0).toUpperCase() + componentType.slice(1)}\n\`\`\`css\n`;
  output += styles.join('\n\n');
  output += `\n\`\`\`\n\n`;
});

// Extract specific button styles for Figma reference
const buttonSpecs = {
  primary: {
    height: '40px',
    padding: '16px 24px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, var(--purple-medium) 0%, var(--purple-bright) 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    shadow: '0 4px 15px var(--glass-purple-medium)'
  },
  secondary: {
    height: '40px',
    padding: '16px 24px',
    borderRadius: '10px',
    background: 'transparent',
    border: '1px solid var(--glass-white-medium)',
    color: 'var(--neutral-100)',
    fontSize: '14px',
    fontWeight: '500'
  }
};

// Create Figma-ready component specs
const figmaSpecs = `
# Figma Component Specifications

## Button Component

### Primary Button
- **Frame Size**: Auto width × 40px
- **Auto Layout**: Horizontal, center aligned
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 10px
- **Fill**: Gradient (135°, #8b5cf6 → #a855f7)
- **Text**: Inter Semibold, 14px, #FFFFFF
- **Effects**: Drop shadow (0px 4px 15px, 30% opacity, #8b5cf6)

### Secondary Button
- **Frame Size**: Auto width × 40px  
- **Auto Layout**: Horizontal, center aligned
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 10px
- **Fill**: rgba(0, 0, 0, 0.1)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Text**: Inter Medium, 14px, #f5f5f5

## Input Component

### Default State
- **Frame Size**: 100% width × 40px
- **Padding**: 12px horizontal
- **Border Radius**: 8px
- **Fill**: rgba(0, 0, 0, 0.2)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Text**: Inter Regular, 14px, #e5e5e5

### Focused State
- **Stroke**: 1px, #8b5cf6
- **Effects**: Drop shadow (0px 0px 0px 3px, 20% opacity, #8b5cf6)

## Card Component

- **Auto Layout**: Vertical, 16px spacing
- **Padding**: 16px all sides
- **Border Radius**: 12px
- **Fill**: rgba(0, 0, 0, 0.1) with backdrop blur
- **Stroke**: 1px, rgba(255, 255, 255, 0.05)
- **Effects**: Background blur 15px

## Modal Component

### Modal Container
- **Frame Size**: 500px width × Auto height
- **Auto Layout**: Vertical
- **Border Radius**: 15px
- **Fill**: rgba(26, 26, 58, 0.98)
- **Stroke**: 1px, rgba(255, 255, 255, 0.1)
- **Effects**: 
  - Drop shadow (0px 8px 32px, 30% opacity, #000000)
  - Background blur 20px

### Modal Header
- **Height**: 60px
- **Padding**: 24px
- **Border Bottom**: 1px, rgba(255, 255, 255, 0.05)
`;

// Save to file
const outputPath = path.join(__dirname, '../docs/component-styles-reference.md');
fs.writeFileSync(outputPath, output + figmaSpecs);

// Also create a JSON file with computed styles for programmatic use
const jsonOutput = {
  cssVariables: {
    colors: {
      primary: ['#f0f9ff', '#e0e7ff', '#c7d2fe', '#c4b5fd', '#8b5cf6', '#7c3aed', '#6366f1', '#4c1d95'],
      neutral: ['#ffffff', '#fafafa', '#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717'],
      semantic: {
        success: ['#f0fdf4', '#22c55e', '#16a34a', '#15803d'],
        warning: ['#fefce8', '#eab308', '#ca8a04', '#a16207'],
        error: ['#fef2f2', '#ef4444', '#dc2626', '#b91c1c']
      }
    },
    spacing: {
      px: '1px',
      0.5: '0.125rem',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem',
      4: '1rem',
      5: '1.25rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem'
    },
    typography: {
      sizes: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem'
      },
      weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      }
    },
    borderRadius: {
      sm: '0.375rem',
      md: '0.5rem',
      button: '0.625rem',
      card: '0.75rem',
      modal: '0.9375rem',
      lg: '1rem'
    }
  },
  components: extractedStyles.components
};

const jsonPath = path.join(__dirname, '../docs/component-styles.json');
fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));

console.log('✅ Component styles extracted successfully!');
console.log(`📄 Markdown reference saved to: ${outputPath}`);
console.log(`📊 JSON data saved to: ${jsonPath}`);