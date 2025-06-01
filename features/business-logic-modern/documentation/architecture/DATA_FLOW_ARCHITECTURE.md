# 🔄 Data Flow Architecture Documentation

## Overview

This document provides a comprehensive guide to understanding how data flows through the **Agenix Visual Flow Editor** application. The system implements a sophisticated reactive data flow architecture built on modern React patterns and state management principles.

---

## 🏗️ Architecture Overview

The data flow system is built on several interconnected layers that work together to provide real-time, type-safe data processing:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTIONS                        │
│              (clicks, inputs, drag & drop)                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 ZUSTAND STORE                               │
│            (Centralized State Management)                   │
│  • nodes[]     • edges[]     • selectedNodeId              │
│  • nodeErrors  • UI state    • copy/paste state            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                REACTFLOW CANVAS                             │
│           (Visual Node Network Renderer)                    │
│  • Node positioning  • Edge connections  • Visual feedback │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              INDIVIDUAL NODES                               │
│            (Data Processing Units)                          │
│  • Input handling  • Logic processing  • Output generation │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               CONNECTION SYSTEM                             │
│            (Type-Safe Data Transmission)                    │
│  • Handle validation  • Data type checking  • Flow control │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core Data Flow Principles

### 1. **Unidirectional Data Flow**
- Data flows from **inputs** → **processing** → **outputs**
- No circular dependencies or bidirectional data binding
- Clear, predictable data propagation paths

### 2. **Reactive Updates**
- Changes automatically propagate through the entire network
- Real-time visual feedback for all data transformations
- Efficient re-rendering with optimized React patterns

### 3. **Type Safety**
- Strong typing prevents invalid data connections
- Color-coded visual system for different data types
- Runtime validation at connection points

### 4. **Error Resilience**
- Graceful handling of edge cases and invalid data
- Node-level error isolation prevents system crashes
- Automatic recovery mechanisms

### 5. **Performance Optimization**
- Memoized connections prevent unnecessary re-renders
- Selective Zustand subscriptions for efficient updates
- Lazy evaluation of complex operations

---

## 🏪 Centralized State Management (Zustand Store)

**Location**: `features/business-logic/stores/flowStore.ts`

### Core State Structure

```typescript
interface FlowState {
  // CORE FLOW DATA
  nodes: AgenNode[];                    // All visual nodes in the flow
  edges: AgenEdge[];                    // Connections between nodes
  
  // SELECTION STATE
  selectedNodeId: string | null;        // Currently selected node
  selectedEdgeId: string | null;        // Currently selected edge
  
  // UI STATE
  showHistoryPanel: boolean;            // History panel visibility
  inspectorLocked: boolean;             // Node inspector lock state
  
  // ERROR STATE
  nodeErrors: Record<string, NodeError[]>; // Node-specific errors
  
  // COPY/PASTE STATE
  copiedNodes: AgenNode[];              // Nodes in clipboard
  copiedEdges: AgenEdge[];              // Edges in clipboard
  
  // HYDRATION STATE
  _hasHydrated: boolean;                // Persistence hydration status
}
```

### Key Benefits

- **Single Source of Truth**: All flow data centralized in one store
- **Automatic Reactivity**: Components automatically update when state changes
- **Persistent State**: Automatic localStorage integration for data persistence
- **Optimized Re-renders**: Zustand's selective subscriptions prevent unnecessary updates
- **DevTools Integration**: Built-in debugging capabilities

### State Update Patterns

```typescript
// NODE OPERATIONS
updateNodeData: (nodeId: string, data: Partial<Record<string, unknown>>) => void;
addNode: (node: AgenNode) => void;
removeNode: (nodeId: string) => void;

// EDGE OPERATIONS  
addEdge: (edge: AgenEdge) => void;
removeEdge: (edgeId: string) => void;

// SELECTION OPERATIONS
selectNode: (nodeId: string | null) => void;
clearSelection: () => void;

// ERROR OPERATIONS
logNodeError: (nodeId: string, message: string) => void;
clearNodeErrors: (nodeId: string) => void;
```

---

## 🔌 Connection System & Data Types

### Handle Type System

**Location**: `features/business-logic/handles/CustomHandle.tsx`

The system uses a comprehensive type system with visual color coding:

```typescript
// DATA TYPE DEFINITIONS
's' = string     (blue #3b82f6)      // Text data
'n' = number     (orange #f59e42)    // Numeric values  
'b' = boolean    (green #10b981)     // True/false values
'j' = JSON       (indigo #6366f1)    // Complex objects
'a' = array      (pink #f472b6)      // Lists/arrays
'N' = Bigint     (purple #a21caf)    // Large integers
'f' = float      (yellow #fbbf24)    // Decimal numbers
'x' = any        (gray #6b7280)      // Universal type
'u' = undefined  (light gray #d1d5db) // Undefined values
'S' = symbol     (gold #eab308)      // Symbol primitives
'∅' = null       (red #ef4444)       // Null values
```

