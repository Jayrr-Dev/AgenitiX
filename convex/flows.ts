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

function checksum(input: string): string {
  // Simple non-crypto checksum for integrity hints
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    const chr = input.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit
  }
  return String(hash >>> 0);
}

interface UserDocument {
  _id: Id<"users">; // Use Convex Auth users table for OAuth compatibility
  _creationTime: number;
  name?: string;
  email: string;
  emailVerified?: number;
  image?: string;
  isAnonymous?: boolean;
}

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Get all flows for a user (only their own flows)
 */
export const getUserFlows = query({
  args: { user_id: v.id("users") }, // Use Convex Auth users table for OAuth compatibility
  handler: async (ctx, args) => {
    try {
      const docs = await ctx.db
        .query("flows")
        .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
        .collect();

      // Project to lightweight metadata to reduce bandwidth
      return docs.map((flow) => ({
        _id: flow._id,
        name: flow.name,
        description: flow.description,
        icon: flow.icon,
        is_private: flow.is_private,
        user_id: flow.user_id,
        created_at: (flow as any).created_at,
        updated_at: (flow as any).updated_at,
        canvas_updated_at: (flow as any).canvas_updated_at,
      }));
    } catch (error) {
      console.error("Error in getUserFlows:", error);
      // Return empty array if there's a validation error while we fix the schema
      return [];
    }
  },
});

/**
 * Get public flows for discovery (excluding user's own flows)
 */
export const getPublicFlows = query({
  args: {
    user_id: v.optional(v.id("users")),
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

    // Return lightweight projection
    return filteredFlows.slice(0, limit).map((flow) => ({
      _id: flow._id,
      name: flow.name,
      description: flow.description,
      icon: flow.icon,
      is_private: flow.is_private,
      user_id: flow.user_id,
      created_at: (flow as any).created_at,
      updated_at: (flow as any).updated_at,
      canvas_updated_at: (flow as any).canvas_updated_at,
    }));
  },
});

/**
 * Get flows accessible to a user (own + shared + public)
 */
export const getAccessibleFlows = query({
  args: { user_id: v.id("users") },
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
    const project = (flow: any) => ({
      _id: flow._id,
      name: flow.name,
      description: flow.description,
      icon: flow.icon,
      is_private: flow.is_private,
      user_id: flow.user_id,
      created_at: (flow as any).created_at,
      updated_at: (flow as any).updated_at,
      canvas_updated_at: (flow as any).canvas_updated_at,
    });

    const allFlows = [
      ...ownFlows.map((flow) => ({ ...project(flow), accessType: "owner" })),
      ...sharedFlows
        .filter(Boolean)
        .map((flow) => ({ ...project(flow), accessType: "shared" })),
      ...publicFlows.map((flow) => ({
        ...project(flow),
        accessType: "public",
      })),
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
    const flow = await ctx.db.get(args.flow_id);
    if (!flow) return null;
    // Project to lightweight metadata only
    return {
      _id: flow._id,
      name: flow.name,
      description: flow.description,
      icon: flow.icon,
      is_private: flow.is_private,
      user_id: flow.user_id,
      created_at: (flow as any).created_at,
      updated_at: (flow as any).updated_at,
      canvas_updated_at: (flow as any).canvas_updated_at,
    } as const;
  },
});

/**
 * Get a flow with proper access control
 */
export const getFlowSecure = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const flow = await ctx.db.get(args.flow_id);
    if (!flow) {
      return null;
    }

    // Check access permissions
    const accessCheck = await checkFlowAccessInternal(
      ctx,
      args.flow_id,
      args.user_id
    );

    if (!accessCheck.hasAccess) {
      return null; // User doesn't have access
    }

    // Return ONLY metadata (omit heavy nodes/edges to reduce bandwidth)
    const meta = {
      _id: flow._id,
      name: flow.name,
      description: flow.description,
      icon: flow.icon,
      is_private: flow.is_private,
      user_id: flow.user_id,
      canvas_updated_at: (flow as any).canvas_updated_at,
      created_at: (flow as any).created_at,
      updated_at: (flow as any).updated_at,
    } as const;

    return {
      ...meta,
      userPermission: accessCheck.permission,
      canEdit:
        accessCheck.permission === "admin" || accessCheck.permission === "edit",
      canView: accessCheck.hasAccess,
      isOwner: flow.user_id === args.user_id,
    } as const;
  },
});

