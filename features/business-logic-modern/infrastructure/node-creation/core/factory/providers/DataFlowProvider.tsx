/**
 * DATA FLOW PROVIDER
 *
 * Provides comprehensive data flow management for inter-node communication in the factory system.
 * Handles activation states, flow validation, and performance optimization for large-scale networks.
 *
 * FEATURES:
 * • Memory-efficient data flow tracking with WeakMap
 * • Garbage collection-safe node activation management
 * • Flow validation and debugging utilities
 * • Performance monitoring and metrics collection
 * • Context-based flow state sharing across components
 * • Type-safe data flow handling with comprehensive validation
 *
 * DATA FLOW BENEFITS:
 * • Prevents memory leaks through WeakMap usage
 * • Efficient inter-node communication tracking
 * • Comprehensive flow validation and debugging
 * • Performance optimization through batched updates
 * • Context-aware flow management with React integration
 *
 * @author Factory Data Flow Team
 * @since v3.0.0
 * @keywords data-flow, inter-node-communication, memory-efficiency, validation, providers
 */

"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { debug } from "../systems";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface DataFlowMetrics {
  /** Total number of active nodes */
  activeNodeCount: number;
  /** Total number of registered nodes */
  totalNodeCount: number;
  /** Number of flow validations performed */
  validationCount: number;
  /** Number of flow validation failures */
  validationFailures: number;
  /** Number of active data connections */
  activeConnections: number;
  /** Average validation time in milliseconds */
  averageValidationTime: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
}

export interface FlowValidationResult {
  /** Whether the flow is valid */
  isValid: boolean;
  /** Validation failure reason if invalid */
  reason?: string;
  /** Source node activation state */
  sourceActive: boolean;
  /** Target node activation state */
  targetActive: boolean;
  /** Additional validation metadata */
  metadata?: Record<string, any>;
}

export interface DataFlowContextValue {
  /** Set node activation state */
  setNodeActivation: (nodeId: string, isActive: boolean) => void;

  /** Check if node is active for data flow */
  isNodeActiveForDataFlow: (nodeId: string) => boolean;

  /** Validate data flow between nodes */
  validateDataFlow: (
    sourceId: string,
    targetId: string
  ) => FlowValidationResult;

  /** Cleanup data flow state for a node */
  cleanup: (nodeId: string) => void;

  /** Get current data flow metrics */
  getMetrics: () => DataFlowMetrics;

  /** Reset all metrics */
  resetMetrics: () => void;

  /** Get all active node IDs */
  getActiveNodes: () => string[];

  /** Bulk activation update for performance */
  bulkSetActivation: (activations: Record<string, boolean>) => void;
}

// ============================================================================
// ENHANCED DATA FLOW CONTROLLER
// ============================================================================

/**
 * Enhanced data flow controller with comprehensive flow management capabilities
 * Manages inter-node communication with memory safety and performance optimization
 */
export class SafeDataFlowController {
  private nodeActivations = new WeakMap<object, boolean>(); // WeakMap for GC safety
  private nodeIdMap = new Map<string, object>(); // ID to object mapping
  private nodeStateMap = new Map<string, boolean>(); // For metrics and debugging

  // Performance metrics
  private metrics: DataFlowMetrics = {
    activeNodeCount: 0,
    totalNodeCount: 0,
    validationCount: 0,
    validationFailures: 0,
    activeConnections: 0,
    averageValidationTime: 0,
    memoryUsage: 0,
  };

  private validationTimes: number[] = [];

  /**
   * Set node activation state
   * @param nodeId - Node identifier
   * @param isActive - Whether the node should be active
   */
  setNodeActivation(nodeId: string, isActive: boolean): void {
    let nodeKey = this.nodeIdMap.get(nodeId);
    if (!nodeKey) {
      nodeKey = { id: nodeId }; // Create unique object key
      this.nodeIdMap.set(nodeId, nodeKey);
      this.metrics.totalNodeCount++;
    }

    // Update WeakMap (memory-safe)
    this.nodeActivations.set(nodeKey, isActive);

    // Update state map for metrics
    const wasActive = this.nodeStateMap.get(nodeId);
    this.nodeStateMap.set(nodeId, isActive);

    // Update active count
    if (isActive && !wasActive) {
      this.metrics.activeNodeCount++;
    } else if (!isActive && wasActive) {
      this.metrics.activeNodeCount--;
    }

    this.updateMemoryUsage();

    debug(`Node activation updated: ${nodeId} -> ${isActive}`, {
      totalNodes: this.metrics.totalNodeCount,
      activeNodes: this.metrics.activeNodeCount,
    });
  }

