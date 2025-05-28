# FlowEditor - Modular Architecture

This directory contains the refactored FlowEditor component, transformed from a monolithic 748-line file into a maintainable modular architecture.

## 🏗️ Architecture Overview

The FlowEditor has been broken down into focused modules with clear separation of concerns:

```
flow-editor/
├── types/
│   └── index.ts              # Type definitions and interfaces
├── constants/
│   └── index.ts              # Configuration constants and initial data
├── hooks/
│   ├── useFlowEditorState.ts # Main state management
│   ├── useReactFlowHandlers.ts # ReactFlow event handlers
│   ├── useDragAndDrop.ts     # Drag & drop functionality
│   └── useKeyboardShortcuts.ts # Keyboard shortcuts
├── components/
│   └── FlowCanvas.tsx        # Main ReactFlow canvas component
├── utils/
│   ├── nodeFactory.ts        # Node creation utilities
│   ├── outputUtils.ts        # Output computation utilities
│   └── connectionUtils.ts    # Connection validation utilities
├── FlowEditor.tsx            # Main orchestrator component
└── index.ts                  # Clean exports
```

## 🚀 Benefits of Refactoring

### Before (Monolithic)
- ❌ 748 lines in single file
- ❌ Mixed concerns (UI, state, business logic)
- ❌ Hard to test individual pieces
- ❌ Difficult to extend or modify
- ❌ Poor performance (no targeted re-renders)
- ❌ Complex debugging

### After (Modular)
- ✅ ~100 lines per file (manageable chunks)
- ✅ Clear separation of concerns
- ✅ Easy to test individual hooks/components
- ✅ Simple to extend and maintain
- ✅ Better performance with targeted re-renders
- ✅ Easy debugging and development

## 📁 Module Breakdown

### Types (`types/index.ts`)
- **Purpose**: Centralized type definitions
- **Contains**: Node data interfaces, union types, utility types
- **Benefits**: Type safety, reusability, clear contracts

### Constants (`constants/index.ts`)
- **Purpose**: Configuration and default values
- **Contains**: Type mappings, node configurations, initial graph data
- **Benefits**: Easy to modify defaults, consistent configuration

### State Management (`hooks/useFlowEditorState.ts`)
- **Purpose**: Centralized state management
- **Contains**: All component state, computed values, state operations
- **Benefits**: Predictable state updates, easy testing, clear data flow

### ReactFlow Handlers (`hooks/useReactFlowHandlers.ts`)
- **Purpose**: ReactFlow-specific event handling
- **Contains**: Node/edge changes, connections, selections
- **Benefits**: Isolated ReactFlow logic, reusable handlers

### Drag & Drop (`hooks/useDragAndDrop.ts`)
- **Purpose**: Handle node creation via drag & drop
- **Contains**: Drag over/drop handlers, position calculation
- **Benefits**: Focused responsibility, easy to test

### Keyboard Shortcuts (`hooks/useKeyboardShortcuts.ts`)
- **Purpose**: Global keyboard shortcut handling
- **Contains**: Copy/paste, history toggle shortcuts
- **Benefits**: Centralized keyboard logic, easy to extend

### Node Factory (`utils/nodeFactory.ts`)
- **Purpose**: Node creation and validation
- **Contains**: Node creation, type validation, copying
- **Benefits**: Consistent node creation, type safety

### Output Utils (`utils/outputUtils.ts`)
- **Purpose**: Node output computation
- **Contains**: Output calculation, value formatting
- **Benefits**: Reusable output logic, consistent formatting

### Connection Utils (`utils/connectionUtils.ts`)
- **Purpose**: Connection validation and styling
- **Contains**: Type validation, edge styling, color mapping
- **Benefits**: Type-safe connections, consistent styling

## 🔧 Usage Examples

### Adding a New Node Type

1. **Add type definition** in `types/index.ts`:
```typescript
export interface MyNewNodeData {
  value: string;
  enabled: boolean;
}
```

2. **Add to union type**:
```typescript
export type AgenNode = 
  | (Node<MyNewNodeData & Record<string, unknown>> & { type: 'myNewNode' })
  | // ... other types
```

3. **Add configuration** in `constants/index.ts`:
```typescript
export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  myNewNode: {
    defaultData: { value: '', enabled: true }
  },
  // ... other configs
};
```

4. **Register component** in `FlowCanvas.tsx`:
```typescript
const nodeTypes = useMemo(() => ({
  myNewNode: MyNewNodeComponent,
  // ... other types
}), []);
```

### Testing Individual Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useFlowEditorState } from './hooks/useFlowEditorState';

test('should add node correctly', () => {
  const { result } = renderHook(() => useFlowEditorState());
  
  act(() => {
    result.current.addNode(mockNode);
  });
  
  expect(result.current.nodes).toContain(mockNode);
});
```

### Extending Keyboard Shortcuts

```typescript
// In useKeyboardShortcuts.ts
export const KEYBOARD_SHORTCUTS = {
  COPY: 'c',
  PASTE: 'v',
  TOGGLE_HISTORY: 'h',
  DELETE_ALL: 'delete', // New shortcut
} as const;
```

## 🎯 Performance Optimizations

1. **Targeted Re-renders**: Each hook manages specific state slices
2. **Memoized Computations**: `useMemo` for expensive calculations
3. **Callback Stability**: `useCallback` for event handlers
4. **Component Memoization**: `React.memo` for pure components

## 🧪 Testing Strategy

1. **Unit Tests**: Test individual hooks and utilities
2. **Integration Tests**: Test hook interactions
3. **Component Tests**: Test UI components in isolation
4. **E2E Tests**: Test complete user workflows

## 📈 Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Lines per file | 748 | ~100 | 87% reduction |
| Testability | Low | High | Easy isolated testing |
| Maintainability | Poor | Excellent | Clear module boundaries |
| Performance | Poor | Good | Targeted re-renders |
| Extensibility | Hard | Easy | Modular architecture |

## 🔄 Migration Guide

The refactored FlowEditor is a drop-in replacement. No changes needed to existing usage:

```typescript
import FlowEditor from './features/business-logic/FlowEditor';

// Usage remains the same
<FlowEditor />
```

## 🛠️ Development Workflow

1. **State Changes**: Modify `useFlowEditorState.ts`
2. **New Features**: Add hooks in `hooks/` directory
3. **UI Changes**: Modify `FlowCanvas.tsx`
4. **Configuration**: Update `constants/index.ts`
5. **Types**: Add to `types/index.ts`

This modular architecture makes the FlowEditor much more maintainable, testable, and extensible while preserving all existing functionality.