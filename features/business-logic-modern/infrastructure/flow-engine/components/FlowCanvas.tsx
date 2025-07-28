/**
 * FLOW CANVAS COMPONENT - Visual workflow editor
 *
 * • Interactive canvas for node-based workflow creation and editing
 * • Responsive UI adapting controls for mobile/desktop
 * • Node/edge selection, connection, deletion with keyboard shortcuts
 * • Integrated inspector panels, history tracking, action toolbars
 * • Drag & drop, multi-selection, real-time editing
 *
 * Customization:
 * • Node movement step set to 5 pixels (snapGrid)
 * • Background dot spacing set to 15 pixels for visual clarity
 * • All constants are top-level for maintainability
 * • Good contrast for background dots
 *
 * Keywords: ReactFlow, workflow-editor, nodes, edges, drag-drop, responsive, snapGrid, dot-spacing
 */

import {
	Background,
	type ColorMode,
	ConnectionMode,
	PanOnScrollMode,
	Panel,
	ReactFlow,
	SelectionMode,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { AgenEdge, AgenNode } from "../types/nodeData";

// Import other components - Using clean aliases
import HistoryPanel from "@/features/business-logic-modern/infrastructure/action-toolbar/history/HistoryPanel";
import NodeInspector from "@/features/business-logic-modern/infrastructure/node-inspector/NodeInspector";
import {
	ThemedControls,
	ThemedMiniMap,
	nodeInspectorStyles,
} from "@/features/business-logic-modern/infrastructure/theming/components";
import { WorkflowManager } from "@/features/business-logic-modern/infrastructure/workflow-manager";
import { NodeDisplayProvider } from "../contexts/NodeDisplayContext";

// Node components are now loaded via useDynamicNodeTypes hook
// No need for direct imports here

// ULTIMATE TYPESAFE HANDLE SYSTEM - Connection prevention & cleanup
import { useUltimateFlowConnectionPrevention } from "@/components/nodes/handles/TypeSafeHandle";

import { useDynamicNodeTypes } from "../hooks/useDynamicNodeTypes";

// Debug tool for clearing local storage in dev mode
import ClearLocalStorage from "@/features/business-logic-modern/infrastructure/components/ClearLocalStorage";

interface FlowCanvasProps {
	nodes: AgenNode[];
	edges: AgenEdge[];
	selectedNode: AgenNode | null;
	selectedEdge: AgenEdge | null;
	selectedOutput: string | null;
	nodeErrors: Record<string, any[]>;
	showHistoryPanel: boolean;
	wrapperRef: React.RefObject<HTMLDivElement | null>;
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	updateNodeId?: (oldId: string, newId: string) => void;
	logNodeError: (nodeId: string, message: string, type?: any, source?: string) => void;
	clearNodeErrors: (nodeId: string) => void;
	onToggleHistory: () => void;
	onDragOver: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onDeleteNode?: (nodeId: string) => void;
	onDuplicateNode?: (nodeId: string) => void;
	onDeleteEdge?: (edgeId: string) => void;
	inspectorLocked: boolean;
	inspectorViewMode: "bottom" | "side";
	setInspectorLocked: (locked: boolean) => void;
	reactFlowHandlers: {
		onReconnectStart: () => void;
		onReconnect: (oldEdge: any, newConn: any) => void;
		onReconnectEnd: (event: any, edge: any) => void;
		onConnect: (connection: any) => void;
		onNodesChange: (changes: any[]) => void;
		onEdgesChange: (changes: any[]) => void;
		onSelectionChange: (selection: any) => void;
		onInit: (instance: any) => void;
	};
}

/**
 * FLOW CANVAS CONFIGURATION - Unified with design system tokens
 *
 * All constants now use the centralized token system for consistency
 * and maintainability across light/dark themes.
 */

/**
 * The grid size for node movement snapping (in pixels)
 * @type {[number, number]}
 */
const SNAP_GRID: [number, number] = [2.5, 2.5];

/**
 * The spacing between background dots (in pixels)
 * @type {number}
 */
const BACKGROUND_DOT_GAP = 15.5;

/**
 * The size of each background dot (in pixels)
 * @type {number}
 */
const BACKGROUND_DOT_SIZE = 1;

/**
 * Edge styling configuration using design system tokens
 */
const EDGE_STYLES = {
	strokeWidth: 2,
	stroke: "var(--infra-canvas-edge)",
} as const;

/**
 * Mobile delete button styling using design system tokens
 */
const MOBILE_DELETE_BUTTON_STYLES = {
	base: "bg-[var(--core-status-node-delete-bg)] hover:bg-[var(--core-status-node-delete-bg-light)] text-[var(--core-status-node-delete-border)] p-1 rounded-full shadow-lg transition-colors",
	icon: "w-5 h-5",
} as const;

/**
 * Panel positioning and styling constants
 */
const PANEL_STYLES = {
	margin: "m-2",
	historyPanel: "mr-2",
	historyPanelTop: "70px",
	mobileDeleteTop: "100px",
	mobileDeleteRight: "14px",
} as const;

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
	nodes,
	edges,
	selectedNode,
	selectedEdge,
	selectedOutput,
	nodeErrors,
	showHistoryPanel,
	wrapperRef,
	updateNodeData,
	updateNodeId,
	logNodeError,
	clearNodeErrors,
	onToggleHistory,
	onDragOver,
	onDrop,
	onDeleteNode,
	onDuplicateNode,
	onDeleteEdge,
	inspectorLocked,
	inspectorViewMode,
	setInspectorLocked,
	reactFlowHandlers,
}) => {
	const _componentName = "FlowCanvas";

	// Theme integration
	const { resolvedTheme } = useTheme();
	const [_mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const colorMode = (resolvedTheme || "dark") as ColorMode;

	// ============================================================================
	// ULTIMATE TYPESAFE HANDLE SYSTEM - Connection prevention
	// ============================================================================

	const { isValidConnection } = useUltimateFlowConnectionPrevention();

	// ============================================================================
	// STATE FOR MOBILE RESPONSIVENESS & ERROR TRACKING
	// ============================================================================

	const [isMobile, setIsMobile] = useState(false);
	const [_hasFilteredNodes, setHasFilteredNodes] = useState(false);

	// Get themed classes for components
	// const nodeInspectorTheme = useComponentTheme("nodeInspector");
	// Removed useComponentTheme - now using semantic tokens directly

	useEffect(() => {
		const checkScreenSize = () => {
			setIsMobile(window.innerWidth < 768); // md breakpoint
		};

		// Check on mount
		checkScreenSize();

		// Listen for resize events
		window.addEventListener("resize", checkScreenSize);
		return () => window.removeEventListener("resize", checkScreenSize);
	}, []);

	// ============================================================================
	// DEFENSIVE FILTERING - PREVENT UNDEFINED POSITION ERRORS
	// ============================================================================

	const safeNodes = useMemo(() => {
		const filteredNodes = nodes.filter((node) => {
			// Check if node is valid and has proper position
			if (!node || typeof node !== "object") {
				console.warn("🔍 [FlowCanvas] Filtered out invalid node:", node);
				return false;
			}

			if (
				!node.position ||
				typeof node.position.x !== "number" ||
				typeof node.position.y !== "number"
			) {
				console.warn("🔍 [FlowCanvas] Filtered out node with invalid position:", node);
				return false;
			}

			if (!(node.id && node.type)) {
				console.warn("🔍 [FlowCanvas] Filtered out node missing id or type:", node);
				return false;
			}

			return true;
		});

		return filteredNodes;
	}, [nodes]);

	// Track filtering results separately to avoid infinite re-renders
	useEffect(() => {
		if (safeNodes.length !== nodes.length) {
			const filteredCount = nodes.length - safeNodes.length;
			console.warn(
				`🔍 [FlowCanvas] Filtered ${filteredCount} invalid nodes. Kept ${safeNodes.length} valid nodes.`
			);
			console.warn("💡 If this error persists, you may need to reset your workspace.");
			setHasFilteredNodes(true);
		} else {
			setHasFilteredNodes(false);
		}
	}, [nodes.length, safeNodes.length]);

	// ============================================================================
	// DYNAMIC POSITIONING VARIABLES
	// ============================================================================

	const controlsPosition = isMobile ? "center-right" : "top-left";
	const controlsClassName = isMobile ? " translate-y-1/2 translate-x-1" : "";
	const deleteButtonPosition = isMobile ? "center-right" : "top-right";
	const deleteButtonStyle = isMobile
		? {
				marginTop: PANEL_STYLES.mobileDeleteTop,
				marginRight: PANEL_STYLES.mobileDeleteRight,
			}
		: { marginTop: PANEL_STYLES.historyPanelTop };

	// ============================================================================
	// NODE TYPES REGISTRY (INLINE) - A temporary, hardcoded manifest
	// ============================================================================

	const nodeTypes = useDynamicNodeTypes();

	const edgeTypes = useMemo(() => ({}), []);

	// ============================================================================
	// PLATFORM-SPECIFIC MULTI-SELECTION CONFIGURATION
	// ============================================================================

	const isMac = useMemo(() => {
		if (typeof navigator === "undefined") {
			return false;
		}
		return navigator.platform.toUpperCase().includes("MAC");
	}, []);

	// Configure selection keys based on ReactFlow documentation
	const selectionKeys = useMemo(
		() => ({
			// Allow drawing selection box with Shift key
			selectionKeyCode: "Shift",
			// Platform-specific multi-selection: Meta (Cmd) on Mac, Control on others
			// Also support Shift as alternative for both platforms
			multiSelectionKeyCode: [isMac ? "Meta" : "Control", "Shift"],
		}),
		[isMac]
	);

	// ============================================================================
	// RENDER
	// ============================================================================

	return (
		<div
			ref={wrapperRef}
			className="relative h-full w-full flex-1"
			onDragOver={onDragOver}
			onDrop={onDrop}
			style={{
				touchAction: "none",
				width: "100%",
				height: "100%",
				minHeight: "100vh",
				minWidth: "100vw",
			}}
		>
			<ReactFlow
				// Core Data
				nodes={safeNodes}
				edges={edges}
				nodeTypes={nodeTypes}
				edgeTypes={edgeTypes}
				// Explicit dimensions to fix sizing issue
				style={{ width: "100%", height: "100%" }}
				// Connection Handling
				isValidConnection={isValidConnection}
				connectionMode={ConnectionMode.Loose}
				onConnect={reactFlowHandlers.onConnect}
				onReconnect={reactFlowHandlers.onReconnect}
				onReconnectStart={reactFlowHandlers.onReconnectStart}
				onReconnectEnd={reactFlowHandlers.onReconnectEnd}
				// Change Handlers
				onNodesChange={reactFlowHandlers.onNodesChange}
				onEdgesChange={reactFlowHandlers.onEdgesChange}
				onSelectionChange={reactFlowHandlers.onSelectionChange}
				onInit={reactFlowHandlers.onInit}
				// Selection Configuration
				selectionMode={SelectionMode.Partial}
				selectionKeyCode={selectionKeys.selectionKeyCode}
				multiSelectionKeyCode={selectionKeys.multiSelectionKeyCode}
				deleteKeyCode={["Delete", "Backspace"]}
				// Interaction Settings
				snapToGrid={true}
				snapGrid={SNAP_GRID}
				panOnDrag={true}
				panOnScroll={true}
				panOnScrollMode={PanOnScrollMode.Free}
				zoomOnScroll={true}
				zoomOnPinch={true}
				zoomOnDoubleClick={false}
				// Node/Edge Behavior
				nodesDraggable={true}
				nodesConnectable={true}
				elementsSelectable={true}
				edgesReconnectable={true}
				// Visual Settings
				fitView={true}
				colorMode={colorMode}
				proOptions={{ hideAttribution: true }}
				defaultEdgeOptions={{
					type: "default",
					deletable: true,
					focusable: true,
					style: EDGE_STYLES,
				}}
			>
				{/* NODE INSPECTOR PANEL */}
				<Panel
					position={inspectorViewMode === "bottom" ? "bottom-center" : "top-right"}
					className={`hidden rounded shadow-sm md:block ${
						inspectorViewMode === "bottom"
							? "max-h-[280px] max-w-4xl"
							: inspectorLocked || !selectedNode
								? "h-[50px] w-[50px] rounded-lg border border-border bg-card shadow-lg"
								: "max-h-[calc(100vh-370px)] w-[450px]"
					} overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${nodeInspectorStyles.getContainer()}`}
				>
					<NodeDisplayProvider>
						<NodeInspector viewMode={inspectorViewMode} />
					</NodeDisplayProvider>
				</Panel>

				{/* MINIMAP */}
				<ThemedMiniMap position="bottom-left" className="hidden md:block" />

				{/* CONTROLS */}
				<ThemedControls
					position={controlsPosition}
					showInteractive={false}
					className={controlsClassName}
				/>

				{/* BACKGROUND */}
				<Background
					gap={BACKGROUND_DOT_GAP}
					size={BACKGROUND_DOT_SIZE}
					color="var(--infra-canvas-dot)"
				/>

				{/* WORKFLOW MANAGER */}
				<Panel position="top-center" className="z-50">
					<WorkflowManager />
				</Panel>

				{/* DEBUG TOOL - Clears local storage (development utility) */}
				<ClearLocalStorage className={PANEL_STYLES.margin} />

				{/* MOBILE DELETE BUTTON - Only visible on mobile when node or edge is selected */}
				{(selectedNode || selectedEdge) && (
					<Panel
						position={deleteButtonPosition}
						className={`md:hidden ${controlsClassName}`}
						style={deleteButtonStyle}
					>
						<button
							onClick={() => {
								if (selectedNode) {
									onDeleteNode?.(selectedNode.id);
								} else if (selectedEdge) {
									onDeleteEdge?.(selectedEdge.id);
								}
							}}
							className={MOBILE_DELETE_BUTTON_STYLES.base}
							title={
								selectedNode
									? `Delete ${selectedNode.data?.label || selectedNode.type} node`
									: selectedEdge
										? "Delete connection"
										: "Delete"
							}
						>
							<svg
								className={MOBILE_DELETE_BUTTON_STYLES.icon}
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
						</button>
					</Panel>
				)}

				{/* FLOATING HISTORY PANEL */}
				{showHistoryPanel && (
					<Panel
						position={inspectorViewMode === "side" ? "bottom-center" : "top-right"}
						className={`${
							inspectorViewMode === "side" ? "-translate-y-[50px] mb-4" : PANEL_STYLES.historyPanel
						}`}
						style={inspectorViewMode === "side" ? {} : { marginTop: PANEL_STYLES.historyPanelTop }}
					>
						<div className="max-h-96 w-80">
							<HistoryPanel className="shadow-lg" />
						</div>
					</Panel>
				)}
			</ReactFlow>
		</div>
	);
};
