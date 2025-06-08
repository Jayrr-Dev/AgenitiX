/**
 * FACTORY CONSTANTS INDEX
 * 🧱 BUILD-TIME VALUES:
 * - CACHE_TTL
 * - SMOOTH_ACTIVATION_DELAY
 * - INSTANT_PRIORITY_DELAY
 * - PROCESSING_THROTTLE_MS
 * - DEFAULT_TEXT_NODE_SIZE
 * - DEFAULT_LOGIC_NODE_SIZE
 * - DEFAULT_TRIGGER_NODE_SIZE
 * - ERROR_INJECTION_SUPPORTED_NODES
 * - TRANSFORMATION_NODE_PATTERNS
 * - TRIGGER_NODE_PATTERNS
 * - HEAD_NODE_PATTERNS
 * - TOGGLE_SYMBOLS
 * - NODE_ID_PREFIX
 *
 * ⚙️ RUNTIME VALUES (Lazy-loaded from registry):
 * - NODE_TYPE_CONFIG - Record<NodeType, NodeConfig> - Node configuration for all node types
 * - VALID_NODE_TYPES - string[] - Valid node types
 * - initializeFactoryConfig() - boolean - Initialize the factory config
 * - getNodeTypeConfig() - Record<NodeType, NodeConfig> - Get the node type config
 * - getValidNodeTypes() - string[] - Get the valid node types
 * Configuration constants for the Node Factory System
 *
 * • Build-time: Size patterns, node type patterns, static constants
 * • Runtime: Lazy-loaded registry config, dynamic node type resolution
 *
 * Keywords: factory-constants, node-config, timing, error-injection, classification
 */

import { Position } from "@xyflow/react";
import type { NodeConfig, NodeType } from "../types";
import { NodeSize } from "../types";
import { STANDARD_SIZE_PATTERNS } from "./sizes";

// =============================================================================
// 🔧 BUILD-TIME CONFIGURATION CONSTANTS
// =============================================================================

// 🧠 General Cache/Timing Constants
export const CACHE_TTL = 100; // ms - throttle update batches
export const SMOOTH_ACTIVATION_DELAY = 8; // ms - visual debounce
export const INSTANT_PRIORITY_DELAY = 0; // ms - instant changes
export const PROCESSING_THROTTLE_MS = 1; // ms - prevent processing spam

// 🧱 Default Node Sizes (static patterns)
export const DEFAULT_TEXT_NODE_SIZE: NodeSize =
  STANDARD_SIZE_PATTERNS.STANDARD_TEXT;
export const DEFAULT_LOGIC_NODE_SIZE: NodeSize =
  STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;
export const DEFAULT_TRIGGER_NODE_SIZE: NodeSize =
  STANDARD_SIZE_PATTERNS.SMALL_TRIGGER;

// 🚨 Nodes that support error injection
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

// 🧠 Node classification patterns
export const TRANSFORMATION_NODE_PATTERNS = [
  "turnToUppercase",
  "transform",
  "turn",
  "convert",
] as const;

export const TRIGGER_NODE_PATTERNS = ["trigger", "pulse", "toggle"] as const;

export const HEAD_NODE_PATTERNS = [
  "trigger",
  "cycle",
  "create",
  "input",
  "manual",
] as const;

// 🎛 Toggle symbols for UI state
export const TOGGLE_SYMBOLS = {
  EXPANDED: "⦿",
  COLLAPSED: "⦾",
} as const;

// Used to prefix all generated node IDs
export const NODE_ID_PREFIX = "node_";

// =============================================================================
// ⚙️ RUNTIME REGISTRY AUTO-SYNC SYSTEM
// =============================================================================

/**
 * Automatically syncs factory config with the generated JSON registry
 * - Lazy loaded to prevent circular import issues
 * - Populates NODE_TYPE_CONFIG and VALID_NODE_TYPES at runtime
 */

let isFactoryConfigInitialized = false;

// Internal store for config and valid types
export const NODE_TYPE_CONFIG: Record<NodeType, NodeConfig> = {} as any;
export let VALID_NODE_TYPES: string[] = [];

/**
 * Initialize the registry-to-factory config mapping
 * Only runs once during runtime access
 */
function initializeFactoryConfig(): boolean {
  if (isFactoryConfigInitialized) return true;

  try {
    // Runtime import to avoid circular imports
    const {
      GENERATED_NODE_REGISTRY,
    } = require("../../json-node-registry/generated/nodeRegistry");

    if (GENERATED_NODE_REGISTRY) {
      const factoryConfig: Record<string, NodeConfig> = {};
      const validNodeTypes: string[] = [];

      Object.entries(GENERATED_NODE_REGISTRY).forEach(
        ([nodeType, config]: [string, any]) => {
          factoryConfig[nodeType] = {
            label: config.displayName,
            icon: config.icon,
            defaultData: config.defaultData || {},
            width: config.iconWidth || 60,
            height: config.iconHeight || 60,
            hasTargetPosition: true,
            targetPosition: Position.Top,
          };
          validNodeTypes.push(nodeType);
        }
      );

      Object.assign(NODE_TYPE_CONFIG, factoryConfig);
      VALID_NODE_TYPES.length = 0;
      VALID_NODE_TYPES.push(...validNodeTypes);

      console.log(
        "✅ [Factory] Auto-synced with JSON registry:",
        validNodeTypes.length,
        "types"
      );

      isFactoryConfigInitialized = true;
      return true;
    }

    console.warn("⚠️ [Factory] JSON registry not available");
    return false;
  } catch (error) {
    console.error("❌ [Factory] Failed to sync with registry:", error);
    return false;
  }
}

/**
 * Lazy getter for all node configurations
 */
function getNodeTypeConfig(): Record<NodeType, NodeConfig> {
  if (!isFactoryConfigInitialized) initializeFactoryConfig();
  return NODE_TYPE_CONFIG;
}

/**
 * Lazy getter for valid node type keys
 */
function getValidNodeTypes(): string[] {
  if (!isFactoryConfigInitialized) initializeFactoryConfig();
  return VALID_NODE_TYPES;
}

// Export runtime accessors
export { getNodeTypeConfig, getValidNodeTypes, initializeFactoryConfig };
