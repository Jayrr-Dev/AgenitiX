/**
 * HANDLE FACTORY
 *
 * Provides comprehensive handle creation and management for the node factory system.
 * Includes JSON registry integration, fallback handle generation, and performance optimization.
 *
 * FEATURES:
 * • JSON registry integration with fallback handling
 * • Performance-optimized handle creation with caching
 * • Type-safe handle configuration with validation
 * • Comprehensive handle mapping and normalization
 * • Debug logging and error handling
 * • Memory-efficient handle management
 *
 * HANDLE GENERATION STRATEGY:
 * • Primary: JSON registry lookup for dynamic handle definitions
 * • Fallback: Hardcoded handle configurations for known node types
 * • Default: Universal input/output handles for unknown types
 * • Enhancement: JSON input support and handle validation
 *
 * @author Factory Handle Team
 * @since v3.0.0
 * @keywords handle-factory, json-registry, performance, type-safety, handles
 */

import { Position } from "@xyflow/react";
import { debug } from "../../systems/safety";
import type { HandleConfig } from "../../types";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HandleGenerationOptions {
  /** Whether to include JSON input support */
  includeJsonSupport?: boolean;
  /** Whether to use registry lookup */
  useRegistry?: boolean;
  /** Custom fallback handles */
  fallbackHandles?: HandleConfig[];
  /** Whether to enable debug logging */
  enableDebug?: boolean;
}

export interface HandleGenerationResult {
  /** Generated handles */
  handles: HandleConfig[];
  /** Source of handles (registry, fallback, default) */
  source: "registry" | "fallback" | "default" | "custom";
  /** Whether JSON support was added */
  hasJsonSupport: boolean;
  /** Generation metadata */
  metadata: {
    nodeType: string;
    originalCount: number;
    finalCount: number;
    generationTime: number;
  };
}

export interface HandleMetrics {
  /** Total number of handle generations */
  totalGenerations: number;
  /** Number of registry hits */
  registryHits: number;
  /** Number of fallback uses */
  fallbackUses: number;
  /** Number of default uses */
  defaultUses: number;
  /** Average generation time */
  averageGenerationTime: number;
  /** Generation times by node type */
  generationTimesByType: Map<string, number[]>;
}

// ============================================================================
// GLOBAL METRICS AND STATE
// ============================================================================

let handleMetrics: HandleMetrics = {
  totalGenerations: 0,
  registryHits: 0,
  fallbackUses: 0,
  defaultUses: 0,
  averageGenerationTime: 0,
  generationTimesByType: new Map(),
};

const generationTimes: number[] = [];

// ============================================================================
// HARDCODED HANDLE CONFIGURATIONS
// ============================================================================

/**
 * Hardcoded handle configurations for known node types
 * Used as fallback when JSON registry is unavailable
 */
export const FALLBACK_HANDLE_CONFIGS: Record<string, HandleConfig[]> = {
  createText: [
    {
      id: "trigger",
      dataType: "b",
      position: Position.Left,
      type: "target",
    },
    {
      id: "output",
      dataType: "s",
      position: Position.Right,
      type: "source",
    },
  ],

  viewOutput: [
    {
      id: "input",
      dataType: "x",
      position: Position.Left,
      type: "target",
    },
  ],

  triggerOnToggle: [
    {
      id: "output",
      dataType: "b",
      position: Position.Right,
      type: "source",
    },
  ],

  testError: [
    {
      id: "trigger",
      dataType: "b",
      position: Position.Left,
      type: "target",
    },
    {
      id: "error-output",
      dataType: "∅",
      position: Position.Right,
      type: "source",
    },
  ],

  // Universal default handles
  default: [
    {
      id: "input",
      dataType: "x",
      position: Position.Left,
      type: "target",
    },
    {
      id: "output",
      dataType: "x",
      position: Position.Right,
      type: "source",
    },
  ],
};

// ============================================================================
// HANDLE CREATION FUNCTIONS
// ============================================================================

/**
 * Create default handles for a given node type with comprehensive fallback strategy
 * @param nodeType - Type of node to create handles for
 * @param options - Handle generation options
 * @returns Handle generation result with metadata
 */
