/**
 * SIDEBAR CONSTANTS - Enhanced with Category Registry Integration
 *
 * • Auto-generates sidebar stencils from modern node registry
 * • Enhanced with centralized category registry for rich metadata and validation
 * • Provides category-based organization with business rules and themes
 * • Includes type-safe tab configurations and node mappings
 * • Supports dynamic sidebar organization with category registry validation
 * • Advanced category validation and enhanced metadata integration
 *
 * Keywords: sidebar, stencils, tabs, auto-generation, registry-integration,
 * categories, validation, enhanced-metadata, category-registry
 */

import {
  NodeStencil,
  TAB_CONFIG_A,
  TAB_CONFIG_B,
  TAB_CONFIG_C,
  TAB_CONFIG_D,
  TAB_CONFIG_E,
  TabKeyA,
  TabKeyB,
  TabKeyC,
  TabKeyD,
  TabKeyE,
  VariantConfig,
} from "./types";

// Modern V2U Node Registry Integration
import type { NodeType } from "../flow-engine/types/nodeData";
import {
  getAllNodeMetadata,
  getNodeMetadata as getNodeMetadataFromRegistry,
  modernNodeRegistry,
} from "../node-registry/modern-node-registry";
import type { NodeMetadata } from "../node-registry/types";

export const STORAGE_PREFIX = "sidebar-stencil-order";

// ============================================================================
// MODERN REGISTRY UTILITY FUNCTIONS
// ============================================================================

/**
 * Get node metadata from the modern registry
 */
export function getNodeMetadata(nodeType: NodeType): NodeMetadata | undefined {
  return getNodeMetadataFromRegistry(nodeType) || undefined;
}

/**
 * Get nodes by category from the modern registry
 */
export function getNodesInCategory(category: string): NodeMetadata[] {
  const allMeta = getAllNodeMetadata();
  return allMeta.filter((meta) => meta.category === category);
}

/**
 * Get nodes by folder from the modern registry
 */
export function getNodesByFolder(folder: string): NodeMetadata[] {
  const allMeta = getAllNodeMetadata();
  return allMeta.filter((meta) => meta.sidebar?.folder === folder);
}

/**
 * Get category metadata from the node metadata itself
 */
export function getCategoryMetadata(category: string) {
  const nodes = getNodesInCategory(category);
  if (nodes.length === 0) {
    return {
      displayName: category,
      icon: "📁",
      description: `${category} nodes`,
      enabled: false,
      priority: 999,
    };
  }
  // For simplicity, we'll derive the category display info from the first node.
  // A more robust system might have a separate, explicit category registry.
  const representativeNode = nodes[0];
  return {
    displayName: representativeNode.category,
    icon: representativeNode.icon || "📁",
    description: `Nodes related to ${representativeNode.category}`,
    enabled: true,
    priority: representativeNode.sidebar?.order || 999,
  };
}

/**
 * Check if a node type is valid in the modern registry
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return modernNodeRegistry.has(nodeType);
}

// ============================================================================
// ENHANCED CATEGORY REGISTRY UTILITIES
// ============================================================================

/**
 * GET CATEGORY DISPLAY DATA
 * Enhanced with category registry metadata
 */
export function getCategoryDisplayData(category: string) {
  const categoryMetadata = getCategoryMetadata(category);
  return {
    id: category,
    displayName: categoryMetadata?.displayName || category,
    icon: categoryMetadata?.icon || "📁",
    description: categoryMetadata?.description || `${category} nodes`,
    enabled: categoryMetadata?.enabled ?? true,
    priority: categoryMetadata?.priority ?? 999,
  };
}

/**
 * VALIDATE CATEGORY FOR SIDEBAR
 * Enhanced validation with category registry rules
 */
