# Node Creation Guide

## 📐 Node Unit System

### Standard Node Units
- **1 Node Unit** = 60px × 60px
- **Standard Text Node** = 2×1 units (120px × 60px) collapsed

### Sizing Standards

#### **Collapsed State**
- **Text-based nodes**: `w-[120px] h-[60px]` (2×1 node units)
- **Logic/trigger nodes**: `w-[60px] h-[60px]` (1×1 node unit)
- **Complex nodes**: `w-[120px] h-[120px]` (2×2 node units)

#### **Expanded State**
- **Text-based nodes**: `w-[180px]` (3 node units wide, auto height)
- **Complex nodes**: `w-[220px]` (3.67 node units wide)

## 🎨 Styling System

### Category-Based Styling with nodeStyleStore

The `nodeStyleStore` provides automatic styling based on node categories:

```typescript
// Categories available
type NodeCategory = 'create' | 'logic' | 'trigger' | 'test' | 'turn' | 'count' | 'delay' | 'edit' | 'cycle'

// Auto-styling hooks
const categoryBaseClasses = useNodeCategoryBaseClasses('createText')
const categoryButtonTheme = useNodeCategoryButtonTheme('createText', !!error, isActive)
const categoryTextTheme = useNodeCategoryTextTheme('createText', !!error)
```

### Standard Container Styling

```typescript
// Main container classes
className={`relative ${
  showUI 
    ? 'px-4 py-3 w-[180px]' 
    : 'w-[120px] h-[60px] flex items-center justify-center'
} rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}
```

### Margins & Padding Standards

- **Container padding (expanded)**: `px-4 py-3` (16px horizontal, 12px vertical)
- **Inner content**: `mb-2` (8px bottom margin between sections)
- **Text content padding**: `px-3 py-2` (12px horizontal, 8px vertical)
- **Button spacing**: `top-1 left-1` (4px from edges)

### Text Size Standards

- **Node titles**: `text-xs font-semibold` (12px, bold)
- **Content text**: `text-xs` (12px, normal)
- **Preview text**: `text-xs` (12px, normal)
- **Helper text**: `text-xs` (12px, normal, often with opacity)

## 🛡️ Robust Error Management

### Error Recovery Pattern

```typescript
// Error state management
const [error, setError] = useState<string | null>(null)
const [isRecovering, setIsRecovering] = useState(false)

// Error recovery function
const recoverFromError = () => {
  try {
    setIsRecovering(true)
    setError(null)
    // Reset to safe defaults
    updateNodeData(id, { 
      // Reset critical properties
      error: null
    })
    setTimeout(() => setIsRecovering(false), 1000)
  } catch (recoveryError) {
    console.error(`${nodeType} ${id} - Recovery failed:`, recoveryError)
    setError('Recovery failed. Please refresh.')
    setIsRecovering(false)
  }
}
```

### Error Recovery Button

```typescript
{error && (
  <button
    onClick={recoverFromError}
    disabled={isRecovering}
    className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-xs rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
    title={`Error: ${error}. Click to recover.`}
    aria-label="Recover from error"
  >
    {isRecovering ? '⟳' : '!'}
  </button>
)}
```

### Safe Data Handling

```typescript
// Safe text handling example
const currentText = (() => {
  try {
    return typeof data.heldText === 'string' ? data.heldText : ''
  } catch (textError) {
    console.error(`${nodeType} ${id} - Text access error:`, textError)
    setError('Text access error')
    return ''
  }
})()
```

## 🔘 Standard Components

### ExpandCollapseButton

```typescript
import { ExpandCollapseButton } from '../components/ExpandCollapseButton'

// Usage
<ExpandCollapseButton
  showUI={showUI}
  onToggle={() => setShowUI((v) => !v)}
  className={`${error ? buttonTheme : isActive ? buttonTheme : categoryButtonTheme}`}
/>
```

### FloatingNodeId

```typescript
import { FloatingNodeId } from '../components/FloatingNodeId'

// Usage (always first after container)
<FloatingNodeId nodeId={id} />
```

### CustomHandle

```typescript
import CustomHandle from '../../handles/CustomHandle'

// Input handle
<CustomHandle type="target" position={Position.Left} id="b" dataType="b" />

// Output handle  
<CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
```

## 🚀 Node Structure Template

### Required Imports

```typescript
'use client'
import { memo, useEffect, useState, useRef } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'

// Store and utilities
import { useFlowStore } from '../../stores/flowStore'
import CustomHandle from '../../handles/CustomHandle'
import { FloatingNodeId } from '../components/FloatingNodeId'
import { ExpandCollapseButton } from '../components/ExpandCollapseButton'

