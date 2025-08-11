/**
 * Route: app/api/auth/[...convex]/route.ts
 * CONVEX AUTH API ROUTE - Handles all Convex Auth API requests
 *
 * • Provides GET and POST handlers for Convex Auth
 * • Handles OAuth flows, sign-in, sign-out, and session management
 * • Required for Convex Auth to function properly
 * • Automatically handles GitHub OAuth provider configured in convex/auth.ts
 *
 * Keywords: convex-auth-api, oauth-handler, github-auth, session-management
 */

import { logAuthFailure } from "@/lib/server-logger";
import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";

// Wrap Convex Auth middleware to add production-grade error logs
const handler = convexAuthNextjsMiddleware();

export default async function authHandler(request: Request) {
  try {
    const response = await handler(request as any);
    if (response && response.status >= 400) {
      logAuthFailure({
        error: new Error(`Auth API returned status ${response.status}`),
        request,
        phase: "route",
        extras: { status: response.status },
      });
    }
    return response;
  } catch (error) {
    logAuthFailure({ error, request, phase: "route" });
    return new Response(JSON.stringify({ error: "Authentication error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
