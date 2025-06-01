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
import type { AgenEdge, AgenNode, NodeTypeConfigMap, TypeMap } from "../types";

// ============================================================================
// TYPE LEGEND & COLORS (sync with CustomHandle)
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
// NODE TYPE CONFIGURATIONS (Enhanced Registry Compatible)
// ============================================================================

export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  createText: {
    defaultData: { text: "", heldText: "", isActive: false },
    hasControls: true,
    hasOutput: true,
    displayName: "Create Text",
  },
  createTextRefactor: {
    defaultData: { text: "", heldText: "", isActive: false },
    hasControls: true,
    hasOutput: true,
    displayName: "🔧 Create Text (Refactored)",
  },
  createTextEnhanced: {
    defaultData: {
      text: "",
      output: "",
      isEnabled: true,
      prefix: "",
      maxLength: 500,
      isActive: false,
    },
    hasControls: true,
    displayName: "✨ Enhanced Text",
  },
  cyclePulseEnhanced: {
    defaultData: {
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true,
      maxCycles: 1,
      autoStart: false,
      burstMode: false,
      burstCount: 3,
      isRunning: false,
      isPulsing: false,
      cycleCount: 0,
      progress: 0,
      currentPhase: "stopped",
      output: false,
      isActive: false,
    },
    hasControls: true,
    displayName: "⚡ Enhanced Pulse",
  },
  triggerToggleEnhanced: {
    defaultData: {
      triggered: false,
      autoToggle: false,
      holdDuration: 1000,
      pulseMode: false,
      value: false,
      text: undefined,
      isActive: false,
    },
    hasControls: true,
    displayName: "🔄 Enhanced Toggle",
  },
  viewOutputEnhanced: {
    defaultData: {
      displayedValues: [],
      maxHistory: 10,
      autoScroll: true,
      showTypeIcons: true,
      groupSimilar: false,
      filterEmpty: true,
      filterDuplicates: false,
      includedTypes: [],
      text: undefined,
      isActive: false,
    },
    hasControls: true,
    displayName: "📤 Enhanced View",
  },
  turnToUppercase: {
    defaultData: { text: "", isActive: false },
    hasControls: false,
    displayName: "Turn To Uppercase",
  },
  viewOutput: {
    defaultData: { label: "Result", isActive: false },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    hasOutput: true,
    hasControls: true,
    displayName: "View Output",
  },
  viewOutputRefactor: {
    defaultData: { displayedValues: [], isActive: false },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    hasOutput: true,
    hasControls: false,
    displayName: "🔧 View Output (Refactored)",
  },
  triggerOnClick: {
    defaultData: { triggered: false, isActive: false },
    hasControls: true,
    displayName: "Trigger On Click",
  },
  triggerOnPulse: {
    defaultData: { triggered: false, duration: 500, isActive: false },
    hasControls: true,
    displayName: "Trigger On Pulse",
  },
  cyclePulse: {
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      cycleDuration: 2000,
      pulseDuration: 500,
      infinite: true,
      maxCycles: 1,
      isActive: false,
    },
    hasControls: true,
    displayName: "Cycle Pulse",
  },
  triggerOnToggle: {
    defaultData: { triggered: false, isActive: false },
    hasControls: true,
    displayName: "Trigger On Toggle",
  },
  triggerOnToggleRefactor: {
    defaultData: {
      triggered: false,
      value: false,
      outputValue: false,
      type: "TriggerOnToggleRefactor",
      label: "🔧 Toggle Trigger (Refactored)",
      inputCount: 0,
      hasExternalInputs: false,
      isActive: false,
    },
    hasControls: true,
    displayName: "🔧 Toggle Trigger (Refactored)",
  },
  cycleToggle: {
    defaultData: {
      triggered: false,
      isRunning: false,
      initialState: false,
      onDuration: 4000,
      offDuration: 4000,
      infinite: true,
      maxCycles: 1,
      isActive: false,
    },
    hasControls: true,
    displayName: "Cycle Toggle",
  },
  logicAnd: {
    defaultData: { value: false, inputCount: 2, isActive: false },
    displayName: "Logic AND",
  },
  logicOr: {
    defaultData: { value: false, inputCount: 2, isActive: false },
    displayName: "Logic OR",
  },
  logicNot: {
    defaultData: { value: false, isActive: false },
    displayName: "Logic NOT",
  },
  logicXor: {
    defaultData: { value: false, isActive: false },
    displayName: "Logic XOR",
  },
  logicXnor: {
    defaultData: { value: false, isActive: false },
    displayName: "Logic XNOR",
  },
  turnToText: {
    defaultData: { text: "", originalValue: undefined, isActive: false },
    displayName: "Turn To Text",
  },
  turnToBoolean: {
    defaultData: { value: "", triggered: false, isActive: false },
    displayName: "Turn To Boolean",
  },
  testInput: {
    defaultData: { value: undefined, isActive: false },
    displayName: "Test Input",
  },
  editObject: {
    defaultData: { value: {}, isActive: false },
    displayName: "Edit Object",
  },
  editArray: {
    defaultData: { value: [], isActive: false },
    displayName: "Edit Array",
  },
  countInput: {
    defaultData: { count: 0, multiplier: 1, isActive: false },
    displayName: "Count Input",
  },
  delayInput: {
    defaultData: { delay: 1000, isProcessing: false, isActive: false },
    displayName: "Delay Input",
  },
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
    displayName: "Error Generator",
  },
  testJson: {
    defaultData: {
      jsonText: '{"example": "value"}',
      parsedJson: null,
      parseError: null,
      json: null,
      isActive: false,
    },
    hasControls: true,
    displayName: "Test JSON",
  },
};

// DEBUG: Verify the values are correct when this module loads
console.log(
  "🔧 DEBUG: NODE_TYPE_CONFIG loaded with createTextRefactor:",
  NODE_TYPE_CONFIG.createTextRefactor
);
console.log(
  "🔧 DEBUG: NODE_TYPE_CONFIG loaded with createText:",
  NODE_TYPE_CONFIG.createText
);

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
      defaultText: "hello",
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
      defaultText: "world",
      isActive: true,
    },
  },
  {
    id: "3",
    type: "turnToUppercase",
    position: { x: 100, y: -100 },
    deletable: true,
    data: { text: "HELLO", isActive: true },
  },
  {
    id: "4",
    type: "viewOutput",
    position: { x: 300, y: -75 },
    targetPosition: Position.Top,
    deletable: true,
    data: { label: "Result", isActive: true },
  },
];

export const INITIAL_EDGES: AgenEdge[] = [
  {
    id: "e1-3",
    source: "1",
    target: "3",
    sourceHandle: "s",
    targetHandle: "s",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    sourceHandle: "s",
    targetHandle: "x",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
  {
    id: "e2-4",
    source: "2",
    target: "4",
    sourceHandle: "s",
    targetHandle: "x",
    type: "default",
    deletable: true,
    focusable: true,
    style: { stroke: TYPE_MAP["s"].color, strokeWidth: 2 },
  },
];

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
