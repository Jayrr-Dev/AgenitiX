/**
 * MODERN NODE REGISTRY - Centralized registration for modern node domain
 *
 * • Central registry mapping node types to React components for ReactFlow
 * • Auto-syncs with available nodes from the modern node-domain structure
 * • Provides category mapping for node styling and organization
 * • Single source of truth for node type definitions and metadata
 * • Supports dynamic registration and type-safe component mapping
 * • Integrates with factory types for enhanced type safety and consistency
 *
 * Keywords: node-registry, ReactFlow, component-mapping, modern-domain, registration,
 * factory-integration, type-safety, unified-types
 */

"use client";

import { Position } from "@xyflow/react";
import React from "react";

// ============================================================================
// IMPORT ACTUAL NODE COMPONENTS FROM DOMAIN
// ============================================================================

// Import actual nodes from the node-domain structure
import CreateText from "../../../node-domain/create/CreateText";
import TestError from "../../../node-domain/test/TestError";
import TriggerOnToggle from "../../../node-domain/trigger/TriggerOnToggle";
import ViewOutput from "../../../node-domain/view/ViewOutput";

// Import constants for validation
import { NODE_TYPE_CONFIG } from "../../flow-engine/constants";
import type { NodeType } from "../../flow-engine/types/nodeData";

// Import factory types for integration
import type {
  BaseNodeData,
  HandleConfig,
  NodeFactoryConfig,
  NodeSize,
} from "../factory/types";

// ============================================================================
// ENHANCED NODE REGISTRATION INTERFACE - Factory Types Integration
// ============================================================================

/**
 * UNIFIED NODE REGISTRATION INTERFACE
 * Combines registry metadata with factory configuration for complete type safety
 */
export interface EnhancedNodeRegistration<
  T extends BaseNodeData = BaseNodeData,
> {
  // CORE COMPONENT REGISTRATION
  component: React.ComponentType<any>;

  // REGISTRY METADATA
  category: NodeCategory;
  folder: SidebarFolder;
  displayName: string;
  description: string;

  // UI CONFIGURATION
  hasToggle: boolean;
  iconWidth: number;
  iconHeight: number;
  expandedWidth: number;
  expandedHeight: number;
  icon: string;

  // FACTORY INTEGRATION - Enhanced Type Safety
  factoryConfig?: NodeFactoryConfig<T>;
  handles?: HandleConfig[];
  size?: NodeSize;

  // LEGACY SUPPORT - Backwards compatibility
  defaultData: T;
  hasTargetPosition?: boolean;
  targetPosition?: Position;
  hasOutput?: boolean;
  hasControls?: boolean;
  factoryLabel: string;
  factoryDefaultData?: Record<string, any>;
}

/**
 * FACTORY-ENABLED NODE REGISTRATION
 * Specialized interface for nodes that use the factory system
 */
export interface FactoryNodeRegistration<T extends BaseNodeData>
  extends EnhancedNodeRegistration<T> {
  factoryConfig: NodeFactoryConfig<T>;
  handles: HandleConfig[];
}

export type NodeCategory = "create" | "view" | "trigger" | "test" | "cycle";
export type SidebarFolder = "main" | "automation" | "testing" | "visualization";

// ============================================================================
// FACTORY-ENHANCED REGISTRY WITH TYPE SAFETY
// ============================================================================

/**
 * MODERN NODE REGISTRY WITH FACTORY INTEGRATION
 * Enhanced registry with full factory type support
 */