export function createDefaultHandles(
  nodeType: string,
  options: HandleGenerationOptions = {}
): HandleGenerationResult {
  const startTime = performance.now();
  const opts = {
    includeJsonSupport: true,
    useRegistry: true,
    enableDebug: true,
    ...options,
  };

  let handles: HandleConfig[] = [];
  let source: HandleGenerationResult["source"] = "default";

  // Try JSON registry first if enabled
  if (opts.useRegistry) {
    const registryHandles = getHandlesFromRegistry(nodeType);
    if (registryHandles.length > 0) {
      handles = registryHandles;
      source = "registry";
      handleMetrics.registryHits++;

      if (opts.enableDebug) {
        debug(
          `${nodeType}: Using ${handles.length} handles from JSON registry`
        );
      }
    }
  }

  // Fallback to hardcoded configurations
  if (handles.length === 0) {
    if (opts.fallbackHandles) {
      handles = [...opts.fallbackHandles];
      source = "custom";
    } else {
      handles =
        FALLBACK_HANDLE_CONFIGS[nodeType] || FALLBACK_HANDLE_CONFIGS.default;
      source = nodeType in FALLBACK_HANDLE_CONFIGS ? "fallback" : "default";

      if (source === "fallback") {
        handleMetrics.fallbackUses++;
      } else {
        handleMetrics.defaultUses++;
      }
    }

    if (opts.enableDebug) {
      debug(`${nodeType}: Using ${handles.length} ${source} handles`);
    }
  }

  const originalCount = handles.length;

  // Add JSON input support if requested
  if (opts.includeJsonSupport) {
    handles = addJsonInputSupport(handles);
  }

  // Update metrics
  const generationTime = performance.now() - startTime;
  updateHandleMetrics(nodeType, generationTime);

  const result: HandleGenerationResult = {
    handles,
    source,
    hasJsonSupport: opts.includeJsonSupport,
    metadata: {
      nodeType,
      originalCount,
      finalCount: handles.length,
      generationTime,
    },
  };

  if (opts.enableDebug) {
    debug(`${nodeType}: Handle generation complete`, {
      source,
      originalCount,
      finalCount: handles.length,
      generationTime: generationTime.toFixed(2) + "ms",
    });
  }

  return result;
}

/**
 * Get handles from JSON registry with error handling
 * @param nodeType - Node type to lookup
 * @returns Array of handle configurations
 */
function getHandlesFromRegistry(nodeType: string): HandleConfig[] {
  try {
    const registry = require("../../../registries/json-node-registry/unifiedRegistry");
    const registryHandles = registry.getNodeHandlesNormalized(nodeType);

    if (registryHandles && registryHandles.length > 0) {
      // Convert registry handles to factory format
      return registryHandles.map((handle: any) => ({
        id: handle.id,
        dataType: handle.dataType, // Already normalized by getNodeHandlesNormalized
        position: normalizePosition(handle.position),
        type: handle.type,
      }));
    }
  } catch (error) {
    debug(`${nodeType}: Failed to load from JSON registry`, error);
  }

  return [];
}

/**
 * Normalize position values from registry to Position enum
 * @param position - Position value from registry
 * @returns Normalized Position enum value
 */
function normalizePosition(position: any): Position {
  if (typeof position === "string") {
    switch (position.toLowerCase()) {
      case "left":
        return Position.Left;
      case "right":
        return Position.Right;
      case "top":
        return Position.Top;
      case "bottom":
        return Position.Bottom;
      default:
        return Position.Left; // Default fallback
    }
  }

  // If already Position enum, use as-is
  if (Object.values(Position).includes(position)) {
    return position;
  }

  return Position.Left; // Safe fallback
}

/**
 * Add JSON input support to existing handles
 * @param handles - Existing handle configurations
 * @returns Enhanced handles with JSON support
 */
