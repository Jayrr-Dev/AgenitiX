# How to Create a Node Using the Factory System

## 🎯 Overview

The Node Factory is a modular system for creating React Flow nodes with automatic features like:
- **Automatic JSON input support** (Vibe Mode)
- **Smart propagation engine** with caching
- **Ultra-fast activation/deactivation**
- **Error handling and recovery**
- **Inspector control registration**
- **TypeScript type safety**

## 📋 Quick Start

### 1. Basic Node Structure

```typescript
import { createNodeComponent, type BaseNodeData, type NodeFactoryConfig } from '../factory';
import { Position } from '@xyflow/react';

// Define your node's data interface
interface MyNodeData extends BaseNodeData {
  text: string;
  count: number;
  isEnabled: boolean;
}

// Create the factory configuration
const config: NodeFactoryConfig<MyNodeData> = {
  nodeType: 'myCustomNode',
  category: 'transformation', // 'input', 'logic', 'transformation', 'output', 'data'
  displayName: 'My Custom Node',
  
  // Define input/output handles
  handles: [
    { id: 'trigger', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'text-in', dataType: 's', position: Position.Top, type: 'target' },
    { id: 'text-out', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Default data
  defaultData: {
    text: '',
    count: 0,
    isEnabled: true
  },
  
  // Processing logic
  processLogic: ({ id, data, connections, nodesData, updateNodeData, setError }) => {
    try {
      // Your node logic here
      const result = data.text.toUpperCase();
      updateNodeData(id, { text: result });
    } catch (error) {
      setError(error.message);
    }
  },
  
  // Collapsed view (60x60 or 120x60)
  renderCollapsed: ({ data, nodeType }) => (
    <div className="text-xs font-bold">
      {data.text || 'Custom'}
    </div>
  ),
  
  // Expanded view (120x120)
  renderExpanded: ({ data, updateNodeData, id, textTheme }) => (
    <div className="flex flex-col gap-2">
      <div className={`text-sm font-medium ${textTheme}`}>
        My Custom Node
      </div>
      <input 
        type="text"
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        className="px-2 py-1 text-xs border rounded"
      />
    </div>
  )
};

// Create and export the component
export const MyCustomNode = createNodeComponent(config);
```

### 2. Register the Node

After creating your node, you need to register it in three places:

#### A. FlowEditor.tsx
```typescript
import { MyCustomNode } from './path/to/MyCustomNode';

const nodeTypes = {
  // ... existing nodes
  myCustomNode: MyCustomNode,
};
```

#### B. Sidebar.tsx
```typescript
const sidebarButtons = [
  // ... existing buttons
  {
    type: 'myCustomNode',
    label: 'My Custom',
    icon: '🔧', // Your icon
    category: 'Transformation'
  }
];
```

#### C. NodeInspector.tsx
The factory automatically registers inspector controls if you provide `renderInspectorControls`.

## 🛠️ Configuration Options

### Node Types and Categories

```typescript
// Available categories
type NodeCategory = 'input' | 'logic' | 'transformation' | 'output' | 'data';

// This affects styling and visual appearance
category: 'transformation' // Changes colors and themes automatically
```

### Handle Configuration

```typescript
// Handle data types
type DataType = 's' | 'n' | 'b' | 'j' | 'a' | 'N' | 'f' | 'x' | 'u' | 'S' | '∅';
// s = string, n = number, b = boolean, j = json, a = array, etc.

handles: [
  { id: 'input', dataType: 's', position: Position.Left, type: 'target' },
  { id: 'output', dataType: 's', position: Position.Right, type: 'source' },
  { id: 'trigger', dataType: 'b', position: Position.Bottom, type: 'target' }
]
```

### Custom Node Sizes

```typescript
import { type NodeSize } from '../factory';

size: {
  collapsed: {
    width: 'w-[150px]',  // Custom width
    height: 'h-[80px]'   // Custom height
  },
  expanded: {
    width: 'w-[200px]'   // Expanded width
  }
}
```

## 🎨 Using Helper Functions

### Pre-configured Node Types

