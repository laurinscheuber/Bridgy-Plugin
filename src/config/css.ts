

// CSS Units Configuration
export const CSS_UNITS = {
  AVAILABLE: [
    'px', 'rem', 'em', '%', 'vw', 'vh', 'vmin', 'vmax', 
    'pt', 'pc', 'in', 'cm', 'mm', 'ex', 'ch', 'fr', 'none'
  ],
  DEFAULT: 'px',
  
  // Improved Smart Default Patterns
  UNITLESS_PATTERNS: [
    // Core unitless properties
    'opacity', 'z-index', 'line-height', 'font-weight', 'flex', 'order',
    
    // Grid & Flexbox unitless
    'flex-grow', 'flexgrow', 'flex-shrink', 'flexshrink', 'grid-column', 'gridcolumn', 
    'grid-row', 'gridrow', 'grid-area', 'gridarea', 'column-count', 'columncount',
    
    // Animation & Transform unitless
    'animation-iteration-count', 'animationiterationcount', 'scale', 'rotate',
    
    // Other unitless properties
    'aspect-ratio', 'aspectratio', 'tab-size', 'tabsize', 'zoom', 'counter-reset', 'counterreset'
  ],
  
  // Typography units (prefer rem/em)
  TYPOGRAPHY_PATTERNS: [
    'font-size', 'fontsize', 'size', 'text', 'letter-spacing', 'letterspacing', 
    'word-spacing', 'wordspacing', 'text-indent', 'textindent'
  ],
  
  // Relative sizing (prefer %)
  RELATIVE_PATTERNS: [
    'width', 'height', 'top', 'right', 'bottom', 'left', 'inset'
  ],
  
  // Viewport units (prefer vw/vh)
  VIEWPORT_PATTERNS: [
    'viewport', 'screen', 'full-width', 'fullwidth', 'full-height', 'fullheight',
    'container-width', 'containerwidth', 'breakpoint'
  ],
  
  // Border radius (prefer px for small values, % for large)
  BORDER_RADIUS_PATTERNS: [
    'radius', 'rounded', 'corner', 'border-radius', 'borderradius'
  ],
  
  // Spacing (prefer rem for consistency)
  SPACING_PATTERNS: [
    'margin', 'padding', 'gap', 'space', 'spacing', 'gutter', 'offset', 'indent'
  ] as const
};

// CSS Properties Lists
export const CSS_PROPERTIES = {
  // Simple color properties (direct color values)
  SIMPLE_COLORS: [
    'accentColor',
    'backgroundColor', 
    'borderColor',
    'borderTopColor',
    'borderRightColor', 
    'borderBottomColor',
    'borderLeftColor',
    'borderBlockStartColor',
    'borderBlockEndColor',
    'borderInlineStartColor',
    'borderInlineEndColor',
    'caretColor',
    'color',
    'columnRuleColor',
    'fill',
    'floodColor',
    'lightingColor',
    'outlineColor',
    'scrollbarColor',
    'stopColor',
    'stroke',
    'textDecorationColor',
    'textEmphasisColor',
    'textShadowColor',
    'webkitTapHighlightColor',
    'webkitTextFillColor',
    'webkitTextStrokeColor'
  ],

  // Complex color properties (may contain multiple values including colors)
  COMPLEX_COLORS: [
    'background',
    'border',
    'borderTop',
    'borderRight', 
    'borderBottom',
    'borderLeft',
    'outline',
    'boxShadow',
    'textShadow',
    'filter'
  ],

  // Layout properties (often structural, not styling)
  LAYOUT: [
    'justifyContent',
    'alignItems', 
    'display',
    'flexDirection',
    'position'
  ],

  // Interactive properties (change on hover/focus/active)
  INTERACTIVE: [
    'background-color', 'backgroundColor',
    'color',
    'border-color', 'borderColor',
    'box-shadow', 'boxShadow',
    'opacity',
    'transform',
    'filter',
    'outline',
    'text-decoration-color', 'textDecorationColor',
    'border-width', 'borderWidth',
    'padding',
    'margin',
    'font-weight', 'fontWeight',
    'letter-spacing', 'letterSpacing',
    'text-shadow', 'textShadow',
    'border-radius', 'borderRadius',
    'outline-color', 'outlineColor',
    'outline-width', 'outlineWidth',
    'outline-style', 'outlineStyle',
    'cursor',
    'transition',
    'animation'
  ],

  // Static properties (don't typically change on interaction)
  STATIC: [
    'width', 'height',
    'min-width', 'minWidth',
    'min-height', 'minHeight', 
    'max-width', 'maxWidth',
    'max-height', 'maxHeight',
    'font-family', 'fontFamily',
    'font-size', 'fontSize',
    'line-height', 'lineHeight',
    'text-align', 'textAlign',
    'vertical-align', 'verticalAlign',
    'white-space', 'whiteSpace',
    'word-wrap', 'wordWrap',
    'word-break', 'wordBreak',
    'overflow',
    'overflow-x', 'overflowX',
    'overflow-y', 'overflowY',
    'z-index', 'zIndex',
    'flex-grow', 'flexGrow',
    'flex-shrink', 'flexShrink',
    'flex-basis', 'flexBasis',
    'order',
    'grid-column', 'gridColumn',
    'grid-row', 'gridRow',
    'grid-area', 'gridArea'
  ]
};