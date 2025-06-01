import { useState, useEffect, useCallback } from 'react';
import type { Node } from '@xyflow/react';
import type { BaseNodeData, NodeFactoryConfig } from '../types';
import { useFlowStore } from '../../../stores/flowStore';

// TYPES
interface NodeState<T> {
  showUI: boolean;
  error: string | null;
  isRecovering: boolean;
  isActive: boolean;
  data: T;
}

interface NodeStateActions {
  setShowUI: (show: boolean) => void;
  setError: (error: string | null) => void;
  setIsRecovering: (recovering: boolean) => void;
  setIsActive: (active: boolean) => void;
  updateNodeData: (nodeId: string, updates: Partial<Record<string, unknown>>) => void;
  recoverFromError: () => void;
  // Enterprise safety layer compatible update function
  updateNodeDataSafe: (updates: Partial<Record<string, unknown>>) => void;
}

/**
 * USE NODE STATE
 * Centralized state management for factory nodes
 * Enhanced with enterprise safety layer compatibility
 * 
 * @param id - Node ID
 * @param data - Node data
 * @param config - Enhanced node configuration
 * @returns State object and actions
 */
export function useNodeState<T extends BaseNodeData>(
  id: string,
  data: T & Record<string, unknown>,
  config: NodeFactoryConfig<T>
): NodeState<T> & NodeStateActions {
  // FLOW STORE INTEGRATION
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  
  // LOCAL STATE MANAGEMENT
  const [showUI, setShowUI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isActive, setIsActive] = useState(false);

  // ENTERPRISE SAFETY COMPATIBLE UPDATE FUNCTION
  const updateNodeDataSafe = useCallback((updates: Partial<Record<string, unknown>>) => {
    updateNodeData(id, updates);
  }, [id, updateNodeData]);

  // ERROR RECOVERY LOGIC
  const recoverFromError = useCallback(() => {
    try {
      setIsRecovering(true);
      setError(null);
      
      const recoveryData = {
        ...config.defaultData,
        ...config.errorRecoveryData,
        error: null,
        isActive: false
      };
      
      updateNodeData(id, recoveryData);
      setTimeout(() => setIsRecovering(false), 1000);
    } catch (recoveryError) {
      console.error(`${config.nodeType} ${id} - Recovery failed:`, recoveryError);
      setError('Recovery failed. Please refresh.');
      setIsRecovering(false);
    }
  }, [id, config, updateNodeData]);

  // AUTO ERROR RECOVERY: Clear errors for non-test nodes
  useEffect(() => {
    if (error && !isRecovering && 
        config.nodeType !== 'testJson' && 
        config.nodeType !== 'testError') {
      if (!data?.error) {
        setError(null);
      }
    }
  }, [error, isRecovering, config.nodeType, data?.error]);

  return {
    // STATE VALUES
    showUI,
    error,
    isRecovering,
    isActive,
    data: data as T,
    
    // ACTIONS
    setShowUI,
    setError,
    setIsRecovering,
    setIsActive,
    updateNodeData,
    recoverFromError,
    updateNodeDataSafe
  };
} 