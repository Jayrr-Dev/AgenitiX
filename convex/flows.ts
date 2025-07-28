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
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all flows for a user (only their own flows)
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
 * Get public flows for discovery (excluding user's own flows)
 */
export const getPublicFlows = query({
  args: {
    user_id: v.optional(v.id("auth_users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 20;

    const publicFlows = await ctx.db
      .query("flows")
      .filter((q) => q.eq(q.field("is_private"), false))
      .order("desc")
      .take(limit * 2); // Take more to filter out user's own flows

    // Filter out user's own flows if user_id is provided
    const filteredFlows = args.user_id
      ? publicFlows.filter((flow) => flow.user_id !== args.user_id)
      : publicFlows;

    return filteredFlows.slice(0, limit);
  },
});

/**
 * Get flows accessible to a user (own + shared + public)
 */
export const getAccessibleFlows = query({
  args: { user_id: v.id("auth_users") },
  handler: async (ctx, args) => {
    // Get user's own flows
    const ownFlows = await ctx.db
      .query("flows")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Get flows shared with user
    const sharedPermissions = await ctx.db
      .query("flow_share_permissions")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    const sharedFlows = await Promise.all(
      sharedPermissions.map(async (permission) => {
        const flow = await ctx.db.get(permission.flow_id);
        return flow
          ? { ...flow, sharedPermission: permission.permission_type }
          : null;
      })
    );

    // Get public flows (excluding own flows)
    const publicFlows = await ctx.db
      .query("flows")
      .filter((q) =>
        q.and(
          q.eq(q.field("is_private"), false),
          q.neq(q.field("user_id"), args.user_id)
        )
      )
      .collect();

    // Combine and deduplicate
    const allFlows = [
      ...ownFlows.map((flow) => ({ ...flow, accessType: "owner" })),
      ...sharedFlows
        .filter(Boolean)
        .map((flow) => ({ ...flow, accessType: "shared" })),
      ...publicFlows.map((flow) => ({ ...flow, accessType: "public" })),
    ];

    // Remove duplicates based on flow ID
    const uniqueFlows = allFlows.filter(
      (flow, index, self) => index === self.findIndex((f) => f._id === flow._id)
    );

    return uniqueFlows;
  },
});

/**
 * Get a specific flow by ID (basic lookup - no access control)
 */
export const getFlow = query({
  args: { flow_id: v.id("flows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.flow_id);
  },
});

/**
 * Get a flow with proper access control
 */
export const getFlowSecure = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flow_id);
    if (!flow) return null;

    // Check access permissions
    const accessCheck = await checkFlowAccessInternal(
      ctx,
      args.flow_id,
      args.user_id
    );

    if (!accessCheck.hasAccess) {
      return null; // User doesn't have access
    }

    // Return flow with access information
    return {
      ...flow,
      userPermission: accessCheck.permission,
      canEdit:
        accessCheck.permission === "admin" || accessCheck.permission === "edit",
      canView: accessCheck.hasAccess,
      isOwner: flow.user_id === args.user_id,
    };
  },
});

/**
 * Internal helper function for access checking (reusable)
 */
async function checkFlowAccessInternal(
  ctx: QueryCtx | MutationCtx,
  flow_id: Id<"flows">,
  user_id: Id<"auth_users">
) {
  const flow = await ctx.db.get(flow_id);
  if (!flow) return { hasAccess: false, permission: null };

  // Owner has full access
  if (flow.user_id === user_id) {
    return { hasAccess: true, permission: "admin" };
  }

  // Check if flow is public
  if (!flow.is_private) {
    return { hasAccess: true, permission: "view" };
  }

  // Check for explicit permissions (simplified for now)
  try {
    const permissions = await ctx.db
      .query("flow_share_permissions")
      .withIndex("by_flow_and_user", (q) =>
        q.eq("flow_id", flow_id).eq("user_id", user_id)
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
  } catch (error) {
    // If there's an error with shared permissions, just continue
    console.warn("Error checking shared permissions:", error);
  }

  return { hasAccess: false, permission: null };
}

/**
 * Check if user has access to a flow
 */
export const checkFlowAccess = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    return await checkFlowAccessInternal(ctx, args.flow_id, args.user_id);
  },
});