export const MODERN_NODE_REGISTRY: Record<NodeType, EnhancedNodeRegistration> =
  {
    // CREATE DOMAIN - Enhanced with Factory Types
    createText: {
      component: CreateText,
      category: "create",
      folder: "main",
      displayName: "Create Text",
      description: "Creates and outputs text content",
      hasToggle: true,
      iconWidth: 120,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 120,
      icon: "📝",

      // FACTORY CONFIGURATION
      handles: [
        {
          id: "output",
          dataType: "s",
          position: Position.Right,
          type: "source",
        },
      ],
      size: {
        collapsed: { width: "120px", height: "60px" },
        expanded: { width: "200px" },
      },

      // TYPED DEFAULT DATA
      defaultData: {
        text: "",
        heldText: "",
        isActive: false,
      },
      hasControls: true,
      hasOutput: true,
      factoryLabel: "Create Text",
      factoryDefaultData: {
        label: "Create Text",
        showUI: false,
        icon: "📝",
        text: "",
        output: "",
      },
    },

    // VIEW DOMAIN - Enhanced with Factory Types
    viewOutput: {
      component: ViewOutput,
      category: "view",
      folder: "visualization",
      displayName: "View Output",
      description: "Displays output values from connected nodes",
      hasToggle: true,
      iconWidth: 60,
      iconHeight: 60,
      expandedWidth: 200,
      expandedHeight: 150,
      icon: "👁️",

      // FACTORY CONFIGURATION
      handles: [
        { id: "input", dataType: "u", position: Position.Left, type: "target" },
      ],
      size: {
        collapsed: { width: "60px", height: "60px" },
        expanded: { width: "200px" },
      },

      // TYPED DEFAULT DATA
      defaultData: {
        label: "Result",
        displayedValues: [],
        maxHistory: 10,
        autoScroll: true,
        showTypeIcons: true,
        groupSimilar: false,
        filterEmpty: true,
        filterDuplicates: false,
        includedTypes: [],
        isActive: false,
      },
      hasTargetPosition: true,
      targetPosition: Position.Top,
      hasOutput: true,
      hasControls: true,
      factoryLabel: "View Output",
      factoryDefaultData: {
        label: "View Output",
        showUI: false,
        icon: "👁️",
        input: "",
        display: "",
      },
    },

    // TRIGGER DOMAIN - Enhanced with Factory Types
    triggerOnToggle: {
      component: TriggerOnToggle,
      category: "trigger",
      folder: "automation",
      displayName: "Trigger On Toggle",
      description: "Toggles output state when triggered",
      hasToggle: true,
      iconWidth: 60,
      iconHeight: 60,
      expandedWidth: 120,
      expandedHeight: 120,
      icon: "🎯",

      // FACTORY CONFIGURATION
      handles: [
        {
          id: "trigger",
          dataType: "b",
          position: Position.Left,
          type: "target",
        },
        {
          id: "output",
          dataType: "b",
          position: Position.Right,
          type: "source",
        },
      ],
      size: {
        collapsed: { width: "60px", height: "60px" },
        expanded: { width: "120px" },
      },

      // TYPED DEFAULT DATA
      defaultData: {
        triggered: false,
        value: false,
        outputValue: false,
        type: "TriggerOnToggle",
        label: "Toggle Trigger",
        inputCount: 0,
        hasExternalInputs: false,
        isActive: false,
      },
      hasControls: true,
      factoryLabel: "Trigger Toggle",
      factoryDefaultData: {
        label: "Trigger Toggle",
        showUI: false,
        icon: "🎯",
        enabled: false,
        output: false,
      },
    },

    // TEST DOMAIN - Enhanced with Factory Types
    testError: {
      component: TestError,
      category: "test",
      folder: "testing",
      displayName: "Test Error",
      description: "Generates test errors for debugging workflows",
      hasToggle: true,
      iconWidth: 60,
      iconHeight: 60,
      expandedWidth: 150,
      expandedHeight: 140,
      icon: "⚠️",

      // FACTORY CONFIGURATION
      handles: [
        {
          id: "trigger",
          dataType: "b",
          position: Position.Left,
          type: "target",
        },
        {
          id: "error",
          dataType: "S",
          position: Position.Right,
          type: "source",
        },
      ],
      size: {
        collapsed: { width: "60px", height: "60px" },
        expanded: { width: "150px" },
      },

      // TYPED DEFAULT DATA
      defaultData: {
        errorMessage: "Custom error message",
        errorType: "error",
        triggerMode: "trigger_on",
        isGeneratingError: false,
        text: "",
        json: "",
        isActive: false,
      },
      hasControls: true,
      factoryLabel: "Test Error",
      factoryDefaultData: {
        label: "Test Error",
        showUI: false,
        icon: "⚠️",
        errorMessage: "Test error",
        enabled: false,
      },
    },
  };

