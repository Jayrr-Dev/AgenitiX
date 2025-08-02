/**
 * EDGE UTILITIES - React Flow edge handling utilities
 *
 * • Handle edge finding by base handle names (ignoring type suffixes)
 * • Consistent edge lookup patterns across all nodes
 * • Type-safe edge operations with proper error handling
 *
 * Keywords: ReactFlow, edges, handles, type-safety, utilities
 */

import type { Edge, EdgeChange } from "@xyflow/react";

/**
 * Find edge by target handle base name (ignoring type suffixes)
 *
 * React Flow generates handle IDs with type suffixes (e.g., "trigger__b", "text-input__s"),
 * but we want to find edges by their base handle names (e.g., "trigger", "text-input").
 *
 * @param edges - Array of edges to search through
 * @param targetId - Target node ID
 * @param handleBaseName - Base handle name (e.g., "trigger", "text-input")
 * @returns Edge or undefined
 */
export const findEdgeByHandle = (
	edges: Edge[],
	targetId: string,
	handleBaseName: string
): Edge | undefined => {
	return edges.find((e) => e.target === targetId && e.targetHandle?.startsWith(handleBaseName));
};

/**
 * Find all edges connected to a specific node handle
 *
 * @param edges - Array of edges to search through
 * @param nodeId - Node ID to search for
 * @param handleBaseName - Base handle name (e.g., "trigger", "text-input")
 * @returns Array of connected edges
 */
export const findEdgesByHandle = (
	edges: Edge[],
	nodeId: string,
	handleBaseName: string
): Edge[] => {
	return edges.filter((e) => e.target === nodeId && e.targetHandle?.startsWith(handleBaseName));
};

/**
 * Check if a node has any input connections
 *
 * @param edges - Array of edges to search through
 * @param nodeId - Node ID to check for incoming connections
 * @returns True if node has at least one input connection
 */
export const hasInputConnections = (edges: Edge[], nodeId: string): boolean => {
	return edges.some((edge) => edge.target === nodeId);
};

/**
 * Check if a node has connections to specific input handles
 *
 * @param edges - Array of edges to search through
 * @param nodeId - Node ID to check
 * @param handleBaseNames - Array of handle base names to check (e.g., ["trigger", "text-input"])
 * @returns True if node has connections to any of the specified handles
 */
export const hasSpecificInputConnections = (
	edges: Edge[],
	nodeId: string,
	handleBaseNames: string[]
): boolean => {
	return handleBaseNames.some((handleBaseName) => {
		return findEdgeByHandle(edges, nodeId, handleBaseName) !== undefined;
	});
};

/**
 * Extract nodes that lost input connections from edge changes
 *
 * @param changes - Array of edge changes from React Flow
 * @param edges - Current edges array (before changes are applied)
 * @returns Array of node IDs that lost their last input connection
 */
export const getNodesWithRemovedInputs = (changes: EdgeChange[], edges: Edge[]): string[] => {
	const removedEdges = changes
		.filter((change) => change.type === "remove")
		.map((change) => (change as any).id)
		.filter((id): id is string => id !== undefined);

	if (removedEdges.length === 0) {
		return [];
	}

	const affectedNodeIds = new Set<string>();

	// Find nodes that were targets of removed edges
	for (const edgeId of removedEdges) {
		const removedEdge = edges.find((edge) => edge.id === edgeId);
		if (removedEdge?.target) {
			affectedNodeIds.add(removedEdge.target);
		}
	}

	// Check if any affected nodes still have input connections after removal
	const remainingEdges = edges.filter((edge) => !removedEdges.includes(edge.id));
	const nodesWithoutInputs: string[] = [];

	for (const nodeId of affectedNodeIds) {
		const stillHasInputs = remainingEdges.some((edge) => edge.target === nodeId);
		if (!stillHasInputs) {
			nodesWithoutInputs.push(nodeId);
		}
	}

	return nodesWithoutInputs;
};

/**
 * Extract value from source node data with fallback chain
 *
 * @param nodeData - Source node data
 * @param fallbackValue - Value to return if no data found
 * @returns Extracted value or fallback
 */
export const extractNodeValue = (
	nodeData: Record<string, unknown> | null | undefined,
	fallbackValue: unknown = null
): unknown => {
	if (!nodeData) {
		return fallbackValue;
	}

	// Priority chain: outputs ➜ store ➜ isActive ➜ fallback
	return nodeData.outputs ?? nodeData.store ?? nodeData.isActive ?? fallbackValue;
};
