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

// JSON REGISTRY INTEGRATION - Updated imports for JSON-based registry system
import type { NodeType } from "../flow-engine/types/nodeData";
import type {
  NodeCategory,
  SidebarFolder,
} from "../node-creation/factory/types";
import {
  GENERATED_NODE_REGISTRY,
  NODE_TYPES,
} from "../node-creation/json-node-registry/generated/nodeRegistry";

export const STORAGE_PREFIX = "sidebar-stencil-order";

// ============================================================================
// JSON REGISTRY UTILITY FUNCTIONS
// ============================================================================

/**
 * Get node metadata from JSON registry
 */
export function getNodeMetadata(nodeType: NodeType) {
  return GENERATED_NODE_REGISTRY[
    nodeType as keyof typeof GENERATED_NODE_REGISTRY
  ];
}

/**
 * Get nodes by category from JSON registry
 */
export function getNodesInCategory(category: NodeCategory): NodeType[] {
  return NODE_TYPES.filter((nodeType) => {
    const metadata = getNodeMetadata(nodeType as NodeType);
    return metadata?.category === category;
  }) as NodeType[];
}

/**
 * Get nodes by folder from JSON registry
 */
export function getNodesByFolder(folder: SidebarFolder): NodeType[] {
  return NODE_TYPES.filter((nodeType) => {
    const metadata = getNodeMetadata(nodeType as NodeType);
    return metadata?.folder === folder;
  }) as NodeType[];
}

/**
 * Get category metadata (simplified version for JSON registry)
 */
export function getCategoryMetadata(category: NodeCategory) {
  // Basic category metadata - can be expanded with a dedicated category registry
  const categoryConfig = {
    create: {
      displayName: "Create",
      icon: "📝",
      description: "Creation nodes",
      enabled: true,
      priority: 1,
    },
    view: {
      displayName: "View",
      icon: "👁️",
      description: "Display nodes",
      enabled: true,
      priority: 2,
    },
    trigger: {
      displayName: "Trigger",
      icon: "⚡",
      description: "Trigger nodes",
      enabled: true,
      priority: 3,
    },
    test: {
      displayName: "Test",
      icon: "🧪",
      description: "Testing nodes",
      enabled: true,
      priority: 4,
    },
    cycle: {
      displayName: "Cycle",
      icon: "🔄",
      description: "Cycle nodes",
      enabled: true,
      priority: 5,
    },
    data: {
      displayName: "Data",
      icon: "📊",
      description: "Data nodes",
      enabled: true,
      priority: 6,
    },
    media: {
      displayName: "Media",
      icon: "🎬",
      description: "Media nodes",
      enabled: true,
      priority: 7,
    },
    utility: {
      displayName: "Utility",
      icon: "🔧",
      description: "Utility nodes",
      enabled: true,
      priority: 8,
    },
    testing: {
      displayName: "Testing",
      icon: "🧪",
      description: "Testing nodes",
      enabled: true,
      priority: 9,
    },
  };

  return (
    categoryConfig[category] || {
      displayName: category,
      icon: "📁",
      description: `${category} nodes`,
      enabled: true,
      priority: 999,
    }
  );
}

/**
 * Check if a node type is valid in the JSON registry
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return nodeType in GENERATED_NODE_REGISTRY;
}

// ============================================================================
// ENHANCED CATEGORY REGISTRY UTILITIES
// ============================================================================

/**
 * GET CATEGORY DISPLAY DATA
 * Enhanced with category registry metadata
 */
export function getCategoryDisplayData(category: NodeCategory) {
  const categoryMetadata = getCategoryMetadata(category);
  return {
    id: category,
    displayName: categoryMetadata?.displayName || category,
    icon: categoryMetadata?.icon || "📁",
    description: categoryMetadata?.description || `${category} nodes`,
    enabled: categoryMetadata?.enabled ?? true,
    priority: categoryMetadata?.priority ?? 999,
    // theme: categoryMetadata?.theme, // Optional theme property
  };
}

/**
 * VALIDATE CATEGORY FOR SIDEBAR
 * Enhanced validation with category registry rules
 */
