/**
 * NODE REGISTRY - Domain-specific registry for node management
 *
 * • Extends TypedRegistry with node-specific functionality
 * • Provides type-safe operations for node registrations
 * • Includes validation and helper methods for node management
 * • Integrates with factory system and metadata management
 *
 * Keywords: node-registry, typed-registry, domain-specific, validation
 */

import type { Position } from "@xyflow/react";
import type { ComponentType } from "react";
import type { NodeType } from "../../../../flow-engine/types/nodeData";
import type {
  BaseNodeData,
  HandleConfig,
  NodeCategory,
  NodeFactoryConfig,
  NodeSize,
  SidebarFolder,
} from "../../factory/types";
import { MemoizedTypedRegistry } from "./base/TypedRegistry";

// ============================================================================
// NODE REGISTRATION INTERFACE - Simplified and Type-Safe
// ============================================================================

/**
 * Enhanced node registration with factory integration
 */
export interface NodeRegistration<T extends BaseNodeData = BaseNodeData> {
  nodeType: NodeType;
  component: ComponentType<any>;

  // Metadata
  category: NodeCategory;
  folder: SidebarFolder;
  displayName: string;
  description: string;
  icon: string;

  // UI Configuration
  hasToggle: boolean;
  iconWidth: number;
  iconHeight: number;
  expandedWidth: number;
  expandedHeight: number;

  // Data & Behavior
  defaultData: T;
  handles: HandleConfig[];

  // Factory Integration (optional)
  factoryConfig?: NodeFactoryConfig<T>;
  size?: NodeSize;

  // Legacy Support
  hasTargetPosition?: boolean;
  targetPosition?: Position;
  hasOutput?: boolean;
  hasControls?: boolean;
}

// ============================================================================
// TYPED NODE REGISTRY
// ============================================================================

/**
 * Domain-specific registry for node management with memoization
 */
export class NodeRegistry extends MemoizedTypedRegistry<
  NodeType,
  NodeRegistration<any>
