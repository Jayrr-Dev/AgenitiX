/**
 * CATEGORY REGISTRY - Centralized category management and metadata system
 *
 * • Provides comprehensive category definitions with rich metadata
 * • Centralizes category-based configurations, themes, and behaviors
 * • Supports dynamic category management and validation
 * • Enables category-specific plugins, permissions, and extensions
 * • Offers category lifecycle management and relationship mapping
 * • Integrates with node registry, theming, sidebar, and factory systems
 *
 * Keywords: category-registry, metadata, centralized, dynamic, extensible, validation
 */

import type { NodeCategory } from "../factory/types";

// ============================================================================
// ENHANCED CATEGORY METADATA INTERFACE
// ============================================================================

export interface CategoryMetadata {
  /** Unique category identifier */
  id: NodeCategory;

  /** Human-readable display name */
  displayName: string;

  /** Detailed category description */
  description: string;

  /** Category icon (emoji or icon class) */
  icon: string;

  /** Category priority for ordering (lower = higher priority) */
  priority: number;

  /** Whether category is enabled in current environment */
  enabled: boolean;

  /** Category color theme configuration */
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    background: {
      light: string;
      dark: string;
    };
    border: {
      light: string;
      dark: string;
    };
  };

  /** Sidebar configuration */
  sidebar: {
    /** Default folder for this category */
    defaultFolder: string;
    /** Show in sidebar by default */
    showByDefault: boolean;
    /** Custom sidebar label override */
    customLabel?: string;
  };

  /** Category-specific rules and constraints */
  rules: {
    /** Maximum nodes allowed in this category */
    maxNodes?: number;
    /** Minimum nodes required for workflows */
    minNodes?: number;
    /** Categories that this category can connect to */
    allowedConnections?: NodeCategory[];
    /** Categories that are incompatible with this one */
    incompatibleWith?: NodeCategory[];
    /** Whether nodes in this category can be duplicated */
    allowDuplication: boolean;
    /** Whether nodes in this category can be deleted */
    allowDeletion: boolean;
  };

  /** Performance and behavior settings */
  behavior: {
    /** Default execution timeout for nodes in this category */
    defaultTimeout?: number;
    /** Whether nodes should auto-save state */
    autoSave: boolean;
    /** Caching strategy for this category */
    cacheStrategy: "none" | "memory" | "persistent";
    /** Debounce time for updates (ms) */
    debounceMs: number;
  };

  /** Development and debugging settings */
  development: {
    /** Whether to show debug information */
    showDebugInfo: boolean;
    /** Log level for this category */
    logLevel: "error" | "warn" | "info" | "debug";
    /** Performance monitoring enabled */
    enablePerfMonitoring: boolean;
  };

  /** Extensibility hooks */
  hooks: {
    /** Called when category is activated */
    onActivate?: () => void;
    /** Called when category is deactivated */
    onDeactivate?: () => void;
    /** Called when validating category usage */
    onValidate?: (nodeCount: number) => boolean;
    /** Called when category theme is applied */
    onThemeApplied?: (theme: any) => void;
  };

  /** Version and lifecycle information */
  lifecycle: {
    /** Category version */
    version: string;
    /** Creation timestamp */
    createdAt: string;
    /** Last updated timestamp */
    updatedAt: string;
    /** Deprecation status */
    deprecated?: {
      since: string;
      reason: string;
      replacedBy?: NodeCategory;
    };
    /** Beta/experimental status */
    experimental?: boolean;
  };
}

// ============================================================================
// CATEGORY RELATIONSHIPS AND HIERARCHIES
// ============================================================================

export interface CategoryRelationship {
  /** Source category */
  from: NodeCategory;
  /** Target category */
  to: NodeCategory;
  /** Relationship type */
  type:
    | "parent"
    | "child"
    | "sibling"
    | "dependency"
    | "conflict"
    | "enhancement";
  /** Relationship strength (0-1) */
  strength: number;
  /** Relationship description */
  description: string;
  /** Whether relationship is bidirectional */
  bidirectional: boolean;
}