export function validateCategoryForSidebar(category: NodeCategory): {
  valid: boolean;
  reason?: string;
  nodeCount: number;
  categoryData: ReturnType<typeof getCategoryDisplayData>;
} {
  const categoryData = getCategoryDisplayData(category);
  const nodeCount = getNodesInCategory(category).length;

  if (!categoryData.enabled) {
    return {
      valid: false,
      reason: `Category '${category}' is disabled in registry`,
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
 * CREATE STENCIL FROM NODE TYPE
 * Creates a stencil using modern registry metadata
 */
export function createStencilFromNodeType(
  nodeType: NodeType,
  prefix: string,
  index: number = 1
): NodeStencil {
  const metadata = getNodeMetadata(nodeType);

  if (!metadata) {
    throw new Error(`No metadata found for node type: ${nodeType}`);
  }

  return {
    id: `${prefix}-${nodeType.toLowerCase()}-${index}`,
    nodeType: nodeType,
    label: metadata.displayName,
    description: metadata.description,
    icon: metadata.icon, // Enhanced with icon from registry
    category: metadata.category, // Enhanced with category from registry
    folder: metadata.folder, // Enhanced with folder from registry
  };
}

/**
 * CREATE STENCILS BY CATEGORY
 * Auto-generates stencils for nodes in a specific category
 */
export function createStencilsByCategory(
  category: NodeCategory,
  prefix: string
): NodeStencil[] {
  const nodeTypes = getNodesInCategory(category);
  return nodeTypes.map((nodeType, index) =>
    createStencilFromNodeType(nodeType, prefix, index + 1)
  );
}

/**
 * CREATE STENCILS BY FOLDER
 * Auto-generates stencils for nodes in a specific sidebar folder
 */
export function createStencilsByFolder(
  folder: SidebarFolder,
  prefix: string
): NodeStencil[] {
  const nodeTypes = getNodesByFolder(folder);
  return nodeTypes.map((nodeType, index) =>
    createStencilFromNodeType(nodeType, prefix, index + 1)
  );
}

/**
 * CREATE STENCILS BY FILTER
 * Advanced filtering for stencil generation
 */
export function createStencilsByFilter(
  filter: {
    category?: NodeCategory;
    folder?: SidebarFolder;
    hasToggle?: boolean;
    nodeTypes?: NodeType[];
  },
  prefix: string
): NodeStencil[] {
  let nodeTypes: NodeType[] = [];

  if (filter.nodeTypes) {
    nodeTypes = filter.nodeTypes;
  } else if (filter.category && filter.folder) {
    // Get intersection of category and folder
    const categoryNodes = getNodesInCategory(filter.category);
    const folderNodes = getNodesByFolder(filter.folder);
    nodeTypes = categoryNodes.filter((nodeType) =>
      folderNodes.includes(nodeType)
    );
  } else if (filter.category) {
    nodeTypes = getNodesInCategory(filter.category);
  } else if (filter.folder) {
    nodeTypes = getNodesByFolder(filter.folder);
  } else {
    nodeTypes = Object.keys(GENERATED_NODE_REGISTRY) as NodeType[];
  }

  // Apply hasToggle filter if specified
  if (filter.hasToggle !== undefined) {
    nodeTypes = nodeTypes.filter((nodeType) => {
      const metadata = getNodeMetadata(nodeType);
      return metadata?.hasToggle === filter.hasToggle;
    });
  }

  return nodeTypes.map((nodeType, index) =>
    createStencilFromNodeType(nodeType, prefix, index + 1)
  );
}

// ============================================================================
// REGISTRY-GENERATED AVAILABLE NODES MAPPING
// ============================================================================

/**
 * AVAILABLE NODES MAPPING
 * Auto-generated from modern registry with rich metadata
 */
export const AVAILABLE_NODES = Object.fromEntries(
  Object.entries(GENERATED_NODE_REGISTRY).map(([nodeType, metadata]) => [
    nodeType,
    {
      nodeType: nodeType as NodeType,
      label: metadata.displayName,
      description: metadata.description,
      icon: metadata.icon,
      category: metadata.category,
      folder: metadata.folder,
      hasToggle: metadata.hasToggle,
    },
  ])
);

/**
 * NODES BY CATEGORY MAPPING
 * Organized by category for easy access
 */
export const NODES_BY_CATEGORY = {
  create: getNodesInCategory("create"),
  view: getNodesInCategory("view"),
  trigger: getNodesInCategory("trigger"),
  test: getNodesInCategory("test"),
  cycle: getNodesInCategory("cycle"),
  data: getNodesInCategory("data"),
  media: getNodesInCategory("media"),
  utility: getNodesInCategory("utility"),
  testing: getNodesInCategory("testing"),
};

/**
 * NODES BY FOLDER MAPPING
 * Organized by sidebar folder for easy access
 */
export const NODES_BY_FOLDER = {
  main: getNodesByFolder("main"),
  automation: getNodesByFolder("automation"),
  testing: getNodesByFolder("testing"),
  visualization: getNodesByFolder("visualization"),
};

// ============================================================================
// ENHANCED STENCIL DEFINITIONS - REGISTRY AUTO-GENERATED
// ============================================================================

/**
 * VARIANT A: Core, Logic, Stores, Testing, Time
 * Enhanced with registry-based auto-generation
 */
export const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  // Core: Main folder nodes (production-ready create & view nodes)
  core: createStencilsByFolder("main", "core"),

  // Logic: Trigger nodes for workflow logic
  logic: createStencilsByCategory("trigger", "logic"),

  // Stores: Create nodes for data storage
  stores: createStencilsByFilter(
    { category: "create", folder: "main" },
    "stores"
  ),

  // Testing: Testing folder nodes
  testing: createStencilsByFolder("testing", "testing"),

  // Time: Cycle nodes for time-based operations
  time: createStencilsByCategory("cycle", "time"),
};

/**
 * VARIANT B: Images, Audio, Text, Interface, Transform
 * Media and interface focused organization
 */
export const DEFAULT_STENCILS_B: Record<TabKeyB, NodeStencil[]> = {
  images: [], // Reserved for future image nodes
  audio: [], // Reserved for future audio nodes

  // Text: Text-based create nodes
  text: createStencilsByFilter({ category: "create" }, "text"),

  // Interface: View nodes for user interface
  interface: createStencilsByCategory("view", "interface"),

  transform: [], // Reserved for future transform nodes
};

/**
 * VARIANT C: API, Web, Email, Files, Crypto
 * Integration and external service focused
 */
export const DEFAULT_STENCILS_C: Record<TabKeyC, NodeStencil[]> = {
  api: [], // Reserved for future API nodes
  web: [], // Reserved for future web nodes
  email: [], // Reserved for future email nodes
  files: [], // Reserved for future file nodes
  crypto: [], // Reserved for future crypto nodes
};

/**
 * VARIANT D: Triggers, Flow, Cyclers, Smart, Tools
 * Automation and workflow focused organization
 */
export const DEFAULT_STENCILS_D: Record<TabKeyD, NodeStencil[]> = {
  // Triggers: All trigger nodes from automation folder
  triggers: createStencilsByFilter(
    { category: "trigger", folder: "automation" },
    "triggers"
  ),

  // Flow: View nodes for flow visualization
  flow: createStencilsByFilter(
    { category: "view", folder: "visualization" },
    "flow"
  ),

  // Cyclers: All cycle nodes from automation folder
  cyclers: createStencilsByFilter(
    { category: "cycle", folder: "automation" },
    "cyclers"
  ),

  // Smart: Nodes with toggle functionality
  smart: createStencilsByFilter({ hasToggle: true }, "smart"),

  // Tools: Testing and utility nodes
  tools: createStencilsByFolder("testing", "tools"),
};

/**
 * VARIANT E: Special, Math, Stuff, Filler, Custom
 * Specialized and custom organization
 */
export const DEFAULT_STENCILS_E: Record<TabKeyE, NodeStencil[]> = {
  // Special: Test nodes for special functionality
  special: createStencilsByCategory("test", "special"),

  // Math: Reserved for future math nodes (placeholder with create nodes)
  math: createStencilsByFilter({ category: "create" }, "math"),

  // Stuff: Mixed category nodes
  stuff: createStencilsByFilter({ folder: "main" }, "stuff"),

  filler: [], // Reserved for filler nodes
  custom: [], // Always empty - populated by user customization
};

// ============================================================================
// ENHANCED VARIANT CONFIGURATION
// ============================================================================

export const VARIANT_CONFIG = {
  a: { tabs: TAB_CONFIG_A, defaults: DEFAULT_STENCILS_A } as VariantConfig<"a">,
  b: { tabs: TAB_CONFIG_B, defaults: DEFAULT_STENCILS_B } as VariantConfig<"b">,
  c: { tabs: TAB_CONFIG_C, defaults: DEFAULT_STENCILS_C } as VariantConfig<"c">,
  d: { tabs: TAB_CONFIG_D, defaults: DEFAULT_STENCILS_D } as VariantConfig<"d">,
  e: { tabs: TAB_CONFIG_E, defaults: DEFAULT_STENCILS_E } as VariantConfig<"e">,
} as const;

// ============================================================================
// REGISTRY STATISTICS AND DEBUG INFO
// ============================================================================

/**
 * GET SIDEBAR STATISTICS
 * Returns statistics about sidebar organization
 */
export function getSidebarStatistics() {
  const totalNodes = Object.keys(GENERATED_NODE_REGISTRY).length;
  const nodesByCategory = Object.fromEntries(
    Object.entries(NODES_BY_CATEGORY).map(([category, nodes]) => [
      category,
      nodes.length,
    ])
  );
  const nodesByFolder = Object.fromEntries(
    Object.entries(NODES_BY_FOLDER).map(([folder, nodes]) => [
      folder,
      nodes.length,
    ])
  );

  return {
    totalNodes,
    nodesByCategory,
    nodesByFolder,
    totalStencilsA: Object.values(DEFAULT_STENCILS_A).flat().length,
    totalStencilsB: Object.values(DEFAULT_STENCILS_B).flat().length,
    totalStencilsC: Object.values(DEFAULT_STENCILS_C).flat().length,
    totalStencilsD: Object.values(DEFAULT_STENCILS_D).flat().length,
    totalStencilsE: Object.values(DEFAULT_STENCILS_E).flat().length,
  };
}

/**
 * VALIDATE SIDEBAR CONFIGURATION
 * Ensures all stencils reference valid node types
 */
export function validateSidebarConfiguration(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  statistics: ReturnType<typeof getSidebarStatistics>;
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check all stencils across all variants
  const allVariants = [
    DEFAULT_STENCILS_A,
    DEFAULT_STENCILS_B,
    DEFAULT_STENCILS_C,
    DEFAULT_STENCILS_D,
    DEFAULT_STENCILS_E,
  ];

  allVariants.forEach((variant, variantIndex) => {
    Object.entries(variant).forEach(([tabKey, stencils]) => {
      stencils.forEach((stencil, stencilIndex) => {
        if (!isValidNodeType(stencil.nodeType)) {
          errors.push(
            `Invalid node type '${stencil.nodeType}' in variant ${String.fromCharCode(97 + variantIndex).toUpperCase()}, tab '${tabKey}', stencil ${stencilIndex}`
          );
        }
      });
    });
  });

  // Check for empty tabs
  allVariants.forEach((variant, variantIndex) => {
    Object.entries(variant).forEach(([tabKey, stencils]) => {
      if (stencils.length === 0) {
        warnings.push(
          `Empty tab '${tabKey}' in variant ${String.fromCharCode(97 + variantIndex).toUpperCase()}`
        );
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    statistics: getSidebarStatistics(),
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * GET NODE TYPE FROM STENCIL ID
 * Extracts node type from stencil ID
 */
export function getNodeTypeFromStencilId(stencilId: string): NodeType | null {
  // Format: "prefix-nodetype-index"
  const parts = stencilId.split("-");
  if (parts.length < 2) return null;

  const nodeType = parts.slice(1, -1).join("-"); // Handle node types with dashes
  return isValidNodeType(nodeType) ? (nodeType as NodeType) : null;
}

/**
 * REFRESH STENCILS
 * Regenerates all stencils from current registry state
 */
export function refreshStencils(): typeof VARIANT_CONFIG {
  console.log("🔄 Refreshing sidebar stencils from registry...");

  // This would regenerate all the stencil configurations
  // In a real implementation, this could be used to dynamically update
  // the sidebar when new nodes are added to the registry

  const statistics = getSidebarStatistics();
  console.log("📊 Sidebar Statistics:", statistics);

  return VARIANT_CONFIG;
}

// ============================================================================
// DEVELOPMENT AND DEBUG UTILITIES
// ============================================================================

/**
 * LOG SIDEBAR DEBUG INFO
 * Logs comprehensive sidebar information for development
 */
export function logSidebarDebugInfo(): void {
  if (process.env.NODE_ENV !== "development") return;

  console.log("🔧 SIDEBAR DEBUG INFO");
  console.log("=====================");

  const validation = validateSidebarConfiguration();
  const statistics = getSidebarStatistics();

  console.log("\n📊 Statistics:", statistics);
  console.log("\n✅ Validation:", validation.isValid ? "PASSED" : "FAILED");

  if (validation.errors.length > 0) {
    console.log("\n❌ Errors:", validation.errors);
  }

  if (validation.warnings.length > 0) {
    console.log("\n⚠️ Warnings:", validation.warnings);
  }

  console.log("\n🎯 Registry Integration: ENABLED");
  console.log("📁 Available Folders:", Object.keys(NODES_BY_FOLDER));
  console.log("🏷️ Available Categories:", Object.keys(NODES_BY_CATEGORY));
}

// Auto-run debug info in development
if (process.env.NODE_ENV === "development") {
  logSidebarDebugInfo();
}
