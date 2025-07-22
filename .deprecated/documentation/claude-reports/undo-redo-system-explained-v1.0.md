# Undo/Redo System Architecture - v1.0

**Summary**: Comprehensive explanation of the graph-based undo/redo system with multi-branch support, performance optimizations, and real-time state management for the workflow editor.

## Overview

Your undo/redo system is a sophisticated **graph-based history management** system that goes beyond traditional linear undo/redo. It supports **multiple redo branches**, **performance optimization with Immer.js**, and **intelligent debouncing** to provide a smooth user experience.

## Core Architecture

### 1. Graph-Based History Structure

Instead of a simple array-based history, your system uses a **tree/graph structure** where:

```typescript
interface HistoryGraph {
  nodes: Record<NodeId, HistoryNode>; // All history states
  cursor: NodeId; // Current position
  root: NodeId; // Starting point
}

interface HistoryNode {
  id: NodeId;
  parentId: NodeId | null; // Parent state (null for root)
  childrenIds: NodeId[]; // Multiple possible redo paths
  label: string; // Human-readable action name
  before: FlowState; // State before action
  after: FlowState; // State after action
  createdAt: number;
  metadata?: Record<string, unknown>;
}
```

**Key Benefits:**

- **Multi-branch redo**: If you undo several actions then perform a new action, you can still redo to the previous branches
- **Non-destructive**: No history is lost when branching
- **Visual representation**: Can show history as a tree in the UI

### 2. State Management with Performance Optimization

#### Immer.js Structural Sharing

```typescript
// 90% memory reduction compared to deep cloning
const createFlowStateOptimized = (nodes, edges, viewport) => {
  return produce({} as FlowState, (draft) => {
    draft.nodes = nodes; // Immer only clones what changes
    draft.edges = edges;
    draft.viewport = viewport;
  });
};
```

#### Hash-Based State Comparison

```typescript
// 10x faster than deep comparison
const areStatesEqualOptimized = (state1, state2) => {
  // Quick length check first
  if (state1.nodes.length !== state2.nodes.length) return false;

  // Use hash comparison for speed
  return createStateHash(state1) === createStateHash(state2);
};
```

### 3. Intelligent Action Recording

#### Debounced Position Updates

- **Position changes** are debounced for 300ms to avoid excessive history entries
- **Immediate actions** (add/delete) clear pending position debounces
- **Action separation** uses 150ms delay to group related actions

```typescript
const recordActionDebounced = useCallback(
  (type: ActionType, metadata = {}) => {
    if (type === "node_move") {
      // Debounce position changes
      if (positionDebounceRef.current) {
        clearTimeout(positionDebounceRef.current);
      }

      positionDebounceRef.current = setTimeout(() => {
        recordAction(type, metadata);
      }, finalConfig.positionDebounceMs);
    } else {
      // Immediate recording for other actions
      recordActionImmediate(type, metadata);
    }
  },
  [recordAction, recordActionImmediate]
);
```

## How Operations Work

### Undo Operation

```typescript
const undo = (): boolean => {
  const graph = getGraph();
  const current = graph.nodes[graph.cursor];

  // Check if undo is possible
  if (!current.parentId) {
    return false; // At root, cannot undo
  }

  // Move cursor to parent
  graph.cursor = current.parentId;
  const parent = graph.nodes[graph.cursor];

  // Apply the parent's "after" state
  applyState(parent.after, `undo ${current.label}`);

  // Save and notify
  saveGraph(graph);
  onHistoryChange?.(getPathToCursor(graph), pathLength - 1);

  return true;
};
```

**Key Points:**

- Moves the **cursor** to the parent node
- Applies the **parent's after-state** (not the current's before-state)
- This maintains consistency in the graph structure

### Redo Operation

```typescript
const redo = (childId?: string): boolean => {
  const graph = getGraph();
  const current = graph.nodes[graph.cursor];

  // Check if redo is possible
  if (!current.childrenIds.length) {
    return false; // No children, cannot redo
  }

  // Choose which child to redo to
  const targetId = childId ?? current.childrenIds[0]; // Default to first child

  // Move cursor to target child
  graph.cursor = targetId;
  const target = graph.nodes[targetId];

  // Apply the target's "after" state
  applyState(target.after, `redo ${target.label}`);

  return true;
};
```

**Multi-Branch Support:**

- If multiple children exist, you can specify which branch to redo to
- UI shows branch options when multiple redo paths are available

