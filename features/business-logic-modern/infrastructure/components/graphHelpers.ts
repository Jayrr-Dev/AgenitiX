/**
 * GRAPH HELPERS - Utility functions for history graph management
 *
 * • Graph creation and manipulation utilities
 * • Node creation with proper parent-child relationships
 * • Persistence helpers for localStorage integration
 * • ID generation and state validation
 *
 * Keywords: graph-utilities, node-creation, persistence, validation
 */

import { HistoryGraph, HistoryNode, NodeId, FlowState } from './historyGraph';

// Generate unique IDs for history nodes
let nodeCounter = 0;
export const generateNodeId = (): NodeId => `node_${Date.now()}_${++nodeCounter}`;

// Create the initial root graph with starting state
export const createRootGraph = (initialState: FlowState): HistoryGraph => {
  const rootId: NodeId = 'root';
  return {
    root: rootId,
    cursor: rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        childrenIds: [],
        label: 'INIT',
        before: initialState,
        after: initialState,
        createdAt: Date.now(),
      },
    },
  };
};

// Create a new child node and link it to its parent
export const createChildNode = (
  graph: HistoryGraph,
  parentId: NodeId,
  label: string,
  before: FlowState,
  after: FlowState,
  metadata?: Record<string, unknown>
): NodeId => {
  const id = generateNodeId();
  const node: HistoryNode = {
    id,
    parentId,
    childrenIds: [],
    label,
    before,
    after,
    createdAt: Date.now(),
    metadata,
  };
  
  // Add child to parent's children list
  graph.nodes[parentId].childrenIds.push(id);
  // Add node to graph
  graph.nodes[id] = node;
  
  return id;
};

// Deep clone a FlowState to avoid reference issues
export const cloneFlowState = (state: FlowState): FlowState => ({
  nodes: state.nodes.map(node => ({
    ...node,
    position: { ...node.position },
    data: node.data ? { ...node.data } : node.data,
  })),
  edges: state.edges.map(edge => ({
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
  })),
  viewport: state.viewport ? { ...state.viewport } : undefined,
});

// Check if two FlowStates are equal
export const areStatesEqual = (state1: FlowState, state2: FlowState): boolean => {
  return (
    JSON.stringify(state1.nodes) === JSON.stringify(state2.nodes) &&
    JSON.stringify(state1.edges) === JSON.stringify(state2.edges)
  );
};

// Get the path from root to current cursor (for breadcrumb display)
export const getPathToCursor = (graph: HistoryGraph): HistoryNode[] => {
  const path: HistoryNode[] = [];
  let currentId: NodeId | null = graph.cursor;
  
  while (currentId) {
    const node: HistoryNode = graph.nodes[currentId];
    if (!node) break;
    path.unshift(node);
    currentId = node.parentId;
  }
  
  return path;
};

// Get all leaf nodes (endpoints) in the graph
export const getLeafNodes = (graph: HistoryGraph): HistoryNode[] => {
  return Object.values(graph.nodes).filter(node => node.childrenIds.length === 0);
};

// Persistence helpers
const STORAGE_KEY = 'workflow-history-graph-v3';

export const saveGraph = (graph: HistoryGraph): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(graph));
  } catch (error) {
    console.warn('[GraphHelpers] Failed to save graph to localStorage:', error);
  }
};

export const loadGraph = (): HistoryGraph | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryGraph) : null;
  } catch (error) {
    console.warn('[GraphHelpers] Failed to load graph from localStorage:', error);
    return null;
  }
};

export const clearPersistedGraph = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[GraphHelpers] Failed to clear persisted graph:', error);
  }
};

// Graph statistics for debugging/UI
export const getGraphStats = (graph: HistoryGraph) => {
  const totalNodes = Object.keys(graph.nodes).length;
  const branches = Object.values(graph.nodes).filter(node => node.childrenIds.length > 1).length;
  const leafNodes = getLeafNodes(graph).length;
  const maxDepth = getPathToCursor(graph).length - 1; // -1 to exclude root
  
  return {
    totalNodes,
    branches,
    leafNodes,
    maxDepth,
    currentDepth: maxDepth,
  };
}; 