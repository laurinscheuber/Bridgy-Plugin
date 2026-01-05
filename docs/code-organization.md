# Bridgy Plugin Code Organization

## Overview

The Bridgy plugin has been reorganized from a monolithic structure to a modular, component-based architecture that follows Figma plugin best practices while maintaining excellent code organization.

## New File Structure

```
src/ui/
├── index.html              # Main HTML entry point
├── css/                    # Organized CSS modules
│   ├── 01-variables.css    # Design tokens & CSS variables
│   ├── 02-base.css         # Base styles, typography, utilities
│   ├── 03-components.css   # Component styles
│   └── 04-layout.css       # Layout & responsive styles
└── js/                     # JavaScript modules
    ├── bridgy-utils.js     # Utility functions
    ├── bridgy-state.js     # State management
    ├── bridgy-components.js # UI component library
    ├── bridgy-api.js       # API communication
    └── bridgy-app.js       # Main application logic
```

## Module Architecture

### 1. **State Management** (`bridgy-state.js`)

- Centralized state management with event system
- Persistent storage (localStorage)
- Reactive updates across the application
- Clean separation of data and UI

```javascript
// Example usage
BridgyState.set.value('ui.activeTab', 'variables');
BridgyState.actions.toggleSelection('variable', 'id123');
BridgyState.events.on('stateChange', handleUpdate);
```

### 2. **Component Library** (`bridgy-components.js`)

- Reusable UI components with consistent API
- Type-safe component props
- Built-in accessibility features
- Easy to extend and maintain

```javascript
// Example usage
const button = BridgyComponents.Button.render({
  text: 'Save',
  variant: 'primary',
  onClick: 'handleSave()',
});

BridgyComponents.Modal.open('settings-modal');
BridgyComponents.Notification.show({
  type: 'success',
  message: 'Saved successfully',
});
```

### 3. **API Communication** (`bridgy-api.js`)

- All plugin core communication centralized
- Type-safe message handling
- Automatic loading states
- Error handling and retry logic

```javascript
// Example usage
BridgyAPI.data.refresh();
BridgyAPI.git.commit({ message: 'Update tokens' });
BridgyAPI.export.variables({ format: 'json' });
```

### 4. **Utilities** (`bridgy-utils.js`)

- Common utility functions
- DOM helpers, validation, formatting
- Debounce/throttle, async utilities
- Color manipulation, string processing

```javascript
// Example usage
BridgyUtils.string.kebabCase('camelCase'); // 'camel-case'
BridgyUtils.validate.email('test@example.com'); // true
BridgyUtils.color.hexToRgb('#ff0000'); // {r: 255, g: 0, b: 0}
```

### 5. **Application Logic** (`bridgy-app.js`)

- Main application orchestrator
- UI rendering and event handling
- Keyboard shortcuts and responsive behavior
- Lifecycle management

## Component System

### Button Components

```javascript
// Primary button
BridgyComponents.Button.render({
  text: 'Export',
  variant: 'primary',
  size: 'medium',
  onClick: 'handleExport()',
  icon: '📤',
});

// Icon button
BridgyComponents.Button.iconButton({
  icon: '⚙️',
  title: 'Settings',
  onClick: 'openSettings()',
});
```

### Form Components

```javascript
// Input field
BridgyComponents.Input.render({
  id: 'repo-url',
  label: 'Repository URL',
  placeholder: 'https://gitlab.com/...',
  required: true,
  helper: 'Your GitLab repository URL',
});

// Select dropdown
BridgyComponents.Input.select({
  id: 'format',
  label: 'Export Format',
  options: [
    { value: 'json', label: 'JSON' },
    { value: 'css', label: 'CSS' },
  ],
});
```

### Layout Components

```javascript
// Card with actions
BridgyComponents.Card.render({
  title: 'Variable Settings',
  content: 'Configure your design tokens...',
  actions: [
    { text: 'Cancel', variant: 'secondary' },
    { text: 'Save', variant: 'primary' },
  ],
});

// Modal dialog
BridgyComponents.Modal.render({
  id: 'settings-modal',
  title: 'Settings',
  content: settingsFormHTML,
  size: 'large',
});
```

## CSS Architecture

### 1. **Variables** (`01-variables.css`)

All design tokens defined as CSS custom properties:

