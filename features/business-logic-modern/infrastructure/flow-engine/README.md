# Flow Engine - Consolidated Architecture

## 🏗️ Optimized Folder Structure

The Flow Engine has been consolidated from a nested structure into a clean, flat architecture with all components at the root level:

```
flow-engine/
├── index.ts                       # ✅ Single source of truth for all exports
├── FlowEditor.tsx                 # Main orchestrator component
├── README.md                      # This documentation
├── components/
│   ├── FlowCanvas.tsx            # Main ReactFlow canvas component
│   └── FlowEditorLoading.tsx     # Loading state component
├── hooks/
│   ├── useDragAndDrop.ts         # Drag & drop functionality
│   ├── useErrorLogging.ts        # Console error tracking
│   ├── useFlowEditorHandlers.ts  # ReactFlow event handlers
│   ├── useFlowEditorState.ts     # Main state management
│   ├── useKeyboardShortcutHandlers.ts # Keyboard action handlers
│   ├── useKeyboardShortcuts.ts   # Keyboard shortcut setup
│   ├── useMultiSelectionCopyPaste.ts # Copy/paste operations
│   └── useReactFlowHandlers.ts   # ReactFlow integration
├── types/
│   └── index.ts                  # Type definitions and interfaces
├── utils/
│   ├── outputUtils.ts            # Node output computation
│   └── [other utilities...]     # Additional utility functions
├── constants/
│   └── index.ts                  # Configuration constants
└── contexts/
    └── [context providers...]    # React context providers
```

## 📦 Clean Import Patterns

### ✅ **Recommended Usage:**

```typescript
// Import everything from the main index
import {
  FlowEditor, // Main component
  FlowCanvas, // Canvas component
  FlowEditorLoading, // Loading component
  useFlowEditorState, // State management hook
  useKeyboardShortcuts, // Keyboard handling
  AgenNode, // Type definitions
  AgenEdge, // Type definitions
  getNodeOutput, // Utility functions
} from "@/features/business-logic-modern/infrastructure/flow-engine";
```

### ❌ **Avoid (Direct Path Imports):**

```typescript
// Don't import from nested paths
import FlowEditor from "@/features/.../flow-engine/FlowEditor";
import { useFlowEditorState } from "@/features/.../flow-engine/hooks/useFlowEditorState";
```

## 🎯 Architecture Benefits

### ✅ **Consolidated Structure:**

- **Flat hierarchy** - Easy to navigate and find files
- **Single index** - All exports in one place
- **No nesting** - Reduced path complexity
- **Clear organization** - Logical grouping by functionality

### ✅ **Developer Experience:**

- **Fast discovery** - See all available exports at a glance
- **Simple imports** - Single import path for everything
- **Easy maintenance** - Add/remove exports in one location
- **Clear API surface** - Organized by category

## 📋 Available Exports by Category

### 🎨 **Components**

- `FlowEditor` (default) - Main flow editor orchestrator
- `FlowCanvas` - Interactive ReactFlow canvas
- `FlowEditorLoading` - Loading state handler

### 🪝 **Hooks**

- `useFlowEditorState` - Main state management
- `useFlowEditorHandlers` - ReactFlow event handlers
- `useKeyboardShortcutHandlers` - Keyboard action handlers
- `useKeyboardShortcuts` - Keyboard shortcut setup
- `useErrorLogging` - Console error tracking
- `useDragAndDrop` - Drag & drop functionality
- `useMultiSelectionCopyPaste` - Copy/paste operations
- `useReactFlowHandlers` - ReactFlow integration

### 📝 **Types**

- `AgenNode` - Node type definition
- `AgenEdge` - Edge type definition

### 🔧 **Utilities**

- `getNodeOutput` - Node output computation

### ⚙️ **Constants**

- `syncNodeTypeConfigWithRegistry` - Registry synchronization

## 🚀 Usage Examples

### Basic FlowEditor Usage

```typescript
import { FlowEditor } from '@/features/business-logic-modern/infrastructure/flow-engine';

function App() {
  return <FlowEditor />;
}
```

### Using Individual Hooks

```typescript
import {
  useFlowEditorState,
  useKeyboardShortcuts
} from '@/features/business-logic-modern/infrastructure/flow-engine';

function CustomFlowComponent() {
  const { nodes, edges, addNode } = useFlowEditorState();

  useKeyboardShortcuts({
    onCopy: () => console.log('Copy triggered'),
    onPaste: () => console.log('Paste triggered'),
    // ... other handlers
  });

  return (
    <div>
      <p>Nodes: {nodes.length}</p>
      <p>Edges: {edges.length}</p>
    </div>
  );
}
```

### Type-Safe Development

```typescript
import type {
  AgenNode,
  AgenEdge,
} from "@/features/business-logic-modern/infrastructure/flow-engine";

function processFlowData(nodes: AgenNode[], edges: AgenEdge[]) {
  // Type-safe processing
  return nodes.filter((node) => node.data.enabled);
}
```

## 🎯 Performance Features

1. **Modular Architecture** - Each hook manages specific concerns
2. **Optimized Re-renders** - Targeted updates with `useCallback` and `useMemo`
3. **Clean State Management** - Zustand integration for predictable updates
4. **Lazy Loading** - Components load only when needed

## 🛠️ Development Workflow

### Adding New Features

1. **Components** → Add to `components/` directory
2. **State Logic** → Add hooks to `hooks/` directory
3. **Types** → Update `types/index.ts`
4. **Utilities** → Add to `utils/` directory
5. **Export** → Add to main `index.ts`

### Keyboard Shortcuts Available

- **Alt+Q** - Delete selected nodes/edges
- **Alt+W** - Duplicate selected node
- **Alt+S** - Toggle sidebar
- **Alt+A** - Toggle inspector lock
- **Ctrl+C** - Copy selection
- **Ctrl+V** - Paste selection
- **Ctrl+A** - Select all nodes
- **Esc** - Clear selection

## 📈 Architecture Metrics

| Aspect               | Status            | Benefit             |
| -------------------- | ----------------- | ------------------- |
| File Organization    | ✅ Flat structure | Easy navigation     |
| Import Complexity    | ✅ Single path    | Simple imports      |
| Export Management    | ✅ Centralized    | Clear API           |
| Code Discoverability | ✅ High           | All exports visible |
| Maintainability      | ✅ Excellent      | Organized by type   |

## 🔄 Migration Notes

This consolidated structure is a **drop-in replacement** - no changes needed to existing usage:

```typescript
// Before and after - same imports work
import { FlowEditor } from "@/features/business-logic-modern/infrastructure/flow-engine";
```

The flat structure makes the flow engine more approachable for developers while maintaining all the modular benefits of the refactored architecture.
