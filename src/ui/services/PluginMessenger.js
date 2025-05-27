/**
 * Handles communication with the plugin
 */
class PluginMessenger {
  constructor() {
    this.listeners = new Map();
    this.setupMessageListener();
  }

  /**
   * Sets up the main message listener
   */
  setupMessageListener() {
    window.addEventListener('message', (event) => {
      const message = event.data.pluginMessage;
      if (message && message.type) {
        this.handleMessage(message);
      }
    });
  }

  /**
   * Handles incoming messages from the plugin
   */
  handleMessage(message) {
    const listeners = this.listeners.get(message.type) || [];
    listeners.forEach(callback => {
      try {
        callback(message);
      } catch (error) {
        console.error(`Error in message listener for ${message.type}:`, error);
      }
    });
  }

  /**
   * Registers a listener for a specific message type
   */
  on(messageType, callback) {
    if (!this.listeners.has(messageType)) {
      this.listeners.set(messageType, []);
    }
    this.listeners.get(messageType).push(callback);
  }

  /**
   * Removes a listener for a specific message type
   */
  off(messageType, callback) {
    const listeners = this.listeners.get(messageType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Sends a message to the plugin
   */
  send(message) {
    parent.postMessage({ pluginMessage: message }, "*");
  }

  /**
   * Convenience methods for common actions
   */
  exportCSS(shouldDownload = true) {
    this.send({
      type: "export-css",
      shouldDownload: shouldDownload
    });
  }

  generateTest(componentId, componentName, generateAllVariants = false, commitToGitLab = false) {
    this.send({
      type: "generate-test",
      componentId: componentId,
      componentName: componentName,
      generateAllVariants: generateAllVariants,
      commitToGitLab: commitToGitLab
    });
  }

  saveGitLabSettings(settings) {
    this.send({
      type: "save-gitlab-settings",
      ...settings
    });
  }

  commitToGitLab(options) {
    this.send({
      type: "commit-to-gitlab",
      ...options
    });
  }

  commitTestToGitLab(options) {
    this.send({
      type: "commit-test-to-gitlab",
      ...options
    });
  }
}

// Create global instance
window.pluginMessenger = new PluginMessenger();