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
    sourceHandle: "s",
    targetHandle: "x",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    sourceHandle: "s",
    targetHandle: "x",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
];

// ============================================================================
// REGISTRY INTEGRATION
// ============================================================================

/**
 * SYNC NODE TYPE CONFIG WITH REGISTRY
 * Ensures NODE_TYPE_CONFIG is up-to-date with registry data
 */
export function syncNodeTypeConfigWithRegistry() {
  try {
    // Lazy import to avoid circular dependency
    const { generateNodeTypeConfig } = require("../../nodes/nodeRegistry");

    if (typeof generateNodeTypeConfig === "function") {
      const registryConfig = generateNodeTypeConfig();

      // Merge registry data into the existing NODE_TYPE_CONFIG
      Object.assign(NODE_TYPE_CONFIG, registryConfig);

      console.log(
        "✅ [Constants] Synced NODE_TYPE_CONFIG with registry:",
        Object.keys(registryConfig).length,
        "node types"
      );

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

// ============================================================================
// NODE TYPE CONFIGURATIONS (Synchronized with Node Domain)
// ============================================================================

export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  // CREATE DOMAIN
  createText: {
    defaultData: { text: "", heldText: "", isActive: false },
    hasControls: true,
    hasOutput: true,
    displayName: "Create Text",
  },

  // VIEW DOMAIN
  viewOutput: {
    defaultData: {
      label: "Result",
      displayedValues: [],
      maxHistory: 10,
      autoScroll: true,
      showTypeIcons: true,
      groupSimilar: false,
      filterEmpty: true,
      filterDuplicates: false,
      includedTypes: [],
      isActive: false,
    },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    hasOutput: true,
    hasControls: true,
    displayName: "View Output",
  },

  // TRIGGER DOMAIN
  triggerOnToggle: {
    defaultData: {
      triggered: false,
      value: false,
      outputValue: false,
      type: "TriggerOnToggle",
      label: "Toggle Trigger",
      inputCount: 0,
      hasExternalInputs: false,
      isActive: false,
    },
    hasControls: true,
    displayName: "Trigger On Toggle",
  },

  // TEST DOMAIN
  testError: {
    defaultData: {
      errorMessage: "Custom error message",
      errorType: "error",
      triggerMode: "trigger_on",
      isGeneratingError: false,
      text: "",
      json: "",
      isActive: false,
    },
    hasControls: true,
    displayName: "Test Error",
  },
};

// SYNC: Node type configuration is now synchronized with node-domain structure
// Available node types: createText, viewOutput, triggerOnToggle, testError

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
