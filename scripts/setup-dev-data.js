#!/usr/bin/env node

/**
 * Development Data Setup Script
 *
 * This script sets up test data for development including:
 * - Test user account
 * - Sample flows
 * - Authentication session
 */

const { ConvexHttpClient } = require("convex/browser");

// Get Convex deployment URL from environment
const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://avid-condor-564.convex.cloud";

if (!CONVEX_URL) {
	console.error("❌ CONVEX_URL not found. Please check your environment variables.");
	process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function setupDevData() {
	try {
		const userResult = await client.mutation("devHelpers:createTestUser", {
			email: "test@example.com",
			name: "Test User",
			company: "AgenitiX",
			role: "Developer",
		});

		if (userResult.sessionToken) {
		}
		try {
			const flowsResult = await client.mutation("devHelpers:createTestFlows", {
				user_id: userResult.userId,
				count: 5,
			});
			flowsResult.flows.forEach((_flow, _index) => {});
		} catch (_error) {}
	} catch (error) {
		console.error("❌ Error setting up development data:", error);
		process.exit(1);
	}
}

// Run the setup
setupDevData();
