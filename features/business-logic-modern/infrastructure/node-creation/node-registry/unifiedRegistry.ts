/**
 * UNIFIED REGISTRY - Single source of truth replacing all duplicate registries
 *
 * • Replaces MODERN_NODE_REGISTRY, NODE_INSPECTOR_REGISTRY, FACTORY_INSPECTOR_REGISTRY
 * • Uses TypedRegistry base for consistency and performance
 * • Provides legacy API compatibility during transition
 * • Eliminates data duplication and sync issues
 *
 * Keywords: unified-registry, single-source-truth, legacy-replacement, deduplication
 */

import type { NodeType } from "../../flow-engine/types/nodeData";
import type { InspectorControlProps } from "../factory/types";
import {
  categoryRegistry,
  registerCategory,
  type CategoryRegistration,
} from "./category";
import {
  inspectorRegistry,
  registerInspectorControls,
  type InspectorRegistration,
} from "./inspector";
import { nodeRegistry, registerNode, type NodeRegistration } from "./node";
import type { ReactNode } from "./types/shared";

// Import actual node components from domain
import CreateText from "../../node-domain/create/CreateText";
import TestError from "../../node-domain/test/TestError";
import TriggerOnToggle from "../../node-domain/trigger/TriggerOnToggle";
import ViewOutput from "../../node-domain/view/ViewOutput";

// Import centralized handle definitions
import { getNodeHandles as getNodeHandlesFromConstants } from "../factory/constants/handles";

// ============================================================================
// UNIFIED REGISTRY INITIALIZATION
// ============================================================================

/**
 * Initialize the unified registry system with all existing nodes
 * This replaces the massive MODERN_NODE_REGISTRY object
 */
export function initializeUnifiedRegistry(): void {
  // Clear existing registries to avoid conflicts
  nodeRegistry.clear();
  inspectorRegistry.clear();
  categoryRegistry.clear();

  // Initialize categories first (nodes depend on them)
  initializeCategories();

  // Initialize nodes
  initializeNodes();

  // Initialize inspector controls
  initializeInspectorControls();
}

/**
 * Initialize category registrations
 */
function initializeCategories(): void {
  const categories: CategoryRegistration[] = [
    {
      category: "create",
      displayName: "Create",
      description: "Nodes that create and generate content",
      icon: "🏗️",
      color: "#4CAF50",
      order: 1,
      folder: "main",
      isEnabled: true,
    },
    {
      category: "view",
      displayName: "View",
      description: "Nodes that display and visualize data",
      icon: "👁️",
      color: "#2196F3",
      order: 2,
      folder: "main",
      isEnabled: true,
    },
    {
      category: "trigger",
      displayName: "Trigger",
      description: "Nodes that initiate and control flow",
      icon: "⚡",
      color: "#FF9800",
      order: 3,
      folder: "main",
      isEnabled: true,
    },
    {
      category: "test",
      displayName: "Test",
      description: "Testing and debugging nodes",
      icon: "🧪",
      color: "#9C27B0",
      order: 4,
      folder: "main",
      isEnabled: true,
    },
  ];

  categories.forEach((category) => registerCategory(category));
}

/**
 * Initialize node registrations
 */
