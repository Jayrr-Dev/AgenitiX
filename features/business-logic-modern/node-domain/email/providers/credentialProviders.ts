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

export type Provider = "gmail" | "outlook" | "yahoo";

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
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    },
    defaultScopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
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
  yahoo: {
    envPrefix: "YAHOO",
    meta: {
      authUrl: "https://api.login.yahoo.com/oauth2/request_auth",
      tokenUrl: "https://api.login.yahoo.com/oauth2/get_token",
      userInfoUrl: "https://api.login.yahoo.com/openid/v1/userinfo",
    },
    defaultScopes: ["mail-r", "mail-w", "openid", "email", "profile"],
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
const redirectUri = (p: Provider) =>
  `${BASE_URL}/api/auth/email/${p}/callback`;

/* ------------------------------------------------------------------ */
/* Registry initialisation (runs once at module load)                 */
/* ------------------------------------------------------------------ */

(function initCredentialProviders() {
  registerEnvironmentProvider(); // baseline

  (Object.keys(PROVIDERS) as Provider[]).forEach((provider) => {
    registerCredentialProvider<OAuth2Credentials>(
      `${provider}-oauth2`,
      async () => {
        const { envPrefix, defaultScopes } = PROVIDERS[provider];
        return {
          clientId: env(`${envPrefix}_CLIENT_ID`),
          clientSecret: env(`${envPrefix}_CLIENT_SECRET`),
          redirectUri: env(`${envPrefix}_REDIRECT_URI`, redirectUri(provider)),
          scopes: defaultScopes,
        };
      },
    );
  });
})();

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export const getEmailProviderCredentials = async (
  provider: Provider,
): Promise<OAuth2Credentials | null> =>
  resolveCredential<OAuth2Credentials>(`${provider}-oauth2`, "default");

export const getEmailProviderConfig = async (
  provider: Provider,
): Promise<EmailProviderConfig | null> => {
  const creds = await getEmailProviderCredentials(provider);
  if (!creds) return null;
  const { meta } = PROVIDERS[provider];
  return { ...creds, ...meta };
};

export const buildOAuth2AuthUrl = (
  config: EmailProviderConfig,
  state?: string,
): string => {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    prompt: "consent",
    ...(state && { state }),
  });
  return `${config.authUrl}?${params.toString()}`;
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
