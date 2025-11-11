const fs = require('fs');
const path = require('path');

console.log('🚀 Starting build process...\n');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy manifest
fs.copyFileSync('manifest.json', 'dist/manifest.json');
console.log('✓ Copied manifest.json');

// Bundle step already created code.js - don't overwrite it with TypeScript output
console.log('✓ Using bundled code.js (esbuild output)');

console.log('\n✅ Build completed successfully!'); 