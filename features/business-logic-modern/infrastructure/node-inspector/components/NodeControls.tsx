/**
 * NODE CONTROLS COMPONENT - Dynamic control panels for node property editing
 *
 * • Renders type-specific control interfaces based on node metadata
 *
 * Keywords: node-controls, dynamic-ui, validation, triggers, parameters, registry
 */

"use client";

import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { NodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/types";
import type React from "react";
import { TextNodeControl } from "../controls/TextNodeControl";

interface NodeControlsProps {
  node: AgenNode;
  metadata: NodeMetadata | null;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError: (nodeId: string, message: string) => void;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
  node,
  metadata,
  updateNodeData,
}) => {
  // If metadata specifies a "text" data property, render a text control.
  // This is a placeholder for a more robust, declarative control system.
  if (metadata?.data?.text) {
    return <TextNodeControl node={node} updateNodeData={updateNodeData} />;
  }

  // Fallback for nodes with no registered controls
  return (
    <div className="text-xs text-infra-inspector-text-secondary p-2">
      No controls available for this node type.
    </div>
  );
};