/**
 * Internal helper function for access checking (reusable)
 */
async function checkFlowAccessInternal(
  ctx: QueryCtx | MutationCtx,
  flow_id: Id<"flows">,
  user_id: Id<"users">
) {
  const flow = await ctx.db.get(flow_id);
  if (!flow) {
    return { hasAccess: false, permission: null };
  }

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
        const currentLevel =
          permissionLevels[
            perm.permission_type as keyof typeof permissionLevels
          ];
        const highestLevel =
          permissionLevels[
            highest.permission_type as keyof typeof permissionLevels
          ];
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
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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
 * Clone a public flow to user's account with canvas data
 */
export const clonePublicFlow = mutation({
  args: {
    source_flow_id: v.id("flows"),
    user_id: v.id("users"),
    new_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { source_flow_id, user_id, new_name } = args;

    // Get the source flow
    const sourceFlow = await ctx.db.get(source_flow_id);
    if (!sourceFlow) {
      throw new Error("Source flow not found");
    }

    // Only allow cloning public flows
    if (sourceFlow.is_private) {
      throw new Error("Cannot clone private flows");
    }

    const now = new Date().toISOString();

    // Strip document references from nodes to avoid leaking storage refs across clones
    const stripDocRefs = (nodes: any[] | undefined) => {
      if (!Array.isArray(nodes)) return [] as any[];
      return nodes.map((n) => {
        const data = n?.data && typeof n.data === "object" ? { ...n.data } : {};
        if (data) {
          delete (data as any).document_id;
          delete (data as any).document_size;
          delete (data as any).document_checksum;
          delete (data as any).document_content_type;
          delete (data as any).document_preview;
        }
        return { ...n, data };
      });
    };

    // Create the cloned flow with canvas data, basically complete workflow copy
    const clonedFlowId = await ctx.db.insert("flows", {
      name: new_name || `${sourceFlow.name} (Copy)`,
      description: sourceFlow.description,
      icon: sourceFlow.icon || "zap",
      is_private: true, // Clone as private by default
      user_id: user_id,
      nodes: stripDocRefs((sourceFlow as any).nodes) || [], // Copy canvas nodes without doc refs
      edges: sourceFlow.edges || [], // Copy canvas edges
      canvas_updated_at: now,
      created_at: now,
      updated_at: now,
    });

    return clonedFlowId;
  },
});

/**
 * Update a flow (with access control)
 */
export const updateFlow = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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

    // Store as blob to reduce DB bandwidth
    try {
      const payload = JSON.stringify({ nodes, edges });
      const data = new TextEncoder().encode(payload);
      const storageId = await (ctx as any).storage.store(data);
      await ctx.db.patch(flow_id, {
        // Keep legacy fields empty to avoid heavy reactivity
        nodes: undefined,
        edges: undefined,
        canvas_storage_id: storageId,
        canvas_storage_size: payload.length,
        canvas_checksum: checksum(payload),
        canvas_updated_at: now,
        updated_at: now,
      } as any);
    } catch {
      // Fallback: store inline if storage fails
      await ctx.db.patch(flow_id, {
        nodes,
        edges,
        canvas_updated_at: now,
        updated_at: now,
      });
    }
  },
});

/**
 * Load canvas state (nodes and edges) for a flow
 */
