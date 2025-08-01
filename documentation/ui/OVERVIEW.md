# UI Components Documentation

This directory contains documentation for user interface components and systems used throughout the AgenitiX platform.

## Available Documentation

### [Node Toast System](./node-toast-system.md) | [HTML Version](./node-toast-system.html)
A contextual notification system that displays toast messages above individual nodes in the flow editor.

**Key Features:**
- Node-specific notifications that appear above individual nodes
- Perfect width matching using standardized sizing system
- Theme integration with shadcn/ui design patterns
- Multiple toast types (success, error, warning, info)
- Auto-dismiss with configurable durations
- Responsive design that adapts to node width

**Quick Usage:**
```typescript
import { useNodeToast } from '@/hooks/useNodeToast';

const MyNode = ({ id }: NodeProps) => {
  const { showSuccess, showError } = useNodeToast(id);
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved successfully');
    } catch (error) {
      showError('Save failed', error.message);
    }
  };
};
```

## Component Categories

### Notification Systems
- **Node Toast System** - Contextual notifications for individual nodes
- Global Toast System (uses sonner) - Application-wide notifications

### Node Components
- Node Scaffold System - Wrapper system for all nodes
- Handle System - Connection points between nodes
- Inspector System - Node configuration panels

### Theming Components
- Design Token System - Centralized styling tokens
- Theme Switcher - Light/dark mode toggle
- Component Theme Store - Theme-aware component styling

## Development Guidelines

### When to Use Node Toasts vs Global Toasts

**Use Node Toasts for:**
- Operation confirmations specific to a node (save, delete, update)
- Validation feedback for node inputs
- Connection status updates for individual nodes
- Processing notifications for node operations
- Error messages specific to node functionality

**Use Global Toasts for:**
- Application-wide notifications
- System status updates
- Authentication messages
- Navigation feedback
- Cross-component notifications

### Best Practices

1. **Keep Messages Concise**: Toast messages should be scannable and brief
2. **Provide Context**: Use descriptions for important messages
3. **Choose Appropriate Duration**: Match duration to message importance
4. **Use Correct Type**: Success for confirmations, error for failures, warning for cautions, info for status
5. **Consider Node Size**: Messages adapt to node width automatically

### Accessibility

All UI components should follow accessibility best practices:
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast support
- Focus management

## File Structure

```
documentation/ui/
├── OVERVIEW.md                    # This file
├── node-toast-system.md          # Node toast documentation
├── node-toast-system.html        # HTML version of toast docs
└── [future component docs]       # Additional UI component documentation
```

## Related Documentation

- [Node Development Standards](../nodes/README.md) - Guidelines for creating nodes
- [Handle System](../handles/HANDLE_SYSTEM.md) - Connection system between nodes
- [Theming System](../theming/) - Design tokens and theme management
- [Core Tokens](../core-tokens.md) - Design system tokens

## Contributing

When adding new UI components:

1. Create comprehensive documentation in both Markdown and HTML formats
2. Include code examples and usage patterns
3. Document accessibility considerations
4. Add integration guidelines
5. Update this overview file

For questions or contributions, refer to the main project documentation or contact the development team.