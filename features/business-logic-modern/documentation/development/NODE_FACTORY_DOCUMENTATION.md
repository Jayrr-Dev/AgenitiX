# 🏭 Node Factory System Documentation

## Overview

This document provides a comprehensive guide to the **Node Factory System** in the Agenix Visual Flow Editor. The Node Factory is a powerful, declarative system for creating consistent, feature-rich nodes with minimal boilerplate code while providing advanced capabilities like automatic JSON input support, trigger handling, error recovery, and visual feedback integration.

---

## 🎯 Core Concept

The Node Factory is a **declarative node creation system** that transforms simple configuration objects into fully-featured React components:

```
📝 CONFIGURATION → 🏭 FACTORY → ⚛️ REACT COMPONENT → 🎨 VISUAL NODE
```

**Benefits**:
- **🔄 Consistency**: All factory nodes follow the same patterns
- **⚡ Productivity**: Minimal boilerplate, maximum functionality  
- **🛡️ Safety**: Built-in error handling and recovery
- **🎨 Styling**: Automatic theme integration and visual feedback
- **🔌 Integration**: Seamless Vibe Mode and trigger support

---

## 🏗️ Architecture Overview

### **Factory Pipeline**

The Node Factory transforms configurations through a sophisticated pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│                CONFIGURATION INPUT                          │
│        (NodeFactoryConfig with handlers & data)             │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              CONFIGURATION ENHANCEMENT                      │
│    • JSON input support  • Handle validation  • Defaults   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               COMPONENT GENERATION                          │
│  • React component  • State management  • Effect handlers  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              AUTOMATIC REGISTRATIONS                        │
│  • Type config  • Inspector controls  • Handle management  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               RUNTIME FEATURES                              │
│ • Vibe Mode  • Triggers  • Error recovery  • Visual feedback│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              RENDERED NODE COMPONENT                        │
│           (Fully functional visual node)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components

### **Location**: `features/business-logic/nodes/factory/NodeFactory.tsx`

#### **Main Factory Function**

```typescript
export function createNodeComponent<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
): React.ComponentType<NodeProps<Node<T & Record<string, unknown>>>>
```

**Purpose**: Transforms a configuration object into a fully-featured React node component.

#### **Configuration Interface**

```typescript
export interface NodeFactoryConfig<T extends BaseNodeData> {
  nodeType: string;                    // Unique identifier
  category: NodeCategory;              // Visual theme category
  displayName: string;                 // Human-readable name
  size?: NodeSize;                     // Custom sizing
  handles: HandleConfig[];             // Input/output handles
  defaultData: T;                      // Initial node data
  processLogic: ProcessLogicFunction;  // Data processing logic
  renderCollapsed: RenderFunction;     // Collapsed state UI
  renderExpanded: RenderFunction;      // Expanded state UI
  renderInspectorControls?: RenderFunction; // Inspector controls
  errorRecoveryData?: Partial<T>;      // Error recovery defaults
}
```

#### **Base Node Data**

```typescript
export interface BaseNodeData {
  error?: string;                      // Error message
  isActive?: boolean;                  // Activation state
  [key: string]: any;                  // Additional properties
}
```

---

## 🎨 Visual System Integration

### **Automatic Styling**

The factory automatically integrates with the visual feedback system:

#### **Category-Based Themes**
```typescript
// Automatic theme application based on category
const categoryBaseClasses = useNodeCategoryBaseClasses(nodeType);
const categoryButtonTheme = useNodeCategoryButtonTheme(nodeType, !!error, isActive);
const categoryTextTheme = useNodeCategoryTextTheme(nodeType, !!error);
```

#### **State-Based Styling**
```typescript
// Automatic glow effects based on node state
const nodeStyleClasses = useNodeStyleClasses(!!selected, !!error, isActive);
const buttonTheme = useNodeButtonTheme(!!error, isActive);
const textTheme = useNodeTextTheme(!!error);
```

### **Size Management**