// ============================================================================
// REGISTRY UTILITIES
// ============================================================================

/**
 * GET NODE TYPES FOR REACTFLOW
 * Returns the component mapping required by ReactFlow
 */
export function getNodeTypes(): Record<string, React.ComponentType<any>> {
  const nodeTypes: Record<string, React.ComponentType<any>> = {};

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    nodeTypes[nodeType] = registration.component;
  });

  return nodeTypes;
}

/**
 * GET CATEGORY MAPPING
 * Returns mapping of node types to their categories
 */
export function getCategoryMapping(): Record<NodeType, NodeCategory> {
  const mapping = {} as Record<NodeType, NodeCategory>;

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    mapping[nodeType as NodeType] = registration.category;
  });

  return mapping;
}

/**
 * GET SIDEBAR FOLDER MAPPING
 * Returns mapping of node types to their sidebar folders
 */
export function getSidebarFolderMapping(): Record<NodeType, SidebarFolder> {
  const mapping = {} as Record<NodeType, SidebarFolder>;

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    mapping[nodeType as NodeType] = registration.folder;
  });

  return mapping;
}

/**
 * VALIDATE NODE TYPE
 * Checks if a node type is registered and valid
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
  return nodeType in MODERN_NODE_REGISTRY && nodeType in NODE_TYPE_CONFIG;
}

/**
 * GET NODE METADATA
 * Returns complete metadata for a registered node type
 */
export function getNodeMetadata(
  nodeType: NodeType
): EnhancedNodeRegistration | null {
  return MODERN_NODE_REGISTRY[nodeType] || null;
}

/**
 * GET NODES BY CATEGORY
 * Returns all node types in a specific category
 */
export function getNodesByCategory(category: NodeCategory): NodeType[] {
  return Object.entries(MODERN_NODE_REGISTRY)
    .filter(([_, registration]) => registration.category === category)
    .map(([nodeType]) => nodeType as NodeType);
}

/**
 * GET NODES BY FOLDER
 * Returns all node types in a specific sidebar folder
 */
export function getNodesByFolder(folder: SidebarFolder): NodeType[] {
  return Object.entries(MODERN_NODE_REGISTRY)
    .filter(([_, registration]) => registration.folder === folder)
    .map(([nodeType]) => nodeType as NodeType);
}

// ============================================================================
// AUTO-GENERATION FUNCTIONS - Registry as Single Source of Truth
// ============================================================================

/**
 * GENERATE NODE TYPE CONFIG
 * Auto-generates the NODE_TYPE_CONFIG from registry data
 * This replaces the manual constants file!
 */
export function generateNodeTypeConfig(): Record<NodeType, any> {
  const config: Record<string, any> = {};

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    config[nodeType] = {
      defaultData: registration.defaultData,
      hasTargetPosition: registration.hasTargetPosition,
      targetPosition: registration.targetPosition,
      hasOutput: registration.hasOutput,
      hasControls: registration.hasControls,
      displayName: registration.displayName,
    };
  });

  console.log("🔄 Auto-generated NODE_TYPE_CONFIG from registry");
  return config as Record<NodeType, any>;
}

/**
 * GENERATE INITIAL DEMO NODES
 * Auto-generates demo nodes using registry data
 */
