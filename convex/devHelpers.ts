/**
 * DEVELOPMENT HELPERS - Functions to help with development and testing
 *
 * These functions should only be used in development environment
 * and help with seeding test data and debugging.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a test user for development
 */
export const createTestUser = mutation({
	args: {
		email: v.string(),
		name: v.string(),
		company: v.optional(v.string()),
		role: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Only allow in development
		if (process.env.NODE_ENV === "production") {
			throw new Error("This function is only available in development");
		}

		// Check if user already exists
		const existingUser = await ctx.db
			.query("auth_users")
			.withIndex("by_email", (q) => q.eq("email", args.email))
			.first();

		if (existingUser) {
			return {
				userId: existingUser._id,
				message: "User already exists",
				existing: true,
			};
		}

		// Create test user (already verified)
		const userId = await ctx.db.insert("auth_users", {
			email: args.email,
			name: args.name,
			company: args.company,
			role: args.role,
			email_verified: true,
			is_active: true,
			created_at: Date.now(),
			updated_at: Date.now(),
			login_attempts: 0,
		});

		// Create a test session token
		const sessionToken = `dev_session_${userId}_${Date.now()}`;

		const sessionId = await ctx.db.insert("auth_sessions", {
			user_id: userId,
			token_hash: sessionToken,
			expires_at: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
			created_at: Date.now(),
			ip_address: "127.0.0.1",
			user_agent: "Development",
			is_active: true,
		});

		return {
			userId,
			sessionToken,
			sessionId,
			message: "Test user created successfully",
			existing: false,
		};
	},
});

/**
 * Create test flows for development
 */
export const createTestFlows = mutation({
	args: {
		user_id: v.id("auth_users"),
		count: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// Only allow in development
		if (process.env.NODE_ENV === "production") {
			throw new Error("This function is only available in development");
		}

		const count = args.count || 3;
		const now = new Date().toISOString();

		const testFlows = [
			{
				name: "Email Marketing Campaign",
				description: "Automated email sequence for new subscribers",
				icon: "mail",
				is_private: false,
			},
			{
				name: "Data Processing Pipeline",
				description: "Process CSV files and generate reports",
				icon: "database",
				is_private: true,
			},
			{
				name: "Social Media Automation",
				description: "Schedule and post content across platforms",
				icon: "globe",
				is_private: false,
			},
			{
				name: "Customer Support Bot",
				description: "AI-powered customer support automation",
				icon: "bot",
				is_private: true,
			},
			{
				name: "Inventory Management",
				description: "Track and manage product inventory",
				icon: "activity",
				is_private: false,
			},
		];

		const createdFlows = [];

		for (let i = 0; i < Math.min(count, testFlows.length); i++) {
			const flowData = testFlows[i];
			const flowId = await ctx.db.insert("flows", {
				...flowData,
				user_id: args.user_id,
				created_at: now,
				updated_at: now,
			});

			createdFlows.push({ id: flowId, ...flowData });
		}

		return {
			message: `Created ${createdFlows.length} test flows`,
			flows: createdFlows,
		};
	},
});

/**
 * Clear all test data for development
 */
export const clearTestData = mutation({
	args: {},
	handler: async (ctx, args) => {
		// Only allow in development
		if (process.env.NODE_ENV === "production") {
			throw new Error("This function is only available in development");
		}

		// Clear flows
		const flows = await ctx.db.query("flows").collect();
		for (const flow of flows) {
			await ctx.db.delete(flow._id);
		}

		// Clear flow shares
		const shares = await ctx.db.query("flow_shares").collect();
		for (const share of shares) {
			await ctx.db.delete(share._id);
		}

		// Clear flow permissions
		const permissions = await ctx.db.query("flow_share_permissions").collect();
		for (const permission of permissions) {
			await ctx.db.delete(permission._id);
		}

		// Clear access requests
		const requests = await ctx.db.query("flow_access_requests").collect();
		for (const request of requests) {
			await ctx.db.delete(request._id);
		}

		// Clear sessions (but keep users for easier testing)
		const sessions = await ctx.db.query("auth_sessions").collect();
		for (const session of sessions) {
			await ctx.db.delete(session._id);
		}

		return {
			message: "Test data cleared successfully",
			cleared: {
				flows: flows.length,
				shares: shares.length,
				permissions: permissions.length,
				requests: requests.length,
				sessions: sessions.length,
			},
		};
	},
});

/**
 * Get all users for development debugging
 */
export const getAllUsers = query({
	args: {},
	handler: async (ctx, args) => {
		// Only allow in development
		if (process.env.NODE_ENV === "production") {
			throw new Error("This function is only available in development");
		}

		const users = await ctx.db.query("auth_users").collect();

		return users.map((user) => ({
			id: user._id,
			email: user.email,
			name: user.name,
			company: user.company,
			role: user.role,
			email_verified: user.email_verified,
			is_active: user.is_active,
			created_at: user.created_at,
		}));
	},
});
