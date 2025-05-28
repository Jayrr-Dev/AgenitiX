# Creating New Nodes - Step-by-Step Guide

This guide covers the streamlined process for creating new nodes in the modular flow editor architecture.

## 📋 Quick Checklist

When creating a new node, you need to update these 6 locations:

1. ✅ **Create node component** in `nodes/main/YourNodeName.tsx`
2. ✅ **Add type definitions** in `flow-editor/types/index.ts`
3. ✅ **Register configuration** in `flow-editor/constants/index.ts`
4. ✅ **Register in FlowCanvas** in `flow-editor/components/FlowCanvas.tsx`
5. ✅ **Add to sidebar** in `components/sidebar/constants.ts`
6. ✅ **Add controls** in `components/node-inspector/components/NodeControls.tsx`

## 🚀 Detailed Steps

### Step 1: Create the Node Component

Create your node in `nodes/main/YourNodeName.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { CustomHandle } from '../../handles/CustomHandle';
import { useNodeConnections, useNodesData } from '@xyflow/react';
import { getSingleInputValue, isTruthyValue } from '../../utils/nodeUtils';

interface YourNodeData {
  yourProperty: string;
  anotherProperty?: number;
  // Add your data properties here
}

export default function YourNode({ id, data }: { id: string; data: YourNodeData }) {
  const [showUI, setShowUI] = useState(false);
  const { updateNodeData } = useReactFlow();
  
  // Get input connections
  const connections = useNodeConnections();
  const nodesData = useNodesData();
  
  // Process inputs and update outputs
  useEffect(() => {
    const inputValue = getSingleInputValue(connections, nodesData, 'input');
    
    // Your node logic here
    const processedValue = processInput(inputValue);
    
    // Update node data
    updateNodeData(id, { 
      yourProperty: processedValue,
      // Update other properties
    });
  }, [connections, nodesData, id, updateNodeData]);
  
  const processInput = (input: unknown) => {
    // Implement your node's logic here
    return String(input || '');
  };
  
  return (
    <div className={`
      relative bg-white dark:bg-zinc-800 border-2 border-gray-300 dark:border-zinc-600 
      rounded-lg shadow-sm transition-all duration-200 hover:shadow-md
      ${showUI ? 'w-[120px] h-[120px]' : 'w-[60px] h-[60px]'}
    `}>
      {/* Toggle Button */}
      <button
        onClick={() => setShowUI(!showUI)}
        className="absolute top-1 right-1 w-4 h-4 text-xs bg-gray-100 dark:bg-zinc-700 
                   rounded-full border border-gray-300 dark:border-zinc-600 
                   hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
        title={showUI ? 'Collapse' : 'Expand'}
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* Node Content */}
      <div className="p-2 h-full flex flex-col">
        {showUI ? (
          // Expanded UI
          <div className="flex-1 flex flex-col">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Node
            </div>
            
            {/* Your expanded UI here */}
            <div className="flex-1 text-xs text-gray-600 dark:text-gray-400">
              Value: {data.yourProperty}
            </div>
          </div>
        ) : (
          // Icon UI
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">🔧</div> {/* Your icon */}
          </div>
        )}
      </div>

      {/* Input Handle */}
      <CustomHandle 
        type="target" 
        position={Position.Left} 
        id="input" 
        dataType="s"  // string input
        style={{ left: -6 }}
      />
      
      {/* Output Handle */}
      <CustomHandle 
        type="source" 
        position={Position.Right} 
        id="output" 
        dataType="s"  // string output
        style={{ right: -6 }}
      />
    </div>
  );
}
```

### Step 2: Add Type Definitions

Update `flow-editor/types/index.ts`:

```typescript
// Add your data interface
export interface YourNodeData {
  yourProperty: string;
  anotherProperty?: number;
  // Add all your node's data properties
}

// Add to the AgenNode union type (around line 100)
export type AgenNode =
  | (Node<YourNodeData & Record<string, unknown>> & { type: 'yourNodeType' })
  | (Node<TextNodeData & Record<string, unknown>> & { type: 'textNode' })
  | // ... rest of existing types
```

### Step 3: Register Node Configuration

Update `flow-editor/constants/index.ts`:

```typescript
export const NODE_TYPE_CONFIG: NodeTypeConfigMap = {
  yourNodeType: {
    defaultData: { 
      yourProperty: 'default value',
      anotherProperty: 0
    }
  },
  // ... existing configs
  textNode: {
    defaultData: { text: '', heldText: '', defaultText: '' }
  },
  // ... rest of existing configs
};
```

### Step 4: Register in FlowCanvas

Update `flow-editor/components/FlowCanvas.tsx`:

```typescript
// Add import at the top
import YourNode from '../../nodes/main/YourNode';

// Add to nodeTypes object (around line 85)
const nodeTypes = useMemo(
  () => ({
    yourNodeType: YourNode,
    textNode: TextNode,
    uppercaseNode: TextUppercaseNode,
    // ... existing types
  }),
  []
);
```

### Step 5: Add to Sidebar

Update `components/sidebar/constants.ts`:

