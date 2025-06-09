/**
 * NODE TYPES CONSTANTS - Node type definitions and validation
 *
 * • Centralized node type constants and validation
 * • Provides type-safe node type definitions
 * • Includes error injection support configuration
 * • Features comprehensive node type validation
 *
 * Keywords: node-types, constants, validation, type-safety
 */

// ============================================================================
// NODE TYPE CONSTANTS
// ============================================================================

/**
 * Supported node types in the factory system
 */
export const NODE_TYPES = {
  // Core node types
  TEXT: "text",
  LOGIC: "logic",
  TRIGGER: "trigger",
  UNIVERSAL: "universal",

  // Advanced node types
  CODE_EDITOR: "code-editor",
  LARGE_DATASET: "large-dataset",
  COMPLEX_VISUALIZATION: "complex-visualization",

  // Processing node types
  JSON_PROCESSOR: "json-processor",
  DATA_TRANSFORMER: "data-transformer",

  // UI node types
  BUTTON: "button",
  INPUT: "input",
  OUTPUT: "output",

  // System node types
  ERROR_GENERATOR: "error-generator",
  DEBUG: "debug",
  MONITOR: "monitor",
} as const;

/**
 * Node types that support error injection for testing
 */
export const ERROR_INJECTION_SUPPORTED_NODES = [
  NODE_TYPES.TEXT,
  NODE_TYPES.LOGIC,
  NODE_TYPES.TRIGGER,
  NODE_TYPES.UNIVERSAL,
  NODE_TYPES.CODE_EDITOR,
  NODE_TYPES.JSON_PROCESSOR,
  NODE_TYPES.DATA_TRANSFORMER,
  NODE_TYPES.BUTTON,
  NODE_TYPES.INPUT,
  NODE_TYPES.OUTPUT,
] as const;

/**
 * Heavy nodes that require idle-time hydration
 */
export const HEAVY_NODES = [
  NODE_TYPES.CODE_EDITOR,
  NODE_TYPES.LARGE_DATASET,
  NODE_TYPES.COMPLEX_VISUALIZATION,
] as const;

/**
 * High-frequency nodes that benefit from GPU acceleration
 */
export const HIGH_FREQUENCY_NODES = [
  NODE_TYPES.LOGIC,
  NODE_TYPES.TRIGGER,
  NODE_TYPES.JSON_PROCESSOR,
  NODE_TYPES.DATA_TRANSFORMER,
] as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];
export type ErrorInjectionSupportedNode =
  (typeof ERROR_INJECTION_SUPPORTED_NODES)[number];
export type HeavyNode = (typeof HEAVY_NODES)[number];
export type HighFrequencyNode = (typeof HIGH_FREQUENCY_NODES)[number];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Check if a node type is valid
 * @param nodeType - The node type to validate
 * @returns True if the node type is valid
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return Object.values(NODE_TYPES).includes(nodeType as NodeType);
}

/**
 * Check if a node type supports error injection
 * @param nodeType - The node type to check
 * @returns True if the node type supports error injection
 */
export function supportsErrorInjection(
  nodeType: string
): nodeType is ErrorInjectionSupportedNode {
  return ERROR_INJECTION_SUPPORTED_NODES.includes(
    nodeType as ErrorInjectionSupportedNode
  );
}

/**
 * Check if a node type is considered heavy
 * @param nodeType - The node type to check
 * @returns True if the node type is heavy
 */
export function isHeavyNode(nodeType: string): nodeType is HeavyNode {
  return HEAVY_NODES.includes(nodeType as HeavyNode);
}

/**
 * Check if a node type is high-frequency
 * @param nodeType - The node type to check
 * @returns True if the node type is high-frequency
 */
export function isHighFrequencyNode(
  nodeType: string
): nodeType is HighFrequencyNode {
  return HIGH_FREQUENCY_NODES.includes(nodeType as HighFrequencyNode);
}
