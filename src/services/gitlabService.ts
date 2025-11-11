import { GitLabSettings } from "../types";
import { API_CONFIG, GIT_CONFIG, ERROR_MESSAGES, LoggingService, buildGitLabApiUrlSync, buildGitLabWebUrlSync } from "../config";
import { SecurityUtils } from "../utils/securityUtils";
import { ErrorHandler } from "../utils/errorHandler";
import { CryptoService } from "./cryptoService";
import { ProxyService } from "./proxyService";

// Types for improved type safety
interface GitLabProject {
  id: number;
  name: string;
  default_branch: string;
  web_url: string;
}

interface GitLabFile {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content: string;
  last_commit_id: string;
}

interface GitLabCommit {
  id: string;
  title: string;
  message: string;
  web_url: string;
}

interface GitLabMergeRequest {
  id: number;
  title: string;
  description: string;
  state: 'opened' | 'closed' | 'merged';
  web_url: string;
  source_branch: string;
  target_branch: string;
}

interface GitLabError {
  message: string;
  error?: string;
  error_description?: string;
}

// Constants from configuration
const DEFAULT_BRANCH_NAME = GIT_CONFIG.DEFAULT_BRANCH;
const DEFAULT_TEST_BRANCH_NAME = GIT_CONFIG.DEFAULT_TEST_BRANCH;

// Custom error classes
class GitLabAPIError extends Error {
  public statusCode?: number;
  
  constructor(
    message: string,
    statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitLabAPIError';
    this.statusCode = statusCode;
  }
}

class GitLabAuthError extends Error {
  constructor(message: string = ERROR_MESSAGES.GITLAB_AUTH) {
    super(message);
    this.name = 'GitLabAuthError';
  }
}

class GitLabNetworkError extends Error {
  constructor(message: string = ERROR_MESSAGES.NETWORK_ERROR) {
    super(message);
    this.name = 'GitLabNetworkError';
  }
}

export class GitLabService {
  private static readonly DEFAULT_HEADERS = API_CONFIG.DEFAULT_HEADERS;

  /**
   * Get the GitLab API base URL from settings
   */
  private static getGitLabApiBase(settings: GitLabSettings): string {
    return buildGitLabApiUrlSync(settings.gitlabUrl);
  }

  /**
   * Get the GitLab web URL from settings
   */
  private static getGitLabWebBase(settings: GitLabSettings): string {
    return buildGitLabWebUrlSync(settings.gitlabUrl);
  }

