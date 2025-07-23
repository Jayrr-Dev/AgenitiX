/**
 * USE FLOW EDITOR STATE HOOK - Complete flow editor state management
 *
 * • Manages all flow editor state including nodes, edges, and selection
 * • Provides CRUD operations for nodes and edges with validation
 * • Handles copy-paste functionality with automatic ID generation
 * • Manages error tracking and logging for individual nodes
 * • Provides computed values and selection management utilities
 *
 * Keywords: state-management, CRUD, copy-paste, error-tracking, selection, computed-values
 */

import { useCallback, useMemo, useState } from "react";
import { INITIAL_EDGES, INITIAL_NODES, MAX_ERRORS_PER_NODE } from "../constants";
import type { AgenEdge, AgenNode, NodeError } from "../types/nodeData";
import { generateEdgeId, generateNodeId } from "../utils/nodeUtils";
import { getNodeOutput } from "../utils/outputUtils";

export function useFlowEditorState() {
	// ============================================================================
	// STATE
	// ============================================================================

	const [nodes, setNodes] = useState<AgenNode[]>(INITIAL_NODES);
	const [edges, setEdges] = useState<AgenEdge[]>(INITIAL_EDGES);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
	const [copiedNodes, setCopiedNodes] = useState<AgenNode[]>([]);
	const [copiedEdges, setCopiedEdges] = useState<AgenEdge[]>([]);
	const [nodeErrors, setNodeErrors] = useState<Record<string, NodeError[]>>({});
	const [showHistoryPanel, setShowHistoryPanel] = useState(false);
	const [inspectorLocked, setInspectorLocked] = useState(false);

	// ============================================================================
	// COMPUTED VALUES
	// ============================================================================

	const selectedNode = useMemo(() => {
		const result = selectedNodeId ? (nodes.find((n) => n.id === selectedNodeId) ?? null) : null;
		return result;
	}, [nodes, selectedNodeId]);

	const selectedEdge = useMemo(
		() => (selectedEdgeId ? (edges.find((e) => e.id === selectedEdgeId) ?? null) : null),
		[edges, selectedEdgeId]
	);

	const selectedOutput = useMemo(
		() => (selectedNode ? getNodeOutput(selectedNode, nodes, edges) : null),
		[selectedNode, nodes, edges]
	);

	// ============================================================================
	// NODE OPERATIONS
	// ============================================================================

	const updateNodeData = useCallback((id: string, patch: Record<string, unknown>) => {
		setNodes((nds) =>
			nds.map((n) => (n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AgenNode) : n))
		);
	}, []);

	const addNode = useCallback((node: AgenNode) => {
		setNodes((nds) => nds.concat(node));
	}, []);

	const removeNode = useCallback((nodeId: string) => {
		setNodes((nds) => nds.filter((n) => n.id !== nodeId));
		setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
	}, []);

	const updateNodeId = useCallback(
		(oldId: string, newId: string) => {
			// Check if new ID already exists
			const existingNode = nodes.find((n) => n.id === newId);
			if (existingNode) {
				return false;
			}

			// Update the node ID
			setNodes((nds) => nds.map((n) => (n.id === oldId ? ({ ...n, id: newId } as AgenNode) : n)));

			// Update all edges that reference this node
			setEdges((eds) =>
				eds.map((e) => ({
					...e,
					source: e.source === oldId ? newId : e.source,
					target: e.target === oldId ? newId : e.target,
				}))
			);

			// Update selected node ID if it was the one being changed
			if (selectedNodeId === oldId) {
				setSelectedNodeId(newId);
			}

			// Update node errors mapping
			setNodeErrors((prev) => {
				if (prev[oldId]) {
					const { [oldId]: oldErrors, ...rest } = prev;
					return { ...rest, [newId]: oldErrors };
				}
				return prev;
			});

			return true;
		},
		[nodes, selectedNodeId]
	);

	// ============================================================================
	// EDGE OPERATIONS
	// ============================================================================

	const addEdge = useCallback((edge: AgenEdge) => {
		setEdges((eds) => eds.concat(edge));
	}, []);

	const removeEdge = useCallback((edgeId: string) => {
		setEdges((eds) => eds.filter((e) => e.id !== edgeId));
	}, []);

	// ============================================================================
	// ERROR MANAGEMENT
	// ============================================================================

	const logNodeError = useCallback(
		(nodeId: string, message: string, type: NodeError["type"] = "error", source?: string) => {
			const errorEntry: NodeError = {
				timestamp: Date.now(),
				message,
				type,
				source,
			};

			setNodeErrors((prev) => ({
				...prev,
				[nodeId]: [...(prev[nodeId] || []), errorEntry].slice(-MAX_ERRORS_PER_NODE),
			}));
		},
		[]
	);

	const clearNodeErrors = useCallback((nodeId: string) => {
		setNodeErrors((prev) => ({
			...prev,
			[nodeId]: [],
		}));
	}, []);

	// ============================================================================
	// COPY/PASTE OPERATIONS
	// ============================================================================

	const copySelectedNodes = useCallback(() => {
		const selected = nodes.filter((n) => n.selected);
		if (selected.length === 0) return;

		setCopiedNodes(selected);
		setCopiedEdges(
			edges.filter(
				(e) => selected.some((n) => n.id === e.source) && selected.some((n) => n.id === e.target)
			)
		);
	}, [nodes, edges]);

	const pasteNodes = useCallback(
		(offset: { x: number; y: number } = { x: 40, y: 40 }) => {
			if (copiedNodes.length === 0) return;

			const idMap: Record<string, string> = {};
			const newNodes = copiedNodes.map((n) => {
				const newId = generateNodeId();
				idMap[n.id] = newId;

				return {
					...n,
					id: newId,
					position: { x: n.position.x + offset.x, y: n.position.y + offset.y },
					selected: false,
					data: { ...n.data },
				} as AgenNode;
			});

			const newEdges = copiedEdges
				.map((e) => {
					if (idMap[e.source] && idMap[e.target]) {
						return {
							...e,
							id: generateEdgeId(),
							source: idMap[e.source],
							target: idMap[e.target],
							selected: false,
						};
					}
					return null;
				})
				.filter(Boolean) as AgenEdge[];

			setNodes((nds) => nds.concat(newNodes));
			setEdges((eds) => eds.concat(newEdges));
		},
		[copiedNodes, copiedEdges]
	);

	// ============================================================================
	// SELECTION MANAGEMENT
	// ============================================================================

	const selectNode = useCallback(
		(nodeId: string | null) => {
			// Don't change selection if inspector is locked
			if (inspectorLocked) {
				return;
			}
			setSelectedNodeId(nodeId);
			setSelectedEdgeId(null); // Clear edge selection when selecting a node
		},
		[inspectorLocked]
	);

	const selectEdge = useCallback(
		(edgeId: string | null) => {
			// Don't change selection if inspector is locked
			if (inspectorLocked) {
				return;
			}
			setSelectedEdgeId(edgeId);
			// Only clear node selection if we're actually selecting an edge
			if (edgeId !== null) {
				setSelectedNodeId(null); // Clear node selection when selecting an edge
			}
		},
		[inspectorLocked]
	);

	const clearSelection = useCallback(() => {
		// Don't change selection if inspector is locked
		if (inspectorLocked) {
			return;
		}
		setSelectedNodeId(null);
		setSelectedEdgeId(null);
	}, [inspectorLocked]);

	// ============================================================================
	// HISTORY PANEL
	// ============================================================================

	const toggleHistoryPanel = useCallback(() => {
		setShowHistoryPanel((prev) => !prev);
	}, []);

	// ============================================================================
	// RETURN STATE AND ACTIONS
	// ============================================================================

	return {
		// State
		nodes,
		edges,
		selectedNodeId,
		selectedEdgeId,
		selectedNode,
		selectedEdge,
		selectedOutput,
		copiedNodes,
		copiedEdges,
		nodeErrors,
		showHistoryPanel,
		inspectorLocked,

		// Node operations
		setNodes,
		setEdges,
		updateNodeData,
		updateNodeId,
		addNode,
		removeNode,

		// Edge operations
		addEdge,
		removeEdge,

		// Error management
		logNodeError,
		clearNodeErrors,

		// Copy/paste
		copySelectedNodes,
		pasteNodes,

		// Selection
		selectNode,
		selectEdge,
		clearSelection,

		// Inspector lock
		setInspectorLocked,

		// History
		toggleHistoryPanel,
		setShowHistoryPanel,
	};
}
