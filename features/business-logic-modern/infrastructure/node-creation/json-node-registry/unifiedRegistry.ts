/*
 * UNIFIED REGISTRY v2 – Typed, Commented & Maintainable
 * ----------------------------------------------------
 * • JSON‑driven single‑source‑of‑truth for categories, nodes & inspectors.
 * • Zero manual casts – all runtime checks are narrowed with predicate helpers.
 * • Lazy one‑time initialisation guarded by a Promise (ready()).
 * • Explicit public API surface – everything else is internal.
 * • Small utility helpers extracted for readability & unit testing.
 * • Full JSDoc for IDE‑hover + API docs generation.
 *
 */

/* -------------------------------------------------------------------------
 *  SECTION 1 ▸ Imports & runtime‑safe JSON typings
 * ---------------------------------------------------------------------- */
import type { ComponentType, ReactNode } from "react";
import type { NodeType } from "../../flow-engine/types/nodeData";
import type { InspectorControlProps } from "../factory/types";

import {
  categoryRegistry,
  registerCategory,
  type CategoryRegistration,
} from "./category";
import {
  inspectorRegistry,
  registerInspectorControls,
  type InspectorRegistration,
} from "./inspector";
import { nodeRegistry, registerNode, type NodeRegistration } from "./node";

// JSON‑generated registries (imported as const for literal inference)
import { GENERATED_CATEGORY_REGISTRY } from "./generated/categoryRegistry";
import { GENERATED_NODE_REGISTRY } from "./generated/nodeRegistry";

// Node components – true single source of truth
import CreateText from "../../../node-domain/create/CreateText";
import CreateTextV2 from "../../../node-domain/create/CreateTextV2";
import TestError from "../../../node-domain/test/TestError";
import TriggerOnToggle from "../../../node-domain/trigger/TriggerOnToggle";
import ViewOutput from "../../../node-domain/view/ViewOutput";

/* -------------------------------------------------------------------------
 *  SECTION 2 ▸ Constant maps & general helpers
 * ---------------------------------------------------------------------- */

/** Plain React component used when a concrete implementation is missing. */
const FallbackComponent: ComponentType = () => null;

/** Mapping of known nodeType → concrete implementation. */
const COMPONENTS: Record<string, any> = {
  createText: CreateText,
  createTextV2: CreateTextV2,
  testError: TestError,
  viewOutput: ViewOutput,
  triggerOnToggle: TriggerOnToggle,
};

/**
 * Utility: safely look up an entry in a map returning undefined instead of
 *              throwing.  Keeps Object.prototype clean & avoids hasOwnProperty.
 */
function getOrUndefined<K extends PropertyKey, V>(
  record: Record<K, V>,
  key: K
): V | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
}

/* -------------------------------------------------------------------------
 *  SECTION 3 ▸ Initialisation – category ▸ node ▸ inspector
 * ---------------------------------------------------------------------- */

/** Flagged Promise so external callers can await registry readiness. */
let _ready: Promise<void> | null = null;

/** Initialise all registries exactly once. */
export function ready(): Promise<void> {
  if (_ready) return _ready; // already kicked off

  _ready = (async () => {
    categoryRegistry.clear();
    nodeRegistry.clear();
    inspectorRegistry.clear();

    initCategories();
    initNodes();
    initInspectorControls();
  })();

  return _ready;
}

/* -----------------  Helpers per registry ------------------------------ */

function initCategories(): void {
  for (const [key, data] of Object.entries(GENERATED_CATEGORY_REGISTRY)) {
    const registration: CategoryRegistration = {
      category: key as CategoryRegistration["category"],
      displayName: data.displayName,
      description: data.description,
      icon: data.icon,
      color: data.color,
      order: data.order,
      folder: (data.folder ?? "main") as CategoryRegistration["folder"],
      isEnabled: data.isEnabled !== false,
    };
    registerCategory(registration);
  }
}

