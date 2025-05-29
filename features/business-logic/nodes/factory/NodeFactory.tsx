import React, { memo, useEffect, useState, ReactNode } from 'react';
import {
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react';

// Store and utilities
import { useFlowStore } from '../../stores/flowStore';
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

  const NodeComponent = ({ id, data, selected }: NodeProps<Node<T & Record<string, unknown>>>) => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    
    const updateNodeData = useFlowStore((state) => state.updateNodeData);
    const [showUI, setShowUI] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isRecovering, setIsRecovering] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // ============================================================================
    // CONNECTION HANDLING
    // ============================================================================
    
    const connections = useNodeConnections({ handleType: 'target' });
    const inputHandles = config.handles.filter(h => h.type === 'target');
    const sourceIds = connections
      .filter(c => inputHandles.some(h => h.id === c.targetHandle))
      .map(c => c.source);
    const nodesData = useNodesData(sourceIds);

    // ============================================================================
    // DATA PROCESSING
    // ============================================================================
    
    useEffect(() => {
      try {
        config.processLogic({
          id,
          data: data as T,
          connections,
          nodesData,
          updateNodeData: (nodeId: string, updates: Partial<T>) => 
            updateNodeData(nodeId, updates as Partial<Record<string, unknown>>),
          setError
        });
        
        // Check if this node has produced meaningful output after processing
        const hasOutputData = (() => {
          const currentData = data as T;
          
          // Special handling for ViewOutput nodes
          if (config.nodeType === 'viewOutput') {
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
          const outputValue = currentData?.text || currentData?.value || currentData?.output || currentData?.result;
          
          // Only activate if there's actual meaningful output
          return outputValue !== undefined && outputValue !== null && outputValue !== '';
        })();
        
        setIsActive(hasOutputData);
        
      } catch (processingError) {
        setIsActive(false); // Clear active state on error
        console.error(`${config.nodeType} ${id} - Processing error:`, processingError);
        const errorMessage = processingError instanceof Error 
          ? processingError.message 
          : 'Processing error';
        setError(errorMessage);
      }
    }, [id, data, connections, nodesData, updateNodeData]);

    // ============================================================================
    // ERROR RECOVERY EFFECT (separate to avoid circular dependencies)
    // ============================================================================
    
    useEffect(() => {
      // Clear error on successful processing (only if not currently recovering)
      if (error && !isRecovering && data && !data.error) {
        setError(null);
      }
    }, [error, isRecovering, data]);

    // Recovery function
    const recoverFromError = () => {
      try {
        setIsRecovering(true);
        setError(null);
        
        // Reset to safe defaults
        const recoveryData = {
          ...config.defaultData,
          ...config.errorRecoveryData,
          error: null
        };
        
        updateNodeData(id, recoveryData);
        setTimeout(() => setIsRecovering(false), 1000);
      } catch (recoveryError) {
        console.error(`${config.nodeType} ${id} - Recovery failed:`, recoveryError);
        setError('Recovery failed. Please refresh.');
        setIsRecovering(false);
      }
    };

    // ============================================================================
    // STYLING
    // ============================================================================
    
    const nodeSize = config.size || DEFAULT_TEXT_NODE_SIZE;
    const nodeStyleClasses = useNodeStyleClasses(!!selected, !!error, isActive);
    const buttonTheme = useNodeButtonTheme(!!error, isActive);
    const textTheme = useNodeTextTheme(!!error);
    const categoryBaseClasses = useNodeCategoryBaseClasses(config.nodeType);
    const categoryButtonTheme = useNodeCategoryButtonTheme(config.nodeType, !!error, isActive);
    const categoryTextTheme = useNodeCategoryTextTheme(config.nodeType, !!error);

    // ============================================================================
    // RENDER
    // ============================================================================
    
    return (
      <div className={`relative ${
        showUI 
          ? `px-4 py-3 ${nodeSize.expanded.width}` 
          : `${nodeSize.collapsed.width} ${nodeSize.collapsed.height} flex items-center justify-center`
      } rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}>
        
        {/* Error Recovery Button */}
        {error && (
          <button
            onClick={recoverFromError}
            disabled={isRecovering}
            className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
            title={`Error: ${error}. Click to recover.`}
            aria-label="Recover from error"
          >
            {isRecovering ? '⟳' : '!'}
          </button>
        )}
        
        {/* Floating Node ID */}
        <FloatingNodeId nodeId={id} />
        
        {/* Expand/Collapse Button */}
        <ExpandCollapseButton
          showUI={showUI}
          onToggle={() => setShowUI((v) => !v)}
          className={`${error ? buttonTheme : categoryButtonTheme}`}
        />

        {/* Input Handles */}
        {config.handles
          .filter(handle => handle.type === 'target')
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
        {!showUI && config.renderCollapsed({
          data: data as T,
          error,
          nodeType: config.nodeType,
          updateNodeData,
          id
        })}

        {/* Expanded State */}
        {showUI && config.renderExpanded({
          data: data as T,
          error,
          nodeType: config.nodeType,
          categoryTextTheme,
          textTheme,
          updateNodeData,
          id
        })}

        {/* Output Handles */}
        {config.handles
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
  NodeComponent.displayName = config.displayName;

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
*/ 