```typescript
import { createTextNodeConfig, createLogicNodeConfig } from '../factory';

// Text node (120x60 collapsed, good for text processing)
const textConfig = createTextNodeConfig({
  nodeType: 'myTextNode',
  category: 'transformation',
  displayName: 'Text Processor',
  // ... rest of config
});

// Logic node (60x60 collapsed, good for boolean operations)
const logicConfig = createLogicNodeConfig({
  nodeType: 'myLogicNode', 
  category: 'logic',
  displayName: 'Logic Gate',
  // ... rest of config
});
```

### Adding Trigger Support

```typescript
import { createTriggeredNodeConfig } from '../factory';

// Automatically adds trigger handling
const triggeredConfig = createTriggeredNodeConfig(
  {
    nodeType: 'myTriggeredNode',
    // ... your config
  },
  '' // Value to output when inactive (optional)
);
```

## 🎛️ Inspector Controls

### Using Pre-built Controls

```typescript
import { 
  createTextInputControl,
  createNumberInputControl,
  createCheckboxControl,
  createSelectControl,
  createGroupControl
} from '../factory';

const config: NodeFactoryConfig<MyNodeData> = {
  // ... other config
  
  renderInspectorControls: createGroupControl('Settings', [
    createTextInputControl('Text Value', 'text', 'Enter text...'),
    createNumberInputControl('Count', 'count', 0, 100, 1),
    createCheckboxControl('Enabled', 'isEnabled'),
    createSelectControl('Mode', 'mode', [
      { value: 'fast', label: 'Fast Mode' },
      { value: 'slow', label: 'Slow Mode' }
    ])
  ])
};
```

### Custom Inspector Controls

```typescript
renderInspectorControls: ({ node, updateNodeData }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs">
      Custom Control:
      <input 
        type="range"
        min="0" 
        max="100"
        value={node.data.intensity || 50}
        onChange={(e) => updateNodeData(node.id, { 
          intensity: Number(e.target.value) 
        })}
      />
    </label>
  </div>
)
```

## 🚀 Advanced Features

### Processing Logic Patterns

```typescript
processLogic: ({ id, data, connections, nodesData, updateNodeData, setError }) => {
  try {
    // 1. GET INPUT DATA from connected nodes
    const inputConnections = connections.filter(c => c.targetHandle === 'input');
    const inputData = inputConnections.map(conn => {
      const sourceNode = nodesData.find(n => n.id === conn.source);
      return sourceNode?.data?.output || sourceNode?.data?.text || '';
    }).join(' ');

    // 2. PROCESS the data
    const result = processMyData(inputData, data.settings);

    // 3. UPDATE node data
    updateNodeData(id, { 
      output: result,
      lastProcessed: Date.now()
    });

  } catch (error) {
    // 4. HANDLE errors gracefully
    setError(`Processing failed: ${error.message}`);
  }
}
```

### Error Recovery

```typescript
const config: NodeFactoryConfig<MyNodeData> = {
  // ... other config
  
  // Data to restore on error recovery
  errorRecoveryData: {
    text: 'Default text',
    count: 0,
    isEnabled: true
  }
};
```

### JSON Input Support (Vibe Mode)

JSON input is automatically added to all factory nodes! Nodes can receive JSON data to update their properties programmatically.

**How it works:**
- A JSON input handle with ID `'j'` and dataType `'j'` is automatically added to all factory nodes
- The handle appears only when:
  - A JSON connection is made to the node, OR
  - Vibe Mode is active in the editor
- Connect any node that outputs JSON data (like "error gen") to this handle

```typescript
// Example JSON input that will automatically update the node:
{
  "text": "Updated via JSON",
  "count": 42,
  "isEnabled": false
}
```

**Debugging JSON connections:**
If JSON input isn't working, check:
1. **Handle visibility**: JSON handles only show when connected or when Vibe Mode is active
2. **Connection**: Make sure you're connecting to the `'j'` handle (JSON input)
3. **Source data**: The source node must output valid JSON data in its `output`, `value`, or `result` property
4. **Console logs**: Check browser console for JSON processing messages starting with `processJsonInput`

