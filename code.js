"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/config/constants.js
  var require_constants = __commonJS({
    "dist/config/constants.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.GIT_CONFIG = exports.buildGitLabWebUrl = exports.buildGitLabApiUrl = exports.API_CONFIG = void 0;
      exports.API_CONFIG = {
        DEFAULT_GITLAB_URL: "https://gitlab.com",
        // Default to GitLab.com
        DEFAULT_GITLAB_BASE_URL: "https://gitlab.com/api/v4",
        // Default API URL
        REQUEST_TIMEOUT: 3e4,
        DEFAULT_HEADERS: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      };
      var buildGitLabApiUrl = (gitlabUrl) => {
        if (!gitlabUrl)
          return exports.API_CONFIG.DEFAULT_GITLAB_BASE_URL;
        const cleanUrl = gitlabUrl.replace(/\/+$/, "");
        if (cleanUrl.endsWith("/api/v4")) {
          return cleanUrl;
        }
        return `${cleanUrl}/api/v4`;
      };
      exports.buildGitLabApiUrl = buildGitLabApiUrl;
      var buildGitLabWebUrl = (gitlabUrl) => {
        if (!gitlabUrl)
          return exports.API_CONFIG.DEFAULT_GITLAB_URL;
        const cleanUrl = gitlabUrl.replace(/\/+$/, "").replace(/\/api\/v4$/, "");
        return cleanUrl;
      };
      exports.buildGitLabWebUrl = buildGitLabWebUrl;
      exports.GIT_CONFIG = {
        DEFAULT_BRANCH: "feature/variables",
        DEFAULT_TEST_BRANCH: "feature/component-tests",
        DEFAULT_COMMIT_PATTERNS: {
          variables: "Update CSS variables from Figma",
          tests: "Add component test for {componentName}"
        }
      };
    }
  });

  // dist/config/css.js
  var require_css = __commonJS({
    "dist/config/css.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CSS_PROPERTIES = exports.CSS_UNITS = void 0;
      exports.CSS_UNITS = {
        AVAILABLE: [
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
          "none"
        ],
        DEFAULT: "px",
        // Improved Smart Default Patterns
        UNITLESS_PATTERNS: [
          // Core unitless properties
          "opacity",
          "z-index",
          "line-height",
          "font-weight",
          "flex",
          "order",
          // Grid & Flexbox unitless
          "flex-grow",
          "flexgrow",
          "flex-shrink",
          "flexshrink",
          "grid-column",
          "gridcolumn",
          "grid-row",
          "gridrow",
          "grid-area",
          "gridarea",
          "column-count",
          "columncount",
          // Animation & Transform unitless
          "animation-iteration-count",
          "animationiterationcount",
          "scale",
          "rotate",
          // Other unitless properties
          "aspect-ratio",
          "aspectratio",
          "tab-size",
          "tabsize",
          "zoom",
          "counter-reset",
          "counterreset"
        ],
        // Typography units (prefer rem/em)
        TYPOGRAPHY_PATTERNS: [
          "font-size",
          "fontsize",
          "size",
          "text",
          "letter-spacing",
          "letterspacing",
          "word-spacing",
          "wordspacing",
          "text-indent",
          "textindent"
        ],
        // Relative sizing (prefer %)
        RELATIVE_PATTERNS: [
          "width",
          "height",
          "top",
          "right",
          "bottom",
          "left",
          "inset"
        ],
        // Viewport units (prefer vw/vh)
        VIEWPORT_PATTERNS: [
          "viewport",
          "screen",
          "full-width",
          "fullwidth",
          "full-height",
          "fullheight",
          "container-width",
          "containerwidth",
          "breakpoint"
        ],
        // Border radius (prefer px for small values, % for large)
        BORDER_RADIUS_PATTERNS: [
          "radius",
          "rounded",
          "corner",
          "border-radius",
          "borderradius"
        ],
        // Spacing (prefer rem for consistency)
        SPACING_PATTERNS: [
          "margin",
          "padding",
          "gap",
          "space",
          "spacing",
          "gutter",
          "offset",
          "indent"
        ]
      };
      exports.CSS_PROPERTIES = {
        // Simple color properties (direct color values)
        SIMPLE_COLORS: [
          "accentColor",
          "backgroundColor",
          "borderColor",
          "borderTopColor",
          "borderRightColor",
          "borderBottomColor",
          "borderLeftColor",
          "borderBlockStartColor",
          "borderBlockEndColor",
          "borderInlineStartColor",
          "borderInlineEndColor",
          "caretColor",
          "color",
          "columnRuleColor",
          "fill",
          "floodColor",
          "lightingColor",
          "outlineColor",
          "scrollbarColor",
          "stopColor",
          "stroke",
          "textDecorationColor",
          "textEmphasisColor",
          "textShadowColor",
          "webkitTapHighlightColor",
          "webkitTextFillColor",
          "webkitTextStrokeColor"
        ],
        // Complex color properties (may contain multiple values including colors)
        COMPLEX_COLORS: [
          "background",
          "border",
          "borderTop",
          "borderRight",
          "borderBottom",
          "borderLeft",
          "outline",
          "boxShadow",
          "textShadow",
          "filter"
        ],
        // Layout properties (often structural, not styling)
        LAYOUT: [
          "justifyContent",
          "alignItems",
          "display",
          "flexDirection",
          "position"
        ],
        // Interactive properties (change on hover/focus/active)
        INTERACTIVE: [
          "background-color",
          "backgroundColor",
          "color",
          "border-color",
          "borderColor",
          "box-shadow",
          "boxShadow",
          "opacity",
          "transform",
          "filter",
          "outline",
          "text-decoration-color",
          "textDecorationColor",
          "border-width",
          "borderWidth",
          "padding",
          "margin",
          "font-weight",
          "fontWeight",
          "letter-spacing",
          "letterSpacing",
          "text-shadow",
          "textShadow",
          "border-radius",
          "borderRadius",
          "outline-color",
          "outlineColor",
          "outline-width",
          "outlineWidth",
          "outline-style",
          "outlineStyle",
          "cursor",
          "transition",
          "animation"
        ],
        // Static properties (don't typically change on interaction)
        STATIC: [
          "width",
          "height",
          "min-width",
          "minWidth",
          "min-height",
          "minHeight",
          "max-width",
          "maxWidth",
          "max-height",
          "maxHeight",
          "font-family",
          "fontFamily",
          "font-size",
          "fontSize",
          "line-height",
          "lineHeight",
          "text-align",
          "textAlign",
          "vertical-align",
          "verticalAlign",
          "white-space",
          "whiteSpace",
          "word-wrap",
          "wordWrap",
          "word-break",
          "wordBreak",
          "overflow",
          "overflow-x",
          "overflowX",
          "overflow-y",
          "overflowY",
          "z-index",
          "zIndex",
          "flex-grow",
          "flexGrow",
          "flex-shrink",
          "flexShrink",
          "flex-basis",
          "flexBasis",
          "order",
          "grid-column",
          "gridColumn",
          "grid-row",
          "gridRow",
          "grid-area",
          "gridArea"
        ]
      };
    }
  });

  // dist/config/testing.js
  var require_testing = __commonJS({
    "dist/config/testing.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PATTERNS = exports.TEST_CONFIG = void 0;
      exports.TEST_CONFIG = {
        STATE_SPECIFIC_PROPERTIES: {
          hover: [
            "background-color",
            "backgroundColor",
            "color",
            "border-color",
            "borderColor",
            "box-shadow",
            "boxShadow",
            "opacity",
            "transform"
          ],
          active: [
            "background-color",
            "backgroundColor",
            "color",
            "border-color",
            "borderColor",
            "box-shadow",
            "boxShadow",
            "transform"
          ],
          focus: [
            "outline",
            "outline-color",
            "outlineColor",
            "outline-width",
            "outlineWidth",
            "outline-style",
            "outlineStyle",
            "box-shadow",
            "boxShadow"
          ],
          disabled: [
            "opacity",
            "cursor",
            "background-color",
            "backgroundColor",
            "color",
            "border-color",
            "borderColor"
          ]
        }
      };
      exports.PATTERNS = {
        HEX_COLOR: {
          SHORT: /^#[0-9A-Fa-f]{3}$/,
          LONG: /^#[0-9A-Fa-f]{6}$/,
          BOTH: /^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/,
          INLINE: /#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g
        },
        CSS_VARIABLE: {
          FALLBACK: /var\([^,]+,\s*([^)]+)\)/g,
          REFERENCE: /var\((--.+?)\)/,
          STRIP_FALLBACK: /var\([^,]+,\s*([^\)]+)\)/g
        },
        COMPONENT_NAME: {
          STATE: /State=([^,]+)/i,
          VARIANT: /Variant=([^,]+)/i,
          PROPERTY: /Property\s*\d*\s*=\s*([^,]+)/i,
          TYPE: /Type=([^,]+)/i
        },
        CAMEL_TO_KEBAB: /([A-Z])/g,
        KEBAB_TO_CAMEL: /-([a-z])/g,
        COMPONENT_SANITIZE: /[^a-z0-9]+/g,
        WHITESPACE_NORMALIZE: /\s+/g
      };
    }
  });

  // dist/config/messages.js
  var require_messages = __commonJS({
    "dist/config/messages.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = void 0;
      exports.ERROR_MESSAGES = {
        // General validation errors
        INVALID_SETTINGS: "Invalid settings provided",
        MISSING_COMPONENT: "Component with ID {id} not found",
        MISSING_FIELDS: "Missing required fields for {action}",
        // GitLab specific errors
        GITLAB_AUTH: "GitLab authentication failed",
        GITLAB_AUTH_TOKEN: "GitLab token is required",
        GITLAB_PROJECT_NOT_FOUND: "Resource not found while trying to {operation}. Please check your project ID.",
        GITLAB_INVALID_DATA: "Invalid data provided while trying to {operation}. Please check your inputs.",
        GITLAB_RATE_LIMIT: "Rate limit exceeded while trying to {operation}. Please try again later.",
        GITLAB_SERVER_ERROR: "GitLab server error while trying to {operation}. Please try again later.",
        GITLAB_BRANCH_EXISTS: "Branch already exists",
        // Network errors
        NETWORK_ERROR: "Network error while communicating with GitLab",
        NETWORK_FETCH: "Network error - unable to connect to GitLab API",
        // Parse errors  
        PARSE_ERROR: "Error parsing {type}: {error}",
        PARSE_SETTINGS: "Error parsing document settings",
        PARSE_METADATA: "Error parsing settings metadata",
        // Component validation
        COMPONENT_NAME_REQUIRED: "Component name is required",
        COMPONENT_CONTENT_REQUIRED: "Test content is required",
        PROJECT_ID_REQUIRED: "Project ID is required",
        COMMIT_MESSAGE_REQUIRED: "Commit message is required",
        FILE_PATH_REQUIRED: "File path is required",
        CSS_DATA_REQUIRED: "CSS data is required",
        // File operations
        FILE_NOT_FOUND: "File not found at path: {path}",
        SAVE_SETTINGS_ERROR: "Error saving GitLab settings: {error}",
        RESET_SETTINGS_ERROR: "Error resetting GitLab settings: {error}",
        SAVE_UNIT_SETTINGS_ERROR: "Error saving unit settings",
        LOAD_UNIT_SETTINGS_ERROR: "Error loading unit settings",
        RESET_UNIT_SETTINGS_ERROR: "Error resetting unit settings",
        // Generic fallbacks
        UNKNOWN_ERROR: "Unknown error",
        OPERATION_FAILED: "Failed to {operation}: {error}"
      };
      exports.SUCCESS_MESSAGES = {
        COMMIT_SUCCESS: "Design tokens successfully committed! Your CSS variables are now ready for development.",
        TEST_COMMIT_SUCCESS: "Component test successfully committed! The generated test is ready for your review.",
        SETTINGS_SAVED: "GitLab settings saved and ready to use!",
        EXPORT_COMPLETE: "Files exported successfully! You can now use them in your project.",
        BRANCH_CREATED: "Feature branch created! Your changes are isolated and ready for review.",
        MERGE_REQUEST_CREATED: "Merge request created! Your team can now review and merge the changes.",
        UNIT_SETTINGS_SAVED: "CSS unit preferences saved and applied to all exports!",
        UNIT_SETTINGS_RESET: "Unit settings reset to smart defaults!"
      };
    }
  });

  // dist/services/loggingService.js
  var require_loggingService = __commonJS({
    "dist/services/loggingService.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.LoggingService = exports.LogLevel = void 0;
      var LogLevel;
      (function(LogLevel2) {
        LogLevel2[LogLevel2["DEBUG"] = 0] = "DEBUG";
        LogLevel2[LogLevel2["INFO"] = 1] = "INFO";
        LogLevel2[LogLevel2["WARN"] = 2] = "WARN";
        LogLevel2[LogLevel2["ERROR"] = 3] = "ERROR";
      })(LogLevel || (exports.LogLevel = LogLevel = {}));
      var LoggingService = class {
        /**
         * Set the current logging level
         */
        static setLogLevel(level) {
          this.currentLevel = level;
        }
        // TODO: is this method used anywhere?
        /**
         * Get the current logging level
         */
        static getLogLevel() {
          return this.currentLevel;
        }
        /**
         * Check if a log level should be output
         */
        static shouldLog(level) {
          return level >= this.currentLevel;
        }
        /**
         * Add a log entry to the internal log storage
         */
        static addLogEntry(level, message, data, category) {
          const entry = {
            level,
            message,
            data,
            timestamp: /* @__PURE__ */ new Date(),
            category
          };
          this.logs.push(entry);
          if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
          }
        }
        /**
         * Debug level logging
         */
        static debug(message, data, category) {
          if (!this.shouldLog(LogLevel.DEBUG))
            return;
          this.addLogEntry(LogLevel.DEBUG, message, data, category);
          console.debug(`[DEBUG]${category ? ` [${category}]` : ""} ${message}`, data || "");
        }
        // TODO: is this method used anywhere?
        /**
         * Info level logging
         */
        static info(message, data, category) {
          if (!this.shouldLog(LogLevel.INFO))
            return;
          this.addLogEntry(LogLevel.INFO, message, data, category);
          console.info(`[INFO]${category ? ` [${category}]` : ""} ${message}`, data || "");
        }
        /**
         * Warning level logging
         */
        static warn(message, data, category) {
          if (!this.shouldLog(LogLevel.WARN))
            return;
          this.addLogEntry(LogLevel.WARN, message, data, category);
          console.warn(`[WARN]${category ? ` [${category}]` : ""} ${message}`, data || "");
        }
        /**
         * Error level logging
         */
        static error(message, error, category) {
          if (!this.shouldLog(LogLevel.ERROR))
            return;
          this.addLogEntry(LogLevel.ERROR, message, error, category);
          console.error(`[ERROR]${category ? ` [${category}]` : ""} ${message}`, error || "");
        }
        // TODO: all the methods below seem not used anywhere
        /**
         * Get all log entries
         */
        static getLogs() {
          return [...this.logs];
        }
        /**
         * Get log entries by level
         */
        static getLogsByLevel(level) {
          return this.logs.filter((log) => log.level === level);
        }
        /**
         * Get log entries by category
         */
        static getLogsByCategory(category) {
          return this.logs.filter((log) => log.category === category);
        }
        /**
         * Clear all log entries
         */
        static clearLogs() {
          this.logs = [];
        }
        /**
         * Get log summary (counts by level)
         */
        static getLogsSummary() {
          const summary = {
            debug: 0,
            info: 0,
            warn: 0,
            error: 0
          };
          this.logs.forEach((log) => {
            switch (log.level) {
              case LogLevel.DEBUG:
                summary.debug++;
                break;
              case LogLevel.INFO:
                summary.info++;
                break;
              case LogLevel.WARN:
                summary.warn++;
                break;
              case LogLevel.ERROR:
                summary.error++;
                break;
            }
          });
          return summary;
        }
        /**
         * Export logs as JSON string
         */
        static exportLogs() {
          return JSON.stringify(this.logs, null, 2);
        }
        /**
         * Format log entry for display
         */
        static formatLogEntry(entry) {
          const timestamp = entry.timestamp.toISOString();
          const level = LogLevel[entry.level];
          const category = entry.category ? ` [${entry.category}]` : "";
          const data = entry.data ? ` | ${JSON.stringify(entry.data)}` : "";
          return `${timestamp} [${level}]${category} ${entry.message}${data}`;
        }
        /**
         * Performance timing helper
         */
        static time(label, category) {
          const start = performance.now();
          this.debug(`Timer started: ${label}`, void 0, category);
          return () => {
            const duration = performance.now() - start;
            this.debug(`Timer finished: ${label} (${duration.toFixed(2)}ms)`, { duration }, category);
          };
        }
        /**
         * Log with performance measurement
         */
        static withTiming(operation, label, category) {
          const endTimer = this.time(label, category);
          try {
            const result = operation();
            endTimer();
            return result;
          } catch (error) {
            endTimer();
            this.error(`Error in ${label}:`, error, category);
            throw error;
          }
        }
        /**
         * Log with performance measurement for async operations
         */
        static withTimingAsync(operation, label, category) {
          return __awaiter(this, void 0, void 0, function* () {
            const endTimer = this.time(label, category);
            try {
              const result = yield operation();
              endTimer();
              return result;
            } catch (error) {
              endTimer();
              this.error(`Error in ${label}:`, error, category);
              throw error;
            }
          });
        }
      };
      exports.LoggingService = LoggingService;
      LoggingService.currentLevel = LogLevel.INFO;
      LoggingService.logs = [];
      LoggingService.maxLogs = 1e3;
      LoggingService.CATEGORIES = {
        COMPONENT: "Component",
        GITLAB: "GitLab",
        CSS_EXPORT: "CSS Export",
        UNITS: "Units",
        UI: "UI",
        CORE: "Core",
        TESTING: "Testing"
      };
    }
  });

  // dist/config/index.js
  var require_config = __commonJS({
    "dist/config/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      } : function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      });
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_constants(), exports);
      __exportStar(require_css(), exports);
      __exportStar(require_testing(), exports);
      __exportStar(require_messages(), exports);
      __exportStar(require_loggingService(), exports);
    }
  });

  // dist/utils/securityUtils.js
  var require_securityUtils = __commonJS({
    "dist/utils/securityUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SecurityUtils = void 0;
      var SecurityUtils = class {
        /**
         * Sanitize HTML content to prevent XSS attacks
         * @param htmlString Raw HTML string
         * @returns Sanitized HTML string
         */
        static sanitizeHTML(htmlString) {
          if (typeof htmlString !== "string") {
            return "";
          }
          let sanitized = htmlString.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "").replace(/on\w+\s*=\s*["'][^"']*["']/gi, "").replace(/on\w+\s*=\s*[^>\s]+/gi, "").replace(/javascript:/gi, "").replace(/vbscript:/gi, "").replace(/data:/gi, "");
          const allowedTags = [
            "p",
            "br",
            "strong",
            "em",
            "b",
            "i",
            "u",
            "span",
            "div",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "ul",
            "ol",
            "li",
            "code",
            "pre",
            "blockquote",
            "select",
            "option",
            "button",
            "svg",
            "path",
            "circle"
          ];
          sanitized = sanitized.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (match, tagName) => {
            const lowerTagName = tagName.toLowerCase();
            return allowedTags.indexOf(lowerTagName) !== -1 ? match : "";
          });
          return sanitized;
        }
        /**
         * Create safe DOM element with text content (prevents XSS)
         * @param tagName HTML tag name
         * @param textContent Safe text content
         * @param className Optional CSS class
         * @returns HTML string
         */
        static createSafeElement(tagName, textContent, className) {
          const escapedText = this.escapeHTML(textContent);
          const classAttr = className ? ` class="${this.escapeHTML(className)}"` : "";
          return `<${tagName}${classAttr}>${escapedText}</${tagName}>`;
        }
        /**
         * Escape HTML entities to prevent XSS
         * @param text Raw text
         * @returns Escaped text
         */
        static escapeHTML(text) {
          if (typeof text !== "string") {
            return "";
          }
          const htmlEscapes = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "/": "&#x2F;"
          };
          return text.replace(/[&<>"'/]/g, (match) => htmlEscapes[match]);
        }
        /**
         * Validate and sanitize user input
         * @param input User input
         * @param maxLength Maximum allowed length
         * @returns Sanitized input
         */
        static sanitizeInput(input, maxLength = 1e3) {
          if (typeof input !== "string") {
            return "";
          }
          let sanitized = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").replace(/\s+/g, " ").trim();
          if (sanitized.length > maxLength) {
            sanitized = sanitized.substring(0, maxLength);
          }
          return sanitized;
        }
        /**
         * Validate GitLab URL format
         * @param url GitLab URL
         * @returns true if valid GitLab URL
         */
        static isValidGitLabURL(url) {
          if (typeof url !== "string") {
            return false;
          }
          try {
            const parsedUrl = new URL(url);
            if (parsedUrl.protocol !== "https:") {
              return false;
            }
            const gitlabPatterns = [
              /^gitlab\.com$/,
              /^.*\.gitlab\.com$/,
              /^.*\.gitlab\.io$/,
              /gitlab/i
              // Allow custom GitLab instances with "gitlab" in domain
            ];
            return gitlabPatterns.some((pattern) => pattern.test(parsedUrl.hostname));
          } catch (_a) {
            return false;
          }
        }
        static checkRateLimit(key, maxRequests = 10, windowMs = 6e4) {
          const now = Date.now();
          const windowStart = now - windowMs;
          const current = this.rateLimitCache.get(key);
          if (!current || current.resetTime < windowStart) {
            this.rateLimitCache.set(key, { count: 1, resetTime: now });
            return true;
          }
          if (current.count >= maxRequests) {
            return false;
          }
          current.count++;
          return true;
        }
        /**
         * Simple encryption for sensitive data storage
         * @param data Data to encrypt
         * @param key Encryption key
         * @returns Encrypted string
         */
        static encryptData(data, key) {
          if (typeof data !== "string" || typeof key !== "string") {
            throw new Error("Data and key must be strings");
          }
          const keyBytes = new TextEncoder().encode(key);
          const dataBytes = new TextEncoder().encode(data);
          const encrypted = new Uint8Array(dataBytes.length);
          for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
          }
          return btoa(String.fromCharCode(...encrypted));
        }
        /**
         * Decrypt data encrypted with encryptData
         * @param encryptedData Encrypted data string
         * @param key Decryption key
         * @returns Decrypted string
         */
        static decryptData(encryptedData, key) {
          if (typeof encryptedData !== "string" || typeof key !== "string") {
            throw new Error("Encrypted data and key must be strings");
          }
          try {
            const encrypted = new Uint8Array(atob(encryptedData).split("").map((char) => char.charCodeAt(0)));
            const keyBytes = new TextEncoder().encode(key);
            const decrypted = new Uint8Array(encrypted.length);
            for (let i = 0; i < encrypted.length; i++) {
              decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
            }
            return new TextDecoder().decode(decrypted);
          } catch (error) {
            throw new Error("Failed to decrypt data - invalid format or key");
          }
        }
        /**
         * Generate a simple key for encryption based on session/user
         * @returns Encryption key
         */
        static generateEncryptionKey() {
          var _a, _b;
          const fileId = ((_b = (_a = globalThis.figma) === null || _a === void 0 ? void 0 : _a.root) === null || _b === void 0 ? void 0 : _b.id) || "default";
          const userAgent = navigator.userAgent;
          const timestamp = Math.floor(Date.now() / (1e3 * 60 * 60 * 24));
          return btoa(`${fileId}:${userAgent.slice(0, 20)}:${timestamp}`).slice(0, 32);
        }
      };
      exports.SecurityUtils = SecurityUtils;
      SecurityUtils.rateLimitCache = /* @__PURE__ */ new Map();
    }
  });

  // dist/utils/errorHandler.js
  var require_errorHandler = __commonJS({
    "dist/utils/errorHandler.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ErrorHandler = void 0;
      var ErrorHandler = class {
        /**
         * Handle and log errors with context
         */
        static handleError(error, context) {
          const fullContext = {
            operation: context.operation || "unknown",
            component: context.component || "unknown",
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            severity: context.severity || "medium"
          };
          this.errorLog.push({ error, context: fullContext });
          if (this.errorLog.length > this.MAX_ERROR_LOG_SIZE) {
            this.errorLog.shift();
          }
          switch (fullContext.severity) {
            case "critical":
              console.error("CRITICAL ERROR:", error.message, fullContext);
              break;
            case "high":
              console.error("HIGH SEVERITY:", error.message, fullContext);
              break;
            case "medium":
              console.warn("MEDIUM SEVERITY:", error.message, fullContext);
              break;
            case "low":
              console.log("LOW SEVERITY:", error.message, fullContext);
              break;
          }
        }
        /**
         * Create user-friendly error message
         */
        static getUserFriendlyMessage(error, operation) {
          const errorLower = error.message.toLowerCase();
          if (errorLower.includes("network") || errorLower.includes("fetch")) {
            return `Unable to connect to GitLab. Please check your internet connection and GitLab server status.`;
          }
          if (errorLower.includes("unauthorized") || errorLower.includes("401") || errorLower.includes("403")) {
            return `Authentication failed. Please check your GitLab token and permissions in Settings.`;
          }
          if (errorLower.includes("invalid") || errorLower.includes("validation")) {
            return `Invalid input: ${error.message}`;
          }
          if (errorLower.includes("rate limit") || errorLower.includes("429")) {
            return `Too many requests. Please wait a moment and try again.`;
          }
          if (operation.includes("export") || operation.includes("generate")) {
            return `Failed to ${operation}. Please try again or contact support if the issue persists.`;
          }
          return `An error occurred during ${operation}. Please try again.`;
        }
        /**
         * Wrap async operations with error handling
         */
        static withErrorHandling(operation, context) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              return yield operation();
            } catch (error) {
              this.handleError(error, context);
              throw error;
            }
          });
        }
        /**
         * Sanitize error for UI display (remove sensitive info)
         */
        static sanitizeErrorForUI(error) {
          let message = this.getUserFriendlyMessage(error, "operation");
          message = message.replace(/token[=:]\s*[a-zA-Z0-9_-]+/gi, "token=***").replace(/password[=:]\s*[^\s]+/gi, "password=***").replace(/key[=:]\s*[a-zA-Z0-9_-]+/gi, "key=***");
          return {
            message,
            type: error.name || "Error"
          };
        }
        /**
         * Get error statistics for monitoring
         */
        static getErrorStats() {
          const bySeverity = this.errorLog.reduce((acc, { context }) => {
            acc[context.severity] = (acc[context.severity] || 0) + 1;
            return acc;
          }, {});
          const recent = this.errorLog.slice(-10).map(({ context }) => ({
            operation: context.operation,
            timestamp: context.timestamp,
            severity: context.severity
          }));
          return {
            total: this.errorLog.length,
            bySeverity,
            recent
          };
        }
        /**
         * Clear error log
         */
        static clearErrorLog() {
          this.errorLog = [];
        }
        /**
         * Show user-friendly error message in UI
         */
        static showUserError(error, operation) {
          const userMessage = this.getUserFriendlyMessage(error, operation);
          if (typeof figma !== "undefined" && figma.ui) {
            try {
              figma.ui.postMessage({
                type: "show-error",
                title: "Operation Failed",
                message: userMessage,
                operation
              });
            } catch (uiError) {
              console.error("Failed to show UI error:", uiError);
            }
          }
          this.handleError(error, {
            operation,
            component: "UI",
            severity: "high"
          });
        }
        /**
         * Show success message in UI
         */
        static showUserSuccess(message, operation) {
          if (typeof figma !== "undefined" && figma.ui) {
            try {
              figma.ui.postMessage({
                type: "show-success",
                title: "Success",
                message,
                operation
              });
            } catch (uiError) {
              console.error("Failed to show UI success:", uiError);
            }
          }
        }
        /**
         * Wrap async operations with comprehensive error handling and UI feedback
         */
        static withErrorHandlingAndUI(operation_1, context_1) {
          return __awaiter(this, arguments, void 0, function* (operation, context, showUIFeedback = true) {
            try {
              const result = yield operation();
              if (showUIFeedback && context.operation) {
                this.showUserSuccess(`${context.operation} completed successfully`, context.operation);
              }
              return result;
            } catch (error) {
              this.handleError(error, context);
              if (showUIFeedback && context.operation) {
                this.showUserError(error, context.operation);
              }
              throw error;
            }
          });
        }
        /**
         * Validate and sanitize user input to prevent errors
         */
        static validateInput(input, fieldName, rules) {
          if (rules.required && (input === null || input === void 0 || input === "")) {
            return { isValid: false, error: `${fieldName} is required` };
          }
          if (input === null || input === void 0 || input === "") {
            return { isValid: true };
          }
          const inputStr = String(input);
          if (rules.minLength && inputStr.length < rules.minLength) {
            return { isValid: false, error: `${fieldName} must be at least ${rules.minLength} characters` };
          }
          if (rules.maxLength && inputStr.length > rules.maxLength) {
            return { isValid: false, error: `${fieldName} must be no more than ${rules.maxLength} characters` };
          }
          if (rules.pattern && !rules.pattern.test(inputStr)) {
            return { isValid: false, error: `${fieldName} format is invalid` };
          }
          if (rules.type) {
            switch (rules.type) {
              case "number":
                if (isNaN(Number(input))) {
                  return { isValid: false, error: `${fieldName} must be a valid number` };
                }
                break;
              case "email":
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(inputStr)) {
                  return { isValid: false, error: `${fieldName} must be a valid email address` };
                }
                break;
              case "url":
                try {
                  new URL(inputStr);
                } catch (_a) {
                  return { isValid: false, error: `${fieldName} must be a valid URL` };
                }
                break;
            }
          }
          return { isValid: true };
        }
      };
      exports.ErrorHandler = ErrorHandler;
      ErrorHandler.errorLog = [];
      ErrorHandler.MAX_ERROR_LOG_SIZE = 100;
    }
  });

  // dist/services/gitlabService.js
  var require_gitlabService = __commonJS({
    "dist/services/gitlabService.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.GitLabNetworkError = exports.GitLabAuthError = exports.GitLabAPIError = exports.GitLabService = void 0;
      var config_1 = require_config();
      var securityUtils_1 = require_securityUtils();
      var errorHandler_1 = require_errorHandler();
      var DEFAULT_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_BRANCH;
      var DEFAULT_TEST_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_TEST_BRANCH;
      var GitLabAPIError = class extends Error {
        constructor(message, statusCode, response) {
          super(message);
          this.response = response;
          this.name = "GitLabAPIError";
          this.statusCode = statusCode;
        }
      };
      exports.GitLabAPIError = GitLabAPIError;
      var GitLabAuthError = class extends Error {
        constructor(message = config_1.ERROR_MESSAGES.GITLAB_AUTH) {
          super(message);
          this.name = "GitLabAuthError";
        }
      };
      exports.GitLabAuthError = GitLabAuthError;
      var GitLabNetworkError = class extends Error {
        constructor(message = config_1.ERROR_MESSAGES.NETWORK_ERROR) {
          super(message);
          this.name = "GitLabNetworkError";
        }
      };
      exports.GitLabNetworkError = GitLabNetworkError;
      var GitLabService = class {
        /**
         * Get the GitLab API base URL from settings
         */
        static getGitLabApiBase(settings) {
          return (0, config_1.buildGitLabApiUrl)(settings.gitlabUrl);
        }
        /**
         * Get the GitLab web URL from settings
         */
        static getGitLabWebBase(settings) {
          return (0, config_1.buildGitLabWebUrl)(settings.gitlabUrl);
        }
        /**
         * Save GitLab settings to Figma storage
         */
        static saveSettings(settings, shareWithTeam) {
          return __awaiter(this, void 0, void 0, function* () {
            if (!settings || typeof settings !== "object") {
              throw new Error(config_1.ERROR_MESSAGES.INVALID_SETTINGS);
            }
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              if (!shareWithTeam) {
                yield figma.clientStorage.setAsync(settingsKey, settings);
              } else {
                const settingsToSave = Object.assign({}, settings);
                if (!settings.saveToken) {
                  delete settingsToSave.gitlabToken;
                }
                figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(settingsToSave));
                if (settings.saveToken && settings.gitlabToken) {
                  try {
                    const encryptionKey = securityUtils_1.SecurityUtils.generateEncryptionKey();
                    const encryptedToken = securityUtils_1.SecurityUtils.encryptData(settings.gitlabToken, encryptionKey);
                    yield figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
                    yield figma.clientStorage.setAsync(`${settingsKey}-key`, encryptionKey);
                  } catch (error) {
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: "encrypt_token",
                      component: "GitLabService",
                      severity: "high"
                    });
                    yield figma.clientStorage.setAsync(`${settingsKey}-token`, settings.gitlabToken);
                  }
                }
              }
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, JSON.stringify({
                sharedWithTeam: shareWithTeam,
                savedAt: settings.savedAt,
                savedBy: settings.savedBy
              }));
            } catch (error) {
              config_1.LoggingService.error("Error saving GitLab settings", error, config_1.LoggingService.CATEGORIES.GITLAB);
              throw new GitLabAPIError(`Error saving GitLab settings: ${error.message || "Unknown error"}`, void 0, error);
            }
          });
        }
        /**
         * Load GitLab settings from Figma storage
         */
        static loadSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              const documentSettings = yield this.loadDocumentSettings(settingsKey);
              if (documentSettings)
                return documentSettings;
              const personalSettings = yield this.loadPersonalSettings(settingsKey);
              if (personalSettings)
                return personalSettings;
              const legacySettings = yield this.loadLegacySettings();
              if (legacySettings)
                return legacySettings;
              return null;
            } catch (error) {
              config_1.LoggingService.error("Error loading GitLab settings", error, config_1.LoggingService.CATEGORIES.GITLAB);
              return null;
            }
          });
        }
        /**
         * Load shared document settings with personal token
         */
        static loadDocumentSettings(settingsKey) {
          return __awaiter(this, void 0, void 0, function* () {
            const documentSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
            if (!documentSettings)
              return null;
            try {
              const settings = JSON.parse(documentSettings);
              if (settings.saveToken && !settings.gitlabToken) {
                const encryptedToken = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
                const encryptionKey = yield figma.clientStorage.getAsync(`${settingsKey}-key`);
                if (encryptedToken && encryptionKey) {
                  try {
                    const decryptedToken = securityUtils_1.SecurityUtils.decryptData(encryptedToken, encryptionKey);
                    settings.gitlabToken = decryptedToken;
                  } catch (error) {
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: "decrypt_token",
                      component: "GitLabService",
                      severity: "medium"
                    });
                    settings.gitlabToken = encryptedToken;
                  }
                } else if (encryptedToken) {
                  settings.gitlabToken = encryptedToken;
                }
              }
              const metaData = figma.root.getSharedPluginData("Bridgy", `${settingsKey}-meta`);
              if (metaData) {
                try {
                  const meta = JSON.parse(metaData);
                  settings.isPersonal = !meta.sharedWithTeam;
                } catch (metaParseError) {
                  console.warn("Error parsing settings metadata:", metaParseError);
                }
              }
              return settings;
            } catch (parseError) {
              config_1.LoggingService.error("Error parsing document settings", parseError, config_1.LoggingService.CATEGORIES.GITLAB);
              return null;
            }
          });
        }
        /**
         * Load personal client storage settings
         */
        static loadPersonalSettings(settingsKey) {
          return __awaiter(this, void 0, void 0, function* () {
            const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
            if (personalSettings) {
              return Object.assign({}, personalSettings, { isPersonal: true });
            }
            return null;
          });
        }
        /**
         * Load and migrate legacy settings
         */
        static loadLegacySettings() {
          return __awaiter(this, void 0, void 0, function* () {
            const legacyDocumentSettings = figma.root.getSharedPluginData("Bridgy", "gitlab-settings");
            if (!legacyDocumentSettings)
              return null;
            try {
              const settings = JSON.parse(legacyDocumentSettings);
              yield this.saveSettings(settings, true);
              figma.root.setSharedPluginData("Bridgy", "gitlab-settings", "");
              return settings;
            } catch (parseError) {
              config_1.LoggingService.error("Error parsing legacy document settings", parseError, config_1.LoggingService.CATEGORIES.GITLAB);
              return null;
            }
          });
        }
        /**
         * Reset all GitLab settings
         */
        static resetSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              figma.root.setSharedPluginData("Bridgy", settingsKey, "");
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-key`);
              figma.root.setSharedPluginData("Bridgy", "gitlab-settings", "");
              yield figma.clientStorage.deleteAsync("gitlab-settings");
            } catch (error) {
              config_1.LoggingService.error("Error resetting GitLab settings", error, config_1.LoggingService.CATEGORIES.GITLAB);
              throw new GitLabAPIError(`Error resetting GitLab settings: ${error.message || "Unknown error"}`, void 0, error);
            }
          });
        }
        /**
         * Commit CSS data to GitLab repository
         */
        static commitToGitLab(settings_1, commitMessage_1, filePath_1, cssData_1) {
          return __awaiter(this, arguments, void 0, function* (settings, commitMessage, filePath, cssData, branchName = DEFAULT_BRANCH_NAME) {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const { projectId, gitlabToken } = settings;
              this.validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData);
              const featureBranch = branchName;
              const projectData = yield this.fetchProjectInfo(projectId, gitlabToken, settings);
              const defaultBranch = projectData.default_branch;
              yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch, settings);
              const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch, settings);
              yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, fileData && fileData.last_commit_id, settings);
              const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch, settings);
              if (!existingMR) {
                const newMR = yield this.createMergeRequest(projectId, gitlabToken, featureBranch, defaultBranch, commitMessage, "Automatically created merge request for CSS variables update", false, settings);
                return { mergeRequestUrl: newMR.web_url };
              }
              return { mergeRequestUrl: existingMR.web_url };
            }), {
              operation: "commit_to_gitlab",
              component: "GitLabService",
              severity: "high"
            });
          });
        }
        /**
         * Validate commit parameters with comprehensive security checks
         */
        static validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData) {
          if (!projectId || !projectId.trim()) {
            throw new Error("Project ID is required");
          }
          const projectIdPattern = /^(\d+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/;
          if (!projectIdPattern.test(projectId.trim())) {
            throw new Error("Invalid project ID format. Use numeric ID or namespace/project format.");
          }
          if (!gitlabToken || !gitlabToken.trim()) {
            throw new GitLabAuthError("GitLab token is required");
          }
          const tokenPattern = /^(glpat-|glrt-|gldt-|GR1348941|gitlab-ci-token:)?[a-zA-Z0-9_-]{20,}$/;
          if (!tokenPattern.test(gitlabToken.trim())) {
            throw new GitLabAuthError("Invalid GitLab token format");
          }
          if (!commitMessage || !commitMessage.trim()) {
            throw new Error("Commit message is required");
          }
          if (commitMessage.length > 500) {
            throw new Error("Commit message too long (max 500 characters)");
          }
          if (/<script|javascript:|on\w+\s*=/i.test(commitMessage)) {
            throw new Error("Commit message contains potentially unsafe content");
          }
          if (!filePath || !filePath.trim()) {
            throw new Error("File path is required");
          }
          if (filePath.includes("..") || filePath.includes("\\") || filePath.startsWith("/")) {
            throw new Error("Invalid file path - path traversal detected");
          }
          const filePathPattern = /^[a-zA-Z0-9/_.-]+\.(css|scss|less)$/;
          if (!filePathPattern.test(filePath)) {
            throw new Error("File path must be a valid CSS/SCSS/LESS file path");
          }
          if (!cssData || !cssData.trim()) {
            throw new Error("CSS data is required");
          }
          if (cssData.length > 1024 * 1024) {
            throw new Error("CSS data too large (max 1MB)");
          }
        }
        /**
         * Fetch project information from GitLab API
         */
        static fetchProjectInfo(projectId, gitlabToken, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const apiBase = this.getGitLabApiBase(settings);
            const projectUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}`;
            try {
              const response = yield this.makeAPIRequest(projectUrl, {
                method: "GET",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS)
              });
              return yield response.json();
            } catch (error) {
              throw this.handleGitLabError(error, "fetch project information");
            }
          });
        }
        /**
         * Create a feature branch or verify it exists
         */
        static createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const apiBase = this.getGitLabApiBase(settings);
            const createBranchUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/branches`;
            try {
              yield this.makeAPIRequest(createBranchUrl, {
                method: "POST",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS),
                body: JSON.stringify({
                  branch: featureBranch,
                  ref: defaultBranch
                })
              });
            } catch (error) {
              if (error instanceof GitLabAPIError) {
                if (error.statusCode === 400 && error.message && error.message.includes("already exists")) {
                  return;
                }
                throw error;
              }
              throw this.handleGitLabError(error, `create branch '${featureBranch}'`);
            }
          });
        }
        /**
         * Check if file exists and prepare commit action
         */
        static prepareFileCommit(projectId, gitlabToken, filePath, featureBranch, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const apiBase = this.getGitLabApiBase(settings);
            const checkFileUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(featureBranch)}`;
            try {
              const response = yield this.makeAPIRequest(checkFileUrl, {
                method: "GET",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS)
              });
              const fileData = yield response.json();
              return { fileData, action: "update" };
            } catch (error) {
              if (error instanceof GitLabAPIError && error.statusCode === 404) {
                return { fileData: null, action: "create" };
              }
              throw this.handleGitLabError(error, "check file existence");
            }
          });
        }
        /**
         * Create a commit with the file changes
         */
        static createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, lastCommitId, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const apiBase = this.getGitLabApiBase(settings);
            const commitUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/repository/commits`;
            const commitAction = {
              action,
              file_path: filePath,
              content: cssData,
              encoding: "text"
            };
            if (lastCommitId) {
              commitAction.last_commit_id = lastCommitId;
            }
            try {
              const response = yield this.makeAPIRequest(commitUrl, {
                method: "POST",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS),
                body: JSON.stringify({
                  branch: featureBranch,
                  commit_message: commitMessage,
                  actions: [commitAction]
                })
              });
              return yield response.json();
            } catch (error) {
              if (error instanceof GitLabAPIError) {
                throw error;
              }
              throw this.handleGitLabError(error, "create commit");
            }
          });
        }
        /**
         * Find existing merge request for the branch
         */
        static findExistingMergeRequest(projectId, gitlabToken, sourceBranch, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const apiBase = this.getGitLabApiBase(settings);
            const mrUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/merge_requests?source_branch=${encodeURIComponent(sourceBranch)}&state=opened`;
            try {
              const response = yield this.makeAPIRequest(mrUrl, {
                method: "GET",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS)
              });
              const mergeRequests = yield response.json();
              return mergeRequests.length > 0 ? mergeRequests[0] : null;
            } catch (error) {
              throw this.handleGitLabError(error, "fetch merge requests");
            }
          });
        }
        /**
         * Create a new merge request
         */
        static createMergeRequest(projectId_1, gitlabToken_1, sourceBranch_1, targetBranch_1, title_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, sourceBranch, targetBranch, title, description = "Automatically created merge request for CSS variables update", isDraft = false, settings) {
            const apiBase = this.getGitLabApiBase(settings);
            const mrUrl = `${apiBase}/projects/${encodeURIComponent(projectId)}/merge_requests`;
            const finalTitle = isDraft ? `Draft: ${title}` : title;
            try {
              const response = yield this.makeAPIRequest(mrUrl, {
                method: "POST",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS),
                body: JSON.stringify({
                  source_branch: sourceBranch,
                  target_branch: targetBranch,
                  title: finalTitle,
                  description,
                  remove_source_branch: true,
                  squash: true
                })
              });
              return yield response.json();
            } catch (error) {
              if (error instanceof GitLabAPIError) {
                throw error;
              }
              throw this.handleGitLabError(error, "create merge request");
            }
          });
        }
        /**
         * Commit component test files to GitLab
         */
        static commitComponentTest(settings_1, commitMessage_1, componentName_1, testContent_1) {
          return __awaiter(this, arguments, void 0, function* (settings, commitMessage, componentName, testContent, testFilePath = "components/{componentName}.spec.ts", branchName = DEFAULT_TEST_BRANCH_NAME) {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const { projectId, gitlabToken } = settings;
              this.validateComponentTestParameters(projectId, gitlabToken, commitMessage, componentName, testContent);
              const normalizedComponentName = this.normalizeComponentName(componentName);
              const filePath = testFilePath.replace(/{componentName}/g, normalizedComponentName);
              const featureBranch = `${branchName}-${normalizedComponentName}`;
              const projectData = yield this.fetchProjectInfo(projectId, gitlabToken, settings);
              const defaultBranch = projectData.default_branch || "main";
              yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch, settings);
              const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch, settings);
              yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, testContent, action, fileData && fileData.last_commit_id, settings);
              const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch, settings);
              if (!existingMR) {
                const mrDescription = `Automatically created merge request for component test: ${componentName}`;
                const newMR = yield this.createMergeRequest(
                  projectId,
                  gitlabToken,
                  featureBranch,
                  defaultBranch,
                  commitMessage,
                  mrDescription,
                  true,
                  // Mark as draft for component tests
                  settings
                );
                return { mergeRequestUrl: newMR.web_url };
              }
              return { mergeRequestUrl: existingMR.web_url };
            }), {
              operation: "commit_component_test",
              component: "GitLabService",
              severity: "high"
            });
          });
        }
        /**
         * Validate component test parameters
         */
        static validateComponentTestParameters(projectId, gitlabToken, commitMessage, componentName, testContent) {
          if (!projectId || !projectId.trim()) {
            throw new Error("Project ID is required");
          }
          if (!gitlabToken || !gitlabToken.trim()) {
            throw new GitLabAuthError("GitLab token is required");
          }
          if (!commitMessage || !commitMessage.trim()) {
            throw new Error("Commit message is required");
          }
          if (!componentName || !componentName.trim()) {
            throw new Error("Component name is required");
          }
          if (!testContent || !testContent.trim()) {
            throw new Error("Test content is required");
          }
        }
        /**
         * Normalize component name for use in file paths and branch names
         */
        static normalizeComponentName(componentName) {
          return componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        /**
         * Make API request with proper error handling
         */
        static makeAPIRequest(url, options) {
          return __awaiter(this, void 0, void 0, function* () {
            const timeoutMs = 3e4;
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new GitLabNetworkError("Request timed out - please check your connection to GitLab"));
              }, timeoutMs);
            });
            try {
              const response = yield Promise.race([
                fetch(url, options),
                timeoutPromise
              ]);
              if (!response.ok) {
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                  const errorData = yield response.json();
                  if (errorData.message) {
                    errorMessage = errorData.message;
                  } else if (errorData.error) {
                    errorMessage = errorData.error;
                  } else if (errorData.error_description) {
                    errorMessage = errorData.error_description;
                  }
                } catch (_a) {
                }
                const error = new GitLabAPIError(errorMessage, response.status);
                error.statusCode = response.status;
                throw error;
              }
              return response;
            } catch (error) {
              if (error instanceof GitLabAPIError || error instanceof GitLabNetworkError) {
                throw error;
              }
              if (error.name === "TypeError" && error.message.indexOf("fetch") !== -1) {
                throw new GitLabNetworkError("Network error - unable to connect to GitLab API");
              }
              throw error;
            }
          });
        }
        /**
         * Handle GitLab API errors with proper error types and messages
         */
        static handleGitLabError(error, operation) {
          if (error instanceof GitLabAPIError || error instanceof GitLabAuthError || error instanceof GitLabNetworkError) {
            return error;
          }
          if (error.statusCode) {
            switch (error.statusCode) {
              case 401:
              case 403:
                return new GitLabAuthError(`Authentication failed while trying to ${operation}. Please check your GitLab token.`);
              case 404:
                return new GitLabAPIError(`Resource not found while trying to ${operation}. Please check your project ID.`, 404);
              case 422:
                return new GitLabAPIError(`Invalid data provided while trying to ${operation}. Please check your inputs.`, 422);
              case 429:
                return new GitLabAPIError(`Rate limit exceeded while trying to ${operation}. Please try again later.`, 429);
              case 500:
              case 502:
              case 503:
              case 504:
                return new GitLabAPIError(`GitLab server error while trying to ${operation}. Please try again later.`, error.statusCode);
              default:
                return new GitLabAPIError(`GitLab API error while trying to ${operation}: ${error.message || "Unknown error"}`, error.statusCode);
            }
          }
          if (error.name === "TypeError" || error.message.indexOf("fetch") !== -1 || error.message.indexOf("network") !== -1) {
            return new GitLabNetworkError(`Network error while trying to ${operation}`);
          }
          return new GitLabAPIError(`Failed to ${operation}: ${error.message || "Unknown error"}`);
        }
      };
      exports.GitLabService = GitLabService;
      GitLabService.DEFAULT_HEADERS = config_1.API_CONFIG.DEFAULT_HEADERS;
    }
  });

  // dist/services/unitsService.js
  var require_unitsService = __commonJS({
    "dist/services/unitsService.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.UnitsService = void 0;
      var config_1 = require_config();
      var UnitsService = class {
        static getDefaultUnit(variableName) {
          const name = variableName.toLowerCase();
          const matchesPatterns = (patterns) => {
            return patterns.some((pattern) => {
              const normalizedPattern = pattern.toLowerCase();
              const wordBoundaryPattern = new RegExp(`\\b${normalizedPattern.replace(/[-_]/g, "[-_]?")}\\b`);
              return wordBoundaryPattern.test(name) || name.includes(normalizedPattern) && (name.startsWith(normalizedPattern + "-") || name.startsWith(normalizedPattern + "_") || name.endsWith("-" + normalizedPattern) || name.endsWith("_" + normalizedPattern) || name === normalizedPattern);
            });
          };
          if (matchesPatterns(config_1.CSS_UNITS.UNITLESS_PATTERNS)) {
            return "none";
          }
          if (matchesPatterns(config_1.CSS_UNITS.TYPOGRAPHY_PATTERNS)) {
            if (name.includes("line") || name.includes("leading")) {
              return "none";
            }
            return "rem";
          }
          if (matchesPatterns(config_1.CSS_UNITS.SPACING_PATTERNS)) {
            return "rem";
          }
          if (matchesPatterns(config_1.CSS_UNITS.VIEWPORT_PATTERNS)) {
            if (name.includes("width") || name.includes("w-")) {
              return "vw";
            }
            if (name.includes("height") || name.includes("h-")) {
              return "vh";
            }
            return "vw";
          }
          if (matchesPatterns(config_1.CSS_UNITS.BORDER_RADIUS_PATTERNS)) {
            if (name.includes("pill") || name.includes("circle") || name.includes("full")) {
              return "%";
            }
            return "px";
          }
          if (name.includes("color") || name.includes("bg") || name.includes("background") || name.includes("border-color") || name.includes("text-color")) {
            return "none";
          }
          if (name.includes("duration") || name.includes("delay") || name.includes("time")) {
            return "none";
          }
          if (name.includes("border") && (name.includes("width") || name.includes("size"))) {
            return "px";
          }
          if (name.includes("shadow") || name.includes("blur") || name.includes("spread")) {
            return "px";
          }
          if (matchesPatterns(config_1.CSS_UNITS.RELATIVE_PATTERNS)) {
            if (name.includes("container") || name.includes("col") || name.includes("sidebar")) {
              return "%";
            }
            if (name.includes("icon") || name.includes("avatar") || name.includes("thumb")) {
              return "px";
            }
            return "%";
          }
          if (name.startsWith("size-") || name.startsWith("space-")) {
            return "rem";
          }
          if (name.startsWith("breakpoint-") || name.startsWith("container-")) {
            return "px";
          }
          if (name.includes("button") || name.includes("input") || name.includes("card")) {
            if (name.includes("padding") || name.includes("margin") || name.includes("gap")) {
              return "rem";
            }
            if (name.includes("border") || name.includes("outline")) {
              return "px";
            }
          }
          if (/\d/.test(name) || name.includes("size") || name.includes("width") || name.includes("height")) {
            return "px";
          }
          return config_1.CSS_UNITS.DEFAULT;
        }
        static getUnitForVariable(variableName, collectionName, groupName) {
          if (groupName) {
            const groupKey = `${collectionName}/${groupName}`;
            if (this.unitSettings.groups[groupKey]) {
              return this.unitSettings.groups[groupKey];
            }
          }
          if (this.unitSettings.collections[collectionName]) {
            return this.unitSettings.collections[collectionName];
          }
          return this.getDefaultUnit(variableName);
        }
        static updateUnitSettings(newSettings) {
          if (newSettings.collections) {
            this.unitSettings.collections = Object.assign({}, newSettings.collections);
          }
          if (newSettings.groups) {
            this.unitSettings.groups = Object.assign({}, newSettings.groups);
          }
        }
        static getUnitSettings() {
          return Object.assign({}, this.unitSettings);
        }
        static formatValueWithUnit(value, unit) {
          if (unit === "none" || unit === "") {
            return String(value);
          }
          return `${value}${unit}`;
        }
        /**
         * Get explanation for why a specific unit was chosen for a variable
         * Useful for UI tooltips and documentation
         */
        static getUnitRationale(variableName) {
          const name = variableName.toLowerCase();
          const chosenUnit = this.getDefaultUnit(variableName);
          const matchesPatterns = (patterns) => {
            return patterns.some((pattern) => {
              const normalizedPattern = pattern.toLowerCase();
              return name.includes(normalizedPattern) || name.includes(normalizedPattern.replace("-", "")) || name.includes(normalizedPattern.replace("-", "_"));
            });
          };
          if (chosenUnit === "none") {
            if (matchesPatterns(config_1.CSS_UNITS.UNITLESS_PATTERNS)) {
              return `Unitless: CSS property "${variableName}" doesn't require units`;
            }
            if (name.includes("color") || name.includes("bg") || name.includes("background")) {
              return "Color values don't require units";
            }
            if (name.includes("duration") || name.includes("delay") || name.includes("time")) {
              return "Timing values use CSS-specific units (s, ms)";
            }
            if (name.includes("line") || name.includes("leading")) {
              return "Line-height multipliers are unitless";
            }
          }
          if (chosenUnit === "rem") {
            if (matchesPatterns(config_1.CSS_UNITS.TYPOGRAPHY_PATTERNS)) {
              return "Typography: rem units scale with root font size for accessibility";
            }
            if (matchesPatterns(config_1.CSS_UNITS.SPACING_PATTERNS)) {
              return "Spacing: rem units maintain consistent proportions with text";
            }
            if (name.startsWith("size-") || name.startsWith("space-")) {
              return "Design tokens: rem provides scalable, consistent sizing";
            }
          }
          if (chosenUnit === "%") {
            if (matchesPatterns(config_1.CSS_UNITS.RELATIVE_PATTERNS)) {
              return "Relative sizing: % units create responsive, container-relative dimensions";
            }
            if (name.includes("pill") || name.includes("circle") || name.includes("full")) {
              return "Large radius: % creates perfect circles and pills";
            }
          }
          if (chosenUnit === "vw" || chosenUnit === "vh") {
            return `Viewport units: ${chosenUnit} scales with ${chosenUnit === "vw" ? "width" : "height"} for full-screen designs`;
          }
          if (chosenUnit === "px") {
            if (name.includes("border") || name.includes("outline")) {
              return "Borders: px provides pixel-perfect precision for thin lines";
            }
            if (name.includes("shadow") || name.includes("blur")) {
              return "Effects: px gives precise control over shadows and blur";
            }
            if (name.includes("icon") || name.includes("avatar") || name.includes("thumb")) {
              return "Fixed assets: px ensures consistent sizing regardless of context";
            }
            return "Default: px provides precise, absolute positioning";
          }
          return `Smart default: ${chosenUnit} chosen based on variable name analysis`;
        }
        // Save unit settings to shared Figma storage (accessible by all team members)
        static saveUnitSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(this.unitSettings));
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, JSON.stringify({
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
              }));
            } catch (error) {
              config_1.LoggingService.error("Error saving unit settings", error, config_1.LoggingService.CATEGORIES.UNITS);
              throw error;
            }
          });
        }
        // Load unit settings from shared Figma storage
        static loadUnitSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              const sharedSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
              if (sharedSettings) {
                try {
                  this.unitSettings = JSON.parse(sharedSettings);
                  return;
                } catch (parseError) {
                  config_1.LoggingService.error("Error parsing shared unit settings", parseError, config_1.LoggingService.CATEGORIES.UNITS);
                }
              }
              const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
              if (personalSettings) {
                this.unitSettings = personalSettings;
                yield this.saveUnitSettings();
                yield figma.clientStorage.deleteAsync(settingsKey);
                return;
              }
            } catch (error) {
              config_1.LoggingService.error("Error loading unit settings", error, config_1.LoggingService.CATEGORIES.UNITS);
            }
          });
        }
        // Reset unit settings (remove from both personal and shared storage)
        static resetUnitSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              this.unitSettings = {
                collections: {},
                groups: {}
              };
              figma.root.setSharedPluginData("Bridgy", settingsKey, "");
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
            } catch (error) {
              config_1.LoggingService.error("Error resetting unit settings", error, config_1.LoggingService.CATEGORIES.UNITS);
              throw error;
            }
          });
        }
      };
      exports.UnitsService = UnitsService;
      UnitsService.unitSettings = {
        collections: {},
        groups: {}
      };
    }
  });

  // dist/services/cssExportService.js
  var require_cssExportService = __commonJS({
    "dist/services/cssExportService.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CSSExportService = void 0;
      var unitsService_1 = require_unitsService();
      var errorHandler_1 = require_errorHandler();
      var CSS_VARIABLE_PREFIX = "--";
      var SCSS_VARIABLE_PREFIX = "$";
      var DEFAULT_FORMAT = "css";
      var CSSExportService = class {
        /**
         * Export variables in the specified format (CSS or SCSS)
         */
        static exportVariables() {
          return __awaiter(this, arguments, void 0, function* (format = DEFAULT_FORMAT) {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const validFormats = ["css", "scss"];
              if (validFormats.indexOf(format.toLowerCase()) === -1) {
                throw new Error(`Invalid export format: ${format}. Must be 'css' or 'scss'.`);
              }
              yield this.initialize();
              const collections = yield this.getProcessedCollections();
              if (!collections || collections.length === 0) {
                throw new Error("No variables found to export. Please ensure you have created variables in your Figma file.");
              }
              return this.buildExportContent(collections, format);
            }), {
              operation: "export_variables",
              component: "CSSExportService",
              severity: "high"
            });
          });
        }
        /**
         * Initialize the service by clearing caches and loading settings
         */
        static initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              this.clearCaches();
              yield unitsService_1.UnitsService.loadUnitSettings();
            }), {
              operation: "initialize_css_export_service",
              component: "CSSExportService",
              severity: "medium"
            });
          });
        }
        /**
         * Clear all internal caches
         */
        static clearCaches() {
          this.variableCache.clear();
          this.collectionCache.clear();
        }
        /**
         * Get processed collections with variables organized by groups
         */
        static getProcessedCollections() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              if (!collections || collections.length === 0) {
                throw new Error("No variable collections found in this Figma file.");
              }
              yield this.populateVariableCache(collections);
              const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
              const processedCollections = [];
              for (const collection of sortedCollections) {
                try {
                  const processed = yield this.processCollection(collection);
                  if (processed.variables.length > 0 || Object.keys(processed.groups).length > 0) {
                    processedCollections.push(processed);
                  }
                } catch (collectionError) {
                  errorHandler_1.ErrorHandler.handleError(collectionError, {
                    operation: `process_collection_${collection.name}`,
                    component: "CSSExportService",
                    severity: "medium"
                  });
                }
              }
              return processedCollections;
            }), {
              operation: "get_processed_collections",
              component: "CSSExportService",
              severity: "high"
            });
          });
        }
        /**
         * Process a single collection and organize its variables
         */
        static processCollection(collection) {
          return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = `${collection.id}-${collection.variableIds.length}`;
            const cached = this.collectionCache.get(cacheKey);
            if (cached) {
              return cached;
            }
            const variables = [];
            const groups = {};
            yield Promise.all(collection.variableIds.map((variableId) => __awaiter(this, void 0, void 0, function* () {
              const cssVariable = yield this.processVariable(variableId, collection);
              if (!cssVariable)
                return;
              const pathMatch = cssVariable.originalName.match(/^([^\/]+)\//);
              if (pathMatch) {
                const groupName = pathMatch[1];
                if (!groups[groupName]) {
                  groups[groupName] = [];
                }
                groups[groupName].push(cssVariable);
              } else {
                variables.push(cssVariable);
              }
            })));
            const result = {
              name: collection.name,
              variables,
              groups
            };
            this.collectionCache.set(cacheKey, result);
            return result;
          });
        }
        /**
         * Process a single variable and return formatted CSS variable
         */
        static processVariable(variableId, collection) {
          return __awaiter(this, void 0, void 0, function* () {
            const variable = yield figma.variables.getVariableByIdAsync(variableId);
            if (!variable)
              return null;
            const defaultModeId = collection.modes[0].modeId;
            const value = variable.valuesByMode[defaultModeId];
            const formattedName = this.formatVariableName(variable.name);
            const cssValue = this.resolveCSSValue(variable, value, collection);
            if (cssValue === null)
              return null;
            return {
              name: formattedName,
              value: cssValue,
              originalName: variable.name
            };
          });
        }
        /**
         * Resolve the CSS value for a variable (handles aliases and type formatting)
         */
        static resolveCSSValue(variable, value, collection) {
          const isAlias = value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
          if (isAlias) {
            return this.resolveVariableAlias(value.id);
          }
          const pathMatch = variable.name.match(/^([^\/]+)\//);
          const groupName = pathMatch ? pathMatch[1] : void 0;
          return this.formatVariableValue(variable.resolvedType, value, variable.name, collection.name, groupName);
        }
        /**
         * Resolve a variable alias to its CSS reference
         */
        static resolveVariableAlias(aliasId) {
          const referencedVariable = this.variableCache.get(aliasId);
          if (!referencedVariable)
            return null;
          const referencedName = this.formatVariableName(referencedVariable.name);
          return `var(${CSS_VARIABLE_PREFIX}${referencedName})`;
        }
        /**
         * Format variable name to valid CSS custom property name
         */
        static formatVariableName(name) {
          return name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        }
        /**
         * Build the final export content from processed collections
         */
        static buildExportContent(collections, format) {
          const contentParts = [];
          if (format === "css") {
            contentParts.push(":root {");
          }
          collections.forEach((collection) => {
            contentParts.push(this.buildCollectionContent(collection, format));
          });
          if (format === "css") {
            contentParts.push("}");
          }
          return contentParts.join("\n");
        }
        /**
         * Build content for a single collection
         */
        static buildCollectionContent(collection, format) {
          const parts = [];
          const commentPrefix = format === "scss" ? "//" : "  /*";
          const commentSuffix = format === "scss" ? "" : " */";
          parts.push(`
${commentPrefix} ===== ${collection.name.toUpperCase()} =====${commentSuffix}`);
          collection.variables.forEach((variable) => {
            parts.push(this.formatVariableDeclaration(variable, format));
          });
          const sortedGroupNames = Object.keys(collection.groups).sort();
          sortedGroupNames.forEach((groupName) => {
            const displayName = this.formatGroupDisplayName(groupName);
            parts.push(`
${commentPrefix} ${displayName}${commentSuffix}`);
            collection.groups[groupName].forEach((variable) => {
              parts.push(this.formatVariableDeclaration(variable, format));
            });
          });
          return parts.join("\n");
        }
        /**
         * Format a variable declaration for the given format
         */
        static formatVariableDeclaration(variable, format) {
          if (format === "scss") {
            return `${SCSS_VARIABLE_PREFIX}${variable.name}: ${variable.value};`;
          }
          return `  ${CSS_VARIABLE_PREFIX}${variable.name}: ${variable.value};`;
        }
        /**
         * Format group name for display
         */
        static formatGroupDisplayName(groupName) {
          return groupName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
        /**
         * Populate the variable cache for alias resolution
         */
        static populateVariableCache(collections) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              yield Promise.all(collections.map((collection) => __awaiter(this, void 0, void 0, function* () {
                try {
                  yield Promise.all(collection.variableIds.map((variableId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                      const variable = yield figma.variables.getVariableByIdAsync(variableId);
                      if (variable) {
                        this.variableCache.set(variable.id, variable);
                      }
                    } catch (variableError) {
                      errorHandler_1.ErrorHandler.handleError(variableError, {
                        operation: `cache_variable_${variableId}`,
                        component: "CSSExportService",
                        severity: "low"
                      });
                    }
                  })));
                } catch (collectionError) {
                  errorHandler_1.ErrorHandler.handleError(collectionError, {
                    operation: `cache_collection_variables_${collection.name}`,
                    component: "CSSExportService",
                    severity: "medium"
                  });
                }
              })));
            }), {
              operation: "populate_variable_cache",
              component: "CSSExportService",
              severity: "medium"
            });
          });
        }
        /**
         * Legacy method - kept for backward compatibility
         * @deprecated Use populateVariableCache instead
         */
        static collectAllVariables(collections) {
          return __awaiter(this, void 0, void 0, function* () {
            yield this.populateVariableCache(collections);
          });
        }
        static formatVariableValue(type, value, name, collectionName, groupName) {
          switch (type) {
            case "COLOR":
              return this.formatColorValue(value);
            case "FLOAT":
              return this.formatFloatValue(value, name, collectionName, groupName);
            case "STRING":
              return this.formatStringValue(value);
            case "BOOLEAN":
              return this.formatBooleanValue(value);
            default:
              return null;
          }
        }
        /**
         * Format color values with proper RGB/RGBA handling
         */
        static formatColorValue(value) {
          if (!value || typeof value !== "object" || !("r" in value) || !("g" in value) || !("b" in value)) {
            return null;
          }
          const color = value;
          const r = Math.round(color.r * 255);
          const g = Math.round(color.g * 255);
          const b = Math.round(color.b * 255);
          if (typeof color.a === "number" && color.a < 1) {
            return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
          }
          return `rgb(${r}, ${g}, ${b})`;
        }
        /**
         * Format float values with appropriate units
         */
        static formatFloatValue(value, name, collectionName, groupName) {
          if (typeof value !== "number" || isNaN(value)) {
            return null;
          }
          const unit = unitsService_1.UnitsService.getUnitForVariable(name, collectionName, groupName);
          return unitsService_1.UnitsService.formatValueWithUnit(value, unit);
        }
        /**
         * Format string values with proper quoting
         */
        static formatStringValue(value) {
          if (typeof value !== "string") {
            return null;
          }
          return `"${value}"`;
        }
        /**
         * Format boolean values
         */
        static formatBooleanValue(value) {
          if (typeof value !== "boolean") {
            return null;
          }
          return value ? "true" : "false";
        }
        // Get unit settings data for the settings interface
        static getUnitSettingsData() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              yield unitsService_1.UnitsService.loadUnitSettings();
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              if (!collections || collections.length === 0) {
                return { collections: [], groups: [] };
              }
              const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
              const collectionsData = [];
              const groupsData = [];
              const unitSettings = unitsService_1.UnitsService.getUnitSettings();
              yield Promise.all(sortedCollections.map((collection) => __awaiter(this, void 0, void 0, function* () {
                try {
                  const hasCollectionSetting = unitSettings.collections[collection.name] !== void 0;
                  const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : "Smart defaults";
                  const currentUnit = unitSettings.collections[collection.name] || "";
                  collectionsData.push({
                    name: collection.name,
                    defaultUnit,
                    currentUnit
                  });
                  const groups = /* @__PURE__ */ new Set();
                  yield Promise.all(collection.variableIds.map((variableId) => __awaiter(this, void 0, void 0, function* () {
                    try {
                      const variable = yield figma.variables.getVariableByIdAsync(variableId);
                      if (variable) {
                        const pathMatch = variable.name.match(/^([^\/]+)\//);
                        if (pathMatch) {
                          groups.add(pathMatch[1]);
                        }
                      }
                    } catch (variableError) {
                      errorHandler_1.ErrorHandler.handleError(variableError, {
                        operation: `get_variable_for_groups_${variableId}`,
                        component: "CSSExportService",
                        severity: "low"
                      });
                    }
                  })));
                  Array.from(groups).sort().forEach((groupName) => {
                    try {
                      const groupKey = `${collection.name}/${groupName}`;
                      const hasGroupSetting = unitSettings.groups[groupKey] !== void 0;
                      const hasCollectionSetting2 = unitSettings.collections[collection.name] !== void 0;
                      let defaultUnit2;
                      if (hasGroupSetting) {
                        defaultUnit2 = unitSettings.groups[groupKey];
                      } else if (hasCollectionSetting2) {
                        defaultUnit2 = `Inherits: ${unitSettings.collections[collection.name]}`;
                      } else {
                        defaultUnit2 = "Smart defaults";
                      }
                      const groupCurrentUnit = unitSettings.groups[groupKey] || "";
                      groupsData.push({
                        collectionName: collection.name,
                        groupName,
                        defaultUnit: defaultUnit2,
                        currentUnit: groupCurrentUnit
                      });
                    } catch (groupError) {
                      errorHandler_1.ErrorHandler.handleError(groupError, {
                        operation: `process_group_${groupName}`,
                        component: "CSSExportService",
                        severity: "low"
                      });
                    }
                  });
                } catch (collectionError) {
                  errorHandler_1.ErrorHandler.handleError(collectionError, {
                    operation: `get_unit_settings_for_collection_${collection.name}`,
                    component: "CSSExportService",
                    severity: "medium"
                  });
                }
              })));
              return { collections: collectionsData, groups: groupsData };
            }), {
              operation: "get_unit_settings_data",
              component: "CSSExportService",
              severity: "medium"
            });
          });
        }
        // Update unit settings
        static updateUnitSettings(settings) {
          unitsService_1.UnitsService.updateUnitSettings(settings);
        }
        // Save unit settings
        static saveUnitSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            yield unitsService_1.UnitsService.saveUnitSettings();
          });
        }
      };
      exports.CSSExportService = CSSExportService;
      CSSExportService.variableCache = /* @__PURE__ */ new Map();
      CSSExportService.collectionCache = /* @__PURE__ */ new Map();
    }
  });

  // dist/utils/es2015-helpers.js
  var require_es2015_helpers = __commonJS({
    "dist/utils/es2015-helpers.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.objectEntries = objectEntries;
      exports.objectFromEntries = objectFromEntries;
      exports.arrayIncludes = arrayIncludes;
      exports.stringIncludes = stringIncludes;
      exports.arrayFlatMap = arrayFlatMap;
      exports.objectAssign = objectAssign;
      function objectEntries(obj) {
        const keys = Object.keys(obj);
        const result = [];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          result.push([key, obj[key]]);
        }
        return result;
      }
      function objectFromEntries(entries) {
        const result = {};
        for (let i = 0; i < entries.length; i++) {
          const [key, value] = entries[i];
          result[key] = value;
        }
        return result;
      }
      function arrayIncludes(array, searchElement) {
        for (let i = 0; i < array.length; i++) {
          if (array[i] === searchElement) {
            return true;
          }
        }
        return false;
      }
      function stringIncludes(str, searchString) {
        return str.indexOf(searchString) !== -1;
      }
      function arrayFlatMap(array, callback) {
        const result = [];
        for (let i = 0; i < array.length; i++) {
          const mapped = callback(array[i], i, array);
          for (let j = 0; j < mapped.length; j++) {
            result.push(mapped[j]);
          }
        }
        return result;
      }
      function objectAssign(target, ...sources) {
        if (target == null) {
          throw new TypeError("Cannot convert undefined or null to object");
        }
        const to = Object(target);
        for (let index = 0; index < sources.length; index++) {
          const nextSource = sources[index];
          if (nextSource != null) {
            for (const nextKey in nextSource) {
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      }
    }
  });

  // dist/utils/stateTestingUtils.js
  var require_stateTestingUtils = __commonJS({
    "dist/utils/stateTestingUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.INTERACTIVE_STATES = exports.STATE_SPECIFIC_PROPERTIES = exports.STATIC_PROPERTIES = exports.INTERACTIVE_PROPERTIES = void 0;
      exports.shouldTestPropertyForState = shouldTestPropertyForState;
      exports.toKebabCase = toKebabCase;
      exports.toCamelCase = toCamelCase;
      exports.generateTestHelpers = generateTestHelpers;
      exports.generateStateTests = generateStateTests;
      exports.analyzeComponentStateVariants = analyzeComponentStateVariants;
      exports.findStyleDifferences = findStyleDifferences;
      exports.generateStateTestsFromVariants = generateStateTestsFromVariants;
      var config_1 = require_config();
      var es2015_helpers_1 = require_es2015_helpers();
      exports.INTERACTIVE_PROPERTIES = config_1.CSS_PROPERTIES.INTERACTIVE;
      exports.STATIC_PROPERTIES = config_1.CSS_PROPERTIES.STATIC;
      exports.STATE_SPECIFIC_PROPERTIES = config_1.TEST_CONFIG.STATE_SPECIFIC_PROPERTIES;
      exports.INTERACTIVE_STATES = [
        {
          state: "hover",
          pseudoClass: ":hover",
          properties: exports.STATE_SPECIFIC_PROPERTIES.hover
        },
        {
          state: "focus",
          pseudoClass: ":focus",
          properties: exports.STATE_SPECIFIC_PROPERTIES.focus
        },
        {
          state: "active",
          pseudoClass: ":active",
          properties: exports.STATE_SPECIFIC_PROPERTIES.active
        },
        {
          state: "disabled",
          pseudoClass: ":disabled",
          properties: exports.STATE_SPECIFIC_PROPERTIES.disabled
        }
      ];
      function shouldTestPropertyForState(property) {
        const kebabProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
        if ((0, es2015_helpers_1.arrayIncludes)(exports.INTERACTIVE_PROPERTIES, property) || (0, es2015_helpers_1.arrayIncludes)(exports.INTERACTIVE_PROPERTIES, kebabProperty)) {
          return true;
        }
        const colorRelatedKeywords = ["color", "background", "border", "outline", "shadow", "fill", "stroke"];
        return colorRelatedKeywords.some((keyword) => property.toLowerCase().indexOf(keyword) !== -1 || kebabProperty.indexOf(keyword) !== -1);
      }
      function toKebabCase(property) {
        return property.replace(/([A-Z])/g, "-$1").toLowerCase();
      }
      function toCamelCase(property) {
        return property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      }
      function generateTestHelpers() {
        return `  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();
    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\\((--[^)]+)\\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }

    return value;
  };

  const resolveCssValueWithVariables = (cssValue: string, stylesheetHrefPart = 'styles.css'): string => {
    if (!cssValue || typeof cssValue !== 'string') {
      return cssValue;
    }

    // Replace all var() functions in the CSS value
    return cssValue.replace(/var\\((--[^,)]+)(?:,\\s*([^)]+))?\\)/g, (match, varName, fallback) => {
      const resolvedValue = resolveCssVariable(varName, stylesheetHrefPart);
      return resolvedValue || fallback || match;
    });
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: any) => {
    // Regex necessairy because angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style!.getPropertyValue(prop);
  };

  const checkStyleProperty = (selector: string, pseudoClass: string, property: string, expectedValue?: string) => {
    // TODO: please check whether the selector is correct
    const value = getCssPropertyForRule(selector, pseudoClass, property);
    if (!value) {
      // If no value is found for this pseudo-class, that's okay - not all states need all properties
      return;
    }

    if (value.indexOf('var(') !== -1) {
      const resolvedValue = resolveCssValueWithVariables(value);
      if (expectedValue) {
        expect(resolvedValue).toBe(expectedValue);
      } else {
        expect(resolvedValue).toBeDefined();
      }
    } else {
      if (expectedValue) {
        expect(value).toBe(expectedValue);
      } else {
        expect(value).toBeDefined();
      }
    }
  };`;
      }
      function generateStateTests(componentSelector, states, componentStyles) {
        const tests = [];
        const hasInteractiveElement = Object.keys(componentStyles).some(shouldTestPropertyForState);
        if (!hasInteractiveElement) {
          return "";
        }
        states.forEach((state) => {
          const componentInteractiveProps = Object.keys(componentStyles).filter(shouldTestPropertyForState);
          const allPropertiesToTest = new Set(componentInteractiveProps.map(toKebabCase).concat(state.properties));
          if (allPropertiesToTest.size > 0) {
            const testName = `should have correct ${state.state} styles`;
            const propertyChecks = Array.from(allPropertiesToTest).map((prop) => {
              const camelCaseProp = toCamelCase(prop);
              const expectedValue = componentStyles[camelCaseProp];
              if (expectedValue && typeof expectedValue === "string") {
                if (prop === "color" || prop === "background-color" || prop.indexOf("border") !== -1) {
                  return `      { property: '${prop}', expected: '${expectedValue}' }`;
                }
              }
              return `      { property: '${prop}', expected: undefined }`;
            }).join(",\n");
            const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      // TODO: Please check if this selector still matches the component's implementation
      checkStyleProperty('${componentSelector}', '${state.pseudoClass}', property, expected);
    });
  });`;
            tests.push(testCode);
          }
        });
        return tests.join("\n");
      }
      function analyzeComponentStateVariants(variants) {
        const stateStyleMap = /* @__PURE__ */ new Map();
        variants.forEach((variant, index) => {
          const stateName = extractStateFromVariantName(variant.name);
          if (!stateName) {
            console.log("DEBUG: No state name found, skipping variant");
            return;
          }
          let styles;
          try {
            styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
            console.log(`DEBUG: Parsed ${Object.keys(styles).length} style properties for state "${stateName}"`);
          } catch (e) {
            console.error("Error parsing variant styles:", e);
            return;
          }
          const styleMap = new Map((0, es2015_helpers_1.objectEntries)(styles));
          stateStyleMap.set(stateName, styleMap);
        });
        return stateStyleMap;
      }
      function extractStateFromVariantName(variantName) {
        let stateMatch = variantName.match(/State=(\w+)/i);
        if (stateMatch) {
          return stateMatch[1].toLowerCase();
        }
        stateMatch = variantName.match(/Property\s*\d*\s*=\s*(\w+)/i);
        if (stateMatch) {
          return stateMatch[1].toLowerCase();
        }
        stateMatch = variantName.match(/(\w+)=(\w+)/i);
        if (stateMatch) {
          return stateMatch[2].toLowerCase();
        }
        return null;
      }
      function findStyleDifferences(baseStyles, compareStyles) {
        const differences = /* @__PURE__ */ new Map();
        compareStyles.forEach((value, key) => {
          const baseValue = baseStyles.get(key);
          if (baseValue !== value) {
            differences.set(key, value);
          }
        });
        return differences;
      }
      function generateStateTestsFromVariants(componentSelector, variants, defaultStyles) {
        const tests = [];
        const stateStyleMap = analyzeComponentStateVariants(variants);
        let defaultStateStyles = stateStyleMap.get("default");
        if (!defaultStateStyles) {
          defaultStateStyles = new Map((0, es2015_helpers_1.objectEntries)(defaultStyles));
        }
        const allStates = Array.from(stateStyleMap.keys()).filter((state) => state !== "default");
        allStates.forEach((stateName) => {
          const stateStyles = stateStyleMap.get(stateName);
          if (!stateStyles)
            return;
          const differences = findStyleDifferences(defaultStateStyles, stateStyles);
          if (differences.size === 0)
            return;
          const pseudoClass = stateName.startsWith(":") ? stateName : `:${stateName}`;
          const testName = `should have correct ${stateName} styles`;
          const propertyChecks = Array.from(differences.entries()).map(([property, value]) => {
            const kebabProperty = toKebabCase(property);
            return `      { property: '${kebabProperty}', expected: '${value}' }`;
          }).join(",\n");
          const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      // TODO: Please check if this selector still matches the component's implementation
      checkStyleProperty('${componentSelector}', '${pseudoClass}', property, expected);
    });
  });`;
          tests.push(testCode);
        });
        return tests.join("\n");
      }
    }
  });

  // dist/utils/componentUtils.js
  var require_componentUtils = __commonJS({
    "dist/utils/componentUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hexToRgb = hexToRgb;
      exports.normalizeColorForTesting = normalizeColorForTesting;
      exports.normalizeComplexColorValue = normalizeComplexColorValue;
      exports.parseComponentName = parseComponentName;
      exports.generateStyleChecks = generateStyleChecks;
      exports.createTestWithStyleChecks = createTestWithStyleChecks;
      var stateTestingUtils_1 = require_stateTestingUtils();
      var config_1 = require_config();
      var es2015_helpers_1 = require_es2015_helpers();
      function hexToRgb(hex) {
        const cleanHex = hex.replace("#", "");
        if (!config_1.PATTERNS.HEX_COLOR.BOTH.test(cleanHex)) {
          return hex;
        }
        let fullHex = cleanHex;
        if (cleanHex.length === 3) {
          fullHex = cleanHex.split("").map((char) => char + char).join("");
        }
        const r = parseInt(fullHex.substring(0, 2), 16);
        const g = parseInt(fullHex.substring(2, 4), 16);
        const b = parseInt(fullHex.substring(4, 6), 16);
        return `rgb(${r}, ${g}, ${b})`;
      }
      function normalizeColorForTesting(color) {
        if (!color || typeof color !== "string") {
          return color;
        }
        if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
          return color;
        }
        if (color.startsWith("#") || config_1.PATTERNS.HEX_COLOR.BOTH.test(color)) {
          return hexToRgb(color);
        }
        return color;
      }
      function normalizeComplexColorValue(value) {
        if (!value || typeof value !== "string") {
          return value;
        }
        return value.replace(config_1.PATTERNS.HEX_COLOR.INLINE, (match) => {
          return hexToRgb(match);
        });
      }
      function parseComponentName(name) {
        const result = {
          name,
          type: null,
          state: null
        };
        const typeMatch = name.match(config_1.PATTERNS.COMPONENT_NAME.TYPE);
        if (typeMatch && typeMatch[1]) {
          result.type = typeMatch[1].trim();
        }
        const stateMatch = name.match(config_1.PATTERNS.COMPONENT_NAME.STATE);
        if (stateMatch && stateMatch[1]) {
          result.state = stateMatch[1].trim();
        }
        return result;
      }
      function generateStyleChecks(styleChecks) {
        if (!styleChecks.length) {
          return "        // No style properties to check";
        }
        function stripCssVarFallback(value) {
          return value.replace(config_1.PATTERNS.CSS_VARIABLE.STRIP_FALLBACK, "$1").replace(config_1.PATTERNS.WHITESPACE_NORMALIZE, " ").trim();
        }
        return styleChecks.map((check) => {
          const expected = stripCssVarFallback(String(check.value));
          return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${expected}');`;
        }).join("\n\n");
      }
      var LAYOUT_PROPERTIES = config_1.CSS_PROPERTIES.LAYOUT;
      function generateTextContentTests(textElements, componentVariants) {
        if (!textElements || textElements.length === 0) {
          return "";
        }
        const tests = [];
        const textWithStyles = textElements.filter((el) => el.textStyles && Object.keys(el.textStyles).length > 0);
        if (textWithStyles.length > 0) {
          if (componentVariants && componentVariants.length > 0) {
            const variantGroups = /* @__PURE__ */ new Map();
            componentVariants.forEach((variant) => {
              const stateMatch = variant.name.match(/State=([^,]+)/i);
              const sizeMatch = variant.name.match(/Size=([^,]+)/i);
              const propMatch = variant.name.match(/Property\s*\d*\s*=\s*([^,]+)/i);
              const state = stateMatch && stateMatch[1] ? stateMatch[1].toLowerCase() : propMatch && propMatch[1] ? propMatch[1].toLowerCase() : "default";
              const size = sizeMatch && sizeMatch[1] ? sizeMatch[1].toLowerCase() : "default";
              const key = `${state}-${size}`;
              if (!variantGroups.has(key)) {
                variantGroups.set(key, []);
              }
              variantGroups.get(key).push(variant);
            });
            variantGroups.forEach((variants, key) => {
              const variant = variants[0];
              if (variant.textElements && variant.textElements.length > 0) {
                const [state, size] = key.split("-");
                const textStyleTest = `
  it('should have correct text styles for ${state} state, ${size} size', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      LoggingService.warn('No text element found for style testing', undefined, LoggingService.CATEGORIES.TESTING);
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${variant.textElements.map((textEl, index) => {
                  const styles = textEl.textStyles;
                  if (!styles || Object.keys(styles).length === 0)
                    return "";
                  const assertions = [];
                  if (styles.fontSize) {
                    const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                    assertions.push(`
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
                  }
                  if (styles.fontFamily) {
                    const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                    assertions.push(`
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
                  }
                  if (styles.fontWeight) {
                    const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                    assertions.push(`
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
                  }
                  if (styles.color) {
                    const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim());
                    assertions.push(`
    expect(computedStyle.color).toBe('${normalizedColor}');`);
                  }
                  return assertions.join("");
                }).join("")}
  });`;
                tests.push(textStyleTest);
              }
            });
          } else {
            const textStyleTest = `
  it('should have correct text styles', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      LoggingService.warn('No text element found for style testing', undefined, LoggingService.CATEGORIES.TESTING);
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${textWithStyles.map((textEl, index) => {
              const styles = textEl.textStyles;
              const assertions = [];
              if (styles.fontSize) {
                const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
              }
              if (styles.fontFamily) {
                const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
              }
              if (styles.fontWeight) {
                const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
              }
              if (styles.color) {
                const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim());
                assertions.push(`
    expect(computedStyle.color).toBe('${normalizedColor}');`);
              }
              return assertions.join("");
            }).join("")}
  });`;
            tests.push(textStyleTest);
          }
        }
        return tests.join("");
      }
      function createTestWithStyleChecks(componentName, kebabName, styleChecks, includeStateTests = true, includeSizeTests = true, componentVariants, textElements) {
        function stripCssVarFallback(value) {
          return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, "$1").replace(/\s+/g, " ").trim();
        }
        const styleCheckCode = styleChecks.length > 0 ? styleChecks.map((check) => {
          const expected = stripCssVarFallback(String(check.value));
          if ((0, es2015_helpers_1.arrayIncludes)(LAYOUT_PROPERTIES, check.property)) {
            return `      // Check ${check.property} (layout property - often structural)
      // expect(computedStyle.${check.property}).toBe('${expected}');`;
          }
          return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${expected}');`;
        }).join("\n\n") : "      // No style properties to check";
        const words = componentName.split(/[^a-zA-Z0-9]+/).filter((word) => word.length > 0);
        const pascalName = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
        const componentSelector = `.${kebabName}`;
        const stylesObject = {};
        styleChecks.forEach((check) => {
          stylesObject[check.property] = check.value;
        });
        let stateTestsCode = "";
        if (includeStateTests) {
          if (componentVariants && componentVariants.length > 0) {
            stateTestsCode = (0, stateTestingUtils_1.generateStateTestsFromVariants)(componentSelector, componentVariants, stylesObject);
          } else {
            const hasInteractiveProperties = styleChecks.some((check) => (0, stateTestingUtils_1.shouldTestPropertyForState)(check.property));
            if (hasInteractiveProperties) {
              stateTestsCode = (0, stateTestingUtils_1.generateStateTests)(componentSelector, stateTestingUtils_1.INTERACTIVE_STATES, stylesObject);
            }
          }
        }
        const hasVariantTests = componentVariants && componentVariants.length > 0 && (includeStateTests || includeSizeTests);
        const helperFunctions = hasVariantTests ? `
${(0, stateTestingUtils_1.generateTestHelpers)()}
` : "";
        return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;${helperFunctions}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should have correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
