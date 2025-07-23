/**
 * NODE INSPECTOR ADAPTER - Simplified facade for node registry integration
 *
 * • Provides clean interface between Node Inspector and node registry
 * • Reduces import churn by centralizing node system interactions
 * • Handles NodeSpec metadata retrieval and validation
 * • Focuses on core adapter functionality
 *
 * Keywords: adapter-pattern, facade, registry-integration, simplified
 */

import type { NodeType } from "../../flow-engine/types/nodeData";
import { getNodeMetadata, validateNode } from "../../node-registry/nodespec-registry";

// ============================================================================
// ADAPTER TYPES
// ============================================================================

/**
 * Simplified node metadata for inspector use
 */
export interface InspectorNodeInfo {
	displayName: string;
	label?: string;
	category: string;
	icon?: string;
	description?: string;
	author?: string;
	feature?: string;
	tags?: string[];
	version?: number;
	runtime?: {
		execute?: string;
	};
	handles?: Array<{
		id: string;
		type: "source" | "target";
		dataType?: string;
		code?: string;
		tsSymbol?: string;
		position: "left" | "right" | "top" | "bottom";
	}>;
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
	isValid: boolean;
	warnings: string[];
	hasControls: boolean;
}

// ============================================================================
// MAIN ADAPTER CLASS
// ============================================================================

/**
 * Simplified adapter for node inspector operations
 * Provides a clean facade over the node registry system
 */
class NodeInspectorAdapterImpl {
	/**
	 * Get node information for the inspector
	 */
	getNodeInfo(nodeType: NodeType): InspectorNodeInfo | null {
		try {
			// Get metadata from registry
			const metadata = getNodeMetadata(nodeType);
			if (!metadata) {
				return null;
			}

			// Validate the node type
			const validation = validateNode(nodeType);

			return {
				displayName: metadata.displayName,
				label: metadata.label,
				category: metadata.category,
				icon: metadata.icon,
				description: metadata.description,
				author: metadata.author,
				feature: metadata.feature,
				tags: metadata.tags,
				version: metadata.version,
				runtime: metadata.runtime,
				handles: metadata.handles,
				controls: metadata.controls,
				isValid: validation.isValid,
				warnings: validation.warnings || [],
				hasControls: this.determineHasControls(nodeType),
			};
		} catch (error) {
			console.error(`[NodeInspectorAdapter] Failed to get info for ${nodeType}:`, error);
			return null;
		}
	}

	/**
	 * Check if a node type has custom controls
	 */
	hasCustomControls(nodeType: NodeType): boolean {
		return this.determineHasControls(nodeType);
	}

	// ============================================================================
	// PRIVATE HELPER METHODS
	// ============================================================================

	/**
	 * Determine if a node type has custom controls available
	 *
	 * All node categories should have controls by default for better UX
	 * This ensures consistent inspector behavior across all node types
	 */
	private determineHasControls(nodeType: NodeType): boolean {
		// Get metadata directly to avoid circular dependency
		const metadata = getNodeMetadata(nodeType);
		if (!metadata) {
			return false;
		}

		// Check if the node has controls configuration
		if (metadata.controls && metadata.controls.autoGenerate !== false) {
			return true;
		}

		// All node categories should have controls by default
		// This provides consistent UX across CREATE, VIEW, TRIGGER, TEST, CYCLE categories
		return true;
	}
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

/**
 * Singleton instance of the NodeInspectorAdapter
 * This reduces import churn and provides a consistent interface
 */
export const NodeInspectorAdapter = new NodeInspectorAdapterImpl();

/**
 * Type export for dependency injection or testing
 */
export type NodeInspectorAdapterType = NodeInspectorAdapterImpl;
