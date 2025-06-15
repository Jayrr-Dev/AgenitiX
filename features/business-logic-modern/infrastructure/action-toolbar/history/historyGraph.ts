/**
 * HISTORY GRAPH TYPES - Graph-based undo/redo data model
 *
 * • Graph structure supporting multiple redo branches
 * • Each node represents a state transition with before/after states
 * • Cursor tracks current position in the graph
 * • Supports unlimited branching for complex undo/redo scenarios
 *
 * Keywords: graph-structure, multi-branch, undo-redo, state-transitions
 */

import type { Edge, Node } from "@xyflow/react";

export type NodeId = string;

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
  /**
   * Pre-computed structural hash of `nodes` + `edges`.
   *
   * •  Fast O(1) equality comparison (`areStatesEqual`) – we just compare the strings
   * •  Optional so existing persisted data stays compatible
   * •  Double-underscore prefix to minimise collision risk with userland keys
   */
  __hash?: string;
}

export interface HistoryNode {
  id: NodeId;
  parentId: NodeId | null; // null ⇒ root
  childrenIds: NodeId[]; // any number of branches
  label: string; // ("A4 add node")
  before: FlowState; // state *before* the action
  after: FlowState; // state *after*  the action
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface HistoryGraph {
  nodes: Record<NodeId, HistoryNode>;
  cursor: NodeId; // current position in the graph
  root: NodeId; // constant, usually 'root'
}
