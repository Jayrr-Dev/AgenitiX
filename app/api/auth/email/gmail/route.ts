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
      scopes: config.scopes,
      hasClientSecret: !!config.clientSecret,
      authUrl: authUrl.substring(0, 100) + "...",
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