#### **Default Sizes**
```typescript
// Text nodes (CreateText, TurnToUppercase)
const DEFAULT_TEXT_NODE_SIZE: NodeSize = {
  collapsed: { width: 'w-[120px]', height: 'h-[60px]' },
  expanded: { width: 'w-[180px]' }
};

// Logic nodes (LogicAnd, LogicOr)
const DEFAULT_LOGIC_NODE_SIZE: NodeSize = {
  collapsed: { width: 'w-[60px]', height: 'h-[60px]' },
  expanded: { width: 'w-[120px]' }
};
```

#### **Custom Sizing**
```typescript
// Custom size configuration
const customSize: NodeSize = {
  collapsed: { width: 'w-[100px]', height: 'h-[80px]' },
  expanded: { width: 'w-[200px]' }
};
```

---

## ⚡ Advanced Features

### **1. Automatic JSON Input Support (Vibe Mode)**

Every factory node automatically gets JSON input capability:

```typescript
// Automatically added to all factory nodes
const enhancedConfig = {
  ...config,
  handles: addJsonInputSupport(config.handles) // Adds 'j' handle at top
};
```

**JSON Processing Logic**:
```typescript
// Automatic Vibe Mode processing in separate useEffect
useEffect(() => {
  if (!isVibeModeActive) return;
  
  // Find JSON connections
  const vibeConnections = connections.filter(c => 
    allJsonHandleIds.includes(c.targetHandle || '')
  );
  
  // Process JSON inputs
  jsonInputs.forEach(jsonInput => {
    try {
      let parsedData = typeof jsonInput === 'object' 
        ? jsonInput 
        : JSON.parse(jsonInput);
      
      // Filter out unsafe properties
      const { error: _, ...safeData } = parsedData;
      
      // Only update if there are actual changes
      if (hasChanges) {
        updateNodeData(id, safeData);
      }
    } catch (parseError) {
      console.error(`VibeMode ${id}: Failed to parse JSON:`, parseError);
    }
  });
}, [isVibeModeActive, connections, nodesData, id]);
```

### **2. Intelligent Trigger System**

Factory nodes automatically handle boolean trigger inputs:

```typescript
// Automatic trigger evaluation
const triggerInfo = (() => {
  // Filter for trigger connections (boolean handle 'b')
  const triggerConnections = connections.filter(c => c.targetHandle === 'b');
  const hasTrigger = triggerConnections.length > 0;
  
  if (!hasTrigger) {
    return true; // No trigger = always allow data
  }
  
  // Get trigger value from connected trigger nodes
  const triggerValue = getSingleInputValue(triggerNodesData);
  return isTruthyValue(triggerValue);
})();

// Final activation: meaningful output AND trigger allows
const finalIsActive = hasOutputData && triggerInfo;
```

### **3. Meaningful Output Detection**

Automatic activation state based on semantic data analysis:

```typescript
const hasOutputData = (() => {
  const currentData = data as T;
  
  // Special handling for specific node types
  if (nodeType === 'testJson') {
    return testJsonData?.parsedJson !== null && 
           testJsonData?.parseError === null;
  }
  
  if (nodeType === 'viewOutput') {
    return displayedValues?.some(item => {
      const content = item.content;
      // Complex meaningful content detection...
      return isContentMeaningful(content);
    });
  }
  
  // General rule: check priority properties
  const outputValue = currentData?.text ?? 
                     currentData?.value ?? 
                     currentData?.output ?? 
                     currentData?.result;
  
  return outputValue !== undefined && 
         outputValue !== null && 
         outputValue !== '';
})();
```

### **4. Error Recovery System**

Built-in error handling and recovery:

```typescript
// Automatic error recovery
const recoverFromError = () => {
  try {
    setIsRecovering(true);
    setError(null);
    
    // Reset to safe defaults
    const recoveryData = {
      ...config.defaultData,
      ...config.errorRecoveryData,
      error: null,
      isActive: false
    };
    
    updateNodeData(id, recoveryData);
    setTimeout(() => setIsRecovering(false), 1000);
  } catch (recoveryError) {
    console.error(`Recovery failed:`, recoveryError);
    setError('Recovery failed. Please refresh.');
  }
};
```

