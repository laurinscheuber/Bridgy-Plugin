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
    'paddingBottom'
  ],
  Fill: [
    'fills'
  ],
  Stroke: [
    'strokes',
    'strokeWeight'
  ],
  Appearance: [
    'opacity',
    'topLeftRadius',
    'topRightRadius',
    'bottomLeftRadius',
    'bottomRightRadius'
  ]
};

export class TokenCoverageService {
  /**
   * Analyzes the current page for token coverage
   */
  static async analyzeCurrentPage(): Promise<TokenCoverageResult> {
    const currentPage = figma.currentPage;
    const allNodes = currentPage.findAll(node => 
      // node.type === 'FRAME' || 
      node.type === 'COMPONENT' || 
      node.type === 'COMPONENT_SET'
      // node.type === 'INSTANCE'
    );
    
    return this.analyzeNodes(allNodes as SceneNode[]);
  }

  /**
   * Analyzes the entire document for token coverage
   */
  static async analyzeDocument(): Promise<TokenCoverageResult> {
    const allPages = figma.root.children;
    let allNodes: SceneNode[] = [];
    
    // Iterate through all pages
    for (const page of allPages) {
      const pageNodes = page.findAll(node => 
        // node.type === 'FRAME' || 
        node.type === 'COMPONENT' || 
        node.type === 'COMPONENT_SET'
        // node.type === 'INSTANCE'
      );
      allNodes = [...allNodes, ...(pageNodes as SceneNode[])];
    }
    
    return this.analyzeNodes(allNodes);
  }

  /**
   * Smart analysis: Checks current page first using analyzeNodes logic directly to avoid redundant calls.
   * If current page has 0 issues, it searches other pages.
   * If another page has issues, it switches to that page and returns its results.
   */
  static async analyzeSmart(): Promise<TokenCoverageResult> {
    // 1. Analyze current page
    const currentPageResult = await this.analyzeCurrentPage();

    // 2. If issues found, stick with current page
    if (currentPageResult.totalIssues > 0) {
      return currentPageResult;
    }

    // 3. If no issues, look for a page that DOES have issues
    const allPages = figma.root.children;
    const currentPageId = figma.currentPage.id;

    for (const page of allPages) {
      // Skip the page we just checked
      if (page.id === currentPageId) continue;

      const pageNodes = page.findAll(node => 
        // node.type === 'FRAME' || 
        node.type === 'COMPONENT' || 
        node.type === 'COMPONENT_SET'
        // node.type === 'INSTANCE'
      );
      
      const pageResult = await this.analyzeNodes(pageNodes as SceneNode[]);

      if (pageResult.totalIssues > 0) {
        // Found a page with issues! Switch to it.
        await figma.setCurrentPageAsync(page);
        return pageResult;
      }
    }

    // 4. If no issues found anywhere, return the original clean result
    return currentPageResult;
  }

