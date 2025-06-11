/**
 * NODE HANDLE DEFINITIONS - Centralized handle configurations
 *
 * 🧱 BUILD-TIME REGISTRY
 * • Fully typed, compile-time safe handle definition map
 * • Shared across components, registry, inspector, and factory systems
 * • Prevents circular dependencies and duplication
 *
 * ⚙️ RUNTIME FUNCTIONS
 * • Provides runtime access to handle configs
 * • Used for validation, inspection, and registry access
 *
 * Keywords: handles, connections, input-output, type-safety, circular-dependency,
 * centralized-config, node-capabilities, registry-integration
 */

import { Position } from "@xyflow/react";
import type { HandleConfig, NodeType } from "../../types";

// =============================================================================
// 🧱 BUILD-TIME REGISTRY
// =============================================================================

/**
 * NODE_HANDLE_DEFINITIONS
 * Centralized build-time map of handle configurations per node type.
 * TODO: Change this to a dynamic registry that is loaded from the JSON registry
 */
export const NODE_HANDLE_DEFINITIONS: Record<NodeType, HandleConfig[]> = {
  // 🟦 CREATE DOMAIN
  createText: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "output", dataType: "s", position: Position.Right, type: "source" },
  ],

  // 🟨 VIEW DOMAIN
  viewOutput: [
    { id: "input", dataType: "x", position: Position.Left, type: "target" },
  ],

  // 🟥 TRIGGER DOMAIN
  triggerOnToggle: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "output", dataType: "b", position: Position.Right, type: "source" },
  ],

  // 🧪 TEST / DEBUG DOMAIN
  testError: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "error", dataType: "{}", position: Position.Right, type: "source" },
    { id: "vibe", dataType: "V", position: Position.Top, type: "target" },
  ],
};

// =============================================================================
// ⚙️ RUNTIME FUNCTIONS
// =============================================================================

/**
 * getNodeHandles
 * Returns handle config for a given node type or empty array.
 */
export function getNodeHandles(nodeType: NodeType): HandleConfig[] {
  return NODE_HANDLE_DEFINITIONS[nodeType] || [];
}

/**
 * validateNodeHandles
 * Ensures all handles for a given node type are structurally valid.
 */
export function validateNodeHandles(nodeType: NodeType): boolean {
  const handles = NODE_HANDLE_DEFINITIONS[nodeType];
  if (!handles) return false;

  return handles.every(
    (handle) =>
      !!handle.id &&
      !!handle.dataType &&
      !!handle.position &&
      !!handle.type &&
      (handle.type === "source" || handle.type === "target")
  );
}

/**
 * getAllHandleDefinitions
 * Returns the entire handle definition map.
 */
export function getAllHandleDefinitions(): Record<NodeType, HandleConfig[]> {
  return { ...NODE_HANDLE_DEFINITIONS };
}
