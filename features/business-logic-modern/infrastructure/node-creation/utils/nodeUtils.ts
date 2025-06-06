/**
 * NODE UTILITIES - Common functions for safe node data handling
 *
 * • Safe value extraction from node data with priority-based key lookup
 * • Value comparison utilities handling NaN, BigInt, and edge cases
 * • Input validation and truthiness checking for node connections
 * • Debounced update helpers for performance optimization
 * • Shared utilities for consistent node behavior across components
 * • Enhanced with superjson for complex data type serialization
 *
 * Keywords: node-data, value-extraction, validation, comparison, debouncing, superjson
 */

import superjson from "superjson";

/**
 * SHARED NODE UTILITIES
 * Common functions for safe input handling across all nodes
 */

// SAFE VALUE EXTRACTION
/**
 * Extract the primary value from node data using a priority order
 * Handles all common data keys used across different node types
 */
export const extractNodeValue = (nodeData: any): unknown => {
  if (!nodeData) return undefined;

  // Priority order for value extraction
  const keys = [
    "outputValue", // DelayNode and other processing nodes
    "triggered", // Trigger nodes
    "value", // Logic/Converter nodes
    "text", // Text nodes
    "count", // Counter nodes
    "enabled", // Toggle/Switch nodes
    "result", // Calculation nodes
  ] as const;

  for (const key of keys) {
    if (key in nodeData && nodeData[key] !== undefined) {
      return nodeData[key];
    }
  }

  return nodeData; // Fallback to entire data object
};

// SAFE COMPARISON UTILITIES
/**
 * Safe JSON stringify using superjson for comprehensive data type support
 * Handles BigInt, Date, Map, Set, and other complex types
 */
export const safeStringify = (obj: unknown): string => {
  try {
    return superjson.stringify(obj);
  } catch {
    return "null";
  }
};

/**
 * Safe value comparison that handles NaN, BigInt, and other edge cases
 */
export const valuesEqual = (a: unknown, b: unknown): boolean => {
  // Handle undefined/null cases
  if (a === undefined && b === undefined) return true;
  if (a === null && b === null) return true;
  if (a === undefined || b === undefined || a === null || b === null)
    return false;

  // Handle NaN specially (NaN !== NaN is always true)
  if (typeof a === "number" && typeof b === "number") {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (Number.isNaN(a) || Number.isNaN(b)) return false;
  }

  // Handle primitive types
  if (typeof a !== "object" || typeof b !== "object") {
    return a === b;
  }

  // Handle objects with safe serialization
  try {
    return safeStringify(a) === safeStringify(b);
  } catch {
    return a === b; // Fallback to reference comparison
  }
};

/**
 * Check if a value has changed from previous value
 */
export const hasValueChanged = (prev: unknown, current: unknown): boolean => {
  return !valuesEqual(prev, current);
};

// VALUE VALIDATION
/**
 * Check if a value is valid (not undefined, null, or NaN)
 */
export const isValidValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === "number" && Number.isNaN(value)) return false;
  return true;
};

/**
 * Check if a value represents a "truthy" state for boolean logic
 */
export const isTruthyValue = (value: unknown): boolean => {
  if (!isValidValue(value)) return false;

  // Handle boolean values
  if (typeof value === "boolean") return value;

  // Handle numbers (non-zero, non-NaN)
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);

  // Handle strings (non-empty, not "false" or "0")
  if (typeof value === "string") {
    return value.length > 0 && value !== "false" && value !== "0";
  }

  // Handle objects - check for common boolean properties
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if ("triggered" in obj) return Boolean(obj.triggered);
    if ("value" in obj) return Boolean(obj.value);
    if ("enabled" in obj) return Boolean(obj.enabled);
  }

  // Default: any other value is truthy
  return true;
};

// INPUT CONNECTION HELPERS
/**
 * Get input values from connected nodes with safe extraction
 */
export const getInputValues = (inputNodesData: any[]): unknown[] => {
  return inputNodesData
    .map((nodeData) => extractNodeValue(nodeData?.data))
    .filter(isValidValue);
};

/**
 * Get a single input value from the first connected node
 */
export const getSingleInputValue = (inputNodesData: any[]): unknown => {
  if (inputNodesData.length === 0) return undefined;
  return extractNodeValue(inputNodesData[0]?.data);
};

// DEBOUNCED UPDATE HELPER
/**
 * Create a debounced update function for node data
 */
export const createDebouncedUpdate = (
  updateNodeData: (id: string, data: any) => void,
  id: string,
  delay: number = 16
) => {
  let timeoutRef: ReturnType<typeof setTimeout> | null = null;

  return (data: any) => {
    if (timeoutRef) clearTimeout(timeoutRef);
    timeoutRef = setTimeout(() => {
      updateNodeData(id, data);
    }, delay);
  };
};
