# Multi-Selection Feature Documentation

## 🎯 Overview

The Multi-Selection feature enables users to select and manipulate multiple nodes and edges simultaneously in the ReactFlow editor. This feature significantly improves workflow efficiency by allowing bulk operations on flow elements.

## ✨ Features

### Selection Methods

#### 1. **Selection Box (Shift + Drag)**
- **Action**: Hold `Shift` and drag to draw a selection box
- **Result**: Selects all nodes and edges within the drawn rectangle
- **Use Case**: Quickly select multiple elements in a specific area

#### 2. **Multi-Click Selection (Ctrl/Cmd + Click)**
- **Action**: Hold `Ctrl` (Windows/Linux) or `Cmd` (Mac) and click individual nodes/edges
- **Result**: Adds elements to the current selection
- **Use Case**: Precise selection of specific elements across the canvas

#### 3. **Alternative Multi-Click (Shift + Click)**
- **Action**: Hold `Shift` and click individual nodes/edges  
- **Result**: Alternative method for multi-selection
- **Use Case**: Cross-platform compatibility and user preference

### Bulk Operations

#### **Multi-Node Dragging**
- **Action**: Drag any selected node when multiple are selected
- **Result**: All selected nodes move together, maintaining relative positions
- **Visual Feedback**: All selected nodes highlight during drag operation

#### **Bulk Deletion**
- **Delete Key**: Removes all currently selected nodes and edges
- **Backspace Key**: Alternative deletion method  
- **Ctrl+Q**: Custom shortcut for bulk deletion
- **Result**: Simultaneous removal with proper cleanup of connections

#### **Visual Selection Feedback**
- **Selected Elements**: Highlighted with selection border
- **Selection Count**: Visual indication of number of selected items
- **Drag Preview**: All selected elements show movement preview

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
case 'q':  // Ctrl+Q for bulk deletion
  // Custom deletion logic
  break;
```

## 📈 Future Enhancements

### Planned Features
- **Selection Groups**: Save and restore selection sets
- **Selection Filters**: Filter selection by node type or properties  
- **Bulk Editing**: Edit properties of multiple selected nodes simultaneously
- **Selection History**: Undo/redo selection changes
- **Keyboard Navigation**: Arrow keys to modify selection

### Extension Points
- **Custom Selection Logic**: Override selection behavior for specific node types
- **Selection Plugins**: Extensible selection mode system
- **Visual Customization**: Customizable selection appearance and feedback
- **Integration Hooks**: API for external tools to manipulate selections

## 📚 Related Documentation

- [ReactFlow Selection Documentation](https://reactflow.dev/docs/api/react-flow-props/#selection)
- [Keyboard Shortcuts Guide](./keyboard-shortcuts.md)
- [State Management Architecture](../architecture/state-management.md)
- [Node Editor User Guide](./node-editor.md)

---

## ✅ Implementation Checklist

For developers implementing similar features:

- [ ] Configure `selectionKeyCode` and `multiSelectionKeyCode` props
- [ ] Implement platform detection for proper modifier keys
- [ ] Use `applyNodeChanges` and `applyEdgeChanges` for proper state management
- [ ] Set up dual state system (ReactFlow + custom store)
- [ ] Handle `onSelectionChange` events for synchronization
- [ ] Test selection box drawing functionality  
- [ ] Test multi-click selection with modifier keys
- [ ] Verify bulk drag operations work correctly
- [ ] Test deletion shortcuts (Delete, Backspace, custom)
- [ ] Ensure proper cleanup and memory management
- [ ] Add error handling for edge cases
- [ ] Document user-facing functionality
- [ ] Create troubleshooting guides

**Status**: ✅ **Fully Implemented and Tested** 