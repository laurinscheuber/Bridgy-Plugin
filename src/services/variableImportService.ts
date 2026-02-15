import { ErrorHandler } from '../utils/errorHandler';
// Note: We need to ensure figma types are available. Assuming global 'figma' is available in this context.

export interface ImportToken {
  name: string;
  value: string;
  type: 'color' | 'number' | 'string' | 'unknown';
  originalLine: string;
  lineNumber: number;
  isGradient?: boolean;
  isShadow?: boolean;
}

export interface DiffResult {
  added: ImportToken[];
  modified: { token: ImportToken; oldValue: any; existingId: string }[];
  unchanged: ImportToken[];
  conflicts: { token: ImportToken; existingValue: any; existingId: string }[];
}

export class VariableImportService {
  /**
   * Parse CSS content to extract variables
   */
  static parseCSS(content: string): ImportToken[] {
    const tokens: ImportToken[] = [];
    const lines = content.split('\n');

    // Regex for standard CSS variables: --name: value;
    const cssVarRegex = /^\s*--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/;

    // Regex for SCSS variables: $name: value;
    const scssVarRegex = /^\s*\$([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/;

    lines.forEach((line, index) => {
      let match = line.match(cssVarRegex);
      let isScss = false;

      if (!match) {
        match = line.match(scssVarRegex);
        isScss = true;
      }

      if (match) {
        const name = match[1].trim();
        let value = match[2].trim();

        // Remove !default for SCSS if present
        if (isScss) {
          value = value.replace(/\s*!default\s*$/, '');
        }

        // Determine type (basic heuristic)
        let type: ImportToken['type'] = 'string';
        let isGradient = false;
        let isShadow = false;

        // Check for gradients - simplified check
        if (value.includes('gradient(')) {
          isGradient = true;
          type = 'string'; // Gradients are not simple colors
        }

        // Check for shadows
        else if (
          value.includes('box-shadow') ||
          value.includes('drop-shadow') ||
          (value.match(/\d+px\s+\d+px/) && value.includes('rgba'))
        ) {
          isShadow = true;
          type = 'string';
        }
        // Check for colors
        else if (value.match(/^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+$)/)) {
          type = 'color';
        }
        // Check for numbers
        else if (value.match(/^-?\d*\.?\d+(px|rem|em|%)?$/)) {
          type = 'number';
        }

        // Convert CSS variable names to grouped format using the same logic as the UI preview
        // This matches the extractGroupFromTokenName function in main.js
        let groupedName = name;
        console.log(`[Parser] Original token name: "${name}"`);

        if (name.startsWith('--')) {
          groupedName = name.substring(2);
          console.log(`[Parser] Removed CSS prefix: "${groupedName}"`);
        }

        // Convert dash-separated names to slash-separated groups
        const parts = groupedName.split('-');
        console.log(`[Parser] Split into parts: [${parts.join(', ')}]`);

        if (parts.length > 1) {
          const groupPart = parts[0];
          const valuePart = parts.slice(1).join('-');
          groupedName = `${groupPart}/${valuePart}`;
          console.log(`[Parser] Converted to grouped format: "${groupedName}"`);
        } else {
          console.log(`[Parser] Single part, no grouping needed: "${groupedName}"`);
        }

        tokens.push({
          name: groupedName,
          value,
          type,
          originalLine: line.trim(),
          lineNumber: index + 1,
          isGradient,
          isShadow,
        });
      }
    });

    return tokens;
  }

  /**
   * Parse Tailwind CSS content (custom properties in @theme or simple key-value pairs)
   * This is a simplified parser for pasted tailwind config objects or CSS with @theme
   */
  /**
   * Parse Tailwind CSS content (custom properties in @theme or simple key-value pairs)
   * Supports:
   * 1. CSS Variables (standard or @theme)
   * 2. JS Config Objects (module.exports = { theme: ... } or const config = ...)
   */
  static parseTailwind(content: string): ImportToken[] {
    const trimmed = content.trim();

    // Detect JS object / config
    if (
      trimmed.startsWith('module.exports') ||
      trimmed.startsWith('export default') ||
      trimmed.startsWith('const') ||
      trimmed.startsWith('{') ||
      trimmed.includes('theme:')
    ) {
      return this.parseTailwindJSConfig(trimmed);
    }

    // Default to CSS parser for @theme or standard CSS
    return this.parseCSS(content);
  }

  /**
   * Parse Tailwind JS configuration object
   * Extracts tokens from theme/extend/colors, spacing, etc.
   * Flattens nested objects into kebab-case names.
   */
  private static parseTailwindJSConfig(content: string): ImportToken[] {
    const tokens: ImportToken[] = [];

    try {
      // 1. Sanitize content to make it vaguely parseable as JSON if possible,
      // or use a regex-based tokenizer for robustness against JS syntax (functions, unrelated code).
      // Since we can't eval() safely and don't have a full parser, we'll use a simplified approach:
      // Extract the 'theme' or 'extend' object block.

      // Simple strategy:
      // 1. Find 'colors:' block
      // 2. Parse recursively

      // We will look for known token categories
      const categories = ['colors', 'spacing', 'fontSize', 'borderRadius', 'boxShadow'];

      categories.forEach((category) => {
        // Regex to find "category: { ... }" block
        // This is tricky with nested braces.
        // We'll iterate through the string to capture the matching brace block.
        const catIndex = content.indexOf(`${category}:`);
        if (catIndex === -1) return;

        const blockStart = content.indexOf('{', catIndex);
        if (blockStart === -1) return;

        // Extract the block
        const block = this.extractBraceBlock(content, blockStart);
        if (block) {
          // Parse the content of the block (key: value or key: { ... })
          const categoryTokens = this.parseJSObjectBlock(block, category);
          tokens.push(...categoryTokens);
        }
      });
    } catch (e) {
      console.warn('Failed to parse Tailwind JS config', e);
    }

    return tokens;
  }

  /**
   * Helper to extract a balanced brace block { ... }
   */
  private static extractBraceBlock(text: string, startIndex: number): string | null {
    let depth = 0;
    let inString = false;
    let stringChar = '';

    for (let i = startIndex; i < text.length; i++) {
      const char = text[i];

      if (inString) {
        if (char === stringChar && text[i - 1] !== '\\') {
          inString = false;
        }
      } else {
        if (char === '"' || char === "'" || char === '`') {
          inString = true;
          stringChar = char;
        } else if (char === '{') {
          depth++;
        } else if (char === '}') {
          depth--;
          if (depth === 0) {
            return text.substring(startIndex, i + 1);
          }
        }
      }
    }
    return null;
  }

  /**
   * Recursive parser for JS object strings
   * Returns flattened tokens
   */
  private static parseJSObjectBlock(block: string, prefix: string): ImportToken[] {
    const tokens: ImportToken[] = [];

    // Remove outer braces
    const inner = block.trim().substring(1, block.trim().length - 1);

    // Split by comma, respecting nested braces/strings
    // This is a naive split. A true parser is needed for 100% accuracy but this covers 90% of copy-paste cases.
    // Instead of splitting, let's regex for "key: value" or "key: { ... }"

    // Regex matches: key : value OR key : { ... }
    // Group 1: key
    // Group 2: value (simple)
    // Group 3: value (object start)
    const regex = /([a-zA-Z0-9_$-]+|\"[^\"]+\"|'[^']+')\s*:\s*(?:({)|([^,}\]]+))/g;

    let match;
    // We need to manually iterate to handle the Nested Block correctly because Regex can't balance braces
    // So we use a hybrid approach: Find key, check if value starts with {, if so extract block.

    let currentIndex = 0;
    while (currentIndex < inner.length) {
      // Find next key
      const keyMatch = inner
        .substr(currentIndex)
        .match(/([a-zA-Z0-9_$-]+|\"[^\"]+\"|'[^']+')\s*:\s*/);
      if (!keyMatch) break;

      const key = keyMatch[1].replace(/['"]/g, ''); // Unquote
      const valueStart = currentIndex + keyMatch.index! + keyMatch[0].length;

      // Check if value is object
      if (inner[valueStart] === '{') {
        const subBlock = this.extractBraceBlock(inner, valueStart);
        if (subBlock) {
          const nextPrefix = prefix ? `${prefix}/${key}` : key;
          tokens.push(...this.parseJSObjectBlock(subBlock, nextPrefix));
          currentIndex = valueStart + subBlock.length;
          // Skip trailing comma
          const nextComma = inner.indexOf(',', currentIndex);
          if (nextComma !== -1 && nextComma < inner.indexOf(':', currentIndex)) {
            // Ensure comma belongs to this level
            currentIndex = nextComma + 1;
          }
        } else {
          // Error nested block
          console.warn(`Unbalanced block for key ${key}`);
          break;
        }
      } else {
        // Simple value (read until comma or end)
        // Note: Parsing "value" correctly is hard with multiple commas in colors (rgba).
        // Assuming simpler values for now.
        let potentialValue = '';
        let inStr = false;
        let strCh = '';
        let endFound = false;
        let j = valueStart;

        for (; j < inner.length; j++) {
          const char = inner[j];
          if (inStr) {
            if (char === strCh && inner[j - 1] !== '\\') inStr = false;
          } else {
            if (char === '"' || char === "'") {
              inStr = true;
              strCh = char;
            } else if (char === ',' || char === '}') {
              // End of value
              endFound = true;
              break;
            }
          }
          if (!endFound) potentialValue += char;
        }

        const value = potentialValue.trim().replace(/['"]/g, '');
        const tokenName = prefix ? `${prefix}/${key}` : key;

        // Determine type
        let type: ImportToken['type'] = 'string';
        if (value.match(/^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+$)/)) type = 'color';
        else if (value.match(/^-?\d*\.?\d+(px|rem|em|%)?$/)) type = 'number';

        tokens.push({
          name: tokenName,
          value: value,
          type: type,
          originalLine: `${key}: ${value}`,
          lineNumber: 0,
        });

        currentIndex = j + 1;
      }
    }

    return tokens;
  }

  /**
   * Compare parsed tokens against existing Figma variables
   */
  static compareTokens(newTokens: ImportToken[], existingVariables: any[]): DiffResult {
    const added: ImportToken[] = [];
    const modified: { token: ImportToken; oldValue: any; existingId: string }[] = [];
    const unchanged: ImportToken[] = [];
    const conflicts: { token: ImportToken; existingValue: any; existingId: string }[] = [];

    // Create a map of existing variables for faster lookup
    // Normalize names relative to how we export them?
    // If we export "color/primary", CSS might be "--color-primary".
    // We need a normalization strategy.

    const existingMap = new Map<string, any>();
    existingVariables.forEach((v) => {
      // Create normalized keys for matching
      // 1. Direct name match
      existingMap.set(v.name, v);

      // 2. CSS Variable format match (--name-path)
      const cssVarName = v.name.replace(/\//g, '-').toLowerCase();
      existingMap.set(cssVarName, v);
    });

    newTokens.forEach((token) => {
      // Try to find match
      let match = existingMap.get(token.name);

      if (!match) {
        // Try removing leading dashes if present
        let cleanName = token.name.replace(/^--|\$/, '');
        // Also apply sanitization (dots to hyphens) to match import behavior
        cleanName = cleanName.replace(/\./g, '-');

        match = existingMap.get(cleanName);
      }

      if (match) {
        // Value comparison is tricky (hex vs rgba etc).
        // For now, string comparison or simple equality.
        // In a real implementation we'd normalize colors.

        // For this pass, we simply assume they are different if strings don't match exactly,
        // unless we implement a color normalizer.
        const valuesMatch = this.valuesAreEquivalent(token.value, match);

        if (valuesMatch) {
          unchanged.push(token);
        } else {
          modified.push({
            token,
            oldValue: match.valuesByMode?.[0]?.value || 'mixed', // Simplified
            existingId: match.id,
          });
        }
      } else {
        added.push(token);
      }
    });

    return { added, modified, unchanged, conflicts };
  }

  private static valuesAreEquivalent(cssValue: string, figmaVariable: any): boolean {
    // TODO: Implement sophisticated color matching (e.g. tinycolor2 or equivalent)
    // For now simple check
    // Figma variable structure depends on how we collected it (plugin.ts output)

    // Check first mode value
    const firstMode = figmaVariable.valuesByMode?.[0];
    if (!firstMode) return false;

    // This is a naive comparison.
    // cssValue: "#fff" vs figmaValue: {r:1, g:1, b:1}
    // For now, return false to be safe and show potential diff
    return false;
  }

  /**
   * Apply variables to Figma
   */
  static async importVariables(
    tokens: ImportToken[],
    options: {
      collectionId?: string;
      collectionName?: string;
      strategy: 'merge' | 'overwrite';
      organizeByCategories?: boolean;
    },
  ): Promise<{ success: number; errors: string[]; groupsCreated: number }> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        console.log(
          `[Import] Starting import of ${tokens.length} tokens with options:`,
          JSON.stringify(options),
        );
        let collection: VariableCollection;

        // 1. Get or Create Collection
        if (options.collectionId) {
          console.log(`[Import] Looking for collection with ID: ${options.collectionId}`);
          collection = await figma.variables.getVariableCollectionByIdAsync(options.collectionId);
          if (!collection) throw new Error(`Collection ${options.collectionId} not found`);
        } else {
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          const name = options.collectionName || 'Imported Variables';
          console.log(`[Import] Looking for collection with name: ${name}`);
          collection = collections.find((c) => c.name === name);
          if (!collection) {
            console.log(`[Import] Creating new collection: ${name}`);
            collection = figma.variables.createVariableCollection(name);
          } else {
            console.log(`[Import] Found existing collection: ${name}`);
          }
        }

        let successCount = 0;
        const errors: string[] = [];

        // Safety check for modes
        // Ensure we have at least one mode. If length is 0, we must create/rename one.
        // Note: New collections usually have one mode.
        if (!collection.modes || collection.modes.length === 0) {
          console.log('[Import] Collection has no modes, attempting recovery...');
          // Cannot really "create" a mode easily if 0 exist without rename hack or potentially API limits?
          // Typically createVariableCollection makes one mode.
          // If we are here, something is weird.
          // Try renaming default?
          try {
            collection.renameMode(collection.modes[0]?.modeId || 'Mode 1', 'Mode 1');
          } catch (e) {
            console.log('[Import] Mode recovery failed or unnecessary:', e);
          }
        }

        // Double check modes
        if (!collection.modes || collection.modes.length === 0) {
          throw new Error('Collection has no modes and could not recover');
        }

        const modeId = collection.modes[0].modeId;
        console.log(`[Import] Using Mode ID: ${modeId} (${collection.modes[0].name})`);

        // First pass: collect all groups needed
        const groups = new Set<string>();
        console.log(`[Import] Analyzing ${tokens.length} tokens for groups...`);

        for (const token of tokens) {
          let varName = token.name;
          console.log(`[Import] Processing token: "${token.name}"`);

          if (varName.startsWith('--')) {
            varName = varName.substring(2);
            console.log(`[Import] Removed CSS prefix: "${varName}"`);
          }
          if (varName.startsWith('$')) {
            varName = varName.substring(1);
            console.log(`[Import] Removed SCSS prefix: "${varName}"`);
          }
          varName = varName.replace(/\./g, '-');

          if (varName.includes('/')) {
            const groupName = varName.substring(0, varName.lastIndexOf('/'));
            console.log(`[Import] Found group in "${varName}": "${groupName}"`);

            if (groupName) {
              // Add all levels of the hierarchy
              const parts = groupName.split('/');
              for (let i = 0; i < parts.length; i++) {
                const groupPath = parts.slice(0, i + 1).join('/');
                groups.add(groupPath);
                console.log(`[Import] Added group to set: "${groupPath}"`);
              }
            }
          } else {
            console.log(`[Import] No group found in variable name: "${varName}"`);
          }
        }

        // In Figma, groups are created implicitly when variables have slashes in their names
        // We don't need to explicitly create groups - they appear automatically
        console.log(
          `[Import] Variables will be organized into ${groups.size} groups based on their names`,
        );

        // OPTIMIZATION: Fetch ALL variables once to avoid thousands of async calls
        const existingVariablesMap = new Map<string, Variable>();
        let paintStylesMap: Map<string, PaintStyle>;
        let effectStylesMap: Map<string, EffectStyle>;

        try {
          const allVariables = await figma.variables.getLocalVariablesAsync();
          for (const v of allVariables) {
            if (v.variableCollectionId === collection.id) {
              existingVariablesMap.set(v.name, v);
            }
          }

          const paintStyles = await figma.getLocalPaintStylesAsync();
          const effectStyles = await figma.getLocalEffectStylesAsync();

          paintStylesMap = new Map();
          paintStyles.forEach((s) => paintStylesMap.set(s.name, s));

          effectStylesMap = new Map();
          effectStyles.forEach((s) => effectStylesMap.set(s.name, s));
        } catch (err) {
          console.error('[Import] Error fetching local variables/styles:', err);
          throw new Error('Failed to fetch existing variables or styles');
        }

        console.log(`[Import] Processing ${tokens.length} tokens...`);

        for (const token of tokens) {
          try {
            // Normalize name
            let varName = token.name;
            console.log(`[Import] Processing variable creation for: "${token.name}"`);

            if (varName.startsWith('--')) {
              varName = varName.substring(2);
              console.log(`[Import] After removing CSS prefix: "${varName}"`);
            }
            if (varName.startsWith('$')) {
              varName = varName.substring(1);
              console.log(`[Import] After removing SCSS prefix: "${varName}"`);
            }

            // Sanitize name for Figma (replace dots with hyphens or underscores, keep slashes)
            // Figma variables allow /, -, _ but not .
            varName = varName.replace(/\./g, '-');

            // If organization is disabled, flatten the name (replace slashes with dashes)
            if (options.organizeByCategories === false) {
              varName = varName.replace(/\//g, '-');
              console.log(`[Import] Flattened variable name (categories disabled): "${varName}"`);
            }

            console.log(`[Import] Final variable name to create: "${varName}"`);

            // Check if this variable name contains a slash for grouping
            if (varName.includes('/')) {
              console.log(`[Import] Variable "${varName}" WILL create groups in Figma`);
            } else {
              console.log(`[Import] Variable "${varName}" will NOT create groups (no slash)`);
            }

            // Groups are already created above, no need to track them here

            // Infer type/properties if missing (UI passes 'COLOR' etc, backend expects 'color')
            // and may not pass isGradient/isShadow boolean flags
            if (token.type) {
              const lowerType = token.type.toLowerCase();

              if (
                lowerType === 'gradient' ||
                lowerType === 'linear-gradient' ||
                lowerType === 'radial-gradient'
              ) {
                token.isGradient = true;
              }
              if (lowerType === 'shadow' || lowerType === 'box-shadow') {
                token.isShadow = true;
              }

              // Update type to be compatible with mapTokenTypeToFigmaType if not already
              if (['color', 'number', 'string'].indexOf(lowerType) !== -1) {
                token.type = lowerType as any;
              } else if (lowerType === 'float') {
                token.type = 'number' as any;
              }
            }

            if (token.isGradient) {
              this.createGradientStyle(token, paintStylesMap, options.strategy === 'overwrite');
              successCount++;
              console.log(`[Import] ✓ Created gradient style: ${varName}`);
              continue;
            }

            if (token.isShadow) {
              this.createShadowStyle(token, effectStylesMap, options.strategy === 'overwrite');
              successCount++;
              console.log(`[Import] ✓ Created shadow style: ${varName}`);
              continue;
            }

            // 3. Resolve Value & Type *Before* Creation
            // Try to handle aliases if value contains var(--...)
            let val = this.parseValueForFigma(token.value, token.type);

            // If simple parsing failed, try to resolve alias
            if (val === undefined && token.value.includes('var(')) {
              // Extract variable name from var(--name)
              const match = token.value.match(/var\((--[^)]+)\)/);
              if (match) {
                const aliasName = match[1].replace(/^--/, '');
                // Find the aliased variable
                const aliasedVar = existingVariablesMap.get(aliasName);
                if (aliasedVar) {
                  // Create built-in alias
                  val = figma.variables.createVariableAlias(aliasedVar);
                  console.log(`[Import] Resolved alias for ${varName} -> ${aliasName}`);

                  // Helper: if we inferred generic STRING but resolved to an alias of specific type,
                  // update our token type to match the aliased variable's type.
                  if (token.type === 'string' && aliasedVar.resolvedType) {
                    if (aliasedVar.resolvedType === 'COLOR') token.type = 'color';
                    else if (aliasedVar.resolvedType === 'FLOAT') token.type = 'number';
                  }
                } else {
                  console.warn(`[Import] Could not find variable for alias: ${aliasName}`);
                }
              }

              // Handle complex values with vars like rgba(..., var(...))
              // This requires resolving the VAR to its value first.
              if (val === undefined) {
                // Try to resolve content of var()
                let resolvedString = token.value;
                let hasUnresolved = false;

                // Replace all var(--x) with their values
                resolvedString = resolvedString.replace(
                  /var\((--[^)]+)\)/g,
                  (fullMatch, cssVarName) => {
                    const name = cssVarName.replace(/^--/, '');
                    // Check existing map first (ground truth)
                    const existing = existingVariablesMap.get(name);
                    if (existing) {
                      // We need the VALUE of that variable.
                      const modeVal = existing.valuesByMode[modeId];
                      if (typeof modeVal === 'object' && 'r' in modeVal) {
                        // Color
                        const alpha = 'a' in modeVal ? modeVal.a : 1;
                        return `rgba(${Math.round(modeVal.r * 255)}, ${Math.round(modeVal.g * 255)}, ${Math.round(modeVal.b * 255)}, ${alpha})`;
                      } else if (typeof modeVal === 'number') {
                        return modeVal.toString();
                      }
                    }

                    // Check tokens list
                    const t = tokens.find((t) => t.name === cssVarName);
                    if (t) {
                      if (!t.value.includes('var(')) return t.value;
                    }

                    hasUnresolved = true;
                    return fullMatch;
                  },
                );

                if (!hasUnresolved) {
                  val = this.parseValueForFigma(resolvedString, token.type);
                  // If successful, and generic type was string, check if it looks like color now
                  if (val !== undefined && token.type === 'string') {
                    if (this.parseColor(resolvedString)) token.type = 'color';
                  }
                }
              }
            }

            // 4. Find or Create Variable
            let targetVar = existingVariablesMap.get(varName);
            const desiredType = this.mapTokenTypeToFigmaType(token.type);

            if (targetVar) {
              // Check for type mismatch
              if (
                desiredType &&
                targetVar.resolvedType !== desiredType &&
                options.strategy === 'overwrite'
              ) {
                console.warn(
                  `[Import] Type mismatch for ${varName} (Existing: ${targetVar.resolvedType}, New: ${desiredType}). Re-creating...`,
                );
                try {
                  targetVar.remove();
                  targetVar = undefined; // Proceed to create new
                } catch (e) {
                  console.error(`[Import] Failed to remove mismatched variable ${varName}:`, e);
                  errors.push(`Failed to remove mismatched variable ${varName}`);
                  continue;
                }
              } else if (options.strategy === 'merge') {
                // Skip if exists (and no mismatch handling needed or ignoring it)
                successCount++;
                continue;
              }
            }

            if (!targetVar) {
              // Create new
              if (!desiredType) {
                console.warn(
                  `[Import] Skipped ${token.name}: Unsupported variable type ${token.type}`,
                );
                errors.push(`Skipped ${token.name}: Unsupported variable type ${token.type}`);
                continue;
              }
              try {
                console.log(
                  `[Import] Creating variable '${varName}' in collection '${collection.name}' (ID: ${collection.id}) with type '${desiredType}'`,
                );

                try {
                  targetVar = figma.variables.createVariable(varName, collection.id, desiredType);
                } catch (e: any) {
                  if (e.message && e.message.includes('pass the collection node')) {
                    console.warn(
                      "[Import] 'createVariable' requested collection node. Retrying with collection object...",
                    );
                    // @ts-ignore
                    targetVar = figma.variables.createVariable(varName, collection, desiredType);
                  } else {
                    throw e;
                  }
                }

                existingVariablesMap.set(varName, targetVar);
                console.log(`[Import] Created variable: ${varName} (ID: ${targetVar.id})`);
              } catch (createErr: any) {
                console.error(`[Import] Failed to create variable ${varName}:`, createErr);
                errors.push(`Failed to create variable ${varName}: ${createErr.message}`);
                continue;
              }
            }

            // 5. Set Value
            if (val !== undefined && targetVar) {
              try {
                targetVar.setValueForMode(modeId, val);
                successCount++;
              } catch (err: any) {
                console.error(`[Import] Failed to set value for ${token.name}:`, err);
                // Specialized error message for type mismatch
                if (err.message.includes('Mismatched variable resolved type')) {
                  errors.push(
                    `Type mismatch for ${token.name}: Variable is ${targetVar.resolvedType} but value is incompatible.`,
                  );
                } else {
                  errors.push(`Failed to set value for ${token.name}: ${err.message}`);
                }
              }
            } else if (!targetVar) {
              errors.push(`No target variable for ${token.name}`);
            } else {
              console.warn(`[Import] Failed to parse value for ${token.name}: ${token.value}`);
              errors.push(`Failed to parse value for ${token.name}: ${token.value}`);
            }
          } catch (e: any) {
            console.error(`[Import] Error importing ${token.name}:`, e);
            errors.push(`Error importing ${token.name}: ${e.message}`);
          }
        }

        console.log(`[Import] Completed. Success: ${successCount}/${tokens.length}`);
        if (errors.length > 0) {
          console.log(`[Import] Errors:`, errors);
        }

        console.log(`[Import] Final groups set contents: [${Array.from(groups).join(', ')}]`);
        console.log(`[Import] Total groups created: ${groups.size}`);

        return { success: successCount, errors, groupsCreated: groups.size };
      },
      {
        operation: 'import_variables',
        component: 'VariableImportService',
        severity: 'medium',
      },
    );
  }

  /**
   * Create a Paint Style for a gradient token
   * Now synchronous using pre-fetched map
   */
  private static createGradientStyle(
    token: ImportToken,
    stylesMap: Map<string, PaintStyle>,
    overwrite: boolean,
  ) {
    // Support linear, radial, and conic gradients
    const isLinear = token.value.includes('linear-gradient');
    const isRadial = token.value.includes('radial-gradient');
    const isConic = token.value.includes('conic-gradient');

    if (!isLinear && !isRadial && !isConic) return;

    const styleName = token.name.replace(/^--|\$/, '');

    let style = stylesMap.get(styleName);

    if (style && !overwrite) return;

    if (!style) {
      style = figma.createPaintStyle();
      style.name = styleName;
      stylesMap.set(styleName, style); // Add to map for lookup
    }

    try {
      let gradient: GradientPaint | null = null;

      if (isLinear) {
        gradient = this.parseLinearGradient(token.value);
      } else if (isRadial) {
        gradient = this.parseRadialGradient(token.value);
      } else if (isConic) {
        gradient = this.parseConicGradient(token.value);
      }

      if (gradient) {
        style.paints = [gradient];
      }
    } catch (error) {
      console.warn(`Failed to parse gradient ${token.name}:`, error);
      // Fallback to simple gradient
      const fallback: GradientPaint = {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [1, 0, 0],
          [0, 1, 0],
        ],
        gradientStops: [
          { position: 0, color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
          { position: 1, color: { r: 0.8, g: 0.8, b: 0.8, a: 1 } },
        ],
      };
      style.paints = [fallback];
    }
  }

  /**
   * Create an Effect Style for a shadow token
   * Now synchronous using pre-fetched map
   */
  private static createShadowStyle(
    token: ImportToken,
    stylesMap: Map<string, EffectStyle>,
    overwrite: boolean,
  ) {
    const styleName = token.name.replace(/^--|\$/, '');
    let style = stylesMap.get(styleName);

    if (style && !overwrite) return;
    if (!style) {
      style = figma.createEffectStyle();
      style.name = styleName;
      stylesMap.set(styleName, style);
    }

    // Parse shadow values
    const value = token.value.trim();
    const isInset = value.includes('inset');

    // Remove 'inset' keyword for easier parsing
    const cleanValue = value.replace('inset', '').trim();

    // Parse color (hex, rgb, rgba, hsl, named)
    // We look for color patterns first to separate them from lengths
    let color: RGBA = { r: 0, g: 0, b: 0, a: 0.2 }; // Default black with opacity

    // Match color parts
    // 1. Hex
    const hexMatch = cleanValue.match(/#[0-9a-fA-F]{3,8}/);
    if (hexMatch) {
      const parsed = this.parseColor(hexMatch[0]);
      if (parsed) color = parsed;
    }
    // 2. RGB/HSL/Named - complex regex or reuse parseColor on parts
    else {
      // Try to extract parts that look like color
      const parts = cleanValue.split(/\s+/);
      for (const part of parts) {
        if (this.isColorStop(part)) {
          const parsed = this.parseColor(part);
          if (parsed) {
            color = parsed;
            break;
          }
        }
      }
    }

    // Extract lengths (px, em, rem, or unitless 0)
    // Regex for numbers with optional units
    const lengthRegex = /(-?\d*\.?\d+)(px|rem|em|%)?/g;
    const lengths: number[] = [];
    let match;
    while ((match = lengthRegex.exec(cleanValue)) !== null) {
      lengths.push(parseFloat(match[1]));
    }

    // CSS Shadow order: offset-x | offset-y | blur-radius | spread-radius
    // At least 2 lengths (offsets) are required

    let x = 0,
      y = 4,
      blur = 4,
      spread = 0;

    if (lengths.length >= 2) {
      x = lengths[0];
      y = lengths[1];
    }
    if (lengths.length >= 3) {
      blur = lengths[2];
    }
    if (lengths.length >= 4) {
      spread = lengths[3];
    }

    style.effects = [
      {
        type: isInset ? 'INNER_SHADOW' : 'DROP_SHADOW',
        color: color,
        offset: { x, y },
        radius: blur,
        spread: spread,
        visible: true,
        blendMode: 'NORMAL',
      },
    ];
  }

  private static mapTokenTypeToFigmaType(
    type: ImportToken['type'],
  ): VariableResolvedDataType | null {
    switch (type) {
      case 'color':
        return 'COLOR';
      case 'number':
        return 'FLOAT';
      case 'string':
        return 'STRING';
      default:
        return 'STRING';
    }
  }

  private static parseValueForFigma(value: string, type: ImportToken['type']): any {
    if (type === 'color') {
      return this.parseColor(value);
    }
    if (type === 'number') {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return value;
  }

  private static parseColor(colorStr: string): RGBA | undefined {
    try {
      // Remove spaces and convert to lowercase for easier parsing
      const cleanColor = colorStr.trim().toLowerCase();

      // Hex colors
      if (cleanColor.startsWith('#')) {
        const hex = cleanColor.substring(1);
        if (hex.length === 3) {
          const r = parseInt(hex[0] + hex[0], 16) / 255;
          const g = parseInt(hex[1] + hex[1], 16) / 255;
          const b = parseInt(hex[2] + hex[2], 16) / 255;
          return { r, g, b, a: 1 };
        }
        if (hex.length === 6) {
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          return { r, g, b, a: 1 };
        }
        if (hex.length === 8) {
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          const a = parseInt(hex.substring(6, 8), 16) / 255;
          return { r, g, b, a };
        }
      }

      // RGB/RGBA
      if (cleanColor.startsWith('rgb')) {
        // Match both rgb(r, g, b) and rgba(r, g, b, a) formats
        const match = cleanColor.match(
          /rgba?\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/,
        );
        if (match) {
          return {
            r: Math.min(1, parseFloat(match[1]) / 255),
            g: Math.min(1, parseFloat(match[2]) / 255),
            b: Math.min(1, parseFloat(match[3]) / 255),
            a: match[4] !== undefined ? parseFloat(match[4]) : 1,
          };
        }
      }

      // HSL/HSLA conversion
      if (cleanColor.startsWith('hsl')) {
        const match = cleanColor.match(
          /hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/,
        );
        if (match) {
          const h = parseInt(match[1]) / 360;
          const s = parseInt(match[2]) / 100;
          const l = parseInt(match[3]) / 100;
          const a = match[4] !== undefined ? parseFloat(match[4]) : 1;

          // Convert HSL to RGB
          const c = (1 - Math.abs(2 * l - 1)) * s;
          const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
          const m = l - c / 2;

          let r = 0,
            g = 0,
            b = 0;
          if (h < 1 / 6) {
            r = c;
            g = x;
            b = 0;
          } else if (h < 2 / 6) {
            r = x;
            g = c;
            b = 0;
          } else if (h < 3 / 6) {
            r = 0;
            g = c;
            b = x;
          } else if (h < 4 / 6) {
            r = 0;
            g = x;
            b = c;
          } else if (h < 5 / 6) {
            r = x;
            g = 0;
            b = c;
          } else {
            r = c;
            g = 0;
            b = x;
          }

          return { r: r + m, g: g + m, b: b + m, a };
        }
      }

      // Named colors
      const namedColors: { [key: string]: RGBA } = {
        transparent: { r: 0, g: 0, b: 0, a: 0 },
        black: { r: 0, g: 0, b: 0, a: 1 },
        white: { r: 1, g: 1, b: 1, a: 1 },
        red: { r: 1, g: 0, b: 0, a: 1 },
        green: { r: 0, g: 0.5, b: 0, a: 1 },
        blue: { r: 0, g: 0, b: 1, a: 1 },
        yellow: { r: 1, g: 1, b: 0, a: 1 },
        cyan: { r: 0, g: 1, b: 1, a: 1 },
        magenta: { r: 1, g: 0, b: 1, a: 1 },
        gray: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
        grey: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
      };

      if (namedColors[cleanColor]) {
        return namedColors[cleanColor];
      }

      // CSS Variables or complex values - return undefined
      if (cleanColor.includes('var(') || cleanColor.includes('calc(')) {
        console.warn(`Cannot parse CSS variable or calc expression: ${colorStr}`);
        return undefined;
      }
    } catch (error) {
      console.error(`Error parsing color "${colorStr}":`, error);
    }

    // Fallback
    console.warn(`Unable to parse color: ${colorStr}`);
    return undefined;
  }

  /**
   * Parse linear gradient CSS value into Figma GradientPaint
   */
  private static parseLinearGradient(value: string): GradientPaint {
    // Extract gradient content: linear-gradient(direction, color-stops)
    const match = value.match(/linear-gradient\s*\(\s*([^)]+)\)/);
    if (!match) throw new Error('Invalid linear gradient syntax');

    const content = match[1];
    const parts = this.parseGradientParts(content);

    // Parse direction (default is to bottom = 180deg)
    let angle = 180; // Default to bottom
    const firstPart = parts[0].trim();

    if (firstPart.includes('deg')) {
      angle = parseInt(firstPart.replace('deg', ''));
      parts.shift(); // Remove direction part
    } else if (firstPart.startsWith('to ')) {
      // Handle directional keywords
      if (firstPart.includes('right')) angle = 90;
      else if (firstPart.includes('left')) angle = 270;
      else if (firstPart.includes('top')) angle = 0;
      else if (firstPart.includes('bottom')) angle = 180;
      parts.shift(); // Remove direction part
    }

    // Parse color stops
    const stops = this.parseGradientStops(parts);

    // Convert angle to Figma transform matrix
    const transform = this.angleToGradientTransform(angle);

    return {
      type: 'GRADIENT_LINEAR',
      gradientTransform: transform,
      gradientStops: stops,
    };
  }

  /**
   * Parse radial gradient CSS value into Figma GradientPaint
   */
  private static parseRadialGradient(value: string): GradientPaint {
    const match = value.match(/radial-gradient\s*\(\s*([^)]+)\)/);
    if (!match) throw new Error('Invalid radial gradient syntax');

    const content = match[1];
    const parts = this.parseGradientParts(content);

    // Skip shape/size parsing for now, just get color stops
    // Remove any non-color parts from the beginning
    while (parts.length > 0 && !this.isColorStop(parts[0])) {
      parts.shift();
    }

    const stops = this.parseGradientStops(parts);

    return {
      type: 'GRADIENT_RADIAL',
      gradientTransform: [
        [1, 0, 0.5],
        [0, 1, 0.5],
      ], // Centered radial
      gradientStops: stops,
    };
  }

  /**
   * Parse conic gradient CSS value into Figma GradientPaint
   */
  private static parseConicGradient(value: string): GradientPaint {
    const match = value.match(/conic-gradient\s*\(\s*([^)]+)\)/);
    if (!match) throw new Error('Invalid conic gradient syntax');

    const content = match[1];
    const parts = this.parseGradientParts(content);

    // Skip angle/position parsing for now, just get color stops
    while (parts.length > 0 && !this.isColorStop(parts[0])) {
      parts.shift();
    }

    const stops = this.parseGradientStops(parts);

    return {
      type: 'GRADIENT_ANGULAR',
      gradientTransform: [
        [1, 0, 0.5],
        [0, 1, 0.5],
      ], // Centered angular
      gradientStops: stops,
    };
  }

  /**
   * Split gradient content into parts, handling nested functions
   */
  private static parseGradientParts(content: string): string[] {
    const parts: string[] = [];
    let current = '';
    let depth = 0;

    for (let i = 0; i < content.length; i++) {
      const char = content[i];

      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (char === ',' && depth === 0) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      }

      current += char;
    }

    if (current.trim()) parts.push(current.trim());
    return parts;
  }

  /**
   * Check if a string looks like a color stop
   */
  private static isColorStop(part: string): boolean {
    const trimmed = part.trim();
    return (
      trimmed.includes('#') ||
      trimmed.includes('rgb') ||
      trimmed.includes('hsl') ||
      trimmed.includes('var(') ||
      /^[a-zA-Z]+(\s+\d+%?)?$/.test(trimmed)
    ); // Named colors with optional position
  }

  /**
   * Parse color stops from gradient parts
   */
  private static parseGradientStops(parts: string[]): ColorStop[] {
    const stops: ColorStop[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;

      // Split color from position
      const colorStopMatch = part.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?%?))?$/);
      if (!colorStopMatch) continue;

      const colorStr = colorStopMatch[1].trim();
      const positionStr = colorStopMatch[2];

      const color = this.parseColor(colorStr);
      if (!color) continue; // Skip invalid colors

      let position = 0;
      if (positionStr) {
        if (positionStr.includes('%')) {
          position = parseFloat(positionStr.replace('%', '')) / 100;
        } else {
          // Assume px or other unit, convert to percentage
          position = parseFloat(positionStr) / 100;
        }
      } else {
        // Auto-distribute stops without explicit positions
        position = i / Math.max(1, parts.length - 1);
      }

      position = Math.max(0, Math.min(1, position)); // Clamp to 0-1

      stops.push({ position, color });
    }

    // Ensure we have at least 2 stops
    if (stops.length === 0) {
      stops.push(
        { position: 0, color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
        { position: 1, color: { r: 0.8, g: 0.8, b: 0.8, a: 1 } },
      );
    } else if (stops.length === 1) {
      const firstColor = stops[0].color;
      stops.length = 0; // Clear array
      stops.push({ position: 0, color: firstColor }, { position: 1, color: firstColor });
    }

    // Sort by position
    stops.sort((a, b) => a.position - b.position);

    return stops;
  }

  /**
   * Convert CSS angle to Figma gradient transform matrix
   */
  private static angleToGradientTransform(degrees: number): Transform {
    const radians = (degrees * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);

    // Figma's gradient transform: [[scaleX, skewY, offsetX], [skewX, scaleY, offsetY]]
    // For linear gradients, we set up a transform that represents the gradient direction
    return [
      [cos, -sin, 0.5],
      [sin, cos, 0.5],
    ];
  }
}
