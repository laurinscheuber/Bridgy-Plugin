# Component-Based Architecture with Build Process

## Setup for Component Isolation in Figma Plugins

### Required Build Tools

- **Webpack**, **Rollup**, or **Parcel** for bundling
- **HTML Webpack Plugin** for template processing
- **CSS Modules** or **PostCSS** for scoped styles

### Example Project Structure

```
src/
├── components/
│   ├── Button/
│   │   ├── Button.js
│   │   ├── Button.css
│   │   └── Button.html
│   ├── Modal/
│   │   ├── Modal.js
│   │   ├── Modal.css
│   │   └── Modal.html
│   └── shared/
│       └── styles/
│           └── variables.css
├── ui/
│   ├── main.js     # Entry point
│   └── index.html  # Template
└── core/
    └── plugin.ts

dist/                # Build output
├── ui.html         # Bundled UI (single file)
├── code.js         # Plugin code
└── manifest.json
```

### Example Webpack Config

```javascript
// webpack.config.js
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/ui/main.js',
  output: {
    filename: 'ui.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/ui/index.html',
      filename: 'ui.html',
      inject: 'body',
      minify: true,
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css',
    }),
  ],
};
```

### Component Example with This Setup

```javascript
// src/components/Button/Button.js
import template from './Button.html';
import './Button.css';

export class Button {
  constructor(props) {
    this.props = props;
  }

  render() {
    const div = document.createElement('div');
    div.innerHTML = template;

    const button = div.querySelector('.btn');
    button.textContent = this.props.text;
    button.className = `btn btn-${this.props.variant}`;
    button.onclick = this.props.onClick;

    return button;
  }
}
```

## Pros and Cons

### ✅ Pros:

- True component isolation
- Better code organization
- Reusable components
- Modern development experience

### ❌ Cons:

- Complex build setup
- Slower development (rebuild required)
- Harder to debug
- More dependencies
- Overkill for most plugins

## Recommendation

For Figma plugins, **stick with Option 1** (component functions in single files) because:

1. **Simpler setup** - No build process needed
2. **Faster development** - Hot reload works
3. **Easier debugging** - Direct access to code
4. **Figma's intended pattern** - Follows their examples
5. **Sufficient for most plugins** - Even complex ones

Only use a build process if you:

- Have a very large plugin (100+ components)
- Need to share components across multiple plugins
- Have a team of developers
- Already have a build pipeline
