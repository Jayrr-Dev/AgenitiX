/**
 * GRAPH HELPERS - Utility functions for history graph management
 *
 * • Graph creation and manipulation utilities
 * • Node creation with proper parent-child relationships
 * • Persistence helpers for localStorage integration
 * • ID generation and state validation
 *
 * Keywords: graph-utilities, node-creation, persistence, validation
 */

// Lightweight runtime compression for large graphs (≈70% smaller). Adds <2 KB to bundle.
import { compressToUTF16, decompressFromUTF16 } from "lz-string";
import { generateNodeId as generateReadableNodeId } from "../../flow-engine/utils/nodeUtils";
import type { FlowState, HistoryGraph, HistoryNode, NodeId } from "./historyGraph";

// Generate unique IDs for history nodes
export const generateNodeId = (): NodeId => generateReadableNodeId();

// Create the initial root graph with starting state
export const createRootGraph = (initialState: FlowState): HistoryGraph => {
	const rootId: NodeId = "root";
	return {
		root: rootId,
		cursor: rootId,
		nodes: {
			[rootId]: {
				id: rootId,
				parentId: null,
				childrenIds: [],
				label: "INITIAL",
				before: initialState,
				after: initialState,
				createdAt: Date.now(),
			},
		},
	};
};

// Create a new child node and link it to its parent
export const createChildNode = (
	graph: HistoryGraph,
	parentId: NodeId,
	label: string,
	before: FlowState,
	after: FlowState,
	metadata?: Record<string, unknown>
): NodeId => {
	const id = generateNodeId();
	const node: HistoryNode = {
		id,
		parentId,
		childrenIds: [],
		label,
		before,
		after,
		createdAt: Date.now(),
		metadata,
	};

	// Add child to parent's children list
	graph.nodes[parentId].childrenIds.push(id);
	// Add node to graph
	graph.nodes[id] = node;

	return id;
};

// Deep clone a FlowState to avoid reference issues
export const cloneFlowState = (state: FlowState): FlowState => ({
	nodes: state.nodes.map((node) => ({
		...node,
		position: { ...node.position },
		data: node.data ? { ...node.data } : node.data,
	})),
	edges: state.edges.map((edge) => ({
		...edge,
		data: edge.data ? { ...edge.data } : edge.data,
	})),
});

// Check if two FlowStates are equal
export const areStatesEqual = (state1: FlowState, state2: FlowState): boolean => {
	return (
		JSON.stringify(state1.nodes) === JSON.stringify(state2.nodes) &&
		JSON.stringify(state1.edges) === JSON.stringify(state2.edges)
	);
};

// Get the path from root to current cursor (for breadcrumb display)
export const getPathToCursor = (graph: HistoryGraph): HistoryNode[] => {
	const path: HistoryNode[] = [];
	let currentId: NodeId | null = graph.cursor;

	while (currentId) {
		const node: HistoryNode = graph.nodes[currentId];
		if (!node) {
			break;
		}
		path.unshift(node);
		currentId = node.parentId;
	}

	return path;
};

// Get all leaf nodes (endpoints) in the graph
export const getLeafNodes = (graph: HistoryGraph): HistoryNode[] => {
	return Object.values(graph.nodes).filter((node) => node.childrenIds.length === 0);
};

// Persistence helpers
const STORAGE_KEY_PREFIX = "workflow-history-graph-v5"; // bump version for flow-specific storage

const getStorageKey = (flowId?: string): string => {
	return flowId ? `${STORAGE_KEY_PREFIX}-${flowId}` : `${STORAGE_KEY_PREFIX}-default`;
};

export const saveGraph = (graph: HistoryGraph, flowId?: string): void => {
	// Guard against server-side execution where localStorage is unavailable
	if (typeof window === "undefined") {
		return;
	}
	try {
		const json = JSON.stringify(graph);
		// Compress if payload > 1 MB (threshold chosen to avoid diminishing returns on small graphs)
		const payload = json.length > 1_000_000 ? `lz:${compressToUTF16(json)}` : json;
		const storageKey = getStorageKey(flowId);
		window.localStorage.setItem(storageKey, payload);
	} catch (error) {
		console.error("[GraphHelpers] Failed to save graph to localStorage:", error);
	}
};

export const loadGraph = (flowId?: string): HistoryGraph | null => {
	// Skip on server – nothing to load
	if (typeof window === "undefined") {
		return null;
	}
	try {
		const storageKey = getStorageKey(flowId);
		const stored = window.localStorage.getItem(storageKey);
		if (!stored) {
			return null;
		}

		const data = stored.startsWith("lz:") ? decompressFromUTF16(stored.slice(3)) : stored;

		if (!data) {
			return null; // decompression failure
		}

		return JSON.parse(data);
	} catch (error) {
		console.error("[GraphHelpers] Failed to load graph:", error);
		return null;
	}
};

