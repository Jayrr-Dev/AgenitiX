# View Text Node Documentation

## Overview

**Node Type**: `viewText`  
**Domain**: view  
**Category**: VIEW  
**Display Name**: View Text
**Icon**: LuFileText
**Author**: Agenitix Team
**Feature**: base

The View Text node provides functionality for view operations in the VIEW category.

## Node Specification

### Size Configuration
- **Expanded Size**: 120×120px (Default expanded)
- **Collapsed Size**: 60×60px (Standard collapsed)
- **Dimensions**: 120×120 (expanded) / 60×60 (collapsed)

### Version Information
- **Schema Version**: 1
- **Runtime Version**: viewText_execute_v1

### Memory Configuration

- **Memory Enabled**: ❌ No
- **Memory System**: Not configured


### Controls Configuration

- **Auto-Generate Controls**: ✅ Yes
- **Excluded Fields**: isActive, receivedData
- **Custom Fields**: None


### Data Schema




## Theming & Design System

### Design Tokens
- **Background**: `var(--node-view-bg)`
- **Border**: `var(--node-view-border)`
- **Text**: `var(--node-node-text)`
- **Text Secondary**: `var(--node-node-text-secondary)`
- **Hover**: `var(--node-view-hover)`
- **Selected**: `var(--node-view-selected)`
- **Error**: `var(--node-view-error)`

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
- **Disabled State**: ❌ Not Supported

## Infrastructure Integration

### Sidebar Integration
- **Status**: ✅ Integrated
- **Category**: VIEW
- **Folder**: view
- **Order**: 1

### Inspector Integration
- **Status**: ✅ Integrated
- **Inspector Key**: `viewTextInspector`
- **Has Controls**: ✅ Yes
- **Control Types**: text, textarea, boolean, number, select

## Node Interface

### Inputs
- **json-input** (JSON) - Input JSON data [top]
- **activate** (String) - Input String data [left]

### Outputs
- **output** (String) - Output String data [right]

## Usage Examples

### Basic Usage

Create a basic instance of the node

```typescript
const node = {
  id: 'viewText-1',
  type: 'viewText',
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
  kind: "viewText",
  displayName: "View Text",
  category: "VIEW",
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "viewText_execute_v1" },
  
  // ... additional configuration
};
```

### Data Schema
```typescript
const View TextDataSchema = z.object({
  // Schema definition
});
```

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Sidebar** | ✅ Integrated | Available in VIEW category |
| **Inspector** | ✅ Integrated | Has dynamic controls |
| **Registry** | ✅ Registered | Node is registered in the NodeSpec registry |
| **Flow Engine** | ✅ Available | Node can be used in React Flow |
| **Memory System** | ❌ Not configured | No memory configuration |

## Development Notes

This node follows the modern NodeSpec architecture and integrates with:
- **Sidebar System**: Available for drag-and-drop creation
- **Inspector System**: Has dynamic controls in Node Inspector
- **Theming System**: Uses category-based theming (VIEW)
- **Validation System**: Schema-driven validation with Zod
- **Memory System**: Not configured