export const loadFlowCanvas = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.optional(v.id("users")),
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

    // If stored as blob, load once and return parsed
    if ((flow as any).canvas_storage_id) {
      try {
        const buf = await (ctx as any).storage.get(
          (flow as any).canvas_storage_id
        );
        if (buf) {
          const text = new TextDecoder().decode(buf);
          const parsed = JSON.parse(text) as { nodes: any[]; edges: any[] };
          return {
            nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
            edges: Array.isArray(parsed.edges) ? parsed.edges : [],
            canvas_updated_at: (flow as any).canvas_updated_at,
          } as const;
        }
      } catch {}
    }

    // Server-side safety prune to keep payloads small and consistent
    const SAFE_NODE_KEYS = new Set([
      "isExpanded",
      "isEnabled",
      "isActive",
      "label",
      "store",
      "expandedSize",
      "collapsedSize",
      "viewPath",
      "summaryLimit",
      // Document reference fields for large external content
      "document_id",
      "document_size",
      "document_checksum",
      "document_content_type",
      "document_preview",
    ]);

    const sanitizeNodeData = (node: any) => {
      const data = node?.data || {};
      const out: Record<string, any> = {};
      for (const k of Object.keys(data)) {
        if (SAFE_NODE_KEYS.has(k)) out[k] = data[k];
      }
      // Preserve inputs for view/convert nodes to render inspector previews
      const type: string = node?.type || "";
      if (/^(view|to|convert)/i.test(type) && data.inputs) {
        out.inputs = data.inputs;
      }
      return out;
    };

    const nodes = Array.isArray((flow as any).nodes)
      ? (flow as any).nodes.map((n: any) => ({
          id: n.id,
          type: n.type,
          position: n.position,
          data: sanitizeNodeData(n),
        }))
      : [];
    const edges = Array.isArray((flow as any).edges) ? (flow as any).edges : [];

    return {
      nodes,
      edges,
      canvas_updated_at: (flow as any).canvas_updated_at,
    } as const;
  },
});

/**
 * Delete a flow
 */
