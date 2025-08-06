/**
 * Route: app/api/auth/route.ts
 * CONVEX AUTH BASE ROUTE - Redirects base auth requests to Convex Auth handler
 *
 * • Provides a fallback route for base /api/auth requests
 * • Redirects to proper Convex Auth handlers
 * • Ensures compatibility with Convex Auth client expectations
 *
 * Keywords: convex-auth-base, auth-redirect, compatibility
 */

import { convexAuthNextjsServerRoute } from "@convex-dev/auth/nextjs/server";

const route = convexAuthNextjsServerRoute;

export { route as GET, route as POST };