# Business Logic Development Context

You are working in the business logic layer of the application. This is a visual flow editor built with React Flow that allows users to create node-based workflows.

## 🏗️ Architecture Overview

The business logic layer has been refactored from monolithic files into a modular architecture with clear separation of concerns:

```
features/business-logic/
├── docs/                          # 📚 Documentation (centralized)
│   ├── documentation.md          # Main architecture overview
│   ├── creating-new-nodes.md     # Step-by-step node development
│   ├── node-guide.md             # Complete catalog of all nodes
│   └── node-styling-guide.md     # Comprehensive styling system
├── flow-editor/                   # Main flow editor (refactored from 748 lines → modular)
│   ├── FlowEditor.tsx            # Main orchestrator component (263 lines)
│   ├── types/index.ts            # Type definitions (194 lines)
│   ├── constants/index.ts        # Configuration constants (188 lines)
│   ├── hooks/                    # Custom hooks for state management
│   ├── components/
│   │   └── FlowCanvas.tsx        # ReactFlow canvas component (288 lines)
│   └── utils/                    # Utility functions
├── components/
│   ├── sidebar/                  # Sidebar component (modular)
│   │   ├── SidebarTabs.tsx      # Main tabbed interface
│   │   ├── types.ts             # Type definitions and tab configurations
│   │   ├── constants.ts         # Stencil configurations (195 lines)
│   │   └── hooks/               # Custom hooks
│   └── node-inspector/          # Node inspector (modular)
│       ├── NodeInspector.tsx    # Main orchestrator (187 lines)
│       ├── types.ts             # Type definitions
│       ├── constants.ts         # Node type configurations
│       └── controls/            # Node control components
├── stores/                       # State management
│   ├── nodeStyleStore.ts        # Centralized styling system with category support
│   ├── categoryThemeDemo.ts     # Category theming examples and utilities
│   └── styleDemo.ts             # Global styling examples
└── nodes/                       # Node implementations
    ├── main/                    # Core logic nodes
    ├── media/                   # Text and media processing nodes
    ├── automation/              # Automation and trigger nodes
    ├── integrations/            # API and external service nodes
    └── misc/                    # Miscellaneous utility nodes
```

## 🎯 Key Architecture Patterns

### Node Structure Requirements:
- **ICON state**: 60x60px (default collapsed state)
- **EXPANDED state**: 120x120px (when showUI is true)
- **Text-based nodes**: 120x60px in ICON state
- **Toggle button**: `{showUI ? '⦿' : '⦾'}` controls expansion
- **Default state**: ICON (collapsed)

