/**
 * Gmail OAuth2 Callback Handler
 *
 * Handles the OAuth2 callback from Google after user authorization.
 * Exchanges authorization code for access tokens.
 */

import { gmailProvider } from "@/features/business-logic-modern/node-domain/email/providers/gmail";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates error redirect URL with auth error parameters
 */
function createErrorRedirect(error: string, description: string, provider = "gmail") {
	const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const redirectUrl = new URL("/dashboard", frontendUrl);
	redirectUrl.searchParams.set("auth_error", error);
	redirectUrl.searchParams.set("auth_error_description", description);
	redirectUrl.searchParams.set("provider", provider);
	return NextResponse.redirect(redirectUrl);
}

/**
 * Creates success redirect URL with auth data
 */
function createSuccessRedirect(tokens: any, connectionResult: any, state: string | null) {
	const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const redirectUrl = new URL("/dashboard", frontendUrl);

	const authData = {
		provider: "gmail",
		email: connectionResult.accountInfo?.email,
		displayName: connectionResult.accountInfo?.displayName,
		accessToken: tokens.accessToken,
		refreshToken: tokens.refreshToken,
		tokenExpiry: Date.now() + tokens.expiresIn * 1000,
		state,
	};

	redirectUrl.searchParams.set("auth_success", "true");
	redirectUrl.searchParams.set("auth_data", btoa(JSON.stringify(authData)));

	return NextResponse.redirect(redirectUrl);
}

/**
 * Handles OAuth2 errors from the provider
 */
function handleOAuthError(error: string, searchParams: URLSearchParams) {
	const errorDescription = searchParams.get("error_description") || "OAuth2 authorization failed";
	console.error("OAuth2 error:", { error, errorDescription, provider: "gmail" });
	return createErrorRedirect(error, errorDescription);
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const code = searchParams.get("code");
		const state = searchParams.get("state");
		const error = searchParams.get("error");

		// Handle OAuth2 errors
		if (error) {
			return handleOAuthError(error, searchParams);
		}

		// Validate authorization code
		if (!code) {
			return createErrorRedirect("missing_code", "Authorization code not received");
		}

		// Exchange code for tokens
		const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/email/gmail/callback`;
		const tokens = await gmailProvider.exchangeCodeForTokens?.(code, redirectUri);

		// Validate the connection to get user info
		const connectionResult = await gmailProvider.validateConnection({
			provider: "gmail",
			email: "", // Will be filled from profile
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1000,
		});

		if (!connectionResult.success) {
			return createErrorRedirect(
				"validation_failed",
				connectionResult.error?.message || "Unknown validation error"
			);
		}

		return createSuccessRedirect(tokens, connectionResult, state);
	} catch (error) {
		console.error("Gmail OAuth2 callback error:", error);
		return createErrorRedirect(
			"callback_error",
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}
