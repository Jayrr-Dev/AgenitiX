# Design Document

## Overview

The viewBoolean node is a simple visualization component that takes a boolean input, displays it in a clear visual format, and passes the boolean value through as output. This node follows the established AgenitiX node architecture patterns while providing a clean, focused boolean display interface.

## Architecture

### Node Classification
- **Domain**: `view`
- **Category**: `VIEW` 
- **Kind**: `viewBoolean`
- **Type**: Visualization node with pass-through capability

### Core Responsibilities
1. **Input Processing**: Accept boolean values from connected nodes
2. **Visual Display**: Show boolean state with clear true/false indicators
3. **Output Propagation**: Pass the boolean value through unchanged
4. **State Management**: Handle connection/disconnection gracefully

## Components and Interfaces

### Data Schema
```typescript
export const ViewBooleanDataSchema = z.object({
  // Core boolean state
  booleanValue: z.boolean().nullable().default(null),
  
  // UI State
  isEnabled: SafeSchemas.boolean(true),
  isActive: SafeSchemas.boolean(false),
  isExpanded: SafeSchemas.boolean(false),
  
  // Sizing
  expandedSize: SafeSchemas.text("FE1"),
  collapsedSize: SafeSchemas.text("C1"),
  
  // Data flow
  inputs: z.boolean().nullable().default(null),
  outputs: z.boolean().nullable().default(null),
  
  // Customization
  label: z.string().optional(),
}).passthrough();
```

### Handle Configuration
```typescript
handles: [
  {
    id: "boolean-input",
    code: "b",
    position: "left",
    type: "target",
    dataType: "Boolean",
  },
  {
    id: "boolean-output", 
    code: "b",
    position: "right",
    type: "source",
    dataType: "Boolean",
  },
]
```

### Visual States

#### True State
- **Color**: Green indicator (success color)
- **Icon**: Checkmark or filled circle
- **Text**: "TRUE" or "✓"
- **Background**: Light green tint (optional)

#### False State  
- **Color**: Red indicator (error color)
- **Icon**: X mark or empty circle
- **Text**: "FALSE" or "✗"
- **Background**: Light red tint (optional)

#### Null/Undefined State
- **Color**: Gray indicator (muted color)
- **Icon**: Question mark or dash
- **Text**: "NULL" or "—"
- **Background**: Neutral gray tint

#### Disconnected State
- **Color**: Muted gray
- **Icon**: Disconnected symbol
- **Text**: "NO INPUT"
- **Background**: Dashed border

### Size Configurations

#### Collapsed State (C1: 60x60)
- Minimal space usage
- Icon-only display with color coding
- Tooltip on hover showing full state

#### Expanded State (FE1: 120x120)
- Icon + text display
- Clear boolean value indication
- More readable for debugging

## Data Models

### Input Processing
```typescript
const computeInput = useCallback((): boolean | null => {
  const inputEdge = findEdgeByHandle(edges, id, "boolean-input");
  if (!inputEdge) return null;
  
  const sourceNode = nodes.find(n => n.id === inputEdge.source);
  if (!sourceNode) return null;
  
  // Priority: outputs > data > direct boolean value
  const value = sourceNode.data?.outputs ?? 
                sourceNode.data?.booleanValue ?? 
                sourceNode.data;
                
  return typeof value === 'boolean' ? value : null;
}, [edges, nodes, id]);
```

### Output Propagation
```typescript
const propagateOutput = useCallback((value: boolean | null) => {
  if (isActive && isEnabled) {
    updateNodeData({ outputs: value });
  } else {
    updateNodeData({ outputs: null });
  }
}, [isActive, isEnabled, updateNodeData]);
```

### State Management
```typescript
// Update active state based on input availability
useEffect(() => {
  const hasValidInput = inputs !== null;
  if (isActive !== hasValidInput) {
    updateNodeData({ isActive: hasValidInput });
  }
}, [inputs, isActive, updateNodeData]);

// Propagate output when state changes
useEffect(() => {
  propagateOutput(inputs);
}, [inputs, propagateOutput]);
```

## Error Handling

### Input Validation
- **Non-boolean inputs**: Convert to boolean or show warning
- **Undefined/null inputs**: Display as disconnected state
- **Invalid connections**: Graceful degradation with error indication

### Edge Cases
- **Multiple inputs**: Use first valid boolean input
- **Type coercion**: Convert truthy/falsy values to boolean
- **Connection removal**: Reset to disconnected state immediately

### Error States
```typescript
const handleInvalidInput = (value: unknown): boolean | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  
  // Type coercion for common cases
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    if (lower === 'true' || lower === '1') return true;
    if (lower === 'false' || lower === '0') return false;
  }
  
  if (typeof value === 'number') {
    return value !== 0;
  }
  
  // Default to truthy/falsy conversion
  return Boolean(value);
};
```

## Testing Strategy

### Unit Tests
1. **Input Processing**
   - Test boolean true/false inputs
   - Test null/undefined inputs  
   - Test type coercion scenarios
   - Test invalid input handling

2. **Output Propagation**
   - Test pass-through functionality
   - Test output when disabled
   - Test output when disconnected

3. **Visual States**
   - Test true state rendering
   - Test false state rendering
   - Test null state rendering
   - Test disconnected state rendering

### Integration Tests
1. **Node Connections**
   - Test connection to boolean source nodes
   - Test connection to non-boolean source nodes
   - Test multiple input scenarios
   - Test connection removal

2. **Flow Integration**
   - Test in complete workflows
   - Test with other view nodes
   - Test with boolean logic nodes
   - Test performance with rapid state changes

### Visual Testing
1. **Responsive Design**
   - Test collapsed vs expanded states
   - Test different screen sizes
   - Test theme variations (light/dark)

2. **Accessibility**
   - Test screen reader compatibility
   - Test keyboard navigation
   - Test color contrast ratios
   - Test focus indicators

## Implementation Notes

### Performance Considerations
- Use `memo` for component optimization
- Debounce rapid boolean state changes
- Minimize re-renders with proper dependency arrays
- Use refs for stable references

### Accessibility Features
- ARIA labels for boolean states
- Screen reader announcements for state changes
- High contrast color indicators
- Keyboard navigation support

### Theme Integration
- Use CSS custom properties for colors
- Support light/dark mode automatically
- Follow existing node theming patterns
- Maintain visual consistency with other view nodes

### Future Enhancements
- Custom true/false labels
- Animation transitions between states
- Historical state tracking
- Export boolean state data
- Custom color themes for different boolean contexts