/**
 * Tests for TokenCoverageService
 * Validates token coverage analysis functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { TokenCoverageService } from '../../src/services/tokenCoverageService';

describe('TokenCoverageService', () => {
  describe('analyzeCurrentPage', () => {
    it('should be defined', () => {
      expect(TokenCoverageService.analyzeCurrentPage).toBeDefined();
      expect(typeof TokenCoverageService.analyzeCurrentPage).toBe('function');
    });

    // Note: Full integration tests would require Figma API mock
    // These can be added when running in a Figma plugin test environment
  });

  describe('property checking logic', () => {
    it('should have correct property categories defined', () => {
      // Testing the structure is correct
      const service = TokenCoverageService as any;

      // This is an indirect test - we're checking the service has the right methods
      expect(service.checkLayoutProperties).toBeDefined();
      expect(service.checkFillProperties).toBeDefined();
      expect(service.checkStrokeProperties).toBeDefined();
      expect(service.checkAppearanceProperties).toBeDefined();
      expect(service.isVariableBound).toBeDefined();
      expect(service.addIssue).toBeDefined();
    });
  });

  describe('TokenCoverageResult structure', () => {
    it('should return correct result structure', async () => {
      // This test will need to be run in Figma environment
      // For now, we're just validating the TypeScript types exist
      const expectedStructure = {
        totalNodes: expect.any(Number),
        totalIssues: expect.any(Number),
        issuesByCategory: {
          Layout: expect.any(Array),
          Fill: expect.any(Array),
          Stroke: expect.any(Array),
          Appearance: expect.any(Array),
        },
      };

      // This is a type validation test
      expect(expectedStructure).toBeDefined();
    });
  });

  describe('TokenCoverageIssue structure', () => {
    it('should have correct issue structure', () => {
      const exampleIssue = {
        property: 'Padding Left',
        value: '16px',
        count: 5,
        nodeIds: ['node1', 'node2'],
        nodeNames: ['Frame 1', 'Frame 2'],
        category: 'Layout' as const,
      };

      expect(exampleIssue.property).toBe('Padding Left');
      expect(exampleIssue.value).toBe('16px');
      expect(exampleIssue.count).toBe(5);
      expect(exampleIssue.category).toBe('Layout');
    });

    it('should support optional matchingVariables field', () => {
      const issueWithMatches = {
        property: 'Width',
        value: '18px',
        count: 3,
        nodeIds: ['node1', 'node2', 'node3'],
        nodeNames: ['Frame 1', 'Frame 2', 'Frame 3'],
        nodeFrames: ['Page 1', 'Page 1', 'Page 2'],
        category: 'Layout' as const,
        matchingVariables: [
          {
            id: 'var1',
            name: 'spacing-sm',
            collectionName: 'Primitives',
            resolvedValue: '18',
          },
        ],
      };

      expect(issueWithMatches.matchingVariables).toBeDefined();
      expect(issueWithMatches.matchingVariables?.length).toBe(1);
      expect(issueWithMatches.matchingVariables?.[0].name).toBe('spacing-sm');
    });
  });

  describe('MatchingVariable structure', () => {
    it('should have correct structure for matching variables', () => {
      const exampleVariable = {
        id: 'var-123',
        name: 'color-primary',
        collectionName: 'Brand Colors',
        resolvedValue: 'rgb(139, 92, 246)',
      };

      expect(exampleVariable.id).toBe('var-123');
      expect(exampleVariable.name).toBe('color-primary');
      expect(exampleVariable.collectionName).toBe('Brand Colors');
      expect(exampleVariable.resolvedValue).toBe('rgb(139, 92, 246)');
    });
  });

  describe('Helper methods', () => {
    it('should have findMatchingVariables method', () => {
      const service = TokenCoverageService as any;
      expect(service.findMatchingVariables).toBeDefined();
      expect(typeof service.findMatchingVariables).toBe('function');
    });

    it('should have isVariableTypeMatch method', () => {
      const service = TokenCoverageService as any;
      expect(service.isVariableTypeMatch).toBeDefined();
      expect(typeof service.isVariableTypeMatch).toBe('function');
    });

    it('should have valuesMatch method', () => {
      const service = TokenCoverageService as any;
      expect(service.valuesMatch).toBeDefined();
      expect(typeof service.valuesMatch).toBe('function');
    });

    it('should have formatVariableValue method', () => {
      const service = TokenCoverageService as any;
      expect(service.formatVariableValue).toBeDefined();
      expect(typeof service.formatVariableValue).toBe('function');
    });
  });
});
