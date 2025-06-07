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

export interface CreateTextV2Data extends BaseNodeData {
  text: string;
  heldText: string;
  // V2 metadata tracking
  _v2RegistryVersion?: string;
  _v2CreatedAt?: number;
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
  // Create Domain
  | (Node<CreateTextData & Record<string, unknown>> & {
      type: "createText";
    })
  | (Node<CreateTextV2Data & Record<string, unknown>> & {
      type: "createTextV2";
    })

  // View Domain
  | (Node<ViewOutputData & Record<string, unknown>> & {
      type: "viewOutput";
      targetPosition: Position;
    })

  // Trigger Domain
  | (Node<TriggerOnToggleData & Record<string, unknown>> & {
      type: "triggerOnToggle";
    })

  // Test Domain
  | (Node<TestErrorData & Record<string, unknown>> & {
      type: "testError";
    });

export type AgenEdge = Edge & {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: "custom" | "step" | "default";
  style?: { stroke: string; strokeWidth: number };
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NodeType = AgenNode["type"];

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

export type DomainCategory = "create" | "view" | "trigger" | "test" | "cycle";

export interface DomainMetadata {
  category: DomainCategory;
  icon: string;
  description: string;
  nodeTypes: NodeType[];
}

export type DomainMetadataMap = Record<DomainCategory, DomainMetadata>;
