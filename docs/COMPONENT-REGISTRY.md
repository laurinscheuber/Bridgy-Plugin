# Bridgy Plugin Component Registry

This document provides an overview of all UI components available in the Bridgy Figma plugin and their usage patterns.

## Component Architecture

The Bridgy plugin uses a modular component system organized into the following files:
- `src/ui/js/bridgy-components.js` - Reusable UI components
- `src/ui/css/components.css` - Component-specific styles
- `src/ui/js/bridgy-app.js` - Main application orchestrator

## Available Components

### Core UI Components

#### Button Component
**File:** `src/ui/js/bridgy-components.js:22`
**Usage:**
```javascript
BridgyComponents.Button.render({
  text: 'Click Me',
  variant: 'primary', // 'primary', 'secondary', 'ghost', 'danger'
  size: 'medium',     // 'small', 'medium', 'large'
  onClick: 'functionName()',
  disabled: false,
  icon: '🎨',         // optional emoji icon
  id: 'unique-id',    // optional
  className: 'custom-class' // optional
})
```

#### Input Component
**File:** `src/ui/js/bridgy-components.js:89`
**Usage:**
```javascript
BridgyComponents.Input.render({
  id: 'input-id',
  name: 'fieldName',
  type: 'text',       // 'text', 'password', 'email', 'number'
  label: 'Field Label',
  placeholder: 'Enter text...',
  value: 'default value',
  required: true,
  helper: 'Additional help text',
  error: 'Error message' // optional
})
```

#### Modal Component
**File:** `src/ui/js/bridgy-components.js:193`
**Usage:**
```javascript
// Render modal
const modalHTML = BridgyComponents.Modal.render({
  id: 'my-modal',
  title: 'Modal Title',
  content: '<p>Modal content here</p>',
  size: 'medium',     // 'small', 'medium', 'large'
  closable: true
});

// Control modal
BridgyComponents.Modal.open('my-modal');
BridgyComponents.Modal.close('my-modal');
```

#### Tabs Component
**File:** `src/ui/js/bridgy-components.js:368`
**Usage:**
```javascript
BridgyComponents.Tabs.render({
  id: 'main-tabs',
  tabs: [
    {
      label: 'Tab 1',
      content: '<div>Tab 1 content</div>',
      icon: '🎨',
      badge: 5 // optional
    },
    // ... more tabs
  ],
  activeTab: 0
})
```

#### Notification Component
**File:** `src/ui/js/bridgy-components.js:283`
**Usage:**
```javascript
BridgyComponents.Notification.show({
  type: 'success',    // 'success', 'error', 'warning', 'info'
  title: 'Success!', // optional
  message: 'Operation completed successfully',
  duration: 5000,    // auto-hide after ms (0 = no auto-hide)
  action: {          // optional
    text: 'Undo',
    onClick: 'undoFunction()'
  }
})
```

### Layout Components

#### Card Component
**File:** `src/ui/js/bridgy-components.js:149`
**Usage:**
```javascript
BridgyComponents.Card.render({
  title: 'Card Title',
  content: '<p>Card content</p>',
  variant: 'default', // 'default', 'outlined', 'elevated'
  padding: 'medium',  // 'small', 'medium', 'large'
  className: 'custom-card'
})
```

#### List Component
**File:** `src/ui/js/bridgy-components.js:446`
**Usage:**
```javascript
BridgyComponents.List.render({
  items: [
    { id: '1', content: 'Item 1', selected: true },
    { id: '2', content: 'Item 2', selected: false }
  ],
  selectable: true,
  multiSelect: true,
  emptyText: 'No items available'
})
```

### Utility Components

#### Loading Component
**File:** `src/ui/js/bridgy-components.js:420`
**Usage:**
```javascript
BridgyComponents.Loading.render({
  text: 'Loading...',
  size: 'medium',     // 'small', 'medium', 'large'
  variant: 'spinner'  // 'spinner', 'dots', 'pulse'
})
```

