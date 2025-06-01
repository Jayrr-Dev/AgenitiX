# Node Factory Documentation

## Overview

The NodeFactory provides a powerful system for creating custom nodes in the flow editor with built-in memory management, infinite loop prevention, and automatic trigger support.

## Core Features

- ✅ **Memory Leak Prevention**: Automatic timer cleanup and memory management
- ✅ **Infinite Loop Protection**: Circuit breakers prevent recursive updates
- ✅ **Trigger Support**: Boolean trigger inputs for conditional execution
- ✅ **Type Safety**: Full TypeScript support with generic data types
- ✅ **Performance Optimization**: Smart caching and debounced updates
- ✅ **Inspector Controls**: Dynamic UI controls for node configuration

## Quick Start

### Basic Text Transformation Node

```typescript
import { createNodeComponent, createTextNodeConfig, BaseNodeData } from '../factory/NodeFactory';

interface UppercaseNodeData extends BaseNodeData {
  text: string;
  inputText: string;
  customLabel?: string;
}

const UppercaseNode = createNodeComponent<UppercaseNodeData>({
  nodeType: 'uppercaseNode',
  category: 'transform',
  displayName: 'Uppercase Text',
  defaultData: { text: '', inputText: '', customLabel: 'UPPERCASE' },
  
  // Use the text node config helper for common patterns
  ...createTextNodeConfig({
    processLogic: ({ data, connections, nodesData, updateNodeData, id }) => {
      // Get input text from connected nodes
      const inputText = connections
        .filter(conn => conn.target === id)
        .map(conn => {
          const sourceNode = nodesData.find(n => n.id === conn.source);
          return sourceNode?.data?.text || sourceNode?.data?.output || '';
        })
        .join(' ');
      
      // Transform the text
      const uppercased = inputText.toUpperCase();
      
      // Update node data (circuit breaker prevents infinite loops)
      updateNodeData(id, { 
        text: uppercased, 
        inputText,
        output: uppercased 
      });
    },
    
    renderCollapsed: ({ data, error }) => (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        <div className="text-xs font-semibold mb-1">
          {error ? 'Error' : (data.customLabel || 'UPPERCASE')}
        </div>
        <div className="text-xs text-center break-words">
          {error ? error : (data.text || 'No input')}
        </div>
      </div>
    ),
    
    renderExpanded: ({ data, error, categoryTextTheme }) => (
      <div className="flex text-xs flex-col w-auto">
        <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
          {error ? 'Error' : (data.customLabel || 'Uppercase Node')}
        </div>
        <div className="min-h-[65px] text-xs break-all bg-white border rounded px-3 py-2">
          {error ? error : (data.text || 'Connect text input')}
        </div>
      </div>
    ),
    
    // Add inspector controls for customization
    renderInspectorControls: createTextInputControl(
      'Custom Label', 
      'customLabel', 
      'Enter custom label...'
    )
  })
});

export default UppercaseNode;
```

### Logic Node with Trigger Support

```typescript
import { 
  createNodeComponent, 
  createLogicNodeConfig, 
  createTriggeredNodeConfig,
  BaseNodeData 
} from '../factory/NodeFactory';

interface LogicAndNodeData extends BaseNodeData {
  result: boolean;
  inputA: boolean;
  inputB: boolean;
}

const LogicAndNode = createNodeComponent<LogicAndNodeData>(
  // Wrap with trigger support for conditional execution
  createTriggeredNodeConfig({
    nodeType: 'logicAnd',
    category: 'logic',
    displayName: 'Logic AND',
    defaultData: { result: false, inputA: false, inputB: false },
    
    ...createLogicNodeConfig({
      processLogic: ({ data, connections, nodesData, updateNodeData, id }) => {
        // Get boolean inputs from connected nodes
        const inputs = connections
          .filter(conn => conn.target === id)
          .map(conn => {
            const sourceNode = nodesData.find(n => n.id === conn.source);
            return Boolean(sourceNode?.data?.result || sourceNode?.data?.value);
          });
        
        const inputA = inputs[0] || false;
        const inputB = inputs[1] || false;
        const result = inputA && inputB;
        
        // Memory-safe update (automatic cleanup on node removal)
        updateNodeData(id, { result, inputA, inputB });
      },
      
      renderCollapsed: ({ data }) => (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`text-lg font-bold ${data.result ? 'text-green-600' : 'text-gray-400'}`}>
            AND
          </div>
        </div>
      )
    }),
    
    // When trigger is inactive, output false
    false
  })
);

export default LogicAndNode;
```