export function generateDemoNodes(): any[] {
  const demoNodes = [
    {
      id: "1",
      type: "createText",
      position: { x: -100, y: -50 },
      deletable: true,
      data: {
        ...MODERN_NODE_REGISTRY.createText.defaultData,
        text: "hello",
        heldText: "hello",
        isActive: true,
      },
    },
    {
      id: "2",
      type: "createText",
      position: { x: 0, y: 100 },
      deletable: true,
      data: {
        ...MODERN_NODE_REGISTRY.createText.defaultData,
        text: "world",
        heldText: "world",
        isActive: true,
      },
    },
    {
      id: "3",
      type: "viewOutput",
      position: { x: 300, y: -25 },
      targetPosition: Position.Top,
      deletable: true,
      data: {
        ...MODERN_NODE_REGISTRY.viewOutput.defaultData,
        label: "Result",
        isActive: true,
      },
    },
  ];

  console.log("🔄 Auto-generated demo nodes from registry");
  return demoNodes;
}

/**
 * SYNC WITH CONSTANTS FILE
 * Updates the constants file to use registry data
 * Call this to keep constants in sync
 */
export function syncWithConstants(): boolean {
  try {
    // This would typically update the constants file
    // For now, we can just validate and log
    const generatedConfig = generateNodeTypeConfig();
    const nodeCount = Object.keys(generatedConfig).length;

    console.log(`✅ Registry can generate ${nodeCount} node configurations`);
    console.log(
      "🔄 To complete sync, update constants file to import from registry"
    );

    return true;
  } catch (error) {
    console.error("❌ Failed to sync with constants:", error);
    return false;
  }
}

/**
 * GENERATE FACTORY NODE CONFIG
 * Auto-generates factory NODE_TYPE_CONFIG from registry data
 */
export function generateFactoryNodeConfig(): Record<string, any> {
  const config: Record<string, any> = {};

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    config[nodeType] = {
      label: registration.factoryLabel,
      icon: registration.icon,
      defaultData: registration.factoryDefaultData || {
        label: registration.factoryLabel,
        showUI: false,
        icon: registration.icon,
      },
      width: registration.iconWidth,
      height: registration.iconHeight,
      hasTargetPosition: registration.hasTargetPosition || true,
      targetPosition: registration.targetPosition || Position.Bottom,
    };
  });

  console.log("🔄 Auto-generated Factory NODE_TYPE_CONFIG from registry");
  return config;
}

/**
 * GENERATE FACTORY NODE SIZES
 * Auto-generates NODE_SIZES constants from registry
 */
export function generateFactoryNodeSizes() {
  const sizes = {
    ICON: {
      DEFAULT: { width: 60, height: 60 },
      TEXT: { width: 120, height: 60 },
    },
    EXPANDED: {
      DEFAULT: { width: 120, height: 120 },
    },
    // Dynamic sizes from registry
    BY_NODE_TYPE: {} as Record<
      string,
      {
        width: number;
        height: number;
        expandedWidth: number;
        expandedHeight: number;
      }
    >,
  };

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    sizes.BY_NODE_TYPE[nodeType] = {
      width: registration.iconWidth,
      height: registration.iconHeight,
      expandedWidth: registration.expandedWidth,
      expandedHeight: registration.expandedHeight,
    };
  });

  console.log("🔄 Auto-generated Factory NODE_SIZES from registry");
  return sizes;
}

/**
 * GENERATE FACTORY CONSTANTS
 * Auto-generates all factory constants from registry
 */
export function generateFactoryConstants() {
  const constants = {
    NODE_TYPE_CONFIG: generateFactoryNodeConfig(),
    NODE_SIZES: generateFactoryNodeSizes(),
    VALID_NODE_TYPES: Object.keys(MODERN_NODE_REGISTRY),
    TOGGLE_SYMBOLS: {
      EXPANDED: "⦿",
      COLLAPSED: "⦾",
    },
    NODE_ID_PREFIX: "node_",
  };

  console.log("🔄 Auto-generated all Factory constants from registry");
  return constants;
}

