/**
 * Development script to reset rate limits for testing
 * Usage: node scripts/reset-rate-limit.js
 */

const { ConvexHttpClient } = require("convex/browser");

const client = new ConvexHttpClient("https://avid-condor-564.convex.cloud");

async function resetRateLimit() {
	try {
		const result = await client.mutation("auth:resetRateLimits", {
			email: "Samuel.v.soriano@gmail.com",
		});

		console.log("✅ Rate limit reset successfully:", result);
	} catch (error) {
		console.error("❌ Failed to reset rate limit:", error);
	}
}

resetRateLimit();
