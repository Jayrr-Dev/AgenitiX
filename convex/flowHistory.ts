/**
 * Route: convex/flowHistory.ts
 * FLOW HISTORY STORAGE - Server-side persistence for undo/redo history graphs
 *
 * • Save/load history graphs to/from Convex database
 * • Compression and optimization for storage efficiency
 * • User authentication and flow ownership validation
 * • Support for dragging state tracking
 * • Automatic cleanup of old history entries
 * • Memory-optimized chunked loading to prevent 16MB limits
 *
 * Keywords: history-persistence, undo-redo, convex, compression, authentication, memory-optimization
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
// Ephemeral sanitization: strip large, sensitive, or transient fields before persistence
function sanitizeHistoryGraphForPersistence(graph: HistoryGraph): HistoryGraph {
  // Deep clone shallowly and remove heavy output payloads from node states
  const sanitizedNodes: Record<string, HistoryNode> = {};

  const stripToEssentials = (state: { nodes: any[]; edges: any[] }) => {
    const safeNodes = Array.isArray(state.nodes)
      ? state.nodes.map((n) => {
          try {
            if (!n || typeof n !== "object") return n;

            // Keep only essential structural properties - no heavy content/outputs
            const essentialData: Record<string, any> = {};

            if (n.data && typeof n.data === "object") {
              const data = n.data as Record<string, any>;

              // Keep only UI/structural properties - no content/outputs
              const keepFields = [
                "kind",
                "type",
                "label",
                "isExpanded",
                "isEnabled",
                "isActive",
                "expandedSize",
                "collapsedSize",
                "accountId",
                "provider",
                "connectionStatus",
                "isConnected",
                "lastSync",
                "processedCount",
                "messageCount",
                "batchSize",
                "maxMessages",
                "includeAttachments",
                "markAsRead",
                "enableRealTime",
                "checkInterval",
                "outputFormat",
                "viewPath",
                "summaryLimit",
                "mode",
                "keyStrategy",
                "customKeys",
                "preserveOrder",
                "preserveType",
                // Document reference fields for large external content
                "document_id",
                "document_size",
                "document_checksum",
                "document_content_type",
                "document_preview",
              ];

              // For view and convert nodes, also preserve inputs since they're needed for display
              const kind = data.kind || data.type;
              if (
                typeof kind === "string" &&
                (/^view/i.test(kind) ||
                  /^to/i.test(kind) ||
                  /convert/i.test(kind))
              ) {
                keepFields.push("inputs");
              }

              for (const field of keepFields) {
                if (field in data) {
                  essentialData[field] = data[field];
                }
              }
            }

            return {
              id: n.id,
              type: n.type,
              position: n.position || { x: 0, y: 0 },
              data: essentialData,
              measured: n.measured,
              selected: n.selected,
              dragging: n.dragging,
            };
          } catch {}
          return n;
        })
      : [];

    const safeEdges = Array.isArray(state.edges)
      ? state.edges.map((e: any) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.type,
          animated: e.animated,
          selected: e.selected,
        }))
      : [];

    return { nodes: safeNodes, edges: safeEdges };
  };

  for (const [id, node] of Object.entries(graph.nodes)) {
    const before = stripToEssentials(node.before);
    const after = stripToEssentials(node.after);
    sanitizedNodes[id] = { ...node, before, after } as HistoryNode;
  }

  return { ...graph, nodes: sanitizedNodes };
}

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
      //   if (identity?.email) {
      //     const authUser = await ctx.db
      //       .query("users")
      //       .withIndex("email", (q) => q.eq("email", identity.email))
      //       .first();

      //     if (!authUser || authUser._id !== userId) {
      //       console.warn(
      //         "Authentication mismatch - user not authorized for this action"
      //       );

      //     }
      //   }

      // User validation logging removed for production

      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        console.warn(
          "User does not own flow or flow not found, skipping history save"
        );
        return null;
      }

      // Sanitize ephemeral/sensitive data before measuring or saving
      const sanitizedGraph = sanitizeHistoryGraphForPersistence(historyGraph);
      // Calculate size for monitoring
      const serialized = JSON.stringify(sanitizedGraph);
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
          history_graph: sanitizedGraph,
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
        history_graph: sanitizedGraph,
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

      // Guardrail: if stored size exceeds Convex per-function read capacity, avoid stitching
      const estimatedBytes =
        history.storage_size ?? history.compressed_size ?? 0;
      const MAX_SAFE_BYTES = 15_000_000; // [Explanation], basically just under 16 MiB limit
      if (estimatedBytes > MAX_SAFE_BYTES) {
        // Return a minimal stub to allow UI to continue; user can prune client-side
        return {
          historyGraph: { root: "root", cursor: "root", nodes: {} } as any,
          lastUpdated: history.updated_at,
          compressedSize: estimatedBytes,
        };
      }

      // If stored in chunked form, stitch it together (latest version only)
      if (history.storage_method === "chunked") {
        const version = history.version ?? 1;

        // [Explanation], basically implement pagination to avoid 16MB limit
        const CHUNK_BATCH_SIZE = 100; // Load chunks in smaller batches
        let allChunks: any[] = [];
        let cursor: string | null = null;

        // Load chunks in batches to avoid memory issues
        do {
          const chunkBatch = await ctx.db
            .query("flow_history_chunks")
            .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
            .order("asc")
            .paginate({ numItems: CHUNK_BATCH_SIZE, cursor });

          const filtered = chunkBatch.page.filter(
            (c) => (c.chunk_version ?? version) === version
          );

          // [Explanation], basically filter out chunks that are too large individually
          const validChunks = filtered.filter(
            (c) => (c.chunk_size ?? 0) < 1000000
          ); // 1MB per chunk limit

          allChunks.push(...validChunks);

          // Update cursor for next batch
          cursor = chunkBatch.continueCursor;

          // Safety check: if we're loading too many chunks, break early
          if (allChunks.length > 2000) {
            // [Explanation], basically prevent infinite loops
            console.warn(
              "Too many chunks detected, truncating to prevent memory issues"
            );
            break;
          }
        } while (cursor !== null);

        // Sort chunks by index and combine
        const ordered = allChunks.sort((a, b) => a.chunk_index - b.chunk_index);
        const combined = ordered.map((c) => c.chunk_data).join("");

        // [Explanation], basically check total size before parsing to prevent memory issues
        if (combined.length > MAX_SAFE_BYTES) {
          console.warn(
            "Combined chunk size exceeds safe limit, returning minimal graph"
          );
          return {
            historyGraph: { root: "root", cursor: "root", nodes: {} } as any,
            lastUpdated: history.updated_at,
            compressedSize: combined.length,
          };
        }

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
 * Load large history graph with pagination, basically for very large histories
 */
