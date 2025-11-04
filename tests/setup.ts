/**
 * Test setup file for Vitest
 * Mocks Figma API and sets up global test environment
 */

import { vi } from 'vitest';

// Mock Figma API
const mockFigma = {
  currentUser: {
    id: 'test-user-123',
    name: 'Test User'
  },
  root: {
    id: 'test-file-456',
    name: 'Test File',
    children: [],
    setSharedPluginData: vi.fn(),
    getSharedPluginData: vi.fn(() => null)
  },
  clientStorage: {
    getAsync: vi.fn(() => Promise.resolve(null)),
    setAsync: vi.fn(() => Promise.resolve()),
    deleteAsync: vi.fn(() => Promise.resolve())
  },
  loadAllPagesAsync: vi.fn(() => Promise.resolve()),
  variables: {
    getLocalVariableCollectionsAsync: vi.fn(() => Promise.resolve([]))
  }
};

// Create global figma object
(global as any).figma = mockFigma;

// Mock Web Crypto API with realistic behavior
const mockCrypto = {
  subtle: {
    importKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
    deriveKey: vi.fn(() => Promise.resolve({} as CryptoKey)),
    encrypt: vi.fn((algorithm: any, key: CryptoKey, data: ArrayBuffer) => {
      // Simple mock encryption - just return the input data with some modification
      const view = new Uint8Array(data);
      const result = new Uint8Array(view.length + 16); // Add 16 bytes for auth tag
      for (let i = 0; i < view.length; i++) {
        result[i] = view[i] ^ 42; // Simple XOR for testing
      }
      return Promise.resolve(result.buffer);
    }),
    decrypt: vi.fn((algorithm: any, key: CryptoKey, data: ArrayBuffer) => {
      // Simple mock decryption - reverse the encryption
      const view = new Uint8Array(data);
      const result = new Uint8Array(Math.max(0, view.length - 16)); // Remove auth tag
      for (let i = 0; i < result.length; i++) {
        result[i] = view[i] ^ 42; // Reverse XOR
      }
      return Promise.resolve(result.buffer);
    })
  },
  getRandomValues: vi.fn((array: Uint8Array) => {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  })
};

// Use Object.defineProperty to override read-only crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
  configurable: true
});

// Mock performance API
(global as any).performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
};

// Mock fetch for GitLab API calls
(global as any).fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Map()
  })
);

// Mock URL constructor for environment validation
(global as any).URL = class URL {
  hostname: string;
  protocol: string;
  
  constructor(url: string) {
    // Throw error for truly invalid URLs like the native URL constructor would
    if (!url || typeof url !== 'string' || !url.includes('://')) {
      throw new TypeError('Invalid URL');
    }
    
    try {
      this.hostname = url.replace(/^https?:\/\//, '').split('/')[0];
      this.protocol = url.startsWith('https') ? 'https:' : 'http:';
    } catch (e) {
      throw new TypeError('Invalid URL');
    }
  }
};

// Mock btoa/atob for base64 operations
(global as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
(global as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Mock TextEncoder/TextDecoder
(global as any).TextEncoder = class TextEncoder {
  encode(input: string): Uint8Array {
    return new Uint8Array(Buffer.from(input, 'utf8'));
  }
};

(global as any).TextDecoder = class TextDecoder {
  decode(input: Uint8Array): string {
    return Buffer.from(input).toString('utf8');
  }
};

// Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});

export { mockFigma };