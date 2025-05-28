# Business Logic Development Context

You are working in the business logic layer of the application. This is a visual flow editor built with React Flow that allows users to create node-based workflows.

## 🏗️ Architecture Overview

The business logic layer has been refactored from monolithic files into a modular architecture with clear separation of concerns:

```
features/business-logic/
├── flow-editor/                    # Main flow editor (refactored from 748 lines → modular)
│   ├── FlowEditor.tsx             # Main orchestrator component (216 lines)
│   ├── types/index.ts             # Type definitions (195 lines)
│   ├── constants/index.ts         # Configuration constants (188 lines)
│   ├── hooks/                     # Custom hooks for state management
│   │   ├── useFlowEditorState.ts  # Main state management (212 lines)
│   │   ├── useReactFlowHandlers.ts # ReactFlow event handlers (147 lines)
│   │   ├── useDragAndDrop.ts      # Drag & drop functionality (58 lines)
│   │   └── useKeyboardShortcuts.ts # Keyboard shortcuts (45 lines)
│   ├── components/
│   │   └── FlowCanvas.tsx         # ReactFlow canvas component (199 lines)
│   └── utils/                     # Utility functions
│       ├── nodeFactory.ts         # Node creation utilities (66 lines)
│       ├── outputUtils.ts         # Output computation utilities (83 lines)
│       └── connectionUtils.ts     # Connection validation utilities (60 lines)
├── components/
│   ├── sidebar/                   # Sidebar component (refactored from 448 lines → modular)
│   │   ├── SidebarTabs.tsx       # Main tabbed interface
│   │   ├── types.ts              # Type definitions and tab configurations
│   │   ├── constants.ts          # Default stencils and variant configurations
│   │   └── hooks/                # Custom hooks
│   └── node-inspector/           # Node inspector (refactored from 1,196 lines → modular)
│       ├── NodeInspector.tsx     # Main orchestrator (~100 lines vs 1,196)
│       ├── types.ts              # Type definitions
│       ├── constants.ts          # Node type configurations
│       └── components/           # Focused UI components
└── nodes/                        # Node implementations
    └── main/                     # Core logic nodes
```

## 🎯 Key Architecture Patterns

### Node Structure Requirements:
- **ICON state**: 60x60px (default collapsed state)
- **EXPANDED state**: 120x120px (when showUI is true)
- **Text-based nodes**: 120x60px in ICON state
- **Toggle button**: `{showUI ? '⦿' : '⦾'}` controls expansion
- **Default state**: ICON (collapsed)

