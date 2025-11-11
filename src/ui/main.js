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
              if (match.includes('toggleSubgroup(') || match.includes('toggleComponentSet(') || match.includes('toggleStyles(') || match.includes('scrollToGroupById(') || match.includes('generateTest(') || match.includes('console.log(') || match.includes('alert(')) {
                return match;
              }
              return '';
            })
            .replace(/on\w+\s*=\s*[^>\s]+/gi, (match) => {
              // Allow onclick for specific safe functions
              if (match.includes('toggleSubgroup(') || match.includes('toggleComponentSet(') || match.includes('toggleStyles(') || match.includes('scrollToGroupById(') || match.includes('generateTest(') || match.includes('console.log(') || match.includes('alert(')) {
                return match;
              }
              return '';
            })
            .replace(/javascript:/gi, '')
            .replace(/vbscript:/gi, '')
            .replace(/data:/gi, '');

          // Allow only safe HTML tags
          const allowedTags = [
            'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li',
            'code', 'pre', 'blockquote', 'button', 'svg', 'path', 'circle',
            'select', 'option', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'a'
          ];

          // Remove any tags not in allowlist, but preserve safe attributes for allowed tags
          sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)(\s[^>]*)?>/g, (match, tagName, attrs) => {
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
          });

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
            '/': '&#x2F;'
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
              /gitlab/i // Allow custom GitLab instances with "gitlab" in domain
            ];

            return gitlabPatterns.some(pattern => pattern.test(parsedUrl.hostname));
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
              atob(encryptedData).split('').map(char => char.charCodeAt(0))
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
          const fileId = (typeof figma !== 'undefined' && figma.root) ? figma.root.id : 'default';
          const sessionId = Math.random().toString(36).substring(2, 15); // Random session identifier
          const timestamp = Math.floor(Date.now() / (1000 * 60 * 60 * 24)); // Daily rotation
          
          return btoa(`${fileId}:${sessionId}:${timestamp}`).slice(0, 32);
        }
      }

      // ===== GITLAB URL HELPERS =====
      function buildGitLabApiUrl(gitlabUrl) {
        if (!gitlabUrl) return "https://gitlab.com/api/v4";
        
        // Remove trailing slash if present
        const cleanUrl = gitlabUrl.replace(/\/+$/, '');
        
        // Add /api/v4 if not already present
        if (cleanUrl.endsWith('/api/v4')) {
          return cleanUrl;
        }
        
        return `${cleanUrl}/api/v4`;
      }

      function buildGitLabWebUrl(gitlabUrl) {
        if (!gitlabUrl) return "https://gitlab.com";
        
        // Remove trailing slash and /api/v4 if present
        const cleanUrl = gitlabUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');
        
        return cleanUrl;
      }

      // ===== GITLAB CONFIGURATION HELPERS =====
      function isGitLabConfigured() {
        return window.gitlabSettings && 
               window.gitlabSettings.projectId && 
               window.gitlabSettings.projectId.trim() && 
               window.gitlabSettings.gitlabToken && 
               window.gitlabSettings.gitlabToken.trim();
      }

      function updateCommitButtonStates() {
        const hasVariables = variablesData && 
          variablesData.some((collection) => collection.variables.length > 0);
        
        const isConfigured = isGitLabConfigured();
        
        // Variables tab commit button
        const commitButton = document.getElementById("commit-repo-button");
        if (commitButton) {
          const shouldEnable = hasVariables && isConfigured;
          commitButton.disabled = !shouldEnable;
          
          if (!isConfigured) {
            commitButton.title = "Configure GitLab settings in the Settings tab to enable commits";
          } else if (!hasVariables) {
            commitButton.title = "No variables available to commit";
          } else {
            commitButton.title = "Commit variables to GitLab repository";
          }
        }
        
        // Components tab commit buttons
        const componentCommitButtons = document.querySelectorAll('.commit-all-variants-button');
        componentCommitButtons.forEach(button => {
          button.disabled = !isConfigured;
          
          if (!isConfigured) {
            button.title = "Configure GitLab settings in the Settings tab to enable commits";
          } else {
            button.title = "Generate and commit component test to repository";
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
        'Finalizing interface...'
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
          button.dataset.originalText = button.textContent;
          button.textContent = loadingText;
          button.classList.add('loading');
          button.disabled = true;
        }
      }

      function hideButtonLoading(button) {
        if (button && button.classList.contains('loading')) {
          button.textContent = button.dataset.originalText || button.textContent;
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
      document.addEventListener('DOMContentLoaded', function() {
        console.log('🚀 DOM Content Loaded - Plugin UI starting!');
        console.log('Available elements:', {
          componentsContainer: !!document.getElementById('components-container'),
          variablesContainer: !!document.getElementById('variables-container')
        });
        updatePluginLoadingProgress(loadingSteps[0], 10);
      });

      // ===== COMPONENT NAVIGATION =====
      window.selectComponent = function(componentId) {
        console.log('Selecting component:', componentId);
        
        parent.postMessage({
          pluginMessage: {
            type: "select-component",
            componentId: componentId
          }
        }, "*");
      }

      // ===== NOTIFICATION SYSTEM =====
      function showNotification(type, title, message, duration) {
        duration = duration || 5000;
        const container = document.getElementById('notification-container');
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? '✓' : '✕';
        
        // Check if message contains safe HTML (only allow <a> tags)
        const isHTMLMessage = message.includes('<a ') && message.includes('</a>');
        const safeMessage = isHTMLMessage ? SecurityUtils.sanitizeHTML(message) : SecurityUtils.escapeHTML(message);
        
        notification.innerHTML = SecurityUtils.sanitizeHTML(`
          <div class="notification-icon">${SecurityUtils.escapeHTML(icon)}</div>
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
      
      function showSuccess(title, message, duration) {
        duration = duration || 0; // 0 = no auto-dismiss
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
        const safeMessage = isHTMLMessage ? SecurityUtils.sanitizeHTML(message) : SecurityUtils.escapeHTML(message);
        
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
        if (!repoButton || !window.gitlabSettings || !window.gitlabSettings.projectId) {
          if (repoButton) {
            repoButton.style.display = 'none';
          }
          return;
        }
        
        // Show button with fallback URL immediately, don't wait for network validation
        repoButton.style.display = 'inline-flex';
        setFallbackRepositoryLink(window.gitlabSettings.projectId, repoButton);
        
        // Optionally fetch project information in background (only if user has token)
        if (window.gitlabSettings.gitlabToken && window.gitlabSettings.gitlabToken.trim()) {
          fetchProjectInfo(window.gitlabSettings.projectId, window.gitlabSettings.gitlabToken, true);
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

          const apiUrl = buildGitLabApiUrl(window.gitlabSettings?.gitlabUrl);
          if (!apiUrl) {
            throw new Error('Unable to build GitLab API URL from settings');
          }

          // Add timeout to prevent hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await fetch(`${apiUrl}/projects/${encodeURIComponent(projectId)}`, {
            headers: {
              'PRIVATE-TOKEN': token,
              'Content-Type': 'application/json'
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const projectData = await response.json();
            
            if (!projectData.web_url) {
              throw new Error('Invalid project data received from GitLab API');
            }
            
            const mergeRequestsUrl = `${projectData.web_url}/-/merge_requests`;
            
            repoButton.href = mergeRequestsUrl;
            repoButton.style.opacity = '1';
            repoButton.style.pointerEvents = 'auto';
            repoButton.title = `Open Merge Requests for ${projectData.path_with_namespace || projectData.name || 'project'}`;
          } else {
            // Handle specific HTTP errors
            let errorMessage = `GitLab API error: ${response.status} ${response.statusText}`;
            if (response.status === 401 || response.status === 403) {
              errorMessage = 'Authentication failed. Please check your GitLab token.';
            } else if (response.status === 404) {
              errorMessage = 'Project not found. Please check your project ID.';
            }
            
            if (!silent) {
              console.warn(errorMessage);
            }
            setFallbackRepositoryLink(projectId, repoButton);
          }
        } catch (error) {
          if (!silent) {
            console.error('Error fetching project information:', error);
            
            // Show user-friendly error message only if not silent
            if (error.name === 'AbortError') {
              showError('Connection Timeout', 'Unable to connect to GitLab. Please check your connection.');
            } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
              showError('Network Error', 'Unable to connect to GitLab. Please check your internet connection.');
            } else {
              showError('GitLab Error', error.message || 'Unable to fetch project information from GitLab.');
            }
          }
          
          // Always set fallback link so user can still access the project
          setFallbackRepositoryLink(projectId, repoButton);
        }
      }

      function setFallbackRepositoryLink(projectId, repoButton) {
        try {
          // Fallback to project URL - handle both numeric ID and namespace/project format
          const webUrl = buildGitLabWebUrl(window.gitlabSettings?.gitlabUrl);
          if (webUrl && projectId) {
            let fallbackUrl;
            
            // If projectId looks like a namespace/project (contains slash), use it directly
            if (projectId.includes('/')) {
              fallbackUrl = `${webUrl}/${encodeURIComponent(projectId)}/-/merge_requests`;
            } else {
              // For numeric project IDs, we can't generate a proper URL without API
              // So link to the project overview instead of merge requests
              fallbackUrl = `${webUrl}/projects/${encodeURIComponent(projectId)}`;
            }
            
            repoButton.href = fallbackUrl;
            repoButton.style.opacity = '1';
            repoButton.style.pointerEvents = 'auto';
            
            if (projectId.includes('/')) {
              repoButton.title = `Open Merge Requests for ${projectId}`;
            } else {
              repoButton.title = `Open Project ${projectId} (configure namespace/project format for direct merge request access)`;
            }
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
        const dropdowns = document.querySelectorAll(".unit-dropdown");

        dropdowns.forEach((dropdown) => {
          const type = dropdown.dataset.type;
          const value = dropdown.value;

          if (value !== "") {
            if (type === "collection") {
              const name = dropdown.dataset.name;
              collections[name] = value;
            } else if (type === "group") {
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
              type: "update-unit-settings",
              collections: collections,
              groups: groups,
            },
          },
          "*"
        );
      };

      window.resetUnitsSettings = function () {
        if (
          confirm(
            "Are you sure you want to reset all unit settings to smart defaults?"
          )
        ) {
          const dropdowns = document.querySelectorAll(".unit-dropdown");
          dropdowns.forEach((dropdown) => {
            dropdown.value = "";
          });

          window.saveUnitsSettings();
        }
      };

      document.querySelectorAll(".tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
          document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));

          tab.classList.add("active");
          const tabContent = document.getElementById(tab.dataset.tab + "-content");
          tabContent.classList.add("active");

          if (tab.dataset.tab === "units") {
            loadUnitsSettings();
          }
          
          // Auto-resize disabled to maintain consistent plugin size
          // setTimeout(() => {
          //   resizeForCurrentContent();
          // }, 100);
        });
      });

      let variablesData = [];
      let componentsData = [];
      let currentCSSData = null;
      window.gitlabSettings = null;
      let unitsData = null;

      const AVAILABLE_UNITS = [
        "",
        "px",
        "rem",
        "em",
        "%",
        "vw",
        "vh",
        "vmin",
        "vmax",
        "pt",
        "pc",
        "in",
        "cm",
        "mm",
        "ex",
        "ch",
        "fr",
        "none",
      ];

      function findVariableNameById(variableId) {
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
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
          element.style.border = "2px solid #8b5cf6";
          setTimeout(() => {
            element.style.backgroundColor = "";
            element.style.border = "";
          }, 2000);
        }
      }

      function scrollToGroup(collection, group) {
        const element = document.getElementById(`group-${collection}-${group}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
          element.style.border = "2px solid #8b5cf6";
          setTimeout(() => {
            element.style.backgroundColor = "";
            element.style.border = "";
          }, 2000);
        }
      }

      function scrollToGroupById(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.backgroundColor = "rgba(139, 92, 246, 0.2)";
          element.style.border = "2px solid #8b5cf6";
          setTimeout(() => {
            element.style.backgroundColor = "";
            element.style.border = "";
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

          const exportButton = document.getElementById("export-css-button");
          const commitButton = document.getElementById("commit-repo-button");
          
          // Add safety checks for DOM elements
          if (!exportButton) {
            console.warn('Export button not found in DOM during message handling');
          }
          if (!commitButton) {
            console.warn('Commit button not found in DOM during message handling');
          }

        if (message.type === "gitlab-settings-loaded") {
          updatePluginLoadingProgress(loadingSteps[1], 25);
          window.gitlabSettings = message.settings;
          window.gitlabSettingsLoaded = true;
          loadConfigurationTab();
          updateRepositoryLink();
          updateCommitButtonStates();
          checkAndShowUserGuide();
        } else if (message.type === "gitlab-settings-saved") {
        } else if (message.type === "document-data") {
          updatePluginLoadingProgress(loadingSteps[3], 75);
          variablesData = message.variablesData;
          componentsData = message.componentsData;
          
          renderVariables(variablesData);
          renderComponents(componentsData);
          
          // Enable the export button only if there are variables
          if (
            variablesData &&
            variablesData.some((collection) => collection.variables.length > 0)
          ) {
            exportButton.disabled = false;
          } else {
            exportButton.disabled = true;
          }
          
          // Update commit button states based on both variables and settings
          updateCommitButtonStates();
          
          // Complete loading and hide overlay
          updatePluginLoadingProgress(loadingSteps[5], 100);
          setTimeout(() => {
            hidePluginLoadingOverlay();
          }, 500);
          
          // Auto-resize disabled to maintain consistent plugin size
        } else if (message.type === "document-data-error") {
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
            renderVariables(variablesData);
          }
          // setTimeout(() => {
          //   resizeForCurrentContent();
          // }, 200);

          // Enable the export button only if there are variables
          if (
            variablesData &&
            variablesData.some((collection) => collection.variables.length > 0)
          ) {
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
        } else if (message.type === "css-export") {
          // Store the CSS data for later use
          currentCSSData = message.cssData;
          // Only trigger download if this was an explicit export request
          if (message.shouldDownload) {
            const format = message.exportFormat || "css";
            downloadCSS(message.cssData, format);
            
            // Cleanup loading states after successful export
            const exportButton = document.getElementById("export-css-button");
            if (exportButton) {
              hideButtonLoading(exportButton);
            }
            renderVariables(variablesData); // Restore variables display
          }
        } else if (message.type === "angular-export-data") {
          // Trigger ZIP download with component data based on selected language
          const language = message.language || "angular";
          downloadComponentsZip(message.files, language);
        } else if (message.type === "test-generated") {
          // Handle test generation result
          if (message.forCommit) {
            // For commit, send the commit-component-test message
            if (!window.gitlabSettings) {
              showError(
                "Configuration Required",
                "Please configure your GitLab settings in the Settings tab first."
              );

              // Reset button state
              const buttons = document.querySelectorAll("button.loading");
              buttons.forEach((button) => {
                if (button.textContent === "Committing...") {
                  button.classList.remove("loading");
                  button.textContent =
                    button.dataset.originalText || "Commit Test";
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
                  type: "commit-component-test",
                  gitlabUrl: window.gitlabSettings.gitlabUrl,
                  projectId: window.gitlabSettings.projectId,
                  gitlabToken: window.gitlabSettings.gitlabToken,
                  commitMessage: commitMessage,
                  componentName: message.componentName,
                  testContent: message.testContent,
                  testFilePath:
                    window.gitlabSettings.testFilePath ||
                    "components/{componentName}.spec.ts",
                  branchName:
                    window.gitlabSettings.testBranchName ||
                    "feature/component-tests",
                },
              },
              "*"
            );

          } else {
            downloadTest(message.componentName, message.testContent);
            const buttons = document.querySelectorAll("button.loading");
            buttons.forEach((button) => {
              if (button.textContent === "Generating test..." || button.textContent === "Generating...") {
                button.classList.remove("loading");
                // Clear timeout if it exists
                if (button.dataset.timeoutId) {
                  clearTimeout(parseInt(button.dataset.timeoutId));
                  delete button.dataset.timeoutId;
                }
                // Restore the original button text
                button.textContent = button.dataset.originalText || "Generate Test";
                button.disabled = false;

                const successMessage = button.parentElement.nextElementSibling;
                if (
                  successMessage &&
                  successMessage.classList.contains("test-success-message")
                ) {
                  successMessage.textContent = "Test generated successfully!";
                  successMessage.style.display = "block";
                  setTimeout(() => {
                    successMessage.style.display = "none";
                  }, 3000);
                }
              }
            });
          }
        } else if (message.type === "commit-progress") {
          const progressBar = document.getElementById("commit-progress");
          const progressStatus = document.getElementById("progress-status");

          if (progressBar && progressStatus) {
            progressBar.style.width = `${message.progress}%`;
            if (message.message) {
              progressStatus.textContent = message.message;
            }
          }
        } else if (message.type === "error") {
          console.error("Plugin Error:", message.message);
          showError("Plugin Error", message.message);
          const buttons = document.querySelectorAll("button.loading");
          buttons.forEach((button) => {
            button.classList.remove("loading");
            button.textContent =
              button.dataset.originalText ||
              (button.classList.contains("generate-all-variants-button")
                ? "Generate Test for All Variants"
                : "Generate Test");
            button.disabled = false;
          });

          exportButton.disabled = true;
          
          // Cleanup any content loading states on error
          renderVariables(variablesData);
          renderComponents(componentsData);
        } else if (message.type === "component-selected") {
          // Show success notification when component is selected
          showNotification('success', 'Navigation', `Navigated to component: ${message.componentName}`, 3000);
        } else if (message.type === "commit-success") {
          if (message.mergeRequestUrl) {
            // Show in-modal notification with merge request link
            const messageWithLink = message.message + ` <a href="${message.mergeRequestUrl}" target="_blank">View Merge Request →</a>`;
            showModalSuccess("gitlab-modal", "Merge Request Created!", messageWithLink);
            
            // Update button to close
            const commitButton = document.getElementById("commit-submit-button");
            commitButton.textContent = "Close";
            commitButton.classList.remove("loading");
            commitButton.disabled = false;
            commitButton.onclick = closeGitLabModal;
          } else {
            showSuccess(
              "Commit Successful",
              message.message || "Successfully committed to GitLab repository!"
            );
            closeGitLabModal();
            resetCommitButton();
          }
        } else if (message.type === "commit-error") {
          // Generate appropriate help message based on error type
          let helpMessage = "";
          if (message.errorType === "auth") {
            helpMessage = `This is a permission issue. Please check your <strong>Project ID</strong> and <strong>Access Token</strong> in <a href="#" onclick="openSettingsModal(); return false;" style="color: var(--primary-600); text-decoration: underline; font-weight: 500;">Settings</a>.`;
          } else if (message.errorType === "network") {
            // Add link to GitLab project for network errors
            const projectUrl = window.gitlabSettings?.projectId 
              ? `${buildGitLabWebUrl(window.gitlabSettings.gitlabUrl)}/projects/${window.gitlabSettings.projectId}`
              : buildGitLabWebUrl(window.gitlabSettings.gitlabUrl);
            helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test GitLab connection in browser →</a>`;
          } else if (message.errorType === "api") {
            if (message.statusCode === 404) {
              helpMessage = "Please verify your project ID is correct and you have access to this project.";
            } else if (message.statusCode === 429) {
              helpMessage = "Too many requests. Please wait a few minutes before trying again.";
            } else {
              helpMessage = "Please check your GitLab settings and try again.";
            }
          } else {
            helpMessage = "Please check your credentials and settings, then try again.";
          }
          
          showModalError("gitlab-modal", "Commit Failed", `${message.error}<br><br><small>${helpMessage}</small>`);
          resetCommitButton();
        } else if (message.type === "test-commit-success") {
          // Handle successful component test commit
          // Find any loading commit buttons and update them
          const buttons = document.querySelectorAll("button.loading");
          let buttonFound = false;
          
          buttons.forEach((button) => {
            if (button.textContent === "Committing test..." || button.textContent === "Committing...") {
              button.classList.remove("loading");
              // Clear timeout if it exists
              if (button.dataset.timeoutId) {
                clearTimeout(parseInt(button.dataset.timeoutId));
                delete button.dataset.timeoutId;
              }
              button.textContent = button.dataset.originalText || "Commit Test";
              button.disabled = false;
              buttonFound = true;

              // Show success notification matching variable commit style
              const notificationMessage = message.mergeRequestUrl 
                ? `Component test committed successfully! <a href="${message.mergeRequestUrl}" target="_blank" style="color: var(--success-600); text-decoration: underline;">View Merge Request →</a>`
                : "Component test committed successfully!";
              
              const title = message.mergeRequestUrl ? "Merge Request Created!" : "Commit Successful";
              showSuccess(title, notificationMessage, 8000); // Show for 8 seconds
            }
          });

          // If no specific button was found, show global notification (fallback)
          if (!buttonFound) {
            const notificationMessage = message.mergeRequestUrl 
              ? `Component test committed successfully! <a href="${message.mergeRequestUrl}" target="_blank" style="color: var(--success-600); text-decoration: underline;">View Merge Request →</a>`
              : "Component test committed successfully!";
            
            const title = message.mergeRequestUrl ? "Merge Request Created!" : "Commit Successful";
            showSuccess(title, notificationMessage, 8000); // Show for 8 seconds
          }
        } else if (message.type === "test-commit-error") {
          // Handle component test commit errors
          const buttons = document.querySelectorAll("button.loading");
          let buttonFound = false;
          
          buttons.forEach((button) => {
            if (button.textContent === "Committing...") {
              button.classList.remove("loading");
              button.textContent = button.dataset.originalText || "Commit Test";
              button.disabled = false;
              buttonFound = true;

              // Find the container where to show the notification
              const componentContainer = button.closest('.component-item') || button.parentElement;
              
              // Generate appropriate help message based on error type
              let helpMessage = "";
              if (message.errorType === "auth") {
                helpMessage = `This is a permission issue. Please check your <strong>Project ID</strong> and <strong>Access Token</strong> in <a href="#" onclick="openSettingsModal(); return false;" style="color: var(--primary-600); text-decoration: underline; font-weight: 500;">Settings</a>.`;
              } else if (message.errorType === "network") {
                // Add link to GitLab project for network errors
                const projectUrl = window.gitlabSettings?.projectId 
                  ? `https://gitlab.fhnw.ch/projects/${window.gitlabSettings.projectId}`
                  : 'https://gitlab.fhnw.ch';
                helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test GitLab connection →</a>`;
              } else if (message.errorType === "api") {
                if (message.statusCode === 404) {
                  helpMessage = "Please verify your project ID and permissions.";
                } else if (message.statusCode === 429) {
                  helpMessage = "Rate limit exceeded. Please try again later.";
                } else {
                  helpMessage = "Please check your GitLab settings.";
                }
              } else {
                helpMessage = "Please check your credentials and try again.";
              }
              
              // Show the error with component context
              const errorMessage = `${message.error}<br><small>${helpMessage}</small>`;
              showInlineError(componentContainer, "Commit Failed", errorMessage, 15000);
            }
          });

          // If no specific button was found, show global error notification (fallback)
          if (!buttonFound) {
            let helpMessage = "";
            if (message.errorType === "auth") {
              helpMessage = `This is a permission issue. Please check your <strong>Project ID</strong> and <strong>Access Token</strong> in <a href="#" onclick="openSettingsModal(); return false;" style="color: var(--primary-600); text-decoration: underline; font-weight: 500;">Settings</a>.`;
            } else if (message.errorType === "network") {
              // Add link to GitLab project for network errors
              const projectUrl = window.gitlabSettings?.projectId 
                ? `https://gitlab.fhnw.ch/projects/${window.gitlabSettings.projectId}`
                : 'https://gitlab.fhnw.ch';
              helpMessage = `<a href="${projectUrl}" target="_blank" style="color: var(--primary-600); text-decoration: underline;">Test GitLab connection →</a>`;
            } else if (message.errorType === "api") {
              helpMessage = "Please check your GitLab settings and try again.";
            } else {
              helpMessage = "Please check your credentials and settings, then try again.";
            }
            
            showError("Test Commit Failed", `${message.error} ${helpMessage}`);
          }
        } else if (message.type === "unit-settings-data") {
          // Handle units settings data
          unitsData = message.data;
          renderUnitsSettings(unitsData);
        } else if (message.type === "unit-settings-updated") {
          // Handle successful unit settings update
          if (message.success) {
            // Show subtle success feedback by temporarily changing button text
            const saveButton = document.getElementById("save-units-button");
            const originalText = saveButton.textContent;
            saveButton.textContent = "Saved!";
            saveButton.style.backgroundColor = "#28a745";
            saveButton.disabled = true;

            // Reset button appearance after 2 seconds
            setTimeout(() => {
              saveButton.textContent = originalText;
              saveButton.style.backgroundColor = "";
            }, 2000);
          }
        } else if (message.type === "component-styles-loaded") {
          // Handle loaded component styles
          const componentId = message.componentId;
          const styles = message.styles;
          const textElements = message.textElements;
          
          // Find the component element that was loading
          const componentElement = document.querySelector(`[data-component-id="${componentId}"]`);
          
          if (componentElement) {
            // Get component name from the element (look for the component name in the meta div)
            const metaDiv = componentElement.parentElement.querySelector('.component-meta');
            const componentName = metaDiv ? metaDiv.querySelector('.component-name')?.textContent || 'Component' : 'Component';
            
            // Format the loaded styles and update the content
            const formattedStyles = formatStyles(styles, textElements, componentName);
            
            // Update the content with the loaded styles, keeping the close button
            componentElement.innerHTML = formattedStyles + 
              '<button class="close-button" onclick="event.stopPropagation(); toggleStyles(this.parentElement)">Close</button>';
            
            // Clean up the loading data
            delete componentElement.dataset.originalContent;
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
      function renderVariables(data) {
        if (data.length === 0) {
          const container = document.getElementById("variables-container");
          container.innerHTML = '';
          const noItemsDiv = document.createElement('div');
          noItemsDiv.className = 'no-items';
          noItemsDiv.textContent = 'No variables found in this document.';
          container.appendChild(noItemsDiv);
          return;
        }

        const container = document.getElementById("variables-container");
        let html = "";

        // Analyze data for validation issues
        const validationIssues = [];

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

        if (validationIssues.length > 0) {
          html += `
            <div class="validation-issues">
              <h3 style="color: #e74c3c; margin-bottom: 12px;">
                <span style="margin-right: 8px;">⚠️</span>
                Variable Configuration Issues
              </h3>
              <div class="validation-issues-list">
                ${validationIssues
                  .map(
                    (issue) => `
                  <div class="validation-issue-item">
                    <strong>${issue.displayName}</strong>
                    <span class="issue-description">Contains both direct values and variable links</span>
                    <button type="button" class="issue-link" onclick="scrollToGroupById('${issue.sanitizedId}')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                        <path d="m9 18 6-6-6-6"/>
                      </svg>
                      Go to section
                    </button>
                  </div>
                `
                  )
                  .join("")}
              </div>
              <div class="validation-help">
                <small>Groups should contain either all direct values or all variable links, not both.</small>
              </div>
            </div>
          `;
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
            html += `
              <div class="variable-collection">
                <h3 class="collection-name">${collection.name}</h3>
            `;

            // Render standalone variables first
            if (standaloneVars.length > 0) {
              const varsWithCollection = standaloneVars.map((v) => ({
                ...v,
                collection: collection.name,
              }));
              html += renderVariableTable(varsWithCollection);
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
              const groupId = `group-${collection.name.replace(
                /[^a-zA-Z0-9]/g,
                "-"
              )}-${prefix.replace(/[^a-zA-Z0-9]/g, "-")}`;

              html += `
                <div class="variable-subgroup ${
                  hasMixedValues ? "has-validation-issues" : ""
                }" id="${groupId}">
                  <div class="subgroup-header" onclick="toggleSubgroup('${groupId}')">
                    <div class="subgroup-title">
                      ${displayName}
                      <span class="subgroup-stats">${variables.length} variable${variables.length !== 1 ? 's' : ''}</span>
                      ${
                        hasMixedValues
                          ? '<span class="validation-warning" title="This group contains both direct values and variable links">⚠️</span>'
                          : ""
                      }
                    </div>
                    <span class="subgroup-toggle">▼</span>
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

            html += "</div>";
          }
        });

        container.innerHTML = SecurityUtils.sanitizeHTML(html);
      }

      // Render a group of variables with a title
      function renderVariableTable(variables) {
        let html = `
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Values</th>
                </tr>
              </thead>
              <tbody>
        `;

        variables.forEach((variable) => {
          const sanitizedId = variable.name
            .replace(/[^a-zA-Z0-9]/g, "-")
            .toLowerCase();
          html += `
            <tr id="var-${sanitizedId}">
              <td>${variable.name}</td>
              <td>${variable.resolvedType}</td>
              <td>
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
                  ${showModeName ? mode.modeName + ": " : ""}<span 
                    style="color: #c4b5fd; font-weight: 500; cursor: pointer; text-decoration: underline;" 
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
                <div>
                  <span class="color-preview" style="background-color: rgba(${r},${g},${b},${a})"></span>
                  ${
                    showModeName ? mode.modeName + ": " : ""
                  }rgba(${r},${g},${b},${a})
                </div>
              `;
            } else {
              html += `<div>${
                showModeName ? mode.modeName + ": " : ""
              }${JSON.stringify(value)}</div>`;
            }
          });

          html += `
              </td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
        `;

        return html;
      }

      // Extract component type and state from name
      function parseComponentName(name) {
        const result = {
          name: name,
          variants: []
        };

        // Extract all property=value patterns (Type=, State=, Size=, etc.)
        const variantMatches = name.match(/([A-Za-z]+)=([^,]+)/g);
        if (variantMatches) {
          variantMatches.forEach(match => {
            const [property, value] = match.split('=');
            if (property && value) {
              result.variants.push({
                property: property.trim(),
                value: value.trim()
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
        if (!textElements || textElements.length === 0) return "";
        return "";
      }


      function formatStyles(styles, textElements, componentName) {
        if (!styles) return "";


        try {
          let stylesObj = styles;
          if (typeof styles === "string") {
            stylesObj = JSON.parse(styles);
          }

          let combinedStyles = { ...stylesObj };

          if (textElements && textElements.length > 0) {
            
            const parsedName = parseTextStyleName(componentName || "");
            
            textElements.forEach((textEl, index) => {
              const prefix = textElements.length > 1 ? `text_${index + 1}_` : 'text_';
              
              const stateSize = [
                parsedName.state ? `State=${parsedName.state}` : null,
                parsedName.size ? `Size=${parsedName.size}` : null
              ].filter(Boolean).join(', ');
              
              if (textEl.textStyles) {
                Object.keys(textEl.textStyles).forEach(styleKey => {
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
            const truncated = highlightedJson.substring(0, 300) + "... <span class='expand-indicator'>(Click to expand)</span>";
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

      function highlightJson(json) {
        json = json.replace(/^\s*{\s*/, "{\n  ");

        return json
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            function (match) {
              let cls = "json-number";
              if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                  cls = "json-key";
                } else {
                  cls = "json-string";
                }
              } else if (/true|false/.test(match)) {
                cls = "json-boolean";
              } else if (/null/.test(match)) {
                cls = "json-null";
              }
              return '<span class="' + cls + '">' + match + "</span>";
            }
          );
      }

      function getVariableValue(variable) {
        let value, resolvedType;

        if (variable.valuesByMode && Array.isArray(variable.valuesByMode)) {
          const firstMode = variable.valuesByMode[0];
          if (!firstMode) return null;
          value = firstMode.value;
          resolvedType = variable.resolvedType || variable.type;
        } else if (
          variable.valuesByMode &&
          typeof variable.valuesByMode === "object"
        ) {
          const modeKeys = Object.keys(variable.valuesByMode);
          if (modeKeys.length === 0) return null;
          value = variable.valuesByMode[modeKeys[0]];
          resolvedType = variable.resolvedType;
        } else {
          return null;
        }

        if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
          const referencedVariable = findVariableById(value.id);
          if (referencedVariable) {
            return getVariableValue(referencedVariable);
          }
          return null;
        }

        if (
          resolvedType === "COLOR" &&
          typeof value === "object" &&
          value.r !== undefined
        ) {
          const r = Math.round(value.r * 255);
          const g = Math.round(value.g * 255);
          const b = Math.round(value.b * 255);
          const a = value.a !== undefined ? value.a : 1;
          return `rgba(${r}, ${g}, ${b}, ${a})`;
        } else if (resolvedType === "FLOAT") {
          return `${value}px`;
        } else if (resolvedType === "STRING") {
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
            typeof firstMode.value === "object" &&
            firstMode.value.type === "VARIABLE_ALIAS"
          ) {
            const referencedVariable = findVariableById(firstMode.value.id);
            if (referencedVariable) {
              const sanitizedName = referencedVariable.name
                .replace(/[^a-zA-Z0-9]/g, "-")
                .toLowerCase();
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
              if (
                typeof value === "object" &&
                value.type === "VARIABLE_ALIAS"
              ) {
                const referencedVariable = findVariableById(value.id);
                return `${mode.modeName}: ${
                  referencedVariable ? referencedVariable.name : value.id
                }`;
              }
              return `${mode.modeName}: ${formatSingleValue(
                value,
                variable.resolvedType
              )}`;
            })
            .join(", ");
        } else {
          const firstMode = variable.valuesByMode[0];
          if (!firstMode) return "No value";

          const value = firstMode.value;
          if (typeof value === "object" && value.type === "VARIABLE_ALIAS") {
            const referencedVariable = findVariableById(value.id);
            return referencedVariable ? referencedVariable.name : value.id;
          }

          return formatSingleValue(value, variable.resolvedType);
        }
      }

      function formatSingleValue(value, resolvedType) {
        if (
          resolvedType === "COLOR" &&
          typeof value === "object" &&
          value.r !== undefined
        ) {
          const r = Math.round(value.r * 255);
          const g = Math.round(value.g * 255);
          const b = Math.round(value.b * 255);
          if (value.a != null && value.a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${value.a.toFixed(2)})`;
          }
          return `rgb(${r}, ${g}, ${b})`;
        }

        if (resolvedType === "FLOAT") {
          return `${value}px`;
        }

        if (resolvedType === "STRING") {
          return `"${value}"`;
        }

        return String(value);
      }

      function renderComponents(data) {
        const container = document.getElementById("components-container");

        if (!data || data.length === 0) {
          container.innerHTML = '';
          const noItemsDiv = document.createElement('div');
          noItemsDiv.className = 'no-items';
          noItemsDiv.textContent = 'No components found in this document.';
          container.appendChild(noItemsDiv);
          return;
        }

        let html = `<div class="component-list">`;

        data.forEach((component, index) => {
          if (component.type === "COMPONENT_SET") {
            const parsedName = parseComponentName(component.name);

            html += `
            <div class="component-set">
              <div class="component-set-header">
                <div class="component-header-content">
                  <div class="component-set-toggle" data-index="${index}" onclick="toggleComponentSet(${index})">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9.5 7L14.5 12L9.5 17V7Z"/>
                    </svg>
                  </div>
                  <button class="nav-icon" data-component-id="${component.id}" title="Navigate to component in Figma">
                    📍
                  </button>
                  <div class="component-meta">
                    <span class="component-name">${parsedName.name}</span>
                    <span class="badge badge-component-set">Component Set</span>
                  </div>
                </div>
                <div class="component-actions">
                  <button class="generate-all-variants-button" data-component-id="${component.id}" data-component-name="${component.name}" data-action="generate">Generate Test</button>
                  <button class="commit-all-variants-button" data-component-id="${component.id}" data-component-name="${component.name}" data-action="commit">Commit Test</button>
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
                    <button class="nav-icon" data-component-id="${child.id}" title="Navigate to variant in Figma">
                      📍
                    </button>
                    <div class="component-meta">
                      <span class="component-name">${childParsed.name}</span>
                      ${
                        childParsed.variants.length > 0
                          ? childParsed.variants.map(variant => 
                              `<span class="badge badge-variant">${variant.property}=${variant.value}</span>`
                            ).join('')
                          : '<span class="badge badge-component">Variant</span>'
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
                <button class="nav-icon" data-component-id="${component.id}" title="Navigate to component in Figma">
                  📍
                </button>
                <div class="component-meta">
                  <span class="component-name">${parsedName.name}</span>
                  ${
                    parsedName.variants.length > 0
                      ? parsedName.variants.map(variant => 
                          `<span class="badge badge-variant">${variant.property}=${variant.value}</span>`
                        ).join('')
                      : '<span class="badge badge-component">Component</span>'
                  }
                </div>
                <div class="component-actions">
                  <button class="generate-all-variants-button" data-component-id="${component.id}" data-component-name="${component.name}" data-action="generate">Generate Test</button>
                  <button class="commit-all-variants-button" data-component-id="${component.id}" data-component-name="${component.name}" data-action="commit">Commit Test</button>
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
        container.addEventListener('click', function(event) {
          if (event.target.closest('.nav-icon')) {
            const button = event.target.closest('.nav-icon');
            const componentId = button.getAttribute('data-component-id');
            if (componentId) {
              console.log('Clicked nav icon for component:', componentId);
              window.selectComponent(componentId);
            }
          }
          
          // Handle generate/commit test buttons
          if (event.target.matches('.generate-all-variants-button, .commit-all-variants-button')) {
            event.stopPropagation();
            const button = event.target;
            const componentId = button.getAttribute('data-component-id');
            const componentName = button.getAttribute('data-component-name');
            const action = button.getAttribute('data-action');
            
            if (componentId && componentName) {
              const isCommit = action === 'commit';
              generateTest(componentId, componentName, button, true, isCommit);
            }
          }
        });

        window.toggleComponentSet = function (index) {
          const headerEl = document.querySelector(
            `.component-set-header[data-index="${index}"]`
          );
          const childrenEl = document.getElementById(`children-${index}`);

          if (childrenEl.classList.contains("expanded")) {
            childrenEl.classList.remove("expanded");
            headerEl.classList.remove("expanded");
            headerEl.querySelector(".component-set-toggle").textContent = "+";
          } else {
            childrenEl.classList.add("expanded");
            headerEl.classList.add("expanded");
            headerEl.querySelector(".component-set-toggle").textContent = "-";
          }
        };

        window.toggleStyles = function (element) {
          const isExpanding = !element.classList.contains("expanded");
          element.classList.toggle("expanded");

          const wrapper = element.querySelector('.style-content-wrapper');
          if (wrapper) {
            const collapsed = wrapper.querySelector('.style-collapsed');
            const expanded = wrapper.querySelector('.style-expanded');
            
            if (element.classList.contains("expanded")) {
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
              loadingDiv.innerHTML = '<span class="loading-spinner">⏳</span> Loading component styles...';
              
              // Replace content temporarily
              const originalContent = element.innerHTML;
              element.innerHTML = loadingDiv.outerHTML;
              
              // Request component styles from plugin
              parent.postMessage({
                pluginMessage: {
                  type: "load-component-styles",
                  componentId: componentId
                }
              }, "*");
              
              // Store the element for later update
              element.dataset.originalContent = originalContent;
            }
          }

          if (element.classList.contains("expanded")) {
            setTimeout(() => {
              element.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 100);
          }
        };

      }

      function downloadCSS(cssString, format = "css") {
        const mimeType = format === "scss" ? "text/scss" : "text/css";
        const fileExtension = format === "scss" ? "scss" : "css";

        const blob = new Blob([cssString], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `figma-variables.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      const exportCssButton = document.getElementById("export-css-button");
      if (exportCssButton) {
        exportCssButton.addEventListener("click", () => {
          try {
            // Default to CSS format if no settings configured
            const exportFormat = window.gitlabSettings?.exportFormat || "css";
            
            // Validate export format
            if (!['css', 'scss'].includes(exportFormat.toLowerCase())) {
              showError('Export Failed', 'Invalid export format. Please select CSS or SCSS.');
              return;
            }

            // Enhanced loading state for export
            showButtonLoading(exportCssButton, `Generating ${exportFormat.toUpperCase()}...`);
            showContentLoading('variables-container', 'Processing variables and generating stylesheet...');

            parent.postMessage(
              {
                pluginMessage: {
                  type: "export-css",
                  shouldDownload: true,
                  exportFormat: exportFormat,
                },
              },
              "*"
            );

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
        const exportButton = document.getElementById("export-css-button");
        const format = window.gitlabSettings?.exportFormat || "css";
        const formatText = format.toUpperCase();
        exportButton.textContent = `Export Variables as ${formatText}`;
      }



      function generateTest(
        componentId,
        componentName,
        button,
        generateAllVariants = false,
        forCommit = false
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
          const loadingText = forCommit ? "Committing test..." : "Generating test...";
          
          // Store original text before changing it
          if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
          }
          
          showButtonLoading(button, loadingText);
          
          const successMessage = button.parentElement.nextElementSibling;
          if (
            successMessage &&
            successMessage.classList.contains("test-success-message")
          ) {
            successMessage.style.display = "none";
          }

          // Add timeout to prevent hanging operations
          const timeoutId = setTimeout(() => {
            console.warn('Test generation timed out');
            button.classList.remove("loading");
            button.textContent = button.dataset.originalText || 'Generate Test';
            button.disabled = false;
            showError('Generation Timeout', 'Test generation took too long. Please try again.');
          }, 60000); // 60 seconds timeout

          // Store timeout ID for potential cleanup
          button.dataset.timeoutId = timeoutId;

          parent.postMessage(
            {
              pluginMessage: {
              type: "generate-test",
              componentId: componentId,
              componentName: componentName,
              generateAllVariants: generateAllVariants,
              forCommit: forCommit,
            },
          },
          "*"
          );

        } catch (error) {
          console.error('Error in generateTest:', error);
          
          try {
            // Clean up button state
            button.classList.remove("loading");
            button.textContent = button.dataset.originalText || 'Generate Test';
            button.disabled = false;
            
            // Clear timeout if it exists
            if (button.dataset.timeoutId) {
              clearTimeout(parseInt(button.dataset.timeoutId));
              delete button.dataset.timeoutId;
            }
            
            // Show user-friendly error
            if (error.message.includes('parameters')) {
              showError('Invalid Input', 'Invalid component data. Please try selecting the component again.');
            } else if (error.message.includes('DOM')) {
              showError('Interface Error', 'Interface error occurred. Please refresh the plugin.');
            } else {
              showError('Generation Failed', 'Failed to generate test. Please try again.');
            }
          } catch (recoveryError) {
            console.error('Failed to recover from generateTest error:', recoveryError);
          }
        }
      }

      function downloadComponentsZip(files, language) {
        if (!files || files.length === 0) {
          showError("Export Failed", "No components available to export");
          return;
        }

        const zip = new JSZip();
        files.forEach((component) => {
          const folder = zip.folder(component.kebabName);
          const folderName = component.kebabName;

          if (language === "angular") {
            folder.file(`${folderName}.component.html`, component.angularHtml);
            folder.file(`${folderName}.component.ts`, component.angularTs);
            folder.file(`${folderName}.component.scss`, `// Styles for ${component.name}\n.${folderName} {\n  // Add your styles here\n}`);
          } else if (language === "typescript") {
            folder.file(`${folderName}.component.ts`, component.angularTs);
          } else if (language === "javascript") {
            const jsCode = component.angularTs
              .replace(/: [A-Za-z<>[\]]+/g, "")
              .replace(/interface [^}]+}/g, "");
            folder.file(`${folderName}.component.js`, jsCode);
          }
        });

        // Generate and download the ZIP
        zip.generateAsync({ type: "blob" }).then((content) => {
          try {
            const url = URL.createObjectURL(content);
            const a = document.createElement("a");
            a.href = url;
            a.download = `figma-components-${language}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showSuccess('Download Complete', `Components exported successfully as ${language.toUpperCase()} files.`);
          } catch (error) {
            console.error('Error downloading ZIP file:', error);
            showError('Download Failed', 'Failed to download the exported files. Please try again.');
          }
        }).catch((error) => {
          console.error('Error generating ZIP file:', error);
          showError('Export Failed', 'Failed to generate the export files. Please try again.');
        });
      }

      // Function to download a generated test
      function downloadTest(componentName, testContent) {
        // Create a kebab case version of the component name for the file name
        const kebabName = componentName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        const blob = new Blob([testContent], { type: "text/javascript" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${kebabName}.component.spec.ts`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Search functionality
      const variableSearchElement = document.getElementById("variable-search");
      if (variableSearchElement) {
        variableSearchElement.addEventListener("input", (e) => {
          const searchTerm = e.target.value.toLowerCase();

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
                    return variable.valuesByMode.some(mode => {
                      const value = mode.value;
                      
                      // Search in mode name
                      if (mode.modeName && mode.modeName.toLowerCase().includes(searchTerm)) {
                        return true;
                      }
                      
                      // Handle VARIABLE_ALIAS references
                      if (typeof value === "object" && value && value.type === "VARIABLE_ALIAS") {
                        // Search by the referenced variable name if we can find it
                        const referencedVar = findVariableById(value.id);
                        if (referencedVar && referencedVar.name.toLowerCase().includes(searchTerm)) {
                          return true;
                        }
                      }
                      
                      // Search in color values
                      if (variable.resolvedType === "COLOR" && typeof value === "object" && value && value.r !== undefined) {
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
                        if (searchTerm === r.toString() || searchTerm === g.toString() || searchTerm === b.toString()) {
                          return true;
                        }
                      }
                      
                      // Search in numeric values (including with px suffix)
                      if (typeof value === "number") {
                        // Check exact number
                        if (value.toString().includes(searchTerm)) {
                          return true;
                        }
                        // Check with px suffix
                        if (`${value}px`.includes(searchTerm)) {
                          return true;
                        }
                        // Check just the number part if search includes 'px'
                        if (searchTerm.includes('px') && searchTerm.replace('px', '') === value.toString()) {
                          return true;
                        }
                      }
                      
                      // Search in string values
                      if (typeof value === "string") {
                        if (value.toLowerCase().includes(searchTerm)) {
                          return true;
                        }
                      }
                      
                      return false;
                    });
                  }
                  
                  return false;
                })
              };
            })
            .filter((collection) => collection.variables.length > 0);

          renderVariables(filteredData);
        });
      }

      const componentSearchElement =
        document.getElementById("component-search");
      if (componentSearchElement) {
        componentSearchElement.addEventListener("input", (e) => {
          const searchTerm = e.target.value.toLowerCase();

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
            if (component.children && component.children.some((child) => {
              return child.name.toLowerCase().includes(searchTerm) ||
                     (child.type && child.type.toLowerCase().includes(searchTerm));
            })) {
              return true;
            }
            
            return false;
          });

          renderComponents(filteredData);
        });
      }

      // Function to open settings modal
      function openSettingsModal() {
        document.getElementById("settings-modal").style.display = "block";
        loadConfigurationTab(); // Load saved settings into the form
      }

      // Function to close settings modal
      function closeSettingsModal() {
        document.getElementById("settings-modal").style.display = "none";
      }

      // Function to open user guide modal
      function openUserGuide() {
        document.getElementById("user-guide-modal").style.display = "block";
      }

      // Function to close user guide modal
      function closeUserGuide() {
        document.getElementById("user-guide-modal").style.display = "none";
      }


      // Function to open GitHub with specific feedback type
      function openGitHubFeedback(type) {
        // Get plugin version from the UI
        const pluginVersion = "1.0.0"; // You might want to dynamically get this
        const figmaVersion = "Figma Desktop"; // This is a placeholder
        
        let issueTitle = '';
        let labels = 'feedback';
        let checkboxes = '';
        
        switch(type) {
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
        switch(type) {
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
        showNotification("info", "Feedback", notificationMessage, 3000);
      }

      // Function to show reset confirmation modal
      function showResetConfirmation() {
        document.getElementById("reset-confirmation-modal").style.display =
          "block";
      }

      // Function to close reset confirmation modal
      function closeResetConfirmation() {
        document.getElementById("reset-confirmation-modal").style.display =
          "none";
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
              type: "reset-gitlab-settings",
            },
          },
          "*"
        );

        // Clear all form fields
        document.getElementById("config-project-id").value = "";
        document.getElementById("config-file-path").value = "src/variables.css";
        document.getElementById("config-export-format").value = "css";
        document.getElementById("config-test-file-path").value =
          "components/{componentName}/{componentName}.spec.ts";
        document.getElementById("config-token").value = "";
        document.getElementById("config-strategy").value = "merge-request";
        document.getElementById("config-branch").value = "feature/variables";
        document.getElementById("config-test-branch").value =
          "feature/component-tests";
        document.getElementById("config-save-token").checked = true;
        document.getElementById("config-share-team").checked = true;

        // Hide metadata
        document.getElementById("config-metadata").style.display = "none";

        // Close both modals
        closeResetConfirmation();
        closeSettingsModal();

        showSuccess("Configuration Reset", "Configuration has been reset successfully!");
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

      function saveConfiguration() {
        try {
          // Validate DOM elements exist
          const urlElement = document.getElementById("config-gitlab-url");
          const projectIdElement = document.getElementById("config-project-id");
          const filePathElement = document.getElementById("config-file-path");
          const formatElement = document.getElementById("config-export-format");
          const testFilePathElement = document.getElementById("config-test-file-path");
          const tokenElement = document.getElementById("config-token");
          
          if (!urlElement || !projectIdElement || !filePathElement || !formatElement || 
              !testFilePathElement || !tokenElement) {
            throw new Error("Configuration form elements not found");
          }

          let gitlabUrl = urlElement.value.trim();
          
          // Auto-prepend https:// if URL doesn't have protocol
          if (gitlabUrl && !gitlabUrl.startsWith('http://') && !gitlabUrl.startsWith('https://')) {
            gitlabUrl = 'https://' + gitlabUrl;
            // Update the input field with the corrected URL
            urlElement.value = gitlabUrl;
          }
          
          const projectId = projectIdElement.value.trim();
          const filePath = filePathElement.value.trim() || "src/variables.css";
          const exportFormat = formatElement.value;
          const testFilePath = testFilePathElement.value.trim() || 
                              "components/{componentName}/{componentName}.spec.ts";
          const token = tokenElement.value.trim();
          
          const strategyElement = document.getElementById("config-strategy");
          const branchElement = document.getElementById("config-branch");
          const testBranchElement = document.getElementById("config-test-branch");
          const saveTokenElement = document.getElementById("config-save-token");
          const shareTeamElement = document.getElementById("config-share-team");
          
          if (!strategyElement || !branchElement || !testBranchElement || 
              !saveTokenElement || !shareTeamElement) {
            throw new Error("Configuration form elements not found");
          }
          
          const strategy = strategyElement.value;
          const branch = branchElement.value.trim() || "feature/variables";
          const testBranch = testBranchElement.value.trim() || "feature/component-tests";
          const saveToken = saveTokenElement.checked;
          const shareTeam = shareTeamElement.checked;

          // Enhanced validation
          if (!projectId) {
            showError("Validation Error", "Please provide a Project ID");
            return;
          }

          if (!token) {
            showError("Validation Error", "Please provide a Project Access Token");
            return;
          }

          // Validate project ID format
          const projectIdPattern = /^(\d+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/;
          if (!projectIdPattern.test(projectId)) {
            showError("Validation Error", "Invalid project ID format. Use numeric ID or namespace/project format.");
            return;
          }

          // Validate token format - very lenient, just check length and basic characters
          if (token.length < 8) {
            showError("Validation Error", "GitLab token must be at least 8 characters long.");
            return;
          }
          
          // Only reject tokens with obviously invalid characters (spaces, quotes, etc.)
          if (/[\s"'<>]/.test(token)) {
            showError("Validation Error", "GitLab token contains invalid characters.");
            return;
          }

          // Validate file paths
          if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
            showError("Validation Error", "Invalid file path - path traversal detected");
            return;
          }

          // Validate GitLab URL only if provided (empty is allowed - defaults to gitlab.com)
          if (gitlabUrl && !SecurityUtils.isValidGitLabURL(gitlabUrl)) {
            showError("Validation Error", "Invalid GitLab URL. Must be HTTPS and contain 'gitlab' in the domain");
            return;
          }

          window.gitlabSettings = {
            gitlabUrl: gitlabUrl || "", // Keep empty string to show in UI
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
            savedBy: "Current user",
          };

          parent.postMessage(
            {
              pluginMessage: {
                type: "save-gitlab-settings",
                gitlabUrl: gitlabUrl,
                projectId: projectId,
                filePath: filePath,
                exportFormat: exportFormat,
                testFilePath: testFilePath,
                gitlabToken: token,
                strategy: strategy,
                branchName: branch,
                testBranchName: testBranch,
                saveToken: saveToken,
                shareWithTeam: shareTeam,
              },
            },
            "*"
          );

          displayConfigMetadata();
          updateExportButtonText();
          updateRepositoryLink();

          showSuccess("Settings Saved", "Configuration saved successfully!", 4000);
          closeSettingsModal();
        } catch (error) {
          console.error('Error saving configuration:', error);
          showError("Configuration Error", "Failed to save configuration: " + (error.message || "Unknown error"));
        }
      }

      function loadConfigurationTab() {
        try {
          if (window.gitlabSettings) {
            // Validate all elements exist before setting values
            const elements = {
              'config-gitlab-url': window.gitlabSettings.gitlabUrl || "",
              'config-project-id': window.gitlabSettings.projectId || "",
              'config-file-path': window.gitlabSettings.filePath || "src/variables.css",
              'config-export-format': window.gitlabSettings.exportFormat || "css",
              'config-test-file-path': window.gitlabSettings.testFilePath || "components/{componentName}/{componentName}.spec.ts",
              'config-token': window.gitlabSettings.gitlabToken || "",
              'config-strategy': window.gitlabSettings.strategy || "merge-request",
              'config-branch': window.gitlabSettings.branchName || "feature/variables",
              'config-test-branch': window.gitlabSettings.testBranchName || "feature/component-tests"
            };

            for (const [id, value] of Object.entries(elements)) {
              const element = document.getElementById(id);
              if (element) {
                element.value = value;
              } else {
                console.warn(`Configuration element not found: ${id}`);
              }
            }

            // Handle checkboxes
            const saveTokenElement = document.getElementById("config-save-token");
            const shareTeamElement = document.getElementById("config-share-team");
            
            if (saveTokenElement) {
              saveTokenElement.checked = window.gitlabSettings.hasOwnProperty("saveToken")
                ? window.gitlabSettings.saveToken : true;
            }
            
            if (shareTeamElement) {
              shareTeamElement.checked = window.gitlabSettings.hasOwnProperty("isPersonal")
                ? !window.gitlabSettings.isPersonal : true;
            }

            // Handle strategy-dependent sections
            const strategyElement = document.getElementById("config-strategy");
            if (strategyElement) {
              const strategy = strategyElement.value;
              const display = strategy === "merge-request" ? "block" : "none";

              const branchSection = document.getElementById("config-branch-section");
              const testBranchSection = document.getElementById("config-test-branch-section");
              
              if (branchSection) branchSection.style.display = display;
              if (testBranchSection) testBranchSection.style.display = display;
            }

            displayConfigMetadata();
            updateExportButtonText();
            updateRepositoryLink();
          } else {
            // Set defaults for new users
            const saveTokenElement = document.getElementById("config-save-token");
            const shareTeamElement = document.getElementById("config-share-team");
            
            if (saveTokenElement) saveTokenElement.checked = true;
            if (shareTeamElement) shareTeamElement.checked = true;
          }
        } catch (error) {
          console.error('Error loading configuration:', error);
          showError("Configuration Error", "Failed to load configuration: " + (error.message || "Unknown error"));
        }
      }

      function displayConfigMetadata() {
        const metadataElement = document.getElementById("config-metadata");
        const metadataTextElement = document.getElementById(
          "config-metadata-text"
        );

        if (
          window.gitlabSettings &&
          (window.gitlabSettings.savedAt || window.gitlabSettings.savedBy)
        ) {
          metadataElement.style.display = "block";

          let metadataText = "";

          if (window.gitlabSettings.savedAt) {
            const savedDate = new Date(window.gitlabSettings.savedAt);
            const formattedDate = savedDate.toLocaleDateString();
            const formattedTime = savedDate.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            metadataText += `Last saved: ${formattedDate} at ${formattedTime}`;
          }

          if (window.gitlabSettings.savedBy) {
            metadataText += window.gitlabSettings.savedAt
              ? ` by ${window.gitlabSettings.savedBy}`
              : `Saved by: ${window.gitlabSettings.savedBy}`;
          }

          if (window.gitlabSettings.isPersonal) {
            metadataText += " (Personal settings)";
          } else {
            metadataText += " (Shared with team)";
          }

          metadataTextElement.textContent = metadataText;
        } else {
          metadataElement.style.display = "none";
        }
      }

      function toggleGitLabCredentialsFields() {
        const fieldsSection = document.getElementById(
          "gitlab-credentials-fields"
        );
        const summarySection = document.getElementById(
          "gitlab-credentials-summary"
        );
        const securityNoteCompact = document.getElementById(
          "security-note-compact"
        );
        const securityNoteFull = document.getElementById("security-note-full");

        if (fieldsSection.style.display === "none") {
          fieldsSection.style.display = "block";
          summarySection.style.display = "none";
          securityNoteCompact.style.display = "none";
          securityNoteFull.style.display = "block";
        } else {
          const projectId = document.getElementById("gitlab-project-id").value;
          if (projectId) {
            fieldsSection.style.display = "none";
            summarySection.style.display = "block";
            securityNoteCompact.style.display = "block";
            securityNoteFull.style.display = "none";

            document.getElementById("project-id-display").textContent =
              projectId;
          }
        }
      }

      function openGitLabModal() {
        document.getElementById("gitlab-modal").style.display = "block";

        const fieldsSection = document.getElementById(
          "gitlab-credentials-fields"
        );
        const summarySection = document.getElementById(
          "gitlab-credentials-summary"
        );
        const securityNoteCompact = document.getElementById(
          "security-note-compact"
        );
        const securityNoteFull = document.getElementById("security-note-full");

        fieldsSection.style.display = "block";
        summarySection.style.display = "none";
        securityNoteCompact.style.display = "none";
        securityNoteFull.style.display = "block";

        if (window.gitlabSettings) {
          if (window.gitlabSettings.projectId) {
            const projectIdField = document.getElementById("gitlab-project-id");
            projectIdField.value = window.gitlabSettings.projectId;

            document.getElementById("project-id-display").textContent =
              window.gitlabSettings.projectId;
          }

          if (window.gitlabSettings.gitlabToken) {
            document.getElementById("gitlab-token").value =
              window.gitlabSettings.gitlabToken;
            document.getElementById("save-token").checked = true;
          }

          if (window.gitlabSettings.branchName) {
            document.getElementById("branch-name").value =
              window.gitlabSettings.branchName;
          }

          if (!window.gitlabSettings.isPersonal) {
            document.getElementById("share-with-team").checked = true;
          }

          if (window.gitlabSettings.savedBy && window.gitlabSettings.savedAt) {
            const savedDate = new Date(window.gitlabSettings.savedAt);
            const formattedDate =
              savedDate.toLocaleDateString() +
              " " +
              savedDate.toLocaleTimeString();
            const savedInfoText = `Last updated by: <strong>${SecurityUtils.escapeHTML(window.gitlabSettings.savedBy)}</strong> on ${SecurityUtils.escapeHTML(formattedDate)}`;

            securityNoteCompact.innerHTML = SecurityUtils.sanitizeHTML(savedInfoText);
            const savedInfoDiv = securityNoteFull.querySelector(".saved-info");
            if (savedInfoDiv) {
              savedInfoDiv.innerHTML = SecurityUtils.sanitizeHTML(savedInfoText);
            }
          }

          if (window.gitlabSettings.projectId) {
            fieldsSection.style.display = "none";
            summarySection.style.display = "block";
            securityNoteCompact.style.display = "block";
            securityNoteFull.style.display = "none";
          }
        }

        document.getElementById("settings-button").onclick =
          toggleGitLabCredentialsFields;
      }

      // Function to close the GitLab modal
      function closeGitLabModal() {
        const modal = document.getElementById("gitlab-modal");
        if (modal) {
          // Remove old-style messages
          const successMessage = modal.querySelector(".success-message");
          if (successMessage) {
            successMessage.remove();
          }
          const errorMessage = modal.querySelector(".error-message");
          if (errorMessage) {
            errorMessage.remove();
          }
          
          // Remove new-style modal notifications
          const modalNotification = modal.querySelector(".modal-notification");
          if (modalNotification) {
            modalNotification.remove();
          }

          modal.style.display = "none";
        }
        resetCommitButton();
      }

      // Function to reset the commit button state
      function resetCommitButton() {
        const button = document.getElementById("commit-submit-button");
        if (button) {
          button.textContent = "Commit";
          button.disabled = false;
          button.onclick = commitToGitLab;
        }
      }

      // Function to commit to GitLab
      function commitToGitLab() {
        const button = document.getElementById("commit-submit-button");
        
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
          if (!window.gitlabSettings) {
            throw new Error('GitLab settings not configured. Please configure your settings in the Config tab first.');
          }

          if (!window.gitlabSettings.projectId || !window.gitlabSettings.projectId.trim()) {
            throw new Error('Project ID is required. Please configure your GitLab settings.');
          }

          if (!window.gitlabSettings.gitlabToken || !window.gitlabSettings.gitlabToken.trim()) {
            throw new Error('GitLab token is required. Please configure your GitLab settings.');
          }

          // GitLab URL is optional - if empty, it defaults to gitlab.com
          // No validation needed here since buildGitLabApiUrl handles empty URLs

          // Validate commit message
          const commitMessageElement = document.getElementById("commit-message");
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
          const filePath = window.gitlabSettings.filePath || "src/variables.css";
          if (!filePath.trim()) {
            throw new Error('File path cannot be empty. Please configure a valid file path.');
          }

          if (filePath.includes('..') || filePath.includes('\\') || filePath.startsWith('/')) {
            throw new Error('Invalid file path. Path must be relative and cannot contain ".." or start with "/".');
          }
        } catch (error) {
          console.error('Validation error in commitToGitLab:', error);
          showModalError("gitlab-modal", "Validation Error", error.message);
          resetCommitButton();
          return;
        }

        try {
          const projectId = window.gitlabSettings.projectId;
          const gitlabToken = window.gitlabSettings.gitlabToken;
          const filePath = window.gitlabSettings.filePath || "src/variables.css";
          const strategy = window.gitlabSettings.strategy || "merge-request";
          const branchName =
            window.gitlabSettings.branchName || "feature/variables";

          const commitMessage =
            document.getElementById("commit-message").value.trim() ||
            "feat: update CSS variables";

          const createMergeRequest = strategy === "merge-request";
          let mrTitle = commitMessage;
          let mrDescription = "Updated CSS variables from Figma";
          let mrRemoveSourceBranch = true;
          let mrSquash = false;

          if (!currentCSSData) {
            try {
              const exportFormat = window.gitlabSettings?.exportFormat || "css";
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "export-css",
                    exportFormat: exportFormat,
                  },
                },
                "*"
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
                          type: "commit-to-gitlab",
                          gitlabUrl: window.gitlabSettings.gitlabUrl,
                          projectId,
                          gitlabToken,
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
                      "*"
                    );
                  } catch (postError) {
                    console.error('Error sending commit message to plugin:', postError);
                    showModalError("gitlab-modal", "Communication Error", "Failed to send commit request to plugin. Please try again.");
                    resetCommitButton();
                  }
                } else if (checkAttempts >= maxAttempts) {
                  clearInterval(checkCSSData);
                  showModalError("gitlab-modal", "Generation Timeout", "CSS generation timed out. Please try again.");
                  resetCommitButton();
                }
              }, 100);

            } catch (exportError) {
              console.error('Error requesting CSS export:', exportError);
              showModalError("gitlab-modal", "Export Error", "Failed to request CSS export. Please try again.");
              resetCommitButton();
            }
          } else {
            try {
              parent.postMessage(
                {
                  pluginMessage: {
                    type: "commit-to-gitlab",
                    gitlabUrl: window.gitlabSettings.gitlabUrl,
                    projectId,
                    gitlabToken,
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
                "*"
              );
            } catch (postError) {
              console.error('Error sending commit message to plugin:', postError);
              showModalError("gitlab-modal", "Communication Error", "Failed to send commit request to plugin. Please try again.");
              resetCommitButton();
            }
          }
        } catch (commitError) {
          console.error('Error in commit process:', commitError);
          showModalError("gitlab-modal", "Commit Error", commitError.message || "An unexpected error occurred during commit.");
          resetCommitButton();
        }
      }

      function loadUnitsSettings() {
        parent.postMessage(
          {
            pluginMessage: {
              type: "get-unit-settings",
            },
          },
          "*"
        );
      }

      function renderUnitsSettings(data) {
        const container = document.getElementById("units-settings-container");

        if (
          !data ||
          (data.collections.length === 0 && data.groups.length === 0)
        ) {
          container.innerHTML = '';
          const noItemsDiv = document.createElement('div');
          noItemsDiv.className = 'no-items';
          noItemsDiv.textContent = 'No collections or groups found for unit configuration.';
          container.appendChild(noItemsDiv);
          return;
        }

        let html = "";

        if (data.collections.length > 0) {
          html += `
            <div class="units-section">
              <h4>Collections</h4>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 16px;">Set default units for entire collections. These override global defaults.</p>
          `;

          data.collections.forEach((collection) => {
            html += `
              <div class="unit-setting-row">
                <div class="unit-setting-label">${collection.name}</div>
                <div class="unit-setting-control">
                  <span class="default-unit-label">Default: ${
                    collection.defaultUnit
                  }</span>
                  <select class="unit-dropdown" data-type="collection" data-name="${
                    collection.name
                  }">
                    ${AVAILABLE_UNITS.map(
                      (unit) =>
                        `<option value="${unit}" ${
                          unit === collection.currentUnit ? "selected" : ""
                        }>${unit === "" ? "Smart defaults" : unit}</option>`
                    ).join("")}
                  </select>
                </div>
              </div>
            `;
          });

          html += "</div>";
        }

        if (data.groups.length > 0) {
          html += `
            <div class="units-section">
              <h4>Groups</h4>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 16px;">Set specific units for variable groups. These override collection settings.</p>
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
                    <span class="default-unit-label">Default: ${
                      group.defaultUnit
                    }</span>
                    <select class="unit-dropdown" data-type="group" data-collection="${
                      group.collectionName
                    }" data-group="${group.groupName}">
                      ${AVAILABLE_UNITS.map(
                        (unit) =>
                          `<option value="${unit}" ${
                            unit === group.currentUnit ? "selected" : ""
                          }>${unit === "" ? "Smart defaults" : unit}</option>`
                      ).join("")}
                    </select>
                  </div>
                </div>
              `;
              });

              html += "</div>";
            });

          html += "</div>";
        }

        html += `
          <div class="units-section" style="background: rgba(139, 92, 246, 0.1); backdrop-filter: blur(10px); border: 1px solid rgba(139, 92, 246, 0.3);">
            <h4 style="color: white; margin-bottom: 16px;">📋 Smart Default Rules</h4>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 14px; margin-bottom: 16px;">
              When no custom unit is set, these rules determine the unit automatically based on variable names:
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Unitless Values</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">opacity</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">z-index</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">line-height</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">font-weight</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">flex</code> → <span style="color: #22c55e;">none</span></div>
                  <div><code style="color: #fbbf24;">order</code> → <span style="color: #22c55e;">none</span></div>
                </div>
              </div>
              
              <div>
                <h5 style="margin-bottom: 8px; color: #c4b5fd;">Default</h5>
                <div style="font-family: monospace; font-size: 12px; line-height: 1.4;">
                  <div><code style="color: #fbbf24;">everything else</code> → <span style="color: #a78bfa;">px</span></div>
                  <div style="color: rgba(255, 255, 255, 0.6); font-size: 11px; margin-top: 4px;">width, height, border, padding, margin, radius, gap, etc.</div>
                </div>
              </div>
            </div>
            
            <div style="margin-top: 16px; padding: 12px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(5px); border-radius: 10px; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 13px; color: rgba(255, 255, 255, 0.85);">
              <strong style="color: #c4b5fd;">Examples:</strong> 
              <code style="color: #fbbf24;">button-opacity</code> → <span style="color: #22c55e;">none</span>, 
              <code style="color: #fbbf24;">min-width-s</code> → <span style="color: #a78bfa;">px</span>, 
              <code style="color: #fbbf24;">border-radius</code> → <span style="color: #a78bfa;">px</span>, 
              <code style="color: #fbbf24;">gap-large</code> → <span style="color: #a78bfa;">px</span>
            </div>
          </div>
        `;

        container.innerHTML = SecurityUtils.sanitizeHTML(html);

        document.querySelectorAll(".unit-dropdown").forEach((dropdown) => {
          dropdown.addEventListener("change", function () {
            const saveButton = document.getElementById("save-units-button");
            if (saveButton) {
              saveButton.disabled = false;
            } else {
              console.error("Save button not found!");
            }
          });
        });
      }

      const commitRepoButton = document.getElementById("commit-repo-button");
      if (commitRepoButton) {
        commitRepoButton.addEventListener("click", openGitLabModal);
      }

      const createMRElement = document.getElementById("create-merge-request");
      if (createMRElement) {
        createMRElement.addEventListener("change", function () {
          const mergeRequestOptions = document.getElementById(
            "merge-request-options"
          );
          if (mergeRequestOptions) {
            if (this.checked) {
              mergeRequestOptions.style.display = "block";

              const commitMessage =
                document.getElementById("commit-message").value;
              const mrTitleElement = document.getElementById("mr-title");
              if (commitMessage && mrTitleElement) {
                mrTitleElement.value = commitMessage;
              }
            } else {
              mergeRequestOptions.style.display = "none";
            }
          }
        });
      }

      const commitMessageElement = document.getElementById("commit-message");
      if (commitMessageElement) {
        commitMessageElement.addEventListener("input", function () {
          const createMR = document.getElementById("create-merge-request");
          const mrTitleElement = document.getElementById("mr-title");
          if (createMR && createMR.checked && mrTitleElement) {
            mrTitleElement.value = this.value;
          }
        });
      }

      const configStrategyElement = document.getElementById("config-strategy");
      if (configStrategyElement) {
        configStrategyElement.addEventListener("change", function () {
          const branchSection = document.getElementById(
            "config-branch-section"
          );
          const testBranchSection = document.getElementById(
            "config-test-branch-section"
          );

          if (branchSection && testBranchSection) {
            const display = this.value === "merge-request" ? "block" : "none";
            branchSection.style.display = display;
            testBranchSection.style.display = display;
          }
        });
      }

      const configExportFormatElement = document.getElementById(
        "config-export-format"
      );
      if (configExportFormatElement) {
        configExportFormatElement.addEventListener("change", function () {
          if (window.gitlabSettings) {
            window.gitlabSettings.exportFormat = this.value;
          }
          updateExportButtonText();
        });
      }

      // Toggle collapsible subgroups
      function toggleSubgroup(groupId) {
        try {
          const content = document.getElementById(groupId + '-content');
          const header = document.querySelector(`#${groupId} .subgroup-header`);
          
          if (!content || !header) {
            console.log('Elements not found:', { groupId, content: !!content, header: !!header });
            return;
          }
          
          const isCollapsed = content.classList.contains('collapsed');
          
          if (isCollapsed) {
            // Expand
            content.classList.remove('collapsed');
            content.classList.add('expanded');
            header.classList.remove('collapsed');
          } else {
            // Collapse
            content.classList.remove('expanded');
            content.classList.add('collapsed');
            header.classList.add('collapsed');
          }
          
          console.log('Toggled group:', groupId, 'to', isCollapsed ? 'expanded' : 'collapsed');
        } catch (error) {
          console.error('Error toggling subgroup:', error);
        }
      }

      // Expand all groups function
      function expandAllGroups() {
        try {
          document.querySelectorAll('.subgroup-content').forEach(content => {
            content.classList.remove('collapsed');
            content.classList.add('expanded');
          });
          document.querySelectorAll('.subgroup-header').forEach(header => {
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
          document.querySelectorAll('.subgroup-content').forEach(content => {
            content.classList.remove('expanded');
            content.classList.add('collapsed');
          });
          document.querySelectorAll('.subgroup-header').forEach(header => {
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
