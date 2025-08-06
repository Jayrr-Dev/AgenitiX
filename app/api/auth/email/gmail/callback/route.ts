import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

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
    const tokens = await exchangeCodeForTokens("gmail", code, state || undefined);

    if (!tokens) {
      throw new Error("Failed to exchange authorization code for tokens");
    }

    console.log("Getting user info from Google...");

    // Get user info using credential provider
    const userInfo = await getUserInfo("gmail", tokens.accessToken);

    if (!userInfo) {
      throw new Error("Failed to get user info from Google");
    }

    // Store tokens and redirect with success
    const authData = {
      provider: "gmail",
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

    // Create HTML page that communicates with parent window using multiple methods
    const html = `<!DOCTYPE html>
<html>
<head>
	<title>Authentication Success</title>
	<style>
		body { font-family: system-ui, sans-serif; text-align: center; padding: 2rem; }
		.success { color: #059669; }
		.countdown { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
	</style>
</head>
<body>
	<div class="success">
		<h2>✅ Authentication Successful</h2>
		<p>This window will close automatically...</p>
		<div class="countdown">Closing in <span id="countdown">3</span> seconds</div>
	</div>
	<script>
		const authData = {
			type: 'OAUTH_SUCCESS',
			authData: '${authDataEncoded}',
			timestamp: Date.now()
		};

		// Method 1: Try postMessage to opener
		function tryPostMessage() {
			try {
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(authData, '${new URL(request.url).origin}');
					return true;
				}
			} catch (error) {
				console.log('PostMessage to opener failed:', error);
			}
			return false;
		}

		// Method 2: Use localStorage as communication bridge
		function useLocalStorageBridge() {
			try {
				localStorage.setItem('gmail_oauth_result', JSON.stringify(authData));
				// Trigger storage event
				window.dispatchEvent(new StorageEvent('storage', {
					key: 'gmail_oauth_result',
					newValue: JSON.stringify(authData)
				}));
				return true;
			} catch (error) {
				console.log('localStorage bridge failed:', error);
			}
			return false;
		}

		// Method 3: Fallback redirect
		function fallbackRedirect() {
			window.location.href = '/dashboard?auth_success=true&auth_data=${encodeURIComponent(authDataEncoded)}';
		}

		// Try communication methods in order
		let success = tryPostMessage();
		if (!success) {
			success = useLocalStorageBridge();
		}

		// Countdown and auto-close
		let countdown = 3;
		const countdownEl = document.getElementById('countdown');
		const timer = setInterval(() => {
			countdown--;
			if (countdownEl) countdownEl.textContent = countdown;
			
			if (countdown <= 0) {
				clearInterval(timer);
				if (success) {
					window.close();
				} else {
					fallbackRedirect();
				}
			}
		}, 1000);

		// Try to close immediately if postMessage worked
		if (success) {
			setTimeout(() => window.close(), 500);
		}
	</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 
        "Content-Type": "text/html",
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
        "Cross-Origin-Embedder-Policy": "unsafe-none"
      },
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
