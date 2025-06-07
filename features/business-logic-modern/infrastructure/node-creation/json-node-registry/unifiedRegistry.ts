/**
 * UNIFIED REGISTRY - Single source of truth using JSON-generated registries
 *
 * • Uses JSON-generated registries instead of manual hardcoding
 * • Provides legacy API compatibility during transition
 * • Eliminates data duplication and sync issues
 * • Points to node-domain as the single source for node components
 *
 * Keywords: unified-registry, json-generated, legacy-replacement, deduplication, node-domain
 */

import type { ReactNode } from "react";
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

// Import from GENERATED registries (JSON-based)
import { GENERATED_CATEGORY_REGISTRY } from "./generated/categoryRegistry";
import { GENERATED_NODE_REGISTRY } from "./generated/nodeRegistry";

// Import existing node components from the main node-domain directory (single source of truth)
import CreateText from "../../../node-domain/create/CreateText";
import TestError from "../../../node-domain/test/TestError";
import TriggerOnToggle from "../../../node-domain/trigger/TriggerOnToggle";
import ViewOutput from "../../../node-domain/view/ViewOutput";

// Simple fallback component for nodes that don't have implementations yet
const SimpleFallbackComponent = () => {
  return null; // Simple null component that won't break React
};

// Component mapping for available nodes from node-domain (single source of truth)
const AVAILABLE_COMPONENTS = {
  createText: CreateText,
  testError: TestError,
  viewOutput: ViewOutput,
  triggerOnToggle: TriggerOnToggle,
};

// ============================================================================
// UNIFIED REGISTRY INITIALIZATION FROM JSON
// ============================================================================

/**
 * Initialize the unified registry system from JSON-generated registries
 * This replaces manual hardcoding with JSON-driven configuration
 */
export async function initializeUnifiedRegistry(): Promise<void> {
  // Clear existing registries to avoid conflicts
  nodeRegistry.clear();
  inspectorRegistry.clear();
  categoryRegistry.clear();

  // Initialize categories from generated JSON data
  await initializeCategoriesFromJSON();

  // Initialize nodes from generated JSON data
  await initializeNodesFromJSON();

  // Initialize inspector controls from generated JSON data
  await initializeInspectorControlsFromJSON();
}

/**
 * Initialize category registrations from JSON-generated data
 */
async function initializeCategoriesFromJSON(): Promise<void> {
  for (const [categoryKey, categoryData] of Object.entries(
    GENERATED_CATEGORY_REGISTRY
  )) {
    const categoryRegistration: CategoryRegistration = {
      category: categoryKey as any, // Generated types are dynamic, cast needed
      displayName: categoryData.displayName,
      description: categoryData.description,
      icon: categoryData.icon,
      color: categoryData.color,
      order: categoryData.order,
      folder: (categoryData.folder || "main") as any, // Generated types are dynamic
      isEnabled: categoryData.isEnabled !== false,
    };

    registerCategory(categoryRegistration);
  }
}

/**
 * Initialize node registrations from JSON-generated data
 */
async function initializeNodesFromJSON(): Promise<void> {
  for (const [nodeType, nodeData] of Object.entries(GENERATED_NODE_REGISTRY)) {
    // Cast nodeData to any to handle union types
    const nodeDataAny = nodeData as any;

    // Get component from available components or use fallback
    let component =
      AVAILABLE_COMPONENTS[nodeType as keyof typeof AVAILABLE_COMPONENTS] ||
      SimpleFallbackComponent;

    // Skip dynamic imports completely to avoid broken components
    console.info(
      `Using static component for ${nodeType}:`,
      !!AVAILABLE_COMPONENTS[nodeType as keyof typeof AVAILABLE_COMPONENTS]
        ? "available"
        : "fallback"
    );

    const nodeRegistration: NodeRegistration<any> = {
      nodeType: nodeData.nodeType as any,
      component: component, // Always provide a component
      category: nodeData.category as any,
      folder: (nodeData.folder || "main") as any,
      displayName: nodeData.displayName,
      description: nodeData.description,
      icon: nodeData.icon,
      hasToggle: nodeData.hasToggle ?? true,
      iconWidth: nodeData.iconWidth || (nodeData as any).size?.width || 120,
      iconHeight: nodeData.iconHeight || (nodeData as any).size?.height || 60,
      expandedWidth:
        nodeData.expandedWidth || (nodeData as any).size?.width || 200,
      expandedHeight:
        nodeData.expandedHeight || (nodeData as any).size?.height || 120,
      defaultData: nodeData.defaultData || {},
      handles: (nodeData.handles || []) as any,
      hasControls: nodeDataAny.hasControls ?? true,
      hasOutput: nodeDataAny.hasOutput ?? true,
    };

    registerNode(nodeRegistration);
  }
}

/**
 * Initialize inspector control registrations with simple, working controls
 */
