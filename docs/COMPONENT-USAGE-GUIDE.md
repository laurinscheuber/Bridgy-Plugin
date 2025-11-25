# Bridgy Plugin Component Usage Guide

## Quick Start

This guide shows you how to use and extend the Bridgy plugin component system.

## Basic Component Usage

### 1. Rendering a Button
```javascript
// Simple button
const buttonHTML = BridgyComponents.Button.render({
  text: 'Save Settings',
  variant: 'primary',
  onClick: 'saveSettings()'
});

// Icon button
const iconButtonHTML = BridgyComponents.Button.iconButton({
  icon: '⚙️',
  variant: 'ghost',
  onClick: 'openSettings()',
  title: 'Open Settings'
});
```

### 2. Creating a Form
```javascript
const formHTML = `
  <form id="my-form">
    ${BridgyComponents.Input.render({
      id: 'username',
      name: 'username',
      label: 'Username',
      placeholder: 'Enter your username',
      required: true
    })}
    
    ${BridgyComponents.Input.render({
      id: 'password',
      name: 'password',
      type: 'password',
      label: 'Password',
      required: true
    })}
    
    <div class="form-actions">
      ${BridgyComponents.Button.render({
        text: 'Cancel',
        variant: 'secondary',
        onClick: 'closeModal()'
      })}
      ${BridgyComponents.Button.render({
        text: 'Login',
        variant: 'primary',
        onClick: 'submitForm()'
      })}
    </div>
  </form>
`;
```

### 3. Creating a Modal
```javascript
// Render modal HTML
const modalHTML = BridgyComponents.Modal.render({
  id: 'login-modal',
  title: 'Login to Continue',
  content: formHTML,
  size: 'medium'
});

// Add to page
document.body.insertAdjacentHTML('beforeend', modalHTML);

// Open modal
BridgyComponents.Modal.open('login-modal');
```

## Advanced Usage

### 1. Dynamic Content Updates
```javascript
// Update a list dynamically
function updateVariablesList() {
  const variables = BridgyState.get.filteredVariables();
  const listHTML = variables.map(variable => 
    renderVariableItem(variable)
  ).join('');
  
  const container = BridgyUtils.dom.$('variables-list');
  if (container) {
    BridgyUtils.dom.setHTML(container, listHTML);
  }
}

function renderVariableItem(variable) {
  return `
    <div class="variable-item" data-id="${variable.id}">
      <div class="variable-preview">
        ${renderVariablePreview(variable)}
      </div>
      <div class="variable-info">
        <div class="variable-name">${variable.name}</div>
        <div class="variable-type">${variable.type}</div>
      </div>
      <div class="variable-actions">
        ${BridgyComponents.Button.iconButton({
          icon: '✏️',
          size: 'small',
          onClick: `editVariable('${variable.id}')`,
          title: 'Edit variable'
        })}
      </div>
    </div>
  `;
}
```

### 2. Tabs with Dynamic Content
```javascript
function renderMainTabs() {
  const tabsData = [
    {
      label: 'Variables',
      content: renderVariablesContent(),
      icon: '🎨',
      badge: BridgyState.data.variables.length
    },
    {
      label: 'Components',
      content: renderComponentsContent(),
      icon: '📦',
      badge: BridgyState.data.components.length
    }
  ];

  const tabsHTML = BridgyComponents.Tabs.render({
    id: 'main-tabs',
    tabs: tabsData,
    activeTab: 0
  });

  const container = BridgyUtils.dom.$('tabs-container');
  BridgyUtils.dom.setHTML(container, tabsHTML);
}
```

### 3. State-Driven Components
```javascript
// Listen for state changes and update UI
BridgyState.events.on('selectionChange', (data) => {
  updateSelectionUI(data);
  updateBulkActions(data);
});

function updateSelectionUI(data) {
  const count = data.selectedItems.size;
  const counter = BridgyUtils.dom.$('selection-counter');
  const bulkActions = BridgyUtils.dom.$('bulk-actions');
  
  if (counter) {
    counter.textContent = count;
  }
  
  if (bulkActions) {
    bulkActions.style.display = count > 0 ? 'flex' : 'none';
  }
}
```

## Creating Custom Components

### 1. Basic Component Structure
```javascript
// Add to BridgyComponents object
BridgyComponents.CustomComponent = {
  render: (props = {}) => {
    const {
      title = '',
      content = '',
      variant = 'default',
      className = '',
      ...otherProps
    } = props;

    return `
      <div class="custom-component custom-component--${variant} ${className}"
           ${Object.entries(otherProps).map(([key, value]) => 
             `data-${key}="${value}"`).join(' ')}>
        <div class="custom-component__header">
          <h3 class="custom-component__title">${title}</h3>
        </div>
        <div class="custom-component__content">
          ${content}
        </div>
      </div>
    `;
  }
};
```

