/**
 * HISTORY PERSISTENCE HOOK - React hooks for client-side history storage
 *
 * • Convex integration for saving/loading history graphs
 * • Optimistic updates and error handling
 * • Flow ID validation and user authentication
 * • Debounced saves to prevent excessive server calls
 *
 * Keywords: history-hooks, convex-persistence, optimistic-updates, debouncing
 */

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { HistoryGraph } from "./historyGraph";

// Robust client-side sanitizer to ensure ZERO content/outputs reach Convex
function optimizeGraphForStorage(graph: HistoryGraph): HistoryGraph {
  try {
    const sanitizeState = (state: { nodes: any[]; edges: any[] }) => {
      const safeNodes = Array.isArray(state.nodes)
        ? state.nodes.map((n) => {
            try {
              if (!n || typeof n !== "object") return n;

              const essentialData: Record<string, unknown> = {};

              if (n.data && typeof n.data === "object") {
                const data = n.data as Record<string, unknown>;

                // Whitelist only safe structural/UI fields. No content, no outputs
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
                  // Large external doc references (metadata only)
                  "document_id",
                  "document_size",
                  "document_checksum",
                  "document_content_type",
                  "document_preview",
                ];

                // For view/convert nodes, keep inputs for UI rendering
                const kind = (data.kind || data.type) as string | undefined;
                if (
                  kind &&
                  (/^view/i.test(kind) ||
                    /^to/i.test(kind) ||
                    /convert/i.test(kind))
                ) {
                  keepFields.push("inputs");
                }

                for (const field of keepFields) {
                  if (field in data) {
                    (essentialData as any)[field] = (data as any)[field];
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
            } catch {
              // If sanitization fails, fall back to minimal safe node
              return {
                id: n?.id,
                type: n?.type,
                position: n?.position || { x: 0, y: 0 },
                data: {},
              };
            }
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

    const sanitizedNodes: Record<string, any> = {};
    for (const [id, node] of Object.entries(graph.nodes)) {
      const before = sanitizeState(
        (node as any).before ?? { nodes: [], edges: [] }
      );
      const after = sanitizeState(
        (node as any).after ?? { nodes: [], edges: [] }
      );
      sanitizedNodes[id] = { ...(node as any), before, after };
    }

    return { ...graph, nodes: sanitizedNodes } as HistoryGraph;
  } catch {
    // On any unexpected shape, return a minimal safe graph rather than leaking content
    return {
      root: graph.root,
      cursor: graph.cursor,
      nodes: {},
    } as HistoryGraph;
  }
}

// Prune history graph to keep payload small for network argument limits
function pruneGraphForArgumentLimits(
  graph: HistoryGraph,
  maxNodes: number = 400
): HistoryGraph {
  try {
    const entries = Object.entries(graph.nodes) as Array<[string, any]>;
    if (entries.length <= maxNodes) return graph;
    // Sort by createdAt (fallback to 0)
    entries.sort((a, b) => (a[1]?.createdAt ?? 0) - (b[1]?.createdAt ?? 0));
    const kept = entries.slice(-maxNodes);
    const keptIds = new Set(kept.map(([id]) => id));

    // Rebuild nodes map with safe parent/child references
    const nodes = Object.fromEntries(
      kept.map(([id, node]) => [
        id,
        {
          ...node,
          parentId: keptIds.has(node.parentId) ? node.parentId : null,
          childrenIds: Array.isArray(node.childrenIds)
            ? node.childrenIds.filter((cid: string) => keptIds.has(cid))
            : [],
        },
      ])
    );

    // Choose new root and cursor within kept set
    const newRootId = kept[0]?.[0] ?? graph.root;
    const cursor = keptIds.has(graph.cursor)
      ? graph.cursor
      : (kept.at(-1)?.[0] ?? newRootId);

    return { root: newRootId, cursor, nodes } as HistoryGraph;
  } catch {
    return graph;
  }
}

const SAVE_DEBOUNCE_MS = 750; // Debounce saves, basically wait 750ms before saving
const DRAG_DEBOUNCE_MS = 1500; // Longer debounce during drag operations

interface UseHistoryPersistenceOptions {
  flowId?: Id<"flows">;
  userId?: Id<"users">; // Add userId for authentication
  enabled?: boolean;
}

interface UseHistoryPersistenceResult {
  /** Save history graph to server */
  saveHistory: (graph: HistoryGraph, isDragging?: boolean) => void;
  /** Save a local fine-grained diff to IndexedDB ring buffer */
  saveLocalDiff: (diff: HistoryDiff) => Promise<void>;
  /** Load history graph from server */
  loadedHistory: HistoryGraph | null | undefined;
  /** Whether history is currently loading */
  isLoading: boolean;
  /** Whether history save is in progress */
  isSaving: boolean;
  /** Clear history for current flow */
  clearHistory: () => Promise<void>;
  /** Error state */
  error: string | null;
}

export function useHistoryPersistence(
  options: UseHistoryPersistenceOptions = {}
): UseHistoryPersistenceResult {
  const { flowId, userId, enabled = true } = options;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string | null>(null);
  const ringBufferRef = useRef<ReturnType<
    typeof createIndexedDbRingBuffer
  > | null>(null);
  const hasFetchedRef = useRef(false); // [Explanation], basically prevent reactive re-fetches

  // Local snapshot cache via IndexedDB to avoid network on reopen
  const [cachedSnapshot, setCachedSnapshot] = useState<HistoryGraph | null>(
    null
  );
  const [cacheReady, setCacheReady] = useState(false);

  // Convex hooks
  const saveHistoryMutation = useMutation(api.flowHistory.saveHistoryGraph);
  const clearHistoryMutation = useMutation(api.flowHistory.clearHistoryGraph);

  // One-shot load: subscribe only once, then switch to skip
  const historyQuery = useQuery(
    api.flowHistory.loadHistoryGraph,
    enabled && flowId && userId && !hasFetchedRef.current
      ? { flowId, userId }
      : "skip"
  );

  // Prefetch from IndexedDB cache immediately (non-reactive)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!enabled || !flowId || !userId) {
          setCacheReady(true);
          return;
        }
        const store = createIndexedDbKVStore({
          dbName: "agenitix_history_cache",
          storeName: "history_snapshots",
        });
        const key = `flow_${flowId}_user_${userId}`;
        const snap = await store.read<HistoryGraph>(key);
        if (!cancelled && snap) {
          setCachedSnapshot(snap);
        }
      } catch {}
      if (!cancelled) setCacheReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, flowId, userId]);

  // Process loaded history: prefer one-shot query result; else fall back to cached snapshot
  const loadedHistory =
    (historyQuery?.historyGraph as HistoryGraph | null | undefined) ??
    cachedSnapshot ??
    null;
  const isLoading = historyQuery === undefined && !cacheReady;

  // After first query result, mark fetched and cache to IndexedDB to avoid future network
  useEffect(() => {
    if (historyQuery !== undefined) {
      hasFetchedRef.current = true;
      const graph = historyQuery?.historyGraph as HistoryGraph | undefined;
      if (graph && flowId && userId) {
        setCachedSnapshot(graph);
        try {
          const store = createIndexedDbKVStore({
            dbName: "agenitix_history_cache",
            storeName: "history_snapshots",
          });
          const key = `flow_${flowId}_user_${userId}`;
          void store.write(key, graph);
        } catch {}
      }
    }
  }, [historyQuery, flowId, userId]);
  // Initialize client-side ring buffer (IndexedDB)
  useEffect(() => {
    if (!enabled || !flowId || !userId) return;
    const buf = createIndexedDbRingBuffer({
      dbName: "agenitix_history",
      storeName: `flow_${flowId}_user_${userId}`,
      capacity: 200, // Keep last 200 diffs client-side
    });
    ringBufferRef.current = buf;
    return () => {
      buf?.close?.();
      ringBufferRef.current = null;
    };
  }, [enabled, flowId, userId]);

  // On load: reconcile local diffs on top of server snapshot
  useEffect(() => {
    const reconcile = async () => {
      if (!enabled || !flowId || !userId) return;
      if (!loadedHistory) return; // nothing to reconcile
      const buf = ringBufferRef.current;
      if (!buf) return;
      try {
        const diffs = await buf.readAll();
        if (!diffs || diffs.length === 0) return;
        // Apply diffs in order to the loadedHistory and update the query cache optimistically
        const reconciled = applyDiffsToGraph(loadedHistory, diffs);
        // Fire-and-forget: persist reconciled snapshot and then clear local diffs
        saveHistory(reconciled, false);
        await buf.clear();
      } catch (e) {
        // Silent fail; server snapshot remains
      }
    };
    void reconcile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedHistory, enabled, flowId, userId]);

  // Don't treat null response as error since it could be authentication/access issue
  const error = null;

  // Save history with debouncing
  const saveHistory = useCallback(
    (graph: HistoryGraph, isDragging = false) => {
      if (!enabled || !flowId || !userId) {
        console.warn(
          "History persistence: No flowId/userId provided or disabled",
          {
            enabled,
            hasFlowId: !!flowId,
            hasUserId: !!userId,
            flowId,
            userId,
          }
        );
        return;
      }

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // During dragging: store a local fine-grained diff and skip network
      if (isDragging) {
        try {
          const cursorId = graph.cursor as string;
          const cursorNode = graph.nodes?.[cursorId] as any;
          const parentId = (cursorNode?.parentId as string | null) ?? null;
          const after = cursorNode?.after ?? null;
          if (cursorId && after) {
            void ringBufferRef.current?.write({
              id: cursorId,
              parentId,
              after,
              createdAt: Date.now(),
            });
          }
        } catch {}
        return;
      }

      // Optimize graph for storage for non-drag snapshots (strip content/outputs)
      let optimizedGraph = optimizeGraphForStorage(graph);
      // Extra guard: prune node count to keep under Convex arg limits
      optimizedGraph = pruneGraphForArgumentLimits(optimizedGraph, 350);
      const graphString = JSON.stringify(optimizedGraph);

      // Skip save if graph hasn't changed
      if (lastSaveRef.current === graphString) {
        return;
      }

      const debounceMs = SAVE_DEBOUNCE_MS;

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await saveHistoryMutation({
            flowId,
            historyGraph: optimizedGraph,
            isDragging: false,
            userId,
          });

          lastSaveRef.current = graphString;
          // On successful snapshot, clear local ring buffer to prevent duplication
          try {
            await ringBufferRef.current?.clear();
          } catch {}

          // Also refresh the local snapshot cache to avoid stale reopen
          try {
            const store = createIndexedDbKVStore({
              dbName: "agenitix_history_cache",
              storeName: "history_snapshots",
            });
            const key = `flow_${flowId}_user_${userId}`;
            await store.write(key, optimizedGraph);
          } catch {}
        } catch (error) {
          console.error("❌ Failed to save history:", error);
        }
      }, debounceMs);
    },
    [enabled, flowId, userId, saveHistoryMutation]
  );

  // Save local diff into ring buffer for fast, offline-friendly move streams
  const saveLocalDiff = useCallback(async (diff: HistoryDiff) => {
    try {
      await ringBufferRef.current?.write(diff);
    } catch {
      // Ignore local write failures
    }
  }, []);

  // Clear history
  const clearHistory = useCallback(async () => {
    if (!enabled || !flowId || !userId) {
      throw new Error("No flowId/userId provided or persistence disabled");
    }

    try {
      await clearHistoryMutation({ flowId, userId });
      lastSaveRef.current = null;
      // Clear cached snapshot so reopen doesn't revive old state
      try {
        const store = createIndexedDbKVStore({
          dbName: "agenitix_history_cache",
          storeName: "history_snapshots",
        });
        const key = `flow_${flowId}_user_${userId}`;
        await store.remove(key);
      } catch {}
    } catch (error) {
      console.error("❌ Failed to clear history:", error);
      throw error;
    }
  }, [enabled, flowId, userId, clearHistoryMutation]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  }, []);

  // Track saving state
  const isSaving = saveTimeoutRef.current !== null;

  return {
    saveHistory,
    saveLocalDiff,
    loadedHistory,
    isLoading,
    isSaving,
    clearHistory,
    error,
  };
}

