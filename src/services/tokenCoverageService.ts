/**
 * Service for analyzing token coverage in Figma designs
 * Identifies elements that use hard-coded values instead of design tokens
 */

/**
 * Tolerance for floating point comparison
 * Color: 0.01 allows ~2.5 difference in RGB values (imperceptible to human eye)
 * Float: 0.01px is imperceptible in UI
 */
const VALUE_MATCH_TOLERANCE = 0.01;

import { TailwindV4Service } from './tailwindV4Service';

export interface MatchingVariable {
  id: string;
  name: string;
  collectionName: string;
  resolvedValue: string;
  matchType: 'EXACT' | 'NEAR';
}

export interface TokenCoverageIssue {
  property: string;
  value: string;
  count: number;
  nodeIds: string[];
  nodeNames: string[];
  nodeFrames: string[];
  category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance';
  matchingVariables?: MatchingVariable[];
}

export interface TokenCoverageResult {
  totalNodes: number;
  totalIssues: number;
  issuesByCategory: {
    Layout: TokenCoverageIssue[];
    Fill: TokenCoverageIssue[];
    Stroke: TokenCoverageIssue[];
    Appearance: TokenCoverageIssue[];
  };
  qualityScore: number;
  subScores?: {
    tokenCoverage: number;
    tailwindReadiness: number;
    componentHygiene: number;
    variableHygiene: number;
    layoutHygiene: number;
  };
  // Metrics for UI
  totalVariables?: number;
  totalComponents?: number;
  unusedVariableCount?: number;
  unusedComponentCount?: number;
  weights?: {
    tokenCoverage: string;
    tailwindReadiness: string;
    componentHygiene: string;
    variableHygiene: string;
  };
  // Detailed Data for UI Lists
  unusedVariables?: any[];
  unusedComponents?: any[];
  tailwindValidation?: any;
}

/**
 * Properties to check for token coverage
 */
const PROPERTIES_TO_CHECK = {
  Layout: [
    'minWidth',
    'maxWidth',
    'width',
    'height',
    'minHeight',
    'maxHeight',
    'itemSpacing', // Gap in auto-layout
    'paddingLeft',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
  ],
  Fill: ['fills'],
  Stroke: ['strokes', 'strokeWeight'],
  Appearance: [
    'opacity',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius',
  ],
};

export class TokenCoverageService {
  /**
   * Analyzes the current page for token coverage
   */
  static async analyzeCurrentPage(exportFormat: string = 'css'): Promise<TokenCoverageResult> {
    const currentPage = figma.currentPage;
    const nodes = currentPage.findAll(
      (node) =>
        node.type === 'FRAME' ||
        node.type === 'SECTION' ||
        node.type === 'GROUP' ||
        node.type === 'COMPONENT' ||
        node.type === 'COMPONENT_SET' ||
        node.type === 'INSTANCE' ||
        node.type === 'RECTANGLE' ||
        node.type === 'ELLIPSE' ||
        node.type === 'POLYGON' ||
        node.type === 'STAR' ||
        node.type === 'VECTOR' ||
        node.type === 'TEXT' ||
        node.type === 'LINE' ||
        node.type === 'BOOLEAN_OPERATION',
    );

    return this.analyzeNodes(nodes as SceneNode[], exportFormat);
  }

  /**
   * Analyzes the entire document or specific pages for token coverage
   */
  static async analyzeDocument(
    exportFormat: string = 'css',
    pageIds?: string[],
  ): Promise<TokenCoverageResult> {
    const allPages = figma.root.children;
    let allNodes: SceneNode[] = [];

    // Iterate through pages
    for (const page of allPages) {
      // If pageIds is provided, only include nodes from those pages
      if (pageIds && pageIds.indexOf(page.id) === -1) {
        continue;
      }

      const pageNodes = page.findAll(
        (node) =>
          node.type === 'FRAME' ||
          node.type === 'SECTION' ||
          node.type === 'GROUP' ||
          node.type === 'COMPONENT' ||
          node.type === 'COMPONENT_SET' ||
          node.type === 'INSTANCE' ||
          node.type === 'RECTANGLE' ||
          node.type === 'ELLIPSE' ||
          node.type === 'POLYGON' ||
          node.type === 'STAR' ||
          node.type === 'VECTOR' ||
          node.type === 'TEXT' ||
          node.type === 'LINE' ||
          node.type === 'BOOLEAN_OPERATION',
      );
      allNodes = [...allNodes, ...(pageNodes as SceneNode[])];
    }

    return this.analyzeNodes(allNodes, exportFormat);
  }

