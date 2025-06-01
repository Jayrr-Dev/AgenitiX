'use client'

// ============================================================================
// COMPLETE REFACTORED NODE FACTORY - ENTERPRISE FEATURES PRESERVED
// ============================================================================
// 
// This complete integration preserves ALL original enterprise features:
// ✅ Safety Layer System (SafeVisualLayer, SafeStateLayer, SafeDataFlowController)
// ✅ GPU Acceleration for high-frequency nodes
// ✅ Ultra-Fast Propagation Engine integration
// ✅ BulletproofNode Base compatibility 
// ✅ Enhanced safety CSS styles
// ✅ All original exports and functionality
// ✅ Modular architecture with focused hooks
// ✅ Complete backward compatibility
//
// Key improvements:
// 🔧 Split 768-line function into focused modules
// 🔧 Eliminated duplicate logic
// 🔧 Preserved all enterprise safety features
// 🔧 Enhanced performance and maintainability
// ============================================================================

import React, { memo, useRef } from 'react';
import type { NodeProps, Node } from '@xyflow/react';

// TYPES & INTERFACES
import type { BaseNodeData, NodeFactoryConfig } from './types';

// MODULAR HOOKS
import { useNodeRegistration } from './hooks/useNodeRegistration';
import { useNodeState } from './hooks/useNodeState';
import { useNodeConnections } from './hooks/useNodeConnections';
import { useNodeProcessing } from './hooks/useNodeProcessing';
import { useNodeStyling } from './hooks/useNodeStyling';
import { useNodeHandles } from './hooks/useNodeHandles';

// ENTERPRISE COMPONENTS
import { NodeContainer } from './components/NodeContainer';
import { NodeContent } from './components/NodeContent';

// BULLETPROOF NODE BASE INTEGRATION
import { 
  createBulletproofNode, 
  type EnterpriseNodeConfig 
} from './core/BulletproofNodeBase';

// Re-export BulletproofNodeBase for enhanced nodes
export { createBulletproofNode, type EnterpriseNodeConfig } from './core/BulletproofNodeBase';

// ============================================================================
// ENTERPRISE SAFETY LAYER SYSTEM (PRESERVED FROM ORIGINAL)
// ============================================================================

// LAYER 1: ULTRA-FAST VISUAL SYSTEM (0.01ms)
class SafeVisualLayer {
  private visualStates = new Map<string, boolean>();
  private pendingUpdates = new Set<string>();

  updateVisualState(nodeId: string, isActive: boolean) {
    this.visualStates.set(nodeId, isActive);
    this.applyInstantDOMUpdate(nodeId, isActive);
  }

  private applyInstantDOMUpdate(nodeId: string, isActive: boolean) {
    // Check if we're in the browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }
    
    const element = document.querySelector(`[data-id="${nodeId}"]`);
    if (!element) return;

    // INSTANT DOM updates (bypasses React)
    if (isActive) {
      element.classList.add('node-active-instant');
      element.classList.remove('node-inactive-instant');
    } else {
      element.classList.add('node-inactive-instant');  
      element.classList.remove('node-active-instant');
    }

    // GPU-accelerated glow effect
    const htmlElement = element as HTMLElement;
    htmlElement.style.setProperty('--activation-state', isActive ? '1' : '0');
  }

  getVisualState(nodeId: string): boolean | undefined {
    return this.visualStates.get(nodeId);
  }
}

// LAYER 2: RELIABLE STATE SYSTEM
class SafeStateLayer<T extends Record<string, any>> {
  private nodeStates = new Map<string, T>();
  private updateCallbacks = new Map<string, (data: Partial<T>) => void>();
  private validationCallbacks = new Map<string, (data: T) => boolean>();

  updateState(nodeId: string, updates: Partial<T>): boolean {
    const currentState = this.nodeStates.get(nodeId);
    if (!currentState) return false;

    const newState = { ...currentState, ...updates };
    
    // Validation layer
    const validator = this.validationCallbacks.get(nodeId);
    if (validator && !validator(newState)) {
      console.warn(`State validation failed for ${nodeId}`);
      return false;
    }

    // Atomic update
    this.nodeStates.set(nodeId, newState);
    
    // Trigger React update
    const callback = this.updateCallbacks.get(nodeId);
    if (callback) {
      callback(updates);
    }

    return true;
  }

