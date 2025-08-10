// Error Messages
export const ERROR_MESSAGES = {
  // General validation errors
  INVALID_SETTINGS: 'Invalid settings provided',
  MISSING_COMPONENT: 'Component with ID {id} not found',
  MISSING_FIELDS: 'Missing required fields for {action}',
  
  // GitLab specific errors
  GITLAB_AUTH: 'GitLab authentication failed',
  GITLAB_AUTH_TOKEN: 'GitLab token is required',
  GITLAB_PROJECT_NOT_FOUND: 'Resource not found while trying to {operation}. Please check your project ID.',
  GITLAB_INVALID_DATA: 'Invalid data provided while trying to {operation}. Please check your inputs.',
  GITLAB_RATE_LIMIT: 'Rate limit exceeded while trying to {operation}. Please try again later.',
  GITLAB_SERVER_ERROR: 'GitLab server error while trying to {operation}. Please try again later.',
  GITLAB_BRANCH_EXISTS: 'Branch already exists',
  
  // Network errors
  NETWORK_ERROR: 'Network error while communicating with GitLab',
  NETWORK_FETCH: 'Network error - unable to connect to GitLab API',
  
  // Parse errors  
  PARSE_ERROR: 'Error parsing {type}: {error}',
  PARSE_SETTINGS: 'Error parsing document settings',
  PARSE_METADATA: 'Error parsing settings metadata',
  
  // Component validation
  COMPONENT_NAME_REQUIRED: 'Component name is required',
  COMPONENT_CONTENT_REQUIRED: 'Test content is required',
  PROJECT_ID_REQUIRED: 'Project ID is required',
  COMMIT_MESSAGE_REQUIRED: 'Commit message is required',
  FILE_PATH_REQUIRED: 'File path is required',
  CSS_DATA_REQUIRED: 'CSS data is required',
  
  // File operations
  FILE_NOT_FOUND: 'File not found at path: {path}',
  SAVE_SETTINGS_ERROR: 'Error saving GitLab settings: {error}',
  RESET_SETTINGS_ERROR: 'Error resetting GitLab settings: {error}',
  SAVE_UNIT_SETTINGS_ERROR: 'Error saving unit settings',
  LOAD_UNIT_SETTINGS_ERROR: 'Error loading unit settings',
  RESET_UNIT_SETTINGS_ERROR: 'Error resetting unit settings',
  
  // Generic fallbacks
  UNKNOWN_ERROR: 'Unknown error',
  OPERATION_FAILED: 'Failed to {operation}: {error}'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  COMMIT_SUCCESS: 'Design tokens successfully committed! Your CSS variables are now ready for development.',
  TEST_COMMIT_SUCCESS: 'Component test successfully committed! The generated test is ready for your review.',
  SETTINGS_SAVED: 'GitLab settings saved and ready to use!',
  EXPORT_COMPLETE: 'Files exported successfully! You can now use them in your project.',
  BRANCH_CREATED: 'Feature branch created! Your changes are isolated and ready for review.',
  MERGE_REQUEST_CREATED: 'Merge request created! Your team can now review and merge the changes.',
  UNIT_SETTINGS_SAVED: 'CSS unit preferences saved and applied to all exports!',
  UNIT_SETTINGS_RESET: 'Unit settings reset to smart defaults!'
} as const;

