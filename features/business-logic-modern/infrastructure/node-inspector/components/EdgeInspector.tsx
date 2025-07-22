/**
 * EDGE INSPECTOR COMPONENT - Edge properties display and editing interface
 *
 * • Displays selected edge connection details and metadata
 * • Shows source and target node information with type validation
 * • Provides edge deletion functionality with confirmation prompts
 * • Renders connection path and styling information for debugging
 * • Integrates with flow state management for real-time edge updates
 *
 * Keywords: edge-inspector, connections, source-target, validation, deletion, metadata
 */

"use client";

import type {
	AgenEdge,
	AgenNode,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { ArrowRight, Trash2, Zap } from "lucide-react";
import type React from "react";

interface EdgeInspectorProps {
	edge: AgenEdge;
	allNodes: AgenNode[];
	onDeleteEdge?: (edgeId: string) => void;
}

export const EdgeInspector: React.FC<EdgeInspectorProps> = ({ edge, allNodes, onDeleteEdge }) => {
	// Find source and target nodes
	const sourceNode = allNodes.find((n) => n.id === edge.source);
	const targetNode = allNodes.find((n) => n.id === edge.target);

	// Get handle information
	const sourceHandle = edge.sourceHandle || "default";
	const targetHandle = edge.targetHandle || "default";

	// Enhanced data type detection
	const getActualDataType = (node: any, handle: string, isOutput: boolean) => {
		if (!node) return { label: "Unknown", color: "text-node-view-text-secondary", value: null };

		// For default handles, try to infer the actual data type
		if (handle === "default") {
			if (isOutput) {
				// Analyze the node's output data
				if (node.type === "uppercaseNode" || node.type === "textNode") {
					const outputValue = node.data?.text || "";
					return {
						label: "String",
						color: "text-info",
						value: outputValue,
						actualType: typeof outputValue,
					};
				}
				if (node.type === "inputTesterNode") {
					const value = node.data?.value;
					const actualType = typeof value;
					if (actualType === "boolean") {
						return {
							label: "Boolean",
							color: "text-success",
							value: value,
							actualType,
						};
					}
					if (actualType === "string") {
						return {
							label: "String",
							color: "text-info",
							value: value,
							actualType,
						};
					}
					if (actualType === "number") {
						return {
							label: "Number",
							color: "text-warning",
							value: value,
							actualType,
						};
					}
				}
				if (node.type === "counterNode") {
					return {
						label: "Number",
						color: "text-warning",
						value: node.data?.count || 0,
						actualType: "number",
					};
				}
				if (node.type === "outputnode") {
					// Output node shows whatever it receives
					return {
						label: "Any",
						color: "text-node-view-text-secondary",
						value: "Displays input",
						actualType: "any",
					};
				}
				// Logic gates typically output boolean
				if (node.type?.startsWith("logic")) {
					return {
						label: "Boolean",
						color: "text-success",
						value: node.data?.triggered || false,
						actualType: "boolean",
					};
				}
				// Triggers typically output boolean
				if (node.type?.startsWith("trigger")) {
					return {
						label: "Boolean",
						color: "text-success",
						value: node.data?.triggered || false,
						actualType: "boolean",
					};
				}
			} else {
				// For input, we can infer expected type based on node type
				if (node.type === "outputnode") {
					return {
						label: "Any",
						color: "text-node-view-text-secondary",
						value: "Accepts any type",
						actualType: "any",
					};
				}
				if (node.type === "uppercaseNode" || node.type === "textConverterNode") {
					return {
						label: "String",
						color: "text-info",
						value: "Expects string",
						actualType: "string",
					};
				}
				if (node.type?.startsWith("logic")) {
					return {
						label: "Boolean",
						color: "text-success",
						value: "Expects boolean",
						actualType: "boolean",
					};
				}
				if (node.type === "counterNode") {
					return {
						label: "Number",
						color: "text-warning",
						value: "Expects number",
						actualType: "number",
					};
				}
				if (node.type === "delayNode") {
					return {
						label: "Any",
						color: "text-node-view-text-secondary",
						value: "Passes through input",
						actualType: "any",
					};
				}
			}
		}

		// Handle typed handles
		const typeMap: Record<string, { label: string; color: string }> = {
			s: { label: "String", color: "text-info" },
			n: { label: "Number", color: "text-warning" },
			b: { label: "Boolean", color: "text-success" },
			x: { label: "Any", color: "text-node-view-text-secondary" },
			j: { label: "JSON", color: "text-node-trigger" },
			a: { label: "Array", color: "text-node-test" },
			N: { label: "BigInt", color: "text-node-trigger-text-secondary" },
			f: { label: "Float", color: "text-warning-secondary" },
			u: { label: "Undefined", color: "text-node-view-text-secondary" },
			S: { label: "Symbol", color: "text-warning" },
			"∅": { label: "Null", color: "text-error" },
		};

		const typeInfo = typeMap[handle] || {
			label: "Unknown",
			color: "text-node-view-text-secondary",
		};
		return { ...typeInfo, value: null, actualType: handle };
	};

	const sourceType = getActualDataType(sourceNode, sourceHandle, true);
	const targetType = getActualDataType(targetNode, targetHandle, false);

	return (
		<div className="flex flex-col gap-3">
			{/* Edge Header */}
			<div className="border-b border-node-view pb-2">
				<div className="flex items-center justify-between">
					<h3 className="text-sm font-semibold text-node-view flex items-center gap-2">
						<Zap className="w-4 h-4" />
						Edge Connection
					</h3>
					{onDeleteEdge && (
						<button
							onClick={() => onDeleteEdge(edge.id)}
							className="p-1 text-error hover:bg-error-hover rounded transition-colors"
							title="Delete Edge"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					)}
				</div>
				<div className="text-xs text-node-view-text-secondary mt-1">ID: {edge.id}</div>
			</div>

			{/* Connection Flow */}
			<div className="space-y-3">
				{/* Source Node */}
				<div className="p-3 bg-node-view rounded border-node-view">
					<div className="flex items-center justify-between mb-2">
						<div className="text-xs text-node-view-text-secondary">Source</div>
						<div className="text-xs font-mono text-node-view">{sourceNode?.type || "Unknown"}</div>
					</div>
					<div className="text-sm font-medium text-node-view mb-1">
						{sourceNode?.data?.label || sourceNode?.id || "Unknown Node"}
					</div>
					<div className="flex items-center gap-2 text-xs">
						<span className="text-node-view-text-secondary">Output:</span>
						<span className={`font-mono ${sourceType.color}`}>{sourceType.label}</span>
						{sourceHandle !== "default" && (
							<span className="text-node-view-text-secondary">({sourceHandle})</span>
						)}
					</div>
					{sourceType.value !== null && (
						<div className="mt-2 text-xs">
							<span className="text-node-view-text-secondary">Value: </span>
							<span className="font-mono text-node-view">
								{typeof sourceType.value === "string"
									? `"${sourceType.value}"`
									: String(sourceType.value)}
							</span>
						</div>
					)}
				</div>

				{/* Connection Arrow */}
				<div className="flex justify-center">
					<div className="flex items-center gap-2 text-node-view-text-secondary">
						<ArrowRight className="w-4 h-4" />
						<span className="text-xs">Data Flow</span>
						<ArrowRight className="w-4 h-4" />
					</div>
				</div>

				{/* Target Node */}
				<div className="p-3 bg-node-view rounded border-node-view">
					<div className="flex items-center justify-between mb-2">
						<div className="text-xs text-node-view-text-secondary">Target</div>
						<div className="text-xs font-mono text-node-view">{targetNode?.type || "Unknown"}</div>
					</div>
					<div className="text-sm font-medium text-node-view mb-1">
						{targetNode?.data?.label || targetNode?.id || "Unknown Node"}
					</div>
					<div className="flex items-center gap-2 text-xs">
						<span className="text-node-view-text-secondary">Input:</span>
						<span className={`font-mono ${targetType.color}`}>{targetType.label}</span>
						{targetHandle !== "default" && (
							<span className="text-node-view-text-secondary">({targetHandle})</span>
						)}
					</div>
				</div>
			</div>

			{/* Type Compatibility Check */}
			<div className="p-3 bg-info rounded border-info">
				<div className="text-xs font-medium text-info-text mb-2">Type Compatibility</div>
				<div className="text-xs text-info-text-secondary">
					{sourceType.actualType === targetType.actualType ||
					targetType.actualType === "any" ||
					sourceType.actualType === "any" ? (
						<span className="text-success">✓ Compatible types</span>
					) : (
						<span className="text-warning">⚠ Type mismatch warning</span>
					)}
				</div>
			</div>

			{/* Edge Data (if any) */}
			{edge.data && Object.keys(edge.data).length > 0 && (
				<div className="space-y-2">
					<div className="text-xs font-medium text-node-view">Edge Data</div>
					<div className="p-2 bg-node-view rounded border-node-view">
						<JsonHighlighter data={edge.data} />
					</div>
				</div>
			)}
		</div>
	);
};
