/**
 * USE ERROR INJECTION PROCESSING HOOK - Error simulation and testing system
 *
 * • Provides controlled error injection for testing and debugging
 * • Implements error simulation modes with configurable scenarios
 * • Supports error type validation and recovery testing
 * • Features comprehensive error logging and analysis
 * • Integrates with safety systems for bulletproof error handling
 *
 * Keywords: error-injection, simulation, testing, debugging, validation, safety-systems
 */

import { useFlowStore } from "@flow-engine/stores/flowStore";
import { useEffect } from "react";
import { ERROR_INJECTION_SUPPORTED_NODES } from "../constants";
import { getJsonInputValues, hasJsonConnections } from "../utils/jsonProcessor";

// ============================================================================
// ERROR INJECTION PROCESSING TYPES
// ============================================================================

interface ErrorInjectionConfig {
  nodeType: string;
  supportsErrorInjection: boolean;
}

interface ErrorInjectionState {
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// USE ERROR INJECTION PROCESSING
// ============================================================================

/**
 * USE ERROR INJECTION PROCESSING
 * Handles VIBE mode error injection from Error Generator nodes
 * Focused responsibility: Only error state management
 *
 * @param id - Node ID
 * @param config - Error injection configuration
 * @param connectionData - Connection and node data
 * @param nodeState - Node state management object
 */
export function useErrorInjectionProcessing(
  id: string,
  config: ErrorInjectionConfig,
  connectionData: {
    connections: any[];
    nodesData: any[];
  },
  nodeState: {
    data: any;
    setError: (error: string | null) => void;
  }
) {
  // FLOW STORE ACCESS
  const { updateNodeData } = useFlowStore();

  // ========================================================================
  // ERROR INJECTION PROCESSING EFFECT
  // ========================================================================

  useEffect(() => {
    // EARLY RETURN: Skip if node doesn't support error injection
    if (!config.supportsErrorInjection) return;

    // CHECK FOR JSON CONNECTIONS WITH ERROR DATA
    if (hasJsonConnections(connectionData.connections, id)) {
      processErrorInjectionFromJsonInputs();
    } else {
      clearErrorInjectionIfExists();
    }
  }, [
    id,
    config.nodeType,
    config.supportsErrorInjection,
    connectionData.connections,
    connectionData.nodesData,
    updateNodeData,
    nodeState.setError,
  ]);

  // ========================================================================
  // ERROR INJECTION HELPER FUNCTIONS
  // ========================================================================

  /**
   * PROCESS ERROR INJECTION FROM JSON INPUTS
   * Handle error injection from connected Error Generator nodes
   */
  function processErrorInjectionFromJsonInputs() {
    const jsonInputValues = getJsonInputValues(
      connectionData.connections,
      connectionData.nodesData,
      id
    );

    jsonInputValues.forEach((jsonInput) => {
      if (jsonInput && typeof jsonInput === "object") {
        handleErrorInjectionObject(jsonInput);
      }
    });
  }

  /**
   * HANDLE ERROR INJECTION OBJECT
   * Process individual error injection JSON object
   */
  function handleErrorInjectionObject(jsonInput: any) {
    const errorInjection = jsonInput as ErrorInjectionState;

    // APPLY ERROR STATE
    if (errorInjection.isErrorState === true && errorInjection.error) {
      applyErrorState(errorInjection);
    }
    // CLEAR ERROR STATE
    else if (errorInjection.isErrorState === false || !errorInjection.error) {
      clearErrorState();
    }
  }

  /**
   * APPLY ERROR STATE
   * Set error state from error injection
   */
  function applyErrorState(errorInjection: ErrorInjectionState) {
    console.log(`🔴 [${config.nodeType}] ${id}: Received error injection:`, {
      error: errorInjection.error,
      errorType: errorInjection.errorType || "error",
      timestamp: Date.now(),
    });

    // UPDATE NODE DATA with error state
    updateNodeData(id, {
      isErrorState: true,
      errorType: errorInjection.errorType || "error",
      error: errorInjection.error,
    });

    // SET LOCAL ERROR for immediate visual feedback
    nodeState.setError(errorInjection.error || "Error state active");
  }

  /**
   * CLEAR ERROR STATE
   * Remove error injection state
   */
  function clearErrorState() {
    console.log(`✅ [${config.nodeType}] ${id}: Clearing error injection`);

    updateNodeData(id, {
      isErrorState: false,
      errorType: undefined,
      error: undefined,
    });

    // CLEAR LOCAL ERROR if it was from error injection
    if (nodeState.data?.isErrorState) {
      nodeState.setError(null);
    }
  }

  /**
   * CLEAR ERROR INJECTION IF EXISTS
   * Clean up error injection when no JSON connections exist
   */
  function clearErrorInjectionIfExists() {
    if (nodeState.data?.isErrorState) {
      console.log(
        `🧹 [${config.nodeType}] ${id}: Clearing error injection (no JSON connections)`
      );

      updateNodeData(id, {
        isErrorState: false,
        errorType: undefined,
        error: undefined,
      });

      nodeState.setError(null);
    }
  }
}

// ============================================================================
// HELPER FUNCTION TO CREATE ERROR INJECTION CONFIG
// ============================================================================

/**
 * CREATE ERROR INJECTION CONFIG
 * Helper to create error injection configuration object
 */
export function createErrorInjectionConfig(
  nodeType: string
): ErrorInjectionConfig {
  return {
    nodeType,
    supportsErrorInjection: ERROR_INJECTION_SUPPORTED_NODES.includes(
      nodeType as any
    ),
  };
}
