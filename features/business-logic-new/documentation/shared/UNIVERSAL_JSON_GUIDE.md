# Universal JSON Input System Guide

## 🎯 Overview

The NodeFactory includes a **universal JSON input system** with **smart handle visibility**. JSON handles automatically show when they have connections (so you can manage them) and hide when unused (for a clean interface). **JSON processing works continuously** for all connections regardless of handle visibility.

## 🚀 How It Works

### 1. Smart JSON Handle Visibility
- **Connected handles**: Always visible (even when Vibe Mode is off) 
- **Unconnected handles**: Hidden when Vibe Mode is off, visible when Vibe Mode is on
- **Vibe Mode On**: All JSON handles visible (purple `j` type) for creating connections
- **Vibe Mode Off**: Only connected handles visible for managing existing connections

### 2. JSON Processing Always Active
- **All connections**: Process JSON data continuously regardless of handle visibility
- **Real-time updates**: Data flows immediately when JSON changes
- **Background processing**: Works even when some handles are hidden
- **Smart interface**: Shows only the handles you're actually using

### 3. Create JSON Data
Use the **TestJson** node to create and validate JSON:
```json
{
  "heldText": "Hello from JSON!",
  "text": "Updated via JSON",
  "someProperty": "value"
}
```

### 4. Connect and Update
1. **Enable Vibe Mode**: Click purple X to show all JSON handles
2. **Connect**: TestJson output (`j`) → Target node input (`j`)
3. **Data flows**: Node data updates automatically in real-time
4. **Smart behavior**: Connected handle stays visible even when Vibe Mode is disabled

## 🔧 Universal Support

**Every factory-created node automatically has JSON input!** Zero configuration needed.

### Automatic Features:
- ✅ **JSON input handle** on every factory node (always visible as gray `j`)
- ✅ **Safe parsing** with error handling
- ✅ **Property filtering** (excludes dangerous properties like `error`)
- ✅ **Change detection** (only updates when data actually changes)
- ✅ **Real-time updates** with immediate visual feedback
- ✅ **Enhanced styling** when Vibe Mode is active (purple glow)
- ✅ **Always functional** regardless of Vibe Mode state

### Node Examples:

#### CreateText Node
```json
{
  "heldText": "Dynamic text from JSON",
  "text": "Output text"
}
```

#### CyclePulse Node
```json
{
  "cycleDuration": 2000,
  "pulseDuration": 300,
  "maxCycles": 10,
  "isOn": true
}
```

#### Error Generator Node
```json
{
  "errorMessage": "Custom JSON error",
  "errorType": "warning",
  "triggerMode": "always"
}
```

#### CountInput Node
```json
{
  "count": 42,
  "multiplier": 5,
  "autoCount": true
}
```

## 📋 Connection Workflow

### Creating New Connections
1. **Enable Vibe Mode**: Click purple X in toolbar (all handles appear)
2. **Create nodes**: Add TestJson and target node  
3. **Configure JSON**: Enter valid JSON in TestJson
4. **Connect**: TestJson output (`j`) → Target node input (`j`)
5. **Verify**: Check target node data updates immediately
6. **Smart cleanup**: Disable Vibe Mode - connected handles stay, unused ones hide

### Managing Existing Connections
1. **Connected handles**: Always visible for easy access and management
2. **Data processing**: Continues continuously regardless of Vibe Mode state
3. **Clean interface**: Unused handles don't clutter your view
4. **Full access**: Enable Vibe Mode anytime to see all handles and create new connections

## 🎨 Visual Indicators

### Smart Handle Visibility States
- **Vibe Mode Off + Connected**: Handle **visible** (can manage existing connection)
- **Vibe Mode Off + Unconnected**: Handle **hidden** (clean interface)
- **Vibe Mode On**: All handles **visible** (can create and manage connections)
- **Position**: Top center of nodes (`Position.Top`)
- **Type**: Always `j` (JSON data type)

### Benefits of Smart Visibility
- **Clean interface**: Only see handles you're using
- **Easy management**: Connected handles always accessible
- **Clear workflow**: Enable Vibe Mode when you need to create connections
- **No disruption**: Existing connections continue working seamlessly

## 🔧 Advanced Usage

