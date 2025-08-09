"use client";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type {
  AgenEdge,
  AgenNode,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { generateNodeId } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/nodeUtils";
import {
  type Connection,
  type EdgeChange,
  type Edge as ReactFlowEdge,
  type Node as ReactFlowNode,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";
import { type FlowMetadata, FlowProvider } from "./contexts/flow-context";
import { useFlowMetadataOptional } from "./contexts/flow-metadata-context";

import ActionToolbar from "@/features/business-logic-modern/infrastructure/action-toolbar/ActionToolbar";
import Sidebar from "@/features/business-logic-modern/infrastructure/sidebar/Sidebar";
import UndoRedoManager from "../action-toolbar/history/UndoRedoManager";
import type { HistoryNode } from "../action-toolbar/history/historyGraph";
import {
  UndoRedoProvider,
  useUndoRedo,
} from "../action-toolbar/history/undo-redo-context";
import { useNodeStyleStore } from "../theming/stores/nodeStyleStore";
import { FlowCanvas } from "./components/FlowCanvas";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";
import { usePieMenuIntegration } from "./hooks/usePieMenuIntegration";

// Import the new NodeSpec registry
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";

// Simple in-memory cache for node specs to avoid repeated lookups
const __specCache = new Map<string, any>();

// Helper function to get node spec from the new NodeSpec registry system (cached)
const getNodeSpecForType = (nodeType: string) => {
  try {
    if (__specCache.has(nodeType)) {
      return __specCache.get(nodeType);
    }
    // 1. Check the new NodeSpec registry first
    const registeredSpec = getNodeSpecMetadata(nodeType);
    if (registeredSpec) {
      const spec = {
        kind: registeredSpec.kind,
        displayName: registeredSpec.displayName,
        category: registeredSpec.category,
        initialData: registeredSpec.initialData,
      };
      __specCache.set(nodeType, spec);
      return spec;
    }

    // 2. Check the legacy NODESPECS for backward compatibility
    // This part of the original code was removed, so we'll keep it empty or remove it if not needed.
    // The original code had NODESPECS defined elsewhere, but it's not imported here.
    // For now, we'll just return null if no registered spec is found.

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[getNodeSpecForType] No spec found for node type: ${nodeType}`
      );
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(
        `[getNodeSpecForType] Error getting spec for ${nodeType}:`,
        error
      );
    }
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

// FLOW-LEVEL ERROR BOUNDARY - Catches errors that would crash the entire flow editor
// This is different from NodeErrorBoundary which handles individual node errors
class FlowEditorErrorBoundary extends React.Component<
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
          <div className="p-8 text-center">
            <h1 className={styleErrorTitle}>Something went wrong</h1>
            <p className={styleErrorSubtitle}>
              {this.state.error?.message || "Unknown error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className={`${styleRetryBase} ${styleRetryColour}`}
              type="button"
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
  const { flow: _flowMeta } = useFlowMetadataOptional() || { flow: null };

  // Determine if user can edit - defaults to true for owners or when no flow data
  const canEdit = _flowMeta?.canEdit ?? true;
  const isReadOnly = !canEdit;

  // Canvas loading is now handled at page level to prevent double loading screens

  // Initialize theme system on mount
  useEffect(() => {
    try {
      // Enable category theming directly using the store
      const store = useNodeStyleStore.getState();
      store.enableCategoryTheming();
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("❌ Theme initialization failed:", error);
      }
    }
  }, []);

  // Select only the slices we actually need to minimize re-renders
  const nodes = useFlowStore((s) => s.nodes);
  const edges = useFlowStore((s) => s.edges);
  const onNodesChange = useFlowStore((s) => s.onNodesChange);
  const storeOnEdgesChange = useFlowStore((s) => s.onEdgesChange);
  const onConnect = useFlowStore((s) => s.onConnect);
  const addNode = useFlowStore((s) => s.addNode);
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const selectedEdgeId = useFlowStore((s) => s.selectedEdgeId);
  const nodeErrors = useFlowStore((s) => s.nodeErrors);
  const showHistoryPanel = useFlowStore((s) => s.showHistoryPanel);
  const inspectorLocked = useFlowStore((s) => s.inspectorLocked);
  const inspectorViewMode = useFlowStore((s) => s.inspectorViewMode);
  const updateNodeData = useFlowStore((s) => s.updateNodeData);
  const updateNodeId = useFlowStore((s) => s.updateNodeId);
  const logNodeError = useFlowStore((s) => s.logNodeError);
  const clearNodeErrors = useFlowStore((s) => s.clearNodeErrors);
  const toggleHistoryPanel = useFlowStore((s) => s.toggleHistoryPanel);
  const setInspectorLocked = useFlowStore((s) => s.setInspectorLocked);
  const removeNode = useFlowStore((s) => s.removeNode);
  const removeEdge = useFlowStore((s) => s.removeEdge);
  const selectNode = useFlowStore((s) => s.selectNode);
  const selectEdge = useFlowStore((s) => s.selectEdge);
  const clearSelection = useFlowStore((s) => s.clearSelection);

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
    if (isReadOnly) return; // Disable in read-only mode
    const _success = undo();
  }, [undo, isReadOnly]);

  const handleRedo = useCallback(() => {
    if (isReadOnly) return; // Disable in read-only mode
    const _success = redo();
  }, [redo, isReadOnly]);

  // ============================================================================
  // KEYBOARD SHORTCUTS INTEGRATION
  // ============================================================================

  const handleSelectAllNodes = useCallback(() => {
    if (isReadOnly) return; // Disable in read-only mode
    // Select all nodes in the canvas
    const updatedNodes = nodes.map((node) => ({ ...node, selected: true }));
    useFlowStore.setState((state) => ({ ...state, nodes: updatedNodes }));
  }, [nodes, isReadOnly]);

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleCopy = useCallback(() => {
    // Copy is allowed in read-only mode - users can copy but not paste
    copySelectedElements();
  }, [copySelectedElements]);

  const handlePaste = useCallback(() => {
    if (isReadOnly) return; // Disable in read-only mode
    const { copiedNodes } = useFlowStore.getState();
    pasteElements();

    // Record paste action for undo/redo
    if (copiedNodes.length > 0) {
      recordAction("paste", {
        nodeCount: copiedNodes.length,
        nodeTypes: copiedNodes.map((n) => n.type),
      });
    }
  }, [pasteElements, recordAction, isReadOnly]);

  const handleMultiDelete = useCallback(() => {
    if (isReadOnly) return; // Disable in read-only mode
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
    for (const node of selectedNodes) {
      removeNode(node.id);
    }

    // Delete selected edges
    for (const edge of selectedEdges) {
      removeEdge(edge.id);
    }
  }, [nodes, edges, removeNode, removeEdge, recordAction, isReadOnly]);

  // Initialize keyboard shortcuts
  // Pie Menu Integration, basically handle G key activation with full system
  const { handleKeyboardActivation: handlePieMenuActivation } =
    usePieMenuIntegration({
      enabled: true,
      includeDebugActions: process.env.NODE_ENV === "development",
    });

  useKeyboardShortcuts({
    onCopy: handleCopy,
    onPaste: isReadOnly ? () => {} : handlePaste, // Disable paste in read-only mode
    onUndo: isReadOnly ? () => {} : handleUndo, // Disable undo in read-only mode
    onRedo: isReadOnly ? () => {} : handleRedo, // Disable redo in read-only mode
    onToggleHistory: toggleHistoryPanel,
    onSelectAll: isReadOnly ? () => {} : handleSelectAllNodes, // Disable select all in read-only mode
    onClearSelection: handleClearSelection, // Allow clearing selection in read-only mode
    onDelete: isReadOnly ? () => {} : handleMultiDelete, // Disable delete in read-only mode
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
    onPieMenu: isReadOnly ? () => {} : handlePieMenuActivation, // Disable pie menu in read-only mode
  });

  const onDragOver = useCallback(
    (event: React.DragEvent) => {
      if (isReadOnly) {
        event.dataTransfer.dropEffect = "none";
        return;
      }
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [isReadOnly]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();

      if (isReadOnly) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Drop disabled in read-only mode");
        }
        return;
      }

      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("No node type found in drag data");
        }
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
          if (process.env.NODE_ENV !== "production") {
            console.error(`Invalid node type dropped: ${nodeType}`);
          }
          return;
        }

        // Initialize node data with defaults from spec
        const defaultData = spec.initialData || {};

        const newNode: AgenNode = {
          id: generateNodeId(),
          type: nodeType as string,
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
        if (process.env.NODE_ENV !== "production") {
          console.error("❌ Failed to create node from drop:", error);
        }
      }
    },
    [screenToFlowPosition, addNode, recordAction, isReadOnly]
  );

  // Handle direct node creation from pie menu sub-menu
  React.useEffect(() => {
    const handleCreateNodeDirect = (event: CustomEvent) => {
      if (isReadOnly) {
        if (process.env.NODE_ENV !== "production") {
          console.log("Direct node creation disabled in read-only mode");
        }
        return;
      }

      const { node } = event.detail;
      if (process.env.NODE_ENV !== "production") {
        console.log(
          "🎯 FlowEditor: Creating node directly from pie menu",
          node
        );
      }

      try {
        addNode(node);

        // Record node creation for undo/redo
        recordAction("node_add", {
          nodeType: node.type,
          nodeId: node.id,
          position: node.position,
        });

        if (process.env.NODE_ENV !== "production") {
          console.log("✅ FlowEditor: Node created successfully");
        }
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("❌ Failed to create node directly:", error);
        }
      }
    };

    window.addEventListener(
      "create-node-direct",
      handleCreateNodeDirect as EventListener
    );

    return () => {
      window.removeEventListener(
        "create-node-direct",
        handleCreateNodeDirect as EventListener
      );
    };
  }, [addNode, recordAction, isReadOnly]);

  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );
  const selectedEdge = React.useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) || null,
    [edges, selectedEdgeId]
  );

  // ---------------------------------------------------------------------------
  // BACKUP/RESTORE: preserve graph across Fast Refresh hiccups
  // ---------------------------------------------------------------------------
  const { flow } = useFlowMetadataOptional() || { flow: null };
  const setNodes = useFlowStore((s) => s.setNodes);
  const setEdges = useFlowStore((s) => s.setEdges);
  const hasHydrated = useFlowStore((s) => s._hasHydrated);
  const restoreAttemptedRef = React.useRef(false);

  React.useEffect(() => {
    if (!flow?.id || !hasHydrated) return;
    const BACKUP_KEY = `flow-editor-backup:${flow.id}`;

    // Restore if nodes are empty but backup has data
    if (!restoreAttemptedRef.current && nodes.length === 0) {
      try {
        const raw = window.localStorage.getItem(BACKUP_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as {
            nodes?: any[];
            edges?: any[];
            ts?: number;
          };
          if (Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
            setNodes(parsed.nodes as any);
            setEdges(Array.isArray(parsed.edges) ? (parsed.edges as any) : []);
            if (
              typeof window !== "undefined" &&
              window.localStorage.getItem("DEBUG_FLOW_CLEAR") === "1"
            ) {
              // eslint-disable-next-line no-console
              console.log("[FlowDebug] Restored graph from backup snapshot", {
                nodeCount: parsed.nodes.length,
                edgeCount: Array.isArray(parsed.edges)
                  ? parsed.edges.length
                  : 0,
                ts: parsed.ts,
              });
            }
          }
        }
      } catch {}
      restoreAttemptedRef.current = true;
    }
  }, [flow?.id, hasHydrated, nodes.length, setNodes, setEdges]);

  React.useEffect(() => {
    // [Explanation], basically debounce backup writes and run them in idle time to avoid blocking pointer events
    if (!flow?.id) return;
    const BACKUP_KEY = `flow-editor-backup:${flow.id}`;

    const BACKUP_IDLE_DEBOUNCE_MS = 1200; // Wait for inactivity before writing backup

    // Keep one timer per effect run
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    // Schedule the actual write during idle time (or next tick fallback)
    const scheduleIdle = (fn: () => void) => {
      const ric: unknown = (globalThis as any).requestIdleCallback;
      if (typeof ric === "function") {
        (ric as (cb: () => void) => void)(fn);
      } else {
        setTimeout(fn, 0);
      }
    };

    if (nodes.length > 0) {
      // Clear any previous timer then set a fresh one
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      debounceTimer = setTimeout(() => {
        scheduleIdle(() => {
          try {
            const snapshot = JSON.stringify({ nodes, edges, ts: Date.now() });
            window.localStorage.setItem(BACKUP_KEY, snapshot);
          } catch {}
        });
      }, BACKUP_IDLE_DEBOUNCE_MS);
    }

    // Cleanup pending timer if dependencies change rapidly
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [flow?.id, nodes, edges]);

  // DEV DIAGNOSTICS: trace node clearing and storage mutations when enabled
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const debugEnabled =
      typeof window !== "undefined" &&
      window.localStorage.getItem("DEBUG_FLOW_CLEAR") === "1";
    if (!debugEnabled) return;

    // Log when nodes length drops to 0
    if (nodes.length === 0) {
      // eslint-disable-next-line no-console
      console.log("[FlowDebug] nodes length is 0 in FlowEditor render");
      // eslint-disable-next-line no-console
      console.trace("[FlowDebug] FlowEditor zero-nodes stack");
    }

    // Listen to storage changes for the persisted store key
    const onStorage = (ev: StorageEvent) => {
      if (!ev.key) return;
      if (ev.key.includes("flow-editor-storage")) {
        // eslint-disable-next-line no-console
        console.log("[FlowDebug] storage change:", {
          key: ev.key,
          oldLen: ev.oldValue?.length ?? 0,
          newLen: ev.newValue?.length ?? 0,
        });
        // eslint-disable-next-line no-console
        console.trace("[FlowDebug] storage change stack");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [nodes.length]);

  const edgeReconnectSuccessful = React.useRef(true);

  const handleReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback(
    (oldEdge: AgenEdge, newConnection: Connection) => {
      if (isReadOnly) return; // Disable in read-only mode
      edgeReconnectSuccessful.current = true;
      removeEdge(oldEdge.id);
      onConnect(newConnection);
    },
    [isReadOnly, removeEdge, onConnect]
  );

  const handleReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: AgenEdge) => {
      if (isReadOnly) return; // Disable in read-only mode
      if (!edgeReconnectSuccessful.current) {
        removeEdge(edge.id);
      }
      edgeReconnectSuccessful.current = true;
    },
    [isReadOnly, removeEdge]
  );

  const prevSelNodeRef = React.useRef<string | null>(null);
  const prevSelEdgeRef = React.useRef<string | null>(null);
  const handleSelectionChange = useCallback(
    ({
      nodes: selectedNodes,
      edges: selectedEdges,
    }: {
      nodes: AgenNode[];
      edges: AgenEdge[];
    }) => {
      // Handle node selection first
      const nodeId = selectedNodes.length > 0 ? selectedNodes[0].id : null;
      if (prevSelNodeRef.current !== nodeId) {
        prevSelNodeRef.current = nodeId;
        selectNode(nodeId);
      }

      // Only handle edge selection if NO nodes are selected
      if (selectedNodes.length === 0) {
        const edgeId = selectedEdges.length > 0 ? selectedEdges[0].id : null;
        if (prevSelEdgeRef.current !== edgeId) {
          prevSelEdgeRef.current = edgeId;
          selectEdge(edgeId);
        }
      }
    },
    [selectNode, selectEdge]
  );

  // Wrapper for onEdgesChange
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      storeOnEdgesChange(changes);
    },
    [storeOnEdgesChange]
  );

  // Canvas loading and error handling moved to page level to prevent double loading screens

  return (
    <div
      className="h-screen w-screen"
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* Undo/Redo Manager - tracks all node/edge changes */}
      <UndoRedoManager
        nodes={nodes}
        edges={edges}
        onNodesChange={(newNodes: ReactFlowNode[]) => {
          // During undo/redo, update only the changed slice
          useFlowStore.setState({ nodes: newNodes as AgenNode[] });
        }}
        onEdgesChange={(newEdges: ReactFlowEdge[]) => {
          // During undo/redo, update only the changed slice
          useFlowStore.setState({ edges: newEdges as AgenEdge[] });
        }}
        config={{
          maxHistorySize: 100,
          positionDebounceMs: 300,
          actionSeparatorMs: 1000,
          enableViewportTracking: false,
          enableCompression: true,
        }}
        onHistoryChange={(_path: HistoryNode[], _currentIndex: number) => {
          // History updated callback - silent
        }}
      />

      {/* Action Toolbar */}
      <ActionToolbar
        showHistoryPanel={showHistoryPanel}
        onToggleHistory={toggleHistoryPanel}
        className={`fixed z-50 ${
          inspectorViewMode === "side"
            ? "-translate-x-1/2 bottom-4 left-1/2 transform"
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
        updateNodeData={isReadOnly ? () => {} : updateNodeData}
        updateNodeId={isReadOnly ? () => {} : updateNodeId}
        logNodeError={
          logNodeError as (
            nodeId: string,
            message: string,
            type?: string,
            source?: string
          ) => void
        }
        clearNodeErrors={clearNodeErrors}
        onToggleHistory={toggleHistoryPanel}
        onDeleteNode={isReadOnly ? () => {} : removeNode}
        onDuplicateNode={() => {}}
        onDeleteEdge={isReadOnly ? () => {} : removeEdge}
        inspectorLocked={inspectorLocked}
        inspectorViewMode={inspectorViewMode}
        setInspectorLocked={setInspectorLocked}
        reactFlowHandlers={React.useMemo(() => {
          const noop = () => {};
          return {
            onNodesChange: isReadOnly
              ? noop
              : (onNodesChange as (changes: unknown[]) => void),
            onEdgesChange: isReadOnly
              ? noop
              : (onEdgesChange as (changes: unknown[]) => void),
            onConnect: isReadOnly ? noop : onConnect,
            onInit: noop,
            onSelectionChange: handleSelectionChange,
            onReconnect: handleReconnect,
            onReconnectStart: handleReconnectStart,
            onReconnectEnd: handleReconnectEnd,
          };
        }, [
          isReadOnly,
          onNodesChange,
          onEdgesChange,
          onConnect,
          handleSelectionChange,
          handleReconnect,
          handleReconnectStart,
          handleReconnectEnd,
        ])}
        isReadOnly={isReadOnly}
      />
      <Sidebar className="z-50" enableDebug={true} />
    </div>
  );
};

interface FlowEditorProps {
  flowMetadata?: FlowMetadata | null;
}

export default function FlowEditor({ flowMetadata = null }: FlowEditorProps) {
  return (
    <FlowEditorErrorBoundary>
      <FlowProvider initialFlow={flowMetadata}>
        <ReactFlowProvider>
          <UndoRedoProvider>
            <FlowEditorInternal />
          </UndoRedoProvider>
        </ReactFlowProvider>
      </FlowProvider>
    </FlowEditorErrorBoundary>
  );
}
