import { NextRequest, NextResponse } from "next/server";

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

  // Gmail OAuth2 configuration
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUriEnv = process.env.GMAIL_REDIRECT_URI;

  // Validate environment variables
  if (!clientId) {
    console.error("GMAIL_CLIENT_ID environment variable is not set");
    return NextResponse.json(
      {
        error:
          "Gmail OAuth2 is not configured. Please contact your administrator.",
      },
      { status: 500 }
    );
  }

  if (!clientSecret) {
    console.error("GMAIL_CLIENT_SECRET environment variable is not set");
    return NextResponse.json(
      {
        error:
          "Gmail OAuth2 is not configured. Please contact your administrator.",
      },
      { status: 500 }
    );
  }

  if (!redirectUriEnv) {
    console.error("GMAIL_REDIRECT_URI environment variable is not set");
    return NextResponse.json(
      {
        error:
          "Gmail OAuth2 is not configured. Please contact your administrator.",
      },
      { status: 500 }
    );
  }

  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ].join(" ");

  // Build OAuth2 URL
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUriEnv); // Use environment variable
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  // Include session token in state parameter for authentication
  if (sessionToken) {
    authUrl.searchParams.set("state", sessionToken);
  }

  return NextResponse.json({ authUrl: authUrl.toString() });
}
