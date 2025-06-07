/**
 * FLOW CANVAS COMPONENT - Visual workflow editor
 *
 * • Interactive canvas for node-based workflow creation and editing
 * • Responsive UI adapting controls for mobile/desktop
 * • Node/edge selection, connection, deletion with keyboard shortcuts
 * • Integrated inspector panels, history tracking, action toolbars
 * • Drag & drop, multi-selection, real-time editing
 *
 * Keywords: ReactFlow, workflow-editor, nodes, edges, drag-drop, responsive
 */

import {
  Background,
  ColorMode,
  ConnectionMode,
  Controls,
  MiniMap,
  Panel,
  PanOnScrollMode,
  ReactFlow,
  SelectionMode,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";
import type { AgenEdge, AgenNode } from "../types/nodeData";

// Import other components - Using clean aliases
import ActionToolbar from "@/features/business-logic-modern/infrastructure/components/ActionToolbar";
import HistoryPanel from "@/features/business-logic-modern/infrastructure/components/HistoryPanel";
import NodeInspector from "@/features/business-logic-modern/infrastructure/node-inspector/NodeInspector";

// Import actual node components from node-domain
import {
  CreateText,
  CreateTextV2,
  TestError,
  TriggerOnToggle,
  ViewOutput,
} from "@/features/business-logic-modern/node-domain";

// Import multi-selection copy/paste hook

// CENTRALIZED JSON NODE REGISTRY - Using clean alias

// ULTIMATE TYPESAFE HANDLE SYSTEM - Connection prevention & cleanup
import { useCleanupInvalidConnections } from "@node-creation/node-handles/CleanupInvalidConnections";
import { useUltimateFlowConnectionPrevention } from "@node-creation/node-handles/UltimateTypesafeHandle";

interface FlowCanvasProps {
  nodes: AgenNode[];
  edges: AgenEdge[];
  selectedNode: AgenNode | null;
  selectedEdge: AgenEdge | null;
  selectedOutput: string | null;
  nodeErrors: Record<string, any[]>;
  showHistoryPanel: boolean;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  updateNodeId?: (oldId: string, newId: string) => void;
  logNodeError: (
    nodeId: string,
    message: string,
    type?: any,
    source?: string
  ) => void;
  clearNodeErrors: (nodeId: string) => void;
  onToggleHistory: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  inspectorLocked: boolean;
  setInspectorLocked: (locked: boolean) => void;
  reactFlowHandlers: {
    onReconnectStart: () => void;
    onReconnect: (oldEdge: any, newConn: any) => void;
    onReconnectEnd: (event: any, edge: any) => void;
    onConnect: (connection: any) => void;
    onNodesChange: (changes: any[]) => void;
    onEdgesChange: (changes: any[]) => void;
    onSelectionChange: (selection: any) => void;
    onInit: (instance: any) => void;
  };
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  selectedOutput,
  nodeErrors,
  showHistoryPanel,
  wrapperRef,
  updateNodeData,
  updateNodeId,
  logNodeError,
  clearNodeErrors,
  onToggleHistory,
  onDragOver,
  onDrop,
  onDeleteNode,
  onDuplicateNode,
  onDeleteEdge,
  inspectorLocked,
  setInspectorLocked,
  reactFlowHandlers,
}) => {
  const { resolvedTheme } = useTheme();

  // ============================================================================
  // ULTIMATE TYPESAFE HANDLE SYSTEM - Connection prevention
  // ============================================================================

  const { isValidConnection } = useUltimateFlowConnectionPrevention();

  // ============================================================================
  // CLEANUP INVALID CONNECTIONS - Remove existing invalid connections
  // ============================================================================

  useCleanupInvalidConnections();

  // ============================================================================
  // STATE FOR MOBILE RESPONSIVENESS & ERROR TRACKING
  // ============================================================================

  const [isMobile, setIsMobile] = useState(false);
  const [hasFilteredNodes, setHasFilteredNodes] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // ============================================================================
  // DEFENSIVE FILTERING - PREVENT UNDEFINED POSITION ERRORS
  // ============================================================================

  const safeNodes = useMemo(() => {
    const filteredNodes = nodes.filter((node) => {
      // Check if node is valid and has proper position
      if (!node || typeof node !== "object") {
        console.warn("🔍 [FlowCanvas] Filtered out invalid node:", node);
        return false;
      }

      if (
        !node.position ||
        typeof node.position.x !== "number" ||
        typeof node.position.y !== "number"
      ) {
        console.warn(
          "🔍 [FlowCanvas] Filtered out node with invalid position:",
          node
        );
        return false;
      }

      if (!node.id || !node.type) {
        console.warn(
          "🔍 [FlowCanvas] Filtered out node missing id or type:",
          node
        );
        return false;
      }

      return true;
    });

    // Log filtering results if any nodes were filtered
    if (filteredNodes.length !== nodes.length) {
      const filteredCount = nodes.length - filteredNodes.length;
      console.warn(
        `🔍 [FlowCanvas] Filtered ${filteredCount} invalid nodes. Kept ${filteredNodes.length} valid nodes.`
      );
      console.warn(
        "💡 If this error persists, you may need to reset your workspace."
      );
      setHasFilteredNodes(true);
    } else {
      setHasFilteredNodes(false);
    }

    return filteredNodes;
  }, [nodes]);

  // ============================================================================
  // DYNAMIC POSITIONING VARIABLES
  // ============================================================================

  const controlsPosition = isMobile ? "center-right" : "top-left";
  const controlsClassName = isMobile ? " translate-y-1/2 translate-x-1" : "";
  const deleteButtonPosition = isMobile ? "center-right" : "top-right";
  const deleteButtonStyle = isMobile
    ? { marginTop: "100px", marginRight: "14px" }
    : { marginTop: "70px" };

  // ============================================================================
  // NODE TYPES REGISTRY (CENTRALIZED) - JSON REGISTRY
  // ============================================================================

  const nodeTypes = useMemo(
    () => ({
      createText: CreateText,
      createTextV2: CreateTextV2,
      viewOutput: ViewOutput,
      triggerOnToggle: TriggerOnToggle,
      testError: TestError,
    }),
    []
  );

  const edgeTypes = useMemo(() => ({}), []);

  // ============================================================================
  // PLATFORM-SPECIFIC MULTI-SELECTION CONFIGURATION
  // ============================================================================

  const isMac = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return navigator.platform.toUpperCase().includes("MAC");
  }, []);

  // Configure selection keys based on ReactFlow documentation
  const selectionKeys = useMemo(
    () => ({
      // Allow drawing selection box with Shift key
      selectionKeyCode: "Shift",
      // Platform-specific multi-selection: Meta (Cmd) on Mac, Control on others
      // Also support Shift as alternative for both platforms
      multiSelectionKeyCode: [isMac ? "Meta" : "Control", "Shift"],
    }),
    [isMac]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1"
      onDragOver={onDragOver}
      onDrop={onDrop}
      style={{ touchAction: "none" }}
    >
      <ReactFlow
        nodes={safeNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        isValidConnection={isValidConnection}
        onReconnect={reactFlowHandlers.onReconnect}
        onReconnectStart={reactFlowHandlers.onReconnectStart}
        onReconnectEnd={reactFlowHandlers.onReconnectEnd}
        onConnect={reactFlowHandlers.onConnect}
        onNodesChange={reactFlowHandlers.onNodesChange}
        onEdgesChange={reactFlowHandlers.onEdgesChange}
        onSelectionChange={reactFlowHandlers.onSelectionChange}
        onInit={reactFlowHandlers.onInit}
        fitView
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Delete", "Backspace"]}
        selectionKeyCode={selectionKeys.selectionKeyCode}
        multiSelectionKeyCode={selectionKeys.multiSelectionKeyCode}
        colorMode={
          resolvedTheme === "dark" ? "dark" : ("light" satisfies ColorMode)
        }
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnDoubleClick={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        edgesReconnectable={true}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{
          type: "default",
          deletable: true,
          focusable: true,
          style: { strokeWidth: 2, stroke: "#3b82f6" },
        }}
      >
        {/* NODE INSPECTOR PANEL */}
        <Panel
          position="bottom-center"
          className="hidden md:block rounded bg-white/90 dark:bg-zinc-800/90 p-4 shadow max-w-4xl max-h-[250px] overflow-y-auto scrollbar-none"
        >
          <NodeInspector />
        </Panel>

        {/* MINIMAP */}
        <MiniMap position="bottom-left" className="hidden md:block" />

        {/* CONTROLS */}
        <Controls
          position={controlsPosition}
          showInteractive={false}
          className={controlsClassName}
        />

        {/* BACKGROUND */}
        <Background gap={12} size={1} color="#aaa" />

        {/* ACTION TOOLBAR */}
        <Panel position="top-right" className="m-2">
          <ActionToolbar
            showHistoryPanel={showHistoryPanel}
            onToggleHistory={onToggleHistory}
          />
        </Panel>

        {/* MOBILE DELETE BUTTON - Only visible on mobile when node or edge is selected */}
        {(selectedNode || selectedEdge) && (
          <Panel
            position={deleteButtonPosition}
            className={`md:hidden ${controlsClassName}`}
            style={deleteButtonStyle}
          >
            <button
              onClick={() => {
                if (selectedNode) {
                  onDeleteNode?.(selectedNode.id);
                } else if (selectedEdge) {
                  onDeleteEdge?.(selectedEdge.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
              title={
                selectedNode
                  ? `Delete ${selectedNode.data?.label || selectedNode.type} node`
                  : selectedEdge
                    ? `Delete connection`
                    : "Delete"
              }
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </Panel>
        )}

        {/* FLOATING HISTORY PANEL */}
        {showHistoryPanel && (
          <Panel
            position="top-right"
            className="mr-2"
            style={{ marginTop: "70px" }}
          >
            <div className="w-80 max-h-96">
              <HistoryPanel className="shadow-lg" />
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