**Manual JSON processing** (if needed):
```typescript
import { processJsonInput } from '../factory';

// In your processLogic function:
processLogic: ({ id, data, connections, nodesData, updateNodeData }) => {
  // Get JSON input manually
  const jsonConnection = connections.find(c => c.targetHandle === 'j');
  if (jsonConnection) {
    const sourceNode = nodesData.find(n => n.id === jsonConnection.source);
    const jsonData = sourceNode?.data?.output || sourceNode?.data?.value;
    
    if (jsonData) {
      processJsonInput(jsonData, data, updateNodeData, id);
    }
  }
  
  // Your regular processing logic...
}
```

## 📝 Complete Examples

### 1. Simple Text Transformer

```typescript
import { createNodeComponent, createTextNodeConfig } from '../factory';
import { Position } from '@xyflow/react';

interface TextTransformData extends BaseNodeData {
  inputText: string;
  outputText: string;
  transform: 'uppercase' | 'lowercase' | 'reverse';
}

const textTransformConfig = createTextNodeConfig<TextTransformData>({
  nodeType: 'textTransform',
  category: 'transformation',
  displayName: 'Text Transform',
  
  handles: [
    { id: 'text-in', dataType: 's', position: Position.Left, type: 'target' },
    { id: 'text-out', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  defaultData: {
    inputText: '',
    outputText: '',
    transform: 'uppercase'
  },
  
  processLogic: ({ id, data, connections, nodesData, updateNodeData }) => {
    // Get input text from connected nodes
    const inputConnection = connections.find(c => c.targetHandle === 'text-in');
    let inputText = data.inputText;
    
    if (inputConnection) {
      const sourceNode = nodesData.find(n => n.id === inputConnection.source);
      inputText = sourceNode?.data?.output || sourceNode?.data?.text || '';
    }
    
    // Transform the text
    let outputText = '';
    switch (data.transform) {
      case 'uppercase':
        outputText = inputText.toUpperCase();
        break;
      case 'lowercase':
        outputText = inputText.toLowerCase();
        break;
      case 'reverse':
        outputText = inputText.split('').reverse().join('');
        break;
    }
    
    updateNodeData(id, { inputText, outputText });
  },
  
  renderCollapsed: ({ data }) => (
    <div className="text-xs font-bold text-center">
      {data.transform.slice(0, 4).toUpperCase()}
    </div>
  ),
  
  renderExpanded: ({ data, updateNodeData, id, textTheme }) => (
    <div className="flex flex-col gap-2">
      <div className={`text-sm font-medium ${textTheme}`}>
        Text Transform
      </div>
      
      <select 
        value={data.transform}
        onChange={(e) => updateNodeData(id, { transform: e.target.value })}
        className="px-2 py-1 text-xs border rounded"
      >
        <option value="uppercase">UPPERCASE</option>
        <option value="lowercase">lowercase</option>
        <option value="reverse">reverse</option>
      </select>
      
      <div className="text-xs">
        <div>Input: {data.inputText}</div>
        <div>Output: {data.outputText}</div>
      </div>
    </div>
  ),
  
  renderInspectorControls: createGroupControl('Transform Settings', [
    createSelectControl('Transform Type', 'transform', [
      { value: 'uppercase', label: 'Uppercase' },
      { value: 'lowercase', label: 'Lowercase' },
      { value: 'reverse', label: 'Reverse' }
    ])
  ])
});

export const TextTransformNode = createNodeComponent(textTransformConfig);
```

### 2. Counter Node with Trigger

