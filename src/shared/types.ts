// Shared types for the aWall Synch plugin

export interface VariableData {
  id: string;
  name: string;
  variableType: string;
  valuesByMode: Array<{
    modeName: string;
    value: any;
  }>;
}

export interface VariableCollectionData {
  name: string;
  variables: VariableData[];
}

export interface ComponentData {
  id: string;
  name: string;
  type: string;
  styles: string;
  pageName: string;
  parentId?: string;
  children: ComponentData[];
  isChild?: boolean;
}

export interface GitLabSettings {
  projectId: string;
  gitlabToken?: string;
  saveToken?: boolean;
  savedAt?: string;
  savedBy?: string;
  branchName?: string;
  filePath?: string;
  testPath?: string;
  componentTestPath?: string;
  createMergeRequest?: boolean;
  branchStrategy?: string;
  featurePrefix?: string;
}

export interface PluginMessage {
  type: string;
  [key: string]: any;
}

export interface TestGenerationOptions {
  componentId: string;
  componentName: string;
  generateAllVariants?: boolean;
  commitToGitLab?: boolean;
}

export interface GitLabCommitOptions {
  projectId: string;
  gitlabToken: string;
  commitMessage: string;
  filePath: string;
  branchName?: string;
  content: string;
  createMergeRequest?: boolean;
}