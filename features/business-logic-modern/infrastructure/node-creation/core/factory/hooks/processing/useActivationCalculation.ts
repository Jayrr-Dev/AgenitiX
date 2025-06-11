/**
 * USE ACTIVATION CALCULATION HOOK - Node activation state computation
 *
 * • Calculates node activation states based on input conditions
 * • Implements complex activation algorithms and threshold logic
 * • Supports real-time activation monitoring and state changes
 * • Features performance-optimized calculation with caching
 * • Integrates with unified propagation system for activation
 *
 * Keywords: activation-calculation, threshold-logic, real-time-monitoring, caching, unified-propagation
 */

import { useMemo } from "react";
import type { BaseNodeData } from "../../types";
import { TRANSFORMATION_NODE_PATTERNS } from "../../constants";

// ============================================================================
// BUSINESS LOGIC (from unified propagation engine)
// ============================================================================

// Enhanced node data interfaces
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

interface NodeWithData {
  id: string;
  data: Record<string, any>;
  type?: string;
}

/**
 * IS HEAD NODE - Determines if a node is a source/trigger node
 */
const isHeadNode = (connections: any[], nodeId: string): boolean => {
  const inputConnections = connections.filter(conn => conn.target === nodeId);
  const nonJsonInputs = inputConnections.filter(conn => conn.targetHandle !== "j");
  return nonJsonInputs.length === 0;
};

/**
 * IS TRANSFORMATION NODE - Identifies nodes that transform input data
 */
const isTransformationNode = (nodeType: string): boolean => {
  const normalizedNodeType = nodeType.toLowerCase();
  return TRANSFORMATION_NODE_PATTERNS.some(pattern =>
    normalizedNodeType.includes(pattern)
  );
};

/**
 * HAS MEANINGFUL CONTENT - Checks if a value represents meaningful content
 */
const hasMeaningfulContent = (value: any): boolean => {
  return value !== undefined && value !== null && value !== "";
};

/**
 * HAS VALID OUTPUT - Checks if node has meaningful output data
 */
const hasValidOutput = (data: NodeOutputData): boolean => {
  const outputFields = [data.text, data.value, data.output, data.heldText];
  return outputFields.some(hasMeaningfulContent);
};

/**
 * IS NODE ACTIVE - Checks if a node is in an active state based on its data
 */
const isNodeActive = (nodeData: TriggerNodeData): boolean => {
  // Primary trigger fields (boolean checks)
  if (nodeData.triggered === true || nodeData.isActive === true) {
    return true;
  }

  // Secondary value fields with proper boolean conversion
  if (nodeData.value !== undefined && nodeData.value !== null) {
    if (typeof nodeData.value === "boolean") {
      return nodeData.value;
    }
    if (typeof nodeData.value === "string") {
      const lowercased = nodeData.value.toLowerCase().trim();
      return lowercased === "true";
    }
    if (typeof nodeData.value === "number") {
      return nodeData.value !== 0 && !isNaN(nodeData.value);
    }
  }

  // Tertiary output field with proper boolean conversion
  if (nodeData.output !== undefined && nodeData.output !== null) {
    if (typeof nodeData.output === "boolean") {
      return nodeData.output;
    }
    if (typeof nodeData.output === "string") {
      const lowercased = nodeData.output.toLowerCase().trim();
      return lowercased === "true";
    }
    if (typeof nodeData.output === "number") {
      return nodeData.output !== 0 && !isNaN(nodeData.output);
    }
  }

  return false;
};

/**
 * SPECIALIZED NODE HANDLERS
 */
const handleTriggerNode = (data: TriggerNodeData): boolean => {
  return !!data.triggered;
};

const handleCycleNode = (data: CyclNodeData): boolean => {
  const isNodeOn = !!data.isOn;
  const hasActiveState = !!(data.triggered || data.phase || data.pulsing);
  return isNodeOn && hasActiveState;
};

const handleManualTriggerNode = (data: { isManuallyActivated?: boolean }): boolean => {
  return !!data.isManuallyActivated;
};

const handleJsonTestNode = (data: TestJsonNodeData): boolean => {
  const hasValidJson = data.parsedJson !== null && data.parsedJson !== undefined;
  const hasNoParseError = data.parseError === null;
  return hasValidJson && hasNoParseError;
};

const handleViewOutputActivation = (data: ViewOutputNodeData): boolean => {
  const displayedValues = data.displayedValues;

  if (!Array.isArray(displayedValues) || displayedValues.length === 0) {
    return false;
  }

  return displayedValues.some((item) => {
    if (!hasMeaningfulContent(item.content)) return false;
    if (typeof item.content === "string" && item.content.trim() === "") return false;
    if (Array.isArray(item.content)) return item.content.length > 0;
    if (typeof item.content === "object") return Object.keys(item.content).length > 0;
    return true;
  });
};

/**
 * CHECK TRIGGER STATE - Verifies if trigger nodes allow activation
 */
const checkTriggerState = (
  connections: any[],
  nodesData: NodeWithData[],
  nodeId: string
): boolean => {
  const triggerConnections = connections.filter(
    conn => conn.targetHandle === "trigger" && conn.target === nodeId
  );

  if (triggerConnections.length === 0) return true;

  const sourceNodeIds = triggerConnections.map(conn => conn.source);
  const triggerNodesData = nodesData.filter(node => sourceNodeIds.includes(node.id));

  return triggerNodesData.some(triggerNode => {
    const triggerData = triggerNode.data || {};
    return isNodeActive(triggerData);
  });
};

