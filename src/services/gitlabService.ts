import { GitLabSettings } from '../types';

export class GitLabService {
  private static readonly GITLAB_API_BASE = 'https://gitlab.fhnw.ch/api/v4';

  static async saveSettings(settings: GitLabSettings, shareWithTeam: boolean): Promise<void> {
    try {
      // If user didn't opt to save the token, don't store it
      if (!settings.saveToken) {
        delete settings.gitlabToken;
      }

      // Create project-specific storage key using Figma root node ID (unique per file)
      const figmaFileId = figma.root.id;
      const settingsKey = `gitlab-settings-${figmaFileId}`;

      // Always save to document storage (shared with team for this specific Figma file)
      // This ensures settings are truly per-project and shared with team members
      figma.root.setSharedPluginData(
        "aWallSync",
        settingsKey,
        JSON.stringify(settings)
      );
      console.log(`GitLab settings saved to document storage for file: ${figmaFileId} (shared: ${shareWithTeam})`);

      // Also track who saved the settings
      figma.root.setSharedPluginData(
        "aWallSync",
        `${settingsKey}-meta`,
        JSON.stringify({
          sharedWithTeam: shareWithTeam,
          savedAt: settings.savedAt,
          savedBy: settings.savedBy
        })
      );
    } catch (error: any) {
      console.error("Error saving GitLab settings:", error);
      throw new Error(`Error saving GitLab settings: ${error.message || "Unknown error"}`);
    }
  }

  static async loadSettings(): Promise<GitLabSettings | null> {
    try {
      // Create project-specific storage key using Figma root node ID (unique per file)
      const figmaFileId = figma.root.id;
      const settingsKey = `gitlab-settings-${figmaFileId}`;

      console.log(`Loading GitLab settings for file: ${figmaFileId}`);

      // Load settings from document storage (project-specific and shared with team)
      const documentSettings = figma.root.getSharedPluginData(
        "aWallSync",
        settingsKey
      );
      if (documentSettings) {
        try {
          const settings = JSON.parse(documentSettings);

          // Load metadata if available
          const metaData = figma.root.getSharedPluginData("aWallSync", `${settingsKey}-meta`);
          if (metaData) {
            try {
              const meta = JSON.parse(metaData);
              settings.isPersonal = !meta.sharedWithTeam;
            } catch (metaParseError) {
              console.warn("Error parsing settings metadata:", metaParseError);
            }
          }

          console.log("Loaded settings from document storage");
          return settings;
        } catch (parseError) {
          console.error("Error parsing document settings:", parseError);
        }
      }

      // Migration: Check for legacy document settings (old global settings in this file)
      const legacyDocumentSettings = figma.root.getSharedPluginData("aWallSync", "gitlab-settings");
      if (legacyDocumentSettings) {
        try {
          const settings = JSON.parse(legacyDocumentSettings);
          console.log("Found legacy document settings, migrating to project-specific storage");
          // Save as project-specific settings
          await this.saveSettings(settings, true);
          // Remove old global settings to prevent confusion
          figma.root.setSharedPluginData("aWallSync", "gitlab-settings", "");
          return settings;
        } catch (parseError) {
          console.error("Error parsing legacy document settings:", parseError);
        }
      }

      console.log("No settings found for this project");
      return null;
    } catch (error) {
      console.error("Error loading GitLab settings:", error);
      return null;
    }
  }

  static async commitToGitLab(
    projectId: string,
    gitlabToken: string,
    commitMessage: string,
    filePath: string,
    cssData: string,
    branchName: string = "feature/variables"
  ): Promise<{ mergeRequestUrl?: string }> {
    const featureBranch = branchName;

    // Get project information
    const projectData = await this.fetchProjectInfo(projectId, gitlabToken);
    const defaultBranch = projectData.default_branch;

    // Create or get feature branch
    await this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch);

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
      fileData?.last_commit_id
    );

    // Check for existing merge request
    const existingMR = await this.findExistingMergeRequest(projectId, gitlabToken, featureBranch);
    
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
  }

  private static async fetchProjectInfo(projectId: string, gitlabToken: string) {
    const projectUrl = `${this.GITLAB_API_BASE}/projects/${projectId}`;
    const response = await fetch(projectUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch project information");
    }

    return await response.json();
  }

  private static async createFeatureBranch(
    projectId: string,
    gitlabToken: string,
    featureBranch: string,
    defaultBranch: string
  ) {
    const createBranchUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/branches`;
    const response = await fetch(createBranchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify({
        branch: featureBranch,
        ref: defaultBranch,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      // If branch already exists, that's fine - we'll use it
      if (errorData.message !== "Branch already exists") {
        throw new Error(errorData.message || "Failed to create branch");
      }
    }
  }

  private static async prepareFileCommit(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    featureBranch: string
  ) {
    const checkFileUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${featureBranch}`;
    const response = await fetch(checkFileUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    const fileExists = response.ok;
    let fileData = null;
    let action = "create";

    if (fileExists) {
      fileData = await response.json();
      action = "update";
    }

    return { fileData, action };
  }

  private static async createCommit(
    projectId: string,
    gitlabToken: string,
    featureBranch: string,
    commitMessage: string,
    filePath: string,
    cssData: string,
    action: string,
    lastCommitId?: string
  ) {
    const commitUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/commits`;
    const commitAction = {
      action,
      file_path: filePath,
      content: cssData,
      encoding: "text",
      ...(lastCommitId && { last_commit_id: lastCommitId }),
    };

    const response = await fetch(commitUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify({
        branch: featureBranch,
        commit_message: commitMessage,
        actions: [commitAction],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to commit to GitLab");
    }
  }

  private static async findExistingMergeRequest(
    projectId: string,
    gitlabToken: string,
    sourceBranch: string
  ): Promise<any> {
    const mrUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/merge_requests?source_branch=${sourceBranch}&state=opened`;
    const response = await fetch(mrUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch merge requests");
    }

    const mergeRequests = await response.json();
    return mergeRequests.length > 0 ? mergeRequests[0] : null;
  }

  private static async createMergeRequest(
    projectId: string,
    gitlabToken: string,
    sourceBranch: string,
    targetBranch: string,
    title: string
  ): Promise<any> {
    const mrUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/merge_requests`;
    const response = await fetch(mrUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify({
        source_branch: sourceBranch,
        target_branch: targetBranch,
        title: title,
        description: "Automatically created merge request for CSS variables update",
        remove_source_branch: true,
        squash: true
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create merge request");
    }

    return await response.json();
  }
} 