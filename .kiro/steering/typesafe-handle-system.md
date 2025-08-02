# Typesafe Handle System Steering

## Overview

The Typesafe Handle System provides type-safe connections between nodes with automatic validation, visual feedback, and user-friendly error handling.

## Core Principles

### Type Safety

- **25+ Supported Types**: String, Number, Boolean, JSON, Array, Object, Any, Vibe
- **Union Type Support**: `"string|number"` for flexible connections
- **TypeScript Integration**: `tsSymbol` for compile-time type checking
- **Automatic Validation**: Prevents incompatible connections

### Visual Design

- **Semantic Token System**: Consistent theming across light/dark modes
- **Type-Specific Icons**: React Icons for perfect centering
- **Color-Coded Types**: Visual distinction for different data types
- **Connection States**: Different styling for connected/disconnected handles

### User Experience

- **Smart Positioning**: Multiple handles on same side without overlap
- **Rich Tooltips**: Detailed type information on hover
- **Error Notifications**: User-friendly toast messages for invalid connections
- **Debounced Feedback**: Prevents notification spam

## Type System

### Supported Types

| Code | Type    | Description                      | Icon       | Color Token                         |
| ---- | ------- | -------------------------------- | ---------- | ----------------------------------- |
| `s`  | String  | Text and string values           | LuType     | `--core-handle-types-string-color`  |
| `n`  | Number  | Integer and numeric values       | LuHash     | `--core-handle-types-number-color`  |
| `b`  | Boolean | True/false values                | LuCheck    | `--core-handle-types-boolean-color` |
| `j`  | JSON    | JavaScript objects and JSON data | VscJson    | `--core-handle-types-json-color`    |
| `a`  | Array   | Lists and array structures       | LuBrackets | `--core-handle-types-array-color`   |
| `x`  | Any     | Accepts all data types           | LuCircle   | `--core-handle-types-any-color`     |
| `V`  | Vibe    | Custom Vibe data type            | LuCircle   | `--core-handle-types-vibe-color`    |

### Full Type Names

The system also supports full type names for direct mapping:

- `String`, `Number`, `Boolean`, `JSON`, `Array`, `Object`

### Union Types

Support for multiple types in a single handle:

```typescript
dataType: "string|number"; // Accepts both string and number
code: "j|s"; // Accepts both JSON and string
```

## Configuration

### Handle Visual Configuration

```typescript
const HANDLE_SIZE_PX = 10;
const HANDLE_POSITION_OFFSET = 7.5; // pixels from node edge
const HANDLE_SPACING = 7.5; // pixels between multiple handles
```

### Toast Notification Settings

```typescript
const TOAST_DEBOUNCE_MS = 2000;
const TOAST_ERROR_TITLE = "Incompatible connection";
const TOAST_DURATION = 3000;
```

### Styling Tokens

```css
/* Base handle styling */
--core-handle-bg-connected: transparent;
--core-handle-bg-source: transparent;
--core-handle-bg-target: transparent;
--core-handle-shadow: 0 0 0.5px 0.5px;

/* Type-specific colors */
--core-handle-types-string-color: hsl(214, 100%, 50%);
--core-handle-types-number-color: hsl(25, 100%, 50%);
--core-handle-types-boolean-color: hsl(142, 76%, 36%);
--core-handle-types-json-color: hsl(262, 83%, 58%);
--core-handle-types-array-color: hsl(322, 84%, 60%);
--core-handle-types-any-color: hsl(0, 0%, 42%);
--core-handle-types-vibe-color: hsl(262, 83%, 58%);
```

## Usage Patterns

### Basic Handle Definition

```typescript
// In NodeSpec
handles: [
  {
    id: "input",
    code: "j", // Type code
    position: "top", // Position on node
    type: "target", // Input handle
    dataType: "JSON", // Full type name (optional)
  },
  {
    id: "output",
    code: "s",
    position: "right",
    type: "source", // Output handle
  },
];
```

### TypeScript Integration

```typescript
handles: [
  {
    id: "input",
    tsSymbol: "MyInputType", // TypeScript type
    code: "j", // Fallback type
    position: "top",
    type: "target",
  },
];
```

### Multiple Handles on Same Side

```typescript
handles: [
  {
    id: "text-input",
    code: "s",
    position: "left",
    type: "target",
  },
  {
    id: "json-input",
    code: "j",
    position: "left",
    type: "target",
  },
  // Handles will be automatically positioned to avoid overlap
];
```

### Union Type Handles

```typescript
handles: [
  {
    id: "flexible-input",
    dataType: "string|number", // Accepts multiple types
    position: "top",
    type: "target",
  },
];
```

## Type Validation

### Compatibility Rules

```typescript
function isTypeCompatible(sourceType: string, targetType: string): boolean {
  // Any type can connect to any type
  if (sourceType === "x" || targetType === "x") {
    return true;
  }

  // Parse union types
  const sourceTypes = parseUnionTypes(sourceType);
  const targetTypes = parseUnionTypes(targetType);

  // Check for overlap
  return sourceTypes.some((s) => targetTypes.includes(s));
}
```

### Validation Examples

```typescript
// ✅ Compatible connections
"string" → "string"        // Same type
"string" → "any"          // Any accepts all
"string|number" → "string" // Union includes target
"json" → "any"            // Any accepts all

// ❌ Incompatible connections
"string" → "number"       // Different types
"boolean" → "array"       // Different types
"json" → "string"         // Different types
```