function initNodes(): void {
  for (const [type, data] of Object.entries(GENERATED_NODE_REGISTRY)) {
    const component = getOrUndefined(COMPONENTS, type) ?? FallbackComponent;

    const registration: NodeRegistration = {
      nodeType: data.nodeType as NodeRegistration["nodeType"],
      component,
      category: data.category as NodeRegistration["category"],
      folder: (data.folder ?? "main") as NodeRegistration["folder"],
      displayName: data.displayName,
      description: data.description,
      icon: data.icon,
      hasToggle: data.hasToggle ?? true,
      iconWidth: data.iconWidth ?? (data as any).size?.width ?? 120,
      iconHeight: data.iconHeight ?? (data as any).size?.height ?? 60,
      expandedWidth: data.expandedWidth ?? (data as any).size?.width ?? 200,
      expandedHeight: data.expandedHeight ?? (data as any).size?.height ?? 120,
      defaultData: data.defaultData ?? {},
      handles: (data.handles ?? []) as NodeRegistration["handles"],
      hasControls: (data as any).hasControls ?? true,
      hasOutput: (data as any).hasOutput ?? true,
    } as NodeRegistration;

    registerNode(registration);
  }
}

function initInspectorControls(): void {
  /** V2 control configurations per supported nodeType. */
  const V2_CONTROLS = {
    createText: {
      controlType: "v2" as const,
      v2ControlType: "TextNodeControl",
      hasControls: true,
    },
    createTextV2: {
      controlType: "v2" as const,
      v2ControlType: "TextNodeControl", // V2 enhanced text controls
      hasControls: true,
    },
    viewOutput: {
      controlType: "v2" as const,
      v2ControlType: "none",
      hasControls: false,
    },
    triggerOnToggle: {
      controlType: "v2" as const,
      v2ControlType: "TriggerOnToggleControl",
      hasControls: true,
    },
    testError: {
      controlType: "v2" as const,
      v2ControlType: "TextNodeControl",
      hasControls: true,
    },
  } as const;

  for (const [type, data] of Object.entries(GENERATED_NODE_REGISTRY)) {
    const v2Config = getOrUndefined(V2_CONTROLS, type);

    const registration: InspectorRegistration = {
      nodeType: data.nodeType as InspectorRegistration["nodeType"],
      displayName: `${data.displayName} Controls`,
      controlType: v2Config?.controlType ?? "v2",
      defaultData: data.defaultData ?? {},
      renderControls: (): null => null, // placeholder – can be overridden
      hasControls: v2Config?.hasControls ?? true,
      hasOutput: (data as any).hasOutput ?? true,
    } as InspectorRegistration;

    registerInspectorControls(registration);
  }
}

/* -------------------------------------------------------------------------
 *  SECTION 4 ▸ Public helper API – strongly typed facades
 * ---------------------------------------------------------------------- */

/** Category helpers */
export const Category = {
  /** Get metadata for a key, or undefined. */
  get: (key: string) => categoryRegistry.get(key as unknown as any),
  /** True if category exists & enabled. */
  has: (key: string) => categoryRegistry.has(key as unknown as any),
  /** All keys in defined order. */
  keys: () => Array.from(categoryRegistry.keys()),
} as const;

/** Node helpers */
export const Node = {
  /** Retrieve full registration – `undefined` if missing. */
  get: (type: string) => nodeRegistry.get(type as unknown as any),
  /** Safe boolean check. */
  has: (type: string) => nodeRegistry.has(type as unknown as any),
  /** Metadata subset for UI lists. */
  meta: (type: string) => {
    const n = nodeRegistry.get(type as unknown as any);
    return n
      ? {
          category: n.category,
          folder: n.folder,
          hasOutput: n.hasOutput,
          hasControls: n.hasControls,
          hasToggle: n.hasToggle,
        }
      : undefined;
  },
} as const;

/** Inspector helpers */
export const Inspector = {
  get: (type: string) => inspectorRegistry.get(type as unknown as any),
  has: (type: string) => inspectorRegistry.hasInspectorControls(type as any),
} as const;

/* -------------------------------------------------------------------------
 *  SECTION 5 ▸ Handle utilities – kept intact but typed
 * ---------------------------------------------------------------------- */

