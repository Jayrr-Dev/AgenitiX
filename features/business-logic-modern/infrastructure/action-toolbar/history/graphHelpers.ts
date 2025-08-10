/**
 * GRAPH HELPERS - Utility functions for history graph management
 *
 * • Graph creation and manipulation utilities
 * • Node creation with proper parent-child relationships
 * • Server-first helpers (local persistence removed)
 * • ID generation and state validation
 *
 * Keywords: graph-utilities, node-creation, persistence, validation
 */

// Lightweight runtime compression for large graphs (≈70% smaller). Adds <2 KB to bundle.
import { generateNodeId as generateReadableNodeId } from "../../flow-engine/utils/nodeUtils";
import type {
  FlowState,
  HistoryGraph,
  HistoryNode,
  NodeId,
} from "./historyGraph";

// Generate unique IDs for history nodes
export const generateNodeId = (): NodeId => generateReadableNodeId();

// Create the initial root graph with starting state
export const createRootGraph = (initialState: FlowState): HistoryGraph => {
  const rootId: NodeId = "root";
  return {
    root: rootId,
    cursor: rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        parentId: null,
        childrenIds: [],
        label: "INITIAL",
        before: initialState,
        after: initialState,
        createdAt: performance.now(),
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
    createdAt: performance.now(),
    metadata,
  };

  // Add child to parent's children list
  const parentNode = graph.nodes[parentId];
  if (!parentNode.childrenIds) {
    parentNode.childrenIds = [];
  }
  parentNode.childrenIds.push(id);
  // Add node to graph
  graph.nodes[id] = node;

  return id;
};

// Deep clone a FlowState to avoid reference issues
export const cloneFlowState = (state: FlowState): FlowState => ({
  nodes: state.nodes.map((node) => ({
    ...node,
    position: { ...node.position },
    data: node.data ? { ...node.data } : node.data,
  })),
  edges: state.edges.map((edge) => ({
    ...edge,
    data: edge.data ? { ...edge.data } : edge.data,
  })),
});

// Check if two FlowStates are equal
export const areStatesEqual = (
  state1: FlowState,
  state2: FlowState
): boolean => {
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
    if (!node) {
      break;
    }
    path.unshift(node);
    currentId = node.parentId;
  }

  return path;
};

// Get all leaf nodes (endpoints) in the graph
export const getLeafNodes = (graph: HistoryGraph): HistoryNode[] => {
  return Object.values(graph.nodes).filter(
    (node) => (node.childrenIds || []).length === 0
  );
};

// Server-first: local persistence disabled
const STORAGE_KEY_PREFIX = "workflow-history-graph-v5"; // kept for compatibility

/**
 * PERSISTENCE QUEUE - Dedupes and defers heavy persistence work
 *
 * [Explanation], basically batch multiple quick updates and run JSON/compression + localStorage writes in idle time
 */
const PERSIST_DEBOUNCE_MS = 0;
const DRAG_DEBOUNCE_MS = 0;
const COMPRESSION_THRESHOLD = Number.POSITIVE_INFINITY;
const MAX_PERSIST_SIZE = Number.POSITIVE_INFINITY;

type PersistJob = {
  graph: HistoryGraph;
  flowId?: string;
  isDragging?: boolean;
};

let pendingJob: PersistJob | null = null; // [Explanation], basically latest scheduled job
let isPersisting = false; // [Explanation], basically avoid concurrent persists
let debounceTimer: ReturnType<typeof setTimeout> | null = null; // [Explanation], basically debounce handle
let idleHandle: number | null = null; // [Explanation], basically requestIdleCallback handle

// Minimal runtime guards for requestIdleCallback
const requestIdle: (cb: () => void) => void = (cb) => {
  // [Explanation], basically prefer idle callback and fallback to setTimeout
  const w = typeof window !== "undefined" ? (window as any) : undefined;
  if (w && typeof w.requestIdleCallback === "function") {
    idleHandle = w.requestIdleCallback(() => cb());
  } else {
    setTimeout(cb, 0);
  }
};
const cancelIdle = (): void => {
  const w = typeof window !== "undefined" ? (window as any) : undefined;
  if (w && typeof w.cancelIdleCallback === "function" && idleHandle != null) {
    w.cancelIdleCallback(idleHandle);
  }
  idleHandle = null;
};

/**
 * Optimize graph for storage by stripping heavy/transient fields inside before/after snapshots.
 *
 * [Explanation], basically remove large nested data we don't need for history persistence
 */
