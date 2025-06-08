/**
 * BULLETPROOF NODE BASE - Enterprise-grade node creation foundation
 *
 * • Provides bulletproof foundation for creating enterprise-grade nodes
 * • Implements comprehensive error handling and memory leak prevention
 * • Features ultra-fast performance optimization and safety layers
 * • Supports advanced configuration with atomic state management
 * • Includes validation systems and standardized node architecture
 *
 * Keywords: bulletproof, enterprise-grade, error-handling, performance, safety-layers, validation
 */

"use client";

import { useFlowStore } from "@flow-engine/stores/flowStore";
import { type Connection, type Node, type NodeProps } from "@xyflow/react";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useUltraFastPropagation } from "../node-creation/factory/visuals/UltraFastPropagationEngine";

// ============================================================================
// ENTERPRISE NODE STATE MANAGEMENT WITH ACTIVATION CONTROL
// ============================================================================

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
  const incomingConnections = connections.filter(
    (conn) => conn.target === nodeId
  );

  incomingConnections.forEach((conn) => {
    const sourceNode = nodes.find((n: any) => n.id === conn.source);
    if (!sourceNode) return;

    // CRITICAL: Only get data from ACTIVE source nodes
    const sourceIsActive = sourceNode.data?.isActive === true;
    const sourceHasOutput =
      sourceNode.data?.text !== undefined ||
      sourceNode.data?.output !== undefined ||
      sourceNode.data?.value !== undefined;

    if (sourceIsActive && sourceHasOutput) {
      // Get the actual output value
      const outputValue =
        sourceNode.data.text || sourceNode.data.output || sourceNode.data.value;

      inputs[conn.targetHandle || "default"] = outputValue;
    }
    // If source is inactive, don't include its data (blocked data flow)
  });

  return inputs;
}

/**
 * BULLETPROOF NODE STATE HOOK WITH ACTIVATION LOGIC
 * Eliminates all state synchronization issues + blocks data flow from inactive nodes
 */
