/**
 * Gmail Provider Implementation
 * 
 * Handles Gmail-specific OAuth2 authentication and connection validation.
 */

import type { EmailAccountConfig, ConnectionResult, OAuth2Tokens, ProviderCapabilities } from '../types';
import { BaseEmailProvider } from './base';
import { createEmailError } from '../utils';

// Gmail OAuth2 configuration
const GMAIL_OAUTH_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID || '924539398543-ojqqummnk3593k1fm1803cl28t274tmo.apps.googleusercontent.com',
  clientSecret: process.env.GMAIL_CLIENT_SECRET || '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',
  redirectUri: 'http://localhost:3000/api/auth/email/gmail/callback',
  scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
  authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
};

async function validateGmailConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
  try {
    if (!config.accessToken) {
      return {
        success: false,
        error: createEmailError(
          'INVALID_CREDENTIALS',
          'Gmail access token is required',
          { provider: 'gmail' },
          true
        ),
      };
    }

    // Test connection by fetching user profile
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/profile', {
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
            'Gmail access token has expired. Please re-authenticate.',
            { provider: 'gmail', status: response.status },
            true
          ),
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: createEmailError(
            'PERMISSION_DENIED',
            'Gmail API access denied. Please check your permissions.',
            { provider: 'gmail', status: response.status },
            true
          ),
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: createEmailError(
            'RATE_LIMIT_EXCEEDED',
            'Gmail API rate limit exceeded. Please try again later.',
            { provider: 'gmail', status: response.status },
            true,
            300 // 5 minutes
          ),
        };
      }

      return {
        success: false,
        error: createEmailError(
          'PROVIDER_ERROR',
          `Gmail API error: ${response.status} ${response.statusText}`,
          { provider: 'gmail', status: response.status },
          false
        ),
      };
    }

    const profile = await response.json();

    // Validate that we have the expected data
    if (!profile.emailAddress) {
      return {
        success: false,
        error: createEmailError(
          'PROVIDER_ERROR',
          'Gmail profile data is incomplete',
          { provider: 'gmail', profile },
          false
        ),
      };
    }

    return {
      success: true,
      accountInfo: {
        email: profile.emailAddress,
        displayName: profile.emailAddress,
        quotaUsed: profile.messagesTotal || 0,
        quotaTotal: profile.threadsTotal || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: createEmailError(
        'NETWORK_ERROR',
        error instanceof Error ? error.message : 'Unknown network error',
        { provider: 'gmail', originalError: error },
        true
      ),
    };
  }
}

function getGmailOAuthUrl(redirectUri: string, state?: string): string {
  const params: Record<string, string> = {
    client_id: GMAIL_OAUTH_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GMAIL_OAUTH_CONFIG.scope,
    access_type: 'offline',
    prompt: 'consent',
  };

  if (state) {
    params.state = state;
  }

  return `${GMAIL_OAUTH_CONFIG.authUrl}?${new URLSearchParams(params).toString()}`;
}

async function exchangeGmailCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
  const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: GMAIL_OAUTH_CONFIG.clientId,
      client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
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

class GmailProvider extends BaseEmailProvider {
  readonly id = 'gmail' as const;
  readonly name = 'Gmail';
  readonly authType = 'oauth2' as const;
  readonly configFields = []; // OAuth2 providers don't need manual config fields

  readonly capabilities: ProviderCapabilities = {
    canSend: true,
    canReceive: true,
    supportsAttachments: true,
    supportsHtml: true,
    maxAttachmentSize: 25 * 1024 * 1024, // 25MB
    rateLimit: {
      requestsPerMinute: 250,
      requestsPerHour: 1000,
      requestsPerDay: 1000000,
    },
  };

  readonly defaultConfig = {
    useSSL: true,
  };

  async validateConnection(config: EmailAccountConfig): Promise<ConnectionResult> {
    return validateGmailConnection(config);
  }

  getOAuthUrl(redirectUri: string, state?: string): string {
    return getGmailOAuthUrl(redirectUri, state);
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuth2Tokens> {
    return exchangeGmailCodeForTokens(code, redirectUri);
  }

  async refreshTokens(refreshToken: string): Promise<OAuth2Tokens> {
    const response = await fetch(GMAIL_OAUTH_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GMAIL_OAUTH_CONFIG.clientId,
        client_secret: GMAIL_OAUTH_CONFIG.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh tokens: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: refreshToken, // Gmail doesn't return new refresh token
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
    };
  }
}

export const gmailProvider = new GmailProvider();