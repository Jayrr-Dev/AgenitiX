/**
 * UNDO REDO MANAGER - Complete undo/redo system for workflow editor
 *
 * • Manages action history with state snapshots for nodes and edges
 * • Provides undo/redo operations with keyboard shortcut support
 * • Debounced action recording to prevent excessive history entries
 * • Memory-efficient history compression and safe state cloning
 * • Integrates with UndoRedoContext for application-wide access
 *
 * Keywords: undo-redo, history, state-snapshots, debouncing, memory-management
 */

"use client";

import { useReactFlow, type Edge, type Node } from "@xyflow/react";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useRegisterUndoRedoManager } from "./UndoRedoContext";

// PERFORMANCE OPTIMIZATION - Debug logging only in development
const DEBUG_MODE = process.env.NODE_ENV === "development";

// TYPES
export interface ActionHistoryEntry {
  id: string;
  timestamp: number;
  type: ActionType;
  description: string;
  beforeState: FlowState;
  afterState: FlowState;
  metadata?: Record<string, unknown>;
}

export type ActionType =
  | "node_add"
  | "node_delete"
  | "node_move"
  | "node_update"
  | "node_select"
  | "edge_add"
  | "edge_delete"
  | "edge_update"
  | "edge_reconnect"
  | "bulk_delete"
  | "bulk_move"
  | "bulk_update"
  | "paste"
  | "duplicate"
  | "import"
  | "custom";

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

export interface UndoRedoConfig {
  maxHistorySize?: number;
  debounceMs?: number;
  enableViewportTracking?: boolean;
  enableAutoSave?: boolean;
  compressionThreshold?: number;
}

export interface UndoRedoManagerProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  config?: UndoRedoConfig;
  onHistoryChange?: (
    history: ActionHistoryEntry[],
    currentIndex: number
  ) => void;
}

// DEFAULT CONFIGURATION - Optimized for speed with ultra-fast response
const DEFAULT_CONFIG: Required<UndoRedoConfig> = {
  maxHistorySize: 100,
  debounceMs: 50, // Ultra-fast 50ms for responsive feel during fast movements
  enableViewportTracking: false,
  enableAutoSave: true,
  compressionThreshold: 50, // Compress history when it exceeds this size
};

// PERFORMANCE OPTIMIZED ID GENERATION
let actionCounter = 0;
const generateActionId = (): string =>
  `action_${Date.now()}_${++actionCounter}`;

/**
 * Safe deep clone function that handles BigInt and other non-serializable values
 */
const safeDeepClone = (obj: any): any => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => safeDeepClone(item));
  }

  if (typeof obj === "object") {
    const cloned: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Handle BigInt by converting to string
        if (typeof value === "bigint") {
          cloned[key] = value.toString();
        } else {
          cloned[key] = safeDeepClone(value);
        }
      }
    }
    return cloned;
  }

  return obj;
};

/**
 * REACTFLOW-OPTIMIZED STATE CREATION - Proper deep cloning for nested objects
 * ReactFlow nodes/edges have nested objects (position, data) that need deep cloning
 */
const createFlowState = (
  nodes: Node[],
  edges: Edge[],
  viewport?: { x: number; y: number; zoom: number }
): FlowState => ({
  // DEEP CLONE NODES - ReactFlow nodes have nested position/data objects
  nodes: nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: node.data ? { ...node.data } : node.data,
    style: node.style ? { ...node.style } : node.style,
  })),
  // DEEP CLONE EDGES - ReactFlow edges can have nested data
  edges: edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
    style: edge.style ? { ...edge.style } : edge.style,
  })),
  viewport: viewport ? { ...viewport } : undefined,
});

/**
 * Safe JSON stringify that handles BigInt and other non-serializable values
 */
const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    });
  } catch {
    return "null";
  }
};

/**
 * REACTFLOW-OPTIMIZED STATE COMPARISON - Handles node order and nested properties
 * Optimized but thorough comparison for ReactFlow state integrity
 */
