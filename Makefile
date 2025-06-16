.PHONY: build watch help clean

# Paths to binaries - adjust these if you install tools globally
TSC=./node_modules/.bin/tsc
ESBUILD=./node_modules/.bin/esbuild

help:
	@echo "Available commands:"
	@echo "  make build  - Build the project"
	@echo "  make watch  - Watch for changes and rebuild"
	@echo "  make clean  - Clean build artifacts"

build:
	@echo "Building project..."
	@mkdir -p dist
	$(TSC) -p tsconfig.json
	node build.js
	$(ESBUILD) dist/index.js --bundle --platform=browser --outfile=code.js
	@echo "Build completed!"

watch:
	@echo "Watching for changes..."
	@mkdir -p dist
	$(TSC) -p tsconfig.json --watch

clean:
	@echo "Cleaning build artifacts..."
	@rm -rf dist
	@rm -f code.js