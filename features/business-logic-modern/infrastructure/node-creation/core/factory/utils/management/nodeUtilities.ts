/**
 * NODE UTILITIES
 *
 * Provides comprehensive utility functions for node management and state operations.
 * Includes safety layer access, state validation, cleanup, and state machine integration.
 *
 * FEATURES:
 * • Enterprise safety layer access and management
 * • Node integrity validation and health checks
 * • Memory-safe cleanup and resource management
 * • State machine integration and control utilities
 * • Backward compatibility with legacy node systems
 * • Performance monitoring and debugging support
 *
 * UTILITY CATEGORIES:
 * • Safety Layer Access: Get and manage enterprise safety layers
 * • Node Validation: Validate node integrity and health status
 * • Node Management: Cleanup, state propagation, and lifecycle control
 * • State Machine: Node state queries and activation management
 *
 * @author Factory Node Utilities Team
 * @since v3.0.0
 * @keywords node-utilities, safety-layers, state-machine, validation, cleanup
 */

import { SafeDataFlowController, SafeStateLayer } from "../../providers";
import { NodeState } from "../../systems/propagation/UltraFastPropagationEngine";
import { debug } from "../../systems/safety";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Interface for propagation engine operations used in safety layers
 */
export interface PropagationEngineInterface {
  cleanupNode: (nodeId: string) => void;
  propagate: (
    nodeId: string,
    active: boolean,
    callback?: any,
    isButtonDriven?: boolean
  ) => void;
}

export interface NodeHealthStatus {
  /** Whether the node is healthy */
  isHealthy: boolean;
  /** Health check details */
  checks: {
    hasDataFlow: boolean;
    hasStateRegistration: boolean;
    hasValidActivation: boolean;
    hasCleanMemory: boolean;
  };
  /** Any health issues found */
  issues: string[];
  /** Performance metrics */
  metrics?: {
    responseTime: number;
    memoryUsage: number;
    lastActivity: string;
  };
}

export interface NodeCleanupResult {
  /** Whether cleanup was successful */
  success: boolean;
  /** Number of layers cleaned */
  layersCleaned: number;
  /** Cleanup duration in milliseconds */
  duration: number;
  /** Any cleanup errors */
  errors: string[];
}

export interface NodeStateInfo {
  /** Current node state */
  state: NodeState | undefined;
  /** Whether node is considered active */
  isActive: boolean;
  /** Whether node is in transition */
  isTransitioning: boolean;
  /** State metadata */
  metadata: {
    nodeId: string;
    lastUpdate: string;
    stateHistory?: NodeState[];
  };
}

// ============================================================================
// GLOBAL SAFETY LAYERS INSTANCE
// ============================================================================

/**
 * Global safety layers instance for backward compatibility
 * Provides access to enterprise safety layers across the application
 */
export const globalSafetyLayers = {
  state: new SafeStateLayer(),
  dataFlow: new SafeDataFlowController(),
  scheduler: undefined,
  parkingManager: undefined as any,
  propagationEngine: {
    // Safe wrapper for propagation engine operations
    cleanupNode: (nodeId: string): void => {
      debug(
        `Safe cleanup for node: ${nodeId} (propagation engine not initialized)`
      );
      // Placeholder - will be connected to actual propagation engine
    },
    propagate: (
      nodeId: string,
      active: boolean,
      callback?: any,
      isButtonDriven = true
    ): void => {
      debug(`Safe propagate for node ${nodeId}: ${active}`, {
        isButtonDriven,
      });
      // Placeholder - will be connected to actual propagation engine
    },
  } as PropagationEngineInterface,
  // State Machine Integration Methods (will be enhanced with actual implementations)
  getNodeState: (nodeId: string): NodeState | undefined => {
    debug(`Getting node state for: ${nodeId}`);
    return undefined; // Placeholder - will be connected to actual propagation engine
  },
  forceDeactivate: (nodeId: string): void => {
    debug(`Force deactivating node: ${nodeId}`);
    // Placeholder - will be connected to actual propagation engine
  },
  propagateUltraFast: (
    nodeId: string,
    active: boolean,
    isButtonDriven = true
  ): void => {
    debug(`Propagating state for node ${nodeId}: ${active}`, {
      isButtonDriven,
    });
    // Placeholder - will be connected to actual propagation engine
  },
};

// ============================================================================
// SAFETY LAYER ACCESS UTILITIES
// ============================================================================

/**
 * Get access to enterprise safety layers (backward compatibility)
 * @returns Global safety layers instance
 *
 * @example
 * ```typescript
 * const layers = getSafetyLayers();
 * layers.state.registerNode(nodeId, initialData, callback);
 * ```
 */
export function getSafetyLayers() {
  return globalSafetyLayers;
}

// ============================================================================
// NODE VALIDATION UTILITIES
// ============================================================================