export function validateCategoryForSidebar(category: string): {
  valid: boolean;
  reason?: string;
  nodeCount: number;
  categoryData: ReturnType<typeof getCategoryDisplayData>;
} {
  const categoryData = getCategoryDisplayData(category);
  const nodes = getNodesInCategory(category);
  const nodeCount = nodes.length;

  if (!categoryData.enabled) {
    return {
      valid: false,
      reason: `Category '${category}' is disabled`,
      nodeCount,
      categoryData,
    };
  }

  if (nodeCount === 0) {
    return {
      valid: false,
      reason: `No nodes available in '${category}' category`,
      nodeCount,
      categoryData,
    };
  }

  return { valid: true, nodeCount, categoryData };
}

// ============================================================================
// REGISTRY-ENHANCED AUTO-GENERATION UTILITIES
// ============================================================================

/**
 * CREATE STENCIL FROM NODE METADATA
 * Creates a stencil using modern registry metadata
 */
export function createStencilFromNodeMetadata(
  metadata: NodeMetadata,
  prefix: string,
  index: number = 1
): NodeStencil {
  return {
    id: `${prefix}-${metadata.nodeType.toLowerCase()}-${index}`,
    nodeType: metadata.nodeType as NodeType,
    label: metadata.displayName,
    description: metadata.description,
    icon: metadata.icon,
    category: metadata.category,
    folder: metadata.sidebar?.folder,
  };
}

/**
 * CREATE STENCILS BY CATEGORY
 * Generates stencils for all nodes within a specific category
 */
export function createStencilsByCategory(
  category: string,
  prefix: string
): NodeStencil[] {
  const nodes = getNodesInCategory(category);
  return nodes.map((meta, i) =>
    createStencilFromNodeMetadata(meta, prefix, i)
  );
}

/**
 * CREATE STENCILS BY FOLDER
 * Generates stencils for all nodes within a specific sidebar folder
 */
export function createStencilsByFolder(
  folder: string,
  prefix: string
): NodeStencil[] {
  const nodes = getNodesByFolder(folder);
  return nodes.map((meta, i) =>
    createStencilFromNodeMetadata(meta, prefix, i)
  );
}

/**
 * CREATE STENCILS BY FILTER
 * A flexible function to generate stencils based on various criteria.
 * This is a powerful replacement for the previous system's rigid structure.
 */
export function createStencilsByFilter(
  filter: {
    category?: string;
    folder?: string;
    nodeTypes?: NodeType[];
  },
  prefix: string
): NodeStencil[] {
  let allMeta = getAllNodeMetadata();

  if (filter.nodeTypes) {
    const typeSet = new Set(filter.nodeTypes);
    allMeta = allMeta.filter((meta) => typeSet.has(meta.nodeType as NodeType));
  } else if (filter.category) {
    allMeta = allMeta.filter((meta) => meta.category === filter.category);
  } else if (filter.folder) {
    allMeta = allMeta.filter((meta) => meta.sidebar?.folder === filter.folder);
  }

  return allMeta.map((meta, i) =>
    createStencilFromNodeMetadata(meta, prefix, i)
  );
}

// ============================================================================
// SIDEBAR CONFIGURATIONS
// ============================================================================

// The VARIANT_CONFIG now becomes much simpler. Instead of manually defining
// every stencil, we can generate them dynamically from the registry.

export const VARIANT_CONFIG: VariantConfig = {
  A: {
    tabs: TAB_CONFIG_A,
    stencils: {
      MAIN: createStencilsByFolder("main", "a"),
      ADVANCED: createStencilsByFolder("advanced", "a"),
      IO: createStencilsByFolder("io", "a"),
    },
  },
  B: {
    tabs: TAB_CONFIG_B,
    stencils: {
      CREATE: createStencilsByCategory("create", "b"),
      VIEW: createStencilsByCategory("view", "b"),
      TRIGGER: createStencilsByCategory("trigger", "b"),
      TEST: createStencilsByCategory("test", "b"),
    },
  },
  C: {
    tabs: TAB_CONFIG_C,
    stencils: {
      ALL: createStencilsByFilter({}, "c"),
    },
  },
  D: {
    tabs: TAB_CONFIG_D,
    stencils: {
      TOP_NODES: createStencilsByFilter(
        {
          nodeTypes: [
            "createTextV2U",
            "viewOutputV2U",
            "triggerOnToggleV2U",
            "testErrorV2U",
          ],
        },
        "d"
      ),
    },
  },
  E: {
    tabs: TAB_CONFIG_E,
    stencils: {
      // Example of a more complex, mixed folder/category structure
      ESSENTIALS: [
        ...createStencilsByFolder("main", "e"),
        ...createStencilsByCategory("view", "e"),
      ],
    },
  },
};

