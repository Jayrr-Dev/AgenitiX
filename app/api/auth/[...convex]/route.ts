/**
 * Route: app/api/auth/[...convex]/route.ts
 * CONVEX AUTH API ROUTE - Handles all Convex Auth API requests
 *
 * • Exposes Convex Auth GET and POST handlers for OAuth/session flows
 * • Correct App Router integration (no NextFetchEvent in API route context)
 * • Compatible with Next.js 15 async params model
 *
 * Keywords: convex-auth-api, oauth-handler, github-auth, session-management
 */

// Use the official App Router route handlers from Convex Auth, basically
// re-export GET and POST so Next.js wires the route correctly
export { GET, POST } from "@convex-dev/auth/nextjs/server";
