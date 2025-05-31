import React, { memo, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import {
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
  type Connection,
} from '@xyflow/react';

// Store and utilities
import { useFlowStore } from '../../stores/flowStore';
import { useVibeModeStore } from '../../stores/vibeModeStore';
import CustomHandle from '../../handles/CustomHandle';
import { FloatingNodeId } from '../components/FloatingNodeId';
import { ExpandCollapseButton } from '../components/ExpandCollapseButton';

// Configuration registration
import { NODE_TYPE_CONFIG } from '../../flow-editor/constants';
import type { NodeTypeConfig } from '../../flow-editor/types';

// ULTRA-FAST PROPAGATION ENGINE
import { useUltraFastPropagation } from './UltraFastPropagationEngine';

// Styling hooks
import { 
  useNodeStyleClasses, 
  useNodeButtonTheme, 
  useNodeTextTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
  type NodeCategory
} from '../../stores/nodeStyleStore';

// ============================================================================
// BASE NODE FACTORY TYPES
// ============================================================================

export interface BaseNodeData {
  error?: string;
  isActive?: boolean; // Single source of truth: node should pass data
  [key: string]: any;
}

export interface HandleConfig {
  id: string;
  dataType: 's' | 'n' | 'b' | 'j' | 'a' | 'N' | 'f' | 'x' | 'u' | 'S' | '∅';
  position: Position;
  type: 'source' | 'target';
}

export interface NodeSize {
  collapsed: {
    width: string;
    height: string;
  };
  expanded: {
    width: string;
  };
}

export interface InspectorControlProps<T extends BaseNodeData> {
  node: { id: string; type: string; data: T };
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError?: (nodeId: string, message: string, type?: any, source?: string) => void;
  inspectorState?: {
    durationInput: string;
    setDurationInput: (value: string) => void;
    countInput: string;
    setCountInput: (value: string) => void;
    multiplierInput: string;
    setMultiplierInput: (value: string) => void;
    delayInput: string;
    setDelayInput: (value: string) => void;
  };
}

export interface NodeFactoryConfig<T extends BaseNodeData> {
  nodeType: string;
  category: NodeCategory;
  displayName: string;
  size?: NodeSize;
  handles: HandleConfig[];
  defaultData: T;
  processLogic: (props: {
    id: string;
    data: T;
    connections: any[];
    nodesData: any[];
    updateNodeData: (id: string, data: Partial<T>) => void;
    setError: (error: string | null) => void;
  }) => void;
  renderCollapsed: (props: {
    data: T;
    error: string | null;
    nodeType: string;
    updateNodeData: (id: string, data: Partial<T>) => void;
    id: string;
  }) => ReactNode;
  renderExpanded: (props: {
    data: T;
    error: string | null;
    nodeType: string;
    categoryTextTheme: any;
    textTheme: any;
    updateNodeData: (id: string, data: Partial<T>) => void;
    id: string;
  }) => ReactNode;
  renderInspectorControls?: (props: InspectorControlProps<T>) => ReactNode;
  errorRecoveryData?: Partial<T>;
}

// ============================================================================
// OPTIMIZED PROPAGATION UTILITIES
// ============================================================================

/**
 * OPTIMIZED PROPAGATION HELPERS
 * Extracted from the main component to avoid recalculation on every render
 */

// Cache for expensive calculations to avoid repeated work
const calculationCache = new Map<string, { result: boolean; timestamp: number }>();
const CACHE_TTL = 100; // Cache for 100ms to batch rapid updates

/**
 * MEMOIZED HEAD NODE CHECKER
 * Determines if a node is a head node (source/trigger) based on connections
 */
const isHeadNode = (connections: Connection[], nodeId: string): boolean => {
  const allInputConnections = connections.filter(c => c.target === nodeId);
  const nonJsonInputs = allInputConnections.filter(c => c.targetHandle !== 'j');
  return nonJsonInputs.length === 0;
};

/**
 * OPTIMIZED HEAD NODE ACTIVATION CALCULATOR
 * Calculates active state for head nodes using smart caching (bypasses cache for deactivation)
 */
const calculateHeadNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  bypassCache: boolean = false
): boolean => {
  const cacheKey = `head-${nodeType}-${JSON.stringify(data)}`;
  const cached = calculationCache.get(cacheKey);
  
  // INSTANT DEACTIVATION: Skip cache for immediate "off" response
  if (!bypassCache && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  let result = false;
  const currentData = data as any;

  // For trigger nodes (TriggerOn, TriggerOff, etc.)
  if (nodeType.toLowerCase().includes('trigger')) {
    result = !!(currentData?.triggered);
  }
  // For cycle nodes (CycleToggle, CyclePulse)
  else if (nodeType.toLowerCase().includes('cycle')) {
    result = !!(currentData?.isOn && (currentData?.triggered || currentData?.phase || currentData?.pulsing));
  }
  // For manual trigger nodes (TestError, etc.)
  else if (currentData?.isManuallyActivated !== undefined) {
    result = !!(currentData?.isManuallyActivated);
  }
  // Special handling for TestJson nodes
  else if (nodeType === 'testJson') {
    result = currentData?.parsedJson !== null && 
             currentData?.parsedJson !== undefined && 
             currentData?.parseError === null;
  }
  // For input/creation nodes (CreateText, etc.)
  else {
    const outputValue = currentData?.text !== undefined ? currentData.text :
                       currentData?.value !== undefined ? currentData.value :
                       currentData?.output !== undefined ? currentData.output :
                       currentData?.result !== undefined ? currentData.result :
                       undefined;
    
    result = outputValue !== undefined && outputValue !== null && outputValue !== '';
  }

  // Cache the result (but don't cache false results for instant deactivation)
  if (result || !bypassCache) {
    calculationCache.set(cacheKey, { result, timestamp: Date.now() });
  }
  
  return result;
};

/**
 * OPTIMIZED DOWNSTREAM NODE ACTIVATION CALCULATOR
 * Calculates active state for downstream nodes with smart caching (bypasses cache for deactivation)
 */
const calculateDownstreamNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  connections: Connection[],
  nodesData: any[],
  nodeId: string,
  bypassCache: boolean = false
): boolean => {
  const cacheKey = `downstream-${nodeId}-${connections.length}-${nodesData.map(n => n.id).join(',')}`;
  const cached = calculationCache.get(cacheKey);
  
  // INSTANT DEACTIVATION: Skip cache for immediate "off" response
  if (!bypassCache && cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.result;
  }

  // Get all source nodes connected to this node (excluding JSON inputs)
  const allInputConnections = connections.filter(c => c.target === nodeId);
  const nonJsonInputs = allInputConnections.filter(c => c.targetHandle !== 'j');
  const sourceNodeIds = nonJsonInputs.map(c => c.source);
  const sourceNodesData = nodesData.filter(node => sourceNodeIds.includes(node.id));
  
  if (sourceNodesData.length === 0) {
    const result = false;
    calculationCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
  
  // Check if ANY input node is active
  const hasActiveInput = sourceNodesData.some(sourceNode => {
    const sourceData = sourceNode.data || {};
    return !!(
      sourceData.isActive ||
      sourceData.triggered ||
      (sourceData.value !== undefined && sourceData.value !== null && sourceData.value !== '') ||
      (sourceData.text !== undefined && sourceData.text !== null && sourceData.text !== '') ||
      (sourceData.output !== undefined && sourceData.output !== null && sourceData.output !== '')
    );
  });
  
  let result = hasActiveInput;

  // SPECIAL CASE: Handle trigger inputs (boolean handle 'b')
  const triggerConnections = connections.filter(c => c.targetHandle === 'b' && c.target === nodeId);
  if (triggerConnections.length > 0) {
    const triggerSourceIds = triggerConnections.map(c => c.source);
    const triggerNodesData = nodesData.filter(node => triggerSourceIds.includes(node.id));
    
    const triggerAllows = triggerNodesData.some(triggerNode => {
      const triggerData = triggerNode.data || {};
      return !!(
        triggerData.triggered ||
        triggerData.isActive ||
        triggerData.value === true ||
        triggerData.output === true
      );
    });
    
    result = hasActiveInput && triggerAllows;
  }
  
  // ENHANCED: Special handling for transformation nodes (like uppercase)
  if (nodeType === 'turnToUppercase' || 
      nodeType.toLowerCase().includes('transform') || 
      nodeType.toLowerCase().includes('turn') ||
      nodeType.toLowerCase().includes('convert')) {
    // For transformation nodes, check if they have meaningful output
    const currentData = data as any;
    const hasOutput = !!(
      (currentData?.text !== undefined && currentData?.text !== null && currentData?.text !== '') ||
      (currentData?.value !== undefined && currentData?.value !== null && currentData?.value !== '') ||
      (currentData?.output !== undefined && currentData?.output !== null && currentData?.output !== '')
    );
    
    // Transformation nodes are active if they have input AND have produced output
    result = hasActiveInput && hasOutput;
    
    console.log(`UFS Debug ${nodeType} ${nodeId}: hasActiveInput=${hasActiveInput}, hasOutput=${hasOutput}, result=${result}`);
  }
  
  // Special handling for ViewOutput nodes
  if (nodeType === 'viewOutput') {
    if (!hasActiveInput) {
      result = false;
    } else {
      const displayedValues = (data as any)?.displayedValues;
      if (!Array.isArray(displayedValues) || displayedValues.length === 0) {
        result = false;
      } else {
        result = displayedValues.some(item => {
          const content = item.content;
          
          if (content === undefined || content === null || content === '') {
            return false;
          }
          
          if (typeof content === 'string' && content.trim() === '') {
            return false;
          }
          
          if (typeof content === 'object') {
            if (Array.isArray(content)) {
              return content.length > 0;
            }
            return Object.keys(content).length > 0;
          }
          
          return true;
        });
      }
    }
  }

  // Cache the result (but don't cache false results for instant deactivation)
  if (result || !bypassCache) {
    calculationCache.set(cacheKey, { result, timestamp: Date.now() });
  }
  
  return result;
};

/**
 * INSTANT DEACTIVATION + SMOOTH ACTIVATION UPDATE FUNCTION
 * Provides immediate feedback for turning OFF, smooth updates for turning ON
 */
const debouncedUpdates = new Map<string, ReturnType<typeof setTimeout>>();

const smartNodeUpdate = (
  nodeId: string,
  updateFn: () => void,
  isActivating: boolean,
  priority: 'instant' | 'smooth' = 'smooth'
) => {
  // INSTANT updates for deactivation or high priority
  if (!isActivating || priority === 'instant') {
    // Clear any pending debounced update
    const existingTimeout = debouncedUpdates.get(nodeId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      debouncedUpdates.delete(nodeId);
    }
    
    // Execute immediately for instant feedback
    updateFn();
    return;
  }
  
  // SMOOTH updates for activation (debounced)
  const existingTimeout = debouncedUpdates.get(nodeId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  const newTimeout = setTimeout(() => {
    updateFn();
    debouncedUpdates.delete(nodeId);
  }, 8); // Reduced to 8ms for faster activation
  
  debouncedUpdates.set(nodeId, newTimeout);
};

// Legacy function for backward compatibility
const debounceNodeUpdate = (
  nodeId: string,
  updateFn: () => void,
  delay: number = 8
) => {
  smartNodeUpdate(nodeId, updateFn, true, 'smooth');
};

// ============================================================================
// NODE INSPECTOR REGISTRY
// ============================================================================

// Global registry for factory-created node inspector controls
const NODE_INSPECTOR_REGISTRY = new Map<string, (props: InspectorControlProps<any>) => ReactNode>();

export const registerNodeInspectorControls = <T extends BaseNodeData>(
  nodeType: string, 
  renderControls: (props: InspectorControlProps<T>) => ReactNode
) => {
  NODE_INSPECTOR_REGISTRY.set(nodeType, renderControls);
};

export const getNodeInspectorControls = (nodeType: string) => {
  return NODE_INSPECTOR_REGISTRY.get(nodeType);
};

export const hasFactoryInspectorControls = (nodeType: string) => {
  return NODE_INSPECTOR_REGISTRY.has(nodeType);
};

// ============================================================================
// NODE CONFIGURATION REGISTRY
// ============================================================================

// Function to register node configuration
export const registerNodeTypeConfig = <T extends BaseNodeData>(
  nodeType: string,
  config: NodeFactoryConfig<T>
) => {
  const nodeConfig: NodeTypeConfig = {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: !!config.renderInspectorControls,
    hasOutput: false, // Could be made configurable in the future
  };

  // Dynamically add to NODE_TYPE_CONFIG
  (NODE_TYPE_CONFIG as any)[nodeType] = nodeConfig;
};

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

const DEFAULT_TEXT_NODE_SIZE: NodeSize = {
  collapsed: {
    width: 'w-[120px]',
    height: 'h-[60px]'
  },
  expanded: {
    width: 'w-[180px]'
  }
};

const DEFAULT_LOGIC_NODE_SIZE: NodeSize = {
  collapsed: {
    width: 'w-[60px]',
    height: 'h-[60px]'
  },
  expanded: {
    width: 'w-[120px]'
  }
};

// ============================================================================
// NODE FACTORY FUNCTION
// ============================================================================

export function createNodeComponent<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  // Register node configuration for inspector compatibility
  registerNodeTypeConfig(config.nodeType, config);

  // Register inspector controls if provided
  if (config.renderInspectorControls) {
    registerNodeInspectorControls(config.nodeType, config.renderInspectorControls);
  }

  // Automatically add JSON input support to all factory nodes
  const enhancedConfig = {
    ...config,
    handles: addJsonInputSupport(config.handles)
  };

  const NodeComponent = ({ id, data, selected }: NodeProps<Node<T & Record<string, unknown>>>) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const [showUI, setShowUI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isActive, setIsActive] = useState(false);
    
    // Vibe Mode state
    const { isVibeModeActive } = useVibeModeStore();

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
    
    // ULTRA-FAST PROPAGATION: Get all nodes for the propagation engine
    const allNodes = useNodesData([]);

    // OPTIMIZED: More selective memoization - only re-compute when actual meaningful data changes
    const relevantConnectionData = useMemo(() => ({
      connectionsSummary: connections.map(c => ({ 
        source: c.source, 
        target: c.target, 
        targetHandle: c.targetHandle,
        sourceHandle: c.sourceHandle
      })),
      nodeIds: sourceIds,
      nodeDataSummary: nodesData.map(node => ({
        id: node.id,
        isActive: node.data?.isActive,
        triggered: node.data?.triggered,
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

    // Enable GPU acceleration for frequently updating nodes
    useEffect(() => {
      const nodeType = enhancedConfig.nodeType;
      
      // Enable GPU acceleration for high-frequency nodes
      if (nodeType.includes('trigger') || 
          nodeType.includes('cycle') || 
          nodeType.includes('delay') ||
          nodeType.includes('pulse')) {
        enableGPUAcceleration([id]);
      }
    }, [id, enhancedConfig.nodeType, enableGPUAcceleration]);

    // ============================================================================
    // INSTANT JSON INPUT PROCESSING
    // ============================================================================
    
    const processJsonInputs = useCallback(() => {
      // Find all JSON input handles that can be used for data updates
      const jsonHandles = enhancedConfig.handles.filter((h: HandleConfig) => h.type === 'target' && h.dataType === 'j');
      const jsonHandleIds = jsonHandles.map(h => h.id);
      const allJsonHandleIds = jsonHandleIds.length > 0 ? jsonHandleIds : ['j'];
      
      // Look for connections to any JSON input handles
      const jsonConnections = connections.filter(c => allJsonHandleIds.includes(c.targetHandle || ''));
      if (jsonConnections.length === 0) return;
      
      // Get JSON data from connected nodes
      const jsonInputs = nodesData
        .filter(node => jsonConnections.some(c => c.source === node.id))
        .map(node => {
          const nodeData = node.data;
          return nodeData?.json || nodeData?.text || nodeData?.value || nodeData?.output || nodeData?.result;
        })
        .filter(input => input !== undefined && input !== null && input !== '');
      
      if (jsonInputs.length === 0) return;
      
      // Process each JSON input
      jsonInputs.forEach(jsonInput => {
        try {
          let parsedData;
          
          if (typeof jsonInput === 'object') {
            parsedData = jsonInput;
          } else if (typeof jsonInput === 'string') {
            parsedData = JSON.parse(jsonInput);
          } else {
            console.warn(`JSON Processing ${id}: Invalid JSON input type:`, typeof jsonInput);
            return;
          }
          
          if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
            console.warn(`JSON Processing ${id}: JSON input must be an object, got:`, typeof parsedData);
            return;
          }
          
          const { error: _, ...safeData } = parsedData;
          
          // OPTIMIZED: More efficient change detection
          const currentData = data as T;
          const hasChanges = Object.keys(safeData).some(key => {
            const newValue = safeData[key];
            const currentValue = currentData[key];
            
            if (typeof newValue === 'object' && typeof currentValue === 'object') {
              return JSON.stringify(newValue) !== JSON.stringify(currentValue);
            }
            return newValue !== currentValue;
          });
          
          if (hasChanges) {
            console.log(`JSON Processing ${id}: Applying JSON data:`, safeData);
            // INSTANT JSON updates - no debouncing to prevent delays
            updateNodeData(id, safeData);
          }
          
        } catch (parseError) {
          console.error(`JSON Processing ${id}: Failed to parse JSON:`, parseError);
        }
      });
    }, [connections, nodesData, id, enhancedConfig.handles, data, updateNodeData]);

    // INSTANT JSON processing - no debouncing to prevent deactivation delays
    useEffect(() => {
      processJsonInputs();
    }, [processJsonInputs]);

    // ============================================================================
    // OPTIMIZED DATA PROCESSING WITH SMART PROPAGATION
    // ============================================================================
    
    // MEMOIZED: Propagation calculation to avoid unnecessary re-computation
    const calculatedIsActive = useMemo(() => {
      try {
        // STEP 1: Check if this is a HEAD NODE
        const isHead = isHeadNode(connections, id);
        
        // STEP 2: Determine if we should bypass cache for instant deactivation
        const previousIsActive = (data as any)?.isActive;
        const quickCheck = isHead 
          ? calculateHeadNodeActivation(enhancedConfig.nodeType, data as T, true) // Quick check without cache
          : calculateDownstreamNodeActivation(enhancedConfig.nodeType, data as T, connections, nodesData, id, true);
        
        // If transitioning from active to inactive, bypass cache for instant response
        const bypassCache = previousIsActive === true && quickCheck === false;
        
        if (isHead) {
          // HEAD NODE LOGIC
          return calculateHeadNodeActivation(enhancedConfig.nodeType, data as T, bypassCache);
        } else {
          // DOWNSTREAM NODE LOGIC
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
      // OPTIMIZED: Only depend on specific data properties that affect activation
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
      (data as any)?.displayedValues
    ]);

    // INSTANT DEACTIVATION + SMOOTH ACTIVATION: Update isActive state with smart timing
    useEffect(() => {
      if (isActive !== calculatedIsActive) {
        const isActivating = !isActive && calculatedIsActive;
        const isDeactivating = isActive && !calculatedIsActive;
        
        // Update local state immediately
        setIsActive(calculatedIsActive);
        
        // ULTRA-FAST PROPAGATION: Use the new system for instant feedback
        if (isDeactivating) {
          console.log(`UFS ${enhancedConfig.nodeType} ${id}: DEACTIVATING - Using ultra-fast instant propagation`);
        } else if (isActivating) {
          console.log(`UFS ${enhancedConfig.nodeType} ${id}: ACTIVATING - Using ultra-fast smooth propagation`);
        }
        
        // Propagate using Ultra-Fast System
        propagateUltraFast(id, calculatedIsActive);
      }
    }, [calculatedIsActive, isActive, id, propagateUltraFast]);

    // OPTIMIZED: Process main node logic with better dependency management
    useEffect(() => {
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
        
        // INSTANT OUTPUT UPDATES: Trigger/cycle node output value updates
        if (enhancedConfig.nodeType.toLowerCase().includes('trigger') || 
            enhancedConfig.nodeType.toLowerCase().includes('cycle')) {
          const outputValue = calculatedIsActive ? true : false;
          const currentOutputValue = (data as any)?.value;
          
          if (currentOutputValue !== outputValue) {
            const isOutputDeactivating = currentOutputValue === true && outputValue === false;
            
            // ULTRA-FAST: Instant updates for output changes
            updateNodeData(id, { value: outputValue } as Partial<Record<string, unknown>>);
            
            if (isOutputDeactivating) {
              console.log(`UFS Output ${enhancedConfig.nodeType} ${id}: INSTANT output deactivation`);
              propagateUltraFast(id, false);
            }
          }
        }
        
      } catch (processingError) {
        // INSTANT error state clearing
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
      relevantConnectionData, // OPTIMIZED: Use summarized connection data
      nodesData,
      enhancedConfig.nodeType,
      enhancedConfig.processLogic,
      calculatedIsActive,
      updateNodeData,
      propagateUltraFast,
      data // Keep full data dependency for process logic
    ]);

    // ============================================================================
    // ERROR RECOVERY EFFECT (separate to avoid circular dependencies)
    // ============================================================================
    
    useEffect(() => {
      if (error && !isRecovering && enhancedConfig.nodeType !== 'testJson' && enhancedConfig.nodeType !== 'testError') {
        if (!data?.error) {
          setError(null);
        }
      }
    }, [error, isRecovering, enhancedConfig.nodeType]);

    // MEMOIZED: Recovery function to prevent recreation on every render
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
    // MEMOIZED STYLING CALCULATIONS
    // ============================================================================
    
    const nodeSize = useMemo(() => enhancedConfig.size || DEFAULT_TEXT_NODE_SIZE, [enhancedConfig.size]);
    
    // OPTIMIZED: Memoize error state calculations
    const errorState = useMemo(() => {
      const supportsErrorInjection = ['createText', 'testJson', 'viewOutput'].includes(enhancedConfig.nodeType);
      const hasVibeError = supportsErrorInjection && (data as any)?.isErrorState === true;
      const vibeErrorType = (data as any)?.errorType || 'error';
      const finalErrorForStyling = error || hasVibeError;
      const finalErrorType = error ? 'local' : vibeErrorType;
      
      return { supportsErrorInjection, hasVibeError, finalErrorForStyling, finalErrorType };
    }, [enhancedConfig.nodeType, error, data]);
    
    // MEMOIZED: Styling hooks with stable dependencies
    const nodeStyleClasses = useNodeStyleClasses(!!selected, !!errorState.finalErrorForStyling, isActive);
    const buttonTheme = useNodeButtonTheme(!!errorState.finalErrorForStyling, isActive);
    const textTheme = useNodeTextTheme(!!errorState.finalErrorForStyling);
    const categoryBaseClasses = useNodeCategoryBaseClasses(enhancedConfig.nodeType);
    const categoryButtonTheme = useNodeCategoryButtonTheme(enhancedConfig.nodeType, !!errorState.finalErrorForStyling, isActive);
    const categoryTextTheme = useNodeCategoryTextTheme(enhancedConfig.nodeType, !!errorState.finalErrorForStyling);

    // MEMOIZED: Handle filtering for better performance
    const { inputHandlesFiltered, outputHandles } = useMemo(() => {
      const inputHandlesFiltered = enhancedConfig.handles
        .filter(handle => handle.type === 'target')
        .filter(handle => {
          if (handle.dataType === 'j') {
            const hasJsonConnection = connections.some(c => c.targetHandle === handle.id);
            return hasJsonConnection || isVibeModeActive;
          }
          return true;
        });
      
      const outputHandles = enhancedConfig.handles.filter(handle => handle.type === 'source');
      
      return { inputHandlesFiltered, outputHandles };
    }, [enhancedConfig.handles, connections, isVibeModeActive]);

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
      <div 
        data-id={id} // ULTRA-FAST: DOM targeting for instant visual feedback
        className={`relative ${
          showUI 
            ? `px-4 py-3 ${nodeSize.expanded.width}` 
            : `${nodeSize.collapsed.width} ${nodeSize.collapsed.height} flex items-center justify-center`
        } rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}>
        
        {/* Floating Node ID */}
        <FloatingNodeId nodeId={id} />
        
        {/* Expand/Collapse Button */}
        <ExpandCollapseButton
          showUI={showUI}
          onToggle={() => setShowUI((v) => !v)}
          className={`${errorState.finalErrorForStyling ? buttonTheme : categoryButtonTheme}`}
        />

        {/* Input Handles */}
        {inputHandlesFiltered.map(handle => (
          <CustomHandle
            key={handle.id}
            type="target"
            position={handle.position}
            id={handle.id}
            dataType={handle.dataType}
          />
        ))}
        
        {/* Collapsed State */}
        {!showUI && enhancedConfig.renderCollapsed({
          data: data as T,
          error: errorState.supportsErrorInjection && errorState.finalErrorForStyling ? 
            (error || (data as any)?.error || 'Error state active') : error,
          nodeType: enhancedConfig.nodeType,
          updateNodeData,
          id
        })}

        {/* Expanded State */}
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

        {/* Output Handles */}
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

  // CRITICAL: Wrap the component in React.memo for optimal performance
  return memo(NodeComponent);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const createTextNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_TEXT_NODE_SIZE,
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  ...overrides
});

export const createLogicNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_LOGIC_NODE_SIZE,
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'b', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  ...overrides
});

// ============================================================================
// COMMON INSPECTOR CONTROL HELPERS
// ============================================================================

export const createTextInputControl = (
  label: string,
  dataKey: string,
  placeholder?: string
) => <T extends BaseNodeData>({ node, updateNodeData }: InspectorControlProps<T>) => (
  <div className="flex flex-col gap-2">
    <label className="block text-xs">
      <div className="flex flex-row gap-2">
        <span className="py-1">{label}:</span>
        <input
          type="text"
          className="w-full rounded border px-1 py-1 text-xs"
          placeholder={placeholder}
          value={typeof node.data[dataKey] === 'string' ? node.data[dataKey] : ''}
          onChange={(e) => updateNodeData(node.id, { [dataKey]: e.target.value })}
        />
      </div>
    </label>
  </div>
);

export const createNumberInputControl = (
  label: string,
  dataKey: string,
  min?: number,
  max?: number,
  step?: number
) => <T extends BaseNodeData>({ node, updateNodeData }: InspectorControlProps<T>) => (
  <div className="flex flex-col gap-2">
    <label className="block text-xs">
      <div className="flex flex-row gap-2">
        <span className="py-1">{label}:</span>
        <input
          type="number"
          className="w-full rounded border px-1 py-1 text-xs"
          min={min}
          max={max}
          step={step}
          value={typeof node.data[dataKey] === 'number' ? node.data[dataKey] : 0}
          onChange={(e) => updateNodeData(node.id, { [dataKey]: Number(e.target.value) })}
        />
      </div>
    </label>
  </div>
);

export const createCheckboxControl = (
  label: string,
  dataKey: string
) => <T extends BaseNodeData>({ node, updateNodeData }: InspectorControlProps<T>) => (
  <div className="flex flex-col gap-2">
    <label className="block text-xs">
      <div className="flex flex-row gap-2 items-center">
        <input
          type="checkbox"
          className="rounded border"
          checked={!!node.data[dataKey]}
          onChange={(e) => updateNodeData(node.id, { [dataKey]: e.target.checked })}
        />
        <span>{label}</span>
      </div>
    </label>
  </div>
);

// ============================================================================
// UNIVERSAL JSON HELPERS FOR VIBE MODE
// ============================================================================

/**
 * Universal helper to add JSON input support to any node
 * This allows nodes to be programmatically updated via JSON data
 */
export const addJsonInputSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  // Check if node already has a JSON input handle
  const hasJsonInput = handles.some((h: HandleConfig) => h.type === 'target' && h.dataType === 'j');
  
  if (!hasJsonInput) {
    // Add a JSON input handle positioned at the top center
    return [
      ...handles,
      { id: 'j', dataType: 'j', position: Position.Top, type: 'target' }
    ];
  }
  
  return handles;
};

/**
 * Process JSON input and update node data safely
 * This is automatically handled by the factory, but can be used manually if needed
 */
export const processJsonInput = <T extends BaseNodeData>(
  jsonData: any,
  currentData: T,
  updateNodeData: (id: string, updates: Partial<T>) => void,
  nodeId: string
): boolean => {
  try {
    let parsedData;
    
    // Handle different JSON input types
    if (typeof jsonData === 'object' && jsonData !== null && !Array.isArray(jsonData)) {
      parsedData = jsonData;
    } else if (typeof jsonData === 'string') {
      parsedData = JSON.parse(jsonData);
    } else {
      console.warn(`processJsonInput ${nodeId}: Invalid JSON input type:`, typeof jsonData);
      return false;
    }
    
    // Validate object structure
    if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
      console.warn(`processJsonInput ${nodeId}: JSON input must be an object, got:`, typeof parsedData);
      return false;
    }
    
    // Filter out unsafe properties
    const { error: _, ...safeData } = parsedData;
    
    // Check for meaningful changes
    const hasChanges = Object.keys(safeData).some(key => {
      const newValue = safeData[key];
      const currentValue = currentData[key];
      
      if (typeof newValue === 'object' && typeof currentValue === 'object') {
        return JSON.stringify(newValue) !== JSON.stringify(currentValue);
      }
      return newValue !== currentValue;
    });
    
    if (hasChanges) {
      console.log(`processJsonInput ${nodeId}: Applying JSON data:`, safeData);
      updateNodeData(nodeId, safeData as Partial<T>);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`processJsonInput ${nodeId}: Failed to process JSON:`, error);
    return false;
  }
};

/**
 * Create a node configuration with automatic JSON input support
 * This is a convenience wrapper that automatically adds JSON input handling
 */
export const createUniversalNodeConfig = <T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): NodeFactoryConfig<T> => {
  return {
    ...config,
    handles: addJsonInputSupport(config.handles),
    // Note: JSON processing is automatically handled by the factory's Vibe Mode system
  };
};

// ============================================================================
// UNIVERSAL TRIGGER SUPPORT FOR FACTORY NODES
// ============================================================================

/**
 * Universal helper to add boolean trigger support to any node
 * This allows nodes to be turned on/off via boolean connections
 */
export const addTriggerSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  // Check if node already has a boolean trigger input handle
  const hasTriggerInput = handles.some((h: HandleConfig) => h.type === 'target' && h.dataType === 'b');
  
  if (!hasTriggerInput) {
    // Add a boolean trigger input handle positioned at the left
    return [
      { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
      ...handles
    ];
  }
  
  return handles;
};

/**
 * Check if a node should be triggered based on trigger connections
 * Returns true if no trigger is connected OR if trigger is active
 */
export const shouldNodeBeActive = (
  connections: Connection[],
  nodesData: Record<string, any>
): boolean => {
  // Get trigger connections (connections to trigger handles)
  const triggerConnections = connections.filter(conn => 
    conn.targetHandle === 'trigger'
  );
  
  // No trigger connections means node should be active
  if (triggerConnections.length === 0) {
    return true;
  }
  
  // Check if any connected trigger node is active
  return triggerConnections.some(conn => {
    const sourceNode = nodesData[conn.source];
    if (!sourceNode) return false;
    
    // For trigger nodes, check their 'triggered' state
    if (sourceNode.type?.includes('trigger') || sourceNode.type?.includes('pulse') || sourceNode.type?.includes('toggle')) {
      return Boolean(sourceNode.data?.triggered);
    }
    
    // For other nodes, check if they have meaningful output
    const outputValue = sourceNode.data?.text || sourceNode.data?.value || sourceNode.data?.output;
    return Boolean(outputValue);
  });
};

/**
 * Create a process logic wrapper that respects trigger state
 * Wraps existing processing logic with trigger checking
 */
export const withTriggerSupport = <T extends BaseNodeData>(
  originalProcessLogic: (props: {
    id: string;
    data: T;
    connections: any[];
    nodesData: any[];
    updateNodeData: (id: string, data: Partial<T>) => void;
    setError: (error: string | null) => void;
  }) => void,
  inactiveOutputValue?: any
) => {
  return (props: {
    id: string;
    data: T;
    connections: any[];
    nodesData: any[];
    updateNodeData: (id: string, data: Partial<T>) => void;
    setError: (error: string | null) => void;
  }) => {
    const { connections, nodesData, updateNodeData, id } = props;
    
    // Check if node should be triggered based on connections
    const isActive = shouldNodeBeActive(connections, nodesData);
    
    if (!isActive) {
      // Node is disabled by trigger - clear outputs or set to inactive state
      if (inactiveOutputValue !== undefined) {
        // Set specific inactive output value
        updateNodeData(id, { output: inactiveOutputValue } as unknown as Partial<T>);
      } else {
        // Default behavior: clear common output properties
        const clearOutputs: Partial<T> = {};
        
        // Clear common output properties
        const outputKeys = ['text', 'value', 'output', 'result'];
        outputKeys.forEach(key => {
          if (key in props.data) {
            (clearOutputs as any)[key] = '';
          }
        });
        
        // Special handling for JSON properties
        if ('json' in props.data) {
          (clearOutputs as any)['json'] = '';
        }
        
        // Special handling for parsedJson properties  
        if ('parsedJson' in props.data) {
          (clearOutputs as any)['parsedJson'] = null;
        }
        
        if (Object.keys(clearOutputs).length > 0) {
          updateNodeData(id, clearOutputs);
        }
      }
      
      // Clear any existing errors when inactive
      props.setError(null);
      return;
    }
    
    // Node is triggered - run original processing logic
    originalProcessLogic(props);
  };
};

/**
 * Create a node configuration with automatic trigger support
 * This is a convenience wrapper that automatically adds trigger handling
 */
export const createTriggeredNodeConfig = <T extends BaseNodeData>(
  config: NodeFactoryConfig<T>,
  inactiveOutputValue?: any
): NodeFactoryConfig<T> => {
  return {
    ...config,
    handles: addTriggerSupport(config.handles),
    processLogic: withTriggerSupport(config.processLogic, inactiveOutputValue),
  };
};

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/*
// Example: Creating a simple text transformation node with inspector controls

interface UppercaseNodeData extends BaseNodeData {
  text: string;
  inputText: string;
}

const UppercaseNode = createNodeComponent<UppercaseNodeData>({
  nodeType: 'uppercaseNode',
  category: 'turn',
  displayName: 'UppercaseNode',
  defaultData: { text: '', inputText: '' },
  ...createTextNodeConfig({
    processLogic: ({ data, nodesData, updateNodeData, id }) => {
      const inputText = nodesData
        .map(node => node.data?.text || '')
        .join(' ');
      
      const uppercased = inputText.toUpperCase();
      updateNodeData(id, { text: uppercased, inputText });
    },
    renderCollapsed: ({ data, error }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mb-1">
          {error ? 'Error' : 'Uppercase'}
        </div>
        <div className="text-xs text-center break-words">
          {error ? error : (data.text || 'No input')}
        </div>
      </div>
    ),
    renderExpanded: ({ data, error, categoryTextTheme }) => (
      <div className="flex text-xs flex-col w-auto">
        <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
          {error ? 'Error' : 'Uppercase Node'}
        </div>
        <div className="min-h-[65px] text-xs break-all bg-white border rounded px-3 py-2">
          {error ? error : (data.text || 'Connect text input')}
        </div>
      </div>
    ),
    renderInspectorControls: createTextInputControl('Custom Label', 'customLabel', 'Enter custom label...')
  })
});

export default UppercaseNode;

// Usage: Check if node should pass data
if (node.data.isActive) {
  // Node is triggered and should pass data to connected nodes
  const outputData = node.data.text || node.data.value || node.data.output;
}
*/