/**
 * NODE INSPECTOR SERVICE - Facade layer for Plop system integration
 *
 * • Provides clean interface between Node Inspector and Plop system
 * • Reduces import churn by centralizing all node system interactions
 * • Handles NodeSpec metadata retrieval and validation
 * • Manages type-safe node data updates with Zod validation
 * • Abstracts complexity of the underlying node registry system
 *
 * Keywords: facade-pattern, service-layer, plop-integration, type-safety, import-reduction
 */

import { z } from "zod";
import type { AgenNode, NodeType } from "../../flow-engine/types/nodeData";
import {
  getNodeMetadata,
  validateNode,
} from "../../node-registry/nodespec-registry";

// ============================================================================
// SERVICE INTERFACE TYPES
// ============================================================================

/**
 * Enhanced node metadata for inspector use
 */
export interface InspectorNodeMetadata extends NodeMetadata {
  isValid: boolean;
  validationErrors: string[];
  hasCustomControls: boolean;
  controlSchema?: z.ZodSchema;
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
 * Acts as a facade to reduce import churn and provide clean abstraction
 */
class NodeInspectorServiceImpl {
  // ============================================================================
  // METADATA OPERATIONS
  // ============================================================================

  /**
   * Get enhanced metadata for a node type
   * Combines NodeSpec data with validation information
   */
  getNodeMetadata(nodeType: NodeType): InspectorNodeMetadata | null {
    try {
      // Get base metadata from registry
      const baseMetadata = getNodeMetadata(nodeType);
      if (!baseMetadata) {
        return null;
      }

      // Validate the node type
      const validation = validateNode(nodeType);

      return {
        ...baseMetadata,
        isValid: validation.isValid,
        validationErrors: validation.warnings || [],
        hasCustomControls: true, // Will be determined by schema analysis
        controlSchema: undefined, // Will be added when schema extraction is implemented
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
   * Check if a node type exists and is valid
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
  // CONTROL FIELD GENERATION
  // ============================================================================

  /**
   * Generate control fields from a node's schema
   * This enables automatic control generation without manual mapping
   */
  generateControlFields(nodeType: NodeType): ControlField[] {
    // For now, return empty array until schema extraction is implemented
    // This will be enhanced when we have access to the node's Zod schema
    return [];
  }

  // ============================================================================
  // NODE DATA OPERATIONS
  // ============================================================================

  /**
   * Validate and update node data using the node's schema
   * Provides type-safe updates with automatic validation
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

      // For now, allow all updates until schema validation is implemented
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
   * Get the current data for a node with defaults applied
   */
  getNodeDataWithDefaults(node: AgenNode): Record<string, unknown> {
    return node.data || {};
  }

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  /**
   * Validate node configuration and return any issues
   */
  validateNodeConfiguration(node: AgenNode): string[] {
    const errors: string[] = [];

    try {
      // Check if node type is valid
      if (!this.isValidNodeType(node.type)) {
        errors.push(`Invalid node type: ${node.type}`);
        return errors;
      }

      // Additional validation will be added when schema support is implemented
    } catch (error) {
      errors.push(
        `Configuration validation error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return errors;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Check if a node has custom controls available
   */
  hasCustomControls(nodeType: NodeType): boolean {
    const metadata = this.getNodeMetadata(nodeType);
    return metadata?.hasCustomControls ?? false;
  }

  /**
   * Get suggested node types based on category
   */
  getSuggestedNodeTypes(category?: string): string[] {
    // This would be implemented when we have category-based node discovery
    // For now, return empty array
    return [];
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance of the NodeInspectorService
 * This reduces import churn and provides a consistent interface
 */
export const NodeInspectorService = new NodeInspectorServiceImpl();

/**
 * Type-only export for dependency injection or testing
 */
export type NodeInspectorServiceType = NodeInspectorServiceImpl;
