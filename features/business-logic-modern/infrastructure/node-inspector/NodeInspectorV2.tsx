/**
 * NODE INSPECTOR V2 - Clean integration with Plop system
 *
 * • Complete integration with NodeInspectorAdapter for clean architecture
 * • Automatic control generation based on node data patterns
 * • Enhanced error handling and validation through adapter
 * • Backward compatible with existing node types
 * • Demonstrates best practices for the new system
 *
 * Keywords: plop-integration, adapter-pattern, clean-architecture, systematic
 */

"use client";

import React, { useCallback, useMemo } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";

import type { AgenNode, NodeType } from "../flow-engine/types/nodeData";
import { NodeInspectorAdapter } from "./adapters/NodeInspectorAdapter";
import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeHeader } from "./components/NodeHeader";
import { NodeOutput } from "./components/NodeOutput";
import { useInspectorState } from "./hooks/useInspectorState";
import { JsonHighlighter } from "./utils/JsonHighlighter";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface NodeInspectorV2Props {
  // Node and edge data
  nodes: AgenNode[];
  edges: any[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // Node operations
  updateNodeData: (
    nodeId: string,
    data: Partial<Record<string, unknown>>
  ) => void;
  updateNodeId: (oldId: string, newId: string) => boolean;
  removeNode: (nodeId: string) => void;
  addNode: (node: AgenNode) => void;
  selectNode: (nodeId: string) => void;
  removeEdge: (edgeId: string) => void;

  // Error handling
  logNodeError: (nodeId: string, message: string, type?: string) => void;
  clearNodeErrors: (nodeId: string) => void;
  useNodeErrors: (nodeId: string | null) => any[];

  // Output computation
  getNodeOutput: (
    node: AgenNode,
    nodes: AgenNode[],
    edges: any[]
  ) => string | null;

  // Inspector state
  inspectorLocked: boolean;
  setInspectorLocked: (locked: boolean) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const NodeInspectorV2: React.FC<NodeInspectorV2Props> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  updateNodeData,
  updateNodeId,
  removeNode,
  addNode,
  selectNode,
  removeEdge,
  logNodeError,
  clearNodeErrors,
  useNodeErrors,
  getNodeOutput,
  inspectorLocked,
  setInspectorLocked,
}) => {
  // ============================================================================
  // DERIVED STATE
  // ============================================================================

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
  }, [selectedNode, nodes, edges, getNodeOutput]);

  const inspectorState = useInspectorState(selectedNode);

  const combinedInspectorState = useMemo(
    () => ({
      ...inspectorState,
      locked: inspectorLocked,
      setLocked: setInspectorLocked,
    }),
    [inspectorState, inspectorLocked, setInspectorLocked]
  );

  // Get node information through adapter (reduces import churn)
  const nodeInfo = useMemo(() => {
    if (!selectedNode) return null;
    return NodeInspectorAdapter.getNodeInfo(selectedNode.type as NodeType);
  }, [selectedNode]);

  // Get node configuration errors through adapter
  const configurationErrors = useMemo(() => {
    if (!selectedNode) return [];
    return NodeInspectorAdapter.getNodeErrors(selectedNode);
  }, [selectedNode]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleUpdateNodeId = useCallback(
    (oldId: string, newId: string) => {
      const success = updateNodeId(oldId, newId);
      if (!success) {
        console.warn(
          `Failed to update node ID from "${oldId}" to "${newId}" - ID might already exist`
        );
        if (logNodeError) {
          logNodeError(
            oldId,
            `Failed to update node ID to "${newId}" - ID might already exist`,
            "warning"
          );
        }
      }
      return success;
    },
    [updateNodeId, logNodeError]
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

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderNodeInspector = () => {
    if (!selectedNode || !nodeInfo) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <div className="text-lg font-semibold text-infra-inspector-text-secondary">
            {selectedNode ? "Unknown Node Type" : "No Selection"}
          </div>
          <p className="text-sm text-infra-inspector-text-secondary mt-1">
            {selectedNode
              ? `Node type "${selectedNode.type}" is not recognized by the system.`
              : "Select a node or edge to inspect its properties."}
          </p>
          {selectedNode && (
            <div className="mt-3 p-2 bg-infra-inspector-hover rounded text-xs">
              <div className="font-medium mb-1">Debug Information:</div>
              <div>Node ID: {selectedNode.id}</div>
              <div>Node Type: {selectedNode.type}</div>
              <div>Registry Status: ❌ Not Found</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {/* Node Header */}
        <NodeHeader
          nodeId={selectedNode.id}
          displayName={nodeInfo.displayName}
          category={nodeInfo.category}
          icon={nodeInfo.icon}
          description={nodeInfo.description}
          onUpdateNodeId={handleUpdateNodeId}
          onDeleteNode={handleDeleteNode}
          onDuplicateNode={handleDuplicateNode}
          inspectorState={combinedInspectorState}
        />

        {/* Configuration Errors (if any) */}
        {configurationErrors.length > 0 && (
          <div className="p-3 bg-control-error rounded border-control-error">
            <div className="text-xs font-medium text-control-error-text mb-2">
              ⚠️ Configuration Issues
            </div>
            <div className="space-y-1">
              {configurationErrors.map((error, index) => (
                <div key={index} className="text-xs text-control-error-text">
                  • {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Node Controls */}
        <div>
          <h3 className="text-sm font-semibold text-infra-inspector-text-secondary mb-2">
            Configuration
          </h3>
          <NodeControls
            node={selectedNode}
            updateNodeData={updateNodeData}
            onLogError={logNodeError}
          />
        </div>

        {/* Live Output */}
        <div>
          <h3 className="text-sm font-semibold text-infra-inspector-text-secondary mb-2">
            Live Output
          </h3>
          <NodeOutput
            output={output}
            nodeType={selectedNode.type as NodeType}
          />
        </div>

        {/* Error Log */}
        <div>
          <h3 className="text-sm font-semibold text-infra-inspector-text-secondary mb-2">
            Error Log
          </h3>
          <ErrorLog errors={errors} onClearErrors={handleClearErrors} />
        </div>

        {/* Raw Data */}
        <div>
          <h3 className="text-sm font-semibold text-infra-inspector-text-secondary mb-2">
            Raw Data
          </h3>
          <div className="p-2 bg-infra-inspector-hover rounded-lg text-xs border border-infra-inspector">
            <JsonHighlighter data={selectedNode.data} />
          </div>
        </div>

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="p-3 bg-control-debug rounded border-control-input">
            <div className="text-xs font-medium text-control-input mb-2">
              🔧 Inspector Debug Information:
            </div>
            <div className="space-y-1 text-control-placeholder text-xs">
              <div>Node Type: {selectedNode.type}</div>
              <div>
                Registry Status: {nodeInfo.isValid ? "✅ Valid" : "❌ Invalid"}
              </div>
              <div>
                Has Controls: {nodeInfo.hasControls ? "✅ Yes" : "❌ No"}
              </div>
              <div>Category: {nodeInfo.category}</div>
              <div>Warnings: {nodeInfo.warnings.length}</div>
              <div>Config Errors: {configurationErrors.length}</div>
              <div>Runtime Errors: {errors.length}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (inspectorLocked) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-infra-inspector">
        <button
          type="button"
          aria-label="Unlock Inspector"
          title="Unlock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(false)}
          className="p-2 rounded-full bg-infra-inspector-hover text-infra-inspector-text hover:bg-infra-inspector-active"
        >
          <FaLockOpen />
        </button>
      </div>
    );
  }

  return (
    <div className="node-inspector flex flex-col h-full bg-infra-inspector text-infra-inspector-text border-l border-infra-inspector">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-infra-inspector">
        <h2 className="text-lg font-semibold">Inspector V2</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Search"
            title="Search (not implemented)"
            className="p-1 rounded hover:bg-infra-inspector-hover text-infra-inspector-text-secondary"
          >
            <FaSearch />
          </button>
          <button
            type="button"
            aria-label="Lock Inspector"
            title="Lock Inspector (Alt+A)"
            onClick={() => setInspectorLocked(true)}
            className="p-1 rounded hover:bg-infra-inspector-hover text-infra-inspector-text-secondary"
          >
            <FaLock />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {selectedNode ? (
          renderNodeInspector()
        ) : selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            allNodes={nodes}
            onDeleteEdge={handleDeleteEdge}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-lg font-semibold text-infra-inspector-text-secondary">
              No Selection
            </div>
            <p className="text-sm text-infra-inspector-text-secondary mt-1">
              Select a node or edge to inspect its properties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeInspectorV2;
