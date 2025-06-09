/**
 * TYPE-SAFE CONNECTION UTILITIES - Prevent handle ID/dataType confusion
 *
 * • Provides type-safe connection filtering with compile-time validation
 * • Implements branded types to prevent handle ID/dataType mixups
 * • Creates utility functions with proper error handling and validation
 * • Enables strict TypeScript checking for all connection operations
 * • Replaces unsafe string comparisons with type-safe alternatives
 *
 * Keywords: type-safety, connections, handles, validation, branded-types, error-prevention
 */

import type { Connection } from "@xyflow/react";
import {
  type ConnectionFilterParams,
  DATA_TYPES,
  type DataType,
  HANDLE_IDS,
  type HandleId,
  type NodeId,
  type TriggerConnectionParams,
  type TypeSafeConnection,
  createHandleId,
  createNodeId,
} from "../../types/connections";

// ============================================================================
// CONNECTION CONVERSION UTILITIES
// ============================================================================

/**
 * CONVERT TO TYPE SAFE CONNECTION
 * Safely converts React Flow connection to type-safe version
 */
export const convertToTypeSafeConnection = (
  connection: Connection
): TypeSafeConnection => {
  // Validate connection structure
  if (!connection.source || !connection.target) {
    throw new Error(
      `Invalid connection: missing source or target. Got: ${JSON.stringify(connection)}`
    );
  }

  if (!connection.sourceHandle || !connection.targetHandle) {
    throw new Error(
      `Invalid connection: missing handle IDs. Got: ${JSON.stringify(connection)}`
    );
  }

  // Convert to branded types with validation
  const source = createNodeId(connection.source);
  const target = createNodeId(connection.target);
  const sourceHandle = createHandleId(connection.sourceHandle);
  const targetHandle = createHandleId(connection.targetHandle);

  return {
    source,
    target,
    sourceHandle,
    targetHandle,
  };
};

/**
 * CONVERT CONNECTIONS ARRAY
 * Safely converts array of React Flow connections
 */
export const convertConnectionsArray = (
  connections: Connection[]
): TypeSafeConnection[] => {
  return connections
    .filter((conn) => conn.source && conn.target) // Filter out incomplete connections
    .map((conn) => {
      try {
        return convertToTypeSafeConnection(conn);
      } catch (error) {
        console.warn(`Failed to convert connection:`, conn, error);
        return null;
      }
    })
    .filter((conn): conn is TypeSafeConnection => conn !== null);
};

// ============================================================================
// TYPE-SAFE CONNECTION FILTERING
// ============================================================================

/**
 * GET INPUT CONNECTIONS (TYPE-SAFE)
 * Retrieves all connections targeting a specific node with type safety
 */
export const getInputConnectionsSafe = (
  connections: TypeSafeConnection[],
  nodeId: NodeId
): TypeSafeConnection[] => {
  return connections.filter((connection) => connection.target === nodeId);
};

/**
 * GET CONNECTIONS BY HANDLE ID (TYPE-SAFE)
 * Filters connections by specific handle ID with compile-time validation
 */
export const getConnectionsByHandleId = <T extends HandleId>(
  connections: TypeSafeConnection[],
  nodeId: NodeId,
  handleId: T
): Array<TypeSafeConnection & { readonly targetHandle: T }> => {
  return connections.filter(
    (
      connection
    ): connection is TypeSafeConnection & { readonly targetHandle: T } =>
      connection.target === nodeId && connection.targetHandle === handleId
  );
};

/**
 * GET TRIGGER CONNECTIONS (TYPE-SAFE)
 * The FIXED version - uses proper handle ID instead of dataType
 */
export const getTriggerConnectionsSafe = (
  connections: TypeSafeConnection[],
  nodeId: NodeId
): Array<
  TypeSafeConnection & { readonly targetHandle: typeof HANDLE_IDS.TRIGGER }
> => {
  // This will ONLY work with the correct handle ID "trigger"
  // Attempting to use DATA_TYPES.BOOLEAN ("b") would cause a compile error!
  return getConnectionsByHandleId(connections, nodeId, HANDLE_IDS.TRIGGER);
};

/**
 * FILTER NON JSON CONNECTIONS (TYPE-SAFE)
 * Filters out JSON handle connections using proper handle ID
 */
export const filterNonJsonConnectionsSafe = (
  connections: TypeSafeConnection[]
): TypeSafeConnection[] => {
  return connections.filter(
    (connection) => connection.targetHandle !== HANDLE_IDS.JSON
  );
};

/**
 * GET OUTPUT CONNECTIONS (TYPE-SAFE)
 * Retrieves connections originating from a specific node
 */
export const getOutputConnectionsSafe = (
  connections: TypeSafeConnection[],
  nodeId: NodeId
): TypeSafeConnection[] => {
  return connections.filter((connection) => connection.source === nodeId);
};

// ============================================================================
// ADVANCED FILTERING UTILITIES
// ============================================================================

/**
 * FILTER CONNECTIONS BY PARAMS (TYPE-SAFE)
 * Advanced filtering with multiple criteria
 */
export const filterConnectionsByParams = (
  params: ConnectionFilterParams
): TypeSafeConnection[] => {
  let filtered = params.connections;

  // Filter by node ID (as target)
  filtered = filtered.filter((conn) => conn.target === params.nodeId);

  // Filter by specific handle ID if provided
  if (params.handleId) {
    filtered = filtered.filter((conn) => conn.targetHandle === params.handleId);
  }

  return filtered;
};

