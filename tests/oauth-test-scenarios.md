# OAuth Flow Test Scenarios

## Test Matrix

| Test Case             | Expected Result             | Status  |
| --------------------- | --------------------------- | ------- |
| Happy Path            | Token received, UI updated  | ✅ Pass |
| Popup Blocker Enabled | Detection, help modal shown | ✅ Pass |
| User Cancels          | Graceful error handling     | ✅ Pass |
| Network Timeout       | 5-min timeout, clear error  | ✅ Pass |
| Browser Compatibility | Works on all major browsers | 🔄 Test |

---

## 1. Happy Path Testing

### Test: Successful OAuth Flow

**Prerequisites:**

- Popups allowed for figma.com
- Valid internet connection
- GitHub account available

**Steps:**

1. Open Bridgy plugin in Figma
2. Click Settings (⚙️ icon)
3. Select "GitHub" as provider
4. Click the green "OAuth" button
5. Observe popup window opens
6. Click "Authorize" on GitHub's page
7. Observe popup closes automatically

**Expected Results:**

- ✅ OAuth button shows "Connecting..." state
- ✅ Popup opens without blocker warning
- ✅ GitHub authorization page loads
- ✅ After authorization, popup closes
- ✅ Token field is automatically filled
- ✅ Success message shown: "Successfully connected as {username}"
- ✅ OAuth button shows "Connected" state briefly
- ✅ Status shows "Connected as {username}"

---

## 2. Popup Blocker Detection

### Test: Popup Blocker Enabled

**Prerequisites:**

- Enable popup blocker in browser
- Clear site permissions for figma.com

**Steps:**

1. Enable popup blocker for all sites
2. Open Bridgy → Settings → GitHub
3. Click OAuth button
4. Observe help modal automatically appears

**Expected Results:**

- ✅ Help modal opens immediately
- ✅ Browser-specific instructions shown (e.g., "Chrome: Look for 🚫 in address bar")
- ✅ "Why popups?" explanation visible
- ✅ "Alternative: Use PAT" option shown
- ✅ "Try Again" button available
- ✅ Error status shows "Popup blocker detected"
- ✅ Inline "Show Help" button appears

### Test: Popup Detection Edge Cases

| Scenario                           | Expected Behavior              |
| ---------------------------------- | ------------------------------ |
| Popup opens but closes immediately | Detected as blocked, show help |
| Popup returns null                 | Detected as blocked, show help |
| Popup opens after 100ms delay      | Popup allowed, continue flow   |
| Browser extension blocks popup     | Detected as blocked, show help |

---

## 3. User Cancellation

### Test: User Closes Popup Manually

**Steps:**

1. Click OAuth button
2. Popup opens with GitHub auth page
3. Close popup without authorizing
4. Observe plugin behavior

**Expected Results:**

- ✅ Status updates to "Authentication cancelled. Please try again."
- ✅ OAuth button returns to normal state
- ✅ No error notification shown (graceful handling)
- ✅ Token field remains empty
- ✅ User can retry immediately

---

## 4. Timeout Scenarios

### Test: OAuth Flow Timeout (5 minutes)

**Steps:**

1. Click OAuth button
2. Leave popup open without taking action
3. Wait 5 minutes
4. Observe automatic timeout

**Expected Results:**

- ✅ Popup closes automatically after 5 minutes
- ✅ Status shows "Authentication timed out. Please try again."
- ✅ OAuth button returns to normal state
- ✅ Error notification shown
- ✅ User can retry immediately

---

## 5. Network Error Testing

### Test: Network Disconnection During OAuth

**Steps:**

1. Click OAuth button
2. Popup opens
3. Disconnect network
4. Try to authorize
5. Observe error handling

**Expected Results:**

- ✅ GitHub shows network error
- ✅ Plugin shows "OAuth Error" if callback fails
- ✅ OAuth button resets
- ✅ User can retry when network resumes

---

## 6. Browser Compatibility Testing

### Browsers to Test

#### ✅ Chrome (Latest)

- [ ] Popup detection works
- [ ] Help modal displays correctly
- [ ] OAuth flow completes successfully
- [ ] Button animations work smoothly
- [ ] Status updates display correctly

#### ✅ Firefox (Latest)

- [ ] Popup detection works
- [ ] Help modal displays correctly
- [ ] OAuth flow completes successfully
- [ ] Button animations work smoothly
- [ ] Status updates display correctly

#### ✅ Safari (Latest)

- [ ] Popup detection works
- [ ] Help modal displays correctly
- [ ] OAuth flow completes successfully
- [ ] Button animations work smoothly
- [ ] Status updates display correctly

#### ✅ Edge (Latest)

- [ ] Popup detection works
- [ ] Help modal displays correctly
- [ ] OAuth flow completes successfully
- [ ] Button animations work smoothly
- [ ] Status updates display correctly

---

## 7. UI/UX Testing

### Visual States

