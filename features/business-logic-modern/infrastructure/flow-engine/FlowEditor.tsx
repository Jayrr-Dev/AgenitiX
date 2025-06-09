/**
 * FLOW EDITOR - Complete visual workflow editor application
 *
 * • Main orchestrator component for node-based workflow creation
 * • Integrates sidebar, canvas, inspector, history, and debug tools
 * • Handles state management with Zustand and ReactFlow providers
 * • Manages keyboard shortcuts, drag-drop, copy-paste functionality
 * • Provides undo-redo, multi-selection, and responsive design
 *
 * Keywords: ReactFlow, Zustand, workflow-editor, state-management, providers, keyboard-shortcuts
 */

"use client";

import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useRef, useState } from "react";

// VISUAL NODE BUILDER STYLES
import "../node-creation/systems/ui/visual-builder/VisualBuilder.css";

// COMPONENT IMPORTS
import DebugTool from "@infrastructure/components/DebugTool";
import { UndoRedoProvider } from "@infrastructure/components/UndoRedoContext";
import UndoRedoManager, {
  ActionEntry,
} from "@infrastructure/components/UndoRedoManager";
import Sidebar, { SidebarRef } from "@infrastructure/sidebar/Sidebar";

// LOCAL COMPONENT IMPORTS
import { FlowCanvas } from "./components/FlowCanvas";
import { FlowEditorLoading } from "./components/FlowEditorLoading";
import { NodeDisplayProvider } from "./contexts/NodeDisplayContext";

// VISUAL NODE BUILDER IMPORTS
import {
  VisualNodeBuilderProvider,
  useVisualNodeBuilder,
} from "../node-creation/systems/intergration/contexts/VisualNodeBuilderContext";
import { VisualNodeBuilder } from "../node-creation/systems/ui/visual-builder";

// STORE IMPORTS
import { useFlowStore } from "@infrastructure/flow-engine/stores/flowStore";
import { useVibeModeStore } from "../node-creation/systems/intergration/stores/vibeModeStore";

// HOOK IMPORTS
import { useUltraFastPropagation } from "@/hooks/useUltraFastPropagation";
import { useUndoRedo } from "../components/UndoRedoContext";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useErrorLogging } from "./hooks/useErrorLogging";
import { useFlowEditorHandlers } from "./hooks/useFlowEditorHandlers";
import { useKeyboardShortcutHandlers } from "./hooks/useKeyboardShortcutHandlers";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";
import { useReactFlowHandlers } from "./hooks/useReactFlowHandlers";

// TYPE IMPORTS
import type { Edge, Node } from "@xyflow/react";
import type { AgenEdge, AgenNode } from "./types/nodeData";
import { getNodeOutput } from "./utils/outputUtils";

// UTILITY IMPORTS
import { syncNodeTypeConfigWithRegistry } from "./constants";

// THEME INITIALIZATION IMPORT
import { initializeThemeSystem } from "@infrastructure/theming/init/themeInitializer";

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

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
  setInspectorLocked: (locked: boolean) => void;
}

// ============================================================================
// FLOW EDITOR CONTENT COMPONENT
// ============================================================================

/**
 * FlowEditorContent - Main flow editor logic within ReactFlow context
 *
 * This component orchestrates all the flow editor functionality using
 * custom hooks for better separation of concerns and maintainability.
 */
