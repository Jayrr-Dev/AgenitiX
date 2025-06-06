/**
 * MODERN REGISTRY INDEX - Primary interface for the new unified registry system
 *
 * • Exports new TypedRegistry-based system as primary interface
 * • Provides performance-optimized, type-safe registry operations
 * • Eliminates duplicate registry issues from legacy system
 * • Single source of truth for all registry operations
 * • Includes YAML-generated registries for schema-driven configuration
 *
 * Keywords: modern-registry, unified-system, primary-interface, deduplication, yaml-driven
 */

// ============================================================================
// GENERATED REGISTRIES - YAML-Driven Configuration
// ============================================================================

// Export all generated registries from YAML configurations
export * from "./generated";

// ============================================================================
// PRIMARY EXPORTS - New Unified System
// ============================================================================

// Core registry instances
export {
  categoryRegistry,
  inspectorRegistry,
  nodeRegistry,
} from "./unifiedRegistry";

// Registry functions - preferred API
export {
  getNodeMetadata,
  getNodeTypes,
  isValidNodeType,
  // Node registry
  registerNode,
} from "./node";

export {
  getInspectorControls,
  hasInspectorControls,
  // Inspector registry
  registerInspectorControls,
  registerLegacyInspectorControls,
} from "./inspector";

export {
  getCategoriesByFolder,
  getCategoryMetadata,
  getEnabledCategories,
  // Category registry
  registerCategory,
} from "./category";

// Unified registry functions
export {
  getLegacyFactoryInspectorRegistry,
  getLegacyInspectorRegistry,
  getLegacyNodeRegistry,
  getUnifiedRegistryStats,
  initializeUnifiedRegistry,
  validateUnifiedRegistry,
} from "./unifiedRegistry";

// Migration utilities
export {
  DEFAULT_MIGRATION_CONFIG,
  generateMigrationReport,
  getMigrationProgress,
  migrateCategoriesFromConfig,
  migrateCompleteRegistry,
  migrateInspectorsFromLegacyRegistry,
  migrateNodesFromLegacyRegistry,
  type MigrationConfig,
  type MigrationStats,
} from "./migration/registryMigration";

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { CategoryRegistration } from "./category";
export type { InspectorRegistration } from "./inspector";
export type { NodeRegistration } from "./node";

// Shared types
export type {
  CacheStats,
  ComponentType,
  PerformanceMetrics,
  Position,
  ReactNode,
  RegistryKey,
  RegistryOperationResult,
  RegistryStats,
  ValidationResult,
} from "./types/shared";

// Base registry
export { MemoizedTypedRegistry, TypedRegistry } from "./base/TypedRegistry";

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS (Deprecated)
// ============================================================================

/**
 * @deprecated Use the new unified registry system instead
 * These exports are provided for backward compatibility only
 */
export {
  // Legacy registry object (use getLegacyNodeRegistry() instead)
  MODERN_NODE_REGISTRY,
  generateNodeTypeConfig,

  // Legacy inspector functions
  getFactoryConfig,
  getNodeCategoryMapping,
  getNodeDimensions,
  getNodeHandles,
  // Legacy functions (use new registry methods instead)
  getNodeMetadata as getNodeMetadataLegacy,
  getNodeSizeConfig,
  getNodeTypes as getNodeTypesLegacy,
  getNodesByFolder,
  getNodesInCategory,
  getRegistryStats as getRegistryStatsLegacy,
  getSidebarFolderMapping,
  isFactoryEnabledNode,
  // Legacy validation
  validateRegistry,
} from "./nodeRegistry";

/**
 * @deprecated Use inspectorRegistry from unified system instead
 */
export {
  FACTORY_INSPECTOR_REGISTRY,
  NODE_INSPECTOR_REGISTRY,
  getFactoryInspectorConfig,
  getNodeInspectorControls as getNodeInspectorControlsLegacy,
  hasFactoryInspectorControls,
  isFactoryEnabledInspector,
  registerFactoryInspectorControls,
  registerNodeInspectorControls,
} from "./inspectorRegistry";

// ============================================================================
// MODERN API EXAMPLES AND DOCUMENTATION
// ============================================================================

/**
 * MODERN USAGE EXAMPLES
 *
 * // Register a new node
 * registerNode({
 *   nodeType: "myNode",
 *   component: MyNodeComponent,
 *   category: "create",
 *   folder: "main",
 *   displayName: "My Node",
 *   description: "Does something cool",
 *   icon: "🎯",
 *   hasToggle: true,
 *   iconWidth: 120,
 *   iconHeight: 60,
 *   expandedWidth: 200,
 *   expandedHeight: 120,
 *   defaultData: { value: "" },
 *   handles: [],
 * });
 *
 * // Get node metadata (type-safe)
 * const metadata = getNodeMetadata<MyNodeData>("myNode");
 *
 * // Register inspector controls
 * registerInspectorControls({
 *   nodeType: "myNode",
 *   displayName: "My Node Controls",
 *   controlType: "factory",
 *   defaultData: { value: "" },
 *   renderControls: (props) => <MyNodeControls {...props} />,
 * });
 *
 * // Get all node types for ReactFlow
 * const nodeTypes = getNodeTypes();
 *
 * // Validate registry
 * const validation = validateUnifiedRegistry();
 *
 * // Get statistics
 * const stats = getUnifiedRegistryStats();
 */

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

/**
 * Development-only registry debugging utilities
 */
export const RegistryDebug = {
  /**
   * Get detailed registry information for debugging
   */
  getDebugInfo() {
    return {
      unified: getUnifiedRegistryStats(),
      validation: validateUnifiedRegistry(),
      counts: {
        nodes: nodeRegistry.size(),
        inspectors: inspectorRegistry.size(),
        categories: categoryRegistry.size(),
      },
    };
  },

  /**
   * Validate all registries and return detailed report
   */
  validateAll() {
    const nodeValidation = nodeRegistry.validateRegistry();
    const inspectorValidation = inspectorRegistry.validateRegistry();
    const unifiedValidation = validateUnifiedRegistry();

    return {
      nodes: nodeValidation,
      inspectors: inspectorValidation,
      unified: unifiedValidation,
      overall:
        nodeValidation.isValid &&
        inspectorValidation.isValid &&
        unifiedValidation.isValid,
    };
  },

  /**
   * Clear all caches for testing
   */
  clearCaches() {
    nodeRegistry.resetStats();
    inspectorRegistry.resetStats();
    categoryRegistry.resetStats();
  },
};

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

/**
 * Ensure the unified registry is initialized when this module is imported
 * This guarantees backward compatibility with existing code
 */
import "./unifiedRegistry"; // This triggers initializeUnifiedRegistry()

// ============================================================================
// VERSION AND METADATA
// ============================================================================

export const REGISTRY_VERSION = "2.0.0";
export const REGISTRY_BUILD_INFO = {
  version: REGISTRY_VERSION,
  buildDate: new Date().toISOString(),
  features: [
    "TypedRegistry base class",
    "Domain-specific registries",
    "Memory optimization with LRU cache",
    "Type-safe operations",
    "Legacy compatibility layer",
    "Migration utilities",
    "Validation system",
    "Performance monitoring",
  ],
};
