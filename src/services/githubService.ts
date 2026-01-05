/**
 * GitHub Service implementation for BaseGitService
 * Handles all GitHub API interactions
 */

import { BaseGitService, GitAuthError, GitNetworkError, GitServiceError } from './baseGitService';
import {
  GitSettings,
  GitProject,
  GitFile,
  GitCommit,
  GitPullRequest,
  GitError,
} from '../types/git';
import { API_CONFIG, GIT_CONFIG, ERROR_MESSAGES, LoggingService } from '../config';
import { SecurityUtils } from '../utils/securityUtils';
import { ErrorHandler } from '../utils/errorHandler';
import { CryptoService } from './cryptoService';
import { ProxyService } from './proxyService';
import { RepositoryCacheService } from './repositoryCacheService';

// GitHub API types
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  default_branch: string;
  html_url: string;
  description?: string;
  private: boolean;
  language?: string;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  topics: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubContent {
  name: string;
  path: string;
  size: number;
  encoding: string;
  content: string;
  sha: string;
  type: 'file' | 'dir';
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    sha: string;
  };
  html_url: string;
}

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  draft: boolean;
  html_url: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  merged: boolean;
}

interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
  };
}

interface GitHubRef {
  ref: string;
  object: {
    sha: string;
  };
}

// Constants
const DEFAULT_BRANCH_NAME = GIT_CONFIG.DEFAULT_BRANCH;
const DEFAULT_TEST_BRANCH_NAME = GIT_CONFIG.DEFAULT_TEST_BRANCH;

export class GitHubService implements BaseGitService {
  private static readonly DEFAULT_HEADERS = API_CONFIG.DEFAULT_HEADERS;
  private static readonly API_VERSION = 'application/vnd.github.v3+json';

  /**
   * Get the GitHub API base URL
   */
  private static getGitHubApiBase(settings: GitSettings): string {
    if (settings.baseUrl && settings.baseUrl !== 'https://github.com') {
      // GitHub Enterprise: https://github.enterprise.com/api/v3
      const url = new URL(settings.baseUrl);
      return `${url.origin}/api/v3`;
    }
    return 'https://api.github.com';
  }

  /**
   * Parse owner and repo from projectId
   */
  private static parseOwnerRepo(projectId: string): { owner: string; repo: string } {
    const parts = projectId.split('/');
    if (parts.length !== 2) {
      throw new Error('GitHub project ID must be in format: owner/repo');
    }
    return { owner: parts[0], repo: parts[1] };
  }

  /**
   * Generate storage key for settings
   */
  private static getSettingsKey(): string {
    const figmaFileId = figma.root.id;
    return `github-settings-${figmaFileId}`;
  }