### **5. Inspector Controls Registration**

Automatic registration of node inspector controls:

```typescript
// Global registry for factory-created node inspector controls
const NODE_INSPECTOR_REGISTRY = new Map<string, Function>();

export const registerNodeInspectorControls = <T extends BaseNodeData>(
  nodeType: string, 
  renderControls: (props: InspectorControlProps<T>) => ReactNode
) => {
  NODE_INSPECTOR_REGISTRY.set(nodeType, renderControls);
};

// Automatic registration during node creation
if (config.renderInspectorControls) {
  registerNodeInspectorControls(config.nodeType, config.renderInspectorControls);
}
```

---

## 🛠️ Creating Nodes with the Factory

### **Basic Example: Text Processing Node**

```typescript
import { createNodeComponent, type BaseNodeData } from '../factory/NodeFactory';
import { Position } from '@xyflow/react';

// 1. Define data interface
interface UppercaseNodeData extends BaseNodeData {
  text: string;
  inputText: string;
}

// 2. Create node with factory
const UppercaseNode = createNodeComponent<UppercaseNodeData>({
  nodeType: 'uppercaseNode',
  category: 'turn', // Blue theme
  displayName: 'Uppercase',
  
  // Default data
  defaultData: { 
    text: '', 
    inputText: '' 
  },
  
  // Handle configuration
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },  // Trigger
    { id: 's', dataType: 's', position: Position.Left, type: 'target' },  // String input
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }  // String output
  ],
  
  // Processing logic
  processLogic: ({ data, nodesData, updateNodeData, id, setError }) => {
    try {
      // Get input text from connected nodes
      const inputText = nodesData
        .map(node => extractNodeValue(node.data))
        .filter(value => typeof value === 'string')
        .join(' ');
      
      // Process: convert to uppercase
      const uppercased = inputText.toUpperCase();
      
      // Update node data
      updateNodeData(id, { 
        text: uppercased, 
        inputText 
      });
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing error');
    }
  },
  
  // Collapsed state rendering
  renderCollapsed: ({ data, error }) => (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div className="text-xs font-semibold mb-1">
        {error ? 'Error' : 'ABC'}
      </div>
      <div className="text-xs text-center break-words">
        {error ? error : (data.text || 'No input')}
      </div>
    </div>
  ),
  
  // Expanded state rendering
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        {error ? 'Error' : 'Uppercase Node'}
      </div>
      
      {error ? (
        <div className="text-red-600 text-xs">{error}</div>
      ) : (
        <div className="space-y-2">
          <div className="text-xs">
            <span className="font-medium">Input: </span>
            <span className="font-mono">{data.inputText || 'None'}</span>
          </div>
          <div className="text-xs">
            <span className="font-medium">Output: </span>
            <span className="font-mono">{data.text || 'None'}</span>
          </div>
        </div>
      )}
    </div>
  ),
  
  // Optional: Inspector controls
  renderInspectorControls: ({ node, updateNodeData }) => (
    <div className="space-y-2">
      <label className="block text-xs">
        <span className="mb-1 block">Custom Prefix:</span>
        <input
          type="text"
          className="w-full rounded border px-2 py-1 text-xs"
          value={node.data.customPrefix || ''}
          onChange={(e) => updateNodeData(node.id, { customPrefix: e.target.value })}
        />
      </label>
    </div>
  ),
  
  // Optional: Error recovery data
  errorRecoveryData: {
    text: '',
    inputText: ''
  }
});

export default UppercaseNode;
```

### **Advanced Example: Logic Node with Multiple Inputs**

