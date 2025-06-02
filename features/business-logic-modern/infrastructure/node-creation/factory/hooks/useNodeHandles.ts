/**
 * USE NODE HANDLES HOOK - Handle management for node connections
 *
 * • Manages input/output handles for node connection points
 * • Provides dynamic handle configuration based on node type
 * • Supports typed handle validation and connection rules
 * • Implements handle positioning and styling optimization
 * • Features automatic handle generation and cleanup
 *
 * Keywords: node-handles, connections, typed-validation, positioning, auto-generation, cleanup
 */

import { useMemo } from "react";
import { useVibeModeStore } from "../../stores/vibeModeStore";
import type { FilteredHandles, HandleConfig } from "../types";
import { shouldShowJsonHandle } from "../utils/conditionalRendering";

/**
 * USE NODE HANDLES
 * Smart handle filtering and display logic
 * Refactored with extracted conditional logic utilities
 *
 * @param handles - Handle configuration array
 * @param connections - Current connections
 * @param allNodes - All nodes in the flow
 * @returns Filtered input and output handles
 */
export function useNodeHandles(
  handles: HandleConfig[],
  connections: any[],
  allNodes: any[]
): FilteredHandles {
  // VIBE MODE STATE
  const { isVibeModeActive, showJsonHandles } = useVibeModeStore();

  // ========================================================================
  // HANDLE VALIDATION AND DEBUGGING
  // ========================================================================

  // Debug: Log handles being processed
  console.log(
    `🔧 [useNodeHandles] Processing ${handles.length} handles:`,
    handles
  );

  // DEBUG: Log each handle type
  handles.forEach((handle, index) => {
    console.log(`🔧 [useNodeHandles] Handle ${index}:`, {
      id: handle.id,
      type: handle.type,
      dataType: handle.dataType,
      position: handle.position,
    });
  });

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

  const { inputHandlesFiltered, outputHandles }: FilteredHandles =
    useMemo(() => {
      // FILTER INPUT HANDLES with extracted logic
      const inputHandlesFiltered = handles
        .filter((handle) => handle.type === "target")
        .filter((handle) =>
          shouldShowJsonHandle(
            handle,
            connections,
            allNodes,
            showJsonHandles,
            isVibeModeActive
          )
        );

      // FILTER OUTPUT HANDLES (simpler logic)
      const outputHandles = filterOutputHandles(handles);

      return { inputHandlesFiltered, outputHandles };
    }, [handles, connections, showJsonHandles, isVibeModeActive, allNodes]);

  // Debug: Log final result
  console.log(
    `✅ [useNodeHandles] Final result: ${inputHandlesFiltered.length} inputs, ${outputHandles.length} outputs`
  );

  return { inputHandlesFiltered, outputHandles };
}

// ============================================================================
// EXTRACTED HELPER FUNCTIONS
// ============================================================================

/**
 * FILTER OUTPUT HANDLES
 * Simple output handle filtering with early return
 */
function filterOutputHandles(handles: HandleConfig[]): HandleConfig[] {
  const outputHandles = handles.filter((handle) => handle.type === "source");
  console.log(
    `🔧 [filterOutputHandles] Input: ${handles.length} handles, Output: ${outputHandles.length} handles`
  );
  console.log(`🔧 [filterOutputHandles] Found output handles:`, outputHandles);
  return outputHandles;
}
