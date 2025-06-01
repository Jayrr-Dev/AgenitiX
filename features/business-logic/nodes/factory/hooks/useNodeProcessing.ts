import { useEffect, useRef, useMemo, useCallback } from 'react';
import type { BaseNodeData, NodeFactoryConfig } from '../types';
import { useUltraFastPropagation } from '../UltraFastPropagationEngine';
import { 
  hasJsonConnections,
  getJsonInputValues,
  processJsonInput,
  createJsonProcessingTracker 
} from '../utils/jsonProcessor';
import { 
  isHeadNode,
  calculateHeadNodeActivation,
  calculateDownstreamNodeActivation 
} from '../utils/propagationEngine';
import { PROCESSING_THROTTLE_MS } from '../constants';

// TYPES
interface ProcessingState {
  isActive: boolean;
  error: string | null;
}

interface SafetyLayers {
  visual: any;
  state: any;
  dataFlow: any;
}

/**
 * USE NODE PROCESSING
 * Handles all processing logic, JSON processing, and propagation
 * Enhanced with enterprise safety layer integration
 * 
 * @param id - Node ID
 * @param nodeState - Node state and actions
 * @param connectionData - Connection data
 * @param config - Enhanced node configuration
 * @param safetyLayers - Optional enterprise safety layers
 * @returns Processing state
 */
