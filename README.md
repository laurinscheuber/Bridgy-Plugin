# aWall Synch

A Figma plugin for synchronizing design tokens and components with your codebase.

## Features

- Export Figma variables as CSS
- Generate component tests
- GitLab integration for version control
- Component hierarchy visualization
- Search functionality for variables and components

## Project Structure

```
src/
  ├── core/           # Core plugin functionality
  ├── services/       # Service layer (GitLab, CSS export, etc.)
  ├── utils/          # Utility functions
  ├── types/          # JSDoc type definitions
  └── ui/             # UI-related code
```

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
  npm run build
  ```

For more information on creating Figma plugins, see the
[official plugin quickstart guide](https://www.figma.com/plugin-docs/plugin-quickstart-guide/).

## Building

The build process:
1. Bundles the JavaScript source
2. Copies UI files to the `dist` directory
3. Copies the manifest file
4. Copies the bundled code

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

MIT

