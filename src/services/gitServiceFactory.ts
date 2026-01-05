/**
 * Factory for creating Git service instances based on provider
 */

import { BaseGitService } from './baseGitService';
import { GitProvider, GitSettings } from '../types/git';
import { GitLabServiceAdapter } from './gitLabServiceAdapter';
import { GitHubService } from './githubService';

export class GitServiceFactory {
  private static instances: Map<string, BaseGitService> = new Map();

  /**
   * Get or create a Git service instance based on provider
   */
  static getService(provider: GitProvider): BaseGitService {
    // Use singleton pattern to avoid recreating services
    if (!this.instances.has(provider)) {
      switch (provider) {
        case 'gitlab':
          this.instances.set(provider, new GitLabServiceAdapter());
          break;
        case 'github':
          this.instances.set(provider, new GitHubService());
          break;
        default:
          throw new Error(`Unsupported Git provider: ${provider}`);
      }
    }

    return this.instances.get(provider)!;
  }

  /**
   * Get service based on current settings
   */
  static async getServiceFromSettings(): Promise<BaseGitService | null> {
    // Try to load settings from both providers
    const gitlabService = this.getService('gitlab');
    const githubService = this.getService('github');

    // Check GitLab settings first (for backward compatibility)
    const gitlabSettings = await gitlabService.loadSettings();
    if (gitlabSettings) {
      return gitlabService;
    }

    // Check GitHub settings
    const githubSettings = await githubService.loadSettings();
    if (githubSettings) {
      return githubService;
    }

    return null;
  }

  /**
   * Clear all instances (useful for testing or cleanup)
   */
  static clearInstances(): void {
    this.instances.clear();
  }

  /**
   * Migrate settings from old format to new format
   */
  static async migrateSettings(): Promise<void> {
    // Check if we have old GitLab settings that need migration
    const gitlabService = this.getService('gitlab');
    const settings = await gitlabService.loadSettings();

    if (settings && !settings.provider) {
      // Old settings format detected, add provider field
      settings.provider = 'gitlab';
      await gitlabService.saveSettings(settings, !settings.isPersonal);
    }
  }

  /**
   * Get available providers
   */
  static getAvailableProviders(): GitProvider[] {
    return ['gitlab', 'github'];
  }

  /**
   * Check if a provider is supported
   */
  static isProviderSupported(provider: string): provider is GitProvider {
    return this.getAvailableProviders().indexOf(provider as GitProvider) !== -1;
  }
}