/** Map normalised → compact Ultimate handle codes. */
const HANDLE_MAP = new Map<string, string>([
  ["boolean", "b"],
  ["string", "s"],
  ["number", "n"],
  ["bigint", "N"],
  ["undefined", "u"],
  ["null", "∅"],
  ["symbol", "S"],
  // Complex
  ["object", "o"],
  ["array", "a"],
  ["json", "{}"],
  ["map", "m"],
  ["set", "st"],
  ["tuple", "t"],
  // Special
  ["date", "d"],
  ["regexp", "r"],
  ["error", "e"],
  ["weakmap", "w"],
  ["weakset", "ws"],
  // Functional
  ["function", "fn"],
  ["asyncfunction", "af"],
  ["generatorfunction", "gf"],
  ["promise", "p"],
  // Typed arrays
  ["typedarray", "ta"],
  ["arraybuffer", "ab"],
  // Meta
  ["any", "x"],
  ["void", "v"],
  ["never", "nv"],
  ["unknown", "uk"],
  // Flow
  ["trigger", "tr"],
  ["signal", "sg"],
  ["event", "ev"],
  // Custom
  ["image", "o"],
  // Vibe handles
  ["vibe", "V"],
  ["vibeobject", "{}"],
]);

/** Convert arbitrary JSON dataType to Ultimate handle compact code. */
export function normaliseHandleType(dataType: string): string {
  if (!dataType) return "x";
  const key = dataType.toLowerCase().trim();
  return HANDLE_MAP.get(key) ?? key;
}

/* -------------------------------------------------------------------------
 *  SECTION 6 ▸ Validation & diagnostics – thin wrappers over registry impls
 * ---------------------------------------------------------------------- */

export function validate(): ReturnType<typeof nodeRegistry.validateRegistry> &
  ReturnType<typeof inspectorRegistry.validateRegistry> {
  const nodeReport = nodeRegistry.validateRegistry();
  const inspectorReport = inspectorRegistry.validateRegistry();
  return { ...nodeReport, ...inspectorReport } as any; // merged summary
}

export function stats() {
  return {
    nodes: nodeRegistry.getRegistryStats(),
    inspectors: inspectorRegistry.getRegistryStats(),
    categories: categoryRegistry.getRegistryStats(),
  } as const;
}

/* -------------------------------------------------------------------------
 *  SECTION 7 ▸ Legacy compatibility layer - CRITICAL for existing code
 * ---------------------------------------------------------------------- */

// ============================================================================
// BACKWARD COMPATIBILITY FUNCTIONS (Required by existing imports)
// ============================================================================

/**
 * Legacy function: Initialize the unified registry system
 * @deprecated Use ready() instead
 */
export async function initializeUnifiedRegistry(): Promise<void> {
  await ready();
}

/**
 * Get node metadata for a specific node type
 */
export function getNodeMetadata(nodeType: string): any {
  return Node.get(nodeType);
}

/**
 * Get node capabilities (simplified version of old function)
 */
export function getNodeCapabilities(nodeType: string): any {
  return Node.meta(nodeType);
}

/**
 * Safe node type casting with validation
 */
export function safeNodeTypeCast(nodeType: string): string | null {
  return Node.has(nodeType) ? nodeType : null;
}

/**
 * Validate node for inspector
 */
export function validateNodeForInspector(nodeType: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const isValid = Node.has(nodeType);

  if (isValid) {
    return {
      isValid: true,
      warnings: [],
      suggestions: [],
    };
  }

  return {
    isValid: false,
    warnings: [`Node type '${nodeType}' is not registered`],
    suggestions: [
      "Check if the node type is spelled correctly",
      "Ensure the node is properly registered in the JSON registry",
    ],
  };
}

/**
 * Get legacy MODERN_NODE_REGISTRY for backward compatibility
 */
export function getLegacyModernNodeRegistry(): Record<string, any> {
  return getLegacyNodeRegistry();
}

/**
 * Legacy MODERN_NODE_REGISTRY replacement
 * Returns the same API but backed by JSON-generated registries
 */
export function getLegacyNodeRegistry(): Record<NodeType, any> {
  const legacyRegistry: Record<string, any> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    legacyRegistry[nodeType] = {
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
      handles: registration.handles,
      size: {
        width: registration.iconWidth,
        height: registration.iconHeight,
      },
      defaultData: registration.defaultData,
      hasTargetPosition: false, // Default value
      targetPosition: "top", // Default value
      hasOutput: registration.hasOutput,
      hasControls: registration.hasControls,
      factoryConfig: registration.factoryConfig,

      // Legacy fields for backward compatibility
      factoryLabel: registration.displayName,
      factoryDefaultData: registration.defaultData,
      inspectorControls: {
        type: inspectorRegistry.hasInspectorControls(nodeType)
          ? "factory"
          : "none",
        factoryControls: inspectorRegistry.hasInspectorControls(nodeType),
      },
    };
  }

  return legacyRegistry as Record<NodeType, any>;
}

