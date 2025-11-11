import { PluginMessage, GitLabSettings } from "../types";
import { GitLabService } from "../services/gitlabService";
import { CSSExportService } from "../services/cssExportService";
import { ComponentService } from "../services/componentService";
import {SUCCESS_MESSAGES} from "../config";

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 1000, height: 900, themeColors: true });

// Store component data for later use
let componentMap = new Map<string, any>();

// Collect all variables and components from the document
async function collectDocumentData() {
  try {
    // Collection variables
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const variablesData = [];

  // Sort collections alphabetically by name
  const sortedCollections = variableCollections.sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const collection of sortedCollections) {
    const variablesPromises = collection.variableIds.map(async (id) => {
      const variable = await figma.variables.getVariableByIdAsync(id);
      if (!variable) return null;

      const valuesByModeEntries = [];

      // Handle valuesByMode in a TypeScript-friendly way
      Object.keys(variable.valuesByMode).forEach(modeId => {
        const value = variable.valuesByMode[modeId];
        const mode = collection.modes.find((m) => m.modeId === modeId);
        valuesByModeEntries.push({
          modeName: mode ? mode.name : "Unknown",
          value: value,
        });
      });

      return {
        id: variable.id,
        name: variable.name,
        resolvedType: variable.resolvedType,
        valuesByMode: valuesByModeEntries,
      };
    });

    const variablesResult = await Promise.all(variablesPromises);
    const variables = variablesResult.filter((item) => item !== null);

    variablesData.push({
      name: collection.name,
      variables: variables,
    });
  }

    // Collect components
    const componentsData = await ComponentService.collectComponents();
    
    if (!componentsData || componentsData.length === 0) {
      console.warn('No components found in document');
    }

    // Send the data to the UI
    figma.ui.postMessage({
      type: "document-data",
      variablesData,
      componentsData: componentsData || [],
    });
  } catch (error) {
    console.error('Error collecting document data:', error);
    
    // Send error to UI so user knows something went wrong
    figma.ui.postMessage({
      type: "document-data-error",
      error: error instanceof Error ? error.message : 'Unknown error during data collection',
      variablesData: [], // Send empty arrays as fallback
      componentsData: [],
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
    }
  } catch (error) {
    console.error("Error loading GitLab settings:", error);
    // Silently fail - we'll just prompt the user for settings
  }
}

// Run the collection when the plugin starts
collectDocumentData();

