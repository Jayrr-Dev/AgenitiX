# Handle-Specific Output System Documentation

## Overview

The Handle-Specific Output System enables nodes with multiple output handles to provide different values to each connected node. This system uses Maps for efficient O(1) lookups and scales to unlimited output handles.

## Architecture

### Core Components

**1. `handleOutputUtils.ts`** - Utility functions for generating handle-specific outputs
**2. Map-based `outputs` field** - All nodes store outputs as `Map<handleId, value>`
**3. Smart input detection** - ViewBoolean and other input nodes automatically detect Map vs primitive values

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Source Node   │────│   outputs: Map   │────│  Target Node    │
│                 │    │ {handleId:value} │    │                 │
│ topOutput: true │    │                  │    │ reads specific  │
│ bottomOutput:   │    │ "topOutput"=>true│    │ handle value    │
│ false           │    │ "bottomOutput"=>  │    │                 │
│                 │    │ false            │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Implementation

### For Multi-Output Nodes

```typescript
// 1. Import utilities
import { generateOutputsField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// 2. Auto-generate Map-based outputs
useEffect(() => {
  const outputsMap = generateOutputsField(spec, nodeData);
  updateNodeData({ outputs: outputsMap });
}, [spec.handles, nodeData, updateNodeData]);
```

### For Input Nodes (e.g., ViewBoolean)

```typescript
// Smart detection of Map vs primitive outputs
if (sourceData.outputs instanceof Map) {
  if (edge.sourceHandle) {
    // Use specific handle from Map
    inputValue = sourceData.outputs.get(edge.sourceHandle);
  } else {
    // Fallback: get first value from Map
    inputValue = sourceData.outputs.values().next().value;
  }
} else {
  // Legacy: primitive outputs value
  inputValue = sourceData.outputs;
}
```

## Data Structure

### Map Format
```typescript
// FlowConditional example
outputs: Map {
  "topOutput" => true,
  "bottomOutput" => false
}

// Single-output node example  
outputs: Map {
  "output" => "hello world"
}
```

### Node Spec Requirements
```typescript
// Define handles in node spec
handles: [
  {
    id: "topOutput",     // Maps to nodeData.topOutput
    type: "source", 
    position: "right"
  },
  {
    id: "bottomOutput",  // Maps to nodeData.bottomOutput
    type: "source",
    position: "bottom" 
  }
]
```

## Performance Characteristics

- **Lookup Time**: O(1) for any number of handles
- **Memory**: Efficient for multiple outputs, slight overhead for single outputs
- **Scalability**: Handles 1 to unlimited outputs with consistent performance

## Benefits

1. **Consistent Architecture**: All nodes follow same pattern
2. **Handle-Specific Values**: Each connection gets correct value automatically  
3. **Zero Manual Mapping**: Auto-generated from node spec
4. **Future-Proof**: Adding handles requires no code changes
5. **Type Safety**: Map ensures consistent key-value relationships

## Usage Examples

### Creating a Multi-Output Node

```typescript
// 1. Define handles in spec
const spec = {
  handles: [
    { id: "result", type: "source" },
    { id: "error", type: "source" },
    { id: "metadata", type: "source" }
  ]
  // ... other spec properties
};

// 2. Update your data fields
updateNodeData({
  result: "success",
  error: null, 
  metadata: { timestamp: Date.now() }
});

// 3. Add the auto-generation effect (outputs will be Map)
useEffect(() => {
  const outputsMap = generateOutputsField(spec, nodeData);
  updateNodeData({ outputs: outputsMap });
}, [spec.handles, nodeData, updateNodeData]);
```

### Connecting to Specific Handles

ViewBoolean and other input nodes automatically:
1. Detect if source has Map-based outputs
2. Use `edge.sourceHandle` to get the specific value
3. Fall back to primitive outputs for legacy nodes

## File Locations

```
features/business-logic-modern/infrastructure/node-core/
├── handleOutputUtils.ts           # Core utilities
├── HANDLE_OUTPUTS_SYSTEM.md      # This documentation
└── NodeSpec.ts                    # Node specification types

features/business-logic-modern/node-domain/
├── flow/flowConditional.node.tsx  # Example multi-output implementation  
└── view/viewBoolean.node.tsx      # Example input node with smart detection
```

## Migration Path

**Existing Nodes**: Continue working unchanged (primitive outputs)
**New Multi-Handle Nodes**: Use the Map system for handle-specific outputs  
**Input Nodes**: Already compatible via smart detection logic

## API Reference

### `generateHandleOutputs(spec, nodeData)`
Generates a Map of handle IDs to their values from node spec and data.

**Parameters:**
- `spec: NodeSpec` - Node specification containing handle definitions
- `nodeData: Record<string, any>` - Current node data

**Returns:** `Map<string, any>` - Map of handle IDs to values

### `generateOutputsField(spec, nodeData)`  
Generates the outputs field as a Map for consistent architecture.

**Parameters:**  
- `spec: NodeSpec` - Node specification containing handle definitions
- `nodeData: Record<string, any>` - Current node data

**Returns:** `Map<string, any>` - Map of handle IDs to values

## Current Implementation Status

- ✅ **FlowConditional**: Implemented with Map-based outputs
- ✅ **ViewBoolean**: Smart input detection for Map vs primitive
- ✅ **Utilities**: Complete handleOutputUtils.ts 
- 🔄 **Other Nodes**: Can adopt system as needed

## Keywords

`handle-outputs`, `scalable`, `multi-handle`, `dynamic-mapping`, `flow-conditional`, `map-based-outputs`

---

This system provides a scalable foundation for complex data routing while maintaining backward compatibility with existing single-output nodes.