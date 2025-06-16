# Enhanced Angular Component Testing Guide

This guide explains how to use the improved Angular component test generation feature in the aWall Synch Figma plugin.

## What's New

The enhanced test generation now supports:

1. **Pseudo-states** - Test components in hover, focus, active states
2. **Nested components** - Find elements in complex component hierarchies 
3. **Responsive testing** - Verify styles at different screen sizes
4. **Angular Material** - Special handling for Material components
5. **Improved selectors** - Better element finding strategies
6. **Component state flexibility** - Multiple approaches to set component state
7. **Documentation generation** - Automatic documentation with Figma links

## Usage

### Basic Usage

1. Select a component in Figma
2. Use the aWall Synch plugin to generate a test
3. Choose "Generate Enhanced Test" option
4. Download or commit the generated test to GitLab

### Component Naming Conventions

The test generator extracts additional information from component names:

- **State information**: Use `State=hover` or `State=focus` in the component name
- **Type information**: Use `Type=primary` or `Type=secondary` in the component name
- **Path information**: Use slashes like `Buttons/Primary/Default` to organize components

### Testing Pseudo-States

For component variants that represent different states:

1. Create a component set with variants
2. Name the variants with state information (e.g., `Button, State=hover`)
3. Generate a test with "Generate All Variants" option enabled

The test will include code to simulate events like:

```javascript
// Simulate hover state
const hoverEvent = new MouseEvent('mouseover');
element.dispatchEvent(hoverEvent);
```

### Finding Elements in Complex Components

The enhanced tests include code to recursively search for elements with matching styles:

```javascript
function findElementWithStyles(element, maxDepth = 3, currentDepth = 0) {
  // Check if current element has the styles we're looking for
  const style = window.getComputedStyle(element);
  const hasRequiredStyles = style.backgroundColor === 'rgb(0, 123, 255)';
  
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
```

### Responsive Testing

Tests now include code to verify styles at different screen sizes:

```javascript
// Test mobile view
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: query.includes('max-width: 768px'),
  media: query,
}));

fixture.detectChanges();
// Test mobile styles...

// Test desktop view
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: query.includes('min-width: 1024px'),
  media: query,
}));

fixture.detectChanges();
// Test desktop styles...
```

### Angular Material Support

For Material components, the tests include special handling:

```javascript
// For Material components
const matComponent = fixture.nativeElement.querySelector('.mat-button, .mat-card');
if (matComponent) {
  // For Material, we often need to check inner elements
  const innerElement = matComponent.querySelector('.mat-button-wrapper');
  
  if (innerElement) {
    const computedStyle = window.getComputedStyle(innerElement);
    // Check styles...
  }
}
```

## Advanced Configuration

You can configure the test generation by modifying the options:

```javascript
ComponentService.generateTest(component, {
  generateAllVariants: true,   // Generate tests for all variants
  pseudoStates: true,          // Include pseudo-state tests
  responsiveTests: true,       // Include responsive tests
  materialComponent: false,    // Include Material-specific tests
  findNested: true             // Include nested element finding
});
```

## Best Practices

1. **Component Structure**: Use component sets with variants for different states
2. **Naming Convention**: Use consistent naming for states and types
3. **CSS Properties**: Focus on key properties like colors, sizes, and fonts
4. **Test Organization**: Keep test files alongside component files
5. **Test Integration**: Include the tests in your CI/CD pipeline

## Example Workflow

1. Design components in Figma with proper naming for states and types
2. Export components to Angular project using aWall Synch
3. Generate enhanced tests for each component
4. Run tests to verify implementation matches design
5. Fix any discrepancies between implementation and design
6. Commit changes to GitLab

By using these enhanced tests, you can ensure your Angular components accurately reflect the Figma designs, including state changes and responsive behavior.