```typescript
interface LogicAndNodeData extends BaseNodeData {
  value: boolean;
  inputCount: number;
  trueInputs: number;
}

const LogicAndNode = createNodeComponent<LogicAndNodeData>({
  nodeType: 'logicAnd',
  category: 'logic', // Purple theme
  displayName: 'Logic AND',
  
  // Use logic node defaults
  size: {
    collapsed: { width: 'w-[60px]', height: 'h-[60px]' },
    expanded: { width: 'w-[120px]' }
  },
  
  defaultData: { 
    value: false, 
    inputCount: 0, 
    trueInputs: 0 
  },
  
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },   // Trigger
    { id: 'b1', dataType: 'b', position: Position.Left, type: 'target' },  // Boolean input 1
    { id: 'b2', dataType: 'b', position: Position.Left, type: 'target' },  // Boolean input 2
    { id: 'b', dataType: 'b', position: Position.Right, type: 'source' }   // Boolean output
  ],
  
  processLogic: ({ data, connections, nodesData, updateNodeData, id }) => {
    // Get boolean input connections (excluding trigger)
    const boolInputConnections = connections.filter(c => 
      c.targetHandle?.startsWith('b') && c.targetHandle !== 'b'
    );
    
    // Get boolean values from connected nodes
    const booleanInputs = nodesData
      .filter(node => boolInputConnections.some(c => c.source === node.id))
      .map(node => Boolean(extractNodeValue(node.data)))
      .filter(value => typeof value === 'boolean');
    
    const inputCount = booleanInputs.length;
    const trueInputs = booleanInputs.filter(Boolean).length;
    
    // AND logic: all inputs must be true
    const result = inputCount > 0 ? booleanInputs.every(Boolean) : false;
    
    updateNodeData(id, {
      value: result,
      inputCount,
      trueInputs
    });
  },
  
  renderCollapsed: ({ data, error }) => (
    <div className="absolute inset-0 flex items-center justify-center">
      {error ? (
        <div className="text-xs text-red-600">Error</div>
      ) : (
        <div className={`text-lg font-bold ${
          data.value ? 'text-purple-700' : 'text-purple-400'
        }`}>
          AND
        </div>
      )}
    </div>
  ),
  
  renderExpanded: ({ data, error, categoryTextTheme }) => (
    <div className="flex text-xs flex-col w-auto">
      <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
        Logic AND
      </div>
      
      {error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="space-y-1">
          <div>Output: <span className="font-mono">{String(data.value)}</span></div>
          <div>True inputs: {data.trueInputs}/{data.inputCount}</div>
          <div>Connected: {data.inputCount}</div>
        </div>
      )}
    </div>
  )
});
```

---

## 🎛️ Helper Functions & Utilities

### **Configuration Helpers**

#### **Text Node Configuration**
```typescript
export const createTextNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_TEXT_NODE_SIZE,
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 's', dataType: 's', position: Position.Right, type: 'source' }
  ],
  ...overrides
});

// Usage
const MyTextNode = createNodeComponent({
  nodeType: 'myTextNode',
  category: 'create',
  displayName: 'My Text Node',
  defaultData: { text: '' },
  ...createTextNodeConfig({
    processLogic: ({ /* ... */ }) => { /* custom logic */ }
  })
});
```

#### **Logic Node Configuration**
```typescript
export const createLogicNodeConfig = <T extends BaseNodeData>(
  overrides: Partial<NodeFactoryConfig<T>>
): Partial<NodeFactoryConfig<T>> => ({
  size: DEFAULT_LOGIC_NODE_SIZE,
  handles: [
    { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
    { id: 'b', dataType: 'b', position: Position.Right, type: 'source' }
  ],
  ...overrides
});
```

### **Inspector Control Helpers**

