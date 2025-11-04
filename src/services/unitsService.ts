import { CSS_UNITS, LoggingService } from "../config";

export interface UnitSettings {
  collections: { [collectionName: string]: string };
  groups: { [groupPath: string]: string };
}

export class UnitsService {
  private static unitSettings: UnitSettings = {
    collections: {},
    groups: {}
  };

  static getDefaultUnit(variableName: string): string {
    const name = variableName.toLowerCase();
    
    // Helper function to check if a name matches any pattern
    const matchesPatterns = (patterns: readonly string[]) => {
      return patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase();
        // Use word boundaries to avoid false matches like "order" in "border-width"
        const wordBoundaryPattern = new RegExp(`\\b${normalizedPattern.replace(/[-_]/g, '[-_]?')}\\b`);
        return wordBoundaryPattern.test(name) ||
               name.includes(normalizedPattern) && (
                 name.startsWith(normalizedPattern + '-') ||
                 name.startsWith(normalizedPattern + '_') ||
                 name.endsWith('-' + normalizedPattern) ||
                 name.endsWith('_' + normalizedPattern) ||
                 name === normalizedPattern
               );
      });
    };
    
    // 1. Check for unitless values (highest priority)
    if (matchesPatterns(CSS_UNITS.UNITLESS_PATTERNS)) {
      return 'none';
    }
    
    // 2. Typography variables (prefer rem for scalability)
    if (matchesPatterns(CSS_UNITS.TYPOGRAPHY_PATTERNS)) {
      // For very small typography values (likely line-height multipliers), use none
      if (name.includes('line') || name.includes('leading')) {
        return 'none';
      }
      return 'rem';
    }
    
    // 3. Spacing variables (prefer rem for consistency with typography)
    if (matchesPatterns(CSS_UNITS.SPACING_PATTERNS)) {
      return 'rem';
    }
    
    // 4. Viewport-related variables (prefer viewport units)
    if (matchesPatterns(CSS_UNITS.VIEWPORT_PATTERNS)) {
      // Determine if width or height based
      if (name.includes('width') || name.includes('w-')) {
        return 'vw';
      }
      if (name.includes('height') || name.includes('h-')) {
        return 'vh';
      }
      return 'vw'; // Default to vw for viewport variables
    }
    
    // 5. Border radius logic (context-sensitive)
    if (matchesPatterns(CSS_UNITS.BORDER_RADIUS_PATTERNS)) {
      // Large radius values (likely for pills/circles) prefer %
      if (name.includes('pill') || name.includes('circle') || name.includes('full')) {
        return '%';
      }
      return 'px'; // Small radius values prefer px
    }
    
    // 6. Advanced pattern recognition (check before relative sizing)
    
    // Colors should never have units
    if (name.includes('color') || name.includes('bg') || name.includes('background') || 
        name.includes('border-color') || name.includes('text-color')) {
      return 'none';
    }
    
    // Duration/timing values (animations)
    if (name.includes('duration') || name.includes('delay') || name.includes('time')) {
      return 'none'; // CSS handles timing units separately (s, ms)
    }
    
    // Border widths (typically small px values) - check before relative sizing
    if (name.includes('border') && (name.includes('width') || name.includes('size'))) {
      return 'px';
    }
    
    // Box shadow and similar composite properties
    if (name.includes('shadow') || name.includes('blur') || name.includes('spread')) {
      return 'px';
    }
    
    // 7. Relative sizing (prefer % for responsive design)
    if (matchesPatterns(CSS_UNITS.RELATIVE_PATTERNS)) {
      // Container or layout widths prefer %
      if (name.includes('container') || name.includes('col') || name.includes('sidebar')) {
        return '%';
      }
      // Small fixed dimensions prefer px
      if (name.includes('icon') || name.includes('avatar') || name.includes('thumb')) {
        return 'px';
      }
      return '%'; // Default to % for responsive layouts
    }
    
    // 8. Semantic naming patterns
    
    // Design token prefixes
    if (name.startsWith('size-') || name.startsWith('space-')) {
      return 'rem';
    }
    
    if (name.startsWith('breakpoint-') || name.startsWith('container-')) {
      return 'px';
    }
    
    // Component-specific patterns
    if (name.includes('button') || name.includes('input') || name.includes('card')) {
      if (name.includes('padding') || name.includes('margin') || name.includes('gap')) {
        return 'rem';
      }
      if (name.includes('border') || name.includes('outline')) {
        return 'px';
      }
    }
    
    // 9. Default fallback with improved logic
    
    // If it contains numbers or size-related words, likely needs units
    if (/\d/.test(name) || name.includes('size') || name.includes('width') || name.includes('height')) {
      return 'px';
    }
    
    // Everything else defaults to px (safest choice)
    return CSS_UNITS.DEFAULT;
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
      this.unitSettings.collections = Object.assign({}, newSettings.collections);
    }
    if (newSettings.groups) {
      this.unitSettings.groups = Object.assign({}, newSettings.groups);
    }
  }

  static getUnitSettings(): UnitSettings {
    return Object.assign({}, this.unitSettings);
  }


  static formatValueWithUnit(value: number, unit: string): string {
    if (unit === 'none' || unit === '') {
      return String(value);
    }
    return `${value}${unit}`;
  }

  /**
   * Get explanation for why a specific unit was chosen for a variable
   * Useful for UI tooltips and documentation
   */
  static getUnitRationale(variableName: string): string {
    const name = variableName.toLowerCase();
    const chosenUnit = this.getDefaultUnit(variableName);
    
    // Helper function to check if a name matches any pattern
    const matchesPatterns = (patterns: readonly string[]) => {
      return patterns.some(pattern => {
        const normalizedPattern = pattern.toLowerCase();
        return name.includes(normalizedPattern) || 
               name.includes(normalizedPattern.replace('-', '')) ||
               name.includes(normalizedPattern.replace('-', '_'));
      });
    };
    
    if (chosenUnit === 'none') {
      if (matchesPatterns(CSS_UNITS.UNITLESS_PATTERNS)) {
        return `Unitless: CSS property "${variableName}" doesn't require units`;
      }
      if (name.includes('color') || name.includes('bg') || name.includes('background')) {
        return 'Color values don\'t require units';
      }
      if (name.includes('duration') || name.includes('delay') || name.includes('time')) {
        return 'Timing values use CSS-specific units (s, ms)';
      }
      if (name.includes('line') || name.includes('leading')) {
        return 'Line-height multipliers are unitless';
      }
    }
    
    if (chosenUnit === 'rem') {
      if (matchesPatterns(CSS_UNITS.TYPOGRAPHY_PATTERNS)) {
        return 'Typography: rem units scale with root font size for accessibility';
      }
      if (matchesPatterns(CSS_UNITS.SPACING_PATTERNS)) {
        return 'Spacing: rem units maintain consistent proportions with text';
      }
      if (name.startsWith('size-') || name.startsWith('space-')) {
        return 'Design tokens: rem provides scalable, consistent sizing';
      }
    }
    
    if (chosenUnit === '%') {
      if (matchesPatterns(CSS_UNITS.RELATIVE_PATTERNS)) {
        return 'Relative sizing: % units create responsive, container-relative dimensions';
      }
      if (name.includes('pill') || name.includes('circle') || name.includes('full')) {
        return 'Large radius: % creates perfect circles and pills';
      }
    }
    
    if (chosenUnit === 'vw' || chosenUnit === 'vh') {
      return `Viewport units: ${chosenUnit} scales with ${chosenUnit === 'vw' ? 'width' : 'height'} for full-screen designs`;
    }
    
    if (chosenUnit === 'px') {
      if (name.includes('border') || name.includes('outline')) {
        return 'Borders: px provides pixel-perfect precision for thin lines';
      }
      if (name.includes('shadow') || name.includes('blur')) {
        return 'Effects: px gives precise control over shadows and blur';
      }
      if (name.includes('icon') || name.includes('avatar') || name.includes('thumb')) {
        return 'Fixed assets: px ensures consistent sizing regardless of context';
      }
      return 'Default: px provides precise, absolute positioning';
    }
    
    return `Smart default: ${chosenUnit} chosen based on variable name analysis`;
  }

  // Save unit settings to shared Figma storage (accessible by all team members)
  static async saveUnitSettings(): Promise<void> {
    try {
      const figmaFileId = figma.root.id;
      const settingsKey = `unit-settings-${figmaFileId}`;
      
      // Save to shared document storage so all team members can access
      figma.root.setSharedPluginData(
        "Bridgy",
        settingsKey,
        JSON.stringify(this.unitSettings)
      );
      
      // Track metadata
      figma.root.setSharedPluginData(
        "Bridgy",
        `${settingsKey}-meta`,
        JSON.stringify({
          savedAt: new Date().toISOString(),
          savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user",
        })
      );
      
    } catch (error) {
      LoggingService.error('Error saving unit settings', error, LoggingService.CATEGORIES.UNITS);
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
        "Bridgy",
        settingsKey
      );
      
      if (sharedSettings) {
        try {
          this.unitSettings = JSON.parse(sharedSettings);
          return;
        } catch (parseError) {
          LoggingService.error('Error parsing shared unit settings', parseError, LoggingService.CATEGORIES.UNITS);
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
      LoggingService.error('Error loading unit settings', error, LoggingService.CATEGORIES.UNITS);
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
      figma.root.setSharedPluginData("Bridgy", settingsKey, "");
      figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, "");
      
      // Remove personal client storage (cleanup)
      await figma.clientStorage.deleteAsync(settingsKey);
      
    } catch (error) {
      LoggingService.error('Error resetting unit settings', error, LoggingService.CATEGORIES.UNITS);
      throw error;
    }
  }
}