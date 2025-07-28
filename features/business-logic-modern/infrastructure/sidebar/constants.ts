/**
 * SIDEBAR CONSTANTS - Enhanced with NodeSpec Registry Integration
 *
 * • Auto-generates sidebar stencils from NodeSpec registry (single source of truth)
 * • Enhanced with centralized category registry for rich metadata and validation
 * • Provides category-based organization with business rules and themes
 * • Includes type-safe tab configurations and node mappings
 * • Supports dynamic sidebar organization with category registry validation
 * • Advanced category validation and enhanced metadata integration
 *
 * Keywords: sidebar, stencils, tabs, auto-generation, nodespec-registry,
 * categories, validation, enhanced-metadata, single-source-of-truth
 */

import {
	type NodeStencil,
	TAB_CONFIG_A,
	TAB_CONFIG_B,
	TAB_CONFIG_C,
	TAB_CONFIG_D,
	TAB_CONFIG_E,
	type VariantConfig,
} from "./types";

// NodeSpec Registry Integration (Single Source of Truth)
import type { NodeType } from "../flow-engine/types/nodeData";
import type { NodeSpecMetadata } from "../node-registry/nodespec-registry";
import {
	getAllNodeSpecMetadata,
	getNodeSpecMetadata,
	getNodesByCategory,
	getNodesByFolder,
	hasNodeSpec,
} from "../node-registry/nodespec-registry";

export const STORAGE_PREFIX = "sidebar-stencil-order";

// ============================================================================
// NODESPEC REGISTRY UTILITY FUNCTIONS
// ============================================================================

/**
 * Get node metadata from the NodeSpec registry
 */
export function getNodeMetadata(nodeType: NodeType): NodeSpecMetadata | undefined {
	return getNodeSpecMetadata(nodeType) || undefined;
}

/**
 * Get nodes by category from the NodeSpec registry
 */
export function getNodesInCategory(category: string): NodeSpecMetadata[] {
	return getNodesByCategory(category);
}

/**
 * Get nodes by folder from the NodeSpec registry
 */
export function getNodesByFolderName(folder: string): NodeSpecMetadata[] {
	return getNodesByFolder(folder);
}

/**
 * Get category metadata from the node metadata itself
 */
export function getCategoryMetadata(category: string) {
	const nodes = getNodesInCategory(category);
	if (nodes.length === 0) {
		return {
			displayName: category,
			icon: "📁",
			description: `${category} nodes`,
			enabled: false,
			priority: 999,
		};
	}
	// For simplicity, we'll derive the category display info from the first node.
	// A more robust system might have a separate, explicit category registry.
	const representativeNode = nodes[0];
	return {
		displayName: representativeNode.category,
		icon: representativeNode.icon || "📁",
		description: `Nodes related to ${representativeNode.category}`,
		enabled: true,
		priority: representativeNode.ui?.order || 999,
	};
}

/**
 * Check if a node type is valid in the NodeSpec registry
 */
export function isValidNodeType(nodeType: string): nodeType is NodeType {
	return hasNodeSpec(nodeType);
}

// ============================================================================
// ENHANCED CATEGORY REGISTRY UTILITIES
// ============================================================================

/**
 * GET CATEGORY DISPLAY DATA
 * Enhanced with category registry metadata
 */
export function getCategoryDisplayData(category: string) {
	const categoryMetadata = getCategoryMetadata(category);
	return {
		id: category,
		displayName: categoryMetadata?.displayName || category,
		icon: categoryMetadata?.icon || "📁",
		description: categoryMetadata?.description || `${category} nodes`,
		enabled: categoryMetadata?.enabled ?? true,
		priority: categoryMetadata?.priority ?? 999,
	};
}

/**
 * VALIDATE CATEGORY FOR SIDEBAR
 * Enhanced validation with category registry rules
 */
export function validateCategoryForSidebar(category: string): {
	valid: boolean;
	reason?: string;
	nodeCount: number;
	categoryData: ReturnType<typeof getCategoryDisplayData>;
} {
	const categoryData = getCategoryDisplayData(category);
	const nodes = getNodesInCategory(category);
	const nodeCount = nodes.length;

	if (!categoryData.enabled) {
		return {
			valid: false,
			reason: `Category '${category}' is disabled`,
			nodeCount,
			categoryData,
		};
	}

	if (nodeCount === 0) {
		return {
			valid: false,
			reason: `No nodes available in '${category}' category`,
			nodeCount,
			categoryData,
		};
	}

	return { valid: true, nodeCount, categoryData };
}