export const deleteFlow = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
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

    // Delete canvas blob if present
    try {
      const storageId = (flow as any).canvas_storage_id;
      if (storageId) {
        await ctx.storage.delete(storageId);
      }
    } catch (e) {
      console.warn("Failed to delete canvas blob:", e);
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

    // Delete flow histories and chunks
    try {
      const histories = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
        .collect();

      for (const history of histories) {
        // Delete associated chunks
        const chunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .collect();
        for (const c of chunks) {
          await ctx.db.delete(c._id);
        }
        // Delete external storage if present
        if (history.is_external_storage && history.storage_id) {
          try {
            await ctx.storage.delete(history.storage_id);
          } catch (e) {
            console.warn("Failed to delete history blob:", e);
          }
        }
        // Delete the history doc
        await ctx.db.delete(history._id);
      }
    } catch (e) {
      console.warn("Failed to delete flow histories:", e);
    }

    // Delete node documents (storage + rows)
    try {
      const docs = await ctx.db
        .query("flow_node_documents")
        .withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
        .collect();
      for (const d of docs) {
        try {
          if (d.storage_id) {
            await ctx.storage.delete(d.storage_id);
          }
        } catch {}
        await ctx.db.delete(d._id);
      }
    } catch (e) {
      console.warn("Failed to delete flow node documents:", e);
    }

    // Delete ops log sidecar (if used)
    try {
      const ops = await ctx.db
        .query("flow_ops")
        .withIndex("by_flow_and_version", (q) => q.eq("flow_id", args.flow_id))
        .collect();
      for (const op of ops) {
        await ctx.db.delete(op._id);
      }
    } catch (e) {
      console.warn("Failed to delete flow ops:", e);
    }

    // Delete snapshots (if used)
    try {
      const snaps = await ctx.db
        .query("flow_snapshots")
        .withIndex("by_flow_id", (q) => q.eq("flow_id", args.flow_id))
        .collect();
      for (const s of snaps) {
        await ctx.db.delete(s._id);
      }
    } catch (e) {
      console.warn("Failed to delete flow snapshots:", e);
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
    shared_by_user_id: v.id("users"),
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
    user_id: v.id("users"),
    permission_type: v.union(
      v.literal("view"),
      v.literal("edit"),
      v.literal("admin")
    ),
    granted_by_user_id: v.id("users"),
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
    requesting_user_id: v.id("users"),
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
    responded_by_user_id: v.id("users"),
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
    user_id: v.id("users"),
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
    user_id: v.id("users"),
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
    user_id: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const limit = args.limit || 24;

      // Get all public flows first with proper error handling
      const publicFlows = await ctx.db
        .query("flows")
        .withIndex("by_is_private", (q) => q.eq("is_private", false))
        .order("desc")
        .take(limit * 2);

      // Don't filter out user's own flows - show all public flows including user's own
      // This allows users to see their own public flows in the explore page

      const flowsWithUpvotes = await Promise.all(
        publicFlows.slice(0, limit).map(async (flow) => {
          try {
            // Get upvote count with error handling
            const upvotes = await ctx.db
              .query("flow_upvotes")
              .withIndex("by_flow_id", (q) =>
                q.eq("flow_id", flow._id as Id<"flows">)
              )
              .collect();

            // Check if current user has upvoted with error handling
            let hasUpvoted = false;
            if (args.user_id) {
              try {
                const userUpvote = await ctx.db
                  .query("flow_upvotes")
                  .withIndex("by_flow_and_user", (q) =>
                    q
                      .eq("flow_id", flow._id as Id<"flows">)
                      .eq("user_id", args.user_id as Id<"users">)
                  )
                  .first();
                hasUpvoted = !!userUpvote;
              } catch (upvoteError) {
                console.warn("Error checking user upvote:", upvoteError);
                hasUpvoted = false;
              }
            }

            // Get creator information with error handling
            let creator = null;
            try {
              const creatorDoc = (await ctx.db.get(
                flow.user_id as Id<"users">
              )) as UserDocument | null;
              creator = creatorDoc?.name
                ? {
                    id: creatorDoc._id,
                    name: creatorDoc.name,
                    email: creatorDoc.email,
                  }
                : null;
            } catch (creatorError) {
              console.warn("Error getting creator info:", creatorError);
              creator = null;
            }

            return {
              _id: flow._id,
              name: flow.name,
              description: flow.description,
              icon: flow.icon,
              is_private: flow.is_private,
              user_id: flow.user_id,
              created_at: (flow as any).created_at,
              updated_at: (flow as any).updated_at,
              canvas_updated_at: (flow as any).canvas_updated_at,
              upvoteCount: upvotes.length,
              hasUpvoted,
              creator,
            };
          } catch (flowError) {
            console.warn("Error processing flow:", flowError);
            // Return a basic flow object if there's an error
            return {
              _id: flow._id,
              name: flow.name,
              description: flow.description,
              icon: flow.icon,
              is_private: flow.is_private,
              user_id: flow.user_id,
              created_at: (flow as any).created_at,
              updated_at: (flow as any).updated_at,
              canvas_updated_at: (flow as any).canvas_updated_at,
              upvoteCount: 0,
              hasUpvoted: false,
              creator: null,
            };
          }
        })
      );

      return flowsWithUpvotes;
    } catch (error) {
      console.error("Error in getPublicFlowsWithUpvotes:", error);
      return [];
    }
  },
});

/**
 * Debug function to check public flows (development only)
 */
export const debugPublicFlows = query({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all flows with proper error handling
      const allFlows = await ctx.db.query("flows").collect();

      // Safely filter flows with proper type checking
      const publicFlows = allFlows.filter((flow) => {
        return flow && typeof flow.is_private === "boolean" && !flow.is_private;
      });

      const privateFlows = allFlows.filter((flow) => {
        return flow && typeof flow.is_private === "boolean" && flow.is_private;
      });

      return {
        totalFlows: allFlows.length,
        publicFlows: publicFlows.length,
        privateFlows: privateFlows.length,
        publicFlowDetails: publicFlows.map((flow) => ({
          id: flow._id,
          name: flow.name || "Unnamed Flow",
          is_private: flow.is_private,
          user_id: flow.user_id,
          created_at: flow.created_at,
        })),
        error: null,
      };
    } catch (error) {
      console.error("Error in debugPublicFlows:", error);
      return {
        totalFlows: 0,
        publicFlows: 0,
        privateFlows: 0,
        publicFlowDetails: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  },
});

