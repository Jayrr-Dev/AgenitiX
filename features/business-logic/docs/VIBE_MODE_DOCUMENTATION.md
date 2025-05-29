# Vibe Mode (HAX Mode) Documentation

## Overview

**Vibe Mode** is an advanced feature that enables programmatic manipulation of node data through JSON input. When activated, it unlocks "HAX" allowing users to dynamically modify any node's properties by sending JSON data through a special purple handle.

## Features

### 🎛️ Action Toolbar Integration
- **Location**: Top-right corner toolbar (formerly UndoRedoToolbar)
- **Button**: Purple "X" icon with pulsing animation when active
- **Toggle**: Click to enable/disable Vibe Mode globally

### 🔌 Dynamic JSON Handles
- **Appearance**: Purple square handles at the center-top of all nodes
- **Data Type**: JSON (`j` type)
- **Visibility**: Only visible when Vibe Mode is active
- **Styling**: 
  - Background: `#8b5cf6` (purple-500)
  - Border: `#7c3aed` (purple-600)
  - Square shape (3px border-radius) to distinguish from regular handles

### 📥 JSON Processing
- **Input Sources**: Any node that outputs JSON data
- **Data Properties**: Accepts JSON from `json`, `text`, `value`, `output`, or `result` properties
- **Safety**: Filters out `error` property to prevent system corruption
- **Validation**: 
  - Must be valid JSON object (not array or primitive)
  - String inputs are parsed as JSON
  - Object inputs are used directly

## Usage Guide

### 1. Enable Vibe Mode
1. Locate the Action Toolbar in the top-right corner
2. Click the purple "X" button
3. Purple handles will appear on all nodes
4. Button will show active state with pulsing animation

### 2. Create JSON Data
Use the **TestJson** node to generate JSON:
```json
{
  "cycleDuration": 1000,
  "pulseDuration": 200,
  "infinite": false,
  "maxCycles": 5
}
```

### 3. Connect and Modify
1. Connect TestJson output to any node's purple Vibe Mode handle
2. Node data will be updated in real-time
3. Changes apply immediately to node behavior

### 4. Monitor Changes
- Check node inspector to see updated values
- Node behavior changes immediately
- Console logs show applied JSON data

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
  "text": "Dynamic content updated via Vibe Mode",
  "color": "red"
}
```

### Logic Gate Settings
```json
{
  "threshold": 0.75,
  "invertOutput": true
}
```

## TestJson Node

### Purpose
Specialized node for creating and validating JSON data for Vibe Mode manipulation.

### Features
- **Real-time validation**: Shows parse errors immediately
- **Visual feedback**: Green for valid JSON, orange for errors
- **Inspector integration**: Full JSON editor in inspector panel
- **Auto-formatting**: Displays formatted JSON preview

### Interface
- **Input**: Textarea for JSON text editing
- **Output**: JSON handle (`j` type) 
- **Status**: Real-time parse status and property count
- **Preview**: Formatted JSON display when valid

## Technical Implementation

### Store Management
```typescript
// Zustand store for global Vibe Mode state
interface VibeModeState {
  isVibeModeActive: boolean;
  toggleVibeMode: () => void;
  enableVibeMode: () => void;
  disableVibeMode: () => void;
}
```

### Factory Integration
- **Conditional Handles**: Purple JSON handle added when `isVibeModeActive`
- **Processing Logic**: Vibe Mode processing runs before normal node logic
- **Error Handling**: Parse failures don't disrupt normal node operation
- **Performance**: Only processes when Vibe Mode is active and connections exist

### Node Registration
```typescript
// All factory nodes automatically support Vibe Mode
const allInputHandles = isVibeModeActive 
  ? [...inputHandles, { id: 'vibe_json', dataType: 'j', position: Position.Top, type: 'target' }]
  : inputHandles;
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
  console.warn(`VibeMode: JSON input must be an object`);
  return;
}

// Filter unsafe properties
const { error: _, ...safeData } = parsedData;
```

## Troubleshooting

### Common Issues

**Purple handles not showing**
- Ensure Vibe Mode is enabled (purple X button active)
- Check that nodes are factory-created (manual nodes may not support it)

**JSON not applying**
- Verify JSON is valid object format
- Check console for parsing errors
- Ensure TestJson shows "Valid JSON" status

**Node behavior not changing**
- Confirm properties match node's data structure
- Check node's inspector for updated values
- Some changes may require re-triggering node processing

### Debug Information
- Console logs show JSON application: `VibeMode nodeId: Applying JSON data:`
- Parse errors logged: `VibeMode nodeId: Failed to parse JSON:`
- Validation warnings: `VibeMode nodeId: JSON input must be an object`

## Best Practices

### JSON Structure
- Use exact property names from node data structure
- Include only properties you want to change
- Validate JSON in TestJson before connecting

### Performance
- Disconnect Vibe Mode connections when not needed
- Disable Vibe Mode when not in use to hide handles
- Use meaningful property values to avoid unnecessary updates

### Development
- Test JSON changes in isolated flows first
- Use inspector panel to verify property updates
- Keep backup of original node configurations

## Future Enhancements

### Planned Features
- **Visual indicators**: Show when nodes are receiving JSON input
- **JSON templates**: Pre-built JSON configurations for common use cases
- **Batch operations**: Apply JSON to multiple nodes simultaneously
- **JSON validation**: Schema validation for specific node types
- **Undo/Redo**: Proper history tracking for Vibe Mode changes

### Integration Opportunities
- **Flow templates**: Save/load entire flow configurations via JSON
- **External APIs**: Connect to external services for dynamic configuration
- **Real-time collaboration**: Share Vibe Mode configurations between users
- **Automation**: Trigger Vibe Mode changes based on external events 