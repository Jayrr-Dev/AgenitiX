/**
 * HISTORY GRAPH TYPES (Shim) - Graph-based undo/redo data model + helpers
 *
 * • Re-exports unified types to avoid drift across modules
 * • Small helpers for path traversal to reduce duplicate code
 * • Backwards-compatible for legacy imports of `HistoryNode`/`HistoryGraph`
 *
 * Keywords: graph-structure, multi-branch, undo-redo, state-transitions, type-shim
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

// Re-export the manager API to keep imports centralized
export type { UndoRedoManagerAPI } from "../features/undo-redo-context";

/**
 * Build the path from the graph root to a target node.
 * [Explanation], basically creates a root→target ordered array for navigation UI and jumps
 */
export const buildPathTo = (
  graph: HistoryGraph,
  targetId: NodeId | null | undefined
): HistoryNode[] => {
  if (!targetId) return [];
  const path: HistoryNode[] = [];
  let current: NodeId | null = targetId;
  const safety = 10_000; // guard against accidental cycles
  let steps = 0;
  while (current && graph.nodes[current] && steps++ < safety) {
    const node: HistoryNode = graph.nodes[current]!;
    path.unshift(node);
    current = node.parentId;
  }
  return path;
};

/**
 * Set the graph cursor to a node on the current graph, if it exists.
 * [Explanation], basically moves the active pointer to a specific state without rebuilding the graph
 */
export const pathSetToCursor = (
  graph: HistoryGraph,
  targetId: NodeId | null | undefined
): void => {
  if (!targetId) return;
  if (graph.nodes[targetId]) {
    graph.cursor = targetId;
  }
};