  /**
   * Save GitLab settings to Figma storage
   */
  static async saveSettings(
    settings: GitLabSettings,
    shareWithTeam: boolean
  ): Promise<void> {
    if (!settings || typeof settings !== 'object') {
      throw new Error(ERROR_MESSAGES.INVALID_SETTINGS);
    }

    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `gitlab-settings-${figmaFileId}`;

      if (!shareWithTeam) {
        // Save only to personal storage (not shared with team)
        await figma.clientStorage.setAsync(settingsKey, settings);
      } else {
        // Save to document storage (shared with team)
        const settingsToSave = Object.assign({}, settings);

        // If user didn't opt to save the token, don't store it in shared settings
        if (!settings.saveToken) {
          delete settingsToSave.gitlabToken;
        }

        figma.root.setSharedPluginData(
          "Bridgy",
          settingsKey,
          JSON.stringify(settingsToSave)
        );

        // If token should be saved, encrypt it before storing
        if (settings.saveToken && settings.gitlabToken) {
          try {
            if (CryptoService.isAvailable()) {
              // Use secure Web Crypto API encryption
              const encryptedToken = await CryptoService.encrypt(settings.gitlabToken);
              await figma.clientStorage.setAsync(
                `${settingsKey}-token`,
                encryptedToken
              );
              await figma.clientStorage.setAsync(
                `${settingsKey}-crypto`,
                'v2' // Version marker for new encryption
              );
              
              // Clean up old encryption artifacts if migration happened
              if ((settings as any)._needsCryptoMigration) {
                await figma.clientStorage.deleteAsync(`${settingsKey}-key`);
                delete (settings as any)._needsCryptoMigration;
              }
            } else {
              // Fallback to old encryption if Web Crypto not available
              const encryptionKey = SecurityUtils.generateEncryptionKey();
              const encryptedToken = SecurityUtils.encryptData(settings.gitlabToken, encryptionKey);
              await figma.clientStorage.setAsync(
                `${settingsKey}-token`,
                encryptedToken
              );
              await figma.clientStorage.setAsync(
                `${settingsKey}-key`,
                encryptionKey
              );
            }
          } catch (error) {
            ErrorHandler.handleError(error as Error, {
              operation: 'encrypt_token',
              component: 'GitLabService',
              severity: 'high'
            });
            // Do not save token if encryption fails
            delete settingsToSave.gitlabToken;
          }
        }
      }

      // Track metadata
      figma.root.setSharedPluginData(
        "Bridgy",
        `${settingsKey}-meta`,
        JSON.stringify({
          sharedWithTeam: shareWithTeam,
          savedAt: settings.savedAt,
          savedBy: settings.savedBy,
        })
      );
    } catch (error: any) {
      LoggingService.error("Error saving GitLab settings", error, LoggingService.CATEGORIES.GITLAB);
      throw new GitLabAPIError(
        `Error saving GitLab settings: ${error.message || "Unknown error"}`,
        undefined,
        error
      );
    }
  }

  /**
   * Load GitLab settings from Figma storage
   */
  static async loadSettings(): Promise<GitLabSettings | null> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `gitlab-settings-${figmaFileId}`;

      // Try loading in order of priority
      const documentSettings = await this.loadDocumentSettings(settingsKey);
      if (documentSettings) return documentSettings;

      const personalSettings = await this.loadPersonalSettings(settingsKey);
      if (personalSettings) return personalSettings;

      const legacySettings = await this.loadLegacySettings();
      if (legacySettings) return legacySettings;

      return null;
    } catch (error: any) {
      LoggingService.error("Error loading GitLab settings", error, LoggingService.CATEGORIES.GITLAB);
      return null;
    }
  }

  /**
   * Load shared document settings with personal token
   */
  private static async loadDocumentSettings(settingsKey: string): Promise<GitLabSettings | null> {
    const documentSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
    if (!documentSettings) return null;

    try {
      const settings = JSON.parse(documentSettings);

      // Try to load personal token if settings indicate it should be saved
      if (settings.saveToken && !settings.gitlabToken) {
        const encryptedToken = await figma.clientStorage.getAsync(`${settingsKey}-token`);
        const cryptoVersion = await figma.clientStorage.getAsync(`${settingsKey}-crypto`);
        
        if (encryptedToken) {
          try {
            if (cryptoVersion === 'v2' && CryptoService.isAvailable()) {
              // Decrypt using new Web Crypto API
              const decryptedToken = await CryptoService.decrypt(encryptedToken);
              settings.gitlabToken = decryptedToken;
            } else if (await figma.clientStorage.getAsync(`${settingsKey}-key`)) {
              // Fallback to old XOR decryption
              const encryptionKey = await figma.clientStorage.getAsync(`${settingsKey}-key`);
              const decryptedToken = SecurityUtils.decryptData(encryptedToken, encryptionKey);
              settings.gitlabToken = decryptedToken;
              
              // Migrate to new encryption on next save
              settings._needsCryptoMigration = true;
            } else {
              // Very old unencrypted tokens (backward compatibility)
              settings.gitlabToken = encryptedToken;
              settings._needsCryptoMigration = true;
            }
          } catch (error) {
            ErrorHandler.handleError(error as Error, {
              operation: 'decrypt_token',
              component: 'GitLabService',
              severity: 'medium'
            });
          }
        }
      }

      // Load metadata if available
      const metaData = figma.root.getSharedPluginData("Bridgy", `${settingsKey}-meta`);
      if (metaData) {
        try {
          const meta = JSON.parse(metaData);
          settings.isPersonal = !meta.sharedWithTeam;
        } catch (metaParseError) {
          console.warn("Error parsing settings metadata:", metaParseError);
        }
      }

      return settings;
    } catch (parseError) {
      LoggingService.error("Error parsing document settings", parseError, LoggingService.CATEGORIES.GITLAB);
      return null;
    }
  }

  /**
   * Load personal client storage settings
   */
  private static async loadPersonalSettings(settingsKey: string): Promise<GitLabSettings | null> {
    const personalSettings = await figma.clientStorage.getAsync(settingsKey);
    if (personalSettings) {
      return Object.assign({}, personalSettings, { isPersonal: true });
    }
    return null;
  }

  /**
   * Load and migrate legacy settings
   */
  private static async loadLegacySettings(): Promise<GitLabSettings | null> {
    const legacyDocumentSettings = figma.root.getSharedPluginData("Bridgy", "gitlab-settings");
    if (!legacyDocumentSettings) return null;

    try {
      const settings = JSON.parse(legacyDocumentSettings);
      // Save as project-specific settings
      await this.saveSettings(settings, true);
      // Remove old global settings to prevent confusion
      figma.root.setSharedPluginData("Bridgy", "gitlab-settings", "");
      return settings;
    } catch (parseError) {
      LoggingService.error("Error parsing legacy document settings", parseError, LoggingService.CATEGORIES.GITLAB);
      return null;
    }
  }

  /**
   * Reset all GitLab settings
   */
  static async resetSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `gitlab-settings-${figmaFileId}`;

      // Remove shared document storage
      figma.root.setSharedPluginData("Bridgy", settingsKey, "");
      figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, "");

      // Remove personal client storage including encryption keys
      await figma.clientStorage.deleteAsync(settingsKey);
      await figma.clientStorage.deleteAsync(`${settingsKey}-token`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-key`);

      // Also remove any legacy global settings (cleanup)
      figma.root.setSharedPluginData("Bridgy", "gitlab-settings", "");
      await figma.clientStorage.deleteAsync("gitlab-settings");

    } catch (error: any) {
      LoggingService.error("Error resetting GitLab settings", error, LoggingService.CATEGORIES.GITLAB);
      throw new GitLabAPIError(
        `Error resetting GitLab settings: ${error.message || "Unknown error"}`,
        undefined,
        error
      );
    }
  }

  /**
   * Commit CSS data to GitLab repository
   */
  static async commitToGitLab(
    settings: GitLabSettings,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string = DEFAULT_BRANCH_NAME
  ): Promise<{ mergeRequestUrl?: string }> {
    return await ErrorHandler.withErrorHandling(async () => {
      const { projectId, gitlabToken } = settings;
      this.validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData);

      const featureBranch = branchName;

      // Get project information (this will fail fast if there's no connectivity)
      const projectData = await this.fetchProjectInfo(projectId, gitlabToken, settings);
      const defaultBranch = projectData.default_branch;

      // Create or get feature branch
      await this.createFeatureBranch(
        projectId,
        gitlabToken,
        featureBranch,
        defaultBranch,
        settings
      );

      // Check if file exists and prepare commit
      const { fileData, action } = await this.prepareFileCommit(
        projectId,
        gitlabToken,
        filePath,
        featureBranch,
        settings
      );

      // Create the commit
      await this.createCommit(
        projectId,
        gitlabToken,
        featureBranch,
        commitMessage,
        filePath,
        cssData,
        action,
        fileData && fileData.last_commit_id,
        settings
      );

      // Check for existing merge request
      const existingMR = await this.findExistingMergeRequest(
        projectId,
        gitlabToken,
        featureBranch,
        settings
      );

      if (!existingMR) {
        // Create new merge request if none exists
        const newMR = await this.createMergeRequest(
          projectId,
          gitlabToken,
          featureBranch,
          defaultBranch,
          commitMessage,
          "Automatically created merge request for CSS variables update",
          false,
          settings
        );
        return { mergeRequestUrl: newMR.web_url };
      }

      return { mergeRequestUrl: existingMR.web_url };
    }, {
      operation: 'commit_to_gitlab',
      component: 'GitLabService',
      severity: 'high'
    });
  }

  /**
   * Validate commit parameters with comprehensive security checks
   */
  private static validateCommitParameters(
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    filePath: string,
    cssData: string
  ): void {
    // Project ID validation - numeric or namespace/project format
    if (!projectId || !projectId.trim()) {
      throw new Error('Project ID is required');
    }
    const projectIdPattern = /^(\d+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/;
    if (!projectIdPattern.test(projectId.trim())) {
      throw new Error('Invalid project ID format. Use numeric ID or namespace/project format.');
    }
    
    // Token validation - very lenient, just check basic requirements
    if (!gitlabToken || !gitlabToken.trim()) {
      throw new GitLabAuthError('GitLab token is required');
    }
    
    const trimmedToken = gitlabToken.trim();
    if (trimmedToken.length < 8) {
      throw new GitLabAuthError('GitLab token must be at least 8 characters long');
    }
    
    // Only reject tokens with obviously invalid characters
    if (/[\s"'<>]/.test(trimmedToken)) {
      throw new GitLabAuthError('GitLab token contains invalid characters');
    }
    
    // Commit message validation - length and XSS prevention
    if (!commitMessage || !commitMessage.trim()) {
      throw new Error('Commit message is required');
    }
    if (commitMessage.length > 500) {
      throw new Error('Commit message too long (max 500 characters)');
    }
    if (/<script|javascript:|on\w+\s*=/i.test(commitMessage)) {
      throw new Error('Commit message contains potentially unsafe content');
    }
    
    // File path validation - prevent path traversal
    if (!filePath || !filePath.trim()) {
      throw new Error('File path is required');
    }
    if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
      throw new Error('Invalid file path - path traversal detected');
    }
    const filePathPattern = /^[a-zA-Z0-9/_.-]+\.(css|scss|less)$/;
    if (!filePathPattern.test(filePath)) {
      throw new Error('File path must be a valid CSS/SCSS/LESS file path');
    }
    
    // CSS data validation
    if (!cssData || !cssData.trim()) {
      throw new Error('CSS data is required');
    }
    if (cssData.length > 1024 * 1024) { // 1MB limit
      throw new Error('CSS data too large (max 1MB)');
    }
  }

  /**
   * Fetch project information from GitLab API
   */
  private static async fetchProjectInfo(
    projectId: string,
    gitlabToken: string,
    settings: GitLabSettings
  ): Promise<GitLabProject> {
    const apiBase = this.getGitLabApiBase(settings);
    const projectUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}`;
    
    try {
      const response = await this.makeAPIRequest(projectUrl, {
        method: "GET",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
      });

      return await response.json() as GitLabProject;
    } catch (error: any) {
      throw this.handleGitLabError(error, 'fetch project information');
    }
  }

  /**
   * Create a feature branch or verify it exists
   */
  private static async createFeatureBranch(
    projectId: string,
    gitlabToken: string,
    featureBranch: string,
    defaultBranch: string,
    settings: GitLabSettings
  ): Promise<void> {
    const apiBase = this.getGitLabApiBase(settings);
    const createBranchUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/branches`;
    
    try {
      await this.makeAPIRequest(createBranchUrl, {
        method: "POST",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
        body: JSON.stringify({
          branch: featureBranch,
          ref: defaultBranch,
        }),
      });
      // Branch created successfully
    } catch (error: any) {
      if (error instanceof GitLabAPIError) {
        // If branch already exists (400 error), that's fine - we'll use it
        if (error.statusCode === 400 && error.message && error.message.includes('already exists')) {
          return; // Branch exists, continue
        }
        throw error;
      }
      throw this.handleGitLabError(error, `create branch '${featureBranch}'`);
    }
  }

  /**
   * Check if file exists and prepare commit action
   */
  private static async prepareFileCommit(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    featureBranch: string,
    settings: GitLabSettings
  ): Promise<{ fileData: GitLabFile | null; action: 'create' | 'update' }> {
    const apiBase = this.getGitLabApiBase(settings);
    const checkFileUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(featureBranch)}`;
    
    try {
      const response = await this.makeAPIRequest(checkFileUrl, {
        method: "GET",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
      });

      // File exists, get its data
      const fileData = await response.json() as GitLabFile;
      return { fileData, action: 'update' as const };
    } catch (error: any) {
      // If file doesn't exist (404), that's fine - we'll create it
      if (error instanceof GitLabAPIError && error.statusCode === 404) {
        return { fileData: null, action: 'create' as const };
      }
      throw this.handleGitLabError(error, 'check file existence');
    }
  }

  /**
   * Create a commit with the file changes
   */
  private static async createCommit(
    projectId: string,
    gitlabToken: string,
    featureBranch: string,
    commitMessage: string,
    filePath: string,
    cssData: string,
    action: 'create' | 'update',
    lastCommitId: string | undefined,
    settings: GitLabSettings
  ): Promise<GitLabCommit> {
    const apiBase = this.getGitLabApiBase(settings);
    const commitUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/commits`;
    const commitAction: any = {
      action,
      file_path: filePath,
      content: cssData,
      encoding: "text"
    };
    
    if (lastCommitId) {
      commitAction.last_commit_id = lastCommitId;
    }

    try {
      const response = await this.makeAPIRequest(commitUrl, {
        method: "POST",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
        body: JSON.stringify({
          branch: featureBranch,
          commit_message: commitMessage,
          actions: [commitAction],
        }),
      });

      return await response.json() as GitLabCommit;
    } catch (error: any) {
      if (error instanceof GitLabAPIError) {
        throw error;
      }
      throw this.handleGitLabError(error, 'create commit');
    }
  }

  /**
   * Find existing merge request for the branch
   */
  private static async findExistingMergeRequest(
    projectId: string,
    gitlabToken: string,
    sourceBranch: string,
    settings: GitLabSettings
  ): Promise<GitLabMergeRequest | null> {
    const apiBase = this.getGitLabApiBase(settings);
    const mrUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/merge_requests?source_branch=${encodeURIComponent(sourceBranch)}&state=opened`;
    
    try {
      const response = await this.makeAPIRequest(mrUrl, {
        method: "GET",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
      });

      const mergeRequests = await response.json() as GitLabMergeRequest[];
      return mergeRequests.length > 0 ? mergeRequests[0] : null;
    } catch (error: any) {
      throw this.handleGitLabError(error, 'fetch merge requests');
    }
  }

  /**
   * Create a new merge request
   */
  private static async createMergeRequest(
    projectId: string,
    gitlabToken: string,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string = "Automatically created merge request for CSS variables update",
    isDraft: boolean = false,
    settings: GitLabSettings
  ): Promise<GitLabMergeRequest> {
    const apiBase = this.getGitLabApiBase(settings);
    const mrUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/merge_requests`;
    
    // Prefix title with "Draft:" if it's a draft MR
    const finalTitle = isDraft ? `Draft: ${title}` : title;
    
    try {
      const response = await this.makeAPIRequest(mrUrl, {
        method: "POST",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
        body: JSON.stringify({
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title: finalTitle,
          description: description,
          remove_source_branch: true,
          squash: true,
        }),
      });

      return await response.json() as GitLabMergeRequest;
    } catch (error: any) {
      if (error instanceof GitLabAPIError) {
        throw error;
      }
      throw this.handleGitLabError(error, 'create merge request');
    }
  }

  /**
   * Commit component test files to GitLab
   */
  static async commitComponentTest(
    settings: GitLabSettings,
    commitMessage: string,
    componentName: string,
    testContent: string,
    testFilePath: string = "components/{componentName}.spec.ts",
    branchName: string = DEFAULT_TEST_BRANCH_NAME
  ): Promise<{ mergeRequestUrl?: string }> {
    return await ErrorHandler.withErrorHandling(async () => {
      const { projectId, gitlabToken } = settings;
      this.validateComponentTestParameters(projectId, gitlabToken, commitMessage, componentName, testContent);

      // Replace {componentName} placeholder in file path if present
      const normalizedComponentName = this.normalizeComponentName(componentName);

      // Replace all occurrences of {componentName} in the file path
      const filePath = testFilePath.replace(
        /{componentName}/g,
        normalizedComponentName
      );

      // Create component-specific branch name - use dashes instead of slashes to avoid GitLab issues
      const featureBranch = `${branchName}-${normalizedComponentName}`;

      // Get project information
      const projectData = await this.fetchProjectInfo(projectId, gitlabToken, settings);
      const defaultBranch = projectData.default_branch || "main";

      // Create or get feature branch
      await this.createFeatureBranch(
        projectId,
        gitlabToken,
        featureBranch,
        defaultBranch,
        settings
      );

      // Check if file exists and prepare commit
      const { fileData, action } = await this.prepareFileCommit(
        projectId,
        gitlabToken,
        filePath,
        featureBranch,
        settings
      );

      // Create the commit
      await this.createCommit(
        projectId,
        gitlabToken,
        featureBranch,
        commitMessage,
        filePath,
        testContent,
        action,
        fileData && fileData.last_commit_id,
        settings
      );

      // Check for existing merge request
      const existingMR = await this.findExistingMergeRequest(
        projectId,
        gitlabToken,
        featureBranch,
        settings
      );

      if (!existingMR) {
        // Create new merge request if none exists
        const mrDescription = `Automatically created merge request for component test: ${componentName}`;
        const newMR = await this.createMergeRequest(
          projectId,
          gitlabToken,
          featureBranch,
          defaultBranch,
          commitMessage,
          mrDescription,
          true, // Mark as draft for component tests
          settings
        );
        return { mergeRequestUrl: newMR.web_url };
      }

      return { mergeRequestUrl: existingMR.web_url };
    }, {
      operation: 'commit_component_test',
      component: 'GitLabService',
      severity: 'high'
    });
  }

  /**
   * Validate component test parameters
   */
  private static validateComponentTestParameters(
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    componentName: string,
    testContent: string
  ): void {
    if (!projectId || !projectId.trim()) {
      throw new Error('Project ID is required');
    }
    if (!gitlabToken || !gitlabToken.trim()) {
      throw new GitLabAuthError('GitLab token is required');
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

  /**
   * Normalize component name for use in file paths and branch names
   */
  private static normalizeComponentName(componentName: string): string {
    return componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  /**
   * Make API request with proper error handling
   * Uses proxy if domain is not in manifest, otherwise direct connection
   */
  private static async makeAPIRequest(url: string, options: RequestInit): Promise<Response> {
    // Create a timeout promise that rejects after 30 seconds
    const timeoutMs = 30000;
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new GitLabNetworkError('Request timed out - please check your connection to GitLab'));
      }, timeoutMs);
    });

    try {
      // Check if we should use proxy (for custom/self-hosted GitLab instances)
      const useProxy = ProxyService.shouldUseProxy(url);
      
      // Race between the fetch and timeout
      const response = await Promise.race([
        useProxy 
          ? ProxyService.proxyGitLabRequest(url, options)
          : fetch(url, options),
        timeoutPromise
      ]);
      
      // If response is not ok, throw an error with status code
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Try to get more detailed error message from response body
        try {
          const errorData = await response.json() as GitLabError;
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.error_description) {
            errorMessage = errorData.error_description;
          }
        } catch {
          // If we can't parse the error response, use the default message
        }
        
        const error = new GitLabAPIError(errorMessage, response.status);
        error.statusCode = response.status;
        throw error;
      }
      
      return response;
    } catch (error: any) {
      if (error instanceof GitLabAPIError || error instanceof GitLabNetworkError) {
        throw error;
      }
      
      if (error.name === 'TypeError' && error.message.indexOf('fetch') !== -1) {
        throw new GitLabNetworkError('Network error - unable to connect to GitLab API');
      }
      
      throw error;
    }
  }

  /**
   * Handle GitLab API errors with proper error types and messages
   */
  private static handleGitLabError(error: any, operation: string): Error {
    if (error instanceof GitLabAPIError || error instanceof GitLabAuthError || error instanceof GitLabNetworkError) {
      return error;
    }

    // Handle specific HTTP status codes
    if (error.statusCode) {
      switch (error.statusCode) {
        case 401:
        case 403:
          return new GitLabAuthError(`Authentication failed while trying to ${operation}. Please check your GitLab token.`);
        case 404:
          return new GitLabAPIError(`Resource not found while trying to ${operation}. Please check your project ID.`, 404);
        case 422:
          return new GitLabAPIError(`Invalid data provided while trying to ${operation}. Please check your inputs.`, 422);
        case 429:
          return new GitLabAPIError(`Rate limit exceeded while trying to ${operation}. Please try again later.`, 429);
        case 500:
        case 502:
        case 503:
        case 504:
          return new GitLabAPIError(`GitLab server error while trying to ${operation}. Please try again later.`, error.statusCode);
        default:
          return new GitLabAPIError(`GitLab API error while trying to ${operation}: ${error.message || 'Unknown error'}`, error.statusCode);
      }
    }

    // Handle network errors
    if (error.name === 'TypeError' || error.message.indexOf('fetch') !== -1 || error.message.indexOf('network') !== -1) {
      return new GitLabNetworkError(`Network error while trying to ${operation}`);
    }

    // Generic fallback
    return new GitLabAPIError(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
  }

  /**
   * Clears all stored tokens (for security/logout)
   */
  static async clearAllTokens(): Promise<void> {
    try {
      const fileId = figma.root?.id;
      if (!fileId) return;

      const settingsKey = `gitlab-settings-${fileId}`;
      
      // Clear token and encryption keys
      await figma.clientStorage.deleteAsync(`${settingsKey}-token`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-key`);
      await figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);
      
      // Clear personal storage
      await figma.clientStorage.deleteAsync(settingsKey);
      
      // Update shared settings to remove saveToken flag
      const sharedSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
      if (sharedSettings) {
        try {
          const settings = JSON.parse(sharedSettings);
          settings.saveToken = false;
          delete settings.gitlabToken;
          figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(settings));
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      LoggingService.info("All GitLab tokens cleared", LoggingService.CATEGORIES.GITLAB);
    } catch (error) {
      ErrorHandler.handleError(error as Error, {
        operation: 'clear_tokens',
        component: 'GitLabService',
        severity: 'low'
      });
    }
  }

  /**
   * Gets token expiration info (for future implementation)
   */
  static async getTokenInfo(): Promise<{ encrypted: boolean; version: string; hasToken: boolean }> {
    const fileId = figma.root?.id;
    if (!fileId) {
      return { encrypted: false, version: 'none', hasToken: false };
    }

    const settingsKey = `gitlab-settings-${fileId}`;
    const token = await figma.clientStorage.getAsync(`${settingsKey}-token`);
    const cryptoVersion = await figma.clientStorage.getAsync(`${settingsKey}-crypto`);
    
    return {
      hasToken: !!token,
      encrypted: !!token,
      version: cryptoVersion || (token ? 'v1' : 'none')
    };
  }
}

// Export error classes for use in other modules
export { GitLabAPIError, GitLabAuthError, GitLabNetworkError };