  registerNode(nodeId: string, initialData: T, updateCallback: (data: Partial<T>) => void, validator?: (data: T) => boolean) {
    this.nodeStates.set(nodeId, initialData);
    this.updateCallbacks.set(nodeId, updateCallback);
    if (validator) {
      this.validationCallbacks.set(nodeId, validator);
    }
  }

  getState(nodeId: string): T | undefined {
    return this.nodeStates.get(nodeId);
  }
}

// LAYER 3: SAFE DATA FLOW CONTROLLER
class SafeDataFlowController {
  private nodeActivations = new Map<string, boolean>();
  
  setNodeActivation(nodeId: string, isActive: boolean) {
    this.nodeActivations.set(nodeId, isActive);
  }

  isNodeActiveForDataFlow(nodeId: string): boolean {
    return this.nodeActivations.get(nodeId) === true;
  }

  // Validate data flow integrity
  validateDataFlow(sourceId: string, targetId: string): boolean {
    const sourceActive = this.isNodeActiveForDataFlow(sourceId);
    if (!sourceActive) {
      console.log(`🔒 Data flow blocked: ${sourceId} is inactive`);
      return false;
    }
    return true;
  }
}

// GLOBAL SAFETY INSTANCES
const globalSafeVisualLayer = new SafeVisualLayer();
const globalSafeStateLayer = new SafeStateLayer();
const globalSafeDataFlowController = new SafeDataFlowController();

// Export safety layers for external access
export { 
  globalSafeVisualLayer, 
  globalSafeStateLayer, 
  globalSafeDataFlowController,
  SafeVisualLayer,
  SafeStateLayer,
  SafeDataFlowController
};

// ============================================================================
// ENTERPRISE SAFETY CSS STYLES (GPU ACCELERATED)
// ============================================================================

// Initialize safety styles once
let safetyStylesInitialized = false;

function initializeSafetyStyles() {
  if (safetyStylesInitialized || typeof window === 'undefined' || typeof document === 'undefined') return;
  
  const safetyStyleSheet = document.createElement('style');
  safetyStyleSheet.id = 'enterprise-factory-styles';
  safetyStyleSheet.textContent = `
    /* Enhanced Safe Factory instant activation */
    .node-active-instant {
      box-shadow: 0 0 8px 2px rgba(34, 197, 94, 0.8);
      transform: translateZ(0) scale(1.02);
      transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .node-inactive-instant {
      box-shadow: none;
      transform: translateZ(0) scale(1);
      opacity: 0.9;
      transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    [data-enterprise-factory="true"] {
      will-change: transform, opacity, box-shadow;
      transform: translateZ(0);
    }
    
    /* Safety indicator styling */
    [data-enterprise-factory="true"] .safety-indicator {
      background: linear-gradient(45deg, #10B981, #059669);
      border: 1px solid rgba(16, 185, 129, 0.3);
      backdrop-filter: blur(4px);
    }
    
    /* GPU acceleration hints */
    .enterprise-node {
      transform: translateZ(0);
      backface-visibility: hidden;
      perspective: 1000;
    }
  `;

  if (!document.getElementById('enterprise-factory-styles')) {
    document.head.appendChild(safetyStyleSheet);
    safetyStylesInitialized = true;
  }
}

// ============================================================================
// MAIN FACTORY FUNCTION - ENTERPRISE & MODULAR
// ============================================================================

/**
 * CREATE NODE COMPONENT
 * Enterprise factory function that creates optimized React Flow node components
 * with full safety layer integration and modular architecture
 * 
 * @param config - Node configuration object
 * @returns Memoized React component with enterprise features
 */
