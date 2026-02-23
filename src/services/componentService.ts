import { Component, TextElement } from '../types';
import { objectEntries, arrayFlatMap } from '../utils/es2015-helpers';
import { ErrorHandler } from '../utils/errorHandler';
import { CSSCache, PerformanceCache } from './cacheService';

// Cache instances
const cssCache = CSSCache.getInstance();
const perfCache = PerformanceCache.getInstance();

interface ParsedComponentName {
  kebabName: string;
  pascalName: string;
}

export class ComponentService {
  private static componentMap = new Map<string, Component>();
  private static allVariables = new Map<string, unknown>();

  // Cache size limits to prevent memory leaks
  private static readonly MAX_CACHE_SIZE = 1000;
  private static readonly CACHE_CLEANUP_THRESHOLD = 800;

  // Legacy cache management (replaced by new CacheService)

  private static enforcesCacheLimit<K, V>(cache: Map<K, V>): void {
    if (cache.size > this.MAX_CACHE_SIZE) {
      // Remove oldest entries (LRU approximation)
      const keysToDelete = Array.from(cache.keys()).slice(
        0,
        cache.size - this.CACHE_CLEANUP_THRESHOLD,
      );
      keysToDelete.forEach((key) => cache.delete(key));
    }
  }

  private static addToCache<K, V>(cache: Map<K, V>, key: K, value: V): void {
    // If key exists, delete it first to move it to end (LRU)
    if (cache.has(key)) {
      cache.delete(key);
    }
    cache.set(key, value);
    this.enforcesCacheLimit(cache);
  }



  static async collectComponents(): Promise<Component[]> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        await this.collectAllVariables();
        const componentsData: Component[] = [];
        const componentSets: Component[] = [];
        this.componentMap = new Map<string, Component>();

        // Load all pages asynchronously for dynamic-page access
        try {
          await figma.loadAllPagesAsync();

          // Process all pages in parallel for better performance
          const pagePromises = figma.root.children.map(async (page) => {
            if (page.type !== 'PAGE') {
              return { components: [], componentSets: [] };
            }
            const pageComponents: Component[] = [];
            const pageComponentSets: Component[] = [];

            // Create a page-specific collectNodes function to avoid race conditions
            async function collectPageNodes(node: BaseNode) {
              try {
                if (!('type' in node)) {
                  return;
                }

                if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
                  try {
                    // Create lightweight component data without expensive CSS/text operations
                    const componentData: Component = {
                      id: node.id,
                      name: node.name,
                      type: node.type,
                      styles: {}, // Will be loaded lazily when needed
                      pageName: page.name,
                      parentId: node.parent && node.parent.id,
                      children: [],
                      textElements: [], // Will be loaded lazily when needed
                      hasTextContent: false,
                    };

                    ComponentService.componentMap.set(node.id, componentData);

                    // Add to appropriate collection based on type
                    if (node.type === 'COMPONENT_SET') {
                      pageComponentSets.push(componentData);
                    } else {
                      pageComponents.push(componentData);
                    }
                  } catch (componentError) {
                    ErrorHandler.handleError(componentError as Error, {
                      operation: `process_component_${node.name}`,
                      component: 'ComponentService',
                      severity: 'medium',
                    });
                  }
                }

                if ('children' in node && node.children) {
                  for (const child of node.children) {
                    try {
                      await collectPageNodes(child);
                    } catch (childError) {
                      ErrorHandler.handleError(childError as Error, {
                        operation: 'collect_component_children',
                        component: 'ComponentService',
                        severity: 'medium',
                      });
                    }
                  }
                }
              } catch (nodeError) {
                ErrorHandler.handleError(nodeError as Error, {
                  operation: 'collect_node',
                  component: 'ComponentService',
                  severity: 'medium',
                });
              }
            }

            try {
              await collectPageNodes(page);
              return { components: pageComponents, componentSets: pageComponentSets };
            } catch (pageError) {
              ErrorHandler.handleError(pageError as Error, {
                operation: `collect_page_components_${page.name}`,
                component: 'ComponentService',
                severity: 'medium',
              });
              return { components: [], componentSets: [] };
            }
          });