### Connection Validation

**Location**: `features/business-logic/flow-editor/utils/connectionUtils.ts`

```typescript
export function validateConnection(connection: Connection): boolean {
  const sourceTypes = parseTypes(connection.sourceHandle);
  const targetTypes = parseTypes(connection.targetHandle);
  
  // Allow if either side is 'x' (any) or types match
  return sourceTypes.includes('x') || 
         targetTypes.includes('x') || 
         sourceTypes.some(st => targetTypes.includes(st));
}
```

### Visual Connection Feedback

- **Color-coded edges** based on data type
- **Real-time validation** during connection attempts
- **Visual feedback** for invalid connection attempts
- **Animated flow indicators** for active data transmission

---

## 🧠 Node-to-Node Data Flow Pattern

### Standard Node Processing Pattern

Every node follows this consistent pattern for data processing:

```typescript
// 1. INPUT DETECTION
const connections = useNodeConnections({ handleType: 'target' });
const nodesData = useNodesData(sourceIds);

// 2. SAFE VALUE EXTRACTION  
const inputValue = getSingleInputValue(nodesData);

// 3. PROCESSING LOGIC
useEffect(() => {
  try {
    const processedValue = processInput(inputValue);
    
    // 4. OUTPUT UPDATE
    updateNodeData(id, { 
      value: processedValue,
      triggered: processedValue,
      // ... other properties
    });
    
    setError(null); // Clear any previous errors
  } catch (err) {
    setError(err.message);
    // Fallback to safe state
  }
}, [connections, nodesData, id]);
```

### Safe Value Extraction System

**Location**: `features/business-logic/nodes/utils/nodeUtils.ts`

```typescript
export const extractNodeValue = (nodeData: any): unknown => {
  // Priority order for value extraction
  const keys = [
    'outputValue',  // DelayNode and processing nodes
    'triggered',    // Trigger nodes  
    'value',        // Logic/Converter nodes
    'text',         // Text nodes
    'count',        // Counter nodes
    'enabled',      // Toggle/Switch nodes
    'result'        // Calculation nodes
  ];

  for (const key of keys) {
    if (key in nodeData && nodeData[key] !== undefined) {
      return nodeData[key];
    }
  }
  
  return nodeData; // Fallback to entire data object
}
```

### Input Processing Utilities

```typescript
// GET MULTIPLE INPUT VALUES
export const getInputValues = (inputNodesData: any[]): unknown[] => {
  return inputNodesData
    .map(nodeData => extractNodeValue(nodeData?.data))
    .filter(isValidValue);
}

// GET SINGLE INPUT VALUE
export const getSingleInputValue = (inputNodesData: any[]): unknown => {
  if (inputNodesData.length === 0) return undefined;
  return extractNodeValue(inputNodesData[0]?.data);
}

// SAFE VALUE COMPARISON
export const valuesEqual = (a: unknown, b: unknown): boolean => {
  // Handles NaN, BigInt, objects, and other edge cases
  // Returns true if values are meaningfully equal
}
```

---

## ⚡ Real-Time Data Propagation

### Propagation Sequence

1. **User Interaction**
   - Click, input change, toggle, drag & drop
   - Triggers local node state update

2. **Node State Update**
   - `updateNodeData(id, newData)` called
   - Updates Zustand store immediately

3. **Store Notification**
   - Zustand notifies all subscribed components
   - Only components using affected data re-render

4. **Connected Nodes React**
   - Downstream nodes detect input changes
   - `useEffect` hooks trigger with new data

5. **Cascade Processing**
   - Each node processes new inputs
   - Updates its own outputs
   - Continues propagation through network

6. **Visual Updates**
   - UI components reflect new state
   - Visual feedback shows data flow
   - Output displays update in real-time

### Example Data Flow Scenarios

#### Scenario 1: Simple Logic Gate
```
TriggerOnClick → LogicAnd → ViewOutput
     ↓              ↓           ↓
  triggered=true  value=true  displays "true"
```

**Flow Steps**:
1. User clicks TriggerOnClick button
2. Node updates: `{ triggered: true }`
3. LogicAnd detects input change
4. LogicAnd processes: `value = inputA && inputB`
5. LogicAnd updates: `{ value: true }`
6. ViewOutput detects change
7. ViewOutput displays: "true"

