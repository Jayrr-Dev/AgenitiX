# 🚀 **Complete Node Registration Guide**

Based on the enhanced node registry system, here's the definitive step-by-step process for registering new nodes in the Agenitix flow editor.

## **Overview**

The node registration system provides:
- ✅ **Single-file registration** - All metadata in `nodeRegistry.ts`
- ✅ **Auto-generation** - Types, constants, and inspector mappings
- ✅ **Modular architecture** - Use RefactoredNodeFactory for enhanced features
- ✅ **Error injection support** - Vibe Mode error states
- ✅ **Enterprise features** - Safety layers, GPU acceleration, ultra-fast propagation

---

## **Step 1: Create Your Node Component**

First, create your node component file in the appropriate directory:

```typescript
// features/business-logic/nodes/[category]/YourNewNode.tsx

'use client';

import React from 'react';
import { NodeProps } from '@xyflow/react';
import type { BaseNodeData } from '../factory/types';

// DEFINE YOUR NODE'S DATA INTERFACE
interface YourNodeData extends BaseNodeData {
  customField: string;
  enabled: boolean;
  count: number;
}

// YOUR NODE COMPONENT
const YourNewNode: React.FC<NodeProps<YourNodeData>> = ({ id, data, selected }) => {
  return (
    <div className="your-node-container">
      <h3>Your Node</h3>
      <p>Custom Field: {data.customField}</p>
      <p>Count: {data.count}</p>
    </div>
  );
};

export default YourNewNode;
```

### **Directory Structure**
```
features/business-logic/nodes/
├── main/           # Primary functionality nodes
├── media/          # Text, image, media processing
├── automation/     # Triggers, cycles, timing
├── test/           # Testing and debugging nodes
├── integrations/   # External service connections
├── misc/           # Utility and helper nodes
└── testing/        # Experimental/refactored nodes
```

---

## **Step 2: Register in nodeRegistry.ts**

Add your node to the `ENHANCED_NODE_REGISTRY` object in `features/business-logic/nodes/nodeRegistry.ts`:

```typescript
// 1. Add the import at the top
import YourNewNode from './[category]/YourNewNode';

// 2. Add to the registry object
export const ENHANCED_NODE_REGISTRY: Record<string, EnhancedNodeRegistration> = {
  // ... existing nodes ...
  
  YourNewNode: {
    // ========================================
    // CORE IDENTIFICATION
    // ========================================
    nodeType: 'yourNewNode',
    component: YourNewNode,
    
    // ========================================
    // UI METADATA
    // ========================================
    label: 'Your New Node',
    description: 'Description of what your node does and how to use it.',
    icon: '🆕', // Optional emoji or icon
    
    // ========================================
    // ORGANIZATION
    // ========================================
    category: 'create', // Options: 'create' | 'logic' | 'trigger' | 'test' | 'turn' | 'count' | 'delay' | 'edit' | 'cycle' | 'view'
    folder: 'main',     // Options: 'main' | 'media' | 'automation' | 'test' | 'integrations' | 'misc' | 'testing'
    
    // ========================================
    // TYPE SYSTEM (Auto-generates types)
    // ========================================
    dataInterface: {
      customField: 'string',
      enabled: 'boolean', 
      count: 'number'
    },
    hasTargetPosition: true,
    targetPosition: Position.Top,
    
    // ========================================
    // CONFIGURATION (Auto-generates constants)
    // ========================================
    defaultData: { 
      customField: 'Default Value',
      enabled: true,
      count: 0
    },
    hasOutput: true,
    hasControls: true,
    displayName: 'Your New Node',
    
    // ========================================
    // INSPECTOR CONTROLS (Auto-generates UI)
    // ========================================
    inspectorControls: {
      type: 'factory', // Options: 'factory' | 'legacy' | 'none'
      controlGroups: [
        {
          title: 'Configuration',
          fields: [
            {
              key: 'customField',
              type: 'text',
              label: 'Custom Field',
              placeholder: 'Enter custom value...'
            },
            {
              key: 'enabled',
              type: 'boolean',
              label: 'Enabled'
            },
            {
              key: 'count',
              type: 'number',
              label: 'Count',
              min: 0,
              max: 100,
              step: 1
            }
          ]
        }
      ]
    },
    
    // ========================================
    // OPTIONAL METADATA
    // ========================================
    tags: ['custom', 'example'],
    experimental: false,
    version: '1.0.0'
  }
};
```