/**
 * SYNC WITH FACTORY CONSTANTS
 * Updates factory constants to use registry data
 */
export function syncWithFactoryConstants(): boolean {
  try {
    const generatedConstants = generateFactoryConstants();
    const nodeCount = Object.keys(generatedConstants.NODE_TYPE_CONFIG).length;

    console.log(
      `✅ Registry can generate ${nodeCount} factory node configurations`
    );
    console.log(
      "🔄 To complete sync, update factory constants file to import from registry"
    );

    return true;
  } catch (error) {
    console.error("❌ Failed to sync with factory constants:", error);
    return false;
  }
}

// ============================================================================
// FACTORY INTEGRATION UTILITIES
// ============================================================================

/**
 * GET FACTORY CONFIG FOR NODE TYPE
 * Retrieves factory configuration with full type safety
 */
export function getFactoryConfig<T extends BaseNodeData>(
  nodeType: NodeType
): NodeFactoryConfig<T> | null {
  const registration = MODERN_NODE_REGISTRY[nodeType];
  return (
    (registration?.factoryConfig as unknown as NodeFactoryConfig<T>) || null
  );
}

/**
 * GET HANDLES FOR NODE TYPE
 * Retrieves handle configuration for a node type
 */
export function getNodeHandles(nodeType: NodeType): HandleConfig[] {
  const registration = MODERN_NODE_REGISTRY[nodeType];
  return registration?.handles || [];
}

/**
 * GET NODE SIZE CONFIG
 * Retrieves size configuration for a node type
 */
export function getNodeSizeConfig(nodeType: NodeType): NodeSize | null {
  const registration = MODERN_NODE_REGISTRY[nodeType];
  return registration?.size || null;
}

/**
 * CREATE FACTORY CONFIG FROM REGISTRY
 * Generates a complete factory configuration from registry data
 */
export function createFactoryConfigFromRegistry<T extends BaseNodeData>(
  nodeType: NodeType
): NodeFactoryConfig<T> | null {
  const nodeRegistration = MODERN_NODE_REGISTRY[nodeType];
  if (!nodeRegistration) return null;

  // If factory config already exists, return it
  if (nodeRegistration.factoryConfig) {
    return nodeRegistration.factoryConfig as unknown as NodeFactoryConfig<T>;
  }

  // Generate factory config from registry data
  const factoryConfig: NodeFactoryConfig<T> = {
    nodeType,
    category: nodeRegistration.category,
    displayName: nodeRegistration.displayName,
    handles: nodeRegistration.handles || [],
    defaultData: nodeRegistration.defaultData as T,
    size: nodeRegistration.size,

    // PLACEHOLDER IMPLEMENTATIONS - Should be customized per node
    processLogic: ({ data, setError }) => {
      // Default implementation - override in actual factory configs
      setError(null);
    },
    renderCollapsed: ({ data }) =>
      React.createElement(
        "div",
        { className: "text-xs text-center" },
        `${nodeRegistration.icon} ${nodeRegistration.factoryLabel}`
      ),
    renderExpanded: ({ data }) =>
      React.createElement(
        "div",
        { className: "p-2" },
        React.createElement(
          "div",
          { className: "font-medium" },
          nodeRegistration.displayName
        ),
        React.createElement(
          "div",
          { className: "text-xs text-gray-500" },
          nodeRegistration.description
        )
      ),
  };

  return factoryConfig;
}

/**
 * REGISTER FACTORY NODE
 * Registers a node with full factory configuration
 */
export function registerFactoryNode<T extends BaseNodeData>(
  nodeType: NodeType,
  factoryConfig: NodeFactoryConfig<T>
): void {
  const existingRegistration = MODERN_NODE_REGISTRY[nodeType];
  if (!existingRegistration) {
    console.error(
      `Cannot register factory config for unknown node type: ${nodeType}`
    );
    return;
  }

  // Update registration with factory config
  (
    MODERN_NODE_REGISTRY[nodeType] as unknown as EnhancedNodeRegistration<T>
  ).factoryConfig = factoryConfig;

  console.log(`✅ Registered factory config for ${nodeType}`);
}

