# Handle Type Reference

## Quick Reference

| Code | Type | Use Case | Validation |
|------|------|----------|------------|
| `j` | JSON | JavaScript Object Notation - flexible data structure | Must be valid JSON, Accepts objects and arrays, Type-safe validation |
| `s` | String | Text data - UTF-8 encoded strings | Must be string type, UTF-8 encoding, No length limit |
| `n` | Number | Numeric data - integers and floating point | Must be numeric, Supports integers and floats, No NaN or Infinity |
| `b` | Boolean | True/false values for control flow | Must be boolean, Only true/false values, No type coercion |
| `a` | Array | Ordered collection of values | Must be array type, Ordered collection, Heterogeneous elements allowed |
| `o` | Object | Key-value pair collection | Must be object type, Key-value pairs, No circular references |
| `x` | Any | Unrestricted type - accepts any value | Accepts any type, No validation, Use with caution |

## Type Compatibility Matrix

| Source \ Target | JSON | String | Number | Boolean | Array | Object | Any |
|------------------|------|--------|--------|---------|-------|--------|-----|
| **JSON** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **String** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Number** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Boolean** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Array** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| **Object** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Any** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## Usage Patterns

### Most Common Handle Combinations

- **JSON**: 1 uses
- **String**: 1 uses
- **Boolean**: 1 uses

### Position Preferences

- **TOP**: 1 handles (33.3%)
- **RIGHT**: 1 handles (33.3%)
- **LEFT**: 1 handles (33.3%)

## Best Practices

### 1. Type Safety
- ✅ Use `tsSymbol` for type-safe connections
- ✅ Provide fallback `code` when using `tsSymbol`
- ✅ Validate handle types in your node logic

### 2. Handle Positioning
- ✅ Place inputs on top/left
- ✅ Place outputs on right/bottom
- ✅ Use consistent positioning across similar nodes

### 3. Type Selection
- ✅ Use specific types when possible (avoid 'any')
- ✅ Consider data flow when choosing types
- ✅ Document type expectations in node descriptions

### 4. Validation
- ✅ Test handle connections during development
- ✅ Handle type mismatches gracefully
- ✅ Provide clear error messages for users

## Examples

### Basic Input/Output Pattern
```typescript
handles: [
  { id: "input", code: "j", position: "top", type: "target" },
  { id: "output", code: "s", position: "right", type: "source" },
]
```

### Control Flow Pattern
```typescript
handles: [
  { id: "trigger", code: "b", position: "left", type: "target" },
  { id: "data", code: "j", position: "top", type: "target" },
  { id: "result", code: "s", position: "right", type: "source" },
]
```

### Type-Safe Pattern
```typescript
handles: [
  { id: "input", tsSymbol: "InputType", code: "j", position: "top", type: "target" },
  { id: "output", tsSymbol: "OutputType", code: "s", position: "right", type: "source" },
]
```

---

*Generated from 1 nodes with 3 handles*