### **Inspector Control Types**

| Type | Description | Additional Fields |
|------|-------------|-------------------|
| `text` | Single-line text input | `placeholder` |
| `textarea` | Multi-line text input | `placeholder`, `rows` |
| `number` | Numeric input | `min`, `max`, `step` |
| `boolean` | Checkbox/toggle | - |
| `select` | Dropdown selection | `options: Array<{value, label}>` |
| `range` | Slider input | `min`, `max`, `step` |
| `none` | No inspector controls | - |

---

## **Step 3: Add Error Injection Support (Optional)**

If your node should support error injection from the Error Generator, add it to the constants:

```typescript
// features/business-logic/nodes/factory/constants/index.ts

export const ERROR_INJECTION_SUPPORTED_NODES = [
  'createText', 
  'createTextRefactor',
  'yourNewNode', // Add your node here
  // ... other nodes
] as const;
```

**What Error Injection Provides:**
- 🔴 **Visual error states** - Red glow and error styling
- 🎛️ **Vibe Mode support** - Receive error data from Error Generator
- 🎨 **Error type styling** - Different colors for warning/error/critical
- 🔄 **Auto-clearing** - Errors clear when Error Generator disconnects

---

## **Step 4: Using the RefactoredNodeFactory (Recommended)**

For enhanced functionality and enterprise features, create your node using the RefactoredNodeFactory:

```typescript
// features/business-logic/nodes/[category]/YourAdvancedNode.tsx

import { createNodeComponent } from '../factory/RefactoredNodeFactory';
import type { BaseNodeData } from '../factory/types';

// YOUR DATA INTERFACE WITH ERROR INJECTION SUPPORT
interface YourAdvancedNodeData extends BaseNodeData {
  message: string;
  priority: 'low' | 'medium' | 'high';
  // Error injection properties (optional)
  isErrorState?: boolean;
  errorType?: 'warning' | 'error' | 'critical';
  error?: string;
}

// CREATE WITH FACTORY
export const YourAdvancedNode = createNodeComponent<YourAdvancedNodeData>({
  nodeType: 'yourAdvancedNode',
  category: 'create', // Required category
  displayName: 'Your Advanced Node', // Required display name
  
  // ========================================
  // DEFAULT DATA
  // ========================================
  defaultData: {
    message: '',
    priority: 'medium'
  },
  
  // ========================================
  // PROCESSING LOGIC
  // ========================================
  processLogic: ({ data, connections, nodesData, updateNodeData, id, setError }) => {
    try {
      // Handle error injection
      if (data.isErrorState) {
        setError(data.error || 'Node is in error state');
        return;
      }
      
      // Normal processing
      const processed = `${data.priority.toUpperCase()}: ${data.message}`;
      updateNodeData(id, { processedMessage: processed });
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Processing error');
    }
  },
  
  // ========================================
  // HANDLE CONFIGURATION
  // ========================================
  handles: [
    { type: 'target', position: Position.Top, dataType: 's', id: 'input' },
    { type: 'target', position: Position.Left, dataType: 'j', id: 'json' }, // For error injection
    { type: 'source', position: Position.Right, dataType: 's', id: 'output' }
  ],
  
  // ========================================
  // VISUAL CONFIGURATION
  // ========================================
  size: { 
    collapsed: { width: 'w-[120px]', height: 'h-[60px]' },
    expanded: { width: 'w-[180px]' }
  },
  
  // ========================================
  // COLLAPSED STATE RENDERER
  // ========================================
  renderCollapsed: ({ data, error }) => (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="text-xs font-medium">Advanced</div>
      <div className="text-xs text-gray-600">
        {error ? 'Error' : data.message || 'Ready'}
      </div>
    </div>
  ),
  
  // ========================================
  // EXPANDED STATE RENDERER
  // ========================================
  renderExpanded: ({ data, updateNodeData, id, error }) => (
    <div className="space-y-2">
      <div className="text-sm font-semibold">Advanced Node</div>
      <input
        type="text"
        value={data.message || ''}
        onChange={(e) => updateNodeData(id, { message: e.target.value })}
        placeholder="Enter message..."
        className="w-full px-2 py-1 text-xs border rounded"
      />
      {error && (
        <div className="text-xs text-red-600">{error}</div>
      )}
    </div>
  ),
  
  // ========================================
  // INSPECTOR CONTROLS
  // ========================================
  renderInspectorControls: ({ node, updateNodeData }) => (
    <div className="space-y-2">
      {/* Status Display */}
      <div className="flex items-center gap-2">
        <span className="text-xs">Priority:</span>
        <span className={`px-2 py-1 rounded text-xs text-white ${
          node.data.priority === 'high' ? 'bg-red-500' :
          node.data.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
        }`}>
          {node.data.priority?.toUpperCase() || 'MEDIUM'}
        </span>
      </div>
      
      {/* Priority Selector */}
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Priority Level:</label>
        <select
          value={node.data.priority || 'medium'}
          onChange={(e) => updateNodeData(node.id, { priority: e.target.value })}
          className="w-full px-2 py-1 text-xs border rounded"
        >
          <option value="low">Low Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="high">High Priority</option>
        </select>
      </div>
      
      {/* Message Input */}
      <div className="space-y-1">
        <label className="text-xs text-gray-600">Message:</label>
        <input
          type="text"
          value={node.data.message || ''}
          onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
          className="w-full px-2 py-1 text-xs border rounded"
          placeholder="Enter your message..."
        />
      </div>
      
      {/* Debug Info */}
      <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
        <div>Factory: RefactoredNodeFactory</div>
        <div>Enhanced: True</div>
      </div>
    </div>
  )
});

export default YourAdvancedNode;
```

