/**
 * NODE DEFAULTS - Default node configurations and settings
 *
 * • Provides default configurations for all node types
 * • Includes default handles, sizes, and processing settings
 * • Features type-safe default value definitions
 * • Supports configuration inheritance and overrides
 *
 * Keywords: defaults, configuration, node-settings, type-safe
 */

import { Position } from "@xyflow/react";
import type {
  BaseNodeData,
  HandleConfig,
  NodeFactoryConfig,
} from "../../types";
import { NODE_TYPES } from "../constants/nodeTypes";

// ============================================================================
// DEFAULT HANDLE CONFIGURATIONS
// ============================================================================

/**
 * Default input handle configuration
 */
export const DEFAULT_INPUT_HANDLE: HandleConfig = {
  id: "input",
  type: "target",
  position: Position.Left,
  dataType: "s",
};

/**
 * Default output handle configuration
 */
export const DEFAULT_OUTPUT_HANDLE: HandleConfig = {
  id: "output",
  type: "source",
  position: Position.Right,
  dataType: "s",
};

/**
 * Default JSON input handle configuration
 */
export const DEFAULT_JSON_INPUT_HANDLE: HandleConfig = {
  id: "json-input",
  type: "target",
  position: Position.Left,
  dataType: "{ }",
};

// ============================================================================
// DEFAULT NODE SIZES
// ============================================================================

/**
 * Default node dimensions following NodeSize interface
 */
export const DEFAULT_NODE_SIZE = {
  collapsed: {
    width: "w-[200px]" as const,
    height: "h-[100px]" as const,
  },
  expanded: {
    width: "w-[300px]" as const,
    height: "h-[200px]" as const,
  },
} as const;

/**
 * Size presets for different node types following NodeSize interface
 */
export const NODE_SIZE_PRESETS = {
  [NODE_TYPES.TEXT]: {
    collapsed: { width: "w-[200px]" as const, height: "h-[100px]" as const },
    expanded: { width: "w-[300px]" as const, height: "h-[200px]" as const },
  },
  [NODE_TYPES.LOGIC]: {
    collapsed: { width: "w-[180px]" as const, height: "h-[80px]" as const },
    expanded: { width: "w-[280px]" as const, height: "h-[150px]" as const },
  },
  [NODE_TYPES.TRIGGER]: {
    collapsed: { width: "w-[160px]" as const, height: "h-[60px]" as const },
    expanded: { width: "w-[240px]" as const, height: "h-[120px]" as const },
  },
  [NODE_TYPES.UNIVERSAL]: {
    collapsed: { width: "w-[220px]" as const, height: "h-[120px]" as const },
    expanded: { width: "w-[350px]" as const, height: "h-[250px]" as const },
  },
  [NODE_TYPES.CODE_EDITOR]: {
    collapsed: { width: "w-[400px]" as const, height: "h-[300px]" as const },
    expanded: { width: "w-[600px]" as const, height: "h-[500px]" as const },
  },
  [NODE_TYPES.LARGE_DATASET]: {
    collapsed: { width: "w-[350px]" as const, height: "h-[250px]" as const },
    expanded: { width: "w-[500px]" as const, height: "h-[400px]" as const },
  },
  [NODE_TYPES.COMPLEX_VISUALIZATION]: {
    collapsed: { width: "w-[500px]" as const, height: "h-[400px]" as const },
    expanded: { width: "w-[700px]" as const, height: "h-[600px]" as const },
  },
  [NODE_TYPES.BUTTON]: {
    collapsed: { width: "w-[120px]" as const, height: "h-[40px]" as const },
    expanded: { width: "w-[180px]" as const, height: "h-[80px]" as const },
  },
  [NODE_TYPES.INPUT]: {
    collapsed: { width: "w-[180px]" as const, height: "h-[60px]" as const },
    expanded: { width: "w-[250px]" as const, height: "h-[120px]" as const },
  },
  [NODE_TYPES.OUTPUT]: {
    collapsed: { width: "w-[180px]" as const, height: "h-[60px]" as const },
    expanded: { width: "w-[250px]" as const, height: "h-[120px]" as const },
  },
} as const;

// ============================================================================
// DEFAULT NODE CONFIGURATIONS
// ============================================================================

/**
 * Base default configuration for all nodes
 */
