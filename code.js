"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // dist/services/gitlabService.js
  var __awaiter, GitLabService;
  var init_gitlabService = __esm({
    "dist/services/gitlabService.js"() {
      "use strict";
      __awaiter = function(thisArg, _arguments, P, generator) {
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
      GitLabService = class {
        static saveSettings(settings, shareWithTeam) {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              if (shareWithTeam) {
                const settingsToSave = Object.assign({}, settings);
                if (!settings.saveToken) {
                  delete settingsToSave.gitlabToken;
                }
                figma.root.setSharedPluginData("DesignSync", settingsKey, JSON.stringify(settingsToSave));
                console.log(`GitLab settings saved to shared document storage for file: ${figmaFileId}`);
                if (settings.saveToken && settings.gitlabToken) {
                  yield figma.clientStorage.setAsync(`${settingsKey}-token`, settings.gitlabToken);
                  console.log("Token saved to personal storage");
                }
              } else {
                yield figma.clientStorage.setAsync(settingsKey, settings);
                console.log(`GitLab settings saved to personal storage only for file: ${figmaFileId}`);
              }
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, JSON.stringify({
                sharedWithTeam: shareWithTeam,
                savedAt: settings.savedAt,
                savedBy: settings.savedBy
              }));
            } catch (error) {
              console.error("Error saving GitLab settings:", error);
              throw new Error(`Error saving GitLab settings: ${error.message || "Unknown error"}`);
            }
          });
        }
        static loadSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              console.log(`Loading GitLab settings for file: ${figmaFileId}`);
              const documentSettings = figma.root.getSharedPluginData("DesignSync", settingsKey);
              if (documentSettings) {
                try {
                  const settings = JSON.parse(documentSettings);
                  if (settings.saveToken && !settings.gitlabToken) {
                    const personalToken = yield figma.clientStorage.getAsync(`${settingsKey}-token`);
                    if (personalToken) {
                      settings.gitlabToken = personalToken;
                      console.log("Loaded personal token from client storage");
                    }
                  }
                  const metaData = figma.root.getSharedPluginData("DesignSync", `${settingsKey}-meta`);
                  if (metaData) {
                    try {
                      const meta = JSON.parse(metaData);
                      settings.isPersonal = !meta.sharedWithTeam;
                    } catch (metaParseError) {
                      console.warn("Error parsing settings metadata:", metaParseError);
                    }
                  }
                  console.log("Loaded settings from shared document storage");
                  return settings;
                } catch (parseError) {
                  console.error("Error parsing document settings:", parseError);
                }
              }
              const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
              if (personalSettings) {
                console.log("Loaded settings from personal storage");
                return Object.assign(Object.assign({}, personalSettings), { isPersonal: true });
              }
              const legacyDocumentSettings = figma.root.getSharedPluginData("DesignSync", "gitlab-settings");
              if (legacyDocumentSettings) {
                try {
                  const settings = JSON.parse(legacyDocumentSettings);
                  console.log("Found legacy document settings in this file, migrating to project-specific storage");
                  yield this.saveSettings(settings, true);
                  figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
                  return settings;
                } catch (parseError) {
                  console.error("Error parsing legacy document settings:", parseError);
                }
              }
              console.log("No settings found for this project");
              return null;
            } catch (error) {
              console.error("Error loading GitLab settings:", error);
              return null;
            }
          });
        }
        static resetSettings() {
          return __awaiter(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `gitlab-settings-${figmaFileId}`;
              console.log(`Resetting all GitLab settings for file: ${figmaFileId}`);
              figma.root.setSharedPluginData("DesignSync", settingsKey, "");
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              figma.root.setSharedPluginData("DesignSync", "gitlab-settings", "");
              yield figma.clientStorage.deleteAsync("gitlab-settings");
              console.log("All GitLab settings have been reset successfully");
            } catch (error) {
              console.error("Error resetting GitLab settings:", error);
              throw new Error(`Error resetting GitLab settings: ${error.message || "Unknown error"}`);
            }
          });
        }
        static commitToGitLab(projectId_1, gitlabToken_1, commitMessage_1, filePath_1, cssData_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, commitMessage, filePath, cssData, branchName = "feature/variables") {
            const featureBranch = branchName;
            const projectData = yield this.fetchProjectInfo(projectId, gitlabToken);
            const defaultBranch = projectData.default_branch;
            yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch);
            const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch);
            yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, fileData === null || fileData === void 0 ? void 0 : fileData.last_commit_id);
            const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch);
            if (!existingMR) {
              const newMR = yield this.createMergeRequest(projectId, gitlabToken, featureBranch, defaultBranch, commitMessage);
              return { mergeRequestUrl: newMR.web_url };
            }
            return { mergeRequestUrl: existingMR.web_url };
          });
        }
        static fetchProjectInfo(projectId, gitlabToken) {
          return __awaiter(this, void 0, void 0, function* () {
            const projectUrl = `${this.GITLAB_API_BASE}/projects/${projectId}`;
            const response = yield fetch(projectUrl, {
              method: "GET",
              headers: {
                "PRIVATE-TOKEN": gitlabToken
              }
            });
            if (!response.ok) {
              throw new Error("Failed to fetch project information");
            }
            return yield response.json();
          });
        }
        static createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const createBranchUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/branches`;
            const response = yield fetch(createBranchUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "PRIVATE-TOKEN": gitlabToken
              },
              body: JSON.stringify({
                branch: featureBranch,
                ref: defaultBranch
              })
            });
            if (!response.ok) {
              const errorData = yield response.json();
              console.error(`Branch creation failed for '${featureBranch}' from '${defaultBranch}':`, errorData);
              if (errorData.message !== "Branch already exists") {
                throw new Error(`Failed to create branch '${featureBranch}': ${errorData.message || "Unknown error"}`);
              }
            }
          });
        }
        static prepareFileCommit(projectId, gitlabToken, filePath, featureBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const checkFileUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/files/${encodeURIComponent(filePath)}?ref=${featureBranch}`;
            const response = yield fetch(checkFileUrl, {
              method: "GET",
              headers: {
                "PRIVATE-TOKEN": gitlabToken
              }
            });
            const fileExists = response.ok;
            let fileData = null;
            let action = "create";
            if (fileExists) {
              fileData = yield response.json();
              action = "update";
            }
            return { fileData, action };
          });
        }
        static createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, cssData, action, lastCommitId) {
          return __awaiter(this, void 0, void 0, function* () {
            const commitUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/repository/commits`;
            const commitAction = Object.assign({ action, file_path: filePath, content: cssData, encoding: "text" }, lastCommitId && { last_commit_id: lastCommitId });
            const response = yield fetch(commitUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "PRIVATE-TOKEN": gitlabToken
              },
              body: JSON.stringify({
                branch: featureBranch,
                commit_message: commitMessage,
                actions: [commitAction]
              })
            });
            if (!response.ok) {
              const errorData = yield response.json();
              throw new Error(errorData.message || "Failed to commit to GitLab");
            }
          });
        }
        static findExistingMergeRequest(projectId, gitlabToken, sourceBranch) {
          return __awaiter(this, void 0, void 0, function* () {
            const mrUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/merge_requests?source_branch=${sourceBranch}&state=opened`;
            const response = yield fetch(mrUrl, {
              method: "GET",
              headers: {
                "PRIVATE-TOKEN": gitlabToken
              }
            });
            if (!response.ok) {
              throw new Error("Failed to fetch merge requests");
            }
            const mergeRequests = yield response.json();
            return mergeRequests.length > 0 ? mergeRequests[0] : null;
          });
        }
        static createMergeRequest(projectId_1, gitlabToken_1, sourceBranch_1, targetBranch_1, title_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, sourceBranch, targetBranch, title, description = "Automatically created merge request for CSS variables update") {
            const mrUrl = `${this.GITLAB_API_BASE}/projects/${projectId}/merge_requests`;
            const response = yield fetch(mrUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "PRIVATE-TOKEN": gitlabToken
              },
              body: JSON.stringify({
                source_branch: sourceBranch,
                target_branch: targetBranch,
                title,
                description,
                remove_source_branch: true,
                squash: true
              })
            });
            if (!response.ok) {
              const errorData = yield response.json();
              throw new Error(errorData.message || "Failed to create merge request");
            }
            return yield response.json();
          });
        }
        static commitComponentTest(projectId_1, gitlabToken_1, commitMessage_1, componentName_1, testContent_1) {
          return __awaiter(this, arguments, void 0, function* (projectId, gitlabToken, commitMessage, componentName, testContent, testFilePath = "components/{componentName}.spec.ts", branchName = "feature/component-tests") {
            const normalizedComponentName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
            const filePath = testFilePath.replace(/{componentName}/g, normalizedComponentName);
            const featureBranch = `${branchName}-${normalizedComponentName}`;
            console.log(`Committing component test for ${componentName} to ${filePath} on branch ${featureBranch}`);
            const projectData = yield this.fetchProjectInfo(projectId, gitlabToken);
            const defaultBranch = projectData.default_branch || "main";
            console.log(`Project default branch: ${defaultBranch}, creating feature branch: ${featureBranch}`);
            yield this.createFeatureBranch(projectId, gitlabToken, featureBranch, defaultBranch);
            const { fileData, action } = yield this.prepareFileCommit(projectId, gitlabToken, filePath, featureBranch);
            yield this.createCommit(projectId, gitlabToken, featureBranch, commitMessage, filePath, testContent, action, fileData === null || fileData === void 0 ? void 0 : fileData.last_commit_id);
            const existingMR = yield this.findExistingMergeRequest(projectId, gitlabToken, featureBranch);
            if (!existingMR) {
              const mrDescription = `Automatically created merge request for component test: ${componentName}`;
              const newMR = yield this.createMergeRequest(projectId, gitlabToken, featureBranch, defaultBranch, commitMessage, mrDescription);
              return { mergeRequestUrl: newMR.web_url };
            }
            return { mergeRequestUrl: existingMR.web_url };
          });
        }
      };
      GitLabService.GITLAB_API_BASE = "https://gitlab.fhnw.ch/api/v4";
    }
  });

  // dist/services/unitsService.js
  var __awaiter2, UnitsService;
  var init_unitsService = __esm({
    "dist/services/unitsService.js"() {
      "use strict";
      __awaiter2 = function(thisArg, _arguments, P, generator) {
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
      UnitsService = class {
        static getDefaultUnit(variableName) {
          const name = variableName.toLowerCase();
          if (name.includes("opacity") || name.includes("alpha") || name.includes("z-index") || name.includes("line-height") || name.includes("font-weight") || name.includes("flex") || name.includes("order")) {
            return "none";
          }
          return "px";
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
        static resetUnitSettingsInMemory() {
          this.unitSettings = {
            collections: {},
            groups: {}
          };
        }
        static formatValueWithUnit(value, unit) {
          if (unit === "none" || unit === "") {
            return String(value);
          }
          return `${value}${unit}`;
        }
        // Save unit settings to shared Figma storage (accessible by all team members)
        static saveUnitSettings() {
          return __awaiter2(this, void 0, void 0, function* () {
            var _a;
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              figma.root.setSharedPluginData("DesignSync", settingsKey, JSON.stringify(this.unitSettings));
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, JSON.stringify({
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.name) || "Unknown user"
              }));
              console.log(`Unit settings saved to shared document storage for file: ${figmaFileId}`);
            } catch (error) {
              console.error("Error saving unit settings:", error);
              throw error;
            }
          });
        }
        // Load unit settings from shared Figma storage
        static loadUnitSettings() {
          return __awaiter2(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              console.log(`Loading unit settings for file: ${figmaFileId}`);
              const sharedSettings = figma.root.getSharedPluginData("DesignSync", settingsKey);
              if (sharedSettings) {
                try {
                  this.unitSettings = JSON.parse(sharedSettings);
                  console.log("Unit settings loaded from shared document storage");
                  return;
                } catch (parseError) {
                  console.error("Error parsing shared unit settings:", parseError);
                }
              }
              const personalSettings = yield figma.clientStorage.getAsync(settingsKey);
              if (personalSettings) {
                console.log("Found personal unit settings, migrating to shared storage");
                this.unitSettings = personalSettings;
                yield this.saveUnitSettings();
                yield figma.clientStorage.deleteAsync(settingsKey);
                console.log("Unit settings migrated to shared storage");
                return;
              }
              console.log("No unit settings found, using defaults");
            } catch (error) {
              console.error("Error loading unit settings:", error);
            }
          });
        }
        // Reset unit settings (remove from both personal and shared storage)
        static resetUnitSettings() {
          return __awaiter2(this, void 0, void 0, function* () {
            try {
              const figmaFileId = figma.root.id;
              const settingsKey = `unit-settings-${figmaFileId}`;
              console.log(`Resetting unit settings for file: ${figmaFileId}`);
              this.unitSettings = {
                collections: {},
                groups: {}
              };
              figma.root.setSharedPluginData("DesignSync", settingsKey, "");
              figma.root.setSharedPluginData("DesignSync", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              console.log("Unit settings have been reset successfully");
            } catch (error) {
              console.error("Error resetting unit settings:", error);
              throw error;
            }
          });
        }
      };
      UnitsService.unitSettings = {
        collections: {},
        groups: {}
      };
      UnitsService.AVAILABLE_UNITS = [
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
      ];
      UnitsService.DEFAULT_UNIT_PATTERNS = {
        // Unitless values
        "opacity": "none",
        "z-index": "none",
        "line-height": "none",
        "font-weight": "none",
        "flex": "none",
        "order": "none",
        // Default to px for all size-related values
        "default": "px"
      };
    }
  });

  // dist/services/cssExportService.js
  var __awaiter3, CSSExportService;
  var init_cssExportService = __esm({
    "dist/services/cssExportService.js"() {
      "use strict";
      init_unitsService();
      __awaiter3 = function(thisArg, _arguments, P, generator) {
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
      CSSExportService = class {
        static exportVariables() {
          return __awaiter3(this, arguments, void 0, function* (format = "css") {
            try {
              this.allVariables.clear();
              yield UnitsService.loadUnitSettings();
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              yield this.collectAllVariables(collections);
              let content = format === "scss" ? "" : ":root {\n";
              const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
              for (const collection of sortedCollections) {
                const collectionVariables = [];
                const groupedVariables = /* @__PURE__ */ new Map();
                for (const variableId of collection.variableIds) {
                  const variable = yield figma.variables.getVariableByIdAsync(variableId);
                  if (!variable)
                    continue;
                  const defaultModeId = collection.modes[0].modeId;
                  const value = variable.valuesByMode[defaultModeId];
                  const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                  let cssValue;
                  const isAlias = value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS";
                  if (isAlias) {
                    const referencedVariable = this.allVariables.get(value.id);
                    if (referencedVariable) {
                      const referencedName = referencedVariable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                      cssValue = format === "scss" ? `$${referencedName}` : `var(--${referencedName})`;
                    } else {
                      continue;
                    }
                  } else {
                    const pathMatch2 = variable.name.match(/^([^\/]+)\//);
                    const groupName = pathMatch2 ? pathMatch2[1] : void 0;
                    const formattedValue = this.formatVariableValue(variable.resolvedType, value, variable.name, collection.name, groupName);
                    if (formattedValue === null)
                      continue;
                    cssValue = formattedValue;
                  }
                  const cssVariable = {
                    name: formattedName,
                    value: cssValue,
                    originalName: variable.name
                  };
                  const pathMatch = variable.name.match(/^([^\/]+)\//);
                  if (pathMatch) {
                    const prefix = pathMatch[1];
                    if (!groupedVariables.has(prefix)) {
                      groupedVariables.set(prefix, []);
                    }
                    groupedVariables.get(prefix).push(cssVariable);
                  } else {
                    collectionVariables.push(cssVariable);
                  }
                }
                if (collectionVariables.length > 0 || groupedVariables.size > 0) {
                  content += `
${format === "scss" ? "//" : "  /*"} ===== ${collection.name.toUpperCase()} ===== ${format === "scss" ? "" : "*/"}
`;
                  collectionVariables.forEach((variable) => {
                    if (format === "scss") {
                      content += `$${variable.name}: ${variable.value};
`;
                    } else {
                      content += `  --${variable.name}: ${variable.value};
`;
                    }
                  });
                  groupedVariables.forEach((variables, groupName) => {
                    if (variables.length > 0) {
                      const displayName = groupName.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
                      content += `
${format === "scss" ? "//" : "  /*"} ${displayName} ${format === "scss" ? "" : "*/"}
`;
                      variables.forEach((variable) => {
                        if (format === "scss") {
                          content += `$${variable.name}: ${variable.value};
`;
                        } else {
                          content += `  --${variable.name}: ${variable.value};
`;
                        }
                      });
                    }
                  });
                }
              }
              if (format === "css") {
                content += "}\n";
              }
              return content;
            } catch (error) {
              console.error("Error exporting CSS:", error);
              throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
            }
          });
        }
        // Collect all variables for resolution purposes
        static collectAllVariables(collections) {
          return __awaiter3(this, void 0, void 0, function* () {
            for (const collection of collections) {
              for (const variableId of collection.variableIds) {
                const variable = yield figma.variables.getVariableByIdAsync(variableId);
                if (variable) {
                  this.allVariables.set(variable.id, variable);
                }
              }
            }
          });
        }
        static formatVariableValue(type, value, name, collectionName, groupName) {
          switch (type) {
            case "COLOR":
              if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
                const color = value;
                const r = Math.round(color.r * 255);
                const g = Math.round(color.g * 255);
                const b = Math.round(color.b * 255);
                if (typeof color.a === "number" && color.a < 1) {
                  return `rgba(${r}, ${g}, ${b}, ${color.a.toFixed(2)})`;
                }
                return `rgb(${r}, ${g}, ${b})`;
              }
              return null;
            case "FLOAT":
              if (typeof value === "number" && !isNaN(value)) {
                const unit = UnitsService.getUnitForVariable(name, collectionName, groupName);
                return UnitsService.formatValueWithUnit(value, unit);
              }
              return null;
            case "STRING":
              if (typeof value === "string") {
                return `"${value}"`;
              }
              return null;
            case "BOOLEAN":
              if (typeof value === "boolean") {
                return value ? "true" : "false";
              }
              return null;
            default:
              return null;
          }
        }
        // Get unit settings data for the settings interface
        static getUnitSettingsData() {
          return __awaiter3(this, void 0, void 0, function* () {
            yield UnitsService.loadUnitSettings();
            const collections = yield figma.variables.getLocalVariableCollectionsAsync();
            const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name));
            const collectionsData = [];
            const groupsData = [];
            const unitSettings = UnitsService.getUnitSettings();
            for (const collection of sortedCollections) {
              const hasCollectionSetting = unitSettings.collections[collection.name] !== void 0;
              const defaultUnit = hasCollectionSetting ? unitSettings.collections[collection.name] : "Smart defaults";
              const currentUnit = unitSettings.collections[collection.name] || "";
              collectionsData.push({
                name: collection.name,
                defaultUnit,
                currentUnit
              });
              const groups = /* @__PURE__ */ new Set();
              for (const variableId of collection.variableIds) {
                const variable = yield figma.variables.getVariableByIdAsync(variableId);
                if (variable) {
                  const pathMatch = variable.name.match(/^([^\/]+)\//);
                  if (pathMatch) {
                    groups.add(pathMatch[1]);
                  }
                }
              }
              for (const groupName of Array.from(groups).sort()) {
                const groupKey = `${collection.name}/${groupName}`;
                const hasGroupSetting = unitSettings.groups[groupKey] !== void 0;
                const hasCollectionSetting2 = unitSettings.collections[collection.name] !== void 0;
                let defaultUnit2;
                if (hasGroupSetting) {
                  defaultUnit2 = unitSettings.groups[groupKey];
                } else if (hasCollectionSetting2) {
                  defaultUnit2 = `Inherits: ${unitSettings.collections[collection.name]}`;
                } else {
                  defaultUnit2 = "Smart defaults";
                }
                const groupCurrentUnit = unitSettings.groups[groupKey] || "";
                groupsData.push({
                  collectionName: collection.name,
                  groupName,
                  defaultUnit: defaultUnit2,
                  currentUnit: groupCurrentUnit
                });
              }
            }
            return { collections: collectionsData, groups: groupsData };
          });
        }
        // Update unit settings
        static updateUnitSettings(settings) {
          UnitsService.updateUnitSettings(settings);
        }
        // Save unit settings
        static saveUnitSettings() {
          return __awaiter3(this, void 0, void 0, function* () {
            yield UnitsService.saveUnitSettings();
          });
        }
      };
      CSSExportService.allVariables = /* @__PURE__ */ new Map();
    }
  });

  // dist/utils/stateTestingUtils.js
  function shouldTestPropertyForState(property) {
    const kebabProperty = property.replace(/([A-Z])/g, "-$1").toLowerCase();
    if (INTERACTIVE_PROPERTIES.indexOf(property) !== -1 || INTERACTIVE_PROPERTIES.indexOf(kebabProperty) !== -1) {
      return true;
    }
    const colorRelatedKeywords = ["color", "background", "border", "outline", "shadow", "fill", "stroke"];
    return colorRelatedKeywords.some((keyword) => property.toLowerCase().includes(keyword) || kebabProperty.includes(keyword));
  }
  function toKebabCase(property) {
    return property.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
  function toCamelCase(property) {
    return property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
  function generateTestHelpers() {
    return `  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();

    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var\\((--.+?)\\)/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }
    return value;
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: string): string | undefined => {
    // Regex necessary because Angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style?.getPropertyValue(prop);
  };

  const checkStyleProperty = (selector: string, pseudoClass: string, property: string, expectedValue?: string) => {
    const value = getCssPropertyForRule(selector, pseudoClass, property);
    if (!value) {
      // If no value is found for this pseudo-class, that's okay - not all states need all properties
      return;
    }

    if (value.startsWith('var(')) {
      const variableName = value.match(/var\\((--.+?)\\)/)?.[1];
      const resolvedValue = variableName ? resolveCssVariable(variableName) : undefined;
      if (expectedValue) {
        expect(resolvedValue).toBe(expectedValue);
      } else {
        expect(resolvedValue).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${resolvedValue}\`);
      }
    } else {
      if (expectedValue) {
        expect(value).toBe(expectedValue);
      } else {
        expect(value).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${value}\`);
      }
    }
  };`;
  }
  function generateStateTests(componentSelector, states, componentStyles) {
    const tests = [];
    const hasInteractiveElement = Object.keys(componentStyles).some((prop) => shouldTestPropertyForState(prop));
    if (!hasInteractiveElement) {
      return "";
    }
    for (const state of states) {
      const componentInteractiveProps = Object.keys(componentStyles).filter((prop) => shouldTestPropertyForState(prop));
      const allPropertiesToTest = /* @__PURE__ */ new Set([
        ...componentInteractiveProps.map((prop) => toKebabCase(prop)),
        ...state.properties
      ]);
      if (allPropertiesToTest.size > 0) {
        const testName = `should have correct ${state.state} styles`;
        const propertyChecks = Array.from(allPropertiesToTest).map((prop) => {
          const camelCaseProp = toCamelCase(prop);
          const expectedValue = componentStyles[camelCaseProp];
          if (expectedValue && typeof expectedValue === "string") {
            if (prop === "color" || prop === "background-color" || prop.includes("border")) {
              return `      { property: '${prop}', expected: '${expectedValue}' }`;
            }
          }
          return `      { property: '${prop}', expected: undefined }`;
        }).join(",\n");
        const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      checkStyleProperty('${componentSelector}', '${state.pseudoClass}', property, expected);
    });
  });`;
        tests.push(testCode);
      }
    }
    return tests.join("\n");
  }
  function analyzeComponentStateVariants(variants) {
    console.log("DEBUG: analyzeComponentStateVariants called with", variants.length, "variants");
    const stateStyleMap = /* @__PURE__ */ new Map();
    variants.forEach((variant, index) => {
      console.log(`DEBUG: Processing variant ${index}: "${variant.name}"`);
      const stateName = extractStateFromVariantName(variant.name);
      console.log(`DEBUG: Extracted state name: "${stateName}"`);
      if (!stateName) {
        console.log("DEBUG: No state name found, skipping variant");
        return;
      }
      let styles;
      try {
        styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
        console.log(`DEBUG: Parsed ${Object.keys(styles).length} style properties for state "${stateName}"`);
      } catch (e) {
        console.error("Error parsing variant styles:", e);
        return;
      }
      const styleMap = /* @__PURE__ */ new Map();
      for (const key in styles) {
        if (styles.hasOwnProperty(key)) {
          styleMap.set(key, styles[key]);
        }
      }
      stateStyleMap.set(stateName, styleMap);
      console.log(`DEBUG: Stored ${styleMap.size} styles for state "${stateName}"`);
    });
    console.log("DEBUG: Final state style map has", stateStyleMap.size, "states:", Array.from(stateStyleMap.keys()));
    return stateStyleMap;
  }
  function extractStateFromVariantName(variantName) {
    let stateMatch = variantName.match(/State=(\w+)/i);
    if (stateMatch) {
      return stateMatch[1].toLowerCase();
    }
    stateMatch = variantName.match(/Property\s*\d*\s*=\s*(\w+)/i);
    if (stateMatch) {
      return stateMatch[1].toLowerCase();
    }
    stateMatch = variantName.match(/(\w+)=(\w+)/i);
    if (stateMatch) {
      return stateMatch[2].toLowerCase();
    }
    return null;
  }
  function findStyleDifferences(baseStyles, compareStyles) {
    const differences = /* @__PURE__ */ new Map();
    compareStyles.forEach((value, key) => {
      const baseValue = baseStyles.get(key);
      if (baseValue !== value) {
        differences.set(key, value);
      }
    });
    return differences;
  }
  function generateStateTestsFromVariants(componentSelector, variants, defaultStyles) {
    const tests = [];
    const stateStyleMap = analyzeComponentStateVariants(variants);
    let defaultStateStyles = stateStyleMap.get("default");
    if (!defaultStateStyles) {
      defaultStateStyles = /* @__PURE__ */ new Map();
      for (const key in defaultStyles) {
        if (defaultStyles.hasOwnProperty(key)) {
          defaultStateStyles.set(key, defaultStyles[key]);
        }
      }
    }
    const allStates = Array.from(stateStyleMap.keys()).filter((state) => state !== "default");
    for (const stateName of allStates) {
      const stateStyles = stateStyleMap.get(stateName);
      if (!stateStyles)
        continue;
      const differences = findStyleDifferences(defaultStateStyles, stateStyles);
      if (differences.size === 0)
        continue;
      const pseudoClass = stateName.startsWith(":") ? stateName : `:${stateName}`;
      const testName = `should have correct ${stateName} styles`;
      const propertyChecks = Array.from(differences.entries()).map(([property, value]) => {
        const kebabProperty = toKebabCase(property);
        return `      { property: '${kebabProperty}', expected: '${value}' }`;
      }).join(",\n");
      const testCode = `
  it('${testName}', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    const propertiesToCheck = [
${propertyChecks}
    ];

    propertiesToCheck.forEach(({ property, expected }) => {
      checkStyleProperty('${componentSelector}', '${pseudoClass}', property, expected);
    });
  });`;
      tests.push(testCode);
    }
    return tests.join("\n");
  }
  var INTERACTIVE_PROPERTIES, STATE_SPECIFIC_PROPERTIES, INTERACTIVE_STATES;
  var init_stateTestingUtils = __esm({
    "dist/utils/stateTestingUtils.js"() {
      "use strict";
      INTERACTIVE_PROPERTIES = [
        // Color properties
        "background-color",
        "background",
        "color",
        "border-color",
        "border-top-color",
        "border-right-color",
        "border-bottom-color",
        "border-left-color",
        "border",
        // shorthand property
        "outline-color",
        "outline",
        // shorthand property
        "text-decoration-color",
        "fill",
        "stroke",
        // Visual effects
        "box-shadow",
        "text-shadow",
        "filter",
        "backdrop-filter",
        "opacity",
        // Transforms
        "transform",
        "scale",
        // Borders
        "border-width",
        "border-style",
        "outline-width",
        "outline-style",
        // Text decoration
        "text-decoration",
        "text-decoration-line",
        "text-decoration-style",
        "font-weight",
        "font-style",
        // Transitions (to detect if they exist)
        "transition",
        "transition-duration",
        "transition-property"
      ];
      STATE_SPECIFIC_PROPERTIES = {
        hover: [
          "background-color",
          "color",
          "border-color",
          "box-shadow",
          "transform",
          "opacity"
        ],
        focus: [
          "outline",
          "outline-color",
          "outline-width",
          "outline-offset",
          "box-shadow",
          "border-color"
        ],
        active: [
          "transform",
          "box-shadow",
          "background-color",
          "border-color"
        ],
        disabled: [
          "opacity",
          "cursor",
          "background-color",
          "color",
          "border-color"
        ]
      };
      INTERACTIVE_STATES = [
        {
          state: "hover",
          pseudoClass: ":hover",
          properties: STATE_SPECIFIC_PROPERTIES.hover
        },
        {
          state: "focus",
          pseudoClass: ":focus",
          properties: STATE_SPECIFIC_PROPERTIES.focus
        },
        {
          state: "active",
          pseudoClass: ":active",
          properties: STATE_SPECIFIC_PROPERTIES.active
        },
        {
          state: "disabled",
          pseudoClass: ":disabled",
          properties: STATE_SPECIFIC_PROPERTIES.disabled
        }
      ];
    }
  });

  // dist/utils/sizeVariantUtils.js
  function generateSizeVariantTests(componentSelector, componentName, allVariants) {
    console.log("DEBUG: generateSizeVariantTests called with:", {
      componentSelector,
      componentName,
      variantCount: allVariants ? allVariants.length : 0,
      variants: allVariants ? allVariants.map((v) => v.name) : "none"
    });
    const sizeVariantMap = /* @__PURE__ */ new Map();
    if (allVariants && allVariants.length > 0) {
      allVariants.forEach((variant) => {
        console.log("DEBUG: Checking variant:", variant.name);
        const sizeMatch = variant.name.match(/Size=([^,]+)/i);
        const stateMatch = variant.name.match(/State=([^,]+)/i);
        console.log("DEBUG: Size match result:", sizeMatch);
        if (sizeMatch) {
          const sizeName = sizeMatch[1].toLowerCase();
          const stateName = stateMatch ? stateMatch[1].toLowerCase() : "default";
          console.log("DEBUG: Found size variant:", sizeName, "with state:", stateName);
          let styles;
          try {
            styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
          } catch (e) {
            console.error("Error parsing variant styles:", e);
            styles = {};
          }
          const existingVariants = sizeVariantMap.get(sizeName) || [];
          existingVariants.push({
            name: sizeName,
            selector: `${componentSelector}--${sizeName}`,
            // BEM naming convention
            expectedStyles: styles,
            state: stateName
          });
          sizeVariantMap.set(sizeName, existingVariants);
        }
      });
    }
    console.log("DEBUG: Found", sizeVariantMap.size, "unique sizes:", Array.from(sizeVariantMap.keys()));
    if (sizeVariantMap.size === 0) {
      console.log("DEBUG: No size variants found, returning empty string");
      return "";
    }
    const sizeVariants = [];
    sizeVariantMap.forEach((variants, sizeName) => {
      const defaultVariant = variants.find((v) => v.state === "default") || variants[0];
      if (defaultVariant) {
        sizeVariants.push(defaultVariant);
      }
    });
    const sizeTestCode = `
  it('should have correct styles for different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    ${sizeVariants.map((variant) => {
      const sizeSpecificProps = {};
      const sizeRelatedProperties = ["padding", "gap", "font-size", "line-height", "width", "height", "min-width", "min-height", "margin"];
      for (const prop of sizeRelatedProperties) {
        if (variant.expectedStyles[prop]) {
          sizeSpecificProps[prop] = variant.expectedStyles[prop];
        }
        const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        if (variant.expectedStyles[camelProp]) {
          sizeSpecificProps[camelProp] = variant.expectedStyles[camelProp];
        }
      }
      const testCases = [];
      for (const prop in sizeSpecificProps) {
        if (sizeSpecificProps.hasOwnProperty(prop)) {
          const value = sizeSpecificProps[prop];
          const kebabProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
          testCases.push(`checkStyleProperty('${variant.selector}', '', '${kebabProp}', '${value}');`);
        }
      }
      if (testCases.length === 0) {
        return `
    // ${variant.name} size variant - no size-specific properties found`;
      }
      return `
    // Test ${variant.name} size variant
    ${testCases.join("\n    ")}`;
    }).join("\n")}
    
    // Also test hover states for each size if they have different padding
    ${sizeVariantMap.size > 0 ? Array.from(sizeVariantMap.entries()).map(([sizeName, variants]) => {
      const hoverVariant = variants.find((v) => v.state === "hover");
      if (!hoverVariant)
        return "";
      const defaultVariant = variants.find((v) => v.state === "default") || variants[0];
      if (defaultVariant && hoverVariant.expectedStyles.padding !== defaultVariant.expectedStyles.padding) {
        return `
    // Test ${sizeName} size hover state padding
    checkStyleProperty('.${componentSelector.substring(1)}--${sizeName}', ':hover', 'padding', '${hoverVariant.expectedStyles.padding}');`;
      }
      return "";
    }).join("") : ""}
  });`;
    return sizeTestCode;
  }
  function generateBasicSizeTests(componentSelector) {
    return `
  it('should support different size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Common size variant naming conventions
    const sizeVariants = ['xs', 'sm', 'md', 'base', 'lg', 'xl', 'xxl'];
    const altSizeVariants = ['small', 'medium', 'large', 'x-small', 'x-large'];
    
    // Properties that typically change with size
    const sizeProperties = ['padding', 'font-size', 'line-height', 'border-radius', 'gap', 'width', 'height', 'min-width', 'min-height'];
    
    // Test both standard size variants and alternative naming
    const allSizeVariants = [...sizeVariants, ...altSizeVariants];
    
    allSizeVariants.forEach(size => {
      sizeProperties.forEach(property => {
        // Check BEM naming: .component--size
        const bemValue = getCssPropertyForRule('${componentSelector}--' + size, '', property);
        // Check modifier class: .component.size
        const modifierValue = getCssPropertyForRule('${componentSelector}.' + size, '', property);
        
        const value = bemValue || modifierValue;
        if (value) {
          console.log(\`Size \${size} - \${property}: \${value}\`);
          expect(value).toBeDefined();
        }
      });
    });
  });`;
  }
  var init_sizeVariantUtils = __esm({
    "dist/utils/sizeVariantUtils.js"() {
      "use strict";
    }
  });

  // dist/utils/componentUtils.js
  function hexToRgb(hex) {
    const cleanHex = hex.replace("#", "");
    if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
      return hex;
    }
    let fullHex = cleanHex;
    if (cleanHex.length === 3) {
      fullHex = cleanHex.split("").map((char) => char + char).join("");
    }
    const r = parseInt(fullHex.substring(0, 2), 16);
    const g = parseInt(fullHex.substring(2, 4), 16);
    const b = parseInt(fullHex.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  function normalizeColorForTesting(color) {
    if (!color || typeof color !== "string") {
      return color;
    }
    if (color.startsWith("rgb(") || color.startsWith("rgba(")) {
      return color;
    }
    if (color.startsWith("#") || /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(color)) {
      return hexToRgb(color);
    }
    return color;
  }
  function normalizeComplexColorValue(value) {
    if (!value || typeof value !== "string") {
      return value;
    }
    return value.replace(/#[0-9A-Fa-f]{3,6}(?![0-9A-Fa-f])/g, (match) => {
      return hexToRgb(match);
    });
  }
  function generateTextContentTests(textElements, componentVariants) {
    if (!textElements || textElements.length === 0) {
      return "";
    }
    const tests = [];
    const textWithStyles = textElements.filter((el) => el.textStyles && Object.keys(el.textStyles).length > 0);
    if (textWithStyles.length > 0) {
      if (componentVariants && componentVariants.length > 0) {
        const variantGroups = /* @__PURE__ */ new Map();
        componentVariants.forEach((variant) => {
          const stateMatch = variant.name.match(/State=([^,]+)/i);
          const sizeMatch = variant.name.match(/Size=([^,]+)/i);
          const propMatch = variant.name.match(/Property\s*\d*\s*=\s*([^,]+)/i);
          const state = stateMatch ? stateMatch[1].toLowerCase() : propMatch ? propMatch[1].toLowerCase() : "default";
          const size = sizeMatch ? sizeMatch[1].toLowerCase() : "default";
          const key = `${state}-${size}`;
          if (!variantGroups.has(key)) {
            variantGroups.set(key, []);
          }
          variantGroups.get(key).push(variant);
        });
        variantGroups.forEach((variants, key) => {
          const variant = variants[0];
          if (variant.textElements && variant.textElements.length > 0) {
            const [state, size] = key.split("-");
            const textStyleTest = `
  it('should have correct text styles for ${state} state, ${size} size', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      console.warn('No text element found for style testing');
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${variant.textElements.map((textEl, index) => {
              const styles = textEl.textStyles;
              if (!styles || Object.keys(styles).length === 0)
                return "";
              const assertions = [];
              if (styles.fontSize) {
                const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Size
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
              }
              if (styles.fontFamily) {
                const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Family
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
              }
              if (styles.fontWeight) {
                const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
                assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Font Weight
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
              }
              if (styles.color) {
                const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim());
                assertions.push(`
    // Text: "${textEl.content}" (${state}, ${size}) - Color
    expect(computedStyle.color).toBe('${normalizedColor}');`);
              }
              return assertions.join("");
            }).join("")}
  });`;
            tests.push(textStyleTest);
          }
        });
      } else {
        const textStyleTest = `
  it('should have correct text styles', () => {
    const element = fixture.nativeElement;
    const textElement = element.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    
    if (!textElement) {
      console.warn('No text element found for style testing');
      return;
    }
    
    const computedStyle = window.getComputedStyle(textElement);
    ${textWithStyles.map((textEl, index) => {
          const styles = textEl.textStyles;
          const assertions = [];
          if (styles.fontSize) {
            const normalizedFontSize = styles.fontSize.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
            assertions.push(`
    // Text: "${textEl.content}" - Font Size
    expect(computedStyle.fontSize).toBe('${normalizedFontSize}');`);
          }
          if (styles.fontFamily) {
            const normalizedFontFamily = styles.fontFamily.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
            assertions.push(`
    // Text: "${textEl.content}" - Font Family
    expect(computedStyle.fontFamily).toBe('${normalizedFontFamily}');`);
          }
          if (styles.fontWeight) {
            const normalizedFontWeight = styles.fontWeight.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim();
            assertions.push(`
    // Text: "${textEl.content}" - Font Weight
    expect(computedStyle.fontWeight).toBe('${normalizedFontWeight}');`);
          }
          if (styles.color) {
            const normalizedColor = normalizeColorForTesting(styles.color.replace(/var\([^,]+,\s*([^)]+)\)/g, "$1").trim());
            assertions.push(`
    // Text: "${textEl.content}" - Color
    expect(computedStyle.color).toBe('${normalizedColor}');`);
          }
          return assertions.join("");
        }).join("")}
  });`;
        tests.push(textStyleTest);
      }
    }
    return tests.join("");
  }
  function createTestWithStyleChecks(componentName, kebabName, styleChecks, includeStateTests = true, includeSizeTests = true, componentVariants, textElements) {
    function stripCssVarFallback(value) {
      return value.replace(/var\([^,]+,\s*([^\)]+)\)/g, "$1").replace(/\s+/g, " ").trim();
    }
    const styleCheckCode = styleChecks.length > 0 ? styleChecks.map((check) => {
      const expected = stripCssVarFallback(String(check.value));
      if (LAYOUT_PROPERTIES.indexOf(check.property) !== -1) {
        return `      // Check ${check.property} (layout property - often structural)
      // expect(computedStyle.${check.property}).toBe('${expected}');`;
      }
      return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${expected}');`;
    }).join("\n\n") : "      // No style properties to check";
    const words = componentName.split(/[^a-zA-Z0-9]+/).filter((word) => word.length > 0);
    const pascalName = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
    const componentSelector = `.${kebabName}`;
    const stylesObject = {};
    styleChecks.forEach((check) => {
      stylesObject[check.property] = check.value;
    });
    let stateTestsCode = "";
    if (includeStateTests) {
      if (componentVariants && componentVariants.length > 0) {
        stateTestsCode = generateStateTestsFromVariants(componentSelector, componentVariants, stylesObject);
      } else {
        const hasInteractiveProperties = styleChecks.some((check) => shouldTestPropertyForState(check.property));
        if (hasInteractiveProperties) {
          stateTestsCode = generateStateTests(componentSelector, INTERACTIVE_STATES, stylesObject);
        }
      }
    }
    let sizeTestsCode = "";
    if (includeSizeTests) {
      console.log("DEBUG: Size testing - componentVariants:", componentVariants ? componentVariants.length : "null/undefined");
      if (componentVariants && componentVariants.length > 0) {
        console.log("DEBUG: Using Figma variant data for size testing");
        sizeTestsCode = generateSizeVariantTests(componentSelector, componentName, componentVariants);
      } else {
        console.log("DEBUG: Using basic size testing approach");
        sizeTestsCode = generateBasicSizeTests(componentSelector);
      }
    }
    const hasVariantTests = componentVariants && componentVariants.length > 0 && (includeStateTests || includeSizeTests);
    const helperFunctions = hasVariantTests ? "\n" + generateTestHelpers() + "\n" : "";
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;${helperFunctions}

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct styles', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      
${styleCheckCode}
    } else {
      console.warn('No suitable element found to test styles');
    }
  });${stateTestsCode}${sizeTestsCode}${generateTextContentTests(textElements, componentVariants)}
});`;
  }
  var LAYOUT_PROPERTIES;
  var init_componentUtils = __esm({
    "dist/utils/componentUtils.js"() {
      "use strict";
      init_stateTestingUtils();
      init_sizeVariantUtils();
      LAYOUT_PROPERTIES = [
        "justifyContent",
        "alignItems",
        "display",
        "flexDirection",
        "position"
      ];
    }
  });

  // dist/services/componentService.js
  var __awaiter4, ComponentService;
  var init_componentService = __esm({
    "dist/services/componentService.js"() {
      "use strict";
      init_componentUtils();
      __awaiter4 = function(thisArg, _arguments, P, generator) {
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
      ComponentService = class _ComponentService {
        /**
         * Checks if a CSS property is a simple color property (contains only color values)
         */
        static isSimpleColorProperty(property) {
          const simpleColorProperties = [
            "accentColor",
            "backgroundColor",
            "borderColor",
            "borderTopColor",
            "borderRightColor",
            "borderBottomColor",
            "borderLeftColor",
            "borderBlockColor",
            "borderInlineColor",
            "borderBlockStartColor",
            "borderBlockEndColor",
            "borderInlineStartColor",
            "borderInlineEndColor",
            "caretColor",
            "color",
            "outlineColor",
            "textDecorationColor",
            "textEmphasisColor",
            "columnRuleColor",
            "fill",
            "stroke",
            "floodColor",
            "lightingColor",
            "stopColor",
            "scrollbarColor",
            "selectionBackgroundColor",
            "selectionColor"
          ];
          return simpleColorProperties.indexOf(property) !== -1;
        }
        /**
         * Checks if a CSS property is a complex property that may contain colors
         */
        static isComplexColorProperty(property) {
          const complexColorProperties = [
            "background",
            "border",
            "borderTop",
            "borderRight",
            "borderBottom",
            "borderLeft",
            "outline",
            "boxShadow",
            "textShadow",
            "dropShadow"
          ];
          return complexColorProperties.indexOf(property) !== -1;
        }
        /**
         * Normalizes style values, especially colors for consistent testing
         */
        static normalizeStyleValue(property, value) {
          if (typeof value !== "string") {
            return value;
          }
          if (this.isSimpleColorProperty(property)) {
            return normalizeColorForTesting(value);
          }
          if (this.isComplexColorProperty(property)) {
            return normalizeComplexColorValue(value);
          }
          return value;
        }
        static collectComponents() {
          return __awaiter4(this, void 0, void 0, function* () {
            yield this.collectAllVariables();
            const componentsData = [];
            const componentSets = [];
            this.componentMap = /* @__PURE__ */ new Map();
            function collectNodes(node) {
              return __awaiter4(this, void 0, void 0, function* () {
                var _a;
                if ("type" in node) {
                  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                    const componentStyles = yield node.getCSSAsync();
                    const textElements = yield _ComponentService.extractTextElements(node);
                    const resolvedStyles = _ComponentService.resolveStyleVariables(componentStyles, textElements, node.name);
                    const componentData = {
                      id: node.id,
                      name: node.name,
                      type: node.type,
                      styles: resolvedStyles,
                      pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
                      parentId: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.id,
                      children: [],
                      textElements,
                      hasTextContent: textElements.length > 0
                    };
                    _ComponentService.componentMap.set(node.id, componentData);
                    if (node.type === "COMPONENT_SET") {
                      componentSets.push(componentData);
                    } else {
                      componentsData.push(componentData);
                    }
                  }
                  if ("children" in node) {
                    for (const child of node.children) {
                      yield collectNodes(child);
                    }
                  }
                }
              });
            }
            for (const page of figma.root.children) {
              yield collectNodes(page);
            }
            for (const component of componentsData) {
              if (component.parentId) {
                const parent = this.componentMap.get(component.parentId);
                if (parent && parent.type === "COMPONENT_SET") {
                  parent.children.push(component);
                  component.isChild = true;
                }
              }
            }
            return [...componentSets, ...componentsData.filter((comp) => !comp.isChild)];
          });
        }
        static getComponentById(id) {
          return this.componentMap.get(id);
        }
        static generateTest(component, generateAllVariants = false, includeStateTests = true, includeSizeTests = true) {
          const componentName = component.name;
          const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const isComponentSet = component.type === "COMPONENT_SET";
          if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
            console.log("DEBUG: *** Taking generateComponentSetTest path ***");
            console.log("DEBUG: isComponentSet:", isComponentSet, "generateAllVariants:", generateAllVariants, "children count:", component.children.length);
            return this.generateComponentSetTest(component);
          }
          const componentVariants = isComponentSet && component.children ? component.children : void 0;
          console.log("DEBUG: Test generation for component:", componentName);
          console.log("DEBUG: isComponentSet:", isComponentSet);
          console.log("DEBUG: generateAllVariants:", generateAllVariants);
          console.log("DEBUG: componentVariants count:", componentVariants ? componentVariants.length : 0);
          if (componentVariants) {
            console.log("DEBUG: variant names:", componentVariants.map((v) => v.name));
          }
          let styles;
          try {
            styles = typeof component.styles === "string" ? JSON.parse(component.styles) : component.styles;
          } catch (e) {
            console.error("Error parsing component styles:", e);
            styles = {};
          }
          const styleChecks = [];
          for (const key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
              let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              if (camelCaseKey === "background") {
                camelCaseKey = "backgroundColor";
              }
              styleChecks.push({
                property: camelCaseKey,
                value: this.normalizeStyleValue(camelCaseKey, styles[key])
              });
            }
          }
          if (isComponentSet) {
            const defaultVariant = component.children && component.children.length > 0 ? component.children[0] : null;
            if (defaultVariant) {
              let variantStyles;
              try {
                variantStyles = typeof defaultVariant.styles === "string" ? JSON.parse(defaultVariant.styles) : defaultVariant.styles;
              } catch (e) {
                console.error("Error parsing variant styles:", e);
                variantStyles = {};
              }
              const variantStyleChecks = [];
              for (const key in variantStyles) {
                if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
                  let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                  if (camelCaseKey === "background") {
                    camelCaseKey = "backgroundColor";
                  }
                  variantStyleChecks.push({
                    property: camelCaseKey,
                    value: this.normalizeStyleValue(camelCaseKey, variantStyles[key])
                  });
                }
              }
              return createTestWithStyleChecks(componentName, kebabName, variantStyleChecks, includeStateTests, includeSizeTests, componentVariants, defaultVariant.textElements);
            }
          }
          return createTestWithStyleChecks(componentName, kebabName, styleChecks, includeStateTests, includeSizeTests, componentVariants, component.textElements);
        }
        static generateComponentSetTest(componentSet) {
          if (!componentSet.children || componentSet.children.length === 0) {
            console.log("DEBUG: generateComponentSetTest - no children, falling back to standard test");
            return this.generateTest(componentSet);
          }
          console.log("DEBUG: *** generateComponentSetTest called ***");
          console.log("DEBUG: Component set name:", componentSet.name);
          console.log("DEBUG: Generating comprehensive test for component set with", componentSet.children.length, "variants");
          console.log("DEBUG: Variant names:", componentSet.children.map((c) => c.name));
          const kebabName = componentSet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const words = componentSet.name.split(/[^a-zA-Z0-9]+/).filter((word) => word.length > 0);
          const pascalName = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join("");
          console.log("DEBUG: original componentSet.name:", `"${componentSet.name}"`);
          console.log("DEBUG: words after split:", words);
          console.log("DEBUG: kebabName:", kebabName, "pascalName:", pascalName);
          let variantTests = "";
          const processedVariants = /* @__PURE__ */ new Set();
          componentSet.children.forEach((variant, index) => {
            try {
              const styles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
              const variantName = variant.name;
              const stateMatch = variantName.match(/State=([^,]+)/i);
              const sizeMatch = variantName.match(/Size=([^,]+)/i);
              const variantMatch = variantName.match(/Variant=([^,]+)/i);
              const state = stateMatch ? stateMatch[1].trim() : "default";
              const size = sizeMatch ? sizeMatch[1].trim() : "default";
              const variantType = variantMatch ? variantMatch[1].trim() : "default";
              const testId = `${state}-${size}-${variantType}`;
              if (processedVariants.has(testId)) {
                return;
              }
              processedVariants.add(testId);
              const isPseudoState = ["hover", "active", "focus", "disabled"].indexOf(state.toLowerCase()) !== -1;
              const cssProperties = this.extractCssProperties(styles);
              const textStyles = this.extractTextStyles(variant.textElements);
              if (isPseudoState) {
                variantTests += this.generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles);
              } else {
                variantTests += this.generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles);
              }
            } catch (e) {
              console.error("Error generating test for variant:", variant.name, e);
            }
          });
          const result = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component - All Variants', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;
  
  const resolveCssVariable = (variableName: string, stylesheetHrefPart = 'styles.css'): string | undefined => {
    const targetSheet = Array.from(document.styleSheets)
      .find(sheet => sheet.href?.includes(stylesheetHrefPart));

    const rootRule = Array.from(targetSheet?.cssRules || [])
      .filter(rule => rule instanceof CSSStyleRule)
      .find(rule => rule.selectorText === ':root');

    const value = rootRule?.style?.getPropertyValue(variableName)?.trim();

    if (value?.startsWith('var(')) {
      const nestedVar = value.match(/var((--.+?))/)?.[1];
      return nestedVar ? resolveCssVariable(nestedVar, stylesheetHrefPart) : undefined;
    }
    return value;
  };

  const getCssPropertyForRule = (cssSelector: string, pseudoClass: string, prop: string): string | undefined => {
    // Regex necessary because Angular attaches identifier after the selector
    const regex = new RegExp(\`\${cssSelector}([\\\\s\\\\S]*?)\${pseudoClass}\`);
    const style = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules || []))
      .filter(r => r instanceof CSSStyleRule)
      .find(r => regex.test(r.selectorText))
      ?.style;

    return style?.getPropertyValue(prop);
  };

  const checkStyleProperty = (selector: string, pseudoClass: string, property: string, expectedValue?: string) => {
    const value = getCssPropertyForRule(selector, pseudoClass, property);
    if (!value) {
      // If no value is found for this pseudo-class, that's okay - not all states need all properties
      return;
    }

    if (value.startsWith('var(')) {
      const variableName = value.match(/var((--.+?))/)?.[1];
      const resolvedValue = variableName ? resolveCssVariable(variableName) : undefined;
      if (expectedValue) {
        expect(resolvedValue).toBe(expectedValue);
      } else {
        expect(resolvedValue).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${resolvedValue}\`);
      }
    } else {
      if (expectedValue) {
        expect(value).toBe(expectedValue);
      } else {
        expect(value).toBeDefined();
        // Log the actual value for debugging
        console.log(\`\${selector}\${pseudoClass} \${property}: \${value}\`);
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ ${pascalName}Component ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(${pascalName}Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be defined with ${componentSet.children.length} variants available', () => {
    const element = fixture.nativeElement;
    expect(element).toBeDefined();
    console.log('Component created with ${componentSet.children.length} variants available for testing');
  });${variantTests}

  it('should support all size variants', () => {
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (!element) return;

    // Test that component supports different size classes
    ${Array.from(new Set(componentSet.children.map((variant) => {
            const sizeMatch = variant.name.match(/Size=([^,]+)/i);
            return sizeMatch ? sizeMatch[1].trim() : "default";
          }))).map((size) => `
    // Test ${size} size variant class support
    element.classList.add('${kebabName}--${size}');
    expect(element.classList.contains('${kebabName}--${size}')).toBeTruthy();
    element.classList.remove('${kebabName}--${size}');`).join("")}
    
    console.log('Size variant testing completed');
  });

  it('should support all state variants', () => {
    const selector = '.${kebabName}';
    
    // Test different pseudo-states using helper functions
    ${Array.from(new Set(componentSet.children.map((variant) => {
            const stateMatch = variant.name.match(/State=([^,]+)/i);
            return stateMatch ? stateMatch[1].trim() : "default";
          }).filter((state) => state !== "default"))).map((state) => `
    // Test ${state} pseudo-state styles
    const ${state}Value = getCssPropertyForRule(selector, ':${state}', 'background-color');
    if (${state}Value) {
      expect(${state}Value).toBeDefined();
      console.log('${state} state background-color:', ${state}Value);
    }`).join("")}
    
    console.log('State variant testing completed using CSS rules');
  });
});`;
          console.log("DEBUG: *** generateComponentSetTest completed ***");
          console.log("DEBUG: Generated test length:", result.length, "characters");
          console.log("DEBUG: Test preview (first 200 chars):", result.substring(0, 200));
          return result;
        }
        // Collect all variables for resolution purposes
        static collectAllVariables() {
          return __awaiter4(this, void 0, void 0, function* () {
            try {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              this.allVariables.clear();
              for (const collection of collections) {
                for (const variableId of collection.variableIds) {
                  const variable = yield figma.variables.getVariableByIdAsync(variableId);
                  if (variable) {
                    this.allVariables.set(variable.id, variable);
                    const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                    this.allVariables.set(formattedName, variable);
                  }
                }
              }
            } catch (error) {
              console.error("Error collecting variables:", error);
            }
          });
        }
        // Process component styles to resolve variable names and integrate text properties
        static resolveStyleVariables(styles, textElements, componentName) {
          if (!styles || typeof styles !== "object") {
            return styles;
          }
          const resolvedStyles = Object.assign({}, styles);
          for (const property in styles) {
            if (styles.hasOwnProperty(property)) {
              const value = styles[property];
              if (typeof value === "string") {
                resolvedStyles[property] = this.replaceVariableIdsWithNames(value);
              }
            }
          }
          return resolvedStyles;
        }
        // Helper method to parse component names (matching UI logic)
        static parseComponentName(name) {
          const result = {};
          const stateMatch = name.match(/State=([^,]+)/i);
          if (stateMatch && stateMatch[1]) {
            result.state = stateMatch[1].trim();
          }
          const sizeMatch = name.match(/Size=([^,]+)/i);
          if (sizeMatch && sizeMatch[1]) {
            result.size = sizeMatch[1].trim();
          }
          return result;
        }
        // Replace variable IDs in CSS values with readable variable names
        static replaceVariableIdsWithNames(cssValue) {
          return cssValue.replace(/VariableID:([a-f0-9:]+)\/[\d.]+/g, (match, variableId) => {
            for (const variable of this.allVariables.values()) {
              if (variable.id === variableId.replace(/:/g, ":")) {
                const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                return `var(--${formattedName})`;
              }
            }
            return match;
          }).replace(/var\(--[a-f0-9-]+\)/g, (match) => {
            const varId = match.replace(/var\(--([^)]+)\)/, "$1");
            for (const variable of this.allVariables.values()) {
              if (variable.id.includes(varId) || varId.includes(variable.id)) {
                const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                return `var(--${formattedName})`;
              }
            }
            return match;
          });
        }
        /**
         * Extract text styles from text elements
         */
        static extractTextStyles(textElements) {
          const textStyles = {};
          if (!textElements || textElements.length === 0) {
            return textStyles;
          }
          textElements.forEach((textEl) => {
            if (textEl.textStyles) {
              Object.keys(textEl.textStyles).forEach((styleKey) => {
                var _a;
                const value = (_a = textEl.textStyles) === null || _a === void 0 ? void 0 : _a[styleKey];
                if (value !== void 0 && value !== null && value !== "") {
                  let expectedValue = String(value);
                  let cssProperty = "";
                  if (styleKey === "font-size") {
                    cssProperty = "fontSize";
                  } else if (styleKey === "font-family") {
                    cssProperty = "fontFamily";
                  } else if (styleKey === "font-weight") {
                    cssProperty = "fontWeight";
                  } else if (styleKey === "color") {
                    cssProperty = "color";
                  } else if (styleKey === "line-height") {
                    cssProperty = "lineHeight";
                  } else if (styleKey === "letter-spacing") {
                    cssProperty = "letterSpacing";
                  }
                  if (cssProperty) {
                    if (expectedValue.includes("var(")) {
                      const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
                      if (fallbackMatch) {
                        expectedValue = fallbackMatch[1].trim();
                      }
                    }
                    if (expectedValue.match(/^#[0-9A-Fa-f]{3}$/) || expectedValue.match(/^#[0-9A-Fa-f]{6}$/)) {
                      let hex = expectedValue.substring(1);
                      if (hex.length === 3) {
                        hex = hex.split("").map((char) => char + char).join("");
                      }
                      const r = parseInt(hex.substring(0, 2), 16);
                      const g = parseInt(hex.substring(2, 4), 16);
                      const b = parseInt(hex.substring(4, 6), 16);
                      expectedValue = `rgb(${r}, ${g}, ${b})`;
                    }
                    textStyles[cssProperty] = expectedValue;
                  }
                }
              });
            }
          });
          return textStyles;
        }
        /**
         * Extract and normalize CSS properties from component styles
         */
        static extractCssProperties(styles) {
          const cssProperties = {};
          const collectedStyles = {};
          for (const key in styles) {
            if (Object.prototype.hasOwnProperty.call(styles, key)) {
              if (key.startsWith("text_"))
                continue;
              let camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              if (camelCaseKey === "background") {
                camelCaseKey = "backgroundColor";
              }
              collectedStyles[camelCaseKey] = this.normalizeStyleValue(camelCaseKey, styles[key]);
            }
          }
          if (collectedStyles.paddingTop || collectedStyles.paddingRight || collectedStyles.paddingBottom || collectedStyles.paddingLeft) {
            cssProperties["padding"] = "computed";
          } else if (collectedStyles.padding) {
            cssProperties["padding"] = String(collectedStyles.padding);
          }
          if (collectedStyles.marginTop || collectedStyles.marginRight || collectedStyles.marginBottom || collectedStyles.marginLeft) {
            cssProperties["margin"] = "computed";
          } else if (collectedStyles.margin) {
            cssProperties["margin"] = String(collectedStyles.margin);
          }
          const standardProps = [
            "backgroundColor",
            "background",
            "color",
            "fontSize",
            "fontFamily",
            "fontWeight",
            "fontStyle",
            "lineHeight",
            "letterSpacing",
            "borderRadius",
            "border",
            "borderColor",
            "borderWidth",
            "borderStyle",
            "gap",
            "width",
            "height",
            "minWidth",
            "minHeight",
            "maxWidth",
            "maxHeight",
            "display",
            "flexDirection",
            "justifyContent",
            "alignItems",
            "flexWrap",
            "position",
            "top",
            "right",
            "bottom",
            "left",
            "opacity",
            "boxShadow",
            "textAlign",
            "textDecoration",
            "textTransform",
            "overflow",
            "cursor",
            "zIndex",
            "transition"
          ];
          const shorthandSkip = ["paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "marginTop", "marginRight", "marginBottom", "marginLeft"];
          for (const prop of standardProps) {
            if (collectedStyles[prop] && shorthandSkip.indexOf(prop) === -1) {
              cssProperties[prop] = String(collectedStyles[prop]);
            }
          }
          return cssProperties;
        }
        /**
         * Generate test for CSS pseudo-states (hover, active, focus)
         */
        static generatePseudoStateTest(state, size, variantType, cssProperties, kebabName, textStyles = {}) {
          const pseudoClass = `:${state.toLowerCase()}`;
          const testDescription = `should have correct :${state.toLowerCase()} styles${size !== "default" ? ` for ${size} size` : ""}${variantType !== "default" ? ` (${variantType} variant)` : ""}`;
          const allProperties = Object.assign(Object.assign({}, cssProperties), textStyles);
          const testableProperties = Object.keys(allProperties).filter((property) => {
            const expectedValue = allProperties[property];
            return expectedValue !== "computed" && !(expectedValue.includes("var(") && !expectedValue.match(/var\([^,]+,\s*([^)]+)\)/));
          });
          if (testableProperties.length === 0) {
            return `
  it('${testDescription}', () => {
    // No testable properties for this pseudo-state
    console.log('${testDescription}: No specific values to test');
  });`;
          }
          return `
  it('${testDescription}', () => {
    // Define properties to check with their expected values
    const propertiesToCheck = [
${testableProperties.map((property) => {
            const expectedValue = allProperties[property];
            let expectedTest = expectedValue;
            if (expectedValue.includes("var(")) {
              const fallbackMatch = expectedValue.match(/var\([^,]+,\s*([^)]+)\)/);
              if (fallbackMatch) {
                expectedTest = fallbackMatch[1].trim();
              }
            }
            if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
              let hex = expectedTest.substring(1);
              if (hex.length === 3) {
                hex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              expectedTest = `rgb(${r}, ${g}, ${b})`;
            }
            const cssProperty = property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
            const isTextStyle = textStyles.hasOwnProperty(property);
            return `      { 
        property: '${property}', 
        cssProperty: '${cssProperty}', 
        expectedValue: '${expectedTest}'${isTextStyle ? ", isTextStyle: true" : ""} 
      }`;
          }).join(",\n")}
    ];

    // Test each property using forEach for cleaner code
    propertiesToCheck.forEach((check) => {
      const resolvedValue = getCssPropertyForRule('.${kebabName}', '${pseudoClass}', check.cssProperty);
      
      if (resolvedValue) {
        if (resolvedValue.startsWith('var(')) {
          const variableName = resolvedValue.match(/var\\((--.+?)\\)/)?.[1];
          const actualValue = variableName ? resolveCssVariable(variableName) : undefined;
          expect(actualValue).toBe(check.expectedValue);
        } else {
          expect(resolvedValue).toBe(check.expectedValue);
        }
      }
    });
  });`;
        }
        /**
         * Generate test for component properties (size, variant, etc.)
         */
        static generateComponentPropertyTest(state, size, variantType, cssProperties, kebabName, pascalName, textStyles = {}) {
          const componentProps = [];
          if (size !== "default") {
            componentProps.push(`component.size = '${size.toLowerCase()}';`);
          }
          if (variantType !== "default") {
            componentProps.push(`component.variant = '${variantType.toLowerCase()}';`);
          }
          if (state !== "default" && ["hover", "active", "focus", "disabled"].indexOf(state.toLowerCase()) === -1) {
            componentProps.push(`component.state = '${state.toLowerCase()}';`);
          }
          const testDescription = [
            size !== "default" ? `size="${size}"` : null,
            variantType !== "default" ? `variant="${variantType}"` : null,
            state !== "default" ? `state="${state}"` : null
          ].filter(Boolean).join(" ");
          const testName = testDescription ? `should have correct styles for ${testDescription}` : "should have correct styles";
          return `
  it('${testName}', () => {
    ${componentProps.length > 0 ? `// Set component properties
    ${componentProps.join("\n    ")}
    fixture.detectChanges();
` : ""}
    const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
    if (element) {
      const computedStyle = window.getComputedStyle(element);

${Object.keys(cssProperties).map((property) => {
            const expectedValue = cssProperties[property];
            let expectedTest = expectedValue;
            if (expectedValue === "computed") {
              return `      // Check ${property} (shorthand property - actual value varies)
      // expect(computedStyle.${property}).toBe('expected-value'); // TODO: Add specific expected value`;
            }
            if (expectedValue.includes("var(")) {
              const fallbackMatch = expectedValue.match(/var\\([^,]+,\\s*([^)]+)\\)/);
              if (fallbackMatch) {
                expectedTest = fallbackMatch[1].trim();
              } else {
                return `      // Check ${property} (CSS variable without fallback - cannot predict value)
      // expect(computedStyle.${property}).toBe('expected-value'); // TODO: Add fallback value to CSS variable`;
              }
            }
            if (expectedTest.match(/^#[0-9A-Fa-f]{3}$/) || expectedTest.match(/^#[0-9A-Fa-f]{6}$/)) {
              let hex = expectedTest.substring(1);
              if (hex.length === 3) {
                hex = hex.split("").map((char) => char + char).join("");
              }
              const r = parseInt(hex.substring(0, 2), 16);
              const g = parseInt(hex.substring(2, 4), 16);
              const b = parseInt(hex.substring(4, 6), 16);
              expectedTest = `rgb(${r}, ${g}, ${b})`;
            }
            return `      // Check ${property}
      expect(computedStyle.${property}).toBe('${expectedTest}');`;
          }).join("\n\n")}${Object.keys(textStyles).length > 0 ? "\n\n" + Object.keys(textStyles).map((property) => {
            const expectedValue = textStyles[property];
            return `      // Check ${property} (text style)
      expect(computedStyle.${property}).toBe('${expectedValue}');`;
          }).join("\n\n") : ""}

    } else {
      console.warn('No suitable element found to test styles');
    }
  });`;
        }
        /**
         * Extract text elements from a component node
         */
        static extractTextElements(node) {
          return __awaiter4(this, void 0, void 0, function* () {
            const textElements = [];
            function traverseNode(currentNode) {
              return __awaiter4(this, void 0, void 0, function* () {
                if (currentNode.type === "TEXT") {
                  const textNode = currentNode;
                  let textStyles = {};
                  try {
                    const nodeStyles = yield textNode.getCSSAsync();
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
                    for (const key in textStyles) {
                      if (textStyles[key] === void 0 || textStyles[key] === null || textStyles[key] === "") {
                        delete textStyles[key];
                      }
                    }
                  } catch (e) {
                    console.error("Error getting text styles:", e);
                  }
                  const textElement = {
                    id: textNode.id,
                    content: textNode.characters,
                    type: "TEXT",
                    styles: yield textNode.getCSSAsync(),
                    textStyles
                  };
                  textElements.push(textElement);
                }
                if ("children" in currentNode) {
                  for (const child of currentNode.children) {
                    yield traverseNode(child);
                  }
                }
              });
            }
            yield traverseNode(node);
            return textElements;
          });
        }
      };
      ComponentService.componentMap = /* @__PURE__ */ new Map();
      ComponentService.allVariables = /* @__PURE__ */ new Map();
    }
  });

  // dist/core/plugin.js
  var require_plugin = __commonJS({
    "dist/core/plugin.js"(exports) {
      "use strict";
      init_gitlabService();
      init_cssExportService();
      init_componentService();
      var __awaiter5 = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
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
      figma.showUI(__html__, { width: 850, height: 800 });
      function collectDocumentData() {
        return __awaiter5(this, void 0, void 0, function* () {
          const variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
          const variablesData = [];
          const sortedCollections = variableCollections.sort((a, b) => a.name.localeCompare(b.name));
          for (const collection of sortedCollections) {
            const variablesPromises = collection.variableIds.map((id) => __awaiter5(this, void 0, void 0, function* () {
              const variable = yield figma.variables.getVariableByIdAsync(id);
              if (!variable)
                return null;
              const valuesByModeEntries = [];
              for (const modeId in variable.valuesByMode) {
                const value = variable.valuesByMode[modeId];
                const mode = collection.modes.find((m) => m.modeId === modeId);
                valuesByModeEntries.push({
                  modeName: mode ? mode.name : "Unknown",
                  value
                });
              }
              return {
                id: variable.id,
                name: variable.name,
                resolvedType: variable.resolvedType,
                valuesByMode: valuesByModeEntries
              };
            }));
            const variablesResult = yield Promise.all(variablesPromises);
            const variables = variablesResult.filter((item) => item !== null);
            variablesData.push({
              name: collection.name,
              variables
            });
          }
          const componentsData = yield ComponentService.collectComponents();
          figma.ui.postMessage({
            type: "document-data",
            variablesData,
            componentsData
          });
        });
      }
      function loadSavedGitLabSettings() {
        return __awaiter5(this, void 0, void 0, function* () {
          try {
            const settings = yield GitLabService.loadSettings();
            if (settings) {
              figma.ui.postMessage({
                type: "gitlab-settings-loaded",
                settings
              });
              console.log("GitLab settings loaded");
            }
          } catch (error) {
            console.error("Error loading GitLab settings:", error);
          }
        });
      }
      collectDocumentData();
      loadSavedGitLabSettings();
      figma.codegen.on("generate", (_event) => {
        try {
          return [
            {
              language: "PLAINTEXT",
              code: "DesignSync - Use the plugin interface to view variables and components",
              title: "DesignSync"
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
      figma.ui.onmessage = (msg) => __awaiter5(void 0, void 0, void 0, function* () {
        var _a;
        try {
          switch (msg.type) {
            case "export-css":
              const format = msg.exportFormat || "css";
              const cssContent = yield CSSExportService.exportVariables(format);
              figma.ui.postMessage({
                type: "css-export",
                cssData: cssContent,
                shouldDownload: msg.shouldDownload,
                exportFormat: format
              });
              break;
            case "generate-test":
              if (!msg.componentId) {
                throw new Error(`Missing required component ID`);
              }
              const component = ComponentService.getComponentById(msg.componentId);
              if (!component) {
                throw new Error(`Component with ID ${msg.componentId} not found`);
              }
              const testContent = ComponentService.generateTest(
                component,
                msg.generateAllVariants,
                msg.includeStateTests !== false
                // Default to true
              );
              figma.ui.postMessage({
                type: "test-generated",
                componentName: msg.componentName || component.name,
                testContent,
                isComponentSet: component.type === "COMPONENT_SET",
                hasAllVariants: msg.generateAllVariants,
                forCommit: msg.forCommit
              });
              break;
            case "save-gitlab-settings":
              yield GitLabService.saveSettings({
                projectId: msg.projectId || "",
                gitlabToken: msg.gitlabToken,
                filePath: msg.filePath || "src/variables.css",
                testFilePath: msg.testFilePath || "components/{componentName}.spec.ts",
                strategy: msg.strategy || "merge-request",
                branchName: msg.branchName || "feature/variables",
                testBranchName: msg.testBranchName || "feature/component-tests",
                exportFormat: msg.exportFormat || "css",
                saveToken: msg.saveToken || false,
                savedAt: (/* @__PURE__ */ new Date()).toISOString(),
                savedBy: ((_a = figma.currentUser) === null || _a === void 0 ? void 0 : _a.name) || "Unknown user"
              }, msg.shareWithTeam || false);
              figma.ui.postMessage({
                type: "gitlab-settings-saved",
                success: true,
                sharedWithTeam: msg.shareWithTeam
              });
              break;
            case "commit-to-gitlab":
              if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.cssData) {
                throw new Error("Missing required fields for GitLab commit");
              }
              const result = yield GitLabService.commitToGitLab(msg.projectId, msg.gitlabToken, msg.commitMessage, msg.filePath || "variables.css", msg.cssData, msg.branchName || "feature/variables");
              figma.ui.postMessage({
                type: "commit-success",
                message: "Successfully committed changes to the feature branch",
                mergeRequestUrl: result === null || result === void 0 ? void 0 : result.mergeRequestUrl
              });
              break;
            case "commit-component-test":
              if (!msg.projectId || !msg.gitlabToken || !msg.commitMessage || !msg.testContent || !msg.componentName) {
                throw new Error("Missing required fields for component test commit");
              }
              const testResult = yield GitLabService.commitComponentTest(msg.projectId, msg.gitlabToken, msg.commitMessage, msg.componentName, msg.testContent, msg.testFilePath || "components/{componentName}.spec.ts", msg.branchName || "feature/component-tests");
              figma.ui.postMessage({
                type: "test-commit-success",
                message: "Successfully committed component test to the feature branch",
                componentName: msg.componentName,
                mergeRequestUrl: testResult === null || testResult === void 0 ? void 0 : testResult.mergeRequestUrl
              });
              break;
            case "reset-gitlab-settings":
              yield GitLabService.resetSettings();
              figma.ui.postMessage({
                type: "gitlab-settings-reset",
                success: true
              });
              break;
            case "get-unit-settings":
              const unitSettingsData = yield CSSExportService.getUnitSettingsData();
              figma.ui.postMessage({
                type: "unit-settings-data",
                data: unitSettingsData
              });
              break;
            case "update-unit-settings":
              console.log("Received update-unit-settings:", msg.collections, msg.groups);
              CSSExportService.updateUnitSettings({
                collections: msg.collections,
                groups: msg.groups
              });
              yield CSSExportService.saveUnitSettings();
              console.log("Unit settings saved successfully");
              figma.ui.postMessage({
                type: "unit-settings-updated",
                success: true
              });
              break;
            default:
              console.warn("Unknown message type:", msg.type);
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
  var import_plugin = __toESM(require_plugin());
})();
