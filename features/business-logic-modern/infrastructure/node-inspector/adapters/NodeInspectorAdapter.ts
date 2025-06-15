/**
 * NODE INSPECTOR ADAPTER - Simplified facade for node registry integration
 *
 * • Provides clean interface between Node Inspector and node registry
 * • Reduces import churn by centralizing node system interactions
 * • Handles NodeSpec metadata retrieval and validation
 * • Focuses on core adapter functionality
 *
 * Keywords: adapter-pattern, facade, registry-integration, simplified
 */

import type { NodeType } from "../../flow-engine/types/nodeData";
import {
  getNodeMetadata,
  validateNode,
} from "../../node-registry/nodespec-registry";

// ============================================================================
// ADAPTER TYPES
// ============================================================================

/**
 * Simplified node metadata for inspector use
 */
export interface InspectorNodeInfo {
  displayName: string;
  category: string;
  icon?: string;
  description?: string;
  isValid: boolean;
  warnings: string[];
  hasControls: boolean;
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

/**
 * Simplified adapter for node inspector operations
 * Provides a clean facade over the node registry system
 */
class NodeInspectorAdapterImpl {
  /**
   * Get node information for the inspector
   */
  getNodeInfo(nodeType: NodeType): InspectorNodeInfo | null {
    try {
      // Get metadata from registry
      const metadata = getNodeMetadata(nodeType);
      if (!metadata) {
        return null;
      }

      // Validate the node type
      const validation = validateNode(nodeType);

      return {
        displayName: metadata.displayName,
        category: metadata.category,
        icon: metadata.icon,
        description: metadata.description,
        isValid: validation.isValid,
        warnings: validation.warnings || [],
        hasControls: this.determineHasControls(nodeType),
      };
    } catch (error) {
      console.error(
        `[NodeInspectorAdapter] Failed to get info for ${nodeType}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a node type has custom controls
   */
  hasCustomControls(nodeType: NodeType): boolean {
    return this.determineHasControls(nodeType);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Determine if a node type has custom controls available
   */
  private determineHasControls(nodeType: NodeType): boolean {
    // Get metadata directly to avoid circular dependency
    const metadata = getNodeMetadata(nodeType);
    if (!metadata) {
      return false;
    }

    // For now, assume all CREATE and TRIGGER nodes have controls
    // This can be enhanced with schema analysis later
    return metadata.category === "CREATE" || metadata.category === "TRIGGER";
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance of the NodeInspectorAdapter
 * This reduces import churn and provides a consistent interface
 */
export const NodeInspectorAdapter = new NodeInspectorAdapterImpl();

/**
 * Type export for dependency injection or testing
 */
export type NodeInspectorAdapterType = NodeInspectorAdapterImpl;
