import type { Connection } from "@xyflow/react";
import { TYPE_MAP } from "../constants";

/**
 * HELPER: Check if string is a valid data type
 */
function isDataType(str: string): boolean {
  return /^[snjabNfxuS∅]$/.test(str) && str.length === 1;
}

/**
 * HELPER: Map handle IDs to data types
 */
function mapHandleToDataType(handleId: string): string {
  // If it's already a data type, return it
  if (isDataType(handleId)) {
    return handleId;
  }

  // Common handle ID to data type mappings
  const handleToTypeMap: Record<string, string> = {
    output: "s", // String output
    trigger: "b", // Boolean trigger
    input: "x", // Any input
    json: "j", // JSON input
    result: "x", // Any result
    data: "x", // Any data
    b: "b", // Boolean (legacy)
    s: "s", // String (legacy)
  };

  return handleToTypeMap[handleId] || "x"; // Default to 'any'
}

/**
 * HELPER: Parse union types safely
 */
function parseTypes(typeStr?: string | null): string[] {
  if (!typeStr) return ["x"]; // Default to 'any'

  // If it looks like a handle ID, map it first
  if (!isDataType(typeStr)) {
    const mappedType = mapHandleToDataType(typeStr);
    return [mappedType];
  }

  // Parse union types (e.g., 's|n')
  return typeStr
    .split("|")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

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

  // Map handle ID to data type properly
  const dataType = mapHandleToDataType(connection.sourceHandle);
  console.log(
    `[ConnectionUtils] Mapped handle "${connection.sourceHandle}" to type "${dataType}"`
  );

  return dataType;
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
