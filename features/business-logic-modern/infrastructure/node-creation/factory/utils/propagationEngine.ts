/**
 * PROPAGATION ENGINE UTILITY - High-performance data flow propagation
 *
 * • Implements ultra-fast data propagation algorithms for node networks
 * • Provides efficient data flow management with optimization strategies
 * • Supports batch processing and parallel propagation operations
 * • Features intelligent routing and bottleneck detection systems
 * • Integrates with enterprise safety layers for reliable data flow
 *
 * Keywords: propagation-engine, data-flow, batch-processing, parallel-operations, routing, safety-layers
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

import type { Connection } from "@xyflow/react";
import type { BaseNodeData } from "../types";

// ENHANCED TYPE DEFINITIONS
interface NodeActivationParams<T extends BaseNodeData> {
  nodeType: string;
  data: T;
  nodeId: string;
  connections: Connection[];
  nodesData: NodeWithData[];
  bypassCache?: boolean;
}

interface NodeWithData {
  id: string;
  data: Record<string, any>;
}

interface TriggerNodeData {
  triggered?: boolean;
  isActive?: boolean;
  value?: boolean | string | number;
  output?: boolean | string | number;
}

interface CyclNodeData extends TriggerNodeData {
  isOn?: boolean;
  phase?: boolean;
  pulsing?: boolean;
}

interface TestJsonNodeData {
  parsedJson?: any;
  parseError?: string | null;
}

interface ViewOutputNodeData {
  displayedValues?: Array<{ content: any }>;
}

interface NodeOutputData {
  text?: string;
  value?: any;
  output?: any;
  heldText?: string;
}

// ============================================================================
// IMPORTED DEPENDENCIES
// ============================================================================

import { TRANSFORMATION_NODE_PATTERNS } from "../constants";
import {
  createCacheKey,
  getCacheEntry,
  isCacheValid,
  setCacheEntry,
} from "./cacheManager";

// ============================================================================
// NODE CLASSIFICATION UTILITIES
// ============================================================================

/**
 * IS HEAD NODE
 * Determines if a node is a source/trigger node by checking input connections
 */
export const isHeadNode = (
  connections: Connection[],
  nodeId: string
): boolean => {
  const inputConnections = getInputConnections(connections, nodeId);
  const nonJsonInputs = filterNonJsonConnections(inputConnections);
  return nonJsonInputs.length === 0;
};

/**
 * IS TRANSFORMATION NODE
 * Identifies nodes that transform input data using pattern matching
 */
export const isTransformationNode = (nodeType: string): boolean => {
  const normalizedNodeType = nodeType.toLowerCase();
  return TRANSFORMATION_NODE_PATTERNS.some((pattern) =>
    normalizedNodeType.includes(pattern)
  );
};

// ============================================================================
// CONNECTION HELPER UTILITIES
// ============================================================================

/**
 * GET INPUT CONNECTIONS
 * Retrieves all connections targeting a specific node
 */
const getInputConnections = (
  connections: Connection[],
  nodeId: string
): Connection[] => {
  return connections.filter((connection) => connection.target === nodeId);
};

/**
 * FILTER NON JSON CONNECTIONS
 * Filters out JSON handle connections from connection list
 */
const filterNonJsonConnections = (connections: Connection[]): Connection[] => {
  return connections.filter((connection) => connection.targetHandle !== "j");
};

/**
 * GET TRIGGER CONNECTIONS
 * Retrieves trigger-specific connections for a node
 */
const getTriggerConnections = (
  connections: Connection[],
  nodeId: string
): Connection[] => {
  return connections.filter(
    (connection) =>
      connection.targetHandle === "trigger" && connection.target === nodeId
  );
};

/**
 * GET SOURCE NODES DATA
 * Retrieves node data for source nodes from connections
 */
const getSourceNodesData = (
  connections: Connection[],
  nodesData: NodeWithData[]
): NodeWithData[] => {
  const sourceNodeIds = connections.map((connection) => connection.source);
  return nodesData.filter((node) => sourceNodeIds.includes(node.id));
};

// ============================================================================
// NODE STATE VALIDATION UTILITIES
// ============================================================================

/**
 * IS NODE ACTIVE
 * Checks if a node is in an active state based on its data
 * FIXED: More robust boolean evaluation for trigger states
 */
