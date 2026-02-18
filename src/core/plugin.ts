import { PluginMessage, GitLabSettings } from '../types';
import { GitSettings } from '../types/git';
import { GitLabService } from '../services/gitlabService';
import { GitServiceFactory } from '../services/gitServiceFactory';
import { CSSExportService } from '../services/cssExportService';
import { ComponentService } from '../services/componentService';
import { TokenCoverageService } from '../services/tokenCoverageService';
import { VariableImportService } from '../services/variableImportService';
import { SUCCESS_MESSAGES } from '../config';
import { objectEntries, objectValues } from '../utils/es2015-helpers';

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 650, height: 900, themeColors: true });

// Store component data for later use
const componentMap = new Map<string, any>();

// Collect all variables and components from the document
async function collectDocumentData() {
  try {
    // 1. Count Usages First (Async)
    const usageMap = new Map<string, number>();
    try {
      const usageNodes = figma.currentPage.findAll((node) => true);
      for (const node of usageNodes) {
        // Check bound variables
        if ('boundVariables' in node && node.boundVariables) {
          const bounds = node.boundVariables as any; // Type casting for easier access
          for (const key in bounds) {
            const val = bounds[key];
            if (val) {
              if (Array.isArray(val)) {
                val.forEach((v: any) => {
                  if (v.type === 'VARIABLE_ALIAS') {
                    usageMap.set(v.id, (usageMap.get(v.id) || 0) + 1);
                  }
                });
              } else if (val.type === 'VARIABLE_ALIAS') {
                usageMap.set(val.id, (usageMap.get(val.id) || 0) + 1);
              }
            }
          }
        }

        // Check styles
        const checkStyle = (styleId: any) => {
          if (typeof styleId === 'string' && styleId.length > 0) {
            usageMap.set(styleId, (usageMap.get(styleId) || 0) + 1);
          }
        };

        if ('fillStyleId' in node) checkStyle(node.fillStyleId);
        if ('strokeStyleId' in node) checkStyle(node.strokeStyleId);
        if ('textStyleId' in node) checkStyle(node.textStyleId);
        if ('effectStyleId' in node) checkStyle(node.effectStyleId);
        if ('gridStyleId' in node) checkStyle(node.gridStyleId);
      }
    } catch (e) {
      console.warn('Error counting usages:', e);
    }

    // Collection variables
    const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
    const variablesData = [];

    // Sort collections alphabetically by name
    const sortedCollections = variableCollections.sort((a, b) => a.name.localeCompare(b.name));

    for (const collection of sortedCollections) {
      const variablesPromises = collection.variableIds.map(async (id) => {
        const variable = await figma.variables.getVariableByIdAsync(id);
        if (!variable) return null;

        const valuesByModeEntries = [];

        // Handle valuesByMode in a TypeScript-friendly way
        Object.keys(variable.valuesByMode).forEach((modeId) => {
          const value = variable.valuesByMode[modeId];
          const mode = collection.modes.find((m) => m.modeId === modeId);
          valuesByModeEntries.push({
            modeName: mode ? mode.name : 'Unknown',
            value: value,
          });
        });

        return {
          id: variable.id,
          name: variable.name,
          resolvedType: variable.resolvedType,
          valuesByMode: valuesByModeEntries,
          usageCount: usageMap.get(variable.id) || 0,
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
      effectStyles: [],
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
        usageCount: usageMap.get(textStyle.id) || 0,
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
        usageCount: usageMap.get(paintStyle.id) || 0,
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
        usageCount: usageMap.get(effectStyle.id) || 0,
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
        usageCount: usageMap.get(gridStyle.id) || 0,
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
    variablesData.forEach((collection) => {
      collection.variables.forEach((variable) => {
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
        for (const col of variablesData) {
          const local = col.variables.find((v) => v.id === id);
          if (local) {
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
      type: 'document-data',
      variablesData,
      variableReferences, // Send the lookup map
      stylesData,
      componentsData: componentsData || [],
      feedbackDismissed: !!feedbackDismissed,
    });

    // Return the data for internal use
    return {
      variables: variablesData,
      styles: stylesData,
      components: componentsData || [],
    };
  } catch (error) {
    console.error('Error collecting document data:', error);

    // Send error to UI so user knows something went wrong
    figma.ui.postMessage({
      type: 'document-data-error',
      error: error instanceof Error ? error.message : 'Unknown error during data collection',
      variablesData: [], // Send empty arrays as fallback
      componentsData: [],
    });

    // Return empty data on error
    return {
      variables: [],
      components: [],
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
          type: 'git-settings-loaded',
          settings: settings,
        });
        return;
      }
    }

    // Fallback to old GitLab settings for backward compatibility
    const gitlabSettings = await GitLabService.loadSettings();
    if (gitlabSettings) {
      figma.ui.postMessage({
        type: 'gitlab-settings-loaded',
        settings: gitlabSettings,
      });
    }
  } catch (error) {
    console.error('Error loading Git settings:', error);
    // Silently fail - we'll just prompt the user for settings
  }
}

// Run the collection when the plugin starts
collectDocumentData();

// Load saved Git settings
loadSavedGitSettings();

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on('generate', (_event) => {
  try {
    return [
      {
        language: 'PLAINTEXT',
        code: 'Bridgy - Use the plugin interface to view variables and components',
        title: 'Bridgy',
      },
    ];
  } catch (error) {
    console.error('Plugin error:', error);
    return [
      {
        language: 'PLAINTEXT',
        code: 'Error occurred during code generation',
        title: 'Error',
      },
    ];
  }
});

/**
 * Helper to match paint color against a target value (hex or rgb string)
 */
function matchesTargetValue(paint: any, targetValue?: string): boolean {
  if (!targetValue) return true;
  if (!paint || !paint.color) return false;

  const { r, g, b } = paint.color;
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  const rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;

  // Normalize target value
  const target = targetValue.trim();

  // Check matches (case-insensitive for hex, precise for rgb string)
  return target.toUpperCase() === hex ||
    target === rgb ||
    target.replace(/\s/g, '') === rgb.replace(/\s/g, '');
}

/**
 * Helper function to apply a variable to a node property
 */
async function applyVariableToNode(
  node: SceneNode,
  variable: Variable,
  property: string,
  category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance',
  targetValue?: string,
): Promise<boolean> {
  try {
    // Map property names to Figma bindable properties
    const propertyMap: Record<string, string> = {
      Width: 'width',
      Height: 'height',
      'Min Width': 'minWidth',
      'Max Width': 'maxWidth',
      'Min Height': 'minHeight',
      'Max Height': 'maxHeight',
      Gap: 'itemSpacing',
      Padding: 'paddingLeft', // Will also set other padding properties
      'Padding Left': 'paddingLeft',
      'Padding Top': 'paddingTop',
      'Padding Right': 'paddingRight',
      'Padding Bottom': 'paddingBottom',
      'Fill Color': 'fills',
      'Stroke Color': 'strokes',
      'Stroke Weight': 'strokeWeight',
      Opacity: 'opacity',
      'Corner Radius': 'topLeftRadius', // Will also set other corner radii
      'Corner Radius (Top Left)': 'topLeftRadius',
      'Corner Radius (Top Right)': 'topRightRadius',
      'Corner Radius (Bottom Left)': 'bottomLeftRadius',
      'Corner Radius (Bottom Right)': 'bottomRightRadius',
    };

    const figmaProperty = propertyMap[property];
    if (!figmaProperty) {
      console.warn(`[BRIDGY] Unknown property: ${property}`);
      return false;
    }

    // Check if node supports this property
    if (!(figmaProperty in node)) {
      console.warn(
        `[BRIDGY] Node ${node.name} (${node.type}) does not support property: ${figmaProperty}`,
      );
      return false;
    }

    if (property === 'Padding') {
      const paddingNode = node as any;
      if ('paddingLeft' in paddingNode && typeof paddingNode.setBoundVariable === 'function') {
        paddingNode.setBoundVariable('paddingLeft', variable);
        paddingNode.setBoundVariable('paddingTop', variable);
        paddingNode.setBoundVariable('paddingRight', variable);
        paddingNode.setBoundVariable('paddingBottom', variable);
      }
    } else if (property === 'Corner Radius') {
      const radiusNode = node as any;
      if ('topLeftRadius' in radiusNode && typeof radiusNode.setBoundVariable === 'function') {
        radiusNode.setBoundVariable('topLeftRadius', variable);
        radiusNode.setBoundVariable('topRightRadius', variable);
        radiusNode.setBoundVariable('bottomLeftRadius', variable);
        radiusNode.setBoundVariable('bottomRightRadius', variable);
      }
    } else if (property === 'Fill Color') {
      const fillNode = node as any;
      if ('fills' in fillNode && Array.isArray(fillNode.fills) && fillNode.fills.length > 0) {
        const fills = [...fillNode.fills];
        // Find the first solid fill that doesn't have a color variable bound
        const solidFillIndex = fills.findIndex(
          (fill: any) =>
            fill &&
            fill.type === 'SOLID' &&
            fill.visible !== false &&
            (!fill.boundVariables || !fill.boundVariables.color) &&
            matchesTargetValue(fill, targetValue)
        );

        if (solidFillIndex !== -1) {
          const targetPaint: any = fills[solidFillIndex];
          const alias = figma.variables.createVariableAlias(variable);
          const nextBound = { ...(targetPaint.boundVariables || {}), color: alias };
          fills[solidFillIndex] = { ...targetPaint, boundVariables: nextBound };
          try {
            fillNode.fills = fills;
          } catch (err) {
            console.warn(`[BRIDGY] Failed to set fills on node ${fillNode.id}:`, err);
            throw err;
          }
        } else {
          console.warn(`[BRIDGY] No suitable solid fill found to apply color`);
        }
      } else {
        console.warn(`[BRIDGY] Node has no fills`);
      }
    } else if (property === 'Stroke Color') {
      const strokeNode = node as any;
      if (
        'strokes' in strokeNode &&
        Array.isArray(strokeNode.strokes) &&
        strokeNode.strokes.length > 0
      ) {
        const strokes = [...strokeNode.strokes];
        // Find the first solid stroke that doesn't have a color variable bound
        const solidStrokeIndex = strokes.findIndex(
          (stroke: any) =>
            stroke &&
            stroke.type === 'SOLID' &&
            stroke.visible !== false &&
            (!stroke.boundVariables || !stroke.boundVariables.color) &&
            matchesTargetValue(stroke, targetValue)
        );

        if (solidStrokeIndex !== -1) {
          const targetPaint: any = strokes[solidStrokeIndex];
          const alias = figma.variables.createVariableAlias(variable);
          const nextBound = { ...(targetPaint.boundVariables || {}), color: alias };
          strokes[solidStrokeIndex] = { ...targetPaint, boundVariables: nextBound };
          try {
            strokeNode.strokes = strokes;
          } catch (err) {
            console.warn(`[BRIDGY] Failed to set strokes on node ${strokeNode.id}:`, err);
            throw err;
          }
        } else {
          console.warn(`[BRIDGY] No suitable solid stroke found to apply color`);
        }
      }
    } else {
      // Apply to single property
      const bindableNode = node as any;
      if (typeof bindableNode.setBoundVariable === 'function') {
        // Fix for Width/Height binding issues:
        if (figmaProperty === 'width' && 'layoutSizingHorizontal' in bindableNode) {
          if (bindableNode.layoutSizingHorizontal !== 'FIXED') {
            try {
              bindableNode.layoutSizingHorizontal = 'FIXED';
            } catch (e) {
              console.warn(`Could not set layoutSizingHorizontal to FIXED:`, e);
            }
          }
        }

        if (figmaProperty === 'height' && 'layoutSizingVertical' in bindableNode) {
          if (bindableNode.layoutSizingVertical !== 'FIXED') {
            try {
              bindableNode.layoutSizingVertical = 'FIXED';
            } catch (e) {
              console.warn(`Could not set layoutSizingVertical to FIXED:`, e);
            }
          }
        }

        bindableNode.setBoundVariable(figmaProperty, variable);
      } else {
        console.warn(
          `[BRIDGY] Node ${node.name} has property ${figmaProperty} but NO setBoundVariable method`,
        );
        return false;
      }
    }

    return true;
  } catch (error: any) {
    console.error(`Error applying variable to node ${node.name} (${node.id}):`, error);
    return false;
  }
}

// Handle messages from the UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  // Message routing
  try {
    switch (msg.type) {
      case 'export-css':
        const format = msg.exportFormat || 'css';
        const cssContent = await CSSExportService.exportVariables(format);
        figma.ui.postMessage({
          type: 'css-export',
          cssData: cssContent,
          shouldDownload: msg.shouldDownload,
          exportFormat: format,
        });
        break;

      case 'generate-test':
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
          msg.includeStateTests !== false, // Default to true
        );
        figma.ui.postMessage({
          type: 'test-generated',
          componentName: msg.componentName || component.name,
          testContent: testContent,
          isComponentSet: component.type === 'COMPONENT_SET',
          forCommit: msg.forCommit,
        });
        break;

      case 'load-component-styles':
        if (!msg.componentId) {
          throw new Error(`Missing required component ID for loading styles`);
        }

        const targetComponent = ComponentService.getComponentById(msg.componentId);
        if (!targetComponent) {
          throw new Error(`Component with ID ${msg.componentId} not found`);
        }

        // Load component styles lazily
        const { styles, textElements } = await ComponentService.loadComponentDetails(
          msg.componentId,
        );

        figma.ui.postMessage({
          type: 'component-styles-loaded',
          componentId: msg.componentId,
          styles: styles || {},
          textElements: textElements || [],
        });
        break;

      case 'select-component':
        try {
          if (!msg.componentId) {
            throw new Error(`Missing required component ID for selection`);
          }

          const nodeToSelect = await figma.getNodeByIdAsync(msg.componentId);

          if (!nodeToSelect) {
            throw new Error(`Component with ID ${msg.componentId} not found`);
          }

          // Check if node is a scene node (can be selected)
          const isSceneNode = nodeToSelect.type !== 'DOCUMENT' && nodeToSelect.type !== 'PAGE';

          if (!isSceneNode) {
            throw new Error(
              `Node ${msg.componentId} is not a selectable scene node (type: ${nodeToSelect.type})`,
            );
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

          // Check if we need to switch pages
          const needsPageSwitch = containingPage && containingPage !== figma.currentPage;

          // Navigate to the correct page first if needed (use async method for dynamic-page access)
          if (needsPageSwitch && containingPage) {
            await figma.setCurrentPageAsync(containingPage);
          }

          // Select and navigate to the component
          figma.currentPage.selection = [nodeToSelect as SceneNode];
          figma.viewport.scrollAndZoomIntoView([nodeToSelect as SceneNode]);

          figma.ui.postMessage({
            type: 'component-selected',
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
            type: 'component-selection-error',
            componentId: msg.componentId,
            message: error.message || 'Failed to select component',
            pageName: errorPageName,
          });
        }
        break;

      case 'save-git-settings':
        const gitService = GitServiceFactory.getService(msg.provider || 'gitlab');

        const gitSettings: GitSettings = {
          provider: msg.provider || 'gitlab',
          baseUrl: msg.baseUrl,
          projectId: msg.projectId || '',
          token: msg.token,
          filePath: msg.filePath || 'src/variables.css',
          testFilePath: msg.testFilePath || 'components/{componentName}.spec.ts',
          strategy: msg.strategy || 'merge-request',
          branchName: msg.branchName || 'feature/variables',
          testBranchName: msg.testBranchName || 'feature/component-tests',
          exportFormat: msg.exportFormat || 'css',
          saveToken: msg.saveToken || false,
          savedAt: new Date().toISOString(),
          savedBy:
            figma.currentUser && figma.currentUser.name ? figma.currentUser.name : 'Unknown user',
        };

        if (typeof gitService.saveSettings !== 'function') {
          console.error('CRITICAL: gitService.saveSettings is not a function!', gitService);
          throw new Error(
            `Internal Error: Service for ${msg.provider} is not initialized correctly.`,
          );
        }

        await gitService.saveSettings(gitSettings, msg.shareWithTeam || false);

        figma.ui.postMessage({
          type: 'git-settings-saved',
          success: true,
          sharedWithTeam: msg.shareWithTeam,
          savedAt: gitSettings.savedAt,
          savedBy: gitSettings.savedBy,
        });
        break;

      case 'save-gitlab-settings':
        // Keep for backward compatibility
        await GitLabService.saveSettings(
          {
            gitlabUrl: msg.gitlabUrl,
            projectId: msg.projectId || '',
            gitlabToken: msg.gitlabToken,
            filePath: msg.filePath || 'src/variables.css',
            testFilePath: msg.testFilePath || 'components/{componentName}.spec.ts',
            strategy: msg.strategy || 'merge-request',
            branchName: msg.branchName || 'feature/variables',
            testBranchName: msg.testBranchName || 'feature/component-tests',
            exportFormat: msg.exportFormat || 'css',
            saveToken: msg.saveToken || false,
            savedAt: new Date().toISOString(),
            savedBy:
              figma.currentUser && figma.currentUser.name ? figma.currentUser.name : 'Unknown user',
          },
          msg.shareWithTeam || false,
        );

        figma.ui.postMessage({
          type: 'gitlab-settings-saved',
          success: true,
          sharedWithTeam: msg.shareWithTeam,
          savedAt: new Date().toISOString(), // We need to match what was saved
          savedBy:
            figma.currentUser && figma.currentUser.name ? figma.currentUser.name : 'Unknown user',
        });
        break;

      case 'list-repositories':
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
            savedBy: '',
          };

          const repositories = await listService.listRepositories(tempSettings);

          figma.ui.postMessage({
            type: 'repositories-loaded',
            repositories: repositories,
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: 'repositories-error',
            error: error.message || 'Failed to load repositories',
          });
        }
        break;

      case 'list-branches':
        try {
          if (msg.provider !== 'github') {
            throw new Error('Branch listing is currently only supported for GitHub repositories');
          }

          const { GitHubService } = await import('../services/githubService');
          const githubService = new GitHubService();
          const branchSettings: GitSettings = {
            provider: 'github',
            baseUrl: '',
            projectId: msg.projectId || '',
            token: msg.token,
            filePath: '',
            saveToken: false,
            savedAt: '',
            savedBy: '',
          };

          const branches = await githubService.listBranches(branchSettings);

          figma.ui.postMessage({
            type: 'branches-loaded',
            branches: branches,
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: 'branches-error',
            error: error.message || 'Failed to load branches',
          });
        }
        break;

      case 'check-oauth-status':
        try {
          const { OAuthService } = await import('../services/oauthService');
          const status = OAuthService.getOAuthStatus();

          figma.ui.postMessage({
            type: 'oauth-status',
            status: status,
          });
        } catch (error: any) {
          console.error('Error checking OAuth status:', error);
          figma.ui.postMessage({
            type: 'oauth-status',
            status: {
              available: false,
              configured: false,
              message: 'OAuth service unavailable',
            },
          });
        }
        break;

      case 'get-component-usage':
        try {
          console.log('Counting component usage...');
          const usageMap: Record<string, number> = {};

          // STRATEGY: Local Components Only
          // 1. Find all local component definitions (Component and ComponentSet)
          // 2. Find all instances
          // 3. Map instances to local definitions synchronously

          // Ensure all pages are loaded for accurate stats
          await figma.loadAllPagesAsync();

          const localDefinitions = new Map<
            string,
            {
              node: ComponentNode | ComponentSetNode;
              name: string;
              isSet: boolean;
              instances: any[];
            }
          >();

          // Helper to map variant IDs to their Set ID
          const variantToSetId = new Map<string, string>();

          // 1. Scan Definitions & Instances (Document wide)
          const localNodes: (ComponentNode | ComponentSetNode)[] = [];
          const allInstances: InstanceNode[] = [];

          // Iterate through all pages to gather comprehensive stats
          for (const page of figma.root.children) {
            // If pageIds are provided, only count usage from those pages (empty array means scan all)
            if (msg.pageIds && msg.pageIds.length > 0 && msg.pageIds.indexOf(page.id) === -1) {
              continue;
            }

            // Find definitions using criteria (faster)
            const pageDefs = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
            localNodes.push(...pageDefs);

            // Find instances
            const pageInstances = page.findAllWithCriteria({ types: ['INSTANCE'] });
            allInstances.push(...pageInstances);
          }

          // 2. Process Definitions
          for (const node of localNodes) {
            if (node.type === 'COMPONENT_SET') {
              localDefinitions.set(node.id, {
                node: node as ComponentSetNode,
                name: node.name,
                isSet: true,
                instances: [],
              });

              // Map children ID to Set ID
              for (const child of (node as ComponentSetNode).children) {
                if (child.type === 'COMPONENT') {
                  variantToSetId.set(child.id, node.id);
                }
              }
            } else if (node.type === 'COMPONENT') {
              // Only add standalone components (if they are not part of a set)
              if (!node.parent || node.parent.type !== 'COMPONENT_SET') {
                localDefinitions.set(node.id, {
                  node: node as ComponentNode,
                  name: node.name,
                  isSet: false,
                  instances: [],
                });
              }
            }
          }

          // 3. Match Instances to Definitions
          console.log(`Analyzing ${allInstances.length} instances against ${localDefinitions.size} local definitions...`);

          for (const instance of allInstances) {
            // Use getMainComponentAsync to avoid hygiene errors with dynamic pages
            let mainId: string | undefined;

            try {
              const mainComponent = await (instance as InstanceNode).getMainComponentAsync();
              if (mainComponent) {
                mainId = mainComponent.id;
              }
            } catch (e) {
              // Ignore error, skip instance
            }

            if (!mainId) continue;

            // Determine target ID (Handle Variants)
            let targetId = mainId;
            if (variantToSetId.has(mainId)) {
              targetId = variantToSetId.get(mainId);
            }

            // Check if it's a known local component
            if (localDefinitions.has(targetId)) {
              const def = localDefinitions.get(targetId);

              // Get parent name for context
              let parentName = 'Page';
              if (instance.parent) {
                parentName = instance.parent.name;
              }

              def.instances.push({
                id: instance.id,
                name: instance.name, // Instance name might differ from component name
                parentName: parentName,
              });
            }
          }

          // 4. Format for UI
          const statsData = Array.from(localDefinitions.values())
            .map((def) => ({
              id: def.node.id,
              name: def.name,
              type: def.isSet ? 'COMPONENT_SET' : 'COMPONENT',
              count: def.instances.length,
              variantCount: def.isSet ? (def.node as ComponentSetNode).children.length : 1,
              instances: def.instances,
            }))
            .sort((a, b) => b.count - a.count); // Sort by usage count descending

          console.log(`Stats generated. Found ${statsData.length} definitions.`);

          figma.ui.postMessage({
            type: 'component-stats-data',
            stats: statsData,
          });
        } catch (err) {
          console.error('Error generating stats:', err);
          figma.ui.postMessage({
            type: 'component-stats-error',
            error: (err as Error).message,
          });
        }
        break;

      case 'analyze-component-hygiene':
        try {
          console.log('Analyzing component hygiene...');

          // Ensure all pages are loaded
          await figma.loadAllPagesAsync();

          const localDefinitions = new Map<
            string,
            {
              node: ComponentNode | ComponentSetNode;
              name: string;
              isSet: boolean;
              instances: any[];
            }
          >();

          const variantToSetId = new Map<string, string>();
          const localNodes: (ComponentNode | ComponentSetNode)[] = [];
          const allInstances: InstanceNode[] = [];

          // Scan all pages for components and instances
          for (const page of figma.root.children) {
            // Apply scoping if pageIds are provided (empty array means scan all pages)
            if (msg.pageIds && msg.pageIds.length > 0 && msg.pageIds.indexOf(page.id) === -1) {
              continue;
            }

            const pageDefs = page.findAllWithCriteria({ types: ['COMPONENT', 'COMPONENT_SET'] });
            localNodes.push(...pageDefs);

            const pageInstances = page.findAllWithCriteria({ types: ['INSTANCE'] });
            allInstances.push(...pageInstances);
          }

          // Process component definitions
          // Track individual variants within component sets
          const variantUsage = new Map<string, { name: string; parentId: string; instances: any[] }>();

          for (const node of localNodes) {
            if (node.type === 'COMPONENT_SET') {
              localDefinitions.set(node.id, {
                node: node as ComponentSetNode,
                name: node.name,
                isSet: true,
                instances: [],
              });

              // Track each variant individually
              for (const child of (node as ComponentSetNode).children) {
                if (child.type === 'COMPONENT') {
                  variantToSetId.set(child.id, node.id);
                  variantUsage.set(child.id, {
                    name: child.name,
                    parentId: node.id,
                    instances: [],
                  });
                }
              }
            } else if (node.type === 'COMPONENT') {
              if (!node.parent || node.parent.type !== 'COMPONENT_SET') {
                localDefinitions.set(node.id, {
                  node: node as ComponentNode,
                  name: node.name,
                  isSet: false,
                  instances: [],
                });
              }
            }
          }

          // Match instances to definitions
          for (const instance of allInstances) {
            // Use getMainComponentAsync to avoid hygiene errors with dynamic pages
            let mainId: string | undefined;

            try {
              const mainComponent = await (instance as InstanceNode).getMainComponentAsync();
              if (mainComponent) {
                mainId = mainComponent.id;
              }
            } catch (e) {
              // Component may be from external library or deleted
              // Log for debugging but continue processing other instances
              console.warn(`Unable to resolve main component for instance ${instance.id}:`, e);
            }

            if (!mainId) continue;

            // Track variant usage
            if (variantUsage.has(mainId)) {
              const variantInfo = variantUsage.get(mainId);
              variantInfo.instances.push({ id: instance.id });
            }

            // Track component set usage
            let targetId = mainId;
            if (variantToSetId.has(mainId)) {
              targetId = variantToSetId.get(mainId);
            }

            if (localDefinitions.has(targetId)) {
              const def = localDefinitions.get(targetId);
              def.instances.push({ id: instance.id });
            }
          }

          // Find components with no instances (unused components)
          const unusedComponents: any[] = [];

          console.log(`DEBUG: Analysis Scope: ${localDefinitions.size} definitions, ${allInstances.length} instances.`);
          console.log(`DEBUG: Variant Usage Map size: ${variantUsage.size}`);


          for (const [id, def] of localDefinitions.entries()) {
            if (def.isSet) {
              // For component sets, check individual variant usage
              const componentSet = def.node as ComponentSetNode;
              const variants = componentSet.children.filter(child => child.type === 'COMPONENT');
              const unusedVariants: any[] = [];
              const totalVariants = variants.length;
              let unusedVariantCount = 0;

              for (const variant of variants) {
                const variantInfo = variantUsage.get(variant.id);
                if (variantInfo && variantInfo.instances.length === 0) {
                  unusedVariantCount++;
                  unusedVariants.push({
                    id: variant.id,
                    name: variant.name,
                  });
                }
              }

              // Only include component sets that have at least one unused variant
              if (unusedVariantCount > 0) {
                unusedComponents.push({
                  id: componentSet.id,
                  name: componentSet.name,
                  type: 'COMPONENT_SET',
                  totalVariants: totalVariants,
                  unusedVariantCount: unusedVariantCount,
                  isFullyUnused: unusedVariantCount === totalVariants,
                  unusedVariants: unusedVariants,
                });
              }
            } else {
              // Regular component (not in a set)
              if (def.instances.length === 0) {
                unusedComponents.push({
                  id: def.node.id,
                  name: def.name,
                  type: 'COMPONENT',
                  isFullyUnused: true,
                });
              }
            }
          }

          const totalComponents = localDefinitions.size;
          const unusedCount = unusedComponents.length;

          // Calculate deletable units for progress:
          // Each variant inside a component set counts as 1, each standalone component counts as 1
          let totalDeletableUnits = 0;
          let unusedDeletableUnits = 0;

          for (const [id, def] of localDefinitions.entries()) {
            if (def.isSet) {
              const set = def.node as ComponentSetNode;
              const variantCount = set.children.filter(c => c.type === 'COMPONENT').length;
              totalDeletableUnits += variantCount;
            } else {
              totalDeletableUnits += 1;
            }
          }

          for (const comp of unusedComponents) {
            if (comp.type === 'COMPONENT_SET') {
              unusedDeletableUnits += comp.unusedVariantCount || 0;
            } else {
              unusedDeletableUnits += 1;
            }
          }

          const hygieneScore = totalDeletableUnits === 0 ? 100 : Math.round(((totalDeletableUnits - unusedDeletableUnits) / totalDeletableUnits) * 100);

          console.log(`Component hygiene analysis complete. Found ${unusedDeletableUnits} unused deletable units out of ${totalDeletableUnits} total.`);

          if (unusedCount === 0 && totalComponents > 0) {
            console.log('DEBUG: 0 unused found. Dumping sample defs to check consistency:');
            // Check the first few defs to see if they have instances
            let i = 0;
            for (const [id, def] of localDefinitions.entries()) {
              if (i++ > 5) break;
              console.log(`Def ${def.name} (${def.node.type}): instances=${def.instances.length}`);
              if (def.isSet) {
                const set = def.node as ComponentSetNode;
                console.log(` - Variants: ${set.children.length}`);
              }
            }
          }

          figma.ui.postMessage({
            type: 'component-hygiene-result',
            result: {
              totalComponents,
              totalDeletableUnits,
              unusedComponents,
              unusedCount,
              unusedDeletableUnits,
              hygieneScore,
              subScores: { componentHygiene: hygieneScore },
            },
          });
        } catch (err) {
          console.error('Error analyzing component hygiene:', err);
          figma.ui.postMessage({
            type: 'component-hygiene-error',
            error: (err as Error).message,
          });
        }
        break;

      case 'analyze-variable-hygiene':
        try {
          console.log('Analyzing variable hygiene...');

          // Get all local variables
          const allVariables = await figma.variables.getLocalVariablesAsync();
          console.log(`Found ${allVariables.length} local variables`);

          if (allVariables.length === 0) {
            figma.ui.postMessage({
              type: 'variable-hygiene-result',
              result: {
                totalVariables: 0,
                unusedVariables: [],
                unusedCount: 0,
                hygieneScore: 100,
              },
              subScores: { variableHygiene: 100 },
            });
            break;
          }

          // Track which variables are used
          const variableUsage = new Map<string, { variable: Variable; usedBy: Set<string> }>();

          // Initialize usage tracking
          for (const variable of allVariables) {
            variableUsage.set(variable.id, {
              variable,
              usedBy: new Set(),
            });
          }

          // Check if variables are aliased by other variables
          for (const variable of allVariables) {
            for (const modeId of Object.keys(variable.valuesByMode)) {
              const value = variable.valuesByMode[modeId];

              // Check if this value is an alias to another variable
              if (value && typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
                const aliasedVarId = value.id;
                if (variableUsage.has(aliasedVarId)) {
                  variableUsage.get(aliasedVarId).usedBy.add(variable.id);
                }
              }
            }
          }

          // Load all pages to scan for variable usage
          await figma.loadAllPagesAsync();

          // Scan all nodes for variable bindings
          for (const page of figma.root.children) {
            // Apply scoping if pageIds are provided (empty array means scan all pages)
            if (msg.pageIds && msg.pageIds.length > 0 && msg.pageIds.indexOf(page.id) === -1) {
              continue;
            }

            const allNodes = page.findAll();

            for (const node of allNodes) {
              try {
                // Check all possible variable bindings on the node
                if ('boundVariables' in node && node.boundVariables) {
                  const boundVars = node.boundVariables as any;

                  // Iterate through all bound variable properties
                  for (const propKey of Object.keys(boundVars)) {
                    const binding = boundVars[propKey];
                    if (binding && typeof binding === 'object') {
                      // Handle single binding
                      if ('id' in binding) {
                        const varId = (binding as any).id;
                        if (variableUsage.has(varId)) {
                          variableUsage.get(varId).usedBy.add(node.id);
                        }
                      }
                      // Handle array of bindings (for gradients, effects, etc.)
                      else if (Array.isArray(binding)) {
                        for (const item of binding) {
                          if (item && typeof item === 'object' && 'id' in item) {
                            const varId = item.id;
                            if (variableUsage.has(varId)) {
                              variableUsage.get(varId).usedBy.add(node.id);
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } catch (nodeError) {
                // Some nodes might not support variable bindings, continue
                console.warn(`Could not check variable bindings for node ${node.id}:`, nodeError);
              }
            }
          }

          // Find unused variables
          const unusedVariables: any[] = [];

          for (const [varId, usage] of variableUsage.entries()) {
            if (usage.usedBy.size === 0) {
              const variable = usage.variable;
              const collection = await figma.variables.getVariableCollectionByIdAsync(
                variable.variableCollectionId,
              );

              // Get resolved value for the default mode
              const modeId = collection?.defaultModeId || Object.keys(variable.valuesByMode)[0];
              const varValue = variable.valuesByMode[modeId];
              let resolvedValue = '';

              if (
                variable.resolvedType === 'COLOR' &&
                typeof varValue === 'object' &&
                'r' in (varValue as any)
              ) {
                const color = varValue as { r: number; g: number; b: number; a?: number };
                resolvedValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
              } else if (variable.resolvedType === 'FLOAT') {
                resolvedValue = String(varValue);
              }

              unusedVariables.push({
                id: variable.id,
                name: variable.name,
                collectionId: variable.variableCollectionId,
                collectionName: collection?.name || 'Unknown Collection',
                resolvedType: variable.resolvedType,
                resolvedValue: resolvedValue,
                scopes: variable.scopes,
              });
            }
          }

          const totalVariables = allVariables.length;
          const unusedCount = unusedVariables.length;
          const hygieneScore = totalVariables === 0 ? 100 : Math.round(((totalVariables - unusedCount) / totalVariables) * 100);

          console.log(`Variable hygiene analysis complete. Found ${unusedCount} unused variables out of ${totalVariables} total.`);

          figma.ui.postMessage({
            type: 'variable-hygiene-result',
            result: {
              totalVariables,
              unusedVariables,
              unusedCount,
              hygieneScore,
              subScores: { variableHygiene: hygieneScore },
            },
          });
        } catch (err) {
          console.error('Error analyzing variable hygiene:', err);
          figma.ui.postMessage({
            type: 'variable-hygiene-error',
            error: (err as Error).message,
          });
        }
        break;

      case 'delete-component':
        try {
          if (!msg.componentId) {
            throw new Error('Component ID is required for deletion');
          }

          const componentNode = await figma.getNodeByIdAsync(msg.componentId);
          if (!componentNode) {
            throw new Error('Component not found');
          }

          const componentType = msg.componentType || 'component';
          const componentName = componentNode.name;
          let deletedType = '';

          if (componentType === 'set') {
            // Delete entire component set
            if (componentNode.type !== 'COMPONENT_SET') {
              throw new Error('Node is not a component set');
            }
            deletedType = 'component set';
            componentNode.remove();
          } else if (componentType === 'variant') {
            // Delete individual variant from a component set
            if (componentNode.type !== 'COMPONENT') {
              throw new Error('Node is not a component variant');
            }

            const parent = componentNode.parent;
            if (!parent || parent.type !== 'COMPONENT_SET') {
              throw new Error('Component is not part of a component set');
            }

            const parentId = parent.id; // Store parent ID before deletion

            // Check if this is the last variant
            const remainingVariants = parent.children.filter(
              child => child.type === 'COMPONENT' && child.id !== componentNode.id
            );

            if (remainingVariants.length === 0) {
              throw new Error('Cannot delete the last variant. Delete the entire component set instead.');
            }

            deletedType = 'variant';
            componentNode.remove();

            // Send parent ID for UI update
            figma.ui.postMessage({
              type: 'component-deleted',
              componentId: msg.componentId,
              parentId: parentId,
              componentName: componentName,
              componentType: deletedType,
            });
            return; // Early return to avoid duplicate message
          } else {
            // Delete regular component
            if (componentNode.type !== 'COMPONENT' && componentNode.type !== 'COMPONENT_SET') {
              throw new Error('Node is not a component');
            }
            deletedType = 'component';
            componentNode.remove();
          }

          console.log(`Successfully deleted ${deletedType}: ${componentName} (${msg.componentId})`);

          figma.ui.postMessage({
            type: 'component-deleted',
            componentId: msg.componentId,
            componentName: componentName,
            componentType: deletedType,
          });
        } catch (deleteError: any) {
          console.error('Error deleting component:', deleteError);
          figma.ui.postMessage({
            type: 'delete-component-error',
            error: deleteError.message || 'Failed to delete component',
          });
        }
        break;

      case 'delete-all-unused-variants':
        try {
          if (!msg.variantIds || !Array.isArray(msg.variantIds) || msg.variantIds.length === 0) {
            throw new Error('Variant IDs are required for batch deletion');
          }

          const deletionResults = [];
          let successCount = 0;
          let failCount = 0;

          for (const variantId of msg.variantIds) {
            try {
              const variantNode = await figma.getNodeByIdAsync(variantId);
              if (!variantNode || variantNode.type !== 'COMPONENT') {
                console.warn(`Variant ${variantId} not found or not a component`);
                failCount++;
                continue;
              }

              const variantName = variantNode.name;
              variantNode.remove();
              deletionResults.push({ id: variantId, name: variantName, success: true });
              successCount++;
            } catch (error: any) {
              console.error(`Error deleting variant ${variantId}:`, error);
              deletionResults.push({ id: variantId, success: false, error: error.message });
              failCount++;
            }
          }

          console.log(`Batch deletion complete: ${successCount} succeeded, ${failCount} failed`);

          figma.ui.postMessage({
            type: 'batch-variants-deleted',
            results: deletionResults,
            successCount,
            failCount,
            componentId: msg.componentId, // Include componentId to help UI update
            deletedAll: successCount === msg.variantIds.length, // True if all variants were successfully deleted
          });
        } catch (batchDeleteError: any) {
          console.error('Error in batch variant deletion:', batchDeleteError);
          figma.ui.postMessage({
            type: 'delete-component-error',
            error: batchDeleteError.message || 'Failed to delete variants',
          });
        }
        break;

      case 'delete-variable':
        try {
          if (!msg.variableId) {
            throw new Error('Variable ID is required for deletion');
          }

          const variable = await figma.variables.getVariableByIdAsync(msg.variableId);
          if (!variable) {
            throw new Error('Variable not found');
          }

          const variableName = variable.name;
          const variableType = variable.resolvedType;

          // Remove the variable
          variable.remove();

          console.log(`Successfully deleted variable: ${variableName} (${msg.variableId})`);

          figma.ui.postMessage({
            type: 'variable-deleted',
            variableId: msg.variableId,
            variableName: variableName,
            variableType: variableType,
          });
        } catch (deleteError: any) {
          console.error('Error deleting variable:', deleteError);
          figma.ui.postMessage({
            type: 'delete-variable-error',
            error: deleteError.message || 'Failed to delete variable',
          });
        }
        break;

      case 'start-oauth-flow':
        try {
          const { OAuthService } = await import('../services/oauthService');

          if (!OAuthService.isOAuthConfigured()) {
            throw new Error('OAuth is not configured. Please use Personal Access Token method.');
          }

          const oauthUrl = OAuthService.generateGitHubOAuthUrl();

          figma.ui.postMessage({
            type: 'oauth-url',
            url: oauthUrl,
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: 'oauth-callback',
            data: {
              success: false,
              error: error.message || 'Failed to start OAuth flow',
            },
          });
        }
        break;

      case 'open-external':
        try {
          if (!msg.url) {
            throw new Error('URL is required for external opening');
          }

          // Use Figma's openExternal API to open URL in user's browser
          figma.openExternal(msg.url);

          figma.ui.postMessage({
            type: 'external-url-opened',
            success: true,
          });
        } catch (error: any) {
          console.error('Error opening external URL:', error);
          figma.ui.postMessage({
            type: 'external-url-opened',
            success: false,
            error: error.message || 'Failed to open external URL',
          });
        }
        break;

      case 'commit-to-gitlab':
      case 'commit-to-repo':
        // Generic commit handler for both GitLab and GitHub
        const isLegacy = msg.type === 'commit-to-gitlab';

        if (
          !msg.projectId ||
          (!msg.token && !msg.gitlabToken) ||
          !msg.commitMessage ||
          !msg.cssData
        ) {
          throw new Error('Missing required fields for commit');
        }

        try {
          // Determine provider and service
          const provider = msg.provider || 'gitlab';
          const gitService = GitServiceFactory.getService(provider);

          const settings: GitSettings = {
            provider: provider,
            baseUrl: msg.baseUrl || msg.gitlabUrl || '',
            projectId: msg.projectId,
            token: msg.token || msg.gitlabToken, // Accept either
            filePath: msg.filePath || 'src/variables.css',
            testFilePath: 'components/{componentName}.spec.ts',
            strategy: 'merge-request',
            branchName: msg.branchName || 'feature/variables',
            testBranchName: 'feature/component-tests',
            exportFormat: 'css',
            saveToken: false,
            savedAt: new Date().toISOString(),
            savedBy:
              figma.currentUser && figma.currentUser.name ? figma.currentUser.name : 'Unknown user',
          };

          const result = await gitService.commitWorkflow(
            settings,
            msg.commitMessage,
            msg.filePath || 'src/variables.css',
            msg.cssData,
            msg.branchName || 'feature/variables',
          );

          figma.ui.postMessage({
            type: 'commit-success',
            message: SUCCESS_MESSAGES.COMMIT_SUCCESS,
            mergeRequestUrl: result && result.pullRequestUrl,
          });
        } catch (error: any) {
          // Send specific error information to UI
          let errorMessage = 'Unknown error occurred';
          let errorType = 'unknown';

          if (error.name === 'GitAuthError' || error.name === 'GitLabAuthError') {
            errorType = 'auth';
            errorMessage = 'Authentication failed. Please check your token and permissions.';
          } else if (error.name === 'GitNetworkError' || error.name === 'GitLabNetworkError') {
            errorType = 'network';
            errorMessage = 'Network error. Please check your internet connection.';
          } else if (error.name === 'GitServiceError' || error.name === 'GitLabAPIError') {
            if (error.statusCode === 401 || error.statusCode === 403) {
              errorType = 'auth';
              errorMessage = 'Authentication failed. Please check your token and permissions.';
            } else {
              errorType = 'api';
              if (error.statusCode === 404) {
                errorMessage = 'Project/Repository not found. Please check your ID.';
              } else if (error.statusCode === 422) {
                errorMessage = 'Invalid data provided. Please check your settings.';
              } else if (error.statusCode === 429) {
                errorMessage = 'Rate limit exceeded. Please try again later.';
              } else {
                errorMessage = error.message || 'Git API error occurred.';
              }
            }
          } else {
            errorMessage = error.message || 'Unknown error occurred';
          }

          figma.ui.postMessage({
            type: 'commit-error',
            error: errorMessage,
            errorType: errorType,
            statusCode: error.statusCode,
          });
        }
        break;

      case 'commit-component-test':
        if (
          !msg.projectId ||
          (!msg.token && !msg.gitlabToken) ||
          !msg.commitMessage ||
          !msg.testContent ||
          !msg.componentName
        ) {
          throw new Error('Missing required fields for component test commit');
        }

        try {
          const provider = msg.provider || 'gitlab';
          const gitService = GitServiceFactory.getService(provider);

          const settings: GitSettings = {
            provider: provider,
            baseUrl: msg.baseUrl || msg.gitlabUrl || '',
            projectId: msg.projectId,
            token: msg.token || msg.gitlabToken,
            filePath: 'variables.css', // Default value
            testFilePath: msg.testFilePath || 'components/{componentName}.spec.ts',
            strategy: 'merge-request', // Default value
            branchName: 'feature/variables', // Default value
            testBranchName: msg.branchName || 'feature/component-tests',
            exportFormat: 'css', // Default value
            saveToken: false, // Default value
            savedAt: new Date().toISOString(),
            savedBy:
              figma.currentUser && figma.currentUser.name ? figma.currentUser.name : 'Unknown user',
          };

          const testResult = await gitService.commitComponentTest(
            settings,
            msg.commitMessage,
            msg.componentName,
            msg.testContent,
            msg.testFilePath || 'components/{componentName}.spec.ts',
            msg.branchName || 'feature/component-tests',
          );

          figma.ui.postMessage({
            type: 'test-commit-success',
            message: SUCCESS_MESSAGES.TEST_COMMIT_SUCCESS,
            componentName: msg.componentName,
            mergeRequestUrl: testResult && testResult.pullRequestUrl,
          });
        } catch (error: any) {
          // Send specific error information to UI
          let errorMessage = 'Unknown error occurred';
          let errorType = 'unknown';

          if (error.name === 'GitLabAuthError') {
            errorType = 'auth';
            errorMessage = 'Authentication failed. Please check your GitLab token and permissions.';
          } else if (error.name === 'GitLabNetworkError') {
            errorType = 'network';
            errorMessage =
              'Network error. Please check your internet connection and GitLab server availability.';
          } else if (error.name === 'GitLabAPIError') {
            if (error.statusCode === 401 || error.statusCode === 403) {
              errorType = 'auth';
              errorMessage =
                'Authentication failed. Please check your GitLab token and permissions.';
            } else {
              errorType = 'api';
              if (error.statusCode === 404) {
                errorMessage = 'Project not found. Please check your project ID.';
              } else if (error.statusCode === 422) {
                errorMessage = 'Invalid data provided. Please check your settings and try again.';
              } else if (error.statusCode === 429) {
                errorMessage = 'Rate limit exceeded. Please try again in a few minutes.';
              } else {
                errorMessage = error.message || 'GitLab API error occurred.';
              }
            }
          } else {
            errorMessage = error.message || 'Unknown error occurred';
          }

          figma.ui.postMessage({
            type: 'test-commit-error',
            error: errorMessage,
            errorType: errorType,
            componentName: msg.componentName,
            statusCode: error.statusCode,
          });
        }
        break;

      case 'reset-gitlab-settings':
        await GitLabService.resetSettings();
        figma.ui.postMessage({
          type: 'gitlab-settings-reset',
          success: true,
        });
        break;

      case 'get-unit-settings':
        const unitSettingsData = await CSSExportService.getUnitSettingsData();
        figma.ui.postMessage({
          type: 'unit-settings-data',
          data: unitSettingsData,
        });
        break;

      case 'update-unit-settings':
        CSSExportService.updateUnitSettings({
          collections: msg.collections,
          groups: msg.groups,
        });
        await CSSExportService.saveUnitSettings();
        figma.ui.postMessage({
          type: 'unit-settings-updated',
          success: true,
        });
        break;

      case 'validate-tailwind-v4':
        const twValidation = await CSSExportService.getTailwindV4ValidationStatus();
        figma.ui.postMessage({
          type: 'tailwind-v4-validation',
          validation: twValidation,
        });
        break;

      case 'resize-plugin':
        // Disabled dynamic resizing - keep consistent size
        // figma.ui.resize() calls removed to maintain fixed plugin size
        break;

      case 'get-existing-collections':
        try {
          const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
          const collectionsData = [];

          for (const collection of existingCollections) {
            const variablesPromises = collection.variableIds.map(async (id) => {
              const variable = await figma.variables.getVariableByIdAsync(id);
              return variable
                ? { id: variable.id, name: variable.name, resolvedType: variable.resolvedType }
                : null;
            });

            const variables = await Promise.all(variablesPromises);
            const validVariables = variables.filter((v) => v !== null);

            collectionsData.push({
              id: collection.id,
              name: collection.name,
              variables: validVariables,
            });
          }

          figma.ui.postMessage({
            type: 'existing-collections',
            collections: collectionsData,
          });
        } catch (error: any) {
          console.error('Error getting existing collections:', error);
          figma.ui.postMessage({
            type: 'existing-collections-error',
            error: error.message || 'Failed to load existing collections',
          });
        }
        break;

      case 'preview-import':
        try {
          const content = (msg as any).content;
          if (!content) throw new Error('No content provided');

          const tokens = VariableImportService.parseCSS(content);

          // Get current state for diff
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          const variableIds = collections.reduce(
            (acc, c) => acc.concat(c.variableIds),
            [] as string[],
          );
          const allVariables = await Promise.all(
            variableIds.map((id) => figma.variables.getVariableByIdAsync(id)),
          );
          const validVariables = allVariables.filter((v) => v !== null);

          const diff = VariableImportService.compareTokens(tokens, validVariables);

          figma.ui.postMessage({
            type: 'import-preview-ready',
            diff: diff,
            totalFound: tokens.length,
          });
        } catch (error: any) {
          figma.ui.postMessage({
            type: 'import-error',
            message: error.message,
          });
        }
        break;

      case 'import-tokens':
        console.log('DEBUG: Received import-tokens message');
        console.log('DEBUG: Message content:', JSON.stringify(msg, null, 2));
        try {
          const importOptions = (msg as any).options || {};
          const tokens = (msg as any).tokens || [];

          console.log(`DEBUG: Received ${tokens.length} tokens to import`);
          console.log('DEBUG: Import options:', JSON.stringify(importOptions, null, 2));

          // Log first token as sample
          if (tokens.length > 0) {
            console.log('DEBUG: Sample token:', JSON.stringify(tokens[0], null, 2));
          }

          // Ensure tokens have required fields for ImportToken interface
          const validTokens = tokens.map((t: any) => ({
            ...t,
            originalLine: t.originalLine || '',
            lineNumber: t.lineNumber || 0,
          }));

          console.log('DEBUG: Calling VariableImportService.importVariables now...');
          const result = await VariableImportService.importVariables(validTokens, {
            collectionId: importOptions.collectionId,
            collectionName: importOptions.collectionName,
            strategy: importOptions.strategy || 'merge',
            organizeByCategories: importOptions.organizeByCategories,
          });

          figma.ui.postMessage({
            type: 'import-complete',
            result: {
              importedCount: result.success,
              errors: result.errors,
              collectionName: importOptions.collectionName,
              groupsCreated: result.groupsCreated,
            },
          });
        } catch (error: any) {
          console.error('Import failed:', error);
          figma.ui.postMessage({
            type: 'import-error',
            error: error.message,
          });
        }
        break;

      // Old inline logic removed in favor of VariableImportService

      case 'refresh-data':
        try {
          console.log('Refreshing document data...');

          // Re-run the data collection
          const refreshedData = await collectDocumentData();

          console.log('[DEBUG] refresh-data: Data collected, sending refresh-success');
          figma.ui.postMessage({
            type: 'refresh-success',
            variables: refreshedData.variables,
            styles: refreshedData.styles,
            components: refreshedData.components,
            message: 'Data refreshed successfully',
          });
          console.log('[DEBUG] refresh-data: refresh-success message sent');
        } catch (refreshError: any) {
          console.error('Error refreshing data:', refreshError);
          figma.ui.postMessage({
            type: 'refresh-error',
            error: refreshError.message || 'Failed to refresh data',
          });
        }
        break;

      case 'delete-style':
        try {
          const deleteStyleMsg = msg as any;
          if (!deleteStyleMsg.styleId || !deleteStyleMsg.styleType) {
            throw new Error('Style ID and type are required for deletion');
          }

          let styleToDelete: PaintStyle | TextStyle | EffectStyle | GridStyle | null = null;
          const styleType = deleteStyleMsg.styleType;
          const styleId = deleteStyleMsg.styleId;

          // Get the style based on type
          if (styleType === 'paint') {
            styleToDelete = (await figma.getStyleByIdAsync(styleId)) as PaintStyle;
          } else if (styleType === 'text') {
            styleToDelete = (await figma.getStyleByIdAsync(styleId)) as TextStyle;
          } else if (styleType === 'effect') {
            styleToDelete = (await figma.getStyleByIdAsync(styleId)) as EffectStyle;
          } else if (styleType === 'grid') {
            styleToDelete = (await figma.getStyleByIdAsync(styleId)) as GridStyle;
          }

          if (!styleToDelete) {
            throw new Error('Style not found');
          }

          const styleName = styleToDelete.name;

          // Delete the style from Figma
          styleToDelete.remove();

          console.log(`Successfully deleted style: ${styleName} (${styleId})`);

          // Send success confirmation back to UI
          figma.ui.postMessage({
            type: 'style-deleted',
            styleId: styleId,
            styleName: styleName,
          });

          // Refresh the data
          const refreshedData = await collectDocumentData();
          figma.ui.postMessage({
            type: 'data-refreshed',
            variables: refreshedData.variables,
            components: refreshedData.components,
          });
        } catch (deleteError: any) {
          console.error('Error deleting style:', deleteError);
          figma.ui.postMessage({
            type: 'delete-error',
            error: deleteError.message || 'Failed to delete style',
          });
        }
        break;

      case 'analyze-token-coverage':
        try {
          const scope = (msg.scope || 'PAGE') as string;
          console.log(`Analyzing token coverage (Scope: ${scope})...`);

          // Get settings to determine export format (for dynamic weighting)
          const settings = await GitLabService.loadSettings();
          const exportFormat = msg.exportFormat || settings?.exportFormat || 'css';

          let coverageResult;

          if (scope === 'ALL') {
            coverageResult = await TokenCoverageService.analyzeDocument(exportFormat, msg.pageIds);
          } else if (scope === 'SMART_SCAN') {
            coverageResult = await TokenCoverageService.analyzeSmart(exportFormat, msg.pageIds);
          } else if (scope === 'SELECTION') {
            console.log('Analyzing selection...');
            coverageResult = await TokenCoverageService.analyzeSelection(exportFormat);
          } else {
            coverageResult = await TokenCoverageService.analyzeCurrentPage(exportFormat);
          }

          console.log('[Plugin Debug] Analysis finished, result obtained. Posting message...');

          figma.ui.postMessage({
            type: 'token-coverage-result',
            result: coverageResult,
          });
          console.log('[Plugin Debug] Message posted successfully.');
        } catch (coverageError: any) {
          console.error('Error analyzing token coverage:', coverageError);
          figma.ui.postMessage({
            type: 'token-coverage-error',
            error: coverageError.message || 'Failed to analyze token coverage',
          });
        }
        break;

      case 'get-pages':
        try {
          const pages = figma.root.children.map(page => ({
            id: page.id,
            name: page.name
          }));
          figma.ui.postMessage({
            type: 'pages-list',
            pages: pages,
            currentPageId: figma.currentPage.id
          });
        } catch (error) {
          console.error('Error fetching pages:', error);
        }
        break;

      case 'set-client-storage':
        const storageMsg = msg as any;
        if (storageMsg.key) {
          await figma.clientStorage.setAsync(storageMsg.key, storageMsg.value);
          console.log(`Backend: Saved ${storageMsg.key} to clientStorage`);
        }
        break;

      case 'focus-node':
        try {
          const focusMsg = msg as any;
          if (focusMsg.nodeId) {
            // Use async variant for modern Figma environments (dynamic-page access)
            const node = (await figma.getNodeByIdAsync(focusMsg.nodeId)) as SceneNode;

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
          console.error('Error focusing node:', focusError);
        }
        break;

      case 'create-variable':
        try {
          const { name, value, collectionName } = msg as any;
          if (!name || !value) {
            throw new Error('Name and value are required');
          }

          console.log(`Creating variable: ${name} = ${value} in ${collectionName || 'Primitives'}`);

          // 1. Parse value
          let resolvedValue: any = null;
          let resolvedType: VariableResolvedDataType = 'FLOAT';

          // Try parsing Color
          const colorMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
          if (colorMatch) {
            resolvedType = 'COLOR';
            resolvedValue = {
              r: parseInt(colorMatch[1]) / 255,
              g: parseInt(colorMatch[2]) / 255,
              b: parseInt(colorMatch[3]) / 255,
            };
          } else {
            // Try parsing Float
            const floatMatch = value.match(/^([\d.]+)/);
            if (floatMatch) {
              resolvedType = 'FLOAT';
              resolvedValue = parseFloat(floatMatch[1]);
            }
          }

          if (resolvedValue === null) {
            throw new Error(`Could not parse value: ${value}`);
          }

          // 2. Find or create collection
          const targetCollectionName = collectionName || 'Primitives';
          console.log(`DEBUG: Finding collection '${targetCollectionName}'...`);
          const collections = await figma.variables.getLocalVariableCollectionsAsync();

          let collection = collections.find((c) => c.name === targetCollectionName);

          if (!collection) {
            console.log(`DEBUG: Creating new collection '${targetCollectionName}'...`);
            try {
              collection = figma.variables.createVariableCollection(targetCollectionName);
              console.log('DEBUG: Collection created:', collection ? collection.id : 'null');
            } catch (colError) {
              console.error('DEBUG: Failed to create collection:', colError);
              throw colError;
            }
          } else {
            console.log(`DEBUG: Found existing collection: ${collection.id}`);
          }

          if (!collection || !collection.id) {
            throw new Error('Failed to resolve valid collection');
          }

          // 3. Create variable
          // 3. Create variable
          console.log(
            `DEBUG: Executing createVariable('${name}', collection object, '${resolvedType}')`,
          );

          let variable;
          try {
            // Pass collection object directly as per best practice and to avoid "incremental mode" errors
            variable = figma.variables.createVariable(name, collection, resolvedType);
          } catch (err: any) {
            console.error('createVariable failed:', err);
            throw err;
          }

          if (!variable) throw new Error('Variable creation returned undefined');

          console.log('DEBUG: Variable created successfully:', variable.id);

          // 4. Set value for default mode (or all modes?)
          // For simplicity, set for default mode
          const modeId = collection.defaultModeId;
          variable.setValueForMode(modeId, resolvedValue);

          // 5. Notify success and refresh
          figma.notify(`Created variable ${variable.name}`);

          // Trigger refresh to update UI lists
          await collectDocumentData();

          // Also re-analyze token coverage so the new variable appears as a match?
          // The UI might want to simply apply it immediately.
          // Since we refreshed data, the list of variables sent to UI will include it.
          // But the token coverage UI needs to know about it.
          // Let's re-run analyzeCurrentPage to update the "Found Matches" list?
          // Or just let the user re-scan?
          // Best UX: Re-scan coverage + Refresh Data.

          // Send explicit success message with new variable details
          // Send explicit success message with new variable details
          figma.ui.postMessage({
            type: 'variable-created',
            variable: {
              id: variable.id,
              name: variable.name,
              key: variable.key,
              valuesByMode: variable.valuesByMode,
              collectionName: collection.name,
              resolvedValue: value,
            },
            context: (msg as any).context,
          });
        } catch (createError: any) {
          console.error('Error creating variable:', createError);
          figma.ui.postMessage({
            type: 'create-variable-error',
            error: createError.message,
          });
          figma.notify(`Failed to create variable: ${createError.message}`, { error: true });
        }
        break;

      case 'rename-variable-group':
        try {
          const { oldGroupName, newGroupName, action, variableId } = msg as any;
          if (!newGroupName) {
            throw new Error('New group name is required');
          }

          // action can be "replace" (default) or "add-prefix"
          const renameAction = action || 'replace';

          console.log(`Renaming variable group: ${oldGroupName || 'standalone'} → ${newGroupName} (action: ${renameAction})`);

          // Get all collections
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          let renamedCount = 0;

          // If variableId is provided, only rename that specific variable (for standalone variables)
          if (variableId) {
            const variable = await figma.variables.getVariableByIdAsync(variableId);
            if (!variable) {
              throw new Error(`Variable with ID ${variableId} not found`);
            }

            const oldName = variable.name;
            const newName = `${newGroupName}/${variable.name}`;

            try {
              variable.name = newName;
              renamedCount = 1;
              console.log(`Renamed: ${oldName} → ${newName}`);
            } catch (renameError) {
              console.error(`Failed to rename variable ${oldName}:`, renameError);
              throw renameError;
            }
          } else {
            // Find all variables that match the criteria (grouped variables)
            for (const collection of collections) {
              for (const collectionVariableId of collection.variableIds) {
                const variable = await figma.variables.getVariableByIdAsync(collectionVariableId);
                if (!variable) continue;

                let newName: string | null = null;
                const oldName = variable.name;

                // Check if variable belongs to the group to rename
                const pathMatch = variable.name.match(/^([^\/]+)\/(.*)/);

                if (pathMatch && pathMatch[1] === oldGroupName) {
                  // Handle grouped variables
                  const currentGroup = pathMatch[1];
                  const remainder = pathMatch[2];

                  if (renameAction === 'add-prefix') {
                    // Add namespace as prefix: "group/variable" → "namespace/group/variable"
                    newName = `${newGroupName}/${currentGroup}/${remainder}`;
                  } else {
                    // Replace: "group/variable" → "namespace/variable"
                    newName = `${newGroupName}/${remainder}`;
                  }
                }

                if (newName) {
                  try {
                    variable.name = newName;
                    renamedCount++;
                    console.log(`Renamed: ${oldName} → ${newName}`);
                  } catch (renameError) {
                    console.error(`Failed to rename variable ${oldName}:`, renameError);
                  }
                }
              }
            }
          }

          if (renamedCount === 0) {
            throw new Error(`No variables found matching the criteria`);
          }

          // Trigger validation refresh
          const validation = await CSSExportService.getTailwindV4ValidationStatus();

          figma.ui.postMessage({
            type: 'tailwind-v4-validation',
            validation: validation,
          });

          // Refresh document data
          // REMOVED: await collectDocumentData(); - The UI will trigger a refresh via window.refreshData() -> refresh-data message


          // Notify success
          const actionLabel = renameAction === 'add-prefix' ? 'prefixed with' : 'renamed to';
          figma.notify(`${renamedCount} variable${renamedCount !== 1 ? 's' : ''} ${actionLabel} "${newGroupName}"`);

          figma.ui.postMessage({
            type: 'variable-group-renamed',
            success: true,
            oldGroupName,
            newGroupName,
            renamedCount,
            action: renameAction,
          });
        } catch (renameError: any) {
          console.error('Error renaming variable group:', renameError);
          figma.ui.postMessage({
            type: 'variable-group-rename-error',
            error: renameError.message,
          });
          figma.notify(`Failed to rename variable group: ${renameError.message}`, { error: true });
        }
        break;

      case 'apply-token-to-nodes':
        try {
          const applyMsg = msg as any;
          const { nodeIds, variableId, property, category, targetValue } = applyMsg;

          if (!nodeIds || !variableId || !property || !category) {
            throw new Error('Missing required parameters for applying token');
          }

          console.log(
            `Applying token: ${variableId} to ${nodeIds.length} nodes (Property: ${property})`,
          );

          // Get the variable
          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) {
            throw new Error('Variable not found');
          }

          let successCount = 0;
          let failCount = 0;
          const errors: string[] = [];

          // Apply variable to each node
          for (const nodeId of nodeIds) {
            try {
              const node = await figma.getNodeByIdAsync(nodeId);
              if (!node) {
                console.warn(`Node not found: ${nodeId}`);
                failCount++;
                errors.push(`Node ${nodeId}: Not found`);
                continue;
              }

              // Check if node is a SceneNode
              if (node.type === 'DOCUMENT' || node.type === 'PAGE') {
                console.warn(`Cannot apply variable to ${node.type}: ${nodeId}`);
                failCount++;
                errors.push(`Node ${nodeId}: Invalid type ${node.type}`);
                continue;
              }

              // Apply variable based on property and category
              const applied = await applyVariableToNode(
                node as SceneNode,
                variable,
                property,
                category,
                targetValue,
              );
              if (applied) {
                successCount++;
              } else {
                failCount++;
                errors.push(`Node ${nodeId}: Apply returned false`);
              }
            } catch (nodeError: any) {
              console.error(`Error applying variable to node ${nodeId}:`, nodeError);
              failCount++;
              errors.push(`Node ${nodeId}: ${nodeError.message}`);
            }
          }

          console.log(`Apply token result: ${successCount} success, ${failCount} failed`);
          if (errors.length > 0) {
            console.log('Sample errors:', errors.slice(0, 5));
          }

          // Send result back to UI
          figma.ui.postMessage({
            type: 'apply-token-result',
            success: true, // Completed attempts
            successCount,
            failCount,
            errors,
          });

          // Listen for variable changes to auto-refresh
          // This handles changes made in the Figma UI outside the plugin
          // We use a debounce to avoid spamming refreshes during rapid edits
          let refreshTimeout: number | undefined;

          // @ts-ignore - 'change' event might not be in all typings yet or requires specific strictness
          if (figma.variables && typeof (figma.variables as any).on === 'function') {
            (figma.variables as any).on('change', (event: any) => {
              console.log('Variable change detected in Figma:', event);

              // Clear existing timeout
              if (refreshTimeout) {
                clearTimeout(refreshTimeout);
              }

              // Debounce refresh (1 second)
              refreshTimeout = setTimeout(() => {
                console.log('Triggering auto-refresh due to variable changes...');
                collectDocumentData().then((refreshedData) => {
                  figma.ui.postMessage({
                    type: 'refresh-success',
                    variables: refreshedData.variables,
                    styles: refreshedData.styles,
                    components: refreshedData.components,
                    message: 'Auto-refreshed from Figma changes',
                  });
                });
              }, 1000) as unknown as number;
            });
          }

          // Show UInotification
          if (successCount > 0) {
            figma.notify(`✓ Applied token to ${successCount} node${successCount !== 1 ? 's' : ''}`);
          }
          if (failCount > 0) {
            figma.notify(
              `⚠ Failed to apply token to ${failCount} node${failCount !== 1 ? 's' : ''}`,
              { error: true },
            );
          }
        } catch (applyError: any) {
          console.error('Error applying token:', applyError);
          figma.ui.postMessage({
            type: 'apply-token-result',
            success: false,
            error: applyError.message || 'Failed to apply token',
          });
          figma.notify(`✗ Error: ${applyError.message || 'Failed to apply token'}`, {
            error: true,
          });
        }
        break;

      default:
    }
  } catch (error: any) {
    console.error('Error handling message:', error);
    figma.ui.postMessage({
      type: 'error',
      message: error.message || 'Unknown error occurred',
    });
  }
};
