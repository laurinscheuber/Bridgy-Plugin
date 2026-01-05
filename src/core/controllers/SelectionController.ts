import { ComponentService } from "../../services/componentService";

export class SelectionController {
  static async handleSelection(msg: { componentId: string }) {
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
  }

  static async handleFocusNode(msg: { nodeId: string }) {
    try {
      if (msg.nodeId) {
        // Use async variant for modern Figma environments (dynamic-page access)
        const node = await figma.getNodeByIdAsync(msg.nodeId) as SceneNode;

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
          console.warn(`Node not found for focusing: ${msg.nodeId}`);
        }
      }
    } catch (focusError) {
      console.error("Error focusing node:", focusError);
    }
  }

  static async loadComponentStyles(msg: { componentId: string }) {
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
  }
}
