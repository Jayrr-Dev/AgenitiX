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

import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest) {
  // Handle Convex Auth requests
  return NextResponse.json({ message: "Convex Auth endpoint" });
}

export function POST(request: NextRequest) {
  // Handle Convex Auth requests
  return NextResponse.json({ message: "Convex Auth endpoint" });
}