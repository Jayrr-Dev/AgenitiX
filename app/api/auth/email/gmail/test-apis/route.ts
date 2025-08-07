/**
 * Route: app/api/auth/email/gmail/test-apis/route.ts
 * GMAIL API TEST - Test if required Google APIs are enabled and accessible
 */

import { NextRequest, NextResponse } from "next/server";
import { getEmailProviderConfig } from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

export async function GET(request: NextRequest) {
  try {
    const config = await getEmailProviderConfig("gmail");
    
    if (!config) {
      return NextResponse.json({
        error: "Gmail configuration not found"
      });
    }

    // Test Google APIs accessibility
    const tests = [];

    // Test 1: OAuth2 discovery document (try multiple endpoints)
    const discoveryUrls = [
      "https://accounts.google.com/.well-known/openid_configuration",
      "https://www.googleapis.com/oauth2/v3/certs",
      "https://www.googleapis.com/auth/userinfo.email" // Simple scope test
    ];

    for (const [index, url] of discoveryUrls.entries()) {
      try {
        const response = await fetch(url);
        tests.push({
          name: `OAuth2 Discovery ${index + 1}`,
          status: response.ok ? "✅ Pass" : "❌ Fail",
          details: `${url} - Status: ${response.status}`
        });
      } catch (error) {
        tests.push({
          name: `OAuth2 Discovery ${index + 1}`,
          status: "❌ Error", 
          details: `${url} - ${error instanceof Error ? error.message : String(error)}`
        });
      }
    }

    // Test 2: Gmail API discovery
    try {
      const gmailDiscovery = await fetch("https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest");
      tests.push({
        name: "Gmail API Discovery",
        status: gmailDiscovery.ok ? "✅ Pass" : "❌ Fail", 
        details: `Status: ${gmailDiscovery.status}`
      });
    } catch (error) {
      tests.push({
        name: "Gmail API Discovery",
        status: "❌ Error",
        details: error instanceof Error ? error.message : String(error)
      });
    }

    // Test 3: Check OAuth URL construction
    const testAuthUrl = `${config.authUrl}?${new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: config.scopes.join(" "),
      access_type: "offline",
      prompt: "consent"
    }).toString()}`;

    tests.push({
      name: "OAuth URL Construction",
      status: "✅ Pass",
      details: `URL length: ${testAuthUrl.length} chars`
    });

    return NextResponse.json({
      message: "Gmail API accessibility test results",
      configuration: {
        clientId: config.clientId.substring(0, 20) + "...",
        redirectUri: config.redirectUri,
        scopeCount: config.scopes.length,
        scopes: config.scopes
      },
      tests,
      recommendations: [
        "Make sure Gmail API is enabled in Google Cloud Console",
        "Verify OAuth consent screen is properly configured",
        "Check that your OAuth app is not in 'testing' mode with restricted users",
        "Try the OAuth flow in incognito mode with a single Google account"
      ]
    });

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}
