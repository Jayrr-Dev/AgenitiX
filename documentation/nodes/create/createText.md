# createText Node Documentation

## Overview

**Node Type**: `createText`  
**Domain**: create  
**Category**: CREATE  
**Display Name**: createText

The createText node provides functionality for create operations in the CREATE category.

## Node Specification

### Size Configuration
- **Expanded Size**: 120×120px (Default expanded)
- **Collapsed Size**: 60×60px (Standard collapsed)
- **Dimensions**: 120×120 (expanded) / 60×60 (collapsed)

### Version Information
- **Schema Version**: 1
- **Runtime Version**: createText_execute_v1

### Memory Configuration

- **Memory Enabled**: ❌ No
- **Memory System**: Not configured


### Controls Configuration

- **Auto-Generate Controls**: ✅ Yes
- **Excluded Fields**: isActive
- **Custom Fields**: None


### Data Schema

- **text** (string) - Required
- **isActive** (boolean) - Required
- **isExpanded** (boolean) - Required


## Theming & Design System

### Design Tokens
- **Background**: `var(--node-create-bg)`
- **Border**: `var(--node-create-border)`
- **Text**: `var(--node-node-text)`
- **Text Secondary**: `var(--node-node-text-secondary)`
- **Hover**: `var(--node-create-hover)`
- **Selected**: `var(--node-create-selected)`
- **Error**: `var(--node-create-error)`

### Responsive Design
- **Mobile Optimized**: ❌ No
- **Tablet Optimized**: ❌ No
- **Desktop Optimized**: ✅ Yes

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
- **Category**: CREATE
- **Folder**: create
- **Order**: 1

### Inspector Integration
- **Status**: ✅ Integrated
- **Inspector Key**: `createTextInspector`
- **Has Controls**: ✅ Yes
- **Control Types**: text, textarea, boolean, number, select

## Node Interface

### Inputs
- **json-input** (JSON) - Input data in JSON format [top]
- **activate** (boolean) - Activation signal [left]

### Outputs
- **output** (string) - Processed output data [right]

## Usage Examples

### Basic Usage

Create a basic instance of the node

```typescript
const node = {
  id: 'createText-1',
  type: 'createText',
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
  kind: "createText",
  displayName: "createText",
  category: "CREATE",
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "createText_execute_v1" },
  
  // ... additional configuration
};
```

### Data Schema
```typescript
const createTextDataSchema = z.object({
  // Schema definition
});
```

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Sidebar** | ✅ Integrated | Available in CREATE category |
| **Inspector** | ✅ Integrated | Has dynamic controls |
| **Registry** | ✅ Registered | Node is registered in the NodeSpec registry |
| **Flow Engine** | ✅ Available | Node can be used in React Flow |
| **Memory System** | ❌ Not configured | No memory configuration |

## Development Notes

This node follows the modern NodeSpec architecture and integrates with:
- **Sidebar System**: Available for drag-and-drop creation
- **Inspector System**: Has dynamic controls in Node Inspector
- **Theming System**: Uses category-based theming (CREATE)
- **Validation System**: Schema-driven validation with Zod
- **Memory System**: Not configured
