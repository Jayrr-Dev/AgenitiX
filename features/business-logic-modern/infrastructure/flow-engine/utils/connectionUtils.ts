/**
 * CONNECTION UTILS - Handle validation and edge styling utilities
 *
 * • Validates connections between handles based on data type compatibility
 * • Provides edge styling and coloring based on data types and node categories
 * • Supports union types and any-type connections
 * • Generates unique edge IDs and styling configurations
 * • Integrates with type mapping system and category theming for consistent visuals
 *
 * Keywords: connections, validation, edge-styling, data-types, union-types, type-mapping, category-theming
 */

import type { Connection } from "@xyflow/react";
import { TYPE_MAP } from "../constants";

// CATEGORY COLOR MAPPING
const CATEGORY_EDGE_COLORS = {
  create: "#3b82f6", // Blue - matches create category
  view: "#6b7280", // Gray - matches view category
  trigger: "#6b7280", // Gray - let data types determine color (boolean = green)
  test: "#eab308", // Yellow - matches test category
  cycle: "#10b981", // Green - matches cycle category
} as const;

/**
 * HELPER: Get handle data type from registry
 * Looks up the actual dataType for a handle ID from the node registry
 */
function getHandleDataType(nodeType: string, handleId: string): string {
  try {
    // Use the unified registry for proper data type normalization
    const registry = require("../../node-creation/json-node-registry/unifiedRegistry");
    const handle =
      registry.getNodeHandle(nodeType, handleId, "source") ||
      registry.getNodeHandle(nodeType, handleId, "target");

    if (handle?.dataType) {
      console.log(
        `[ConnectionUtils] Found handle ${nodeType}.${handleId}: ${handle.dataType} (original: ${handle.originalDataType})`
      );
      return handle.dataType; // Already normalized (e.g., "boolean" -> "b")
    }

    // Fallback to direct registry lookup
    const {
      GENERATED_NODE_REGISTRY,
    } = require("../../node-creation/json-node-registry/generated/nodeRegistry");

    const nodeConfig = GENERATED_NODE_REGISTRY[nodeType];
    if (!nodeConfig || !nodeConfig.handles) {
      return "x"; // Default to 'any' if not found
    }

    const handle2 = nodeConfig.handles.find((h: any) => h.id === handleId);
    const rawDataType = handle2?.dataType || "x";

    // Normalize the data type using the same system as the registry
    const normalizeType =
      registry.normaliseHandleType || registry.normalizeHandleDataType;
    return normalizeType ? normalizeType(rawDataType) : rawDataType;
  } catch (error) {
    console.warn("[ConnectionUtils] Failed to get handle data type:", error);
    return "x"; // Default to 'any' type
  }
}

/**
 * HELPER: Get source node category for edge coloring
 * Looks up the category of the source node from the registry
 */
function getSourceNodeCategory(
  connection: Connection,
  nodes?: any[]
): string | null {
  if (!connection.source) {
    return null;
  }

  try {
    let sourceNodes = nodes;

    // If nodes not provided, try to get from ReactFlow instance
    if (!sourceNodes) {
      const reactFlowInstance = (window as any).__ultimateReactFlowInstance;
      if (reactFlowInstance) {
        sourceNodes = reactFlowInstance.getNodes();
      }
    }

    if (sourceNodes) {
      const sourceNode = sourceNodes.find(
        (n: any) => n.id === connection.source
      );

      if (sourceNode && sourceNode.type) {
        // Get the category from the node registry
        const {
          GENERATED_NODE_REGISTRY,
        } = require("../../node-creation/json-node-registry/generated/nodeRegistry");

        const nodeConfig = GENERATED_NODE_REGISTRY[sourceNode.type];
        return nodeConfig?.category || null;
      }
    }
    return null;
  } catch (error) {
    console.warn(
      "[ConnectionUtils] Failed to get source node category:",
      error
    );
    return null;
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
 * Gets the color for an edge based on data type and optionally source node category
 */
export function getEdgeColor(
  dataType: string,
  sourceCategory?: string | null
): string {
  // PRIORITY 1: Boolean types should always be green when active (per cursor rules)
  if (dataType === "b" || dataType === "boolean") {
    return "#10b981"; // Green for boolean/triggers (activation state)
  }

  // PRIORITY 2: Data type coloring for consistency
  if (TYPE_MAP[dataType]?.color) {
    return TYPE_MAP[dataType].color;
  }

  // PRIORITY 3: Category-based coloring as fallback for unknown types
  if (
    sourceCategory &&
    CATEGORY_EDGE_COLORS[sourceCategory as keyof typeof CATEGORY_EDGE_COLORS]
  ) {
    return CATEGORY_EDGE_COLORS[
      sourceCategory as keyof typeof CATEGORY_EDGE_COLORS
    ];
  }

  // Final fallback to gray
  return "#6b7280";
}

/**
 * Creates edge style object for a given data type and connection
 */
export function createEdgeStyle(
  dataType: string,
  strokeWidth: number = 2,
  connection?: Connection,
  nodes?: any[]
) {
  // Get source node category for enhanced coloring
  const sourceCategory = connection
    ? getSourceNodeCategory(connection, nodes)
    : null;

  return {
    stroke: getEdgeColor(dataType, sourceCategory),
    strokeWidth,
  };
}

/**
 * Generates a unique edge ID
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
  return `edge-${sourceId}-${targetId}-${Date.now()}`;
}
