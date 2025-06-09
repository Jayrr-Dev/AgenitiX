/**
 * INTEGRATED NODE FACTORY - Modern node creation with JSON registry integration
 *
 * • Creates nodes using JSON registry data through the adapter
 * • Implements factory pattern for consistent node instantiation
 * • Supports ICON (60x60) and EXPANDED (120x120) state management
 * • Provides type-safe node creation with validation systems
 * • Integrates seamlessly with JSON registry and factory systems
 * • Falls back to basic nodeFactory utilities when needed
 *
 * Keywords: node-factory, json-registry, toggle-states, sizing, type-safety, integrated
 */

import { JsonNodeFactory } from "../../adapters/jsonRegistryAdapter";
import type { AgenNode } from "../../types";

// Import basic factory utilities for fallback functionality
import { NodeFactory as BasicNodeFactory } from "../creation/nodeFactory";

// ============================================================================
// INTEGRATED NODE CREATION FACTORY
// ============================================================================

/**
 * Creates a new node using the integrated JSON registry + factory system
 * Falls back to basic factory if JSON registry is not available
 * Follows toggle button pattern: {showUI ? '⦿' : '⦾'}
 * ICON state: 60x60px (120x60px for text nodes)
 * EXPANDED state: 120x120px
 */
export function createNode(
  type: string,
  position: { x: number; y: number },
  customData?: Record<string, unknown>
): AgenNode | null {
  try {
    // Try JSON registry first
    const jsonNode = JsonNodeFactory.createNode(type, position, customData);
    if (jsonNode) {
      return jsonNode as AgenNode;
    }
  } catch (error) {
    console.warn(
      `JSON registry failed for ${type}, using basic factory:`,
      error
    );
  }

  // Fallback to basic factory
  try {
    return BasicNodeFactory.createNode(type as any, position, customData);
  } catch (error) {
    console.error(`Both factories failed for ${type}:`, error);
    return null;
  }
}

/**
 * Validates if a node type is supported by either system
 */
export function isValidNodeType(type: string): boolean {
  return (
    JsonNodeFactory.isValidNodeType(type) ||
    BasicNodeFactory.isValidNodeType(type)
  );
}

/**
 * Gets the default data configuration for a node type
 * Prefers JSON registry, falls back to basic factory
 */
export function getNodeDefaultData(type: string): Record<string, any> {
  try {
    const jsonData = JsonNodeFactory.getNodeDefaultData(type);
    if (jsonData && Object.keys(jsonData).length > 0) {
      return jsonData;
    }
  } catch (error) {
    console.warn(
      `JSON registry default data failed for ${type}, using basic factory`
    );
  }

  // Fallback to basic factory
  try {
    return BasicNodeFactory.getNodeDefaultData(type as any);
  } catch (error) {
    console.warn(`Basic factory default data failed for ${type}:`, error);
    return {};
  }
}

/**
 * Gets the configuration object for a node type
 * Enhanced with both JSON registry and basic factory data
 */
export function getNodeConfig(type: string) {
  const jsonConfig = JsonNodeFactory.getNodeConfig(type);
  const basicConfig = BasicNodeFactory.getNodeConfig(type as any);

  // Merge configurations, preferring JSON registry
  return {
    ...basicConfig,
    ...jsonConfig,
  };
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
// NODE MANIPULATION UTILITIES - Enhanced with fallbacks
// ============================================================================

/**
 * Creates a copy of a node with new ID and offset position
 * Uses enhanced logic from both systems
 */
export function copyNode(
  originalNode: AgenNode,
  offset: { x: number; y: number } = { x: 40, y: 40 }
): AgenNode {
  try {
    // Try JSON factory first
    const jsonCopy = JsonNodeFactory.copyNode(originalNode, offset);
    if (jsonCopy) {
      return jsonCopy as AgenNode;
    }
  } catch (error) {
    console.warn("JSON factory copy failed, using basic factory:", error);
  }

  // Fallback to basic factory
  return BasicNodeFactory.copyNode(originalNode, offset);
}

/**
 * Toggles the UI state of a node between ICON and EXPANDED
 * Uses enhanced toggle logic with fallback
 */
export function toggleNodeUI(node: AgenNode): AgenNode {
  try {
    // Try JSON factory first
    const jsonToggled = JsonNodeFactory.toggleNodeUI(node);
    if (jsonToggled) {
      return jsonToggled as AgenNode;
    }
  } catch (error) {
    console.warn("JSON factory toggle failed, using basic factory:", error);
  }

  // Fallback to basic factory
  return BasicNodeFactory.toggleNodeUI(node);
}

// ============================================================================
// NODE SIZE UTILITIES - Enhanced with both systems
// ============================================================================

/**
 * Gets the appropriate size for a node based on its type and state
 * Combines JSON registry data with basic factory sizing logic
 */
export function getNodeSize(type: string, showUI: boolean = false) {
  // Try to get enhanced config from JSON registry
  const config = getNodeConfig(type);

  if (!config) {
    // Fallback to basic factory sizing
    return BasicNodeFactory.getNodeSize(type as any, showUI);
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
