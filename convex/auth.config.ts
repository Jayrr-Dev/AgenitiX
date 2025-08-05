/**
 * Route: convex/auth.config.ts
 * CONVEX AUTH CONFIGURATION - OAuth provider settings for Convex Auth
 *
 * • Configures GitHub OAuth provider with environment variables
 * • Required for Convex Auth GitHub integration to work properly
 * • Client ID and secret should be set in environment variables
 * • Used by the auth system defined in convex/auth.ts
 *
 * Keywords: convex-auth-config, github-oauth, environment-variables
 */

export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