export const BASE_NODE_CONFIG: Partial<NodeFactoryConfig<BaseNodeData>> = {
  size: DEFAULT_NODE_SIZE,
  handles: [DEFAULT_INPUT_HANDLE, DEFAULT_OUTPUT_HANDLE],
};

/**
 * Default configuration for text nodes
 */
export const TEXT_NODE_DEFAULTS: Partial<NodeFactoryConfig<BaseNodeData>> = {
  ...BASE_NODE_CONFIG,
  nodeType: NODE_TYPES.TEXT,
  displayName: "Text Node",
  size: NODE_SIZE_PRESETS[NODE_TYPES.TEXT],
  handles: [
    DEFAULT_JSON_INPUT_HANDLE,
    DEFAULT_INPUT_HANDLE,
    DEFAULT_OUTPUT_HANDLE,
  ],
};

/**
 * Default configuration for logic nodes
 */
export const LOGIC_NODE_DEFAULTS: Partial<NodeFactoryConfig<BaseNodeData>> = {
  ...BASE_NODE_CONFIG,
  nodeType: NODE_TYPES.LOGIC,
  displayName: "Logic Node",
  size: NODE_SIZE_PRESETS[NODE_TYPES.LOGIC],
  handles: [
    { ...DEFAULT_INPUT_HANDLE, id: "condition" },
    { ...DEFAULT_INPUT_HANDLE, id: "true-input" },
    { ...DEFAULT_INPUT_HANDLE, id: "false-input" },
    DEFAULT_OUTPUT_HANDLE,
  ],
};

/**
 * Default configuration for trigger nodes
 */
export const TRIGGER_NODE_DEFAULTS: Partial<NodeFactoryConfig<BaseNodeData>> = {
  ...BASE_NODE_CONFIG,
  nodeType: NODE_TYPES.TRIGGER,
  displayName: "Trigger Node",
  size: NODE_SIZE_PRESETS[NODE_TYPES.TRIGGER],
  handles: [DEFAULT_OUTPUT_HANDLE],
};

/**
 * Default configuration for universal nodes
 */
export const UNIVERSAL_NODE_DEFAULTS: Partial<NodeFactoryConfig<BaseNodeData>> =
  {
    ...BASE_NODE_CONFIG,
    nodeType: NODE_TYPES.UNIVERSAL,
    displayName: "Universal Node",
    size: NODE_SIZE_PRESETS[NODE_TYPES.UNIVERSAL],
    handles: [
      DEFAULT_JSON_INPUT_HANDLE,
      DEFAULT_INPUT_HANDLE,
      { ...DEFAULT_OUTPUT_HANDLE, id: "primary-output" },
      { ...DEFAULT_OUTPUT_HANDLE, id: "secondary-output" },
    ],
  };

// ============================================================================
// DEFAULT CONFIGURATION GETTER
// ============================================================================

/**
 * Get default configuration for a specific node type
 * @param nodeType - The node type to get defaults for
 * @returns Default configuration for the node type
 */
export function getNodeDefaults(
  nodeType: string
): Partial<NodeFactoryConfig<BaseNodeData>> {
  switch (nodeType) {
    case NODE_TYPES.TEXT:
      return TEXT_NODE_DEFAULTS;
    case NODE_TYPES.LOGIC:
      return LOGIC_NODE_DEFAULTS;
    case NODE_TYPES.TRIGGER:
      return TRIGGER_NODE_DEFAULTS;
    case NODE_TYPES.UNIVERSAL:
      return UNIVERSAL_NODE_DEFAULTS;
    default:
      return BASE_NODE_CONFIG;
  }
}

/**
 * Merge user configuration with defaults
 * @param userConfig - User-provided configuration
 * @param nodeType - The node type
 * @returns Merged configuration with defaults applied
 */
export function mergeWithDefaults<T extends BaseNodeData>(
  userConfig: Partial<NodeFactoryConfig<T>>,
  nodeType: string
): NodeFactoryConfig<T> {
  const defaults = getNodeDefaults(nodeType);

  return {
    ...defaults,
    ...userConfig,
    nodeType,
    handles: userConfig.handles || defaults.handles || [],
    size: userConfig.size || defaults.size || DEFAULT_NODE_SIZE,
  } as NodeFactoryConfig<T>;
}
