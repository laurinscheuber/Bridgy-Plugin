import { GitSettings } from './git';

export type PluginMessage =
  // Document Data
  | { type: 'document-data'; variablesData: any[]; variableReferences: any; stylesData: any; componentsData: any[]; feedbackDismissed: boolean }
  | { type: 'document-data-error'; error: string; variablesData?: any[]; componentsData?: any[] }
  | { type: 'refresh-data' }
  | { type: 'refresh-complete'; message: string }
  | { type: 'refresh-error'; error: string }

  // Settings
  | { type: 'git-settings-loaded'; settings: GitSettings }
  | { type: 'gitlab-settings-loaded'; settings: any } // Legacy
  | { type: 'save-git-settings'; provider: 'gitlab' | 'github'; baseUrl?: string; projectId: string; token: string; filePath?: string; testFilePath?: string; strategy?: string; branchName?: string; testBranchName?: string; exportFormat?: string; saveToken?: boolean; shareWithTeam?: boolean }
  | { type: 'save-gitlab-settings'; gitlabUrl?: string; projectId: string; gitlabToken: string; filePath?: string; testFilePath?: string; strategy?: string; branchName?: string; testBranchName?: string; exportFormat?: string; saveToken?: boolean; shareWithTeam?: boolean }
  | { type: 'git-settings-saved'; success: boolean; sharedWithTeam: boolean; savedAt: string; savedBy: string }
  | { type: 'gitlab-settings-saved'; success: boolean; sharedWithTeam: boolean; savedAt: string; savedBy: string }
  | { type: 'reset-gitlab-settings' }
  | { type: 'gitlab-settings-reset'; success: boolean }
  | { type: 'set-client-storage'; key: string; value: any }

  // Export
  | { type: 'export-css'; exportFormat?: string; shouldDownload?: boolean }
  | { type: 'css-export'; cssData: string; shouldDownload?: boolean; exportFormat: string }
  | { type: 'get-unit-settings' }
  | { type: 'unit-settings-data'; data: any }
  | { type: 'update-unit-settings'; collections: any; groups: any }
  | { type: 'unit-settings-updated'; success: boolean }
  | { type: 'validate-tailwind-v4' }
  | { type: 'tailwind-v4-validation'; validation: any }

  // Git Operations
  | { type: 'list-repositories'; provider?: 'gitlab' | 'github'; token: string }
  | { type: 'repositories-loaded'; repositories: any[] }
  | { type: 'repositories-error'; error: string }
  | { type: 'list-branches'; provider?: 'gitlab' | 'github'; projectId: string; token: string }
  | { type: 'branches-loaded'; branches: any[] }
  | { type: 'branches-error'; error: string }
  | { type: 'commit-to-repo'; provider?: 'gitlab' | 'github'; baseUrl?: string; projectId: string; token?: string; gitlabToken?: string; commitMessage: string; filePath?: string; cssData: string; branchName?: string }
  | { type: 'commit-to-gitlab'; projectId: string; gitlabToken: string; commitMessage: string; filePath: string; cssData: string; branchName?: string; provider?: string; baseUrl?: string }
  | { type: 'commit-success'; message: string; mergeRequestUrl?: string }
  | { type: 'commit-error'; error: string; errorType?: string; statusCode?: number }
  | { type: 'commit-progress'; progress: number; message: string }

  // Component Tests
  | { type: 'generate-test'; componentId: string; componentName?: string; includeStateTests?: boolean; forCommit?: boolean }
  | { type: 'test-generated'; componentName: string; testContent: string; isComponentSet: boolean; forCommit?: boolean }
  | { type: 'commit-component-test'; provider?: 'gitlab' | 'github'; baseUrl?: string; projectId: string; token?: string; gitlabToken?: string; commitMessage: string; componentName: string; testContent: string; testFilePath?: string; branchName?: string }
  | { type: 'test-commit-success'; message: string; componentName: string; mergeRequestUrl?: string }
  | { type: 'test-commit-error'; error: string; errorType?: string; componentName: string; statusCode?: number }

  // Navigation & Selection
  | { type: 'select-component'; componentId: string }
  | { type: 'component-selected'; componentId: string; componentName: string; pageName: string; switchedPage: boolean }
  | { type: 'component-selection-error'; componentId: string; message: string; pageName?: string }
  | { type: 'focus-node'; nodeId: string }
  | { type: 'load-component-styles'; componentId: string }
  | { type: 'component-styles-loaded'; componentId: string; styles: any; textElements: any[] }

  // OAuth
  | { type: 'check-oauth-status' }
  | { type: 'oauth-status'; status: any }
  | { type: 'start-oauth-flow' }
  | { type: 'oauth-url'; url: string }
  | { type: 'oauth-callback'; data: any }
  | { type: 'open-external'; url: string }
  | { type: 'external-url-opened'; success: boolean; error?: string }

  // Import
  | { type: 'get-existing-collections' }
  | { type: 'existing-collections'; collections: any[] }
  | { type: 'existing-collections-error'; error: string }
  | { type: 'preview-import'; content: string; options?: any }
  | { type: 'import-preview-ready'; diff: any; totalFound: number }
  | { type: 'import-tokens'; tokens: any[]; options: any }
  | { type: 'import-complete'; result: any }
  | { type: 'import-error'; error: string; message?: string }
  | { type: 'delete-variable'; variableId: string }
  | { type: 'variable-deleted'; variableId: string; variableName: string }
  | { type: 'delete-error'; error: string }
  | { type: 'data-refreshed'; variables: any; components: any }

  // Analysis
  | { type: 'analyze-token-coverage'; scope?: 'PAGE' | 'ALL' | 'SMART_SCAN' }
  | { type: 'token-coverage-result'; result: any }
  | { type: 'token-coverage-error'; error: string }
  | { type: 'apply-token-to-nodes'; nodeIds: string[]; variableId: string; property: string; category: string }
  | { type: 'apply-token-result'; success: boolean; successCount?: number; failCount?: number; error?: string }

  // Generic Error
  | { type: 'error'; message: string };