const areStatesEqual = (state1: FlowState, state2: FlowState): boolean => {
  try {
    // FAST LENGTH CHECKS - Early exit for different array sizes
    if (
      state1.nodes.length !== state2.nodes.length ||
      state1.edges.length !== state2.edges.length
    ) {
      return false;
    }

    // NODES COMPARISON - Create maps by ID to handle order changes
    const nodes1Map = new Map(state1.nodes.map((n) => [n.id, n]));
    const nodes2Map = new Map(state2.nodes.map((n) => [n.id, n]));

    // Check if all node IDs match
    if (nodes1Map.size !== nodes2Map.size) return false;

    // Compare each node by ID (handles order changes)
    const nodeIds1 = Array.from(nodes1Map.keys());
    for (const id of nodeIds1) {
      const node1 = nodes1Map.get(id)!;
      const node2 = nodes2Map.get(id);
      if (!node2) return false;

      // Check critical node properties
      if (
        node1.type !== node2.type ||
        node1.selected !== node2.selected ||
        node1.position.x !== node2.position.x ||
        node1.position.y !== node2.position.y
      ) {
        return false;
      }
    }

    // EDGES COMPARISON - Create maps by ID to handle order changes
    const edges1Map = new Map(state1.edges.map((e) => [e.id, e]));
    const edges2Map = new Map(state2.edges.map((e) => [e.id, e]));

    // Check if all edge IDs match
    if (edges1Map.size !== edges2Map.size) return false;

    // Compare each edge by ID (handles order changes)
    const edgeIds1 = Array.from(edges1Map.keys());
    for (const id of edgeIds1) {
      const edge1 = edges1Map.get(id)!;
      const edge2 = edges2Map.get(id);
      if (!edge2) return false;

      // Check critical edge properties
      if (
        edge1.source !== edge2.source ||
        edge1.target !== edge2.target ||
        edge1.selected !== edge2.selected
      ) {
        return false;
      }
    }

    // VIEWPORT COMPARISON - Quick object check
    if (state1.viewport && state2.viewport) {
      return (
        state1.viewport.x === state2.viewport.x &&
        state1.viewport.y === state2.viewport.y &&
        state1.viewport.zoom === state2.viewport.zoom
      );
    }

    return !state1.viewport && !state2.viewport;
  } catch {
    return false;
  }
};

const compressHistory = (
  history: ActionHistoryEntry[],
  threshold: number
): ActionHistoryEntry[] => {
  if (history.length <= threshold) return history;

  // Keep recent entries and compress older ones
  const recentEntries = history.slice(-Math.floor(threshold * 0.7));
  const olderEntries = history.slice(0, -Math.floor(threshold * 0.7));

  // Compress older entries by keeping only major actions
  const majorActionTypes: ActionType[] = [
    "node_add",
    "node_delete",
    "edge_add",
    "edge_delete",
    "bulk_delete",
    "paste",
    "import",
  ];
  const compressedOlder = olderEntries.filter((entry) =>
    majorActionTypes.includes(entry.type)
  );

  return [...compressedOlder, ...recentEntries];
};

const getActionDescription = (
  type: ActionType,
  metadata?: Record<string, unknown>
): string => {
  const descriptions: Record<ActionType, string> = {
    node_add: "Add node",
    node_delete: "Delete node",
    node_move: "Move node",
    node_update: "Update node",
    node_select: "Select node",
    edge_add: "Add connection",
    edge_delete: "Delete connection",
    edge_update: "Update connection",
    edge_reconnect: "Reconnect edge",
    bulk_delete: "Delete multiple items",
    bulk_move: "Move multiple items",
    bulk_update: "Update multiple items",
    paste: "Paste items",
    duplicate: "Duplicate items",
    import: "Import flow",
    custom: "Custom action",
  };

  let description = descriptions[type] || "Unknown action";

  // Add metadata context if available
  if (metadata) {
    if (metadata.nodeCount) description += ` (${metadata.nodeCount} nodes)`;
    if (metadata.edgeCount) description += ` (${metadata.edgeCount} edges)`;
    if (metadata.nodeType) description += ` (${metadata.nodeType})`;
    if (metadata.customDescription)
      description = metadata.customDescription as string;
  }

  return description;
};

