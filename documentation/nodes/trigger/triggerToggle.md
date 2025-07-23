# triggerToggle Node Documentation

## Overview

**Node Type**: `triggerToggle`  
**Domain**: trigger  
**Category**: TRIGGER  
**Display Name**: triggerToggle
**Icon**: LuZap
**Author**: Agenitix Team
**Feature**: base
**Tags**: toggle button

The triggerToggle node provides functionality for trigger operations in the TRIGGER category.

## Node Specification

### Size Configuration
- **Expanded Size**: 120×120px (Default expanded)
- **Collapsed Size**: 60×60px (Standard collapsed)
- **Dimensions**: 120×120 (expanded) / 60×60 (collapsed)

### Version Information
- **Schema Version**: 1
- **Runtime Version**: triggerToggle_execute_v1

### Memory Configuration

- **Memory Enabled**: ❌ No
- **Memory System**: Not configured


### Controls Configuration

- **Auto-Generate Controls**: ✅ Yes
- **Excluded Fields**: isActive, inputs, outputs, expandedSize, collapsedSize, 
- **Custom Fields**: None


### Data Schema




## Theming & Design System

### Design Tokens
- **Background**: `var(--node-trigger-bg)`
- **Border**: `var(--node-trigger-border)`
- **Text**: `var(--node-trigger-text)`
- **Text Secondary**: `var(--node-trigger-text-secondary)`
- **Hover**: `var(--node-trigger-hover)`
- **Selected**: `var(--node-trigger-selected)`
- **Error**: `var(--node-trigger-error)`

### Responsive Design
- **Mobile Optimized**: ❌ No
- **Tablet Optimized**: ❌ No
- **Desktop Optimized**: ❌ No

### Accessibility Features
- **Keyboard Support**: ❌ No
- **Screen Reader Support**: ❌ No
- **Focus Management**: ✅ Yes
- **ARIA Labels**: None

### Visual States
- **Hover State**: ❌ Not Supported
- **Selected State**: ❌ Not Supported
- **Active State**: ✅ Supported
- **Error State**: ✅ Supported
- **Disabled State**: ✅ Supported

## Infrastructure Integration

### Sidebar Integration
- **Status**: ✅ Integrated
- **Category**: TRIGGER
- **Folder**: trigger
- **Order**: 1

### Inspector Integration
- **Status**: ✅ Integrated
- **Inspector Key**: `triggerToggleInspector`
- **Has Controls**: ✅ Yes
- **Control Types**: text, textarea, boolean, number, select

## Node Interface

### Inputs
- **json-input** (JSON) - Input JSON data [top]
- **input** (Boolean) - Input Boolean data [left]

### Outputs
- **output** (String) - Output String data [right]

## Usage Examples

### Basic Usage

Create a basic instance of the node

```typescript
const node = {
  id: 'triggerToggle-1',
  type: 'triggerToggle',
  data: {
    // Your node data here
  }
};
```


## Related Nodes



## Technical Details

### NodeSpec Configuration
```typescript
const spec: NodeSpec = {
  kind: "triggerToggle",
  displayName: "triggerToggle",
  category: "TRIGGER",
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "triggerToggle_execute_v1" },
  
  // ... additional configuration
};
```

### Data Schema
```typescript
const triggerToggleDataSchema = z.object({
  // Schema definition
});
```

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Sidebar** | ✅ Integrated | Available in TRIGGER category |
| **Inspector** | ✅ Integrated | Has dynamic controls |
| **Registry** | ✅ Registered | Node is registered in the NodeSpec registry |
| **Flow Engine** | ✅ Available | Node can be used in React Flow |
| **Memory System** | ❌ Not configured | No memory configuration |

## Development Notes

This node follows the modern NodeSpec architecture and integrates with:
- **Sidebar System**: Available for drag-and-drop creation
- **Inspector System**: Has dynamic controls in Node Inspector
- **Theming System**: Uses category-based theming (TRIGGER)
- **Validation System**: Schema-driven validation with Zod
- **Memory System**: Not configured
