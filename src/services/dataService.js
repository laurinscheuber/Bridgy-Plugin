/**
 * DataService - Singleton that loads and caches Figma document data
 * Provides synchronous access to variables and components after initialization
 */
class DataService {
  constructor() {
    this.variablesData = null;
    this.componentsData = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * Initialize the service by loading all necessary data
   * Should be called once at plugin startup
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._loadData();
    return this.initPromise;
  }

  /**
   * Internal method to load all data from Figma
   */
  async _loadData() {
    console.log('DataService: Loading data...');
    try {
      // Load variables
      const variableCollections = await figma.variables.getLocalVariableCollectionsAsync();
      this.variablesData = [];
      
      for (const collection of variableCollections) {
        const variablesPromises = collection.variableIds.map(async (id) => {
          const variable = await figma.variables.getVariableByIdAsync(id);
          if (!variable) return null;
          
          const valuesByModeEntries = Object.keys(variable.valuesByMode).map(modeId => {
            const value = variable.valuesByMode[modeId];
            const mode = collection.modes.find((m) => m.modeId === modeId);
            return {
              modeName: mode ? mode.name : "Unknown",
              value
            };
          });
          
          return {
            id: variable.id,
            name: variable.name,
            resolvedType: variable.resolvedType,
            valuesByMode: valuesByModeEntries
          };
        });
        
        const variablesResult = await Promise.all(variablesPromises);
        const variables = variablesResult.filter(Boolean);
        
        this.variablesData.push({
          name: collection.name,
          variables
        });
      }
      
      // Load components 
      const ComponentService = await import('./componentService');
      this.componentsData = await ComponentService.default.collectComponents();
      
      this.isInitialized = true;
      console.log('DataService: Data loaded successfully');
    } catch (error) {
      console.error('DataService: Failed to load data', error);
      throw error;
    }
  }

  /**
   * Get the loaded variables data
   * @returns {Array} Variables data
   * @throws {Error} If service is not initialized
   */
  getVariablesData() {
    this._checkInitialization();
    return this.variablesData;
  }

  /**
   * Get the loaded components data
   * @returns {Array} Components data
   * @throws {Error} If service is not initialized
   */
  getComponentsData() {
    this._checkInitialization();
    return this.componentsData;
  }

  /**
   * Check if service is initialized
   * @private
   * @throws {Error} If service is not initialized
   */
  _checkInitialization() {
    if (!this.isInitialized) {
      throw new Error('DataService not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
const dataService = new DataService();

export default dataService;