function addJsonInputSupport(handles: HandleConfig[]): HandleConfig[] {
  // Check if JSON input already exists
  const hasJsonInput = handles.some(
    (handle) => handle.id === "json-input" || handle.dataType === "{ }"
  );

  if (hasJsonInput) {
    return handles; // Already has JSON support
  }

  // Add JSON input handle
  const jsonHandle: HandleConfig = {
    id: "json-input",
    dataType: "{ }",
    position: Position.Left,
    type: "target",
  };

  return [...handles, jsonHandle];
}

// ============================================================================
// HANDLE VALIDATION
// ============================================================================

/**
 * Validate handle configuration
 * @param handle - Handle to validate
 * @returns Whether handle is valid
 */
export function validateHandle(handle: HandleConfig): boolean {
  if (!handle.id || typeof handle.id !== "string") return false;
  if (!handle.dataType || typeof handle.dataType !== "string") return false;
  if (!Object.values(Position).includes(handle.position)) return false;
  if (!["source", "target"].includes(handle.type)) return false;

  return true;
}

/**
 * Validate array of handles
 * @param handles - Handles to validate
 * @returns Validation result with details
 */
export function validateHandles(handles: HandleConfig[]): {
  isValid: boolean;
  errors: string[];
  validHandles: HandleConfig[];
} {
  const errors: string[] = [];
  const validHandles: HandleConfig[] = [];

  if (!Array.isArray(handles)) {
    return {
      isValid: false,
      errors: ["Handles must be an array"],
      validHandles: [],
    };
  }

  handles.forEach((handle, index) => {
    if (validateHandle(handle)) {
      validHandles.push(handle);
    } else {
      errors.push(
        `Invalid handle at index ${index}: ${JSON.stringify(handle)}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    validHandles,
  };
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Update handle generation metrics
 * @param nodeType - Node type
 * @param generationTime - Time taken to generate handles
 */
function updateHandleMetrics(nodeType: string, generationTime: number): void {
  handleMetrics.totalGenerations++;

  // Update global average
  generationTimes.push(generationTime);
  if (generationTimes.length > 100) {
    generationTimes.shift(); // Keep recent measurements
  }
  handleMetrics.averageGenerationTime =
    generationTimes.reduce((sum, time) => sum + time, 0) /
    generationTimes.length;

  // Update per-type metrics
  const typeMetrics = handleMetrics.generationTimesByType.get(nodeType) || [];
  typeMetrics.push(generationTime);
  if (typeMetrics.length > 20) {
    typeMetrics.shift(); // Keep recent measurements per type
  }
  handleMetrics.generationTimesByType.set(nodeType, typeMetrics);
}

/**
 * Get current handle generation metrics
 * @returns Current metrics
 */
export function getHandleMetrics(): HandleMetrics {
  return {
    ...handleMetrics,
    generationTimesByType: new Map(handleMetrics.generationTimesByType),
  };
}

/**
 * Reset handle generation metrics
 */
export function resetHandleMetrics(): void {
  handleMetrics = {
    totalGenerations: 0,
    registryHits: 0,
    fallbackUses: 0,
    defaultUses: 0,
    averageGenerationTime: 0,
    generationTimesByType: new Map(),
  };
  generationTimes.length = 0;
  debug("Handle metrics reset");
}

/**
 * Get handle generation summary
 * @returns Summary of handle generation statistics
 */
export function getHandleGenerationSummary() {
  const total = handleMetrics.totalGenerations;
  return {
    totalGenerations: total,
    registryHitRate:
      total > 0
        ? ((handleMetrics.registryHits / total) * 100).toFixed(1) + "%"
        : "0%",
    fallbackUseRate:
      total > 0
        ? ((handleMetrics.fallbackUses / total) * 100).toFixed(1) + "%"
        : "0%",
    defaultUseRate:
      total > 0
        ? ((handleMetrics.defaultUses / total) * 100).toFixed(1) + "%"
        : "0%",
    averageGenerationTime:
      handleMetrics.averageGenerationTime.toFixed(2) + "ms",
    uniqueNodeTypes: handleMetrics.generationTimesByType.size,
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility
 * @param nodeType - Node type
 * @returns Handle configurations
 */
export function createDefaultHandlesLegacy(nodeType: string): HandleConfig[] {
  const result = createDefaultHandles(nodeType, { enableDebug: false });
  return result.handles;
}
