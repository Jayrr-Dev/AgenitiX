/**
 * NODE INFO - Node metadata and information display
 *
 * • Displays node type, label, ID, author, feature, tags, version, and runtime
 * • Provides editable label and ID functionality
 * • Organized metadata display with clean styling
 * • Integrated with node inspector accordion system
 *
 * Keywords: node-info, metadata, editable-fields, accordion-card
 */

import React from "react";
import { Edit3 } from "lucide-react";

import EditableNodeId from "@/components/nodes/editableNodeId";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "../../adapters/NodeInspectorAdapter";

// Styling constants
const STYLING_TEXT_NODE_METADATA = "font-mono text-muted-foreground text-sm";

interface NodeInfoProps {
	selectedNode: AgenNode;
	nodeInfo: InspectorNodeInfo;
	updateNodeData: (nodeId: string, newData: any) => void;
	onUpdateNodeId: (oldId: string, newId: string) => boolean;
}

export const NodeInformation: React.FC<NodeInfoProps> = ({
	selectedNode,
	nodeInfo,
	updateNodeData,
	onUpdateNodeId,
}) => {
	return (
		<div className="overflow-hidden">
			<table className="w-full">
				<tbody className="divide-y divide-border/30">
					<tr className="flex items-center">
						<td className="w-1/3 py-2 pr-2">
							<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
								TYPE
							</span>
						</td>
						<td className="w-2/3 py-2">
							<span className={STYLING_TEXT_NODE_METADATA}>{selectedNode.type}</span>
						</td>
					</tr>
					<tr className="flex items-center">
						<td className="w-1/3 py-2 pr-2">
							<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
								LABEL
							</span>
						</td>
						<td className="w-2/3 py-2">
							<div className="flex items-center gap-1">
								<input
									type="text"
									value={
										(selectedNode.data as any)?.label || nodeInfo.label || nodeInfo.displayName
									}
									onChange={(e) => {
										updateNodeData(selectedNode.id, {
											...selectedNode.data,
											label: e.target.value,
										});
									}}
									onClick={(e) => {
										(e.target as HTMLInputElement).select();
									}}
									className="rounded border-none bg-transparent px-1 font-mono text-muted-foreground text-sm outline-none focus:ring-1 focus:ring-blue-500"
									placeholder={nodeInfo.displayName}
								/>
								<Edit3 className="h-3 w-3 text-muted-foreground/60" />
							</div>
						</td>
					</tr>
					<tr className="flex items-center">
						<td className="w-1/3 py-2 pr-2">
							<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
								ID
							</span>
						</td>
						<td className="w-2/3 py-2">
							<div className="flex items-center gap-1">
								<EditableNodeId
									nodeId={selectedNode.id}
									onUpdateId={onUpdateNodeId}
									className="font-mono text-muted-foreground text-sm"
								/>
								<Edit3 className="h-3 w-3 text-muted-foreground/60" />
							</div>
						</td>
					</tr>
					{nodeInfo.author && (
						<tr className="flex items-center">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									AUTHOR
								</span>
							</td>
							<td className="w-2/3 py-2">
								<span className={STYLING_TEXT_NODE_METADATA}>{nodeInfo.author}</span>
							</td>
						</tr>
					)}
					{nodeInfo.feature && (
						<tr className="flex items-center">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									FEATURE
								</span>
							</td>
							<td className="w-2/3 py-2">
								<span className={STYLING_TEXT_NODE_METADATA}>{nodeInfo.feature}</span>
							</td>
						</tr>
					)}
					{nodeInfo.tags && nodeInfo.tags.length > 0 && (
						<tr className="flex items-center">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									TAGS
								</span>
							</td>
							<td className="w-2/3 py-2">
								<div className="flex flex-wrap gap-1">
									{nodeInfo.tags.map((tag) => (
										<span
											key={`tag-${tag}`}
											className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs"
										>
											{tag}
										</span>
									))}
								</div>
							</td>
						</tr>
					)}
					{nodeInfo.version && (
						<tr className="flex items-center">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									VERSION
								</span>
							</td>
							<td className="w-2/3 py-2">
								<span className={STYLING_TEXT_NODE_METADATA}>{nodeInfo.version}</span>
							</td>
						</tr>
					)}
					{nodeInfo.runtime?.execute && (
						<tr className="flex items-center">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									RUNTIME
								</span>
							</td>
							<td className="w-2/3 py-2">
								<span className="font-mono text-muted-foreground text-sm">
									{nodeInfo.runtime.execute}
								</span>
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
};

export default NodeInformation;