// Styling hooks
import { 
  useNodeStyleClasses, 
  useNodeButtonTheme, 
  useNodeTextTheme,
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme
} from '../../stores/nodeStyleStore'
```

### Node Interface

```typescript
interface YourNodeData {
  // Define your node's data structure
  text?: string;
  value?: any;
  error?: string;
}
```

### Component Structure

```typescript
function YourNode({ id, data, selected }: NodeProps<Node<YourNodeData & Record<string, unknown>>>) {
  // 1. Store and state
  const updateNodeData = useFlowStore((state) => state.updateNodeData)
  const [showUI, setShowUI] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRecovering, setIsRecovering] = useState(false)

  // 2. Error recovery function
  const recoverFromError = () => { /* ... */ }

  // 3. Connection handling
  const connections = useNodeConnections({ handleType: 'target' })
  // ... connection logic

  // 4. Data processing with error handling
  useEffect(() => {
    try {
      // ... your node logic
      updateNodeData(id, { /* results */ })
    } catch (error) {
      // ... error handling
    }
  }, [/* dependencies */])

  // 5. Styling
  const nodeStyleClasses = useNodeStyleClasses(!!selected, !!error, false)
  const buttonTheme = useNodeButtonTheme(!!error, false)
  const textTheme = useNodeTextTheme(!!error)
  const categoryBaseClasses = useNodeCategoryBaseClasses('yourNodeType')
  const categoryButtonTheme = useNodeCategoryButtonTheme('yourNodeType', !!error, false)
  const categoryTextTheme = useNodeCategoryTextTheme('yourNodeType', !!error)

  // 6. Render
  return (
    <div className={`relative ${showUI ? 'px-4 py-3 w-[180px]' : 'w-[120px] h-[60px] flex items-center justify-center'} rounded-lg ${categoryBaseClasses.background} shadow border ${categoryBaseClasses.border} ${nodeStyleClasses}`}>
      
      {/* Error Recovery Button */}
      {error && (
        <button /* ... recovery button */ />
      )}
      
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
      
      {/* Expand/Collapse Button */}
      <ExpandCollapseButton
        showUI={showUI}
        onToggle={() => setShowUI((v) => !v)}
        className={`${error ? buttonTheme : isActive ? buttonTheme : categoryButtonTheme}`}
      />

      {/* Handles */}
      <CustomHandle type="target" position={Position.Left} id="input" dataType="s" />
      
      {/* Collapsed State */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          {/* ... collapsed content */}
        </div>
      )}

      {/* Expanded State */}
      {showUI && (
        <div className="flex text-xs flex-col w-auto">
          {/* ... expanded content */}
        </div>
      )}

      {/* Output Handle */}
      <CustomHandle type="source" position={Position.Right} id="output" dataType="s" />
    </div>
  )
}

export default memo(YourNode)
```

## 🛠️ Interactive Elements

### nodrag/nowheel Classes

For interactive elements inside nodes:

```typescript
// For text areas, inputs, and other interactive elements
<div 
  className="nodrag nowheel w-full"
  onMouseDown={(e) => e.stopPropagation()}
  onTouchStart={(e) => e.stopPropagation()}
>
  <textarea
    className="w-full"
    onWheel={(e) => e.stopPropagation()}
  />
</div>
```

## 📋 Registration Checklist

1. **✅ Create node component** in `nodes/category/YourNodeName.tsx`
2. **✅ Add type definitions** in `flow-editor/types/index.ts`
3. **✅ Register configuration** in `flow-editor/constants/index.ts` 
4. **✅ Register in FlowCanvas** in `flow-editor/components/FlowCanvas.tsx`
5. **✅ Add to sidebar** in `components/sidebar/constants.ts`
6. **✅ Add controls** in `components/node-inspector/components/NodeControls.tsx`
7. **✅ Add to category mapping** in `stores/nodeStyleStore.ts`

## 🎯 Best Practices

- **Always use memo()** for performance
- **Handle errors gracefully** with recovery options
- **Use consistent sizing** based on node units
- **Follow the category theming** system
- **Include proper TypeScript types**
- **Add accessibility labels** for screen readers
- **Use nodrag/nowheel** for interactive elements
- **Test with different themes** (light/dark mode)

## 🚨 Common Pitfalls

- **Missing error boundaries** - Always wrap risky operations in try/catch
- **Forgetting nodrag classes** - Interactive elements will interfere with node dragging
- **Incorrect sizing** - Stick to the node unit system
- **Missing dependencies** - Include all reactive values in useEffect dependencies
- **Type mismatches** - Ensure data types match handle types
- **Performance issues** - Use memo and proper dependency arrays 