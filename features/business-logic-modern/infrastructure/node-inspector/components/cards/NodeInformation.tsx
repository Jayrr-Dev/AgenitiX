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

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Edit3 } from "lucide-react";

import EditableNodeId from "@/components/nodes/editableNodeId";
import type { AgenNode } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "../../adapters/NodeInspectorAdapter";

// Styling constants
const STYLING_TEXT_NODE_METADATA = "font-mono text-muted-foreground text-sm";

// EditableLabel component that matches EditableNodeId behavior
interface EditableLabelProps {
	value: string;
	placeholder: string;
	onSave: (newValue: string) => void;
	className?: string;
}

const EditableLabel: React.FC<EditableLabelProps> = ({ value, placeholder, onSave, className = "" }) => {
	const [editing, setEditing] = useState(false);
	const spanRef = useRef<HTMLSpanElement>(null);

	// Focus and select all text when entering edit mode
	useEffect(() => {
		if (editing) {
			const span = spanRef.current;
			if (span) {
				span.focus();
				// Select all text when entering edit mode
				const range = document.createRange();
				range.selectNodeContents(span);
				const selection = window.getSelection();
				selection?.removeAllRanges();
				selection?.addRange(range);
			}
		}
	}, [editing]);

	const save = (newValue: string) => {
		const trimmedValue = newValue.trim();
		onSave(trimmedValue);
		setEditing(false);
	};

	const onBlur = () => {
		const currentText = spanRef.current?.innerText || "";
		save(currentText);
	};

	const onKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			spanRef.current?.blur();
		}
		if (e.key === "Escape") {
			// Restore original text and exit edit mode
			if (spanRef.current) {
				spanRef.current.innerText = value;
			}
			setEditing(false);
		}
	};

	return (
		<div className={className}>
			<span
				ref={spanRef}
				contentEditable={editing}
				suppressContentEditableWarning={true}
				onClick={() => setEditing(true)}
				onBlur={onBlur}
				onKeyDown={onKeyDown}
				className={`inline-block ${editing ? "cursor-text" : "cursor-pointer"} ${
					editing ? "rounded px-1 focus:ring-1 focus:ring-blue-500" : ""
				}`}
				style={{
					outline: "none",
					userSelect: editing ? "text" : "none",
					whiteSpace: "nowrap",
					minWidth: "60px",
					borderBottom: editing ? "1px solid currentColor" : "1px solid transparent",
				}}
				title={editing ? "Enter to save, Escape to cancel" : "Click to edit label"}
			>
				{value || placeholder}
			</span>
		</div>
	);
};

interface NodeInfoProps {
	selectedNode: AgenNode;
	nodeInfo: InspectorNodeInfo;
	updateNodeData: (nodeId: string, newData: any) => void;
	onUpdateNodeId: (oldId: string, newId: string) => boolean;
}

const NodeInformationComponent: React.FC<NodeInfoProps> = ({
	selectedNode,
	nodeInfo,
	updateNodeData,
	onUpdateNodeId,
}) => {
	// Memoize callbacks to prevent child re-renders
	const handleLabelSave = useCallback((newLabel: string) => {
		updateNodeData(selectedNode.id, {
			...selectedNode.data,
			label: newLabel,
		});
	}, [selectedNode.id, selectedNode.data, updateNodeData]);

	// Memoize expensive tag rendering
	const tagElements = useMemo(() => {
		if (!nodeInfo.tags || nodeInfo.tags.length === 0) return null;
		
		return nodeInfo.tags.map((tag) => (
			<span
				key={`tag-${tag}`}
				className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs"
			>
				{tag}
			</span>
		));
	}, [nodeInfo.tags]);

	// Memoize node label value to prevent unnecessary recalculations
	const nodeLabel = useMemo(() => {
		return (selectedNode.data as any)?.label || nodeInfo.label || nodeInfo.displayName || "";
	}, [selectedNode.data, nodeInfo.label, nodeInfo.displayName]);

	// Memoize node description
	const nodeDescription = useMemo(() => {
		return (selectedNode.data as any)?.description ?? nodeInfo.description;
	}, [selectedNode.data, nodeInfo.description]);
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
							<div className="flex items-center justify-between w-full">
								<EditableLabel
									value={nodeLabel}
									placeholder={nodeInfo.displayName}
									onSave={handleLabelSave}
									className="font-mono text-muted-foreground text-sm flex-1"
								/>
								<Edit3 className="h-3 w-3 text-muted-foreground/60 ml-1" />
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
							<div className="flex items-center justify-between w-full">
								<EditableNodeId
									nodeId={selectedNode.id}
									onUpdateId={onUpdateNodeId}
									className="font-mono text-muted-foreground text-sm flex-1"
								/>
								<Edit3 className="h-3 w-3 text-muted-foreground/60 ml-1" />
							</div>
						</td>
					</tr>
					{nodeInfo.description && (
						<tr className="flex items-start">
							<td className="w-1/3 py-2 pr-2">
								<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
									DESCRIPTION
								</span>
							</td>
							<td className="w-2/3 py-2">
								<span className="font-mono text-muted-foreground text-sm leading-relaxed">
									{nodeDescription}
								</span>
							</td>
						</tr>
					)}
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
									{tagElements}
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

export const NodeInformation = React.memo(NodeInformationComponent, (prev, next) => {
	// Re-render only if selectedNode.id or nodeInfo reference changed.
	return (
		prev.selectedNode.id === next.selectedNode.id &&
		prev.selectedNode.data === next.selectedNode.data &&
		prev.nodeInfo === next.nodeInfo
	);
});

export default NodeInformation;