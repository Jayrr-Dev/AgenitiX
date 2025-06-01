# Vibe Mode (HAX Mode) Documentation

## Overview

**Vibe Mode** is an enhancement feature that provides enhanced styling and visual feedback for JSON-based node manipulation. **JSON handles are always functional** on all factory nodes - Vibe Mode simply enhances the experience with purple styling and enhanced processing feedback.

## Features

### 🎛️ Action Toolbar Integration
- **Location**: Top-right corner toolbar (formerly UndoRedoToolbar)
- **Button**: Purple "X" icon with pulsing animation when active
- **Toggle**: Click to enable/disable Vibe Mode enhanced styling

### 🔌 Smart JSON Handles
- **Appearance**: Purple JSON handles (`j` type) with intelligent visibility
- **Data Type**: JSON (`j` type)
- **Functionality**: **JSON processing always works** for existing connections, regardless of handle visibility
- **Smart Visibility**: 
  - **Connected handles**: Always visible (even when Vibe Mode is off)
  - **Unconnected handles**: Hidden when Vibe Mode is off, visible when Vibe Mode is on
  - **All handles**: Visible when Vibe Mode is active
- **Styling When Active**: 
  - Background: `#8b5cf6` (purple-500)
  - Border: `#7c3aed` (purple-600)
  - Purple glow with enhanced visual feedback

### 📥 JSON Processing
- **Input Sources**: Any node that outputs JSON data
- **Data Properties**: Accepts JSON from `json`, `text`, `value`, `output`, or `result` properties
- **Safety**: Filters out `error` property to prevent system corruption
- **Validation**: 
  - Must be valid JSON object (not array or primitive)
  - String inputs are parsed as JSON
  - Object inputs are used directly
- **Always Active**: JSON processing works **for existing connections** regardless of Vibe Mode state
- **Smart Connections**: Connected handles remain visible for easy management

## Usage Guide

### 1. Enable Vibe Mode (Required for New Connections)
1. Locate the Action Toolbar in the top-right corner
2. Click the purple "X" button
3. Purple JSON handles will appear on all factory nodes (connected and unconnected)
4. Button will show active state with pulsing animation
5. Now you can create new JSON connections

### 2. Create JSON Data
Use the **TestJson** node to generate JSON:
```json
{
  "heldText": "Hello from JSON!",
  "text": "Updated via JSON",
  "cycleDuration": 1000,
  "pulseDuration": 200,
  "infinite": false,
  "maxCycles": 5
}
```

### 3. Connect and Modify
1. **With Vibe Mode active**: Connect TestJson output to any node's purple JSON handle
2. Node data will be updated in real-time
3. Changes apply immediately to node behavior
4. **After connecting**: You can turn off Vibe Mode and the connected handle remains visible

### 4. Smart Handle Behavior
- **Disable Vibe Mode**: Unconnected JSON handles disappear, connected ones stay visible
- **Connected handles**: Always visible for easy access and management
- **Clean interface**: Only shows JSON handles you're actually using
- **Re-enable Vibe Mode**: Shows all handles again for creating new connections

### 5. Monitor Changes
- Check node inspector to see updated values
- Node behavior changes immediately
- Console logs show applied JSON data
- Connected handles provide visual confirmation of active JSON flows

## Example Use Cases

### Cycle Timer Configuration
```json
{
  "cycleDuration": 500,
  "pulseDuration": 100,
  "maxCycles": 10
}
```

### Text Node Modification
```json
{
  "text": "Dynamic content updated via JSON",
  "heldText": "Updated content"
}
```

### Error Generator Control
```json
{
  "errorMessage": "Custom test error",
  "errorType": "warning",
  "triggerMode": "always"
}
```

## TestJson Node

### Purpose
Specialized node for creating and validating JSON data for universal JSON manipulation.

### Features
- **Real-time validation**: Shows parse errors immediately
- **Visual feedback**: Green for valid JSON, orange for errors
- **Inspector integration**: Full JSON editor in inspector panel
- **Auto-formatting**: Displays formatted JSON preview
- **Always outputs to JSON handle**: No Vibe Mode required

