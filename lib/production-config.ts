/**
 * Route: lib/production-config.ts
 * PRODUCTION CONFIGURATION - Centralized production settings for email and auth
 *
 * • Production email settings and Resend configuration
 * • Environment variable validation for production deployment
 * • Test mode controls for development vs production
 *
 * Keywords: production-config, email-settings, resend-config, environment-vars
 */

/**
 * Production email configuration
 */
export const PRODUCTION_EMAIL_CONFIG = {
  // Disable test mode for production emails
  testMode: false,

  // Production email settings
  enableProductionEmails: process.env.NODE_ENV === "production",

  // Resend configuration
  resendApiKey: process.env.RESEND_API_KEY,
  resendFromEmail:
    process.env.RESEND_FROM_EMAIL || "AgenitiX <noreply@agenitix.com>",

  // Auth configuration
  authResendKey: process.env.AUTH_RESEND_KEY,
} as const;

/**
 * Validate production environment variables
 */
export function validateProductionConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (process.env.NODE_ENV === "production") {
    if (!PRODUCTION_EMAIL_CONFIG.resendApiKey) {
      errors.push("RESEND_API_KEY is required for production");
    }

    if (!PRODUCTION_EMAIL_CONFIG.authResendKey) {
      errors.push("AUTH_RESEND_KEY is required for production");
    }

    if (!PRODUCTION_EMAIL_CONFIG.resendFromEmail) {
      errors.push("RESEND_FROM_EMAIL is required for production");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if production mode is enabled
 */
export function isProductionMode(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if test mode should be enabled
 */
export function shouldEnableTestMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.ENABLE_DEV_EMAILS === "true"
  );
}
