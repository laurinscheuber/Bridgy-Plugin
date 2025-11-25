// Example: Component-based architecture within Figma plugin constraints

// === Component Registry ===
const Components = {
  // Button Component
  Button: {
    render: (props = {}) => {
      const {
        text = 'Button',
        variant = 'primary',
        onClick = () => {},
        disabled = false,
        icon = null
      } = props;

      return `
        <button 
          class="btn btn-${variant} ${disabled ? 'disabled' : ''}"
          ${disabled ? 'disabled' : ''}
          onclick="${onClick}"
        >
          ${icon ? `<span class="btn-icon">${icon}</span>` : ''}
          <span>${text}</span>
        </button>
      `;
    }
  },

  // Input Component
  Input: {
    render: (props = {}) => {
      const {
        type = 'text',
        placeholder = '',
        value = '',
        id = '',
        label = '',
        error = '',
        onChange = ''
      } = props;

      return `
        <div class="form-group ${error ? 'has-error' : ''}">
          ${label ? `<label for="${id}">${label}</label>` : ''}
          <input 
            type="${type}"
            id="${id}"
            placeholder="${placeholder}"
            value="${value}"
            class="form-input"
            onchange="${onChange}"
          />
          ${error ? `<span class="error-message">${error}</span>` : ''}
        </div>
      `;
    }
  },

  // Card Component
  Card: {
    render: (props = {}) => {
      const {
        title = '',
        content = '',
        actions = [],
        variant = 'default'
      } = props;

      return `
        <div class="card card-${variant}">
          ${title ? `<div class="card-header"><h3>${title}</h3></div>` : ''}
          <div class="card-body">
            ${content}
          </div>
          ${actions.length ? `
            <div class="card-footer">
              ${actions.map(action => Components.Button.render(action)).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  },

  // Modal Component
  Modal: {
    render: (props = {}) => {
      const {
        id = 'modal',
        title = '',
        content = '',
        footer = '',
        isOpen = false
      } = props;

      return `
        <div id="${id}" class="modal ${isOpen ? 'open' : ''}">
          <div class="modal-backdrop" onclick="Components.Modal.close('${id}')"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h2>${title}</h2>
              <button class="close-modal" onclick="Components.Modal.close('${id}')">&times;</button>
            </div>
            <div class="modal-body">
              ${content}
            </div>
            ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
          </div>
        </div>
      `;
    },
    
    open: (modalId) => {
      document.getElementById(modalId)?.classList.add('open');
    },
    
    close: (modalId) => {
      document.getElementById(modalId)?.classList.remove('open');
    }
  },

  // Notification Component
  Notification: {
    render: (props = {}) => {
      const {
        type = 'info',
        title = '',
        message = '',
        dismissible = true
      } = props;

      const id = `notification-${Date.now()}`;
      
      return `
        <div id="${id}" class="notification notification-${type}">
          <div class="notification-content">
            <div class="notification-icon">
              ${this.getIcon(type)}
            </div>
            <div class="notification-text">
              ${title ? `<div class="notification-title">${title}</div>` : ''}
              <div class="notification-message">${message}</div>
            </div>
          </div>
          ${dismissible ? `
            <button class="notification-close" onclick="Components.Notification.dismiss('${id}')">
              &times;
            </button>
          ` : ''}
        </div>
      `;
    },
    
    show: (props) => {
      const container = document.getElementById('notification-container');
      const notification = Components.Notification.render(props);
      container.insertAdjacentHTML('beforeend', notification);
      
      // Auto dismiss after 5 seconds
      if (props.autoDismiss !== false) {
        setTimeout(() => {
          Components.Notification.dismiss(`notification-${Date.now()}`);
        }, 5000);
      }
    },
    
    dismiss: (notificationId) => {
      const element = document.getElementById(notificationId);
      element?.classList.add('fade-out');
      setTimeout(() => element?.remove(), 300);
    },
    
    getIcon: (type) => {
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };
      return icons[type] || icons.info;
    }
  }
};

// === Component Styles Manager ===
const StyleManager = {
  // Component-specific styles as JavaScript objects
  styles: {
    button: {
      base: `
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-3) var(--space-6);
          border-radius: var(--radius-button);
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
          transition: var(--transition-normal);
          cursor: pointer;
          border: none;
          outline: none;
          gap: var(--space-2);
        }
      `,
      variants: `
        .btn-primary {
          background: var(--gradient-button);
          color: var(--neutral-0);
          box-shadow: var(--shadow-purple-medium);
        }
        
        .btn-primary:hover {
          background: var(--gradient-button-hover);
          box-shadow: var(--shadow-purple-heavy);
        }
        
        .btn-secondary {
          background: var(--glass-dark-light);
          color: var(--neutral-100);
          border: 1px solid var(--glass-white-medium);
        }
        
        .btn-secondary:hover {
          background: var(--glass-dark-medium);
          border-color: var(--glass-white-heavy);
        }
        
        .btn.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }
      `
    },
    
    input: {
      base: `
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        
        .form-input {
          height: 40px;
          padding: var(--space-3) var(--space-4);
          background: var(--glass-dark-medium);
          border: 1px solid var(--glass-white-medium);
          border-radius: var(--radius-md);
          color: var(--neutral-100);
          font-size: var(--text-sm);
          transition: var(--transition-normal);
          outline: none;
        }
        
        .form-input:focus {
          border-color: var(--primary-400);
          box-shadow: 0 0 0 3px var(--glass-purple-light);
        }
        
        .form-group.has-error .form-input {
          border-color: var(--error-500);
        }
        
        .error-message {
          color: var(--error-500);
          font-size: var(--text-xs);
        }
      `
    }
  },
  
  // Inject all component styles
  init: function() {
    const styleEl = document.createElement('style');
    styleEl.id = 'component-styles';
    
    let allStyles = '';
    Object.values(this.styles).forEach(componentStyle => {
      Object.values(componentStyle).forEach(style => {
        allStyles += style;
      });
    });
    
    styleEl.textContent = allStyles;
    document.head.appendChild(styleEl);
  }
};

// === Component Factory ===
const ComponentFactory = {
  // Create a settings form using components
  createSettingsForm: () => {
    return `
      <form id="settings-form">
        ${Components.Input.render({
          id: 'repo-url',
          label: 'Repository URL',
          placeholder: 'https://gitlab.com/username/repo',
          onChange: 'handleRepoUrlChange(event)'
        })}
        
        ${Components.Input.render({
          id: 'branch',
          label: 'Branch',
          placeholder: 'main',
          value: 'main'
        })}
        
        ${Components.Input.render({
          id: 'token',
          type: 'password',
          label: 'Access Token',
          placeholder: 'Your GitLab token'
        })}
        
        <div class="form-actions">
          ${Components.Button.render({
            text: 'Cancel',
            variant: 'secondary',
            onClick: 'closeSettings()'
          })}
          
          ${Components.Button.render({
            text: 'Save Settings',
            variant: 'primary',
            onClick: 'saveSettings()'
          })}
        </div>
      </form>
    `;
  },
  
  // Create a variable list item
  createVariableItem: (variable) => {
    return Components.Card.render({
      variant: 'compact',
      content: `
        <div class="variable-item">
          <div class="variable-name">${variable.name}</div>
          <div class="variable-value">${variable.value}</div>
        </div>
      `,
      actions: [
        {
          text: 'Edit',
          variant: 'secondary',
          icon: '✏️',
          onClick: `editVariable('${variable.id}')`
        }
      ]
    });
  }
};

// === Usage Example ===
// In your main.js, you would use components like this:

document.addEventListener('DOMContentLoaded', () => {
  // Initialize component styles
  StyleManager.init();
  
  // Render a modal
  document.body.insertAdjacentHTML('beforeend', 
    Components.Modal.render({
      id: 'settings-modal',
      title: 'Plugin Settings',
      content: ComponentFactory.createSettingsForm(),
      footer: `
        <div class="modal-actions">
          ${Components.Button.render({
            text: 'Documentation',
            variant: 'secondary',
            onClick: 'window.open("https://docs.example.com")'
          })}
        </div>
      `
    })
  );
  
  // Show a notification
  Components.Notification.show({
    type: 'success',
    title: 'Success!',
    message: 'Your settings have been saved.',
    autoDismiss: true
  });
});