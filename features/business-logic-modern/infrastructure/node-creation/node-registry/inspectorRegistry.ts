/**
 * INSPECTOR REGISTRY - Node inspector configuration management system
 *
 * • Manages registration and configuration of node inspector controls
 * • Provides centralized registry for node type configurations
 * • Supports dynamic inspector control registration and retrieval
 * • Features type-safe configuration management for inspector panels
 * • Integrates with factory systems for seamless inspector functionality
 * • Enhanced with factory types for improved type safety and consistency
 *
 * Keywords: inspector-registry, configuration-management, dynamic-registration,
 * type-safety, inspector-panels, factory, factory-types, unified-types
 */

// ============================================================================
// INSPECTOR REGISTRY
// ============================================================================

import type { ReactNode } from "react";
import { getNodeTypeConfig } from "../../flow-engine/constants";
import type {
  NodeType,
  NodeTypeConfig,
} from "../../flow-engine/types/nodeData";
import type {
  BaseNodeData,
  InspectorControlProps,
  NodeFactoryConfig,
} from "../factory/types";
import type { EnhancedNodeRegistration } from "./nodeRegistry";

// ============================================================================
// ENHANCED INSPECTOR REGISTRY WITH FACTORY INTEGRATION
// ============================================================================

/**
 * FACTORY-INTEGRATED INSPECTOR CONFIG
 * Enhanced inspector configuration with factory type safety
 */
export interface FactoryInspectorConfig<T extends BaseNodeData> {
  nodeType: string;
  renderControls: (props: InspectorControlProps<T>) => ReactNode;
  defaultData: T;
  displayName: string;
  hasControls?: boolean;
  hasOutput?: boolean;
  factoryConfig?: NodeFactoryConfig<T>;
}

/**
 * TYPED NODE INSPECTOR REGISTRY
 * Enhanced registry with better type safety
 */
export const FACTORY_INSPECTOR_REGISTRY = new Map<
  string,
  FactoryInspectorConfig<any>
>();

/**
 * LEGACY NODE INSPECTOR REGISTRY
 * Maintained for backwards compatibility
 */
export const NODE_INSPECTOR_REGISTRY = new Map<
  string,
  (props: InspectorControlProps<any>) => ReactNode
>();

// ============================================================================
// ENHANCED REGISTRATION FUNCTIONS WITH FACTORY INTEGRATION
// ============================================================================

/**
 * REGISTER FACTORY INSPECTOR CONTROLS
 * Enhanced registration with full factory integration
 */
export function registerFactoryInspectorControls<T extends BaseNodeData>(
  config: FactoryInspectorConfig<T>
): void {
  // Register in enhanced registry
  FACTORY_INSPECTOR_REGISTRY.set(config.nodeType, config);

  // Register in legacy registry for backwards compatibility
  NODE_INSPECTOR_REGISTRY.set(config.nodeType, config.renderControls);

  // Auto-register node type config if needed
  if (!getNodeTypeConfig()[config.nodeType as NodeType]) {
    registerNodeTypeConfig(config.nodeType, {
      defaultData: config.defaultData,
      displayName: config.displayName,
      hasControls: config.hasControls,
      hasOutput: config.hasOutput,
    });
  }

  console.log(
    `✅ Registered factory inspector controls for ${config.nodeType}`
  );
}

/**
 * REGISTER NODE INSPECTOR CONTROLS (Legacy)
 * Backwards compatible registration function
 */
export function registerNodeInspectorControls<T extends BaseNodeData>(
  nodeType: string,
  renderControls: (props: InspectorControlProps<T>) => ReactNode
): void {
  NODE_INSPECTOR_REGISTRY.set(nodeType, renderControls);
}

/**
 * REGISTER NODE INSPECTOR FROM REGISTRY
 * Auto-register inspector controls from node registry
 */
export function registerInspectorFromNodeRegistry<T extends BaseNodeData>(
  nodeType: NodeType,
  nodeRegistration: EnhancedNodeRegistration<T>,
  renderControls: (props: InspectorControlProps<T>) => ReactNode
): void {
  const config: FactoryInspectorConfig<T> = {
    nodeType,
    renderControls,
    defaultData: nodeRegistration.defaultData,
    displayName: nodeRegistration.displayName,
    hasControls: nodeRegistration.hasControls,
    hasOutput: nodeRegistration.hasOutput,
    factoryConfig: nodeRegistration.factoryConfig,
  };

  registerFactoryInspectorControls(config);
}

// ============================================================================
// ENHANCED RETRIEVAL FUNCTIONS
// ============================================================================

/**
 * GET FACTORY INSPECTOR CONFIG
 * Retrieves complete factory inspector configuration
 */
export function getFactoryInspectorConfig<T extends BaseNodeData>(
  nodeType: string
): FactoryInspectorConfig<T> | undefined {
  return FACTORY_INSPECTOR_REGISTRY.get(nodeType) as
    | FactoryInspectorConfig<T>
    | undefined;
}

/**
 * GET NODE INSPECTOR CONTROLS (Enhanced)
 * Retrieves inspector controls with type safety
 */
export function getNodeInspectorControls<T extends BaseNodeData>(
  nodeType: string
): ((props: InspectorControlProps<T>) => ReactNode) | undefined {
  // Try factory registry first
  const factoryConfig = FACTORY_INSPECTOR_REGISTRY.get(nodeType);
  if (factoryConfig) {
    return factoryConfig.renderControls as (
      props: InspectorControlProps<T>
    ) => ReactNode;
  }

  // Fallback to legacy registry
  return NODE_INSPECTOR_REGISTRY.get(nodeType) as
    | ((props: InspectorControlProps<T>) => ReactNode)
    | undefined;
}

/**
 * HAS FACTORY INSPECTOR CONTROLS
 * Checks if a node type has factory-created inspector controls
 */