### Handle Types & Colors:
- `s` = string (blue #3b82f6)
- `n` = number (orange #f59e42)  
- `b` = boolean (green #10b981)
- `j` = JSON (indigo #6366f1)
- `a` = array (pink #f472b6)
- `N` = Bigint (purple #a21caf)
- `f` = float (yellow #fbbf24)
- `x` = any (gray #6b7280)
- `u` = undefined (light gray #d1d5db)
- `S` = symbol (gold #eab308)
- `∅` = null (red #ef4444)

## 🚀 Creating New Nodes - Updated Process

The node creation process has been streamlined with the new modular architecture:

### 1. Create the Node Component
Create your node in `nodes/main/YourNodeName.tsx`:

```typescript
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CustomHandle } from '../../handles/CustomHandle';
import { useNodeConnections, useNodesData } from '@xyflow/react';
import { getSingleInputValue } from '../../utils/nodeUtils';

interface YourNodeData {
  yourProperty: string;
  // Add your data properties
}

export default function YourNode({ id, data }: { id: string; data: YourNodeData }) {
  const [showUI, setShowUI] = useState(false);
  
  return (
    <div className={`node-container ${showUI ? 'expanded' : 'icon'}`}>
      <button onClick={() => setShowUI(!showUI)}>
        {showUI ? '⦿' : '⦾'}
      </button>
      
      {/* Your node UI */}
      
      <CustomHandle type="target" position={Position.Left} id="input" dataType="s" />
      <CustomHandle type="source" position={Position.Right} id="output" dataType="s" />
    </div>
  );
}
```

### 2. Add Type Definitions
Update `flow-editor/types/index.ts`:

```typescript
// Add your data interface
export interface YourNodeData {
  yourProperty: string;
  // Add properties
}

// Add to the AgenNode union type
export type AgenNode =
  | (Node<YourNodeData & Record<string, unknown>> & { type: 'yourNodeType' })
  | // ... existing types
```

### 3. Register Node Configuration
Update `flow-editor/constants/index.ts`:

```typescript
export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  yourNodeType: {
    defaultData: { yourProperty: 'default value' }
  },
  // ... existing configs
};
```

### 4. Register in FlowCanvas
Update `flow-editor/components/FlowCanvas.tsx`:

```typescript
// Import your node
import YourNode from '../../nodes/main/YourNode';

// Add to nodeTypes
const nodeTypes = useMemo(
  () => ({
    yourNodeType: YourNode,
    // ... existing types
  }),
  []
);
```

### 5. Add to Sidebar
Update `components/sidebar/constants.ts`:

```typescript
export const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  main: [
    { 
      id: 'your-node-1', 
      nodeType: 'yourNodeType', 
      label: 'Your Node', 
      description: 'Description of what your node does.' 
    },
    // ... existing stencils
  ],
  // ... other categories
};
```

### 6. Add Controls to NodeInspector
Update `components/node-inspector/components/NodeControls.tsx`:

```typescript
const renderControls = () => {
  switch (node.type) {
    case 'yourNodeType':
      return <YourNodeControl node={node} updateNodeData={updateNodeData} />;
    // ... existing cases
  }
};
```

## 📁 Node Categories

Organize nodes by business function:

- **main**: Core logic nodes (triggers, converters, logic gates)
- **marketing**: Marketing-specific nodes (campaigns, analytics)
- **sales**: Sales workflow nodes (leads, opportunities)
- **operations**: Operational task nodes (workflows, automation)
- **strategy**: Strategic planning nodes (goals, initiatives)
- **finance**: Financial/budget nodes (costs, revenue)
- **people**: HR/talent nodes (employees, skills)

## 🔧 Common Patterns & Utilities

### State Management:
```typescript
// Use centralized state management
const { updateNodeData } = useFlowEditorState();

// Update node data
updateNodeData(nodeId, { property: newValue });
```

### Input Handling:
```typescript
// Get input connections
const connections = useNodeConnections();
const nodesData = useNodesData();

// Get single input value
const inputValue = getSingleInputValue(connections, nodesData, 'inputHandle');
```

### Error Handling:
```typescript
// Log errors to node inspector
const { logNodeError, clearNodeErrors } = useFlowEditorState();

logNodeError(nodeId, 'Error message', 'error', 'source');
```

### Type Safety:
```typescript
// Use proper TypeScript interfaces
interface NodeProps {
  id: string;
  data: YourNodeData;
}

// Implement proper type guards
function isYourNodeType(node: AgenNode): node is Node<YourNodeData> & { type: 'yourNodeType' } {
  return node.type === 'yourNodeType';
}
```

## 🎨 UI Best Practices

### Consistent Styling:
- Use Tailwind CSS classes for consistency
- Follow the established color scheme for handles
- Implement proper dark/light mode support
- Use the standard toggle button pattern

### Accessibility:
- Add proper ARIA labels
- Ensure keyboard navigation works
- Use semantic HTML elements
- Provide clear visual feedback

### Performance:
- Use React.memo for expensive components
- Implement useCallback for event handlers
- Use useMemo for computed values
- Avoid unnecessary re-renders

## 🧪 Testing Strategy

### Unit Tests:
- Test individual node components
- Test utility functions
- Test custom hooks
- Mock ReactFlow dependencies

### Integration Tests:
- Test node creation flow
- Test drag and drop functionality
- Test node connections
- Test state management

### Example Test:
```typescript
import { render, screen } from '@testing-library/react';
import YourNode from '../YourNode';

test('renders node with correct initial state', () => {
  const mockData = { yourProperty: 'test' };
  render(<YourNode id="test" data={mockData} />);
  
  expect(screen.getByText('⦾')).toBeInTheDocument();
});
```

## 📊 Performance Optimizations

The new modular architecture provides several performance benefits:

- **Targeted re-renders**: Only affected components update
- **Code splitting**: Lazy load node components
- **Memory efficiency**: Better garbage collection
- **Bundle optimization**: Smaller initial bundle size

## 🔄 Migration Benefits

Compared to the previous monolithic approach:

- **87% reduction** in lines per file (748 → ~100 average)
- **Clear separation** of concerns
- **Easy to test** individual components
- **Simple to extend** with new node types
- **Better maintainability** with focused modules
- **Type-safe** with comprehensive TypeScript

## 🚨 Common Pitfalls

1. **Forgetting to update all registration points** - Use the checklist above
2. **Incorrect handle types** - Match input/output types properly
3. **Missing default data** - Always provide sensible defaults
4. **Performance issues** - Use React optimization patterns
5. **Type mismatches** - Ensure TypeScript types are consistent

## 📚 Additional Resources

- [ReactFlow Documentation](https://reactflow.dev/)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)
- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [Testing React Components](https://testing-library.com/docs/react-testing-library/intro/)

---

When creating new nodes, follow the established patterns for consistency and ensure proper type safety throughout the flow editor. The modular architecture makes it easy to add new functionality while maintaining code quality and performance.