          // Wait for all pages to complete and merge results
          const pageResults = await Promise.all(pagePromises);
          pageResults.forEach(({ components, componentSets: pageSets }) => {
            componentsData.push(...components);
            componentSets.push(...pageSets);
          });
        } catch (loadError) {
          ErrorHandler.handleError(loadError as Error, {
            operation: 'load_all_pages',
            component: 'ComponentService',
            severity: 'high',
          });
        }

        try {
          componentsData.forEach((component) => {
            if (component.parentId) {
              const parent = this.componentMap.get(component.parentId);
              if (parent && parent.type === 'COMPONENT_SET') {
                parent.children.push(component);
                component.isChild = true;
              }
            }
          });
        } catch (organizationError) {
          ErrorHandler.handleError(organizationError as Error, {
            operation: 'organize_component_hierarchy',
            component: 'ComponentService',
            severity: 'low',
          });
        }

        const finalComponents = componentSets.concat(
          componentsData.filter((comp) => !comp.isChild),
        );
        return finalComponents;
      },
      {
        operation: 'collect_components',
        component: 'ComponentService',
        severity: 'high',
      },
    );
  }

  static getComponentById(id: string): Component | undefined {
    return this.componentMap.get(id);
  }



  private static async collectAllVariables(): Promise<void> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        const collections = await figma.variables.getLocalVariableCollectionsAsync();
        this.allVariables.clear();

        const variablePromises = arrayFlatMap(collections, (collection) =>
          collection.variableIds.map((variableId) =>
            figma.variables.getVariableByIdAsync(variableId).catch((error) => {
              ErrorHandler.handleError(error as Error, {
                operation: `get_variable_${variableId}`,
                component: 'ComponentService',
                severity: 'low',
              });
              return null; // Return null for failed variables
            }),
          ),
        );

        const variables = await Promise.all(variablePromises);

        variables.forEach((variable) => {
          if (variable) {
            try {
              this.allVariables.set(variable.id, variable);
              const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
              this.allVariables.set(formattedName, variable);
            } catch (error) {
              ErrorHandler.handleError(error as Error, {
                operation: `process_variable_${variable.name}`,
                component: 'ComponentService',
                severity: 'low',
              });
            }
          }
        });
      },
      {
        operation: 'collect_all_variables',
        component: 'ComponentService',
        severity: 'medium',
      },
    );
  }

  private static async extractTextElements(
    node: ComponentNode | ComponentSetNode,
  ): Promise<TextElement[]> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        const textElements: TextElement[] = [];

        async function traverseNode(currentNode: SceneNode): Promise<void> {
          try {
            if (currentNode.type === 'TEXT') {
              const textNode = currentNode as TextNode;

              let textStyles: any = {};
              let nodeStyles: any = {};

              try {
                // Use cached CSS for text nodes or fetch if not cached
                const cachedStyles = cssCache.getNodeCSS(textNode.id, 'TEXT');
                if (cachedStyles) {
                  nodeStyles = JSON.parse(cachedStyles);
                } else {
                  const startTime =
                    typeof performance !== 'undefined' ? performance.now() : Date.now();
                  nodeStyles = await textNode.getCSSAsync();
                  cssCache.cacheNodeCSS(textNode.id, 'TEXT', JSON.stringify(nodeStyles));

                  const endTime =
                    typeof performance !== 'undefined' ? performance.now() : Date.now();
                  const duration = endTime - startTime;
                  perfCache.cacheDuration('getCSSAsync-text', duration);
                }
                textStyles = {
                  fontSize: nodeStyles['font-size'],
                  fontFamily: nodeStyles['font-family'],
                  fontWeight: nodeStyles['font-weight'],
                  lineHeight: nodeStyles['line-height'],
                  letterSpacing: nodeStyles['letter-spacing'],
                  textAlign: nodeStyles['text-align'],
                  color: nodeStyles['color'],
                  textDecoration: nodeStyles['text-decoration'],
                  textTransform: nodeStyles['text-transform'],
                  fontStyle: nodeStyles['font-style'],
                  fontVariant: nodeStyles['font-variant'],
                  textShadow: nodeStyles['text-shadow'],
                  wordSpacing: nodeStyles['word-spacing'],
                  whiteSpace: nodeStyles['white-space'],
                  textIndent: nodeStyles['text-indent'],
                  textOverflow: nodeStyles['text-overflow'],
                };

                Object.keys(textStyles).forEach((key) => {
                  if (textStyles[key] == null || textStyles[key] === '') {
                    delete textStyles[key];
                  }
                });
              } catch (styleError) {
                ErrorHandler.handleError(styleError as Error, {
                  operation: `get_text_styles_${textNode.id}`,
                  component: 'ComponentService',
                  severity: 'low',
                });
                // Continue with empty styles
              }

              try {
                const textElement: TextElement = {
                  id: textNode.id,
                  content: textNode.characters || '',
                  type: 'TEXT',
                  styles: nodeStyles,
                  textStyles: textStyles,
                };

                textElements.push(textElement);
              } catch (elementError) {
                ErrorHandler.handleError(elementError as Error, {
                  operation: `create_text_element_${textNode.id}`,
                  component: 'ComponentService',
                  severity: 'low',
                });
                // Continue processing other text elements
              }
            }

            if ('children' in currentNode) {
              for (const child of currentNode.children) {
                await traverseNode(child);
              }
            }
          } catch (nodeError) {
            ErrorHandler.handleError(nodeError as Error, {
              operation: `traverse_text_node_${currentNode.id}`,
              component: 'ComponentService',
              severity: 'low',
            });
            // Continue processing other nodes
          }
        }

        await traverseNode(node);

        return textElements;
      },
      {
        operation: 'extract_text_elements',
        component: 'ComponentService',
        severity: 'medium',
      },
    );
  }

  /**
   * Lazily load component styles for a specific component
   */
  static async loadComponentStyles(componentId: string): Promise<Record<string, unknown> | null> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        const component = this.componentMap.get(componentId);
        if (!component) {
          throw new Error(`Component with ID ${componentId} not found`);
        }

        // Check if styles are already loaded
        if (component.styles && Object.keys(component.styles).length > 0) {
          return component.styles;
        }

        // Find the actual Figma node to load styles
        const node = await figma.getNodeByIdAsync(componentId);
        if (!node || (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET')) {
          throw new Error(`Node with ID ${componentId} is not a valid component`);
        }

        // Check CSS cache first
        const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        let nodeStyles: Record<string, unknown>;

        const cachedCSS = cssCache.getNodeCSS(node.id, node.type);
        if (cachedCSS) {
          // Use cached CSS
          nodeStyles = JSON.parse(cachedCSS);
        } else {
          // Load CSS asynchronously and cache it
          nodeStyles = await (node as ComponentNode).getCSSAsync();
          cssCache.cacheNodeCSS(node.id, node.type, JSON.stringify(nodeStyles));

          const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const duration = endTime - startTime;

          // Cache performance metrics
          perfCache.cacheDuration('getCSSAsync-lazy', duration);
        }

        // Update component with loaded styles
        component.styles = nodeStyles;
        this.componentMap.set(componentId, component);

        return nodeStyles;
      },
      {
        operation: 'load_component_styles_lazy',
        component: 'ComponentService',
        severity: 'medium',
      },
    );
  }

  /**
   * Lazily load text elements for a specific component
   */
  static async loadComponentTextElements(componentId: string): Promise<TextElement[]> {
    return await ErrorHandler.withErrorHandling(
      async () => {
        const component = this.componentMap.get(componentId);
        if (!component) {
          throw new Error(`Component with ID ${componentId} not found`);
        }

        // Check if text elements are already loaded
        if (component.textElements && component.textElements.length > 0) {
          return component.textElements;
        }

        // Find the actual Figma node to extract text elements
        const node = await figma.getNodeByIdAsync(componentId);
        if (!node || (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET')) {
          throw new Error(`Node with ID ${componentId} is not a valid component`);
        }

        // Extract text elements
        const textElements = await this.extractTextElements(
          node as ComponentNode | ComponentSetNode,
        );

        // Update component with loaded text elements
        component.textElements = textElements;
        component.hasTextContent = textElements.length > 0;
        this.componentMap.set(componentId, component);

        return textElements;
      },
      {
        operation: 'load_component_text_elements_lazy',
        component: 'ComponentService',
        severity: 'medium',
      },
    );
  }

  /**
   * Load both styles and text elements for a component (convenience method)
   */
  static async loadComponentDetails(componentId: string): Promise<{
    styles: Record<string, unknown> | null;
    textElements: TextElement[];
  }> {
    const [styles, textElements] = await Promise.all([
      this.loadComponentStyles(componentId),
      this.loadComponentTextElements(componentId),
    ]);

    return { styles, textElements };
  }

  /**
   * Get cache performance statistics
   */
  static getCacheStats(): {
    css: any;
    performance: any;
    recommendations: string[];
  } {
    const cssReport = cssCache.getEfficiencyReport();

    // Get performance insights
    const avgCSSTime = perfCache.getAverageDuration('getCSSAsync');
    const avgTextCSSTime = perfCache.getAverageDuration('getCSSAsync-text');

    const performanceStats = {
      averageCSSTime: avgCSSTime,
      averageTextCSSTime: avgTextCSSTime,
      totalCachedItems: cssCache.size(),
    };

    return {
      css: cssReport.stats,
      performance: performanceStats,
      recommendations: cssReport.recommendations,
    };
  }

  /**
   * Clear all caches (useful for testing or memory cleanup)
   */
  static clearCaches(): void {
    cssCache.clear();
    perfCache.clear();
  }

  /**
   * Cleanup expired cache entries
   */
  static cleanupCaches(): { cssCleared: number; perfCleared: number } {
    const cssCleared = cssCache.cleanup();
    const perfCleared = perfCache.cleanup();

    return { cssCleared, perfCleared };
  }
}
