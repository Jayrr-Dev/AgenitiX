/**
 * NODE FACTORY UTILITY - Modern node creation and management system
 *
 * • Creates nodes with toggle states and proper sizing configurations
 * • Implements factory pattern for consistent node instantiation
 * • Supports ICON (60x60) and EXPANDED (120x120) state management
 * • Provides type-safe node creation with validation systems
 * • Integrates with modern business logic architecture patterns
 *
 * Keywords: node-factory, toggle-states, sizing, type-safety, modern-architecture
 */

import { NODE_ID_PREFIX, getNodeTypeConfig } from "../constants";
import type { AgenNode, NodeData, NodeType } from "../types";

// ============================================================================
// NODE CREATION FACTORY
// ============================================================================

/**
 * Creates a new node with proper default data and configuration
 * Follows toggle button pattern: {showUI ? '⦿' : '⦾'}
 * ICON state: 60x60px (120x60px for text nodes)
 * EXPANDED state: 120x120px
 */
export function createNode(
  type: NodeType,
  position: { x: number; y: number },
  customData?: Record<string, unknown>
): AgenNode {
  const config = getNodeTypeConfig()[type];
  const id = `${NODE_ID_PREFIX}${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  // MERGE DEFAULT DATA WITH CUSTOM DATA
  const nodeData: NodeData = {
    ...config.defaultData,
    ...customData,
    // Ensure toggle state is always defined
    showUI: Boolean(customData?.showUI) ?? false,
  };

  // BASE NODE STRUCTURE
  const baseNode: AgenNode = {
    id,
    type,
    position,
    deletable: true,
    data: nodeData,
  };

  // ADD TARGET POSITION FOR OUTPUT NODES
  if (config.hasTargetPosition && config.targetPosition) {
    baseNode.targetPosition = config.targetPosition;
  }

  return baseNode;
}

// ============================================================================
// NODE VALIDATION UTILITIES
// ============================================================================

/**
 * Validates if a node type is supported by the factory
 */
export function isValidNodeType(type: string): type is NodeType {
  return type in getNodeTypeConfig();
}

/**
 * Gets the default data configuration for a node type
 */
export function getNodeDefaultData(type: NodeType): NodeData {
  return { ...getNodeTypeConfig()[type].defaultData };
}

/**
 * Gets the configuration object for a node type
 */
export function getNodeConfig(type: NodeType) {
  return getNodeTypeConfig()[type];
}

// ============================================================================
// NODE MANIPULATION UTILITIES
// ============================================================================

/**
 * Creates a copy of a node with new ID and offset position
 * Maintains toggle state and all data properties
 */
export function copyNode(
  originalNode: AgenNode,
  offset: { x: number; y: number } = { x: 40, y: 40 }
): AgenNode {
  const timestamp = Date.now();
  const randomId = Math.floor(Math.random() * 10000);
  const newId = `${originalNode.id}-copy-${timestamp}-${randomId}`;

  return {
    ...originalNode,
    id: newId,
    position: {
      x: originalNode.position.x + offset.x,
      y: originalNode.position.y + offset.y,
    },
    selected: false,
    data: {
      ...originalNode.data,
      // Reset any temporary state
      selected: false,
    },
  };
}

/**
 * Toggles the UI state of a node between ICON and EXPANDED
 * Updates showUI property and returns new node data
 */
export function toggleNodeUI(node: AgenNode): AgenNode {
  return {
    ...node,
    data: {
      ...node.data,
      showUI: !node.data.showUI,
    },
  };
}

// ============================================================================
// NODE SIZE UTILITIES
// ============================================================================

/**
 * Gets the appropriate size for a node based on its type and state
 * Returns { width, height } based on ICON/EXPANDED state
 */
export function getNodeSize(type: NodeType, showUI: boolean = false) {
  const config = getNodeTypeConfig()[type];

  if (showUI) {
    // EXPANDED state: 120x120px
    return { width: 120, height: 120 };
  }

  // ICON state: Use configured size or defaults
  return {
    width: config.width || 60,
    height: config.height || 60,
  };
}

// ============================================================================
// FACTORY EXPORT
// ============================================================================

export const NodeFactory = {
  createNode,
  isValidNodeType,
  getNodeDefaultData,
  getNodeConfig,
  copyNode,
  toggleNodeUI,
  getNodeSize,
} as const;