#### **Text Input Control**
```typescript
export const createTextInputControl = (
  label: string,
  dataKey: string,
  placeholder?: string
) => <T extends BaseNodeData>({ node, updateNodeData }: InspectorControlProps<T>) => (
  <div className="flex flex-col gap-2">
    <label className="block text-xs">
      <div className="flex flex-row gap-2">
        <span className="py-1">{label}:</span>
        <input
          type="text"
          className="w-full rounded border px-1 py-1 text-xs"
          placeholder={placeholder}
          value={typeof node.data[dataKey] === 'string' ? node.data[dataKey] : ''}
          onChange={(e) => updateNodeData(node.id, { [dataKey]: e.target.value })}
        />
      </div>
    </label>
  </div>
);

// Usage
renderInspectorControls: createTextInputControl('Label', 'customLabel', 'Enter label...')
```

#### **Number Input Control**
```typescript
export const createNumberInputControl = (
  label: string,
  dataKey: string,
  min?: number,
  max?: number,
  step?: number
) => // ... implementation

// Usage
renderInspectorControls: createNumberInputControl('Count', 'count', 0, 100, 1)
```

#### **Checkbox Control**
```typescript
export const createCheckboxControl = (
  label: string,
  dataKey: string
) => // ... implementation

// Usage
renderInspectorControls: createCheckboxControl('Enabled', 'enabled')
```

### **Advanced Feature Helpers**

#### **JSON Input Support**
```typescript
// Automatically adds JSON input handle
export const addJsonInputSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  const hasJsonInput = handles.some(h => h.type === 'target' && h.dataType === 'j');
  
  if (!hasJsonInput) {
    return [
      ...handles,
      { id: 'j', dataType: 'j', position: Position.Top, type: 'target' }
    ];
  }
  
  return handles;
};
```

#### **Trigger Support**
```typescript
// Adds boolean trigger input
export const addTriggerSupport = <T extends BaseNodeData>(
  handles: HandleConfig[]
): HandleConfig[] => {
  const hasTriggerInput = handles.some(h => h.type === 'target' && h.dataType === 'b');
  
  if (!hasTriggerInput) {
    return [
      { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
      ...handles
    ];
  }
  
  return handles;
};

// Wraps process logic with trigger checking
export const withTriggerSupport = <T extends BaseNodeData>(
  originalProcessLogic: ProcessLogicFunction<T>,
  inactiveOutputValue?: any
) => {
  return (props) => {
    const isActive = shouldNodeBeActive(props.connections, props.nodesData);
    
    if (!isActive) {
      // Clear outputs when inactive
      const clearOutputs = { /* ... */ };
      props.updateNodeData(props.id, clearOutputs);
      return;
    }
    
    // Run original logic when active
    originalProcessLogic(props);
  };
};
```

---

## 🔄 Registration System

### **Automatic Type Registration**

```typescript
// Automatically registers node type configuration
export const registerNodeTypeConfig = <T extends BaseNodeData>(
  nodeType: string,
  config: NodeFactoryConfig<T>
) => {
  const nodeConfig: NodeTypeConfig = {
    defaultData: config.defaultData,
    displayName: config.displayName,
    hasControls: !!config.renderInspectorControls,
    hasOutput: false,
  };

  // Add to global NODE_TYPE_CONFIG
  (NODE_TYPE_CONFIG as any)[nodeType] = nodeConfig;
};
```

### **Inspector Controls Registry**

```typescript
// Global registry for inspector controls
const NODE_INSPECTOR_REGISTRY = new Map<string, Function>();

// Registration function
export const registerNodeInspectorControls = <T extends BaseNodeData>(
  nodeType: string, 
  renderControls: (props: InspectorControlProps<T>) => ReactNode
) => {
  NODE_INSPECTOR_REGISTRY.set(nodeType, renderControls);
};

// Retrieval functions
export const getNodeInspectorControls = (nodeType: string) => {
  return NODE_INSPECTOR_REGISTRY.get(nodeType);
};

export const hasFactoryInspectorControls = (nodeType: string) => {
  return NODE_INSPECTOR_REGISTRY.has(nodeType);
};
```

---

## 🎨 Styling & Theming

### **Category-Based Styling**

The factory automatically applies styling based on node category:

