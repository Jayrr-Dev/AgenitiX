/**
 * NODE CONTROLS COMPONENT - Enhanced control panels with Plop system integration
 *
 * • Renders dynamic control interfaces based on NodeSpec metadata
 * • Uses adapter pattern to reduce import churn and improve maintainability
 * • Supports automatic control generation from node schemas
 * • Provides fallback controls for legacy node types
 * • Integrates with the new Plop node creation system
 *
 * Keywords: node-controls, plop-integration, adapter-pattern, dynamic-ui, schema-driven
 */

"use client";

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type React from "react";
import { NodeInspectorAdapter } from "../adapters/NodeInspectorAdapter";
import { TextNodeControl } from "../controls/TextNodeControl";
import { EnhancedNodeControls } from "./EnhancedNodeControls";

interface NodeControlsProps {
  node: AgenNode;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError: (nodeId: string, message: string) => void;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  node,
  updateNodeData,
  onLogError,
}) => {
  // Get node information through the adapter (reduces import churn)
  const nodeInfo = NodeInspectorAdapter.getNodeInfo(node.type as any);

  if (!nodeInfo) {
    return (
      <div className="text-xs text-control-error p-3 text-center">
        <div className="mb-2">⚠️ Unknown Node Type</div>
        <div className="text-control-debug">
          Node type: <code>{node.type}</code>
        </div>
        <div className="mt-2 text-control-placeholder">
          This node type is not recognized by the system.
          <br />
          Please check the node registry configuration.
        </div>
      </div>
    );
  }

  // Use enhanced controls for nodes that support them
  if (nodeInfo.hasControls) {
    return (
      <EnhancedNodeControls
        node={node}
        nodeInfo={nodeInfo}
        updateNodeData={updateNodeData}
        onLogError={onLogError}
      />
    );
  }

  // Legacy fallback for specific node types
  if (node.data && typeof node.data.text === "string") {
    return <TextNodeControl node={node} updateNodeData={updateNodeData} />;
  }

  // Default fallback with helpful information
  return (
    <div className="text-xs text-control-placeholder p-3 text-center">
      <div className="mb-2">📋 {nodeInfo.displayName}</div>
      <div className="text-control-debug mb-2">
        Category: <code>{nodeInfo.category}</code>
      </div>
      {nodeInfo.description && (
        <div className="text-control-placeholder mb-2 italic">
          {nodeInfo.description}
        </div>
      )}
      <div className="text-control-debug">
        No controls available for this node type.
      </div>
    </div>
  );
};
