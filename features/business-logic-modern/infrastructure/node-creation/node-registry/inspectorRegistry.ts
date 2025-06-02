/**
 * INSPECTOR REGISTRY - Node inspector configuration management system
 *
 * • Manages registration and configuration of node inspector controls
 * • Provides centralized registry for node type configurations
 * • Supports dynamic inspector control registration and retrieval
 * • Features type-safe configuration management for inspector panels
 * • Integrates with factory systems for seamless inspector functionality
 *
 * Keywords: inspector-registry, configuration-management, dynamic-registration, type-safety, inspector-panels, factory
 */

// ============================================================================
// INSPECTOR REGISTRY
// ============================================================================

import type { ReactNode } from "react";
import { NODE_TYPE_CONFIG } from "../../../flow-editor/constants";
import type { NodeTypeConfig } from "../../../flow-editor/types";
import type { BaseNodeData, InspectorControlProps } from "../factory/types";

// ============================================================================
// REGISTRY STORAGE
// ============================================================================

/**
 * NODE INSPECTOR REGISTRY
 * Global registry for factory-created node inspector controls
 */
export const NODE_INSPECTOR_REGISTRY = new Map<
  string,
  (props: InspectorControlProps<any>) => ReactNode
>();

// ============================================================================
// REGISTRATION FUNCTIONS
// ============================================================================

/**
 * REGISTER NODE INSPECTOR CONTROLS
 * Registers inspector controls for a specific node type
 */
export const registerNodeInspectorControls = <T extends BaseNodeData>(
  nodeType: string,
  renderControls: (props: InspectorControlProps<T>) => ReactNode
) => {
  NODE_INSPECTOR_REGISTRY.set(nodeType, renderControls);
};

/**
 * GET NODE INSPECTOR CONTROLS
 * Retrieves inspector controls for a node type
 */
export const getNodeInspectorControls = (nodeType: string) => {
  return NODE_INSPECTOR_REGISTRY.get(nodeType);
};

/**
 * HAS FACTORY INSPECTOR CONTROLS
 * Checks if a node type has factory-created inspector controls
 */
export const hasFactoryInspectorControls = (nodeType: string): boolean => {
  return NODE_INSPECTOR_REGISTRY.has(nodeType);
};

/**
 * REGISTER NODE TYPE CONFIG
 * Registers node configuration for inspector compatibility
 */
export const registerNodeTypeConfig = <T extends BaseNodeData>(
  nodeType: string,
  config: {
    defaultData: T;
    displayName: string;
    hasControls?: boolean;
    hasOutput?: boolean;
  }
) => {
  const nodeConfig: NodeTypeConfig = {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: config.hasControls ?? false,
    hasOutput: config.hasOutput ?? false,
  };

  // Dynamically add to NODE_TYPE_CONFIG
  (NODE_TYPE_CONFIG as any)[nodeType] = nodeConfig;
};

// ============================================================================
// REGISTRY UTILITIES
// ============================================================================

/**
 * GET ALL REGISTERED NODE TYPES
 * Returns all registered node types
 */
export const getAllRegisteredNodeTypes = (): string[] => {
  return Array.from(NODE_INSPECTOR_REGISTRY.keys());
};

/**
 * CLEAR REGISTRY
 * Clears all registered inspector controls (useful for testing)
 */
export const clearInspectorRegistry = (): void => {
  NODE_INSPECTOR_REGISTRY.clear();
};

/**
 * GET REGISTRY STATS
 * Returns registry statistics
 */
export const getRegistryStats = () => {
  return {
    totalRegistered: NODE_INSPECTOR_REGISTRY.size,
    nodeTypes: getAllRegisteredNodeTypes(),
  };
};

/**
 * REMOVE NODE TYPE
 * Removes a specific node type from the registry
 */
export const removeNodeType = (nodeType: string): boolean => {
  return NODE_INSPECTOR_REGISTRY.delete(nodeType);
};
