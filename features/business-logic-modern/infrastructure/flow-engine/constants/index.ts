/**
 * FLOW ENGINE CONSTANTS - Configuration and type definitions
 *
 * • Central configuration for node types, data types, and UI constants
 * • Type mapping system for handle colors and validation
 * • Node type configurations with default data and display settings
 * • Registry integration for dynamic node type management
 * • Keyboard shortcuts and UI behavior constants
 *
 * Keywords: constants, node-types, type-mapping, configuration, registry, keyboard-shortcuts
 */

import { ULTIMATE_TYPE_MAP } from "@/components/nodes/handles/TypeSafeHandle";
import type {
	AgenEdge,
	AgenNode,
	NodeTypeConfig,
	NodeTypeConfigMap,
	TypeMap,
} from "../types/nodeData";

// ============================================================================
// TYPE LEGEND & COLORS (unified with UltimateTypesafeHandle)
// ============================================================================

/**
 * UNIFIED TYPE SYSTEM - Now uses UltimateTypesafeHandle as single source of truth
 */
export const TYPE_MAP: TypeMap = new Proxy({} as TypeMap, {
	get(_target, prop: string) {
		// Direct mapping for types
		if (ULTIMATE_TYPE_MAP[prop]) {
			return {
				label: ULTIMATE_TYPE_MAP[prop].label,
				color: `var(--core-handle-types-${ULTIMATE_TYPE_MAP[prop].tokenKey}-color)`,
			};
		}
		// Fallback for unknown types
		return { label: prop, color: "#6b7280" }; // gray
	},
	ownKeys() {
		return Object.keys(ULTIMATE_TYPE_MAP);
	},
	has(_target, prop) {
		return prop in ULTIMATE_TYPE_MAP;
	},
});

// ============================================================================
// NODE TYPE CONFIGURATION - Modern Registry Integration
// ============================================================================

import { getNodeMetadata, modernNodeRegistry } from "../../node-registry/nodespec-registry";

/**
 * NODE_TYPE_CONFIG - Dynamic configuration based on modern node registry
 * This creates a proxy that dynamically generates node configurations from the registry
 */
export const NODE_TYPE_CONFIG = new Proxy({} as Record<string, NodeTypeConfig>, {
	get(_target, nodeType: string) {
		const metadata = getNodeMetadata(nodeType);
		if (!metadata) {
			console.warn(`No metadata found for node type: ${nodeType}`);
			return undefined;
		}

		// Convert metadata to the expected configuration format
		return {
			defaultData: Object.fromEntries(
				Object.entries(metadata.data || {}).map(([key, config]) => [
					key,
					(config as any)?.default || null,
				])
			),
			hasTargetPosition: false,
			hasOutput: true,
			hasControls: true,
			displayName: metadata.displayName,
		} as NodeTypeConfig;
	},
	has(_target, nodeType) {
		return modernNodeRegistry.has(nodeType as string);
	},
	ownKeys() {
		return Array.from(modernNodeRegistry.keys());
	},
}) as NodeTypeConfigMap;

/**
 * Get node type configuration from the modern registry
 * @param nodeType - The node type to get configuration for
 * @returns Node configuration object or undefined if not found
 */
export const getNodeTypeConfig = (nodeType: string): NodeTypeConfig | undefined => {
	return (NODE_TYPE_CONFIG as any)[nodeType];
};

// ============================================================================
// INITIAL DEMO GRAPH
// ============================================================================

export const INITIAL_NODES: AgenNode[] = [
	// Nodes will be added here after recreation via Plop
];

export const INITIAL_EDGES: AgenEdge[] = [
	// Edges will be added here after recreation via Plop
];

// ============================================================================
// KEYBOARD & UI CONSTANTS
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
	DELETE: ["Delete", "Backspace"],
	DUPLICATE: "d",
	COPY: "c",
	PASTE: "v",
	LOCK_INSPECTOR: "a",
	ESCAPE: "Escape",
	TOGGLE_HISTORY: "h",
	SELECT_ALL: "a",
	DELETE_NODES: "q",
	TOGGLE_INSPECTOR: "a",
	DUPLICATE_NODE: "w",
	TOGGLE_SIDEBAR: "s",
};

// ============================================================================
// CONFIGURATION CONSTANTS
// ============================================================================

export const COPY_PASTE_OFFSET = 40;
export const MAX_ERRORS_PER_NODE = 10;
export const NODE_ID_PREFIX = "node-";
export const EDGE_ID_PREFIX = "edge-";

// ============================================================================
// VALIDATION CONSTANTS
// ============================================================================

export const VALIDATION = {
	MIN_PULSE_DURATION: 50,
	MIN_DELAY: 0,
	MIN_CYCLE_DURATION: 100,
	MIN_INPUT_COUNT: 1,
	MAX_INPUT_COUNT: 10,
} as const;
