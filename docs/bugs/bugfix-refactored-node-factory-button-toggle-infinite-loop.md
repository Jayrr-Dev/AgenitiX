# bugfix-refactored-node-factory-button-toggle-infinite-loop

**Date:** December 2024  
**Severity:** High (Infinite loops, broken UI functionality)  
**Status:** ✅ Resolved  
**Affected Components:** RefactoredNodeFactory, TestErrorRefactored, All factory-based nodes  

## Problem Summary

Buttons in TestErrorRefactored (and all RefactoredNodeFactory-based nodes) were not toggling, causing infinite loop errors and breaking the user interface. The issue prevented manual activation of test nodes and affected the entire refactored node system.

## High-Level Process & Files Modified

### **Problem Diagnosis:**
• **Initial symptom:** Buttons in TestErrorRefactored (and all RefactoredNodeFactory nodes) not toggling
• **Console errors revealed:** "Maximum update depth exceeded" infinite loop errors
• **Root cause discovery:** Two separate infinite loop triggers identified

### **Files Analyzed & Modified:**

#### **1. `features/business-logic/nodes/factory/hooks/useNodeState.ts` - Auto-error recovery conflict**
• **Issue:** `TestErrorRefactored` not in error recovery exclusion list
• **Fix:** Added `'testErrorRefactored'` to exclusion array (lines 81-86)
• **Result:** Prevents auto-clearing of intentional test errors

```typescript
// BEFORE (caused infinite loop)
config.nodeType !== 'testError') {

// AFTER (fixed)
config.nodeType !== 'testError' &&
config.nodeType !== 'testErrorRefactored') {
```

#### **2. `features/business-logic/nodes/factory/hooks/useMainProcessingLogic.ts` - useEffect dependency loop**
• **Issue:** `nodeData` object dependency caused infinite re-renders
• **Fix:** Replaced whole object with specific properties (lines 73-84):
  - `isManuallyActivated` → detects button clicks
  - `triggerMode` → detects mode changes  
  - `value` → detects output changes
  - `heldText` → detects text input changes
• **Result:** Only re-processes when actual values change, not object references

```typescript
// BEFORE (caused infinite loop)
useEffect(() => {
  processNodeLogic();
}, [
  // ... other deps
  nodeData // Object reference changes every render!
]);

// AFTER (fixed)
useEffect(() => {
  processNodeLogic();
}, [
  // ... other deps
  (nodeData as any)?.isManuallyActivated,
  (nodeData as any)?.triggerMode,
  (nodeData as any)?.value,
  (nodeData as any)?.heldText
]);
```

#### **3. `features/business-logic/nodes/factory/components/NodeContent.tsx` - ID prop passing**
• **Issue:** Incorrect ID being passed to render functions
• **Fix:** Added explicit `id` prop and passed it correctly
• **Result:** Proper node identification for updateNodeData calls

### **Testing & Verification:**
• **Created:** `debug-button-toggle.md` - systematic debugging guide
• **Attempted:** Jest test creation (abandoned due to mocking complexity)
• **Result:** All RefactoredNodeFactory buttons now toggle properly without infinite loops

## Error Details

### Console Errors Before Fix:
```
Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

🚨 TEST ERROR from Error Generator node-1748783297453: Custom error message
```

### Call Stack Analysis:
- Error originated in `useMainProcessingLogic.ts` useEffect
- Triggered by object reference changes in `nodeData` dependency
- Cascaded through `FlowCanvas.tsx` → `FlowEditor.tsx` → React rendering cycle

## Root Cause Analysis

### **Primary Issue: Object Reference Dependencies**
React's useEffect was depending on the entire `nodeData` object, which gets recreated on every render. This caused the effect to run infinitely, triggering constant re-processing of node logic.

### **Secondary Issue: Error Recovery Conflict**
The `TestErrorRefactored` node type wasn't excluded from automatic error recovery, so the system was trying to clear errors that the test node was intentionally generating.

## Solution Implementation

### **1. Dependency Optimization**
Replaced object dependencies with primitive value dependencies to prevent unnecessary effect triggers.

### **2. Node Type Exclusions**
Added `testErrorRefactored` to the list of node types that should maintain their error states.

### **3. Prop Passing Corrections**
Ensured proper ID propagation through the component hierarchy.

## Impact Assessment

### **Before Fix:**
- ❌ Button clicks had no effect
- ❌ Infinite console errors 
- ❌ Browser performance degradation
- ❌ Broken test node functionality
- ❌ All RefactoredNodeFactory nodes affected

### **After Fix:**
- ✅ Button toggling works properly
- ✅ Clean console output
- ✅ Normal browser performance
- ✅ Test nodes function as intended
- ✅ All RefactoredNodeFactory nodes restored

## Prevention Measures

### **Code Review Guidelines:**
1. **Avoid object dependencies in useEffect** - Use primitive values or useMemo for complex objects
2. **Test error-generating nodes separately** - Ensure error recovery exclusions are up to date
3. **Verify prop propagation** - Check that IDs and handlers pass through correctly
4. **Monitor console for infinite loops** - "Maximum update depth" is a key indicator

### **Development Best Practices:**
- Use React DevTools Profiler to catch re-render issues early
- Implement proper TypeScript strict mode to catch prop issues
- Create systematic debugging guides for complex component interactions
- Consider useCallback/useMemo for stable references in dependencies

## Related Issues

This fix resolves button toggling issues across **all RefactoredNodeFactory-based nodes**, not just TestErrorRefactored. The modular architecture means this fix benefits the entire node system.

## Files Modified

1. `features/business-logic/nodes/factory/hooks/useNodeState.ts` (Lines 81-86)
2. `features/business-logic/nodes/factory/hooks/useMainProcessingLogic.ts` (Lines 73-84)  
3. `features/business-logic/nodes/factory/components/NodeContent.tsx` (ID prop additions)
4. `debug-button-toggle.md` (Created diagnostic guide)

## Testing Checklist

- [ ] ✅ TestErrorRefactored button toggles Activate ↔ Reset
- [ ] ✅ No infinite loop console errors
- [ ] ✅ Error generation works as intended
- [ ] ✅ Other RefactoredNodeFactory nodes also fixed
- [ ] ✅ Performance remains stable
- [ ] ✅ Node state persists correctly 