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

  // Load canvas data into store when available (after hydration)
  useEffect(() => {
    if (!canvasData || hasLoaded || !hasHydrated) {
      return;
    }

    try {
      // [Defensive load] , basically avoid wiping a non-empty local graph with empty server data
      const serverHasNodesArray = Array.isArray((canvasData as any).nodes);
      const serverHasEdgesArray = Array.isArray((canvasData as any).edges);

      const serverNodesLen = serverHasNodesArray
        ? ((canvasData as any).nodes as unknown[]).length
        : 0;
      const serverEdgesLen = serverHasEdgesArray
        ? ((canvasData as any).edges as unknown[]).length
        : 0;

      // Only trust server when it has actual graph content
      const serverHasGraphContent = serverNodesLen > 0 || serverEdgesLen > 0;

      const current = (useFlowStore as any).getState() as {
        nodes: unknown[];
        edges: unknown[];
      };

      if (serverHasGraphContent) {
        // [Server overwrite] , basically use server data only when it actually has nodes/edges
        setNodes(serverHasNodesArray ? (canvasData as any).nodes : []);
        setEdges(serverHasEdgesArray ? (canvasData as any).edges : []);
      } else {
        // [Preserve local] , basically do nothing when server has no canvas yet
        // Avoid writing empty arrays which can wipe persisted local state during Fast Refresh
        // eslint-disable-next-line no-console
        if (
          typeof window !== "undefined" &&
          window.localStorage.getItem("DEBUG_FLOW_CLEAR") === "1"
        ) {
          console.log("[FlowDebug] useLoadCanvas: server returned empty graph; preserving local state");
        }
      }

      setHasLoaded(true);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load canvas data";
      setError(errorMessage);
      console.error("Failed to load canvas data:", err);
    }
  }, [canvasData, hasLoaded, hasHydrated, setNodes, setEdges]);

  // Reset state when flow changes
  useEffect(() => {
    setHasLoaded(false);
    setError(null);
    // Do not clear localStorage here; different flows should manage isolation via flow IDs
  }, [flow?.id]);

  return {
    isLoading: canvasData === undefined && !hasLoaded && !error,
    error,
    hasLoaded,
  };
}
