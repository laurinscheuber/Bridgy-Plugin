import { PluginMessage, GitLabSettings } from "../types";
import { GitSettings } from "../types/git";
import { GitLabService } from "../services/gitlabService";
import { GitServiceFactory } from "../services/gitServiceFactory";
import { CSSExportService } from "../services/cssExportService";
import { ComponentService } from "../services/componentService";
import {SUCCESS_MESSAGES} from "../config";
import { objectEntries, objectValues } from "../utils/es2015-helpers";

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

          // Enhanced CSS selector theme parsing
          let lightModeId = collection.modes[0].modeId;
          let darkModeId: string | null = null;
          let themeModes = new Map<string, string>(); // theme name -> mode ID
          
          // Parse CSS selector themes and traditional theme variants
          const parseThemeInfo = (tokens: any[]) => {
            const themeSelectors = new Set<string>();
            const hasTraditionalThemes = tokens.some(token => {
              const name = token.name.toLowerCase();
              return (name.endsWith('-light') || name.endsWith('-dark') ||
                     name.endsWith('.light') || name.endsWith('.dark') ||
                     name.endsWith('_light') || name.endsWith('_dark') ||
                     name.includes('-light-') || name.includes('-dark-') ||
                     name.includes('_light_') || name.includes('_dark_')) &&
                     !name.match(/-\d+$/);
            });
            
            // Extract CSS selector themes from token metadata
            tokens.forEach(token => {
              if (token.selector && token.selector !== ':root') {
                themeSelectors.add(token.selector);
              }
            });
            
            return { themeSelectors, hasTraditionalThemes };
          };
          
          const { themeSelectors, hasTraditionalThemes } = parseThemeInfo(tokens);
          
          // Create modes for CSS selector themes
          if (themeSelectors.size > 0) {
            // Rename default mode if needed
            if (collection.modes[0].name === "Mode 1") {
              collection.renameMode(lightModeId, "Default");
            }
            
            // Create modes for each theme selector
            for (const selector of themeSelectors) {
              const themeName = extractThemeNameFromSelector(selector);
              if (themeName) {
                const existingMode = collection.modes.find(mode => 
                  mode.name.toLowerCase() === themeName.toLowerCase()
                );
                
                if (existingMode) {
                  themeModes.set(selector, existingMode.modeId);
                } else {
                  const newModeId = collection.addMode(themeName);
                  themeModes.set(selector, newModeId);
                  console.log("DEBUG: Created mode for selector:", selector, "->", themeName);
                }
              }
            }
          }
          
          // Handle traditional theme variants (for backward compatibility)
          if (hasTraditionalThemes && themeSelectors.size === 0) {
            if (collection.modes[0].name === "Mode 1") {
              collection.renameMode(lightModeId, "Light");
            }
            
            const darkMode = collection.modes.find(mode => mode.name.toLowerCase().includes('dark'));
            if (darkMode) {
              darkModeId = darkMode.modeId;
            } else {
              darkModeId = collection.addMode("Dark");
              console.log("DEBUG: Created dark mode for theme variants");
            }
          }
          
          // Helper function to extract theme name from CSS selector
          function extractThemeNameFromSelector(selector: string): string | null {
            // Match [data-theme="v2"], [data-theme='v3'], etc.
            const dataThemeMatch = selector.match(/\[data-theme=["']([^"']+)["']\]/);
            if (dataThemeMatch) {
              return dataThemeMatch[1];
            }
            
            // Match [theme="dark"], [mode="light"], etc.
            const genericMatch = selector.match(/\[(?:theme|mode)=["']([^"']+)["']\]/);
            if (genericMatch) {
              return genericMatch[1];
            }
            
            // Match .theme-dark, .mode-light, etc.
            const classMatch = selector.match(/\.(theme|mode)-([a-zA-Z0-9-_]+)/);
            if (classMatch) {
              return classMatch[2];
            }
            
            // Fallback: use selector as-is (cleaned up)
            return selector.replace(/[[\]"'=]/g, '').replace(/[^a-zA-Z0-9-_]/g, '-');
          }

          const modeId = lightModeId; // Default mode for non-themed tokens
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

          // Function to detect theme variant and get base name
          function getThemeInfo(tokenName: string): { 
            baseName: string; 
            theme: 'light' | 'dark' | 'neutral'; 
            modeId: string;
          } {
            const name = tokenName.toLowerCase();
            
            // Only detect actual theme variants, not color scale numbers
            if ((name.endsWith('-light') || name.endsWith('.light') || name.endsWith('_light') ||
                 name.includes('-light-') || name.includes('_light_')) &&
                !name.match(/-\d+$/)) {
              return {
                baseName: tokenName.replace(/[-._]light/i, ''),
                theme: 'light',
                modeId: lightModeId
              };
            }
            
            if ((name.endsWith('-dark') || name.endsWith('.dark') || name.endsWith('_dark') ||
                 name.includes('-dark-') || name.includes('_dark_')) &&
                !name.match(/-\d+$/)) {
              return {
                baseName: tokenName.replace(/[-._]dark/i, ''),
                theme: 'dark',
                modeId: darkModeId || lightModeId
              };
            }
            
            return {
              baseName: tokenName,
              theme: 'neutral',
              modeId: lightModeId
            };
          }

          // Enhanced function to group theme variants (including CSS selector themes)
          function groupThemeTokens(tokens: any[]): Map<string, Record<string, any>> {
            const groups = new Map<string, Record<string, any>>();
            
            for (const token of tokens) {
              let baseName: string;
              let themeKey: string;
              let targetModeId: string;
              
              if (token.selector && token.selector !== ':root') {
                // CSS selector theme (e.g., [data-theme="v2"])
                baseName = token.name;
                themeKey = token.selector;
                targetModeId = themeModes.get(token.selector) || lightModeId;
              } else {
                // Traditional theme variants (e.g., color-primary-light)
                const themeInfo = getThemeInfo(token.name);
                baseName = themeInfo.baseName;
                themeKey = themeInfo.theme;
                targetModeId = themeInfo.modeId;
              }
              
              if (!groups.has(baseName)) {
                groups.set(baseName, {});
              }
              
              const group = groups.get(baseName)!;
              group[themeKey] = { 
                ...token, 
                themeKey,
                targetModeId,
                isSelector: !!token.selector
              };
            }
            
            console.log("DEBUG: Grouped theme tokens:", Array.from(groups.entries()).map(([name, variants]) => ({
              name,
              variants: Object.keys(variants)
            })));
            
            return groups;
          }

          // Function to parse CSS gradient into Figma gradient paint
          function parseCSSGradient(cssGradient: string): Paint | null {
            try {
              // Parse linear-gradient
              const linearMatch = cssGradient.match(/linear-gradient\(([^)]+)\)/);
              if (linearMatch) {
                const gradientContent = linearMatch[1];
                
                // Parse direction (default to 180deg if not specified)
                let angle = 180; // Default direction (top to bottom)
                let colorStops: string[] = [];
                
                const parts = gradientContent.split(',').map(s => s.trim());
                
                // Check if first part is direction
                if (parts[0].includes('deg') || parts[0].includes('to ')) {
                  const directionPart = parts[0];
                  if (directionPart.includes('deg')) {
                    angle = parseFloat(directionPart);
                  } else if (directionPart === 'to top') {
                    angle = 0;
                  } else if (directionPart === 'to right') {
                    angle = 90;
                  } else if (directionPart === 'to bottom') {
                    angle = 180;
                  } else if (directionPart === 'to left') {
                    angle = 270;
                  }
                  colorStops = parts.slice(1);
                } else {
                  colorStops = parts;
                }
                
                // Parse color stops
                const gradientStops: ColorStop[] = [];
                
                for (let i = 0; i < colorStops.length; i++) {
                  const stop = colorStops[i].trim();
                  
                  // Extract color and position
                  const colorMatch = stop.match(/^(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb\([^)]+\)|rgba\([^)]+\)|[a-zA-Z]+)(\s+(\d+)%)?/);
                  if (colorMatch) {
                    const colorStr = colorMatch[1];
                    const position = colorMatch[3] ? parseFloat(colorMatch[3]) / 100 : i / (colorStops.length - 1);
                    
                    // Parse color to RGB
                    const color = parseColor(colorStr);
                    if (color) {
                      gradientStops.push({
                        color: color,
                        position: Math.max(0, Math.min(1, position))
                      });
                    }
                  }
                }
                
                // Ensure we have at least 2 stops
                if (gradientStops.length < 2) {
                  return null;
                }
                
                // Convert angle to Figma's gradient transform
                const radians = (angle * Math.PI) / 180;
                
                return {
                  type: 'GRADIENT_LINEAR',
                  gradientTransform: [
                    [Math.cos(radians), Math.sin(radians), 0],
                    [-Math.sin(radians), Math.cos(radians), 0]
                  ],
                  gradientStops: gradientStops
                };
              }
              
              // Parse radial-gradient
              const radialMatch = cssGradient.match(/radial-gradient\(([^)]+)\)/);
              if (radialMatch) {
                const gradientContent = radialMatch[1];
                const parts = gradientContent.split(',').map(s => s.trim());
                
                // For radial gradients, parse color stops (ignoring shape/size for simplicity)
                const gradientStops: ColorStop[] = [];
                
                for (let i = 0; i < parts.length; i++) {
                  const stop = parts[i].trim();
                  
                  // Skip shape/size definitions
                  if (stop.includes('circle') || stop.includes('ellipse') || stop.includes('at ')) {
                    continue;
                  }
                  
                  const colorMatch = stop.match(/^(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb\([^)]+\)|rgba\([^)]+\)|[a-zA-Z]+)(\s+(\d+)%)?/);
                  if (colorMatch) {
                    const colorStr = colorMatch[1];
                    const position = colorMatch[3] ? parseFloat(colorMatch[3]) / 100 : gradientStops.length / (parts.length - 1);
                    
                    const color = parseColor(colorStr);
                    if (color) {
                      gradientStops.push({
                        color: color,
                        position: Math.max(0, Math.min(1, position))
                      });
                    }
                  }
                }
                
                if (gradientStops.length >= 2) {
                  return {
                    type: 'GRADIENT_RADIAL',
                    gradientTransform: [[1, 0, 0], [0, 1, 0]],
                    gradientStops: gradientStops
                  };
                }
              }
              
              return null;
            } catch (error) {
              console.warn('Failed to parse gradient:', cssGradient, error);
              return null;
            }
          }

          // Function to parse CSS box-shadow into Figma effect
          function parseCSSBoxShadow(boxShadow: string): Effect | null {
            try {
              // Remove "inset" if present (Figma doesn't support inset shadows the same way)
              const isInset = boxShadow.includes('inset');
              const cleanShadow = boxShadow.replace('inset', '').trim();
              
              // Parse shadow values: offset-x | offset-y | blur-radius | spread-radius | color
              // Examples: 
              // "5px 5px 10px rgba(0,0,0,0.3)"
              // "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
              
              // Split by commas to handle multiple shadows (take first one for simplicity)
              const firstShadow = cleanShadow.split(',')[0].trim();
              
              // Regex to match shadow parts
              const shadowRegex = /(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)\s+(-?\d+(?:\.\d+)?px)(?:\s+(-?\d+(?:\.\d+)?px))?\s*(.*)/;
              const match = firstShadow.match(shadowRegex);
              
              if (match) {
                const [, xStr, yStr, blurStr, spreadStr, colorPart] = match;
                
                const x = parseFloat(xStr);
                const y = parseFloat(yStr);
                const blur = parseFloat(blurStr);
                // Note: Figma doesn't support spread radius directly, so we ignore it
                
                // Parse color
                let color: RGBA = { r: 0, g: 0, b: 0, a: 0.25 }; // Default shadow color
                if (colorPart && colorPart.trim()) {
                  const parsedColor = parseColor(colorPart.trim());
                  if (parsedColor) {
                    color = parsedColor;
                  }
                }
                
                return {
                  type: isInset ? 'INNER_SHADOW' : 'DROP_SHADOW',
                  color: color,
                  offset: { x, y },
                  radius: blur,
                  visible: true,
                  blendMode: 'NORMAL'
                };
              }
              
              return null;
            } catch (error) {
              console.warn('Failed to parse box shadow:', boxShadow, error);
              return null;
            }
          }

          // Function to detect CSS variable type and determine Figma variable type
          function detectVariableType(tokenName: string, tokenValue: string, tokenType?: string): { 
            figmaType: VariableResolvedDataType; 
            parsedValue: any; 
            isBindable: boolean;
          } {
            // If token type is already specified, use it
            if (tokenType === 'COLOR' || tokenType === 'RGBA_COLOR') {
              const color = parseColor(tokenValue);
              return {
                figmaType: 'COLOR',
                parsedValue: color,
                isBindable: true
              };
            }
            
            if (tokenType === 'NUMBER') {
              const numValue = parseFloat(tokenValue);
              return {
                figmaType: 'FLOAT',
                parsedValue: isNaN(numValue) ? 0 : numValue,
                isBindable: true
              };
            }

            // Auto-detect based on name patterns and value
            const name = tokenName.toLowerCase();
            const value = tokenValue.toString().toLowerCase().trim();

            // Color detection
            if (name.includes('color') || name.includes('bg') || name.includes('background') ||
                name.includes('border-color') || name.includes('text-color') ||
                value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl')) {
              const color = parseColor(tokenValue);
              if (color) {
                return {
                  figmaType: 'COLOR',
                  parsedValue: color,
                  isBindable: true
                };
              }
            }

            // Font family detection
            if (name.includes('font-family') || name.includes('fontfamily')) {
              return {
                figmaType: 'STRING',
                parsedValue: tokenValue.replace(/['"]/g, ''), // Remove quotes
                isBindable: true
              };
            }

            // Font weight detection
            if (name.includes('font-weight') || name.includes('fontweight')) {
              // Convert named weights to numbers
              let numValue: number;
              const weightStr = value.toLowerCase();
              
              switch (weightStr) {
                case 'thin': numValue = 100; break;
                case 'extra-light': case 'ultralight': numValue = 200; break;
                case 'light': numValue = 300; break;
                case 'normal': case 'regular': numValue = 400; break;
                case 'medium': numValue = 500; break;
                case 'semi-bold': case 'demibold': numValue = 600; break;
                case 'bold': numValue = 700; break;
                case 'extra-bold': case 'ultrabold': numValue = 800; break;
                case 'black': case 'heavy': numValue = 900; break;
                default:
                  numValue = parseInt(value) || 400;
              }
              
              return {
                figmaType: 'FLOAT',
                parsedValue: numValue,
                isBindable: true
              };
            }

            // Line height detection
            if (name.includes('line-height') || name.includes('lineheight')) {
              let numValue = parseFloat(value);
              
              // Handle unitless line-height (multiply by font size, assume 16px base)
              if (!value.includes('px') && !value.includes('rem') && !value.includes('em') && !value.includes('%')) {
                numValue = numValue * 16; // Convert unitless to pixels
              } else if (value.includes('rem')) {
                numValue *= 16;
              } else if (value.includes('em')) {
                numValue *= 16;
              } else if (value.includes('%')) {
                numValue = (numValue / 100) * 16; // Convert % to pixels
              }
              
              return {
                figmaType: 'FLOAT',
                parsedValue: isNaN(numValue) ? 24 : numValue,
                isBindable: true
              };
            }

            // Letter spacing detection
            if (name.includes('letter-spacing') || name.includes('letterspacing')) {
              let numValue = parseFloat(value);
              
              if (value.includes('rem')) {
                numValue *= 16;
              } else if (value.includes('em')) {
                numValue *= 16; // Rough conversion
              }
              // px values and unitless values are used as-is
              
              return {
                figmaType: 'FLOAT',
                parsedValue: isNaN(numValue) ? 0 : numValue,
                isBindable: true
              };
            }

            // Spacing/sizing detection (pixels, rem, em, etc.)
            if (name.includes('spacing') || name.includes('margin') || name.includes('padding') ||
                name.includes('width') || name.includes('height') || name.includes('size') ||
                name.includes('radius') || name.includes('border-width') ||
                value.match(/^\d+(\.\d+)?(px|rem|em|%)$/)) {
              
              // Convert to pixels if needed
              let numValue = parseFloat(value);
              if (value.includes('rem')) {
                numValue *= 16; // Assume 1rem = 16px
              } else if (value.includes('em')) {
                numValue *= 16; // Assume 1em = 16px for base calculation
              }
              // For % values, keep as-is since context varies
              
              return {
                figmaType: 'FLOAT',
                parsedValue: isNaN(numValue) ? 0 : numValue,
                isBindable: true
              };
            }

            // Font size detection
            if (name.includes('font-size') || name.includes('fontsize')) {
              let numValue = parseFloat(value);
              if (value.includes('rem')) {
                numValue *= 16;
              } else if (value.includes('em')) {
                numValue *= 16;
              }
              
              return {
                figmaType: 'FLOAT',
                parsedValue: isNaN(numValue) ? 16 : numValue,
                isBindable: true
              };
            }

            // Gradient detection - specifically for CSS gradients
            if (name.includes('gradient') || value.includes('linear-gradient') || 
                value.includes('radial-gradient') || value.includes('conic-gradient')) {
              return {
                figmaType: 'STRING',
                parsedValue: tokenValue,
                isBindable: false // Gradients become paint styles with bound variables
              };
            }

            // Shadow detection - specifically for box-shadow and drop-shadow
            if (name.includes('shadow') || value.includes('drop-shadow') || 
                value.match(/\d+px\s+\d+px\s+\d+px/)) {
              return {
                figmaType: 'STRING', 
                parsedValue: tokenValue,
                isBindable: false // Shadows become effect styles
              };
            }

            // Typography composite detection (multiple properties in one token)
            if (name.includes('typography') || name.includes('text-style') || 
                (value.includes('px') && (value.includes('bold') || value.includes('normal') || value.includes('italic')))) {
              return {
                figmaType: 'STRING',
                parsedValue: tokenValue,
                isBindable: false // Typography composites should become text styles
              };
            }

            // Other complex CSS values that should become styles instead of variables
            if (value.includes('blur') || value.includes('transition') || value.includes('transform')) {
              return {
                figmaType: 'STRING', // Fallback, but mark as non-bindable
                parsedValue: tokenValue,
                isBindable: false
              };
            }

            // String fallback for everything else
            return {
              figmaType: 'STRING',
              parsedValue: tokenValue.toString(),
              isBindable: true
            };
          }

          // Function to create variable aliases/references
          function createVariableAlias(referencedVariableName: string, existingVariables: Variable[]): VariableAlias | null {
            const referencedVar = existingVariables.find(v => v && v.name === referencedVariableName);
            if (referencedVar) {
              return figma.variables.createVariableAlias(referencedVar);
            }
            return null;
          }

          // Function to create or find color variable for gradient stop
          async function createOrFindColorVariable(
            colorStr: string, 
            variableName: string, 
            collection: VariableCollection,
            modeId: string,
            existingVariables: Variable[]
          ): Promise<Variable | null> {
            try {
              // Check if variable already exists
              const existingVar = existingVariables.find(v => v && v.name === variableName);
              if (existingVar && existingVar.resolvedType === 'COLOR') {
                return existingVar;
              }
              
              // Parse the color
              const color = parseColor(colorStr);
              if (!color) {
                return null;
              }
              
              // Create new color variable
              const colorVar = figma.variables.createVariable(variableName, collection, 'COLOR');
              colorVar.setValueForMode(modeId, { r: color.r, g: color.g, b: color.b });
              
              console.log("DEBUG: Created color variable for gradient stop:", variableName, color);
              return colorVar;
            } catch (error) {
              console.warn("DEBUG: Failed to create color variable:", variableName, error);
              return null;
            }
          }

          // Function to parse composite typography values
          function parseTypographyValue(typographyStr: string): any {
            const typography: any = {};
            
            // Common patterns:
            // "16px/1.5 'Inter', sans-serif" 
            // "bold 18px/24px 'Roboto'"
            // "normal 400 16px/1.4 'Open Sans', Arial"
            
            try {
              const parts = typographyStr.trim().split(/\s+/);
              
              for (let i = 0; i < parts.length; i++) {
                const part = parts[i].toLowerCase();
                
                // Font weight
                if (['normal', 'bold', 'bolder', 'lighter', 'thin', 'extra-light', 'light', 'medium', 'semi-bold', 'extra-bold', 'black'].indexOf(part) !== -1 ||
                    /^[1-9]00$/.test(part)) {
                  if (part === 'normal') typography.fontWeight = 400;
                  else if (part === 'bold') typography.fontWeight = 700;
                  else if (part === 'bolder') typography.fontWeight = 700;
                  else if (part === 'lighter') typography.fontWeight = 300;
                  else if (/^[1-9]00$/.test(part)) typography.fontWeight = parseInt(part);
                }
                
                // Font style
                if (['normal', 'italic', 'oblique'].indexOf(part) !== -1) {
                  typography.fontStyle = part;
                }
                
                // Font size with line height (16px/1.5 or 16px/24px)
                if (part.includes('/')) {
                  const [fontSize, lineHeight] = part.split('/');
                  if (fontSize.includes('px')) {
                    typography.fontSize = parseFloat(fontSize);
                  }
                  if (lineHeight) {
                    if (lineHeight.includes('px')) {
                      typography.lineHeight = parseFloat(lineHeight);
                    } else {
                      // Unitless line height
                      typography.lineHeight = parseFloat(lineHeight) * (typography.fontSize || 16);
                    }
                  }
                } else if (part.includes('px') && !typography.fontSize) {
                  // Standalone font size
                  typography.fontSize = parseFloat(part);
                }
                
                // Font family (quoted strings)
                if (part.includes("'") || part.includes('"')) {
                  const familyPart = parts.slice(i).join(' ');
                  const familyMatch = familyPart.match(/['"]([^'"]+)['"]/);
                  if (familyMatch) {
                    typography.fontFamily = familyMatch[1];
                    break; // Font family is usually the last part
                  }
                }
              }
              
              console.log("DEBUG: Parsed typography:", typographyStr, "->", typography);
              return typography;
            } catch (error) {
              console.warn("Failed to parse typography value:", typographyStr, error);
              return {};
            }
          }

          // Function to create text style with bound typography variables
          async function createTextStyleWithBoundVariables(
            styleName: string,
            typographyData: any,
            collection: VariableCollection,
            modeId: string,
            existingVariables: Variable[]
          ): Promise<{ textStyle: TextStyle | null; createdVars: Variable[] }> {
            try {
              const createdVars: Variable[] = [];
              
              // Create typography variables if they don't exist
              const createTypographyVariable = async (
                varName: string, 
                varType: VariableResolvedDataType, 
                value: any
              ): Promise<Variable | null> => {
                const existing = existingVariables.find(v => v && v.name === varName);
                if (existing && existing.resolvedType === varType) {
                  return existing;
                }
                
                const variable = figma.variables.createVariable(varName, collection, varType);
                variable.setValueForMode(modeId, value);
                createdVars.push(variable);
                console.log("DEBUG: Created typography variable:", varName, varType, value);
                return variable;
              };
              
              const textStyle = figma.createTextStyle();
              textStyle.name = styleName;
              textStyle.description = `Typography style with bound variables`;
              
              // Font family
              if (typographyData.fontFamily) {
                const fontFamilyVar = await createTypographyVariable(
                  `${styleName}-font-family`,
                  'STRING',
                  typographyData.fontFamily
                );
                if (fontFamilyVar) {
                  // Note: Figma doesn't yet support binding fontFamily to variables in the API
                  // but we create the variable for future use
                  console.log("DEBUG: Created font-family variable (not bindable yet):", fontFamilyVar.name);
                }
              }
              
              // Font size
              if (typographyData.fontSize) {
                const fontSizeVar = await createTypographyVariable(
                  `${styleName}-font-size`,
                  'FLOAT',
                  typographyData.fontSize
                );
                if (fontSizeVar) {
                  const fontSizeAlias = figma.variables.createVariableAlias(fontSizeVar);
                  textStyle.setBoundVariable('fontSize', fontSizeAlias as any);
                }
              }
              
              // Font weight
              if (typographyData.fontWeight) {
                await createTypographyVariable(
                  `${styleName}-font-weight`,
                  'FLOAT',
                  typographyData.fontWeight
                );
                // Note: fontWeight binding support varies, create variable for future use
              }
              
              // Line height
              if (typographyData.lineHeight) {
                const lineHeightVar = await createTypographyVariable(
                  `${styleName}-line-height`,
                  'FLOAT',
                  typographyData.lineHeight
                );
                if (lineHeightVar) {
                  const lineHeightAlias = figma.variables.createVariableAlias(lineHeightVar);
                  textStyle.setBoundVariable('lineHeight', lineHeightAlias as any);
                }
              }
              
              // Letter spacing
              if (typographyData.letterSpacing !== undefined) {
                const letterSpacingVar = await createTypographyVariable(
                  `${styleName}-letter-spacing`,
                  'FLOAT',
                  typographyData.letterSpacing
                );
                if (letterSpacingVar) {
                  const letterSpacingAlias = figma.variables.createVariableAlias(letterSpacingVar);
                  textStyle.setBoundVariable('letterSpacing', letterSpacingAlias as any);
                }
              }
              
              // Set default values for non-bound properties
              if (typographyData.fontSize) {
                textStyle.fontSize = typographyData.fontSize;
              }
              
              if (typographyData.lineHeight) {
                textStyle.lineHeight = { value: typographyData.lineHeight, unit: 'PIXELS' };
              }
              
              if (typographyData.letterSpacing !== undefined) {
                textStyle.letterSpacing = { value: typographyData.letterSpacing, unit: 'PIXELS' };
              }
              
              return { textStyle, createdVars };
            } catch (error) {
              console.warn('Failed to create text style with bound variables:', styleName, error);
              return { textStyle: null, createdVars: [] };
            }
          }

          // Function to create gradient with bound color variables
          async function createGradientWithBoundColors(
            cssGradient: string, 
            gradientName: string,
            collection: VariableCollection,
            modeId: string,
            existingVariables: Variable[]
          ): Promise<{ paint: GradientPaint | null; createdVars: Variable[] }> {
            try {
              const createdVars: Variable[] = [];
              
              // Parse linear-gradient
              const linearMatch = cssGradient.match(/linear-gradient\(([^)]+)\)/);
              if (linearMatch) {
                const gradientContent = linearMatch[1];
                
                // Parse direction (default to 180deg if not specified)
                let angle = 180;
                let colorStops: string[] = [];
                
                const parts = gradientContent.split(',').map(s => s.trim());
                
                // Check if first part is direction
                if (parts[0].includes('deg') || parts[0].includes('to ')) {
                  const directionPart = parts[0];
                  if (directionPart.includes('deg')) {
                    angle = parseFloat(directionPart);
                  } else if (directionPart === 'to top') {
                    angle = 0;
                  } else if (directionPart === 'to right') {
                    angle = 90;
                  } else if (directionPart === 'to bottom') {
                    angle = 180;
                  } else if (directionPart === 'to left') {
                    angle = 270;
                  }
                  colorStops = parts.slice(1);
                } else {
                  colorStops = parts;
                }
                
                // Parse color stops and create bound variables
                const gradientStops: ColorStop[] = [];
                
                for (let i = 0; i < colorStops.length; i++) {
                  const stop = colorStops[i].trim();
                  
                  // Extract color and position
                  const colorMatch = stop.match(/^(#[a-fA-F0-9]{6}|#[a-fA-F0-9]{3}|rgb\([^)]+\)|rgba\([^)]+\)|[a-zA-Z]+)(\s+(\d+)%)?/);
                  if (colorMatch) {
                    const colorStr = colorMatch[1];
                    const position = colorMatch[3] ? parseFloat(colorMatch[3]) / 100 : i / (colorStops.length - 1);
                    
                    // Create variable name for this color stop
                    const colorVarName = `${gradientName}-stop-${i + 1}`;
                    
                    // Create or find color variable
                    const colorVar = await createOrFindColorVariable(
                      colorStr, 
                      colorVarName, 
                      collection, 
                      modeId, 
                      existingVariables
                    );
                    
                    if (colorVar) {
                      createdVars.push(colorVar);
                      
                      // Parse fallback color for the stop
                      const fallbackColor = parseColor(colorStr);
                      
                      gradientStops.push({
                        color: fallbackColor || { r: 0.5, g: 0.5, b: 0.5, a: 1 },
                        position: Math.max(0, Math.min(1, position)),
                        boundVariables: {
                          color: {
                            type: 'VARIABLE_ALIAS',
                            id: colorVar.id
                          }
                        }
                      });
                    }
                  }
                }
                
                // Ensure we have at least 2 stops
                if (gradientStops.length < 2) {
                  return { paint: null, createdVars };
                }
                
                // Convert angle to Figma's gradient transform
                const radians = (angle * Math.PI) / 180;
                
                const gradientPaint: GradientPaint = {
                  type: 'GRADIENT_LINEAR',
                  gradientTransform: [
                    [Math.cos(radians), Math.sin(radians), 0],
                    [-Math.sin(radians), Math.cos(radians), 0]
                  ],
                  gradientStops: gradientStops
                };
                
                return { paint: gradientPaint, createdVars };
              }
              
              return { paint: null, createdVars };
            } catch (error) {
              console.warn('Failed to create gradient with bound colors:', cssGradient, error);
              return { paint: null, createdVars: [] };
            }
          }

          // Function to parse color string to Figma RGBA color
          function parseColor(colorStr: string): RGBA | null {
            try {
              colorStr = colorStr.trim();
              
              // Handle hex colors
              if (colorStr.startsWith('#')) {
                const hex = colorStr.slice(1);
                let r: number, g: number, b: number;
                
                if (hex.length === 3) {
                  r = parseInt(hex[0] + hex[0], 16) / 255;
                  g = parseInt(hex[1] + hex[1], 16) / 255;
                  b = parseInt(hex[2] + hex[2], 16) / 255;
                } else if (hex.length === 6) {
                  r = parseInt(hex.slice(0, 2), 16) / 255;
                  g = parseInt(hex.slice(2, 4), 16) / 255;
                  b = parseInt(hex.slice(4, 6), 16) / 255;
                } else {
                  return null;
                }
                
                return { r, g, b, a: 1 };
              }
              
              // Handle rgb/rgba colors
              const rgbMatch = colorStr.match(/rgba?\(([^)]+)\)/);
              if (rgbMatch) {
                const values = rgbMatch[1].split(',').map(v => v.trim());
                const r = parseInt(values[0]) / 255;
                const g = parseInt(values[1]) / 255;
                const b = parseInt(values[2]) / 255;
                const a = values[3] ? parseFloat(values[3]) : 1;
                return { r, g, b, a };
              }
              
              // Handle named colors (basic set)
              const namedColors: Record<string, RGBA> = {
                'red': { r: 1, g: 0, b: 0, a: 1 },
                'green': { r: 0, g: 1, b: 0, a: 1 },
                'blue': { r: 0, g: 0, b: 1, a: 1 },
                'white': { r: 1, g: 1, b: 1, a: 1 },
                'black': { r: 0, g: 0, b: 0, a: 1 },
                'transparent': { r: 0, g: 0, b: 0, a: 0 }
              };
              
              return namedColors[colorStr.toLowerCase()] || null;
            } catch (error) {
              console.warn('Failed to parse color:', colorStr, error);
              return null;
            }
          }

          // Separate tokens by their suitability for variables vs styles
          const allTokensWithTypes = tokens.map(token => ({
            ...token,
            detection: detectVariableType(token.name, token.value, token.type)
          }));

          const variableTokens = allTokensWithTypes.filter(token => token.detection.isBindable);
          const styleTokens = allTokensWithTypes.filter(token => !token.detection.isBindable);

          console.log("DEBUG: Starting import with enhanced token detection:", {
            total: tokens.length,
            variables: variableTokens.length, 
            styles: styleTokens.length,
            breakdown: {
              color: variableTokens.filter(t => t.detection.figmaType === 'COLOR').length,
              number: variableTokens.filter(t => t.detection.figmaType === 'FLOAT').length,
              string: variableTokens.filter(t => t.detection.figmaType === 'STRING').length
            }
          });

          // Get existing variables for alias resolution
          const existingVariables = await Promise.all(
            collection.variableIds.map((id: string) => figma.variables.getVariableByIdAsync(id))
          );
          const validExistingVariables = existingVariables.filter(v => v !== null) as Variable[];

          // Group theme variants for multi-mode support
          const themeGroups = groupThemeTokens(variableTokens);
          
          // Import variable tokens with enhanced theme support
          for (const [baseName, variants] of themeGroups.entries()) {
            console.log("DEBUG: Processing theme group:", baseName, "variants:", Object.keys(variants));

            try {
              // Find primary token for variable creation (prefer :root, neutral, or first available)
              const primaryToken = variants[':root'] || variants['neutral'] || 
                                 objectValues(variants)[0];
              if (!primaryToken) continue;

              const existingVariable = validExistingVariables.find(v => v.name === baseName);

              if (existingVariable && !options.overwriteExisting) {
                console.log("DEBUG: Skipping existing variable:", baseName);
                continue;
              }

              let variable: Variable;
              if (existingVariable && options.overwriteExisting) {
                console.log("DEBUG: Overwriting existing variable:", baseName);
                variable = existingVariable;
              } else {
                console.log("DEBUG: Creating new variable:", baseName, "type:", primaryToken.detection.figmaType);
                variable = figma.variables.createVariable(baseName, collection, primaryToken.detection.figmaType);
              }

              // Process variant values for all modes
              const processVariant = async (variant: any, targetModeId: string) => {
                let value = variant.detection.parsedValue;
                
                // Handle variable aliases (references to other variables)
                if (variant.isAlias && variant.references && variant.references.length > 0) {
                  const referencedVarName = variant.references[0];
                  console.log("DEBUG: Looking for referenced variable:", referencedVarName);
                  
                  const aliasValue = createVariableAlias(referencedVarName, validExistingVariables);
                  if (aliasValue) {
                    console.log("DEBUG: Created variable alias for:", referencedVarName);
                    value = aliasValue;
                  } else {
                    console.warn("DEBUG: Referenced variable not found:", referencedVarName, "using parsed value");
                    value = variant.detection.parsedValue;
                  }
                } else {
                  value = variant.detection.parsedValue;
                }

                console.log("DEBUG: Setting value for mode:", targetModeId, "value:", value);
                variable.setValueForMode(targetModeId, value);
              };

              // Set values for all available modes
              for (const [variantKey, variant] of objectEntries(variants)) {
                if (variant && variant.targetModeId) {
                  await processVariant(variant, variant.targetModeId);
                  console.log("DEBUG: Set value for variant:", variantKey, "mode:", variant.targetModeId);
                }
              }

              // Handle legacy light/dark mode logic (for backward compatibility)
              if (!objectValues(variants).some(v => v?.isSelector)) {
                // Traditional theme variants
                if (variants.light) {
                  await processVariant(variants.light, lightModeId);
                } else if (variants.neutral) {
                  await processVariant(variants.neutral, lightModeId);
                }

                if (darkModeId) {
                  if (variants.dark) {
                    await processVariant(variants.dark, darkModeId);
                  } else if (variants.light) {
                    await processVariant(variants.light, darkModeId);
                  } else if (variants.neutral) {
                    await processVariant(variants.neutral, darkModeId);
                  }
                }
              }
              
              // Add variable to appropriate group based on base name
              const groupName = extractGroupFromTokenName(baseName);
              if (!createdGroups.has(groupName)) {
                variable.name = `${groupName}/${baseName}`;
                createdGroups.add(groupName);
                console.log("DEBUG: Created group:", groupName, "for variable:", variable.name);
              } else {
                variable.name = `${groupName}/${baseName}`;
                console.log("DEBUG: Added to existing group:", groupName, "variable:", variable.name);
              }
              
              importedCount++;
              console.log("DEBUG: Successfully created multi-mode variable:", baseName, "importedCount:", importedCount);

            } catch (tokenError: any) {
              console.error(`DEBUG: Failed to import token group ${baseName}:`, tokenError);
            }
          }

          // Import style tokens as Figma styles
          for (const token of styleTokens) {
            console.log("DEBUG: Processing style token:", token);

            try {
              const styleName = token.name;

              // Use detection system to determine style type
              const tokenValue = token.value || token.detection.parsedValue;
              const tokenName = token.name.toLowerCase();
              
              if (tokenName.includes('gradient') || tokenValue.includes('linear-gradient') || 
                  tokenValue.includes('radial-gradient')) {
                // Create gradient with bound color variables
                const gradientResult = await createGradientWithBoundColors(
                  tokenValue,
                  styleName,
                  collection,
                  modeId,
                  validExistingVariables
                );
                
                if (gradientResult.paint) {
                  // Create paint style with bound color variables
                  const paintStyle = figma.createPaintStyle();
                  paintStyle.name = styleName;
                  paintStyle.description = `Imported gradient with ${gradientResult.createdVars.length} bound color variables: ${tokenValue}`;
                  paintStyle.paints = [gradientResult.paint];
                  
                  // Update existing variables list with new color variables
                  validExistingVariables.push(...gradientResult.createdVars);
                  
                  createdStyles.paint++;
                  console.log("DEBUG: Created gradient with bound colors:", styleName, "color vars:", gradientResult.createdVars.length);
                } else {
                  // Fallback to basic gradient parsing if bound colors fail
                  const paintStyle = figma.createPaintStyle();
                  paintStyle.name = styleName;
                  paintStyle.description = `Imported gradient (fallback): ${tokenValue}`;
                  
                  const gradientPaint = parseCSSGradient(tokenValue);
                  if (gradientPaint) {
                    paintStyle.paints = [gradientPaint];
                  } else {
                    paintStyle.paints = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.9 } }];
                  }
                  
                  createdStyles.paint++;
                  console.log("DEBUG: Created basic gradient style (fallback):", styleName);
                }

              } else if (tokenName.includes('shadow') || tokenValue.includes('drop-shadow') || 
                         tokenValue.match(/\d+px\s+\d+px\s+\d+px/)) {
                // Create effect style for shadows
                const effectStyle = figma.createEffectStyle();
                effectStyle.name = styleName;
                effectStyle.description = `Imported shadow: ${tokenValue}`;
                
                // Enhanced shadow parsing to handle colors and spread
                const shadowEffect = parseCSSBoxShadow(tokenValue);
                if (shadowEffect) {
                  effectStyle.effects = [shadowEffect];
                }
                createdStyles.effect++;
                console.log("DEBUG: Created effect style for shadow:", styleName);

              } else if (tokenName.includes('blur') || tokenValue.includes('blur(')) {
                // Create effect style for blur
                const effectStyle = figma.createEffectStyle();
                effectStyle.name = styleName;
                effectStyle.description = `Imported blur: ${tokenValue}`;
                
                const blurMatch = tokenValue.match(/blur\((\d+)px\)/);
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
              } else {
                console.log("DEBUG: Skipping unrecognized style token:", styleName, "value:", tokenValue);
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