### Advanced Node with Custom Memory Management

```typescript
import { 
  createNodeComponent, 
  BaseNodeData,
  safeSetTimeout,
  safeSetInterval 
} from '../factory/NodeFactory';

interface TimerNodeData extends BaseNodeData {
  count: number;
  isRunning: boolean;
  duration: number;
}

const TimerNode = createNodeComponent<TimerNodeData>({
  nodeType: 'timerNode',
  category: 'automation',
  displayName: 'Timer Node',
  defaultData: { count: 0, isRunning: false, duration: 1000 },
  
  handles: [
    { id: 'trigger', type: 'target', dataType: 'b', position: Position.Left },
    { id: 'output', type: 'source', dataType: 'n', position: Position.Right }
  ],
  
  processLogic: ({ data, updateNodeData, id, setError }) => {
    if (data.isRunning && !data.isRunning) {
      // Start timer with automatic cleanup on node removal
      const intervalId = safeSetInterval(id, () => {
        updateNodeData(id, { count: data.count + 1 });
      }, data.duration);
      
      // Auto-stop after 10 counts
      safeSetTimeout(id, () => {
        updateNodeData(id, { isRunning: false });
      }, data.duration * 10);
      
      updateNodeData(id, { isRunning: true });
    }
  },
  
  renderCollapsed: ({ data }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-xs font-semibold">Timer</div>
      <div className="text-lg font-mono">{data.count}</div>
      <div className={`text-xs ${data.isRunning ? 'text-green-500' : 'text-gray-400'}`}>
        {data.isRunning ? 'Running' : 'Stopped'}
      </div>
    </div>
  ),
  
  renderExpanded: ({ data, categoryTextTheme }) => (
    <div className="flex flex-col p-3">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        Timer Node
      </div>
      <div className="space-y-2">
        <div>Count: {data.count}</div>
        <div>Duration: {data.duration}ms</div>
        <div className={data.isRunning ? 'text-green-500' : 'text-gray-400'}>
          Status: {data.isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>
    </div>
  ),
  
  renderInspectorControls: createNumberInputControl(
    'Duration (ms)', 
    'duration', 
    100, 
    10000, 
    100
  )
});

export default TimerNode;
```

## Helper Functions

### Memory-Safe Timers

```typescript
import { safeSetTimeout, safeSetInterval, registerTimeout } from '../utils/timerCleanup';

// These timers are automatically cleaned up when nodes are removed
const timeoutId = safeSetTimeout(nodeId, () => {
  console.log('Timer fired safely');
}, 1000);

const intervalId = safeSetInterval(nodeId, () => {
  console.log('Interval tick');
}, 500);
```

### Inspector Controls

```typescript
// Text input control
const textControl = createTextInputControl('Label', 'dataKey', 'Placeholder...');

// Number input with validation
const numberControl = createNumberInputControl('Count', 'count', 0, 100, 1);

// Checkbox control
const checkboxControl = createCheckboxControl('Enable Feature', 'enabled');

// Custom control
const customControl = <T extends BaseNodeData>({ node, updateNodeData }: InspectorControlProps<T>) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium">Custom Setting</label>
    <select 
      value={node.data.setting || 'default'}
      onChange={(e) => updateNodeData(node.id, { setting: e.target.value })}
      className="w-full px-3 py-2 border rounded"
    >
      <option value="default">Default</option>
      <option value="advanced">Advanced</option>
    </select>
  </div>
);
```

### Trigger Support

```typescript
// Add automatic trigger support to any node
const nodeConfig = createTriggeredNodeConfig({
  // ... your node config
}, 'inactive_value'); // Value when trigger is off

// Manual trigger checking
const isActive = shouldNodeBeActive(connections, nodesData);
if (isActive) {
  // Process node logic
} else {
  // Node is disabled by trigger
}
```

