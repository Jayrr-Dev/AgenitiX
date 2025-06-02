/**
 * NODE INSPECTOR - Node property inspector and editor
 *
 * • Displays selected node/edge properties and data in an organized layout
 * • Provides interactive controls for editing node configuration
 * • Shows real-time output and error logging for debugging
 * • Supports node actions (duplicate, delete, rename) with keyboard shortcuts
 * • Integrates with Zustand store for state management and persistence
 *
 * Keywords: node-inspector, properties, editing, controls, output, errors
 */

"use client";

import { NODE_TYPE_CONFIG } from "@/features/business-logic-modern/infrastructure/flow-engine/constants";
import {
  useFlowStore,
  useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import React, { useCallback, useMemo } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";
import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeHeader } from "./components/NodeHeader";
import { NodeOutput } from "./components/NodeOutput";
import { useInspectorState } from "./hooks/useInspectorState";
import { JsonHighlighter } from "./utils/JsonHighlighter";

// ============================================================================
// REGISTRY INTEGRATION - Import registry for type safety
// ============================================================================

import type { NodeType } from "../flow-engine/types/nodeData";
import {
  MODERN_NODE_REGISTRY,
  getNodeMetadata,
  getRegistryStats,
  isValidNodeType,
} from "../node-creation/node-registry/nodeRegistry";

