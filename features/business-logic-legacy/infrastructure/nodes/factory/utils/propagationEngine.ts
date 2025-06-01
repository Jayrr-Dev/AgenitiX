// ============================================================================
// PROPAGATION ENGINE
// ============================================================================

import type { Connection } from '@xyflow/react';
import type { BaseNodeData } from '../types';
import { 
  createCacheKey, 
  isCacheValid, 
  getCacheEntry, 
  setCacheEntry 
} from './cacheManager';
import { 
  TRANSFORMATION_NODE_PATTERNS,
  HEAD_NODE_PATTERNS 
} from '../constants';

// ============================================================================
// NODE CLASSIFICATION UTILITIES
// ============================================================================

/**
 * IS HEAD NODE
 * Determines if a node is a source/trigger node
 */
export const isHeadNode = (connections: Connection[], nodeId: string): boolean => {
  const allInputConnections = connections.filter(c => c.target === nodeId);
  const nonJsonInputs = allInputConnections.filter(c => c.targetHandle !== 'j');
  return nonJsonInputs.length === 0;
};

/**
 * IS TRANSFORMATION NODE
 * Identifies nodes that transform input data
 */
export const isTransformationNode = (nodeType: string): boolean => {
  return TRANSFORMATION_NODE_PATTERNS.some(pattern => 
    nodeType.toLowerCase().includes(pattern)
  );
};

// ============================================================================
// STATE DETECTION UTILITIES
// ============================================================================

/**
 * CHECK TRIGGER STATE
 * Checks if trigger nodes allow activation
 */
export const checkTriggerState = (
  connections: Connection[], 
  nodesData: any[], 
  nodeId: string
): boolean => {
  const triggerConnections = connections.filter(c => 
    c.targetHandle === 'b' && c.target === nodeId
  );
  
  if (triggerConnections.length === 0) return true; // No trigger = always allowed
  
  const triggerSourceIds = triggerConnections.map(c => c.source);
  const triggerNodesData = nodesData.filter(node => 
    triggerSourceIds.includes(node.id)
  );
  
  return triggerNodesData.some(triggerNode => {
    const triggerData = triggerNode.data || {};
    return !!(
      triggerData.triggered ||
      triggerData.isActive ||
      triggerData.value === true ||
      triggerData.output === true
    );
  });
};

/**
 * HAS ACTIVE INPUT NODES
 * Checks if any input nodes are active
 */
export const hasActiveInputNodes = (
  connections: Connection[], 
  nodesData: any[], 
  nodeId: string
): boolean => {
  const allInputConnections = connections.filter(c => c.target === nodeId);
  const nonJsonInputs = allInputConnections.filter(c => c.targetHandle !== 'j');
  const sourceNodeIds = nonJsonInputs.map(c => c.source);
  const sourceNodesData = nodesData.filter(node => 
    sourceNodeIds.includes(node.id)
  );
  
  if (sourceNodesData.length === 0) return false;
  
  return sourceNodesData.some(sourceNode => {
    const sourceData = sourceNode.data || {};
    return !!(
      sourceData.isActive ||
      sourceData.triggered ||
      (sourceData.value !== undefined && sourceData.value !== null && sourceData.value !== '') ||
      (sourceData.text !== undefined && sourceData.text !== null && sourceData.text !== '') ||
      (sourceData.output !== undefined && sourceData.output !== null && sourceData.output !== '')
    );
  });
};

/**
 * HAS VALID OUTPUT
 * Checks if node has meaningful output
 */
export const hasValidOutput = (data: any): boolean => {
  return !!(
    (data?.text !== undefined && data?.text !== null && data?.text !== '') ||
    (data?.value !== undefined && data?.value !== null && data?.value !== '') ||
    (data?.output !== undefined && data?.output !== null && data?.output !== '') ||
    (data?.heldText !== undefined && data?.heldText !== null && data?.heldText !== '')
  );
};

// ============================================================================
// HEAD NODE ACTIVATION LOGIC
// ============================================================================

/**
 * DETERMINE HEAD NODE STATE
 * Core logic for head node activation
 */
