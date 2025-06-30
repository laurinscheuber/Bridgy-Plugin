export interface VariableCollection {
  name: string;
  variables: Variable[];
}

export interface Variable {
  id: string;
  name: string;
  resolvedType: string;
  valuesByMode: VariableMode[];
}

export interface VariableMode {
  modeName: string;
  value: any;
}

export interface Component {
  id: string;
  name: string;
  type: string;
  styles: any;
  pageName: string;
  parentId?: string;
  children: Component[];
  isChild?: boolean;
}

export interface GitLabSettings {
  projectId: string;
  gitlabToken?: string;
  filePath?: string;
  testFilePath?: string;
  strategy?: string;
  branchName?: string;
  testBranchName?: string;
  saveToken: boolean;
  savedAt: string;
  savedBy: string;
  isPersonal?: boolean;
}

export interface StyleCheck {
  property: string;
  value: string;
}

export interface ParsedComponentName {
  name: string;
  type: string | null;
  state: string | null;
}

export interface PluginMessage {
  type: string;
  language?: string;
  componentId?: string;
  componentName?: string;
  projectId?: string;
  gitlabToken?: string;
  commitMessage?: string;
  filePath?: string;
  testFilePath?: string;
  strategy?: string;
  branchName?: string;
  testBranchName?: string;
  cssData?: string;
  testContent?: string;
  shareWithTeam?: boolean;
  saveToken?: boolean;
  generateAllVariants?: boolean;
  shouldDownload?: boolean;
  forceCreate?: boolean;
  forCommit?: boolean;
  collections?: {[key: string]: string};
  groups?: {[key: string]: string};
} 