async function initializeInspectorControlsFromJSON(): Promise<void> {
  // Simple control registrations for known node types
  const simpleControlConfigs = {
    createText: {
      controlType: "legacy" as const,
      legacyControlType: "TextNodeControl",
      hasControls: true,
    },
    viewOutput: {
      controlType: "legacy" as const,
      legacyControlType: "none",
      hasControls: false,
    },
    triggerOnToggle: {
      controlType: "legacy" as const,
      legacyControlType: "TriggerOnToggleControl",
      hasControls: true,
    },
    testError: {
      controlType: "legacy" as const,
      legacyControlType: "TextNodeControl",
      hasControls: true,
    },
  };

  for (const [nodeType, nodeData] of Object.entries(GENERATED_NODE_REGISTRY)) {
    const nodeDataAny = nodeData as any;
    const controlConfig =
      simpleControlConfigs[nodeType as keyof typeof simpleControlConfigs];

    const inspectorRegistration: InspectorRegistration<any> = {
      nodeType: nodeData.nodeType as any,
      displayName: `${nodeData.displayName} Controls`,
      controlType: controlConfig?.controlType || "legacy",
      defaultData: nodeData.defaultData || {},
      renderControls: (props: InspectorControlProps<any>) => null as any,
      hasControls: controlConfig?.hasControls ?? true,
      hasOutput: nodeDataAny.hasOutput ?? true,
    };

    registerInspectorControls(inspectorRegistration);
  }
}

// ============================================================================
// UTILITY FUNCTIONS FOR SIDEBAR AND COMPONENTS
// ============================================================================

/**
 * Get node metadata for a specific node type
 */
export function getNodeMetadata(nodeType: string): any {
  return nodeRegistry.get(nodeType as any);
}

/**
 * Get node capabilities (simplified version of old function)
 */
export function getNodeCapabilities(nodeType: string): any {
  const registration = nodeRegistry.get(nodeType as any);
  if (!registration) return null;

  return {
    category: registration.category,
    folder: registration.folder,
    hasOutput: registration.hasOutput,
    hasControls: registration.hasControls,
    hasToggle: registration.hasToggle,
  };
}

/**
 * Safe node type casting with validation
 */
export function safeNodeTypeCast(nodeType: string): string | null {
  return nodeRegistry.has(nodeType as any) ? nodeType : null;
}

/**
 * Validate node for inspector
 */
export function validateNodeForInspector(nodeType: string): {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
} {
  const isValid = nodeRegistry.has(nodeType as any);

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
 * Get node category mapping for theming system
 */
export function getNodeCategoryMapping(): Record<string, any> {
  const mapping: Record<string, any> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    mapping[nodeType] = registration.category;
  }

  return mapping;
}

/**
 * Check if a node type is valid
 */
export function isValidNodeType(nodeType: string): boolean {
  return nodeRegistry.has(nodeType as any);
}

/**
 * Get category metadata
 */
export function getCategoryMetadata(category: string): any {
  return categoryRegistry.get(category as any);
}

/**
 * Apply category hooks (placeholder for theming compatibility)
 */
export function applyCategoryHooks(category: string, theme: any): void {
  // Placeholder implementation for theming system compatibility
  console.log(`Applying category hooks for ${category}`, theme);
}

/**
 * Get category theme (placeholder for theming compatibility)
 */
export function getCategoryTheme(category: string): any {
  return categoryRegistry.get(category as any);
}

/**
 * Legacy CATEGORY_REGISTRY for backward compatibility
 */
export const CATEGORY_REGISTRY = {
  get: (category: string) => categoryRegistry.get(category as any),
  has: (category: string) => categoryRegistry.has(category as any),
  keys: () => Array.from(categoryRegistry.keys()),
  values: () => Array.from(categoryRegistry.values()),
  entries: () => Array.from(categoryRegistry.entries()),
  size: () => categoryRegistry.size(),
};

// ============================================================================
// INSPECTOR FUNCTIONS FOR FACTORY SYSTEM
// ============================================================================

/**
 * Get node inspector controls
 */
export function getNodeInspectorControls(nodeType: string): any {
  return inspectorRegistry.get(nodeType as any);
}

/**
 * Check if factory has inspector controls
 */
export function hasFactoryInspectorControls(nodeType: string): boolean {
  return inspectorRegistry.hasInspectorControls(nodeType as any);
}

/**
 * Register node type config (placeholder for factory compatibility)
 */
export function registerNodeTypeConfig(config: any): void {
  console.log("registerNodeTypeConfig called with:", config);
  // Implementation depends on the specific factory requirements
}

/**
 * Register node inspector controls (alias for existing function)
 */
export function registerNodeInspectorControls(registration: any): void {
  registerInspectorControls(registration);
}

/**
 * Generate inspector control mapping
 */
