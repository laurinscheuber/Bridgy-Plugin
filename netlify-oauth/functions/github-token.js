/**
 * Netlify Function for GitHub OAuth Token Exchange
 * Exchanges authorization code for access token
 */

// GitHub OAuth App Configuration
const GITHUB_CLIENT_ID = 'Ov23liKXGtyeKaklFf0Q'; // Bridgy Plugin OAuth App
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

exports.handler = async (event, context) => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  // Only allow POST method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: 'Method not allowed'
      })
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { code, state } = body;

    // Validate inputs
    if (!code || !state) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Missing code or state parameter'
        })
      };
    }

    // Validate state format (should be 64 character hex string)
    if (!/^[a-f0-9]{64}$/.test(state)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Invalid state parameter format'
        })
      };
    }

    // Check if client secret is configured
    if (!GITHUB_CLIENT_SECRET) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: 'Server configuration error: GitHub client secret not configured'
        })
      };
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Bridgy-Plugin/1.0'
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          success: false,
          error: tokenData.error_description || tokenData.error
        })
      };
    }

    // Get user information to verify token works
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Bridgy-Plugin/1.0'
      }
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status} ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();

    // Log successful authentication (without sensitive data)
    console.log(`OAuth success for user: ${userData.login} (${userData.id})`);

    // Return success response
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        success: true,
        token: tokenData.access_token,
        user: {
          id: userData.id,
          login: userData.login,
          name: userData.name,
          email: userData.email,
          avatar_url: userData.avatar_url
        }
      })
    };

  } catch (error) {
    console.error('OAuth token exchange error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      })
    };
  }
};