export interface CategoryHierarchy {
  /** Root categories (top-level) */
  roots: NodeCategory[];
  /** Category parent-child relationships */
  hierarchy: Record<
    NodeCategory,
    {
      parent?: NodeCategory;
      children: NodeCategory[];
      level: number;
      path: NodeCategory[];
    }
  >;
}

// ============================================================================
// COMPREHENSIVE CATEGORY REGISTRY
// ============================================================================

export const CATEGORY_REGISTRY: Record<NodeCategory, CategoryMetadata> = {
  // CREATE CATEGORY - Node creation and generation
  create: {
    id: "create",
    displayName: "Create & Generate",
    description: "Nodes that create, generate, or produce new content and data",
    icon: "🏭",
    priority: 1,
    enabled: true,

    theme: {
      primary: "blue",
      secondary: "sky",
      accent: "cyan",
      background: { light: "bg-blue-50", dark: "bg-blue-900" },
      border: { light: "border-blue-300", dark: "border-blue-800" },
    },

    sidebar: {
      defaultFolder: "main",
      showByDefault: true,
      customLabel: "Create",
    },

    rules: {
      maxNodes: 100,
      allowedConnections: ["view", "trigger", "test"],
      allowDuplication: true,
      allowDeletion: true,
    },

    behavior: {
      defaultTimeout: 5000,
      autoSave: true,
      cacheStrategy: "memory",
      debounceMs: 300,
    },

    development: {
      showDebugInfo: false,
      logLevel: "info",
      enablePerfMonitoring: true,
    },

    hooks: {
      onActivate: () => console.log("🏭 Create category activated"),
      onThemeApplied: (theme) => console.log("🎨 Applied create theme:", theme),
    },

    lifecycle: {
      version: "1.0.0",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
    },
  },

  // VIEW CATEGORY - Display and visualization
  view: {
    id: "view",
    displayName: "View & Display",
    description: "Nodes that display, visualize, or present data and results",
    icon: "👁️",
    priority: 2,
    enabled: true,

    theme: {
      primary: "gray",
      secondary: "slate",
      accent: "zinc",
      background: { light: "bg-gray-50", dark: "bg-gray-900" },
      border: { light: "border-gray-300", dark: "border-gray-800" },
    },

    sidebar: {
      defaultFolder: "visualization",
      showByDefault: true,
      customLabel: "View",
    },

    rules: {
      allowedConnections: ["create", "trigger", "test", "cycle"],
      incompatibleWith: [],
      allowDuplication: true,
      allowDeletion: true,
    },

    behavior: {
      defaultTimeout: 3000,
      autoSave: false,
      cacheStrategy: "none",
      debounceMs: 100,
    },

    development: {
      showDebugInfo: false,
      logLevel: "warn",
      enablePerfMonitoring: false,
    },

    hooks: {
      onActivate: () => console.log("👁️ View category activated"),
    },

    lifecycle: {
      version: "1.0.0",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
    },
  },

  // TRIGGER CATEGORY - Automation and triggers
  trigger: {
    id: "trigger",
    displayName: "Triggers & Automation",
    description:
      "Nodes that trigger actions, automate processes, or respond to events",
    icon: "🎯",
    priority: 3,
    enabled: true,

    theme: {
      primary: "purple",
      secondary: "violet",
      accent: "fuchsia",
      background: { light: "bg-purple-50", dark: "bg-purple-900" },
      border: { light: "border-purple-300", dark: "border-purple-800" },
    },

    sidebar: {
      defaultFolder: "automation",
      showByDefault: true,
      customLabel: "Triggers",
    },

    rules: {
      maxNodes: 50,
      allowedConnections: ["create", "view", "cycle"],
      allowDuplication: false, // Triggers should be unique
      allowDeletion: true,
    },

    behavior: {
      defaultTimeout: 10000,
      autoSave: true,
      cacheStrategy: "persistent",
      debounceMs: 500,
    },

    development: {
      showDebugInfo: true,
      logLevel: "debug",
      enablePerfMonitoring: true,
    },

    hooks: {
      onActivate: () => console.log("🎯 Trigger category activated"),
      onValidate: (nodeCount) => nodeCount <= 50,
    },

    lifecycle: {
      version: "1.1.0",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-20",
    },
  },

  // TEST CATEGORY - Testing and debugging
  test: {
    id: "test",
    displayName: "Test & Debug",
    description:
      "Nodes for testing workflows, debugging issues, and development support",
    icon: "⚠️",
    priority: 4,
    enabled: true,

    theme: {
      primary: "yellow",
      secondary: "amber",
      accent: "orange",
      background: { light: "bg-yellow-50", dark: "bg-yellow-900" },
      border: { light: "border-yellow-300", dark: "border-yellow-800" },
    },

    sidebar: {
      defaultFolder: "testing",
      showByDefault: true,
      customLabel: "Test",
    },

    rules: {
      allowedConnections: ["create", "view", "trigger", "cycle"],
      allowDuplication: true,
      allowDeletion: true,
    },

    behavior: {
      defaultTimeout: 15000,
      autoSave: false,
      cacheStrategy: "none",
      debounceMs: 0, // Immediate for testing
    },

    development: {
      showDebugInfo: true,
      logLevel: "debug",
      enablePerfMonitoring: true,
    },

    hooks: {
      onActivate: () => console.log("⚠️ Test category activated"),
    },

    lifecycle: {
      version: "1.0.0",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
      experimental: true,
    },
  },

  // CYCLE CATEGORY - Loops and iterations
  cycle: {
    id: "cycle",
    displayName: "Cycles & Loops",
    description:
      "Nodes that handle repetitive operations, loops, and cyclical processes",
    icon: "🔄",
    priority: 5,
    enabled: true,

    theme: {
      primary: "green",
      secondary: "emerald",
      accent: "teal",
      background: { light: "bg-green-50", dark: "bg-green-900" },
      border: { light: "border-green-300", dark: "border-green-800" },
    },

    sidebar: {
      defaultFolder: "automation",
      showByDefault: true,
      customLabel: "Cycles",
    },

    rules: {
      maxNodes: 25, // Cycles can be resource intensive
      allowedConnections: ["create", "view", "trigger"],
      incompatibleWith: ["test"], // Avoid infinite test loops
      allowDuplication: false,
      allowDeletion: true,
    },

    behavior: {
      defaultTimeout: 30000, // Longer timeout for cycles
      autoSave: true,
      cacheStrategy: "persistent",
      debounceMs: 1000,
    },

    development: {
      showDebugInfo: true,
      logLevel: "info",
      enablePerfMonitoring: true,
    },

    hooks: {
      onActivate: () => console.log("🔄 Cycle category activated"),
      onValidate: (nodeCount) => nodeCount <= 25,
    },

    lifecycle: {
      version: "1.0.0",
      createdAt: "2024-01-01",
      updatedAt: "2024-01-15",
    },
  },
};

