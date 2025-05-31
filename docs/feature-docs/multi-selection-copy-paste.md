# Multi-Selection Copy & Paste Documentation

## 🎯 Overview

The Multi-Selection Copy & Paste feature allows users to duplicate multiple nodes and their connections simultaneously. This feature works seamlessly with the multi-selection system to provide powerful workflow duplication capabilities.

## ✨ User Features

### 🔄 Copy Operations

#### **Copy Selected Elements** (`Ctrl+C` / `Cmd+C`)
- **What it copies**: All currently selected nodes and edges
- **Smart edge detection**: Automatically includes connections between selected nodes (even if edges aren't explicitly selected)
- **Relative positioning**: Preserves the spatial relationships between copied elements
- **Visual feedback**: Console log confirms how many elements were copied

#### **Copy Behavior Examples**
```
✅ Copy 3 selected nodes → Gets all 3 nodes + any edges between them
✅ Copy nodes + edges → Gets explicit selection + implicit connections  
✅ Copy single node → Works with existing single-node copy functionality
```

### 📋 Paste Operations

#### **Smart Paste** (`Ctrl+V` / `Cmd+V`)
- **Mouse-aware positioning**: Pastes elements at current mouse cursor location
- **Relative layout preserved**: Maintains the original spatial relationships
- **Unique ID generation**: Creates new unique IDs for all pasted elements
- **Clean state**: Pasted elements start unselected and with clean state

#### **Paste Behavior Examples**
```
✅ Mouse at (100,100) → Pastes group centered around that position
✅ Mouse at (500,200) → Same group layout, different location
✅ No mouse tracking → Falls back to offset paste (40px right, 40px down)
```

## 🔧 Technical Implementation

### Architecture Components

#### **1. Enhanced Zustand Store** (`flowStore.ts`)
- **`copiedNodes`** & **`copiedEdges`** state arrays
- **`copySelectedNodes()`** - Updated for ReactFlow multi-selection
- **`pasteNodesAtPosition(position?)`** - Smart positioning paste function

#### **2. Multi-Selection Copy/Paste Hook** (`useMultiSelectionCopyPaste.ts`)
- **ReactFlow integration**: Uses `useReactFlow()` for selection access
- **Mouse tracking**: Global mouse position monitoring
- **Smart edge detection**: Finds connections between selected nodes
- **Coordinate conversion**: Screen coordinates → Flow coordinates

#### **3. FlowEditor Integration**
- **Hook usage**: Integrates multi-selection copy/paste hook
- **Mouse tracking**: Automatic installation of mouse event listeners
- **Keyboard shortcuts**: Updated to use new copy/paste functions

### Key Technical Features

#### **Smart Edge Handling**
```typescript
// Copies explicitly selected edges
const selectedEdges = edges.filter(edge => edge.selected);

// Also finds edges between selected nodes (even if not selected)
const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
const edgesBetweenSelectedNodes = edges.filter(edge => 
  selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
);
```

#### **Intelligent Positioning**
```typescript
// Calculates center of copied elements
const centerX = (bounds.minX + bounds.maxX) / 2;
const centerY = (bounds.minY + bounds.maxY) / 2;

// Pastes relative to mouse position
const flowPosition = reactFlow.screenToFlowPosition({
  x: mousePosition.x,
  y: mousePosition.y
});
```

#### **Unique ID Generation**
```typescript
// Generates guaranteed unique IDs
const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Maps old IDs to new IDs for edge updates
const nodeIdMap = new Map<string, string>();
```

## 🎯 User Experience

### **Workflow Example**
1. **Select multiple nodes**: Use Shift+drag or Ctrl+click to select several nodes
2. **Copy**: Press `Ctrl+C` - sees console log: "Copied 3 nodes and 2 edges"
3. **Position mouse**: Move mouse to desired paste location
4. **Paste**: Press `Ctrl+V` - nodes appear at mouse location with preserved layout
5. **Result**: New node group with unique IDs, ready for independent editing

### **Benefits**
- **Rapid prototyping**: Quickly duplicate common node patterns
- **Template creation**: Copy/paste standard workflows
- **Layout preservation**: Maintain carefully designed node arrangements
- **Smart positioning**: Intuitive paste location based on mouse cursor

## 🔄 Integration with Multi-Selection

This feature builds on the existing multi-selection system:

| Selection Method | Copy/Paste Behavior |
|------------------|---------------------|
| **Shift+Drag Selection Box** | Copies all nodes/edges in selection box |
| **Ctrl+Click Multi-Select** | Copies each individually selected element |
| **Mixed Selection** | Copies all selected elements + connections |
| **Single Selection** | Works with existing single-node copy/paste |

## 🚀 Performance Features

- **Efficient mouse tracking**: Lightweight event listener management
- **Smart edge detection**: Only processes necessary edge relationships
- **Batched operations**: Single state update for entire paste operation
- **Memory management**: Automatic cleanup of mouse event listeners

## 🎛️ Configuration

### **Positioning Fallback**
```typescript
// Default offset if mouse tracking unavailable
const DEFAULT_PASTE_OFFSET = { x: 40, y: 40 };
```

### **ID Generation Strategy**
```typescript
// Timestamp + random string for guaranteed uniqueness
const ID_PATTERN = "node-{timestamp}-{random9chars}";
```

## 🧪 Testing Scenarios

### **Basic Copy/Paste**
1. Select 2 nodes → Copy → Paste → Verify 2 new nodes with connections
2. Select nodes + edges → Copy → Paste → Verify explicit edge selection preserved
3. Single node → Copy → Paste → Verify backward compatibility

### **Advanced Positioning**
1. Copy group → Move mouse → Paste → Verify paste at mouse location
2. Copy → Paste multiple times → Verify each paste at current mouse position
3. Copy → Move mouse off-canvas → Paste → Verify fallback positioning

### **Edge Cases**
1. Copy with no selection → Verify no operation
2. Copy nodes without edges → Verify nodes-only copy
3. Copy disconnected nodes → Verify independent node copying

This implementation provides a robust, user-friendly multi-selection copy/paste system that enhances workflow efficiency while maintaining all existing functionality. 