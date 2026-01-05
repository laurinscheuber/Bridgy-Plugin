/**
 * Adapter to make GitLabService compatible with BaseGitService interface
 * This allows gradual migration without breaking existing code
 */

import { BaseGitService } from './baseGitService';
import { GitSettings, GitProject, GitFile, GitCommit, GitPullRequest } from '../types/git';
import { GitLabSettings } from '../types';
import { GitLabService } from './gitlabService';

export class GitLabServiceAdapter implements BaseGitService {
  /**
   * Convert GitSettings to GitLabSettings
   */
  private toGitLabSettings(settings: GitSettings): GitLabSettings {
    return {
      gitlabUrl: settings.baseUrl,
      projectId: settings.projectId,
      gitlabToken: settings.token,
      filePath: settings.filePath,
      testFilePath: settings.testFilePath,
      strategy: settings.strategy,
      branchName: settings.branchName,
      testBranchName: settings.testBranchName,
      exportFormat: settings.exportFormat,
      saveToken: settings.saveToken,
      savedAt: settings.savedAt,
      savedBy: settings.savedBy,
      isPersonal: settings.isPersonal,
      _needsCryptoMigration: settings._needsCryptoMigration,
    };
  }

  /**
   * Convert GitLabSettings to GitSettings
   */
  private fromGitLabSettings(settings: GitLabSettings | null): GitSettings | null {
    if (!settings) return null;

    return {
      provider: 'gitlab',
      baseUrl: settings.gitlabUrl,
      projectId: settings.projectId,
      token: settings.gitlabToken,
      filePath: settings.filePath,
      testFilePath: settings.testFilePath,
      strategy: settings.strategy,
      branchName: settings.branchName,
      testBranchName: settings.testBranchName,
      exportFormat: settings.exportFormat,
      saveToken: settings.saveToken,
      savedAt: settings.savedAt,
      savedBy: settings.savedBy,
      isPersonal: settings.isPersonal,
      _needsCryptoMigration: settings._needsCryptoMigration,
    };
  }

  async saveSettings(settings: GitSettings, shareWithTeam: boolean): Promise<void> {
    const gitlabSettings = this.toGitLabSettings(settings);
    await GitLabService.saveSettings(gitlabSettings, shareWithTeam);
  }

  async loadSettings(): Promise<GitSettings | null> {
    const gitlabSettings = await GitLabService.loadSettings();
    return this.fromGitLabSettings(gitlabSettings);
  }

  async resetSettings(): Promise<void> {
    await GitLabService.resetSettings();
  }

  async validateCredentials(settings: GitSettings): Promise<boolean> {
    try {
      // Try to fetch project info to validate credentials
      await this.getProject(settings);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getProject(settings: GitSettings): Promise<GitProject> {
    const gitlabSettings = this.toGitLabSettings(settings);

    // Use private method access via prototype
    const projectData = await (GitLabService as any).fetchProjectInfo(
      settings.projectId,
      settings.token!,
      gitlabSettings,
    );

    return {
      id: projectData.id,
      name: projectData.name,
      defaultBranch: projectData.default_branch,
      webUrl: projectData.web_url,
    };
  }

  async listRepositories(settings: GitSettings): Promise<GitProject[]> {
    // GitLab doesn't have a simple list repos endpoint like GitHub
    // Would need to implement project listing
    throw new Error('List repositories not yet implemented for GitLab');
  }

  async createBranch(settings: GitSettings, branchName: string, baseBranch: string): Promise<void> {
    const gitlabSettings = this.toGitLabSettings(settings);
    await (GitLabService as any).createFeatureBranch(
      settings.projectId,
      settings.token!,
      branchName,
      baseBranch,
      gitlabSettings,
    );
  }

  async getFile(settings: GitSettings, filePath: string, branch: string): Promise<GitFile | null> {
    const gitlabSettings = this.toGitLabSettings(settings);
    const result = await (GitLabService as any).prepareFileCommit(
      settings.projectId,
      settings.token!,
      filePath,
      branch,
      gitlabSettings,
    );

    if (!result.fileData) return null;

    return {
      fileName: result.fileData.file_name,
      filePath: result.fileData.file_path,
      size: result.fileData.size,
      encoding: result.fileData.encoding,
      content: result.fileData.content,
      lastCommitId: result.fileData.last_commit_id,
    };
  }

  async commitFile(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    content: string,
    branch: string,
  ): Promise<GitCommit> {
    const gitlabSettings = this.toGitLabSettings(settings);

    // Check if file exists
    const { fileData, action } = await (GitLabService as any).prepareFileCommit(
      settings.projectId,
      settings.token!,
      filePath,
      branch,
      gitlabSettings,
    );

    const commit = await (GitLabService as any).createCommit(
      settings.projectId,
      settings.token!,
      branch,
      commitMessage,
      filePath,
      content,
      action,
      fileData?.last_commit_id,
      gitlabSettings,
    );

    return {
      id: commit.id,
      title: commit.title,
      message: commit.message,
      webUrl: commit.web_url,
    };
  }

  async createPullRequest(
    settings: GitSettings,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string,
    isDraft: boolean = false,
  ): Promise<GitPullRequest> {
    const gitlabSettings = this.toGitLabSettings(settings);
    const mr = await (GitLabService as any).createMergeRequest(
      settings.projectId,
      settings.token!,
      sourceBranch,
      targetBranch,
      title,
      description,
      isDraft,
      gitlabSettings,
    );

    return {
      id: mr.id,
      title: mr.title,
      description: mr.description,
      state: mr.state === 'opened' ? 'open' : mr.state,
      webUrl: mr.web_url,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
      draft: isDraft,
    };
  }

  async findExistingPullRequest(
    settings: GitSettings,
    sourceBranch: string,
  ): Promise<GitPullRequest | null> {
    const gitlabSettings = this.toGitLabSettings(settings);
    const mr = await (GitLabService as any).findExistingMergeRequest(
      settings.projectId,
      settings.token!,
      sourceBranch,
      gitlabSettings,
    );

    if (!mr) return null;

    return {
      id: mr.id,
      title: mr.title,
      description: mr.description,
      state: mr.state === 'opened' ? 'open' : mr.state,
      webUrl: mr.web_url,
      sourceBranch: mr.source_branch,
      targetBranch: mr.target_branch,
    };
  }

  async commitWorkflow(
    settings: GitSettings,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string,
  ): Promise<{ pullRequestUrl?: string }> {
    const gitlabSettings = this.toGitLabSettings(settings);

    const result = await GitLabService.commitToGitLab(
      gitlabSettings,
      commitMessage,
      filePath,
      cssData,
      branchName,
    );

    return {
      pullRequestUrl: result.mergeRequestUrl,
    };
  }

  async commitComponentTest(
    settings: GitSettings,
    commitMessage: string,
    componentName: string,
    testContent: string,
    testFilePath: string,
    branchName: string,
  ): Promise<{ pullRequestUrl?: string }> {
    const gitlabSettings = this.toGitLabSettings(settings);

    const result = await GitLabService.commitComponentTest(
      gitlabSettings,
      commitMessage,
      componentName,
      testContent,
      testFilePath,
      branchName,
    );

    return {
      pullRequestUrl: result.mergeRequestUrl,
    };
  }

  async clearAllTokens(): Promise<void> {
    await GitLabService.clearAllTokens();
  }

  async getTokenInfo(): Promise<{
    encrypted: boolean;
    version: string;
    hasToken: boolean;
  }> {
    return await GitLabService.getTokenInfo();
  }
}