// ============================================================================
// CATEGORY RELATIONSHIPS
// ============================================================================

export const CATEGORY_RELATIONSHIPS: CategoryRelationship[] = [
  // CREATE -> VIEW (common flow)
  {
    from: "create",
    to: "view",
    type: "enhancement",
    strength: 0.9,
    description: "Create nodes commonly feed into view nodes",
    bidirectional: false,
  },

  // TRIGGER -> CREATE (automation flow)
  {
    from: "trigger",
    to: "create",
    type: "dependency",
    strength: 0.8,
    description: "Triggers often initiate creation processes",
    bidirectional: false,
  },

  // TEST <-> ALL (testing relationship)
  {
    from: "test",
    to: "create",
    type: "enhancement",
    strength: 0.7,
    description: "Test nodes can validate create nodes",
    bidirectional: true,
  },

  // CYCLE conflicts with TEST (avoid infinite loops)
  {
    from: "cycle",
    to: "test",
    type: "conflict",
    strength: 0.6,
    description: "Cycles should not include test nodes to avoid infinite loops",
    bidirectional: true,
  },
];

// ============================================================================
// CATEGORY HIERARCHY
// ============================================================================

export const CATEGORY_HIERARCHY: CategoryHierarchy = {
  roots: ["create", "trigger"],
  hierarchy: {
    create: {
      children: ["view"],
      level: 0,
      path: ["create"],
    },
    view: {
      parent: "create",
      children: [],
      level: 1,
      path: ["create", "view"],
    },
    trigger: {
      children: ["cycle"],
      level: 0,
      path: ["trigger"],
    },
    cycle: {
      parent: "trigger",
      children: [],
      level: 1,
      path: ["trigger", "cycle"],
    },
    test: {
      children: [],
      level: 0,
      path: ["test"],
    },
  },
};

