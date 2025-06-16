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
                figma.root.setSharedPluginData("aWallSync", settingsKey, JSON.stringify(settingsToSave));
                console.log(`GitLab settings saved to shared document storage for file: ${figmaFileId}`);
                if (settings.saveToken && settings.gitlabToken) {
                  yield figma.clientStorage.setAsync(`${settingsKey}-token`, settings.gitlabToken);
                  console.log("Token saved to personal storage");
                }
              } else {
                yield figma.clientStorage.setAsync(settingsKey, settings);
                console.log(`GitLab settings saved to personal storage only for file: ${figmaFileId}`);
              }
              figma.root.setSharedPluginData("aWallSync", `${settingsKey}-meta`, JSON.stringify({
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
              const documentSettings = figma.root.getSharedPluginData("aWallSync", settingsKey);
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
                  const metaData = figma.root.getSharedPluginData("aWallSync", `${settingsKey}-meta`);
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
              const legacyDocumentSettings = figma.root.getSharedPluginData("aWallSync", "gitlab-settings");
              if (legacyDocumentSettings) {
                try {
                  const settings = JSON.parse(legacyDocumentSettings);
                  console.log("Found legacy document settings in this file, migrating to project-specific storage");
                  yield this.saveSettings(settings, true);
                  figma.root.setSharedPluginData("aWallSync", "gitlab-settings", "");
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
              figma.root.setSharedPluginData("aWallSync", settingsKey, "");
              figma.root.setSharedPluginData("aWallSync", `${settingsKey}-meta`, "");
              yield figma.clientStorage.deleteAsync(settingsKey);
              yield figma.clientStorage.deleteAsync(`${settingsKey}-token`);
              figma.root.setSharedPluginData("aWallSync", "gitlab-settings", "");
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
              if (errorData.message !== "Branch already exists") {
                throw new Error(errorData.message || "Failed to create branch");
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
        static createMergeRequest(projectId, gitlabToken, sourceBranch, targetBranch, title) {
          return __awaiter(this, void 0, void 0, function* () {
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
                description: "Automatically created merge request for CSS variables update",
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
      };
      GitLabService.GITLAB_API_BASE = "https://gitlab.fhnw.ch/api/v4";
    }
  });

  // dist/services/cssExportService.js
  var __awaiter2, CSSExportService;
  var init_cssExportService = __esm({
    "dist/services/cssExportService.js"() {
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
      CSSExportService = class {
        static exportVariables() {
          return __awaiter2(this, void 0, void 0, function* () {
            try {
              const collections = yield figma.variables.getLocalVariableCollectionsAsync();
              let cssContent = "/* Figma Variables Export */\n";
              cssContent += `/* Generated: ${(/* @__PURE__ */ new Date()).toLocaleString()} */

`;
              cssContent += ":root {\n";
              for (const collection of collections) {
                let hasValidVariables = false;
                let collectionContent = `  /* ${collection.name} */
`;
                for (const variableId of collection.variableIds) {
                  const variable = yield figma.variables.getVariableByIdAsync(variableId);
                  if (!variable)
                    continue;
                  const defaultModeId = collection.modes[0].modeId;
                  const value = variable.valuesByMode[defaultModeId];
                  if (value && typeof value === "object" && "type" in value && value.type === "VARIABLE_ALIAS") {
                    continue;
                  }
                  const formattedName = variable.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
                  const formattedValue = this.formatVariableValue(variable.resolvedType, value, variable.name);
                  if (formattedValue === null)
                    continue;
                  collectionContent += `  --${formattedName}: ${formattedValue};
`;
                  hasValidVariables = true;
                }
                if (hasValidVariables) {
                  cssContent += collectionContent + "\n";
                }
              }
              cssContent += "}\n\n";
              cssContent += "@media (prefers-color-scheme: dark) {\n";
              cssContent += "  :root {\n";
              cssContent += "    /* Dark mode overrides can be added here */\n";
              cssContent += "  }\n";
              cssContent += "}\n";
              cssContent += this.addUsageExamples();
              return cssContent;
            } catch (error) {
              console.error("Error exporting CSS:", error);
              throw new Error(`Error exporting CSS: ${error.message || "Unknown error"}`);
            }
          });
        }
        static formatVariableValue(type, value, name) {
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
                if (name.toLowerCase().includes("size") || name.toLowerCase().includes("padding") || name.toLowerCase().includes("margin") || name.toLowerCase().includes("radius") || name.toLowerCase().includes("gap") || name.toLowerCase().includes("stroke")) {
                  return `${value}px`;
                }
                return String(value);
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
        static addUsageExamples() {
          return `/* ---------------------------------------------------------- */
/* Usage Examples */
/* ---------------------------------------------------------- */

/* Example usage of variables */
.example-element {
  color: var(--primary-color);
  background-color: var(--background-color);
  padding: var(--spacing-medium);
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}
`;
        }
      };
    }
  });

  // dist/utils/componentUtils.js
  function parseComponentName(name) {
    const result = {
      name,
      type: null,
      state: null
    };
    const typeMatch = name.match(/Type=([^,]+)/i);
    if (typeMatch && typeMatch[1]) {
      result.type = typeMatch[1].trim();
    }
    const stateMatch = name.match(/State=([^,]+)/i);
    if (stateMatch && stateMatch[1]) {
      result.state = stateMatch[1].trim();
    }
    return result;
  }
  function generateStyleChecks(styleChecks) {
    if (styleChecks.length === 0) {
      return "        // No style properties to check";
    }
    return styleChecks.map((check) => {
      return `        // Check ${check.property}
        expect(computedStyle.${check.property}).toBe('${check.value}');`;
    }).join("\n\n");
  }
  function createTestWithStyleChecks(componentName, kebabName, styleChecks) {
    const styleCheckCode = styleChecks.length > 0 ? styleChecks.map((check) => {
      return `      // Check ${check.property}
      expect(computedStyle.${check.property}).toBe('${check.value}');`;
    }).join("\n\n") : "      // No style properties to check";
    const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");
    return `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${pascalName}Component ]
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
  });
});`;
  }
  var init_componentUtils = __esm({
    "dist/utils/componentUtils.js"() {
      "use strict";
    }
  });

  // dist/services/componentService.js
  var __awaiter3, ComponentService;
  var init_componentService = __esm({
    "dist/services/componentService.js"() {
      "use strict";
      init_componentUtils();
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
      ComponentService = class _ComponentService {
        static collectComponents() {
          return __awaiter3(this, void 0, void 0, function* () {
            const componentsData = [];
            const componentSets = [];
            this.componentMap = /* @__PURE__ */ new Map();
            function collectNodes(node) {
              return __awaiter3(this, void 0, void 0, function* () {
                var _a;
                if ("type" in node) {
                  if (node.type === "COMPONENT" || node.type === "COMPONENT_SET") {
                    const componentStyles = yield node.getCSSAsync();
                    const componentData = {
                      id: node.id,
                      name: node.name,
                      type: node.type,
                      styles: componentStyles,
                      pageName: node.parent && "name" in node.parent ? node.parent.name : "Unknown",
                      parentId: (_a = node.parent) === null || _a === void 0 ? void 0 : _a.id,
                      children: []
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
        static generateTest(component, generateAllVariants = false) {
          const componentName = component.name;
          const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const isComponentSet = component.type === "COMPONENT_SET";
          if (isComponentSet && generateAllVariants && component.children && component.children.length > 0) {
            return this.generateComponentSetTest(component);
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
              const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
              styleChecks.push({
                property: camelCaseKey,
                value: styles[key]
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
                  const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                  variantStyleChecks.push({
                    property: camelCaseKey,
                    value: variantStyles[key]
                  });
                }
              }
              return createTestWithStyleChecks(componentName, kebabName, variantStyleChecks);
            }
          }
          return createTestWithStyleChecks(componentName, kebabName, styleChecks);
        }
        static generateComponentSetTest(componentSet) {
          if (!componentSet.children || componentSet.children.length === 0) {
            return this.generateTest(componentSet);
          }
          const componentName = componentSet.name;
          const kebabName = componentName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const pascalName = componentName.replace(/[^a-zA-Z0-9]/g, "");
          let testContent = `import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ${pascalName}Component } from './${kebabName}.component';

describe('${pascalName}Component', () => {
  let component: ${pascalName}Component;
  let fixture: ComponentFixture<${pascalName}Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ${pascalName}Component ]
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

`;
          componentSet.children.forEach((variant, index) => {
            const parsedName = parseComponentName(variant.name);
            const variantDesc = parsedName.state ? `in '${parsedName.state}' state` : parsedName.type ? `of type '${parsedName.type}'` : `variant ${index + 1}`;
            let variantStyles;
            try {
              variantStyles = typeof variant.styles === "string" ? JSON.parse(variant.styles) : variant.styles;
            } catch (e) {
              console.error("Error parsing variant styles:", e);
              variantStyles = {};
            }
            const styleChecks = [];
            for (const key in variantStyles) {
              if (Object.prototype.hasOwnProperty.call(variantStyles, key)) {
                const camelCaseKey = key.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                styleChecks.push({
                  property: camelCaseKey,
                  value: variantStyles[key]
                });
              }
            }
            const stateVar = parsedName.state ? parsedName.state.toLowerCase().replace(/\s+/g, "") : "default";
            testContent += `  describe('${variantDesc}', () => {
    it('should have correct styles', () => {
      // Set component to the ${variantDesc} state
      component.state = '${stateVar}';
      fixture.detectChanges();

      const element = fixture.nativeElement.querySelector('button, div, span, a, p, h1, h2, h3, h4, h5, h6');
      if (element) {
        const computedStyle = window.getComputedStyle(element);

${generateStyleChecks(styleChecks)}
      } else {
        console.warn('No suitable element found to test styles');
      }
    });
  });

`;
          });
          testContent += `});
`;
          return testContent;
        }
      };
      ComponentService.componentMap = /* @__PURE__ */ new Map();
    }
  });

  // dist/core/plugin.js
  var require_plugin = __commonJS({
    "dist/core/plugin.js"(exports) {
      "use strict";
      init_gitlabService();
      init_cssExportService();
      init_componentService();
      var __awaiter4 = exports && exports.__awaiter || function(thisArg, _arguments, P, generator) {
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
        return __awaiter4(this, void 0, void 0, function* () {
          const variableCollections = yield figma.variables.getLocalVariableCollectionsAsync();
          const variablesData = [];
          for (const collection of variableCollections) {
            const variablesPromises = collection.variableIds.map((id) => __awaiter4(this, void 0, void 0, function* () {
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
        return __awaiter4(this, void 0, void 0, function* () {
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
              code: "aWall Synch - Use the plugin interface to view variables and components",
              title: "aWall Synch"
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
      figma.ui.onmessage = (msg) => __awaiter4(void 0, void 0, void 0, function* () {
        var _a;
        try {
          switch (msg.type) {
            case "export-css":
              const cssContent = yield CSSExportService.exportVariables();
              figma.ui.postMessage({
                type: "css-export",
                cssData: cssContent,
                shouldDownload: msg.shouldDownload
              });
              break;
            case "generate-test":
              const component = ComponentService.getComponentById(msg.componentId || "");
              if (!component) {
                throw new Error(`Component with ID ${msg.componentId} not found`);
              }
              const testContent = ComponentService.generateTest(component, msg.generateAllVariants);
              figma.ui.postMessage({
                type: "test-generated",
                componentName: msg.componentName || component.name,
                testContent,
                isComponentSet: component.type === "COMPONENT_SET",
                hasAllVariants: msg.generateAllVariants
              });
              break;
            case "save-gitlab-settings":
              yield GitLabService.saveSettings({
                projectId: msg.projectId || "",
                gitlabToken: msg.gitlabToken,
                filePath: msg.filePath || "src/variables.css",
                strategy: msg.strategy || "merge-request",
                branchName: msg.branchName || "feature/variables",
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
            case "reset-gitlab-settings":
              yield GitLabService.resetSettings();
              figma.ui.postMessage({
                type: "gitlab-settings-reset",
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
