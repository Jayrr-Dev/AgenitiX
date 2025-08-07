# Gmail OAuth Troubleshooting Guide

## Issue: No Authorization Code Received

### Problem Description
The Gmail OAuth flow is completing but no authorization code is being received in the callback. This typically happens when the user does not complete the consent flow properly.

### Symptoms
- OAuth URL is constructed correctly
- Google redirects back with scopes but no `code` parameter
- Callback URL shows `prompt=consent` and `authuser=0`
- Error message: "No authorization code received"

### Root Cause
The user is hitting the Google consent screen but **not clicking "Allow"** to grant access to their Gmail account.

### Solution Steps

#### 1. Complete the Consent Flow
When the Google consent screen appears:
1. **Click "Allow"** to grant access to your Gmail account
2. **Do not click "Cancel"** or close the window
3. **Wait for the redirect** to complete automatically

#### 2. Test in Incognito Mode
- Open an incognito/private browser window
- Navigate to your application
- Try the Gmail authentication again
- This ensures no cached consents interfere

#### 3. Check Browser Console
- Open browser developer tools (F12)
- Go to the Console tab
- Look for any JavaScript errors during the OAuth flow
- Check for network errors in the Network tab

#### 4. Verify Google Account Settings
- Ensure your Google account has Gmail enabled
- Check that you're signed into the correct Google account
- Verify that Gmail API access is not blocked

### Debugging Information

#### Environment Variables
The following environment variables should be set:
```bash
GMAIL_CLIENT_ID=your-google-client-id
GMAIL_CLIENT_SECRET=your-google-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/email/gmail/callback
```

#### Expected OAuth Flow
1. User clicks "Connect Gmail"
2. Google consent screen appears
3. User clicks "Allow"
4. Google redirects to callback with authorization code
5. Application exchanges code for access token
6. Gmail connection is established

#### Common Error Types
- `CONSENT_INCOMPLETE`: User didn't click "Allow"
- `ACCESS_DENIED`: User explicitly denied access
- `CONSENT_CANCELLED`: User closed the consent window
- `SCOPE_GRANTED_NO_CODE`: Scopes granted but no code received

### Testing Steps

#### 1. Manual OAuth URL Test
1. Copy the OAuth URL from the logs
2. Paste it into an incognito browser window
3. Complete the consent flow manually
4. Verify the callback URL contains a `code` parameter

#### 2. Environment Check
Run the test script:
```bash
node scripts/test-gmail-oauth.js
```

#### 3. Network Debugging
1. Open browser developer tools
2. Go to Network tab
3. Start the OAuth flow
4. Look for requests to Google OAuth endpoints
5. Check response status codes and parameters

### Prevention

#### For Users
- Always click "Allow" when prompted by Google
- Use incognito mode for testing
- Ensure you're signed into the correct Google account
- Don't close the consent window prematurely

#### For Developers
- Add clear user instructions before OAuth flow
- Implement proper error handling for consent issues
- Add retry mechanisms for failed OAuth attempts
- Log detailed debugging information

### Support

If the issue persists:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Test in incognito mode
4. Contact support with the error logs

### Related Files
- `app/api/auth/email/gmail/callback/route.ts` - Callback handler
- `app/api/auth/email/gmail/route.ts` - OAuth URL generation
- `features/business-logic-modern/node-domain/email/providers/credentialProviders.ts` - OAuth configuration
