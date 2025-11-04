/**
 * Environment-based configuration system
 * Allows different GitLab instances for production, staging, self-hosted, etc.
 */

export interface EnvironmentConfig {
  gitlabBaseUrl: string;
  allowedDomains: string[];
  name: string;
  description: string;
  requiresCustomToken?: boolean;
}

export const ENVIRONMENTS: Record<string, EnvironmentConfig> = {
  'gitlab.com': {
    gitlabBaseUrl: 'https://gitlab.com',
    allowedDomains: ['gitlab.com', '*.gitlab.com', '*.gitlab.io'],
    name: 'GitLab.com',
    description: 'Official GitLab SaaS platform',
    requiresCustomToken: false
  },
  'gitlab.fhnw.ch': {
    gitlabBaseUrl: 'https://gitlab.fhnw.ch',
    allowedDomains: ['gitlab.fhnw.ch', '*.gitlab.fhnw.ch'],
    name: 'FHNW GitLab',
    description: 'University of Applied Sciences Northwestern Switzerland',
    requiresCustomToken: false
  },
  custom: {
    gitlabBaseUrl: '', // Will be set by user
    allowedDomains: [], // Will be populated based on URL
    name: 'Custom GitLab',
    description: 'Self-hosted or enterprise GitLab instance',
    requiresCustomToken: true
  }
};

export class EnvironmentManager {
  private static readonly CUSTOM_CONFIG_KEY = 'bridgy-custom-environments';

  /**
   * Get environment configuration by key
   */
  static getEnvironment(key: string): EnvironmentConfig | null {
    return ENVIRONMENTS[key] || null;
  }

  /**
   * Get all available environments
   */
  static getAllEnvironments(): Record<string, EnvironmentConfig> {
    return { ...ENVIRONMENTS };
  }

  /**
   * Add or update a custom environment configuration
   */
  static async saveCustomEnvironment(
    key: string, 
    config: Omit<EnvironmentConfig, 'requiresCustomToken'>
  ): Promise<void> {
    try {
      const customConfigs = await this.getCustomEnvironments();
      customConfigs[key] = {
        ...config,
        requiresCustomToken: true
      };

      await figma.clientStorage.setAsync(
        this.CUSTOM_CONFIG_KEY,
        JSON.stringify(customConfigs)
      );
    } catch (error) {
      console.error('Failed to save custom environment:', error);
      throw error;
    }
  }

  /**
   * Get custom environments from storage
   */
  static async getCustomEnvironments(): Promise<Record<string, EnvironmentConfig>> {
    try {
      const stored = await figma.clientStorage.getAsync(this.CUSTOM_CONFIG_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load custom environments:', error);
      return {};
    }
  }

  /**
   * Get all environments (built-in + custom)
   */
  static async getAllEnvironmentsWithCustom(): Promise<Record<string, EnvironmentConfig>> {
    const customConfigs = await this.getCustomEnvironments();
    return {
      ...ENVIRONMENTS,
      ...customConfigs
    };
  }

  /**
   * Validate a GitLab URL and extract domain info
   */
  static validateGitLabUrl(url: string): { isValid: boolean; domain?: string; error?: string } {
    try {
      const parsed = new URL(url);
      
      if (parsed.protocol !== 'https:') {
        return { isValid: false, error: 'GitLab URL must use HTTPS' };
      }

      const domain = parsed.hostname;
      
      // Basic validation - should look like a GitLab instance
      if (!domain || domain.length < 3) {
        return { isValid: false, error: 'Invalid domain' };
      }

      return { isValid: true, domain };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  /**
   * Auto-configure environment from GitLab URL
   */
  static autoConfigureFromUrl(gitlabUrl: string): EnvironmentConfig | null {
    const validation = this.validateGitLabUrl(gitlabUrl);
    if (!validation.isValid || !validation.domain) {
      return null;
    }

    const domain = validation.domain;
    
    // Check if it matches a known environment
    for (const key in ENVIRONMENTS) {
      const config = ENVIRONMENTS[key];
      if (config.allowedDomains.some(allowed => {
        if (allowed.startsWith('*.')) {
          const suffix = allowed.substring(2);
          return domain.endsWith(suffix);
        }
        return domain === allowed;
      })) {
        return config;
      }
    }

    // Create custom configuration
    return {
      gitlabBaseUrl: gitlabUrl,
      allowedDomains: [domain, `*.${domain}`],
      name: `Custom (${domain})`,
      description: `Self-hosted GitLab at ${domain}`,
      requiresCustomToken: true
    };
  }

  /**
   * Remove a custom environment
   */
  static async removeCustomEnvironment(key: string): Promise<void> {
    try {
      const customConfigs = await this.getCustomEnvironments();
      delete customConfigs[key];

      await figma.clientStorage.setAsync(
        this.CUSTOM_CONFIG_KEY,
        JSON.stringify(customConfigs)
      );
    } catch (error) {
      console.error('Failed to remove custom environment:', error);
      throw error;
    }
  }

  /**
   * Get the appropriate environment for a GitLab URL
   */
  static async getEnvironmentForUrl(gitlabUrl: string): Promise<EnvironmentConfig | null> {
    if (!gitlabUrl) return null;

    // First check built-in environments
    const autoConfig = this.autoConfigureFromUrl(gitlabUrl);
    if (autoConfig && !autoConfig.requiresCustomToken) {
      return autoConfig;
    }

    // Then check custom environments
    const customEnvs = await this.getCustomEnvironments();
    for (const key in customEnvs) {
      const config = customEnvs[key];
      if (config.gitlabBaseUrl === gitlabUrl) {
        return config;
      }
    }

    // Return auto-configured custom environment
    return autoConfig;
  }

  /**
   * Generate manifest.json domains for build-time injection
   */
  static generateManifestDomains(environments?: Record<string, EnvironmentConfig>): string[] {
    const envs = environments || ENVIRONMENTS;
    const domains = new Set<string>();

    // Add CDN for JSZip
    domains.add('https://cdnjs.cloudflare.com');

    // Add all environment domains
    for (const key in envs) {
      const config = envs[key];
      if (config.gitlabBaseUrl) {
        try {
          const url = new URL(config.gitlabBaseUrl);
          domains.add(`https://${url.hostname}`);
        } catch (e) {
          // Skip invalid URLs
        }
      }
      
      // Add allowed domains
      config.allowedDomains.forEach(domain => {
        if (!domain.startsWith('*.')) {
          domains.add(`https://${domain}`);
        } else {
          // Convert *.domain.com to https://*.domain.com
          domains.add(`https://${domain}`);
        }
      });
    }

    return Array.from(domains).sort();
  }
}

// Export for build-time usage
export default EnvironmentManager;