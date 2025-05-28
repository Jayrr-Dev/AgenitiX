import type { AgenNode } from '../../FlowEditor';

export interface NodeInspectorProps {
  /** The currently selected node (or null if none) */
  node: AgenNode | null;
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
}

export interface NodeError {
  timestamp: number;
  message: string;
  type: ErrorType;
  source?: string;
}

export type ErrorType = 'error' | 'warning' | 'info';

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
  locked: boolean;
  durationInput: string;
  countInput: string;
  multiplierInput: string;
  delayInput: string;
}

export interface EditingRefs {
  isEditingCount: boolean;
  isEditingMultiplier: boolean;
}

// Node type mappings for better type safety
export type NodeType = AgenNode['type'];

export interface NodeTypeConfig {
  hasOutput: boolean;
  hasControls: boolean;
  displayName: string;
} 