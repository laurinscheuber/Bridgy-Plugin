import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'build.js',
        'scripts/',
        '**/*.d.ts',
        'code.js'
      ]
    },
    // Mock Figma API for tests
    deps: {
      inline: ['@figma/plugin-typings']
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});