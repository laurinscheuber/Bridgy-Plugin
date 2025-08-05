// Testing Configuration
export const TEST_CONFIG = {
  SELECTORS: {
    DEFAULT_ELEMENTS: 'button, div, span, a, p, h1, h2, h3, h4, h5, h6',
    COMPONENT_PATTERN: '.{componentName}',
    SIZE_MODIFIER_PATTERNS: ['{selector}--{size}', '{selector}.{size}']
  },
  STATES: {
    PSEUDO: ['hover', 'active', 'focus', 'disabled'] as const,
    CUSTOM: ['loading', 'error', 'success'] as const,
    INTERACTIVE: ['hover', 'active', 'focus', 'disabled'] as const
  },
  SIZES: {
    STANDARD: ['xs', 'sm', 'md', 'base', 'lg', 'xl', 'xxl'] as const,
    ALTERNATIVE: ['small', 'medium', 'large', 'x-small', 'x-large'] as const,
    DEFAULT_SET: ['sm', 'base', 'lg', 'xl'] as const
  },
  IMPORTS: {
    ANGULAR_TESTING: '@angular/core/testing',
    ANGULAR_CORE: '@angular/core'
  },
  STATE_SPECIFIC_PROPERTIES: {
    hover: [
      'background-color', 'backgroundColor',
      'color', 
      'border-color', 'borderColor',
      'box-shadow', 'boxShadow',
      'opacity',
      'transform'
    ],
    active: [
      'background-color', 'backgroundColor',
      'color',
      'border-color', 'borderColor', 
      'box-shadow', 'boxShadow',
      'transform'
    ],
    focus: [
      'outline',
      'outline-color', 'outlineColor',
      'outline-width', 'outlineWidth',
      'outline-style', 'outlineStyle',
      'box-shadow', 'boxShadow'
    ],
    disabled: [
      'opacity',
      'cursor',
      'background-color', 'backgroundColor',
      'color',
      'border-color', 'borderColor'
    ]
  }
} as const;

// Regular Expression Patterns
export const PATTERNS = {
  HEX_COLOR: {
    SHORT: /^#[0-9A-Fa-f]{3}$/,
    LONG: /^#[0-9A-Fa-f]{6}$/,
    BOTH: /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/,
    INLINE: /#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g
  },
  CSS_VARIABLE: {
    FALLBACK: /var\([^,]+,\s*([^)]+)\)/g,
    REFERENCE: /var\((--.+?)\)/,
    STRIP_FALLBACK: /var\([^,]+,\s*([^\)]+)\)/g
  },
  COMPONENT_NAME: {
    STATE: /State=([^,]+)/i,
    SIZE: /Size=([^,]+)/i,
    VARIANT: /Variant=([^,]+)/i,
    PROPERTY: /Property\s*\d*\s*=\s*([^,]+)/i,
    TYPE: /Type=([^,]+)/i
  },
  CAMEL_TO_KEBAB: /([A-Z])/g,
  KEBAB_TO_CAMEL: /-([a-z])/g,
  COMPONENT_SANITIZE: /[^a-z0-9]+/g,
  WHITESPACE_NORMALIZE: /\s+/g
} as const;