/**
 * CONNECTION UTILS - Handle validation and edge styling utilities
 *
 * • Validates connections between handles based on data type compatibility
 * • Provides edge styling and coloring based on data types and node categories
 * • Supports union types and any-type connections
 * • Generates unique edge IDs and styling configurations
 * • Integrates with type mapping system and category theming for consistent visuals
 *
 * Keywords: connections, validation, edge-styling, data-types, union-types, type-mapping, category-theming
 */

import type { Connection } from "@xyflow/react";
import { getNodeMetadata } from "../features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { TYPE_MAP } from "../features/business-logic-modern/infrastructure/flow-engine/constants";
import type { AgenNode } from "../features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

// CATEGORY COLOR MAPPING
const CATEGORY_EDGE_COLORS = {
	create: "#3b82f6", // Blue - matches create category
	view: "#6b7280", // Gray - matches view category
	trigger: "#6b7280", // Gray - let data types determine color (boolean = green)
	test: "#eab308", // Yellow - matches test category
	cycle: "#10b981", // Green - matches cycle category
} as const;

/**
 * HELPER: Get handle data type from registry
 * Looks up the actual dataType for a handle ID from the node registry
 */
function getHandleDataType(nodeType: string, handleId: string): string {
	try {
		const metadata = getNodeMetadata(nodeType);
		const handle = metadata?.handles?.find((h) => h.id === handleId);
		return handle?.dataType || "x"; // Default to 'any'
	} catch (error) {
		console.warn("[ConnectionUtils] Failed to get handle data type:", error);
		return "x"; // Default to 'any' type
	}
}

/**
 * HELPER: Get source node category for edge coloring
 * Looks up the category of the source node from the registry
 */
function getSourceNodeCategory(connection: Connection, nodes?: AgenNode[]): string | null {
	if (!connection.source || !nodes) {
		return null;
	}

	try {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		if (sourceNode?.type) {
			const metadata = getNodeMetadata(sourceNode.type);
			return metadata?.category || null;
		}
		return null;
	} catch (error) {
		console.warn("[ConnectionUtils] Failed to get source node category:", error);
		return null;
	}
}

/**
 * Validates if a connection between two handles is valid
 */
export function validateConnection(connection: Connection): boolean {
	// This is now handled by the UltimateTypesafeHandle system at the component level.
	// This function is kept for legacy purposes but can be considered deprecated.
	return true;
}

/**
 * Gets the data type for edge styling based on source handle
 * Now properly looks up the data type from the registry instead of parsing handle IDs
 */
export function getConnectionDataType(connection: Connection, nodes: AgenNode[]): string {
	if (!connection.sourceHandle || !connection.source) {
		return "s"; // fallback to string
	}

	try {
		const sourceNode = nodes.find((n) => n.id === connection.source);
		if (sourceNode && sourceNode.type) {
			return getHandleDataType(sourceNode.type, connection.sourceHandle);
		}
		return "s"; // fallback if node or type not found
	} catch (error) {
		console.warn("[ConnectionUtils] Failed to get connection data type:", error);
		return "s"; // fallback to string
	}
}

/**
 * Gets the color for an edge based on data type and optionally source node category
 */
export function getEdgeColor(dataType: string, sourceCategory?: string | null): string {
	// PRIORITY 1: Boolean types should always be green when active (per cursor rules)
	if (dataType === "b" || dataType === "boolean") {
		return "#10b981"; // Green for boolean/triggers (activation state)
	}

	// PRIORITY 2: Data type coloring for consistency
	if (TYPE_MAP[dataType]?.color) {
		return TYPE_MAP[dataType].color;
	}

	// PRIORITY 3: Category-based coloring as fallback for unknown types
	if (sourceCategory && CATEGORY_EDGE_COLORS[sourceCategory as keyof typeof CATEGORY_EDGE_COLORS]) {
		return CATEGORY_EDGE_COLORS[sourceCategory as keyof typeof CATEGORY_EDGE_COLORS];
	}

	// Final fallback to gray
	return "#6b7280";
}

/**
 * Creates edge style object for a given data type and connection
 */
export function createEdgeStyle(
	dataType: string,
	strokeWidth = 2,
	connection?: Connection,
	nodes?: AgenNode[]
) {
	// Get source node category for enhanced coloring
	const sourceCategory = connection ? getSourceNodeCategory(connection, nodes) : null;

	return {
		stroke: getEdgeColor(dataType, sourceCategory),
		strokeWidth,
	};
}

/**
 * Generates a unique edge ID based on source and target IDs
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
	return `edge::${sourceId}::${targetId}`;
}
