/**
 * NODE HANDLES - Handle information and position editor
 *
 * • Displays handles summary with connection counts
 * • Provides handle position editor for handle customization
 * • Shows handle metadata and connection information
 * • Part of node inspector accordion system
 *
 * Keywords: node-handles, handle-editor, position-editor, accordion-card
 */

import React from "react";

import { HandlePositionEditor } from "../HandlePositionEditor";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "../../adapters/NodeInspectorAdapter";
import type { Edge } from "@xyflow/react";

interface NodeHandlesProps {
	selectedNode: AgenNode;
	nodeInfo: InspectorNodeInfo;
	edges: Edge[];
	updateNodeData: (nodeId: string, newData: any) => void;
}

export const NodeHandles: React.FC<NodeHandlesProps> = ({
	selectedNode,
	nodeInfo,
	edges,
	updateNodeData,
}) => {
	return (
		<>
			{/* Handles Summary */}
			{nodeInfo.handles && nodeInfo.handles.length > 0 && (
				<div className="mb-3 rounded border border-border/30 bg-muted/30 p-2">
					<div className="flex items-center justify-between text-xs">
						<span className="font-medium text-foreground">
							{nodeInfo.handles.length} handle{nodeInfo.handles.length !== 1 ? "s" : ""}
						</span>
						<span className="text-muted-foreground">
							{
								edges.filter(
									(edge) =>
										edge.source === selectedNode.id || edge.target === selectedNode.id
								).length
							}{" "}
							total connection
							{edges.filter(
								(edge) =>
									edge.source === selectedNode.id || edge.target === selectedNode.id
							).length !== 1
								? "s"
								: ""}
						</span>
					</div>
				</div>
			)}

			{/* Handle Position Editor */}
			{nodeInfo.handles && nodeInfo.handles.length > 0 && (
				<div className="mb-4 rounded border border-border/30 bg-muted/10 p-3">
					<HandlePositionEditor
						node={selectedNode}
						handles={nodeInfo.handles}
						updateNodeData={updateNodeData}
					/>
				</div>
			)}
		</>
	);
};

export default NodeHandles;