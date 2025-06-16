import dataService from '../services/dataService';
import { GitLabService } from '../services/gitlabService';
import { CSSExportService } from '../services/cssExportService';
import { ComponentService } from '../services/componentService';

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

// Bootstrap the plugin
async function bootstrap() {
  console.log('Bootstrapping plugin...');
  
  try {
    // Initialize the data service first
    await dataService.initialize();
    console.log('Data service initialized');
    
    // Send the collected data to the UI
    figma.ui.postMessage({
      type: "document-data",
      variablesData: dataService.getVariablesData(),
      componentsData: dataService.getComponentsData(),
    });
    
    // Load saved GitLab settings
    await loadSavedGitLabSettings();
    
    console.log('Plugin bootstrapped successfully');
  } catch (error) {
    console.error('Failed to bootstrap plugin:', error);
    figma.ui.postMessage({
      type: "error",
      message: "Failed to initialize plugin data: " + (error.message || "Unknown error"),
    });
  }
}

// Load saved GitLab settings if available
async function loadSavedGitLabSettings() {
  try {
    const settings = await GitLabService.loadSettings();
    if (settings) {
      figma.ui.postMessage({
        type: "gitlab-settings-loaded",
        settings: settings,
      });
      console.log("GitLab settings loaded");
    }
  } catch (error) {
    console.error("Error loading GitLab settings:", error);
    // Silently fail - we'll just prompt the user for settings
  }
}

// Start the plugin
bootstrap();

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

// Handle messages from the UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case "export-css":
        const cssContent = await CSSExportService.exportVariables();
        figma.ui.postMessage({
          type: "css-export",
          cssData: cssContent,
          shouldDownload: msg.shouldDownload,
        });
        break;

      case "generate-test":
        const component = ComponentService.getComponentById(msg.componentId || "");
        if (!component) {
          throw new Error(`Component with ID ${msg.componentId} not found`);
        }

        const testContent = ComponentService.generateTest(component, msg.generateAllVariants);
        figma.ui.postMessage({
          type: "test-generated",
          componentName: msg.componentName || component.name,
          testContent: testContent,
          isComponentSet: component.type === "COMPONENT_SET",
          hasAllVariants: msg.generateAllVariants,
        });
        break;

      case "refresh-document-data":
        // Reinitialize the data service if a refresh is requested
        await dataService.initialize();
        figma.ui.postMessage({
          type: "document-data",
          variablesData: dataService.getVariablesData(),
          componentsData: dataService.getComponentsData(),
        });
        break;

      case "save-gitlab-settings":
        await GitLabService.saveSettings(
          {
            projectId: msg.projectId || "",
            gitlabToken: msg.gitlabToken,
            filePath: msg.filePath || "src/variables.css",
            strategy: msg.strategy || "merge-request",
            branchName: msg.branchName || "feature/variables",
            saveToken: msg.saveToken || false,
            savedAt: new Date().toISOString(),
            savedBy: figma.currentUser?.name || "Unknown user",
          },
          msg.shareWithTeam || false
        );

        figma.ui.postMessage({
          type: "gitlab-settings-saved",
          success: true,
          sharedWithTeam: msg.shareWithTeam,
        });
        break;

      case "commit-to-gitlab":
        if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
          throw new Error("Missing required fields for GitLab commit");
        }

        const result = await GitLabService.commitToGitLab(
          msg.projectId,
          msg.gitlabToken,
          msg.commitMessage,
          msg.filePath || "variables.css",
          msg.cssData,
          msg.branchName || "feature/variables"
        );

        figma.ui.postMessage({
          type: "commit-success",
          message: "Successfully committed changes to the feature branch",
          mergeRequestUrl: result?.mergeRequestUrl
        });
        break;

      case "reset-gitlab-settings":
        await GitLabService.resetSettings();
        figma.ui.postMessage({
          type: "gitlab-settings-reset",
          success: true
        });
        break;

      default:
        console.warn("Unknown message type:", msg.type);
    }
  } catch (error) {
    console.error("Error handling message:", error);
    figma.ui.postMessage({
      type: "error",
      message: error.message || "Unknown error occurred",
    });
  }
};