  /**
   * Helper to analyze a list of nodes
   */
  private static async analyzeNodes(nodes: SceneNode[]): Promise<TokenCoverageResult> {
    const issuesMap: Map<string, TokenCoverageIssue> = new Map();
    let totalNodes = 0;

    // Optimization: Fetch all variables once
    console.log('Fetching variables for analysis...');
    const allVariables = await this.getAllVariables();
    console.log(`Fetched ${allVariables.length} variables for analysis`);

    for (const node of nodes) {
      totalNodes++;
      await this.analyzeNode(node, issuesMap);
    }

    // Find matching variables for each issue
    for (const issue of issuesMap.values()) {
      issue.matchingVariables = await this.findMatchingVariables(issue.value, issue.category, allVariables);
    }

    // Group issues by category
    const issuesByCategory = {
      Layout: [] as TokenCoverageIssue[],
      Fill: [] as TokenCoverageIssue[],
      Stroke: [] as TokenCoverageIssue[],
      Appearance: [] as TokenCoverageIssue[]
    };

    for (const issue of issuesMap.values()) {
      issuesByCategory[issue.category].push(issue);
    }

    // Sort issues by count (most frequent first)
    for (const category of Object.keys(issuesByCategory) as Array<keyof typeof issuesByCategory>) {
      issuesByCategory[category].sort((a, b) => b.count - a.count);
    }

    return {
      totalNodes,
      totalIssues: issuesMap.size,
      issuesByCategory
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
    issuesMap: Map<string, TokenCoverageIssue>
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
   * Checks layout properties (spacing, sizing)
   */
  private static checkLayoutProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>
  ): void {
    // Check if node has layout properties
    if (!('minWidth' in node)) return;

    const layoutNode = node as FrameNode | ComponentNode | InstanceNode;

    // Check minWidth - exclude zero values
    if (layoutNode.minWidth !== null && layoutNode.minWidth !== 0 && !this.isVariableBound(layoutNode, 'minWidth')) {
      this.addIssue(issuesMap, 'Min Width', `${layoutNode.minWidth}px`, node, 'Layout');
    }

    // Check maxWidth - exclude zero values
    if (layoutNode.maxWidth !== null && layoutNode.maxWidth !== 0 && !this.isVariableBound(layoutNode, 'maxWidth')) {
      this.addIssue(issuesMap, 'Max Width', `${layoutNode.maxWidth}px`, node, 'Layout');
    }

    // Check width (if not auto) - exclude zero values and dynamic sizing
    if (layoutNode.width && typeof layoutNode.width === 'number' && layoutNode.width !== 0 
        && !this.isVariableBound(layoutNode, 'width')
        && !this.isWidthDynamic(layoutNode)) {
      this.addIssue(issuesMap, 'Width', `${Math.round(layoutNode.width * 100) / 100}px`, node, 'Layout');
    }

    // Check height (if not auto) - exclude zero values and dynamic sizing
    if (layoutNode.height && typeof layoutNode.height === 'number' && layoutNode.height !== 0 
        && !this.isVariableBound(layoutNode, 'height')
        && !this.isHeightDynamic(layoutNode)) {
      this.addIssue(issuesMap, 'Height', `${Math.round(layoutNode.height * 100) / 100}px`, node, 'Layout');
    }

    // Check minHeight - exclude zero values
    if (layoutNode.minHeight !== null && layoutNode.minHeight !== 0 && !this.isVariableBound(layoutNode, 'minHeight')) {
      this.addIssue(issuesMap, 'Min Height', `${layoutNode.minHeight}px`, node, 'Layout');
    }

    // Check maxHeight - exclude zero values
    if (layoutNode.maxHeight !== null && layoutNode.maxHeight !== 0 && !this.isVariableBound(layoutNode, 'maxHeight')) {
      this.addIssue(issuesMap, 'Max Height', `${layoutNode.maxHeight}px`, node, 'Layout');
    }

    // Check auto-layout properties
    if ('layoutMode' in layoutNode && layoutNode.layoutMode !== 'NONE') {
      // Check gap (itemSpacing) - exclude zero values
      if (typeof layoutNode.itemSpacing === 'number' && layoutNode.itemSpacing !== 0 && !this.isVariableBound(layoutNode, 'itemSpacing')) {
        this.addIssue(issuesMap, 'Gap', `${layoutNode.itemSpacing}px`, node, 'Layout');
      }

      // Check padding - consolidate if all values are the same, exclude zero values
      const paddingLeft = typeof layoutNode.paddingLeft === 'number' ? layoutNode.paddingLeft : 0;
      const paddingTop = typeof layoutNode.paddingTop === 'number' ? layoutNode.paddingTop : 0;
      const paddingRight = typeof layoutNode.paddingRight === 'number' ? layoutNode.paddingRight : 0;
      const paddingBottom = typeof layoutNode.paddingBottom === 'number' ? layoutNode.paddingBottom : 0;
      
      // Check if all padding values are the same and not bound to variables
      const allPaddingSame = paddingLeft === paddingTop && paddingTop === paddingRight && paddingRight === paddingBottom;
      const anyPaddingBound = this.isVariableBound(layoutNode, 'paddingLeft') || 
                              this.isVariableBound(layoutNode, 'paddingTop') ||
                              this.isVariableBound(layoutNode, 'paddingRight') ||
                              this.isVariableBound(layoutNode, 'paddingBottom');
      
      if (allPaddingSame && !anyPaddingBound && paddingLeft !== 0) {
        // Report as consolidated "Padding"
        this.addIssue(issuesMap, 'Padding', `${paddingLeft}px`, node, 'Layout');
      } else {
        // Report individual padding values (only non-zero and non-bound)
        if (paddingLeft !== 0 && !this.isVariableBound(layoutNode, 'paddingLeft')) {
          this.addIssue(issuesMap, 'Padding Left', `${paddingLeft}px`, node, 'Layout');
        }
        if (paddingTop !== 0 && !this.isVariableBound(layoutNode, 'paddingTop')) {
          this.addIssue(issuesMap, 'Padding Top', `${paddingTop}px`, node, 'Layout');
        }
        if (paddingRight !== 0 && !this.isVariableBound(layoutNode, 'paddingRight')) {
          this.addIssue(issuesMap, 'Padding Right', `${paddingRight}px`, node, 'Layout');
        }
        if (paddingBottom !== 0 && !this.isVariableBound(layoutNode, 'paddingBottom')) {
          this.addIssue(issuesMap, 'Padding Bottom', `${paddingBottom}px`, node, 'Layout');
        }
      }
    }
  }

  /**
   * Checks fill/color properties
   */
  private static checkFillProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>
  ): void {
    if (!('fills' in node)) return;

    const fills = node.fills;
    if (!Array.isArray(fills) || fills.length === 0) return;

    // Check if any paint has a color variable bound
    if (!this.isPaintColorVariableBound(fills)) {
      // Get the first solid fill
      const solidFill = fills.find(fill => fill.type === 'SOLID' && fill.visible !== false);
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
    issuesMap: Map<string, TokenCoverageIssue>
  ): void {
    if (!('strokes' in node)) return;

    const strokes = node.strokes;
    if (!Array.isArray(strokes) || strokes.length === 0) return;

    // Check stroke color (paint-level binding)
    if (!this.isPaintColorVariableBound(strokes)) {
      const solidStroke = strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible !== false);
      if (solidStroke && solidStroke.type === 'SOLID') {
        const color = solidStroke.color;
        const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
        this.addIssue(issuesMap, 'Stroke Color', colorValue, node, 'Stroke');
      }
    }

    // Check stroke weight - exclude zero values
    const hasNumericStrokeWeight = 'strokeWeight' in node && typeof (node as any).strokeWeight === 'number';
    const strokeWeightValue = hasNumericStrokeWeight ? (node as any).strokeWeight : 0;

    // Consider any of the individual stroke weights as a valid variable binding as well
    const anyStrokeWeightBound = this.isVariableBound(node as any, 'strokeWeight') ||
                                 this.isVariableBound(node as any, 'strokeTopWeight') ||
                                 this.isVariableBound(node as any, 'strokeRightWeight') ||
                                 this.isVariableBound(node as any, 'strokeBottomWeight') ||
                                 this.isVariableBound(node as any, 'strokeLeftWeight');

    if (hasNumericStrokeWeight && strokeWeightValue !== 0 && !anyStrokeWeightBound) {
      this.addIssue(issuesMap, 'Stroke Weight', `${strokeWeightValue}px`, node, 'Stroke');
    }
  }

