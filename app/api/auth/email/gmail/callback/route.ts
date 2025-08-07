import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";

export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  console.log(`📧 [${timestamp}] Gmail OAuth Callback START`);
  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  
  console.log("📧 Gmail OAuth Callback params:", { 
    hasCode: !!code, 
    code: code ? code.substring(0, 20) + "..." : null,
    hasState: !!state, 
    state: state ? state.substring(0, 50) + "..." : null,
    error,
    url: request.url,
    searchParams: Object.fromEntries(searchParams.entries()),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    timestamp
  });

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
						// CRITICAL FIX: Don't redirect parent window on error
						console.error('PostMessage failed for error communication');
						window.close();
					}
				</script>
				<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
		`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  if (!code) {
    console.error(`❌ [${timestamp}] No authorization code received - this will cause session loss`);
    
    // Check for additional error information
    const errorDescription = searchParams.get("error_description");
    const scope = searchParams.get("scope");
    const authuser = searchParams.get("authuser");
    const prompt = searchParams.get("prompt");
    
    console.error("📧 Gmail OAuth Error Details:", {
      error,
      errorDescription,
      hasScope: !!scope,
      authuser,
      prompt,
      allParams: Object.fromEntries(searchParams.entries())
    });
    
    // Determine specific error message based on parameters
    let errorMsg = "No authorization code received";
    if (scope && !error) {
      errorMsg = "OAuth flow completed but no authorization code was provided. This might be due to redirect URI mismatch.";
    } else if (error === "access_denied") {
      errorMsg = "Access was denied by the user";
    } else if (errorDescription) {
      errorMsg = errorDescription;
    }
    
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body>
				<script>
					try {
						// Send error via BroadcastChannel for redirect flow
						const channel = new BroadcastChannel('oauth_gmail');
						channel.postMessage({
							type: 'OAUTH_ERROR',
							error: '${errorMsg}'
						});
						channel.close();
					} catch (e) {
						console.error('BroadcastChannel failed, error communication failed');
					}
				</script>
				<div style="text-align:center;font-family:system-ui;margin-top:2rem;">
					<p style="color:#dc2626;">❌ Gmail Authentication Failed</p>
					<p>${errorMsg}</p>
					<p>You can close this window and try again.</p>
				</div>
			</body>
			</html>
		`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  try {
    console.log("Exchanging authorization code for tokens...");

    // Exchange code for tokens using credential provider
    const tokens = await exchangeCodeForTokens("gmail", code);

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

		// Send success via BroadcastChannel for redirect flow communication
		function sendSuccess() {
			try {
				const channel = new BroadcastChannel('oauth_gmail');
				channel.postMessage(authData);
				channel.close();
				return true;
			} catch (error) {
				console.log('BroadcastChannel failed:', error);
				return false;
			}
		}

		const success = sendSuccess();

		// Simple auto-close for redirect flow
		if (success) {
			document.body.innerHTML = '<div style="text-align:center;font-family:system-ui;margin-top:2rem;"><p style="color:#059669;">✅ Gmail Connected!</p><p>Returning to your workflow...</p></div>';
		} else {
			document.body.innerHTML = '<div style="text-align:center;font-family:system-ui;margin-top:2rem;"><p style="color:#059669;">✅ Gmail Connected!</p><p>You can close this window and return to your workflow.</p></div>';
		}

		// Auto-close after delay for redirect flow
		setTimeout(() => {
			window.close();
		}, 2000);
	</script>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 
        "Content-Type": "text/html",
        // Remove COOP/COEP headers to avoid interfering with parent session
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
						// CRITICAL FIX: Don't redirect parent window - just close popup
						console.error('PostMessage failed for OAuth error communication');
						window.close();
					}
				</script>
				<p>Authentication failed. This window should close automatically.</p>
			</body>
			</html>
		`;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }
}
