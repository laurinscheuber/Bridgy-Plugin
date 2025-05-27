// Main plugin entry point
import { VariableCollector } from './collectors/VariableCollector';
import { ComponentCollector } from './collectors/ComponentCollector';
import { CSSGenerator } from './generators/CSSGenerator';
import { TestGenerator } from './generators/TestGenerator';
import { GitLabAPI } from './gitlab/GitLabAPI';
import { SettingsManager } from './storage/SettingsManager';
import { MESSAGE_TYPES, DEFAULT_PATHS } from '../shared/constants';
import { PluginMessage, TestGenerationOptions, GitLabCommitOptions } from '../shared/types';
import { createFeatureBranchName } from '../shared/utils';

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

/**
 * Main plugin initialization
 */
async function initializePlugin() {
  try {
    // Collect all data from the document
    const [variablesData, componentsData] = await Promise.all([
      VariableCollector.collectAll(),
      ComponentCollector.collectAll()
    ]);

    // Send the data to the UI
    figma.ui.postMessage({
      type: MESSAGE_TYPES.DOCUMENT_DATA,
      variablesData,
      componentsData,
    });

    // Load saved GitLab settings
    const settings = await SettingsManager.loadGitLabSettings();
    if (settings) {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.GITLAB_SETTINGS_LOADED,
        settings: settings,
      });
    }
  } catch (error) {
    console.error("Plugin initialization error:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Initialization error: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles CSS export requests
 */
async function handleCSSExport(msg: PluginMessage) {
  try {
    const variablesData = await VariableCollector.collectAll();
    const cssContent = await CSSGenerator.generate(variablesData);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.CSS_EXPORT,
      cssData: cssContent,
      shouldDownload: msg.shouldDownload
    });
  } catch (error) {
    console.error("Error exporting CSS:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error exporting CSS: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles test generation requests
 */
async function handleTestGeneration(msg: TestGenerationOptions) {
  try {
    const component = ComponentCollector.getComponent(msg.componentId);
    if (!component) {
      throw new Error(`Component with ID ${msg.componentId} not found`);
    }

    const testContent = TestGenerator.generate(component, msg.generateAllVariants);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.TEST_GENERATED,
      componentName: msg.componentName || component.name,
      testContent: testContent,
      commitToGitLab: msg.commitToGitLab,
      isComponentSet: component.type === "COMPONENT_SET",
      hasAllVariants: msg.generateAllVariants,
    });
  } catch (error) {
    console.error("Error generating test:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error generating test: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles GitLab settings save requests
 */
async function handleSaveGitLabSettings(msg: PluginMessage) {
  try {
    const settings = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      saveToken: msg.saveToken || false,
      branchName: msg.branchName || "main",
      filePath: msg.filePath || DEFAULT_PATHS.CSS_VARIABLES,
      testPath: msg.testPath || DEFAULT_PATHS.TEST_FILES,
      componentTestPath: msg.componentTestPath || DEFAULT_PATHS.COMPONENT_TESTS,
      createMergeRequest: msg.createMergeRequest || false,
      branchStrategy: msg.branchStrategy || "default",
      featurePrefix: msg.featurePrefix || "feature/",
    };

    await SettingsManager.saveGitLabSettings(settings, msg.shareWithTeam);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.GITLAB_SETTINGS_SAVED,
      success: true,
      sharedWithTeam: msg.shareWithTeam,
    });
  } catch (error) {
    console.error("Error saving GitLab settings:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.ERROR,
      message: `Error saving GitLab settings: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

/**
 * Handles GitLab commit requests
 */
async function handleGitLabCommit(msg: PluginMessage) {
  try {
    if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
      throw new Error("Missing required fields for GitLab commit");
    }

    const filePath = msg.filePath || DEFAULT_PATHS.CSS_VARIABLES;
    const branchName = msg.branchName || "main";

    const commitOptions: GitLabCommitOptions = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      commitMessage: msg.commitMessage,
      filePath: filePath,
      branchName: branchName,
      content: msg.cssData,
      createMergeRequest: msg.createMergeRequest,
    };

    await GitLabAPI.commitFile(commitOptions);

    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_SUCCESS,
    });
  } catch (error) {
    console.error("Error committing to GitLab:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_ERROR,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
}

/**
 * Handles GitLab test commit requests
 */
async function handleGitLabTestCommit(msg: PluginMessage) {
  try {
    if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.testContent || !msg.filePath) {
      throw new Error("Missing required fields for GitLab test commit");
    }

    const commitOptions: GitLabCommitOptions = {
      projectId: msg.projectId,
      gitlabToken: msg.gitlabToken,
      commitMessage: msg.commitMessage,
      filePath: msg.filePath,
      branchName: msg.branchName || "main",
      content: msg.testContent,
    };

    // Use GitLabAPI with progress callback
    await GitLabAPI.commitTestFile(commitOptions, (progress, message) => {
      figma.ui.postMessage({
        type: MESSAGE_TYPES.COMMIT_PROGRESS,
        progress,
        message,
      });
    });

    figma.ui.postMessage({
      type: "commit-test-success",
      filePath: msg.filePath
    });
  } catch (error) {
    console.error("Error committing test to GitLab:", error);
    figma.ui.postMessage({
      type: MESSAGE_TYPES.COMMIT_ERROR,
      error: error instanceof Error ? error.message : "Unknown error occurred while committing test",
    });
  }
}

// Message handler
figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case MESSAGE_TYPES.EXPORT_CSS:
      await handleCSSExport(msg);
      break;
    
    case MESSAGE_TYPES.GENERATE_TEST:
      await handleTestGeneration({
        componentId: msg.componentId,
        componentName: msg.componentName,
        generateAllVariants: msg.generateAllVariants,
        commitToGitLab: msg.commitToGitLab
      });
      break;
    
    case MESSAGE_TYPES.SAVE_GITLAB_SETTINGS:
      await handleSaveGitLabSettings(msg);
      break;
    
    case MESSAGE_TYPES.COMMIT_TO_GITLAB:
      await handleGitLabCommit(msg);
      break;
    
    case MESSAGE_TYPES.COMMIT_TEST_TO_GITLAB:
      await handleGitLabTestCommit(msg);
      break;
    
    default:
      console.warn(`Unknown message type: ${msg.type}`);
  }
};

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on("generate", (_event) => {
  try {
    return [
      {
        language: "PLAINTEXT",
        code: "aWall Synch - Use the plugin interface to view variables and components",
        title: "aWall Synch",
      },
    ];
  } catch (error) {
    console.error("Plugin error:", error);
    return [
      {
        language: "PLAINTEXT",
        code: "Error occurred during code generation",
        title: "Error",
      },
    ];
  }
});

// Initialize the plugin
initializePlugin();