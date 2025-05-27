const fs = require('fs');
const path = require('path');

/**
 * Build script that combines all TypeScript modules into a single file
 * and creates the refactored UI HTML file
 */

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return '';
  }
}

function writeFile(filePath, content) {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
    console.log(`✅ Built: ${filePath}`);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error.message);
  }
}

function buildPluginCode() {
  console.log('🔨 Building plugin code...');
  
  // Read all the modular TypeScript files and combine them
  const sharedTypes = readFile('src/shared/types.ts');
  const sharedConstants = readFile('src/shared/constants.ts');
  const sharedUtils = readFile('src/shared/utils.ts');
  
  const variableCollector = readFile('src/plugin/collectors/VariableCollector.ts');
  const componentCollector = readFile('src/plugin/collectors/ComponentCollector.ts');
  const cssGenerator = readFile('src/plugin/generators/CSSGenerator.ts');
  const testGenerator = readFile('src/plugin/generators/TestGenerator.ts');
  const gitlabAPI = readFile('src/plugin/gitlab/GitLabAPI.ts');
  const settingsManager = readFile('src/plugin/storage/SettingsManager.ts');
  const pluginIndex = readFile('src/plugin/index.ts');

  // Remove import/export statements since we're combining into one file
  function removeImportsExports(content) {
    return content
      .replace(/^import.*$/gm, '')
      .replace(/^export\s+/gm, '')
      .replace(/\n\n+/g, '\n\n')
      .trim();
  }

  // Combine all modules
  let combinedCode = `// aWall Synch plugin - Refactored modular code
// This file holds the main code for the plugin. It has access to
// the *figma document* via the figma global object.
// You can access browser APIs in the <script> tag inside "ui.html"

/// <reference types="@figma/plugin-typings" />

`;

  // Add shared modules first
  combinedCode += '// ================== SHARED TYPES ==================\n';
  combinedCode += removeImportsExports(sharedTypes) + '\n\n';
  
  combinedCode += '// ================== SHARED CONSTANTS ==================\n';
  combinedCode += removeImportsExports(sharedConstants) + '\n\n';
  
  combinedCode += '// ================== SHARED UTILS ==================\n';
  combinedCode += removeImportsExports(sharedUtils) + '\n\n';

  // Add plugin modules
  combinedCode += '// ================== VARIABLE COLLECTOR ==================\n';
  combinedCode += removeImportsExports(variableCollector) + '\n\n';
  
  combinedCode += '// ================== COMPONENT COLLECTOR ==================\n';
  combinedCode += removeImportsExports(componentCollector) + '\n\n';
  
  combinedCode += '// ================== CSS GENERATOR ==================\n';
  combinedCode += removeImportsExports(cssGenerator) + '\n\n';
  
  combinedCode += '// ================== TEST GENERATOR ==================\n';
  combinedCode += removeImportsExports(testGenerator) + '\n\n';
  
  combinedCode += '// ================== GITLAB API ==================\n';
  combinedCode += removeImportsExports(gitlabAPI) + '\n\n';
  
  combinedCode += '// ================== SETTINGS MANAGER ==================\n';
  combinedCode += removeImportsExports(settingsManager) + '\n\n';
  
  combinedCode += '// ================== MAIN PLUGIN CODE ==================\n';
  combinedCode += removeImportsExports(pluginIndex);

  writeFile('code-refactored.ts', combinedCode);
}