  /**
   * Checks appearance properties (opacity, radius)
   */
  private static checkAppearanceProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>
  ): void {
    // Check opacity - exclude zero and one (default) values
    if ('opacity' in node && node.opacity !== 1 && node.opacity !== 0 && !this.isVariableBound(node, 'opacity')) {
      this.addIssue(issuesMap, 'Opacity', `${node.opacity}`, node, 'Appearance');
    }

    // Check corner radius - exclude zero values as they typically don't need tokens
    if ('cornerRadius' in node) {
      const rectNode = node as RectangleNode | FrameNode | ComponentNode | InstanceNode;
      
      // Get all corner radius values
      const topLeft = typeof rectNode.topLeftRadius === 'number' ? rectNode.topLeftRadius : 0;
      const topRight = typeof rectNode.topRightRadius === 'number' ? rectNode.topRightRadius : 0;
      const bottomLeft = typeof rectNode.bottomLeftRadius === 'number' ? rectNode.bottomLeftRadius : 0;
      const bottomRight = typeof rectNode.bottomRightRadius === 'number' ? rectNode.bottomRightRadius : 0;
      
      // Check if all corner radii are the same and not bound to variables
      const allRadiiSame = topLeft === topRight && topRight === bottomLeft && bottomLeft === bottomRight;
      const anyRadiusBound = this.isVariableBound(rectNode, 'topLeftRadius') ||
                             this.isVariableBound(rectNode, 'topRightRadius') ||
                             this.isVariableBound(rectNode, 'bottomLeftRadius') ||
                             this.isVariableBound(rectNode, 'bottomRightRadius');
      
      if (allRadiiSame && !anyRadiusBound && topLeft > 0) {
        // Report as consolidated "Corner Radius"
        this.addIssue(issuesMap, 'Corner Radius', `${topLeft}px`, node, 'Appearance');
      } else {
        // Report individual corner radii (only non-zero and non-bound)
        if (topLeft > 0 && !this.isVariableBound(rectNode, 'topLeftRadius')) {
          this.addIssue(issuesMap, 'Corner Radius (Top Left)', `${topLeft}px`, node, 'Appearance');
        }
        if (topRight > 0 && !this.isVariableBound(rectNode, 'topRightRadius')) {
          this.addIssue(issuesMap, 'Corner Radius (Top Right)', `${topRight}px`, node, 'Appearance');
        }
        if (bottomLeft > 0 && !this.isVariableBound(rectNode, 'bottomLeftRadius')) {
          this.addIssue(issuesMap, 'Corner Radius (Bottom Left)', `${bottomLeft}px`, node, 'Appearance');
        }
        if (bottomRight > 0 && !this.isVariableBound(rectNode, 'bottomRightRadius')) {
          this.addIssue(issuesMap, 'Corner Radius (Bottom Right)', `${bottomRight}px`, node, 'Appearance');
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
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance'
  ): void {
    const key = `${category}:${property}:${value}`;
    
    // Find parent frame name
    let frameName = 'Unknown Frame';
    let parent = node.parent;
    while (parent) {
      if (parent.type === 'FRAME' || parent.type === 'SECTION' || parent.type === 'COMPONENT' || parent.type === 'COMPONENT_SET') {
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
        category
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
      for (const collection of collections) {
        for (const varId of collection.variableIds) {
          const variable = await figma.variables.getVariableByIdAsync(varId);
          if (variable) {
            allVars.push({
              variable,
              collection
            });
          }
        }
      }
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
    allVariables: any[]
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
          matchType: matchType
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
    category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance'
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
    varType: VariableResolvedDataType
  ): 'EXACT' | 'NEAR' | null {
    if (varType === 'COLOR' && typeof varValue === 'object' && 'r' in varValue) {
      // Parse color from rgb(r, g, b) format (this is how we store colors in addIssue)
      const colorMatch = hardValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (!colorMatch) return null;
      
      const r = parseInt(colorMatch[1]) / 255;
      const g = parseInt(colorMatch[2]) / 255;
      const b = parseInt(colorMatch[3]) / 255;
      
      // Exact match check (with small tolerance for float precision)
      if (Math.abs(varValue.r - r) < VALUE_MATCH_TOLERANCE &&
          Math.abs(varValue.g - g) < VALUE_MATCH_TOLERANCE &&
          Math.abs(varValue.b - b) < VALUE_MATCH_TOLERANCE) {
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
    varType: VariableResolvedDataType
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