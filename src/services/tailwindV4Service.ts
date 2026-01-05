import { ErrorHandler } from '../utils/errorHandler';

/**
 * Tailwind v4 Service
 * Handles validation and formatting for Tailwind v4 CSS token structure
 */

// Valid Tailwind v4 namespaces
// Based on: https://tailwindcss.com/docs/theme
export const TAILWIND_V4_NAMESPACES = [
  'color',
  'font',
  'text',
  'font-weight',
  'tracking',
  'leading',
  'breakpoint',
  'container',
  'spacing',
  'radius',
  'shadow',
  'inset-shadow',
  'drop-shadow',
  'blur',
  'perspective',
  'aspect',
  'ease',
  'animate',
] as const;

export type TailwindV4Namespace = (typeof TAILWIND_V4_NAMESPACES)[number];

interface VariableGroup {
  name: string;
  isValid: boolean;
  namespace?: string;
  variableCount: number;
}

interface ValidationResult {
  isValid: boolean;
  groups: VariableGroup[];
  invalidGroups: string[];
}

export class TailwindV4Service {
  /**
   * Check if a group name is a valid Tailwind v4 namespace
   */
  static isValidNamespace(groupName: string): boolean {
    const normalized = groupName.toLowerCase().trim();
    return TAILWIND_V4_NAMESPACES.indexOf(normalized as TailwindV4Namespace) !== -1;
  }

  /**
   * Validate all variable groups for Tailwind v4 compatibility
   */
  static async validateVariableGroups(): Promise<ValidationResult> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        const collections = await figma.variables.getLocalVariableCollectionsAsync();

        if (!collections || collections.length === 0) {
          return {
            isValid: true, // Empty is technically valid
            groups: [],
            invalidGroups: [],
          };
        }

        const allGroups: VariableGroup[] = [];
        const invalidGroups: string[] = [];