/**
 * Validate node integrity across all safety layers with comprehensive health checks
 * @param nodeId - Node identifier to validate
 * @returns Detailed health status of the node
 *
 * @example
 * ```typescript
 * const health = validateNodeIntegrityEnhanced("node-123");
 * if (!health.isHealthy) {
 *   console.log("Issues found:", health.issues);
 * }
 * ```
 */
export function validateNodeIntegrityEnhanced(
  nodeId: string
): NodeHealthStatus {
  const startTime = performance.now();
  const { dataFlow, state } = globalSafetyLayers;

  const checks = {
    hasDataFlow: false,
    hasStateRegistration: false,
    hasValidActivation: false,
    hasCleanMemory: true, // Assume clean unless proven otherwise
  };

  const issues: string[] = [];

  try {
    // Check data flow state
    const dataFlowState = dataFlow.isNodeActiveForDataFlow(nodeId);
    checks.hasDataFlow = dataFlowState !== undefined;
    if (!checks.hasDataFlow) {
      issues.push("Node not registered in data flow system");
    }

    // Check state registration
    const nodeState = state.getState(nodeId);
    checks.hasStateRegistration = nodeState !== undefined;
    if (!checks.hasStateRegistration) {
      issues.push("Node not registered in state management system");
    }

    // Validate activation consistency
    if (checks.hasDataFlow && checks.hasStateRegistration) {
      checks.hasValidActivation = true;
    } else {
      issues.push("Inconsistent activation state across systems");
    }

    // Memory health check (simplified)
    const memoryUsage = process.memoryUsage?.()?.heapUsed || 0;
    if (memoryUsage > 500 * 1024 * 1024) {
      // 500MB threshold
      checks.hasCleanMemory = false;
      issues.push("High memory usage detected");
    }
  } catch (error) {
    issues.push(`Validation error: ${error}`);
    checks.hasCleanMemory = false;
  }

  const responseTime = performance.now() - startTime;
  const isHealthy = issues.length === 0 && Object.values(checks).every(Boolean);

  const healthStatus: NodeHealthStatus = {
    isHealthy,
    checks,
    issues,
    metrics: {
      responseTime,
      memoryUsage: process.memoryUsage?.()?.heapUsed || 0,
      lastActivity: new Date().toISOString(),
    },
  };

  debug(`Node integrity check for ${nodeId}`, {
    isHealthy,
    responseTime: responseTime.toFixed(2) + "ms",
    issueCount: issues.length,
  });

  return healthStatus;
}

/**
 * Legacy validation function for backward compatibility
 * @param nodeId - Node identifier to validate
 * @returns Whether the node is valid
 */
export function validateNodeIntegrity(nodeId: string): boolean {
  const health = validateNodeIntegrityEnhanced(nodeId);
  return health.isHealthy;
}

// ============================================================================
// NODE CLEANUP UTILITIES
// ============================================================================

/**
 * Cleanup all safety layers for a node with comprehensive error handling
 * @param nodeId - Node identifier to cleanup
 * @returns Cleanup result with detailed information
 *
 * @example
 * ```typescript
 * const result = cleanupNodeEnhanced("node-123");
 * if (!result.success) {
 *   console.log("Cleanup errors:", result.errors);
 * }
 * ```
 */
export function cleanupNodeEnhanced(nodeId: string): NodeCleanupResult {
  const startTime = performance.now();
  const { state, dataFlow, propagationEngine } = globalSafetyLayers;

  let layersCleaned = 0;
  const errors: string[] = [];

  try {
    // Cleanup propagation engine if available
    if (
      propagationEngine &&
      typeof propagationEngine.cleanupNode === "function"
    ) {
      propagationEngine.cleanupNode(nodeId);
      layersCleaned++;
      debug(`Propagation engine cleaned for node: ${nodeId}`);
    } else {
      debug(`Propagation engine not available for cleanup: ${nodeId}`);
    }
  } catch (error) {
    errors.push(`Propagation engine cleanup failed: ${error}`);
  }

  try {
    // Cleanup state layer
    state.cleanup(nodeId);
    layersCleaned++;
    debug(`State layer cleaned for node: ${nodeId}`);
  } catch (error) {
    errors.push(`State layer cleanup failed: ${error}`);
  }

  try {
    // Cleanup data flow layer
    dataFlow.cleanup(nodeId);
    layersCleaned++;
    debug(`Data flow layer cleaned for node: ${nodeId}`);
  } catch (error) {
    errors.push(`Data flow layer cleanup failed: ${error}`);
  }

  const duration = performance.now() - startTime;
  const success = errors.length === 0;

  const result: NodeCleanupResult = {
    success,
    layersCleaned,
    duration,
    errors,
  };

  debug(`Node cleanup completed for ${nodeId}`, {
    success,
    layersCleaned,
    duration: duration.toFixed(2) + "ms",
    errorCount: errors.length,
  });

  return result;
}

/**
 * Legacy cleanup function for backward compatibility
 * @param nodeId - Node identifier to cleanup
 */
export function cleanupNode(nodeId: string): void {
  cleanupNodeEnhanced(nodeId);
}