export const determineHeadNodeState = (nodeType: string, data: any): boolean => {
  // Trigger nodes
  if (nodeType.toLowerCase().includes('trigger')) {
    return !!(data?.triggered);
  }
  
  // Cycle nodes
  if (nodeType.toLowerCase().includes('cycle')) {
    return !!(data?.isOn && (data?.triggered || data?.phase || data?.pulsing));
  }
  
  // Manual trigger nodes
  if (data?.isManuallyActivated !== undefined) {
    return !!(data?.isManuallyActivated);
  }
  
  // JSON test nodes
  if (nodeType === 'testJson') {
    return data?.parsedJson !== null && 
           data?.parsedJson !== undefined && 
           data?.parseError === null;
  }
  
  // Input/creation nodes
  return hasValidOutput(data);
};

/**
 * CALCULATE HEAD NODE ACTIVATION
 * Calculates active state for head nodes using smart caching
 */
export const calculateHeadNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  bypassCache: boolean = false
): boolean => {
  const cacheKey = createCacheKey('head', nodeType, data);
  const cached = getCacheEntry(cacheKey);
  
  // INSTANT DEACTIVATION: Skip cache for immediate "off" response
  if (isCacheValid(cached, bypassCache)) {
    return cached!.result;
  }

  const result = determineHeadNodeState(nodeType, data as any);
  
  // Cache the result (but don't cache false results for instant deactivation)
  if (result || !bypassCache) {
    setCacheEntry(cacheKey, result);
  }
  
  return result;
};

// ============================================================================
// DOWNSTREAM NODE ACTIVATION LOGIC
// ============================================================================

/**
 * HANDLE TRANSFORMATION NODE ACTIVATION
 * Handles activation for transformation nodes
 */
export const handleTransformationNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  hasActiveInput: boolean,
  nodeId: string
): boolean => {
  const hasOutput = hasValidOutput(data as any);
  const result = hasActiveInput && hasOutput;
  
  console.log(`UFS Debug ${nodeType} ${nodeId}: hasActiveInput=${hasActiveInput}, hasOutput=${hasOutput}, result=${result}`);
  
  return result;
};

/**
 * HANDLE VIEW OUTPUT ACTIVATION
 * Handles activation for view output nodes
 */
export const handleViewOutputActivation = (data: any): boolean => {
  const displayedValues = data?.displayedValues;
  
  if (!Array.isArray(displayedValues) || displayedValues.length === 0) {
    return false;
  }
  
  return displayedValues.some(item => {
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
};

/**
 * DETERMINE DOWNSTREAM NODE STATE
 * Core logic for downstream node activation
 */
export const determineDownstreamNodeState = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  connections: Connection[],
  nodesData: any[],
  nodeId: string
): boolean => {
  const hasActiveInput = hasActiveInputNodes(connections, nodesData, nodeId);
  
  if (!hasActiveInput) return false;
  
  // Check trigger constraints
  const triggerAllows = checkTriggerState(connections, nodesData, nodeId);
  if (!triggerAllows) return false;
  
  // Handle transformation nodes
  if (isTransformationNode(nodeType)) {
    return handleTransformationNodeActivation(nodeType, data, hasActiveInput, nodeId);
  }
  
  // Handle view output nodes
  if (nodeType === 'viewOutput') {
    return handleViewOutputActivation(data as any);
  }
  
  return hasActiveInput;
};

/**
 * CALCULATE DOWNSTREAM NODE ACTIVATION
 * Calculates active state for downstream nodes with smart caching
 */
export const calculateDownstreamNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  connections: Connection[],
  nodesData: any[],
  nodeId: string,
  bypassCache: boolean = false
): boolean => {
  const cacheKey = createCacheKey('downstream', nodeId, undefined, connections, nodesData);
  const cached = getCacheEntry(cacheKey);
  
  // INSTANT DEACTIVATION: Skip cache for immediate "off" response
  if (isCacheValid(cached, bypassCache)) {
    return cached!.result;
  }

  const result = determineDownstreamNodeState(nodeType, data, connections, nodesData, nodeId);
  
  // Cache the result (but don't cache false results for instant deactivation)
  if (result || !bypassCache) {
    setCacheEntry(cacheKey, result);
  }
  
  return result;
}; 