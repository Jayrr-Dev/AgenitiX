"use client";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { ReactFlowProvider, useReactFlow, reconnectEdge } from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";

import Sidebar from "@/features/business-logic-modern/infrastructure/sidebar/Sidebar";
import { useNodeStyleStore } from "../theming/stores/nodeStyleStore";
import { FlowCanvas } from "./components/FlowCanvas";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useMultiSelectionCopyPaste } from "./hooks/useMultiSelectionCopyPaste";
import { UndoRedoProvider } from "../components/UndoRedoContext";
import UndoRedoManager from "../components/UndoRedoManager";
import { useUndoRedo } from "../components/UndoRedoContext";

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
        <div className="h-screen w-screen flex items-center justify-center bg-red-50 dark:bg-red-900">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-red-500 dark:text-red-300 mb-4">
              {this.state.error?.message || "Unknown error occurred"}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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

  console.log("🚀 FlowEditorInternal rendering...");

  // Initialize theme system on mount
  useEffect(() => {
    try {
      console.log("🎨 Initializing theme system...");
      // Enable category theming directly using the store
      const store = useNodeStyleStore.getState();
      store.enableCategoryTheming();
      console.log("✅ Theme system initialized");
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
    updateNodeData,
    updateNodeId,
    logNodeError,
    clearNodeErrors,
    toggleHistoryPanel,
    setInspectorLocked,
    removeNode,
    removeEdge,
    copySelectedNodes,
    pasteNodesAtPosition,
    clearSelection,
  } = useFlowStore();

  console.log("📊 Store data:", {
    nodesCount: nodes?.length || 0,
    edgesCount: edges?.length || 0,
    selectedNodeId,
    selectedEdgeId,
  });

  // ============================================================================
  // COPY/PASTE FUNCTIONALITY WITH MOUSE TRACKING
  // ============================================================================
  
  const { copySelectedElements, pasteElements, installMouseTracking } = useMultiSelectionCopyPaste();

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
    if (success) {
      console.log("↩️ Undo successful (Ctrl+Z)");
    } else {
      console.log("⚠️ Cannot undo - at beginning of history");
    }
  }, [undo]);

  const handleRedo = useCallback(() => {
    const success = redo();
    if (success) {
      console.log("↪️ Redo successful (Ctrl+Y)");
    } else {
      console.log("⚠️ Cannot redo - at end of history");
    }
  }, [redo]);

  // ============================================================================
  // KEYBOARD SHORTCUTS INTEGRATION
  // ============================================================================

  const handleSelectAllNodes = useCallback(() => {
    // Select all nodes in the canvas
    const updatedNodes = nodes.map(node => ({ ...node, selected: true }));
    useFlowStore.setState(state => ({ ...state, nodes: updatedNodes }));
    console.log(`✅ Selected all ${nodes.length} nodes (Ctrl+A)`);
  }, [nodes]);

  const handleClearSelection = useCallback(() => {
    clearSelection();
    console.log("✅ Cleared all selections (Esc)");
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
        nodeTypes: copiedNodes.map(n => n.type)
      });
    }
  }, [pasteElements, recordAction]);

  const handleMultiDelete = useCallback(() => {
    // Find selected nodes and edges
    const selectedNodes = nodes.filter((node) => node.selected);
    const selectedEdges = edges.filter((edge) => edge.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      console.log("⚠️ No nodes or edges selected to delete");
      return;
    }

    // Record the delete action for undo/redo
    if (selectedNodes.length > 0) {
      recordAction("node_delete", { 
        nodeCount: selectedNodes.length,
        nodeIds: selectedNodes.map(n => n.id)
      });
    }
    if (selectedEdges.length > 0) {
      recordAction("edge_delete", { 
        edgeCount: selectedEdges.length,
        edgeIds: selectedEdges.map(e => e.id)
      });
    }

    // Delete selected nodes
    selectedNodes.forEach((node) => {
      console.log(`🗑️ Deleting node: ${node.id} (Ctrl+Q)`);
      removeNode(node.id);
    });

    // Delete selected edges
    selectedEdges.forEach((edge) => {
      console.log(`🗑️ Deleting edge: ${edge.id} (Ctrl+Q)`);
      removeEdge(edge.id);
    });

    console.log(
      `✅ Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges (Ctrl+Q)`
    );
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
      console.log("🎨 Vibe mode toggle (Ctrl+X) - Not implemented yet");
    },
    onToggleInspectorLock: () => {
      setInspectorLocked(!inspectorLocked);
      console.log(`🔒 Inspector ${!inspectorLocked ? 'locked' : 'unlocked'} (Alt+A)`);
    },
    onDuplicateNode: () => {
      console.log("📋 Node duplication (Alt+W) - Not implemented yet");
    },
    onToggleSidebar: () => {
      console.log("📋 Sidebar toggle (Alt+S) - Not implemented yet");
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
          id: `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          type: nodeType as any,
          position,
          deletable: true,
          data: {
            ...defaultData,
            isActive: false, // Default state
          },
        } as AgenNode;

        console.log("✅ Creating node from drag and drop:", {
          type: nodeType,
          position,
          spec: spec.displayName,
        });

        addNode(newNode);
        
        // Record node creation for undo/redo
        recordAction("node_add", {
          nodeType: nodeType,
          nodeId: newNode.id,
          position: position
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

  console.log("🎯 About to render FlowCanvas...");

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

  return (
    <div
      className="h-screen w-screen bg-gray-100 dark:bg-gray-900"
      style={{ height: "100vh", width: "100vw" }}
    >
      {/* Undo/Redo Manager - tracks all node/edge changes */}
      <UndoRedoManager
        nodes={nodes}
        edges={edges}
        onNodesChange={(newNodes) => {
          // Convert from direct node array to ReactFlow change format
          useFlowStore.setState(state => ({ ...state, nodes: newNodes }));
        }}
        onEdgesChange={(newEdges) => {
          // Convert from direct edge array to ReactFlow change format
          useFlowStore.setState(state => ({ ...state, edges: newEdges }));
        }}
        config={{
          maxHistorySize: 100,
          positionDebounceMs: 300,
          actionSeparatorMs: 1000,
          enableViewportTracking: false,
          enableCompression: true,
        }}
        onHistoryChange={(path, currentIndex) => {
          console.log(`📚 History updated: ${path.length} entries, current: ${currentIndex}`);
        }}
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
        setInspectorLocked={setInspectorLocked}
        reactFlowHandlers={{
          onNodesChange,
          onEdgesChange,
          onConnect,
          onInit: () => {},
          onSelectionChange: () => {},
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
  console.log("🏁 FlowEditor main component rendering...");

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
