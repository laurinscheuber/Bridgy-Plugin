/**
 * Common Git types used across different Git providers
 */

export type GitProvider = 'gitlab' | 'github';

export interface GitSettings {
  provider: GitProvider;
  baseUrl?: string; // For self-hosted instances
  projectId: string; // GitLab: numeric/namespace, GitHub: owner/repo
  token?: string;
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
  _needsCryptoMigration?: boolean;
}

export interface GitProject {
  id: string | number;
  name: string;
  fullName?: string; // GitHub: owner/repo, GitLab: namespace/name
  defaultBranch: string;
  webUrl: string;
  description?: string;
  private?: boolean;
  language?: string;
  stargazers_count?: number;
  forks_count?: number;
  updatedAt?: string;
  createdAt?: string;
  topics?: string[];
  owner?: {
    login: string;
    avatar_url?: string;
  };
}

export interface GitFile {
  fileName: string;
  filePath: string;
  size: number;
  encoding: string;
  content: string;
  lastCommitId: string;
  sha?: string; // GitHub uses SHA
}

export interface GitCommit {
  id: string;
  title: string;
  message: string;
  webUrl: string;
  sha?: string; // GitHub
}

export interface GitPullRequest {
  id: number;
  number?: number; // GitHub PR number
  title: string;
  description: string;
  state: 'open' | 'closed' | 'merged' | 'opened'; // opened is GitLab specific
  webUrl: string;
  sourceBranch: string;
  targetBranch: string;
  draft?: boolean;
}

export interface GitError {
  message: string;
  error?: string;
  error_description?: string;
  documentation_url?: string; // GitHub specific
}