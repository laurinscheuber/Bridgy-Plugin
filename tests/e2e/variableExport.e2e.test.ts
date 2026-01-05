/**
 * E2E Tests for Variable Export Functionality
 * Tests the complete flow of reading Figma variables and exporting them as CSS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupE2EEnvironment } from './setup';
import { CSSExportService } from '../../src/services/cssExportService';
import { UnitsService } from '../../src/services/unitsService';

describe('Variable Export E2E', () => {
  let mockEnvironment: any;

  beforeEach(async () => {
    mockEnvironment = setupE2EEnvironment();

    // Reset unit settings for consistent testing
    await UnitsService.resetUnitSettings();
  });

  describe('CSS Export Flow', () => {
    it.skip('should export variables from Figma file to CSS format', async () => {
      const cssOutput = await CSSExportService.exportVariables('css');

      expect(cssOutput).toBeTruthy();
      expect(cssOutput).toContain(':root {');
      expect(cssOutput).toContain('/* ===== COLORS =====');
      expect(cssOutput).toContain('/* ===== SPACING =====');
      expect(cssOutput).toContain('/* ===== TYPOGRAPHY =====');

      // Check specific variables are present
      expect(cssOutput).toContain('--primary-blue:');
      expect(cssOutput).toContain('--size-xs:');
      expect(cssOutput).toContain('--font-size-body:');

      // Check color formatting
      expect(cssOutput).toMatch(/--primary-blue:\s*rgb\(\d+,\s*\d+,\s*\d+\)/);
      expect(cssOutput).toMatch(/--size-xs:\s*4px/);
      expect(cssOutput).toMatch(/--font-size-body:\s*16rem/);
    });

    it.skip('should export variables to SCSS format', async () => {
      const scssOutput = await CSSExportService.exportVariables('scss');

      expect(scssOutput).toBeTruthy();
      expect(scssOutput).not.toContain(':root {');
      expect(scssOutput).toContain('// ===== COLORS =====');

      // Check SCSS variable syntax
      expect(scssOutput).toMatch(/\$primary-blue:\s*rgb\(\d+,\s*\d+,\s*\d+\);/);
      expect(scssOutput).toMatch(/\$size-xs:\s*4px;/);
      expect(scssOutput).toMatch(/\$font-size-body:\s*16rem;/);
    });

    it('should handle grouped variables correctly', async () => {
      const cssOutput = await CSSExportService.exportVariables('css');

      // Check that grouped variables are organized properly
      expect(cssOutput).toContain('/* Primary */');
      expect(cssOutput).toContain('/* Neutral */');
      expect(cssOutput).toContain('/* Size */');
      expect(cssOutput).toContain('/* Font */');

      // Verify variables are under correct groups
      const primarySection = cssOutput.split('/* Primary */')[1]?.split('/*')[0];
      expect(primarySection).toContain('--primary-blue:');
      expect(primarySection).toContain('--primary-red:');

      const sizeSection = cssOutput.split('/* Size */')[1]?.split('/*')[0];
      expect(sizeSection).toContain('--size-xs:');
      expect(sizeSection).toContain('--size-sm:');
    });

    it.skip('should apply correct units based on variable names', async () => {
      const cssOutput = await CSSExportService.exportVariables('css');

      // Typography should use rem
      expect(cssOutput).toMatch(/--font-size-body:\s*16rem/);
      expect(cssOutput).toMatch(/--font-size-heading:\s*24rem/);

      // Spacing should use rem
      expect(cssOutput).toMatch(/--size-xs:\s*4rem/);
      expect(cssOutput).toMatch(/--size-md:\s*16rem/);

      // Font weight should be unitless
      expect(cssOutput).toMatch(/--font-weight-regular:\s*400(?!px|rem)/);
      expect(cssOutput).toMatch(/--font-weight-bold:\s*700(?!px|rem)/);

      // Colors should have no units
      expect(cssOutput).toMatch(/--primary-blue:\s*rgb\(/);
    });

    it('should handle empty variable collections', async () => {
      // Mock empty collections
      mockEnvironment.figma.variables.getLocalVariableCollectionsAsync = vi.fn(() =>
        Promise.resolve([]),
      );

      await expect(CSSExportService.exportVariables('css')).rejects.toThrow(); // Error message may vary
    });

    it('should handle collections with no variables', async () => {
      // Mock collection with no variables
      const emptyCollection = {
        id: 'empty-collection',
        name: 'Empty Collection',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: [],
      };

      mockEnvironment.figma.variables.getLocalVariableCollectionsAsync = vi.fn(() =>
        Promise.resolve([emptyCollection]),
      );

      const cssOutput = await CSSExportService.exportVariables('css');
      expect(cssOutput).toBeTruthy();
      expect(cssOutput).toContain('===== STYLES =====');
    });
  });

  describe('Unit Settings Integration', () => {
    it('should apply custom unit settings to variables', async () => {
      // Set custom unit preferences
      UnitsService.updateUnitSettings({
        collections: {
          Spacing: 'px',
          Typography: 'rem',
        },
        groups: {
          'Spacing/size': 'px',
          'Typography/font': 'em',
        },
      });

      const cssOutput = await CSSExportService.exportVariables('css');

      // Should respect collection-level settings
      expect(cssOutput).toMatch(/--size-xs:\s*4px/);
      expect(cssOutput).toMatch(/--size-md:\s*16px/);

      // Should respect group-level settings (overrides collection)
      expect(cssOutput).toMatch(/--font-size-body:\s*16em/);
    });

    it('should get unit settings data for UI configuration', async () => {
      const unitSettingsData = await CSSExportService.getUnitSettingsData();

      expect(unitSettingsData).toHaveProperty('collections');
      expect(unitSettingsData).toHaveProperty('groups');

      expect(unitSettingsData.collections).toHaveLength(3);
      expect(unitSettingsData.collections[0]).toMatchObject({
        name: 'Colors',
        defaultUnit: 'none',
        currentUnit: '',
      });

      // Should detect groups within collections
      const spacingGroups = unitSettingsData.groups.filter((g) => g.collectionName === 'Spacing');
      expect(spacingGroups).toHaveLength(1);
      expect(spacingGroups[0]).toMatchObject({
        collectionName: 'Spacing',
        groupName: 'size',
        defaultUnit: 'rem',
      });
    });
  });

  describe('Variable Resolution', () => {
    it('should resolve variable aliases correctly', async () => {
      // Create a variable that references another variable
      const aliasVariable = {
        id: 'alias-var',
        name: 'colors/primary',
        resolvedType: 'COLOR',
        valuesByMode: {
          default: {
            type: 'VARIABLE_ALIAS',
            id: mockEnvironment.mockFile.collections[0].variableIds[0], // Reference to primary/blue
          },
        },
      };

      // Add alias variable to mock
      mockEnvironment.mockFile.variables.set('alias-var', aliasVariable);
      mockEnvironment.mockFile.collections[0].variableIds.push('alias-var');

      const cssOutput = await CSSExportService.exportVariables('css');

      // Should generate CSS variable reference
      expect(cssOutput).toContain('--colors-primary: var(--primary-blue)');
    });

    it('should handle complex color values with alpha', async () => {
      // Add a color with transparency
      const transparentColor = {
        id: 'transparent-color',
        name: 'overlay/backdrop',
        resolvedType: 'COLOR',
        valuesByMode: {
          default: { r: 0.0, g: 0.0, b: 0.0, a: 0.5 },
        },
      };

      mockEnvironment.mockFile.variables.set('transparent-color', transparentColor);
      mockEnvironment.mockFile.collections[0].variableIds.push('transparent-color');

      const cssOutput = await CSSExportService.exportVariables('css');

      // Should use rgba format for colors with alpha
      expect(cssOutput).toMatch(/--overlay-backdrop:\s*rgba\(0,\s*0,\s*0,\s*0\.50?\)/);
    });

    it('should handle string variables correctly', async () => {
      const cssOutput = await CSSExportService.exportVariables('css');

      // String variables should be quoted
      expect(cssOutput).toMatch(/--font-family-sans:\s*"Inter, Arial, sans-serif"/);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid variable types gracefully', async () => {
      // Add a variable with unsupported type
      const invalidVariable = {
        id: 'invalid-var',
        name: 'invalid/variable',
        resolvedType: 'UNKNOWN_TYPE' as any,
        valuesByMode: {
          default: 'some-value',
        },
      };

      mockEnvironment.mockFile.variables.set('invalid-var', invalidVariable);
      mockEnvironment.mockFile.collections[0].variableIds.push('invalid-var');

      // Should not throw error, just skip invalid variables
      const cssOutput = await CSSExportService.exportVariables('css');

      expect(cssOutput).toBeTruthy();
      expect(cssOutput).not.toContain('--invalid-variable');
    });

    it('should handle missing variable references', async () => {
      // Mock getVariableByIdAsync to return null for missing variables
      const originalGetVariable = mockEnvironment.figma.variables.getVariableByIdAsync;
      mockEnvironment.figma.variables.getVariableByIdAsync = vi.fn((id: string) => {
        if (id === 'missing-variable') return Promise.resolve(null);
        return originalGetVariable(id);
      });

      // Add reference to missing variable
      mockEnvironment.mockFile.collections[0].variableIds.push('missing-variable');

      const cssOutput = await CSSExportService.exportVariables('css');

      // Should still generate output for valid variables
      expect(cssOutput).toBeTruthy();
      expect(cssOutput).toContain('--primary-blue:');
    });
  });

  describe('Performance', () => {
    it('should handle large variable collections efficiently', async () => {
      // Create a large collection
      const largeCollection = {
        id: 'large-collection',
        name: 'Large Collection',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: [],
      };

      // Add 1000 variables
      for (let i = 0; i < 1000; i++) {
        const varId = `large-var-${i}`;
        largeCollection.variableIds.push(varId);
        mockEnvironment.mockFile.variables.set(varId, {
          id: varId,
          name: `variable/group-${Math.floor(i / 10)}/item-${i}`,
          resolvedType: 'FLOAT',
          valuesByMode: { default: i },
        });
      }

      mockEnvironment.mockFile.collections.push(largeCollection);

      const startTime = performance.now();
      const cssOutput = await CSSExportService.exportVariables('css');
      const endTime = performance.now();

      // Should complete in reasonable time (less than 2 seconds)
      expect(endTime - startTime).toBeLessThan(2000);
      expect(cssOutput).toBeTruthy();
      expect(cssOutput.split('\n').length).toBeGreaterThan(1000);
    });
  });

  describe('Tailwind v4 Export', () => {
    it('should export variables in Tailwind v4 format with @theme directive', async () => {
      // Create variables with valid Tailwind v4 namespaces
      const tailwindCollection = {
        id: 'tailwind-collection',
        name: 'Tailwind Tokens',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: [],
      };

      // Add color variables
      const colorVars = [
        { id: 'color-primary', name: 'color/primary', value: { r: 0.388, g: 0.4, b: 0.945 } },
        { id: 'color-secondary', name: 'color/secondary', value: { r: 0.925, g: 0.282, b: 0.6 } },
      ];

      // Add spacing variables
      const spacingVars = [
        { id: 'spacing-sm', name: 'spacing/sm', value: 8 },
        { id: 'spacing-md', name: 'spacing/md', value: 16 },
        { id: 'spacing-lg', name: 'spacing/lg', value: 24 },
      ];

      // Add radius variables
      const radiusVars = [
        { id: 'radius-sm', name: 'radius/sm', value: 4 },
        { id: 'radius-md', name: 'radius/md', value: 8 },
      ];

      [...colorVars, ...spacingVars, ...radiusVars].forEach((varData) => {
        tailwindCollection.variableIds.push(varData.id);
        mockEnvironment.mockFile.variables.set(varData.id, {
          id: varData.id,
          name: varData.name,
          resolvedType: typeof varData.value === 'number' ? 'FLOAT' : 'COLOR',
          valuesByMode: { default: varData.value },
        });
      });

      mockEnvironment.mockFile.collections = [tailwindCollection];

      const twOutput = await CSSExportService.exportVariables('tailwind-v4');

      // Check for @theme directive
      expect(twOutput).toContain('@theme {');
      expect(twOutput).not.toContain(':root {');

      // Check for properly formatted variables
      expect(twOutput).toContain('--color-primary:');
      expect(twOutput).toContain('--color-secondary:');
      expect(twOutput).toContain('--spacing-sm:');
      expect(twOutput).toContain('--spacing-md:');
      expect(twOutput).toContain('--spacing-lg:');
      expect(twOutput).toContain('--radius-sm:');
      expect(twOutput).toContain('--radius-md:');

      // Check color formatting
      expect(twOutput).toMatch(/--color-primary:\s*rgb\(\d+,\s*\d+,\s*\d+\)/);

      // Check collection comment
      expect(twOutput).toContain('/* Collection: Tailwind Tokens */');
      expect(twOutput).toContain('/* color */');
      expect(twOutput).toContain('/* spacing */');
      expect(twOutput).toContain('/* radius */');
    });

    it('should reject export when variables have invalid namespaces', async () => {
      // Create variables with invalid namespaces
      const invalidCollection = {
        id: 'invalid-collection',
        name: 'Invalid Tokens',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: ['invalid-var'],
      };

      mockEnvironment.mockFile.variables.set('invalid-var', {
        id: 'invalid-var',
        name: 'custom/variable',
        resolvedType: 'FLOAT',
        valuesByMode: { default: 100 },
      });

      mockEnvironment.mockFile.collections = [invalidCollection];

      // Should throw error about invalid namespaces
      await expect(CSSExportService.exportVariables('tailwind-v4')).rejects.toThrow(
        /Invalid variable group namespaces/,
      );
    });

    it('should handle mixed valid and invalid namespaces', async () => {
      const mixedCollection = {
        id: 'mixed-collection',
        name: 'Mixed Tokens',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: ['valid-var', 'invalid-var'],
      };

      // Valid namespace
      mockEnvironment.mockFile.variables.set('valid-var', {
        id: 'valid-var',
        name: 'color/primary',
        resolvedType: 'COLOR',
        valuesByMode: { default: { r: 0.5, g: 0.5, b: 0.5 } },
      });

      // Invalid namespace
      mockEnvironment.mockFile.variables.set('invalid-var', {
        id: 'invalid-var',
        name: 'mycustom/variable',
        resolvedType: 'FLOAT',
        valuesByMode: { default: 100 },
      });

      mockEnvironment.mockFile.collections = [mixedCollection];

      // Should fail validation
      await expect(CSSExportService.exportVariables('tailwind-v4')).rejects.toThrow(/mycustom/);
    });

    it('should get Tailwind v4 validation status', async () => {
      // Setup valid Tailwind namespaces
      const validCollection = {
        id: 'valid-tw',
        name: 'Valid TW',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: ['color-var', 'spacing-var'],
      };

      mockEnvironment.mockFile.variables.set('color-var', {
        id: 'color-var',
        name: 'color/primary',
        resolvedType: 'COLOR',
        valuesByMode: { default: { r: 0, g: 0, b: 0 } },
      });

      mockEnvironment.mockFile.variables.set('spacing-var', {
        id: 'spacing-var',
        name: 'spacing/md',
        resolvedType: 'FLOAT',
        valuesByMode: { default: 16 },
      });

      mockEnvironment.mockFile.collections = [validCollection];

      const validation = await CSSExportService.getTailwindV4ValidationStatus();

      expect(validation.isValid).toBe(true);
      expect(validation.groups).toHaveLength(2);
      expect(validation.groups[0]).toMatchObject({
        name: 'color',
        isValid: true,
        namespace: 'color',
        variableCount: 1,
      });
      expect(validation.groups[1]).toMatchObject({
        name: 'spacing',
        isValid: true,
        namespace: 'spacing',
        variableCount: 1,
      });
      expect(validation.invalidGroups).toHaveLength(0);
    });
  });
});
