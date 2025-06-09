/**
 * HANDLE CONFIGURATION
 *
 * Provides comprehensive handle configuration and caching for the node factory system.
 * Includes performance optimization, validation, and JSON input support enhancement.
 *
 * FEATURES:
 * • Dual-layer caching with WeakMap and string-based memoization
 * • Performance-optimized handle configuration with metrics tracking
 * • JSON input support enhancement for all node types
 * • Comprehensive handle validation and error handling
 * • Memory-efficient configuration management
 * • Debug logging and performance monitoring
 *
 * CACHING STRATEGY:
 * • Primary: WeakMap cache for object-based configurations (GC-safe)
 * • Secondary: String-based cache for primitive configurations
 * • Automatic cache invalidation and memory management
 * • Performance metrics tracking for cache hit rates
 *
 * @author Factory Handle Configuration Team
 * @since v3.0.0
 * @keywords handle-configuration, caching, performance, validation, json-support
 */

import { debug } from "../../systems/safety";
import type { HandleConfig, NodeFactoryConfig } from "../../types";
import { addJsonInputSupport } from "../../utils/processing/jsonProcessor";
import { createDefaultHandlesLegacy } from "./handleFactory";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HandleConfigurationOptions {
  /** Whether to enable caching */
  enableCaching?: boolean;
  /** Whether to add JSON input support */
  addJsonSupport?: boolean;
  /** Whether to validate handles before returning */
  validateHandles?: boolean;
  /** Whether to enable debug logging */
  enableDebug?: boolean;
  /** Custom handle validator function */
  customValidator?: (handles: HandleConfig[]) => boolean;
}

export interface HandleConfigurationResult {
  /** Configured handles */
  handles: HandleConfig[];
  /** Whether result came from cache */
  fromCache: boolean;
  /** Cache type used (weakmap, string, none) */
  cacheType: "weakmap" | "string" | "none";
  /** Configuration metadata */
  metadata: {
    nodeType: string;
    originalCount: number;
    finalCount: number;
    hasJsonSupport: boolean;
    configurationTime: number;
    validationPassed: boolean;
  };
}

export interface HandleCacheMetrics {
  /** Total configuration requests */
  totalRequests: number;
  /** WeakMap cache hits */
  weakMapHits: number;
  /** String cache hits */
  stringCacheHits: number;
  /** Cache misses */
  cacheMisses: number;
  /** Overall cache hit rate */
  hitRate: number;
  /** Average configuration time */
  averageConfigTime: number;
  /** Configuration times by node type */
  configTimesByType: Map<string, number[]>;
}

// ============================================================================
// CACHING SYSTEM
// ============================================================================

// WeakMap cache for object-based configurations (garbage collection safe)
const handleConfigCache = new WeakMap<object, HandleConfig[]>();

// String-based cache for primitive configurations
const handleStringCache = new Map<string, HandleConfig[]>();

// Performance metrics
let cacheMetrics: HandleCacheMetrics = {
  totalRequests: 0,
  weakMapHits: 0,
  stringCacheHits: 0,
  cacheMisses: 0,
  hitRate: 0,
  averageConfigTime: 0,
  configTimesByType: new Map(),
};

const configurationTimes: number[] = [];

// ============================================================================
// MAIN CONFIGURATION FUNCTION
// ============================================================================

/**
 * Configure node handles with comprehensive caching and validation
 * @param config - Node configuration object
 * @param options - Configuration options
 * @returns Handle configuration result with metadata
 */
