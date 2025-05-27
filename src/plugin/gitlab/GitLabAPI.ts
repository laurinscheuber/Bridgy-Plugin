import { GitLabCommitOptions } from '../../shared/types';
import { GITLAB_API_BASE } from '../../shared/constants';

/**
 * GitLab API integration
 */
export class GitLabAPI {
  /**
   * Commits content to GitLab repository
   */
  static async commitFile(options: GitLabCommitOptions): Promise<void> {
    const {
      projectId,
      gitlabToken,
      commitMessage,
      filePath,
      branchName = "main",
      content
    } = options;

    // Construct the GitLab API URL
    const gitlabApiUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/commits`;

    // First, check if the file exists
    const fileExists = await this.checkFileExists(projectId, gitlabToken, filePath, branchName);
    
    // Prepare the commit action
    const commitAction: any = {
      action: fileExists ? "update" : "create",
      file_path: filePath,
      content: content,
      encoding: "text"
    };

    // For file updates, get the last commit ID for proper versioning
    if (fileExists) {
      const fileData = await this.getFileInfo(projectId, gitlabToken, filePath, branchName);
      if (fileData && fileData.last_commit_id) {
        commitAction.last_commit_id = fileData.last_commit_id;
      }
    }

    const commitData = {
      branch: branchName,
      commit_message: commitMessage,
      actions: [commitAction],
    };

    // Make the API request to GitLab
    const response = await fetch(gitlabApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PRIVATE-TOKEN": gitlabToken,
      },
      body: JSON.stringify(commitData),
    });

    if (!response.ok) {
      const errorData = await response.json();

      // Enhanced error handling for common GitLab issues
      if (response.status === 403) {
        throw new Error(`403 Forbidden - You are not allowed to push into branch '${branchName}'. This could be due to:\n\n1. Insufficient token permissions\n2. Branch protection rules\n3. Repository access restrictions\n\nPlease check:\n- Your GitLab token has 'write_repository' scope\n- You have Developer/Maintainer role on the project\n- The branch '${branchName}' allows pushes`);
      } else if (response.status === 401) {
        throw new Error("401 Unauthorized - Invalid or expired GitLab token. Please check your token in the Configuration tab.");
      } else if (response.status === 404) {
        throw new Error(`404 Not Found - Project ID '${projectId}' not found. Please verify the project ID in the Configuration tab.`);
      }

      throw new Error(errorData.message || `Failed to commit to GitLab (${response.status})`);
    }
  }

  /**
   * Commits a test file to GitLab with progress updates
   */
  static async commitTestFile(
    options: GitLabCommitOptions,
    progressCallback?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      progressCallback?.(10, "Preparing to commit test file...");

      const {
        projectId,
        gitlabToken,
        commitMessage,
        filePath,
        branchName = "main",
        content
      } = options;

      // Construct the GitLab API URL
      const gitlabApiUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/commits`;

      progressCallback?.(20, "Checking if file exists...");

      // Check if the file exists
      const fileExists = await this.checkFileExists(projectId, gitlabToken, filePath, branchName);
      
      progressCallback?.(40, fileExists ? "Updating existing test file..." : "Creating new test file...");

      // Prepare the commit action
      const commitAction: any = {
        action: fileExists ? "update" : "create",
        file_path: filePath,
        content: content,
        encoding: "text"
      };

      // For file updates, get the last commit ID
      if (fileExists) {
        const fileData = await this.getFileInfo(projectId, gitlabToken, filePath, branchName);
        if (fileData && fileData.last_commit_id) {
          commitAction.last_commit_id = fileData.last_commit_id;
        }
      }

      const commitData = {
        branch: branchName,
        commit_message: commitMessage,
        actions: [commitAction],
      };

      progressCallback?.(70, "Committing to GitLab...");

      // Make the API request to GitLab
      const response = await fetch(gitlabApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "PRIVATE-TOKEN": gitlabToken,
        },
        body: JSON.stringify(commitData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Enhanced error handling for common GitLab issues
        if (response.status === 403) {
          throw new Error(`403 Forbidden - You are not allowed to push into branch '${branchName}'. This could be due to:\n\n1. Insufficient token permissions\n2. Branch protection rules\n3. Repository access restrictions\n\nPlease check:\n- Your GitLab token has 'write_repository' scope\n- You have Developer/Maintainer role on the project\n- The branch '${branchName}' allows pushes`);
        } else if (response.status === 401) {
          throw new Error("401 Unauthorized - Invalid or expired GitLab token. Please check your token in the Configuration tab.");
        } else if (response.status === 404) {
          throw new Error(`404 Not Found - Project ID '${projectId}' not found. Please verify the project ID in the Configuration tab.`);
        }

        throw new Error(errorData.message || `Failed to commit test to GitLab (${response.status})`);
      }

      progressCallback?.(100, "Test file committed successfully!");
    } catch (error) {
      throw error;
    }
  }

  /**
   * Checks if a file exists in the repository
   */
  private static async checkFileExists(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    branchName: string
  ): Promise<boolean> {
    const checkFileUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${branchName}`;
    
    const checkResponse = await fetch(checkFileUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    return checkResponse.ok;
  }

  /**
   * Gets file information from the repository
   */
  private static async getFileInfo(
    projectId: string,
    gitlabToken: string,
    filePath: string,
    branchName: string
  ): Promise<any> {
    const checkFileUrl = `${GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${branchName}`;
    
    const response = await fetch(checkFileUrl, {
      method: "GET",
      headers: {
        "PRIVATE-TOKEN": gitlabToken,
      },
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  }
}