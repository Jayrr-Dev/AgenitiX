/**
 * FLOWS CONVEX FUNCTIONS - Flow management and sharing system
 *
 * • Create, read, update, delete flows
 * • Share flows with token-based access control
 * • Manage flow permissions and access requests
 * • Secure user authentication and authorization
 * • Integration with flow sharing system
 *
 * Keywords: flows, sharing, permissions, authentication, convex
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all flows for a user
 */
export const getUserFlows = query({
	args: { user_id: v.id("auth_users") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("flows")
			.withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
			.collect();
	},
});

/**
 * Get a specific flow by ID
 */
export const getFlow = query({
	args: { flow_id: v.id("flows") },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.flow_id);
	},
});

/**
 * Check if user has access to a flow
 */
export const checkFlowAccess = query({
	args: { 
		flow_id: v.id("flows"), 
		user_id: v.id("auth_users") 
	},
	handler: async (ctx, args) => {
		const flow = await ctx.db.get(args.flow_id);
		if (!flow) return { hasAccess: false, permission: null };

		// Owner has full access
		if (flow.user_id === args.user_id) {
			return { hasAccess: true, permission: "admin" };
		}

		// Check if flow is public
		if (!flow.is_private) {
			return { hasAccess: true, permission: "view" };
		}

		// Check for explicit permissions
		const permissions = await ctx.db
			.query("flow_share_permissions")
			.withIndex("by_flow_and_user", (q) => 
				q.eq("flow_id", args.flow_id).eq("user_id", args.user_id)
			)
			.collect();

		if (permissions.length > 0) {
			// Return highest permission level
			const permissionLevels = { view: 1, edit: 2, admin: 3 };
			const highestPermission = permissions.reduce((highest, perm) => {
				const currentLevel = permissionLevels[perm.permission_type];
				const highestLevel = permissionLevels[highest.permission_type];
				return currentLevel > highestLevel ? perm : highest;
			});
			return { hasAccess: true, permission: highestPermission.permission_type };
		}

		return { hasAccess: false, permission: null };
	},
});

/**
 * Get flow share information
 */
export const getFlowShare = query({
	args: { 
		flow_id: v.id("flows"),
		share_token: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		if (args.share_token) {
			return await ctx.db
				.query("flow_shares")
				.withIndex("by_share_token", (q) => q.eq("share_token", args.share_token!))
				.first();
		}

		return await ctx.db
			.query("flow_shares")
			.withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
			.first();
	},
});

/**
 * Get pending access requests for a flow
 */
export const getFlowAccessRequests = query({
	args: { flow_id: v.id("flows") },
	handler: async (ctx, args) => {
		return await ctx.db
			.query("flow_access_requests")
			.withIndex("by_flow_and_status", (q) => 
				q.eq("flow_id", args.flow_id).eq("status", "pending")
			)
			.collect();
	},
});

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Create a new flow
 */
export const createFlow = mutation({
	args: {
		name: v.string(),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		is_private: v.boolean(),
		user_id: v.id("auth_users"),
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();
		
		const flow_id = await ctx.db.insert("flows", {
			name: args.name,
			description: args.description,
			icon: args.icon || "zap",
			is_private: args.is_private,
			user_id: args.user_id,
			created_at: now,
			updated_at: now,
		});

		return flow_id;
	},
});

/**
 * Update a flow
 */
export const updateFlow = mutation({
	args: {
		flow_id: v.id("flows"),
		name: v.optional(v.string()),
		description: v.optional(v.string()),
		icon: v.optional(v.string()),
		is_private: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { flow_id, ...updates } = args;
		const now = new Date().toISOString();
		
		await ctx.db.patch(flow_id, {
			...updates,
			updated_at: now,
		});
	},
});

/**
 * Delete a flow
 */
export const deleteFlow = mutation({
	args: { flow_id: v.id("flows") },
	handler: async (ctx, args) => {
		// Delete related records first
		await ctx.db.delete(args.flow_id);
		
		// Delete share records
		const shares = await ctx.db
			.query("flow_shares")
			.withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
			.collect();
		
		for (const share of shares) {
			await ctx.db.delete(share._id);
		}

		// Delete permissions
		const permissions = await ctx.db
			.query("flow_share_permissions")
			.withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
			.collect();
		
		for (const permission of permissions) {
			await ctx.db.delete(permission._id);
		}

		// Delete access requests
		const requests = await ctx.db
			.query("flow_access_requests")
			.withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
			.collect();
		
		for (const request of requests) {
			await ctx.db.delete(request._id);
		}
	},
});