/**
 * Get flow share information
 */
export const getFlowShare = query({
  args: {
    flow_id: v.id("flows"),
    share_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.share_token) {
      return await ctx.db
        .query("flow_shares")
        .withIndex("by_share_token", (q) =>
          q.eq("share_token", args.share_token as string)
        )
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
 * Update a flow (with access control)
 */
export const updateFlow = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    is_private: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, ...updates } = args;

    // Check if user has edit access
    const accessCheck = await checkFlowAccessInternal(ctx, flow_id, user_id);
    if (
      !accessCheck.hasAccess ||
      (accessCheck.permission !== "admin" && accessCheck.permission !== "edit")
    ) {
      throw new Error("You don't have permission to edit this flow");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(flow_id, {
      ...updates,
      updated_at: now,
    });
  },
});

/**
 * Save canvas state (nodes and edges) for a flow
 */
export const saveFlowCanvas = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
    nodes: v.any(),
    edges: v.any(),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, nodes, edges } = args;

    // Check if user has edit access
    const accessCheck = await checkFlowAccessInternal(ctx, flow_id, user_id);
    if (
      !accessCheck.hasAccess ||
      (accessCheck.permission !== "admin" && accessCheck.permission !== "edit")
    ) {
      throw new Error("You don't have permission to edit this flow");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(flow_id, {
      nodes,
      edges,
      canvas_updated_at: now,
      updated_at: now,
    });
  },
});

/**
 * Load canvas state (nodes and edges) for a flow
 */
export const loadFlowCanvas = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.optional(v.id("auth_users")),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id } = args;

    // Check access if user_id is provided
    if (user_id) {
      const accessCheck = await checkFlowAccessInternal(ctx, flow_id, user_id);
      if (!accessCheck.hasAccess) {
        throw new Error("You don't have permission to view this flow");
      }
    }

    const flow = await ctx.db.get(flow_id);
    if (!flow) {
      throw new Error("Flow not found");
    }

    // If no user_id provided, only allow access to public flows
    if (!user_id && flow.is_private) {
      throw new Error("This flow is private");
    }

    return {
      nodes: flow.nodes || [],
      edges: flow.edges || [],
      canvas_updated_at: flow.canvas_updated_at,
    };
  },
});

/**
 * Delete a flow
 */
export const deleteFlow = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    // Check if user has permission to delete the flow
    const flow = await ctx.db.get(args.flow_id);
    if (!flow) {
      throw new Error("Flow not found");
    }

    if (flow.user_id !== args.user_id) {
      throw new Error("You don't have permission to delete this flow");
    }

    // Delete upvotes first
    const upvotes = await ctx.db
      .query("flow_upvotes")
      .withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
      .collect();

    for (const upvote of upvotes) {
      await ctx.db.delete(upvote._id);
    }

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

    // Finally delete the flow itself
    await ctx.db.delete(args.flow_id);
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
    permission_type: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("admin")
    ),
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
    permission_type: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("admin")
    ),
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
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// UPVOTE FUNCTIONS
// ============================================================================

/**
 * Get upvotes for a flow
 */
export const getFlowUpvotes = query({
  args: { flow_id: v.id("flows") },
  handler: async (ctx, args) => {
    const upvotes = await ctx.db
      .query("flow_upvotes")
      .withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
      .collect();

    return upvotes.length;
  },
});

/**
 * Check if user has upvoted a flow
 */
export const hasUserUpvoted = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    const upvote = await ctx.db
      .query("flow_upvotes")
      .withIndex("by_flow_and_user", (q) =>
        q.eq("flow_id", args.flow_id).eq("user_id", args.user_id)
      )
      .first();

    return !!upvote;
  },
});

/**
 * Toggle upvote for a flow
 */
