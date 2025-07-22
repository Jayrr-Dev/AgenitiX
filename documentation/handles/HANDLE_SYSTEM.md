# Handle System Documentation

## Overview

The handle system provides type-safe connections between nodes with comprehensive validation and visual feedback.

## 📊 System Statistics

- **Total Nodes:** 1
- **Total Handles:** 3
- **Average Handles per Node:** 3.0
- **Type Diversity:** 3 types
- **Last Updated:** 7/22/2025, 12:08:26 PM

## 🎯 Handle Types

| Code | Type | Description | Icon | Color |
|------|------|-------------|------|-------|
| `j` | JSON | JavaScript Object Notation - flexible data structure | {} | `var(--core-handle-types-json-color)` |
| `s` | String | Text data - UTF-8 encoded strings | T | `var(--core-handle-types-string-color)` |
| `n` | Number | Numeric data - integers and floating point | # | `var(--core-handle-types-number-color)` |
| `b` | Boolean | True/false values for control flow | ✓ | `var(--core-handle-types-boolean-color)` |
| `a` | Array | Ordered collection of values | [] | `var(--core-handle-types-array-color)` |
| `o` | Object | Key-value pair collection | {} | `var(--core-handle-types-object-color)` |
| `x` | Any | Unrestricted type - accepts any value | ? | `var(--core-handle-types-any-color)` |

## 📍 Position Distribution

- **TOP**: 1 handles (33.3%)
- **RIGHT**: 1 handles (33.3%)
- **LEFT**: 1 handles (33.3%)

## 🏷️ Type Distribution

- **JSON**: 1 handles (33.3%)
- **String**: 1 handles (33.3%)
- **Boolean**: 1 handles (33.3%)

## 🏗️ Node Handle Analysis


### createText

- **Node Type:** `createText`
- **Category:** CREATE
- **Total Handles:** 3
- **Inputs:** 2
- **Outputs:** 1

#### Handle Specifications

- **json-input** (target) [top]
  - Type: j
  - Code: `j`
  - TS Symbol: `none`
- **output** (source) [right]
  - Type: s
  - Code: `s`
  - TS Symbol: `none`
- **activate** (target) [left]
  - Type: b
  - Code: `b`
  - TS Symbol: `none`


## ⚠️ Validation Issues

- ✅ No validation issues found

## 💡 Recommendations



## 🔧 Usage Examples

### Basic Handle Specification

```typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    { id: "input", code: "j", position: "top", type: "target" },
    { id: "output", code: "s", position: "right", type: "source" },
    { id: "activate", code: "b", position: "left", type: "target" },
  ],
};
```

### Type-Safe Handles with TS Symbols

```typescript
const spec: NodeSpec = {
  // ... other spec properties
  handles: [
    { id: "data", tsSymbol: "CreateTextOutput", position: "right", type: "source" },
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

### Connection Validation

- ✅ **Type Compatibility**: Automatic validation prevents incompatible connections
- ✅ **Visual Feedback**: Toast notifications for connection errors
- ✅ **Debounced Alerts**: 2-second debounce to prevent spam
- ✅ **User-Friendly Messages**: Clear error descriptions

---

*This documentation is automatically generated from node specifications.*
