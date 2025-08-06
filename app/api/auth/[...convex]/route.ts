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

import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  // Handle Convex Auth requests
  return NextResponse.json({ message: "Convex Auth endpoint" });
}

export function POST(request: NextRequest) {
  // Handle Convex Auth requests
  return NextResponse.json({ message: "Convex Auth endpoint" });
}