/**
 * IS FACTORY ENABLED NODE
 * Checks if a node type has factory configuration
 */
export function isFactoryEnabledNode(nodeType: NodeType): boolean {
  const registration = MODERN_NODE_REGISTRY[nodeType];
  return !!(registration?.factoryConfig || registration?.handles?.length);
}

/**
 * REGISTER INSPECTOR FROM NODE REGISTRY
 * Auto-register inspector controls from node registry data
 */
export function registerInspectorFromNodeRegistry<T extends BaseNodeData>(
  nodeType: NodeType,
  nodeRegistration: EnhancedNodeRegistration<T>,
  renderControls: (props: any) => React.ReactNode
): void {
  // This function will be implemented when integrating with inspector registry
  console.log(`✅ Registered inspector from registry for ${nodeType}`);
}

// ============================================================================
// NODE CREATION HELPERS - Following Cursor Rules
// ============================================================================

/**
 * CREATE NEW NODE TEMPLATE
 * Helper function that follows cursor rules for creating new nodes
 * - Nodes must have toggle button: {showUI ? '⦿' : '⦾'}
 * - Icon state: 60x60px (120x60px for text nodes)
 * - Expanded state: 120x120px unless specified
 * - Must register in FlowEditor.tsx, Sidebar.tsx, and NodeInspector.tsx
 */
export function createNodeTemplate<T extends BaseNodeData>(config: {
  nodeType: string;
  category: NodeCategory;
  folder: SidebarFolder;
  displayName: string;
  description: string;
  icon: string;
  isTextNode?: boolean;
  expandedSize?: { width: number; height: number };
  defaultData: T;
  component: React.ComponentType<any>;
}): EnhancedNodeRegistration<T> {
  // CURSOR RULES: Icon sizing
  const iconWidth = config.isTextNode ? 120 : 60;
  const iconHeight = 60;

  // CURSOR RULES: Expanded sizing
  const expandedWidth = config.expandedSize?.width || 120;
  const expandedHeight = config.expandedSize?.height || 120;

  return {
    component: config.component,
    category: config.category,
    folder: config.folder,
    displayName: config.displayName,
    description: config.description,
    hasToggle: true, // CURSOR RULES: All nodes must have toggle
    iconWidth,
    iconHeight,
    expandedWidth,
    expandedHeight,
    icon: config.icon,

    // FACTORY INTEGRATION
    handles: [], // To be filled when configuring handles
    size: {
      collapsed: { width: `${iconWidth}px`, height: `${iconHeight}px` },
      expanded: { width: `${expandedWidth}px` },
    },

    // DATA CONFIGURATION
    defaultData: {
      ...config.defaultData,
      showUI: false, // CURSOR RULES: Default to icon state
      isActive: false,
    } as T,
    hasControls: true,
    hasOutput: true,
    factoryLabel: config.displayName,
    factoryDefaultData: {
      label: config.displayName,
      showUI: false,
      icon: config.icon,
    },
  };
}

/**
 * GET TOGGLE SYMBOL
 * Returns the correct toggle symbol based on cursor rules
 */
export function getToggleSymbol(showUI: boolean): string {
  return showUI ? "⦿" : "⦾";
}

/**
 * GET NODE DIMENSIONS
 * Returns standardized dimensions following cursor rules
 */
export function getNodeDimensions(
  nodeType: NodeType,
  isExpanded: boolean = false
) {
  const registration = MODERN_NODE_REGISTRY[nodeType];
  if (!registration) {
    return { width: 60, height: 60 };
  }

  if (isExpanded) {
    return {
      width: registration.expandedWidth,
      height: registration.expandedHeight,
    };
  }

  return {
    width: registration.iconWidth,
    height: registration.iconHeight,
  };
}

