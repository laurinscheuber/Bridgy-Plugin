import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenCoverageService } from '../tokenCoverageService';

// Mock Figma global
global.figma = {
  currentPage: {
    findAll: vi.fn(),
    selection: [],
  },
  root: {
    children: [],
  },
  variables: {
    getLocalVariableCollectionsAsync: vi.fn(),
    getVariableByIdAsync: vi.fn(),
  },
} as any;

describe('TokenCoverageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should analyze nodes and calculate scores correctly', async () => {
    // Mock Variables
    const mockVariables = [
      {
        variable: {
          id: 'var1',
          name: 'color/primary',
          resolvedType: 'COLOR',
          valuesByMode: { 'mode1': { r: 0, g: 0, b: 0 } },
        },
        collection: { defaultModeId: 'mode1', name: 'Tokens' },
      },
    ];
    (figma.variables.getLocalVariableCollectionsAsync as any).mockResolvedValue([{ variableIds: ['var1'] }]);
    (figma.variables.getVariableByIdAsync as any).mockResolvedValue(mockVariables[0].variable);

    // Mock Nodes
    const mockNodes = [
      {
        id: 'node1',
        type: 'COMPONENT',
        layoutMode: 'AUTO',
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }], // Hardcoded white
        boundVariables: {},
      },
    ];

    // Expose private method for testing or use public analyzeNodes if accessible, 
    // but analyzeNodes is private. We can test via analyzeCurrentPage if we mock currentPage.findAll
    (figma.currentPage.findAll as any).mockReturnValue(mockNodes);

    const result = await TokenCoverageService.analyzeCurrentPage();

    expect(result.totalNodes).toBe(1);
    expect(result.subScores).toBeDefined();
    expect(result.subScores?.tokenCoverage).toBeDefined();

    // 1 issue (fills) on 1 node -> density score should be < 100
    expect(result.qualityScore).toBeLessThan(100);
  });

  it('should validate Tailwind v4 compatibility', async () => {
    // Mock Variables with mix of valid/invalid names
    const mockVariables = [
      {
        variable: { id: 'v1', name: 'color/primary', resolvedType: 'COLOR', valuesByMode: {} },
        collection: { defaultModeId: 'm1', name: 'C1' }
      },
      {
        variable: { id: 'v2', name: 'invalid/name', resolvedType: 'COLOR', valuesByMode: {} },
        collection: { defaultModeId: 'm1', name: 'C1' }
      }
    ];

    (figma.variables.getLocalVariableCollectionsAsync as any).mockResolvedValue([{ variableIds: ['v1', 'v2'] }]);
    (figma.variables.getVariableByIdAsync as any).mockImplementation((id) => {
      return Promise.resolve(mockVariables.find(m => m.variable.id === id)?.variable);
    });

    (figma.currentPage.findAll as any).mockReturnValue([]); // No nodes, just checking var analysis

    const result = await TokenCoverageService.analyzeCurrentPage();

    // Total vars = 2. Valid = 1 (color/primary). Invalid = 1. Score = 50.
    expect(result.tailwindValidation.valid.length).toBe(1);
    expect(result.tailwindValidation.invalid.length).toBe(1);
    // subScores might be undefined if totalNodes is 0? Let's check logic.
    // Yes, if totalNodes is 0, it still calculates tailwind score if variables exist.
    // But analyzeNodes might return early? No, it iterates variables.
  });
});
