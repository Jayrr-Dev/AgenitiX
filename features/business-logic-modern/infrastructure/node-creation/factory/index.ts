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

// Integrated NodeFactory (recommended)
export { IntegratedNodeFactory as NodeFactory } from "./utils/nodeFactoryIntegrated";
export * from "./utils/nodeFactoryIntegrated";

// JSON Registry Adapter
export {
  JsonNodeFactory,
  jsonRegistryAdapter,
} from "./adapters/jsonRegistryAdapter";
export type { JsonNodeConfig } from "./adapters/jsonRegistryAdapter";

// Main Factory Component
export { createNodeComponent, SafetyLayersProvider } from "./NodeFactory";

// Factory Types
export type * from "./types";

// Factory Constants
export {
  initializeFactoryConfig,
  getNodeTypeConfig,
  getValidNodeTypes,
  NODE_ID_PREFIX,
  TOGGLE_SYMBOLS,
  ERROR_INJECTION_SUPPORTED_NODES,
  CACHE_TTL,
  SMOOTH_ACTIVATION_DELAY,
  INSTANT_PRIORITY_DELAY,
  PROCESSING_THROTTLE_MS,
} from "./constants";

// Factory Components
export { NodeContainer } from "./components/NodeContainer";
export { NodeContent } from "./components/NodeContent";

// Factory Hooks
export { useNodeConnections } from "./hooks/useNodeConnections";
export { useNodeHandles } from "./hooks/useNodeHandles";
export { useNodeProcessing } from "./hooks/useNodeProcessing";
export { useNodeRegistration } from "./hooks/useNodeRegistration";
export { useNodeState } from "./hooks/useNodeState";
export { useNodeStyling } from "./hooks/useNodeStyling";

// Factory Utilities
export { addJsonInputSupport } from "./utils/jsonProcessor";
export { validateSizeConfig } from "./constants/sizes";

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Re-export common patterns for easy access
export {
  createNode,
  isValidNodeType,
  getNodeDefaultData,
  getNodeConfig,
  getNodeHandles,
  getNodeMetadata,
  copyNode,
  toggleNodeUI,
  getNodeSize,
} from "./utils/nodeFactoryIntegrated";
