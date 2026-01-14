// ===== UTILS MODULE =====

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
          match.includes('handleFileUpload(') ||
          match.includes('switchToQualityTab(') ||
          match.includes('dismissFeedback(') ||
          match.includes('closeNotification(') ||
          match.includes('toggleCollection(') ||
          match.includes('expandAllSubgroups(') ||
          match.includes('collapseAllSubgroups(') ||
          match.includes('toggleSubgroup(') ||
          match.includes('clearSearch(') ||
          match.includes('scrollToVariable(') ||
          match.includes('toggleStatsSort(') || // Added
          match.includes('expandAllVariables(') ||
          match.includes('collapseAllVariables(') ||
          match.includes('toggleSearchBar(') ||
          match.includes('expandAllComponents(') ||
          match.includes('collapseAllComponents(') ||
          match.includes('toggleFeedback(') ||
          match.includes('toggleQualityBreakdown(') // Added
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

// ===== HELPER FUNCTIONS =====

function getScoreColor(score) {
  if (!score && score !== 0) return '#22c55e'; // Default to green
  // Smooth gradient from red (0) → yellow (50) → green (100) using HSL
  const hue = Math.min(120, Math.max(0, (score / 100) * 120));
  return `hsl(${hue}, 70%, 50%)`;
}

function buildGitLabApiUrl(gitlabUrl) {
  if (!gitlabUrl) return 'https://gitlab.com/api/v4';
  const cleanUrl = gitlabUrl.replace(/\/+$/, '');
  if (cleanUrl.endsWith('/api/v4')) {
    return cleanUrl;
  }
  return `${cleanUrl}/api/v4`;
}

function buildGitLabWebUrl(gitlabUrl) {
  if (!gitlabUrl) return 'https://gitlab.com';
  const cleanUrl = gitlabUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');
  return cleanUrl;
}

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
