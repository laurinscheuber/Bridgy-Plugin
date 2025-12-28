/**
 * E2E Test Setup - Creates realistic Figma environment
 * This setup creates actual variable collections and components to test against
 */

import { vi } from 'vitest';

// Enhanced Figma mocks with realistic data
export const createVariableCollection = (name: string, variables: Array<{
  name: string;
  type: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  value: any;
}>) => {
  const collection = {
    id: `collection-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    modes: [{ modeId: 'default', name: 'Default' }],
    variableIds: [] as string[]
  };

  const createdVariables: any[] = [];

  variables.forEach((varDef, index) => {
    const variableId = `var-${collection.id}-${index}`;
    collection.variableIds.push(variableId);

    const variable = {
      id: variableId,
      name: varDef.name,
      resolvedType: varDef.type,
      valuesByMode: {
        'default': varDef.value
      }
    };

    createdVariables.push(variable);
  });

  return { collection, variables: createdVariables };
};

export const createMockFigmaFile = () => {
  // Create realistic variable collections
  const colorCollection = createVariableCollection('Colors', [
    { name: 'primary/blue', type: 'COLOR', value: { r: 0.2, g: 0.4, b: 1.0, a: 1.0 } },
    { name: 'primary/red', type: 'COLOR', value: { r: 1.0, g: 0.2, b: 0.2, a: 1.0 } },
    { name: 'neutral/white', type: 'COLOR', value: { r: 1.0, g: 1.0, b: 1.0, a: 1.0 } },
    { name: 'neutral/black', type: 'COLOR', value: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 } }
  ]);

  const spacingCollection = createVariableCollection('Spacing', [
    { name: 'size/xs', type: 'FLOAT', value: 4 },
    { name: 'size/sm', type: 'FLOAT', value: 8 },
    { name: 'size/md', type: 'FLOAT', value: 16 },
    { name: 'size/lg', type: 'FLOAT', value: 24 },
    { name: 'size/xl', type: 'FLOAT', value: 32 }
  ]);

  const typographyCollection = createVariableCollection('Typography', [
    { name: 'font/size/body', type: 'FLOAT', value: 16 },
    { name: 'font/size/heading', type: 'FLOAT', value: 24 },
    { name: 'font/family/sans', type: 'STRING', value: 'Inter, Arial, sans-serif' },
    { name: 'font/weight/regular', type: 'FLOAT', value: 400 },
    { name: 'font/weight/bold', type: 'FLOAT', value: 700 }
  ]);

  // Combine all variables for easy lookup
  const allVariables = new Map();
  [colorCollection, spacingCollection, typographyCollection].forEach(({ variables }) => {
    variables.forEach(variable => {
      allVariables.set(variable.id, variable);
    });
  });

  return {
    collections: [colorCollection.collection, spacingCollection.collection, typographyCollection.collection],
    variables: allVariables,
    getVariableById: (id: string) => allVariables.get(id) || null,
    getCollections: () => [colorCollection.collection, spacingCollection.collection, typographyCollection.collection]
  };
};

export const createMockComponents = () => {
  return [
    {
      id: 'comp-button-primary',
      name: 'Button/Primary',
      type: 'COMPONENT',
      children: [
        {
          id: 'text-node-1',
          name: 'Label',
          type: 'TEXT',
          characters: 'Click me',
          fontName: { family: 'Inter', style: 'Medium' }
        }
      ]
    },
    {
      id: 'comp-card-default',
      name: 'Card/Default',
      type: 'COMPONENT',
      children: [
        {
          id: 'text-node-2',
          name: 'Title',
          type: 'TEXT',
          characters: 'Card Title'
        },
        {
          id: 'text-node-3',
          name: 'Description',
          type: 'TEXT',
          characters: 'Card description text'
        }
      ]
    }
  ];
};

// Enhanced Figma API mock with realistic data
export const setupE2EEnvironment = () => {
  const mockFile = createMockFigmaFile();
  const mockComponents = createMockComponents();

  const enhancedFigma = {
    currentUser: {
      id: 'e2e-test-user-123',
      name: 'E2E Test User'
    },
    root: {
      id: 'e2e-test-file-456',
      name: 'E2E Test File',
      children: mockComponents,
      setSharedPluginData: vi.fn(),
      getSharedPluginData: vi.fn(() => null),
      findAll: vi.fn((predicate?: (node: any) => boolean) => {
        if (!predicate) return mockComponents;
        return mockComponents.filter(predicate);
      })
    },
    clientStorage: {
      getAsync: vi.fn(() => Promise.resolve(null)),
      setAsync: vi.fn(() => Promise.resolve()),
      deleteAsync: vi.fn(() => Promise.resolve())
    },
    variables: {
      getLocalVariableCollectionsAsync: vi.fn(() => Promise.resolve(mockFile.collections)),
      getVariableByIdAsync: vi.fn((id: string) => Promise.resolve(mockFile.getVariableById(id)))
    },
    loadAllPagesAsync: vi.fn(() => Promise.resolve()),
    getLocalPaintStylesAsync: vi.fn(() => Promise.resolve([])),
    getLocalTextStylesAsync: vi.fn(() => Promise.resolve([])),
    getLocalEffectStylesAsync: vi.fn(() => Promise.resolve([])),
    getLocalGridStylesAsync: vi.fn(() => Promise.resolve([])),
    ui: {
      postMessage: vi.fn()
    }
  };

  // Replace global figma with enhanced version
  (global as any).figma = enhancedFigma;

  return {
    figma: enhancedFigma,
    mockFile,
    mockComponents
  };
};

// Mock successful GitLab API responses
export const setupMockGitLabAPI = () => {
  const mockFetch = vi.fn((url: string, options?: any) => {
    const urlString = url.toString();
    
    // Mock different GitLab API endpoints
    if (urlString.includes('/projects/')) {
      if (urlString.includes('/repository/branches')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            name: 'feature/variables',
            commit: { id: 'abc123' }
          })
        });
      }
      
      if (urlString.includes('/repository/files/')) {
        if (options?.method === 'GET') {
          // File doesn't exist yet
          return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve({ message: 'File not found' })
          });
        }
      }
      
      if (urlString.includes('/repository/commits')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({
            id: 'commit-123',
            web_url: 'https://gitlab.com/test/project/-/commit/commit-123'
          })
        });
      }
      
      if (urlString.includes('/merge_requests')) {
        if (options?.method === 'GET') {
          // No existing MR
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve([])
          });
        }
        
        if (options?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              id: 1,
              web_url: 'https://gitlab.com/test/project/-/merge_requests/1'
            })
          });
        }
      }
      
      // Default project info
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          id: 123,
          default_branch: 'main',
          name: 'Test Project'
        })
      });
    }
    
    // Default response
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve('')
    });
  });

  (global as any).fetch = mockFetch;
  return mockFetch;
};