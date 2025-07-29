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
		if (!node) {
			return { label: "Unknown", color: "text-muted-foreground", value: null };
		}

		try {
			// Get the node spec to find the correct handle type
			const nodeSpec = (nodeSpecs as any)[node.type];
			if (nodeSpec?.handles) {
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
			<div className="flex items-center justify-between rounded-t-lg border-border/30 border-b bg-muted/30 p-3">
				<div className="flex items-center gap-2">
					<Zap className="h-4 w-4 text-foreground" />
					<h3 className="font-medium text-foreground text-sm">Edge Connection</h3>
				</div>
				{onDeleteEdge && (
					<button
						type="button"
						onClick={() => onDeleteEdge(edge.id)}
						className="rounded p-1 text-red-600 transition-colors hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30"
						title="Delete Edge"
					>
						<Trash2 className="h-4 w-4" />
					</button>
				)}
			</div>

			{/* Edge ID */}
			<div className="px-3">
				<div className="flex items-center gap-2">
					<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
						ID
					</span>
					<span className="cursor-pointer font-mono text-muted-foreground text-xs underline">
						{edge.id}
					</span>
				</div>
			</div>

			{/* Connection Flow */}
			<div className="space-y-3 px-3">
				{/* Source Node */}
				<div className="rounded border border-border/50 bg-muted/20 p-3">
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-muted-foreground text-xs dark:bg-blue-900/30">
								SOURCE
							</span>
							<span className="font-medium text-foreground text-xs">
								{sourceNode?.type || "Unknown"}
							</span>
						</div>
					</div>
					<div className="mb-2 font-mono text-muted-foreground text-xs">
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
							<span className="rounded border border-border/30 bg-background p-1 font-mono text-foreground">
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
						<ArrowRight className="h-4 w-4" />
						<span className="font-medium text-xs">Data Flow</span>
						<ArrowRight className="h-4 w-4" />
					</div>
				</div>

				{/* Target Node */}
				<div className="rounded border border-border/50 bg-muted/20 p-3">
					<div className="mb-2 flex items-center justify-between">
						<div className="flex items-center gap-2">
							<span className="rounded bg-green-100 px-1.5 py-0.5 font-medium text-muted-foreground text-xs dark:bg-green-900/30">
								TARGET
							</span>
							<span className="font-medium text-foreground text-xs">
								{targetNode?.type || "Unknown"}
							</span>
						</div>
					</div>
					<div className="mb-2 font-mono text-muted-foreground text-xs">
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
				<div className="rounded border border-border/50 bg-muted/20 p-3">
					<div className="mb-2 flex items-center gap-2">
						<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
							COMPATIBILITY
						</span>
					</div>
					<div className="text-xs">
						{isCompatible ? (
							<span className="font-medium text-green-600 dark:text-green-400">
								✓ Compatible types
							</span>
						) : (
							<span className="font-medium text-orange-600 dark:text-orange-400">
								⚠ Type mismatch warning
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Edge Data (if any) */}
			{edge.data && Object.keys(edge.data).length > 0 && (
				<div className="space-y-2 px-3">
					<div className="flex items-center gap-2">
						<span className="rounded bg-muted/50 px-2 py-0.5 font-medium text-muted-foreground text-xs">
							EDGE DATA
						</span>
					</div>
					<div className="rounded border border-border/30 bg-background p-2">
						<JsonHighlighter data={edge.data} />
					</div>
				</div>
			)}
		</div>
	);
};
