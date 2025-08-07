/**
 * Route: app/api/auth/email/gmail/check-config/route.ts
 * GOOGLE OAUTH CONFIG CHECK - Diagnostic endpoint for OAuth app configuration
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return NextResponse.json({
      error: "Gmail OAuth credentials not configured",
      missing: {
        clientId: !clientId,
        clientSecret: !clientSecret
      }
    });
  }

  // Test different OAuth configurations
  const testConfigs = [
    {
      name: "Minimal (email only)",
      params: {
        client_id: clientId,
        redirect_uri: "http://localhost:3000/api/auth/email/gmail/callback",
        response_type: "code",
        scope: "email",
        access_type: "offline"
      }
    },
    {
      name: "Basic (email + profile)",
      params: {
        client_id: clientId,
        redirect_uri: "http://localhost:3000/api/auth/email/gmail/callback", 
        response_type: "code",
        scope: "email profile",
        access_type: "offline"
      }
    },
    {
      name: "Gmail (with Gmail scopes)",
      params: {
        client_id: clientId,
        redirect_uri: "http://localhost:3000/api/auth/email/gmail/callback",
        response_type: "code", 
        scope: "email profile https://www.googleapis.com/auth/gmail.readonly",
        access_type: "offline"
      }
    }
  ];

  const results = testConfigs.map(config => {
    const authUrl = `https://accounts.google.com/o/oauth2/auth?${new URLSearchParams(config.params).toString()}`;
    return {
      name: config.name,
      authUrl,
      params: config.params,
      urlLength: authUrl.length
    };
  });

  return NextResponse.json({
    message: "Google OAuth configuration test",
    environment: {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdPrefix: clientId.substring(0, 20) + "..."
    },
    testConfigs: results,
    googleConsoleChecklist: [
      "✅ OAuth 2.0 Client ID exists",
      "✅ Authorized redirect URIs includes: http://localhost:3000/api/auth/email/gmail/callback",
      "✅ Authorized JavaScript origins includes: http://localhost:3000", 
      "✅ Gmail API is enabled",
      "✅ OAuth consent screen is configured",
      "❓ App is published OR you're a test user",
      "❓ No IP restrictions blocking your network"
    ],
    troubleshooting: {
      "No authorization code": [
        "Check redirect URI matches exactly in Google Console",
        "Verify you're a test user if app is in testing mode",
        "Try in incognito mode with single Google account",
        "Check if corporate firewall blocks OAuth endpoints"
      ],
      "Getting scopes but no code": [
        "Google is rejecting the OAuth request silently",
        "Usually due to redirect URI mismatch or app configuration",
        "Check Google Console for any error messages",
        "Verify OAuth app is not disabled or restricted"
      ]
    }
  });
}
