/**
 * LOAD CANVAS HOOK - Load canvas state from Convex
 *
 * • Loads canvas state (nodes and edges) from Convex when flow opens
 * • Handles authentication and permission checks
 * • Provides loading status and error handling
 * • Integrates with flow store for state management
 *
 * Keywords: load-canvas, convex, flow-store, authentication
 */

import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useFlowMetadataOptional } from "../contexts/flow-metadata-context";
import { useFlowStore } from "../stores/flowStore";

// Local storage keys (verb-first)
const SERVER_LOAD_MARK_PREFIX = "flow-server-loaded:"; // [Explanation], basically marks that we loaded this flow from server
const CLEAR_FLOW_EDITOR_BACKUP_PREFIX = "flow-editor-backup:"; // [Explanation], basically FlowEditor backup key
const CLEAR_UNDO_BACKUP_PREFIX = "flow-undo-backup:"; // [Explanation], basically Undo/Redo backup key

interface UseLoadCanvasResult {
  /** Whether canvas data is currently loading */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
  /** Whether canvas data has been loaded */
  hasLoaded: boolean;
}

export function useLoadCanvas(): UseLoadCanvasResult {
  const { user } = useAuth();
  const { flow } = useFlowMetadataOptional() || { flow: null };
  const { setNodes, setEdges } = useFlowStore();
  const hasHydrated = useFlowStore((s) => s._hasHydrated);

  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug initial state
  console.log("🔍 useLoadCanvas hook called", {
    user_present: !!user,
    user_id: user?.id,
    flow_present: !!flow,
    flow_id: flow?.id,
    flow_name: flow?.name,
    hasHydrated,
  });

  // Query canvas data from Convex
  const canvasData = useQuery(
    api.flows.loadFlowCanvas,
    flow?.id
      ? {
          flow_id: flow.id as Id<"flows">,
          user_id: user?.id as any,
        }
      : "skip"
  );

  // Log query status
  console.log("🔍 Convex query status", {
    isQuerySkipped: !flow?.id,
    canvasData_status:
      canvasData === undefined
        ? "loading"
        : canvasData
          ? "has_data"
          : "no_data",
    canvasData_type: typeof canvasData,
  });

  // Load canvas data into store when available (after hydration)
  useEffect(() => {
    // [Hydration gate] , basically wait for persisted store to be ready
    if (!hasHydrated) {
      console.log("🔍 Blocked by hydration gate - hasHydrated:", hasHydrated);
      // Force hydration if we have canvas data but store isn't hydrated yet
      const setHasHydrated = useFlowStore.getState().setHasHydrated;
      setHasHydrated(true);
      console.log("🔍 Forced hydration to bypass gate");
    }
    // Skip until query resolves (undefined = loading)
    if (canvasData === undefined) return;
    // Avoid re-applying after a successful load (reset on flow id change)
    if (hasLoaded) return;

    // Debug logging to help identify issues
    console.log("🔍 useLoadCanvas: Loading canvas data", {
      flow_id: flow?.id,
      user_id: user?.id,
      hasHydrated,
      canvasData: canvasData ? "data received" : "no data",
      nodes_count: canvasData?.nodes?.length || 0,
      edges_count: canvasData?.edges?.length || 0,
      hasLoaded,
    });

    try {
      // Always trust server response for current flow, basically avoid leaking previous flow state
      const serverNodes = Array.isArray((canvasData as any).nodes)
        ? ((canvasData as any).nodes as unknown[])
        : [];
      const serverEdges = Array.isArray((canvasData as any).edges)
        ? ((canvasData as any).edges as unknown[])
        : [];

      setNodes(serverNodes as any[]);
      setEdges(serverEdges as any[]);

      // Mark this flow as server-loaded and clear stale backups only if we loaded actual data
      try {
        if (typeof window !== "undefined" && flow?.id) {
          const flowId = String(flow.id);
          window.localStorage.setItem(
            `${SERVER_LOAD_MARK_PREFIX}${flowId}`,
            String(Date.now())
          );
          // Only clear backups if we actually loaded data from server, basically preserve backups for empty flows
          if (serverNodes.length > 0 || serverEdges.length > 0) {
            window.localStorage.removeItem(
              `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
            );
            window.localStorage.removeItem(
              `${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`
            );
          }
        }
      } catch {}

      setHasLoaded(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load canvas data";
      setError(errorMessage);
      console.error("Failed to load canvas data:", err);
    }
  }, [canvasData, hasLoaded, hasHydrated, setNodes, setEdges]);

  // Reset state when flow changes: clear local nodes/edges first, then let server load apply
  useEffect(() => {
    setHasLoaded(false);
    setError(null);

    // Clear local graph immediately to avoid visual carry-over from previous flow
    if (hasHydrated) {
      setNodes([] as any);
      setEdges([] as any);
    }

    // Mark as server-loading and clear any stale per-flow backups to prevent client restore
    try {
      if (typeof window !== "undefined" && flow?.id) {
        const flowId = String(flow.id);
        window.localStorage.setItem(
          `${SERVER_LOAD_MARK_PREFIX}${flowId}`,
          "loading"
        );
        window.localStorage.removeItem(
          `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
        );
        window.localStorage.removeItem(`${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`);
      }
    } catch {}
  }, [flow?.id, hasHydrated, setNodes, setEdges]);

  // Log final state
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);

  console.log("🔍 useLoadCanvas final state", {
    isLoading: canvasData === undefined && !hasLoaded && !error,
    error,
    hasLoaded,
    current_nodes_in_store: nodes.length,
    current_edges_in_store: edges.length,
  });

  // Add debug function to window for manual testing
  if (typeof window !== "undefined") {
    (window as any).debugFlowLoading = () => {
      console.log("🔍 MANUAL DEBUG - Current State:", {
        user: user ? { id: user.id, email: user.email } : "No user",
        flow: flow ? { id: flow.id, name: flow.name } : "No flow",
        hasHydrated,
        canvasData: canvasData ? "Has data" : "No data",
        querySkipped: !flow?.id || !user?.id,
        nodes_in_store: nodes.length,
        edges_in_store: edges.length,
        hasLoaded,
        error,
      });
      return { user, flow, canvasData, nodes, edges };
    };
  }

  return {
    isLoading: canvasData === undefined && !hasLoaded && !error,
    error,
    hasLoaded,
  };
}
