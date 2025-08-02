# Handle System Documentation

## Overview

The handle system provides type-safe connections between nodes with comprehensive validation and visual feedback. All view components have been updated to use the new unified handle-based input reading system.

## 📊 System Statistics

- **Total Nodes:** 0
- **Total Handles:** 0
- **Average Handles per Node:** NaN
- **Type Diversity:** 0 types
- **Last Updated:** 7/30/2025, 3:35:15 PM

## 🎯 Handle Types

| Code | Type    | Description                                          | Icon | Color                                    |
| ---- | ------- | ---------------------------------------------------- | ---- | ---------------------------------------- |
| `j`  | JSON    | JavaScript Object Notation - flexible data structure | {}   | `var(--core-handle-types-json-color)`    |
| `s`  | String  | Text data - UTF-8 encoded strings                    | T    | `var(--core-handle-types-string-color)`  |
| `n`  | Number  | Numeric data - integers and floating point           | #    | `var(--core-handle-types-number-color)`  |
| `b`  | Boolean | True/false values for control flow                   | ✓    | `var(--core-handle-types-boolean-color)` |
| `a`  | Array   | Ordered collection of values                         | []   | `var(--core-handle-types-array-color)`   |
| `o`  | Object  | Key-value pair collection                            | {}   | `var(--core-handle-types-object-color)`  |
| `x`  | Any     | Unrestricted type - accepts any value                | ?    | `var(--core-handle-types-any-color)`     |
| `t`  | Tools   | AI agent tool configurations and definitions         | 🔧   | `var(--core-handle-types-tools-color)`   |

## 📍 Position Distribution

## 🏷️ Type Distribution

## 🏗️ Node Handle Analysis

## ⚠️ Validation Issues

- ✅ No validation issues found

## 💡 Recommendations

- 💡 No handles found - check node specifications
- 💡 Limited type diversity - consider more handle types

## 🔧 Usage Examples

### Basic Handle Specification

```typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    { id: "input", code: "j", position: "top", type: "target" },
    { id: "output", code: "s", position: "right", type: "source" },
    { id: "input", code: "b", position: "left", type: "target" },
  ],
};
```

### Type-Safe Handles with TS Symbols

```typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    {
      id: "data",
      tsSymbol: "CreateTextOutput",
      position: "right",
      type: "source",
    },
    { id: "trigger", code: "b", position: "left", type: "target" },
  ],
};
```

## 🎨 Visual Design

### Handle Styling

- **Size:** 10px diameter
- **Position Offset:** 7.5px from node edge
- **Spacing:** 7.5px between handles on same side
- **Z-Index:** 30 (above node content)

### Type Colors

- **JSON**: `var(--core-handle-types-json-color)` ({})
- **String**: `var(--core-handle-types-string-color)` (T)
- **Number**: `var(--core-handle-types-number-color)` (#)
- **Boolean**: `var(--core-handle-types-boolean-color)` (✓)
- **Array**: `var(--core-handle-types-array-color)` ([])
- **Object**: `var(--core-handle-types-object-color)` ({})
- **Any**: `var(--core-handle-types-any-color)` (?)
- **Tools**: `var(--core-handle-types-tools-color)` (🔧)

### Connection Validation

- ✅ **Type Compatibility**: Automatic validation prevents incompatible connections
- ✅ **Visual Feedback**: Toast notifications for connection errors
- ✅ **Debounced Alerts**: 2-second debounce to prevent spam
- ✅ **User-Friendly Messages**: Clear error descriptions

## 🔄 Unified Handle-Based Input Reading

All view components now use the new unified handle-based input reading system:

### Input Reading Priority System

```typescript
// 1. Handle-based output (primary system)
if (sourceData?.output && typeof sourceData.output === "object") {
  const output = sourceData.output as Record<string, any>;
  const firstOutputValue = Object.values(output)[0];
  if (firstOutputValue !== undefined) {
    inputValue = firstOutputValue;
  }
}

// 2. Legacy fallbacks for compatibility
if (inputValue === undefined) {
  if (sourceData?.output !== undefined) {
    inputValue = sourceData.output;
  }
}

// 3. Final fallback to whole data object
if (inputValue === undefined) {
  inputValue = sourceData;
}
```

### Updated Components

- ✅ **viewText.node.tsx** - Updated to use unified handle-based system
- ✅ **viewBoolean.node.tsx** - Updated to use unified handle-based system
- ✅ **createText.node.tsx** - Already using unified system
- ✅ **triggerPulse.node.tsx** - Already using unified system
- ✅ **flowConditional.node.tsx** - Already using unified system

### Benefits

- **Consistent Data Flow**: All components use the same input reading pattern
- **Handle ID Normalization**: Automatic cleanup of handle IDs for compatibility
- **Convex Serialization**: Plain object output for database compatibility
- **Error Handling**: Robust fallbacks prevent crashes
- **Development Support**: Clear warnings for missing handle mappings

---

_This documentation is automatically generated from node specifications._
