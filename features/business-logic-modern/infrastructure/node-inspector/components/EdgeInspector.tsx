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
import type { NodeSpec } from "@/features/business-logic-modern/infrastructure/node-core/NodeSpec";
import { JsonHighlighter } from "@/features/business-logic-modern/infrastructure/node-inspector/utils/JsonHighlighter";
import { nodeSpecs } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
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

	// Enhanced data type detection using node specs
	const getActualDataType = (node: any, handle: string, isOutput: boolean) => {
		if (!node) return { label: "Unknown", color: "text-muted-foreground", value: null };

		try {
			// Get the node spec to find the correct handle type
			const nodeSpec = (nodeSpecs as any)[node.type];
			if (nodeSpec && nodeSpec.handles) {
				// Find the specific handle in the node spec
				const specHandle = nodeSpec.handles.find((h: any) => h.id === handle);
				if (specHandle) {
					// Use the dataType from the spec
					const dataType = specHandle.dataType;

					// Map data types to colors
					const typeColorMap: Record<string, string> = {
						String: "text-blue-600 dark:text-blue-400",
						Number: "text-orange-600 dark:text-orange-400",
						Boolean: "text-green-600 dark:text-green-400",
						JSON: "text-purple-600 dark:text-purple-400",
						Array: "text-indigo-600 dark:text-indigo-400",
						Any: "text-muted-foreground",
						Object: "text-yellow-600 dark:text-yellow-400",
						Date: "text-cyan-600 dark:text-cyan-400",
						Function: "text-pink-600 dark:text-pink-400",
					};

					return {
						label: dataType || "Unknown",
						color: typeColorMap[dataType] || "text-muted-foreground",
						value: null,
						actualType: dataType?.toLowerCase() || "unknown",
					};
				}
			}

			// Fallback: try to get data from the node
			if (isOutput) {
				// For output handles, try to get the actual output data
				const outputData = node.data?.text || node.data?.output || node.data?.value;
				if (outputData !== undefined) {
					const actualType = typeof outputData;
					const typeColorMap: Record<string, string> = {
						string: "text-blue-600 dark:text-blue-400",
						number: "text-orange-600 dark:text-orange-400",
						boolean: "text-green-600 dark:text-green-400",
						object: "text-purple-600 dark:text-purple-400",
					};

					return {
						label: actualType.charAt(0).toUpperCase() + actualType.slice(1),
						color: typeColorMap[actualType] || "text-muted-foreground",
						value: outputData,
						actualType,
					};
				}
			}

			// Final fallback: infer from node type
			if (node.type === "createText") {
				return {
					label: "String",
					color: "text-blue-600 dark:text-blue-400",
					value: node.data?.text || "",
					actualType: "string",
				};
			}
			if (node.type === "viewText") {
				return {
					label: "String",
					color: "text-blue-600 dark:text-blue-400",
					value: node.data?.store || node.data?.inputs || "",
					actualType: "string",
				};
			}
		} catch (error) {
			console.warn("Error getting node spec for type detection:", error);
		}

		// Default fallback
		return {
			label: "Unknown",
			color: "text-muted-foreground",
			value: null,
			actualType: "unknown",
		};
	};

	const sourceType = getActualDataType(sourceNode, sourceHandle, true);
	const targetType = getActualDataType(targetNode, targetHandle, false);

	// Check type compatibility
	const isCompatible =
		sourceType.actualType === targetType.actualType ||
		targetType.actualType === "any" ||
		sourceType.actualType === "any" ||
		targetType.actualType === "unknown" ||
		sourceType.actualType === "unknown";

	return (
		<div className="space-y-3">
			{/* Edge Header */}
			<div className="flex items-center justify-between p-3 bg-muted/30 rounded-t-lg border-b border-border/30">
				<div className="flex items-center gap-2">
					<Zap className="w-4 h-4 text-foreground" />
					<h3 className="text-sm font-medium text-foreground">Edge Connection</h3>
				</div>
				{onDeleteEdge && (
					<button
						onClick={() => onDeleteEdge(edge.id)}
						className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
						title="Delete Edge"
					>
						<Trash2 className="w-4 h-4" />
					</button>
				)}
			</div>

			{/* Edge ID */}
			<div className="px-3">
				<div className="flex items-center gap-2">
					<span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
						ID
					</span>
					<span className="text-xs font-mono text-muted-foreground underline cursor-pointer">
						{edge.id}
					</span>
				</div>
			</div>

			{/* Connection Flow */}
			<div className="space-y-3 px-3">
				{/* Source Node */}
				<div className="p-3 bg-muted/20 rounded border border-border/50">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground bg-blue-100 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
								SOURCE
							</span>
							<span className="text-xs font-medium text-foreground">
								{sourceNode?.type || "Unknown"}
							</span>
						</div>
					</div>
					<div className="text-xs font-mono text-muted-foreground mb-2">
						{sourceNode?.id || "Unknown Node"}
					</div>
					<div className="flex items-center gap-2 text-xs">
						<span className="text-muted-foreground">Output:</span>
						<span className={`font-mono ${sourceType.color}`}>{sourceType.label}</span>
						{sourceHandle !== "default" && (
							<span className="text-muted-foreground">({sourceHandle})</span>
						)}
					</div>
					{sourceType.value !== null && sourceType.value !== undefined && (
						<div className="mt-2 text-xs">
							<span className="text-muted-foreground">Value: </span>
							<span className="font-mono text-foreground bg-background p-1 rounded border border-border/30">
								{typeof sourceType.value === "string"
									? `"${sourceType.value}"`
									: String(sourceType.value)}
							</span>
						</div>
					)}
				</div>

				{/* Connection Arrow */}
				<div className="flex justify-center">
					<div className="flex items-center gap-2 text-muted-foreground">
						<ArrowRight className="w-4 h-4" />
						<span className="text-xs font-medium">Data Flow</span>
						<ArrowRight className="w-4 h-4" />
					</div>
				</div>

				{/* Target Node */}
				<div className="p-3 bg-muted/20 rounded border border-border/50">
					<div className="flex items-center justify-between mb-2">
						<div className="flex items-center gap-2">
							<span className="text-xs font-medium text-muted-foreground bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
								TARGET
							</span>
							<span className="text-xs font-medium text-foreground">
								{targetNode?.type || "Unknown"}
							</span>
						</div>
					</div>
					<div className="text-xs font-mono text-muted-foreground mb-2">
						{targetNode?.id || "Unknown Node"}
					</div>
					<div className="flex items-center gap-2 text-xs">
						<span className="text-muted-foreground">Input:</span>
						<span className={`font-mono ${targetType.color}`}>{targetType.label}</span>
						{targetHandle !== "default" && (
							<span className="text-muted-foreground">({targetHandle})</span>
						)}
					</div>
				</div>
			</div>

			{/* Type Compatibility Check */}
			<div className="px-3">
				<div className="p-3 bg-muted/20 rounded border border-border/50">
					<div className="flex items-center gap-2 mb-2">
						<span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
							COMPATIBILITY
						</span>
					</div>
					<div className="text-xs">
						{isCompatible ? (
							<span className="text-green-600 dark:text-green-400 font-medium">
								✓ Compatible types
							</span>
						) : (
							<span className="text-orange-600 dark:text-orange-400 font-medium">
								⚠ Type mismatch warning
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Edge Data (if any) */}
			{edge.data && Object.keys(edge.data).length > 0 && (
				<div className="px-3 space-y-2">
					<div className="flex items-center gap-2">
						<span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
							EDGE DATA
						</span>
					</div>
					<div className="p-2 bg-background rounded border border-border/30">
						<JsonHighlighter data={edge.data} />
					</div>
				</div>
			)}
		</div>
	);
};