## Memory Management

### Automatic Cleanup

The NodeFactory automatically handles:
- ✅ Timer cleanup when nodes are removed
- ✅ Memory cleanup when storage is cleared
- ✅ Infinite loop prevention with circuit breakers
- ✅ Cache invalidation and cleanup

### Manual Memory Management

```typescript
// Emergency cleanup (useful for development)
if (typeof window !== 'undefined' && window.memoryCleanupDebug) {
  // Clear all accumulated memory
  window.memoryCleanupDebug.performCleanup();
  
  // Get memory statistics
  console.log(window.memoryCleanupDebug.getMemoryUsage());
  
  // Clear specific caches
  window.memoryCleanupDebug.clearCaches();
}
```

## Performance Optimization

### Circuit Breakers

The factory includes automatic circuit breakers that prevent infinite loops:

```typescript
// These are automatically handled by the factory:
// - 5ms minimum delay between processing cycles
// - Timestamp-based processing locks
// - Automatic cleanup of processing flags
```

### Caching

```typescript
// The factory automatically caches:
// - Node activation calculations
// - Downstream propagation results
// - Connection state evaluations

// Cache is automatically cleared when:
// - Nodes are removed
// - Connections change
// - Storage is cleared
```

## Best Practices

### 1. Always Use Base Interface
```typescript
interface MyNodeData extends BaseNodeData {
  // Your custom properties
  myProperty: string;
}
```

### 2. Handle Errors Gracefully
```typescript
processLogic: ({ setError, updateNodeData, id }) => {
  try {
    // Your logic here
  } catch (error) {
    setError(`Error in ${id}: ${error.message}`);
  }
}
```

### 3. Use Memory-Safe Timers
```typescript
// ❌ Don't use raw timers
const badTimer = setTimeout(() => {}, 1000);

// ✅ Use safe timers
const goodTimer = safeSetTimeout(nodeId, () => {}, 1000);
```

### 4. Leverage Configuration Helpers
```typescript
// ✅ Use configuration helpers for common patterns
...createTextNodeConfig({
  // Your overrides
})

// ✅ Use trigger support when needed
createTriggeredNodeConfig(config, inactiveValue)
```

### 5. Optimize Rendering
```typescript
renderCollapsed: ({ data, error }) => {
  // Keep collapsed view simple and fast
  return <SimpleDisplay data={data} />;
},

renderExpanded: ({ data, error, categoryTextTheme }) => {
  // More detailed view for expanded state
  return <DetailedDisplay data={data} theme={categoryTextTheme} />;
}
```

## Debugging

### Development Helpers

```typescript
// Available in development mode:
if (typeof window !== 'undefined') {
  // Timer debugging
  window.nodeTimerDebug?.getStats();
  window.nodeTimerDebug?.cleanup(nodeId);
  
  // Memory debugging  
  window.memoryCleanupDebug?.getMemoryUsage();
  window.memoryCleanupDebug?.performCleanup();
}
```

### Common Issues

1. **Memory Leaks**: Use `safeSetTimeout`/`safeSetInterval` instead of raw timers
2. **Infinite Loops**: The circuit breaker should prevent these automatically
3. **Stale Data**: Make sure to update node data correctly in `processLogic`
4. **Missing Triggers**: Use `createTriggeredNodeConfig` for conditional nodes

## Migration Guide

### From Old Factory Pattern

```typescript
// ❌ Old pattern
const MyNode = () => {
  const [data, setData] = useState(defaultData);
  // Manual timer management
  useEffect(() => {
    const timer = setTimeout(() => {}, 1000);
    return () => clearTimeout(timer); // Easy to forget!
  }, []);
};

// ✅ New pattern
const MyNode = createNodeComponent({
  // Automatic memory management
  processLogic: ({ id }) => {
    safeSetTimeout(id, () => {}, 1000); // Automatic cleanup!
  }
});
```

This documentation covers the current state of the NodeFactory with all the latest memory management, infinite loop prevention, and trigger support features! 