// ============================================================================
// REGISTRY-ENHANCED AUTO-GENERATION UTILITIES
// ============================================================================

/**
 * CREATE STENCIL FROM NODE METADATA
 * Creates a stencil using NodeSpec registry metadata
 */
export function createStencilFromNodeMetadata(
	metadata: NodeSpecMetadata,
	prefix: string,
	index = 1
): NodeStencil {
	return {
		id: `${prefix}-${metadata.kind.toLowerCase()}-${index}`,
		nodeType: metadata.kind as NodeType,
		label: metadata.label || metadata.displayName,
		description: metadata.description,
		icon: metadata.icon,
		category: metadata.category,
		folder: metadata.ui?.folder,
	};
}

/**
 * CREATE STENCILS BY CATEGORY
 * Generates stencils for all nodes within a specific category
 */
export function createStencilsByCategory(category: string, prefix: string): NodeStencil[] {
	const nodes = getNodesInCategory(category);
	return nodes.map((meta, i) => createStencilFromNodeMetadata(meta, prefix, i));
}

/**
 * CREATE STENCILS BY FOLDER
 * Generates stencils for all nodes within a specific folder
 */
export function createStencilsByFolder(folder: string, prefix: string): NodeStencil[] {
	const nodes = getNodesByFolderName(folder);
	return nodes.map((meta, i) => createStencilFromNodeMetadata(meta, prefix, i));
}

/**
 * CREATE STENCILS BY FILTER
 * Generates stencils based on flexible filtering criteria
 */
export function createStencilsByFilter(
	filter: {
		category?: string;
		folder?: string;
		nodeTypes?: NodeType[];
	},
	prefix: string
): NodeStencil[] {
	let allMeta = getAllNodeSpecMetadata();

	// Apply category filter
	if (filter.category) {
		allMeta = allMeta.filter((meta) => meta.category === filter.category);
	}

	// Apply folder filter
	if (filter.folder) {
		allMeta = allMeta.filter((meta) => meta.ui?.folder === filter.folder);
	}

	// Apply nodeTypes filter
	if (filter.nodeTypes && filter.nodeTypes.length > 0) {
		allMeta = allMeta.filter((meta) => filter.nodeTypes!.includes(meta.kind as NodeType));
	}

	return allMeta.map((meta, i) => createStencilFromNodeMetadata(meta, prefix, i));
}

// ============================================================================
// VARIANT CONFIGURATION
// ============================================================================

/**
 * VARIANT CONFIG - Auto-generated from NodeSpec registry
 * This configuration is dynamically generated based on available nodes
 */
export const VARIANT_CONFIG: VariantConfig = {
	A: {
		tabs: TAB_CONFIG_A,
		stencils: {
			MAIN: createStencilsByCategory("CREATE", "variant-a"),
			ADVANCED: createStencilsByFolder("advanced", "variant-a"),
			IO: createStencilsByFolder("io", "variant-a"),
		},
	},
	B: {
		tabs: TAB_CONFIG_B,
		stencils: {
			CREATE: createStencilsByCategory("CREATE", "variant-b"),
			VIEW: createStencilsByCategory("VIEW", "variant-b"),
			TRIGGER: createStencilsByCategory("TRIGGER", "variant-b"),
			TEST: createStencilsByCategory("TEST", "variant-b"),
			CYCLE: createStencilsByCategory("CYCLE", "variant-b"),
			STORE: createStencilsByCategory("STORE", "variant-b"),
			EMAIL: createStencilsByCategory("EMAIL", "variant-b"),
			FLOW: createStencilsByCategory("FLOW", "variant-b"),
			TIME: createStencilsByCategory("TIME", "variant-b"),
			AI: createStencilsByCategory("AI", "variant-b"),
		},
	},
	C: {
		tabs: TAB_CONFIG_C,
		stencils: {
			ALL: getAllNodeSpecMetadata().map((meta, i) =>
				createStencilFromNodeMetadata(meta, "variant-c", i)
			),
		},
	},
	D: {
		tabs: TAB_CONFIG_D,
		stencils: {
			TOP_NODES: createStencilsByFilter({}, "variant-d"),
		},
	},
	E: {
		tabs: TAB_CONFIG_E,
		stencils: {
			ESSENTIALS: createStencilsByCategory("CYCLE", "variant-e"),
		},
	},
};

