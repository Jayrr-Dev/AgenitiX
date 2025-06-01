// ============================================================================
// NODE CONFIG HELPERS
// ============================================================================

import { Position } from '@xyflow/react';
import type { BaseNodeData, NodeFactoryConfig, HandleConfig, InspectorControlProps } from '../types';
import { DEFAULT_TEXT_NODE_SIZE, DEFAULT_LOGIC_NODE_SIZE } from '../constants';

// ============================================================================
// CONFIG CREATION HELPERS
// ============================================================================

/**
 * CREATE TEXT NODE CONFIG
 * Helper for creating text-based node configurations
 */
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

/**
 * CREATE LOGIC NODE CONFIG
 * Helper for creating logic-based node configurations
 */
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

/**
 * CREATE UNIVERSAL NODE CONFIG
 * Creates a node configuration with automatic JSON input support
 * This is a convenience wrapper that automatically adds JSON input handling
 */
export const createUniversalNodeConfig = <T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): NodeFactoryConfig<T> => {
  return {
    ...config,
    // Note: JSON processing is automatically handled by the factory's Vibe Mode system
  };
};

// ============================================================================
// TRIGGER SUPPORT HELPERS
// ============================================================================

/**
 * ADD TRIGGER SUPPORT
 * Universal helper to add boolean trigger support to any node
 * This allows nodes to be turned on/off via boolean connections
 */
export const addTriggerSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  // Check if node already has a boolean trigger input handle
  const hasTriggerInput = handles.some((h: HandleConfig) => 
    h.type === 'target' && h.dataType === 'b'
  );
  
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
 * SHOULD NODE BE ACTIVE
 * Check if a node should be triggered based on trigger connections
 * Returns true if no trigger is connected OR if trigger is active
 */
export const shouldNodeBeActive = (
  connections: any[],
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
    if (sourceNode.type?.includes('trigger') || 
        sourceNode.type?.includes('pulse') || 
        sourceNode.type?.includes('toggle')) {
      return Boolean(sourceNode.data?.triggered);
    }
    
    // For other nodes, check if they have meaningful output
    const outputValue = sourceNode.data?.text || sourceNode.data?.value || sourceNode.data?.output;
    return Boolean(outputValue);
  });
};

/**
 * WITH TRIGGER SUPPORT
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
 * CREATE TRIGGERED NODE CONFIG
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