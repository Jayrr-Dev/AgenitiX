# Email OAuth2 Setup Guide

This guide explains how to configure OAuth2 authentication for email providers in your EmailAccount nodes, enabling scalable email account connections for any user.

## Overview

The email system uses a credential registry for secure OAuth2 configuration management. This allows for:
- Scalable multi-user email authentication
- Secure credential storage
- Support for multiple email providers
- Environment-based configuration

## Supported Providers

- **Gmail** - Google OAuth2 with Gmail API access
- **Outlook** - Microsoft OAuth2 with Graph API access
- **Yahoo** - Yahoo OAuth2 (configuration ready)

## Environment Variables Setup

### Base Configuration

```bash
# Base URL for your application
NEXT_PUBLIC_BASE_URL=https://your-domain.com
# For local development: http://localhost:3000
```

### Gmail OAuth2 Setup

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API and Google+ API

2. **Create OAuth2 Credentials**
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: Web application
   - Authorized redirect URIs: `https://your-domain.com/api/auth/email/gmail/callback`

3. **Environment Variables**
   ```bash
   GMAIL_CLIENT_ID=your-google-client-id
   GMAIL_CLIENT_SECRET=your-google-client-secret
   GMAIL_REDIRECT_URI=https://your-domain.com/api/auth/email/gmail/callback
   ```

### Outlook OAuth2 Setup

1. **Register Azure Application**
   - Go to [Azure App Registration](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
   - Click "New registration"
   - Name: Your app name
   - Supported account types: Accounts in any organizational directory and personal Microsoft accounts
   - Redirect URI: `https://your-domain.com/api/auth/email/outlook/callback`

2. **Configure API Permissions**
   - Add Microsoft Graph permissions:
     - `Mail.Read` - Read user mail
     - `Mail.Send` - Send mail as user
     - `User.Read` - Read user profile

3. **Environment Variables**
   ```bash
   OUTLOOK_CLIENT_ID=your-azure-application-id
   OUTLOOK_CLIENT_SECRET=your-azure-client-secret
   OUTLOOK_REDIRECT_URI=https://your-domain.com/api/auth/email/outlook/callback
   ```

### Yahoo OAuth2 Setup (Optional)

1. **Create Yahoo Developer Application**
   - Go to [Yahoo Developer Network](https://developer.yahoo.com/)
   - Create new application
   - Select required permissions: Mail

2. **Environment Variables**
   ```bash
   YAHOO_CLIENT_ID=your-yahoo-client-id
   YAHOO_CLIENT_SECRET=your-yahoo-client-secret
   YAHOO_REDIRECT_URI=https://your-domain.com/api/auth/email/yahoo/callback
   ```

## Local Development Setup

For local development, use localhost URLs:

```bash
# .env.local
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Gmail
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/email/gmail/callback

# Outlook  
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/email/outlook/callback

# Yahoo
YAHOO_REDIRECT_URI=http://localhost:3000/api/auth/email/yahoo/callback
```

**Important:** Update your OAuth2 application settings to include localhost URLs for development.

## Production Deployment

### Vercel Deployment

1. Set environment variables in Vercel dashboard:
   - Go to Project Settings > Environment Variables
   - Add all required variables
   - Deploy changes

### Other Hosting Platforms

Ensure all environment variables are properly configured in your hosting platform's environment settings.

## Testing Your Setup

1. **Start Development Server**
   ```bash
   pnpm dev
   ```

2. **Create EmailAccount Node**
   - Add an EmailAccount node to your flow
   - Select Gmail or Outlook as provider
   - Enter your email address
   - Click "Sign in with [Provider]"

3. **Verify Authentication**
   - OAuth2 popup should open
   - Complete authorization flow
   - Node should show "Connected" status

## Troubleshooting

### Common Issues

1. **"OAuth2 is not configured" Error**
   - Check environment variables are set correctly
   - Verify variable names match exactly
   - Restart development server after adding variables

2. **"Redirect URI Mismatch" Error**
   - Ensure redirect URIs in OAuth2 apps match environment variables
   - Check for trailing slashes or http vs https mismatches

3. **"Invalid Client" Error**
   - Verify client ID and secret are correct
   - Check OAuth2 application is enabled and published

4. **Popup Blocked**
   - Enable popups for your domain
   - Use browsers that support popup authentication

### Debugging Tips

1. **Check Console Logs**
   - Server logs show OAuth2 configuration status
   - Browser console shows popup communication

2. **Verify Environment Variables**
   ```bash
   # Check if variables are loaded
   console.log('Gmail Client ID:', process.env.GMAIL_CLIENT_ID);
   ```

3. **Test OAuth2 URLs**
   - Manually visit OAuth2 URLs to verify configuration
   - Check network tab for API call responses

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to version control
   - Use different credentials for development/production
   - Rotate secrets regularly

2. **OAuth2 Scopes**
   - Request minimal required permissions
   - Review scope requests periodically

3. **HTTPS Requirements**
   - Always use HTTPS in production
   - Some providers require HTTPS even for development

## Advanced Configuration

### Custom Credential Providers

You can extend the credential registry for custom credential storage:

```typescript
import { registerCredentialProvider } from "@/features/business-logic-modern/infrastructure/credentials/credentialRegistry";

// Custom provider for external secret storage
registerCredentialProvider<OAuth2Credentials>("custom-gmail", async () => {
  // Fetch from your custom secret store
  return await getFromVault("gmail-oauth2");
});
```

### Multi-Tenant Setup

For multi-tenant applications, you can register tenant-specific providers:

```typescript
// Register tenant-specific Gmail provider
registerCredentialProvider<OAuth2Credentials>(`gmail-oauth2-${tenantId}`, async () => {
  return await getTenantCredentials(tenantId, "gmail");
});
```

## Support

For additional help:
1. Check the troubleshooting section above
2. Verify your OAuth2 application settings
3. Test with a fresh incognito browser session
4. Review server logs for detailed error messages

---

**Note:** This setup enables any authenticated user of your application to connect their email accounts securely. The credentials are stored encrypted in your Convex database and associated with the authenticated user.