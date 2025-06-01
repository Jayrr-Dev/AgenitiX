import React from 'react';
import { useNodeConnections, useNodesData } from '@xyflow/react';
import { useFlowStore } from '../../../stores/flowStore';

// ============================================================================
// ADVANCED BUTTON SYSTEM - FIXED VERSION WITH PROPER REACT COMPONENTS
// ============================================================================

/**
 * ENHANCED UPDATE NODE DATA HOOK
 * Provides context-aware update functions with error recovery capabilities
 */
export function useEnhancedUpdateNodeData<T extends Record<string, any>>(
  data: T,
  updateNodeData: (id: string, updates: Partial<T>) => void
) {
  return (nodeId: string, updates: Partial<T>) => {
    // Enhanced logic for handling resets and preserving user configuration
    if ('isManuallyActivated' in updates && updates.isManuallyActivated === false) {
      // Complete reset logic - preserve configuration but clear states
      const fullResetData = {
        ...updates,
        // Preserve user configuration fields (can be customized per node)
        isGeneratingError: false,
        text: '',
        json: '',
        // Clear any error properties that might be lingering
        error: undefined
      } as Partial<T>;
      
      updateNodeData(nodeId, fullResetData);
    } else {
      updateNodeData(nodeId, updates);
    }
  };
}

/**
 * CONNECTED NODE RESET HOOK
 * Manages resetting error states on connected nodes
 */
export function useConnectedNodeReset(id: string, nodeLabel: string = 'Node') {
  const updateFlowNodeData = useFlowStore((state) => state.updateNodeData);
  const connections = useNodeConnections({ handleType: 'source' });
  const targetNodeIds = connections.map(c => c.target);
  const targetNodesData = useNodesData(targetNodeIds);
  
  return () => {
    // Reset connected nodes that have error states
    if (targetNodesData.length > 0) {
      console.log(`🔗 ${nodeLabel} ${id}: Found ${targetNodesData.length} connected nodes to check for reset`);
      
      targetNodesData.forEach(node => {
        if (node.data?.isErrorState) {
          console.log(`🧹 ${nodeLabel} ${id}: Resetting error state on node ${node.id}`, {
            before: { 
              isErrorState: node.data.isErrorState, 
              errorType: node.data.errorType, 
              error: node.data.error 
            },
            after: { 
              isErrorState: false, 
              errorType: undefined, 
              error: undefined 
            }
          });
          
          updateFlowNodeData(node.id, {
            isErrorState: false,
            errorType: undefined,
            error: undefined
          });
        } else {
          console.log(`⭕ ${nodeLabel} ${id}: Node ${node.id} has no error state to reset`);
        }
      });
    } else {
      console.log(`🔗 ${nodeLabel} ${id}: No connected nodes found to reset`);
    }
  };
}

/**
 * BASE ACTIVATE/RESET BUTTON COMPONENT
 * Pure React component for activation/reset logic
 */
interface BaseButtonProps<T extends Record<string, any>> {
  data: T;
  updateNodeData: (id: string, updates: Partial<T>) => void;
  id: string;
  size?: 'normal' | 'compact';
  onReset?: () => void;
  activateText?: string;
  resetText?: string;
  activateIcon?: string;
  resetIcon?: string;
  nodeLabel?: string;
  activationField?: keyof T;
  stateField?: keyof T;
}

