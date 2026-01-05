import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TailwindV4Service, TAILWIND_V4_NAMESPACES } from '../../src/services/tailwindV4Service';

describe('TailwindV4Service', () => {
  describe('isValidNamespace', () => {
    it('should return true for valid Tailwind v4 namespaces', () => {
      expect(TailwindV4Service.isValidNamespace('color')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('spacing')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('radius')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('font')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('shadow')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(TailwindV4Service.isValidNamespace('COLOR')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('Spacing')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('RADIUS')).toBe(true);
    });

    it('should trim whitespace', () => {
      expect(TailwindV4Service.isValidNamespace(' color ')).toBe(true);
      expect(TailwindV4Service.isValidNamespace('  spacing  ')).toBe(true);
    });

    it('should return false for invalid namespaces', () => {
      expect(TailwindV4Service.isValidNamespace('colors')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('custom')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('invalid')).toBe(false);
      expect(TailwindV4Service.isValidNamespace('')).toBe(false);
    });
  });

  describe('formatTailwindVariableName', () => {
    it('should remove group prefix from variable name', () => {
      expect(TailwindV4Service.formatTailwindVariableName('color/primary-500')).toBe('primary-500');
      expect(TailwindV4Service.formatTailwindVariableName('spacing/sm')).toBe('sm');
      expect(TailwindV4Service.formatTailwindVariableName('radius/md')).toBe('md');
    });

    it('should convert to lowercase', () => {
      expect(TailwindV4Service.formatTailwindVariableName('color/PRIMARY-500')).toBe('primary-500');
      expect(TailwindV4Service.formatTailwindVariableName('SPACING/Large')).toBe('large');
    });

    it('should replace non-alphanumeric characters with hyphens', () => {
      expect(TailwindV4Service.formatTailwindVariableName('color/primary.500')).toBe('primary-500');
      expect(TailwindV4Service.formatTailwindVariableName('spacing/very large')).toBe('very-large');
      expect(TailwindV4Service.formatTailwindVariableName('font-size/h1_mobile')).toBe('h1-mobile');
    });

    it('should handle names without group prefix', () => {
      expect(TailwindV4Service.formatTailwindVariableName('primary-500')).toBe('primary-500');
      expect(TailwindV4Service.formatTailwindVariableName('standalone')).toBe('standalone');
    });
  });

  describe('buildTailwindV4CSS', () => {
    it('should generate valid Tailwind v4 CSS with @theme directive', () => {
      const collections = [
        {
          name: 'Design Tokens',
          variables: [],
          groups: {
            color: [
              {
                name: 'primary-500',
                value: 'rgb(99, 102, 241)',
                originalName: 'color/primary-500',
              },
              {
                name: 'secondary-500',
                value: 'rgb(236, 72, 153)',
                originalName: 'color/secondary-500',
              },
            ],
            spacing: [
              { name: 'sm', value: '8px', originalName: 'spacing/sm' },
              { name: 'md', value: '16px', originalName: 'spacing/md' },
            ],
          },
        },
      ];

      const result = TailwindV4Service.buildTailwindV4CSS(collections);

      expect(result).toContain('@theme {');
      expect(result).toContain('--color-primary-500: rgb(99, 102, 241);');
      expect(result).toContain('--color-secondary-500: rgb(236, 72, 153);');
      expect(result).toContain('--spacing-sm: 8px;');
      expect(result).toContain('--spacing-md: 16px;');
      expect(result).toContain('}');
    });

    it('should handle standalone variables with warning', () => {
      const collections = [
        {
          name: 'Test',
          variables: [{ name: 'standalone-var', value: '100px', originalName: 'standalone-var' }],
          groups: {},
        },
      ];

      const result = TailwindV4Service.buildTailwindV4CSS(collections);

      expect(result).toContain('WARNING: Variables without namespace');
      expect(result).toContain('--standalone-var: 100px;');
    });

    it('should include collection comments', () => {
      const collections = [
        {
          name: 'My Tokens',
          variables: [],
          groups: {
            color: [{ name: 'primary', value: '#000', originalName: 'color/primary' }],
          },
        },
      ];

      const result = TailwindV4Service.buildTailwindV4CSS(collections);

      expect(result).toContain('/* Collection: My Tokens */');
      expect(result).toContain('/* color */');
    });
  });

  describe('getValidNamespacesList', () => {
    it('should return a sorted list of valid namespaces', () => {
      const namespaces = TailwindV4Service.getValidNamespacesList();

      expect(Array.isArray(namespaces)).toBe(true);
      expect(namespaces.length).toBeGreaterThan(0);
      expect(namespaces).toContain('color');
      expect(namespaces).toContain('spacing');
      expect(namespaces).toContain('radius');

      // Check if sorted
      const sorted = [...namespaces].sort();
      expect(namespaces).toEqual(sorted);
    });
  });

  describe('getSuggestion', () => {
    it('should suggest correct namespace for common variations', () => {
      expect(TailwindV4Service.getSuggestion('colors')).toBe('color');
      expect(TailwindV4Service.getSuggestion('colour')).toBe('color');
      expect(TailwindV4Service.getSuggestion('space')).toBe('spacing');
      expect(TailwindV4Service.getSuggestion('padding')).toBe('spacing');
      expect(TailwindV4Service.getSuggestion('margin')).toBe('spacing');
      expect(TailwindV4Service.getSuggestion('border-radius')).toBe('radius');
      expect(TailwindV4Service.getSuggestion('rounded')).toBe('radius');
    });

    it('should return null for unknown variations', () => {
      expect(TailwindV4Service.getSuggestion('unknown')).toBeNull();
      expect(TailwindV4Service.getSuggestion('random')).toBeNull();
      expect(TailwindV4Service.getSuggestion('custom')).toBeNull();
    });

    it('should be case insensitive', () => {
      expect(TailwindV4Service.getSuggestion('COLORS')).toBe('color');
      expect(TailwindV4Service.getSuggestion('Padding')).toBe('spacing');
    });
  });

  describe('TAILWIND_V4_NAMESPACES', () => {
    it('should include common Tailwind namespaces', () => {
      const namespaces = [...TAILWIND_V4_NAMESPACES];

      expect(namespaces).toContain('color');
      expect(namespaces).toContain('spacing');
      expect(namespaces).toContain('radius');
      expect(namespaces).toContain('font');
      expect(namespaces).toContain('shadow');
    });
  });
});
