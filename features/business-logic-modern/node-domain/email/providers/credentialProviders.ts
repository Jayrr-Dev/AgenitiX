/* ------------------------------------------------------------------
 * EMAIL CREDENTIAL PROVIDERS – OAuth2 metadata & helpers
 * ------------------------------------------------------------------
 *  • Registers Gmail / Outlook / Yahoo credential providers
 *  • Reads secrets from ENV with compile-time safety
 *  • Exposes helpers: buildAuthUrl, exchangeCode, getUserInfo
 * ------------------------------------------------------------------ */

import {
  registerCredentialProvider,
  registerEnvironmentProvider,
  resolveCredential,
} from "@/features/business-logic-modern/infrastructure/credentials/credentialRegistry";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Provider = "gmail" | "outlook";

export interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface EmailProviderConfig extends OAuth2Credentials {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
}

/* ------------------------------------------------------------------ */
/* Provider metadata (single source-of-truth)                         */
/* ------------------------------------------------------------------ */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const PROVIDERS: Record<
  Provider,
  {
    envPrefix: string; // e.g. "GMAIL"
    meta: Omit<EmailProviderConfig, keyof OAuth2Credentials>;
    defaultScopes: string[];
  }
> = {
  gmail: {
    envPrefix: "GMAIL",
    meta: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth", // Use v2 endpoint per Google docs
      tokenUrl: "https://www.googleapis.com/oauth2/v4/token", // Use v4 for better reliability
      userInfoUrl: "https://www.googleapis.com/oauth2/v1/userinfo", // Use v1 for basic info
    },
    defaultScopes: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile", 
      "https://www.googleapis.com/auth/gmail.readonly",
    ],
  },
  outlook: {
    envPrefix: "OUTLOOK",
    meta: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/v1.0/me",
    },
    defaultScopes: [
      "https://graph.microsoft.com/Mail.Read",
      "https://graph.microsoft.com/Mail.Send",
      "https://graph.microsoft.com/User.Read",
    ],
  },

};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Read env var or throw (fail fast) */
const env = (key: string, fallback = "") => {
  const val = process.env[key] ?? fallback;
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

/** Build redirect URI consistently */
const redirectUri = (p: Provider) => {
  const uri = `${BASE_URL}/api/auth/email/${p}/callback`;
  return uri;
};

/* ------------------------------------------------------------------ */
/* Registry initialisation (runs once at module load)                 */
/* ------------------------------------------------------------------ */

(function initCredentialProviders() {
  registerEnvironmentProvider(); // baseline

  (Object.keys(PROVIDERS) as Provider[]).forEach((provider) => {
    const { defaultScopes } = PROVIDERS[provider];
    
    registerCredentialProvider<OAuth2Credentials>(
      `${provider}-oauth2`,
      async () => {
        const { envPrefix, defaultScopes } = PROVIDERS[provider];
        const credentials = {
          clientId: env(`${envPrefix}_CLIENT_ID`),
          clientSecret: env(`${envPrefix}_CLIENT_SECRET`),
          redirectUri: env(`${envPrefix}_REDIRECT_URI`, redirectUri(provider)),
          scopes: defaultScopes,
        };
        
        return credentials;
      },
    );
  });
})();

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export const getEmailProviderCredentials = async (
  provider: Provider,
): Promise<OAuth2Credentials | null> => {
  const credentials = await resolveCredential<OAuth2Credentials>(`${provider}-oauth2`, "default");
  return credentials;
};

export const getEmailProviderConfig = async (
  provider: Provider,
): Promise<EmailProviderConfig | null> => {
  const creds = await getEmailProviderCredentials(provider);
  if (!creds) return null;
  
  const { meta } = PROVIDERS[provider];
  const config = { ...creds, ...meta };
  
  return config;
};

export const buildOAuth2AuthUrl = (
  config: EmailProviderConfig,
  state?: string,
): string => {
  const params = new URLSearchParams();
  
  // Add parameters in specific order for better compatibility
  params.append("client_id", config.clientId);
  params.append("redirect_uri", config.redirectUri);
  params.append("response_type", "code");
  
  // 🔍 FIXED: Properly encode the scope parameter
  const scopeString = config.scopes.join(" ");
  params.append("scope", scopeString);
  
  params.append("access_type", "offline");
  params.append("prompt", "consent");
  params.append("include_granted_scopes", "true");
  
  // Add cache-busting parameter to force fresh authorization
  params.append("t", Date.now().toString());
  
  if (state) {
    params.append("state", state);
  }
  
  const authUrl = `${config.authUrl}?${params.toString()}`;
  
  return authUrl;
};

export const exchangeCodeForTokens = async (
  provider: Provider,
  authorizationCode: string,
): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
  tokenType: string;
}> => {
  const cfg = await getEmailProviderConfig(provider);
  if (!cfg) throw new Error(`Provider ${provider} not configured`);

  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      code: authorizationCode,
      grant_type: "authorization_code",
      redirect_uri: cfg.redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Token exchange failed (${res.status}): ${await res.text()}`,
    );
  }

  const t = await res.json();
  return {
    accessToken: t.access_token,
    refreshToken: t.refresh_token,
    expiresIn: t.expires_in ?? 3600,
    tokenType: t.token_type ?? "Bearer",
  };
};

export const getUserInfo = async (
  provider: Provider,
  accessToken: string,
): Promise<{ email: string; name: string; picture?: string }> => {
  const cfg = await getEmailProviderConfig(provider);
  if (!cfg) throw new Error(`${provider} not configured`);

  const res = await fetch(cfg.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`User-info fetch failed: ${res.status}`);

  const u = await res.json();

  /** Minimal cross-provider normalisation */
  switch (provider) {
    case "gmail":
      return { email: u.email, name: u.name ?? u.email, picture: u.picture };
    case "outlook":
      return {
        email: u.mail ?? u.userPrincipalName,
        name: u.displayName ?? u.mail,
      };
    default: // yahoo or future providers
      return { email: u.email, name: u.name ?? u.email, picture: u.picture };
  }
};