export function BaseActivateResetButton<T extends Record<string, any>>({
  data,
  updateNodeData,
  id,
  size = 'normal',
  onReset,
  activateText = 'Activate',
  resetText = 'Reset',
  activateIcon = '⚡',
  resetIcon = '↻',
  nodeLabel = 'Node',
  activationField = 'isManuallyActivated' as keyof T,
  stateField = 'isGeneratingError' as keyof T
}: BaseButtonProps<T>) {
  // Reliable state detection - check both manual activation and current state
  const isActive = (data[stateField] === true) || (data[activationField] === true);
  
  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔥 ${nodeLabel} ${id}: ACTIVATING manually`);
    updateNodeData(id, { 
      [activationField]: true 
    } as Partial<T>);
  };
  
  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log(`🔄 ${nodeLabel} ${id}: RESETTING - clearing all states`);
    
    // Reset connected nodes FIRST (before clearing our own state)
    if (onReset) {
      console.log(`🔗 ${nodeLabel} ${id}: Resetting connected nodes immediately...`);
      onReset();
    }
    
    // Complete reset - clear activation and generation states
    const completeResetData = {
      [activationField]: false,
      [stateField]: false,
      text: '',
      json: '',
      // Clear any error properties that might be lingering
      error: undefined
    } as unknown as Partial<T>;
    
    console.log(`📝 ${nodeLabel} ${id}: Reset data:`, completeResetData);
    updateNodeData(id, completeResetData);
  };
  
  const buttonClasses = size === 'compact' 
    ? "px-2 py-1 text-xs"
    : "px-3 py-1.5 text-xs";
  
  return (
    <button
      className={`nodrag nopan ${buttonClasses} rounded font-medium transition-colors relative z-10 cursor-pointer ${
        isActive
          ? 'bg-red-500 hover:bg-red-600 text-white border border-red-600'
          : 'bg-green-500 hover:bg-green-600 text-white border border-green-600'
      }`}
      onClick={isActive ? handleReset : handleActivate}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ pointerEvents: 'auto' }}
    >
      {isActive ? (
        <>
          <span className="mr-1">{resetIcon}</span>
          {resetText}
        </>
      ) : (
        <>
          <span className="mr-1">{activateIcon}</span>
          {activateText}
        </>
      )}
    </button>
  );
}

/**
 * NODE CONTEXT BUTTON COMPONENT
 * Button that can access node connections for resetting connected nodes
 */
interface NodeContextButtonProps<T extends Record<string, any>> {
  data: T;
  updateNodeData: (id: string, updates: Partial<T>) => void;
  id: string;
  size?: 'normal' | 'compact';
  activateText?: string;
  resetText?: string;
  activateIcon?: string;
  resetIcon?: string;
  nodeLabel?: string;
  activationField?: keyof T;
  stateField?: keyof T;
}

export function NodeContextButton<T extends Record<string, any>>({
  data,
  updateNodeData,
  id,
  size = 'normal',
  activateText,
  resetText,
  activateIcon,
  resetIcon,
  nodeLabel = 'Node',
  activationField = 'isManuallyActivated' as keyof T,
  stateField = 'isGeneratingError' as keyof T
}: NodeContextButtonProps<T>) {
  const handleConnectedNodesReset = useConnectedNodeReset(id, nodeLabel);
  
  return (
    <BaseActivateResetButton
      data={data}
      updateNodeData={updateNodeData}
      id={id}
      size={size}
      onReset={handleConnectedNodesReset}
      activateText={activateText}
      resetText={resetText}
      activateIcon={activateIcon}
      resetIcon={resetIcon}
      nodeLabel={nodeLabel}
      activationField={activationField}
      stateField={stateField}
    />
  );
}

/**
 * INSPECTOR CONTEXT BUTTON COMPONENT
 * Button for use in inspector context (no connections access)
 */
export function InspectorContextButton<T extends Record<string, any>>({
  data,
  updateNodeData,
  id,
  size = 'normal',
  activateText,
  resetText,
  activateIcon,
  resetIcon,
  nodeLabel = 'Node',
  activationField = 'isManuallyActivated' as keyof T,
  stateField = 'isGeneratingError' as keyof T
}: NodeContextButtonProps<T>) {
  return (
    <BaseActivateResetButton
      data={data}
      updateNodeData={updateNodeData}
      id={id}
      size={size}
      activateText={activateText}
      resetText={resetText}
      activateIcon={activateIcon}
      resetIcon={resetIcon}
      nodeLabel={nodeLabel}
      activationField={activationField}
      stateField={stateField}
    />
  );
}

// ============================================================================
// LEGACY FACTORY FUNCTIONS (DEPRECATED - USE COMPONENTS ABOVE)
// ============================================================================

/**
 * @deprecated Use NodeContextButton component directly instead
 */
export function createNodeContextButton<T extends Record<string, any>>(
  nodeLabel: string = 'Node',
  activationField: keyof T = 'isManuallyActivated' as keyof T,
  stateField: keyof T = 'isGeneratingError' as keyof T
) {
  return (props: NodeContextButtonProps<T>) => (
    <NodeContextButton
      {...props}
      nodeLabel={nodeLabel}
      activationField={activationField}
      stateField={stateField}
    />
  );
}

/**
 * @deprecated Use InspectorContextButton component directly instead
 */
export function createInspectorContextButton<T extends Record<string, any>>(
  nodeLabel: string = 'Node',
  activationField: keyof T = 'isManuallyActivated' as keyof T,
  stateField: keyof T = 'isGeneratingError' as keyof T
) {
  return (props: NodeContextButtonProps<T>) => (
    <InspectorContextButton
      {...props}
      nodeLabel={nodeLabel}
      activationField={activationField}
      stateField={stateField}
    />
  );
}

/**
 * @deprecated Use BaseActivateResetButton component directly instead
 */
export function createBaseActivateResetButton<T extends Record<string, any>>(
  nodeLabel: string = 'Node',
  activationField: keyof T = 'isManuallyActivated' as keyof T,
  stateField: keyof T = 'isGeneratingError' as keyof T
) {
  return (props: BaseButtonProps<T>) => (
    <BaseActivateResetButton
      {...props}
      nodeLabel={nodeLabel}
      activationField={activationField}
      stateField={stateField}
    />
  );
} 