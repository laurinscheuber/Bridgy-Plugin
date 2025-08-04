import { PluginMessage } from "../types";
import { GitLabService } from "../services/gitlabService";
import { CSSExportService } from "../services/cssExportService";
import { ComponentService } from "../services/componentService";

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 850, height: 800 });

// Store component data for later use
let componentMap = new Map<string, any>();

// Collect all variables and components from the document
async function collectDocumentData() {
  // Collection variables
  const variableCollections =
    await figma.variables.getLocalVariableCollectionsAsync();
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
      for (const modeId in variable.valuesByMode) {
        const value = variable.valuesByMode[modeId];
        const mode = collection.modes.find((m) => m.modeId === modeId);
        valuesByModeEntries.push({
          modeName: mode ? mode.name : "Unknown",
          value: value,
        });
      }

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

  // Send the data to the UI
  figma.ui.postMessage({
    type: "document-data",
    variablesData,
    componentsData,
  });
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
        code: "DesignSync - Use the plugin interface to view variables and components",
        title: "DesignSync",
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

        const testContent = ComponentService.generateTest(
          component,
          msg.generateAllVariants,
          msg.includeStateTests !== false // Default to true
        );
        figma.ui.postMessage({
          type: "test-generated",
          componentName: msg.componentName || component.name,
          testContent: testContent,
          isComponentSet: component.type === "COMPONENT_SET",
          hasAllVariants: msg.generateAllVariants,
          forCommit: msg.forCommit,
        });
        break;

      case "save-gitlab-settings":
        await GitLabService.saveSettings(
          {
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
        if (
          !msg.projectId ||
          !msg.gitlabToken ||
          !msg.commitMessage ||
          !msg.cssData
        ) {
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
          mergeRequestUrl: result?.mergeRequestUrl,
        });
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

        const testResult = await GitLabService.commitComponentTest(
          msg.projectId,
          msg.gitlabToken,
          msg.commitMessage,
          msg.componentName,
          msg.testContent,
          msg.testFilePath ||
            "components/{componentName}.spec.ts",
          msg.branchName || "feature/component-tests"
        );

        figma.ui.postMessage({
          type: "test-commit-success",
          message:
            "Successfully committed component test to the feature branch",
          componentName: msg.componentName,
          mergeRequestUrl: testResult?.mergeRequestUrl,
        });
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
        console.log(
          "Received update-unit-settings:",
          msg.collections,
          msg.groups
        );
        CSSExportService.updateUnitSettings({
          collections: msg.collections,
          groups: msg.groups,
        });
        await CSSExportService.saveUnitSettings();
        console.log("Unit settings saved successfully");
        figma.ui.postMessage({
          type: "unit-settings-updated",
          success: true,
        });
        break;

      default:
        console.warn("Unknown message type:", msg.type);
    }
  } catch (error: any) {
    console.error("Error handling message:", error);
    figma.ui.postMessage({
      type: "error",
      message: error.message || "Unknown error occurred",
    });
  }
};
