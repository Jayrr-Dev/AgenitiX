# Node Toast System

A modular toast notification system that appears above nodes to provide contextual feedback for node operations.

## Features

- **Positioned Above Node**: Toasts appear directly above the node that triggered them
- **Multiple Toast Types**: Success, error, warning, and info messages
- **Auto-dismiss**: Configurable duration with sensible defaults
- **Queue Management**: Multiple toasts stack vertically
- **Smooth Animations**: Framer Motion powered entrance/exit animations
- **Dismissible**: Users can manually dismiss toasts
- **Dark Mode Support**: Automatic theme adaptation
- **Modular Design**: Easy to integrate into any node

## Usage

### Basic Usage in Node Components

```typescript
import { useNodeToast } from '@/hooks/useNodeToast';

const MyNode = ({ id }: NodeProps) => {
  const { showSuccess, showError, showWarning, showInfo } = useNodeToast(id);

  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully');
    } catch (error) {
      showError('Save failed', error.message);
    }
  };

  const handleValidation = (isValid: boolean) => {
    if (isValid) {
      showSuccess('Validation passed');
    } else {
      showWarning('Validation failed', 'Please check your input');
    }
  };

  const handleInfo = () => {
    showInfo('Processing started', 'This may take a few moments');
  };

  return (
    <div>
      {/* Node content */}
    </div>
  );
};
```

### Advanced Usage with Custom Configuration

```typescript
const { showToast } = useNodeToast(id);

// Custom toast with specific duration
showToast({
  type: 'success',
  message: 'Operation completed',
  description: 'All items processed successfully',
  duration: 5000, // 5 seconds
  dismissible: true
});

// Non-dismissible toast
showToast({
  type: 'error',
  message: 'Critical error',
  description: 'System requires immediate attention',
  dismissible: false
});

// Persistent toast (no auto-dismiss)
showToast({
  type: 'info',
  message: 'Waiting for input',
  duration: 0 // Won't auto-dismiss
});
```

## Toast Types

### Success Toast
- **Color**: Green theme
- **Icon**: Check mark
- **Default Duration**: 3 seconds
- **Use Case**: Successful operations, confirmations

```typescript
showSuccess('Data saved successfully');
showSuccess('Connection established', 'Ready to sync data');
```

### Error Toast
- **Color**: Red theme
- **Icon**: Alert circle
- **Default Duration**: 6 seconds
- **Use Case**: Errors, failures, critical issues

```typescript
showError('Connection failed');
showError('Validation error', 'Email format is invalid');
```

### Warning Toast
- **Color**: Yellow theme
- **Icon**: Alert triangle
- **Default Duration**: 5 seconds
- **Use Case**: Warnings, potential issues, rate limits

```typescript
showWarning('Rate limit approaching');
showWarning('Unsaved changes', 'Your work will be lost');
```

### Info Toast
- **Color**: Blue theme
- **Icon**: Info circle
- **Default Duration**: 4 seconds
- **Use Case**: Information, status updates, tips

```typescript
showInfo('Processing started');
showInfo('New feature available', 'Check out the updated interface');
```

## Integration with Node Scaffold

The toast system is automatically integrated into all nodes through the `withNodeScaffold` HOC:

```typescript
// In withNodeScaffold.tsx
return (
  <NodeScaffoldWrapper>
    {/* Toast container positioned above the node */}
    <NodeToastContainer nodeId={props.id} />
    
    {/* Rest of node content */}
    <Component {...props} />
  </NodeScaffoldWrapper>
);
```

## Positioning and Layout

- **Position**: Absolute positioning above the node
- **Alignment**: Centered horizontally above the node
- **Width**: Automatically matches the node width (minimum 120px)
- **Z-Index**: 50 (appears above most UI elements)
- **Stacking**: Multiple toasts stack vertically with 8px gap
- **Responsive**: Adapts to different node sizes with:
  - Smaller icons and padding for narrow nodes (< 150px)
  - Hidden dismiss button for very narrow nodes (< 150px)
  - Hidden descriptions for narrow nodes (< 200px)

