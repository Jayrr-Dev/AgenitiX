/**
 * NODE INSPECTOR - Tabbed node property editor with shadcn/ui
 *
 * • Clean shadcn/ui tabbed interface with Info, Controls, and Errors tabs
 * • Smart tab visibility based on node state and available controls
 * • Schema-driven controls with automatic generation
 * • Real-time validation and error feedback
 * • Maintains enterprise-grade backend safety
 *
 * Keywords: node-inspector, shadcn-tabs, schema-driven, type-safe, conditional-tabs
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFlowStore,
  useNodeErrors,
} from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import { getNodeOutput } from "@/features/business-logic-modern/infrastructure/flow-engine/utils/outputUtils";
import React, { useCallback, useMemo, useState } from "react";
import {
  FaExclamationTriangle,
  FaInfoCircle,
  FaLock,
  FaLockOpen,
  FaSlidersH,
} from "react-icons/fa";

import type { NodeType } from "../flow-engine/types/nodeData";
import { useComponentTheme } from "../theming/components";
import { NodeInspectorAdapter } from "./adapters/NodeInspectorAdapter";
import { EdgeInspector } from "./components/EdgeInspector";
import { ErrorLog } from "./components/ErrorLog";
import { NodeControls } from "./components/NodeControls";
import { NodeOutput } from "./components/NodeOutput";
import { JsonHighlighter } from "./utils/JsonHighlighter";

// Tab types
type TabType = "info" | "controls" | "errors";

// Tab configuration
const TAB_CONFIG = {
  info: {
    id: "info" as const,
    label: "Info",
    icon: FaInfoCircle,
    alwaysVisible: true,
  },
  controls: {
    id: "controls" as const,
    label: "Controls",
    icon: FaSlidersH,
    alwaysVisible: false,
  },
  errors: {
    id: "errors" as const,
    label: "Errors",
    icon: FaExclamationTriangle,
    alwaysVisible: false,
  },
};

const NodeInspector = React.memo(function NodeInspector() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    inspectorLocked,
    setInspectorLocked,
    updateNodeData,
    logNodeError,
    clearNodeErrors,
    removeEdge,
  } = useFlowStore();

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("info");

  // Get theme for node inspector
  const theme = useComponentTheme("nodeInspector");

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

  const nodeInfo = useMemo(() => {
    if (!selectedNode) return null;
    return NodeInspectorAdapter.getNodeInfo(selectedNode.type as NodeType);
  }, [selectedNode]);

  // Check if node has controls (inputs)
  const hasControls = useMemo(() => {
    if (!selectedNode || !nodeInfo) return false;
    // Use the hasControls property from the adapter
    return nodeInfo.hasControls;
  }, [selectedNode, nodeInfo]);

  // Check if there are errors
  const hasErrors = useMemo(() => {
    return errors && errors.length > 0;
  }, [errors]);

  // Get visible tabs
  const visibleTabs = useMemo(() => {
    return Object.values(TAB_CONFIG).filter((tab) => {
      if (tab.alwaysVisible) return true;
      if (tab.id === "controls") return hasControls;
      if (tab.id === "errors") return hasErrors;
      return false;
    });
  }, [hasControls, hasErrors]);

  // Ensure active tab is visible
  React.useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("info");
    }
  }, [visibleTabs, activeTab]);

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
      <div
        className={`flex items-center justify-center h-full w-full ${theme.background.primary}`}
      >
        <button
          type="button"
          aria-label="Unlock Inspector"
          title="Unlock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(false)}
          className={`p-2 ${theme.borderRadius.button} ${theme.background.hover} ${theme.text.primary} ${theme.transition} hover:${theme.background.active} ${theme.shadow.hover}`}
        >
          <FaLockOpen />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`node-inspector relative flex flex-col h-full ${theme.background.primary} ${theme.text.primary} ${theme.border.default} border-l overflow-hidden`}
    >
      {/* Fixed Header */}
      <div
        className={`relative z-20 flex items-center justify-between p-3 ${theme.background.primary} ${theme.border.default} border-b shadow-sm`}
      >
        <h2 className="text-lg font-semibold">Node Inspector</h2>
        <button
          type="button"
          aria-label="Lock Inspector"
          title="Lock Inspector (Alt+A)"
          onClick={() => setInspectorLocked(true)}
          className={`p-2 rounded ${theme.background.hover} ${theme.text.secondary} ${theme.transition} hover:${theme.background.active}`}
        >
          <FaLock />
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="relative flex-1 flex flex-col overflow-hidden">
        {selectedNode && nodeInfo && nodeInfo.displayName ? (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as TabType)}
            className="flex flex-col h-full"
          >
            {/* Fixed Tab Navigation */}
            <div
              className={`relative z-10 px-4 pt-4 pb-2 ${theme.background.primary} border-b ${theme.border.default} shadow-sm`}
            >
              <TabsList className="grid w-full grid-cols-3 gap-1">
                {visibleTabs.map((tab) => {
                  const IconComponent = tab.icon;

                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <IconComponent className="w-4 h-4" />
                      {tab.label}
                      {tab.id === "errors" && hasErrors && (
                        <Badge
                          variant="destructive"
                          className="ml-1 px-1.5 py-0.5 text-xs"
                        >
                          {errors?.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {/* Scrollable Tab Content Container */}
            <div className="flex-1 overflow-y-auto">
              <TabsContent
                value="info"
                className="h-full p-4 mt-0 data-[state=active]:block"
                style={{ minHeight: "100%" }}
              >
                <div className="space-y-6">
                  {/* Node Header */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      {nodeInfo.icon && (
                        <span className="text-2xl">{nodeInfo.icon}</span>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">
                          {nodeInfo.displayName}
                        </h3>
                        <p className={`text-sm ${theme.text.muted}`}>
                          Type: {selectedNode.type}
                        </p>
                      </div>
                    </div>
                    {nodeInfo.description && (
                      <div
                        className={`${theme.background.secondary} ${theme.border.default} border rounded-md p-3`}
                      >
                        <p className={`text-sm ${theme.text.primary}`}>
                          {nodeInfo.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Node ID */}
                  <div className="space-y-2">
                    <h4
                      className={`text-sm font-medium ${theme.text.secondary}`}
                    >
                      Node ID
                    </h4>
                    <div
                      className={`${theme.background.secondary} ${theme.border.default} border rounded p-2`}
                    >
                      <code className="text-xs font-mono">
                        {selectedNode.id}
                      </code>
                    </div>
                  </div>

                  {/* Development Info (only in dev mode) */}
                  {process.env.NODE_ENV === "development" && (
                    <details className="space-y-2">
                      <summary
                        className={`text-sm font-medium ${theme.text.secondary} cursor-pointer`}
                      >
                        Developer Info
                      </summary>
                      <div className="space-y-3 mt-2">
                        {/* Live Output */}
                        <div>
                          <h5
                            className={`text-xs font-medium ${theme.text.secondary} mb-1`}
                          >
                            Live Output
                          </h5>
                          <div
                            className={`${theme.background.secondary} ${theme.border.default} border rounded p-2 text-xs`}
                          >
                            <NodeOutput
                              output={output}
                              nodeType={selectedNode.type as NodeType}
                            />
                          </div>
                        </div>

                        {/* Raw Data */}
                        <div>
                          <h5
                            className={`text-xs font-medium ${theme.text.secondary} mb-1`}
                          >
                            Raw Data
                          </h5>
                          <div
                            className={`${theme.background.secondary} ${theme.border.default} border rounded p-2 text-xs`}
                          >
                            <JsonHighlighter data={selectedNode.data} />
                          </div>
                        </div>
                      </div>
                    </details>
                  )}
                </div>
              </TabsContent>

              {hasControls && (
                <TabsContent
                  value="controls"
                  className="h-full p-4 mt-0 data-[state=active]:block"
                  style={{ minHeight: "100%" }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4
                        className={`text-lg font-medium ${theme.text.primary}`}
                      >
                        Node Controls
                      </h4>
                      <p className={`text-sm ${theme.text.muted}`}>
                        Configure the behavior and properties of this node.
                      </p>
                    </div>

                    <NodeControls
                      node={selectedNode}
                      updateNodeData={updateNodeData}
                      onLogError={logNodeError as any}
                    />
                  </div>
                </TabsContent>
              )}

              {hasErrors && (
                <TabsContent
                  value="errors"
                  className="h-full p-4 mt-0 data-[state=active]:block"
                  style={{ minHeight: "100%" }}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4
                        className={`text-lg font-medium ${theme.text.primary} flex items-center gap-2`}
                      >
                        <FaExclamationTriangle className="text-red-500" />
                        Error Details
                      </h4>
                      <p className={`text-sm ${theme.text.muted}`}>
                        Debug information and error logs for this node.
                      </p>
                    </div>

                    <div
                      className={`${theme.background.secondary} ${theme.border.default} border rounded-md p-4`}
                    >
                      <ErrorLog
                        errors={errors!}
                        onClearErrors={handleClearErrors}
                      />
                    </div>
                  </div>
                </TabsContent>
              )}
            </div>
          </Tabs>
        ) : selectedEdge ? (
          <div className="flex-1 overflow-y-auto p-4">
            <EdgeInspector
              edge={selectedEdge}
              allNodes={nodes}
              onDeleteEdge={handleDeleteEdge}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className={`text-xl font-medium ${theme.text.secondary} mb-2`}>
              No Selection
            </div>
            <p className={`text-sm ${theme.text.muted}`}>
              Select a node to view its information and controls
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default NodeInspector;