export const clearPersistedGraph = (flowId?: string): void => {
	if (typeof window === "undefined") {
		return;
	}
	try {
		const storageKey = getStorageKey(flowId);
		window.localStorage.removeItem(storageKey);
	} catch (error) {
		console.warn("[GraphHelpers] Failed to clear persisted graph:", error);
	}
};

// Clear all flow histories (useful for cleanup)
export const clearAllPersistedGraphs = (): void => {
	try {
		const keys = Object.keys(window.localStorage);
		for (const key of keys) {
			if (key.startsWith(STORAGE_KEY_PREFIX)) {
				window.localStorage.removeItem(key);
			}
		}
	} catch (error) {
		console.warn("[GraphHelpers] Failed to clear all persisted graphs:", error);
	}
};

// Graph statistics for debugging/UI
export const getGraphStats = (graph: HistoryGraph) => {
	const totalNodes = Object.keys(graph.nodes).length;
	const branches = Object.values(graph.nodes).filter((node) => node.childrenIds.length > 1).length;
	const leafNodes = getLeafNodes(graph).length;
	const maxDepth = getPathToCursor(graph).length - 1; // -1 to exclude root

	return {
		totalNodes,
		branches,
		leafNodes,
		maxDepth,
		currentDepth: maxDepth,
	};
};

// PRUNE GRAPH TO LIMIT SIZE
// Removes oldest states by promoting subsequent children to root until
// the total number of nodes is within the specified limit.
// This follows a FIFO approach along the chronological order of creation,
// effectively "moving the initial state forward".
export const pruneGraphToLimit = (graph: HistoryGraph, maxSize: number): void => {
	// Safety checks
	if (maxSize <= 0) {
		return;
	}

	// Continue pruning until we meet the size requirement
	while (Object.keys(graph.nodes).length > maxSize) {
		const currentRoot = graph.nodes[graph.root];
		if (!currentRoot) {
			// Should not happen, but break to avoid infinite loop
			console.warn("[GraphHelpers] pruneGraphToLimit: root node missing – aborting prune");
			break;
		}

		// If the current root has no children we cannot prune further safely
		if (currentRoot.childrenIds.length === 0) {
			console.warn("[GraphHelpers] pruneGraphToLimit: reached leaf root – cannot prune further");
			break;
		}

		// Promote the FIRST child to become the new root (chronologically oldest)
		const [newRootId, ...remainingChildren] = currentRoot.childrenIds;

		// Update new root parent reference
		const newRootNode = graph.nodes[newRootId];
		if (newRootNode) {
			newRootNode.parentId = null;
		}

		// All siblings of the new root also become top-level nodes (parentId = null)
		for (const childId of remainingChildren) {
			const childNode = graph.nodes[childId];
			if (childNode) {
				childNode.parentId = null;
			}
		}

		// Remove the old root
		delete graph.nodes[graph.root];

		// Re-assign graph.root
		graph.root = newRootId;

		// If cursor pointed to the removed root, update it to newRootId
		if (graph.cursor === currentRoot.id) {
			graph.cursor = newRootId;
		}
	}
};

// REMOVE NODE AND ALL ITS CHILDREN
// Removes a specific node and all its descendants from the history graph.
// Updates parent references and cursor position if necessary.
export const removeNodeAndChildren = (graph: HistoryGraph, nodeId: NodeId): boolean => {
	const nodeToRemove = graph.nodes[nodeId];
	if (!nodeToRemove) {
		console.warn(`[GraphHelpers] removeNodeAndChildren: node ${nodeId} not found`);
		return false;
	}

	// Cannot remove the root node
	if (nodeId === graph.root) {
		console.warn("[GraphHelpers] removeNodeAndChildren: cannot remove root node");
		return false;
	}

	// Collect all nodes to remove (node + all descendants)
	const nodesToRemove = new Set<NodeId>();
	const collectDescendants = (id: NodeId) => {
		nodesToRemove.add(id);
		const node = graph.nodes[id];
		if (node) {
			node.childrenIds.forEach(collectDescendants);
		}
	};
	collectDescendants(nodeId);

	// Update cursor if it points to a node being removed
	if (nodesToRemove.has(graph.cursor)) {
		// Move cursor to the parent of the removed node
		graph.cursor = nodeToRemove.parentId || graph.root;
	}

	// Remove the node from its parent's children list
	if (nodeToRemove.parentId) {
		const parent = graph.nodes[nodeToRemove.parentId];
		if (parent) {
			parent.childrenIds = parent.childrenIds.filter((id) => id !== nodeId);
		}
	}

	// Remove all collected nodes from the graph
	for (const id of nodesToRemove) {
		delete graph.nodes[id];
	}
	return true;
};