### **Enterprise Features Available**

| Feature | Description | When to Use |
|---------|-------------|-------------|
| **Safety Layer System** | Bulletproof state management | Always recommended |
| **GPU Acceleration** | Hardware-accelerated rendering | High-frequency updates |
| **Ultra-Fast Propagation** | Optimized data flow | Performance-critical nodes |
| **Error Injection** | Vibe Mode error state support | User-facing nodes |

### **Node Sizing Patterns**

The RefactoredNodeFactory includes intelligent sizing that automatically adapts based on node type and content:

#### **Automatic Size Detection**

The system automatically applies appropriate sizes based on node type patterns:

```typescript
// Automatic sizing based on node type (from NodeContainer.tsx)
const getNodeSize = (nodeType: string) => {
  if (nodeType.toLowerCase().includes('trigger')) {
    return DEFAULT_TRIGGER_NODE_SIZE; // 60x60 collapsed, 120x120 expanded
  }
  if (nodeType.toLowerCase().includes('logic')) {
    return { collapsed: 'w-[80px] h-[60px]', expanded: 'w-[160px] h-[120px]' };
  }
  if (nodeType.toLowerCase().includes('text')) {
    return { collapsed: 'w-[120px] h-[60px]', expanded: 'w-[200px] h-[120px]' };
  }
  // Default size for other nodes
  return { collapsed: 'w-[100px] h-[80px]', expanded: 'w-[180px] h-[140px]' };
};
```

#### **Standard Size Categories**

| Node Type | Collapsed Size | Expanded Size | Use Case |
|-----------|----------------|---------------|----------|
| **Trigger** | `60x60px` | `120x120px` | Compact trigger/toggle nodes |
| **Logic** | `80x60px` | `160x120px` | Logic gates and processors |
| **Text** | `120x60px` | `200x120px` | Text processing nodes |
| **Default** | `100x80px` | `180x140px` | General purpose nodes |

