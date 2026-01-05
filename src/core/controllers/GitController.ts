import { GitSettings } from "../../types/git";
import { GitServiceFactory } from "../../services/gitServiceFactory";
import { GitLabService } from "../../services/gitlabService";
import { SUCCESS_MESSAGES } from "../../config";
import { ComponentService } from "../../services/componentService";

export class GitController {
  static async loadSavedGitSettings() {
    try {
      // Try new format first
      const gitService = await GitServiceFactory.getServiceFromSettings();
      if (gitService) {
        const settings = await gitService.loadSettings();
        if (settings) {
          figma.ui.postMessage({
            type: "git-settings-loaded",
            settings: settings,
          });
          return;
        }
      }

      // Fallback to old GitLab settings for backward compatibility
      const gitlabSettings = await GitLabService.loadSettings();
      if (gitlabSettings) {
        figma.ui.postMessage({
          type: "gitlab-settings-loaded",
          settings: gitlabSettings,
        });
      }
    } catch (error) {
      console.error("Error loading Git settings:", error);
      // Silently fail - we'll just prompt the user for settings
    }
  }

  static async saveGitSettings(msg: any) {
    const gitService = GitServiceFactory.getService(msg.provider || 'gitlab');

    const gitSettings: GitSettings = {
      provider: msg.provider || 'gitlab',
      baseUrl: msg.baseUrl,
      projectId: msg.projectId || "",
      token: msg.token,
      filePath: msg.filePath || "src/variables.css",
      testFilePath: msg.testFilePath || "components/{componentName}.spec.ts",
      strategy: msg.strategy || "merge-request",
      branchName: msg.branchName || "feature/variables",
      testBranchName: msg.testBranchName || "feature/component-tests",
      exportFormat: msg.exportFormat || "css",
      saveToken: msg.saveToken || false,
      savedAt: new Date().toISOString(),
      savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
    };

    if (typeof gitService.saveSettings !== 'function') {
       console.error('CRITICAL: gitService.saveSettings is not a function!', gitService);
       throw new Error(`Internal Error: Service for ${msg.provider} is not initialized correctly.`);
    }

    await gitService.saveSettings(gitSettings, msg.shareWithTeam || false);

    figma.ui.postMessage({
      type: "git-settings-saved",
      success: true,
      sharedWithTeam: msg.shareWithTeam,
      savedAt: gitSettings.savedAt,
      savedBy: gitSettings.savedBy
    });
  }

