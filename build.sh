#!/bin/bash

# Function to display usage
function show_help {
  echo "Usage: ./build.sh [command]"
  echo "Commands:"
  echo "  build     - Build the project"
  echo "  watch     - Watch for changes and rebuild"
  echo "  help      - Show this help message"
}

# Create dist directory if it doesn't exist
function ensure_dist {
  if [ ! -d "dist" ]; then
    mkdir -p dist
  fi
}

# Build function
function build {
  echo "Building project..."
  
  # Compile TypeScript
  ./node_modules/.bin/tsc -p tsconfig.json
  
  # Run build.js
  node build.js
  
  # Bundle
  ./node_modules/.bin/esbuild dist/index.js --bundle --platform=browser --outfile=code.js
  
  echo "Build completed!"
}

# Watch function
function watch {
  echo "Watching for changes..."
  ./node_modules/.bin/tsc -p tsconfig.json --watch
}

# Main script
case "$1" in
  build)
    ensure_dist
    build
    ;;
  watch)
    ensure_dist
    watch
    ;;
  *)
    show_help
    ;;
esac