// --------------------------------------
// Local IndexedDB Ring Buffer (minimal)
// --------------------------------------
type RingBufferOptions = {
  dbName: string;
  storeName: string;
  capacity: number;
};
export type HistoryDiff = {
  id: string;
  parentId: string | null;
  after: unknown;
  createdAt: number;
};

function createIndexedDbRingBuffer(options: RingBufferOptions) {
  const { dbName, storeName, capacity } = options;
  const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      // Open with latest version first
      const req = indexedDB.open(dbName);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          const store = db.createObjectStore(storeName, {
            keyPath: "key",
            autoIncrement: false,
          });
          store.createIndex("by_createdAt", "createdAt");
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        if (db.objectStoreNames.contains(storeName)) {
          resolve(db);
          return;
        }
        // Upgrade path: reopen with bumped version to create missing store
        const newVersion = db.version + 1;
        db.close();
        const upgradeReq = indexedDB.open(dbName, newVersion);
        upgradeReq.onupgradeneeded = () => {
          const udb = upgradeReq.result;
          if (!udb.objectStoreNames.contains(storeName)) {
            const store = udb.createObjectStore(storeName, {
              keyPath: "key",
              autoIncrement: false,
            });
            store.createIndex("by_createdAt", "createdAt");
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
      };
      req.onerror = () => reject(req.error);
    });

  const write = async (diff: HistoryDiff) => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const key = `${diff.createdAt}_${diff.id}`;
    await new Promise((resolve, reject) => {
      const putReq = store.put({ key, ...diff });
      putReq.onsuccess = resolve;
      putReq.onerror = () => reject(putReq.error);
    });
    // Trim to capacity
    const all = await readAll();
    if (all.length > capacity) {
      const toDelete = all.length - capacity;
      for (let i = 0; i < toDelete; i += 1) {
        const delKey = `${all[i]!.createdAt}_${all[i]!.id}`;
        await new Promise((resolve, reject) => {
          const delReq = store.delete(delKey);
          delReq.onsuccess = resolve;
          delReq.onerror = () => reject(delReq.error);
        });
      }
    }
    await new Promise((resolve) => (tx.oncomplete = () => resolve(null)));
    db.close();
  };

  const readAll = async (): Promise<HistoryDiff[]> => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const index = store.index("by_createdAt");
    const results: HistoryDiff[] = [];
    await new Promise<void>((resolve, reject) => {
      const cursorReq = index.openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return resolve();
        results.push(cursor.value as HistoryDiff);
        cursor.continue();
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
    db.close();
    return results.sort((a, b) => a.createdAt - b.createdAt);
  };

  const clear = async () => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).clear();
    await new Promise((resolve) => (tx.oncomplete = () => resolve(null)));
    db.close();
  };

  const close = () => {
    // No-op; we close per-op
  };

  return { write, readAll, clear, close };
}

