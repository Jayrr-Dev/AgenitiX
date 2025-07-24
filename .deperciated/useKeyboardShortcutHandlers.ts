/**
 * KEYBOARD SHORTCUT HANDLERS HOOK - Centralized keyboard action management
 *
 * • Provides handlers for all keyboard shortcuts in the flow editor
 * • Manages node selection, duplication, deletion with keyboard controls
 * • Handles inspector lock toggle and sidebar visibility controls
 * • Supports multi-selection operations and clipboard functionality
 * • Integrates with Zustand store for consistent state management
 *
 * Keywords: keyboard, shortcuts, handlers, multi-selection, Alt-keys, Ctrl-keys
 */

import { useCallback } from "react";
import type { AgenEdge, AgenNode } from "../features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { generateNodeId } from "../features/business-logic-modern/infrastructure/flow-engine/utils/nodeUtils";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface KeyboardShortcutHandlers {
	handleSelectAllNodes: () => void;
	handleClearSelection: () => void;
	handleToggleInspectorLock: () => void;
	handleDuplicateSelectedNode: () => void;
	handleToggleSidebar: () => void;
	handleMultiDelete: () => void;
}

interface ZustandActions {
	setNodes: (nodes: AgenNode[]) => void;
	setEdges: (edges: AgenEdge[]) => void;
	removeNode: (id: string) => void;
	removeEdge: (id: string) => void;
	addNode: (node: AgenNode) => void;
	selectNode: (id: string) => void;
	clearSelection: () => void;
	setInspectorLocked: (locked: boolean) => void;
}

interface SidebarRef {
	toggle: () => void;
}

interface KeyboardShortcutHandlersProps {
	nodes: AgenNode[];
	edges: AgenEdge[];
	sidebarRef: React.RefObject<SidebarRef | null>;
	zustandActions: ZustandActions;
	inspectorLocked: boolean;
}

// ============================================================================
// HELPER FUNCTIONS FOR NODE/EDGE OPERATIONS
// ============================================================================

/**
 * Select all nodes in the provided list
 */
function selectAllNodes(nodeList: AgenNode[]): AgenNode[] {
	return nodeList.map((node) => ({ ...node, selected: true }));
}

/**
 * Deselect all nodes in the provided list
 */
function deselectAllNodes(nodeList: AgenNode[]): AgenNode[] {
	return nodeList.map((node) => ({ ...node, selected: false }));
}

/**
 * Deselect all edges in the provided list
 */
function deselectAllEdges(edgeList: AgenEdge[]): AgenEdge[] {
	return edgeList.map((edge) => ({ ...edge, selected: false }));
}

/**
 * Get currently selected nodes
 */
function getSelectedNodes(nodeList: AgenNode[]): AgenNode[] {
	return nodeList.filter((node) => node.selected);
}

/**
 * Get currently selected edges
 */
function getSelectedEdges(edgeList: AgenEdge[]): AgenEdge[] {
	return edgeList.filter((edge) => edge.selected);
}

/**
 * Create duplicated nodes with offset positioning
 */
