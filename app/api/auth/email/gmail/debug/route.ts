import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Check environment variables
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  const config = {
    clientId: clientId ? "✅ Set" : "❌ Missing",
    clientSecret: clientSecret ? "✅ Set" : "❌ Missing",
    redirectUri: redirectUri ? "✅ Set" : "❌ Missing",
    allConfigured: !!(clientId && clientSecret && redirectUri),
  };

  return NextResponse.json({
    status: config.allConfigured ? "ready" : "not_configured",
    config,
    message: config.allConfigured
      ? "Gmail OAuth2 is properly configured"
      : "Gmail OAuth2 is not properly configured. Please set the required environment variables.",
  });
}
