import type { Node, Edge, Position } from '@xyflow/react';

// ============================================================================
// NODE DATA INTERFACES
// ============================================================================

export interface TextNodeData {
  text: string;
  heldText?: string;
  defaultText?: string;
}

export interface TextUppercaseNodeData {
  text: string;
}

export interface OutputNodeData {
  label: string;
}

export interface TriggerOnClickData {
  triggered: boolean;
}

export interface TriggerOnPulseData {
  triggered: boolean;
  duration?: number;
}

export interface TriggerOnPulseCycleData {
  triggered: boolean;
  initialState?: boolean;
  cycleDuration?: number;
  pulseDuration?: number;
  infinite?: boolean;
}

export interface TriggerOnToggleData {
  triggered: boolean;
}

export interface TriggerOnToggleCycleData {
  triggered: boolean;
  initialState?: boolean;
  onDuration?: number;
  offDuration?: number;
  infinite?: boolean;
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

export interface TextConverterNodeData {
  value?: unknown;
}

export interface BooleanConverterNodeData {
  value?: unknown;
  triggered?: boolean;
}

export interface InputTesterNodeData {
  value?: unknown;
}

export interface ObjectEditorNodeData {
  value?: Record<string, unknown>;
}

export interface ArrayEditorNodeData {
  value?: unknown[];
}

export interface CounterNodeData {
  count: number;
  multiplier: number;
  lastInputValues?: Record<string, unknown>;
}

export interface DelayNodeData {
  delay: number;
  lastInputValue?: unknown;
  isProcessing?: boolean;
  outputValue?: unknown;
  queueLength?: number;
  queueItems?: unknown[];
}

// ============================================================================
// UNION TYPES
// ============================================================================

export type AgenNode =
  | (Node<TextNodeData & Record<string, unknown>> & { type: 'textNode' })
  | (Node<TextUppercaseNodeData & Record<string, unknown>> & { type: 'uppercaseNode' })
  | (Node<OutputNodeData & Record<string, unknown>> & { type: 'output'; targetPosition: Position })
  | (Node<TriggerOnClickData & Record<string, unknown>> & { type: 'triggerOnClick' })
  | (Node<TriggerOnPulseData & Record<string, unknown>> & { type: 'triggerOnPulse' })
  | (Node<TriggerOnPulseCycleData & Record<string, unknown>> & { type: 'triggerOnPulseCycle' })
  | (Node<TriggerOnToggleData & Record<string, unknown>> & { type: 'triggerOnToggle' })
  | (Node<TriggerOnToggleCycleData & Record<string, unknown>> & { type: 'triggerOnToggleCycle' })
  | (Node<LogicAndData & Record<string, unknown>> & { type: 'logicAnd' })
  | (Node<LogicOrData & Record<string, unknown>> & { type: 'logicOr' })
  | (Node<LogicNotData & Record<string, unknown>> & { type: 'logicNot' })
  | (Node<LogicXorData & Record<string, unknown>> & { type: 'logicXor' })
  | (Node<LogicXnorData & Record<string, unknown>> & { type: 'logicXnor' })
  | (Node<TextConverterNodeData & Record<string, unknown>> & { type: 'textConverterNode' })
  | (Node<BooleanConverterNodeData & Record<string, unknown>> & { type: 'booleanConverterNode' })
  | (Node<InputTesterNodeData & Record<string, unknown>> & { type: 'inputTesterNode' })
  | (Node<ObjectEditorNodeData & Record<string, unknown>> & { type: 'objectEditorNode' })
  | (Node<ArrayEditorNodeData & Record<string, unknown>> & { type: 'arrayEditorNode' })
  | (Node<CounterNodeData & Record<string, unknown>> & { type: 'counterNode' })
  | (Node<DelayNodeData & Record<string, unknown>> & { type: 'delayNode' });

export type AgenEdge = Edge & {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: 'custom' | 'step' | 'default';
  style?: { stroke: string; strokeWidth: number };
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type NodeType = AgenNode['type'];

export interface NodeError {
  timestamp: number;
  message: string;
  type: 'error' | 'warning' | 'info';
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
  logNodeError: (nodeId: string, message: string, type?: NodeError['type'], source?: string) => void;
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
}

export type NodeTypeConfigMap = Record<NodeType, NodeTypeConfig>; 