// ============================================================================
// STATE MACHINE UTILITIES
// ============================================================================

/**
 * Propagate node state with deterministic state machine logic and enhanced error handling
 * @param nodeId - Node to propagate from
 * @param active - Whether to activate or deactivate
 * @param isButtonDriven - Whether this is user-initiated (default: true)
 *
 * @example
 * ```typescript
 * propagateNodeState("node-1", true, true); // User clicked activate
 * propagateNodeState("node-2", false, false); // Auto-deactivation
 * ```
 */
export function propagateNodeState(
  nodeId: string,
  active: boolean,
  isButtonDriven: boolean = true
): void {
  try {
    const { propagateUltraFast } = globalSafetyLayers;

    debug(`Propagating state for node ${nodeId}: ${active}`, {
      isButtonDriven,
      timestamp: new Date().toISOString(),
    });

    propagateUltraFast(nodeId, active, isButtonDriven);

    // Update data flow state for consistency
    const { dataFlow } = globalSafetyLayers;
    dataFlow.setNodeActivation(nodeId, active);
  } catch (error) {
    debug(`Error propagating state for node ${nodeId}:`, error);
    throw new Error(`Failed to propagate state for node ${nodeId}: ${error}`);
  }
}

/**
 * Force deactivate a node (ignores multiple input logic) with enhanced error handling
 * @param nodeId - Node to force deactivate
 *
 * @example
 * ```typescript
 * forceDeactivateNode("node-1"); // Emergency stop
 * ```
 */
export function forceDeactivateNode(nodeId: string): void {
  try {
    const { forceDeactivate, dataFlow } = globalSafetyLayers;

    debug(`Force deactivating node: ${nodeId}`, {
      timestamp: new Date().toISOString(),
    });

    forceDeactivate(nodeId);

    // Ensure data flow consistency
    dataFlow.setNodeActivation(nodeId, false);
  } catch (error) {
    debug(`Error force deactivating node ${nodeId}:`, error);
    throw new Error(`Failed to force deactivate node ${nodeId}: ${error}`);
  }
}

/**
 * Get detailed node state information with metadata
 * @param nodeId - Node to check
 * @returns Detailed node state information
 *
 * @example
 * ```typescript
 * const info = getNodeStateInfo("node-1");
 * console.log(`Node is ${info.isActive ? 'active' : 'inactive'}`);
 * ```
 */
export function getNodeStateInfo(nodeId: string): NodeStateInfo {
  const { getNodeState } = globalSafetyLayers;
  const state = getNodeState(nodeId);

  // Import NodeState enum for comparison
  const NodeState = {
    ACTIVE: "ACTIVE" as const,
    INACTIVE: "INACTIVE" as const,
    PENDING_ACTIVATION: "PENDING_ACTIVATION" as const,
    PENDING_DEACTIVATION: "PENDING_DEACTIVATION" as const,
  };

  const isActive =
    state === NodeState.ACTIVE || state === NodeState.PENDING_DEACTIVATION;
  const isTransitioning =
    state === NodeState.PENDING_ACTIVATION ||
    state === NodeState.PENDING_DEACTIVATION;

  return {
    state,
    isActive,
    isTransitioning,
    metadata: {
      nodeId,
      lastUpdate: new Date().toISOString(),
      // stateHistory could be added with actual state machine integration
    },
  };
}

/**
 * Get current state machine state of a node (legacy compatibility)
 * @param nodeId - Node to check
 * @returns Current NodeState or undefined if not found
 *
 * @example
 * ```typescript
 * const state = getNodeState("node-1");
 * if (state === NodeState.ACTIVE) { ... }
 * ```
 */
export function getNodeState(nodeId: string): NodeState | undefined {
  const info = getNodeStateInfo(nodeId);
  return info.state;
}

/**
 * Check if a node is in an active state (ACTIVE or PENDING_DEACTIVATION)
 * @param nodeId - Node to check
 * @returns True if node is considered active
 *
 * @example
 * ```typescript
 * if (isNodeActive("node-1")) {
 *   // Node is processing data
 * }
 * ```
 */
export function isNodeActive(nodeId: string): boolean {
  const info = getNodeStateInfo(nodeId);
  return info.isActive;
}

// ============================================================================
// UTILITY SUMMARY AND METRICS
// ============================================================================

/**
 * Get summary of all utility function usage
 * @returns Summary statistics
 */
export function getNodeUtilitiesStats() {
  return {
    globalSafetyLayersInitialized: !!globalSafetyLayers,
    availableUtilities: [
      "getSafetyLayers",
      "validateNodeIntegrity",
      "cleanupNode",
      "propagateNodeState",
      "forceDeactivateNode",
      "getNodeState",
      "isNodeActive",
    ],
    enhancedUtilities: [
      "validateNodeIntegrityEnhanced",
      "cleanupNodeEnhanced",
      "getNodeStateInfo",
    ],
    timestamp: new Date().toISOString(),
  };
}