```typescript
export const DEFAULT_STENCILS_A: Record<TabKeyA, NodeStencil[]> = {
  main: [
    { 
      id: 'your-node-1', 
      nodeType: 'yourNodeType', 
      label: 'Your Node', 
      description: 'Brief description of what your node does. Explain inputs, outputs, and main functionality.' 
    },
    { id: 'main-text-1', nodeType: 'textNode', label: 'Text', description: 'Create and edit text content...' },
    // ... existing stencils
  ],
  // For other categories:
  marketing: [
    { 
      id: 'mkt-your-node-1', 
      nodeType: 'yourNodeType', 
      label: 'Marketing Node', 
      description: 'Marketing-specific version of your node.' 
    },
    // ... existing marketing stencils
  ],
  // ... other categories
};
```

### Step 6: Add Controls to NodeInspector

Update `components/node-inspector/components/NodeControls.tsx`:

```typescript
// Import your control component (create if needed)
import YourNodeControl from '../controls/YourNodeControl';

const renderControls = () => {
  switch (node.type) {
    case 'yourNodeType':
      return <YourNodeControl node={node} updateNodeData={updateNodeData} />;
    
    case 'textNode':
      return <TextNodeControl node={node} updateNodeData={updateNodeData} />;
    
    // ... existing cases
    
    default:
      return <div>No controls available for this node type.</div>;
  }
};
```

### Step 6b: Create Node Control Component (if needed)

Create `components/node-inspector/controls/YourNodeControl.tsx`:

```typescript
import React from 'react';
import { BaseControl } from './BaseControl';
import type { AgenNode } from '../../../flow-editor/types';

interface YourNodeControlProps {
  node: AgenNode & { type: 'yourNodeType' };
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
}

export function YourNodeControl({ node, updateNodeData }: YourNodeControlProps) {
  const handlePropertyChange = (value: string) => {
    updateNodeData(node.id, { yourProperty: value });
  };

  return (
    <BaseControl title="Your Node Settings">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Your Property
          </label>
          <input
            type="text"
            value={node.data.yourProperty || ''}
            onChange={(e) => handlePropertyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-600 
                       rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter value..."
          />
        </div>
        
        {/* Add more controls as needed */}
      </div>
    </BaseControl>
  );
}

export default YourNodeControl;
```

## 🎯 Handle Types Reference

Choose the appropriate handle types for your inputs and outputs:

```typescript
// String data
<CustomHandle type="target" position={Position.Left} id="input" dataType="s" />

// Number data  
<CustomHandle type="target" position={Position.Left} id="input" dataType="n" />

// Boolean data
<CustomHandle type="target" position={Position.Left} id="input" dataType="b" />

// JSON/Object data
<CustomHandle type="target" position={Position.Left} id="input" dataType="j" />

// Array data
<CustomHandle type="target" position={Position.Left} id="input" dataType="a" />

// Any type
<CustomHandle type="target" position={Position.Left} id="input" dataType="x" />
```

## 🔧 Common Patterns

### Multiple Inputs:
```typescript
// In your node component
const input1 = getSingleInputValue(connections, nodesData, 'input1');
const input2 = getSingleInputValue(connections, nodesData, 'input2');

// Multiple handles
<CustomHandle type="target" position={Position.Left} id="input1" dataType="s" style={{ top: 20 }} />
<CustomHandle type="target" position={Position.Left} id="input2" dataType="n" style={{ top: 40 }} />
```

### Conditional Outputs:
```typescript
// Only show output handle when node has data
{data.yourProperty && (
  <CustomHandle type="source" position={Position.Right} id="output" dataType="s" />
)}
```

### Error Handling:
```typescript
// In your useEffect
try {
  const result = processInput(inputValue);
  updateNodeData(id, { yourProperty: result });
} catch (error) {
  console.error(`Error in ${id}:`, error);
  // Error will be caught by the global error handler
}
```

## ✅ Testing Your Node

1. **Create the node** - Drag from sidebar to canvas
2. **Test expansion** - Click toggle button
3. **Test inputs** - Connect other nodes to inputs
4. **Test outputs** - Connect outputs to other nodes
5. **Test controls** - Use node inspector controls
6. **Test persistence** - Refresh page, check data persists

## 🚨 Common Issues

### Node not appearing in sidebar:
- Check `constants.ts` stencil configuration
- Verify `nodeType` matches exactly
- Check for typos in node type string

### Drag and drop not working:
- Verify `FlowCanvas.tsx` registration
- Check import path is correct
- Ensure node type is in `NODE_TYPE_CONFIG`

### Type errors:
- Update `types/index.ts` with your interface
- Add to `AgenNode` union type
- Check all property names match

### Controls not showing:
- Add case to `NodeControls.tsx` switch statement
- Create control component if needed
- Check node type string matches exactly

## 📚 Examples

Look at existing nodes for reference:
- **Simple node**: `TextNode.tsx`
- **Logic node**: `LogicAnd.tsx` 
- **Trigger node**: `TriggerOnClick.tsx`
- **Complex node**: `DelayNode.tsx`

---

Following this guide ensures your new node integrates seamlessly with the modular architecture and maintains consistency with existing nodes. 