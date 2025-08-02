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
  /** Node expansion state for UI */
  isExpanded?: boolean;
  /** Node label for display */
  label?: string;
  /** Node description for documentation */
  description?: string;
  /** Handle position overrides for custom positioning */
  handleOverrides?: Array<{
    handleId: string;
    position: "top" | "bottom" | "left" | "right";
  }>;
  /** Additional properties for flexibility - use unknown for type safety */
  [key: string]: unknown;
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

export interface ViewOutputDisplayValue {
  type: string;
  content: unknown;
  id: string;
  timestamp?: number;
}

export interface ViewOutputData extends BaseNodeData {
  label: string;
  displayedValues: ViewOutputDisplayValue[];
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
  output?: string;
}

export interface CreateTextData extends BaseNodeData {
  store: string;
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  inputs?: string;
  output?: string;
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
  json: Record<string, unknown>;
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
// AI AGENT DATA TYPES
// ============================================================================

export interface AiAgentData extends BaseNodeData {
  userInput: string;
  triggerInputs: string;
  trigger: string;
  isProcessing: boolean;
  systemPrompt: string;
  selectedProvider: "openai" | "anthropic" | "google" | "custom";
  selectedModel: string;
  temperature: number;
  maxSteps: number;
  threadId: string;
  processingResult: string;
  store: string;
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  inputs: string;
  output: string;
}

// ============================================================================
// TRIGGER TOGGLE DATA TYPES
// ============================================================================

export interface TriggerToggleData extends BaseNodeData {
  store: boolean;
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  inputs: boolean;
  output: boolean;
  expandedSize: string;
  collapsedSize: string;
  label?: string;
}

// ============================================================================
// STORE IN MEMORY DATA TYPES
// ============================================================================

export interface StoreInMemoryData extends BaseNodeData {
  key: string;
  value: string;
  operation: "set" | "get" | "delete" | "clear";
  dataType: "string" | "number" | "boolean" | "json";
  isEnabled: boolean;
  isActive: boolean;
  isExpanded: boolean;
  inputs: string;
  output: string;
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
  | Node<ViewTextData, "viewText">
  // New Node Types
  | Node<AiAgentData, "aiAgent">
  | Node<TriggerToggleData, "triggerToggle">
  | Node<StoreInMemoryData, "storeInMemory">;

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

export type DomainCategory =
  | "create"
  | "view"
  | "trigger"
  | "test"
  | "cycle"
  | "store"
  | "ai";

export interface DomainMetadata {
  category: DomainCategory;
  icon: string;
  description: string;
  nodeTypes: NodeType[];
}

export type DomainMetadataMap = Record<DomainCategory, DomainMetadata>;