// ============================================================================
// CATEGORY REGISTRY UTILITIES
// ============================================================================

/**
 * GET CATEGORY METADATA
 * Returns comprehensive metadata for a category
 */
export function getCategoryMetadata(
  category: NodeCategory
): CategoryMetadata | null {
  return CATEGORY_REGISTRY[category] || null;
}

/**
 * GET ALL ENABLED CATEGORIES
 * Returns list of currently enabled categories
 */
export function getEnabledCategories(): NodeCategory[] {
  return Object.entries(CATEGORY_REGISTRY)
    .filter(([_, metadata]) => metadata.enabled)
    .map(([category]) => category as NodeCategory);
}

/**
 * GET CATEGORIES BY PRIORITY
 * Returns categories sorted by priority (lower number = higher priority)
 */
export function getCategoriesByPriority(): NodeCategory[] {
  return Object.entries(CATEGORY_REGISTRY)
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([category]) => category as NodeCategory);
}

/**
 * VALIDATE CATEGORY CONNECTION
 * Checks if two categories can be connected
 */
export function validateCategoryConnection(
  from: NodeCategory,
  to: NodeCategory
): { allowed: boolean; reason?: string } {
  const fromMeta = getCategoryMetadata(from);
  const toMeta = getCategoryMetadata(to);

  if (!fromMeta || !toMeta) {
    return { allowed: false, reason: "Invalid category" };
  }

  // Check if connection is explicitly allowed
  if (
    fromMeta.rules.allowedConnections &&
    !fromMeta.rules.allowedConnections.includes(to)
  ) {
    return {
      allowed: false,
      reason: `${from} category cannot connect to ${to} category`,
    };
  }

  // Check for incompatibilities
  if (fromMeta.rules.incompatibleWith?.includes(to)) {
    return {
      allowed: false,
      reason: `${from} and ${to} categories are incompatible`,
    };
  }

  // Check relationships for conflicts
  const conflictRelation = CATEGORY_RELATIONSHIPS.find(
    (rel) => rel.from === from && rel.to === to && rel.type === "conflict"
  );

  if (conflictRelation) {
    return {
      allowed: false,
      reason: conflictRelation.description,
    };
  }

  return { allowed: true };
}

/**
 * GET CATEGORY THEME
 * Returns theme configuration for a category
 */
export function getCategoryTheme(category: NodeCategory) {
  const metadata = getCategoryMetadata(category);
  return metadata?.theme || null;
}

/**
 * GET CATEGORY BEHAVIOR CONFIG
 * Returns behavior configuration for a category
 */
export function getCategoryBehavior(category: NodeCategory) {
  const metadata = getCategoryMetadata(category);
  return metadata?.behavior || null;
}

/**
 * VALIDATE CATEGORY RULES
 * Validates if category usage follows defined rules
 */