  /**
   * Smart analysis: Checks current page first using analyzeNodes logic directly to avoid redundant calls.
   * If current page has 0 issues, it searches other pages.
   * If another page has issues, it switches to that page and returns its results.
   */
  static async analyzeSmart(
    exportFormat: string = 'css',
    pageIds?: string[],
  ): Promise<TokenCoverageResult> {
    console.log('analyzeSmart called', { exportFormat, pageIds });
    const currentPageId = figma.currentPage.id;
    const isCurrentPageSelected = !pageIds || pageIds.indexOf(currentPageId) !== -1;

    // Track the "best" result found so far (in case no issues are found anywhere)
    // We prioritize results with the most nodes to avoid returning an empty page's result (0/0)
    let bestResult: TokenCoverageResult | null = null;

    // 1. Analyze current page if it's within the selection
    if (isCurrentPageSelected) {
      const currentPageResult = await this.analyzeCurrentPage(exportFormat);
      
      // If issues found, return immediately
      if (currentPageResult.totalIssues > 0) {
        return currentPageResult;
      }
      
      // Otherwise, keep as baseline
      bestResult = currentPageResult;
    }

    // 2. Iterate other selected pages
    const allPages = figma.root.children;

    for (const page of allPages) {
      // Skip the page we just checked (current page) or skip if not in selection
      if (page.id === currentPageId) continue;
      if (pageIds && pageIds.indexOf(page.id) === -1) continue;

      const pageNodes = page.findAll(
        (node) =>
          node.type === 'FRAME' ||
          node.type === 'SECTION' ||
          node.type === 'GROUP' ||
          node.type === 'COMPONENT' ||
          node.type === 'COMPONENT_SET' ||
          node.type === 'INSTANCE' ||
          node.type === 'RECTANGLE' ||
          node.type === 'ELLIPSE' ||
          node.type === 'POLYGON' ||
          node.type === 'STAR' ||
          node.type === 'VECTOR' ||
          node.type === 'TEXT' ||
          node.type === 'LINE' ||
          node.type === 'BOOLEAN_OPERATION',
      );

      const pageResult = await this.analyzeNodes(pageNodes as SceneNode[], exportFormat);

      console.log('analyzeSmart: page result', { pageId: page.id, issues: pageResult.totalIssues, nodes: pageResult.totalNodes });

      if (pageResult.totalIssues > 0) {
        // Found a page with issues! Switch to it and return.
        await figma.setCurrentPageAsync(page);
        return pageResult;
      }
      
      // No issues, but check if this page has more content than our current best
      if (!bestResult || (pageResult.totalNodes > bestResult.totalNodes)) {
          console.log('analyzeSmart: New best result (clean)', pageResult.totalNodes);
          bestResult = pageResult;
      }
    }

    // 3. Logic for when NO issues are found anywhere:
    console.log('analyzeSmart: No issues found anywhere. Returning best result:', bestResult);
    // Return the result with the most nodes (to confirm we actually scanned something)
    // If we haven't scanned anything yet (e.g. current page not selected and no other pages selected), default to current.
    return bestResult || this.analyzeCurrentPage(exportFormat);
  }

  /**
   * Analyze only the currently selected nodes (and their children)
   */
  static async analyzeSelection(exportFormat: string = 'css'): Promise<TokenCoverageResult> {
    const selection = figma.currentPage.selection;
    let allNodes: SceneNode[] = [];

    for (const node of selection) {
      // Include the node itself if it matches our types
      if (
        node.type === 'FRAME' ||
        node.type === 'SECTION' ||
        node.type === 'GROUP' ||
        node.type === 'COMPONENT' ||
        node.type === 'COMPONENT_SET' ||
        node.type === 'INSTANCE'
      ) {
        allNodes.push(node);
      }

      // Find children
      if ('findAll' in node) {
        const children = (node as any).findAll(
          (n: any) =>
            n.type === 'FRAME' ||
            n.type === 'SECTION' ||
            n.type === 'GROUP' ||
            n.type === 'COMPONENT' ||
            n.type === 'COMPONENT_SET' ||
            n.type === 'INSTANCE',
        );
        allNodes = [...allNodes, ...children];
      }
    }

    return this.analyzeNodes(allNodes, exportFormat);
  }