  static async commitToRepo(msg: any) {
    if (
      !msg.projectId ||
      (!msg.token && !msg.gitlabToken) ||
      !msg.commitMessage ||
      !msg.cssData
    ) {
      throw new Error("Missing required fields for commit");
    }

    try {
      // Determine provider and service
      const provider = msg.provider || 'gitlab';
      const gitService = GitServiceFactory.getService(provider);

      const settings: GitSettings = {
        provider: provider,
        baseUrl: msg.baseUrl || '',
        projectId: msg.projectId,
        token: msg.token || msg.gitlabToken, // Accept either
        filePath: msg.filePath || "src/variables.css",
        testFilePath: "components/{componentName}.spec.ts",
        strategy: "merge-request",
        branchName: msg.branchName || "feature/variables",
        testBranchName: "feature/component-tests",
        exportFormat: "css",
        saveToken: false,
        savedAt: new Date().toISOString(),
        savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
      };

      const result = await gitService.commitWorkflow(
        settings,
        msg.commitMessage,
        msg.filePath || "src/variables.css",
        msg.cssData,
        msg.branchName || "feature/variables"
      );

      figma.ui.postMessage({
        type: "commit-success",
        message: SUCCESS_MESSAGES.COMMIT_SUCCESS,
        mergeRequestUrl: result && result.pullRequestUrl,
      });
    } catch (error: any) {
         // Send specific error information to UI
      let errorMessage = "Unknown error occurred";
      let errorType = "unknown";

      if (error.name === 'GitAuthError' || error.name === 'GitLabAuthError') {
        errorType = "auth";
        errorMessage = "Authentication failed. Please check your token and permissions.";
      } else if (error.name === 'GitNetworkError' || error.name === 'GitLabNetworkError') {
        errorType = "network";
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error.name === 'GitServiceError' || error.name === 'GitLabAPIError') {
         if (error.statusCode === 401 || error.statusCode === 403) {
          errorType = "auth";
          errorMessage = "Authentication failed. Please check your token and permissions.";
        } else {
          errorType = "api";
          if (error.statusCode === 404) {
            errorMessage = "Project/Repository not found. Please check your ID.";
          } else if (error.statusCode === 422) {
            errorMessage = "Invalid data provided. Please check your settings.";
          } else if (error.statusCode === 429) {
            errorMessage = "Rate limit exceeded. Please try again later.";
          } else {
            errorMessage = error.message || "Git API error occurred.";
          }
        }
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      figma.ui.postMessage({
        type: "commit-error",
        error: errorMessage,
        errorType: errorType,
        statusCode: error.statusCode,
      });
    }
  }

  static async generateTest(msg: { componentId: string; componentName?: string; includeStateTests?: boolean; forCommit?: boolean }) {
    if (!msg.componentId) {
      throw new Error(`Missing required component ID`);
    }

    const component = ComponentService.getComponentById(msg.componentId);
    if (!component) {
      throw new Error(`Component with ID ${msg.componentId} not found`);
    }

    // Load component details lazily if not already loaded
    await ComponentService.loadComponentDetails(msg.componentId);

    const testContent = ComponentService.generateTest(
      component,
      msg.includeStateTests !== false // Default to true
    );
    figma.ui.postMessage({
      type: "test-generated",
      componentName: msg.componentName || component.name,
      testContent: testContent,
      isComponentSet: component.type === "COMPONENT_SET",
      forCommit: msg.forCommit,
    });
  }

  static async commitComponentTest(msg: any) {
    if (
      !msg.projectId ||
      (!msg.token && !msg.gitlabToken) ||
      !msg.commitMessage ||
      !msg.testContent ||
      !msg.componentName
    ) {
      throw new Error("Missing required fields for component test commit");
    }

    try {
      const provider = msg.provider || 'gitlab';
      const gitService = GitServiceFactory.getService(provider);

      const settings: GitSettings = {
        provider: provider,
        baseUrl: msg.baseUrl || '',
        projectId: msg.projectId,
        token: msg.token || msg.gitlabToken,
        filePath: "variables.css", // Default value
        testFilePath: msg.testFilePath || "components/{componentName}.spec.ts",
        strategy: "merge-request", // Default value
        branchName: "feature/variables", // Default value
        testBranchName: msg.branchName || "feature/component-tests",
        exportFormat: "css", // Default value
        saveToken: false, // Default value
        savedAt: new Date().toISOString(),
        savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
      };

      const testResult = await gitService.commitComponentTest(
        settings,
        msg.commitMessage,
        msg.componentName,
        msg.testContent,
        msg.testFilePath ||
          "components/{componentName}.spec.ts",
        msg.branchName || "feature/component-tests"
      );

      figma.ui.postMessage({
        type: "test-commit-success",
        message: SUCCESS_MESSAGES.TEST_COMMIT_SUCCESS,
        componentName: msg.componentName,
        mergeRequestUrl: testResult && testResult.pullRequestUrl,
      });
    } catch (error: any) {
      // Send specific error information to UI
      let errorMessage = "Unknown error occurred";
      let errorType = "unknown";

      if (error.name === 'GitLabAuthError') {
        errorType = "auth";
        errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
      } else if (error.name === 'GitLabNetworkError') {
        errorType = "network";
        errorMessage = "Network error. Please check your internet connection and GitLab server availability.";
      } else if (error.name === 'GitLabAPIError') {
        if (error.statusCode === 401 || error.statusCode === 403) {
          errorType = "auth";
          errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
        } else {
          errorType = "api";
          if (error.statusCode === 404) {
            errorMessage = "Project not found. Please check your project ID.";
          } else if (error.statusCode === 422) {
            errorMessage = "Invalid data provided. Please check your settings and try again.";
          } else if (error.statusCode === 429) {
            errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
          } else {
            errorMessage = error.message || "GitLab API error occurred.";
          }
        }
      } else {
        errorMessage = error.message || "Unknown error occurred";
      }

      figma.ui.postMessage({
        type: "test-commit-error",
        error: errorMessage,
        errorType: errorType,
        componentName: msg.componentName,
        statusCode: error.statusCode,
      });
    }
  }
}
