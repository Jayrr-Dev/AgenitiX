"use client";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { ReactFlowProvider, useReactFlow, reconnectEdge } from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";

import Sidebar from "@/features/business-logic-modern/infrastructure/sidebar/Sidebar";
import { useNodeStyleStore } from "../theming/stores/nodeStyleStore";
import { FlowCanvas } from "./components/FlowCanvas";

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
  } = useFlowStore();

  console.log("📊 Store data:", {
    nodesCount: nodes?.length || 0,
    edgesCount: edges?.length || 0,
    selectedNodeId,
    selectedEdgeId,
  });

  // Simple Alt+Q keyboard shortcut for deleting selected nodes
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Alt+Q is pressed
      if (event.altKey && event.key.toLowerCase() === "q") {
        event.preventDefault();

        // Find selected nodes and edges
        const selectedNodes = nodes.filter((node) => node.selected);
        const selectedEdges = edges.filter((edge) => edge.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) {
          console.log("⚠️ No nodes or edges selected to delete");
          return;
        }

        // Delete selected nodes
        selectedNodes.forEach((node) => {
          console.log(`🗑️ Deleting node: ${node.id} (Alt+Q)`);
          removeNode(node.id);
        });

        // Delete selected edges
        selectedEdges.forEach((edge) => {
          console.log(`🗑️ Deleting edge: ${edge.id} (Alt+Q)`);
          removeEdge(edge.id);
        });

        console.log(
          `✅ Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges (Alt+Q)`
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, removeNode, removeEdge]);

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
      } catch (error) {
        console.error("❌ Failed to create node from drop:", error);
      }
    },
    [screenToFlowPosition, addNode]
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
        <FlowEditorInternal />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