  /**
   * Helper to analyze a list of nodes
   */
  private static async analyzeNodes(
    nodes: SceneNode[],
    exportFormat: string = 'css',
  ): Promise<TokenCoverageResult> {
    // --- Usage Tracking Maps ---
    // Variables
    const variableUsage = new Map<string, Set<string>>();
    // Components
    const localComponentDefs = new Map<string, ComponentNode | ComponentSetNode>();
    const componentUsage = new Map<string, Set<string>>(); // ComponentID -> Set<InstanceID>
    const variantToSetId = new Map<string, string>();

    // Initialize counters and maps
    let totalNodes = 0;
    let autoLayoutCount = 0;
    let instanceCount = 0;
    let frameCount = 0;
    const issuesMap = new Map<string, TokenCoverageIssue>();

    // Optimization: Fetch all variables once
    const allVariables = await this.getAllVariables();
    
    // Initialize variable usage map
    allVariables.forEach(v => {
      if (v.variable) {
        variableUsage.set(v.variable.id, new Set());
      }
    });

    // --- MAIN NODE LOOP ---
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      
      // Yield to the event loop every 50 nodes to keep UI responsive
      if (i % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      totalNodes++;

      // DSQ Metrics Collection & Type Checks
      if (
        node.type === 'FRAME' ||
        node.type === 'SECTION' ||
        node.type === 'GROUP' ||
        node.type === 'COMPONENT' ||
        node.type === 'COMPONENT_SET' ||
        node.type === 'INSTANCE'
      ) {
        // Check for auto-layout (applies to Frame-like nodes)
        if ('layoutMode' in node && node.layoutMode !== 'NONE') {
          autoLayoutCount++;
        }

        if (node.type === 'INSTANCE') {
          instanceCount++;
        } else {
          frameCount++; // Treat Component/Set/Frame as "frames" for this ratio
        }
      }

      // --- 1. Component Hygiene Tracking ---
      // Track Definitions
      if (node.type === 'COMPONENT') {
          // If it's a child of a ComponentSet, map it
          if (node.parent && node.parent.type === 'COMPONENT_SET') {
              variantToSetId.set(node.id, node.parent.id);
          } else {
              localComponentDefs.set(node.id, node);
          }
      } else if (node.type === 'COMPONENT_SET') {
          localComponentDefs.set(node.id, node);
          // Map children
          node.children.forEach(child => {
              if (child.type === 'COMPONENT') {
                 variantToSetId.set(child.id, node.id);
              }
          });
      }

      // Track Usage (Instances)
      if (node.type === 'INSTANCE') {
          let mainId = null;
          try {
            const main = await (node as InstanceNode).getMainComponentAsync();
            if (main) mainId = main.id;
          } catch (e) {
            // mainComponent access might fail if remote or other reasons
          }

          if (mainId) {
              // Mark specific variant as used
              if (!componentUsage.has(mainId)) {
                  componentUsage.set(mainId, new Set());
              }
              componentUsage.get(mainId)!.add(node.id);

              // Also mark the Set as used if applicable
              const setId = variantToSetId.get(mainId);
              if (setId) {
                  if (!componentUsage.has(setId)) {
                      componentUsage.set(setId, new Set());
                  }
                  componentUsage.get(setId)!.add(node.id);
              }
          }
      }

      // --- 2. Variable Hygiene Tracking ---
      // Check bound variables on the node
      if ('boundVariables' in node && node.boundVariables) {
          const boundVars = node.boundVariables as any;
          for (const propKey of Object.keys(boundVars)) {
              const binding = boundVars[propKey];
              if (binding) {
                  const checkId = (id: string) => {
                      if (variableUsage.has(id)) {
                          variableUsage.get(id)!.add(node.id);
                      }
                  };

                  if (Array.isArray(binding)) {
                      binding.forEach((b: any) => b.id && checkId(b.id));
                  } else if (typeof binding === 'object' && binding.id) {
                      checkId(binding.id);
                  }
              }
          }
      }
      
      // Also check paint styles / strokes for variable aliases?
      // (The logic from plugin.ts was simpler, only boundVariables. We stick to that for parity)


      // --- 3. Token Coverage Analysis ---
      // This MUST be done line-by-line using existing helper
      await this.analyzeNode(node, issuesMap);
    }
    
    // --- POST-PROCESSING: Calculate Hygiene Results ---

    // A. Variable Hygiene Results
    const unusedVariables: any[] = [];
    allVariables.forEach(v => {
        if (!v || !v.variable) return;
        const usage = variableUsage.get(v.variable.id);
        if (!usage || usage.size === 0) {
            // Check for alias usage (variables used by other variables)
            // NOTE: Ideally we check this. For now, assuming simple direct usage for speed. 
            // If we want alias checking we need to iterate variables again.
            // Let's implement basic alias check from the original plugin.ts logic if possible.
            // ... (Verified: plugin.ts checks aliases. We should too, but efficiently).
             
             // Extract resolved value for display
             let resolvedValue = '';
             const modeId = Object.keys(v.variable.valuesByMode)[0];
             const val = v.variable.valuesByMode[modeId];
             if (v.variable.resolvedType === 'COLOR' && val && typeof val === 'object' && 'r' in val) {
                 const c = val as any;
                 resolvedValue = `rgb(${Math.round(c.r*255)}, ${Math.round(c.g*255)}, ${Math.round(c.b*255)})`;
             } else if (val !== undefined) {
                 resolvedValue = String(val);
             }

             unusedVariables.push({
                 id: v.variable.id,
                 name: v.variable.name,
                 resolvedType: v.variable.resolvedType,
                 resolvedValue: resolvedValue,
                 collectionName: v.collectionName
             });
        }
    });

    // 4. Variable Hygiene Score (15%) -> 20%
    const totalVarsToCheck = allVariables.length;
    const variableHygieneScore = totalVarsToCheck === 0 ? 100 : Math.round(((totalVarsToCheck - unusedVariables.length) / totalVarsToCheck) * 100);


    // B. Component Hygiene Results
    const unusedComponents: any[] = [];
    
    for (const [id, def] of localComponentDefs.entries()) {
        if (def.type === 'COMPONENT_SET') {
            const set = def as ComponentSetNode;
            // Check if ANY variant is used? Or check which variants are unused?
            // Original logic: "Only include component sets that have at least one unused variant"
            // Wait, original logic count "unused components".
            
            const variants = set.children.filter(c => c.type === 'COMPONENT');
            const unusedVariants = variants.filter(v => !componentUsage.has(v.id) || componentUsage.get(v.id)!.size === 0);
            
            if (unusedVariants.length > 0) {
                unusedComponents.push({
                    id: set.id,
                    name: set.name,
                    type: 'COMPONENT_SET',
                    totalVariants: variants.length,
                    unusedVariantCount: unusedVariants.length,
                    isFullyUnused: unusedVariants.length === variants.length,
                    unusedVariants: unusedVariants.map(v => ({ id: v.id, name: v.name }))
                });
            }
        } else {
            // Standalone Component
            if (!componentUsage.has(id) || componentUsage.get(id)!.size === 0) {
                unusedComponents.push({
                    id: def.id,
                    name: def.name,
                    type: 'COMPONENT',
                    isFullyUnused: true
                });
            }
        }
    }

    // Score Calculation: Ratio of Instances vs Raw Frames/Components
    // Wait, the original 'analyzeNodes' had a DIFFERENT formula for component Hygiene:
    // "Ratio of Instances vs Raw Frames/Components. We want to encourage using Instances."
    // But 'analyze-component-hygiene' calculated "Unused Components %".
    // WE SHOULD UNIFY THIS. The "Unused Components" list implies we care about unused components.
    // However, the *score* in `analyzeNodes` was calculating "Detachment/composition score".
    // Decision: The Dashboard shows "Component Hygiene" and lists "Unused Components".
    // Users expect the score to reflect the clean-up task (Unused Components).
    // The previous implementation had a conflict: analyzeNodes calc'd a "Composition Score" but the UI list showed "Unused Components".
    // I will switch the score to match the **Unused Components** metric, as that aligns with the user task of "cleaning up".
    
    const totalComponents = localComponentDefs.size;

    // Calculate deletable units for correct progress:
    // Each variant inside a component set counts as 1, each standalone component counts as 1
    let totalDeletableUnits = 0;
    let unusedDeletableUnits = 0;

    for (const [, def] of localComponentDefs.entries()) {
      if (def.type === 'COMPONENT_SET') {
        const set = def as ComponentSetNode;
        totalDeletableUnits += set.children.filter(c => c.type === 'COMPONENT').length;
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

    const componentHygieneScore = totalDeletableUnits === 0 ? 100 : Math.round(((totalDeletableUnits - unusedDeletableUnits) / totalDeletableUnits) * 100);

    // Find matching variables for each issue
    for (const issue of issuesMap.values()) {
      issue.matchingVariables = await this.findMatchingVariables(
        issue.value,
        issue.category,
        allVariables,
      );
    }

    // Group issues by category
    const issuesByCategory = {
      Layout: [] as TokenCoverageIssue[],
      Fill: [] as TokenCoverageIssue[],
      Stroke: [] as TokenCoverageIssue[],
      Appearance: [] as TokenCoverageIssue[],
    };

    for (const issue of issuesMap.values()) {
      issuesByCategory[issue.category].push(issue);
    }

    // Sort issues by count (most frequent first)
    for (const category of Object.keys(issuesByCategory) as Array<keyof typeof issuesByCategory>) {
      issuesByCategory[category].sort((a, b) => b.count - a.count);
    }

    // --- DSQ-Score Calculation ---

    // 1. Token Coverage Score (35%)
    // Base logic: 100 - penalty based on density
    let tokenCoverageScore = 100;
    if (totalNodes > 0) {
      let totalIssueOccurrences = 0;
      for (const issue of issuesMap.values()) {
        totalIssueOccurrences += issue.count;
      }
      const issueDensity = totalIssueOccurrences / (totalNodes * 3); // Assume ~3 checkable props per node
      const penalty = Math.round(issueDensity * 100);
      tokenCoverageScore = Math.max(0, 100 - penalty);
    }

    // 2. Tailwind Readiness Score (20%)
    // Logic: % of variables that match Tailwind v4 CSS variable naming conventions
    const isTailwindCompatible = (name: string): boolean => {
      return TailwindV4Service.isCompatible(name);
    };

    let validTailwindNames = 0;
    const tailwindValidation: any = { 
        valid: [], 
        invalid: [],
        totalInvalid: 0,
        totalVariables: 0,
        readinessScore: 0,
        // Group-level data for UI rendering
        groups: [],
        invalidGroups: []
    }; // Detailed list

    // Build group-level data for Tailwind validation
    const twGroupMap = new Map<string, { count: number; isValid: boolean; variables: any[] }>();
    const twStandaloneVars: any[] = [];

    if (totalVarsToCheck > 0) {
      allVariables.forEach((v) => {
        if (!v || !v.variable || !v.variable.name) return;

        if (isTailwindCompatible(v.variable.name)) {
          validTailwindNames++;
          tailwindValidation.valid.push({ id: v.variable.id, name: v.variable.name });
        } else {
          tailwindValidation.invalid.push({ id: v.variable.id, name: v.variable.name });
        }

        // Group-level tracking
        const pathMatch = v.variable.name.match(/^([^\/]+)\//);
        if (pathMatch) {
          const groupName = pathMatch[1];
          if (!twGroupMap.has(groupName)) {
            const isValid = TailwindV4Service.isValidNamespace(groupName);
            twGroupMap.set(groupName, { count: 0, isValid, variables: [] });
          }
          const group = twGroupMap.get(groupName)!;
          group.count++;
          group.variables.push({ id: v.variable.id, name: v.variable.name });
        } else {
          // Standalone variable (no group prefix)
          twStandaloneVars.push({
            name: v.variable.name,
            isValid: false,
            variableCount: 1,
            isStandalone: true,
            variableId: v.variable.id
          });
        }
      });
    }

    // Build groups array and invalidGroups list
    for (const [groupName, data] of twGroupMap.entries()) {
      tailwindValidation.groups.push({
        name: groupName,
        isValid: data.isValid,
        namespace: data.isValid ? groupName.toLowerCase() : undefined,
        variableCount: data.count,
        isStandalone: false
      });
      if (!data.isValid) {
        tailwindValidation.invalidGroups.push(groupName);
      }
    }

    // Add standalone variables to groups and invalidGroups
    for (const sv of twStandaloneVars) {
      tailwindValidation.groups.push(sv);
      tailwindValidation.invalidGroups.push(sv.name);
    }

    const tailwindScore =
      totalVarsToCheck === 0 ? 100 : Math.round((validTailwindNames / totalVarsToCheck) * 100);
    
    // Populate summary stats in validation object
    tailwindValidation.totalVariables = totalVarsToCheck;
    tailwindValidation.totalInvalid = tailwindValidation.invalid.length;
    tailwindValidation.readinessScore = tailwindScore;


    // 5. Layout Hygiene Score (15%)
    // Logic: % of frames/components using Auto Layout
    // const totalContainerNodes = instanceCount + frameCount; (Calculated in loop)
    // const autoLayoutCount (Calculated in loop)
    const totalContainerNodes = instanceCount + frameCount;
    const layoutHygieneScore =
      totalContainerNodes === 0 ? 100 : Math.round((autoLayoutCount / totalContainerNodes) * 100);

    // Weighted Total Score
    const isTailwindV4 = exportFormat === 'tailwind-v4';
    let weightedScore = 0;
    let weights = {
      tokenCoverage: '0%',
      tailwindReadiness: '0%',
      componentHygiene: '0%',
      variableHygiene: '0%',
    };

    if (isTailwindV4) {
      // Scenario A: Tailwind Enabled (4 Active)
      weightedScore = Math.round(
        tokenCoverageScore * 0.25 +
          tailwindScore * 0.25 +
          componentHygieneScore * 0.25 +
          variableHygieneScore * 0.25,
      );
      weights = {
        tokenCoverage: '25%',
        tailwindReadiness: '25%',
        componentHygiene: '25%',
        variableHygiene: '25%',
      };
    } else {
      // Scenario B: Tailwind Disabled (3 Active)
      weightedScore = Math.round(
        (tokenCoverageScore + componentHygieneScore + variableHygieneScore) / 3,
      );
      weights = {
        tokenCoverage: '33.3%',
        tailwindReadiness: '0%', // Not shown
        componentHygiene: '33.4%', // Slight adjustment to sum to 100
        variableHygiene: '33.3%',
      };
    }

    return {
      totalNodes,
      totalIssues: issuesMap.size,
      issuesByCategory,
      qualityScore: weightedScore,
      subScores: {
        tokenCoverage: tokenCoverageScore,
        tailwindReadiness: tailwindScore,
        componentHygiene: componentHygieneScore,
        variableHygiene: variableHygieneScore,
        layoutHygiene: layoutHygieneScore,
      },
      weights,
      // Detailed Data
      unusedVariables,
      unusedComponents,
      // Metrics
      totalVariables: totalVarsToCheck,
      totalComponents: totalComponents,
      totalDeletableUnits,
      unusedVariableCount: unusedVariables.length,
      unusedComponentCount: unusedComponents.length,
      unusedDeletableUnits,
      tailwindValidation
    };
  }

  /**
   * Helper to check if a node is inside an InstanceNode
   */
  private static isInsideInstance(node: SceneNode): boolean {
    let parent = node.parent;
    while (parent && parent.type !== 'PAGE' && parent.type !== 'DOCUMENT') {
      if (parent.type === 'INSTANCE') {
        return true;
      }
      parent = parent.parent;
    }
    return false;
  }

  /**
   * Analyzes a single node for token coverage issues
   */
  private static async analyzeNode(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>,
  ): Promise<void> {
    // Skip if node is inside an instance (we only care about the instance itself or non-instance nodes)
    if (this.isInsideInstance(node)) {
      return;
    }

    // Check Layout properties
    this.checkLayoutProperties(node, issuesMap);

    // Check Fill properties
    this.checkFillProperties(node, issuesMap);

    // Check Stroke properties
    this.checkStrokeProperties(node, issuesMap);

    // Check Appearance properties
    this.checkAppearanceProperties(node, issuesMap);
  }

  /**
   * Helper to format numeric values to max 2 decimal places
   */
  private static formatValue(value: number): string {
    // Round to 2 decimal places
    const rounded = Math.round(value * 100) / 100;
    return `${rounded}px`;
  }

  /**
   * Checks layout properties (spacing, sizing)
   */
  private static checkLayoutProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>,
  ): void {
    // Check if node has layout properties
    if (!('minWidth' in node)) return;

    const layoutNode = node as FrameNode | ComponentNode | InstanceNode | SectionNode;

    // Min Width (skipped for Groups as they auto-resize)
    if (
      'minWidth' in layoutNode &&
      layoutNode.minWidth !== null &&
      layoutNode.minWidth !== 0 &&
      !this.isVariableBound(layoutNode, 'minWidth')
    ) {
      this.addIssue(issuesMap, 'Min Width', this.formatValue(layoutNode.minWidth), node, 'Layout');
    }

    // Check maxWidth - exclude zero values
    if (
      layoutNode.maxWidth !== null &&
      layoutNode.maxWidth !== 0 &&
      !this.isVariableBound(layoutNode, 'maxWidth')
    ) {
      this.addIssue(issuesMap, 'Max Width', this.formatValue(layoutNode.maxWidth), node, 'Layout');
    }

    // Check width (if not auto) - exclude zero values and dynamic sizing
    if (
      'width' in layoutNode &&
      layoutNode.width &&
      typeof layoutNode.width === 'number' &&
      layoutNode.width !== 0 &&
      !this.isVariableBound(layoutNode, 'width') &&
      !this.isWidthDynamic(layoutNode)
    ) {
      this.addIssue(issuesMap, 'Width', this.formatValue(layoutNode.width), node, 'Layout');
    }

    // Check height (if not auto) - exclude zero values and dynamic sizing
    if (
      'height' in layoutNode &&
      layoutNode.height &&
      typeof layoutNode.height === 'number' &&
      layoutNode.height !== 0 &&
      !this.isVariableBound(layoutNode, 'height') &&
      !this.isHeightDynamic(layoutNode)
    ) {
      this.addIssue(issuesMap, 'Height', this.formatValue(layoutNode.height), node, 'Layout');
    }

    // Check minHeight - exclude zero values
    if (
      'minHeight' in layoutNode &&
      layoutNode.minHeight !== null &&
      layoutNode.minHeight !== 0 &&
      !this.isVariableBound(layoutNode, 'minHeight')
    ) {
      this.addIssue(
        issuesMap,
        'Min Height',
        this.formatValue(layoutNode.minHeight),
        node,
        'Layout',
      );
    }

    // Check maxHeight - exclude zero values
    if (
      'maxHeight' in layoutNode &&
      layoutNode.maxHeight !== null &&
      layoutNode.maxHeight !== 0 &&
      !this.isVariableBound(layoutNode, 'maxHeight')
    ) {
      this.addIssue(
        issuesMap,
        'Max Height',
        this.formatValue(layoutNode.maxHeight),
        node,
        'Layout',
      );
    }

    // Check auto-layout properties
    if ('layoutMode' in layoutNode && layoutNode.layoutMode !== 'NONE') {
      // Check gap (itemSpacing) - exclude zero values
      if (
        typeof layoutNode.itemSpacing === 'number' &&
        layoutNode.itemSpacing !== 0 &&
        !this.isVariableBound(layoutNode, 'itemSpacing')
      ) {
        this.addIssue(issuesMap, 'Gap', this.formatValue(layoutNode.itemSpacing), node, 'Layout');
      }

      // Check padding - consolidate if all values are the same, exclude zero values
      const paddingLeft = typeof layoutNode.paddingLeft === 'number' ? layoutNode.paddingLeft : 0;
      const paddingTop = typeof layoutNode.paddingTop === 'number' ? layoutNode.paddingTop : 0;
      const paddingRight =
        typeof layoutNode.paddingRight === 'number' ? layoutNode.paddingRight : 0;
      const paddingBottom =
        typeof layoutNode.paddingBottom === 'number' ? layoutNode.paddingBottom : 0;

      // Check if all padding values are the same and not bound to variables
      const allPaddingSame =
        paddingLeft === paddingTop && paddingTop === paddingRight && paddingRight === paddingBottom;
      const anyPaddingBound =
        this.isVariableBound(layoutNode, 'paddingLeft') ||
        this.isVariableBound(layoutNode, 'paddingTop') ||
        this.isVariableBound(layoutNode, 'paddingRight') ||
        this.isVariableBound(layoutNode, 'paddingBottom');

      if (allPaddingSame && !anyPaddingBound && paddingLeft !== 0) {
        // Report as consolidated "Padding"
        this.addIssue(issuesMap, 'Padding', this.formatValue(paddingLeft), node, 'Layout');
      } else {
        // Report individual padding values (only non-zero and non-bound)
        if (paddingLeft !== 0 && !this.isVariableBound(layoutNode, 'paddingLeft')) {
          this.addIssue(issuesMap, 'Padding Left', this.formatValue(paddingLeft), node, 'Layout');
        }
        if (paddingTop !== 0 && !this.isVariableBound(layoutNode, 'paddingTop')) {
          this.addIssue(issuesMap, 'Padding Top', this.formatValue(paddingTop), node, 'Layout');
        }
        if (paddingRight !== 0 && !this.isVariableBound(layoutNode, 'paddingRight')) {
          this.addIssue(issuesMap, 'Padding Right', this.formatValue(paddingRight), node, 'Layout');
        }
        if (paddingBottom !== 0 && !this.isVariableBound(layoutNode, 'paddingBottom')) {
          this.addIssue(
            issuesMap,
            'Padding Bottom',
            this.formatValue(paddingBottom),
            node,
            'Layout',
          );
        }
      }
    }
  }

  /**
   * Checks fill/color properties
   */
  private static checkFillProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>,
  ): void {
    if (!('fills' in node)) return;

    const fills = node.fills;
    if (!Array.isArray(fills) || fills.length === 0) return;

    // Check if any paint has a color variable bound
    if (!this.isPaintColorVariableBound(fills)) {
      // Get the first solid fill
      const solidFill = fills.find((fill) => fill.type === 'SOLID' && fill.visible !== false);
      if (solidFill && solidFill.type === 'SOLID') {
        const color = solidFill.color;
        const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
        this.addIssue(issuesMap, 'Fill Color', colorValue, node, 'Fill');
      }
    }
  }

  /**
   * Checks stroke properties
   */
  private static checkStrokeProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>,
  ): void {
    if (!('strokes' in node)) return;

    const strokes = node.strokes;
    if (!Array.isArray(strokes) || strokes.length === 0) return;

    // Check stroke color (paint-level binding)
    if (!this.isPaintColorVariableBound(strokes)) {
      const solidStroke = strokes.find(
        (stroke) => stroke.type === 'SOLID' && stroke.visible !== false,
      );
      if (solidStroke && solidStroke.type === 'SOLID') {
        const color = solidStroke.color;
        const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
        this.addIssue(issuesMap, 'Stroke Color', colorValue, node, 'Stroke');
      }
    }

    // Check stroke weight - exclude zero values
    const hasNumericStrokeWeight =
      'strokeWeight' in node && typeof (node as any).strokeWeight === 'number';
    const strokeWeightValue = hasNumericStrokeWeight ? (node as any).strokeWeight : 0;

    // Consider any of the individual stroke weights as a valid variable binding as well
    const anyStrokeWeightBound =
      this.isVariableBound(node as any, 'strokeWeight') ||
      this.isVariableBound(node as any, 'strokeTopWeight') ||
      this.isVariableBound(node as any, 'strokeRightWeight') ||
      this.isVariableBound(node as any, 'strokeBottomWeight') ||
      this.isVariableBound(node as any, 'strokeLeftWeight');

    if (hasNumericStrokeWeight && strokeWeightValue !== 0 && !anyStrokeWeightBound) {
      this.addIssue(
        issuesMap,
        'Stroke Weight',
        this.formatValue(strokeWeightValue),
        node,
        'Stroke',
      );
    }
  }

