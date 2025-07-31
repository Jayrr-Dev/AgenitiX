/**
 * NODE OUTPUT - Node output display and management
 *
 * • Displays node output using NodeOutput component
 * • Conditional rendering based on hasOutput configuration
 * • Part of node inspector accordion system
 * • Right column component in node inspector
 *
 * Keywords: node-output, output-display, accordion-card
 */

import React from "react";

import { NodeOutput as NodeOutputComponent } from "../NodeOutput";
import type { NodeType } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

interface NodeOutputProps {
	output: any;
	nodeType: NodeType;
}

export const NodeOutput: React.FC<NodeOutputProps> = ({
	output,
	nodeType,
}) => {
	return <NodeOutputComponent output={output} nodeType={nodeType} />;
};

export default NodeOutput;