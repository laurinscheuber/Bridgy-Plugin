const fs = require('fs');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy UI files
fs.copyFileSync('ui.html', 'dist/ui.html');

// Copy manifest
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Copy bundled code to dist
fs.copyFileSync('code.js', 'dist/code.js');

console.log('Build completed successfully!');