- Color palette (primary, neutral, semantic)
- Spacing scale (rem-based)
- Typography (sizes, weights, line heights)
- Border radius, shadows, transitions
- Z-index scale, opacity levels

### 2. **Base Styles** (`02-base.css`)

Foundation styles:

- Reset and base typography
- Scrollbar styling
- Selection colors
- Utility classes
- Accessibility features
- Animation keyframes

### 3. **Components** (`03-components.css`)

Component-specific styles:

- Button variants and states
- Form elements
- Cards and modals
- Tabs and navigation
- Notifications and loading states

### 4. **Layout** (`04-layout.css`)

Layout and responsive styles:

- Header and main content
- Grid and flexbox layouts
- Responsive breakpoints
- Mobile optimizations

## State Management System

### State Structure

```javascript
BridgyState.data = {
  // Data
  variables: [],
  components: [],
  styles: [],

  // UI State
  ui: {
    activeTab: 'variables',
    searchQuery: '',
    isLoading: false,
    modals: { settings: false },
  },

  // Settings
  gitSettings: { repoUrl: '', branch: 'main' },
  exportSettings: { format: 'json' },
};
```

### Event System

```javascript
// Listen for state changes
BridgyState.events.on('stateChange', (data) => {
  console.log('State changed:', data.path, data.value);
});

// Trigger actions
BridgyState.actions.toggleSelection('variable', 'id123');
BridgyState.actions.setSearchQuery('primary');
BridgyState.actions.switchTab('components');
```

## Benefits of New Architecture

### ✅ **Developer Experience**

- **Modular**: Easy to find and modify specific functionality
- **Reusable**: Components can be used across different parts of the UI
- **Maintainable**: Clear separation of concerns
- **Testable**: Each module can be tested independently

### ✅ **Performance**

- **Efficient**: Only load and update what's needed
- **Cached**: Browser can cache individual modules
- **Optimized**: CSS is organized for better performance

### ✅ **Scalability**

- **Extensible**: Easy to add new components and features
- **Consistent**: Design system enforces consistency
- **Flexible**: Easy to modify without breaking other parts

### ✅ **User Experience**

- **Responsive**: Mobile-first design with proper breakpoints
- **Accessible**: Built-in accessibility features
- **Fast**: Efficient state management and rendering
- **Intuitive**: Consistent component behavior

## Migration from Old Structure

### What Changed

1. **Single 6,248-line main.js** → **5 focused modules**
2. **Monolithic styles.css** → **4 organized CSS files**
3. **Inline HTML components** → **Reusable component system**
4. **Global variables** → **Centralized state management**
5. **Ad-hoc event handling** → **Event-driven architecture**

### Backwards Compatibility

- All existing onclick handlers still work
- Existing CSS classes maintained
- Plugin API unchanged
- No breaking changes for users

## Best Practices Implemented

### 🎯 **Component Design**

- Single responsibility principle
- Consistent prop interfaces
- Built-in error handling
- Accessibility by default

### 🎯 **State Management**

- Immutable state updates
- Event-driven updates
- Persistent storage
- Type-safe operations

### 🎯 **CSS Organization**

- Mobile-first responsive design
- Design token system
- BEM-inspired naming
- Scoped component styles

### 🎯 **JavaScript Architecture**

- ES6+ features with fallbacks
- Modular imports
- Error boundaries
- Performance optimizations

## Usage Examples

### Adding a New Component

```javascript
// 1. Add to bridgy-components.js
BridgyComponents.NewComponent = {
  render: (props) => `<div class="new-component">${props.content}</div>`
};

// 2. Add styles to 03-components.css
.new-component {
  padding: var(--space-4);
  background: var(--glass-dark-medium);
  border-radius: var(--radius-md);
}

// 3. Use in app
const html = BridgyComponents.NewComponent.render({ content: 'Hello' });
```

### Adding New State

```javascript
// 1. Add to state structure
BridgyState.data.myFeature = { enabled: false };

// 2. Create action
BridgyState.actions.toggleFeature = () => {
  const current = BridgyState.get.value('myFeature.enabled');
  BridgyState.set.value('myFeature.enabled', !current);
};

// 3. Listen for changes
BridgyState.events.on('stateChange', (data) => {
  if (data.path === 'myFeature.enabled') {
    updateUI();
  }
});
```

This new architecture provides a solid foundation for future development while maintaining the reliability and functionality users expect from Bridgy.
