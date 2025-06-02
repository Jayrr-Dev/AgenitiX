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

// COMPONENT IMPORTS
import DebugTool from "@infrastructure/components/DebugTool";
import { UndoRedoProvider } from "@infrastructure/components/UndoRedoContext";
import UndoRedoManager, {
  ActionHistoryEntry,
} from "@infrastructure/components/UndoRedoManager";
import Sidebar, { SidebarRef } from "@infrastructure/sidebar/Sidebar";

// LOCAL COMPONENT IMPORTS
import { FlowCanvas } from "./components/FlowCanvas";
import { FlowEditorLoading } from "./components/FlowEditorLoading";
import { NodeDisplayProvider } from "./contexts/NodeDisplayContext";

// STORE IMPORTS
import { useFlowStore } from "@infrastructure/flow-engine/stores/flowStore";
import { useVibeModeStore } from "@infrastructure/node-creation/stores/vibeModeStore";

// HOOK IMPORTS
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

  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
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
  // MOUSE TRACKING FOR PASTE POSITIONING
  // ============================================================================

  useEffect(() => {
    return multiSelectionCopyPaste.installMouseTracking();
  }, [multiSelectionCopyPaste.installMouseTracking]);

  // ============================================================================
  // UNDO/REDO HANDLERS
  // ============================================================================

  const handleHistoryChange = useCallback(
    (history: ActionHistoryEntry[], currentIndex: number) => {
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
            debounceMs: 100, // Faster than default 300ms but not too aggressive
            enableAutoSave: true, // Re-enable for move/drag operations
            maxHistorySize: 150, // More history for better UX
            compressionThreshold: 75, // Compress less aggressively
          }}
        />

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
  // REGISTRY INITIALIZATION
  // ============================================================================

  useEffect(() => {
    const syncSuccess = syncNodeTypeConfigWithRegistry();
    if (!syncSuccess) {
      console.warn(
        "⚠️ [FlowEditor] Registry sync failed - some controls may not appear"
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
        <NodeDisplayProvider>
          <FlowEditorContent />
        </NodeDisplayProvider>
      </UndoRedoProvider>
    </ReactFlowProvider>
  );
}
