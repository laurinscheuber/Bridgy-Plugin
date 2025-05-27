/**
 * Handles file downloads and exports
 */
class DownloadService {
  /**
   * Downloads CSS content as a file
   */
  static downloadCSS(cssString) {
    if (!cssString) {
      console.error("No CSS data to download");
      alert("Error: No CSS data available to download.");
      return;
    }

    try {
      // Create a blob with the CSS content
      const blob = new Blob([cssString], { type: "text/css" });
      const url = URL.createObjectURL(blob);

      // Create an anchor element for download
      const a = document.createElement("a");
      a.href = url;
      a.download = "figma-variables.css";

      // Append to body, click, and cleanup
      document.body.appendChild(a);
      a.click();

      // Give browser time to start the download before cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      console.log("CSS download initiated", { size: cssString.length });
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download CSS file. Please try again.");
    }
  }

  /**
   * Downloads a test file
   */
  static downloadTest(componentName, testContent) {
    // Create a kebab case version of the component name for the file name
    const kebabName = componentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const blob = new Blob([testContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${kebabName}.component.spec.ts`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Downloads a ZIP file with multiple components
   */
  static downloadComponentsZip(files, language) {
    if (!files || files.length === 0) {
      alert("No components available to export");
      return;
    }

    // Create a new JSZip instance (JSZip needs to be loaded in HTML)
    const zip = new JSZip();

    // Add files to the ZIP based on the selected language
    files.forEach((component) => {
      const folderName = component.kebabName;
      const folder = zip.folder(folderName);

      if (language === "angular") {
        // Add all Angular component files
        folder.file(`${folderName}.component.html`, component.angularHtml);
        folder.file(`${folderName}.component.ts`, component.angularTs);
        folder.file(
          `${folderName}.component.scss`,
          `// Styles for ${component.name}\n.${folderName} {\n  // Add your styles here\n}`
        );
      } else if (language === "typescript") {
        // Add only TypeScript file
        folder.file(`${folderName}.component.ts`, component.angularTs);
      } else if (language === "javascript") {
        // Convert TypeScript to JavaScript (basic conversion)
        const jsCode = component.angularTs
          .replace(/: [A-Za-z<>[\]]+/g, "") // Remove type annotations
          .replace(/interface [^}]+}/g, ""); // Remove interfaces

        folder.file(`${folderName}.component.js`, jsCode);
      }
    });

    // Generate and download the ZIP
    zip.generateAsync({ type: "blob" }).then((content) => {
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `figma-components-${language}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  /**
   * Creates a downloadable file from content
   */
  static createDownload(content, filename, mimeType = 'text/plain') {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('Download creation failed:', error);
      return false;
    }
  }
}

// Make it globally available
window.DownloadService = DownloadService;