// Load saved GitLab settings
loadSavedGitLabSettings();

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on("generate", (_event) => {
  try {
    return [
      {
        language: "PLAINTEXT",
        code: "Bridgy - Use the plugin interface to view variables and components",
        title: "Bridgy",
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
figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    switch (msg.type) {
      case "export-css":
        const format = msg.exportFormat || "css";
        const cssContent = await CSSExportService.exportVariables(format);
        figma.ui.postMessage({
          type: "css-export",
          cssData: cssContent,
          shouldDownload: msg.shouldDownload,
          exportFormat: format,
        });
        break;

      case "generate-test":
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
        break;

      case "load-component-styles":
        if (!msg.componentId) {
          throw new Error(`Missing required component ID for loading styles`);
        }

        const targetComponent = ComponentService.getComponentById(msg.componentId);
        if (!targetComponent) {
          throw new Error(`Component with ID ${msg.componentId} not found`);
        }

        // Load component styles lazily
        const { styles, textElements } = await ComponentService.loadComponentDetails(msg.componentId);
        
        figma.ui.postMessage({
          type: "component-styles-loaded",
          componentId: msg.componentId,
          styles: styles || {},
          textElements: textElements || [],
        });
        break;

      case "select-component":
        try {
          console.log('Backend: Received select-component for ID:', msg.componentId);
          
          if (!msg.componentId) {
            throw new Error(`Missing required component ID for selection`);
          }

          const nodeToSelect = await figma.getNodeByIdAsync(msg.componentId);
          console.log('Backend: Found node:', nodeToSelect?.name, nodeToSelect?.type, nodeToSelect?.parent?.type);
          
          if (!nodeToSelect) {
            throw new Error(`Component with ID ${msg.componentId} not found`);
          }

          // Check if node is a scene node (can be selected)
          const isSceneNode = nodeToSelect.type !== 'DOCUMENT' && nodeToSelect.type !== 'PAGE';
          console.log('Backend: Is scene node:', isSceneNode);
          
          if (!isSceneNode) {
            throw new Error(`Node ${msg.componentId} is not a selectable scene node (type: ${nodeToSelect.type})`);
          }

          // Find the page that contains this node by traversing up
          let currentNode: BaseNode = nodeToSelect;
          let containingPage: PageNode | null = null;
          
          while (currentNode.parent) {
            if (currentNode.parent.type === 'PAGE') {
              containingPage = currentNode.parent as PageNode;
              break;
            }
            currentNode = currentNode.parent;
          }
          
          console.log('Backend: Found containing page:', containingPage?.name);
          
          // Navigate to the correct page first if needed
          if (containingPage && containingPage !== figma.currentPage) {
            console.log('Backend: Switching to page:', containingPage.name);
            figma.currentPage = containingPage;
          }

          // Select and navigate to the component
          figma.currentPage.selection = [nodeToSelect as SceneNode];
          figma.viewport.scrollAndZoomIntoView([nodeToSelect as SceneNode]);
          
          console.log('Backend: Successfully selected and navigated to component');
          
          figma.ui.postMessage({
            type: "component-selected",
            componentId: msg.componentId,
            componentName: nodeToSelect.name,
          });
        } catch (error) {
          console.error('Backend: Error selecting component:', error);
          figma.ui.postMessage({
            type: "error",
            message: `Failed to select component: ${error.message}`,
          });
        }
        break;

      case "save-gitlab-settings":
        await GitLabService.saveSettings(
          {
            gitlabUrl: msg.gitlabUrl,
            projectId: msg.projectId || "",
            gitlabToken: msg.gitlabToken,
            filePath: msg.filePath || "src/variables.css",
            testFilePath:
              msg.testFilePath ||
              "components/{componentName}.spec.ts",
            strategy: msg.strategy || "merge-request",
            branchName: msg.branchName || "feature/variables",
            testBranchName: msg.testBranchName || "feature/component-tests",
            exportFormat: msg.exportFormat || "css",
            saveToken: msg.saveToken || false,
            savedAt: new Date().toISOString(),
            savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
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
        if (
          !msg.projectId ||
          !msg.gitlabToken ||
          !msg.commitMessage ||
          !msg.cssData
        ) {
          throw new Error("Missing required fields for GitLab commit");
        }

        try {
          const settings: GitLabSettings = {
            gitlabUrl: msg.gitlabUrl,
            projectId: msg.projectId,
            gitlabToken: msg.gitlabToken,
            filePath: msg.filePath || "variables.css",
            testFilePath: "components/{componentName}.spec.ts", // Default value
            strategy: "merge-request", // Default value  
            branchName: msg.branchName || "feature/variables",
            testBranchName: "feature/component-tests", // Default value
            exportFormat: "css", // Default value
            saveToken: false, // Default value
            savedAt: new Date().toISOString(),
            savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
          };

          const result = await GitLabService.commitToGitLab(
            settings,
            msg.commitMessage,
            msg.filePath || "variables.css",
            msg.cssData,
            msg.branchName || "feature/variables"
          );

          figma.ui.postMessage({
            type: "commit-success",
            message: SUCCESS_MESSAGES.COMMIT_SUCCESS,
            mergeRequestUrl: result && result.mergeRequestUrl,
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
            type: "commit-error",
            error: errorMessage,
            errorType: errorType,
            statusCode: error.statusCode,
          });
        }
        break;

      case "commit-component-test":
        if (
          !msg.projectId ||
          !msg.gitlabToken ||
          !msg.commitMessage ||
          !msg.testContent ||
          !msg.componentName
        ) {
          throw new Error("Missing required fields for component test commit");
        }

        try {
          const settings: GitLabSettings = {
            gitlabUrl: msg.gitlabUrl,
            projectId: msg.projectId,
            gitlabToken: msg.gitlabToken,
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

          const testResult = await GitLabService.commitComponentTest(
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
            mergeRequestUrl: testResult && testResult.mergeRequestUrl,
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
        break;

      case "reset-gitlab-settings":
        await GitLabService.resetSettings();
        figma.ui.postMessage({
          type: "gitlab-settings-reset",
          success: true,
        });
        break;

      case "get-unit-settings":
        const unitSettingsData = await CSSExportService.getUnitSettingsData();
        figma.ui.postMessage({
          type: "unit-settings-data",
          data: unitSettingsData,
        });
        break;

      case "update-unit-settings":
        CSSExportService.updateUnitSettings({
          collections: msg.collections,
          groups: msg.groups,
        });
        await CSSExportService.saveUnitSettings();
        figma.ui.postMessage({
          type: "unit-settings-updated",
          success: true,
        });
        break;

      case "resize-plugin":
        // Disabled dynamic resizing - keep consistent size
        // figma.ui.resize() calls removed to maintain fixed plugin size
        break;

      default:
    }
  } catch (error: any) {
    console.error("Error handling message:", error);
    figma.ui.postMessage({
      type: "error",
      message: error.message || "Unknown error occurred",
    });
  }
};
