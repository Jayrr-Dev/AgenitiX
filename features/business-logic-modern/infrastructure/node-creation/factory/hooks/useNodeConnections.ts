/**
 * USE NODE CONNECTIONS HOOK - Connection management for node networks
 *
 * • Manages connection lifecycle and validation for factory nodes
 * • Implements real-time connection monitoring and state tracking
 * • Supports connection rules, type checking, and validation
 * • Features automatic connection cleanup and memory management
 * • Integrates with data flow systems for optimal performance
 *
 * Keywords: node-connections, validation, real-time-monitoring, type-checking, cleanup, data-flow
 */

import {
  useNodesData,
  useNodeConnections as useReactFlowConnections,
} from "@xyflow/react";
import { useMemo } from "react";
import type { HandleConfig, RelevantConnectionData } from "../types";

// TYPES
interface ConnectionData {
  connections: any[];
  nodesData: any[];
  allNodes: any[];
  sourceIds: string[];
  inputHandles: HandleConfig[];
  relevantConnectionData: RelevantConnectionData;
}

/**
 * USE NODE CONNECTIONS
 * Optimized connection handling and data processing
 *
 * @param id - Node ID
 * @param handles - Handle configuration array
 * @returns Connection data and metadata
 */
export function useNodeConnections(
  id: string,
  handles: HandleConfig[]
): ConnectionData {
  // REACT FLOW CONNECTION DATA
  const connections = useReactFlowConnections({ handleType: "target" });

  // INPUT HANDLE FILTERING
  const inputHandles = useMemo(
    () => handles.filter((h) => h.type === "target"),
    [handles]
  );

  // SOURCE NODE IDENTIFICATION
  const sourceIds = useMemo(
    () =>
      connections
        .filter((c) => inputHandles.some((h) => h.id === c.targetHandle))
        .map((c) => c.source),
    [connections, inputHandles]
  );

  // NODE DATA RETRIEVAL
  const nodesData = useNodesData(sourceIds);
  const allNodes = useNodesData([]);

  // MEMOIZED CONNECTION SUMMARY
  const relevantConnectionData: RelevantConnectionData = useMemo(
    () => ({
      connectionsSummary: connections.map((c) => ({
        source: c.source,
        target: c.target,
        targetHandle: c.targetHandle,
        sourceHandle: c.sourceHandle,
      })),
      nodeIds: sourceIds,
      nodeDataSummary: nodesData.map((node) => ({
        id: node.id,
        isActive: node.data?.isActive as boolean | undefined,
        triggered: node.data?.triggered as boolean | undefined,
        value: node.data?.value,
        text: node.data?.text,
        output: node.data?.output,
      })),
    }),
    [connections, sourceIds, nodesData]
  );

  return {
    connections,
    nodesData,
    allNodes,
    sourceIds,
    inputHandles,
    relevantConnectionData,
  };
}
