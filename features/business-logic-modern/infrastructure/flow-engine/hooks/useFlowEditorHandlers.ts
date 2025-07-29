/**
 * FLOW EDITOR HANDLERS HOOK - Centralized handlers for flow editor operations
 *
 * • Node connection and edge management
 * • Flow state synchronization with Zustand
 * • Event handling with proper cleanup
 * • Performance optimized with proper memoization
 *
 * Keywords: flow-editor, handlers, zustand, connections, performance
 */

import type React from "react";
import { useCallback } from "react";
import { useUndoRedo } from "../../action-toolbar/history/UndoRedoContext";
import type { AgenEdge, AgenNode } from "../types/nodeData";
import { generateNodeId } from "../utils/nodeUtils";

// ============================================================================
// TYPES
// ============================================================================

export interface FlowEditorHandlers {
	handleNodesChange: (changes: any[]) => void;
	handleEdgesChange: (changes: any[]) => void;
	handleSelectionChange: (selection: any) => void;
	handleInit: (instance: any) => void;
	handleDeleteNode: (nodeId: string) => void;
	handleDuplicateNode: (nodeId: string) => void;
	handleUpdateNodeId: (oldId: string, newId: string) => void;
}

export interface ZustandActions {
	setNodes: (nodes: AgenNode[]) => void;
	setEdges: (edges: AgenEdge[]) => void;
	updateNodePosition: (id: string, position: { x: number; y: number }) => void;
	removeNode: (id: string) => void;
	removeEdge: (id: string) => void;
	selectNode: (id: string) => void;
	selectEdge: (id: string) => void;
	clearSelection: () => void;
	addNode: (node: AgenNode) => void;
}