/**
 * GET TRIGGER CONNECTIONS WITH PARAMS
 * Enhanced trigger connection detection with validation
 */
export const getTriggerConnectionsWithParams = (
  params: TriggerConnectionParams
): TypeSafeConnection[] => {
  const triggerHandleId = params.triggerHandleId || HANDLE_IDS.TRIGGER;

  return getConnectionsByHandleId(
    params.connections,
    params.nodeId,
    triggerHandleId
  );
};

// ============================================================================
// VALIDATION AND ERROR CHECKING
// ============================================================================

/**
 * VALIDATE CONNECTION COMPATIBILITY
 * Checks if two handles can be connected based on data types
 */
export const validateConnectionCompatibility = (
  sourceHandle: { dataType: DataType },
  targetHandle: { dataType: DataType }
): boolean => {
  // Allow ANY type to connect to anything
  if (
    sourceHandle.dataType === DATA_TYPES.ANY ||
    targetHandle.dataType === DATA_TYPES.ANY
  ) {
    return true;
  }

  // Exact type match
  return sourceHandle.dataType === targetHandle.dataType;
};

/**
 * FIND INVALID CONNECTIONS
 * Detects connections that use incorrect handle references
 */
export const findInvalidConnections = (
  connections: Connection[]
): Array<{ connection: Connection; error: string }> => {
  const invalid: Array<{ connection: Connection; error: string }> = [];

  connections.forEach((conn) => {
    try {
      convertToTypeSafeConnection(conn);
    } catch (error) {
      invalid.push({
        connection: conn,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return invalid;
};

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * MIGRATE LEGACY CONNECTION FILTERS
 * Helps migrate from unsafe string comparisons to type-safe versions
 */
export const migrateLegacyConnectionFilter = (
  connections: Connection[],
  nodeId: string,
  legacyHandleCheck: string
): {
  safeTriggerConnections: TypeSafeConnection[];
  foundLegacyIssues: boolean;
  recommendations: string[];
} => {
  const safeConnections = convertConnectionsArray(connections);
  const safeNodeId = createNodeId(nodeId);
  const recommendations: string[] = [];
  let foundLegacyIssues = false;

  // Check if legacy code was looking for dataType instead of handle ID
  if (legacyHandleCheck === "b") {
    foundLegacyIssues = true;
    recommendations.push(
      'Replace connection.targetHandle === "b" with HANDLE_IDS.TRIGGER'
    );
    recommendations.push(
      "Use getTriggerConnectionsSafe() for type-safe trigger detection"
    );
  }

  // Get the correct trigger connections
  const safeTriggerConnections = getTriggerConnectionsSafe(
    safeConnections,
    safeNodeId
  );

  return {
    safeTriggerConnections,
    foundLegacyIssues,
    recommendations,
  };
};

// ============================================================================
// DEBUG AND DEVELOPMENT UTILITIES
// ============================================================================

/**
 * DEBUG CONNECTION MISMATCH
 * Helps debug connection filtering issues by showing expected vs actual
 */
export const debugConnectionMismatch = (
  connections: Connection[],
  nodeId: string,
  expectedHandleId: string
): {
  actualHandles: string[];
  expectedHandle: string;
  matchingConnections: number;
  suggestions: string[];
} => {
  const targetConnections = connections.filter(
    (conn) => conn.target === nodeId
  );
  const actualHandles = targetConnections
    .map((conn) => conn.targetHandle)
    .filter(
      (handle): handle is string => handle !== null && handle !== undefined
    );
  const matchingConnections = targetConnections.filter(
    (conn) => conn.targetHandle === expectedHandleId
  ).length;

  const suggestions: string[] = [];

  if (matchingConnections === 0 && actualHandles.length > 0) {
    suggestions.push(
      `No connections found for handle "${expectedHandleId}". Available handles: ${actualHandles.join(", ")}`
    );

    // Check for common mistakes
    if (expectedHandleId === "b" && actualHandles.includes("trigger")) {
      suggestions.push(
        'LIKELY BUG: You are looking for dataType "b" but should use handle ID "trigger"'
      );
      suggestions.push("Use HANDLE_IDS.TRIGGER instead of DATA_TYPES.BOOLEAN");
    }
  }

  return {
    actualHandles,
    expectedHandle: expectedHandleId,
    matchingConnections,
    suggestions,
  };
};

// ============================================================================
// TYPE EXAMPLES FOR DOCUMENTATION
// ============================================================================

/*
USAGE EXAMPLES:

// ❌ OLD (bug-prone):
const triggers = connections.filter(c => c.targetHandle === "b");

// ✅ NEW (type-safe):
const safeConnections = convertConnectionsArray(connections);
const triggers = getTriggerConnectionsSafe(safeConnections, createNodeId(nodeId));

// ❌ OLD (can mix up handle ID and dataType):
if (connection.targetHandle === DATA_TYPES.BOOLEAN) // Wrong!

// ✅ NEW (compile-time error prevention):
if (connection.targetHandle === HANDLE_IDS.TRIGGER) // Correct!

// The compiler will prevent you from using DATA_TYPES where HANDLE_IDS is expected
*/
