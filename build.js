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

// Copy compiled code from dist/index.js to code.js
if (fs.existsSync('dist/index.js')) {
  fs.copyFileSync('dist/index.js', 'code.js');
  console.log('✓ Copied compiled code to code.js');
} else {
  console.warn('⚠️  dist/index.js not found. Run TypeScript compiler first.');
}

console.log('\n✅ Build completed successfully!'); 