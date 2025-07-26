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
		console.log("🚀 Setting up development data...");
		
		// Create test user
		console.log("👤 Creating test user...");
		const userResult = await client.mutation("devHelpers:createTestUser", {
			email: "test@example.com",
			name: "Test User",
			company: "AgenitiX",
			role: "Developer",
		});
		
		console.log(`✅ User: ${userResult.message}`);
		console.log(`📧 Email: test@example.com`);
		console.log(`🔑 User ID: ${userResult.userId}`);
		
		if (userResult.sessionToken) {
			console.log(`🎫 Session Token: ${userResult.sessionToken}`);
			console.log("💡 You can use this token to authenticate in development");
		}
		
		// Create test flows (always try to create them)
		console.log("\n📊 Creating test flows...");
		try {
			const flowsResult = await client.mutation("devHelpers:createTestFlows", {
				user_id: userResult.userId,
				count: 5,
			});
			
			console.log(`✅ ${flowsResult.message}`);
			flowsResult.flows.forEach((flow, index) => {
				console.log(`  ${index + 1}. ${flow.name} (${flow.is_private ? 'Private' : 'Public'})`);
			});
		} catch (error) {
			console.log("ℹ️  Test flows may already exist");
		}
		
		console.log("\n🎉 Development data setup complete!");
		console.log("\n📝 Next steps:");
		console.log("1. Start your development server: pnpm dev");
		console.log("2. Navigate to the dashboard");
		console.log("3. Use the test user credentials to sign in");
		
	} catch (error) {
		console.error("❌ Error setting up development data:", error);
		process.exit(1);
	}
}

// Run the setup
setupDevData();