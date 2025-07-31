/**
 * NODE CONTROLS - Node controls interface
 *
 * • Displays node controls using NodeControls component
 * • Conditional rendering based on hasControls configuration
 * • Part of node inspector accordion system
 * • Right column component in node inspector
 *
 * Keywords: node-controls, controls-interface, accordion-card
 */

import React from "react";

import { NodeControls as NodeControlsComponent } from "../NodeControls";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

interface NodeControlsProps {
	selectedNode: AgenNode;
	updateNodeData: (nodeId: string, newData: any) => void;
	onLogError: (nodeId: string, error: any) => void;
}

export const NodeControls: React.FC<NodeControlsProps> = ({
	selectedNode,
	updateNodeData,
	onLogError,
}) => {
	return (
		<NodeControlsComponent
			node={selectedNode}
			updateNodeData={updateNodeData}
			onLogError={onLogError}
		/>
	);
};

export default NodeControls;