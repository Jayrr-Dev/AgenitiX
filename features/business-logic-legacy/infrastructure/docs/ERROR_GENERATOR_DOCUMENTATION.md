# Error Generator Node Documentation

## Overview

The **Error Generator** (formerly TestError) is a powerful testing and debugging node that can generate custom errors with different severity levels and trigger conditions. It's designed to help test error handling workflows and can set error states on connected nodes via Vibe Mode.

## Features

### 🎛️ Error Generation Modes
- **Warning**: Yellow indicator, doesn't trigger red visual error state
- **Error**: Orange indicator, triggers visual error state  
- **Critical**: Red indicator, triggers visual error state with "CRITICAL" prefix

### 🔌 Trigger Support
- **Always Generate**: Continuously generates errors regardless of inputs
- **Generate When Triggered ON**: Only generates errors when trigger input is active
- **Generate When Triggered OFF**: Only generates errors when trigger input is inactive

### 📥 JSON Output for Vibe Mode
- Outputs structured JSON containing error information
- Can be connected to any node's Vibe Mode handle to set error states
- Includes error message, type, timestamp, and status flags

## Node Interface

### Inputs
- **Boolean Trigger** (Left, blue handle): Optional trigger to control error generation
- **JSON Vibe Mode** (Top, purple handle): For receiving JSON configuration updates

### Outputs  
- **String Output** (Right, blue handle): Text representation of the error
- **JSON Output** (Bottom, purple handle): Structured error data for Vibe Mode

## Configuration Options

### Error Message
Custom text content for the generated error:
```
"Database connection failed"
"Invalid user credentials"  
"Network timeout occurred"
```

### Error Type
- **Warning**: For non-critical issues that don't break functionality
- **Error**: For standard errors that may affect operation
- **Critical**: For severe errors that require immediate attention

### Trigger Mode
- **Always Generate**: Constant error state (useful for testing)
- **Generate When Triggered ON**: Error only when trigger is active
- **Generate When Triggered OFF**: Error only when trigger is inactive

## Usage Examples

### 1. Basic Error Testing
```
Error Generator (Always Generate) → ViewOutput
```
- Set to "Always Generate" mode
- Configure custom error message
- View continuous error output

### 2. Conditional Error Generation
```
TriggerButton → Error Generator (Trigger ON) → ViewOutput
```
- Connect trigger button to Error Generator
- Set to "Generate When Triggered ON" 
- Error only appears when button is pressed

### 3. Vibe Mode Error Setting
```
Error Generator → [JSON Output] → Target Node [Vibe Mode Input]
```
- Enable Vibe Mode
- Connect JSON output to target node's purple handle
- Target node will show error state when Error Generator is active

### 4. Inverted Trigger Logic
```
TriggerButton → Error Generator (Trigger OFF) → ViewOutput
```
- Error appears when trigger is OFF
- Useful for "system normal" vs "system error" scenarios

## JSON Output Structure

When generating errors, the JSON output contains:

```json
{
  "error": "Custom error message",
  "errorType": "error",
  "isErrorState": true,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

### Properties
- **error**: The custom error message text
- **errorType**: Severity level (warning/error/critical)
- **isErrorState**: Boolean flag indicating active error state
- **timestamp**: ISO timestamp of when error was generated

## Visual States

### Collapsed View
- **Ready**: Shows "Ready" with trigger mode when not generating errors
- **Active**: Shows error type (WARNING/ERROR/CRITICAL) with "Active" status
- **System Error**: Shows "System Error" if the node itself has issues

### Expanded View
- Full configuration interface with dropdowns and text areas
- Real-time status display showing current state
- JSON output preview when generating errors
- Color-coded badges showing error type severity

### Color Coding
- **Yellow**: Warning level errors
- **Orange**: Standard error level  
- **Red**: Critical error level
- **Gray**: Inactive/ready state

## Inspector Controls

### Error Message
Multi-line text area for entering custom error messages:
- Supports line breaks and special characters
- Real-time preview in node display
- Placeholder text provides guidance

### Error Type Dropdown
- Warning: Non-critical issues
- Error: Standard operational errors
- Critical: Severe system issues

### Trigger Mode Dropdown  
- Always Generate: Continuous error state
- Generate When Triggered ON: Active trigger required
- Generate When Triggered OFF: Inactive trigger required

### Status Display
Real-time indicator showing:
- Current generation state (active/inactive)
- Error type being generated
- Trigger mode configuration

## Integration with Vibe Mode

### Setting Error States
1. Enable Vibe Mode (purple X button in toolbar)
2. Connect Error Generator's JSON output to target node's purple handle
3. Configure error message and type
4. Target node will display error state when Error Generator is active

### Example Error JSON for Vibe Mode
```json
{
  "error": "Connection timeout - please check network settings",
  "errorType": "error",
  "isErrorState": true,
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

When this JSON is sent to a node via Vibe Mode, the target node will:
- Display the error message
- Show red error styling
- Stop normal processing until error is cleared

## Best Practices

### Testing Workflows
- Use "Always Generate" mode for persistent error testing
- Use "Trigger ON" mode for user-initiated error scenarios
- Use "Trigger OFF" mode for "fault when disconnected" scenarios

### Error Types
- **Warning**: Configuration issues, deprecation notices
- **Error**: Processing failures, validation errors
- **Critical**: System failures, security breaches

### Message Guidelines
- Be specific about the error condition
- Include actionable information when possible
- Use consistent terminology across your flow

### Performance Considerations
- Disconnect Error Generator when not needed to avoid unnecessary processing
- Use trigger modes to control when errors are generated
- Clear error states when testing is complete

## Troubleshooting

### Error Generator Not Working
- Check trigger connections and values
- Verify trigger mode matches intended behavior
- Ensure Error Generator itself isn't in error state

### Vibe Mode Not Setting Errors
- Confirm Vibe Mode is enabled (purple handles visible)
- Check JSON output connection to target node
- Verify target node supports Vibe Mode (factory-created nodes)

### Visual States Not Updating
- Check that error type matches expected visual indicator
- Ensure node is in expanded view to see full status
- Refresh flow if visual states appear stuck

## Advanced Use Cases

### Error Cascades
Chain multiple Error Generators to create complex error scenarios:
```
Trigger → Error Gen A → Error Gen B → Error Gen C
```

### Conditional Error Types
Use different Error Generators with different trigger conditions:
```
High Priority Trigger → Critical Error Generator
Low Priority Trigger → Warning Error Generator
```

### Error Recovery Testing
Combine with other nodes to test error recovery:
```
Error Generator → Recovery Logic → Success Indicator
```

## Future Enhancements

Planned improvements:
- Error logging and history tracking
- Batch error generation for multiple nodes
- Error templates and presets
- Integration with external monitoring systems
- Automated error pattern generation

---

The Error Generator node is a powerful tool for testing error handling, validating workflows, and ensuring your systems gracefully handle failure scenarios. Use it to build robust, error-resilient flows! 🛠️ 