// MAIN COMPONENT
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
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );
  const registerManager = useRegisterUndoRedoManager();

  // STATE MANAGEMENT
  const historyRef = useRef<ActionHistoryEntry[]>([]);
  const currentIndexRef = useRef(-1);
  const isUndoRedoOperationRef = useRef(false);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<FlowState | null>(null);
  const pendingActionRef = useRef<{
    type: ActionType;
    metadata?: Record<string, unknown>;
  } | null>(null);

  // DRAG-AWARE STATE MANAGEMENT - Track drag operations for better undo/redo
  const isDraggingRef = useRef(false);
  const dragStartStateRef = useRef<FlowState | null>(null);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // MEMORY MANAGEMENT
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    };
  }, []);

  // CORE FUNCTIONS
  const addToHistory = useCallback(
    (
      type: ActionType,
      beforeState: FlowState,
      afterState: FlowState,
      metadata?: Record<string, unknown>
    ) => {
      // Skip if states are identical
      if (areStatesEqual(beforeState, afterState)) return;

      // Skip if this is an undo/redo operation
      if (isUndoRedoOperationRef.current) return;

      const entry: ActionHistoryEntry = {
        id: generateActionId(),
        timestamp: Date.now(),
        type,
        description: getActionDescription(type, metadata),
        beforeState,
        afterState,
        metadata,
      };

      // Remove any history after current index (when adding new action after undo)
      const newHistory = historyRef.current.slice(
        0,
        currentIndexRef.current + 1
      );
      newHistory.push(entry);

      // Apply compression if needed
      if (newHistory.length > finalConfig.compressionThreshold) {
        historyRef.current = compressHistory(
          newHistory,
          finalConfig.compressionThreshold
        );
      } else {
        historyRef.current = newHistory;
      }

      // Limit history size
      if (historyRef.current.length > finalConfig.maxHistorySize) {
        historyRef.current = historyRef.current.slice(
          -finalConfig.maxHistorySize
        );
      }

      currentIndexRef.current = historyRef.current.length - 1;

      // Notify history change
      onHistoryChange?.(historyRef.current, currentIndexRef.current);
    },
    [
      finalConfig.compressionThreshold,
      finalConfig.maxHistorySize,
      onHistoryChange,
    ]
  );

  const captureCurrentState = useCallback((): FlowState => {
    const viewport = finalConfig.enableViewportTracking
      ? reactFlowInstance.getViewport()
      : undefined;
    return createFlowState(nodes, edges, viewport);
  }, [nodes, edges, finalConfig.enableViewportTracking, reactFlowInstance]);

  const applyState = useCallback(
    (state: FlowState) => {
      isUndoRedoOperationRef.current = true;

      try {
        onNodesChange(state.nodes);
        onEdgesChange(state.edges);

        if (state.viewport && finalConfig.enableViewportTracking) {
          reactFlowInstance.setViewport(state.viewport);
        }
      } finally {
        // INSTANT PERFORMANCE - Use minimal timeout for ReactFlow state sync
        setTimeout(() => {
          isUndoRedoOperationRef.current = false;
        }, 1); // Minimal delay to ensure ReactFlow processes the state change
      }
    },
    [
      onNodesChange,
      onEdgesChange,
      finalConfig.enableViewportTracking,
      reactFlowInstance,
    ]
  );

  // PUBLIC API
  const undo = useCallback(() => {
    if (DEBUG_MODE) {
      console.log(
        "↩️ [UndoRedoManager] Undo called, currentIndex:",
        currentIndexRef.current
      );
    }

    if (currentIndexRef.current < 0) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedoManager] Cannot undo, no history");
      }
      return false;
    }

    const entry = historyRef.current[currentIndexRef.current];
    if (DEBUG_MODE) {
      console.log("🔄 [UndoRedoManager] Applying undo state:", entry.type);
    }
    applyState(entry.beforeState);
    currentIndexRef.current--;

    onHistoryChange?.(historyRef.current, currentIndexRef.current);
    if (DEBUG_MODE) {
      console.log(
        "✅ [UndoRedoManager] Undo completed, new index:",
        currentIndexRef.current
      );
    }
    return true;
  }, [applyState, onHistoryChange]);

  const redo = useCallback(() => {
    if (DEBUG_MODE) {
      console.log(
        "↪️ [UndoRedoManager] Redo called, currentIndex:",
        currentIndexRef.current
      );
    }

    if (currentIndexRef.current >= historyRef.current.length - 1) {
      if (DEBUG_MODE) {
        console.log("❌ [UndoRedoManager] Cannot redo, no future history");
      }
      return false;
    }

    currentIndexRef.current++;
    const entry = historyRef.current[currentIndexRef.current];
    if (DEBUG_MODE) {
      console.log("🔄 [UndoRedoManager] Applying redo state:", entry.type);
    }
    applyState(entry.afterState);

    onHistoryChange?.(historyRef.current, currentIndexRef.current);
    if (DEBUG_MODE) {
      console.log(
        "✅ [UndoRedoManager] Redo completed, new index:",
        currentIndexRef.current
      );
    }
    return true;
  }, [applyState, onHistoryChange]);

  const recordAction = useCallback(
    (type: ActionType, metadata?: Record<string, unknown>) => {
      if (DEBUG_MODE) {
        console.log("🔄 [UndoRedoManager] Recording action:", type, metadata);
      }

      const currentState = captureCurrentState();
      if (DEBUG_MODE) {
        console.log(
          "📸 [UndoRedoManager] Current state captured, nodes:",
          currentState.nodes.length
        );
      }

      if (lastStateRef.current) {
        if (DEBUG_MODE) {
          console.log("✅ [UndoRedoManager] Adding to history");
        }
        addToHistory(type, lastStateRef.current, currentState, metadata);
      } else if (DEBUG_MODE) {
        console.log("⚠️ [UndoRedoManager] No lastState, skipping history");
      }

      lastStateRef.current = currentState;
    },
    [captureCurrentState, addToHistory]
  );

  const recordActionDebounced = useCallback(
    (type: ActionType, metadata?: Record<string, unknown>) => {
      // Store pending action
      pendingActionRef.current = { type, metadata };

      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        if (pendingActionRef.current) {
          recordAction(
            pendingActionRef.current.type,
            pendingActionRef.current.metadata
          );
          pendingActionRef.current = null;
        }
      }, finalConfig.debounceMs);
    },
    [recordAction, finalConfig.debounceMs]
  );

  // IMMEDIATE RECORDING - For ultra-fast movements (no debounce)
  const recordActionImmediate = useCallback(
    (type: ActionType, metadata?: Record<string, unknown>) => {
      if (DEBUG_MODE) {
        console.log("⚡ [UndoRedoManager] IMMEDIATE recording action:", type);
      }

      // Clear any pending debounced actions
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        pendingActionRef.current = null;
      }

      // Record immediately
      recordAction(type, metadata);
    },
    [recordAction]
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    currentIndexRef.current = -1;
    lastStateRef.current = null;
    onHistoryChange?.([], -1);
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

  // DRAG-AWARE DETECTION FUNCTIONS
  const detectDragStart = useCallback(() => {
    if (!isDraggingRef.current) {
      isDraggingRef.current = true;
      dragStartStateRef.current = captureCurrentState();

      if (DEBUG_MODE) {
        console.log(
          "🎯 [UndoRedoManager] Drag operation detected - capturing start state"
        );
      }
    }
  }, [captureCurrentState]);

  const detectDragEnd = useCallback(() => {
    if (isDraggingRef.current) {
      // Clear any existing drag end timeout
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }

      // Set a short timeout to ensure drag is actually finished
      dragEndTimeoutRef.current = setTimeout(() => {
        if (isDraggingRef.current && dragStartStateRef.current) {
          const endState = captureCurrentState();

          // Only record if position actually changed
          if (!areStatesEqual(dragStartStateRef.current, endState)) {
            if (DEBUG_MODE) {
              console.log(
                "🎯 [UndoRedoManager] Drag completed - recording movement"
              );
            }
            addToHistory("node_move", dragStartStateRef.current, endState, {
              dragOperation: true,
              nodeCount: endState.nodes.length,
            });
            lastStateRef.current = endState;
          }

          // Reset drag state
          isDraggingRef.current = false;
          dragStartStateRef.current = null;
        }
      }, 100); // Short delay to ensure drag is complete
    }
  }, [addToHistory, captureCurrentState]);

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      if (!ctrlKey) return;

      // Check if user is currently typing in an input field
      const activeElement = document.activeElement;
      const isTypingInInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.getAttribute("contenteditable") === "true" ||
          (activeElement as HTMLElement).contentEditable === "true");

      // If typing in an input field, allow browser's native undo/redo to work
      if (isTypingInInput) {
        return; // Let the browser handle Ctrl+Z/Ctrl+Y natively in input fields
      }

      // Prevent default browser behavior only when NOT in input fields
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

  // ENHANCED STATE TRACKING WITH DRAG DETECTION
  useEffect(() => {
    if (isUndoRedoOperationRef.current) return;

    const currentState = captureCurrentState();

    // Initialize if this is the first state
    if (!lastStateRef.current) {
      lastStateRef.current = currentState;
      return;
    }

    // Check if nodes changed (potential drag operation)
    const nodesChanged = !areStatesEqual(lastStateRef.current, currentState);

    if (nodesChanged && finalConfig.enableAutoSave) {
      // SMART DRAG DETECTION - Check if any node position changed significantly
      const hasPositionChange = currentState.nodes.some((node) => {
        const lastNode = lastStateRef.current?.nodes.find(
          (n) => n.id === node.id
        );
        if (!lastNode) return true; // New node

        const deltaX = Math.abs(node.position.x - lastNode.position.x);
        const deltaY = Math.abs(node.position.y - lastNode.position.y);
        return deltaX > 1 || deltaY > 1; // Threshold for meaningful movement
      });

      if (hasPositionChange) {
        // DRAG OPERATION DETECTED
        detectDragStart();

        // Use faster recording for position changes (less debounce)
        pendingActionRef.current = {
          type: "node_move",
          metadata: {
            nodeCount: nodes.length,
            fastMovement: true,
          },
        };

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }

        // Ultra-fast recording for movements (25ms)
        debounceTimeoutRef.current = setTimeout(() => {
          if (pendingActionRef.current) {
            detectDragEnd(); // This will handle the actual recording
            pendingActionRef.current = null;
          }
        }, 25);
      } else {
        // NON-POSITION CHANGES - Use normal debounced recording
        recordActionDebounced("bulk_update", {
          nodeCount: nodes.length,
          edgeCount: edges.length,
        });
      }
    }
  }, [
    nodes,
    edges,
    captureCurrentState,
    recordActionDebounced,
    detectDragStart,
    detectDragEnd,
    finalConfig.enableAutoSave,
  ]);

  // REGISTER WITH CONTEXT
  useEffect(() => {
    const managerAPI = {
      undo,
      redo,
      recordAction,
      recordActionDebounced,
      recordActionImmediate,
      clearHistory,
      getHistory,
      // DRAG-AWARE FUNCTIONS - Exposed for external use if needed
      detectDragStart,
      detectDragEnd,
    };

    registerManager(managerAPI);

    // Also attach to window for debugging in development
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      (window as any).undoRedoManager = managerAPI;
    }
  }, [
    undo,
    redo,
    recordAction,
    recordActionDebounced,
    recordActionImmediate,
    clearHistory,
    getHistory,
    detectDragStart,
    detectDragEnd,
    registerManager,
  ]);

  // This component doesn't render anything - it's purely for state management
  return null;
};

export default UndoRedoManager;

// NOTE: useUndoRedo hook is now provided by UndoRedoContext.tsx
