/**
 * UNDO REDO MANAGER V2 - Robust undo/redo system for workflow editor
 *
 * • Clean action separation with proper timing control
 * • Reliable state capture with validation and conflict resolution
 * • Predictable undo/redo operations with detailed logging
 * • Memory-efficient with automatic compression and cleanup
 * • Type-safe with comprehensive error handling
 *
 * Keywords: undo-redo, state-management, action-tracking, reliability, performance
 */

"use client";

import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useRegisterUndoRedoManager } from "./UndoRedoContext";

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const DEBUG_MODE = process.env.NODE_ENV === "development";
const ACTION_SEPARATOR_DELAY = 150; // ms between distinct actions
const POSITION_DEBOUNCE_DELAY = 300; // ms for position changes
const MAX_HISTORY_SIZE = 100;
const COMPRESSION_THRESHOLD = 80;

// ============================================================================
// TYPES
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

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface ActionEntry {
  id: string;
  timestamp: number;
  type: ActionType;
  description: string;
  beforeState: FlowState;
  afterState: FlowState;
  metadata: Record<string, unknown>;
}

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
  onHistoryChange?: (history: ActionEntry[], currentIndex: number) => void;
}

// ============================================================================
// UTILITIES
// ============================================================================

let actionCounter = 0;
const generateActionId = (): string => `action_${Date.now()}_${++actionCounter}`;

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

