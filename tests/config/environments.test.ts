/**
 * Tests for EnvironmentManager
 * Validates environment configuration and URL handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentManager, ENVIRONMENTS } from '../../src/config/environments';

describe('EnvironmentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEnvironment', () => {
    it('should return known environment configurations', () => {
      const gitlabCom = EnvironmentManager.getEnvironment('gitlab.com');

      expect(gitlabCom).toBeDefined();
      expect(gitlabCom?.name).toBe('GitLab.com');
      expect(gitlabCom?.gitlabBaseUrl).toBe('https://gitlab.com');
      expect(gitlabCom?.allowedDomains).toContain('gitlab.com');
    });

    it('should return null for unknown environments', () => {
      const unknown = EnvironmentManager.getEnvironment('unknown.com');
      expect(unknown).toBeNull();
    });
  });

  describe('getAllEnvironments', () => {
    it('should return all built-in environments', () => {
      const environments = EnvironmentManager.getAllEnvironments();

      expect(environments).toHaveProperty('gitlab.com');
      expect(environments).toHaveProperty('gitlab.fhnw.ch');
      expect(environments).toHaveProperty('custom');
    });

    it('should not mutate original ENVIRONMENTS', () => {
      const environments = EnvironmentManager.getAllEnvironments();
      environments['test'] = {
        gitlabBaseUrl: 'test',
        allowedDomains: [],
        name: 'test',
        description: 'test',
      };

      expect(ENVIRONMENTS).not.toHaveProperty('test');
    });
  });

  describe('validateGitLabUrl', () => {
    it('should validate correct HTTPS URLs', () => {
      const result = EnvironmentManager.validateGitLabUrl('https://gitlab.example.com');

      expect(result.isValid).toBe(true);
      expect(result.domain).toBe('gitlab.example.com');
      expect(result.error).toBeUndefined();
    });

    it('should reject HTTP URLs', () => {
      const result = EnvironmentManager.validateGitLabUrl('http://gitlab.example.com');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('GitLab URL must use HTTPS');
    });

    it('should reject invalid URLs', () => {
      const result = EnvironmentManager.validateGitLabUrl('not-a-url');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid URL format');
    });

    it('should reject URLs with invalid domains', () => {
      const result = EnvironmentManager.validateGitLabUrl('https://');

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid domain');
    });
  });

  describe('autoConfigureFromUrl', () => {
    it('should return known environment for gitlab.com', () => {
      const config = EnvironmentManager.autoConfigureFromUrl('https://gitlab.com');

      expect(config).toBeDefined();
      expect(config?.name).toBe('GitLab.com');
      expect(config?.requiresCustomToken).toBe(false);
    });

    it('should return known environment for FHNW GitLab', () => {
      const config = EnvironmentManager.autoConfigureFromUrl('https://gitlab.fhnw.ch');

      expect(config).toBeDefined();
      expect(config?.name).toBe('FHNW GitLab');
      expect(config?.requiresCustomToken).toBe(false);
    });

    it('should create custom config for unknown GitLab instances', () => {
      const config = EnvironmentManager.autoConfigureFromUrl('https://git.company.com');

      expect(config).toBeDefined();
      expect(config?.name).toContain('git.company.com');
      expect(config?.requiresCustomToken).toBe(true);
      expect(config?.gitlabBaseUrl).toBe('https://git.company.com');
      expect(config?.allowedDomains).toContain('git.company.com');
    });

    it('should return null for invalid URLs', () => {
      const config = EnvironmentManager.autoConfigureFromUrl('invalid-url');

      expect(config).toBeNull();
    });

    it('should handle subdomain matching', () => {
      const config = EnvironmentManager.autoConfigureFromUrl('https://team.gitlab.com');

      expect(config).toBeDefined();
      expect(config?.name).toBe('GitLab.com');
    });
  });

  describe('custom environments', () => {
    beforeEach(() => {
      // Mock figma.clientStorage for custom environment tests
      const mockStorage = new Map<string, string>();
      global.figma.clientStorage.getAsync = vi.fn().mockImplementation((key: string) => {
        return Promise.resolve(mockStorage.get(key) || null);
      });
      global.figma.clientStorage.setAsync = vi
        .fn()
        .mockImplementation((key: string, value: string) => {
          mockStorage.set(key, value);
          return Promise.resolve();
        });
    });

    it('should save and retrieve custom environments', async () => {
      const customConfig = {
        gitlabBaseUrl: 'https://gitlab.custom.com',
        allowedDomains: ['gitlab.custom.com'],
        name: 'Custom GitLab',
        description: 'Custom GitLab instance',
      };

      await EnvironmentManager.saveCustomEnvironment('custom-key', customConfig);

      const customEnvs = await EnvironmentManager.getCustomEnvironments();
      expect(customEnvs['custom-key']).toBeDefined();
      expect(customEnvs['custom-key'].gitlabBaseUrl).toBe('https://gitlab.custom.com');
      expect(customEnvs['custom-key'].requiresCustomToken).toBe(true);
    });

    it('should remove custom environments', async () => {
      const customConfig = {
        gitlabBaseUrl: 'https://gitlab.test.com',
        allowedDomains: ['gitlab.test.com'],
        name: 'Test GitLab',
        description: 'Test instance',
      };

      await EnvironmentManager.saveCustomEnvironment('test-key', customConfig);
      await EnvironmentManager.removeCustomEnvironment('test-key');

      const customEnvs = await EnvironmentManager.getCustomEnvironments();
      expect(customEnvs['test-key']).toBeUndefined();
    });

    it('should include custom environments in getAllEnvironmentsWithCustom', async () => {
      const customConfig = {
        gitlabBaseUrl: 'https://gitlab.internal.com',
        allowedDomains: ['gitlab.internal.com'],
        name: 'Internal GitLab',
        description: 'Internal instance',
      };

      await EnvironmentManager.saveCustomEnvironment('internal', customConfig);

      const allEnvs = await EnvironmentManager.getAllEnvironmentsWithCustom();
      expect(allEnvs['internal']).toBeDefined();
      expect(allEnvs['gitlab.com']).toBeDefined(); // Built-in should still exist
    });
  });

  describe('getEnvironmentForUrl', () => {
    it('should return built-in environment for known URLs', async () => {
      const env = await EnvironmentManager.getEnvironmentForUrl('https://gitlab.com');

      expect(env).toBeDefined();
      expect(env?.name).toBe('GitLab.com');
    });

    it('should return custom configuration for unknown URLs', async () => {
      const env = await EnvironmentManager.getEnvironmentForUrl('https://git.example.org');

      expect(env).toBeDefined();
      expect(env?.requiresCustomToken).toBe(true);
      expect(env?.gitlabBaseUrl).toBe('https://git.example.org');
    });

    it('should return null for empty URL', async () => {
      const env = await EnvironmentManager.getEnvironmentForUrl('');

      expect(env).toBeNull();
    });
  });

  describe('generateManifestDomains', () => {
    it('should generate correct domains for manifest', () => {
      const domains = EnvironmentManager.generateManifestDomains();

      expect(domains).toContain('https://cdnjs.cloudflare.com');
      expect(domains).toContain('https://gitlab.com');
      expect(domains).toContain('https://*.gitlab.com');
      expect(domains).toContain('https://gitlab.fhnw.ch');
    });

    it('should handle custom environments', () => {
      const customEnvs = {
        custom: {
          gitlabBaseUrl: 'https://git.custom.com',
          allowedDomains: ['git.custom.com', '*.git.custom.com'],
          name: 'Custom',
          description: 'Custom GitLab',
        },
      };

      const domains = EnvironmentManager.generateManifestDomains({
        ...ENVIRONMENTS,
        ...customEnvs,
      });

      expect(domains).toContain('https://git.custom.com');
      expect(domains).toContain('https://*.git.custom.com');
    });

    it('should skip invalid URLs', () => {
      const invalidEnvs = {
        invalid: {
          gitlabBaseUrl: 'not-a-url',
          allowedDomains: ['valid.com'],
          name: 'Invalid',
          description: 'Invalid URL',
        },
      };

      const domains = EnvironmentManager.generateManifestDomains(invalidEnvs);

      expect(domains).toContain('https://valid.com');
      expect(domains).not.toContain('not-a-url');
    });

    it('should return sorted domains', () => {
      const domains = EnvironmentManager.generateManifestDomains();
      const sortedDomains = [...domains].sort();

      expect(domains).toEqual(sortedDomains);
    });
  });
});
