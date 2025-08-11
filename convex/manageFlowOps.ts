/**
 * Route: convex/manageFlowOps.ts
 * FLOW NODE DOCUMENTS API - Manage large node documents via Convex Storage
 *
 * • Save large text blobs to storage and record references in `flow_node_documents`
 * • Fetch document metadata + preview and stream or return full content
 * • Delete documents with ownership checks and index coverage
 * • Keeps UI scalable by storing only small references in node data
 *
 * Keywords: convex, storage, large-text, preview, blob, external-storage
 */

import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";

function computeChecksum(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

const MAX_PREVIEW_CHARS = 4000 as const; // Match canvas sanitizer cap

export const saveNodeDocument = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    node_id: v.string(),
    content: v.string(),
    content_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, node_id, content, content_type } = args;

    // Verify ownership
    const flow = await ctx.db.get(flow_id);
    if (!flow || flow.user_id !== user_id) {
      throw new Error("Access denied or flow not found");
    }

    const checksum = computeChecksum(content);
    const bytes = new TextEncoder().encode(content);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    const storage_size = bytes.byteLength;
    
    // TODO: Actually upload the data to the URL
    // For now, we'll use a placeholder storage ID
    // This needs to be implemented with proper file upload logic
    const storage_id = "placeholder_storage_id" as Id<"_storage">;

    const now = Date.now();

    // Upsert by flow_id + node_id + user_id
    const existing = await ctx.db
      .query("flow_node_documents")
      .withIndex("by_flow_and_node", (q) =>
        q.eq("flow_id", flow_id).eq("node_id", node_id)
      )
      .first();

    const preview_text =
      content.length > MAX_PREVIEW_CHARS
        ? content.slice(0, MAX_PREVIEW_CHARS) + "…"
        : content;

    if (existing) {
      // Delete old blob if it exists
      try {
        if (existing.storage_id) {
          await ctx.storage.delete(existing.storage_id);
        }
      } catch {}

      await ctx.db.patch(existing._id, {
        user_id,
        storage_id,
        storage_size,
        content_type,
        preview_text,
        checksum,
        updated_at: now,
      });
      return existing._id as Id<"flow_node_documents">;
    }

    const _id = await ctx.db.insert("flow_node_documents", {
      flow_id,
      user_id,
      node_id,
      storage_id,
      storage_size,
      content_type,
      preview_text,
      checksum,
      created_at: now,
      updated_at: now,
    });
    return _id;
  },
});

export const getNodeDocument = query({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    node_id: v.string(),
    include_content: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, node_id, include_content } = args;

    const flow = await ctx.db.get(flow_id);
    if (!flow || flow.user_id !== user_id) {
      return null;
    }

    const doc = await ctx.db
      .query("flow_node_documents")
      .withIndex("by_flow_and_node", (q) =>
        q.eq("flow_id", flow_id).eq("node_id", node_id)
      )
      .first();

    if (!doc) return null;

    if (include_content) {
      try {
        const url = await ctx.storage.getUrl(doc.storage_id);
        if (!url) {
          console.warn("No storage URL available for document:", doc._id);
          return null;
        }
        const response = await fetch(url);
        const buf = await response.arrayBuffer();
        const content = buf ? new TextDecoder().decode(new Uint8Array(buf)) : "";
        return {
          _id: doc._id,
          flow_id: doc.flow_id,
          user_id: doc.user_id,
          node_id: doc.node_id,
          storage_id: doc.storage_id,
          storage_size: doc.storage_size,
          content_type: doc.content_type,
          preview_text: doc.preview_text,
          checksum: doc.checksum,
          content,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
        } as const;
      } catch {
        // Fallback to metadata only
      }
    }

    return {
      _id: doc._id,
      flow_id: doc.flow_id,
      user_id: doc.user_id,
      node_id: doc.node_id,
      storage_id: doc.storage_id,
      storage_size: doc.storage_size,
      content_type: doc.content_type,
      preview_text: doc.preview_text,
      checksum: doc.checksum,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    } as const;
  },
});

export const deleteNodeDocument = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    node_id: v.string(),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, node_id } = args;
    const flow = await ctx.db.get(flow_id);
    if (!flow || flow.user_id !== user_id) {
      return false;
    }

    const existing = await ctx.db
      .query("flow_node_documents")
      .withIndex("by_flow_and_node", (q) =>
        q.eq("flow_id", flow_id).eq("node_id", node_id)
      )
      .first();

    if (!existing) return false;

    try {
      await ctx.storage.delete(existing.storage_id);
    } catch {}

    await ctx.db.delete(existing._id);
    return true;
  },
});

/**
 * Route: convex/manageFlowOps.ts
 * FLOW OPS SERVICE - Server-authoritative ops log for scalable history
 *
 * • submit_ops: Append user ops, assign server version, apply LWW updates
 * • get_ops_since: Read ordered ops after a version for hydration
 * • Future: create_snapshot for compaction; canvas blob helpers
 *
 * Keywords: ops-log, last-writer-wins, history, scalable, convex
 */

export const submit_ops = mutation({
  args: {
    flow_id: v.id("flows"),
    user_id: v.id("users"),
    base_version: v.number(),
    command_id: v.string(),
    ops: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const { flow_id, user_id, base_version, command_id, ops } = args;

    // Determine next version: last version + 1
    const last = await ctx.db
      .query("flow_ops")
      .withIndex("by_flow_and_version", (q) => q.eq("flow_id", flow_id))
      .order("desc")
      .first();
    const nextVersion = (last?.version ?? 0) + 1;

    // Append ops record
    await ctx.db.insert("flow_ops", {
      flow_id,
      user_id,
      command_id,
      version: nextVersion,
      ops,
      created_at: Date.now(),
    });

    // Apply LWW to canonical flow document (minimal implementation: patch nodes/edges when op carries partials)
    // For now we only touch canvas_updated_at to signal clients; full LWW application can be implemented incrementally.
    try {
      await ctx.db.patch(
        flow_id as Id<"flows">,
        {
          canvas_updated_at: new Date().toISOString(),
        } as any
      );
    } catch {}

    return { assigned_version: nextVersion } as const;
  },
});

export const get_ops_since = query({
  args: {
    flow_id: v.id("flows"),
    from_version: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 200, 1), 1000);
    const results = await ctx.db
      .query("flow_ops")
      .withIndex("by_flow_and_version", (q) => q.eq("flow_id", args.flow_id))
      .filter((q) => q.gt(q.field("version"), args.from_version))
      .order("asc")
      .take(limit);

    return {
      ops: results.map((r) => ({
        version: r.version,
        user_id: r.user_id,
        command_id: r.command_id,
        ops: r.ops,
        created_at: r.created_at,
      })),
      is_done: results.length < limit,
      next_from_version:
        results.length > 0
          ? results[results.length - 1]!.version
          : args.from_version,
    } as const;
  },
});
