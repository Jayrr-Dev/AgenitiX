/**
Route: features/business-logic-modern/infrastructure/flow-engine/hooks/useLoadCanvas.ts
 * LOAD CANVAS HOOK - Load canvas state from Convex
 *
 * • Loads canvas state (nodes and edges) from Convex when flow opens
 * • Handles authentication and permission checks
 * • Provides loading status and error handling
 * • Integrates with flow store for state management
 * • Clears legacy localStorage and new sessionStorage backups after server load
 *
 * Keywords: load-canvas, convex, flow-store, authentication, backup-cleanup
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

  // Query canvas data from Convex (one-shot: unsubscribe after first successful load)
  const shouldQuery = !!flow?.id && !hasLoaded;
  const canvasData = useQuery(
    api.flows.loadFlowCanvas,
    shouldQuery
      ? {
          flow_id: flow.id as Id<"flows">,
          user_id: user?.id as any,
        }
      : "skip"
  );

  // Load canvas data into store when available (after hydration)
  useEffect(() => {
    // [Hydration gate] , basically wait for persisted store to be ready
    // Since persistence is disabled, immediately set hydrated to true
    if (!hasHydrated) {
      // Force hydration since we're not using persistence
      const setHasHydrated = useFlowStore.getState().setHasHydrated;
      setHasHydrated(true);
    }
    // Skip until query resolves (undefined = loading)
    if (canvasData === undefined) return;
    // Avoid re-applying after a successful load (reset on flow id change)
    if (hasLoaded) return;

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
            // Clear legacy localStorage backups
            window.localStorage.removeItem(
              `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
            );
            window.localStorage.removeItem(
              `${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`
            );
            // Clear new sessionStorage backups
            try {
              window.sessionStorage.removeItem(
                `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
              );
              window.sessionStorage.removeItem(
                `${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`
              );
            } catch {}
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

    // Clear any persistent storage that might conflict with server data
    try {
      if (typeof window !== "undefined" && flow?.id) {
        const flowId = String(flow.id);
        window.localStorage.setItem(
          `${SERVER_LOAD_MARK_PREFIX}${flowId}`,
          "loading"
        );
        // Clear legacy localStorage backups
        window.localStorage.removeItem(
          `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
        );
        window.localStorage.removeItem(`${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`);

        // Clear global flow store persistence that causes conflicts
        window.localStorage.removeItem("flow-editor-storage");

        // Clear new sessionStorage backups
        try {
          window.sessionStorage.removeItem(
            `${CLEAR_FLOW_EDITOR_BACKUP_PREFIX}${flowId}`
          );
          window.sessionStorage.removeItem(
            `${CLEAR_UNDO_BACKUP_PREFIX}${flowId}`
          );
        } catch {}
      }
    } catch {}
  }, [flow?.id, hasHydrated, setNodes, setEdges]);

  return {
    isLoading: canvasData === undefined && !hasLoaded && !error,
    error,
    hasLoaded,
  };
}