// --------------------------------------
// Local IndexedDB KV Store (snapshot cache)
// --------------------------------------
function createIndexedDbKVStore({
  dbName,
  storeName,
}: {
  dbName: string;
  storeName: string;
}) {
  const openDb = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };
      req.onsuccess = () => {
        const db = req.result;
        if (db.objectStoreNames.contains(storeName)) {
          resolve(db);
          return;
        }
        const newVersion = db.version + 1;
        db.close();
        const upgradeReq = indexedDB.open(dbName, newVersion);
        upgradeReq.onupgradeneeded = () => {
          const udb = upgradeReq.result;
          if (!udb.objectStoreNames.contains(storeName)) {
            udb.createObjectStore(storeName);
          }
        };
        upgradeReq.onsuccess = () => resolve(upgradeReq.result);
        upgradeReq.onerror = () => reject(upgradeReq.error);
      };
      req.onerror = () => reject(req.error);
    });

  const read = async <T = unknown>(key: string): Promise<T | null> => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const value: T | null = await new Promise((resolve, reject) => {
      const getReq = store.get(key);
      getReq.onsuccess = () => resolve((getReq.result as T) ?? null);
      getReq.onerror = () => reject(getReq.error);
    });
    db.close();
    return value;
  };

  const write = async (key: string, value: unknown): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await new Promise((resolve, reject) => {
      const putReq = store.put(value, key);
      putReq.onsuccess = resolve;
      putReq.onerror = () => reject(putReq.error);
    });
    await new Promise<void>((resolve) => (tx.oncomplete = () => resolve()));
    db.close();
  };

  const remove = async (key: string): Promise<void> => {
    const db = await openDb();
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    await new Promise((resolve, reject) => {
      const delReq = store.delete(key);
      delReq.onsuccess = resolve;
      delReq.onerror = () => reject(delReq.error);
    });
    await new Promise<void>((resolve) => (tx.oncomplete = () => resolve()));
    db.close();
  };

  return { read, write, remove };
}

// Minimal diff applier: append nodes from diffs if newer than cursor
function applyDiffsToGraph(
  graph: HistoryGraph,
  diffs: HistoryDiff[]
): HistoryGraph {
  if (!diffs.length) return graph;
  const g = { ...graph, nodes: { ...graph.nodes } } as HistoryGraph;
  for (const d of diffs) {
    g.nodes[d.id] = {
      ...(g.nodes[d.id] ?? {
        id: d.id,
        parentId: d.parentId,
        childrenIds: [],
        label: "LOCAL",
        before: d.after,
        after: d.after,
        createdAt: d.createdAt,
      }),
      after: d.after as any,
      createdAt: d.createdAt,
    } as any;
    g.cursor = d.id;
  }
  return g;
}