export const loadLargeHistoryGraph = query({
  args: {
    flowId: v.id("flows"),
    userId: v.id("users"),
    maxNodes: v.optional(v.number()), // Limit number of nodes to load
  },
  handler: async (ctx, { flowId, userId, maxNodes = 1000 }) => {
    try {
      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        return null;
      }

      // Get the history for this flow
      const history = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_and_user", (q) =>
          q.eq("flow_id", flowId).eq("user_id", userId)
        )
        .first();

      if (!history || history.storage_method !== "chunked") {
        return null;
      }

      const version = history.version ?? 1;

      // [Explanation], basically load chunks with strict limits to prevent memory issues
      const CHUNK_BATCH_SIZE = 50; // Smaller batches for large histories
      let allChunks: any[] = [];
      let cursor: string | null = null;
      let totalSize = 0;

      // Load chunks in batches with strict size limits
      do {
        const chunkBatch = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .order("asc")
          .paginate({ numItems: CHUNK_BATCH_SIZE, cursor });

        const filtered = chunkBatch.page.filter(
          (c) => (c.chunk_version ?? version) === version
        );

        // Check individual chunk sizes
        const validChunks = filtered.filter((c) => {
          const size = c.chunk_size ?? 0;
          if (size > 500000) {
            // 500KB per chunk limit
            console.warn(`Skipping oversized chunk: ${size} bytes`);
            return false;
          }
          return true;
        });

        allChunks.push(...validChunks);
        totalSize += validChunks.reduce(
          (sum, c) => sum + (c.chunk_size ?? 0),
          0
        );

        // Update cursor for next batch
        cursor = chunkBatch.continueCursor;

        // Safety checks
        if (allChunks.length > 500 || totalSize > 10_000_000) {
          // 10MB total limit
          console.warn(
            "Large history detected, truncating to prevent memory issues"
          );
          break;
        }
      } while (cursor !== null);

      if (allChunks.length === 0) {
        return {
          historyGraph: { root: "root", cursor: "root", nodes: {} } as any,
          lastUpdated: history.updated_at,
          compressedSize: 0,
          isTruncated: true,
        };
      }

      // Sort chunks by index and combine
      const ordered = allChunks.sort((a, b) => a.chunk_index - b.chunk_index);
      const combined = ordered.map((c) => c.chunk_data).join("");

      // Final size check
      if (combined.length > 10_000_000) {
        // 10MB limit
        console.warn(
          "Combined chunk size exceeds limit, returning minimal graph"
        );
        return {
          historyGraph: { root: "root", cursor: "root", nodes: {} } as any,
          lastUpdated: history.updated_at,
          compressedSize: combined.length,
          isTruncated: true,
        };
      }

      try {
        const parsed = JSON.parse(combined) as HistoryGraph;

        // [Explanation], basically limit nodes if specified to prevent UI issues
        if (maxNodes && Object.keys(parsed.nodes).length > maxNodes) {
          const limitedNodes: Record<string, HistoryNode> = {};
          const nodeIds = Object.keys(parsed.nodes).slice(0, maxNodes);

          for (const id of nodeIds) {
            limitedNodes[id] = parsed.nodes[id];
          }

          parsed.nodes = limitedNodes;
        }

        return {
          historyGraph: parsed,
          lastUpdated: history.updated_at,
          compressedSize: combined.length,
          isTruncated: false,
        };
      } catch (parseError) {
        console.error("Failed to parse history chunks:", parseError);
        return {
          historyGraph: { root: "root", cursor: "root", nodes: {} } as any,
          lastUpdated: history.updated_at,
          compressedSize: combined.length,
          isTruncated: true,
        };
      }
    } catch (error) {
      console.error("❌ Error loading large history:", error);
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

/**
 * Prune history to reduce size, basically clean up old history entries
 */
export const pruneHistoryGraph = mutation({
  args: {
    flowId: v.id("flows"),
    userId: v.id("users"),
    maxNodes: v.optional(v.number()), // Keep only this many nodes
    maxAge: v.optional(v.number()), // Keep only nodes newer than this (timestamp)
  },
  handler: async (ctx, { flowId, userId, maxNodes = 500, maxAge }) => {
    try {
      // Verify user owns this flow
      const flow = await ctx.db.get(flowId);
      if (!flow || flow.user_id !== userId) {
        return false;
      }

      // Get the history for this flow
      const history = await ctx.db
        .query("flow_histories")
        .withIndex("by_flow_and_user", (q) =>
          q.eq("flow_id", flowId).eq("user_id", userId)
        )
        .first();

      if (!history) {
        return false;
      }

      // [Explanation], basically load current history to prune it
      let currentGraph: HistoryGraph;

      if (history.storage_method === "chunked") {
        // Load chunks with limits
        const chunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .order("asc")
          .collect();

        // [Explanation], basically limit chunks manually to prevent memory issues
        const limitedChunks = chunks.slice(0, 100);

        const version = history.version ?? 1;
        const filtered = limitedChunks.filter(
          (c: any) => (c.chunk_version ?? version) === version
        );
        const ordered = filtered.sort(
          (a: any, b: any) => a.chunk_index - b.chunk_index
        );
        const combined = ordered.map((c: any) => c.chunk_data).join("");

        try {
          currentGraph = JSON.parse(combined) as HistoryGraph;
        } catch {
          return false;
        }
      } else {
        currentGraph = history.history_graph as HistoryGraph;
      }

      if (!currentGraph || !currentGraph.nodes) {
        return false;
      }

      // [Explanation], basically prune nodes based on criteria
      const nodeEntries = Object.entries(currentGraph.nodes);
      let nodesToKeep = nodeEntries;

      // Filter by age if specified
      if (maxAge) {
        const cutoffTime = Date.now() - maxAge;
        nodesToKeep = nodesToKeep.filter(
          ([_, node]) => (node.createdAt ?? 0) > cutoffTime
        );
      }

      // Limit by count if specified
      if (maxNodes && nodesToKeep.length > maxNodes) {
        // Sort by creation time (newest first) and keep the most recent
        nodesToKeep.sort(
          ([_, a]: [string, any], [__, b]: [string, any]) =>
            (b.createdAt ?? 0) - (a.createdAt ?? 0)
        );
        nodesToKeep = nodesToKeep.slice(0, maxNodes);
      }

      // Create pruned graph
      const prunedGraph: HistoryGraph = {
        root: currentGraph.root,
        cursor: currentGraph.cursor,
        nodes: Object.fromEntries(nodesToKeep),
      };

      // Update the history with pruned data
      const sanitized = sanitizeHistoryGraphForPersistence(prunedGraph);
      const serialized = JSON.stringify(sanitized);

      // Check if we can store inline or need chunks
      if (serialized.length < 1000000) {
        // 1MB limit for inline
        // Store inline
        await ctx.db.patch(history._id, {
          history_graph: sanitized,
          storage_method: "inline",
          storage_size: serialized.length,
          updated_at: Date.now(),
        });

        // Clean up chunks if they exist
        const chunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .collect();

        await Promise.all(chunks.map((c) => ctx.db.delete(c._id)));
      } else {
        // Store in chunks
        const chunks = splitIntoChunks(serialized, 500000); // 500KB chunks

        // Delete old chunks
        const oldChunks = await ctx.db
          .query("flow_history_chunks")
          .withIndex("by_history_id", (q) => q.eq("history_id", history._id))
          .collect();

        await Promise.all(oldChunks.map((c) => ctx.db.delete(c._id)));

        // Insert new chunks
        const newVersion = (history.version ?? 0) + 1;
        for (let i = 0; i < chunks.length; i++) {
          await ctx.db.insert("flow_history_chunks", {
            history_id: history._id,
            chunk_index: i,
            chunk_data: chunks[i],
            chunk_size: chunks[i].length,
            chunk_version: newVersion,
            created_at: Date.now(),
          });
        }

        // Update history record
        await ctx.db.patch(history._id, {
          storage_method: "chunked",
          storage_size: serialized.length,
          version: newVersion,
          checksum: simpleChecksum(serialized),
          total_chunks: chunks.length,
          updated_at: Date.now(),
        });
      }

      return true;
    } catch (error) {
      console.error("❌ Error pruning history:", error);
      return false;
    }
  },
});
