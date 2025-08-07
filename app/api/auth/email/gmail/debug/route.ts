/**
 * Route: app/api/auth/email/gmail/debug/route.ts
 * GMAIL OAUTH DEBUG - Diagnostic endpoint to check OAuth configuration
 *
 * • Shows OAuth configuration without starting flow
 * • Helps diagnose redirect URI and credential issues
 * • Only available in development mode
 *
 * Keywords: gmail-debug, oauth-config, diagnostic, development
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getEmailProviderConfig,
  buildOAuth2AuthUrl,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Debug endpoint only available in development" },
      { status: 403 }
    );
  }

  try {
    const config = await getEmailProviderConfig("gmail");
    
    if (!config) {
      return NextResponse.json({
        error: "Gmail OAuth2 configuration not found",
        help: "Make sure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are set in your environment"
      });
    }

    // Build a test auth URL
    const testRedirectUri = `${request.nextUrl.origin}/api/auth/email/gmail/callback`;
    const testAuthUrl = buildOAuth2AuthUrl(config, "test-state");

    return NextResponse.json({
      configuration: {
        clientId: config.clientId?.substring(0, 20) + "...",
        redirectUri: config.redirectUri,
        expectedRedirectUri: testRedirectUri,
        redirectUriMatch: config.redirectUri === testRedirectUri,
        scopes: config.scopes,
        hasClientSecret: !!config.clientSecret,
      },
      environment: {
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
        nodeEnv: process.env.NODE_ENV,
        hasGmailClientId: !!process.env.GMAIL_CLIENT_ID,
        hasGmailClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
        hasGmailRedirectUri: !!process.env.GMAIL_REDIRECT_URI,
      },
      testAuthUrl,
      googleConsoleSetup: {
        message: "Make sure your Google Console is configured with:",
        authorizedRedirectUris: [testRedirectUri],
        authorizedJavaScriptOrigins: [request.nextUrl.origin],
        requiredScopes: config.scopes,
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: "Failed to get Gmail configuration",
      details: error instanceof Error ? error.message : String(error),
      help: "Check your environment variables and credential setup"
    });
  }
}