export interface FlowEditorHandlersProps {
	nodes: AgenNode[];
	edges: AgenEdge[];
	flowInstanceRef: React.MutableRefObject<any>;
	zustandActions: ZustandActions;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique node ID for duplication
 */
function generateUniqueId(_originalId: string): string {
	return generateNodeId();
}

/**
 * Calculate offset position for duplicated nodes
 */
function calculateOffset(originalPosition: { x: number; y: number }): {
	x: number;
	y: number;
} {
	return {
		x: originalPosition.x + 40,
		y: originalPosition.y + 40,
	};
}

/**
 * Apply ReactFlow changes to nodes with Zustand sync
 */
function applyNodeChanges(
	changes: any[],
	nodes: AgenNode[],
	setNodes: (nodes: AgenNode[]) => void,
	updateNodePosition: (id: string, position: { x: number; y: number }) => void,
	removeNode: (id: string) => void,
	selectNode: (id: string) => void
) {
	// Create deep copy to avoid read-only property issues with Zustand immer
	const nodesCopy = JSON.parse(JSON.stringify(nodes)) as AgenNode[];
	const updatedNodes = require("@xyflow/react").applyNodeChanges(changes, nodesCopy);
	setNodes(updatedNodes);

	// Update Zustand store for specific operations
	// Note: UndoRedoManager automatically detects and records these changes
	changes.forEach((change) => {
		if (change.type === "position" && change.position) {
			updateNodePosition(change.id, change.position);
		} else if (change.type === "remove") {
			removeNode(change.id);
		} else if (change.type === "select" && change.selected) {
			selectNode(change.id);
		}
	});
}

/**
 * Apply ReactFlow changes to edges with Zustand sync
 */
function applyEdgeChanges(
	changes: any[],
	edges: AgenEdge[],
	setEdges: (edges: AgenEdge[]) => void,
	removeEdge: (id: string) => void,
	selectEdge: (id: string) => void
) {
	// Create deep copy to avoid read-only property issues with Zustand immer
	const edgesCopy = JSON.parse(JSON.stringify(edges)) as AgenEdge[];
	const updatedEdges = require("@xyflow/react").applyEdgeChanges(changes, edgesCopy);
	setEdges(updatedEdges);

	// Update Zustand store for specific operations
	// Note: UndoRedoManager automatically detects and records these changes
	changes.forEach((change) => {
		if (change.type === "remove") {
			removeEdge(change.id);
		} else if (change.type === "select" && change.selected) {
			selectEdge(change.id);
		}
	});
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Custom hook for managing ReactFlow event handlers with proper typing
 */
export function useFlowEditorHandlers({
	nodes,
	edges,
	flowInstanceRef,
	zustandActions,
}: FlowEditorHandlersProps): FlowEditorHandlers {
	const {
		setNodes,
		setEdges,
		updateNodePosition,
		removeNode,
		removeEdge,
		selectNode,
		selectEdge,
		clearSelection,
		addNode,
	} = zustandActions;

	// UNDO/REDO SYSTEM
	const { recordAction } = useUndoRedo();

	// ============================================================================
	// REACTFLOW CHANGE HANDLERS
	// ============================================================================

	const handleNodesChange = useCallback(
		(changes: any[]) => {
			applyNodeChanges(changes, nodes, setNodes, updateNodePosition, removeNode, selectNode);
		},
		[nodes, setNodes, updateNodePosition, removeNode, selectNode]
	);

	const handleEdgesChange = useCallback(
		(changes: any[]) => {
			applyEdgeChanges(changes, edges, setEdges, removeEdge, selectEdge);
		},
		[edges, setEdges, removeEdge, selectEdge]
	);

	const handleSelectionChange = useCallback(
		(selection: any) => {
			if (selection.nodes.length > 0) {
				selectNode(selection.nodes[0].id);
			} else if (selection.edges.length > 0) {
				selectEdge(selection.edges[0].id);
			} else {
				clearSelection();
			}
		},
		[selectNode, selectEdge, clearSelection]
	);

	const handleInit = useCallback((instance: any) => {
		flowInstanceRef.current = instance;
	}, []);

	// ============================================================================
	// NODE ACTION HANDLERS
	// ============================================================================

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			const nodeToDelete = nodes.find((n) => n.id === nodeId);
			if (!nodeToDelete) {
				return;
			}

			// Store metadata before deletion
			const nodeMetadata = {
				nodeId,
				nodeType: nodeToDelete.type,
				nodeLabel: nodeToDelete.data?.label || nodeToDelete.type,
				position: nodeToDelete.position,
			};

			// Perform the deletion first (updates Zustand state)
			removeNode(nodeId);

			// Clear selection if the deleted node was selected
			const currentSelectedId = nodes.find((n) => n.selected)?.id;
			if (currentSelectedId === nodeId) {
				clearSelection();
			}

			// Record action after state is updated (proper flow)
			recordAction("node_delete", nodeMetadata);
		},
		[removeNode, nodes, clearSelection, recordAction]
	);

	const handleDuplicateNode = useCallback(
		(nodeId: string) => {
			const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
			if (!nodeToDuplicate) {
				return;
			}

			// Create duplicated node
			const newId = generateUniqueId(nodeId);
			const offsetPosition = calculateOffset(nodeToDuplicate.position);

			const newNode = {
				...nodeToDuplicate,
				id: newId,
				position: offsetPosition,
				selected: false,
				data: { ...nodeToDuplicate.data },
			} as AgenNode;

			// Perform the duplication first (updates Zustand state)
			addNode(newNode);
			selectNode(newId);

			// Record action after state is updated (proper flow)
			recordAction("duplicate", {
				originalNodeId: nodeId,
				newNodeId: newId,
				nodeType: nodeToDuplicate.type,
				nodeLabel: nodeToDuplicate.data?.label || nodeToDuplicate.type,
				position: offsetPosition,
			});
		},
		[nodes, addNode, selectNode, recordAction]
	);

	const handleUpdateNodeId = useCallback((_oldId: string, _newId: string) => {}, []);

	// ============================================================================
	// RETURN HANDLERS
	// ============================================================================

	return {
		handleNodesChange,
		handleEdgesChange,
		handleSelectionChange,
		handleInit,
		handleDeleteNode,
		handleDuplicateNode,
		handleUpdateNodeId,
	};
}
