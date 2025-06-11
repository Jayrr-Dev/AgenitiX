/**
 * UTILS SYSTEM EXPORTS
 *
 * Centralized exports for factory utilities organized by responsibility.
 * Provides clean import paths for all utility modules while maintaining
 * backward compatibility through legacy exports.
 *
 * @author Factory Utilities Team
 * @since v3.0.0
 */

// ============================================================================
// ORGANIZED UTILITY EXPORTS
// ============================================================================

// Creation utilities
export * from "./creation";

// Processing utilities
export * from "./processing";

// Validation utilities
export * from "./validation";

// Optimization utilities
export * from "./optimization";

// Handle utilities
export * from "./handles";

// UI utilities
export * from "./ui";

// Management utilities
export * from "./management";

// ============================================================================
// REMAINING UTILITIES (TO BE ORGANIZED)
// ============================================================================

// Node utilities (comprehensive node helpers)
export * from "./management/nodeUtilities";

// Advanced button system
export * from "./ui/advancedButtonSystem";

// Conditional rendering utilities
export * from "./ui/conditionalRendering";

// ============================================================================
// LEGACY BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// DEPRECATED: Re-export commonly used utilities for backward compatibility
// These functions are now integrated into UltraFastPropagationEngine
// export {
//   calculateDownstreamNodeActivation,
//   calculateHeadNodeActivation,
//   checkTriggerState,
//   determineDownstreamNodeState,
//   determineHeadNodeState,
//   hasActiveInputNodes,
// } from "./processing/propagationEngine";

export {
  clearCache,
  clearExpiredCache,
  getCacheEntry,
  getCacheStats,
  setCacheEntry,
} from "./optimization/cacheManager";

export {
  convertToTypeSafeConnection,
  findInvalidConnections,
  validateConnectionCompatibility,
} from "./validation/typeSafeConnections";

export {
  cleanupNodeEnhanced,
  getNodeStateInfo,
  getSafetyLayers,
  globalSafetyLayers,
  validateNodeIntegrityEnhanced,
} from "./management/nodeUtilities";

export {
  getNodeSize,
  getVibeHandleOpacity,
  shouldShowVibeHandle,
} from "./ui/conditionalRendering";

// ============================================================================
// MODULE METADATA
// ============================================================================

export const UTILS_SYSTEM_VERSION = "3.0.0";
export const UTILS_ORGANIZATION_DATE = "2024-01-20";
