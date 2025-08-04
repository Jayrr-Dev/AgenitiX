# Maximum Depth Error Debugging Guide

This guide helps you identify and fix maximum depth errors in your React components using the implemented debugging tools.

## 🔍 What's Been Implemented

### 1. WhyDidYouRender Integration

- **File**: `lib/why-did-you-render.ts`
- **Purpose**: Tracks component re-renders and identifies infinite loops
- **Activation**: Only active in development mode
- **Features**:
  - Tracks all pure components
  - Monitors hooks usage
  - Logs render reasons
  - Custom component filtering

### 2. Node-Specific Debugging

- **File**: `lib/debug-node-renders.ts`
- **Purpose**: Specialized debugging for node components
- **Features**:
  - Tracks node component re-renders
  - Identifies infinite loops in dynamic spec creation
  - Monitors useNodeData hook usage
  - Logs prop changes that trigger re-renders

### 3. Enhanced Component Debugging

- **Applied to**: `withNodeScaffold.tsx` and `aiAgent.node.tsx`
- **Features**:
  - Debug logging for spec creation
  - Node data change tracking
  - Dynamic spec change monitoring

### 4. Browser Console Debug Script

- **File**: `scripts/debug-maximum-depth.js`
- **Usage**: Load in browser console for enhanced error detection

## 🚀 How to Use

### Step 1: Start Development Server

```bash
pnpm dev
```

### Step 2: Open Browser Console

1. Open your browser's developer tools
2. Go to the Console tab
3. Look for the debug messages starting with 🔍, 🔧, 📊, etc.

### Step 3: Reproduce the Maximum Depth Error

1. Navigate to the page/component that causes the error
2. Perform the action that triggers the maximum depth error
3. Watch the console for detailed error information

### Step 4: Analyze the Debug Output

#### Console Messages to Look For:

- `🔍 Why Did You Render enabled for debugging` - Confirms debugging is active
- `🔧 withNodeScaffold called with spec:` - Shows when node specs are created
- `📊 Node data changed for [nodeId]:` - Shows node data changes
- `🔄 [ComponentName] render #[number]:` - Shows component re-renders
- `⚠️ EXCESSIVE RE-RENDERS in [ComponentName]:` - Warns about too many renders
- `🔄 INFINITE LOOP DETECTED in [ComponentName]:` - Detects infinite loops

#### Browser Console Commands:

```javascript
// Get current render statistics
window.debugHelpers.getRenderStats();

// Find components with excessive renders (>10 by default)
window.debugHelpers.findExcessiveRenders(10);

// Get detailed error information
window.debugHelpers.getErrorDetails();

// Clear debug state
window.debugHelpers.clearDebugState();
```

## 🔧 Common Maximum Depth Error Causes

### 1. Infinite Re-renders in useMemo/useEffect

```javascript
// ❌ BAD - Creates new object on every render
const memoizedValue = useMemo(() => ({ data: props.data }), [props.data]);

// ✅ GOOD - Stable reference
const memoizedValue = useMemo(() => ({ data: props.data }), [props.data.id]);
```

### 2. Dynamic Spec Creation Issues

```javascript
// ❌ BAD - Creates new spec on every render
const dynamicSpec = useMemo(() => createDynamicSpec(nodeData), [nodeData]);

// ✅ GOOD - Only recreate when size changes
const dynamicSpec = useMemo(
  () => createDynamicSpec(nodeData),
  [nodeData.expandedSize, nodeData.collapsedSize]
);
```

### 3. State Updates in Render

```javascript
// ❌ BAD - Updates state during render
const Component = () => {
  const [state, setState] = useState(0);
  setState(state + 1); // This causes infinite re-renders
  return <div>{state}</div>;
};

// ✅ GOOD - Use useEffect for side effects
const Component = () => {
  const [state, setState] = useState(0);
  useEffect(() => {
    setState(state + 1);
  }, []); // Only run once
  return <div>{state}</div>;
};
```

## 🎯 Debugging Workflow

### 1. Identify the Problematic Component

Look for console messages like:

- `🔄 INFINITE LOOP DETECTED in [ComponentName]`
- `⚠️ EXCESSIVE RE-RENDERS in [ComponentName]`

### 2. Check the Render Stack

The debug output will show:

- Which components are re-rendering
- What props/state are changing
- The render count for each component

### 3. Analyze the Root Cause

Common patterns:

- **Props changing on every render**: Check parent component
- **State updates in render**: Move to useEffect
- **Memoization issues**: Check useMemo dependencies
- **Dynamic spec creation**: Optimize spec creation logic

### 4. Fix the Issue

Based on the analysis:

- Stabilize object references
- Fix memoization dependencies
- Move state updates to useEffect
- Optimize dynamic spec creation

## 📊 Debug Output Examples

### Normal Render Cycle:

```
🔧 withNodeScaffold called with spec: {specKind: "aiAgent", handlesCount: 4, size: {...}}
📊 Node data changed for node-123: {nodeId: "node-123", prevData: {...}, newData: {...}, changedKeys: ["expandedSize"]}
🔄 AiAgentNode render #1: {componentId: "AiAgentNode-node-123", props: {...}, selected: false, timeSinceLastRender: 0}
```

### Problematic Render Cycle:

```
⚠️ EXCESSIVE RE-RENDERS in AiAgentNode: {componentId: "AiAgentNode-node-123", renderCount: 15, props: {...}, timeSinceLastRender: 50}
🔄 INFINITE LOOP DETECTED in AiAgentNode: {componentId: "AiAgentNode-node-123", props: {...}, renderCount: 15, timeSinceLastRender: 50}
```

## 🛠️ Troubleshooting

### Debug Not Working?

1. Check that `NODE_ENV=development`
2. Verify the import in `app/layout.tsx`
3. Clear browser cache and restart dev server

### Too Much Console Output?

1. Use the browser console filter
2. Focus on error and warning messages
3. Use `window.debugHelpers.clearDebugState()` to reset

### Still Can't Find the Issue?

1. Add more specific debugging to suspected components
2. Use React DevTools Profiler
3. Check for circular dependencies in imports

## 🎉 Success Indicators

You'll know the debugging is working when you see:

- Console messages starting with 🔍, 🔧, 📊
- Detailed render information for your components
- Clear identification of the problematic component
- Specific error messages about infinite loops or excessive renders

## 📝 Next Steps

After identifying the problematic component:

1. Fix the root cause (see Common Causes above)
2. Test the fix by reproducing the original error
3. Remove debug console.log statements
4. Consider keeping the why-did-you-render setup for future debugging

---

**Remember**: The debugging tools are only active in development mode and won't affect production performance.
