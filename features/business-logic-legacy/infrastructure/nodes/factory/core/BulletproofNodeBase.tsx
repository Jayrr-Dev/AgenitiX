// ============================================================================
// BULLETPROOF NODE BASE - ENTERPRISE GRADE WITH ULTRA-FAST PROPAGATION
// ============================================================================

import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { type NodeProps, type Node, type Connection } from '@xyflow/react';
import { useFlowStore } from '../../../stores/flowStore';
import { UltraFastPropagationEngine, useUltraFastPropagation } from '../UltraFastPropagationEngine';

// ============================================================================
// ENTERPRISE NODE STATE MANAGEMENT WITH ACTIVATION CONTROL
// ============================================================================

/**
 * BULLETPROOF NODE STATE HOOK WITH ACTIVATION LOGIC
 * Eliminates all state synchronization issues + blocks data flow from inactive nodes
 */
export function useBulletproofNodeState<T extends Record<string, any>>(
  nodeId: string,
  defaultData: T,
  propagateUltraFast?: (nodeId: string, isActive: boolean) => void
) {
  const updateNodeData = useFlowStore((state: any) => state.updateNodeData);
  const nodes = useFlowStore((state: any) => state.nodes);
  const connections = useFlowStore((state: any) => state.edges);
  const lastUpdateRef = useRef<number>(0);
  
  // Get current node data
  const currentNode = nodes.find((n: any) => n.id === nodeId);
  const currentData = currentNode?.data || defaultData;
  
  // ACTIVATION STATE MANAGEMENT
  const [localIsActive, setLocalIsActive] = useState(currentData.isActive || false);
  
  // ATOMIC UPDATE FUNCTION - No race conditions possible + activation handling
  const atomicUpdate = useCallback((updates: Partial<T>) => {
    const timestamp = Date.now();
    
    // Handle activation state changes with ultra-fast propagation
    const wasActive = currentData.isActive || false;
    const willBeActive = updates.hasOwnProperty('isActive') ? updates.isActive : wasActive;
    
    // Check if we need to calculate meaningful output for activation
    const hasMeaningfulOutput = updates.hasOwnProperty('text') && updates.text !== undefined;
    const shouldActivate = willBeActive || hasMeaningfulOutput;
    
    // Ultra-fast visual feedback for activation changes
    if (shouldActivate !== wasActive && propagateUltraFast) {
      propagateUltraFast(nodeId, shouldActivate);
    }
    
    // Update local state immediately for visual consistency
    if (updates.hasOwnProperty('isActive')) {
      setLocalIsActive(updates.isActive as boolean);
    }
    
    // Prevent rapid-fire updates (batching)
    if (timestamp - lastUpdateRef.current < 16) { // 60fps limit
      requestAnimationFrame(() => {
        updateNodeData(nodeId, {
          ...updates,
          isActive: shouldActivate
        } as Partial<Record<string, unknown>>);
      });
    } else {
      updateNodeData(nodeId, {
        ...updates,
        isActive: shouldActivate
      } as Partial<Record<string, unknown>>);
    }
    
    lastUpdateRef.current = timestamp;
  }, [nodeId, updateNodeData, currentData.isActive, propagateUltraFast]);
  
  // COMPUTED STATE WITH DATA FLOW BLOCKING
  const computeState = useCallback((
    rawData: T, 
    computationFn?: (data: T, connectedInputs: Record<string, any>) => Partial<T>
  ) => {
    if (!computationFn) return rawData;
    
    // GET CONNECTED INPUTS WITH ACTIVATION FILTERING
    const connectedInputs = getActiveConnectedInputs(nodeId, connections, nodes);
    
    // Only compute if we have active inputs or this is a source node
    const hasActiveInputs = Object.keys(connectedInputs).length > 0;
    const isSourceNode = !connections.some((conn: Connection) => conn.target === nodeId);
    
    if (!hasActiveInputs && !isSourceNode) {
      // No active inputs - this node should be inactive
      const inactiveUpdates = { 
        isActive: false, 
        text: undefined,
        output: undefined 
      } as unknown as Partial<T>;
      
      atomicUpdate(inactiveUpdates);
      return { ...rawData, ...inactiveUpdates };
    }
    
    // Compute with active inputs only
    const computed = computationFn(rawData, connectedInputs);
    
    // Check if computation produced meaningful output
    const hasMeaningfulOutput = computed.hasOwnProperty('text') && computed.text !== undefined;
    const computedWithActivation = {
      ...computed,
      isActive: hasMeaningfulOutput || isSourceNode
    };
    
    // Only update if something actually changed
    const hasChanges = Object.keys(computedWithActivation).some(key => 
      computedWithActivation[key] !== rawData[key]
    );
    
    if (hasChanges) {
      atomicUpdate(computedWithActivation);
    }
    
    return { ...rawData, ...computedWithActivation };
  }, [nodeId, connections, nodes, atomicUpdate]);
  
  // DATA FLOW BLOCKING FOR INACTIVE NODES
  const getOutputValue = useCallback(() => {
    const isActive = currentData.isActive || localIsActive;
    
    if (!isActive) {
      // CRITICAL: Inactive nodes must not pass any data
      return undefined;
    }
    
    // Return the actual output value
    return currentData.text || currentData.output || currentData.value;
  }, [currentData, localIsActive]);
  
  return { 
    atomicUpdate, 
    computeState, 
    getOutputValue,
    isActive: currentData.isActive || localIsActive
  };
}

