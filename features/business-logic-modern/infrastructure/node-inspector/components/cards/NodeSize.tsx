/**
 * NODE SIZE - Size controls for nodes with expandable/collapsible states
 *
 * • Provides size controls for nodes with size fields
 * • Conditional rendering based on expandedSize field availability
 * • Integrated with SizeControls component
 * • Part of node inspector accordion system
 *
 * Keywords: node-size, size-controls, expandable-nodes, accordion-card
 */

import React from "react";

import { SizeControls } from "../SizeControls";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

interface NodeSizeProps {
	selectedNode: AgenNode;
	updateNodeData: (nodeId: string, patch: Record<string, any>) => void;
}

export const NodeSize: React.FC<NodeSizeProps> = ({
	selectedNode,
	updateNodeData,
}) => {
	// Only render if node has expandedSize field
	if (!selectedNode.data || (selectedNode.data as any).expandedSize === undefined) {
		return null;
	}

	return (
		<SizeControls
			nodeData={selectedNode.data as any}
			updateNodeData={(patch: Record<string, any>) =>
				updateNodeData(selectedNode.id, patch)
			}
		/>
	);
};

export default NodeSize;