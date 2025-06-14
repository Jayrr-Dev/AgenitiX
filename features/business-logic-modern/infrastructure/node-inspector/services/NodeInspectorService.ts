/**
 * NODE INSPECTOR SERVICE - Facade for NodeSpec system integration
 *
 * • Provides clean interface between Node Inspector and NodeSpec registry
 * • Reduces import churn by centralizing NodeSpec interactions
 * • Aligns with modern Plop-based node creation system
 * • Uses NodeSpec as single source of truth
 * • Supports dynamic control generation from Zod schemas
 *
 * Keywords: nodespec-integration, service-layer, plop-aligned, single-source-truth
 */

import type { AgenNode, NodeType } from "../../flow-engine/types/nodeData";
import {
  getNodeSpecMetadata,
  validateNode,
  type NodeSpecMetadata,
} from "../../node-registry/nodespec-registry";

// ============================================================================
// SERVICE INTERFACE TYPES
// ============================================================================

/**
 * Enhanced node metadata for inspector use (based on NodeSpec)
 */
export interface InspectorNodeMetadata extends NodeSpecMetadata {
  isValid: boolean;
  validationErrors: string[];
  hasCustomControls: boolean;
}

/**
 * Node data update result
 */
export interface NodeUpdateResult {
  success: boolean;
  errors: string[];
  validatedData?: Record<string, unknown>;
}

/**
 * Control field definition for dynamic rendering
 */
export interface ControlField {
  key: string;
  type: "text" | "number" | "boolean" | "select" | "textarea" | "url" | "color";
  label: string;
  defaultValue: unknown;
  required: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: Array<{ value: unknown; label: string }>;
  };
  description?: string;
  placeholder?: string;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

/**
 * Centralized service for all node inspector operations
 * Acts as a facade over the NodeSpec system (Plop-aligned)
 */
class NodeInspectorServiceImpl {
  // ============================================================================
  // NODESPEC INTEGRATION
  // ============================================================================

  /**
   * Get enhanced metadata for a node type using NodeSpec as source of truth
   */
  getNodeMetadata(nodeType: NodeType): InspectorNodeMetadata | null {
    try {
      // Get base metadata from NodeSpec registry (single source of truth)
      const baseMetadata = getNodeSpecMetadata(nodeType);
      if (!baseMetadata) {
        return null;
      }

      // Validate using the NodeSpec system
      const validation = validateNode(nodeType);

      return {
        ...baseMetadata,
        isValid: validation.isValid,
        validationErrors: validation.warnings || [],
        hasCustomControls: this.determineHasControls(baseMetadata),
      };
    } catch (error) {
      console.error(
        `[NodeInspectorService] Failed to get metadata for ${nodeType}:`,
        error
      );
      return null;
    }
  }

  /**
   * Check if a node type exists and is valid in the NodeSpec registry
   */
  isValidNodeType(nodeType: string): boolean {
    const validation = validateNode(nodeType as NodeType);
    return validation.isValid;
  }

  /**
   * Get all available node types with their metadata
   */
  getAllNodeTypes(): Record<string, InspectorNodeMetadata> {
    // This would be implemented when we have a way to enumerate all node types
    // For now, return empty object
    return {};
  }

  // ============================================================================
  // CONTROL FIELD GENERATION (Future: From Zod Schema)
  // ============================================================================

  /**
   * Generate control fields from a node's Zod schema
   * TODO: Implement schema introspection when available
   */
  generateControlFields(nodeType: NodeType): ControlField[] {
    // Placeholder for future Zod schema introspection
    // This will be enhanced when we can access the node's Zod schema
    return [];
  }

  // ============================================================================
  // NODE DATA OPERATIONS (Plop-Aligned)
  // ============================================================================

  /**
   * Validate and update node data (basic validation until schema access available)
   */
  updateNodeData(
    node: AgenNode,
    updates: Record<string, unknown>
  ): NodeUpdateResult {
    try {
      const metadata = this.getNodeMetadata(node.type as NodeType);
      if (!metadata) {
        return {
          success: false,
          errors: [`Unknown node type: ${node.type}`],
        };
      }

      // Basic validation until we have direct Zod schema access
      return {
        success: true,
        errors: [],
        validatedData: updates,
      };
    } catch (error) {
      return {
        success: false,
        errors: [
          `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  }

  /**
   * Get the current data for a node with defaults from NodeSpec
   */
  getNodeDataWithDefaults(node: AgenNode): Record<string, unknown> {
    const metadata = this.getNodeMetadata(node.type as NodeType);
    const initialData = metadata?.initialData || {};

    // Merge initial data with current node data
    return {
      ...initialData,
      ...node.data,
    };
  }

  // ============================================================================
  // ERROR HANDLING & VALIDATION
  // ============================================================================

  /**
   * Validate node configuration using NodeSpec system
   */
  validateNodeConfiguration(node: AgenNode): string[] {
    const errors: string[] = [];

    try {
      // Check if node type is valid in NodeSpec registry
      if (!this.isValidNodeType(node.type as string)) {
        errors.push(`Invalid node type: ${node.type}`);
        return errors;
      }

      // Get validation warnings from NodeSpec system
      const metadata = this.getNodeMetadata(node.type as NodeType);
      if (metadata?.validationErrors) {
        errors.push(...metadata.validationErrors);
      }
    } catch (error) {
      errors.push(
        `Configuration validation error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return errors;
  }

  // ============================================================================
  // UTILITY METHODS (NodeSpec-Based)
  // ============================================================================

  /**
   * Check if a node has custom controls based on NodeSpec metadata
   */
  hasCustomControls(nodeType: NodeType): boolean {
    const metadata = this.getNodeMetadata(nodeType);
    return metadata?.hasCustomControls ?? false;
  }

  /**
   * Get suggested node types based on category from NodeSpec
   */
  getSuggestedNodeTypes(category?: string): string[] {
    // TODO: Implement when we have category-based node discovery from NodeSpec
    return [];
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Determine if a node has controls based on NodeSpec metadata
   */
  private determineHasControls(metadata: NodeSpecMetadata): boolean {
    // Use NodeSpec metadata to determine control availability
    // Categories like CREATE and TRIGGER typically have controls
    return (
      metadata.category === "CREATE" ||
      metadata.category === "TRIGGER" ||
      metadata.inspector?.key !== undefined
    );
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance aligned with NodeSpec system
 */
export const NodeInspectorService = new NodeInspectorServiceImpl();

/**
 * Type-only export for dependency injection or testing
 */
export type NodeInspectorServiceType = NodeInspectorServiceImpl;
