# CSS Color Transparency Support Guide

This guide explains how the aWall Synch Figma plugin now properly handles color transparency when exporting CSS variables.

## Overview

The plugin now detects when Figma colors have an alpha channel (transparency) and exports them using the proper CSS format:

- Colors with transparency (alpha < 1) are exported as `rgba(r, g, b, a)`
- Solid colors (alpha = 1 or no alpha) are exported as `rgb(r, g, b)`

## How It Works

When the plugin extracts color variables from Figma, it:

1. Checks if the color has an `a` (alpha) property
2. Checks if the alpha value is less than 1 (indicating transparency)
3. If transparent, formats using `rgba()` with the alpha value
4. If solid, formats using `rgb()` without the alpha value

## Example Output

```css
:root {
  /* Colors */
  --primary-color: rgb(51, 102, 204);                         /* Solid color */
  --secondary-color-transparent: rgba(204, 51, 102, 0.50);    /* 50% transparent */
  --tertiary-color-semitransparent: rgba(77, 179, 26, 0.75);  /* 25% transparent */
}
```

## Testing the Functionality

You can test this functionality with the included test script:

```
node testColorTransparency.js
```

This script:

1. Creates mock Figma color variables with different transparency levels
2. Calls the CSSExportService to export these variables as CSS
3. Shows the formatted output demonstrating the proper rgba() handling

## Benefits

This enhancement:

1. **Preserves Design Fidelity**: Ensures semi-transparent colors from Figma are preserved in CSS
2. **Browser Compatibility**: Uses standard CSS color formats supported by all browsers
3. **Code Clarity**: Makes it clear which colors have transparency
4. **Format Consistency**: Prevents mixed formats (hex for opaque, rgba for transparent)

## Implementation Details

The transparency detection is implemented in the `formatVariableValue` method of the `CSSExportService` class:

```typescript
// Check if the color has an alpha channel and it's less than 1
if (typeof color.a === "number" && color.a < 1) {
  return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
}

// Regular RGB color without transparency
return `rgb(${r}, ${g}, ${b})`;
```

## Usage with CSS Custom Properties

When using the exported variables in your CSS:

```css
.button {
  background-color: var(--primary-color);           /* Solid color */
  box-shadow: 0 2px 4px var(--shadow-color);        /* Transparent color */
  border: 1px solid var(--border-color-light);      /* Semi-transparent color */
}
```

## Browser Support

The `rgb()` and `rgba()` color formats are supported in all modern browsers. For older browsers, consider adding a CSS preprocessor or PostCSS plugin to your build process to provide fallbacks.