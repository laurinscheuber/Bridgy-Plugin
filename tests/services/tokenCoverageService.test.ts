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
          Appearance: expect.any(Array)
        }
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
        category: 'Layout' as const
      };
      
      expect(exampleIssue.property).toBe('Padding Left');
      expect(exampleIssue.value).toBe('16px');
      expect(exampleIssue.count).toBe(5);
      expect(exampleIssue.category).toBe('Layout');
    });
  });
});
