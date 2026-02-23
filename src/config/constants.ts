import { EnvironmentManager } from './environments';

// API and Network Configuration
export const API_CONFIG = {
  DEFAULT_GITLAB_URL: 'https://gitlab.com', // Default to GitLab.com
  DEFAULT_GITLAB_BASE_URL: 'https://gitlab.com/api/v4', // Default API URL
  REQUEST_TIMEOUT: 30000,
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
} as const;

// Helper function to build GitLab API URL from base GitLab URL
export const buildGitLabApiUrl = async (gitlabUrl?: string): Promise<string> => {
  if (!gitlabUrl) return API_CONFIG.DEFAULT_GITLAB_BASE_URL;

  // Try to get environment configuration
  const environment = await EnvironmentManager.getEnvironmentForUrl(gitlabUrl);
  const baseUrl = environment?.gitlabBaseUrl || gitlabUrl;

  // Remove trailing slash if present
  const cleanUrl = baseUrl.replace(/\/+$/, '');

  // Add /api/v4 if not already present
  if (cleanUrl.endsWith('/api/v4')) {
    return cleanUrl;
  }

  return `${cleanUrl}/api/v4`;
};

// Synchronous version for backward compatibility
export const buildGitLabApiUrlSync = (gitlabUrl?: string): string => {
  // Use default if URL is not provided or is empty string
  if (!gitlabUrl || gitlabUrl.trim() === '') return API_CONFIG.DEFAULT_GITLAB_BASE_URL;

  // Remove trailing slash if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '');

  // Add /api/v4 if not already present
  if (cleanUrl.endsWith('/api/v4')) {
    return cleanUrl;
  }

  return `${cleanUrl}/api/v4`;
};

// Helper function to build GitLab web URL from API URL or base URL
export const buildGitLabWebUrl = async (gitlabUrl?: string): Promise<string> => {
  if (!gitlabUrl) return API_CONFIG.DEFAULT_GITLAB_URL;

  // Try to get environment configuration
  const environment = await EnvironmentManager.getEnvironmentForUrl(gitlabUrl);
  const baseUrl = environment?.gitlabBaseUrl || gitlabUrl;

  // Remove trailing slash and /api/v4 if present
  const cleanUrl = baseUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');

  return cleanUrl;
};

// Synchronous version for backward compatibility
export const buildGitLabWebUrlSync = (gitlabUrl?: string): string => {
  // Use default if URL is not provided or is empty string
  if (!gitlabUrl || gitlabUrl.trim() === '') return API_CONFIG.DEFAULT_GITLAB_URL;

  // Remove trailing slash and /api/v4 if present
  const cleanUrl = gitlabUrl.replace(/\/+$/, '').replace(/\/api\/v4$/, '');

  return cleanUrl;
};

// Git Configuration
export const GIT_CONFIG = {
  DEFAULT_BRANCH: 'feature/variables',
  DEFAULT_COMMIT_PATTERNS: {
    variables: 'Update CSS variables from Figma',
  },
} as const;
