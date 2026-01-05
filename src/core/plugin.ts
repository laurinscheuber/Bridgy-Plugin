import { DocumentController } from "./controllers/DocumentController";
import { GitController } from "./controllers/GitController";
import { MessageRouter } from "./router/MessageRouter";
import { PluginMessage } from "../types";

// Show the UI (required for inspect panel plugins)
figma.showUI(__html__, { width: 650, height: 900, themeColors: true });

// Run the collection when the plugin starts
DocumentController.collectDocumentData();

// Load saved Git settings
GitController.loadSavedGitSettings();

// Keep the codegen functionality for generating code in the Code tab
figma.codegen.on("generate", (_event) => {
  try {
    return [
      {
        language: "PLAINTEXT",
        code: "Bridgy - Use the plugin interface to view variables and components",
        title: "Bridgy",
      },
    ];
  } catch (error) {
    console.error("Plugin error:", error);
    return [
      {
        language: "PLAINTEXT",
        code: "Error occurred during code generation",
        title: "Error",
      },
    ];
  }
});

// Handle messages from the UI
figma.ui.onmessage = async (msg: PluginMessage) => {
  try {
    await MessageRouter.handleMessage(msg);
  } catch (error: any) {
    console.error("Error handling message:", error);
    figma.ui.postMessage({
      type: "error",
      message: error.message || "Unknown error occurred",
    });
  }
};