const isNodeActive = (nodeData: TriggerNodeData): boolean => {
  // Primary trigger fields (boolean checks)
  if (nodeData.triggered === true || nodeData.isActive === true) {
    return true;
  }

  // Secondary value fields with proper boolean conversion
  if (nodeData.value !== undefined && nodeData.value !== null) {
    // Handle boolean values
    if (typeof nodeData.value === "boolean") {
      return nodeData.value;
    }
    // Handle string values
    if (typeof nodeData.value === "string") {
      const lowercased = nodeData.value.toLowerCase().trim();
      return lowercased === "true";
    }
    // Handle numeric values
    if (typeof nodeData.value === "number") {
      return nodeData.value !== 0 && !isNaN(nodeData.value);
    }
  }

  // Tertiary output field with proper boolean conversion
  if (nodeData.output !== undefined && nodeData.output !== null) {
    // Handle boolean values
    if (typeof nodeData.output === "boolean") {
      return nodeData.output;
    }
    // Handle string values
    if (typeof nodeData.output === "string") {
      const lowercased = nodeData.output.toLowerCase().trim();
      return lowercased === "true";
    }
    // Handle numeric values
    if (typeof nodeData.output === "number") {
      return nodeData.output !== 0 && !isNaN(nodeData.output);
    }
  }

  return false;
};

/**
 * HAS MEANINGFUL CONTENT
 * Checks if a value represents meaningful content (not empty/null/undefined)
 */
const hasMeaningfulContent = (value: any): boolean => {
  return value !== undefined && value !== null && value !== "";
};

/**
 * IS NODE DATA ACTIVE
 * Comprehensive check for node activity based on various data properties
 */
const isNodeDataActive = (
  nodeData: NodeOutputData & TriggerNodeData
): boolean => {
  // Check trigger states
  if (nodeData.isActive || nodeData.triggered) {
    return true;
  }

  // Check content fields
  const contentFields = [nodeData.value, nodeData.text, nodeData.output];

  return contentFields.some(hasMeaningfulContent);
};

// ============================================================================
// STATE DETECTION UTILITIES
// ============================================================================

/**
 * CHECK TRIGGER STATE
 * Verifies if trigger nodes allow activation for the target node
 */
export const checkTriggerState = (
  connections: Connection[],
  nodesData: NodeWithData[],
  nodeId: string
): boolean => {
  const triggerConnections = getTriggerConnections(connections, nodeId);

  // No trigger connections means always allowed
  if (triggerConnections.length === 0) {
    return true;
  }

  const triggerNodesData = getSourceNodesData(triggerConnections, nodesData);

  const result = triggerNodesData.some((triggerNode) => {
    const triggerData = triggerNode.data || {};
    return isNodeActive(triggerData);
  });

  return result;
};

/**
 * HAS ACTIVE INPUT NODES
 * Determines if any input nodes are currently active
 */
export const hasActiveInputNodes = (
  connections: Connection[],
  nodesData: NodeWithData[],
  nodeId: string
): boolean => {
  const inputConnections = getInputConnections(connections, nodeId);
  const nonJsonInputs = filterNonJsonConnections(inputConnections);

  if (nonJsonInputs.length === 0) {
    return false;
  }

  const sourceNodesData = getSourceNodesData(nonJsonInputs, nodesData);

  const result = sourceNodesData.some((sourceNode) => {
    const sourceData = sourceNode.data || {};
    return isNodeDataActive(sourceData);
  });

  return result;
};

/**
 * HAS VALID OUTPUT
 * Checks if node has meaningful output data
 */
export const hasValidOutput = (data: NodeOutputData): boolean => {
  const outputFields = [data.text, data.value, data.output, data.heldText];
  return outputFields.some(hasMeaningfulContent);
};

// ============================================================================
// SPECIALIZED NODE HANDLERS
// ============================================================================

/**
 * HANDLE TRIGGER NODE
 * Processes activation logic for trigger-type nodes
 */
const handleTriggerNode = (data: TriggerNodeData): boolean => {
  return !!data.triggered;
};

/**
 * HANDLE CYCLE NODE
 * Processes activation logic for cycle-type nodes
 */
const handleCycleNode = (data: CyclNodeData): boolean => {
  const isNodeOn = !!data.isOn;
  const hasActiveState = !!(data.triggered || data.phase || data.pulsing);
  return isNodeOn && hasActiveState;
};

/**
 * HANDLE MANUAL TRIGGER NODE
 * Processes activation logic for manually triggered nodes
 */
const handleManualTriggerNode = (data: {
  isManuallyActivated?: boolean;
}): boolean => {
  return !!data.isManuallyActivated;
};

/**
 * HANDLE JSON TEST NODE
 * Processes activation logic for JSON testing nodes
 */
const handleJsonTestNode = (data: TestJsonNodeData): boolean => {
  const hasValidJson =
    data.parsedJson !== null && data.parsedJson !== undefined;
  const hasNoParseError = data.parseError === null;
  return hasValidJson && hasNoParseError;
};

// ============================================================================
// HEAD NODE ACTIVATION LOGIC
// ============================================================================

/**
 * DETERMINE HEAD NODE STATE
 * Core logic for head node activation with type-specific handlers
 */
