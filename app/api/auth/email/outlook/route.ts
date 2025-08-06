/**
 * Route: app/api/auth/email/outlook/route.ts
 * OUTLOOK OAUTH2 AUTHENTICATION - Real Microsoft OAuth2 integration
 *
 * • Handles Outlook OAuth2 authorization flow initiation
 * • Uses credential registry for secure configuration management
 * • Redirects users to Microsoft's OAuth2 consent screen
 * • Supports session token passing for authentication state
 *
 * Keywords: outlook-oauth2, microsoft-graph, credential-registry, authentication
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getEmailProviderConfig,
  buildOAuth2AuthUrl,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri");
  const sessionToken = searchParams.get("session_token");

  if (!redirectUri) {
    return NextResponse.json(
      { error: "redirect_uri is required" },
      { status: 400 }
    );
  }

  try {
    // Get Outlook OAuth2 configuration using credential registry
    const config = await getEmailProviderConfig("outlook");

    if (!config) {
      console.error("Outlook OAuth2 configuration not found");
      return NextResponse.json(
        {
          error:
            "Outlook OAuth2 is not configured. Please contact your administrator.",
        },
        { status: 500 }
      );
    }

    // Validate required configuration
    if (!config.clientId || !config.clientSecret) {
      console.error("Incomplete Outlook OAuth2 configuration");
      return NextResponse.json(
        {
          error:
            "Outlook OAuth2 is not properly configured. Please contact your administrator.",
        },
        { status: 500 }
      );
    }

    // Build OAuth2 authorization URL using credential provider, basically creates secure auth URL
    const authUrl = buildOAuth2AuthUrl(config, sessionToken || undefined);

    return NextResponse.json({
      authUrl,
    });
  } catch (error) {
    console.error("Outlook OAuth2 setup error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to setup Outlook OAuth2. Please contact your administrator.",
      },
      { status: 500 }
    );
  }
}
