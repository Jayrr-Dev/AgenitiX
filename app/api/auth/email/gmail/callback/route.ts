import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";
import { oauthCorsHeaders } from "@/lib/cors";

// Helper function to add OAuth-specific headers
const addOAuthHeaders = (response: NextResponse) => {
  // Add CORS headers
  Object.entries(oauthCorsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Remove COOP headers that block popup communication
  response.headers.delete("Cross-Origin-Opener-Policy");
  response.headers.delete("Cross-Origin-Embedder-Policy");
  
  // Add permissive headers for OAuth popup flow
  response.headers.set("Cross-Origin-Opener-Policy", "unsafe-none");
  response.headers.set("Cross-Origin-Embedder-Policy", "unsafe-none");
  
  return response;
};

// Base64-URL encode helper (RFC 4648 §5)
const base64url = (str: string) =>
  Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

// Helper to wrap HTML in a NextResponse with correct headers + CORS/COOP fix
const htmlResponse = (html: string, status = 200) =>
  addOAuthHeaders(
    new NextResponse(html, {
      status,
      headers: { "Content-Type": "text/html" },
    }),
  );

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

  // Helper function to escape HTML for XSS protection
  const escapeHtml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  };

  if (error) {
    console.error("OAuth error:", error);
    const safeError = escapeHtml(error);
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
				<div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%;">
					<div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
					<h2 style="color: #dc2626;">Authentication Failed</h2>
					<p style="color: #6b7280;">${safeError}</p>
					<p style="color: #6b7280; font-size: 0.875rem;">This window will close automatically...</p>
				</div>
				<script>
					try {
						if (window.opener && !window.opener.closed) {
							window.opener.postMessage({
								type: 'OAUTH_ERROR',
								error: '${safeError}'
							}, '${new URL(request.url).origin}');
						}
					} catch (e) {
						console.error('PostMessage failed for error communication');
					}
					
					// Auto-close after 3 seconds
					setTimeout(() => {
						window.close();
					}, 3000);
				</script>
			</body>
			</html>
		`;
    return htmlResponse(html);
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
    
    const safeErrorMsg = escapeHtml(errorMsg);
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
				<div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%;">
					<div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
					<h2 style="color: #dc2626;">Gmail Authentication Failed</h2>
					<p style="color: #6b7280;">${safeErrorMsg}</p>
					<p style="color: #6b7280; font-size: 0.875rem;">This window will close automatically...</p>
				</div>
				<script>
					try {
						if (window.opener && !window.opener.closed) {
							window.opener.postMessage({
								type: 'OAUTH_ERROR',
								error: '${safeErrorMsg}'
							}, '${new URL(request.url).origin}');
						}
					} catch (e) {
						console.error('PostMessage failed for error communication');
					}
					
					// Auto-close after 3 seconds
					setTimeout(() => {
						window.close();
					}, 3000);
				</script>
			</body>
			</html>
		`;
    return htmlResponse(html);
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

    // Validate required user info fields
    if (!userInfo.email) {
      throw new Error("User email not provided by Google");
    }

    // Store tokens and redirect with success
    const authData = {
      provider: "gmail",
      email: userInfo.email,
      displayName: userInfo.name || userInfo.email,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiry: Date.now() + tokens.expiresIn * 1000,
      sessionToken: state, // Pass back the session token
    };

    // Encode in base64 as expected by handleAuthSuccess
    const authDataEncoded = base64url(JSON.stringify(authData));

    console.log("Authentication successful for:", userInfo.email);

    // Create HTML page that communicates with parent window via postMessage
    const html = `<!DOCTYPE html>
<html>
<head>
	<title>Authentication Success</title>
	<style>
		body { 
			font-family: system-ui, sans-serif; 
			text-align: center; 
			padding: 2rem; 
			background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
			margin: 0;
			min-height: 100vh;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		.container {
			background: white;
			padding: 2rem;
			border-radius: 12px;
			box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
			max-width: 400px;
			width: 100%;
		}
		.success { color: #059669; }
		.countdown { color: #6b7280; font-size: 0.875rem; margin-top: 1rem; }
		.icon {
			font-size: 3rem;
			margin-bottom: 1rem;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="icon">✅</div>
		<div class="success">
			<h2>Authentication Successful</h2>
			<p>Connecting your Gmail account...</p>
			<div class="countdown">Closing in <span id="countdown">3</span> seconds</div>
		</div>
	</div>
	<script>
		const authData = {
			type: 'OAUTH_SUCCESS',
			authData: '${authDataEncoded}',
			timestamp: Date.now()
		};

		// Send success message to parent window
		function sendSuccessToParent() {
			try {
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(authData, window.location.origin);
					return true;
				}
			} catch (error) {
				console.log('PostMessage to parent failed:', error);
			}
			return false;
		}

		// Try to send message to parent window
		const success = sendSuccessToParent();

		// Update UI based on success
		if (success) {
			document.querySelector('.container').innerHTML = \`
				<div class="icon">✅</div>
				<div class="success">
					<h2>Gmail Connected!</h2>
					<p>Returning to your workflow...</p>
				</div>
			\`;
		} else {
			document.querySelector('.container').innerHTML = \`
				<div class="icon">⚠️</div>
				<div class="success">
					<h2>Gmail Connected!</h2>
					<p>You can close this window and return to your workflow.</p>
				</div>
			\`;
		}

		// Countdown and auto-close
		let countdown = 3;
		const countdownElement = document.getElementById('countdown');
		const timer = setInterval(() => {
			countdown--;
			if (countdownElement) {
				countdownElement.textContent = countdown.toString();
			}
			if (countdown <= 0) {
				clearInterval(timer);
				window.close();
			}
		}, 1000);
	</script>
</body>
</html>`;

    return htmlResponse(html);
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    const safeErrorMessage = escapeHtml(error instanceof Error ? error.message : "oauth_failed");
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
				<div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%;">
					<div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
					<h2 style="color: #dc2626;">Authentication Error</h2>
					<p style="color: #6b7280;">${safeErrorMessage}</p>
					<p style="color: #6b7280; font-size: 0.875rem;">This window will close automatically...</p>
				</div>
				<script>
					try {
						if (window.opener && !window.opener.closed) {
							window.opener.postMessage({
								type: 'OAUTH_ERROR',
								error: '${safeErrorMessage}'
							}, '${new URL(request.url).origin}');
						}
					} catch (e) {
						console.error('PostMessage failed for OAuth error communication');
					}
					
					// Auto-close after 3 seconds
					setTimeout(() => {
						window.close();
					}, 3000);
				</script>
			</body>
			</html>
		`;
    return htmlResponse(html);
  }
}
