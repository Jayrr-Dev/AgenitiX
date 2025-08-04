/**
 * NODE DATA - Node data display and editing with react-json-view
 *
 * • Displays node data in an interactive JSON format using react-json-view
 * • Provides collapsible tree structure with syntax highlighting
 * • Supports inline editing with validation
 * • Includes special handling for AI Agent specific fields
 * • Part of node inspector accordion system
 *
 * Keywords: node-data, react-json-view, json-editor, data-editing, accordion-card
 */

import type React from "react";
import { useMemo } from "react";
import ReactJson from "react-json-view";

import type {
  AgenNode,
  NodeType,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "@/features/business-logic-modern/infrastructure/node-inspector/adapters/NodeInspectorAdapter";
import { NODE_INSPECTOR_TOKENS } from "@/features/business-logic-modern/infrastructure/theming/components/nodeInspector";
import { NodeInspectorAdapter } from "../../adapters/NodeInspectorAdapter";

// Styling constants
const STYLING_JSON_CONTAINER = `${NODE_INSPECTOR_TOKENS.dimensions.fullWidth} ${NODE_INSPECTOR_TOKENS.dimensions.minWidth} ${NODE_INSPECTOR_TOKENS.dimensions.flexBasis}`;

interface NodeDataProps {
  selectedNode: AgenNode;
  nodeInfo: InspectorNodeInfo;
  updateNodeData: (nodeId: string, newData: any) => void;
}

export const NodeData: React.FC<NodeDataProps> = ({
  selectedNode,
  nodeInfo,
  updateNodeData,
}) => {
  // Get node category for display
  const nodeCategory = useMemo(() => {
    if (!selectedNode) {
      return null;
    }
    // Try to get category from node metadata or spec
    const nodeMetadata = NodeInspectorAdapter.getNodeInfo(
      selectedNode.type as NodeType
    );
    return nodeMetadata?.category || "unknown";
  }, [selectedNode]);

  // Prepare node data for display
  const nodeData = useMemo(
    () => ({
      id: selectedNode.id,
      category: nodeCategory,
      store: selectedNode.data?.store ?? "",
      inputs: selectedNode.data?.inputs ?? null,
      output: selectedNode.data?.output ?? null,
      isActive: selectedNode.data?.isActive,
      isEnabled: selectedNode.data?.isEnabled ?? true,
      isExpanded: selectedNode.data?.isExpanded,
      // AI Agent specific fields
      ...(selectedNode.type === "aiAgent" &&
        selectedNode.data &&
        "userInput" in selectedNode.data && {
          userInput: selectedNode.data.userInput,
          triggerInputs: selectedNode.data.triggerInputs,
          trigger: selectedNode.data.trigger,
          isProcessing: selectedNode.data.isProcessing,
          systemPrompt: selectedNode.data.systemPrompt,
          selectedProvider: selectedNode.data.selectedProvider,
          selectedModel: selectedNode.data.selectedModel,
          temperature: selectedNode.data.temperature,
          maxSteps: selectedNode.data.maxSteps,
          threadId: selectedNode.data.threadId,
        }),
    }),
    [selectedNode, nodeCategory]
  );

  // Handle JSON updates from react-json-view
  const handleJsonUpdate = useMemo(
    () => ({
      onEdit: (edit: any) => {
        // Extract the system fields and update only the data portion
        const { id, category, ...nodeData } = edit.updated_src;
        updateNodeData(selectedNode.id, nodeData);
        return true; // Allow the edit
      },
      onAdd: (add: any) => {
        // Extract the system fields and update only the data portion
        const { id, category, ...nodeData } = add.updated_src;
        updateNodeData(selectedNode.id, nodeData);
        return true; // Allow the addition
      },
      onDelete: (delete_: any) => {
        // Extract the system fields and update only the data portion
        const { id, category, ...nodeData } = delete_.updated_src;
        updateNodeData(selectedNode.id, nodeData);
        return true; // Allow the deletion
      },
    }),
    [selectedNode.id, updateNodeData]
  );

  return (
    <div className="-mx-1 overflow-hidden rounded-md border border-border/30 bg-muted/20">
      <div className={`${STYLING_JSON_CONTAINER} p-1`}>
        <div className="flex items-center justify-between mb-2">
          <div className="font-medium text-gray-700 text-xs dark:text-gray-300">
            JSON Data
          </div>
        </div>

        <div
          className="overflow-x-auto overflow-y-auto rounded-md border border-gray-300 p-3"
          style={{ backgroundColor: "#404040" }}
        >
          <ReactJson
            src={nodeData}
            name={false} // Hide root name
            theme="monokai" // Use monokai theme for better contrast on dark background
            style={{
              backgroundColor: "transparent",
              fontSize: "12px",
              fontFamily:
                "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
            }}
            iconStyle="circle" // Use circle icons for expand/collapse
            indentWidth={4} // Set indent width
            collapsed={2} // Collapse at depth 2 by default
            displayObjectSize={true} // Show object sizes
            displayDataTypes={true} // Show data types
            enableClipboard={true} // Enable copy to clipboard
            onEdit={handleJsonUpdate.onEdit}
            onAdd={handleJsonUpdate.onAdd}
            onDelete={handleJsonUpdate.onDelete}
            validationMessage="Validation Error"
            quotesOnKeys={true} // Show quotes on keys

            sortKeys={false} // Don't sort keys to maintain order
          />
        </div>
      </div>
    </div>
  );
};

export default NodeData;
