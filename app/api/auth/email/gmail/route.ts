import { NextRequest, NextResponse } from "next/server";
import {
  getEmailProviderConfig,
  buildOAuth2AuthUrl,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri");
  const sessionToken = searchParams.get("session_token");

  console.log("📧 Gmail OAuth Request:", {
    redirectUri,
    hasSessionToken: !!sessionToken,
    sessionTokenLength: sessionToken?.length,
    userAgent: request.headers.get('user-agent'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
  });

  if (!redirectUri) {
    return NextResponse.json(
      { error: "redirect_uri is required" },
      { status: 400 }
    );
  }

  if (!sessionToken) {
    console.error("📧 Missing session token in OAuth request");
    return NextResponse.json(
      { error: "session_token is required for OAuth authentication" },
      { status: 400 }
    );
  }

  try {
    // Get Gmail OAuth2 configuration using credential registry
    const config = await getEmailProviderConfig("gmail");

    if (!config) {
      console.error("Gmail OAuth2 configuration not found");
      return NextResponse.json(
        {
          error:
            "Gmail OAuth2 is not configured. Please contact your administrator.",
        },
        { status: 500 }
      );
    }

    // Validate required configuration
    if (!config.clientId || !config.clientSecret) {
      console.error("Incomplete Gmail OAuth2 configuration");
      return NextResponse.json(
        {
          error:
            "Gmail OAuth2 is not properly configured. Please contact your administrator.",
        },
        { status: 500 }
      );
    }

    // Build OAuth2 authorization URL using credential provider, basically creates secure auth URL
    const authUrl = buildOAuth2AuthUrl(config, sessionToken || undefined);

    // Debug OAuth URL and configuration
    console.log("📧 Gmail OAuth Configuration:", {
      clientId: config.clientId?.substring(0, 20) + "...",
      redirectUri: config.redirectUri,
      requestedRedirectUri: redirectUri,
      scopes: config.scopes,
      hasClientSecret: !!config.clientSecret,
      authUrl: authUrl.substring(0, 100) + "...",
      fullAuthUrl: authUrl, // Log full URL to debug params
    });

    return NextResponse.json({
      authUrl,
    });
  } catch (error) {
    console.error("Gmail OAuth2 setup error:", error);
    return NextResponse.json(
      {
        error:
          "Failed to setup Gmail OAuth2. Please contact your administrator.",
      },
      { status: 500 }
    );
  }
}
