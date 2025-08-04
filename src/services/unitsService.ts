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
    
    // Default to px for all size-related values
    'default': 'px'
  };

  static getDefaultUnit(variableName: string): string {
    const name = variableName.toLowerCase();
    
    // Check for unitless values only
    if (name.includes('opacity') || name.includes('alpha') || 
        name.includes('z-index') || name.includes('line-height') ||
        name.includes('font-weight') || name.includes('flex') || 
        name.includes('order')) {
      return 'none';
    }
    
    // Everything else defaults to px (width, height, border, padding, margin, radius, etc.)
    return 'px';
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

  static resetUnitSettingsInMemory(): void {
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

  // Save unit settings to shared Figma storage (accessible by all team members)
  static async saveUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      // Save to shared document storage so all team members can access
      figma.root.setSharedPluginData(
        "DesignSync",
        settingsKey,
        JSON.stringify(this.unitSettings)
      );
      
      // Track metadata
      figma.root.setSharedPluginData(
        "DesignSync",
        `${settingsKey}-meta`,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          savedBy: figma.currentUser?.name || "Unknown user",
        })
      );
      
    } catch (error) {
      console.error('Error saving unit settings:', error);
      throw error;
    }
  }

  // Load unit settings from shared Figma storage
  static async loadUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      
      // Try to load from shared document storage first
      const sharedSettings = figma.root.getSharedPluginData(
        "DesignSync",
        settingsKey
      );
      
      if (sharedSettings) {
        try {
          this.unitSettings = JSON.parse(sharedSettings);
          return;
        } catch (parseError) {
          console.error('Error parsing shared unit settings:', parseError);
        }
      }
      
      // Migration: Check for personal settings and migrate to shared
      const personalSettings = await figma.clientStorage.getAsync(settingsKey);
      if (personalSettings) {
        this.unitSettings = personalSettings;
        // Save as shared settings
        await this.saveUnitSettings();
        // Remove old personal settings to prevent confusion
        await figma.clientStorage.deleteAsync(settingsKey);
        return;
      }
      
    } catch (error) {
      console.error('Error loading unit settings:', error);
      // Don't throw - just use defaults
    }
  }

  // Reset unit settings (remove from both personal and shared storage)
  static async resetUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      
      // Reset in-memory settings  
      this.unitSettings = {
        collections: {},
        groups: {}
      };
      
      // Remove shared document storage
      figma.root.setSharedPluginData("DesignSync", settingsKey, "");
      figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");
      
      // Remove personal client storage (cleanup)
      await figma.clientStorage.deleteAsync(settingsKey);
      
    } catch (error) {
      console.error('Error resetting unit settings:', error);
      throw error;
    }
  }
}