```typescript
// Available categories and their themes
type NodeCategory = 
  | 'create'     // Blue theme - creation nodes
  | 'turn'       // Sky theme - transformation nodes  
  | 'logic'      // Purple theme - logic nodes
  | 'automation' // Green theme - automation nodes
  | 'test'       // Gray theme - testing/utility nodes
  | 'media'      // Orange theme - media nodes
  | 'main';      // Default theme
```

### **Automatic Style Application**

```typescript
// Applied automatically by factory
const categoryBaseClasses = useNodeCategoryBaseClasses(nodeType);
const categoryButtonTheme = useNodeCategoryButtonTheme(nodeType, !!error, isActive);
const categoryTextTheme = useNodeCategoryTextTheme(nodeType, !!error);

// State-based styling
const nodeStyleClasses = useNodeStyleClasses(!!selected, !!error, isActive);
const buttonTheme = useNodeButtonTheme(!!error, isActive);
const textTheme = useNodeTextTheme(!!error);
```

### **Custom Styling in Render Functions**

```typescript
renderExpanded: ({ data, error, categoryTextTheme, textTheme }) => (
  <div className="flex text-xs flex-col w-auto">
    {/* Use category theme for primary text */}
    <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
      Node Title
    </div>
    
    {/* Use category theme for secondary text */}
    <div className={`text-xs ${categoryTextTheme.secondary}`}>
      Subtitle or description
    </div>
    
    {/* Use error-aware text theme */}
    <div className={`text-xs ${textTheme.primary}`}>
      Content that adapts to error state
    </div>
  </div>
)
```

---

## 🚨 Error Handling

### **Built-in Error Recovery**

Every factory node includes automatic error recovery:

```typescript
// Automatic error recovery function
const recoverFromError = () => {
  try {
    setIsRecovering(true);
    setError(null);
    
    // Reset to safe defaults
    const recoveryData = {
      ...config.defaultData,           // Original defaults
      ...config.errorRecoveryData,     // Custom recovery data
      error: null,
      isActive: false
    };
    
    updateNodeData(id, recoveryData);
    setTimeout(() => setIsRecovering(false), 1000);
  } catch (recoveryError) {
    console.error('Recovery failed:', recoveryError);
    setError('Recovery failed. Please refresh.');
  }
};
```

### **Error State Management**

```typescript
// Error state handling in processLogic
processLogic: ({ data, updateNodeData, id, setError }) => {
  try {
    // Your processing logic here
    const result = processData(data);
    updateNodeData(id, { result });
    
  } catch (error) {
    // Set error state
    setError(error instanceof Error ? error.message : 'Processing error');
    
    // Optional: Update node data with error state
    updateNodeData(id, { 
      result: null,
      error: error.message 
    });
  }
}
```

### **Error Recovery Data**

```typescript
// Custom error recovery configuration
const MyNode = createNodeComponent({
  // ... other config
  errorRecoveryData: {
    text: '',           // Clear text on recovery
    count: 0,           // Reset count to zero
    enabled: false,     // Disable on recovery
    customProperty: 'safe-default'
  }
});
```

---

## 🔍 Debugging & Monitoring

### **Built-in Logging**

The factory includes comprehensive logging:

```typescript
// Automatic activation state logging
console.log(`Factory ${nodeType} ${id}: Setting isActive to ${finalIsActive} 
  (hasOutput: ${hasOutputData}, triggerAllows: ${triggerInfo})`);

// Vibe Mode processing logging
console.log(`VibeMode ${id}: Applying JSON data:`, safeData);

// Error logging
console.error(`${nodeType} ${id} - Processing error:`, processingError);
```

### **Development Tools**

#### **Inspector Integration**
```typescript
// Factory nodes automatically appear in Node Inspector
// with their custom controls and state information
```

