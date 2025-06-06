/**
 * MODERN REGISTRY ADAPTER - Compatibility layer for gradual migration
 *
 * • Provides legacy API compatibility while using new TypedRegistry system
 * • Enables gradual migration without breaking existing code
 * • Includes performance optimizations with memoization
 * • Supports both legacy and modern usage patterns
 *
 * Keywords: compatibility, adapter, legacy-support, gradual-migration
 */

import type { NodeType } from "../../../flow-engine/types/nodeData";
import type {
  BaseNodeData,
  HandleConfig,
  InspectorControlProps,
  NodeCategory,
  NodeSize,
  SidebarFolder,
} from "../../factory/types";
import { categoryRegistry, getCategoryMetadata } from "../category";
import {
  getInspectorControls,
  hasInspectorControls,
  inspectorRegistry,
} from "../inspector";
import { getNodeMetadata, isValidNodeType, nodeRegistry } from "../node";
import type { ReactNode } from "../types/shared";

// ============================================================================
// LEGACY API COMPATIBILITY - Node Registry
// ============================================================================

/**
 * Legacy-compatible node metadata getter with memoization
 */
const nodeMetadataCache = new Map<NodeType, any>();

export function getNodeMetadataLegacy(nodeType: NodeType): any | null {
  // Check cache first for performance
  if (nodeMetadataCache.has(nodeType)) {
    return nodeMetadataCache.get(nodeType);
  }

  const registration = getNodeMetadata(nodeType);
  if (!registration) return null;

  // Convert to legacy format
  const legacyMetadata = {
    nodeType: registration.nodeType,
    component: registration.component,
    category: registration.category,
    folder: registration.folder,
    displayName: registration.displayName,
    description: registration.description,
    hasToggle: registration.hasToggle,
    iconWidth: registration.iconWidth,
    iconHeight: registration.iconHeight,
    expandedWidth: registration.expandedWidth,
    expandedHeight: registration.expandedHeight,
    icon: registration.icon,
    factoryConfig: registration.factoryConfig,
    handles: registration.handles,
    size: registration.size,
    defaultData: registration.defaultData,
    hasTargetPosition: registration.hasTargetPosition,
    targetPosition: registration.targetPosition,
    hasOutput: registration.hasOutput,
    hasControls: registration.hasControls,
    factoryLabel: registration.displayName, // Map displayName to factoryLabel
    factoryDefaultData: registration.defaultData,
    // Legacy inspector controls configuration
    inspectorControls: {
      type: hasInspectorControls(nodeType) ? "factory" : "none",
      factoryControls: hasInspectorControls(nodeType),
    },
  };

  // Cache the result
  nodeMetadataCache.set(nodeType, legacyMetadata);
  return legacyMetadata;
}

/**
 * Legacy-compatible node category mapping
 */
export function getNodeCategoryMapping(): Record<NodeType, NodeCategory> {
  const mapping: Record<string, NodeCategory> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    mapping[nodeType] = registration.category;
  }

  return mapping as Record<NodeType, NodeCategory>;
}

/**
 * Legacy-compatible sidebar folder mapping
 */
export function getSidebarFolderMapping(): Record<NodeType, SidebarFolder> {
  const mapping: Record<string, SidebarFolder> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    mapping[nodeType] = registration.folder;
  }

  return mapping as Record<NodeType, SidebarFolder>;
}

/**
 * Legacy-compatible nodes by category
 */
export function getNodesInCategory(category: NodeCategory): NodeType[] {
  return nodeRegistry
    .getNodesByCategory(category)
    .map((registration) => registration.nodeType);
}

/**
 * Legacy-compatible nodes by folder
 */
export function getNodesByFolder(folder: SidebarFolder): NodeType[] {
  return nodeRegistry
    .getNodesByFolder(folder)
    .map((registration) => registration.nodeType);
}

/**
 * Legacy-compatible node handles getter
 */
export function getNodeHandles(nodeType: NodeType): HandleConfig[] {
  return nodeRegistry.getNodeHandles(nodeType);
}

/**
 * Legacy-compatible factory config getter
 */
export function getFactoryConfig<T extends BaseNodeData>(
  nodeType: NodeType
): any | null {
  const registration = getNodeMetadata<T>(nodeType);
  return registration?.factoryConfig || null;
}

/**
 * Legacy-compatible node size config getter
 */
export function getNodeSizeConfig(nodeType: NodeType): NodeSize | null {
  const registration = getNodeMetadata(nodeType);
  return registration?.size || null;
}

/**
 * Legacy-compatible factory-enabled check
 */
export function isFactoryEnabledNode(nodeType: NodeType): boolean {
  return nodeRegistry.isFactoryEnabled(nodeType);
}

/**
 * Legacy-compatible node dimensions getter
 */
export function getNodeDimensions(nodeType: NodeType, isExpanded = false): any {
  const dimensions = nodeRegistry.getNodeDimensions(nodeType, isExpanded);
  if (!dimensions) return null;

  return {
    width: dimensions.width,
    height: dimensions.height,
    iconWidth: !isExpanded ? dimensions.width : undefined,
    iconHeight: !isExpanded ? dimensions.height : undefined,
    expandedWidth: isExpanded ? dimensions.width : undefined,
    expandedHeight: isExpanded ? dimensions.height : undefined,
  };
}

// ============================================================================
// LEGACY API COMPATIBILITY - Inspector Registry
// ============================================================================

/**
 * Legacy-compatible inspector controls getter
 */
