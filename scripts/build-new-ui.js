/**
 * Build Script for New UI Structure
 * Combines all CSS and JS modules into single files for Figma plugin
 */

const fs = require('fs');
const path = require('path');

const UI_DIR = path.join(__dirname, '../src/ui');
const BUILD_DIR = path.join(__dirname, '../dist');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

console.log('🔨 Building Bridgy UI...');

/**
 * Combine CSS files in order
 */
function buildCSS() {
  console.log('📄 Building CSS...');

  const cssFiles = [
    'css/01-variables.css',
    'css/02-base.css',
    'css/03-components.css',
    'css/04-layout.css',
  ];

  let combinedCSS = '/* ===== BRIDGY UI STYLES ===== */\n';
  combinedCSS += '/* Built from modular CSS files */\n\n';

  cssFiles.forEach((file) => {
    const filePath = path.join(UI_DIR, file);

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      combinedCSS += `/* ===== ${file.toUpperCase()} ===== */\n`;
      combinedCSS += content + '\n\n';
      console.log(`  ✓ Added ${file}`);
    } else {
      console.warn(`  ⚠ Missing ${file}`);
    }
  });

  // Write combined CSS
  const outputPath = path.join(BUILD_DIR, 'styles.css');
  fs.writeFileSync(outputPath, combinedCSS);

  console.log(`  📦 CSS built: ${outputPath}`);
  console.log(`  📊 Size: ${(combinedCSS.length / 1024).toFixed(2)}KB`);
}

/**
 * Combine JavaScript files in order
 */
function buildJS() {
  console.log('📄 Building JavaScript...');

  const jsFiles = [
    'js/bridgy-utils.js',
    'js/bridgy-state.js',
    'js/bridgy-components.js',
    'js/bridgy-api.js',
    'js/bridgy-app.js',
  ];

  let combinedJS = '/* ===== BRIDGY UI JAVASCRIPT ===== */\n';
  combinedJS += '/* Built from modular JavaScript files */\n\n';
  combinedJS += '"use strict";\n\n';

  jsFiles.forEach((file) => {
    const filePath = path.join(UI_DIR, file);

    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');

      // Remove "use strict" from individual files to avoid duplicates
      content = content.replace(/["']use strict["'];\s*/g, '');

      combinedJS += `/* ===== ${file.toUpperCase()} ===== */\n`;
      combinedJS += content + '\n\n';
      console.log(`  ✓ Added ${file}`);
    } else {
      console.warn(`  ⚠ Missing ${file}`);
    }
  });

  // Write combined JS
  const outputPath = path.join(BUILD_DIR, 'main.js');
  fs.writeFileSync(outputPath, combinedJS);

  console.log(`  📦 JS built: ${outputPath}`);
  console.log(`  📊 Size: ${(combinedJS.length / 1024).toFixed(2)}KB`);
}

/**
 * Build HTML file
 */
function buildHTML() {
  console.log('📄 Building HTML...');

  const htmlPath = path.join(UI_DIR, 'index.html');

  if (!fs.existsSync(htmlPath)) {
    console.error('  ❌ HTML source file not found');
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');

  // Replace CSS imports with single file
  html = html.replace(/<link rel="stylesheet" href="css\/\d+-.*\.css">\s*/g, '');

  // Add single CSS link
  html = html.replace('</head>', '  <link rel="stylesheet" href="styles.css">\n</head>');

  // Replace JS imports with single file
  html = html.replace(/<script src="js\/.*\.js"><\/script>\s*/g, '');

  // Add single JS script before closing body
  html = html.replace('</body>', '  <script src="main.js"></script>\n</body>');

  // Write final HTML
  const outputPath = path.join(BUILD_DIR, 'ui.html');
  fs.writeFileSync(outputPath, html);

  console.log(`  📦 HTML built: ${outputPath}`);
  console.log(`  📊 Size: ${(html.length / 1024).toFixed(2)}KB`);
}

/**
 * Copy original files for reference
 */
function copyOriginals() {
  console.log('📄 Copying original files...');

  // Copy original main.js as backup
  const originalMain = path.join(__dirname, '../src/ui/main.js');
  const backupMain = path.join(BUILD_DIR, 'main-original.js');

  if (fs.existsSync(originalMain)) {
    fs.copyFileSync(originalMain, backupMain);
    console.log('  ✓ Copied original main.js as backup');
  }

  // Copy original body.html as backup
  const originalBody = path.join(__dirname, '../src/ui/body.html');
  const backupBody = path.join(BUILD_DIR, 'body-original.html');

  if (fs.existsSync(originalBody)) {
    fs.copyFileSync(originalBody, backupBody);
    console.log('  ✓ Copied original body.html as backup');
  }
}

/**
 * Generate build report
 */
function generateReport() {
  console.log('📊 Generating build report...');

  const report = {
    buildTime: new Date().toISOString(),
    files: {
      css: 'styles.css',
      js: 'main.js',
      html: 'ui.html',
    },
    modules: {
      css: [
        '01-variables.css - Design tokens & CSS variables',
        '02-base.css - Base styles, typography, utilities',
        '03-components.css - Component styles',
        '04-layout.css - Layout & responsive styles',
      ],
      js: [
        'bridgy-utils.js - Utility functions',
        'bridgy-state.js - State management',
        'bridgy-components.js - UI component library',
        'bridgy-api.js - API communication',
        'bridgy-app.js - Main application logic',
      ],
    },
    features: [
      '✅ Modular architecture',
      '✅ Component-based UI',
      '✅ Centralized state management',
      '✅ Event-driven updates',
      '✅ Responsive design',
      '✅ Accessibility features',
      '✅ Type-safe APIs',
      '✅ Error handling',
    ],
  };

  const reportPath = path.join(BUILD_DIR, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`  📄 Build report: ${reportPath}`);
}

/**
 * Validate build output
 */
function validateBuild() {
  console.log('✅ Validating build...');

  const requiredFiles = ['ui.html', 'styles.css', 'main.js'];
  let allValid = true;

  requiredFiles.forEach((file) => {
    const filePath = path.join(BUILD_DIR, file);

    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`  ✓ ${file} (${sizeKB}KB)`);
    } else {
      console.error(`  ❌ Missing ${file}`);
      allValid = false;
    }
  });

  if (allValid) {
    console.log('  🎉 All files built successfully!');
  } else {
    console.error('  ❌ Build validation failed');
    process.exit(1);
  }
}

/**
 * Main build function
 */
function build() {
  try {
    console.log('🚀 Starting Bridgy UI build...\n');

    buildCSS();
    buildJS();
    buildHTML();
    copyOriginals();
    generateReport();
    validateBuild();

    console.log('\n🎉 Build completed successfully!');
    console.log(`📁 Output directory: ${BUILD_DIR}`);
    console.log('\n📝 To use the new UI:');
    console.log('1. Copy ui.html to replace your current UI file');
    console.log('2. Update manifest.json to point to the new ui.html');
    console.log('3. Test the plugin in Figma');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (require.main === module) {
  build();
}

module.exports = {
  build,
  buildCSS,
  buildJS,
  buildHTML,
};
