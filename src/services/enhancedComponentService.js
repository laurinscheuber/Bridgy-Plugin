import { 
  generateComponentTest, 
  generateComponentSetTest 
} from '../utils/testGenerator';

/**
 * Enhanced service for collecting and processing Figma components
 * with improved test generation capabilities
 */
class EnhancedComponentService {
  static componentMap = new Map();

  /**
   * Collects all components from the Figma document
   * @returns {Promise<Array>} - Array of component data
   */
  static async collectComponents() {
    const componentsData = [];
    const componentSets = [];

    // Function to recursively collect nodes
    async function collectNodes(node) {
      // Check if this is a component or component set
      if ((node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') && node.visible !== false) {
        // Extract component styles
        let styles = {};
        
        try {
          // Get CSS styles from Figma
          styles = await node.getCSSAsync();
          
          // If the component has a "State=hover" in its name, extract hover state
          if (node.name.includes('State=hover') || node.name.includes('state=hover')) {
            // Clone styles and mark them as hover state
            styles = {
              ...styles,
              '_figmaState': 'hover'
            };
          } else if (node.name.includes('State=focus') || node.name.includes('state=focus')) {
            // Clone styles and mark them as focus state
            styles = {
              ...styles,
              '_figmaState': 'focus'
            };
          }
        } catch (e) {
          console.error(`Error getting CSS for component ${node.name}:`, e);
        }
        
        // Create component data object
        const componentData = {
          id: node.id,
          name: node.name,
          type: node.type,
          path: node.name.includes('/') ? node.name.split('/').slice(0, -1).join('/') : '',
          styles: JSON.stringify(styles),
          children: [],
          parentId: node.parent ? node.parent.id : null
        };
        
        // Add to the map for quick access
        EnhancedComponentService.componentMap.set(node.id, componentData);
        
        // Sort into appropriate array
        if (node.type === 'COMPONENT_SET') {
          componentSets.push(componentData);
        } else {
          componentsData.push(componentData);
        }
      }
      
      // Recursively process children
      if ('children' in node) {
        for (const child of node.children) {
          await collectNodes(child);
        }
      }
    }
    
    // Process all pages in the document
    for (const page of figma.root.children) {
      await collectNodes(page);
    }
    
    // Link components to their component sets
    componentsData.forEach(component => {
      if (component.parentId) {
        const parent = this.componentMap.get(component.parentId);
        if (parent && parent.type === 'COMPONENT_SET') {
          parent.children.push(component);
          component.isChild = true;
        }
      }
    });
    
    // Return only top-level components and component sets
    return [
      ...componentSets,
      ...componentsData.filter(comp => !comp.isChild)
    ];
  }

  /**
   * Get a component by its ID
   * @param {string} id - Component ID
   * @returns {Object|undefined} - Component data or undefined if not found
   */
  static getComponentById(id) {
    return this.componentMap.get(id);
  }

  /**
   * Generate an Angular test for a component with enhanced features
   * @param {Object} component - Component data
   * @param {Object} options - Test generation options
   * @returns {string} - Generated test content
   */
  static generateTest(component, options = {}) {
    const { generateAllVariants = false } = options;
    
    // For component sets with variants, use the component set test generator
    if (component.type === 'COMPONENT_SET' && 
        generateAllVariants && 
        component.children && 
        component.children.length > 0) {
      return generateComponentSetTest(component);
    }
    
    // Generate a standard component test
    return generateComponentTest(component, options);
  }
}

export default EnhancedComponentService;