// ============================================================================
// SIDEBAR STATISTICS AND VALIDATION
// ============================================================================

/**
 * GET SIDEBAR STATISTICS
 * Provides comprehensive statistics about the sidebar configuration
 */
export function getSidebarStatistics() {
	const totalNodes = getAllNodeSpecMetadata().length;
	const categories = new Set(getAllNodeSpecMetadata().map((n) => n.category));
	const folders = new Set(
		getAllNodeSpecMetadata()
			.map((n) => n.ui?.folder)
			.filter(Boolean)
	);

	return {
		totalNodes,
		totalCategories: categories.size,
		totalFolders: folders.size,
		categories: Array.from(categories),
		folders: Array.from(folders),
		variants: Object.keys(VARIANT_CONFIG).length,
		stencilsPerVariant: Object.fromEntries(
			Object.entries(VARIANT_CONFIG).map(([key, config]) => [
				key,
				Object.values(config.stencils).reduce((total, stencils) => total + stencils.length, 0),
			])
		),
	};
}

/**
 * VALIDATE SIDEBAR CONFIGURATION
 * Comprehensive validation of the sidebar setup
 */
export function validateSidebarConfiguration(): {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	statistics: ReturnType<typeof getSidebarStatistics>;
} {
	const errors: string[] = [];
	const warnings: string[] = [];
	const statistics = getSidebarStatistics();

	// Check if we have any nodes at all
	if (statistics.totalNodes === 0) {
		errors.push("No nodes found in NodeSpec registry");
	}

	// Check each variant
	Object.entries(VARIANT_CONFIG).forEach(([variantKey, config]) => {
		const totalStencils = Object.values(config.stencils).reduce(
			(total, stencils) => total + stencils.length,
			0
		);
		if (totalStencils === 0) {
			warnings.push(`Variant ${variantKey} has no stencils`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		statistics,
	};
}

/**
 * GET NODE TYPE FROM STENCIL ID
 * Extracts the node type from a stencil identifier
 */
export function getNodeTypeFromStencilId(stencilId: string): NodeType | null {
	const stencil = Object.values(VARIANT_CONFIG)
		.flatMap((config) => Object.values(config.stencils))
		.flat()
		.find((s) => s.id === stencilId);

	return (stencil?.nodeType as NodeType) || null;
}

/**
 * REFRESH STENCILS
 * Regenerates all stencils from the current NodeSpec registry state
 */
export function refreshStencils(): typeof VARIANT_CONFIG {
	return {
		A: {
			tabs: TAB_CONFIG_A,
			stencils: {
				MAIN: createStencilsByCategory("CREATE", "variant-a"),
				ADVANCED: createStencilsByFolder("advanced", "variant-a"),
				IO: createStencilsByFolder("io", "variant-a"),
			},
		},
		B: {
			tabs: TAB_CONFIG_B,
			stencils: {
				CREATE: createStencilsByCategory("CREATE", "variant-b"),
				VIEW: createStencilsByCategory("VIEW", "variant-b"),
				TRIGGER: createStencilsByCategory("TRIGGER", "variant-b"),
				TEST: createStencilsByCategory("TEST", "variant-b"),
				CYCLE: createStencilsByCategory("CYCLE", "variant-b"),
				STORE: createStencilsByCategory("STORE", "variant-b"),
			},
		},
		C: {
			tabs: TAB_CONFIG_C,
			stencils: {
				ALL: getAllNodeSpecMetadata().map((meta, i) =>
					createStencilFromNodeMetadata(meta, "variant-c", i)
				),
			},
		},
		D: {
			tabs: TAB_CONFIG_D,
			stencils: {
				TOP_NODES: createStencilsByFilter({}, "variant-d"),
			},
		},
		E: {
			tabs: TAB_CONFIG_E,
			stencils: {
				ESSENTIALS: createStencilsByCategory("CYCLE", "variant-e"),
			},
		},
	};
}

/**
 * LOG SIDEBAR DEBUG INFO
 * Outputs comprehensive debug information about the sidebar state
 */
export function logSidebarDebugInfo(): void {
	const stats = getSidebarStatistics();
	const validation = validateSidebarConfiguration();

	// Debug info available but not logged to console
}
