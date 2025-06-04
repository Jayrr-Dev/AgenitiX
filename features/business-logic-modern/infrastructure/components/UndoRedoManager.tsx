/**
 * UNDO REDO MANAGER V3 - Graph-based multi-branch undo/redo system
 *
 * • Graph structure supporting multiple redo branches instead of linear history
 * • Each action creates a new node in the history graph
 * • Undo navigates to parent node, redo can choose between multiple children
 * • Maintains all existing APIs for seamless integration
 * • Persistent storage with localStorage integration
 *
 * Keywords: undo-redo, multi-branch, graph-structure, state-management, workflow-editor
 */

"use client";

import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useRegisterUndoRedoManager } from "./UndoRedoContext";
import { 
  HistoryGraph, 
  FlowState, 
  NodeId 
} from "./historyGraph";
import {
  createRootGraph,
  createChildNode,
  saveGraph,
  loadGraph,
  cloneFlowState,
  areStatesEqual,
  getPathToCursor,
  getGraphStats,
  clearPersistedGraph
} from "./graphHelpers";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const DEBUG_MODE = process.env.NODE_ENV === "development";
const ACTION_SEPARATOR_DELAY = 150; // ms between distinct actions
const POSITION_DEBOUNCE_DELAY = 300; // ms for position changes

// ============================================================================
// TYPES (keeping existing ones for compatibility)
// ============================================================================

export type ActionType = 
  | "node_add" 
  | "node_delete" 
  | "node_move" 
  | "edge_add" 
  | "edge_delete" 
  | "duplicate" 
  | "bulk_update"
  | "paste";

export interface UndoRedoConfig {
  maxHistorySize?: number;
  positionDebounceMs?: number;
  actionSeparatorMs?: number;
  enableViewportTracking?: boolean;
  enableCompression?: boolean;
}

export interface UndoRedoManagerProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  config?: UndoRedoConfig;
  onHistoryChange?: (history: any[], currentIndex: number) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

const createFlowState = (
  nodes: Node[],
  edges: Edge[],
  viewport?: { x: number; y: number; zoom: number }
): FlowState => ({
  nodes: nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: node.data ? { ...node.data } : node.data,
  })),
  edges: edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
  })),
  viewport: viewport ? { ...viewport } : undefined,
});