> {
  constructor() {
    super("NodeRegistry", 100); // Cache up to 100 nodes
  }

  // ============================================================================
  // DOMAIN-SPECIFIC METHODS
  // ============================================================================

  /**
   * Register a new node with validation
   */
  registerNode<T extends BaseNodeData>(
    registration: NodeRegistration<T>
  ): void {
    // Validate registration
    const validation = this.validateNodeRegistration(registration);
    if (!validation.isValid) {
      throw new Error(
        `Invalid node registration for ${registration.nodeType}: ${validation.errors.join(", ")}`
      );
    }

    this.set(registration.nodeType, registration);

    // Logger will be added via import in next step
  }

  /**
   * Get node component for ReactFlow
   */
  getNodeComponent(nodeType: NodeType): ComponentType<any> | undefined {
    return this.get(nodeType)?.component;
  }

  /**
   * Get all node components for ReactFlow registration
   */
  getNodeTypes(): Record<string, ComponentType<any>> {
    const nodeTypes: Record<string, ComponentType<any>> = {};

    for (const [nodeType, registration] of this.entries()) {
      nodeTypes[nodeType] = registration.component;
    }

    return nodeTypes;
  }

  /**
   * Get nodes by category
   */
  getNodesByCategory(category: NodeCategory): NodeRegistration[] {
    return this.filter(
      (registration) => registration.category === category
    ).map(([, registration]) => registration);
  }

  /**
   * Get nodes by folder
   */
  getNodesByFolder(folder: SidebarFolder): NodeRegistration[] {
    return this.filter((registration) => registration.folder === folder).map(
      ([, registration]) => registration
    );
  }

  /**
   * Get factory-enabled nodes
   */
  getFactoryEnabledNodes(): NodeRegistration[] {
    return this.filter((registration) => !!registration.factoryConfig).map(
      ([, registration]) => registration
    );
  }

  /**
   * Get node metadata with enhanced type safety
   */
  getNodeMetadata<T extends BaseNodeData>(
    nodeType: NodeType
  ): NodeRegistration<T> | undefined {
    return this.get(nodeType) as NodeRegistration<T> | undefined;
  }

  /**
   * Check if node has factory configuration
   */
  isFactoryEnabled(nodeType: NodeType): boolean {
    return !!this.get(nodeType)?.factoryConfig;
  }

  /**
   * Get node handles
   */
  getNodeHandles(nodeType: NodeType): HandleConfig[] {
    return this.get(nodeType)?.handles || [];
  }

  /**
   * Get node dimensions
   */
  getNodeDimensions(
    nodeType: NodeType,
    isExpanded = false
  ): { width: number; height: number } | null {
    const registration = this.get(nodeType);
    if (!registration) return null;

    return isExpanded
      ? {
          width: registration.expandedWidth,
          height: registration.expandedHeight,
        }
      : { width: registration.iconWidth, height: registration.iconHeight };
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate node registration
   */
  private validateNodeRegistration<T extends BaseNodeData>(
    registration: NodeRegistration<T>
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!registration.nodeType) errors.push("nodeType is required");
    if (!registration.component) errors.push("component is required");
    if (!registration.displayName) errors.push("displayName is required");
    if (!registration.category) errors.push("category is required");
    if (!registration.folder) errors.push("folder is required");
    if (!registration.defaultData) errors.push("defaultData is required");

    // Dimension validation
    if (registration.iconWidth <= 0) errors.push("iconWidth must be positive");
    if (registration.iconHeight <= 0)
      errors.push("iconHeight must be positive");
    if (registration.expandedWidth <= 0)
      errors.push("expandedWidth must be positive");
    if (registration.expandedHeight <= 0)
      errors.push("expandedHeight must be positive");

    // Factory integration validation
    if (registration.factoryConfig && !registration.handles?.length) {
      warnings.push("Factory-enabled node should have handles defined");
    }

    // Check for duplicate registration
    if (this.has(registration.nodeType)) {
      warnings.push(`Node type ${registration.nodeType} is already registered`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate entire registry
   */
  validateRegistry(): {
    isValid: boolean;
    issues: Array<{ nodeType: string; errors: string[]; warnings: string[] }>;
  } {
    const issues: Array<{
      nodeType: string;
      errors: string[];
      warnings: string[];
    }> = [];
    let isValid = true;

    for (const [nodeType, registration] of this.entries()) {
      const validation = this.validateNodeRegistration(registration);
      if (!validation.isValid || validation.warnings.length > 0) {
        issues.push({
          nodeType,
          errors: validation.errors,
          warnings: validation.warnings,
        });
        if (!validation.isValid) {
          isValid = false;
        }
      }
    }

    return { isValid, issues };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get registry statistics with domain-specific metrics
   */
  getRegistryStats() {
    const baseStats = this.getCacheStats();
    const categoryCount = new Set(this.values().map((reg) => reg.category))
      .size;
    const folderCount = new Set(this.values().map((reg) => reg.folder)).size;
    const factoryEnabledCount = this.values().filter(
      (reg) => !!reg.factoryConfig
    ).length;

    return {
      ...baseStats,
      domain: {
        categories: categoryCount,
        folders: folderCount,
        factoryEnabled: factoryEnabledCount,
        totalNodes: this.size(),
      },
    };
  }

  /**
   * Export registry for persistence/debugging
   */
  export(): Record<NodeType, NodeRegistration> {
    const exported: Record<string, NodeRegistration> = {};
    for (const [nodeType, registration] of this.entries()) {
      exported[nodeType] = registration;
    }
    return exported as Record<NodeType, NodeRegistration>;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global node registry instance
 */
export const nodeRegistry = new NodeRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Register a node (convenience function)
 */
export function registerNode<T extends BaseNodeData>(
  registration: NodeRegistration<T>
): void {
  nodeRegistry.registerNode(registration);
}

/**
 * Get node metadata (convenience function)
 */
export function getNodeMetadata<T extends BaseNodeData>(
  nodeType: NodeType
): NodeRegistration<T> | undefined {
  return nodeRegistry.getNodeMetadata<T>(nodeType);
}

/**
 * Get all node types for ReactFlow
 */
export function getNodeTypes(): Record<string, ComponentType<any>> {
  return nodeRegistry.getNodeTypes();
}

/**
 * Check if node type is valid
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return nodeRegistry.has(nodeType as NodeType);
}