#### **Custom Size Configuration**

You can override automatic sizing in your RefactoredNodeFactory node:

```typescript
export const YourCustomNode = createNodeComponent<YourNodeData>({
  nodeType: 'yourCustomNode',
  
  // Override automatic sizing
  size: { 
    collapsed: { width: 'w-[140px]', height: 'h-[80px]' },
    expanded: { width: 'w-[220px]', height: 'h-[160px]' }
  },
  
  // ... rest of configuration
});
```

#### **Size Constants Available**

```typescript
// From factory/constants/index.ts
export const DEFAULT_TRIGGER_NODE_SIZE = {
  collapsed: 'w-[60px] h-[60px]',
  expanded: 'w-[120px] h-[120px]'
};

export const DEFAULT_LOGIC_NODE_SIZE = {
  collapsed: 'w-[80px] h-[60px]',
  expanded: 'w-[160px] h-[120px]'
};

export const DEFAULT_TEXT_NODE_SIZE = {
  collapsed: 'w-[120px] h-[60px]',
  expanded: 'w-[200px] h-[120px]'
};
```

#### **Size Best Practices**

1. **Consistent Ratios** - Expanded height should be ~1.5-2x collapsed height
2. **Icon State Optimization** - Collapsed sizes should fit essential UI elements
3. **Content-Based Sizing** - Choose sizes based on typical content amount
4. **Performance Consideration** - Smaller collapsed states improve canvas performance
5. **Visual Balance** - Maintain consistent visual weight across node types

#### **Responsive Size Patterns**

```typescript
// Pattern 1: Fixed aspect ratio
size: {
  collapsed: { width: 'w-[60px]', height: 'h-[60px]' }, // 1:1 ratio
  expanded: { width: 'w-[60px]', height: 'h-[120px]' }  // 1:2 ratio
}

// Pattern 2: Width scaling
size: {
  collapsed: { width: 'w-[100px]', height: 'h-[60px]' }, // Wider collapsed
  expanded: { width: 'w-[180px]', height: 'h-[120px]' } // Proportional expansion
}

// Pattern 3: Content-adaptive
size: {
  collapsed: { width: 'w-[120px]', height: 'h-[60px]' }, // Text-focused
  expanded: { width: 'w-[200px]', height: 'h-[140px]' } // Ample content space
}
```

#### **Size Debugging**

```typescript
// Add to your node for size debugging
renderExpanded: ({ data, error }) => (
  <div className="space-y-1">
    <div className="text-xs text-gray-500">
      Size: {nodeSize.expanded}
    </div>
    {/* Rest of your content */}
  </div>
)
```

---

## **Step 5: Test Your Node**

### **Testing Checklist**

1. **Restart the development server** to ensure all registry changes are loaded
2. **Open the Node Sidebar** in your flow editor
3. **Find your node** in the appropriate folder/category
4. **Drag it** onto the canvas
5. **Select the node** to see if inspector controls appear
6. **Test connections** and functionality
7. **Test error injection** (if supported)

### **Verification Commands**

```bash
# Start development server
npm run dev

# Check for TypeScript errors
npm run type-check

# Run tests (if available)
npm test
```

---

## **Step 6: Debugging Common Issues**

### **Node Doesn't Appear in Sidebar**

```typescript
// Add debug logging to nodeRegistry.ts
console.log('🔍 Available nodes:', Object.keys(ENHANCED_NODE_REGISTRY));
console.log('🔍 Registry mapping:', generateInspectorControlMapping());
```

**Common causes:**
- Import statement missing
- Registry entry has syntax errors
- Development server needs restart

### **Inspector Controls Not Working**

```typescript
// Check inspector control mapping
console.log('🔍 Inspector controls for yourNode:', 
  generateInspectorControlMapping()['yourNewNode']);
```

**Common causes:**
- `hasControls: false` in registry
- `inspectorControls.type: 'none'`
- Control field keys don't match data interface

### **Error Injection Not Working**

