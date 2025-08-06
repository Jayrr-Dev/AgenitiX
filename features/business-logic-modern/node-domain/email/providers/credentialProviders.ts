/**
 * Route: features/business-logic-modern/node-domain/email/providers/credentialProviders.ts
 * EMAIL CREDENTIAL PROVIDERS - Secure OAuth2 credential management
 *
 * • Registers OAuth2 credential providers for email services
 * • Supports environment variables and external credential stores
 * • Provides type-safe credential retrieval for Gmail, Outlook, etc.
 * • Enables scalable multi-tenant OAuth2 configuration
 *
 * Keywords: oauth2-credentials, secure-storage, credential-registry, multi-tenant
 */

import {
  registerCredentialProvider,
  registerEnvironmentProvider,
  resolveCredential,
} from "@/features/business-logic-modern/infrastructure/credentials/credentialRegistry";

// OAuth2 credential types
export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface EmailProviderConfig extends OAuth2Credentials {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
}

// Provider-specific configurations
const GMAIL_CONFIG = {
  authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  scopes: [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],
};

const OUTLOOK_CONFIG = {
  authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
  tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
  userInfoUrl: "https://graph.microsoft.com/v1.0/me",
  scopes: [
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/User.Read",
  ],
};

/**
 * Initialize credential providers for email OAuth2
 * Registers environment and custom providers
 */
export const initializeEmailCredentialProviders = () => {
  // Register environment provider for basic setup
  registerEnvironmentProvider();

  // Register Gmail credential provider
  registerCredentialProvider<OAuth2Credentials>("gmail-oauth2", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    return {
      clientId: process.env.GMAIL_CLIENT_ID || "",
      clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
      redirectUri: process.env.GMAIL_REDIRECT_URI || `${baseUrl}/api/auth/email/gmail/callback`,
      scopes: GMAIL_CONFIG.scopes,
    };
  });

  // Register Outlook credential provider
  registerCredentialProvider<OAuth2Credentials>("outlook-oauth2", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    return {
      clientId: process.env.OUTLOOK_CLIENT_ID || "",
      clientSecret: process.env.OUTLOOK_CLIENT_SECRET || "",
      redirectUri: process.env.OUTLOOK_REDIRECT_URI || `${baseUrl}/api/auth/email/outlook/callback`,
      scopes: OUTLOOK_CONFIG.scopes,
    };
  });

  // Register Yahoo credential provider (if supported)
  registerCredentialProvider<OAuth2Credentials>("yahoo-oauth2", async () => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    return {
      clientId: process.env.YAHOO_CLIENT_ID || "",
      clientSecret: process.env.YAHOO_CLIENT_SECRET || "",
      redirectUri: process.env.YAHOO_REDIRECT_URI || `${baseUrl}/api/auth/email/yahoo/callback`,
      scopes: ["mail-r", "mail-w", "openid", "email", "profile"],
    };
  });
};

/**
 * Get OAuth2 credentials for a specific email provider
 * Uses credential registry for secure retrieval
 */
export const getEmailProviderCredentials = async (
  provider: "gmail" | "outlook" | "yahoo"
): Promise<OAuth2Credentials | null> => {
  try {
    const credentials = await resolveCredential<OAuth2Credentials>(
      `${provider}-oauth2`,
      "default"
    );

    if (!credentials) {
      console.error(`No credentials found for provider: ${provider}`);
      return null;
    }

    // Validate required fields
    if (!credentials.clientId || !credentials.clientSecret) {
      console.error(`Incomplete credentials for provider: ${provider}`);
      return null;
    }

    return credentials;
  } catch (error) {
    console.error(`Failed to get credentials for ${provider}:`, error);
    return null;
  }
};

/**
 * Get complete provider configuration including URLs and scopes
 * Combines credentials with provider-specific configuration
 */
export const getEmailProviderConfig = async (
  provider: "gmail" | "outlook" | "yahoo"
): Promise<EmailProviderConfig | null> => {
  const credentials = await getEmailProviderCredentials(provider);
  if (!credentials) {
    return null;
  }

  const providerConfigs = {
    gmail: GMAIL_CONFIG,
    outlook: OUTLOOK_CONFIG,
    yahoo: {
      authUrl: "https://api.login.yahoo.com/oauth2/request_auth",
      tokenUrl: "https://api.login.yahoo.com/oauth2/get_token",
      userInfoUrl: "https://api.login.yahoo.com/openid/v1/userinfo",
    },
  };

  const config = providerConfigs[provider];
  if (!config) {
    console.error(`No configuration found for provider: ${provider}`);
    return null;
  }

  return {
    ...credentials,
    ...config,
  };
};

/**
 * Build OAuth2 authorization URL
 * Creates properly formatted OAuth2 URL with all required parameters
 */
export const buildOAuth2AuthUrl = (
  config: EmailProviderConfig,
  state?: string
): string => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline", // Request refresh token
    prompt: "consent", // Force consent screen to get refresh token
  });

  if (state) {
    params.set("state", state);
  }

  return `${config.authUrl}?${params.toString()}`;
};

/**
 * Exchange authorization code for tokens
 * Handles the OAuth2 token exchange flow
 */
export const exchangeCodeForTokens = async (
  provider: "gmail" | "outlook" | "yahoo",
  authorizationCode: string,
  state?: string
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
} | null> => {
  const config = await getEmailProviderConfig(provider);
  if (!config) {
    throw new Error(`Provider ${provider} is not configured`);
  }

  try {
    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: authorizationCode,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
    }

    const tokens = await response.json();

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in || 3600,
      tokenType: tokens.token_type || "Bearer",
    };
  } catch (error) {
    console.error(`Token exchange failed for ${provider}:`, error);
    throw error;
  }
};

/**
 * Get user information from OAuth2 provider
 * Fetches user details using access token
 */
export const getUserInfo = async (
  provider: "gmail" | "outlook" | "yahoo",
  accessToken: string
): Promise<{
  email: string;
  name: string;
  picture?: string;
} | null> => {
  const config = await getEmailProviderConfig(provider);
  if (!config?.userInfoUrl) {
    throw new Error(`No user info URL configured for ${provider}`);
  }

  try {
    const response = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    const userInfo = await response.json();

    // Normalize response format across providers
    if (provider === "gmail") {
      return {
        email: userInfo.email,
        name: userInfo.name || userInfo.email,
        picture: userInfo.picture,
      };
    } else if (provider === "outlook") {
      return {
        email: userInfo.mail || userInfo.userPrincipalName,
        name: userInfo.displayName || userInfo.mail,
        picture: userInfo.photo?.["@odata.mediaReadLink"],
      };
    }

    // Default format
    return {
      email: userInfo.email,
      name: userInfo.name || userInfo.email,
      picture: userInfo.picture,
    };
  } catch (error) {
    console.error(`Failed to get user info for ${provider}:`, error);
    throw error;
  }
};

// Initialize providers when module loads
initializeEmailCredentialProviders();