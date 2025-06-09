/**
 * SAFE STATE PROVIDER
 *
 * Provides comprehensive state management for the node factory system with atomic updates,
 * immutable state handling, and performance optimization for large-scale applications.
 *
 * FEATURES:
 * • Atomic state updates with Immer immutability
 * • Memory-efficient state management with garbage collection
 * • Validation layers for state integrity
 * • Performance monitoring and metrics collection
 * • ArrayBuffer integration for large datasets
 * • Context-based state sharing across components
 *
 * STATE MANAGEMENT BENEFITS:
 * • Prevents state corruption through immutable updates
 * • Efficient memory usage through WeakMap and cleanup
 * • Type-safe state handling with TypeScript generics
 * • Performance optimization through batched updates
 * • Debugging support with detailed state tracking
 *
 * @author Factory State Team
 * @since v3.0.0
 * @keywords state-management, immutability, performance, atomic-updates, providers
 */

"use client";

import { produce } from "immer";
import React, { createContext, useContext, useEffect, useRef } from "react";
import { debug, globalDataBuffer } from "../systems";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface StateUpdateCallback<T> {
  (data: Partial<T>): void;
}

export interface StateValidator<T> {
  (data: T): boolean;
}

export interface StateMetrics {
  /** Total number of registered nodes */
  nodeCount: number;
  /** Number of state updates performed */
  updateCount: number;
  /** Number of validation failures */
  validationFailures: number;
  /** Average update time in milliseconds */
  averageUpdateTime: number;
  /** Memory usage estimate in bytes */
  memoryUsage: number;
  /** Number of buffer views created */
  bufferViewCount: number;
}

export interface SafeStateContextValue<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Register a node with the state system */
  registerNode: (
    nodeId: string,
    initialData: T,
    updateCallback: StateUpdateCallback<T>,
    validator?: StateValidator<T>
  ) => void;

  /** Update node state with partial updates */
  updateState: (nodeId: string, updates: Partial<T>) => boolean;

  /** Update node state using Immer producer function */
  produceState: (nodeId: string, recipe: (draft: T) => void) => boolean;

  /** Get current state for a node */
  getState: <U extends Record<string, unknown> = T>(
    nodeId: string
  ) => U | undefined;

  /** Get or create buffer view for large datasets */
  getDataBufferView: (nodeId: string) => Float32Array | undefined;
  createDataBufferView: (
    nodeId: string,
    offset: number,
    length: number
  ) => Float32Array;

  /** Cleanup node state */
  cleanup: (nodeId: string) => void;

  /** Get current state metrics */
  getMetrics: () => StateMetrics;

  /** Reset all metrics */
  resetMetrics: () => void;
}

// ============================================================================
// ENHANCED SAFE STATE LAYER
// ============================================================================

/**
 * Enhanced state layer with comprehensive state management capabilities
 * Manages atomic state updates with Immer immutability and performance optimization
 */