export function generateInspectorControlMapping(): any {
  const mapping: Record<string, any> = {};

  // Simple control configurations for known node types
  const controlConfigs = {
    createText: { type: "legacy", legacyControlType: "TextNodeControl" },
    viewOutput: { type: "none" },
    triggerOnToggle: {
      type: "legacy",
      legacyControlType: "TriggerOnToggleControl",
    },
    testError: { type: "legacy", legacyControlType: "TextNodeControl" },
  };

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    const config = controlConfigs[nodeType as keyof typeof controlConfigs];

    mapping[nodeType] = {
      nodeType: registration.nodeType,
      displayName: registration.displayName,
      renderControls: registration.renderControls,
      hasControls: registration.hasControls,
      type: config?.type || "legacy",
      legacyControlType:
        config && "legacyControlType" in config
          ? config.legacyControlType
          : undefined,
    };
  }

  return mapping;
}

// ============================================================================
// TYPE DEFINITIONS FOR BACKWARD COMPATIBILITY
// ============================================================================

/**
 * Enhanced node registration type for backward compatibility
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
 * Get enhanced node registration
 */
export function getEnhancedNodeRegistration(
  nodeType: string
): EnhancedNodeRegistration | null {
  const registration = nodeRegistry.get(nodeType as any);
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

// ============================================================================
// LEGACY INSPECTOR REGISTRY EXPORTS
// ============================================================================

/**
 * Legacy NODE_INSPECTOR_REGISTRY for backward compatibility
 */
export const NODE_INSPECTOR_REGISTRY = getLegacyInspectorRegistry();

/**
 * Get node handles (existing function)
 */
export function getNodeHandles(nodeType: string): any[] {
  const registration = nodeRegistry.get(nodeType as any);
  return registration?.handles || [];
}

/**
 * DATA TYPE NORMALIZATION - For Ultimate Handle System Integration
 */
const HANDLE_DATATYPE_MAPPING: Record<string, string> = {
  // Primitive types
  boolean: "b",
  string: "s",
  number: "n",
  bigint: "N",
  undefined: "u",
  null: "∅",
  symbol: "S",

  // Complex types
  object: "o",
  array: "a",
  json: "j",
  map: "m",
  set: "st",
  tuple: "t",

  // Special types
  date: "d",
  regexp: "r",
  error: "e",
  weakmap: "w",
  weakset: "ws",

  // Functional types
  function: "fn",
  asyncfunction: "af",
  generatorfunction: "gf",
  promise: "p",

  // Typed arrays
  typedarray: "ta",
  arraybuffer: "ab",

  // Meta types
  any: "x",
  void: "v",
  never: "nv",
  unknown: "uk",

  // Flow control
  trigger: "tr",
  signal: "sg",
  event: "ev",

  // Custom/Extended types for compatibility
  image: "o", // Treat images as objects for now
};

/**
 * Normalize data type from JSON registry format to Ultimate handle system format
 */
export function normalizeHandleDataType(dataType: string): string {
  if (!dataType) return "x"; // Default to "any"

  const normalized = dataType.toLowerCase().trim();
  return HANDLE_DATATYPE_MAPPING[normalized] || dataType;
}

/**
 * Get node handles with normalized data types for Ultimate handle system
 */
export function getNodeHandlesNormalized(nodeType: string): any[] {
  const handles = getNodeHandles(nodeType);

  return handles.map((handle) => ({
    ...handle,
    dataType: normalizeHandleDataType(handle.dataType),
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
  return (
    handles.find((h) => h.id === handleId && h.type === handleType) || null
  );
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
 * Missing function placeholders for backward compatibility
 */
export function validateCategoryConnection(
  source: string,
  target: string
): boolean {
  // Placeholder implementation
  return true;
}

export interface CategoryMetadata {
  displayName: string;
  description: string;
  icon: string;
  color: string;
  order: number;
  folder: string;
  isEnabled: boolean;
}

// ============================================================================
// LEGACY API COMPATIBILITY LAYER
// ============================================================================

/**
 * Legacy MODERN_NODE_REGISTRY replacement
 * Returns the same API but backed by YAML-generated registries
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
      size: registration.size,
      defaultData: registration.defaultData,
      hasTargetPosition: registration.hasTargetPosition,
      targetPosition: registration.targetPosition,
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
 * Legacy FACTORY_INSPECTOR_REGISTRY replacement
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

// ============================================================================
// MIGRATION AND VALIDATION
// ============================================================================

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

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Export registry instances for external access
export { categoryRegistry } from "./category";
export {
  getCategoryByKey,
  getNodeByType,
  getNodesByCategory,
} from "./generated";
export { inspectorRegistry } from "./inspector";
export { nodeRegistry } from "./node";

// Initialize when module loads (async)
let isInitialized = false;
export const initializationPromise = initializeUnifiedRegistry()
  .then(() => {
    isInitialized = true;
  })
  .catch((error) => {
    console.error("Failed to initialize unified registry:", error);
  });

// Helper to ensure registry is ready
export async function ensureRegistryReady(): Promise<void> {
  if (!isInitialized) {
    await initializationPromise;
  }
}
