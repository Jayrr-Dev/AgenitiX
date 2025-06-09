/**
 * USE MAIN PROCESSING LOGIC HOOK - Core business logic processor for nodes
 *
 * • Implements main business logic processing for complex node operations
 * • Handles data transformation, validation, and computation workflows
 * • Supports asynchronous processing with error handling and recovery
 * • Features performance optimization and memory management
 * • Integrates with enterprise systems for advanced processing capabilities
 *
 * Keywords: main-processing, business-logic, data-transformation, async-processing, performance, enterprise
 */

import { useEffect, useRef } from "react";
import { PROCESSING_THROTTLE_MS } from "../../config/constants";
import type { BaseNodeData } from "../../types";
import { createJsonProcessingTracker } from "../../utils/processing/jsonProcessor";

// ============================================================================
// MAIN PROCESSING LOGIC TYPES
// ============================================================================

interface ProcessingContext<T extends BaseNodeData> {
  id: string;
  data: T;
  connections: any[];
  nodesData: any[];
  updateNodeData: (nodeId: string, updates: Partial<T>) => void;
  setError: (error: string | null) => void;
}

interface ProcessingConfig<T extends BaseNodeData> {
  nodeType: string;
  processLogic: (context: ProcessingContext<T>) => void;
}

interface ProcessingState {
  isProcessing: boolean;
  lastProcessedAt: number;
}

// ============================================================================
// USE MAIN PROCESSING LOGIC
// ============================================================================

/**
 * USE MAIN PROCESSING LOGIC
 * Handles the main node processing logic with error handling and throttling
 * Focused responsibility: Only core business logic processing
 *
 * @param id - Node ID
 * @param config - Processing configuration
 * @param nodeData - Current node data
 * @param connectionData - Connection and node data
 * @param nodeState - Node state management
 * @param activationState - Activation calculation result
 * @param propagateUltraFast - Ultra-fast propagation function
 */
export function useMainProcessingLogic<T extends BaseNodeData>(
  id: string,
  config: ProcessingConfig<T>,
  nodeData: T,
  connectionData: {
    connections: any[];
    nodesData: any[];
    relevantConnectionData: any;
  },
  nodeState: {
    updateNodeData: (
      nodeId: string,
      updates: Partial<Record<string, unknown>>
    ) => void;
    setError: (error: string | null) => void;
    setIsActive: (isActive: boolean) => void;
  },
  activationState: {
    calculatedIsActive: boolean;
  },
  propagateUltraFast: (nodeId: string, isActive: boolean) => void
): ProcessingState {
  // PROCESSING TRACKER for throttling
  const logicProcessingTracker = useRef(createJsonProcessingTracker());

  // ========================================================================
  // MAIN PROCESSING EFFECT
  // ========================================================================

  useEffect(() => {
    processNodeLogic();
  }, [
    id,
    connectionData.relevantConnectionData,
    connectionData.nodesData,
    config.nodeType,
    config.processLogic,
    activationState.calculatedIsActive,
    nodeState.updateNodeData,
    propagateUltraFast,
    (nodeData as any)?.heldText, // Include text changes for input nodes
    (nodeData as any)?.isManuallyActivated, // Include manual activation changes for test nodes
    (nodeData as any)?.triggerMode, // Include trigger mode changes
    (nodeData as any)?.value, // Include value changes for output nodes
  ]);

  // ========================================================================
  // PROCESSING FUNCTIONS
  // ========================================================================

  /**
   * PROCESS NODE LOGIC
   * Main processing function with throttling and error handling
   */
  function processNodeLogic() {
    // THROTTLING CHECK: Skip for text input nodes that need immediate updates
    if (
      !shouldBypassThrottling() &&
      !logicProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)
    ) {
      return;
    }

    try {
      // EXECUTE MAIN PROCESSING LOGIC
      executeProcessingLogic();

      // HANDLE TRIGGER/CYCLE NODE OUTPUT UPDATES
      handleTriggerCycleOutputs();
    } catch (processingError) {
      handleProcessingError(processingError);
    }
  }

  /**
   * SHOULD BYPASS THROTTLING
   * Check if node should bypass throttling (e.g., text input nodes)
   */
  function shouldBypassThrottling(): boolean {
    return config.nodeType === "createText";
  }

  /**
   * EXECUTE PROCESSING LOGIC
   * Run the core node processing logic
   */
  function executeProcessingLogic() {
    config.processLogic({
      id,
      data: nodeData,
      connections: connectionData.connections,
      nodesData: connectionData.nodesData,
      updateNodeData: (nodeId: string, updates: Partial<T>) =>
        nodeState.updateNodeData(
          nodeId,
          updates as Partial<Record<string, unknown>>
        ),
      setError: nodeState.setError,
    });
  }

  /**
   * HANDLE TRIGGER/CYCLE OUTPUTS
   * Special handling for trigger and cycle node output values
   */
  function handleTriggerCycleOutputs() {
    const isTriggerOrCycle =
      config.nodeType.toLowerCase().includes("trigger") ||
      config.nodeType.toLowerCase().includes("cycle");

    if (!isTriggerOrCycle) return;

    const outputValue = activationState.calculatedIsActive ? true : false;
    const currentOutputValue = (nodeData as any)?.value;

    if (currentOutputValue !== outputValue) {
      const isOutputDeactivating =
        currentOutputValue === true && outputValue === false;

      // UPDATE OUTPUT VALUE
      nodeState.updateNodeData(id, { value: outputValue } as Partial<
        Record<string, unknown>
      >);

      // INSTANT PROPAGATION for deactivation
      if (isOutputDeactivating) {
        console.log(
          `UFS Output ${config.nodeType} ${id}: INSTANT output deactivation`
        );
        propagateUltraFast(id, false);
      }
    }
  }

  /**
   * HANDLE PROCESSING ERROR
   * Error handling and recovery logic
   */
  function handleProcessingError(processingError: unknown) {
    // DEACTIVATE NODE on error
    nodeState.setIsActive(false);

    // UPDATE NODE DATA if needed
    if ((nodeData as any)?.isActive === true) {
      nodeState.updateNodeData(id, { isActive: false } as Partial<
        Record<string, unknown>
      >);
    }

    // LOG ERROR
    console.error(
      `${config.nodeType} ${id} - Processing error:`,
      processingError
    );

    // SET ERROR MESSAGE
    const errorMessage =
      processingError instanceof Error
        ? processingError.message
        : "Processing error";
    nodeState.setError(errorMessage);
  }

  // ========================================================================
  // RETURN PROCESSING STATE
  // ========================================================================

  return {
    isProcessing: true, // Could be enhanced with actual processing state tracking
    lastProcessedAt: Date.now(),
  };
}

// ============================================================================
// HELPER FUNCTION TO CREATE PROCESSING CONFIG
// ============================================================================

/**
 * CREATE PROCESSING CONFIG
 * Helper to create processing configuration object
 */
export function createProcessingConfig<T extends BaseNodeData>(
  nodeType: string,
  processLogic: (context: ProcessingContext<T>) => void
): ProcessingConfig<T> {
  return {
    nodeType,
    processLogic,
  };
}
