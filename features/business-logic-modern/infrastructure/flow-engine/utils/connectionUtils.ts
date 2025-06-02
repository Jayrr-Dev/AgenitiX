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

import { parseTypes } from "@node-creation/node-handles/TypesafeHandle";
import type { Connection } from "@xyflow/react";
import { TYPE_MAP } from "../constants";

/**
 * Validates if a connection between two handles is valid
 */
export function validateConnection(connection: Connection): boolean {
  if (!connection.sourceHandle || !connection.targetHandle) {
    return false;
  }

  const sourceTypes = parseTypes(connection.sourceHandle);
  const targetTypes = parseTypes(connection.targetHandle);

  // Allow if either side is 'x' (any)
  const valid =
    sourceTypes.includes("x") ||
    targetTypes.includes("x") ||
    sourceTypes.some((st: string) => targetTypes.includes(st));

  return valid;
}

/**
 * Gets the data type for edge styling based on source handle
 */
export function getConnectionDataType(connection: Connection): string {
  if (!connection.sourceHandle) {
    return "s"; // fallback to string
  }

  // Use parseTypes to support union/any/custom
  const types = parseTypes(connection.sourceHandle);
  // Use first type for color (or 'x' for any)
  return types[0] || "s";
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
