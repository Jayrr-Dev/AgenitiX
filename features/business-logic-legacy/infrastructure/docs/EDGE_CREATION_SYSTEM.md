# 🔗 Edge Creation System Documentation

## Overview

This document provides a comprehensive guide to the **Edge Creation System** in the Agenix Visual Flow Editor. The system handles the complete process of creating connections between nodes when users drag from handles, including validation, styling, and data flow establishment.

---

## 🎯 Core Concept

The edge creation system is a **multi-layer validation and connection process** that ensures type-safe, visually consistent connections between nodes:

```
🖱️ USER DRAG → 🔍 VALIDATION → 🎨 STYLING → 🔗 CONNECTION → 📊 DATA FLOW
```

---

## 🏗️ Architecture Overview

### **Edge Creation Pipeline**

The edge creation process follows a sophisticated pipeline with multiple validation and processing stages:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INTERACTION                         │
│              (drag from handle to handle)                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                HANDLE VALIDATION                            │
│         (CustomHandle.isValidConnection)                    │
│  • Type compatibility  • Connection limits  • Node existence│
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              REACTFLOW ONCONNECT                            │
│            (useReactFlowHandlers.onConnect)                 │
│  • Final validation  • Data type detection  • Edge creation │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                EDGE STYLING                                 │
│            (connectionUtils.createEdgeStyle)                │
│  • Color coding  • Stroke width  • Visual feedback         │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│               ZUSTAND STORE UPDATE                          │
│              (flowStore.addEdge)                            │
│  • State persistence  • Reactive updates  • History        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              DATA FLOW ACTIVATION                           │
│           (Node re-evaluation triggers)                     │
│  • Input detection  • Processing logic  • Output updates   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Step-by-Step Edge Creation Process

### **Step 1: User Initiates Drag**
**Location**: User interaction with `CustomHandle` component

```typescript
// User starts dragging from a handle
<CustomHandle
  dataType="s"  // string type
  position={Position.Right}
  id="output"
  type="source"
/>
```

**What Happens**:
- ReactFlow detects mouse/touch down on handle
- Drag preview line appears following cursor
- Handle becomes "active" for connection

### **Step 2: Real-Time Validation During Drag**
**Location**: `features/business-logic/handles/CustomHandle.tsx`

```typescript
const isValidConnection = (connection: Connection) => {
  if (hasSourceHandle(connection)) {
    const { source, sourceHandle } = connection;
    if (!source) return false;
    
    // Find the source node
    const nodes = reactFlow.getNodes?.() || [];
    const sourceNode = nodes.find(n => n.id === source);
    if (!sourceNode) return false;
    
    // Get types from handle ids (support union, any, custom)
    const sourceTypes = parseTypes(actualSourceHandle)
    const targetTypes = parseTypes(actualTargetHandle)
    
    // Allow if either side is 'x' (any)
    if (sourceTypes.includes('x') || targetTypes.includes('x')) return true
    
    // Allow if any type in source matches any in target
    const match = sourceTypes.some(st => targetTypes.includes(st))
    setInvalid(!match)
    return match
  }
  return true;
};
```

