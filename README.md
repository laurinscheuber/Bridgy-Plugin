# Bridgy

**Token-Driven Quality Assurance for Figma Design Systems**

A Figma plugin for synchronizing design variables and components with code repositories using a preventative "Shift-Left" quality assurance approach.

## Features

- **Design System Quality (DSQ) Score:** Automatically analyzes your Figma file and calculates a health score based on metrics: Missing Variables (hard-coded values), Unused Variables, Unused Components, and Tailwind Incompatible Variables.
- **Deterministic Auto-Fix:** Replaces hard-coded values with design tokens using an "Exact Match" algorithm to ensure predictable visual outcomes.
- **Smart Token Import (Closed-Loop):** Paste CSS/SCSS/Tailwind code from your repository to update Figma variables. Includes a Diff-Preview (New, Update, Skip) to review changes before applying them.
- **Variable Export:** Export validated tokens to CSS, SCSS, or Tailwind v4 (`@theme` directive format). Supports Figma Modes for automatic theming (e.g., Light/Dark mode).
- **Source Control Integration:** Authenticates directly with GitHub and GitLab. Allows committing changes and opening Pull/Merge Requests directly from the plugin UI.
- **Enterprise-Grade Security:** Personal Access Tokens (PATs) are heavily encrypted locally on the client using the Web Crypto API (AES-256-GCM) before being stored securely via Figma's `clientStorage`.

## Repository Structure

```text
src/
  ├── core/           # Figma execution context entry point (`plugin.ts`)
  ├── services/       # Core logic (SCM integration, cryptography, export, token analysis)
  ├── types/          # TypeScript interface definitions
  ├── utils/          # Shared utility functions
  └── ui/             # Figma iframe context (frontend)
      ├── body.html       # Structural UI template
      ├── main.js         # Frontend application logic and message routing
      ├── styles.css      # UI styling (glassmorphism UI patterns, gauge CSS)
      └── template.html   # HTML scaffold for the build process
scripts/
  ├── build-ui.js     # Custom bundler script for the iframe UI context (inlines JS/CSS)
  └── update-manifest.js
dist/                 # Generated output directory
```

## Architecture

Bridgy utilizes the standard Figma plugin architecture, partitioned into two execution threads:

1. **Main Thread (`src/core`, `src/services`):**
   - Runs in the Figma sandbox environment.
   - Responsible for traversing the Figma node tree, reading variables, cryptography, and code generation.
   - Initializes sequentially (skeleton state -> settings fetch -> document discovery) to prevent UI blocking.
   
2. **UI Thread (`src/ui`):**
   - Runs in an isolated iframe.
   - Driven by `main.js`, handling DOM manipulation and asynchronous message passing with the main thread.
   - Built into a single `ui.html` file via the custom `build-ui.js` script to conform to Figma's single-file UI requirement.

## Development

### Prerequisites
- Node.js 16+
- TypeScript 5.3+
- Figma Desktop application for local testing

### Setup
```bash
npm install
```

### Build Scripts

- **`npm run dev`**: Watch mode for the TypeScript backend (`src/core`, `src/services`).
- **`npm run dev:ui`**: Watch mode for the frontend UI files (`src/ui`).
- **`npm run build`**: Production build. Compiles TypeScript, minifies UI assets, and bundles using `esbuild`. Output is generated in the `dist/` directory.

### Testing Workflow

1. Run the development watchers (`npm run dev` and `npm run dev:ui`).
2. Open Figma -> Plugins -> Development -> Import plugin from manifest.
3. Select `manifest.json` in the repository root.
4. Use the Figma plugin menu to reload after making changes.

### Unit Tests
```bash
npm test              # Run Vitest test suite
npm run test:coverage # Generate coverage report
npm run test:ui       # Launch Vitest UI
```

## License

MIT