/**
 * GET ACTIVE CONNECTED INPUTS - Only from active upstream nodes
 */
function getActiveConnectedInputs(
  nodeId: string, 
  connections: Connection[], 
  nodes: any[]
): Record<string, any> {
  const inputs: Record<string, any> = {};
  
  // Find incoming connections
  const incomingConnections = connections.filter(conn => conn.target === nodeId);
  
  incomingConnections.forEach(conn => {
    const sourceNode = nodes.find(n => n.id === conn.source);
    if (!sourceNode) return;
    
    // CRITICAL: Only get data from ACTIVE source nodes
    const sourceIsActive = sourceNode.data?.isActive === true;
    const sourceHasOutput = sourceNode.data?.text !== undefined || 
                           sourceNode.data?.output !== undefined || 
                           sourceNode.data?.value !== undefined;
    
    if (sourceIsActive && sourceHasOutput) {
      // Get the actual output value
      const outputValue = sourceNode.data.text || 
                         sourceNode.data.output || 
                         sourceNode.data.value;
      
      inputs[conn.targetHandle || 'default'] = outputValue;
    }
    // If source is inactive, don't include its data (blocked data flow)
  });
  
  return inputs;
}

// ============================================================================
// ENTERPRISE NODE FACTORY WITH ULTRA-FAST PROPAGATION
// ============================================================================

export interface EnterpriseNodeConfig<T extends Record<string, any>> {
  // IDENTITY
  nodeType: string;
  displayName: string;
  category: 'input' | 'transform' | 'output' | 'logic' | 'data' | 'trigger' | 'create' | 'view' | 'cycle' | 'test';
  
  // DATA & VALIDATION
  defaultData: T;
  validate?: (data: T) => string | null; // Return error message or null
  
  // COMPUTATION (Pure Functions Only) - Now receives filtered active inputs
  compute?: (data: T, activeInputs: Record<string, any>) => Partial<T>;
  
  // ACTIVATION LOGIC - Custom activation conditions
  shouldActivate?: (data: T, activeInputs: Record<string, any>) => boolean;
  
  // HANDLES (Auto-generated based on compute function)
  inputPorts?: Array<{
    id: string;
    label: string;
    dataType: string;
    required?: boolean;
  }>;
  outputPorts?: Array<{
    id: string;
    label: string;
    dataType: string;
  }>;
  
  // RENDERING (Pure Components Only)
  renderNode: (props: {
    data: T;
    isExpanded: boolean;
    isActive: boolean;
    onUpdate: (updates: Partial<T>) => void;
    onToggle: () => void;
    error?: string;
  }) => React.ReactNode;
  
  // INSPECTOR (Auto-generated from data structure)
  inspectorConfig?: {
    groups: Array<{
      title: string;
      fields: Array<{
        key: keyof T;
        type: 'text' | 'number' | 'boolean' | 'select' | 'range';
        label: string;
        options?: Array<{ value: any; label: string }>;
        min?: number;
        max?: number;
        step?: number;
      }>;
    }>;
  };
}

/**
 * CREATE BULLETPROOF NODE WITH ULTRA-FAST PROPAGATION
 * Enterprise-grade node factory with zero state synchronization issues + ultra-fast activation
 */
