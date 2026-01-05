/**
 * OAuth Service for GitHub Authentication
 * Provides OAuth flow setup and configuration for GitHub integration
 */

import { LoggingService } from '../config';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
}

export interface OAuthToken {
  accessToken: string;
  tokenType: string;
  scope: string[];
  expiresAt?: number;
}

export class OAuthService {
  // GitHub OAuth Configuration
  private static readonly GITHUB_OAUTH_CONFIG: OAuthConfig = {
    // GitHub OAuth App configuration
    // You need to register an OAuth App at: https://github.com/settings/applications/new
    clientId: 'Ov23liKXGtyeKaklFf0Q', // Bridgy Plugin OAuth App
    redirectUri: 'https://bridgy-oauth.netlify.app/github/callback',
    scope: [
      'repo', // Access to repositories
      'read:user', // Read user profile
      'user:email', // Access to user email
    ],
  };

  /**
   * Generate GitHub OAuth authorization URL
   */
  static generateGitHubOAuthUrl(): string {
    const config = this.GITHUB_OAUTH_CONFIG;
    const state = this.generateSecureState();

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope.join(' '),
      state: state,
      response_type: 'code',
    });

    // Store state for verification
    this.storeOAuthState(state);

    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    LoggingService.debug(
      'Generated GitHub OAuth URL',
      {
        scopes: config.scope,
        state: state.substring(0, 8) + '...', // Log first 8 chars for debugging
      },
      LoggingService.CATEGORIES.GITHUB,
    );

    return authUrl;
  }

  /**
   * Check if OAuth is configured and available
   */
  static isOAuthConfigured(): boolean {
    const config = this.GITHUB_OAUTH_CONFIG;
    return (
      config.clientId !== 'your-github-client-id' &&
      config.clientId.length > 0 &&
      config.redirectUri.startsWith('https://')
    );
  }

  /**
   * Start OAuth flow by opening popup window
   */
  static async startOAuthFlow(): Promise<{
    success: boolean;
    token?: string;
    user?: any;
    error?: string;
  }> {
    if (!this.isOAuthConfigured()) {
      return {
        success: false,
        error: 'OAuth is not configured. Please use Personal Access Token method.',
      };
    }

    return new Promise((resolve) => {
      try {
        const authUrl = this.generateGitHubOAuthUrl();

        // Open popup window
        const popup = window.open(
          authUrl,
          'github-oauth',
          'width=600,height=700,scrollbars=yes,resizable=yes',
        );

        if (!popup) {
          resolve({
            success: false,
            error: 'Failed to open OAuth popup. Please allow popups for this site.',
          });
          return;
        }

        // Listen for messages from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== 'https://bridgy-oauth.netlify.app') {
            return;
          }

          if (event.data.type === 'oauth-success') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            resolve({
              success: true,
              token: event.data.token,
              user: event.data.user,
            });
          } else if (event.data.type === 'oauth-error') {
            window.removeEventListener('message', messageHandler);
            popup.close();
            resolve({
              success: false,
              error: event.data.error,
            });
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageHandler);
            resolve({
              success: false,
              error: 'OAuth flow was cancelled by user',
            });
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          if (!popup.closed) {
            popup.close();
          }
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          resolve({
            success: false,
            error: 'OAuth flow timed out',
          });
        }, 300000);
      } catch (error: any) {
        resolve({
          success: false,
          error: error.message || 'Failed to start OAuth flow',
        });
      }
    });
  }

  /**
   * Get OAuth configuration status for UI display
   */
  static getOAuthStatus(): {
    available: boolean;
    configured: boolean;
    message: string;
  } {
    const configured = this.isOAuthConfigured();

    if (configured) {
      return {
        available: true,
        configured: true,
        message: 'OAuth login is available',
      };
    } else {
      return {
        available: false,
        configured: false,
        message: 'OAuth not configured. Using Personal Access Token method.',
      };
    }
  }

  /**
   * Generate secure random state for OAuth flow
   */
  private static generateSecureState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => {
      const hex = byte.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  /**
   * Store OAuth state for verification (in-memory for now)
   */
  private static oauthStates: Set<string> = new Set();

  private static storeOAuthState(state: string): void {
    this.oauthStates.add(state);

    // Clean up old states after 10 minutes
    setTimeout(
      () => {
        this.oauthStates.delete(state);
      },
      10 * 60 * 1000,
    );
  }

  /**
   * Verify OAuth state
   */
  static verifyOAuthState(state: string): boolean {
    return this.oauthStates.has(state);
  }

  /**
   * Exchange OAuth code for access token
   * Note: This would typically be done by a backend server for security
   */
  static async exchangeCodeForToken(code: string, state: string): Promise<OAuthToken> {
    if (!this.verifyOAuthState(state)) {
      throw new Error('Invalid OAuth state - possible CSRF attack');
    }

    // In a real implementation, this would be done by a backend server
    // to keep the client secret secure
    throw new Error('OAuth token exchange requires backend server implementation');
  }

  /**
   * Instructions for OAuth setup
   */
  static getSetupInstructions(): string[] {
    return [
      '1. Go to GitHub Settings → Developer settings → OAuth Apps',
      '2. Click "New OAuth App"',
      '3. Fill in the application details:',
      '   - Application name: "Bridgy Figma Plugin"',
      '   - Homepage URL: "https://bridgy-plugin.com"',
      '   - Authorization callback URL: "https://bridgy-plugin.com/oauth/github/callback"',
      '4. Copy the Client ID and Client Secret',
      '5. Set environment variables or update configuration',
      '6. Deploy backend OAuth handler to handle token exchange',
      '',
      'For development, you can continue using Personal Access Tokens.',
      'OAuth provides better security and user experience for production.',
    ];
  }

  /**
   * Check if current token appears to be from OAuth or PAT
   */
  static isTokenFromOAuth(token: string): boolean {
    // GitHub OAuth tokens typically start with 'gho_'
    // Personal Access Tokens start with 'ghp_' or 'github_pat_'
    return token.startsWith('gho_');
  }

  /**
   * Get recommended scopes for different use cases
   */
  static getRecommendedScopes(): {
    minimal: string[];
    standard: string[];
    full: string[];
  } {
    return {
      minimal: ['public_repo'], // Public repositories only
      standard: ['repo', 'read:user'], // Private repos + user info
      full: ['repo', 'read:user', 'user:email', 'admin:repo_hook'], // Full access
    };
  }

  /**
   * Validate token scopes
   */
  static validateTokenScopes(scopes: string[]): {
    valid: boolean;
    missing: string[];
    recommendations: string[];
  } {
    const required = ['repo'];
    const recommended = ['read:user'];

    const missing = required.filter((scope) => scopes.indexOf(scope) === -1);
    const recommendations = recommended.filter((scope) => scopes.indexOf(scope) === -1);

    return {
      valid: missing.length === 0,
      missing: missing,
      recommendations: recommendations,
    };
  }

  /**
   * Display OAuth setup UI hint
   */
  static getOAuthSetupHint(): string {
    if (this.isOAuthConfigured()) {
      return '';
    }

    return `
      💡 Pro Tip: For better security and user experience, consider setting up GitHub OAuth.
      This allows users to authenticate with their GitHub account instead of using Personal Access Tokens.
      
      Contact your development team to configure OAuth for this plugin.
    `;
  }
}
