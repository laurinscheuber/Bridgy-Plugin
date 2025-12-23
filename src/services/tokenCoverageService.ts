/**
 * Service for analyzing token coverage in Figma designs
 * Identifies elements that use hard-coded values instead of design tokens
 */

export interface TokenCoverageIssue {
  property: string;
  value: string;
  count: number;
  nodeIds: string[];
  nodeNames: string[];
  category: 'Layout' | 'Fill' | 'Stroke' | 'Appearance';
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
    const allFrames = currentPage.findAll(node => 
      node.type === 'FRAME' || 
      node.type === 'COMPONENT' || 
      node.type === 'COMPONENT_SET' ||
      node.type === 'INSTANCE'
    );

    const issuesMap: Map<string, TokenCoverageIssue> = new Map();
    let totalNodes = 0;

    for (const node of allFrames) {
      totalNodes++;
      await this.analyzeNode(node as SceneNode, issuesMap);
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
   * Analyzes a single node for token coverage issues
   */
  private static async analyzeNode(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>
  ): Promise<void> {
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
   * Determines if width uses Hug contents or Fill container sizing
   */
  private static isAutoOrFillWidth(node: any): boolean {
    // Newer API: explicit layout sizing on each axis
    if ('layoutSizingHorizontal' in node) {
      const mode = node.layoutSizingHorizontal;
      if (mode === 'HUG' || mode === 'FILL') return true;
    }

    // Auto-layout frame sizing modes (hug = AUTO)
    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      const layoutMode = node.layoutMode;
      const primary = (node as any).primaryAxisSizingMode;
      const cross = (node as any).counterAxisSizingMode;
      if (layoutMode === 'HORIZONTAL' && primary === 'AUTO') return true; // width hugs
      if (layoutMode === 'VERTICAL' && cross === 'AUTO') return true; // width hugs on cross-axis
    }

    return false;
  }

  /**
   * Determines if height uses Hug contents or Fill container sizing
   */
  private static isAutoOrFillHeight(node: any): boolean {
    if ('layoutSizingVertical' in node) {
      const mode = node.layoutSizingVertical;
      if (mode === 'HUG' || mode === 'FILL') return true;
    }

    if ('layoutMode' in node && node.layoutMode !== 'NONE') {
      const layoutMode = node.layoutMode;
      const primary = (node as any).primaryAxisSizingMode;
      const cross = (node as any).counterAxisSizingMode;
      if (layoutMode === 'VERTICAL' && primary === 'AUTO') return true; // height hugs
      if (layoutMode === 'HORIZONTAL' && cross === 'AUTO') return true; // height hugs on cross-axis
    }

    return false;
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

    // Check width (if not auto/hug/fill) - exclude zero values
    if (
      layoutNode.width && typeof layoutNode.width === 'number' && layoutNode.width !== 0 &&
      !this.isVariableBound(layoutNode, 'width') &&
      !this.isAutoOrFillWidth(layoutNode)
    ) {
      this.addIssue(issuesMap, 'Width', `${layoutNode.width}px`, node, 'Layout');
    }

    // Check height (if not auto/hug/fill) - exclude zero values
    if (
      layoutNode.height && typeof layoutNode.height === 'number' && layoutNode.height !== 0 &&
      !this.isVariableBound(layoutNode, 'height') &&
      !this.isAutoOrFillHeight(layoutNode)
    ) {
      this.addIssue(issuesMap, 'Height', `${layoutNode.height}px`, node, 'Layout');
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
      // Check gap (itemSpacing) - ignore 'AUTO' and exclude zero values
      const isAutoGap = (layoutNode as any).itemSpacing === 'AUTO';
      if (typeof (layoutNode as any).itemSpacing === 'number' && (layoutNode as any).itemSpacing !== 0 && !isAutoGap && !this.isVariableBound(layoutNode, 'itemSpacing')) {
        this.addIssue(issuesMap, 'Gap', `${(layoutNode as any).itemSpacing}px`, node, 'Layout');
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

    // Check if fills are bound to variables
    if (!this.isVariableBound(node, 'fills')) {
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

    // Check stroke color
    if (!this.isVariableBound(node, 'strokes')) {
      const solidStroke = strokes.find(stroke => stroke.type === 'SOLID' && stroke.visible !== false);
      if (solidStroke && solidStroke.type === 'SOLID') {
        const color = solidStroke.color;
        const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
        this.addIssue(issuesMap, 'Stroke Color', colorValue, node, 'Stroke');
      }
    }

    // Check stroke weight - exclude zero values
    if ('strokeWeight' in node && typeof node.strokeWeight === 'number' && node.strokeWeight !== 0 && !this.isVariableBound(node, 'strokeWeight')) {
      this.addIssue(issuesMap, 'Stroke Weight', `${node.strokeWeight}px`, node, 'Stroke');
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
   * Checks if a property is bound to a variable (design token)
   */
  private static isVariableBound(node: any, property: string): boolean {
    if (!node.boundVariables) return false;
    
    const boundVariable = node.boundVariables[property];
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
    
    if (issuesMap.has(key)) {
      const issue = issuesMap.get(key)!;
      issue.count++;
      issue.nodeIds.push(node.id);
      issue.nodeNames.push(node.name);
    } else {
      issuesMap.set(key, {
        property,
        value,
        count: 1,
        nodeIds: [node.id],
        nodeNames: [node.name],
        category
      });
    }
  }
}