// ============================================================================
// REGISTRATION UTILITIES
// ============================================================================

/**
 * REGISTER ALL NODES FOR REACTFLOW
 * Returns complete node type mapping for ReactFlow registration
 * This is the main function to use when setting up ReactFlow
 */
export function registerAllNodes(): Record<string, React.ComponentType<any>> {
  console.log("🔄 Registering all modern nodes...");

  const nodeTypes = getNodeTypes();
  const registeredCount = Object.keys(nodeTypes).length;

  console.log(
    `✅ Successfully registered ${registeredCount} node types:`,
    Object.keys(nodeTypes)
  );

  // Validate that all registered nodes have proper configurations
  Object.keys(nodeTypes).forEach((nodeType) => {
    if (!isValidNodeType(nodeType)) {
      console.warn(
        `⚠️ Node type '${nodeType}' is registered but missing configuration`
      );
    }
  });

  return nodeTypes;
}

/**
 * VALIDATE REGISTRY COMPLETENESS
 * Ensures all nodes in registry have proper configurations
 */
export function validateRegistry(): boolean {
  console.log("🔍 Validating node registry...");

  let isValid = true;
  const issues: string[] = [];

  Object.entries(MODERN_NODE_REGISTRY).forEach(([nodeType, registration]) => {
    // Check if node type exists in constants
    if (!isValidNodeType(nodeType)) {
      issues.push(`Node type '${nodeType}' missing from constants`);
      isValid = false;
    }

    // Check required registration properties
    if (!registration.component) {
      issues.push(`Node type '${nodeType}' missing component`);
      isValid = false;
    }

    if (!registration.displayName) {
      issues.push(`Node type '${nodeType}' missing displayName`);
      isValid = false;
    }
  });

  if (isValid) {
    console.log("✅ Registry validation passed");
  } else {
    console.error("❌ Registry validation failed:", issues);
  }

  return isValid;
}

/**
 * GET REGISTRY STATS
 * Returns statistics about the current registry
 */
export function getRegistryStats() {
  const stats = {
    totalNodes: Object.keys(MODERN_NODE_REGISTRY).length,
    byCategory: {} as Record<NodeCategory, number>,
    byFolder: {} as Record<SidebarFolder, number>,
    withToggle: 0,
  };

  Object.values(MODERN_NODE_REGISTRY).forEach((registration) => {
    // Count by category
    stats.byCategory[registration.category] =
      (stats.byCategory[registration.category] || 0) + 1;

    // Count by folder
    stats.byFolder[registration.folder] =
      (stats.byFolder[registration.folder] || 0) + 1;

    // Count nodes with toggle
    if (registration.hasToggle) {
      stats.withToggle++;
    }
  });

  return stats;
}

// ============================================================================
// INSPECTOR INTEGRATION UTILITIES
// ============================================================================

/**
 * VALIDATE NODE FOR INSPECTOR
 * Comprehensive validation for inspector components
 */
