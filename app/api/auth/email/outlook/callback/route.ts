/**
 * Outlook OAuth2 Callback Handler
 *
 * Handles the OAuth2 callback from Microsoft after user authorization.
 * Exchanges authorization code for access tokens.
 */

import { type NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

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
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");
	const state = searchParams.get("state");

	if (error) {
		console.error("OAuth error:", error);
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: '${error}'
						}, '${new URL(request.url).origin}');
						window.close();
					} catch (e) {
						window.location.href = '/dashboard?error=${encodeURIComponent(error)}';
					}
				</script>
				<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
		`;
		return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
	}

	if (!code) {
		console.error("No authorization code received");
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: 'No authorization code received'
						}, '${new URL(request.url).origin}');
						window.close();
					} catch (e) {
						window.location.href = '/dashboard?error=no_code';
					}
				</script>
				<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
		`;
		return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
	}

	try {
		console.log("Exchanging authorization code for tokens...");

		// Exchange code for tokens using credential provider
		const tokens = await exchangeCodeForTokens("outlook", code, state || undefined);

		if (!tokens) {
			throw new Error("Failed to exchange authorization code for tokens");
		}

		console.log("Getting user info from Microsoft...");

		// Get user info using credential provider
		const userInfo = await getUserInfo("outlook", tokens.accessToken);

		if (!userInfo) {
			throw new Error("Failed to get user info from Microsoft");
		}

		// Store tokens and redirect with success
		const authData = {
			provider: "outlook",
			email: userInfo.email,
			displayName: userInfo.name,
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
			tokenExpiry: Date.now() + tokens.expiresIn * 1000,
			sessionToken: state, // Pass back the session token
		};

		// Encode in base64 as expected by handleAuthSuccess
		const authDataEncoded = btoa(JSON.stringify(authData));

		console.log("Authentication successful for:", userInfo.email);

		// Create HTML page that communicates with parent window
		const html = `<!DOCTYPE html>
<html>
<head>
	<title>Authentication Success</title>
	<style>
		body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
		.success { color: #059669; }
	</style>
</head>
<body>
	<div class="success">
		<h2>✅ Authentication Successful</h2>
		<p>This window will close automatically...</p>
	</div>
	<script>
		try {
			window.opener.postMessage({
				type: 'OAUTH_SUCCESS',
				authData: '${authDataEncoded}'
			}, '${new URL(request.url).origin}');
			window.close();
		} catch (error) {
			console.error('PostMessage failed:', error);
			window.location.href = '/dashboard?auth_success=true&auth_data=${encodeURIComponent(authDataEncoded)}';
		}
	</script>
</body>
</html>`;

		return new NextResponse(html, {
			headers: { "Content-Type": "text/html" },
		});
	} catch (error) {
		console.error("Outlook OAuth callback error:", error);
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: '${error instanceof Error ? error.message : "oauth_failed"}'
						}, '${new URL(request.url).origin}');
						window.close();
					} catch (e) {
						window.location.href = '/dashboard?error=oauth_failed';
					}
				</script>
				<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
		`;
		return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
	}
}