```typescript
import { createTriggeredNodeConfig } from '../factory';

interface CounterData extends BaseNodeData {
  count: number;
  step: number;
  maxCount: number;
}

const counterConfig = createTriggeredNodeConfig<CounterData>({
  nodeType: 'counter',
  category: 'logic', 
  displayName: 'Counter',
  
  handles: [
    { id: 'count-out', dataType: 'n', position: Position.Right, type: 'source' },
    { id: 'reset', dataType: 'b', position: Position.Bottom, type: 'target' }
  ],
  
  defaultData: {
    count: 0,
    step: 1,
    maxCount: 100
  },
  
  processLogic: ({ id, data, connections, nodesData, updateNodeData }) => {
    // Check for reset trigger
    const resetConnection = connections.find(c => c.targetHandle === 'reset');
    if (resetConnection) {
      const resetNode = nodesData.find(n => n.id === resetConnection.source);
      if (resetNode?.data?.triggered) {
        updateNodeData(id, { count: 0 });
        return;
      }
    }
    
    // Increment counter
    const newCount = Math.min(data.count + data.step, data.maxCount);
    updateNodeData(id, { count: newCount });
  },
  
  renderCollapsed: ({ data }) => (
    <div className="text-lg font-bold text-center">
      {data.count}
    </div>
  ),
  
  renderExpanded: ({ data, updateNodeData, id, textTheme }) => (
    <div className="flex flex-col gap-2">
      <div className={`text-sm font-medium ${textTheme}`}>
        Counter
      </div>
      
      <div className="text-2xl font-bold text-center">
        {data.count}
      </div>
      
      <div className="flex gap-2">
        <input
          type="number"
          placeholder="Step"
          value={data.step}
          onChange={(e) => updateNodeData(id, { step: Number(e.target.value) })}
          className="flex-1 px-2 py-1 text-xs border rounded"
        />
        <input
          type="number"
          placeholder="Max"
          value={data.maxCount}
          onChange={(e) => updateNodeData(id, { maxCount: Number(e.target.value) })}
          className="flex-1 px-2 py-1 text-xs border rounded"
        />
      </div>
      
      <button
        onClick={() => updateNodeData(id, { count: 0 })}
        className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        Reset
      </button>
    </div>
  )
}, 0); // Output 0 when inactive

export const CounterNode = createNodeComponent(counterConfig);
```

## ✅ Best Practices

### 1. **Naming Conventions**
- Use camelCase for node types: `textTransform`, `numberCounter`
- Use PascalCase for components: `TextTransformNode`
- Use descriptive display names: `'Text Transform'`, `'Number Counter'`

### 2. **Handle Configuration**
- Always include JSON input support (automatic)
- Use consistent handle IDs: `'input'`, `'output'`, `'trigger'`
- Position handles logically (inputs left, outputs right)

### 3. **Data Structure**
- Extend `BaseNodeData` for your interfaces
- Initialize all properties in `defaultData`
- Use TypeScript for type safety

### 4. **Error Handling**
- Always wrap processing logic in try/catch
- Use `setError()` for user-friendly error messages
- Provide `errorRecoveryData` for recovery

### 5. **Performance**
- Use memoization for expensive calculations
- Keep processing logic lightweight
- Leverage the built-in caching system

### 6. **UI Consistency**
- Use provided styling hooks (`textTheme`, `categoryTextTheme`)
- Follow the collapsed/expanded size guidelines
- Use consistent input styling

## 🐛 Common Issues

### Issue: Node not appearing in sidebar
**Solution**: Make sure you've registered it in `Sidebar.tsx`

### Issue: Inspector controls not showing
**Solution**: Ensure `renderInspectorControls` is defined in your config

### Issue: Node not processing
**Solution**: Check that your `processLogic` function is properly defined and error-free

### Issue: Styling looks wrong
**Solution**: Use the provided styling hooks and follow size guidelines

### Issue: Connections not working
**Solution**: Verify handle IDs match your connection logic

## 🔗 Related Files

- `NodeFactory.tsx` - Main factory implementation
- `types/index.ts` - TypeScript definitions
- `constants/index.ts` - Configuration constants
- `helpers/` - Helper functions and utilities
- `utils/` - Core utility functions
- `registry/` - Inspector registration system

## 📚 Additional Resources

- Check existing nodes in `/features/business-logic/nodes/` for examples
- Review the modular architecture documentation in `/factory/`
- Use TypeScript intellisense for available options
- Test your nodes in different scenarios (connected, disconnected, error states)

---

**Happy node building! 🎉** 