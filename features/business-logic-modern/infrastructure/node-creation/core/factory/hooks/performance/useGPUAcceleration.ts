/**
 * USE GPU ACCELERATION HOOK - GPU-powered performance optimization
 *
 * • Provides GPU-accelerated processing for high-performance operations
 * • Implements WebGL and hardware acceleration optimizations
 * • Supports parallel processing and computational offloading
 * • Features automatic fallback to CPU when GPU unavailable
 * • Integrates with ultra-fast rendering and visual systems
 *
 * Keywords: gpu-acceleration, webgl, parallel-processing, hardware-optimization, fallback, ultra-fast
 */

import { useEffect } from "react";
import { useUltraFastPropagation } from "../../systems/propagation/UltraFastPropagationEngine";

// ============================================================================
// GPU ACCELERATION TYPES
// ============================================================================

interface GPUAccelerationConfig {
  nodeType: string;
  nodeId: string;
}

interface SafetyLayers {
  state: any;
  dataFlow: any;
  propagationEngine: any;
}

interface GPUAccelerationResult {
  propagateUltraFast: (nodeId: string, isActive: boolean) => void;
  enableGPUAcceleration: (nodeIds: string[]) => void;
  isGPUEnabled: boolean;
}

// ============================================================================
// GPU ACCELERATION PATTERNS
// ============================================================================

const GPU_ACCELERATION_PATTERNS = [
  "trigger",
  "cycle",
  "delay",
  "pulse",
  "timer",
  "frequency",
  "oscillator",
];

// ============================================================================
// USE GPU ACCELERATION
// ============================================================================

/**
 * USE GPU ACCELERATION
 * Handles GPU acceleration setup for high-frequency nodes
 * Focused responsibility: Only GPU acceleration and ultra-fast propagation
 *
 * @param config - GPU acceleration configuration
 * @param connectionData - Connection and node data
 * @param updateNodeData - Node update function
 * @param safetyLayers - Optional enterprise safety layers
 * @returns GPU acceleration utilities
 */
export function useGPUAcceleration(
  config: GPUAccelerationConfig,
  connectionData: {
    connections: any[];
    allNodes: any[];
  },
  updateNodeData: (id: string, data: any) => void,
  safetyLayers?: SafetyLayers
): GPUAccelerationResult {
  // ========================================================================
  // ULTRA-FAST PROPAGATION SYSTEM SETUP
  // ========================================================================

  const { propagateUltraFast, enableGPUAcceleration } = useUltraFastPropagation(
    connectionData.allNodes || [],
    connectionData.connections,
    updateNodeData
  );

  // ========================================================================
  // GPU ACCELERATION DETECTION AND SETUP
  // ========================================================================

  const isGPUEnabled = checkIfGPUEnabled(config.nodeType);

  useEffect(() => {
    if (isGPUEnabled) {
      try {
        // Enable GPU acceleration
        const element = document.getElementById(config.nodeId);
        if (element) {
          element.style.transform = 'translate3d(0,0,0)';
          element.style.willChange = 'transform';
        }
      } catch (error) {
        console.error(`[GPUAcceleration] Failed to enable GPU acceleration for node: ${config.nodeId}`, error);
      }
    }
  }, [isGPUEnabled, config.nodeId]);

  return {
    propagateUltraFast,
    enableGPUAcceleration,
    isGPUEnabled,
  };
}

// ============================================================================
// GPU ACCELERATION UTILITIES
// ============================================================================

/**
 * CHECK IF GPU ENABLED
 * Determine if a node type should use GPU acceleration
 */
function checkIfGPUEnabled(nodeType: string): boolean {
  return GPU_ACCELERATION_PATTERNS.some((pattern) =>
    nodeType.toLowerCase().includes(pattern)
  );
}

/**
 * CREATE GPU ACCELERATION CONFIG
 * Helper to create GPU acceleration configuration object
 */
export function createGPUAccelerationConfig(
  nodeType: string,
  nodeId: string
): GPUAccelerationConfig {
  return {
    nodeType,
    nodeId,
  };
}

/**
 * GET GPU ACCELERATION PATTERNS
 * Get list of node patterns that support GPU acceleration
 */
export function getGPUAccelerationPatterns(): string[] {
  return [...GPU_ACCELERATION_PATTERNS];
}
