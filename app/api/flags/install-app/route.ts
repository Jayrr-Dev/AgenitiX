/**
 * INSTALL APP FEATURE FLAG API - Server-side flag evaluation endpoint
 *
 * • Evaluates the install app feature flag server-side
 * • Returns flag status for client-side consumption
 * • Integrates with Hypertune for type-safe evaluation
 * • Handles errors gracefully with fallback values
 *
 * Keywords: api-route, feature-flag, server-side, hypertune-integration
 */

import { installAppFlag } from "@/flag";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
	try {
		// Check if Hypertune token is available
		if (!process.env.NEXT_PUBLIC_HYPERTUNE_TOKEN) {
			console.warn("NEXT_PUBLIC_HYPERTUNE_TOKEN not found, using fallback values");
			return NextResponse.json({
				success: true,
				isEnabled: true, // Default to enabled when token is missing
				warning: "Hypertune token not configured, using fallback values",
				timestamp: new Date().toISOString(),
			});
		}

		// Get the flag value server-side
		const isEnabled = await installAppFlag();

		return NextResponse.json({
			success: true,
			isEnabled,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error evaluating install app flag:", error);

		// Return fallback value on error
		return NextResponse.json({
			success: false,
			isEnabled: true, // Default to enabled for graceful degradation
			error: error instanceof Error ? error.message : "Unknown error",
			timestamp: new Date().toISOString(),
		});
	}
}
