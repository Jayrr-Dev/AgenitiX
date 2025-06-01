// ============================================================================
// NODE FACTORY - PUBLIC API
// ============================================================================

/**
 * Modular Node Factory System
 * 
 * This is the main entry point for the refactored node factory system.
 * The monolithic 1446-line file has been broken down into focused modules:
 * 
 * - types/: TypeScript interfaces and type definitions
 * - constants/: Configuration constants and default values
 * - utils/: Core utilities (cache, propagation, JSON processing, updates)
 * - registry/: Inspector control registration system
 * - helpers/: Helper functions for common patterns
 * 
 * Benefits of the modular architecture:
 * - 87% reduction in lines per file (1446 → ~200 average)
 * - Clear separation of concerns
 * - Easy to test individual components
 * - Simple to extend with new functionality
 * - Better maintainability
 * - Type-safe with comprehensive TypeScript
 */

// ============================================================================
// MAIN FACTORY FUNCTION
// ============================================================================

export { createNodeComponent } from './NodeFactory';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type {
  BaseNodeData,
  NodeFactoryConfig,
  HandleConfig,
  NodeSize,
  InspectorControlProps,
  ProcessLogicProps,
  RenderCollapsedProps,
  RenderExpandedProps,
  CacheEntry,
  ConnectionSummary,
  NodeDataSummary,
  RelevantConnectionData,
  ErrorState,
  FilteredHandles
} from './types';

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

export {
  createTextNodeConfig,
  createLogicNodeConfig,
  createUniversalNodeConfig,
  createTriggeredNodeConfig,
  addTriggerSupport,
  shouldNodeBeActive,
  withTriggerSupport
} from './helpers/nodeConfigHelpers';

// ============================================================================
// INSPECTOR CONTROL HELPERS
// ============================================================================

export {
  createTextInputControl,
  createNumberInputControl,
  createCheckboxControl,
  createSelectControl,
  createTextareaControl,
  createRangeControl,
  createColorControl,
  createGroupControl,
  createConditionalControl,
  createButtonControl
} from './helpers/inspectorControlHelpers';

// ============================================================================
// JSON UTILITIES (Vibe Mode Support)
// ============================================================================

export {
  addJsonInputSupport,
  validateJsonInput,
  parseJsonSafely,
  sanitizeJsonData,
  detectJsonChanges,
  processJsonInput,
  getJsonConnections,
  getJsonInputValues,
  hasJsonConnections,
  createJsonProcessingTracker
} from './utils/jsonProcessor';

// ============================================================================
// PROPAGATION ENGINE
// ============================================================================

export {
  isHeadNode,
  isTransformationNode,
  checkTriggerState,
  hasActiveInputNodes,
  hasValidOutput,
  determineHeadNodeState,
  calculateHeadNodeActivation,
  handleTransformationNodeActivation,
  handleViewOutputActivation,
  determineDownstreamNodeState,
  calculateDownstreamNodeActivation
} from './utils/propagationEngine';

// ============================================================================
// UPDATE MANAGEMENT
// ============================================================================

export {
  clearPendingUpdate,
  scheduleDelayedUpdate,
  smartNodeUpdate,
  debounceNodeUpdate,
  batchNodeUpdates,
  clearAllPendingUpdates,
  getPendingUpdatesCount
} from './utils/updateManager';

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export {
  calculationCache,
  debouncedUpdates,
  createCacheKey,
  isCacheValid,
  setCacheEntry,
  getCacheEntry,
  clearCache,
  clearExpiredCache,
  getCacheStats
} from './utils/cacheManager';

// ============================================================================
// INSPECTOR REGISTRY
// ============================================================================

export {
  NODE_INSPECTOR_REGISTRY,
  registerNodeInspectorControls,
  getNodeInspectorControls,
  hasFactoryInspectorControls,
  registerNodeTypeConfig,
  getAllRegisteredNodeTypes,
  clearInspectorRegistry,
  getRegistryStats,
  removeNodeType
} from './registry/inspectorRegistry';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  CACHE_TTL,
  SMOOTH_ACTIVATION_DELAY,
  INSTANT_PRIORITY_DELAY,
  PROCESSING_THROTTLE_MS,
  DEFAULT_TEXT_NODE_SIZE,
  DEFAULT_LOGIC_NODE_SIZE,
  ERROR_INJECTION_SUPPORTED_NODES,
  TRANSFORMATION_NODE_PATTERNS,
  TRIGGER_NODE_PATTERNS,
  HEAD_NODE_PATTERNS
} from './constants'; 