export const determineHeadNodeState = (
  nodeType: string,
  data: any
): boolean => {
  const normalizedNodeType = nodeType.toLowerCase();

  // Early return for trigger nodes
  if (normalizedNodeType.includes("trigger")) {
    return handleTriggerNode(data);
  }

  // Early return for cycle nodes
  if (normalizedNodeType.includes("cycle")) {
    return handleCycleNode(data);
  }

  // Early return for manual trigger nodes
  if (data.isManuallyActivated !== undefined) {
    return handleManualTriggerNode(data);
  }

  // Early return for JSON test nodes
  if (nodeType === "testJson") {
    return handleJsonTestNode(data);
  }

  // Default to output validation for input/creation nodes
  return hasValidOutput(data);
};

/**
 * CALCULATE HEAD NODE ACTIVATION
 * Calculates active state for head nodes with smart caching
 */
export const calculateHeadNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  bypassCache: boolean = false
): boolean => {
  const cacheKey = createCacheKey("head", nodeType, data);
  const cachedResult = getCacheEntry(cacheKey);

  // Return cached result if valid
  if (isCacheValid(cachedResult, bypassCache)) {
    return cachedResult!.result;
  }

  const activationResult = determineHeadNodeState(nodeType, data);

  // Cache positive results or when not bypassing cache
  const shouldCache = activationResult || !bypassCache;
  if (shouldCache) {
    setCacheEntry(cacheKey, activationResult);
  }

  return activationResult;
};

// ============================================================================
// VIEW OUTPUT NODE HANDLERS
// ============================================================================

/**
 * IS CONTENT MEANINGFUL
 * Determines if content has meaningful value for display
 */
const isContentMeaningful = (content: any): boolean => {
  // Handle null/undefined/empty string
  if (!hasMeaningfulContent(content)) {
    return false;
  }

  // Handle empty strings after trimming
  if (typeof content === "string" && content.trim() === "") {
    return false;
  }

  // Handle arrays
  if (Array.isArray(content)) {
    return content.length > 0;
  }

  // Handle objects
  if (typeof content === "object") {
    return Object.keys(content).length > 0;
  }

  return true;
};

/**
 * HANDLE VIEW OUTPUT ACTIVATION
 * Processes activation logic for view output nodes
 */
export const handleViewOutputActivation = (
  data: ViewOutputNodeData
): boolean => {
  const displayedValues = data.displayedValues;

  if (!Array.isArray(displayedValues) || displayedValues.length === 0) {
    return false;
  }

  return displayedValues.some((item) => {
    return isContentMeaningful(item.content);
  });
};

// ============================================================================
// TRANSFORMATION NODE HANDLERS
// ============================================================================

/**
 * HANDLE TRANSFORMATION NODE ACTIVATION
 * Processes activation logic for transformation nodes with detailed logging
 */
export const handleTransformationNodeActivation = <T extends BaseNodeData>(
  nodeType: string,
  data: T,
  hasActiveInput: boolean,
  nodeId: string
): boolean => {
  const hasOutput = hasValidOutput(data as NodeOutputData);
  const isNodeActive = hasActiveInput && hasOutput;

  return isNodeActive;
};

// ============================================================================
// DOWNSTREAM NODE ACTIVATION LOGIC
// ============================================================================

/**
 * DETERMINE DOWNSTREAM NODE STATE
 * Core logic for downstream node activation with early returns
 */
export const determineDownstreamNodeState = <T extends BaseNodeData>(
  params: NodeActivationParams<T>
): boolean => {
  const { nodeType, data, connections, nodesData, nodeId } = params;

  const hasActiveInput = hasActiveInputNodes(connections, nodesData, nodeId);

  // Early return if no active input
  if (!hasActiveInput) {
    return false;
  }

  // Early return if triggers don't allow activation
  const triggerAllows = checkTriggerState(connections, nodesData, nodeId);

  if (!triggerAllows) {
    return false;
  }

  // Handle transformation nodes
  if (isTransformationNode(nodeType)) {
    const result = handleTransformationNodeActivation(
      nodeType,
      data,
      hasActiveInput,
      nodeId
    );
    return result;
  }

  // Handle view output nodes
  if (nodeType === "viewOutput") {
    const result = handleViewOutputActivation(data as ViewOutputNodeData);
    return result;
  }

  // Default activation based on input activity
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
  const cacheKey = createCacheKey(
    "downstream",
    nodeId,
    undefined,
    connections,
    nodesData
  );
  const cachedResult = getCacheEntry(cacheKey);

  // Return cached result if valid
  if (isCacheValid(cachedResult, bypassCache)) {
    return cachedResult!.result;
  }

  const activationParams: NodeActivationParams<T> = {
    nodeType,
    data,
    connections,
    nodesData,
    nodeId,
    bypassCache,
  };

  const activationResult = determineDownstreamNodeState(activationParams);

  // Cache positive results or when not bypassing cache
  const shouldCache = activationResult || !bypassCache;
  if (shouldCache) {
    setCacheEntry(cacheKey, activationResult);
  }

  return activationResult;
};