#### **Console Debugging**
```typescript
// Check factory node state
const node = useFlowStore.getState().nodes.find(n => n.id === 'your-node-id');
console.log('Node data:', node.data);
console.log('Is active:', node.data?.isActive);
console.log('Has error:', !!node.data?.error);
```

#### **Registry Inspection**
```typescript
// Check registered inspector controls
console.log('Registered controls:', Array.from(NODE_INSPECTOR_REGISTRY.keys()));

// Check if node has factory controls
console.log('Has factory controls:', hasFactoryInspectorControls('yourNodeType'));
```

---

## 🚀 Best Practices

### **1. Data Interface Design**

```typescript
// ✅ GOOD - Clear, typed interface
interface MyNodeData extends BaseNodeData {
  inputText: string;
  outputText: string;
  processingMode: 'uppercase' | 'lowercase' | 'capitalize';
  isEnabled: boolean;
}

// ❌ AVOID - Vague, untyped interface
interface MyNodeData extends BaseNodeData {
  data: any;
  config: object;
  state: unknown;
}
```

### **2. Process Logic Organization**

```typescript
// ✅ GOOD - Clear, error-handled logic
processLogic: ({ data, nodesData, updateNodeData, id, setError }) => {
  try {
    // 1. Extract inputs
    const inputs = extractInputs(nodesData);
    
    // 2. Validate inputs
    if (!validateInputs(inputs)) {
      throw new Error('Invalid input data');
    }
    
    // 3. Process data
    const result = processData(inputs, data.processingMode);
    
    // 4. Update outputs
    updateNodeData(id, { outputText: result });
    
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Processing failed');
  }
}

// ❌ AVOID - Monolithic, unhandled logic
processLogic: ({ data, nodesData, updateNodeData, id }) => {
  const result = nodesData.map(n => n.data.text).join('').toUpperCase();
  updateNodeData(id, { text: result });
}
```

### **3. Render Function Best Practices**

```typescript
// ✅ GOOD - Consistent, themed rendering
renderExpanded: ({ data, error, categoryTextTheme }) => (
  <div className="flex text-xs flex-col w-auto">
    {/* Consistent header */}
    <div className={`font-semibold mb-2 ${categoryTextTheme.primary}`}>
      {error ? 'Error' : 'Node Title'}
    </div>
    
    {/* Error handling */}
    {error ? (
      <div className="text-red-600 text-xs p-2 bg-red-50 rounded">
        {error}
      </div>
    ) : (
      <div className="space-y-2">
        {/* Content sections */}
        <div className={`text-xs ${categoryTextTheme.secondary}`}>
          Status: {data.isEnabled ? 'Enabled' : 'Disabled'}
        </div>
        <div className={`text-xs ${categoryTextTheme.primary}`}>
          Output: {data.outputText || 'None'}
        </div>
      </div>
    )}
  </div>
)

// ❌ AVOID - Inconsistent, unthemed rendering
renderExpanded: ({ data }) => (
  <div>
    <span>Output: {data.text}</span>
  </div>
)
```

### **4. Handle Configuration**

```typescript
// ✅ GOOD - Clear, descriptive handles
handles: [
  { id: 'trigger', dataType: 'b', position: Position.Left, type: 'target' },
  { id: 'textInput', dataType: 's', position: Position.Left, type: 'target' },
  { id: 'textOutput', dataType: 's', position: Position.Right, type: 'source' },
  { id: 'statusOutput', dataType: 'b', position: Position.Right, type: 'source' }
]

// ❌ AVOID - Generic, confusing handles
handles: [
  { id: 'b', dataType: 'b', position: Position.Left, type: 'target' },
  { id: 's', dataType: 's', position: Position.Left, type: 'target' },
  { id: 'out', dataType: 'x', position: Position.Right, type: 'source' }
]
```

---

## 🔮 Advanced Patterns

### **1. Multi-Input Processing**

