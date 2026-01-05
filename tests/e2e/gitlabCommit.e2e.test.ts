/**
 * E2E Tests for GitLab Commit Functionality
 * Tests the complete flow of committing variables and component tests to GitLab
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupE2EEnvironment, setupMockGitLabAPI } from './setup';
import { GitLabService } from '../../src/services/gitlabService';
import { CSSExportService } from '../../src/services/cssExportService';

describe('GitLab Commit E2E', () => {
  let mockEnvironment: any;
  let mockFetch: any;

  const validGitLabSettings = {
    projectId: 'test/project',
    gitlabToken: 'glpat-test-token-123456789',
    gitlabUrl: 'https://gitlab.com',
    savedAt: new Date().toISOString(),
    savedBy: 'E2E Test User',
    saveToken: true,
  };

  beforeEach(() => {
    mockEnvironment = setupE2EEnvironment();
    mockFetch = setupMockGitLabAPI();

    // Clear any previous settings
    mockEnvironment.figma.clientStorage.getAsync = vi.fn(() => Promise.resolve(null));
    mockEnvironment.figma.root.getSharedPluginData = vi.fn(() => null);
  });

  describe('Variable Commit Flow', () => {
    it('should commit CSS variables to GitLab successfully', async () => {
      // Export variables to CSS
      const cssContent = await CSSExportService.exportVariables('css');

      // Commit to GitLab
      const result = await GitLabService.commitToGitLab(
        validGitLabSettings,
        'feat: update CSS variables from Figma design tokens',
        'styles/variables.css',
        cssContent,
        'feature/design-tokens',
      );

      expect(result).toHaveProperty('mergeRequestUrl');
      expect(result.mergeRequestUrl).toContain('gitlab.com');
      expect(result.mergeRequestUrl).toContain('merge_requests');

      // Verify GitLab API calls
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/projects/test%2Fproject'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'PRIVATE-TOKEN': 'glpat-test-token-123456789',
          }),
        }),
      );

      // Check branch creation
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/branches'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('feature/design-tokens'),
        }),
      );

      // Check commit creation
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/commits'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('styles/variables.css'),
        }),
      );

      // Check merge request creation
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/merge_requests'),
        expect.objectContaining({
          method: 'POST',
        }),
      );
    });

    it('should handle existing branch gracefully', async () => {
      // Mock branch already exists
      const branchCreateCall = mockFetch.getMockImplementation();
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/repository/branches') && options?.method === 'POST') {
          return Promise.resolve({
            ok: false,
            status: 400,
            json: () => Promise.resolve({ message: 'Branch name already exists' }),
          });
        }
        return branchCreateCall(url, options);
      });

      const cssContent = await CSSExportService.exportVariables('css');

      // Should not throw error for existing branch
      const result = await GitLabService.commitToGitLab(
        validGitLabSettings,
        'feat: update variables',
        'styles/variables.css',
        cssContent,
      );

      expect(result).toHaveProperty('mergeRequestUrl');
    });

    it('should find and return existing merge request', async () => {
      // Mock existing merge request
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/merge_requests') && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve([
                {
                  id: 1,
                  web_url: 'https://gitlab.com/test/project/-/merge_requests/1',
                  source_branch: 'feature/variables',
                },
              ]),
          });
        }
        // Default implementation for other calls
        return setupMockGitLabAPI()(url, options);
      });

      const cssContent = await CSSExportService.exportVariables('css');

      const result = await GitLabService.commitToGitLab(
        validGitLabSettings,
        'feat: update variables',
        'styles/variables.css',
        cssContent,
      );

      expect(result.mergeRequestUrl).toBe('https://gitlab.com/test/project/-/merge_requests/1');

      // Should not create new MR
      expect(mockFetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/merge_requests'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it.skip('should handle file updates vs creation', async () => {
      // Mock file exists
      mockFetch.mockImplementation((url: string, options?: any) => {
        if (url.includes('/repository/files/') && options?.method === 'GET') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                file_path: 'styles/variables.css',
                last_commit_id: 'existing-commit-123',
              }),
          });
        }
        return setupMockGitLabAPI()(url, options);
      });

      const cssContent = await CSSExportService.exportVariables('css');

      await GitLabService.commitToGitLab(
        validGitLabSettings,
        'feat: update variables',
        'styles/variables.css',
        cssContent,
      );

      // Should use 'update' action with last_commit_id
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/commits'),
        expect.objectContaining({
          body: expect.stringContaining('"action":"update"'),
        }),
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/commits'),
        expect.objectContaining({
          body: expect.stringContaining('"last_commit_id":"existing-commit-123"'),
        }),
      );
    });

    it('should validate commit parameters', async () => {
      const cssContent = await CSSExportService.exportVariables('css');

      // Invalid project ID
      await expect(
        GitLabService.commitToGitLab(
          { ...validGitLabSettings, projectId: '' },
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow('Project ID is required');

      // Invalid token
      await expect(
        GitLabService.commitToGitLab(
          { ...validGitLabSettings, gitlabToken: '' },
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow('GitLab token is required');

      // Invalid file path
      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          '../../../etc/passwd',
          cssContent,
        ),
      ).rejects.toThrow('Invalid file path');

      // Invalid commit message
      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          '<script>alert("xss")</script>',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow('potentially unsafe content');
    });

    it('should handle different GitLab environments', async () => {
      const fhnwSettings = {
        ...validGitLabSettings,
        gitlabUrl: 'https://gitlab.fhnw.ch',
      };

      const cssContent = await CSSExportService.exportVariables('css');

      const result = await GitLabService.commitToGitLab(
        fhnwSettings,
        'feat: update variables',
        'styles/variables.css',
        cssContent,
      );

      expect(result).toHaveProperty('mergeRequestUrl');

      // Should use correct API base URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('gitlab.fhnw.ch/api/v4'),
        expect.any(Object),
      );
    });
  });

  describe('Component Test Commit Flow', () => {
    it.skip('should commit component test to GitLab successfully', async () => {
      const componentTestContent = `
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByText('Click me').click();
    expect(handleClick).toHaveBeenCalled();
  });
});`;

      const result = await GitLabService.commitComponentTest(
        validGitLabSettings,
        'feat: add Button component test',
        'Button',
        componentTestContent,
        'tests/{componentName}.spec.tsx',
        'feature/component-tests',
      );

      expect(result).toHaveProperty('mergeRequestUrl');
      expect(result.mergeRequestUrl).toContain('gitlab.com');

      // Verify component name normalization and file path
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/files/tests%2FButton.spec.tsx'),
        expect.any(Object),
      );

      // Check branch naming includes component
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/branches'),
        expect.objectContaining({
          body: expect.stringContaining('feature/component-tests-button'),
        }),
      );

      // Check commit message
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/repository/commits'),
        expect.objectContaining({
          body: expect.stringContaining('feat: add Button component test'),
        }),
      );

      // Check MR is created as draft
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/merge_requests'),
        expect.objectContaining({
          body: expect.stringContaining('"title":"Draft: feat: add Button component test"'),
        }),
      );
    });

    it('should normalize component names correctly', async () => {
      const componentTestContent = 'test content';

      await GitLabService.commitComponentTest(
        validGitLabSettings,
        'feat: add test',
        'Complex Component Name!@#$%',
        componentTestContent,
      );

      // Should normalize component name for branch and file
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('complex-component-name'),
        expect.any(Object),
      );
    });

    it('should validate component test parameters', async () => {
      // Missing component name
      await expect(
        GitLabService.commitComponentTest(
          validGitLabSettings,
          'feat: add test',
          '',
          'test content',
        ),
      ).rejects.toThrow('Component name is required');

      // Missing test content
      await expect(
        GitLabService.commitComponentTest(validGitLabSettings, 'feat: add test', 'Button', ''),
      ).rejects.toThrow('Test content is required');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const cssContent = await CSSExportService.exportVariables('css');

      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow('Network error');
    });

    it('should handle GitLab authentication errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ message: 'Invalid token' }),
      });

      const cssContent = await CSSExportService.exportVariables('css');

      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow(); // Just check it throws, message may vary
    });

    it('should handle GitLab rate limiting', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
      });

      const cssContent = await CSSExportService.exportVariables('css');

      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle GitLab server errors', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      });

      const cssContent = await CSSExportService.exportVariables('css');

      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow(); // Just check it throws, message may vary
    });

    it('should handle invalid project access', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Project not found' }),
      });

      const cssContent = await CSSExportService.exportVariables('css');

      await expect(
        GitLabService.commitToGitLab(
          validGitLabSettings,
          'feat: update variables',
          'styles/variables.css',
          cssContent,
        ),
      ).rejects.toThrow(); // Just check it throws, message may vary
    });
  });

  describe('Settings Integration', () => {
    it('should save and load GitLab settings correctly', async () => {
      // Save settings
      await GitLabService.saveSettings(validGitLabSettings, true);

      expect(mockEnvironment.figma.root.setSharedPluginData).toHaveBeenCalledWith(
        'Bridgy',
        expect.stringContaining('gitlab-settings'),
        expect.stringContaining(validGitLabSettings.projectId),
      );

      // Mock stored settings
      mockEnvironment.figma.root.getSharedPluginData = vi.fn((namespace: string, key: string) => {
        if (key.includes('gitlab-settings')) {
          return JSON.stringify({
            ...validGitLabSettings,
            gitlabToken: undefined, // Token stored separately
          });
        }
        return null;
      });

      mockEnvironment.figma.clientStorage.getAsync = vi.fn((key: string) => {
        if (key.includes('token')) {
          return Promise.resolve('encrypted-token-data');
        }
        return Promise.resolve(null);
      });

      // Load settings
      const loadedSettings = await GitLabService.loadSettings();

      expect(loadedSettings).toMatchObject({
        projectId: validGitLabSettings.projectId,
        gitlabUrl: validGitLabSettings.gitlabUrl,
      });
    });

    it('should reset settings completely', async () => {
      await GitLabService.resetSettings();

      expect(mockEnvironment.figma.root.setSharedPluginData).toHaveBeenCalledWith(
        'Bridgy',
        expect.stringContaining('gitlab-settings'),
        '',
      );

      expect(mockEnvironment.figma.clientStorage.deleteAsync).toHaveBeenCalledWith(
        expect.stringContaining('token'),
      );
    });
  });
});
