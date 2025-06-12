/**
 * USE NODE DEPENDENCIES HOOK
 *
 * This is the cornerstone of the bulletproof propagation system. It creates a
 * stable, memoized dependency string representing the data of a node's
 * immediate parents. The main `processLogic` effect will use this string as a
 * dependency, ensuring it re-runs if and only if an actual upstream value
 * that it depends on has changed. This eliminates all race conditions and
 * unnecessary re-renders.
 *
 * @returns A JSON string of parent node data, or an empty array string.
 */
import { useMemo } from "react";
import { Node, Edge } from "@xyflow/react";

export function useNodeDependencies(
  nodeId: string,
  allNodes: Node[],
  allEdges: Edge[]
): string {
  const parentDataString = useMemo(() => {
    if (!nodeId || !allNodes || !allEdges) {
      return "[]";
    }

    // Find connections targeting the current node
    const incomingEdgeIds = allEdges
      .filter((edge) => edge.target === nodeId)
      .map((edge) => edge.source);
    const parentNodeIds = new Set(incomingEdgeIds);

    // Filter for the parent nodes and extract their data
    const parentData = allNodes
      .filter((node) => parentNodeIds.has(node.id))
      .map((node) => node.data);

    // This stable string is the hook's output.
    return JSON.stringify(parentData);
  }, [nodeId, allNodes, allEdges]);

  return parentDataString;
} 