  async saveSettings(settings: GitSettings, shareWithTeam: boolean): Promise<void> {
    if (!settings || typeof settings !== 'object') {
      throw new Error(ERROR_MESSAGES.INVALID_SETTINGS);
    }

    try {
      const settingsKey = GitHubService.getSettingsKey();

      if (!shareWithTeam) {
        // Save only to personal storage
        await figma.clientStorage.setAsync(settingsKey, settings);
      } else {
        // Save to document storage (shared with team)
        const settingsToSave = Object.assign({}, settings);

        // Handle token encryption if needed
        if (!settings.saveToken) {
          delete settingsToSave.token;
        }

        figma.root.setSharedPluginData('Bridgy', settingsKey, JSON.stringify(settingsToSave));

        // Encrypt and save token separately if requested
        if (settings.saveToken && settings.token) {
          try {
            console.log('DEBUG: Starting token encryption');
            let cryptoAvailable = false;
            try {
              console.log('DEBUG: Checking CryptoService.isAvailable');
              console.log('DEBUG: CryptoService object:', CryptoService);
              cryptoAvailable = CryptoService.isAvailable();
              console.log('DEBUG: CryptoService.isAvailable result:', cryptoAvailable);
            } catch (cryptoError) {
              console.warn('CryptoService.isAvailable() failed:', cryptoError);
              cryptoAvailable = false;
            }

            if (cryptoAvailable) {
              console.log('DEBUG: Calls CryptoService.encrypt');
              const encryptedToken = await CryptoService.encrypt(settings.token);
              console.log('DEBUG: CryptoService.encrypt success');
              await figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
              await figma.clientStorage.setAsync(`${settingsKey}-crypto`, 'v2');
            } else {
              // Fallback encryption
              console.log('DEBUG: Using fallback encryption');
              console.log('DEBUG: SecurityUtils object:', SecurityUtils);

              if (typeof SecurityUtils.generateEncryptionKey !== 'function') {
                console.error('CRITICAL: SecurityUtils.generateEncryptionKey is not a function');
              }
              const encryptionKey = SecurityUtils.generateEncryptionKey();

              if (typeof SecurityUtils.encryptData !== 'function') {
                console.error('CRITICAL: SecurityUtils.encryptData is not a function');
              }
              const encryptedToken = SecurityUtils.encryptData(settings.token, encryptionKey);

              await figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
              await figma.clientStorage.setAsync(`${settingsKey}-key`, encryptionKey);
            }
          } catch (error) {
            console.error('DEBUG: Caught error in encrypt_token:', error);
            ErrorHandler.handleError(error as Error, {
              operation: 'encrypt_token',
              component: 'GitHubService',
              severity: 'high',
            });
            delete settingsToSave.token;
          }
        }
      }

      // Track metadata
      figma.root.setSharedPluginData(
        'Bridgy',
        `${settingsKey}-meta`,
        JSON.stringify({
          sharedWithTeam: shareWithTeam,
          savedAt: settings.savedAt,
          savedBy: settings.savedBy,
        }),
      );
    } catch (error: any) {
      LoggingService.error('Error saving GitHub settings', error, LoggingService.CATEGORIES.GITHUB);
      throw new GitServiceError(
        `Error saving GitHub settings: ${error.message || 'Unknown error'}`,
        undefined,
        error,
      );
    }
  }

  async loadSettings(): Promise<GitSettings | null> {
    try {
      const settingsKey = GitHubService.getSettingsKey();

      // Try loading shared document settings first
      const documentSettings = figma.root.getSharedPluginData('Bridgy', settingsKey);
      if (documentSettings) {
        try {
          const settings = JSON.parse(documentSettings) as GitSettings;

          // Load encrypted token if needed
          if (settings.saveToken && !settings.token) {
            const encryptedToken = await figma.clientStorage.getAsync(`${settingsKey}-token`);
            const cryptoVersion = await figma.clientStorage.getAsync(`${settingsKey}-crypto`);

            if (encryptedToken) {
              try {
                let cryptoAvailable = false;
                try {
                  cryptoAvailable = CryptoService.isAvailable();
                } catch (cryptoError) {
                  console.warn('CryptoService.isAvailable() failed during decrypt:', cryptoError);
                  cryptoAvailable = false;
                }

                if (cryptoVersion === 'v2' && cryptoAvailable) {
                  settings.token = await CryptoService.decrypt(encryptedToken);
                } else if (await figma.clientStorage.getAsync(`${settingsKey}-key`)) {
                  const encryptionKey = await figma.clientStorage.getAsync(`${settingsKey}-key`);
                  settings.token = SecurityUtils.decryptData(encryptedToken, encryptionKey);
                  settings._needsCryptoMigration = true;
                }
              } catch (error) {
                ErrorHandler.handleError(error as Error, {
                  operation: 'decrypt_token',
                  component: 'GitHubService',
                  severity: 'medium',
                });
              }
            }
          }

          // Load metadata
          const metaData = figma.root.getSharedPluginData('Bridgy', `${settingsKey}-meta`);
          if (metaData) {
            try {
              const meta = JSON.parse(metaData);
              settings.isPersonal = !meta.sharedWithTeam;
            } catch (metaParseError) {
              console.warn('Error parsing settings metadata:', metaParseError);
            }
          }

          return settings;
        } catch (parseError) {
          LoggingService.error(
            'Error parsing document settings',
            parseError,
            LoggingService.CATEGORIES.GITHUB,
          );
        }
      }

      // Try personal storage
      const personalSettings = await figma.clientStorage.getAsync(settingsKey);
      if (personalSettings) {
        return Object.assign({}, personalSettings, { isPersonal: true });
      }

      return null;
    } catch (error: any) {
      LoggingService.error(
        'Error loading GitHub settings',
        error,
        LoggingService.CATEGORIES.GITHUB,
      );
      return null;
    }
  }

