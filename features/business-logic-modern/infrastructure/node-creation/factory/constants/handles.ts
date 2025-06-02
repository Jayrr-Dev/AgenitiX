/**
 * NODE HANDLE DEFINITIONS - Centralized handle configurations
 *
 * • Centralized definitions for all node input/output handles
 * • Prevents circular dependencies between registry and components
 * • Provides type-safe handle configurations for all node types
 * • Single source of truth for node connection capabilities
 * • Used by both components and registry for consistency
 *
 * Keywords: handles, connections, input-output, type-safety, circular-dependency,
 * centralized-config, node-capabilities, registry-integration
 */

import { Position } from "@xyflow/react";
import type { HandleConfig, NodeType } from "../types";

// ============================================================================
// HANDLE DEFINITIONS BY NODE TYPE
// ============================================================================

/**
 * NODE HANDLE REGISTRY
 * Central definition of all node handles to prevent circular imports
 */
export const NODE_HANDLE_DEFINITIONS: Record<NodeType, HandleConfig[]> = {
  // CREATE DOMAIN HANDLES
  createText: [
    {
      id: "trigger",
      dataType: "b",
      position: Position.Left,
      type: "target",
    },
    {
      id: "output",
      dataType: "s",
      position: Position.Right,
      type: "source",
    },
  ],

  // VIEW DOMAIN HANDLES
  viewOutput: [
    {
      id: "input",
      dataType: "x",
      position: Position.Left,
      type: "target",
    },
  ],

  // TRIGGER DOMAIN HANDLES
  triggerOnToggle: [
    {
      id: "trigger",
      dataType: "b",
      position: Position.Left,
      type: "target",
    },
    {
      id: "output",
      dataType: "b",
      position: Position.Right,
      type: "source",
    },
  ],

  // TEST DOMAIN HANDLES
  testError: [
    {
      id: "trigger",
      dataType: "b",
      position: Position.Left,
      type: "target",
    },
    {
      id: "error",
      dataType: "S",
      position: Position.Right,
      type: "source",
    },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * GET NODE HANDLES
 * Safe handle retrieval with fallback
 */
export function getNodeHandles(nodeType: NodeType): HandleConfig[] {
  return NODE_HANDLE_DEFINITIONS[nodeType] || [];
}

/**
 * VALIDATE NODE HANDLES
 * Ensures handle configuration is valid
 */
export function validateNodeHandles(nodeType: NodeType): boolean {
  const handles = NODE_HANDLE_DEFINITIONS[nodeType];
  if (!handles) return false;

  return handles.every(
    (handle) =>
      handle.id &&
      handle.dataType &&
      handle.position &&
      handle.type &&
      (handle.type === "source" || handle.type === "target")
  );
}

/**
 * GET ALL HANDLE DEFINITIONS
 * Returns complete handle registry for validation
 */
export function getAllHandleDefinitions(): Record<NodeType, HandleConfig[]> {
  return { ...NODE_HANDLE_DEFINITIONS };
}