export function hasFactoryInspectorControls(nodeType: string): boolean {
  return (
    FACTORY_INSPECTOR_REGISTRY.has(nodeType) ||
    NODE_INSPECTOR_REGISTRY.has(nodeType)
  );
}

/**
 * IS FACTORY ENABLED INSPECTOR
 * Checks if inspector is using enhanced factory features
 */
export function isFactoryEnabledInspector(nodeType: string): boolean {
  return FACTORY_INSPECTOR_REGISTRY.has(nodeType);
}

// ============================================================================
// LEGACY COMPATIBILITY FUNCTIONS
// ============================================================================

/**
 * REGISTER NODE TYPE CONFIG (Legacy)
 * Registers node configuration for inspector compatibility
 */
export function registerNodeTypeConfig<T extends BaseNodeData>(
  nodeType: string,
  config: {
    defaultData: T;
    displayName: string;
    hasControls?: boolean;
    hasOutput?: boolean;
  }
): void {
  const nodeConfig: NodeTypeConfig = {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: config.hasControls ?? false,
    hasOutput: config.hasOutput ?? false,
  };

  // Dynamically add to NODE_TYPE_CONFIG
  const nodeTypeConfig = getNodeTypeConfig();
  (nodeTypeConfig as any)[nodeType] = nodeConfig;
}

// ============================================================================
// ENHANCED REGISTRY UTILITIES
// ============================================================================

/**
 * GET ALL FACTORY REGISTERED NODE TYPES
 * Returns all factory-enhanced registered node types
 */
export function getAllFactoryRegisteredNodeTypes(): string[] {
  return Array.from(FACTORY_INSPECTOR_REGISTRY.keys());
}

/**
 * GET ALL REGISTERED NODE TYPES (Legacy)
 * Returns all registered node types including legacy
 */
export function getAllRegisteredNodeTypes(): string[] {
  const factoryTypes = Array.from(FACTORY_INSPECTOR_REGISTRY.keys());
  const legacyTypes = Array.from(NODE_INSPECTOR_REGISTRY.keys());

  // Combine and deduplicate
  const allTypes = new Set([...factoryTypes, ...legacyTypes]);
  return Array.from(allTypes);
}

/**
 * MIGRATE LEGACY TO FACTORY
 * Migrates legacy inspector registrations to factory system
 */
export function migrateLegacyToFactory(): void {
  let migratedCount = 0;

  NODE_INSPECTOR_REGISTRY.forEach((renderControls, nodeType) => {
    // Skip if already has factory config
    if (FACTORY_INSPECTOR_REGISTRY.has(nodeType)) {
      return;
    }

    // Create basic factory config for legacy inspector
    const config: FactoryInspectorConfig<BaseNodeData> = {
      nodeType,
      renderControls,
      defaultData: { isActive: false },
      displayName: nodeType,
      hasControls: true,
      hasOutput: false,
    };

    FACTORY_INSPECTOR_REGISTRY.set(nodeType, config);
    migratedCount++;
  });

  console.log(
    `✅ Migrated ${migratedCount} legacy inspector registrations to factory system`
  );
}

/**
 * CLEAR INSPECTOR REGISTRIES
 * Clears all registered inspector controls (useful for testing)
 */
export function clearInspectorRegistry(): void {
  FACTORY_INSPECTOR_REGISTRY.clear();
  NODE_INSPECTOR_REGISTRY.clear();
}

/**
 * GET ENHANCED REGISTRY STATS
 * Returns comprehensive registry statistics
 */
export function getRegistryStats() {
  const factoryRegistrations = FACTORY_INSPECTOR_REGISTRY.size;
  const legacyRegistrations = NODE_INSPECTOR_REGISTRY.size;
  const factoryOnlyRegistrations = Array.from(
    FACTORY_INSPECTOR_REGISTRY.keys()
  ).filter((nodeType) => !NODE_INSPECTOR_REGISTRY.has(nodeType)).length;

  return {
    totalRegistered: getAllRegisteredNodeTypes().length,
    factoryRegistrations,
    legacyRegistrations,
    factoryOnlyRegistrations,
    nodeTypes: getAllRegisteredNodeTypes(),
    factoryNodeTypes: getAllFactoryRegisteredNodeTypes(),
    migrationProgress:
      legacyRegistrations > 0
        ? `${factoryRegistrations}/${factoryRegistrations + legacyRegistrations} migrated to factory`
        : "All registrations use factory system",
  };
}

/**
 * REMOVE NODE TYPE FROM ALL REGISTRIES
 * Removes a specific node type from both registries
 */
export function removeNodeType(nodeType: string): boolean {
  const factoryRemoved = FACTORY_INSPECTOR_REGISTRY.delete(nodeType);
  const legacyRemoved = NODE_INSPECTOR_REGISTRY.delete(nodeType);

  return factoryRemoved || legacyRemoved;
}

/**
 * VALIDATE INSPECTOR REGISTRY
 * Validates that all registrations are properly configured
 */
export function validateInspectorRegistry(): boolean {
  let isValid = true;
  const issues: string[] = [];

  FACTORY_INSPECTOR_REGISTRY.forEach((config, nodeType) => {
    if (!config.renderControls) {
      issues.push(`Factory inspector ${nodeType} missing renderControls`);
      isValid = false;
    }

    if (!config.defaultData) {
      issues.push(`Factory inspector ${nodeType} missing defaultData`);
      isValid = false;
    }

    if (!config.displayName) {
      issues.push(`Factory inspector ${nodeType} missing displayName`);
      isValid = false;
    }
  });

  if (isValid) {
    console.log("✅ Inspector registry validation passed");
  } else {
    console.error("❌ Inspector registry validation failed:", issues);
  }

  return isValid;
}
