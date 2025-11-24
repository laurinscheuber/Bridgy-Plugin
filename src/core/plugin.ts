import { PluginMessage, GitLabSettings } from "../types";
import { GitSettings } from "../types/git";
import { GitLabService } from "../services/gitlabService";
import { GitServiceFactory } from "../services/gitServiceFactory";
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

    // Collect styles (text, paint/fill, effect)
    const stylesData = {
      textStyles: [],
      paintStyles: [],
      effectStyles: []
    };

    // Collect text styles
    const textStyles = await figma.getLocalTextStylesAsync();
    for (const textStyle of textStyles) {
      stylesData.textStyles.push({
        id: textStyle.id,
        name: textStyle.name,
        description: textStyle.description,
        fontSize: textStyle.fontSize,
        fontName: textStyle.fontName,
        // fontWeight: textStyle.fontWeight, // Property doesn't exist on TextStyle
        lineHeight: textStyle.lineHeight,
        letterSpacing: textStyle.letterSpacing,
        textCase: textStyle.textCase,
        textDecoration: textStyle.textDecoration,
      });
    }

    // Collect paint/fill styles  
    const paintStyles = await figma.getLocalPaintStylesAsync();
    for (const paintStyle of paintStyles) {
      stylesData.paintStyles.push({
        id: paintStyle.id,
        name: paintStyle.name,
        description: paintStyle.description,
        paints: paintStyle.paints,
      });
    }

    // Collect effect styles
    const effectStyles = await figma.getLocalEffectStylesAsync();
    for (const effectStyle of effectStyles) {
      stylesData.effectStyles.push({
        id: effectStyle.id,
        name: effectStyle.name,
        description: effectStyle.description,
        effects: effectStyle.effects,
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
      stylesData,
      componentsData: componentsData || [],
    });

    // Return the data for internal use
    return {
      variables: variablesData,
      components: componentsData || []
    };
  } catch (error) {
    console.error('Error collecting document data:', error);
    
    // Send error to UI so user knows something went wrong
    figma.ui.postMessage({
      type: "document-data-error",
      error: error instanceof Error ? error.message : 'Unknown error during data collection',
      variablesData: [], // Send empty arrays as fallback
      componentsData: [],
    });

    // Return empty data on error
    return {
      variables: [],
      components: []
    };
  }
}

