# Factory Node System Documentation

## Overview

The Factory Node System is a powerful abstraction layer for creating consistent, maintainable, and feature-rich React Flow nodes. It provides a unified approach to node creation with built-in error handling, styling, inspector controls, and lifecycle management.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Type System](#type-system)
3. [Node Creation Process](#node-creation-process)
4. [Configuration Reference](#configuration-reference)
5. [Inspector Controls](#inspector-controls)
6. [Styling System](#styling-system)
7. [Error Handling](#error-handling)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Core Concepts

### Factory Architecture

The factory system consists of several key components:

- **NodeFactory.tsx**: Core factory function and configuration system
- **Node Inspector Registry**: Centralized inspector control management
- **Configuration Registry**: Automatic node type configuration registration
- **Styling Integration**: Category-based styling with theme support
- **Error Recovery**: Built-in error handling and recovery mechanisms

### Key Benefits

- **Consistency**: All nodes follow the same patterns and behaviors
- **Maintainability**: Centralized logic for common node features
- **Type Safety**: Full TypeScript support with proper type inference
- **Automatic Registration**: Inspector controls and configurations are auto-registered
- **Error Resilience**: Built-in error handling and recovery systems

---

## Type System

### Base Interfaces

```typescript
// Base data interface that all factory nodes must extend
interface BaseNodeData {
  error?: string;
  [key: string]: any;
}

// Handle configuration for inputs/outputs
interface HandleConfig {
  id: string;
  dataType: 's' | 'n' | 'b' | 'j' | 'a' | 'N' | 'f' | 'x' | 'u' | 'S' | '∅';
  position: Position;
  type: 'source' | 'target';
}

// Node size configuration
interface NodeSize {
  collapsed: {
    width: string;
    height: string;
  };
  expanded: {
    width: string;
  };
}
```

### Data Types

| Code | Type | Description |
|------|------|-------------|
| `s` | string | Text data |
| `n` | number | Numeric data |
| `b` | boolean | Boolean/trigger data |
| `j` | object | JSON object |
| `a` | array | Array data |
| `N` | null | Null value |
| `f` | function | Function data |
| `x` | mixed | Mixed type |
| `u` | undefined | Undefined |
| `S` | stream | Data stream |
| `∅` | empty | No data |

### Node Categories

| Category | Description | Color Theme |
|----------|-------------|-------------|
| `create` | Data creation nodes | Blue |
| `turn` | Data transformation | Green |
| `trigger` | Event/trigger nodes | Yellow |
| `logic` | Logic operations | Purple |
| `misc` | Miscellaneous | Gray |

---

## Node Creation Process

### Step 1: Define Your Data Interface

```typescript
interface MyNodeData extends BaseNodeData {
  inputText: string;
  outputText: string;
  isEnabled: boolean;
  customSettings?: {
    multiplier: number;
    prefix: string;
  };
}
```

### Step 2: Create the Node Configuration

```typescript
const MyNode = createNodeComponent<MyNodeData>({
  // Required: Unique identifier for this node type
  nodeType: 'myCustomNode',
  
  // Required: Category for styling and organization
  category: 'turn', // 'create' | 'turn' | 'trigger' | 'logic' | 'misc'
  
  // Required: Display name in UI
  displayName: 'My Custom Node',
  
  // Required: Default data structure
  defaultData: {
    inputText: '',
    outputText: '',
    isEnabled: true,
    customSettings: {
      multiplier: 1,
      prefix: ''
    }
  },
  
  // Required: Handle configuration
  handles: [
    { id: 's1', dataType: 's', position: Position.Left, type: 'target' },
    { id: 'b1', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 's2', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  // Required: Processing logic
  processLogic: ({ id, data, connections, nodesData, updateNodeData, setError }) => {
    // Implementation details below
  },
  
  // Required: Collapsed state rendering
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    // Implementation details below
  },
  
  // Required: Expanded state rendering
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    // Implementation details below
  },
  
  // Optional: Custom node sizes
  size: {
    collapsed: { width: 'w-[140px]', height: 'h-[70px]' },
    expanded: { width: 'w-[200px]' }
  },
  
  // Optional: Inspector controls
  renderInspectorControls: ({ node, updateNodeData }) => {
    // Implementation details below
  },
  
  // Optional: Error recovery data
  errorRecoveryData: {
    inputText: '',
    outputText: '',
    isEnabled: true
  }
});
```

### Step 3: Implement Processing Logic

```typescript
processLogic: ({ id, data, connections, nodesData, updateNodeData, setError }) => {
  try {
    // Filter connections by handle ID
    const textConnections = connections.filter(c => c.targetHandle === 's1');
    const triggerConnections = connections.filter(c => c.targetHandle === 'b1');
    
    // Get input values from connected nodes
    const inputTexts = nodesData
      .filter(node => textConnections.some(c => c.source === node.id))
      .map(node => node.data?.text || node.data?.outputText || '')
      .filter(text => typeof text === 'string');
    
    const triggers = nodesData
      .filter(node => triggerConnections.some(c => c.source === node.id))
      .map(node => node.data?.triggered || node.data?.value || false);
    
    // Check if node should be active
    const isTriggered = triggerConnections.length === 0 || 
                       triggers.some(t => Boolean(t));
    
    if (!isTriggered) {
      updateNodeData(id, { outputText: '' });
      return;
    }
    
    // Process the input
    const combinedInput = inputTexts.join(' ');
    let result = combinedInput;
    
    if (data.customSettings?.prefix) {
      result = data.customSettings.prefix + result;
    }
    
    if (data.customSettings?.multiplier && data.customSettings.multiplier > 1) {
      result = result.repeat(data.customSettings.multiplier);
    }
    
    // Validation
    if (result.length > 10000) {
      throw new Error('Output too long (max 10,000 characters)');
    }
    
    // Update node data
    updateNodeData(id, {
      inputText: combinedInput,
      outputText: result
    });
    
  } catch (error) {
    console.error(`MyNode ${id} - Processing error:`, error);
    setError(error instanceof Error ? error.message : 'Processing failed');
    
    // Reset to safe state
    updateNodeData(id, {
      inputText: '',
      outputText: ''
    });
  }
}
```

### Step 4: Implement Rendering Functions

#### Collapsed State

```typescript
renderCollapsed: ({ data, error, updateNodeData, id }) => {
  const previewText = data.outputText || data.inputText || 'No input';
  const displayText = previewText.length > 15 
    ? previewText.substring(0, 15) + '...' 
    : previewText;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div className="text-xs font-semibold mb-1">
        {error ? 'Error' : 'My Node'}
      </div>
      {error ? (
        <div className="text-xs text-center text-red-600 break-words">
          {error}
        </div>
      ) : (
        <div className="text-xs text-center break-words">
          {displayText}
        </div>
      )}
    </div>
  );
}
```

#### Expanded State

```typescript
renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => (
  <div className="flex text-xs flex-col w-auto">
    <div className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}>
      <span>{error ? 'Error' : 'My Custom Node'}</span>
      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">● {error}</span>
      )}
    </div>
    
    {error && (
      <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
        <div className="font-semibold mb-1">Error Details:</div>
        <div className="mb-2">{error}</div>
      </div>
    )}
    
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium mb-1">Input:</label>
        <div className="min-h-[30px] text-xs bg-gray-50 dark:bg-gray-800 border rounded px-2 py-1">
          {data.inputText || 'No input connected'}
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-medium mb-1">Output:</label>
        <div className="min-h-[30px] text-xs bg-white dark:bg-gray-700 border rounded px-2 py-1">
          {data.outputText || 'No output'}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id={`enabled-${id}`}
          checked={data.isEnabled}
          onChange={(e) => updateNodeData(id, { isEnabled: e.target.checked })}
          className="rounded"
        />
        <label htmlFor={`enabled-${id}`} className="text-xs">
          Enabled
        </label>
      </div>
    </div>
  </div>
)
```

### Step 5: Add Inspector Controls (Optional)

```typescript
renderInspectorControls: ({ node, updateNodeData }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-xs font-medium mb-1">
        Prefix:
      </label>
      <input
        type="text"
        className="w-full rounded border px-2 py-1 text-xs"
        placeholder="Enter prefix..."
        value={node.data.customSettings?.prefix || ''}
        onChange={(e) => updateNodeData(node.id, {
          customSettings: {
            ...node.data.customSettings,
            prefix: e.target.value
          }
        })}
      />
    </div>
    
    <div>
      <label className="block text-xs font-medium mb-1">
        Multiplier:
      </label>
      <input
        type="number"
        min="1"
        max="10"
        className="w-full rounded border px-2 py-1 text-xs"
        value={node.data.customSettings?.multiplier || 1}
        onChange={(e) => updateNodeData(node.id, {
          customSettings: {
            ...node.data.customSettings,
            multiplier: parseInt(e.target.value) || 1
          }
        })}
      />
    </div>
    
    <div className="flex items-center space-x-2">
      <input
        type="checkbox"
        id={`inspector-enabled-${node.id}`}
        checked={node.data.isEnabled}
        onChange={(e) => updateNodeData(node.id, { isEnabled: e.target.checked })}
      />
      <label htmlFor={`inspector-enabled-${node.id}`} className="text-xs">
        Node Enabled
      </label>
    </div>
  </div>
)
```

---

## Configuration Reference

### NodeFactoryConfig Interface

```typescript
interface NodeFactoryConfig<T extends BaseNodeData> {
  // Core identification
  nodeType: string;           // Unique identifier
  category: NodeCategory;     // Styling category
  displayName: string;        // UI display name
  
  // Structure
  size?: NodeSize;           // Custom size configuration
  handles: HandleConfig[];   // Input/output handles
  defaultData: T;           // Default data structure
  
  // Logic
  processLogic: (props: ProcessLogicProps<T>) => void;
  
  // Rendering
  renderCollapsed: (props: RenderProps<T>) => ReactNode;
  renderExpanded: (props: RenderExpandedProps<T>) => ReactNode;
  renderInspectorControls?: (props: InspectorControlProps<T>) => ReactNode;
  
  // Error handling
  errorRecoveryData?: Partial<T>;
}
```

### Default Sizes

```typescript
// Text nodes (default)
const DEFAULT_TEXT_NODE_SIZE = {
  collapsed: { width: 'w-[120px]', height: 'h-[60px]' },
  expanded: { width: 'w-[180px]' }
};

// Logic nodes
const DEFAULT_LOGIC_NODE_SIZE = {
  collapsed: { width: 'w-[60px]', height: 'h-[60px]' },
  expanded: { width: 'w-[120px]' }
};
```

### Helper Functions

```typescript
// Create text node configuration with defaults
createTextNodeConfig<T>({
  // your overrides
});

// Create logic node configuration with defaults
createLogicNodeConfig<T>({
  // your overrides
});
```

---

## Inspector Controls

### Pre-built Control Helpers

```typescript
// Text input control
const MyTextControl = createTextInputControl(
  'Label Text',      // label
  'dataPropertyKey', // data property to bind to
  'Placeholder...'   // optional placeholder
);

// Number input control
const MyNumberControl = createNumberInputControl(
  'Number Value',    // label
  'numberProperty',  // data property
  0,                // min value
  100,              // max value
  1                 // step
);

// Checkbox control
const MyCheckboxControl = createCheckboxControl(
  'Enable Feature',  // label
  'booleanProperty' // data property
);
```

### Custom Inspector Controls

```typescript
renderInspectorControls: ({ node, updateNodeData, inspectorState }) => {
  return (
    <div className="space-y-4">
      {/* Custom dropdown */}
      <div>
        <label className="block text-xs font-medium mb-1">
          Mode:
        </label>
        <select
          className="w-full rounded border px-2 py-1 text-xs"
          value={node.data.mode || 'default'}
          onChange={(e) => updateNodeData(node.id, { mode: e.target.value })}
        >
          <option value="default">Default</option>
          <option value="advanced">Advanced</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      {/* Conditional controls */}
      {node.data.mode === 'advanced' && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Advanced Setting:
          </label>
          <textarea
            className="w-full rounded border px-2 py-1 text-xs"
            rows={3}
            value={node.data.advancedConfig || ''}
            onChange={(e) => updateNodeData(node.id, { 
              advancedConfig: e.target.value 
            })}
            placeholder="Enter JSON configuration..."
          />
        </div>
      )}
      
      {/* Inspector state integration */}
      {inspectorState && (
        <div>
          <label className="block text-xs font-medium mb-1">
            Duration (ms):
          </label>
          <input
            type="text"
            className="w-full rounded border px-2 py-1 text-xs"
            value={inspectorState.durationInput}
            onChange={(e) => {
              inspectorState.setDurationInput(e.target.value);
              // Validate and update node data
              const duration = parseInt(e.target.value);
              if (!isNaN(duration) && duration > 0) {
                updateNodeData(node.id, { duration });
              }
            }}
            placeholder="500"
          />
        </div>
      )}
    </div>
  );
}
```

---

## Styling System

### Category-Based Styling

The factory automatically applies styling based on the node category:

```typescript
// Blue theme for 'create' category
category: 'create'

// Green theme for 'turn' category  
category: 'turn'

// Yellow theme for 'trigger' category
category: 'trigger'

// Purple theme for 'logic' category
category: 'logic'

// Gray theme for 'misc' category
category: 'misc'
```

### Custom Styling

```typescript
// Access to theme objects in expanded rendering
renderExpanded: ({ categoryTextTheme, textTheme }) => (
  <div className={categoryTextTheme.primary}>
    {/* Uses category-specific text color */}
  </div>
)
```

### Available Theme Properties

```typescript
categoryTextTheme: {
  primary: string;    // Main text color
  secondary: string;  // Secondary text color
  border: string;     // Border color
  focus: string;      // Focus ring color
}

categoryButtonTheme: string; // Button styling classes
categoryBaseClasses: {
  background: string; // Background color
  border: string;     // Border color
}
```

---

## Error Handling

### Built-in Error Features

1. **Automatic Error Recovery**: Red recovery button appears on errors
2. **Error State Rendering**: Special error styling and messaging
3. **Safe Fallbacks**: Automatic fallback to errorRecoveryData
4. **Error Propagation**: Errors don't crash the entire flow

### Error Handling Best Practices

```typescript
processLogic: ({ id, data, updateNodeData, setError }) => {
  try {
    // Validate inputs
    if (!data.requiredField) {
      throw new Error('Required field is missing');
    }
    
    // Validate input ranges
    if (data.number < 0 || data.number > 1000) {
      throw new Error('Number must be between 0 and 1000');
    }
    
    // Process data
    const result = processData(data);
    
    // Validate output
    if (result.length > 10000) {
      throw new Error('Output too large');
    }
    
    updateNodeData(id, { output: result });
    
  } catch (error) {
    console.error(`${nodeType} ${id} - Error:`, error);
    setError(error instanceof Error ? error.message : 'Unknown error');
    
    // Reset to safe state
    updateNodeData(id, { output: '' });
  }
}
```

### Error Recovery Data

```typescript
errorRecoveryData: {
  // Provide safe default values for all properties
  text: '',
  value: 0,
  isEnabled: false,
  complexData: null
}
```

---

## Examples

### Simple Text Transformer

```typescript
interface UppercaseNodeData extends BaseNodeData {
  inputText: string;
  outputText: string;
}

const UppercaseNode = createNodeComponent<UppercaseNodeData>({
  nodeType: 'uppercaseNode',
  category: 'turn',
  displayName: 'To Uppercase',
  defaultData: { inputText: '', outputText: '' },
  
  handles: [
    { id: 's', dataType: 's', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  
  processLogic: ({ data, nodesData, updateNodeData, id, setError }) => {
    try {
      const inputText = nodesData
        .map(node => node.data?.text || '')
        .join(' ');
      
      const uppercased = inputText.toUpperCase();
      updateNodeData(id, { 
        inputText, 
        outputText: uppercased 
      });
    } catch (error) {
      setError('Failed to process text');
      updateNodeData(id, { inputText: '', outputText: '' });
    }
  },
  
  renderCollapsed: ({ data, error }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div className="text-xs font-semibold mb-1">
        {error ? 'Error' : 'UPPER'}
      </div>
      <div className="text-xs text-center break-words">
        {error ? error : (data.outputText || 'No input')}
      </div>
    </div>
  ),
  
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        {error ? 'Error' : 'To Uppercase'}
      </div>
      <div className="min-h-[65px] text-xs break-all bg-white border rounded px-3 py-2">
        {error ? error : (data.outputText || 'Connect text input')}
      </div>
    </div>
  )
});
```

### Trigger Node with Controls

```typescript
interface TimerNodeData extends BaseNodeData {
  isRunning: boolean;
  duration: number;
  triggered: boolean;
}

const TimerNode = createNodeComponent<TimerNodeData>({
  nodeType: 'timerNode',
  category: 'trigger',
  displayName: 'Timer',
  defaultData: { isRunning: false, duration: 1000, triggered: false },
  
  handles: [
    { id: 'b_in', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'b_out', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  
  processLogic: ({ id, data, connections, nodesData, updateNodeData }) => {
    const startConnections = connections.filter(c => c.targetHandle === 'b_in');
    const shouldStart = startConnections.length === 0 || 
                       nodesData.some(node => node.data?.triggered);
    
    if (shouldStart && !data.isRunning) {
      updateNodeData(id, { isRunning: true, triggered: false });
      
      setTimeout(() => {
        updateNodeData(id, { isRunning: false, triggered: true });
        setTimeout(() => {
          updateNodeData(id, { triggered: false });
        }, 100);
      }, data.duration);
    }
  },
  
  renderCollapsed: ({ data, error, updateNodeData, id }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div className="text-xs font-semibold mb-1">Timer</div>
      <button
        className="text-xs px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200"
        onClick={() => updateNodeData(id, { 
          isRunning: true, 
          triggered: false 
        })}
        disabled={data.isRunning}
      >
        {data.isRunning ? 'Running...' : 'Start'}
      </button>
    </div>
  ),
  
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        Timer Node
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-xs font-medium mb-1">
            Duration (ms):
          </label>
          <input
            type="number"
            min="100"
            max="10000"
            step="100"
            className="w-full rounded border px-2 py-1 text-xs"
            value={data.duration}
            onChange={(e) => updateNodeData(id, { 
              duration: parseInt(e.target.value) || 1000 
            })}
            disabled={data.isRunning}
          />
        </div>
        <button
          className="w-full text-xs px-2 py-1 rounded bg-yellow-100 hover:bg-yellow-200 disabled:bg-gray-100"
          onClick={() => updateNodeData(id, { 
            isRunning: true, 
            triggered: false 
          })}
          disabled={data.isRunning}
        >
          {data.isRunning ? 'Running...' : 'Start Timer'}
        </button>
      </div>
    </div>
  ),
  
  renderInspectorControls: createNumberInputControl(
    'Timer Duration',
    'duration',
    100,
    10000,
    100
  )
});
```

---

## Best Practices

### 1. Data Structure Design

- Always extend `BaseNodeData`
- Use meaningful property names
- Provide sensible defaults
- Keep data serializable (no functions, complex objects)

```typescript
// Good
interface MyNodeData extends BaseNodeData {
  inputText: string;
  outputValue: number;
  isEnabled: boolean;
  settings: {
    mode: 'fast' | 'accurate';
    threshold: number;
  };
}

// Avoid
interface BadNodeData extends BaseNodeData {
  data: any; // Too generic
  callback: () => void; // Not serializable
  complexObject: SomeComplexClass; // Not serializable
}
```

### 2. Error Handling

- Always wrap processing logic in try-catch
- Provide meaningful error messages
- Reset to safe state on errors
- Include validation for all inputs

### 3. Performance

- Avoid expensive operations in render functions
- Use React.memo for complex components
- Validate input ranges to prevent memory issues
- Implement proper cleanup for timers/intervals

### 4. User Experience

- Provide clear visual feedback
- Show meaningful previews in collapsed state
- Include helpful placeholder text
- Make controls intuitive and discoverable

### 5. Testing

- Test with various input combinations
- Test error conditions
- Test connection/disconnection scenarios
- Verify inspector controls work correctly

### 6. Documentation

- Document complex logic with comments
- Provide examples for other developers
- Document expected input/output formats
- Include performance considerations

---

## Registration Process

When you create a factory node, several automatic registrations occur:

### 1. Node Type Configuration
```typescript
// Automatically added to NODE_TYPE_CONFIG
{
  [nodeType]: {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: !!config.renderInspectorControls,
    hasOutput: false // Currently always false, may be configurable in future
  }
}
```

### 2. Inspector Controls Registration
```typescript
// If renderInspectorControls is provided, automatically registered
NODE_INSPECTOR_REGISTRY.set(nodeType, renderInspectorControls);
```

### 3. React Component Creation
```typescript
// Returns a memoized React component with:
// - Proper display name
// - Full TypeScript typing
// - Built-in lifecycle management
// - Error handling
// - Styling integration
```

This automatic registration ensures your factory nodes integrate seamlessly with the existing node inspector system and flow editor. 