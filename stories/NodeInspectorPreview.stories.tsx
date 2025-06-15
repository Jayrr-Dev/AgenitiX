import { ReactFlowProvider } from "@xyflow/react";
import { useFlowStore } from "../features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import NodeInspector from "../features/business-logic-modern/infrastructure/node-inspector/NodeInspector";

export default {
  title: "Components/NodeInspector/Preview",
  parameters: { layout: "fullscreen" },
};

export const EmptyState = () => (
  <ReactFlowProvider>
    <NodeInspector />
  </ReactFlowProvider>
);

export const Locked = () => {
  // Ensure store has locked state on mount
  useFlowStore.setState({ inspectorLocked: true });
  return (
    <ReactFlowProvider>
      <NodeInspector />
    </ReactFlowProvider>
  );
};

Locked.parameters = {
  backgrounds: { default: "dark" },
};
