# TestErrorRefactored Button Toggle Debug Guide

## Systematic Debugging Steps

### Step 1: Verify Button Click Handler is Called
1. Open browser DevTools (F12)
2. Add a TestErrorRefactored node to the canvas
3. Click the "Activate" button
4. Check console for these logs:
   - `🔥 Error Generator [id]: ACTIVATING manually`
   - `🔥 Error Generator [id]: Current data: [object]`
   - `🔥 Error Generator [id]: updateNodeData function: [function]`
   - `🔥 Error Generator [id]: Update called with isManuallyActivated: true`

**Expected:** All 4 logs should appear
**If missing:** Button click handler is not being called

### Step 2: Verify updateNodeData is Working
1. After clicking, check if the updateNodeData function was actually called
2. Look for the state change in React DevTools
3. Check if `data.isManuallyActivated` changes from `false` to `true`

**Expected:** The data object should update
**If not working:** Issue is in the updateNodeData function or state management

### Step 3: Verify Processing Logic Trigger
1. After button click, check for processing logic logs:
   - `⚡ Error Generator [id]: GENERATING ERROR error (manual activation)`
   - `📄 Error Generator [id]: Message: "[error message]"`
   - `✅ Error Generator [id]: Error generation complete`

**Expected:** Processing logic should trigger after data update
**If missing:** useEffect dependencies issue or processing logic not responding to data changes

### Step 4: Verify Visual Button Toggle
1. After activation, the button should change from:
   - Text: "Activate" → "Reset"
   - Color: green → red
   - Class: `bg-green-500` → `bg-red-500`

**Expected:** Button appearance changes
**If not changing:** Component not re-rendering with new data

## Common Issues & Solutions

### Issue 1: Button Click Handler Not Called
- **Check:** Button element has correct `onClick` handler
- **Check:** Event propagation not being blocked by parent elements
- **Solution:** Verify button is properly wired up

### Issue 2: updateNodeData Not Working
- **Check:** Function is passed correctly to component
- **Check:** Node ID is correct
- **Solution:** Verify state management flow

### Issue 3: Processing Logic Not Triggered
- **Check:** useEffect dependencies include the changed data properties
- **Solution:** Add `nodeData` or specific properties to dependencies array

### Issue 4: Component Not Re-rendering
- **Check:** React state management properly set up
- **Check:** Component is using the updated data prop
- **Solution:** Verify data flow from store to component

## Quick Fixes Applied

1. ✅ **Fixed infinite loop** - Added `'testErrorRefactored'` to error recovery exclusions
2. ✅ **Fixed useEffect dependencies** - Replaced `nodeData` object with specific properties to avoid infinite re-renders
3. ✅ **Fixed NodeContent props** - Added proper `id` prop passing
4. ✅ **Added debugging logs** - Enhanced console logging for troubleshooting

## ✅ INFINITE LOOP ISSUE RESOLVED

**Root Cause:** The `nodeData` object was being added as a useEffect dependency, but since objects get recreated on every render in React, this caused infinite re-processing.

**Final Fix:** Replaced `nodeData` dependency with specific properties:
- `isManuallyActivated` - for manual activation detection
- `triggerMode` - for trigger mode changes
- `value` - for output value changes
- `heldText` - for text input changes

This ensures that processing logic only re-runs when these specific values actually change, not when the object reference changes.

## Test Results

- [ ] Console logs appear when button clicked
- [ ] updateNodeData function is called successfully  
- [ ] Processing logic triggers after data update
- [ ] Button visual state changes properly
- [ ] Error generation completes successfully 