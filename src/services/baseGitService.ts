/**
 * Base interface for Git service implementations (GitLab, GitHub, etc.)
 * Provides a common API for all Git operations
 */

import { GitSettings, GitProject, GitFile, GitCommit, GitPullRequest } from "../types/git";

export interface BaseGitService {
  /**
   * Save settings to Figma storage
   */
  saveSettings(settings: GitSettings, shareWithTeam: boolean): Promise<void>;

  /**
   * Load settings from Figma storage
   */
  loadSettings(): Promise<GitSettings | null>;

  /**
   * Reset all settings
   */
  resetSettings(): Promise<void>;

  /**
   * Validate that the provided credentials work
   */
  validateCredentials(settings: GitSettings): Promise<boolean>;

  /**
   * Get project/repository information
   */
  getProject(settings: GitSettings): Promise<GitProject>;

  /**
   * List repositories accessible to the user
   */
  listRepositories(settings: GitSettings): Promise<GitProject[]>;

  /**
   * Create a new branch
   */
  createBranch(
    settings: GitSettings,
    branchName: string,
    baseBranch: string
  ): Promise<void>;

  /**
   * Get file content from repository
   */
  getFile(
    settings: GitSettings,
    filePath: string,
    branch: string
  ): Promise<GitFile | null>;

  /**
   * Commit file to repository
   */
  commitFile(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    content: string,
    branch: string
  ): Promise<GitCommit>;

  /**
   * Create a pull/merge request
   */
  createPullRequest(
    settings: GitSettings,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    isDraft?: boolean
  ): Promise<GitPullRequest>;

  /**
   * Find existing pull/merge request
   */
  findExistingPullRequest(
    settings: GitSettings,
    sourceBranch: string
  ): Promise<GitPullRequest | null>;

  /**
   * Commit CSS data with full workflow (branch, commit, PR)
   */
  commitWorkflow(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string
  ): Promise<{ pullRequestUrl?: string }>;

  /**
   * Commit component test with full workflow
   */
  commitComponentTest(
    settings: GitSettings,
    commitMessage: string,
    componentName: string,
    testContent: string,
    testFilePath: string,
    branchName: string
  ): Promise<{ pullRequestUrl?: string }>;

  /**
   * Clear all stored tokens (for security/logout)
   */
  clearAllTokens(): Promise<void>;

  /**
   * Get token info (encryption status, etc.)
   */
  getTokenInfo(): Promise<{
    encrypted: boolean;
    version: string;
    hasToken: boolean;
  }>;
}

/**
 * Base error class for Git service errors
 */
export class GitServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitServiceError';
  }
}

export class GitAuthError extends GitServiceError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
    this.name = 'GitAuthError';
  }
}

export class GitNetworkError extends GitServiceError {
  constructor(message: string = 'Network error') {
    super(message);
    this.name = 'GitNetworkError';
  }
}