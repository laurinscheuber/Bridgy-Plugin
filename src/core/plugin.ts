import { PluginMessage, GitLabSettings } from "../types";
import { GitSettings } from "../types/git";
import { GitLabService } from "../services/gitlabService";
import { GitServiceFactory } from "../services/gitServiceFactory";
import { CSSExportService } from "../services/cssExportService";
import { ComponentService } from "../services/componentService";
import { TokenCoverageService } from "../services/tokenCoverageService";
import { VariableImportService } from "../services/variableImportService";
import {SUCCESS_MESSAGES} from "../config";
import { objectEntries, objectValues } from "../utils/es2015-helpers";

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 650, height: 900, themeColors: true });

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
        boundVariables: textStyle.boundVariables,
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
        boundVariables: paintStyle.boundVariables,
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
        boundVariables: effectStyle.boundVariables,
      });
    }

    // Collect grid/layout styles
    const gridStyles = await figma.getLocalGridStylesAsync();
    // Initialize array if it doesn't exist (though strictly it should satisfy the interface first)
    // We'll add it to the stylesData object
    (stylesData as any).gridStyles = [];
    
    for (const gridStyle of gridStyles) {
      (stylesData as any).gridStyles.push({
        id: gridStyle.id,
        name: gridStyle.name,
        description: gridStyle.description,
        layoutGrids: gridStyle.layoutGrids,
        boundVariables: gridStyle.boundVariables,
      });
    }

    // Collect components
    const componentsData = await ComponentService.collectComponents();
    
    if (!componentsData || componentsData.length === 0) {
      console.warn('No components found in document');
    }

    // Collect referenced variables (for aliases)
    const referencedIds = new Set<string>();
    
    // Helper to extract alias IDs from values
    const collectAliasIds = (val: any) => {
      if (val && typeof val === 'object' && val.type === 'VARIABLE_ALIAS' && val.id) {
        referencedIds.add(val.id);
      }
    };

    // Scan all collected variables for aliases
    variablesData.forEach(collection => {
      collection.variables.forEach(variable => {
        variable.valuesByMode.forEach((item: any) => {
          collectAliasIds(item.value);
        });
      });
    });

    // Resolve names for all referenced variables
    const variableReferences: Record<string, string> = {};
    const referencePromises = Array.from(referencedIds).map(async (id) => {
        try {
            // Check if we already have it in local variables to save an API call/lookup
            let foundLocal = false;
            for(const col of variablesData) {
                const local = col.variables.find(v => v.id === id);
                if(local) {
                    variableReferences[id] = local.name;
                    foundLocal = true;
                    break;
                }
            }
            
            if (!foundLocal) {
                const v = await figma.variables.getVariableByIdAsync(id);
                if (v) {
                    variableReferences[id] = v.name;
                }
            }
        } catch (e) {
            console.warn(`Could not resolve referenced variable: ${id}`);
        }
    });
    
    await Promise.all(referencePromises);

    // Check for feedback dismissal status
    const feedbackDismissed = await figma.clientStorage.getAsync('feedback_dismissed');

    // Send the data to the UI
    figma.ui.postMessage({
      type: "document-data",
      variablesData,
      variableReferences, // Send the lookup map
      stylesData,
      componentsData: componentsData || [],
      feedbackDismissed: !!feedbackDismissed
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

/**
 * Helper function to apply a variable to a node property
 */
async function applyVariableToNode(
  node: SceneNode,
  variable: Variable,
  property: string,
  category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance'
): Promise<boolean> {
  try {
    // Map property names to Figma bindable properties
    const propertyMap: Record<string, string> = {
      'Width': 'width',
      'Height': 'height',
      'Min Width': 'minWidth',
      'Max Width': 'maxWidth',
      'Min Height': 'minHeight',
      'Max Height': 'maxHeight',
      'Gap': 'itemSpacing',
      'Padding': 'paddingLeft', // Will also set other padding properties
      'Padding Left': 'paddingLeft',
      'Padding Top': 'paddingTop',
      'Padding Right': 'paddingRight',
      'Padding Bottom': 'paddingBottom',
      'Fill Color': 'fills',
      'Stroke Color': 'strokes',
      'Stroke Weight': 'strokeWeight',
      'Opacity': 'opacity',
      'Corner Radius': 'topLeftRadius', // Will also set other corner radii
      'Corner Radius (Top Left)': 'topLeftRadius',
      'Corner Radius (Top Right)': 'topRightRadius',
      'Corner Radius (Bottom Left)': 'bottomLeftRadius',
      'Corner Radius (Bottom Right)': 'bottomRightRadius'
    };

    const figmaProperty = propertyMap[property];
    if (!figmaProperty) {
      console.warn(`Unknown property: ${property}`);
      return false;
    }

    // Check if node supports this property
    if (!(figmaProperty in node)) {
      console.warn(`Node does not support property: ${figmaProperty}`);
      return false;
    }

    // Special handling for consolidated properties (Padding, Corner Radius)
    if (property === 'Padding') {
      // Apply to all padding properties
      // Using 'as any' here is safe because we check for property existence first
      const paddingNode = node as any;
      if ('paddingLeft' in paddingNode && typeof paddingNode.setBoundVariable === 'function') {
        paddingNode.setBoundVariable('paddingLeft', variable);
        paddingNode.setBoundVariable('paddingTop', variable);
        paddingNode.setBoundVariable('paddingRight', variable);
        paddingNode.setBoundVariable('paddingBottom', variable);
      }
    } else if (property === 'Corner Radius') {
      // Apply to all corner radius properties
      // Using 'as any' here is safe because we check for property existence first
      const radiusNode = node as any;
      if ('topLeftRadius' in radiusNode && typeof radiusNode.setBoundVariable === 'function') {
        radiusNode.setBoundVariable('topLeftRadius', variable);
        radiusNode.setBoundVariable('topRightRadius', variable);
        radiusNode.setBoundVariable('bottomLeftRadius', variable);
        radiusNode.setBoundVariable('bottomRightRadius', variable);
      }
    } else {
      // Apply to single property
      // Using 'as any' here is safe because we checked property existence above
      const bindableNode = node as any;
      if (typeof bindableNode.setBoundVariable === 'function') {
        bindableNode.setBoundVariable(figmaProperty, variable);
      }
    }

    return true;
  } catch (error) {
    console.error('Error applying variable to node:', error);
    return false;
  }
}

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
        console.log('DEBUG: gitService:', gitService);
        console.log('DEBUG: gitService.saveSettings type:', typeof gitService?.saveSettings);
        console.log('DEBUG: msg.provider:', msg.provider);
        
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
          savedAt: new Date().toISOString(), // We need to match what was saved
          savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
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
      case "commit-to-repo":
        // Generic commit handler for both GitLab and GitHub
        const isLegacy = msg.type === "commit-to-gitlab";
        
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
        break;

      case "commit-component-test":
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

      case "preview-import":
        try {
          const content = (msg as any).content;
          if (!content) throw new Error("No content provided");

          const tokens = VariableImportService.parseCSS(content);

          // Get current state for diff
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          const variableIds = collections.reduce((acc, c) => acc.concat(c.variableIds), [] as string[]);
          const allVariables = await Promise.all(
            variableIds.map(id => figma.variables.getVariableByIdAsync(id))
          );
          const validVariables = allVariables.filter(v => v !== null);

          const diff = VariableImportService.compareTokens(tokens, validVariables);

          figma.ui.postMessage({
            type: 'import-preview-ready',
            diff: diff,
            totalFound: tokens.length
          });
        } catch (error: any) {
          figma.ui.postMessage({
             type: 'import-error',
             message: error.message
          });
        }
        break;

      case "import-tokens":
        console.log("DEBUG: Received import-tokens message");
        console.log("DEBUG: Message content:", JSON.stringify(msg, null, 2));
        try {
           const importOptions = (msg as any).options || {};
           const tokens = (msg as any).tokens || [];

           console.log(`DEBUG: Received ${tokens.length} tokens to import`);
           console.log("DEBUG: Import options:", JSON.stringify(importOptions, null, 2));

           // Log first token as sample
           if (tokens.length > 0) {
             console.log("DEBUG: Sample token:", JSON.stringify(tokens[0], null, 2));
           }

           // Ensure tokens have required fields for ImportToken interface
           const validTokens = tokens.map((t: any) => ({
             ...t,
             originalLine: t.originalLine || '',
             lineNumber: t.lineNumber || 0
           }));

           console.log("DEBUG: Calling VariableImportService.importVariables now...");
           const result = await VariableImportService.importVariables(validTokens, {
             collectionId: importOptions.collectionId,
             collectionName: importOptions.collectionName,
             strategy: importOptions.strategy || 'merge',
             organizeByCategories: importOptions.organizeByCategories
           });

           figma.ui.postMessage({
             type: 'import-complete',
             result: {
               importedCount: result.success,
               errors: result.errors,
               collectionName: importOptions.collectionName,
               groupsCreated: result.groupsCreated
             }
           });
        } catch (error: any) {
           console.error("Import failed:", error);
           figma.ui.postMessage({
             type: 'import-error',
             error: error.message
           });
        }
        break;


          // Old inline logic removed in favor of VariableImportService





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

      case "analyze-token-coverage":
        try {
          const scope = msg.scope || 'PAGE';
          console.log(`Analyzing token coverage (Scope: ${scope})...`);

          let coverageResult;
          
          if (scope === 'ALL') {
            coverageResult = await TokenCoverageService.analyzeDocument();
          } else if (scope === 'SMART_SCAN') {
            coverageResult = await TokenCoverageService.analyzeSmart();
          } else {
            coverageResult = await TokenCoverageService.analyzeCurrentPage();
          }

          figma.ui.postMessage({
            type: "token-coverage-result",
            result: coverageResult
          });

        } catch (coverageError: any) {
          console.error("Error analyzing token coverage:", coverageError);
          figma.ui.postMessage({
            type: "token-coverage-error",
            error: coverageError.message || "Failed to analyze token coverage"
          });
        }
        break;

      case "set-client-storage":
        const storageMsg = msg as any;
        if (storageMsg.key) {
          await figma.clientStorage.setAsync(storageMsg.key, storageMsg.value);
          console.log(`Backend: Saved ${storageMsg.key} to clientStorage`);
        }
        break;

      case "focus-node":
        try {
          const focusMsg = msg as any;
          if (focusMsg.nodeId) {
            // Use async variant for modern Figma environments (dynamic-page access)
            const node = await figma.getNodeByIdAsync(focusMsg.nodeId) as SceneNode;
            
            if (node) {
              // Ensure we are on the correct page
              if (node.parent && node.parent.type === 'PAGE') {
                  if (figma.currentPage.id !== node.parent.id) {
                      await figma.setCurrentPageAsync(node.parent as PageNode);
                  }
              } else {
                  // Fallback: traverse up to find page (though for SceneNode, parent chain should lead to Page)
                  let p = node.parent;
                  while (p && p.type !== 'PAGE' && p.type !== 'DOCUMENT') {
                      p = p.parent;
                  }
                  if (p && p.type === 'PAGE' && figma.currentPage.id !== p.id) {
                      await figma.setCurrentPageAsync(p as PageNode);
                  }
              }

              // Select the node
              figma.currentPage.selection = [node];
              // Zoom to fit the node in viewport
              figma.viewport.scrollAndZoomIntoView([node]);
              console.log(`Focused on node: ${node.name}`);
            } else {
              console.warn(`Node not found for focusing: ${focusMsg.nodeId}`);
            }
          }
        } catch (focusError) {
          console.error("Error focusing node:", focusError);
        }
        break;

      case "apply-token-to-nodes":
        try {
          const applyMsg = msg as any;
          const { nodeIds, variableId, property, category } = applyMsg;
          
          if (!nodeIds || !variableId || !property || !category) {
            throw new Error('Missing required parameters for applying token');
          }

          // Get the variable
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) {
            throw new Error('Variable not found');
          }

          let successCount = 0;
          let failCount = 0;
          
          // Apply variable to each node
          for (const nodeId of nodeIds) {
            try {
              const node = await figma.getNodeByIdAsync(nodeId);
              if (!node) {
                console.warn(`Node not found: ${nodeId}`);
                failCount++;
                continue;
              }

              // Check if node is a SceneNode
              if (node.type === 'DOCUMENT' || node.type === 'PAGE') {
                console.warn(`Cannot apply variable to ${node.type}: ${nodeId}`);
                failCount++;
                continue;
              }

              // Apply variable based on property and category
              const applied = await applyVariableToNode(node as SceneNode, variable, property, category);
              if (applied) {
                successCount++;
              } else {
                failCount++;
              }
            } catch (nodeError) {
              console.error(`Error applying variable to node ${nodeId}:`, nodeError);
              failCount++;
            }
          }

          // Send result back to UI
          figma.ui.postMessage({
            type: 'apply-token-result',
            success: true,
            successCount,
            failCount
          });

          // Show notification
          if (successCount > 0) {
            figma.notify(`✓ Applied token to ${successCount} node${successCount !== 1 ? 's' : ''}`);
          }
          if (failCount > 0) {
            figma.notify(`⚠ Failed to apply token to ${failCount} node${failCount !== 1 ? 's' : ''}`, { error: true });
          }

        } catch (applyError: any) {
          console.error('Error applying token:', applyError);
          figma.ui.postMessage({
            type: 'apply-token-result',
            success: false,
            error: applyError.message || 'Failed to apply token'
          });
          figma.notify(`✗ Error: ${applyError.message || 'Failed to apply token'}`, { error: true });
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
