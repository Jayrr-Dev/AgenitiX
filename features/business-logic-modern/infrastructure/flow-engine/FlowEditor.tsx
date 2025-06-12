"use client";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { ReactFlowProvider } from "@xyflow/react";
import React, { useCallback, useEffect, useRef } from "react";

import Sidebar from "@/features/business-logic-modern/infrastructure/sidebar/Sidebar";
import { useNodeStyleStore } from "../theming/stores/nodeStyleStore";
import { FlowCanvas } from "./components/FlowCanvas";

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

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (typeof type === "undefined" || !type) return;

      const position = JSON.parse(
        event.dataTransfer.getData("application/reactflow-position")
      );
      const newNode: Partial<AgenNode> = {
        id: `${type}-${Math.random()}`,
        type: type as any,
        position,
        data: {} as any,
      };

      addNode(newNode as AgenNode);
    },
    [addNode]
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
          onReconnect: () => {},
          onReconnectStart: () => {},
          onReconnectEnd: () => {},
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