function initializeNodes(): void {
  const nodes: Array<NodeRegistration<any>> = [
    // CREATE DOMAIN
    {
      nodeType: "createText",
      component: CreateText,
      category: "create",
      folder: "main",
      displayName: "Create Text",
      description: "Creates and outputs text content",
      icon: "📝",
      hasToggle: true,
      iconWidth: 120,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 120,
      defaultData: {
        text: "",
        heldText: "",
        isActive: false,
      },
      handles: getNodeHandlesFromConstants("createText"),
      hasControls: true,
      hasOutput: true,
    },

    // VIEW DOMAIN
    {
      nodeType: "viewOutput",
      component: ViewOutput,
      category: "view",
      folder: "main",
      displayName: "View Output",
      description: "Displays text and data outputs",
      icon: "👁️",
      hasToggle: true,
      iconWidth: 120,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 120,
      defaultData: {
        inputText: "",
        displayText: "",
        isActive: false,
      },
      handles: getNodeHandlesFromConstants("viewOutput"),
      hasControls: true,
      hasOutput: false,
    },

    // TRIGGER DOMAIN
    {
      nodeType: "triggerOnToggle",
      component: TriggerOnToggle,
      category: "trigger",
      folder: "main",
      displayName: "Trigger On Toggle",
      description: "Triggers actions when toggled",
      icon: "⚡",
      hasToggle: true,
      iconWidth: 120,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 120,
      defaultData: {
        isActive: false,
        triggerCount: 0,
      },
      handles: getNodeHandlesFromConstants("triggerOnToggle"),
      hasControls: true,
      hasOutput: true,
    },

    // TEST DOMAIN
    {
      nodeType: "testError",
      component: TestError,
      category: "test",
      folder: "main",
      displayName: "Test Error",
      description: "Node for testing error handling",
      icon: "🧪",
      hasToggle: true,
      iconWidth: 120,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 120,
      defaultData: {
        shouldError: false,
        errorMessage: "Test error",
        isActive: false,
      },
      handles: getNodeHandlesFromConstants("testError"),
      hasControls: true,
      hasOutput: true,
    },
  ];

  nodes.forEach((node) => registerNode(node));
}

/**
 * Initialize inspector control registrations
 */
function initializeInspectorControls(): void {
  const inspectorControls: Array<InspectorRegistration<any>> = [
    {
      nodeType: "createText",
      displayName: "Create Text Controls",
      controlType: "legacy",
      defaultData: {
        text: "",
        heldText: "",
        isActive: false,
      },
      renderControls: (props: InspectorControlProps<any>) => {
        // This would be replaced with actual React components
        return null as any;
      },
      hasControls: true,
      hasOutput: true,
    },

    {
      nodeType: "viewOutput",
      displayName: "View Output Controls",
      controlType: "legacy",
      defaultData: {
        inputText: "",
        displayText: "",
        isActive: false,
      },
      renderControls: (props: InspectorControlProps<any>) => {
        return null as any;
      },
      hasControls: true,
      hasOutput: false,
    },

    {
      nodeType: "triggerOnToggle",
      displayName: "Trigger Controls",
      controlType: "legacy",
      defaultData: {
        isActive: false,
        triggerCount: 0,
      },
      renderControls: (props: InspectorControlProps<any>) => {
        return null as any;
      },
      hasControls: true,
      hasOutput: true,
    },

    {
      nodeType: "testError",
      displayName: "Test Error Controls",
      controlType: "legacy",
      defaultData: {
        shouldError: false,
        errorMessage: "Test error",
        isActive: false,
      },
      renderControls: (props: InspectorControlProps<any>) => {
        return null as any;
      },
      hasControls: true,
      hasOutput: true,
    },
  ];

  inspectorControls.forEach((control) => registerInspectorControls(control));
}

// ============================================================================
// LEGACY API COMPATIBILITY LAYER
// ============================================================================

/**
 * Legacy MODERN_NODE_REGISTRY replacement
 * Returns the same API but backed by the new unified registry
 */
