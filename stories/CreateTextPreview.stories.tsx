import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { useMemo } from "react";
import CreateTextNode, {
  spec as createTextSpec,
} from "../features/business-logic-modern/node-domain/create/createText.node";

export default {
  title: "Nodes/CreateText/Preview",
  parameters: { layout: "centered" },
};

export const Default = () => {
  // Memoise nodeTypes mapping so ReactFlow picks up our custom component
  const nodeTypes = useMemo(
    () => ({
      createText: CreateTextNode,
    }),
    []
  );

  const nodes = useMemo(
    () => [
      {
        id: "n1",
        type: "createText",
        position: { x: 150, y: 80 },
        data: createTextSpec.initialData,
      },
    ],
    []
  );

  return (
    <ReactFlowProvider>
      <div style={{ width: 600, height: 400, border: "1px solid #ccc" }}>
        {/* @ts-ignore nodeTypes uses generic */}
        <ReactFlow nodes={nodes} edges={[]} nodeTypes={nodeTypes} fitView />
      </div>
    </ReactFlowProvider>
  );
};

// Alias for clarity when browsing controls panel
export const InCanvas = Default;