/**
 * HAS ACTIVE INPUT NODES - Determines if any input nodes are currently active
 */
const hasActiveInputNodes = (
  connections: any[],
  nodesData: NodeWithData[],
  nodeId: string
): boolean => {
  const inputConnections = connections.filter(conn => conn.target === nodeId);
  const nonJsonInputs = inputConnections.filter(conn => conn.targetHandle !== "j");

  if (nonJsonInputs.length === 0) return false;

  const sourceNodeIds = nonJsonInputs.map(conn => conn.source);
  const sourceNodesData = nodesData.filter(node => sourceNodeIds.includes(node.id));

  return sourceNodesData.some(sourceNode => {
    const sourceData = sourceNode.data || {};
    return isNodeActive(sourceData) || hasValidOutput(sourceData);
  });
};

/**
 * CALCULATE HEAD NODE ACTIVATION - Using unified business logic
 */
const calculateHeadNodeActivation = (nodeType: string, data: any): boolean => {
  const normalizedNodeType = nodeType.toLowerCase();

  if (normalizedNodeType.includes("trigger")) {
    return handleTriggerNode(data);
  }

  if (normalizedNodeType.includes("cycle")) {
    return handleCycleNode(data);
  }

  if (data.isManuallyActivated !== undefined) {
    return handleManualTriggerNode(data);
  }

  if (nodeType === "testJson") {
    return handleJsonTestNode(data);
  }

  return hasValidOutput(data);
};

/**
 * CALCULATE DOWNSTREAM NODE ACTIVATION - Using unified business logic
 */
const calculateDownstreamNodeActivation = (
  nodeType: string,
  data: any,
  connections: any[],
  nodesData: any[],
  nodeId: string
): boolean => {
  // Convert to expected format
  const nodesDataFormatted: NodeWithData[] = nodesData.map(n => ({
    id: n.id,
    data: n.data || {},
    type: n.type
  }));

  const hasActiveInput = hasActiveInputNodes(connections, nodesDataFormatted, nodeId);

  if (!hasActiveInput) return false;

  const triggerAllows = checkTriggerState(connections, nodesDataFormatted, nodeId);
  if (!triggerAllows) return false;

  // Handle transformation nodes
  if (isTransformationNode(nodeType)) {
    return hasActiveInput && hasValidOutput(data);
  }

  // Handle view output nodes
  if (nodeType === "viewOutput" || nodeType === "viewOutputV2U") {
    return handleViewOutputActivation(data as ViewOutputNodeData);
  }

  return hasActiveInput;
};

// ============================================================================
// ACTIVATION CALCULATION TYPES
// ============================================================================

interface ActivationConfig {
  nodeType: string;
}

interface ConnectionData {
  connections: any[];
  nodesData: any[];
  relevantConnectionData: any;
}

interface ActivationResult {
  calculatedIsActive: boolean;
  isHeadNode: boolean;
  activationSource: "head" | "downstream";
}

// ============================================================================
// USE ACTIVATION CALCULATION
// ============================================================================

/**
 * USE ACTIVATION CALCULATION
 * Handles node activation state calculation with unified business logic
 * Focused responsibility: Only activation logic computation
 *
 * @param id - Node ID
 * @param config - Activation configuration
 * @param nodeData - Current node data
 * @param connectionData - Connection and node data
 * @returns Activation calculation result
 */
export function useActivationCalculation<T extends BaseNodeData>(
  id: string,
  config: ActivationConfig,
  nodeData: T,
  connectionData: ConnectionData
): ActivationResult {
  // ========================================================================
  // ACTIVATION CALCULATION WITH UNIFIED BUSINESS LOGIC
  // ========================================================================

  const activationResult = useMemo(() => {
    try {
      const isHead = isHeadNode(connectionData.connections, id);

      // CALCULATE ACTIVATION STATE using unified business logic
      const calculatedIsActive = isHead
        ? calculateHeadNodeActivation(config.nodeType, nodeData)
        : calculateDownstreamNodeActivation(
            config.nodeType,
            nodeData,
            connectionData.connections,
            connectionData.nodesData,
            id
          );

      return {
        calculatedIsActive,
        isHeadNode: isHead,
        activationSource: isHead ? "head" : "downstream",
      } as ActivationResult;
    } catch (error) {
      console.error(
        `${config.nodeType} ${id} - Activation calculation error:`,
        error
      );
      return {
        calculatedIsActive: false,
        isHeadNode: false,
        activationSource: "head",
      } as ActivationResult;
    }
  }, [
    id,
    config.nodeType,
    connectionData.relevantConnectionData,
    connectionData.nodesData,
    JSON.stringify(nodeData), // Deep comparison for node data changes
  ]);

  return activationResult;
}

// ============================================================================
// ACTIVATION STATE UTILITIES
// ============================================================================

/**
 * CHECK IF ACTIVATION CHANGED
 * Helper to determine if activation state has changed
 */
export function hasActivationChanged(
  currentIsActive: boolean,
  calculatedIsActive: boolean
): { isActivating: boolean; isDeactivating: boolean; hasChanged: boolean } {
  const hasChanged = currentIsActive !== calculatedIsActive;
  const isActivating = !currentIsActive && calculatedIsActive;
  const isDeactivating = currentIsActive && !calculatedIsActive;

  return {
    isActivating,
    isDeactivating,
    hasChanged,
  };
}

/**
 * CREATE ACTIVATION CONFIG
 * Helper to create activation configuration object
 */
export function createActivationConfig(nodeType: string): ActivationConfig {
  return {
    nodeType,
  };
}
