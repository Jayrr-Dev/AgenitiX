/**
 * NODE INSPECTOR ADAPTER - Simplified facade for Plop system integration
 *
 * • Provides clean interface between Node Inspector and Plop system
 * • Reduces import churn by centralizing node system interactions
 * • Handles NodeSpec metadata retrieval and validation
 * • Manages node data updates with basic validation
 * • Focuses on core functionality without complex schema parsing
 *
 * Keywords: adapter-pattern, facade, plop-integration, simplified, core-functionality
 */

import type { AgenNode, NodeType } from "../../flow-engine/types/nodeData";
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

/**
 * Node update result
 */
export interface NodeUpdateResult {
  success: boolean;
  errors: string[];
  validatedData?: Record<string, unknown>;
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

/**
 * Simplified adapter for node inspector operations
 * Provides a clean facade over the Plop system
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
   * Update node data with basic validation
   */
  updateNodeData(
    node: AgenNode,
    updates: Record<string, unknown>
  ): NodeUpdateResult {
    try {
      // Basic validation - check if node type is valid
      const nodeInfo = this.getNodeInfo(node.type as NodeType);
      if (!nodeInfo) {
        return {
          success: false,
          errors: [`Unknown node type: ${node.type}`],
        };
      }

      // For now, allow all updates - schema validation can be added later
      return {
        success: true,
        errors: [],
        validatedData: updates,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Update error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  /**
   * Get node configuration errors
   */
  getNodeErrors(node: AgenNode): string[] {
    const errors: string[] = [];

    try {
      // Check if node type is valid
      const nodeInfo = this.getNodeInfo(node.type as NodeType);
      if (!nodeInfo) {
        errors.push(`Invalid node type: ${node.type}`);
        return errors;
      }

      // Add validation warnings as errors
      errors.push(...nodeInfo.warnings);

      // Basic data validation
      if (!node.data) {
        errors.push("Node data is missing");
      }
    } catch (error) {
      errors.push(
        `Configuration error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return errors;
  }

  /**
   * Check if a node type has custom controls
   */
  hasCustomControls(nodeType: NodeType): boolean {
    return this.determineHasControls(nodeType);
  }

  /**
   * Get current node data with any defaults applied
   */
  getNodeDataWithDefaults(node: AgenNode): Record<string, unknown> {
    // For now, just return the node data as-is
    // This can be enhanced with schema-based defaults later
    return node.data || {};
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Determine if a node type has custom controls available
   */
  private determineHasControls(nodeType: NodeType): boolean {
    // For now, assume all CREATE nodes have controls
    // This can be enhanced with schema analysis later
    const nodeInfo = this.getNodeInfo(nodeType);
    return nodeInfo?.category === "create" || nodeInfo?.category === "trigger";
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
