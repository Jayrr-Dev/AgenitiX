/**
 * VIEW OUTPUT V2U - Pure React Component
 *
 * ▸ Modern, declarative node built with pure React.
 * ▸ Configuration is driven by the associated `meta.json` file.
 * ▸ Displays incoming data from any connected node.
 */

"use client";

import { NodeProps, useEdges, useNodes } from "@xyflow/react";
import React, { useEffect, useState } from "react";
import { NodeScaffold } from "@/components/nodes/NodeScaffold";
import { useNodeData } from "@/hooks/useNodeData";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface ViewOutputV2UData extends BaseNodeData {
  handles: any[];
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
  }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractNodeValue(data: any): any {
  if (!data || typeof data !== "object") return data;
  if ("text" in data) return data.text;
  if ("value" in data) return data.value;
  if ("output" in data) return data.output;
  if ("result" in data) return data.result;
  return data;
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
}

// ============================================================================
// NODE COMPONENT
// ============================================================================

const ViewOutputV2UNode: React.FC<NodeProps> = ({ 
  id, 
  data, 
  type, 
  selected = false 
}) => {
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const allNodes = useNodes();
  const allEdges = useEdges();

  // Ensure nodeData has the correct type by merging with defaults
  const safeNodeData: ViewOutputV2UData = {
    displayedValues: [],
    handles: [],
    isActive: true,
    ...nodeData,
  } as ViewOutputV2UData;

  useEffect(() => {
    const incomingEdges = allEdges.filter((edge) => edge.target === id);
    const sourceNodeIds = new Set(incomingEdges.map((edge) => edge.source));
    const connectedNodes = allNodes.filter((node) => sourceNodeIds.has(node.id));

    const values = connectedNodes.map((node) => ({
      type: node.type || "unknown",
      content: extractNodeValue(node.data),
      id: node.id,
    }));

    // Avoid unnecessary updates
    if (safeStringify(values) !== safeStringify(safeNodeData.displayedValues)) {
      updateNodeData({ displayedValues: values });
    }
  }, [allNodes, allEdges, id, safeNodeData.displayedValues, updateNodeData]);

  const handleToggleCollapse = () => setIsCollapsed((prev) => !prev);

  // Determine node states for theming
  const isError = !!safeNodeData.error;
  const isActive = safeNodeData.isActive ?? true;

  return (
    <NodeScaffold
      nodeId={id}
      nodeType={type}
      isCollapsed={isCollapsed}
      onToggleCollapse={handleToggleCollapse}
      isSelected={selected}
      isError={isError}
      isActive={isActive}
    >
      <div className="p-4">
        <h3 className="font-bold text-center mb-2">View Output</h3>
        {!isCollapsed && (
             <div className="bg-gray-100 dark:bg-gray-900 rounded-md p-2 max-h-48 overflow-y-auto">
                {safeNodeData.displayedValues.length > 0 ? (
                    safeNodeData.displayedValues.map((val: any) => (
                    <div key={val.id} className="mb-2 last:mb-0">
                        <p className="text-xs font-mono text-blue-500">From: {val.type} ({val.id})</p>
                        <pre className="text-sm bg-white dark:bg-gray-800 p-2 rounded overflow-x-auto">
                        <code>{safeStringify(val.content)}</code>
                        </pre>
                    </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 text-center italic">No input connected</p>
                )}
            </div>
        )}
      </div>
    </NodeScaffold>
  );
};

export default ViewOutputV2UNode;