export function configureNodeHandles<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>,
  options: HandleConfigurationOptions = {}
): HandleConfigurationResult {
  const startTime = performance.now();
  const opts = {
    enableCaching: true,
    addJsonSupport: true,
    validateHandles: true,
    enableDebug: true,
    ...options,
  };

  cacheMetrics.totalRequests++;

  let handles: HandleConfig[] = [];
  let fromCache = false;
  let cacheType: HandleConfigurationResult["cacheType"] = "none";

  // Try cache lookup if enabled
  if (opts.enableCaching) {
    const cacheResult = getCachedHandles(config);
    if (cacheResult) {
      handles = cacheResult.handles;
      fromCache = true;
      cacheType = cacheResult.type;

      if (cacheType === "weakmap") {
        cacheMetrics.weakMapHits++;
      } else {
        cacheMetrics.stringCacheHits++;
      }

      if (opts.enableDebug) {
        debug(
          `${config.nodeType}: Using cached handles (${handles.length}) from ${cacheType}`
        );
      }
    }
  }

  // Generate handles if not cached
  if (!fromCache) {
    cacheMetrics.cacheMisses++;
    handles = generateHandles(config, opts);

    // Cache the result if caching is enabled
    if (opts.enableCaching) {
      cacheHandles(config, handles);
    }
  }

  const originalCount = handles.length;
  let hasJsonSupport = false;
  let validationPassed = true;

  // Add JSON input support if not from cache and requested
  if (!fromCache && opts.addJsonSupport) {
    const enhancedHandles = addJsonInputSupport(handles);
    hasJsonSupport = enhancedHandles.length > handles.length;
    handles = enhancedHandles;
  }

  // Validate handles if requested
  if (opts.validateHandles) {
    validationPassed = validateConfiguredHandles(handles, opts.customValidator);
    if (!validationPassed && opts.enableDebug) {
      debug(`${config.nodeType}: Handle validation failed`);
    }
  }

  // Update performance metrics
  const configurationTime = performance.now() - startTime;
  updateCacheMetrics(config.nodeType, configurationTime);

  const result: HandleConfigurationResult = {
    handles,
    fromCache,
    cacheType,
    metadata: {
      nodeType: config.nodeType,
      originalCount,
      finalCount: handles.length,
      hasJsonSupport,
      configurationTime,
      validationPassed,
    },
  };

  if (opts.enableDebug) {
    debug(`${config.nodeType}: Handle configuration complete`, {
      fromCache,
      cacheType,
      originalCount,
      finalCount: handles.length,
      hasJsonSupport,
      validationPassed,
      configurationTime: configurationTime.toFixed(2) + "ms",
    });
  }

  return result;
}

/**
 * Legacy configureNodeHandles function for backward compatibility
 * @param config - Node configuration object
 * @returns Configured handles
 */
export function configureNodeHandlesLegacy<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>
): HandleConfig[] {
  const result = configureNodeHandles(config, { enableDebug: false });
  return result.handles;
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

/**
 * Get cached handles for a configuration
 * @param config - Node configuration
 * @returns Cached handles with cache type, or null if not found
 */
function getCachedHandles<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>
): {
  handles: HandleConfig[];
  type: "weakmap" | "string";
} | null {
  // Try WeakMap cache first (best for object references)
  if (typeof config === "object" && config !== null) {
    const cached = handleConfigCache.get(config);
    if (cached) {
      return { handles: cached, type: "weakmap" };
    }
  }

  // Fallback to string-based cache for primitive configs
  const memoKey = createMemoKey(config);
  const stringCached = handleStringCache.get(memoKey);
  if (stringCached) {
    return { handles: stringCached, type: "string" };
  }

  return null;
}

/**
 * Cache handles for a configuration
 * @param config - Node configuration
 * @param handles - Handles to cache
 */
function cacheHandles<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>,
  handles: HandleConfig[]
): void {
  // Cache in WeakMap for object configs
  if (typeof config === "object" && config !== null) {
    handleConfigCache.set(config, handles);
  }

  // Also cache in string map for broader compatibility
  const memoKey = createMemoKey(config);
  handleStringCache.set(memoKey, handles);

  // Manage string cache size (prevent memory leaks)
  if (handleStringCache.size > 100) {
    // Remove oldest entries (simple LRU-like behavior)
    const entries = Array.from(handleStringCache.entries());
    const toRemove = entries.slice(0, 20); // Remove 20 oldest
    toRemove.forEach(([key]) => handleStringCache.delete(key));
  }
}

/**
 * Create memoization key for string-based caching
 * @param config - Node configuration
 * @returns String key for caching
 */
function createMemoKey<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>
): string {
  return `${config.nodeType}-${JSON.stringify(config.handles ?? [])}`;
}

// ============================================================================
// HANDLE GENERATION
// ============================================================================

/**
 * Generate handles for a configuration
 * @param config - Node configuration
 * @param options - Configuration options
 * @returns Generated handles
 */
