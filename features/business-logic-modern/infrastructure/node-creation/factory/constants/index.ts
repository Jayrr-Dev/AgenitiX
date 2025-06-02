/**
 * FACTORY CONSTANTS INDEX - Configuration constants for node factory system
 *
 * • Defines all configuration constants and default values for factory
 * • Provides timing constants for performance optimization and caching
 * • Includes node type patterns and classification constants
 * • Supports error injection and testing configuration values
 * • Centralizes all factory-related constants for easy maintenance
 *
 * Keywords: factory-constants, configuration, timing, performance, node-patterns, error-injection
 */

// ============================================================================
// FACTORY NODE CONSTANTS
// ============================================================================

import type { NodeSize } from "../types";

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**
 * CACHE CONFIGURATION
 * Settings for performance optimization caching
 */
export const CACHE_TTL = 100; // Cache for 100ms to batch rapid updates

// ============================================================================
// TIMING CONFIGURATION
// ============================================================================

/**
 * DEBOUNCE TIMING
 * Optimized timing for smooth vs instant updates
 */
export const SMOOTH_ACTIVATION_DELAY = 8; // ms for smooth activation
export const INSTANT_PRIORITY_DELAY = 0; // ms for instant updates

/**
 * PROCESSING THROTTLE
 * Prevent rapid successive processing calls
 */
export const PROCESSING_THROTTLE_MS = 5; // ms minimum between processing calls

// ============================================================================
// DEFAULT NODE SIZES
// ============================================================================

/**
 * DEFAULT NODE SIZES
 * Standard sizing configurations for different node types
 */
export const DEFAULT_TEXT_NODE_SIZE: NodeSize = {
  collapsed: {
    width: "w-[120px]",
    height: "h-[60px]",
  },
  expanded: {
    width: "w-[180px]",
  },
};

export const DEFAULT_LOGIC_NODE_SIZE: NodeSize = {
  collapsed: {
    width: "w-[60px]",
    height: "h-[60px]",
  },
  expanded: {
    width: "w-[120px]",
  },
};

export const DEFAULT_TRIGGER_NODE_SIZE: NodeSize = {
  collapsed: {
    width: "w-[60px]",
    height: "h-[60px]",
  },
  expanded: {
    width: "w-[120px]",
  },
};

// ============================================================================
// ERROR INJECTION SUPPORT
// ============================================================================

/**
 * NODES SUPPORTING ERROR INJECTION
 * Node types that support Vibe Mode error injection
 */
export const ERROR_INJECTION_SUPPORTED_NODES = [
  "createText",
  "createTextRefactor",
  "createTextEnhanced",
  "testJson",
  "testErrorRefactored",
  "viewOutput",
  "viewOutputRefactor",
  "viewOutputEnhanced",
] as const;

// ============================================================================
// NODE CLASSIFICATION
// ============================================================================

/**
 * TRANSFORMATION NODE PATTERNS
 * Patterns to identify transformation nodes
 */
export const TRANSFORMATION_NODE_PATTERNS = [
  "turnToUppercase",
  "transform",
  "turn",
  "convert",
] as const;

/**
 * TRIGGER NODE PATTERNS
 * Patterns to identify trigger nodes
 */
export const TRIGGER_NODE_PATTERNS = ["trigger", "pulse", "toggle"] as const;

/**
 * HEAD NODE PATTERNS
 * Patterns to identify head/source nodes
 */
export const HEAD_NODE_PATTERNS = [
  "trigger",
  "cycle",
  "create",
  "input",
  "manual",
] as const;

/**
 * NODE FACTORY CONSTANTS - Configuration constants for node creation
 *
 * • Defines node type configurations and default settings
 * • Provides consistent node creation parameters
 * • Supports toggle states and sizing specifications
 * • Implements enterprise-grade node factory patterns
 * • Ensures standardized node behavior across system
 *
 * Keywords: constants, node-config, factory-patterns, toggle-states, sizing
 */

import type { NodeConfig, NodeType } from "../types";

// ============================================================================
// FACTORY CONSTANTS
// ============================================================================

export const NODE_ID_PREFIX = "node_";

// ============================================================================
// NODE SIZING CONSTANTS
// ============================================================================

export const NODE_SIZES = {
  ICON: {
    DEFAULT: { width: 60, height: 60 },
    TEXT: { width: 120, height: 60 },
  },
  EXPANDED: {
    DEFAULT: { width: 120, height: 120 },
  },
} as const;

// ============================================================================
// REGISTRY AUTO-SYNC - Single Source of Truth
// ============================================================================

/**
 * AUTO-SYNC FACTORY CONFIG WITH REGISTRY
 * The registry is now the single source of truth for all factory data
 */
function initializeFactoryConfig() {
  try {
    // Import registry functions dynamically to avoid circular dependency
    const {
      generateFactoryConstants,
      generateFactoryNodeConfig,
      generateFactoryNodeSizes,
    } = require("../../node-registry/nodeRegistry");

    if (typeof generateFactoryConstants === "function") {
      const generated = generateFactoryConstants();

      // Sync generated config into exported constants
      Object.assign(NODE_TYPE_CONFIG, generated.NODE_TYPE_CONFIG);
      Object.assign(NODE_SIZES, generated.NODE_SIZES);
      Object.assign(VALID_NODE_TYPES, generated.VALID_NODE_TYPES);

      console.log(
        "✅ [Factory] Auto-synced with registry:",
        Object.keys(generated.NODE_TYPE_CONFIG).length,
        "factory node types"
      );

      return true;
    } else {
      console.warn("⚠️ [Factory] Registry auto-generation not available");
      return false;
    }
  } catch (error) {
    console.error("❌ [Factory] Failed to sync with registry:", error);
    return false;
  }
}

// ============================================================================
// NODE TYPE CONFIGURATION - Auto-Generated from Registry
// ============================================================================

// Initialize as empty object - will be populated from registry
export const NODE_TYPE_CONFIG: Record<NodeType, NodeConfig> = {} as any;

// Auto-sync with registry on module load
initializeFactoryConfig();

// SYNC: Factory configuration is now auto-generated from MODERN_NODE_REGISTRY
// All factory data comes from the registry - no manual duplication needed!
// Icons, sizes, labels, and configs are all centrally managed.

// ============================================================================
// TOGGLE BUTTON CONSTANTS
// ============================================================================

export const TOGGLE_SYMBOLS = {
  EXPANDED: "⦿",
  COLLAPSED: "⦾",
} as const;

// ============================================================================
// VALIDATION CONSTANTS - Auto-Generated from Registry
// ============================================================================

// Initialize as empty array - will be populated from registry
export let VALID_NODE_TYPES: NodeType[] = [];
