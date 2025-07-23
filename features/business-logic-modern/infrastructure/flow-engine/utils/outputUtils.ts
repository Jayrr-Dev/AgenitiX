/**
 * OUTPUT UTILS - Node output computation and formatting utilities
 *
 * • Computes and formats output values for different node types
 * • Handles value extraction and display formatting consistently
 * • Provides utilities for finding incoming and outgoing node connections
 * • Supports complex data type formatting with safe stringification
 * • Integrates with node value extraction system for consistency
 *
 * Keywords: output-computation, value-formatting, node-connections, data-types, stringification
 */

import type { AgenEdge, AgenNode } from "../types/nodeData";
import { extractNodeValue, safeStringify } from "./nodeUtils";

/**
 * Computes the output string for a given node
 */
export function getNodeOutput(
	node: AgenNode,
	allNodes: AgenNode[],
	allEdges: AgenEdge[]
): string | null {
	// Use extractNodeValue for consistent value extraction
	const extractedValue = extractNodeValue(node.data);

	if (node.type === "viewOutput" || node.type === "viewText") {
		const incoming = allEdges
			.filter((e) => e.target === node.id)
			.map((e) => allNodes.find((n) => n.id === e.source))
			.filter(Boolean) as AgenNode[];

		const values = incoming
			.map((n) => {
				const value = extractNodeValue(n.data);
				return value !== undefined && value !== null ? value : null;
			})
			.filter((value) => value !== null);

		return values.map((value) => formatValue(value)).join(", ");
	}

	// For all other node types, format the extracted value
	if (extractedValue === undefined || extractedValue === null) return null;

	return formatValue(extractedValue);
}

/**
 * Formats a value for display in the output
 */
export function formatValue(value: unknown): string {
	if (typeof value === "string") return value;

	if (typeof value === "number") {
		if (Number.isNaN(value)) return "NaN";
		if (!Number.isFinite(value)) return value > 0 ? "Infinity" : "-Infinity";
		return value.toString();
	}

	if (typeof value === "boolean") return value ? "true" : "false";
	if (typeof value === "bigint") return value.toString() + "n";

	try {
		return safeStringify(value);
	} catch {
		return String(value);
	}
}

/**
 * Gets all incoming nodes for a given node
 */
export function getIncomingNodes(
	nodeId: string,
	allNodes: AgenNode[],
	allEdges: AgenEdge[]
): AgenNode[] {
	return allEdges
		.filter((e) => e.target === nodeId)
		.map((e) => allNodes.find((n) => n.id === e.source))
		.filter(Boolean) as AgenNode[];
}

/**
 * Gets all outgoing nodes for a given node
 */
export function getOutgoingNodes(
	nodeId: string,
	allNodes: AgenNode[],
	allEdges: AgenEdge[]
): AgenNode[] {
	return allEdges
		.filter((e) => e.source === nodeId)
		.map((e) => allNodes.find((n) => n.id === e.target))
		.filter(Boolean) as AgenNode[];
}
