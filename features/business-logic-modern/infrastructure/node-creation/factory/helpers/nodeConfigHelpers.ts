/**
 * NODE CONFIG HELPERS - Configuration utilities for factory nodes
 *
 * • Provides helper functions for node configuration and setup
 * • Implements configuration validation and normalization utilities
 * • Supports default configuration generation and merging
 * • Features configuration transformation and optimization helpers
 * • Integrates with factory systems for streamlined node creation
 *
 * Keywords: node-config, helpers, validation, normalization, defaults, transformation, factory
 */

// ============================================================================
// NODE CONFIG HELPERS
// ============================================================================

import { Position } from "@xyflow/react";
import { DEFAULT_LOGIC_NODE_SIZE, DEFAULT_TEXT_NODE_SIZE } from "../constants";
import type { BaseNodeData, HandleConfig, NodeFactoryConfig } from "../types";

// ============================================================================
// CONFIG CREATION HELPERS
// ============================================================================

/**
 * CREATE TEXT NODE CONFIG
 * Helper for creating text-based node configurations with proper handles
 */
export const createTextNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_TEXT_NODE_SIZE,
  handles: [
    // Optional trigger input for conditional output
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    // String output for text content
    { id: "output", dataType: "s", position: Position.Right, type: "source" },
  ],
  ...overrides,
});

/**
 * CREATE SIMPLE TEXT NODE CONFIG
 * For text nodes that only output text without triggers
 */
export const createSimpleTextNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_TEXT_NODE_SIZE,
  handles: [
    // Only string output - no trigger needed
    { id: "output", dataType: "s", position: Position.Right, type: "source" },
  ],
  ...overrides,
});

/**
 * CREATE LOGIC NODE CONFIG
 * Helper for creating logic/processing node configurations
 */
export const createLogicNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_LOGIC_NODE_SIZE,
  handles: [
    { id: "input", dataType: "x", position: Position.Left, type: "target" },
    { id: "output", dataType: "x", position: Position.Right, type: "source" },
  ],
  ...overrides,
});

/**
 * CREATE VIEW NODE CONFIG
 * Helper for view/output nodes that display data
 */
export const createViewNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: {
    collapsed: { width: "w-[120px]", height: "h-[120px]" },
    expanded: { width: "w-[180px]" },
  },
  handles: [
    // Accept any data type for viewing
    { id: "input", dataType: "x", position: Position.Left, type: "target" },
  ],
  ...overrides,
});

/**
 * CREATE UNIVERSAL NODE CONFIG
 * Helper for nodes that can handle any data type
 */
export const createUniversalNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_LOGIC_NODE_SIZE,
  handles: [
    { id: "input", dataType: "x", position: Position.Left, type: "target" },
    { id: "output", dataType: "x", position: Position.Right, type: "source" },
  ],
  ...overrides,
});

/**
 * CREATE TRIGGERED NODE CONFIG
 * Helper for nodes that respond to boolean triggers
 */
export const createTriggeredNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_LOGIC_NODE_SIZE,
  handles: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "data", dataType: "x", position: Position.Left, type: "target" },
    { id: "output", dataType: "x", position: Position.Right, type: "source" },
  ],
  ...overrides,
});

// ============================================================================
// HANDLE UTILITY FUNCTIONS
// ============================================================================

/**
 * ADD TRIGGER SUPPORT
 * Add trigger handle to existing handle configuration
 */
export const addTriggerSupport = (handles: HandleConfig[]): HandleConfig[] => [
  { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
  ...handles,
];

/**
 * CREATE STRING INPUT OUTPUT HANDLES
 * Common pattern for string processing nodes
 */
export const createStringInputOutputHandles = (): HandleConfig[] => [
  { id: "input", dataType: "s", position: Position.Left, type: "target" },
  { id: "output", dataType: "s", position: Position.Right, type: "source" },
];

/**
 * CREATE MULTI-INPUT HANDLES
 * For nodes that accept multiple inputs
 */
export const createMultiInputHandles = (
  inputCount: number = 2
): HandleConfig[] => {
  const handles: HandleConfig[] = [];

  // Create multiple input handles
  for (let i = 0; i < inputCount; i++) {
    handles.push({
      id: `input${i + 1}`,
      dataType: "s", // Default to string, can be overridden
      position: Position.Left,
      type: "target",
    });
  }

  // Add single output
  handles.push({
    id: "output",
    dataType: "s",
    position: Position.Right,
    type: "source",
  });

  return handles;
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * VALIDATE HANDLE CONFIGURATION
 * Ensure handle configuration is valid
 */
export const validateHandleConfig = (handles: HandleConfig[]): boolean => {
  if (!Array.isArray(handles)) return false;

  return handles.every((handle) => {
    return (
      typeof handle.id === "string" &&
      typeof handle.dataType === "string" &&
      typeof handle.position === "string" &&
      (handle.type === "source" || handle.type === "target")
    );
  });
};

/**
 * SHOULD NODE BE ACTIVE
 * Helper to determine if a node should be active based on trigger logic
 */
export const shouldNodeBeActive = (
  connections: any[],
  nodesData: any[],
  defaultActive: boolean = true
): boolean => {
  // Filter for trigger connections
  const triggerConnections = connections.filter(
    (c) => c.targetHandle === "trigger"
  );

  // If no trigger connections, use default state
  if (triggerConnections.length === 0) {
    return defaultActive;
  }

  // Get trigger value from connected nodes
  const triggerValue = nodesData.find((node) => node?.data)?.data;

  // Convert to boolean (truthy values activate the node)
  return Boolean(triggerValue);
};

/**
 * WITH TRIGGER SUPPORT
 * Higher-order function to add trigger support to existing config
 */
export const withTriggerSupport = <T extends BaseNodeData>(
  config: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  ...config,
  handles: config.handles
    ? addTriggerSupport(config.handles)
    : [
        {
          id: "trigger",
          dataType: "b",
          position: Position.Left,
          type: "target",
        },
      ],
});
