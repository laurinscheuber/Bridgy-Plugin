import { describe, it, expect } from 'vitest';
import { TailwindV4Service } from '../../src/services/tailwindV4Service';

/**
 * Tests for improved Tailwind Compatibility feature
 *
 * These tests verify:
 * 1. Standalone variables are detected as compatibility issues
 * 2. Both grouped and standalone variables are properly reported
 * 3. Validation correctly identifies invalid namespaces
 */

describe('TailwindV4Service - Improved Compatibility Detection', () => {
  describe('validateVariableGroups', () => {
    it('should detect standalone variables as invalid', async () => {
      // Mock Figma API
      const mockCollection = {
        id: 'col1',
        name: 'Test Collection',
        variableIds: ['var1', 'var2', 'var3'],
      };

      const mockVariables = [
        { id: 'var1', name: 'primary', resolvedType: 'COLOR' },
        { id: 'var2', name: 'secondary', resolvedType: 'COLOR' },
        { id: 'var3', name: 'color/valid', resolvedType: 'COLOR' },
      ];

      (globalThis as any).figma = {
        variables: {
          getLocalVariableCollectionsAsync: async () => [mockCollection],
          getVariableByIdAsync: async (id: string) =>
            mockVariables.find(v => v.id === id) as any,
        },
      } as any;

      const result = await TailwindV4Service.validateVariableGroups();

      // Should detect 2 standalone variables as invalid (each as separate entry)
      expect(result.isValid).toBe(false);

      // Should have 3 groups total: 2 standalone + 1 valid grouped
      expect(result.groups).toHaveLength(3);

      // Should have 2 invalid entries (the 2 standalone variables)
      expect(result.invalidGroups).toHaveLength(2);
      expect(result.invalidGroups).toContain('primary');
      expect(result.invalidGroups).toContain('secondary');

      // Find standalone variables
      const standaloneVars = result.groups.filter(g => g.isStandalone);
      expect(standaloneVars).toHaveLength(2);
      expect(standaloneVars[0].variableId).toBe('var1');
      expect(standaloneVars[1].variableId).toBe('var2');
    });

    it('should detect invalid grouped variables', async () => {
      const mockCollection = {
        id: 'col1',
        name: 'Test Collection',
        variableIds: ['var1', 'var2'],
      };

      const mockVariables = [
        { id: 'var1', name: 'colors/primary', resolvedType: 'COLOR' },
        { id: 'var2', name: 'colors/secondary', resolvedType: 'COLOR' },
      ];

      (globalThis as any).figma = {
        variables: {
          getLocalVariableCollectionsAsync: async () => [mockCollection],
          getVariableByIdAsync: async (id: string) =>
            mockVariables.find(v => v.id === id) as any,
        },
      } as any;

      const result = await TailwindV4Service.validateVariableGroups();

      // 'colors' is not a valid Tailwind v4 namespace (should be 'color')
      expect(result.isValid).toBe(false);
      expect(result.invalidGroups).toContain('colors');

      const colorsGroup = result.groups.find(g => g.name === 'colors');
      expect(colorsGroup).toBeDefined();
      expect(colorsGroup?.isValid).toBe(false);
      expect(colorsGroup?.variableCount).toBe(2);
    });

    it('should mark valid namespaces as valid', async () => {
      const mockCollection = {
        id: 'col1',
        name: 'Test Collection',
        variableIds: ['var1', 'var2'],
      };

      const mockVariables = [
        { id: 'var1', name: 'color/primary', resolvedType: 'COLOR' },
        { id: 'var2', name: 'spacing/md', resolvedType: 'FLOAT' },
      ];

      (globalThis as any).figma = {
        variables: {
          getLocalVariableCollectionsAsync: async () => [mockCollection],
          getVariableByIdAsync: async (id: string) =>
            mockVariables.find(v => v.id === id) as any,
        },
      } as any;

      const result = await TailwindV4Service.validateVariableGroups();

      // Both 'color' and 'spacing' are valid Tailwind v4 namespaces
      expect(result.isValid).toBe(true);
      expect(result.invalidGroups).toHaveLength(0);

      const colorGroup = result.groups.find(g => g.name === 'color');
      expect(colorGroup?.isValid).toBe(true);

      const spacingGroup = result.groups.find(g => g.name === 'spacing');
      expect(spacingGroup?.isValid).toBe(true);
    });

    it('should handle mixed valid, invalid, and standalone variables', async () => {
      const mockCollection = {
        id: 'col1',
        name: 'Test Collection',
        variableIds: ['var1', 'var2', 'var3', 'var4'],
      };

      const mockVariables = [
        { id: 'var1', name: 'color/primary', resolvedType: 'COLOR' }, // valid
        { id: 'var2', name: 'colors/secondary', resolvedType: 'COLOR' }, // invalid group
        { id: 'var3', name: 'standalone1', resolvedType: 'COLOR' }, // standalone
        { id: 'var4', name: 'standalone2', resolvedType: 'FLOAT' }, // standalone
      ];

      (globalThis as any).figma = {
        variables: {
          getLocalVariableCollectionsAsync: async () => [mockCollection],
          getVariableByIdAsync: async (id: string) =>
            mockVariables.find(v => v.id === id) as any,
        },
      } as any;

      const result = await TailwindV4Service.validateVariableGroups();

      expect(result.isValid).toBe(false);

      // Should have 4 groups: 'color' (valid), 'colors' (invalid), 2 standalone (invalid each)
      expect(result.groups).toHaveLength(4);

      // Should report 3 invalid: 'colors', 'standalone1', 'standalone2'
      expect(result.invalidGroups).toHaveLength(3);
      expect(result.invalidGroups).toContain('colors');
      expect(result.invalidGroups).toContain('standalone1');
      expect(result.invalidGroups).toContain('standalone2');

      // Standalone variables should be tracked individually
      const standaloneVars = result.groups.filter(g => g.isStandalone);
      expect(standaloneVars).toHaveLength(2);
      expect(standaloneVars[0].name).toBe('standalone1');
      expect(standaloneVars[1].name).toBe('standalone2');
      expect(standaloneVars[0].variableId).toBe('var3');
      expect(standaloneVars[1].variableId).toBe('var4');
    });
  });

  describe('isValidNamespace', () => {
    it('should recognize valid Tailwind v4 namespaces', () => {
      expect(TailwindV4Service.isValidNamespace('color')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('font')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('spacing')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('shadow')).toBe(true);
    });

    it('should reject invalid namespaces', () => {
      expect(TailwindV4Service.isValidNamespace('colors')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('fonts')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('custom')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('invalid')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(TailwindV4Service.isValidNamespace('COLOR')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('Color')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('SPACING')).toBe(true);
    });
  });
});