#### Badge Component
**File:** `src/ui/js/bridgy-components.js:477`
**Usage:**
```javascript
BridgyComponents.Badge.render({
  text: '5',
  variant: 'primary', // 'primary', 'secondary', 'success', 'warning', 'error'
  size: 'small'       // 'small', 'medium', 'large'
})
```

#### EmptyState Component
**File:** `src/ui/js/bridgy-components.js:506`
**Usage:**
```javascript
BridgyComponents.EmptyState.render({
  icon: '🎨',
  title: 'No Items Found',
  message: 'Create some items to get started.',
  action: {           // optional
    text: 'Create Item',
    variant: 'primary',
    onClick: 'createItem()'
  }
})
```

## State Management

### BridgyState
**File:** `src/ui/js/bridgy-state.js`

Centralized state management for the plugin:

```javascript
// Get state
const variables = BridgyState.data.variables;
const selectedItems = BridgyState.data.selectedVariables;

// Update state
BridgyState.set.merge('gitSettings', newSettings);
BridgyState.actions.toggleSelection('variable', variableId);

// Listen to state changes
BridgyState.events.on('stateChange', (data) => {
  console.log('State changed:', data);
});
```

## API Communication

### BridgyAPI
**File:** `src/ui/js/bridgy-api.js`

Handles communication between UI and plugin core:

```javascript
// Data operations
BridgyAPI.data.refresh();
BridgyAPI.data.deleteVariable(id);

// Git operations
BridgyAPI.git.commit();
BridgyAPI.git.testConnection();

// Import/Export operations
BridgyAPI.export.variables();
BridgyAPI.import.parse(data, format);

// OAuth operations
BridgyAPI.oauth.initiate();
BridgyAPI.oauth.checkStatus();
```

## Styling System

### CSS Custom Properties
**File:** `src/ui/css/01-variables.css`

The plugin uses CSS custom properties for consistent theming:

```css
/* Colors */
--primary-400: #8b5cf6;
--primary-500: #7c3aed;
--neutral-0: #ffffff;
--neutral-900: #0f172a;

/* Glass morphism */
--glass-white-light: rgba(255, 255, 255, 0.1);
--glass-white-medium: rgba(255, 255, 255, 0.2);
--glass-purple-light: rgba(139, 92, 246, 0.1);

/* Spacing */
--space-1: 0.25rem;
--space-4: 1rem;
--space-6: 1.5rem;

/* Typography */
--text-sm: 0.875rem;
--text-base: 1rem;
--font-medium: 500;
```

### Component Classes
**File:** `src/ui/css/03-components.css`

Organized component styles:
- `.btn-*` - Button variants
- `.input-*` - Input field styles
- `.modal-*` - Modal components
- `.tab-*` - Tab navigation
- `.notification-*` - Notification styles

## Usage Patterns

### Creating a New Feature

1. **Define Component Structure**
   ```javascript
   // In bridgy-components.js
   const MyComponent = {
     render: (props = {}) => {
       // Component implementation
       return html;
     }
   };
   ```

2. **Add Styles**
   ```css
   /* In components.css */
   .my-component {
     /* Component styles */
   }
   ```

3. **Integrate with State**
   ```javascript
   // In bridgy-app.js
   BridgyState.events.on('myEvent', this.handleMyEvent.bind(this));
   ```

### Best Practices

1. **Component Naming**: Use PascalCase for component names
2. **Props Validation**: Always provide defaults for component props
3. **Event Handling**: Use the centralized state management system
4. **Styling**: Follow the established CSS custom property system
5. **Error Handling**: Include proper error boundaries and validation

## Testing Components

To test components in the plugin:

1. Use the browser developer tools in Figma
2. Access components via `window.BridgyComponents`
3. Test state changes via `window.BridgyState`
4. Monitor API calls via `window.BridgyAPI`

## Migration Notes

When updating from the old structure:
- Replace direct DOM manipulation with component renders
- Use BridgyState instead of global variables
- Migrate event handlers to the centralized system
- Update CSS to use the new custom property system