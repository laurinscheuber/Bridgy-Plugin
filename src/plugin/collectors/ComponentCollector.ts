import { ComponentData } from '../../shared/types';

/**
 * Collects components from Figma document
 */
export class ComponentCollector {
  private static componentMap = new Map<string, ComponentData>();

  /**
   * Collects all components from the Figma document
   */
  static async collectAll(): Promise<ComponentData[]> {
    const componentsData: ComponentData[] = [];
    const componentSets: ComponentData[] = [];
    this.componentMap = new Map<string, ComponentData>();

    // First pass to collect all components and component sets
    for (const page of figma.root.children) {
      await this.collectNodes(page, componentsData, componentSets);
    }

    // Second pass to establish parent-child relationships for component sets
    for (const component of componentsData) {
      if (component.parentId) {
        const parent = this.componentMap.get(component.parentId);
        if (parent && parent.type === "COMPONENT_SET") {
          parent.children.push(component);
          component.isChild = true; // Mark as child for UI rendering
        }
      }
    }

    // Create final hierarchical data with only top-level components and component sets
    return [
      ...componentSets,
      ...componentsData.filter((comp) => !comp.isChild),
    ];
  }

  /**
   * Gets a component by ID from the internal map
   */
  static getComponent(id: string): ComponentData | undefined {
    return this.componentMap.get(id);
  }

  /**
   * Recursively collects nodes from the document
   */
  private static async collectNodes(
    node: BaseNode,
    componentsData: ComponentData[],
    componentSets: ComponentData[]
  ): Promise<void> {
    if ("type" in node) {
      if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
        const componentStyles = await node.getCSSAsync();
        const componentData: ComponentData = {
          id: node.id,
          name: node.name,
          type: node.type,
          styles: JSON.stringify(componentStyles),
          pageName:
            node.parent && "name" in node.parent ? node.parent.name : "Unknown",
          parentId: node.parent?.id,
          children: [],
        };

        this.componentMap.set(node.id, componentData);

        if (node.type === "COMPONENT_SET") {
          componentSets.push(componentData);
        } else {
          componentsData.push(componentData);
        }
      }

      if ("children" in node) {
        for (const child of node.children) {
          await this.collectNodes(child, componentsData, componentSets);
        }
      }
    }
  }
}