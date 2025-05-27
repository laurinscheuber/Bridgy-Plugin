const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Copy UI files
fs.copyFileSync('ui.html', 'dist/ui.html');

// Copy manifest
fs.copyFileSync('manifest.json', 'dist/manifest.json');

// Copy compiled code from src/index.js to code.js
fs.copyFileSync('dist/index.js', 'code.js');

console.log('Build completed successfully!'); 