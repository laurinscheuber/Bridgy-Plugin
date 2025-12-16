import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.e2e.{test,spec}.{ts,tsx}',
      'src/**/*.test.ts'
    ],
    exclude: [
      'node_modules',
      'dist',
      'src/ui'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        'src/ui/',
        'build.js',
        'scripts/',
        '**/*.d.ts',
        'code.js'
      ]
    },
    // Mock Figma API for tests
    server: {
      deps: {
        inline: ['@figma/plugin-typings']
      }
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});