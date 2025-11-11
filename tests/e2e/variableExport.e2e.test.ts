/**
 * E2E Tests for Variable Export Functionality
 * Tests the complete flow of reading Figma variables and exporting them as CSS
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupE2EEnvironment } from './setup';
import { CSSExportService } from '../../src/services/cssExportService';
import { UnitService } from '../../src/services/unitService';

describe('Variable Export E2E', () => {
  let mockEnvironment: any;

  beforeEach(async () => {
    mockEnvironment = setupE2EEnvironment();
    
    // Reset unit settings for consistent testing
    await UnitService.resetUnitSettings();
  });

  describe('CSS Export Flow', () => {
    it('should export variables from Figma file to CSS format', async () => {
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

    it('should export variables to SCSS format', async () => {
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

    it('should apply correct units based on variable names', async () => {
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
      mockEnvironment.figma.variables.getLocalVariableCollectionsAsync = vi.fn(() => Promise.resolve([]));
      
      await expect(CSSExportService.exportVariables('css')).rejects.toThrow('No variables found to export');
    });

    it('should handle collections with no variables', async () => {
      // Mock collection with no variables
      const emptyCollection = {
        id: 'empty-collection',
        name: 'Empty Collection',
        modes: [{ modeId: 'default', name: 'Default' }],
        variableIds: []
      };
      
      mockEnvironment.figma.variables.getLocalVariableCollectionsAsync = vi.fn(() => Promise.resolve([emptyCollection]));
      
      await expect(CSSExportService.exportVariables('css')).rejects.toThrow('No variables found to export');
    });
  });

  describe('Unit Settings Integration', () => {
    it('should apply custom unit settings to variables', async () => {
      // Set custom unit preferences
      UnitService.updateUnitSettings({
        collections: {
          'Spacing': 'px',
          'Typography': 'rem'
        },
        groups: {
          'Spacing/size': 'px',
          'Typography/font': 'em'
        }
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
        defaultUnit: 'Smart defaults',
        currentUnit: ''
      });
      
      // Should detect groups within collections
      const spacingGroups = unitSettingsData.groups.filter(g => g.collectionName === 'Spacing');
      expect(spacingGroups).toHaveLength(1);
      expect(spacingGroups[0]).toMatchObject({
        collectionName: 'Spacing',
        groupName: 'size',
        defaultUnit: 'Smart defaults'
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
          'default': {
            type: 'VARIABLE_ALIAS',
            id: mockEnvironment.mockFile.collections[0].variableIds[0] // Reference to primary/blue
          }
        }
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
          'default': { r: 0.0, g: 0.0, b: 0.0, a: 0.5 }
        }
      };
      
      mockEnvironment.mockFile.variables.set('transparent-color', transparentColor);
      mockEnvironment.mockFile.collections[0].variableIds.push('transparent-color');
      
      const cssOutput = await CSSExportService.exportVariables('css');
      
      // Should use rgba format for colors with alpha
      expect(cssOutput).toMatch(/--overlay-backdrop:\s*rgba\(0,\s*0,\s*0,\s*0\.50\)/);
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
          'default': 'some-value'
        }
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
        variableIds: []
      };
      
      // Add 1000 variables
      for (let i = 0; i < 1000; i++) {
        const varId = `large-var-${i}`;
        largeCollection.variableIds.push(varId);
        mockEnvironment.mockFile.variables.set(varId, {
          id: varId,
          name: `variable/group-${Math.floor(i / 10)}/item-${i}`,
          resolvedType: 'FLOAT',
          valuesByMode: { 'default': i }
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
});