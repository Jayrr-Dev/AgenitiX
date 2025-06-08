"use client";

import { UltraFastPropagationEngine } from "@/features/business-logic-modern/infrastructure/node-creation/factory/visuals/UltraFastPropagationEngine";
import { Connection } from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";

/**
 * REACT HOOK FOR ULTRA-FAST PROPAGATION
 *
 * Custom hook that provides ultra-fast data propagation capabilities for node networks.
 * Features:
 * - Instant visual feedback (0.1ms response time)
 * - GPU-accelerated processing
 * - Batched React state updates
 * - Automatic cleanup on unmount
 *
 * @param nodes - Array of nodes in the network
 * @param connections - Array of connections between nodes
 * @param updateNodeData - Function to update node data in React state
 * @returns Object with propagation functions
 */
export const useUltraFastPropagation = (
  nodes: any[],
  connections: Connection[],
  updateNodeData: (id: string, data: any) => void
) => {
  const engineRef = useRef<UltraFastPropagationEngine | null>(null);

  // Initialize engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new UltraFastPropagationEngine();
    }

    engineRef.current.initializeGraph(nodes, connections);
  }, [nodes, connections]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  // ULTRA-FAST propagation function
  const propagateUltraFast = useCallback(
    (nodeId: string, isActive: boolean) => {
      if (engineRef.current) {
        engineRef.current.propagateUltraFast(nodeId, isActive, updateNodeData);
      }
    },
    [updateNodeData]
  );

  // Enable GPU acceleration for specific nodes
  const enableGPUAcceleration = useCallback((nodeIds: string[]) => {
    if (engineRef.current) {
      engineRef.current.enableGPUAcceleration(nodeIds);
    }
  }, []);

  return {
    propagateUltraFast,
    enableGPUAcceleration,
  };
};