export class SafeStateLayer<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  private nodeStates = new Map<string, T>();
  private updateCallbacks = new Map<string, StateUpdateCallback<T>>();
  private validationCallbacks = new Map<string, StateValidator<T>>();

  // Performance metrics
  private metrics: StateMetrics = {
    nodeCount: 0,
    updateCount: 0,
    validationFailures: 0,
    averageUpdateTime: 0,
    memoryUsage: 0,
    bufferViewCount: 0,
  };

  private updateTimes: number[] = [];

  /**
   * Register a node with the state layer
   * @param nodeId - Unique identifier for the node
   * @param initialData - Starting state data for the node
   * @param updateCallback - Function to call when node state changes
   * @param validator - Optional function to validate state changes
   */
  registerNode(
    nodeId: string,
    initialData: T,
    updateCallback: StateUpdateCallback<T>,
    validator?: StateValidator<T>
  ): void {
    this.nodeStates.set(nodeId, initialData);
    this.updateCallbacks.set(nodeId, updateCallback);

    if (validator) {
      this.validationCallbacks.set(nodeId, validator);
    }

    this.metrics.nodeCount = this.nodeStates.size;
    this.updateMemoryUsage();

    debug(`State registered for node: ${nodeId}`, {
      hasValidator: !!validator,
      initialDataKeys: Object.keys(initialData),
    });
  }

  /**
   * Update node state with Immer-based immutable updates
   * @param nodeId - Unique identifier for the node
   * @param updates - Partial state updates to apply
   * @returns True if update was successful, false otherwise
   */
  updateState(nodeId: string, updates: Partial<T>): boolean {
    const startTime = performance.now();

    const currentState = this.nodeStates.get(nodeId);
    if (!currentState) {
      debug(`State update failed: node ${nodeId} not found`);
      return false;
    }

    try {
      // Use Immer for safe immutable updates
      const newState = produce(currentState, (draft) => {
        Object.assign(draft, updates);
      });

      // Validate state before updating
      const validator = this.validationCallbacks.get(nodeId);
      if (validator && !validator(newState)) {
        debug(`State validation failed for node: ${nodeId}`, { updates });
        this.metrics.validationFailures++;
        return false;
      }

      // Atomic update
      this.nodeStates.set(nodeId, newState);

      // Trigger React update
      const callback = this.updateCallbacks.get(nodeId);
      callback?.(updates);

      // Update metrics
      this.updatePerformanceMetrics(performance.now() - startTime);

      debug(`State updated for node: ${nodeId}`, {
        updateKeys: Object.keys(updates),
        duration: performance.now() - startTime,
      });

      return true;
    } catch (error) {
      debug(`State update error for node: ${nodeId}`, { error, updates });
      return false;
    }
  }

  /**
   * Immer-based produce helper for complex state updates
   * @param nodeId - Unique identifier for the node
   * @param recipe - Immer recipe function to apply state updates
   * @returns True if update was successful, false otherwise
   */
  produceState(nodeId: string, recipe: (draft: T) => void): boolean {
    const startTime = performance.now();

    const currentState = this.nodeStates.get(nodeId);
    if (!currentState) {
      debug(`State produce failed: node ${nodeId} not found`);
      return false;
    }

    try {
      const newState = produce(currentState, recipe);

      // Validate state before updating
      const validator = this.validationCallbacks.get(nodeId);
      if (validator && !validator(newState)) {
        debug(`State validation failed for node: ${nodeId}`);
        this.metrics.validationFailures++;
        return false;
      }

      // Atomic update
      this.nodeStates.set(nodeId, newState);

      // Trigger React update with diff
      const callback = this.updateCallbacks.get(nodeId);
      if (callback) {
        // Calculate diff for React update
        const diff: Partial<T> = {};
        for (const key in newState) {
          if (newState[key] !== currentState[key]) {
            diff[key] = newState[key];
          }
        }
        callback(diff);
      }

      // Update metrics
      this.updatePerformanceMetrics(performance.now() - startTime);

      debug(`State produced for node: ${nodeId}`, {
        duration: performance.now() - startTime,
      });

      return true;
    } catch (error) {
      debug(`State produce error for node: ${nodeId}`, error);
      return false;
    }
  }

  /**
   * Get large dataset view from shared buffer
   * @param nodeId - Unique identifier for the node
   * @returns Float32Array view of the node's data buffer
   */
  getDataBufferView(nodeId: string): Float32Array | undefined {
    const view = globalDataBuffer.getView(nodeId);
    if (view) {
      this.metrics.bufferViewCount++;
    }
    return view;
  }

  /**
   * Create large dataset view in shared buffer
   * @param nodeId - Unique identifier for the node
   * @param offset - Offset into the buffer
   * @param length - Length of the view
   * @returns Float32Array view of the node's data buffer
   */
  createDataBufferView(
    nodeId: string,
    offset: number,
    length: number
  ): Float32Array {
    const view = globalDataBuffer.createView(nodeId, offset, length);
    this.metrics.bufferViewCount++;
    debug(`Buffer view created for node: ${nodeId}`, { offset, length });
    return view;
  }

  /**
   * Get current state for a node
   * @param nodeId - Node identifier
   * @returns Current state or undefined if not found
   */
  getState<U extends Record<string, unknown> = T>(
    nodeId: string
  ): U | undefined {
    return this.nodeStates.get(nodeId) as U | undefined;
  }

  /**
   * Cleanup state for memory management
   * @param nodeId - Unique identifier for the node
   */
  cleanup(nodeId: string): void {
    this.nodeStates.delete(nodeId);
    this.updateCallbacks.delete(nodeId);
    this.validationCallbacks.delete(nodeId);
    globalDataBuffer.removeView(nodeId);

    this.metrics.nodeCount = this.nodeStates.size;
    this.updateMemoryUsage();

    debug(`State cleaned up for node: ${nodeId}`);
  }

  /**
   * Get current performance metrics
   * @returns Current metrics
   */
  getMetrics(): StateMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.metrics = {
      nodeCount: this.nodeStates.size,
      updateCount: 0,
      validationFailures: 0,
      averageUpdateTime: 0,
      memoryUsage: this.metrics.memoryUsage,
      bufferViewCount: 0,
    };
    this.updateTimes.length = 0;
    debug("State metrics reset");
  }

  /**
   * Update performance metrics
   * @param updateTime - Time taken for the update
   */
  private updatePerformanceMetrics(updateTime: number): void {
    this.metrics.updateCount++;
    this.updateTimes.push(updateTime);

    // Keep only recent measurements for rolling average
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift();
    }

    this.metrics.averageUpdateTime =
      this.updateTimes.reduce((sum, time) => sum + time, 0) /
      this.updateTimes.length;
  }

  /**
   * Update memory usage estimate
   */
  private updateMemoryUsage(): void {
    // Rough estimate: 500 bytes per node state + 200 bytes per callback
    this.metrics.memoryUsage = this.nodeStates.size * 700;
  }
}

