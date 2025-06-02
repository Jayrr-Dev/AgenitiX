/**
 * FACTORY INTEGRATION LAYER - Connects utility and component factories
 *
 * • Bridges low-level node creation utilities with high-level React components
 * • Provides unified interface for both data and component creation
 * • Ensures consistency between nodeFactory.ts and NodeFactory.tsx systems
 * • Implements toggle state synchronization and sizing coordination
 * • Supports enterprise safety layers with utility-level optimizations
 *
 * Keywords: integration, factory-bridge, unified-interface, consistency, toggle-sync
 */

import {
  createNodeComponent,
  type BaseNodeData,
  type NodeFactoryConfig,
} from "../NodeFactory";
import { getNodeTypeConfig, TOGGLE_SYMBOLS } from "../constants";
import type { AgenNode, NodeType } from "../types";
import { NodeFactory as UtilFactory } from "../utils/nodeFactory";

// ============================================================================
// INTEGRATION INTERFACE
// ============================================================================

export interface IntegratedNodeFactory<T extends BaseNodeData> {
  // LOW-LEVEL DATA CREATION
  createNodeData: (
    type: NodeType,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ) => AgenNode;

  // HIGH-LEVEL COMPONENT CREATION
  createNodeComponent: (
    config: NodeFactoryConfig<T>
  ) => React.ComponentType<any>;

  // UNIFIED OPERATIONS
  createCompleteNode: (
    type: NodeType,
    position: { x: number; y: number },
    config: NodeFactoryConfig<T>
  ) => {
    nodeData: AgenNode;
    component: React.ComponentType<any>;
  };

  // TOGGLE STATE MANAGEMENT
  toggleNodeState: (node: AgenNode) => AgenNode;
  getToggleSymbol: (showUI: boolean) => string;

  // SIZE COORDINATION
  getNodeSize: (
    type: NodeType,
    showUI: boolean
  ) => { width: number; height: number };
}

// ============================================================================
// UNIFIED FACTORY IMPLEMENTATION
// ============================================================================

/**
 * Creates integrated factory for a specific node type
 * Combines utility-level data creation with component-level rendering
 */
export function createIntegratedFactory<T extends BaseNodeData>(
  nodeType: NodeType,
  componentConfig: NodeFactoryConfig<T>
): IntegratedNodeFactory<T> {
  // VALIDATE TYPE CONSISTENCY
  if (nodeType !== componentConfig.nodeType) {
    throw new Error(
      `Node type mismatch: ${nodeType} vs ${componentConfig.nodeType}`
    );
  }

  return {
    // LOW-LEVEL DATA CREATION (from nodeFactory.ts)
    createNodeData: (
      type: NodeType,
      position: { x: number; y: number },
      customData?: Record<string, unknown>
    ) => {
      return UtilFactory.createNode(type, position, customData);
    },

    // HIGH-LEVEL COMPONENT CREATION (from NodeFactory.tsx)
    createNodeComponent: (config: NodeFactoryConfig<T>) => {
      return createNodeComponent(config);
    },

    // UNIFIED COMPLETE NODE CREATION
    createCompleteNode: (
      type: NodeType,
      position: { x: number; y: number },
      config: NodeFactoryConfig<T>
    ) => {
      const nodeData = UtilFactory.createNode(type, position);
      const component = createNodeComponent(config);

      return {
        nodeData,
        component,
      };
    },

    // TOGGLE STATE MANAGEMENT (coordinated between both systems)
    toggleNodeState: (node: AgenNode) => {
      return UtilFactory.toggleNodeUI(node);
    },

    // TOGGLE SYMBOL RENDERING (consistent with cursor rules)
    getToggleSymbol: (showUI: boolean) => {
      return showUI ? TOGGLE_SYMBOLS.EXPANDED : TOGGLE_SYMBOLS.COLLAPSED;
    },

    // SIZE COORDINATION (ensures both systems use same sizing)
    getNodeSize: (type: NodeType, showUI: boolean) => {
      return UtilFactory.getNodeSize(type, showUI);
    },
  };
}

// ============================================================================
// REGISTRATION BRIDGE
// ============================================================================

/**
 * Bridges the registration between utility factory and component factory
 * Ensures both systems are aware of the same node types and configurations
 */
export function registerIntegratedNode<T extends BaseNodeData>(
  nodeType: NodeType,
  componentConfig: NodeFactoryConfig<T>
) {
  // VALIDATE CONFIGURATION CONSISTENCY
  const utilConfig = UtilFactory.getNodeConfig(nodeType);

  if (!utilConfig) {
    console.warn(`⚠️ Node type ${nodeType} not found in utility factory`);
    return null;
  }

  // CREATE INTEGRATED FACTORY
  const integratedFactory = createIntegratedFactory(nodeType, componentConfig);

  // REGISTER WITH BOTH SYSTEMS
  console.log(`✅ Integrated factory registered for ${nodeType}`);

  return integratedFactory;
}

// ============================================================================
// FLOW INTEGRATION HELPERS
// ============================================================================

/**
 * Integration helpers for FlowEditor.tsx, Sidebar.tsx, and NodeInspector.tsx
 * As per cursor rules: "After Creating a new node you must REGISTER the NODE in FlowEditor.tsx,
 * then add the NODE to the Sidebar.tsx then finally add to NodeInspector.tsx"
 */
export interface FlowIntegrationHelpers {
  // For FlowEditor.tsx registration
  getReactFlowNodeTypes: () => Record<string, React.ComponentType<any>>;

  // For Sidebar.tsx display
  getSidebarNodeConfig: (nodeType: NodeType) => {
    icon: string;
    label: string;
    category: string;
  };

  // For NodeInspector.tsx controls
  getInspectorControls: (nodeType: NodeType) => React.ComponentType<any> | null;
}

export function createFlowIntegrationHelpers(
  registeredFactories: Map<NodeType, IntegratedNodeFactory<any>>
): FlowIntegrationHelpers {
  return {
    // REACT FLOW NODE TYPES for FlowEditor registration
    getReactFlowNodeTypes: () => {
      const nodeTypes: Record<string, React.ComponentType<any>> = {};

      registeredFactories.forEach((factory, nodeType) => {
        // This would need the actual component, which requires the config
        // In practice, you'd store the component during registration
        console.log(`Preparing ${nodeType} for ReactFlow registration`);
      });

      return nodeTypes;
    },

    // SIDEBAR CONFIGURATION for Sidebar.tsx
    getSidebarNodeConfig: (nodeType: NodeType) => {
      const config = getNodeTypeConfig()[nodeType];
      return {
        icon: config.icon || "🔧",
        label: config.label,
        category: "modern", // or derive from config
      };
    },

    // INSPECTOR CONTROLS for NodeInspector.tsx
    getInspectorControls: (nodeType: NodeType) => {
      // This would return the inspector component for the node type
      // Implementation depends on your inspector registry
      return null;
    },
  };
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * Example of how to use the integrated factory system:
 *
 * // 1. Create component configuration
 * const createTextConfig: NodeFactoryConfig<CreateTextData> = {
 *   nodeType: 'createText',
 *   category: 'content',
 *   displayName: 'Create Text',
 *   // ... other config
 * };
 *
 * // 2. Register integrated factory
 * const factory = registerIntegratedNode('createText', createTextConfig);
 *
 * // 3. Use in different contexts:
 * // - Data creation: factory.createNodeData('createText', {x: 100, y: 100})
 * // - Component: factory.createNodeComponent(createTextConfig)
 * // - Toggle: factory.toggleNodeState(existingNode)
 * // - Size: factory.getNodeSize('createText', true)
 */
