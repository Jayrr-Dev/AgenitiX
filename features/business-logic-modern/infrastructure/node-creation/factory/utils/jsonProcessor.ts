/**
 * JSON PROCESSOR UTILITY - Advanced JSON processing and validation system
 *
 * • Provides comprehensive JSON parsing, validation, and transformation
 * • Implements error-tolerant JSON processing with recovery mechanisms
 * • Supports schema validation and complex data structure handling
 * • Features performance-optimized parsing with caching capabilities
 * • Integrates with factory systems for seamless data processing
 *
 * Keywords: json-processing, validation, transformation, error-recovery, schema-validation, caching
 */

import { Position } from "@xyflow/react";
import type { BaseNodeData, HandleConfig } from "../types";

// ============================================================================
// JSON INPUT UTILITIES
// ============================================================================

/**
 * ADD JSON INPUT SUPPORT
 * Universal helper to add JSON input support to any node
 * This allows nodes to be programmatically updated via JSON data
 */
export const addJsonInputSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  // Check if node already has a JSON input handle
  const hasJsonInput = handles.some(
    (h: HandleConfig) => h.type === "target" && h.dataType === "j"
  );

  if (!hasJsonInput) {
    // Check for handle ID conflicts and generate unique ID
    const existingIds = handles.map((h) => h.id);
    let jsonInputId = "j";

    // If 'j' is already used, try alternative IDs
    if (existingIds.includes("j")) {
      const alternatives = ["json", "j_in", "j_input", "json_in"];
      jsonInputId =
        alternatives.find((id) => !existingIds.includes(id)) ||
        `j_${Date.now()}`;

      console.log(
        `🔧 Handle ID conflict detected: 'j' already exists. Using '${jsonInputId}' for JSON input handle.`
      );
    }

    // Add a JSON input handle positioned at the top center with unique ID
    return [
      ...handles,
      {
        id: jsonInputId,
        dataType: "j",
        position: Position.Top,
        type: "target",
      },
    ];
  }

  return handles;
};

/**
 * VALIDATE JSON INPUT
 * Validates that JSON input is a proper object
 */
export const validateJsonInput = (jsonData: any, nodeId: string): boolean => {
  if (
    typeof jsonData === "object" &&
    jsonData !== null &&
    !Array.isArray(jsonData)
  ) {
    return true;
  }

  if (typeof jsonData === "string") {
    try {
      const parsed = JSON.parse(jsonData);
      return (
        typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      );
    } catch {
      return false;
    }
  }

  console.warn(
    `validateJsonInput ${nodeId}: Invalid JSON input type:`,
    typeof jsonData
  );
  return false;
};

/**
 * PARSE JSON SAFELY
 * Safely parses JSON input with error handling
 */
export const parseJsonSafely = (jsonData: any, nodeId: string): any | null => {
  try {
    // Handle different JSON input types
    if (
      typeof jsonData === "object" &&
      jsonData !== null &&
      !Array.isArray(jsonData)
    ) {
      return jsonData;
    }

    if (typeof jsonData === "string") {
      const parsed = JSON.parse(jsonData);

      // Validate object structure
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        console.warn(
          `parseJsonSafely ${nodeId}: JSON input must be an object, got:`,
          typeof parsed
        );
        return null;
      }

      return parsed;
    }

    console.warn(
      `parseJsonSafely ${nodeId}: Invalid JSON input type:`,
      typeof jsonData
    );
    return null;
  } catch (error) {
    console.error(`parseJsonSafely ${nodeId}: Failed to parse JSON:`, error);
    return null;
  }
};

/**
 * SANITIZE JSON DATA
 * Removes unsafe properties from JSON data
 */
export const sanitizeJsonData = (jsonData: any): any => {
  if (typeof jsonData !== "object" || jsonData === null) {
    return {};
  }

  // Filter out unsafe properties
  const { error: _, ...safeData } = jsonData;
  return safeData;
};

/**
 * DETECT JSON CHANGES
 * Efficiently detects if JSON data contains meaningful changes
 */