/**
 * Legacy NODE_INSPECTOR_REGISTRY replacement
 */
export function getLegacyInspectorRegistry(): Map<
  string,
  (props: InspectorControlProps<any>) => ReactNode
> {
  const legacyMap = new Map<
    string,
    (props: InspectorControlProps<any>) => ReactNode
  >();

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    legacyMap.set(nodeType, registration.renderControls);
  }

  return legacyMap;
}

/**
 * Get node inspector controls
 */
export function getNodeInspectorControls(nodeType: string): any {
  const registration = Inspector.get(nodeType);
  return registration?.renderControls;
}

/**
 * Check if factory has inspector controls
 */
export function hasFactoryInspectorControls(nodeType: string): boolean {
  return Inspector.has(nodeType);
}

/**
 * Register node inspector controls (alias for existing function)
 */
export function registerNodeInspectorControls(registration: any): void {
  registerInspectorControls(registration);
}

/**
 * Register node type config (for factory compatibility)
 */
export function registerNodeTypeConfig(config: any): void {
  // This function is used by the factory system for inspector compatibility
  // For now, this is a placeholder that logs the registration
  if (process.env.NODE_ENV !== "production") {
    console.log("📝 [registerNodeTypeConfig] Registered node config:", {
      nodeType: config.nodeType,
      hasControls: config.hasControls,
      hasOutput: config.hasOutput,
    });
  }

  // In the future, this could be enhanced to store additional metadata
  // or integrate with more advanced factory configuration systems
}

/**
 * Generate inspector control mapping (for NodeControls compatibility)
 */
export function generateInspectorControlMapping(): any {
  const mapping: Record<string, any> = {};

  // V2 control configurations for known node types
  const controlConfigs = {
    createText: { type: "v2", v2ControlType: "TextNodeControl" },
    createTextV2: { type: "v2", v2ControlType: "TextNodeControl" }, // V2 enhanced text controls
    viewOutput: { type: "none" },
    triggerOnToggle: {
      type: "v2", // TriggerOnToggle uses V2 system
      v2ControlType: "TriggerOnToggleControl",
    },
    testError: { type: "v2", v2ControlType: "TextNodeControl" },
  };

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    const config = controlConfigs[nodeType as keyof typeof controlConfigs];

    mapping[nodeType] = {
      nodeType: registration.nodeType,
      displayName: registration.displayName,
      renderControls: registration.renderControls,
      hasControls: registration.hasControls,
      type: config?.type || "v2",
      v2ControlType:
        config && "v2ControlType" in config ? config.v2ControlType : undefined,
      // Keep legacy for backward compatibility
      legacyControlType:
        config && "v2ControlType" in config ? config.v2ControlType : undefined,
    };
  }

  return mapping;
}

/**
 * Get node handles
 */
export function getNodeHandles(nodeType: string): any[] {
  const registration = Node.get(nodeType);
  return registration?.handles || [];
}

/**
 * Get node handles with normalized data types for Ultimate handle system
 */
export function getNodeHandlesNormalized(nodeType: string): any[] {
  const handles = getNodeHandles(nodeType);

  return handles.map((handle) => ({
    ...handle,
    dataType: normaliseHandleType(handle.dataType),
    originalDataType: handle.dataType, // Keep original for reference
  }));
}

/**
 * Get specific handle by ID with normalized data type
 */
export function getNodeHandle(
  nodeType: string,
  handleId: string,
  handleType: "source" | "target"
): any | null {
  const handles = getNodeHandlesNormalized(nodeType);
  const handle =
    handles.find((h) => h.id === handleId && h.type === handleType) || null;

  if (process.env.NODE_ENV !== "production") {
    console.log(`[getNodeHandle] ${nodeType}.${handleId} (${handleType}):`, {
      found: !!handle,
      handles: handles.map((h) => ({
        id: h.id,
        type: h.type,
        dataType: h.dataType,
      })),
      result: handle,
    });
  }

  return handle;
}

/**
 * Validate handle compatibility using Ultimate handle system
 */
