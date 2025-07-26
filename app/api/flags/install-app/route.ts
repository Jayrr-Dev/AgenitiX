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

import { NextRequest, NextResponse } from "next/server";
import { installAppFlag } from "@/flag";

export async function GET(request: NextRequest) {
	try {
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