function buildUICode() {
  console.log('🔨 Building UI code...');
  
  // Read CSS files
  const baseCss = readFile('src/ui/styles/base.css');
  const componentsCss = readFile('src/ui/styles/components.css');
  const tabsCss = readFile('src/ui/styles/tabs.css');
  
  // Read JavaScript files
  const pluginMessenger = readFile('src/ui/services/PluginMessenger.js');
  const filterService = readFile('src/ui/services/FilterService.js');
  const downloadService = readFile('src/ui/services/DownloadService.js');
  const formatters = readFile('src/ui/utils/formatters.js');
  const domHelpers = readFile('src/ui/utils/dom-helpers.js');

  // Read the existing UI HTML to extract the body content
  const originalUI = readFile('ui.html');
  
  // Extract the body content between <body> and </body>
  const bodyMatch = originalUI.match(/<body[^>]*>(.*?)<\/body>/s);
  const bodyContent = bodyMatch ? bodyMatch[1] : '';

  // Create the new modular HTML
  const newHTML = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>aWall Synch UI - Refactored</title>
    <!-- Add JSZip library -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
    
    <style>
      /* ================== BASE STYLES ================== */
      ${baseCss}
      
      /* ================== COMPONENT STYLES ================== */
      ${componentsCss}
      
      /* ================== TAB STYLES ================== */
      ${tabsCss}
      
      /* Modal styles (keeping from original for now) */
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
      }
      
      .modal-content {
        position: relative;
        background-color: #fff;
        margin: 10% auto;
        padding: 20px;
        width: 80%;
        max-width: 500px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      .modal-header {
        margin-bottom: 20px;
      }
      
      .modal-header h3 {
        margin: 0;
        color: #333;
      }
      
      .modal-body {
        margin-bottom: 20px;
      }
      
      .form-group {
        margin-bottom: 15px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 5px;
        color: #555;
        font-weight: 500;
      }
      
      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .security-note {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        padding: 10px;
        margin: 10px 0;
        font-size: 12px;
        display: none;
      }

      .security-note p {
        margin-top: 0;
        font-weight: 500;
        color: #856404;
      }

      .security-note ul {
        margin-bottom: 0;
        padding-left: 20px;
      }

      .security-note-compact {
        background-color: #fff3cd;
        border: 1px solid #ffeeba;
        border-radius: 4px;
        padding: 8px 10px;
        margin: 10px 0;
        font-size: 12px;
        font-style: italic;
        color: #856404;
        display: none;
      }

      .saved-info {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px dashed #ffeeba;
        font-style: italic;
        color: #856404;
      }
      
      .close-modal {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
      }
      
      .close-modal:hover {
        color: #333;
      }
      
      .commit-button {
        background-color: #4caf50;
      }
      
      .commit-button:hover {
        background-color: #3d8b40;
      }
      
      .commit-button.loading {
        background-color: #9e9e9e;
        cursor: wait;
      }

      .credentials-display {
        display: flex;
        align-items: center;
        background-color: #f5f7f9;
        padding: 12px 15px;
        border-radius: 6px;
        margin-bottom: 15px;
        border: 1px solid #eaeaea;
        justify-content: space-between;
      }

      .credentials-display > div {
        font-size: 14px;
        margin-right: 10px;
      }

      #project-id-display {
        font-weight: 500;
        color: #333;
      }

      #token-display {
        font-family: monospace;
        color: #555;
      }

      .settings-icon {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.2s;
      }

      .settings-icon:hover {
        background-color: #e1f0ff;
        color: #0d99ff;
      }

      .success-message {
        background-color: #e8f5e9;
        color: #2e7d32;
        padding: 8px 12px;
        border-radius: 4px;
        margin-top: 8px;
        font-size: 14px;
        display: none;
      }

      .merge-request-link {
        margin-top: 10px;
        display: block;
        text-decoration: none;
        color: #0d99ff;
        font-weight: 500;
      }

      .merge-request-link:hover {
        text-decoration: underline;
      }

      .error-message {
        background-color: #ffeeee;
        color: #c62828;
        padding: 12px;
        border-radius: 4px;
        margin-top: 8px;
        font-size: 14px;
        border: 1px solid #ffcdd2;
      }

      .error-message p {
        margin: 0 0 8px 0;
      }

      .error-message p:last-child {
        margin-bottom: 0;
      }

      .error-help {
        color: #666;
        font-size: 13px;
        font-style: italic;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        margin: 16px 0 8px 0;
        overflow: hidden;
      }

      .progress-bar {
        height: 100%;
        width: 0%;
        background-color: #0d99ff;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-status {
        font-size: 13px;
        color: #666;
        margin-bottom: 16px;
        font-style: italic;
      }

      #commit-progress-container {
        background-color: #f5f7f9;
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 16px;
        border: 1px solid #eaeaea;
      }

      .config-description {
        margin-bottom: 20px;
        color: #666;
        font-style: italic;
      }

      .config-section {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 20px;
        border: 1px solid #eaeaea;
      }

      .config-section-title {
        font-weight: 600;
        color: #333;
        margin-top: 24px;
        margin-bottom: 12px;
        padding-bottom: 6px;
        border-bottom: 1px solid #eaeaea;
      }

      .field-help {
        color: #666;
        font-size: 12px;
        margin-top: 4px;
        margin-bottom: 0;
        font-style: italic;
      }

      .simple-commit-form {
        padding: 16px 0;
      }

      .commit-help {
        color: #666;
        font-size: 13px;
        margin-top: 5px;
        font-style: italic;
      }

      .branch-info {
        margin-top: 16px;
        padding: 12px;
        background-color: #f5f5f5;
        border-radius: 6px;
        border: 1px solid #eee;
      }

      .branch-info p {
        margin: 0;
        line-height: 1.4;
      }

      .branch-name {
        font-family: monospace;
        font-weight: 600;
        color: #0d99ff;
      }
    </style>
  </head>
  <body>
    ${bodyContent}

    <!-- ================== JAVASCRIPT MODULES ================== -->
    <script>
      // Plugin Messenger Service
      ${pluginMessenger}
      
      // Filter Service
      ${filterService}
      
      // Download Service
      ${downloadService}
      
      // Formatters
      ${formatters}
      
      // DOM Helpers
      ${domHelpers}
      
      // Main application logic (extracted from original)
      let variablesData = [];
      let componentsData = [];
      let currentCSSData = null;
      window.gitlabSettings = null;

      // Initialize services
      function initializeApp() {
        // Set up plugin messenger listeners
        window.pluginMessenger.on('document-data', (message) => {
          variablesData = message.variablesData;
          componentsData = message.componentsData;

          renderVariables(variablesData);
          renderComponents(componentsData);

          // Enable buttons if there are variables
          const exportButton = document.getElementById("export-css-button");
          const commitButton = document.getElementById("commit-repo-button");
          
          if (variablesData && variablesData.some(collection => collection.variables.length > 0)) {
            exportButton.disabled = false;
            commitButton.disabled = false;
          } else {
            exportButton.disabled = true;
            commitButton.disabled = true;
          }
        });

        window.pluginMessenger.on('gitlab-settings-loaded', (message) => {
          window.gitlabSettings = message.settings;
          console.log("GitLab settings loaded");
        });

        window.pluginMessenger.on('css-export', (message) => {
          currentCSSData = message.cssData;
          
          const exportButton = document.getElementById("export-css-button");
          exportButton.disabled = false;
          exportButton.textContent = "Export Variables as CSS";

          if (message.shouldDownload) {
            window.DownloadService.downloadCSS(message.cssData);
          }
        });

        window.pluginMessenger.on('test-generated', (message) => {
          window.DownloadService.downloadTest(message.componentName, message.testContent);
          
          // Show success message logic here
          const buttons = document.querySelectorAll('button.loading');
          buttons.forEach(button => {
            if (button.textContent === 'Generating...') {
              button.classList.remove('loading');
              button.textContent = button.dataset.originalText || 'Generate Test';
              button.disabled = false;

              const successMessage = button.parentElement.nextElementSibling;
              if (successMessage && successMessage.classList.contains('test-success-message')) {
                if (message.commitToGitLab) {
                  successMessage.textContent = "Test generated and committed to GitLab!";
                } else {
                  successMessage.textContent = "Test generated successfully!";
                }
                successMessage.style.display = 'block';

                setTimeout(() => {
                  successMessage.style.display = 'none';
                  successMessage.textContent = "Test generated successfully!";
                }, 3000);
              }
            }
          });
        });

        // Set up other event listeners...
        setupEventListeners();
      }

      function setupEventListeners() {
        // Tab switching
        document.querySelectorAll(".tab").forEach((tab) => {
          tab.addEventListener("click", () => {
            document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

            tab.classList.add("active");
            document.getElementById(tab.dataset.tab + "-content").classList.add("active");
          });
        });

        // Export CSS button
        document.getElementById("export-css-button").addEventListener("click", () => {
          const button = document.getElementById("export-css-button");
          button.disabled = true;
          const originalText = button.textContent;
          button.textContent = "Exporting...";

          window.pluginMessenger.exportCSS(true);

          setTimeout(() => {
            if (button.textContent === "Exporting...") {
              button.disabled = false;
              button.textContent = originalText;
            }
          }, 5000);
        });

        // Other event listeners...
      }

      // Render functions (simplified versions)
      function renderVariables(data) {
        const container = document.getElementById("variables-container");
        // Add your variable rendering logic here
        console.log("Rendering variables:", data);
      }

      function renderComponents(data) {
        const container = document.getElementById("components-container");
        // Add your component rendering logic here  
        console.log("Rendering components:", data);
      }

      // Initialize the app
      document.addEventListener('DOMContentLoaded', initializeApp);
    </script>
  </body>
</html>`;

  writeFile('ui-refactored.html', newHTML);
}

// Run the build
console.log('🚀 Starting refactored build process...');
buildPluginCode();
buildUICode();
console.log('✅ Refactored build complete!');
console.log('');
console.log('📁 Generated files:');
console.log('  - code-refactored.ts  (Modular plugin code)');
console.log('  - ui-refactored.html  (Modular UI code)');
console.log('');
console.log('🔄 To use the refactored version:');
console.log('  1. Update manifest.json to point to code-refactored.ts');
console.log('  2. Update main entry to use ui-refactored.html');
console.log('  3. Run "npm run build" to compile TypeScript');