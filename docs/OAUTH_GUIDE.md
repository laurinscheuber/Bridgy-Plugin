# GitHub OAuth Authentication Guide

## 🚀 What is OAuth?

OAuth (Open Authorization) is a secure way to authenticate with GitHub without manually copying and pasting tokens. Instead of:

1. Going to GitHub Settings → Developer Settings
2. Creating a Personal Access Token
3. Copying and pasting it into Bridgy

You can simply:

1. Click the **OAuth** button in Bridgy
2. Authorize the app in the popup
3. Done! ✨

---

## 📋 Quick Start

### Step 1: Open Settings

1. Open Bridgy in Figma
2. Click the **⚙️ Settings** icon in the top-right corner
3. Select **GitHub** as your Git Provider

### Step 2: Click OAuth Button

Look for the green **OAuth** button next to the token input field:

```
┌─────────────────────────────────────────┐
│ GitHub Access Token                     │
│ ┌─────────────────────┬────────────┐   │
│ │ [Password Field]    │ [📱 OAuth] │   │
│ └─────────────────────┴────────────┘   │
└─────────────────────────────────────────┘
```

### Step 3: Authorize in Popup

- A popup window will open with GitHub's authorization page
- Review the requested permissions
- Click **Authorize Bridgy**
- The popup will close automatically

### Step 4: Done!

Your GitHub token will be automatically filled in. Save your settings and start using Bridgy!

---

## 🚧 Troubleshooting

### Problem: "Popup Blocker Detected"

**Why this happens:**  
Modern browsers block popups by default to protect users from unwanted ads. OAuth requires a secure popup for authentication.

**Solution:**

<details>
<summary><strong>🌐 Chrome</strong></summary>

1. Look for the popup blocked icon **🚫** in the address bar (right side)
2. Click on it
3. Select **"Always allow popups from figma.com"**
4. Click **"Done"**
5. Click the OAuth button again in Bridgy

</details>

<details>
<summary><strong>🦊 Firefox</strong></summary>

1. Look for the preferences icon in the address bar
2. Click **"Show Blocked Pop-ups"**
3. Select **"Allow pop-ups for figma.com"**
4. Click the OAuth button again in Bridgy

</details>

<details>
<summary><strong>🧭 Safari</strong></summary>

1. Go to **Safari → Preferences → Websites**
2. Select **"Pop-up Windows"** in the left sidebar
3. Find **figma.com** and set it to **"Allow"**
4. Click the OAuth button again in Bridgy

</details>

<details>
<summary><strong>🌊 Edge</strong></summary>

1. Look for the popup blocked icon in the address bar
2. Click on it
3. Select **"Always allow"**
4. Click the OAuth button again in Bridgy

</details>

---

### Problem: "Authentication Cancelled"

**Why this happens:**  
You closed the popup window before completing authentication.

**Solution:**  
Click the OAuth button again and complete the authorization process.

---

### Problem: "Authentication Timed Out"

**Why this happens:**  
The OAuth flow took longer than 5 minutes to complete.

**Solution:**

1. Check your internet connection
2. Click the OAuth button again
3. Complete the authorization quickly

---

## ❓ Frequently Asked Questions

### What permissions does Bridgy request?

Bridgy requests these GitHub permissions:

- **`repo`** - Access to your repositories (to commit design tokens)
- **`read:user`** - Read your basic profile information
- **`user:email`** - Access to your email address

### Is OAuth more secure than Personal Access Tokens?

**Yes!** OAuth tokens:

- Can be revoked easily from GitHub settings
- Are scoped to specific permissions
- Don't require you to store sensitive tokens locally
- Expire automatically if not used

### Can I still use Personal Access Tokens instead?

Absolutely! If you prefer using PATs:

1. Go to GitHub → Settings → Developer Settings → Personal Access Tokens
2. Create a new token with `repo`, `read:user`, and `user:email` scopes
3. Copy the token
4. Paste it into the "GitHub Access Token" field in Bridgy

### Where is my OAuth token stored?

Your OAuth token is stored securely in Figma's client storage, encrypted and only accessible by the Bridgy plugin.

### What if OAuth doesn't work at all?

If OAuth continues to fail after allowing popups:

1. **Clear your browser cache** and try again
2. **Use a Personal Access Token** as an alternative
3. **Contact support** with error details from the browser console (F12 → Console)

---

## 🔒 Security & Privacy

- **Secure Connection**: All OAuth communication happens over HTTPS
- **No Password Storage**: Bridgy never sees or stores your GitHub password
- **Token Encryption**: Access tokens are encrypted in storage
- **Revocable Access**: You can revoke Bridgy's access anytime from GitHub Settings → Applications

---

## 💡 Pro Tips

1. **Enable Popups Once**: After allowing popups for Figma, you won't need to do it again
2. **Check "Show Help"**: If you encounter errors, click the "Show Help" button for context-specific guidance
3. **Browser Extensions**: Some ad blockers may interfere with OAuth. Try disabling them temporarily
4. **Use Latest Browser**: OAuth works best on the latest versions of Chrome, Firefox, Safari, and Edge

---

## 🛠️ Technical Details

For developers maintaining or debugging the OAuth flow:

### OAuth Flow Architecture

```
┌─────────────┐        ┌─────────────────┐        ┌──────────────┐
│   Figma     │        │ Netlify OAuth   │        │   GitHub     │
│   Plugin    │───1───▶│    Service      │───2───▶│  OAuth API   │
│             │        │ (Token Exchange)│        │              │
└─────────────┘        └─────────────────┘        └──────────────┘
       ▲                        │                         │
       │                        │                         │
       └────────3───────────────┴─────────4───────────────┘
```

1. Plugin initiates OAuth with GitHub authorization URL
2. Netlify function exchanges auth code for access token
3. Token returned to plugin via postMessage
4. Plugin stores token and updates UI

### Files Modified

- `src/ui/main.js` - OAuth flow implementation (lines 4338-4850)
- `src/ui/styles.css` - OAuth animations and button styles (lines 2609-2686)

### Functions Added

- `detectBrowser()` - Identifies user's browser
- `detectPopupBlocker()` - Tests if popups are blocked
- `getPopupInstructions()` - Returns browser-specific guidance
- `showPopupBlockerHelp()` - Displays help modal
- `showCustomModal()` - Generic modal helper
- `startGitHubOAuthFlow()` - Enhanced OAuth flow with detection

---

## 📞 Need Help?

If you're still having trouble:

- **GitHub Issues**: [Report a bug](https://github.com/laurinscheuber/Bridgy-Plugin/issues)
- **Documentation**: Check the main [README.md](../README.md)
- **Feedback**: Use the feedback buttons in the plugin

---

_Last updated: 2025-11-20_
