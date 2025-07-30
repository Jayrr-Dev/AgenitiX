import { checkIPReputation, getCacheStats, refreshCache } from "@/lib/anubis/threat-intelligence";
import { type NextRequest, NextResponse } from "next/server";

// THREAT INTELLIGENCE STATUS AND MANAGEMENT API
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");
		const ip = searchParams.get("ip");

		// CHECK SPECIFIC IP
		if (action === "check" && ip) {
			const result = await checkIPReputation(ip);
			return NextResponse.json({
				ip,
				...result,
			});
		}

		// GET CACHE STATISTICS
		if (action === "stats") {
			const stats = getCacheStats();
			return NextResponse.json({
				cache: stats,
				status: "operational",
			});
		}

		// DEFAULT: RETURN GENERAL STATUS
		const stats = getCacheStats();
		return NextResponse.json({
			service: "AgenitiX Threat Intelligence",
			status: "operational",
			cache: stats,
			endpoints: {
				check: "/api/anubis/threat-intel?action=check&ip=<IP_ADDRESS>",
				stats: "/api/anubis/threat-intel?action=stats",
				refresh: "POST /api/anubis/threat-intel",
			},
		});
	} catch (error) {
		console.error("Threat intelligence API error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

// REFRESH THREAT INTELLIGENCE CACHE
export async function POST(request: NextRequest) {
	try {
		const { action } = await request.json().catch(() => ({ action: "refresh" }));

		if (action === "refresh") {
			await refreshCache();

			const stats = getCacheStats();
			return NextResponse.json({
				message: "Cache refreshed successfully",
				cache: stats,
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("Threat intelligence refresh error:", error);
		return NextResponse.json({ error: "Failed to refresh cache" }, { status: 500 });
	}
}
