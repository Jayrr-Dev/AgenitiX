# Comment Header Guide for Infrastructure Files

**🎯 Purpose:** Standardized comment headers for immediate understanding of file functionality and improved code readability.

**📁 Location:** Applied across `features/business-logic-modern/infrastructure/`

---

## 📋 Summary of Files Updated with Comment Headers

I've added consistent 5-bullet-point comment headers with keywords to **19 infrastructure files** across the business logic modern system:

### **🏗️ Core Infrastructure Files**

1. **FlowEditor.tsx** - Main orchestrator component for workflow editor
2. **FlowCanvas.tsx** - Interactive canvas for node-based workflow editing
3. **EnhancedNodeRegistry.ts** - Centralized node registration system
4. **flow-engine/index.ts** - Central export point for flow engine

### **🏪 State Management (Zustand Stores)**

5. **flowStore.ts** - Main state management for workflow editor
6. **nodeStyleStore.ts** - Visual theming and styling for nodes
7. **vibeModeStore.ts** - UI enhancement toggle state management

### **🔧 Utility Files**

8. **nodeUtils.ts** - Common functions for safe node data handling
9. **timerCleanup.ts** - Timer cleanup utility preventing memory leaks
10. **memoryCleanup.ts** - Comprehensive memory leak prevention system

### **🧩 Component Files**

11. **ActionToolbar.tsx** - Main toolbar for workflow editor actions
12. **Sidebar.tsx** - Node creation and management panel
13. **DebugTool.tsx** - Development utility for clearing application state
14. **NodeInspector.tsx** - Re-export wrapper for modular node inspector
15. **UndoRedoContext.tsx** - React context for undo/redo functionality
16. **UndoRedoManager.tsx** - Complete undo/redo system for workflow editor
17. **HistoryPanel.tsx** - Visual timeline of workflow editor actions
18. **StencilInfoPanel.tsx** - Hover information display for node stencils

### **🏭 Factory System**

19. **RefactoredNodeFactory.tsx** - Enterprise-grade node creation system

---

## 📝 Comment Header Format

Each file follows this consistent structure:

```typescript
/**
 * [COMPONENT NAME] - Brief description of purpose
 *
 * • First key functionality point
 * • Second key functionality point
 * • Third key functionality point
 * • Fourth key functionality point
 * • Fifth key functionality point
 *
 * Keywords: keyword1, keyword2, keyword3, keyword4, keyword5, keyword6
 */
```

### **🎯 Format Guidelines:**

- **Title**: All caps component name + concise description
- **Bullets**: Exactly 5 points covering core functionality
- **Keywords**: 4-6 technical terms for quick reference
- **Conciseness**: Each bullet point stays under one line
- **Consistency**: Same format across all files

---

## 📂 File Categories & Examples

### **🏗️ Core Infrastructure Example:**

```typescript
/**
 * FLOW EDITOR - Complete visual workflow editor application
 *
 * • Main orchestrator component for node-based workflow creation
 * • Integrates sidebar, canvas, inspector, history, and debug tools
 * • Handles state management with Zustand and ReactFlow providers
 * • Manages keyboard shortcuts, drag-drop, copy-paste functionality
 * • Provides undo-redo, multi-selection, and responsive design
 *
 * Keywords: ReactFlow, Zustand, workflow-editor, state-management, providers, keyboard-shortcuts
 */
```

## 🔍 Quick Reference by Keywords

### **State Management:**

- `Zustand` → flowStore.ts, nodeStyleStore.ts, vibeModeStore.ts
- `state-management` → flowStore.ts, UndoRedoManager.tsx

### **Node Operations:**

- `nodes` → flowStore.ts, FlowCanvas.tsx, nodeUtils.ts
- `node-creation` → Sidebar.tsx, RefactoredNodeFactory.tsx
- `node-lifecycle` → timerCleanup.ts

### **UI Components:**

- `toolbar` → ActionToolbar.tsx
- `panel` → HistoryPanel.tsx, StencilInfoPanel.tsx
- `canvas` → FlowCanvas.tsx

### **Memory Management:**

- `memory-leaks` → timerCleanup.ts, memoryCleanup.ts
- `cleanup` → timerCleanup.ts, memoryCleanup.ts

### **User Interactions:**

- `undo-redo` → UndoRedoManager.tsx, HistoryPanel.tsx, ActionToolbar.tsx
- `drag-drop` → FlowCanvas.tsx, Sidebar.tsx
- `keyboard-shortcuts` → FlowEditor.tsx, ActionToolbar.tsx

## 📍 File Locations

All documented files are located in:

```
features/business-logic-modern/infrastructure/
├── flow-engine/
│   ├── FlowEditor.tsx ✅
│   ├── index.ts ✅
│   └── flow-editor/
│       └── components/
│           └── FlowCanvas.tsx ✅
├── node-registries/
│   └── EnhancedNodeRegistry.ts ✅
├── theming/
│   └── stores/
│       ├── flowStore.ts ✅
│       ├── nodeStyleStore.ts ✅
│       └── vibeModeStore.ts ✅
├── node-creation/
│   ├── utils/
│   │   ├── nodeUtils.ts ✅
│   │   ├── timerCleanup.ts ✅
│   │   └── memoryCleanup.ts ✅
│   ├── components/
│   │   ├── ActionToolbar.tsx ✅
│   │   ├── Sidebar.tsx ✅
│   │   ├── DebugTool.tsx ✅
│   │   ├── NodeInspector.tsx ✅
│   │   ├── UndoRedoContext.tsx ✅
│   │   ├── UndoRedoManager.tsx ✅
│   │   ├── HistoryPanel.tsx ✅
│   │   └── StencilInfoPanel.tsx ✅
│   └── factory/
│       └── RefactoredNodeFactory.tsx ✅
```
