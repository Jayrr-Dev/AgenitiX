/**
 * FLOW EDITOR HANDLERS HOOK - ReactFlow event handler management
 *
 * • Manages ReactFlow node and edge change events with Zustand integration
 * • Handles node creation, deletion, duplication, and position updates
 * • Provides type-safe event handlers with proper cleanup and validation
 * • Integrates with Zustand store actions for state synchronization
 * • Supports selection management and instance initialization
 *
 * Keywords: ReactFlow, handlers, Zustand, nodes, edges, events, state-sync
 */

import { useCallback } from "react";
import type { AgenEdge, AgenNode } from "../types/nodeData";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface FlowEditorHandlers {
  handleNodesChange: (changes: any[]) => void;
  handleEdgesChange: (changes: any[]) => void;
  handleSelectionChange: (selection: any) => void;
  handleInit: (instance: any) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleDuplicateNode: (nodeId: string) => void;
  handleUpdateNodeId: (oldId: string, newId: string) => void;
}

interface ZustandActions {
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

interface FlowEditorHandlersProps {
  nodes: AgenNode[];
  edges: AgenEdge[];
  flowInstanceRef: React.MutableRefObject<any>;
  zustandActions: ZustandActions;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique node ID for duplication
 */
function generateUniqueId(originalId: string): string {
  return `${originalId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
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
  const updatedNodes = require("@xyflow/react").applyNodeChanges(
    changes,
    nodesCopy
  );
  setNodes(updatedNodes);

  // Update Zustand store for specific operations
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
  const updatedEdges = require("@xyflow/react").applyEdgeChanges(
    changes,
    edgesCopy
  );
  setEdges(updatedEdges);

  // Update Zustand store for specific operations
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

  // ============================================================================
  // REACTFLOW CHANGE HANDLERS
  // ============================================================================

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      applyNodeChanges(
        changes,
        nodes,
        setNodes,
        updateNodePosition,
        removeNode,
        selectNode
      );
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
      removeNode(nodeId);
      // Clear selection if the deleted node was selected
      const currentSelectedId = nodes.find((n) => n.selected)?.id;
      if (currentSelectedId === nodeId) {
        clearSelection();
      }
    },
    [removeNode, nodes, clearSelection]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (!nodeToDuplicate) return;

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

      addNode(newNode);
      selectNode(newId);
    },
    [nodes, addNode, selectNode]
  );

  const handleUpdateNodeId = useCallback((oldId: string, newId: string) => {
    // Feature not implemented yet - keeping placeholder for future development
    console.log("Update node ID not implemented yet:", oldId, newId);
  }, []);

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
