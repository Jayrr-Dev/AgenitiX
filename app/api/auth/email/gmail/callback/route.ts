/**
 * Route: api/auth/email/gmail/callback/route.ts
 * GMAIL OAUTH CALLBACK HANDLER - Processes OAuth2 callback from Google
 *
 * • Handles authorization code exchange for access tokens
 * • Validates OAuth flow completion and error states
 * • Provides detailed error messages for debugging
 * • Communicates results back to parent window via postMessage
 * • Auto-closes popup window after completion
 *
 * Keywords: oauth-callback, gmail-auth, authorization-code, token-exchange
 */

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

// Base64 encode helper (standard, compatible with atob in browser)
const base64Encode = (str: string) =>
  Buffer.from(str, "utf8").toString("base64");

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
  
  console.log('🔍 CALLBACK: Gmail callback route hit!', {
    url: request.url,
    timestamp
  });
  
  // 🔍 REQUEST COUNTER FOR DEBUGGING
  if (!(global as any).requestCounter) {
    (global as any).requestCounter = 0;
  }
  (global as any).requestCounter++;
  

  
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const state = searchParams.get("state");
  const scope = searchParams.get("scope");
  const authuser = searchParams.get("authuser");
  const prompt = searchParams.get("prompt");
  


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
    const prompt = searchParams.get("prompt");
    
    console.error("📧 Gmail OAuth Error Details:", {
      error,
      errorDescription,
      hasScope: !!scope,
      authuser,
      prompt
    });
    
    // Determine specific error message based on parameters
    let errorMsg = "No authorization code received";
    let errorType = "NO_CODE";
    let userGuidance = "Please try the authentication again.";
    
    if (scope && !error && prompt === 'consent') {
      errorMsg = "Consent flow was not completed. You need to click 'Allow' to grant access to your Gmail account.";
      errorType = "CONSENT_INCOMPLETE";
      userGuidance = "When the Google consent screen appears, please click 'Allow' to grant access to your Gmail account. Then try the authentication again.";
    } else if (scope && !error) {
      errorMsg = "OAuth flow completed but no authorization code was provided. This might be due to redirect URI mismatch or user cancellation.";
      errorType = "CONSENT_INCOMPLETE";
      userGuidance = "Please ensure you click 'Allow' when prompted to grant access to your Gmail account.";
    } else if (error === "access_denied") {
      errorMsg = "Access was denied by the user";
      errorType = "ACCESS_DENIED";
      userGuidance = "You need to grant permission to access your Gmail account. Please try again and click 'Allow' when prompted.";
    } else if (errorDescription) {
      errorMsg = errorDescription;
      errorType = "OAUTH_ERROR";
      userGuidance = "Please check your Google account settings and try again.";
    } else if (prompt === "consent" && authuser === "0") {
      errorMsg = "User did not complete the consent flow. Please try again and ensure you click 'Allow' to grant access.";
      errorType = "CONSENT_CANCELLED";
      userGuidance = "When the Google consent screen appears, please click 'Allow' to grant access to your Gmail account.";
    } else if (scope?.includes('gmail') && !code) {
      errorMsg = "Gmail scopes were granted but no authorization code received. This may indicate a configuration issue.";
      errorType = "SCOPE_GRANTED_NO_CODE";
      userGuidance = "Please try the authentication again. If the issue persists, contact support.";
    } else if (scope && scope.includes('email') && scope.includes('profile')) {
      errorMsg = "Basic scopes were granted but Gmail access was not completed. Please ensure you grant all requested permissions.";
      errorType = "PARTIAL_SCOPE_GRANTED";
      userGuidance = "Please try again and make sure to grant access to your Gmail account when prompted.";
    }
    
    const safeErrorMsg = escapeHtml(errorMsg);
    const safeUserGuidance = escapeHtml(userGuidance);
    const html = `
			<!DOCTYPE html>
			<html>
			<head><title>Authentication Error</title></head>
			<body style="font-family: system-ui, sans-serif; text-align: center; padding: 2rem; background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
				<div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); max-width: 400px; width: 100%;">
					<div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
					<h2 style="color: #dc2626;">Gmail Authentication Failed</h2>
					<p style="color: #6b7280;">${safeErrorMsg}</p>
					<p style="color: #059669; font-weight: 500; margin-top: 1rem;">${safeUserGuidance}</p>
					<p style="color: #6b7280; font-size: 0.875rem; margin-top: 1rem;">DEBUGGING: Window will NOT auto-close. Check network tab and console.</p>
					<button onclick="window.close()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #dc2626; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">Close Window</button>
				</div>
				<script>
					console.log('🔍 DEBUGGING: OAuth callback error page loaded');
					console.log('🔍 URL:', window.location.href);
					console.log('🔍 Search params:', window.location.search);
					
					try {
						if (window.opener && !window.opener.closed) {
							window.opener.postMessage({
								type: 'OAUTH_ERROR',
								error: '${safeErrorMsg}',
								errorType: '${errorType}',
								userGuidance: '${safeUserGuidance}',
								timestamp: Date.now()
							}, '${new URL(request.url).origin}');
						}
					} catch (e) {
						console.error('PostMessage failed for error communication');
					}
					
					// 🔍 DEBUGGING: Don't auto-close - let user check network tab
					console.log('🔍 DEBUGGING: Window will NOT auto-close for debugging');
				</script>
			</body>
			</html>
		`;
    return htmlResponse(html);
  }

  try {


    // Exchange code for tokens using credential provider
    const tokens = await exchangeCodeForTokens("gmail", code);

    if (!tokens) {
      throw new Error("Failed to exchange authorization code for tokens");
    }



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
    const authDataEncoded = base64Encode(JSON.stringify(authData));



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
		console.log('🔍 POPUP: Callback JavaScript is running!');
		
		const authData = {
			type: 'OAUTH_SUCCESS',
			authData: '${authDataEncoded}',
			timestamp: Date.now()
		};
		console.log('🔍 POPUP: Auth data created:', authData);

		// Send success message to parent window
		function sendSuccessToParent() {
			console.log('🔍 POPUP: Attempting to send message to parent:', authData);
			try {
				if (window.opener && !window.opener.closed) {
					console.log('🔍 POPUP: Parent window found, sending message...');
					window.opener.postMessage(authData, window.location.origin);
					console.log('🔍 POPUP: Message sent successfully');
					return true;
				} else {
					console.log('🔍 POPUP: No parent window or parent is closed');
				}
			} catch (error) {
				console.error('🔍 POPUP: Error sending message to parent:', error);
			}
			return false;
		}

		// Main execution with error handling
		try {
		
		// Test basic postMessage first
		console.log('🔍 POPUP: Testing basic postMessage...');
		try {
			if (window.opener) {
				window.opener.postMessage({ type: 'TEST_MESSAGE', test: true }, window.location.origin);
				console.log('🔍 POPUP: Test message sent');
			} else {
				console.log('🔍 POPUP: No window.opener available');
			}
		} catch (e) {
			console.error('🔍 POPUP: Test message failed:', e);
		}

		// Try BroadcastChannel first (COOP-safe)
		console.log('🔍 POPUP: Trying BroadcastChannel...');
		try {
			const channel = new BroadcastChannel('oauth_gmail');
			channel.postMessage(authData);
			console.log('🔍 POPUP: BroadcastChannel message sent successfully');
			channel.close();
		} catch (error) {
			console.error('🔍 POPUP: BroadcastChannel failed:', error);
		}

		// Try to send message to parent window as fallback
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
		
		} catch (error) {
			console.error('🔍 POPUP: JavaScript execution error:', error);
			document.querySelector('.container').innerHTML = \`
				<div class="icon">⚠️</div>
				<div class="success">
					<h2>Gmail Connected!</h2>
					<p>You can close this window manually.</p>
				</div>
			\`;
		}
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