/**
 * Share a flow
 */
export const shareFlow = mutation({
	args: {
		flow_id: v.id("flows"),
		shared_by_user_id: v.id("auth_users"),
		expires_at: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		// Verify user owns the flow
		const flow = await ctx.db.get(args.flow_id);
		if (!flow || flow.user_id !== args.shared_by_user_id) {
			throw new Error("Flow not found or access denied");
		}

		// Generate share token
		const share_token = generateShareToken();
		const now = new Date().toISOString();

		const share_id = await ctx.db.insert("flow_shares", {
			flow_id: args.flow_id,
			shared_by_user_id: args.shared_by_user_id,
			share_token,
			is_active: true,
			expires_at: args.expires_at,
			created_at: now,
		});

		return { share_id, share_token };
	},
});

/**
 * Grant access to a flow
 */
export const grantFlowAccess = mutation({
	args: {
		flow_id: v.id("flows"),
		share_id: v.id("flow_shares"),
		user_id: v.id("auth_users"),
		permission_type: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
		granted_by_user_id: v.id("auth_users"),
	},
	handler: async (ctx, args) => {
		// Verify the granting user owns the flow
		const flow = await ctx.db.get(args.flow_id);
		if (!flow || flow.user_id !== args.granted_by_user_id) {
			throw new Error("Flow not found or access denied");
		}

		const now = new Date().toISOString();

		await ctx.db.insert("flow_share_permissions", {
			flow_id: args.flow_id,
			share_id: args.share_id,
			user_id: args.user_id,
			permission_type: args.permission_type,
			granted_at: now,
			granted_by_user_id: args.granted_by_user_id,
		});
	},
});

/**
 * Request access to a flow
 */
export const requestFlowAccess = mutation({
	args: {
		flow_id: v.id("flows"),
		requesting_user_id: v.id("auth_users"),
		requesting_user_email: v.string(),
		permission_type: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
	},
	handler: async (ctx, args) => {
		const now = new Date().toISOString();

		await ctx.db.insert("flow_access_requests", {
			flow_id: args.flow_id,
			requesting_user_id: args.requesting_user_id,
			requesting_user_email: args.requesting_user_email,
			permission_type: args.permission_type,
			status: "pending",
			requested_at: now,
		});
	},
});

/**
 * Respond to access request
 */
export const respondToAccessRequest = mutation({
	args: {
		request_id: v.id("flow_access_requests"),
		status: v.union(v.literal("approved"), v.literal("denied")),
		responded_by_user_id: v.id("auth_users"),
		response_note: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const request = await ctx.db.get(args.request_id);
		if (!request) {
			throw new Error("Access request not found");
		}

		const now = new Date().toISOString();

		await ctx.db.patch(args.request_id, {
			status: args.status,
			responded_at: now,
			responded_by_user_id: args.responded_by_user_id,
			response_note: args.response_note,
		});

		// If approved, grant access
		if (args.status === "approved") {
			// Find or create share record
			let share = await ctx.db
				.query("flow_shares")
				.withIndex("by_flow_id", (q) => q.eq("flow_id", request.flow_id))
				.first();

			if (!share) {
				const share_token = generateShareToken();
				const share_id = await ctx.db.insert("flow_shares", {
					flow_id: request.flow_id,
					shared_by_user_id: args.responded_by_user_id,
					share_token,
					is_active: true,
					created_at: now,
				});
				
				// Get the created share record
				share = await ctx.db.get(share_id);
			}

			// Grant permission (only if share exists)
			if (share) {
				await ctx.db.insert("flow_share_permissions", {
					flow_id: request.flow_id,
					share_id: share._id,
					user_id: request.requesting_user_id,
					permission_type: request.permission_type,
					granted_at: now,
					granted_by_user_id: args.responded_by_user_id,
				});
			}
		}
	},
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a secure share token
 */
function generateShareToken(): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 32; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
} 