export function useNodeProcessing<T extends BaseNodeData>(
  id: string,
  nodeState: any,
  connectionData: any,
  config: NodeFactoryConfig<T>,
  safetyLayers?: SafetyLayers
): ProcessingState {
  // PROCESSING TRACKERS
  const jsonProcessingTracker = useRef(createJsonProcessingTracker());
  const logicProcessingTracker = useRef(createJsonProcessingTracker());
  
  // ULTRA-FAST PROPAGATION SYSTEM
  const { propagateUltraFast, enableGPUAcceleration } = useUltraFastPropagation(
    connectionData.allNodes || [],
    connectionData.connections,
    nodeState.updateNodeData
  );

  // GPU ACCELERATION: Enable for high-frequency nodes (ENTERPRISE FEATURE)
  useEffect(() => {
    const nodeType = config.nodeType;
    
    if (nodeType.includes('trigger') || 
        nodeType.includes('cycle') || 
        nodeType.includes('delay') ||
        nodeType.includes('pulse')) {
      enableGPUAcceleration([id]);
      
      // Enterprise safety integration
      if (safetyLayers) {
        console.log(`🚀 Enterprise GPU acceleration enabled for ${nodeType} ${id}`);
      }
    }
  }, [id, config.nodeType, enableGPUAcceleration, safetyLayers]);

  // JSON INPUT PROCESSING
  const processJsonInputs = useCallback(() => {
    if (!jsonProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)) {
      return;
    }
    
    if (!hasJsonConnections(connectionData.connections, id)) {
      return;
    }
        
    const jsonInputValues = getJsonInputValues(
      connectionData.connections, 
      connectionData.nodesData, 
      id
    );
    
    jsonInputValues.forEach(jsonInput => {
      processJsonInput(jsonInput, nodeState.data as T, nodeState.updateNodeData, id);
    });
    
  }, [connectionData.connections, connectionData.nodesData, id, nodeState.updateNodeData]);

  // JSON PROCESSING EFFECT
  useEffect(() => {
    const hasJsonHandles = config.handles.some(h => 
      h.id === 'j' && h.type === 'target'
    );
    
    if (hasJsonHandles && hasJsonConnections(connectionData.connections, id)) {
      processJsonInputs();
    }
  }, [
    processJsonInputs,
    connectionData.connections.length,
    JSON.stringify(connectionData.connections.map((c: any) => ({ 
      source: c.source, 
      target: c.target, 
      targetHandle: c.targetHandle 
    }))),
    connectionData.nodesData.length
  ]);

  // ACTIVATION CALCULATION
  const calculatedIsActive = useMemo(() => {
    try {
      const isHead = isHeadNode(connectionData.connections, id);
      const previousIsActive = (nodeState.data as any)?.isActive;
      
      // Quick check for instant deactivation
      const quickCheck = isHead 
        ? calculateHeadNodeActivation(config.nodeType, nodeState.data as T, true)
        : calculateDownstreamNodeActivation(
            config.nodeType, 
            nodeState.data as T, 
            connectionData.connections, 
            connectionData.nodesData, 
            id, 
            true
          );
      
      const bypassCache = previousIsActive === true && quickCheck === false;
      
      if (isHead) {
        return calculateHeadNodeActivation(config.nodeType, nodeState.data as T, bypassCache);
      } else {
        return calculateDownstreamNodeActivation(
          config.nodeType, 
          nodeState.data as T, 
          connectionData.connections, 
          connectionData.nodesData, 
          id,
          bypassCache
        );
      }
    } catch (error) {
      console.error(`${config.nodeType} ${id} - Propagation calculation error:`, error);
      return false;
    }
  }, [
    id,
    config.nodeType,
    connectionData.relevantConnectionData,
    connectionData.nodesData,
    JSON.stringify(nodeState.data)
  ]);

  // ACTIVATION STATE MANAGEMENT WITH ENTERPRISE SAFETY
  useEffect(() => {
    if (nodeState.isActive !== calculatedIsActive) {
      const isActivating = !nodeState.isActive && calculatedIsActive;
      const isDeactivating = nodeState.isActive && !calculatedIsActive;
      
      nodeState.setIsActive(calculatedIsActive);
      
      // Enterprise safety layer integration
      if (safetyLayers) {
        safetyLayers.visual.updateVisualState(id, calculatedIsActive);
        safetyLayers.dataFlow.setNodeActivation(id, calculatedIsActive);
      }
      
      if (isDeactivating) {
        console.log(`UFS ${config.nodeType} ${id}: DEACTIVATING - Using ultra-fast instant propagation`);
      } else if (isActivating) {
        console.log(`UFS ${config.nodeType} ${id}: ACTIVATING - Using ultra-fast smooth propagation`);
      }
      
      propagateUltraFast(id, calculatedIsActive);
    }
  }, [calculatedIsActive, nodeState.isActive, id, propagateUltraFast, safetyLayers]);

  // MAIN PROCESSING LOGIC
  useEffect(() => {
    // Bypass throttling for input nodes that need immediate text updates
    const isInputNode = config.nodeType === 'createText';
    
    if (!isInputNode && !logicProcessingTracker.current.shouldProcess(PROCESSING_THROTTLE_MS)) {
      return;
    }
    
    try {
      config.processLogic({
        id,
        data: nodeState.data as T,
        connections: connectionData.connections,
        nodesData: connectionData.nodesData,
        updateNodeData: (nodeId: string, updates: Partial<T>) => 
          nodeState.updateNodeData(nodeId, updates as Partial<Record<string, unknown>>),
        setError: nodeState.setError
      });
      
      // Handle trigger/cycle node output value updates
      if (config.nodeType.toLowerCase().includes('trigger') || 
          config.nodeType.toLowerCase().includes('cycle')) {
        const outputValue = calculatedIsActive ? true : false;
        const currentOutputValue = (nodeState.data as any)?.value;
        
        if (currentOutputValue !== outputValue) {
          const isOutputDeactivating = currentOutputValue === true && outputValue === false;
          
          nodeState.updateNodeData(id, { value: outputValue } as Partial<Record<string, unknown>>);
          
          if (isOutputDeactivating) {
            console.log(`UFS Output ${config.nodeType} ${id}: INSTANT output deactivation`);
            propagateUltraFast(id, false);
          }
        }
      }
      
    } catch (processingError) {
      nodeState.setIsActive(false);
      
      if ((nodeState.data as any)?.isActive === true) {
        nodeState.updateNodeData(id, { isActive: false } as Partial<Record<string, unknown>>);
      }
      
      console.error(`${config.nodeType} ${id} - Processing error:`, processingError);
      const errorMessage = processingError instanceof Error 
        ? processingError.message 
        : 'Processing error';
      nodeState.setError(errorMessage);
    }
  }, [
    id,
    connectionData.relevantConnectionData,
    connectionData.nodesData,
    config.nodeType,
    config.processLogic,
    calculatedIsActive,
    nodeState.updateNodeData,
    propagateUltraFast,
    (nodeState.data as any)?.heldText
  ]);

  return {
    isActive: nodeState.isActive,
    error: nodeState.error
  };
} 