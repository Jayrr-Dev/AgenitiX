/**
 * SCALABLE HANDLE OUTPUT UTILITIES
 *
 * Utilities for automatically generating handle-specific output for nodes
 * with multiple output handles. This enables ViewBoolean and other input nodes
 * to read from specific handles without manual mapping.
 *
 * Keywords: handle-output, scalable, multi-handle, dynamic-mapping
 */

import type { NodeSpec } from "../NodeSpec";

/**
 * CLEAN HANDLE OUTPUT SYSTEM
 * Auto-generates Map output with smart ID normalization and robust error handling
 */

/**
 * Generate output Map for any node
 * @param spec - Node specification
 * @param nodeData - Current node data
 * @returns Map<handleId, value> for all source handles (empty Map on error)
 */
export function generateHandleoutput(
  spec: NodeSpec,
  nodeData: Record<string, any>
): Map<string, any> {
  const output = new Map<string, any>();

  try {
    // Validate inputs
    if (!spec) {
      console.warn("generateHandleoutput: spec is null/undefined");
      return output;
    }

    if (!nodeData) {
      console.warn("generateHandleoutput: nodeData is null/undefined");
      return output;
    }

    // Safe handle extraction with fallback
    const sourceHandles =
      spec.handles?.filter((h) => h?.type === "source") || [];

    if (sourceHandles.length === 0) {
      // Not an error - node might have no output handles
      return output;
    }

    sourceHandles.forEach((handle) => {
      try {
        if (!handle?.id) {
          console.warn("generateHandleoutput: handle missing id", handle);
          return; // Skip this handle
        }

        const cleanId = normalizeHandleId(handle.id);
        const value = nodeData[handle.id];

        // Only set if value exists (including falsy values like false, 0, "")
        if (value !== undefined && value !== null) {
          output.set(cleanId, value);
        }
      } catch (handleError) {
        console.error(
          "generateHandleoutput: Error processing handle",
          handle,
          handleError
        );
        // Continue processing other handles
      }
    });
  } catch (error) {
    console.error("generateHandleoutput: Critical error", error, {
      spec,
      nodeData,
    });
    // Return empty Map to prevent crashes
  }

  return output;
}

/**
 * Normalize handle IDs to clean, consistent format
 * @param id - Original handle ID from spec or React Flow
 * @returns Clean, normalized ID (fallback to original on error)
 */
export function normalizeHandleId(id: string): string {
  try {
    // Validate input
    if (typeof id !== "string") {
      console.warn("normalizeHandleId: id is not a string", id);
      return String(id || ""); // Convert to string as fallback
    }

    if (id.trim() === "") {
      console.warn("normalizeHandleId: id is empty string");
      return "unknown"; // Fallback ID
    }

    // Remove React Flow suffixes first
    const baseId = id.split("__")[0].split("-")[0];

    if (!baseId) {
      console.warn("normalizeHandleId: baseId is empty after parsing", id);
      return id; // Return original if parsing fails
    }

    // Apply consistent naming patterns with safe string operations
    const normalized = baseId
      .replace(/Output$/, "") // "topOutput" -> "top"
      .replace(/Input$/, "") // "booleanInput" -> "boolean"
      .replace(/^boolean$/, "input") // "boolean" -> "input" (for clarity)
      .toLowerCase(); // Ensure lowercase

    // Validate result
    if (normalized.trim() === "") {
      console.warn("normalizeHandleId: normalized ID is empty", id);
      return id.toLowerCase(); // Return lowercased original
    }

    return normalized;
  } catch (error) {
    console.error("normalizeHandleId: Error normalizing ID", id, error);
    return String(id || "unknown"); // Safe fallback
  }
}

/**
 * Generate output field - alias for consistency
 */
export const generateoutputField = generateHandleoutput;