### Handle Types & Colors:
- `s` = string (blue #3b82f6)
- `n` = number (orange #f59e42)  
- `b` = boolean (green #10b981)
- `j` = JSON (indigo #6366f1)
- `a` = array (pink #f472b6)
- `N` = Bigint (purple #a21caf)
- `f` = float (yellow #fbbf24)
- `x` = any (gray #6b7280)
- `u` = undefined (light gray #d1d5db)
- `S` = symbol (gold #eab308)
- `∅` = null (red #ef4444)

## 🎨 Centralized Styling System

The architecture includes a comprehensive styling system for hundreds of nodes:

### Global Style Management:
- **Zustand Store**: `stores/nodeStyleStore.ts` - Centralized state management
- **Category Support**: Function-based color categories (Create=Blue, Logic=Purple, etc.)
- **Global Effects**: Hover, selection, activation, error states controlled globally
- **Batch Operations**: Change all nodes in a category with single function call

### Style Categories by Function:
- **Create** = Blue (Create nodes)
- **Logic** = Purple (Logic operations)  
- **Trigger** = Orange (Trigger/automation)
- **Test** = Grey (Testing/debug)
- **Turn** = Cyan (Transform operations)
- **Count** = Brown/Amber (Counting nodes)
- **Delay** = Red (Timing/delay)
- **Edit** = Indigo (Editing operations)
- **Cycle** = Green (Cycling/loops)

### Usage Hooks:
```typescript
// Apply category-aware styling
const categoryBase = useNodeCategoryBaseClasses('createText')
const categoryButton = useNodeCategoryButtonTheme('createText', !!error, isActive)
const textTheme = useNodeTextTheme(!!error)
const styleClasses = useNodeStyleClasses(!!selected, !!error, isActive)
```

## 🚀 Creating New Nodes - Complete Process

### ✅ Quick Checklist

When creating a new node, you need to update these 6 locations:

1. ✅ **Create node component** in `nodes/{category}/YourNodeName.tsx`
2. ✅ **Add type definitions** in `flow-editor/types/index.ts`
3. ✅ **Register configuration** in `flow-editor/constants/index.ts`
4. ✅ **Register in FlowCanvas** in `flow-editor/components/FlowCanvas.tsx`
5. ✅ **Add to sidebar** in `components/sidebar/constants.ts`
6. ✅ **Add controls** in `components/node-inspector/controls/`

### Step 1: Create the Node Component

Create your node in the appropriate category folder:
- `nodes/main/` - Core logic nodes (AND, OR, NOT, etc.)
- `nodes/media/` - Text and media processing
- `nodes/automation/` - Triggers, timers, counters
- `nodes/integrations/` - API and external services
- `nodes/misc/` - Utility and helper nodes

```typescript
// nodes/main/YourNodeName.tsx
import React, { useState, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CustomHandle } from '../../handles/CustomHandle';
import { useNodeConnections, useNodesData } from '@xyflow/react';
import { getSingleInputValue } from '../../utils/nodeUtils';
import { 
  useNodeCategoryBaseClasses,
  useNodeCategoryButtonTheme,
  useNodeCategoryTextTheme,
  useNodeStyleClasses
} from '../../stores/nodeStyleStore';

interface YourNodeData {
  yourProperty: string;
  anotherProperty?: number;
}

export default function YourNode({ id, data, selected }: { id: string; data: YourNodeData; selected?: boolean }) {
  const [showUI, setShowUI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  // Category-aware styling
  const categoryBase = useNodeCategoryBaseClasses('yourNodeType');
  const categoryButton = useNodeCategoryButtonTheme('yourNodeType', !!error, isActive);
  const categoryText = useNodeCategoryTextTheme('yourNodeType', !!error);
  const styleClasses = useNodeStyleClasses(!!selected, !!error, isActive);
  
  // Get input connections
  const connections = useNodeConnections();
  const nodesData = useNodesData();
  
  // Process inputs and update outputs
  useEffect(() => {
    const inputValue = getSingleInputValue(connections, nodesData, 'input');
    
    try {
      // Your node logic here
      const processedValue = processInput(inputValue);
      setError(null);
      
      // Update node data if needed
      // updateNodeData(id, { yourProperty: processedValue });
    } catch (err) {
      setError(err.message);
    }
  }, [connections, nodesData, id]);
  
  const processInput = (input: unknown) => {
    // Implement your node's logic here
    return String(input || '');
  };
  
  return (
    <div className={`
      relative rounded-lg shadow-sm transition-all duration-200
      ${categoryBase.background} ${categoryBase.border}
      ${styleClasses}
      ${showUI ? 'w-[120px] h-[120px]' : 'w-[60px] h-[60px]'}
    `}>
      {/* Toggle Button */}
      <button
        onClick={() => setShowUI(!showUI)}
        className={`
          absolute top-1 right-1 w-4 h-4 text-xs rounded-full transition-colors
          ${categoryButton}
        `}
        title={showUI ? 'Collapse' : 'Expand'}
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* Node Content */}
      <div className="p-2 h-full flex flex-col">
        {showUI ? (
          // Expanded UI
          <div className="flex-1 flex flex-col">
            <div className={`text-xs font-medium mb-2 ${categoryText.primary}`}>
              Your Node
            </div>
            <div className={`flex-1 text-xs ${categoryText.secondary}`}>
              Value: {data.yourProperty}
            </div>
            {error && (
              <div className="text-xs text-red-600 mt-1">
                {error}
              </div>
            )}
          </div>
        ) : (
          // Icon UI
          <div className="flex-1 flex items-center justify-center">
            <div className="text-lg">🔧</div> {/* Your icon */}
          </div>
        )}
      </div>

      {/* Input Handle */}
      <CustomHandle 
        type="target" 
        position={Position.Left} 
        id="input" 
        dataType="s"
        style={{ left: -6 }}
      />
      
      {/* Output Handle */}
      <CustomHandle 
        type="source" 
        position={Position.Right} 
        id="output" 
        dataType="s"
        style={{ right: -6 }}
      />
    </div>
  );
}
```

### Step 2-6: Registration Process

See detailed steps in `docs/creating-new-nodes.md` for complete registration process.

## 🎨 Styling System Usage

### Quick Category Updates:

```typescript
import { changeCategoryColor } from '../stores/categoryThemeDemo'

// Change all Create nodes to green
changeCategoryColor('create', 'green')

// Change all Logic nodes to purple  
changeCategoryColor('logic', 'purple')

// Apply default color scheme
import { applyUserColorScheme } from '../stores/categoryThemeDemo'
applyUserColorScheme()
```

### Global Effect Updates:

```typescript
import { useNodeStyleStore } from '../stores/nodeStyleStore'

const store = useNodeStyleStore.getState()

// Update hover effect for ALL nodes
store.updateHoverStyle({
  glow: 'shadow-[0_0_6px_2px_rgba(255,255,255,0.5)]'
})

// Update activation glow for ALL nodes
store.updateActivationStyle({
  glow: 'shadow-[0_0_12px_4px_rgba(34,197,94,0.9)]'
})
```

## 📚 Documentation Structure

All documentation is centralized in the `docs/` folder:

- **`documentation.md`** - This file, main architecture overview
- **`creating-new-nodes.md`** - Complete step-by-step guide for node development
- **`node-guide.md`** - Comprehensive catalog of all available nodes
- **`node-styling-guide.md`** - Complete styling system documentation

## 🔧 Development Workflow

### For New Nodes:
1. Read `docs/creating-new-nodes.md` for step-by-step process
2. Use category-aware styling hooks from `nodeStyleStore.ts`
3. Follow the 6-step registration checklist
4. Test with various style presets and category colors

### For Styling Updates:
1. Read `docs/node-styling-guide.md` for comprehensive guide
2. Use global functions for category-wide changes
3. Use store methods for global effect updates
4. Test with the style demo functions

### For Node Reference:
1. Use `docs/node-guide.md` for complete node catalog
2. Check handle types and color coding
3. Review use cases and patterns
4. Follow naming conventions

## 🎯 Best Practices

### Node Development:
- Use the category-aware styling system for consistency
- Implement proper error handling with visual feedback
- Follow the icon/expanded state patterns
- Use appropriate handle types and colors

### Styling Management:
- Use category functions for batch changes
- Test with different color schemes
- Maintain consistency across node types
- Document custom styling modifications

### Architecture Maintenance:
- Keep documentation updated with new features
- Follow the modular architecture patterns  
- Use TypeScript for type safety
- Implement proper error boundaries

## 📊 System Metrics

### Codebase Organization:
- **Modular Architecture**: Replaced 748-line monolithic file
- **Documentation**: 4 comprehensive guides in `docs/`
- **Styling System**: Centralized management for hundreds of nodes
- **Category Support**: 9 function-based color categories
- **Type Safety**: Full TypeScript coverage

### Performance Benefits:
- **Lazy Loading**: Modular node imports
- **Centralized State**: Zustand for efficient updates
- **Batch Operations**: Category-wide styling changes
- **Optimized Rendering**: Category-aware styling hooks

---

*This documentation is actively maintained and updated with system changes. For specific implementation details, refer to the individual guide files in the `docs/` folder.* 