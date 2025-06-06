# 🚀 Superjson Integration Guide for AgenitiX

## Overview

[Superjson](https://github.com/flightcontrolhq/superjson) has been integrated into your codebase to handle complex data types that regular JSON can't serialize properly. Here's where it adds the most value:

## ✅ **Already Integrated**

### 1. **Connection Prevention System**

- **File**: `features/business-logic-modern/infrastructure/node-creation/node-handles/ConnectionPrevention.tsx`
- **Benefits**:
  - Proper serialization of `Set<string>` (compatibleTargets)
  - Proper serialization of `Map<string, string>` (incompatibleTargets)
  - Enhanced debugging with complex object logging
- **Usage**:
  ```typescript
  const serialized = serializeConnectionState(connectionState);
  const restored = deserializeConnectionState(serialized);
  const copy = cloneConnectionState(connectionState);
  ```

### 2. **Zustand Store Persistence**

- **Files**:
  - `store/timesheetStore.ts` ✅
  - `store/periodStore.ts` ✅
- **Benefits**: Better handling of Date objects, Maps, Sets in persistent state
- **Example**: Timesheet data with complex filtering and undo/redo stacks

### 3. **Node Utilities Enhancement**

- **File**: `features/business-logic-modern/infrastructure/node-creation/utils/nodeUtils.ts` ✅
- **Benefits**: `safeStringify()` now handles BigInt, Date, Map, Set automatically
- **Impact**: All node data comparisons and logging now work with complex types

### 4. **Graph Persistence**

- **File**: `features/business-logic-modern/infrastructure/components/graphHelpers.ts` ✅
- **Benefits**: Workflow history graphs with complex node structures persist correctly

## 🎯 **High-Impact Integration Opportunities**

### 5. **Flow Store (Critical)**

- **File**: `features/business-logic-modern/infrastructure/flow-engine/stores/flowStore.ts`
- **Current Issue**: Uses standard JSON persistence for complex node/edge data
- **Recommendation**:

  ```typescript
  // Add to imports
  import superjson from "superjson";

  // Update persistence config
  storage: createJSONStorage(() => ({
    getItem: (name) => {
      const item = localStorage.getItem(name);
      return item ? superjson.parse(item) : null;
    },
    setItem: (name, value) => {
      localStorage.setItem(name, superjson.stringify(value));
    },
    removeItem: (name) => localStorage.removeItem(name),
  }));
  ```

### 6. **API Routes Enhancement**

- **Files**:
  - `app/api/anubis/optimistic-verify/route.ts`
  - `app/api/anubis/challenge/route.ts`
  - All API routes setting cookies with JSON data
- **Benefits**: Proper serialization of Date objects, session metadata
- **Example**:
  ```typescript
  // Instead of JSON.parse/stringify
  const sessionData = superjson.parse(sessionCookie.value);
  response.cookies.set("session", superjson.stringify(data));
  ```

### 7. **JSON Processor Enhancement**

- **File**: `features/business-logic-modern/infrastructure/node-creation/factory/utils/jsonProcessor.ts`
- **Benefits**: Handle Date, BigInt, Map, Set in node JSON inputs
- **Priority**: High - affects all node data processing

### 8. **View Output Component**

- **File**: `features/business-logic-modern/node-domain/view/ViewOutput.tsx`
- **Current**: Custom `safeStringify` function
- **Recommendation**: Replace with superjson for better type support

## 📊 **Data Types That Benefit**

### Your Codebase Uses These Complex Types:

- ✅ **BigInt**: Node type system includes "N" (BigInt)
- ✅ **Date**: API responses, timestamps, session data
- ✅ **Map**: Connection incompatibility mappings, cache systems
- ✅ **Set**: Compatible target collections, unique identifiers
- ✅ **Nested Objects**: Node data, flow state, complex configurations

## 🔧 **Migration Strategy**

### Phase 1: Critical Data (Done ✅)

- Connection prevention system ✅
- Node utilities ✅
- Graph persistence ✅
- Basic store persistence ✅

### Phase 2: Store & Cache Systems (Next)

- FlowStore persistence (most critical)
- Vibe mode store persistence
- Cache manager enhancements

### Phase 3: API & Processing (Future)

- API route cookie serialization
- JSON processor fallbacks
- View output formatting

## 💡 **Usage Patterns in Your Code**

### 1. **Zustand Persistence Pattern**

```typescript
import superjson from "superjson";

storage: createJSONStorage(() => ({
  getItem: (name) => {
    const item = localStorage.getItem(name);
    return item ? superjson.parse(item) : null;
  },
  setItem: (name, value) => {
    localStorage.setItem(name, superjson.stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
}));
```

### 2. **Safe Serialization Pattern**

```typescript
// Replace custom JSON handling
const safeStringify = (obj: unknown): string => {
  try {
    return superjson.stringify(obj);
  } catch {
    return "null";
  }
};
```

### 3. **API Cookie Pattern**

```typescript
// For session data with Date objects
const sessionData = {
  timestamp: new Date(),
  metadata: new Map([["key", "value"]]),
  settings: new Set(["option1", "option2"]),
};

response.cookies.set("session", superjson.stringify(sessionData));
```

## 🚀 **Benefits Realized**

1. **Type Safety**: Date objects stay as Date, not strings
2. **Performance**: No manual conversion of BigInt/Date
3. **Consistency**: Same serialization across all systems
4. **Debugging**: Better console output for complex objects
5. **Future-Proof**: Handles new JS types automatically

## 🎯 **Next Steps**

1. **Immediate**: Integrate FlowStore persistence (highest impact)
2. **Short-term**: Update remaining Zustand stores
3. **Medium-term**: Enhance API routes and processors
4. **Long-term**: Consider using superjson for network requests

The integration is providing immediate value for your node-based workflow system with complex data structures! 🎉