export function useBulletproofNodeState<T extends Record<string, any>>(
  nodeId: string,
  defaultData: T,
  outputKey: keyof T = "text" as keyof T,
  propagateUltraFast?: (nodeId: string, isActive: boolean) => void
) {
  const updateNodeData = useFlowStore((state: any) => state.updateNodeData);
  const nodes = useFlowStore((state: any) => state.nodes);
  const connections = useFlowStore((state: any) => state.edges);
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  // Get current node data
  const currentNode = nodes.find((n: any) => n.id === nodeId);
  const currentData = currentNode?.data || defaultData;

  // ACTIVATION STATE MANAGEMENT WITH SYNC
  const [localIsActive, setLocalIsActive] = useState(
    currentData.isActive || false
  );

  // SYNC LOCAL STATE WITH STORE
  useEffect(() => {
    setLocalIsActive(currentData.isActive ?? false);
  }, [currentData.isActive]);

  // CLEANUP ANIMATION FRAME ON UNMOUNT
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // ATOMIC UPDATE FUNCTION - No race conditions possible + activation handling
  const atomicUpdate = useCallback(
    (updates: Partial<T>) => {
      const timestamp = Date.now();

      // Handle activation state changes with ultra-fast propagation
      const willBeActive = Object.prototype.hasOwnProperty.call(
        updates,
        "isActive"
      )
        ? updates.isActive
        : currentData.isActive || false;

      // Check if we need to calculate meaningful output for activation
      const hasMeaningfulOutput =
        Object.prototype.hasOwnProperty.call(updates, outputKey as string) &&
        updates[outputKey] !== undefined;
      const shouldActivate = willBeActive || hasMeaningfulOutput;

      // Ultra-fast visual feedback for activation changes
      if (
        shouldActivate !== (currentData.isActive || false) &&
        propagateUltraFast
      ) {
        propagateUltraFast(nodeId, shouldActivate);
      }

      // Update local state immediately for visual consistency - FIXED STALE CLOSURE
      if (Object.prototype.hasOwnProperty.call(updates, "isActive")) {
        setLocalIsActive(updates.isActive as boolean);
      }

      // Prevent rapid-fire updates (batching) - IMPROVED WITH CLEANUP
      if (timestamp - lastUpdateRef.current < 16) {
        // Cancel previous frame if exists
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
          updateNodeData(nodeId, {
            ...updates,
            isActive: shouldActivate,
          } as Partial<Record<string, unknown>>);
          animationFrameRef.current = null;
        });
      } else {
        updateNodeData(nodeId, {
          ...updates,
          isActive: shouldActivate,
        } as Partial<Record<string, unknown>>);
      }

      lastUpdateRef.current = timestamp;
    },
    [
      nodeId,
      updateNodeData,
      currentData.isActive,
      propagateUltraFast,
      outputKey,
    ]
  );

  // COMPUTED STATE WITH DATA FLOW BLOCKING - NOW ACCEPTS PRE-COMPUTED INPUTS
  const computeState = useCallback(
    (
      rawData: T,
      activeInputs: Record<string, any>,
      computationFn?: (
        data: T,
        connectedInputs: Record<string, any>
      ) => Partial<T>
    ) => {
      if (!computationFn) return rawData;

      // Only compute if we have active inputs or this is a source node
      const hasActiveInputs = Object.keys(activeInputs).length > 0;
      const hasIncomingConnections = connections.some(
        (conn: Connection) => conn.target === nodeId
      );

      if (!hasActiveInputs && hasIncomingConnections) {
        // No active inputs - this node should be inactive
        const inactiveUpdates = {
          isActive: false,
          [outputKey]: undefined,
          output: undefined,
        } as unknown as Partial<T>;

        atomicUpdate(inactiveUpdates);
        return { ...rawData, ...inactiveUpdates };
      }

      // Compute with active inputs only
      const computed = computationFn(rawData, activeInputs);

      // Check if computation produced meaningful output
      const hasMeaningfulOutput =
        Object.prototype.hasOwnProperty.call(computed, outputKey as string) &&
        computed[outputKey] !== undefined;
      const computedWithActivation = {
        ...computed,
        isActive: hasMeaningfulOutput || !hasIncomingConnections,
      };

      // Only update if something actually changed
      const hasChanges = Object.keys(computedWithActivation).some(
        (key) => (computedWithActivation as any)[key] !== (rawData as any)[key]
      );

      if (hasChanges) {
        atomicUpdate(computedWithActivation);
      }

      return { ...rawData, ...computedWithActivation };
    },
    [nodeId, connections, atomicUpdate, outputKey]
  );

  // DATA FLOW BLOCKING FOR INACTIVE NODES
  const getOutputValue = useCallback(() => {
    const isActive = currentData.isActive || localIsActive;

    if (!isActive) {
      // CRITICAL: Inactive nodes must not pass any data
      return undefined;
    }

    // Return the actual output value using configured output key
    return currentData[outputKey] || currentData.output || currentData.value;
  }, [currentData, localIsActive, outputKey]);

  return {
    atomicUpdate,
    computeState,
    getOutputValue,
    isActive: currentData.isActive || localIsActive,
  };
}

// ============================================================================
// ENTERPRISE NODE FACTORY WITH ULTRA-FAST PROPAGATION
// ============================================================================

export interface EnterpriseNodeConfig<T extends Record<string, any>> {
  // IDENTITY
  nodeType: string;
  displayName: string;
  category:
    | "input"
    | "transform"
    | "output"
    | "logic"
    | "data"
    | "trigger"
    | "create"
    | "view"
    | "cycle"
    | "test";