function createDuplicatedNodes(selectedNodeList: AgenNode[]): AgenNode[] {
	return selectedNodeList.map((nodeToDuplicate, index) => {
		const newId = generateNodeId();

		// Stagger multiple duplicates slightly
		const offsetX = 40 + index * 10;
		const offsetY = 40 + index * 10;
		const newPosition = {
			x: nodeToDuplicate.position.x + offsetX,
			y: nodeToDuplicate.position.y + offsetY,
		};

		return {
			...nodeToDuplicate,
			id: newId,
			position: newPosition,
			selected: false,
			data: { ...nodeToDuplicate.data },
		} as AgenNode;
	});
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Custom hook for managing keyboard shortcut handlers with proper separation of concerns
 */
export function useKeyboardShortcutHandlers({
	nodes,
	edges,
	sidebarRef,
	zustandActions,
	inspectorLocked,
}: KeyboardShortcutHandlersProps): KeyboardShortcutHandlers {
	const {
		setNodes,
		setEdges,
		removeNode,
		removeEdge,
		addNode,
		selectNode,
		clearSelection,
		setInspectorLocked,
	} = zustandActions;

	// ============================================================================
	// SELECT ALL NODES HANDLER (Ctrl+A)
	// ============================================================================

	const handleSelectAllNodes = useCallback(() => {
		if (nodes.length === 0) {
			console.log("⚠️ No nodes available to select");
			return;
		}

		console.log(`🎯 Selecting all ${nodes.length} nodes (Ctrl+A)`);
		const updatedNodes = selectAllNodes(nodes);
		const updatedEdges = deselectAllEdges(edges);

		setNodes(updatedNodes);
		setEdges(updatedEdges);
	}, [nodes, edges, setNodes, setEdges]);

	// ============================================================================
	// CLEAR SELECTION HANDLER (Esc)
	// ============================================================================

	const handleClearSelection = useCallback(() => {
		const selectedNodes = getSelectedNodes(nodes);
		const selectedEdges = getSelectedEdges(edges);
		const totalSelected = selectedNodes.length + selectedEdges.length;

		if (totalSelected === 0) {
			console.log("⚠️ No items selected to clear");
			return;
		}

		console.log(
			`🔄 Clearing selection of ${selectedNodes.length} nodes and ${selectedEdges.length} edges (Esc)`
		);
		const updatedNodes = deselectAllNodes(nodes);
		const updatedEdges = deselectAllEdges(edges);

		setNodes(updatedNodes);
		setEdges(updatedEdges);
		clearSelection();
	}, [nodes, edges, setNodes, setEdges, clearSelection]);

	// ============================================================================
	// INSPECTOR LOCK TOGGLE HANDLER (Alt+A)
	// ============================================================================

	const handleToggleInspectorLock = useCallback(() => {
		const newLockState = !inspectorLocked;
		setInspectorLocked(newLockState);
		console.log(`🔒 Inspector ${newLockState ? "locked" : "unlocked"} (Alt+A)`);
	}, [inspectorLocked, setInspectorLocked]);

	// ============================================================================
	// NODE DUPLICATION HANDLER (Alt+W)
	// ============================================================================

	const handleDuplicateSelectedNode = useCallback(() => {
		const selectedNodes = getSelectedNodes(nodes);

		if (selectedNodes.length === 0) {
			console.log("⚠️ No nodes selected to duplicate");
			return;
		}

		console.log(`📋 Duplicating ${selectedNodes.length} selected node(s) (Alt+W)`);

		const duplicatedNodes = createDuplicatedNodes(selectedNodes);

		// Add all duplicated nodes
		duplicatedNodes.forEach((newNode) => addNode(newNode));

		// Select first duplicated node for feedback
		clearSelection();
		if (duplicatedNodes.length > 0) {
			selectNode(duplicatedNodes[0].id);
		}
	}, [nodes, addNode, selectNode, clearSelection]);

	// ============================================================================
	// SIDEBAR TOGGLE HANDLER (Alt+S)
	// ============================================================================

	const handleToggleSidebar = useCallback(() => {
		if (sidebarRef.current) {
			sidebarRef.current.toggle();
			console.log("📋 Sidebar toggled (Alt+S)");
		} else {
			console.warn("⚠️ Sidebar ref not available");
		}
	}, [sidebarRef]);

	// ============================================================================
	// MULTI-SELECTION DELETE HANDLER (Alt+Q)
	// ============================================================================

	const handleMultiDelete = useCallback(() => {
		const selectedNodes = getSelectedNodes(nodes);
		const selectedEdges = getSelectedEdges(edges);

		if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

		// Remove selected items
		selectedNodes.forEach((node) => removeNode(node.id));
		selectedEdges.forEach((edge) => removeEdge(edge.id));

		console.log(`Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges`);
	}, [nodes, edges, removeNode, removeEdge]);

	// ============================================================================
	// RETURN HANDLERS
	// ============================================================================

	return {
		handleSelectAllNodes,
		handleClearSelection,
		handleToggleInspectorLock,
		handleDuplicateSelectedNode,
		handleToggleSidebar,
		handleMultiDelete,
	};
}