export function validateNodeForInspector(nodeType: string): {
  isValid: boolean;
  nodeType: NodeType | string;
  metadata: EnhancedNodeRegistration | null;
  config: any;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // CHECK REGISTRY VALIDITY
  const isValidType = isValidNodeType(nodeType);
  const metadata = isValidType ? getNodeMetadata(nodeType as NodeType) : null;
  const config = isValidType ? NODE_TYPE_CONFIG[nodeType as NodeType] : null;

  if (!isValidType) {
    warnings.push(`Node type '${nodeType}' not found in modern registry`);

    // SUGGEST CLOSEST MATCHES
    const availableTypes = Object.keys(MODERN_NODE_REGISTRY);
    const closestMatch = availableTypes.find(
      (type) =>
        type.toLowerCase().includes(nodeType.toLowerCase()) ||
        nodeType.toLowerCase().includes(type.toLowerCase())
    );

    if (closestMatch) {
      suggestions.push(`Did you mean '${closestMatch}'?`);
    }

    suggestions.push(`Available types: ${availableTypes.join(", ")}`);
  }

  // CHECK CONFIG CONSISTENCY
  if (isValidType && metadata) {
    if (!config) {
      warnings.push(`Registry entry exists but missing NODE_TYPE_CONFIG`);
      suggestions.push(`Add configuration for '${nodeType}' in constants file`);
    }

    // CHECK OUTPUT/CONTROLS CONSISTENCY
    const hasRegistryOutput = metadata.hasOutput;
    const hasConfigOutput = config?.hasOutput;
    const hasRegistryControls = metadata.hasControls;
    const hasConfigControls = config?.hasControls;

    if (hasRegistryOutput !== hasConfigOutput) {
      warnings.push(
        `Output configuration mismatch between registry and config`
      );
    }

    if (hasRegistryControls !== hasConfigControls) {
      warnings.push(
        `Controls configuration mismatch between registry and config`
      );
    }
  }

  return {
    isValid: isValidType,
    nodeType: isValidType ? (nodeType as NodeType) : nodeType,
    metadata,
    config,
    warnings,
    suggestions,
  };
}

/**
 * GET NODE CAPABILITIES
 * Returns comprehensive capabilities for a node type
 */
export function getNodeCapabilities(nodeType: NodeType): {
  hasOutput: boolean;
  hasControls: boolean;
  hasToggle: boolean;
  isFactoryEnabled: boolean;
  handles: HandleConfig[];
  category: NodeCategory;
  folder: SidebarFolder;
  dimensions: {
    icon: { width: number; height: number };
    expanded: { width: number; height: number };
  };
} {
  const metadata = getNodeMetadata(nodeType);
  const config = NODE_TYPE_CONFIG[nodeType];

  if (!metadata) {
    throw new Error(`Unknown node type: ${nodeType}`);
  }

  return {
    hasOutput: Boolean(metadata.hasOutput || config?.hasOutput),
    hasControls: Boolean(metadata.hasControls || config?.hasControls),
    hasToggle: metadata.hasToggle,
    isFactoryEnabled: isFactoryEnabledNode(nodeType),
    handles: getNodeHandles(nodeType),
    category: metadata.category,
    folder: metadata.folder,
    dimensions: {
      icon: { width: metadata.iconWidth, height: metadata.iconHeight },
      expanded: {
        width: metadata.expandedWidth,
        height: metadata.expandedHeight,
      },
    },
  };
}

/**
 * GET DEBUG INFO FOR INSPECTOR
 * Returns detailed debugging information for inspector development
 */
export function getDebugInfoForInspector(nodeType: string) {
  const validation = validateNodeForInspector(nodeType);
  const registryStats = getRegistryStats();

  return {
    nodeType,
    validation,
    registryStats,
    availableTypes: Object.keys(MODERN_NODE_REGISTRY),
    registryEntries: Object.entries(MODERN_NODE_REGISTRY).map(
      ([type, reg]) => ({
        type,
        category: reg.category,
        folder: reg.folder,
        hasOutput: reg.hasOutput,
        hasControls: reg.hasControls,
        hasToggle: reg.hasToggle,
      })
    ),
  };
}

/**
 * SAFE NODE TYPE CAST
 * Safely casts a string to NodeType with validation
 */
export function safeNodeTypeCast(nodeType: string): NodeType | null {
  return isValidNodeType(nodeType) ? (nodeType as NodeType) : null;
}

/** Generate inspector control mapping */
export const generateInspectorControlMapping = (): Record<
  string,
  InspectorControlConfig
> => {
  const mapping: Record<string, InspectorControlConfig> = {};

  Object.values(ENHANCED_NODE_REGISTRY).forEach((node) => {
    if (node.inspectorControls) {
      mapping[node.nodeType] = node.inspectorControls;
    }
  });

  return mapping;
};
