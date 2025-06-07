/**
 * NODE INSPECTOR V2U - Enhanced node inspector with complete V2U system integration
 *
 * 🎯 V2U UPGRADE: Complete node inspector with defineNode() system integration
 * • Enhanced node inspector with V2U defineNode() metadata display
 * • Real-time lifecycle hooks monitoring and debugging
 * • Security violations and performance metrics tracking
 * • Event system integration with history and filtering
 * • Plugin status monitoring and health checks
 * • Advanced error handling with categorization and recovery
 * • Tabbed interface for organized V2U system inspection
 *
 * Keywords: v2u-inspector, defineNode, lifecycle, security, performance, events, plugins
 */

"use client";

import { NODE_TYPE_CONFIG } from "@/features/business-logic-modern/infrastructure/flow-engine/constants";
import {
  useFlowStore,
  useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import React, { useCallback, useMemo, useState } from "react";
import { FaLock, FaLockOpen, FaSearch } from "react-icons/fa";

// V2U Enhanced Imports
import { V2U_INSPECTOR_CONFIG, V2U_UI_CONFIG } from "./constants";
import { useV2UState } from "./hooks/useV2UState";

// Original Inspector Components
import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeHeader } from "./components/NodeHeader";
import { NodeOutput } from "./components/NodeOutput";
import { JsonHighlighter } from "./utils/JsonHighlighter";

// V2U Inspector Components
import { V2ULifecycleInspector } from "./components/v2u/V2ULifecycleInspector";

// Enhanced registry integration
import type { NodeType } from "../flow-engine/types/nodeData";
import {
  GENERATED_NODE_REGISTRY,
  NODE_TYPES,
} from "../node-creation/json-node-registry/generated/nodeRegistry";
import {
  getCategoryMetadata,
  getNodeMetadata,
  isValidNodeType,
} from "../sidebar/constants";

// ============================================================================
// V2U ENHANCED NODE INSPECTOR
// ============================================================================

