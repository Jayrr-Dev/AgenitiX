/**
 * NodeSpec Registry - Pure Single Source of Truth
 *
 * This registry directly uses NodeSpec from each .node.tsx file as the single source of truth.
 * No duplication, no manual maintenance - everything comes from NodeSpec.
 */

import createText, { spec as createTextSpec } from "../../node-domain/create/createText.node";
import testNode, { spec as testNodeSpec } from "../../node-domain/test/testNode.node";
import viewText, { spec as viewTextSpec } from "../../node-domain/view/viewText.node";
import type { NodeSpec } from "../node-core/NodeSpec";

// Collect all specs in one place
const nodeSpecs: Record<string, NodeSpec> = {
	// Add new node specs here (auto-updated by Plop)
	createText: createTextSpec,
	testNode: testNodeSpec,
	viewText: viewTextSpec,
};

// Enhanced metadata that combines NodeSpec with additional UI properties
export interface NodeSpecMetadata {
	kind: string;
	displayName: string;
	label?: string;
	category: string;
	description: string;
	icon: string;
	author?: string;
	feature?: string;
	version?: number;
	runtime?: {
		execute?: string;
	};
	controls?: {
		autoGenerate?: boolean;
		excludeFields?: string[];
		customFields?: Array<{
			key: string;
			type: string;
			label?: string;
			placeholder?: string;
			ui?: Record<string, any>;
		}>;
	};
	/** legacy alias of kind */
	nodeType: string;
	/** optional component name for legacy sidebar */
	component?: string;
	size: {
		expanded: { width: number; height: number | "auto" };
		collapsed: { width: number; height: number };
	};
	handles: Array<{
		id: string;
		type: "source" | "target";
		dataType?: string;
		code?: string;
		tsSymbol?: string;
		position: "left" | "right" | "top" | "bottom";
	}>;
	initialData: Record<string, any>;
	/** Legacy alias for initialData (enables gradual migration) */
	data?: Record<string, any>;
	inspector: {
		key: string;
	};
	ui?: {
		defaultCollapsed?: boolean;
		folder?: string;
		order?: number;
	};
	/** legacy sidebar object */
	sidebar?: {
		folder?: string;
		order?: number;
	};
}

// Default metadata for nodes (can be overridden)
const defaultNodeMetadata = {
	description: "Node description",
	icon: "🔧",
	ui: {
		defaultCollapsed: false,
		folder: "general",
		order: 1,
	},
};

// Node-specific metadata overrides
const nodeMetadataOverrides: Record<string, Partial<NodeSpecMetadata>> = {
	// Add more node-specific overrides here
};

/**
 * Get NodeSpec metadata by node type
 */
export function getNodeSpecMetadata(nodeType: string): NodeSpecMetadata | null {
	const spec = nodeSpecs[nodeType as keyof typeof nodeSpecs];
	if (!spec) return null;

	const overrides = nodeMetadataOverrides[nodeType] || {};
	const defaults = defaultNodeMetadata;

	return {
		kind: spec.kind,
		displayName: spec.displayName,
		label: spec.label,
		category: spec.category,
		description: spec.description || overrides.description || defaults.description,
		icon: spec.icon || overrides.icon || defaults.icon,
		author: spec.author,
		feature: spec.feature,
		version: spec.version,
		runtime: spec.runtime,
		controls: spec.controls,
		nodeType: spec.kind,
		component: spec.kind,
		size: {
			expanded: {
				width: spec.size.expanded.width,
				height: spec.size.expanded.height,
			},
			collapsed: {
				width: spec.size.collapsed.width,
				height: spec.size.collapsed.height,
			},
		},
		handles: spec.handles,
		initialData: spec.initialData,
		data: spec.initialData,
		inspector: spec.inspector,
		ui: {
			...defaults.ui,
			...overrides.ui,
		},
		sidebar: {
			folder: spec.kind,
			order: 1,
		},
	};
}

/**
 * Get all available NodeSpec metadata
 */
export function getAllNodeSpecMetadata(): NodeSpecMetadata[] {
	return Object.keys(nodeSpecs).map((nodeType) => {
		const metadata = getNodeSpecMetadata(nodeType);
		return metadata!; // We know it exists since we're iterating over nodeSpecs keys
	});
}

/**
 * Check if a node type exists
 */
export function hasNodeSpec(nodeType: string): boolean {
	return nodeType in nodeSpecs;
}

/**
 * Get all available node types
 */
export function getAllNodeTypes(): string[] {
	return Object.keys(nodeSpecs);
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: string): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata().filter((spec) => spec.category === category);
}

/**
 * Get nodes by folder (from ui.folder)
 */
export function getNodesByFolder(folder: string): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata().filter((spec) => spec.ui?.folder === folder);
}

/**
 * Get all categories
 */
export function getAllCategories(): string[] {
	const categories = new Set(getAllNodeSpecMetadata().map((spec) => spec.category));
	return Array.from(categories);
}

/**
 * Get all folders
 */
export function getAllFolders(): string[] {
	const folders = new Set(
		getAllNodeSpecMetadata()
			.map((spec) => spec.ui?.folder)
			.filter(Boolean)
	);
	return Array.from(folders) as string[];
}

// Export the specs for direct access if needed
export { nodeSpecs };

// Compatibility functions to match old registry interface
export function getNodeMetadata(nodeType: string): NodeSpecMetadata | null {
	return getNodeSpecMetadata(nodeType);
}

export function getAllNodeMetadata(): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata();
}

// Legacy helpers for quick validation & map
export function validateNode(nodeType: string) {
	const meta = getNodeSpecMetadata(nodeType);
	return {
		isValid: !!meta,
		warnings: meta ? [] : [`Node type '${nodeType}' not found`],
		suggestions: meta ? [] : ["Generate the node via Plop and ensure it is registered."],
	};
}

// Map keyed by nodeType for convenience (mirrors old modernNodeRegistry constant)
export const modernNodeRegistry = new Map(getAllNodeSpecMetadata().map((m) => [m.kind, m]));