### Multiple JSON Inputs
Nodes can receive JSON from multiple sources:
```typescript
// JSON data gets merged safely with conflict resolution
const mergedData = Object.assign({}, currentData, safeJsonData);
```

### JSON Templates
Use TestJson quick examples for common patterns:
- **Text Update**: `{"heldText": "Hello!", "text": "Output"}`
- **CyclePulse Config**: `{"cycleDuration": 1000, "pulseDuration": 200}`
- **Count Config**: `{"count": 42, "step": 5, "active": true}`

### Error Handling
- **Parse errors**: Logged to console, don't break functionality
- **Type validation**: Only object types accepted
- **Property filtering**: Dangerous properties automatically removed
- **Change detection**: Only meaningful changes trigger updates

## 🛡️ Safety Features

### Automatic Filtering
```json
// ❌ This property is automatically filtered out
{
  "error": "This would break the node",
  "validProperty": "This gets applied"
}
// ✅ Only validProperty gets applied
```

### Type Validation
```json
// ✅ Valid - Object type
{"property": "value"}

// ❌ Invalid - Array type
["array", "values"]

// ❌ Invalid - Primitive type
"just a string"
```

### Change Detection
- Only applies updates when data actually changes
- Prevents infinite update loops
- Optimizes performance with minimal re-renders

## 🔄 Migration & Compatibility

### From Previous Versions
- **Existing connections**: Continue to work automatically
- **No breaking changes**: All previous JSON functionality preserved
- **Enhanced experience**: Better visual feedback and debugging

### Factory vs Manual Nodes
- **Factory nodes**: Automatic JSON support (recommended)
- **Manual nodes**: May need custom JSON handling
- **Mixed flows**: Factory and manual nodes can coexist

## 📊 Performance Optimizations

### Efficient Processing
- **Change detection**: Only updates when necessary
- **Memoized connections**: Prevents unnecessary re-calculations
- **Safe parsing**: Error handling doesn't impact performance
- **Optimized rendering**: Minimal impact on UI performance

### Best Practices
- **Use TestJson**: For validation before connecting
- **Monitor console**: Check for parsing errors or warnings
- **Test incrementally**: Start with simple JSON, add complexity
- **Use inspector**: Verify property updates in real-time

## 🎯 Common Patterns

### Dynamic Text Content
```typescript
// TestJson → CreateText
{
  "heldText": "Dynamic content",
  "text": "Processed output"
}
```

### Timer Configuration
```typescript
// TestJson → CyclePulse
{
  "cycleDuration": 1500,
  "pulseDuration": 250,
  "maxCycles": 8
}
```

### Error Simulation
```typescript
// TestJson → Error Generator
{
  "errorMessage": "Test scenario error",
  "errorType": "critical",
  "triggerMode": "always"
}
```

### Counter Control
```typescript
// TestJson → CountInput  
{
  "count": 100,
  "multiplier": 2,
  "autoCount": false
}
```

## 🔍 Troubleshooting

### JSON Not Applying
1. **Check JSON format**: Use TestJson for validation
2. **Verify connection**: Ensure `j` to `j` handle connection
3. **Check console**: Look for parsing errors
4. **Property names**: Ensure they match node data structure

### Handles Not Visible
1. **Factory nodes**: Ensure using factory-created nodes
2. **Gray handles**: Should be visible by default
3. **Manual nodes**: May need custom JSON support

### Vibe Mode Issues
1. **Purple styling**: Only appears when Vibe Mode active
2. **Basic functionality**: Works without Vibe Mode
3. **Toggle state**: Check purple X button in toolbar

## 🎉 Success Indicators

### Working Connection
- ✅ Gray JSON handles visible on both nodes
- ✅ Connection line appears when dragging
- ✅ Target node data updates immediately
- ✅ Console shows "JSON Processing" logs

### Enhanced with Vibe Mode
- ✅ Purple JSON handles with glow effects
- ✅ Enhanced console feedback
- ✅ Pulsing toolbar button
- ✅ Same functionality with better visuals

---

**The Universal JSON System makes every factory node programmable! Connect, configure, and control your flow with JSON data - always available, optionally enhanced with Vibe Mode! 🔗⚡** 