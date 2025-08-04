import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");

  // Validate environment variables first
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    console.error("Missing Gmail OAuth2 environment variables");
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Configuration Error</title></head>
			<body>
				<script>
					try {
						window.opener.postMessage({
							type: 'OAUTH_ERROR',
							error: 'Gmail OAuth2 is not properly configured. Please contact your administrator.'
						}, '${new URL(request.url).origin}');
						window.close();
					} catch (e) {
						window.location.href = '/dashboard?error=${encodeURIComponent("Configuration error")}';
					}
				</script>
				<p>Configuration error. This window should close automatically.</p>
			</body>
			</html>
		`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

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

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", tokens);
      throw new Error(
        tokens.error_description ||
          `Token exchange failed: ${tokens.error || "Unknown error"}`
      );
    }

    console.log("Getting user info from Google...");

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );

    if (!userResponse.ok) {
      throw new Error("Failed to get user info from Google");
    }

    const userInfo = await userResponse.json();

    // Store tokens and redirect with success
    const authData = {
      provider: "gmail",
      email: userInfo.email,
      displayName: userInfo.name,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      tokenExpiry: Date.now() + tokens.expires_in * 1000,
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
