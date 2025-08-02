import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const state = searchParams.get("state"); // This will contain our session token

	if (error) {
		return NextResponse.redirect(
			new URL(`/dashboard?error=${encodeURIComponent(error)}`, request.url)
		);
	}

	if (!code) {
		return NextResponse.redirect(
			new URL("/dashboard?error=no_code", request.url)
		);
	}

	try {
		// Exchange code for tokens
		const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: process.env.GMAIL_CLIENT_ID!,
				client_secret: process.env.GMAIL_CLIENT_SECRET!,
				code,
				grant_type: "authorization_code",
				redirect_uri: process.env.GMAIL_REDIRECT_URI!,
			}),
		});

		const tokens = await tokenResponse.json();

		if (!tokenResponse.ok) {
			throw new Error(tokens.error_description || "Failed to exchange code for tokens");
		}

		// Get user info from Google
		const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
			},
		});

		const userInfo = await userResponse.json();

		// Store tokens and redirect with success
		const authData = {
			provider: "gmail",
			email: userInfo.email,
			displayName: userInfo.name,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			tokenExpiry: Date.now() + (tokens.expires_in * 1000),
		};

		// Include the session token from state parameter
		const authDataWithToken = {
			...authData,
			sessionToken: state, // Pass the session token
		};

		// Encode in base64 as expected by handleAuthSuccess
		const authDataEncoded = btoa(JSON.stringify(authDataWithToken));

		return NextResponse.redirect(
			new URL(`/dashboard?auth_success=true&auth_data=${encodeURIComponent(authDataEncoded)}`, request.url)
		);
	} catch (error) {
		console.error("Gmail OAuth callback error:", error);
		return NextResponse.redirect(
			new URL(`/dashboard?error=${encodeURIComponent("oauth_failed")}`, request.url)
		);
	}
}