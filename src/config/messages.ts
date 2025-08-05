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
  COMMIT_SUCCESS: 'Successfully committed changes to the feature branch',
  TEST_COMMIT_SUCCESS: 'Successfully committed component test to the feature branch',
  SETTINGS_SAVED: 'Settings saved successfully',
  EXPORT_COMPLETE: 'Export completed successfully',
  BRANCH_CREATED: 'Feature branch created successfully',
  MERGE_REQUEST_CREATED: 'Merge request created successfully',
  UNIT_SETTINGS_SAVED: 'Unit settings saved successfully',
  UNIT_SETTINGS_RESET: 'Unit settings reset successfully'
} as const;

// Info Messages
export const INFO_MESSAGES = {
  NO_VARIANTS_FOUND: 'No variants found for component',
  NO_SIZE_VARIANTS: 'No size variants found, returning empty string',
  NO_TEXT_ELEMENT: 'No text element found for style testing',
  NO_SUITABLE_ELEMENT: 'No suitable element found to test styles',
  USING_FALLBACK: 'Using fallback approach for {feature}',
  MIGRATION_COMPLETE: 'Settings migration completed',
  LEGACY_CLEANUP: 'Legacy settings cleaned up'
} as const;

// Warning Messages  
export const WARNING_MESSAGES = {
  DEPRECATED_FEATURE: 'This feature is deprecated and will be removed in a future version',
  INCOMPLETE_DATA: 'Some data may be incomplete',
  PERFORMANCE_WARNING: 'This operation may take a while for large components',
  BROWSER_COMPATIBILITY: 'Some features may not work in older browsers'
} as const;