## Integration with Node System

### NodeSpec Integration

```typescript
// NodeSpec definition
const spec: NodeSpec = {
  kind: "myNode",
  handles: [
    {
      id: "input",
      code: "j",
      position: "top",
      type: "target",
      dataType: "JSON",
    },
    {
      id: "output",
      code: "s",
      position: "right",
      type: "source",
      dataType: "String",
    },
  ],
  // ... other spec properties
};
```

### Automatic Handle Rendering

The `withNodeScaffold` automatically renders handles:

```typescript
// Handles are automatically rendered with:
// - Type encoding in ID: "input__j"
// - Smart positioning
// - Type validation
// - Visual styling
```

### Type Encoding in Handle IDs

```typescript
// Handle ID format: "handleId__typeCode"
"input__j"; // Input handle with JSON type
"output__s"; // Output handle with String type
"data__string|number"; // Union type handle
```

## Best Practices

### 1. Type Selection

```typescript
// ✅ Use specific types when possible
{ code: "s", dataType: "String" }  // Specific string type

// ❌ Avoid generic types unless necessary
{ code: "x", dataType: "Any" }     // Too generic
```

### 2. Handle Positioning

```typescript
// ✅ Consistent positioning
inputs: ["top", "left"]
output: ["right", "bottom"]

// ✅ Logical flow
data-input: "top"
control-input: "left"
result-output: "right"
status-output: "bottom"
```

### 3. Type Safety

```typescript
// ✅ Use TypeScript symbols when possible
{ tsSymbol: "MyInputType", code: "j" }

// ✅ Provide fallback types
{ tsSymbol: "ComplexType", code: "x" }
```

### 4. Union Types

```typescript
// ✅ Use union types for flexibility
{ dataType: "string|number" }

// ✅ Document union type expectations
{ dataType: "string|number", description: "Accepts text or numeric input" }
```

### 5. Error Handling

```typescript
// ✅ Graceful fallbacks
const handleType = getHandleTypeName(tsSymbol, dataType, code) || "any";

// ✅ User-friendly error messages
const tooltip = getTooltipContent(type, dataType, code, tsSymbol);
```

## Debugging

### Common Issues

1. **Handle Not Visible**

   ```typescript
   // Check handle definition in NodeSpec
   handles: [
     {
       id: "myHandle", // Must be unique
       code: "j", // Must have type code
       position: "top", // Must have position
       type: "target", // Must have type
     },
   ];
   ```

2. **Type Validation Failing**

   ```typescript
   // Check type compatibility
   console.log(isTypeCompatible("string", "number")); // false
   console.log(isTypeCompatible("string", "any")); // true
   ```

3. **Positioning Issues**
   ```typescript
   // Multiple handles need proper indexing
   handleIndex: 0,        // First handle on side
   totalHandlesOnSide: 2, // Total handles on this side
   ```

### Debug Tools

```typescript
// Enable debug mode
const DEBUG_HANDLES = process.env.NODE_ENV === "development";

// Log handle information
if (DEBUG_HANDLES) {
  console.log("Handle:", {
    id: handle.id,
    type: handle.type,
    position: handle.position,
    dataType: handle.dataType,
    code: handle.code,
  });
}
```

## Development Tools

### Handle Documentation Generator

```bash
# Generate comprehensive handle documentation
pnpm run generate:handle-docs
```

### Type Manifest Generator

```bash
# Generate TypeScript type manifests
pnpm run gen-handle-types
```

### Handle Analysis

The system includes tools for:

- **Usage Statistics**: Track handle usage patterns
- **Type Compatibility**: Validate connection rules
- **Visual Documentation**: Generate HTML/Markdown docs
- **Best Practices**: Identify common patterns

## Performance Considerations

### Optimization Strategies

1. **Memoized Components**: Handle components are memoized
2. **Debounced Validation**: Connection validation is debounced
3. **Lazy Rendering**: Handles only render when needed
4. **Efficient Positioning**: Smart positioning calculations

### Memory Management

```typescript
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Clear any handle-specific state
  };
}, []);
```

## Future Enhancements

### Planned Features

1. **Dynamic Type System**: Runtime type registration
2. **Custom Type Icons**: User-defined type icons
3. **Advanced Validation**: Custom validation rules
4. **Type Inference**: Automatic type detection
5. **Visual Type Editor**: GUI for type configuration

### Extension Points

```typescript
// Custom type registration
registerHandleType("custom", {
  icon: CustomIcon,
  color: "var(--custom-color)",
  validator: customValidator,
});

// Custom validation rules
registerValidationRule("custom", (source, target) => {
  // Custom validation logic
});
```

## Related Files

- `components/nodes/handles/TypeSafeHandle.tsx` - Main handle component
- `features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx` - Node scaffold integration
- `scripts/generate-handle-docs.ts` - Documentation generator
- `scripts/gen-handle-types.js` - Type manifest generator
- `features/business-logic-modern/infrastructure/theming/tokens.json` - Styling tokens
- `app/styles/_nodes.css` - Handle utility classes

---

_This steering document covers the complete Typesafe Handle System. For detailed implementation, see the source code and related documentation._
