export interface UnitSettings {
  collections: { [collectionName: string]: string };
  groups: { [groupPath: string]: string };
}

export class UnitsService {
  private static unitSettings: UnitSettings = {
    collections: {},
    groups: {}
  };

  // Available CSS units
  static readonly AVAILABLE_UNITS = [
    'px', 'rem', 'em', '%', 'vw', 'vh', 'vmin', 'vmax', 
    'pt', 'pc', 'in', 'cm', 'mm', 'ex', 'ch', 'fr', 'none'
  ];

  // Default unit mappings based on variable name patterns
  private static readonly DEFAULT_UNIT_PATTERNS = {
    // Unitless values
    'opacity': 'none',
    'z-index': 'none',
    'line-height': 'none',
    'font-weight': 'none',
    'flex': 'none',
    'order': 'none',
    
    // Percentage values
    'width': '%',
    'height': '%',
    
    // Default to px for most size-related values
    'default': 'px'
  };

  static getDefaultUnit(variableName: string): string {
    const name = variableName.toLowerCase();
    
    // Check for specific patterns
    for (const pattern in this.DEFAULT_UNIT_PATTERNS) {
      if (pattern !== 'default' && name.includes(pattern)) {
        return this.DEFAULT_UNIT_PATTERNS[pattern as keyof typeof this.DEFAULT_UNIT_PATTERNS];
      }
    }
    
    // Special case for opacity-like values
    if (name.includes('opacity') || name.includes('alpha') || 
        name.includes('z-index') || name.includes('line-height') ||
        name.includes('font-weight') || name.includes('flex') || 
        name.includes('order')) {
      return 'none';
    }
    
    return this.DEFAULT_UNIT_PATTERNS.default;
  }

  static getUnitForVariable(variableName: string, collectionName: string, groupName?: string): string {
    // Priority: group setting > collection setting > default
    // User settings always override smart defaults
    if (groupName) {
      const groupKey = `${collectionName}/${groupName}`;
      if (this.unitSettings.groups[groupKey]) {
        return this.unitSettings.groups[groupKey];
      }
    }
    
    if (this.unitSettings.collections[collectionName]) {
      return this.unitSettings.collections[collectionName];
    }
    
    // Only use smart defaults if no user setting exists
    return this.getDefaultUnit(variableName);
  }

  static updateUnitSettings(newSettings: Partial<UnitSettings>): void {
    if (newSettings.collections) {
      this.unitSettings.collections = { ...newSettings.collections };
    }
    if (newSettings.groups) {
      this.unitSettings.groups = { ...newSettings.groups };
    }
  }

  static getUnitSettings(): UnitSettings {
    return { ...this.unitSettings };
  }

  static resetUnitSettings(): void {
    this.unitSettings = {
      collections: {},
      groups: {}
    };
  }

  static formatValueWithUnit(value: number, unit: string): string {
    if (unit === 'none' || unit === '') {
      return String(value);
    }
    return `${value}${unit}`;
  }

  // Save unit settings to Figma storage
  static async saveUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      await figma.clientStorage.setAsync(settingsKey, this.unitSettings);
      console.log('Unit settings saved successfully');
    } catch (error) {
      console.error('Error saving unit settings:', error);
      throw error;
    }
  }

  // Load unit settings from Figma storage
  static async loadUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      const savedSettings = await figma.clientStorage.getAsync(settingsKey);
      if (savedSettings) {
        this.unitSettings = savedSettings;
        console.log('Unit settings loaded successfully');
      }
    } catch (error) {
      console.error('Error loading unit settings:', error);
      // Don't throw - just use defaults
    }
  }
}