/**
 * FLOW ENGINE TYPES - TypeScript type definitions for modern node domain
 *
 * • Type definitions for all nodes in the modern business logic system
 * • Matches actual node-domain structure (create, view, trigger, test, cycle)
 * • ReactFlow integration types for nodes and edges
 * • Type-safe node configurations and state management
 * • Error tracking and callback interface definitions
 *
 * Keywords: TypeScript, node-domain, type-definitions, ReactFlow, modern-business-logic
 */

import type { Edge, Node, Position } from "@xyflow/react";

// ============================================================================
// BASE NODE DATA INTERFACE
// ============================================================================

export interface BaseNodeData {
	/** Error message if node encounters issues */
	error?: string;
	/** Whether node should propagate data downstream */
	isActive?: boolean;
	/** Vibe Mode error injection properties */
	isErrorState?: boolean;
	errorType?: "warning" | "error" | "critical";
	/** Allow additional properties for flexibility */
	[key: string]: any;
}

// ============================================================================
// CREATE DOMAIN NODE DATA INTERFACES
// ============================================================================

export interface CreateTextData extends BaseNodeData {
	text: string;
	heldText: string;
}

// ============================================================================
// VIEW DOMAIN NODE DATA INTERFACES
// ============================================================================

export interface ViewOutputData extends BaseNodeData {
	label: string;
	displayedValues: Array<{
		type: string;
		content: any;
		id: string;
		timestamp?: number;
	}>;
	maxHistory?: number;
	autoScroll?: boolean;
	showTypeIcons?: boolean;
	groupSimilar?: boolean;
	filterEmpty?: boolean;
	filterDuplicates?: boolean;
	includedTypes?: string[];
}

export interface ViewTextData extends BaseNodeData {
	store: string;
	isEnabled: boolean;
	isActive: boolean;
	isExpanded: boolean;
	inputs?: string;
	outputs?: string;
}

export interface CreateTextData extends BaseNodeData {
	store: string;
	isEnabled: boolean;
	isActive: boolean;
	isExpanded: boolean;
	inputs?: string;
	outputs?: string;
}

// ============================================================================
// TRIGGER DOMAIN NODE DATA INTERFACES
// ============================================================================

export interface TriggerOnToggleData extends BaseNodeData {
	triggered: boolean;
	value: boolean;
	outputValue: boolean;
	type: string;
	label: string;
	inputCount: number;
	hasExternalInputs: boolean;
}

// ============================================================================
// TEST DOMAIN NODE DATA INTERFACES
// ============================================================================

export interface TestErrorData extends BaseNodeData {
	errorMessage: string;
	errorType: "warning" | "error" | "critical";
	triggerMode: "always" | "trigger_on" | "trigger_off";
	isGeneratingError: boolean;
	text: string;
	json: any;
}

// ============================================================================
// CYCLE DOMAIN NODE DATA INTERFACES (RESERVED)
// ============================================================================

export interface CyclePulseData extends BaseNodeData {
	triggered: boolean;
	isRunning?: boolean;
	initialState?: boolean;
	cycleDuration?: number;
	pulseDuration?: number;
	infinite?: boolean;
	maxCycles?: number;
}

// ============================================================================
// MODERN NODE UNION TYPES
// ============================================================================

export type AgenNode =
	// Legacy Nodes (for backward compatibility)
	| Node<CreateTextData, "createText">
	| Node<ViewOutputData, "viewOutput">
	| Node<TriggerOnToggleData, "triggerOnToggle">
	| Node<TestErrorData, "testError">
	| Node<ViewTextData, "viewText">;

export type AgenEdge = Edge & {
	sourceHandle?: string | null;
	targetHandle?: string | null;
	type: "custom" | "step" | "default";
	style?: { stroke: string; strokeWidth: number };
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NodeType = NonNullable<AgenNode["type"]>;

export interface NodeError {
	timestamp: number;
	message: string;
	type: "error" | "warning" | "info";
	source?: string;
}

export interface FlowEditorState {
	nodes: AgenNode[];
	edges: AgenEdge[];
	selectedNodeId: string | null;
	copiedNodes: AgenNode[];
	copiedEdges: AgenEdge[];
	nodeErrors: Record<string, NodeError[]>;
	showHistoryPanel: boolean;
}

export interface TypeMapEntry {
	label: string;
	color: string;
}

export type TypeMap = Record<string, TypeMapEntry>;

// ============================================================================
// CALLBACK TYPES
// ============================================================================

export interface FlowEditorCallbacks {
	updateNodeData: (id: string, patch: Record<string, unknown>) => void;
	logNodeError: (
		nodeId: string,
		message: string,
		type?: NodeError["type"],
		source?: string
	) => void;
	clearNodeErrors: (nodeId: string) => void;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface NodeDefaultData {
	[key: string]: unknown;
}

export interface NodeTypeConfig {
	defaultData: NodeDefaultData;
	hasTargetPosition?: boolean;
	targetPosition?: Position;
	hasOutput?: boolean;
	hasControls?: boolean;
	displayName?: string;
}

export type NodeTypeConfigMap = Record<NodeType, NodeTypeConfig>;

// ============================================================================
// DOMAIN CATEGORIES
// ============================================================================

export type DomainCategory = "create" | "view" | "trigger" | "test" | "cycle" | "store";

export interface DomainMetadata {
	category: DomainCategory;
	icon: string;
	description: string;
	nodeTypes: NodeType[];
}

export type DomainMetadataMap = Record<DomainCategory, DomainMetadata>;
