/**
 * RENDER HISTORY GRAPH - Visualizes the history graph in ReactFlow
 *
 * • Converts HistoryGraph data into ReactFlow nodes/edges
 * • Simple hierarchical layout (depth ➜ y-axis, sibling index ➜ x-axis)
 * • Highlights current cursor node
 * • Designed for use inside HistoryPanel graph view
 *
 * Keywords: history-visualization, graph-view, reactflow, undo-redo
 */

"use client";

import {
	Background,
	type BackgroundVariant,
	Controls,
	type Edge,
	type Node,
	ReactFlow,
	ReactFlowProvider,
} from "@xyflow/react";
import React, { useCallback, useMemo } from "react";
import type { HistoryNode } from "./historyGraph";

// LAYOUT CONSTANTS
const LAYOUT_CONFIG = {
	nodeWidth: 60, // wider to accommodate wrapped text
	nodeHeight: 60, // keep height for better layout
	xGap: 30,
	yGap: 40,
} as const;

// NODE STYLING CONSTANTS
const NODE_STYLES = {
	base: {
		fontSize: "12px",
		color: "black",
		borderWidth: 1,
		borderRadius: "9999px",
		whiteSpace: "normal" as const,
		overflow: "hidden" as const,
		textOverflow: "ellipsis" as const,
		wordBreak: "break-word" as const,
		hyphens: "auto" as const,
		lineHeight: "1.1",
		padding: "2px",
	},
	className:
		"flex items-center justify-center font-semibold select-none transition-colors text-center",
	cursorRing: "ring-2 ring-primary/80",
	futureNode: {
		opacity: 0.4,
		filter: "grayscale(0.6)",
	},
} as const;

// ACTION TYPE COLOR MAPPING
const ACTION_TYPE_COLORS = {
	node_add: {
		bg: "--core-status-node-add-bg",
		border: "--core-status-node-add-border",
	},
	node_delete: {
		bg: "--core-status-node-delete-bg",
		border: "--core-status-node-delete-border",
	},
	node_move: {
		bg: "--core-status-node-move-bg",
		border: "--core-status-node-move-border",
	},
	node_update: {
		bg: "--core-status-node-update-bg",
		border: "--core-status-node-update-border",
	},
	edge_add: {
		bg: "--core-status-edge-add-bg",
		border: "--core-status-edge-add-border",
	},
	edge_delete: {
		bg: "--core-status-edge-delete-bg",
		border: "--core-status-edge-delete-border",
	},
	bulk_delete: {
		bg: "--core-status-bulk-delete-bg",
		border: "--core-status-bulk-delete-border",
	},
	bulk_update: {
		bg: "--core-status-bulk-update-bg",
		border: "--core-status-bulk-update-border",
	},
	paste: {
		bg: "--core-status-paste-bg",
		border: "--core-status-paste-border",
	},
	duplicate: {
		bg: "--core-status-duplicate-bg",
		border: "--core-status-duplicate-border",
	},
	special: {
		bg: "--core-status-special-bg",
		border: "--core-status-special-border",
	},
} as const;

// EDGE STYLING CONSTANTS
const EDGE_STYLES = {
	animated: false,
	style: { strokeWidth: 1.5 },
} as const;

// REACTFLOW CONFIGURATION
const REACTFLOW_CONFIG = {
	id: "historyGraph",
	fitView: true,
	proOptions: { hideAttribution: true },
	zoomOnScroll: true,
	panOnScroll: true,
	panOnDrag: true,
	zoomOnPinch: true,
	nodesDraggable: false,
	nodesConnectable: false,
	elevateNodesOnSelect: false,
} as const;

// BACKGROUND CONFIGURATION
const BACKGROUND_CONFIG = {
	variant: "" as BackgroundVariant,
	gap: 12,
	size: 1,
} as const;

// CONTROLS CONFIGURATION
const CONTROLS_CONFIG = {
	showInteractive: false,
	position: "top-right" as const,
	className: "history-graph-controls",
	orientation: "horizontal" as const,
} as const;

// CONTAINER STYLING
const CONTAINER_STYLES = {
	base: "relative w-full overflow-hidden [&_.react-flow__handle]:!opacity-0 [&_[data-handleid]]:!opacity-0 [&_[data-handlepos]]:!opacity-0 [&_.react-flow__handle-top]:!opacity-0 [&_.react-flow__handle-bottom]:!opacity-0 [&_.react-flow__handle-left]:!opacity-0 [&_.react-flow__handle-right]:!opacity-0",
} as const;

interface RenderHistoryGraphProps {
	graph: {
		nodes: Record<string, HistoryNode>;
		root: string;
		cursor: string;
	};
	height?: number | string;
	onJumpToState?: (nodeId: string) => void;
	onNodeSelect?: (nodeId: string) => void;
	selectedNodeId?: string | null;
}

