import { NextRequest, NextResponse } from "next/server";
import {
  getEmailProviderConfig,
  buildOAuth2AuthUrl,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";
import { withCors } from "@/lib/cors";

export const GET = withCors(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const redirectUri = searchParams.get("redirect_uri");
  const sessionToken = searchParams.get("session_token");



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
});

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": process.env.NODE_ENV === "development" 
        ? "http://localhost:3000" 
        : process.env.NEXT_PUBLIC_BASE_URL || "https://your-domain.com",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
    },
  });
}