        for (const collection of collections) {
          const groupMap = new Map<string, number>();

          // Count variables per group
          for (const variableId of collection.variableIds) {
            const variable = await figma.variables.getVariableByIdAsync(variableId);
            if (!variable) continue;

            const pathMatch = variable.name.match(/^([^\/]+)\//);
            if (pathMatch) {
              const groupName = pathMatch[1];
              groupMap.set(groupName, (groupMap.get(groupName) || 0) + 1);
            }
          }

          // Validate each group
          for (const [groupName, count] of groupMap.entries()) {
            const isValid = this.isValidNamespace(groupName);
            const groupInfo: VariableGroup = {
              name: groupName,
              isValid,
              namespace: isValid ? groupName.toLowerCase() : undefined,
              variableCount: count,
            };

            allGroups.push(groupInfo);

            if (!isValid) {
              invalidGroups.push(groupName);
            }
          }
        }

        return {
          isValid: invalidGroups.length === 0,
          groups: allGroups,
          invalidGroups,
        };
      },
      {
        operation: 'validate_tailwind_v4_groups',
        component: 'TailwindV4Service',
        severity: 'medium',
      },
    );
  }

  /**
   * Format variable name for Tailwind v4
   * Removes the group prefix and formats the rest
   */
  static formatTailwindVariableName(name: string): string {
    // Remove group prefix (e.g., "color/primary-500" -> "primary-500")
    const withoutPrefix = name.replace(/^[^\/]+\//, '');

    // Convert to lowercase and replace non-alphanumeric chars with hyphens
    return withoutPrefix.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  }

  /**
   * Build Tailwind v4 compatible CSS output
   */
  static buildTailwindV4CSS(
    collections: Array<{
      name: string;
      variables: Array<{
        name: string;
        value: string;
        originalName: string;
        modes?: { [modeName: string]: string } | null;
      }>;
      groups: {
        [groupName: string]: Array<{
          name: string;
          value: string;
          originalName: string;
          modes?: { [modeName: string]: string } | null;
        }>;
      };
    }>,
  ): string {
    const lines: string[] = [];

    // Start with @theme directive for the default mode
    lines.push('@theme {');

    // Process each collection for default mode
    for (const collection of collections) {
      lines.push(`  /* Collection: ${collection.name} */`);

      // Process grouped variables (these have valid namespaces)
      const sortedGroupNames = Object.keys(collection.groups).sort();
      for (const groupName of sortedGroupNames) {
        const namespace = groupName.toLowerCase();
        const variables = collection.groups[groupName];

        if (variables.length === 0) continue;

        lines.push(`\n  /* ${groupName} */`);

        for (const variable of variables) {
          const varName = this.formatTailwindVariableName(variable.originalName);
          lines.push(`  --${namespace}-${varName}: ${variable.value};`);
        }
      }

      // Standalone variables (if any) - these would be invalid in strict TW v4
      // but we'll include them with a warning comment
      if (collection.variables.length > 0) {
        lines.push(`\n  /* WARNING: Variables without namespace - not standard Tailwind v4 */`);
        for (const variable of collection.variables) {
          lines.push(`  --${variable.name}: ${variable.value};`);
        }
      }
    }

    lines.push('}');

    // Check if any variables have multiple modes
    const allModeNames = this.getAllModeNames(collections);

    // Generate [data-theme="..."] selectors for additional modes
    if (allModeNames.length > 1) {
      allModeNames.slice(1).forEach((modeName) => {
        lines.push(`\n[data-theme="${modeName}"] {`);

        // Process each collection for this specific mode
        for (const collection of collections) {
          // Process grouped variables
          const sortedGroupNames = Object.keys(collection.groups).sort();
          for (const groupName of sortedGroupNames) {
            const namespace = groupName.toLowerCase();
            const variables = collection.groups[groupName];

            if (variables.length === 0) continue;

            // Only add variables that have values for this mode
            const modeSpecificVars = variables.filter((v) => v.modes && v.modes[modeName]);
            if (modeSpecificVars.length === 0) continue;

            lines.push('');
            for (const variable of modeSpecificVars) {
              const varName = this.formatTailwindVariableName(variable.originalName);
              const modeValue = variable.modes![modeName];
              lines.push(`  --${namespace}-${varName}: ${modeValue};`);
            }
          }

          // Standalone variables for this mode
          const modeSpecificStandaloneVars = collection.variables.filter(
            (v) => v.modes && v.modes[modeName],
          );
          if (modeSpecificStandaloneVars.length > 0) {
            lines.push('');
            for (const variable of modeSpecificStandaloneVars) {
              const modeValue = variable.modes![modeName];
              lines.push(`  --${variable.name}: ${modeValue};`);
            }
          }
        }

        lines.push('}');
      });
    }

    return lines.join('\n');
  }

  /**
   * Get all unique mode names from collections
   */
  private static getAllModeNames(
    collections: Array<{
      variables: Array<{ modes?: { [modeName: string]: string } | null }>;
      groups: {
        [groupName: string]: Array<{ modes?: { [modeName: string]: string } | null }>;
      };
    }>,
  ): string[] {
    const modeNames = new Set<string>();

    collections.forEach((collection) => {
      collection.variables.forEach((variable) => {
        if (variable.modes) {
          Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
        }
      });

      Object.keys(collection.groups).forEach((groupKey) => {
        collection.groups[groupKey].forEach((variable) => {
          if (variable.modes) {
            Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
          }
        });
      });
    });

    return Array.from(modeNames).sort();
  }

  /**
   * Get a user-friendly list of valid namespaces
   */
  static getValidNamespacesList(): string[] {
    return [...TAILWIND_V4_NAMESPACES].sort();
  }

  /**
   * Get suggestions for invalid group names
   */
  static getSuggestion(groupName: string): string | null {
    const normalized = groupName.toLowerCase().trim();

    // Common mappings
    const suggestions: { [key: string]: string } = {
      colors: 'color',
      colour: 'color',
      fonts: 'font',
      'font-family': 'font',
      'font-size': 'text',
      'text-size': 'text',
      size: 'text',
      weight: 'font-weight',
      'letter-spacing': 'tracking',
      'line-height': 'leading',
      line: 'leading',
      space: 'spacing',
      padding: 'spacing',
      margin: 'spacing',
      gap: 'spacing',
      'border-radius': 'radius',
      rounded: 'radius',
      shadows: 'shadow',
      'box-shadow': 'shadow',
      timing: 'ease',
      'timing-function': 'ease',
      transition: 'ease',
      animation: 'animate',
      'aspect-ratio': 'aspect',
      breakpoints: 'breakpoint',
      screen: 'breakpoint',
    };

    return suggestions[normalized] || null;
  }
}
