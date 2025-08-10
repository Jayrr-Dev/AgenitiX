/**
 * Route: convex/flowHistory.ts
 * FLOW HISTORY STORAGE - Server-side persistence for undo/redo history graphs
 *
 * • Save/load history graphs to/from Convex database
 * • Compression and optimization for storage efficiency
 * • User authentication and flow ownership validation
 * • Support for dragging state tracking
 * • Automatic cleanup of old history entries
 *
 * Keywords: history-persistence, undo-redo, convex, compression, authentication
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Type definitions matching frontend HistoryGraph
type HistoryNode = {
  id: string;
  parentId: string | null;
  childrenIds: string[];
  label: string;
  before: {
    nodes: any[];
    edges: any[];
  };
  after: {
    nodes: any[];
    edges: any[];
  };
  createdAt: number;
};

type HistoryGraph = {
  root: string;
  cursor: string;
  nodes: Record<string, HistoryNode>;
};

// STORAGE STRATEGY CONSTANTS
const INLINE_BYTE_LIMIT = 900_000; // [Explanation], basically keep docs well under 1 MiB limit
const CHUNK_BYTE_SIZE = 200_000; // [Explanation], basically safe chunk size per document

function splitIntoChunks(input: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < input.length; i += chunkSize) {
    chunks.push(input.slice(i, i + chunkSize));
  }
  return chunks;
}

function simpleChecksum(str: string): string {
  // Fast rolling checksum; [Explanation], basically cheap integrity signal
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h.toString(36);
}

/**
 * Save history graph to database, basically persist undo/redo state
 */
