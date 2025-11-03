// API and Network Configuration
export const API_CONFIG = {
  DEFAULT_GITLAB_URL: "https://gitlab.com", // Default to GitLab.com
  DEFAULT_GITLAB_BASE_URL: "https://gitlab.com/api/v4", // Default API URL
  REQUEST_TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const;

// Helper function to build GitLab API URL from base GitLab URL
export const buildGitLabApiUrl = (gitlabUrl?: string): string => {
  if (!gitlabUrl) return API_CONFIG.DEFAULT_GITLAB_BASE_URL;
  
  // Remove trailing slash if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '');
  
  // Add /api/v4 if not already present
  if (cleanUrl.endsWith('/api/v4')) {
    return cleanUrl;
  }
  
  return `${cleanUrl}/api/v4`;
};

// Helper function to build GitLab web URL from API URL or base URL
export const buildGitLabWebUrl = (gitlabUrl?: string): string => {
  if (!gitlabUrl) return API_CONFIG.DEFAULT_GITLAB_URL;
  
  // Remove trailing slash and /api/v4 if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');
  
  return cleanUrl;
};

// Git Configuration
export const GIT_CONFIG = {
  DEFAULT_BRANCH: "feature/variables",
  DEFAULT_TEST_BRANCH: "feature/component-tests",
  DEFAULT_COMMIT_PATTERNS: {
    variables: "Update CSS variables from Figma",
    tests: "Add component test for {componentName}"
  }
} as const;