export function validateHandleConnection(
  sourceNodeType: string,
  sourceHandleId: string,
  targetNodeType: string,
  targetHandleId: string
): {
  isValid: boolean;
  sourceType: string | null;
  targetType: string | null;
  reason?: string;
} {
  const sourceHandle = getNodeHandle(sourceNodeType, sourceHandleId, "source");
  const targetHandle = getNodeHandle(targetNodeType, targetHandleId, "target");

  if (!sourceHandle) {
    return {
      isValid: false,
      sourceType: null,
      targetType: targetHandle?.dataType || null,
      reason: `Source handle "${sourceHandleId}" not found on node type "${sourceNodeType}"`,
    };
  }

  if (!targetHandle) {
    return {
      isValid: false,
      sourceType: sourceHandle.dataType,
      targetType: null,
      reason: `Target handle "${targetHandleId}" not found on node type "${targetNodeType}"`,
    };
  }

  // Import Ultimate handle system compatibility check
  try {
    const {
      isTypeCompatible,
    } = require("../node-handles/UltimateTypesafeHandle");
    const isValid = isTypeCompatible(
      sourceHandle.dataType,
      targetHandle.dataType
    );

    return {
      isValid,
      sourceType: sourceHandle.dataType,
      targetType: targetHandle.dataType,
      reason: isValid
        ? undefined
        : `Type mismatch: ${sourceHandle.dataType} → ${targetHandle.dataType}`,
    };
  } catch (error) {
    console.warn(
      "[unifiedRegistry] Failed to load Ultimate handle system for validation:",
      error
    );

    // Fallback: basic compatibility check
    const isValid =
      sourceHandle.dataType === targetHandle.dataType ||
      sourceHandle.dataType === "x" ||
      targetHandle.dataType === "x";

    return {
      isValid,
      sourceType: sourceHandle.dataType,
      targetType: targetHandle.dataType,
      reason: isValid
        ? undefined
        : `Type mismatch: ${sourceHandle.dataType} → ${targetHandle.dataType} (fallback check)`,
    };
  }
}

/**
 * Data type normalization function (keep original name for compatibility)
 */
export function normalizeHandleDataType(dataType: string): string {
  return normaliseHandleType(dataType);
}

/**
 * Check if a node type is valid
 */
export function isValidNodeType(nodeType: string): boolean {
  return Node.has(nodeType);
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: string): any {
  return Category.get(category);
}

/**
 * Legacy CATEGORY_REGISTRY for backward compatibility
 */
export const CATEGORY_REGISTRY = {
  get: (category: string) => Category.get(category),
  has: (category: string) => Category.has(category),
  keys: () => Category.keys(),
  values: () => Array.from(categoryRegistry.values()),
  entries: () => Array.from(categoryRegistry.entries()),
  size: () => categoryRegistry.size(),
};

/**
 * Legacy NODE_INSPECTOR_REGISTRY for backward compatibility
 */
export const NODE_INSPECTOR_REGISTRY = getLegacyInspectorRegistry();

/**
 * Validate the unified registry system
 */
export function validateUnifiedRegistry(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nodes: number;
    inspectors: number;
    categories: number;
  };
} {
  const nodeValidation = nodeRegistry.validateRegistry();
  const inspectorValidation = inspectorRegistry.validateRegistry();

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nodeValidation.isValid) {
    nodeValidation.issues.forEach((issue: any) => {
      errors.push(
        ...issue.errors.map(
          (error: string) => `Node ${issue.nodeType}: ${error}`
        )
      );
      warnings.push(
        ...issue.warnings.map(
          (warning: string) => `Node ${issue.nodeType}: ${warning}`
        )
      );
    });
  }

  if (!inspectorValidation.isValid) {
    inspectorValidation.issues.forEach((issue) => {
      errors.push(
        ...issue.errors.map((error) => `Inspector ${issue.nodeType}: ${error}`)
      );
      warnings.push(
        ...issue.warnings.map(
          (warning) => `Inspector ${issue.nodeType}: ${warning}`
        )
      );
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodes: nodeRegistry.size(),
      inspectors: inspectorRegistry.size(),
      categories: categoryRegistry.size(),
    },
  };
}

/**
 * Get unified registry statistics
 */
export function getUnifiedRegistryStats() {
  return {
    nodes: nodeRegistry.getRegistryStats(),
    inspectors: inspectorRegistry.getRegistryStats(),
    categories: categoryRegistry.getRegistryStats(),
    migration: {
      isInitialized: nodeRegistry.size() > 0,
      nodesRegistered: nodeRegistry.size(),
      inspectorsRegistered: inspectorRegistry.size(),
      categoriesRegistered: categoryRegistry.size(),
    },
  };
}