const NodeInspector = React.memo(function NodeInspector() {
  // ============================================================================
  // ZUSTAND STORE STATE
  // ============================================================================

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

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

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

  const inspectorState = useInspectorState(selectedNode);

  // Create combined inspector state with lock from store
  const combinedInspectorState = useMemo(
    () => ({
      ...inspectorState,
      locked: inspectorLocked,
      setLocked: setInspectorLocked,
    }),
    [inspectorState, inspectorLocked, setInspectorLocked]
  );

  // ============================================================================
  // REGISTRY-BASED VALIDATION AND DEBUGGING
  // ============================================================================

  // ENHANCED DEBUGGING - Using registry for validation
  const debugSelectedNode = useMemo(() => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.type as NodeType;
    const isValidType = isValidNodeType(nodeType);
    const registryEntry = getNodeMetadata(nodeType);
    const configEntry = NODE_TYPE_CONFIG[nodeType];

    // REGISTRY-VALIDATED DEBUGGING - Only debug valid nodes
    if (isValidType && registryEntry) {
      console.log(`🔍 [NodeInspector] REGISTRY-VALIDATED DEBUG ${nodeType}:`, {
        nodeType,
        isValidInRegistry: isValidType,
        registryMetadata: registryEntry,
        configEntry: configEntry,
        hasRegistryConfig: !!registryEntry,
        hasOutput: registryEntry.hasOutput,
        hasControls: registryEntry.hasControls,
        category: registryEntry.category,
        folder: registryEntry.folder,
      });

      // Show all valid registry entries for comparison
      const stats = getRegistryStats();
      console.log("🔍 [NodeInspector] REGISTRY STATS:", {
        totalNodes: stats.totalNodes,
        byCategory: stats.byCategory,
        byFolder: stats.byFolder,
        validNodeTypes: Object.keys(MODERN_NODE_REGISTRY),
      });

      return {
        nodeType,
        isValid: true,
        metadata: registryEntry,
        config: configEntry,
      };
    }

    // WARN FOR INVALID NODE TYPES
    console.warn(`⚠️ [NodeInspector] INVALID NODE TYPE: ${nodeType}`, {
      nodeType,
      isValidInRegistry: isValidType,
      availableTypes: Object.keys(MODERN_NODE_REGISTRY),
      selectedNodeData: selectedNode.data,
    });

    return {
      nodeType,
      isValid: false,
      metadata: null,
      config: null,
    };
  }, [selectedNode]);

  // ============================================================================
  // NODE ACTION HANDLERS
  // ============================================================================

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

  // ============================================================================
  // LOCKED STATE RENDER
  // ============================================================================

  // Early return for locked state
  if (inspectorLocked) {
    return (
      <div className="flex items-center justify-center h-5 w-4">
        <button
          type="button"
          aria-label="Unlock Inspector"
          title="Unlock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(false)}
          className="text-gray-400 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 dark:hover:text-orange-400 dark:text-gray-600 text-3xl p-2 rounded-full border border-transparent transition-colors"
        >
          <FaLock className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // ============================================================================
  // NODE INSPECTOR RENDER
  // ============================================================================

  // Show node inspector if node is selected (prioritize nodes over edges)
  if (selectedNode) {
    // REGISTRY-BASED CONFIG LOOKUP - Type-safe and validated
    const nodeType = selectedNode.type as NodeType;
    const nodeConfig = NODE_TYPE_CONFIG[nodeType];
    const registryMetadata = getNodeMetadata(nodeType);

    // Enhanced validation using registry
    const hasRightColumn = Boolean(
      nodeConfig?.hasOutput ||
        nodeConfig?.hasControls ||
        registryMetadata?.hasOutput ||
        registryMetadata?.hasControls
    );

    // REGISTRY-ENHANCED DEBUG INFO - Only for valid nodes
    if (debugSelectedNode?.isValid) {
      // Removed problematic node type checks
      // Now only logs for nodes that actually exist in the registry
    }

    return (
      <div id="node-info-container" className="flex gap-3">
        {/* COLUMN 1: NODE LABEL + NODE DATA */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          <NodeHeader
            node={selectedNode}
            onUpdateNodeId={handleUpdateNodeId}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            inspectorState={combinedInspectorState}
          />

          {/* Node Data */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Node Data:
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full">
              <JsonHighlighter
                data={selectedNode.data}
                className="w-full min-w-0 flex-1"
              />
            </div>
          </div>

          {/* REGISTRY VALIDATION INFO - Development only */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-gray-500 dark:text-gray-400 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border">
              <div className="font-mono">
                <div>
                  Type:{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    {nodeType}
                  </span>
                </div>
                <div>
                  Valid:{" "}
                  <span
                    className={
                      debugSelectedNode?.isValid
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {debugSelectedNode?.isValid ? "✓" : "✗"}
                  </span>
                </div>
                {registryMetadata && (
                  <>
                    <div>
                      Category:{" "}
                      <span className="text-purple-600 dark:text-purple-400">
                        {registryMetadata.category}
                      </span>
                    </div>
                    <div>
                      Folder:{" "}
                      <span className="text-orange-600 dark:text-orange-400">
                        {registryMetadata.folder}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* COLUMN 2: ACTION BUTTONS + OUTPUT + CONTROLS */}
        {hasRightColumn && (
          <div className="flex-1 flex flex-col gap-3 min-w-[100px]">
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              {/* Lock Button */}
              <button
                type="button"
                onClick={() => setInspectorLocked(!inspectorLocked)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
                type="button"
                onClick={() => handleDuplicateNode(selectedNode.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                title="Duplicate Node (Alt+W)"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Duplicate</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteNode(selectedNode.id)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                title="Delete Node (Alt+Q)"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <title>Delete</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>

            {(nodeConfig?.hasOutput || registryMetadata?.hasOutput) && (
              <NodeOutput output={output} nodeType={selectedNode.type} />
            )}

            {(nodeConfig?.hasControls || registryMetadata?.hasControls) && (
              <NodeControls
                node={selectedNode}
                updateNodeData={updateNodeData}
                onLogError={logNodeError}
                inspectorState={combinedInspectorState}
              />
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

  // ============================================================================
  // EDGE INSPECTOR RENDER
  // ============================================================================

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

  // ============================================================================
  // EMPTY STATE RENDER
  // ============================================================================

  // Show empty state if no node or edge selected
  return (
    <div className="flex items-center justify-center h-5 w-4">
      <button
        type="button"
        aria-label="Lock Inspector"
        title="Lock Inspector - Keep current view when selecting nodes"
        onClick={() => setInspectorLocked(true)}
        className="text-gray-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:text-gray-600 text-3xl p-2 rounded-full border border-transparent transition-colors"
      >
        <FaSearch className="w-5 h-5" />
      </button>
    </div>
  );
});

NodeInspector.displayName = "NodeInspector";

export default NodeInspector;

// ============================================================================
// TYPE EXPORTS - For backward compatibility
// ============================================================================

export type * from "./types";