#### Scenario 2: Text Processing Chain
```
CreateText → TurnToUppercase → ViewOutput
    ↓              ↓              ↓
 text="hello"  text="HELLO"  displays "HELLO"
```

**Flow Steps**:
1. User types "hello" in CreateText
2. CreateText updates: `{ text: "hello" }`
3. TurnToUppercase receives input
4. TurnToUppercase processes: `text.toUpperCase()`
5. TurnToUppercase updates: `{ text: "HELLO" }`
6. ViewOutput receives processed text
7. ViewOutput displays: "HELLO"

#### Scenario 3: Complex Multi-Input Logic
```
TriggerA ──┐
           ├─→ LogicOr → DelayInput → CountInput → ViewOutput
TriggerB ──┘      ↓          ↓           ↓           ↓
              triggered   delayed     counted    final result
```

**Flow Steps**:
1. Either TriggerA or TriggerB activates
2. LogicOr outputs: `{ triggered: true }`
3. DelayInput queues the trigger signal
4. After delay, DelayInput outputs: `{ outputValue: true }`
5. CountInput increments: `{ count: count + 1 }`
6. ViewOutput displays current count

---

## 🎨 Visual Feedback System

### Node Visual States

```typescript
// NODE SIZE STATES
ICON_STATE: '60x60px'      // Collapsed, minimal view
EXPANDED_STATE: '120x120px' // Full UI with controls

// NODE STATUS INDICATORS  
NORMAL: 'Gray border'       // Default state
SELECTED: 'Blue border'     // Currently selected
ERROR: 'Red border'         // Processing error
ACTIVE: 'Green glow'        // Currently processing data
```

### Edge Visual Indicators

```typescript
// EDGE STYLING
stroke: TYPE_MAP[dataType].color  // Color-coded by data type
strokeWidth: 2                    // Standard connection
strokeWidth: 3                    // Active data transmission
strokeDasharray: '5,5'           // Invalid/error connection
```

### Real-Time Visual Feedback

- **Immediate visual updates** when data changes
- **Color-coded connections** show data type flow
- **Node highlighting** indicates active processing
- **Error indicators** show problematic nodes
- **Selection feedback** for user interactions

---

## 🛡️ Error Handling & Recovery

### Multi-Layer Error Protection

#### 1. **Connection-Level Validation**
```typescript
// Prevent invalid connections at the source
export function validateConnection(connection: Connection): boolean {
  // Type compatibility checking
  // Handle existence validation
  // Circular dependency prevention
}
```

#### 2. **Node-Level Error Catching**
```typescript
useEffect(() => {
  try {
    const processedValue = processInput(inputValue);
    updateNodeData(id, { value: processedValue });
    setError(null); // Clear previous errors
  } catch (err) {
    console.error(`Error in ${id}:`, err);
    setError(err.message);
    
    // Fallback to safe state
    updateNodeData(id, { value: null });
  }
}, [inputValue]);
```

#### 3. **Safe Value Processing**
```typescript
// Robust value validation
export const isValidValue = (value: unknown): boolean => {
  if (value === undefined || value === null) return false;
  if (typeof value === 'number' && Number.isNaN(value)) return false;
  return true;
}

// Safe JSON serialization
export const safeStringify = (obj: unknown): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'bigint') return value.toString();
      return value;
    });
  } catch {
    return 'null';
  }
}
```

#### 4. **Error State Management**
```typescript
// Centralized error tracking in Zustand store
interface FlowState {
  nodeErrors: Record<string, NodeError[]>;
}

// Error logging and recovery
logNodeError: (nodeId: string, message: string, type?: 'warning' | 'error' | 'critical') => void;
clearNodeErrors: (nodeId: string) => void;
```

### Error Recovery Strategies

1. **Graceful Degradation**: Nodes continue operating with safe fallback values
2. **Error Isolation**: Errors in one node don't crash the entire system
3. **Visual Error Feedback**: Clear indication of problematic nodes
4. **Automatic Recovery**: System attempts to recover when inputs become valid
5. **User Notification**: Toast messages for critical errors

---

## 🔧 Performance Optimizations

### Efficient Re-rendering

```typescript
// MEMOIZED CONNECTIONS
const memoizedConnections = useMemo(() => connections, [
  JSON.stringify(connections)
]);

// SELECTIVE ZUSTAND SUBSCRIPTIONS
const updateNodeData = useFlowStore((state) => state.updateNodeData);
const selectedNodeId = useFlowStore((state) => state.selectedNodeId);

// OPTIMIZED EFFECT DEPENDENCIES
useEffect(() => {
  // Processing logic
}, [inputValue, nodeId]); // Minimal dependencies
```

