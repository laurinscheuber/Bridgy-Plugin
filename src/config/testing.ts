// Testing Configuration
export const TEST_CONFIG = {
  STATE_SPECIFIC_PROPERTIES: {
    hover: [
      'background-color',
      'backgroundColor',
      'color',
      'border-color',
      'borderColor',
      'box-shadow',
      'boxShadow',
      'opacity',
      'transform',
    ],
    active: [
      'background-color',
      'backgroundColor',
      'color',
      'border-color',
      'borderColor',
      'box-shadow',
      'boxShadow',
      'transform',
    ],
    focus: [
      'outline',
      'outline-color',
      'outlineColor',
      'outline-width',
      'outlineWidth',
      'outline-style',
      'outlineStyle',
      'box-shadow',
      'boxShadow',
    ],
    disabled: [
      'opacity',
      'cursor',
      'background-color',
      'backgroundColor',
      'color',
      'border-color',
      'borderColor',
    ],
  },
} as const;

// Regular Expression Patterns
export const PATTERNS = {
  HEX_COLOR: {
    SHORT: /^#[0-9A-Fa-f]{3}$/,
    LONG: /^#[0-9A-Fa-f]{6}$/,
    BOTH: /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/,
    INLINE: /#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g,
  },
  CSS_VARIABLE: {
    FALLBACK: /var\([^,]+,\s*([^)]+)\)/g,
    REFERENCE: /var\((--.+?)\)/,
    STRIP_FALLBACK: /var\([^,]+,\s*([^\)]+)\)/g,
  },
  COMPONENT_NAME: {
    STATE: /State=([^,]+)/i,
    VARIANT: /Variant=([^,]+)/i,
    PROPERTY: /Property\s*\d*\s*=\s*([^,]+)/i,
    TYPE: /Type=([^,]+)/i,
  },
  CAMEL_TO_KEBAB: /([A-Z])/g,
  KEBAB_TO_CAMEL: /-([a-z])/g,
  COMPONENT_SANITIZE: /[^a-z0-9]+/g,
  WHITESPACE_NORMALIZE: /\s+/g,
} as const;