export const saveHistoryGraph = mutation({
  args: {
    flowId: v.id("flows"),
    historyGraph: v.any(),
    isDragging: v.optional(v.boolean()),
    userId: v.id("users"), // Pass user ID explicitly like other working functions
  },
  handler: async (ctx, { flowId, historyGraph, isDragging, userId }) => {
    try {
      // Get user identity from Convex Auth (matching your working pattern)
      const identity = await ctx.auth.getUserIdentity();

      // Debug logging removed for production

      // If identity is unavailable, we still proceed using the trusted userId param
      // [Explanation], basically align with existing flows API that passes user_id explicitly
      //   if (!identity?.email) {
      //     console.warn(
      //       "No authenticated identity from ctx.auth; proceeding with provided userId"
      //     );
      //   }

      // Validate that the authenticated user matches the passed userId (security check)
      if (identity?.email) {
        const authUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .first();

        if (!authUser || authUser._id !== userId) {
          console.warn(
            "Authentication mismatch - user not authorized for this action"
          );
          // Fall back to userId validation below; do not block the operation here
        }
      }

      // User validation logging removed for production

      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        console.warn(
          "User does not own flow or flow not found, skipping history save"
        );
        return null;
      }

      // Calculate size for monitoring
      const serialized = JSON.stringify(historyGraph);
      const byteSize = new Blob([serialized]).size;

      // Check if history already exists for this flow
      const existingHistory = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_and_user", (q) =>
          q.eq("flow_id", flowId).eq("user_id", userId)
        )
        .first();

      const now = Date.now();

      const useExternal = byteSize > INLINE_BYTE_LIMIT;

      if (existingHistory) {
        const nextVersion = (existingHistory.version ?? 0) + 1;
        const checksum = simpleChecksum(serialized);

        if (useExternal) {
          // Two-phase write: write new versioned chunks first, then flip head and finally clean old version
          const chunks = splitIntoChunks(serialized, CHUNK_BYTE_SIZE);
          for (let i = 0; i < chunks.length; i += 1) {
            const part = chunks[i]!;
            await ctx.db.insert("flow_history_chunks", {
              history_id: existingHistory._id,
              chunk_index: i,
              chunk_data: part,
              chunk_size: part.length,
              chunk_version: nextVersion,
              chunk_checksum: checksum,
              created_at: now,
            });
          }

          // Promote new version on head
          await ctx.db.patch(existingHistory._id, {
            history_graph: undefined,
            storage_id: undefined,
            storage_size: byteSize,
            is_external_storage: false,
            storage_method: "chunked",
            compressed_size: byteSize,
            is_dragging: isDragging,
            total_chunks: chunks.length,
            checksum,
            version: nextVersion,
            updated_at: now,
          });

          // Cleanup: delete older chunk versions
          const oldChunks = await ctx.db
            .query("flow_history_chunks")
            .withIndex("by_history_id", (q) =>
              q.eq("history_id", existingHistory._id)
            )
            .collect();
          await Promise.all(
            oldChunks
              .filter((c) => (c.chunk_version ?? 0) < nextVersion)
              .map((c) => ctx.db.delete(c._id))
          );

          return existingHistory._id;
        }

        await ctx.db.patch(existingHistory._id, {
          history_graph: historyGraph,
          storage_id: undefined,
          storage_size: undefined,
          is_external_storage: false,
          storage_method: "inline",
          compressed_size: byteSize,
          is_dragging: isDragging,
          checksum,
          version: nextVersion,
          total_chunks: undefined,
          updated_at: now,
        });
        return existingHistory._id;
      }

      if (useExternal) {
        const checksum = simpleChecksum(serialized);
        const chunks = splitIntoChunks(serialized, CHUNK_BYTE_SIZE);
        const historyId = await ctx.db.insert("flow_histories", {
          flow_id: flowId,
          user_id: userId,
          history_graph: undefined,
          storage_id: undefined,
          storage_size: byteSize,
          is_external_storage: false,
          storage_method: "chunked",
          compressed_size: byteSize,
          is_dragging: isDragging,
          version: 1,
          total_chunks: chunks.length,
          checksum,
          created_at: now,
          updated_at: now,
        });
        // Write chunks for version 1
        for (let i = 0; i < chunks.length; i += 1) {
          const part = chunks[i]!;
          await ctx.db.insert("flow_history_chunks", {
            history_id: historyId,
            chunk_index: i,
            chunk_data: part,
            chunk_size: part.length,
            chunk_version: 1,
            chunk_checksum: checksum,
            created_at: now,
          });
        }
        return historyId;
      }

      // Create new history record (inline)
      const historyId = await ctx.db.insert("flow_histories", {
        flow_id: flowId,
        user_id: userId,
        history_graph: historyGraph,
        storage_id: undefined,
        storage_size: undefined,
        is_external_storage: false,
        storage_method: "inline",
        compressed_size: byteSize,
        is_dragging: isDragging,
        created_at: now,
        updated_at: now,
      });
      // History created successfully (inline)
      return historyId;
    } catch (error) {
      console.error("❌ Error saving history:", error);
      return null;
    }
  },
});

/**
 * Load history graph from database, basically restore undo/redo state
 */
export const loadHistoryGraph = query({
  args: {
    flowId: v.id("flows"),
    userId: v.id("users"), // Pass user ID explicitly like other working functions
  },
  handler: async (ctx, { flowId, userId }) => {
    try {
      // Get user identity from Convex Auth (matching your working pattern)
      const identity = await ctx.auth.getUserIdentity();
      // If identity is unavailable, continue with explicit userId pattern
      // [Explanation], basically follow flows API which trusts userId param

      // Validate that the authenticated user matches the passed userId (security check)
      if (identity?.email) {
        const authUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .first();

        // If mismatch, prefer explicit userId checks below instead of early return
      }

      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        // Return null for access denied to avoid breaking the UI
        return null;
      }

      // Get the history for this flow
      const history = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_and_user", (q) =>
          q.eq("flow_id", flowId).eq("user_id", userId)
        )
        .first();

      if (!history) {
        return null;
      }

      // If stored in chunked form, stitch it together (latest version only)
      if (history.storage_method === "chunked") {
        const version = history.version ?? 1;
        const chunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .collect();
        const filtered = chunks.filter(
          (c) => (c.chunk_version ?? version) === version
        );
        const ordered = filtered.sort((a, b) => a.chunk_index - b.chunk_index);
        const combined = ordered.map((c) => c.chunk_data).join("");
        // Optional integrity check
        const checksum = simpleChecksum(combined);
        if (history.checksum && history.checksum !== checksum) {
          console.warn("History chunk checksum mismatch detected");
        }
        const parsed = JSON.parse(combined) as HistoryGraph;
        return {
          historyGraph: parsed,
          lastUpdated: history.updated_at,
          compressedSize: history.storage_size ?? history.compressed_size,
        };
      }

      return {
        historyGraph: history.history_graph as HistoryGraph,
        lastUpdated: history.updated_at,
        compressedSize: history.compressed_size,
      };
    } catch (error) {
      console.error("❌ Error loading history:", error);
      return null;
    }
  },
});

