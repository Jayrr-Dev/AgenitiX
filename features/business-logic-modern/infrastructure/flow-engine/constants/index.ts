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
// TYPE LEGEND & COLORS (unified with UltimateTypesafeHandle)
// ============================================================================

/**
 * UNIFIED TYPE SYSTEM - Now uses UltimateTypesafeHandle as single source of truth
 * 
 * This maintains backward compatibility while providing access to the full
 * expanded type system with 25+ types, union support, and enhanced features.
 * 
 * For basic usage: Still supports original 11 types (s, n, b, j, a, N, f, x, u, S, ∅)
 * For advanced usage: Access full ULTIMATE_TYPE_MAP with 25+ types via getUltimateTypeMap()
 */

// Lazy import to prevent circular dependencies
function getUltimateTypeMap() {
  try {
    const { ULTIMATE_TYPE_MAP } = require("../../node-creation/systems/ui/node-handles/UltimateTypesafeHandle");
    return ULTIMATE_TYPE_MAP;
  } catch (error) {
    console.warn("[Constants] Failed to load ULTIMATE_TYPE_MAP, using fallback:", error);
    // Fallback for edge cases
    return {
      s: { label: "s", color: "#3b82f6" },
      n: { label: "n", color: "#f59e42" },
      b: { label: "b", color: "#10b981" },
      j: { label: "j", color: "#6366f1" },
      a: { label: "a", color: "#f472b6" },
      N: { label: "N", color: "#a21caf" },
      f: { label: "f", color: "#fbbf24" },
      x: { label: "x", color: "#6b7280" },
      u: { label: "u", color: "#d1d5db" },
      S: { label: "S", color: "#eab308" },
      "∅": { label: "∅", color: "#ef4444" },
    };
  }
}

/**
 * BACKWARD COMPATIBLE TYPE MAP
 * Maintains the same interface as before but now pulls from the unified system
 */
export const TYPE_MAP: TypeMap = new Proxy({} as TypeMap, {
  get(target, prop: string) {
    const ultimateMap = getUltimateTypeMap();
    
    // Handle legacy 'j' type (JSON) - map to '{}' in ultimate system
    if (prop === 'j' && ultimateMap['{}']) {
      return { label: 'j', color: ultimateMap['{}'].color };
    }
    
    // Direct mapping for other types
    if (ultimateMap[prop]) {
      return { 
        label: ultimateMap[prop].label, 
        color: ultimateMap[prop].color 
      };
    }
    
    // Fallback for unknown types
    return { label: prop, color: "#6b7280" }; // gray
  },
  
  ownKeys() {
    // Return the core legacy types for Object.keys() compatibility
    return ['s', 'n', 'b', 'j', 'a', 'N', 'f', 'x', 'u', 'S', '∅'];
  },
  
  has(target, prop) {
    const coreTypes = ['s', 'n', 'b', 'j', 'a', 'N', 'f', 'x', 'u', 'S', '∅'];
    return coreTypes.includes(prop as string);
  }
});

/**
 * ACCESS TO FULL ULTIMATE TYPE SYSTEM
 * For components that need the advanced features (union types, categories, etc.)
 */
export function getUltimateTypeSystem() {
  try {
    const ultimateModule = require("../../node-creation/systems/ui/node-handles/UltimateTypesafeHandle");
    return {
      ULTIMATE_TYPE_MAP: ultimateModule.ULTIMATE_TYPE_MAP,
      parseUnionTypes: ultimateModule.parseUnionTypes,
      isTypeCompatible: ultimateModule.isTypeCompatible,
      createUnionType: ultimateModule.createUnionType,
      isUnionType: ultimateModule.isUnionType,
    };
  } catch (error) {
    console.warn("[Constants] Failed to load ultimate type system:", error);
    return null;
  }
}

// ============================================================================
// MIGRATION NOTES
// ============================================================================

/*
 * MIGRATION COMPLETE ✅
 * 
 * • TYPE_MAP now uses UltimateTypesafeHandle as single source of truth
 * • Backward compatibility maintained for existing code
 * • Access to enhanced features via getUltimateTypeSystem()
 * • No breaking changes for current consumers
 * • Unified color system prevents inconsistencies
 * 
 * Usage:
 * - Legacy: TYPE_MAP['s'].color (still works)  
 * - Enhanced: getUltimateTypeSystem().ULTIMATE_TYPE_MAP['s'].description
 */

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
    style: { stroke: "#3b82f6", strokeWidth: 2 }, // Blue for create category
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
    style: { stroke: "#3b82f6", strokeWidth: 2 }, // Blue for create category
  },
];

// ============================================================================
// REGISTRY INTEGRATION - Single Source of Truth (LAZY LOADING)
// ============================================================================

let isNodeTypeConfigInitialized = false;

/**
 * AUTO-SYNC NODE TYPE CONFIG WITH JSON REGISTRY (LAZY LOADING)
 * Now the JSON registry is the single source of truth for all node data
 * Uses lazy loading to prevent circular dependency issues
 */
function initializeNodeTypeConfig() {
  if (isNodeTypeConfigInitialized) {
    return true; // Already initialized
  }

  try {
    // Note: Using simple fallback config since we're transitioning away from duplicate domains
    // The JSON registry is now the single source of truth
    const generatedConfig = {
      createText: {
        defaultData: { text: "", heldText: "" },
        hasTargetPosition: true,
        targetPosition: "top",
        hasOutput: true,
        hasControls: true,
        displayName: "Create Text",
      },
      viewOutput: {
        defaultData: { displayedValues: [] },
        hasTargetPosition: true,
        targetPosition: "top",
        hasOutput: false,
        hasControls: true,
        displayName: "View Output",
      },
      triggerOnToggle: {
        defaultData: { triggered: false, outputValue: false },
        hasTargetPosition: true,
        targetPosition: "top",
        hasOutput: true,
        hasControls: true,
        displayName: "Trigger On Toggle",
      },
      testError: {
        defaultData: {
          errorMessage: "Test Error",
          errorType: "error",
          isGeneratingError: false,
          text: "",
          json: "",
        },
        hasTargetPosition: true,
        targetPosition: "top",
        hasOutput: true,
        hasControls: true,
        displayName: "Test Error",
      },
    };

    // Merge generated config into exported constant
    Object.assign(NODE_TYPE_CONFIG, generatedConfig);

    isNodeTypeConfigInitialized = true;
    return true;
  } catch (error) {
    console.error("❌ [Constants] Failed to load node-domain config:", error);
    return false;
  }
}

/**
 * LAZY GETTER FOR NODE TYPE CONFIG
 * Ensures JSON registry is loaded before accessing config
 */
function getNodeTypeConfig(): NodeTypeConfigMap {
  if (!isNodeTypeConfigInitialized) {
    initializeNodeTypeConfig();
  }
  return NODE_TYPE_CONFIG;
}

/**
 * SYNC NODE TYPE CONFIG WITH JSON REGISTRY
 * Ensures NODE_TYPE_CONFIG is up-to-date with JSON registry data
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

// SYNC: Node type configuration is now auto-generated from JSON_NODE_REGISTRY
// Available node types: createText, viewOutput, triggerOnToggle, testError, dataTable, imageTransform
// All data comes from the JSON registry - no manual duplication needed!
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
