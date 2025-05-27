// Shared constants for the aWall Synch plugin

export const PLUGIN_NAME = "aWallSync";
export const GITLAB_API_BASE = "https://gitlab.fhnw.ch/api/v4";

export const MESSAGE_TYPES = {
  EXPORT_CSS: "export-css",
  GENERATE_TEST: "generate-test",
  COMMIT_TO_GITLAB: "commit-to-gitlab",
  COMMIT_TEST_TO_GITLAB: "commit-test-to-gitlab",
  SAVE_GITLAB_SETTINGS: "save-gitlab-settings",
  DOCUMENT_DATA: "document-data",
  CSS_EXPORT: "css-export",
  TEST_GENERATED: "test-generated",
  COMMIT_SUCCESS: "commit-success",
  COMMIT_ERROR: "commit-error",
  COMMIT_PROGRESS: "commit-progress",
  ERROR: "error",
  GITLAB_SETTINGS_LOADED: "gitlab-settings-loaded",
  GITLAB_SETTINGS_SAVED: "gitlab-settings-saved"
} as const;

export const DEFAULT_PATHS = {
  CSS_VARIABLES: "src/variables.css",
  TEST_FILES: "src/tests",
  COMPONENT_TESTS: "src/components/{component-name}/test"
} as const;

export const BRANCH_STRATEGIES = {
  DEFAULT: "default",
  FEATURE: "feature"
} as const;