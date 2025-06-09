/**
 * FACTORY CONSTANTS - Centralized constant definitions
 *
 * • Exports all factory constants from organized modules
 * • Provides clean import paths for constants
 * • Includes node types, handles, sizes, and processing constants
 * • Features comprehensive constant validation and utilities
 *
 * Keywords: constants, exports, node-types, handles, sizes, processing
 */

// Node type constants and validation
export * from "./nodeTypes";

// Handle configuration constants
export * from "./handles";

// Size and dimension constants
export * from "./sizes";

// Processing constants
export const PROCESSING_THROTTLE_MS = 100;
export const GPU_ACCELERATION_THRESHOLD = 50;
export const IDLE_HYDRATION_TIMEOUT = 3000;
export const OBJECT_POOL_SIZE = 100;
export const CACHE_EXPIRY_MS = 300000; // 5 minutes

// Performance constants
export const PERFORMANCE_CONSTANTS = {
  THROTTLE_MS: PROCESSING_THROTTLE_MS,
  GPU_THRESHOLD: GPU_ACCELERATION_THRESHOLD,
  IDLE_TIMEOUT: IDLE_HYDRATION_TIMEOUT,
  POOL_SIZE: OBJECT_POOL_SIZE,
  CACHE_EXPIRY: CACHE_EXPIRY_MS,
} as const;

// Debug constants
export const DEBUG_FLAGS = {
  FACTORY: "debug=factory",
  PERFORMANCE: "debug=performance",
  PROPAGATION: "debug=propagation",
  SAFETY: "debug=safety",
} as const;

// System constants
export const SYSTEM_CONSTANTS = {
  MAX_RETRIES: 3,
  CLEANUP_INTERVAL: 60000, // 1 minute
  MEMORY_THRESHOLD: 0.8,
  CONNECTION_TIMEOUT: 5000,
} as const;