export const detectJsonChanges = <T extends BaseNodeData>(
  newData: any,
  currentData: T
): boolean => {
  return Object.keys(newData).some((key) => {
    const newValue = newData[key];
    const currentValue = currentData[key];

    if (typeof newValue === "object" && typeof currentValue === "object") {
      return JSON.stringify(newValue) !== JSON.stringify(currentValue);
    }
    return newValue !== currentValue;
  });
};

/**
 * PROCESS JSON INPUT
 * Process JSON input and update node data safely
 * This is automatically handled by the factory, but can be used manually if needed
 */
export const processJsonInput = <T extends BaseNodeData>(
  jsonData: any,
  currentData: T,
  updateNodeData: (id: string, updates: Partial<T>) => void,
  nodeId: string
): boolean => {
  // Validate JSON input
  if (!validateJsonInput(jsonData, nodeId)) {
    return false;
  }

  // Parse JSON safely
  const parsedData = parseJsonSafely(jsonData, nodeId);
  if (!parsedData) {
    return false;
  }

  // Sanitize data
  const safeData = sanitizeJsonData(parsedData);

  // Check for meaningful changes
  const hasChanges = detectJsonChanges(safeData, currentData);

  if (hasChanges) {
    console.log(`processJsonInput ${nodeId}: Applying JSON data:`, safeData);
    updateNodeData(nodeId, safeData as Partial<T>);
    return true;
  }

  return false;
};

// ============================================================================
// JSON CONNECTION UTILITIES
// ============================================================================

/**
 * GET JSON CONNECTIONS
 * Gets all JSON input connections for a node
 * Now handles dynamic JSON input handle IDs
 */
export const getJsonConnections = (connections: any[], nodeId: string) => {
  return connections.filter(
    (conn) =>
      conn.target === nodeId &&
      (conn.targetHandle === "j" ||
        conn.targetHandle === "json" ||
        conn.targetHandle === "j_in" ||
        conn.targetHandle === "j_input" ||
        conn.targetHandle === "json_in" ||
        conn.targetHandle?.startsWith("j_")) // Handle timestamp-based IDs
  );
};

/**
 * GET JSON INPUT VALUES
 * Extracts JSON input values from connected nodes
 */
export const getJsonInputValues = (
  connections: any[],
  nodesData: any[],
  nodeId: string
) => {
  const jsonConnections = getJsonConnections(connections, nodeId);

  return jsonConnections
    .map((conn) => {
      const sourceNode = nodesData.find((n) => n.id === conn.source);
      return (
        sourceNode?.data?.output ||
        sourceNode?.data?.value ||
        sourceNode?.data?.result
      );
    })
    .filter(Boolean);
};

/**
 * HAS JSON CONNECTIONS
 * Checks if a node has any JSON input connections
 * Now handles dynamic JSON input handle IDs
 */
export const hasJsonConnections = (
  connections: any[],
  nodeId: string
): boolean => {
  return connections.some(
    (conn) =>
      conn.target === nodeId &&
      (conn.targetHandle === "j" ||
        conn.targetHandle === "json" ||
        conn.targetHandle === "j_in" ||
        conn.targetHandle === "j_input" ||
        conn.targetHandle === "json_in" ||
        conn.targetHandle?.startsWith("j_")) // Handle timestamp-based IDs
  );
};

// ============================================================================
// PROCESSING TIMING UTILITIES
// ============================================================================

/**
 * CREATE JSON PROCESSING TRACKER
 * Creates a processing timestamp tracker for infinite loop prevention
 */
export const createJsonProcessingTracker = () => {
  let lastProcessTime = 0;

  return {
    shouldProcess: (minInterval = 5): boolean => {
      const now = Date.now();
      if (lastProcessTime && now - lastProcessTime < minInterval) {
        return false;
      }
      lastProcessTime = now;
      return true;
    },
    reset: (): void => {
      lastProcessTime = 0;
    },
  };
};
