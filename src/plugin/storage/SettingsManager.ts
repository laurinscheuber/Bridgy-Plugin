import { GitLabSettings } from '../../shared/types';
import { PLUGIN_NAME } from '../../shared/constants';

/**
 * Manages plugin settings storage
 */
export class SettingsManager {
  /**
   * Saves GitLab settings to Figma storage
   */
  static async saveGitLabSettings(settings: GitLabSettings, shareWithTeam: boolean = false): Promise<void> {
    const settingsWithMetadata = {
      ...settings,
      savedAt: new Date().toISOString(),
      savedBy: figma.currentUser?.name || "Unknown user",
    };

    // If user didn't opt to save the token, don't store it
    if (!settings.saveToken) {
      delete settingsWithMetadata.gitlabToken;
    }

    // Determine where to save based on sharing preference
    if (shareWithTeam) {
      // Save to document storage (available to all team members)
      figma.root.setSharedPluginData(
        PLUGIN_NAME,
        "gitlab-settings",
        JSON.stringify(settingsWithMetadata)
      );
      console.log("GitLab settings saved to document storage");

      // Also save to client storage as a backup
      await figma.clientStorage.setAsync("gitlab-settings", settingsWithMetadata);
    } else {
      // Save only to client storage (personal)
      await figma.clientStorage.setAsync("gitlab-settings", settingsWithMetadata);
      console.log("GitLab settings saved to client storage only");
    }
  }

  /**
   * Loads GitLab settings from Figma storage
   */
  static async loadGitLabSettings(): Promise<GitLabSettings | null> {
    try {
      // Try to load settings from the document (available to all team members)
      const documentSettings = await figma.root.getSharedPluginData(
        PLUGIN_NAME,
        "gitlab-settings"
      );
      
      if (documentSettings) {
        try {
          const settings = JSON.parse(documentSettings);
          console.log("GitLab settings loaded from document storage");
          return settings;
        } catch (parseError) {
          console.error("Error parsing document settings:", parseError);
        }
      }

      // Fallback to client storage if document storage doesn't have settings
      const clientSettings = await figma.clientStorage.getAsync("gitlab-settings");
      if (clientSettings) {
        console.log("GitLab settings loaded from client storage");
        return clientSettings;
      }

      return null;
    } catch (error) {
      console.error("Error loading GitLab settings:", error);
      return null;
    }
  }

  /**
   * Clears GitLab settings from storage
   */
  static async clearGitLabSettings(): Promise<void> {
    try {
      // Clear from document storage
      figma.root.setSharedPluginData(PLUGIN_NAME, "gitlab-settings", "");
      
      // Clear from client storage
      await figma.clientStorage.setAsync("gitlab-settings", null);
      
      console.log("GitLab settings cleared");
    } catch (error) {
      console.error("Error clearing GitLab settings:", error);
    }
  }
}