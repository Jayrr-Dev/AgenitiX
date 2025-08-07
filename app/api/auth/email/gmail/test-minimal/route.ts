/**
 * Route: app/api/auth/email/gmail/test-minimal/route.ts
 * MINIMAL OAUTH TEST - Test OAuth with absolute minimal configuration
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const redirectUri = "http://localhost:3000/api/auth/email/gmail/callback";
  
  if (!clientId) {
    return NextResponse.json({
      error: "GMAIL_CLIENT_ID not configured"
    });
  }

  // Create minimal OAuth URL with only essential parameters
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "email", // Minimal scope
    access_type: "offline"
  });

  const authUrl = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;

  return NextResponse.json({
    message: "Minimal OAuth test URL",
    authUrl,
    configuration: {
      clientId: clientId.substring(0, 20) + "...",
      redirectUri,
      scope: "email"
    },
    instructions: [
      "1. Copy the authUrl and paste it in your browser",
      "2. Complete the OAuth flow", 
      "3. Check if you get redirected with a 'code' parameter",
      "4. This will help isolate if the issue is with scopes or configuration"
    ]
  });
}