// Load saved Git settings if available
async function loadSavedGitSettings() {
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

// Run the collection when the plugin starts
collectDocumentData();

// Load saved Git settings
loadSavedGitSettings();

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
  console.log("DEBUG: Received ANY message:", msg.type, msg);
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
          
          // Check if we need to switch pages
          const needsPageSwitch = containingPage && containingPage !== figma.currentPage;
          
          // Navigate to the correct page first if needed (use async method for dynamic-page access)
          if (needsPageSwitch && containingPage) {
            console.log('Backend: Switching to page:', containingPage.name);
            await figma.setCurrentPageAsync(containingPage);
          }

          // Select and navigate to the component
          figma.currentPage.selection = [nodeToSelect as SceneNode];
          figma.viewport.scrollAndZoomIntoView([nodeToSelect as SceneNode]);
          
          console.log('Backend: Successfully selected and navigated to component');
          
          figma.ui.postMessage({
            type: "component-selected",
            componentId: msg.componentId,
            componentName: nodeToSelect.name,
            pageName: containingPage?.name || 'Unknown',
            switchedPage: needsPageSwitch || false,
          });
        } catch (error: any) {
          console.error('Backend: Error selecting component:', error);
          
          // Try to extract page information even on error
          let errorPageName = 'unknown page';
          try {
            const errorNode = await figma.getNodeByIdAsync(msg.componentId);
            if (errorNode) {
              let checkNode: BaseNode = errorNode;
              while (checkNode.parent) {
                if (checkNode.parent.type === 'PAGE') {
                  errorPageName = checkNode.parent.name;
                  break;
                }
                checkNode = checkNode.parent;
              }
            }
          } catch (pageError) {
            // Ignore - we tried
          }
          
          figma.ui.postMessage({
            type: "component-selection-error",
            componentId: msg.componentId,
            message: error.message || 'Failed to select component',
            pageName: errorPageName,
          });
        }
        break;

      case "save-git-settings":
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
        
        await gitService.saveSettings(gitSettings, msg.shareWithTeam || false);
        
        figma.ui.postMessage({
          type: "git-settings-saved",
          success: true,
          sharedWithTeam: msg.shareWithTeam,
        });
        break;

      case "save-gitlab-settings":
        // Keep for backward compatibility
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
        
      case "list-repositories":
        try {
          const listService = GitServiceFactory.getService(msg.provider || 'gitlab');
          const tempSettings: GitSettings = {
            provider: msg.provider || 'gitlab',
            baseUrl: '',
            projectId: '',
            token: msg.token,
            filePath: '',
            saveToken: false,
            savedAt: '',
            savedBy: ''
          };
          
          const repositories = await listService.listRepositories(tempSettings);
          
          figma.ui.postMessage({
            type: "repositories-loaded",
            repositories: repositories
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: "repositories-error",
            error: error.message || "Failed to load repositories"
          });
        }
        break;
        
      case "list-branches":
        try {
          if (msg.provider !== 'github') {
            throw new Error("Branch listing is currently only supported for GitHub repositories");
          }
          
          const { GitHubService } = await import("../services/githubService");
          const githubService = new GitHubService();
          const branchSettings: GitSettings = {
            provider: 'github',
            baseUrl: '',
            projectId: msg.projectId || '',
            token: msg.token,
            filePath: '',
            saveToken: false,
            savedAt: '',
            savedBy: ''
          };
          
          const branches = await githubService.listBranches(branchSettings);
          
          figma.ui.postMessage({
            type: "branches-loaded",
            branches: branches
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: "branches-error",
            error: error.message || "Failed to load branches"
          });
        }
        break;
        
      case "check-oauth-status":
        try {
          const { OAuthService } = await import("../services/oauthService");
          const status = OAuthService.getOAuthStatus();
          
          figma.ui.postMessage({
            type: "oauth-status",
            status: status
          });
        } catch (error: any) {
          console.error("Error checking OAuth status:", error);
          figma.ui.postMessage({
            type: "oauth-status",
            status: {
              available: false,
              configured: false,
              message: "OAuth service unavailable"
            }
          });
        }
        break;
        
      case "start-oauth-flow":
        try {
          const { OAuthService } = await import("../services/oauthService");
          
          if (!OAuthService.isOAuthConfigured()) {
            throw new Error("OAuth is not configured. Please use Personal Access Token method.");
          }
          
          const oauthUrl = OAuthService.generateGitHubOAuthUrl();
          
          figma.ui.postMessage({
            type: "oauth-url",
            url: oauthUrl
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: "oauth-callback",
            data: {
              success: false,
              error: error.message || "Failed to start OAuth flow"
            }
          });
        }
        break;

      case "open-external":
        try {
          if (!msg.url) {
            throw new Error("URL is required for external opening");
          }
          
          // Use Figma's openExternal API to open URL in user's browser
          figma.openExternal(msg.url);
          
          figma.ui.postMessage({
            type: "external-url-opened",
            success: true
          });
        } catch (error: any) {
          console.error("Error opening external URL:", error);
          figma.ui.postMessage({
            type: "external-url-opened", 
            success: false,
            error: error.message || "Failed to open external URL"
          });
        }
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

      case "validate-tailwind-v4":
        const twValidation = await CSSExportService.getTailwindV4ValidationStatus();
        figma.ui.postMessage({
          type: "tailwind-v4-validation",
          validation: twValidation,
        });
        break;

      case "resize-plugin":
        // Disabled dynamic resizing - keep consistent size
        // figma.ui.resize() calls removed to maintain fixed plugin size
        break;

      case "get-existing-collections":
        try {
          const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
          const collectionsData = [];
          
          for (const collection of existingCollections) {
            const variablesPromises = collection.variableIds.map(async (id) => {
              const variable = await figma.variables.getVariableByIdAsync(id);
              return variable ? { id: variable.id, name: variable.name, resolvedType: variable.resolvedType } : null;
            });
            
            const variables = await Promise.all(variablesPromises);
            const validVariables = variables.filter(v => v !== null);
            
            collectionsData.push({
              id: collection.id,
              name: collection.name,
              variables: validVariables
            });
          }
          
          figma.ui.postMessage({
            type: "existing-collections",
            collections: collectionsData
          });
        } catch (error: any) {
          console.error("Error getting existing collections:", error);
          figma.ui.postMessage({
            type: "existing-collections-error",
            error: error.message || "Failed to load existing collections"
          });
        }
        break;

      case "import-tokens":
        console.log("DEBUG: Received import-tokens message", { tokensCount: msg.tokens?.length, options: msg.options });
        try {
          if (!msg.tokens || !Array.isArray(msg.tokens)) {
            console.error("DEBUG: Invalid tokens data", msg.tokens);
            throw new Error("Invalid tokens data");
          }

          const tokens = msg.tokens;
          const options = msg.options || {};
          
          // Create or get collection
          let collection;
          if (options.createNew || !options.existingCollectionId) {
            collection = figma.variables.createVariableCollection(options.collectionName || "Imported Tokens");
          } else {
            const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
            collection = existingCollections.find(c => c.id === options.existingCollectionId);
            if (!collection) {
              throw new Error("Selected collection not found");
            }
          }

          const modeId = collection.modes[0].modeId;
          let importedCount = 0;
          let importedStyleCount = 0;
          const createdGroups = new Set<string>();
          const createdStyles = {
            paint: 0,
            effect: 0,
            text: 0
          };

          // Function to extract group name from token name
          function extractGroupFromTokenName(tokenName: string): string {
            // Remove leading '--' if present
            const cleanName = tokenName.startsWith('--') ? tokenName.slice(2) : tokenName;
            
            // Split by '-' and take the first part as group name
            const parts = cleanName.split('-');
            return parts.length > 1 ? parts[0] : 'misc';
          }

          // Separate tokens by type
          const variableTokens = tokens.filter(token => 
            token.type === 'COLOR' || token.type === 'NUMBER' || token.type === 'RGBA_COLOR'
          );
          const styleTokens = tokens.filter(token => 
            ['GRADIENT', 'SHADOW', 'BLUR', 'TRANSITION'].indexOf(token.type) !== -1
          );

          console.log("DEBUG: Starting import with tokens:", {
            total: tokens.length,
            variables: variableTokens.length, 
            styles: styleTokens.length
          });

          // Import variable tokens
          for (const token of variableTokens) {
            console.log("DEBUG: Processing variable token:", token);

            try {
              // Check if variable already exists  
              const existingVariables = await Promise.all(
                collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
              );
              const existingVariable = existingVariables.find(v => v && v.name === token.name);

              if (existingVariable && !options.overwriteExisting) {
                console.log("DEBUG: Skipping existing variable:", token.name);
                continue; // Skip existing variables if not overwriting
              }

              let variable;
              if (existingVariable && options.overwriteExisting) {
                console.log("DEBUG: Overwriting existing variable:", token.name);
                variable = existingVariable;
              } else {
                const variableType = token.type === 'COLOR' ? 'COLOR' : 'FLOAT';
                console.log("DEBUG: Creating new variable:", token.name, "type:", variableType);
                variable = figma.variables.createVariable(token.name, collection, variableType);
              }

              // Set variable value
              let value = token.value;
              console.log("DEBUG: Original value:", value, "isAlias:", token.isAlias);
              
              // Handle variable aliases (references to other variables)
              if (token.isAlias && token.references && token.references.length > 0) {
                const referencedVarName = token.references[0]; // Use first reference
                console.log("DEBUG: Looking for referenced variable:", referencedVarName);
                
                // Find the referenced variable in the collection
                const existingVariables = await Promise.all(
                  collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id))
                );
                const referencedVariable = existingVariables.find(v => v && v.name.endsWith(`/${referencedVarName}`));
                
                if (referencedVariable) {
                  console.log("DEBUG: Found referenced variable, creating alias:", referencedVariable.name);
                  value = { type: "VARIABLE_ALIAS", id: referencedVariable.id };
                } else {
                  console.warn("DEBUG: Referenced variable not found:", referencedVarName, "using fallback value");
                  // Fallback: parse the raw value if reference not found
                  value = token.value;
                }
              } else {
                // Handle direct values
                if (token.type === 'COLOR') {
                  // Parse color value
                  if (typeof value === 'string' && value.startsWith('#')) {
                    const hex = value.slice(1);
                    const r = parseInt(hex.substring(0, 2), 16) / 255;
                    const g = parseInt(hex.substring(2, 4), 16) / 255;
                    const b = parseInt(hex.substring(4, 6), 16) / 255;
                    value = { r, g, b };
                    console.log("DEBUG: Parsed color value:", value);
                  }
                } else if (token.type === 'NUMBER') {
                  // Parse numeric value (remove units like rem, px)
                  if (typeof value === 'string') {
                    value = parseFloat(value.replace(/[a-zA-Z%]/g, ''));
                    console.log("DEBUG: Parsed numeric value:", value);
                  }
                }
              }

              console.log("DEBUG: Setting value for mode:", modeId, "value:", value);
              variable.setValueForMode(modeId, value);
              
              // Add variable to appropriate group based on name
              const groupName = extractGroupFromTokenName(token.name);
              if (!createdGroups.has(groupName)) {
                // Create group structure by setting variable name prefix
                variable.name = `${groupName}/${token.name}`;
                createdGroups.add(groupName);
                console.log("DEBUG: Created group:", groupName, "for variable:", variable.name);
              } else {
                variable.name = `${groupName}/${token.name}`;
                console.log("DEBUG: Added to existing group:", groupName, "variable:", variable.name);
              }
              
              importedCount++;
              console.log("DEBUG: Successfully created variable:", token.name, "importedCount:", importedCount);

            } catch (tokenError: any) {
              console.error(`DEBUG: Failed to import token ${token.name}:`, tokenError);
            }
          }

          // Import style tokens as Figma styles
          for (const token of styleTokens) {
            console.log("DEBUG: Processing style token:", token);

            try {
              const styleName = token.name;

              if (token.type === 'GRADIENT') {
                // Create paint style for gradients
                const paintStyle = figma.createPaintStyle();
                paintStyle.name = styleName;
                paintStyle.description = `Imported gradient: ${token.value}`;
                
                // For now, create a simple solid color as a placeholder
                // Real gradient parsing would need complex CSS parsing
                paintStyle.paints = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.9 } }];
                createdStyles.paint++;
                console.log("DEBUG: Created paint style for gradient:", styleName);

              } else if (token.type === 'SHADOW') {
                // Create effect style for shadows
                const effectStyle = figma.createEffectStyle();
                effectStyle.name = styleName;
                effectStyle.description = `Imported shadow: ${token.value}`;
                
                // Parse basic shadow values (simplified)
                const shadowMatch = token.value.match(/(\d+)px\s+(\d+)px\s+(\d+)px/);
                if (shadowMatch) {
                  const [, x, y, blur] = shadowMatch;
                  effectStyle.effects = [{
                    type: 'DROP_SHADOW',
                    color: { r: 0, g: 0, b: 0, a: 0.25 },
                    offset: { x: parseInt(x), y: parseInt(y) },
                    radius: parseInt(blur),
                    visible: true,
                    blendMode: 'NORMAL'
                  }];
                }
                createdStyles.effect++;
                console.log("DEBUG: Created effect style for shadow:", styleName);

              } else if (token.type === 'BLUR') {
                // Create effect style for blur
                const effectStyle = figma.createEffectStyle();
                effectStyle.name = styleName;
                effectStyle.description = `Imported blur: ${token.value}`;
                
                const blurMatch = token.value.match(/blur\((\d+)px\)/);
                if (blurMatch) {
                  const radius = parseInt(blurMatch[1]);
                  effectStyle.effects = [{
                    type: 'LAYER_BLUR',
                    radius: radius,
                    visible: true
                  }];
                }
                createdStyles.effect++;
                console.log("DEBUG: Created effect style for blur:", styleName);
              }

              importedStyleCount++;

            } catch (styleError: any) {
              console.error(`DEBUG: Failed to import style ${token.name}:`, styleError);
            }
          }

          const totalStylesCreated = createdStyles.paint + createdStyles.effect + createdStyles.text;
          console.log("DEBUG: Import completed successfully", { 
            importedCount, 
            importedStyleCount, 
            totalTokens: tokens.length, 
            groupsCreated: createdGroups.size,
            stylesCreated: totalStylesCreated
          });
          figma.ui.postMessage({
            type: "import-complete",
            result: {
              success: true,
              importedCount,
              importedStyleCount: totalStylesCreated,
              totalTokens: tokens.length,
              collectionName: collection.name,
              collectionId: collection.id,
              groupsCreated: createdGroups.size,
              groups: Array.from(createdGroups),
              stylesCreated: createdStyles
            }
          });

        } catch (importError: any) {
          console.error("DEBUG: Import failed", importError);
          figma.ui.postMessage({
            type: "import-error",
            error: importError.message || "Failed to import tokens"
          });
        }
        break;

      case "refresh-data":
        try {
          console.log("Refreshing document data...");
          
          // Re-run the data collection
          await collectDocumentData();
          
          figma.ui.postMessage({
            type: "refresh-complete",
            message: "Data refreshed successfully"
          });
          
        } catch (refreshError: any) {
          console.error("Error refreshing data:", refreshError);
          figma.ui.postMessage({
            type: "refresh-error",
            error: refreshError.message || "Failed to refresh data"
          });
        }
        break;

      case "delete-variable":
        try {
          if (!msg.variableId) {
            throw new Error("Variable ID is required for deletion");
          }

          // Get the variable to check if it exists
          const variableToDelete = await figma.variables.getVariableByIdAsync(msg.variableId);
          if (!variableToDelete) {
            throw new Error("Variable not found");
          }

          // Delete the variable from Figma
          variableToDelete.remove();
          
          console.log(`Successfully deleted variable: ${variableToDelete.name} (${msg.variableId})`);
          
          // Send success confirmation back to UI
          figma.ui.postMessage({
            type: "variable-deleted",
            variableId: msg.variableId,
            variableName: variableToDelete.name
          });
          
          // Refresh the variables data
          const refreshedData = await collectDocumentData();
          figma.ui.postMessage({
            type: "data-refreshed",
            variables: refreshedData.variables,
            components: refreshedData.components
          });
          
        } catch (deleteError: any) {
          console.error("Error deleting variable:", deleteError);
          figma.ui.postMessage({
            type: "delete-error",
            error: deleteError.message || "Failed to delete variable"
          });
        }
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