/**
 * Check starter template status for a user (development only)
 */
export const checkStarterTemplateStatus = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    try {
      const userFlows = await ctx.db
        .query("flows")
        .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
        .collect();

      const starterTemplateNames = [
        "🚀 Welcome & AI Introduction",
        "📧 Email Automation Starter",
        "📊 Data Processing Basics",
      ];

      const starterTemplates = userFlows.filter((flow) =>
        starterTemplateNames.includes(flow.name)
      );

      return {
        hasStarterTemplates: starterTemplates.length > 0,
        totalFlows: userFlows.length,
        starterTemplateCount: starterTemplates.length,
        starterTemplates: starterTemplates.map((flow) => ({
          id: flow._id,
          name: flow.name,
          description: flow.description,
          icon: flow.icon,
          nodeCount: Array.isArray(flow.nodes) ? flow.nodes.length : 0,
          edgeCount: Array.isArray(flow.edges) ? flow.edges.length : 0,
          created_at: flow.created_at,
        })),
        missingTemplates: starterTemplateNames.filter(
          (name) => !starterTemplates.some((t) => t.name === name)
        ),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        hasStarterTemplates: false,
        totalFlows: 0,
        starterTemplateCount: 0,
        starterTemplates: [],
        missingTemplates: [],
      };
    }
  },
});

/**
 * Debug user ID and table validation issues (development only)
 */
export const debugUserValidation = query({
  args: { user_id: v.string() }, // Accept string to avoid validation errors
  handler: async (ctx, args) => {
    try {
      // Check if user exists in users table
      const userFromUsers = await ctx.db.get(args.user_id as Id<"users">);

      // Since we unified to users table only
      const userFromAuthUsers = null;

      // Try to get flows with manual query
      const flows = await ctx.db.query("flows").collect();
      const userFlows = flows.filter((f) => f.user_id === args.user_id);

      return {
        providedUserId: args.user_id,
        userExistsInUsers: !!userFromUsers,
        userExistsInAuthUsers: !!userFromAuthUsers,
        userFromUsers: userFromUsers
          ? { id: userFromUsers._id, email: userFromUsers.email }
          : null,
        userFromAuthUsers: null, // Unified schema - no longer using separate auth_users table
        totalFlows: flows.length,
        userFlowsCount: userFlows.length,
        userFlows: userFlows.map((f) => ({
          id: f._id,
          name: f.name,
          user_id: f.user_id,
        })),
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        providedUserId: args.user_id,
      };
    }
  },
});

/**
 * Inspect problematic flow record and suggest migration path (development only)
 */
export const debugProblematicFlow = query({
  args: { flow_id: v.string() }, // Accept string to avoid validation errors
  handler: async (ctx, args) => {
    try {
      // Get the problematic flow
      const flow = await ctx.db.get(args.flow_id as Id<"flows">);

      if (!flow) {
        return { error: "Flow not found", flow_id: args.flow_id };
      }

      // Check if the user_id exists in users table
      const authUser = await ctx.db.get(flow.user_id as Id<"users">);

      // Look for corresponding user in users table
      let correspondingUser = null;
      if (authUser) {
        // Try to find by cross-reference
        // In unified schema, the authUser IS the user
        correspondingUser = authUser;
      }

      return {
        flow: {
          id: flow._id,
          name: flow.name,
          user_id: flow.user_id,
          created_at: flow.created_at,
        },
        authUser: authUser
          ? {
              id: authUser._id,
              email: authUser.email,
              name: authUser.name,
            }
          : null,
        correspondingUser: correspondingUser
          ? {
              id: correspondingUser._id,
              email: correspondingUser.email,
              name: correspondingUser.name,
            }
          : null,
        migrationPath: correspondingUser
          ? `Update flow ${flow._id} user_id from ${flow.user_id} to ${correspondingUser._id}`
          : "No corresponding user found in users table",
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Unknown error",
        flow_id: args.flow_id,
      };
    }
  },
});

