# aiAgent Node Documentation

## Overview

**Node Type**: `aiAgent`  
**Domain**: ai  
**Category**: AI  
**Display Name**: aiAgent
**Icon**: LuBot
**Author**: Agenitix Team
**Feature**: ai
**Tags**: ai, aiAgent

The aiAgent node provides functionality for ai operations in the AI category.

## Node Specification

### Size Configuration
- **Expanded Size**: 120×120px (Default expanded)
- **Collapsed Size**: 60×60px (Standard collapsed)
- **Dimensions**: 120×120 (expanded) / 60×60 (collapsed)

### Version Information
- **Schema Version**: 1
- **Runtime Version**: aiAgent_execute_v1

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
- **Background**: `var(--node-ai-bg)`
- **Border**: `var(--node-ai-border)`
- **Text**: `var(--node-ai-text)`
- **Text Secondary**: `var(--node-ai-text-secondary)`
- **Hover**: `var(--node-ai-hover)`
- **Selected**: `var(--node-ai-selected)`
- **Error**: `var(--node-ai-error)`

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
- **Category**: AI
- **Folder**: ai
- **Order**: 1

### Inspector Integration
- **Status**: ✅ Integrated
- **Inspector Key**: `aiAgentInspector`
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
  id: 'aiAgent-1',
  type: 'aiAgent',
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
  kind: "aiAgent",
  displayName: "aiAgent",
  category: "AI",
  size: {
    expanded: { width: 120, height: 120 },
    collapsed: { width: 60, height: 60 }
  },
  version: 1,
  runtime: { execute: "aiAgent_execute_v1" },
  
  // ... additional configuration
};
```

### Data Schema
```typescript
const aiAgentDataSchema = z.object({
  // Schema definition
});
```

## Integration Status

| Component | Status | Details |
|-----------|--------|---------|
| **Sidebar** | ✅ Integrated | Available in AI category |
| **Inspector** | ✅ Integrated | Has dynamic controls |
| **Registry** | ✅ Registered | Node is registered in the NodeSpec registry |
| **Flow Engine** | ✅ Available | Node can be used in React Flow |
| **Memory System** | ❌ Not configured | No memory configuration |

## Development Notes

This node follows the modern NodeSpec architecture and integrates with:
- **Sidebar System**: Available for drag-and-drop creation
- **Inspector System**: Has dynamic controls in Node Inspector
- **Theming System**: Uses category-based theming (AI)
- **Validation System**: Schema-driven validation with Zod
- **Memory System**: Not configured
