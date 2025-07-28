/**
 * Outlook OAuth2 Authentication Handler
 *
 * Handles Outlook OAuth2 authorization flow initiation.
 * Redirects users to Microsoft's OAuth2 consent screen.
 */

import { type NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const email = searchParams.get("email");

		if (!email) {
			return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
		}

		// SIMULATE OUTLOOK AUTHENTICATION
		// In a real implementation, you would integrate with Microsoft Graph API
		const mockResponse = {
			provider: "outlook",
			email,
			authenticated: true,
			accessToken: `mock_outlook_token_${Date.now()}`,
			expiresIn: 3600,
			scope: "https://graph.microsoft.com/Mail.Read",
		};

		return NextResponse.json(mockResponse);
	} catch (error) {
		console.error("Outlook authentication error:", error);
		return NextResponse.json({ error: "Outlook authentication failed" }, { status: 500 });
	}
}
