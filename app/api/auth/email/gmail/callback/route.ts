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
    hasState: !!state, 
    error,
    url: request.url,
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
					// CRITICAL FIX: Don't redirect parent window - just close popup
					console.error('PostMessage failed, closing popup without redirect');
					window.close();
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

		// Method 3: REMOVED - No more parent window redirects
		// This method was causing session clearing by redirecting the parent window

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
					// CRITICAL FIX: Don't redirect parent - show error and close
					console.error('All communication methods failed - closing popup');
					document.body.innerHTML = '<p style="text-align:center;font-family:system-ui;color:#dc2626;margin-top:2rem;">Communication failed. Please close this window and try again.</p>';
					setTimeout(() => window.close(), 3000);
				}
			}
		}, 1000);

		// Try to close immediately if postMessage worked
		if (success) {
			        setTimeout(() => {
            // CRITICAL: Preserve parent session before closing
            try {
                if (window.opener && !window.opener.closed) {
                    // Send multiple signals to ensure parent receives the message
                    const preserveMessage = { 
                        type: 'PRESERVE_SESSION', 
                        timestamp: Date.now(),
                        authSuccess: true 
                    };
                    
                    // Try multiple communication methods
                    window.opener.postMessage(preserveMessage, '${new URL(request.url).origin}');
                    
                    // Also try BroadcastChannel as backup
                    try {
                        const bc = new BroadcastChannel('oauth-auth');
                        bc.postMessage(preserveMessage);
                        bc.close();
                    } catch (bcError) {
                        console.log('BroadcastChannel not available');
                    }
                    
                    console.log('✅ Session preservation signals sent');
                }
            } catch (e) {
                console.error('Failed to preserve session:', e);
            }
            
            // Delay closing to ensure messages are delivered
            setTimeout(() => {
                window.close();
            }, 200);
        }, 500);
		}
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