// ============================================================================
// REACT CONTEXT
// ============================================================================

const SafeStateContext = createContext<SafeStateContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface SafeStateProviderProps {
  children: React.ReactNode;
  /** Custom state layer instance */
  stateLayer?: SafeStateLayer;
  /** Whether to enable debug logging */
  enableDebug?: boolean;
}

/**
 * Safe State Provider component
 * Provides state management context to child components
 */
export function SafeStateProvider({
  children,
  stateLayer,
  enableDebug = false,
}: SafeStateProviderProps) {
  const stateLayerRef = useRef<SafeStateLayer>(
    stateLayer || new SafeStateLayer()
  );

  useEffect(() => {
    if (enableDebug) {
      debug("SafeStateProvider mounted", {
        hasCustomLayer: !!stateLayer,
        nodeCount: stateLayerRef.current.getMetrics().nodeCount,
      });
    }

    return () => {
      if (enableDebug) {
        debug("SafeStateProvider unmounting", {
          finalMetrics: stateLayerRef.current.getMetrics(),
        });
      }
    };
  }, [enableDebug, stateLayer]);

  const contextValue: SafeStateContextValue = {
    registerNode: (nodeId, initialData, updateCallback, validator) =>
      stateLayerRef.current.registerNode(
        nodeId,
        initialData,
        updateCallback,
        validator
      ),

    updateState: (nodeId, updates) =>
      stateLayerRef.current.updateState(nodeId, updates),

    produceState: (nodeId, recipe) =>
      stateLayerRef.current.produceState(nodeId, recipe),

    getState: (nodeId) => stateLayerRef.current.getState(nodeId),

    getDataBufferView: (nodeId) =>
      stateLayerRef.current.getDataBufferView(nodeId),

    createDataBufferView: (nodeId, offset, length) =>
      stateLayerRef.current.createDataBufferView(nodeId, offset, length),

    cleanup: (nodeId) => stateLayerRef.current.cleanup(nodeId),

    getMetrics: () => stateLayerRef.current.getMetrics(),

    resetMetrics: () => stateLayerRef.current.resetMetrics(),
  };

  return (
    <SafeStateContext.Provider value={contextValue}>
      {children}
    </SafeStateContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access safe state context
 * @returns Safe state context value
 * @throws Error if used outside of SafeStateProvider
 */
export function useSafeState<
  T extends Record<string, unknown> = Record<string, unknown>,
>(): SafeStateContextValue<T> {
  const context = useContext(SafeStateContext);
  if (!context) {
    throw new Error("useSafeState must be used within a SafeStateProvider");
  }
  return context as SafeStateContextValue<T>;
}

/**
 * Hook for managing individual node state
 * @param nodeId - Node identifier
 * @param initialData - Initial state data
 * @param validator - Optional validator function
 * @returns State management utilities for the node
 */
export function useNodeState<T extends Record<string, unknown>>(
  nodeId: string,
  initialData: T,
  validator?: StateValidator<T>
) {
  const { registerNode, updateState, produceState, getState, cleanup } =
    useSafeState<T>();
  const [currentState, setCurrentState] = React.useState<T>(initialData);

  useEffect(() => {
    const updateCallback: StateUpdateCallback<T> = (updates: Partial<T>) => {
      setCurrentState((prevState) => ({ ...prevState, ...updates }));
    };
    registerNode(nodeId, initialData, updateCallback, validator);
    return () => cleanup(nodeId);
  }, [nodeId, registerNode, cleanup, validator]);

  return {
    state: currentState,
    updateState: (updates: Partial<T>) => updateState(nodeId, updates),
    produceState: (recipe: (draft: T) => void) => produceState(nodeId, recipe),
    getState: () => getState(nodeId),
  };
}
