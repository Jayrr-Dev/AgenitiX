/**
 * NODE INSPECTOR TYPES - Type definitions for node inspection and editing
 *
 * • Defines interfaces for node inspector components and their props
 * • Provides type safety for error handling and logging functionality
 * • Includes base control types for extensible node property editors
 * • Defines inspector state and editing control interfaces
 * • Centralizes all node inspector type definitions for consistency
 *
 * Keywords: types, interfaces, node-inspector, props, errors, controls, state
 */

import type {
	AgenEdge,
	AgenNode,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

// ============================================================================
// CORE NODE INSPECTOR TYPES
// ============================================================================

export interface NodeInspectorProps {
	/** The currently selected node (or null if none) */
	node: AgenNode | null;
	/** The currently selected edge (or null if none) */
	selectedEdge: AgenEdge | null;
	/** All nodes in the flow (needed for edge source/target info) */
	allNodes: AgenNode[];
	/** Helper that mutates node.data; same fn you already have in FlowEditor */
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	/** Computed output string (optional) */
	output: string | null;
	/** Array of errors for the current node */
	errors: NodeError[];
	/** Function to clear errors for the current node */
	onClearErrors?: () => void;
	/** Function to log new errors */
	onLogError: (nodeId: string, message: string, type?: ErrorType, source?: string) => void;
	/** Function to update node ID (optional) */
	onUpdateNodeId?: (oldId: string, newId: string) => void;
	/** Function to delete the current node (optional) */
	onDeleteNode?: (nodeId: string) => void;
	/** Function to duplicate the current node (optional) */
	onDuplicateNode?: (nodeId: string) => void;
	/** Function to delete the current edge (optional) */
	onDeleteEdge?: (edgeId: string) => void;
	/** Whether the inspector is locked */
	inspectorLocked: boolean;
	/** Function to set the inspector lock state */
	setInspectorLocked: (locked: boolean) => void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface NodeError {
	timestamp: number;
	message: string;
	type: ErrorType;
	source?: string;
	category?: "system" | "user" | "network" | "validation";
	severity?: "low" | "medium" | "high" | "critical";
	recoverable?: boolean;
	nodeId?: string;
	stackTrace?: string;
	context?: Record<string, any>;
}

export type ErrorType = "error" | "warning" | "info";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

export interface BaseControlProps {
	node: AgenNode;
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
}

export interface JsonHighlighterProps {
	data: unknown;
	className?: string;
}

export interface NodeControlsProps extends BaseControlProps {
	onLogError: (nodeId: string, message: string, type?: ErrorType, source?: string) => void;
}

export interface InspectorState {
	durationInput: string;
	countInput: string;
	multiplierInput: string;
	delayInput: string;
}

export interface EditingRefs {
	isEditingCount: boolean;
	isEditingMultiplier: boolean;
	isEditingDuration: boolean;
	isEditingDelay: boolean;
}

// Node type mappings for better type safety
export type NodeType = AgenNode["type"];

export interface NodeTypeConfig {
	hasOutput: boolean;
	hasControls: boolean;
	displayName: string;
}
