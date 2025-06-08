"use client";

import {
  NodeState,
  useUltraFastPropagation as useNewUltraFastPropagation,
} from "@/features/business-logic-modern/infrastructure/node-creation/factory/visuals/UltraFastPropagationEngine";
import { Connection, Node } from "@xyflow/react";
import { useCallback } from "react";

/**
 * REACT HOOK FOR ULTRA-FAST PROPAGATION (UPDATED FOR STATE MACHINE)
 *
 * Custom hook that provides ultra-fast data propagation capabilities for node networks.
 * Features:
 * - Deterministic state machine transitions (no race conditions)
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
  nodes: Node[],
  connections: Connection[],
  updateNodeData: (id: string, data: any) => void
) => {
  // Use the new state machine-enabled hook from the engine
  const {
    propagateUltraFast: enginePropagateUltraFast,
    forceDeactivate,
    enableGPUAcceleration,
    getNodeState,
  } = useNewUltraFastPropagation(nodes, connections, updateNodeData);

  // ULTRA-FAST propagation function with backward compatibility
  const propagateUltraFast = useCallback(
    (nodeId: string, isActive: boolean, isButtonDriven: boolean = true) => {
      enginePropagateUltraFast(nodeId, isActive, isButtonDriven);
    },
    [enginePropagateUltraFast]
  );

  // Enhanced activation function with automatic propagation
  const activateNode = useCallback(
    (nodeId: string) => {
      propagateUltraFast(nodeId, true, true); // Button-driven activation
    },
    [propagateUltraFast]
  );

  // Enhanced deactivation function with automatic propagation
  const deactivateNode = useCallback(
    (nodeId: string) => {
      propagateUltraFast(nodeId, false, true); // Button-driven deactivation
    },
    [propagateUltraFast]
  );

  // Auto-propagation for signal chains (not button-driven)
  const autoPropagate = useCallback(
    (nodeId: string, isActive: boolean) => {
      propagateUltraFast(nodeId, isActive, false); // Auto-propagation
    },
    [propagateUltraFast]
  );

  return {
    // Main propagation functions
    propagateUltraFast,
    activateNode,
    deactivateNode,
    autoPropagate,

    // State machine functions
    forceDeactivate,
    getNodeState,
    enableGPUAcceleration,

    // State helpers
    isNodeActive: (nodeId: string) => {
      const state = getNodeState(nodeId);
      return (
        state === NodeState.ACTIVE || state === NodeState.PENDING_DEACTIVATION
      );
    },
    isNodeInactive: (nodeId: string) => {
      const state = getNodeState(nodeId);
      return state === NodeState.INACTIVE;
    },
    isNodePending: (nodeId: string) => {
      const state = getNodeState(nodeId);
      return (
        state === NodeState.PENDING_ACTIVATION ||
        state === NodeState.PENDING_DEACTIVATION
      );
    },
  };
};
