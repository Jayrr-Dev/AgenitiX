'use client'



// React Core
import React, { memo, useEffect, useState, useMemo, useCallback, useRef } from 'react';

// External Libraries
import {
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react';

// Internal Stores
import { useFlowStore } from '../../stores/flowStore';
import { useVibeModeStore } from '../../stores/vibeModeStore';

// Internal Components
import CustomHandle from '../../handles/CustomHandle';
import { FloatingNodeId } from '../components/FloatingNodeId';
import { ExpandCollapseButton } from '../components/ExpandCollapseButton';

// Modular Utilities
import type { 
  BaseNodeData, 
  NodeFactoryConfig, 
  RelevantConnectionData,
  ErrorState,
  FilteredHandles
} from './types';
import { 
  DEFAULT_TEXT_NODE_SIZE,
  PROCESSING_THROTTLE_MS,
  ERROR_INJECTION_SUPPORTED_NODES 
} from './constants';
import { 
  isHeadNode,
  calculateHeadNodeActivation,
  calculateDownstreamNodeActivation 
} from './utils/propagationEngine';
import { 
  addJsonInputSupport,
  getJsonConnections,
  getJsonInputValues,
  hasJsonConnections,
  createJsonProcessingTracker,
  processJsonInput 
} from './utils/jsonProcessor';
import {
  registerNodeInspectorControls,
  registerNodeTypeConfig 
} from './registry/inspectorRegistry';

// Ultra-Fast Propagation Engine
import { useUltraFastPropagation } from './UltraFastPropagationEngine';

// Styling Hooks
import { 
  useNodeStyleClasses, 
  useNodeButtonTheme, 
  useNodeTextTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
} from '../../stores/nodeStyleStore';

// ============================================================================
// BULLETPROOF NODE BASE INTEGRATION
// ============================================================================

import { 
  createBulletproofNode, 
  type EnterpriseNodeConfig,
  useBulletproofNodeState
} from './core/BulletproofNodeBase';
import { useReactFlow } from '@xyflow/react';

// Re-export BulletproofNodeBase for enhanced nodes
export { createBulletproofNode, type EnterpriseNodeConfig } from './core/BulletproofNodeBase';

// ============================================================================
// BULLETPROOF SAFETY LAYERS (from FastReliableNodeBase)
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

// ============================================================================
// MAIN FACTORY FUNCTION
// ============================================================================

/**
 * CREATE NODE COMPONENT
 * Factory function that creates optimized React Flow node components
 */
export function createNodeComponent<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
// ============================================================================
  // REGISTRATION PHASE
// ============================================================================

  // Register node configuration for inspector compatibility
  registerNodeTypeConfig(config.nodeType, {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: !!config.renderInspectorControls,
    hasOutput: false,
  });

  // Register inspector controls if provided
  if (config.renderInspectorControls) {
    registerNodeInspectorControls(config.nodeType, config.renderInspectorControls);
  }

  // Automatically add JSON input support to all factory nodes
  const enhancedConfig = {
    ...config,
    handles: addJsonInputSupport(config.handles)
  };

  // ============================================================================
  // NODE COMPONENT DEFINITION
  // ============================================================================

  const NodeComponent = ({ id, data, selected }: NodeProps<Node<T & Record<string, unknown>>>) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const [showUI, setShowUI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isActive, setIsActive] = useState(false);
    
    // Processing throttle trackers
    const jsonProcessingTracker = useRef(createJsonProcessingTracker());
    const logicProcessingTracker = useRef(createJsonProcessingTracker());
    
    // Vibe Mode state - WITHOUT PERSISTENCE (for testing)
    const { isVibeModeActive, showJsonHandles } = useVibeModeStore();

    // ============================================================================
    // CONNECTION HANDLING WITH OPTIMIZATION
    // ============================================================================
    
    const connections = useNodeConnections({ handleType: 'target' });
    const inputHandles = useMemo(() => 
      enhancedConfig.handles.filter(h => h.type === 'target'), 
      [enhancedConfig.handles]
    );
    
    const sourceIds = useMemo(() => 
      connections
        .filter(c => inputHandles.some(h => h.id === c.targetHandle))
        .map(c => c.source),
      [connections, inputHandles]
    );
    
    const nodesData = useNodesData(sourceIds);
    const allNodes = useNodesData([]);

    // ============================================================================
    // MEMOIZED CONNECTION DATA
    // ============================================================================
    
    const relevantConnectionData: RelevantConnectionData = useMemo(() => ({
      connectionsSummary: connections.map(c => ({ 
        source: c.source, 
        target: c.target, 
        targetHandle: c.targetHandle,
        sourceHandle: c.sourceHandle
      })),
      nodeIds: sourceIds,
      nodeDataSummary: nodesData.map(node => ({
        id: node.id,
        isActive: node.data?.isActive as boolean | undefined,
        triggered: node.data?.triggered as boolean | undefined,
        value: node.data?.value,
        text: node.data?.text,
        output: node.data?.output
      }))
    }), [connections, sourceIds, nodesData]);

    // ============================================================================
    // ULTRA-FAST PROPAGATION SYSTEM
    // ============================================================================
    
    const { propagateUltraFast, enableGPUAcceleration } = useUltraFastPropagation(
      allNodes || [],
      connections,
      updateNodeData
    );

    // Enable GPU acceleration for high-frequency nodes
    useEffect(() => {
      const nodeType = enhancedConfig.nodeType;
      
      if (nodeType.includes('trigger') || 
          nodeType.includes('cycle') || 
          nodeType.includes('delay') ||
          nodeType.includes('pulse')) {
        enableGPUAcceleration([id]);
      }
    }, [id, enhancedConfig.nodeType, enableGPUAcceleration]);

    // ============================================================================
    // JSON INPUT PROCESSING
    // ============================================================================
    
    const processJsonInputs = useCallback(() => {
      if (!jsonProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)) {
        return;
      }
      
      if (!hasJsonConnections(connections, id)) {
            return;
          }
          
      const jsonInputValues = getJsonInputValues(connections, nodesData, id);
      
      jsonInputValues.forEach(jsonInput => {
        processJsonInput(jsonInput, data as T, updateNodeData, id);
      });
      
    }, [connections, nodesData, id, updateNodeData]);

    useEffect(() => {
      const hasJsonHandles = enhancedConfig.handles.some(h => 
        h.id === 'j' && h.type === 'target'
      );
      
      if (hasJsonHandles && hasJsonConnections(connections, id)) {
        processJsonInputs();
      }
    }, [
      processJsonInputs,
      connections.length,
      JSON.stringify(connections.map(c => ({ 
        source: c.source, 
        target: c.target, 
        targetHandle: c.targetHandle 
      }))),
      nodesData.length
    ]);

    // ============================================================================
    // OPTIMIZED PROPAGATION CALCULATION
    // ============================================================================
    
    const calculatedIsActive = useMemo(() => {
      try {
        const isHead = isHeadNode(connections, id);
        const previousIsActive = (data as any)?.isActive;
        
        // Quick check for instant deactivation
        const quickCheck = isHead 
          ? calculateHeadNodeActivation(enhancedConfig.nodeType, data as T, true)
          : calculateDownstreamNodeActivation(enhancedConfig.nodeType, data as T, connections, nodesData, id, true);
        
        const bypassCache = previousIsActive === true && quickCheck === false;
        
        if (isHead) {
          return calculateHeadNodeActivation(enhancedConfig.nodeType, data as T, bypassCache);
        } else {
          return calculateDownstreamNodeActivation(
            enhancedConfig.nodeType, 
            data as T, 
            connections, 
            nodesData, 
            id,
            bypassCache
          );
        }
      } catch (error) {
        console.error(`${enhancedConfig.nodeType} ${id} - Propagation calculation error:`, error);
        return false;
      }
    }, [
      id,
      enhancedConfig.nodeType,
      relevantConnectionData,
      nodesData,
      (data as any)?.triggered,
      (data as any)?.isManuallyActivated,
      (data as any)?.text,
      (data as any)?.value,
      (data as any)?.output,
      (data as any)?.result,
      (data as any)?.parsedJson,
      (data as any)?.parseError,
      (data as any)?.isOn,
      (data as any)?.phase,
      (data as any)?.pulsing,
      (data as any)?.displayedValues,
      (data as any)?.heldText, // Include heldText for input nodes like Create Text
      // Add stringified data to ensure we catch all changes
      JSON.stringify(data)
    ]);

    // ============================================================================
    // ACTIVATION STATE MANAGEMENT
    // ============================================================================
    
    useEffect(() => {
      if (isActive !== calculatedIsActive) {
        const isActivating = !isActive && calculatedIsActive;
        const isDeactivating = isActive && !calculatedIsActive;
        
        setIsActive(calculatedIsActive);
        
        if (isDeactivating) {
          console.log(`UFS ${enhancedConfig.nodeType} ${id}: DEACTIVATING - Using ultra-fast instant propagation`);
        } else if (isActivating) {
          console.log(`UFS ${enhancedConfig.nodeType} ${id}: ACTIVATING - Using ultra-fast smooth propagation`);
        }
        
        propagateUltraFast(id, calculatedIsActive);
      }
    }, [calculatedIsActive, isActive, id, propagateUltraFast]);

    // ============================================================================
    // MAIN PROCESSING LOGIC
    // ============================================================================
    
    useEffect(() => {
      // Bypass throttling for input nodes that need immediate text updates
      const isInputNode = enhancedConfig.nodeType === 'createText'; // Add other input nodes here if needed
      
      if (!isInputNode && !logicProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)) {
        return;
      }
      
      try {
        enhancedConfig.processLogic({
          id,
          data: data as T,
          connections: connections,
          nodesData,
          updateNodeData: (nodeId: string, updates: Partial<T>) => 
            updateNodeData(nodeId, updates as Partial<Record<string, unknown>>),
          setError
        });
        
        // Handle trigger/cycle node output value updates
        if (enhancedConfig.nodeType.toLowerCase().includes('trigger') || 
            enhancedConfig.nodeType.toLowerCase().includes('cycle')) {
          const outputValue = calculatedIsActive ? true : false;
          const currentOutputValue = (data as any)?.value;
          
          if (currentOutputValue !== outputValue) {
            const isOutputDeactivating = currentOutputValue === true && outputValue === false;
            
            updateNodeData(id, { value: outputValue } as Partial<Record<string, unknown>>);
            
            if (isOutputDeactivating) {
              console.log(`UFS Output ${enhancedConfig.nodeType} ${id}: INSTANT output deactivation`);
              propagateUltraFast(id, false);
            }
          }
        }
        
      } catch (processingError) {
        setIsActive(false);
        
        if ((data as any)?.isActive === true) {
          updateNodeData(id, { isActive: false } as Partial<Record<string, unknown>>);
        }
        
        console.error(`${enhancedConfig.nodeType} ${id} - Processing error:`, processingError);
        const errorMessage = processingError instanceof Error 
          ? processingError.message 
          : 'Processing error';
        setError(errorMessage);
      }
    }, [
      id,
      relevantConnectionData,
      nodesData,
      enhancedConfig.nodeType,
      enhancedConfig.processLogic,
      calculatedIsActive,
      updateNodeData,
      propagateUltraFast,
      (data as any)?.heldText
    ]);

    // ============================================================================
    // ERROR RECOVERY
    // ============================================================================
    
    useEffect(() => {
      if (error && !isRecovering && 
          enhancedConfig.nodeType !== 'testJson' && 
          enhancedConfig.nodeType !== 'testError') {
        if (!data?.error) {
          setError(null);
        }
      }
    }, [error, isRecovering, enhancedConfig.nodeType]);

    const recoverFromError = useCallback(() => {
      try {
        setIsRecovering(true);
        setError(null);
        
        const recoveryData = {
          ...enhancedConfig.defaultData,
          ...enhancedConfig.errorRecoveryData,
          error: null,
          isActive: false
        };
        
        updateNodeData(id, recoveryData);
        setTimeout(() => setIsRecovering(false), 1000);
      } catch (recoveryError) {
        console.error(`${enhancedConfig.nodeType} ${id} - Recovery failed:`, recoveryError);
        setError('Recovery failed. Please refresh.');
        setIsRecovering(false);
      }
    }, [id, enhancedConfig, updateNodeData]);

    // ============================================================================
    // MEMOIZED STYLING AND STATE CALCULATIONS
    // ============================================================================
    
    const nodeSize = useMemo(() => 
      enhancedConfig.size || DEFAULT_TEXT_NODE_SIZE, 
      [enhancedConfig.size]
    );
    
    const errorState: ErrorState = useMemo(() => {
      const supportsErrorInjection = ERROR_INJECTION_SUPPORTED_NODES.includes(
        enhancedConfig.nodeType as any
      );
      const hasVibeError = supportsErrorInjection && (data as any)?.isErrorState === true;
      const vibeErrorType = (data as any)?.errorType || 'error';
      const finalErrorForStyling = error || hasVibeError;
      const finalErrorType = error ? 'local' : vibeErrorType;
      
      return { supportsErrorInjection, hasVibeError, finalErrorForStyling, finalErrorType };
    }, [enhancedConfig.nodeType, error, data]);
    
    // Styling hooks
    const nodeStyleClasses = useNodeStyleClasses(!!selected, !!errorState.finalErrorForStyling, isActive);
    const buttonTheme = useNodeButtonTheme(!!errorState.finalErrorForStyling, isActive);
    const textTheme = useNodeTextTheme(!!errorState.finalErrorForStyling);
    const categoryBaseClasses = useNodeCategoryBaseClasses(enhancedConfig.nodeType);
    const categoryButtonTheme = useNodeCategoryButtonTheme(enhancedConfig.nodeType, !!errorState.finalErrorForStyling, isActive);
    const categoryTextTheme = useNodeCategoryTextTheme(enhancedConfig.nodeType, !!errorState.finalErrorForStyling);

    // Handle filtering
    const { inputHandlesFiltered, outputHandles }: FilteredHandles = useMemo(() => {
      const inputHandlesFiltered = enhancedConfig.handles
        .filter(handle => handle.type === 'target')
        .filter(handle => {
          if (handle.dataType === 'j') {
            const hasJsonConnection = connections.some(c => c.targetHandle === handle.id);
            const hasJsonSources = allNodes.some(node => 
              node.type === 'testJson' || 
              node.type === 'testError' ||
              (node.data && (node.data.json !== undefined || node.data.parsedJson !== undefined))
            );
            
            // PRIORITY ORDER for JSON handle visibility:
            // 1. ALWAYS show if already connected (don't break existing connections)
            // 2. Show if showJsonHandles is explicitly enabled (X button state)
            // 3. Show if Vibe Mode is active (legacy support)
            // 4. Show if there are JSON sources in the flow (smart auto-show)
            return hasJsonConnection ||           // Priority 1: Connected = always visible
                   showJsonHandles ||           // Priority 2: X button state
                   isVibeModeActive ||          // Priority 3: Vibe Mode legacy
                   hasJsonSources;                  // Priority 4: Smart auto-show
          }
          return true;
        });
      
      const outputHandles = enhancedConfig.handles.filter(handle => handle.type === 'source');
      
      return { inputHandlesFiltered, outputHandles };
    }, [enhancedConfig.handles, connections, showJsonHandles, isVibeModeActive, allNodes]);

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
      <div 
        data-id={id}
        className={`relative ${
          showUI 
            ? `px-4 py-3 ${nodeSize.expanded.width}` 
            : `${nodeSize.collapsed.width} ${nodeSize.collapsed.height} flex items-center justify-center`
        } rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}>
        
        {/* FLOATING NODE ID */}
        <FloatingNodeId nodeId={id} />
        
        {/* EXPAND/COLLAPSE BUTTON */}
        <ExpandCollapseButton
          showUI={showUI}
          onToggle={() => setShowUI((v) => !v)}
          className={`${errorState.finalErrorForStyling ? buttonTheme : categoryButtonTheme}`}
        />

        {/* INPUT HANDLES */}
        {inputHandlesFiltered.map(handle => (
          <CustomHandle
            key={handle.id}
            type="target"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
          />
        ))}
        
        {/* COLLAPSED STATE */}
        {!showUI && enhancedConfig.renderCollapsed({
          data: data as T,
          error: errorState.supportsErrorInjection && errorState.finalErrorForStyling ? 
            (error || (data as any)?.error || 'Error state active') : error,
          nodeType: enhancedConfig.nodeType,
          updateNodeData,
          id
        })}

        {/* EXPANDED STATE */}
        {showUI && enhancedConfig.renderExpanded({
          data: data as T,
          error: errorState.supportsErrorInjection && errorState.finalErrorForStyling ? 
            (error || (data as any)?.error || 'Error state active') : error,
          nodeType: enhancedConfig.nodeType,
          categoryTextTheme,
          textTheme,
          updateNodeData,
          id
        })}

        {/* OUTPUT HANDLES */}
        {outputHandles.map(handle => (
          <CustomHandle
            key={handle.id}
            type="source"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
          />
        ))}
      </div>
    );
  };

  // Add display name for debugging
  NodeComponent.displayName = enhancedConfig.displayName;

  // Wrap in React.memo for optimal performance
  return memo(NodeComponent);
}

// ============================================================================
// HELPER EXPORTS - Re-export from modules for backward compatibility
// ============================================================================

// Export types
export type { 
  BaseNodeData, 
  NodeFactoryConfig, 
  HandleConfig, 
  InspectorControlProps 
} from './types';

// Export helper functions
export { 
  createTextNodeConfig,
  createLogicNodeConfig,
  createUniversalNodeConfig,
  createTriggeredNodeConfig,
} from './helpers/nodeConfigHelpers';

// Export inspector control helpers  
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

// Export JSON utilities
export { 
  addJsonInputSupport,
  processJsonInput,
} from './utils/jsonProcessor';

// Export registry functions
export {
  registerNodeInspectorControls,
  getNodeInspectorControls,
  hasFactoryInspectorControls,
  NODE_INSPECTOR_REGISTRY
} from './registry/inspectorRegistry';

// Export cache utilities for memory cleanup
export {
  calculationCache,
  debouncedUpdates
} from './utils/cacheManager';

// ============================================================================
// ENHANCED SAFETY LAYER VISUAL STYLES (GPU ACCELERATED)
// ============================================================================

// Add CSS for enhanced safety layer instant visual feedback
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const safetyStyleSheet = document.createElement('style');
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
    
    [data-safe-factory="true"] {
      will-change: transform, opacity, box-shadow;
      transform: translateZ(0);
    }
    
    /* Safety indicator styling */
    [data-safe-factory="true"] .safety-indicator {
      background: linear-gradient(45deg, #10B981, #059669);
      border: 1px solid rgba(16, 185, 129, 0.3);
      backdrop-filter: blur(4px);
    }
  `;

  if (!document.getElementById('safe-factory-styles')) {
    safetyStyleSheet.id = 'safe-factory-styles';
    document.head.appendChild(safetyStyleSheet);
  }
}