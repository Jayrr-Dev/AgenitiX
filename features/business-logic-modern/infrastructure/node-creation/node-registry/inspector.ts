/**
 * INSPECTOR REGISTRY - Domain-specific registry for inspector control management
 *
 * • Extends TypedRegistry with inspector-specific functionality
 * • Provides type-safe operations for inspector control registrations
 * • Integrates with factory system for enhanced inspector functionality
 * • Supports both legacy and modern inspector control patterns
 *
 * Keywords: inspector-registry, typed-registry, controls, factory-integration
 */

import type { NodeType } from "../../flow-engine/types/nodeData";
import type {
  BaseNodeData,
  InspectorControlProps,
  NodeFactoryConfig,
} from "../factory/types";
import { MemoizedTypedRegistry } from "./base/TypedRegistry";
import type { ReactNode } from "./types/shared";

// ============================================================================
// INSPECTOR REGISTRATION INTERFACE
// ============================================================================

/**
 * Inspector control registration with factory integration
 */
export interface InspectorRegistration<T extends BaseNodeData = BaseNodeData> {
  nodeType: NodeType;
  renderControls: (props: InspectorControlProps<T>) => ReactNode;
  defaultData: T;
  displayName: string;

  // Optional configuration
  hasControls?: boolean;
  hasOutput?: boolean;
  factoryConfig?: NodeFactoryConfig<T>;

  // Control metadata
  controlType: "factory" | "legacy" | "custom";
  priority?: number; // For ordering controls
}

// ============================================================================
// TYPED INSPECTOR REGISTRY
// ============================================================================

/**
 * Domain-specific registry for inspector control management with memoization
 */
export class InspectorRegistry extends MemoizedTypedRegistry<
  NodeType,
  InspectorRegistration<any>
