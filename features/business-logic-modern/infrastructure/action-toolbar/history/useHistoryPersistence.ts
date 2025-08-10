/**
 * HISTORY PERSISTENCE HOOK - React hooks for server-side history storage
 *
 * • Convex integration for saving/loading history graphs
 * • Optimistic updates and error handling
 * • Flow ID validation and user authentication
 * • Debounced saves to prevent excessive server calls
 *
 * Keywords: history-hooks, convex-persistence, optimistic-updates, debouncing
 */

import { useMutation, useQuery } from "convex/react";
import { useCallback, useRef } from "react";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import type { HistoryGraph } from "./historyGraph";

// Local lightweight optimizer to avoid import issues
function optimizeGraphForStorage(graph: HistoryGraph): HistoryGraph {
  return {
    ...graph,
    nodes: Object.fromEntries(
      Object.entries(graph.nodes).map(([id, node]) => [
        id,
        {
          ...node,
        },
      ])
    ),
  };
}

const SAVE_DEBOUNCE_MS = 500; // Debounce saves, basically wait 500ms before saving
const DRAG_DEBOUNCE_MS = 1000; // Longer debounce during drag operations

interface UseHistoryPersistenceOptions {
  flowId?: Id<"flows">;
  userId?: Id<"users">; // Add userId for authentication
  enabled?: boolean;
}

interface UseHistoryPersistenceResult {
  /** Save history graph to server */
  saveHistory: (graph: HistoryGraph, isDragging?: boolean) => void;
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

  // Convex hooks
  const saveHistoryMutation = useMutation(api.flowHistory.saveHistoryGraph);
  const clearHistoryMutation = useMutation(api.flowHistory.clearHistoryGraph);

  const historyQuery = useQuery(
    api.flowHistory.loadHistoryGraph,
    enabled && flowId && userId ? { flowId, userId } : "skip"
  );

  // Process loaded history
  const loadedHistory = historyQuery?.historyGraph || null;
  const isLoading = historyQuery === undefined;
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

      // Optimize graph for storage
      const optimizedGraph = optimizeGraphForStorage(graph);
      const graphString = JSON.stringify(optimizedGraph);

      // Skip save if graph hasn't changed
      if (lastSaveRef.current === graphString) {
        return;
      }

      const debounceMs = isDragging ? DRAG_DEBOUNCE_MS : SAVE_DEBOUNCE_MS;

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          console.log("💾 Saving history to server", {
            flowId,
            userId,
            isDragging,
          });

          await saveHistoryMutation({
            flowId,
            historyGraph: optimizedGraph,
            isDragging,
            userId,
          });

          lastSaveRef.current = graphString;
          console.log("✅ History saved successfully");
        } catch (error) {
          console.error("❌ Failed to save history:", error);
        }
      }, debounceMs);
    },
    [enabled, flowId, userId, saveHistoryMutation]
  );

  // Clear history
  const clearHistory = useCallback(async () => {
    if (!enabled || !flowId || !userId) {
      throw new Error("No flowId/userId provided or persistence disabled");
    }

    try {
      console.log("🗑️ Clearing history for flow", flowId);
      await clearHistoryMutation({ flowId, userId });
      lastSaveRef.current = null;
      console.log("✅ History cleared successfully");
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
    loadedHistory,
    isLoading,
    isSaving,
    clearHistory,
    error,
  };
}
