/**
 * Utility functions for formatting data
 */

/**
 * Format different value types for display
 */
function formatValue(value, type) {
  if (value === null || value === undefined) return 'null';

  if (type === 'FLOAT') {
    // Format numbers with up to 2 decimal places
    return typeof value === 'number' ? value.toFixed(2).replace(/\.00$/, '') : value;
  } else if (type === 'BOOLEAN') {
    return value ? 'true' : 'false';
  } else if (type === 'STRING') {
    return `"${value}"`;
  } else {
    return JSON.stringify(value);
  }
}

/**
 * Convert RGBA to HEX color
 */
function rgbaToHex(r, g, b, a = 1) {
  const toHex = (value) => {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  // If fully opaque, return hex without alpha
  if (a === 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Otherwise include alpha channel
  const alphaHex = Math.round(a * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaHex)}`;
}

/**
 * Extract component type and state from name
 */
function parseComponentName(name) {
  const result = {
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

/**
 * Format component styles for readability
 */
function formatStyles(styles) {
  if (!styles) return "";

  // Try to parse and format the JSON
  try {
    if (typeof styles === "string") {
      styles = JSON.parse(styles);
    }

    // Format the JSON with proper indentation
    const styleStr = JSON.stringify(styles, null, 2);
    
    // Apply syntax highlighting to the JSON
    const highlightedJson = highlightJson(styleStr);
    
    // Show more content in the collapsed view (up to 300 characters)
    // and add a "Click to expand" indicator
    if (styleStr.length > 300) {
      return highlightedJson.substring(0, 300) + "... (Click to expand)";
    }
    
    return highlightedJson;
  } catch (e) {
    return String(styles);
  }
}

/**
 * Function to highlight JSON syntax
 */
function highlightJson(json) {
  // First, ensure proper indentation for the opening brace
  json = json.replace(/^\s*{\s*/, '{\n  ');
  
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
}

/**
 * Create a kebab-case string from any string
 */
function toKebabCase(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Create a PascalCase string from any string
 */
function toPascalCase(str) {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Generate a timestamp for branch names
 */
function generateTimestamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 12);
}

/**
 * Create a feature branch name from commit message
 */
function createFeatureBranchName(commitMessage, prefix = "feature/") {
  const timestamp = generateTimestamp();
  const branchBase = commitMessage
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  
  return `${prefix}${branchBase}-${timestamp}`;
}

// Make functions globally available
window.formatters = {
  formatValue,
  rgbaToHex,
  parseComponentName,
  formatStyles,
  highlightJson,
  toKebabCase,
  toPascalCase,
  generateTimestamp,
  createFeatureBranchName
};