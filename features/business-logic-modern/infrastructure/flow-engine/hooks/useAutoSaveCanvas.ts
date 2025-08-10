/**
 * AUTO-SAVE CANVAS HOOK - Real-time canvas state persistence
 *
 * • Automatically saves canvas state (nodes and edges) to Convex
 * • Debounced saving to prevent excessive API calls
 * • Handles authentication and error states
 * • Provides save status feedback
 * • Optimized for real-time collaboration
 *
 * Keywords: auto-save, canvas, debounce, real-time, convex
 */

import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { useFlowMetadataOptional } from "../contexts/flow-metadata-context";
import { useFlowStore } from "../stores/flowStore";
import { sanitizeNodesForSave } from "../utils/sanitizeCanvasData";

// Local storage keys (verb-first)
const SERVER_LOAD_MARK_PREFIX = "flow-server-loaded:"; // [Explanation], basically used to block autosave during server load

interface UseAutoSaveCanvasOptions {
  /** Debounce delay in milliseconds (default: 1000) */
  debounceMs?: number;
  /** Enable/disable auto-save (default: true) */
  enabled?: boolean;
  /** Show toast notifications for save status (default: false) */
  showNotifications?: boolean;
}

interface AutoSaveStatus {
  /** Whether auto-save is currently enabled */
  isEnabled: boolean;
  /** Whether a save operation is in progress */
  isSaving: boolean;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Last error that occurred during saving */
  lastError: string | null;
  /** Manually trigger a save */
  saveNow: () => void;
}

export function useAutoSaveCanvas(
  options: UseAutoSaveCanvasOptions = {}
): AutoSaveStatus {
  const {
    debounceMs = 1000,
    enabled = true,
    showNotifications = false,
  } = options;

  // Hooks
  const { user } = useAuth();
  const { flow } = useFlowMetadataOptional() || { flow: null };
  const { nodes, edges } = useFlowStore();
  const hasHydrated = useFlowStore((s) => s._hasHydrated);
  const saveFlowCanvas = useMutation(api.flows.saveFlowCanvas);

  // State refs
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedDataRef = useRef<string>("");
  const lastSavedRef = useRef<Date | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  // Create fast, lightweight signature for change detection (avoids heavy JSON.stringify on each render)
  const currentData = useMemo(() => {
    // [Explanation], basically generate a compact string from stable fields
    let nodeSig = "";
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i] as any;
      const x = n?.position?.x ?? 0;
      const y = n?.position?.y ?? 0;
      const type = n?.type ?? "";
      const isExpanded = n?.data?.isExpanded ? 1 : 0;
      const isEnabled = n?.data?.isEnabled ? 1 : 0;
      nodeSig += `${n.id}:${Math.round(x)}:${Math.round(y)}:${type}:${isExpanded}:${isEnabled}|`;
    }
    let edgeSig = "";
    for (let i = 0; i < edges.length; i++) {
      const e = edges[i] as any;
      edgeSig += `${e.id}:${e.source}:${e.target}|`;
    }
    return `${nodeSig}#${edgeSig}`;
  }, [nodes, edges]);

  // Save function
  const performSave = useCallback(async () => {
    // [Hydration gate] , basically do not save until persisted store is rehydrated
    if (!hasHydrated) {
      return;
    }
    if (!(user?.id && flow?.id && flow.canEdit)) {
      return;
    }

    // [Server-load guard] , basically skip while current flow is loading from server to avoid saving empty state
    try {
      if (typeof window !== "undefined") {
        const mark = window.localStorage.getItem(
          `${SERVER_LOAD_MARK_PREFIX}${flow.id}`
        );
        if (mark === "loading") {
          return;
        }
      }
    } catch {}

    // Skip if data hasn't changed
    if (currentData === lastSavedDataRef.current) {
      return;
    }

    isSavingRef.current = true;
    lastErrorRef.current = null;

    try {
      // Sanitize nodes to avoid Convex nested/size limits
      const prunedNodes = sanitizeNodesForSave(nodes as any);

      await saveFlowCanvas({
        flow_id: flow.id as Id<"flows">,
        user_id: user.id as any,
        nodes: prunedNodes,
        edges,
      });

      lastSavedDataRef.current = currentData;
      lastSavedRef.current = new Date();

      if (showNotifications) {
        toast.success("Canvas saved", {
          duration: 1000,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to save canvas";
      lastErrorRef.current = errorMessage;

      console.error("Auto-save failed:", error);

      if (showNotifications) {
        toast.error(`Save failed: ${errorMessage}`, {
          duration: 3000,
        });
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [
    hasHydrated,
    user?.id,
    flow?.id,
    flow?.canEdit,
    currentData,
    nodes,
    edges,
    saveFlowCanvas,
    showNotifications,
  ]);

  // Manual save function
  const saveNow = useCallback(() => {
    // Clear any pending debounced save
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }

    performSave();
  }, [performSave]);

  // Auto-save effect with debouncing
  useEffect(() => {
    // [Hydration gate] , basically skip scheduling until persisted store is ready
    if (!hasHydrated) {
      return;
    }
    if (!(enabled && user?.id && flow?.id && flow.canEdit)) {
      return;
    }

    // [Server-load guard] , basically skip scheduling while server load is in progress
    try {
      if (typeof window !== "undefined") {
        const mark = window.localStorage.getItem(
          `${SERVER_LOAD_MARK_PREFIX}${flow.id}`
        );
        if (mark === "loading") {
          return;
        }
      }
    } catch {}

    // Skip if data hasn't changed
    if (currentData === lastSavedDataRef.current) {
      return;
    }

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new debounced save on a background tick to avoid blocking pointer events
    debounceTimeoutRef.current = setTimeout(() => {
      if (typeof (globalThis as any).requestIdleCallback === "function") {
        (globalThis as any).requestIdleCallback(() => performSave());
      } else {
        // Fallback to a micro-delay to yield back to UI thread
        setTimeout(() => performSave(), 0);
      }
    }, debounceMs);

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [
    hasHydrated,
    enabled,
    user?.id,
    flow?.id,
    flow?.canEdit,
    currentData,
    debounceMs,
    performSave,
  ]);

  // Reset autosave internals on flow change to avoid cross-flow carryover
  useEffect(() => {
    lastSavedDataRef.current = "";
    lastSavedRef.current = null;
    lastErrorRef.current = null;
  }, [flow?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Return status object
  return {
    isEnabled: enabled && !!user?.id && !!flow?.id && !!flow?.canEdit,
    isSaving: isSavingRef.current,
    lastSaved: lastSavedRef.current,
    lastError: lastErrorRef.current,
    saveNow,
  };
}
