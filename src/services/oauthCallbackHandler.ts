/**
 * OAuth Callback Handler for GitHub OAuth Flow
 * Handles the callback from GitHub OAuth and exchanges code for access token
 */

import { LoggingService } from '../config';

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
  error?: string;
  error_description?: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export class OAuthCallbackHandler {
  private static readonly CLIENT_ID = 'Ov23liKXGtyeKaklFf0Q';
  private static readonly CLIENT_SECRET = 'your-client-secret'; // This should be set in production

  /**
   * Handle OAuth callback from GitHub
   */
  static async handleCallback(
    code: string,
    state: string,
  ): Promise<{
    success: boolean;
    token?: string;
    user?: GitHubUserResponse;
    error?: string;
  }> {
    try {
      // Verify state for CSRF protection
      if (!this.verifyState(state)) {
        return {
          success: false,
          error: 'Invalid state parameter. Possible CSRF attack.',
        };
      }

      // Exchange code for access token
      const tokenResponse = await this.exchangeCodeForToken(code);

      if (tokenResponse.error) {
        return {
          success: false,
          error: tokenResponse.error_description || tokenResponse.error,
        };
      }

      // Get user info to verify token works
      const user = await this.getUserInfo(tokenResponse.access_token);

      LoggingService.info(
        'OAuth callback successful',
        {
          user: user.login,
          scopes: tokenResponse.scope,
        },
        LoggingService.CATEGORIES.GITHUB,
      );

      return {
        success: true,
        token: tokenResponse.access_token,
        user: user,
      };
    } catch (error: any) {
      LoggingService.error('OAuth callback error', error, LoggingService.CATEGORIES.GITHUB);
      return {
        success: false,
        error: error.message || 'Unknown OAuth error',
      };
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private static async exchangeCodeForToken(code: string): Promise<GitHubTokenResponse> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Bridgy-Plugin/1.0',
      },
      body: JSON.stringify({
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code: code,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GitHubTokenResponse;
  }

  /**
   * Get user information using access token
   */
  private static async getUserInfo(token: string): Promise<GitHubUserResponse> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Bridgy-Plugin/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`User info fetch failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as GitHubUserResponse;
  }

  /**
   * Verify state parameter for CSRF protection
   */
  private static verifyState(state: string): boolean {
    // In a real implementation, you'd verify the state against stored values
    // For now, just check that it exists and has the right format
    return state && state.length === 64 && /^[a-f0-9]+$/.test(state);
  }

  /**
   * Generate a secure callback URL with proper parameters
   */
  static generateCallbackUrl(code: string, state: string): string {
    const params = new URLSearchParams({
      code,
      state,
      source: 'bridgy-plugin',
    });

    return `https://bridgy-oauth.netlify.app/github/success?${params.toString()}`;
  }

  /**
   * Create the OAuth callback page that will handle the redirect
   */
  static createCallbackPage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bridgy - GitHub OAuth</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
            width: 90%;
        }
        
        .logo {
            width: 64px;
            height: 64px;
            background: #667eea;
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .status {
            margin: 1rem 0;
            padding: 1rem;
            border-radius: 8px;
            font-weight: 500;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .loading {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            display: inline-block;
            margin-right: 8px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .instructions {
            color: #666;
            font-size: 14px;
            margin-top: 1rem;
            line-height: 1.4;
        }
        
        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            margin-top: 1rem;
        }
        
        button:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">B</div>
        <h2>Bridgy GitHub Integration</h2>
        
        <div id="status" class="status loading">
            <div class="spinner"></div>
            Connecting to GitHub...
        </div>
        
        <div id="instructions" class="instructions" style="display: none;">
            You can now close this window and return to Figma.
        </div>
        
        <button id="close-btn" onclick="window.close()" style="display: none;">
            Close Window
        </button>
    </div>

    <script>
        (async function() {
            const statusEl = document.getElementById('status');
            const instructionsEl = document.getElementById('instructions');
            const closeBtnEl = document.getElementById('close-btn');
            
            try {
                // Get URL parameters
                const urlParams = new URLSearchParams(window.location.search);
                const code = urlParams.get('code');
                const state = urlParams.get('state');
                const error = urlParams.get('error');
                
                if (error) {
                    throw new Error(urlParams.get('error_description') || error);
                }
                
                if (!code || !state) {
                    throw new Error('Missing authorization code or state parameter');
                }
                
                // Exchange code for token (this would normally be done on a backend)
                const response = await fetch('https://bridgy-oauth.netlify.app/api/github/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code, state })
                });
                
                const result = await response.json();
                
                if (!result.success) {
                    throw new Error(result.error || 'Failed to authenticate');
                }
                
                // Post message back to Figma plugin
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'oauth-success',
                        token: result.token,
                        user: result.user
                    }, '*');
                }
                
                // Show success
                statusEl.className = 'status success';
                statusEl.innerHTML = '✅ Successfully connected to GitHub!';
                instructionsEl.style.display = 'block';
                closeBtnEl.style.display = 'inline-block';
                
                // Auto-close after 3 seconds
                setTimeout(() => {
                    window.close();
                }, 3000);
                
            } catch (error) {
                console.error('OAuth error:', error);
                
                // Show error
                statusEl.className = 'status error';
                statusEl.innerHTML = '❌ ' + error.message;
                closeBtnEl.style.display = 'inline-block';
                
                // Post error back to plugin
                if (window.opener && !window.opener.closed) {
                    window.opener.postMessage({
                        type: 'oauth-error',
                        error: error.message
                    }, '*');
                }
            }
        })();
    </script>
</body>
</html>
    `;
  }
}
