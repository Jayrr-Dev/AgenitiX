/**
 * HANDLE UTILITIES - Handle Factory and Configuration
 *
 * • Exports comprehensive handle creation and configuration systems
 * • Provides performance-optimized handle management
 * • Implements JSON registry integration with fallback handling
 * • Features dual-layer caching and performance metrics
 *
 * Keywords: handles, factory, configuration, caching, performance, json-registry
 */

// Handle Factory
export {
  createDefaultHandles,
  createDefaultHandlesLegacy,
  FALLBACK_HANDLE_CONFIGS,
  getHandleGenerationSummary,
  getHandleMetrics,
  resetHandleMetrics,
  validateHandle,
  validateHandles,
} from "./handleFactory";

export type {
  HandleGenerationOptions,
  HandleGenerationResult,
  HandleMetrics,
} from "./handleFactory";

// Handle Configuration
export {
  clearHandleCaches,
  configureNodeHandles,
  configureNodeHandlesLegacy,
  getHandleCacheMetrics,
  getHandleCacheStatistics,
  resetHandleCacheMetrics,
} from "./handleConfiguration";

export type {
  HandleCacheMetrics,
  HandleConfigurationOptions,
  HandleConfigurationResult,
} from "./handleConfiguration";