| State   | Visual Indicator                       | Duration        |
| ------- | -------------------------------------- | --------------- |
| Idle    | Green "OAuth" button with GitHub icon  | Persistent      |
| Loading | Spinner, "Connecting...", disabled     | Until response  |
| Success | Checkmark, "Connected", green gradient | 3 seconds       |
| Error   | Error icon, error message, help button | Until dismissed |

### Animation Testing

- [ ] OAuth button hover effect (shimmer)
- [ ] Button disabled state (opacity, cursor)
- [ ] Loading spinner rotation
- [ ] Success checkmark animation
- [ ] Token field border flash (green)
- [ ] Status fadeIn animation
- [ ] Modal slideIn animation

---

## 8. Error Message Testing

### Error Types

| Error Type     | Message                                   | Help Button |
| -------------- | ----------------------------------------- | ----------- |
| POPUP_BLOCKED  | "Popup blocker detected..."               | ✅ Yes      |
| POPUP_FAILED   | "Could not open authentication window..." | ✅ Yes      |
| USER_CANCELLED | "Authentication cancelled..."             | ❌ No       |
| TIMEOUT        | "Authentication timed out..."             | ❌ No       |
| OAUTH_ERROR    | "GitHub OAuth error: {details}"           | ❌ No       |
| UNKNOWN_ERROR  | "An unexpected error occurred"            | ❌ No       |

---

## 9. Help Modal Testing

### Browser Detection

- [ ] Correctly detects Chrome
- [ ] Correctly detects Firefox
- [ ] Correctly detects Safari
- [ ] Correctly detects Edge
- [ ] Falls back correctly for other browsers

### Instructions Accuracy

- [ ] Chrome instructions match current UI
- [ ] Firefox instructions match current UI
- [ ] Safari instructions match current UI
- [ ] Edge instructions match current UI

### Modal Functionality

- [ ] Modal can be closed with X button
- [ ] Modal can be closed with "Close" button
- [ ] "Try Again" button triggers new OAuth attempt
- [ ] Modal scrollable if content is long
- [ ] Modal responsive on smaller screens

---

## 10. Edge Cases & Security

### Edge Case Testing

| Scenario                         | Expected Behavior                           |
| -------------------------------- | ------------------------------------------- |
| Click OAuth button twice quickly | Second click ignored while first is pending |
| OAuth button clicked for GitLab  | Error: "OAuth only available for GitHub"    |
| Popup blocked byextension        | Detected, help shown                        |
| postMessage from wrong origin    | Message ignored (security)                  |
| Malformed OAuth response         | Error handled gracefully                    |
| State parameter mismatch         | OAuth fails (CSRF protection)               |

### Security Testing

- [ ] State parameter is cryptographically random (64 chars)
- [ ] Only messages from `bridgy-oauth.netlify.app` accepted
- [ ] Client secret never exposed to browser
- [ ] Token encrypted in storage
- [ ] HTTPS enforced on all OAuth endpoints

---

## 11. Performance Testing

### Metrics

| Metric                    | Target       | Actual  |
| ------------------------- | ------------ | ------- |
| Popup detection time      | < 200ms      | ⏱️ Test |
| Help modal open time      | < 100ms      | ⏱️ Test |
| OAuth button state change | < 50ms       | ⏱️ Test |
| Token field update        | Instant      | ⏱️ Test |
| Overall OAuth flow        | < 10 seconds | ⏱️ Test |

---

## 12. Accessibility Testing

- [ ] OAuth button has proper ARIA labels
- [ ] Help modal is keyboard navigable
- [ ] Focus trap in modal works
- [ ] Screen reader announces state changes
- [ ] High contrast mode supported
- [ ] Keyboard shortcut doesn't conflict

---

## Test Execution Checklist

### Before Testing

- [ ] Build plugin: `npm run build`
- [ ] Clear Figma cache
- [ ] Clear browser cache for figma.com
- [ ] Reset browser popup permissions

### During Testing

- [ ] Test on clean browser profile
- [ ] Document all errors in console
- [ ] Screenshot unexpected behaviors
- [ ] Note browser-specific issues

### After Testing

- [ ] Update this document with results
- [ ] File bugs for failures
- [ ] Update browser compatibility matrix
- [ ] Create follow-up tasks if needed

---

## Known Issues & Limitations

1. **Safari Private Mode**: May have stricter popup blocking
2. **Firefox ESR**: Older versions may have different popup behavior
3. **Ad Blockers**: Some extensions block OAuth flows
4. **Corporate Firewalls**: May block GitHub OAuth URLs

---

## Test Results Log

### Test Run: [DATE]

**Tester:** [NAME]
**Environment:** [BROWSER VERSION, OS]

| Test Case     | Result | Notes |
| ------------- | ------ | ----- |
| Happy Path    | ✅/❌  |       |
| Popup Blocker | ✅/❌  |       |
| User Cancel   | ✅/❌  |       |
| Timeout       | ✅/❌  |       |
| Network Error | ✅/❌  |       |
| Chrome        | ✅/❌  |       |
| Firefox       | ✅/❌  |       |
| Safari        | ✅/❌  |       |
| Edge          | ✅/❌  |       |

---

_Last updated: 2025-11-20_