  /**
   * Check if node is active for data flow
   * @param nodeId - Node identifier
   * @returns Whether the node is active
   */
  isNodeActiveForDataFlow(nodeId: string): boolean {
    const nodeKey = this.nodeIdMap.get(nodeId);
    return nodeKey ? this.nodeActivations.get(nodeKey) === true : false;
  }

  /**
   * Enhanced data flow validation with detailed results
   * @param sourceId - Source node identifier
   * @param targetId - Target node identifier
   * @returns Detailed validation result
   */
  validateDataFlow(sourceId: string, targetId: string): FlowValidationResult {
    const startTime = performance.now();

    const sourceActive = this.isNodeActiveForDataFlow(sourceId);
    const targetActive = this.isNodeActiveForDataFlow(targetId);

    let isValid = true;
    let reason: string | undefined;

    // Primary validation: source must be active
    if (!sourceActive) {
      isValid = false;
      reason = `Source node '${sourceId}' is not active`;
    }

    // Secondary validation: target should exist (optional check)
    if (isValid && !this.nodeIdMap.has(targetId)) {
      debug(`Data flow warning: target node '${targetId}' not registered`);
    }

    // Update metrics
    this.metrics.validationCount++;
    if (!isValid) {
      this.metrics.validationFailures++;
    }

    const validationTime = performance.now() - startTime;
    this.updateValidationMetrics(validationTime);

    const result: FlowValidationResult = {
      isValid,
      reason,
      sourceActive,
      targetActive,
      metadata: {
        validationTime,
        timestamp: Date.now(),
      },
    };

    if (!isValid) {
      debug(`Data flow blocked: ${sourceId} → ${targetId} (${reason})`);
    }

    return result;
  }

  /**
   * Legacy validation method for backward compatibility
   * @param sourceId - Source node identifier
   * @param targetId - Target node identifier
   * @returns Whether the flow is valid
   */
  validateDataFlowLegacy(sourceId: string, targetId: string): boolean {
    return this.validateDataFlow(sourceId, targetId).isValid;
  }

  /**
   * Cleanup data flow state for a node
   * @param nodeId - Node identifier
   */
  cleanup(nodeId: string): void {
    const wasActive = this.nodeStateMap.get(nodeId);

    // Remove from maps
    this.nodeIdMap.delete(nodeId);
    this.nodeStateMap.delete(nodeId);

    // Update metrics
    this.metrics.totalNodeCount--;
    if (wasActive) {
      this.metrics.activeNodeCount--;
    }

    this.updateMemoryUsage();

    debug(`Data flow cleaned up for node: ${nodeId}`);
  }

  /**
   * Get all active node IDs
   * @returns Array of active node IDs
   */
  getActiveNodes(): string[] {
    const activeNodes: string[] = [];
    for (const [nodeId, isActive] of this.nodeStateMap as any) {
      if (isActive) {
        activeNodes.push(nodeId);
      }
    }
    return activeNodes;
  }

  /**
   * Bulk activation update for performance
   * @param activations - Map of node IDs to activation states
   */
  bulkSetActivation(activations: Record<string, boolean>): void {
    const startTime = performance.now();
    let updatedCount = 0;

    for (const [nodeId, isActive] of Object.entries(activations)) {
      this.setNodeActivation(nodeId, isActive);
      updatedCount++;
    }

    const duration = performance.now() - startTime;
    debug(`Bulk activation update completed`, {
      updatedCount,
      duration,
      averagePerNode: duration / updatedCount,
    });
  }

