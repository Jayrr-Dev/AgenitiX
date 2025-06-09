/**
 * USE ACTIVATION CALCULATION HOOK - Node activation state computation
 *
 * • Calculates node activation states based on input conditions
 * • Implements complex activation algorithms and threshold logic
 * • Supports real-time activation monitoring and state changes
 * • Features performance-optimized calculation with caching
 * • Integrates with data flow systems for activation propagation
 *
 * Keywords: activation-calculation, threshold-logic, real-time-monitoring, caching, data-flow, propagation
 */

import { useMemo } from "react";
import type { BaseNodeData } from "../../types";
import {
  calculateDownstreamNodeActivation,
  calculateHeadNodeActivation,
  isHeadNode,
} from "../../utils/processing/propagationEngine";

// ============================================================================
// ACTIVATION CALCULATION TYPES
// ============================================================================

interface ActivationConfig {
  nodeType: string;
}

interface ConnectionData {
  connections: any[];
  nodesData: any[];
  relevantConnectionData: any;
}

interface ActivationResult {
  calculatedIsActive: boolean;
  isHeadNode: boolean;
  activationSource: "head" | "downstream";
}

// ============================================================================
// USE ACTIVATION CALCULATION
// ============================================================================

/**
 * USE ACTIVATION CALCULATION
 * Handles node activation state calculation with caching optimization
 * Focused responsibility: Only activation logic computation
 *
 * @param id - Node ID
 * @param config - Activation configuration
 * @param nodeData - Current node data
 * @param connectionData - Connection and node data
 * @returns Activation calculation result
 */
export function useActivationCalculation<T extends BaseNodeData>(
  id: string,
  config: ActivationConfig,
  nodeData: T,
  connectionData: ConnectionData
): ActivationResult {
  // ========================================================================
  // ACTIVATION CALCULATION WITH OPTIMIZATION
  // ========================================================================

  const activationResult = useMemo(() => {
    try {
      const isHead = isHeadNode(connectionData.connections, id);
      const previousIsActive = nodeData?.isActive;

      // QUICK CHECK FOR INSTANT DEACTIVATION
      const quickCheck = isHead
        ? calculateHeadNodeActivation(config.nodeType, nodeData, true)
        : calculateDownstreamNodeActivation(
            config.nodeType,
            nodeData,
            connectionData.connections,
            connectionData.nodesData,
            id,
            true
          );

      // BYPASS CACHE for immediate deactivation
      const bypassCache = previousIsActive === true && quickCheck === false;

      // CALCULATE ACTIVATION STATE
      const calculatedIsActive = isHead
        ? calculateHeadNodeActivation(config.nodeType, nodeData, bypassCache)
        : calculateDownstreamNodeActivation(
            config.nodeType,
            nodeData,
            connectionData.connections,
            connectionData.nodesData,
            id,
            bypassCache
          );

      return {
        calculatedIsActive,
        isHeadNode: isHead,
        activationSource: isHead ? "head" : "downstream",
      } as ActivationResult;
    } catch (error) {
      console.error(
        `${config.nodeType} ${id} - Activation calculation error:`,
        error
      );
      return {
        calculatedIsActive: false,
        isHeadNode: false,
        activationSource: "head",
      } as ActivationResult;
    }
  }, [
    id,
    config.nodeType,
    connectionData.relevantConnectionData,
    connectionData.nodesData,
    JSON.stringify(nodeData), // Deep comparison for node data changes
  ]);

  return activationResult;
}

// ============================================================================
// ACTIVATION STATE UTILITIES
// ============================================================================

/**
 * CHECK IF ACTIVATION CHANGED
 * Helper to determine if activation state has changed
 */
export function hasActivationChanged(
  currentIsActive: boolean,
  calculatedIsActive: boolean
): { isActivating: boolean; isDeactivating: boolean; hasChanged: boolean } {
  const hasChanged = currentIsActive !== calculatedIsActive;
  const isActivating = !currentIsActive && calculatedIsActive;
  const isDeactivating = currentIsActive && !calculatedIsActive;

  return {
    isActivating,
    isDeactivating,
    hasChanged,
  };
}

/**
 * CREATE ACTIVATION CONFIG
 * Helper to create activation configuration object
 */
export function createActivationConfig(nodeType: string): ActivationConfig {
  return {
    nodeType,
  };
}
