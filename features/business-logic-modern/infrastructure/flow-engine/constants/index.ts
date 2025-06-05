/**
 * FLOW ENGINE CONSTANTS - Configuration and type definitions
 *
 * • Central configuration for node types, data types, and UI constants
 * • Type mapping system for handle colors and validation
 * • Node type configurations with default data and display settings
 * • Registry integration for dynamic node type management
 * • Keyboard shortcuts and UI behavior constants
 *
 * Keywords: constants, node-types, type-mapping, configuration, registry, keyboard-shortcuts
 */

import { Position } from "@xyflow/react";
import type {
  AgenEdge,
  AgenNode,
  NodeTypeConfigMap,
  TypeMap,
} from "../types/nodeData";

// ============================================================================
// TYPE LEGEND & COLORS (sync with TypesafeHandle)
// ============================================================================

export const TYPE_MAP: TypeMap = {
  s: { label: "s", color: "#3b82f6" }, // string - blue
  n: { label: "n", color: "#f59e42" }, // number - orange
  b: { label: "b", color: "#10b981" }, // boolean - green
  j: { label: "j", color: "#6366f1" }, // JSON - indigo
  a: { label: "a", color: "#f472b6" }, // array - pink
  N: { label: "N", color: "#a21caf" }, // Bigint - purple
  f: { label: "f", color: "#fbbf24" }, // float - yellow
  x: { label: "x", color: "#6b7280" }, // any - gray
  u: { label: "u", color: "#d1d5db" }, // undefined - light gray
  S: { label: "S", color: "#eab308" }, // symbol - gold
  "∅": { label: "∅", color: "#ef4444" }, // null - red
};

// ============================================================================
// INITIAL DEMO GRAPH
// ============================================================================

export const INITIAL_NODES: AgenNode[] = [
  {
    id: "1",
    type: "createText",
    position: { x: -100, y: -50 },
    deletable: true,
    data: {
      text: "hello",
      heldText: "hello",
      isActive: true,
    },
  },
  {
    id: "2",
    type: "createText",
    position: { x: 0, y: 100 },
    deletable: true,
    data: {
      text: "world",
      heldText: "world",
      isActive: true,
    },
  },
  {
    id: "3",
    type: "viewOutput",
    position: { x: 300, y: -25 },
    targetPosition: Position.Top,
    deletable: true,
    data: {
      label: "Result",
      displayedValues: [],
      isActive: true,
    },
  },
];

export const INITIAL_EDGES: AgenEdge[] = [
  {
    id: "e1-3",
    source: "1",
    target: "3",
    sourceHandle: "output",
    targetHandle: "input",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    sourceHandle: "output",
    targetHandle: "input",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
];

// ============================================================================
// REGISTRY INTEGRATION - Single Source of Truth (LAZY LOADING)
// ============================================================================

let isNodeTypeConfigInitialized = false;

/**
 * AUTO-SYNC NODE TYPE CONFIG WITH REGISTRY (LAZY LOADING)
 * Now the registry is the single source of truth for all node data
 * Uses lazy loading to prevent circular dependency issues
 */
function initializeNodeTypeConfig() {
  if (isNodeTypeConfigInitialized) {
    return true; // Already initialized
  }

  try {
    // Import registry functions dynamically to avoid circular dependency
    const {
      generateNodeTypeConfig,
    } = require("../../node-creation/node-registry/nodeRegistry");

    if (typeof generateNodeTypeConfig === "function") {
      const generatedConfig = generateNodeTypeConfig();

      // Merge generated config into exported constant
      Object.assign(NODE_TYPE_CONFIG, generatedConfig);

      console.log(
        "✅ [Constants] NODE_TYPE_CONFIG auto-synced with registry:",
        Object.keys(generatedConfig).length,
        "node types"
      );

      isNodeTypeConfigInitialized = true;
      return true;
    } else {
      console.warn("⚠️ [Constants] generateNodeTypeConfig not available");
      return false;
    }
  } catch (error) {
    console.error("❌ [Constants] Failed to sync with registry:", error);
    return false;
  }
}

/**
 * LAZY GETTER FOR NODE TYPE CONFIG
 * Ensures registry is loaded before accessing config
 */
function getNodeTypeConfig(): NodeTypeConfigMap {
  if (!isNodeTypeConfigInitialized) {
    initializeNodeTypeConfig();
  }
  return NODE_TYPE_CONFIG;
}

/**
 * SYNC NODE TYPE CONFIG WITH REGISTRY
 * Ensures NODE_TYPE_CONFIG is up-to-date with registry data
 * @deprecated Use initializeNodeTypeConfig instead
 */
export function syncNodeTypeConfigWithRegistry() {
  return initializeNodeTypeConfig();
}

// ============================================================================
// NODE TYPE CONFIGURATIONS - Auto-Generated from Registry (LAZY LOADING)
// ============================================================================

// Initialize as empty object - will be populated from registry when needed
export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {} as NodeTypeConfigMap;

// Export lazy getters to prevent circular dependency
export { getNodeTypeConfig, initializeNodeTypeConfig };

// SYNC: Node type configuration is now auto-generated from MODERN_NODE_REGISTRY
// Available node types: createText, viewOutput, triggerOnToggle, testError
// All data comes from the registry - no manual duplication needed!
// USES LAZY LOADING to prevent circular dependency issues.

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const COPY_PASTE_OFFSET = 40;
export const MAX_ERRORS_PER_NODE = 10;
export const NODE_ID_PREFIX = "node-";
export const EDGE_ID_PREFIX = "edge-";

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  COPY: "c",
  PASTE: "v",
  TOGGLE_HISTORY: "h",
  SELECT_ALL: "a", // Ctrl+A
  ESCAPE: "Escape", // Esc
  // Alt-based shortcuts
  DELETE_NODES: "q", // Alt+Q
  TOGGLE_INSPECTOR: "a", // Alt+A
  DUPLICATE_NODE: "w", // Alt+W
  TOGGLE_SIDEBAR: "s", // Alt+S
} as const;

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
  MIN_PULSE_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLE_DURATION: 100,
  MIN_INPUT_COUNT: 1,
  MAX_INPUT_COUNT: 10,
} as const;
