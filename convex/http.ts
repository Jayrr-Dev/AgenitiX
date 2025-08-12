/**
 * Route: convex/http.ts
 * CONVEX HTTP ROUTES - Auth endpoints and Resend webhook
 *
 * • Provides HTTP routes for Convex Auth OAuth flow
 * • Handles GitHub and Google OAuth redirects and callbacks
 * • Integrates with existing auth system through custom callbacks
 * • Supports both new Convex Auth and legacy magic link authentication
 * • Adds `/resend-webhook` endpoint for Resend event ingestion
 * • Maintains compatibility with existing auth_users table structure
 *
 * Keywords: convex-auth, http-routes, oauth-callbacks, github, google, authentication
 */

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { resend } from "./sendEmails";

const http = httpRouter();

// Add Convex Auth routes, basically OAuth endpoints and JWT verification
auth.addHttpRoutes(http);

export default http;

// Resend webhook endpoint – delivery/bounce status updates
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});