```typescript
// Check if node supports error injection
console.log('🔍 Error injection supported:', 
  ERROR_INJECTION_SUPPORTED_NODES.includes('yourNewNode'));
```

**Common causes:**
- Node not added to `ERROR_INJECTION_SUPPORTED_NODES`
- No JSON handle for receiving error data
- Error styling not applied

---

## **Step 7: Advanced Patterns**

### **Complex Inspector Controls**

```typescript
inspectorControls: {
  type: 'factory',
  controlGroups: [
    {
      title: 'Basic Settings',
      fields: [
        {
          key: 'mode',
          type: 'select',
          label: 'Processing Mode',
          options: [
            { value: 'fast', label: 'Fast Mode' },
            { value: 'accurate', label: 'Accurate Mode' },
            { value: 'balanced', label: 'Balanced Mode' }
          ]
        }
      ]
    },
    {
      title: 'Advanced Settings',
      fields: [
        {
          key: 'intensity',
          type: 'range',
          label: 'Intensity',
          min: 0,
          max: 10,
          step: 0.1
        },
        {
          key: 'description',
          type: 'textarea',
          label: 'Description',
          placeholder: 'Enter detailed description...',
          rows: 4
        }
      ]
    }
  ]
}
```

### **Legacy Control Integration**

```typescript
inspectorControls: {
  type: 'legacy',
  legacyControlType: 'TextNodeControl' // Use existing control components
}
```

### **RefactoredNodeFactory Inspector Controls**

For nodes created with the RefactoredNodeFactory, add inspector controls using the `renderInspectorControls` property:

```typescript
// features/business-logic/nodes/[category]/YourAdvancedNode.tsx

export const YourAdvancedNode = createNodeComponent<YourAdvancedNodeData>({
  nodeType: 'yourAdvancedNode',
  
  // ... other configuration ...
  
  // INSPECTOR CONTROLS RENDERER
  renderInspectorControls: ({ node, updateNodeData }) => {
    return (
      <div className="space-y-2">
        {/* Status Display */}
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span className={`px-2 py-1 rounded text-xs text-white ${
            node.data.enabled ? 'bg-green-500' : 'bg-gray-500'
          }`}>
            {node.data.enabled ? 'ENABLED' : 'DISABLED'}
          </span>
        </div>
        
        {/* Toggle Button */}
        <button
          onClick={() => updateNodeData(node.id, { 
            enabled: !node.data.enabled,
            value: !node.data.enabled
          })}
          className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
        >
          {node.data.enabled ? 'Disable' : 'Enable'}
        </button>
        
        {/* Text Input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Message:</label>
          <input
            type="text"
            value={node.data.message || ''}
            onChange={(e) => updateNodeData(node.id, { message: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded"
            placeholder="Enter message..."
          />
        </div>
        
        {/* Number Input */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Priority (1-10):</label>
          <input
            type="number"
            min="1"
            max="10"
            value={node.data.priority || 1}
            onChange={(e) => updateNodeData(node.id, { priority: parseInt(e.target.value) || 1 })}
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>
        
        {/* Dropdown Select */}
        <div className="space-y-1">
          <label className="text-xs text-gray-600">Mode:</label>
          <select
            value={node.data.mode || 'auto'}
            onChange={(e) => updateNodeData(node.id, { mode: e.target.value })}
            className="w-full px-2 py-1 text-xs border rounded"
          >
            <option value="auto">Auto</option>
            <option value="manual">Manual</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
        
        {/* Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={node.data.debugMode || false}
            onChange={(e) => updateNodeData(node.id, { debugMode: e.target.checked })}
            className="shrink-0"
          />
          <label className="text-xs text-gray-600">Debug Mode</label>
        </div>
        
        {/* Debug Information */}
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t space-y-1">
          <div>Factory: RefactoredNodeFactory</div>
          <div>Node ID: {node.id}</div>
          <div>Last Updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    );
  }
});
```

#### **Inspector Control Props**

The `renderInspectorControls` function receives these props:

