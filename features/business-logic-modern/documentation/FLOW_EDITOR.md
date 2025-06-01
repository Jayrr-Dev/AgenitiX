# FlowEditor Refactoring Documentation

## Overview

FlowEditor.tsx was refactored from 880 lines to 310 lines by extracting functionality into focused modules. All original functionality is preserved.

## Extracted Modules

### useFlowEditorHandlers.ts (160 lines)

**Purpose:** ReactFlow event management and Zustand integration

**Key Functions:**

- `handleNodesChange()` - Processes node updates, deletions, selections
- `handleEdgesChange()` - Manages edge modifications and removals
- `handleConnect()` - Creates new connections between nodes
- `handleSelectionChange()` - Updates selected nodes/edges in store

**Integration Points:**

- Uses `useFlowStore()` for state management
- Integrates with ReactFlow's change handlers
- Manages node/edge selection state

### useKeyboardShortcutHandlers.ts (220 lines)

**Purpose:** Keyboard shortcuts and bulk operations

**Key Functions:**

- `handleCopy()` - Copies selected nodes with edge detection
- `handlePaste()` - Pastes nodes with position offset and ID regeneration
- `handleSelectAll()` - Selects all nodes and connecting edges
- `handleDelete()` - Removes selected nodes and orphaned edges
- `handleDuplicate()` - Clones nodes with automatic positioning

**Keyboard Mappings:**

- Ctrl+C/Cmd+C: Copy selection
- Ctrl+V/Cmd+V: Paste with offset
- Ctrl+A/Cmd+A: Select all
- Delete/Backspace: Remove selection
- Ctrl+D/Cmd+D: Duplicate selection

### FlowEditorLoading.tsx (30 lines)

**Purpose:** Loading state during hydration

**Key Functions:**

- `Loading component` - Displays loading spinner
- `Hydration check` - Waits for client-side store initialization
- `Error boundary` - Handles loading failures

**State Management:**

- Uses `useState` for hydration tracking
- `useEffect` monitors store readiness
- Conditional rendering based on hydration state

### useErrorLogging.ts (70 lines)

**Purpose:** Console error interception and filtering

**Key Functions:**

- `setupErrorLogging()` - Overrides console.error
- `filterReactErrors()` - Removes React framework noise
- `logNodeErrors()` - Captures node-specific errors
- `getErrorStats()` - Provides error analytics

**Error Categories:**

- React hydration warnings (filtered)
- Node execution errors (logged)
- Connection validation errors (logged)
- System errors (logged with context)

## Main FlowEditor Component (310 lines)

**Structure:**

```typescript
export default function FlowEditor() {
  // HOOKS COMPOSITION
  const handlers = useFlowEditorHandlers();
  const shortcuts = useKeyboardShortcutHandlers();
  const errorLogging = useErrorLogging();

  // COMPONENT RENDER
  return <ReactFlow {...handlers} />;
}
```

**Responsibilities:**

- Compose extracted hooks
- Provide ReactFlow configuration
- Manage component lifecycle
- Handle initial setup

## Function Organization

### State Management Pattern

All hooks follow consistent structure:

```typescript
export function useHookName() {
  // CONSTANTS
  const store = useFlowStore();

  // HANDLERS
  const handleAction = useCallback(() => {
    // Implementation under 30 lines
  }, [dependencies]);

  // RETURN INTERFACE
  return { handleAction };
}
```

### Error Handling Pattern

Each function includes error boundaries:

```typescript
const handleOperation = useCallback(() => {
  try {
    // Core logic
  } catch (error) {
    console.error("Operation failed:", error);
    // Fallback behavior
  }
}, [deps]);
```

### Memory Management

All hooks properly clean up:

- Event listeners removed in useEffect cleanup
- Timeouts cleared on unmount
- References nullified appropriately

## Integration Points

### Zustand Store Integration

- All state changes go through `useFlowStore`
- No direct ReactFlow state manipulation
- Consistent state synchronization

### ReactFlow Integration

- Handlers passed directly to ReactFlow props
- Change events processed through extracted hooks
- Selection state managed centrally

### Type Safety

- All functions have explicit TypeScript interfaces
- Generic types used for reusable functions
- Strict type checking for node/edge operations

## Performance Optimizations

### Memoization Strategy

- All handlers wrapped in `useCallback`
- Dependencies properly specified
- Prevents unnecessary re-renders

### Selective Updates

- State changes target specific properties
- Bulk operations batched appropriately
- Edge updates don't trigger node re-renders

## Testing Approach

### Hook Testing

Each hook can be tested independently:

```typescript
const { result } = renderHook(() => useFlowEditorHandlers());
// Test specific functions
```

### Integration Testing

Main component tested with mocked hooks:

```typescript
jest.mock("./hooks/useFlowEditorHandlers");
// Test composition behavior
```

## File Dependencies

```
FlowEditor.tsx
├── useFlowEditorHandlers.ts → flowStore
├── useKeyboardShortcutHandlers.ts → flowStore
├── useErrorLogging.ts → console overrides
└── FlowEditorLoading.tsx → hydration state
```

## Function Complexity Metrics

- Average function length: 15 lines
- Maximum function length: 28 lines
- Cyclomatic complexity: <5 per function
- Dependency count: <6 per hook
