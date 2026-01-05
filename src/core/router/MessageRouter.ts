import { DocumentController } from '../controllers/DocumentController';
import { ExportController } from '../controllers/ExportController';
import { SelectionController } from '../controllers/SelectionController';
import { GitController } from '../controllers/GitController';
import { NodeController } from '../controllers/NodeController';
import { GitServiceFactory } from '../../services/gitServiceFactory';
import { GitLabService } from '../../services/gitlabService';
import { TokenCoverageService } from '../../services/tokenCoverageService';
import { VariableImportService } from '../../services/variableImportService';
import { PluginMessage } from '../../types';

export class MessageRouter {
  static async handleMessage(msg: PluginMessage) {
    console.log("DEBUG: Received typed message:", msg.type);

    switch (msg.type) {
      // Export Controller
      case 'export-css':
        await ExportController.handleExportCss(msg);
        break;
      case 'get-unit-settings':
        await ExportController.handleGetUnitSettings();
        break;
      case 'update-unit-settings':
        await ExportController.handleUpdateUnitSettings(msg);
        break;
      case 'validate-tailwind-v4':
        await ExportController.handleValidateTailwindV4();
        break;

      // Selection Controller
      case 'select-component':
        await SelectionController.handleSelection(msg);
        break;
      case 'focus-node':
        await SelectionController.handleFocusNode(msg);
        break;
      case 'load-component-styles':
        await SelectionController.loadComponentStyles(msg);
        break;

      // Git Controller
      case 'save-git-settings':
      case 'save-gitlab-settings': // Legacy
        await GitController.saveGitSettings(msg);
        break;
      case 'commit-to-repo':
      case 'commit-to-gitlab': // Legacy
        await GitController.commitToRepo(msg);
        break;
      case 'generate-test':
        await GitController.generateTest(msg);
        break;
      case 'commit-component-test':
        await GitController.commitComponentTest(msg);
        break;
      case 'reset-gitlab-settings':
        await GitLabService.resetSettings();
        figma.ui.postMessage({
          type: "gitlab-settings-reset",
          success: true,
        });
        break;
      case 'list-repositories':
        try {
          const listService = GitServiceFactory.getService(msg.provider || 'gitlab');
          const repositories = await listService.listRepositories({
            provider: msg.provider || 'gitlab',
            projectId: '',
            token: msg.token,
            saveToken: false,
            savedAt: '',
            savedBy: ''
          });
          figma.ui.postMessage({ type: "repositories-loaded", repositories });
        } catch (error: any) {
          figma.ui.postMessage({ type: "repositories-error", error: error.message || "Failed to load repositories" });
        }
        break;
      case 'list-branches':
        try {
          if (msg.provider !== 'github') throw new Error("Branch listing is currently only supported for GitHub repositories");
          const { GitHubService } = await import("../../services/githubService");
          const githubService = new GitHubService();
          const branches = await githubService.listBranches({
            provider: 'github',
            projectId: msg.projectId,
            token: msg.token,
            saveToken: false,
            savedAt: '',
            savedBy: ''
          });
          figma.ui.postMessage({ type: "branches-loaded", branches });
        } catch (error: any) {
          figma.ui.postMessage({ type: "branches-error", error: error.message || "Failed to load branches" });
        }
        break;

      // OAuth
      case 'check-oauth-status':
        try {
          const { OAuthService } = await import("../../services/oauthService");
          const status = OAuthService.getOAuthStatus();
          figma.ui.postMessage({ type: "oauth-status", status });
        } catch (error: any) {
          figma.ui.postMessage({ type: "oauth-status", status: { available: false, configured: false, message: "OAuth service unavailable" } });
        }
        break;
      case 'start-oauth-flow':
        try {
          const { OAuthService } = await import("../../services/oauthService");
          if (!OAuthService.isOAuthConfigured()) throw new Error("OAuth is not configured.");
          figma.ui.postMessage({ type: "oauth-url", url: OAuthService.generateGitHubOAuthUrl() });
        } catch (error: any) {
          figma.ui.postMessage({ type: "oauth-callback", data: { success: false, error: error.message } });
        }
        break;
      case 'open-external':
        try {
          if (!msg.url) throw new Error("URL is required");
          figma.openExternal(msg.url);
          figma.ui.postMessage({ type: "external-url-opened", success: true });
        } catch (error: any) {
          figma.ui.postMessage({ type: "external-url-opened", success: false, error: error.message });
        }
        break;

      // Document & Utils
      case 'refresh-data':
        try {
          await DocumentController.collectDocumentData();
          figma.ui.postMessage({ type: "refresh-complete", message: "Data refreshed successfully" });
        } catch (error: any) {
          figma.ui.postMessage({ type: "refresh-error", error: error.message || "Failed to refresh data" });
        }
        break;
      case 'set-client-storage':
        if (msg.key) {
          await figma.clientStorage.setAsync(msg.key, msg.value);
        }
        break;
      case 'delete-variable':
        try {
          if (!msg.variableId) throw new Error("Variable ID is required");
          const variableToDelete = await figma.variables.getVariableByIdAsync(msg.variableId);
          if (!variableToDelete) throw new Error("Variable not found");
          variableToDelete.remove();
          figma.ui.postMessage({ type: "variable-deleted", variableId: msg.variableId, variableName: variableToDelete.name });
          const refreshedData = await DocumentController.collectDocumentData();
          figma.ui.postMessage({ type: "data-refreshed", variables: refreshedData.variables, components: refreshedData.components });
        } catch (error: any) {
          figma.ui.postMessage({ type: "delete-error", error: error.message || "Failed to delete variable" });
        }
        break;

      // Import
      case 'get-existing-collections':
        try {
          const existingCollections = await figma.variables.getLocalVariableCollectionsAsync();
          const collectionsData = [];
          for (const collection of existingCollections) {
            const variablesPromises = collection.variableIds.map(async (id) => {
              const variable = await figma.variables.getVariableByIdAsync(id);
              return variable ? { id: variable.id, name: variable.name, resolvedType: variable.resolvedType } : null;
            });
            const variables = (await Promise.all(variablesPromises)).filter(v => v !== null);
            collectionsData.push({ id: collection.id, name: collection.name, variables });
          }
          figma.ui.postMessage({ type: "existing-collections", collections: collectionsData });
        } catch (error: any) {
          figma.ui.postMessage({ type: "existing-collections-error", error: error.message });
        }
        break;
      case 'preview-import':
        try {
          if (!msg.content) throw new Error("No content provided");
          const tokens = VariableImportService.parseCSS(msg.content);
          const collections = await figma.variables.getLocalVariableCollectionsAsync();
          const variableIds = collections.reduce((acc, c) => acc.concat(c.variableIds), [] as string[]);
          const allVariables = (await Promise.all(variableIds.map(id => figma.variables.getVariableByIdAsync(id)))).filter(v => v !== null);
          const diff = VariableImportService.compareTokens(tokens, allVariables);
          figma.ui.postMessage({ type: 'import-preview-ready', diff, totalFound: tokens.length });
        } catch (error: any) {
          // Send error to UI but using standard error message type if 'import-error' isn't appropriate for preview
          // or create specific preview error
          figma.ui.postMessage({ type: 'import-error', error: error.message });
        }
        break;
      case 'import-tokens':
        try {
           const importOptions = msg.options || {};
           const tokens = msg.tokens || [];

           // Re-validate token structure
           const validTokens = tokens.map((t: any) => ({
             ...t,
             originalLine: t.originalLine || '',
             lineNumber: t.lineNumber || 0
           }));

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
           figma.ui.postMessage({ type: 'import-error', error: error.message });
        }
        break;

      // Analysis
      case 'analyze-token-coverage':
        try {
          const scope = msg.scope || 'PAGE';
          let coverageResult;
          if (scope === 'ALL') coverageResult = await TokenCoverageService.analyzeDocument();
          else if (scope === 'SMART_SCAN') coverageResult = await TokenCoverageService.analyzeSmart();
          else coverageResult = await TokenCoverageService.analyzeCurrentPage();
          figma.ui.postMessage({ type: "token-coverage-result", result: coverageResult });
        } catch (error: any) {
          figma.ui.postMessage({ type: "token-coverage-error", error: error.message });
        }
        break;

      case 'apply-token-to-nodes':
        try {
          const { nodeIds, variableId, property, category } = msg;
          if (!nodeIds || !variableId || !property || !category) throw new Error('Missing parameters');

          const variable = await figma.variables.getVariableByIdAsync(variableId);
          if (!variable) throw new Error('Variable not found');

          let successCount = 0;
          let failCount = 0;

          // Process nodes using NodeController
          for (const nodeId of nodeIds) {
            const node = await figma.getNodeByIdAsync(nodeId);
            if (node && node.type !== 'DOCUMENT' && node.type !== 'PAGE') {
                const categoryType = category as 'Layout' | 'Fill' | 'Stroke' | 'Appearance';
                if(await NodeController.applyVariableToNode(node as SceneNode, variable, property, categoryType)) successCount++;
                else failCount++;
            } else failCount++;
          }

          figma.ui.postMessage({ type: 'apply-token-result', success: true, successCount, failCount });
          if (successCount > 0) figma.notify(`Applied token to ${successCount} nodes`);
        } catch (error: any) {
          figma.ui.postMessage({ type: 'apply-token-result', success: false, error: error.message });
        }
        break;

      default:
        console.warn("Unknown message type:", (msg as any).type);
    }
  }
}