> {
  constructor() {
    super("InspectorRegistry", 50); // Cache up to 50 inspector controls
  }

  // ============================================================================
  // DOMAIN-SPECIFIC METHODS
  // ============================================================================

  /**
   * Register inspector controls with validation
   */
  registerInspectorControls<T extends BaseNodeData>(
    registration: InspectorRegistration<T>
  ): void {
    // Validate registration
    const validation = this.validateInspectorRegistration(registration);
    if (!validation.isValid) {
      throw new Error(
        `Invalid inspector registration for ${registration.nodeType}: ${validation.errors.join(", ")}`
      );
    }

    this.set(registration.nodeType, registration as InspectorRegistration<any>);

    if (process.env.NODE_ENV !== "production") {
      console.log(`✅ Registered inspector controls: ${registration.nodeType}`);
    }
  }

  /**
   * Get inspector controls renderer
   */
  getInspectorControls<T extends BaseNodeData>(
    nodeType: NodeType
  ): ((props: InspectorControlProps<T>) => ReactNode) | undefined {
    const registration = this.get(nodeType);
    return registration?.renderControls as
      | ((props: InspectorControlProps<T>) => ReactNode)
      | undefined;
  }

  /**
   * Check if node has inspector controls
   */
  hasInspectorControls(nodeType: NodeType): boolean {
    return this.has(nodeType);
  }

  /**
   * Check if inspector uses factory system
   */
  isFactoryEnabled(nodeType: NodeType): boolean {
    const registration = this.get(nodeType);
    return (
      registration?.controlType === "factory" && !!registration.factoryConfig
    );
  }

  /**
   * Get factory-enabled inspector controls
   */
  getFactoryEnabledControls(): InspectorRegistration[] {
    return this.filter(
      (registration) => registration.controlType === "factory"
    ).map(([, registration]) => registration);
  }

  /**
   * Get inspector controls by type
   */
  getControlsByType(
    controlType: InspectorRegistration["controlType"]
  ): InspectorRegistration[] {
    return this.filter(
      (registration) => registration.controlType === controlType
    ).map(([, registration]) => registration);
  }

  /**
   * Get inspector registration metadata
   */
  getInspectorMetadata<T extends BaseNodeData>(
    nodeType: NodeType
  ): InspectorRegistration<T> | undefined {
    return this.get(nodeType) as InspectorRegistration<T> | undefined;
  }

  /**
   * Get sorted inspector controls (by priority)
   */
  getSortedControls(): [NodeType, InspectorRegistration][] {
    return this.entries().sort(([, a], [, b]) => {
      const priorityA = a.priority ?? 0;
      const priorityB = b.priority ?? 0;
      return priorityB - priorityA; // Higher priority first
    });
  }

  // ============================================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Register legacy inspector controls (backwards compatibility)
   */
  registerLegacyInspectorControls<T extends BaseNodeData>(
    nodeType: NodeType,
    renderControls: (props: InspectorControlProps<T>) => ReactNode,
    defaultData: T,
    displayName: string
  ): void {
    const registration: InspectorRegistration<T> = {
      nodeType,
      renderControls,
      defaultData,
      displayName,
      controlType: "legacy",
    };

    this.registerInspectorControls(registration);
  }

  /**
   * Register factory inspector controls
   */
  registerFactoryInspectorControls<T extends BaseNodeData>(
    nodeType: NodeType,
    renderControls: (props: InspectorControlProps<T>) => ReactNode,
    factoryConfig: NodeFactoryConfig<T>,
    defaultData: T,
    displayName: string
  ): void {
    const registration: InspectorRegistration<T> = {
      nodeType,
      renderControls,
      defaultData,
      displayName,
      factoryConfig,
      controlType: "factory",
      hasControls: true,
    };

    this.registerInspectorControls(registration);
  }

  // ============================================================================
  // VALIDATION METHODS
  // ============================================================================

  /**
   * Validate inspector registration
   */
  private validateInspectorRegistration<T extends BaseNodeData>(
    registration: InspectorRegistration<T>
  ): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!registration.nodeType) errors.push("nodeType is required");
    if (!registration.renderControls) errors.push("renderControls is required");
    if (!registration.displayName) errors.push("displayName is required");
    if (!registration.defaultData) errors.push("defaultData is required");
    if (!registration.controlType) errors.push("controlType is required");

    // Control type validation
    const validControlTypes = ["factory", "legacy", "custom"];
    if (!validControlTypes.includes(registration.controlType)) {
      errors.push(
        `Invalid controlType. Must be one of: ${validControlTypes.join(", ")}`
      );
    }

    // Factory validation
    if (registration.controlType === "factory" && !registration.factoryConfig) {
      errors.push("Factory-type inspector must have factoryConfig");
    }

    // Priority validation
    if (registration.priority !== undefined && registration.priority < 0) {
      warnings.push("Priority should be non-negative");
    }

    // Check for duplicate registration
    if (this.has(registration.nodeType)) {
      warnings.push(
        `Inspector controls for ${registration.nodeType} are already registered`
      );
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
      const validation = this.validateInspectorRegistration(registration);
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
    const controlTypeStats = this.values().reduce(
      (acc, reg) => {
        acc[reg.controlType] = (acc[reg.controlType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const factoryEnabledCount = this.values().filter(
      (reg) => reg.controlType === "factory"
    ).length;

    return {
      ...baseStats,
      domain: {
        controlTypes: controlTypeStats,
        factoryEnabled: factoryEnabledCount,
        totalControls: this.size(),
      },
    };
  }

  /**
   * Export registry for persistence/debugging
   */
  export(): Record<NodeType, InspectorRegistration> {
    const exported: Record<string, InspectorRegistration> = {};
    for (const [nodeType, registration] of this.entries()) {
      exported[nodeType] = registration;
    }
    return exported as Record<NodeType, InspectorRegistration>;
  }

  /**
   * Migrate from legacy map-based registry
   */
  migrateFromLegacyRegistry(
    legacyRegistry: Map<
      string,
      (props: InspectorControlProps<any>) => ReactNode
    >
  ): void {
    for (const [nodeType, renderControls] of Array.from(
      legacyRegistry.entries()
    )) {
      if (!this.has(nodeType as NodeType)) {
        this.registerLegacyInspectorControls(
          nodeType as NodeType,
          renderControls,
          {} as BaseNodeData, // Default empty data
          nodeType // Use nodeType as displayName
        );
      }
    }

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `✅ Migrated ${legacyRegistry.size} legacy inspector controls`
      );
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

/**
 * Global inspector registry instance
 */
export const inspectorRegistry = new InspectorRegistry();

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Register inspector controls (convenience function)
 */
export function registerInspectorControls<T extends BaseNodeData>(
  registration: InspectorRegistration<T>
): void {
  inspectorRegistry.registerInspectorControls(registration);
}

/**
 * Get inspector controls (convenience function)
 */
export function getInspectorControls<T extends BaseNodeData>(
  nodeType: NodeType
): ((props: InspectorControlProps<T>) => ReactNode) | undefined {
  return inspectorRegistry.getInspectorControls<T>(nodeType);
}

/**
 * Check if inspector controls exist (convenience function)
 */
export function hasInspectorControls(nodeType: NodeType): boolean {
  return inspectorRegistry.hasInspectorControls(nodeType);
}

/**
 * Register legacy inspector controls (convenience function)
 */
export function registerLegacyInspectorControls<T extends BaseNodeData>(
  nodeType: NodeType,
  renderControls: (props: InspectorControlProps<T>) => ReactNode,
  defaultData: T,
  displayName: string
): void {
  inspectorRegistry.registerLegacyInspectorControls(
    nodeType,
    renderControls,
    defaultData,
    displayName
  );
}
