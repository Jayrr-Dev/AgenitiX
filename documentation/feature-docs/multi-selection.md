# Multi-Selection Feature Documentation

## 🎯 Overview

The Multi-Selection feature provides a comprehensive set of tools for selecting and manipulating multiple nodes and edges simultaneously in the ReactFlow editor. This feature significantly improves workflow efficiency by enabling bulk operations, template creation, and rapid prototyping.

## ✨ Complete Feature Set

### 🎯 **Selection Methods**

#### **1. Selection Box (Shift + Drag)**
- **Action**: Hold `Shift` and drag to draw a selection rectangle
- **Result**: Selects all nodes and edges within or partially overlapping the rectangle
- **Visual**: Semi-transparent blue selection box while dragging
- **Use Case**: Quickly select multiple elements in a specific area

#### **2. Multi-Click Selection (Ctrl/Cmd + Click)**
- **Action**: Hold `Ctrl` (Windows/Linux) or `Cmd` (Mac) and click individual elements
- **Result**: Adds elements to the current selection without clearing previous selections
- **Visual**: Blue highlight border around each selected element
- **Use Case**: Precisely select specific nodes/edges across the canvas

#### **3. Alternative Multi-Selection (Shift + Click)**
- **Action**: Hold `Shift` and click individual elements
- **Result**: Alternative method for multi-selection
- **Cross-Platform**: Works consistently across all platforms
- **Use Case**: Additional option for users preferring Shift over Ctrl/Cmd

### 🔄 **Copy & Paste Operations**