function optimizeGraphForStorage(graph: HistoryGraph) {
  return {
    ...graph,
    nodes: Object.fromEntries(
      Object.values(graph.nodes).map((node) => [
        node.id,
        {
          ...node,
          // Remove unnecessary data for storage
          before: {
            ...node.before,
            // Remove large objects that don't need persistence
            nodes: node.before.nodes.map((n) => ({
              ...n,
              data: n.data
                ? {
                    ...n.data,
                    // Remove large objects that don't need persistence
                    inputs: undefined,
                    output: undefined,
                    // Keep only essential data
                    label: (n as any).data?.label,
                    type: (n as any).data?.type,
                    isExpanded: (n as any).data?.isExpanded,
                  }
                : (n as any).data,
            })),
          },
          after: {
            ...node.after,
            // Remove large objects that don't need persistence
            nodes: node.after.nodes.map((n) => ({
              ...n,
              data: n.data
                ? {
                    ...n.data,
                    // Remove large objects that don't need persistence
                    inputs: undefined,
                    output: undefined,
                    // Keep only essential data
                    label: (n as any).data?.label,
                    type: (n as any).data?.type,
                    isExpanded: (n as any).data?.isExpanded,
                  }
                : (n as any).data,
            })),
          },
        },
      ])
    ),
  } as HistoryGraph;
}

/**
 * Perform the heavy JSON serialization, compression, and localStorage write.
 * Runs outside the interaction path.
 */
async function persistNow(_job: PersistJob): Promise<void> {
  // No-op: local persistence removed in favor of server-first state
}

/**
 * Schedule a persist; coalesces multiple calls and executes in idle time.
 */
function schedulePersist(_job: PersistJob): void {
  // No-op: local persistence removed
}

const getStorageKey = (flowId?: string): string => {
  return flowId
    ? `${STORAGE_KEY_PREFIX}-${flowId}`
    : `${STORAGE_KEY_PREFIX}-default`;
};

// Server-side persistence callbacks - set by the UndoRedoManager
let saveGraphCallback:
  | ((graph: HistoryGraph, flowId?: string, isDragging?: boolean) => void)
  | null = null;
let loadGraphCallback: ((flowId?: string) => HistoryGraph | null) | null = null;

/**
 * Set persistence callbacks for server-side storage, basically register save/load functions
 */
export const setPersistenceCallbacks = (
  saveCallback: (
    graph: HistoryGraph,
    flowId?: string,
    isDragging?: boolean
  ) => void,
  loadCallback: (flowId?: string) => HistoryGraph | null
) => {
  saveGraphCallback = saveCallback;
  loadGraphCallback = loadCallback;
};

export const saveGraph = (
  graph: HistoryGraph,
  flowId?: string,
  isDragging?: boolean
): void => {
  if (saveGraphCallback) {
    saveGraphCallback(graph, flowId, isDragging);
  }
};

// Validate and fix graph data structure after loading
const validateAndFixGraphData = (graph: HistoryGraph): HistoryGraph => {
  // Ensure graph has required top-level properties
  if (!graph.root) {
    graph.root = "root";
  }
  if (!graph.cursor) {
    graph.cursor = graph.root;
  }
  if (!graph.nodes) {
    graph.nodes = {};
  }

  // If nodes were persisted as an array, convert to record mapping
  if (Array.isArray(graph.nodes)) {
    graph.nodes = Object.fromEntries(graph.nodes.map((n: any) => [n.id, n]));
  }

  // Ensure root node exists
  if (!graph.nodes[graph.root]) {
    console.warn(
      `⚠️ [GraphHelpers] Root node "${graph.root}" missing, creating default root`
    );
    graph.nodes[graph.root] = {
      id: graph.root,
      parentId: null,
      childrenIds: [],
      label: "INITIAL",
      before: { nodes: [], edges: [] },
      after: { nodes: [], edges: [] },
      createdAt: performance.now(),
    };
  }

  // Ensure cursor points to a valid node
  if (!graph.nodes[graph.cursor]) {
    console.warn(
      `⚠️ [GraphHelpers] Cursor "${graph.cursor}" points to missing node, resetting to root`
    );
    graph.cursor = graph.root;
  }

  // Ensure all nodes have required properties
  for (const nodeId in graph.nodes) {
    const node = graph.nodes[nodeId];

    // Ensure childrenIds is always an array
    if (!node.childrenIds) {
      node.childrenIds = [];
    }

    // Ensure parentId is properly set (null for root, string for others)
    if (node.parentId === undefined) {
      node.parentId = nodeId === graph.root ? null : graph.root;
    }

    // Ensure required fields exist
    if (!node.id) {
      node.id = nodeId;
    }
    if (!node.label) {
      node.label = "Unknown Action";
    }
    if (!node.before) {
      node.before = { nodes: [], edges: [] };
    }
    if (!node.after) {
      node.after = { nodes: [], edges: [] };
    }
    if (!node.createdAt) {
      node.createdAt = performance.now();
    }
  }

  return graph;
};

export const loadGraph = (flowId?: string): HistoryGraph | null => {
  if (loadGraphCallback) {
    return loadGraphCallback(flowId);
  }
  return null;
};

export const clearPersistedGraph = (flowId?: string): void => {
  // No-op
};

// Clear all flow histories (useful for cleanup)
export const clearAllPersistedGraphs = (): void => {
  // No-op
};

