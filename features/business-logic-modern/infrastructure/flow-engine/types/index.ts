/**
 * FLOW ENGINE TYPES - TypeScript type definitions for flow system
 *
 * • Comprehensive type definitions for all node data interfaces
 * • ReactFlow integration types for nodes and edges
 * • Type-safe node configurations and state management
 * • Error tracking and callback interface definitions
 * • Union types for complete type safety across the flow system
 *
 * Keywords: TypeScript, type-definitions, node-interfaces, ReactFlow, type-safety, unions
 */

import type { Edge, Node, Position } from "@xyflow/react";

// ============================================================================
// NODE DATA INTERFACES
// ============================================================================

export interface CreateTextData {
  text: string;
  heldText?: string;
}

export interface CreateTextEnhancedData {
  text: string;
  output: string;
  isEnabled: boolean;
  prefix: string;
  maxLength: number;
}

export interface CyclePulseEnhancedData {
  cycleDuration: number;
  pulseDuration: number;
  infinite: boolean;
  maxCycles: number;
  autoStart: boolean;
  burstMode: boolean;
  burstCount: number;
  isRunning: boolean;
  isPulsing: boolean;
  cycleCount: number;
  progress: number;
  currentPhase: "waiting" | "pulsing" | "stopped";
  output: boolean;
  text?: string;
  isActive: boolean;
}

export interface TurnToUppercaseData {
  text: string;
}

export interface ViewOutputData {
  label: string;
}

export interface TriggerOnClickData {
  triggered: boolean;
}

export interface TriggerOnPulseData {
  triggered: boolean;
  duration?: number;
}

export interface CyclePulseData {
  triggered: boolean;
  isRunning?: boolean;
  initialState?: boolean;
  cycleDuration?: number;
  pulseDuration?: number;
  infinite?: boolean;
  maxCycles?: number;
}

export interface TriggerOnToggleData {
  triggered: boolean;
}

export interface TriggerOnToggleRefactorData {
  triggered: boolean;
  value: boolean;
  outputValue: boolean;
  type: string;
  label: string;
  inputCount: number;
  hasExternalInputs: boolean;
}

export interface CycleToggleData {
  triggered: boolean;
  isRunning?: boolean;
  initialState?: boolean;
  onDuration?: number;
  offDuration?: number;
  infinite?: boolean;
  maxCycles?: number;
}

export interface LogicAndData {
  value: boolean;
  inputCount?: number;
}

export interface LogicOrData {
  value: boolean;
  inputCount?: number;
}

export interface LogicNotData {
  value: boolean;
}

export interface LogicXorData {
  value: boolean;
}

export interface LogicXnorData {
  value: boolean;
}

export interface TurnToTextData {
  value?: unknown;
}

export interface TurnToBooleanData {
  value?: unknown;
  triggered?: boolean;
}

export interface TestInputData {
  value?: unknown;
}

export interface EditObjectData {
  value?: Record<string, unknown>;
}

export interface EditArrayData {
  value?: unknown[];
}

export interface CountInputData {
  count: number;
  multiplier: number;
  lastInputValues?: Record<string, unknown>;
}

export interface DelayInputData {
  delay: number;
  lastInputValue?: unknown;
  isProcessing?: boolean;
  outputValue?: unknown;
  queueLength?: number;
  queueItems?: unknown[];
}

export interface TestErrorData {
  errorMessage: string;
  errorType: "warning" | "error" | "critical";
  triggerMode: "always" | "trigger_on" | "trigger_off";
  isGeneratingError: boolean;
  text: string;
  json: any;
}

export interface TestJsonData {
  jsonText: string;
  parsedJson: any;
  parseError: string | null;
  json: any;
}

export interface TriggerToggleEnhancedData {
  triggered: boolean;
  autoToggle: boolean;
  holdDuration: number;
  pulseMode: boolean;
  value: boolean;
  text?: string;
  _pulseTimerId?: number;
  _lastTriggerState?: boolean;
}

export interface ViewOutputEnhancedData {
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
    timestamp?: number;
  }>;
  maxHistory: number;
  autoScroll: boolean;
  showTypeIcons: boolean;
  groupSimilar: boolean;
  filterEmpty: boolean;
  filterDuplicates: boolean;
  includedTypes: string[];
  text?: string;
  _valueHistory?: Array<{
    values: any[];
    timestamp: number;
  }>;
}

export interface ViewOutputRefactorData {
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
  }>;
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type AgenNode =
  | (Node<CreateTextData & Record<string, unknown>> & { type: "createText" })
  | (Node<CreateTextData & Record<string, unknown>> & {
      type: "createTextRefactor";
    })
  | (Node<CreateTextEnhancedData & Record<string, unknown>> & {
      type: "createTextEnhanced";
    })
  | (Node<CyclePulseEnhancedData & Record<string, unknown>> & {
      type: "cyclePulseEnhanced";
    })
  | (Node<TurnToUppercaseData & Record<string, unknown>> & {
      type: "turnToUppercase";
    })
  | (Node<ViewOutputData & Record<string, unknown>> & {
      type: "viewOutput";
      targetPosition: Position;
    })
  | (Node<TriggerOnClickData & Record<string, unknown>> & {
      type: "triggerOnClick";
    })
  | (Node<TriggerOnPulseData & Record<string, unknown>> & {
      type: "triggerOnPulse";
    })
  | (Node<CyclePulseData & Record<string, unknown>> & { type: "cyclePulse" })
  | (Node<TriggerOnToggleData & Record<string, unknown>> & {
      type: "triggerOnToggle";
    })
  | (Node<TriggerOnToggleRefactorData & Record<string, unknown>> & {
      type: "triggerOnToggleRefactor";
    })
  | (Node<CycleToggleData & Record<string, unknown>> & { type: "cycleToggle" })
  | (Node<LogicAndData & Record<string, unknown>> & { type: "logicAnd" })
  | (Node<LogicOrData & Record<string, unknown>> & { type: "logicOr" })
  | (Node<LogicNotData & Record<string, unknown>> & { type: "logicNot" })
  | (Node<LogicXorData & Record<string, unknown>> & { type: "logicXor" })
  | (Node<LogicXnorData & Record<string, unknown>> & { type: "logicXnor" })
  | (Node<TurnToTextData & Record<string, unknown>> & { type: "turnToText" })
  | (Node<TurnToBooleanData & Record<string, unknown>> & {
      type: "turnToBoolean";
    })
  | (Node<TestInputData & Record<string, unknown>> & { type: "testInput" })
  | (Node<EditObjectData & Record<string, unknown>> & { type: "editObject" })
  | (Node<EditArrayData & Record<string, unknown>> & { type: "editArray" })
  | (Node<CountInputData & Record<string, unknown>> & { type: "countInput" })
  | (Node<DelayInputData & Record<string, unknown>> & { type: "delayInput" })
  | (Node<TestErrorData & Record<string, unknown>> & { type: "testError" })
  | (Node<TestJsonData & Record<string, unknown>> & { type: "testJson" })
  | (Node<TriggerToggleEnhancedData & Record<string, unknown>> & {
      type: "triggerToggleEnhanced";
    })
  | (Node<ViewOutputEnhancedData & Record<string, unknown>> & {
      type: "viewOutputEnhanced";
    })
  | (Node<ViewOutputRefactorData & Record<string, unknown>> & {
      type: "viewOutputRefactor";
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
