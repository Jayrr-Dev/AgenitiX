/**
 * NODE DATA - Node data display and editing with JSON editor
 *
 * • Displays node data in an editable JSON format
 * • Includes special handling for AI Agent specific fields
 * • Integrated with EditableJsonEditor component
 * • Part of node inspector accordion system
 *
 * Keywords: node-data, json-editor, data-editing, accordion-card
 */

import type React from "react";
import { useMemo } from "react";

import type {
  AgenNode,
  NodeType,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "@/features/business-logic-modern/infrastructure/node-inspector/adapters/NodeInspectorAdapter";
import { NODE_INSPECTOR_TOKENS } from "@/features/business-logic-modern/infrastructure/theming/components/nodeInspector";
import { NodeInspectorAdapter } from "../../adapters/NodeInspectorAdapter";
import { EditableJsonEditor } from "../EditableJsonEditor";

// Styling constants
const STYLING_JSON_HIGHLIGHTER = `${NODE_INSPECTOR_TOKENS.dimensions.fullWidth} ${NODE_INSPECTOR_TOKENS.dimensions.minWidth} ${NODE_INSPECTOR_TOKENS.dimensions.flexBasis}`;

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

  return (
    <div className="-mx-1 overflow-hidden rounded-md border border-border/30 bg-muted/20">
      <EditableJsonEditor
        data={{
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
        }}
        onUpdateData={(newData) => {
          // Extract the system fields and update only the data portion
          const { id, category, ...nodeData } = newData;
          updateNodeData(selectedNode.id, nodeData);
        }}
        className={STYLING_JSON_HIGHLIGHTER}
      />
    </div>
  );
};

export default NodeData;