// Graph statistics for debugging/UI
export const getGraphStats = (graph: HistoryGraph) => {
  const totalNodes = Object.keys(graph.nodes).length;
  const branches = Object.values(graph.nodes).filter(
    (node) => (node.childrenIds || []).length > 1
  ).length;
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

// PRUNE GRAPH TO LIMIT SIZE
// Removes oldest states by promoting subsequent children to root until
// the total number of nodes is within the specified limit.
// This follows a FIFO approach along the chronological order of creation,
// effectively "moving the initial state forward".
export const pruneGraphToLimit = (
  graph: HistoryGraph,
  maxSize: number
): void => {
  // Safety checks
  if (maxSize <= 0) {
    return;
  }

  // Continue pruning until we meet the size requirement
  while (Object.keys(graph.nodes).length > maxSize) {
    const currentRoot = graph.nodes[graph.root];
    if (!currentRoot) {
      // Should not happen, but break to avoid infinite loop
      console.warn(
        "[GraphHelpers] pruneGraphToLimit: root node missing – aborting prune"
      );
      break;
    }

    // If the current root has no children we cannot prune further safely
    if (!currentRoot.childrenIds || currentRoot.childrenIds.length === 0) {
      console.warn(
        "[GraphHelpers] pruneGraphToLimit: reached leaf root – cannot prune further"
      );
      break;
    }

    // Promote the FIRST child to become the new root (chronologically oldest)
    const [newRootId, ...remainingChildren] = currentRoot.childrenIds;

    // Update new root parent reference
    const newRootNode = graph.nodes[newRootId];
    if (newRootNode) {
      newRootNode.parentId = null;
    }

    // All siblings of the new root also become top-level nodes (parentId = null)
    for (const childId of remainingChildren) {
      const childNode = graph.nodes[childId];
      if (childNode) {
        childNode.parentId = null;
      }
    }

    // Remove the old root
    delete graph.nodes[graph.root];

    // Re-assign graph.root
    graph.root = newRootId;

    // If cursor pointed to the removed root, update it to newRootId
    if (graph.cursor === currentRoot.id) {
      graph.cursor = newRootId;
    }
  }
};

// REMOVE NODE AND ALL ITS CHILDREN
// Removes a specific node and all its descendants from the history graph.
// Updates parent references and cursor position if necessary.
export const removeNodeAndChildren = (
  graph: HistoryGraph,
  nodeId: NodeId
): boolean => {
  const nodeToRemove = graph.nodes[nodeId];
  if (!nodeToRemove) {
    console.warn(
      `[GraphHelpers] removeNodeAndChildren: node ${nodeId} not found`
    );
    return false;
  }

  // Cannot remove the root node
  if (nodeId === graph.root) {
    console.warn(
      "[GraphHelpers] removeNodeAndChildren: cannot remove root node"
    );
    return false;
  }

  // Collect all nodes to remove (node + all descendants)
  const nodesToRemove = new Set<NodeId>();
  const collectDescendants = (id: NodeId) => {
    nodesToRemove.add(id);
    const node = graph.nodes[id];
    if (node?.childrenIds) {
      node.childrenIds.forEach(collectDescendants);
    }
  };
  collectDescendants(nodeId);

  // Update cursor if it points to a node being removed
  if (nodesToRemove.has(graph.cursor)) {
    // Move cursor to the parent of the removed node
    graph.cursor = nodeToRemove.parentId || graph.root;
  }

  // Remove the node from its parent's children list
  if (nodeToRemove.parentId) {
    const parent = graph.nodes[nodeToRemove.parentId];
    if (parent?.childrenIds) {
      parent.childrenIds = parent.childrenIds.filter((id) => id !== nodeId);
    }
  }

  // Remove all collected nodes from the graph
  for (const id of nodesToRemove) {
    delete graph.nodes[id];
  }
  return true;
};

// Determine if a given node is on the active path from root → cursor
export const isNodeOnActivePath = (
  graph: HistoryGraph,
  nodeId: NodeId
): boolean => {
  let current: NodeId | null = graph.cursor;
  const safety = 10_000;
  let steps = 0;
  while (current && steps++ < safety) {
    if (current === nodeId) return true;
    const node: HistoryNode | undefined = graph.nodes[current];
    current = node?.parentId ?? null;
  }
  return nodeId === graph.root;
};

// PRUNE BRANCH (refuse if node is on the active path)
export const pruneBranch = (graph: HistoryGraph, nodeId: NodeId): boolean => {
  if (!graph.nodes[nodeId]) return false;
  if (isNodeOnActivePath(graph, nodeId)) {
    // Refuse pruning active path to avoid breaking the current timeline
    return false;
  }
  return removeNodeAndChildren(graph, nodeId);
};

// PRUNE FUTURE FROM NODE (default: cursor) – clears redo branches
export const pruneFutureFrom = (
  graph: HistoryGraph,
  fromNodeId?: NodeId
): boolean => {
  const nodeId = fromNodeId ?? graph.cursor;
  const node = graph.nodes[nodeId];
  if (!node) return false;
  if (!node.childrenIds || node.childrenIds.length === 0) return true;

  const toRemove = [...node.childrenIds];
  for (const childId of toRemove) {
    removeNodeAndChildren(graph, childId);
  }
  node.childrenIds = [];
  return true;
};