function generateHandles<T>(
  config: NodeFactoryConfig<T & { handles: HandleConfig[] }>,
  options: HandleConfigurationOptions
): HandleConfig[] {
  // Use provided handles or create defaults
  if (Array.isArray(config.handles) && config.handles.length > 0) {
    if (options.enableDebug) {
      debug(
        `${config.nodeType}: Using ${config.handles.length} configured handles`
      );
    }
    return [...config.handles]; // Create copy to avoid mutations
  }

  // Create default handles
  const defaultHandles = createDefaultHandlesLegacy(config.nodeType);
  if (options.enableDebug) {
    debug(`${config.nodeType}: Using ${defaultHandles.length} default handles`);
  }

  return defaultHandles;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate configured handles
 * @param handles - Handles to validate
 * @param customValidator - Optional custom validator
 * @returns Whether validation passed
 */
function validateConfiguredHandles(
  handles: HandleConfig[],
  customValidator?: (handles: HandleConfig[]) => boolean
): boolean {
  // Basic validation
  if (!Array.isArray(handles) || handles.length === 0) {
    return false;
  }

  // Check each handle has required properties
  const basicValidation = handles.every(
    (handle) =>
      handle &&
      typeof handle.id === "string" &&
      typeof handle.dataType === "string" &&
      typeof handle.type === "string" &&
      handle.position !== undefined
  );

  if (!basicValidation) {
    return false;
  }

  // Run custom validator if provided
  if (customValidator) {
    return customValidator(handles);
  }

  return true;
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Update cache performance metrics
 * @param nodeType - Node type
 * @param configurationTime - Time taken for configuration
 */
function updateCacheMetrics(nodeType: string, configurationTime: number): void {
  // Update global average
  configurationTimes.push(configurationTime);
  if (configurationTimes.length > 100) {
    configurationTimes.shift(); // Keep recent measurements
  }
  cacheMetrics.averageConfigTime =
    configurationTimes.reduce((sum, time) => sum + time, 0) /
    configurationTimes.length;

  // Update hit rate
  const totalHits = cacheMetrics.weakMapHits + cacheMetrics.stringCacheHits;
  cacheMetrics.hitRate =
    cacheMetrics.totalRequests > 0
      ? (totalHits / cacheMetrics.totalRequests) * 100
      : 0;

  // Update per-type metrics
  const typeMetrics = cacheMetrics.configTimesByType.get(nodeType) || [];
  typeMetrics.push(configurationTime);
  if (typeMetrics.length > 20) {
    typeMetrics.shift(); // Keep recent measurements per type
  }
  cacheMetrics.configTimesByType.set(nodeType, typeMetrics);
}

/**
 * Get current cache metrics
 * @returns Current cache metrics
 */
export function getHandleCacheMetrics(): HandleCacheMetrics {
  return {
    ...cacheMetrics,
    configTimesByType: new Map(cacheMetrics.configTimesByType),
  };
}

/**
 * Reset cache metrics
 */
export function resetHandleCacheMetrics(): void {
  cacheMetrics = {
    totalRequests: 0,
    weakMapHits: 0,
    stringCacheHits: 0,
    cacheMisses: 0,
    hitRate: 0,
    averageConfigTime: 0,
    configTimesByType: new Map(),
  };
  configurationTimes.length = 0;
  debug("Handle cache metrics reset");
}

/**
 * Clear all handle caches
 */
export function clearHandleCaches(): void {
  handleStringCache.clear();
  // Note: WeakMap doesn't have clear(), but it will be GC'd automatically
  debug("Handle caches cleared");
}

/**
 * Get cache statistics summary
 * @returns Cache statistics summary
 */
export function getHandleCacheStatistics() {
  const total = cacheMetrics.totalRequests;
  return {
    totalRequests: total,
    hitRate: cacheMetrics.hitRate.toFixed(1) + "%",
    weakMapHitRate:
      total > 0
        ? ((cacheMetrics.weakMapHits / total) * 100).toFixed(1) + "%"
        : "0%",
    stringCacheHitRate:
      total > 0
        ? ((cacheMetrics.stringCacheHits / total) * 100).toFixed(1) + "%"
        : "0%",
    missRate:
      total > 0
        ? ((cacheMetrics.cacheMisses / total) * 100).toFixed(1) + "%"
        : "0%",
    averageConfigTime: cacheMetrics.averageConfigTime.toFixed(2) + "ms",
    stringCacheSize: handleStringCache.size,
    uniqueNodeTypes: cacheMetrics.configTimesByType.size,
  };
}
