/**
 * INTEGRATED NODE FACTORY - Modern node creation with JSON registry integration
 *
 * • Creates nodes using JSON registry data through the adapter
 * • Implements factory pattern for consistent node instantiation
 * • Supports ICON (60x60) and EXPANDED (120x120) state management
 * • Provides type-safe node creation with validation systems
 * • Integrates seamlessly with JSON registry and factory systems
 *
 * Keywords: node-factory, json-registry, toggle-states, sizing, type-safety, integrated
 */

import { JsonNodeFactory } from "../adapters/jsonRegistryAdapter";
import type { AgenNode } from "../types";

// ============================================================================
// INTEGRATED NODE CREATION FACTORY
// ============================================================================

/**
 * Creates a new node using the integrated JSON registry + factory system
 * Follows toggle button pattern: {showUI ? '⦿' : '⦾'}
 * ICON state: 60x60px (120x60px for text nodes)
 * EXPANDED state: 120x120px
 */
export function createNode(
  type: string,
  position: { x: number; y: number },
  customData?: Record<string, unknown>
): AgenNode | null {
  return JsonNodeFactory.createNode(
    type,
    position,
    customData
  ) as AgenNode | null;
}

/**
 * Validates if a node type is supported by the integrated system
 */
export function isValidNodeType(type: string): boolean {
  return JsonNodeFactory.isValidNodeType(type);
}

/**
 * Gets the default data configuration for a node type
 */
export function getNodeDefaultData(type: string): Record<string, any> {
  return JsonNodeFactory.getNodeDefaultData(type);
}

/**
 * Gets the configuration object for a node type
 */
export function getNodeConfig(type: string) {
  return JsonNodeFactory.getNodeConfig(type);
}

/**
 * Gets handle configuration for a node type
 */
export function getNodeHandles(type: string) {
  return JsonNodeFactory.getNodeHandles(type);
}

/**
 * Gets complete node metadata from JSON registry
 */
export function getNodeMetadata(type: string) {
  return JsonNodeFactory.getNodeMetadata(type);
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
  return JsonNodeFactory.copyNode(originalNode, offset) as AgenNode;
}

/**
 * Toggles the UI state of a node between ICON and EXPANDED
 * Updates showUI property and returns new node data
 */
export function toggleNodeUI(node: AgenNode): AgenNode {
  return JsonNodeFactory.toggleNodeUI(node) as AgenNode;
}

// ============================================================================
// NODE SIZE UTILITIES
// ============================================================================

/**
 * Gets the appropriate size for a node based on its type and state
 * Returns { width, height } based on ICON/EXPANDED state
 */
export function getNodeSize(type: string, showUI: boolean = false) {
  const config = getNodeConfig(type);

  if (!config) {
    // Default sizes if config not found
    return showUI ? { width: 120, height: 120 } : { width: 60, height: 60 };
  }

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
// INTEGRATED FACTORY EXPORT
// ============================================================================

export const IntegratedNodeFactory = {
  createNode,
  isValidNodeType,
  getNodeDefaultData,
  getNodeConfig,
  getNodeHandles,
  getNodeMetadata,
  copyNode,
  toggleNodeUI,
  getNodeSize,
} as const;