### Memory Management

- **Efficient data structures** for large node networks
- **Garbage collection friendly** patterns
- **Minimal object creation** in hot paths
- **Lazy evaluation** of expensive computations

### Network Optimization

- **Batched updates** for multiple node changes
- **Debounced processing** for rapid input changes
- **Connection pooling** for efficient data transmission
- **Smart invalidation** to minimize unnecessary updates

---

## 📊 Debugging & Monitoring Tools

### Built-in Development Tools

#### 1. **Debug Tool Component**
**Location**: `features/business-logic/components/DebugTool.tsx`

- Real-time state inspection
- Node data visualization
- Connection status monitoring
- Performance metrics

#### 2. **History Panel**
**Location**: `features/business-logic/components/HistoryPanel.tsx`

- Action history tracking
- Undo/redo functionality
- State change timeline
- Debugging assistance

#### 3. **Node Inspector**
**Location**: `features/business-logic/components/NodeInspector.tsx`

- Detailed node examination
- Input/output monitoring
- Error state analysis
- Configuration management

#### 4. **Console Logging**
```typescript
// Structured logging throughout the system
console.log(`Node ${id} processing:`, { inputValue, outputValue });
console.error(`Error in ${id}:`, error);
console.warn(`Invalid connection attempt:`, connection);
```

### Monitoring Capabilities

- **Real-time data flow visualization**
- **Performance bottleneck identification**
- **Error frequency tracking**
- **User interaction analytics**
- **System health monitoring**

---

## 🚀 Advanced Features

### Dynamic Node Creation

```typescript
// Factory pattern for consistent node creation
export function createNodeComponent<T extends BaseNodeData>(
  config: NodeFactoryConfig<T>
) {
  // Standardized node creation with:
  // - Consistent error handling
  // - Automatic state management  
  // - Built-in performance optimizations
  // - Type safety enforcement
}
```

### Extensible Type System

```typescript
// Easy addition of new data types
export const TYPE_MAP = {
  's': { color: '#3b82f6', label: 'String' },
  'n': { color: '#f59e42', label: 'Number' },
  // ... extensible type definitions
};
```

### Plugin Architecture

- **Modular node system** for easy extension
- **Custom handle types** for specialized data
- **Pluggable validation** for domain-specific rules
- **Extensible UI components** for custom interfaces

---

## 📋 Best Practices

### For Node Development

1. **Follow the 6-step registration process** (see `creating-new-nodes.md`)
2. **Use safe value extraction** utilities
3. **Implement proper error handling** with try-catch blocks
4. **Maintain consistent sizing** (60x60px / 120x120px)
5. **Use TypeScript interfaces** for all node data

### For Data Flow Design

1. **Keep data transformations simple** and focused
2. **Avoid circular dependencies** in node networks
3. **Use appropriate data types** for connections
4. **Implement validation** at connection points
5. **Design for error recovery** and graceful degradation

### For Performance

1. **Minimize effect dependencies** to reduce re-renders
2. **Use memoization** for expensive computations
3. **Batch state updates** when possible
4. **Implement lazy loading** for complex nodes
5. **Monitor performance** with built-in tools

---

## 🔮 Future Enhancements

### Planned Improvements

1. **WebWorker Integration**: Offload heavy computations
2. **Streaming Data Support**: Real-time data streams
3. **Advanced Caching**: Intelligent result caching
4. **Distributed Processing**: Multi-node computation
5. **AI-Powered Optimization**: Automatic flow optimization

### Extensibility Points

- **Custom data types** for domain-specific needs
- **External API integration** nodes
- **Database connectivity** nodes  
- **Machine learning** processing nodes
- **Real-time collaboration** features

---

## 📚 Related Documentation

- [`creating-new-nodes.md`](./node-docs/creating-new-nodes.md) - Node development guide
- [`VIBE_MODE_DOCUMENTATION.md`](./VIBE_MODE_DOCUMENTATION.md) - Visual feedback system
- [`ERROR_GENERATOR_DOCUMENTATION.md`](./ERROR_GENERATOR_DOCUMENTATION.md) - Error handling
- [`UNIVERSAL_JSON_GUIDE.md`](./UNIVERSAL_JSON_GUIDE.md) - JSON data handling

---

## 🤝 Contributing

When working with the data flow system:

1. **Understand the architecture** before making changes
2. **Follow established patterns** for consistency
3. **Test data flow scenarios** thoroughly
4. **Document new features** and changes
5. **Consider performance implications** of modifications

---

*This documentation is maintained alongside the codebase and should be updated when significant architectural changes are made.* 