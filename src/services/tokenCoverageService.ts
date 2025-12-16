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
   * Checks layout properties (spacing, sizing)
   */
  private static checkLayoutProperties(
    node: SceneNode,
    issuesMap: Map<string, TokenCoverageIssue>
  ): void {
    // Check if node has layout properties
    if (!('minWidth' in node)) return;

    const layoutNode = node as FrameNode | ComponentNode | InstanceNode;

    // Check minWidth
    if (layoutNode.minWidth !== null && !this.isVariableBound(layoutNode, 'minWidth')) {
      this.addIssue(issuesMap, 'Min Width', `${layoutNode.minWidth}px`, node, 'Layout');
    }

    // Check maxWidth
    if (layoutNode.maxWidth !== null && !this.isVariableBound(layoutNode, 'maxWidth')) {
      this.addIssue(issuesMap, 'Max Width', `${layoutNode.maxWidth}px`, node, 'Layout');
    }

    // Check width (if not auto)
    if (layoutNode.width && typeof layoutNode.width === 'number' && !this.isVariableBound(layoutNode, 'width')) {
      this.addIssue(issuesMap, 'Width', `${layoutNode.width}px`, node, 'Layout');
    }

    // Check height (if not auto)
    if (layoutNode.height && typeof layoutNode.height === 'number' && !this.isVariableBound(layoutNode, 'height')) {
      this.addIssue(issuesMap, 'Height', `${layoutNode.height}px`, node, 'Layout');
    }

    // Check minHeight
    if (layoutNode.minHeight !== null && !this.isVariableBound(layoutNode, 'minHeight')) {
      this.addIssue(issuesMap, 'Min Height', `${layoutNode.minHeight}px`, node, 'Layout');
    }

    // Check maxHeight
    if (layoutNode.maxHeight !== null && !this.isVariableBound(layoutNode, 'maxHeight')) {
      this.addIssue(issuesMap, 'Max Height', `${layoutNode.maxHeight}px`, node, 'Layout');
    }

    // Check auto-layout properties
    if ('layoutMode' in layoutNode && layoutNode.layoutMode !== 'NONE') {
      // Check gap (itemSpacing)
      if (layoutNode.itemSpacing && !this.isVariableBound(layoutNode, 'itemSpacing')) {
        this.addIssue(issuesMap, 'Gap', `${layoutNode.itemSpacing}px`, node, 'Layout');
      }

      // Check padding
      if (layoutNode.paddingLeft && !this.isVariableBound(layoutNode, 'paddingLeft')) {
        this.addIssue(issuesMap, 'Padding Left', `${layoutNode.paddingLeft}px`, node, 'Layout');
      }
      if (layoutNode.paddingTop && !this.isVariableBound(layoutNode, 'paddingTop')) {
        this.addIssue(issuesMap, 'Padding Top', `${layoutNode.paddingTop}px`, node, 'Layout');
      }
      if (layoutNode.paddingRight && !this.isVariableBound(layoutNode, 'paddingRight')) {
        this.addIssue(issuesMap, 'Padding Right', `${layoutNode.paddingRight}px`, node, 'Layout');
      }
      if (layoutNode.paddingBottom && !this.isVariableBound(layoutNode, 'paddingBottom')) {
        this.addIssue(issuesMap, 'Padding Bottom', `${layoutNode.paddingBottom}px`, node, 'Layout');
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

    // Check stroke weight
    if ('strokeWeight' in node && node.strokeWeight && !this.isVariableBound(node, 'strokeWeight')) {
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
    // Check opacity
    if ('opacity' in node && node.opacity !== 1 && !this.isVariableBound(node, 'opacity')) {
      this.addIssue(issuesMap, 'Opacity', `${node.opacity}`, node, 'Appearance');
    }

    // Check corner radius
    if ('cornerRadius' in node) {
      const rectNode = node as RectangleNode | FrameNode | ComponentNode | InstanceNode;
      
      // Check if individual corner radii are used
      if (typeof rectNode.topLeftRadius === 'number' && !this.isVariableBound(rectNode, 'topLeftRadius')) {
        this.addIssue(issuesMap, 'Corner Radius (Top Left)', `${rectNode.topLeftRadius}px`, node, 'Appearance');
      }
      if (typeof rectNode.topRightRadius === 'number' && !this.isVariableBound(rectNode, 'topRightRadius')) {
        this.addIssue(issuesMap, 'Corner Radius (Top Right)', `${rectNode.topRightRadius}px`, node, 'Appearance');
      }
      if (typeof rectNode.bottomLeftRadius === 'number' && !this.isVariableBound(rectNode, 'bottomLeftRadius')) {
        this.addIssue(issuesMap, 'Corner Radius (Bottom Left)', `${rectNode.bottomLeftRadius}px`, node, 'Appearance');
      }
      if (typeof rectNode.bottomRightRadius === 'number' && !this.isVariableBound(rectNode, 'bottomRightRadius')) {
        this.addIssue(issuesMap, 'Corner Radius (Bottom Right)', `${rectNode.bottomRightRadius}px`, node, 'Appearance');
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
