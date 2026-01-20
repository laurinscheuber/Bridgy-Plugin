// ===== SECURITY UTILITIES IMPORT =====
// Import SecurityUtils and ErrorHandler for secure HTML handling
class SecurityUtils {
  static sanitizeHTML(htmlString) {
    if (typeof htmlString !== 'string') {
      return '';
    }

    // Remove script tags and dangerous event handlers but allow onclick for toggleSubgroup
    let sanitized = htmlString
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, (match) => {
        // Allow onclick for specific safe functions
        if (
          match.includes('toggleSubgroup(') ||
          match.includes('toggleComponentSet(') ||
          match.includes('toggleStyles(') ||
          match.includes('scrollToGroupById(') ||
          match.includes('generateTest(') ||
          match.includes('deleteVariable(') ||
          match.includes('deleteStyle(') ||
          match.includes('console.log(') ||
          match.includes('alert(') ||
          match.includes('simulateImport(') ||
          match.includes('clearInput(') ||
          match.includes('copyToClipboard(') ||
          match.includes('handleFileUpload(') ||
          match.includes('switchToQualityTab(') ||
          match.includes('dismissFeedback(') ||
          match.includes('closeNotification(') ||
          match.includes('toggleCollection(') ||
          match.includes('expandAllSubgroups(') ||
          match.includes('collapseAllSubgroups(') ||
          match.includes('clearSearch(') ||
          match.includes('scrollToVariable(') ||
          match.includes('updateTailwindRenameButtonState(') ||
          match.includes('openRenameTailwindVariableDialog(') ||
          match.includes('expandAllImportGroups(') ||
          match.includes('collapseAllImportGroups(') ||
          match.includes('selectAllVariables(') ||
          match.includes('expandAllStyleGroups(') ||
          match.includes('collapseAllStyleGroups(') ||
          match.includes('selectAllStyles(')
        ) {
          return match;
        }
        return '';
      })
      .replace(/on\w+\s*=\s*[^>\s]+/gi, (match) => {
        // Allow onclick for specific safe functions
        if (
          match.includes('toggleSubgroup(') ||
          match.includes('toggleComponentSet(') ||
          match.includes('toggleStyles(') ||
          match.includes('scrollToGroupById(') ||
          match.includes('generateTest(') ||
          match.includes('deleteVariable(') ||
          match.includes('deleteStyle(') ||
          match.includes('console.log(') ||
          match.includes('alert(') ||
          match.includes('simulateImport(') ||
          match.includes('clearInput(') ||
          match.includes('copyToClipboard(') ||
          match.includes('handleFileUpload(') ||
          match.includes('switchToQualityTab(') ||
          match.includes('dismissFeedback(') ||
          match.includes('closeNotification(') ||
          match.includes('toggleCollection(') ||
          match.includes('expandAllSubgroups(') ||
          match.includes('collapseAllSubgroups(') ||
          match.includes('clearSearch(') ||
          match.includes('expandAllVariables(') ||
          match.includes('collapseAllVariables(') ||
          match.includes('toggleSearchBar(') ||
          match.includes('expandAllComponents(') ||
          match.includes('collapseAllComponents(') ||
          match.includes('toggleFeedback(') ||
          match.includes('scrollToVariable(') ||
          match.includes('deleteStyle(') ||
          match.includes('updateTailwindActionButtonsState(') ||
          match.includes('applyTailwindNamespace(') ||
          match.includes('expandAllImportGroups(') ||
          match.includes('collapseAllImportGroups(') ||
          match.includes('selectAllVariables(') ||
          match.includes('expandAllStyleGroups(') ||
          match.includes('collapseAllStyleGroups(') ||
          match.includes('selectAllStyles(')
        ) {
          return match;
        }
        return '';
      })
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/data:/gi, '');

    // Allow only safe HTML tags
    const allowedTags = [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      'u',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'code',
      'pre',
      'blockquote',
      'button',
      'svg',
      'path',
      'circle',
      'polyline',
      'line',
      'rect',
      'ellipse',
      'polygon',
      'g',
      'select',
      'option',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
      'a',
      'input',
      'label',
      'textarea',
    ];

    // Remove any tags not in allowlist, but preserve safe attributes for allowed tags
    sanitized = sanitized.replace(
      /<\/?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g,
      (match, tagName, attrs) => {
        const lowerTagName = tagName.toLowerCase();
        if (allowedTags.indexOf(lowerTagName) === -1) {
          return '';
        }

        // Special handling for <a> tags - preserve href and target attributes only
        if (lowerTagName === 'a' && attrs) {
          let safeAttrs = '';

          // Extract href attribute
          const hrefMatch = attrs.match(/\shref="([^"]*)"/);
          if (hrefMatch && hrefMatch[1] && hrefMatch[1].startsWith('https://')) {
            safeAttrs += ` href="${hrefMatch[1]}"`;
          }

          // Extract target attribute
          const targetMatch = attrs.match(/\starget="([^"]*)"/);
          if (targetMatch && (targetMatch[1] === '_blank' || targetMatch[1] === '_self')) {
            safeAttrs += ` target="${targetMatch[1]}"`;
          }

          return `<${tagName}${safeAttrs}>`;
        }

        // For other tags, return as-is
        return match;
      },
    );

    return sanitized;
  }

  static escapeHTML(text) {
    if (typeof text !== 'string') {
      return '';
    }

    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
  }

  /**
   * Validate GitLab URL format
   * @param {string} url GitLab URL
   * @returns {boolean} true if valid GitLab URL
   */
  static isValidGitLabURL(url) {
    if (typeof url !== 'string') {
      return false;
    }

    try {
      const parsedUrl = new URL(url);

      // Must be HTTPS
      if (parsedUrl.protocol !== 'https:') {
        return false;
      }

      // Check for common GitLab patterns
      const gitlabPatterns = [
        /^gitlab\.com$/,
        /^.*\.gitlab\.com$/,
        /^.*\.gitlab\.io$/,
        /gitlab/i, // Allow custom GitLab instances with "gitlab" in domain
      ];

      return gitlabPatterns.some((pattern) => pattern.test(parsedUrl.hostname));
    } catch {
      return false;
    }
  }

  /**
   * Simple encryption for sensitive data storage
   * @param {string} data Data to encrypt
   * @param {string} key Encryption key
   * @returns {string} Encrypted string
   */
  static encryptData(data, key) {
    if (typeof data !== 'string' || typeof key !== 'string') {
      throw new Error('Data and key must be strings');
    }

    // Simple XOR encryption for basic obfuscation
    const keyBytes = new TextEncoder().encode(key);
    const dataBytes = new TextEncoder().encode(data);
    const encrypted = new Uint8Array(dataBytes.length);

    for (let i = 0; i < dataBytes.length; i++) {
      encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    // Convert to base64 for storage
    return btoa(String.fromCharCode(...encrypted));
  }

  /**
   * Decrypt data encrypted with encryptData
   * @param {string} encryptedData Encrypted data string
   * @param {string} key Decryption key
   * @returns {string} Decrypted string
   */
  static decryptData(encryptedData, key) {
    if (typeof encryptedData !== 'string' || typeof key !== 'string') {
      throw new Error('Encrypted data and key must be strings');
    }

    try {
      // Decode from base64
      const encrypted = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map((char) => char.charCodeAt(0)),
      );

      const keyBytes = new TextEncoder().encode(key);
      const decrypted = new Uint8Array(encrypted.length);

      for (let i = 0; i < encrypted.length; i++) {
        decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
      }

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data - invalid format or key');
    }
  }

  /**
   * Generate a simple key for encryption based on session/user
   * @returns {string} Encryption key
   */
  static generateEncryptionKey() {
    // Use figma file ID + timestamp as key components (without navigator.userAgent)
    const fileId = typeof figma !== 'undefined' && figma.root ? figma.root.id : 'default';
    const sessionId = Math.random().toString(36).substring(2, 15); // Random session identifier
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily rotation

    return btoa(`${fileId}:${sessionId}:${timestamp}`).slice(0, 32);
  }
}

// ===== UI HELPERS =====
class UIHelper {
  static createBadge(text, type = 'default') {
    return `<span class="list-badge badge-${type}">${text}</span>`;
  }

  static createNavIcon(id, title = 'Navigate', icon = 'filter_center_focus') {
    return `
            <button class="nav-icon node-focus-btn" data-component-id="${id}" title="${title}">
              <span class="material-symbols-outlined">${icon}</span>
            </button>
          `;
  }

  static createActionBtn(icon, title, dataAttrs = {}, wide = false) {
    const btnClass = wide ? 'icon-btn-wide' : 'compact-action-btn'; // Legacy support or new wide style
    const attributes = Object.entries(dataAttrs)
      .map(([k, v]) => `${k}="${v}"`)
      .join(' ');
    return `
              <button class="${btnClass} ${dataAttrs.class || ''}" ${attributes} title="${title}">
                <span class="material-symbols-outlined">${icon}</span>
                <span class="action-btn-label">${title}</span>
              </button>
            `;
  }

  static renderEmptyState(message) {
    return `<div class="no-items">${message}</div>`;
  }

  static createSkeletonLoader() {
    return `
            <div class="quality-skeleton-loader" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0;">
              <div class="plugin-loading-spinner"></div>
              <div class="plugin-loading-status" style="margin-top: 0; font-size: 13px; opacity: 0.8;">Analyzing token coverage...</div>
            </div>
          `;
  }
}

// ===== GITLAB URL HELPERS =====
function buildGitLabApiUrl(gitlabUrl) {
  if (!gitlabUrl) return 'https://gitlab.com/api/v4';

  // Remove trailing slash if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '');

  // Add /api/v4 if not already present
  if (cleanUrl.endsWith('/api/v4')) {
    return cleanUrl;
  }

  return `${cleanUrl}/api/v4`;
}

function buildGitLabWebUrl(gitlabUrl) {
  if (!gitlabUrl) return 'https://gitlab.com';

  // Remove trailing slash and /api/v4 if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');

  return cleanUrl;
}

// ===== REPOSITORY CONFIGURATION HELPERS =====
function isRepositoryConfigured() {
  // Check unified settings first
  if (
    window.gitSettings &&
    window.gitSettings.projectId &&
    window.gitSettings.projectId.trim() &&
    window.gitSettings.token &&
    window.gitSettings.token.trim()
  ) {
    return true;
  }

  // Fallback to legacy GitLab settings
  return (
    window.gitlabSettings &&
    window.gitlabSettings.projectId &&
    window.gitlabSettings.projectId.trim() &&
    window.gitlabSettings.gitlabToken &&
    window.gitlabSettings.gitlabToken.trim()
  );
}

function updateCommitButtonStates() {
  const hasVariables =
    variablesData && variablesData.some((collection) => collection.variables.length > 0);

  const isConfigured = isRepositoryConfigured();

  // Check if Tailwind v4 format is selected and if there are validation issues
  const isTailwindV4Selected = window.gitlabSettings?.exportFormat === 'tailwind-v4';
  const hasTailwindIssues =
    isTailwindV4Selected && tailwindV4Validation && !tailwindV4Validation.isValid;

  // Variables tab commit button
  const commitButton = document.getElementById('commit-repo-button');
  if (commitButton) {
    const shouldEnable = hasVariables && isConfigured;
    commitButton.disabled = !shouldEnable;

    if (!isConfigured) {
      commitButton.title = 'Configure GitLab settings in the Settings tab to enable commits';
    } else if (!hasVariables) {
      commitButton.title = 'No variables available to commit';
    } else if (hasTailwindIssues) {
      commitButton.title = 'Commit variables (Warning: Tailwind v4 namespace issues detected)';
    } else {
      commitButton.title = 'Commit variables to GitLab repository';
    }
  }

  // Export button
  const exportButton = document.getElementById('export-css-button');
  if (exportButton && hasVariables) {
    exportButton.disabled = false;
    if (hasTailwindIssues) {
      exportButton.title = 'Export variables (Warning: Tailwind v4 namespace issues detected)';
    } else {
      exportButton.title = 'Export variables to CSS file';
    }
  }

  // Components tab commit buttons
  const componentCommitButtons = document.querySelectorAll('.commit-all-variants-button');
  componentCommitButtons.forEach((button) => {
    button.disabled = !isConfigured;

    if (!isConfigured) {
      button.title = 'Configure GitLab settings in the Settings tab to enable commits';
    } else {
      button.title = 'Generate and commit component test to repository';
    }
  });
}

// ===== LOADING SYSTEM =====
let loadingProgress = 0;
const loadingSteps = [
  'Initializing plugin...',
  'Loading GitLab settings...',
  'Scanning document structure...',
  'Collecting variables and tokens...',
  'Processing components...',
  'Finalizing interface...',
];

function updatePluginLoadingProgress(step, percentage) {
  const statusElement = document.getElementById('plugin-loading-status');
  const progressBar = document.getElementById('plugin-loading-progress-bar');

  if (statusElement && progressBar) {
    statusElement.textContent = step;
    progressBar.style.width = percentage + '%';
  }
}

function hidePluginLoadingOverlay() {
  const overlay = document.getElementById('plugin-loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 500);
  }
}

function showContentLoading(containerId, message) {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
            <div class="content-loading">
              <div class="content-loading-spinner"></div>
              <div class="content-loading-text">${message}</div>
            </div>
          `;
  }
}

function showButtonLoading(button, loadingText) {
  if (button && !button.classList.contains('loading')) {
    // If this is a generate button and not for commit, mark as exported test
    if (
      (button.classList.contains('generate-all-variants-button') ||
        loadingText.includes('Generating')) &&
      !loadingText.includes('Committing')
    ) {
      try {
        localStorage.setItem('bridgy_last_export_test', 'true');
      } catch (e) {
        console.warn('localStorage access failed:', e);
      }
      if (typeof refreshUserGuide === 'function') refreshUserGuide();
    }

    button.dataset.originalHtml = button.innerHTML;
    button.textContent = loadingText;
    button.classList.add('loading');
    button.disabled = true;
  }
}

function hideButtonLoading(button) {
  if (button && button.classList.contains('loading')) {
    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    } else {
      // Fallback for legacy calls or if originalHtml missing
      button.textContent = button.dataset.originalText || button.textContent;
    }
    button.classList.remove('loading');
    button.disabled = false;
  }
}

function hideContentLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container && container.querySelector('.content-loading')) {
    // Remove loading state - content will be restored by calling functions
    container.innerHTML = '';
  }
}

// Initialize loading progress on page load
document.addEventListener('DOMContentLoaded', function () {
  console.log('🚀 DOM Content Loaded - Plugin UI starting!');
  console.log('Available elements:', {
    componentsContainer: !!document.getElementById('components-container'),
    variablesContainer: !!document.getElementById('variables-container'),
  });
  updatePluginLoadingProgress(loadingSteps[0], 10);

  // Initialize Search Listeners
  if (typeof setupQualitySearch === 'function') {
    setupQualitySearch();
  }

  // Initialize Quality Tab Actions
  const expandBtn = document.getElementById('expand-all-quality-btn');
  if (expandBtn) {
    expandBtn.onclick = function () {
      console.log('Expand All Quality clicked via ID');
      if (typeof window.expandAllQuality === 'function') {
        window.expandAllQuality();
      } else if (typeof expandAllQuality === 'function') {
        expandAllQuality();
      } else {
        console.error('expandAllQuality function not found');
      }
    };
  }

  const collapseBtn = document.getElementById('collapse-all-quality-btn');
  if (collapseBtn) {
    collapseBtn.onclick = function () {
      console.log('Collapse All Quality clicked via ID');
      if (typeof window.collapseAllQuality === 'function') {
        window.collapseAllQuality();
      } else if (typeof collapseAllQuality === 'function') {
        collapseAllQuality();
      } else {
        console.error('collapseAllQuality function not found');
      }
    };
  }

  // Initialize Search Features (Clear buttons etc.)
  initSearchFeatures();
});

// ===== SEARCH FEATURES =====
function initSearchFeatures() {
  const searches = [
    { inputId: 'variable-search', clearBtnId: 'clear-variable-search' },
    { inputId: 'quality-search', clearBtnId: 'clear-quality-search' },
    { inputId: 'stats-search', clearBtnId: 'clear-stats-search' }
  ];

  searches.forEach(({ inputId, clearBtnId }) => {
    const input = document.getElementById(inputId);
    const clearBtn = document.getElementById(clearBtnId);

    if (input && clearBtn) {
      // Input event listener to toggle button visibility
      input.addEventListener('input', function() {
        if (this.value && this.value.length > 0) {
          clearBtn.style.display = 'flex';
        } else {
          clearBtn.style.display = 'none';
        }
      });
      
      // Initialize state
      if (input.value && input.value.length > 0) {
        clearBtn.style.display = 'flex';
      } else {
        clearBtn.style.display = 'none';
      }
    }
  });
}

// ===== COMPONENT NAVIGATION =====
let lastNavigationTime = 0;
let lastNavigatedComponentId = null;

window.selectComponent = function (componentId) {
  console.log('Selecting component:', componentId);

  // Prevent duplicate navigation requests within 1 second
  const now = Date.now();
  if (componentId === lastNavigatedComponentId && now - lastNavigationTime < 1000) {
    console.log('Ignoring duplicate navigation request');
    return;
  }

  lastNavigationTime = now;
  lastNavigatedComponentId = componentId;

  parent.postMessage(
    {
      pluginMessage: {
        type: 'select-component',
        componentId: componentId,
      },
    },
    '*',
  );
};

// ===== REFRESH FUNCTIONALITY =====
// ===== REFRESH FUNCTIONALITY =====
window.refreshData = function () {
  console.log('Refresh triggered');
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.style.opacity = '0.6';
    
    // Animate the icon
    const icon = refreshBtn.querySelector('.material-symbols-outlined');
    if (icon) icon.style.animation = 'spin 1s linear infinite';
  }

  // Determine active tab
  const activeTabContent = document.querySelector('.tab-content.active');
  const activeTabId = activeTabContent ? activeTabContent.id : 'variables-content';

  console.log('Active tab for refresh:', activeTabId);

  // 1. STATS REFRESH
  if (activeTabId === 'stats-content') {
    if (typeof window.refreshStats === 'function') {
      const notification = showLoading('Refreshing Stats', 'Updating component usage data...');
      window.refreshStats(notification);
    } else {
      console.error('refreshStats function not found');
    }
    
    resetRefreshButton(refreshBtn, 1000);
    return;
  }

  // 2. QUALITY REFRESH
  if (activeTabId === 'quality-content') {
    console.log('[DEBUG] Quality Refresh: Triggering CHAINED refresh (Variables -> Analysis)');
    
    // Set flag so refresh-success handler knows to run analysis afterwards
    window.pendingQualityRefresh = true;
    
    // Reset scan performed flags to force re-evaluation
    window.qualityScanPerformed = false;
    
    // Send message to backend to collect fresh data FIRST
    parent.postMessage(
      {
        pluginMessage: {
          type: 'refresh-data',
        },
      },
      '*',
    );

    // Show notification
    window.currentRefreshNotification = showLoading('Analyzing', 'Syncing variables & running analysis...');
    
    // Re-enable button after a delay (safety net)
    resetRefreshButton(refreshBtn, 3000);
    return;
  }

  // 3. VARIABLES REFRESH (Default)
  console.log('Refreshing variables and components data...');
  
  // Reset Quality/Stats scan cache so next visit triggers a fresh scan
  window.qualityScanPerformed = false;
  window.statsScanPerformed = false;

  // Send message to backend to collect fresh data
  console.log('[DEBUG] refreshData sending refresh-data plugin message');
  parent.postMessage(
    {
      pluginMessage: {
        type: 'refresh-data',
      },
    },
    '*',
  );

  // Show notification
  window.currentRefreshNotification = showLoading('Refreshing', 'Syncing variables from Figma...');

  // Re-enable button after a delay
  resetRefreshButton(refreshBtn, 2000);
};

function resetRefreshButton(btn, delay) {
  if (!btn) return;
  setTimeout(() => {
    btn.disabled = false;
    btn.style.opacity = '1';
    const icon = btn.querySelector('.material-symbols-outlined');
    if (icon) icon.style.animation = 'none';
  }, delay);
}

// Stats specific refresh
window.refreshStats = function (notificationElement) {
  // Store notification reference if provided, or create new one if called directly
  if (notificationElement) {
    window.currentStatsNotification = notificationElement;
  } else {
    // If called directly (e.g. from toolbar button), create a notification
    window.currentStatsNotification = showLoading('Refreshing Stats', 'Updating component usage data...');
  }

  console.log('Refreshing stats...');
  const container = document.getElementById('stats-container');
  if (container) {
    container.innerHTML = `
      <div class="content-loading">
        <div class="plugin-loading-spinner"></div>
        <div class="content-loading-text">Refreshing usage data...</div>
      </div>
    `;
  }
  
  parent.postMessage({ pluginMessage: { type: 'get-component-usage' } }, '*');
};

window.filterStats = function(query) {
  if (!componentStatsData) return;
  
  const term = query.toLowerCase().trim();
  if (!term) {
    renderStats(componentStatsData);
    return;
  }
  
  // Filter parent components or those with matching children
  const filtered = componentStatsData.filter(item => {
    const parentMatch = item.name.toLowerCase().includes(term);
    const childrenMatch = item.instances.some(inst => 
      inst.name.toLowerCase().includes(term) || 
      inst.parentName.toLowerCase().includes(term)
    );
    return parentMatch || childrenMatch;
  });
  
  renderStats(componentStatsData, filtered);
};

window.toggleStatsSort = function(column) {
  if (statsSortState.column === column) {
    statsSortState.direction = statsSortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    statsSortState.column = column;
    statsSortState.direction = column === 'name' ? 'asc' : 'desc';
  }
  
  // Re-apply filter which triggers render with new sort
  const searchInput = document.getElementById('stats-search-input'); // Assuming ID, fallback to global filter
  const query = searchInput ? searchInput.value : '';
  window.filterStats(query);
};

// ===== FEEDBACK SYSTEM =====
window.dismissFeedback = function () {
  const feedbackSection = document.querySelector('.feedback-section');
  if (feedbackSection) {
    feedbackSection.style.opacity = '0';
    feedbackSection.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      feedbackSection.style.display = 'none';
    }, 300);

    // Persist dismissal
    parent.postMessage(
      {
        pluginMessage: {
          type: 'set-client-storage',
          key: 'feedback_dismissed',
          value: true,
        },
      },
      '*',
    );
  }
};

// ===== NOTIFICATION SYSTEM =====
function showNotification(type, title, message, duration) {
  duration = duration || 5000;
  const container = document.getElementById('notification-container');

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  let icon = type === 'success' ? '✓' : '✕';
  if (type === 'loading') icon = '<span class="material-symbols-outlined spin">sync</span>';

  // Check if message contains safe HTML (only allow <a> tags)
  const isHTMLMessage = message.includes('<a ') && message.includes('</a>');
  const safeMessage = isHTMLMessage
    ? SecurityUtils.sanitizeHTML(message)
    : SecurityUtils.escapeHTML(message);

  notification.innerHTML = SecurityUtils.sanitizeHTML(`
          <div class="notification-icon">${type === 'loading' ? icon : SecurityUtils.escapeHTML(icon)}</div>
          <div class="notification-content">
            <div class="notification-title">${SecurityUtils.escapeHTML(title)}</div>
            <div class="notification-message">${safeMessage}</div>
          </div>
          <button class="notification-close" onclick="closeNotification(this.parentElement)">×</button>
        `);

  container.appendChild(notification);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notification);
    }, duration);
  }

  return notification;
}

function showLoading(title, message) {
  return showNotification('loading', title, message, 0); // 0 = no auto-dismiss
}

function updateNotification(notificationElement, type, title, message, duration) {
  if (!notificationElement) return;

  // Update class
  notificationElement.className = `notification ${type}`;

  // Update icon
  let icon = 'ℹ'; // Default info
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'loading') icon = '<span class="material-symbols-outlined spin">sync</span>';

  // Sanitize content
  const isHTMLMessage = message.includes('<a ') && message.includes('</a>');
  const safeMessage = isHTMLMessage
    ? SecurityUtils.sanitizeHTML(message)
    : SecurityUtils.escapeHTML(message);

  // Update inner HTML logic (reuse structure)
  notificationElement.querySelector('.notification-icon').innerHTML = SecurityUtils.escapeHTML(icon);
  if (type === 'loading') {
      notificationElement.querySelector('.notification-icon').innerHTML = icon; // Allow HTML for spinner
  }
  
  notificationElement.querySelector('.notification-title').textContent = title;
  notificationElement.querySelector('.notification-message').innerHTML = safeMessage;

  // Handle auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      closeNotification(notificationElement);
    }, duration);
  }
  
  return notificationElement;
}

function showSuccess(title, message, duration) {
  duration = duration || 5000;
  return showNotification('success', title, message, duration);
}

function showError(title, message, duration) {
  duration = duration || 0; // 0 = no auto-dismiss
  return showNotification('error', title, message, duration);
}

function closeNotification(notification) {
  if (!notification) return;

  notification.classList.add('fade-out');
  setTimeout(() => {
    if (notification.parentElement) {
      notification.parentElement.removeChild(notification);
    }
  }, 300);
}

// Clear all notifications
function clearAllNotifications() {
  const container = document.getElementById('notification-container');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// In-Modal notification functions
function showModalNotification(modalId, type, title, message) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const footer = modal.querySelector('.modal-footer');
  if (!footer) return;

  // Remove existing notifications
  const existingNotification = modal.querySelector('.modal-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const icon = type === 'success' ? '✓' : '✕';

  // Check if message contains safe HTML (only allow <a> tags)
  const isHTMLMessage = message.includes('<a ') && message.includes('</a>');
  const safeMessage = isHTMLMessage
    ? SecurityUtils.sanitizeHTML(message)
    : SecurityUtils.escapeHTML(message);

  const notification = document.createElement('div');
  notification.className = `modal-notification ${type}`;
  notification.innerHTML = SecurityUtils.sanitizeHTML(`
          <div class="modal-notification-icon">${SecurityUtils.escapeHTML(icon)}</div>
          <div class="modal-notification-content">
            <div class="modal-notification-title">${SecurityUtils.escapeHTML(title)}</div>
            <div class="modal-notification-message">${safeMessage}</div>
          </div>
          <button class="modal-notification-close" onclick="this.parentElement.remove()">×</button>
        `);

  footer.parentNode.insertBefore(notification, footer);
  return notification;
}

function showModalSuccess(modalId, title, message) {
  return showModalNotification(modalId, 'success', title, message);
}

function showModalError(modalId, title, message) {
  return showModalNotification(modalId, 'error', title, message);
}

// Inline notification functions (same design as modal notifications)
function showInlineNotification(targetElement, type, title, message, duration) {
  if (!targetElement) return;

  duration = duration || 10000; // 10 seconds default

  // Remove any existing inline notification
  const existingNotification = targetElement.querySelector('.inline-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  const icon = type === 'success' ? '✓' : '✕';

  const notification = document.createElement('div');
  notification.className = `inline-notification ${type}`;
  notification.style.cssText = `
          margin: var(--space-4) 0;
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border-left: 4px solid ${type === 'success' ? 'var(--success-500)' : 'var(--error-500)'};
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          animation: slideInModal 0.3s ease-out;
          background: ${type === 'success' ? 'linear-gradient(135deg, var(--success-50) 0%, var(--neutral-0) 100%)' : 'linear-gradient(135deg, var(--error-50) 0%, var(--neutral-0) 100%)'};
        `;

  notification.innerHTML = SecurityUtils.sanitizeHTML(`
          <div style="
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: var(--text-base);
            margin-top: var(--space-1);
            background: ${type === 'success' ? 'var(--success-500)' : 'var(--error-500)'};
            color: var(--neutral-0);
          ">${SecurityUtils.escapeHTML(icon)}</div>
          <div style="flex: 1; min-width: 0;">
            <div style="
              font-weight: 600;
              margin-bottom: var(--space-2);
              font-size: var(--text-base);
              color: ${type === 'success' ? 'var(--success-700)' : 'var(--error-700)'};
            ">${SecurityUtils.escapeHTML(title)}</div>
            <div style="
              font-size: var(--text-sm);
              color: rgba(255, 255, 255, 0.85);
              line-height: 1.4;
              word-break: break-word;
            ">${SecurityUtils.escapeHTML(message)}</div>
          </div>
          <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: var(--text-xl);
            color: var(--neutral-400);
            cursor: pointer;
            padding: 0;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            flex-shrink: 0;
            transition: all 0.2s ease;
          ">×</button>
        `);

  targetElement.appendChild(notification);

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, duration);
  }

  return notification;
}

function showInlineSuccess(targetElement, title, message, duration) {
  return showInlineNotification(targetElement, 'success', title, message, duration);
}

function showInlineError(targetElement, title, message, duration) {
  return showInlineNotification(targetElement, 'error', title, message, duration);
}

// Plugin resize management
function resizePlugin(width, height) {
  // Dynamic resizing disabled to maintain consistent plugin size
  // parent.postMessage({
  //   pluginMessage: {
  //     type: 'resize-plugin',
  //     width: width,
  //     height: height
  //   }
  // }, '*');
}

// Dynamic resize based on content or tab - disabled
function resizeForCurrentContent() {
  // Auto-resize functionality disabled to keep consistent plugin size
  return;
}

// Repository link management
function updateRepositoryLink() {
  const repoButton = document.getElementById('repo-link-button');

  // Try unified settings first, then fall back to legacy GitLab settings
  let settings = window.gitSettings;
  if (!settings && window.gitlabSettings) {
    // Legacy fallback - treat as GitLab
    settings = {
      provider: 'gitlab',
      projectId: window.gitlabSettings.projectId,
      baseUrl: window.gitlabSettings.gitlabUrl,
      token: window.gitlabSettings.gitlabToken,
    };
  }

  if (!repoButton || !settings || !settings.projectId) {
    if (repoButton) {
      repoButton.style.display = 'none';
    }
    return;
  }

  // Show button with fallback URL immediately, don't wait for network validation
  repoButton.style.display = 'inline-flex';
  setFallbackRepositoryLink(settings, repoButton);

  // Optionally fetch project information in background (only if user has token)
  if (settings.token && settings.token.trim()) {
    if (settings.provider === 'gitlab') {
      fetchProjectInfo(settings.projectId, settings.token, true);
    }
    // Note: GitHub project info fetching could be added here if needed
  }
}

async function fetchProjectInfo(projectId, token, silent = false) {
  const repoButton = document.getElementById('repo-link-button');
  if (!repoButton) {
    console.error('Repository link button not found in DOM');
    return;
  }

  try {
    // Validate inputs
    if (!projectId || !token) {
      throw new Error('Project ID and token are required for fetching project information');
    }

    let apiUrl;
    let headers = { 'Content-Type': 'application/json' };
    let isGitHub = false;

    // Determine provider based on selected option or settings
    const providerSelect = document.getElementById('config-provider');
    const provider =
      window.gitSettings?.provider || (providerSelect ? providerSelect.value : 'gitlab');

    if (provider === 'github') {
      isGitHub = true;
      // GitHub API
      const baseUrl =
        window.gitSettings?.baseUrl ||
        document.getElementById('config-github-url')?.value ||
        'https://api.github.com';

      // Clean base URL - if it's github.com, use api.github.com
      let apiBase = baseUrl;
      if (baseUrl === 'https://github.com' || baseUrl === 'https://www.github.com' || !baseUrl) {
        apiBase = 'https://api.github.com';
      } else if (baseUrl.includes('/api/v3')) {
        // Enterprise URL already has api path
        apiBase = baseUrl;
      } else {
        // Initial attempt for enterprise without path
        apiBase = `${baseUrl}/api/v3`;
      }

      apiUrl = `${apiBase}/repos/${projectId}`;
      headers['Authorization'] = `token ${token}`; // GitHub format
      headers['Accept'] = 'application/vnd.github.v3+json';
    } else {
      // GitLab API
      const gitlabUrl = window.gitSettings?.baseUrl || window.gitlabSettings?.gitlabUrl;
      const baseUrl = buildGitLabApiUrl(gitlabUrl);
      apiUrl = `${baseUrl}/projects/${encodeURIComponent(projectId)}`;
      headers['PRIVATE-TOKEN'] = token; // GitLab format
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(apiUrl, {
      headers: headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const projectData = await response.json();

      if (isGitHub) {
        repoButton.href = projectData.html_url;
        repoButton.title = `Open GitHub Repository: ${projectData.full_name}`;
      } else {
        if (!projectData.web_url) {
          throw new Error('Invalid project data received from GitLab API');
        }
        const mergeRequestsUrl = `${projectData.web_url}/-/merge_requests`;
        repoButton.href = mergeRequestsUrl;
        repoButton.title = `Open Merge Requests for ${projectData.path_with_namespace || projectData.name || 'project'}`;
      }

      repoButton.style.opacity = '1';
      repoButton.style.pointerEvents = 'auto';
      // Store valid state visually if needed
    } else {
      // Handle specific HTTP errors
      let errorMessage = `API error: ${response.status} ${response.statusText}`;
      if (response.status === 401 || response.status === 403) {
        errorMessage = 'Authentication failed. Please check your token.';
      } else if (response.status === 404) {
        errorMessage = 'Project/Repository not found. Please check your ID.';
      }

      if (!silent) {
        console.warn(errorMessage);
      }
      const fallbackSettings = {
        provider: provider,
        projectId: projectId,
        baseUrl:
          window.gitSettings?.baseUrl ||
          (provider === 'gitlab' ? window.gitlabSettings?.gitlabUrl : ''),
      };
      setFallbackRepositoryLink(fallbackSettings, repoButton);
    }
  } catch (error) {
    if (!silent) {
      console.error('Error fetching project information:', error);

      // Show user-friendly error message only if not silent
      if (error.name === 'AbortError') {
        showError(
          'Connection Timeout',
          'Unable to connect to GitLab. Please check your connection.',
        );
      } else if (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      ) {
        showError(
          'Network Error',
          'Unable to connect to GitLab. Please check your internet connection.',
        );
      } else {
        showError(
          'GitLab Error',
          error.message || 'Unable to fetch project information from GitLab.',
        );
      }
    }

    // Always set fallback link so user can still access the project
    const fallbackSettings = {
      provider: 'gitlab',
      projectId: projectId,
      baseUrl: window.gitlabSettings?.gitlabUrl,
    };
    setFallbackRepositoryLink(fallbackSettings, repoButton);
  }
}

function setFallbackRepositoryLink(settings, repoButton) {
  try {
    if (!settings || !settings.projectId) {
      // Final fallback - disable button if we can't build URL
      repoButton.style.opacity = '0.5';
      repoButton.style.pointerEvents = 'none';
      repoButton.title = 'Unable to determine project URL';
      return;
    }

    const provider = settings.provider || 'gitlab'; // Default to GitLab for backward compatibility
    let fallbackUrl;
    let title;

    if (provider === 'github') {
      // GitHub repository URL
      const baseUrl = settings.baseUrl || 'https://github.com';
      fallbackUrl = `${baseUrl}/${settings.projectId}`;
      title = `Open GitHub Repository: ${settings.projectId}`;
    } else {
      // GitLab repository URL
      const webUrl = buildGitLabWebUrl(settings.baseUrl);
      if (webUrl && settings.projectId) {
        // If projectId looks like a namespace/project (contains slash), use it directly
        if (settings.projectId.includes('/')) {
          fallbackUrl = `${webUrl}/${encodeURIComponent(settings.projectId)}/-/merge_requests`;
          title = `Open GitLab Merge Requests for ${settings.projectId}`;
        } else {
          // For numeric project IDs, we can't generate a proper URL without API
          // So link to the project overview instead of merge requests
          fallbackUrl = `${webUrl}/projects/${encodeURIComponent(settings.projectId)}`;
          title = `Open GitLab Project ${settings.projectId} (configure namespace/project format for direct merge request access)`;
        }
      }
    }

    if (fallbackUrl) {
      repoButton.href = fallbackUrl;
      repoButton.style.opacity = '1';
      repoButton.style.pointerEvents = 'auto';
      repoButton.title = title;
    } else {
      // Final fallback - disable button if we can't build URL
      repoButton.style.opacity = '0.5';
      repoButton.style.pointerEvents = 'none';
      repoButton.title = 'Unable to determine project URL';
    }
  } catch (error) {
    console.error('Error setting fallback repository link:', error);
    // Final fallback - disable button completely
    repoButton.style.opacity = '0.5';
    repoButton.style.pointerEvents = 'none';
    repoButton.title = 'Repository link unavailable';
  }
}

window.saveUnitsSettings = function () {
  const collections = {};
  const groups = {};
  const dropdowns = document.querySelectorAll('.unit-dropdown');

  dropdowns.forEach((dropdown) => {
    const type = dropdown.dataset.type;
    const value = dropdown.value;

    if (value !== '') {
      if (type === 'collection') {
        const name = dropdown.dataset.name;
        collections[name] = value;
      } else if (type === 'group') {
        const collectionName = dropdown.dataset.collection;
        const groupName = dropdown.dataset.group;
        const key = `${collectionName}/${groupName}`;
        groups[key] = value;
      }
    }
  });

  parent.postMessage(
    {
      pluginMessage: {
        type: 'update-unit-settings',
        collections: collections,
        groups: groups,
      },
    },
    '*',
  );
};

window.resetUnitsSettings = function () {
  // Get current smart defaults to show in confirmation
  const defaultsInfo = [];
  const dropdowns = document.querySelectorAll('.unit-dropdown');

  dropdowns.forEach((dropdown) => {
    const type = dropdown.dataset.type;
    const parentRow = dropdown.closest('.unit-setting-row');
    const label = parentRow?.querySelector('.unit-setting-label')?.textContent;
    const defaultLabel = parentRow?.querySelector('.default-unit-label strong')?.textContent;

    if (label && defaultLabel) {
      defaultsInfo.push(`• ${label}: ${defaultLabel}`);
    }
  });

  const message = `Are you sure you want to reset all unit settings to smart defaults?\n\nThis will apply these defaults:\n${defaultsInfo.slice(0, 5).join('\n')}${defaultsInfo.length > 5 ? `\n... and ${defaultsInfo.length - 5} more` : ''}`;

  if (confirm(message)) {
    dropdowns.forEach((dropdown) => {
      dropdown.value = '';
    });

    window.saveUnitsSettings();
  }
};

// Flags for caching
window.qualityScanPerformed = false;
window.statsScanPerformed = false;

// Main tab switching logic
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

    tab.classList.add('active');
    const tabContent = document.getElementById(tab.dataset.tab + '-content');
    if (tabContent) {
      tabContent.classList.add('active');
    }

    // Auto-scan when Quality tab is opened - OPTIMIZED: Scan Once
    if (tab.dataset.tab === 'quality') {
      if (!window.qualityScanPerformed) {
        console.log('First visit to Quality tab - Triggering initial scan...');

        const container = document.getElementById('token-coverage-results'); // FIXED: Correct ID
        if (container) {
          // Manual spinner injection to ensure it shows immediately
          container.innerHTML = `
                  <div class="content-loading">
                    <div class="plugin-loading-spinner"></div>
                    <div class="content-loading-text">Analyzing design for issues...</div>
                  </div>
                 `;
        }

        // Defer actual scan slightly to allow UI paint
        setTimeout(() => {
          analyzeTokenCoverage('SMART_SCAN');
          window.qualityScanPerformed = true; // Mark as scanned
        }, 50);
      }
    }

    // Auto-scan for Stats tab
    if (tab.dataset.tab === 'stats') {
      if (!window.statsScanPerformed) {
        console.log('First visit to Stats tab - Triggering scan...');
        const container = document.getElementById('stats-container');
        if (container) {
          container.innerHTML = `
                      <div class="content-loading">
                        <div class="plugin-loading-spinner"></div>
                        <div class="content-loading-text">Counting component usage...</div>
                      </div>
                     `;
        }

        setTimeout(() => {
          parent.postMessage({ pluginMessage: { type: 'get-component-usage' } }, '*');
          window.statsScanPerformed = true;
        }, 50);
      }
    }
  });
});

// Sub-tab switching logic removed - now using modals for Import and Units

let variablesData = [];
let stylesData = {};
let variableReferences = {}; // Map of ID -> Name for aliases
let componentsData = [];
let componentUsageData = {}; // ID -> Count
let currentCSSData = null;
let componentSetsData = [];
let selectionData = null;
let tailwindV4Validation = null;
let analysisScope = 'PAGE';
let componentStatsData = []; // Store stats for filtering
let statsSortState = { column: 'count', direction: 'desc' }; // Default sort state

const AVAILABLE_UNITS = [
  '',
  'px',
  'rem',
  'em',
  '%',
  'vw',
  'vh',
  'vmin',
  'vmax',
  'pt',
  'pc',
  'in',
  'cm',
  'mm',
  'ex',
  'ch',
  'fr',
  'none',
];

function findVariableNameById(variableId) {
  if (variableReferences && variableReferences[variableId]) {
    return variableReferences[variableId];
  }
  
  // Fallback: check local variables
  for (const collection of variablesData) {
    for (const variable of collection.variables) {
      if (variable.id === variableId) {
        return variable.name;
      }
    }
  }
  return null;
}

function scrollToVariable(variableName) {
  const element = document.getElementById(`var-${variableName}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
}

function scrollToGroup(collection, group) {
  const element = document.getElementById(`group-${collection}-${group}`);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
}

function scrollToGroupById(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
    element.style.border = '2px solid #8b5cf6';
    setTimeout(() => {
      element.style.backgroundColor = '';
      element.style.border = '';
    }, 2000);
  }
}

// Auto-open user guide if no GitLab settings are loaded after 2 seconds
setTimeout(() => {
  if (!window.gitlabSettingsLoaded) {
    checkAndShowUserGuide();
  }
}, 2000);

// Listen for messages from the plugin
window.onmessage = (event) => {
  try {
    // Add proper null/undefined checking to prevent errors
    if (!event || !event.data || !event.data.pluginMessage) {
      return; // Ignore invalid messages
    }

    const message = event.data.pluginMessage;

    // Validate message structure
    if (!message || typeof message !== 'object' || !message.type) {
      console.warn('Received invalid message structure from plugin:', message);
      return;
    }

    const exportButton = document.getElementById('export-css-button');
    const commitButton = document.getElementById('commit-repo-button');

    // Add safety checks for DOM elements
    if (!exportButton) {
      console.warn('Export button not found in DOM during message handling');
    }
    if (!commitButton) {
      console.warn('Commit button not found in DOM during message handling');
    }

    if (message.type === 'gitlab-settings-loaded') {
      updatePluginLoadingProgress(loadingSteps[1], 25);
      window.gitlabSettings = message.settings;
      window.gitlabSettingsLoaded = true;
      loadConfigurationTab();
      updateRepositoryLink();
      updateCommitButtonStates();
      checkAndShowUserGuide();
    } else if (message.type === 'git-settings-loaded') {
      updatePluginLoadingProgress(loadingSteps[1], 25);
      window.gitSettings = message.settings;
      window.gitlabSettings = message.settings; // Backward compatibility
      window.gitlabSettingsLoaded = true;
      loadConfigurationTab();
      updateRepositoryLink();
      updateCommitButtonStates();
      checkAndShowUserGuide();
    } else if (message.type === 'gitlab-settings-saved' || message.type === 'git-settings-saved') {
      // Update local settings with new metadata
      if (window.gitlabSettings) {
        if (message.savedAt) window.gitlabSettings.savedAt = message.savedAt;
        if (message.savedBy) window.gitlabSettings.savedBy = message.savedBy;

        // Update UI display immediately
        if (message.savedAt && message.savedBy) {
          try {
            const savedDate = new Date(message.savedAt);
            const formattedDate =
              savedDate.toLocaleDateString() + ' ' + savedDate.toLocaleTimeString();

            // Use SecurityUtils if available, otherwise fallback
            const escapeHTML =
              window.SecurityUtils && window.SecurityUtils.escapeHTML
                ? window.SecurityUtils.escapeHTML
                : (str) =>
                    str.replace(
                      /[&<>'"]/g,
                      (tag) =>
                        ({
                          '&': '&amp;',
                          '<': '&lt;',
                          '>': '&gt;',
                          "'": '&#39;',
                          '"': '&quot;',
                        })[tag],
                    );

            const sanitizeHTML =
              window.SecurityUtils && window.SecurityUtils.sanitizeHTML
                ? window.SecurityUtils.sanitizeHTML
                : (html) => html;

            const savedInfoText = `Last updated by: <strong>${escapeHTML(message.savedBy)}</strong> on ${escapeHTML(formattedDate)}`;

            const securityNoteCompact = document.getElementById('security-note-compact');
            const securityNoteFull = document.getElementById('security-note-full');

            if (securityNoteCompact) {
              securityNoteCompact.innerHTML = sanitizeHTML(savedInfoText);
              securityNoteCompact.style.display = 'block';
            }

            if (securityNoteFull) {
              const savedInfoDiv = securityNoteFull.querySelector('.saved-info');
              if (savedInfoDiv) {
                savedInfoDiv.innerHTML = sanitizeHTML(savedInfoText);
              }
            }
          } catch (e) {
            console.error('Error updating saved info:', e);
          }
        }
      }

      // Update repository link when settings are successfully saved
      updateRepositoryLink();
    } else if (message.type === 'repositories-loaded') {
      displayRepositories(message.repositories);
    } else if (message.type === 'repositories-error') {
      const container = document.getElementById('repo-list-container');
      container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ef4444;">
              <div style="font-weight: 500; margin-bottom: 8px;">Error loading repositories</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${message.error}</div>
            </div>
          `;
    } else if (message.type === 'branches-loaded') {
      displayBranches(message.branches);
    } else if (message.type === 'branches-error') {
      const container = document.getElementById('branch-list-container');
      container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #ef4444;">
              <div style="font-weight: 500; margin-bottom: 8px;">Error loading branches</div>
              <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6);">${message.error}</div>
            </div>
          `;
    } else if (message.type === 'oauth-status') {
      displayOAuthStatus(message.status);
    } else if (message.type === 'oauth-url') {
      // Open OAuth URL in new window
      window.open(message.url, '_blank', 'width=600,height=700,scrollbars=yes,resizable=yes');
      showNotification('info', 'OAuth', 'Complete authentication in the popup window', 5000);
    } else if (message.type === 'oauth-callback') {
      handleOAuthCallback(message.data);
    } else if (message.type === 'document-data') {
      updatePluginLoadingProgress(loadingSteps[3], 75);
      variablesData = message.variablesData;
      stylesData = message.stylesData;
      variableReferences = message.variableReferences || {};
      componentsData = message.componentsData;

      // Request Tailwind v4 validation
      parent.postMessage(
        {
          pluginMessage: {
            type: 'validate-tailwind-v4',
          },
        },
        '*',
      );
      window.globalVariablesData = message.variablesData;
      
      try {
        console.log('[DEBUG] document-data handler calling renderVariables');
        renderVariables(message.variablesData, stylesData);
        console.log('[DEBUG] document-data handler renderVariables completed');
      } catch (err) {
        console.error('[DEBUG] document-data renderVariables crashed:', err);
      }
      // renderComponents(componentsData); // Components tab replaced by Stats

      // Handle feedback dismissal state
      if (message.feedbackDismissed) {
        const feedbackSection = document.querySelector('.feedback-section');
        if (feedbackSection) {
          feedbackSection.style.display = 'none';
        }
      }

      // Enable the export button if there are variables OR styles
      const hasVariables =
        variablesData && variablesData.some((collection) => collection.variables.length > 0);
      const hasStyles =
        stylesData &&
        ((stylesData.textStyles && stylesData.textStyles.length > 0) ||
          (stylesData.paintStyles && stylesData.paintStyles.length > 0) ||
          (stylesData.effectStyles && stylesData.effectStyles.length > 0) ||
          (stylesData.gridStyles && stylesData.gridStyles.length > 0));

      if (hasVariables || hasStyles) {
        exportButton.disabled = false;
      } else {
        exportButton.disabled = true;
      }

      // Update commit button states based on both variables and settings
      updateCommitButtonStates();

      // Complete loading logic modified:
      // Instead of hiding overlay here, we trigger quality analysis and wait for it
      updatePluginLoadingProgress('Analyzing token coverage...', 90);
      
      // Initial Quality Analysis (Auto-Run)
      console.log('[DEBUG] Triggering INITIAL_LOAD quality analysis');
      if (typeof analyzeTokenCoverage === 'function') {
        setTimeout(() => {
             analyzeTokenCoverage('INITIAL_LOAD');
        }, 100);
      } else {
        // Fallback if function missing
        console.warn('analyzeTokenCoverage missing, hiding overlay manually');
        hidePluginLoadingOverlay();
      }

      // Auto-resize disabled to maintain consistent plugin size
    } else if (message.type === 'component-stats-data') {
      console.log('UI: Received component stats data', message.stats);
      componentStatsData = message.stats; // Store locally
      const statsContainer = document.getElementById('stats-container');

      if (statsContainer) {
        // statsContainer.innerHTML = ''; // renderStats clears it or overwrites it? renderStats does innerHTML = ...
        if (typeof renderStats === 'function') {
          renderStats(message.stats);
        } else {
          console.error('renderStats function not found!');
          statsContainer.innerHTML =
            '<div style="padding: 20px; text-align: center; color: var(--error-500);">Error: Stats renderer not initialized.</div>';
        }
      }
    } else if (message.type === 'component-stats-error') {
      console.error('UI: Component stats error', message.error);
      const statsContainer = document.getElementById('stats-container');
      if (statsContainer) {
        statsContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--error-500);">Error: ${message.error}</div>`;
      }
    } else if (message.type === 'document-data-error') {
      console.error('Error loading components:', message.error);

      // Show error to user
      const componentsContainer = document.getElementById('components-container');
      if (componentsContainer) {
        componentsContainer.innerHTML = `
              <div style="color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px;">
                <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">Error Loading Components</h3>
                <p style="margin: 0; font-size: 13px;">${message.error}</p>
                <p style="margin: 8px 0 0 0; font-size: 12px; opacity: 0.8;">Check the developer console for more details.</p>
              </div>
            `;
      }

      // Still try to render variables if they exist
      if (message.variablesData) {
        variablesData = message.variablesData;
        renderVariables(variablesData, stylesData);
      }
      // setTimeout(() => {
      //   resizeForCurrentContent();
      // }, 200);

      // Enable the export button only if there are variables
      if (variablesData && variablesData.some((collection) => collection.variables.length > 0)) {
        exportButton.disabled = false;
        commitButton.disabled = false;
      } else {
        exportButton.disabled = true;
        commitButton.disabled = true;
      }

      // Check if user guide should auto-open (fallback for users without any settings)
      setTimeout(() => {
        checkAndShowUserGuide();
      }, 1000);
    } else if (message.type === 'variable-deleted') {
      // Handle successful variable deletion
      console.log(`Variable deleted successfully: ${message.variableName}`);
      showNotification(
        'success',
        'Variable Deleted',
        `Variable "${message.variableName}" deleted successfully`,
      );
    } else if (message.type === 'style-deleted') {
      // Handle successful style deletion
      console.log(`Style deleted successfully: ${message.styleName}`);
      showNotification(
        'success',
        'Style Deleted',
        `Style "${message.styleName}" deleted successfully`,
      );
    } else if (message.type === 'delete-error') {
      // Handle variable deletion error
      console.error('Error deleting variable:', message.error);
      showNotification('error', 'Delete Failed', `Failed to delete variable: ${message.error}`);

      // Re-enable the delete button and restore its original state
      const buttons = document.querySelectorAll('.delete-variable-btn[disabled]');
      buttons.forEach((button) => {
        button.disabled = false;
        button.style.cursor = 'pointer';
        button.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5zM11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H2.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 5.883 16h4.234a2 2 0 0 0 1.992-1.84l.853-10.66h.538a.5.5 0 0 0 0-1H11zm1.958 1H3.042l.846 10.58a1 1 0 0 0 .996.92h4.234a1 1 0 0 0 .996-.92L11.958 3.5zM6.5 5.5a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6zm2 0a.5.5 0 0 1 1 0v6a.5.5 0 0 1-1 0v-6z"/>
              </svg>
            `;
      });
    } else if (message.type === 'css-export') {
      // Store the CSS data for later use
      currentCSSData = message.cssData;
      // Only trigger download if this was an explicit export request
      if (message.shouldDownload) {
        const format = message.exportFormat || 'css';
        downloadCSS(message.cssData, format);

        // Cleanup loading states after successful export
        const exportButton = document.getElementById('export-css-button');
        if (exportButton) {
          hideButtonLoading(exportButton);
        }
        renderVariables(variablesData, stylesData); // Restore variables display
      }
    } else if (message.type === 'angular-export-data') {
      // Trigger ZIP download with component data based on selected language
      const language = message.language || 'angular';
      downloadComponentsZip(message.files, language);
    } else if (message.type === 'test-generated') {
      // Handle test generation result
      if (message.forCommit) {
        // For commit, send the commit-component-test message
        if (!window.gitlabSettings) {
          showError(
            'Configuration Required',
            'Please configure your GitLab settings in the Settings tab first.',
          );

          // Reset button state
          const buttons = document.querySelectorAll('button.loading');
          buttons.forEach((button) => {
            if (button.textContent === 'Committing...') {
              button.classList.remove('loading');
              button.textContent = button.dataset.originalText || 'Commit Test';
              button.disabled = false;
            }
          });

          // Open settings modal
          openSettingsModal();
          return;
        }

        // Get commit message
        const commitMessage = `feat: add component test for ${message.componentName}`;

        // Send to plugin for commit
        parent.postMessage(
          {
            pluginMessage: {
              type: 'commit-component-test',
              provider: window.gitlabSettings.provider || 'gitlab',
              gitlabUrl: window.gitlabSettings.gitlabUrl,
              baseUrl: window.gitlabSettings.baseUrl,
              projectId: window.gitlabSettings.projectId,
              token: window.gitlabSettings.token || window.gitlabSettings.gitlabToken,
              gitlabToken: window.gitlabSettings.token || window.gitlabSettings.gitlabToken,
              commitMessage: commitMessage,
              componentName: message.componentName,
              testContent: message.testContent,
              testFilePath:
                window.gitlabSettings.testFilePath || 'components/{componentName}.spec.ts',
              branchName: window.gitlabSettings.testBranchName || 'feature/component-tests',
            },
          },
          '*',
        );
      } else {
        downloadTest(message.componentName, message.testContent);
        const buttons = document.querySelectorAll('button.loading');
        buttons.forEach((button) => {
          if (
            button.textContent === 'Generating test...' ||
            button.textContent === 'Generating...'
          ) {
            button.classList.remove('loading');
            // Clear timeout if it exists
            if (button.dataset.timeoutId) {
              clearTimeout(parseInt(button.dataset.timeoutId));
              delete button.dataset.timeoutId;
            }
            // Restore the original button text
            button.textContent = button.dataset.originalText || 'Generate Test';
            button.disabled = false;

            const successMessage = button.parentElement.nextElementSibling;
            if (successMessage && successMessage.classList.contains('test-success-message')) {
              successMessage.textContent = 'Test generated successfully!';
              successMessage.style.display = 'block';
              setTimeout(() => {
                successMessage.style.display = 'none';
              }, 3000);
            }
          }
        });
      }
    } else if (message.type === 'collections-loaded') {
      // Handle existing collections data
      const collections = message.collections || [];
      console.log('Received existing collections:', collections);
      // Helper function to update dropdown
      if (typeof updateExistingCollectionsDropdown === 'function') {
        updateExistingCollectionsDropdown(collections);
      } else {
        console.warn('updateExistingCollectionsDropdown function not found');
      }
    } else if (message.type === 'commit-progress') {
      const progressBar = document.getElementById('commit-progress');
      const progressStatus = document.getElementById('progress-status');

      if (progressBar && progressStatus) {
        progressBar.style.width = `${message.progress}%`;
        if (message.message) {
          progressStatus.textContent = message.message;
        }
      }
    } else if (message.type === 'variable-created') {
      console.log('Received variable-created:', message.variable);
      const { name, id, key } = message.variable;
      const issueId = message.context && message.context.issueId;

      // Ensure pending state is set for post-analysis view restoration
      if (issueId) {
        window.pendingFixIssueId = issueId;
      }

      // Re-analyze coverage to reflect changes and update UI using the new variable
      // This will eventually trigger displayTokenCoverageResults which consumes pendingFixIssueId
      analyzeTokenCoverage();

      // Notify user
      if (typeof showNotification === 'function') {
        showNotification(
          'success',
          'Variable Created',
          `Variable '${name}' created.`,
        );
      }
    } else if (message.type === 'variable-group-renamed') {
      console.log('Variable group renamed successfully:', message);
      
      // Show success notification
      if (typeof showNotification === 'function') {
        showNotification(
          'success',
          'Variables Renamed',
          `${message.renamedCount} variable${message.renamedCount !== 1 ? 's' : ''} renamed from "${message.oldGroupName}" to "${message.newGroupName}".`,
        );
      }
      
      // Hide the fixed issue with CSS (no DOM removal, no re-rendering needed)
      if (window.tailwindProcessingItemId) {
        const itemCard = document.getElementById(`${window.tailwindProcessingItemId}-card`);
        if (itemCard) {
          // Smoothly fade out and hide with CSS
          itemCard.style.transition = 'opacity 0.3s ease-out, max-height 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out';
          itemCard.style.opacity = '0';
          itemCard.style.maxHeight = '0';
          itemCard.style.marginBottom = '0';
          itemCard.style.paddingTop = '0';
          itemCard.style.paddingBottom = '0';
          itemCard.style.overflow = 'hidden';

          // After animation completes, fully hide with display: none
          setTimeout(() => {
            itemCard.style.display = 'none';

                  // Update count badge for the collection
                  if (window.tailwindActiveCollectionId) {
                    const collection = document.getElementById(window.tailwindActiveCollectionId);
                    if (collection) {
                      // Update the count badge - simply decrement by 1
                      const countBadge = collection.querySelector('.subgroup-stats');
                      if (countBadge) {
                        const currentCount = parseInt(countBadge.textContent) || 0;
                        const newCount = Math.max(0, currentCount - 1);
                        countBadge.textContent = newCount.toString();

                        // Add a subtle animation to draw attention to the update
                        countBadge.style.transition = 'transform 0.2s ease-out, background-color 0.2s ease-out';
                        countBadge.style.transform = 'scale(1.2)';
                        countBadge.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';

                        setTimeout(() => {
                          countBadge.style.transform = 'scale(1)';
                          countBadge.style.backgroundColor = '';
                        }, 200);

                        // If count reaches 0, show a success message
                        if (newCount === 0) {
                          const contentDiv = collection.querySelector('.collection-content > div');
                          if (contentDiv && !contentDiv.querySelector('.tailwind-success-message')) {
                            // Add success message
                            const successMessage = document.createElement('div');
                            successMessage.className = 'tailwind-success-message';
                            successMessage.style.cssText = `
                              text-align: center; 
                              padding: 24px; 
                              color: rgba(34, 197, 94, 0.9); 
                              font-size: 13px;
                              background: rgba(34, 197, 94, 0.1);
                              border: 1px solid rgba(34, 197, 94, 0.2);
                              border-radius: 8px;
                              margin: 8px 0;
                              animation: fadeIn 0.3s ease-in;
                            `;
                            successMessage.innerHTML = `
                              <span class="material-symbols-outlined" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.8;">check_circle</span>
                              <strong>All issues resolved!</strong>
                              <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Great job! All variables in this section are now Tailwind v4 compatible.</div>
                            `;
                            contentDiv.appendChild(successMessage);
                          }
                        }
                      }

                // Ensure the collection stays open
                const content = collection.querySelector('.collection-content');
                const header = collection.querySelector('.collection-header');
                if (content && content.classList.contains('collapsed')) {
                  content.classList.remove('collapsed');
                }
                if (header && header.classList.contains('collapsed')) {
                  header.classList.remove('collapsed');
                }
              }
            }

            // Restore scroll position
            if (window.tailwindScrollPosition !== undefined) {
              window.scrollTo(0, window.tailwindScrollPosition);
              delete window.tailwindScrollPosition;
            }

            // Clean up saved state and allow re-rendering again
            delete window.tailwindProcessingItemId;
            delete window.tailwindActiveCollectionId;
            delete window.tailwindFixInProgress;
            delete window.tailwindFixedGroupName;
          }, 300);
        } else {
          // If item card not found, clean up immediately
          delete window.tailwindProcessingItemId;
          delete window.tailwindActiveCollectionId;
          delete window.tailwindFixInProgress;
          delete window.tailwindFixedGroupName;
          if (window.tailwindScrollPosition !== undefined) {
            delete window.tailwindScrollPosition;
          }
        }
      }

      // The validation will be automatically refreshed via the tailwind-v4-validation message
      // which is sent by the plugin after renaming
    } else if (message.type === 'variable-group-rename-error') {
      console.error('Error renaming variable group:', message.error);

      if (typeof showNotification === 'function') {
        showNotification(
          'error',
          'Rename Failed',
          message.error || 'Failed to rename variable group',
        );
      }

      // Restore scroll position
      if (window.tailwindScrollPosition !== undefined) {
        window.scrollTo(0, window.tailwindScrollPosition);
        delete window.tailwindScrollPosition;
      }

      // Re-enable buttons if the item still exists
      if (window.tailwindProcessingItemId) {
        const addPrefixBtn = document.getElementById(`${window.tailwindProcessingItemId}-add-prefix-btn`);
        const replaceBtn = document.getElementById(`${window.tailwindProcessingItemId}-replace-btn`);

        if (addPrefixBtn) {
          addPrefixBtn.disabled = false;
          addPrefixBtn.style.opacity = '1';
          addPrefixBtn.style.pointerEvents = 'auto';
          addPrefixBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">add</span> Add Prefix';
        }

        if (replaceBtn) {
          replaceBtn.disabled = false;
          replaceBtn.style.opacity = '1';
          replaceBtn.style.pointerEvents = 'auto';
          replaceBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">find_replace</span> Replace';
        }
      }

      // Clean up saved state and allow re-rendering again
      delete window.tailwindProcessingItemId;
      delete window.tailwindActiveCollectionId;
      delete window.tailwindFixInProgress;
      delete window.tailwindFixedGroupName;
    } else if (message.type === 'error') {
      console.error('Plugin Error:', message.message);
      showError('Plugin Error', message.message);
      const buttons = document.querySelectorAll('button.loading');
      buttons.forEach((button) => {
        button.classList.remove('loading');
        button.textContent =
          button.dataset.originalText ||
          (button.classList.contains('generate-all-variants-button')
            ? 'Generate Test for All Variants'
            : 'Generate Test');
        button.disabled = false;
      });

      exportButton.disabled = true;

      // Cleanup any content loading states on error
      renderVariables(variablesData, stylesData);
      renderComponents(componentsData);
    } else if (message.type === 'component-selected') {
      // Only show notification if page was switched or if user explicitly requested
      if (message.switchedPage) {
        showNotification(
          'success',
          'Navigation',
          `Navigated to "${message.componentName}" on page "${message.pageName}"`,
          3000,
        );
      } else {
        // Silent navigation on same page - user can see it happen
        console.log('Navigated to component:', message.componentName);
      }
    } else if (message.type === 'component-selection-error') {
      // Show error with option to navigate to the page
      const errorMessage = message.message || 'Failed to select component';
      const pageName = message.pageName || 'unknown page';

      showError(
        'Navigation Failed',
        `Could not navigate to component on "${pageName}". ${errorMessage}`,
        8000,
      );
    } else if (message.type === 'commit-success') {
      if (message.mergeRequestUrl) {
        // Show in-modal notification with merge request link
        const messageWithLink =
          message.message +
          ` <a href="${message.mergeRequestUrl}" target="_blank">View Merge Request →</a>`;
        showModalSuccess('gitlab-modal', 'Merge Request Created!', messageWithLink);

        // Update button to close
        const commitButton = document.getElementById('commit-submit-button');
        commitButton.textContent = 'Close';
        commitButton.classList.remove('loading');
        commitButton.disabled = false;
        commitButton.onclick = closeGitLabModal;
      } else {
        showSuccess(
          'Commit Successful',
          message.message || 'Successfully committed to GitLab repository!',
        );
        closeGitLabModal();
        resetCommitButton();
      }
    } else if (message.type === 'commit-error') {
      // Generate appropriate help message based on error type
      let helpMessage = '';
      if (message.errorType === 'auth') {
        helpMessage = `This is a permission issue. Please check your config.`
      } else if (message.errorType === 'network') {
        // Add link to GitLab project for network errors
        // Add link to project for network errors
        const provider = window.gitlabSettings?.provider || 'gitlab';
        const providerName = provider === 'github' ? 'GitHub' : 'GitLab';
        const baseUrl =
          window.gitlabSettings?.baseUrl ||
          (provider === 'github' ? 'https://github.com' : 'https://gitlab.com');
        const projectUrl = window.gitlabSettings?.projectId
          ? provider === 'github'
            ? `${baseUrl}/${window.gitlabSettings.projectId}`
            : `${baseUrl}/${window.gitlabSettings.projectId}`
          : baseUrl;
        helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test ${providerName} connection in browser →</a>`;
      } else if (message.errorType === 'api') {
        if (message.statusCode === 404) {
          helpMessage =
            'Please verify your project ID is correct and you have access to this project.';
        } else if (message.statusCode === 429) {
          helpMessage = 'Too many requests. Please wait a few minutes before trying again.';
        } else {
          helpMessage = 'Please check your GitLab settings and try again.';
        }
      } else {
        helpMessage = 'Please check your credentials and settings, then try again.';
      }

      showModalError(
        'gitlab-modal',
        'Commit Failed',
        `${message.error} ${helpMessage}`,
      );
      resetCommitButton();
    } else if (message.type === 'test-commit-success') {
      // Handle successful component test commit
      // Find any loading commit buttons and update them
      const buttons = document.querySelectorAll('button.loading');
      let buttonFound = false;

      buttons.forEach((button) => {
        if (button.textContent === 'Committing test...' || button.textContent === 'Committing...') {
          button.classList.remove('loading');
          // Clear timeout if it exists
          if (button.dataset.timeoutId) {
            clearTimeout(parseInt(button.dataset.timeoutId));
            delete button.dataset.timeoutId;
          }
          button.textContent = button.dataset.originalText || 'Commit Test';
          button.disabled = false;
          buttonFound = true;

          // Show success notification matching variable commit style
          let notificationMessage = 'Component test committed successfully!';
          if (message.mergeRequestUrl) {
            notificationMessage += `
              <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                <a href="${message.mergeRequestUrl}" target="_blank" class="btn-secondary" style="font-size: 11px; padding: 4px 8px; height: auto; text-decoration: none;">View Merge Request</a>
                <button onclick="copyToClipboard('${message.mergeRequestUrl}')" class="btn-secondary" style="font-size: 11px; padding: 4px 8px; height: auto; display: flex; align-items: center; gap: 4px;">
                  <span class="material-symbols-outlined" style="font-size: 14px;">content_copy</span> Copy Link
                </button>
              </div>`;
          }

          const title = message.mergeRequestUrl ? 'Merge Request Created!' : 'Commit Successful';
          showSuccess(title, notificationMessage, 10000); // Show for 10 seconds
        }
      });

      // If no specific button was found, show global notification (fallback)
      if (!buttonFound) {
        const notificationMessage = message.mergeRequestUrl
          ? `Component test committed successfully! <a href="${message.mergeRequestUrl}" target="_blank" style="color: var(--success-600); text-decoration: underline;">View Merge Request</a>`
          : 'Component test committed successfully!';

        const title = message.mergeRequestUrl ? 'Merge Request Created!' : 'Commit Successful';
        showSuccess(title, notificationMessage, 8000); // Show for 8 seconds
      }
    } else if (message.type === 'test-commit-error') {
      // Handle component test commit errors
      const buttons = document.querySelectorAll('button.loading');
      let buttonFound = false;

      buttons.forEach((button) => {
        if (button.textContent === 'Committing...') {
          button.classList.remove('loading');
          button.textContent = button.dataset.originalText || 'Commit Test';
          button.disabled = false;
          buttonFound = true;

          // Find the container where to show the notification
          const componentContainer = button.closest('.component-item') || button.parentElement;

          // Generate appropriate help message based on error type
          let helpMessage = '';
          if (message.errorType === 'auth') {
            helpMessage = `This is a permission issue. Please check your config`
          } else if (message.errorType === 'network') {
            // Add link to GitLab project for network errors
            // Add link to project for network errors
            const provider = window.gitlabSettings?.provider || 'gitlab';
            const providerName = provider === 'github' ? 'GitHub' : 'GitLab';
            const baseUrl =
              window.gitlabSettings?.baseUrl ||
              (provider === 'github' ? 'https://github.com' : 'https://gitlab.com');
            const projectUrl = window.gitlabSettings?.projectId
              ? provider === 'github'
                ? `${baseUrl}/${window.gitlabSettings.projectId}`
                : `${baseUrl}/${window.gitlabSettings.projectId}`
              : baseUrl;
            helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test ${providerName} connection →</a>`;
          } else if (message.errorType === 'api') {
            if (message.statusCode === 404) {
              helpMessage = 'Please verify your project ID and permissions.';
            } else if (message.statusCode === 429) {
              helpMessage = 'Rate limit exceeded. Please try again later.';
            } else {
              helpMessage = 'Please check your GitLab settings.';
            }
          } else {
            helpMessage = 'Please check your credentials and try again.';
          }

          // Show the error with component context
          const errorMessage = `${message.error}<br><small>${helpMessage}</small>`;
          showInlineError(componentContainer, 'Commit Failed', errorMessage, 15000);
        }
      });

      // If no specific button was found, show global error notification (fallback)
      if (!buttonFound) {
        let helpMessage = '';
        if (message.errorType === 'auth') {
          helpMessage = `This is a permission issue. Please check your config`;
        } else if (message.errorType === 'network') {
          // Add link to GitLab project for network errors
          // Add link to project for network errors
          const provider = window.gitlabSettings?.provider || 'gitlab';
          const providerName = provider === 'github' ? 'GitHub' : 'GitLab';
          const baseUrl =
            window.gitlabSettings?.baseUrl ||
            (provider === 'github' ? 'https://github.com' : 'https://gitlab.com');
          const projectUrl = window.gitlabSettings?.projectId
            ? provider === 'github'
              ? `${baseUrl}/${window.gitlabSettings.projectId}`
              : `${baseUrl}/${window.gitlabSettings.projectId}`
            : baseUrl;
          helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test ${providerName} connection →</a>`;
        } else if (message.errorType === 'api') {
          helpMessage = 'Please check your GitLab settings and try again.';
        } else {
          helpMessage = 'Please check your credentials and settings, then try again.';
        }

        showError('Test Commit Failed', `${message.error} ${helpMessage}`);
      }
    } else if (message.type === 'unit-settings-data') {
      // Handle units settings data
      unitsData = message.data;
      renderUnitsSettings(unitsData);
    } else if (message.type === 'unit-settings-updated') {
      // Handle successful unit settings update
      if (message.success) {
        // Show subtle success feedback by temporarily changing button text
        const saveButton = document.getElementById('save-units-button');
        const saveButtonModal = document.getElementById('save-units-button-modal');

        [saveButton, saveButtonModal].forEach((button) => {
          if (button) {
            const originalText = button.textContent;
            button.textContent = 'Saved!';
            button.style.backgroundColor = '#28a745';
            button.disabled = true;

            // Reset button appearance after 2 seconds
            setTimeout(() => {
              button.textContent = originalText;
              button.style.backgroundColor = '';
            }, 2000);
          }
        });
      }
    } else if (message.type === 'tailwind-v4-validation') {
      // Store Tailwind v4 validation result
      tailwindV4Validation = message.validation;
      window.tailwindV4Validation = message.validation;

      // Skip re-rendering if a Tailwind fix is in progress to prevent layout shift
      if (window.tailwindFixInProgress) {
        console.log('[DEBUG] Skipping re-render during Tailwind fix to prevent layout shift');
        // Just update the validation data, don't re-render
        // The CSS hiding animation will complete smoothly
      } else {
        // Normal flow: re-render variables to show validation issues
        if (variablesData && variablesData.length > 0) {
          try {
            console.log('[DEBUG] tailwind-v4-validation handler calling renderVariables');
            renderVariables(variablesData, stylesData);
            console.log('[DEBUG] tailwind-v4-validation handler renderVariables completed');
          } catch (err) {
            console.error('[DEBUG] tailwind-v4-validation renderVariables crashed:', err);
          }
        }
      }

      // Update button states based on validation
      updateCommitButtonStates();
    } else if (message.type === 'component-styles-loaded') {
      // Handle loaded component styles
      const componentId = message.componentId;
      const styles = message.styles;
      const textElements = message.textElements;

      // Find the component element that was loading
      const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);

      if (componentElement) {
        // Get component name from the element (look for the component name in the meta div)
        const metaDiv = componentElement.parentElement.querySelector('.component-meta');
        const componentName = metaDiv
          ? metaDiv.querySelector('.component-name')?.textContent || 'Component'
          : 'Component';

        // Format the loaded styles and update the content
        const formattedStyles = formatStyles(styles, textElements, componentName);

        // Update the content with the loaded styles, keeping the close button
        componentElement.innerHTML =
          formattedStyles +
          '<button class="close-button" onclick="event.stopPropagation(); toggleStyles(this.parentElement)">Close</button>';

        // Clean up the loading data
        delete componentElement.dataset.originalContent;
      }
    } else if (message.type === 'refresh-complete') {
      // Handle successful refresh
      // Deprecated in favor of refresh-success
    } else if (message.type === 'variable-group-renamed') {
      // Group rename success (Tailwind Prefix fix)
      if (message.success) {
        showSuccess('Fix Applied', `Renamed to "${message.newGroupName}"`, 3000);
        
        // Trigger a full refresh to update the UI
        // We set a flag to trigger quality analysis AFTER variables are refreshed
        console.log('[DEBUG] variable-group-renamed triggering refreshData');
        window.pendingQualityRefresh = true;
        window.refreshData();
        
        // Restore expansion state logic
        // We will store the fact that we just did a tailwind fix
        // The renderTailwindReadinessSection function should check this
        window.justFixedTailwind = true;
      }
    } else if (message.type === 'variable-group-rename-error') {
      showNotification('error', 'Rename Failed', message.error || 'Failed to rename variable group');
    } else if (message.type === 'refresh-error') {
      // Handle refresh error
      showNotification('error', 'Refresh Failed', message.error || 'Failed to refresh data');
      console.error('Data refresh failed:', message.error);
    } else if (message.type === 'refresh-success') {
      // General data refresh success
      if (window.currentRefreshNotification) {
        updateNotification(window.currentRefreshNotification, 'success', 'Refreshed', 'Variables and styles synced successfully', 3000);
        window.currentRefreshNotification = null;
      } else {
        showSuccess('Refreshed', 'Variables and styles synced successfully', 3000);
      }
      
      // Update data references
      if (message.variables) window.variablesData = message.variables;
      if (message.styles) window.stylesData = message.styles;
      if (message.components) window.componentsData = message.components;
      
      // Render variables (and styles are called within)
      try {
        console.log('[DEBUG] Calling renderVariables from refresh-success');
        renderVariables(window.variablesData);
        console.log('[DEBUG] renderVariables completed');
      } catch (err) {
        console.error('[DEBUG] renderVariables crashed:', err);
      }

      // Check for pending quality refresh (e.g. after Tailwind fix)
      console.log('[DEBUG] Checking pendingQualityRefresh:', window.pendingQualityRefresh);
      if (window.pendingQualityRefresh) {
        console.log('Triggering pending quality analysis...');
        window.pendingQualityRefresh = false;
        if (typeof analyzeTokenCoverage === 'function') {
           // We pass a dummy notification object or handle silent mode if needed
           // But 'SMART_SCAN' usually shows its own notification or uses the one passed.
           // Let's use silent mode or just a standard run. Standard run is better for feedback.
           console.log('[DEBUG] Calling analyzeTokenCoverage with SMART_SCAN');
           analyzeTokenCoverage('SMART_SCAN');
        }
      }
      
    } else if (message.type === 'token-coverage-result') {
      console.log('UI received token-coverage-result', message);

      // Skip re-rendering if a token fix is in progress to prevent layout shift
      if (window.tokenFixInProgress) {
        console.log('[DEBUG] Skipping token coverage re-render during fix to prevent layout shift');
        // Just store the result, don't re-render
        window.lastTokenCoverageResult = message.result;
      } else {
        // Quality Analysis success - normal flow
        displayTokenCoverageResults(message.result);
      }

      if (window.currentAnalysisNotification) {
        updateNotification(window.currentAnalysisNotification, 'success', 'Analysis Complete', 'Token coverage analysis finished', 3000);
        window.currentAnalysisNotification = null;
      } else if (!message.silent) {
        // Only show toast if not silent (INITIAL_LOAD might be silent or handled differently? Let's show it for clarity or suppress?)
        // The user said "only show the plugin when it's loaded". 
        // We'll update loading progress to 100% and hide overlay here.
      }

      // Finalize Loading (for Initial Load flow)
      updatePluginLoadingProgress('Ready!', 100);
      hidePluginLoadingOverlay();
      
    } else if (message.type === 'component-stats-data') {
      // Stats refresh success
      window.componentStatsData = message.stats;
      renderStats(message.stats);
      
      if (window.currentStatsNotification) {
        updateNotification(window.currentStatsNotification, 'success', 'Stats Refreshed', 'Component usage data updated', 3000);
        window.currentStatsNotification = null;
      } else {
         showSuccess('Refreshed', 'Component usage data updated', 3000);
      }
      

    } else if (message.type === 'token-coverage-error') {
      // Handle token coverage analysis error
      const resultsContainer = document.getElementById('token-coverage-results');
      resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #ef4444; margin-bottom: 16px;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <h3 style="color: #ef4444; margin-bottom: 8px;">Analysis Failed</h3>
              <p style="color: rgba(255, 255, 255, 0.8);">${message.error || 'Failed to analyze token coverage'}</p>
            </div>
          `;
      showNotification(
        message.error || 'Failed to analyze token coverage',
      );
      
      // Ensure overlay is hidden even on error
      hidePluginLoadingOverlay();
    } else if (message.type === 'apply-token-result') {
      // Handle token application result

      // Check for inline feedback target
      if (window.lastApplyButtonId) {
        const btn = document.getElementById(window.lastApplyButtonId);
        if (btn) {
          btn.classList.remove('btn-loading');

          if (message.success) {
            btn.classList.add('btn-success');
            btn.innerHTML =
              '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Applied';

            // Hide the fixed issue with CSS and update counts
            if (window.tokenFixIssueId) {
              const issueCard = document.getElementById(`${window.tokenFixIssueId}-card`);
              if (issueCard) {
                // Smoothly fade out and hide with CSS
                issueCard.style.transition = 'opacity 0.3s ease-out, max-height 0.3s ease-out, margin 0.3s ease-out, padding 0.3s ease-out';
                issueCard.style.opacity = '0';
                issueCard.style.maxHeight = '0';
                issueCard.style.marginBottom = '0';
                issueCard.style.paddingTop = '0';
                issueCard.style.paddingBottom = '0';
                issueCard.style.overflow = 'hidden';

                // After animation completes, fully hide with display: none
                setTimeout(() => {
                  issueCard.style.display = 'none';

                  // Update count badge for the collection
                  if (window.tokenFixActiveCollectionId) {
                    const collection = document.getElementById(window.tokenFixActiveCollectionId);
                    if (collection) {
                      // Update the count badge - simply decrement by 1
                      const countBadge = collection.querySelector('.subgroup-stats');
                      if (countBadge) {
                        const currentCount = parseInt(countBadge.textContent) || 0;
                        const newCount = Math.max(0, currentCount - 1);
                        countBadge.textContent = newCount.toString();

                        // Add a subtle animation to draw attention to the update
                        countBadge.style.transition = 'transform 0.2s ease-out, background-color 0.2s ease-out';
                        countBadge.style.transform = 'scale(1.2)';
                        countBadge.style.backgroundColor = 'rgba(139, 92, 246, 0.3)';

                        setTimeout(() => {
                          countBadge.style.transform = 'scale(1)';
                          countBadge.style.backgroundColor = '';
                        }, 200);

                        // If count reaches 0, show a success message
                        if (newCount === 0) {
                          const contentDiv = collection.querySelector('.collection-content > div');
                          if (contentDiv && !contentDiv.querySelector('.token-coverage-success-message')) {
                            // Add success message
                            const successMessage = document.createElement('div');
                            successMessage.className = 'token-coverage-success-message';
                            successMessage.style.cssText = `
                              text-align: center; 
                              padding: 24px; 
                              color: rgba(34, 197, 94, 0.9); 
                              font-size: 13px;
                              background: rgba(34, 197, 94, 0.1);
                              border: 1px solid rgba(34, 197, 94, 0.2);
                              border-radius: 8px;
                              margin: 8px 0;
                              animation: fadeIn 0.3s ease-in;
                            `;
                            successMessage.innerHTML = `
                              <span class="material-symbols-outlined" style="font-size: 32px; display: block; margin-bottom: 8px; opacity: 0.8;">check_circle</span>
                              <strong>All issues in this category resolved!</strong>
                              <div style="font-size: 11px; margin-top: 4px; opacity: 0.7;">Excellent work! All elements in this category now use design tokens.</div>
                            `;
                            contentDiv.appendChild(successMessage);
                          }
                        }
                      }

                      // Ensure the collection stays open
                      const content = collection.querySelector('.collection-content');
                      const header = collection.querySelector('.collection-header');
                      if (content && content.classList.contains('collapsed')) {
                        content.classList.remove('collapsed');
                      }
                      if (header && header.classList.contains('collapsed')) {
                        header.classList.remove('collapsed');
                      }
                    }
                  }

                  // Restore scroll position
                  if (window.tokenFixScrollPosition !== undefined) {
                    window.scrollTo(0, window.tokenFixScrollPosition);
                    delete window.tokenFixScrollPosition;
                  }

                  // Clean up saved state and allow re-rendering again
                  delete window.tokenFixIssueId;
                  delete window.tokenFixActiveCollectionId;
                  delete window.tokenFixInProgress;
                }, 300);
              } else {
                // If card not found, clean up immediately
                delete window.tokenFixIssueId;
                delete window.tokenFixActiveCollectionId;
                delete window.tokenFixInProgress;
                if (window.tokenFixScrollPosition !== undefined) {
                  delete window.tokenFixScrollPosition;
                }
              }
            }

          } else {
            // Revert on error so user can see it failed, but let the global notification show the error details
            btn.disabled = false;
            btn.innerHTML =
              '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Apply';
            updateApplyButtonState(window.lastApplyButtonId.replace('-apply-btn', ''));

            // Clean up token fix state on error
            if (window.tokenFixScrollPosition !== undefined) {
              window.scrollTo(0, window.tokenFixScrollPosition);
              delete window.tokenFixScrollPosition;
            }
            delete window.tokenFixIssueId;
            delete window.tokenFixActiveCollectionId;
            delete window.tokenFixInProgress;
          }

          // Reset after delay
          setTimeout(() => {
            // Only reset visual state, logic state is handled by updateApplyButtonState
            if (message.success && btn.classList.contains('btn-success')) {
              btn.classList.remove('btn-success');
              btn.innerHTML =
                '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Apply';
              updateApplyButtonState(window.lastApplyButtonId.replace('-apply-btn', ''));
            }
            window.lastApplyButtonId = null;
          }, 2000);
        }
      }

      // Show global notification only if NOT handled inline OR if it's an error
      const handledInline = !!window.lastApplyButtonId && message.success;

      if (!handledInline) {
        if (message.success) {
          showNotification(
            'success',
            'Token Applied',
            `Successfully applied token to ${message.successCount} node${message.successCount !== 1 ? 's' : ''}`,
          );
        } else {
          showNotification('error', 'Application Failed', message.error || 'Failed to apply token');
        }
      }

      if (window.qualityTabRendered) {
        // If quality tab is active, analyzeTokenCoverage should have been called
        // We can just re-render if needed, but analyzeTokenCoverage usually handles the UI update
        // via callbacks or internal logic. 
        // We principally just need to ensure the "Processing" state is cleared.
        if (window.currentRefreshNotification) {
             window.currentRefreshNotification.update('success', 'Analysis Complete', 'Quality analysis finished.');
             // Clear the reference so we don't hold onto it
             window.currentRefreshNotification = null;
        }
      }
    }
  } catch (error) {
    console.error('Error handling plugin message:', error);

    // Try to provide user feedback if possible
    try {
      if (error.message && error.message.includes('DOM')) {
        showError('Interface Error', 'A user interface error occurred. Please refresh the plugin.');
      } else if (error.message && error.message.includes('settings')) {
        showError('Settings Error', 'Error processing settings. Please try again.');
      } else {
        showError('Plugin Error', 'An unexpected error occurred. Please try again.');
      }
    } catch (secondaryError) {
      console.error('Failed to show error message:', secondaryError);
    }
  }
};

// Render variables
      function renderVariables(data, stylesData = null) {
        console.log('[DEBUG] renderVariables ENTER', { 
            dataLength: data ? data.length : 0, 
            hasStylesData: !!stylesData,
            stylesKeys: stylesData ? Object.keys(stylesData) : [] 
        });

        if (stylesData) {
             console.log('DEBUG: stylesData counts:', {
                 paint: stylesData.paintStyles ? stylesData.paintStyles.length : 0,
                 text: stylesData.textStyles ? stylesData.textStyles.length : 0,
                 effect: stylesData.effectStyles ? stylesData.effectStyles.length : 0,
                 grid: stylesData.gridStyles ? stylesData.gridStyles.length : 0
             });
        }
        
        // Calculate totals for summary
        let totalVariables = 0;
        const collectionsCount = data.length;
        data.forEach(collection => {
          totalVariables += collection.variables ? collection.variables.length : 0;
        });
        
        // Update summary
        if (typeof updateVariablesSummary === 'function') {
          updateVariablesSummary(totalVariables, collectionsCount);
        } else if (window.updateVariablesSummary) {
          window.updateVariablesSummary(totalVariables, collectionsCount);
        }

        const container = document.getElementById("variables-container");
        
        // Check if both variables and styles are empty
        const hasStyles = stylesData && (
             (stylesData.textStyles && stylesData.textStyles.length > 0) || 
             (stylesData.paintStyles && stylesData.paintStyles.length > 0) || 
             (stylesData.effectStyles && stylesData.effectStyles.length > 0) || 
             (stylesData.gridStyles && stylesData.gridStyles.length > 0)
        );

        if (data.length === 0 && !hasStyles) {
          container.innerHTML = '';
          const noItemsDiv = document.createElement('div');
          noItemsDiv.className = 'no-items';
          noItemsDiv.textContent = 'No variables or styles found.';
          container.appendChild(noItemsDiv);
          return;
        }

        let html = "";

        // ... existing validation logic ...
        // Analyze data for validation issues
        const validationIssues = [];
        let tailwindIssues = [];

        // Render each collection as it comes from Figma
        data.forEach((collection) => {
          if (collection.variables.length > 0) {
            const groupedVars = new Map();
            const standaloneVars = [];

            collection.variables.forEach((variable) => {
              const pathMatch = variable.name.match(/^([^\/]+)\//);
              if (pathMatch) {
                const prefix = pathMatch[1];
                if (!groupedVars.has(prefix)) {
                  groupedVars.set(prefix, []);
                }
                groupedVars.get(prefix).push(variable);
              } else {
                standaloneVars.push(variable);
              }
            });

            groupedVars.forEach((variables, prefix) => {
              let hasDirectValues = false;
              let hasLinks = false;

              variables.forEach((variable) => {
                variable.valuesByMode.forEach((mode) => {
                  if (
                    typeof mode.value === "object" &&
                    mode.value.type === "VARIABLE_ALIAS"
                  ) {
                    hasLinks = true;
                  } else {
                    hasDirectValues = true;
                  }
                });
              });

              if (hasDirectValues && hasLinks) {
                const sanitizedId = `group-${collection.name.replace(
                  /[^a-zA-Z0-9]/g,
                  "-"
                )}-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;
                validationIssues.push({
                  collection: collection.name,
                  group: prefix,
                  displayName: prefix
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  issue: "mixed-values-and-links",
                  sanitizedId: sanitizedId,
                });
              }
            });
          }
        });

        // Add Tailwind v4 validation issues if present
        const tailwindValidation = window.tailwindV4Validation;
        if (tailwindValidation && !tailwindValidation.isValid && tailwindValidation.invalidGroups.length > 0) {
             // ... (keep existing tailwind logic)
             tailwindIssues = [];
             
             // Build list of invalid groups with their sanitized IDs
             data.forEach(collection => {
                  const groupedVars = new Map();
                  
                  collection.variables.forEach(variable => {
                       const pathMatch = variable.name.match(/^([^\/]+)\//);
                       if (pathMatch) {
                            const prefix = pathMatch[1];
                            if(!groupedVars.has(prefix)) {
                                 groupedVars.set(prefix, []);
                            }
                            groupedVars.get(prefix).push(variable);
                       }
                  });
                  
                  groupedVars.forEach((variables, prefix) => {
                       // Check if this group is invalid for Tailwind v4
                       if (tailwindValidation.invalidGroups.indexOf(prefix) !== -1) {
                            const sanitizedId = `group-${collection.name.replace(/[^a-zA-Z0-9]/g, "-")}-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;
                            tailwindIssues.push({
                                 collection: collection.name,
                                 group: prefix,
                                 displayName: prefix.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
                                 sanitizedId: sanitizedId
                            });
                       }
                  });
             });
        }
        
        // Render warnings to separate container
        const warningContainer = document.getElementById('variables-warning-container');
        if (warningContainer) {
             warningContainer.innerHTML = '';
             let warningHtml = '';
             
             // Show a single combined warning if there are any issues
             const hasAnyIssues = tailwindIssues.length > 0 || validationIssues.length > 0;
             if (hasAnyIssues) {
                  warningHtml += `
                    <div class="validation-alert validation-alert-warning">
                      <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 24px;">⚠️</span>
                        <div>
                          <strong style="color: #ff9800; display: block; margin-bottom: 4px;">Warnings detected</strong>
                          <small style="color: rgba(255, 255, 255, 0.8);">Some issues were found with your variables</small>
                        </div>
                      </div>
                      <button type="button" onclick="switchToQualityTab()" class="validation-alert-button validation-alert-button-warning">
                        Go to warnings
                      </button>
                    </div>
                  `;
             }
             
             warningContainer.innerHTML = warningHtml;
        }

        // Render each collection as it comes from Figma
        data.forEach((collection) => {
          if (collection.variables.length > 0) {
            const groupedVars = new Map();
            const standaloneVars = [];

            collection.variables.forEach((variable) => {
              const pathMatch = variable.name.match(/^([^\/]+)\//);
              if (pathMatch) {
                const prefix = pathMatch[1];
                if (!groupedVars.has(prefix)) {
                  groupedVars.set(prefix, []);
                }
                groupedVars.get(prefix).push(variable);
              } else {
                standaloneVars.push(variable);
              }
            });

            // Build collection HTML
            const collectionId = `collection-${collection.name.replace(
              /[^a-zA-Z0-9]/g,
              "-"
            )}`;
            html += `
              <div class="variable-collection" id="${collectionId}" data-collection-id="${collectionId}">
                <div class="collection-header" onclick="toggleCollection('${collectionId}')">
                  <div class="collection-info">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
                    <h3 class="collection-name-title">${collection.name}</h3>
                    <span class="subgroup-stats">${collection.variables.length}</span>
                  </div>
                  <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
                </div>
                <div class="collection-content" id="${collectionId}-content">
            `;

            // Render standalone variables as "Ungrouped" group
            if (standaloneVars.length > 0) {
              const ungroupedName = "Ungrouped";
              const groupId = `group-${collectionId}-ungrouped`;
              
              html += `
                <div class="variable-subgroup">
                  <div class="subgroup-header collapsed" onclick="toggleSubgroup('${groupId}')">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">dataset</span>
                      <span class="subgroup-title">${ungroupedName}</span>
                      <span class="subgroup-stats">${standaloneVars.length}</span>
                    </div>
                    <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                  </div>
                  <div class="subgroup-content collapsed" id="${groupId}-content">
              `;
              
              const varsWithCollection = standaloneVars.map((v) => ({
                ...v,
                collection: collection.name,
              }));
              html += renderVariableTable(varsWithCollection);
              html += `
                  </div>
                </div>
              `;
            }

            // Render grouped variables
            groupedVars.forEach((variables, prefix) => {
              const displayName = prefix
                .replace(/-/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase());

              // Check if this group has mixed values and links
              let hasDirectValues = false;
              let hasLinks = false;

              variables.forEach((variable) => {
                variable.valuesByMode.forEach((mode) => {
                  if (
                    typeof mode.value === "object" &&
                    mode.value.type === "VARIABLE_ALIAS"
                  ) {
                    hasLinks = true;
                  } else {
                    hasDirectValues = true;
                  }
                });
              });

              const hasMixedValues = hasDirectValues && hasLinks;
              
              const isTailwindEnabled = (window.gitSettings?.exportFormat === 'tailwind-v4' || window.gitlabSettings?.exportFormat === 'tailwind-v4');
              console.log('[DEBUG] isTailwindEnabled:', isTailwindEnabled, 'Format:', (window.gitSettings?.exportFormat || window.gitlabSettings?.exportFormat));
              const tailwindValidationLocal = window.tailwindV4Validation;
              const isTailwindInvalid = isTailwindEnabled && tailwindValidationLocal && !tailwindValidationLocal.isValid && tailwindValidationLocal.invalidGroups.indexOf(prefix) !== -1;
              const isTailwindValid = isTailwindEnabled && tailwindValidationLocal && tailwindValidationLocal.groups.some(g => g.name === prefix && g.isValid);
              
              const groupId = `${collectionId}-group-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;

              html += `
                <div class="variable-subgroup ${
                  hasMixedValues || isTailwindInvalid ? "has-validation-issues" : ""
                }" id="${groupId}">
                  <div class="subgroup-header" onclick="toggleSubgroup('${groupId}')">
                    <div class="subgroup-title">
                      ${displayName}
                      <span class="subgroup-stats">${variables.length}</span>
                      ${isTailwindValid ? `<span class="tailwind-icon" title="Valid Tailwind v4 namespace">
                              <svg viewBox="0 0 54 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z" fill="#38bdf8"/>
                              </svg>
                             </span>` : ""}
                      ${hasMixedValues ? '<span class="material-symbols-outlined mixed-value-icon" title="Mixed values and links">alt_route</span>' : ""}
                      ${isTailwindInvalid ? `<span class="tailwind-icon" title="Invalid Tailwind namespace">
                              <svg viewBox="0 0 54 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M27 0C19.8 0 15.3 3.6 13.5 10.8C16.2 7.2 19.35 5.85 22.95 6.75C25.004 7.263 26.472 8.754 28.097 10.403C30.744 13.09 33.808 16.2 40.5 16.2C47.7 16.2 52.2 12.6 54 5.4C51.3 9 48.15 10.35 44.55 9.45C42.496 8.937 41.028 7.446 39.403 5.797C36.756 3.11 33.692 0 27 0ZM13.5 16.2C6.3 16.2 1.8 19.8 0 27C2.7 23.4 5.85 22.05 9.45 22.95C11.504 23.464 12.972 24.954 14.597 26.603C17.244 29.29 20.308 32.4 27 32.4C34.2 32.4 38.7 28.8 40.5 21.6C37.8 25.2 34.65 26.55 31.05 25.65C28.996 25.137 27.528 23.646 25.903 21.997C23.256 19.31 20.192 16.2 13.5 16.2Z" fill="#f87171"/>
                              </svg>
                             </span>` : ""}                    </div>
                    <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                  </div>
                  <div class="subgroup-content collapsed" id="${groupId}-content">
              `;
              const varsWithCollection = variables.map((v) => ({
                ...v,
                collection: collection.name,
              }));
              html += renderVariableTable(varsWithCollection);
              html += `
                  </div>
                </div>
              `;
            });

            html += `
                </div>
              </div>
            `;
          }
        });
        
        // Render Styles as a Virtual Collection
        if (stylesData) {
            // Check if we have any styles
             const hasStyles = (stylesData.textStyles?.length > 0) || 
                              (stylesData.paintStyles?.length > 0) || 
                              (stylesData.effectStyles?.length > 0) || 
                              (stylesData.gridStyles?.length > 0);
            
            if (hasStyles) {
                // Calculate detailed stats
                const totalStyles = (stylesData.textStyles?.length || 0) + 
                                  (stylesData.paintStyles?.length || 0) + 
                                  (stylesData.effectStyles?.length || 0) + 
                                  (stylesData.gridStyles?.length || 0);
                
                let categories = 0;
                if (stylesData.paintStyles?.length) categories++;
                if (stylesData.textStyles?.length) categories++;
                if (stylesData.effectStyles?.length) categories++;
                if (stylesData.gridStyles?.length) categories++;

                html += `
                    <div class="tab-header" style="margin-top: 32px; margin-bottom: 16px;">
                        <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px;">
                            <h2 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
                                <span class="material-symbols-outlined" style="font-size: 22px; color: #c4b5fd;">style</span>
                                Styles
                            </h2>
                            <div class="header-summary">
                                <div class="summary-badge" data-tooltip="Total Styles">
                                   <span class="material-symbols-outlined">style</span>
                                   <span>${totalStyles} Styles</span>
                                </div>
                                <div class="summary-badge" data-tooltip="Categories">
                                   <span class="material-symbols-outlined">category</span>
                                   <span>${categories} Categories</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                html += renderStylesAsCollection(stylesData);
            }
        }

        console.log('[DEBUG] renderVariables updating DOM innerHTML (length: ' + html.length + ')');
        container.innerHTML = SecurityUtils.sanitizeHTML(html);
        console.log('[DEBUG] renderVariables DOM update complete');
        
        // Collapse all by default
        if (window.collapseAllVariables) {
          console.log('[DEBUG] calling collapseAllVariables from renderVariables');
          window.collapseAllVariables();
          console.log('[DEBUG] collapseAllVariables returned');
        }
      }

function renderStylesAsCollection(data) {
  if (
    !data ||
    (data.textStyles.length === 0 &&
      data.paintStyles.length === 0 &&
      data.effectStyles.length === 0 &&
      (!data.gridStyles || data.gridStyles.length === 0))
  ) {
    return '';
  }

  let html = '';

  // Render groups directly as "collections" (visually)
  if (data.paintStyles && data.paintStyles.length > 0) {
    html += renderStyleGroup('Color', data.paintStyles, 'paint', 'collection-figma-styles-paint');
  }
  if (data.textStyles && data.textStyles.length > 0) {
    html += renderStyleGroup('Text', data.textStyles, 'text', 'collection-figma-styles-text');
  }
  if (data.effectStyles && data.effectStyles.length > 0) {
    html += renderStyleGroup(
      'Effect',
      data.effectStyles,
      'effect',
      'collection-figma-styles-effect',
    );
  }
  if (data.gridStyles && data.gridStyles.length > 0) {
    html += renderStyleGroup(
      'Layout guide',
      data.gridStyles,
      'grid',
      'collection-figma-styles-grid',
    );
  }

  return html;
}

function formatDecimal(num) {
  if (typeof num !== 'number') return num;
  // Round to max 2 decimal places and remove trailing zeros
  return parseFloat(num.toFixed(2));
}

function renderStyleGroup(name, styles, type, collectionId) {
  const count = styles.length;
  const icon =
    type === 'text'
      ? 'text_fields'
      : type === 'paint'
        ? 'colorize'
        : type === 'effect'
          ? 'bolt'
          : 'grid_on';

  // Group styles by prefix
  const groups = {};
  const ungrouped = [];

  styles.forEach((style) => {
    const parts = style.name.split('/');
    if (parts.length > 1) {
      const groupName = parts[0].trim();
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(style);
    } else {
      ungrouped.push(style);
    }
  });

  const sortedGroupNames = Object.keys(groups).sort();

  // Render as a Variable Collection (top level look)
  let html = `
            <div class="variable-collection" id="${collectionId}" data-collection-id="${collectionId}">
                <div class="collection-header" onclick="toggleCollection('${collectionId}')">
                    <div class="collection-info">
                        <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">${icon}</span>
                        <h3 class="collection-name-title">${name}</h3>
                        <span class="subgroup-stats">${count}</span>
                    </div>
                    <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
                </div>
                <div class="collection-content" id="${collectionId}-content">
        `;

  // Render Subgroups
  sortedGroupNames.forEach((groupName) => {
    const groupStyles = groups[groupName];
    const groupId = `${collectionId}-group-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;

    // Render as variable-subgroup
    html += `
                <div class="variable-subgroup">
                    <div class="subgroup-header collapsed" onclick="toggleSubgroup('${groupId}')">
                        <div style="display: flex; align-items: center; gap: 8px;">
                             <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
                            <span class="subgroup-title">${groupName}</span>
                            <span class="subgroup-stats">${groupStyles.length}</span>
                        </div>
                        <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                    </div>
                    <div class="subgroup-content collapsed" id="${groupId}-content">
                        ${renderStyleTable(groupStyles, type, true)} 
                    </div>
                </div>
            `;
  });

  // Render Ungrouped
  if (ungrouped.length > 0) {
    if (sortedGroupNames.length > 0) {
      const groupId = `${collectionId}-ungrouped`;
      html += `
                    <div class="variable-subgroup">
                        <div class="subgroup-header collapsed" onclick="toggleSubgroup('${groupId}')">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">dataset</span>
                                <span class="subgroup-title">Ungrouped</span>
                                <span class="subgroup-stats">${ungrouped.length}</span>
                            </div>
                            <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                        </div>
                        <div class="subgroup-content collapsed" id="${groupId}-content">
                            ${renderStyleTable(ungrouped, type, true)}
                        </div>
                    </div>
                `;
    } else {
      html += renderStyleTable(ungrouped, type, false);
    }
  }

  html += `
                </div>
            </div>
        `;
  return html;
}

function renderStyleTable(styles, type, isGrouped = false) {
  let html = `
                <div class="variable-list">
                <div class="unified-list-header variable-header">
                    <div class="variable-cell">Name</div>
                    <div class="variable-cell">Type</div>
                    <div class="variable-cell">Values</div>
                    <div class="variable-cell" style="text-align: center;">Usage</div>
                    <div class="variable-cell"></div>
                </div>
        `;

  styles.forEach((style) => {
    const sanitizedId = style.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();

    // Calculate display name (strip group prefix if grouped)
    let displayName = style.name;
    if (isGrouped) {
      const slashIndex = displayName.indexOf('/');
      if (slashIndex !== -1) {
        displayName = displayName.substring(slashIndex + 1);
      }
    }

    let valuePreview = '';

    if (type === 'paint') {
      const paint = style.paints[0];
      if (paint) {
        if (paint.type === 'SOLID') {
          const { r, g, b } = paint.color;
          const a = paint.opacity !== undefined ? paint.opacity : 1;

          let validationWarning = '';
          // Check if bound
          const isBound =
            style.boundVariables &&
            style.boundVariables['paints'] &&
            style.boundVariables['paints'][0];
          if (!isBound) {
            const matchingVar = findVariableMatchingValue(paint.color, 'paint');
            if (matchingVar) {
              validationWarning = `
                                 <span class="material-symbols-outlined" 
                                       style="font-size: 14px; color: #fbbf24; cursor: help; margin-left: 6px;" 
                                       title="Value matches variable '${matchingVar.name}'">link_off</span>`;
            }
          }

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background-color: rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})"></span>
                                <span style="font-family: monospace; font-size: 10px;">rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${formatDecimal(a)})</span>
                                ${validationWarning}
                            </div>`;
        } else if (
          ['GRADIENT_LINEAR', 'GRADIENT_RADIAL', 'GRADIENT_ANGULAR', 'GRADIENT_DIAMOND'].includes(
            paint.type,
          )
        ) {
          // Generate CSS Gradient
          let gradientCss = '';
          if (paint.gradientStops && paint.gradientStops.length > 0) {
            const stops = paint.gradientStops
              .map((stop) => {
                const { r, g, b, a } = stop.color;
                return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a}) ${Math.round(stop.position * 100)}%`;
              })
              .join(', ');

            // Approximate direction for linear (default to to bottom right if not calc-able easily without transform math)
            // Ideally we parse gradientTransform, but for preview '135deg' is usually sufficient to show it's a gradient
            gradientCss = `linear-gradient(135deg, ${stops})`;
            // TODO: radial/angular look different but linear-gradient is a decent fallback for a tiny preview
            if (paint.type === 'GRADIENT_RADIAL') gradientCss = `radial-gradient(circle, ${stops})`;
          }

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background: ${gradientCss}"></span>
                                <span style="font-size: 11px; opacity: 0.8;">${paint.type.replace('GRADIENT_', '')}</span>
                            </div>`;
        } else if (paint.type === 'IMAGE') {
          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="color-preview" style="background: #555; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-outlined" style="font-size: 12px; color: #fff;">image</span>
                                </span>
                                <span style="font-size: 11px; opacity: 0.8;">Image</span>
                            </div>`;
        } else {
          valuePreview = `<div>${paint.type}</div>`;
        }
      } else {
        valuePreview = `<div style="opacity: 0.5;">No Paint</div>`;
      }
    } else if (type === 'text') {
      // Check binding for Font Size
      let fsWarning = '';
      const bound = style.boundVariables || {};
      if (!bound['fontSize']) {
        const matchingVar = findVariableMatchingValue(style.fontSize, 'number');
        if (matchingVar) fsWarning = '⚠️'; // Simplified for text row
      }
      valuePreview = `<div>${style.fontName.family} ${style.fontName.style} / ${formatDecimal(style.fontSize)}px ${fsWarning ? `<span title="Font Size matches a variable" style="cursor:help; font-size: 12px;">${fsWarning}</span>` : ''}</div>`;
    } else if (type === 'effect') {
      if (style.effects && style.effects.length > 0) {
        const firstEffect = style.effects[0];
        if (['DROP_SHADOW', 'INNER_SHADOW'].includes(firstEffect.type)) {
          const { r, g, b, a } = firstEffect.color;
          const colorCss = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${a})`;
          const offset = firstEffect.offset;
          const blur = firstEffect.radius;
          const spread = firstEffect.spread || 0;

          // Check binding for Effect Color
          let validationWarning = '';
          const boundEffect =
            style.boundVariables &&
            style.boundVariables['effects'] &&
            style.boundVariables['effects'][0];
          const boundColor = boundEffect && boundEffect['color'];

          if (!boundColor) {
            // Try to find a matching variable for the color
            const matchingVar = findVariableMatchingValue(firstEffect.color, 'paint');
            if (matchingVar) {
              validationWarning = `
                               <span class="material-symbols-outlined" 
                                     style="font-size: 14px; color: #fbbf24; cursor: help; margin-left: 6px;" 
                                     title="Value matches variable '${matchingVar.name}'">link_off</span>`;
            }
          }

          // Create a box-shadow preview
          const shadowType = firstEffect.type === 'INNER_SHADOW' ? 'inset ' : '';
          // We can't easily show the exact shadow, but we can show a small box with it
          const shadowCss = `${shadowType}${offset.x}px ${offset.y}px ${blur}px ${spread}px ${colorCss}`;

          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div style="width: 16px; height: 16px; background: #fff; border-radius: 4px; box-shadow: ${shadowCss}; border: 1px solid rgba(255,255,255,0.1);"></div>
                                <span style="font-size: 11px; opacity: 0.8;">${firstEffect.type.replace('_', ' ')}</span>
                                ${validationWarning}
                            </div>
                       `;
        } else if (firstEffect.type === 'LAYER_BLUR' || firstEffect.type === 'BACKGROUND_BLUR') {
          valuePreview = `
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span class="material-symbols-outlined" style="font-size: 16px; opacity: 0.7;">blur_on</span>
                                <span style="font-size: 11px; opacity: 0.8;">${firstEffect.type.replace('_', ' ')}: ${firstEffect.radius}px</span>
                            </div>`;
        } else {
          valuePreview = `<div>${style.effects.length} effect(s)</div>`;
        }
      } else {
        valuePreview = `<div style="opacity: 0.5;">No Effects</div>`;
      }
    } else if (type === 'grid') {
      valuePreview = `<div>${style.layoutGrids.length} grid(s)</div>`;
    }

    html += `
                <div class="unified-list-item variable-row" id="style-${sanitizedId}">
                    <div class="variable-cell" style="font-weight: 500; color: #fff;">${displayName}</div>
                    <div class="variable-cell" style="color: rgba(255, 255, 255, 0.4); font-size: 11px; letter-spacing: 0.5px;">${
                      type === 'paint'
                        ? 'Color'
                        : type === 'text'
                          ? 'Text'
                          : type === 'effect'
                            ? 'Effect'
                            : type === 'grid'
                              ? 'Layout guide'
                              : type
                    }</div>
                    <div class="variable-cell">${valuePreview}</div>
                    <div class="variable-cell" style="display: flex; justify-content: center;">
                        <span class="subgroup-stats" title="Used in ${style.usageCount || 0} layers">${style.usageCount || 0}</span>
                    </div>
                    <div class="variable-cell" style="display: flex; justify-content: flex-end;">
                      <button class="icon-button delete-btn" onclick="deleteStyle('${style.id}', '${style.name.replace(/'/g, "\\'")}', '${type}')" title="Delete style">
                        <span class="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                </div>
            `;
  });

  html += `</div>`;
  return html;
}

function findVariableMatchingValue(valueToMatch, type) {
  if (!window.globalVariablesData || !valueToMatch) return null;

  // Helper to check equality
  const isMatch = (v1, v2, type) => {
    if (type === 'paint' || type === 'color') {
      if (typeof v1 !== 'object' || typeof v2 !== 'object') return false;
      // Handle RGB/RGBA objects
      // Check if v1 looks like {r, g, b, a?}
      if (v1.r !== undefined && v2.r !== undefined) {
        // Compare r, g, b with slight tolerance
        const sameR = Math.abs(v1.r - v2.r) < 0.001;
        const sameG = Math.abs(v1.g - v2.g) < 0.001;
        const sameB = Math.abs(v1.b - v2.b) < 0.001;
        const a1 = v1.a !== undefined ? v1.a : 1;
        const a2 = v2.a !== undefined ? v2.a : 1;
        const sameA = Math.abs(a1 - a2) < 0.001;
        return sameR && sameG && sameB && sameA;
      }
      return false;
    } else if (type === 'number' || typeof valueToMatch === 'number') {
      // Number comparison with tolerance
      if (typeof v1 === 'number' && typeof v2 === 'number') {
        return Math.abs(v1 - v2) < 0.01;
      }
      return v1 === v2;
    } else {
      // String comparison
      return v1 === v2;
    }
  };

  for (const collection of window.globalVariablesData) {
    for (const variable of collection.variables) {
      // Check if resolvedType matches expected type
      let typeMatch = false;
      if (type === 'paint' && variable.resolvedType === 'COLOR') typeMatch = true;
      if (type === 'number' && variable.resolvedType === 'FLOAT') typeMatch = true;
      if (type === 'string' && variable.resolvedType === 'STRING') typeMatch = true;

      if (!typeMatch) continue;

      // Check values in all modes
      for (const modeVal of variable.valuesByMode) {
        if (
          (modeVal.value && typeof modeVal.value !== 'object') ||
          (modeVal.value && modeVal.value.type !== 'VARIABLE_ALIAS')
        ) {
          if (isMatch(valueToMatch, modeVal.value, type)) {
            return variable;
          }
        }
      }
    }
  }
  return null;
}

// Render a group of variables with a title
      function renderVariableTable(variables) {
        let html = `
            <div class="variable-list">
              <div class="unified-list-header variable-header">
                  <div class="variable-cell">Name</div>
                  <div class="variable-cell">Type</div>
                  <div class="variable-cell">Values</div>
                  <div class="variable-cell" style="text-align: center;">Usage</div>
                  <div class="variable-cell"></div>
              </div>
        `;

        variables.forEach((variable) => {
          const sanitizedId = variable.name
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();
          const safeVariableName = variable.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            
          html += `
            <div class="unified-list-item variable-row" id="var-${sanitizedId}">
              <div class="variable-cell" style="font-weight: 500; color: #fff; display: flex; align-items: center;">${variable.name}</div>
              <div class="variable-cell" style="color: rgba(255, 255, 255, 0.4); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">${variable.resolvedType === 'FLOAT' ? 'NUMBER' : variable.resolvedType}</div>
              <div class="variable-cell">
          `;

          variable.valuesByMode.forEach((mode) => {
            const value = mode.value;
            const showModeName = variable.valuesByMode.length > 1;

            // Check if this is a variable alias
            if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
              const referencedVariableName = findVariableNameById(value.id);
              const sanitizedName = referencedVariableName
                ? referencedVariableName
                    .replace(/[^a-zA-Z0-9]/g, "-")
                    .toLowerCase()
                : null;
              html += `
                <div>
                  ${showModeName ? `<span style="opacity:0.5; font-size:11px;">${mode.modeName}:</span> ` : ""}<span 
                    style="color: rgba(255,255,255,0.9); cursor: pointer; border-bottom: 1px dashed rgba(255,255,255,0.4);" 
                    onclick="scrollToVariable('${sanitizedName}')"
                    title="Click to jump to ${referencedVariableName}"
                  >${referencedVariableName || value.id}</span>
                </div>
              `;
            }
            // Display color values with a preview
            else if (
              variable.resolvedType === "COLOR" &&
              typeof value === "object" &&
              value.r !== undefined
            ) {
              const r = Math.round(value.r * 255);
              const g = Math.round(value.g * 255);
              const b = Math.round(value.b * 255);
              const a = value.a ?? 1;

              html += `
                <div style="display: flex; align-items: center; gap: 6px;">
                  <span class="color-preview" style="background-color: rgba(${r},${g},${b},${a}); width: 14px; height: 14px; border-radius: 4px; display: inline-block;"></span>
                  <span>${
                    showModeName ? mode.modeName + ": " : ""
                  }rgba(${r},${g},${b},${formatDecimal(a)})</span>
                </div>
              `;
            } else {
               // Fix for string formatting: don't stringify strings
              const displayValue = typeof value === 'string' ? value : (typeof value === 'number' ? formatDecimal(value) : JSON.stringify(value));
              html += `<div>${
                showModeName ? mode.modeName + ": " : ""
              }${displayValue}</div>`;
            }
          });

          html += `</div>
              
              <!-- Usage badge -->
              <div class="variable-cell" style="display: flex; justify-content: center;">
                 <span class="subgroup-stats" title="Used in ${variable.usageCount || 0} layers">${variable.usageCount || 0}</span>
              </div>
              
              <div class="variable-cell" style="display: flex; justify-content: flex-end;">
                <button class="icon-button delete-btn" onclick="deleteVariable('${variable.id}', '${safeVariableName}')" title="Delete variable">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          `;
        });

        html += `
            </div>
        `;

        return html;
      }

// Extract component type and state from name
function parseComponentName(name) {
  const result = {
    name: name,
    variants: [],
  };

  // Extract all property=value patterns (Type=, State=, Size=, etc.)
  const variantMatches = name.match(/([A-Za-z]+)=([^,]+)/g);
  if (variantMatches) {
    variantMatches.forEach((match) => {
      const [property, value] = match.split('=');
      if (property && value) {
        result.variants.push({
          property: property.trim(),
          value: value.trim(),
        });
      }
    });

    // Remove variant information from the name to avoid duplication
    result.name = name.replace(/,?\s*([A-Za-z]+)=([^,]+)/g, '').trim();
    // Clean up any remaining commas or extra spaces
    result.name = result.name.replace(/^,\s*|,\s*$/g, '').trim();
  }

  return result;
}

// Extract text style type and state from name (similar to components)
function parseTextStyleName(name) {
  const result = {
    name: name,
    type: null,
    state: null,
    size: null,
  };

  // Check for Type=X pattern
  const typeMatch = name.match(/Type=([^,]+)/i);
  if (typeMatch && typeMatch[1]) {
    result.type = typeMatch[1].trim();
  }

  // Check for State=X pattern
  const stateMatch = name.match(/State=([^,]+)/i);
  if (stateMatch && stateMatch[1]) {
    result.state = stateMatch[1].trim();
  }

  const sizeMatch = name.match(/Size=([^,]+)/i);
  if (sizeMatch && sizeMatch[1]) {
    result.size = sizeMatch[1].trim();
  }

  return result;
}

function formatTextElements(textElements) {
  if (!textElements || textElements.length === 0) return '';
  return '';
}

function formatStyles(styles, textElements, componentName) {
  if (!styles) return '';

  try {
    let stylesObj = styles;
    if (typeof styles === 'string') {
      stylesObj = JSON.parse(styles);
    }

    let combinedStyles = { ...stylesObj };

    if (textElements && textElements.length > 0) {
      const parsedName = parseTextStyleName(componentName || '');

      textElements.forEach((textEl, index) => {
        const prefix = textElements.length > 1 ? `text_${index + 1}_` : 'text_';

        const stateSize = [
          parsedName.state ? `State=${parsedName.state}` : null,
          parsedName.size ? `Size=${parsedName.size}` : null,
        ]
          .filter(Boolean)
          .join(', ');

        if (textEl.textStyles) {
          Object.keys(textEl.textStyles).forEach((styleKey) => {
            const value = textEl.textStyles[styleKey];
            if (value) {
              const formattedKey = stateSize
                ? `${prefix}${styleKey} (${stateSize})`
                : `${prefix}${styleKey}`;
              combinedStyles[formattedKey] = value;
            }
          });
        }
      });
    }

    const styleStr = JSON.stringify(combinedStyles, null, 2);
    const highlightedJson = highlightJson(styleStr);
    if (styleStr.length > 300) {
      const truncated =
        highlightedJson.substring(0, 300) +
        "... <span class='expand-indicator'>(Click to expand)</span>";
      return `<div class="style-content-wrapper">
              <div class="style-collapsed">${truncated}</div>
              <div class="style-expanded" style="display: none;">${highlightedJson}</div>
            </div>`;
    }

    return highlightedJson;
  } catch (e) {
    console.error('Error in formatStyles:', e);
    return String(styles);
  }
}



// Copy text to clipboard
window.copyToClipboard = function(text) {
  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'absolute';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  
  // Select and copy
  textarea.select();
  try {
    document.execCommand('copy');
    showNotification('success', 'Copied!', 'Link copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    showNotification('error', 'Error', 'Failed to copy link');
  }
  
  // Clean up
  document.body.removeChild(textarea);
};

function highlightJson(json) {
  json = json.replace(/^\s*{\s*/, '{\n  ');

  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      },
    );
}

function getVariableValue(variable) {
  let value, resolvedType;

  if (variable.valuesByMode && Array.isArray(variable.valuesByMode)) {
    const firstMode = variable.valuesByMode[0];
    if (!firstMode) return null;
    value = firstMode.value;
    resolvedType = variable.resolvedType || variable.type;
  } else if (variable.valuesByMode && typeof variable.valuesByMode === 'object') {
    const modeKeys = Object.keys(variable.valuesByMode);
    if (modeKeys.length === 0) return null;
    value = variable.valuesByMode[modeKeys[0]];
    resolvedType = variable.resolvedType;
  } else {
    return null;
  }

  if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const referencedVariable = findVariableById(value.id);
    if (referencedVariable) {
      return getVariableValue(referencedVariable);
    }
    return null;
  }

  if (resolvedType === 'COLOR' && typeof value === 'object' && value.r !== undefined) {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    const a = value.a !== undefined ? value.a : 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else if (resolvedType === 'FLOAT') {
    return `${value}px`;
  } else if (resolvedType === 'STRING') {
    return String(value);
  }

  return value;
}

function findVariableById(id) {
  for (const collection of variablesData) {
    for (const variable of collection.variables) {
      if (variable.id === id) {
        return variable;
      }
    }
  }
  return null;
}

function deleteVariable(variableId, variableName) {
  if (confirm(`Are you sure you want to delete the variable "${variableName}"?`)) {
    // Send message to plugin to delete the variable from Figma
    parent.postMessage(
      {
        pluginMessage: {
          type: 'delete-variable',
          variableId: variableId,
        },
      },
      '*',
    );

    // Show loading feedback
    const button = document.querySelector(`[onclick*="${variableId}"]`);
    if (button) {
      button.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"><animate attributeName="opacity" dur="1s" values="1;0;1" repeatCount="indefinite"/></circle></svg>';
      button.disabled = true;
      button.style.cursor = 'not-allowed';
    }
  }
}

function deleteStyle(styleId, styleName, styleType) {
  if (confirm(`Are you sure you want to delete the style "${styleName}"?`)) {
    // Send message to plugin to delete the style from Figma
    parent.postMessage(
      {
        pluginMessage: {
          type: 'delete-style',
          styleId: styleId,
          styleType: styleType,
        },
      },
      '*',
    );

    // Show loading feedback
    const button = document.querySelector(`[onclick*="${styleId}"]`);
    if (button) {
      button.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"><animate attributeName="opacity" dur="1s" values="1;0;1" repeatCount="indefinite"/></circle></svg>';
      button.disabled = true;
      button.style.cursor = 'not-allowed';
    }
  }
}

function renderComponentVariables(group) {
  const groupIndex = Math.random().toString(36).substr(2, 9);

  let html = `
          <div class="component-variables">
            <button class="variables-toggle" onclick="toggleVariablesList('${groupIndex}')">
              Show Variables (${group.variables.length})
            </button>
            <div class="variables-list" id="variables-${groupIndex}">
        `;

  group.variables.forEach((variable) => {
    const displayValue = getVariableDisplayValue(variable);

    const firstMode = variable.valuesByMode[0];
    let clickableValue = displayValue;

    if (
      firstMode &&
      firstMode.value &&
      typeof firstMode.value === 'object' &&
      firstMode.value.type === 'VARIABLE_ALIAS'
    ) {
      const referencedVariable = findVariableById(firstMode.value.id);
      if (referencedVariable) {
        const sanitizedName = referencedVariable.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        clickableValue = `<span style="color: #c4b5fd; cursor: pointer; text-decoration: underline;" onclick="scrollToVariable('${sanitizedName}')" title="Click to jump to ${referencedVariable.name}">${displayValue}</span>`;
      }
    }

    html += `
            <div class="variable-item">
              <span class="variable-name">${variable.name}</span>
              <span class="variable-value">${clickableValue}</span>
            </div>
          `;
  });

  html += `
            </div>
          </div>
        `;

  return html;
}

function getVariableDisplayValue(variable) {
  if (variable.valuesByMode.length > 1) {
    return variable.valuesByMode
      .map((mode) => {
        const value = mode.value;
        if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
          const referencedVariable = findVariableById(value.id);
          return `${mode.modeName}: ${referencedVariable ? referencedVariable.name : value.id}`;
        }
        return `${mode.modeName}: ${formatSingleValue(value, variable.resolvedType)}`;
      })
      .join(', ');
  } else {
    const firstMode = variable.valuesByMode[0];
    if (!firstMode) return 'No value';

    const value = firstMode.value;
    if (typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
      const referencedVariable = findVariableById(value.id);
      return referencedVariable ? referencedVariable.name : value.id;
    }

    return formatSingleValue(value, variable.resolvedType);
  }
}

function formatSingleValue(value, resolvedType) {
  if (resolvedType === 'COLOR' && typeof value === 'object' && value.r !== undefined) {
    const r = Math.round(value.r * 255);
    const g = Math.round(value.g * 255);
    const b = Math.round(value.b * 255);
    if (value.a != null && value.a < 1) {
      return `rgba(${r}, ${g}, ${b}, ${value.a.toFixed(2)})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  if (resolvedType === 'FLOAT') {
    return `${value}px`;
  }

  if (resolvedType === 'STRING') {
    return `"${value}"`;
  }

  return String(value);
}

function renderComponents(data) {
  const container = document.getElementById('components-container');

  // Calculate totals for summary
  let totalComponents = 0;
  let setsCount = 0;
  if (data && data.length > 0) {
    data.forEach((component) => {
      if (component.type === 'COMPONENT_SET') {
        setsCount++;
        totalComponents += component.children ? component.children.length : 0;
        totalComponents++; // Count the set itself
      } else {
        totalComponents++;
      }
    });
  }

  // Update summary
  if (window.updateComponentsSummary) {
    window.updateComponentsSummary(totalComponents, setsCount);
  }

  if (!data || data.length === 0) {
    container.innerHTML = '';

    container.appendChild(
      document
        .createRange()
        .createContextualFragment(
          UIHelper.renderEmptyState('No components found in this document.'),
        ),
    );
    return;
  }

  let html = `<div class="component-list">`;

  data.forEach((component, index) => {
    if (component.type === 'COMPONENT_SET') {
      const parsedName = parseComponentName(component.name);

      html += `
            <div class="component-set">
              <div class="component-set-header" data-index="${index}">
                  <div class="component-header-content">
                    <div class="component-meta">
                      <span class="component-name">${parsedName.name}</span>
                      ${UIHelper.createBadge('Component Set', 'component-set')}
                    </div>
                  </div>
                  <div class="component-actions">
                    ${UIHelper.createActionBtn('download', '', {
                      'data-component-id': component.id,
                      'data-component-name': component.name,
                      'data-action': 'generate',
                      class: 'generate-all-variants-button btn-icon-only',
                      'data-tooltip': 'Generate variants',
                    })}
                    ${UIHelper.createActionBtn('commit', '', {
                      'data-component-id': component.id,
                      'data-component-name': component.name,
                      'data-action': 'commit',
                      class: 'commit-all-variants-button btn-icon-only',
                      'data-tooltip': 'Commit variants',
                    })}
                    ${UIHelper.createNavIcon(component.id, 'Navigate to component')}
                    <div class="component-set-toggle">
                      <span class="material-symbols-outlined component-set-toggle-icon">expand_more</span>
                    </div>
                  </div>
              </div>
              <div class="component-set-children" id="children-${index}">
            `;

      if (component.children && component.children.length > 0) {
        component.children.forEach((child) => {
          const childParsed = parseComponentName(child.name);

          html += `
                <div class="child-component">
                  <div class="child-header">
                    ${UIHelper.createNavIcon(child.id, 'Navigate to variant')}
                    <div class="component-meta">
                      <span class="component-name">${childParsed.name}</span>
                      ${
                        childParsed.variants.length > 0
                          ? childParsed.variants
                              .map((variant) =>
                                UIHelper.createBadge(
                                  `${variant.property}=${variant.value}`,
                                  'variant',
                                ),
                              )
                              .join('')
                          : UIHelper.createBadge('Variant', 'component')
                      }
                    </div>
                  </div>
                </div>
                `;
        });
      }

      html += `
              </div>
              <div class="test-success-message">Test generated successfully!</div>
            </div>
            `;
    } else {
      const parsedName = parseComponentName(component.name);

      html += `
            <div class="component-regular">
              <div class="component-header-content">
                ${UIHelper.createNavIcon(component.id, 'Navigate to component', 'target')}
                <div class="component-meta">
                  <span class="component-name">${parsedName.name}</span>
                  ${
                    parsedName.variants.length > 0
                      ? parsedName.variants
                          .map((variant) =>
                            UIHelper.createBadge(`${variant.property}=${variant.value}`, 'variant'),
                          )
                          .join('')
                      : UIHelper.createBadge('Component', 'component')
                  }
                </div>
                <div class="component-actions">
                  ${UIHelper.createActionBtn('download', 'Generate', {
                    'data-component-id': component.id,
                    'data-component-name': component.name,
                    'data-action': 'generate',
                    class: 'generate-all-variants-button',
                  })}
                  ${UIHelper.createActionBtn('commit', 'Commit', {
                    'data-component-id': component.id,
                    'data-component-name': component.name,
                    'data-action': 'commit',
                    class: 'commit-all-variants-button',
                  })}
                </div>
              </div>
              <div class="test-success-message">Test generated successfully!</div>
            </div>
            `;
    }
  });

  html += `</div>`;
  container.innerHTML = SecurityUtils.sanitizeHTML(html);

  // Add event listeners for navigation buttons and component action buttons
  container.addEventListener('click', function (event) {
    // 1. Handle navigation first
    const navIcon = event.target.closest('.nav-icon');
    if (navIcon) {
      const componentId = navIcon.getAttribute('data-component-id');
      if (componentId) window.selectComponent(componentId);
      return;
    }

    // 2. Handle generate/commit buttons
    const actionBtn = event.target.closest(
      '.generate-all-variants-button, .commit-all-variants-button',
    );
    if (actionBtn) {
      const componentId = actionBtn.getAttribute('data-component-id');
      const componentName = actionBtn.getAttribute('data-component-name');
      const action = actionBtn.getAttribute('data-action');
      if (componentId && componentName) {
        const isCommit = action === 'commit';
        generateTest(componentId, componentName, actionBtn, true, isCommit);
      }
      return;
    }

    // 3. Handle header toggle last
    const header = event.target.closest('.component-set-header');
    if (header) {
      const index = header.getAttribute('data-index');
      if (index !== null) {
        window.toggleComponentSet(index);
      }
    }
  });

  window.toggleComponentSet = function (index) {
    const headerEl = document.querySelector(`.component-set-header[data-index="${index}"]`);
    const childrenEl = document.getElementById(`children-${index}`);

    if (!headerEl || !childrenEl) {
      console.warn(`[UI] toggleComponentSet: Elements not found for index ${index}`);
      return;
    }

    if (childrenEl.classList.contains('expanded')) {
      childrenEl.classList.remove('expanded');
      headerEl.classList.remove('expanded');
    } else {
      childrenEl.classList.add('expanded');
      headerEl.classList.add('expanded');
    }
  };

  window.expandAllComponents = function () {
    const headers = document.querySelectorAll('.component-set-header:not(.expanded)');
    headers.forEach((header) => {
      const index = header.getAttribute('data-index');
      if (index !== null) window.toggleComponentSet(index);
    });
  };

  window.collapseAllComponents = function () {
    const headers = document.querySelectorAll('.component-set-header.expanded');
    headers.forEach((header) => {
      const index = header.getAttribute('data-index');
      if (index !== null) window.toggleComponentSet(index);
    });
  };

  window.toggleStyles = function (element) {
    const isExpanding = !element.classList.contains('expanded');
    element.classList.toggle('expanded');

    const wrapper = element.querySelector('.style-content-wrapper');
    if (wrapper) {
      const collapsed = wrapper.querySelector('.style-collapsed');
      const expanded = wrapper.querySelector('.style-expanded');

      if (element.classList.contains('expanded')) {
        if (collapsed) collapsed.style.display = 'none';
        if (expanded) expanded.style.display = 'block';
      } else {
        if (collapsed) collapsed.style.display = 'block';
        if (expanded) expanded.style.display = 'none';
      }
    }

    // If expanding and we have a component ID, load the styles lazily
    if (isExpanding && element.dataset.componentId) {
      const componentId = element.dataset.componentId;
      const hasEmptyStyles = element.innerHTML.includes('{}') || element.innerHTML.includes('{ }');

      // Only load if we detect empty styles
      if (hasEmptyStyles) {
        // Show loading state
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'style-loading';
        loadingDiv.innerHTML =
          '<span class="loading-spinner">⏳</span> Loading component styles...';

        // Replace content temporarily
        const originalContent = element.innerHTML;
        element.innerHTML = loadingDiv.outerHTML;

        // Request component styles from plugin
        parent.postMessage(
          {
            pluginMessage: {
              type: 'load-component-styles',
              componentId: componentId,
            },
          },
          '*',
        );

        // Store the element for later update
        element.dataset.originalContent = originalContent;
      }
    }

    if (element.classList.contains('expanded')) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  };
}

function downloadCSS(cssString, format = 'css') {
  let mimeType = 'text/css';
  let fileExtension = 'css';

  if (format === 'scss') {
    mimeType = 'text/scss';
    fileExtension = 'scss';
  } else if (format === 'tailwind-v4') {
    mimeType = 'text/css';
    fileExtension = 'css';
  }

  const blob = new Blob([cssString], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `figma-variables.${fileExtension}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const exportCssButton = document.getElementById('export-css-button');
if (exportCssButton) {
  exportCssButton.addEventListener('click', () => {
    try {
      // Default to CSS format if no settings configured
      const exportFormat = window.gitlabSettings?.exportFormat || 'css';

      // Validate export format
      if (!['css', 'scss', 'tailwind-v4'].includes(exportFormat.toLowerCase())) {
        showError(
          'Export Failed',
          'Invalid export format. Please select CSS, SCSS, or Tailwind v4.',
        );
        return;
      }

      // Enhanced loading state for export
      const formatLabel =
        exportFormat === 'tailwind-v4' ? 'Tailwind v4' : exportFormat.toUpperCase();
      showButtonLoading(exportCssButton, `Generating ${formatLabel}...`);
      showContentLoading(
        'variables-container',
        'Processing variables and generating stylesheet...',
      );

      parent.postMessage(
        {
          pluginMessage: {
            type: 'export-css',
            shouldDownload: true,
            exportFormat: exportFormat,
          },
        },
        '*',
      );

      // TRACKING: Mark variables as exported for User Guide
      // Update shared state instead of localStorage
      // Updated to handle undefined state safely
      if (typeof userGuideState !== 'undefined' && userGuideState) {
        userGuideState.lastExportVars = true;
        if (typeof saveUserGuideState === 'function') {
          saveUserGuideState(); // Save to backend
        }
      }
      if (typeof refreshUserGuide === 'function') refreshUserGuide();

      // Re-enable button after a delay (will be handled by response message)
      setTimeout(() => {
        if (exportCssButton.disabled) {
          exportCssButton.disabled = false;
          updateExportButtonText();
        }
      }, 5000);
    } catch (error) {
      console.error('Error initiating CSS export:', error);
      showError('Export Failed', 'An unexpected error occurred while exporting. Please try again.');

      // Re-enable button on error
      exportCssButton.disabled = false;
      updateExportButtonText();
    }
  });
}

function updateExportButtonText() {
  const exportButton = document.getElementById('export-css-button');
  exportButton.innerHTML = `<span class="material-symbols-outlined">download</span><span class="toolbar-btn-text">Download</span>`;
}

function generateTest(
  componentId,
  componentName,
  button,
  generateAllVariants = false,
  forCommit = false,
) {
  try {
    // Validate inputs
    if (!componentId || !componentName || !button) {
      throw new Error('Missing required parameters for test generation');
    }

    if (!button.parentElement) {
      throw new Error('Button element is not properly attached to DOM');
    }

    // Validate component name
    if (typeof componentName !== 'string' || componentName.trim().length === 0) {
      throw new Error('Invalid component name provided');
    }

    // Enhanced loading state for test generation
    const loadingText = forCommit ? 'Committing test...' : 'Generating test...';

    // Store original text before changing it
    if (!button.dataset.originalText) {
      button.dataset.originalText = button.textContent;
    }

    showButtonLoading(button, loadingText);

    const successMessage = button.parentElement.nextElementSibling;
    if (successMessage && successMessage.classList.contains('test-success-message')) {
      successMessage.style.display = 'none';
    }

    // Add timeout to prevent hanging operations
    const timeoutId = setTimeout(() => {
      console.warn('Test generation timed out');
      button.classList.remove('loading');
      button.textContent = button.dataset.originalText || 'Generate Test';
      button.disabled = false;
      showError('Generation Timeout', 'Test generation took too long. Please try again.');
    }, 60000); // 60 seconds timeout

    // Store timeout ID for potential cleanup
    button.dataset.timeoutId = timeoutId;

    if (forCommit) {
      // TRACKING: Mark test as committed/exported for User Guide
      try {
        localStorage.setItem('bridgy_last_export_test', 'true');
      } catch (e) {
        console.warn('localStorage access failed:', e);
      }
      if (typeof refreshUserGuide === 'function') refreshUserGuide();

      // For commits, we need to pass all the context needed for the backend to commit
      parent.postMessage(
        {
          pluginMessage: {
            type: 'commit-component-test',
            componentId: componentId,
            componentName: componentName,
            settings: window.gitlabSettings, // Pass all settings
            provider: window.gitlabSettings?.provider || 'gitlab',
            token: window.gitlabSettings?.token || window.gitlabSettings?.gitlabToken,
            gitlabToken: window.gitlabSettings?.token || window.gitlabSettings?.gitlabToken, // Compat
            projectId: window.gitlabSettings?.projectId,
            baseUrl: window.gitlabSettings?.baseUrl,
            commitMessage: `test: add component test for ${componentName}`,
            // We'll let the backend generate the content if it's missing,
            // or the backend logic for 'commit-component-test' might need to be adjusted to generate it first.
            // However, based on the error "Missing required fields", we were hitting the commit handler directly.
            // A better approach is often: Generate -> Get Content -> Commit.
            // But for now, let's fix the immediate "Missing required fields" error by checking if we have content.
            // If we don't have content, we should probably trigger 'generate-test' with a flag to commit after.
            // BUT, looking at the previous logic that failed, it seems it WAS creating a commit message directly?
            // Let's assume for now we want to use the backend's ability to generate & commit.
            // If 'commit-component-test' expects 'testContent', we must provide it.
            // Since we don't have it here, we should probably stick to 'generate-test' BUT pass 'forCommit: true'
            // AND ensure the backend handles 'forCommit' correctly.

            // WAIT: The previous error came from 'commit-component-test' handler.
            // This means 'generate-test' in backend probably sends 'commit-component-test' OR the UI calls it directly.
            // If I change this to send 'commit-component-test', I MUST provide 'testContent'.

            // Let's stick to 'generate-test' but ensure we pass the settings needed for the *callback* or *subsequent step*.
            type: 'generate-test',
            componentId: componentId,
            componentName: componentName,
            generateAllVariants: generateAllVariants,
            forCommit: forCommit, // Backend should handle this
            // Pass these just in case backend needs them for the subsequent commit
            provider: window.gitlabSettings?.provider || 'gitlab',
            // we don't need tokens here if generate-test just generates.
          },
        },
        '*',
      );
    } else {
      parent.postMessage(
        {
          pluginMessage: {
            type: 'generate-test',
            componentId: componentId,
            componentName: componentName,
            generateAllVariants: generateAllVariants,
            forCommit: forCommit,
          },
        },
        '*',
      );
    }
  } catch (error) {
    // ... catch block
    console.error('Error in generateTest:', error);
    // ... (rest of catch block)
  }
}

function downloadComponentsZip(files, language) {
  if (!files || files.length === 0) {
    showError('Export Failed', 'No components available to export');
    return;
  }

  const zip = new JSZip();
  files.forEach((component) => {
    const folder = zip.folder(component.kebabName);
    const folderName = component.kebabName;

    if (language === 'angular') {
      folder.file(`${folderName}.component.html`, component.angularHtml);
      folder.file(`${folderName}.component.ts`, component.angularTs);
      folder.file(
        `${folderName}.component.scss`,
        `// Styles for ${component.name}\n.${folderName} {\n  // Add your styles here\n}`,
      );
    } else if (language === 'typescript') {
      folder.file(`${folderName}.component.ts`, component.angularTs);
    } else if (language === 'javascript') {
      const jsCode = component.angularTs
        .replace(/: [A-Za-z<>[\]]+/g, '')
        .replace(/interface [^}]+}/g, '');
      folder.file(`${folderName}.component.js`, jsCode);
    }
  });

  // Generate and download the ZIP
  zip
    .generateAsync({ type: 'blob' })
    .then((content) => {
      try {
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `figma-components-${language}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showSuccess(
          'Download Complete',
          `Components exported successfully as ${language.toUpperCase()} files.`,
        );
      } catch (error) {
        console.error('Error downloading ZIP file:', error);
        showError('Download Failed', 'Failed to download the exported files. Please try again.');
      }
    })
    .catch((error) => {
      console.error('Error generating ZIP file:', error);
      showError('Export Failed', 'Failed to generate the export files. Please try again.');
    });
}

// Function to download a generated test
function downloadTest(componentName, testContent) {
  // Create a kebab case version of the component name for the file name
  const kebabName = componentName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const blob = new Blob([testContent], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${kebabName}.component.spec.ts`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Search functionality
const variableSearchElement = document.getElementById('variable-search');
if (variableSearchElement) {
  variableSearchElement.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    const clearBtn = document.getElementById('clear-variable-search');
    if (clearBtn) {
      clearBtn.style.display = searchTerm ? 'flex' : 'none';
    }

    const filteredData = variablesData
      .map((collection) => {
        return {
          ...collection,
          variables: collection.variables.filter((variable) => {
            // Search in variable name
            if (variable.name.toLowerCase().includes(searchTerm)) {
              return true;
            }

            // Search in variable type
            if (variable.resolvedType && variable.resolvedType.toLowerCase().includes(searchTerm)) {
              return true;
            }

            // Search in variable values
            if (variable.valuesByMode && Array.isArray(variable.valuesByMode)) {
              return variable.valuesByMode.some((mode) => {
                const value = mode.value;

                // Search in mode name
                if (mode.modeName && mode.modeName.toLowerCase().includes(searchTerm)) {
                  return true;
                }

                // Handle VARIABLE_ALIAS references
                if (typeof value === 'object' && value && value.type === 'VARIABLE_ALIAS') {
                  // Search by the referenced variable name if we can find it
                  const referencedVar = findVariableById(value.id);
                  if (referencedVar && referencedVar.name.toLowerCase().includes(searchTerm)) {
                    return true;
                  }
                }

                // Search in color values
                if (
                  variable.resolvedType === 'COLOR' &&
                  typeof value === 'object' &&
                  value &&
                  value.r !== undefined
                ) {
                  const r = Math.round(value.r * 255);
                  const g = Math.round(value.g * 255);
                  const b = Math.round(value.b * 255);
                  const a = value.a !== undefined ? value.a : 1;

                  // Search in rgba format
                  const rgbaString = `rgba(${r},${g},${b},${a})`;
                  if (rgbaString.includes(searchTerm)) {
                    return true;
                  }

                  // Search in rgb format
                  const rgbString = `rgb(${r},${g},${b})`;
                  if (rgbString.includes(searchTerm)) {
                    return true;
                  }

                  // Search in hex format
                  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
                  if (hex.toLowerCase().includes(searchTerm)) {
                    return true;
                  }

                  // Search individual color components
                  if (
                    searchTerm === r.toString() ||
                    searchTerm === g.toString() ||
                    searchTerm === b.toString()
                  ) {
                    return true;
                  }
                }

                // Search in numeric values (including with px suffix)
                if (typeof value === 'number') {
                  // Check exact number
                  if (value.toString().includes(searchTerm)) {
                    return true;
                  }
                  // Check with px suffix
                  if (`${value}px`.includes(searchTerm)) {
                    return true;
                  }
                  // Check just the number part if search includes 'px'
                  if (
                    searchTerm.includes('px') &&
                    searchTerm.replace('px', '') === value.toString()
                  ) {
                    return true;
                  }
                }

                // Search in string values
                if (typeof value === 'string') {
                  if (value.toLowerCase().includes(searchTerm)) {
                    return true;
                  }
                }

                return false;
              });
            }

            return false;
          }),
        };
      })
      .filter((collection) => collection.variables.length > 0);

    // Filter Styles
    let filteredStyles = null;
    if (stylesData) {
      filteredStyles = {
        paintStyles: stylesData.paintStyles
          ? stylesData.paintStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
          : [],
        textStyles: stylesData.textStyles
          ? stylesData.textStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
          : [],
        effectStyles: stylesData.effectStyles
          ? stylesData.effectStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
          : [],
        gridStyles: stylesData.gridStyles
          ? stylesData.gridStyles.filter((s) => s.name.toLowerCase().includes(searchTerm))
          : [],
      };
    }

    renderVariables(filteredData, filteredStyles);

    // Auto-expand if searching
    if (searchTerm && typeof expandAllVariables === 'function') {
      expandAllVariables();
    }
  });
}

window.clearSearch = function (inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = '';
    input.dispatchEvent(new Event('input'));
    input.focus();
  }
};

const componentSearchElement = document.getElementById('component-search');
if (componentSearchElement) {
  componentSearchElement.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();

    // Toggle clear button
    const clearBtn = document.getElementById('clear-component-search');
    if (clearBtn) {
      clearBtn.style.display = searchTerm ? 'flex' : 'none';
    }

    // Search in component names, types, and metadata
    const filteredData = componentsData.filter((component) => {
      // Search in component name
      if (component.name.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in component type
      if (component.type && component.type.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in page name
      if (component.pageName && component.pageName.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in children names and types
      if (
        component.children &&
        component.children.some((child) => {
          return (
            child.name.toLowerCase().includes(searchTerm) ||
            (child.type && child.type.toLowerCase().includes(searchTerm))
          );
        })
      ) {
        return true;
      }

      return false;
    });

    renderComponents(filteredData);
  });
}

// Function to open settings modal
function openSettingsModal() {
  document.getElementById('settings-modal').style.display = 'block';
  document.body.classList.add('modal-open');
  loadConfigurationTab(); // Load saved settings into the form

  // Ensure provider UI is initialized correctly
  setTimeout(() => {
    onProviderChange();
  }, 200);
}

// Function to close settings modal
function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Function to open import modal
function openImportModal() {
  document.getElementById('import-modal').style.display = 'block';
  document.body.classList.add('modal-open');
  initializeVariableImportTab();
}

// Function to close import modal
function closeImportModal() {
  document.getElementById('import-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Function to open units modal
function openUnitsModal() {
  document.getElementById('units-modal').style.display = 'block';
  document.body.classList.add('modal-open');
  loadUnitsSettings();
}

// Function to save units and close modal
function saveUnitsAndCloseModal() {
  window.saveUnitsSettings();
  closeUnitsModal();
}

// Function to close units modal
function closeUnitsModal() {
  document.getElementById('units-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Function to switch to Quality tab
function switchToQualityTab() {
  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

  // Activate Quality tab
  const qualityTab = document.querySelector('.tab[data-tab="quality"]');
  const qualityContent = document.getElementById('quality-content');

  if (qualityTab && qualityContent) {
    qualityTab.classList.add('active');
    qualityContent.classList.add('active');

    // Auto-trigger scan, same as clicking the tab
    setTimeout(() => {
      console.log('Auto-triggering Smart Scan from warning button...');
      if (typeof analyzeTokenCoverage === 'function') {
        analyzeTokenCoverage('SMART_SCAN');
      } else {
        console.warn('analyzeTokenCoverage function not found');
      }
    }, 100);
  }
}

// Function to analyze token coverage

function analyzeTokenCoverage(scopeOverride, notificationElement) {
  console.log('[DEBUG] analyzeTokenCoverage called', { scopeOverride, notificationElement });
  console.log('analyzeTokenCoverage called', { scopeOverride, hasNotification: !!notificationElement });
  // Store notification reference if provided
  if (notificationElement) {
    window.currentAnalysisNotification = notificationElement;
  }

  const resultsContainer = document.getElementById('token-coverage-results');

  if (resultsContainer) {
    resultsContainer.innerHTML = UIHelper.createSkeletonLoader();
  }

  // Send message to plugin backend
  parent.postMessage(
    {
      pluginMessage: {
        type: 'analyze-token-coverage',
        scope: scopeOverride || analysisScope,
        exportFormat: window.gitlabSettings ? window.gitlabSettings.exportFormat : 'css'
      },
    },
    '*',
  );
}

function getScoreColor(score) {
  if (!score && score !== 0) return '#22c55e'; // Default to green
  // Smooth gradient from red (0) → yellow (50) → green (100) using HSL
  // Hue: 0 = red, 60 = yellow, 120 = green
  // Map score 0-100 to hue 0-120
  const hue = Math.min(120, Math.max(0, (score / 100) * 120));
  // Keep saturation and lightness consistent for vibrant colors
  return `hsl(${hue}, 70%, 50%)`;
}

// Update analysis scope
function updateAnalysisScope(scope) {
  analysisScope = scope;
  // Re-run analysis when scope changes
  analyzeTokenCoverage();
}

// Toggle sort order
window.toggleStatsSort = function(column) {
  if (statsSortState.column === column) {
    statsSortState.direction = statsSortState.direction === 'asc' ? 'desc' : 'asc';
  } else {
    statsSortState.column = column;
    statsSortState.direction = column === 'name' ? 'asc' : 'desc';
  }
  
  // Re-apply filter which triggers render with new sort
  const searchInput = document.getElementById('stats-search');
  const query = searchInput ? searchInput.value : '';
  if (window.filterStats) {
      window.filterStats(query);
  } else {
      renderStats(componentStatsData);
  }
};

// Render component stats
function renderStats(statsData, filteredData = null) {
  const container = document.getElementById('stats-container');
  if (!container) return;

  if (!statsData || statsData.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">No local components found in this file</div>
        <div class="empty-subtext">Components defined in this file will appear here</div>
      </div>
    `;
    return;
  }

  // Calculate totals from the FULL dataset (statsData)
  const totalComponents = statsData.length;
  const totalInstances = statsData.reduce((sum, item) => sum + item.count, 0);

  // Metrics: Unused
  const unusedComponents = statsData.filter((item) => item.count === 0).length;

  // Calculate filtered stats if provided
  let filteredComponents = 0;
  let filteredInstances = 0;
  let filteredUnused = 0;
  
  if (filteredData) {
      filteredComponents = filteredData.length;
      filteredInstances = filteredData.reduce((sum, item) => sum + item.count, 0);
      filteredUnused = filteredData.filter((item) => item.count === 0).length;
  }

  let html = `
    <!-- Top Summary Cards -->
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
            ${filteredData ? `${filteredComponents} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${totalComponents}</span>` : totalComponents}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Components</div>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
            ${filteredData ? `${filteredInstances} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${totalInstances}</span>` : totalInstances}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Local Instances</div>
      </div>
      <div style="background: rgba(255,255,255,0.03); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
        <div style="font-size: 24px; font-weight: 600; color: white; margin-bottom: 4px;">
             ${filteredData ? `${filteredUnused} <span style="font-size: 14px; color: #a855f7; margin-left: 2px;">/ ${unusedComponents}</span>` : unusedComponents}
        </div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px;">Unused Components</div>
      </div>
    </div>

    <!-- Stats Table -->
    <div class="stats-table">
        <!-- Table Header -->
        <div style="display: grid; grid-template-columns: 1fr 60px 100px 40px; gap: 12px; padding: 0 12px 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 8px; align-items: center;">
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; cursor: pointer; display: flex; align-items: center; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('name')">
              Component Name ${statsSortState.column === 'name' ? (statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; text-align: right; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('variantCount')">
              Variants ${statsSortState.column === 'variantCount' ? (statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div style="font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; text-align: right; cursor: pointer; display: flex; align-items: center; justify-content: flex-end; gap: 4px; white-space: nowrap;" onclick="toggleStatsSort('count')">
              Instances ${statsSortState.column === 'count' ? (statsSortState.direction === 'asc' ? '<span style="display:inline-block">↑</span>' : '<span style="display:inline-block">↓</span>') : ''}
            </div>
            <div></div> <!-- Actions spacer -->
        </div>

        <div class="component-list" style="display: flex; flex-direction: column; gap: 4px;">
  `;

  // Use filteredData for the list if present, otherwise statsData
  // Clone to avoid mutation of source if reused
  let listData = filteredData ? [...filteredData] : [...statsData];

  // Apply Sorting
  listData.sort((a, b) => {
    let valA = a[statsSortState.column];
    let valB = b[statsSortState.column];
    
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return statsSortState.direction === 'asc' ? -1 : 1;
    if (valA > valB) return statsSortState.direction === 'asc' ? 1 : -1;
    return 0;
  });

  listData.forEach((item) => {
    // Determine icon based on type

    const variantLabel = item.variantCount > 1 ? item.variantCount : '-';

    // Render Component Row
    html += `
      <div class="unified-list-item variable-row component-item" data-id="${item.id}" style="display: grid; grid-template-columns: 1fr 60px 100px 40px; gap: 12px; align-items: center; padding: 0 12px; height: 28px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 4px; margin-bottom: 4px;">
        
        <!-- Name Column -->
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
            <div class="component-icon-wrapper" style="display: flex; align-items: center; justify-content: center; color:  #a855f7; flex-shrink: 0;">
                     <svg width="12" height="12" viewBox="0 0 12 12" fill="none"  style="rotate: 45deg"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z" stroke="currentColor" stroke-width="1"/></svg>

            </div>
            <span class="component-name text-truncate" title="${item.name}" style="font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.9);">
                ${item.name}
            </span>
        </div>

        <!-- Variants Column -->
        <div style="text-align: right; font-size: 12px; color: rgba(255,255,255,0.6);">
            ${variantLabel}
        </div>

        <!-- Instances Column -->
        <div style="text-align: right; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.9);">
            ${item.count.toLocaleString()}
        </div>
      </div>
    `;  });

  html += `</div></div>`;
  container.innerHTML = html;
}

// Function to render Tailwind Readiness section
function renderTailwindReadinessSection(validation) {
  if (!validation || !validation.invalidGroups || validation.invalidGroups.length === 0) {
    console.log('[DEBUG] renderTailwindReadinessSection: No invalid groups found or validation missing');
    return '';
  }

  console.log('[DEBUG] renderTailwindReadinessSection: Rendering with invalid groups:', validation.invalidGroups.length);

  // Separate standalone variables from grouped variables
  const invalidGroupNames = validation.invalidGroups;
  const allInvalidGroups = validation.groups.filter(g => invalidGroupNames.includes(g.name));
  const standaloneVariables = allInvalidGroups.filter(g => g.isStandalone);
  const groupedVariables = allInvalidGroups.filter(g => !g.isStandalone);

  let html = `
    <!-- Tailwind Readiness Header -->
    <div class="tab-header" style="margin-top: 32px; margin-bottom: 16px;">
      <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px;">
        <h2 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
          <span class="material-symbols-outlined" style="font-size: 22px; color: var(--purple-light);">verified</span>
          Tailwind Readiness <span style="font-size: 10px; opacity: 0.5;">(Rendered: ${new Date().toLocaleTimeString()})</span>
        </h2>
      </div>
      <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0;">
        Variables that need Tailwind v4 compatible namespaces. Fix them individually or by group.
      </p>
    </div>
  `;

  // Render Standalone Variables collapsible (if any exist)
  if (standaloneVariables.length > 0) {
    const standaloneGroupId = 'tailwind-standalone-group';
    // Auto-expand if we just fixed a standalone variable or general fix
    const standaloneIsExpanded = window.justFixedTailwind === true;

    html += `
      <div id="${standaloneGroupId}" class="variable-collection quality-collection" style="margin-bottom: 12px;">
        <div class="collection-header header ${standaloneIsExpanded ? '' : 'collapsed'}" onclick="toggleCollection('${standaloneGroupId}')">
          <div class="collection-info">
            <div class="collection-name-title" style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
              <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">warning</span>
              Standalone Variables
              <span class="subgroup-stats">${standaloneVariables.length}</span>
            </div>
          </div>
          <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
        </div>
        <div id="${standaloneGroupId}-content" class="collection-content ${standaloneIsExpanded ? '' : 'collapsed'}">
          <div style="padding: 12px;">
    `;

    standaloneVariables.forEach((variable, idx) => {
      const itemId = `tailwind-standalone-${idx}`;
      const displayName = SecurityUtils.escapeHTML(variable.name);

      html += `
        <div id="${itemId}-card" class="quality-issue-card" style="margin-bottom: 8px; display: block; padding: 10px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
            <div style="flex: 1; min-width: 0;">
              <div style="font-weight: 500; color: rgba(255, 255, 255, 0.9); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${displayName}
              </div>
   
            </div>
            <div style="display: flex; gap: 6px; align-items: center;">
               <select 
                id="${itemId}-namespace-select" 
                class="token-fix-select" 
                style="padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 4px; color: rgba(255, 255, 255, 0.9); font-size: 12px; cursor: pointer;"
                onchange="updateTailwindActionButtonsState('${itemId}', true)"
              >
                <option value="">Select namespace...</option>
                ${getTailwindNamespaceOptions(variable.name)}
              </select>
              <button 
                id="${itemId}-add-prefix-btn" 
                class="token-fix-apply-btn" 
                onclick="applyTailwindNamespace('${SecurityUtils.escapeHTML(variable.name)}', '${itemId}', 1, 'add-prefix', '${variable.variableId}');refreshData()"
                  style="flex: 1; padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; border-radius: 4px; color: white; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; opacity: 0.5; pointer-events: none;"
                disabled
                title="Add namespace prefix"
              >
                <span class="material-symbols-outlined">add</span>
                Add prefix
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;
  }

  // Render Invalid Groups collapsible (if any exist)
  if (groupedVariables.length > 0) {
    const groupsGroupId = 'tailwind-invalid-groups';
    // Auto-expand if we just fixed something or specifically this group type
    const groupsIsExpanded = window.justFixedTailwind === true;

    html += `
      <div id="${groupsGroupId}" class="variable-collection quality-collection" style="margin-bottom: 12px;">
        <div class="collection-header header ${groupsIsExpanded ? '' : 'collapsed'}" onclick="toggleCollection('${groupsGroupId}')">
          <div class="collection-info">
            <div class="collection-name-title" style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
              <span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">warning</span>
              Invalid Groups
              <span class="subgroup-stats">${groupedVariables.length}</span>
            </div>
          </div>
          <span class="material-symbols-outlined collection-toggle-icon">expand_more</span>
        </div>
        <div id="${groupsGroupId}-content" class="collection-content ${groupsIsExpanded ? '' : 'collapsed'}">
          <div style="padding: 12px;">
    `;

    groupedVariables.forEach((group, idx) => {
      const itemId = `tailwind-group-${idx}`;
      const displayName = SecurityUtils.escapeHTML(group.name);
      const description = `${group.variableCount} variable${group.variableCount !== 1 ? 's' : ''}`;

      html += `
        <div id="${itemId}-card" class="quality-issue-card" style="margin-bottom: 8px; display: block; padding: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: rgba(255, 255, 255, 0.9); font-size: 13px; margin-bottom: 4px;">
                ${displayName}
              </div>
              <div style="font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                ${description}
              </div>
            </div>
            <div style="display: flex; flex-direction: row; gap: 8px; align-items: center; min-width: 300px;">
              <select 
                id="${itemId}-namespace-select" 
                class="token-fix-select" 
                style="padding: 6px 8px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 4px; color: rgba(255, 255, 255, 0.9); font-size: 12px; cursor: pointer;"
                onchange="updateTailwindActionButtonsState('${itemId}', false)"
              >
                <option value="">Select namespace...</option>
                ${getTailwindNamespaceOptions(group.name)}
              </select>
              <div style="display: flex; gap: 8px;">
                <button 
                  id="${itemId}-replace-btn" 
                  class="secondary-action-btn" 
                  onclick="applyTailwindNamespace('${SecurityUtils.escapeHTML(group.name)}', '${itemId}', ${group.variableCount}, 'replace', null)"
                  disabled
                  title="Replace existing group with namespace (e.g., group/var → namespace/var)"
                >
                  <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">find_replace</span>
                  Replace
                </button>
                <button 
                  id="${itemId}-add-prefix-btn" 
                  class="token-fix-apply-btn" 
                  onclick="applyTailwindNamespace('${SecurityUtils.escapeHTML(group.name)}', '${itemId}', ${group.variableCount}, 'add-prefix', null)"
                  style="flex: 1; padding: 6px 12px; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border: none; border-radius: 4px; color: white; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; opacity: 0.5; pointer-events: none;"
                  disabled
                  title="Add namespace as additional prefix (e.g., group/var → namespace/group/var)"
                >
                  <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">add</span>
                  Add Prefix
                </button>
                
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;
  }

  return html;
}

// Helper function to get Tailwind namespace options
function getTailwindNamespaceOptions(currentName) {
  const namespaces = [
    'color', 'font', 'text', 'font-weight', 'tracking', 'leading',
    'breakpoint', 'container', 'spacing', 'radius', 'shadow',
    'inset-shadow', 'drop-shadow', 'blur', 'perspective', 'aspect',
    'ease', 'animate'
  ];
  
  // Try to suggest the best match
  const normalized = currentName.toLowerCase().trim();
  const suggestions = {
    'colors': 'color',
    'colour': 'color',
    'fonts': 'font',
    'font-family': 'font',
    'font-size': 'text',
    'text-size': 'text',
    'size': 'text',
    'weight': 'font-weight',
    'letter-spacing': 'tracking',
    'line-height': 'leading',
    'line': 'leading',
    'space': 'spacing',
    'padding': 'spacing',
    'margin': 'spacing',
    'gap': 'spacing',
    'border-radius': 'radius',
    'rounded': 'radius',
    'shadows': 'shadow',
    'box-shadow': 'shadow',
    'timing': 'ease',
    'timing-function': 'ease',
    'transition': 'ease',
    'animation': 'animate',
    'aspect-ratio': 'aspect',
    'breakpoints': 'breakpoint',
    'screen': 'breakpoint'
  };
  
  const suggested = suggestions[normalized];
  
  let html = '';
  namespaces.forEach(ns => {
    const selected = ns === suggested ? 'selected' : '';
    html += `<option value="${ns}" ${selected}>${ns}</option>`;
  });
  
  return html;
}

// Function to display token coverage results
function displayTokenCoverageResults(result) {
  const resultsContainer = document.getElementById('token-coverage-results');

  if (!result || result.totalIssues === 0) {
    resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px;">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: #22c55e; margin-bottom: 16px;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 style="color: #22c55e; margin-bottom: 8px;">Excellent Token Coverage!</h3>
              <p style="color: rgba(255, 255, 255, 0.8);">All elements on this page use design tokens. No hard-coded values found.</p>
              <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px; margin-top: 8px;">Analyzed ${result.totalNodes} nodes</p>
            </div>
          `;
    return;
  }

  // Calculate statistics
  const categories = ['Layout', 'Fill', 'Stroke', 'Appearance'];
  const issuesByCategory = result.issuesByCategory;

  let html = `
          <!-- Quality Score Card -->
          <div style="margin-bottom: 24px; padding: 24px; background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="material-symbols-outlined" style="color: var(--purple-light);">analytics</span>
                    <span style="font-size: 14px; font-weight: 600; color: var(--neutral-0); letter-spacing: 0.5px;">DESIGN QUALITY SCORE</span>
                </div>
            </div>

            <!-- New Stats Grid: Scanned -> Issues -> Score -->
            <div style="display: grid; grid-template-columns: 1fr 1fr auto; gap: 16px; align-items: stretch; position: relative;">
                
                <!-- 1. Scanned Nodes (Left) -->
                <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12px 16px; text-align: center;">
                    <span style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Scanned Nodes</span>
                    <div id="scanned-nodes-value" style="font-size: 36px; font-weight: 700; color: #d8b4fe; line-height: 1.2;">0</div>
                </div>

                <!-- 2. Total Issues (Middle) -->
                 <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 12px 16px; text-align: center;">
                     <span style="font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Total Issues</span>
                    <div id="total-issues-value" style="font-size: 36px; font-weight: 700; color: #fcd34d; line-height: 1.2;">0</div>
                </div>

                <!-- 3. Gauge (Right) -->
                 <div style="position: relative; width: 100px; height: 100px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; margin-left: auto;">
                    <svg width="100" height="100" viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                        <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none" />
                        <circle id="score-gauge-circle" cx="50" cy="50" r="42" stroke="${getScoreColor(result.qualityScore)}" stroke-width="8" fill="none" 
                                stroke-dasharray="${2 * Math.PI * 42}" 
                                stroke-dashoffset="${2 * Math.PI * 42}" 
                                style="stroke-linecap: round;" />
                    </svg>
                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column;">
                        <span id="score-value" style="font-size: 28px; font-weight: 800; color: white;">0</span>
                    </div>
                </div>
            </div>

            <!-- Detailed View Toggle (Center Bottom) -->
             <div onclick="toggleQualityBreakdown()" style="cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.05); color: rgba(255,255,255,0.4); font-size: 11px; transition: color 0.2s;">
                <span>See details</span>
                <span id="breakdown-toggle-icon" class="material-symbols-outlined" style="font-size: 14px; transition: transform 0.3s;">expand_more</span>
            </div>

            <!-- Detailed Breakdown (Collapsible Grid) -->
            ${
              result.subScores
                ? `
            <div id="quality-breakdown-content" style="display: none; margin-top: 24px; animation: slideDown 0.3s ease-out;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                    ${(() => {
                      // ... (Helper function same as before)
                      const renderRow = (label, score, weight, description) => {
                        const color = getScoreColor(score);
                        return `
                                <div class="quality-breakdown-item" title="${description}" style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <div style="color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 500;">${label}</div>
                                        <div style="font-weight: 700; color: ${color}; font-size: 12px;">${score}%</div>
                                    </div>
                                    <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                                        <div style="width: ${score}%; height: 100%; background: ${color}; border-radius: 2px; transition: width 1s ease 0.5s;"></div>
                                    </div>
                                    <div style="color: rgba(255,255,255,0.3); font-size: 10px; margin-top: 6px;">${weight}</div>
                                </div>
                             `;
                      };

                      const weights = result.weights || {
                          tokenCoverage: '35%',
                          tailwindReadiness: '20%',
                          componentHygiene: '15%',
                          variableHygiene: '15%'
                      };

                      return `
                            ${renderRow('Token Coverage', result.subScores.tokenCoverage, weights.tokenCoverage, 'Percentage of styling properties using variables instead of hardcoded values.')}
                            ${
                              window.gitlabSettings?.exportFormat === 'tailwind-v4'
                                ? renderRow(
                                    'Tailwind Readiness',
                                    result.subScores.tailwindReadiness,
                                    weights.tailwindReadiness,
                                    'Variable names following kebab-case convention for easy Tailwind CSS export.',
                                  )
                                : ''
                            }
                            ${renderRow('Component Hygiene', result.subScores.componentHygiene, weights.componentHygiene, 'Usage of reusable Components and Instances versus raw Frames.')}
                            ${renderRow('Variable Hygiene', result.subScores.variableHygiene, weights.variableHygiene, 'Organization of variables into logical groups using slashes (e.g. color/primary).')}
                        `;
                    })()}
                </div>
            </div>
            `
                : ''
            }
          </div>

          <!-- Trigger Animation Script -->
          <img src="" onerror="
            (function() {
                // Animation Helper
                const animateValue = (id, start, end, duration, delay = 0) => {
                    setTimeout(() => {
                        const obj = document.getElementById(id);
                        if (!obj) return;
                        let startTimestamp = null;
                        const step = (timestamp) => {
                            if (!startTimestamp) startTimestamp = timestamp;
                            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                            obj.innerHTML = Math.floor(progress * (end - start) + start);
                            if (progress < 1) {
                                window.requestAnimationFrame(step);
                            } else {
                                obj.innerHTML = end; // Ensure final value
                            }
                        };
                        window.requestAnimationFrame(step);
                    }, delay);
                };

                // Strictly Sequential Animations
                
                // 1. Scanned Nodes: 0ms -> 800ms
                animateValue('scanned-nodes-value', 0, ${result.totalNodes}, 800, 100);

                // 2. Total Issues: 900ms -> 1700ms (Starts after Scanned finishes)
                animateValue('total-issues-value', 0, ${result.totalIssues}, 800, 900);

                // 3. Score & Gauge: 1800ms -> 2800ms (Starts after Issues finishes)
                
                // Score Text
                animateValue('score-value', 0, ${result.qualityScore !== undefined ? result.qualityScore : 100}, 1000, 1800);

                // Gauge Stroke Animation
                setTimeout(() => {
                    const circle = document.getElementById('score-gauge-circle');
                    if (circle) {
                        const offset = 2 * Math.PI * 42 * (1 - (${result.qualityScore !== undefined ? result.qualityScore : 100} / 100));
                        circle.style.transition = 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)';
                        circle.style.strokeDashoffset = offset;
                    }
                }, 1800);

            })()
          " style="display:none;"/>


          <!-- Token Coverage Header -->
          <div class="tab-header" style="margin-bottom: 16px;">
            <div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 4px;">
               <h2 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
                <span class="material-symbols-outlined" style="font-size: 22px; color: var(--purple-light);">fact_check</span>
                Token Coverage
              </h2>
            </div>
            <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px; margin: 0;">
              Identify elements using hard-coded values instead of design tokens.
            </p>
          </div>
        `;

  // SNAPSHOT STATE: Before wiping innerHTML, capture current state
  const prevScrollY = window.scrollY;
  const prevExpandedCategories = new Set();
  document.querySelectorAll('.quality-collection:not(.collapsed) .collection-header:not(.collapsed)').forEach(el => {
      const parent = el.closest('.quality-collection');
      if (parent && parent.id) prevExpandedCategories.add(parent.id);
  });
  
  // If we have a pending fix, ensure its category is also marked as expanded
  if (window.pendingFixContext && window.pendingFixContext.category) {
      prevExpandedCategories.add(`coverage-${window.pendingFixContext.category}`);
  }

  // Display issues by category
  categories.forEach((category) => {
    const issues = issuesByCategory[category] || [];
    if (issues.length === 0) return;

    const categoryIcons = {
      Layout:
        '<span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">design_services</span>',
      Fill: '<span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">palette</span>',
      Stroke:
        '<span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">edit</span>',
      Appearance:
        '<span class="material-symbols-outlined" style="font-size: 18px; margin-right: 6px; color: var(--purple-light);">auto_awesome</span>',
    };

    const groupId = `coverage-${category}`;
    // Determine initial expanded state based on snapshot
    const isExpanded = prevExpandedCategories.has(groupId); 

    html += `
            <div id="${groupId}" class="variable-collection quality-collection" style="margin-bottom: 12px;">
              <div class="collection-header header ${isExpanded ? '' : 'collapsed'}" onclick="toggleCollection('${groupId}')">
                <div class="collection-info">
                  <div class="collection-name-title" style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                    ${categoryIcons[category]} ${category}
                    <span class="subgroup-stats">${issues.length}</span>
                  </div>
                </div>
                <!-- Fix rotation based on state -->
                <span class="material-symbols-outlined collection-toggle-icon" style="transform: ${isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'}; transition: transform 0.2s;">expand_more</span>
              </div>
              <div id="${groupId}-content" class="collection-content ${isExpanded ? '' : 'collapsed'}">
                <div style="padding: 12px;">
                  <div id="${groupId}-issues-container">
          `;

    // Lazy Loading Implementation: Only render first 10 issues initially
    const initialRenderCount = 10;
    const issuesToRender = issues.slice(0, initialRenderCount);
    const remainingIssues = issues.slice(initialRenderCount);

    // Function to render an issue card (helper string builder)
    // Function to render an issue card (helper string builder)
    const renderIssueCard = (issue, issueIdx, realIdx) => {
      const issueId = `issue-${category}-${realIdx}`;

      // Group matches
      const exactMatches = (issue.matchingVariables || []).filter(
        (v) => v.matchType === 'EXACT' || !v.matchType,
      );
      const nearMatches = (issue.matchingVariables || []).filter((v) => v.matchType === 'NEAR');

      // Auto-selection Logic
      let selectedId = '';
      let autoSelectedType = '';

      if (exactMatches.length === 1) {
        selectedId = exactMatches[0].id; // Select the single exact match
        autoSelectedType = 'exact';
      } else if (exactMatches.length === 0 && nearMatches.length === 0) {
        selectedId = 'create-new'; // Default to create new if no matches
        autoSelectedType = 'create-new';
      }

      // Generate Badges
      let badgesHtml = '';
      if (exactMatches.length > 0) {
        badgesHtml += `<span class="match-badge match-badge-exact">${exactMatches.length} Exact</span>`;
      }
      if (nearMatches.length > 0) {
        badgesHtml += `<span class="match-badge match-badge-near">${nearMatches.length} Near</span>`;
      }

      let cardHtml = `
              <div id="${issueId}-card" class="quality-issue-card" style="margin-bottom: 4px; display: block; padding: 0; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 8px;">
                <!-- Accordion Header -->
                <div class="quality-issue-header" onclick="toggleIssueCard('${issueId}')" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px;">
                  <div style="flex: 1; display: flex; align-items: center; gap: 12px; overflow: hidden;">
                    <!-- Property Name -->
                    <div style="font-weight: 600; color: rgba(255, 255, 255, 0.9); font-size: 13px; white-space: nowrap;">
                      ${issue.property}
                    </div>

                    <!-- Value (Inline) -->
                    <div style="font-family: 'SF Mono', Monaco, monospace; color: #a78bfa; font-size: 12px; display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${SecurityUtils.escapeHTML(issue.value)}
                        ${(function () {
                          const val = issue.value;
                          // Basic check for Hex, RGB, RGBA
                          const isColor = /^#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?$|^rgb/.test(
                            val,
                          );
                          if (isColor) {
                            return `<div style="width: 16px; height: 16px; border-radius: 4px; background: ${val}; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; margin-left: 6px;"></div>`;
                          }
                          return '';
                        })()}
                    </div>

                    <!-- Badges (Toggleable via CSS) -->
                    ${badgesHtml ? `<div class="match-badges-container" style="display: flex; gap: 4px; margin-left: 4px;">${badgesHtml}</div>` : ''}
                  </div>
                  
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 4px; opacity: 0.5;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">layers</span>
                        <span style="font-size: 11px; font-weight: 500;">${issue.totalNodes || issue.count}</span>
                    </div>
                    <span id="${issueId}-chevron" class="material-symbols-outlined quality-issue-chevron" style="font-size: 18px; opacity: 0.7;">chevron_right</span>
                  </div>
                </div>

                <!-- Accordion Body (Hidden by default) -->
                <div id="${issueId}-body" class="quality-issue-body issue-body">
            `;

      // Fix section
      cardHtml += `
                <div class="issue-fix-section">
                  <div class="issue-fix-header">
                    <span class="material-symbols-outlined issue-fix-icon">auto_fix_high</span>
                    <span class="issue-fix-label">Fix Available</span>
                  </div>
            `;

      // Check if we have ANY matches
      if (exactMatches.length === 0 && nearMatches.length === 0) {
        // NO Matches - Show "Create New Variable" Button directly
        cardHtml += `
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button 
                      onclick="handleCreateNewVariable('${issueId}')"
                      class="btn-create-variable"
                    >
                      <span class="material-symbols-outlined" style="font-size: 16px;">add_circle</span>
                      Create New Variable
                    </button>
                  </div>
                </div>
            `;
      } else {
        // HAVE Matches - Show Dropdown
        cardHtml += `
                  <div class="fix-actions-row">
                    <select id="${issueId}-var-select" class="token-fix-select select-fix-variable" onchange="updateApplyButtonState('${issueId}')">
                      <option value="">Select a token...</option>
            `;

        if (exactMatches.length > 0) {
          cardHtml += `<optgroup label="Exact Matches">`;
          exactMatches.forEach((v) => {
            const isSelected = v.id === selectedId ? 'selected' : '';
            cardHtml += `<option value="${v.id}" ${isSelected}>${v.collectionName} / ${v.name}</option>`;
          });
          cardHtml += `</optgroup>`;
        }

        if (nearMatches.length > 0) {
          cardHtml += `<optgroup label="Near Matches (±2px)">`;
          nearMatches.forEach((v) => {
            cardHtml += `<option value="${v.id}">~ ${v.collectionName} / ${v.name} (${v.resolvedValue})</option>`;
          });
          cardHtml += `</optgroup>`;
        }

        // Create new variable option (still keep it in dropdown for consistency if matches exist)
        cardHtml += `
                      <option value="" disabled>──────────</option>
                      <option value="create-new" style="font-weight: bold; color: #a78bfa;">+ Create new variable...</option>
                    </select>
                    <button 
                      id="${issueId}-apply-btn" 
                      class="token-fix-apply-btn btn-apply-fix" 
                      onclick="applyTokenToSelection('${issueId}', '${issue.property}', '${category}')"
                      data-original-onclick="applyTokenToSelection('${issueId}', '${issue.property}', '${category}')"
                      disabled
                    >
                      <span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span>
                      Apply
                    </button>
                  </div>
                </div>
            `;
      }

      // Trigger update of button state slightly after rendering if auto-selected
      if (selectedId && selectedId !== 'create-new') {
        setTimeout(() => {
          updateApplyButtonState(issueId);
        }, 0);
      }

       cardHtml += `
                <div style="margin-top: 8px;">
                  <div class="nodes-list-header">
                    <label class="label-checkbox">
                        <input type="checkbox" id="${issueId}-select-all" onchange="toggleAllOccurrences('${issueId}')" style="cursor: pointer;">
                        <span class="label-text-uppercase">Select All (${issue.nodeNames.length} nodes)</span>
                    </label>
                  </div>
                  <div class="quality-nodes-list">
            `;

      // Nodes list logic - Group by Component/Frame
      const componentGroups = {};
      issue.nodeNames.forEach((nodeName, idx) => {
        const frameName = issue.nodeFrames ? issue.nodeFrames[idx] : 'Unknown Frame';
        if (!componentGroups[frameName]) {
          componentGroups[frameName] = { count: 0, ids: [], frame: frameName, instances: [] };
        }
        componentGroups[frameName].count++;
        componentGroups[frameName].ids.push(issue.nodeIds[idx]);
        componentGroups[frameName].instances.push({
          id: issue.nodeIds[idx],
          name: nodeName,
        });
      });

      Object.values(componentGroups).forEach((data, groupIdx) => {
        const groupId = `component-group-${category}-${realIdx}-${groupIdx}`;
        const hasMultiple = data.count > 0; // Always show header for consistency, or check > 1 if desired.
        // Determine icon based on name (approximate check)
        const isComponent = data.frame.includes('Component') || data.frame === 'Unknown Frame';
        const icon = isComponent ? 'grid_view' : 'frame';

        cardHtml += `
                <div class="quality-node-item" data-issue-id="${issueId}">
                  <div class="node-header" onclick="toggleQualityNodeGroup('${groupId}')" style="display: flex; align-items: center; padding: 6px 0; cursor: pointer;">
                    <input type="checkbox" class="occurrence-checkbox" data-issue-id="${issueId}" data-node-ids='${SecurityUtils.escapeHTML(JSON.stringify(data.ids))}' onchange="updateApplyButtonState('${issueId}')" style="margin-right: 8px; cursor: pointer;" onclick="event.stopPropagation();">
                    ${isComponent ? ' <svg width="12" height="12" viewBox="0 0 12 12" fill="none"  style="rotate: 45deg"><path d="M1 1h4v4H1zM7 1h4v4H7zM1 7h4v4H1zM7 7h4v4H7z" stroke="currentColor" stroke-width="1"/></svg>' :
                  '<span class="material-symbols-outlined node-icon" style="font-size: 16px; margin-right: 8px; opacity: 0.7; color: #a78bfa;">grid_3x3</span>'
              }
                    <span class="node-name" title="${SecurityUtils.escapeHTML(data.frame)}" style="flex: 1; font-size: 12px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: rgba(255,255,255,0.85);">${data.frame}</span>
                    <span class="list-badge" style="height: 16px; font-size: 10px; margin-right: 4px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6);">${data.count}</span>
                    <button class="nav-icon" style="width: 24px; height: 24px; border: none; background: transparent; color: rgba(255,255,255,0.4);" id="${groupId}-toggle">
                         <span class="material-symbols-outlined" style="font-size: 18px;">expand_more</span>
                    </button>
                  </div>
                  
                  <div id="${groupId}" class="node-instances" style="display: none; padding-left: 28px; margin-top: 2px; border-left: 1px solid rgba(255,255,255,0.05); margin-left: 9px;">
                      ${data.instances
                        .map(
                          (inst, i) => `
                        <div class="instance-row" style="display: flex; align-items: center; justify-content: space-between; padding: 4px 0;">
                          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                              <span class="material-symbols-outlined" style="font-size: 14px; opacity: 0.5;">layers</span>
                              <span class="instance-label" title="${SecurityUtils.escapeHTML(inst.name)}" style="font-size: 11px; color: rgba(255,255,255,0.6); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${SecurityUtils.escapeHTML(inst.name)}</span>
                          </div>
                          <button class="node-focus-btn" onclick="window.focusOnNode('${inst.id}')" style="opacity: 0.5; hover: opacity: 1;"><span class="material-symbols-outlined" style="font-size: 16px;">target</span></button>
                        </div>
                      `,
                        )
                        .join('')}
                  </div>
                </div>
              `;
      });

      cardHtml += `                  </div> <!-- End quality-nodes-list -->
                </div> <!-- End Accordion Body Wrapper -->
              </div> <!-- End Accordion Body -->
              </div> <!-- End Card -->
            `;
      return cardHtml;
    };

    // Make toggle function available globally
    window.toggleIssueCard = function (issueId) {
      const card = document.getElementById(`${issueId}-card`);
      const body = document.getElementById(`${issueId}-body`);

      if (card && body) {
        const isHidden = body.style.display === 'none';
        body.style.display = isHidden ? 'block' : 'none';

        if (isHidden) {
          card.classList.add('expanded');
        } else {
          card.classList.remove('expanded');
        }
      }
    };

    // Render initial batch
    issuesToRender.forEach((issue, idx) => {
      html += renderIssueCard(issue, idx, idx);
    });

    html += `</div>`; // Close issues container

    // Add "Load More" button if needed
    if (remainingIssues.length > 0) {
      html += `
              <div id="${groupId}-load-more" style="text-align: center; padding-top: 8px;">
                <button onclick="loadMoreIssues('${category}', ${initialRenderCount})" class="secondary-button" style="width: 100%; font-size: 12px; padding: 8px;">
                  Load ${remainingIssues.length} more issues
                </button>
              </div>
            `;

      // Store remaining issues in global map for lazy loading
      window.remainingIssuesRaw = window.remainingIssuesRaw || {};
      window.remainingIssuesRaw[category] = remainingIssues;

      // Make helper available globally
      window.renderIssueCard = renderIssueCard;
    }

    html += `
                </div>
              </div>
            </div>
          `;
  });

  // Add Tailwind Readiness section if Tailwind v4 is selected
  const isTailwindV4Selected = window.gitSettings?.exportFormat === 'tailwind-v4' || window.gitlabSettings?.exportFormat === 'tailwind-v4';
  
  if (isTailwindV4Selected && window.tailwindV4Validation && window.tailwindV4Validation.invalidGroups && window.tailwindV4Validation.invalidGroups.length > 0) {
    html += renderTailwindReadinessSection(window.tailwindV4Validation);
  }

  resultsContainer.innerHTML = html;
  
  // RESTORE STATE: Immediately restore scroll position
  if (prevScrollY > 0) {
      window.scrollTo(0, prevScrollY);
  }

  // Add event listeners for variable dropdowns
  categories.forEach((category) => {
    const issues = issuesByCategory[category] || [];
    // Only initial batch needs listeners here, others handled in loadMore
    const initialRenderCount = 10;
    issues.slice(0, initialRenderCount).forEach((issue, issueIdx) => {
      const issueId = `issue-${category}-${issueIdx}`;
      setupIssueListeners(issueId);
    });
  });

  // Restore state if we have a pending issue fix
  // Restore state if we have a pending issue fix
  if (window.pendingFixIssueId) {
    console.log('Restoring view for pending issue:', window.pendingFixIssueId);
    setTimeout(() => {
      let pendingId = window.pendingFixIssueId;
      
      // UPGRADE: Attempt to find better pendingId using context if available
      if (window.pendingFixContext) {
          const { category, value } = window.pendingFixContext;
          if (category && value && result && result.issuesByCategory && result.issuesByCategory[category]) {
              const issues = result.issuesByCategory[category];
              // Find index of issue with matching value
              const foundIdx = issues.findIndex(i => i.value === value);
              if (foundIdx !== -1) {
                  pendingId = `issue-${category}-${foundIdx}`;
                  console.log(`Found equivalent issue for restoration: ${pendingId} (Context match)`);
              }
          }
      }
      
      // Attempt to find the card. If not found, try to force lazy load.
      let card = document.getElementById(`${pendingId}-card`);
      
      if (!card) {
          // Parse ID to deduce category and index
          // ID format: issue-{Category}-{Index}
          const parts = pendingId.split('-');
          
          if (parts.length >= 3) {
             const indexStr = parts[parts.length - 1];
             const targetIndex = parseInt(indexStr);
             const category = parts.slice(1, parts.length - 1).join('-');
             
             if (!isNaN(targetIndex) && category && window.remainingIssuesRaw && window.remainingIssuesRaw[category]) {
                 console.log(`Pending issue ${pendingId} not found. Attempting to force load for category ${category}, target index ${targetIndex}`);
                 
                 // Keep loading until we cover the index
                 let safetyCounter = 0;
                 while (!document.getElementById(`${pendingId}-card`) && safetyCounter < 50) {
                     const container = document.getElementById(`coverage-${category}-issues-container`);
                     if (!container) break;
                     const renderedCount = container.querySelectorAll('.quality-issue-card').length;
                     
                     // If we have rendered past the target index, stop (it should be there if it exists)
                     if (renderedCount > targetIndex) break; 
                     
                     // If no more issues to load, break
                     if (!window.remainingIssuesRaw[category] || window.remainingIssuesRaw[category].length === 0) break;

                     // Trigger load more
                     window.loadMoreIssues(category, renderedCount);
                     safetyCounter++;
                 }
                 
                 // Update card reference
                 card = document.getElementById(`${pendingId}-card`);
             }
          }
      }
      
      
      // 1. Expand the specific Issue Card
      // card variable is already defined and updated above
      const body = document.getElementById(`${pendingId}-body`);
      if (card && body) {
          body.style.display = 'block';
          card.classList.add('expanded');
          const chevron = document.getElementById(`${pendingId}-chevron`);
          if (chevron) {
               chevron.style.transform = 'rotate(90deg)';
               chevron.style.color = 'rgba(255, 255, 255, 0.9)';
          }
      }

      // 2. Find element to scroll to (either the card or a specific node inside)
      const element = card || document.querySelector(`[data-issue-id="${pendingId}"]`);

      if (element) {
        // 3. Expand all parent accordions/groups (Categories)
        let parent = element.parentElement;
        while (parent) {
          // Expand Collection Content (Category)
          if (parent.classList.contains('collection-content')) {
            parent.classList.remove('collapsed');
            const collectionHeader = parent.previousElementSibling;
            if (collectionHeader && collectionHeader.classList.contains('collection-header')) {
              collectionHeader.classList.remove('collapsed');
              // Fix icon rotation
              const icon = collectionHeader.querySelector('.collection-toggle-icon');
              if (icon) icon.style.transform = 'rotate(0deg)';
            }
          }

          parent = parent.parentElement;
          if (parent === document.body) break;
        }

        // 4. Scroll into view
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
             // 5. Highlight briefly
            element.style.transition = 'background-color 0.5s ease';
            const originalBg = element.style.backgroundColor;
            element.style.backgroundColor = 'rgba(139, 92, 246, 0.2)';
            setTimeout(() => {
            element.style.backgroundColor = originalBg;
            }, 1500);

            // 6. Auto-select the newly created variable if available
            if (window.pendingFixContext && window.pendingFixContext.fullVariableName) {
                const targetName = window.pendingFixContext.fullVariableName;
                // Find the dropdown in this card
                const selectId = `${pendingId}-var-select`;
                const select = document.getElementById(selectId);
                
                if (select) {
                     // Iterate options to find matching text or value (often ID is used as value, but we might have mapped it)
                     // Since we don't know the exact ID of the new variable easily without a full re-scan mapping, 
                     // we look for the option text which usually contains the name.
                     for (let i = 0; i < select.options.length; i++) {
                         if (select.options[i].text.includes(targetName)) {
                             select.selectedIndex = i;
                             // Trigger change event if needed
                             const event = new Event('change');
                             select.dispatchEvent(event);
                             console.log(`Auto-selected variable: ${targetName}`);
                             break;
                         }
                     }
                }
            }
        }, 100);
      }

      // Clear state
      window.pendingFixIssueId = null;
    }, 300); // Small delay to ensure render is complete
  }
}

// Helper to toggle Quality Breakdown visibility
window.toggleQualityBreakdown = function () {
  const content = document.getElementById('quality-breakdown-content');
  const icon = document.getElementById('breakdown-toggle-icon');

  if (content && icon) {
    const isHidden = content.style.display === 'none';
    content.style.display = isHidden ? 'block' : 'none';
    icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
  }
};

// Helper to setup listeners
function setupIssueListeners(issueId) {
  const varSelect = document.getElementById(`${issueId}-var-select`);
  if (varSelect) {
    varSelect.addEventListener('change', (e) => {
      if (e.target.value === 'create-new') {
        // Handle create new variable
        handleCreateNewVariable(issueId);
      } else {
        updateApplyButtonState(issueId);
      }
    });
  }
}

// Lazy load handler
window.loadMoreIssues = function (category, currentCount) {
  if (!window.remainingIssuesRaw || !window.remainingIssuesRaw[category]) return;

  const container = document.getElementById(`coverage-${category}-issues-container`);
  const loadMoreContainer = document.getElementById(`coverage-${category}-load-more`);
  const batchSize = 20;
  const issues = window.remainingIssuesRaw[category];
  const batch = issues.slice(0, batchSize);
  const remaining = issues.slice(batchSize);

  // Update global state
  window.remainingIssuesRaw[category] = remaining;

  // Render batch
  const tempDiv = document.createElement('div');
  batch.forEach((issue, idx) => {
    const realIdx = currentCount + idx;
    tempDiv.innerHTML += window.renderIssueCard(issue, idx, realIdx);
  });

  // Append to container
  while (tempDiv.firstChild) {
    const child = tempDiv.firstChild;
    tempDiv.removeChild(child); // Remove from tempDiv to progress loop

    if (child.nodeType !== 1) {
      // Skip text nodes / comments
      container.appendChild(child);
      continue;
    }

    container.appendChild(child);

    // Setup listeners for new elements
    // Need to find issueId from the DOM or calculate it
    // The issueId is `issue-${category}-${realIdx}`
    const issueIdRegex = new RegExp(`id="(issue-${category}-\\d+)-var-select"`);
    const match = child.innerHTML.match(issueIdRegex);
    if (match) {
      // Listener setup needs to happen after append?
      // Actually, we can just select by ID after append
    }
  }

  // Setup listeners for the new batch
  batch.forEach((_, idx) => {
    const realIdx = currentCount + idx;
    setupIssueListeners(`issue-${category}-${realIdx}`);
  });

  // Update or remove load more button
  if (remaining.length > 0) {
    loadMoreContainer.innerHTML = `
             <button onclick="loadMoreIssues('${category}', ${currentCount + batchSize})" class="secondary-button" style="width: 100%; font-size: 12px; padding: 8px;">
               Load ${remaining.length} more issues
             </button>
          `;
  } else {
    loadMoreContainer.remove();
  }
};

// Handle Create New Variable
// Handle Create New Variable
window.handleCreateNewVariable = function (issueId) {
  console.log('handleCreateNewVariable triggered for:', issueId);

  // Robust finding of the card
  let card = null;

  // Try finding by ID first (most robust)
  const cardElement = document.getElementById(`${issueId}-card`);
  if (cardElement) {
    card = cardElement;
  } else {
    // Fallback to select lookup (if it exists)
    const select = document.getElementById(`${issueId}-var-select`);
    if (select) {
      card = select.closest('.quality-issue-card');
    } else {
      // fallback to attribute
      card = document.querySelector(`[data-issue-id="${issueId}"]`)?.closest('.quality-issue-card');
    }
  }

  // Try to find value display
  let valueDisplay =
    card?.querySelector('.issue-value-display')?.textContent ||
    card?.querySelector('div[style*="SF Mono"]')?.textContent ||
    card?.querySelector('div[style*="monospace"]')?.textContent;

  if (valueDisplay) {
    valueDisplay = valueDisplay.trim();
  } else {
      // Last resort: extract from the card content itself if structure is predictable,
      // or rely on a data attribute if we added one (we didn't yet, but good idea for future).
      // For now, looking for the mono-styled text is the best bet.
  }

  console.log('Found value to create:', valueDisplay);

  if (!valueDisplay) {
    console.error('Could not find value display element');
    alert('Error: Could not determine the value to create a variable for.');
    return;
  }

  // Open custom modal instead of prompt
  openCreateVariableModal(valueDisplay, issueId);
};

// Modal functions for Variable Creation
window.openCreateVariableModal = function (value, issueId) {
  const modal = document.getElementById('create-variable-modal');
  if (!modal) return;

  document.getElementById('create-var-value-display').textContent = value;
  document.getElementById('create-var-issue-id').value = issueId;
  document.getElementById('create-var-name').value = '';

  // Reset new inputs
  const newColInput = document.getElementById('create-var-new-collection');
  if (newColInput) newColInput.style.display = 'none';
  const newGroupInput = document.getElementById('create-var-new-group');
  if (newGroupInput) newGroupInput.style.display = 'none';

  // Populate Collections
  const collectionSelect = document.getElementById('create-var-collection');
  if (collectionSelect) {
    collectionSelect.innerHTML = '';

    // Use global variables data if available, or empty array
    const collections = window.globalVariablesData || [];

    collections.forEach((col) => {
      const opt = document.createElement('option');
      opt.value = col.name;
      opt.text = col.name;
      collectionSelect.appendChild(opt);
    });

    // Add "Create New" option
    const createNewOpt = document.createElement('option');
    createNewOpt.value = 'create-new';
    createNewOpt.text = 'Create New Collection...';
    collectionSelect.appendChild(createNewOpt);

    // Select first one by default if exists
    if (collections.length > 0) {
      collectionSelect.selectedIndex = 0;
    }

    // Trigger group update
    handleCollectionChange();
  }

  modal.style.display = 'block';
  document.body.classList.add('modal-open');

  setTimeout(() => {
    if (collectionSelect && collectionSelect.value === 'create-new') {
      document.getElementById('create-var-new-collection').focus();
    } else {
      document.getElementById('create-var-name').focus();
    }
  }, 100);
};

window.handleCollectionChange = function () {
  const colSelect = document.getElementById('create-var-collection');
  const groupSelect = document.getElementById('create-var-group');
  const newColInput = document.getElementById('create-var-new-collection');

  if (!colSelect || !groupSelect) return;

  const selectedColName = colSelect.value;

  // Toggle new collection input
  if (selectedColName === 'create-new') {
    newColInput.style.display = 'block';
    newColInput.focus();
    // Reset groups
    groupSelect.innerHTML =
      '<option value="">(No Group)</option><option value="create-new">Create New Group...</option>';
    return; // No existing groups to show
  } else {
    newColInput.style.display = 'none';
  }

  // Populate Groups for selected collection
  groupSelect.innerHTML = '';
  groupSelect.appendChild(new Option('(No Group)', ''));

  const collections = window.globalVariablesData || [];
  const selectedCol = collections.find((c) => c.name === selectedColName);

  if (selectedCol && selectedCol.variables) {
    const groups = new Set();
    selectedCol.variables.forEach((v) => {
      if (v.name.includes('/')) {
        // Extract group path (everything before last slash)
        const parts = v.name.split('/');
        parts.pop(); // Remove variable name
        const groupName = parts.join('/');
        groups.add(groupName);
      }
    });

    // Add existing groups
    Array.from(groups)
      .sort()
      .forEach((g) => {
        groupSelect.appendChild(new Option(g, g));
      });
  }

  // Always add create new group option
  groupSelect.appendChild(new Option('Create New Group...', 'create-new'));

  // Trigger group change to set input visibility
  handleGroupChange();
};

window.handleGroupChange = function () {
  const groupSelect = document.getElementById('create-var-group');
  const newGroupInput = document.getElementById('create-var-new-group');

  if (groupSelect.value === 'create-new') {
    newGroupInput.style.display = 'block';
    newGroupInput.focus();
  } else {
    newGroupInput.style.display = 'none';
  }
};

window.closeCreateVariableModal = function () {
  const modal = document.getElementById('create-variable-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
    // Only clear pending state if we are NOT submitting (submit sets it again/keeps it)
    // Actually, submit calls close, so we should be careful.
    // Let's NOT clear it here. Let the render logic consume and clear it.
    // Or clear it if we are cancelling?
    // If user closes modal manually, we don't expect a reload, so it doesn't matter.
  }

  const issueId = document.getElementById('create-var-issue-id').value;
  if (issueId) {
    const select = document.getElementById(`${issueId}-var-select`);
    if (select && select.value === 'create-new') {
      select.value = '';
    }
  }
};

window.submitCreateVariable = function () {
  const nameInput = document.getElementById('create-var-name').value.trim();
  const value = document.getElementById('create-var-value-display').textContent.trim();
  const issueId = document.getElementById('create-var-issue-id').value;

  // Collection Logic
  const colSelect = document.getElementById('create-var-collection');
  let collectionName = colSelect.value;
  if (collectionName === 'create-new') {
    collectionName = document.getElementById('create-var-new-collection').value.trim();
    if (!collectionName) {
      alert('Please enter a name for the new collection.');
      return;
    }
  }

  // Group Logic
  const groupSelect = document.getElementById('create-var-group');
  let groupName = groupSelect.value;
  if (groupName === 'create-new') {
    groupName = document.getElementById('create-var-new-group').value.trim();
    if (!groupName) {
      alert('Please enter a name for the new group.');
      return;
    }
  }

  if (!nameInput) {
    alert('Please enter a variable name.');
    return;
  }

  // VALIDATION: Check for invalid characters (dots)
  if (nameInput.includes('.')) {
    alert('Variable names cannot contain dots (.). Please use hyphens (-) or slashes (/) instead.');
    // Optional: Auto-fix focus
    const input = document.getElementById('create-var-name');
    if (input) {
        input.value = nameInput.replace(/\./g, '-');
        input.focus();
    }
    return;
  }

  // Construct full variable name
  let fullVariableName = nameInput;
  if (groupName) {
    // Ensure clean slash handling
    fullVariableName = `${groupName}/${nameInput}`;
  }

  console.log('Creating variable:', { fullVariableName, value, collectionName });

  // Set pending state to persist expansion after reload
  window.pendingFixIssueId = issueId;
  
  // Extract category from issueId (format: issue-{Category}-{Index})
  const parts = issueId.split('-');
  let category = '';
  if (parts.length >= 3) {
      category = parts.slice(1, parts.length - 1).join('-');
  }
  
  window.pendingFixContext = {
      category: category,
      value: value,
      originalId: issueId,
      fullVariableName: fullVariableName // Store for auto-selection
  };

  // Send to backend
  parent.postMessage(
    {
      pluginMessage: {
        type: 'create-variable',
        name: fullVariableName,
        value: value,
        collectionName: collectionName,
        context: { issueId: issueId },
      },
    },
    '*',
  );

  // Update UI
  const select = document.getElementById(`${issueId}-var-select`);
  if (select) {
    const opt = document.createElement('option');
    opt.text = `Creating ${fullVariableName}...`;
    opt.value = 'creating';
    select.add(opt);
    select.value = 'creating';
    select.disabled = true;
  }

  closeCreateVariableModal();
};

// Function to open rename dialog for Tailwind variables
// Update button states when namespace is selected
window.updateTailwindActionButtonsState = function(itemId, isStandalone) {
  const select = document.getElementById(`${itemId}-namespace-select`);
  const addPrefixBtn = document.getElementById(`${itemId}-add-prefix-btn`);
  const replaceBtn = document.getElementById(`${itemId}-replace-btn`);

  const hasSelection = select && select.value;

  if (addPrefixBtn) {
    if (hasSelection) {
      addPrefixBtn.disabled = false;
      addPrefixBtn.style.opacity = '1';
      addPrefixBtn.style.pointerEvents = 'auto';
    } else {
      addPrefixBtn.disabled = true;
      addPrefixBtn.style.opacity = '0.5';
      addPrefixBtn.style.pointerEvents = 'none';
    }
  }

  if (replaceBtn) {
    if (hasSelection) {
      replaceBtn.disabled = false;
      replaceBtn.style.opacity = '1';
      replaceBtn.style.pointerEvents = 'auto';
    } else {
      replaceBtn.disabled = true;
      replaceBtn.style.opacity = '0.5';
      replaceBtn.style.pointerEvents = 'none';
    }
  }
};

// Apply Tailwind namespace action
window.applyTailwindNamespace = function(currentGroupName, itemId, variableCount, action, variableId) {
  const select = document.getElementById(`${itemId}-namespace-select`);
  if (!select || !select.value) {
    alert('Please select a namespace first.');
    return;
  }
  
  const newNamespace = select.value;

  // For individual standalone variables, get the variable ID from the select if not provided
  const actualVariableId = variableId || select.dataset.variableId || null;
  const isIndividualVariable = actualVariableId !== null;

  // Build appropriate confirmation message
  let message = '';
  let exampleBefore = '';
  let exampleAfter = '';

  if (isIndividualVariable) {
    // Individual standalone variable
    exampleBefore = currentGroupName;
    exampleAfter = `${newNamespace}/${currentGroupName}`;
    message = `This will add the "${newNamespace}" namespace to this variable.\n\n"${exampleBefore}" → "${exampleAfter}"\n\nContinue?`;
  } else if (action === 'add-prefix') {
    exampleBefore = `${currentGroupName}/primary`;
    exampleAfter = `${newNamespace}/${currentGroupName}/primary`;
    message = `This will add "${newNamespace}" as an additional prefix to all variables in the "${currentGroupName}" group.\n\nExample: "${exampleBefore}" → "${exampleAfter}"\n\nThis action will affect ${variableCount} variable(s).\n\nContinue?`;
  } else {
    exampleBefore = `${currentGroupName}/primary`;
    exampleAfter = `${newNamespace}/primary`;
    message = `This will replace the "${currentGroupName}" group with the "${newNamespace}" namespace.\n\nExample: "${exampleBefore}" → "${exampleAfter}"\n\nThis action will affect ${variableCount} variable(s).\n\nContinue?`;
  }

  if (!confirm(message)) {
    return;
  }
  
  // Save scroll position before processing
  window.tailwindScrollPosition = window.scrollY || document.documentElement.scrollTop;

  // Set flag to prevent re-rendering during the fix process
  // This prevents layout shift when tailwind-v4-validation message arrives
  window.tailwindFixInProgress = true;
  window.tailwindFixedGroupName = currentGroupName;

  // Ensure the collapsible is open - find the parent collection
  const itemCard = document.getElementById(`${itemId}-card`);
  if (itemCard) {
    const collection = itemCard.closest('.quality-collection');
    if (collection) {
      const content = collection.querySelector('.collection-content');
      const header = collection.querySelector('.collection-header');

      // Ensure it's expanded
      if (content && content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
      }
      if (header && header.classList.contains('collapsed')) {
        header.classList.remove('collapsed');
      }

      // Save the collection ID for later restoration
      window.tailwindActiveCollectionId = collection.id;
    }
  }

  // Save the item ID for removal after success
  window.tailwindProcessingItemId = itemId;

  // Disable buttons and show loading state
  const addPrefixBtn = document.getElementById(`${itemId}-add-prefix-btn`);
  const replaceBtn = document.getElementById(`${itemId}-replace-btn`);

  if (addPrefixBtn) {
    addPrefixBtn.disabled = true;
    addPrefixBtn.style.opacity = '0.5';
    addPrefixBtn.style.pointerEvents = 'none';
    if (action === 'add-prefix' || isIndividualVariable) {
      addPrefixBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">hourglass_empty</span> Processing...';
    }
  }

  if (replaceBtn) {
    replaceBtn.disabled = true;
    replaceBtn.style.opacity = '0.5';
    replaceBtn.style.pointerEvents = 'none';
    if (action === 'replace') {
      replaceBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">hourglass_empty</span> Processing...';
    }
  }

  // Build message payload
  const payload = {
    type: 'rename-variable-group',
    oldGroupName: currentGroupName,
    newGroupName: newNamespace,
    action: action,
  };

  // Add variableId for individual variable operations
  if (actualVariableId) {
    payload.variableId = actualVariableId;
  }

  // Send rename request to plugin
  parent.postMessage(
    {
      pluginMessage: payload,
    },
    '*',
  );
  
  // Save state for restoration
  window.lastActiveTailwindGroup = currentGroupName;
};

function expandAllQuality() {
  console.log('Expanding all quality groups');
  const headers = document.querySelectorAll('.quality-collection .collection-header.collapsed');
  headers.forEach((header) => {
    const collection = header.closest('.quality-collection');
    if (collection && collection.id) {
      toggleCollection(collection.id);
    }
  });
}

function collapseAllQuality() {
  console.log('Collapsing all quality groups');
  const headers = document.querySelectorAll(
    '.quality-collection .collection-header:not(.collapsed)',
  );
  headers.forEach((header) => {
    const collection = header.closest('.quality-collection');
    if (collection && collection.id) {
      toggleCollection(collection.id);
    }
  });
}

// Function to open user guide modal
function openUserGuide() {
  document.getElementById('user-guide-modal').style.display = 'block';
  document.body.classList.add('modal-open');
}

// Function to close user guide modal
function closeUserGuide() {
  document.getElementById('user-guide-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Function to open GitHub with specific feedback type
function openGitHubFeedback(type) {
  // Get plugin version from the UI
  const pluginVersion = '1.0.0'; // You might want to dynamically get this
  const figmaVersion = 'Figma Desktop'; // This is a placeholder

  let issueTitle = '';
  let labels = 'feedback';
  let checkboxes = '';

  switch (type) {
    case 'bug':
      issueTitle = '[BUG] ';
      labels = 'bug,feedback';
      checkboxes = `- [x] Bug Report
- [ ] Feature Request
- [ ] Improvement Suggestion
- [ ] General Feedback`;
      break;
    case 'feature':
      issueTitle = '[FEATURE REQUEST] ';
      labels = 'enhancement,feedback';
      checkboxes = `- [ ] Bug Report
- [x] Feature Request
- [ ] Improvement Suggestion
- [ ] General Feedback`;
      break;
    case 'general':
      issueTitle = '[FEEDBACK] ';
      labels = 'feedback';
      checkboxes = `- [ ] Bug Report
- [ ] Feature Request
- [ ] Improvement Suggestion
- [x] General Feedback`;
      break;
  }

  // Create the issue body with pre-filled information
  const issueBody = encodeURIComponent(`## Feedback Type
<!-- Please select one -->
${checkboxes}

## Your Feedback
<!-- Please describe your feedback in detail -->


## Context
<!-- Optional: What were you trying to do when you thought of this feedback? -->


## Additional Information
<!-- Optional: Any mockups, examples, or additional context -->


---
*Plugin Version:* ${pluginVersion}
*Figma Version:* ${figmaVersion}`);

  const encodedTitle = encodeURIComponent(issueTitle);
  const githubUrl = `https://github.com/laurinscheuber/Bridgy-Plugin/issues/new?title=${encodedTitle}&body=${issueBody}&labels=${labels}`;

  // Modal no longer exists, no need to close it

  // Open GitHub in a new tab
  window.open(githubUrl, '_blank');

  // Show a notification with proper parameters
  let notificationMessage = '';
  switch (type) {
    case 'bug':
      notificationMessage = 'Opening GitHub to report a bug...';
      break;
    case 'feature':
      notificationMessage = 'Opening GitHub to request a feature...';
      break;
    case 'general':
      notificationMessage = 'Opening GitHub to share your feedback...';
      break;
  }
  showNotification('info', 'Feedback', notificationMessage, 3000);
}

// Function to show reset confirmation modal
function showResetConfirmation() {
  document.getElementById('reset-confirmation-modal').style.display = 'block';
  document.body.classList.add('modal-open');
}

// Function to close reset confirmation modal
function closeResetConfirmation() {
  document.getElementById('reset-confirmation-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

// Function to confirm and execute reset
function confirmReset() {
  // Clear local settings
  window.gitlabSettings = null;
  updateRepositoryLink();

  // Send reset command to backend
  parent.postMessage(
    {
      pluginMessage: {
        type: 'reset-gitlab-settings',
      },
    },
    '*',
  );

  // Clear all form fields
  document.getElementById('config-project-id').value = '';
  document.getElementById('config-file-path').value = 'src/variables.css';
  document.getElementById('config-export-format').value = 'css';
  document.getElementById('config-test-file-path').value =
    'components/{componentName}/{componentName}.spec.ts';
  document.getElementById('config-token').value = '';
  document.getElementById('config-strategy').value = 'merge-request';
  document.getElementById('config-branch').value = 'feature/variables';
  document.getElementById('config-test-branch').value = 'feature/component-tests';
  document.getElementById('config-save-token').checked = true;
  document.getElementById('config-share-team').checked = true;

  // Hide metadata
  document.getElementById('config-metadata').style.display = 'none';

  // Close both modals
  closeResetConfirmation();
  closeSettingsModal();

  showSuccess('Configuration Reset', 'Configuration has been reset successfully!');
}

// Function to check if user guide should auto-open
function checkAndShowUserGuide() {
  // Show guide if no project ID is configured (first-time user)
  if (!window.gitlabSettings || !window.gitlabSettings.projectId) {
    setTimeout(() => {
      openUserGuide();
    }, 500); // Small delay to ensure UI is loaded
  }
}

// Provider change handler
// ===== NEW REDESIGN HELPERS =====
function selectProvider(provider) {
  // Set hidden input
  const providerInput = document.getElementById('config-provider');
  if (providerInput) providerInput.value = provider;

  // Visual selection
  document.querySelectorAll('.provider-card').forEach((card) => card.classList.remove('selected'));
  const card = document.getElementById(`card-${provider}`);
  if (card) card.classList.add('selected');

  // Show sections
  const accordion = document.getElementById('settings-accordion');
  if (accordion) {
    accordion.classList.add('visible');
    // Auto open first section if none open
    if (!accordion.querySelector('.accordion-item.expanded')) {
      toggleAccordion('section-connection');
    }
  }

  // Trigger field updates
  onProviderChange();
}
// Expose to window for HTML onclick
window.selectProvider = selectProvider;

function toggleAccordion(id) {
  const item = document.getElementById(id);
  if (item) {
    const wasExpanded = item.classList.contains('expanded');

    if (wasExpanded) {
      item.classList.remove('expanded');
    } else {
      item.classList.add('expanded');
    }
  }
}
window.toggleAccordion = toggleAccordion;

// Provider change handler (Logic Only)
function onProviderChange() {
  // Use hidden input or fallback
  const input = document.getElementById('config-provider');
  const provider = input ? input.value : 'gitlab';

  const gitlabUrlGroup = document.getElementById('gitlab-url-group');
  const githubUrlGroup = document.getElementById('github-url-group');
  const projectIdLabel = document.getElementById('project-id-label');
  const projectIdHelp = document.getElementById('project-id-help');
  const browseButton = document.getElementById('browse-repos-button');
  const projectIdInput = document.getElementById('config-project-id');

  const browseBranchesButton = document.getElementById('browse-branches-button');
  const oauthLoginButton = document.getElementById('oauth-login-button');
  const oauthStatus = document.getElementById('oauth-status');
  const tokenLabel = document.getElementById('token-label');
  const tokenHelp = document.getElementById('token-help');
  const tokenInput = document.getElementById('config-token');

  if (provider === 'gitlab') {
    if (gitlabUrlGroup) gitlabUrlGroup.style.display = 'block';
    if (githubUrlGroup) githubUrlGroup.style.display = 'none';
    if (projectIdLabel) projectIdLabel.textContent = 'Project ID';
    // Help text might be static in new UI? Let's keep dynamic for now
    // projectIdInput.placeholder updated in selectProvider? No, here.
    if (projectIdInput) projectIdInput.placeholder = 'e.g. 24267 or namespace/project';
    if (browseButton) browseButton.style.display = 'none';

    if (browseBranchesButton) browseBranchesButton.style.display = 'block'; // GitLab supports browsing too if implemented? Original code said 'none' for GitLab browse branches?
    // Checking original code: browseBranchesButton.style.display = 'none' for GitLab.
    // Wait, standard GitLab supports browsing branches? The original plugin might not have implemented it.
    // Let's stick to original behavior:
    if (browseBranchesButton) browseBranchesButton.style.display = 'none';

    if (oauthLoginButton) oauthLoginButton.style.display = 'none';
    if (oauthStatus) oauthStatus.style.display = 'none';
    if (tokenLabel) tokenLabel.textContent = 'Project Access Token';
    if (tokenInput) tokenInput.placeholder = 'Enter your GitLab private token';
  } else {
    if (gitlabUrlGroup) gitlabUrlGroup.style.display = 'none';
    if (githubUrlGroup) githubUrlGroup.style.display = 'block';
    if (projectIdLabel) projectIdLabel.textContent = 'Repository';
    if (projectIdInput) projectIdInput.placeholder = 'e.g. owner/repository';
    if (browseButton) browseButton.style.display = 'block'; // GitHub supports repo browse
    if (browseBranchesButton) browseBranchesButton.style.display = 'block'; // GitHub supports branch browse
    if (tokenLabel) tokenLabel.textContent = 'GitHub Access Token';
    if (tokenInput) tokenInput.placeholder = 'Enter your GitHub token';

    // Check OAuth availability
    if (typeof checkOAuthAvailability === 'function') checkOAuthAvailability();
  }
}

// Repository browser functions
let cachedRepositories = [];

function browseRepositories() {
  const token = document.getElementById('config-token').value.trim();
  const provider = document.getElementById('config-provider').value;

  if (!token) {
    showError('Validation Error', 'Please enter your access token first');
    return;
  }

  // Show modal
  document.getElementById('repository-browser-modal').style.display = 'block';
  document.body.classList.add('modal-open');

  // Load repositories
  loadRepositories(provider, token);
}

function closeRepositoryBrowser() {
  document.getElementById('repository-browser-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

async function loadRepositories(provider, token) {
  const container = document.getElementById('repo-list-container');
  container.innerHTML = `
          <div class="content-loading">
            <div class="content-loading-spinner"></div>
            <div class="content-loading-text">Loading repositories...</div>
          </div>
        `;

  // Send message to backend to fetch repositories
  parent.postMessage(
    {
      pluginMessage: {
        type: 'list-repositories',
        provider: provider,
        token: token,
      },
    },
    '*',
  );
}

function displayRepositories(repositories) {
  cachedRepositories = repositories;
  const container = document.getElementById('repo-list-container');

  if (!repositories || repositories.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.6);">
              No repositories found
            </div>
          `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 8px;">';

  repositories.forEach((repo) => {
    const lastUpdate = repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : '';
    const stars = repo.stargazers_count || 0;
    const language = repo.language || '';

    html += `
            <div 
              class="repository-item" 
              onclick="selectRepository('${repo.fullName || repo.name}')"
              style="
                padding: 12px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
              "
              onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'; this.style.borderColor='rgba(139, 92, 246, 0.3)';"
              onmouseout="this.style.background='rgba(255, 255, 255, 0.05)'; this.style.borderColor='rgba(255, 255, 255, 0.1)';"
            >
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <div style="font-weight: 500; color: #c4b5fd; margin-bottom: 4px;">
                    ${repo.fullName || repo.name}
                  </div>
                  ${
                    repo.description
                      ? `
                    <div style="font-size: 12px; color: rgba(255, 255, 255, 0.6); margin-bottom: 6px; line-height: 1.3;">
                      ${SecurityUtils.escapeHTML(repo.description.substring(0, 100))}${repo.description.length > 100 ? '...' : ''}
                    </div>
                  `
                      : ''
                  }
                  <div style="display: flex; gap: 12px; align-items: center; font-size: 11px; color: rgba(255, 255, 255, 0.5);">
                    <span>${repo.private ? '🔒 Private' : '🌐 Public'}</span>
                    ${language ? `<span>📝 ${language}</span>` : ''}
                    ${stars > 0 ? `<span>⭐ ${stars}</span>` : ''}
                    ${lastUpdate ? `<span>📅 ${lastUpdate}</span>` : ''}
                  </div>
                </div>
                <div style="margin-left: 8px;">
                  <button 
                    onclick="event.stopPropagation(); showRepositoryDetails('${repo.fullName || repo.name}')"
                    style="padding: 4px 8px; font-size: 10px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; cursor: pointer; border-radius: 4px;"
                    title="View repository details"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function filterRepositories() {
  const searchTerm = document.getElementById('repo-search').value.toLowerCase();
  const filtered = cachedRepositories.filter((repo) => {
    const name = (repo.fullName || repo.name).toLowerCase();
    const description = (repo.description || '').toLowerCase();
    return name.includes(searchTerm) || description.includes(searchTerm);
  });
  displayRepositories(filtered);
}

function selectRepository(repoName) {
  document.getElementById('config-project-id').value = repoName;
  closeRepositoryBrowser();
}

function showRepositoryDetails(repoName) {
  const repo = cachedRepositories.find((r) => (r.fullName || r.name) === repoName);
  if (!repo) return;

  const topics =
    repo.topics && repo.topics.length > 0
      ? repo.topics
          .map(
            (t) =>
              `<span style="background: rgba(139, 92, 246, 0.2); color: #c4b5fd; padding: 2px 6px; border-radius: 3px; font-size: 10px;">${t}</span>`,
          )
          .join(' ')
      : 'None';

  const createdDate = repo.createdAt ? new Date(repo.createdAt).toLocaleDateString() : 'Unknown';
  const updatedDate = repo.updatedAt ? new Date(repo.updatedAt).toLocaleDateString() : 'Unknown';

  const detailsHtml = `
          <div style="font-family: monospace;">
            <h4 style="margin: 0 0 16px 0; color: #c4b5fd;">${repo.fullName || repo.name}</h4>
            
            <div style="margin-bottom: 12px;">
              <strong>Description:</strong><br>
              <span style="color: rgba(255, 255, 255, 0.8);">${repo.description || 'No description available'}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div>
                <strong>Language:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">${repo.language || 'Not specified'}</span>
              </div>
              <div>
                <strong>Visibility:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">${repo.private ? '🔒 Private' : '🌐 Public'}</span>
              </div>
              <div>
                <strong>Stars:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">⭐ ${repo.stargazers_count || 0}</span>
              </div>
              <div>
                <strong>Forks:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">🍴 ${repo.forks_count || 0}</span>
              </div>
              <div>
                <strong>Created:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">${createdDate}</span>
              </div>
              <div>
                <strong>Last Update:</strong><br>
                <span style="color: rgba(255, 255, 255, 0.8);">${updatedDate}</span>
              </div>
            </div>
            
            <div style="margin-bottom: 12px;">
              <strong>Topics:</strong><br>
              <div style="margin-top: 4px;">${topics}</div>
            </div>
            
            <div style="margin-bottom: 16px;">
              <strong>Default Branch:</strong><br>
              <span style="color: rgba(255, 255, 255, 0.8); font-family: monospace; background: rgba(255, 255, 255, 0.1); padding: 2px 6px; border-radius: 3px;">${repo.defaultBranch}</span>
            </div>
            
            <div style="display: flex; gap: 8px;">
              <button onclick="window.open('${repo.webUrl}', '_blank')" 
                      style="padding: 8px 12px; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; cursor: pointer; border-radius: 6px;">
                Open on GitHub
              </button>
              <button onclick="selectRepository('${repo.fullName || repo.name}'); closeModal();" 
                      style="padding: 8px 12px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; cursor: pointer; border-radius: 6px;">
                Select Repository
              </button>
            </div>
          </div>
        `;

  // Create modal
  showModal('Repository Details', detailsHtml);
}

function showModal(title, content) {
  // Remove existing modal if any
  const existingModal = document.getElementById('temp-modal');
  if (existingModal) {
    existingModal.remove();
  }

  const modal = document.createElement('div');
  modal.id = 'temp-modal';
  modal.className = 'modal';
  modal.style.display = 'block';
  modal.innerHTML = `
          <div class="modal-content" style="max-width: 600px;">
            <button class="close-modal" onclick="closeModal()">&times;</button>
            <div class="modal-header">
              <h3>${title}</h3>
            </div>
            <div class="modal-body">
              ${content}
            </div>
          </div>
        `;

  document.body.appendChild(modal);
  document.body.classList.add('modal-open');
}

function closeModal() {
  const modal = document.getElementById('temp-modal');
  if (modal) {
    modal.remove();
    document.body.classList.remove('modal-open');
  }
}

// Branch browser functions
let cachedBranches = [];

function browseBranches() {
  const provider = document.getElementById('config-provider').value;
  const token = document.getElementById('config-token').value.trim();
  const projectId = document.getElementById('config-project-id').value.trim();

  if (!token) {
    showError('Validation Error', 'Please enter your access token first');
    return;
  }

  if (!projectId) {
    showError('Validation Error', 'Please select a repository first');
    return;
  }

  // Show modal
  document.getElementById('branch-browser-modal').style.display = 'block';
  document.body.classList.add('modal-open');

  // Load branches
  loadBranches(provider, token, projectId);
}

function closeBranchBrowser() {
  document.getElementById('branch-browser-modal').style.display = 'none';
  document.body.classList.remove('modal-open');
}

async function loadBranches(provider, token, projectId) {
  const container = document.getElementById('branch-list-container');
  container.innerHTML = `
          <div class="content-loading">
            <div class="content-loading-spinner"></div>
            <div class="content-loading-text">Loading branches...</div>
          </div>
        `;

  // Send message to backend to fetch branches
  parent.postMessage(
    {
      pluginMessage: {
        type: 'list-branches',
        provider: provider,
        token: token,
        projectId: projectId,
      },
    },
    '*',
  );
}

function displayBranches(branches) {
  cachedBranches = branches;
  const container = document.getElementById('branch-list-container');

  if (!branches || branches.length === 0) {
    container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: rgba(255, 255, 255, 0.6);">
              No branches found
            </div>
          `;
    return;
  }

  let html = '<div style="display: flex; flex-direction: column; gap: 6px;">';

  // Sort branches: default first, then alphabetically
  const sortedBranches = [...branches].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  sortedBranches.forEach((branch) => {
    const isDefault = branch.isDefault;
    html += `
            <div 
              class="branch-item" 
              onclick="selectBranch('${branch.name}')"
              style="
                padding: 10px 12px;
                background: ${isDefault ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
                border: 1px solid ${isDefault ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
              onmouseover="this.style.background='rgba(139, 92, 246, 0.2)'; this.style.borderColor='rgba(139, 92, 246, 0.3)';"
              onmouseout="this.style.background='${isDefault ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)'}'; this.style.borderColor='${isDefault ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.1)'}';"
            >
              <span style="font-weight: ${isDefault ? '500' : 'normal'}; color: ${isDefault ? '#22c55e' : '#c4b5fd'};">
                ${branch.name}
              </span>
              ${isDefault ? '<span style="font-size: 10px; background: rgba(34, 197, 94, 0.2); color: #22c55e; padding: 2px 6px; border-radius: 3px;">DEFAULT</span>' : ''}
            </div>
          `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function filterBranches() {
  const searchTerm = document.getElementById('branch-search').value.toLowerCase();
  const filtered = cachedBranches.filter((branch) => {
    return branch.name.toLowerCase().includes(searchTerm);
  });
  displayBranches(filtered);
}

function selectBranch(branchName) {
  document.getElementById('config-branch').value = branchName;
  closeBranchBrowser();
}

// OAuth functions
function checkOAuthAvailability() {
  // Send message to backend to check OAuth status
  parent.postMessage(
    {
      pluginMessage: {
        type: 'check-oauth-status',
      },
    },
    '*',
  );
}

function displayOAuthStatus(status) {
  const oauthLoginButton = document.getElementById('oauth-login-button');
  const oauthStatus = document.getElementById('oauth-status');
  const tokenHelp = document.getElementById('token-help');

  if (!oauthLoginButton || !oauthStatus || !tokenHelp) return;

  // OAuth disabled for now - always hide OAuth elements
  oauthLoginButton.style.display = 'none';
  oauthStatus.style.display = 'none';

  // Show generic help text
  tokenHelp.innerHTML =
    'Create a Personal Access Token in your provider settings (GitHub or GitLab)';
}

async function startOAuthFlow() {
  try {
    const button = document.getElementById('oauth-login-button');
    if (button) {
      button.disabled = true;
      button.textContent = 'Connecting...';
    }

    // Start OAuth flow directly using popup
    const result = await startGitHubOAuthFlow();

    if (result.success) {
      handleOAuthCallback({
        success: true,
        accessToken: result.token,
        user: result.user,
      });
    } else {
      showError('OAuth Error', result.error || 'OAuth authentication failed');
    }
  } catch (error) {
    console.error('OAuth flow error:', error);
    showError('OAuth Error', error.message || 'Failed to start OAuth flow');
  } finally {
    const button = document.getElementById('oauth-login-button');
    if (button) {
      button.disabled = false;
      button.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
              <path d="M12 0.5C5.373 0.5 0 5.873 0 12.5c0 5.301 3.438 9.8 8.207 11.387.6.111.82-.26.82-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.419-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 6.844c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 22.092 24 17.592 24 12.5 24 5.873 18.627 0.5 12 0.5z"/>
            </svg>Login with GitHub`;
    }
  }
}

// GitHub OAuth Flow Implementation
async function startGitHubOAuthFlow() {
  // GitHub OAuth configuration
  const GITHUB_CLIENT_ID = 'Ov23liKXGtyeKaklFf0Q';
  const REDIRECT_URI = 'https://bridgy-oauth.netlify.app/github/callback';
  const SCOPES = ['repo', 'read:user', 'user:email'];

  // Generate secure state parameter
  const state = generateSecureState();

  // Build OAuth URL
  const authUrl = new URL('https://github.com/login/oauth/authorize');
  authUrl.searchParams.set('client_id', GITHUB_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', SCOPES.join(' '));
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('response_type', 'code');

  return new Promise((resolve) => {
    try {
      // Open popup window
      const popup = window.open(
        authUrl.toString(),
        'github-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes',
      );

      if (!popup) {
        resolve({
          success: false,
          error: 'Failed to open OAuth popup. Please allow popups for this site.',
        });
        return;
      }

      // Listen for messages from popup
      const messageHandler = (event) => {
        if (event.origin !== 'https://bridgy-oauth.netlify.app') {
          return;
        }

        if (event.data.type === 'oauth-success') {
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({
            success: true,
            token: event.data.token,
            user: event.data.user,
          });
        } else if (event.data.type === 'oauth-error') {
          window.removeEventListener('message', messageHandler);
          popup.close();
          resolve({
            success: false,
            error: event.data.error,
          });
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          resolve({
            success: false,
            error: 'OAuth flow was cancelled by user',
          });
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
        }
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        resolve({
          success: false,
          error: 'OAuth flow timed out',
        });
      }, 300000);
    } catch (error) {
      resolve({
        success: false,
        error: error.message || 'Failed to start OAuth flow',
      });
    }
  });
}

// Generate secure state parameter for OAuth
function generateSecureState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => {
    const hex = byte.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

function handleOAuthCallback(authData) {
  if (authData.success && authData.accessToken) {
    // Fill token field with OAuth token
    const tokenInput = document.getElementById('config-token');
    if (tokenInput) {
      tokenInput.value = authData.accessToken;
    }

    // Show success message
    showNotification('success', 'OAuth Success', 'Successfully authenticated with GitHub!', 4000);

    // Optional: Auto-load repositories
    if (authData.accessToken) {
      setTimeout(() => {
        browseRepositories();
      }, 1000);
    }
  } else {
    showError('OAuth Error', authData.error || 'OAuth authentication failed');
  }
}

// Helper to persist settings with optional silence
function persistSettings(silent = false) {
  try {
    // Get provider first
    const provider = document.getElementById('config-provider').value;

    // Validate DOM elements exist
    const urlElement =
      provider === 'gitlab'
        ? document.getElementById('config-gitlab-url')
        : document.getElementById('config-github-url');
    const projectIdElement = document.getElementById('config-project-id');
    const filePathElement = document.getElementById('config-file-path');
    const formatElement = document.getElementById('config-export-format');
    const testFilePathElement = document.getElementById('config-test-file-path');
    const tokenElement = document.getElementById('config-token');

    if (
      !urlElement ||
      !projectIdElement ||
      !filePathElement ||
      !formatElement ||
      !testFilePathElement ||
      !tokenElement
    ) {
      throw new Error('Configuration form elements not found');
    }

    let baseUrl = urlElement.value.trim();

    // Auto-prepend https:// if URL doesn't have protocol
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = 'https://' + baseUrl;
      // Update the input field with the corrected URL
      urlElement.value = baseUrl;
    }

    const projectId = projectIdElement.value.trim();
    const filePath = filePathElement.value.trim() || 'src/variables.css';
    const exportFormat = formatElement.value;
    const testFilePath =
      testFilePathElement.value.trim() || 'components/{componentName}/{componentName}.spec.ts';
    const token = tokenElement.value.trim();

    const strategyElement = document.getElementById('config-strategy');
    const branchElement = document.getElementById('config-branch');
    const testBranchElement = document.getElementById('config-test-branch');
    const saveTokenElement = document.getElementById('config-save-token');
    const shareTeamElement = document.getElementById('config-share-team');

    if (
      !strategyElement ||
      !branchElement ||
      !testBranchElement ||
      !saveTokenElement ||
      !shareTeamElement
    ) {
      throw new Error('Configuration form elements not found');
    }

    const strategy = strategyElement.value;
    const branch = branchElement.value.trim() || 'feature/variables';
    const testBranch = testBranchElement.value.trim() || 'feature/component-tests';
    const saveToken = saveTokenElement.checked;
    const shareTeam = shareTeamElement.checked;

    // Enhanced validation
    if (!projectId) {
      if (!silent) showError('Validation Error', 'Please provide a Project ID');
      return;
    }

    if (!token) {
      if (!silent) showError('Validation Error', 'Please provide a Project Access Token');
      return;
    }

    // Validate project ID format
    const projectIdPattern = /^(\d+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/;
    if (!projectIdPattern.test(projectId)) {
      if (!silent) showError(
        'Validation Error',
        'Invalid project ID format. Use numeric ID or namespace/project format.',
      );
      return;
    }

    // Validate token format - very lenient, just check length and basic characters
    if (token.length < 8) {
      if (!silent) showError('Validation Error', 'GitLab token must be at least 8 characters long.');
      return;
    }

    // Only reject tokens with obviously invalid characters (spaces, quotes, etc.)
    if (/[\s"'<>]/.test(token)) {
      if (!silent) showError('Validation Error', 'GitLab token contains invalid characters.');
      return;
    }

    // Validate file paths
    if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
      if (!silent) showError('Validation Error', 'Invalid file path - path traversal detected');
      return;
    }

    // Validate URL based on provider
    if (provider === 'gitlab') {
      if (baseUrl && !SecurityUtils.isValidGitLabURL(baseUrl)) {
        if (!silent) showError(
          'Validation Error',
          "Invalid GitLab URL. Must be HTTPS and contain 'gitlab' in the domain",
        );
        return;
      }
    } else {
      // GitHub URL validation
      if (baseUrl && !baseUrl.includes('github')) {
        if (!silent) showError('Validation Error', "Invalid GitHub URL. Must contain 'github' in the domain");
        return;
      }
    }

    // Store settings with provider info
    window.gitSettings = {
      provider: provider,
      baseUrl: baseUrl || '', // Keep empty string to show in UI
      projectId: projectId,
      filePath: filePath,
      exportFormat: exportFormat,
      testFilePath: testFilePath,
      token: token,
      strategy: strategy,
      branchName: branch,
      testBranchName: testBranch,
      saveToken: saveToken,
      isPersonal: !shareTeam,
      savedAt: new Date().toISOString(),
      savedBy: 'Current user',
    };

    // Keep backward compatibility - Update gitlabSettings for UI components that rely on it
    // This ensures exportFormat changes are reflected even if provider is not gitlab
    window.gitlabSettings = {
      gitlabUrl: baseUrl,
      projectId: projectId,
      filePath: filePath,
      exportFormat: exportFormat,
      testFilePath: testFilePath,
      gitlabToken: token,
      strategy: strategy,
      branchName: branch,
      testBranchName: testBranch,
      saveToken: saveToken,
      isPersonal: !shareTeam,
      savedAt: new Date().toISOString(),
      savedBy: 'Current user',
    };

    parent.postMessage(
      {
        pluginMessage: {
          type: 'save-git-settings',
          provider: provider,
          baseUrl: baseUrl,
          projectId: projectId,
          filePath: filePath,
          exportFormat: exportFormat,
          testFilePath: testFilePath,
          token: token,
          strategy: strategy,
          branchName: branch,
          testBranchName: testBranch,
          saveToken: saveToken,
          shareWithTeam: shareTeam,
        },
      },
      '*',
    );

    // Common updates
    displayConfigMetadata();
    updateExportButtonText();
    updateRepositoryLink();

    console.log('[DEBUG] persistSettings: exportFormat set to:', exportFormat); // Debug log

    if (!silent) {
       showSuccess('Settings Saved', 'Configuration saved successfully!', 4000);
       closeSettingsModal();

       // Trigger full refresh of all tabs for manual save
       if (typeof window.refreshData === 'function') {
         window.refreshData();
       }
       if (typeof window.refreshStats === 'function') {
         window.refreshStats();
       }
    } else {
        // Silent update - Reactive UI Refresh
        console.log('[DEBUG] Silent persist. Re-rendering variables...'); // Debug log
        // Re-render variables immediately to reflect settings like Tailwind Icons
        if (window.globalVariablesData) {
            // Re-render Variables
            renderVariables(window.globalVariablesData, window.stylesData || null);
        }
    }

  } catch (error) {
    console.error('Error saving configuration:', error);
    if (!silent) {
        showError(
          'Configuration Error',
          error.message || 'An unexpected error occurred while saving the configuration.',
        );
    }
  }
}

function saveConfiguration() {
  persistSettings(false);
}

function loadConfigurationTab() {
  try {
    const settings = window.gitSettings || window.gitlabSettings;

    if (settings) {
      // Determine provider
      const provider = settings.provider || 'gitlab';

      // Validate all elements exist before setting values
      const elements = {
        'config-project-id': settings.projectId || '',
        'config-file-path': settings.filePath || 'src/variables.css',
        'config-export-format': settings.exportFormat || 'css',
        'config-test-file-path':
          settings.testFilePath || 'components/{componentName}/{componentName}.spec.ts',
        'config-token': settings.token || settings.gitlabToken || '',
        'config-strategy': settings.strategy || 'merge-request',
        'config-branch': settings.branchName || 'feature/variables',
        'config-test-branch': settings.testBranchName || 'feature/component-tests',
      };

      // Set URL based on provider
      if (provider === 'gitlab') {
        const gitlabUrlElement = document.getElementById('config-gitlab-url');
        if (gitlabUrlElement) {
          gitlabUrlElement.value = settings.baseUrl || settings.gitlabUrl || '';
        }
      } else {
        const githubUrlElement = document.getElementById('config-github-url');
        if (githubUrlElement) {
          githubUrlElement.value = settings.baseUrl || '';
        }
      }

      for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
          element.value = value;
        } else {
          console.warn(`Configuration element not found: ${id}`);
        }
      }

      // Handle checkboxes
      const saveTokenElement = document.getElementById('config-save-token');
      const shareTeamElement = document.getElementById('config-share-team');

      if (saveTokenElement) {
        saveTokenElement.checked = window.gitlabSettings.hasOwnProperty('saveToken')
          ? window.gitlabSettings.saveToken
          : true;
      }

      if (shareTeamElement) {
        shareTeamElement.checked = window.gitlabSettings.hasOwnProperty('isPersonal')
          ? !window.gitlabSettings.isPersonal
          : true;
      }

      // Handle strategy-dependent sections
      const strategyElement = document.getElementById('config-strategy');
      if (strategyElement) {
        const strategy = strategyElement.value;
        const display = strategy === 'merge-request' ? 'block' : 'none';

        const branchSection = document.getElementById('config-branch-section');
        const testBranchSection = document.getElementById('config-test-branch-section');

        if (branchSection) branchSection.style.display = display;
        if (testBranchSection) testBranchSection.style.display = display;
      }

      displayConfigMetadata();
      updateExportButtonText();
      updateRepositoryLink();

      // Trigger visual update (card selection + accordion logic)
      setTimeout(() => {
        selectProvider(provider);
        if (!settings.token) {
          toggleAccordion('section-connection');
        } else {
          toggleAccordion('section-connection');
        }
      }, 100);
    } else {
      // No settings found, set defaults
      // Set defaults for new users
      const saveTokenElement = document.getElementById('config-save-token');
      const shareTeamElement = document.getElementById('config-share-team');

      if (saveTokenElement) saveTokenElement.checked = true;
      if (shareTeamElement) shareTeamElement.checked = true;
    }
  } catch (error) {
    console.error('Error loading configuration:', error);
    showError(
      'Configuration Error',
      'Failed to load configuration: ' + (error.message || 'Unknown error'),
    );
  }
}

function displayConfigMetadata() {
  const metadataElement = document.getElementById('config-metadata');
  const metadataTextElement = document.getElementById('config-metadata-text');

  if (window.gitlabSettings && (window.gitlabSettings.savedAt || window.gitlabSettings.savedBy)) {
    metadataElement.style.display = 'block';

    let metadataText = '';

    if (window.gitlabSettings.savedAt) {
      const savedDate = new Date(window.gitlabSettings.savedAt);
      const formattedDate = savedDate.toLocaleDateString();
      const formattedTime = savedDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      metadataText += `Last saved: ${formattedDate} at ${formattedTime}`;
    }

    if (window.gitlabSettings.savedBy) {
      metadataText += window.gitlabSettings.savedAt
        ? ` by ${window.gitlabSettings.savedBy}`
        : `Saved by: ${window.gitlabSettings.savedBy}`;
    }

    if (window.gitlabSettings.isPersonal) {
      metadataText += ' (Personal settings)';
    } else {
      metadataText += ' (Shared with team)';
    }

    metadataTextElement.textContent = metadataText;
  } else {
    metadataElement.style.display = 'none';
  }
}

function toggleGitLabCredentialsFields() {
  const fieldsSection = document.getElementById('gitlab-credentials-fields');
  const summarySection = document.getElementById('gitlab-credentials-summary');
  const securityNoteCompact = document.getElementById('security-note-compact');
  const securityNoteFull = document.getElementById('security-note-full');

  if (fieldsSection.style.display === 'none') {
    fieldsSection.style.display = 'block';
    summarySection.style.display = 'none';
    securityNoteCompact.style.display = 'none';
    securityNoteFull.style.display = 'block';
  } else {
    const projectId = document.getElementById('gitlab-project-id').value;
    if (projectId) {
      fieldsSection.style.display = 'none';
      summarySection.style.display = 'block';
      securityNoteCompact.style.display = 'block';
      securityNoteFull.style.display = 'none';

      document.getElementById('project-id-display').textContent = projectId;
    }
  }
}

function openGitLabModal() {
  document.getElementById('gitlab-modal').style.display = 'block';
  document.body.classList.add('modal-open');

  const fieldsSection = document.getElementById('gitlab-credentials-fields');
  const summarySection = document.getElementById('gitlab-credentials-summary');
  const securityNoteCompact = document.getElementById('security-note-compact');
  const securityNoteFull = document.getElementById('security-note-full');

  if (fieldsSection) fieldsSection.style.display = 'block';
  if (summarySection) summarySection.style.display = 'none';
  if (securityNoteCompact) securityNoteCompact.style.display = 'none';
  if (securityNoteFull) securityNoteFull.style.display = 'block';

  if (window.gitlabSettings) {
    if (window.gitlabSettings.projectId) {
      const projectIdField = document.getElementById('gitlab-project-id');
      projectIdField.value = window.gitlabSettings.projectId;

      document.getElementById('project-id-display').textContent = window.gitlabSettings.projectId;
    }

    if (window.gitlabSettings.gitlabToken) {
      document.getElementById('gitlab-token').value = window.gitlabSettings.gitlabToken;
      document.getElementById('save-token').checked = true;
    }

    if (window.gitlabSettings.branchName) {
      document.getElementById('branch-name').value = window.gitlabSettings.branchName;
    }

    if (!window.gitlabSettings.isPersonal) {
      document.getElementById('share-with-team').checked = true;
    }

    if (window.gitlabSettings.savedBy && window.gitlabSettings.savedAt) {
      const savedDate = new Date(window.gitlabSettings.savedAt);
      const formattedDate = savedDate.toLocaleDateString() + ' ' + savedDate.toLocaleTimeString();
      const savedInfoText = `Last updated by: <strong>${SecurityUtils.escapeHTML(window.gitlabSettings.savedBy)}</strong> on ${SecurityUtils.escapeHTML(formattedDate)}`;

      securityNoteCompact.innerHTML = SecurityUtils.sanitizeHTML(savedInfoText);
      const savedInfoDiv = securityNoteFull.querySelector('.saved-info');
      if (savedInfoDiv) {
        savedInfoDiv.innerHTML = SecurityUtils.sanitizeHTML(savedInfoText);
      }
    }

    if (window.gitlabSettings.projectId) {
      fieldsSection.style.display = 'none';
      summarySection.style.display = 'block';
      securityNoteCompact.style.display = 'block';
      securityNoteFull.style.display = 'none';
    }
  }

  document.getElementById('settings-button').onclick = toggleGitLabCredentialsFields;
}

// Function to close the GitLab modal
function closeGitLabModal() {
  const modal = document.getElementById('gitlab-modal');
  if (modal) {
    // Remove old-style messages
    const successMessage = modal.querySelector('.success-message');
    if (successMessage) {
      successMessage.remove();
    }
    const errorMessage = modal.querySelector('.error-message');
    if (errorMessage) {
      errorMessage.remove();
    }

    // Remove new-style modal notifications
    const modalNotification = modal.querySelector('.modal-notification');
    if (modalNotification) {
      modalNotification.remove();
    }

    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
  resetCommitButton();
}

// Function to reset the commit button state
function resetCommitButton() {
  const button = document.getElementById('commit-submit-button');
  if (button) {
    button.textContent = 'Commit';
    button.disabled = false;
    button.onclick = commitToGitLab;
  }
}

// Function to update the state of the apply fix button
function updateApplyButtonState(count) {
  const btn = document.getElementById('apply-fix-btn');
  if (!btn) return;

  if (count === 0) {
    btn.disabled = true;
    btn.textContent = 'Apply Fix to Selection';
  } else {
    btn.disabled = false;
    btn.textContent = `Apply Fix to ${count} items`;
  }
}

// Function to commit to GitLab
function commitToGitLab() {
  const button = document.getElementById('commit-submit-button');

  try {
    // Validate DOM element exists
    if (!button) {
      console.error('Commit button not found in DOM');
      showError('Interface Error', 'Unable to find commit button. Please refresh the plugin.');
      return;
    }

    button.disabled = true;
    button.innerHTML = SecurityUtils.sanitizeHTML(`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="margin-right: 8px; animation: spin 1s linear infinite;">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" stroke-dasharray="31.416" stroke-dashoffset="31.416" opacity="0.3"/>
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
            </svg>
            Committing...
          `);

    // Comprehensive settings validation
    const settings = window.gitlabSettings || window.gitSettings;
    if (!settings) {
      throw new Error(
        'Settings not configured. Please configure your settings in the Config tab first.',
      );
    }

    if (!settings.projectId || !settings.projectId.trim()) {
      throw new Error('Project/Repository ID is required. Please configure your settings.');
    }

    // Determine provider and validated token
    const provider = settings.provider || 'gitlab';
    let token = settings.token;

    if (provider === 'gitlab') {
      token = settings.gitlabToken || settings.token;
      if (!token || !token.trim()) {
        throw new Error('GitLab token is required. Please configure your GitLab settings.');
      }
    } else if (provider === 'github') {
      if (!token || !token.trim()) {
        throw new Error('GitHub token is required. Please configure your GitHub settings.');
      }
    }

    // Validate commit message
    const commitMessageElement = document.getElementById('commit-message');
    if (!commitMessageElement) {
      throw new Error('Commit message field not found. Please refresh the plugin.');
    }

    const commitMessage = commitMessageElement.value.trim();
    if (!commitMessage) {
      throw new Error('Commit message is required. Please enter a descriptive commit message.');
    }

    if (commitMessage.length > 500) {
      throw new Error('Commit message is too long. Please keep it under 500 characters.');
    }

    // Validate file path
    const filePath = settings.filePath || 'src/variables.css';
    if (!filePath.trim()) {
      throw new Error('File path cannot be empty. Please configure a valid file path.');
    }

    if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
      throw new Error(
        'Invalid file path. Path must be relative and cannot contain ".." or start with "/".',
      );
    }
  } catch (error) {
    console.error('Validation error in commitToGitLab:', error);
    showModalError('gitlab-modal', 'Validation Error', error.message);
    resetCommitButton();
    return;
  }

  try {
    const settings = window.gitlabSettings || window.gitSettings;
    const provider = settings.provider || 'gitlab';
    const projectId = settings.projectId;
    const token = settings.token || settings.gitlabToken;
    const filePath = settings.filePath || 'src/variables.css';
    const strategy = settings.strategy || 'merge-request';
    const branchName = settings.branchName || 'feature/variables';

    const commitMessage =
      document.getElementById('commit-message').value.trim() || 'feat: update CSS variables';

    const createMergeRequest = strategy === 'merge-request';
    let mrTitle = commitMessage;
    let mrDescription = 'Updated CSS variables from Figma';
    let mrRemoveSourceBranch = true;
    let mrSquash = false;

    if (!currentCSSData) {
      try {
        const exportFormat = settings?.exportFormat || 'css';
        parent.postMessage(
          {
            pluginMessage: {
              type: 'export-css',
              exportFormat: exportFormat,
            },
          },
          '*',
        );

        let checkAttempts = 0;
        const maxAttempts = 50; // 5 seconds with 100ms intervals

        const checkCSSData = setInterval(() => {
          checkAttempts++;

          if (currentCSSData) {
            clearInterval(checkCSSData);

            try {
              parent.postMessage(
                {
                  pluginMessage: {
                    type: 'commit-to-repo', // Updated to generic message type
                    provider: provider,
                    gitlabUrl: settings.gitlabUrl, // Optional for GitHub
                    projectId,
                    token,
                    gitlabToken: token, // For legacy compatibility if needed
                    commitMessage,
                    filePath,
                    branchName,
                    cssData: currentCSSData,
                    createMergeRequest,
                    mrTitle,
                    mrDescription,
                    mrRemoveSourceBranch,
                    mrSquash,
                  },
                },
                '*',
              );
            } catch (postError) {
              console.error('Error sending commit message to plugin:', postError);
              showModalError(
                'gitlab-modal',
                'Communication Error',
                'Failed to send commit request to plugin. Please try again.',
              );
              resetCommitButton();
            }
          } else if (checkAttempts >= maxAttempts) {
            clearInterval(checkCSSData);
            showModalError(
              'gitlab-modal',
              'Generation Timeout',
              'CSS generation timed out. Please try again.',
            );
            resetCommitButton();
          }
        }, 100);
      } catch (exportError) {
        console.error('Error requesting CSS export:', exportError);
        showModalError(
          'gitlab-modal',
          'Export Error',
          'Failed to request CSS export. Please try again.',
        );
        resetCommitButton();
      }
    } else {
      try {
        parent.postMessage(
          {
            pluginMessage: {
              type: 'commit-to-repo',
              provider: window.gitlabSettings.provider || 'gitlab',
              gitlabUrl: window.gitlabSettings.gitlabUrl,
              projectId,
              token: token,
              commitMessage,
              filePath,
              branchName,
              cssData: currentCSSData,
              createMergeRequest,
              mrTitle,
              mrDescription,
              mrRemoveSourceBranch,
              mrSquash,
            },
          },
          '*',
        );
      } catch (postError) {
        console.error('Error sending commit message to plugin:', postError);
        showModalError(
          'gitlab-modal',
          'Communication Error',
          'Failed to send commit request to plugin. Please try again.',
        );
        resetCommitButton();
      }
    }
  } catch (commitError) {
    console.error('Error in commit process:', commitError);
    showModalError(
      'gitlab-modal',
      'Commit Error',
      commitError.message || 'An unexpected error occurred during commit.',
    );
    resetCommitButton();
  }
}

function loadUnitsSettings() {
  parent.postMessage(
    {
      pluginMessage: {
        type: 'get-unit-settings',
      },
    },
    '*',
  );
}

function renderUnitsSettings(data) {
  const container = document.getElementById('units-settings-container');

  if (!data || (data.collections.length === 0 && data.groups.length === 0)) {
    container.innerHTML = '';
    const noItemsDiv = document.createElement('div');
    noItemsDiv.className = 'no-items';
    noItemsDiv.textContent = 'No collections or groups found for unit configuration.';
    container.appendChild(noItemsDiv);
    return;
  }

  let html = `
          <div class="units-section" style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); margin-bottom: 24px;">
            <h4 style="color: #22c55e; margin-bottom: 12px;">⚡ Settings Hierarchy</h4>
            <div style="color: rgba(255, 255, 255, 0.85); font-size: 13px; line-height: 1.5;">
              <strong>1. Group Settings</strong> (highest priority) → <strong>2. Collection Settings</strong> → <strong>3. Smart Defaults</strong> (fallback)
              <br><span style="color: rgba(255, 255, 255, 0.6);">More specific settings always override general ones</span>
            </div>
          </div>
        `;

  if (data.collections.length > 0) {
    html += `
            <div class="units-section">
              <h4>Collections</h4>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 16px;">Set default units for entire collections. These override global smart defaults for all variables in the collection.</p>
          `;

    data.collections.forEach((collection) => {
      html += `
              <div class="unit-setting-row">
                <div class="unit-setting-label">${collection.name}</div>
                <div class="unit-setting-control">
                  <span class="default-unit-label" title="This unit will be used when 'Smart defaults' is selected">
                    Smart default: <strong>${collection.defaultUnit}</strong>
                  </span>
                  <select class="unit-dropdown" data-type="collection" data-name="${
                    collection.name
                  }">
                    ${AVAILABLE_UNITS.map(
                      (unit) =>
                        `<option value="${unit}" ${
                          unit === collection.currentUnit ? 'selected' : ''
                        }>${unit === '' ? `Smart defaults (${collection.defaultUnit})` : unit}</option>`,
                    ).join('')}
                  </select>
                </div>
              </div>
            `;
    });

    html += '</div>';
  }

  if (data.groups.length > 0) {
    html += `
            <div class="units-section">
              <h4>Groups</h4>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 16px;">Set specific units for variable groups. These have the highest priority and override both collection settings and smart defaults.</p>
          `;

    const groupsByCollection = {};
    data.groups.forEach((group) => {
      if (!groupsByCollection[group.collectionName]) {
        groupsByCollection[group.collectionName] = [];
      }
      groupsByCollection[group.collectionName].push(group);
    });

    Object.keys(groupsByCollection)
      .sort()
      .forEach((collectionName) => {
        html += `
              <div class="units-group">
                <h5>${collectionName}</h5>
            `;

        groupsByCollection[collectionName].forEach((group) => {
          html += `
                <div class="unit-setting-row">
                  <div class="unit-setting-label">${group.groupName}</div>
                  <div class="unit-setting-control">
                    <span class="default-unit-label" title="This unit will be used when 'Smart defaults' is selected">
                      Smart default: <strong>${group.defaultUnit}</strong>
                    </span>
                    <select class="unit-dropdown" data-type="group" data-collection="${
                      group.collectionName
                    }" data-group="${group.groupName}">
                      ${AVAILABLE_UNITS.map(
                        (unit) =>
                          `<option value="${unit}" ${
                            unit === group.currentUnit ? 'selected' : ''
                          }>${unit === '' ? `Smart defaults (${group.defaultUnit})` : unit}</option>`,
                      ).join('')}
                    </select>
                  </div>
                </div>
              `;
        });

        html += '</div>';
      });

    html += '</div>';
  }

  html += `
          <div class="units-section" style="background: rgba(139, 92, 246, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(139, 92, 246, 0.3);">
            <h4 style="color: white; margin-bottom: 16px;">📋 Smart Default Rules</h4>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 14px; margin-bottom: 16px;">
              When "Smart defaults" is selected, these rules determine the unit automatically based on variable names:
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Typography</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">font-size</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div><code style="color: #fbbf24;">text-*</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div><code style="color: #fbbf24;">letter-spacing</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">Scalable with root font</div>
                </div>
              </div>
              
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Spacing</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">margin</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div><code style="color: #fbbf24;">padding</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div><code style="color: #fbbf24;">gap</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div><code style="color: #fbbf24;">space</code> → <span style="color: #06d6a0;">rem</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">Consistent with typography</div>
                </div>
              </div>

              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Unitless</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">opacity</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">z-index</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">line-height</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">font-weight</code> → <span style="color: #22c55e;">none</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">No units needed</div>
                </div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Viewport</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">*-width</code> → <span style="color: #f59e0b;">vw</span></div>
                  <div><code style="color: #fbbf24;">*-height</code> → <span style="color: #f59e0b;">vh</span></div>
                  <div><code style="color: #fbbf24;">viewport</code> → <span style="color: #f59e0b;">vw/vh</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">Responsive to viewport</div>
                </div>
              </div>
              
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Relative</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">container-*</code> → <span style="color: #ef4444;">%</span></div>
                  <div><code style="color: #fbbf24;">sidebar-*</code> → <span style="color: #ef4444;">%</span></div>
                  <div><code style="color: #fbbf24;">radius-pill</code> → <span style="color: #ef4444;">%</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">Relative to parent</div>
                </div>
              </div>

              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Default</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">border</code> → <span style="color: #a78bfa;">px</span></div>
                  <div><code style="color: #fbbf24;">shadow</code> → <span style="color: #a78bfa;">px</span></div>
                  <div><code style="color: #fbbf24;">everything else</code> → <span style="color: #a78bfa;">px</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">Precise control</div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 16px; padding: 12px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(5px); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; color: rgba(255, 255, 255, 0.85); line-height: 1.6;">
              <strong style="color: #c4b5fd;">Real Examples:</strong><br>
              <code style="color: #fbbf24;">heading-font-size</code> → <span style="color: #06d6a0;">rem</span> (typography),
              <code style="color: #fbbf24;">section-padding</code> → <span style="color: #06d6a0;">rem</span> (spacing),<br>
              <code style="color: #fbbf24;">button-opacity</code> → <span style="color: #22c55e;">none</span> (unitless),
              <code style="color: #fbbf24;">hero-full-width</code> → <span style="color: #f59e0b;">vw</span> (viewport),<br>
              <code style="color: #fbbf24;">sidebar-width</code> → <span style="color: #ef4444;">%</span> (relative),
              <code style="color: #fbbf24;">border-width</code> → <span style="color: #a78bfa;">px</span> (default)
            </div>
          </div>
        `;

  container.innerHTML = SecurityUtils.sanitizeHTML(html);

  document.querySelectorAll('.unit-dropdown').forEach((dropdown) => {
    dropdown.addEventListener('change', function () {
      const saveButton = document.getElementById('save-units-button');
      const saveButtonModal = document.getElementById('save-units-button-modal');
      if (saveButton) {
        saveButton.disabled = false;
      }
      if (saveButtonModal) {
        saveButtonModal.disabled = false;
      }
    });
  });
}

const commitRepoButton = document.getElementById('commit-repo-button');
if (commitRepoButton) {
  commitRepoButton.addEventListener('click', openGitLabModal);
}

const createMRElement = document.getElementById('create-merge-request');
if (createMRElement) {
  createMRElement.addEventListener('change', function () {
    const mergeRequestOptions = document.getElementById('merge-request-options');
    if (mergeRequestOptions) {
      if (this.checked) {
        mergeRequestOptions.style.display = 'block';

        const commitMessage = document.getElementById('commit-message').value;
        const mrTitleElement = document.getElementById('mr-title');
        if (commitMessage && mrTitleElement) {
          mrTitleElement.value = commitMessage;
        }
      } else {
        mergeRequestOptions.style.display = 'none';
      }
    }
  });
}

const commitMessageElement = document.getElementById('commit-message');
if (commitMessageElement) {
  commitMessageElement.addEventListener('input', function () {
    const createMR = document.getElementById('create-merge-request');
    const mrTitleElement = document.getElementById('mr-title');
    if (createMR && createMR.checked && mrTitleElement) {
      mrTitleElement.value = this.value;
    }
  });
}

const configStrategyElement = document.getElementById('config-strategy');
if (configStrategyElement) {
  configStrategyElement.addEventListener('change', function () {
    const branchSection = document.getElementById('config-branch-section');
    const testBranchSection = document.getElementById('config-test-branch-section');

    if (branchSection && testBranchSection) {
      const display = this.value === 'merge-request' ? 'block' : 'none';
      branchSection.style.display = display;
      testBranchSection.style.display = display;
    }
  });
}

const configExportFormatElement = document.getElementById('config-export-format');
if (configExportFormatElement) {
  configExportFormatElement.addEventListener('change', function () {
    // Auto-save styles (silent) and refresh UI
    if (typeof persistSettings === 'function') {
        persistSettings(true);
    }
    // Update button states
    updateCommitButtonStates();
  });
}

// Toggle collapsible subgroups
// Toggle collapsible subgroups
window.toggleSubgroup = function (groupId) {
  try {
    const content = document.getElementById(groupId + '-content');

    if (!content) {
      console.log('Content element not found for groupId:', groupId);
      return;
    }

    // Find the header by looking at the parent's subgroup-header child
    const parent = content.parentElement;
    const header = parent ? parent.querySelector('.subgroup-header') : null;

    if (!header) {
      console.log('Header element not found for groupId:', groupId);
      return;
    }

    const isCollapsed = content.classList.contains('collapsed');

    if (isCollapsed) {
      content.classList.remove('collapsed');
      content.classList.add('expanded');
      header.classList.remove('collapsed');
    } else {
      content.classList.remove('expanded');
      content.classList.add('collapsed');
      header.classList.add('collapsed');
    }
  } catch (error) {
    console.error('Error toggling subgroup:', error);
  }
};

// Toggle collapsible collections
// Toggle collapsible collections
window.toggleCollection = function (collectionId) {
  try {
    const content = document.getElementById(collectionId + '-content');
    const header = document.querySelector(`#${collectionId} .collection-header`);

    if (!content || !header) return;

    const isCollapsed = content.classList.contains('collapsed');

    if (isCollapsed) {
      content.classList.remove('collapsed');
      header.classList.remove('collapsed');
    } else {
      content.classList.add('collapsed');
      header.classList.add('collapsed');
    }
  } catch (error) {
    console.error('Error toggling collection:', error);
  }
};

// Initialize Quality Search
// Initialize Quality Search
// (Search logic is handled by global delegation listeners defined later in this file)
document.addEventListener('DOMContentLoaded', () => {
  // Keeping this empty block to replace the old listener without shifting line numbers too drastically if not needed.
  // The actual logic was moved to filterQualityResults() and the delegation listeners.
});

// Expand all subgroups within a collection
function expandAllSubgroups(collectionId) {
  const collection = document.getElementById(collectionId);
  if (!collection) return;

  collection.querySelectorAll('.subgroup-content').forEach((content) => {
    content.classList.remove('collapsed');
    content.classList.add('expanded');
  });
  collection.querySelectorAll('.subgroup-header').forEach((header) => {
    header.classList.remove('collapsed');
  });
}

// Collapse all subgroups within a collection
function collapseAllSubgroups(collectionId) {
  const collection = document.getElementById(collectionId);
  if (!collection) return;

  collection.querySelectorAll('.subgroup-content').forEach((content) => {
    content.classList.remove('expanded');
    content.classList.add('collapsed');
  });
  collection.querySelectorAll('.subgroup-header').forEach((header) => {
    header.classList.add('collapsed');
  });
}

// Expand all groups function
function expandAllGroups() {
  try {
    document.querySelectorAll('.subgroup-content').forEach((content) => {
      content.classList.remove('collapsed');
      content.classList.add('expanded');
    });
    document.querySelectorAll('.subgroup-header').forEach((header) => {
      header.classList.remove('collapsed');
    });
    console.log('Expanded all groups');
  } catch (error) {
    console.error('Error expanding all groups:', error);
  }
}

// Collapse all groups function
function collapseAllGroups() {
  try {
    document.querySelectorAll('.subgroup-content').forEach((content) => {
      content.classList.remove('expanded');
      content.classList.add('collapsed');
    });
    document.querySelectorAll('.subgroup-header').forEach((header) => {
      header.classList.add('collapsed');
    });
    console.log('Collapsed all groups');
  } catch (error) {
    console.error('Error collapsing all groups:', error);
  }
}

// Toggle variables list for components
function toggleVariablesList(groupIndex) {
  try {
    const variablesList = document.getElementById(`variables-list-${groupIndex}`);
    const toggleButton = document.querySelector(`[onclick="toggleVariablesList('${groupIndex}')"]`);

    if (!variablesList) {
      console.warn(`Variables list with ID variables-list-${groupIndex} not found`);
      return;
    }

    // Toggle visibility
    if (variablesList.style.display === 'none' || !variablesList.style.display) {
      variablesList.style.display = 'block';
      if (toggleButton) {
        toggleButton.innerHTML = '🔼 Hide Variables';
      }
    } else {
      variablesList.style.display = 'none';
      if (toggleButton) {
        toggleButton.innerHTML = '🔽 Show Variables';
      }
    }
  } catch (error) {
    console.error(`Error toggling variables list ${groupIndex}:`, error);
  }
}

// OAuth Functions
async function startOAuthFlow() {
  try {
    const provider = document.getElementById('config-provider').value;

    if (provider !== 'github') {
      showError(
        'OAuth Error',
        'OAuth authentication is only available for GitHub. Please use Personal Access Token for GitLab.',
      );
      return;
    }

    console.log('🚀 Starting GitHub OAuth flow...');

    // Get UI elements
    const oauthButton = document.getElementById('oauth-login-button');
    const statusEl = document.getElementById('oauth-status');

    // Save original button state
    let originalButtonHTML = '';
    if (oauthButton) {
      originalButtonHTML = oauthButton.innerHTML;
      oauthButton.disabled = true;
      oauthButton.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px; animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2 A10 10 0 0 1 22 12" stroke-opacity="1"/>
              </svg>
              Connecting...
            `;
      oauthButton.style.cssText += 'opacity: 0.7; cursor: wait;';
    }

    // Show loading state
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.innerHTML = `
              <div style="
                color: #fbbf24;
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 12px;
                animation: pulse 2s ease-in-out infinite;
              ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2 A10 10 0 0 1 22 12" stroke-opacity="1" style="animation: spin 1s linear infinite;"/>
                </svg>
                Opening secure authentication window...
              </div>
            `;
    }

    const result = await startGitHubOAuthFlow();

    if (result.success && result.token && result.user) {
      console.log('✅ OAuth flow completed successfully');

      // Update UI with token
      const tokenInput = document.getElementById('config-token');
      if (tokenInput) {
        tokenInput.value = result.token;
        // Add visual feedback to token field
        tokenInput.style.borderColor = '#22c55e';
        setTimeout(() => {
          tokenInput.style.borderColor = '';
        }, 2000);
      }

      // Show success message with user info
      if (statusEl) {
        statusEl.innerHTML = `
                <div style="
                  color: #22c55e;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 12px;
                  animation: slideIn 0.3s ease-out;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Connected as <strong>${result.user.login}</strong>
                </div>
              `;
      }

      // Reset button to success state
      if (oauthButton) {
        oauthButton.disabled = false;
        oauthButton.innerHTML = `
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                Connected
              `;
        oauthButton.style.cssText +=
          'background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); opacity: 1;';

        // Reset after 3 seconds
        setTimeout(() => {
          oauthButton.innerHTML = originalButtonHTML;
          oauthButton.style.cssText = '';
        }, 3000);
      }

      showSuccess(
        'OAuth Success',
        `Successfully connected as ${result.user.login}! Your GitHub token has been added to the settings.`,
      );
    } else {
      console.error('❌ OAuth flow failed:', result.error);

      // Show error with help option for popup blocker
      if (statusEl) {
        const helpButton =
          result.errorType === 'POPUP_BLOCKED' || result.errorType === 'POPUP_FAILED'
            ? `<button 
                    onclick="window.showPopupBlockerHelp()" 
                    style="
                      margin-left: 8px;
                      padding: 4px 8px;
                      background: rgba(139, 92, 246, 0.2);
                      border: 1px solid rgba(139, 92, 246, 0.3);
                      color: #c4b5fd;
                      border-radius: 4px;
                      font-size: 11px;
                      cursor: pointer;
                    "
                  >
                    Show Help
                  </button>`
            : '';

        statusEl.innerHTML = `
                <div style="
                  color: #ef4444;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  font-size: 12px;
                ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  ${result.error}
                  ${helpButton}
                </div>
              `;
      }

      // Reset button
      if (oauthButton) {
        oauthButton.disabled = false;
        oauthButton.innerHTML = originalButtonHTML;
        oauthButton.style.cssText = '';
      }

      // Show error notification (only if help modal wasn't shown)
      if (!result.showHelp) {
        showError('OAuth Error', result.error || 'Failed to authenticate with GitHub');
      }
    }
  } catch (error) {
    console.error('❌ OAuth flow error:', error);

    const statusEl = document.getElementById('oauth-status');
    const oauthButton = document.getElementById('oauth-login-button');

    if (statusEl) {
      statusEl.innerHTML = `
              <div style="color: #ef4444; font-size: 12px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline; margin-right: 4px;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                ${error.message}
              </div>
            `;
    }

    // Reset button
    if (oauthButton) {
      oauthButton.disabled = false;
      oauthButton.innerHTML = `
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
              </svg>
              OAuth
            `;
      oauthButton.style.cssText = '';
    }

    showError('OAuth Error', error.message || 'Failed to start OAuth flow');
  }
}

// ========================================
// OAuth Helper Functions
// ========================================

/**
 * Detect current browser
 * @returns {string} Browser name (chrome, firefox, safari, edge, other)
 */
function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('edg') > -1) return 'edge';
  if (userAgent.indexOf('chrome') > -1) return 'chrome';
  if (userAgent.indexOf('safari') > -1) return 'safari';
  if (userAgent.indexOf('firefox') > -1) return 'firefox';
  return 'other';
}

/**
 * Test if popup blocker is active
 * @returns {Promise<{blocked: boolean, reason?: string}>}
 */
async function detectPopupBlocker() {
  return new Promise((resolve) => {
    try {
      // Try a simpler popup test that's less likely to be blocked
      const testPopup = window.open('about:blank', 'test', 'width=1,height=1');

      if (!testPopup || testPopup.closed || typeof testPopup.closed === 'undefined') {
        resolve({ blocked: true, reason: 'popup_blocked_by_browser' });
        return;
      }

      // Close the test popup and report success
      setTimeout(() => {
        try {
          testPopup.close();
          resolve({ blocked: false });
        } catch (e) {
          resolve({ blocked: false }); // Assume it worked if we can't check
        }
      }, 50);
    } catch (error) {
      resolve({ blocked: false }); // Don't block OAuth for detection errors
    }
  });
}

/**
 * Get browser-specific instructions for enabling popups
 * @param {string} browser Browser name
 * @returns {string} HTML instructions
 */
function getPopupInstructions(browser) {
  const instructions = {
    chrome: `
            <strong>🌐 Chrome:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Look for the popup blocked icon <strong>🚫</strong> in the address bar</li>
              <li>Click on it and select "Always allow popups from figma.com"</li>
              <li>Click "Done" and try the OAuth button again</li>
            </ol>
          `,
    firefox: `
            <strong>🦊 Firefox:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Look for the preferences icon in the address bar</li>
              <li>Click "Show Blocked Pop-ups"</li>
              <li>Select "Allow pop-ups for figma.com"</li>
              <li>Try the OAuth button again</li>
            </ol>
          `,
    safari: `
            <strong>🧭 Safari:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Go to Safari → Preferences → Websites</li>
              <li>Select "Pop-up Windows" in the left sidebar</li>
              <li>Find figma.com and set it to "Allow"</li>
              <li>Try the OAuth button again</li>
            </ol>
          `,
    edge: `
            <strong>🌊 Edge:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Look for the popup blocked icon in the address bar</li>
              <li>Click on it and select "Always allow"</li>
              <li>Try the OAuth button again</li>
            </ol>
          `,
    other: `
            <strong>General Instructions:</strong>
            <ol style="margin: 8px 0; padding-left: 20px; line-height: 1.6;">
              <li>Look for a popup blocked notification in your browser</li>
              <li>Add figma.com to your allowed sites</li>
              <li>Try the OAuth button again</li>
            </ol>
          `,
  };
  return instructions[browser] || instructions.other;
}

/**
 * Show popup blocker help modal
 */
function showPopupBlockerHelp() {
  const browser = detectBrowser();
  const instructions = getPopupInstructions(browser);

  showCustomModal(
    '🔓 Enable Popups for OAuth',
    `
            <div style="text-align: left; color: rgba(255, 255, 255, 0.9);">
              <p style="margin-bottom: 16px;">
                To use GitHub OAuth login, you need to allow popups for this site.
              </p>
              
              ${instructions}
              
              <div style="
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-top: 16px;
              ">
                <strong style="color: #c4b5fd;">💡 Why popups?</strong><br>
                <span style="font-size: 13px; color: rgba(255, 255, 255, 0.8);">
                  OAuth requires a secure popup window for authentication. 
                  This is a one-time setup and improves security.
                </span>
              </div>

              <div style="
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                border-radius: 8px;
                padding: 12px;
                margin-top: 12px;
              ">
                <strong style="color: #22c55e;">✨ Alternative Options:</strong><br>
                <span style="font-size: 13px; color: rgba(255, 255, 255, 0.8); display: block; margin-bottom: 8px;">
                  1. Use a Personal Access Token instead of OAuth - just enter your GitHub token in the field above.
                </span>
                <span style="font-size: 13px; color: rgba(255, 255, 255, 0.8);">
                  2. Or open GitHub OAuth in a new tab manually.
                </span>
              </div>
            </div>
          `,
    [
      {
        text: 'Try Again',
        primary: true,
        action: () => startOAuthFlow(),
      },
      {
        text: 'Open in Browser',
        action: () => startOAuthFlow(),
      },
      {
        text: 'Close',
        action: () => {}, // Just close
      },
    ],
  );
}

// openOAuthInNewTab removed - now using figma.openExternal via parent.postMessage

/**
 * Show a custom modal dialog
 * @param {string} title Modal title
 * @param {string} content HTML content
 * @param {Array<{text: string, primary?: boolean, action: function}>} buttons Button configuration
 */
function showCustomModal(title, content, buttons = []) {
  // Create modal overlay
  const modalId = 'custom-modal-' + Date.now();
  const modal = document.createElement('div');
  modal.id = modalId;
  modal.className = 'modal';
  modal.style.display = 'block';

  modal.innerHTML = `
          <div class="modal-content" style="max-width: 550px;">
            <button class="close-modal" onclick="document.getElementById('${modalId}').remove()">×</button>
            <div class="modal-header">
              <h3>${title}</h3>
            </div>
            <div class="modal-body">
              ${content}
            </div>
            <div class="modal-footer" style="display: flex; gap: 8px; justify-content: flex-end;">
              ${buttons
                .map(
                  (btn, idx) => `
                <button 
                  id="${modalId}-btn-${idx}"
                  class="${btn.primary ? 'btn-primary' : ''}"
                  style="${btn.primary ? 'background: #667eea;' : ''}"
                >
                  ${btn.text}
                </button>
              `,
                )
                .join('')}
            </div>
          </div>
        `;

  document.body.appendChild(modal);

  // Attach button handlers
  buttons.forEach((btn, idx) => {
    const btnEl = document.getElementById(`${modalId}-btn-${idx}`);
    if (btnEl) {
      btnEl.onclick = () => {
        btn.action && btn.action();
        modal.remove();
      };
    }
  });
}

// ========================================
// Enhanced OAuth Flow
// ========================================

async function startGitHubOAuthFlow() {
  const GITHUB_CLIENT_ID = 'Ov23liKXGtyeKaklFf0Q';
  const REDIRECT_URI = 'https://bridgy-oauth.netlify.app/github/callback';
  const SCOPES = ['repo', 'read:user', 'user:email'];

  return new Promise(async (resolve) => {
    try {
      console.log('🚀 Starting GitHub OAuth flow...');

      // Generate secure state for CSRF protection
      const state = generateSecureState();

      // Build OAuth URL
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES.join(' '),
        state: state,
        response_type: 'code',
      });

      const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

      console.log('🔗 Opening OAuth in external browser:', authUrl);

      // Use Figma's proper external URL opening
      // This opens the URL in the user's default browser outside of Figma
      parent.postMessage({ pluginMessage: { type: 'open-external', url: authUrl } }, '*');

      // Show user-friendly instructions
      showNotification(
        '🌐 GitHub OAuth opened in your browser. After authorization, copy the token from the callback page and paste it above.',
        'info',
        12000,
      );

      // Since we can't get the callback in Figma plugins, resolve immediately with instructions
      resolve({
        success: true,
        requiresManualCopy: true,
        message: 'OAuth opened in external browser. Please copy the token manually.',
        authUrl: authUrl,
      });
    } catch (error) {
      console.error('💥 OAuth flow error:', error);
      resolve({
        success: false,
        error: error.message || 'An unexpected error occurred',
        errorType: 'UNKNOWN_ERROR',
      });
    }
  });
}

function generateSecureState() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => {
    const hex = byte.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Initialize Variable Import Tab
function initializeVariableImportTab() {
  const container = document.getElementById('variable-import-container');
  if (!container) return;

  // Check if already initialized
  if (container.classList.contains('initialized')) return;
  container.classList.add('initialized');

  // Create Variable Import UI
  container.innerHTML = `
          <div class="variable-import-tab">
            <div class="variable-import-header">
              <h2>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Variable Import
              </h2>
              <p>Import design tokens from CSS, SCSS or JSON files and sync them with Figma Variables.</p>
            </div>

            <div class="import-section">
              <h3>Input Design Tokens</h3>
              <div class="input-tabs">
                <button class="input-tab active" data-input="manual">Manual Input</button>
                <button class="input-tab" data-input="file">File Upload</button>
              </div>
              
              <div class="input-content active" id="manual-input">
                <div class="input-format-selector">
                  <label>
                    <input type="radio" name="format" value="css" checked>
                    CSS Variables
                  </label>
                  <label>
                    <input type="radio" name="format" value="json">
                    JSON Tokens
                  </label>
                </div>
                <textarea 
                  id="token-input" 
                  placeholder=":root {\\n  --primary-500: #8b5cf6;\\n  --space-4: 1rem;\\n  --text-lg: 1.125rem;\\n}"
                ></textarea>
                <div class="input-actions">
                  <button class="btn btn-primary" onclick="console.log('Button clicked!'); parseTokenInput();">Parse Tokens</button>
                  <button class="btn btn-secondary" onclick="loadSampleData()">Load Sample</button>
                  <button class="btn btn-secondary" onclick="clearInput()">Clear</button>
                </div>
                <div id="parse-status" class="parse-status" style="display: none;"></div>
              </div>
              
              <!-- File Upload Input -->
              <div id="upload-input" class="input-content">
                <div class="file-upload-area" onclick="document.getElementById('file-picker').click()">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                  </svg>
                  <p>Click to select or drag & drop your token file</p>
                  <small>Supports .css, .scss, .json files</small>
                </div>
                <input type="file" id="file-picker" accept=".css,.json,.scss" style="display: none;" onchange="handleFileUpload(event)">
              </div>
            </div>

            <div id="preview-section" class="import-section" style="display: none;">
              <h3>Preview & Configure</h3>
              <div id="preview-content">
                <!-- Dynamic content will be inserted here -->
              </div>
            </div>

            <div id="import-section" class="import-section" style="display: none;">
              <h3>Import to Figma</h3>
              <div id="import-content">
                <!-- Dynamic content will be inserted here -->
              </div>
            </div>
          </div>
        `;

  // Initialize input tab switching
  container.querySelectorAll('.input-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      container.querySelectorAll('.input-tab').forEach((t) => t.classList.remove('active'));
      container.querySelectorAll('.input-content').forEach((c) => c.classList.remove('active'));

      tab.classList.add('active');
      const target = tab.dataset.input + '-input';
      container.querySelector('#' + target).classList.add('active');
    });
  });

  // Load existing collections for the dropdown
  loadExistingCollections();
}

// Test function to verify JavaScript is working
window.testFunction = function () {
  console.log('Test function called successfully!');
  alert('Test function works!');
};

// Variable Import helper functions
window.parseTokenInput = function () {
  console.log('[DEBUG] parseTokenInput function called');

  const textarea = document.getElementById('token-input');
  const format = document.querySelector('input[name="format"]:checked');
  const statusDiv = document.getElementById('parse-status');

  console.log('[DEBUG] Elements:', {
    textarea: textarea,
    hasTextarea: !!textarea,
    textareaValue: textarea ? textarea.value : 'null',
    textareaLength: textarea ? textarea.value.length : 'null',
    format: format,
    formatValue: format ? format.value : 'null',
    statusDiv: statusDiv,
  });

  if (!textarea || !textarea.value.trim()) {
    console.log('[DEBUG] No textarea or empty value');
    showStatus('Please enter some tokens to parse', 'warning');
    return;
  }

  console.log('[DEBUG] Starting parse process...');
  showStatus('Parsing tokens...', 'info');

  // Simple token parsing simulation
  setTimeout(() => {
    try {
      console.log('[DEBUG] In setTimeout, format value:', format ? format.value : 'null');
      console.log('[DEBUG] CSS content to parse:', textarea.value.substring(0, 200) + '...');

      let tokens = [];
      if (format && format.value === 'css') {
        console.log('[DEBUG] Calling parseCSSTokens...');
        tokens = parseCSSTokens(textarea.value);
        console.log('[DEBUG] parseCSSTokens returned:', tokens.length, 'tokens');
      } else {
        console.log('[DEBUG] Calling parseJSONTokens...');
        tokens = parseJSONTokens(textarea.value);
        console.log('[DEBUG] parseJSONTokens returned:', tokens.length, 'tokens');
      }
      console.log('[DEBUG] Final tokens array:', tokens);

      // Resolve dependencies for variable references
      const sortedTokens = resolveTokenDependencies(tokens);
      console.log('[DEBUG] Dependency-resolved tokens:', sortedTokens.length);

      // Store tokens globally for import
      window.parsedTokens = sortedTokens;
      console.log('[DEBUG] Stored parsedTokens:', window.parsedTokens);

      showStatus(
        `Successfully parsed ${tokens.length} tokens (${sortedTokens.filter((t) => t.isAlias).length} with references)`,
        'success',
      );
      showPreview(sortedTokens);
    } catch (error) {
      console.error('[DEBUG] Parse error:', error);
      showStatus(`Parse error: ${error.message}`, 'error');
    }
  }, 500);
};

window.loadSampleData = function () {
  const sampleCSS = `:root {
  /* Primary Colors */
  --primary-50: #f0f9ff;
  --primary-100: #e0e7ff;
  --primary-500: #8b5cf6;
  --primary-600: #7c3aed;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  --space-8: 2rem;
  
  /* Typography */
  --text-sm: 0.875rem;
  --text-base: 1rem;
      --text-lg: 1.125rem;
}`;
  document.getElementById('token-input').value = sampleCSS;
};

// Variable Import helper functions
window.clearInput = function () {
  const tokenInput = document.getElementById('token-input');
  const importInput = document.getElementById('import-input');
  const parseStatus = document.getElementById('parse-status');
  const previewSection = document.getElementById('preview-section');
  const importSection = document.getElementById('import-section');

  if (tokenInput) tokenInput.value = '';
  if (importInput) importInput.value = ''; // Also clear import input
  if (parseStatus) parseStatus.style.display = 'none';
  if (previewSection) previewSection.style.display = 'none';
  if (importSection) importSection.style.display = 'none';
};

window.handleFileUpload = function (event) {
  const file = event.target.files[0];
  window.processFile(file);
};

window.processFile = function (file) {
  if (!file) return;

  const fileName = file.name.toLowerCase();
  if (!fileName.endsWith('.css') && !fileName.endsWith('.json') && !fileName.endsWith('.scss')) {
    alert('Please upload a .css, .scss, or .json file');
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const tokenInput = document.getElementById('token-input');
    
    if (tokenInput) {
      tokenInput.value = content;
      
      // Auto-select the correct format based on extension
      if (fileName.endsWith('.json')) {
        const jsonRadio = document.querySelector('input[name="format"][value="json"]');
        if (jsonRadio) jsonRadio.checked = true;
      } else {
        // CSS or SCSS
        const cssRadio = document.querySelector('input[name="format"][value="css"]');
        if (cssRadio) cssRadio.checked = true;
      }
      
      // Switch to manual input tab to show the content
      const manualTab = document.querySelector('.input-tab[data-input="manual"]');
      if (manualTab) manualTab.click();
    }
  };
  reader.readAsText(file);
};

function showStatus(message, type) {
  const statusDiv = document.getElementById('parse-status');
  statusDiv.className = `parse-status ${type}`;
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
}

function extractVariableReferences(value) {
  const references = [];
  // Match var(--variable-name) patterns
  const varPattern = /var\(\s*--([^,)]+)(?:\s*,\s*([^)]*))?\s*\)/g;
  let match;

  while ((match = varPattern.exec(value)) !== null) {
    references.push(match[1].trim()); // Extract variable name without --
  }

  return references;
}

function resolveTokenDependencies(tokens) {
  // Create a map of token names to tokens
  const tokenMap = new Map();
  tokens.forEach((token) => tokenMap.set(token.name, token));

  // Sort tokens by dependency order (dependencies first)
  const visited = new Set();
  const visiting = new Set();
  const sorted = [];

  function visit(tokenName) {
    if (visited.has(tokenName)) return;
    if (visiting.has(tokenName)) {
      console.warn('Circular dependency detected for token:', tokenName);
      return;
    }

    visiting.add(tokenName);
    const token = tokenMap.get(tokenName);

    if (token && token.references) {
      for (const ref of token.references) {
        if (tokenMap.has(ref)) {
          visit(ref);
        }
      }
    }

    visiting.delete(tokenName);
    visited.add(tokenName);
    if (token) sorted.push(token);
  }

  // Visit all tokens
  tokens.forEach((token) => visit(token.name));

  return sorted;
}

function parseCSSTokens(css) {
  console.log('[DEBUG] parseCSSTokens called with CSS length:', css.length);
  console.log('[DEBUG] First 200 chars of input:', css.substring(0, 200));

  const tokens = [];

  // Clean up CSS first - remove comments but preserve structure
  const cleanedCSS = css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
    .replace(/^\s*\/\/.*$/gm, ''); // Remove // comments

  console.log('[DEBUG] After cleaning, CSS length:', cleanedCSS.length);
  console.log('[DEBUG] First 200 chars of cleaned CSS:', cleanedCSS.substring(0, 200));

  // Manual parsing approach for better handling of edge cases
  let i = 0;
  while (i < cleanedCSS.length) {
    // Find the start of a CSS variable
    const varStart = cleanedCSS.indexOf('--', i);
    if (varStart === -1) {
      console.log('[DEBUG] No more CSS variables found from position', i);
      break;
    }
    // Found CSS variable

    // Find the colon
    const colonIndex = cleanedCSS.indexOf(':', varStart);
    if (colonIndex === -1) {
      i = varStart + 2;
      continue;
    }

    // Extract variable name
    const varName = cleanedCSS.substring(varStart + 2, colonIndex).trim();

    // Validation: Reject invalid variable names
    // 1. Empty names
    // 2. Names containing invalid characters (newlines, parentheses, braces, semicolons)
    // 3. Names that are too long (likely captured code blocks)
    if (
      !varName ||
      varName.includes('\n') ||
      varName.includes('(') ||
      varName.includes(')') ||
      varName.includes('{') ||
      varName.includes('}') ||
      varName.includes(';') ||
      varName.length > 100
    ) {
      // This is likely a false positive (e.g. usage of var(--name) followed by a colon later)
      // Skip this match and continue search from the colon
      console.log(
        '[DEBUG] Skipping invalid variable name candidate:',
        varName.substring(0, 50) + (varName.length > 50 ? '...' : ''),
      );
      i = colonIndex + 1;
      continue;
    }

    // Find the value end by tracking quotes and parentheses
    let valueStart = colonIndex + 1;
    let valueEnd = valueStart;
    let inDoubleQuote = false;
    let inSingleQuote = false;
    let parenDepth = 0;

    while (valueEnd < cleanedCSS.length) {
      const char = cleanedCSS[valueEnd];
      const prevChar = valueEnd > 0 ? cleanedCSS[valueEnd - 1] : '';

      // Handle quotes (check for escaping)
      if (char === '"' && prevChar !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      } else if (char === "'" && prevChar !== '\\') {
        inSingleQuote = !inSingleQuote;
      }

      // Handle parentheses when not in quotes
      if (!inDoubleQuote && !inSingleQuote) {
        if (char === '(') parenDepth++;
        else if (char === ')') parenDepth--;

        // End of value found
        if (char === ';' && parenDepth === 0) {
          break;
        }

        // Also end at closing brace if not in a value
        if (char === '}' && parenDepth === 0) {
          break;
        }
      }

      valueEnd++;
    }

    // Extract and clean the value
    const value = cleanedCSS.substring(valueStart, valueEnd).trim();
    // Parsed variable
    if (value) {
      // Convert dash-separated names to slash-separated groups for Figma
      // e.g. --primary-50 -> primary/50
      let finalName = varName;
      const cleanName = varName.startsWith('--') ? varName.substring(2) : varName;
      const parts = cleanName.split('-');
      if (parts.length > 1) {
        // Heuristic: Use first part as group
        const groupPart = parts[0];
        const valuePart = parts.slice(1).join('-');
        finalName = `${groupPart}/${valuePart}`;
      }

      const token = {
        name: finalName,
        value: value,
        type: detectTokenType(value, varName),
        // Detect if this token references other variables
        references: extractVariableReferences(value),
        isAlias: value.trim().startsWith('var(') && value.trim().match(/^var\([^)]+\)$/),
      };
      tokens.push(token);
      // Token added
    }

    i = valueEnd + 1;
  }

  console.log('[DEBUG] Final parsed CSS tokens:', tokens.length, tokens);

  if (tokens.length === 0) {
    console.log('[DEBUG] No tokens found, throwing error');
    throw new Error('No valid CSS custom properties found');
  }

  return tokens;
}

function parseJSONTokens(json) {
  const tokens = [];
  const data = JSON.parse(json);

  function traverse(obj, path = []) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        traverse(value, [...path, key]);
      } else {
        const tokenName = [...path, key].join('/');
        tokens.push({
          name: tokenName,
          value: value.toString(),
          type: detectTokenType(value.toString(), tokenName),
        });
      }
    }
  }

  traverse(data);
  return tokens;
}

function detectTokenType(value, name = '') {
  // Normalize value and name for analysis
  const cleanValue = value.trim();
  const lowerName = name.toLowerCase();

  // Number detection - check value first to prioritize actual content
  const numberPatterns = [
    /^\d+(\.\d+)?$/, // Plain numbers: 16, 1.5
    /^\d+(\.\d+)?(px|rem|em|ch|ex|vh|vw|vmin|vmax|%|pt|pc|in|cm|mm)$/i, // CSS units
    /^-?\d+(\.\d+)?$/, // Negative numbers
    /^\d+(\.\d+)?e[+-]?\d+$/, // Scientific notation
  ];

  const isNumberValue = numberPatterns.some((pattern) => pattern.test(cleanValue));

  if (isNumberValue) {
    return 'NUMBER';
  }

  // Color detection - more comprehensive patterns
  const colorPatterns = [
    /^#[0-9a-fA-F]{3}$/, // #fff
    /^#[0-9a-fA-F]{6}$/, // #ffffff
    /^#[0-9a-fA-F]{8}$/, // #ffffffff (with alpha)
    /^rgb\s*\(/, // rgb(255, 255, 255)
    /^rgba\s*\(/, // rgba(255, 255, 255, 0.5)
    /^hsl\s*\(/, // hsl(180, 50%, 50%)
    /^hsla\s*\(/, // hsla(180, 50%, 50%, 0.5)
    /^var\(--[\w-]+\)$/, // CSS variables referring to colors
  ];

  // Check if value matches color patterns
  const isColorValue = colorPatterns.some((pattern) => pattern.test(cleanValue));

  if (isColorValue) {
    return 'COLOR';
  }

  // Check for explicit color keywords in name (only after value-based detection)
  const colorKeywords = [
    'color',
    'bg',
    'background',
    'border',
    'primary',
    'secondary',
    'accent',
    'success',
    'warning',
    'error',
    'danger',
    'info',
  ];
  const hasColorKeyword = colorKeywords.some((keyword) => lowerName.includes(keyword));

  if (hasColorKeyword) {
    return 'COLOR';
  }

  // Detect specific style types for complex values
  if (
    cleanValue.includes('linear-gradient') ||
    cleanValue.includes('radial-gradient') ||
    cleanValue.includes('conic-gradient')
  ) {
    return 'GRADIENT';
  }

  if (
    cleanValue.includes('rgba(') ||
    cleanValue.includes('hsla(') ||
    (cleanValue.includes('rgb(') && cleanValue.includes(',') && cleanValue.includes('/'))
  ) {
    return 'RGBA_COLOR';
  }

  // Shadow detection - box-shadow patterns
  if (
    cleanValue.match(/^\d+px\s+\d+px\s+\d+px/) ||
    cleanValue.includes('inset') ||
    cleanValue.match(/\d+px.*rgb/)
  ) {
    return 'SHADOW';
  }

  // Blur effects
  if (cleanValue.includes('blur(')) {
    return 'BLUR';
  }

  // Transition/animation
  if (
    cleanValue.includes('ease') ||
    cleanValue.includes('cubic-bezier') ||
    (cleanValue.includes('linear') && cleanValue.includes('s'))
  ) {
    return 'TRANSITION';
  }

  // Everything else is a string
  return 'STRING';
}

function categorizeToken(token) {
  const name = token.name.toLowerCase();
  const value = token.value.toLowerCase();

  // Color category
  if (token.type === 'COLOR' || token.type === 'RGBA_COLOR') {
    return 'color';
  }

  // Numeric category - for NUMBER type tokens
  if (token.type === 'NUMBER') {
    return 'numeric';
  }

  // Style categories for Figma styles
  if (token.type === 'GRADIENT') {
    return 'gradient';
  }

  if (token.type === 'SHADOW') {
    return 'shadow';
  }

  if (token.type === 'BLUR') {
    return 'effect';
  }

  if (token.type === 'TRANSITION') {
    return 'transition';
  }

  // Default to 'other' category for truly unsupported types
  return 'other';
}

function showPreview(tokens) {
  const previewSection = document.getElementById('preview-section');
  const previewContent = document.getElementById('preview-content');

  // Function to extract group name from token name (matching backend logic)
  function extractGroupFromTokenName(tokenName) {
    // Handle Figma-style grouping with slashes first (primary/50)
    if (tokenName.includes('/')) {
      return tokenName.split('/')[0];
    }

    const cleanName = tokenName.startsWith('--') ? tokenName.slice(2) : tokenName;
    const parts = cleanName.split('-');
    return parts.length > 1 ? parts[0] : 'misc';
  }

  // Group tokens by their extracted group names
  const tokensByGroup = {};
  const supportedTokens = tokens.filter((token) => {
    const category = categorizeToken(token);
    return ['color', 'numeric', 'gradient', 'shadow', 'effect', 'transition'].includes(category);
  });

  // Separate tokens by import type
  const variableTokens = supportedTokens.filter((token) => {
    const category = categorizeToken(token);
    return category === 'color' || category === 'numeric';
  });

  const styleTokens = supportedTokens.filter((token) => {
    const category = categorizeToken(token);
    return ['gradient', 'shadow', 'effect', 'transition'].includes(category);
  });

  supportedTokens.forEach((token) => {
    const groupName = extractGroupFromTokenName(token.name);
    if (!tokensByGroup[groupName]) {
      tokensByGroup[groupName] = [];
    }
    tokensByGroup[groupName].push(token);
  });

  const groupNames = Object.keys(tokensByGroup);
  const totalSupportedTokens = supportedTokens.length;
  const aliasCount = variableTokens.filter((t) => t.isAlias).length;
  const directVariableCount = variableTokens.length - aliasCount;

  const previewHTML = `
          <div class="diff-summary">
            <h4>Token Preview (${totalSupportedTokens} supported tokens found)</h4>
            <div class="diff-stats">
              <div class="stat-item new">
                <span class="stat-number">${variableTokens.length}</span>
                <span class="stat-label">Variables</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${styleTokens.length}</span>
                <span class="stat-label">Styles</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">${aliasCount}</span>
                <span class="stat-label">References</span>
              </div>
            </div>
          </div>

          <div class="import-structure-preview">
            <div class="tab-header" style="margin-bottom: var(--space-2);">
                <h3 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
                  <span class="material-symbols-outlined" style="font-size: 22px; color: var(--purple-light);">folder_open</span>
                  Variables Preview
                </h3>
            </div>
            
            <div class="toolbar" style="margin-bottom: 16px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
              <!-- Left: Selection Actions -->
              <div style="display: flex; gap: 4px;">
                <button class="compact-action-btn" onclick="selectAllVariables(true)" data-tooltip="Select All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">select_all</span>
                </button>
                <button class="compact-action-btn" onclick="selectAllVariables(false)" data-tooltip="Deselect All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">deselect</span>
                </button>
              </div>

              <!-- Right: View Actions -->
              <div style="display: flex; gap: 4px;">
                <button class="compact-action-btn" onclick="expandAllImportGroups()" data-tooltip="Expand All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">unfold_more</span>
                </button>
                <button class="compact-action-btn" onclick="collapseAllImportGroups()" data-tooltip="Collapse All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">unfold_less</span>
                </button>
              </div>
            </div>

            <div class="variables-preview">
              <div class="variable-collection">
                <div class="collection-header">
                  <div class="collection-info" style="display: flex; align-items: center;">
                    <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">folder</span>
                    <h3 class="collection-name-title" style="margin: 0 8px;">Design Tokens</h3>
                    <span class="subgroup-stats" style="margin: 0;">(Collection)</span>
                  </div>
                </div>
                
                <div class="collection-content">
                ${groupNames
                  .map((groupName) => {
                    const groupTokens = tokensByGroup[groupName].filter(
                      (t) => categorizeToken(t) === 'color' || categorizeToken(t) === 'numeric',
                    );
                    if (groupTokens.length === 0) return '';
                    const groupId = `import-group-${groupName.replace(/[^a-zA-Z0-9]/g, '-')}`;
                    const colorCount = groupTokens.filter(
                      (t) => categorizeToken(t) === 'color',
                    ).length;
                    const numericCount = groupTokens.filter(
                      (t) => categorizeToken(t) === 'numeric',
                    ).length;
                    const aliasCount = groupTokens.filter((t) => t.isAlias).length;

                    // Clean group name (remove trailing slash if present for display)
                    const displayName = groupName.endsWith('/')
                      ? groupName.slice(0, -1)
                      : groupName;

                    return `
                    <div class="variable-subgroup" id="${groupId}">
                      <div class="subgroup-header collapsed" onclick="toggleSubgroup('${groupId}')">
                        <div class="subgroup-title">
                          <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--text-secondary);">folder_open</span>
                          ${displayName}
                          <span class="subgroup-stats">${groupTokens.length} vars • ${colorCount} colors • ${numericCount} numeric</span>
                          <div class="group-status" style="display: inline-flex; margin-left: 8px; gap: 4px;">
                             <span class="status-badge new" style="font-size: 10px; padding: 1px 4px; border-radius: 4px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">${groupTokens.length - aliasCount} new</span>
                             ${aliasCount > 0 ? `<span class="status-badge alias" style="font-size: 10px; padding: 1px 4px; border-radius: 4px; background: rgba(168, 85, 247, 0.2); color: #c084fc;">${aliasCount} refs</span>` : ''}
                          </div>
                        </div>
                        <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                      </div>
                      <div class="subgroup-content collapsed" id="${groupId}-content">
                        <div class="variables-table">
                          ${groupTokens
                            .map((token) => {
                              const tokenId = `token-${token.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                              const category = categorizeToken(token);
                              const valueDisplay =
                                category === 'color'
                                  ? `<span class="color-preview" style="background-color: ${token.value}"></span>${token.value}`
                                  : token.value;

                              const isDuplicate = checkDuplicate(token.name);
                              const duplicateBadge = isDuplicate
                                ? '<span class="status-badge alias" style="background-color: #fef3c7; color: #d97706; border: 1px solid #fcd34d;">Exists</span>'
                                : '';

                              return `
                              <div class="variable-row ${isDuplicate ? 'duplicate-row' : ''}">
                                <label class="checkbox-label">
                                  <input type="checkbox" id="${tokenId}" checked class="variable-checkbox" data-token-name="${token.name}">
                                  <span class="variable-name" style="font-size: 11px;">${token.name}</span>
                                </label>
                                <span class="variable-type" style="font-size: 11px;">${category}</span>
                                <span class="variable-value" style="font-size: 11px;">${valueDisplay}</span>
                                ${duplicateBadge}
                                ${token.isAlias ? '<span class="alias-badge">ref</span>' : ''}
                              </div>
                            `;
                            })
                            .join('')}
                        </div>
                      </div>
                    </div>
                  `;
                  })
                  .filter(Boolean)
                  .join('')}
                </div>
              </div>
            </div>
            <div class="summary-stats" style="margin-top: 16px; color: var(--text-secondary); font-size: 11px; display: flex; gap: 8px; align-items: center;">
              <span class="summary-item" style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">folder</span> 1 collection</span>
              <span class="summary-item" style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">folder_open</span> ${groupNames.length} groups</span>
              <span class="summary-item" style="display: flex; align-items: center; gap: 4px;"><span class="material-symbols-outlined" style="font-size: 14px;">data_object</span> ${variableTokens.length} variables</span>
            </div>
          </div>
          
          ${
            styleTokens.length > 0
              ? `
          <div class="import-structure-preview">
            <div class="tab-header" style="margin-bottom: var(--space-2);">
                <h3 style="color: rgba(255, 255, 255, 0.9); display: flex; align-items: center; gap: 10px; font-size: 1.2rem; margin: 0;">
                  <span class="material-symbols-outlined" style="font-size: 22px; color: var(--purple-light);">palette</span>
                  Figma Styles Preview
                </h3>
            </div>
            
            <div class="toolbar" style="margin-bottom: 16px; background: rgba(0,0,0,0.2); padding: 8px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
              <!-- Left: Selection Actions -->
              <div style="display: flex; gap: 4px;">
                <button class="compact-action-btn" onclick="selectAllStyles(true)" data-tooltip="Select All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">select_all</span>
                </button>
                <button class="compact-action-btn" onclick="selectAllStyles(false)" data-tooltip="Deselect All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">deselect</span>
                </button>
              </div>

              <!-- Right: View Actions -->
              <div style="display: flex; gap: 4px;">
                <button class="compact-action-btn" onclick="expandAllStyleGroups()" data-tooltip="Expand All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">unfold_more</span>
                </button>
                <button class="compact-action-btn" onclick="collapseAllStyleGroups()" data-tooltip="Collapse All" style="width: 32px; height: 32px; justify-content: center; display: flex; align-items: center;">
                  <span class="material-symbols-outlined" style="font-size: 20px;">unfold_less</span>
                </button>
              </div>
            </div>

            <div class="styles-preview">
              ${['gradient', 'shadow', 'effect', 'transition']
                .map((category) => {
                  const categoryTokens = styleTokens.filter((t) => categorizeToken(t) === category);
                  if (categoryTokens.length === 0) return '';
                  // Ensure icons are Material Symbols
                  const categoryIcons = {
                    gradient: 'palette',
                    shadow: 'blur_on',
                    effect: 'auto_fix_high',
                    transition: 'animation',
                  };
                  const categoryNames = {
                    gradient: 'Paint Styles',
                    shadow: 'Effect Styles',
                    effect: 'Effect Styles',
                    transition: 'Transitions',
                  };
                  const categoryId = `style-group-${category}`;
                  return `
                  <div class="variable-subgroup" id="${categoryId}">
                    <div class="subgroup-header collapsed" onclick="toggleSubgroup('${categoryId}')">
                      <div class="subgroup-title">
                        <span class="material-symbols-outlined" style="font-size: 16px; margin-right: 6px; color: var(--text-secondary);">${categoryIcons[category]}</span>
                        ${categoryNames[category]}
                        <span class="subgroup-stats">${categoryTokens.length} styles</span>
                        <div class="group-status" style="display: inline-flex; margin-left: 8px;">
                          <span class="status-badge new" style="font-size: 10px; padding: 1px 4px; border-radius: 4px; background: rgba(34, 197, 94, 0.2); color: #4ade80;">${categoryTokens.length} new</span>
                        </div>
                      </div>
                      <span class="material-symbols-outlined subgroup-toggle-icon">expand_more</span>
                    </div>
                    <div class="subgroup-content collapsed" id="${categoryId}-content">
                      <div class="styles-table">
                        ${categoryTokens
                          .map((token) => {
                            const tokenId = `style-${token.name.replace(/[^a-zA-Z0-9]/g, '-')}`;
                            return `
                            <div class="variable-row">
                              <label class="checkbox-label">
                                <input type="checkbox" id="${tokenId}" checked class="style-checkbox" data-token-name="${token.name}">
                                <span class="variable-name" style="font-size: 11px;">${token.name}</span>
                              </label>
                              <span class="variable-type" style="font-size: 11px;">${category}</span>
                              <span class="variable-value" style="font-size: 11px;">${token.value}</span>
                            </div>
                          `;
                          })
                          .join('')}
                      </div>
                    </div>
                  </div>
                `;
                })
                .join('')}
            </div>
            <div class="summary-stats" style="margin-top: 16px; color: var(--text-secondary); font-size: 11px;">
               <span class="summary-item">🎨 ${styleTokens.length} styles ready to import</span>
            </div>
          </div>
          `
              : ''
          }
          
          <div class="options-grid">
            <div class="option-group">
              <h4>Import Destination</h4>
              <div class="destination-selector" style="display: flex; gap: 16px; margin-bottom: 12px;">
                <label class="radio-option" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                   <input type="radio" name="import-destination" value="new" checked onchange="toggleImportDestination('new')">
                   <span>New Collection</span>
                </label>
                <label class="radio-option" style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                   <input type="radio" name="import-destination" value="existing" onchange="toggleImportDestination('existing')">
                   <span>Existing Collection</span>
                </label>
              </div>

              <div id="new-collection-group" class="input-group">
                <label>Collection Name <span class="material-symbols-outlined help-icon" data-tooltip="Name of the variable collection to create in Figma">help</span></label>
                <input type="text" id="collection-name" value="Design Tokens" placeholder="Enter collection name">
              </div>

              <div id="existing-collection-group" class="input-group" style="display: none;">
                <label>Select Collection <span class="material-symbols-outlined help-icon" data-tooltip="Choose an existing variable collection to merge into">help</span></label>
                <select id="existing-collection-select">
                  <option value="">Loading collections...</option>
                </select>
              </div>

              <div style="height: 1px; background: rgba(255,255,255,0.1); margin: 16px 0;"></div>

              <h4>Settings</h4>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <label class="toggle-switch">
                  <input type="checkbox" class="toggle-input" id="organize-by-categories" checked>
                  <div class="toggle-slider"></div>
                  <span class="settings-label" style="margin-bottom: 0;">Organize by categories</span>
                  <span class="material-symbols-outlined" style="font-size: 14px; opacity: 0.4; cursor: help;" data-tooltip="Auto-group variables using slashes (e.g. 'color/blue')">help</span>
                </label>

                <label class="toggle-switch">
                  <input type="checkbox" class="toggle-input" id="overwrite-existing">
                  <div class="toggle-slider"></div>
                  <span class="settings-label" style="margin-bottom: 0;">Overwrite existing variables</span>
                  <span class="material-symbols-outlined" style="font-size: 14px; opacity: 0.4; cursor: help;" data-tooltip="Overwrite variables with same name">help</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="import-actions">
            <button class="btn btn-primary btn-large" onclick="simulateImport()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7,10 12,15 17,10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Import to Figma
            </button>
            <button class="btn btn-secondary" onclick="clearInput()">Cancel</button>
          </div>
        `;

  previewContent.innerHTML = SecurityUtils.sanitizeHTML(previewHTML);
  previewSection.style.display = 'block';

  // Add event listener to update collection name preview
  const collectionNameInput = document.getElementById('collection-name');
  if (collectionNameInput) {
    collectionNameInput.addEventListener('input', updateCollectionNamePreview);
  }

  // Load existing collections to populate the dropdown
  loadExistingCollections();
}

function checkDuplicate(tokenName) {
  if (!window.existingCollections) return false;

  // Check all collections for a variable with this name
  for (const collection of window.existingCollections) {
    if (collection.variables && collection.variables.some((v) => v.name === tokenName)) {
      return true;
    }
  }
  return false;
}

function updateCollectionNamePreview() {
  const collectionNameInput = document.getElementById('collection-name');
  const collectionNamePreview = document.querySelector('.collection-name-preview');

  if (collectionNameInput && collectionNamePreview) {
    const newName = collectionNameInput.value.trim() || 'Design Tokens';
    collectionNamePreview.textContent = newName;
  }
}

window.toggleImportDestination = function (mode) {
  console.log('[DEBUG] toggleImportDestination called with mode:', mode);
  const collectionNameGroup = document.getElementById('new-collection-group');
  const existingCollectionGroup = document.getElementById('existing-collection-group');

  console.log('[DEBUG] Found elements:', {
    collectionNameGroup: !!collectionNameGroup,
    existingCollectionGroup: !!existingCollectionGroup
  });

  if (mode === 'new') {
    // Show collection name input, hide existing collections dropdown
    if (collectionNameGroup) collectionNameGroup.style.display = 'block';
    if (existingCollectionGroup) existingCollectionGroup.style.display = 'none';
    console.log('[DEBUG] Switched to NEW collection mode');
  } else {
    // Hide collection name input, show existing collections dropdown
    if (collectionNameGroup) collectionNameGroup.style.display = 'none';
    if (existingCollectionGroup) existingCollectionGroup.style.display = 'block';
    console.log('[DEBUG] Switched to EXISTING collection mode, display should be:', existingCollectionGroup?.style.display);
    // Refresh existing collections list
    loadExistingCollections();
  }
};

function loadExistingCollections() {
  const existingCollectionSelect = document.getElementById('existing-collection-select');
  if (!existingCollectionSelect) return;

  // Send message to backend to get existing collections
  parent.postMessage(
    {
      pluginMessage: {
        type: 'get-existing-collections',
      },
    },
    '*',
  );

  // The response will be handled by the message listener
}

window.simulateImport = function () {
  const importSection = document.getElementById('import-section');
  const importContent = document.getElementById('import-content');

  // Check if import section exists
  if (!importSection || !importContent) {
    alert('Please navigate to the Import tab and parse tokens first');
    return;
  }

  // Get import configuration
  const destinationRadio = document.querySelector('input[name="import-destination"]:checked');
  const organizeByCategoriesElement = document.getElementById('organize-by-categories');
  const overwriteExistingElement = document.getElementById('overwrite-existing');

  // Check if elements exist before accessing properties
  if (!destinationRadio || !organizeByCategoriesElement || !overwriteExistingElement) {
    alert('Please parse tokens first to see import options');
    return;
  }

  const mode = destinationRadio.value; // 'new' or 'existing'
  const organizeByCategories = organizeByCategoriesElement.checked;
  const overwriteExisting = overwriteExistingElement.checked;

  let collectionName = 'Design Tokens';
  let existingCollectionId = null;

  if (mode === 'new') {
    const collectionNameElement = document.getElementById('collection-name');
    collectionName = collectionNameElement
      ? collectionNameElement.value || 'Design Tokens'
      : 'Design Tokens';
  } else {
    const existingCollectionSelect = document.getElementById('existing-collection-select');
    if (existingCollectionSelect && existingCollectionSelect.value) {
      existingCollectionId = existingCollectionSelect.value;
      // Get the collection name from the selected option
      collectionName =
        existingCollectionSelect.options[existingCollectionSelect.selectedIndex].text;
    } else {
      alert('Please select an existing collection or enable "Create new collection"');
      return;
    }
  }

  // Get selected tokens (only checked ones)
  const selectedVariables = [];
  const selectedStyles = [];

  // Get checked variable tokens
  document.querySelectorAll('.variable-checkbox:checked').forEach((checkbox) => {
    const tokenName = checkbox.dataset.tokenName;
    const token = (window.parsedTokens || []).find((t) => t.name === tokenName);
    if (token) {
      selectedVariables.push(token);
    }
  });

  // Get checked style tokens
  document.querySelectorAll('.style-checkbox:checked').forEach((checkbox) => {
    const tokenName = checkbox.dataset.tokenName;
    const token = (window.parsedTokens || []).find((t) => t.name === tokenName);
    if (token) {
      selectedStyles.push(token);
    }
  });

  const selectedTokens = [...selectedVariables, ...selectedStyles];

  if (selectedTokens.length === 0) {
    alert('Please select at least one variable or style to import.');
    return;
  }

  // Now show progress UI after collecting all data
  importContent.innerHTML = `
          <div class="apply-summary">
            <h4>Importing to Figma...</h4>
            <div class="import-progress">
              <div class="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
              </div>
              <div class="progress-text" id="progress-text">Starting import...</div>
            </div>
          </div>
        `;

  importSection.style.display = 'block';

  // Send real import message to plugin backend
  const messageData = {
    pluginMessage: {
      type: 'import-tokens',
      tokens: selectedTokens,
      options: {
        collectionName,
        collectionId: existingCollectionId,
        strategy: overwriteExisting ? 'overwrite' : 'merge',
        organizeByCategories,
      },
    },
  };

  console.log('DEBUG: Sending import-tokens message', messageData);
  parent.postMessage(messageData, '*');

  // Start progress animation while waiting for response
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  let progress = 0;
  let progressInterval;

  const startProgress = () => {
    progressInterval = setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90; // Stop at 90% until we get response
      progressFill.style.width = progress + '%';
      progressText.textContent = `Importing tokens... ${Math.round(progress)}%`;
    }, 300);
  };

  // Store progress control for response handler
  window.importProgressControl = {
    fill: progressFill,
    text: progressText,
    interval: progressInterval,
    complete: function (result) {
      clearInterval(this.interval);
      this.fill.style.width = '100%';
      this.text.textContent = 'Import completed!';
      setTimeout(() => showImportComplete(result), 500);
    },
    error: function (error) {
      clearInterval(this.interval);
      this.fill.style.width = '100%';
      this.fill.style.backgroundColor = '#f87171';
      this.text.textContent = 'Import failed';
      setTimeout(() => showImportError(error), 500);
    },
  };

  startProgress();
};

function showImportComplete(result = {}) {
  const importContent = document.getElementById('variable-import-container');

  // Use the correct property names from the backend result
  const variablesCreated = result.importedCount || 0;
  const stylesCreated = result.importedStyleCount || 0;
  const collectionsCreated = result.collectionName ? 1 : 0; // 1 if collection was created/used
  const groupsCreated = result.groupsCreated || 0; // Now using actual group count from backend

  importContent.innerHTML = `
          <div class="import-result">
            <div class="result-summary success">
              <h4>✅ Import Completed Successfully!</h4>
              <div class="result-stats">
                <span class="stat">${variablesCreated} variables created</span>
                ${stylesCreated > 0 ? `<span class="stat">${stylesCreated} styles created</span>` : ''}
                <span class="stat">${collectionsCreated} collection${collectionsCreated !== 1 ? 's' : ''} ${collectionsCreated > 0 ? 'used' : 'created'}</span>
                <span class="stat">${groupsCreated} groups organized</span>
              </div>
              <p>Your design tokens have been successfully imported to Figma ${variablesCreated > 0 ? 'Variables' : ''}${variablesCreated > 0 && stylesCreated > 0 ? ' and ' : ''}${stylesCreated > 0 ? 'Styles' : ''}. You can now use them in your designs!</p>
            </div>
            <div class="apply-actions">
              <button class="btn btn-secondary" onclick="resetImportView()">Import More Tokens</button>
            </div>
          </div>
        `;
}
function resetImportView() {
  console.log('[UI] Resetting import view');
  try {
    const importContent = document.getElementById('variable-import-container');
    if (!importContent) {
      console.error('[UI] Import content container not found');
      return;
    }

    // Remove the initialized class so it can be re-initialized
    importContent.classList.remove('initialized');

    // Reset the preview state
    currentImportPreview = null;

    // Re-initialize the import tab to restore initial state
    initializeVariableImportTab();
  } catch (e) {
    console.error('[UI] Error resetting import view:', e);
    showError('UI Error', 'Failed to reset import view. Please reload the plugin.');
  }
}

function resetImportView_OLD() {
  console.log('[UI] Resetting import view (OLD)');
  try {
    const importContent = document.getElementById('variable-import-container');
    if (!importContent) {
      console.error('[UI] Import content container not found');
      return;
    }

    // Re-render the initial import view structure
    importContent.innerHTML = `
              <div class="import-section">
                <div class="import-input-area">
                  <textarea 
                    id="import-input" 
                    placeholder="Paste your code here...&#10;CSS/SCSS: :root { --primary: #3b82f6; }&#10;Tailwind Config: { theme: { colors: { primary: '#3b82f6' } } }"
                    spellcheck="false"
                  ></textarea>
                </div>

                <div class="import-actions-bar">
                  <div class="import-options">
                     <select id="import-collection-select" class="select-input">
                       <option value="">New Collection...</option>
                     </select>
                  </div>
                  <button id="preview-import-btn" class="btn-primary" disabled>
                    Preview Import
                  </button>
                </div>

                <!-- Preview Section (Hidden by default) -->
                <div id="import-preview-section" class="import-preview-section hidden">
                  <div class="preview-header">
                    <h4 style="display: flex; align-items: center; gap: 8px;">
                      <span class="material-symbols-outlined" style="font-size: 18px; color: var(--purple-light);">preview</span>
                      Import Preview
                    </h4>
                    <div class="preview-stats">
                      <span id="preview-stat-total" class="badge" style="display: flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">functions</span>
                        <span>0</span>
                      </span>
                      <span id="preview-stat-new" class="badge badge-success" style="display: flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">add_circle</span>
                        <span>0</span>
                      </span>
                      <span id="preview-stat-update" class="badge badge-warning" style="display: flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">sync</span>
                        <span>0</span>
                      </span>
                      <span id="preview-stat-conflict" class="badge badge-danger" style="display: flex; align-items: center; gap: 4px;">
                        <span class="material-symbols-outlined" style="font-size: 14px;">warning</span>
                        <span>0</span>
                      </span>
                    </div>
                  </div>

                  <div class="preview-toolbar" style="display: flex; gap: 8px; margin-bottom: 12px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); align-items: center;">
                    <button class="compact-action-btn" id="select-all-import" data-tooltip="Select All" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;">
                      <span class="material-symbols-outlined" style="font-size: 18px;">select_all</span>
                    </button>
                    <button class="compact-action-btn" id="deselect-all-import" data-tooltip="Deselect All" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; padding: 0;">
                      <span class="material-symbols-outlined" style="font-size: 18px;">deselect</span>
                    </button>
                    <div style="border-left: 1px solid rgba(255,255,255,0.1); height: 16px; margin: 0 4px;"></div>
                    <button class="compact-action-btn" id="expand-all-import" data-tooltip="Expand All Groups" style="width: 28px; height: 28px;">
                      <span class="material-symbols-outlined" style="font-size: 18px;">unfold_more</span>
                    </button>
                    <button class="compact-action-btn" id="collapse-all-import" data-tooltip="Collapse All Groups" style="width: 28px; height: 28px;">
                      <span class="material-symbols-outlined" style="font-size: 18px;">unfold_less</span>
                    </button>
                  </div>

                  <div class="import-settings" style="margin-bottom: 16px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05);">
                    <h5 style="margin: 0 0 12px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; font-weight: 600;">Settings</h5>
                    
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                      <label class="toggle-switch">
                        <input type="checkbox" class="toggle-input" id="organize-by-categories" checked>
                        <div class="toggle-slider"></div>
                        <span class="settings-label" style="margin-bottom: 0;">Organize by categories</span>
                        <span class="material-symbols-outlined" style="font-size: 14px; opacity: 0.4; cursor: help;" data-tooltip="Group variables into categories based on their names (e.g. 'color/primary' -> 'color' group)">help</span>
                      </label>

                      <label class="toggle-switch">
                        <input type="checkbox" class="toggle-input" id="overwrite-existing" onchange="document.getElementById('overwrite-warning').style.display = this.checked ? 'flex' : 'none'">
                        <div class="toggle-slider"></div>
                        <span class="settings-label" style="margin-bottom: 0;">Overwrite existing variables</span>
                        <span class="material-symbols-outlined" style="font-size: 14px; opacity: 0.4; cursor: help;" data-tooltip="If checked, existing variables with the same name will be overwritten.">help</span>
                      </label>
                    </div>
                    
                    <div id="overwrite-warning" class="info-banner warning" style="margin-top: 12px; display: none; font-size: 11px; padding: 8px 12px; border-radius: 6px; background: rgba(234, 179, 8, 0.1); color: #facc15; align-items: flex-start; gap: 8px; line-height: 1.4;">
                      <span class="material-symbols-outlined" style="font-size: 16px;">warning</span>
                      <span>Existing variables with the exact same name will be updated with new values.</span>
                    </div>
                  </div>

                  <div class="preview-table-container" style="max-height: 250px;">
                    <table class="preview-table">
                      <thead>
                        <tr>
                          <th style="width: 40%;">Variable</th>
                          <th style="width: 15%;">Type</th>
                          <th style="width: 30%;">Value</th>
                          <th style="width: 15%;">Status</th>
                        </tr>
                      </thead>
                      <tbody id="preview-table-body">
                        <!-- Populated dynamically -->
                      </tbody>
                    </table>
                  </div>

                  <div class="import-confirmation-actions" style="margin-top: 12px;">
                    <button id="cancel-import-btn" class="btn-secondary">Cancel</button>
                    <button id="confirm-import-btn" class="btn-primary" style="display: flex; align-items: center; gap: 6px;">
                      <span class="material-symbols-outlined" style="font-size: 18px;">upload</span>
                      Import Variables
                    </button>
                  </div>
                </div>
              </div>
            `;

    console.log('[UI] Initializing import tab listeners');
    initializeImportTab();

    // Re-attach listeners for the newly created elements
    const inputEl = document.getElementById('import-input');
    if (inputEl) {
      inputEl.addEventListener('input', function (e) {
        const btn = document.getElementById('preview-import-btn');
        if (btn) btn.disabled = !e.target.value.trim();
      });
    }

    document.getElementById('preview-import-btn')?.addEventListener('click', function () {
      const content = document.getElementById('import-input').value;
      const collectionId = document.getElementById('import-collection-select').value;

      if (!content) return;

      showButtonLoading(this, 'Analyzing...');

      parent.postMessage(
        {
          pluginMessage: {
            type: 'preview-import',
            content: content,
            options: {
              collectionId: collectionId,
            },
          },
        },
        '*',
      );
    });

    document.getElementById('cancel-import-btn')?.addEventListener('click', function () {
      document.getElementById('import-preview-section').classList.add('hidden');
      document.getElementById('preview-import-btn').disabled = false;
      document.getElementById('import-input').disabled = false;
    });

    // Re-attach confirm listener (copying logic from initializeImportTab or defining new)
    // Ideally we should extract this attachment to a function to avoid code duplication.
    // But since `initializeImportTab` does setup, maybe we can rely on it?
    // `initializeImportTab` only sets up collections dropdown. It DOES NOT set up listeners in current implementation?
    // Wait, previous `view_file` showed `initializeImportTab` ONLY doing collection loading.
    // The listeners were added globally below it.
    // Since we overwrote the DOM elements, the global listeners attached earlier are GONE for these elements.
    // So we MUST re-attach them here.

    document.getElementById('confirm-import-btn')?.addEventListener('click', function () {
      if (!currentImportPreview) return;

      // Use the overwrite-existing checkbox to determine strategy
      const overwriteCheckbox = document.getElementById('overwrite-existing');
      const strategy = overwriteCheckbox && overwriteCheckbox.checked ? 'overwrite' : 'skip';
      const collectionSelect = document.getElementById('import-collection-select');
      const collectionId = collectionSelect.value;
      const collectionName = collectionId
        ? collectionSelect.options[collectionSelect.selectedIndex].text
        : 'Imported Variables';

      showButtonLoading(this, 'Importing...');

      const tokensToImport = [
        ...currentImportPreview.added,
        ...currentImportPreview.modified.map((m) => m.token),
        ...currentImportPreview.unchanged,
        ...currentImportPreview.conflicts.map((c) => c.token),
      ];

      parent.postMessage(
        {
          pluginMessage: {
            type: 'import-tokens',
            tokens: tokensToImport,
            options: {
              collectionId: collectionId,
              collectionName: collectionName,
              strategy: strategy,
            },
          },
        },
        '*',
      );
    });
  } catch (e) {
    console.error('[UI] Error resetting import view:', e);
    showError('UI Error', 'Failed to reset import view. Please reload the plugin.');
  }
}
window.resetImportView = resetImportView;

function showImportError(error) {
  const importContent = document.getElementById('variable-import-container');
  importContent.innerHTML = `
          <div class="import-result">
            <div class="result-summary error">
              <h4>❌ Import Failed</h4>
              <p class="error-message">${error.message || 'An unknown error occurred during import.'}</p>
              <div class="error-details">
                <p>Please check your tokens and try again.</p>
              </div>
            </div>
            <div class="apply-actions">
              <button class="btn btn-secondary" onclick="resetImportView()">Try Again</button>
            </div>
          </div>
        `;
}

// Listen for messages from the plugin backend
window.addEventListener('message', function (event) {
  if (event.data.pluginMessage) {
    const message = event.data.pluginMessage;

    if (message.type === 'import-complete' && window.importProgressControl) {
      window.importProgressControl.complete(message.result);
      delete window.importProgressControl;
    } else if (message.type === 'import-error' && window.importProgressControl) {
      window.importProgressControl.error(message.error);
      delete window.importProgressControl;
    } else if (message.type === 'existing-collections') {
      updateExistingCollectionsDropdown(message.collections);
    }
  }
});

function updateExistingCollectionsDropdown(collections) {
  // Store globally for duplicate checking
  window.existingCollections = collections || [];
  console.log('[DEBUG] Stored existing collections:', window.existingCollections);

  // Update both dropdowns
  const dropdowns = [
    { id: 'existing-collection-select', element: document.getElementById('existing-collection-select') },
    { id: 'import-collection-select', element: document.getElementById('import-collection-select') },
  ];

  dropdowns.forEach((dropdown) => {
    if (!dropdown.element) return;

    // Clear existing options
    dropdown.element.innerHTML = '';

    if (!collections || collections.length === 0) {
      dropdown.element.innerHTML = '<option value="">New Collection...</option>';
      return;
    }

    // Add "New Collection" option first
    const newOption = document.createElement('option');
    newOption.value = '';
    newOption.textContent = 'New Collection...';
    dropdown.element.appendChild(newOption);

    // Add separator for clarity
    const separator = document.createElement('option');
    separator.disabled = true;
    separator.textContent = '───── Existing Collections ─────';
    dropdown.element.appendChild(separator);

    // Add existing collections
    collections.forEach((collection) => {
      const option = document.createElement('option');
      option.value = collection.id;
      option.textContent = collection.name;
      dropdown.element.appendChild(option);
    });
  });

  // If we have parsed tokens and the preview is visible, re-render to show duplicate badges
  const previewSection = document.getElementById('preview-section');
  if (previewSection && previewSection.style.display !== 'none' && window.parsedTokens) {
    console.log('[DEBUG] Re-rendering preview with duplicate info');
    showPreview(window.parsedTokens);
  }
}

// Make functions globally available for HTML onclick handlers
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.onProviderChange = onProviderChange;
window.openUserGuide = openUserGuide;
window.closeUserGuide = closeUserGuide;
window.toggleSubgroup = toggleSubgroup;
// toggleComponentSet and toggleStyles are already assigned to window where defined
window.scrollToGroupById = scrollToGroupById;
window.generateTest = generateTest;
window.toggleVariablesList = toggleVariablesList;
window.expandAllGroups = expandAllGroups;
window.collapseAllGroups = collapseAllGroups;
window.expandAllSubgroups = expandAllSubgroups;
window.collapseAllSubgroups = collapseAllSubgroups;
window.deleteVariable = deleteVariable;
window.deleteStyle = deleteStyle;
window.scrollToVariable = scrollToVariable;

window.expandAllImportGroups = expandAllImportGroups;

// Styles Functions
// window.toggleStyles is already defined above
window.expandAllStyles = () => {
  document.querySelectorAll('#styles-container .collection-content').forEach((el) => {
    el.classList.add('expanded');
    const icon = document.getElementById(`icon-${el.id}`);
    if (icon) icon.textContent = 'expand_more';
  });
};
window.collapseAllStyles = () => {
  document.querySelectorAll('#styles-container .collection-content').forEach((el) => {
    el.classList.remove('expanded');
    const icon = document.getElementById(`icon-${el.id}`);
    if (icon) icon.textContent = 'chevron_right';
  });
};

// Obsolete styles functions removed
window.collapseAllImportGroups = collapseAllImportGroups;
window.expandAllStyleGroups = expandAllStyleGroups;
window.collapseAllStyleGroups = collapseAllStyleGroups;
window.selectAllVariables = selectAllVariables;
window.selectAllStyles = selectAllStyles;
window.browseRepositories = browseRepositories;
window.browseBranches = browseBranches;
window.closeRepositoryBrowser = closeRepositoryBrowser;
window.closeBranchBrowser = closeBranchBrowser;
window.startOAuthFlow = startOAuthFlow;
window.openImportModal = openImportModal;
window.closeImportModal = closeImportModal;
window.openUnitsModal = openUnitsModal;
window.closeUnitsModal = closeUnitsModal;
window.saveUnitsAndCloseModal = saveUnitsAndCloseModal;
window.switchToQualityTab = switchToQualityTab;

// OAuth helper functions
window.showPopupBlockerHelp = showPopupBlockerHelp;
window.detectBrowser = detectBrowser;

// ===== VARIABLE IMPORT FEATURE =====

let currentImportPreview = null;

function initializeImportTab() {
  console.log('Initializing Import Tab');

  // Pre-load existing collections
  loadExistingCollections();

  const select = document.getElementById('import-collection-select');
  if (!select) return;

  // Clear existing options except first
  select.innerHTML = '<option value="">New Collection...</option>';

  // Populate with existing collections if available
  // Populate with existing collections if available logic moved to updateExistingCollectionsDropdown
  if (window.existingCollections && window.existingCollections.length > 0) {
    // Re-trigger update to ensure import-collection-select is populated
    updateExistingCollectionsDropdown(window.existingCollections);
  }
}

// Input Handler to enable/disable preview button
document.getElementById('import-input')?.addEventListener('input', function (e) {
  const btn = document.getElementById('preview-import-btn');
  if (btn) btn.disabled = !e.target.value.trim();
});

// Preview Button Handler
document.getElementById('preview-import-btn')?.addEventListener('click', function () {
  const content = document.getElementById('import-input').value;
  const collectionId = document.getElementById('import-collection-select').value;

  if (!content) return;

  showButtonLoading(this, 'Analyzing...');

  parent.postMessage(
    {
      pluginMessage: {
        type: 'preview-import',
        content: content,
        options: {
          collectionId: collectionId,
        },
      },
    },
    '*',
  );
});

// Cancel Import Handler
document.getElementById('cancel-import-btn')?.addEventListener('click', function () {
  document.getElementById('import-preview-section').classList.add('hidden');
  document.getElementById('preview-import-btn').disabled = false;
  document.getElementById('import-input').disabled = false;
});

// Confirm Import Handler
document.getElementById('confirm-import-btn')?.addEventListener('click', function () {
  if (!currentImportPreview) return;

  const overwriteCheckbox = document.getElementById('overwrite-existing');
  const organizeCheckbox = document.getElementById('organize-by-categories');

  const strategy = overwriteCheckbox && overwriteCheckbox.checked ? 'overwrite' : 'merge';
  const organizeByCategories = (organizeCheckbox && organizeCheckbox.checked) || false;
  const collectionSelect = document.getElementById('import-collection-select');
  const collectionId = collectionSelect.value;
  const collectionName = collectionId
    ? collectionSelect.options[collectionSelect.selectedIndex].text
    : 'Imported Variables'; // Fallback name for new collection

  showButtonLoading(this, 'Importing...');

  // Filter tokens based on strategy manually if needed,
  // but backend logic handles "merge" vs "overwrite" mostly.
  // We just pass the tokens and let backend handle it, or we filter here?
  // The service has a 'strategy' option, so we pass all tokens and the strategy.

  // We need to pass the original tokens back.
  // currentImportPreview.added + currentImportPreview.modified + unchanged?
  // Actually we should import ALL detected tokens that are not ignored.
  // For simplicity, we reconstruct the full list from the preview data or
  // we should have stored the raw tokens.

  // Let's assume we want to import everything that was previewed.
  const tokensToImport = [
    ...currentImportPreview.added,
    ...currentImportPreview.modified.map((m) => m.token),
    ...currentImportPreview.unchanged,
    ...currentImportPreview.conflicts.map((c) => c.token),
  ];

  parent.postMessage(
    {
      pluginMessage: {
        type: 'import-tokens',
        tokens: tokensToImport,
        options: {
          collectionId: collectionId,
          collectionName: collectionName,
          strategy: strategy,
          organizeByCategories: organizeByCategories,
        },
      },
    },
    '*',
  );
});

// Handle Preview Message
function handleImportPreview(msg) {
  hideButtonLoading(document.getElementById('preview-import-btn'));

  if (!msg.diff) {
    showError('Import Error', 'Failed to generate preview');
    return;
  }

  currentImportPreview = msg.diff;
  const { added, modified, unchanged, conflicts } = msg.diff;
  const totalCount = added.length + modified.length + unchanged.length + conflicts.length;

  // Update Stats with new format (icon + number only)
  document.getElementById('preview-stat-total').querySelector('span:last-child').textContent =
    totalCount;
  document.getElementById('preview-stat-new').querySelector('span:last-child').textContent =
    added.length;
  document.getElementById('preview-stat-update').querySelector('span:last-child').textContent =
    modified.length;
  document.getElementById('preview-stat-conflict').querySelector('span:last-child').textContent =
    conflicts.length;

  // Render Table
  const tbody = document.getElementById('preview-table-body');
  tbody.innerHTML = '';

  // Helper to get type icon
  const getTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('color'))
      return '<span class="material-symbols-outlined" style="font-size: 14px; color: #a78bfa;">palette</span>';
    if (t.includes('number') || t.includes('numeric') || t.includes('float'))
      return '<span class="material-symbols-outlined" style="font-size: 14px; color: #60a5fa;">123</span>';
    if (t.includes('string'))
      return '<span class="material-symbols-outlined" style="font-size: 14px; color: #4ade80;">text_fields</span>';
    if (t.includes('boolean'))
      return '<span class="material-symbols-outlined" style="font-size: 14px; color: #fbbf24;">toggle_on</span>';
    return '<span class="material-symbols-outlined" style="font-size: 14px; color: rgba(255,255,255,0.5);">data_object</span>';
  };

  // Helper to get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      new: '<span style="display: inline-flex; align-items: center; gap: 2px; background: rgba(34,197,94,0.2); color: #4ade80; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 12px;">add</span>NEW</span>',
      update:
        '<span style="display: inline-flex; align-items: center; gap: 2px; background: rgba(234,179,8,0.2); color: #facc15; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 12px;">sync</span>UPD</span>',
      conflict:
        '<span style="display: inline-flex; align-items: center; gap: 2px; background: rgba(239,68,68,0.2); color: #f87171; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 12px;">warning</span>!</span>',
      ignore:
        '<span style="display: inline-flex; align-items: center; gap: 2px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.5); padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 600;"><span class="material-symbols-outlined" style="font-size: 12px;">remove</span>SKIP</span>',
    };
    return statusMap[status] || status.toUpperCase();
  };

  const appendRow = (token, status, oldValue = null) => {
    const tr = document.createElement('tr');
    const valueDisplay =
      status === 'update' || status === 'conflict'
        ? `<span style="color: rgba(255,255,255,0.4); font-size: 10px; text-decoration: line-through;">${SecurityUtils.escapeHTML(String(oldValue).substring(0, 20))}</span>
             <span style="color: var(--purple-light);"> → ${SecurityUtils.escapeHTML(String(token.value).substring(0, 25))}</span>`
        : `<span style="font-family: monospace; font-size: 11px;">${SecurityUtils.escapeHTML(String(token.value).substring(0, 30))}</span>`;

    tr.innerHTML = `
            <td style="font-size: 11px; font-family: monospace;">${SecurityUtils.escapeHTML(token.name)}</td>
            <td style="text-align: center;">${getTypeIcon(token.type)}</td>
            <td style="font-size: 11px;">${valueDisplay}</td>
            <td style="text-align: center;">${getStatusBadge(status)}</td>
          `;
    tbody.appendChild(tr);
  };

  added.forEach((t) => appendRow(t, 'new'));
  modified.forEach((m) => appendRow(m.token, 'update', m.oldValue));
  conflicts.forEach((c) => appendRow(c.token, 'conflict', c.existingValue));
  unchanged.forEach((t) => appendRow(t, 'ignore')); // Or 'unchanged'

  // Show preview section
  const previewSection = document.getElementById('import-preview-section');
  previewSection.classList.remove('hidden');
  
  // Auto-scroll to preview section
  setTimeout(() => {
    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

function handleImportComplete(msg) {
  const btn = document.getElementById('confirm-import-btn');
  hideButtonLoading(btn);

  if (msg.result.success) {
    showSuccess('Import Successful', `Imported ${msg.result.success} variables.`);
    document.getElementById('import-preview-section').classList.add('hidden');
    document.getElementById('import-input').value = '';

    // Trigger data refresh
    refreshData();
  } else {
    showError('Import Failed', msg.error || 'Unknown error');
  }
}

// Listen for messages from the plugin backend
window.addEventListener('message', function (event) {
  if (event.data.pluginMessage) {
    const message = event.data.pluginMessage;

    if (message.type === 'preview-import-result') {
      handleImportPreview(message);
    } else if (message.type === 'preview-import-error') {
      hideButtonLoading(document.getElementById('preview-import-btn'));
      showError('Preview Failed', message.message);
    } else if (message.type === 'import-complete' && window.importProgressControl) {
      window.importProgressControl.complete(message.result);
      delete window.importProgressControl;
    } else if (message.type === 'import-error' && window.importProgressControl) {
      window.importProgressControl.error(message.error);
      delete window.importProgressControl;
    }
  }
});

// Initialize tab logic globally to catch tab switches
document.addEventListener('click', function (e) {
  // Build path to handle clicks on children of the tab item
  const tabItem = e.target.closest('.sub-tab-item');
  if (tabItem && tabItem.dataset.subTab === 'import') {
    console.log('Import tab clicked');
    setTimeout(initializeImportTab, 50); // Small delay to ensure view is updated
  }
});

function expandAllVariables() {
  console.log('Expanding all variable collections');
  const collections = document.querySelectorAll('.variable-collection');
  collections.forEach((coll) => {
    const content = coll.querySelector('.collection-content');
    const header = coll.querySelector('.collection-header');
    if (content) content.classList.remove('collapsed');
    if (header) header.classList.remove('collapsed');

    const collectionId = coll.getAttribute('data-collection-id');
    if (collectionId) {
      if (typeof expandAllSubgroups === 'function') {
        expandAllSubgroups(collectionId);
      } else if (window.expandAllSubgroups) {
        window.expandAllSubgroups(collectionId);
      }
    }
  });
}
window.expandAllVariables = expandAllVariables;

function collapseAllVariables() {
  console.log('Collapsing all variable collections');
  const collections = document.querySelectorAll('.variable-collection');
  collections.forEach((coll) => {
    const content = coll.querySelector('.collection-content');
    const header = coll.querySelector('.collection-header');
    if (content) content.classList.add('collapsed');
    if (header) header.classList.add('collapsed');

    const collectionId = coll.getAttribute('data-collection-id');
    if (collectionId) {
      if (typeof collapseAllSubgroups === 'function') {
        collapseAllSubgroups(collectionId);
      } else if (window.collapseAllSubgroups) {
        window.collapseAllSubgroups(collectionId);
      }
    }
  });
}
window.collapseAllVariables = collapseAllVariables;

function toggleSearchBar(wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) {
    const isExpanded = wrapper.classList.toggle('expanded');
    if (isExpanded) {
      const input = wrapper.querySelector('input');
      if (input) input.focus();
    }
  }
}
window.toggleSearchBar = toggleSearchBar;

window.expandAllComponents = function () {
  console.log('Expanding all component sets');
  const sets = document.querySelectorAll('.component-set');
  sets.forEach((set) => {
    const children = set.querySelector('.component-set-children');
    const header = set.querySelector('.component-set-header');
    if (children) children.classList.add('expanded');
    if (header) header.classList.add('expanded');
  });
};

window.collapseAllComponents = function () {
  console.log('Collapsing all component sets');
  const sets = document.querySelectorAll('.component-set');
  sets.forEach((set) => {
    const children = set.querySelector('.component-set-children');
    const header = set.querySelector('.component-set-header');
    if (children) children.classList.remove('expanded');
    if (header) header.classList.remove('expanded');
  });
};

window.showFeedbackInSettings = function () {
  // Open settings modal and scroll to feedback section
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.style.display = 'flex';
    // Wait a tick for display, then scroll to feedback
    setTimeout(() => {
      const feedbackSection = document.getElementById('settings-feedback-section');
      if (feedbackSection) {
        feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }
};

window.toggleFeedback = function () {
  console.log('Toggling feedback section');
  const feedbackSection = document.getElementById('feedback-section');
  if (feedbackSection) {
    const isHidden = feedbackSection.style.display === 'none' || !feedbackSection.style.display;
    feedbackSection.style.display = isHidden ? 'block' : 'none';
    // Also persist the state
    if (!isHidden) {
      parent.postMessage(
        { pluginMessage: { type: 'set-client-storage', key: 'feedbackDismissed', value: true } },
        '*',
      );
    }
  } else {
    console.error('Feedback section not found HTML element');
  }
};

// Explicitly bind to be sure
// Use event delegation or wait for DOM? DOMContentLoaded is usually safe in UI logic start
setTimeout(() => {
  const betaBadge = document.querySelector('.beta-badge');
  if (betaBadge) {
    betaBadge.onclick = window.toggleFeedback;
    console.log('Beta badge listener attached');
  }
}, 500);

// Function to update Variables summary
function updateVariablesSummary(variablesCount, collectionsCount) {
  const summaryDiv = document.getElementById('variables-summary');
  if (summaryDiv) {
    summaryDiv.innerHTML = `
            <div class="summary-badge" data-tooltip="Total Variables">
               <span class="material-symbols-outlined">data_object</span>
               <span>${variablesCount} Variables</span>
            </div>
            <div class="summary-badge" data-tooltip="Collections">
               <span class="material-symbols-outlined">folder_open</span>
               <span>${collectionsCount} Collections</span>
            </div>
          `;
    summaryDiv.style.display = 'flex';
  }
}
window.updateVariablesSummary = updateVariablesSummary;

// Function to update Components summary
function updateComponentsSummary(componentsCount, setsCount) {
  const summaryDiv = document.getElementById('components-summary');
  if (summaryDiv) {
    summaryDiv.innerHTML = `
            <div class="summary-badge" data-tooltip="Total Components">
               <span class="material-symbols-outlined">widgets</span>
               <span>${componentsCount} Components</span>
            </div>
            <div class="summary-badge" data-tooltip="Component Sets">
               <span class="material-symbols-outlined">layers</span>
               <span>${setsCount} Sets</span>
            </div>
          `;
    summaryDiv.style.display = 'flex';
  }
}
window.updateComponentsSummary = updateComponentsSummary;

// Static User Guide - No logic required

// Quality Tab Search Logic

// Quality Tab Search Logic

function setupQualitySearch() {
  console.log('✅ Setting up Quality Search (Event Delegation)');
  // We don't need to grab the element here anymore
  // Delegation is handled by the global listeners below
}

// Add global delegation listeners for Quality Search
document.addEventListener('input', function (e) {
  if (e.target && e.target.id === 'quality-search') {
    console.log('🔍 Quality search input:', e.target.value);
    filterQualityResults(e.target.value);
  }
});

// Handle clear button via delegation as well
document.addEventListener('click', function (e) {
  const clearBtn = e.target.closest('#clear-quality-search');
  if (clearBtn) {
    console.log('🧹 Quality search cleared');
    const searchInput = document.getElementById('quality-search');
    if (searchInput) {
      searchInput.value = '';
      filterQualityResults('');
    }
    // Also call generic clearSearch if available
    if (typeof clearSearch === 'function') clearSearch('quality-search');
  }
});

function filterQualityResults(query) {
  const container = document.getElementById('token-coverage-results');
  if (!container) {
    console.warn('⚠️ Token coverage results container not found');
    return;
  }

  const normalizedQuery = query ? query.toLowerCase().trim() : '';
  console.log(`Filtering quality results for: "${normalizedQuery}"`);

  let totalIssueCards = 0;
  let visibleIssueCards = 0;
  
  // 1. Filter Breakdown Rows
  const breakdownRows = container.querySelectorAll('.quality-breakdown-row');
  let visibleBreakdownRows = 0;
  
  breakdownRows.forEach(row => {
    // If empty query, show all
    if (!normalizedQuery) {
        row.style.setProperty('display', 'flex', 'important');
        visibleBreakdownRows++;
        return;
    }
    
    // Search text in the row
    const textContent = row.textContent.toLowerCase();
    const isMatch = textContent.includes(normalizedQuery);
    
    if (isMatch) {
       row.style.setProperty('display', 'flex', 'important');
       visibleBreakdownRows++;
    } else {
       row.style.setProperty('display', 'none', 'important');
    }
  });

  // Auto-expand breakdown if has matching rows
  const breakdownContent = document.getElementById('quality-breakdown-content');
  if (breakdownContent) {
     if (normalizedQuery && visibleBreakdownRows > 0) {
        breakdownContent.style.display = 'block';
         // Ensure toggle icon is rotated if needed (optional)
        const toggleIcon = document.getElementById('breakdown-toggle-icon');
        if (toggleIcon) toggleIcon.style.transform = 'rotate(180deg)';
     }
  }

  // 2. Filter Issue Cards (Collections)
  const collections = container.querySelectorAll('.variable-collection');

  collections.forEach((group) => {
    const issues = group.querySelectorAll('.quality-issue-card');
    let groupHasVisibleIssues = false;

    // Helper references
    const content = group.querySelector('.collection-content');
    const header = group.querySelector('.collection-header');

    // Check if Group Name matches (e.g. "Layout", "Stroke", "Tailwind Readiness")
    let groupNameMatch = false;
    if (header && normalizedQuery) {
        const titleEl = header.querySelector('.collection-name-title');
        // Search in title, but maybe exclude the stats number if possible? 
        // titleEl.textContent includes the number. That's probably fine.
        if (titleEl && titleEl.textContent.toLowerCase().includes(normalizedQuery)) {
            groupNameMatch = true;
        }
    }

    issues.forEach((issue) => {
      totalIssueCards++;
      
      // If query is empty OR Group Matches, show everything in this group
      if (!normalizedQuery || groupNameMatch) {
        issue.style.setProperty('display', 'block', 'important');
        groupHasVisibleIssues = true;
        visibleIssueCards++;
        return;
      }

      // Find the text content we want to search against
      // Refined Logic: Exclude "Near Match" suggestions from index
      let textContent = '';
      const issueHeader = issue.querySelector('.quality-issue-header');
      
      if (issueHeader) {
        // Standard Quality Issue: Construct index selectively
        // 1. Header (Title, Value, Badges)
        textContent += issueHeader.textContent.toLowerCase();
        
        // 2. Node List (Node names)
        const nodeList = issue.querySelector('.quality-nodes-list');
        if (nodeList) {
             textContent += ' ' + nodeList.textContent.toLowerCase();
        }
        
        // EXPLICITLY OMIT: .issue-fix-section (Dropowns/Suggestions)
      } else {
         // Fallback: search entire card content (Tailwind Readiness, etc.)
         textContent = issue.textContent.toLowerCase();
      }

      // Check text content
      const isMatch = textContent.includes(normalizedQuery);

      if (isMatch) {
        issue.style.setProperty('display', 'block', 'important');
        groupHasVisibleIssues = true;
        visibleIssueCards++;
      } else {
        issue.style.setProperty('display', 'none', 'important');
      }
    });

    // Toggle group visibility based on whether it has any visible matching issues
    if (groupHasVisibleIssues) {
      group.style.display = 'block';
      // Expand group if searching
      if (normalizedQuery && content) content.classList.remove('collapsed');
      if (normalizedQuery && header) header.classList.remove('collapsed');
    } else {
      group.style.display = 'none';
      // Collapse group if hiding (optional, but keeps it clean when reappearing)
    }
  });

  console.log(
    `Search complete. Visible cards: ${visibleIssueCards} / ${totalIssueCards}, Visible breakdown: ${visibleBreakdownRows}`
  );

  // Show "no results" message if query exists but nothing found
  let noResultsMsg = container.querySelector('.no-results-message');
  
  // Check if ANYTHING is visible (cards OR breakdown rows)
  const anyResultsVisible = visibleIssueCards > 0 || visibleBreakdownRows > 0;

  if (normalizedQuery && !anyResultsVisible) {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('div');
      noResultsMsg.className = 'no-results-message';
      noResultsMsg.style.textAlign = 'center';
      noResultsMsg.style.padding = '40px';
      noResultsMsg.style.color = 'rgba(255, 255, 255, 0.5)';
      noResultsMsg.innerText = 'No matching issues found.';
      container.appendChild(noResultsMsg);
    }
    noResultsMsg.style.display = 'block';
  } else if (noResultsMsg) {
    noResultsMsg.style.display = 'none';
  }
}



// Toggle quality node group dropdown
function toggleQualityNodeGroup(groupId) {
  console.log('toggleQualityNodeGroup called with:', groupId);
  const container = document.getElementById(groupId);
  const toggle = document.getElementById(groupId + '-toggle');

  console.log('Container found:', !!container, 'Toggle found:', !!toggle);

  if (container) {
    const isExpanded = container.style.display !== 'none';
    container.style.display = isExpanded ? 'none' : 'block';

    if (toggle) {
      toggle.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
    }
  }
}

// Focus on a node in Figma
function focusOnNode(nodeId) {
  console.log('focusOnNode called with:', nodeId);
  if (!nodeId) {
    console.warn('focusOnNode: No nodeId provided');
    return;
  }

  // Send message to plugin to select and zoom to the node
  console.log('Sending focus-node message to plugin');
  parent.postMessage(
    {
      pluginMessage: {
        type: 'focus-node',
        nodeId: nodeId,
      },
    },
    '*',
  );
}

// Ensure functions are global
window.setupQualitySearch = setupQualitySearch;
window.filterQualityResults = filterQualityResults;
window.toggleQualityNodeGroup = toggleQualityNodeGroup;
window.focusOnNode = focusOnNode;
window.expandAllQuality = expandAllQuality;
window.collapseAllQuality = collapseAllQuality;

// ===== IMPORT PREVIEW HELPERS =====

function toggleSubgroup(groupId) {
  console.log('toggleSubgroup called for:', groupId);
  const group = document.getElementById(groupId);
  if (!group) {
    console.warn('Group not found:', groupId);
    return;
  }

  const header = group.querySelector('.subgroup-header');
  const content = document.getElementById(groupId + '-content');
  const icon = header ? header.querySelector('.subgroup-toggle-icon') : null;

  console.log('Found elements:', { header: !!header, content: !!content, icon: !!icon });

  if (header && content) {
    header.classList.toggle('collapsed');
    content.classList.toggle('collapsed');

    if (icon) {
      icon.innerHTML = header.classList.contains('collapsed') ? 'expand_more' : 'expand_less';
    }
  }
}

function expandAllImportGroups() {
  const groups = document.querySelectorAll('.variables-preview .variable-subgroup');
  groups.forEach((group) => {
    const header = group.querySelector('.subgroup-header');
    const content = group.querySelector('.subgroup-content');
    const icon = group.querySelector('.subgroup-toggle-icon');

    if (header) header.classList.remove('collapsed');
    if (content) content.classList.remove('collapsed');
    if (icon) icon.innerHTML = 'expand_less';
  });
}

function collapseAllImportGroups() {
  const groups = document.querySelectorAll('.variables-preview .variable-subgroup');
  groups.forEach((group) => {
    const header = group.querySelector('.subgroup-header');
    const content = group.querySelector('.subgroup-content');
    const icon = group.querySelector('.subgroup-toggle-icon');

    if (header) header.classList.add('collapsed');
    if (content) content.classList.add('collapsed');
    if (icon) icon.innerHTML = 'expand_more';
  });
}

function selectAllVariables(select) {
  const checkboxes = document.querySelectorAll('.variables-preview .variable-checkbox');
  checkboxes.forEach((cb) => (cb.checked = select));
}

function expandAllStyleGroups() {
  const groups = document.querySelectorAll('.styles-preview .variable-subgroup');
  groups.forEach((group) => {
    const header = group.querySelector('.subgroup-header');
    const content = group.querySelector('.subgroup-content');
    const icon = group.querySelector('.subgroup-toggle-icon');

    if (header) header.classList.remove('collapsed');
    if (content) content.classList.remove('collapsed');
    if (icon) icon.innerHTML = 'expand_less';
  });
}

function collapseAllStyleGroups() {
  const groups = document.querySelectorAll('.styles-preview .variable-subgroup');
  groups.forEach((group) => {
    const header = group.querySelector('.subgroup-header');
    const content = group.querySelector('.subgroup-content');
    const icon = group.querySelector('.subgroup-toggle-icon');

    if (header) header.classList.add('collapsed');
    if (content) content.classList.add('collapsed');
    if (icon) icon.innerHTML = 'expand_more';
  });
}

function selectAllStyles(select) {
  const checkboxes = document.querySelectorAll('.styles-preview .style-checkbox');
  checkboxes.forEach((cb) => (cb.checked = select));
}

// Expose to window
window.toggleSubgroup = toggleSubgroup;
window.expandAllImportGroups = expandAllImportGroups;
window.collapseAllImportGroups = collapseAllImportGroups;
window.selectAllVariables = selectAllVariables;
window.expandAllStyleGroups = expandAllStyleGroups;
window.collapseAllStyleGroups = collapseAllStyleGroups;
window.selectAllStyles = selectAllStyles;

// ===== TOKEN FIX FUNCTIONS =====

/**
 * Toggle all occurrences for an issue
 */
function toggleAllOccurrences(issueId) {
  const selectAllCheckbox = document.getElementById(`${issueId}-select-all`);
  const occurrenceCheckboxes = document.querySelectorAll(
    `.occurrence-checkbox[data-issue-id="${issueId}"]`,
  );

  occurrenceCheckboxes.forEach((cb) => {
    cb.checked = selectAllCheckbox.checked;
  });

  updateApplyButtonState(issueId);
}

/**
 * Update the apply button state based on selection
 */
function updateApplyButtonState(issueId) {
  const applyBtn = document.getElementById(`${issueId}-apply-btn`);

  if (!applyBtn) return;
  const varSelect = document.getElementById(`${issueId}-var-select`);
  const occurrenceCheckboxes = document.querySelectorAll(
    `.occurrence-checkbox[data-issue-id="${issueId}"]`,
  );

  // Check if any occurrence is selected
  const hasSelection = Array.from(occurrenceCheckboxes).some((cb) => cb.checked);

  // Check if a variable is selected (including create-new)
  const isCreateNew = varSelect && varSelect.value === 'create-new';
  const hasVariable = varSelect && varSelect.value !== '';

  // Enable button only if both conditions are met
  if (hasSelection && hasVariable) {
    applyBtn.disabled = false;
    applyBtn.style.opacity = '1';
    applyBtn.style.pointerEvents = 'auto';

    if (isCreateNew) {
      // Transform to "Create" button
      applyBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">add</span> Create';
      applyBtn.onclick = (e) => {
        e.stopPropagation();
        handleCreateNewVariable(issueId);
      };
      applyBtn.title = 'Create a new variable for this value';
      // Optional: Different style for create button
      applyBtn.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
    } else {
      // Reset to "Apply" button
      applyBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Apply';
      // Remove direct onclick to revert to inline HTML attribute or re-attach default
      // Since we overwrote it, we should explicitly set it back to the apply function
      // We need to retrieve property and category from the issue card context or pass them in?
      // Wait, issueId works for lookup. But applyTokenToSelection needs property/category.
      // We can't easily get them here directly without DOM traversal or scope.
      // BETTER: Use data attributes on the button to store property/category!

      // Let's assume the button has data attributes or we can use the original logic.
      // Check renderIssueCard:
      // onclick="applyTokenToSelection('${issueId}', '${issue.property}', '${category}')"
      // This is set in the HTML string. If we overwrite onclick, it's gone.
      // So for "Create", we overwrite. For "Apply", we need to restore it.
      // But `updateApplyButtonState` doesn't know property/category.

      // Alternative: Don't change onclick for Apply, only for Create.
      // But we need to *revert* it if user switches back from Create to a variable.
      // We can store the original onclick in a data attribute?

      if (applyBtn.dataset.originalOnclick) {
        applyBtn.setAttribute('onclick', applyBtn.dataset.originalOnclick);
      } else {
        // Fallback: This might break if we don't store it.
        // Let's modify renderIssueCard to store these in data attributes first.
        // Or better: Checking this function, we can just use the global function call string if we can reconstruct it?
        // No.
        // Quick Fix: modifying this function assuming we can access the data-original-onclick.
        // We need to set data-original-onclick when rendering!
      }

      applyBtn.title = 'Apply selected variable';
      applyBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
    }
  } else {
    // Disabled state
    applyBtn.disabled = true;
    applyBtn.style.opacity = '0.5';
    applyBtn.style.pointerEvents = 'none';
    applyBtn.innerHTML =
      '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Apply';
    applyBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)';
  }

  // Update select-all checkbox state
  const selectAllCheckbox = document.getElementById(`${issueId}-select-all`);
  if (selectAllCheckbox) {
    const allChecked = Array.from(occurrenceCheckboxes).every((cb) => cb.checked);
    const someChecked = Array.from(occurrenceCheckboxes).some((cb) => cb.checked);
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;
  }
}

/**
 * Apply token to selected occurrences
 */
function applyTokenToSelection(issueId, property, category) {
  const varSelect = document.getElementById(`${issueId}-var-select`);
  const variableId = varSelect.value;

  if (!variableId) {
    console.warn('No variable selected');
    return;
  }

  // Get all selected node IDs
  const occurrenceCheckboxes = document.querySelectorAll(
    `.occurrence-checkbox[data-issue-id="${issueId}"]:checked`,
  );
  const nodeIds = [];

  occurrenceCheckboxes.forEach((cb) => {
    try {
      const ids = JSON.parse(cb.dataset.nodeIds || '[]');
      if (Array.isArray(ids)) {
        nodeIds.push(...ids);
      }
    } catch (error) {
      console.error('Failed to parse node IDs:', error);
    }
  });

  if (nodeIds.length === 0) {
    console.warn('No nodes selected');
    return;
  }

  console.log('Applying token:', { variableId, property, category, nodeIds });

  // Save scroll position before processing
  window.tokenFixScrollPosition = window.scrollY || document.documentElement.scrollTop;

  // Set flag to prevent re-rendering during the fix process
  window.tokenFixInProgress = true;
  window.tokenFixIssueId = issueId;

  // Ensure the collapsible is open - find the parent collection
  const issueCard = document.getElementById(`${issueId}-card`);
  if (issueCard) {
    const collection = issueCard.closest('.quality-collection');
    if (collection) {
      const content = collection.querySelector('.collection-content');
      const header = collection.querySelector('.collection-header');

      // Ensure it's expanded
      if (content && content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
      }
      if (header && header.classList.contains('collapsed')) {
        header.classList.remove('collapsed');
      }

      // Save the collection ID for later restoration
      window.tokenFixActiveCollectionId = collection.id;
    }
  }

  // Disable button during operation
  const applyBtn = document.getElementById(`${issueId}-apply-btn`);

  // Track this button for success feedback handler
  window.lastApplyButtonId = `${issueId}-apply-btn`;

  applyBtn.disabled = true;
  applyBtn.classList.add('btn-loading');
  applyBtn.innerHTML = ''; // Clear content for spinner

  // Send message to plugin
  parent.postMessage(
    {
      pluginMessage: {
        type: 'apply-token-to-nodes',
        nodeIds,
        variableId,
        property,
        category,
        suppressNotification: true, // Signal backend to suppress standard notification if possible, or handle on frontend
      },
    },
    '*',
  );

  // Auto-reset fallback (safety net)
  setTimeout(() => {
    if (applyBtn && applyBtn.classList.contains('btn-loading')) {
      applyBtn.classList.remove('btn-loading');
      applyBtn.innerHTML =
        '<span class="material-symbols-outlined" style="font-size: 14px; vertical-align: middle;">check</span> Apply';
      updateApplyButtonState(issueId);
    }
  }, 5000);
}

// Expose to window
window.toggleAllOccurrences = toggleAllOccurrences;
window.updateApplyButtonState = updateApplyButtonState;
window.applyTokenToSelection = applyTokenToSelection;
