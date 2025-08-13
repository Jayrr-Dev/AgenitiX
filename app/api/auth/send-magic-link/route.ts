/**
 * Route: app/api/auth/send-magic-link/route.ts
 * DEPRECATED: Legacy custom magic-link sender
 *
 * Convex Auth now handles magic links directly via provider workflows.
 * This route returns 410 Gone to indicate deprecation.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Legacy magic link route removed. Use Convex Auth providers." },
    { status: 410 },
  );
}