export const toggleFlowUpvote = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("auth_users"),
  },
  handler: async (ctx, args) => {
    const existingUpvote = await ctx.db
      .query("flow_upvotes")
      .withIndex("by_flow_and_user", (q) =>
        q.eq("flow_id", args.flow_id).eq("user_id", args.user_id)
      )
      .first();

    if (existingUpvote) {
      // Remove upvote
      await ctx.db.delete(existingUpvote._id);
      return { action: "removed", upvotes: -1 };
    }

    // Add upvote
    const now = new Date().toISOString();
    await ctx.db.insert("flow_upvotes", {
      flow_id: args.flow_id,
      user_id: args.user_id,
      created_at: now,
    });
    return { action: "added", upvotes: 1 };
  },
});

/**
 * Get public flows with upvote counts and user upvote status
 */
export const getPublicFlowsWithUpvotes = query({
  args: {
    user_id: v.optional(v.id("auth_users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 24;

    // Get all public flows first
    const publicFlows: any[] = await ctx.db
      .query("flows")
      .withIndex("by_is_private", (q) => q.eq("is_private", false))
      .order("desc")
      .take(limit * 2);

    // Don't filter out user's own flows - show all public flows including user's own
    // This allows users to see their own public flows in the explore page

    const flowsWithUpvotes = await Promise.all(
      publicFlows.slice(0, limit).map(async (flow) => {
        // Get upvote count
        const upvotes = await ctx.db
          .query("flow_upvotes")
          .withIndex("by_flow_id", (q) => q.eq("flow_id", flow._id))
          .collect();

        // Check if current user has upvoted
        let hasUpvoted = false;
        if (args.user_id) {
          const userUpvote = await ctx.db
            .query("flow_upvotes")
            .withIndex("by_flow_and_user", (q) =>
              q
                .eq("flow_id", flow._id)
                .eq("user_id", args.user_id as Id<"auth_users">)
            )
            .first();
          hasUpvoted = !!userUpvote;
        }

        // Get creator information
        const creator = (await ctx.db.get(flow.user_id)) as any;

        return {
          ...flow,
          upvoteCount: upvotes.length,
          hasUpvoted,
          creator: creator?.name
            ? {
                id: creator._id,
                name: creator.name,
                email: creator.email,
              }
            : null,
        };
      })
    );

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[getPublicFlowsWithUpvotes] Found ${publicFlows.length} public flows, returning ${flowsWithUpvotes.length} with upvotes`
      );
    }

    return flowsWithUpvotes;
  },
});

/**
 * Debug function to check public flows (development only)
 */
export const debugPublicFlows = query({
  args: {},
  handler: async (ctx) => {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      throw new Error("This function is only available in development");
    }

    const allFlows = await ctx.db.query("flows").collect();
    const publicFlows = allFlows.filter((flow) => !flow.is_private);
    const privateFlows = allFlows.filter((flow) => flow.is_private);

    return {
      totalFlows: allFlows.length,
      publicFlows: publicFlows.length,
      privateFlows: privateFlows.length,
      publicFlowDetails: publicFlows.map((flow) => ({
        id: flow._id,
        name: flow.name,
        is_private: flow.is_private,
        user_id: flow.user_id,
        created_at: flow.created_at,
      })),
    };
  },
});

/**
 * Simple test function to get public flows without upvotes (development only)
 */
export const getPublicFlowsSimple = query({
  args: {},
  handler: async (ctx) => {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      throw new Error("This function is only available in development");
    }

    const publicFlows = await ctx.db
      .query("flows")
      .withIndex("by_is_private", (q) => q.eq("is_private", false))
      .order("desc")
      .take(50);

    // Don't filter out user's own flows - show all public flows including user's own

    // Add creator information
    const flowsWithCreators = await Promise.all(
      publicFlows.map(async (flow) => {
        const creator = (await ctx.db.get(flow.user_id)) as any;
        return {
          ...flow,
          creator: creator?.name
            ? {
                id: creator._id,
                name: creator.name,
                email: creator.email,
              }
            : null,
        };
      })
    );

    return flowsWithCreators;
  },
});