function FlowEditorContent() {
  // ============================================================================
  // REFS
  // ============================================================================

  const wrapperRef = useRef<HTMLDivElement>(null);
  const flowInstanceRef = useRef<any>(null);
  const sidebarRef = useRef<SidebarRef>(null);

  // ============================================================================
  // ZUSTAND STORE STATE
  // ============================================================================

  const {
    // State
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    showHistoryPanel,
    inspectorLocked,
    nodeErrors,

    // Actions
    updateNodeData,
    addNode,
    removeNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    selectNode,
    selectEdge,
    clearSelection,
    toggleHistoryPanel,
    setInspectorLocked,
    logNodeError,
    clearNodeErrors,
    copySelectedNodes,
    pasteNodes,
    setNodes,
    setEdges,
    forceReset,
  } = useFlowStore();

  // ============================================================================
  // LOCAL STATE
  // ============================================================================

  const [actionHistory, setActionHistory] = useState<ActionEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // ZUSTAND ACTIONS OBJECT
  // ============================================================================

  const zustandActions: ZustandActions = {
    setNodes,
    setEdges,
    updateNodePosition,
    removeNode,
    removeEdge,
    selectNode,
    selectEdge,
    clearSelection,
    addNode,
    setInspectorLocked,
  };

  // ============================================================================
  // CUSTOM HOOKS
  // ============================================================================

  // Flow editor handlers
  const flowHandlers = useFlowEditorHandlers({
    nodes,
    edges,
    flowInstanceRef,
    zustandActions,
  });

  // Keyboard shortcut handlers
  const keyboardHandlers = useKeyboardShortcutHandlers({
    nodes,
    edges,
    sidebarRef,
    zustandActions,
    inspectorLocked,
  });

  // Multi-selection copy/paste functionality
  const multiSelectionCopyPaste = useMultiSelectionCopyPaste();

  // Drag and drop functionality with action recording
  const { recordAction } = useUndoRedo();

  // Enhanced addNode with action recording
  const addNodeWithHistory = useCallback(
    (node: AgenNode) => {
      console.log("🎯 [FlowEditor] Adding node:", node.id);

      // Add the node first (this updates Zustand state)
      addNode(node);

      // Record action after state is updated (proper flow)
      console.log("📝 [FlowEditor] Recording node_add action");
      recordAction("node_add", {
        nodeId: node.id,
        nodeType: node.type,
        nodeLabel: node.data?.label || node.type,
        position: node.position,
      });
    },
    [addNode, recordAction]
  );

  // Enhanced removeEdge with action recording
  const removeEdgeWithHistory = useCallback(
    (edgeId: string) => {
      const edgeToDelete = edges.find((e) => e.id === edgeId);
      if (!edgeToDelete) return;

      // Record action metadata before removal
      const edgeMetadata = {
        edgeId,
        sourceNode: edgeToDelete.source,
        targetNode: edgeToDelete.target,
        sourceHandle: edgeToDelete.sourceHandle,
        targetHandle: edgeToDelete.targetHandle,
      };

      // Remove edge first (this updates Zustand state)
      removeEdge(edgeId);

      // Record action after state is updated (proper flow)
      recordAction("edge_delete", edgeMetadata);
    },
    [edges, removeEdge, recordAction]
  );

  // Drag and drop functionality
  const dragAndDrop = useDragAndDrop({
    flowInstance: flowInstanceRef,
    wrapperRef,
    onNodeAdd: addNodeWithHistory,
  });

  // Error logging setup
  useErrorLogging({ selectedNodeId, logNodeError });

  // ============================================================================
  // ULTRA FAST PROPAGATION INTEGRATION 🚀
  // ============================================================================

  const {
    propagateUltraFast,
    activateNode,
    deactivateNode,
    forceDeactivate,
    getNodeState,
    enableGPUAcceleration,
    isNodeActive,
    isNodeInactive,
    isNodePending,
  } = useUltraFastPropagation(nodes, edges as any, updateNodeData);

  // Make propagation methods globally accessible for nodes
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).ufpePropagation = {
        propagateUltraFast,
        activateNode,
        deactivateNode,
        forceDeactivate,
        getNodeState,
        isNodeActive,
        isNodeInactive,
        isNodePending,
      };
    }
  }, [
    propagateUltraFast,
    activateNode,
    deactivateNode,
    forceDeactivate,
    getNodeState,
    isNodeActive,
    isNodeInactive,
    isNodePending,
  ]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) || null
    : null;
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId) || null
    : null;
  const selectedOutput = selectedNode
    ? getNodeOutput(selectedNode, nodes, edges)
    : null;

  // ============================================================================
  // VIBE MODE
  // ============================================================================

  const { toggleVibeMode } = useVibeModeStore();

  // ============================================================================
  // REACTFLOW HANDLERS SETUP
  // ============================================================================

  // Wrapper functions for ReactFlow handlers
  const setNodesWrapper = useCallback(
    (nodesOrFn: AgenNode[] | ((prev: AgenNode[]) => AgenNode[])) => {
      if (typeof nodesOrFn === "function") {
        setNodes(nodesOrFn(nodes));
      } else {
        setNodes(nodesOrFn);
      }
    },
    [nodes, setNodes]
  );

  const setEdgesWrapper = useCallback(
    (edgesOrFn: AgenEdge[] | ((prev: AgenEdge[]) => AgenEdge[])) => {
      if (typeof edgesOrFn === "function") {
        setEdges(edgesOrFn(edges));
      } else {
        setEdges(edgesOrFn);
      }
    },
    [edges, setEdges]
  );

  // Get color-coded connection handlers
  const {
    onConnect: colorCodedOnConnect,
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
  } = useReactFlowHandlers({
    nodes,
    edges,
    setNodes: setNodesWrapper,
    setEdges: setEdgesWrapper,
    onSelectionChange: selectNode,
    onEdgeSelectionChange: selectEdge,
  });

  // Combine handlers for FlowCanvas
  const reactFlowHandlers = {
    onConnect: colorCodedOnConnect,
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
    onNodesChange: flowHandlers.handleNodesChange,
    onEdgesChange: flowHandlers.handleEdgesChange,
    onSelectionChange: flowHandlers.handleSelectionChange,
    onInit: flowHandlers.handleInit,
  };

  // ============================================================================
  // VISUAL NODE BUILDER INTEGRATION
  // ============================================================================

  const { isVisible: isBuilderVisible, toggleBuilder } = useVisualNodeBuilder();

  // ============================================================================
  // KEYBOARD SHORTCUTS SETUP
  // ============================================================================

  useKeyboardShortcuts({
    onCopy: multiSelectionCopyPaste.copySelectedElements,
    onPaste: multiSelectionCopyPaste.pasteElements,
    onDelete: keyboardHandlers.handleMultiDelete,
    onToggleHistory: toggleHistoryPanel,
    onToggleVibeMode: toggleVibeMode,
    onToggleInspectorLock: keyboardHandlers.handleToggleInspectorLock,
    onDuplicateNode: keyboardHandlers.handleDuplicateSelectedNode,
    onToggleSidebar: keyboardHandlers.handleToggleSidebar,
    onSelectAll: keyboardHandlers.handleSelectAllNodes,
    onClearSelection: keyboardHandlers.handleClearSelection,
  });

  // ============================================================================
  // KEYBOARD SHORTCUT FOR DEV BUILDER (Ctrl/Cmd + B)
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "b" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        event.preventDefault();
        toggleBuilder();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleBuilder]);

  // ============================================================================
  // MOUSE TRACKING FOR PASTE POSITIONING
  // ============================================================================

  useEffect(() => {
    return multiSelectionCopyPaste.installMouseTracking();
  }, [multiSelectionCopyPaste.installMouseTracking]);

  // ============================================================================
  // UNDO/REDO HANDLERS
  // ============================================================================

  const handleHistoryChange = useCallback(
    (history: ActionEntry[], currentIndex: number) => {
      // Update local state so HistoryPanel can display the history
      setActionHistory(history);
      setHistoryIndex(currentIndex);
    },
    []
  );

  const handleNodesChangeWithHistory = useCallback(
    (newNodes: Node[]) => {
      setNodes(newNodes as AgenNode[]);
    },
    [setNodes]
  );

  const handleEdgesChangeWithHistory = useCallback(
    (newEdges: Edge[]) => {
      setEdges(newEdges as AgenEdge[]);
    },
    [setEdges]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* SIDEBAR */}
      <Sidebar ref={sidebarRef} />

      {/* DEBUG TOOLS */}
      <DebugTool />

      {/* DEV ONLY - VISUAL NODE BUILDER OVERLAY */}
      {isBuilderVisible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-[95vw] h-[95vh] relative">
            {/* Builder Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                🛠️ Visual Node Builder (Dev Only)
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Press Ctrl+B to toggle
                </span>
                <button
                  onClick={toggleBuilder}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Close Builder"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Builder Content */}
            <div className="h-[calc(100%-4rem)]">
              <VisualNodeBuilder
                className="w-full h-full"
                onSave={(nodeConfig) => {
                  console.log(
                    "🎯 [Dev Builder] Generated node config:",
                    nodeConfig
                  );
                  // You can add logic here to automatically register the node
                }}
                onPreview={(visualConfig) => {
                  console.log("👁️ [Dev Builder] Preview node:", visualConfig);
                }}
                onValidate={(nodeConfig) => {
                  // Basic validation
                  const errors: string[] = [];
                  const warnings: string[] = [];

                  if (!nodeConfig.nodeType) {
                    errors.push("Node type is required");
                  }

                  if (!nodeConfig.displayName) {
                    errors.push("Display name is required");
                  }

                  if (nodeConfig.handles.length === 0) {
                    warnings.push("Node has no input/output handles");
                  }

                  return { errors, warnings };
                }}
                config={{
                  theme: "auto",
                  enableRealTimePreview: true,
                  enableAutoSave: true,
                  showGrid: true,
                  snapToGrid: true,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* UNDO/REDO TOOLBAR */}
        <UndoRedoManager
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChangeWithHistory}
          onEdgesChange={handleEdgesChangeWithHistory}
          onHistoryChange={handleHistoryChange}
          config={{
            positionDebounceMs: 300, // Better debouncing for movements
            actionSeparatorMs: 200, // Proper separation between distinct actions
            maxHistorySize: 100, // Reasonable history size
            enableCompression: true, // Enable automatic compression
            enableViewportTracking: false, // Disable for better performance
          }}
        />

        {/* DEV BUILDER TOGGLE BUTTON - Floating Action Button */}
        <button
          onClick={toggleBuilder}
          className="fixed bottom-6 right-6 z-40 bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
          title="Toggle Visual Node Builder (Ctrl+B)"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
            />
          </svg>
          <span className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Dev Builder
          </span>
        </button>

        {/* FLOW CANVAS */}
        <FlowCanvas
          nodes={nodes}
          edges={edges}
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          selectedOutput={selectedOutput}
          nodeErrors={nodeErrors}
          showHistoryPanel={showHistoryPanel}
          wrapperRef={wrapperRef}
          updateNodeData={updateNodeData}
          updateNodeId={flowHandlers.handleUpdateNodeId}
          logNodeError={logNodeError}
          clearNodeErrors={clearNodeErrors}
          onToggleHistory={toggleHistoryPanel}
          onDragOver={dragAndDrop.onDragOver}
          onDrop={dragAndDrop.onDrop}
          onDeleteNode={flowHandlers.handleDeleteNode}
          onDuplicateNode={flowHandlers.handleDuplicateNode}
          onDeleteEdge={removeEdgeWithHistory}
          inspectorLocked={inspectorLocked}
          setInspectorLocked={setInspectorLocked}
          reactFlowHandlers={reactFlowHandlers}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FLOW EDITOR COMPONENT
// ============================================================================

/**
 * FlowEditor - Main component for the visual flow editor
 *
 * Refactored to use Zustand for state management and modular architecture
 * for better maintainability and performance.
 */
export default function FlowEditor() {
  // ============================================================================
  // MOUNT STATE AND HYDRATION
  // ============================================================================

  const [mounted, setMounted] = useState(false);
  const { _hasHydrated } = useFlowStore();

  // ============================================================================
  // JSON REGISTRY INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const syncSuccess = syncNodeTypeConfigWithRegistry();
    if (!syncSuccess) {
      console.warn(
        "⚠️ [FlowEditor] JSON Registry sync failed - some controls may not appear"
      );
    }

    // Initialize theme system with category colors
    const themeSuccess = initializeThemeSystem({
      enableDebug: false, // Set to true for debugging
      logStatistics: true,
    });

    if (!themeSuccess) {
      console.warn(
        "⚠️ [FlowEditor] Theme system initialization failed - nodes may appear with default colors"
      );
    }
  }, []);

  // ============================================================================
  // MOUNT EFFECT
  // ============================================================================

  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================================
  // EARLY RETURN FOR LOADING STATE
  // ============================================================================

  if (!mounted || !_hasHydrated) {
    return <FlowEditorLoading mounted={mounted} hasHydrated={_hasHydrated} />;
  }

  // ============================================================================
  // RENDER MAIN FLOW EDITOR
  // ============================================================================

  return (
    <ReactFlowProvider>
      <UndoRedoProvider>
        <VisualNodeBuilderProvider>
          <NodeDisplayProvider>
            <FlowEditorContent />
          </NodeDisplayProvider>
        </VisualNodeBuilderProvider>
      </UndoRedoProvider>
    </ReactFlowProvider>
  );
}
