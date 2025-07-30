/**
 * Outlook OAuth2 Callback Handler
 *
 * Handles the OAuth2 callback from Microsoft after user authorization.
 * Exchanges authorization code for access tokens.
 */

import { outlookProvider } from "@/features/business-logic-modern/node-domain/email/providers/outlook";
import { type NextRequest, NextResponse } from "next/server";

/**
 * OAuth2 token response interface
 */
interface TokenResponse {
	accessToken: string;
	refreshToken?: string;
	expiresIn: number;
}

/**
 * Connection validation result interface
 */
interface ConnectionResult {
	success: boolean;
	accountInfo?: {
		email?: string;
		displayName?: string;
	};
	error?: {
		message?: string;
	};
}

/**
 * Creates error redirect URL with auth error parameters
 */
function createErrorRedirect(error: string, description: string, provider = "outlook") {
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
function createSuccessRedirect(
	tokens: TokenResponse,
	connectionResult: ConnectionResult,
	state: string | null
) {
	const frontendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
	const redirectUrl = new URL("/dashboard", frontendUrl);

	const authData = {
		provider: "outlook",
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
	console.error("OAuth2 error:", { error, errorDescription, provider: "outlook" });
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
		const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/email/outlook/callback`;
		const tokens = await outlookProvider.exchangeCodeForTokens?.(code, redirectUri);

		// Validate the connection to get user info
		const connectionResult = await outlookProvider.validateConnection({
			provider: "outlook",
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
		console.error("Outlook OAuth2 callback error:", error);
		return createErrorRedirect(
			"callback_error",
			error instanceof Error ? error.message : "Unknown error"
		);
	}
}