${styleCheckCode}
    } else {
      LoggingService.warn('No suitable element found to test styles', undefined, LoggingService.CATEGORIES.TESTING);
    }
  });${stateTestsCode}${generateTextContentTests(textElements, componentVariants)}
});`;
      }
    }
  });

  // dist/services/componentService.js
  var require_componentService = __commonJS({
    "dist/services/componentService.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ComponentService = void 0;
      var componentUtils_1 = require_componentUtils();
      var es2015_helpers_1 = require_es2015_helpers();
      var css_1 = require_css();
      var errorHandler_1 = require_errorHandler();
      var PSEUDO_STATES = ["hover", "active", "focus", "disabled"];
      var ComponentService = class _ComponentService {
        // Cache management with LRU eviction
        static clearCaches() {
          this.styleCache.clear();
          this.testCache.clear();
          this.nameCache.clear();
        }
        static enforcesCacheLimit(cache) {
          if (cache.size > this.MAX_CACHE_SIZE) {
            const keysToDelete = Array.from(cache.keys()).slice(0, cache.size - this.CACHE_CLEANUP_THRESHOLD);
            keysToDelete.forEach((key) => cache.delete(key));
          }
        }
        static addToCache(cache, key, value) {
          if (cache.has(key)) {
            cache.delete(key);
          }
          cache.set(key, value);
          this.enforcesCacheLimit(cache);
        }
        static isSimpleColorProperty(property) {
          return (0, es2015_helpers_1.arrayIncludes)(css_1.CSS_PROPERTIES.SIMPLE_COLORS, property);
        }
        static isComplexColorProperty(property) {
          return (0, es2015_helpers_1.arrayIncludes)(css_1.CSS_PROPERTIES.COMPLEX_COLORS, property);
        }
        static hasDecimalPixelValues(value) {
          const decimalPixelRegex = /\d+\.\d+px/;
          return decimalPixelRegex.test(value);
        }
        static normalizeStyleValue(property, value) {
          if (typeof value !== "string") {
            return value;
          }
          if (this.isSimpleColorProperty(property)) {
            return (0, componentUtils_1.normalizeColorForTesting)(value);
          }
          if (this.isComplexColorProperty(property)) {
            return (0, componentUtils_1.normalizeComplexColorValue)(value);
          }
          return value;
        }
        static collectComponents() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              yield this.collectAllVariables();
              const componentsData = [];
              const componentSets = [];
              this.componentMap = /* @__PURE__ */ new Map();
              function collectNodes(node) {
                return __awaiter(this, void 0, void 0, function* () {
                  try {
                    if (!("type" in node)) {
                      return;
                    }
                    if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                      try {
                        const componentStyles = yield node.getCSSAsync();
                        const textElements = yield _ComponentService.extractTextElements(node);
                        const resolvedStyles = _ComponentService.resolveStyleVariables(componentStyles, textElements, node.name);
                        const componentData = {
                          id: node.id,
                          name: node.name,
                          type: node.type,
                          styles: resolvedStyles,
                          pageName: node.parent && node.parent.name ? node.parent.name : "Unknown",
                          parentId: node.parent && node.parent.id,
                          children: [],
                          textElements,
                          hasTextContent: textElements.length > 0
                        };
                        _ComponentService.componentMap.set(node.id, componentData);
                        if (node.type === "COMPONENT_SET") {
                          componentSets.push(componentData);
                        } else {
                          componentsData.push(componentData);
                        }
                      } catch (nodeError) {
                        errorHandler_1.ErrorHandler.handleError(nodeError, {
                          operation: `process_component_${node.name}`,
                          component: "ComponentService",
                          severity: "medium"
                        });
                      }
                    }
                    if ("children" in node) {
                      for (const child of node.children) {
                        yield collectNodes(child);
                      }
                    }
                  } catch (childError) {
                    errorHandler_1.ErrorHandler.handleError(childError, {
                      operation: "collect_component_children",
                      component: "ComponentService",
                      severity: "medium"
                    });
                  }
                });
              }
              for (const page of figma.root.children) {
                try {
                  yield collectNodes(page);
                } catch (pageError) {
                  errorHandler_1.ErrorHandler.handleError(pageError, {
                    operation: `collect_page_components_${page.name}`,
                    component: "ComponentService",
                    severity: "medium"
                  });
                }
              }
              try {
                componentsData.forEach((component) => {
                  if (component.parentId) {
                    const parent = this.componentMap.get(component.parentId);
                    if (parent && parent.type === "COMPONENT_SET") {
                      parent.children.push(component);
                      component.isChild = true;
                    }
                  }
                });
              } catch (organizationError) {
                errorHandler_1.ErrorHandler.handleError(organizationError, {
                  operation: "organize_component_hierarchy",
                  component: "ComponentService",
                  severity: "low"
                });
              }
              return componentSets.concat(componentsData.filter((comp) => !comp.isChild));
            }), {
              operation: "collect_components",
              component: "ComponentService",
              severity: "high"
            });
          });
        }
        static getComponentById(id) {
          return this.componentMap.get(id);
        }
        static generateTest(component, includeStateTests = true, includeSizeTests = true) {
          const componentName = component.name;
          const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const isComponentSet = component.type === "COMPONENT_SET";
          if (isComponentSet && component.children && component.children.length > 0) {
            return this.generateComponentSetTest(component);
          }
          const componentVariants = isComponentSet ? component.children : void 0;
          let styles;
          try {
            styles = typeof component.styles === "string" ? JSON.parse(component.styles) : component.styles;
          } catch (e) {
            console.error("Error parsing component styles:", e);
            styles = {};
          }
          const styleChecks = [];
          (0, es2015_helpers_1.objectEntries)(styles).forEach(([key, value]) => {
            let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (camelCaseKey === "background") {
              camelCaseKey = "backgroundColor";
            }
            styleChecks.push({
              property: camelCaseKey,
              value: this.normalizeStyleValue(camelCaseKey, value)
            });
          });
          if (component.textElements) {
            component.textElements.filter((textElement) => textElement.textStyles).forEach((textElement) => {
              (0, es2015_helpers_1.objectEntries)(textElement.textStyles).forEach(([key, value]) => {
                if (value) {
                  styleChecks.push({
                    property: key,
                    value: this.normalizeStyleValue(key, value)
                  });
                }
              });
            });
          }
          if (isComponentSet) {
            const defaultVariant = component.children && component.children.length > 0 ? component.children[0] : null;
            if (defaultVariant) {
              let variantStyles;
              try {
                variantStyles = typeof defaultVariant.styles === "string" ? JSON.parse(defaultVariant.styles) : defaultVariant.styles;
              } catch (e) {
                console.error("Error parsing variant styles:", e);
                variantStyles = {};
              }
              const variantStyleChecks = [];
              (0, es2015_helpers_1.objectEntries)(variantStyles).forEach(([key, value]) => {
                let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                if (camelCaseKey === "background") {
                  camelCaseKey = "backgroundColor";
                }
                variantStyleChecks.push({
                  property: camelCaseKey,
                  value: this.normalizeStyleValue(camelCaseKey, value)
                });
              });
              return (0, componentUtils_1.createTestWithStyleChecks)(componentName, kebabName, variantStyleChecks, includeStateTests, includeSizeTests, componentVariants, defaultVariant.textElements);
            }
          }
          return (0, componentUtils_1.createTestWithStyleChecks)(componentName, kebabName, styleChecks, includeStateTests, includeSizeTests, componentVariants, component.textElements);
        }
        static generateComponentSetTest(componentSet) {
          if (!componentSet.children || componentSet.children.length === 0) {
            return this.generateTest(componentSet);
          }
          const { kebabName, pascalName } = this.parseComponentName(componentSet.name);
          const variantResult = this.generateVariantTests(componentSet, kebabName, pascalName);
          return this.buildComponentSetTestTemplate(pascalName, kebabName, variantResult.tests, variantResult.variantProps);
        }
        static parseComponentName(name) {
          if (!name || typeof name !== "string") {
            throw new Error(`Invalid component name: ${name}`);
          }
          const cached = this.nameCache.get(name);
          if (cached) {
            return cached;
          }
          const kebabName = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          if (!kebabName) {
            throw new Error(`Could not generate valid kebab-case name from: ${name}`);
          }
          const words = name.split(/[^a-zA-Z0-9]+/).filter((word) => word.length > 0);
          if (words.length === 0) {
            throw new Error(`Could not extract words from component name: ${name}`);
          }
          const pascalName = words.map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`).join("");
          const result = { kebabName, pascalName };
          this.nameCache.set(name, result);
          return result;
        }
        static generateVariantTests(componentSet, kebabName, pascalName) {
          const childrenHash = componentSet.children ? componentSet.children.map((c) => c.id + c.name).join("|") : "";
          const cacheKey = `variants-${componentSet.id}-${childrenHash}`;
          const cached = this.testCache.get(cacheKey);
          if (cached) {
            return { tests: cached, variantProps: [] };
          }
          const variantTestParts = [];
          const processedVariants = /* @__PURE__ */ new Set();
          const allVariantProps = [];
          componentSet.children.forEach((variant) => {
            try {
              const variantProps = this.parseVariantName(variant.name);
              const testId = variant.name;
              if (processedVariants.has(testId)) {
                return;
              }
              processedVariants.add(testId);
              allVariantProps.push(variantProps);
              const styles = this.parseStyles(variant.styles);
              const cssProperties = this.extractCssProperties(styles);
              const textStyles = this.extractTextStyles(variant.textElements);
              const state = variantProps.state || "default";
              const isPseudoState = this.isPseudoState(state);
              if (isPseudoState) {
                variantTestParts.push(this.generatePseudoStateTest(variantProps, cssProperties, kebabName, textStyles));
              } else {
                variantTestParts.push(this.generateComponentPropertyTest(variantProps, cssProperties, kebabName, pascalName, textStyles));
              }
            } catch (error) {
              console.error("Error generating test for variant:", variant.name, error);
            }
          });
          const result = {
            tests: variantTestParts.join(""),
            variantProps: allVariantProps
          };
          this.testCache.set(cacheKey, result.tests);
          return result;
        }
        static parseVariantName(variantName) {
          if (!variantName || typeof variantName !== "string") {
            throw new Error(`Invalid variant name: ${variantName}`);
          }
          const props = {};
          const parts = variantName.split(",");
          parts.forEach((part) => {
            const trimmedPart = part.trim();
            const propertyMatch = trimmedPart.match(/^([^=]+)=(.+)$/);
            if (propertyMatch) {
              const propertyName = propertyMatch[1].trim();
              const propertyValue = propertyMatch[2].trim();
              const camelCaseName = propertyName.replace(/\s+/g, "").replace(/^(.)/g, (match) => match.toLowerCase()).replace(/[^a-zA-Z0-9]/g, "");
              props[camelCaseName] = propertyValue;
              if (propertyName.toLowerCase() === "state") {
                props.state = propertyValue;
              }
            }
          });
          return props;
        }
        static parseStyles(styles) {
          if (!styles) {
            return {};
          }
          if (typeof styles === "string") {
            const cached = this.styleCache.get(styles);
            if (cached) {
              return cached;
            }
            try {
              const parsed = JSON.parse(styles);
              const result = typeof parsed === "object" && parsed !== null ? parsed : {};
              this.styleCache.set(styles, result);
              return result;
            } catch (error) {
              console.error("Failed to parse styles JSON:", error);
              const emptyResult = {};
              this.styleCache.set(styles, emptyResult);
              return emptyResult;
            }
          }
          return typeof styles === "object" && styles !== null ? styles : {};
        }
        static isPseudoState(state) {
          return (0, es2015_helpers_1.arrayIncludes)(PSEUDO_STATES, state.toLowerCase());
        }
        static generateInputDeclarations(allVariantProps) {
          const propertyValues = /* @__PURE__ */ new Map();
          allVariantProps.forEach((variantProps) => {
            (0, es2015_helpers_1.objectEntries)(variantProps).forEach(([propName, propValue]) => {
              if (propName === "state") {
                return;
              }
              if (!propertyValues.has(propName)) {
                propertyValues.set(propName, /* @__PURE__ */ new Set());
              }
              propertyValues.get(propName).add(propValue);
            });
          });
          const inputDeclarations = [];
          propertyValues.forEach((values, propName) => {
            const uniqueValues = Array.from(values).sort();
            if (uniqueValues.length === 1) {
              inputDeclarations.push(`  @Input() ${propName}: string = '${uniqueValues[0]}';`);
            } else {
              const unionType = uniqueValues.map((val) => `'${val}'`).join(" | ");
              const defaultValue = uniqueValues[0];
              inputDeclarations.push(`  @Input() ${propName}: ${unionType} = '${defaultValue}';`);
            }
          });
          if (inputDeclarations.length === 0) {
            return "";
          }
          return `/*
TODO: Add these @Input() properties to your component:

${inputDeclarations.join("\n")}

Don't forget to add this import:
import { CommonModule } from '@angular/common';

IMPORTANT: Ensure your variables file is imported in your stylesheets to make CSS variables available for testing.
*/`;
        }
        static buildComponentSetTestTemplate(pascalName, kebabName, variantTests, variantProps) {
          const inputDeclarations = variantProps ? this.generateInputDeclarations(variantProps) : "";
          return `${inputDeclarations}${inputDeclarations ? "\n\n" : ""}import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component - All Variants', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();
    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\\((--[^)]+)\\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }

    return value;
  };

  const resolveCssValueWithVariables = (cssValue: string, stylesheetHrefPart = 'styles.css'): string => {
    if (!cssValue || typeof cssValue !== 'string') {
      return cssValue;
    }

    // Replace all var() functions in the CSS value
    return cssValue.replace(/var\\((--[^,)]+)(?:,\\s*([^)]+))?\\)/g, (match, varName, fallback) => {
      const resolvedValue = resolveCssVariable(varName, stylesheetHrefPart);
      return resolvedValue || fallback || match;
    });
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: any) => {
    // Regex necessairy because angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style!.getPropertyValue(prop);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [${pascalName}Component],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

${variantTests}
});`;
        }
        static collectAllVariables() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              this.allVariables.clear();
              const variablePromises = (0, es2015_helpers_1.arrayFlatMap)(collections, (collection) => collection.variableIds.map((variableId) => figma.variables.getVariableByIdAsync(variableId).catch((error) => {
                errorHandler_1.ErrorHandler.handleError(error, {
                  operation: `get_variable_${variableId}`,
                  component: "ComponentService",
                  severity: "low"
                });
                return null;
              })));
              const variables = yield Promise.all(variablePromises);
              variables.forEach((variable) => {
                if (variable) {
                  try {
                    this.allVariables.set(variable.id, variable);
                    const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                    this.allVariables.set(formattedName, variable);
                  } catch (error) {
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: `process_variable_${variable.name}`,
                      component: "ComponentService",
                      severity: "low"
                    });
                  }
                }
              });
            }), {
              operation: "collect_all_variables",
              component: "ComponentService",
              severity: "medium"
            });
          });
        }
        static resolveStyleVariables(styles, textElements, componentName) {
          if (!styles || typeof styles !== "object") {
            return styles;
          }
          const resolvedStyles = Object.assign({}, styles);
          Object.keys(styles).forEach((property) => {
            if (styles.hasOwnProperty(property)) {
              const value = styles[property];
              if (typeof value === "string") {
                resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
              }
            }
          });
          if (textElements && textElements.length > 0) {
            textElements.forEach((textElement) => {
              if (textElement.textStyles) {
                Object.keys(textElement.textStyles).forEach((key) => {
                  if (textElement.textStyles.hasOwnProperty(key)) {
                    const value = textElement.textStyles[key];
                    if (value) {
                      const resolvedValue = typeof value === "string" ? this.replaceVariableIdsWithNames(value) : value;
                      const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                      resolvedStyles[kebabKey] = resolvedValue;
                    }
                  }
                });
              }
            });
          }
          return resolvedStyles;
        }
        static replaceVariableIdsWithNames(cssValue) {
          return cssValue.replace(/VariableID:([a-f0-9:]+)\/[\d.]+/g, (match, variableId) => {
            Array.from(this.allVariables.values()).find((variable) => {
              const figmaVariable = variable;
              if (figmaVariable && figmaVariable.id === variableId.replace(/:/g, ":")) {
                const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                return `var(--${formattedName})`;
              }
            });
            return match;
          }).replace(/var\(--[a-f0-9-]+\)/g, (match) => {
            const varId = match.replace(/var\(--([^)]+)\)/, "$1");
            Array.from(this.allVariables.values()).forEach((variable) => {
              const figmaVariable = variable;
              if (figmaVariable && figmaVariable.id && (figmaVariable.id.indexOf(varId) !== -1 || varId.indexOf(figmaVariable.id) !== -1)) {
                const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                return `var(--${formattedName})`;
              }
            });
            return match;
          });
        }
        static extractTextStyles(textElements) {
          if (!textElements || textElements.length === 0) {
            return {};
          }
          const styleKeyMap = {
            "font-size": "fontSize",
            "font-family": "fontFamily",
            "font-weight": "fontWeight",
            "color": "color",
            "line-height": "lineHeight",
            "letter-spacing": "letterSpacing"
          };
          const hexToRgb = (hex) => {
            let cleanHex = hex.substring(1);
            if (cleanHex.length === 3) {
              cleanHex = cleanHex.split("").map((char) => char + char).join("");
            }
            const r = parseInt(cleanHex.substring(0, 2), 16);
            const g = parseInt(cleanHex.substring(2, 4), 16);
            const b = parseInt(cleanHex.substring(4, 6), 16);
            return `rgb(${r}, ${g}, ${b})`;
          };
          return (0, es2015_helpers_1.arrayFlatMap)(textElements.filter((textEl) => textEl.textStyles), (textEl) => (0, es2015_helpers_1.objectEntries)(textEl.textStyles).filter(([_, value]) => value != null && value !== "").map(([styleKey, value]) => {
            const cssProperty = styleKeyMap[styleKey];
            if (!cssProperty)
              return null;
            let expectedValue = String(value);
            if (expectedValue.indexOf("var(") !== -1) {
              const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
              if (fallbackMatch) {
                expectedValue = fallbackMatch[1].trim();
              }
            }
            if (/^#[0-9A-Fa-f]{3,6}$/.test(expectedValue)) {
              expectedValue = hexToRgb(expectedValue);
            }
            return [cssProperty, expectedValue];
          }).filter(Boolean)).reduce((acc, [property, value]) => {
            acc[property] = value;
            return acc;
          }, {});
        }
        static extractCssProperties(styles) {
          const cssProperties = {};
          const collectedStyles = {};
          Object.keys(styles).forEach((key) => {
            if (styles.hasOwnProperty(key)) {
              const value = styles[key];
              let camelCaseKey = key.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
              });
              if (camelCaseKey === "background") {
                camelCaseKey = "backgroundColor";
              }
              collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, value);
            }
          });
          const paddingProps = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft"];
          const marginProps = ["marginTop", "marginRight", "marginBottom", "marginLeft"];
          if (paddingProps.some((prop) => collectedStyles[prop])) {
            cssProperties["padding"] = "computed";
          } else if (collectedStyles.padding) {
            cssProperties["padding"] = String(collectedStyles.padding);
          }
          if (marginProps.some((prop) => collectedStyles[prop])) {
            cssProperties["margin"] = "computed";
          } else if (collectedStyles.margin) {
            cssProperties["margin"] = String(collectedStyles.margin);
          }
          const shorthandSkip = new Set(paddingProps.concat(marginProps));
          Object.keys(collectedStyles).filter((prop) => collectedStyles[prop] && !shorthandSkip.has(prop)).forEach((prop) => {
            cssProperties[prop] = String(collectedStyles[prop]);
          });
          return cssProperties;
        }
        static generatePseudoStateTest(variantProps, cssProperties, kebabName, textStyles = {}) {
          const state = variantProps.state || "default";
          const pseudoClass = `:${state.toLowerCase()}`;
          const propDescriptions = (0, es2015_helpers_1.objectEntries)(variantProps).filter(([key, value]) => key !== "state" && value !== "default").map(([key, value]) => `${key}="${value}"`).join(" ");
          const testDescription = `should have correct :${state.toLowerCase()} styles${propDescriptions ? ` for ${propDescriptions}` : ""}`;
          const allProperties = Object.assign({}, cssProperties, textStyles);
          const testableProperties = Object.keys(allProperties).filter((property) => {
            const expectedValue = allProperties[property];
            if (expectedValue === "computed")
              return false;
            if (expectedValue.indexOf("var(") !== -1) {
              const replaced = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => fallback.trim());
              return replaced !== expectedValue;
            }
            return true;
          });
          if (testableProperties.length === 0) {
            return `
  it('${testDescription}', () => {
    console.log('${testDescription}: No specific values to test');
  });`;
          }
          return `
  it('${testDescription}', () => {
    const propertiesToCheck = [
${testableProperties.map((property) => {
            const expectedValue = allProperties[property];
            let expectedTest = expectedValue;
            if (expectedValue.indexOf("var(") !== -1) {
              expectedTest = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => {
                return fallback.trim();
              });
              if (expectedTest === expectedValue) {
                expectedTest = null;
              }
            }
            expectedTest = expectedTest.replace(/#([0-9A-Fa-f]{3,6})\b/g, (match, hex) => {
              let fullHex = hex;
              if (hex.length === 3) {
                fullHex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(fullHex.substring(0, 2), 16);
              const g = parseInt(fullHex.substring(2, 4), 16);
              const b = parseInt(fullHex.substring(4, 6), 16);
              return `rgb(${r}, ${g}, ${b})`;
            });
            const cssProperty = property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
            const isTextStyle = textStyles.hasOwnProperty(property);
            return `      { 
        property: '${property}', 
        cssProperty: '${cssProperty}', 
        expectedValue: '${expectedTest}'${isTextStyle ? ", isTextStyle: true" : ""} 
      }`;
          }).join(",\n")}
    ];

    propertiesToCheck.forEach((check) => {
      // TODO: please check whether the selector is correct
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.indexOf('var(') !== -1) {
          const actualValue = resolveCssValueWithVariables(resolvedValue);
          expect(actualValue).withContext(check.property).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).withContext(check.property).toBe(check.expectedValue);
        }
      } else {
        // Fallback to computed style if CSS rule not found
        console.log('No CSS rule found for:', check.cssProperty);
        ${Object.keys(variantProps).filter((key) => key !== "state").map((key) => `component.${key} = '${variantProps[key]}';`).join("\n        ")}
        fixture.detectChanges();
        const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.getPropertyValue(check.cssProperty)).withContext(check.property).toBe(check.expectedValue);
      }
    });
  });`;
        }
        static generateComponentPropertyTest(variantProps, cssProperties, kebabName, pascalName, textStyles = {}) {
          const componentProps = [];
          const testDescriptionParts = [];
          (0, es2015_helpers_1.objectEntries)(variantProps).forEach(([propName, propValue]) => {
            if (propValue !== "default") {
              if (propName === "state" && ["hover", "active", "focus", "disabled"].indexOf(propValue.toLowerCase()) !== -1) {
                return;
              }
              let componentPropName = propName;
              if (propName === "variantType" || propName === "variant") {
                componentPropName = "variant";
              }
              componentProps.push(`component.${componentPropName} = '${propValue.toLowerCase()}';`);
              testDescriptionParts.push(`${propName}="${propValue}"`);
            }
          });
          const testDescription = testDescriptionParts.join(" ");
          const testName = testDescription ? `should have correct styles for ${testDescription}` : "should have correct styles";
          return `
  it('${testName}', () => {
    ${componentProps.length > 0 ? `${componentProps.join("\n    ")}
    fixture.detectChanges();
` : ""}
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);

${Object.keys(cssProperties).map((property) => {
            const expectedValue = cssProperties[property];
            let expectedTest = expectedValue;
            if (expectedValue === "computed") {
              return `      // ${property} (shorthand property)
      // expect(computedStyle.${property}).toBe('expected-value');`;
            }
            if (expectedValue.indexOf("var(") !== -1) {
              expectedTest = expectedValue.replace(/var\([^,]+,\s*([^)]+)\)/g, (match, fallback) => {
                return fallback.trim();
              });
              if (expectedTest === expectedValue) {
                return `      // ${property} (CSS variable without fallback)
      // expect(computedStyle.${property}).toBe('expected-value');`;
              }
            }
            expectedTest = expectedTest.replace(/#([0-9A-Fa-f]{3,6})\b/g, (match, hex) => {
              let fullHex = hex;
              if (hex.length === 3) {
                fullHex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(fullHex.substring(0, 2), 16);
              const g = parseInt(fullHex.substring(2, 4), 16);
              const b = parseInt(fullHex.substring(4, 6), 16);
              return `rgb(${r}, ${g}, ${b})`;
            });
            const hasDecimalWarning = this.hasDecimalPixelValues(expectedValue) || expectedValue !== expectedTest && this.hasDecimalPixelValues(expectedTest);
            if (hasDecimalWarning) {
              return `      // Note: Figma may have rounded decimal pixel values - test may fail due to rounding
      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedTest}');`;
            } else {
              return `      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedTest}');`;
            }
          }).join("\n\n")}${Object.keys(textStyles).length > 0 ? "\n\n" + Object.keys(textStyles).map((property) => {
            const expectedValue = textStyles[property];
            return `      expect(computedStyle.${property}).withContext('${property}').toBe('${expectedValue}');`;
          }).join("\n\n") : ""}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
        }
        static extractTextElements(node) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const textElements = [];
              function traverseNode(currentNode) {
                return __awaiter(this, void 0, void 0, function* () {
                  try {
                    if (currentNode.type === "TEXT") {
                      const textNode = currentNode;
                      let textStyles = {};
                      let nodeStyles = {};
                      try {
                        nodeStyles = yield textNode.getCSSAsync();
                        textStyles = {
                          fontSize: nodeStyles["font-size"],
                          fontFamily: nodeStyles["font-family"],
                          fontWeight: nodeStyles["font-weight"],
                          lineHeight: nodeStyles["line-height"],
                          letterSpacing: nodeStyles["letter-spacing"],
                          textAlign: nodeStyles["text-align"],
                          color: nodeStyles["color"],
                          textDecoration: nodeStyles["text-decoration"],
                          textTransform: nodeStyles["text-transform"],
                          fontStyle: nodeStyles["font-style"],
                          fontVariant: nodeStyles["font-variant"],
                          textShadow: nodeStyles["text-shadow"],
                          wordSpacing: nodeStyles["word-spacing"],
                          whiteSpace: nodeStyles["white-space"],
                          textIndent: nodeStyles["text-indent"],
                          textOverflow: nodeStyles["text-overflow"]
                        };
                        Object.keys(textStyles).forEach((key) => {
                          if (textStyles[key] == null || textStyles[key] === "") {
                            delete textStyles[key];
                          }
                        });
                      } catch (styleError) {
                        errorHandler_1.ErrorHandler.handleError(styleError, {
                          operation: `get_text_styles_${textNode.id}`,
                          component: "ComponentService",
                          severity: "low"
                        });
                      }
                      try {
                        const textElement = {
                          id: textNode.id,
                          content: textNode.characters || "",
                          type: "TEXT",
                          styles: nodeStyles,
                          textStyles
                        };
                        textElements.push(textElement);
                      } catch (elementError) {
                        errorHandler_1.ErrorHandler.handleError(elementError, {
                          operation: `create_text_element_${textNode.id}`,
                          component: "ComponentService",
                          severity: "low"
                        });
                      }
                    }
                    if ("children" in currentNode) {
                      for (const child of currentNode.children) {
                        yield traverseNode(child);
                      }
                    }
                  } catch (nodeError) {
                    errorHandler_1.ErrorHandler.handleError(nodeError, {
                      operation: `traverse_text_node_${currentNode.id}`,
                      component: "ComponentService",
                      severity: "low"
                    });
                  }
                });
              }
              yield traverseNode(node);
              return textElements;
            }), {
              operation: "extract_text_elements",
              component: "ComponentService",
              severity: "medium"
            });
          });
        }
      };
      exports.ComponentService = ComponentService;
      ComponentService.componentMap = /* @__PURE__ */ new Map();
      ComponentService.allVariables = /* @__PURE__ */ new Map();
      ComponentService.styleCache = /* @__PURE__ */ new Map();
      ComponentService.testCache = /* @__PURE__ */ new Map();
      ComponentService.nameCache = /* @__PURE__ */ new Map();
      ComponentService.MAX_CACHE_SIZE = 1e3;
      ComponentService.CACHE_CLEANUP_THRESHOLD = 800;
    }
  });

  // dist/core/plugin.js
  var require_plugin = __commonJS({
    "dist/core/plugin.js"(exports) {
      "use strict";
      var __awaiter = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
          return value instanceof P ? value : new P(function(resolve) {
            resolve(value);
          });
        }
        return new (P || (P = Promise))(function(resolve, reject) {
          function fulfilled(value) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value) {
            try {
              step(generator["throw"](value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result) {
            result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var gitlabService_1 = require_gitlabService();
      var cssExportService_1 = require_cssExportService();
      var componentService_1 = require_componentService();
      var config_1 = require_config();
      figma.showUI(__html__, { width: 1e3, height: 900, themeColors: true });
      function collectDocumentData() {
        return __awaiter(this, void 0, void 0, function* () {
          const variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
          const variablesData = [];
          const sortedCollections = variableCollections.sort((a, b) => a.name.localeCompare(b.name));
          for (const collection of sortedCollections) {
            const variablesPromises = collection.variableIds.map((id) => __awaiter(this, void 0, void 0, function* () {
              const variable = yield figma.variables.getVariableByIdAsync(id);
              if (!variable)
                return null;
              const valuesByModeEntries = [];
              Object.keys(variable.valuesByMode).forEach((modeId) => {
                const value = variable.valuesByMode[modeId];
                const mode = collection.modes.find((m) => m.modeId === modeId);
                valuesByModeEntries.push({
                  modeName: mode ? mode.name : "Unknown",
                  value
                });
              });
              return {
                id: variable.id,
                name: variable.name,
                resolvedType: variable.resolvedType,
                valuesByMode: valuesByModeEntries
              };
            }));
            const variablesResult = yield Promise.all(variablesPromises);
            const variables = variablesResult.filter((item) => item !== null);
            variablesData.push({
              name: collection.name,
              variables
            });
          }
          const componentsData = yield componentService_1.ComponentService.collectComponents();
          figma.ui.postMessage({
            type: "document-data",
            variablesData,
            componentsData
          });
        });
      }
      function loadSavedGitLabSettings() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const settings = yield gitlabService_1.GitLabService.loadSettings();
            if (settings) {
              figma.ui.postMessage({
                type: "gitlab-settings-loaded",
                settings
              });
            }
          } catch (error) {
            console.error("Error loading GitLab settings:", error);
          }
        });
      }
      collectDocumentData();
      loadSavedGitLabSettings();
      figma.codegen.on("generate", (_event) => {
        try {
          return [
            {
              language: "PLAINTEXT",
              code: "Bridgy - Use the plugin interface to view variables and components",
              title: "Bridgy"
            }
          ];
        } catch (error) {
          console.error("Plugin error:", error);
          return [
            {
              language: "PLAINTEXT",
              code: "Error occurred during code generation",
              title: "Error"
            }
          ];
        }
      });
      figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
        try {
          switch (msg.type) {
            case "export-css":
              const format = msg.exportFormat || "css";
              const cssContent = yield cssExportService_1.CSSExportService.exportVariables(format);
              figma.ui.postMessage({
                type: "css-export",
                cssData: cssContent,
                shouldDownload: msg.shouldDownload,
                exportFormat: format
              });
              break;
            case "generate-test":
              if (!msg.componentId) {
                throw new Error(`Missing required component ID`);
              }
              const component = componentService_1.ComponentService.getComponentById(msg.componentId);
              if (!component) {
                throw new Error(`Component with ID ${msg.componentId} not found`);
              }
              const testContent = componentService_1.ComponentService.generateTest(
                component,
                msg.includeStateTests !== false
                // Default to true
              );
              figma.ui.postMessage({
                type: "test-generated",
                componentName: msg.componentName || component.name,
                testContent,
                isComponentSet: component.type === "COMPONENT_SET",
                forCommit: msg.forCommit
              });
              break;
            case "save-gitlab-settings":
              yield gitlabService_1.GitLabService.saveSettings({
                gitlabUrl: msg.gitlabUrl,
                projectId: msg.projectId || "",
                gitlabToken: msg.gitlabToken,
                filePath: msg.filePath || "src/variables.css",
                testFilePath: msg.testFilePath || "components/{componentName}.spec.ts",
                strategy: msg.strategy || "merge-request",
                branchName: msg.branchName || "feature/variables",
                testBranchName: msg.testBranchName || "feature/component-tests",
                exportFormat: msg.exportFormat || "css",
                saveToken: msg.saveToken || false,
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
              }, msg.shareWithTeam || false);
              figma.ui.postMessage({
                type: "gitlab-settings-saved",
                success: true,
                sharedWithTeam: msg.shareWithTeam
              });
              break;
            case "commit-to-gitlab":
              if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
                throw new Error("Missing required fields for GitLab commit");
              }
              try {
                const settings = {
                  gitlabUrl: msg.gitlabUrl,
                  projectId: msg.projectId,
                  gitlabToken: msg.gitlabToken,
                  filePath: msg.filePath || "variables.css",
                  testFilePath: "components/{componentName}.spec.ts",
                  // Default value
                  strategy: "merge-request",
                  // Default value  
                  branchName: msg.branchName || "feature/variables",
                  testBranchName: "feature/component-tests",
                  // Default value
                  exportFormat: "css",
                  // Default value
                  saveToken: false,
                  // Default value
                  savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                  savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
                };
                const result = yield gitlabService_1.GitLabService.commitToGitLab(settings, msg.commitMessage, msg.filePath || "variables.css", msg.cssData, msg.branchName || "feature/variables");
                figma.ui.postMessage({
                  type: "commit-success",
                  message: config_1.SUCCESS_MESSAGES.COMMIT_SUCCESS,
                  mergeRequestUrl: result && result.mergeRequestUrl
                });
              } catch (error) {
                let errorMessage = "Unknown error occurred";
                let errorType = "unknown";
                if (error.name === "GitLabAuthError") {
                  errorType = "auth";
                  errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
                } else if (error.name === "GitLabNetworkError") {
                  errorType = "network";
                  errorMessage = "Network error. Please check your internet connection and GitLab server availability.";
                } else if (error.name === "GitLabAPIError") {
                  if (error.statusCode === 401 || error.statusCode === 403) {
                    errorType = "auth";
                    errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
                  } else {
                    errorType = "api";
                    if (error.statusCode === 404) {
                      errorMessage = "Project not found. Please check your project ID.";
                    } else if (error.statusCode === 422) {
                      errorMessage = "Invalid data provided. Please check your settings and try again.";
                    } else if (error.statusCode === 429) {
                      errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
                    } else {
                      errorMessage = error.message || "GitLab API error occurred.";
                    }
                  }
                } else {
                  errorMessage = error.message || "Unknown error occurred";
                }
                figma.ui.postMessage({
                  type: "commit-error",
                  error: errorMessage,
                  errorType,
                  statusCode: error.statusCode
                });
              }
              break;
            case "commit-component-test":
              if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.testContent || !msg.componentName) {
                throw new Error("Missing required fields for component test commit");
              }
              try {
                const settings = {
                  gitlabUrl: msg.gitlabUrl,
                  projectId: msg.projectId,
                  gitlabToken: msg.gitlabToken,
                  filePath: "variables.css",
                  // Default value
                  testFilePath: msg.testFilePath || "components/{componentName}.spec.ts",
                  strategy: "merge-request",
                  // Default value  
                  branchName: "feature/variables",
                  // Default value
                  testBranchName: msg.branchName || "feature/component-tests",
                  exportFormat: "css",
                  // Default value
                  saveToken: false,
                  // Default value
                  savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                  savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
                };
                const testResult = yield gitlabService_1.GitLabService.commitComponentTest(settings, msg.commitMessage, msg.componentName, msg.testContent, msg.testFilePath || "components/{componentName}.spec.ts", msg.branchName || "feature/component-tests");
                figma.ui.postMessage({
                  type: "test-commit-success",
                  message: config_1.SUCCESS_MESSAGES.TEST_COMMIT_SUCCESS,
                  componentName: msg.componentName,
                  mergeRequestUrl: testResult && testResult.mergeRequestUrl
                });
              } catch (error) {
                let errorMessage = "Unknown error occurred";
                let errorType = "unknown";
                if (error.name === "GitLabAuthError") {
                  errorType = "auth";
                  errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
                } else if (error.name === "GitLabNetworkError") {
                  errorType = "network";
                  errorMessage = "Network error. Please check your internet connection and GitLab server availability.";
                } else if (error.name === "GitLabAPIError") {
                  if (error.statusCode === 401 || error.statusCode === 403) {
                    errorType = "auth";
                    errorMessage = "Authentication failed. Please check your GitLab token and permissions.";
                  } else {
                    errorType = "api";
                    if (error.statusCode === 404) {
                      errorMessage = "Project not found. Please check your project ID.";
                    } else if (error.statusCode === 422) {
                      errorMessage = "Invalid data provided. Please check your settings and try again.";
                    } else if (error.statusCode === 429) {
                      errorMessage = "Rate limit exceeded. Please try again in a few minutes.";
                    } else {
                      errorMessage = error.message || "GitLab API error occurred.";
                    }
                  }
                } else {
                  errorMessage = error.message || "Unknown error occurred";
                }
                figma.ui.postMessage({
                  type: "test-commit-error",
                  error: errorMessage,
                  errorType,
                  componentName: msg.componentName,
                  statusCode: error.statusCode
                });
              }
              break;
            case "reset-gitlab-settings":
              yield gitlabService_1.GitLabService.resetSettings();
              figma.ui.postMessage({
                type: "gitlab-settings-reset",
                success: true
              });
              break;
            case "get-unit-settings":
              const unitSettingsData = yield cssExportService_1.CSSExportService.getUnitSettingsData();
              figma.ui.postMessage({
                type: "unit-settings-data",
                data: unitSettingsData
              });
              break;
            case "update-unit-settings":
              cssExportService_1.CSSExportService.updateUnitSettings({
                collections: msg.collections,
                groups: msg.groups
              });
              yield cssExportService_1.CSSExportService.saveUnitSettings();
              figma.ui.postMessage({
                type: "unit-settings-updated",
                success: true
              });
              break;
            case "resize-plugin":
              break;
            default:
          }
        } catch (error) {
          console.error("Error handling message:", error);
          figma.ui.postMessage({
            type: "error",
            message: error.message || "Unknown error occurred"
          });
        }
      });
    }
  });

  // dist/index.js
  var require_index = __commonJS({
    "dist/index.js"(exports) {
      Object.defineProperty(exports, "__esModule", { value: true });
      require_plugin();
    }
  });
  require_index();
})();
