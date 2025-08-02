import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const code = searchParams.get("code");
	const error = searchParams.get("error");

	if (error) {
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
		return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
	}

	if (!code) {
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: 'no_code'
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
		return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
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

		// Encode in base64 as expected by handleAuthSuccess
		const authDataEncoded = btoa(JSON.stringify(authData));

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
			window.location.href = '/dashboard?auth_success=true&auth_data=${encodeURIComponent(authDataEncoded)}';
		}
	</script>
</body>
</html>`;

		return new NextResponse(html, {
			headers: { 'Content-Type': 'text/html' },
		});
	} catch (error) {
		console.error("Gmail OAuth callback error:", error);
		const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: 'oauth_failed'
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
		return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
	}
}