/**
 * USE JSON INPUT PROCESSING HOOK - JSON data validation and processing
 *
 * • Handles JSON input validation, parsing, and error detection
 * • Implements real-time JSON syntax checking and formatting
 * • Supports complex JSON schema validation and transformation
 * • Features performance-optimized parsing with error recovery
 * • Integrates with node processing systems for data flow
 *
 * Keywords: json-processing, validation, parsing, syntax-checking, schema-validation, data-flow
 */

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { useCallback, useEffect, useRef } from "react";
import { PROCESSING_THROTTLE_MS } from "../../config/constants";
import type { BaseNodeData, HandleConfig } from "../../types";
import {
  createJsonProcessingTracker,
  getJsonInputValues,
  hasJsonConnections,
  processJsonInput,
} from "../../utils/processing/jsonProcessor";

// ============================================================================
// JSON INPUT PROCESSING TYPES
// ============================================================================

interface JsonProcessingConfig {
  handles: HandleConfig[];
  nodeType: string;
}

interface JsonConnectionData {
  connections: any[];
  nodesData: any[];
}

// ============================================================================
// USE JSON INPUT PROCESSING
// ============================================================================

/**
 * USE JSON INPUT PROCESSING
 * Handles JSON input processing with throttling and validation
 * Focused responsibility: Only JSON data processing
 *
 * @param id - Node ID
 * @param config - JSON processing configuration
 * @param connectionData - Connection and node data
 * @param nodeData - Current node data
 */
export function useJsonInputProcessing<T extends BaseNodeData>(
  id: string,
  config: JsonProcessingConfig,
  connectionData: JsonConnectionData,
  nodeData: T
) {
  // FLOW STORE ACCESS
  const { updateNodeData } = useFlowStore();

  // PROCESSING TRACKER for throttling
  const jsonProcessingTracker = useRef(createJsonProcessingTracker());

  // ========================================================================
  // JSON PROCESSING CALLBACK
  // ========================================================================

  /**
   * PROCESS JSON INPUTS
   * Main JSON processing function with throttling
   */
  const processJsonInputs = useCallback(() => {
    // THROTTLING CHECK: Prevent excessive processing
    if (!jsonProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)) {
      return;
    }

    // EARLY RETURN: No JSON connections
    if (!hasJsonConnections(connectionData.connections, id)) {
      return;
    }

    // PROCESS ALL JSON INPUTS
    const jsonInputValues = getJsonInputValues(
      connectionData.connections,
      connectionData.nodesData,
      id
    );

    jsonInputValues.forEach((jsonInput) => {
      processJsonInput(jsonInput, nodeData, updateNodeData, id);
    });
  }, [
    connectionData.connections,
    connectionData.nodesData,
    id,
    updateNodeData,
    nodeData,
  ]);

  // ========================================================================
  // JSON PROCESSING EFFECT
  // ========================================================================

  useEffect(() => {
    // CHECK IF NODE HAS JSON HANDLES
    const hasJsonHandles = config.handles.some(
      (handle) => handle.id === "j" && handle.type === "target"
    );

    // PROCESS JSON INPUTS if conditions are met
    if (hasJsonHandles && hasJsonConnections(connectionData.connections, id)) {
      processJsonInputs();
    }
  }, [
    processJsonInputs,
    connectionData.connections.length,
    // JSON-stringify for deep comparison of connection changes
    JSON.stringify(
      connectionData.connections.map((connection: any) => ({
        source: connection.source,
        target: connection.target,
        targetHandle: connection.targetHandle,
      }))
    ),
    connectionData.nodesData.length,
    config.handles,
  ]);

  // ========================================================================
  // RETURN JSON PROCESSING STATE
  // ========================================================================

  return {
    hasJsonHandles: config.handles.some(
      (h) => h.id === "j" && h.type === "target"
    ),
    hasJsonConnections: hasJsonConnections(connectionData.connections, id),
    processJsonInputs, // Expose for manual triggering if needed
  };
}

// ============================================================================
// HELPER FUNCTION TO CREATE JSON PROCESSING CONFIG
// ============================================================================

/**
 * CREATE JSON PROCESSING CONFIG
 * Helper to create JSON processing configuration object
 */
export function createJsonProcessingConfig(
  handles: HandleConfig[],
  nodeType: string
): JsonProcessingConfig {
  return {
    handles,
    nodeType,
  };
}