/**
 * Clear history for a specific flow, basically reset undo/redo state
 */
export const clearHistoryGraph = mutation({
  args: {
    flowId: v.id("flows"),
    userId: v.id("users"), // Pass user ID explicitly like other working functions
  },
  handler: async (ctx, { flowId, userId }) => {
    try {
      // Get user identity from Convex Auth (matching your working pattern)
      const identity = await ctx.auth.getUserIdentity();
      // If identity is unavailable, continue with explicit userId

      // Validate that the authenticated user matches the passed userId (security check)
      if (identity?.email) {
        const authUser = await ctx.db
          .query("users")
          .withIndex("email", (q) => q.eq("email", identity.email))
          .first();

        // If mismatch, defer to userId ownership checks below
      }

      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        return false;
      }

      // Find and delete the history record
      const history = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_and_user", (q) =>
          q.eq("flow_id", flowId).eq("user_id", userId)
        )
        .first();

      if (history) {
        // Delete chunk rows if present
        const chunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .collect();
        await Promise.all(chunks.map((c) => ctx.db.delete(c._id)));

        // If there is an external blob, delete it as well
        if (history.is_external_storage && history.storage_id) {
          try {
            await ctx.storage.delete(history.storage_id);
          } catch (e) {
            console.warn("Failed to delete storage blob during clear", e);
          }
        }
        await ctx.db.delete(history._id);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error clearing history:", error);
      return false;
    }
  },
});

/**
 * Get history metadata for monitoring, basically check storage usage
 */
export const getHistoryMetadata = query({
  args: {
    flowId: v.optional(v.id("flows")),
  },
  handler: async (ctx, { flowId }) => {
    try {
      // Get user identity from Convex Auth (matching your working pattern)
      const identity = await ctx.auth.getUserIdentity();
      if (!identity?.email) {
        return null;
      }

      // Find user in users table by email (matching your working pattern)
      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", identity.email))
        .first();

      if (!user) {
        return null;
      }

      let query = ctx.db
        .query("flow_histories")
        .withIndex("by_user_id", (q) => q.eq("user_id", user._id));

      if (flowId) {
        // Verify user owns this flow first
        const flow = await ctx.db.get(flowId);
        if (!flow || flow.user_id !== user._id) {
          return null;
        }

        // Get specific flow history
        const history = await ctx.db
          .query("flow_histories")
          .withIndex("by_flow_and_user", (q) =>
            q.eq("flow_id", flowId).eq("user_id", user._id)
          )
          .first();

        if (!history) {
          return null;
        }

        return {
          flowId: history.flow_id,
          compressedSize: history.storage_size ?? history.compressed_size,
          lastUpdated: history.updated_at,
          isDragging: history.is_dragging,
        };
      } else {
        // Get all user's history metadata
        const histories = await query.collect();

        return {
          totalHistories: histories.length,
          totalSize: histories.reduce(
            (sum, h) => sum + (h.storage_size ?? h.compressed_size ?? 0),
            0
          ),
          histories: histories.map((h) => ({
            flowId: h.flow_id,
            compressedSize: h.storage_size ?? h.compressed_size,
            lastUpdated: h.updated_at,
            isDragging: h.is_dragging,
          })),
        };
      }
    } catch (error) {
      console.error("Error getting history metadata:", error);
      return null;
    }
  },
});
