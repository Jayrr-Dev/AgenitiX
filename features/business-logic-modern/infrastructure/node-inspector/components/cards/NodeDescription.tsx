/**
 * NODE DESCRIPTION - Node description display and editing
 *
 * • Displays and allows editing of node description
 * • Conditional rendering based on description availability
 * • Integrated with EditableNodeDescription component
 * • Part of node inspector accordion system
 *
 * Keywords: node-description, editable-description, accordion-card
 */

import React from "react";

import EditableNodeDescription from "@/components/nodes/EditableNodeDescription";
import { NODE_INSPECTOR_TOKENS as DESIGN_CONFIG } from "@/features/business-logic-modern/infrastructure/theming/components";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "../../adapters/NodeInspectorAdapter";

// Styling constants
const STYLING_TEXT_NODE_DESCRIPTION = `${DESIGN_CONFIG.typography.description} ${DESIGN_CONFIG.colors.data.text}`;

interface NodeDescriptionProps {
	selectedNode: AgenNode;
	nodeInfo: InspectorNodeInfo;
}

export const NodeDescription: React.FC<NodeDescriptionProps> = ({
	selectedNode,
	nodeInfo,
}) => {
	// Only render if nodeInfo has a description
	if (!nodeInfo.description) {
		return null;
	}

	return (
		<EditableNodeDescription
			nodeId={selectedNode.id}
			description={(selectedNode.data as any)?.description ?? nodeInfo.description}
			defaultDescription={nodeInfo.description}
			className={STYLING_TEXT_NODE_DESCRIPTION}
		/>
	);
};

export default NodeDescription;