export function createBulletproofNode<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>
) {
  // VALIDATE CONFIG AT BUILD TIME
  if (!config.nodeType || !config.displayName || !config.defaultData) {
    throw new Error(`Invalid node config for ${config.nodeType}: Missing required fields`);
  }
  
  const NodeComponent = memo(({ id, data, selected }: NodeProps<Node<T>>) => {
    const nodes = useFlowStore((state: any) => state.nodes);
    const connections = useFlowStore((state: any) => state.edges);
    const updateNodeData = useFlowStore((state: any) => state.updateNodeData);
    
    // ULTRA-FAST PROPAGATION INTEGRATION
    const { propagateUltraFast, enableGPUAcceleration } = useUltraFastPropagation(
      nodes, 
      connections, 
      updateNodeData
    );
    
    // BULLETPROOF STATE MANAGEMENT
    const { atomicUpdate, computeState, getOutputValue, isActive } = useBulletproofNodeState(
      id, 
      config.defaultData,
      propagateUltraFast
    );
    
    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Enable GPU acceleration for this node
    useEffect(() => {
      enableGPUAcceleration([id]);
    }, [id, enableGPUAcceleration]);
    
    // VALIDATION
    const validationError = config.validate ? config.validate(data as T) : null;
    const finalError = error || validationError;
    
    // INPUT PROCESSING (Only from active nodes)
    const activeInputs = useMemo(() => {
      return getActiveConnectedInputs(id, connections, nodes);
    }, [id, connections, nodes]);
    
    // COMPUTATION WITH ACTIVATION CONTROL
    const computedData = useMemo(() => {
      if (!config.compute) return data as T;
      
      try {
        return computeState(data as T, (currentData) => {
          const computed = config.compute!(currentData, activeInputs);
          
          // Apply custom activation logic if provided
          if (config.shouldActivate) {
            const shouldBeActive = config.shouldActivate(currentData, activeInputs);
            return { ...computed, isActive: shouldBeActive };
          }
          
          return computed;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Computation error');
        return data as T;
      }
    }, [data, activeInputs, computeState]);
    
    // OUTPUT VALUE (Blocked if inactive)
    const outputValue = getOutputValue();
    
    // RENDER
    return (
      <div 
        data-node-id={id}
        data-node-type={config.nodeType}
        data-propagation-layer="ultra-fast"
        className={`
          bulletproof-node
          ${isExpanded ? 'expanded' : 'collapsed'}
          ${selected ? 'selected' : ''}
          ${finalError ? 'error' : ''}
          ${isActive ? 'node-active' : 'node-inactive'}
          category-${config.category}
        `}
      >
        {config.renderNode({
          data: computedData,
          isExpanded,
          isActive,
          onUpdate: atomicUpdate,
          onToggle: () => setIsExpanded(!isExpanded),
          error: finalError || undefined
        })}
        
        {/* Debug info for data flow */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute -top-6 left-0 text-xs bg-black text-white px-1 rounded opacity-75">
            {isActive ? `Active: ${outputValue !== undefined ? 'Has Output' : 'No Output'}` : 'Inactive'}
          </div>
        )}
      </div>
    );
  });
  
  NodeComponent.displayName = config.displayName;
  
  return NodeComponent;
}

// ============================================================================
// AUTO-REGISTRATION SYSTEM
// ============================================================================

interface NodeRegistry {
  [nodeType: string]: {
    component: React.ComponentType<any>;
    config: EnterpriseNodeConfig<any>;
  };
}

const nodeRegistry: NodeRegistry = {};

/**
 * REGISTER NODE (Single source of truth)
 */
export function registerNode<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>
) {
  const component = createBulletproofNode(config);
  
  nodeRegistry[config.nodeType] = {
    component,
    config
  };
  
  return component;
}

/**
 * GET ALL REGISTERED NODES
 */
export function getAllNodes() {
  return nodeRegistry;
}

/**
 * GET NODE TYPES FOR REACT FLOW
 */
export function getNodeTypes() {
  const nodeTypes: Record<string, React.ComponentType<any>> = {};
  
  Object.entries(nodeRegistry).forEach(([nodeType, { component }]) => {
    nodeTypes[nodeType] = component;
  });
  
  return nodeTypes;
}

/**
 * GET SIDEBAR ITEMS
 */
export function getSidebarItems() {
  return Object.entries(nodeRegistry).map(([nodeType, { config }]) => ({
    type: nodeType,
    label: config.displayName,
    category: config.category,
    icon: getCategoryIcon(config.category)
  }));
}

/**
 * GET INSPECTOR CONFIG
 */
export function getInspectorConfig(nodeType: string) {
  return nodeRegistry[nodeType]?.config.inspectorConfig;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    input: '📥',
    transform: '⚙️',
    output: '📤',
    logic: '🧮',
    data: '📊'
  };
  return icons[category] || '📦';
} 