# Multi-Selection Quick Reference Card

## 🎯 Selection Methods

| Action | Windows/Linux | macOS | Result |
|--------|---------------|-------|---------|
| **Selection Box** | `Shift` + Drag | `Shift` + Drag | Select all elements in rectangle |
| **Multi-Click** | `Ctrl` + Click | `Cmd` + Click | Add individual elements to selection |
| **Alternative Multi** | `Shift` + Click | `Shift` + Click | Alternative multi-selection method |
| **Clear Selection** | Click empty area | Click empty area | Deselect all elements |

## ⚡ Bulk Operations

| Action | Shortcut | Description |
|--------|----------|-------------|
| **Move Multiple** | Drag any selected node | All selected nodes move together |
| **Copy Selection** | `Ctrl/Cmd` + `C` | Copy all selected nodes and connections |
| **Paste at Mouse** | `Ctrl/Cmd` + `V` | Paste copied elements at mouse cursor |
| **Delete (Native)** | `Delete` or `Backspace` | Remove all selected elements (ReactFlow native) |
| **Delete (Custom)** | `Ctrl/Cmd` + `Q` | Remove with console feedback |
| **Toggle History** | `Ctrl/Cmd` + `H` | Show/hide action history panel |
| **Toggle Vibe Mode** | `Ctrl/Cmd` + `X` | Enter/exit distraction-free vibe mode |

## 🔄 Copy & Paste Features

| Feature | Behavior |
|---------|----------|
| **Smart Edge Detection** | Automatically includes connections between copied nodes |
| **Mouse-Aware Paste** | Pastes at current mouse cursor location |
| **Unique ID Generation** | Creates new IDs for all pasted elements |
| **Layout Preservation** | Maintains relative positioning of copied elements |
| **Clean State** | Pasted elements start unselected |
| **Multiple Pastes** | Each paste operation uses current mouse position |
| **Fallback Positioning** | 40px offset if mouse tracking unavailable |

## 🗑️ Delete Options

| Method | Trigger | Behavior | Use Case |
|--------|---------|----------|----------|
| **ReactFlow Native** | `Delete` or `Backspace` | Built-in deletion system | Standard workflow, undo/redo integration |
| **Custom Bulk** | `Ctrl/Cmd` + `Q` | Enhanced feedback deletion | When you want detailed operation feedback |
| **Mobile Button** | Tap delete icon | Touch-friendly deletion | Mobile and tablet interfaces |

## 💡 Pro Tips

### **Selection Strategies**
- **Template Creation**: Copy common node patterns for reuse
- **Rapid Prototyping**: Duplicate and modify existing workflows  
- **Precise Positioning**: Move mouse before pasting for exact placement
- **Connection Preservation**: All edges between selected nodes are copied automatically

### **Efficiency Techniques**
- **Batch Operations**: Select multiple nodes for simultaneous modifications
- **Group Movement**: Drag any selected node to move entire group
- **Template Library**: Build reusable patterns with copy/paste
- **Incremental Development**: Copy working sections to build larger flows

## 🎯 Common Workflows

### **Quick Template Creation**
```
1. Design pattern → 2. Shift+drag select → 3. Ctrl+C copy → 4. Position mouse → 5. Ctrl+V paste
```

### **Bulk Editing**
```
1. Ctrl+click nodes → 2. Make changes → 3. All selected nodes updated
```

### **Section Duplication**
```
1. Select section → 2. Copy (Ctrl+C) → 3. Move mouse → 4. Paste (Ctrl+V) → 5. Customize
```

### **Clean Deletion**
```
1. Select unwanted elements → 2. Delete key → 3. Clean removal with edge cleanup
```

## 🔧 Visual Feedback

| State | Visual Indicator |
|-------|------------------|
| **Selected Elements** | Blue highlight border around selected items |
| **Selection Box** | Semi-transparent blue rectangle while dragging |
| **Drag Preview** | All selected elements show movement outline |
| **Active Selection** | Selected elements remain highlighted until cleared |
| **Paste Preview** | Brief highlight on newly pasted elements |

## 🖱️ Mouse Interactions

| Action | Result |
|--------|--------|
| **Click Empty** | Clear all selections |
| **Shift+Drag** | Draw selection box |
| **Ctrl+Click** | Add/remove from selection |
| **Drag Selected** | Move entire group |
| **Right Click** | Context menu (if implemented) |

## ⌨️ Keyboard Combinations

| Combination | Windows/Linux | macOS | Function |
|-------------|---------------|-------|----------|
| **Copy** | `Ctrl` + `C` | `Cmd` + `C` | Copy selection |
| **Paste** | `Ctrl` + `V` | `Cmd` + `V` | Paste at mouse |
| **Delete (Native)** | `Delete` / `Backspace` | `Delete` / `Backspace` | ReactFlow deletion |
| **Delete (Custom)** | `Ctrl` + `Q` | `Cmd` + `Q` | Custom deletion |
| **History** | `Ctrl` + `H` | `Cmd` + `H` | Toggle history panel |
| **Vibe Mode** | `Ctrl` + `X` | `Cmd` + `X` | Toggle vibe mode |

## 🔄 Platform Differences

| Feature | Windows/Linux | macOS | Notes |
|---------|---------------|-------|-------|
| **Multi-Select Key** | `Ctrl` | `Cmd` | Automatic detection |
| **Selection Box** | `Shift` + Drag | `Shift` + Drag | Consistent across platforms |
| **Delete Keys** | `Delete` / `Backspace` | `Delete` / `Backspace` | Native ReactFlow handling |
| **Custom Delete** | `Ctrl` + `Q` | `Cmd` + `Q` | Platform-aware implementation |

## 🚀 Performance Features

- **Optimized Selection**: Efficient handling of large selections
- **Smart Updates**: Only updates when selection actually changes
- **Memory Management**: Automatic cleanup of event listeners
- **Batch Operations**: Single state update for multiple changes
- **Mouse Tracking**: Lightweight position monitoring

## 🔧 Integration Features

- **Undo/Redo**: Full integration with history system
- **State Persistence**: Selection state maintained during operations
- **ReactFlow Native**: Leverages ReactFlow's optimized systems
- **Cross-Component**: Works seamlessly with node inspector and other features

---

*For detailed documentation, see [Multi-Selection Feature Guide](./multi-selection.md)* 