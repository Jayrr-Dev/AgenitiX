# Node Toast System

A contextual notification system that displays toast messages above individual nodes in the flow editor. Provides immediate feedback for node operations with perfect width matching and theme integration.

## Overview

The Node Toast System is a modular notification component that appears directly above nodes to provide contextual feedback. Unlike global toasts, these notifications are tied to specific nodes and automatically match their dimensions and styling.

## Features

- **Node-Specific**: Each toast is tied to a specific node
- **Perfect Width Matching**: Automatically matches the node's width using standardized sizing
- **Theme Integration**: Follows shadcn/ui design patterns with automatic light/dark mode support
- **Multiple Types**: Success, error, warning, and info notifications
- **Auto-Dismiss**: Configurable duration with sensible defaults
- **Queue Management**: Multiple toasts stack vertically with smooth animations
- **Responsive Design**: Adapts layout based on node width

## Quick Start

### Basic Usage

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

  return <div>{/* Node content */}</div>;
};
```

### Advanced Usage

```typescript
const { showToast, clearToasts } = useNodeToast(id);

// Custom configuration
showToast({
  type: 'warning',
  message: 'Rate limit approaching',
  description: 'Consider reducing request frequency',
  duration: 8000,
  dismissible: true
});

// Clear all toasts for this node
clearToasts();
```

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

#### Parameters

- `nodeId` (string): The ID of the node to show toasts above

#### Return Value

| Method | Parameters | Description |
|--------|------------|-------------|
| `showToast` | `(config: ToastConfig)` | Show a custom toast with full configuration |
| `showSuccess` | `(message: string, description?: string, duration?: number)` | Show a success toast |
| `showError` | `(message: string, description?: string, duration?: number)` | Show an error toast |
| `showWarning` | `(message: string, description?: string, duration?: number)` | Show a warning toast |
| `showInfo` | `(message: string, description?: string, duration?: number)` | Show an info toast |
| `clearToasts` | `()` | Clear all toasts for this node |

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

## Toast Types

### Success Toast
- **Color**: Green icon with theme-aware background
- **Icon**: Check mark
- **Default Duration**: 3 seconds
- **Use Case**: Successful operations, confirmations

```typescript
showSuccess('Operation completed');
showSuccess('Data saved', 'All changes have been saved successfully');
```

### Error Toast
- **Color**: Red icon with theme-aware background
- **Icon**: Alert circle
- **Default Duration**: 6 seconds
- **Use Case**: Errors, failures, critical issues

```typescript
showError('Connection failed');
showError('Validation error', 'Email format is invalid');
```

### Warning Toast
- **Color**: Yellow icon with theme-aware background
- **Icon**: Alert triangle
- **Default Duration**: 5 seconds
- **Use Case**: Warnings, potential issues, rate limits

```typescript
showWarning('Rate limit approaching');
showWarning('Unsaved changes', 'Your work will be lost');
```

### Info Toast
- **Color**: Blue icon with theme-aware background
- **Icon**: Info circle
- **Default Duration**: 4 seconds
- **Use Case**: Information, status updates, tips

```typescript
showInfo('Processing started');
showInfo('New feature available', 'Check out the updated interface');
```

## Styling and Theming

### Theme Integration
The toast system automatically adapts to the current theme using shadcn/ui design tokens:

- **Background**: `bg-background` (theme-aware)
- **Border**: `border-border` (theme-aware)
- **Text**: `text-foreground` (theme-aware)
- **Secondary Text**: `text-muted-foreground`
- **Icons**: Color-coded with dark mode variants

### Responsive Design
Toasts automatically adapt their layout based on node width:

- **Narrow nodes (< 150px)**: 
  - Smaller icons (12px)
  - Reduced padding
  - No dismiss button
- **Medium nodes (< 200px)**: 
  - Hide descriptions to save space
- **Wide nodes (≥ 200px)**: 
  - Full feature set with descriptions and dismiss buttons

### Font Size
All toast text uses 8px font size for compact display while maintaining readability.

## Width Matching System

The toast system uses the standardized sizing system to perfectly match node widths:

### Sizing Integration
```typescript
// Uses COLLAPSED_SIZES and EXPANDED_SIZES from theming system
import { COLLAPSED_SIZES, EXPANDED_SIZES } from '@/features/business-logic-modern/infrastructure/theming/sizing';