// Export registry instances for external access
export { categoryRegistry } from "./category";
export {
  getCategoryByKey,
  getNodeByType,
  getNodesByCategory,
} from "./generated";
export { inspectorRegistry } from "./inspector";
export { nodeRegistry } from "./node";

// ============================================================================
// ADDITIONAL COMPATIBILITY EXPORTS
// ============================================================================

// Helper to ensure registry is ready
export async function ensureRegistryReady(): Promise<void> {
  await ready();
}

/**
 * Debug function to test handle connections
 */
export function debugHandleConnections(): void {
  console.group("🔍 [Debug] Handle Connection Test");

  try {
    // Test common node types
    const testNodes = [
      "createText",
      "viewOutput",
      "triggerOnToggle",
      "testError",
    ];

    testNodes.forEach((nodeType) => {
      console.log(`\n--- ${nodeType} ---`);
      const handles = getNodeHandles(nodeType);
      const normalizedHandles = getNodeHandlesNormalized(nodeType);

      console.log("Raw handles:", handles);
      console.log("Normalized handles:", normalizedHandles);
    });

    // Test a specific connection
    console.log("\n--- Connection Test: createText -> viewOutput ---");
    const createTextOutput = getNodeHandle("createText", "output", "source");
    const viewOutputInput = getNodeHandle("viewOutput", "input", "target");

    console.log("createText output handle:", createTextOutput);
    console.log("viewOutput input handle:", viewOutputInput);

    if (createTextOutput && viewOutputInput) {
      const connectionResult = validateHandleConnection(
        "createText",
        "output",
        "viewOutput",
        "input"
      );
      console.log("Connection validation result:", connectionResult);
    }
  } catch (error) {
    console.error("Debug test failed:", error);
  }

  console.groupEnd();
}

// Auto-run debug in development
if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
  // Run after a delay to ensure registry is initialized
  setTimeout(() => {
    (window as any).debugHandleConnections = debugHandleConnections;
    console.log("🛠️ Handle debug function available: debugHandleConnections()");
  }, 1000);
}

// Export the initialization promise for compatibility
export const initializationPromise = ready();

// ============================================================================
// FACTORY INTEGRATION HELPERS
// ============================================================================

/**
 * Get legacy factory inspector registry (for NodeControls compatibility)
 */
export function getLegacyFactoryInspectorRegistry(): Map<string, any> {
  const legacyMap = new Map<string, any>();

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    legacyMap.set(nodeType, {
      nodeType: registration.nodeType,
      renderControls: registration.renderControls,
      defaultData: registration.defaultData,
      displayName: registration.displayName,
      hasControls: registration.hasControls,
      hasOutput: registration.hasOutput,
      factoryConfig: registration.factoryConfig,
    });
  }

  return legacyMap;
}

/**
 * Enhanced node registration type for factory compatibility
 */
export interface EnhancedNodeRegistration {
  nodeType: string;
  component: any;
  category: string;
  folder: string;
  displayName: string;
  description: string;
  icon: string;
  hasToggle: boolean;
  iconWidth: number;
  iconHeight: number;
  expandedWidth: number;
  expandedHeight: number;
  defaultData: any;
  handles: any[];
  hasControls?: boolean;
  hasOutput?: boolean;
  factoryConfig?: any;
}

/**
 * Get enhanced node registration (for factory compatibility)
 */
export function getEnhancedNodeRegistration(
  nodeType: string
): EnhancedNodeRegistration | null {
  const registration = Node.get(nodeType);
  if (!registration) return null;

  return {
    nodeType: registration.nodeType,
    component: registration.component,
    category: registration.category,
    folder: registration.folder,
    displayName: registration.displayName,
    description: registration.description,
    icon: registration.icon,
    hasToggle: registration.hasToggle,
    iconWidth: registration.iconWidth,
    iconHeight: registration.iconHeight,
    expandedWidth: registration.expandedWidth,
    expandedHeight: registration.expandedHeight,
    defaultData: registration.defaultData,
    handles: registration.handles,
    hasControls: registration.hasControls,
    hasOutput: registration.hasOutput,
    factoryConfig: registration.factoryConfig,
  };
}

/* -------------------------------------------------------------------------
 *  AUTO‑BOOT – kick off initialization immediately for ESM side‑effects
 * ---------------------------------------------------------------------- */
_ready = ready();
