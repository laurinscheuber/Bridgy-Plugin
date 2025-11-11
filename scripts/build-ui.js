const fs = require('fs');
const path = require('path');

/**
 * Optimized UI Build Script for Figma Plugin
 * 
 * This script:
 * 1. Reads separate CSS, JS, and HTML files
 * 2. Minifies CSS and JavaScript (in production mode)
 * 3. Injects them into the HTML template
 * 4. Outputs a single optimized ui.html file
 * 
 * Performance improvements:
 * - Minification reduces file size by 40-60%
 * - Faster parsing and execution in Figma
 * - Maintains single-file structure required by Figma
 */

const isDev = process.env.NODE_ENV === 'development';

// Simple CSS minifier (removes comments, whitespace, and unnecessary characters)
function minifyCSS(css) {
  if (isDev) return css;
  
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove newlines and tabs
    .replace(/\n/g, '')
    .replace(/\t/g, '')
    // Remove spaces around special characters
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    // Remove last semicolon in blocks
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

// Simple JS minifier (removes comments and unnecessary whitespace)
function minifyJS(js) {
  // DISABLED: Minification was breaking the JavaScript code
  // The aggressive regex replacements were corrupting message handlers
  // and other critical code, causing the plugin to fail
  // 
  // For now, we keep JS unminified even in production
  // Future: Use a proper minifier like Terser or esbuild if needed
  return js;
}

async function buildUI() {
  try {
    console.log('🔨 Building optimized UI...');
    const startTime = Date.now();

    // Read source files
    const template = fs.readFileSync(path.join(__dirname, '../src/ui/template.html'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, '../src/ui/styles.css'), 'utf8');
    const js = fs.readFileSync(path.join(__dirname, '../src/ui/main.js'), 'utf8');
    const bodyHtml = fs.readFileSync(path.join(__dirname, '../src/ui/body.html'), 'utf8');

    console.log('📦 Source file sizes:');
    console.log(`   CSS: ${(css.length / 1024).toFixed(2)} KB`);
    console.log(`   JS: ${(js.length / 1024).toFixed(2)} KB`);
    console.log(`   HTML: ${(bodyHtml.length / 1024).toFixed(2)} KB`);

    // Minify assets
    console.log(`⚡ ${isDev ? 'Development mode - skipping minification' : 'Minifying assets...'}`);
    const minifiedCSS = minifyCSS(css);
    const minifiedJS = minifyJS(js);

    if (!isDev) {
      console.log('📉 Minified sizes:');
      console.log(`   CSS: ${(minifiedCSS.length / 1024).toFixed(2)} KB (${((1 - minifiedCSS.length / css.length) * 100).toFixed(1)}% reduction)`);
      console.log(`   JS: ${(minifiedJS.length / 1024).toFixed(2)} KB (${((1 - minifiedJS.length / js.length) * 100).toFixed(1)}% reduction)`);
    }

    // Inject into template
    let output = template
      .replace('/* INJECT_CSS */', minifiedCSS)
      .replace('/* INJECT_JS */', minifiedJS)
      .replace('<!-- INJECT_HTML -->', bodyHtml);

    // Write to dist and root
    fs.writeFileSync(path.join(__dirname, '../ui.html'), output);
    
    // Ensure dist directory exists
    if (!fs.existsSync(path.join(__dirname, '../dist'))) {
      fs.mkdirSync(path.join(__dirname, '../dist'));
    }
    fs.writeFileSync(path.join(__dirname, '../dist/ui.html'), output);

    const buildTime = Date.now() - startTime;
    const finalSize = (output.length / 1024).toFixed(2);
    
    console.log('✅ UI build completed successfully!');
    console.log(`📊 Final size: ${finalSize} KB`);
    console.log(`⏱️  Build time: ${buildTime}ms`);
    
    if (!isDev) {
      const originalSize = ((css.length + js.length + bodyHtml.length) / 1024).toFixed(2);
      const savings = ((1 - output.length / (css.length + js.length + bodyHtml.length)) * 100).toFixed(1);
      console.log(`💾 Total savings: ${savings}% (${originalSize} KB → ${finalSize} KB)`);
    }

  } catch (error) {
    console.error('❌ Error building UI:', error);
    process.exit(1);
  }
}

buildUI();