const RenderHistoryGraph: React.FC<RenderHistoryGraphProps> = ({
	graph,
	height = 320,
	onJumpToState,
	onNodeSelect,
	selectedNodeId,
}) => {
	const [internalSelectedNodeId, setInternalSelectedNodeId] = React.useState<string | null>(null);

	// Use external selectedNodeId if provided, otherwise use internal state
	const currentSelectedNodeId =
		selectedNodeId !== undefined ? selectedNodeId : internalSelectedNodeId;

	// Update selected node when cursor changes (auto-update glow on new actions)
	React.useEffect(() => {
		if (selectedNodeId === undefined) {
			setInternalSelectedNodeId(graph.cursor);
		}
	}, [graph.cursor, selectedNodeId]);

	// Memoize reachable nodes calculation with better dependency tracking
	const reachableNodes = useMemo(() => {
		const reachableSet = new Set<string>();
		const visited = new Set<string>();

		// Trace path from cursor back to root
		let currentId = graph.cursor;
		while (currentId && !visited.has(currentId)) {
			visited.add(currentId);
			reachableSet.add(currentId);
			const currentNode = graph.nodes[currentId];
			currentId = currentNode?.parentId || "";
		}

		return reachableSet;
	}, [graph.cursor, graph.nodes]);

	// Helper function to create a node object
	const createHistoryNode = useCallback(
		(
			node: HistoryNode,
			depth: number,
			siblingIndex: number,
			reachableNodes: Set<string>,
			currentSelectedNodeId: string | null,
			graph: { cursor: string; nodes: Record<string, HistoryNode> }
		): Node => {
			const isCursor = node.id === graph.cursor;
			const isFuture = !reachableNodes.has(node.id);
			const isSelected = currentSelectedNodeId === node.id;
			const actionType = node.metadata?.actionType || "special";

			const { bg: bgVar, border: borderVar } =
				ACTION_TYPE_COLORS[actionType as keyof typeof ACTION_TYPE_COLORS] ||
				ACTION_TYPE_COLORS.special;

			// Calculate position with better branch spacing
			let xPosition = siblingIndex * (LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.xGap);

			// For branches (nodes with siblings), add extra spacing to prevent overlap
			if (node.parentId && graph.nodes[node.parentId]) {
				const parent = graph.nodes[node.parentId];
				const siblingCount = (parent.childrenIds || []).length;
				if (siblingCount > 1) {
					// Center the branches around the parent's x position if possible
					const parentSiblingIndex = 0; // We'd need to track this better for perfect centering
					const branchSpacing = LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.xGap * 2;
					const totalBranchWidth = (siblingCount - 1) * branchSpacing;
					const startOffset = -totalBranchWidth / 2;
					xPosition =
						parentSiblingIndex * (LAYOUT_CONFIG.nodeWidth + LAYOUT_CONFIG.xGap) +
						startOffset +
						siblingIndex * branchSpacing;
				}
			}

			return {
				id: node.id,
				data: { label: node.label || "" },
				position: {
					x: xPosition,
					y: depth * (LAYOUT_CONFIG.nodeHeight + LAYOUT_CONFIG.yGap),
				},
				type: "default",
				width: LAYOUT_CONFIG.nodeWidth,
				height: LAYOUT_CONFIG.nodeHeight,
				className: `${NODE_STYLES.className} ${isCursor ? NODE_STYLES.cursorRing : ""} ${isSelected ? "history-node-selected" : ""}`,
				style: {
					...NODE_STYLES.base,
					backgroundColor: `var(${bgVar})`,
					borderColor: `var(${borderVar})`,
					...(isFuture ? NODE_STYLES.futureNode : {}),
				},
				draggable: false,
			};
		},
		[]
	);

	// Helper function to create edges for a node
	const createHistoryEdges = useCallback(
		(node: HistoryNode, reachableNodes: Set<string>, processedNodes: Set<string>): Edge[] => {
			const edges: Edge[] = [];

			for (const childId of node.childrenIds || []) {
				if (!processedNodes.has(childId)) {
					const isChildFuture = !reachableNodes.has(childId);
					const isParentFuture = !reachableNodes.has(node.id);
					const isEdgeFuture = isChildFuture || isParentFuture;

					edges.push({
						id: `${node.id}-${childId}`,
						source: node.id,
						target: childId,
						animated: EDGE_STYLES.animated,
						style: {
							...EDGE_STYLES.style,
							...(isEdgeFuture ? { opacity: 0.4 } : {}),
						},
					});
				}
			}

			return edges;
		},
		[]
	);

	// Memoize node creation with stable references
	const { nodes, edges } = useMemo(() => {
		const rfNodes: Node[] = [];
		const rfEdges: Edge[] = [];
		const processedNodes = new Set<string>();

		// BFS traversal to assign positions with proper branch spacing
		const queue: Array<{ id: string; depth: number; parentId?: string; siblingIndex: number }> = [
			{ id: graph.root, depth: 0, siblingIndex: 0 },
		];

		while (queue.length > 0) {
			const item = queue.shift();
			if (!item) {
				continue;
			}
			const { id, depth, siblingIndex } = item;

			if (processedNodes.has(id)) {
				continue;
			}
			processedNodes.add(id);

			const node = graph.nodes[id];
			if (!node) {
				continue;
			}

			// Create node using helper function with improved positioning
			const nodeObj = createHistoryNode(
				node,
				depth,
				siblingIndex,
				reachableNodes,
				currentSelectedNodeId,
				graph
			);
			rfNodes.push(nodeObj);

			// Create edges using helper function
			const nodeEdges = createHistoryEdges(node, reachableNodes, processedNodes);
			rfEdges.push(...nodeEdges);

			// Add children to queue with proper sibling indexing
			const children = node.childrenIds || [];
			children.forEach((childId, index) => {
				if (!processedNodes.has(childId)) {
					queue.push({
						id: childId,
						depth: depth + 1,
						parentId: id,
						siblingIndex: index,
					});
				}
			});
		}

		return { nodes: rfNodes, edges: rfEdges };
	}, [graph, reachableNodes, currentSelectedNodeId, createHistoryNode, createHistoryEdges]);

	// Memoize click handler to prevent unnecessary re-renders
	const handleNodeClick = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			// Handle selection
			if (onNodeSelect) {
				onNodeSelect(node.id);
			} else {
				setInternalSelectedNodeId(node.id);
			}

			// Handle jump to state
			if (onJumpToState) {
				onJumpToState(node.id);
			}
		},
		[onJumpToState, onNodeSelect]
	);

	// Memoize ReactFlow props to prevent unnecessary re-renders
	const reactFlowProps = useMemo(
		() => ({
			id: REACTFLOW_CONFIG.id,
			nodes,
			edges,
			fitView: REACTFLOW_CONFIG.fitView,
			proOptions: REACTFLOW_CONFIG.proOptions,
			zoomOnScroll: REACTFLOW_CONFIG.zoomOnScroll,
			panOnScroll: REACTFLOW_CONFIG.panOnScroll,
			panOnDrag: REACTFLOW_CONFIG.panOnDrag,
			zoomOnPinch: REACTFLOW_CONFIG.zoomOnPinch,
			nodesDraggable: REACTFLOW_CONFIG.nodesDraggable,
			nodesConnectable: REACTFLOW_CONFIG.nodesConnectable,
			elevateNodesOnSelect: REACTFLOW_CONFIG.elevateNodesOnSelect,
			onNodeClick: handleNodeClick,
		}),
		[nodes, edges, handleNodeClick]
	);

	return (
		<div style={{ height }} className={CONTAINER_STYLES.base}>
			<style>
				{`
          .react-flow__controls.history-graph-controls {
            background-color: var(--infra-history-bg) !important;
            border: 1px solid var(--infra-history-border) !important;
            border-radius: 6px !important;
          }
          .react-flow__controls.history-graph-controls button {
            background-color: var(--infra-history-bg) !important;
            border: 1px solid var(--infra-history-border) !important;
            color: var(--infra-history-text) !important;
          }
          .react-flow__controls.history-graph-controls button:hover {
            background-color: var(--infra-history-bg-hover) !important;
          }

          /* History graph node hover and select effects */
          #historyGraph .react-flow__node:hover {
            box-shadow: 0 0 8px 1px rgba(156, 163, 175, 0.9) !important;
            transition: box-shadow 0.2s ease-in-out !important;
          }

          #historyGraph .react-flow__node.history-node-selected {
            box-shadow: 0 0 10px 2px rgba(34, 197, 94, 0.95) !important;
            transition: box-shadow 0.2s ease-in-out !important;
          }

          #historyGraph .react-flow__node.history-node-selected:hover {
            box-shadow: 0 0 12px 2px rgba(34, 197, 94, 1.0) !important;
          }
        `}
			</style>
			<ReactFlowProvider>
				<ReactFlow {...reactFlowProps}>
					<Background
						variant={BACKGROUND_CONFIG.variant}
						gap={BACKGROUND_CONFIG.gap}
						size={BACKGROUND_CONFIG.size}
					/>
					<Controls
						className={CONTROLS_CONFIG.className}
						showInteractive={CONTROLS_CONFIG.showInteractive}
						position={CONTROLS_CONFIG.position}
						orientation={CONTROLS_CONFIG.orientation}
					/>
				</ReactFlow>
			</ReactFlowProvider>
		</div>
	);
};

// Memoize to prevent unnecessary re-renders when props are unchanged
export default React.memo(RenderHistoryGraph);
