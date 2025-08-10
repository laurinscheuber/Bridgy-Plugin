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