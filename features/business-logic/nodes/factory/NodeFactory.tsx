import React, { memo, useEffect, useState, ReactNode, useMemo } from 'react';
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
    // CONNECTION HANDLING
    // ============================================================================
    
    const connections = useNodeConnections({ handleType: 'target' });
    const inputHandles = enhancedConfig.handles.filter(h => h.type === 'target');
    
    const sourceIds = connections
      .filter(c => inputHandles.some(h => h.id === c.targetHandle))
      .map(c => c.source);
    const nodesData = useNodesData(sourceIds);

    // Memoize connection and node data to prevent unnecessary effect triggers
    const memoizedConnections = useMemo(() => connections, [JSON.stringify(connections)]);
    const memoizedNodesData = useMemo(() => nodesData, [JSON.stringify(nodesData)]);

    // ============================================================================
    // JSON INPUT PROCESSING (ALWAYS ACTIVE)
    // ============================================================================
    
    useEffect(() => {
      // Find all JSON input handles that can be used for data updates
      const jsonHandles = enhancedConfig.handles.filter(h => h.type === 'target' && h.dataType === 'j');
      const jsonHandleIds = jsonHandles.map(h => h.id);
      
      // Add the default JSON handle ID if no existing JSON handles
      const allJsonHandleIds = jsonHandleIds.length > 0 ? jsonHandleIds : ['j'];
      
      // Look for connections to any JSON input handles
      const jsonConnections = memoizedConnections.filter(c => allJsonHandleIds.includes(c.targetHandle || ''));
      if (jsonConnections.length === 0) return;
      
      // Get JSON data from connected nodes
      const jsonInputs = memoizedNodesData
        .filter(node => jsonConnections.some(c => c.source === node.id))
        .map(node => {
          // Try to extract JSON from various node data properties
          const nodeData = node.data;
          return nodeData?.json || nodeData?.text || nodeData?.value || nodeData?.output || nodeData?.result;
        })
        .filter(input => input !== undefined && input !== null && input !== '');
      
      if (jsonInputs.length === 0) return;
      
      // Process each JSON input
      jsonInputs.forEach(jsonInput => {
        try {
          let parsedData;
          
          // If it's already an object, use it directly
          if (typeof jsonInput === 'object') {
            parsedData = jsonInput;
          } else if (typeof jsonInput === 'string') {
            // Try to parse as JSON string
            parsedData = JSON.parse(jsonInput);
          } else {
            console.warn(`JSON Processing ${id}: Invalid JSON input type:`, typeof jsonInput);
            return;
          }
          
          // Validate that it's an object
          if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
            console.warn(`JSON Processing ${id}: JSON input must be an object, got:`, typeof parsedData);
            return;
          }
          
          // Filter out properties that shouldn't be overridden
          const { error: _, ...safeData } = parsedData;
          
          // Check if any data would actually change to prevent infinite loops
          const currentData = data as T;
          const hasChanges = Object.keys(safeData).some(key => {
            const newValue = safeData[key];
            const currentValue = currentData[key];
            
            // Deep comparison for objects, strict comparison for primitives
            if (typeof newValue === 'object' && typeof currentValue === 'object') {
              return JSON.stringify(newValue) !== JSON.stringify(currentValue);
            }
            return newValue !== currentValue;
          });
          
          // Only update if there are actual changes
          if (hasChanges) {
            console.log(`JSON Processing ${id}: Applying JSON data:`, safeData);
            updateNodeData(id, safeData);
          }
          
        } catch (parseError) {
          console.error(`JSON Processing ${id}: Failed to parse JSON:`, parseError);
          // Don't set error state for JSON parsing failures to avoid disrupting normal operation
        }
      });
    }, [memoizedConnections, memoizedNodesData, id]); // Removed isVibeModeActive dependency

    // ============================================================================
    // DATA PROCESSING
    // ============================================================================
    
    useEffect(() => {
      try {
        // Process regular node logic (Vibe Mode is handled separately)
        enhancedConfig.processLogic({
          id,
          data: data as T,
          connections: memoizedConnections,
          nodesData: memoizedNodesData,
          updateNodeData: (nodeId: string, updates: Partial<T>) => 
            updateNodeData(nodeId, updates as Partial<Record<string, unknown>>),
          setError
        });
        
        // Check if this node has produced meaningful output after processing
        const hasOutputData = (() => {
          const currentData = data as T;
          
          // Special handling for TestJson nodes
          if (enhancedConfig.nodeType === 'testJson') {
            const testJsonData = currentData as any;
            // Active when there's valid parsed JSON (no parse error and parsedJson exists)
            return testJsonData?.parsedJson !== null && 
                   testJsonData?.parsedJson !== undefined && 
                   testJsonData?.parseError === null;
          }
          
          // Special handling for ViewOutput nodes
          if (enhancedConfig.nodeType === 'viewOutput') {
            const displayedValues = (currentData as any)?.displayedValues;
            if (!Array.isArray(displayedValues) || displayedValues.length === 0) {
              return false;
            }
            
            // Check if any displayed value has meaningful content
            return displayedValues.some(item => {
              const content = item.content;
              
              // Exclude meaningless values
              if (content === undefined || content === null || content === '') {
                return false;
              }
              
              // For strings, check if they're not just whitespace
              if (typeof content === 'string' && content.trim() === '') {
                return false;
              }
              
              // For objects/arrays, check if they have meaningful data
              if (typeof content === 'object') {
                if (Array.isArray(content)) {
                  return content.length > 0;
                }
                // For objects, check if they have enumerable properties
                return Object.keys(content).length > 0;
              }
              
              // Numbers (including 0), booleans (including false), and other types are meaningful
              return true;
            });
          }
          
          // Check for meaningful output data in this node
          const outputValue = currentData?.text !== undefined ? currentData.text :
                             currentData?.value !== undefined ? currentData.value :
                             currentData?.output !== undefined ? currentData.output :
                             currentData?.result !== undefined ? currentData.result :
                             undefined;
          
          // Only activate if there's actual meaningful output
          return outputValue !== undefined && outputValue !== null && outputValue !== '';
        })();

        // Compute final active state: has meaningful output AND trigger allows data
        const triggerInfo = (() => {
          // Import here to avoid circular dependency
          const { getSingleInputValue, isTruthyValue } = require('../utils/nodeUtils');
          
          // Filter for trigger connections (boolean handle 'b')
          const triggerConnections = memoizedConnections.filter(c => c.targetHandle === 'b');
          const hasTrigger = triggerConnections.length > 0;
          
          if (!hasTrigger) {
            return true; // No trigger = always allow data
          }
          
          // Get the source node IDs for trigger connections
          const triggerSourceIds = triggerConnections.map(c => c.source);
          
          // Filter nodesData to only include nodes connected to the trigger handle
          const triggerNodesData = memoizedNodesData.filter(node => triggerSourceIds.includes(node.id));
          
          // Get trigger value from connected trigger nodes
          const triggerValue = getSingleInputValue(triggerNodesData);
          return isTruthyValue(triggerValue);
        })();

        // Final isActive state: has meaningful output AND trigger allows data
        const finalIsActive = hasOutputData && triggerInfo;
        setIsActive(finalIsActive);
        
        // Update the state in the node data
        if ((data as any)?.isActive !== finalIsActive) {
          console.log(`Factory ${enhancedConfig.nodeType} ${id}: Setting isActive to ${finalIsActive} (hasOutput: ${hasOutputData}, triggerAllows: ${triggerInfo})`);
          updateNodeData(id, { isActive: finalIsActive } as Partial<Record<string, unknown>>);
        }
        
      } catch (processingError) {
        setIsActive(false); // Clear active state on error
        
        // Clear isActive state in node data on error
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
      memoizedConnections, 
      memoizedNodesData, 
      enhancedConfig.nodeType,
      // Add specific data properties that should trigger processing
      (data as any)?.isManuallyActivated,
      (data as any)?.triggerMode,
      (data as any)?.errorType,
      (data as any)?.errorMessage
    ]);

    // ============================================================================
    // ERROR RECOVERY EFFECT (separate to avoid circular dependencies)
    // ============================================================================
    
    useEffect(() => {
      // Clear error on successful processing only for non-TestJson nodes
      // TestJson nodes manage their own error state through their data.error property
      if (error && !isRecovering && enhancedConfig.nodeType !== 'testJson' && enhancedConfig.nodeType !== 'testError') {
        // Only clear if the node doesn't have an error in its data
        if (!data?.error) {
          setError(null);
        }
      }
    }, [error, isRecovering, enhancedConfig.nodeType]); // Remove data.error dependency to prevent loops

    // Recovery function
    const recoverFromError = () => {
      try {
        setIsRecovering(true);
        setError(null);
        
        // Reset to safe defaults
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
    };

    // ============================================================================
    // STYLING
    // ============================================================================
    
    const nodeSize = enhancedConfig.size || DEFAULT_TEXT_NODE_SIZE;
    
    // Check for Vibe Mode injected error state - only for nodes that support error injection
    const supportsErrorInjection = ['createText', 'testJson', 'viewOutput'].includes(enhancedConfig.nodeType);
    const hasVibeError = supportsErrorInjection && (data as any)?.isErrorState === true;
    const vibeErrorType = (data as any)?.errorType || 'error';
    
    // Determine final error state for styling (local error takes precedence)
    const finalErrorForStyling = error || hasVibeError;
    const finalErrorType = error ? 'local' : vibeErrorType;
    
    const nodeStyleClasses = useNodeStyleClasses(!!selected, !!finalErrorForStyling, isActive);
    const buttonTheme = useNodeButtonTheme(!!finalErrorForStyling, isActive);
    const textTheme = useNodeTextTheme(!!finalErrorForStyling);
    const categoryBaseClasses = useNodeCategoryBaseClasses(enhancedConfig.nodeType);
    const categoryButtonTheme = useNodeCategoryButtonTheme(enhancedConfig.nodeType, !!finalErrorForStyling, isActive);
    const categoryTextTheme = useNodeCategoryTextTheme(enhancedConfig.nodeType, !!finalErrorForStyling);

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
      <div className={`relative ${
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
          className={`${finalErrorForStyling ? buttonTheme : categoryButtonTheme}`}
        />

        {/* Input Handles */}
        {enhancedConfig.handles
          .filter(handle => handle.type === 'target')
          .filter(handle => {
            // Smart JSON handle visibility: show if connected OR if Vibe Mode is active
            if (handle.dataType === 'j') {
              // Check if this JSON handle has any existing connections
              const hasJsonConnection = memoizedConnections.some(c => c.targetHandle === handle.id);
              
              // Show JSON handle if: it has connections OR Vibe Mode is active
              return hasJsonConnection || isVibeModeActive;
            }
            return true;
          })
          .map(handle => (
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
          error: supportsErrorInjection && finalErrorForStyling ? (error || (data as any)?.error || 'Error state active') : error,
          nodeType: enhancedConfig.nodeType,
          updateNodeData,
          id
        })}

        {/* Expanded State */}
        {showUI && enhancedConfig.renderExpanded({
          data: data as T,
          error: supportsErrorInjection && finalErrorForStyling ? (error || (data as any)?.error || 'Error state active') : error,
          nodeType: enhancedConfig.nodeType,
          categoryTextTheme,
          textTheme,
          updateNodeData,
          id
        })}

        {/* Output Handles */}
        {enhancedConfig.handles
          .filter(handle => handle.type === 'source')
          .map(handle => (
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
  const hasJsonInput = handles.some(h => h.type === 'target' && h.dataType === 'j');
  
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
  const hasTriggerInput = handles.some(h => h.type === 'target' && h.dataType === 'b');
  
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