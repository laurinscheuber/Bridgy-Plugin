# Bridgy UI Components Reference

Generated on 2025-11-25T07:09:08.759Z

## Overview

This document provides a complete reference for all UI components available in the Bridgy plugin. The components are organized in a modular, reusable structure.

## Architecture

### Component System

The Bridgy UI uses a component-based architecture with the following structure:

```
BridgyComponents/
├── Button          # Button variations and states
├── Input           # Form input components  
├── Card            # Card containers and layouts
├── Modal           # Modal dialogs and overlays
├── Notification    # Toast notifications
├── Tabs            # Tab navigation
├── Loading         # Loading states and progress
├── List            # List and item components
├── Badge           # Status badges
└── EmptyState      # Empty state displays
```

### State Management

```javascript
BridgyState.data = {
  variables: [],           // Design variables
  components: [],          // Figma components  
  selectedVariables: Set,  // Selected variable IDs
  gitSettings: {},        // Repository settings
  ui: {                   // UI state
    activeTab: 'variables',
    searchQuery: '',
    expandedGroups: Set
  }
}
```

### API Communication

```javascript
BridgyAPI.send(type, data)     // Send to plugin core
BridgyAPI.data.refresh()       // Refresh from Figma
BridgyAPI.git.commit(options)  // Commit to repository
BridgyAPI.import.tokens(data)  // Import design tokens
```

## Component Usage

### Button Component

```javascript
// Basic button
BridgyComponents.Button.render({
  text: 'Click me',
  variant: 'primary',
  onClick: 'handleClick()'
});

// Icon button
BridgyComponents.Button.iconButton({
  icon: '⚙️',
  title: 'Settings',
  onClick: 'openSettings()'
});
```

**Variants:** primary, secondary, ghost
**Sizes:** small, medium, large
**States:** default, hover, active, disabled, loading

### Input Component

```javascript
// Text input
BridgyComponents.Input.render({
  id: 'username',
  label: 'Username',
  placeholder: 'Enter username',
  required: true
});

// Select dropdown
BridgyComponents.Input.select({
  id: 'format',
  label: 'Export Format',
  options: [
    { value: 'json', label: 'JSON' },
    { value: 'css', label: 'CSS' }
  ]
});
```

**Types:** text, password, email, textarea, select, checkbox

### Card Component

```javascript
BridgyComponents.Card.render({
  title: 'Variable Group',
  subtitle: '12 variables',
  content: '<p>Card content here</p>',
  actions: [{
    text: 'Edit',
    variant: 'secondary',
    onClick: 'editGroup()'
  }]
});
```

**Variants:** default, compact, bordered, elevated

### Modal Component

```javascript
// Render modal
const modal = BridgyComponents.Modal.render({
  id: 'settings-modal',
  title: 'Settings',
  content: '<form>...</form>',
  size: 'large'
});

// Control modal
BridgyComponents.Modal.open('settings-modal');
BridgyComponents.Modal.close('settings-modal');
```

**Sizes:** small, medium, large, fullscreen

### Notification System

```javascript
// Show notification
BridgyComponents.Notification.show({
  type: 'success',
  title: 'Import Complete',
  message: 'Successfully imported 25 tokens',
  duration: 5000
});
```

**Types:** success, error, warning, info

### Tab Navigation

```javascript
BridgyComponents.Tabs.render({
  id: 'main-tabs',
  tabs: [
    { label: 'Variables', icon: '🎨', content: '...' },
    { label: 'Components', icon: '🧩', content: '...' }
  ]
});
```

## Utilities

### BridgyUtils

```javascript
BridgyUtils.dom.$(id)                    // Get element by ID
BridgyUtils.string.kebabCase(str)        // Convert to kebab-case
BridgyUtils.array.groupBy(arr, key)      // Group array by key
BridgyUtils.validate.email(email)        // Validate email
BridgyUtils.format.number(num, precision) // Format number
BridgyUtils.debounce(fn, delay)          // Debounce function
```

## Event System

```javascript
// Listen for events
BridgyState.events.on('dataLoaded', (data) => {
  console.log('Data loaded:', data);
});

// Emit events
BridgyState.events.emit('selectionChange', { 
  type: 'variable', 
  id: 'var123' 
});
```

## Best Practices

### Component Creation

1. **Use BridgyComponents** for all UI elements
2. **Follow naming conventions** (kebab-case for CSS, camelCase for JS)
3. **Include proper accessibility** attributes
4. **Handle loading and error states**

### State Management

1. **Use BridgyState** for all application state
2. **Subscribe to state changes** for reactive updates
3. **Auto-save settings** with debounced updates
4. **Clear selections** when switching contexts

### Performance

1. **Debounce search inputs** to avoid excessive filtering
2. **Use virtual scrolling** for large lists
3. **Lazy load** expensive operations
4. **Cache API responses** when appropriate

## Customization

### Adding New Components

1. Add component to `BridgyComponents` object
2. Include CSS styles in `components.css`
3. Update this documentation
4. Add usage examples

### Styling Guidelines

1. **Use CSS variables** for colors and spacing
2. **Follow glass morphism design** patterns
3. **Support dark mode** (already implemented)
4. **Ensure accessibility** (contrast, focus states)

## Examples

See the `docs/figma-component-templates.md` file for complete Figma component specifications and copy-paste templates.