export function validateCategoryRules(
  category: NodeCategory,
  currentNodeCount: number
): { valid: boolean; violations: string[] } {
  const metadata = getCategoryMetadata(category);
  if (!metadata) {
    return { valid: false, violations: ["Invalid category"] };
  }

  const violations: string[] = [];

  // Check max nodes
  if (metadata.rules.maxNodes && currentNodeCount > metadata.rules.maxNodes) {
    violations.push(
      `Exceeded maximum nodes (${metadata.rules.maxNodes}) for ${category} category`
    );
  }

  // Check min nodes
  if (metadata.rules.minNodes && currentNodeCount < metadata.rules.minNodes) {
    violations.push(
      `Below minimum nodes (${metadata.rules.minNodes}) for ${category} category`
    );
  }

  // Custom validation hook
  if (
    metadata.hooks.onValidate &&
    !metadata.hooks.onValidate(currentNodeCount)
  ) {
    violations.push(`Custom validation failed for ${category} category`);
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}

/**
 * GET CATEGORY STATISTICS
 * Returns comprehensive statistics about category registry
 */
export function getCategoryStatistics() {
  const categories = Object.values(CATEGORY_REGISTRY);

  return {
    total: categories.length,
    enabled: categories.filter((cat) => cat.enabled).length,
    experimental: categories.filter((cat) => cat.lifecycle.experimental).length,
    deprecated: categories.filter((cat) => cat.lifecycle.deprecated).length,
    withHooks: categories.filter((cat) => Object.keys(cat.hooks).length > 0)
      .length,
    byPriority: getCategoriesByPriority(),
    relationships: CATEGORY_RELATIONSHIPS.length,
    hierarchyLevels:
      Math.max(
        ...Object.values(CATEGORY_HIERARCHY.hierarchy).map((h) => h.level)
      ) + 1,
  };
}

/**
 * APPLY CATEGORY HOOKS
 * Triggers category-specific hooks
 */
export function applyCategoryHooks(
  category: NodeCategory,
  hookType: keyof CategoryMetadata["hooks"],
  ...args: unknown[]
) {
  const metadata = getCategoryMetadata(category);
  const hook = metadata?.hooks[hookType];

  if (hook && typeof hook === "function") {
    try {
      return (hook as (...params: unknown[]) => unknown)(...args);
    } catch (error) {
      console.error(`Error executing ${hookType} hook for ${category}:`, error);
    }
  }
}

/**
 * UPDATE CATEGORY METADATA
 * Updates metadata for a category (useful for runtime configuration)
 */
export function updateCategoryMetadata(
  category: NodeCategory,
  updates: Partial<CategoryMetadata>
): boolean {
  const current = CATEGORY_REGISTRY[category];
  if (!current) return false;

  // Update timestamp
  updates.lifecycle = {
    ...current.lifecycle,
    ...updates.lifecycle,
    updatedAt: new Date().toISOString(),
  };

  // Apply updates
  Object.assign(CATEGORY_REGISTRY[category], updates);

  console.log(`📝 Updated metadata for ${category} category`);
  return true;
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * SYNC WITH THEMING STORE
 * Syncs category themes with the theming store
 */
export function syncWithThemingStore() {
  console.log("🎨 Syncing category registry with theming store...");

  Object.entries(CATEGORY_REGISTRY).forEach(([category, metadata]) => {
    if (metadata.enabled) {
      applyCategoryHooks(
        category as NodeCategory,
        "onThemeApplied",
        metadata.theme
      );
    }
  });

  console.log("✅ Category themes synchronized");
}

/**
 * GENERATE SIDEBAR CONFIG
 * Generates sidebar configuration from category registry
 */
export function generateSidebarConfig() {
  const config = Object.entries(CATEGORY_REGISTRY)
    .filter(
      ([_, metadata]) => metadata.enabled && metadata.sidebar.showByDefault
    )
    .sort(([, a], [, b]) => a.priority - b.priority)
    .map(([category, metadata]) => ({
      category: category as NodeCategory,
      folder: metadata.sidebar.defaultFolder,
      label: metadata.sidebar.customLabel || metadata.displayName,
      icon: metadata.icon,
      priority: metadata.priority,
    }));

  console.log("📊 Generated sidebar config from category registry");
  return config;
}

/**
 * VALIDATE WORKFLOW CATEGORIES
 * Validates category usage in a complete workflow
 */
export function validateWorkflowCategories(
  categoryCounts: Record<NodeCategory, number>
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  Object.entries(categoryCounts).forEach(([category, count]) => {
    const validation = validateCategoryRules(category as NodeCategory, count);
    if (!validation.valid) {
      issues.push(...validation.violations);
    }
  });

  // Check for required minimum categories
  const enabledCategories = getEnabledCategories();
  enabledCategories.forEach((category) => {
    const metadata = getCategoryMetadata(category);
    if (metadata?.rules.minNodes && !categoryCounts[category]) {
      issues.push(
        `Missing required ${category} nodes (minimum: ${metadata.rules.minNodes})`
      );
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}