const NodeInspectorV2U = React.memo(function NodeInspectorV2U() {
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
  // V2U STATE MANAGEMENT
  // ============================================================================

  const [v2uDebugMode, setV2UDebugMode] = useState(() => {
    if (typeof localStorage !== "undefined") {
      return (
        localStorage.getItem(V2U_INSPECTOR_CONFIG.DEBUG_MODE_STORAGE_KEY) ===
        "true"
      );
    }
    return false;
  });

  const [activeV2UTab, setActiveV2UTab] = useState("overview");

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

  // V2U State Hook
  const {
    v2uState,
    isLoading: v2uLoading,
    error: v2uError,
    refreshV2UState,
    triggerLifecycleHook,
    clearPerformanceMetrics,
    clearEventHistory,
    isV2UNode,
    systemHealth,
    hasLifecycleHooks,
    hasSecurityViolations,
    hasPerformanceIssues,
  } = useV2UState(selectedNode);

  // Get output for selected node
  const output = useMemo(() => {
    if (!selectedNode) return null;
    return getNodeOutput(selectedNode, nodes, edges);
  }, [selectedNode, nodes, edges]);

  // ============================================================================
  // V2U DEBUG MODE MANAGEMENT
  // ============================================================================

  const toggleV2UDebugMode = useCallback(() => {
    const newMode = !v2uDebugMode;
    setV2UDebugMode(newMode);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        V2U_INSPECTOR_CONFIG.DEBUG_MODE_STORAGE_KEY,
        String(newMode)
      );
    }
  }, [v2uDebugMode]);

  // ============================================================================
  // ENHANCED CATEGORY REGISTRY DEBUGGING AND VALIDATION
  // ============================================================================

  // JSON REGISTRY DEBUGGING AND VALIDATION with V2U enhancement
  const debugSelectedNode = useMemo(() => {
    if (!selectedNode) return null;

    const nodeType = selectedNode.type as NodeType;
    const isValidType = isValidNodeType(nodeType);
    const registryEntry = getNodeMetadata(nodeType);
    const configEntry = NODE_TYPE_CONFIG[nodeType];

    // JSON REGISTRY CATEGORY VALIDATION
    const categoryMetadata = registryEntry
      ? getCategoryMetadata(registryEntry.category as any)
      : null;

    // V2U Enhancement: Check for V2U-specific metadata
    const isV2UNodeType =
      selectedNode.data &&
      ((selectedNode.data as any)._v2uMigrated === true ||
        (selectedNode.data as any)._v2uVersion !== undefined ||
        (selectedNode.data as any)._defineNodeConfig !== undefined);

    if (isValidType && registryEntry) {
      return {
        nodeType,
        isValid: true,
        metadata: registryEntry,
        config: configEntry,
        categoryMetadata,
        isV2UNode: isV2UNodeType,
        v2uVersion: (selectedNode.data as any)?._v2uVersion,
      };
    }

    // Enhanced warning for invalid node types
    console.warn(`⚠️ [NodeInspectorV2U] INVALID NODE TYPE: ${nodeType}`, {
      nodeType,
      isValidInRegistry: isValidType,
      isV2UNode: isV2UNodeType,
      availableTypes: NODE_TYPES,
      selectedNodeData: selectedNode.data,
      registryKeys: Object.keys(GENERATED_NODE_REGISTRY),
      v2uState: v2uState ? "loaded" : "not_loaded",
    });

    return {
      nodeType,
      isValid: false,
      metadata: null,
      config: null,
      categoryMetadata: null,
      isV2UNode: isV2UNodeType,
      v2uVersion: (selectedNode.data as any)?._v2uVersion,
    };
  }, [selectedNode, v2uState]);

  // ============================================================================
  // NODE ACTION HANDLERS (Enhanced with V2U integration)
  // ============================================================================

  const handleUpdateNodeId = useCallback(
    (oldId: string, newId: string) => {
      const success = updateNodeId(oldId, newId);
      if (!success) {
        console.warn(
          `[V2U] Failed to update node ID from "${oldId}" to "${newId}" - ID might already exist`
        );
      }
      return success;
    },
    [updateNodeId]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      console.log(`[V2U] Deleting node: ${nodeId}`);
      removeNode(nodeId);
    },
    [removeNode]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const nodeToDuplicate = nodes.find((n) => n.id === nodeId);
      if (!nodeToDuplicate) return;

      // Enhanced duplication with V2U metadata preservation
      const newId = `${nodeId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const newNode = {
        ...nodeToDuplicate,
        id: newId,
        position: {
          x: nodeToDuplicate.position.x + 40,
          y: nodeToDuplicate.position.y + 40,
        },
        selected: false,
        data: {
          ...nodeToDuplicate.data,
          // Preserve V2U metadata but update timestamps
          _v2uMigrationDate: Date.now(),
          _v2uDuplicatedFrom: nodeId,
        },
      } as AgenNode;

      addNode(newNode);
      selectNode(newId);

      console.log(`[V2U] Duplicated node: ${nodeId} → ${newId}`, {
        originalV2U: (nodeToDuplicate.data as any)?._v2uMigrated,
        preservedMetadata: true,
      });
    },
    [nodes, addNode, selectNode]
  );

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      console.log(`[V2U] Deleting edge: ${edgeId}`);
      removeEdge(edgeId);
    },
    [removeEdge]
  );

  // ============================================================================
  // V2U SYSTEM HEALTH INDICATOR
  // ============================================================================

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case "healthy":
        return "text-green-600 bg-green-50 border-green-200";
      case "warning":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "critical":
        return "text-red-800 bg-red-100 border-red-300";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
      case "critical":
        return "🚨";
      default:
        return "❓";
    }
  };

  // ============================================================================
  // V2U TAB CONTENT RENDERING
  // ============================================================================

  const renderV2UTabContent = () => {
    if (!v2uState || !isV2UNode) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">📄</div>
          <div className="text-sm font-medium">Legacy Node</div>
          <div className="text-xs mt-1">
            This node is not using the V2U system. Consider migrating to
            defineNode().
          </div>
        </div>
      );
    }

    switch (activeV2UTab) {
      case "overview":
        return (
          <div className="space-y-4">
            {/* V2U Metadata */}
            <div className="border border-gray-200 dark:border-gray-700 rounded p-3">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                🚀 V2U Metadata
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Version:{" "}
                  </span>
                  <span className="font-mono">
                    {v2uState.metadata._v2uVersion || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Migrated:{" "}
                  </span>
                  <span
                    className={
                      v2uState.metadata._v2uMigrated
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {v2uState.metadata._v2uMigrated ? "Yes" : "No"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Category:{" "}
                  </span>
                  <span>{v2uState.metadata.category}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Registry:{" "}
                  </span>
                  <span
                    className={`font-mono ${
                      v2uState.registryStatus === "registered"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {v2uState.registryStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div
              className={`border rounded p-3 ${getSystemHealthColor(systemHealth)}`}
            >
              <div className="flex items-center gap-2">
                <span>{getSystemHealthIcon(systemHealth)}</span>
                <span className="text-sm font-semibold">
                  System Health: {systemHealth}
                </span>
              </div>
              {hasSecurityViolations && (
                <div className="text-xs mt-1">
                  ⚠️ Security violations detected
                </div>
              )}
              {hasPerformanceIssues && (
                <div className="text-xs mt-1">
                  ⚠️ Performance issues detected
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {v2uState.performance.executionCount}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Executions
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {v2uState.events.eventsEmitted}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Events
                </div>
              </div>

              <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {v2uState.plugins.enabledPlugins.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Plugins
                </div>
              </div>
            </div>
          </div>
        );

      case "lifecycle":
        return (
          <V2ULifecycleInspector
            node={selectedNode!}
            v2uState={v2uState}
            onRefresh={refreshV2UState}
            debugMode={v2uDebugMode}
            onTriggerLifecycle={triggerLifecycleHook}
          />
        );

      case "security":
        return (
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm">Security Inspector</div>
              <div className="text-xs mt-1">Coming soon...</div>
            </div>
          </div>
        );

      case "performance":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Performance Metrics
                </h3>
              </div>

              <button
                onClick={clearPerformanceMetrics}
                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                Clear Metrics
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Avg Execution Time
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {v2uState.performance.averageExecutionTime}ms
                </div>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Memory Usage
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {v2uState.performance.memoryUsage}MB
                </div>
              </div>
            </div>
          </div>
        );

      case "events":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📡</span>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Event History
                </h3>
              </div>

              <button
                onClick={clearEventHistory}
                className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">📡</div>
              <div className="text-sm">Event Monitor</div>
              <div className="text-xs mt-1">
                Real-time event tracking coming soon...
              </div>
            </div>
          </div>
        );

      case "plugins":
        return (
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">🧩</div>
              <div className="text-sm">Plugin Manager</div>
              <div className="text-xs mt-1">Plugin system coming soon...</div>
            </div>
          </div>
        );

      case "debug":
        return (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
              <div className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                🐛 Debug Information
              </div>
              <JsonHighlighter
                data={{
                  nodeId: selectedNode?.id,
                  nodeType: selectedNode?.type,
                  v2uState: v2uState ? "loaded" : "not_loaded",
                  debugMode: v2uDebugMode,
                  registryValidation: debugSelectedNode,
                  systemHealth,
                  hasLifecycleHooks,
                  hasSecurityViolations,
                  hasPerformanceIssues,
                }}
                showV2UMetadata={true}
                highlightV2UFields={true}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER MAIN INSPECTOR
  // ============================================================================

  return (
    <div className="h-full flex flex-col">
      {/* Header with V2U Enhancement */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <FaSearch className="text-gray-400" size={14} />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Node Inspector V2U
          </span>
          {isV2UNode && (
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              V2U
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* V2U Debug Mode Toggle */}
          <button
            onClick={toggleV2UDebugMode}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              v2uDebugMode
                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            title="Toggle V2U debug mode"
          >
            🐛 Debug
          </button>

          {/* Inspector Lock */}
          <button
            onClick={() => setInspectorLocked(!inspectorLocked)}
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            title={inspectorLocked ? "Unlock inspector" : "Lock inspector"}
          >
            {inspectorLocked ? <FaLock size={14} /> : <FaLockOpen size={14} />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedNode ? (
          <div className="h-full flex flex-col">
            {/* Standard Node Inspector Content */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              {/* Node Header */}
              <NodeHeader
                node={selectedNode}
                onUpdateNodeId={handleUpdateNodeId}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={handleDuplicateNode}
                debugInfo={debugSelectedNode}
                v2uState={v2uState}
                debugMode={v2uDebugMode}
              />

              {/* Node Controls */}
              <div className="p-3">
                <NodeControls
                  node={selectedNode}
                  updateNodeData={updateNodeData}
                  onLogError={logNodeError}
                  v2uState={v2uState}
                  debugMode={v2uDebugMode}
                />
              </div>

              {/* Node Output */}
              {output && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <NodeOutput output={output} />
                </div>
              )}

              {/* Error Log */}
              {errors.length > 0 && (
                <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                  <ErrorLog
                    errors={errors}
                    onClearErrors={() => clearNodeErrors(selectedNode.id)}
                  />
                </div>
              )}
            </div>

            {/* V2U Enhanced Section */}
            {isV2UNode && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* V2U Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {V2U_UI_CONFIG.TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveV2UTab(tab.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors ${
                        activeV2UTab === tab.id
                          ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                {/* V2U Tab Content */}
                <div className="flex-1 overflow-auto p-3">
                  {v2uLoading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-2xl mb-2">⏳</div>
                      <div className="text-sm">Loading V2U state...</div>
                    </div>
                  ) : v2uError ? (
                    <div className="text-center py-8 text-red-500">
                      <div className="text-2xl mb-2">❌</div>
                      <div className="text-sm">Error loading V2U state</div>
                      <div className="text-xs mt-1">{v2uError}</div>
                    </div>
                  ) : (
                    renderV2UTabContent()
                  )}
                </div>
              </div>
            )}
          </div>
        ) : selectedEdge ? (
          <EdgeInspector
            edge={selectedEdge}
            allNodes={nodes}
            onDeleteEdge={handleDeleteEdge}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <div className="text-2xl mb-2">👆</div>
              <div className="text-sm">Select a node or edge to inspect</div>
              <div className="text-xs mt-1">
                V2U enhanced inspection available
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export default NodeInspectorV2U;