  async resetSettings(): Promise<void> {
    try {
      const settingsKey = GitHubService.getSettingsKey();

      // Remove shared document storage
      figma.root.setSharedPluginData('Bridgy', settingsKey, '');
      figma.root.setSharedPluginData('Bridgy', `${settingsKey}-meta`, '');

      // Remove personal client storage
      await figma.clientStorage.deleteAsync(settingsKey);
      await figma.clientStorage.deleteAsync(`${settingsKey}-token`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-key`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);
    } catch (error: any) {
      LoggingService.error(
        'Error resetting GitHub settings',
        error,
        LoggingService.CATEGORIES.GITHUB,
      );
      throw new GitServiceError(
        `Error resetting GitHub settings: ${error.message || 'Unknown error'}`,
        undefined,
        error,
      );
    }
  }

  async validateCredentials(settings: GitSettings): Promise<boolean> {
    try {
      await this.getProject(settings);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getProject(settings: GitSettings): Promise<GitProject> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);
    const url = `${apiBase}/repos/${owner}/${repo}`;

    try {
      const response = await this.makeAPIRequest(
        url,
        {
          method: 'GET',
          headers: this.getHeaders(settings.token!),
        },
        settings,
      );

      const repoData = (await response.json()) as GitHubRepo;

      return {
        id: repoData.id,
        name: repoData.name,
        fullName: repoData.full_name,
        defaultBranch: repoData.default_branch,
        webUrl: repoData.html_url,
        description: repoData.description,
        private: repoData.private,
      };
    } catch (error: any) {
      throw this.handleGitHubError(error, 'fetch repository information');
    }
  }

  async listRepositories(settings: GitSettings): Promise<GitProject[]> {
    // Check cache first
    const cached = RepositoryCacheService.getCachedRepositories('github', settings.token!);
    if (cached) {
      return cached;
    }

    const apiBase = GitHubService.getGitHubApiBase(settings);

    try {
      // Fetch multiple pages for comprehensive results
      const allRepos: GitHubRepo[] = [];
      let page = 1;
      const perPage = 100;

      while (page <= 5) {
        // Limit to 5 pages (500 repos max)
        const url = `${apiBase}/user/repos?per_page=${perPage}&sort=updated&page=${page}&type=all`;

        const response = await this.makeAPIRequest(
          url,
          {
            method: 'GET',
            headers: this.getHeaders(settings.token!),
          },
          settings,
        );

        const repos = (await response.json()) as GitHubRepo[];

        if (repos.length === 0) {
          break; // No more repos
        }

        allRepos.push(...repos);

        // If we got less than the page size, we're done
        if (repos.length < perPage) {
          break;
        }

        page++;
      }

      const projects = allRepos.map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        defaultBranch: repo.default_branch,
        webUrl: repo.html_url,
        description: repo.description,
        private: repo.private,
        language: repo.language,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        updatedAt: repo.updated_at,
        createdAt: repo.created_at,
        topics: repo.topics || [],
        owner: {
          login: repo.owner.login,
          avatar_url: repo.owner.avatar_url,
        },
      }));

      // Cache the results
      RepositoryCacheService.cacheRepositories('github', settings.token!, projects);

      return projects;
    } catch (error: any) {
      throw this.handleGitHubError(error, 'list repositories');
    }
  }

  /**
   * List branches for a repository
   */
  async listBranches(settings: GitSettings): Promise<Array<{ name: string; isDefault: boolean }>> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);

    try {
      // Get repository info for default branch
      const repoData = await this.getProject(settings);
      const defaultBranch = repoData.defaultBranch;

      // Get branches
      const url = `${apiBase}/repos/${owner}/${repo}/branches`;

      const response = await this.makeAPIRequest(
        url,
        {
          method: 'GET',
          headers: this.getHeaders(settings.token!),
        },
        settings,
      );

      const branches = (await response.json()) as GitHubBranch[];

      return branches.map((branch) => ({
        name: branch.name,
        isDefault: branch.name === defaultBranch,
      }));
    } catch (error: any) {
      throw this.handleGitHubError(error, 'list branches');
    }
  }

  async createBranch(settings: GitSettings, branchName: string, baseBranch: string): Promise<void> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);

    // First, get the base branch SHA
    const baseBranchUrl = `${apiBase}/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`;

    try {
      const baseResponse = await this.makeAPIRequest(
        baseBranchUrl,
        {
          method: 'GET',
          headers: this.getHeaders(settings.token!),
        },
        settings,
      );

      const baseRef = (await baseResponse.json()) as GitHubRef;
      const baseSha = baseRef.object.sha;

      // Create new branch
      const createBranchUrl = `${apiBase}/repos/${owner}/${repo}/git/refs`;

      await this.makeAPIRequest(
        createBranchUrl,
        {
          method: 'POST',
          headers: this.getHeaders(settings.token!),
          body: JSON.stringify({
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
          }),
        },
        settings,
      );
    } catch (error: any) {
      // If branch already exists, that's OK
      if (error instanceof GitServiceError && error.statusCode === 422) {
        const message = error.message.toLowerCase();
        if (message.includes('already exists') || message.includes('reference already exists')) {
          return;
        }
      }
      throw this.handleGitHubError(error, `create branch '${branchName}'`);
    }
  }

  async getFile(settings: GitSettings, filePath: string, branch: string): Promise<GitFile | null> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);
    const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

    try {
      const response = await this.makeAPIRequest(
        url,
        {
          method: 'GET',
          headers: this.getHeaders(settings.token!),
        },
        settings,
      );

      const fileData = (await response.json()) as GitHubContent;

      if (fileData.type !== 'file') {
        throw new Error('Path is not a file');
      }

      return {
        fileName: fileData.name,
        filePath: fileData.path,
        size: fileData.size,
        encoding: fileData.encoding,
        content: fileData.content,
        lastCommitId: fileData.sha,
        sha: fileData.sha,
      };
    } catch (error: any) {
      if (error instanceof GitServiceError && error.statusCode === 404) {
        return null;
      }
      throw this.handleGitHubError(error, 'fetch file content');
    }
  }

  async commitFile(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    content: string,
    branch: string,
  ): Promise<GitCommit> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);
    const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}`;

    // Check if file exists to get SHA
    let existingFile;
    try {
      existingFile = await this.getFile(settings, filePath, branch);
    } catch (e) {
      // File doesn't exist, which is fine for new files
    }

    const encodedContent = SecurityUtils.toBase64(content);

    const requestBody: any = {
      message: commitMessage,
      content: encodedContent,
      branch: branch,
    };

    if (existingFile) {
      requestBody.sha = existingFile.sha;
    }

    try {
      const response = await this.makeAPIRequest(
        url,
        {
          method: 'PUT',
          headers: this.getHeaders(settings.token!),
          body: JSON.stringify(requestBody),
        },
        settings,
      );

      const result = (await response.json()) as {
        commit: GitHubCommit;
        content: GitHubContent;
      };

      return {
        id: result.commit.sha,
        sha: result.commit.sha,
        title: commitMessage,
        message: commitMessage,
        webUrl: result.commit.html_url,
      };
    } catch (error: any) {
      console.error('DEBUG: commitFile error catch block:', error);
      console.log('DEBUG: this.handleGitHubError type:', typeof this.handleGitHubError);
      throw this.handleGitHubError(error, 'create commit');
    }
  }

  async createPullRequest(
    settings: GitSettings,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    isDraft: boolean = false,
  ): Promise<GitPullRequest> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);
    const url = `${apiBase}/repos/${owner}/${repo}/pulls`;

    try {
      const response = await this.makeAPIRequest(
        url,
        {
          method: 'POST',
          headers: this.getHeaders(settings.token!),
          body: JSON.stringify({
            title: title,
            body: description,
            head: sourceBranch,
            base: targetBranch,
            draft: isDraft,
          }),
        },
        settings,
      );

      const pr = (await response.json()) as GitHubPullRequest;

      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        description: pr.body,
        state: pr.state,
        webUrl: pr.html_url,
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        draft: pr.draft,
      };
    } catch (error: any) {
      throw this.handleGitHubError(error, 'create pull request');
    }
  }

  async findExistingPullRequest(
    settings: GitSettings,
    sourceBranch: string,
  ): Promise<GitPullRequest | null> {
    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);
    const apiBase = GitHubService.getGitHubApiBase(settings);
    const url = `${apiBase}/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${sourceBranch}`;

    try {
      const response = await this.makeAPIRequest(
        url,
        {
          method: 'GET',
          headers: this.getHeaders(settings.token!),
        },
        settings,
      );

      const prs = (await response.json()) as GitHubPullRequest[];

      if (prs.length === 0) {
        return null;
      }

      const pr = prs[0];
      return {
        id: pr.id,
        number: pr.number,
        title: pr.title,
        description: pr.body,
        state: pr.state,
        webUrl: pr.html_url,
        sourceBranch: pr.head.ref,
        targetBranch: pr.base.ref,
        draft: pr.draft,
      };
    } catch (error: any) {
      throw this.handleGitHubError(error, 'find existing pull request');
    }
  }

  async commitWorkflow(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string = DEFAULT_BRANCH_NAME,
  ): Promise<{ pullRequestUrl?: string }> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        this.validateCommitParameters(settings, commitMessage, filePath, cssData);

        // Get project info
        const project = await this.getProject(settings);
        const defaultBranch = project.defaultBranch;

        // Create or verify branch exists
        await this.createBranch(settings, branchName, defaultBranch);

        // Commit the file
        await this.commitFile(settings, commitMessage, filePath, cssData, branchName);

        // Check for existing PR
        const existingPR = await this.findExistingPullRequest(settings, branchName);

        if (!existingPR) {
          // Create new PR
          const newPR = await this.createPullRequest(
            settings,
            branchName,
            defaultBranch,
            commitMessage,
            'Automatically created pull request for CSS variables update',
            false,
          );
          return { pullRequestUrl: newPR.webUrl };
        }

        console.log('DEBUG: Found existing PR');
        return { pullRequestUrl: existingPR.webUrl };
      },
      {
        operation: 'commit_to_github',
        component: 'GitHubService',
        severity: 'high',
      },
    );
  }

  async commitComponentTest(
    settings: GitSettings,
    commitMessage: string,
    componentName: string,
    testContent: string,
    testFilePath: string = 'components/{componentName}.spec.ts',
    branchName: string = DEFAULT_TEST_BRANCH_NAME,
  ): Promise<{ pullRequestUrl?: string }> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        this.validateComponentTestParameters(settings, commitMessage, componentName, testContent);

        // Normalize component name and file path
        const normalizedComponentName = this.normalizeComponentName(componentName);
        const filePath = testFilePath.replace(/{componentName}/g, normalizedComponentName);
        const featureBranch = `${branchName}-${normalizedComponentName}`;

        // Get project info
        const project = await this.getProject(settings);
        const defaultBranch = project.defaultBranch;

        // Create or verify branch
        await this.createBranch(settings, featureBranch, defaultBranch);

        // Commit the test file
        await this.commitFile(settings, commitMessage, filePath, testContent, featureBranch);

        // Check for existing PR
        const existingPR = await this.findExistingPullRequest(settings, featureBranch);

        if (!existingPR) {
          // Create new PR
          const prDescription = `Automatically created pull request for component test: ${componentName}`;
          const newPR = await this.createPullRequest(
            settings,
            featureBranch,
            defaultBranch,
            commitMessage,
            prDescription,
            true, // Mark as draft
          );
          return { pullRequestUrl: newPR.webUrl };
        }

        return { pullRequestUrl: existingPR.webUrl };
      },
      {
        operation: 'commit_component_test',
        component: 'GitHubService',
        severity: 'high',
      },
    );
  }

  async clearAllTokens(): Promise<void> {
    try {
      const settingsKey = GitHubService.getSettingsKey();

      // Clear token and encryption keys
      await figma.clientStorage.deleteAsync(`${settingsKey}-token`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-key`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);

      // Clear personal storage
      await figma.clientStorage.deleteAsync(settingsKey);

      // Update shared settings to remove saveToken flag
      const sharedSettings = figma.root.getSharedPluginData('Bridgy', settingsKey);
      if (sharedSettings) {
        try {
          const settings = JSON.parse(sharedSettings) as GitSettings;
          settings.saveToken = false;
          delete settings.token;
          figma.root.setSharedPluginData('Bridgy', settingsKey, JSON.stringify(settings));
        } catch (e) {
          // Ignore parse errors
        }
      }

      LoggingService.info('All GitHub tokens cleared', LoggingService.CATEGORIES.GITHUB);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        operation: 'clear_tokens',
        component: 'GitHubService',
        severity: 'low',
      });
    }
  }

  async getTokenInfo(): Promise<{
    encrypted: boolean;
    version: string;
    hasToken: boolean;
  }> {
    const settingsKey = GitHubService.getSettingsKey();
    const token = await figma.clientStorage.getAsync(`${settingsKey}-token`);
    const cryptoVersion = await figma.clientStorage.getAsync(`${settingsKey}-crypto`);

    return {
      hasToken: !!token,
      encrypted: !!token,
      version: cryptoVersion || (token ? 'v1' : 'none'),
    };
  }

  /**
   * Private helper methods
   */

  private getHeaders(token: string): Record<string, string> {
    return Object.assign({}, GitHubService.DEFAULT_HEADERS, {
      Authorization: `Bearer ${token}`,
      Accept: GitHubService.API_VERSION,
    });
  }

  private validateCommitParameters(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    cssData: string,
  ): void {
    if (!settings.projectId || !settings.projectId.trim()) {
      throw new Error('Project ID is required');
    }

    const { owner, repo } = GitHubService.parseOwnerRepo(settings.projectId);

    if (!settings.token || !settings.token.trim()) {
      throw new GitAuthError('GitHub token is required');
    }

    if (!commitMessage || !commitMessage.trim()) {
      throw new Error('Commit message is required');
    }

    if (!filePath || !filePath.trim()) {
      throw new Error('File path is required');
    }

    if (!cssData || !cssData.trim()) {
      throw new Error('CSS data is required');
    }
  }

  private validateComponentTestParameters(
    settings: GitSettings,
    commitMessage: string,
    componentName: string,
    testContent: string,
  ): void {
    if (!settings.projectId || !settings.projectId.trim()) {
      throw new Error('Project ID is required');
    }

    if (!settings.token || !settings.token.trim()) {
      throw new GitAuthError('GitHub token is required');
    }

    if (!commitMessage || !commitMessage.trim()) {
      throw new Error('Commit message is required');
    }

    if (!componentName || !componentName.trim()) {
      throw new Error('Component name is required');
    }

    if (!testContent || !testContent.trim()) {
      throw new Error('Test content is required');
    }
  }

  private normalizeComponentName(componentName: string): string {
    return componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private async makeAPIRequest(
    url: string,
    options: RequestInit,
    settings: GitSettings,
  ): Promise<Response> {
    const timeoutMs = 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GitNetworkError('Request timed out - please check your connection to GitHub'));
      }, timeoutMs);
    });

    try {
      // Check if we should use proxy
      const useProxy = ProxyService.shouldUseProxy(url);

      const response = await Promise.race([
        useProxy
          ? ProxyService.proxyGitLabRequest(url, options) // Can reuse for GitHub
          : fetch(url, options),
        timeoutPromise,
      ]);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = (await response.json()) as GitError;
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Use default message
        }

        const error = new GitServiceError(errorMessage, response.status);
        throw error;
      }

      return response;
    } catch (error: any) {
      if (error instanceof GitServiceError || error instanceof GitNetworkError) {
        throw error;
      }

      if (error.name === 'TypeError' && error.message.indexOf('fetch') !== -1) {
        throw new GitNetworkError('Network error - unable to connect to GitHub API');
      }

      throw error;
    }
  }

  private handleGitHubError(error: any, operation: string): Error {
    if (
      error instanceof GitServiceError ||
      error instanceof GitAuthError ||
      error instanceof GitNetworkError
    ) {
      return error;
    }

    if (error.statusCode) {
      switch (error.statusCode) {
        case 401:
        case 403:
          return new GitAuthError(
            `Authentication failed while trying to ${operation}. Please check your GitHub token.`,
          );
        case 404:
          return new GitServiceError(
            `Resource not found while trying to ${operation}. Please check your repository.`,
            404,
          );
        case 422:
          return new GitServiceError(
            `Invalid data provided while trying to ${operation}. Please check your inputs.`,
            422,
          );
        case 429:
          return new GitServiceError(
            `Rate limit exceeded while trying to ${operation}. Please try again later.`,
            429,
          );
        default:
          return new GitServiceError(
            `GitHub API error while trying to ${operation}: ${error.message || 'Unknown error'}`,
            error.statusCode,
          );
      }
    }

    if (
      error.name === 'TypeError' ||
      error.message?.indexOf('fetch') !== -1 ||
      error.message?.indexOf('network') !== -1
    ) {
      return new GitNetworkError(`Network error while trying to ${operation}`);
    }

    return new GitServiceError(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
  }
}
