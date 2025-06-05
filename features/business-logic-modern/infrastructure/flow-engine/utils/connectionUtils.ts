/**
 * CONNECTION UTILS - Handle validation and edge styling utilities
 *
 * • Validates connections between handles based on data type compatibility
 * • Provides edge styling and coloring based on data types
 * • Supports union types and any-type connections
 * • Generates unique edge IDs and styling configurations
 * • Integrates with type mapping system for consistent visuals
 *
 * Keywords: connections, validation, edge-styling, data-types, union-types, type-mapping
 */

import type { Connection } from "@xyflow/react";
import { TYPE_MAP } from "../constants";

/**
 * HELPER: Get handle data type from registry
 * Looks up the actual dataType for a handle ID from the node registry
 */
function getHandleDataType(nodeType: string, handleId: string): string {
  try {
    const {
      getNodeHandles,
    } = require("../../node-creation/node-registry/nodeRegistry");
    const handles = getNodeHandles(nodeType) || [];
    const handle = handles.find((h: any) => h.id === handleId);
    return handle?.dataType || "x"; // Default to 'any' if not found
  } catch (error) {
    console.warn("[ConnectionUtils] Failed to get handle data type:", error);
    return "x"; // Default to 'any' type
  }
}

/**
 * Validates if a connection between two handles is valid
 */
export function validateConnection(connection: Connection): boolean {
  console.group("🔍 [ConnectionUtils] Flow-level validation");
  console.log("Connection:", connection);

  if (
    !connection.sourceHandle ||
    !connection.targetHandle ||
    !connection.source ||
    !connection.target
  ) {
    console.log("❌ Missing connection data");
    console.groupEnd();
    return false;
  }

  try {
    // Let the TypesafeHandle component handle detailed validation
    // This flow-level validation is just a basic check
    console.log("✅ Allowing connection - letting handle validation decide");
    console.groupEnd();
    return true;
  } catch (error) {
    console.warn(
      "[ConnectionUtils] Validation error, allowing connection:",
      error
    );
    console.groupEnd();
    return true;
  }
}

/**
 * Gets the data type for edge styling based on source handle
 * Now properly looks up the data type from the registry instead of parsing handle IDs
 */
export function getConnectionDataType(connection: Connection): string {
  if (!connection.sourceHandle || !connection.source) {
    return "s"; // fallback to string
  }

  try {
    // Try to get the React Flow instance to access nodes
    const reactFlowInstance = (window as any).__ultimateReactFlowInstance;
    if (reactFlowInstance) {
      const nodes = reactFlowInstance.getNodes();
      const sourceNode = nodes.find((n: any) => n.id === connection.source);

      if (sourceNode) {
        // Get the actual data type from the node registry
        const dataType = getHandleDataType(
          sourceNode.type,
          connection.sourceHandle
        );
        console.log(
          `[ConnectionUtils] Found handle "${connection.sourceHandle}" with type "${dataType}" from registry`
        );
        return dataType;
      }
    }

    // If the sourceHandle looks like a data type (single character), use it
    if (
      connection.sourceHandle.length === 1 &&
      /^[snjabNfxuS∅]$/.test(connection.sourceHandle)
    ) {
      return connection.sourceHandle;
    }

    // Otherwise, try common handle ID mappings
    const handleToTypeMap: Record<string, string> = {
      output: "s", // String output
      trigger: "b", // Boolean trigger
      input: "x", // Any input
      json: "j", // JSON input
      result: "x", // Any result
      data: "x", // Any data
    };

    const dataType = handleToTypeMap[connection.sourceHandle];
    console.log(
      `[ConnectionUtils] Mapped handle "${connection.sourceHandle}" to type "${dataType || "s"}"`
    );

    return dataType || "s"; // Default to string
  } catch (error) {
    console.warn(
      "[ConnectionUtils] Failed to get connection data type:",
      error
    );
    return "s"; // fallback to string
  }
}

/**
 * Gets the color for an edge based on data type
 */
export function getEdgeColor(dataType: string): string {
  return TYPE_MAP[dataType]?.color || "#6b7280";
}

/**
 * Creates edge style object for a given data type
 */
export function createEdgeStyle(dataType: string, strokeWidth: number = 2) {
  return {
    stroke: getEdgeColor(dataType),
    strokeWidth,
  };
}

/**
 * Generates a unique edge ID
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
  return `edge-${sourceId}-${targetId}-${Date.now()}`;
}