// Automatically detects node state and applies correct width
// Example: VE2 expanded = 180px, C2 collapsed = 120px
```

### Data Attributes
The system reads node state from data attributes added by the scaffold:
- `data-expanded`: Whether the node is expanded
- `data-expanded-size`: The expanded size key (e.g., "VE2")
- `data-collapsed-size`: The collapsed size key (e.g., "C2")
- `data-current-size`: The currently active size key

## Best Practices

### When to Use Node Toasts

✅ **Good Use Cases:**
- Operation confirmations (save, delete, update)
- Validation feedback
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
- **Use Descriptions**: Add context with the description parameter for important messages
- **Consistent Tone**: Match the application's voice and tone

### Duration Guidelines

- **Success**: 3 seconds (quick confirmation)
- **Info**: 4 seconds (informational content)
- **Warning**: 5 seconds (needs attention)
- **Error**: 6 seconds (critical information)
- **Persistent**: Use `duration: 0` for messages requiring user action

## Examples

### Basic Node Integration

```typescript
const EmailNode = ({ id }: NodeProps) => {
  const { showSuccess, showError, showInfo } = useNodeToast(id);

  const sendEmail = async () => {
    showInfo('Sending email...');
    
    try {
      await emailService.send(emailData);
      showSuccess('Email sent', 'Message delivered successfully');
    } catch (error) {
      showError('Send failed', 'Please check your connection');
    }
  };

  return (
    <div>
      <button onClick={sendEmail}>Send Email</button>
    </div>
  );
};
```

### Data Processing Node

```typescript
const ProcessDataNode = ({ id }: NodeProps) => {
  const { showSuccess, showWarning, showError } = useNodeToast(id);

  const processData = async (data: any[]) => {
    if (data.length === 0) {
      showWarning('No data to process');
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

  return <div>{/* Node content */}</div>;
};
```

### Custom Toast Configuration

```typescript
const AdvancedNode = ({ id }: NodeProps) => {
  const { showToast } = useNodeToast(id);

  const handleComplexOperation = () => {
    // Non-dismissible error
    showToast({
      type: 'error',
      message: 'Critical system error',
      description: 'Immediate attention required',
      dismissible: false,
      duration: 0 // Persistent
    });

    // Quick success message
    showToast({
      type: 'success',
      message: 'Quick save',
      duration: 1500
    });
  };

  return <div>{/* Node content */}</div>;
};
```

## Integration with Node Scaffold

The toast system is automatically integrated into all nodes through the `withNodeScaffold` HOC:

```typescript
// Automatically included in all scaffolded nodes
return (
  <NodeScaffoldWrapper>
    {/* Toast container positioned above the node */}
    <NodeToastContainer nodeId={props.id} />
    
    {/* Rest of node content */}
    <Component {...props} />
  </NodeScaffoldWrapper>
);
```

## Testing

### Test Node Available
Use the `testToast` node for comprehensive testing:
- All four toast types
- Custom configurations
- Multiple toast demonstrations
- Persistent toast testing
- Clear all functionality

### Manual Testing
1. Add the test toast node to your flow
2. Expand the node to see the full test panel
3. Click different buttons to test various toast types
4. Resize the node to test responsive behavior
5. Switch themes to test theme integration

## Troubleshooting

### Toast Not Appearing
- Ensure `useNodeToast` is called with the correct node ID
- Check that the node is wrapped with `withNodeScaffold`
- Verify the toast container is not hidden by CSS

### Width Not Matching
- Check that the node has proper data attributes
- Verify the node is using standardized sizing from the theming system
- Enable debug mode by setting `DEBUG_WIDTH = true` in NodeToast.tsx

### Performance Issues
- Avoid calling toast methods in render loops
- Use debouncing for rapid-fire events
- Clear toasts when appropriate using `clearToasts()`

## Technical Implementation

### Architecture
- **Event-Based Communication**: Uses custom DOM events to avoid prop drilling
- **Memoized Components**: Toast components are memoized for performance
- **Automatic Cleanup**: Event listeners are cleaned up on unmount
- **Width Detection**: Uses standardized sizing system with DOM fallback

### File Structure
```
features/business-logic-modern/infrastructure/node-core/
├── NodeToast.tsx          # Main toast component
├── withNodeScaffold.tsx   # Integration with node scaffold
└── NodeToast.md          # Detailed documentation

hooks/
└── useNodeToast.ts       # Hook for easy toast access
```

### Dependencies
- **Framer Motion**: Smooth animations
- **Lucide React**: Icons
- **Theming System**: Standardized sizing and colors

## Migration Guide

### From Global Toasts
If you're currently using global toasts for node-specific feedback:

```typescript
// Before (global toast)
import { toast } from 'sonner';
toast.success('Data saved');

// After (node toast)
import { useNodeToast } from '@/hooks/useNodeToast';
const { showSuccess } = useNodeToast(id);
showSuccess('Data saved');
```

### From Custom Notifications
If you have custom notification systems in nodes:

```typescript
// Before (custom notification)
const [notification, setNotification] = useState('');
useEffect(() => {
  if (notification) {
    const timer = setTimeout(() => setNotification(''), 3000);
    return () => clearTimeout(timer);
  }
}, [notification]);

// After (node toast)
const { showSuccess } = useNodeToast(id);
// Just call showSuccess when needed - no state management required
```

## Future Enhancements

### Planned Features
- Toast positioning options (above, below, side)
- Custom toast templates
- Integration with global notification system
- Analytics tracking for toast interactions
- Accessibility improvements

### Extension Points
The system is designed to be extensible:
- Custom toast types can be added
- Styling can be customized per node type
- Animation patterns can be modified
- Duration calculations can be customized

---

*This documentation covers the complete Node Toast System. For implementation details, see the source code in `features/business-logic-modern/infrastructure/node-core/NodeToast.tsx`.*