/**
 * Route: api/auth/email/gmail/callback/route.ts
 * GMAIL OAUTH CALLBACK HANDLER – Branded popup result page + token exchange
 *
 * • Exchanges authorization code for tokens and fetches basic profile
 * • Returns a small, branded HTML page that posts a message to the opener
 * • Uses safe COOP/CORS headers for popup communication
 * • UTF‑8 meta + charset header to prevent garbled emoji/symbols
 *
 * Keywords: oauth-callback, gmail-auth, authorization-code, token-exchange
 */

import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForTokens,
  getUserInfo,
} from "@/features/business-logic-modern/node-domain/email/providers/credentialProviders";
import { oauthCorsHeaders } from "@/lib/cors";

// Helper function to add OAuth/popup-safe headers
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

// Helper to wrap HTML with correct headers + CORS/COOP + UTF‑8 charset
const htmlResponse = (html: string, status = 200) =>
  addOAuthHeaders(
    new NextResponse(html, {
      status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    }),
  );

// Brand tokens (keep simple constants for maintainability)
const BRAND_BG_GRADIENT =
  "radial-gradient(1200px 600px at 50% -100px, rgba(120,119,198,0.22) 0%, rgba(0,0,0,0.0) 50%), linear-gradient(180deg, #0b0f1a 0%, #000000 100%)";
const BRAND_CARD_BG = "rgba(0,0,0,0.60)";
const BRAND_CARD_BORDER = "rgba(255,255,255,0.08)";
const BRAND_TEXT = "#ffffff";
const BRAND_MUTED = "#a3a3a3";
const BRAND_SUCCESS = "#22c55e"; // aligned with home green accents
const BRAND_ERROR = "#ef4444";

// Small branded HTML shell
const renderBrandedShell = (inner: string, title = "Agenitix") => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    :root {
      --bg: ${BRAND_BG_GRADIENT};
      --card: ${BRAND_CARD_BG};
      --card-border: ${BRAND_CARD_BORDER};
      --text: ${BRAND_TEXT};
      --muted: ${BRAND_MUTED};
      --success: ${BRAND_SUCCESS};
      --error: ${BRAND_ERROR};
    }
    html, body { height: 100%; }
    body {
      margin: 0; display: grid; place-items: center; min-height: 100vh;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      background: var(--bg);
      color: var(--text);
    }
    .card {
      width: 100%; max-width: 440px; padding: 24px 22px; border-radius: 14px;
      background: var(--card); border: 1px solid var(--card-border);
      box-shadow: 0 6px 30px rgba(0,0,0,0.35);
      text-align: center;
      backdrop-filter: blur(6px);
    }
    .title { font-weight: 700; font-size: 22px; margin: 8px 0 6px; }
    .desc { color: var(--muted); font-size: 14px; margin: 0 0 8px; }
    .ok { color: var(--success); }
    .err { color: var(--error); }
    .spacer { height: 8px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; color: var(--muted); }
    .badge { display:inline-block; border:1px solid var(--card-border); border-radius:999px; padding:4px 10px; color:var(--muted); margin-top:6px; }
    button { margin-top: 10px; padding: 8px 12px; background: var(--success); color: #051b0d; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }
  </style>
</head>
<body>
  <div class="card">${inner}</div>
</body>
</html>`;

export async function GET(request: NextRequest) {
  // [Explanation], basically avoid noisy console logs in production
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
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">✖️</div>
      <div class="title err">Authentication Failed</div>
      <p class="desc">${safeError}</p>
      <div class="badge">Gmail OAuth</div>
      <div class="spacer"></div>
      <div class="mono">This window will close automatically.</div>
      <script>
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${safeError}' }, '${new URL(request.url).origin}');
          }
        } catch (e) {}
        setTimeout(() => window.close(), 3000);
      </script>`;
    return htmlResponse(renderBrandedShell(inner, "Agenitix • Auth Error"));
  }

  if (!code) {
    // [Explanation], basically handle missing code with helpful guidance
    const errorDescription = searchParams.get("error_description");
    const promptParam = searchParams.get("prompt");
    
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
    } else if (promptParam === "consent" && authuser === "0") {
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
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">❌</div>
      <div class="title err">Gmail Authentication Failed</div>
      <p class="desc">${safeErrorMsg}</p>
      <p class="desc" style="color:var(--success)">${safeUserGuidance}</p>
      <div class="badge">${errorType}</div>
      <button onclick="window.close()">Close Window</button>
      <script>
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${safeErrorMsg}', errorType: '${errorType}', userGuidance: '${safeUserGuidance}', timestamp: Date.now() }, '${new URL(request.url).origin}');
          }
        } catch (e) {}
      </script>`;
    return htmlResponse(renderBrandedShell(inner, "Agenitix • Auth Error"));
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



    // Create branded HTML page that communicates with parent via postMessage
    const inner = `
      <div class="ok" aria-hidden="true" style="font-size:34px">✅</div>
      <div class="title ok">Gmail Connected!</div>
      <p class="desc">Returning to your workflow…</p>
      <div id="closing" class="mono">Closing in <span id="countdown">3</span>s</div>
      <script>
        const authData = { type: 'OAUTH_SUCCESS', authData: '${authDataEncoded}', timestamp: Date.now() };
        function tryBroadcast() {
          try { const ch = new BroadcastChannel('oauth_gmail'); ch.postMessage(authData); ch.close(); } catch (_) {}
        }
        function tryPostMessage() {
          try { if (window.opener && !window.opener.closed) { window.opener.postMessage(authData, window.location.origin); return true; } } catch (_) {}
          return false;
        }
        tryBroadcast();
        const sent = tryPostMessage();
        let t = 3; const el = document.getElementById('countdown');
        const timer = setInterval(() => { t--; if (el) el.textContent = String(t); if (t <= 0) { clearInterval(timer); window.close(); } }, 1000);
        if (!sent) {
          const closing = document.getElementById('closing'); if (closing) closing.textContent = 'You can close this window.';
        }
      </script>`;
    return htmlResponse(renderBrandedShell(inner, "Agenitix • Gmail Connected"));
  } catch (error) {
    console.error("Gmail OAuth callback error:", error);
    const safeErrorMessage = escapeHtml(error instanceof Error ? error.message : "oauth_failed");
    const inner = `
      <div class="err" aria-hidden="true" style="font-size:34px">✖️</div>
      <div class="title err">Authentication Error</div>
      <p class="desc">${safeErrorMessage}</p>
      <div class="mono">This window will close automatically.</div>
      <script>
        try { if (window.opener && !window.opener.closed) { window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${safeErrorMessage}' }, '${new URL(request.url).origin}'); } } catch (e) {}
        setTimeout(() => window.close(), 3000);
      </script>`;
    return htmlResponse(renderBrandedShell(inner, "Agenitix • Auth Error"));
  }
}