### 2. Component with Methods
```javascript
BridgyComponents.AdvancedComponent = {
  render: (props = {}) => {
    // Render logic
    return html;
  },

  update: (id, newProps) => {
    const element = BridgyUtils.dom.$(id);
    if (element) {
      const newHTML = this.render(newProps);
      element.outerHTML = newHTML;
    }
  },

  destroy: (id) => {
    const element = BridgyUtils.dom.$(id);
    if (element) {
      element.remove();
    }
  }
};
```

## Working with State

### 1. Reading State
```javascript
// Get current state
const variables = BridgyState.data.variables;
const selectedVariables = BridgyState.data.selectedVariables;
const searchQuery = BridgyState.data.ui.searchQuery;

// Use getters for computed values
const filteredVariables = BridgyState.get.filteredVariables();
const hasSelection = BridgyState.get.hasSelection();
```

### 2. Updating State
```javascript
// Update specific values
BridgyState.set.value('ui.searchQuery', 'new search');
BridgyState.set.merge('gitSettings', { repoUrl: 'https://...' });

// Use actions for complex operations
BridgyState.actions.toggleSelection('variable', variableId);
BridgyState.actions.selectAll('variables');
BridgyState.actions.clearSelection('variables');
```

### 3. Listening to Changes
```javascript
// Listen to specific events
BridgyState.events.on('stateChange', (data) => {
  console.log(`State changed at ${data.path}:`, data.newValue);
});

BridgyState.events.on('selectionChange', (data) => {
  updateUI(data);
});

// One-time listeners
BridgyState.events.once('dataLoaded', (data) => {
  initializeUI(data);
});
```

## API Integration

### 1. Making API Calls
```javascript
// Refresh data from plugin
BridgyAPI.data.refresh();

// Export selected variables
BridgyAPI.export.variables();

// Save settings
BridgyAPI.settings.save(settingsData);

// Test git connection
BridgyAPI.git.testConnection();
```

### 2. Handling API Responses
```javascript
// Listen for API events
BridgyState.events.on('dataLoaded', (data) => {
  // Update UI with new data
  updateAllLists();
  hideLoadingState();
});

BridgyState.events.on('exportComplete', (data) => {
  BridgyComponents.Notification.show({
    type: 'success',
    message: `Exported ${data.count} items successfully`
  });
});

BridgyState.events.on('apiError', (error) => {
  BridgyComponents.Notification.show({
    type: 'error',
    title: 'API Error',
    message: error.message
  });
});
```

## Utility Functions

### 1. DOM Helpers
```javascript
// Find elements safely
const element = BridgyUtils.dom.$('element-id');
const elements = BridgyUtils.dom.findAll('.class-name');

// Create elements
const newElement = BridgyUtils.dom.create('div', {
  className: 'my-class',
  id: 'my-id',
  dataset: { value: '123' }
}, 'Content here');

// Set HTML safely
BridgyUtils.dom.setHTML(container, htmlContent);
```

### 2. String Utilities
```javascript
// Format strings
const truncated = BridgyUtils.string.truncate('Long text...', 20);
const slug = BridgyUtils.string.slugify('My Variable Name');
const escaped = BridgyUtils.string.escapeHTML('<script>');
```

### 3. Array Utilities
```javascript
// Group arrays
const grouped = BridgyUtils.array.groupBy(variables, 'collection');

// Sort arrays
const sorted = BridgyUtils.array.sortBy(variables, 'name');

// Filter arrays
const unique = BridgyUtils.array.unique(items, 'id');
```

### 4. Performance Helpers
```javascript
// Debounce function calls
const debouncedSave = BridgyUtils.debounce(saveSettings, 1000);

// Throttle function calls
const throttledScroll = BridgyUtils.throttle(handleScroll, 100);
```

## Best Practices

### 1. Component Design
- Keep components focused and single-purpose
- Use descriptive prop names with sensible defaults
- Include proper error handling and validation
- Make components responsive and accessible

### 2. State Management
- Use the centralized state system instead of global variables
- Listen for state changes rather than polling
- Keep state updates atomic and predictable
- Use actions for complex state changes

### 3. Performance
- Use debouncing for frequent operations like search
- Avoid unnecessary DOM updates
- Use event delegation for dynamic content
- Clean up event listeners when components are destroyed

### 4. Error Handling
- Always validate props and state
- Provide meaningful error messages
- Use try-catch blocks for API calls
- Show user-friendly error notifications

## Examples

See the main application implementation in `src/ui/js/bridgy-app.js` for real-world usage examples of all these patterns.