export function getLegacyNodeRegistry(): Record<NodeType, any> {
  const legacyRegistry: Record<string, any> = {};

  for (const [nodeType, registration] of nodeRegistry.entries()) {
    legacyRegistry[nodeType] = {
      nodeType: registration.nodeType,
      component: registration.component,
      category: registration.category,
      folder: registration.folder,
      displayName: registration.displayName,
      description: registration.description,
      hasToggle: registration.hasToggle,
      iconWidth: registration.iconWidth,
      iconHeight: registration.iconHeight,
      expandedWidth: registration.expandedWidth,
      expandedHeight: registration.expandedHeight,
      icon: registration.icon,
      handles: registration.handles,
      size: registration.size,
      defaultData: registration.defaultData,
      hasTargetPosition: registration.hasTargetPosition,
      targetPosition: registration.targetPosition,
      hasOutput: registration.hasOutput,
      hasControls: registration.hasControls,
      factoryConfig: registration.factoryConfig,

      // Legacy fields for backward compatibility
      factoryLabel: registration.displayName,
      factoryDefaultData: registration.defaultData,
      inspectorControls: {
        type: inspectorRegistry.hasInspectorControls(nodeType)
          ? "factory"
          : "none",
        factoryControls: inspectorRegistry.hasInspectorControls(nodeType),
      },
    };
  }

  return legacyRegistry as Record<NodeType, any>;
}

/**
 * Legacy NODE_INSPECTOR_REGISTRY replacement
 */
export function getLegacyInspectorRegistry(): Map<
  string,
  (props: InspectorControlProps<any>) => ReactNode
> {
  const legacyMap = new Map<
    string,
    (props: InspectorControlProps<any>) => ReactNode
  >();

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    legacyMap.set(nodeType, registration.renderControls);
  }

  return legacyMap;
}

/**
 * Legacy FACTORY_INSPECTOR_REGISTRY replacement
 */
export function getLegacyFactoryInspectorRegistry(): Map<string, any> {
  const legacyMap = new Map<string, any>();

  for (const [nodeType, registration] of inspectorRegistry.entries()) {
    legacyMap.set(nodeType, {
      nodeType: registration.nodeType,
      renderControls: registration.renderControls,
      defaultData: registration.defaultData,
      displayName: registration.displayName,
      hasControls: registration.hasControls,
      hasOutput: registration.hasOutput,
      factoryConfig: registration.factoryConfig,
    });
  }

  return legacyMap;
}

// ============================================================================
// MIGRATION AND VALIDATION
// ============================================================================

/**
 * Validate the unified registry system
 */
export function validateUnifiedRegistry(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    nodes: number;
    inspectors: number;
    categories: number;
  };
} {
  const nodeValidation = nodeRegistry.validateRegistry();
  const inspectorValidation = inspectorRegistry.validateRegistry();

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!nodeValidation.isValid) {
    nodeValidation.issues.forEach((issue) => {
      errors.push(
        ...issue.errors.map((error) => `Node ${issue.nodeType}: ${error}`)
      );
      warnings.push(
        ...issue.warnings.map((warning) => `Node ${issue.nodeType}: ${warning}`)
      );
    });
  }

  if (!inspectorValidation.isValid) {
    inspectorValidation.issues.forEach((issue) => {
      errors.push(
        ...issue.errors.map((error) => `Inspector ${issue.nodeType}: ${error}`)
      );
      warnings.push(
        ...issue.warnings.map(
          (warning) => `Inspector ${issue.nodeType}: ${warning}`
        )
      );
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      nodes: nodeRegistry.size(),
      inspectors: inspectorRegistry.size(),
      categories: categoryRegistry.size(),
    },
  };
}

/**
 * Get unified registry statistics
 */
export function getUnifiedRegistryStats() {
  return {
    nodes: nodeRegistry.getRegistryStats(),
    inspectors: inspectorRegistry.getRegistryStats(),
    categories: categoryRegistry.getRegistryStats(),
    migration: {
      isInitialized: nodeRegistry.size() > 0,
      nodesRegistered: nodeRegistry.size(),
      inspectorsRegistered: inspectorRegistry.size(),
      categoriesRegistered: categoryRegistry.size(),
    },
  };
}

// ============================================================================
// AUTO-INITIALIZATION
// ============================================================================

// Initialize the unified registry when this module is imported
// This ensures all existing functionality continues to work
// Export registry instances for external access
export { categoryRegistry } from "./category";
export { inspectorRegistry } from "./inspector";
export { nodeRegistry } from "./node";

// Initialize when module loads
initializeUnifiedRegistry();
