/**
 * This file contains JSDoc type definitions used throughout the plugin.
 * They are provided for reference only and have no runtime effect.
 *
 * @typedef {Object} VariableCollection
 * @property {string} name
 * @property {Variable[]} variables
 *
 * @typedef {Object} Variable
 * @property {string} id
 * @property {string} name
 * @property {string} resolvedType
 * @property {VariableMode[]} valuesByMode
 *
 * @typedef {Object} VariableMode
 * @property {string} modeName
 * @property {*} value
 *
 * @typedef {Object} Component
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {*} styles
 * @property {string} pageName
 * @property {string} [parentId]
 * @property {Component[]} children
 * @property {boolean} [isChild]
 *
 * @typedef {Object} GitLabSettings
 * @property {string} projectId
 * @property {string} [gitlabToken]
 * @property {string} [filePath]
 * @property {string} [strategy]
 * @property {string} [branchName]
 * @property {boolean} saveToken
 * @property {string} savedAt
 * @property {string} savedBy
 * @property {boolean} [isPersonal]
 *
 * @typedef {Object} StyleCheck
 * @property {string} property
 * @property {string} value
 *
 * @typedef {Object} ParsedComponentName
 * @property {string} name
 * @property {?string} type
 * @property {?string} state
 *
 * @typedef {Object} PluginMessage
 * @property {string} type
 * @property {string} [language]
 * @property {string} [componentId]
 * @property {string} [componentName]
 * @property {string} [projectId]
 * @property {string} [gitlabToken]
 * @property {string} [commitMessage]
 * @property {string} [filePath]
 * @property {string} [strategy]
 * @property {string} [branchName]
 * @property {string} [cssData]
 * @property {boolean} [shareWithTeam]
 * @property {boolean} [saveToken]
 * @property {boolean} [generateAllVariants]
 * @property {boolean} [shouldDownload]
 * @property {boolean} [forceCreate]
 */
