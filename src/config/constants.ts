// API and Network Configuration
export const API_CONFIG = {
  GITLAB_BASE_URL: "https://gitlab.fhnw.ch/api/v4",
  REQUEST_TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

// Git Configuration
export const GIT_CONFIG = {
  DEFAULT_BRANCH: "feature/variables",
  DEFAULT_TEST_BRANCH: "feature/component-tests",
  DEFAULT_COMMIT_PATTERNS: {
    variables: "Update CSS variables from Figma",
    tests: "Add component test for {componentName}"
  }
} as const;

// File Paths and Storage
export const FILE_PATHS = {
  DEFAULT_CSS_PATH: "src/variables.css",
  DEFAULT_TEST_PATH: "components/{componentName}.spec.ts",
  STORAGE_KEY_PATTERNS: {
    gitlab: "gitlab-settings-{fileId}",
    units: "unit-settings-{fileId}",
    meta: "{key}-meta",
    token: "{key}-token"
  }
} as const;

// Plugin Configuration
export const PLUGIN_CONFIG = {
  NAME: "DesignSync",
  UI_WIDTH: 850,
  UI_HEIGHT: 800,
  SUPPORTED_FORMATS: ['css', 'scss'] as const
} as const;

// Numeric Constants
export const NUMERIC_CONSTANTS = {
  RGB_MULTIPLIER: 255,
  ALPHA_PRECISION: 2,
  DEFAULT_TIMEOUT: 30000,
  MAX_RETRIES: 3
} as const;