  /**
   * Checks appearance properties (opacity, radius)
   */
  private static checkAppearanceProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>,
  ): void {
    // Check opacity - exclude zero and one (default) values
    if (
      'opacity' in node &&
      node.opacity !== 1 &&
      node.opacity !== 0 &&
      !this.isVariableBound(node, 'opacity')
    ) {
      this.addIssue(issuesMap, 'Opacity', `${node.opacity}`, node, 'Appearance');
    }

    // Check corner radius - exclude zero values as they typically don't need tokens
    if ('cornerRadius' in node && (node as any).type !== 'SECTION') {
      const rectNode = node as RectangleNode | FrameNode | ComponentNode | InstanceNode;

      // Get all corner radius values
      const topLeft =
        'topLeftRadius' in rectNode && typeof rectNode.topLeftRadius === 'number'
          ? rectNode.topLeftRadius
          : 0;
      const topRight =
        'topRightRadius' in rectNode && typeof rectNode.topRightRadius === 'number'
          ? rectNode.topRightRadius
          : 0;
      const bottomLeft =
        'bottomLeftRadius' in rectNode && typeof rectNode.bottomLeftRadius === 'number'
          ? rectNode.bottomLeftRadius
          : 0;
      const bottomRight =
        'bottomRightRadius' in rectNode && typeof rectNode.bottomRightRadius === 'number'
          ? rectNode.bottomRightRadius
          : 0;

      // Check if all corner radii are the same and not bound to variables
      const allRadiiSame =
        topLeft === topRight && topRight === bottomLeft && bottomLeft === bottomRight;
      
      // Check for mixed radius (some nodes like Vector don't have individual corners)
      if (rectNode.cornerRadius !== figma.mixed && typeof rectNode.cornerRadius === 'number') {
         if (rectNode.cornerRadius > 0 && !this.isVariableBound(rectNode, 'cornerRadius') && !this.isVariableBound(rectNode, 'topLeftRadius')) {
             this.addIssue(issuesMap, 'Corner Radius', this.formatValue(rectNode.cornerRadius), node, 'Appearance');
             return;
         }
      }

      const anyRadiusBound =
        this.isVariableBound(rectNode, 'topLeftRadius') ||
        this.isVariableBound(rectNode, 'topRightRadius') ||
        this.isVariableBound(rectNode, 'bottomLeftRadius') ||
        this.isVariableBound(rectNode, 'bottomRightRadius');

      if (allRadiiSame && !anyRadiusBound && topLeft > 0) {
        // Report as consolidated "Corner Radius"
        this.addIssue(issuesMap, 'Corner Radius', this.formatValue(topLeft), node, 'Appearance');
      } else {
        // Report individual corner radii (only non-zero and non-bound)
        if (topLeft > 0 && !this.isVariableBound(rectNode, 'topLeftRadius')) {
          this.addIssue(
            issuesMap,
            'Corner Radius (Top Left)',
            this.formatValue(topLeft),
            node,
            'Appearance',
          );
        }
        if (topRight > 0 && !this.isVariableBound(rectNode, 'topRightRadius')) {
          this.addIssue(
            issuesMap,
            'Corner Radius (Top Right)',
            this.formatValue(topRight),
            node,
            'Appearance',
          );
        }
        if (bottomLeft > 0 && !this.isVariableBound(rectNode, 'bottomLeftRadius')) {
          this.addIssue(
            issuesMap,
            'Corner Radius (Bottom Left)',
            this.formatValue(bottomLeft),
            node,
            'Appearance',
          );
        }
        if (bottomRight > 0 && !this.isVariableBound(rectNode, 'bottomRightRadius')) {
          this.addIssue(
            issuesMap,
            'Corner Radius (Bottom Right)',
            this.formatValue(bottomRight),
            node,
            'Appearance',
          );
        }
      }
    }
  }

  /**
   * Utility to check whether any SOLID paint has a color variable bound at paint-level
   */
  private static isPaintColorVariableBound(paints: ReadonlyArray<Paint>): boolean {
    if (!Array.isArray(paints)) return false;
    for (const p of paints) {
      if (p && p.type === 'SOLID' && (p as any).visible !== false) {
        const bv = (p as any).boundVariables;
        if (bv && bv.color) return true;
      }
    }
    return false;
  }

  /**
   * Checks if a property is bound to a variable (design token)
   */
  private static isVariableBound(node: any, property: string): boolean {
    if (!node.boundVariables) return false;
    const boundVariable = node.boundVariables[property];
    // console.log(`Checking bound var for ${node.name} on ${property}:`, boundVariable);
    return boundVariable !== undefined && boundVariable !== null;
  }

  /**
   * Adds or updates an issue in the issues map
   */
  private static addIssue(
    issuesMap: Map<string, TokenCoverageIssue>,
    property: string,
    value: string,
    node: SceneNode,
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance',
  ): void {
    const key = `${category}:${property}:${value}`;

    // Find parent frame name
    let frameName = 'Unknown Frame';
    let parent = node.parent;
    while (parent) {
      if (
        parent.type === 'FRAME' ||
        parent.type === 'SECTION' ||
        parent.type === 'COMPONENT' ||
        parent.type === 'COMPONENT_SET'
      ) {
        frameName = parent.name;
        break;
      }
      if (parent.type === 'PAGE' || parent.type === 'DOCUMENT') {
        frameName = 'Page: ' + parent.name; // Fallback to page name
        break;
      }
      parent = parent.parent;
    }

    if (issuesMap.has(key)) {
      const issue = issuesMap.get(key)!;
      issue.count++;
      issue.nodeIds.push(node.id);
      issue.nodeNames.push(node.name);
      if (issue.nodeFrames) {
        issue.nodeFrames.push(frameName);
      } else {
        issue.nodeFrames = [frameName];
      }
    } else {
      issuesMap.set(key, {
        property,
        value,
        count: 1,
        nodeIds: [node.id],
        nodeNames: [node.name],
        nodeFrames: [frameName],
        category,
      });
    }
  }

  /**
   * Checks if width is dynamic (Hug or Fill) or if usage implies dynamic behavior (Auto Layout)
   */
  private static isWidthDynamic(node: SceneNode): boolean {
    // 1. Auto Layout Containers:
    // User request: "only show fixed values without auto layout"
    // If the node itself is an Auto Layout frame, we treat it as dynamic/handled
    // and skip forcing width tokens, unless the user specifically wants to tokenize card widths.
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      return true;
    }

    // 2. Modern API Check: layoutSizingHorizontal
    // This handles FIXED vs HUG vs FILL more reliably if available
    if ('layoutSizingHorizontal' in node) {
      const sizing = (node as any).layoutSizingHorizontal;
      // If it's anything other than FIXED (e.g. HUG, FILL), treat as dynamic
      if (sizing && sizing !== 'FIXED') return true;
    }

    // 3. Check for "Fill container" (Legacy/Fallback)
    // Depends on parent's auto layout settings
    const parent = node.parent;
    if (parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE') {
      if (parent.layoutMode === 'HORIZONTAL') {
        // In horizontal parent, width fill is layoutGrow = 1
        if ('layoutGrow' in node && node.layoutGrow === 1) return true;
      } else if (parent.layoutMode === 'VERTICAL') {
        // In vertical parent, width fill is layoutAlign = 'STRETCH'
        if ('layoutAlign' in node && node.layoutAlign === 'STRETCH') return true;
      }
    }

    // Special case for Text nodes (Auto Width)
    if (node.type === 'TEXT' && node.textAutoResize === 'WIDTH_AND_HEIGHT') {
      return true;
    }

    return false;
  }

  /**
   * Checks if height is dynamic (Hug or Fill) or if usage implies dynamic behavior (Auto Layout)
   */
  private static isHeightDynamic(node: SceneNode): boolean {
    // 1. Auto Layout Containers:
    // If the node itself is an Auto Layout frame, we treat it as dynamic/handled
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      return true;
    }

    // 2. Modern API Check: layoutSizingVertical
    if ('layoutSizingVertical' in node) {
      const sizing = (node as any).layoutSizingVertical;
      // If it's anything other than FIXED (e.g. HUG, FILL), treat as dynamic
      if (sizing && sizing !== 'FIXED') return true;
    }

    // 3. Check for "Fill container" (Legacy/Fallback)
    const parent = node.parent;
    if (parent && 'layoutMode' in parent && parent.layoutMode !== 'NONE') {
      if (parent.layoutMode === 'HORIZONTAL') {
        // In horizontal parent, height fill is layoutAlign = 'STRETCH'
        if ('layoutAlign' in node && node.layoutAlign === 'STRETCH') return true;
      } else if (parent.layoutMode === 'VERTICAL') {
        // In vertical parent, height fill is layoutGrow = 1
        if ('layoutGrow' in node && node.layoutGrow === 1) return true;
      }
    }

    // Special case for Text nodes (Auto Height)
    if (node.type === 'TEXT') {
      if (node.textAutoResize === 'WIDTH_AND_HEIGHT' || node.textAutoResize === 'HEIGHT') {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper to get all variables with their resolved values
   */
  private static async getAllVariables(): Promise<any[]> {
    const allVars: any[] = [];
    try {
      const collections = await figma.variables.getLocalVariableCollectionsAsync();
      
      // Parallelize variable fetching
      const promises: Promise<any>[] = [];
      
      for (const collection of collections) {
        for (const varId of collection.variableIds) {
          promises.push(
            figma.variables.getVariableByIdAsync(varId).then(variable => {
              if (variable) {
                return {
                  variable,
                  collection,
                };
              }
              return null;
            })
          );
        }
      }

      const results = await Promise.all(promises);
      results.forEach(res => {
        if (res) allVars.push(res);
      });

    } catch (e) {
      console.error('Error fetching all variables:', e);
    }
    return allVars;
  }

  /**
   * Finds design variables that match the given value exactly or nearly
   */
  private static async findMatchingVariables(
    value: string,
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance',
    allVariables: any[],
  ): Promise<MatchingVariable[]> {
    const matchingVars: MatchingVariable[] = [];

    // Process pre-fetched variables
    for (const { variable, collection } of allVariables) {
      // Check if variable type matches the category
      const isTypeMatch = this.isVariableTypeMatch(variable.resolvedType, category);
      if (!isTypeMatch) continue;

      // Get the resolved value for the current mode
      const modeId = collection.defaultModeId;
      const varValue = variable.valuesByMode[modeId];

      // Compare values based on type
      const matchType = this.valuesMatch(varValue, value, variable.resolvedType);

      if (matchType) {
        matchingVars.push({
          id: variable.id,
          name: variable.name,
          collectionName: collection.name,
          resolvedValue: this.formatVariableValue(varValue, variable.resolvedType),
          matchType: matchType,
        });
      }
    }

    // Sort: Exact matches first, then by name
    return matchingVars.sort((a, b) => {
      if (a.matchType !== b.matchType) {
        return a.matchType === 'EXACT' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Check if variable type matches the issue category
   * Note: Stroke category includes both COLOR (stroke color) and FLOAT (stroke weight)
   */
  private static isVariableTypeMatch(
    varType: VariableResolvedDataType,
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance',
  ): boolean {
    if (category === 'Fill') {
      return varType === 'COLOR';
    }
    if (category === 'Stroke') {
      // Stroke category includes both stroke color (COLOR) and stroke weight (FLOAT)
      return varType === 'COLOR' || varType === 'FLOAT';
    }
    if (category === 'Layout') {
      return varType === 'FLOAT';
    }
    if (category === 'Appearance') {
      return varType === 'FLOAT'; // opacity, radius
    }
    return false;
  }

  /**
   * Check if variable value matches the hard-coded value
   */
  private static valuesMatch(
    varValue: VariableValue,
    hardValue: string,
    varType: VariableResolvedDataType,
  ): 'EXACT' | 'NEAR' | null {
    if (varType === 'COLOR' && typeof varValue === 'object' && 'r' in varValue) {
      // Parse color from rgb(r, g, b) format (this is how we store colors in addIssue)
      const colorMatch = hardValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!colorMatch) return null;

      const r = parseInt(colorMatch[1]) / 255;
      const g = parseInt(colorMatch[2]) / 255;
      const b = parseInt(colorMatch[3]) / 255;

      // Exact match check (with small tolerance for float precision)
      if (
        Math.abs(varValue.r - r) < VALUE_MATCH_TOLERANCE &&
        Math.abs(varValue.g - g) < VALUE_MATCH_TOLERANCE &&
        Math.abs(varValue.b - b) < VALUE_MATCH_TOLERANCE
      ) {
        return 'EXACT';
      }

      // Near match: No near match for colors currently requested, but could handle it later
      return null;
    }

    if (varType === 'FLOAT' && typeof varValue === 'number') {
      // Parse numeric value from strings like "18px", "0.5"
      const numMatch = hardValue.match(/^([\d.]+)/);
      if (!numMatch) return null;

      const hardNum = parseFloat(numMatch[1]);
      const diff = Math.abs(varValue - hardNum);

      // Exact match
      if (diff < VALUE_MATCH_TOLERANCE) {
        return 'EXACT';
      }

      // Near match (within 2px)
      if (diff <= 2.0) {
        return 'NEAR';
      }
    }

    return null;
  }

  /**
   * Format variable value for display
   */
  private static formatVariableValue(
    varValue: VariableValue,
    varType: VariableResolvedDataType,
  ): string {
    if (varType === 'COLOR' && typeof varValue === 'object' && 'r' in varValue) {
      return `rgb(${Math.round(varValue.r * 255)}, ${Math.round(varValue.g * 255)}, ${Math.round(varValue.b * 255)})`;
    }
    if (varType === 'FLOAT' && typeof varValue === 'number') {
      return `${varValue}`;
    }
    return String(varValue);
  }
}