## Styling and Theming

### Light Mode
- Success: Green background with green border
- Error: Red background with red border  
- Warning: Yellow background with yellow border
- Info: Blue background with blue border

### Dark Mode
- Darker background variants with appropriate contrast
- Consistent border colors
- Proper text contrast ratios

### Animation
- **Entrance**: Fade in with slight scale and upward movement
- **Exit**: Fade out with slight scale and upward movement
- **Duration**: 200ms with easeOut timing
- **Stagger**: New toasts push existing ones up smoothly

## Performance Considerations

- **Event-based Communication**: Uses custom events to avoid prop drilling
- **Memoized Components**: Toast components are memoized for performance
- **Cleanup**: Automatic cleanup of event listeners on unmount
- **Debouncing**: Built-in debouncing prevents toast spam

## Best Practices

### When to Use Node Toasts

✅ **Good Use Cases:**
- Validation feedback
- Save/load confirmations
- Connection status updates
- Processing notifications
- Error messages specific to the node

❌ **Avoid For:**
- Global application messages (use global toast instead)
- Long-running status updates (use progress indicators)
- Non-actionable information
- Debugging messages (use console.log)

### Message Guidelines

- **Keep it Short**: Messages should be concise and scannable
- **Be Specific**: Provide actionable information when possible
- **Use Descriptions**: Add context with the description parameter
- **Consistent Tone**: Match the application's voice and tone

### Duration Guidelines

- **Success**: 3-4 seconds (quick confirmation)
- **Info**: 4-5 seconds (informational content)
- **Warning**: 5-6 seconds (needs attention)
- **Error**: 6+ seconds (critical information)
- **Persistent**: Use duration: 0 for messages requiring user action

## Examples in Real Nodes

### Email Node Example
```typescript
const EmailNode = ({ id }: NodeProps) => {
  const { showSuccess, showError, showInfo } = useNodeToast(id);

  const sendEmail = async () => {
    showInfo('Sending email...', 'Please wait');
    
    try {
      await emailService.send(emailData);
      showSuccess('Email sent', 'Message delivered successfully');
    } catch (error) {
      showError('Send failed', 'Please check your connection');
    }
  };
};
```

### Data Processing Node Example
```typescript
const ProcessDataNode = ({ id }: NodeProps) => {
  const { showSuccess, showWarning, showError } = useNodeToast(id);

  const processData = async (data: any[]) => {
    if (data.length === 0) {
      showWarning('No data to process', 'Connect a data source');
      return;
    }

    if (data.length > 1000) {
      showWarning('Large dataset', 'Processing may take longer');
    }

    try {
      const result = await processor.process(data);
      showSuccess(`Processed ${result.count} items`);
    } catch (error) {
      showError('Processing failed', error.message);
    }
  };
};
```

## Troubleshooting

### Toast Not Appearing
- Ensure `useNodeToast` is called with the correct node ID
- Check that the node is wrapped with `withNodeScaffold`
- Verify the toast container is not hidden by CSS

### Multiple Toasts Overlapping
- The system automatically stacks toasts vertically
- If overlapping occurs, check for CSS z-index conflicts

### Performance Issues
- Avoid calling toast methods in render loops
- Use debouncing for rapid-fire events
- Clear toasts when appropriate using `clearToasts()`

## API Reference

### useNodeToast Hook

```typescript
const {
  showToast,     // Show custom toast
  showSuccess,   // Show success toast
  showError,     // Show error toast  
  showWarning,   // Show warning toast
  showInfo,      // Show info toast
  clearToasts    // Clear all toasts for this node
} = useNodeToast(nodeId);
```

### ToastConfig Interface

```typescript
interface ToastConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
  duration?: number;        // 0 = no auto-dismiss
  dismissible?: boolean;    // default: true
}
```

### Default Durations

```typescript
const DEFAULT_DURATIONS = {
  success: 3000,  // 3 seconds
  info: 4000,     // 4 seconds  
  warning: 5000,  // 5 seconds
  error: 6000,    // 6 seconds
};
```