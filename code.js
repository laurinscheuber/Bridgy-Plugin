"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // dist/config/environments.js
  var require_environments = __commonJS({
    "dist/config/environments.js"(exports) {
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
      exports.EnvironmentManager = exports.ENVIRONMENTS = void 0;
      exports.ENVIRONMENTS = {
        "gitlab.com": {
          gitlabBaseUrl: "https://gitlab.com",
          allowedDomains: ["gitlab.com", "*.gitlab.com", "*.gitlab.io"],
          name: "GitLab.com",
          description: "Official GitLab SaaS platform",
          requiresCustomToken: false
        },
        "gitlab.fhnw.ch": {
          gitlabBaseUrl: "https://gitlab.fhnw.ch",
          allowedDomains: ["gitlab.fhnw.ch", "*.gitlab.fhnw.ch"],
          name: "FHNW GitLab",
          description: "University of Applied Sciences Northwestern Switzerland",
          requiresCustomToken: false
        },
        custom: {
          gitlabBaseUrl: "",
          // Will be set by user
          allowedDomains: [],
          // Will be populated based on URL
          name: "Custom GitLab",
          description: "Self-hosted or enterprise GitLab instance",
          requiresCustomToken: true
        }
      };
      var EnvironmentManager = class {
        /**
         * Get environment configuration by key
         */
        static getEnvironment(key) {
          return exports.ENVIRONMENTS[key] || null;
        }
        /**
         * Get all available environments
         */
        static getAllEnvironments() {
          return Object.assign({}, exports.ENVIRONMENTS);
        }
        /**
         * Add or update a custom environment configuration
         */
        static saveCustomEnvironment(key, config) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const customConfigs = yield this.getCustomEnvironments();
              customConfigs[key] = Object.assign(Object.assign({}, config), { requiresCustomToken: true });
              yield figma.clientStorage.setAsync(this.CUSTOM_CONFIG_KEY, JSON.stringify(customConfigs));
            } catch (error) {
              console.error("Failed to save custom environment:", error);
              throw error;
            }
          });
        }
        /**
         * Get custom environments from storage
         */
        static getCustomEnvironments() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const stored = yield figma.clientStorage.getAsync(this.CUSTOM_CONFIG_KEY);
              return stored ? JSON.parse(stored) : {};
            } catch (error) {
              console.error("Failed to load custom environments:", error);
              return {};
            }
          });
        }
        /**
         * Get all environments (built-in + custom)
         */
        static getAllEnvironmentsWithCustom() {
          return __awaiter(this, void 0, void 0, function* () {
            const customConfigs = yield this.getCustomEnvironments();
            return Object.assign(Object.assign({}, exports.ENVIRONMENTS), customConfigs);
          });
        }
        /**
         * Validate a GitLab URL and extract domain info
         */
        static validateGitLabUrl(url) {
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== "https:") {
              return { isValid: false, error: "GitLab URL must use HTTPS" };
            }
            const domain = parsed.hostname;
            if (!domain || domain.length < 3) {
              return { isValid: false, error: "Invalid domain" };
            }
            return { isValid: true, domain };
          } catch (error) {
            return { isValid: false, error: "Invalid URL format" };
          }
        }
        /**
         * Auto-configure environment from GitLab URL
         */
        static autoConfigureFromUrl(gitlabUrl) {
          const validation = this.validateGitLabUrl(gitlabUrl);
          if (!validation.isValid || !validation.domain) {
            return null;
          }
          const domain = validation.domain;
          for (const key in exports.ENVIRONMENTS) {
            const config = exports.ENVIRONMENTS[key];
            if (config.allowedDomains.some((allowed) => {
              if (allowed.startsWith("*.")) {
                const suffix = allowed.substring(2);
                return domain.endsWith(suffix);
              }
              return domain === allowed;
            })) {
              return config;
            }
          }
          return {
            gitlabBaseUrl: gitlabUrl,
            allowedDomains: [domain, `*.${domain}`],
            name: `Custom (${domain})`,
            description: `Self-hosted GitLab at ${domain}`,
            requiresCustomToken: true
          };
        }
        /**
         * Remove a custom environment
         */
        static removeCustomEnvironment(key) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const customConfigs = yield this.getCustomEnvironments();
              delete customConfigs[key];
              yield figma.clientStorage.setAsync(this.CUSTOM_CONFIG_KEY, JSON.stringify(customConfigs));
            } catch (error) {
              console.error("Failed to remove custom environment:", error);
              throw error;
            }
          });
        }
        /**
         * Get the appropriate environment for a GitLab URL
         */
        static getEnvironmentForUrl(gitlabUrl) {
          return __awaiter(this, void 0, void 0, function* () {
            if (!gitlabUrl)
              return null;
            const autoConfig = this.autoConfigureFromUrl(gitlabUrl);
            if (autoConfig && !autoConfig.requiresCustomToken) {
              return autoConfig;
            }
            const customEnvs = yield this.getCustomEnvironments();
            for (const key in customEnvs) {
              const config = customEnvs[key];
              if (config.gitlabBaseUrl === gitlabUrl) {
                return config;
              }
            }
            return autoConfig;
          });
        }
        /**
         * Generate manifest.json domains for build-time injection
         */
        static generateManifestDomains(environments) {
          const envs = environments || exports.ENVIRONMENTS;
          const domains = /* @__PURE__ */ new Set();
          domains.add("https://cdnjs.cloudflare.com");
          for (const key in envs) {
            const config = envs[key];
            if (config.gitlabBaseUrl) {
              try {
                const url = new URL(config.gitlabBaseUrl);
                domains.add(`https://${url.hostname}`);
              } catch (e) {
              }
            }
            config.allowedDomains.forEach((domain) => {
              if (!domain.startsWith("*.")) {
                domains.add(`https://${domain}`);
              } else {
                domains.add(`https://${domain}`);
              }
            });
          }
          return Array.from(domains).sort();
        }
      };
      exports.EnvironmentManager = EnvironmentManager;
      EnvironmentManager.CUSTOM_CONFIG_KEY = "bridgy-custom-environments";
      exports.default = EnvironmentManager;
    }
  });

  // dist/config/constants.js
  var require_constants = __commonJS({
    "dist/config/constants.js"(exports) {
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
      exports.GIT_CONFIG = exports.buildGitLabWebUrlSync = exports.buildGitLabWebUrl = exports.buildGitLabApiUrlSync = exports.buildGitLabApiUrl = exports.API_CONFIG = void 0;
      var environments_1 = require_environments();
      exports.API_CONFIG = {
        DEFAULT_GITLAB_URL: "https://gitlab.com",
        // Default to GitLab.com
        DEFAULT_GITLAB_BASE_URL: "https://gitlab.com/api/v4",
        // Default API URL
        REQUEST_TIMEOUT: 3e4,
        DEFAULT_HEADERS: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      };
      var buildGitLabApiUrl = (gitlabUrl) => __awaiter(void 0, void 0, void 0, function* () {
        if (!gitlabUrl)
          return exports.API_CONFIG.DEFAULT_GITLAB_BASE_URL;
        const environment = yield environments_1.EnvironmentManager.getEnvironmentForUrl(gitlabUrl);
        const baseUrl = (environment === null || environment === void 0 ? void 0 : environment.gitlabBaseUrl) || gitlabUrl;
        const cleanUrl = baseUrl.replace(/\/+$/, "");
        if (cleanUrl.endsWith("/api/v4")) {
          return cleanUrl;
        }
        return `${cleanUrl}/api/v4`;
      });
      exports.buildGitLabApiUrl = buildGitLabApiUrl;
      var buildGitLabApiUrlSync = (gitlabUrl) => {
        if (!gitlabUrl || gitlabUrl.trim() === "")
          return exports.API_CONFIG.DEFAULT_GITLAB_BASE_URL;
        const cleanUrl = gitlabUrl.replace(/\/+$/, "");
        if (cleanUrl.endsWith("/api/v4")) {
          return cleanUrl;
        }
        return `${cleanUrl}/api/v4`;
      };
      exports.buildGitLabApiUrlSync = buildGitLabApiUrlSync;
      var buildGitLabWebUrl = (gitlabUrl) => __awaiter(void 0, void 0, void 0, function* () {
        if (!gitlabUrl)
          return exports.API_CONFIG.DEFAULT_GITLAB_URL;
        const environment = yield environments_1.EnvironmentManager.getEnvironmentForUrl(gitlabUrl);
        const baseUrl = (environment === null || environment === void 0 ? void 0 : environment.gitlabBaseUrl) || gitlabUrl;
        const cleanUrl = baseUrl.replace(/\/+$/, "").replace(/\/api\/v4$/, "");
        return cleanUrl;
      });
      exports.buildGitLabWebUrl = buildGitLabWebUrl;
      var buildGitLabWebUrlSync = (gitlabUrl) => {
        if (!gitlabUrl || gitlabUrl.trim() === "")
          return exports.API_CONFIG.DEFAULT_GITLAB_URL;
        const cleanUrl = gitlabUrl.replace(/\/+$/, "").replace(/\/api\/v4$/, "");
        return cleanUrl;
      };
      exports.buildGitLabWebUrlSync = buildGitLabWebUrlSync;
      exports.GIT_CONFIG = {
        DEFAULT_BRANCH: "feature/variables",
        DEFAULT_COMMIT_PATTERNS: {
          variables: "Update CSS variables from Figma"
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
        RELATIVE_PATTERNS: ["width", "height", "top", "right", "bottom", "left", "inset"],
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
        BORDER_RADIUS_PATTERNS: ["radius", "rounded", "corner", "border-radius", "borderradius"],
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
        LAYOUT: ["justifyContent", "alignItems", "display", "flexDirection", "position"],
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
          console.error(`[ERROR]${category ? ` [${category}]` : ""} ${message}`, error || "");
        }
      };
      exports.LoggingService = LoggingService;
      LoggingService.currentLevel = LogLevel.INFO;
      LoggingService.logs = [];
      LoggingService.maxLogs = 1e3;
      LoggingService.CATEGORIES = {
        COMPONENT: "Component",
        GITLAB: "GitLab",
        GITHUB: "GitHub",
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
      var SecurityUtils = class _SecurityUtils {
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
          const keyBytes = _SecurityUtils.stringToBytes(key);
          const dataBytes = _SecurityUtils.stringToBytes(data);
          const encrypted = new Uint8Array(dataBytes.length);
          for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ keyBytes[i % keyBytes.length];
          }
          return _SecurityUtils.toBase64(String.fromCharCode(...encrypted));
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
            const decodedString = _SecurityUtils.fromBase64(encryptedData);
            const encrypted = new Uint8Array(decodedString.length);
            for (let k = 0; k < decodedString.length; k++) {
              encrypted[k] = decodedString.charCodeAt(k);
            }
            const keyBytes = _SecurityUtils.stringToBytes(key);
            const decrypted = new Uint8Array(encrypted.length);
            for (let i = 0; i < encrypted.length; i++) {
              decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length];
            }
            return _SecurityUtils.bytesToString(decrypted);
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
          const sessionId = Math.random().toString(36).substring(2, 15);
          const timestamp = Math.floor(Date.now() / (1e3 * 60 * 60 * 24));
          return _SecurityUtils.toBase64(`${fileId}:${sessionId}:${timestamp}`).slice(0, 32);
        }
        static btoaPolyfill(input) {
          const str = input;
          let output = "";
          for (let block = 0, charCode, i = 0, map = _SecurityUtils.b64chars; str.charAt(i | 0) || (map = "=", i % 1); output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
            charCode = str.charCodeAt(i += 3 / 4);
            if (charCode > 255) {
              console.warn("btoaPolyfill: unexpected multibyte character");
            }
            block = block << 8 | charCode;
          }
          return output;
        }
        static toBase64(str) {
          let binaryString = "";
          try {
            binaryString = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
              return String.fromCharCode(parseInt(p1, 16));
            });
          } catch (e) {
            console.error("UTF-8 binary conversion failed:", e);
            binaryString = str;
          }
          try {
            if (typeof btoa === "function") {
              return btoa(binaryString);
            }
          } catch (ignore) {
          }
          return _SecurityUtils.btoaPolyfill(binaryString);
        }
        /**
         * Safe Base64 decoding
         */
        static fromBase64(str) {
          try {
            if (typeof atob === "function") {
              return atob(str);
            }
          } catch (e) {
          }
          return _SecurityUtils.atobPolyfill(str);
        }
        static atobPolyfill(input) {
          const chars = _SecurityUtils.b64chars;
          const str = input.replace(/=+$/, "");
          let output = "";
          if (str.length % 4 === 1) {
            throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
          }
          for (let bc = 0, bs = 0, buffer, i = 0; buffer = str.charAt(i++); ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer, bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
            buffer = chars.indexOf(buffer);
          }
          return output;
        }
        /**
         * Helper to convert string to byte array (replacing TextEncoder)
         */
        static stringToBytes(str) {
          if (typeof TextEncoder !== "undefined") {
            return new TextEncoder().encode(str);
          }
          const binaryStr = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16)));
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          return bytes;
        }
        /**
         * Helper to convert byte array to string (replacing TextDecoder)
         */
        static bytesToString(bytes) {
          if (typeof TextDecoder !== "undefined") {
            return new TextDecoder().decode(bytes);
          }
          let binaryStr = "";
          for (let i = 0; i < bytes.length; i++) {
            binaryStr += String.fromCharCode(bytes[i]);
          }
          try {
            return decodeURIComponent(binaryStr.split("").map(function(c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(""));
          } catch (e) {
            console.warn("SecurityUtils: TextDecoder polyfill failed", e);
            return binaryStr;
          }
        }
      };
      exports.SecurityUtils = SecurityUtils;
      SecurityUtils.rateLimitCache = /* @__PURE__ */ new Map();
      SecurityUtils.b64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
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
            return {
              isValid: false,
              error: `${fieldName} must be at least ${rules.minLength} characters`
            };
          }
          if (rules.maxLength && inputStr.length > rules.maxLength) {
            return {
              isValid: false,
              error: `${fieldName} must be no more than ${rules.maxLength} characters`
            };
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

  // dist/services/cryptoService.js
  var require_cryptoService = __commonJS({
    "dist/services/cryptoService.js"(exports) {
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
      exports.CryptoService = void 0;
      var errorHandler_1 = require_errorHandler();
      var CryptoService = class {
        /**
         * Derives an encryption key from a password and salt
         */
        static deriveKey(password, salt) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const encoder = new TextEncoder();
              const passwordKey = yield crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
              return yield crypto.subtle.deriveKey({
                name: "PBKDF2",
                salt,
                iterations: this.ITERATIONS,
                hash: "SHA-256"
              }, passwordKey, {
                name: "AES-GCM",
                length: this.KEY_LENGTH
              }, false, ["encrypt", "decrypt"]);
            } catch (error) {
              errorHandler_1.ErrorHandler.handleError(error, {
                operation: "derive_key",
                component: "CryptoService",
                severity: "high"
              });
              throw error;
            }
          });
        }
        /**
         * Generates a unique key for each Figma file
         */
        static getFileKey() {
          var _a;
          const userId = ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.id) || "anonymous";
          const fileId = figma.root.id;
          return `${userId}-${fileId}`;
        }
        /**
         * Encrypts sensitive data using AES-GCM
         */
        static encrypt(plaintext) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
              const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
              const key = yield this.deriveKey(this.getFileKey(), new Uint8Array(salt));
              const encoder = new TextEncoder();
              const ciphertext = yield crypto.subtle.encrypt({
                name: "AES-GCM",
                iv,
                tagLength: this.TAG_LENGTH
              }, key, encoder.encode(plaintext));
              const encryptedData = {
                ciphertext: this.bufferToBase64(ciphertext),
                iv: this.bufferToBase64(iv),
                salt: this.bufferToBase64(salt)
              };
              return JSON.stringify(encryptedData);
            } catch (error) {
              errorHandler_1.ErrorHandler.handleError(error, {
                operation: "encrypt",
                component: "CryptoService",
                severity: "high"
              });
              throw error;
            }
          });
        }
        /**
         * Decrypts data encrypted with encrypt()
         */
        static decrypt(encryptedString) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const encryptedData = JSON.parse(encryptedString);
              const salt = this.base64ToBuffer(encryptedData.salt);
              const iv = this.base64ToBuffer(encryptedData.iv);
              const ciphertext = this.base64ToBuffer(encryptedData.ciphertext);
              const key = yield this.deriveKey(this.getFileKey(), new Uint8Array(salt));
              const decrypted = yield crypto.subtle.decrypt({
                name: "AES-GCM",
                iv,
                tagLength: this.TAG_LENGTH
              }, key, ciphertext);
              const decoder = new TextDecoder();
              return decoder.decode(decrypted);
            } catch (error) {
              errorHandler_1.ErrorHandler.handleError(error, {
                operation: "decrypt",
                component: "CryptoService",
                severity: "high"
              });
              throw error;
            }
          });
        }
        /**
         * Converts ArrayBuffer to base64 string
         */
        static bufferToBase64(buffer) {
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          return btoa(binary);
        }
        /**
         * Converts base64 string to ArrayBuffer
         */
        static base64ToBuffer(base64) {
          const binary = atob(base64);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          return bytes.buffer;
        }
        /**
         * Checks if Web Crypto API is available
         */
        static isAvailable() {
          return typeof crypto !== "undefined" && crypto.subtle !== void 0 && typeof crypto.getRandomValues === "function";
        }
        /**
         * Migrates from old XOR encryption to new encryption
         * This is a one-time operation during the upgrade
         */
        static migrateFromXOR(xorEncrypted, key) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const decrypted = this.xorDecrypt(xorEncrypted, key);
              return yield this.encrypt(decrypted);
            } catch (error) {
              console.error("Migration failed, returning empty string");
              return "";
            }
          });
        }
        /**
         * Legacy XOR decryption for migration purposes only
         */
        static xorDecrypt(encrypted, key) {
          const encryptedBytes = new Uint8Array(atob(encrypted).split("").map((c) => c.charCodeAt(0)));
          const keyBytes = new TextEncoder().encode(key);
          const decrypted = new Uint8Array(encryptedBytes.length);
          for (let i = 0; i < encryptedBytes.length; i++) {
            decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
          }
          return new TextDecoder().decode(decrypted);
        }
      };
      exports.CryptoService = CryptoService;
      CryptoService.ITERATIONS = 1e5;
      CryptoService.KEY_LENGTH = 256;
      CryptoService.TAG_LENGTH = 128;
      CryptoService.SALT_LENGTH = 16;
      CryptoService.IV_LENGTH = 12;
    }
  });

  // dist/services/proxyService.js
  var require_proxyService = __commonJS({
    "dist/services/proxyService.js"(exports) {
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
      exports.ProxyService = void 0;
      var errorHandler_1 = require_errorHandler();
      var ProxyService = class {
        /**
         * Check if a domain is likely to be in the manifest
         * This is a heuristic check - actual validation happens at runtime
         */
        static isDomainLikelyAllowed(domain) {
          const commonPatterns = [
            "gitlab.com",
            "gitlab.io",
            "gitlab.fhnw.ch",
            "gitlab.de",
            "gitlab.ch",
            "gitlab.fr",
            "gitlab.org",
            "gitlab.net",
            "gitlab.edu",
            "gitlab.gov",
            "gitlab.uk",
            "gitlab.eu"
          ];
          return commonPatterns.some((pattern) => domain === pattern || domain.endsWith(`.${pattern}`));
        }
        /**
         * Validate that a URL is a valid GitLab URL
         */
        static isValidGitLabUrl(url) {
          try {
            const parsed = new URL(url);
            if (parsed.protocol !== "https:") {
              return false;
            }
            if (!parsed.hostname || parsed.hostname.length < 3) {
              return false;
            }
            const hostname = parsed.hostname.toLowerCase();
            const gitlabPatterns = [
              /gitlab/i,
              /\.git\./i,
              /\.code\./i,
              /\.scm\./i,
              /\.repo\./i,
              /\.vcs\./i
            ];
            return gitlabPatterns.some((pattern) => pattern.test(hostname)) || this.USE_PROXY;
          } catch (_a) {
            return false;
          }
        }
        /**
         * Proxy a GitLab API request through the proxy server
         */
        static proxyGitLabRequest(targetUrl, options) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              if (!this.isValidGitLabUrl(targetUrl)) {
                throw new Error("Invalid GitLab URL");
              }
              const proxyRequest = {
                targetUrl,
                method: options.method || "GET",
                headers: this.extractHeaders(options.headers),
                body: options.body ? typeof options.body === "string" ? options.body : JSON.stringify(options.body) : void 0
              };
              const response = yield fetch(this.PROXY_BASE_URL, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify(proxyRequest)
              });
              if (!response.ok) {
                throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
              }
              const proxyResponse = yield response.json();
              return new Response(proxyResponse.body, {
                status: proxyResponse.status,
                statusText: proxyResponse.statusText,
                headers: new Headers(proxyResponse.headers)
              });
            }), {
              operation: "proxy_gitlab_request",
              component: "ProxyService",
              severity: "high"
            });
          });
        }
        /**
         * Extract headers from RequestInit
         */
        static extractHeaders(headers) {
          const result = {};
          if (!headers) {
            return result;
          }
          if (headers instanceof Headers) {
            headers.forEach((value, key) => {
              result[key] = value;
            });
          } else if (Array.isArray(headers)) {
            headers.forEach(([key, value]) => {
              result[key] = value;
            });
          } else {
            Object.assign(result, headers);
          }
          return result;
        }
        /**
         * Check if proxy should be used for a given URL
         */
        static shouldUseProxy(url) {
          if (!this.USE_PROXY) {
            return false;
          }
          try {
            const parsed = new URL(url);
            const domain = parsed.hostname;
            return !this.isDomainLikelyAllowed(domain);
          } catch (_a) {
            return false;
          }
        }
      };
      exports.ProxyService = ProxyService;
      ProxyService.PROXY_BASE_URL = "https://api.bridgy-plugin.com/proxy";
      ProxyService.USE_PROXY = false;
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
      var cryptoService_1 = require_cryptoService();
      var proxyService_1 = require_proxyService();
      var DEFAULT_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_BRANCH;
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
          return (0, config_1.buildGitLabApiUrlSync)(settings.gitlabUrl);
        }
        /**
         * Get the GitLab web URL from settings
         */
        static getGitLabWebBase(settings) {
          return (0, config_1.buildGitLabWebUrlSync)(settings.gitlabUrl);
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
                    if (cryptoService_1.CryptoService.isAvailable()) {
                      const encryptedToken = yield cryptoService_1.CryptoService.encrypt(settings.gitlabToken);
                      yield figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
                      yield figma.clientStorage.setAsync(`${settingsKey}-crypto`, "v2");
                      if (settings._needsCryptoMigration) {
                        yield figma.clientStorage.deleteAsync(`${settingsKey}-key`);
                        delete settings._needsCryptoMigration;
                      }
                    } else {
                      const encryptionKey = securityUtils_1.SecurityUtils.generateEncryptionKey();
                      const encryptedToken = securityUtils_1.SecurityUtils.encryptData(settings.gitlabToken, encryptionKey);
                      yield figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
                      yield figma.clientStorage.setAsync(`${settingsKey}-key`, encryptionKey);
                    }
                  } catch (error) {
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: "encrypt_token",
                      component: "GitLabService",
                      severity: "high"
                    });
                    delete settingsToSave.gitlabToken;
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
                const cryptoVersion = yield figma.clientStorage.getAsync(`${settingsKey}-crypto`);
                if (encryptedToken) {
                  try {
                    if (cryptoVersion === "v2" && cryptoService_1.CryptoService.isAvailable()) {
                      const decryptedToken = yield cryptoService_1.CryptoService.decrypt(encryptedToken);
                      settings.gitlabToken = decryptedToken;
                    } else if (yield figma.clientStorage.getAsync(`${settingsKey}-key`)) {
                      const encryptionKey = yield figma.clientStorage.getAsync(`${settingsKey}-key`);
                      const decryptedToken = securityUtils_1.SecurityUtils.decryptData(encryptedToken, encryptionKey);
                      settings.gitlabToken = decryptedToken;
                      settings._needsCryptoMigration = true;
                    } else {
                      settings.gitlabToken = encryptedToken;
                      settings._needsCryptoMigration = true;
                    }
                  } catch (error) {
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: "decrypt_token",
                      component: "GitLabService",
                      severity: "medium"
                    });
                  }
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
          const trimmedToken = gitlabToken.trim();
          if (trimmedToken.length < 8) {
            throw new GitLabAuthError("GitLab token must be at least 8 characters long");
          }
          if (/[\s"'<>]/.test(trimmedToken)) {
            throw new GitLabAuthError("GitLab token contains invalid characters");
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
         * Normalize component name for use in file paths and branch names
         */
        static normalizeComponentName(componentName) {
          return componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        /**
         * Make API request with proper error handling
         * Uses proxy if domain is not in manifest, otherwise direct connection
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
              const useProxy = proxyService_1.ProxyService.shouldUseProxy(url);
              const response = yield Promise.race([
                useProxy ? proxyService_1.ProxyService.proxyGitLabRequest(url, options) : fetch(url, options),
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
        /**
         * Clears all stored tokens (for security/logout)
         */
        static clearAllTokens() {
          return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
              const fileId = (_a = figma.root) === null || _a === void 0 ? void 0 : _a.id;
              if (!fileId)
                return;
              const settingsKey = `gitlab-settings-${fileId}`;
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-key`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);
              yield figma.clientStorage.deleteAsync(settingsKey);
              const sharedSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
              if (sharedSettings) {
                try {
                  const settings = JSON.parse(sharedSettings);
                  settings.saveToken = false;
                  delete settings.gitlabToken;
                  figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(settings));
                } catch (e) {
                }
              }
              config_1.LoggingService.info("All GitLab tokens cleared", config_1.LoggingService.CATEGORIES.GITLAB);
            } catch (error) {
              errorHandler_1.ErrorHandler.handleError(error, {
                operation: "clear_tokens",
                component: "GitLabService",
                severity: "low"
              });
            }
          });
        }
        /**
         * Gets token expiration info (for future implementation)
         */
        static getTokenInfo() {
          return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const fileId = (_a = figma.root) === null || _a === void 0 ? void 0 : _a.id;
            if (!fileId) {
              return { encrypted: false, version: "none", hasToken: false };
            }
            const settingsKey = `gitlab-settings-${fileId}`;
            const token = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
            const cryptoVersion = yield figma.clientStorage.getAsync(`${settingsKey}-crypto`);
            return {
              hasToken: !!token,
              encrypted: !!token,
              version: cryptoVersion || (token ? "v1" : "none")
            };
          });
        }
      };
      exports.GitLabService = GitLabService;
      GitLabService.DEFAULT_HEADERS = config_1.API_CONFIG.DEFAULT_HEADERS;
    }
  });

  // dist/services/gitLabServiceAdapter.js
  var require_gitLabServiceAdapter = __commonJS({
    "dist/services/gitLabServiceAdapter.js"(exports) {
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
      exports.GitLabServiceAdapter = void 0;
      var gitlabService_1 = require_gitlabService();
      var GitLabServiceAdapter = class {
        /**
         * Convert GitSettings to GitLabSettings
         */
        toGitLabSettings(settings) {
          return {
            gitlabUrl: settings.baseUrl,
            projectId: settings.projectId,
            gitlabToken: settings.token,
            filePath: settings.filePath,
            strategy: settings.strategy,
            branchName: settings.branchName,
            exportFormat: settings.exportFormat,
            saveToken: settings.saveToken,
            savedAt: settings.savedAt,
            savedBy: settings.savedBy,
            isPersonal: settings.isPersonal,
            _needsCryptoMigration: settings._needsCryptoMigration
          };
        }
        /**
         * Convert GitLabSettings to GitSettings
         */
        fromGitLabSettings(settings) {
          if (!settings)
            return null;
          return {
            provider: "gitlab",
            baseUrl: settings.gitlabUrl,
            projectId: settings.projectId,
            token: settings.gitlabToken,
            filePath: settings.filePath,
            strategy: settings.strategy,
            branchName: settings.branchName,
            exportFormat: settings.exportFormat,
            saveToken: settings.saveToken,
            savedAt: settings.savedAt,
            savedBy: settings.savedBy,
            isPersonal: settings.isPersonal,
            _needsCryptoMigration: settings._needsCryptoMigration
          };
        }
        saveSettings(settings, shareWithTeam) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            yield gitlabService_1.GitLabService.saveSettings(gitlabSettings, shareWithTeam);
          });
        }
        loadSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = yield gitlabService_1.GitLabService.loadSettings();
            return this.fromGitLabSettings(gitlabSettings);
          });
        }
        resetSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            yield gitlabService_1.GitLabService.resetSettings();
          });
        }
        validateCredentials(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              yield this.getProject(settings);
              return true;
            } catch (error) {
              return false;
            }
          });
        }
        getProject(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            const projectData = yield gitlabService_1.GitLabService.fetchProjectInfo(settings.projectId, settings.token, gitlabSettings);
            return {
              id: projectData.id,
              name: projectData.name,
              defaultBranch: projectData.default_branch,
              webUrl: projectData.web_url
            };
          });
        }
        listRepositories(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            throw new Error("List repositories not yet implemented for GitLab");
          });
        }
        createBranch(settings, branchName, baseBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            yield gitlabService_1.GitLabService.createFeatureBranch(settings.projectId, settings.token, branchName, baseBranch, gitlabSettings);
          });
        }
        getFile(settings, filePath, branch) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            const result = yield gitlabService_1.GitLabService.prepareFileCommit(settings.projectId, settings.token, filePath, branch, gitlabSettings);
            if (!result.fileData)
              return null;
            return {
              fileName: result.fileData.file_name,
              filePath: result.fileData.file_path,
              size: result.fileData.size,
              encoding: result.fileData.encoding,
              content: result.fileData.content,
              lastCommitId: result.fileData.last_commit_id
            };
          });
        }
        commitFile(settings, commitMessage, filePath, content, branch) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            const { fileData, action } = yield gitlabService_1.GitLabService.prepareFileCommit(settings.projectId, settings.token, filePath, branch, gitlabSettings);
            const commit = yield gitlabService_1.GitLabService.createCommit(settings.projectId, settings.token, branch, commitMessage, filePath, content, action, fileData === null || fileData === void 0 ? void 0 : fileData.last_commit_id, gitlabSettings);
            return {
              id: commit.id,
              title: commit.title,
              message: commit.message,
              webUrl: commit.web_url
            };
          });
        }
        createPullRequest(settings_1, sourceBranch_1, targetBranch_1, title_1, description_1) {
          return __awaiter(this, arguments, void 0, function* (settings, sourceBranch, targetBranch, title, description, isDraft = false) {
            const gitlabSettings = this.toGitLabSettings(settings);
            const mr = yield gitlabService_1.GitLabService.createMergeRequest(settings.projectId, settings.token, sourceBranch, targetBranch, title, description, isDraft, gitlabSettings);
            return {
              id: mr.id,
              title: mr.title,
              description: mr.description,
              state: mr.state === "opened" ? "open" : mr.state,
              webUrl: mr.web_url,
              sourceBranch: mr.source_branch,
              targetBranch: mr.target_branch,
              draft: isDraft
            };
          });
        }
        findExistingPullRequest(settings, sourceBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            const mr = yield gitlabService_1.GitLabService.findExistingMergeRequest(settings.projectId, settings.token, sourceBranch, gitlabSettings);
            if (!mr)
              return null;
            return {
              id: mr.id,
              title: mr.title,
              description: mr.description,
              state: mr.state === "opened" ? "open" : mr.state,
              webUrl: mr.web_url,
              sourceBranch: mr.source_branch,
              targetBranch: mr.target_branch
            };
          });
        }
        commitWorkflow(settings, commitMessage, filePath, cssData, branchName) {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabSettings = this.toGitLabSettings(settings);
            const result = yield gitlabService_1.GitLabService.commitToGitLab(gitlabSettings, commitMessage, filePath, cssData, branchName);
            return {
              pullRequestUrl: result.mergeRequestUrl
            };
          });
        }
        clearAllTokens() {
          return __awaiter(this, void 0, void 0, function* () {
            yield gitlabService_1.GitLabService.clearAllTokens();
          });
        }
        getTokenInfo() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield gitlabService_1.GitLabService.getTokenInfo();
          });
        }
      };
      exports.GitLabServiceAdapter = GitLabServiceAdapter;
    }
  });

  // dist/services/baseGitService.js
  var require_baseGitService = __commonJS({
    "dist/services/baseGitService.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.GitNetworkError = exports.GitAuthError = exports.GitServiceError = void 0;
      var GitServiceError = class extends Error {
        constructor(message, statusCode, response) {
          super(message);
          this.statusCode = statusCode;
          this.response = response;
          this.name = "GitServiceError";
        }
      };
      exports.GitServiceError = GitServiceError;
      var GitAuthError = class extends GitServiceError {
        constructor(message = "Authentication failed") {
          super(message, 401);
          this.name = "GitAuthError";
        }
      };
      exports.GitAuthError = GitAuthError;
      var GitNetworkError = class extends GitServiceError {
        constructor(message = "Network error") {
          super(message);
          this.name = "GitNetworkError";
        }
      };
      exports.GitNetworkError = GitNetworkError;
    }
  });

  // dist/services/repositoryCacheService.js
  var require_repositoryCacheService = __commonJS({
    "dist/services/repositoryCacheService.js"(exports) {
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
      exports.RepositoryCacheService = void 0;
      var config_1 = require_config();
      var RepositoryCacheService = class {
        /**
         * Generate cache key from provider and token
         */
        static generateCacheKey(provider, token) {
          const tokenHash = this.simpleHash(token);
          return `${provider}:${tokenHash}`;
        }
        /**
         * Simple hash function for security
         */
        static simpleHash(str) {
          let hash = 0;
          if (str.length === 0)
            return hash.toString();
          for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash;
          }
          return Math.abs(hash).toString(36);
        }
        /**
         * Get repositories from cache if available and fresh
         */
        static getCachedRepositories(provider, token) {
          this.performPeriodicCleanup();
          const cacheKey = this.generateCacheKey(provider, token);
          const entry = this.cache.get(cacheKey);
          if (!entry) {
            this.metadata.missCount++;
            config_1.LoggingService.debug(`Cache miss for ${provider}`, { cacheKey }, config_1.LoggingService.CATEGORIES.GITHUB);
            return null;
          }
          const age = Date.now() - entry.timestamp;
          if (age > this.CACHE_DURATION) {
            this.cache.delete(cacheKey);
            this.metadata.missCount++;
            config_1.LoggingService.debug(`Cache expired for ${provider}`, { age, maxAge: this.CACHE_DURATION }, config_1.LoggingService.CATEGORIES.GITHUB);
            return null;
          }
          this.metadata.hitCount++;
          config_1.LoggingService.debug(`Cache hit for ${provider}`, {
            repositoryCount: entry.repositories.length,
            age
          }, config_1.LoggingService.CATEGORIES.GITHUB);
          return [...entry.repositories];
        }
        /**
         * Store repositories in cache
         */
        static cacheRepositories(provider, token, repositories) {
          this.performPeriodicCleanup();
          const cacheKey = this.generateCacheKey(provider, token);
          const tokenHash = this.simpleHash(token);
          const entry = {
            repositories: [...repositories],
            // Store copy to prevent mutation
            timestamp: Date.now(),
            provider,
            tokenHash
          };
          this.cache.set(cacheKey, entry);
          if (this.cache.size > this.MAX_CACHE_SIZE) {
            this.evictOldestEntry();
          }
          config_1.LoggingService.debug(`Cached repositories for ${provider}`, {
            repositoryCount: repositories.length,
            cacheSize: this.cache.size
          }, config_1.LoggingService.CATEGORIES.GITHUB);
        }
        /**
         * Invalidate cache for specific provider/token combination
         */
        static invalidateCache(provider, token) {
          const cacheKey = this.generateCacheKey(provider, token);
          const deleted = this.cache.delete(cacheKey);
          if (deleted) {
            config_1.LoggingService.debug(`Invalidated cache for ${provider}`, { cacheKey }, config_1.LoggingService.CATEGORIES.GITHUB);
          }
        }
        /**
         * Clear all cache entries
         */
        static clearCache() {
          const size = this.cache.size;
          this.cache.clear();
          this.metadata.hitCount = 0;
          this.metadata.missCount = 0;
          config_1.LoggingService.info(`Cleared repository cache`, { previousSize: size }, config_1.LoggingService.CATEGORIES.GITHUB);
        }
        /**
         * Get cache statistics
         */
        static getCacheStats() {
          const totalRequests = this.metadata.hitCount + this.metadata.missCount;
          const hitRate = totalRequests > 0 ? this.metadata.hitCount / totalRequests : 0;
          const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
            provider: entry.provider,
            repositoryCount: entry.repositories.length,
            age: Date.now() - entry.timestamp,
            fresh: Date.now() - entry.timestamp < this.CACHE_DURATION
          }));
          return {
            size: this.cache.size,
            hitRate: Math.round(hitRate * 100) / 100,
            entries
          };
        }
        /**
         * Perform periodic cleanup of expired entries
         */
        static performPeriodicCleanup() {
          const now = Date.now();
          const timeSinceLastCleanup = now - this.metadata.lastCleanup;
          if (timeSinceLastCleanup < this.CLEANUP_INTERVAL) {
            return;
          }
          const sizeBefore = this.cache.size;
          let removedCount = 0;
          for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > this.CACHE_DURATION) {
              this.cache.delete(key);
              removedCount++;
            }
          }
          this.metadata.lastCleanup = now;
          if (removedCount > 0) {
            config_1.LoggingService.debug(`Cleaned up expired cache entries`, {
              removed: removedCount,
              before: sizeBefore,
              after: this.cache.size
            }, config_1.LoggingService.CATEGORIES.GITHUB);
          }
        }
        /**
         * Evict oldest cache entry when cache is full
         */
        static evictOldestEntry() {
          let oldestKey = null;
          let oldestTime = Date.now();
          for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
              oldestTime = entry.timestamp;
              oldestKey = key;
            }
          }
          if (oldestKey) {
            this.cache.delete(oldestKey);
            config_1.LoggingService.debug(`Evicted oldest cache entry`, {
              key: oldestKey,
              age: Date.now() - oldestTime
            }, config_1.LoggingService.CATEGORIES.GITHUB);
          }
        }
        /**
         * Preload repositories in background (for proactive caching)
         */
        static preloadRepositories(provider, token, fetchFunction) {
          return __awaiter(this, void 0, void 0, function* () {
            const cached = this.getCachedRepositories(provider, token);
            if (cached) {
              const cacheKey = this.generateCacheKey(provider, token);
              const entry = this.cache.get(cacheKey);
              const age = Date.now() - ((entry === null || entry === void 0 ? void 0 : entry.timestamp) || 0);
              if (age > 2 * 60 * 1e3) {
                fetchFunction().then((fresh) => {
                  this.cacheRepositories(provider, token, fresh);
                }).catch((error) => {
                  config_1.LoggingService.warn(`Background repository refresh failed`, error, config_1.LoggingService.CATEGORIES.GITHUB);
                });
              }
              return cached;
            }
            try {
              const repositories = yield fetchFunction();
              this.cacheRepositories(provider, token, repositories);
              return repositories;
            } catch (error) {
              config_1.LoggingService.error(`Failed to preload repositories`, error, config_1.LoggingService.CATEGORIES.GITHUB);
              throw error;
            }
          });
        }
      };
      exports.RepositoryCacheService = RepositoryCacheService;
      RepositoryCacheService.CACHE_DURATION = 5 * 60 * 1e3;
      RepositoryCacheService.MAX_CACHE_SIZE = 10;
      RepositoryCacheService.CLEANUP_INTERVAL = 30 * 60 * 1e3;
      RepositoryCacheService.cache = /* @__PURE__ */ new Map();
      RepositoryCacheService.metadata = {
        lastCleanup: Date.now(),
        hitCount: 0,
        missCount: 0
      };
    }
  });

  // dist/services/githubService.js
  var require_githubService = __commonJS({
    "dist/services/githubService.js"(exports) {
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
      exports.GitHubService = void 0;
      var baseGitService_1 = require_baseGitService();
      var config_1 = require_config();
      var securityUtils_1 = require_securityUtils();
      var errorHandler_1 = require_errorHandler();
      var cryptoService_1 = require_cryptoService();
      var proxyService_1 = require_proxyService();
      var repositoryCacheService_1 = require_repositoryCacheService();
      var DEFAULT_BRANCH_NAME = config_1.GIT_CONFIG.DEFAULT_BRANCH;
      var GitHubService = class _GitHubService {
        /**
         * Get the GitHub API base URL
         */
        static getGitHubApiBase(settings) {
          if (settings.baseUrl && settings.baseUrl !== "https://github.com") {
            const url = new URL(settings.baseUrl);
            return `${url.origin}/api/v3`;
          }
          return "https://api.github.com";
        }
        /**
         * Parse owner and repo from projectId
         */
        static parseOwnerRepo(projectId) {
          const parts = projectId.split("/");
          if (parts.length !== 2) {
            throw new Error("GitHub project ID must be in format: owner/repo");
          }
          return { owner: parts[0], repo: parts[1] };
        }
        /**
         * Generate storage key for settings
         */
        static getSettingsKey() {
          const figmaFileId = figma.root.id;
          return `github-settings-${figmaFileId}`;
        }
        saveSettings(settings, shareWithTeam) {
          return __awaiter(this, void 0, void 0, function* () {
            if (!settings || typeof settings !== "object") {
              throw new Error(config_1.ERROR_MESSAGES.INVALID_SETTINGS);
            }
            try {
              const settingsKey = _GitHubService.getSettingsKey();
              if (!shareWithTeam) {
                yield figma.clientStorage.setAsync(settingsKey, settings);
              } else {
                const settingsToSave = Object.assign({}, settings);
                if (!settings.saveToken) {
                  delete settingsToSave.token;
                }
                figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(settingsToSave));
                if (settings.saveToken && settings.token) {
                  try {
                    console.log("DEBUG: Starting token encryption");
                    let cryptoAvailable = false;
                    try {
                      console.log("DEBUG: Checking CryptoService.isAvailable");
                      console.log("DEBUG: CryptoService object:", cryptoService_1.CryptoService);
                      cryptoAvailable = cryptoService_1.CryptoService.isAvailable();
                      console.log("DEBUG: CryptoService.isAvailable result:", cryptoAvailable);
                    } catch (cryptoError) {
                      console.warn("CryptoService.isAvailable() failed:", cryptoError);
                      cryptoAvailable = false;
                    }
                    if (cryptoAvailable) {
                      console.log("DEBUG: Calls CryptoService.encrypt");
                      const encryptedToken = yield cryptoService_1.CryptoService.encrypt(settings.token);
                      console.log("DEBUG: CryptoService.encrypt success");
                      yield figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
                      yield figma.clientStorage.setAsync(`${settingsKey}-crypto`, "v2");
                    } else {
                      console.log("DEBUG: Using fallback encryption");
                      console.log("DEBUG: SecurityUtils object:", securityUtils_1.SecurityUtils);
                      if (typeof securityUtils_1.SecurityUtils.generateEncryptionKey !== "function") {
                        console.error("CRITICAL: SecurityUtils.generateEncryptionKey is not a function");
                      }
                      const encryptionKey = securityUtils_1.SecurityUtils.generateEncryptionKey();
                      if (typeof securityUtils_1.SecurityUtils.encryptData !== "function") {
                        console.error("CRITICAL: SecurityUtils.encryptData is not a function");
                      }
                      const encryptedToken = securityUtils_1.SecurityUtils.encryptData(settings.token, encryptionKey);
                      yield figma.clientStorage.setAsync(`${settingsKey}-token`, encryptedToken);
                      yield figma.clientStorage.setAsync(`${settingsKey}-key`, encryptionKey);
                    }
                  } catch (error) {
                    console.error("DEBUG: Caught error in encrypt_token:", error);
                    errorHandler_1.ErrorHandler.handleError(error, {
                      operation: "encrypt_token",
                      component: "GitHubService",
                      severity: "high"
                    });
                    delete settingsToSave.token;
                  }
                }
              }
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, JSON.stringify({
                sharedWithTeam: shareWithTeam,
                savedAt: settings.savedAt,
                savedBy: settings.savedBy
              }));
            } catch (error) {
              config_1.LoggingService.error("Error saving GitHub settings", error, config_1.LoggingService.CATEGORIES.GITHUB);
              throw new baseGitService_1.GitServiceError(`Error saving GitHub settings: ${error.message || "Unknown error"}`, void 0, error);
            }
          });
        }
        loadSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const settingsKey = _GitHubService.getSettingsKey();
              const documentSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
              if (documentSettings) {
                try {
                  const settings = JSON.parse(documentSettings);
                  if (settings.saveToken && !settings.token) {
                    const encryptedToken = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
                    const cryptoVersion = yield figma.clientStorage.getAsync(`${settingsKey}-crypto`);
                    if (encryptedToken) {
                      try {
                        let cryptoAvailable = false;
                        try {
                          cryptoAvailable = cryptoService_1.CryptoService.isAvailable();
                        } catch (cryptoError) {
                          console.warn("CryptoService.isAvailable() failed during decrypt:", cryptoError);
                          cryptoAvailable = false;
                        }
                        if (cryptoVersion === "v2" && cryptoAvailable) {
                          settings.token = yield cryptoService_1.CryptoService.decrypt(encryptedToken);
                        } else if (yield figma.clientStorage.getAsync(`${settingsKey}-key`)) {
                          const encryptionKey = yield figma.clientStorage.getAsync(`${settingsKey}-key`);
                          settings.token = securityUtils_1.SecurityUtils.decryptData(encryptedToken, encryptionKey);
                          settings._needsCryptoMigration = true;
                        }
                      } catch (error) {
                        errorHandler_1.ErrorHandler.handleError(error, {
                          operation: "decrypt_token",
                          component: "GitHubService",
                          severity: "medium"
                        });
                      }
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
                  config_1.LoggingService.error("Error parsing document settings", parseError, config_1.LoggingService.CATEGORIES.GITHUB);
                }
              }
              const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
              if (personalSettings) {
                return Object.assign({}, personalSettings, { isPersonal: true });
              }
              return null;
            } catch (error) {
              config_1.LoggingService.error("Error loading GitHub settings", error, config_1.LoggingService.CATEGORIES.GITHUB);
              return null;
            }
          });
        }
        resetSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const settingsKey = _GitHubService.getSettingsKey();
              figma.root.setSharedPluginData("Bridgy", settingsKey, "");
              figma.root.setSharedPluginData("Bridgy", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-key`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);
            } catch (error) {
              config_1.LoggingService.error("Error resetting GitHub settings", error, config_1.LoggingService.CATEGORIES.GITHUB);
              throw new baseGitService_1.GitServiceError(`Error resetting GitHub settings: ${error.message || "Unknown error"}`, void 0, error);
            }
          });
        }
        validateCredentials(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              yield this.getProject(settings);
              return true;
            } catch (error) {
              return false;
            }
          });
        }
        getProject(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const url = `${apiBase}/repos/${owner}/${repo}`;
            try {
              const response = yield this.makeAPIRequest(url, {
                method: "GET",
                headers: this.getHeaders(settings.token)
              }, settings);
              const repoData = yield response.json();
              return {
                id: repoData.id,
                name: repoData.name,
                fullName: repoData.full_name,
                defaultBranch: repoData.default_branch,
                webUrl: repoData.html_url,
                description: repoData.description,
                private: repoData.private
              };
            } catch (error) {
              throw this.handleGitHubError(error, "fetch repository information");
            }
          });
        }
        listRepositories(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const cached = repositoryCacheService_1.RepositoryCacheService.getCachedRepositories("github", settings.token);
            if (cached) {
              return cached;
            }
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            try {
              const allRepos = [];
              let page = 1;
              const perPage = 100;
              while (page <= 5) {
                const url = `${apiBase}/user/repos?per_page=${perPage}&sort=updated&page=${page}&type=all`;
                const response = yield this.makeAPIRequest(url, {
                  method: "GET",
                  headers: this.getHeaders(settings.token)
                }, settings);
                const repos = yield response.json();
                if (repos.length === 0) {
                  break;
                }
                allRepos.push(...repos);
                if (repos.length < perPage) {
                  break;
                }
                page++;
              }
              const projects = allRepos.map((repo) => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                defaultBranch: repo.default_branch,
                webUrl: repo.html_url,
                description: repo.description,
                private: repo.private,
                language: repo.language,
                stargazers_count: repo.stargazers_count,
                forks_count: repo.forks_count,
                updatedAt: repo.updated_at,
                createdAt: repo.created_at,
                topics: repo.topics || [],
                owner: {
                  login: repo.owner.login,
                  avatar_url: repo.owner.avatar_url
                }
              }));
              repositoryCacheService_1.RepositoryCacheService.cacheRepositories("github", settings.token, projects);
              return projects;
            } catch (error) {
              throw this.handleGitHubError(error, "list repositories");
            }
          });
        }
        /**
         * List branches for a repository
         */
        listBranches(settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            try {
              const repoData = yield this.getProject(settings);
              const defaultBranch = repoData.defaultBranch;
              const url = `${apiBase}/repos/${owner}/${repo}/branches`;
              const response = yield this.makeAPIRequest(url, {
                method: "GET",
                headers: this.getHeaders(settings.token)
              }, settings);
              const branches = yield response.json();
              return branches.map((branch) => ({
                name: branch.name,
                isDefault: branch.name === defaultBranch
              }));
            } catch (error) {
              throw this.handleGitHubError(error, "list branches");
            }
          });
        }
        createBranch(settings, branchName, baseBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const baseBranchUrl = `${apiBase}/repos/${owner}/${repo}/git/refs/heads/${baseBranch}`;
            try {
              const baseResponse = yield this.makeAPIRequest(baseBranchUrl, {
                method: "GET",
                headers: this.getHeaders(settings.token)
              }, settings);
              const baseRef = yield baseResponse.json();
              const baseSha = baseRef.object.sha;
              const createBranchUrl = `${apiBase}/repos/${owner}/${repo}/git/refs`;
              yield this.makeAPIRequest(createBranchUrl, {
                method: "POST",
                headers: this.getHeaders(settings.token),
                body: JSON.stringify({
                  ref: `refs/heads/${branchName}`,
                  sha: baseSha
                })
              }, settings);
            } catch (error) {
              if (error instanceof baseGitService_1.GitServiceError && error.statusCode === 422) {
                const message = error.message.toLowerCase();
                if (message.includes("already exists") || message.includes("reference already exists")) {
                  return;
                }
              }
              throw this.handleGitHubError(error, `create branch '${branchName}'`);
            }
          });
        }
        getFile(settings, filePath, branch) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
            try {
              const response = yield this.makeAPIRequest(url, {
                method: "GET",
                headers: this.getHeaders(settings.token)
              }, settings);
              const fileData = yield response.json();
              if (fileData.type !== "file") {
                throw new Error("Path is not a file");
              }
              return {
                fileName: fileData.name,
                filePath: fileData.path,
                size: fileData.size,
                encoding: fileData.encoding,
                content: fileData.content,
                lastCommitId: fileData.sha,
                sha: fileData.sha
              };
            } catch (error) {
              if (error instanceof baseGitService_1.GitServiceError && error.statusCode === 404) {
                return null;
              }
              throw this.handleGitHubError(error, "fetch file content");
            }
          });
        }
        commitFile(settings, commitMessage, filePath, content, branch) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const url = `${apiBase}/repos/${owner}/${repo}/contents/${filePath}`;
            let existingFile;
            try {
              existingFile = yield this.getFile(settings, filePath, branch);
            } catch (e) {
            }
            const encodedContent = securityUtils_1.SecurityUtils.toBase64(content);
            const requestBody = {
              message: commitMessage,
              content: encodedContent,
              branch
            };
            if (existingFile) {
              requestBody.sha = existingFile.sha;
            }
            try {
              const response = yield this.makeAPIRequest(url, {
                method: "PUT",
                headers: this.getHeaders(settings.token),
                body: JSON.stringify(requestBody)
              }, settings);
              const result = yield response.json();
              return {
                id: result.commit.sha,
                sha: result.commit.sha,
                title: commitMessage,
                message: commitMessage,
                webUrl: result.commit.html_url
              };
            } catch (error) {
              console.error("DEBUG: commitFile error catch block:", error);
              console.log("DEBUG: this.handleGitHubError type:", typeof this.handleGitHubError);
              throw this.handleGitHubError(error, "create commit");
            }
          });
        }
        createPullRequest(settings_1, sourceBranch_1, targetBranch_1, title_1, description_1) {
          return __awaiter(this, arguments, void 0, function* (settings, sourceBranch, targetBranch, title, description, isDraft = false) {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const url = `${apiBase}/repos/${owner}/${repo}/pulls`;
            try {
              const response = yield this.makeAPIRequest(url, {
                method: "POST",
                headers: this.getHeaders(settings.token),
                body: JSON.stringify({
                  title,
                  body: description,
                  head: sourceBranch,
                  base: targetBranch,
                  draft: isDraft
                })
              }, settings);
              const pr = yield response.json();
              return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                description: pr.body,
                state: pr.state,
                webUrl: pr.html_url,
                sourceBranch: pr.head.ref,
                targetBranch: pr.base.ref,
                draft: pr.draft
              };
            } catch (error) {
              throw this.handleGitHubError(error, "create pull request");
            }
          });
        }
        findExistingPullRequest(settings, sourceBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
            const apiBase = _GitHubService.getGitHubApiBase(settings);
            const url = `${apiBase}/repos/${owner}/${repo}/pulls?state=open&head=${owner}:${sourceBranch}`;
            try {
              const response = yield this.makeAPIRequest(url, {
                method: "GET",
                headers: this.getHeaders(settings.token)
              }, settings);
              const prs = yield response.json();
              if (prs.length === 0) {
                return null;
              }
              const pr = prs[0];
              return {
                id: pr.id,
                number: pr.number,
                title: pr.title,
                description: pr.body,
                state: pr.state,
                webUrl: pr.html_url,
                sourceBranch: pr.head.ref,
                targetBranch: pr.base.ref,
                draft: pr.draft
              };
            } catch (error) {
              throw this.handleGitHubError(error, "find existing pull request");
            }
          });
        }
        commitWorkflow(settings_1, commitMessage_1, filePath_1, cssData_1) {
          return __awaiter(this, arguments, void 0, function* (settings, commitMessage, filePath, cssData, branchName = DEFAULT_BRANCH_NAME) {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              this.validateCommitParameters(settings, commitMessage, filePath, cssData);
              const project = yield this.getProject(settings);
              const defaultBranch = project.defaultBranch;
              yield this.createBranch(settings, branchName, defaultBranch);
              yield this.commitFile(settings, commitMessage, filePath, cssData, branchName);
              const existingPR = yield this.findExistingPullRequest(settings, branchName);
              if (!existingPR) {
                const newPR = yield this.createPullRequest(settings, branchName, defaultBranch, commitMessage, "Automatically created pull request for CSS variables update", false);
                return { pullRequestUrl: newPR.webUrl };
              }
              console.log("DEBUG: Found existing PR");
              return { pullRequestUrl: existingPR.webUrl };
            }), {
              operation: "commit_to_github",
              component: "GitHubService",
              severity: "high"
            });
          });
        }
        clearAllTokens() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const settingsKey = _GitHubService.getSettingsKey();
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-key`);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-crypto`);
              yield figma.clientStorage.deleteAsync(settingsKey);
              const sharedSettings = figma.root.getSharedPluginData("Bridgy", settingsKey);
              if (sharedSettings) {
                try {
                  const settings = JSON.parse(sharedSettings);
                  settings.saveToken = false;
                  delete settings.token;
                  figma.root.setSharedPluginData("Bridgy", settingsKey, JSON.stringify(settings));
                } catch (e) {
                }
              }
              config_1.LoggingService.info("All GitHub tokens cleared", config_1.LoggingService.CATEGORIES.GITHUB);
            } catch (error) {
              errorHandler_1.ErrorHandler.handleError(error, {
                operation: "clear_tokens",
                component: "GitHubService",
                severity: "low"
              });
            }
          });
        }
        getTokenInfo() {
          return __awaiter(this, void 0, void 0, function* () {
            const settingsKey = _GitHubService.getSettingsKey();
            const token = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
            const cryptoVersion = yield figma.clientStorage.getAsync(`${settingsKey}-crypto`);
            return {
              hasToken: !!token,
              encrypted: !!token,
              version: cryptoVersion || (token ? "v1" : "none")
            };
          });
        }
        /**
         * Private helper methods
         */
        getHeaders(token) {
          return Object.assign({}, _GitHubService.DEFAULT_HEADERS, {
            Authorization: `Bearer ${token}`,
            Accept: _GitHubService.API_VERSION
          });
        }
        validateCommitParameters(settings, commitMessage, filePath, cssData) {
          if (!settings.projectId || !settings.projectId.trim()) {
            throw new Error("Project ID is required");
          }
          const { owner, repo } = _GitHubService.parseOwnerRepo(settings.projectId);
          if (!settings.token || !settings.token.trim()) {
            throw new baseGitService_1.GitAuthError("GitHub token is required");
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
        normalizeComponentName(componentName) {
          return componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        }
        makeAPIRequest(url, options, settings) {
          return __awaiter(this, void 0, void 0, function* () {
            const timeoutMs = 3e4;
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => {
                reject(new baseGitService_1.GitNetworkError("Request timed out - please check your connection to GitHub"));
              }, timeoutMs);
            });
            try {
              const useProxy = proxyService_1.ProxyService.shouldUseProxy(url);
              const response = yield Promise.race([
                useProxy ? proxyService_1.ProxyService.proxyGitLabRequest(url, options) : fetch(url, options),
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
                  }
                } catch (_a) {
                }
                const error = new baseGitService_1.GitServiceError(errorMessage, response.status);
                throw error;
              }
              return response;
            } catch (error) {
              if (error instanceof baseGitService_1.GitServiceError || error instanceof baseGitService_1.GitNetworkError) {
                throw error;
              }
              if (error.name === "TypeError" && error.message.indexOf("fetch") !== -1) {
                throw new baseGitService_1.GitNetworkError("Network error - unable to connect to GitHub API");
              }
              throw error;
            }
          });
        }
        handleGitHubError(error, operation) {
          var _a, _b;
          if (error instanceof baseGitService_1.GitServiceError || error instanceof baseGitService_1.GitAuthError || error instanceof baseGitService_1.GitNetworkError) {
            return error;
          }
          if (error.statusCode) {
            switch (error.statusCode) {
              case 401:
              case 403:
                return new baseGitService_1.GitAuthError(`Authentication failed while trying to ${operation}. Please check your GitHub token.`);
              case 404:
                return new baseGitService_1.GitServiceError(`Resource not found while trying to ${operation}. Please check your repository.`, 404);
              case 422:
                return new baseGitService_1.GitServiceError(`Invalid data provided while trying to ${operation}. Please check your inputs.`, 422);
              case 429:
                return new baseGitService_1.GitServiceError(`Rate limit exceeded while trying to ${operation}. Please try again later.`, 429);
              default:
                return new baseGitService_1.GitServiceError(`GitHub API error while trying to ${operation}: ${error.message || "Unknown error"}`, error.statusCode);
            }
          }
          if (error.name === "TypeError" || ((_a = error.message) === null || _a === void 0 ? void 0 : _a.indexOf("fetch")) !== -1 || ((_b = error.message) === null || _b === void 0 ? void 0 : _b.indexOf("network")) !== -1) {
            return new baseGitService_1.GitNetworkError(`Network error while trying to ${operation}`);
          }
          return new baseGitService_1.GitServiceError(`Failed to ${operation}: ${error.message || "Unknown error"}`);
        }
      };
      exports.GitHubService = GitHubService;
      GitHubService.DEFAULT_HEADERS = config_1.API_CONFIG.DEFAULT_HEADERS;
      GitHubService.API_VERSION = "application/vnd.github.v3+json";
    }
  });

  // dist/services/gitServiceFactory.js
  var require_gitServiceFactory = __commonJS({
    "dist/services/gitServiceFactory.js"(exports) {
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
      exports.GitServiceFactory = void 0;
      var gitLabServiceAdapter_1 = require_gitLabServiceAdapter();
      var githubService_1 = require_githubService();
      var GitServiceFactory = class {
        /**
         * Get or create a Git service instance based on provider
         */
        static getService(provider) {
          if (!this.instances.has(provider)) {
            switch (provider) {
              case "gitlab":
                this.instances.set(provider, new gitLabServiceAdapter_1.GitLabServiceAdapter());
                break;
              case "github":
                this.instances.set(provider, new githubService_1.GitHubService());
                break;
              default:
                throw new Error(`Unsupported Git provider: ${provider}`);
            }
          }
          return this.instances.get(provider);
        }
        /**
         * Get service based on current settings
         */
        static getServiceFromSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabService = this.getService("gitlab");
            const githubService = this.getService("github");
            const gitlabSettings = yield gitlabService.loadSettings();
            if (gitlabSettings) {
              return gitlabService;
            }
            const githubSettings = yield githubService.loadSettings();
            if (githubSettings) {
              return githubService;
            }
            return null;
          });
        }
        /**
         * Clear all instances (useful for testing or cleanup)
         */
        static clearInstances() {
          this.instances.clear();
        }
        /**
         * Migrate settings from old format to new format
         */
        static migrateSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            const gitlabService = this.getService("gitlab");
            const settings = yield gitlabService.loadSettings();
            if (settings && !settings.provider) {
              settings.provider = "gitlab";
              yield gitlabService.saveSettings(settings, !settings.isPersonal);
            }
          });
        }
        /**
         * Get available providers
         */
        static getAvailableProviders() {
          return ["gitlab", "github"];
        }
        /**
         * Check if a provider is supported
         */
        static isProviderSupported(provider) {
          return this.getAvailableProviders().indexOf(provider) !== -1;
        }
      };
      exports.GitServiceFactory = GitServiceFactory;
      GitServiceFactory.instances = /* @__PURE__ */ new Map();
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

  // dist/services/tailwindV4Service.js
  var require_tailwindV4Service = __commonJS({
    "dist/services/tailwindV4Service.js"(exports) {
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
      exports.TailwindV4Service = exports.TAILWIND_V4_NAMESPACES = void 0;
      var errorHandler_1 = require_errorHandler();
      exports.TAILWIND_V4_NAMESPACES = [
        "color",
        "font",
        "text",
        "font-weight",
        "tracking",
        "leading",
        "breakpoint",
        "container",
        "spacing",
        "radius",
        "shadow",
        "inset-shadow",
        "drop-shadow",
        "blur",
        "perspective",
        "aspect",
        "ease",
        "animate"
      ];
      var TailwindV4Service = class {
        /**
         * Check if a group name is a valid Tailwind v4 namespace
         */
        static isValidNamespace(groupName) {
          const normalized = groupName.toLowerCase().trim();
          return exports.TAILWIND_V4_NAMESPACES.indexOf(normalized) !== -1;
        }
        /**
         * Check if a variable name is compatible with Tailwind v4 (starts with valid namespace)
         */
        static isCompatible(name) {
          const normalizedName = name.replace(/\//g, "-").toLowerCase();
          return exports.TAILWIND_V4_NAMESPACES.some((prefix) => normalizedName.startsWith(`${prefix}-`));
        }
        /**
         * Validate all variable groups for Tailwind v4 compatibility
         */
        static validateVariableGroups() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              if (!collections || collections.length === 0) {
                return {
                  isValid: true,
                  // Empty is technically valid
                  groups: [],
                  invalidGroups: []
                };
              }
              const allGroups = [];
              const invalidGroups = [];
              const standaloneVariables = [];
              for (const collection of collections) {
                const groupMap = /* @__PURE__ */ new Map();
                for (const variableId of collection.variableIds) {
                  const variable = yield figma.variables.getVariableByIdAsync(variableId);
                  if (!variable)
                    continue;
                  const pathMatch = variable.name.match(/^([^\/]+)\//);
                  if (pathMatch) {
                    const groupName = pathMatch[1];
                    groupMap.set(groupName, (groupMap.get(groupName) || 0) + 1);
                  } else {
                    const standaloneInfo = {
                      name: variable.name,
                      isValid: false,
                      variableCount: 1,
                      isStandalone: true,
                      variableId: variable.id,
                      collectionId: collection.id
                    };
                    standaloneVariables.push(standaloneInfo);
                    allGroups.push(standaloneInfo);
                    invalidGroups.push(variable.name);
                  }
                }
                for (const [groupName, count] of groupMap.entries()) {
                  const isValid = this.isValidNamespace(groupName);
                  const groupInfo = {
                    name: groupName,
                    isValid,
                    namespace: isValid ? groupName.toLowerCase() : void 0,
                    variableCount: count,
                    isStandalone: false
                  };
                  allGroups.push(groupInfo);
                  if (!isValid) {
                    invalidGroups.push(groupName);
                  }
                }
              }
              return {
                isValid: invalidGroups.length === 0,
                groups: allGroups,
                invalidGroups,
                standaloneVariables: standaloneVariables.length > 0 ? standaloneVariables[0] : void 0
                // Keep for backward compatibility
              };
            }), {
              operation: "validate_tailwind_v4_groups",
              component: "TailwindV4Service",
              severity: "medium"
            });
          });
        }
        /**
         * Format variable name for Tailwind v4
         * Removes the group prefix and formats the rest
         */
        static formatTailwindVariableName(name) {
          const withoutPrefix = name.replace(/^[^\/]+\//, "");
          return withoutPrefix.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        }
        /**
         * Build Tailwind v4 compatible CSS output
         */
        static buildTailwindV4CSS(collections) {
          const lines = [];
          lines.push("@theme {");
          for (const collection of collections) {
            lines.push(`  /* Collection: ${collection.name} */`);
            const sortedGroupNames = Object.keys(collection.groups).sort();
            for (const groupName of sortedGroupNames) {
              const namespace = groupName.toLowerCase();
              const variables = collection.groups[groupName];
              if (variables.length === 0)
                continue;
              lines.push(`
  /* ${groupName} */`);
              for (const variable of variables) {
                const varName = this.formatTailwindVariableName(variable.originalName);
                lines.push(`  --${namespace}-${varName}: ${variable.value};`);
              }
            }
            if (collection.variables.length > 0) {
              lines.push(`
  /* WARNING: Variables without namespace - not standard Tailwind v4 */`);
              for (const variable of collection.variables) {
                lines.push(`  --${variable.name}: ${variable.value};`);
              }
            }
          }
          lines.push("}");
          const allModeNames = this.getAllModeNames(collections);
          if (allModeNames.length > 1) {
            allModeNames.slice(1).forEach((modeName) => {
              lines.push(`
[data-theme="${modeName}"] {`);
              for (const collection of collections) {
                const sortedGroupNames = Object.keys(collection.groups).sort();
                for (const groupName of sortedGroupNames) {
                  const namespace = groupName.toLowerCase();
                  const variables = collection.groups[groupName];
                  if (variables.length === 0)
                    continue;
                  const modeSpecificVars = variables.filter((v) => v.modes && v.modes[modeName]);
                  if (modeSpecificVars.length === 0)
                    continue;
                  lines.push("");
                  for (const variable of modeSpecificVars) {
                    const varName = this.formatTailwindVariableName(variable.originalName);
                    const modeValue = variable.modes[modeName];
                    lines.push(`  --${namespace}-${varName}: ${modeValue};`);
                  }
                }
                const modeSpecificStandaloneVars = collection.variables.filter((v) => v.modes && v.modes[modeName]);
                if (modeSpecificStandaloneVars.length > 0) {
                  lines.push("");
                  for (const variable of modeSpecificStandaloneVars) {
                    const modeValue = variable.modes[modeName];
                    lines.push(`  --${variable.name}: ${modeValue};`);
                  }
                }
              }
              lines.push("}");
            });
          }
          return lines.join("\n");
        }
        /**
         * Get all unique mode names from collections
         */
        static getAllModeNames(collections) {
          const modeNames = /* @__PURE__ */ new Set();
          collections.forEach((collection) => {
            collection.variables.forEach((variable) => {
              if (variable.modes) {
                Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
              }
            });
            Object.keys(collection.groups).forEach((groupKey) => {
              collection.groups[groupKey].forEach((variable) => {
                if (variable.modes) {
                  Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
                }
              });
            });
          });
          return Array.from(modeNames).sort();
        }
        /**
         * Get a user-friendly list of valid namespaces
         */
        static getValidNamespacesList() {
          return [...exports.TAILWIND_V4_NAMESPACES].sort();
        }
        /**
         * Get suggestions for invalid group names
         */
        static getSuggestion(groupName) {
          const normalized = groupName.toLowerCase().trim();
          const suggestions = {
            colors: "color",
            colour: "color",
            fonts: "font",
            "font-family": "font",
            "font-size": "text",
            "text-size": "text",
            size: "text",
            weight: "font-weight",
            "letter-spacing": "tracking",
            "line-height": "leading",
            line: "leading",
            space: "spacing",
            padding: "spacing",
            margin: "spacing",
            gap: "spacing",
            "border-radius": "radius",
            rounded: "radius",
            shadows: "shadow",
            "box-shadow": "shadow",
            timing: "ease",
            "timing-function": "ease",
            transition: "ease",
            animation: "animate",
            "aspect-ratio": "aspect",
            breakpoints: "breakpoint",
            screen: "breakpoint"
          };
          return suggestions[normalized] || null;
        }
      };
      exports.TailwindV4Service = TailwindV4Service;
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
      var tailwindV4Service_1 = require_tailwindV4Service();
      var CSS_VARIABLE_PREFIX = "--";
      var SCSS_VARIABLE_PREFIX = "$";
      var DEFAULT_FORMAT = "css";
      var CSSExportService = class {
        /**
         * Export variables in the specified format (CSS, SCSS, or Tailwind v4)
         */
        static exportVariables() {
          return __awaiter(this, arguments, void 0, function* (format = DEFAULT_FORMAT) {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const validFormats = ["css", "scss", "tailwind-v4"];
              if (validFormats.indexOf(format.toLowerCase()) === -1) {
                throw new Error(`Invalid export format: ${format}. Must be 'css', 'scss', or 'tailwind-v4'.`);
              }
              if (format === "tailwind-v4") {
                const validation = yield tailwindV4Service_1.TailwindV4Service.validateVariableGroups();
                if (!validation.isValid) {
                  throw new Error(`Cannot export to Tailwind v4 format. Invalid variable group namespaces: ${validation.invalidGroups.join(", ")}. All variable groups must use valid Tailwind v4 namespaces (e.g., color, spacing, radius).`);
                }
              }
              yield this.initialize();
              yield this.initialize();
              const collections = yield this.getProcessedCollections();
              let css = "";
              if (collections && collections.length > 0) {
                css += this.buildExportContent(collections, format);
              }
              if (format !== "tailwind-v4") {
                css += yield this.buildStylesContent(format);
              }
              if (!css) {
                throw new Error("No variables or styles found to export.");
              }
              return css;
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
            const formattedName = this.formatVariableName(variable.name);
            const modes = {};
            const hasMultipleModes = collection.modes.length > 1;
            for (const mode of collection.modes) {
              const value = variable.valuesByMode[mode.modeId];
              const cssValue = this.resolveCSSValue(variable, value, collection);
              if (cssValue !== null) {
                modes[mode.name] = cssValue;
              }
            }
            if (Object.keys(modes).length === 0) {
              return null;
            }
            return {
              name: formattedName,
              value: modes[collection.modes[0].name],
              // Default value (for :root)
              modes: hasMultipleModes ? modes : null,
              // All mode values
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
        // Helper: Round to max 2 decimal places to avoid excessive precision
        static round(value) {
          return Math.round(value * 100) / 100;
        }
        // Helper: Map Figma font style to CSS font-weight
        static mapFontWeight(style) {
          const lowerStyle = style.toLowerCase();
          if (lowerStyle.includes("thin") || lowerStyle.includes("hairline"))
            return 100;
          if (lowerStyle.includes("extra light") || lowerStyle.includes("extralight"))
            return 200;
          if (lowerStyle.includes("light"))
            return 300;
          if (lowerStyle.includes("normal") || lowerStyle.includes("regular"))
            return 400;
          if (lowerStyle.includes("medium"))
            return 500;
          if (lowerStyle.includes("semi bold") || lowerStyle.includes("semibold"))
            return 600;
          if (lowerStyle.includes("bold"))
            return 700;
          if (lowerStyle.includes("extra bold") || lowerStyle.includes("extrabold"))
            return 800;
          if (lowerStyle.includes("black") || lowerStyle.includes("heavy"))
            return 900;
          return 400;
        }
        // Helper: Sanitize variable names
        static sanitizeName(name) {
          let cleanName = name.replace(/^(www\.|https?:\/\/)?(figma\.com\/)?/, "");
          cleanName = cleanName.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
          cleanName = cleanName.replace(/-+/g, "-");
          return cleanName.replace(/^-+|-+$/g, "");
        }
        /**
         * Format variable name to valid CSS custom property name
         */
        static formatVariableName(name) {
          return this.sanitizeName(name);
        }
        /**
         * Build the final export content from processed collections
         */
        static buildExportContent(collections, format) {
          if (format === "tailwind-v4") {
            return tailwindV4Service_1.TailwindV4Service.buildTailwindV4CSS(collections);
          }
          const contentParts = [];
          const hasMultiModeVariables = collections.some((collection) => collection.variables.some((variable) => variable.modes !== null) || Object.keys(collection.groups).some((groupKey) => collection.groups[groupKey].some((variable) => variable.modes !== null)));
          if (format === "css") {
            contentParts.push(":root {");
            collections.forEach((collection) => {
              contentParts.push(this.buildCollectionContent(collection, format, false));
            });
            contentParts.push("}");
            if (hasMultiModeVariables) {
              const allModeNames = this.getAllModeNames(collections);
              allModeNames.slice(1).forEach((modeName) => {
                contentParts.push(`
[data-theme="${modeName}"] {`);
                collections.forEach((collection) => {
                  contentParts.push(this.buildCollectionContent(collection, format, true, modeName));
                });
                contentParts.push("}");
              });
            }
          } else {
            collections.forEach((collection) => {
              contentParts.push(this.buildCollectionContent(collection, format, false));
            });
          }
          return contentParts.join("\n");
        }
        /**
         * Build content for styles (Paint, Text, Effect, Grid)
         */
        static buildStylesContent(format) {
          return __awaiter(this, void 0, void 0, function* () {
            const parts = [];
            const commentPrefix = format === "scss" ? "//" : "  /*";
            const commentSuffix = format === "scss" ? "" : " */";
            parts.push(`
${commentPrefix} ===== STYLES =====${commentSuffix}`);
            if (format === "css")
              parts.push(":root {");
            const usedNames = /* @__PURE__ */ new Set();
            const paintStyles = yield figma.getLocalPaintStylesAsync();
            if (paintStyles.length > 0) {
              parts.push(`
${commentPrefix} Colors${commentSuffix}`);
              paintStyles.forEach((style) => {
                const baseName = this.formatVariableName(style.name);
                let name = baseName;
                let i = 1;
                while (usedNames.has(name)) {
                  name = `${baseName}-${i++}`;
                }
                usedNames.add(name);
                const boundVariables = style.boundVariables;
                let val = null;
                if (boundVariables && boundVariables["paints"] && boundVariables["paints"][0]) {
                  const alias = boundVariables["paints"][0];
                  val = this.resolveVariableAlias(alias.id);
                }
                if (!val) {
                  const paint = style.paints[0];
                  if (paint) {
                    val = this.formatPaintValue(paint);
                  }
                }
                if (val)
                  parts.push(`  ${CSS_VARIABLE_PREFIX}color-${name}: ${val};`);
              });
            }
            const textStyles = yield figma.getLocalTextStylesAsync();
            if (textStyles.length > 0) {
              parts.push(`
${commentPrefix} Typography${commentSuffix}`);
              textStyles.forEach((style) => {
                const baseName = this.formatVariableName(style.name);
                const bound = style.boundVariables || {};
                let fontFamily = null;
                if (bound["fontFamily"]) {
                  fontFamily = this.resolveVariableAlias(bound["fontFamily"].id);
                }
                if (!fontFamily) {
                  fontFamily = `"${style.fontName.family}"`;
                }
                parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-family: ${fontFamily};`);
                let fontSize = null;
                if (bound["fontSize"]) {
                  fontSize = this.resolveVariableAlias(bound["fontSize"].id);
                }
                if (!fontSize) {
                  fontSize = `${this.round(style.fontSize)}px`;
                }
                parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-size: ${fontSize};`);
                let fontWeight = null;
                if (bound["fontStyle"]) {
                  fontWeight = this.resolveVariableAlias(bound["fontStyle"].id);
                }
                if (!fontWeight && bound["fontWeight"]) {
                  fontWeight = this.resolveVariableAlias(bound["fontWeight"].id);
                }
                if (!fontWeight) {
                  fontWeight = `${this.mapFontWeight(style.fontName.style)}`;
                }
                parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-weight: ${fontWeight};`);
                let lineHeight = null;
                if (bound["lineHeight"]) {
                  lineHeight = this.resolveVariableAlias(bound["lineHeight"].id);
                }
                if (!lineHeight && style.lineHeight && style.lineHeight.unit !== "AUTO") {
                  lineHeight = style.lineHeight.unit === "PIXELS" ? `${this.round(style.lineHeight.value)}px` : `${this.round(style.lineHeight.value)}`;
                }
                if (lineHeight) {
                  parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-line-height: ${lineHeight};`);
                }
                let letterSpacing = null;
                if (bound["letterSpacing"]) {
                  letterSpacing = this.resolveVariableAlias(bound["letterSpacing"].id);
                }
                if (!letterSpacing && style.letterSpacing && style.letterSpacing.unit === "PIXELS") {
                  letterSpacing = `${this.round(style.letterSpacing.value)}px`;
                }
                if (letterSpacing) {
                  parts.push(`  ${CSS_VARIABLE_PREFIX}font-${baseName}-letter-spacing: ${letterSpacing};`);
                }
              });
            }
            const effectStyles = yield figma.getLocalEffectStylesAsync();
            if (effectStyles.length > 0) {
              parts.push(`
${commentPrefix} Effects${commentSuffix}`);
              effectStyles.forEach((style) => {
                var _a;
                const name = this.formatVariableName(style.name);
                const val = this.formatEffectsValue(style.effects, (_a = style.boundVariables) === null || _a === void 0 ? void 0 : _a["effects"]);
                if (val)
                  parts.push(`  ${CSS_VARIABLE_PREFIX}effect-${name}: ${val};`);
              });
            }
            const gridStyles = yield figma.getLocalGridStylesAsync();
            if (gridStyles.length > 0) {
              parts.push(`
${commentPrefix} Grids${commentSuffix}`);
              gridStyles.forEach((style) => {
                const name = this.formatVariableName(style.name);
                const val = this.formatGridsValue(style.layoutGrids);
                if (val)
                  parts.push(`  ${CSS_VARIABLE_PREFIX}grid-${name}: ${val};`);
              });
            }
            if (format === "css")
              parts.push("}");
            return parts.join("\n");
          });
        }
        static formatPaintValue(paint) {
          if (paint.type === "SOLID") {
            const { r, g, b } = paint.color;
            const a = paint.opacity !== void 0 ? paint.opacity : 1;
            if (a >= 1) {
              return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
            }
            return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${this.round(a)})`;
          } else if (paint.type === "GRADIENT_LINEAR") {
            return "linear-gradient(...)";
          }
          return null;
        }
        static formatEffectsValue(effects, boundEffects) {
          return effects.map((effect, index) => {
            if (effect.type === "DROP_SHADOW" || effect.type === "INNER_SHADOW") {
              const { r, g, b, a } = effect.color;
              let colorPart = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${this.round(a)})`;
              if (boundEffects && boundEffects[index] && boundEffects[index]["color"]) {
                const alias = boundEffects[index]["color"];
                const ref = this.resolveVariableAlias(alias.id);
                if (ref)
                  colorPart = ref;
              }
              const inset = effect.type === "INNER_SHADOW" ? "inset " : "";
              const blur = this.round(effect.radius);
              const spread = effect.spread ? this.round(effect.spread) : 0;
              const x = this.round(effect.offset.x);
              const y = this.round(effect.offset.y);
              return `${inset}${x}px ${y}px ${blur}px ${spread}px ${colorPart}`;
            } else if (effect.type === "LAYER_BLUR") {
              return `blur(${this.round(effect.radius)}px)`;
            }
            return null;
          }).filter(Boolean).join(", ");
        }
        static formatGridsValue(grids) {
          return grids.map((grid) => {
            if (grid.pattern === "COLUMNS") {
              return `columns(${grid.count}, ${this.round(grid.gutterSize)}px)`;
            } else if (grid.pattern === "ROWS") {
              return `rows(${grid.count}, ${this.round(grid.gutterSize)}px)`;
            } else if (grid.pattern === "GRID") {
              return `grid(${this.round(grid.sectionSize)}px)`;
            }
            return null;
          }).filter(Boolean).join(", ");
        }
        /**
         * Build content for a single collection
         */
        static buildCollectionContent(collection, format, isThemeSpecific = false, themeName = null) {
          const parts = [];
          const commentPrefix = format === "scss" ? "//" : "  /*";
          const commentSuffix = format === "scss" ? "" : " */";
          if (!isThemeSpecific) {
            parts.push(`
${commentPrefix} ===== ${collection.name.toUpperCase()} =====${commentSuffix}`);
          }
          collection.variables.forEach((variable) => {
            const declaration = this.formatVariableDeclaration(variable, format, isThemeSpecific, themeName);
            if (declaration && declaration.trim()) {
              parts.push(declaration);
            }
          });
          const sortedGroupNames = Object.keys(collection.groups).sort();
          sortedGroupNames.forEach((groupName) => {
            const displayName = this.formatGroupDisplayName(groupName);
            if (!isThemeSpecific) {
              parts.push(`
${commentPrefix} ${displayName}${commentSuffix}`);
            }
            collection.groups[groupName].forEach((variable) => {
              const declaration = this.formatVariableDeclaration(variable, format, isThemeSpecific, themeName);
              if (declaration && declaration.trim()) {
                parts.push(declaration);
              }
            });
          });
          return parts.join("\n");
        }
        /**
         * Format a variable declaration for the given format
         */
        static formatVariableDeclaration(variable, format, isThemeSpecific = false, themeName = null) {
          let value = variable.value;
          if (isThemeSpecific && variable.modes && themeName && variable.modes[themeName]) {
            value = variable.modes[themeName];
          } else if (isThemeSpecific && (!variable.modes || !variable.modes[themeName])) {
            return "";
          }
          if (format === "scss") {
            return `${SCSS_VARIABLE_PREFIX}${variable.name}: ${value};`;
          }
          return `  ${CSS_VARIABLE_PREFIX}${variable.name}: ${value};`;
        }
        /**
         * Format group name for display
         */
        static formatGroupDisplayName(groupName) {
          return groupName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        }
        /**
         * Get all unique mode names from collections
         */
        static getAllModeNames(collections) {
          const modeNames = /* @__PURE__ */ new Set();
          collections.forEach((collection) => {
            collection.variables.forEach((variable) => {
              if (variable.modes) {
                Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
              }
            });
            Object.keys(collection.groups).forEach((groupKey) => {
              collection.groups[groupKey].forEach((variable) => {
                if (variable.modes) {
                  Object.keys(variable.modes).forEach((modeName) => modeNames.add(modeName));
                }
              });
            });
          });
          return Array.from(modeNames).sort();
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
            return `rgba(${r}, ${g}, ${b}, ${this.round(color.a)})`;
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
          const formattedVal = this.round(value);
          return unitsService_1.UnitsService.formatValueWithUnit(formattedVal, unit);
        }
        /**
         * Format string values with proper quoting
         */
        static formatStringValue(value) {
          if (typeof value !== "string") {
            return null;
          }
          const cleanValue = value.replace(/^['"]|['"]$/g, "");
          return `"${cleanValue}"`;
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
                  const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : unitsService_1.UnitsService.getDefaultUnit(collection.name);
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
                        defaultUnit2 = unitsService_1.UnitsService.getDefaultUnit(groupName);
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
        // Get Tailwind v4 validation status
        static getTailwindV4ValidationStatus() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield tailwindV4Service_1.TailwindV4Service.validateVariableGroups();
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
      exports.objectValues = objectValues;
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
      function objectValues(obj) {
        const keys = Object.keys(obj);
        const result = [];
        for (let i = 0; i < keys.length; i++) {
          result.push(obj[keys[i]]);
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

  // dist/services/cacheService.js
  var require_cacheService = __commonJS({
    "dist/services/cacheService.js"(exports) {
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
      exports.PerformanceCache = exports.CSSCache = exports.CacheService = void 0;
      var CacheService = class {
        constructor(options = {}) {
          this.cache = /* @__PURE__ */ new Map();
          this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            currentSize: 0,
            hitRate: 0
          };
          this.options = Object.assign({ maxSize: 500, defaultTtl: 5 * 60 * 1e3, enableStats: true }, options);
        }
        /**
         * Get value from cache
         */
        get(key) {
          const entry = this.cache.get(key);
          if (!entry) {
            this.updateStats("miss");
            return null;
          }
          const now = Date.now();
          if (now - entry.timestamp > (this.options.defaultTtl || 0)) {
            this.cache.delete(key);
            this.updateStats("miss");
            return null;
          }
          entry.accessCount++;
          entry.lastAccessed = now;
          this.updateStats("hit");
          return entry.value;
        }
        /**
         * Set value in cache
         */
        set(key, value, ttl) {
          const now = Date.now();
          if (!this.cache.has(key) && this.cache.size >= (this.options.maxSize || 500)) {
            this.evictLRU();
          }
          this.cache.set(key, {
            value,
            timestamp: now,
            accessCount: 1,
            lastAccessed: now
          });
          this.stats.currentSize = this.cache.size;
        }
        /**
         * Check if key exists and is not expired
         */
        has(key) {
          return this.get(key) !== null;
        }
        /**
         * Delete specific key
         */
        delete(key) {
          const deleted = this.cache.delete(key);
          this.stats.currentSize = this.cache.size;
          return deleted;
        }
        /**
         * Clear all cache entries
         */
        clear() {
          this.cache.clear();
          this.stats.currentSize = 0;
        }
        /**
         * Get or set with async function
         */
        getOrSet(key, factory, ttl) {
          return __awaiter(this, void 0, void 0, function* () {
            const cached = this.get(key);
            if (cached !== null) {
              return cached;
            }
            const value = yield factory();
            this.set(key, value, ttl);
            return value;
          });
        }
        /**
         * Evict least recently used entry
         */
        evictLRU() {
          let oldestKey = "";
          let oldestTime = Number.MAX_SAFE_INTEGER;
          for (const [key, entry] of this.cache.entries()) {
            if (entry.lastAccessed < oldestTime) {
              oldestTime = entry.lastAccessed;
              oldestKey = key;
            }
          }
          if (oldestKey) {
            this.cache.delete(oldestKey);
            this.stats.evictions++;
          }
        }
        /**
         * Update cache statistics
         */
        updateStats(type) {
          if (!this.options.enableStats)
            return;
          if (type === "hit") {
            this.stats.hits++;
          } else {
            this.stats.misses++;
          }
          const total = this.stats.hits + this.stats.misses;
          this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
        }
        /**
         * Get cache statistics
         */
        getStats() {
          return Object.assign({}, this.stats);
        }
        /**
         * Cleanup expired entries
         */
        cleanup() {
          const now = Date.now();
          const ttl = this.options.defaultTtl || 0;
          let cleaned = 0;
          for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > ttl) {
              this.cache.delete(key);
              cleaned++;
            }
          }
          this.stats.currentSize = this.cache.size;
          return cleaned;
        }
        /**
         * Get cache keys for debugging
         */
        keys() {
          return Array.from(this.cache.keys());
        }
        /**
         * Get cache size
         */
        size() {
          return this.cache.size;
        }
      };
      exports.CacheService = CacheService;
      var CSSCache = class _CSSCache extends CacheService {
        constructor() {
          super({
            maxSize: 1e3,
            defaultTtl: 10 * 60 * 1e3,
            // 10 minutes for CSS data
            enableStats: true
          });
        }
        static getInstance() {
          if (!_CSSCache.instance) {
            _CSSCache.instance = new _CSSCache();
          }
          return _CSSCache.instance;
        }
        /**
         * Generate cache key for a node's CSS
         */
        static generateKey(nodeId, nodeType, hashCode) {
          return `css-${nodeType}-${nodeId}${hashCode ? `-${hashCode}` : ""}`;
        }
        /**
         * Cache CSS for a node
         */
        cacheNodeCSS(nodeId, nodeType, css) {
          const key = _CSSCache.generateKey(nodeId, nodeType);
          this.set(key, css);
        }
        /**
         * Get cached CSS for a node
         */
        getNodeCSS(nodeId, nodeType) {
          const key = _CSSCache.generateKey(nodeId, nodeType);
          return this.get(key);
        }
        /**
         * Check if node CSS is cached
         */
        hasNodeCSS(nodeId, nodeType) {
          const key = _CSSCache.generateKey(nodeId, nodeType);
          return this.has(key);
        }
        /**
         * Clear CSS cache for specific node
         */
        clearNodeCSS(nodeId, nodeType) {
          const key = _CSSCache.generateKey(nodeId, nodeType);
          this.delete(key);
        }
        /**
         * Get cache efficiency report
         */
        getEfficiencyReport() {
          const stats = this.getStats();
          const recommendations = [];
          if (stats.hitRate < 0.5) {
            recommendations.push("Low hit rate - consider increasing cache TTL");
          }
          if (stats.evictions > stats.hits * 0.1) {
            recommendations.push("High eviction rate - consider increasing cache size");
          }
          if (stats.currentSize < (this.options.maxSize || 0) * 0.3) {
            recommendations.push("Cache underutilized - consider reducing cache size");
          }
          return { stats, recommendations };
        }
      };
      exports.CSSCache = CSSCache;
      var PerformanceCache = class _PerformanceCache extends CacheService {
        constructor() {
          super({
            maxSize: 200,
            defaultTtl: 60 * 60 * 1e3,
            // 1 hour for performance metrics
            enableStats: false
          });
        }
        static getInstance() {
          if (!_PerformanceCache.instance) {
            _PerformanceCache.instance = new _PerformanceCache();
          }
          return _PerformanceCache.instance;
        }
        /**
         * Cache operation duration
         */
        cacheDuration(operation, duration) {
          const key = `perf-${operation}-${Date.now()}`;
          this.set(key, duration);
        }
        /**
         * Get average duration for operation
         */
        getAverageDuration(operation) {
          const pattern = `perf-${operation}-`;
          const durations = [];
          for (const key of this.keys()) {
            if (key.startsWith(pattern)) {
              const duration = this.get(key);
              if (duration !== null) {
                durations.push(duration);
              }
            }
          }
          return durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        }
      };
      exports.PerformanceCache = PerformanceCache;
      exports.default = CacheService;
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
      var es2015_helpers_1 = require_es2015_helpers();
      var errorHandler_1 = require_errorHandler();
      var cacheService_1 = require_cacheService();
      var cssCache = cacheService_1.CSSCache.getInstance();
      var perfCache = cacheService_1.PerformanceCache.getInstance();
      var ComponentService = class _ComponentService {
        // Legacy cache management (replaced by new CacheService)
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
        static collectComponents() {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              yield this.collectAllVariables();
              const componentsData = [];
              const componentSets = [];
              this.componentMap = /* @__PURE__ */ new Map();
              try {
                yield figma.loadAllPagesAsync();
                const pagePromises = figma.root.children.map((page) => __awaiter(this, void 0, void 0, function* () {
                  if (page.type !== "PAGE") {
                    return { components: [], componentSets: [] };
                  }
                  const pageComponents = [];
                  const pageComponentSets = [];
                  function collectPageNodes(node) {
                    return __awaiter(this, void 0, void 0, function* () {
                      try {
                        if (!("type" in node)) {
                          return;
                        }
                        if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                          try {
                            const componentData = {
                              id: node.id,
                              name: node.name,
                              type: node.type,
                              styles: {},
                              // Will be loaded lazily when needed
                              pageName: page.name,
                              parentId: node.parent && node.parent.id,
                              children: [],
                              textElements: [],
                              // Will be loaded lazily when needed
                              hasTextContent: false
                            };
                            _ComponentService.componentMap.set(node.id, componentData);
                            if (node.type === "COMPONENT_SET") {
                              pageComponentSets.push(componentData);
                            } else {
                              pageComponents.push(componentData);
                            }
                          } catch (componentError) {
                            errorHandler_1.ErrorHandler.handleError(componentError, {
                              operation: `process_component_${node.name}`,
                              component: "ComponentService",
                              severity: "medium"
                            });
                          }
                        }
                        if ("children" in node && node.children) {
                          for (const child of node.children) {
                            try {
                              yield collectPageNodes(child);
                            } catch (childError) {
                              errorHandler_1.ErrorHandler.handleError(childError, {
                                operation: "collect_component_children",
                                component: "ComponentService",
                                severity: "medium"
                              });
                            }
                          }
                        }
                      } catch (nodeError) {
                        errorHandler_1.ErrorHandler.handleError(nodeError, {
                          operation: "collect_node",
                          component: "ComponentService",
                          severity: "medium"
                        });
                      }
                    });
                  }
                  try {
                    yield collectPageNodes(page);
                    return { components: pageComponents, componentSets: pageComponentSets };
                  } catch (pageError) {
                    errorHandler_1.ErrorHandler.handleError(pageError, {
                      operation: `collect_page_components_${page.name}`,
                      component: "ComponentService",
                      severity: "medium"
                    });
                    return { components: [], componentSets: [] };
                  }
                }));
                const pageResults = yield Promise.all(pagePromises);
                pageResults.forEach(({ components, componentSets: pageSets }) => {
                  componentsData.push(...components);
                  componentSets.push(...pageSets);
                });
              } catch (loadError) {
                errorHandler_1.ErrorHandler.handleError(loadError, {
                  operation: "load_all_pages",
                  component: "ComponentService",
                  severity: "high"
                });
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
              const finalComponents = componentSets.concat(componentsData.filter((comp) => !comp.isChild));
              return finalComponents;
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
                        const cachedStyles = cssCache.getNodeCSS(textNode.id, "TEXT");
                        if (cachedStyles) {
                          nodeStyles = JSON.parse(cachedStyles);
                        } else {
                          const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
                          nodeStyles = yield textNode.getCSSAsync();
                          cssCache.cacheNodeCSS(textNode.id, "TEXT", JSON.stringify(nodeStyles));
                          const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
                          const duration = endTime - startTime;
                          perfCache.cacheDuration("getCSSAsync-text", duration);
                        }
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
        /**
         * Lazily load component styles for a specific component
         */
        static loadComponentStyles(componentId) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const component = this.componentMap.get(componentId);
              if (!component) {
                throw new Error(`Component with ID ${componentId} not found`);
              }
              if (component.styles && Object.keys(component.styles).length > 0) {
                return component.styles;
              }
              const node = yield figma.getNodeByIdAsync(componentId);
              if (!node || node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
                throw new Error(`Node with ID ${componentId} is not a valid component`);
              }
              const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
              let nodeStyles;
              const cachedCSS = cssCache.getNodeCSS(node.id, node.type);
              if (cachedCSS) {
                nodeStyles = JSON.parse(cachedCSS);
              } else {
                nodeStyles = yield node.getCSSAsync();
                cssCache.cacheNodeCSS(node.id, node.type, JSON.stringify(nodeStyles));
                const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
                const duration = endTime - startTime;
                perfCache.cacheDuration("getCSSAsync-lazy", duration);
              }
              component.styles = nodeStyles;
              this.componentMap.set(componentId, component);
              return nodeStyles;
            }), {
              operation: "load_component_styles_lazy",
              component: "ComponentService",
              severity: "medium"
            });
          });
        }
        /**
         * Lazily load text elements for a specific component
         */
        static loadComponentTextElements(componentId) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              const component = this.componentMap.get(componentId);
              if (!component) {
                throw new Error(`Component with ID ${componentId} not found`);
              }
              if (component.textElements && component.textElements.length > 0) {
                return component.textElements;
              }
              const node = yield figma.getNodeByIdAsync(componentId);
              if (!node || node.type !== "COMPONENT" && node.type !== "COMPONENT_SET") {
                throw new Error(`Node with ID ${componentId} is not a valid component`);
              }
              const textElements = yield this.extractTextElements(node);
              component.textElements = textElements;
              component.hasTextContent = textElements.length > 0;
              this.componentMap.set(componentId, component);
              return textElements;
            }), {
              operation: "load_component_text_elements_lazy",
              component: "ComponentService",
              severity: "medium"
            });
          });
        }
        /**
         * Load both styles and text elements for a component (convenience method)
         */
        static loadComponentDetails(componentId) {
          return __awaiter(this, void 0, void 0, function* () {
            const [styles, textElements] = yield Promise.all([
              this.loadComponentStyles(componentId),
              this.loadComponentTextElements(componentId)
            ]);
            return { styles, textElements };
          });
        }
        /**
         * Get cache performance statistics
         */
        static getCacheStats() {
          const cssReport = cssCache.getEfficiencyReport();
          const avgCSSTime = perfCache.getAverageDuration("getCSSAsync");
          const avgTextCSSTime = perfCache.getAverageDuration("getCSSAsync-text");
          const performanceStats = {
            averageCSSTime: avgCSSTime,
            averageTextCSSTime: avgTextCSSTime,
            totalCachedItems: cssCache.size()
          };
          return {
            css: cssReport.stats,
            performance: performanceStats,
            recommendations: cssReport.recommendations
          };
        }
        /**
         * Clear all caches (useful for testing or memory cleanup)
         */
        static clearCaches() {
          cssCache.clear();
          perfCache.clear();
        }
        /**
         * Cleanup expired cache entries
         */
        static cleanupCaches() {
          const cssCleared = cssCache.cleanup();
          const perfCleared = perfCache.cleanup();
          return { cssCleared, perfCleared };
        }
      };
      exports.ComponentService = ComponentService;
      ComponentService.componentMap = /* @__PURE__ */ new Map();
      ComponentService.allVariables = /* @__PURE__ */ new Map();
      ComponentService.MAX_CACHE_SIZE = 1e3;
      ComponentService.CACHE_CLEANUP_THRESHOLD = 800;
    }
  });

  // dist/services/tokenCoverageService.js
  var require_tokenCoverageService = __commonJS({
    "dist/services/tokenCoverageService.js"(exports) {
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
      exports.TokenCoverageService = void 0;
      var VALUE_MATCH_TOLERANCE = 0.01;
      var tailwindV4Service_1 = require_tailwindV4Service();
      var TokenCoverageService = class {
        /**
         * Analyzes the current page for token coverage
         */
        static analyzeCurrentPage() {
          return __awaiter(this, arguments, void 0, function* (exportFormat = "css") {
            const currentPage = figma.currentPage;
            const nodes = currentPage.findAll((node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE" || node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION" || node.type === "TEXT" || node.type === "VECTOR" || node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "LINE" || node.type === "BOOLEAN_OPERATION");
            return this.analyzeNodes(nodes, exportFormat);
          });
        }
        /**
         * Analyzes the entire document or specific pages for token coverage
         */
        static analyzeDocument() {
          return __awaiter(this, arguments, void 0, function* (exportFormat = "css", pageIds) {
            const allPages = figma.root.children;
            let allNodes = [];
            for (const page of allPages) {
              if (pageIds && pageIds.indexOf(page.id) === -1) {
                continue;
              }
              const pageNodes = page.findAll((node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE" || node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION" || node.type === "TEXT" || node.type === "VECTOR" || node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "LINE" || node.type === "BOOLEAN_OPERATION");
              allNodes = [...allNodes, ...pageNodes];
            }
            return this.analyzeNodes(allNodes, exportFormat);
          });
        }
        /**
         * Smart analysis: Checks current page first using analyzeNodes logic directly to avoid redundant calls.
         * If current page has 0 issues, it searches other pages.
         * If another page has issues, it switches to that page and returns its results.
         */
        static analyzeSmart() {
          return __awaiter(this, arguments, void 0, function* (exportFormat = "css", pageIds) {
            console.log("analyzeSmart called", { exportFormat, pageIds });
            const currentPageId = figma.currentPage.id;
            const isCurrentPageSelected = !pageIds || pageIds.indexOf(currentPageId) !== -1;
            let bestResult = null;
            if (isCurrentPageSelected) {
              const currentPageResult = yield this.analyzeCurrentPage(exportFormat);
              if (currentPageResult.totalIssues > 0) {
                return currentPageResult;
              }
              bestResult = currentPageResult;
            }
            const allPages = figma.root.children;
            for (const page of allPages) {
              if (page.id === currentPageId)
                continue;
              if (pageIds && pageIds.indexOf(page.id) === -1)
                continue;
              const pageNodes = page.findAll((node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE" || node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION" || node.type === "TEXT" || node.type === "VECTOR" || node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "LINE" || node.type === "BOOLEAN_OPERATION");
              const pageResult = yield this.analyzeNodes(pageNodes, exportFormat);
              console.log("analyzeSmart: page result", { pageId: page.id, issues: pageResult.totalIssues, nodes: pageResult.totalNodes });
              if (pageResult.totalIssues > 0) {
                yield figma.setCurrentPageAsync(page);
                return pageResult;
              }
              if (!bestResult || pageResult.totalNodes > bestResult.totalNodes) {
                console.log("analyzeSmart: New best result (clean)", pageResult.totalNodes);
                bestResult = pageResult;
              }
            }
            console.log("analyzeSmart: No issues found anywhere. Returning best result:", bestResult);
            return bestResult || this.analyzeCurrentPage(exportFormat);
          });
        }
        /**
         * Analyze only the currently selected nodes (and their children)
         */
        static analyzeSelection() {
          return __awaiter(this, arguments, void 0, function* (exportFormat = "css") {
            const selection = figma.currentPage.selection;
            let allNodes = [];
            const isRelevantNode = (node) => node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE" || node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION" || node.type === "TEXT" || node.type === "VECTOR" || node.type === "RECTANGLE" || node.type === "ELLIPSE" || node.type === "POLYGON" || node.type === "STAR" || node.type === "LINE" || node.type === "BOOLEAN_OPERATION";
            for (const node of selection) {
              if (isRelevantNode(node)) {
                allNodes.push(node);
              }
              if ("findAll" in node) {
                const children = node.findAll(isRelevantNode);
                allNodes = [...allNodes, ...children];
              }
            }
            return this.analyzeNodes(allNodes, exportFormat);
          });
        }
        /**
         * Helper to analyze a list of nodes
         */
        static analyzeNodes(nodes_1) {
          return __awaiter(this, arguments, void 0, function* (nodes, exportFormat = "css") {
            const variableUsage = /* @__PURE__ */ new Map();
            const localComponentDefs = /* @__PURE__ */ new Map();
            const componentUsage = /* @__PURE__ */ new Map();
            const variantToSetId = /* @__PURE__ */ new Map();
            const instanceMainCompMap = /* @__PURE__ */ new Map();
            let totalNodes = 0;
            let autoLayoutCount = 0;
            let instanceCount = 0;
            let frameCount = 0;
            const issuesMap = /* @__PURE__ */ new Map();
            const stats = { totalAttributes: 0 };
            const allVariables = yield this.getAllVariables();
            allVariables.forEach((v) => {
              if (v.variable) {
                variableUsage.set(v.variable.id, /* @__PURE__ */ new Set());
              }
            });
            for (let i = 0; i < nodes.length; i++) {
              const node = nodes[i];
              if (i % 50 === 0) {
                yield new Promise((resolve) => setTimeout(resolve, 0));
              }
              if (!this.isValidRootOrDescendant(node)) {
                continue;
              }
              totalNodes++;
              if (node.type === "FRAME" || node.type === "SECTION" || node.type === "GROUP" || node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE") {
                if ("layoutMode" in node && node.layoutMode !== "NONE") {
                  autoLayoutCount++;
                }
                if (node.type === "INSTANCE") {
                  instanceCount++;
                } else {
                  frameCount++;
                }
              }
              if (node.type === "COMPONENT") {
                if (node.parent && node.parent.type === "COMPONENT_SET") {
                  variantToSetId.set(node.id, node.parent.id);
                } else {
                  localComponentDefs.set(node.id, node);
                }
              } else if (node.type === "COMPONENT_SET") {
                localComponentDefs.set(node.id, node);
                node.children.forEach((child) => {
                  if (child.type === "COMPONENT") {
                    variantToSetId.set(child.id, node.id);
                  }
                });
              }
              if (node.type === "INSTANCE") {
                let mainComp = null;
                try {
                  mainComp = yield node.getMainComponentAsync();
                } catch (e) {
                }
                if (mainComp) {
                  const mainId = mainComp.id;
                  instanceMainCompMap.set(node.id, mainComp);
                  if (!componentUsage.has(mainId)) {
                    componentUsage.set(mainId, /* @__PURE__ */ new Set());
                  }
                  componentUsage.get(mainId).add(node.id);
                  const setId = variantToSetId.get(mainId);
                  if (setId) {
                    if (!componentUsage.has(setId)) {
                      componentUsage.set(setId, /* @__PURE__ */ new Set());
                    }
                    componentUsage.get(setId).add(node.id);
                  }
                }
              }
              if ("boundVariables" in node && node.boundVariables) {
                const boundVars = node.boundVariables;
                for (const propKey of Object.keys(boundVars)) {
                  const binding = boundVars[propKey];
                  if (binding) {
                    const checkId = (id) => {
                      if (variableUsage.has(id)) {
                        variableUsage.get(id).add(node.id);
                      }
                    };
                    if (Array.isArray(binding)) {
                      binding.forEach((b) => b.id && checkId(b.id));
                    } else if (typeof binding === "object" && binding.id) {
                      checkId(binding.id);
                    }
                  }
                }
              }
              yield this.analyzeNode(node, issuesMap, stats, instanceMainCompMap);
            }
            const unusedVariables = [];
            allVariables.forEach((v) => {
              if (!v || !v.variable)
                return;
              const usage = variableUsage.get(v.variable.id);
              if (!usage || usage.size === 0) {
                let resolvedValue = "";
                const modeId = Object.keys(v.variable.valuesByMode)[0];
                const val = v.variable.valuesByMode[modeId];
                if (v.variable.resolvedType === "COLOR" && val && typeof val === "object" && "r" in val) {
                  const c = val;
                  resolvedValue = `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
                } else if (val !== void 0) {
                  resolvedValue = String(val);
                }
                unusedVariables.push({
                  id: v.variable.id,
                  name: v.variable.name,
                  resolvedType: v.variable.resolvedType,
                  resolvedValue,
                  collectionName: v.collectionName
                });
              }
            });
            const totalVarsToCheck = allVariables.length;
            const variableHygieneScore = totalVarsToCheck === 0 ? 100 : Math.round((totalVarsToCheck - unusedVariables.length) / totalVarsToCheck * 100);
            const unusedComponents = [];
            for (const [id, def] of localComponentDefs.entries()) {
              if (def.type === "COMPONENT_SET") {
                const set = def;
                const variants = set.children.filter((c) => c.type === "COMPONENT");
                const unusedVariants = variants.filter((v) => !componentUsage.has(v.id) || componentUsage.get(v.id).size === 0);
                if (unusedVariants.length > 0) {
                  unusedComponents.push({
                    id: set.id,
                    name: set.name,
                    type: "COMPONENT_SET",
                    totalVariants: variants.length,
                    unusedVariantCount: unusedVariants.length,
                    isFullyUnused: unusedVariants.length === variants.length,
                    unusedVariants: unusedVariants.map((v) => ({ id: v.id, name: v.name }))
                  });
                }
              } else {
                if (!componentUsage.has(id) || componentUsage.get(id).size === 0) {
                  unusedComponents.push({
                    id: def.id,
                    name: def.name,
                    type: "COMPONENT",
                    isFullyUnused: true
                  });
                }
              }
            }
            const totalComponents = localComponentDefs.size;
            let totalDeletableUnits = 0;
            let unusedDeletableUnits = 0;
            for (const [, def] of localComponentDefs.entries()) {
              if (def.type === "COMPONENT_SET") {
                const set = def;
                totalDeletableUnits += set.children.filter((c) => c.type === "COMPONENT").length;
              } else {
                totalDeletableUnits += 1;
              }
            }
            for (const comp of unusedComponents) {
              if (comp.type === "COMPONENT_SET") {
                unusedDeletableUnits += comp.unusedVariantCount || 0;
              } else {
                unusedDeletableUnits += 1;
              }
            }
            const componentHygieneScore = totalDeletableUnits === 0 ? 100 : Math.round((totalDeletableUnits - unusedDeletableUnits) / totalDeletableUnits * 100);
            for (const issue of issuesMap.values()) {
              issue.matchingVariables = yield this.findMatchingVariables(issue.value, issue.category, allVariables);
            }
            const issuesByCategory = {
              Layout: [],
              Fill: [],
              Stroke: [],
              Appearance: []
            };
            for (const issue of issuesMap.values()) {
              issuesByCategory[issue.category].push(issue);
            }
            for (const category of Object.keys(issuesByCategory)) {
              issuesByCategory[category].sort((a, b) => b.count - a.count);
            }
            const isTailwindCompatible = (name) => {
              return tailwindV4Service_1.TailwindV4Service.isCompatible(name);
            };
            let validTailwindNames = 0;
            const tailwindValidation = {
              valid: [],
              invalid: [],
              totalInvalid: 0,
              totalVariables: 0,
              readinessScore: 0,
              // Group-level data for UI rendering
              groups: [],
              invalidGroups: []
            };
            const twGroupMap = /* @__PURE__ */ new Map();
            const twStandaloneVars = [];
            if (totalVarsToCheck > 0) {
              allVariables.forEach((v) => {
                if (!v || !v.variable || !v.variable.name)
                  return;
                if (isTailwindCompatible(v.variable.name)) {
                  validTailwindNames++;
                  tailwindValidation.valid.push({ id: v.variable.id, name: v.variable.name });
                } else {
                  tailwindValidation.invalid.push({ id: v.variable.id, name: v.variable.name });
                }
                const pathMatch = v.variable.name.match(/^([^\/]+)\//);
                if (pathMatch) {
                  const groupName = pathMatch[1];
                  if (!twGroupMap.has(groupName)) {
                    const isValid = tailwindV4Service_1.TailwindV4Service.isValidNamespace(groupName);
                    twGroupMap.set(groupName, { count: 0, isValid, variables: [] });
                  }
                  const group = twGroupMap.get(groupName);
                  group.count++;
                  group.variables.push({ id: v.variable.id, name: v.variable.name });
                } else {
                  twStandaloneVars.push({
                    name: v.variable.name,
                    isValid: false,
                    variableCount: 1,
                    isStandalone: true,
                    variableId: v.variable.id
                  });
                }
              });
            }
            for (const [groupName, data] of twGroupMap.entries()) {
              tailwindValidation.groups.push({
                name: groupName,
                isValid: data.isValid,
                namespace: data.isValid ? groupName.toLowerCase() : void 0,
                variableCount: data.count,
                isStandalone: false
              });
              if (!data.isValid) {
                tailwindValidation.invalidGroups.push(groupName);
              }
            }
            for (const sv of twStandaloneVars) {
              tailwindValidation.groups.push(sv);
              tailwindValidation.invalidGroups.push(sv.name);
            }
            const tailwindScore = totalVarsToCheck === 0 ? 100 : Math.round(validTailwindNames / totalVarsToCheck * 100);
            tailwindValidation.totalVariables = totalVarsToCheck;
            tailwindValidation.totalInvalid = tailwindValidation.invalid.length;
            tailwindValidation.readinessScore = tailwindScore;
            const totalContainerNodes = instanceCount + frameCount;
            const layoutHygieneScore = totalContainerNodes === 0 ? 100 : Math.round(autoLayoutCount / totalContainerNodes * 100);
            const isTailwindV4 = exportFormat === "tailwind-v4";
            const affectedNodesSet = /* @__PURE__ */ new Set();
            let totalIssueCount = 0;
            for (const issue of issuesMap.values()) {
              issue.nodeIds.forEach((id) => affectedNodesSet.add(id));
              totalIssueCount += issue.count;
            }
            const totalAffectedNodes = affectedNodesSet.size;
            const totalAttributes = stats.totalAttributes;
            const tokenCoverageScore = totalAttributes === 0 ? 100 : Math.round((totalAttributes - totalIssueCount) / totalAttributes * 100);
            let weightedScore = 0;
            let weights = {
              tokenCoverage: "0%",
              tailwindReadiness: "0%",
              componentHygiene: "0%",
              variableHygiene: "0%"
            };
            if (isTailwindV4) {
              weightedScore = Math.round(tokenCoverageScore * 0.25 + tailwindScore * 0.25 + componentHygieneScore * 0.25 + variableHygieneScore * 0.25);
              weights = {
                tokenCoverage: "25%",
                tailwindReadiness: "25%",
                componentHygiene: "25%",
                variableHygiene: "25%"
              };
            } else {
              weightedScore = Math.round((tokenCoverageScore + componentHygieneScore + variableHygieneScore) / 3);
              weights = {
                tokenCoverage: "33.3%",
                tailwindReadiness: "0%",
                // Not shown
                componentHygiene: "33.4%",
                // Slight adjustment to sum to 100
                variableHygiene: "33.3%"
              };
            }
            return {
              totalNodes,
              totalAttributes: stats.totalAttributes,
              totalIssues: totalIssueCount,
              // Return total attribute issues count
              issuesByCategory,
              qualityScore: weightedScore,
              subScores: {
                tokenCoverage: tokenCoverageScore,
                tailwindReadiness: tailwindScore,
                componentHygiene: componentHygieneScore,
                variableHygiene: variableHygieneScore,
                layoutHygiene: layoutHygieneScore
              },
              weights,
              // Detailed Data
              unusedVariables,
              unusedComponents,
              // Metrics
              totalVariables: totalVarsToCheck,
              totalComponents,
              totalDeletableUnits,
              unusedVariableCount: unusedVariables.length,
              unusedComponentCount: unusedComponents.length,
              unusedDeletableUnits,
              tailwindValidation
            };
          });
        }
        /**
         * Helper to check if a node is inside an InstanceNode
         */
        static isInsideInstance(node) {
          let parent = node.parent;
          while (parent && parent.type !== "PAGE" && parent.type !== "DOCUMENT") {
            if (parent.type === "INSTANCE") {
              return true;
            }
            parent = parent.parent;
          }
          return false;
        }
        /**
         * Analyzes a single node for token coverage issues
         */
        static analyzeNode(node_1, issuesMap_1, stats_1) {
          return __awaiter(this, arguments, void 0, function* (node, issuesMap, stats, instanceMainCompMap = /* @__PURE__ */ new Map()) {
            this.checkLayoutProperties(node, issuesMap, stats, instanceMainCompMap);
            this.checkFillProperties(node, issuesMap, stats, instanceMainCompMap);
            this.checkStrokeProperties(node, issuesMap, stats, instanceMainCompMap);
            this.checkAppearanceProperties(node, issuesMap, stats, instanceMainCompMap);
          });
        }
        /**
         * Helper to format numeric values to max 2 decimal places
         */
        static formatValue(value) {
          const rounded = Math.round(value * 100) / 100;
          return `${rounded}px`;
        }
        /**
         * Checks layout properties (spacing, sizing)
         */
        /**
         * Checks layout properties (spacing, sizing)
         */
        static checkLayoutProperties(node, issuesMap, stats, instanceMainCompMap = /* @__PURE__ */ new Map()) {
          if (!("minWidth" in node))
            return;
          const layoutNode = node;
          if ("minWidth" in layoutNode && layoutNode.minWidth !== null && layoutNode.minWidth !== 0) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "minWidth")) {
              this.addIssue(issuesMap, "Min Width", this.formatValue(layoutNode.minWidth), node, "Layout", instanceMainCompMap);
            }
          }
          if (layoutNode.maxWidth !== null && layoutNode.maxWidth !== 0) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "maxWidth")) {
              this.addIssue(issuesMap, "Max Width", this.formatValue(layoutNode.maxWidth), node, "Layout", instanceMainCompMap);
            }
          }
          if ("width" in layoutNode && layoutNode.width && typeof layoutNode.width === "number" && layoutNode.width !== 0 && !this.isWidthDynamic(layoutNode)) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "width")) {
              this.addIssue(issuesMap, "Width", this.formatValue(layoutNode.width), node, "Layout", instanceMainCompMap);
            }
          }
          if ("height" in layoutNode && layoutNode.height && typeof layoutNode.height === "number" && layoutNode.height !== 0 && !this.isHeightDynamic(layoutNode)) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "height")) {
              this.addIssue(issuesMap, "Height", this.formatValue(layoutNode.height), node, "Layout", instanceMainCompMap);
            }
          }
          if ("minHeight" in layoutNode && layoutNode.minHeight !== null && layoutNode.minHeight !== 0) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "minHeight")) {
              this.addIssue(issuesMap, "Min Height", this.formatValue(layoutNode.minHeight), node, "Layout", instanceMainCompMap);
            }
          }
          if ("maxHeight" in layoutNode && layoutNode.maxHeight !== null && layoutNode.maxHeight !== 0) {
            stats.totalAttributes++;
            if (!this.isVariableBound(layoutNode, "maxHeight")) {
              this.addIssue(issuesMap, "Max Height", this.formatValue(layoutNode.maxHeight), node, "Layout", instanceMainCompMap);
            }
          }
          if ("layoutMode" in layoutNode && layoutNode.layoutMode !== "NONE") {
            if (typeof layoutNode.itemSpacing === "number" && layoutNode.itemSpacing !== 0) {
              stats.totalAttributes++;
              if (!this.isVariableBound(layoutNode, "itemSpacing")) {
                this.addIssue(issuesMap, "Gap", this.formatValue(layoutNode.itemSpacing), node, "Layout", instanceMainCompMap);
              }
            }
            const paddingLeft = typeof layoutNode.paddingLeft === "number" ? layoutNode.paddingLeft : 0;
            const paddingTop = typeof layoutNode.paddingTop === "number" ? layoutNode.paddingTop : 0;
            const paddingRight = typeof layoutNode.paddingRight === "number" ? layoutNode.paddingRight : 0;
            const paddingBottom = typeof layoutNode.paddingBottom === "number" ? layoutNode.paddingBottom : 0;
            const allPaddingSame = paddingLeft === paddingTop && paddingTop === paddingRight && paddingRight === paddingBottom;
            const anyPaddingBound = this.isVariableBound(layoutNode, "paddingLeft") || this.isVariableBound(layoutNode, "paddingTop") || this.isVariableBound(layoutNode, "paddingRight") || this.isVariableBound(layoutNode, "paddingBottom");
            if (allPaddingSame && !anyPaddingBound && paddingLeft !== 0) {
              stats.totalAttributes++;
              this.addIssue(issuesMap, "Padding", this.formatValue(paddingLeft), node, "Layout", instanceMainCompMap);
            } else {
              if (paddingLeft !== 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(layoutNode, "paddingLeft")) {
                  this.addIssue(issuesMap, "Padding Left", this.formatValue(paddingLeft), node, "Layout", instanceMainCompMap);
                }
              }
              if (paddingTop !== 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(layoutNode, "paddingTop")) {
                  this.addIssue(issuesMap, "Padding Top", this.formatValue(paddingTop), node, "Layout", instanceMainCompMap);
                }
              }
              if (paddingRight !== 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(layoutNode, "paddingRight")) {
                  this.addIssue(issuesMap, "Padding Right", this.formatValue(paddingRight), node, "Layout", instanceMainCompMap);
                }
              }
              if (paddingBottom !== 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(layoutNode, "paddingBottom")) {
                  this.addIssue(issuesMap, "Padding Bottom", this.formatValue(paddingBottom), node, "Layout", instanceMainCompMap);
                }
              }
            }
          }
        }
        /**
         * Checks fill/color properties
         */
        static checkFillProperties(node, issuesMap, stats, instanceMainCompMap = /* @__PURE__ */ new Map()) {
          if (!("fills" in node))
            return;
          const fills = node.fills;
          if (!Array.isArray(fills) || fills.length === 0)
            return;
          stats.totalAttributes++;
          if (!this.isPaintColorVariableBound(fills)) {
            const solidFill = fills.find((fill) => fill.type === "SOLID" && fill.visible !== false);
            if (solidFill && solidFill.type === "SOLID") {
              const color = solidFill.color;
              const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
              this.addIssue(issuesMap, "Fill Color", colorValue, node, "Fill", instanceMainCompMap);
            }
          }
        }
        /**
         * Checks stroke properties
         */
        static checkStrokeProperties(node, issuesMap, stats, instanceMainCompMap = /* @__PURE__ */ new Map()) {
          if (!("strokes" in node))
            return;
          const strokes = node.strokes;
          if (!Array.isArray(strokes) || strokes.length === 0)
            return;
          stats.totalAttributes++;
          if (!this.isPaintColorVariableBound(strokes)) {
            const solidStroke = strokes.find((stroke) => stroke.type === "SOLID" && stroke.visible !== false);
            if (solidStroke && solidStroke.type === "SOLID") {
              const color = solidStroke.color;
              const colorValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
              this.addIssue(issuesMap, "Stroke Color", colorValue, node, "Stroke", instanceMainCompMap);
            }
          }
          const hasNumericStrokeWeight = "strokeWeight" in node && typeof node.strokeWeight === "number";
          const strokeWeightValue = hasNumericStrokeWeight ? node.strokeWeight : 0;
          const anyStrokeWeightBound = this.isVariableBound(node, "strokeWeight") || this.isVariableBound(node, "strokeTopWeight") || this.isVariableBound(node, "strokeRightWeight") || this.isVariableBound(node, "strokeBottomWeight") || this.isVariableBound(node, "strokeLeftWeight");
          if (hasNumericStrokeWeight && strokeWeightValue !== 0) {
            stats.totalAttributes++;
            if (!anyStrokeWeightBound) {
              this.addIssue(issuesMap, "Stroke Weight", this.formatValue(strokeWeightValue), node, "Stroke", instanceMainCompMap);
            }
          }
        }
        /**
         * Checks appearance properties (opacity, radius)
         */
        static checkAppearanceProperties(node, issuesMap, stats, instanceMainCompMap = /* @__PURE__ */ new Map()) {
          if ("opacity" in node && node.opacity !== 1 && node.opacity !== 0) {
            stats.totalAttributes++;
            if (!this.isVariableBound(node, "opacity")) {
              this.addIssue(issuesMap, "Opacity", `${node.opacity}`, node, "Appearance", instanceMainCompMap);
            }
          }
          if ("cornerRadius" in node && node.type !== "SECTION") {
            const rectNode = node;
            const topLeft = "topLeftRadius" in rectNode && typeof rectNode.topLeftRadius === "number" ? rectNode.topLeftRadius : 0;
            const topRight = "topRightRadius" in rectNode && typeof rectNode.topRightRadius === "number" ? rectNode.topRightRadius : 0;
            const bottomLeft = "bottomLeftRadius" in rectNode && typeof rectNode.bottomLeftRadius === "number" ? rectNode.bottomLeftRadius : 0;
            const bottomRight = "bottomRightRadius" in rectNode && typeof rectNode.bottomRightRadius === "number" ? rectNode.bottomRightRadius : 0;
            const allRadiiSame = topLeft === topRight && topRight === bottomLeft && bottomLeft === bottomRight;
            if (rectNode.cornerRadius !== figma.mixed && typeof rectNode.cornerRadius === "number") {
              if (rectNode.cornerRadius > 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(rectNode, "cornerRadius") && !this.isVariableBound(rectNode, "topLeftRadius")) {
                  this.addIssue(issuesMap, "Corner Radius", this.formatValue(rectNode.cornerRadius), node, "Appearance", instanceMainCompMap);
                  return;
                }
              }
            }
            const anyRadiusBound = this.isVariableBound(rectNode, "topLeftRadius") || this.isVariableBound(rectNode, "topRightRadius") || this.isVariableBound(rectNode, "bottomLeftRadius") || this.isVariableBound(rectNode, "bottomRightRadius");
            if (allRadiiSame && !anyRadiusBound && topLeft > 0) {
              stats.totalAttributes++;
              this.addIssue(issuesMap, "Corner Radius", this.formatValue(topLeft), node, "Appearance", instanceMainCompMap);
            } else {
              if (topLeft > 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(rectNode, "topLeftRadius")) {
                  this.addIssue(issuesMap, "Corner Radius (Top Left)", this.formatValue(topLeft), node, "Appearance", instanceMainCompMap);
                }
              }
              if (topRight > 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(rectNode, "topRightRadius")) {
                  this.addIssue(issuesMap, "Corner Radius (Top Right)", this.formatValue(topRight), node, "Appearance", instanceMainCompMap);
                }
              }
              if (bottomLeft > 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(rectNode, "bottomLeftRadius")) {
                  this.addIssue(issuesMap, "Corner Radius (Bottom Left)", this.formatValue(bottomLeft), node, "Appearance", instanceMainCompMap);
                }
              }
              if (bottomRight > 0) {
                stats.totalAttributes++;
                if (!this.isVariableBound(rectNode, "bottomRightRadius")) {
                  this.addIssue(issuesMap, "Corner Radius (Bottom Right)", this.formatValue(bottomRight), node, "Appearance", instanceMainCompMap);
                }
              }
            }
          }
        }
        /**
         * Utility to check whether any SOLID paint has a color variable bound at paint-level
         */
        static isPaintColorVariableBound(paints) {
          if (!Array.isArray(paints))
            return false;
          for (const p of paints) {
            if (p && p.type === "SOLID" && p.visible !== false) {
              const bv = p.boundVariables;
              if (bv && bv.color)
                return true;
            }
          }
          return false;
        }
        /**
         * Checks if a property is bound to a variable (design token)
         */
        static isVariableBound(node, property) {
          if (!node.boundVariables)
            return false;
          const boundVariable = node.boundVariables[property];
          return boundVariable !== void 0 && boundVariable !== null;
        }
        /**
         * Helper to find the "Context" (Outermost Component/Instance) for an issue
         * Returns null if the node is not part of any Component/Instance (e.g. loose frame)
         */
        static getIssueContext(node) {
          let current = node;
          let context = null;
          while (current) {
            if (current.type === "PAGE" || current.type === "DOCUMENT") {
              break;
            }
            if (current.type === "COMPONENT" || current.type === "COMPONENT_SET" || current.type === "INSTANCE") {
              context = { id: current.id, name: current.name };
            }
            current = current.parent;
          }
          if (!context)
            return null;
          return context;
        }
        /**
         * Checks if a node is a Component, ComponentSet, Instance, or is inside one.
         * Used to filter out top-level frames that shouldn't be counted in analysis.
         */
        static isValidRootOrDescendant(node) {
          let current = node;
          while (current) {
            if (current.type === "COMPONENT" || current.type === "COMPONENT_SET" || current.type === "INSTANCE") {
              return true;
            }
            if (current.type === "PAGE" || current.type === "DOCUMENT") {
              return false;
            }
            current = current.parent;
            if (!current)
              return false;
          }
          return false;
        }
        /**
         * Determines the ownership context for any node using the NEAREST-BOUNDARY rule.
         *
         * Algorithm: walk UP the ancestor chain from the node itself (inclusive).
         * The first COMPONENT, COMPONENT_SET, or INSTANCE boundary found IS the owner.
         *  - VARIANT (COMPONENT inside COMPONENT_SET) → type 'VARIANT', name "SetName / VariantName"
         *  - COMPONENT (standalone)                  → type 'COMPONENT'
         *  - COMPONENT_SET                            → type 'COMPONENT_SET'
         *  - INSTANCE                                 → resolve to main component (or VARIANT)
         * Non-component nodes (FRAME, GROUP, RECTANGLE, TEXT …) are transparent.
         */
        static getOwnershipContext(node, instanceMainCompMap) {
          let current = node;
          while (current) {
            if (current.type === "PAGE" || current.type === "DOCUMENT")
              break;
            if (current.type === "COMPONENT_SET") {
              return { id: current.id, name: current.name, type: "COMPONENT_SET" };
            }
            if (current.type === "COMPONENT") {
              if (current.parent && current.parent.type === "COMPONENT_SET") {
                const setName = current.parent.name;
                return { id: current.id, name: `${setName} / ${current.name}`, type: "VARIANT" };
              }
              return { id: current.id, name: current.name, type: "COMPONENT" };
            }
            if (current.type === "INSTANCE") {
              const mainComp = instanceMainCompMap.get(current.id);
              if (mainComp) {
                if (mainComp.parent && mainComp.parent.type === "COMPONENT_SET") {
                  const setName = mainComp.parent.name;
                  return { id: mainComp.id, name: `${setName} / ${mainComp.name}`, type: "VARIANT" };
                }
                return { id: mainComp.id, name: mainComp.name, type: "COMPONENT" };
              }
              return { id: current.id, name: current.name, type: "INSTANCE" };
            }
            current = current.parent;
          }
          return null;
        }
        /**
         * Checks whether a given property on an instance differs from the main component's value.
         * Returns true if the property is overridden (i.e., no longer synchronized).
         */
        static isPropertyOverriddenOnInstance(instance, property, instanceValue, mainComp) {
          try {
            if (property === "Fill Color") {
              const fills = mainComp.fills;
              if (!Array.isArray(fills) || fills.length === 0)
                return true;
              const solid = fills.find((f) => f.type === "SOLID" && f.visible !== false);
              if (!solid)
                return true;
              const c = solid.color;
              const mainValue = `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
              return mainValue !== instanceValue;
            }
            if (property === "Stroke Color") {
              const strokes = mainComp.strokes;
              if (!Array.isArray(strokes) || strokes.length === 0)
                return true;
              const solid = strokes.find((s) => s.type === "SOLID" && s.visible !== false);
              if (!solid)
                return true;
              const c = solid.color;
              const mainValue = `rgb(${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)})`;
              return mainValue !== instanceValue;
            }
            const propMap = {
              "Width": "width",
              "Height": "height",
              "Min Width": "minWidth",
              "Max Width": "maxWidth",
              "Min Height": "minHeight",
              "Max Height": "maxHeight",
              "Gap": "itemSpacing",
              "Padding": "paddingLeft",
              "Padding Left": "paddingLeft",
              "Padding Top": "paddingTop",
              "Padding Right": "paddingRight",
              "Padding Bottom": "paddingBottom",
              "Corner Radius": "cornerRadius",
              "Corner Radius (Top Left)": "topLeftRadius",
              "Corner Radius (Top Right)": "topRightRadius",
              "Corner Radius (Bottom Left)": "bottomLeftRadius",
              "Corner Radius (Bottom Right)": "bottomRightRadius",
              "Stroke Weight": "strokeWeight",
              "Opacity": "opacity"
            };
            const figmaProp = propMap[property];
            if (figmaProp && figmaProp in mainComp) {
              const mainRaw = mainComp[figmaProp];
              if (typeof mainRaw === "number") {
                const instanceNum = parseFloat(instanceValue);
                const diff = Math.abs(instanceNum - mainRaw);
                return diff > VALUE_MATCH_TOLERANCE;
              }
            }
          } catch (e) {
          }
          return false;
        }
        /**
         * Adds or updates an issue in the issues map.
         * Grouping is ownership-based:
         *  - Synchronized instances → grouped under their main component
         *  - Overridden instances   → grouped independently
         */
        static addIssue(issuesMap, property, value, node, category, instanceMainCompMap = /* @__PURE__ */ new Map()) {
          const context = this.getOwnershipContext(node, instanceMainCompMap);
          if (!context) {
            return;
          }
          const key = `${category}:${property}:${value}`;
          if (issuesMap.has(key)) {
            const issue = issuesMap.get(key);
            issue.count++;
            issue.nodeIds.push(node.id);
            issue.nodeNames.push(node.name);
            issue.nodeFrames.push(context.name);
            issue.nodeGroupTypes.push(context.type);
            issue.nodeTypes.push(node.type);
          } else {
            issuesMap.set(key, {
              property,
              value,
              count: 1,
              nodeIds: [node.id],
              nodeNames: [node.name],
              nodeFrames: [context.name],
              nodeGroupTypes: [context.type],
              nodeTypes: [node.type],
              category
            });
          }
        }
        /**
         * Checks if width is dynamic (Hug or Fill) or if usage implies dynamic behavior (Auto Layout)
         */
        static isWidthDynamic(node) {
          if ("layoutMode" in node && node.layoutMode !== "NONE") {
            return true;
          }
          if ("layoutSizingHorizontal" in node) {
            const sizing = node.layoutSizingHorizontal;
            if (sizing && sizing !== "FIXED")
              return true;
          }
          const parent = node.parent;
          if (parent && "layoutMode" in parent && parent.layoutMode !== "NONE") {
            if (parent.layoutMode === "HORIZONTAL") {
              if ("layoutGrow" in node && node.layoutGrow === 1)
                return true;
            } else if (parent.layoutMode === "VERTICAL") {
              if ("layoutAlign" in node && node.layoutAlign === "STRETCH")
                return true;
            }
          }
          if (node.type === "TEXT" && node.textAutoResize === "WIDTH_AND_HEIGHT") {
            return true;
          }
          return false;
        }
        /**
         * Checks if height is dynamic (Hug or Fill) or if usage implies dynamic behavior (Auto Layout)
         */
        static isHeightDynamic(node) {
          if ("layoutMode" in node && node.layoutMode !== "NONE") {
            return true;
          }
          if ("layoutSizingVertical" in node) {
            const sizing = node.layoutSizingVertical;
            if (sizing && sizing !== "FIXED")
              return true;
          }
          const parent = node.parent;
          if (parent && "layoutMode" in parent && parent.layoutMode !== "NONE") {
            if (parent.layoutMode === "HORIZONTAL") {
              if ("layoutAlign" in node && node.layoutAlign === "STRETCH")
                return true;
            } else if (parent.layoutMode === "VERTICAL") {
              if ("layoutGrow" in node && node.layoutGrow === 1)
                return true;
            }
          }
          if (node.type === "TEXT") {
            if (node.textAutoResize === "WIDTH_AND_HEIGHT" || node.textAutoResize === "HEIGHT") {
              return true;
            }
          }
          return false;
        }
        /**
         * Helper to get all variables with their resolved values
         */
        static getAllVariables() {
          return __awaiter(this, void 0, void 0, function* () {
            const allVars = [];
            try {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              const promises = [];
              for (const collection of collections) {
                for (const varId of collection.variableIds) {
                  promises.push(figma.variables.getVariableByIdAsync(varId).then((variable) => {
                    if (variable) {
                      return {
                        variable,
                        collection
                      };
                    }
                    return null;
                  }));
                }
              }
              const results = yield Promise.all(promises);
              results.forEach((res) => {
                if (res)
                  allVars.push(res);
              });
            } catch (e) {
              console.error("Error fetching all variables:", e);
            }
            return allVars;
          });
        }
        /**
         * Finds design variables that match the given value exactly or nearly
         */
        static findMatchingVariables(value, category, allVariables) {
          return __awaiter(this, void 0, void 0, function* () {
            const matchingVars = [];
            for (const { variable, collection } of allVariables) {
              const isTypeMatch = this.isVariableTypeMatch(variable.resolvedType, category);
              if (!isTypeMatch)
                continue;
              const modeId = collection.defaultModeId;
              const varValue = variable.valuesByMode[modeId];
              const matchType = this.valuesMatch(varValue, value, variable.resolvedType);
              if (matchType) {
                matchingVars.push({
                  id: variable.id,
                  name: variable.name,
                  collectionName: collection.name,
                  resolvedValue: this.formatVariableValue(varValue, variable.resolvedType),
                  matchType
                });
              }
            }
            return matchingVars.sort((a, b) => {
              if (a.matchType !== b.matchType) {
                return a.matchType === "EXACT" ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            });
          });
        }
        /**
         * Check if variable type matches the issue category
         * Note: Stroke category includes both COLOR (stroke color) and FLOAT (stroke weight)
         */
        static isVariableTypeMatch(varType, category) {
          if (category === "Fill") {
            return varType === "COLOR";
          }
          if (category === "Stroke") {
            return varType === "COLOR" || varType === "FLOAT";
          }
          if (category === "Layout") {
            return varType === "FLOAT";
          }
          if (category === "Appearance") {
            return varType === "FLOAT";
          }
          return false;
        }
        /**
         * Check if variable value matches the hard-coded value
         */
        static valuesMatch(varValue, hardValue, varType) {
          if (varType === "COLOR" && typeof varValue === "object" && "r" in varValue) {
            const colorMatch = hardValue.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
            if (!colorMatch)
              return null;
            const r = parseInt(colorMatch[1]) / 255;
            const g = parseInt(colorMatch[2]) / 255;
            const b = parseInt(colorMatch[3]) / 255;
            if (Math.abs(varValue.r - r) < VALUE_MATCH_TOLERANCE && Math.abs(varValue.g - g) < VALUE_MATCH_TOLERANCE && Math.abs(varValue.b - b) < VALUE_MATCH_TOLERANCE) {
              return "EXACT";
            }
            return null;
          }
          if (varType === "FLOAT" && typeof varValue === "number") {
            const numMatch = hardValue.match(/^([\d.]+)/);
            if (!numMatch)
              return null;
            const hardNum = parseFloat(numMatch[1]);
            const diff = Math.abs(varValue - hardNum);
            if (diff < VALUE_MATCH_TOLERANCE) {
              return "EXACT";
            }
            if (diff <= 2) {
              return "NEAR";
            }
          }
          return null;
        }
        /**
         * Format variable value for display
         */
        static formatVariableValue(varValue, varType) {
          if (varType === "COLOR" && typeof varValue === "object" && "r" in varValue) {
            return `rgb(${Math.round(varValue.r * 255)}, ${Math.round(varValue.g * 255)}, ${Math.round(varValue.b * 255)})`;
          }
          if (varType === "FLOAT" && typeof varValue === "number") {
            return `${varValue}`;
          }
          return String(varValue);
        }
      };
      exports.TokenCoverageService = TokenCoverageService;
    }
  });

  // dist/services/variableImportService.js
  var require_variableImportService = __commonJS({
    "dist/services/variableImportService.js"(exports) {
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
      exports.VariableImportService = void 0;
      var errorHandler_1 = require_errorHandler();
      var VariableImportService = class {
        /**
         * Parse CSS content to extract variables
         */
        static parseCSS(content) {
          const tokens = [];
          const lines = content.split("\n");
          const cssVarRegex = /^\s*--([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/;
          const scssVarRegex = /^\s*\$([a-zA-Z0-9-_]+)\s*:\s*([^;]+);/;
          lines.forEach((line, index) => {
            let match = line.match(cssVarRegex);
            let isScss = false;
            if (!match) {
              match = line.match(scssVarRegex);
              isScss = true;
            }
            if (match) {
              const name = match[1].trim();
              let value = match[2].trim();
              if (isScss) {
                value = value.replace(/\s*!default\s*$/, "");
              }
              let type = "string";
              let isGradient = false;
              let isShadow = false;
              if (value.includes("gradient(")) {
                isGradient = true;
                type = "string";
              } else if (value.includes("box-shadow") || value.includes("drop-shadow") || value.match(/\d+px\s+\d+px/) && value.includes("rgba")) {
                isShadow = true;
                type = "string";
              } else if (value.match(/^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+$)/)) {
                type = "color";
              } else if (value.match(/^-?\d*\.?\d+(px|rem|em|%)?$/)) {
                type = "number";
              }
              let groupedName = name;
              console.log(`[Parser] Original token name: "${name}"`);
              if (name.startsWith("--")) {
                groupedName = name.substring(2);
                console.log(`[Parser] Removed CSS prefix: "${groupedName}"`);
              }
              const parts = groupedName.split("-");
              console.log(`[Parser] Split into parts: [${parts.join(", ")}]`);
              if (parts.length > 1) {
                const groupPart = parts[0];
                const valuePart = parts.slice(1).join("-");
                groupedName = `${groupPart}/${valuePart}`;
                console.log(`[Parser] Converted to grouped format: "${groupedName}"`);
              } else {
                console.log(`[Parser] Single part, no grouping needed: "${groupedName}"`);
              }
              tokens.push({
                name: groupedName,
                value,
                type,
                originalLine: line.trim(),
                lineNumber: index + 1,
                isGradient,
                isShadow
              });
            }
          });
          return tokens;
        }
        /**
         * Parse Tailwind CSS content (custom properties in @theme or simple key-value pairs)
         * This is a simplified parser for pasted tailwind config objects or CSS with @theme
         */
        /**
         * Parse Tailwind CSS content (custom properties in @theme or simple key-value pairs)
         * Supports:
         * 1. CSS Variables (standard or @theme)
         * 2. JS Config Objects (module.exports = { theme: ... } or const config = ...)
         */
        static parseTailwind(content) {
          const trimmed = content.trim();
          if (trimmed.startsWith("module.exports") || trimmed.startsWith("export default") || trimmed.startsWith("const") || trimmed.startsWith("{") || trimmed.includes("theme:")) {
            return this.parseTailwindJSConfig(trimmed);
          }
          return this.parseCSS(content);
        }
        /**
         * Parse Tailwind JS configuration object
         * Extracts tokens from theme/extend/colors, spacing, etc.
         * Flattens nested objects into kebab-case names.
         */
        static parseTailwindJSConfig(content) {
          const tokens = [];
          try {
            const categories = ["colors", "spacing", "fontSize", "borderRadius", "boxShadow"];
            categories.forEach((category) => {
              const catIndex = content.indexOf(`${category}:`);
              if (catIndex === -1)
                return;
              const blockStart = content.indexOf("{", catIndex);
              if (blockStart === -1)
                return;
              const block = this.extractBraceBlock(content, blockStart);
              if (block) {
                const categoryTokens = this.parseJSObjectBlock(block, category);
                tokens.push(...categoryTokens);
              }
            });
          } catch (e) {
            console.warn("Failed to parse Tailwind JS config", e);
          }
          return tokens;
        }
        /**
         * Helper to extract a balanced brace block { ... }
         */
        static extractBraceBlock(text, startIndex) {
          let depth = 0;
          let inString = false;
          let stringChar = "";
          for (let i = startIndex; i < text.length; i++) {
            const char = text[i];
            if (inString) {
              if (char === stringChar && text[i - 1] !== "\\") {
                inString = false;
              }
            } else {
              if (char === '"' || char === "'" || char === "`") {
                inString = true;
                stringChar = char;
              } else if (char === "{") {
                depth++;
              } else if (char === "}") {
                depth--;
                if (depth === 0) {
                  return text.substring(startIndex, i + 1);
                }
              }
            }
          }
          return null;
        }
        /**
         * Recursive parser for JS object strings
         * Returns flattened tokens
         */
        static parseJSObjectBlock(block, prefix) {
          const tokens = [];
          const inner = block.trim().substring(1, block.trim().length - 1);
          const regex = /([a-zA-Z0-9_$-]+|\"[^\"]+\"|'[^']+')\s*:\s*(?:({)|([^,}\]]+))/g;
          let match;
          let currentIndex = 0;
          while (currentIndex < inner.length) {
            const keyMatch = inner.substr(currentIndex).match(/([a-zA-Z0-9_$-]+|\"[^\"]+\"|'[^']+')\s*:\s*/);
            if (!keyMatch)
              break;
            const key = keyMatch[1].replace(/['"]/g, "");
            const valueStart = currentIndex + keyMatch.index + keyMatch[0].length;
            if (inner[valueStart] === "{") {
              const subBlock = this.extractBraceBlock(inner, valueStart);
              if (subBlock) {
                const nextPrefix = prefix ? `${prefix}/${key}` : key;
                tokens.push(...this.parseJSObjectBlock(subBlock, nextPrefix));
                currentIndex = valueStart + subBlock.length;
                const nextComma = inner.indexOf(",", currentIndex);
                if (nextComma !== -1 && nextComma < inner.indexOf(":", currentIndex)) {
                  currentIndex = nextComma + 1;
                }
              } else {
                console.warn(`Unbalanced block for key ${key}`);
                break;
              }
            } else {
              let potentialValue = "";
              let inStr = false;
              let strCh = "";
              let endFound = false;
              let j = valueStart;
              for (; j < inner.length; j++) {
                const char = inner[j];
                if (inStr) {
                  if (char === strCh && inner[j - 1] !== "\\")
                    inStr = false;
                } else {
                  if (char === '"' || char === "'") {
                    inStr = true;
                    strCh = char;
                  } else if (char === "," || char === "}") {
                    endFound = true;
                    break;
                  }
                }
                if (!endFound)
                  potentialValue += char;
              }
              const value = potentialValue.trim().replace(/['"]/g, "");
              const tokenName = prefix ? `${prefix}/${key}` : key;
              let type = "string";
              if (value.match(/^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|[a-zA-Z]+$)/))
                type = "color";
              else if (value.match(/^-?\d*\.?\d+(px|rem|em|%)?$/))
                type = "number";
              tokens.push({
                name: tokenName,
                value,
                type,
                originalLine: `${key}: ${value}`,
                lineNumber: 0
              });
              currentIndex = j + 1;
            }
          }
          return tokens;
        }
        /**
         * Compare parsed tokens against existing Figma variables
         */
        static compareTokens(newTokens, existingVariables) {
          const added = [];
          const modified = [];
          const unchanged = [];
          const conflicts = [];
          const existingMap = /* @__PURE__ */ new Map();
          existingVariables.forEach((v) => {
            existingMap.set(v.name, v);
            const cssVarName = v.name.replace(/\//g, "-").toLowerCase();
            existingMap.set(cssVarName, v);
          });
          newTokens.forEach((token) => {
            var _a, _b;
            let match = existingMap.get(token.name);
            if (!match) {
              let cleanName = token.name.replace(/^--|\$/, "");
              cleanName = cleanName.replace(/\./g, "-");
              match = existingMap.get(cleanName);
            }
            if (match) {
              const valuesMatch = this.valuesAreEquivalent(token.value, match);
              if (valuesMatch) {
                unchanged.push(token);
              } else {
                modified.push({
                  token,
                  oldValue: ((_b = (_a = match.valuesByMode) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value) || "mixed",
                  // Simplified
                  existingId: match.id
                });
              }
            } else {
              added.push(token);
            }
          });
          return { added, modified, unchanged, conflicts };
        }
        static valuesAreEquivalent(cssValue, figmaVariable) {
          var _a;
          const firstMode = (_a = figmaVariable.valuesByMode) === null || _a === void 0 ? void 0 : _a[0];
          if (!firstMode)
            return false;
          return false;
        }
        /**
         * Apply variables to Figma
         */
        static importVariables(tokens, options) {
          return __awaiter(this, void 0, void 0, function* () {
            return yield errorHandler_1.ErrorHandler.withErrorHandling(() => __awaiter(this, void 0, void 0, function* () {
              var _a;
              console.log(`[Import] Starting import of ${tokens.length} tokens with options:`, JSON.stringify(options));
              let collection;
              if (options.collectionId) {
                console.log(`[Import] Looking for collection with ID: ${options.collectionId}`);
                collection = yield figma.variables.getVariableCollectionByIdAsync(options.collectionId);
                if (!collection)
                  throw new Error(`Collection ${options.collectionId} not found`);
              } else {
                const collections = yield figma.variables.getLocalVariableCollectionsAsync();
                const name = options.collectionName || "Imported Variables";
                console.log(`[Import] Looking for collection with name: ${name}`);
                collection = collections.find((c) => c.name === name);
                if (!collection) {
                  console.log(`[Import] Creating new collection: ${name}`);
                  collection = figma.variables.createVariableCollection(name);
                } else {
                  console.log(`[Import] Found existing collection: ${name}`);
                }
              }
              let successCount = 0;
              const errors = [];
              if (!collection.modes || collection.modes.length === 0) {
                console.log("[Import] Collection has no modes, attempting recovery...");
                try {
                  collection.renameMode(((_a = collection.modes[0]) === null || _a === void 0 ? void 0 : _a.modeId) || "Mode 1", "Mode 1");
                } catch (e) {
                  console.log("[Import] Mode recovery failed or unnecessary:", e);
                }
              }
              if (!collection.modes || collection.modes.length === 0) {
                throw new Error("Collection has no modes and could not recover");
              }
              const modeId = collection.modes[0].modeId;
              console.log(`[Import] Using Mode ID: ${modeId} (${collection.modes[0].name})`);
              const groups = /* @__PURE__ */ new Set();
              console.log(`[Import] Analyzing ${tokens.length} tokens for groups...`);
              for (const token of tokens) {
                let varName = token.name;
                console.log(`[Import] Processing token: "${token.name}"`);
                if (varName.startsWith("--")) {
                  varName = varName.substring(2);
                  console.log(`[Import] Removed CSS prefix: "${varName}"`);
                }
                if (varName.startsWith("$")) {
                  varName = varName.substring(1);
                  console.log(`[Import] Removed SCSS prefix: "${varName}"`);
                }
                varName = varName.replace(/\./g, "-");
                if (varName.includes("/")) {
                  const groupName = varName.substring(0, varName.lastIndexOf("/"));
                  console.log(`[Import] Found group in "${varName}": "${groupName}"`);
                  if (groupName) {
                    const parts = groupName.split("/");
                    for (let i = 0; i < parts.length; i++) {
                      const groupPath = parts.slice(0, i + 1).join("/");
                      groups.add(groupPath);
                      console.log(`[Import] Added group to set: "${groupPath}"`);
                    }
                  }
                } else {
                  console.log(`[Import] No group found in variable name: "${varName}"`);
                }
              }
              console.log(`[Import] Variables will be organized into ${groups.size} groups based on their names`);
              const existingVariablesMap = /* @__PURE__ */ new Map();
              let paintStylesMap;
              let effectStylesMap;
              try {
                const allVariables = yield figma.variables.getLocalVariablesAsync();
                for (const v of allVariables) {
                  if (v.variableCollectionId === collection.id) {
                    existingVariablesMap.set(v.name, v);
                  }
                }
                const paintStyles = yield figma.getLocalPaintStylesAsync();
                const effectStyles = yield figma.getLocalEffectStylesAsync();
                paintStylesMap = /* @__PURE__ */ new Map();
                paintStyles.forEach((s) => paintStylesMap.set(s.name, s));
                effectStylesMap = /* @__PURE__ */ new Map();
                effectStyles.forEach((s) => effectStylesMap.set(s.name, s));
              } catch (err) {
                console.error("[Import] Error fetching local variables/styles:", err);
                throw new Error("Failed to fetch existing variables or styles");
              }
              console.log(`[Import] Processing ${tokens.length} tokens...`);
              for (const token of tokens) {
                try {
                  let varName = token.name;
                  console.log(`[Import] Processing variable creation for: "${token.name}"`);
                  if (varName.startsWith("--")) {
                    varName = varName.substring(2);
                    console.log(`[Import] After removing CSS prefix: "${varName}"`);
                  }
                  if (varName.startsWith("$")) {
                    varName = varName.substring(1);
                    console.log(`[Import] After removing SCSS prefix: "${varName}"`);
                  }
                  varName = varName.replace(/\./g, "-");
                  if (options.organizeByCategories === false) {
                    varName = varName.replace(/\//g, "-");
                    console.log(`[Import] Flattened variable name (categories disabled): "${varName}"`);
                  }
                  console.log(`[Import] Final variable name to create: "${varName}"`);
                  if (varName.includes("/")) {
                    console.log(`[Import] Variable "${varName}" WILL create groups in Figma`);
                  } else {
                    console.log(`[Import] Variable "${varName}" will NOT create groups (no slash)`);
                  }
                  if (token.type) {
                    const lowerType = token.type.toLowerCase();
                    if (lowerType === "gradient" || lowerType === "linear-gradient" || lowerType === "radial-gradient") {
                      token.isGradient = true;
                    }
                    if (lowerType === "shadow" || lowerType === "box-shadow") {
                      token.isShadow = true;
                    }
                    if (["color", "number", "string"].indexOf(lowerType) !== -1) {
                      token.type = lowerType;
                    } else if (lowerType === "float") {
                      token.type = "number";
                    }
                  }
                  if (token.isGradient) {
                    this.createGradientStyle(token, paintStylesMap, options.strategy === "overwrite");
                    successCount++;
                    console.log(`[Import] \u2713 Created gradient style: ${varName}`);
                    continue;
                  }
                  if (token.isShadow) {
                    this.createShadowStyle(token, effectStylesMap, options.strategy === "overwrite");
                    successCount++;
                    console.log(`[Import] \u2713 Created shadow style: ${varName}`);
                    continue;
                  }
                  let val = this.parseValueForFigma(token.value, token.type);
                  if (val === void 0 && token.value.includes("var(")) {
                    const match = token.value.match(/var\((--[^)]+)\)/);
                    if (match) {
                      const aliasName = match[1].replace(/^--/, "");
                      const aliasedVar = existingVariablesMap.get(aliasName);
                      if (aliasedVar) {
                        val = figma.variables.createVariableAlias(aliasedVar);
                        console.log(`[Import] Resolved alias for ${varName} -> ${aliasName}`);
                        if (token.type === "string" && aliasedVar.resolvedType) {
                          if (aliasedVar.resolvedType === "COLOR")
                            token.type = "color";
                          else if (aliasedVar.resolvedType === "FLOAT")
                            token.type = "number";
                        }
                      } else {
                        console.warn(`[Import] Could not find variable for alias: ${aliasName}`);
                      }
                    }
                    if (val === void 0) {
                      let resolvedString = token.value;
                      let hasUnresolved = false;
                      resolvedString = resolvedString.replace(/var\((--[^)]+)\)/g, (fullMatch, cssVarName) => {
                        const name = cssVarName.replace(/^--/, "");
                        const existing = existingVariablesMap.get(name);
                        if (existing) {
                          const modeVal = existing.valuesByMode[modeId];
                          if (typeof modeVal === "object" && "r" in modeVal) {
                            const alpha = "a" in modeVal ? modeVal.a : 1;
                            return `rgba(${Math.round(modeVal.r * 255)}, ${Math.round(modeVal.g * 255)}, ${Math.round(modeVal.b * 255)}, ${alpha})`;
                          } else if (typeof modeVal === "number") {
                            return modeVal.toString();
                          }
                        }
                        const t = tokens.find((t2) => t2.name === cssVarName);
                        if (t) {
                          if (!t.value.includes("var("))
                            return t.value;
                        }
                        hasUnresolved = true;
                        return fullMatch;
                      });
                      if (!hasUnresolved) {
                        val = this.parseValueForFigma(resolvedString, token.type);
                        if (val !== void 0 && token.type === "string") {
                          if (this.parseColor(resolvedString))
                            token.type = "color";
                        }
                      }
                    }
                  }
                  let targetVar = existingVariablesMap.get(varName);
                  const desiredType = this.mapTokenTypeToFigmaType(token.type);
                  if (targetVar) {
                    if (desiredType && targetVar.resolvedType !== desiredType && options.strategy === "overwrite") {
                      console.warn(`[Import] Type mismatch for ${varName} (Existing: ${targetVar.resolvedType}, New: ${desiredType}). Re-creating...`);
                      try {
                        targetVar.remove();
                        targetVar = void 0;
                      } catch (e) {
                        console.error(`[Import] Failed to remove mismatched variable ${varName}:`, e);
                        errors.push(`Failed to remove mismatched variable ${varName}`);
                        continue;
                      }
                    } else if (options.strategy === "merge") {
                      successCount++;
                      continue;
                    }
                  }
                  if (!targetVar) {
                    if (!desiredType) {
                      console.warn(`[Import] Skipped ${token.name}: Unsupported variable type ${token.type}`);
                      errors.push(`Skipped ${token.name}: Unsupported variable type ${token.type}`);
                      continue;
                    }
                    try {
                      console.log(`[Import] Creating variable '${varName}' in collection '${collection.name}' (ID: ${collection.id}) with type '${desiredType}'`);
                      try {
                        targetVar = figma.variables.createVariable(varName, collection.id, desiredType);
                      } catch (e) {
                        if (e.message && e.message.includes("pass the collection node")) {
                          console.warn("[Import] 'createVariable' requested collection node. Retrying with collection object...");
                          targetVar = figma.variables.createVariable(varName, collection, desiredType);
                        } else {
                          throw e;
                        }
                      }
                      existingVariablesMap.set(varName, targetVar);
                      console.log(`[Import] Created variable: ${varName} (ID: ${targetVar.id})`);
                    } catch (createErr) {
                      console.error(`[Import] Failed to create variable ${varName}:`, createErr);
                      errors.push(`Failed to create variable ${varName}: ${createErr.message}`);
                      continue;
                    }
                  }
                  if (val !== void 0 && targetVar) {
                    try {
                      targetVar.setValueForMode(modeId, val);
                      successCount++;
                    } catch (err) {
                      console.error(`[Import] Failed to set value for ${token.name}:`, err);
                      if (err.message.includes("Mismatched variable resolved type")) {
                        errors.push(`Type mismatch for ${token.name}: Variable is ${targetVar.resolvedType} but value is incompatible.`);
                      } else {
                        errors.push(`Failed to set value for ${token.name}: ${err.message}`);
                      }
                    }
                  } else if (!targetVar) {
                    errors.push(`No target variable for ${token.name}`);
                  } else {
                    console.warn(`[Import] Failed to parse value for ${token.name}: ${token.value}`);
                    errors.push(`Failed to parse value for ${token.name}: ${token.value}`);
                  }
                } catch (e) {
                  console.error(`[Import] Error importing ${token.name}:`, e);
                  errors.push(`Error importing ${token.name}: ${e.message}`);
                }
              }
              console.log(`[Import] Completed. Success: ${successCount}/${tokens.length}`);
              if (errors.length > 0) {
                console.log(`[Import] Errors:`, errors);
              }
              console.log(`[Import] Final groups set contents: [${Array.from(groups).join(", ")}]`);
              console.log(`[Import] Total groups created: ${groups.size}`);
              return { success: successCount, errors, groupsCreated: groups.size };
            }), {
              operation: "import_variables",
              component: "VariableImportService",
              severity: "medium"
            });
          });
        }
        /**
         * Create a Paint Style for a gradient token
         * Now synchronous using pre-fetched map
         */
        static createGradientStyle(token, stylesMap, overwrite) {
          const isLinear = token.value.includes("linear-gradient");
          const isRadial = token.value.includes("radial-gradient");
          const isConic = token.value.includes("conic-gradient");
          if (!isLinear && !isRadial && !isConic)
            return;
          const styleName = token.name.replace(/^--|\$/, "");
          let style = stylesMap.get(styleName);
          if (style && !overwrite)
            return;
          if (!style) {
            style = figma.createPaintStyle();
            style.name = styleName;
            stylesMap.set(styleName, style);
          }
          try {
            let gradient = null;
            if (isLinear) {
              gradient = this.parseLinearGradient(token.value);
            } else if (isRadial) {
              gradient = this.parseRadialGradient(token.value);
            } else if (isConic) {
              gradient = this.parseConicGradient(token.value);
            }
            if (gradient) {
              style.paints = [gradient];
            }
          } catch (error) {
            console.warn(`Failed to parse gradient ${token.name}:`, error);
            const fallback = {
              type: "GRADIENT_LINEAR",
              gradientTransform: [
                [1, 0, 0],
                [0, 1, 0]
              ],
              gradientStops: [
                { position: 0, color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } },
                { position: 1, color: { r: 0.8, g: 0.8, b: 0.8, a: 1 } }
              ]
            };
            style.paints = [fallback];
          }
        }
        /**
         * Create an Effect Style for a shadow token
         * Now synchronous using pre-fetched map
         */
        static createShadowStyle(token, stylesMap, overwrite) {
          const styleName = token.name.replace(/^--|\$/, "");
          let style = stylesMap.get(styleName);
          if (style && !overwrite)
            return;
          if (!style) {
            style = figma.createEffectStyle();
            style.name = styleName;
            stylesMap.set(styleName, style);
          }
          const value = token.value.trim();
          const isInset = value.includes("inset");
          const cleanValue = value.replace("inset", "").trim();
          let color = { r: 0, g: 0, b: 0, a: 0.2 };
          const hexMatch = cleanValue.match(/#[0-9a-fA-F]{3,8}/);
          if (hexMatch) {
            const parsed = this.parseColor(hexMatch[0]);
            if (parsed)
              color = parsed;
          } else {
            const parts = cleanValue.split(/\s+/);
            for (const part of parts) {
              if (this.isColorStop(part)) {
                const parsed = this.parseColor(part);
                if (parsed) {
                  color = parsed;
                  break;
                }
              }
            }
          }
          const lengthRegex = /(-?\d*\.?\d+)(px|rem|em|%)?/g;
          const lengths = [];
          let match;
          while ((match = lengthRegex.exec(cleanValue)) !== null) {
            lengths.push(parseFloat(match[1]));
          }
          let x = 0, y = 4, blur = 4, spread = 0;
          if (lengths.length >= 2) {
            x = lengths[0];
            y = lengths[1];
          }
          if (lengths.length >= 3) {
            blur = lengths[2];
          }
          if (lengths.length >= 4) {
            spread = lengths[3];
          }
          style.effects = [
            {
              type: isInset ? "INNER_SHADOW" : "DROP_SHADOW",
              color,
              offset: { x, y },
              radius: blur,
              spread,
              visible: true,
              blendMode: "NORMAL"
            }
          ];
        }
        static mapTokenTypeToFigmaType(type) {
          switch (type) {
            case "color":
              return "COLOR";
            case "number":
              return "FLOAT";
            case "string":
              return "STRING";
            default:
              return "STRING";
          }
        }
        static parseValueForFigma(value, type) {
          if (type === "color") {
            return this.parseColor(value);
          }
          if (type === "number") {
            const num = parseFloat(value.replace(/[^0-9.-]/g, ""));
            return isNaN(num) ? 0 : num;
          }
          return value;
        }
        static parseColor(colorStr) {
          try {
            const cleanColor = colorStr.trim().toLowerCase();
            if (cleanColor.startsWith("#")) {
              const hex = cleanColor.substring(1);
              if (hex.length === 3) {
                const r = parseInt(hex[0] + hex[0], 16) / 255;
                const g = parseInt(hex[1] + hex[1], 16) / 255;
                const b = parseInt(hex[2] + hex[2], 16) / 255;
                return { r, g, b, a: 1 };
              }
              if (hex.length === 6) {
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                return { r, g, b, a: 1 };
              }
              if (hex.length === 8) {
                const r = parseInt(hex.substring(0, 2), 16) / 255;
                const g = parseInt(hex.substring(2, 4), 16) / 255;
                const b = parseInt(hex.substring(4, 6), 16) / 255;
                const a = parseInt(hex.substring(6, 8), 16) / 255;
                return { r, g, b, a };
              }
            }
            if (cleanColor.startsWith("rgb")) {
              const match = cleanColor.match(/rgba?\s*\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/);
              if (match) {
                return {
                  r: Math.min(1, parseFloat(match[1]) / 255),
                  g: Math.min(1, parseFloat(match[2]) / 255),
                  b: Math.min(1, parseFloat(match[3]) / 255),
                  a: match[4] !== void 0 ? parseFloat(match[4]) : 1
                };
              }
            }
            if (cleanColor.startsWith("hsl")) {
              const match = cleanColor.match(/hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)/);
              if (match) {
                const h = parseInt(match[1]) / 360;
                const s = parseInt(match[2]) / 100;
                const l = parseInt(match[3]) / 100;
                const a = match[4] !== void 0 ? parseFloat(match[4]) : 1;
                const c = (1 - Math.abs(2 * l - 1)) * s;
                const x = c * (1 - Math.abs(h * 6 % 2 - 1));
                const m = l - c / 2;
                let r = 0, g = 0, b = 0;
                if (h < 1 / 6) {
                  r = c;
                  g = x;
                  b = 0;
                } else if (h < 2 / 6) {
                  r = x;
                  g = c;
                  b = 0;
                } else if (h < 3 / 6) {
                  r = 0;
                  g = c;
                  b = x;
                } else if (h < 4 / 6) {
                  r = 0;
                  g = x;
                  b = c;
                } else if (h < 5 / 6) {
                  r = x;
                  g = 0;
                  b = c;
                } else {
                  r = c;
                  g = 0;
                  b = x;
                }
                return { r: r + m, g: g + m, b: b + m, a };
              }
            }
            const namedColors = {
              transparent: { r: 0, g: 0, b: 0, a: 0 },
              black: { r: 0, g: 0, b: 0, a: 1 },
              white: { r: 1, g: 1, b: 1, a: 1 },
              red: { r: 1, g: 0, b: 0, a: 1 },
              green: { r: 0, g: 0.5, b: 0, a: 1 },
              blue: { r: 0, g: 0, b: 1, a: 1 },
              yellow: { r: 1, g: 1, b: 0, a: 1 },
              cyan: { r: 0, g: 1, b: 1, a: 1 },
              magenta: { r: 1, g: 0, b: 1, a: 1 },
              gray: { r: 0.5, g: 0.5, b: 0.5, a: 1 },
              grey: { r: 0.5, g: 0.5, b: 0.5, a: 1 }
            };
            if (namedColors[cleanColor]) {
              return namedColors[cleanColor];
            }
            if (cleanColor.includes("var(") || cleanColor.includes("calc(")) {
              console.warn(`Cannot parse CSS variable or calc expression: ${colorStr}`);
              return void 0;
            }
          } catch (error) {
            console.error(`Error parsing color "${colorStr}":`, error);
          }
          console.warn(`Unable to parse color: ${colorStr}`);
          return void 0;
        }
        /**
         * Parse linear gradient CSS value into Figma GradientPaint
         */
        static parseLinearGradient(value) {
          const match = value.match(/linear-gradient\s*\(\s*([^)]+)\)/);
          if (!match)
            throw new Error("Invalid linear gradient syntax");
          const content = match[1];
          const parts = this.parseGradientParts(content);
          let angle = 180;
          const firstPart = parts[0].trim();
          if (firstPart.includes("deg")) {
            angle = parseInt(firstPart.replace("deg", ""));
            parts.shift();
          } else if (firstPart.startsWith("to ")) {
            if (firstPart.includes("right"))
              angle = 90;
            else if (firstPart.includes("left"))
              angle = 270;
            else if (firstPart.includes("top"))
              angle = 0;
            else if (firstPart.includes("bottom"))
              angle = 180;
            parts.shift();
          }
          const stops = this.parseGradientStops(parts);
          const transform = this.angleToGradientTransform(angle);
          return {
            type: "GRADIENT_LINEAR",
            gradientTransform: transform,
            gradientStops: stops
          };
        }
        /**
         * Parse radial gradient CSS value into Figma GradientPaint
         */
        static parseRadialGradient(value) {
          const match = value.match(/radial-gradient\s*\(\s*([^)]+)\)/);
          if (!match)
            throw new Error("Invalid radial gradient syntax");
          const content = match[1];
          const parts = this.parseGradientParts(content);
          while (parts.length > 0 && !this.isColorStop(parts[0])) {
            parts.shift();
          }
          const stops = this.parseGradientStops(parts);
          return {
            type: "GRADIENT_RADIAL",
            gradientTransform: [
              [1, 0, 0.5],
              [0, 1, 0.5]
            ],
            // Centered radial
            gradientStops: stops
          };
        }
        /**
         * Parse conic gradient CSS value into Figma GradientPaint
         */
        static parseConicGradient(value) {
          const match = value.match(/conic-gradient\s*\(\s*([^)]+)\)/);
          if (!match)
            throw new Error("Invalid conic gradient syntax");
          const content = match[1];
          const parts = this.parseGradientParts(content);
          while (parts.length > 0 && !this.isColorStop(parts[0])) {
            parts.shift();
          }
          const stops = this.parseGradientStops(parts);
          return {
            type: "GRADIENT_ANGULAR",
            gradientTransform: [
              [1, 0, 0.5],
              [0, 1, 0.5]
            ],
            // Centered angular
            gradientStops: stops
          };
        }
        /**
         * Split gradient content into parts, handling nested functions
         */
        static parseGradientParts(content) {
          const parts = [];
          let current = "";
          let depth = 0;
          for (let i = 0; i < content.length; i++) {
            const char = content[i];
            if (char === "(")
              depth++;
            else if (char === ")")
              depth--;
            else if (char === "," && depth === 0) {
              if (current.trim())
                parts.push(current.trim());
              current = "";
              continue;
            }
            current += char;
          }
          if (current.trim())
            parts.push(current.trim());
          return parts;
        }
        /**
         * Check if a string looks like a color stop
         */
        static isColorStop(part) {
          const trimmed = part.trim();
          return trimmed.includes("#") || trimmed.includes("rgb") || trimmed.includes("hsl") || trimmed.includes("var(") || /^[a-zA-Z]+(\s+\d+%?)?$/.test(trimmed);
        }
        /**
         * Parse color stops from gradient parts
         */
        static parseGradientStops(parts) {
          const stops = [];
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (!part)
              continue;
            const colorStopMatch = part.match(/^(.*?)(?:\s+(\d+(?:\.\d+)?%?))?$/);
            if (!colorStopMatch)
              continue;
            const colorStr = colorStopMatch[1].trim();
            const positionStr = colorStopMatch[2];
            const color = this.parseColor(colorStr);
            if (!color)
              continue;
            let position = 0;
            if (positionStr) {
              if (positionStr.includes("%")) {
                position = parseFloat(positionStr.replace("%", "")) / 100;
              } else {
                position = parseFloat(positionStr) / 100;
              }
            } else {
              position = i / Math.max(1, parts.length - 1);
            }
            position = Math.max(0, Math.min(1, position));
            stops.push({ position, color });
          }
          if (stops.length === 0) {
            stops.push({ position: 0, color: { r: 0.5, g: 0.5, b: 0.5, a: 1 } }, { position: 1, color: { r: 0.8, g: 0.8, b: 0.8, a: 1 } });
          } else if (stops.length === 1) {
            const firstColor = stops[0].color;
            stops.length = 0;
            stops.push({ position: 0, color: firstColor }, { position: 1, color: firstColor });
          }
          stops.sort((a, b) => a.position - b.position);
          return stops;
        }
        /**
         * Convert CSS angle to Figma gradient transform matrix
         */
        static angleToGradientTransform(degrees) {
          const radians = degrees * Math.PI / 180;
          const cos = Math.cos(radians);
          const sin = Math.sin(radians);
          return [
            [cos, -sin, 0.5],
            [sin, cos, 0.5]
          ];
        }
      };
      exports.VariableImportService = VariableImportService;
    }
  });

  // dist/services/oauthService.js
  var require_oauthService = __commonJS({
    "dist/services/oauthService.js"(exports) {
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
      exports.OAuthService = void 0;
      var config_1 = require_config();
      var OAuthService = class {
        /**
         * Generate GitHub OAuth authorization URL
         */
        static generateGitHubOAuthUrl() {
          const config = this.GITHUB_OAUTH_CONFIG;
          const state = this.generateSecureState();
          const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            scope: config.scope.join(" "),
            state,
            response_type: "code"
          });
          this.storeOAuthState(state);
          const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;
          config_1.LoggingService.debug("Generated GitHub OAuth URL", {
            scopes: config.scope,
            state: state.substring(0, 8) + "..."
            // Log first 8 chars for debugging
          }, config_1.LoggingService.CATEGORIES.GITHUB);
          return authUrl;
        }
        /**
         * Check if OAuth is configured and available
         */
        static isOAuthConfigured() {
          const config = this.GITHUB_OAUTH_CONFIG;
          return config.clientId !== "your-github-client-id" && config.clientId.length > 0 && config.redirectUri.startsWith("https://");
        }
        /**
         * Start OAuth flow by opening popup window
         */
        static startOAuthFlow() {
          return __awaiter(this, void 0, void 0, function* () {
            if (!this.isOAuthConfigured()) {
              return {
                success: false,
                error: "OAuth is not configured. Please use Personal Access Token method."
              };
            }
            return new Promise((resolve) => {
              try {
                const authUrl = this.generateGitHubOAuthUrl();
                const popup = window.open(authUrl, "github-oauth", "width=600,height=700,scrollbars=yes,resizable=yes");
                if (!popup) {
                  resolve({
                    success: false,
                    error: "Failed to open OAuth popup. Please allow popups for this site."
                  });
                  return;
                }
                const messageHandler = (event) => {
                  if (event.origin !== "https://bridgy-oauth.netlify.app") {
                    return;
                  }
                  if (event.data.type === "oauth-success") {
                    window.removeEventListener("message", messageHandler);
                    popup.close();
                    resolve({
                      success: true,
                      token: event.data.token,
                      user: event.data.user
                    });
                  } else if (event.data.type === "oauth-error") {
                    window.removeEventListener("message", messageHandler);
                    popup.close();
                    resolve({
                      success: false,
                      error: event.data.error
                    });
                  }
                };
                window.addEventListener("message", messageHandler);
                const checkClosed = setInterval(() => {
                  if (popup.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener("message", messageHandler);
                    resolve({
                      success: false,
                      error: "OAuth flow was cancelled by user"
                    });
                  }
                }, 1e3);
                setTimeout(() => {
                  if (!popup.closed) {
                    popup.close();
                  }
                  clearInterval(checkClosed);
                  window.removeEventListener("message", messageHandler);
                  resolve({
                    success: false,
                    error: "OAuth flow timed out"
                  });
                }, 3e5);
              } catch (error) {
                resolve({
                  success: false,
                  error: error.message || "Failed to start OAuth flow"
                });
              }
            });
          });
        }
        /**
         * Get OAuth configuration status for UI display
         */
        static getOAuthStatus() {
          const configured = this.isOAuthConfigured();
          if (configured) {
            return {
              available: true,
              configured: true,
              message: "OAuth login is available"
            };
          } else {
            return {
              available: false,
              configured: false,
              message: "OAuth not configured. Using Personal Access Token method."
            };
          }
        }
        /**
         * Generate secure random state for OAuth flow
         */
        static generateSecureState() {
          const array = new Uint8Array(32);
          crypto.getRandomValues(array);
          return Array.from(array, (byte) => {
            const hex = byte.toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          }).join("");
        }
        static storeOAuthState(state) {
          this.oauthStates.add(state);
          setTimeout(() => {
            this.oauthStates.delete(state);
          }, 10 * 60 * 1e3);
        }
        /**
         * Verify OAuth state
         */
        static verifyOAuthState(state) {
          return this.oauthStates.has(state);
        }
        /**
         * Exchange OAuth code for access token
         * Note: This would typically be done by a backend server for security
         */
        static exchangeCodeForToken(code, state) {
          return __awaiter(this, void 0, void 0, function* () {
            if (!this.verifyOAuthState(state)) {
              throw new Error("Invalid OAuth state - possible CSRF attack");
            }
            throw new Error("OAuth token exchange requires backend server implementation");
          });
        }
        /**
         * Instructions for OAuth setup
         */
        static getSetupInstructions() {
          return [
            "1. Go to GitHub Settings \u2192 Developer settings \u2192 OAuth Apps",
            '2. Click "New OAuth App"',
            "3. Fill in the application details:",
            '   - Application name: "Bridgy Figma Plugin"',
            '   - Homepage URL: "https://bridgy-plugin.com"',
            '   - Authorization callback URL: "https://bridgy-plugin.com/oauth/github/callback"',
            "4. Copy the Client ID and Client Secret",
            "5. Set environment variables or update configuration",
            "6. Deploy backend OAuth handler to handle token exchange",
            "",
            "For development, you can continue using Personal Access Tokens.",
            "OAuth provides better security and user experience for production."
          ];
        }
        /**
         * Check if current token appears to be from OAuth or PAT
         */
        static isTokenFromOAuth(token) {
          return token.startsWith("gho_");
        }
        /**
         * Get recommended scopes for different use cases
         */
        static getRecommendedScopes() {
          return {
            minimal: ["public_repo"],
            // Public repositories only
            standard: ["repo", "read:user"],
            // Private repos + user info
            full: ["repo", "read:user", "user:email", "admin:repo_hook"]
            // Full access
          };
        }
        /**
         * Validate token scopes
         */
        static validateTokenScopes(scopes) {
          const required = ["repo"];
          const recommended = ["read:user"];
          const missing = required.filter((scope) => scopes.indexOf(scope) === -1);
          const recommendations = recommended.filter((scope) => scopes.indexOf(scope) === -1);
          return {
            valid: missing.length === 0,
            missing,
            recommendations
          };
        }
        /**
         * Display OAuth setup UI hint
         */
        static getOAuthSetupHint() {
          if (this.isOAuthConfigured()) {
            return "";
          }
          return `
      \u{1F4A1} Pro Tip: For better security and user experience, consider setting up GitHub OAuth.
      This allows users to authenticate with their GitHub account instead of using Personal Access Tokens.
      
      Contact your development team to configure OAuth for this plugin.
    `;
        }
      };
      exports.OAuthService = OAuthService;
      OAuthService.GITHUB_OAUTH_CONFIG = {
        // GitHub OAuth App configuration
        // You need to register an OAuth App at: https://github.com/settings/applications/new
        clientId: "Ov23liKXGtyeKaklFf0Q",
        // Bridgy Plugin OAuth App
        redirectUri: "https://bridgy-oauth.netlify.app/github/callback",
        scope: [
          "repo",
          // Access to repositories
          "read:user",
          // Read user profile
          "user:email"
          // Access to user email
        ]
      };
      OAuthService.oauthStates = /* @__PURE__ */ new Set();
    }
  });

  // dist/core/plugin.js
  var require_plugin = __commonJS({
    "dist/core/plugin.js"(exports) {
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
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      } : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      }();
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
      var gitServiceFactory_1 = require_gitServiceFactory();
      var cssExportService_1 = require_cssExportService();
      var componentService_1 = require_componentService();
      var tokenCoverageService_1 = require_tokenCoverageService();
      var variableImportService_1 = require_variableImportService();
      var config_1 = require_config();
      figma.showUI(__html__, { width: 650, height: 900, themeColors: true });
      function collectDocumentData() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const usageMap = /* @__PURE__ */ new Map();
            try {
              const usageNodes = figma.currentPage.findAll((node) => true);
              for (const node of usageNodes) {
                if ("boundVariables" in node && node.boundVariables) {
                  const bounds = node.boundVariables;
                  for (const key in bounds) {
                    const val = bounds[key];
                    if (val) {
                      if (Array.isArray(val)) {
                        val.forEach((v) => {
                          if (v.type === "VARIABLE_ALIAS") {
                            usageMap.set(v.id, (usageMap.get(v.id) || 0) + 1);
                          }
                        });
                      } else if (val.type === "VARIABLE_ALIAS") {
                        usageMap.set(val.id, (usageMap.get(val.id) || 0) + 1);
                      }
                    }
                  }
                }
                const checkStyle = (styleId) => {
                  if (typeof styleId === "string" && styleId.length > 0) {
                    usageMap.set(styleId, (usageMap.get(styleId) || 0) + 1);
                  }
                };
                if ("fillStyleId" in node)
                  checkStyle(node.fillStyleId);
                if ("strokeStyleId" in node)
                  checkStyle(node.strokeStyleId);
                if ("textStyleId" in node)
                  checkStyle(node.textStyleId);
                if ("effectStyleId" in node)
                  checkStyle(node.effectStyleId);
                if ("gridStyleId" in node)
                  checkStyle(node.gridStyleId);
              }
            } catch (e) {
              console.warn("Error counting usages:", e);
            }
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
                  valuesByMode: valuesByModeEntries,
                  usageCount: usageMap.get(variable.id) || 0
                };
              }));
              const variablesResult = yield Promise.all(variablesPromises);
              const variables = variablesResult.filter((item) => item !== null);
              variablesData.push({
                name: collection.name,
                variables
              });
            }
            const stylesData = {
              textStyles: [],
              paintStyles: [],
              effectStyles: []
            };
            const textStyles = yield figma.getLocalTextStylesAsync();
            for (const textStyle of textStyles) {
              stylesData.textStyles.push({
                id: textStyle.id,
                name: textStyle.name,
                description: textStyle.description,
                fontSize: textStyle.fontSize,
                fontName: textStyle.fontName,
                // fontWeight: textStyle.fontWeight, // Property doesn't exist on TextStyle
                lineHeight: textStyle.lineHeight,
                letterSpacing: textStyle.letterSpacing,
                textCase: textStyle.textCase,
                textDecoration: textStyle.textDecoration,
                boundVariables: textStyle.boundVariables,
                usageCount: usageMap.get(textStyle.id) || 0
              });
            }
            const paintStyles = yield figma.getLocalPaintStylesAsync();
            for (const paintStyle of paintStyles) {
              stylesData.paintStyles.push({
                id: paintStyle.id,
                name: paintStyle.name,
                description: paintStyle.description,
                paints: paintStyle.paints,
                boundVariables: paintStyle.boundVariables,
                usageCount: usageMap.get(paintStyle.id) || 0
              });
            }
            const effectStyles = yield figma.getLocalEffectStylesAsync();
            for (const effectStyle of effectStyles) {
              stylesData.effectStyles.push({
                id: effectStyle.id,
                name: effectStyle.name,
                description: effectStyle.description,
                effects: effectStyle.effects,
                boundVariables: effectStyle.boundVariables,
                usageCount: usageMap.get(effectStyle.id) || 0
              });
            }
            const gridStyles = yield figma.getLocalGridStylesAsync();
            stylesData.gridStyles = [];
            for (const gridStyle of gridStyles) {
              stylesData.gridStyles.push({
                id: gridStyle.id,
                name: gridStyle.name,
                description: gridStyle.description,
                layoutGrids: gridStyle.layoutGrids,
                boundVariables: gridStyle.boundVariables,
                usageCount: usageMap.get(gridStyle.id) || 0
              });
            }
            const componentsData = yield componentService_1.ComponentService.collectComponents();
            if (!componentsData || componentsData.length === 0) {
              console.warn("No components found in document");
            }
            const referencedIds = /* @__PURE__ */ new Set();
            const collectAliasIds = (val) => {
              if (val && typeof val === "object" && val.type === "VARIABLE_ALIAS" && val.id) {
                referencedIds.add(val.id);
              }
            };
            variablesData.forEach((collection) => {
              collection.variables.forEach((variable) => {
                variable.valuesByMode.forEach((item) => {
                  collectAliasIds(item.value);
                });
              });
            });
            const variableReferences = {};
            const referencePromises = Array.from(referencedIds).map((id) => __awaiter(this, void 0, void 0, function* () {
              try {
                let foundLocal = false;
                for (const col of variablesData) {
                  const local = col.variables.find((v) => v.id === id);
                  if (local) {
                    variableReferences[id] = local.name;
                    foundLocal = true;
                    break;
                  }
                }
                if (!foundLocal) {
                  const v = yield figma.variables.getVariableByIdAsync(id);
                  if (v) {
                    variableReferences[id] = v.name;
                  }
                }
              } catch (e) {
                console.warn(`Could not resolve referenced variable: ${id}`);
              }
            }));
            yield Promise.all(referencePromises);
            const feedbackDismissed = yield figma.clientStorage.getAsync("feedback_dismissed");
            figma.ui.postMessage({
              type: "document-data",
              variablesData,
              variableReferences,
              // Send the lookup map
              stylesData,
              componentsData: componentsData || [],
              feedbackDismissed: !!feedbackDismissed
            });
            return {
              variables: variablesData,
              styles: stylesData,
              components: componentsData || []
            };
          } catch (error) {
            console.error("Error collecting document data:", error);
            figma.ui.postMessage({
              type: "document-data-error",
              error: error instanceof Error ? error.message : "Unknown error during data collection",
              variablesData: [],
              // Send empty arrays as fallback
              componentsData: []
            });
            return {
              variables: [],
              components: []
            };
          }
        });
      }
      function loadSavedGitSettings() {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const gitService = yield gitServiceFactory_1.GitServiceFactory.getServiceFromSettings();
            if (gitService) {
              const settings = yield gitService.loadSettings();
              if (settings) {
                figma.ui.postMessage({
                  type: "git-settings-loaded",
                  settings
                });
                return;
              }
            }
            const gitlabSettings = yield gitlabService_1.GitLabService.loadSettings();
            if (gitlabSettings) {
              figma.ui.postMessage({
                type: "gitlab-settings-loaded",
                settings: gitlabSettings
              });
            }
          } catch (error) {
            console.error("Error loading Git settings:", error);
          }
        });
      }
      collectDocumentData();
      loadSavedGitSettings();
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
      function matchesTargetValue(paint, targetValue) {
        if (!targetValue)
          return true;
        if (!paint || !paint.color)
          return false;
        const { r, g, b } = paint.color;
        const toHex = (n) => {
          const hex2 = Math.round(n * 255).toString(16);
          return hex2.length === 1 ? "0" + hex2 : hex2;
        };
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
        const rgb = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
        const target = targetValue.trim();
        return target.toUpperCase() === hex || target === rgb || target.replace(/\s/g, "") === rgb.replace(/\s/g, "");
      }
      function applyVariableToNode(node, variable, property, category, targetValue) {
        return __awaiter(this, void 0, void 0, function* () {
          try {
            const propertyMap = {
              Width: "width",
              Height: "height",
              "Min Width": "minWidth",
              "Max Width": "maxWidth",
              "Min Height": "minHeight",
              "Max Height": "maxHeight",
              Gap: "itemSpacing",
              Padding: "paddingLeft",
              // Will also set other padding properties
              "Padding Left": "paddingLeft",
              "Padding Top": "paddingTop",
              "Padding Right": "paddingRight",
              "Padding Bottom": "paddingBottom",
              "Fill Color": "fills",
              "Stroke Color": "strokes",
              "Stroke Weight": "strokeWeight",
              Opacity: "opacity",
              "Corner Radius": "topLeftRadius",
              // Will also set other corner radii
              "Corner Radius (Top Left)": "topLeftRadius",
              "Corner Radius (Top Right)": "topRightRadius",
              "Corner Radius (Bottom Left)": "bottomLeftRadius",
              "Corner Radius (Bottom Right)": "bottomRightRadius"
            };
            const figmaProperty = propertyMap[property];
            if (!figmaProperty) {
              console.warn(`[BRIDGY] Unknown property: ${property}`);
              return false;
            }
            if (!(figmaProperty in node)) {
              console.warn(`[BRIDGY] Node ${node.name} (${node.type}) does not support property: ${figmaProperty}`);
              return false;
            }
            if (property === "Padding") {
              const paddingNode = node;
              if ("paddingLeft" in paddingNode && typeof paddingNode.setBoundVariable === "function") {
                paddingNode.setBoundVariable("paddingLeft", variable);
                paddingNode.setBoundVariable("paddingTop", variable);
                paddingNode.setBoundVariable("paddingRight", variable);
                paddingNode.setBoundVariable("paddingBottom", variable);
              }
            } else if (property === "Corner Radius") {
              const radiusNode = node;
              if ("topLeftRadius" in radiusNode && typeof radiusNode.setBoundVariable === "function") {
                radiusNode.setBoundVariable("topLeftRadius", variable);
                radiusNode.setBoundVariable("topRightRadius", variable);
                radiusNode.setBoundVariable("bottomLeftRadius", variable);
                radiusNode.setBoundVariable("bottomRightRadius", variable);
              }
            } else if (property === "Fill Color") {
              const fillNode = node;
              if ("fills" in fillNode && Array.isArray(fillNode.fills) && fillNode.fills.length > 0) {
                const fills = [...fillNode.fills];
                const solidFillIndex = fills.findIndex((fill) => fill && fill.type === "SOLID" && fill.visible !== false && (!fill.boundVariables || !fill.boundVariables.color) && matchesTargetValue(fill, targetValue));
                if (solidFillIndex !== -1) {
                  const targetPaint = fills[solidFillIndex];
                  const alias = figma.variables.createVariableAlias(variable);
                  const nextBound = Object.assign(Object.assign({}, targetPaint.boundVariables || {}), { color: alias });
                  fills[solidFillIndex] = Object.assign(Object.assign({}, targetPaint), { boundVariables: nextBound });
                  try {
                    fillNode.fills = fills;
                  } catch (err) {
                    console.warn(`[BRIDGY] Failed to set fills on node ${fillNode.id}:`, err);
                    throw err;
                  }
                } else {
                  console.warn(`[BRIDGY] No suitable solid fill found to apply color`);
                }
              } else {
                console.warn(`[BRIDGY] Node has no fills`);
              }
            } else if (property === "Stroke Color") {
              const strokeNode = node;
              if ("strokes" in strokeNode && Array.isArray(strokeNode.strokes) && strokeNode.strokes.length > 0) {
                const strokes = [...strokeNode.strokes];
                const solidStrokeIndex = strokes.findIndex((stroke) => stroke && stroke.type === "SOLID" && stroke.visible !== false && (!stroke.boundVariables || !stroke.boundVariables.color) && matchesTargetValue(stroke, targetValue));
                if (solidStrokeIndex !== -1) {
                  const targetPaint = strokes[solidStrokeIndex];
                  const alias = figma.variables.createVariableAlias(variable);
                  const nextBound = Object.assign(Object.assign({}, targetPaint.boundVariables || {}), { color: alias });
                  strokes[solidStrokeIndex] = Object.assign(Object.assign({}, targetPaint), { boundVariables: nextBound });
                  try {
                    strokeNode.strokes = strokes;
                  } catch (err) {
                    console.warn(`[BRIDGY] Failed to set strokes on node ${strokeNode.id}:`, err);
                    throw err;
                  }
                } else {
                  console.warn(`[BRIDGY] No suitable solid stroke found to apply color`);
                }
              }
            } else {
              const bindableNode = node;
              if (typeof bindableNode.setBoundVariable === "function") {
                if (figmaProperty === "width" && "layoutSizingHorizontal" in bindableNode) {
                  if (bindableNode.layoutSizingHorizontal !== "FIXED") {
                    try {
                      bindableNode.layoutSizingHorizontal = "FIXED";
                    } catch (e) {
                      console.warn(`Could not set layoutSizingHorizontal to FIXED:`, e);
                    }
                  }
                }
                if (figmaProperty === "height" && "layoutSizingVertical" in bindableNode) {
                  if (bindableNode.layoutSizingVertical !== "FIXED") {
                    try {
                      bindableNode.layoutSizingVertical = "FIXED";
                    } catch (e) {
                      console.warn(`Could not set layoutSizingVertical to FIXED:`, e);
                    }
                  }
                }
                bindableNode.setBoundVariable(figmaProperty, variable);
              } else {
                console.warn(`[BRIDGY] Node ${node.name} has property ${figmaProperty} but NO setBoundVariable method`);
                return false;
              }
            }
            return true;
          } catch (error) {
            console.error(`Error applying variable to node ${node.name} (${node.id}):`, error);
            return false;
          }
        });
      }
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
            case "load-component-styles":
              if (!msg.componentId) {
                throw new Error(`Missing required component ID for loading styles`);
              }
              const targetComponent = componentService_1.ComponentService.getComponentById(msg.componentId);
              if (!targetComponent) {
                throw new Error(`Component with ID ${msg.componentId} not found`);
              }
              const { styles, textElements } = yield componentService_1.ComponentService.loadComponentDetails(msg.componentId);
              figma.ui.postMessage({
                type: "component-styles-loaded",
                componentId: msg.componentId,
                styles: styles || {},
                textElements: textElements || []
              });
              break;
            case "select-component":
              try {
                if (!msg.componentId) {
                  throw new Error(`Missing required component ID for selection`);
                }
                const nodeToSelect = yield figma.getNodeByIdAsync(msg.componentId);
                if (!nodeToSelect) {
                  throw new Error(`Component with ID ${msg.componentId} not found`);
                }
                const isSceneNode = nodeToSelect.type !== "DOCUMENT" && nodeToSelect.type !== "PAGE";
                if (!isSceneNode) {
                  throw new Error(`Node ${msg.componentId} is not a selectable scene node (type: ${nodeToSelect.type})`);
                }
                let currentNode = nodeToSelect;
                let containingPage = null;
                while (currentNode.parent) {
                  if (currentNode.parent.type === "PAGE") {
                    containingPage = currentNode.parent;
                    break;
                  }
                  currentNode = currentNode.parent;
                }
                const needsPageSwitch = containingPage && containingPage !== figma.currentPage;
                if (needsPageSwitch && containingPage) {
                  yield figma.setCurrentPageAsync(containingPage);
                }
                figma.currentPage.selection = [nodeToSelect];
                figma.viewport.scrollAndZoomIntoView([nodeToSelect]);
                figma.ui.postMessage({
                  type: "component-selected",
                  componentId: msg.componentId,
                  componentName: nodeToSelect.name,
                  pageName: (containingPage === null || containingPage === void 0 ? void 0 : containingPage.name) || "Unknown",
                  switchedPage: needsPageSwitch || false
                });
              } catch (error) {
                console.error("Backend: Error selecting component:", error);
                let errorPageName = "unknown page";
                try {
                  const errorNode = yield figma.getNodeByIdAsync(msg.componentId);
                  if (errorNode) {
                    let checkNode = errorNode;
                    while (checkNode.parent) {
                      if (checkNode.parent.type === "PAGE") {
                        errorPageName = checkNode.parent.name;
                        break;
                      }
                      checkNode = checkNode.parent;
                    }
                  }
                } catch (pageError) {
                }
                figma.ui.postMessage({
                  type: "component-selection-error",
                  componentId: msg.componentId,
                  message: error.message || "Failed to select component",
                  pageName: errorPageName
                });
              }
              break;
            case "save-git-settings":
              const gitService = gitServiceFactory_1.GitServiceFactory.getService(msg.provider || "gitlab");
              const gitSettings = {
                provider: msg.provider || "gitlab",
                baseUrl: msg.baseUrl,
                projectId: msg.projectId || "",
                token: msg.token,
                filePath: msg.filePath || "src/variables.css",
                strategy: msg.strategy || "merge-request",
                branchName: msg.branchName || "feature/variables",
                exportFormat: msg.exportFormat || "css",
                saveToken: msg.saveToken || false,
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
              };
              if (typeof gitService.saveSettings !== "function") {
                console.error("CRITICAL: gitService.saveSettings is not a function!", gitService);
                throw new Error(`Internal Error: Service for ${msg.provider} is not initialized correctly.`);
              }
              yield gitService.saveSettings(gitSettings, msg.shareWithTeam || false);
              figma.ui.postMessage({
                type: "git-settings-saved",
                success: true,
                sharedWithTeam: msg.shareWithTeam,
                savedAt: gitSettings.savedAt,
                savedBy: gitSettings.savedBy
              });
              break;
            case "save-gitlab-settings":
              yield gitlabService_1.GitLabService.saveSettings({
                gitlabUrl: msg.gitlabUrl,
                projectId: msg.projectId || "",
                gitlabToken: msg.gitlabToken,
                filePath: msg.filePath || "src/variables.css",
                strategy: msg.strategy || "merge-request",
                branchName: msg.branchName || "feature/variables",
                exportFormat: msg.exportFormat || "css",
                saveToken: msg.saveToken || false,
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
              }, msg.shareWithTeam || false);
              figma.ui.postMessage({
                type: "gitlab-settings-saved",
                success: true,
                sharedWithTeam: msg.shareWithTeam,
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                // We need to match what was saved
                savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
              });
              break;
            case "list-repositories":
              try {
                const listService = gitServiceFactory_1.GitServiceFactory.getService(msg.provider || "gitlab");
                const tempSettings = {
                  provider: msg.provider || "gitlab",
                  baseUrl: "",
                  projectId: "",
                  token: msg.token,
                  filePath: "",
                  saveToken: false,
                  savedAt: "",
                  savedBy: ""
                };
                const repositories = yield listService.listRepositories(tempSettings);
                figma.ui.postMessage({
                  type: "repositories-loaded",
                  repositories
                });
              } catch (error) {
                figma.ui.postMessage({
                  type: "repositories-error",
                  error: error.message || "Failed to load repositories"
                });
              }
              break;
            case "list-branches":
              try {
                if (msg.provider !== "github") {
                  throw new Error("Branch listing is currently only supported for GitHub repositories");
                }
                const { GitHubService } = yield Promise.resolve().then(() => __importStar(require_githubService()));
                const githubService = new GitHubService();
                const branchSettings = {
                  provider: "github",
                  baseUrl: "",
                  projectId: msg.projectId || "",
                  token: msg.token,
                  filePath: "",
                  saveToken: false,
                  savedAt: "",
                  savedBy: ""
                };
                const branches = yield githubService.listBranches(branchSettings);
                figma.ui.postMessage({
                  type: "branches-loaded",
                  branches
                });
              } catch (error) {
                figma.ui.postMessage({
                  type: "branches-error",
                  error: error.message || "Failed to load branches"
                });
              }
              break;
            case "check-oauth-status":
              try {
                const { OAuthService } = yield Promise.resolve().then(() => __importStar(require_oauthService()));
                const status = OAuthService.getOAuthStatus();
                figma.ui.postMessage({
                  type: "oauth-status",
                  status
                });
              } catch (error) {
                console.error("Error checking OAuth status:", error);
                figma.ui.postMessage({
                  type: "oauth-status",
                  status: {
                    available: false,
                    configured: false,
                    message: "OAuth service unavailable"
                  }
                });
              }
              break;
            case "get-component-usage":
              try {
                console.log("Counting component usage...");
                const usageMap = {};
                yield figma.loadAllPagesAsync();
                const localDefinitions = /* @__PURE__ */ new Map();
                const variantToSetId = /* @__PURE__ */ new Map();
                const localNodes = [];
                const allInstances = [];
                for (const page of figma.root.children) {
                  if (msg.pageIds && msg.pageIds.length > 0 && msg.pageIds.indexOf(page.id) === -1) {
                    continue;
                  }
                  const pageDefs = page.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });
                  localNodes.push(...pageDefs);
                  const pageInstances = page.findAllWithCriteria({ types: ["INSTANCE"] });
                  allInstances.push(...pageInstances);
                }
                for (const node of localNodes) {
                  if (node.type === "COMPONENT_SET") {
                    localDefinitions.set(node.id, {
                      node,
                      name: node.name,
                      isSet: true,
                      instances: []
                    });
                    for (const child of node.children) {
                      if (child.type === "COMPONENT") {
                        variantToSetId.set(child.id, node.id);
                      }
                    }
                  } else if (node.type === "COMPONENT") {
                    if (!node.parent || node.parent.type !== "COMPONENT_SET") {
                      localDefinitions.set(node.id, {
                        node,
                        name: node.name,
                        isSet: false,
                        instances: []
                      });
                    }
                  }
                }
                console.log(`Analyzing ${allInstances.length} instances against ${localDefinitions.size} local definitions...`);
                for (const instance of allInstances) {
                  let mainId;
                  try {
                    const mainComponent = yield instance.getMainComponentAsync();
                    if (mainComponent) {
                      mainId = mainComponent.id;
                    }
                  } catch (e) {
                  }
                  if (!mainId)
                    continue;
                  let targetId = mainId;
                  if (variantToSetId.has(mainId)) {
                    targetId = variantToSetId.get(mainId);
                  }
                  if (localDefinitions.has(targetId)) {
                    const def = localDefinitions.get(targetId);
                    let parentName = "Page";
                    if (instance.parent) {
                      parentName = instance.parent.name;
                    }
                    def.instances.push({
                      id: instance.id,
                      name: instance.name,
                      // Instance name might differ from component name
                      parentName
                    });
                  }
                }
                const statsData = Array.from(localDefinitions.values()).map((def) => ({
                  id: def.node.id,
                  name: def.name,
                  type: def.isSet ? "COMPONENT_SET" : "COMPONENT",
                  count: def.instances.length,
                  variantCount: def.isSet ? def.node.children.length : 1,
                  instances: def.instances
                })).sort((a, b) => b.count - a.count);
                console.log(`Stats generated. Found ${statsData.length} definitions.`);
                figma.ui.postMessage({
                  type: "component-stats-data",
                  stats: statsData
                });
              } catch (err) {
                console.error("Error generating stats:", err);
                figma.ui.postMessage({
                  type: "component-stats-error",
                  error: err.message
                });
              }
              break;
            case "analyze-component-hygiene":
              try {
                console.log("Analyzing component hygiene...");
                yield figma.loadAllPagesAsync();
                const localDefinitions = /* @__PURE__ */ new Map();
                const variantToSetId = /* @__PURE__ */ new Map();
                const localNodes = [];
                const allInstances = [];
                for (const page of figma.root.children) {
                  if (msg.pageIds && msg.pageIds.length > 0 && msg.pageIds.indexOf(page.id) === -1) {
                    continue;
                  }
                  const pageDefs = page.findAllWithCriteria({ types: ["COMPONENT", "COMPONENT_SET"] });
                  localNodes.push(...pageDefs);
                }
                for (const page of figma.root.children) {
                  const pageInstances = page.findAllWithCriteria({ types: ["INSTANCE"] });
                  allInstances.push(...pageInstances);
                }
                const variantUsage = /* @__PURE__ */ new Map();
                for (const node of localNodes) {
                  if (node.type === "COMPONENT_SET") {
                    localDefinitions.set(node.id, {
                      node,
                      name: node.name,
                      isSet: true,
                      instances: []
                    });
                    for (const child of node.children) {
                      if (child.type === "COMPONENT") {
                        variantToSetId.set(child.id, node.id);
                        variantUsage.set(child.id, {
                          name: child.name,
                          parentId: node.id,
                          instances: []
                        });
                      }
                    }
                  } else if (node.type === "COMPONENT") {
                    if (!node.parent || node.parent.type !== "COMPONENT_SET") {
                      localDefinitions.set(node.id, {
                        node,
                        name: node.name,
                        isSet: false,
                        instances: []
                      });
                    }
                  }
                }
                for (const instance of allInstances) {
                  let mainId;
                  try {
                    const mainComponent = yield instance.getMainComponentAsync();
                    if (mainComponent) {
                      mainId = mainComponent.id;
                    }
                  } catch (e) {
                    console.warn(`Unable to resolve main component for instance ${instance.id}:`, e);
                  }
                  if (!mainId)
                    continue;
                  if (variantUsage.has(mainId)) {
                    const variantInfo = variantUsage.get(mainId);
                    variantInfo.instances.push({ id: instance.id });
                  }
                  let targetId = mainId;
                  if (variantToSetId.has(mainId)) {
                    targetId = variantToSetId.get(mainId);
                  }
                  if (localDefinitions.has(targetId)) {
                    const def = localDefinitions.get(targetId);
                    def.instances.push({ id: instance.id });
                  }
                }
                const unusedComponents = [];
                console.log(`DEBUG: Analysis Scope: ${localDefinitions.size} definitions, ${allInstances.length} instances.`);
                console.log(`DEBUG: Variant Usage Map size: ${variantUsage.size}`);
                for (const [id, def] of localDefinitions.entries()) {
                  if (def.isSet) {
                    const componentSet = def.node;
                    const variants = componentSet.children.filter((child) => child.type === "COMPONENT");
                    const unusedVariants = [];
                    const totalVariants = variants.length;
                    let unusedVariantCount = 0;
                    for (const variant of variants) {
                      const variantInfo = variantUsage.get(variant.id);
                      if (variantInfo && variantInfo.instances.length === 0) {
                        unusedVariantCount++;
                        unusedVariants.push({
                          id: variant.id,
                          name: variant.name
                        });
                      }
                    }
                    if (unusedVariantCount > 0) {
                      unusedComponents.push({
                        id: componentSet.id,
                        name: componentSet.name,
                        type: "COMPONENT_SET",
                        totalVariants,
                        unusedVariantCount,
                        isFullyUnused: unusedVariantCount === totalVariants,
                        unusedVariants
                      });
                    }
                  } else {
                    if (def.instances.length === 0) {
                      unusedComponents.push({
                        id: def.node.id,
                        name: def.name,
                        type: "COMPONENT",
                        isFullyUnused: true
                      });
                    }
                  }
                }
                const totalComponents = localDefinitions.size;
                const unusedCount = unusedComponents.length;
                let totalDeletableUnits = 0;
                let unusedDeletableUnits = 0;
                for (const [id, def] of localDefinitions.entries()) {
                  if (def.isSet) {
                    const set = def.node;
                    const variantCount = set.children.filter((c) => c.type === "COMPONENT").length;
                    totalDeletableUnits += variantCount;
                  } else {
                    totalDeletableUnits += 1;
                  }
                }
                for (const comp of unusedComponents) {
                  if (comp.type === "COMPONENT_SET") {
                    unusedDeletableUnits += comp.unusedVariantCount || 0;
                  } else {
                    unusedDeletableUnits += 1;
                  }
                }
                const hygieneScore = totalDeletableUnits === 0 ? 100 : Math.round((totalDeletableUnits - unusedDeletableUnits) / totalDeletableUnits * 100);
                console.log(`Component hygiene analysis complete. Found ${unusedDeletableUnits} unused deletable units out of ${totalDeletableUnits} total.`);
                if (unusedCount === 0 && totalComponents > 0) {
                  console.log("DEBUG: 0 unused found. Dumping sample defs to check consistency:");
                  let i = 0;
                  for (const [id, def] of localDefinitions.entries()) {
                    if (i++ > 5)
                      break;
                    console.log(`Def ${def.name} (${def.node.type}): instances=${def.instances.length}`);
                    if (def.isSet) {
                      const set = def.node;
                      console.log(` - Variants: ${set.children.length}`);
                    }
                  }
                }
                figma.ui.postMessage({
                  type: "component-hygiene-result",
                  result: {
                    totalComponents,
                    totalDeletableUnits,
                    unusedComponents,
                    unusedCount,
                    unusedDeletableUnits,
                    hygieneScore,
                    subScores: { componentHygiene: hygieneScore }
                  }
                });
              } catch (err) {
                console.error("Error analyzing component hygiene:", err);
                figma.ui.postMessage({
                  type: "component-hygiene-error",
                  error: err.message
                });
              }
              break;
            case "analyze-variable-hygiene":
              try {
                console.log("Analyzing variable hygiene...");
                const allVariables = yield figma.variables.getLocalVariablesAsync();
                console.log(`Found ${allVariables.length} local variables`);
                if (allVariables.length === 0) {
                  figma.ui.postMessage({
                    type: "variable-hygiene-result",
                    result: {
                      totalVariables: 0,
                      unusedVariables: [],
                      unusedCount: 0,
                      hygieneScore: 100
                    },
                    subScores: { variableHygiene: 100 }
                  });
                  break;
                }
                const variableUsage = /* @__PURE__ */ new Map();
                for (const variable of allVariables) {
                  variableUsage.set(variable.id, {
                    variable,
                    usedBy: /* @__PURE__ */ new Set()
                  });
                }
                for (const variable of allVariables) {
                  for (const modeId of Object.keys(variable.valuesByMode)) {
                    const value = variable.valuesByMode[modeId];
                    if (value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
                      const aliasedVarId = value.id;
                      if (variableUsage.has(aliasedVarId)) {
                        variableUsage.get(aliasedVarId).usedBy.add(variable.id);
                      }
                    }
                  }
                }
                yield figma.loadAllPagesAsync();
                for (const page of figma.root.children) {
                  const allNodes = page.findAll();
                  for (const node of allNodes) {
                    try {
                      if ("boundVariables" in node && node.boundVariables) {
                        const boundVars = node.boundVariables;
                        for (const propKey of Object.keys(boundVars)) {
                          const binding = boundVars[propKey];
                          if (binding && typeof binding === "object") {
                            if ("id" in binding) {
                              const varId = binding.id;
                              if (variableUsage.has(varId)) {
                                variableUsage.get(varId).usedBy.add(node.id);
                              }
                            } else if (Array.isArray(binding)) {
                              for (const item of binding) {
                                if (item && typeof item === "object" && "id" in item) {
                                  const varId = item.id;
                                  if (variableUsage.has(varId)) {
                                    variableUsage.get(varId).usedBy.add(node.id);
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    } catch (nodeError) {
                      console.warn(`Could not check variable bindings for node ${node.id}:`, nodeError);
                    }
                  }
                }
                const unusedVariables = [];
                for (const [varId, usage] of variableUsage.entries()) {
                  if (usage.usedBy.size === 0) {
                    const variable = usage.variable;
                    const collection = yield figma.variables.getVariableCollectionByIdAsync(variable.variableCollectionId);
                    const modeId = (collection === null || collection === void 0 ? void 0 : collection.defaultModeId) || Object.keys(variable.valuesByMode)[0];
                    const varValue = variable.valuesByMode[modeId];
                    let resolvedValue = "";
                    if (variable.resolvedType === "COLOR" && typeof varValue === "object" && "r" in varValue) {
                      const color = varValue;
                      resolvedValue = `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
                    } else if (variable.resolvedType === "FLOAT") {
                      resolvedValue = String(varValue);
                    }
                    unusedVariables.push({
                      id: variable.id,
                      name: variable.name,
                      collectionId: variable.variableCollectionId,
                      collectionName: (collection === null || collection === void 0 ? void 0 : collection.name) || "Unknown Collection",
                      resolvedType: variable.resolvedType,
                      resolvedValue,
                      scopes: variable.scopes
                    });
                  }
                }
                const totalVariables = allVariables.length;
                const unusedCount = unusedVariables.length;
                const hygieneScore = totalVariables === 0 ? 100 : Math.round((totalVariables - unusedCount) / totalVariables * 100);
                console.log(`Variable hygiene analysis complete. Found ${unusedCount} unused variables out of ${totalVariables} total.`);
                figma.ui.postMessage({
                  type: "variable-hygiene-result",
                  result: {
                    totalVariables,
                    unusedVariables,
                    unusedCount,
                    hygieneScore,
                    subScores: { variableHygiene: hygieneScore }
                  }
                });
              } catch (err) {
                console.error("Error analyzing variable hygiene:", err);
                figma.ui.postMessage({
                  type: "variable-hygiene-error",
                  error: err.message
                });
              }
              break;
            case "delete-component":
              try {
                if (!msg.componentId) {
                  throw new Error("Component ID is required for deletion");
                }
                const componentNode = yield figma.getNodeByIdAsync(msg.componentId);
                if (!componentNode) {
                  throw new Error("Component not found");
                }
                const componentType = msg.componentType || "component";
                const componentName = componentNode.name;
                let deletedType = "";
                if (componentType === "set") {
                  if (componentNode.type !== "COMPONENT_SET") {
                    throw new Error("Node is not a component set");
                  }
                  deletedType = "component set";
                  componentNode.remove();
                } else if (componentType === "variant") {
                  if (componentNode.type !== "COMPONENT") {
                    throw new Error("Node is not a component variant");
                  }
                  const parent = componentNode.parent;
                  if (!parent || parent.type !== "COMPONENT_SET") {
                    throw new Error("Component is not part of a component set");
                  }
                  const parentId = parent.id;
                  const remainingVariants = parent.children.filter((child) => child.type === "COMPONENT" && child.id !== componentNode.id);
                  if (remainingVariants.length === 0) {
                    throw new Error("Cannot delete the last variant. Delete the entire component set instead.");
                  }
                  deletedType = "variant";
                  componentNode.remove();
                  figma.ui.postMessage({
                    type: "component-deleted",
                    componentId: msg.componentId,
                    parentId,
                    componentName,
                    componentType: deletedType
                  });
                  return;
                } else {
                  if (componentNode.type !== "COMPONENT" && componentNode.type !== "COMPONENT_SET") {
                    throw new Error("Node is not a component");
                  }
                  deletedType = "component";
                  componentNode.remove();
                }
                console.log(`Successfully deleted ${deletedType}: ${componentName} (${msg.componentId})`);
                figma.ui.postMessage({
                  type: "component-deleted",
                  componentId: msg.componentId,
                  componentName,
                  componentType: deletedType
                });
              } catch (deleteError) {
                console.error("Error deleting component:", deleteError);
                figma.ui.postMessage({
                  type: "delete-component-error",
                  error: deleteError.message || "Failed to delete component"
                });
              }
              break;
            case "delete-all-unused-variants":
              try {
                if (!msg.variantIds || !Array.isArray(msg.variantIds) || msg.variantIds.length === 0) {
                  throw new Error("Variant IDs are required for batch deletion");
                }
                const deletionResults = [];
                let successCount = 0;
                let failCount = 0;
                for (const variantId of msg.variantIds) {
                  try {
                    const variantNode = yield figma.getNodeByIdAsync(variantId);
                    if (!variantNode || variantNode.type !== "COMPONENT") {
                      console.warn(`Variant ${variantId} not found or not a component`);
                      failCount++;
                      continue;
                    }
                    const variantName = variantNode.name;
                    variantNode.remove();
                    deletionResults.push({ id: variantId, name: variantName, success: true });
                    successCount++;
                  } catch (error) {
                    console.error(`Error deleting variant ${variantId}:`, error);
                    deletionResults.push({ id: variantId, success: false, error: error.message });
                    failCount++;
                  }
                }
                console.log(`Batch deletion complete: ${successCount} succeeded, ${failCount} failed`);
                figma.ui.postMessage({
                  type: "batch-variants-deleted",
                  results: deletionResults,
                  successCount,
                  failCount,
                  componentId: msg.componentId,
                  // Include componentId to help UI update
                  deletedAll: successCount === msg.variantIds.length
                  // True if all variants were successfully deleted
                });
              } catch (batchDeleteError) {
                console.error("Error in batch variant deletion:", batchDeleteError);
                figma.ui.postMessage({
                  type: "delete-component-error",
                  error: batchDeleteError.message || "Failed to delete variants"
                });
              }
              break;
            case "delete-variable":
              try {
                if (!msg.variableId) {
                  throw new Error("Variable ID is required for deletion");
                }
                const variable = yield figma.variables.getVariableByIdAsync(msg.variableId);
                if (!variable) {
                  throw new Error("Variable not found");
                }
                const variableName = variable.name;
                const variableType = variable.resolvedType;
                variable.remove();
                console.log(`Successfully deleted variable: ${variableName} (${msg.variableId})`);
                figma.ui.postMessage({
                  type: "variable-deleted",
                  variableId: msg.variableId,
                  variableName,
                  variableType
                });
              } catch (deleteError) {
                console.error("Error deleting variable:", deleteError);
                figma.ui.postMessage({
                  type: "delete-variable-error",
                  error: deleteError.message || "Failed to delete variable"
                });
              }
              break;
            case "start-oauth-flow":
              try {
                const { OAuthService } = yield Promise.resolve().then(() => __importStar(require_oauthService()));
                if (!OAuthService.isOAuthConfigured()) {
                  throw new Error("OAuth is not configured. Please use Personal Access Token method.");
                }
                const oauthUrl = OAuthService.generateGitHubOAuthUrl();
                figma.ui.postMessage({
                  type: "oauth-url",
                  url: oauthUrl
                });
              } catch (error) {
                figma.ui.postMessage({
                  type: "oauth-callback",
                  data: {
                    success: false,
                    error: error.message || "Failed to start OAuth flow"
                  }
                });
              }
              break;
            case "open-external":
              try {
                if (!msg.url) {
                  throw new Error("URL is required for external opening");
                }
                figma.openExternal(msg.url);
                figma.ui.postMessage({
                  type: "external-url-opened",
                  success: true
                });
              } catch (error) {
                console.error("Error opening external URL:", error);
                figma.ui.postMessage({
                  type: "external-url-opened",
                  success: false,
                  error: error.message || "Failed to open external URL"
                });
              }
              break;
            case "commit-to-gitlab":
            case "commit-to-repo":
              const isLegacy = msg.type === "commit-to-gitlab";
              if (!msg.projectId || !msg.token && !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
                throw new Error("Missing required fields for commit");
              }
              try {
                const provider = msg.provider || "gitlab";
                const gitService2 = gitServiceFactory_1.GitServiceFactory.getService(provider);
                const settings = {
                  provider,
                  baseUrl: msg.baseUrl || msg.gitlabUrl || "",
                  projectId: msg.projectId,
                  token: msg.token || msg.gitlabToken,
                  // Accept either
                  filePath: msg.filePath || "src/variables.css",
                  strategy: "merge-request",
                  branchName: msg.branchName || "feature/variables",
                  exportFormat: "css",
                  saveToken: false,
                  savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                  savedBy: figma.currentUser && figma.currentUser.name ? figma.currentUser.name : "Unknown user"
                };
                const result = yield gitService2.commitWorkflow(settings, msg.commitMessage, msg.filePath || "src/variables.css", msg.cssData, msg.branchName || "feature/variables");
                figma.ui.postMessage({
                  type: "commit-success",
                  message: config_1.SUCCESS_MESSAGES.COMMIT_SUCCESS,
                  mergeRequestUrl: result && result.pullRequestUrl
                });
              } catch (error) {
                let errorMessage = "Unknown error occurred";
                let errorType = "unknown";
                if (error.name === "GitAuthError" || error.name === "GitLabAuthError") {
                  errorType = "auth";
                  errorMessage = "Authentication failed. Please check your token and permissions.";
                } else if (error.name === "GitNetworkError" || error.name === "GitLabNetworkError") {
                  errorType = "network";
                  errorMessage = "Network error. Please check your internet connection.";
                } else if (error.name === "GitServiceError" || error.name === "GitLabAPIError") {
                  if (error.statusCode === 401 || error.statusCode === 403) {
                    errorType = "auth";
                    errorMessage = "Authentication failed. Please check your token and permissions.";
                  } else {
                    errorType = "api";
                    if (error.statusCode === 404) {
                      errorMessage = "Project/Repository not found. Please check your ID.";
                    } else if (error.statusCode === 422) {
                      errorMessage = "Invalid data provided. Please check your settings.";
                    } else if (error.statusCode === 429) {
                      errorMessage = "Rate limit exceeded. Please try again later.";
                    } else {
                      errorMessage = error.message || "Git API error occurred.";
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
            case "validate-tailwind-v4":
              const twValidation = yield cssExportService_1.CSSExportService.getTailwindV4ValidationStatus();
              figma.ui.postMessage({
                type: "tailwind-v4-validation",
                validation: twValidation
              });
              break;
            case "resize-plugin":
              break;
            case "get-existing-collections":
              try {
                const existingCollections = yield figma.variables.getLocalVariableCollectionsAsync();
                const collectionsData = [];
                for (const collection of existingCollections) {
                  const variablesPromises = collection.variableIds.map((id) => __awaiter(void 0, void 0, void 0, function* () {
                    const variable = yield figma.variables.getVariableByIdAsync(id);
                    return variable ? { id: variable.id, name: variable.name, resolvedType: variable.resolvedType } : null;
                  }));
                  const variables = yield Promise.all(variablesPromises);
                  const validVariables = variables.filter((v) => v !== null);
                  collectionsData.push({
                    id: collection.id,
                    name: collection.name,
                    variables: validVariables
                  });
                }
                figma.ui.postMessage({
                  type: "existing-collections",
                  collections: collectionsData
                });
              } catch (error) {
                console.error("Error getting existing collections:", error);
                figma.ui.postMessage({
                  type: "existing-collections-error",
                  error: error.message || "Failed to load existing collections"
                });
              }
              break;
            case "preview-import":
              try {
                const content = msg.content;
                if (!content)
                  throw new Error("No content provided");
                const tokens = variableImportService_1.VariableImportService.parseCSS(content);
                const collections = yield figma.variables.getLocalVariableCollectionsAsync();
                const variableIds = collections.reduce((acc, c) => acc.concat(c.variableIds), []);
                const allVariables = yield Promise.all(variableIds.map((id) => figma.variables.getVariableByIdAsync(id)));
                const validVariables = allVariables.filter((v) => v !== null);
                const diff = variableImportService_1.VariableImportService.compareTokens(tokens, validVariables);
                figma.ui.postMessage({
                  type: "import-preview-ready",
                  diff,
                  totalFound: tokens.length
                });
              } catch (error) {
                figma.ui.postMessage({
                  type: "import-error",
                  message: error.message
                });
              }
              break;
            case "import-tokens":
              console.log("DEBUG: Received import-tokens message");
              console.log("DEBUG: Message content:", JSON.stringify(msg, null, 2));
              try {
                const importOptions = msg.options || {};
                const tokens = msg.tokens || [];
                console.log(`DEBUG: Received ${tokens.length} tokens to import`);
                console.log("DEBUG: Import options:", JSON.stringify(importOptions, null, 2));
                if (tokens.length > 0) {
                  console.log("DEBUG: Sample token:", JSON.stringify(tokens[0], null, 2));
                }
                const validTokens = tokens.map((t) => Object.assign(Object.assign({}, t), { originalLine: t.originalLine || "", lineNumber: t.lineNumber || 0 }));
                console.log("DEBUG: Calling VariableImportService.importVariables now...");
                const result = yield variableImportService_1.VariableImportService.importVariables(validTokens, {
                  collectionId: importOptions.collectionId,
                  collectionName: importOptions.collectionName,
                  strategy: importOptions.strategy || "merge",
                  organizeByCategories: importOptions.organizeByCategories
                });
                figma.ui.postMessage({
                  type: "import-complete",
                  result: {
                    importedCount: result.success,
                    success: result.success,
                    // Added for compatibility with UI
                    errors: result.errors,
                    collectionName: importOptions.collectionName,
                    groupsCreated: result.groupsCreated
                  }
                });
                try {
                  const refreshedData = yield collectDocumentData();
                  figma.ui.postMessage({
                    type: "refresh-success",
                    variables: refreshedData.variables,
                    styles: refreshedData.styles,
                    components: refreshedData.components,
                    message: "Tokens imported and data refreshed"
                  });
                } catch (refreshError) {
                  console.error("Auto-refresh failed:", refreshError);
                }
              } catch (error) {
                console.error("Import failed:", error);
                figma.ui.postMessage({
                  type: "import-error",
                  error: error.message
                });
              }
              break;
            // Old inline logic removed in favor of VariableImportService
            case "refresh-data":
              try {
                console.log("Refreshing document data...");
                const refreshedData = yield collectDocumentData();
                console.log("[DEBUG] refresh-data: Data collected, sending refresh-success");
                figma.ui.postMessage({
                  type: "refresh-success",
                  variables: refreshedData.variables,
                  styles: refreshedData.styles,
                  components: refreshedData.components,
                  message: "Data refreshed successfully"
                });
                console.log("[DEBUG] refresh-data: refresh-success message sent");
              } catch (refreshError) {
                console.error("Error refreshing data:", refreshError);
                figma.ui.postMessage({
                  type: "refresh-error",
                  error: refreshError.message || "Failed to refresh data"
                });
              }
              break;
            case "delete-style":
              try {
                const deleteStyleMsg = msg;
                if (!deleteStyleMsg.styleId || !deleteStyleMsg.styleType) {
                  throw new Error("Style ID and type are required for deletion");
                }
                let styleToDelete = null;
                const styleType = deleteStyleMsg.styleType;
                const styleId = deleteStyleMsg.styleId;
                if (styleType === "paint") {
                  styleToDelete = yield figma.getStyleByIdAsync(styleId);
                } else if (styleType === "text") {
                  styleToDelete = yield figma.getStyleByIdAsync(styleId);
                } else if (styleType === "effect") {
                  styleToDelete = yield figma.getStyleByIdAsync(styleId);
                } else if (styleType === "grid") {
                  styleToDelete = yield figma.getStyleByIdAsync(styleId);
                }
                if (!styleToDelete) {
                  throw new Error("Style not found");
                }
                const styleName = styleToDelete.name;
                styleToDelete.remove();
                console.log(`Successfully deleted style: ${styleName} (${styleId})`);
                figma.ui.postMessage({
                  type: "style-deleted",
                  styleId,
                  styleName
                });
                const refreshedData = yield collectDocumentData();
                figma.ui.postMessage({
                  type: "data-refreshed",
                  variables: refreshedData.variables,
                  components: refreshedData.components
                });
              } catch (deleteError) {
                console.error("Error deleting style:", deleteError);
                figma.ui.postMessage({
                  type: "delete-error",
                  error: deleteError.message || "Failed to delete style"
                });
              }
              break;
            case "analyze-token-coverage":
              try {
                const scope = msg.scope || "PAGE";
                console.log(`Analyzing token coverage (Scope: ${scope})...`);
                const settings = yield gitlabService_1.GitLabService.loadSettings();
                const exportFormat = msg.exportFormat || (settings === null || settings === void 0 ? void 0 : settings.exportFormat) || "css";
                let coverageResult;
                if (scope === "ALL") {
                  coverageResult = yield tokenCoverageService_1.TokenCoverageService.analyzeDocument(exportFormat, msg.pageIds);
                } else if (scope === "SMART_SCAN") {
                  coverageResult = yield tokenCoverageService_1.TokenCoverageService.analyzeSmart(exportFormat, msg.pageIds);
                } else if (scope === "SELECTION") {
                  console.log("Analyzing selection...");
                  coverageResult = yield tokenCoverageService_1.TokenCoverageService.analyzeSelection(exportFormat);
                } else {
                  coverageResult = yield tokenCoverageService_1.TokenCoverageService.analyzeCurrentPage(exportFormat);
                }
                console.log("[Plugin Debug] Analysis finished, result obtained. Posting message...");
                figma.ui.postMessage({
                  type: "token-coverage-result",
                  result: coverageResult
                });
                console.log("[Plugin Debug] Message posted successfully.");
              } catch (coverageError) {
                console.error("Error analyzing token coverage:", coverageError);
                figma.ui.postMessage({
                  type: "token-coverage-error",
                  error: coverageError.message || "Failed to analyze token coverage"
                });
              }
              break;
            case "get-pages":
              try {
                const pages = figma.root.children.map((page) => ({
                  id: page.id,
                  name: page.name
                }));
                figma.ui.postMessage({
                  type: "pages-list",
                  pages,
                  currentPageId: figma.currentPage.id
                });
              } catch (error) {
                console.error("Error fetching pages:", error);
              }
              break;
            case "set-client-storage":
              const storageMsg = msg;
              if (storageMsg.key) {
                yield figma.clientStorage.setAsync(storageMsg.key, storageMsg.value);
                console.log(`Backend: Saved ${storageMsg.key} to clientStorage`);
              }
              break;
            case "focus-node":
              try {
                const focusMsg = msg;
                if (focusMsg.nodeId) {
                  const node = yield figma.getNodeByIdAsync(focusMsg.nodeId);
                  if (node) {
                    if (node.parent && node.parent.type === "PAGE") {
                      if (figma.currentPage.id !== node.parent.id) {
                        yield figma.setCurrentPageAsync(node.parent);
                      }
                    } else {
                      let p = node.parent;
                      while (p && p.type !== "PAGE" && p.type !== "DOCUMENT") {
                        p = p.parent;
                      }
                      if (p && p.type === "PAGE" && figma.currentPage.id !== p.id) {
                        yield figma.setCurrentPageAsync(p);
                      }
                    }
                    figma.currentPage.selection = [node];
                    figma.viewport.scrollAndZoomIntoView([node]);
                    console.log(`Focused on node: ${node.name}`);
                  } else {
                    console.warn(`Node not found for focusing: ${focusMsg.nodeId}`);
                  }
                }
              } catch (focusError) {
                console.error("Error focusing node:", focusError);
              }
              break;
            case "create-variable":
              try {
                const { name, value, collectionName } = msg;
                if (!name || !value) {
                  throw new Error("Name and value are required");
                }
                console.log(`Creating variable: ${name} = ${value} in ${collectionName || "Primitives"}`);
                let resolvedValue = null;
                let resolvedType = "FLOAT";
                const colorMatch = value.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
                if (colorMatch) {
                  resolvedType = "COLOR";
                  resolvedValue = {
                    r: parseInt(colorMatch[1]) / 255,
                    g: parseInt(colorMatch[2]) / 255,
                    b: parseInt(colorMatch[3]) / 255
                  };
                } else {
                  const floatMatch = value.match(/^([\d.]+)/);
                  if (floatMatch) {
                    resolvedType = "FLOAT";
                    resolvedValue = parseFloat(floatMatch[1]);
                  }
                }
                if (resolvedValue === null) {
                  throw new Error(`Could not parse value: ${value}`);
                }
                const targetCollectionName = collectionName || "Primitives";
                console.log(`DEBUG: Finding collection '${targetCollectionName}'...`);
                const collections = yield figma.variables.getLocalVariableCollectionsAsync();
                let collection = collections.find((c) => c.name === targetCollectionName);
                if (!collection) {
                  console.log(`DEBUG: Creating new collection '${targetCollectionName}'...`);
                  try {
                    collection = figma.variables.createVariableCollection(targetCollectionName);
                    console.log("DEBUG: Collection created:", collection ? collection.id : "null");
                  } catch (colError) {
                    console.error("DEBUG: Failed to create collection:", colError);
                    throw colError;
                  }
                } else {
                  console.log(`DEBUG: Found existing collection: ${collection.id}`);
                }
                if (!collection || !collection.id) {
                  throw new Error("Failed to resolve valid collection");
                }
                console.log(`DEBUG: Executing createVariable('${name}', collection object, '${resolvedType}')`);
                let variable;
                try {
                  variable = figma.variables.createVariable(name, collection, resolvedType);
                } catch (err) {
                  console.error("createVariable failed:", err);
                  throw err;
                }
                if (!variable)
                  throw new Error("Variable creation returned undefined");
                console.log("DEBUG: Variable created successfully:", variable.id);
                const modeId = collection.defaultModeId;
                variable.setValueForMode(modeId, resolvedValue);
                figma.notify(`Created variable ${variable.name}`);
                figma.ui.postMessage({
                  type: "variable-created",
                  variable: {
                    id: variable.id,
                    name: variable.name,
                    key: variable.key,
                    valuesByMode: variable.valuesByMode,
                    collectionName: collection.name,
                    resolvedValue: value
                  },
                  context: msg.context
                });
              } catch (createError) {
                console.error("Error creating variable:", createError);
                figma.ui.postMessage({
                  type: "create-variable-error",
                  error: createError.message
                });
                figma.notify(`Failed to create variable: ${createError.message}`, { error: true });
              }
              break;
            case "rename-variable-group":
              try {
                const { oldGroupName, newGroupName, action, variableId } = msg;
                if (!newGroupName) {
                  throw new Error("New group name is required");
                }
                const renameAction = action || "replace";
                console.log(`Renaming variable group: ${oldGroupName || "standalone"} \u2192 ${newGroupName} (action: ${renameAction})`);
                const collections = yield figma.variables.getLocalVariableCollectionsAsync();
                let renamedCount = 0;
                if (variableId) {
                  const variable = yield figma.variables.getVariableByIdAsync(variableId);
                  if (!variable) {
                    throw new Error(`Variable with ID ${variableId} not found`);
                  }
                  const oldName = variable.name;
                  const newName = `${newGroupName}/${variable.name}`;
                  try {
                    variable.name = newName;
                    renamedCount = 1;
                    console.log(`Renamed: ${oldName} \u2192 ${newName}`);
                  } catch (renameError) {
                    console.error(`Failed to rename variable ${oldName}:`, renameError);
                    throw renameError;
                  }
                } else {
                  for (const collection of collections) {
                    for (const collectionVariableId of collection.variableIds) {
                      const variable = yield figma.variables.getVariableByIdAsync(collectionVariableId);
                      if (!variable)
                        continue;
                      let newName = null;
                      const oldName = variable.name;
                      const pathMatch = variable.name.match(/^([^\/]+)\/(.*)/);
                      if (pathMatch && pathMatch[1] === oldGroupName) {
                        const currentGroup = pathMatch[1];
                        const remainder = pathMatch[2];
                        if (renameAction === "add-prefix") {
                          newName = `${newGroupName}/${currentGroup}/${remainder}`;
                        } else {
                          newName = `${newGroupName}/${remainder}`;
                        }
                      }
                      if (newName) {
                        try {
                          variable.name = newName;
                          renamedCount++;
                          console.log(`Renamed: ${oldName} \u2192 ${newName}`);
                        } catch (renameError) {
                          console.error(`Failed to rename variable ${oldName}:`, renameError);
                        }
                      }
                    }
                  }
                }
                if (renamedCount === 0) {
                  throw new Error(`No variables found matching the criteria`);
                }
                const validation = yield cssExportService_1.CSSExportService.getTailwindV4ValidationStatus();
                figma.ui.postMessage({
                  type: "tailwind-v4-validation",
                  validation
                });
                const actionLabel = renameAction === "add-prefix" ? "prefixed with" : "renamed to";
                figma.notify(`${renamedCount} variable${renamedCount !== 1 ? "s" : ""} ${actionLabel} "${newGroupName}"`);
                figma.ui.postMessage({
                  type: "variable-group-renamed",
                  success: true,
                  oldGroupName,
                  newGroupName,
                  renamedCount,
                  action: renameAction
                });
              } catch (renameError) {
                console.error("Error renaming variable group:", renameError);
                figma.ui.postMessage({
                  type: "variable-group-rename-error",
                  error: renameError.message
                });
                figma.notify(`Failed to rename variable group: ${renameError.message}`, { error: true });
              }
              break;
            case "apply-token-to-nodes":
              try {
                const applyMsg = msg;
                const { nodeIds, variableId, property, category, targetValue } = applyMsg;
                if (!nodeIds || !variableId || !property || !category) {
                  throw new Error("Missing required parameters for applying token");
                }
                console.log(`Applying token: ${variableId} to ${nodeIds.length} nodes (Property: ${property})`);
                const variable = yield figma.variables.getVariableByIdAsync(variableId);
                if (!variable) {
                  throw new Error("Variable not found");
                }
                let successCount = 0;
                let failCount = 0;
                const errors = [];
                for (const nodeId of nodeIds) {
                  try {
                    const node = yield figma.getNodeByIdAsync(nodeId);
                    if (!node) {
                      console.warn(`Node not found: ${nodeId}`);
                      failCount++;
                      errors.push(`Node ${nodeId}: Not found`);
                      continue;
                    }
                    if (node.type === "DOCUMENT" || node.type === "PAGE") {
                      console.warn(`Cannot apply variable to ${node.type}: ${nodeId}`);
                      failCount++;
                      errors.push(`Node ${nodeId}: Invalid type ${node.type}`);
                      continue;
                    }
                    const applied = yield applyVariableToNode(node, variable, property, category, targetValue);
                    if (applied) {
                      successCount++;
                    } else {
                      failCount++;
                      errors.push(`Node ${nodeId}: Apply returned false`);
                    }
                  } catch (nodeError) {
                    console.error(`Error applying variable to node ${nodeId}:`, nodeError);
                    failCount++;
                    errors.push(`Node ${nodeId}: ${nodeError.message}`);
                  }
                }
                console.log(`Apply token result: ${successCount} success, ${failCount} failed`);
                if (errors.length > 0) {
                  console.log("Sample errors:", errors.slice(0, 5));
                }
                figma.ui.postMessage({
                  type: "apply-token-result",
                  success: true,
                  // Completed attempts
                  successCount,
                  failCount,
                  errors
                });
                let refreshTimeout;
                if (figma.variables && typeof figma.variables.on === "function") {
                  figma.variables.on("change", (event) => {
                    console.log("Variable change detected in Figma:", event);
                    if (refreshTimeout) {
                      clearTimeout(refreshTimeout);
                    }
                    refreshTimeout = setTimeout(() => {
                      console.log("Triggering auto-refresh due to variable changes...");
                      collectDocumentData().then((refreshedData) => {
                        figma.ui.postMessage({
                          type: "refresh-success",
                          variables: refreshedData.variables,
                          styles: refreshedData.styles,
                          components: refreshedData.components,
                          message: "Auto-refreshed from Figma changes"
                        });
                      });
                    }, 1e3);
                  });
                }
                if (successCount > 0) {
                  figma.notify(`\u2713 Applied token to ${successCount} node${successCount !== 1 ? "s" : ""}`);
                }
                if (failCount > 0) {
                  figma.notify(`\u26A0 Failed to apply token to ${failCount} node${failCount !== 1 ? "s" : ""}`, { error: true });
                }
              } catch (applyError) {
                console.error("Error applying token:", applyError);
                figma.ui.postMessage({
                  type: "apply-token-result",
                  success: false,
                  error: applyError.message || "Failed to apply token"
                });
                figma.notify(`\u2717 Error: ${applyError.message || "Failed to apply token"}`, {
                  error: true
                });
              }
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