const getActionDescription = (type: ActionType, metadata: Record<string, unknown>): string => {
  switch (type) {
    case "node_add":
      return `Add ${metadata.nodeType || "node"}`;
    case "node_delete":
      return `Delete ${metadata.nodeType || "node"}`;
    case "node_move":
      const nodeCount = metadata.nodeCount as number;
      return nodeCount > 1 ? `Move ${nodeCount} nodes` : "Move node";
    case "edge_add":
      return "Connect nodes";
    case "edge_delete":
      return "Delete connection";
    case "duplicate":
      return `Duplicate ${metadata.nodeType || "node"}`;
    case "paste":
      const pasteCount = metadata.nodeCount as number;
      return pasteCount > 1 ? `Paste ${pasteCount} nodes` : "Paste node";
    default:
      return `${type}`;
  }
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const UndoRedoManager: React.FC<UndoRedoManagerProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  config = {},
  onHistoryChange,
}) => {
  const reactFlowInstance = useReactFlow();
  const finalConfig = useMemo(
    () => ({
      maxHistorySize: config.maxHistorySize ?? 100,
      positionDebounceMs: config.positionDebounceMs ?? POSITION_DEBOUNCE_DELAY,
      actionSeparatorMs: config.actionSeparatorMs ?? ACTION_SEPARATOR_DELAY,
      enableViewportTracking: config.enableViewportTracking ?? false,
      enableCompression: config.enableCompression ?? true,
    }),
    [config]
  );

  const registerManager = useRegisterUndoRedoManager();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const initialState = useMemo<FlowState>(
    () => createFlowState(nodes, edges),
    [] // Only compute once on mount
  );

  const initialGraph = useMemo(() => {
    const persisted = loadGraph();
    return persisted ?? createRootGraph(initialState);
  }, [initialState]);

  const graphRef = useRef<HistoryGraph>(initialGraph);
  
  // Helper to get graph
  const getGraph = useCallback(() => {
    return graphRef.current;
  }, []);

  const isUndoRedoOperationRef = useRef(false);
  const lastCapturedStateRef = useRef<FlowState | null>(null);
  const lastActionTimestampRef = useRef(0);
  
  // Debouncing refs
  const positionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPositionActionRef = useRef<{
    movedNodes: Set<string>;
    startTime: number;
  } | null>(null);

  // ============================================================================
  // CORE FUNCTIONS
  // ============================================================================

  const captureCurrentState = useCallback((): FlowState => {
    const viewport = finalConfig.enableViewportTracking
      ? reactFlowInstance.getViewport()
      : undefined;
    return createFlowState(nodes, edges, viewport);
  }, [nodes, edges, finalConfig.enableViewportTracking, reactFlowInstance]);

  const applyState = useCallback(
    (state: FlowState, actionType: string) => {
      if (DEBUG_MODE) {
        console.log(`🔄 [UndoRedo] Applying state for: ${actionType}`);
      }

      isUndoRedoOperationRef.current = true;

      try {
        onNodesChange(state.nodes);
        onEdgesChange(state.edges);

        if (state.viewport && finalConfig.enableViewportTracking) {
          reactFlowInstance.setViewport(state.viewport);
        }

        // Update our reference to the current state
        lastCapturedStateRef.current = state;
      } catch (error) {
        console.error("❌ [UndoRedo] Error applying state:", error);
      } finally {
        // Use a timeout to ensure ReactFlow fully processes the changes
        setTimeout(() => {
          isUndoRedoOperationRef.current = false;
          if (DEBUG_MODE) {
            console.log("✅ [UndoRedo] State application completed");
          }
        }, 50);
      }
    },
    [onNodesChange, onEdgesChange, finalConfig.enableViewportTracking, reactFlowInstance]
  );

  const push = useCallback(
    (label: string, nextState: FlowState, metadata: Record<string, unknown> = {}) => {
      const graph = getGraph();
      const cursorNode = graph.nodes[graph.cursor];

      // Skip if states are identical
      if (areStatesEqual(cursorNode.after, nextState)) {
        if (DEBUG_MODE) {
          console.log("🚫 [UndoRedo] Skipping identical states");
        }
        return;
      }

      // Skip if this is an undo/redo operation
      if (isUndoRedoOperationRef.current) {
        if (DEBUG_MODE) {
          console.log("🚫 [UndoRedo] Skipping during undo/redo operation");
        }
        return;
      }

      const newId = createChildNode(
        graph,
        cursorNode.id,
        label,
        cursorNode.after,
        nextState,
        metadata
      );
      
      graph.cursor = newId;
      saveGraph(graph);
      lastActionTimestampRef.current = Date.now();

      if (DEBUG_MODE) {
        console.log(`📝 [UndoRedo] Push: ${label}`, getGraphStats(graph));
      }

      // Notify history change with compatible format
      const path = getPathToCursor(graph);
      onHistoryChange?.(path, path.length - 1);
    },
    [onHistoryChange, getGraph]
  );

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const undo = useCallback((): boolean => {
    const graph = getGraph();
    const current = graph.nodes[graph.cursor];
    
    if (!current.parentId) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedo] Cannot undo, at root");
      }
      return false;
    }

    graph.cursor = current.parentId;
    const parent = graph.nodes[graph.cursor];
    applyState(parent.after, `undo ${current.label}`);
    saveGraph(graph);

    if (DEBUG_MODE) {
      console.log(`↩️ [UndoRedo] Undo: ${current.label}`);
    }

    // Notify history change
    const path = getPathToCursor(graph);
    onHistoryChange?.(path, path.length - 1);
    return true;
  }, [applyState, onHistoryChange, getGraph]);

  const redo = useCallback((childId?: string): boolean => {
    const graph = getGraph();
    const current = graph.nodes[graph.cursor];
    
    if (!current.childrenIds.length) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedo] Cannot redo, no children");
      }
      return false;
    }

    // Use provided childId or default to first child
    const targetId = childId ?? current.childrenIds[0];
    
    if (!graph.nodes[targetId]) {
      if (DEBUG_MODE) {
        console.log(`❌ [UndoRedo] Invalid child ID: ${targetId}`);
      }
      return false;
    }

    graph.cursor = targetId;
    const target = graph.nodes[targetId];
    applyState(target.after, `redo ${target.label}`);
    saveGraph(graph);

    if (DEBUG_MODE) {
      console.log(`↪️ [UndoRedo] Redo: ${target.label}`);
    }

    // Notify history change
    const path = getPathToCursor(graph);
    onHistoryChange?.(path, path.length - 1);
    return true;
  }, [applyState, onHistoryChange, getGraph]);

  const recordAction = useCallback(
    (type: ActionType, metadata: Record<string, unknown> = {}) => {
      if (isUndoRedoOperationRef.current) {
        if (DEBUG_MODE) {
          console.log("🚫 [UndoRedo] Skipping recordAction during undo/redo");
        }
        return;
      }

      const currentState = captureCurrentState();
      const description = getActionDescription(type, metadata);
      push(description, currentState, { ...metadata, actionType: type });
    },
    [captureCurrentState, push]
  );

  const recordActionImmediate = useCallback(
    (type: ActionType, metadata: Record<string, unknown> = {}) => {
      // Clear any pending position actions since we have an immediate action
      if (positionDebounceRef.current) {
        clearTimeout(positionDebounceRef.current);
        positionDebounceRef.current = null;
        pendingPositionActionRef.current = null;
      }

      recordAction(type, metadata);
    },
    [recordAction]
  );

  const clearHistory = useCallback(() => {
    const graph = getGraph();
    graphRef.current = createRootGraph(captureCurrentState());
    lastCapturedStateRef.current = null;
    lastActionTimestampRef.current = 0;
    saveGraph(graphRef.current);
    onHistoryChange?.([], -1);
    
    if (DEBUG_MODE) {
      console.log("�� [UndoRedo] History cleared");
    }
  }, [captureCurrentState, onHistoryChange, getGraph]);

  const getHistory = useCallback(() => {
    const graph = getGraph();
    const path = getPathToCursor(graph);
    const current = graph.nodes[graph.cursor];
    
    return {
      entries: path,
      currentIndex: path.length - 1,
      canUndo: current.parentId !== null,
      canRedo: current.childrenIds.length > 0,
      // Additional graph-specific data
      branchOptions: current.childrenIds,
      graphStats: getGraphStats(graph),
      currentNode: current,
    };
  }, [getGraph]);

  const getBranchOptions = useCallback((): string[] => {
    const graph = getGraph();
    return [...graph.nodes[graph.cursor].childrenIds];
  }, [getGraph]);

  // ============================================================================
  // AUTO-DETECTION SYSTEM
  // ============================================================================

  useEffect(() => {
    if (isUndoRedoOperationRef.current) return;

    const currentState = captureCurrentState();
    const timeSinceLastAction = Date.now() - lastActionTimestampRef.current;

    // Initialize if this is the first state
    if (!lastCapturedStateRef.current) {
      lastCapturedStateRef.current = currentState;
      return;
    }

    // Skip if states are identical
    if (areStatesEqual(lastCapturedStateRef.current, currentState)) {
      return;
    }

    // Check for position changes (node movements)
    const nodePositionChanges = currentState.nodes.filter((node, index) => {
      const oldNode = lastCapturedStateRef.current!.nodes[index];
      return oldNode && (
        oldNode.position.x !== node.position.x || 
        oldNode.position.y !== node.position.y
      );
    });

    // Handle position changes with debouncing
    if (nodePositionChanges.length > 0) {
      if (!pendingPositionActionRef.current) {
        pendingPositionActionRef.current = {
          movedNodes: new Set(nodePositionChanges.map(n => n.id)),
          startTime: Date.now(),
        };
      } else {
        // Add newly moved nodes to the set
        nodePositionChanges.forEach(node => 
          pendingPositionActionRef.current!.movedNodes.add(node.id)
        );
      }

      // Clear existing timeout
      if (positionDebounceRef.current) {
        clearTimeout(positionDebounceRef.current);
      }

      // Set new timeout
      positionDebounceRef.current = setTimeout(() => {
        if (pendingPositionActionRef.current && !isUndoRedoOperationRef.current) {
          const movedNodeCount = pendingPositionActionRef.current.movedNodes.size;
          
          if (DEBUG_MODE) {
            console.log(`🎯 [UndoRedo] Recording position change for ${movedNodeCount} nodes`);
          }

          const description = movedNodeCount > 1 ? `Move ${movedNodeCount} nodes` : "Move node";
          push(description, captureCurrentState(), {
            actionType: "node_move",
            nodeCount: movedNodeCount,
            movedNodes: Array.from(pendingPositionActionRef.current.movedNodes),
          });

          lastCapturedStateRef.current = captureCurrentState();
        }

        pendingPositionActionRef.current = null;
        positionDebounceRef.current = null;
      }, finalConfig.positionDebounceMs);

      return;
    }

    // Handle other changes (add/delete) with action separation
    if (timeSinceLastAction > finalConfig.actionSeparatorMs) {
      const nodeCountDiff = currentState.nodes.length - lastCapturedStateRef.current.nodes.length;
      const edgeCountDiff = currentState.edges.length - lastCapturedStateRef.current.edges.length;

      let actionType: ActionType = "bulk_update";
      let description = "Bulk update";
      const metadata: Record<string, unknown> = {};

      if (nodeCountDiff > 0) {
        actionType = "node_add";
        description = nodeCountDiff > 1 ? `Add ${nodeCountDiff} nodes` : "Add node";
        metadata.nodeCount = nodeCountDiff;
      } else if (nodeCountDiff < 0) {
        actionType = "node_delete";
        const deletedCount = Math.abs(nodeCountDiff);
        description = deletedCount > 1 ? `Delete ${deletedCount} nodes` : "Delete node";
        metadata.nodeCount = deletedCount;
      } else if (edgeCountDiff > 0) {
        actionType = "edge_add";
        description = edgeCountDiff > 1 ? `Add ${edgeCountDiff} connections` : "Add connection";
        metadata.edgeCount = edgeCountDiff;
      } else if (edgeCountDiff < 0) {
        actionType = "edge_delete";
        const deletedCount = Math.abs(edgeCountDiff);
        description = deletedCount > 1 ? `Delete ${deletedCount} connections` : "Delete connection";
        metadata.edgeCount = deletedCount;
      }

      if (DEBUG_MODE) {
        console.log(`🔍 [UndoRedo] Auto-detected: ${description}`, metadata);
      }

      push(description, currentState, { ...metadata, actionType });
      lastCapturedStateRef.current = currentState;
    }
  }, [nodes, edges, captureCurrentState, push, finalConfig.positionDebounceMs, finalConfig.actionSeparatorMs]);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      if (!ctrlKey) return;

      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTypingInInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true");

      if (isTypingInInput) return;

      if (event.key === "z" || event.key === "y") {
        event.preventDefault();
      }

      if (event.key === "z" && !event.shiftKey) {
        undo();
      } else if (event.key === "y" || (event.key === "z" && event.shiftKey)) {
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // ============================================================================
  // CLEANUP
  // ============================================================================

  useEffect(() => {
    return () => {
      if (positionDebounceRef.current) {
        clearTimeout(positionDebounceRef.current);
      }
    };
  }, []);

  // ============================================================================
  // REGISTER WITH CONTEXT
  // ============================================================================

  useEffect(() => {
    const managerAPI = {
      undo,
      redo,
      recordAction,
      recordActionDebounced: recordAction, // Same as recordAction now
      clearHistory,
      getHistory,
      // Additional graph-specific APIs
      getBranchOptions,
      redoSpecificBranch: redo, // Alias for clarity
    };

    registerManager(managerAPI);

    if (typeof window !== "undefined" && DEBUG_MODE) {
      (window as any).undoRedoManager = {
        ...managerAPI,
        getGraph: () => getGraph(),
        exportGraph: () => JSON.stringify(getGraph(), null, 2),
        importGraph: (jsonString: string) => {
          try {
            const graph = JSON.parse(jsonString);
            graphRef.current = graph;
            const current = graph.nodes[graph.cursor];
            applyState(current.after, "import graph");
            saveGraph(graph);
          } catch (error) {
            console.error("Failed to import graph:", error);
          }
        },
        clearPersisted: clearPersistedGraph,
      };
    }
  }, [undo, redo, recordAction, clearHistory, getHistory, getBranchOptions, applyState, getGraph]);

  return null;
};

export default UndoRedoManager;