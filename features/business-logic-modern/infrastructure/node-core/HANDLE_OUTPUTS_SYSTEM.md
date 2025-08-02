# Handle Output System Documentation

## Overview

Unified handle-based output system for all node data propagation. Provides single source of truth for data flow, automatic handle ID normalization, Convex serialization compatibility, and consistent input reading across all nodes.

## Architecture

### Core Components

**1. `handleOutputUtils.ts`** - Utilities for ID normalization and output generation
**2. Object-based `outputs` field** - All nodes store outputs as plain objects for Convex serialization
**3. Unified input reading** - All consuming nodes use consistent priority system for input detection

### Data Flow

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Source Node   │────│   outputs: {}    │────│  Target Node    │
│                 │    │ {cleanId:value}  │    │                 │
│ Any Node Type   │────│ "output": value  │────│ Unified input   │
│ Multiple handles│    │ "top": true      │    │ priority system │
│                 │    │ "bottom": false  │    │ (handle-first)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Features

### ID Normalization

- `"topOutput"` → `"top"` (removes "Output" suffix)
- `"bottomOutput"` → `"bottom"` (removes "Output" suffix)
- `"booleanInput"` → `"input"` (removes "Input" suffix + special case)
- `"topOutput__b"` → `"top"` (handles React Flow type suffixes)

### Error Handling

- Input validation prevents null/undefined crashes
- Failed operations return empty objects/Maps
- Development warnings for missing handle mappings
- Individual handle errors don't affect other handles

### Single Source of Truth

- All nodes use only handle-based outputs
- No secondary output fields or multiple propagation methods
- Consistent data flow pattern across entire system

### Convex Compatibility

- Outputs stored as plain objects (serializable)
- Map-to-object conversion during generation
- Direct object storage in Convex database

## Implementation

### All Output Nodes

```typescript
import { generateOutputsField } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// Single pattern for all nodes with outputs
useEffect(() => {
  const outputsValue = generateOutputsField(spec, nodeData);
  // Convert Map to plain object for Convex compatibility
  const outputsObject = Object.fromEntries(outputsValue.entries());
  updateNodeData({ outputs: outputsObject });
}, [spec.handles, nodeData, updateNodeData]);
```

### All Input Nodes

```typescript
import { normalizeHandleId } from "@/features/business-logic-modern/infrastructure/node-core/handleOutputUtils";

// Unified input reading priority system
// 1. Handle-based outputs (primary)
if (sourceData?.outputs && typeof sourceData.outputs === "object") {
  const handleId = incoming.sourceHandle
    ? normalizeHandleId(incoming.sourceHandle)
    : "output";
  if (sourceData.outputs[handleId] !== undefined) {
    inputValue = sourceData.outputs[handleId];
  }
}
// 2. Legacy fallbacks (compatibility)
// 3. Final fallback to whole data object
```

## Data Formats

### Unified Format (Convex Compatible)

```typescript
// All nodes store outputs as plain objects
outputs: {
  "output": true,    // single output nodes (triggerPulse, etc.)
  "top": true,       // multi-output nodes (flowConditional)
  "bottom": false    // multiple handles from same node
}
```

### Schema Definition

```typescript
// Standard schema for all nodes
outputs: z.record(z.string(), z.boolean()).optional();
```

### Node Specification

```typescript
handles: [
  { id: "topOutput", type: "source", position: "right" },
  { id: "bottomOutput", type: "source", position: "bottom" },
];
// Generates: { "top": value, "bottom": value }
```

## API Reference

### `generateHandleOutputs(spec, nodeData)`

Generates Map with normalized handle IDs from node specification and data.

**Parameters:**

- `spec: NodeSpec` - Node specification with handle definitions
- `nodeData: Record<string, any>` - Current node data

**Returns:** `Map<string, any>` - Map with normalized IDs (empty Map on error)

### `normalizeHandleId(id)`

Converts handle IDs to normalized format by removing suffixes and React Flow type indicators.

**Parameters:**

- `id: string` - Original handle ID from spec or React Flow

**Returns:** `string` - Normalized ID (safe fallback on error)

**Examples:**

```typescript
normalizeHandleId("topOutput"); // → "top"
normalizeHandleId("topOutput__b"); // → "top"
normalizeHandleId("resultOutput"); // → "result"
normalizeHandleId("booleanInput"); // → "input"
```

### `generateOutputsField(spec, nodeData)`

Alias for `generateHandleOutputs` with identical functionality.

## Migration Status

- **triggerPulse:** Updated to unified system
- **flowConditional:** Updated to unified system
- **viewBoolean:** Updated to unified system
- **createText:** Updated to unified system
- **viewText:** Updated to unified system
- **All Updated Nodes:** Use single handle-based propagation method
- **Backward Compatibility:** Legacy fallbacks maintain compatibility

## File Locations

```
features/business-logic-modern/infrastructure/node-core/
├── handleOutputUtils.ts           # Core utilities
├── HANDLE_OUTPUTS_SYSTEM.md      # Documentation
└── NodeSpec.ts                    # Type definitions

features/business-logic-modern/node-domain/
├── trigger/triggerPulse.node.tsx   # Single output implementation
├── flow/flowConditional.node.tsx   # Multi-output implementation
├── create/createText.node.tsx      # Single output implementation
├── view/viewBoolean.node.tsx       # Input node implementation
└── view/viewText.node.tsx          # Input/output node implementation
```
