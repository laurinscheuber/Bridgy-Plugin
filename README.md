# Bridgy

A high-performance Figma plugin for synchronizing design tokens and components with your codebase.

## Features

- **Export Figma Variables** - Export design tokens as CSS/SCSS variables or Tailwind v4 format
- **Tailwind v4 Support** - Export variables with @theme directive and automatic namespace validation
- **Generate Component Tests** - Auto-generate Angular component tests from Figma designs
- **GitHub OAuth** - One-click authentication with GitHub (no manual token creation needed)
- **GitLab Integration** - Commit changes directly to GitLab with merge request support
- **Component Visualization** - Browse component hierarchy with search and filtering
- **Unit Configuration** - Smart unit detection and configuration for variables
- **Optimized Performance** - 21.5% smaller bundle size with minification and optimization

## Project Structure

```
src/
  ├── core/           # Core plugin functionality
  ├── services/       # Service layer (GitLab, CSS export, caching, etc.)
  ├── utils/          # Utility functions
  ├── types/          # TypeScript type definitions
  ├── config/         # Configuration and constants
  └── ui/             # UI source files (HTML, CSS, JS)
      ├── template.html
      ├── body.html
      ├── styles.css  (2,608 lines)
      └── main.js     (3,546 lines)
scripts/
  ├── build-ui.js     # Optimized UI build with minification
  └── update-manifest.js
tests/                # Test suite
dist/                 # Compiled output
```

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Development mode** (with auto-rebuild):

   ```bash
   npm run dev          # Watch TypeScript files
   npm run dev:ui       # Watch UI files
   ```

