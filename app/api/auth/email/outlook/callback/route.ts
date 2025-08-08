/**
 * Route: api/auth/email/outlook/callback/route.ts
 * OUTLOOK OAUTH2 CALLBACK HANDLER – Branded popup result page + token exchange
 *
 * • Exchanges authorization code for tokens and fetches basic profile
 * • Returns a small, branded HTML page that posts a message to the opener
 * • Uses UTF‑8 charset and a consistent dark glass card like the home page
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

  // Reusable small branded shell (parity with Gmail route)
  const shell = (inner: string, title = "Agenitix") => `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      :root{--bg: radial-gradient(1200px 600px at 50% -100px, rgba(120,119,198,0.22) 0%, rgba(0,0,0,0.0) 50%), linear-gradient(180deg, #0b0f1a 0%, #000000 100%);--card: rgba(0,0,0,0.60);--card-border: rgba(255,255,255,0.08);--text:#fff;--muted:#a3a3a3;--success:#22c55e;--error:#ef4444}
      html,body{height:100%}
      body{margin:0;display:grid;place-items:center;min-height:100vh;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,Helvetica,Arial; background:var(--bg); color:var(--text)}
      .card{width:100%;max-width:440px;padding:24px 22px;border-radius:14px;background:var(--card);border:1px solid var(--card-border);box-shadow:0 6px 30px rgba(0,0,0,0.35);text-align:center;backdrop-filter: blur(6px)}
      .title{font-weight:700;font-size:22px;margin:8px 0 6px}
      .desc{color:var(--muted);font-size:14px;margin:0 0 8px}
      .ok{color:var(--success)}.err{color:var(--error)} .mono{font-family:ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12px;color:var(--muted)}
    </style>
  </head>
  <body><div class="card">${inner}</div></body></nhtml>`;

  if (error) {
    console.error("OAuth error:", error);
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">✖️</div>
      <div class="title err">Authentication Failed</div>
      <p class="desc">${error}</p>
      <script>
        try { if (window.opener && !window.opener.closed) { window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${error}' }, '${new URL(request.url).origin}'); } } catch (e) {}
        setTimeout(() => window.close(), 3000);
      </script>`;
    return new NextResponse(shell(inner, "Agenitix • Auth Error"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  if (!code) {
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">✖️</div>
      <div class="title err">Authentication Failed</div>
      <p class="desc">No authorization code received</p>
      <script>
        try { if (window.opener && !window.opener.closed) { window.opener.postMessage({ type: 'OAUTH_ERROR', error: 'No authorization code received' }, '${new URL(request.url).origin}'); } } catch (e) {}
        setTimeout(() => window.close(), 3000);
      </script>`;
    return new NextResponse(shell(inner, "Agenitix • Auth Error"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

	try {


		// Exchange code for tokens using credential provider
		const tokens = await exchangeCodeForTokens("outlook", code);

		if (!tokens) {
			throw new Error("Failed to exchange authorization code for tokens");
		}



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



    // Create small branded success page (parity with Gmail route)
    const inner = `
      <div class="ok" aria-hidden="true" style="font-size:34px">✅</div>
      <div class="title ok">Outlook Connected!</div>
      <p class="desc">Returning to your workflow…</p>
      <div id="closing" class="mono">Closing in <span id="countdown">3</span>s</div>
      <script>
        const authData = { type: 'OAUTH_SUCCESS', authData: '${authDataEncoded}', timestamp: Date.now() };
        function tryBroadcast(){ try{ const c = new BroadcastChannel('oauth_outlook'); c.postMessage(authData); c.close(); }catch(_){}}
        function tryPostMessage(){ try{ if(window.opener && !window.opener.closed){ window.opener.postMessage(authData, window.location.origin); return true; } }catch(_){ } return false; }
        tryBroadcast();
        const sent = tryPostMessage();
        let t=3, el=document.getElementById('countdown');
        const timer=setInterval(()=>{ t--; if(el) el.textContent=String(t); if(t<=0){ clearInterval(timer); window.close(); } },1000);
        if(!sent){ const closing=document.getElementById('closing'); if(closing) closing.textContent='You can close this window.'; }
      </script>`;

    return new NextResponse(shell(inner, "Agenitix • Outlook Connected"), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
	} catch (error) {
		console.error("Outlook OAuth callback error:", error);
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">✖️</div>
      <div class="title err">Authentication Error</div>
      <p class="desc">${error instanceof Error ? error.message : "oauth_failed"}</p>
      <script>
        try { if (window.opener && !window.opener.closed) { window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${error instanceof Error ? error.message : "oauth_failed"}' }, '${new URL(request.url).origin}'); } } catch (e) {}
        setTimeout(() => window.close(), 3000);
      </script>`;
    return new NextResponse(shell(inner, "Agenitix • Auth Error"), { headers: { "Content-Type": "text/html; charset=utf-8" } });
	}
}