| Prop | Type | Description |
|------|------|-------------|
| `node` | `{ id: string; type: string; data: T }` | Complete node object with data |
| `updateNodeData` | `(id: string, patch: Record<string, unknown>) => void` | Function to update node data |
| `onLogError?` | `(nodeId: string, message: string, type?: any, source?: string) => void` | Optional error logging |
| `inspectorState?` | `Object` | Optional state for complex controls |

#### **Inspector Control Best Practices**

1. **Consistent Styling** - Use Tailwind classes for consistent appearance
2. **Real-time Updates** - Use `updateNodeData` for immediate state changes
3. **Input Validation** - Validate inputs before updating node data
4. **Visual Feedback** - Show current state with colors and badges
5. **Error Handling** - Handle invalid inputs gracefully
6. **Debug Information** - Include helpful debug info for development

#### **Common Inspector Control Patterns**

```typescript
// Simple Toggle Button
<button
  onClick={() => updateNodeData(node.id, { enabled: !node.data.enabled })}
  className={`px-3 py-2 text-sm rounded transition-colors ${
    node.data.enabled 
      ? 'bg-green-500 hover:bg-green-600 text-white' 
      : 'bg-gray-500 hover:bg-gray-600 text-white'
  }`}
>
  {node.data.enabled ? 'Enabled' : 'Disabled'}
</button>

// Numeric Input with Validation
<input
  type="number"
  value={node.data.duration || 1000}
  onChange={(e) => {
    const value = Math.max(100, parseInt(e.target.value) || 100);
    updateNodeData(node.id, { duration: value });
  }}
  className="w-full px-2 py-1 text-xs border rounded"
  min="100"
  step="100"
/>

// Status Badge
<span className={`px-2 py-1 rounded text-xs text-white ${
  node.data.active ? 'bg-green-500' : 'bg-red-500'
}`}>
  {node.data.active ? 'ACTIVE' : 'INACTIVE'}
</span>

// Conditional Controls
{node.data.advanced && (
  <div className="space-y-2 p-2 bg-gray-50 rounded">
    <h4 className="text-xs font-semibold">Advanced Settings</h4>
    {/* Advanced controls here */}
  </div>
)}
```

### **Conditional Node Features**

```typescript
// In your registry entry
experimental: true,        // Show in testing folder
deprecated: false,         // Hide from main folders
tags: ['ai', 'processing'], // For search/filtering
version: '2.1.0'          // Track node versions
```

---

## **✅ Final Verification Checklist**

- [ ] **Component Created** - Node component in correct directory
- [ ] **Import Added** - Import statement in nodeRegistry.ts  
- [ ] **Registry Entry** - Complete entry with all required fields
- [ ] **Error Support** - Added to ERROR_INJECTION_SUPPORTED_NODES (if needed)
- [ ] **Sidebar Appearance** - Node appears in correct folder
- [ ] **Inspector Controls** - Controls render and function correctly
- [ ] **Data Processing** - Node processes data as expected
- [ ] **Connections** - Input/output handles work properly
- [ ] **Error Injection** - Error states work (if supported)
- [ ] **TypeScript** - No type errors
- [ ] **Performance** - Node responds quickly to changes

---

## **System Auto-Generation**

The registry system automatically handles:

✅ **Type Generation** - TypeScript interfaces from `dataInterface`  
✅ **Constants Sync** - NODE_TYPE_CONFIG updated with registry data  
✅ **Inspector Mapping** - Control components automatically rendered  
✅ **Sidebar Organization** - Nodes grouped by folder and category  
✅ **Component Mapping** - React components mapped to node types  
✅ **Validation** - Runtime checks for data integrity  

Your node will be immediately available throughout the system once registered! 🎉

---

## **Getting Help**

If you encounter issues:

1. **Check the console** for debug logs and error messages
2. **Verify imports** and syntax in nodeRegistry.ts
3. **Restart the dev server** after registry changes
4. **Check existing nodes** for reference patterns
5. **Test with simple configuration** first, then add complexity

**Happy node building!** 🚀 