### Interface
- **Input**: Textarea for JSON text editing
- **Output**: JSON handle (`j` type) - always functional
- **Status**: Real-time parse status and property count
- **Preview**: Formatted JSON display when valid

## Technical Implementation

### Store Management
```typescript
// Zustand store for Vibe Mode enhanced styling state
interface VibeModeState {
  isVibeModeActive: boolean;
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
}
```

### Factory Integration
- **Universal JSON Handles**: Gray JSON handle automatically added to all factory nodes
- **Always Functional**: JSON processing runs continuously, not just in Vibe Mode
- **Enhanced Styling**: Purple styling and glow effects when `isVibeModeActive`
- **Error Handling**: Parse failures don't disrupt normal node operation
- **Performance**: Optimized processing with change detection

### Node Registration
```typescript
// All factory nodes automatically get JSON input support
const enhancedConfig = {
  ...config,
  handles: addJsonInputSupport(config.handles)
};

// JSON input handle automatically added if not present
{ id: 'j', dataType: 'j', position: Position.Top, type: 'target' }
```

## Security Considerations

### Safe Properties
- Filters out `error` property to prevent system corruption
- Only accepts valid JSON objects (not arrays or primitives)
- Parse failures are logged but don't set error states

### Validation
```typescript
// Validate JSON object structure
if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
  console.warn(`JSON Processing: JSON input must be an object`);
  return;
}

// Filter unsafe properties
const { error: _, ...safeData } = parsedData;
```

## Troubleshooting

### Common Issues

**JSON handles not showing**
- Check that you're using factory-created nodes (manual nodes may not have auto JSON support)
- All factory nodes should have gray JSON handles by default

**JSON not applying**
- Verify JSON is valid object format (use TestJson for validation)
- Check console for parsing errors
- Ensure TestJson shows "Valid JSON" status

**Node behavior not changing**
- Confirm properties match node's data structure
- Check node's inspector for updated values
- Some changes may require re-triggering node processing

**Vibe Mode styling not appearing**
- Ensure Vibe Mode is enabled (purple X button active)
- JSON handles should turn purple when Vibe Mode is active
- Basic functionality works regardless of styling

### Debug Information
- Console logs show JSON application: `JSON Processing nodeId: Applying JSON data:`
- Parse errors logged: `JSON Processing nodeId: Failed to parse JSON:`
- Validation warnings: `JSON Processing nodeId: JSON input must be an object`

## Best Practices

### JSON Structure
- Use exact property names from node data structure
- Include only properties you want to change
- Validate JSON in TestJson before connecting

### Performance
- JSON connections are always optimized with change detection
- Only meaningful changes trigger updates
- Use TestJson for validation before connecting

### Development
- Test JSON changes in isolated flows first
- Use inspector panel to verify property updates
- Keep backup of original node configurations

## Key Differences from Previous Version

### ✅ What's Always Available Now
- **Gray JSON handles on all factory nodes** (always visible)
- **Functional JSON connections** (work without Vibe Mode)
- **Real-time data updates** (immediate processing)
- **Universal node support** (all factory nodes)

### 🎨 What Vibe Mode Adds
- **Purple styling** for JSON handles
- **Glow effects** and enhanced visual feedback
- **Enhanced console logging** for debugging
- **Visual indicators** of active JSON processing

### 🔄 Migration Notes
- Old flows with JSON connections will work immediately
- No need to activate Vibe Mode for basic JSON functionality
- Vibe Mode now purely enhances the visual experience
- All existing JSON connections remain functional

## Future Enhancements

### Planned Features
- **JSON templates**: Pre-built JSON configurations for common use cases
- **Batch operations**: Apply JSON to multiple nodes simultaneously
- **Schema validation**: Type-specific JSON validation for different node types
- **Real-time collaboration**: Share JSON configurations between users

### Integration Opportunities
- **Flow templates**: Save/load entire flow configurations via JSON
- **External APIs**: Connect to external services for dynamic configuration
- **Automation**: Trigger JSON changes based on external events
- **Performance monitoring**: Track JSON processing performance

---

**The Universal JSON System makes every factory node programmable through JSON input, with Vibe Mode providing enhanced visual feedback for power users! 🔗✨** 