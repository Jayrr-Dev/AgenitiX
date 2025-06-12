/**
 * NODE INSPECTOR - Node property inspector and editor
 *
 * • Displays selected node/edge properties and data in an organized layout
 * • Provides interactive controls for editing node configuration
 * • Shows real-time output and error logging for debugging
 * • Integrates with our modern, `meta.json`-based node registry.
 *
 * Keywords: node-inspector, properties, editing, controls, output, errors, registry
 */

"use client";

import {
  useFlowStore,
  useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import React, { useCallback, useMemo } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";

import {
  getNodeMetadata,
  validateNode,
} from "../node-registry/modern-node-registry";

import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeHeader } from "./components/NodeHeader";
import { NodeOutput } from "./components/NodeOutput";
import { useInspectorState } from "./hooks/useInspectorState";
import { JsonHighlighter } from "./utils/JsonHighlighter";
import type { AgenNode, NodeType } from "../flow-engine/types/nodeData";

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

  const selectedNode = selectedNodeId
    ? nodes.find((n) => n.id === selectedNodeId) || null
    : null;
  const selectedEdge = selectedEdgeId
    ? edges.find((e) => e.id === selectedEdgeId) || null
    : null;

  const errors = useNodeErrors(selectedNodeId);

  const output = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeOutput(selectedNode, nodes, edges);
  }, [selectedNode, nodes, edges]);

  const inspectorState = useInspectorState(selectedNode);

  const combinedInspectorState = useMemo(
    () => ({
      ...inspectorState,
      locked: inspectorLocked,
      setLocked: setInspectorLocked,
    }),
    [inspectorState, inspectorLocked, setInspectorLocked]
  );

  const nodeMetadata = useMemo(() => {
    if (!selectedNode) return null;
    const metadata = getNodeMetadata(selectedNode.type as NodeType);
    const validation = validateNode(selectedNode.type as NodeType);
    if (!validation.isValid) {
      console.warn(
        `[NodeInspector] Invalid node type: ${selectedNode.type}`,
        validation.suggestions
      );
      return null;
    }
    return metadata;
  }, [selectedNode]);

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

      const newId = `node_${Date.now()}`;
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

      addNode(newNode);
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

  if (inspectorLocked) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-100 dark:bg-gray-800">
        <button
          type="button"
          aria-label="Unlock Inspector"
          title="Unlock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(false)}
          className="p-2 rounded-full bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <FaLockOpen />
        </button>
      </div>
    );
  }

  return (
    <div className="node-inspector flex flex-col h-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            title="Search (not implemented)"
            className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FaSearch />
          </button>
          <button
            type="button"
            aria-label="Lock Inspector"
            title="Lock Inspector (Alt+A)"
            onClick={() => setInspectorLocked(true)}
            className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <FaLock />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {selectedNode && nodeMetadata ? (
          <div className="flex flex-col gap-4">
            <NodeHeader
              nodeId={selectedNode.id}
              displayName={nodeMetadata.displayName}
              category={nodeMetadata.category}
              icon={nodeMetadata.icon}
              description={nodeMetadata.description}
              onUpdateNodeId={handleUpdateNodeId}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              inspectorState={combinedInspectorState}
            />

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Configuration
              </h3>
              <NodeControls
                node={selectedNode}
                metadata={nodeMetadata}
                updateNodeData={updateNodeData}
                onLogError={logNodeError as any}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Live Output
              </h3>
              <NodeOutput output={output} nodeType={selectedNode.type as NodeType} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Error Log
              </h3>
              <ErrorLog
                errors={errors}
                onClearErrors={handleClearErrors}
              />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                Raw Data
              </h3>
              <div className="p-2 bg-white dark:bg-gray-900 rounded-lg text-xs border border-gray-200 dark:border-gray-700">
                <JsonHighlighter data={selectedNode.data} />
              </div>
            </div>
          </div>
        ) : selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            allNodes={nodes}
            onDeleteEdge={handleDeleteEdge}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              No Selection
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">
              Select a node or edge to inspect its properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default NodeInspector;