/**
 * Simple test function to get public flows without upvotes (development only)
 */
export const getPublicFlowsSimple = query({
  args: {},
  handler: async (ctx) => {
    try {
      const publicFlows = await ctx.db
        .query("flows")
        .withIndex("by_is_private", (q) => q.eq("is_private", false))
        .order("desc")
        .take(50);

      // Don't filter out user's own flows - show all public flows including user's own

      // Add creator information with error handling
      const flowsWithCreators = await Promise.all(
        publicFlows.map(async (flow) => {
          try {
            const creator = (await ctx.db.get(
              flow.user_id as Id<"users">
            )) as UserDocument | null;
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
          } catch (creatorError) {
            console.warn(
              "Error getting creator info for flow:",
              flow._id,
              creatorError
            );
            return {
              ...flow,
              creator: null,
            };
          }
        })
      );

      return flowsWithCreators;
    } catch (error) {
      console.error("Error in getPublicFlowsSimple:", error);
      return [];
    }
  },
});

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Migration function to fix existing flows with auth_users IDs, basically converting old references to new schema
 */
export const migrateFlowUserIds = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      // Get all flows
      const allFlows = await ctx.db.query("flows").collect();

      // Get all users
      const users = await ctx.db.query("users").collect();

      // Create mapping from auth_users ID to users ID using cross-references
      const authToUserMap = new Map<string, string>();

      // Since we unified to users table, all flows should already use correct user IDs
      // No mapping needed in unified schema

      // Since we unified to a single users table, no additional mapping needed

      let migratedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each flow
      for (const flow of allFlows) {
        try {
          // Check if this flow's user_id looks like it's from auth_users table
          // If we can find a mapping, update it
          const newUserId = authToUserMap.get(flow.user_id);

          if (newUserId && newUserId !== flow.user_id) {
            await ctx.db.patch(flow._id, {
              user_id: newUserId as Id<"users">,
              updated_at: new Date().toISOString(),
            });

            migratedCount++;
          }
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to migrate flow ${flow._id}: ${error instanceof Error ? error.message : "Unknown error"}`;
          errors.push(errorMsg);
          console.error(errorMsg);
        }
      }

      return {
        success: true,
        totalFlows: allFlows.length,
        migratedCount,
        errorCount,
        errors,
        mappingStats: {
          totalUsers: users.length,
          mappingsFound: authToUserMap.size,
        },
      };
    } catch (error) {
      console.error("Migration failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        totalFlows: 0,
        migratedCount: 0,
        errorCount: 0,
        errors: [],
      };
    }
  },
});

// ============================================================================
// STARTER TEMPLATES FUNCTIONS
// ============================================================================

/**
 * Get starter templates for existing users (if they don't have them)
 */
export const getStarterTemplatesForUser = mutation({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user already has starter templates by querying directly
    const userFlows = await ctx.db
      .query("flows")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Check if any flows match our starter template names
    const starterTemplateNames = [
      "🚀 Welcome & AI Introduction",
      "📧 Email Automation Starter",
      "📊 Data Processing Basics",
    ];
    const hasTemplates = userFlows.some((flow) =>
      starterTemplateNames.includes(flow.name)
    );

    if (hasTemplates) {
      return {
        success: false,
        message: "User already has starter templates",
        existingFlowCount: userFlows.length,
      };
    }

    // Create starter templates directly in this mutation
    const now = new Date().toISOString();
    const templateIds: Id<"flows">[] = [];

    // Import the template definitions from starterTemplates file, basically using the properly configured templates
    // Note: We need to recreate the templates here since we can't call another mutation from within a mutation

    // Template node positioning constants, basically layout spacing
    const NODE_SPACING_X = 300;
    const NODE_SPACING_Y = 200;
    const START_X = 100;
    const START_Y = 100;

    // Welcome Template with proper nodes and edges
    const WELCOME_TEMPLATE_NODES = [
      {
        id: "welcome-text",
        type: "createText",
        position: { x: START_X, y: START_Y },
        data: {
          label: "Welcome Message",
          description: "Create your first text content",
          outputs: {
            text: "Welcome to Agenitix! This is your first workflow. You can edit this text and connect it to other nodes.",
          },
          isExpanded: false,
          isEnabled: true,
          isActive: true,
        },
      },
      {
        id: "ai-assistant",
        type: "aiAgent",
        position: { x: START_X + NODE_SPACING_X, y: START_Y },
        data: {
          label: "AI Assistant",
          description: "Get help from AI assistant",
          inputs: { prompt: "" },
          outputs: { response: "" },
          isExpanded: false,
          isEnabled: true,
          isActive: false,
        },
      },
      {
        id: "view-result",
        type: "viewText",
        position: { x: START_X + NODE_SPACING_X * 2, y: START_Y },
        data: {
          label: "View AI Response",
          description: "Display the AI assistant's response",
          inputs: { text: "" },
          isExpanded: false,
          isEnabled: true,
          isActive: false,
        },
      },
    ];

    const WELCOME_TEMPLATE_EDGES = [
      {
        id: "welcome-to-ai",
        source: "welcome-text",
        target: "ai-assistant",
        sourceHandle: "text",
        targetHandle: "prompt",
        type: "default",
      },
      {
        id: "ai-to-view",
        source: "ai-assistant",
        target: "view-result",
        sourceHandle: "response",
        targetHandle: "text",
        type: "default",
      },
    ];

    // Full starter templates with actual node/edge content
    const STARTER_TEMPLATES = [
      {
        name: "🚀 Welcome & AI Introduction",
        description: "Learn the basics with text creation and AI interaction",
        icon: "rocket",
        nodes: WELCOME_TEMPLATE_NODES,
        edges: WELCOME_TEMPLATE_EDGES,
      },
      {
        name: "📧 Email Automation Starter",
        description: "Set up your first email automation workflow",
        icon: "mail",
        nodes: [], // Simplified for now - can be expanded later
        edges: [],
      },
      {
        name: "📊 Data Processing Basics",
        description: "Learn to create, process, and store data",
        icon: "database",
        nodes: [], // Simplified for now - can be expanded later
        edges: [],
      },
    ];

    // Create each starter template for the user
    for (const template of STARTER_TEMPLATES) {
      try {
        const flowId = await ctx.db.insert("flows", {
          name: template.name,
          description: template.description,
          icon: template.icon,
          is_private: true, // Templates are private by default
          user_id: args.user_id,
          nodes: template.nodes,
          edges: template.edges,
          canvas_updated_at: now,
          created_at: now,
          updated_at: now,
        });

        templateIds.push(flowId);
      } catch (error) {
        console.error(`Failed to create template "${template.name}":`, error);
        // Continue creating other templates even if one fails
      }
    }

    return {
      success: true,
      message: `Successfully created ${templateIds.length} starter templates`,
      templateCount: templateIds.length,
      templateIds,
    };
  },
});

/**
 * Check if user has starter templates (query version for UI)
 */
export const checkUserHasStarterTemplates = query({
  args: {
    user_id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userFlows = await ctx.db
      .query("flows")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .collect();

    // Check if any flows match our starter template names
    const starterTemplateNames = [
      "🚀 Welcome & AI Introduction",
      "📧 Email Automation Starter",
      "📊 Data Processing Basics",
    ];

    const hasTemplates = userFlows.some((flow) =>
      starterTemplateNames.includes(flow.name)
    );

    const starterTemplates = userFlows.filter((flow) =>
      starterTemplateNames.includes(flow.name)
    );

    return {
      hasTemplates,
      totalFlowCount: userFlows.length,
      starterTemplateCount: starterTemplates.length,
      starterTemplates: starterTemplates.map((flow) => ({
        id: flow._id,
        name: flow.name,
        description: flow.description,
        icon: flow.icon,
        created_at: flow.created_at,
      })),
    };
  },
});
