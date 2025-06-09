/**
 * FACTORY SYSTEM INDEX - Main exports for integrated JSON registry + factory system
 *
 * • Exports all factory functionality with JSON registry integration
 * • Provides unified access to node creation, validation, and manipulation
 * • Includes factory components, adapters, and utility functions
 * • Maintains backward compatibility while adding modern features
 * • Centralizes all factory-related exports for easy consumption
 *
 * Keywords: factory-index, exports, json-registry, integration, node-creation
 */

// ============================================================================
// MAIN FACTORY EXPORTS
// ============================================================================

// Unified Integration (recommended)
export {
  createIntegratedFactory,
  createUnifiedFactory,
  IntegratedNodeFactory,
  IntegratedNodeFactory as NodeFactory,
  unifiedFactory,
} from "./core/UnifiedIntegration";

export type {
  IntegrationConfig,
  UnifiedNodeFactory,
} from "./core/UnifiedIntegration";

// JSON Registry Adapter (legacy compatibility)
export {
  JsonRegistryAdapter,
  jsonRegistryAdapter,
} from "./adapters/jsonRegistryAdapter";
export type { JsonNodeConfig } from "./adapters/jsonRegistryAdapter";

// Main Factory Component
export { createNodeComponent, SafetyLayersProvider } from "./NodeFactory";

// Factory Types
export type * from "./types";

// Factory Constants
export {
  CACHE_TTL,
  ERROR_INJECTION_SUPPORTED_NODES,
  getNodeTypeConfig,
  getValidNodeTypes,
  initializeFactoryConfig,
  INSTANT_PRIORITY_DELAY,
  NODE_ID_PREFIX,
  PROCESSING_THROTTLE_MS,
  SMOOTH_ACTIVATION_DELAY,
  TOGGLE_SYMBOLS,
} from "./constants";

// Factory Components
export { NodeContainer } from "./components/NodeContainer";
export { NodeContent } from "./components/NodeContent";

// Factory Systems (Phase 1 reorganization)
export {
  createNodeParkingManager,
  createScheduler,
  NodeDataBuffer,
  // Safety System
  NodeErrorBoundary,
  // Performance System
  ObjectPool,
  PriorityScheduler,
  // Propagation System
  UltraFastPropagationEngine,
  useUltraFastPropagation,
} from "./systems";

// Factory Hooks (organized by responsibility - Phase 2)
export * from "./hooks";

// Factory Utilities
export { validateSizeConfig } from "./constants/sizes";
export { addJsonInputSupport } from "./utils/processing/jsonProcessor";

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Re-export common patterns for easy access
export {
  copyNode,
  createNode,
  getNodeConfig,
  getNodeDefaultData,
  getNodeHandles,
  getNodeMetadata,
  getNodeSize,
  isValidNodeType,
  toggleNodeUI,
} from "./core/UnifiedIntegration";