#### **Enhanced Copy (Ctrl+C / Cmd+C)**
- **What it copies**: 
  - All currently selected nodes with their complete data
  - All explicitly selected edges
  - **Smart edge detection**: Automatically includes connections between selected nodes (even if edges aren't explicitly selected)
  - Preserves relative positioning and relationships
- **Visual feedback**: Console log confirms number of elements copied
- **Memory**: Stores in application clipboard for multiple paste operations

#### **Smart Paste (Ctrl+V / Cmd+V)**
- **Mouse-aware positioning**: Pastes elements at current mouse cursor location
- **Intelligent placement**: Calculates center of copied group and positions relative to mouse
- **Layout preservation**: Maintains exact spatial relationships between elements
- **Unique ID generation**: Creates new unique IDs for all pasted elements
- **Clean state**: Pasted elements start unselected and ready for independent editing
- **Fallback behavior**: If mouse tracking fails, uses standard 40px offset

#### **Copy/Paste Behavior Examples**
```
✅ Copy 3 selected nodes → Gets all 3 nodes + any edges between them
✅ Copy nodes + edges → Gets explicit selection + implicit connections  
✅ Copy single node → Works with existing single-node copy functionality
✅ Mouse at (100,100) → Pastes group centered around that position
✅ Mouse at (500,200) → Same group layout, different location
✅ Multiple pastes → Each paste at current mouse position
✅ No mouse tracking → Falls back to offset paste (40px right, 40px down)
```

### 🗑️ **Delete Operations**

#### **Native ReactFlow Delete (Delete/Backspace)**
- **Action**: Press `Delete` or `Backspace` keys
- **Behavior**: Uses ReactFlow's built-in deletion system
- **Advantages**: Fully integrated with ReactFlow's undo/redo and state management
- **Works with**: Both single and multi-selection

#### **Custom Bulk Delete (Alt+Q)**
- **Action**: Press `Alt+Q` (All platforms)
- **Behavior**: Custom deletion with enhanced feedback
- **Features**: 
  - Console log showing number of deleted elements
  - Works with both nodes and edges
  - Proper cleanup of connected edges when nodes are deleted
- **Use Case**: When you want detailed feedback about deletion operations

#### **Mobile Delete Button**
- **Visibility**: Appears on mobile devices when elements are selected
- **Location**: Top-right corner on mobile interfaces
- **Function**: Touch-friendly delete for mobile users

### 🚀 **Bulk Operations**

#### **Group Movement**
- **Action**: Drag any selected node
- **Result**: All selected nodes move together maintaining relative positions
- **Visual**: All selected elements show movement outline during drag
- **Precision**: Maintains exact spatial relationships

#### **Batch Processing**
- **Template Creation**: Copy common node patterns for reuse
- **Workflow Duplication**: Duplicate entire sections of your flow
- **Bulk Modifications**: Select multiple nodes for simultaneous property changes

## 🔧 Technical Implementation

### **Architecture Overview**

#### **1. ReactFlow Integration**
- **Native Selection**: Uses ReactFlow's built-in selection system
- **Selection Keys**: Platform-specific key detection (Meta vs Control)
- **State Synchronization**: Bridges ReactFlow selection with Zustand store
- **Change Handlers**: Proper integration with ReactFlow's change system

#### **2. Enhanced Zustand Store**
```typescript
// State Management
copiedNodes: AgenNode[];
copiedEdges: AgenEdge[];

// Enhanced Functions
copySelectedNodes() // ReactFlow-aware copying
pasteNodesAtPosition(position?) // Smart positioning paste
```

#### **3. Multi-Selection Copy/Paste Hook**
```typescript
useMultiSelectionCopyPaste() {
  // ReactFlow integration via useReactFlow()
  // Mouse tracking for smart positioning
  // Smart edge detection
  // Coordinate conversion
}
```

#### **4. Keyboard Shortcuts System**
```typescript
useKeyboardShortcuts({
  onCopy: copySelectedElements,
  onPaste: pasteElements,
  onDelete: handleMultiDelete, // Alt+Q
  onToggleHistory: toggleHistoryPanel
})
```

### **Key Technical Features**

#### **Smart Edge Detection**
```typescript
// Copies explicitly selected edges
const selectedEdges = edges.filter(edge => edge.selected);

// Also finds edges between selected nodes (even if not selected)
const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
const edgesBetweenSelectedNodes = edges.filter(edge => 
  selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
);
```

#### **Intelligent Mouse-Aware Positioning**
```typescript
// Calculates center of copied elements
const centerX = (bounds.minX + bounds.maxX) / 2;
const centerY = (bounds.minY + bounds.maxY) / 2;

// Converts screen coordinates to flow coordinates
const flowPosition = reactFlow.screenToFlowPosition({
  x: mousePosition.x,
  y: mousePosition.y
});

// Calculates offset from original center to paste position
const offsetX = pasteX - centerX;
const offsetY = pasteY - centerY;
```

#### **Unique ID Generation Strategy**
```typescript
// Timestamp + random string for guaranteed uniqueness
const newId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Maps old IDs to new IDs for edge updates
const nodeIdMap = new Map<string, string>();
```

## 🎯 Complete User Workflows

### **Workflow 1: Template Creation**
1. **Design Pattern**: Create a useful node pattern (e.g., input → processor → output)
2. **Select Group**: Use Shift+drag to select the entire pattern
3. **Copy Template**: Press `Ctrl+C` - see "Copied 3 nodes and 2 edges"
4. **Position Cursor**: Move mouse to desired location
5. **Paste Template**: Press `Ctrl+V` - pattern appears at mouse location
6. **Customize**: Modify the new nodes independently

### **Workflow 2: Bulk Operations**
1. **Multi-Select**: Use Ctrl+click to select specific nodes across the canvas
2. **Group Move**: Drag any selected node to move all together
3. **Batch Delete**: Press `Delete` key to remove all selected elements
4. **Alternative Delete**: Use `Alt+Q` for deletion with console feedback

### **Workflow 3: Rapid Prototyping**
1. **Create Base**: Build initial flow section
2. **Duplicate**: Select and copy (`Ctrl+C`) the working section
3. **Iterate**: Paste (`Ctrl+V`) multiple times at different locations
4. **Modify**: Adjust each copy for different use cases
5. **Refine**: Use multi-selection to make bulk adjustments

## 🚀 Performance & Optimization

### **Efficient Operations**
- **Mouse Tracking**: Lightweight event listener management
- **Smart Edge Detection**: Only processes necessary relationships
- **Batched Updates**: Single state update for entire operations
- **Memory Management**: Automatic cleanup of event listeners
- **Change Optimization**: Uses ReactFlow's optimized change handlers

### **Cross-Platform Consistency**
- **Key Detection**: Automatic Mac vs PC key mapping
- **Touch Support**: Mobile-friendly interface adaptations
- **Responsive Design**: Adapts to different screen sizes
- **Browser Compatibility**: Works across modern browsers

## 📊 Feature Comparison

| Feature | Single Selection | Multi-Selection |
|---------|------------------|-----------------|
| **Selection** | Click node/edge | Shift+drag, Ctrl+click |
| **Movement** | Drag individual | Drag group together |
| **Copy/Paste** | Single element | Multiple elements + connections |
| **Deletion** | Individual delete | Bulk delete operations |
| **Feedback** | Basic | Enhanced with counts |
| **Templates** | Manual recreation | Copy/paste patterns |

## 🧪 Testing Scenarios

### **Basic Multi-Selection**
1. **Selection Box**: Shift+drag over multiple nodes → Verify all enclosed nodes selected
2. **Multi-Click**: Ctrl+click several nodes → Verify cumulative selection
3. **Mixed Selection**: Select nodes and edges → Verify both types highlighted

### **Copy/Paste Operations**
1. **Basic Copy/Paste**: Select 2 nodes → Copy → Paste → Verify 2 new nodes with connections
2. **Mouse Positioning**: Copy → Move mouse → Paste → Verify paste at mouse location
3. **Multiple Pastes**: Copy once → Paste multiple times → Verify each at different mouse positions
4. **Edge Preservation**: Copy nodes with connections → Verify all relationships maintained

### **Delete Operations**
1. **Native Delete**: Select multiple → Press Delete → Verify removal
2. **Custom Delete**: Select multiple → Press Alt+Q → Verify removal + console log
3. **Edge Cleanup**: Delete nodes → Verify connected edges also removed

### **Advanced Scenarios**
1. **Large Groups**: Select 10+ nodes → Test all operations
2. **Complex Connections**: Select nodes with multiple edge types → Verify preservation
3. **Cross-Browser**: Test on Chrome, Firefox, Safari, Edge
4. **Mobile**: Test touch interactions on mobile devices

## 🔗 Integration Points

### **With Existing Features**
- **Node Inspector**: Works with multi-selection for batch property editing
- **Undo/Redo**: Integrates with history system for operation reversal
- **Drag & Drop**: Maintains compatibility with sidebar node creation
- **Keyboard Shortcuts**: Extends existing shortcut system

### **With ReactFlow**
- **Selection System**: Fully integrated with ReactFlow's native selection
- **Change Handlers**: Properly handles ReactFlow's change events
- **State Management**: Maintains synchronization with ReactFlow state
- **Performance**: Leverages ReactFlow's optimization strategies

This comprehensive multi-selection system transforms the flow editor into a powerful tool for rapid development, template creation, and efficient workflow management. The combination of intuitive selection methods, smart copy/paste operations, and flexible deletion options provides users with professional-grade editing capabilities.

## 🎮 User Guide

### Basic Multi-Selection Workflow

1. **Start Selection**:
   ```
   Method 1: Shift + Drag to draw selection box
   Method 2: Ctrl/Cmd + Click on first element
   ```

2. **Extend Selection**:
   ```
   Continue Ctrl/Cmd + Click to add more elements
   Or draw additional selection boxes with Shift + Drag
   ```

3. **Perform Operations**:
   ```
   Drag any selected node → Move all selected nodes
   Press Delete/Backspace → Remove all selected elements
   Press Ctrl+Q → Alternative bulk deletion
   ```

4. **Clear Selection**:
   ```
   Click on empty canvas area
   Or select a single element (replaces multi-selection)
   ```

### Platform-Specific Controls

| Platform | Selection Box | Multi-Click | Alternative |
|----------|--------------|-------------|-------------|
| **Windows** | `Shift + Drag` | `Ctrl + Click` | `Shift + Click` |
| **Linux** | `Shift + Drag` | `Ctrl + Click` | `Shift + Click` |
| **macOS** | `Shift + Drag` | `Cmd + Click` | `Shift + Click` |

### Advanced Tips

- **Partial Selection**: Selection box uses `SelectionMode.Partial`, so elements only need to partially overlap
- **Mixed Selection**: Can select both nodes and edges simultaneously
- **Persistent Selection**: Selection persists during drag operations
- **Smart Cleanup**: Deleting nodes automatically removes connected edges

## 🏗️ Technical Implementation

### Architecture Overview

The multi-selection feature uses ReactFlow's native selection system combined with Zustand store synchronization:

```tsx
// ReactFlow handles visual selection
<ReactFlow
  selectionKeyCode="Shift"                    // Selection box key
  multiSelectionKeyCode={[isMac ? "Meta" : "Control", "Shift"]}  // Multi-click keys
  selectionMode={SelectionMode.Partial}       // Partial overlap selection
  // ... other props
/>

// Zustand store tracks selection for business logic
const { selectedNodeId, selectedEdgeId } = useFlowStore();
```

### Key Components

#### **FlowCanvas.tsx**
```tsx
// Platform detection for proper key mapping
const isMac = useMemo(() => {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().includes('MAC');
}, []);

// Selection configuration
const selectionKeys = useMemo(() => ({
  selectionKeyCode: "Shift",
  multiSelectionKeyCode: [isMac ? "Meta" : "Control", "Shift"]
}), [isMac]);
```

#### **FlowEditor.tsx**
```tsx
// Proper change handling with ReactFlow's native system
const handleNodesChange = useCallback((changes: any[]) => {
  // Apply changes to ReactFlow's nodes array first
  const updatedNodes = applyNodeChanges(changes, nodes);
  setNodes(updatedNodes);
  
  // Sync with Zustand store for specific operations
  changes.forEach(change => {
    if (change.type === 'position' && change.position) {
      updateNodePosition(change.id, change.position);
    } else if (change.type === 'remove') {
      removeNode(change.id);
    } else if (change.type === 'select') {
      if (change.selected) {
        selectNode(change.id);
      }
    }
  });
}, [nodes, setNodes, updateNodePosition, removeNode, selectNode]);
```

### State Management

#### **Dual System Architecture**
- **ReactFlow State**: Handles visual selection, dragging, and UI interactions
- **Zustand Store**: Manages business logic, persistence, and component communication
- **Synchronization**: Changes flow from ReactFlow → Zustand for consistency

#### **Selection Tracking**
```tsx
// ReactFlow selection events update Zustand
const handleSelectionChange = useCallback((selection: any) => {
  if (selection.nodes.length > 0) {
    selectNode(selection.nodes[0].id);
  } else if (selection.edges.length > 0) {
    selectEdge(selection.edges[0].id);
  } else {
    clearSelection();
  }
}, [selectNode, selectEdge, clearSelection]);
```

### Change Application System

#### **ReactFlow Integration**
```tsx
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

// Proper change handling prevents ReactFlow errors
const handleNodesChange = useCallback((changes: any[]) => {
  // CRITICAL: Apply to ReactFlow first
  const updatedNodes = applyNodeChanges(changes, nodes);
  setNodes(updatedNodes);
  
  // Then sync specific operations to store
  changes.forEach(change => {
    // Handle position, removal, selection changes
  });
}, [nodes, setNodes, /* ... */]);
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### **"Maximum update depth exceeded" Error**
- **Cause**: Object recreation causing infinite React loops
- **Solution**: Use ReactFlow's native change application system
- **Prevention**: Avoid creating new objects in render cycles

#### **"Node not initialized" Drag Error**
- **Cause**: Not using ReactFlow's `applyNodeChanges`
- **Solution**: Apply changes to ReactFlow state before Zustand sync
- **Code**: Use `applyNodeChanges(changes, nodes)` pattern

#### **Selection Not Syncing**
- **Cause**: Missing `onSelectionChange` handler
- **Solution**: Ensure proper event handler registration
- **Check**: Verify `reactFlowHandlers.onSelectionChange` is connected

#### **Platform-Specific Key Issues**
- **Cause**: Incorrect modifier key detection
- **Solution**: Platform detection with proper fallbacks
- **Code**: Use `navigator.platform` check for Mac vs PC

### Performance Considerations

- **Efficient Change Application**: Only create new objects when state actually changes
- **Optimized Re-renders**: Use `useCallback` and `useMemo` appropriately  
- **Memory Management**: Proper cleanup of selections and event listeners
- **Bulk Operations**: Single state updates for multiple element changes

## 🔧 Configuration Options

### Customizing Selection Behavior

```tsx
// In FlowCanvas.tsx - Modify selection configuration
const selectionKeys = useMemo(() => ({
  selectionKeyCode: "Shift",              // Key for selection box
  multiSelectionKeyCode: ["Control"],     // Keys for multi-click
}), []);

// Selection mode options
selectionMode={SelectionMode.Partial}     // Partial overlap
selectionMode={SelectionMode.Full}        // Full overlap required
```

### Deletion Key Customization

```tsx
// In FlowCanvas.tsx - Configure deletion keys
deleteKeyCode={['Delete', 'Backspace']}   // Native ReactFlow deletion

// In useKeyboardShortcuts.ts - Custom deletion shortcuts
case 'q':  // Alt+Q for bulk deletion
  // Custom deletion logic
  break;
```