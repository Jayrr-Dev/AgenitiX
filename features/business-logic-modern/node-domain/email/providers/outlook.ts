/**
 * Outlook Provider Implementation
 * 
 * Handles Microsoft Outlook OAuth2 authentication and connection validation.
 */

import type { EmailAccountConfig, ConnectionResult, OAuth2Tokens, ProviderCapabilities } from '../types';
import { BaseEmailProvider } from './base';
import { createEmailError } from '../utils';

// Microsoft OAuth2 configuration
const OUTLOOK_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_OUTLOOK_CLIENT_ID || 'f8cdef31-a31e-4b4a-93e4-5f571e91255a',
  clientSecret: process.env.OUTLOOK_CLIENT_SECRET || 'f8cdef31-a31e-4b4a-93e4-5f571e91255a',
  redirectUri: process.env.NEXT_PUBLIC_BASE_URL + '/api/auth/email/outlook/callback',
  scope: 'https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
  authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
  tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
};

async function validateOutlookConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
  try {
    if (!config.accessToken) {
      return {
        success: false,
        error: createEmailError(
          'INVALID_CREDENTIALS',
          'Outlook access token is required',
          { provider: 'outlook' },
          true
        ),
      };
    }

    // Test connection by fetching user profile
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: createEmailError(
            'TOKEN_EXPIRED',
            'Outlook access token has expired. Please re-authenticate.',
            { provider: 'outlook', status: response.status },
            true
          ),
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: createEmailError(
            'PERMISSION_DENIED',
            'Outlook API access denied. Please check your permissions.',
            { provider: 'outlook', status: response.status },
            true
          ),
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: createEmailError(
            'RATE_LIMIT_EXCEEDED',
            'Outlook API rate limit exceeded. Please try again later.',
            { provider: 'outlook', status: response.status },
            true,
            300 // 5 minutes
          ),
        };
      }

      return {
        success: false,
        error: createEmailError(
          'PROVIDER_ERROR',
          `Microsoft Graph API error: ${response.status} ${response.statusText}`,
          { provider: 'outlook', status: response.status },
          false
        ),
      };
    }

    const profile = await response.json();

    // Also check mailbox access
    const mailboxResponse = await fetch('https://graph.microsoft.com/v1.0/me/mailFolders/inbox', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mailboxResponse.ok) {
      return {
        success: false,
        error: createEmailError(
          'PERMISSION_DENIED',
          'Unable to access Outlook mailbox. Please check your permissions.',
          { provider: 'outlook', mailboxStatus: mailboxResponse.status },
          true
        ),
      };
    }

    // Validate that we have the expected data
    const email = profile.mail || profile.userPrincipalName;
    if (!email) {
      return {
        success: false,
        error: createEmailError(
          'PROVIDER_ERROR',
          'Outlook profile data is incomplete',
          { provider: 'outlook', profile },
          false
        ),
      };
    }

    return {
      success: true,
      accountInfo: {
        email,
        displayName: profile.displayName || email,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: createEmailError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown network error',
        { provider: 'outlook', originalError: error },
        true
      ),
    };
  }
}

function getOutlookOAuthUrl(redirectUri: string, state?: string): string {
  const params: Record<string, string> = {
    client_id: OUTLOOK_OAUTH_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OUTLOOK_OAUTH_CONFIG.scope,
    response_mode: 'query',
  };

  if (state) {
    params.state = state;
  }

  return `${OUTLOOK_OAUTH_CONFIG.authUrl}?${new URLSearchParams(params).toString()}`;
}

async function exchangeOutlookCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
  const response = await fetch(OUTLOOK_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: OUTLOOK_OAUTH_CONFIG.clientId,
      client_secret: OUTLOOK_OAUTH_CONFIG.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
    scope: data.scope,
  };
}

class OutlookProvider extends BaseEmailProvider {
  readonly id = 'outlook' as const;
  readonly name = 'Outlook';
  readonly authType = 'oauth2' as const;
  readonly configFields = []; // OAuth2 providers don't need manual config fields
  
  readonly capabilities: ProviderCapabilities = {
    canSend: true,
    canReceive: true,
    supportsAttachments: true,
    supportsHtml: true,
    maxAttachmentSize: 150 * 1024 * 1024, // 150MB
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 3600,
      requestsPerDay: 86400,
    },
  };

  readonly defaultConfig = {
    useSSL: true,
  };

  async validateConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
    return validateOutlookConnection(config);
  }

  getOAuthUrl(redirectUri: string, state?: string): string {
    return getOutlookOAuthUrl(redirectUri, state);
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    return exchangeOutlookCodeForTokens(code, redirectUri);
  }

  async refreshTokens(refreshToken: string): Promise<OAuth2Tokens> {
    return this.exchangeTokens(OUTLOOK_OAUTH_CONFIG.tokenUrl, {
      client_id: OUTLOOK_OAUTH_CONFIG.clientId,
      client_secret: OUTLOOK_OAUTH_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });
  }
}

export const outlookProvider = new OutlookProvider();