**Validation Checks**:
1. **Source node exists** in the flow
2. **Handle type compatibility** (string → string, any → any, etc.)
3. **Connection limits** (if handle has max connections)
4. **Self-connection prevention** (node can't connect to itself)

**Visual Feedback**:
- ✅ **Valid target**: Handle shows normal color
- ❌ **Invalid target**: Handle shows red ring (`ring-2 ring-red-500`)
- 🎯 **Hover feedback**: Handle highlights on hover

### **Step 3: Connection Attempt (Drop)**
**Location**: `features/business-logic/flow-editor/hooks/useReactFlowHandlers.ts`

When user releases drag over a valid target handle:

```typescript
const onConnect: OnConnect = useCallback(
  (connection: Connection) => {
    // Final validation check
    if (!validateConnection(connection)) {
      toast.error('Type mismatch: cannot connect these handles.');
      return;
    }

    // Get data type for styling
    const dataType = getConnectionDataType(connection);
    
    // Create and add the edge
    setEdges((eds) =>
      addEdge(
        {
          ...connection,
          type: 'default',
          style: createEdgeStyle(dataType),
        },
        eds
      )
    );
  },
  [setEdges]
);
```

**Connection Object Structure**:
```typescript
interface Connection {
  source: string;        // Source node ID
  target: string;        // Target node ID  
  sourceHandle: string;  // Source handle ID (e.g., 's', 'n', 'b')
  targetHandle: string;  // Target handle ID (e.g., 'x', 's', 'b')
}
```

### **Step 4: Final Validation**
**Location**: `features/business-logic/flow-editor/utils/connectionUtils.ts`

```typescript
export function validateConnection(connection: Connection): boolean {
  if (!connection.sourceHandle || !connection.targetHandle) {
    return false;
  }

  const sourceTypes = parseTypes(connection.sourceHandle);
  const targetTypes = parseTypes(connection.targetHandle);
  
  // Allow if either side is 'x' (any)
  const valid = sourceTypes.includes('x') || 
                targetTypes.includes('x') || 
                sourceTypes.some((st: string) => targetTypes.includes(st));
  
  return valid;
}
```

**Validation Rules**:
- **Type Compatibility**: Source and target types must match or include 'x' (any)
- **Handle Existence**: Both source and target handles must exist
- **Union Type Support**: Handles can accept multiple types (e.g., 's|n' accepts string or number)

### **Step 5: Data Type Detection & Styling**
**Location**: `features/business-logic/flow-editor/utils/connectionUtils.ts`

```typescript
export function getConnectionDataType(connection: Connection): string {
  if (!connection.sourceHandle) {
    return 's'; // fallback to string
  }
  
  // Use parseTypes to support union/any/custom
  const types = parseTypes(connection.sourceHandle);
  // Use first type for color (or 'x' for any)
  return types[0] || 's';
}

export function createEdgeStyle(dataType: string, strokeWidth: number = 2) {
  return {
    stroke: getEdgeColor(dataType),
    strokeWidth
  };
}
```

**Color Mapping**:
```typescript
const TYPE_MAP = {
  's': { color: '#3b82f6' },      // string - blue
  'n': { color: '#f59e42' },      // number - orange
  'b': { color: '#10b981' },      // boolean - green
  'j': { color: '#6366f1' },      // JSON - indigo
  'a': { color: '#f472b6' },      // array - pink
  'x': { color: '#6b7280' },      // any - gray
  // ... more types
};
```

### **Step 6: Edge Creation & Store Update**
**Location**: ReactFlow's `addEdge` function + Zustand store

```typescript
// Edge object created
const newEdge: AgenEdge = {
  id: 'reactflow__edge-source-target',  // Auto-generated ID
  source: 'node-1',
  target: 'node-2', 
  sourceHandle: 's',
  targetHandle: 'x',
  type: 'default',
  deletable: true,
  focusable: true,
  style: { 
    stroke: '#3b82f6',  // Blue for string type
    strokeWidth: 2 
  }
}
```

**Store Integration**:
- Edge added to Zustand `flowStore.edges` array
- Automatic persistence to localStorage
- Reactive updates trigger re-renders
- History tracking for undo/redo

### **Step 7: Data Flow Activation**
**Location**: Connected nodes' `useEffect` hooks

Once edge is created, downstream nodes automatically detect the new connection:

```typescript
// In target node
const connections = useNodeConnections({ handleType: 'target' });
const nodesData = useNodesData(sourceIds);

useEffect(() => {
  // New connection detected!
  const inputValue = getSingleInputValue(nodesData);
  
  // Process the input and update output
  const processedValue = processInput(inputValue);
  updateNodeData(id, { value: processedValue });
}, [connections, nodesData, id]);
```

**Immediate Effects**:
1. **Target node re-evaluates** its inputs
2. **Processing logic runs** with new data
3. **Output updates** trigger downstream propagation
4. **Visual feedback** (glow effects) update
5. **Data flows** through the entire network

---

## 🎨 Visual Feedback System

### **Handle States During Connection**

#### **Source Handle (Drag Start)**
```css
/* Normal state */
.handle-source {
  background: #3b82f6;  /* Blue for string type */
  border: 0.5px solid white;
}

/* Active drag state */
.handle-source.dragging {
  transform: scale(1.1);
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
}
```

#### **Target Handle (Drag Over)**
```css
/* Valid connection target */
.handle-target.valid {
  background: #10b981;  /* Green highlight */
  transform: scale(1.2);
}

/* Invalid connection target */
.handle-target.invalid {
  background: #ef4444;  /* Red highlight */
  border: 2px solid #ef4444;
  animation: shake 0.3s ease-in-out;
}
```

### **Edge Visual Properties**

#### **Default Edge Styling**
```typescript
defaultEdgeOptions: {
  type: 'default',
  deletable: true,
  focusable: true,
  style: { 
    strokeWidth: 2, 
    stroke: '#3b82f6'  // Default blue
  }
}
```

#### **Type-Specific Edge Colors**
```typescript
// Edge colors match handle types
's' → Blue (#3b82f6)     // String connections
'n' → Orange (#f59e42)   // Number connections  
'b' → Green (#10b981)    // Boolean connections
'j' → Indigo (#6366f1)   // JSON connections
'a' → Pink (#f472b6)     // Array connections
'x' → Gray (#6b7280)     // Any-type connections
```

#### **Interactive Edge Features**
- **Hover effects**: Edge highlights on mouse over
- **Selection feedback**: Selected edges show different styling
- **Delete button**: Appears on edge hover/selection
- **Reconnection**: Edges can be dragged to new targets

---

## 🔧 Advanced Connection Features

### **Connection Limits**
**Location**: `CustomHandle` component

```typescript
// Limit handle to maximum 3 connections
<CustomHandle
  dataType="s"
  isConnectable={3}  // Max 3 connections
  position={Position.Left}
  type="target"
/>

// Dynamic connection limit checking
const handleIsConnectable = () => {
  const edges = reactFlow.getEdges?.() || [];
  const existingConnections = edges.filter(e => e.targetHandle === id).length;
  return existingConnections < maxConnections;
};
```

### **Union Type Support**
**Location**: `parseTypes` function in `CustomHandle`

```typescript
// Handle accepts multiple types
<CustomHandle
  dataType="s|n"  // Accepts string OR number
  position={Position.Left}
  type="target"
/>

// Parsing logic
export function parseTypes(handleId: string): string[] {
  return handleId.split('|').map(t => t.trim());
}
```

### **Edge Reconnection**
**Location**: `useReactFlowHandlers.ts`

```typescript
const onReconnect = useCallback(
  (oldEdge: Edge, newConn: Connection) => {
    edgeReconnectFlag.current = true;
    setEdges((els) => reconnectEdge(oldEdge, newConn, els) as AgenEdge[]);
  },
  [setEdges]
);
```

**Reconnection Process**:
1. User drags existing edge to new target
2. Validation runs for new connection
3. Old edge removed, new edge created
4. Data flow updates automatically

### **Edge Deletion**
**Location**: Multiple locations

#### **Keyboard Deletion**
```typescript
// ReactFlow configuration
deleteKeyCode={['Delete', 'Backspace']}
```

#### **Button Deletion**
```typescript
// Edge component with delete button
const handleDelete = () => {
  setEdges((es) => es.filter((e) => e.id !== id));
};
```

#### **Programmatic Deletion**
```typescript
// From Zustand store
const removeEdge = useFlowStore((state) => state.removeEdge);
removeEdge(edgeId);
```

---

## 🚨 Error Handling & Validation

### **Connection Validation Errors**

#### **Type Mismatch**
```typescript
// Error: Trying to connect string to number (without 'x' type)
Source: 's' (string)
Target: 'n' (number)
Result: ❌ Connection rejected
Toast: "Type mismatch: cannot connect these handles."
```

#### **Self-Connection**
```typescript
// Error: Node trying to connect to itself
Source: node-1
Target: node-1
Result: ❌ Connection rejected (handled by ReactFlow)
```

#### **Connection Limit Exceeded**
```typescript
// Error: Handle already has maximum connections
Existing: 3 connections
Limit: 3 connections
Result: ❌ Connection rejected
Visual: Handle becomes non-connectable
```

### **Error Recovery**

#### **Invalid Connection Cleanup**
```typescript
const onReconnectEnd = useCallback((_: any, edge: Edge) => {
  if (!edgeReconnectFlag.current) {
    // Remove invalid edge
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }
  edgeReconnectFlag.current = true;
}, [setEdges]);
```

#### **Toast Notifications**
```typescript
import { toast } from 'sonner';

// User-friendly error messages
if (!validateConnection(connection)) {
  toast.error('Type mismatch: cannot connect these handles.');
  return;
}
```

---

## 📊 Performance Optimizations

### **Efficient Validation**

#### **Memoized Type Parsing**
```typescript
// Cache parsed types to avoid repeated parsing
const sourceTypes = useMemo(() => 
  parseTypes(connection.sourceHandle), 
  [connection.sourceHandle]
);
```

#### **Lazy Node Lookup**
```typescript
// Only find nodes when validation needed
const sourceNode = nodes.find(n => n.id === source);
if (!sourceNode) return false;
```

### **Optimized Re-renders**

#### **Connection State Memoization**
```typescript
const memoizedConnections = useMemo(() => connections, [
  JSON.stringify(connections)
]);
```

#### **Selective Edge Updates**
```typescript
// Only update affected edges
setEdges((eds) => 
  eds.map(edge => 
    edge.id === targetEdgeId 
      ? { ...edge, style: newStyle }
      : edge
  )
);
```

---

## 🎯 Real-World Connection Scenarios

### **Scenario 1: Simple Text Flow**
```
CreateText[s] → TurnToUppercase[s] → ViewOutput[x]
     ↓               ↓                    ↓
  "hello"        "HELLO"            displays "HELLO"
```

**Connection Process**:
1. User drags from CreateText's 's' output handle
2. Hovers over TurnToUppercase's 's' input handle
3. Validation: string → string ✅ Valid
4. Edge created with blue color (string type)
5. TurnToUppercase receives "hello", outputs "HELLO"
6. ViewOutput receives "HELLO", displays it

### **Scenario 2: Logic Gate Connection**
```
TriggerA[b] ──┐
              ├─→ LogicOr[b] → ViewOutput[x]
TriggerB[b] ──┘      ↓             ↓
                  true         "true"
```

**Connection Process**:
1. User connects TriggerA's 'b' output to LogicOr's 'b' input
2. Validation: boolean → boolean ✅ Valid
3. Edge created with green color (boolean type)
4. User connects TriggerB's 'b' output to LogicOr's 'b' input
5. LogicOr now has 2 boolean inputs, processes OR logic
6. Result flows to ViewOutput

### **Scenario 3: Type Conversion Chain**
```
CreateText[s] → TurnToBoolean[s→b] → LogicNot[b] → ViewOutput[x]
     ↓               ↓                   ↓             ↓
  "true"          true               false        "false"
```

**Connection Process**:
1. String output connects to string input ✅
2. Boolean output connects to boolean input ✅
3. Any-type input accepts boolean ✅
4. Data flows and converts through each step

### **Scenario 4: Invalid Connection Attempt**
```
CreateText[s] → CountInput[n] ❌
     ↓               ↓
  "hello"      [REJECTED]
```

**Connection Process**:
1. User drags from CreateText's 's' output
2. Hovers over CountInput's 'n' input
3. Validation: string → number ❌ Invalid
4. CountInput handle shows red ring
5. User releases: Connection rejected
6. Toast error: "Type mismatch: cannot connect these handles."

---

## 🔮 Advanced Features

### **Dynamic Handle Creation**
```typescript
// Nodes can dynamically add/remove handles
const [handleCount, setHandleCount] = useState(2);

// Render dynamic handles
{Array.from({ length: handleCount }, (_, i) => (
  <CustomHandle
    key={`input-${i}`}
    dataType="x"
    position={Position.Left}
    id={`input-${i}`}
    type="target"
  />
))}
```

### **Conditional Handle Visibility**
```typescript
// Hide handles based on Vibe Mode or other conditions
{isVibeModeActive && (
  <CustomHandle
    dataType="j"
    position={Position.Left}
    id="json-input"
    type="target"
  />
)}
```

### **Custom Edge Types**
```typescript
// Different edge rendering styles
const edgeTypes = {
  default: DefaultEdge,
  bezier: BezierEdge,
  step: StepEdge,
  animated: AnimatedEdge
};
```

### **Edge Animation**
```typescript
// Animated edges for active data flow
const animatedEdge = {
  ...connection,
  animated: true,
  style: {
    stroke: '#10b981',
    strokeWidth: 3,
    strokeDasharray: '5,5'
  }
};
```

---

## 🛠️ Debugging & Monitoring

### **Connection Debugging**

#### **Console Logging**
```typescript
console.log('Connection attempt:', {
  source: connection.source,
  target: connection.target,
  sourceHandle: connection.sourceHandle,
  targetHandle: connection.targetHandle,
  valid: validateConnection(connection)
});
```

#### **Edge Inspector**
**Location**: `features/business-logic/components/node-inspector/components/EdgeInspector.tsx`

- **Real-time edge properties** display
- **Connection flow visualization**
- **Data type information**
- **Delete edge functionality**

### **Common Issues & Solutions**

#### **Connections Not Working**
1. **Check handle IDs**: Ensure source and target handles exist
2. **Verify types**: Confirm type compatibility
3. **Inspect validation**: Check `isValidConnection` logic
4. **Review limits**: Ensure connection limits not exceeded

#### **Wrong Edge Colors**
1. **Check data type detection**: Verify `getConnectionDataType` logic
2. **Inspect TYPE_MAP**: Ensure color mapping exists
3. **Review style application**: Check `createEdgeStyle` function

#### **Performance Issues**
1. **Optimize validation**: Reduce expensive operations in `isValidConnection`
2. **Memoize connections**: Use proper dependency arrays
3. **Batch updates**: Avoid rapid edge creation/deletion

---

## 🚀 Future Enhancements

### **Planned Improvements**

1. **Smart Connection Suggestions**: AI-powered connection recommendations
2. **Bulk Connection Tools**: Multi-select and batch connect
3. **Connection Templates**: Predefined connection patterns
4. **Visual Connection Paths**: Curved/custom edge routing
5. **Connection Analytics**: Usage statistics and optimization

### **Extensibility Points**

- **Custom validation rules** for domain-specific connections
- **Advanced edge styling** with gradients and animations
- **Connection middleware** for preprocessing/postprocessing
- **Real-time collaboration** for multi-user editing
- **Connection versioning** for change tracking

---

## 📚 Related Documentation

- [`DATA_FLOW_ARCHITECTURE.md`](./DATA_FLOW_ARCHITECTURE.md) - Overall system architecture
- [`GLOW_SYSTEM_DOCUMENTATION.md`](./GLOW_SYSTEM_DOCUMENTATION.md) - Visual feedback system
- [`creating-new-nodes.md`](./node-docs/creating-new-nodes.md) - Node development guide
- [`VIBE_MODE_DOCUMENTATION.md`](./VIBE_MODE_DOCUMENTATION.md) - Advanced features

---

## 🤝 Contributing

When working with the edge creation system:

1. **Understand the validation pipeline** before making changes
2. **Test type compatibility** thoroughly with different handle types
3. **Consider performance impact** of validation logic
4. **Maintain visual consistency** with established color schemes
5. **Document new connection types** and validation rules

---

*This documentation is maintained alongside the codebase and should be updated when edge creation system changes are made.* 