```typescript
processLogic: ({ connections, nodesData, updateNodeData, id }) => {
  // Group inputs by handle type
  const textInputs = connections
    .filter(c => c.targetHandle === 'textInput')
    .map(c => nodesData.find(n => n.id === c.source))
    .filter(Boolean)
    .map(node => extractNodeValue(node.data))
    .filter(value => typeof value === 'string');
  
  const numberInputs = connections
    .filter(c => c.targetHandle === 'numberInput')
    .map(c => nodesData.find(n => n.id === c.source))
    .filter(Boolean)
    .map(node => extractNodeValue(node.data))
    .filter(value => typeof value === 'number');
  
  // Process combined inputs
  const result = processMultipleInputs(textInputs, numberInputs);
  updateNodeData(id, { result });
}
```

### **2. Conditional Handle Visibility**

```typescript
// In the factory component render
{enhancedConfig.handles
  .filter(handle => handle.type === 'target')
  .filter(handle => {
    // Hide advanced handles unless in advanced mode
    if (handle.id === 'advancedInput') {
      return data.advancedMode === true;
    }
    
    // Hide JSON handles when Vibe Mode is off
    if (handle.dataType === 'j') {
      return isVibeModeActive;
    }
    
    return true;
  })
  .map(handle => (
    <CustomHandle key={handle.id} {...handle} />
  ))}
```

### **3. Dynamic Inspector Controls**

```typescript
renderInspectorControls: ({ node, updateNodeData }) => {
  const data = node.data;
  
  return (
    <div className="space-y-3">
      {/* Basic controls always visible */}
      <div>
        <label className="block text-xs mb-1">Mode:</label>
        <select
          className="w-full rounded border px-2 py-1 text-xs"
          value={data.mode || 'basic'}
          onChange={(e) => updateNodeData(node.id, { mode: e.target.value })}
        >
          <option value="basic">Basic</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>
      
      {/* Advanced controls only visible in advanced mode */}
      {data.mode === 'advanced' && (
        <div>
          <label className="block text-xs mb-1">Advanced Setting:</label>
          <input
            type="number"
            className="w-full rounded border px-2 py-1 text-xs"
            value={data.advancedSetting || 0}
            onChange={(e) => updateNodeData(node.id, { 
              advancedSetting: Number(e.target.value) 
            })}
          />
        </div>
      )}
    </div>
  );
}
```

### **4. State Persistence**

```typescript
// Factory automatically handles state persistence through Zustand
// No additional code needed - all updateNodeData calls are persisted

// For complex state that needs special handling:
processLogic: ({ data, updateNodeData, id }) => {
  // Complex state object
  const complexState = {
    history: [...(data.history || []), newEntry],
    cache: updateCache(data.cache, newData),
    metadata: {
      lastUpdated: Date.now(),
      version: data.metadata?.version + 1 || 1
    }
  };
  
  // Persist complex state
  updateNodeData(id, { complexState });
}
```

---

## 📚 Related Documentation

- [`MEANINGFUL_OUTPUT_SYSTEM.md`](./MEANINGFUL_OUTPUT_SYSTEM.md) - Output detection system
- [`GLOW_SYSTEM_DOCUMENTATION.md`](./GLOW_SYSTEM_DOCUMENTATION.md) - Visual feedback system
- [`EDGE_CREATION_SYSTEM.md`](./EDGE_CREATION_SYSTEM.md) - Connection system
- [`creating-new-nodes.md`](./node-docs/creating-new-nodes.md) - Manual node creation guide
- [`DATA_FLOW_ARCHITECTURE.md`](./DATA_FLOW_ARCHITECTURE.md) - Overall system architecture

---

## 🤝 Contributing

When working with the Node Factory:

1. **Follow the configuration pattern** - Use the factory for all new nodes
2. **Leverage helper functions** - Use provided utilities for common patterns
3. **Test thoroughly** - Verify all factory features work correctly
4. **Document custom logic** - Explain any special processing requirements
5. **Maintain consistency** - Follow established patterns for similar node types

---

*This documentation is maintained alongside the codebase and should be updated when Node Factory functionality changes.* 