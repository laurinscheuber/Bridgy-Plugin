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

export interface TextElement {
  id: string;
  content: string;
  type: 'TEXT';
  styles: any;
  textStyles?: {
    fontSize?: string;
    fontFamily?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;
    textAlign?: string;
    color?: string;
    [key: string]: string | undefined;
  };
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
  textElements?: TextElement[];
  hasTextContent?: boolean;
}

export interface GitLabSettings {
  gitlabUrl?: string; // New field for custom GitLab URL
  projectId: string;
  gitlabToken?: string;
  filePath?: string;
  testFilePath?: string;
  strategy?: string;
  branchName?: string;
  testBranchName?: string;
  exportFormat?: 'css' | 'scss';
  saveToken: boolean;
  savedAt: string;
  savedBy: string;
  isPersonal?: boolean;
  _needsCryptoMigration?: boolean; // Internal flag for token encryption migration
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
  variableId?: string;
  gitlabUrl?: string;
  projectId?: string;
  gitlabToken?: string;
  commitMessage?: string;
  filePath?: string;
  testFilePath?: string;
  strategy?: string;
  branchName?: string;
  testBranchName?: string;
  exportFormat?: 'css' | 'scss';
  cssData?: string;
  testContent?: string;
  shareWithTeam?: boolean;
  saveToken?: boolean;
  generateAllVariants?: boolean;
  includeStateTests?: boolean;
  shouldDownload?: boolean;
  forceCreate?: boolean;
  forCommit?: boolean;
  collections?: {[key: string]: string};
  groups?: {[key: string]: string};
  width?: number;
  height?: number;
  // Git provider fields
  provider?: 'gitlab' | 'github';
  baseUrl?: string;
  token?: string;
  // External URL opening
  url?: string;
  // Token import  
  tokens?: Array<{name: string, value: any, type: string, references?: string[], isAlias?: boolean}>;
  options?: {
    collectionName?: string;
    createNew?: boolean;
    existingCollectionId?: string;
    organizeByCategories?: boolean;
    overwriteExisting?: boolean;
  };
} 