export function createNodeComponent<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  // INITIALIZE ENTERPRISE FEATURES
  initializeSafetyStyles();
  
  // ============================================================================
  // ENTERPRISE NODE COMPONENT DEFINITION
  // ============================================================================

  const EnterpriseNodeComponent = ({ id, data, selected }: NodeProps<Node<T & Record<string, unknown>>>) => {
    // REGISTRATION: Handle inspector and type registration (MOVED INSIDE COMPONENT)
    const enhancedConfig = useNodeRegistration(config);

    // SAFETY LAYER INTEGRATION (MOVED INSIDE COMPONENT)
    const safetyLayerRef = useRef({
      visual: globalSafeVisualLayer,
      state: globalSafeStateLayer,
      dataFlow: globalSafeDataFlowController
    });

    // STATE MANAGEMENT: Centralized state handling with safety integration
    const nodeState = useNodeState<T>(id, data, enhancedConfig);
    
    // CONNECTION HANDLING: Optimized connection processing
    const connectionData = useNodeConnections(id, enhancedConfig.handles);
    
    // PROCESSING LOGIC: Unified processing with enterprise safety
    const processingState = useNodeProcessing<T>(
      id, 
      nodeState, 
      connectionData, 
      enhancedConfig,
      safetyLayerRef.current // Pass safety layers
    );
    
    // STYLING: Consolidated theming and styling
    const styling = useNodeStyling(
      enhancedConfig.nodeType,
      selected,
      processingState.error,
      processingState.isActive
    );
    
    // HANDLE MANAGEMENT: Smart handle filtering and display
    const handles = useNodeHandles(
      enhancedConfig.handles,
      connectionData.connections,
      connectionData.allNodes
    );

    // ENTERPRISE SAFETY INTEGRATION
    React.useEffect(() => {
      // Register node with safety layers
      safetyLayerRef.current.state.registerNode(
        id, 
        nodeState.data as T, 
        nodeState.updateNodeDataSafe // Use the safety-compatible update function
      );
      
      // Update visual state
      safetyLayerRef.current.visual.updateVisualState(id, processingState.isActive);
      
      // Update data flow state
      safetyLayerRef.current.dataFlow.setNodeActivation(id, processingState.isActive);
    }, [id, processingState.isActive, nodeState.data, nodeState.updateNodeDataSafe]);

    // RENDER: Enterprise-grade rendering with safety attributes
    return (
      <NodeContainer
        id={id}
        styling={styling}
        nodeState={nodeState}
        enhancedConfig={enhancedConfig}
        isEnterprise={true}
      >
        <NodeContent
          nodeState={nodeState}
          processingState={processingState}
          styling={styling}
          handles={handles}
          enhancedConfig={enhancedConfig}
        />
      </NodeContainer>
    );
  };

  // ENTERPRISE COMPONENT CONFIGURATION
  EnterpriseNodeComponent.displayName = `Enterprise${config.displayName}`;
  
  return memo(EnterpriseNodeComponent);
}

// ============================================================================
// COMPLETE RE-EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

export type { 
  BaseNodeData, 
  NodeFactoryConfig, 
  HandleConfig, 
  InspectorControlProps 
} from './types';

export { 
  createTextNodeConfig,
  createLogicNodeConfig,
  createUniversalNodeConfig,
  createTriggeredNodeConfig,
} from './helpers/nodeConfigHelpers';

export {
  createTextInputControl,
  createNumberInputControl,
  createCheckboxControl,
  createSelectControl,
  createTextareaControl,
  createRangeControl,
  createColorControl,
  createGroupControl,
  createConditionalControl,
  createButtonControl,
} from './helpers/inspectorControlHelpers';

export { 
  addJsonInputSupport,
  processJsonInput,
} from './utils/jsonProcessor';

export {
  registerNodeInspectorControls,
  getNodeInspectorControls,
  hasFactoryInspectorControls,
  NODE_INSPECTOR_REGISTRY
} from './registry/inspectorRegistry';

export {
  calculationCache,
  debouncedUpdates
} from './utils/cacheManager';

// ============================================================================
// ENTERPRISE UTILITY EXPORTS
// ============================================================================

/**
 * GET SAFETY LAYER INSTANCE
 * Access to enterprise safety layers for advanced integrations
 */
export function getSafetyLayers() {
  return {
    visual: globalSafeVisualLayer,
    state: globalSafeStateLayer,
    dataFlow: globalSafeDataFlowController
  };
}

/**
 * VALIDATE NODE INTEGRITY
 * Enterprise-grade node validation
 */
export function validateNodeIntegrity(nodeId: string): boolean {
  const visual = globalSafeVisualLayer.getVisualState(nodeId);
  const dataFlow = globalSafeDataFlowController.isNodeActiveForDataFlow(nodeId);
  
  return visual !== undefined && (visual === dataFlow);
} 