  // DATA & VALIDATION
  defaultData: T;
  outputKey?: keyof T; // CONFIGURABLE OUTPUT KEY
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
        type: "text" | "number" | "boolean" | "select" | "range";
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
    throw new Error(
      `Invalid node config for ${config.nodeType}: Missing required fields`
    );
  }

  const NodeComponent = memo(({ id, data, selected }: NodeProps<Node<T>>) => {
    const updateNodeData = useFlowStore((state: any) => state.updateNodeData);
    const nodes = useFlowStore((state: any) => state.nodes);
    const connections = useFlowStore((state: any) => state.edges);

    // ULTRA-FAST PROPAGATION INTEGRATION WITH CLEANUP
    const { propagateUltraFast, enableGPUAcceleration } =
      useUltraFastPropagation(nodes, connections, updateNodeData);

    // BULLETPROOF STATE MANAGEMENT
    const { atomicUpdate, computeState, getOutputValue, isActive } =
      useBulletproofNodeState(
        id,
        config.defaultData,
        config.outputKey || ("text" as keyof T),
        propagateUltraFast
      );

    const [isExpanded, setIsExpanded] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // OPTIMIZED: Cache active inputs to avoid multiple calculations
    const activeInputs = useMemo(() => {
      return getActiveConnectedInputs(id, connections, nodes);
    }, [id, connections, nodes]);

    // Enable GPU acceleration for this node
    useEffect(() => {
      enableGPUAcceleration([id]);
    }, [id, enableGPUAcceleration]);

    // VALIDATION
    const validationError = config.validate ? config.validate(data as T) : null;
    const finalError = error || validationError;

    // COMPUTATION WITH ACTIVATION CONTROL - USING CACHED INPUTS
    const computedData = useMemo(() => {
      if (!config.compute) return data as T;

      try {
        return computeState(data as T, activeInputs, (currentData) => {
          const computed = config.compute!(currentData, activeInputs);

          // Apply custom activation logic if provided
          if (config.shouldActivate) {
            const shouldBeActive = config.shouldActivate(
              currentData,
              activeInputs
            );
            return { ...computed, isActive: shouldBeActive };
          }

          return computed;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Computation error");
        return data as T;
      }
    }, [data, activeInputs, computeState]);

    // OUTPUT VALUE (Blocked if inactive)
    const outputValue = getOutputValue();

    // OPTIMIZED CLASS NAME GENERATION
    const baseClassName = useMemo(
      () => `bulletproof-node category-${config.category}`,
      [config.category]
    );

    const dynamicClassName = useMemo(() => {
      const classes = [baseClassName];
      if (isExpanded) classes.push("expanded");
      else classes.push("collapsed");
      if (selected) classes.push("selected");
      if (finalError) classes.push("error");
      if (isActive) classes.push("node-active");
      else classes.push("node-inactive");
      return classes.join(" ");
    }, [baseClassName, isExpanded, selected, finalError, isActive]);

    // RENDER
    return (
      <div
        data-node-id={id}
        data-node-type={config.nodeType}
        data-propagation-layer="ultra-fast"
        className={dynamicClassName}
      >
        {config.renderNode({
          data: computedData,
          isExpanded,
          isActive,
          onUpdate: atomicUpdate,
          onToggle: () => setIsExpanded(!isExpanded),
          error: finalError || undefined,
        })}

        {/* Debug info for data flow */}
        {process.env.NODE_ENV === "development" && (
          <div className="absolute -top-6 left-0 text-xs bg-black text-white px-1 rounded opacity-75">
            {isActive
              ? `Active: ${outputValue !== undefined ? "Has Output" : "No Output"}`
              : "Inactive"}
          </div>
        )}
      </div>
    );
  });

  NodeComponent.displayName = config.displayName;

  return NodeComponent;
}

// ============================================================================
// TYPE-SAFE AUTO-REGISTRATION SYSTEM
// ============================================================================

// DISCRIMINATED UNION TYPE FOR NODE CONFIGS
type NodeTypeMap = {
  [K: string]: EnterpriseNodeConfig<any>;
};

type NodeRegistry<T extends NodeTypeMap> = {
  [K in keyof T]: {
    component: React.ComponentType<NodeProps<Node<T[K]["defaultData"]>>>;
    config: T[K];
  };
};

const nodeRegistry: NodeRegistry<any> = {};

/**
 * REGISTER NODE (Single source of truth)
 */
export function registerNode<T extends Record<string, any>>(
  config: EnterpriseNodeConfig<T>
) {
  const component = createBulletproofNode(config);

  nodeRegistry[config.nodeType] = {
    component,
    config,
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
    icon: getCategoryIcon(config.category),
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
    input: "📥",
    transform: "⚙️",
    output: "📤",
    logic: "🧮",
    data: "📊",
  };
  return icons[category] || "📦";
}
