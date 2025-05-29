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
      id: 'your-node-marketing-1', 
      nodeType: 'yourNodeType', 
      label: 'Your Node', 
      description: 'Category-specific description for marketing use cases.' 
    },
    // ... existing marketing stencils
  ],
  // ... other categories
};
```

### Step 6: Add Node Controls

Create `components/node-inspector/controls/YourNodeControls.tsx`:

```typescript
import React from 'react';
import { ControlPanelProps } from '../types';

export default function YourNodeControls({ nodeId, nodeData, updateNodeData }: ControlPanelProps) {
  const data = nodeData as { yourProperty: string; anotherProperty?: number };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Your Property</label>
        <input
          type="text"
          value={data.yourProperty || ''}
          onChange={(e) => updateNodeData(nodeId, { yourProperty: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Enter value..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Another Property</label>
        <input
          type="number"
          value={data.anotherProperty || 0}
          onChange={(e) => updateNodeData(nodeId, { anotherProperty: parseInt(e.target.value) })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Enter number..."
        />
      </div>
    </div>
  );
}
```

Then register it in `components/node-inspector/components/NodeControls.tsx`:

```typescript
// Add import
import YourNodeControls from '../controls/YourNodeControls';

// Add to the switch statement
case 'yourNodeType':
  return <YourNodeControls nodeId={nodeId} nodeData={nodeData} updateNodeData={updateNodeData} />;
```

## 🎯 Node Categories

Organize nodes into logical categories:

### `nodes/main/` - Core Logic Nodes
- Logic operations (AND, OR, NOT, XOR, XNOR)
- Mathematical functions
- Data transformations
- Core building blocks

### `nodes/media/` - Text & Media Processing
- Text manipulation (CreateText, TurnToUppercase, TurnToText)
- File processing
- Image/video operations
- Content generation

### `nodes/automation/` - Automation & Control
- Triggers (TriggerOnClick, TriggerPulse, TriggerToggle)
- Timers and delays
- Counters and loops
- Flow control

### `nodes/integrations/` - API & External Services
- HTTP requests
- Database connections
- Third-party APIs
- External system integrations

### `nodes/misc/` - Utility & Helper Nodes
- Debug tools (ViewOutput, TestInput)
- Data structures (EditObject, EditArray)
- General utilities
- Development helpers

## 🎨 UI Patterns & Styling

### Handle Positioning Guidelines:
- **Input handles**: `style={{ left: -6 }}` (6px outside left edge)
- **Output handles**: `style={{ right: -6 }}` (6px outside right edge)
- **Top handles**: `style={{ top: -6 }}` (6px above top edge)
- **Bottom handles**: `style={{ bottom: -6 }}` (6px below bottom edge)

### Data Type Color Coding:
- **String (`s`)**: Blue `#3b82f6`
- **Number (`n`)**: Orange `#f59e42`
- **Boolean (`b`)**: Green `#10b981`
- **JSON (`j`)**: Indigo `#6366f1`
- **Array (`a`)**: Pink `#f472b6`
- **Any (`x`)**: Gray `#6b7280`

### Size Standards:
- **Icon mode**: 60x60px (default collapsed state)
- **Expanded mode**: 120x120px (when showUI is true)
- **Text nodes icon**: 120x60px (wider for readability)
- **Toggle button**: 16x16px positioned top-right

## ⚡ Development Tips

### 1. Use Input Utilities
```typescript
import { getSingleInputValue, getMultipleInputValues, isTruthyValue } from '../../utils/nodeUtils';

// Get single input value
const inputValue = getSingleInputValue(connections, nodesData, 'input');

// Get multiple inputs
const inputs = getMultipleInputValues(connections, nodesData, ['input1', 'input2']);

// Check if value is truthy
const isValid = isTruthyValue(inputValue);
```

### 2. State Management Patterns
```typescript
// For simple internal state
const [showUI, setShowUI] = useState(false);
const [localValue, setLocalValue] = useState('');

// For persistent node data
const { updateNodeData } = useReactFlow();
updateNodeData(id, { yourProperty: newValue });

// For reactive processing
useEffect(() => {
  // Process inputs and update outputs
  const result = processInputs();
  updateNodeData(id, { output: result });
}, [connections, nodesData, id]);
```

### 3. Error Handling
```typescript
const [error, setError] = useState<string | null>(null);

const processInput = (input: unknown) => {
  try {
    // Your processing logic
    setError(null);
    return result;
  } catch (err) {
    setError(err.message);
    return null;
  }
};

// Show error in UI
{error && (
  <div className="text-xs text-red-600 mt-1">
    {error}
  </div>
)}
```

### 4. Testing Checklist
- [ ] Node renders correctly in both icon and expanded modes
- [ ] Input handles connect properly
- [ ] Output values update when inputs change
- [ ] Node controls appear in inspector
- [ ] Node appears in sidebar stencils
- [ ] Data persists when saving/loading flows
- [ ] Error states are handled gracefully

## 📚 Related Documentation

- **Node Styling Guide**: `docs/node-styling-guide.md` - Comprehensive styling system
- **Node Reference**: `docs/node-guide.md` - Complete catalog of all nodes
- **Architecture Overview**: `docs/documentation.md` - System architecture and patterns

## ✅ Completion Checklist

After creating your node, verify:

- [ ] **Component created** in correct category folder
- [ ] **Types added** to `flow-editor/types/index.ts`
- [ ] **Config registered** in `flow-editor/constants/index.ts`
- [ ] **Node registered** in `FlowCanvas.tsx`
- [ ] **Stencil added** to sidebar constants
- [ ] **Controls created** and registered
- [ ] **Node tested** in flow editor
- [ ] **Documentation updated** if needed

Your node is now ready to use in the visual flow editor! 🎉 