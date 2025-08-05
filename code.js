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
      exports.NUMERIC_CONSTANTS = exports.PLUGIN_CONFIG = exports.FILE_PATHS = exports.GIT_CONFIG = exports.API_CONFIG = void 0;
      exports.API_CONFIG = {
        GITLAB_BASE_URL: "https://gitlab.fhnw.ch/api/v4",
        REQUEST_TIMEOUT: 3e4,
        DEFAULT_HEADERS: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        }
      };
      exports.GIT_CONFIG = {
        DEFAULT_BRANCH: "feature/variables",
        DEFAULT_TEST_BRANCH: "feature/component-tests",
        DEFAULT_COMMIT_PATTERNS: {
          variables: "Update CSS variables from Figma",
          tests: "Add component test for {componentName}"
        }
      };
      exports.FILE_PATHS = {
        DEFAULT_CSS_PATH: "src/variables.css",
        DEFAULT_TEST_PATH: "components/{componentName}.spec.ts",
        STORAGE_KEY_PATTERNS: {
          gitlab: "gitlab-settings-{fileId}",
          units: "unit-settings-{fileId}",
          meta: "{key}-meta",
          token: "{key}-token"
        }
      };
      exports.PLUGIN_CONFIG = {
        NAME: "DesignSync",
        UI_WIDTH: 850,
        UI_HEIGHT: 800,
        SUPPORTED_FORMATS: ["css", "scss"]
      };
      exports.NUMERIC_CONSTANTS = {
        RGB_MULTIPLIER: 255,
        ALPHA_PRECISION: 2,
        DEFAULT_TIMEOUT: 3e4,
        MAX_RETRIES: 3
      };
    }
  });

  // dist/config/css.js
  var require_css = __commonJS({
    "dist/config/css.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CSS_PROPERTIES = exports.CSS_UNITS = exports.CSS_CONFIG = void 0;
      exports.CSS_CONFIG = {
        PREFIXES: {
          CSS_VARIABLE: "--",
          SCSS_VARIABLE: "$"
        },
        DEFAULT_FORMAT: "css",
        COLOR_CONVERSION: {
          RGB_MULTIPLIER: 255,
          ALPHA_PRECISION: 2
        }
      };
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
        UNITLESS_PATTERNS: [
          "opacity",
          "z-index",
          "line-height",
          "font-weight",
          "flex",
          "order"
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
        ],
        // Size-related properties for responsive testing
        TESTABLE_SIZE: [
          "padding",
          "font-size",
          "line-height",
          "border-radius",
          "gap"
        ],
        // Size properties that should be commented out in tests
        COMMENTED_SIZE: [
          "width",
          "height",
          "min-width",
          "min-height",
          "max-width",
          "max-height",
          "justify-content",
          "justifyContent",
          "align-items",
          "alignItems",
          "display",
          "flex-direction",
          "flexDirection",
          "position",
          "top",
          "left",
          "right",
          "bottom"
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
        SELECTORS: {
          DEFAULT_ELEMENTS: "button, div, span, a, p, h1, h2, h3, h4, h5, h6",
          COMPONENT_PATTERN: ".{componentName}",
          SIZE_MODIFIER_PATTERNS: ["{selector}--{size}", "{selector}.{size}"]
        },
        STATES: {
          PSEUDO: ["hover", "active", "focus", "disabled"],
          CUSTOM: ["loading", "error", "success"],
          INTERACTIVE: ["hover", "active", "focus", "disabled"]
        },
        SIZES: {
          STANDARD: ["xs", "sm", "md", "base", "lg", "xl", "xxl"],
          ALTERNATIVE: ["small", "medium", "large", "x-small", "x-large"],
          DEFAULT_SET: ["sm", "base", "lg", "xl"]
        },
        IMPORTS: {
          ANGULAR_TESTING: "@angular/core/testing",
          ANGULAR_CORE: "@angular/core"
        },
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
          SIZE: /Size=([^,]+)/i,
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
      exports.WARNING_MESSAGES = exports.INFO_MESSAGES = exports.SUCCESS_MESSAGES = exports.ERROR_MESSAGES = void 0;
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
        COMMIT_SUCCESS: "Successfully committed changes to the feature branch",
        TEST_COMMIT_SUCCESS: "Successfully committed component test to the feature branch",
        SETTINGS_SAVED: "Settings saved successfully",
        EXPORT_COMPLETE: "Export completed successfully",
        BRANCH_CREATED: "Feature branch created successfully",
        MERGE_REQUEST_CREATED: "Merge request created successfully",
        UNIT_SETTINGS_SAVED: "Unit settings saved successfully",
        UNIT_SETTINGS_RESET: "Unit settings reset successfully"
      };
      exports.INFO_MESSAGES = {
        NO_VARIANTS_FOUND: "No variants found for component",
        NO_SIZE_VARIANTS: "No size variants found, returning empty string",
        NO_TEXT_ELEMENT: "No text element found for style testing",
        NO_SUITABLE_ELEMENT: "No suitable element found to test styles",
        USING_FALLBACK: "Using fallback approach for {feature}",
        MIGRATION_COMPLETE: "Settings migration completed",
        LEGACY_CLEANUP: "Legacy settings cleaned up"
      };
      exports.WARNING_MESSAGES = {
        DEPRECATED_FEATURE: "This feature is deprecated and will be removed in a future version",
        INCOMPLETE_DATA: "Some data may be incomplete",
        PERFORMANCE_WARNING: "This operation may take a while for large components",
        BROWSER_COMPATIBILITY: "Some features may not work in older browsers"
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
      var DEFAULT_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_BRANCH;
      var DEFAULT_TEST_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_TEST_BRANCH;
      var REQUEST_TIMEOUT = config_1.API_CONFIG.REQUEST_TIMEOUT;
      var GitLabAPIError = class extends Error {
        constructor(message, statusCode, response) {
          super(message);
          this.statusCode = statusCode;
          this.response = response;
          this.name = "GitLabAPIError";
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
              if (shareWithTeam) {
                const settingsToSave = Object.assign({}, settings);
                if (!settings.saveToken) {
                  delete settingsToSave.gitlabToken;
                }
                figma.root.setSharedPluginData("DesignSync", settingsKey, JSON.stringify(settingsToSave));
                if (settings.saveToken && settings.gitlabToken) {
                  yield figma.clientStorage.setAsync(`${settingsKey}-token`, settings.gitlabToken);
                }
              } else {
                yield figma.clientStorage.setAsync(settingsKey, settings);
              }
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, JSON.stringify({
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
              const documentSettings = figma.root.getSharedPluginData("DesignSync", settingsKey);
              if (documentSettings) {
                try {
                  const settings = JSON.parse(documentSettings);
                  if (settings.saveToken && !settings.gitlabToken) {
                    const personalToken = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
                    if (personalToken) {
                      settings.gitlabToken = personalToken;
                    }
                  }
                  const metaData = figma.root.getSharedPluginData("DesignSync", `${settingsKey}-meta`);
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
                }
              }
              const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
              if (personalSettings) {
                return Object.assign({}, personalSettings, { isPersonal: true });
              }
              const legacyDocumentSettings = figma.root.getSharedPluginData("DesignSync", "gitlab-settings");
              if (legacyDocumentSettings) {
                try {
                  const settings = JSON.parse(legacyDocumentSettings);
                  yield this.saveSettings(settings, true);
                  figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
                  return settings;
                } catch (parseError) {
                  config_1.LoggingService.error("Error parsing legacy document settings", parseError, config_1.LoggingService.CATEGORIES.GITLAB);
                }
              }
              return null;
            } catch (error) {
              config_1.LoggingService.error("Error loading GitLab settings", error, config_1.LoggingService.CATEGORIES.GITLAB);
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
              figma.root.setSharedPluginData("DesignSync", settingsKey, "");
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
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
        static commitToGitLab(projectId_1, gitlabToken_1, commitMessage_1, filePath_1, cssData_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, commitMessage, filePath, cssData, branchName = DEFAULT_BRANCH_NAME) {
            this.validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData);
            try {
              const featureBranch = branchName;
              const projectData = yield this.fetchProjectInfo(projectId, gitlabToken);
              const defaultBranch = projectData.default_branch;
              yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch);
              const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch);
              yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, fileData && fileData.last_commit_id);
              const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch);
              if (!existingMR) {
                const newMR = yield this.createMergeRequest(projectId, gitlabToken, featureBranch, defaultBranch, commitMessage);
                return { mergeRequestUrl: newMR.web_url };
              }
              return { mergeRequestUrl: existingMR.web_url };
            } catch (error) {
              config_1.LoggingService.error("Error committing to GitLab", error, config_1.LoggingService.CATEGORIES.GITLAB);
              throw this.handleGitLabError(error, "commit to GitLab");
            }
          });
        }
        /**
         * Validate commit parameters
         */
        static validateCommitParameters(projectId, gitlabToken, commitMessage, filePath, cssData) {
          if (!projectId || !projectId.trim()) {
            throw new Error("Project ID is required");
          }
          if (!gitlabToken || !gitlabToken.trim()) {
            throw new GitLabAuthError("GitLab token is required");
          }
          if (!commitMessage || !commitMessage.trim()) {
            throw new Error("Commit message is required");
          }
          if (!filePath || !filePath.trim()) {
            throw new Error("File path is required");
          }
          if (!cssData || !cssData.trim()) {
            throw new Error("CSS data is required");
          }
        }
        /**
         * Fetch project information from GitLab API
         */
        static fetchProjectInfo(projectId, gitlabToken) {
          return __awaiter(this, void 0, void 0, function* () {
            const projectUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}`;
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
        static createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const createBranchUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/branches`;
            try {
              const response = yield this.makeAPIRequest(createBranchUrl, {
                method: "POST",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS),
                body: JSON.stringify({
                  branch: featureBranch,
                  ref: defaultBranch
                })
              });
              if (!response.ok) {
                const errorData = yield response.json();
                if (errorData.message !== "Branch already exists") {
                  throw new GitLabAPIError(`Failed to create branch '${featureBranch}': ${errorData.message || "Unknown error"}`, response.status, errorData);
                }
              }
            } catch (error) {
              if (error instanceof GitLabAPIError) {
                throw error;
              }
              throw this.handleGitLabError(error, `create branch '${featureBranch}'`);
            }
          });
        }
        /**
         * Check if file exists and prepare commit action
         */
        static prepareFileCommit(projectId, gitlabToken, filePath, featureBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const checkFileUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}?ref=${encodeURIComponent(featureBranch)}`;
            try {
              const response = yield this.makeAPIRequest(checkFileUrl, {
                method: "GET",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS)
              });
              const fileExists = response.ok;
              let fileData = null;
              let action = "create";
              if (fileExists) {
                fileData = yield response.json();
                action = "update";
              }
              return { fileData, action };
            } catch (error) {
              if (error.statusCode === 404) {
                return { fileData: null, action: "create" };
              }
              throw this.handleGitLabError(error, "check file existence");
            }
          });
        }
        /**
         * Create a commit with the file changes
         */
        static createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, lastCommitId) {
          return __awaiter(this, void 0, void 0, function* () {
            const commitUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/repository/commits`;
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
              if (!response.ok) {
                const errorData = yield response.json();
                throw new GitLabAPIError(errorData.message || "Failed to commit to GitLab", response.status, errorData);
              }
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
        static findExistingMergeRequest(projectId, gitlabToken, sourceBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const mrUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/merge_requests?source_branch=${encodeURIComponent(sourceBranch)}&state=opened`;
            try {
              const response = yield this.makeAPIRequest(mrUrl, {
                method: "GET",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS)
              });
              if (!response.ok) {
                throw new GitLabAPIError("Failed to fetch merge requests", response.status);
              }
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
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, sourceBranch, targetBranch, title, description = "Automatically created merge request for CSS variables update") {
            const mrUrl = `${this.GITLAB_API_BASE}/projects/${encodeURIComponent(projectId)}/merge_requests`;
            try {
              const response = yield this.makeAPIRequest(mrUrl, {
                method: "POST",
                headers: Object.assign({
                  "PRIVATE-TOKEN": gitlabToken
                }, this.DEFAULT_HEADERS),
                body: JSON.stringify({
                  source_branch: sourceBranch,
                  target_branch: targetBranch,
                  title,
                  description,
                  remove_source_branch: true,
                  squash: true
                })
              });
              if (!response.ok) {
                const errorData = yield response.json();
                throw new GitLabAPIError(errorData.message || "Failed to create merge request", response.status, errorData);
              }
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
        static commitComponentTest(projectId_1, gitlabToken_1, commitMessage_1, componentName_1, testContent_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, commitMessage, componentName, testContent, testFilePath = "components/{componentName}.spec.ts", branchName = DEFAULT_TEST_BRANCH_NAME) {
            this.validateComponentTestParameters(projectId, gitlabToken, commitMessage, componentName, testContent);
            try {
              const normalizedComponentName = this.normalizeComponentName(componentName);
              const filePath = testFilePath.replace(/{componentName}/g, normalizedComponentName);
              const featureBranch = `${branchName}-${normalizedComponentName}`;
              const projectData = yield this.fetchProjectInfo(projectId, gitlabToken);
              const defaultBranch = projectData.default_branch || "main";
              yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch);
              const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch);
              yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, testContent, action, fileData && fileData.last_commit_id);
              const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch);
              if (!existingMR) {
                const mrDescription = `Automatically created merge request for component test: ${componentName}`;
                const newMR = yield this.createMergeRequest(projectId, gitlabToken, featureBranch, defaultBranch, commitMessage, mrDescription);
                return { mergeRequestUrl: newMR.web_url };
              }
              return { mergeRequestUrl: existingMR.web_url };
            } catch (error) {
              config_1.LoggingService.error("Error committing component test", error, config_1.LoggingService.CATEGORIES.GITLAB);
              throw this.handleGitLabError(error, "commit component test");
            }
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
            try {
              const response = yield fetch(url, options);
              return response;
            } catch (error) {
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
      GitLabService.GITLAB_API_BASE = config_1.API_CONFIG.GITLAB_BASE_URL;
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
          const isUnitless = config_1.CSS_UNITS.UNITLESS_PATTERNS.some((pattern) => name.indexOf(pattern) !== -1 || name.indexOf(pattern.replace("-", "")) !== -1);
          if (isUnitless) {
            return "none";
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
        static resetUnitSettingsInMemory() {
          this.unitSettings = {
            collections: {},
            groups: {}
          };
        }
        static formatValueWithUnit(value, unit) {
          if (unit === "none" || unit === "") {
            return String(value);
          }
          return `${value}${unit}`;
        }
        // Save unit settings to shared Figma storage (accessible by all team members)
        static saveUnitSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              figma.root.setSharedPluginData("DesignSync", settingsKey, JSON.stringify(this.unitSettings));
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, JSON.stringify({
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
              const sharedSettings = figma.root.getSharedPluginData("DesignSync", settingsKey);
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
              figma.root.setSharedPluginData("DesignSync", settingsKey, "");
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");
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
      UnitsService.AVAILABLE_UNITS = config_1.CSS_UNITS.AVAILABLE;
      UnitsService.DEFAULT_UNIT_PATTERNS = function() {
        var patterns = {};
        for (var i = 0; i < config_1.CSS_UNITS.UNITLESS_PATTERNS.length; i++) {
          var pattern = config_1.CSS_UNITS.UNITLESS_PATTERNS[i];
          patterns[pattern] = "none";
        }
        patterns["default"] = config_1.CSS_UNITS.DEFAULT;
        return patterns;
      }();
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
      var CSS_VARIABLE_PREFIX = "--";
      var SCSS_VARIABLE_PREFIX = "$";
      var DEFAULT_FORMAT = "css";
      var CSSExportService = class {
        /**
         * Export variables in the specified format (CSS or SCSS)
         */
        static exportVariables() {
          return __awaiter(this, arguments, void 0, function* (format = DEFAULT_FORMAT) {
            try {
              yield this.initialize();
              const collections = yield this.getProcessedCollections();
              return this.buildExportContent(collections, format);
            } catch (error) {
              console.error("Error exporting CSS:", error);
              throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
            }
          });
        }
        /**
         * Initialize the service by clearing caches and loading settings
         */
        static initialize() {
          return __awaiter(this, void 0, void 0, function* () {
            this.clearCaches();
            yield unitsService_1.UnitsService.loadUnitSettings();
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
            const collections = yield figma.variables.getLocalVariableCollectionsAsync();
            yield this.populateVariableCache(collections);
            const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
            const processedCollections = [];
            for (const collection of sortedCollections) {
              const processed = yield this.processCollection(collection);
              if (processed.variables.length > 0 || Object.keys(processed.groups).length > 0) {
                processedCollections.push(processed);
              }
            }
            return processedCollections;
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
            for (const variableId of collection.variableIds) {
              const cssVariable = yield this.processVariable(variableId, collection);
              if (!cssVariable)
                continue;
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
            }
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
          for (const collection of collections) {
            contentParts.push(this.buildCollectionContent(collection, format));
          }
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
          for (const variable of collection.variables) {
            parts.push(this.formatVariableDeclaration(variable, format));
          }
          const sortedGroupNames = Object.keys(collection.groups).sort();
          for (const groupName of sortedGroupNames) {
            const displayName = this.formatGroupDisplayName(groupName);
            parts.push(`
${commentPrefix} ${displayName}${commentSuffix}`);
            for (const variable of collection.groups[groupName]) {
              parts.push(this.formatVariableDeclaration(variable, format));
            }
          }
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
            for (const collection of collections) {
              for (const variableId of collection.variableIds) {
                const variable = yield figma.variables.getVariableByIdAsync(variableId);
                if (variable) {
                  this.variableCache.set(variable.id, variable);
                }
              }
            }
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
            yield unitsService_1.UnitsService.loadUnitSettings();
            const collections = yield figma.variables.getLocalVariableCollectionsAsync();
            const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
            const collectionsData = [];
            const groupsData = [];
            const unitSettings = unitsService_1.UnitsService.getUnitSettings();
            for (const collection of sortedCollections) {
              const hasCollectionSetting = unitSettings.collections[collection.name] !== void 0;
              const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : "Smart defaults";
              const currentUnit = unitSettings.collections[collection.name] || "";
              collectionsData.push({
                name: collection.name,
                defaultUnit,
                currentUnit
              });
              const groups = /* @__PURE__ */ new Set();
              for (const variableId of collection.variableIds) {
                const variable = yield figma.variables.getVariableByIdAsync(variableId);
                if (variable) {
                  const pathMatch = variable.name.match(/^([^\/]+)\//);
                  if (pathMatch) {
                    groups.add(pathMatch[1]);
                  }
                }
              }
              for (const groupName of Array.from(groups).sort()) {
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
              }
            }
            return { collections: collectionsData, groups: groupsData };
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
      exports.SIZE_PROPERTIES = exports.SIZE_VARIANTS = exports.INTERACTIVE_STATES = exports.STATE_SPECIFIC_PROPERTIES = exports.STATIC_PROPERTIES = exports.INTERACTIVE_PROPERTIES = void 0;
      exports.shouldTestPropertyForState = shouldTestPropertyForState;
      exports.toKebabCase = toKebabCase;
      exports.toCamelCase = toCamelCase;
      exports.generateTestHelpers = generateTestHelpers;
      exports.generateStateTests = generateStateTests;
      exports.generateSizeVariantTests = generateSizeVariantTests;
      exports.filterInteractiveProperties = filterInteractiveProperties;
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
      exports.SIZE_VARIANTS = ["sm", "base", "lg", "xl"];
      exports.SIZE_PROPERTIES = [
        "padding",
        "font-size",
        "line-height",
        "height",
        "min-height",
        "width",
        "min-width"
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
      .find(sheet => sheet.href && sheet.href.indexOf(stylesheetHrefPart) !== -1);

    const rootRule = Array.from(targetSheet && targetSheet.cssRules ? targetSheet.cssRules : [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule && rootRule.style ? rootRule.style.getPropertyValue(variableName) : undefined;
    const trimmedValue = value ? value.trim() : undefined;

    if (trimmedValue && trimmedValue.startsWith('var(')) {
      const varMatch = trimmedValue.match(/var\\((--.+?)\\)/);
      const nestedVar = varMatch ? varMatch[1] : undefined;
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }
    return trimmedValue;
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: string): string | undefined => {
    // Regex necessary because Angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const foundRuleCandidate = Array.from(document.styleSheets)
      .reduce((acc, sheet) => acc.concat(Array.from(sheet.cssRules || [])), [])
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText));
    
    const foundRuleStyle = foundRuleCandidate ? foundRuleCandidate.style : undefined;

    return foundRuleStyle ? foundRuleStyle.getPropertyValue(prop) : undefined;
  };

  const checkStyleProperty = (selector: string, pseudoClass: string, property: string, expectedValue?: string) => {
    const value = getCssPropertyForRule(selector, pseudoClass, property);
    if (!value) {
      // If no value is found for this pseudo-class, that's okay - not all states need all properties
      return;
    }

    if (value.startsWith('var(')) {
      const varMatch = value.match(/var\\((--.+?)\\)/);
      const variableName = varMatch ? varMatch[1] : undefined;
      const resolvedValue = variableName ? resolveCssVariable(variableName) : undefined;
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
      function generateSizeVariantTests(componentSelector, componentName) {
        const sizeTests = [];
        const testCode = `
  it('should have correct styles for different sizes', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Test size variants by checking for size-specific CSS classes or attributes
    const sizeVariants = ['sm', 'base', 'lg', 'xl'];
    const sizeProperties = ['padding', 'font-size', 'height', 'min-height'];
    
    sizeVariants.forEach(size => {
      // Check if this size variant has specific styles
      const sizeSelector = \`${componentSelector}--\${size}\`; // BEM naming
      const altSizeSelector = \`${componentSelector}.\${size}\`;  // Alternative naming
      
      sizeProperties.forEach(property => {
        // TODO: Please check if these selectors still match the component's implementation
        const bemValue = getCssPropertyForRule(sizeSelector, '', property);
        const altValue = getCssPropertyForRule(altSizeSelector, '', property);
        
        if (bemValue || altValue) {
          const value = bemValue || altValue;
          console.log(\`Size \${size} - \${property}: \${value}\`);
          expect(value).toBeDefined();
        }
      });
    });
  });`;
        return testCode;
      }
      function filterInteractiveProperties(styles) {
        const filtered = {};
        for (const key in styles) {
          if (styles.hasOwnProperty(key) && shouldTestPropertyForState(key)) {
            filtered[key] = styles[key];
          }
        }
        return filtered;
      }
      function analyzeComponentStateVariants(variants) {
        console.log("DEBUG: analyzeComponentStateVariants called with", variants.length, "variants");
        const stateStyleMap = /* @__PURE__ */ new Map();
        variants.forEach((variant, index) => {
          console.log(`DEBUG: Processing variant ${index}: "${variant.name}"`);
          const stateName = extractStateFromVariantName(variant.name);
          console.log(`DEBUG: Extracted state name: "${stateName}"`);
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
          console.log(`DEBUG: Stored ${styleMap.size} styles for state "${stateName}"`);
        });
        console.log("DEBUG: Final state style map has", stateStyleMap.size, "states:", Array.from(stateStyleMap.keys()));
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

  // dist/utils/sizeVariantUtils.js
  var require_sizeVariantUtils = __commonJS({
    "dist/utils/sizeVariantUtils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.generateSizeVariantTests = generateSizeVariantTests;
      exports.generateBasicSizeTests = generateBasicSizeTests;
      var config_1 = require_config();
      var es2015_helpers_1 = require_es2015_helpers();
      var TESTABLE_SIZE_PROPERTIES = config_1.CSS_PROPERTIES.TESTABLE_SIZE;
      var COMMENTED_SIZE_PROPERTIES = config_1.CSS_PROPERTIES.COMMENTED_SIZE;
      function generateSizeVariantTests(componentSelector, componentName, allVariants) {
        config_1.LoggingService.debug("generateSizeVariantTests called", {
          componentSelector,
          componentName,
          variantCount: allVariants ? allVariants.length : 0,
          variants: allVariants ? allVariants.map((v) => v.name) : "none"
        }, config_1.LoggingService.CATEGORIES.TESTING);
        const sizeVariantMap = /* @__PURE__ */ new Map();
        if (allVariants && allVariants.length > 0) {
          allVariants.forEach((variant) => {
            config_1.LoggingService.debug("Checking variant", { variantName: variant.name }, config_1.LoggingService.CATEGORIES.TESTING);
            const sizeMatch = variant.name.match(config_1.PATTERNS.COMPONENT_NAME.SIZE);
            const stateMatch = variant.name.match(config_1.PATTERNS.COMPONENT_NAME.STATE);
            config_1.LoggingService.debug("Size match result", { sizeMatch, variant: variant.name }, config_1.LoggingService.CATEGORIES.TESTING);
            if (sizeMatch) {
              const sizeName = sizeMatch[1].toLowerCase();
              const stateName = stateMatch && stateMatch[1] ? stateMatch[1].toLowerCase() : "default";
              config_1.LoggingService.debug("Found size variant", { sizeName, stateName }, config_1.LoggingService.CATEGORIES.TESTING);
              let styles;
              try {
                styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
              } catch (e) {
                config_1.LoggingService.error("Error parsing variant styles", e, config_1.LoggingService.CATEGORIES.TESTING);
                styles = {};
              }
              const existingVariants = sizeVariantMap.get(sizeName) || [];
              existingVariants.push({
                name: sizeName,
                selector: `${componentSelector}--${sizeName}`,
                // BEM naming convention
                expectedStyles: styles,
                state: stateName
              });
              sizeVariantMap.set(sizeName, existingVariants);
            }
          });
        }
        config_1.LoggingService.debug("Size variants processing complete", {
          uniqueSizes: sizeVariantMap.size,
          sizes: Array.from(sizeVariantMap.keys())
        }, config_1.LoggingService.CATEGORIES.TESTING);
        if (sizeVariantMap.size === 0) {
          config_1.LoggingService.debug("No size variants found, returning empty string", void 0, config_1.LoggingService.CATEGORIES.TESTING);
          return "";
        }
        const sizeVariants = [];
        sizeVariantMap.forEach((variants, sizeName) => {
          const defaultVariant = variants.find((v) => v.state === "default") || variants[0];
          if (defaultVariant) {
            sizeVariants.push(defaultVariant);
          }
        });
        const sizeTestCode = `
  it('should have correct styles for different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    ${sizeVariants.map((variant) => {
          const sizeSpecificProps = {};
          const sizeRelatedProperties = ["padding", "gap", "font-size", "line-height", "width", "height", "min-width", "min-height", "margin"];
          sizeRelatedProperties.forEach((prop) => {
            if (variant.expectedStyles[prop]) {
              sizeSpecificProps[prop] = variant.expectedStyles[prop];
            }
            const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
            if (variant.expectedStyles[camelProp]) {
              sizeSpecificProps[camelProp] = variant.expectedStyles[camelProp];
            }
          });
          const testCases = [];
          (0, es2015_helpers_1.objectEntries)(sizeSpecificProps).forEach(([prop, value]) => {
            const kebabProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
            testCases.push(`checkStyleProperty('${variant.selector}', '', '${kebabProp}', '${value}');`);
          });
          if (!testCases.length) {
            return `
    // ${variant.name} size variant - no size-specific properties found`;
          }
          return `
    // Test ${variant.name} size variant
    ${testCases.join("\n    ")}`;
        }).join("\n")}
    
    // Also test hover states for each size if they have different padding
    ${sizeVariantMap.size > 0 ? Array.from(sizeVariantMap.entries()).map(([sizeName, variants]) => {
          const hoverVariant = variants.find((v) => v.state === "hover");
          if (!hoverVariant)
            return "";
          const defaultVariant = variants.find((v) => v.state === "default") || variants[0];
          if (defaultVariant && hoverVariant.expectedStyles.padding !== defaultVariant.expectedStyles.padding) {
            return `
    // Test ${sizeName} size hover state padding
    checkStyleProperty('.${componentSelector.substring(1)}--${sizeName}', ':hover', 'padding', '${hoverVariant.expectedStyles.padding}');`;
          }
          return "";
        }).join("") : ""}
  });`;
        return sizeTestCode;
      }
      function generateBasicSizeTests(componentSelector) {
        return `
  it('should support different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Common size variant naming conventions
    const sizeVariants = TEST_CONFIG.SIZES.STANDARD;
    const altSizeVariants = TEST_CONFIG.SIZES.ALTERNATIVE;
    
    // Properties that typically change with size
    const sizeProperties = ['padding', 'font-size', 'line-height', 'border-radius', 'gap', 'width', 'height', 'min-width', 'min-height'];
    
    // Test both standard size variants and alternative naming
    const allSizeVariants = sizeVariants.concat(altSizeVariants);
    
    allSizeVariants.forEach(size => {
      sizeProperties.forEach(property => {
        // Check BEM naming: .component--size
        const bemValue = getCssPropertyForRule('${componentSelector}--' + size, '', property);
        // Check modifier class: .component.size
        const modifierValue = getCssPropertyForRule('${componentSelector}.' + size, '', property);
        
        const value = bemValue || modifierValue;
        if (value) {
          expect(value).toBeDefined();
        }
      });
    });
  });`;
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
      var sizeVariantUtils_1 = require_sizeVariantUtils();
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
        let sizeTestsCode = "";
        if (includeSizeTests) {
          config_1.LoggingService.debug("Size testing configuration", {
            hasComponentVariants: !!(componentVariants && componentVariants.length),
            variantCount: componentVariants && componentVariants.length ? componentVariants.length : 0
          }, config_1.LoggingService.CATEGORIES.TESTING);
          if (componentVariants && componentVariants.length > 0) {
            config_1.LoggingService.debug("Using Figma variant data for size testing", void 0, config_1.LoggingService.CATEGORIES.TESTING);
            sizeTestsCode = (0, sizeVariantUtils_1.generateSizeVariantTests)(componentSelector, componentName, componentVariants);
          } else {
            config_1.LoggingService.debug("Using basic size testing approach", void 0, config_1.LoggingService.CATEGORIES.TESTING);
            sizeTestsCode = (0, sizeVariantUtils_1.generateBasicSizeTests)(componentSelector);
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
  });${stateTestsCode}${sizeTestsCode}${generateTextContentTests(textElements, componentVariants)}
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
      var PSEUDO_STATES = ["hover", "active", "focus", "disabled"];
      var ComponentService = class _ComponentService {
        // Cache management
        static clearCaches() {
          this.styleCache.clear();
          this.testCache.clear();
          this.nameCache.clear();
        }
        static getCacheStats() {
          return {
            styles: this.styleCache.size,
            tests: this.testCache.size,
            names: this.nameCache.size
          };
        }
        static isSimpleColorProperty(property) {
          const simpleColorProperties = [
            "accentColor",
            "backgroundColor",
            "borderColor",
            "borderTopColor",
            "borderRightColor",
            "borderBottomColor",
            "borderLeftColor",
            "borderBlockColor",
            "borderInlineColor",
            "borderBlockStartColor",
            "borderBlockEndColor",
            "borderInlineStartColor",
            "borderInlineEndColor",
            "caretColor",
            "color",
            "outlineColor",
            "textDecorationColor",
            "textEmphasisColor",
            "columnRuleColor",
            "fill",
            "stroke",
            "floodColor",
            "lightingColor",
            "stopColor",
            "scrollbarColor",
            "selectionBackgroundColor",
            "selectionColor"
          ];
          return (0, es2015_helpers_1.arrayIncludes)(simpleColorProperties, property);
        }
        static isComplexColorProperty(property) {
          const complexColorProperties = [
            "background",
            "border",
            "borderTop",
            "borderRight",
            "borderBottom",
            "borderLeft",
            "outline",
            "boxShadow",
            "textShadow",
            "dropShadow"
          ];
          return (0, es2015_helpers_1.arrayIncludes)(complexColorProperties, property);
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
            yield this.collectAllVariables();
            const componentsData = [];
            const componentSets = [];
            this.componentMap = /* @__PURE__ */ new Map();
            function collectNodes(node) {
              return __awaiter(this, void 0, void 0, function* () {
                if ("type" in node) {
                  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
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
                  }
                  if ("children" in node) {
                    for (const child of node.children) {
                      yield collectNodes(child);
                    }
                  }
                }
              });
            }
            for (const page of figma.root.children) {
              yield collectNodes(page);
            }
            componentsData.forEach((component) => {
              if (component.parentId) {
                const parent = this.componentMap.get(component.parentId);
                if (parent && parent.type === "COMPONENT_SET") {
                  parent.children.push(component);
                  component.isChild = true;
                }
              }
            });
            return componentSets.concat(componentsData.filter((comp) => !comp.isChild));
          });
        }
        static getComponentById(id) {
          return this.componentMap.get(id);
        }
        static generateTest(component, generateAllVariants = false, includeStateTests = true, includeSizeTests = true) {
          const componentName = component.name;
          const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const isComponentSet = component.type === "COMPONENT_SET";
          if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
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
            component.textElements.forEach((textElement) => {
              if (textElement.textStyles) {
                (0, es2015_helpers_1.objectEntries)(textElement.textStyles).forEach(([key, value]) => {
                  if (value) {
                    styleChecks.push({
                      property: key,
                      value: this.normalizeStyleValue(key, value)
                    });
                  }
                });
              }
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
          const variantTests = this.generateVariantTests(componentSet, kebabName, pascalName);
          return this.buildComponentSetTestTemplate(pascalName, kebabName, variantTests);
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
            return cached;
          }
          const variantTestParts = [];
          const processedVariants = /* @__PURE__ */ new Set();
          for (const variant of componentSet.children) {
            try {
              const { state, size, variantType } = this.parseVariantName(variant.name);
              const testId = `${state}-${size}-${variantType}`;
              if (processedVariants.has(testId)) {
                continue;
              }
              processedVariants.add(testId);
              const styles = this.parseStyles(variant.styles);
              const cssProperties = this.extractCssProperties(styles);
              const textStyles = this.extractTextStyles(variant.textElements);
              const isPseudoState = this.isPseudoState(state);
              if (isPseudoState) {
                variantTestParts.push(this.generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles));
              } else {
                variantTestParts.push(this.generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles));
              }
            } catch (error) {
              console.error("Error generating test for variant:", variant.name, error);
            }
          }
          const result = variantTestParts.join("");
          this.testCache.set(cacheKey, result);
          return result;
        }
        static parseVariantName(variantName) {
          if (!variantName || typeof variantName !== "string") {
            throw new Error(`Invalid variant name: ${variantName}`);
          }
          const stateMatch = variantName.match(/State=([^,]+)/i);
          const sizeMatch = variantName.match(/Size=([^,]+)/i);
          const variantMatch = variantName.match(/Variant=([^,]+)/i);
          return {
            state: stateMatch && stateMatch[1] ? stateMatch[1].trim() : "default",
            size: sizeMatch && sizeMatch[1] ? sizeMatch[1].trim() : "default",
            variantType: variantMatch && variantMatch[1] ? variantMatch[1].trim() : "default"
          };
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
        static buildComponentSetTestTemplate(pascalName, kebabName, variantTests) {
          return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component - All Variants', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  const resolveCssVariable = (
    variableName: string,
    stylesheetHrefPart = 'styles.css'
  ): string | undefined => {
    const targetSheet = Array.from(document.styleSheets).find((sheet) =>
      sheet.href && sheet.href.indexOf(stylesheetHrefPart) !== -1
    );

    const rootRule = Array.from(targetSheet && targetSheet.cssRules ? targetSheet.cssRules : [])
      .filter((rule) => rule instanceof CSSStyleRule)
      .find((rule) => rule.selectorText === ':root');

    const value = rootRule && rootRule.style ? rootRule.style.getPropertyValue(variableName) : undefined;
    const trimmedValue = value ? value.trim() : undefined;

    if (trimmedValue && trimmedValue.startsWith('var(')) {
      const varMatch = trimmedValue.match(/var((--.+?))/);
      const nestedVar = varMatch ? varMatch[1] : undefined;
      return nestedVar
        ? resolveCssVariable(nestedVar, stylesheetHrefPart)
        : undefined;
    }
    return trimmedValue;
  };

  const getCssPropertyForRule = (
    cssSelector: string,
    pseudoClass: string,
    prop: string
  ): string | undefined => {
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    
    // Flatten stylesheets rules using standard JavaScript
    let allRules: any[] = [];
    Array.from(document.styleSheets).forEach((sheet: any) => {
      const rules = Array.from(sheet.cssRules || []);
      allRules = allRules.concat(rules);
    });
    
    const foundRule = allRules
      .filter((r: any) => r instanceof CSSStyleRule)
      .find((r: any) => regex.test(r.selectorText));
    
    const style = foundRule ? foundRule.style : undefined;
    return style ? style.getPropertyValue(prop) : undefined;
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
            try {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              this.allVariables.clear();
              const variablePromises = (0, es2015_helpers_1.arrayFlatMap)(collections, (collection) => collection.variableIds.map((variableId) => figma.variables.getVariableByIdAsync(variableId)));
              const variables = yield Promise.all(variablePromises);
              variables.forEach((variable) => {
                if (variable) {
                  this.allVariables.set(variable.id, variable);
                  const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                  this.allVariables.set(formattedName, variable);
                }
              });
            } catch (error) {
              console.error("Error collecting variables:", error);
            }
          });
        }
        static resolveStyleVariables(styles, textElements, componentName) {
          if (!styles || typeof styles !== "object") {
            return styles;
          }
          const resolvedStyles = Object.assign({}, styles);
          for (const property in styles) {
            if (styles.hasOwnProperty(property)) {
              const value = styles[property];
              if (typeof value === "string") {
                resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
              }
            }
          }
          if (textElements && textElements.length > 0) {
            textElements.forEach((textElement) => {
              if (textElement.textStyles) {
                for (const key in textElement.textStyles) {
                  if (textElement.textStyles.hasOwnProperty(key)) {
                    const value = textElement.textStyles[key];
                    if (value) {
                      const resolvedValue = typeof value === "string" ? this.replaceVariableIdsWithNames(value) : value;
                      const kebabKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
                      resolvedStyles[kebabKey] = resolvedValue;
                    }
                  }
                }
              }
            });
          }
          return resolvedStyles;
        }
        static parseComponentVariantName(name) {
          const result = {};
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
            for (const variable of this.allVariables.values()) {
              const figmaVariable = variable;
              if (figmaVariable && figmaVariable.id && (figmaVariable.id.indexOf(varId) !== -1 || varId.indexOf(figmaVariable.id) !== -1)) {
                const formattedName = figmaVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                return `var(--${formattedName})`;
              }
            }
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
          for (var key in styles) {
            if (styles.hasOwnProperty(key)) {
              var value = styles[key];
              var camelCaseKey = key.replace(/-([a-z])/g, function(g) {
                return g[1].toUpperCase();
              });
              if (camelCaseKey === "background") {
                camelCaseKey = "backgroundColor";
              }
              collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, value);
            }
          }
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
          const standardProps = [
            "backgroundColor",
            "background",
            "color",
            "fontSize",
            "fontFamily",
            "fontWeight",
            "fontStyle",
            "lineHeight",
            "letterSpacing",
            "borderRadius",
            "border",
            "borderColor",
            "borderWidth",
            "borderStyle",
            "gap",
            "width",
            "height",
            "minWidth",
            "minHeight",
            "maxWidth",
            "maxHeight",
            "display",
            "flexDirection",
            "justifyContent",
            "alignItems",
            "flexWrap",
            "position",
            "top",
            "right",
            "bottom",
            "left",
            "opacity",
            "boxShadow",
            "textAlign",
            "textDecoration",
            "textTransform",
            "overflow",
            "cursor",
            "zIndex",
            "transition"
          ];
          const shorthandSkip = new Set(paddingProps.concat(marginProps));
          standardProps.filter((prop) => collectedStyles[prop] && !shorthandSkip.has(prop)).forEach((prop) => {
            cssProperties[prop] = String(collectedStyles[prop]);
          });
          return cssProperties;
        }
        static generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles = {}) {
          const pseudoClass = `:${state.toLowerCase()}`;
          const testDescription = `should have correct :${state.toLowerCase()} styles${size !== "default" ? ` for ${size} size` : ""}${variantType !== "default" ? ` (${variantType} variant)` : ""}`;
          const allProperties = Object.assign({}, cssProperties, textStyles);
          const testableProperties = Object.keys(allProperties).filter((property) => {
            const expectedValue = allProperties[property];
            return expectedValue !== "computed" && !(expectedValue.indexOf("var(") !== -1 && !expectedValue.match(/var\([^,]+,\s*([^)]+)\)/));
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
              const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
              if (fallbackMatch) {
                expectedTest = fallbackMatch[1].trim();
              }
            }
            if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
              let hex = expectedTest.substring(1);
              if (hex.length === 3) {
                hex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              expectedTest = `rgb(${r}, ${g}, ${b})`;
            }
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
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.startsWith('var(')) {
          const varMatch = resolvedValue.match(/var\\((--.+?)\\)/);
          const variableName = varMatch ? varMatch[1] : undefined;
          const actualValue = variableName ? resolveCssVariable(variableName) : undefined;
          expect(actualValue).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).toBe(check.expectedValue);
        }
      }
    });
  });`;
        }
        static generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles = {}) {
          const componentProps = [];
          if (size !== "default") {
            componentProps.push(`component.size = '${size.toLowerCase()}';`);
          }
          if (variantType !== "default") {
            componentProps.push(`component.variant = '${variantType.toLowerCase()}';`);
          }
          if (state !== "default" && ["hover", "active", "focus", "disabled"].indexOf(state.toLowerCase()) === -1) {
            componentProps.push(`component.state = '${state.toLowerCase()}';`);
          }
          const testDescription = [
            size !== "default" ? `size="${size}"` : null,
            variantType !== "default" ? `variant="${variantType}"` : null,
            state !== "default" ? `state="${state}"` : null
          ].filter(Boolean).join(" ");
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
              const fallbackMatch = expectedValue.match(/var\\([^,]+,\\s*([^)]+)\\)/);
              if (fallbackMatch) {
                expectedTest = fallbackMatch[1].trim();
              } else {
                return `      // ${property} (CSS variable without fallback)
      // expect(computedStyle.${property}).toBe('expected-value');`;
              }
            }
            if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
              let hex = expectedTest.substring(1);
              if (hex.length === 3) {
                hex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              expectedTest = `rgb(${r}, ${g}, ${b})`;
            }
            return `      expect(computedStyle.${property}).toBe('${expectedTest}');`;
          }).join("\n\n")}${Object.keys(textStyles).length > 0 ? "\n\n" + Object.keys(textStyles).map((property) => {
            const expectedValue = textStyles[property];
            return `      expect(computedStyle.${property}).toBe('${expectedValue}');`;
          }).join("\n\n") : ""}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
        }
        static extractTextElements(node) {
          return __awaiter(this, void 0, void 0, function* () {
            const textElements = [];
            function traverseNode(currentNode) {
              return __awaiter(this, void 0, void 0, function* () {
                if (currentNode.type === "TEXT") {
                  const textNode = currentNode;
                  let textStyles = {};
                  try {
                    const nodeStyles = yield textNode.getCSSAsync();
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
                  } catch (e) {
                    console.error("Error getting text styles:", e);
                  }
                  const textElement = {
                    id: textNode.id,
                    content: textNode.characters,
                    type: "TEXT",
                    styles: yield textNode.getCSSAsync(),
                    textStyles
                  };
                  textElements.push(textElement);
                }
                if ("children" in currentNode) {
                  for (const child of currentNode.children) {
                    yield traverseNode(child);
                  }
                }
              });
            }
            yield traverseNode(node);
            return textElements;
          });
        }
      };
      exports.ComponentService = ComponentService;
      ComponentService.componentMap = /* @__PURE__ */ new Map();
      ComponentService.allVariables = /* @__PURE__ */ new Map();
      ComponentService.styleCache = /* @__PURE__ */ new Map();
      ComponentService.testCache = /* @__PURE__ */ new Map();
      ComponentService.nameCache = /* @__PURE__ */ new Map();
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
      figma.showUI(__html__, { width: 850, height: 800 });
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
              for (const modeId in variable.valuesByMode) {
                const value = variable.valuesByMode[modeId];
                const mode = collection.modes.find((m) => m.modeId === modeId);
                valuesByModeEntries.push({
                  modeName: mode ? mode.name : "Unknown",
                  value
                });
              }
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
              code: "DesignSync - Use the plugin interface to view variables and components",
              title: "DesignSync"
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
                msg.generateAllVariants,
                msg.includeStateTests !== false
                // Default to true
              );
              figma.ui.postMessage({
                type: "test-generated",
                componentName: msg.componentName || component.name,
                testContent,
                isComponentSet: component.type === "COMPONENT_SET",
                hasAllVariants: msg.generateAllVariants,
                forCommit: msg.forCommit
              });
              break;
            case "save-gitlab-settings":
              yield gitlabService_1.GitLabService.saveSettings({
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
              const result = yield gitlabService_1.GitLabService.commitToGitLab(msg.projectId, msg.gitlabToken, msg.commitMessage, msg.filePath || "variables.css", msg.cssData, msg.branchName || "feature/variables");
              figma.ui.postMessage({
                type: "commit-success",
                message: "Successfully committed changes to the feature branch",
                mergeRequestUrl: result && result.mergeRequestUrl
              });
              break;
            case "commit-component-test":
              if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.testContent || !msg.componentName) {
                throw new Error("Missing required fields for component test commit");
              }
              const testResult = yield gitlabService_1.GitLabService.commitComponentTest(msg.projectId, msg.gitlabToken, msg.commitMessage, msg.componentName, msg.testContent, msg.testFilePath || "components/{componentName}.spec.ts", msg.branchName || "feature/component-tests");
              figma.ui.postMessage({
                type: "test-commit-success",
                message: "Successfully committed component test to the feature branch",
                componentName: msg.componentName,
                mergeRequestUrl: testResult && testResult.mergeRequestUrl
              });
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
