// Shared utility functions

/**
 * Converts a string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Converts a string to PascalCase
 */
export function toPascalCase(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

/**
 * Formats a CSS variable name with collection prefix
 */
export function formatCSSVariableName(collectionName: string, variableName: string): string {
  const collection = toKebabCase(collectionName);
  const variable = toKebabCase(variableName);
  return `--${collection}-${variable}`;
}

/**
 * Converts RGBA values to hex color
 */
export function rgbaToHex(r: number, g: number, b: number, a: number = 1): string {
  const toHex = (value: number) => {
    const hex = value.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  if (a === 1) {
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  const alphaHex = Math.round(a * 255);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}${toHex(alphaHex)}`;
}

/**
 * Parses component name to extract type and state information
 */
export function parseComponentName(name: string): {
  name: string;
  type: string | null;
  state: string | null;
} {
  const result = {
    name: name,
    type: null as string | null,
    state: null as string | null,
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
 * Generates a timestamp for feature branches
 */
export function generateTimestamp(): string {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').substring(0, 12);
}

/**
 * Creates a feature branch name from commit message
 */
export function createFeatureBranchName(commitMessage: string, prefix: string = "feature/"): string {
  const timestamp = generateTimestamp();
  const branchBase = commitMessage
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 20);
  
  return `${prefix}${branchBase}-${timestamp}`;
}