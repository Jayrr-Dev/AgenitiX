# Registry Migration Fix Documentation

## Issue: "Invalid node type dropped" Error

### Problem Description
When dragging nodes from the sidebar to the canvas, you may encounter the error:
```
Invalid node type dropped: createText
```

This happens when files are still using the **old registry system** (`modern-node-registry.ts`) instead of the **new NodeSpec registry** (`nodespec-registry.ts`) that was implemented with the Plop system.

### Root Cause
The migration from the old component-first architecture to the new NodeSpec + Plop system created two registry systems:
1. **Old**: `modern-node-registry.ts` - Manual metadata maintenance
2. **New**: `nodespec-registry.ts` - Pure NodeSpec single source of truth

Some files were not updated to use the new registry, causing node lookup failures.

## Fix Pattern

### Before (Broken):
```typescript
// Import the old registry
import { getNodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/modern-node-registry";

const getNodeSpecForType = async (nodeType: string) => {
  // Uses old registry
  const metadata = getNodeMetadata(nodeType);
  if (!metadata) {
    console.warn(`No metadata found for node type: ${nodeType}`);
    return null;
  }

  // Tries to convert old format
  return {
    kind: metadata.nodeType,  // ❌ Wrong property
    displayName: metadata.displayName,
    category: metadata.category,
    initialData: Object.fromEntries(  // ❌ Wrong data structure
      Object.entries(metadata.data).map(([key, config]) => [key, config.default])
    ),
  };
};
```

### After (Fixed):
```typescript
// Import the new NodeSpec registry
import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";

const getNodeSpecForType = async (nodeType: string) => {
  // Uses new NodeSpec registry
  const metadata = getNodeSpecMetadata(nodeType);
  if (!metadata) {
    console.warn(`No metadata found for node type: ${nodeType}`);
    return null;
  }

  // Direct access to NodeSpec data
  return {
    kind: metadata.kind,           // ✅ Correct property
    displayName: metadata.displayName,
    category: metadata.category,
    initialData: metadata.initialData,  // ✅ Direct access
  };
};
```

## Files That May Need This Fix

Search for these patterns in your codebase:

### 1. **Import Pattern**
```bash
grep -r "from.*modern-node-registry" features/
```
Look for:
```typescript
import { getNodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/modern-node-registry";
```

### 2. **Usage Pattern**
```bash
grep -r "getNodeMetadata" features/
```
Look for:
```typescript
const metadata = getNodeMetadata(nodeType);
```

### 3. **Data Access Pattern**
```bash
grep -r "metadata\.nodeType" features/
```
Look for:
```typescript
kind: metadata.nodeType  // Should be metadata.kind
```

## Quick Fix Steps

1. **Update Import**:
   ```diff
   - import { getNodeMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/modern-node-registry";
   + import { getNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
   ```

2. **Update Function Call**:
   ```diff
   - const metadata = getNodeMetadata(nodeType);
   + const metadata = getNodeSpecMetadata(nodeType);
   ```

3. **Update Property Access**:
   ```diff
   - kind: metadata.nodeType,
   + kind: metadata.kind,
   ```

4. **Update Data Access**:
   ```diff
   - initialData: Object.fromEntries(
   -   Object.entries(metadata.data).map(([key, config]) => [key, config.default])
   - ),
   + initialData: metadata.initialData,
   ```

## Verification

After applying the fix:

1. **TypeScript Check**:
   ```bash
   npx tsc --noEmit
   ```

2. **Test Node Creation**:
   - Drag a Plop-generated node from sidebar to canvas
   - Should create successfully without errors
   - Check browser console for success messages

3. **Verify Node Data**:
   - Created node should have proper initial data from NodeSpec
   - Node should be functional with all enterprise features

## Related Files Fixed

- ✅ `features/business-logic-modern/infrastructure/flow-engine/FlowEditor.tsx` - Fixed in this session

## Future Prevention

When creating new files that need node metadata:
1. **Always use** `nodespec-registry.ts` for new code
2. **Never import** from `modern-node-registry.ts` 
3. **Use** `getNodeSpecMetadata()` function
4. **Access** `metadata.initialData` directly (don't convert)

## Registry System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NodeSpec Registry                        │
│                 (Single Source of Truth)                   │
├─────────────────────────────────────────────────────────────┤
│  • nodespec-registry.ts                                    │
│  • Imports NodeSpec directly from .node.tsx files         │
│  • No duplication, no manual maintenance                   │
│  • Auto-updated by Plop                                    │
│  • Pure NodeSpec architecture                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Legacy Registry                          │
│                  (Deprecated - Don't Use)                  │
├─────────────────────────────────────────────────────────────┤
│  • modern-node-registry.ts                                 │
│  • Manual metadata maintenance                             │
│  • Separate from NodeSpec                                  │
│  • Causes duplication and sync issues                      │
│  • Being phased out                                        │
└─────────────────────────────────────────────────────────────┘
```

## Summary

This fix ensures all files use the new NodeSpec registry system, enabling:
- ✅ Proper node creation from Plop-generated nodes
- ✅ Single source of truth architecture
- ✅ No duplication between NodeSpec and registry
- ✅ Automatic updates via Plop system
- ✅ Enterprise validation and error handling 