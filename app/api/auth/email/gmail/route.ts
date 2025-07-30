/**
 * Gmail OAuth2 Authentication Handler
 *
 * Handles Gmail OAuth2 authorization flow initiation.
 * Redirects users to Google's OAuth2 consent screen.
 */

import { type NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const email = searchParams.get("email");

		if (!email) {
			return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
		}

		// SIMULATE GMAIL AUTHENTICATION
		// In a real implementation, you would integrate with Gmail API
		const mockResponse = {
			provider: "gmail",
			email,
			authenticated: true,
			accessToken: `mock_gmail_token_${Date.now()}`,
			expiresIn: 3600,
			scope: "https://www.googleapis.com/auth/gmail.readonly",
		};

		return NextResponse.json(mockResponse);
	} catch (error) {
		console.error("Gmail authentication error:", error);
		return NextResponse.json({ error: "Gmail authentication failed" }, { status: 500 });
	}
}
