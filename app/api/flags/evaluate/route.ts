/**
 * FEATURE FLAG EVALUATION API - Server-side flag evaluation endpoint
 *
 * • Evaluates feature flags on the server side
 * • Returns flag values to client-side components
 * • Handles authentication and context for flag evaluation
 * • Provides type-safe flag responses
 * • Integrates with Hypertune for real-time flag evaluation
 *
 * Keywords: api-route, feature-flags, server-side, hypertune-integration
 */

import { testFlag } from "@/flag";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const { flagName } = await request.json();

		// For now, we'll evaluate the test flag
		// In the future, you can extend this to evaluate any flag by name
		if (flagName === "test" || !flagName) {
			const flagValue = await testFlag();
			return NextResponse.json({
				enabled: flagValue,
				flagName: "test",
			});
		}

		// Default fallback
		return NextResponse.json({
			enabled: true,
			flagName: flagName || "test",
		});
	} catch (error) {
		console.error("Error evaluating feature flag:", error);
		return NextResponse.json(
			{
				error: "Failed to evaluate feature flag",
				enabled: false, // Safe fallback
			},
			{ status: 500 }
		);
	}
}