export function getNodeInspectorControls<T extends BaseNodeData>(
  nodeType: string
): ((props: InspectorControlProps<T>) => ReactNode) | undefined {
  return getInspectorControls<T>(nodeType as NodeType);
}

/**
 * Legacy-compatible inspector controls checker
 */
export function hasFactoryInspectorControls(nodeType: string): boolean {
  return hasInspectorControls(nodeType as NodeType);
}

/**
 * Legacy-compatible factory-enabled inspector check
 */
export function isFactoryEnabledInspector(nodeType: string): boolean {
  return inspectorRegistry.isFactoryEnabled(nodeType as NodeType);
}

/**
 * Legacy-compatible inspector config getter
 */
export function getFactoryInspectorConfig<T extends BaseNodeData>(
  nodeType: string
): any | undefined {
  return inspectorRegistry.getInspectorMetadata<T>(nodeType as NodeType);
}

// ============================================================================
// LEGACY API COMPATIBILITY - Category Registry
// ============================================================================

/**
 * Legacy-compatible category metadata getter
 */
export function getCategoryRegistryMetadata(category: NodeCategory): any {
  const registration = getCategoryMetadata(category);
  if (!registration) return null;

  return {
    category: registration.category,
    displayName: registration.displayName,
    description: registration.description,
    icon: registration.icon,
    color: registration.color,
    order: registration.order,
    folder: registration.folder,
    isEnabled: registration.isEnabled,
    // Legacy fields
    folderName: registration.folder,
    categoryName: registration.category,
    metadata: {
      icon: registration.icon,
      color: registration.color,
      displayName: registration.displayName,
    },
  };
}

// ============================================================================
// PERFORMANCE OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Memoized node type configuration generator
 */
let nodeTypeConfigCache: Record<NodeType, any> | null = null;

export function generateNodeTypeConfig(): Record<NodeType, any> {
  if (nodeTypeConfigCache) {
    return nodeTypeConfigCache;
  }

  const config: Record<string, any> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    config[nodeType] = {
      defaultData: registration.defaultData,
      displayName: registration.displayName,
      hasControls: registration.hasControls,
      hasOutput: registration.hasOutput,
      category: registration.category,
      folder: registration.folder,
    };
  }

  nodeTypeConfigCache = config as Record<NodeType, any>;
  return nodeTypeConfigCache;
}

/**
 * Clear all caches (for development/testing)
 */
export function clearCompatibilityCache(): void {
  nodeMetadataCache.clear();
  nodeTypeConfigCache = null;
}

// ============================================================================
// LEGACY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Legacy-compatible registry validation
 */
export function validateRegistry(): boolean {
  const nodeValidation = nodeRegistry.validateRegistry();
  const inspectorValidation = inspectorRegistry.validateRegistry();

  return nodeValidation.isValid && inspectorValidation.isValid;
}

/**
 * Legacy-compatible node validation for inspector
 */
export function validateNodeForInspector(nodeType: string): {
  isValid: boolean;
  nodeType: NodeType | string;
  metadata: any;
  config: any;
  warnings: string[];
  suggestions: string[];
} {
  const isValidType = isValidNodeType(nodeType);
  const metadata = isValidType
    ? getNodeMetadataLegacy(nodeType as NodeType)
    : null;
  const config = isValidType
    ? generateNodeTypeConfig()[nodeType as NodeType]
    : null;

  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (!isValidType) {
    warnings.push(`Invalid node type: ${nodeType}`);
    suggestions.push("Check available node types in the registry");
  }

  if (metadata && !hasInspectorControls(nodeType as NodeType)) {
    warnings.push("Node has no inspector controls configured");
    suggestions.push("Consider adding inspector controls for better UX");
  }

  return {
    isValid: isValidType && !!metadata,
    nodeType: isValidType ? (nodeType as NodeType) : nodeType,
    metadata,
    config,
    warnings,
    suggestions,
  };
}

/**
 * Legacy-compatible registry statistics
 */
export function getRegistryStats() {
  const nodeStats = nodeRegistry.getRegistryStats();
  const inspectorStats = inspectorRegistry.getRegistryStats();
  const categoryStats = categoryRegistry.getRegistryStats();

  return {
    nodes: {
      total: nodeStats.size,
      factoryEnabled: nodeStats.domain.factoryEnabled,
      categories: nodeStats.domain.categories,
      folders: nodeStats.domain.folders,
    },
    inspectors: {
      total: inspectorStats.size,
      factoryEnabled: inspectorStats.domain.factoryEnabled,
      controlTypes: inspectorStats.domain.controlTypes,
    },
    categories: {
      total: categoryStats.size,
      enabled: categoryStats.domain.enabled,
      folders: categoryStats.domain.folders,
    },
    performance: {
      nodeOperations: nodeStats.operations,
      inspectorOperations: inspectorStats.operations,
      categoryOperations: categoryStats.operations,
    },
  };
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Check if migration to new system is complete
 */
export function isMigrationComplete(): boolean {
  return nodeRegistry.size() > 0 && inspectorRegistry.size() > 0;
}

/**
 * Get migration status
 */
export function getMigrationStatus(): {
  isComplete: boolean;
  nodeCount: number;
  inspectorCount: number;
  categoryCount: number;
  hasCache: boolean;
} {
  return {
    isComplete: isMigrationComplete(),
    nodeCount: nodeRegistry.size(),
    inspectorCount: inspectorRegistry.size(),
    categoryCount: categoryRegistry.size(),
    hasCache: nodeMetadataCache.size > 0,
  };
}
