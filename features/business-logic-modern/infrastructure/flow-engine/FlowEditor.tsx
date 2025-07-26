"use client";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type {
	AgenEdge,
	AgenNode,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { generateNodeId } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/nodeUtils";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";

import ActionToolbar from "@/features/business-logic-modern/infrastructure/action-toolbar/ActionToolbar";
import Sidebar from "@/features/business-logic-modern/infrastructure/sidebar/Sidebar";
import { UndoRedoProvider, useUndoRedo } from "../action-toolbar/history/UndoRedoContext";
import UndoRedoManager from "../action-toolbar/history/UndoRedoManager";
import { useNodeStyleStore } from "../theming/stores/nodeStyleStore";
import { FlowCanvas } from "./components/FlowCanvas";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";

// Import the new NodeSpec registry
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";

// Helper function to get node spec from the new NodeSpec registry system
const getNodeSpecForType = async (nodeType: string) => {
	try {
		// Get metadata from the new NodeSpec registry
		const metadata = getNodeSpecMetadata(nodeType);
		if (!metadata) {
			console.warn(`No metadata found for node type: ${nodeType}`);
			return null;
		}

		// Return spec format for initial data
		return {
			kind: metadata.kind,
			displayName: metadata.displayName,
			category: metadata.category,
			initialData: metadata.initialData,
		};
	} catch (error) {
		console.error(`Failed to get spec for node type: ${nodeType}`, error);
		return null;
	}
};

/* -------------------------------------------------------------------------- */
/*  DESIGN CONSTANTS (verb-first names)                                        */
/* -------------------------------------------------------------------------- */

// Error view layout & colours
const wrapErrorScreen =
	"h-screen w-screen flex items-center justify-center bg-error dark:bg-error-hover" as const;

const styleErrorTitle = "text-2xl font-bold text-error mb-4" as const;
const styleErrorSubtitle = "text-error-secondary mb-4" as const;

// Retry button
const styleRetryBase =
	"px-4 py-2 rounded shadow-lg transition-transform transition-colors duration-200 text-sm font-medium" as const;
const styleRetryColour =
	"bg-destructive text-destructive-foreground hover:opacity-90 hover:shadow-effect-glow-error hover:scale-105 active:scale-100" as const;

// Error Boundary Component
class ErrorBoundary extends React.Component<
	{ children: React.ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: { children: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error) {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("FlowEditor Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className={wrapErrorScreen}>
					<div className="text-center p-8">
						<h1 className={styleErrorTitle}>Something went wrong</h1>
						<p className={styleErrorSubtitle}>
							{this.state.error?.message || "Unknown error occurred"}
						</p>
						<button
							onClick={() => this.setState({ hasError: false })}
							className={styleRetryBase + " " + styleRetryColour}
						>
							Try again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

/**
 * FLOW EDITOR INTERNAL COMPONENT
 *
 * Main flow editor component with comprehensive keyboard shortcuts:
 *
 * **Copy/Paste Operations:**
 * • Ctrl+C / Cmd+C: Copy selected nodes and their connections
 * • Ctrl+V / Cmd+V: Paste at mouse cursor location with preserved layout
 * • Ctrl+A / Cmd+A: Select all nodes in canvas
 * • Esc: Clear all selections
 *
 * **Undo/Redo Operations:**
 * • Ctrl+Z / Cmd+Z: Undo last action
 * • Ctrl+Y / Cmd+Y: Redo next action (Windows/Linux)
 * • Ctrl+Shift+Z / Cmd+Shift+Z: Redo next action (Mac alternative)
 *
 * **Delete Operations:**
 * • Delete/Backspace: Native ReactFlow deletion (recommended)
 * • Alt+Q: Custom deletion with console feedback
 *
 * **Utility Shortcuts:**
 * • Ctrl+H / Cmd+H: Toggle history panel
 * • Alt+A: Toggle inspector lock
 * • Ctrl+X / Cmd+X: Toggle vibe mode (placeholder)
 *
 * **Features:**
 * • Smart mouse-aware paste positioning
 * • Multi-selection support with Shift+drag and Ctrl+click
 * • Automatic edge detection between copied nodes
 * • Graph-based undo/redo with multi-branch support
 * • Debounced action recording to prevent excessive history entries
 * • Input field protection (shortcuts disabled when typing)
 * • Platform-specific modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
 */
const FlowEditorInternal = () => {
	const flowWrapperRef = useRef<HTMLDivElement>(null);
	const { screenToFlowPosition } = useReactFlow();

	// Initialize theme system on mount
	useEffect(() => {
		try {
			// Enable category theming directly using the store
			const store = useNodeStyleStore.getState();
			store.enableCategoryTheming();
		} catch (error) {
			console.error("❌ Theme initialization failed:", error);
		}
	}, []);

	const {
		nodes,
		edges,
		onNodesChange,
		onEdgesChange,
		onConnect,
		addNode,
		// Pull all other necessary props from the store
		selectedNodeId,
		selectedEdgeId,
		nodeErrors,
		showHistoryPanel,
		inspectorLocked,
		inspectorViewMode,
		updateNodeData,
		updateNodeId,
		logNodeError,
		clearNodeErrors,
		toggleHistoryPanel,
		setInspectorLocked,
		removeNode,
		removeEdge,
		selectNode,
		selectEdge,
		copySelectedNodes,
		pasteNodesAtPosition,
		clearSelection,
	} = useFlowStore();

	// ============================================================================
	// COPY/PASTE FUNCTIONALITY WITH MOUSE TRACKING
	// ============================================================================

	const { copySelectedElements, pasteElements, installMouseTracking } =
		useMultiSelectionCopyPaste();

	// Track mouse position for smart paste positioning
	useEffect(() => {
		return installMouseTracking();
	}, [installMouseTracking]);

	// ============================================================================
	// UNDO/REDO INTEGRATION
	// ============================================================================

	const { undo, redo, recordAction } = useUndoRedo();

	const handleUndo = useCallback(() => {
		const success = undo();
	}, [undo]);

	const handleRedo = useCallback(() => {
		const success = redo();
	}, [redo]);

	// ============================================================================
	// KEYBOARD SHORTCUTS INTEGRATION
	// ============================================================================

	const handleSelectAllNodes = useCallback(() => {
		// Select all nodes in the canvas
		const updatedNodes = nodes.map((node) => ({ ...node, selected: true }));
		useFlowStore.setState((state) => ({ ...state, nodes: updatedNodes }));
	}, [nodes]);

	const handleClearSelection = useCallback(() => {
		clearSelection();
	}, [clearSelection]);

	const handleCopy = useCallback(() => {
		copySelectedElements();
	}, [copySelectedElements]);

	const handlePaste = useCallback(() => {
		const { copiedNodes } = useFlowStore.getState();
		pasteElements();

		// Record paste action for undo/redo
		if (copiedNodes.length > 0) {
			recordAction("paste", {
				nodeCount: copiedNodes.length,
				nodeTypes: copiedNodes.map((n) => n.type),
			});
		}
	}, [pasteElements, recordAction]);

	const handleMultiDelete = useCallback(() => {
		// Find selected nodes and edges
		const selectedNodes = nodes.filter((node) => node.selected);
		const selectedEdges = edges.filter((edge) => edge.selected);

		if (selectedNodes.length === 0 && selectedEdges.length === 0) {
			return;
		}

		// Record the delete action for undo/redo
		if (selectedNodes.length > 0) {
			recordAction("node_delete", {
				nodeCount: selectedNodes.length,
				nodeIds: selectedNodes.map((n) => n.id),
			});
		}
		if (selectedEdges.length > 0) {
			recordAction("edge_delete", {
				edgeCount: selectedEdges.length,
				edgeIds: selectedEdges.map((e) => e.id),
			});
		}

		// Delete selected nodes
		selectedNodes.forEach((node) => {
			removeNode(node.id);
		});

		// Delete selected edges
		selectedEdges.forEach((edge) => {
			removeEdge(edge.id);
		});
	}, [nodes, edges, removeNode, removeEdge, recordAction]);

	// Initialize keyboard shortcuts
	useKeyboardShortcuts({
		onCopy: handleCopy,
		onPaste: handlePaste,
		onUndo: handleUndo,
		onRedo: handleRedo,
		onToggleHistory: toggleHistoryPanel,
		onSelectAll: handleSelectAllNodes,
		onClearSelection: handleClearSelection,
		onDelete: handleMultiDelete,
		onToggleVibeMode: () => {
			// Vibe mode toggle - not implemented yet
		},
		onToggleInspectorLock: () => {
			setInspectorLocked(!inspectorLocked);
		},
		onDuplicateNode: () => {
			// Node duplication - not implemented yet
		},
		onToggleSidebar: () => {
			// Sidebar toggle - not implemented yet
		},
	});

	const onDragOver = useCallback((event: React.DragEvent) => {
		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
	}, []);

	const onDrop = useCallback(
		async (event: React.DragEvent) => {
			event.preventDefault();

			const nodeType = event.dataTransfer.getData("application/reactflow");
			if (!nodeType) {
				console.warn("No node type found in drag data");
				return;
			}

			// Calculate position from drop event coordinates
			const position = screenToFlowPosition({
				x: event.clientX,
				y: event.clientY,
			});

			try {
				// Get node spec from the new NodeSpec system
				const spec = await getNodeSpecForType(nodeType);
				if (!spec) {
					console.error(`Invalid node type dropped: ${nodeType}`);
					return;
				}

				// Initialize node data with defaults from spec
				const defaultData = spec.initialData || {};

				const newNode: AgenNode = {
					id: generateNodeId(),
					type: nodeType as any,
					position,
					deletable: true,
					data: {
						...defaultData,
						isActive: false, // Default state
					},
				} as AgenNode;

				addNode(newNode);

				// Record node creation for undo/redo
				recordAction("node_add", {
					nodeType: nodeType,
					nodeId: newNode.id,
					position: position,
				});
			} catch (error) {
				console.error("❌ Failed to create node from drop:", error);
			}
		},
		[screenToFlowPosition, addNode, recordAction]
	);

	const selectedNode = React.useMemo(
		() => nodes.find((n) => n.id === selectedNodeId) || null,
		[nodes, selectedNodeId]
	);
	const selectedEdge = React.useMemo(
		() => edges.find((e) => e.id === selectedEdgeId) || null,
		[edges, selectedEdgeId]
	);

	const edgeReconnectSuccessful = React.useRef(true);

	const handleReconnectStart = () => {
		edgeReconnectSuccessful.current = false;
	};

	const handleReconnect = (oldEdge: any, newConnection: any) => {
		edgeReconnectSuccessful.current = true;
		// Update edges array via store util
		removeEdge(oldEdge.id);
		onConnect(newConnection);
	};

	const handleReconnectEnd = (_: any, edge: any) => {
		if (!edgeReconnectSuccessful.current) {
			removeEdge(edge.id);
		}
		edgeReconnectSuccessful.current = true;
	};

	const handleSelectionChange = useCallback(
		({
			nodes: selectedNodes,
			edges: selectedEdges,
		}: {
			nodes: AgenNode[];
			edges: any[];
		}) => {
			// Handle node selection first
			const nodeId = selectedNodes.length > 0 ? selectedNodes[0].id : null;
			selectNode(nodeId);

			// Only handle edge selection if NO nodes are selected
			if (selectedNodes.length === 0) {
				const edgeId = selectedEdges.length > 0 ? selectedEdges[0].id : null;
				selectEdge(edgeId);
			}
		},
		[selectNode, selectEdge]
	);

	return (
		<div className="h-screen w-screen" style={{ height: "100vh", width: "100vw" }}>
			{/* Undo/Redo Manager - tracks all node/edge changes */}
			<UndoRedoManager
				nodes={nodes}
				edges={edges}
				onNodesChange={(newNodes) => {
					// Actually update the flow state during undo/redo operations
					// Cast to AgenNode[] since they're compatible types
					useFlowStore.setState((state) => ({
						...state,
						nodes: newNodes as AgenNode[],
					}));
				}}
				onEdgesChange={(newEdges) => {
					// Actually update the flow state during undo/redo operations
					// Cast to AgenEdge[] since they're compatible types
					useFlowStore.setState((state) => ({
						...state,
						edges: newEdges as AgenEdge[],
					}));
				}}
				config={{
					maxHistorySize: 100,
					positionDebounceMs: 300,
					actionSeparatorMs: 1000,
					enableViewportTracking: false,
					enableCompression: true,
				}}
				onHistoryChange={(path, currentIndex) => {
					// History updated callback - silent
				}}
			/>

			{/* Action Toolbar */}
			<ActionToolbar
				showHistoryPanel={showHistoryPanel}
				onToggleHistory={toggleHistoryPanel}
				className={`fixed z-50 ${
					inspectorViewMode === "side" 
						? "bottom-4 left-1/2 transform -translate-x-1/2" 
						: "top-4 right-4"
				}`}
			/>

			<FlowCanvas
				nodes={nodes}
				edges={edges}
				onDragOver={onDragOver}
				onDrop={onDrop}
				selectedNode={selectedNode}
				selectedEdge={selectedEdge}
				selectedOutput={null}
				nodeErrors={nodeErrors}
				showHistoryPanel={showHistoryPanel}
				wrapperRef={flowWrapperRef}
				updateNodeData={updateNodeData}
				updateNodeId={updateNodeId}
				logNodeError={logNodeError}
				clearNodeErrors={clearNodeErrors}
				onToggleHistory={toggleHistoryPanel}
				onDeleteNode={removeNode}
				onDuplicateNode={() => {}}
				onDeleteEdge={removeEdge}
				inspectorLocked={inspectorLocked}
				inspectorViewMode={inspectorViewMode}
				setInspectorLocked={setInspectorLocked}
				reactFlowHandlers={{
					onNodesChange,
					onEdgesChange,
					onConnect,
					onInit: () => {},
					onSelectionChange: handleSelectionChange,
					onReconnect: handleReconnect,
					onReconnectStart: handleReconnectStart,
					onReconnectEnd: handleReconnectEnd,
				}}
			/>
			<Sidebar className="z-50" enableDebug={true} />
		</div>
	);
};

export default function FlowEditor() {
	return (
		<ErrorBoundary>
			<ReactFlowProvider>
				<UndoRedoProvider>
					<FlowEditorInternal />
				</UndoRedoProvider>
			</ReactFlowProvider>
		</ErrorBoundary>
	);
}