  /**
   * Get current performance metrics
   * @returns Current metrics
   */
  getMetrics(): DataFlowMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      activeNodeCount: this.metrics.activeNodeCount,
      totalNodeCount: this.metrics.totalNodeCount,
      validationCount: 0,
      validationFailures: 0,
      activeConnections: 0,
      averageValidationTime: 0,
      memoryUsage: this.metrics.memoryUsage,
    };
    this.validationTimes.length = 0;
    debug("Data flow metrics reset");
  }

  /**
   * Update validation performance metrics
   * @param validationTime - Time taken for validation
   */
  private updateValidationMetrics(validationTime: number): void {
    this.validationTimes.push(validationTime);

    // Keep only recent measurements for rolling average
    if (this.validationTimes.length > 100) {
      this.validationTimes.shift();
    }

    this.metrics.averageValidationTime =
      this.validationTimes.reduce((sum, time) => sum + time, 0) /
      this.validationTimes.length;
  }

  /**
   * Update memory usage estimate
   */
  private updateMemoryUsage(): void {
    // Rough estimate: 100 bytes per node mapping + 50 bytes per state entry
    this.metrics.memoryUsage = this.nodeIdMap.size * 150;
  }
}

// ============================================================================
// REACT CONTEXT
// ============================================================================

const DataFlowContext = createContext<DataFlowContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface DataFlowProviderProps {
  children: React.ReactNode;
  /** Custom data flow controller instance */
  dataFlowController?: SafeDataFlowController;
  /** Whether to enable debug logging */
  enableDebug?: boolean;
}

/**
 * Data Flow Provider component
 * Provides data flow management context to child components
 */
export function DataFlowProvider({
  children,
  dataFlowController,
  enableDebug = false,
}: DataFlowProviderProps) {
  const controllerRef = useRef<SafeDataFlowController>(
    dataFlowController || new SafeDataFlowController()
  );

  useEffect(() => {
    if (enableDebug) {
      debug("DataFlowProvider mounted", {
        hasCustomController: !!dataFlowController,
        metrics: controllerRef.current.getMetrics(),
      });
    }

    return () => {
      if (enableDebug) {
        debug("DataFlowProvider unmounting", {
          finalMetrics: controllerRef.current.getMetrics(),
        });
      }
    };
  }, [enableDebug, dataFlowController]);

  const contextValue: DataFlowContextValue = {
    setNodeActivation: (nodeId, isActive) =>
      controllerRef.current.setNodeActivation(nodeId, isActive),

    isNodeActiveForDataFlow: (nodeId) =>
      controllerRef.current.isNodeActiveForDataFlow(nodeId),

    validateDataFlow: (sourceId, targetId) =>
      controllerRef.current.validateDataFlow(sourceId, targetId),

    cleanup: (nodeId) => controllerRef.current.cleanup(nodeId),

    getMetrics: () => controllerRef.current.getMetrics(),

    resetMetrics: () => controllerRef.current.resetMetrics(),

    getActiveNodes: () => controllerRef.current.getActiveNodes(),

    bulkSetActivation: (activations) =>
      controllerRef.current.bulkSetActivation(activations),
  };

  return (
    <DataFlowContext.Provider value={contextValue}>
      {children}
    </DataFlowContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access data flow context
 * @returns Data flow context value
 * @throws Error if used outside of DataFlowProvider
 */
export function useDataFlow(): DataFlowContextValue {
  const context = useContext(DataFlowContext);
  if (!context) {
    throw new Error("useDataFlow must be used within a DataFlowProvider");
  }
  return context;
}

/**
 * Hook for managing individual node data flow
 * @param nodeId - Node identifier
 * @param initialActive - Initial activation state
 * @returns Data flow utilities for the node
 */
export function useNodeDataFlow(
  nodeId: string,
  initialActive: boolean = false
) {
  const { setNodeActivation, isNodeActiveForDataFlow, cleanup } = useDataFlow();
  const [isActive, setIsActive] = React.useState(initialActive);

  useEffect(() => {
    setNodeActivation(nodeId, initialActive);
    setIsActive(initialActive);

    return () => cleanup(nodeId);
  }, [nodeId, initialActive, setNodeActivation, cleanup]);

  const updateActivation = (active: boolean) => {
    setNodeActivation(nodeId, active);
    setIsActive(active);
  };

  return {
    isActive,
    setActive: updateActivation,
    checkActive: () => isNodeActiveForDataFlow(nodeId),
  };
}