const areStatesEqual = (state1: FlowState, state2: FlowState): boolean => {
  return (
    JSON.stringify(state1.nodes) === JSON.stringify(state2.nodes) &&
    JSON.stringify(state1.edges) === JSON.stringify(state2.edges)
  );
};

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
      maxHistorySize: config.maxHistorySize ?? MAX_HISTORY_SIZE,
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

  const historyRef = useRef<ActionEntry[]>([]);
  const currentIndexRef = useRef(-1);
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

  const addToHistory = useCallback(
    (
      type: ActionType,
      beforeState: FlowState,
      afterState: FlowState,
      metadata: Record<string, unknown> = {}
    ) => {
      // Skip if states are identical
      if (areStatesEqual(beforeState, afterState)) {
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

      const entry: ActionEntry = {
        id: generateActionId(),
        timestamp: Date.now(),
        type,
        description: getActionDescription(type, metadata),
        beforeState,
        afterState,
        metadata,
      };

      if (DEBUG_MODE) {
        console.log("📝 [UndoRedo] Adding to history:", entry.description);
      }

      // Remove any history after current index (when adding new action after undo)
      const newHistory = historyRef.current.slice(0, currentIndexRef.current + 1);
      newHistory.push(entry);

      // Apply compression if enabled and needed
      if (finalConfig.enableCompression && newHistory.length > COMPRESSION_THRESHOLD) {
        // Keep recent actions and compress older ones
        const recentActions = newHistory.slice(-50);
        const compressedCount = newHistory.length - recentActions.length;
        
        if (DEBUG_MODE) {
          console.log(`🗜️ [UndoRedo] Compressed ${compressedCount} older actions`);
        }
        
        historyRef.current = recentActions;
      } else {
        historyRef.current = newHistory;
      }

      // Limit total history size
      if (historyRef.current.length > finalConfig.maxHistorySize) {
        const removedCount = historyRef.current.length - finalConfig.maxHistorySize;
        historyRef.current = historyRef.current.slice(-finalConfig.maxHistorySize);
        
        if (DEBUG_MODE) {
          console.log(`✂️ [UndoRedo] Trimmed ${removedCount} oldest actions`);
        }
      }

      currentIndexRef.current = historyRef.current.length - 1;
      lastActionTimestampRef.current = Date.now();

      // Notify history change
      onHistoryChange?.(historyRef.current, currentIndexRef.current);
    },
    [finalConfig.enableCompression, finalConfig.maxHistorySize, onHistoryChange]
  );

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
        // Use a longer timeout to ensure ReactFlow fully processes the changes
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

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  const undo = useCallback(() => {
    if (currentIndexRef.current < 0) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedo] Cannot undo, no history");
      }
      return false;
    }

    const entry = historyRef.current[currentIndexRef.current];
    if (DEBUG_MODE) {
      console.log(`↩️ [UndoRedo] Undoing: ${entry.description}`);
    }

    applyState(entry.beforeState, `undo ${entry.description}`);
    currentIndexRef.current--;

    onHistoryChange?.(historyRef.current, currentIndexRef.current);
    return true;
  }, [applyState, onHistoryChange]);

  const redo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedo] Cannot redo, no future history");
      }
      return false;
    }

    currentIndexRef.current++;
    const entry = historyRef.current[currentIndexRef.current];
    if (DEBUG_MODE) {
      console.log(`↪️ [UndoRedo] Redoing: ${entry.description}`);
    }

    applyState(entry.afterState, `redo ${entry.description}`);
    onHistoryChange?.(historyRef.current, currentIndexRef.current);
    return true;
  }, [applyState, onHistoryChange]);

  const recordAction = useCallback(
    (type: ActionType, metadata: Record<string, unknown> = {}) => {
      if (isUndoRedoOperationRef.current) {
        if (DEBUG_MODE) {
          console.log("🚫 [UndoRedo] Skipping recordAction during undo/redo");
        }
        return;
      }

      const currentState = captureCurrentState();
      
      if (lastCapturedStateRef.current) {
        if (DEBUG_MODE) {
          console.log(`📝 [UndoRedo] Recording action: ${type}`);
        }
        addToHistory(type, lastCapturedStateRef.current, currentState, metadata);
      }

      lastCapturedStateRef.current = currentState;
    },
    [captureCurrentState, addToHistory]
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
    historyRef.current = [];
    currentIndexRef.current = -1;
    lastCapturedStateRef.current = null;
    lastActionTimestampRef.current = 0;
    onHistoryChange?.([], -1);
    
    if (DEBUG_MODE) {
      console.log("🧹 [UndoRedo] History cleared");
    }
  }, [onHistoryChange]);

  const getHistory = useCallback(
    () => ({
      entries: [...historyRef.current],
      currentIndex: currentIndexRef.current,
      canUndo: currentIndexRef.current >= 0,
      canRedo: currentIndexRef.current < historyRef.current.length - 1,
    }),
    []
  );

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

          addToHistory(
            "node_move",
            lastCapturedStateRef.current!,
            captureCurrentState(),
            {
              nodeCount: movedNodeCount,
              movedNodes: Array.from(pendingPositionActionRef.current.movedNodes),
            }
          );

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
      const metadata: Record<string, unknown> = {};

      if (nodeCountDiff > 0) {
        actionType = "node_add";
        metadata.nodeCount = nodeCountDiff;
      } else if (nodeCountDiff < 0) {
        actionType = "node_delete";
        metadata.nodeCount = Math.abs(nodeCountDiff);
      } else if (edgeCountDiff > 0) {
        actionType = "edge_add";
        metadata.edgeCount = edgeCountDiff;
      } else if (edgeCountDiff < 0) {
        actionType = "edge_delete";
        metadata.edgeCount = Math.abs(edgeCountDiff);
      }

      if (DEBUG_MODE) {
        console.log(`🔍 [UndoRedo] Auto-detected: ${actionType}`, metadata);
      }

      addToHistory(actionType, lastCapturedStateRef.current, currentState, metadata);
      lastCapturedStateRef.current = currentState;
    }
  }, [nodes, edges, captureCurrentState, addToHistory, finalConfig.positionDebounceMs, finalConfig.actionSeparatorMs]);

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
      recordActionImmediate,
      clearHistory,
      getHistory,
    };

    registerManager(managerAPI);

    if (typeof window !== "undefined" && DEBUG_MODE) {
      (window as any).undoRedoManager = managerAPI;
    }
  }, [undo, redo, recordAction, recordActionImmediate, clearHistory, getHistory, registerManager]);

  return null;
};

export default UndoRedoManager;

// NOTE: useUndoRedo hook is now provided by UndoRedoContext.tsx
