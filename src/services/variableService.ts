import { ErrorHandler } from '../utils/errorHandler';
import { IgnoreService } from './ignoreService';

export interface VariableHygieneResult {
  totalVariables: number;
  unusedVariables: UnusedVariable[];
  unusedCount: number;
  ignoredVariables: UnusedVariable[];
  ignoredCount: number;
  ignoredCollectionIds: string[];
  ignoredGroupPrefixes: string[];
  hygieneScore: number;
  subScores: {
    variableHygiene: number;
  };
}

export interface UnusedVariable {
  id: string;
  name: string;
  collectionId: string;
  collectionName: string;
  resolvedType: string;
  resolvedValue: string;
  scopes: VariableScope[];
}

export class VariableService {
  /**
   * Analyzes variable hygiene by finding unused local variables.
   * @param pageIds Optional list of page IDs to scope the usage scan. If empty, scans all pages.
   */
  static async analyzeHygiene(pageIds?: string[]): Promise<VariableHygieneResult> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        console.log('Analyzing variable hygiene...');

        // Get all local variables
        const allVariables = await figma.variables.getLocalVariablesAsync();
        console.log(`Found ${allVariables.length} local variables`);

        if (allVariables.length === 0) {
          return {
            totalVariables: 0,
            unusedVariables: [],
            unusedCount: 0,
            ignoredVariables: [],
            ignoredCount: 0,
            ignoredCollectionIds: [],
            ignoredGroupPrefixes: [],
            hygieneScore: 100,
            subScores: { variableHygiene: 100 },
          };
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
                variableUsage.get(aliasedVarId)?.usedBy.add(variable.id);
              }
            }
          }
        }

        // Load all pages to scan for variable usage
        await figma.loadAllPagesAsync();

        // Efficient scanning with yield
        const nodesToCheck: SceneNode[] = [];
        const collectNodes = (node: BaseNode) => {
             // Check if node supports boundVariables (SceneNodeMixin)
             if ('boundVariables' in node) {
                 nodesToCheck.push(node as SceneNode);
             }
             if ('children' in node) {
                 for (const child of node.children) {
                     collectNodes(child);
                 }
             }
        };

        // Scan pages
        for (const page of figma.root.children) {
          // Apply scoping if pageIds are provided (empty array means scan all pages)
          if (pageIds && pageIds.length > 0 && pageIds.indexOf(page.id) === -1) {
            continue;
          }
          for (const child of page.children) {
              collectNodes(child);
          }
        }

        console.log(`[VariableService] Scanning ${nodesToCheck.length} nodes for variable usage...`);

        // Process in chunks to avoid freezing UI
        const CHUNK_SIZE = 500; // Larger chunk size as operations are sync
        
        for (let i = 0; i < nodesToCheck.length; i += CHUNK_SIZE) {
            const chunk = nodesToCheck.slice(i, i + CHUNK_SIZE);
            
            // Process chunk synchronously
            for (const node of chunk) {
                try {
                  // Check all possible variable bindings on the node
                  if (node.boundVariables) {
                    const boundVars = node.boundVariables as any;

                    // Iterate through all bound variable properties
                    for (const propKey of Object.keys(boundVars)) {
                      const binding = boundVars[propKey];
                      if (binding && typeof binding === 'object') {
                        // Handle single binding
                        if ('id' in binding) {
                          const varId = (binding as any).id;
                          if (variableUsage.has(varId)) {
                            variableUsage.get(varId)?.usedBy.add(node.id);
                          }
                        }
                        // Handle array of bindings (for gradients, effects, etc.)
                        else if (Array.isArray(binding)) {
                          for (const item of binding) {
                            if (item && typeof item === 'object' && 'id' in item) {
                              const varId = item.id;
                              if (variableUsage.has(varId)) {
                                variableUsage.get(varId)?.usedBy.add(node.id);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                } catch (nodeError) {
                  // Some nodes might not support variable bindings, continue
                  // console.warn(`Could not check variable bindings for node ${node.id}:`, nodeError);
                }
            }

            // Yield to event loop
            if (i + CHUNK_SIZE < nodesToCheck.length) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        // Find unused variables
        const unusedVariables: UnusedVariable[] = [];

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

        // Partition unused variables into shown vs ignored
        const ignoreList = await IgnoreService.load();
        const shownUnused: UnusedVariable[] = [];
        const ignoredUnused: UnusedVariable[] = [];

        for (const uv of unusedVariables) {
          if (IgnoreService.isVariableIgnored(ignoreList, uv.id, uv.collectionId, uv.name)) {
            ignoredUnused.push(uv);
          } else {
            shownUnused.push(uv);
          }
        }

        const totalVariables = allVariables.length;
        const unusedCount = shownUnused.length;
        // Ignored items don't count against the hygiene score
        const hygieneScore = totalVariables === 0 ? 100 : Math.round(((totalVariables - unusedCount) / totalVariables) * 100);

        console.log(`Variable hygiene analysis complete. Found ${unusedCount} unused variables (${ignoredUnused.length} ignored) out of ${totalVariables} total.`);

        return {
          totalVariables,
          unusedVariables: shownUnused,
          unusedCount,
          ignoredVariables: ignoredUnused,
          ignoredCount: ignoredUnused.length,
          ignoredCollectionIds: ignoreList.variables.collectionIds,
          ignoredGroupPrefixes: ignoreList.variables.groupPrefixes,
          hygieneScore,
          subScores: { variableHygiene: hygieneScore },
        };
      },
      {
        operation: 'analyze_variable_hygiene',
        component: 'VariableService',
        severity: 'medium',
      }
    );
  }
}
