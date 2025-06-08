/**
 * USE NODE HANDLES HOOK - Handle management for node connections
 *
 * • Manages input/output handles for node connection points
 * • Provides dynamic handle configuration based on node type
 * • Supports typed handle validation and connection rules
 * • Implements handle positioning and styling optimization
 * • Features automatic handle generation and cleanup
 * • Supports vibe handles with opacity control
 *
 * Keywords: node-handles, connections, typed-validation, positioning, auto-generation, cleanup, vibe-handles
 */

import { useMemo } from "react";
import { useVibeModeStore } from "../../stores/vibeModeStore";
import type { FilteredHandles, HandleConfig } from "../types";
import {
  getVibeHandleOpacity,
  shouldShowVibeHandle,
} from "../utils/conditionalRendering";

/**
 * USE NODE HANDLES
 * Smart handle filtering and display logic with vibe handle support
 * Refactored with extracted conditional logic utilities
 *
 * @param handles - Handle configuration array
 * @param connections - Current connections
 * @param allNodes - All nodes in the flow
 * @returns Filtered input and output handles with opacity information
 */
export function useNodeHandles(
  handles: HandleConfig[],
  connections: any[],
  allNodes: any[]
): FilteredHandles & { handleOpacities: Record<string, number> } {
  // VIBE MODE STATE
  const { isVibeModeActive, showVibeHandles, vibeHandleOpacity } =
    useVibeModeStore();

  // ========================================================================
  // HANDLE VALIDATION AND DEBUGGING
  // ========================================================================

  // Check for handle ID conflicts (in development)
  if (process.env.NODE_ENV === "development") {
    const handleIds = handles.map((h) => h.id);
    const duplicateIds = handleIds.filter(
      (id, index) => handleIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      console.error("🚨 Handle ID conflicts detected:", duplicateIds);
      console.error("🔧 Handles configuration:", handles);
    }
  }

  // ========================================================================
  // HANDLE FILTERING LOGIC WITH EXTRACTED UTILITIES
  // ========================================================================

  const {
    inputHandlesFiltered,
    outputHandles,
    handleOpacities,
  }: FilteredHandles & { handleOpacities: Record<string, number> } =
    useMemo(() => {
      const handleOpacities: Record<string, number> = {};

      // FILTER INPUT HANDLES with vibe handle logic
      const inputHandlesFiltered = handles
        .filter((handle) => handle.type === "target")
        .filter((handle) => {
          // Check vibe handles (V only)
          if (handle.dataType === "V") {
            const shouldShow = shouldShowVibeHandle(
              handle,
              connections,
              allNodes,
              showVibeHandles,
              isVibeModeActive
            );

            // Calculate opacity for vibe handles
            handleOpacities[handle.id] = getVibeHandleOpacity(
              handle,
              showVibeHandles,
              vibeHandleOpacity
            );

            return shouldShow || !showVibeHandles; // Show with opacity even when "hidden"
          }

          // All other handles (including {}) are always visible with full opacity
          handleOpacities[handle.id] = 1.0;
          return true;
        });

      // FILTER OUTPUT HANDLES (simpler logic)
      const outputHandles = filterOutputHandles(handles, handleOpacities);

      return { inputHandlesFiltered, outputHandles, handleOpacities };
    }, [
      handles,
      connections,
      showVibeHandles,
      isVibeModeActive,
      allNodes,
      vibeHandleOpacity,
    ]);

  return { inputHandlesFiltered, outputHandles, handleOpacities };
}

// ============================================================================
// EXTRACTED HELPER FUNCTIONS
// ============================================================================

/**
 * FILTER OUTPUT HANDLES
 * Simple output handle filtering with opacity support
 */
function filterOutputHandles(
  handles: HandleConfig[],
  handleOpacities: Record<string, number>
): HandleConfig[] {
  const outputHandles = handles.filter((handle) => {
    if (handle.type === "source") {
      // Set opacity for output handles (all full opacity for now)
      handleOpacities[handle.id] = 1.0;
      return true;
    }
    return false;
  });
  return outputHandles;
}
