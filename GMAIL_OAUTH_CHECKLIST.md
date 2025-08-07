# Gmail OAuth Setup Checklist

## Pre-Setup Requirements ✅

### Google Cloud Console Setup
- [ ] **Google Cloud Project Created**
  - Go to [Google Cloud Console](https://console.cloud.google.com/)
  - Create new project or select existing one
  - Note down Project ID

- [ ] **APIs Enabled**
  - Navigate to **APIs & Services** → **Library**
  - Enable **Gmail API**
  - Enable **Google+ API** (for user info)

## OAuth Client Configuration ✅

### 1. OAuth 2.0 Client ID Setup
- [ ] **Create OAuth Client**
  - Go to **APIs & Services** → **Credentials**
  - Click **Create Credentials** → **OAuth 2.0 Client IDs**
  - Select **Web application** as application type

- [ ] **Authorized Redirect URIs**
  - Add: `http://localhost:3000/api/auth/email/gmail/callback`
  - For production: `https://yourdomain.com/api/auth/email/gmail/callback`
  - Verify exact match (no trailing slashes)

### 2. OAuth Consent Screen Configuration
- [ ] **Basic Consent Screen Setup**
  - Go to **APIs & Services** → **OAuth consent screen**
  - Choose **External** user type (for public apps)
  - Fill in required fields:
    - App name
    - User support email
    - Developer contact information

- [ ] **Authorized Domains** ⚠️ **CRITICAL**
  - In **Branding** section → **Authorised domains**
  - Add `localhost` for development
  - Add your production domain for production
  - Click **Save**

- [ ] **Scopes Configuration**
  - Add required scopes:
    - `https://www.googleapis.com/auth/gmail.readonly`
    - `https://www.googleapis.com/auth/userinfo.email`
    - `https://www.googleapis.com/auth/userinfo.profile`

- [ ] **Test Users (if in Testing mode)**
  - Add your Gmail address as a test user
  - Add any other test user emails

## Environment Configuration ✅

### 1. Environment Variables Setup
- [ ] **Create `.env.local` file**
  ```bash
  # Gmail OAuth Configuration
  GMAIL_CLIENT_ID=your-google-client-id-here
  GMAIL_CLIENT_SECRET=your-google-client-secret-here
  GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/email/gmail/callback
  
  # Base URL
  NEXT_PUBLIC_BASE_URL=http://localhost:3000
  ```

- [ ] **Verify Environment Variables**
  - Run: `node scripts/test-oauth-config.js`
  - Should show: ✅ All variables are set

### 2. Application Configuration
- [ ] **Install Dependencies**
  ```bash
  pnpm install
  ```

- [ ] **Start Development Server**
  ```bash
  pnpm dev
  ```

## Security & Best Practices ✅

### 1. Client Secret Management
- [ ] **Never commit secrets to version control**
  - Ensure `.env.local` is in `.gitignore`
  - Use different credentials for dev/production

- [ ] **Store secrets securely**
  - Consider using secret management service
  - Rotate secrets regularly

### 2. URL Configuration
- [ ] **Exact URL Matching**
  - Redirect URIs must match exactly
  - No trailing slashes
  - Correct protocol (http for localhost, https for production)

## Testing & Verification ✅

### 1. Basic Configuration Test
- [ ] **Run OAuth Config Test**
  ```bash
  node scripts/test-oauth-config.js
  ```
  Expected output:
  ```
  ✅ GMAIL_CLIENT_ID: Set
  ✅ GMAIL_CLIENT_SECRET: Set
  ✅ GMAIL_REDIRECT_URI: Set
  📊 Configuration Status: Ready
  ```

### 2. OAuth Flow Test
- [ ] **Manual OAuth Flow Test**
  - Open: `http://localhost:3000/api/auth/email/gmail?redirect_uri=http://localhost:3000&session_token=test`
  - Should redirect to Google OAuth consent screen
  - No error messages in browser console

- [ ] **Check Network Requests**
  - Open browser developer tools
  - Go to Network tab
  - Verify no 4xx/5xx errors during OAuth flow

### 3. Callback Verification
- [ ] **OAuth Callback Test**
  - Complete OAuth flow
  - Should redirect to callback URL with authorization code
  - Check server logs for successful token exchange

## Troubleshooting Checklist ✅

### Common Issues & Solutions

#### ❌ "No authorization code received"
- [ ] Verify `localhost` is in authorized domains
- [ ] Check redirect URI matches exactly
- [ ] Ensure OAuth consent screen is configured

#### ❌ "redirect_uri_mismatch"
- [ ] Update redirect URI in Google Cloud Console
- [ ] Remove trailing slashes
- [ ] Verify protocol (http vs https)

#### ❌ "access_denied"
- [ ] User denied authorization (retry)
- [ ] Check if user is added as test user (if app in testing mode)

#### ❌ "invalid_client"
- [ ] Verify client ID and secret are correct
- [ ] Check OAuth client is enabled

#### ❌ Environment variables not loading
- [ ] Verify `.env.local` file exists
- [ ] Install `dotenv` package: `pnpm add dotenv`
- [ ] Restart development server

## Production Deployment ✅

### 1. Update Configuration
- [ ] **Update Redirect URIs**
  - Add production domain to OAuth client
  - Update `GMAIL_REDIRECT_URI` environment variable

- [ ] **Update Authorized Domains**
  - Add production domain to OAuth consent screen
  - Remove `localhost` (optional)

- [ ] **Publish OAuth Consent Screen**
  - Change from "Testing" to "In production"
  - Submit for verification if required

### 2. Environment Variables
- [ ] **Set Production Environment Variables**
  - Update hosting platform with production values
  - Use secure secret management

## Final Verification ✅

### Complete Flow Test
- [ ] **End-to-End Test**
  - Start fresh incognito browser session
  - Complete full OAuth flow
  - Verify successful email account connection
  - Check application functionality

### Monitoring
- [ ] **Monitor Error Logs**
  - Check server logs for OAuth errors
  - Monitor API usage in Google Cloud Console
  - Set up error alerts if needed

---

## Quick Commands

```bash
# Test OAuth configuration
node scripts/test-oauth-config.js

# Start development server
pnpm dev

# Check environment variables
echo $GMAIL_CLIENT_ID    # Should show your client ID
```

## Important URLs

- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
- [OAuth Clients](https://console.cloud.google.com/apis/credentials)
- [Gmail API Library](https://console.cloud.google.com/apis/library/gmail.googleapis.com)

---

**📋 Status:** Follow this checklist step by step to ensure proper Gmail OAuth setup. Mark each item as complete ✅ before moving to the next section.
