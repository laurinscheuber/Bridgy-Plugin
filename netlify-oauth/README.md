# Bridgy OAuth Callback Service - Netlify Edition

This is the OAuth callback service for the Bridgy Figma Plugin, deployed on Netlify to handle GitHub OAuth authentication for ALL users.

## 🤔 Why This OAuth Service is Needed

**The Problem with Personal Access Tokens:**
- Users have to manually create GitHub tokens
- Complex setup: GitHub Settings → Developer Settings → Personal Access Tokens
- Users need to remember to set correct permissions (`repo`, `read:user`)
- Tokens expire and need manual renewal
- Poor user experience

**The OAuth Solution:**
- One-click "Login with GitHub" experience
- No manual token creation needed
- Automatic permission handling
- Better security (tokens can be revoked easily)
- Works for ALL users, not just you

**Why a Backend Server is Required:**
- GitHub OAuth requires a "client secret" that must be kept secret
- Client secrets can't be stored in browser code (security risk)
- We need a server to securely exchange the authorization code for an access token
- This Netlify function acts as that secure intermediary

## 🚀 Deployment Instructions

### Step 1: Deploy to Netlify

1. **Create a new Netlify site:**
   ```bash
   cd netlify-oauth/
   npm install -g netlify-cli
   netlify login
   netlify init
   ```

2. **Deploy:**
   ```bash
   netlify deploy --prod --dir=public --functions=functions
   ```

3. **Note your site URL** (e.g., `https://amazing-tesla-123456.netlify.app`)

### Step 2: Configure Environment Variables

In your Netlify dashboard:
1. Go to Site Settings → Environment Variables
2. Add: `GITHUB_CLIENT_SECRET` = `your_github_client_secret_here`

### Step 3: Update GitHub OAuth App

1. Go to [GitHub OAuth Apps](https://github.com/settings/applications/new)
2. Create new OAuth App with:
   - **Application name**: `Bridgy Figma Plugin`
   - **Homepage URL**: `https://github.com/yourusername/Bridgy-Plugin`
   - **Authorization callback URL**: `https://your-site-name.netlify.app/github/callback`
3. Copy the **Client Secret** and add it to Netlify environment variables

### Step 4: Update Plugin Code

Replace `your-netlify-site.netlify.app` with your actual Netlify URL in:
- `src/services/oauthService.ts`
- `src/services/oauthCallbackHandler.ts`
- `src/ui/main.js`

Search and replace:
```bash
find src/ -type f -name "*.ts" -o -name "*.js" | xargs sed -i 's/your-netlify-site\.netlify\.app/YOUR-ACTUAL-SITE.netlify.app/g'
```

## 🔧 Local Development

```bash
cd netlify-oauth/
npm install
netlify dev
```

Create `.env` file:
```
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## 📁 File Structure

```
netlify-oauth/
├── netlify.toml           # Netlify configuration
├── package.json           # Dependencies
├── functions/
│   └── github-token.js    # OAuth token exchange function
└── public/
    └── github/
        └── callback.html  # OAuth callback page
```

## 🔒 Security Features

- ✅ CORS headers for cross-origin requests
- ✅ CSRF protection with state parameter validation
- ✅ Client secret stored securely as environment variable
- ✅ Input validation on all endpoints
- ✅ No sensitive data logged

## 🌍 For All Users

Once deployed, this OAuth service works for **anyone** using your Figma plugin:

1. User clicks "Login with GitHub" in your plugin
2. GitHub redirects to your Netlify OAuth service
3. Netlify function securely exchanges code for token
4. Token is returned to the plugin
5. User is authenticated - no manual token creation needed!

## 🔗 Required URLs

Make sure these match in your code:
- **Callback URL**: `https://YOUR-SITE.netlify.app/github/callback`
- **Token Exchange**: `https://YOUR-SITE.netlify.app/api/github/token`

## 📋 Checklist

- [ ] Deploy Netlify site
- [ ] Set `GITHUB_CLIENT_SECRET` environment variable
- [ ] Update GitHub OAuth App callback URL
- [ ] Replace placeholder URLs in plugin code
- [ ] Test OAuth flow
- [ ] Update plugin documentation