3. **Build for production:**

   ```bash
   npm run build
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Tailwind v4 Export

Bridgy supports exporting Figma variables in Tailwind v4 compatible format with the `@theme` directive.

### Requirements

For Tailwind v4 export, all variable groups must use valid Tailwind v4 namespaces:

**Supported Namespaces:**
- `color` - Color tokens
- `spacing` - Spacing/padding/margin values
- `radius` - Border radius values
- `font-size`, `font-weight`, `font-family` - Typography
- `line-height`, `letter-spacing` - Text properties
- `width`, `height`, `max-width`, `min-width` - Sizing
- `shadow`, `opacity` - Visual effects
- And 30+ more standard Tailwind namespaces

### Usage

1. **Organize Variables with Namespaces:**
   ```
   color/primary-500
   color/secondary-600
   spacing/sm
   spacing/md
   radius/sm
   ```

2. **Select Tailwind v4 Format:**
   - Open Settings (⚙️ icon)
   - Under "Export Format", select "Tailwind v4 (@theme)"
   - The plugin will validate your variable groups

3. **Validation Indicators:**
   - ✓ Green: All groups use valid namespaces
   - ⚠ Red: Invalid namespaces detected (lists which groups need fixing)

4. **Export:**
   - Click "Export Variables as Tailwind v4"
   - Output will use `@theme { }` directive
   - Variables formatted as `--namespace-name: value;`

### Example Output

```css
@theme {
  /* Collection: Design Tokens */

  /* color */
  --color-primary-500: rgb(99, 102, 241);
  --color-secondary-600: rgb(236, 72, 153);

  /* spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;

  /* radius */
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

### Common Namespace Suggestions

The plugin provides helpful suggestions for common variations:
- `colors` → `color`
- `space`, `padding`, `margin` → `spacing`
- `border-radius`, `rounded` → `radius`
- `fonts` → `font-family`

## Performance Optimizations

This plugin has been heavily optimized for performance:

- **UI Bundle**: 212 KB → 167 KB (21.5% reduction)
- **CSS**: 19.3% size reduction
- **JavaScript**: 30.3% size reduction
- **Build Time**: ~5-8ms for UI optimization
- **Modular Architecture**: Separate source files for maintainability

See [BUILD_OPTIMIZATIONS.md](BUILD_OPTIMIZATIONS.md) for detailed information.

## Available Scripts

### Production

- `npm run build` - Full production build with optimizations

### Development

- `npm run dev` - Watch TypeScript files
- `npm run dev:ui` - Watch UI files and auto-rebuild
- `npm run build:ui:dev` - Build UI without minification (faster)

### Testing

- `npm test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:coverage` - Run tests with coverage
- `npm run test:ui` - Run tests with Vitest UI

### Individual Steps

- `npm run build:ui` - Build and optimize UI only
- `npm run bundle` - Bundle and minify plugin code
- `npm run typecheck` - Type check without building

## Build Process

The optimized build process:

1. **Update Manifest** - Configure environment-specific settings
2. **Build UI** - Minify and bundle CSS/JS into optimized ui.html
3. **Compile TypeScript** - Convert .ts files to .js
4. **Bundle Code** - Create minified code.js with esbuild
5. **Copy Assets** - Move files to final locations

Output:

- `ui.html` - Optimized UI (167 KB)
- `code.js` - Minified plugin code (98 KB)
- `dist/manifest.json` - Plugin manifest

## Development Workflow

### For UI Changes

1. Edit files in `src/ui/` (styles.css, main.js, body.html)
2. Run `npm run build:ui:dev` for fast development build
3. Or use `npm run watch:ui` for auto-rebuild
4. Test in Figma
5. Run `npm run build` before committing

### For Plugin Logic Changes

1. Edit TypeScript files in `src/`
2. Run `npm run dev` for auto-rebuild
3. Test in Figma
4. Run tests: `npm test`
5. Run `npm run build` before committing

## Testing in Figma

1. Build the plugin: `npm run build`
2. In Figma: Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file from the project root
4. Make changes and rebuild
5. Reload in Figma: Plugins → Development → Reload

## Architecture

The plugin uses a clean architecture with:

- **Services**: Business logic (GitLab, CSS export, caching)
- **Utils**: Helper functions and utilities
- **Core**: Main plugin entry point and message handling
- **Config**: Configuration and constants
- **Types**: TypeScript type definitions

Key features:

- Lazy loading of component details
- Efficient caching strategies
- Modular service architecture
- Comprehensive error handling
- Type-safe TypeScript codebase

## Troubleshooting

### Build Issues

- Ensure Node.js is installed (v16+)
- Run `npm install` to install dependencies
- Delete `node_modules` and `dist` folders, then reinstall

### Plugin Issues

- Reload the plugin in Figma
- Check browser console for errors
- Use `npm run build:ui:dev` for non-minified debugging

### Performance Issues

- The plugin is optimized for large files
- Component details are loaded lazily
- Caching is used to minimize API calls

See [BUILD_OPTIMIZATIONS.md](BUILD_OPTIMIZATIONS.md) for more details.

### OAuth / GitHub Authentication

**Problem: "Popup Blocker Detected"**

Modern browsers block popups by default. To use GitHub OAuth:

1. **Chrome**: Click the popup blocked icon (🚫) in the address bar → "Always allow popups from figma.com"
2. **Firefox**: Click preferences icon → "Show Blocked Pop-ups" → "Allow pop-ups for figma.com"
3. **Safari**: Go to Safari → Preferences → Websites → "Pop-up Windows" → Set figma.com to "Allow"
4. **Edge**: Click popup blocked icon → "Always allow"

**Alternative**: Use a [Personal Access Token](https://github.com/settings/tokens) instead of OAuth.

For detailed OAuth setup and troubleshooting, see [docs/OAUTH_GUIDE.md](docs/OAUTH_GUIDE.md).

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests: `npm test`
5. Build: `npm run build`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## Requirements

- Node.js 16+ with NPM
- TypeScript 5.3+
- Figma Desktop App (for testing)

## Resources

- [Figma Plugin Documentation](https://www.figma.com/plugin-docs/)
- [Build Optimizations Guide](BUILD_OPTIMIZATIONS.md)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## License

MIT