// ============================================================================
// STATISTICS & DEBUGGING
// ============================================================================

/**
 * Provides a statistical overview of the sidebar configuration.
 */
export function getSidebarStatistics() {
  const totalNodes = modernNodeRegistry.size;
  const categories = new Set(getAllNodeMetadata().map((n) => n.category));
  const folders = new Set(
    getAllNodeMetadata()
      .map((n) => n.sidebar?.folder)
      .filter(Boolean)
  );

  return {
    totalRegisteredNodes: totalNodes,
    totalCategories: categories.size,
    totalFolders: folders.size,
    categoryNames: Array.from(categories),
    folderNames: Array.from(folders as Set<string>),
    stencilsInVariants: {
      A:
        VARIANT_CONFIG.A.stencils.MAIN.length +
        VARIANT_CONFIG.A.stencils.ADVANCED.length +
        VARIANT_CONFIG.A.stencils.IO.length,
      B:
        VARIANT_CONFIG.B.stencils.CREATE.length +
        VARIANT_CONFIG.B.stencils.VIEW.length +
        VARIANT_CONFIG.B.stencils.TRIGGER.length +
        VARIANT_CONFIG.B.stencils.TEST.length,
      C: VARIANT_CONFIG.C.stencils.ALL.length,
      D: VARIANT_CONFIG.D.stencils.TOP_NODES.length,
      E: VARIANT_CONFIG.E.stencils.ESSENTIALS.length,
    },
  };
}

/**
 * Validates the entire sidebar configuration against the modern registry.
 */
export function validateSidebarConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: ReturnType<typeof getSidebarStatistics>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const statistics = getSidebarStatistics();

  if (statistics.totalRegisteredNodes === 0) {
    warnings.push("No nodes found in the modern node registry. Sidebar will be empty.");
  }

  // Example validation: Check if a category used in a variant actually has nodes.
  const createNodes = getNodesInCategory("create");
  if (createNodes.length === 0) {
    warnings.push(
      "The 'create' category is used in Variant B, but no nodes are registered in this category."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics,
  };
}

/**
 * Helper to get the original node type from a generated stencil ID.
 */
export function getNodeTypeFromStencilId(stencilId: string): NodeType | null {
  const parts = stencilId.split("-");
  if (parts.length < 2) return null;

  const potentialNodeType = parts.slice(1, -1).join("-");

  // This is a naive implementation. A better approach would be to search
  // through all stencils to find the matching ID.
  const allStencils = Object.values(VARIANT_CONFIG)
    .flatMap((v) => Object.values(v.stencils))
    .flat();

  const stencil = allStencils.find((s) => s.id === stencilId);
  return stencil ? (stencil.nodeType as NodeType) : null;
}

/**
 * Function to dynamically refresh stencils if needed (e.g., if registry changes at runtime).
 */
export function refreshStencils(): typeof VARIANT_CONFIG {
  // This is a placeholder for a more advanced dynamic system.
  // For now, it just returns the statically generated config.
  console.log("Refreshing sidebar stencils...");
  return VARIANT_CONFIG;
}

/**
 * Logs a comprehensive debug report of the sidebar state to the console.
 */
export function logSidebarDebugInfo(): void {
  console.group("Sidebar Debug Information");
  console.log("Validation:", validateSidebarConfiguration());
  console.log("Full Variant Config:", VARIANT_CONFIG);
  console.groupEnd();
}
