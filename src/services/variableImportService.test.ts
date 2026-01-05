import { describe, it, expect } from 'vitest';
import { VariableImportService } from './variableImportService';

describe('VariableImportService', () => {
  it('should parse Tailwind JS config', () => {
    const config = `
        module.exports = {
            theme: {
                colors: {
                    primary: {
                        500: '#3b82f6',
                        600: '#2563eb'
                    },
                    secondary: '#64748b'
                },
                spacing: {
                    '1': '0.25rem',
                    '2': '0.5rem'
                }
            }
        }
        `;

    const tokens = VariableImportService.parseTailwind(config);

    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'colors/primary/500', value: '#3b82f6', type: 'color' }),
    );
    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'colors/primary/600', value: '#2563eb', type: 'color' }),
    );
    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'colors/secondary', value: '#64748b', type: 'color' }),
    );
    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'spacing/1', value: '0.25rem', type: 'number' }),
    );
    expect(tokens.length).toBe(5);
  });

  it('should handle nested JS objects without quotes', () => {
    const config = `
        {
          theme: {
            colors: {
              brand: {
                 light: '#f0f9ff',
                 DEFAULT: '#0ea5e9',
              }
            }
          }
        }
        `;
    const tokens = VariableImportService.parseTailwind(config);
    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'colors/brand/light', value: '#f0f9ff' }),
    );
    expect(tokens).toContainEqual(
      expect.objectContaining({ name: 'colors/brand/DEFAULT', value: '#0ea5e9' }),
    );
  });
});
