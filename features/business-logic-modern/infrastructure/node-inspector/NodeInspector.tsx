/**
 * NODE INSPECTOR - Legacy-styled multi-column node property editor
 *
 * • Legacy multi-column layout with side-by-side panels
 * • Node data display with JSON highlighting
 * • Output and controls in dedicated right column
 * • Error log in separate column when errors exist
 * • Prominent duplicate and delete action buttons
 * • Maintains enterprise-grade backend safety with modern functionality
 *
 * Keywords: node-inspector, multi-column, legacy-style, json-highlighting, action-buttons
 */

"use client";

import {
  useFlowStore,
  useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import { Copy, Trash2 } from "lucide-react";
import React, { useCallback, useMemo } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";

import { NODE_TYPE_CONFIG } from "../flow-engine/constants";
import type { AgenNode, NodeType } from "../flow-engine/types/nodeData";
import { useComponentTheme } from "../theming/components";
import { NodeInspectorAdapter } from "./adapters/NodeInspectorAdapter";
import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeOutput } from "./components/NodeOutput";
import { JsonHighlighter } from "./utils/JsonHighlighter";

const NodeInspector = React.memo(function NodeInspector() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    inspectorLocked,
    setInspectorLocked,
    updateNodeData,
    updateNodeId,
    logNodeError,
    clearNodeErrors,
    removeNode,
    removeEdge,
    addNode,
    selectNode,
  } = useFlowStore();

  // Get theme for node inspector
  const theme = useComponentTheme("nodeInspector");

  // Get selected items
  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) || null
    : null;
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId) || null
    : null;

  // Always call useNodeErrors to avoid conditional hook usage
  const errors = useNodeErrors(selectedNodeId);

  // Get output for selected node
  const output = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeOutput(selectedNode, nodes, edges);
  }, [selectedNode, nodes, edges]);

  const nodeInfo = useMemo(() => {
    if (!selectedNode) return null;
    return NodeInspectorAdapter.getNodeInfo(selectedNode.type as NodeType);
  }, [selectedNode]);

  // Node action handlers
  const handleUpdateNodeId = useCallback(
    (oldId: string, newId: string) => {
      const success = updateNodeId(oldId, newId);
      if (!success) {
        console.warn(
          `Failed to update node ID from "${oldId}" to "${newId}" - ID might already exist`
        );
      }
      return success;
    },
    [updateNodeId]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      removeNode(nodeId);
    },
    [removeNode]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (!nodeToDuplicate) return;

      // Create a new node with a unique ID and offset position
      const newId = `${nodeId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const newNode = {
        ...nodeToDuplicate,
        id: newId,
        position: {
          x: nodeToDuplicate.position.x + 40,
          y: nodeToDuplicate.position.y + 40,
        },
        selected: false,
        data: { ...nodeToDuplicate.data },
      } as AgenNode;

      // Add the new node using the Zustand store
      addNode(newNode);

      // Select the new duplicated node
      selectNode(newId);
    },
    [nodes, addNode, selectNode]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      removeEdge(edgeId);
    },
    [removeEdge]
  );

  const handleClearErrors = useCallback(() => {
    if (selectedNodeId) {
      clearNodeErrors(selectedNodeId);
    }
  }, [selectedNodeId, clearNodeErrors]);

  // Early return for locked state
  if (inspectorLocked) {
    return (
      <div className="flex items-center justify-center w-12 h-12">
        <button
          aria-label="Unlock Inspector"
          title="Unlock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(false)}
          className="bg-infra-inspector-lock text-infra-inspector-lock hover:text-infra-inspector-locked hover:border-infra-inspector-locked border-1 p-2 rounded-full"
        >
          <FaLock className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Show node inspector if node is selected (prioritize nodes over edges)
  if (selectedNode && nodeInfo) {
    // Get node type config for hasOutput information
    const nodeConfig = selectedNode.type
      ? NODE_TYPE_CONFIG[selectedNode.type]
      : undefined;
    // Check if node has right column content (output or controls)
    const hasRightColumn = nodeConfig?.hasOutput || nodeInfo.hasControls;

    return (
      <div id="node-info-container" className="flex gap-3 p-4">
        {/* COLUMN 1: NODE HEADER + NODE DATA */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          {/* Node Header */}
          <div className="border-b border-infra-inspector-header pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {nodeInfo.icon && (
                  <span className="text-xl">{nodeInfo.icon}</span>
                )}
                <div>
                  <h3 className="text-sm font-semibold text-infra-inspector-header">
                    {nodeInfo.displayName}
                  </h3>
                  <div className="text-xs text-infra-inspector-header-secondary">
                    Type: {selectedNode.type}
                  </div>
                  <div className="text-xs text-infra-inspector-header-secondary">
                    ID: {selectedNode.id}
                  </div>
                </div>
              </div>
            </div>

            {nodeInfo.description && (
              <div className="bg-infra-inspector-data rounded-md border border-infra-inspector-data p-2 mt-2">
                <p className="text-xs text-infra-inspector-data">
                  {nodeInfo.description}
                </p>
              </div>
            )}
          </div>

          {/* Node Data */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <h4 className="text-xs font-medium text-infra-inspector-data mb-2">
              Node Data:
            </h4>
            <div className="bg-infra-inspector-data rounded-md border border-infra-inspector-data p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full">
              <JsonHighlighter
                data={selectedNode.data}
                className="w-full min-w-0 flex-1"
              />
            </div>
          </div>
        </div>

        {/* COLUMN 2: ACTION BUTTONS + OUTPUT + CONTROLS */}
        {hasRightColumn && (
          <div className="flex-1 flex flex-col gap-3 min-w-[100px]">
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              {/* Lock Button */}
              <button
                onClick={() => setInspectorLocked(!inspectorLocked)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-infra-inspector-lock border border-infra-inspector-lock text-infra-inspector-lock rounded hover:bg-infra-inspector-lock-hover hover:border-infra-inspector-button-hover transition-colors"
                title={
                  inspectorLocked
                    ? "Unlock Inspector (Alt+A)"
                    : "Lock Inspector (Alt+A)"
                }
              >
                {inspectorLocked ? (
                  <FaLock className="w-3 h-3" />
                ) : (
                  <FaLockOpen className="w-3 h-3" />
                )}
              </button>

              <button
                onClick={() => handleDuplicateNode(selectedNode.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-infra-inspector-duplicate border border-infra-inspector-duplicate text-infra-inspector-duplicate rounded hover:bg-infra-inspector-duplicate-hover transition-colors"
                title="Duplicate Node (Alt+W)"
              >
                <Copy className="w-3 h-3" />
              </button>

              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-infra-inspector-delete border border-infra-inspector-delete text-infra-inspector-delete rounded hover:bg-infra-inspector-delete-hover transition-colors"
                title="Delete Node (Alt+Q)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>

            {nodeConfig?.hasOutput && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-medium text-infra-inspector-data">
                  Output:
                </h4>
                <NodeOutput
                  output={output}
                  nodeType={selectedNode.type as NodeType}
                />
              </div>
            )}

            {nodeInfo.hasControls && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-medium text-infra-inspector-data">
                  Controls:
                </h4>
                <NodeControls
                  node={selectedNode}
                  updateNodeData={updateNodeData}
                  onLogError={logNodeError as any}
                />
              </div>
            )}
          </div>
        )}

        {/* COLUMN 3: ERROR LOG (only show when there are errors) */}
        {errors.length > 0 && (
          <div className="flex-1 flex flex-col gap-3">
            <ErrorLog errors={errors} onClearErrors={handleClearErrors} />
          </div>
        )}
      </div>
    );
  }

  // Show edge inspector if edge is selected (only when no node is selected)
  if (selectedEdge && nodes) {
    return (
      <div id="edge-info-container" className="flex gap-3">
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          <EdgeInspector
            edge={selectedEdge}
            allNodes={nodes}
            onDeleteEdge={handleDeleteEdge}
          />
        </div>
      </div>
    );
  }

  // Show empty state if no node or edge selected
  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-full">
      <button
        aria-label="Lock Inspector"
        title="Lock Inspector - Keep current view when selecting nodes"
        onClick={() => setInspectorLocked(true)}
        className="text-infra-inspector-secondary border border-transparent hover:border-infra-inspector-button-hover hover:text-infra-inspector-secondary-hover p-2 rounded-full"
      >
        <FaSearch className="w-5 h-5" />
      </button>
    </div>
  );
});

NodeInspector.displayName = "NodeInspector";

export default NodeInspector;
