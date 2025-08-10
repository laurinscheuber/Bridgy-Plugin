import { GitLabSettings } from "../types";
import { API_CONFIG, GIT_CONFIG, ERROR_MESSAGES, LoggingService } from "../config";

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
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitLabAPIError';
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
  private static readonly GITLAB_API_BASE = API_CONFIG.GITLAB_BASE_URL;
  private static readonly DEFAULT_HEADERS = API_CONFIG.DEFAULT_HEADERS;

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
          "DesignSync",
          settingsKey,
          JSON.stringify(settingsToSave)
        );

        // If token should be saved, also save it personally for this user
        if (settings.saveToken && settings.gitlabToken) {
          await figma.clientStorage.setAsync(
            `${settingsKey}-token`,
            settings.gitlabToken
          );
        }
      }

      // Track metadata
      figma.root.setSharedPluginData(
        "DesignSync",
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
    const documentSettings = figma.root.getSharedPluginData("DesignSync", settingsKey);
    if (!documentSettings) return null;

    try {
      const settings = JSON.parse(documentSettings);

      // Try to load personal token if settings indicate it should be saved
      if (settings.saveToken && !settings.gitlabToken) {
        const personalToken = await figma.clientStorage.getAsync(`${settingsKey}-token`);
        if (personalToken) {
          settings.gitlabToken = personalToken;
        }
      }

      // Load metadata if available
      const metaData = figma.root.getSharedPluginData("DesignSync", `${settingsKey}-meta`);
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
    const legacyDocumentSettings = figma.root.getSharedPluginData("DesignSync", "gitlab-settings");
    if (!legacyDocumentSettings) return null;

    try {
      const settings = JSON.parse(legacyDocumentSettings);
      // Save as project-specific settings
      await this.saveSettings(settings, true);
      // Remove old global settings to prevent confusion
      figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
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
      figma.root.setSharedPluginData("DesignSync", settingsKey, "");
      figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");

      // Remove personal client storage
      await figma.clientStorage.deleteAsync(settingsKey);
      await figma.clientStorage.deleteAsync(`${settingsKey}-token`);

      // Also remove any legacy global settings (cleanup)
      figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
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
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string = DEFAULT_BRANCH_NAME
  ): Promise<{ mergeRequestUrl?: string }> {
    this.validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData);

    try {
      const featureBranch = branchName;

      // Get project information
      const projectData = await this.fetchProjectInfo(projectId, gitlabToken);
      const defaultBranch = projectData.default_branch;

      // Create or get feature branch
      await this.createFeatureBranch(
        projectId,
        gitlabToken,
        featureBranch,
        defaultBranch
      );

      // Check if file exists and prepare commit
      const { fileData, action } = await this.prepareFileCommit(
        projectId,
        gitlabToken,
        filePath,
        featureBranch
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
        fileData && fileData.last_commit_id
      );

      // Check for existing merge request
      const existingMR = await this.findExistingMergeRequest(
        projectId,
        gitlabToken,
        featureBranch
      );

      if (!existingMR) {
        // Create new merge request if none exists
        const newMR = await this.createMergeRequest(
          projectId,
          gitlabToken,
          featureBranch,
          defaultBranch,
          commitMessage
        );
        return { mergeRequestUrl: newMR.web_url };
      }

      return { mergeRequestUrl: existingMR.web_url };
    } catch (error: any) {
      LoggingService.error('Error committing to GitLab', error, LoggingService.CATEGORIES.GITLAB);
      throw this.handleGitLabError(error, 'commit to GitLab');
    }
  }

  /**
   * Validate commit parameters
   */
  private static validateCommitParameters(
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    filePath: string,
    cssData: string
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
    if (!filePath || !filePath.trim()) {
      throw new Error('File path is required');
    }
    if (!cssData || !cssData.trim()) {
      throw new Error('CSS data is required');
    }
  }

  /**
   * Fetch project information from GitLab API
   */
  private static async fetchProjectInfo(
    projectId: string,
    gitlabToken: string
  ): Promise<GitLabProject> {
    const projectUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}`;
    
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
    defaultBranch: string
  ): Promise<void> {
    const createBranchUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/branches`;
    
    try {
      const response = await this.makeAPIRequest(createBranchUrl, {
        method: "POST",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
        body: JSON.stringify({
          branch: featureBranch,
          ref: defaultBranch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as GitLabError;
        // If branch already exists, that's fine - we'll use it
        if (errorData.message !== "Branch already exists") {
          throw new GitLabAPIError(
            `Failed to create branch '${featureBranch}': ${errorData.message || "Unknown error"}`,
            response.status,
            errorData
          );
        }
      }
    } catch (error: any) {
      if (error instanceof GitLabAPIError) {
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
    featureBranch: string
  ): Promise<{ fileData: GitLabFile | null; action: 'create' | 'update' }> {
    const checkFileUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(featureBranch)}`;
    
    try {
      const response = await this.makeAPIRequest(checkFileUrl, {
        method: "GET",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
      });

      const fileExists = response.ok;
      let fileData: GitLabFile | null = null;
      let action: 'create' | 'update' = "create";

      if (fileExists) {
        fileData = await response.json() as GitLabFile;
        action = "update";
      }

      return { fileData, action };
    } catch (error: any) {
      // If file doesn't exist (404), that's fine - we'll create it
      if (error.statusCode === 404) {
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
    lastCommitId?: string
  ): Promise<GitLabCommit> {
    const commitUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/commits`;
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

      if (!response.ok) {
        const errorData = await response.json() as GitLabError;
        throw new GitLabAPIError(
          errorData.message || "Failed to commit to GitLab",
          response.status,
          errorData
        );
      }

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
    sourceBranch: string
  ): Promise<GitLabMergeRequest | null> {
    const mrUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/merge_requests?source_branch=${encodeURIComponent(sourceBranch)}&state=opened`;
    
    try {
      const response = await this.makeAPIRequest(mrUrl, {
        method: "GET",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
      });

      if (!response.ok) {
        throw new GitLabAPIError(
          "Failed to fetch merge requests",
          response.status
        );
      }

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
    description: string = "Automatically created merge request for CSS variables update"
  ): Promise<GitLabMergeRequest> {
    const mrUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/merge_requests`;
    
    try {
      const response = await this.makeAPIRequest(mrUrl, {
        method: "POST",
        headers: Object.assign({
          "PRIVATE-TOKEN": gitlabToken
        }, this.DEFAULT_HEADERS),
        body: JSON.stringify({
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title: title,
          description: description,
          remove_source_branch: true,
          squash: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as GitLabError;
        throw new GitLabAPIError(
          errorData.message || "Failed to create merge request",
          response.status,
          errorData
        );
      }

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
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    componentName: string,
    testContent: string,
    testFilePath: string = "components/{componentName}.spec.ts",
    branchName: string = DEFAULT_TEST_BRANCH_NAME
  ): Promise<{ mergeRequestUrl?: string }> {
    this.validateComponentTestParameters(projectId, gitlabToken, commitMessage, componentName, testContent);

    try {
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
      const projectData = await this.fetchProjectInfo(projectId, gitlabToken);
      const defaultBranch = projectData.default_branch || "main";

      // Create or get feature branch
      await this.createFeatureBranch(
        projectId,
        gitlabToken,
        featureBranch,
        defaultBranch
      );

      // Check if file exists and prepare commit
      const { fileData, action } = await this.prepareFileCommit(
        projectId,
        gitlabToken,
        filePath,
        featureBranch
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
        fileData && fileData.last_commit_id
      );

      // Check for existing merge request
      const existingMR = await this.findExistingMergeRequest(
        projectId,
        gitlabToken,
        featureBranch
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
          mrDescription
        );
        return { mergeRequestUrl: newMR.web_url };
      }

      return { mergeRequestUrl: existingMR.web_url };
    } catch (error: any) {
      LoggingService.error('Error committing component test', error, LoggingService.CATEGORIES.GITLAB);
      throw this.handleGitLabError(error, 'commit component test');
    }
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
   */
  private static async makeAPIRequest(url: string, options: RequestInit): Promise<Response> {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
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
}

// Export error classes for use in other modules
export { GitLabAPIError, GitLabAuthError, GitLabNetworkError };