### Recording New Actions

```typescript
const push = (label: string, nextState: FlowState, metadata = {}) => {
  const graph = getGraph();
  const cursorNode = graph.nodes[graph.cursor];

  // Skip identical states
  if (areStatesEqualOptimized(cursorNode.after, nextState)) {
    return;
  }

  // Create new child node
  const newId = createChildNode(
    graph,
    cursorNode.id, // parent
    label, // action description
    cursorNode.after, // before state (current after)
    nextState, // after state (new state)
    metadata
  );

  // Move cursor to new node
  graph.cursor = newId;
  saveGraph(graph);
};
```

## User Interface Integration

### 1. Keyboard Shortcuts

**Cross-platform support:**

- **Windows/Linux**: `Ctrl+Z` (undo), `Ctrl+Y` (redo)
- **Mac**: `Cmd+Z` (undo), `Cmd+Shift+Z` (redo)

**Smart input detection:**

- Ignores shortcuts when user is typing in input fields
- Prevents interference with normal text editing

### 2. Action Toolbar

Visual undo/redo buttons with:

- **Disabled states** when operations aren't available
- **Tooltips** showing keyboard shortcuts
- **History panel toggle** for advanced users

### 3. History Panel

Advanced UI showing:

- **Complete history path** from root to current
- **Branch indicators** when multiple redo options exist
- **Action timestamps** and descriptions
- **Graph statistics** (total nodes, branches, depth)

## Performance Features

### 1. Memory Optimization

- **Structural sharing** via Immer.js reduces memory by ~90%
- **Hash-based comparison** is 10x faster than deep equality
- **Smart state capture** only when states actually differ

### 2. Debouncing Strategy

- **Position changes**: 300ms debounce to group dragging
- **Action separation**: 150ms to distinguish separate operations
- **Immediate actions**: Clear pending debounces for important actions

### 3. LocalStorage Persistence

- **Graph persistence** survives browser refreshes
- **Automatic cleanup** prevents unlimited growth
- **Load/save optimization** for large graphs

## Action Types Supported

The system recognizes and properly labels these action types:

```typescript
type ActionType =
  | "node_add" // "Add Function Node"
  | "node_delete" // "Delete API Node"
  | "node_move" // "Move 3 nodes"
  | "edge_add" // "Connect nodes"
  | "edge_delete" // "Delete connection"
  | "duplicate" // "Duplicate Function Node"
  | "bulk_update" // "Bulk update"
  | "paste"; // "Paste 2 nodes"
```

Each action type generates **descriptive labels** that appear in the history panel.

## Integration Points

### 1. UndoRedoContext

Provides React Context for system-wide access:

```typescript
const { undo, redo, recordAction, getHistory } = useUndoRedo();
```

### 2. FlowEditor Integration

```typescript
<UndoRedoManager
  nodes={nodes}
  edges={edges}
  onNodesChange={handleNodesChangeWithHistory}
  onEdgesChange={handleEdgesChangeWithHistory}
  onHistoryChange={handleHistoryChange}
  config={{
    maxHistorySize: 100,
    positionDebounceMs: 300,
    enableViewportTracking: false
  }}
/>
```

### 3. Automatic Action Detection

The system automatically detects and records:

- **Node additions/deletions**
- **Edge connections/disconnections**
- **Node movements** (debounced)
- **Copy/paste operations**
- **Bulk updates**

## Debug and Monitoring

### Development Mode Features

- **Console logging** for all undo/redo operations
- **Performance monitoring** for slow operations
- **Memory usage tracking**
- **Graph statistics** display

### Production Optimizations

- **Debug logging disabled** for performance
- **Error boundaries** for graceful degradation
- **Memory cleanup** on component unmount

## Summary

Your undo/redo system is a **production-grade, graph-based history manager** with:

✅ **Multi-branch redo support** - never lose alternative history paths
✅ **90% memory reduction** - via Immer.js structural sharing
✅ **Intelligent debouncing** - smooth UX without history spam
✅ **Cross-platform shortcuts** - Mac/Windows/Linux support
✅ **Visual history navigation** - tree-like history panel
✅ **Performance monitoring** - real-time optimization feedback
✅ **LocalStorage persistence** - survives browser refreshes
✅ **TypeScript safety** - full type coverage and error prevention

This system provides **enterprise-level undo/redo functionality** comparable to professional applications like Figma, Sketch, or Adobe Creative Suite.
