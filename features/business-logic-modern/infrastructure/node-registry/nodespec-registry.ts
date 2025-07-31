/**
 * NodeSpec Registry - Pure Single Source of Truth
 *
 * This registry directly uses NodeSpec from each .node.tsx file as the single source of truth.
 * No duplication, no manual maintenance - everything comes from NodeSpec.
 */

import { spec as aiAgentSpec } from "../../node-domain/ai/aiAgent.node";
import { spec as createTextSpec } from "../../node-domain/create/createText.node";
import { spec as storeInMemorySpec } from "../../node-domain/create/storeInMemory.node";
import { spec as emailAccountSpec } from "../../node-domain/email/emailAccount.node";
import { spec as emailCreatorSpec } from "../../node-domain/email/emailCreator.node";
import { spec as emailReaderSpec } from "../../node-domain/email/emailReader.node";
import { spec as emailReplierSpec } from "../../node-domain/email/emailReplier.node";
import { spec as emailTemplateSpec } from "../../node-domain/email/emailTemplate.node";
import { spec as emailBrandSpec } from "../../node-domain/email/emailBrand.node";
import { spec as flowConditionalSpec } from "../../node-domain/flow/flowConditional.node";
import { spec as testNodeSpec } from "../../node-domain/test/testNode.node";
import { spec as triggerPulseSpec } from "../../node-domain/trigger/triggerPulse.node";
import { spec as triggerToggleSpec } from "../../node-domain/trigger/triggerToggle.node";
import { spec as viewBooleanSpec } from "../../node-domain/view/viewBoolean.node";
import { spec as viewTextSpec } from "../../node-domain/view/viewText.node";
import type { NodeSpec } from "../node-core/NodeSpec";

// Collect all specs in one place
const nodeSpecs: Record<string, NodeSpec> = {
	flowConditional: flowConditionalSpec,
	viewBoolean: viewBooleanSpec,
	triggerPulse: triggerPulseSpec,
	// Add new node specs here (auto-updated by Plop)
	createText: createTextSpec,
	aiAgent: aiAgentSpec,
	storeInMemory: storeInMemorySpec,
	emailAccount: emailAccountSpec,
	emailReader: emailReaderSpec,
	emailCreator: emailCreatorSpec,
	emailReplier: emailReplierSpec,
	emailTemplate: emailTemplateSpec,
	emailBrand: emailBrandSpec,
	testNode: testNodeSpec,
	triggerToggle: triggerToggleSpec,
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
	tags?: string[];
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
	icon: "Wrench",
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
 * Get all available NodeSpec metadata (legacy function - includes all nodes)
 * @deprecated Use getAllNodeSpecMetadataWithFeatureFlags() for feature flag filtering
 */
export function getAllNodeSpecMetadata(): NodeSpecMetadata[] {
	return Object.keys(nodeSpecs)
		.map((nodeType) => {
			const metadata = getNodeMetadata(nodeType);
			if (!metadata) {
				console.warn(`No metadata found for node type: ${nodeType}`);
				return null;
			}
			return metadata;
		})
		.filter((metadata): metadata is NodeSpecMetadata => metadata !== null);
}

/**
 * Check if a node type exists in the registry
 */
export function hasNodeSpec(nodeType: string): boolean {
	return nodeType in nodeSpecs;
}

/**
 * Get nodes by category
 */
export function getNodesByCategory(category: string): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata().filter((node) => node.category === category);
}

/**
 * Get nodes by folder
 */
export function getNodesByFolder(folder: string): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata().filter((node) => node.ui?.folder === folder);
}

/**
 * Get all available node metadata (legacy alias)
 */
export function getAllNodeMetadata(): NodeSpecMetadata[] {
	return getAllNodeSpecMetadata();
}

/**
 * Get sidebar statistics for debugging
 */
export function getSidebarStatistics() {
	const allNodes = getAllNodeSpecMetadata();
	const categories = [...new Set(allNodes.map((node) => node.category))];
	const folders = [...new Set(allNodes.map((node) => node.ui?.folder).filter(Boolean))];

	return {
		totalNodes: allNodes.length,
		categories,
		folders,
	};
}

/**
 * Validate sidebar configuration
 */
export function validateSidebarConfiguration() {
	const allNodes = getAllNodeSpecMetadata();
	const errors: string[] = [];

	// Check for duplicate node types
	const nodeTypes = allNodes.map((node) => node.kind);
	const duplicates = nodeTypes.filter((type, index) => nodeTypes.indexOf(type) !== index);
	if (duplicates.length > 0) {
		errors.push(`Duplicate node types found: ${duplicates.join(", ")}`);
	}

	// Check for missing required fields
	allNodes.forEach((node) => {
		if (!node.displayName) {
			errors.push(`Node ${node.kind} is missing displayName`);
		}
		if (!node.category) {
			errors.push(`Node ${node.kind} is missing category`);
		}
	});

	return {
		isValid: errors.length === 0,
		errors,
	};
}

// Export the specs for direct access if needed
export { nodeSpecs };

// Compatibility functions to match old registry interface
export function getNodeMetadata(nodeType: string): NodeSpecMetadata | null {
	const spec = nodeSpecs[nodeType as keyof typeof nodeSpecs];
	if (!spec) {
		return null;
	}

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
		tags: spec.tags,
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

// Legacy helpers for quick validation & map
export function validateNode(nodeType: string) {
	const meta = getNodeMetadata(nodeType);
	return {
		isValid: !!meta,
		warnings: meta ? [] : [`Node type '${nodeType}' not found`],
		suggestions: meta ? [] : ["Generate the node via Plop and ensure it is registered."],
	};
}

// Map keyed by nodeType for convenience (mirrors old modernNodeRegistry constant)
export const modernNodeRegistry = new Map(getAllNodeMetadata().map((m) => [m.kind, m]));

/**
 * Get feature flag configuration for a node type
 */
export function getNodeFeatureFlag(nodeType: string): any {
	const spec = nodeSpecs[nodeType as keyof typeof nodeSpecs];
	return spec?.featureFlag || null;
}

/**
 * Alias for getNodeMetadata to maintain compatibility with existing code
 */
export const getNodeSpecMetadata = getNodeMetadata;
