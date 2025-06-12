# 🚀 New Node System - NodeSpec Architecture

> **Status**: ✅ **MIGRATION COMPLETE** - All legacy nodes have been successfully migrated to the new NodeSpec architecture.

## Overview

The new NodeSpec system replaces the old `meta.json + component` model with a **single-file architecture** that provides better developer experience, type safety, and performance.

## ✨ Key Benefits

- **🎯 Single Source of Truth**: One `.node.tsx` file contains both spec and implementation
- **⚡ Lazy Loading**: Nodes are only loaded when needed, reducing bundle size
- **🛠️ Automated Scaffolding**: Create new nodes in seconds with `pnpm new:node`
- **🔒 Type Safety**: Full TypeScript integration with enforced contracts
- **🎨 Automatic Theming**: Category-based styling applied automatically

## 🚀 Creating a New Node

### Quick Start
```bash
# Run the generator
pnpm new:node

# Follow the prompts:
# - Kind: myAwesomeNode
# - Domain: create
# - Category: CREATE
```

### What Gets Generated
```typescript
// features/business-logic-modern/node-domain/create/myAwesomeNode.node.tsx

const spec: NodeSpec = {
  kind: 'myAwesomeNode',
  displayName: 'My Awesome Node',
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_FIXED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    // Define your inputs/outputs here
  ],
  inspector: {
    key: 'MyAwesomeNodeInspector',
  },
  initialData: {},
};

const MyAwesomeNodeComponent = ({ data, updateData }: NodeProps) => {
  // Your component implementation
  return <div>Your UI here</div>;
};

export default withNodeScaffold(spec, MyAwesomeNodeComponent);
```

## 📖 NodeSpec Properties

### Required Properties
- **`kind`**: Unique identifier (camelCase)
- **`displayName`**: Human-readable name
- **`category`**: Functional category (CREATE, VIEW, TRIGGER, TEST, CYCLE)
- **`size`**: Collapsed and expanded dimensions
- **`handles`**: Input/output connection points
- **`inspector`**: Inspector panel configuration
- **`initialData`**: Default node data

### Handle Configuration
```typescript
handles: [
  {
    id: 'input-text',
    dataType: 's', // string
    position: 'left',
    type: 'target'
  },
  {
    id: 'output-result',
    dataType: 'j', // json
    position: 'right', 
    type: 'source'
  }
]
```

### Data Types
- `'s'` - String
- `'n'` - Number
- `'b'` - Boolean
- `'j'` - JSON Object
- `'a'` - Array
- `'tr'` - Trigger
- `'x'` - Any

## 🎯 Component Implementation

### Basic Structure
```typescript
const MyNodeComponent = ({ data, id }: NodeProps<MyNodeData>) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Data updates (implement with actual hook)
  const updateData = (newData: Partial<MyNodeData>) => {
    console.log(`Updating ${id}:`, newData);
  };

  return (
    <>
      {/* Expand/Collapse Button */}
      <button onClick={() => setExpanded(!isExpanded)}>
        {isExpanded ? '⦾' : '⦿'}
      </button>

      {/* Content */}
      {isExpanded ? (
        <div className="p-4 pt-6">
          {/* Expanded UI */}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">
          {/* Collapsed UI (icon) */}
        </div>
      )}
    </>
  );
};
```

## 🔧 Available Commands

```bash
# Create new node
pnpm new:node

# Run migration (if needed)
pnpm migrate:nodes

# Standard development
pnpm dev
```

## 📏 Size Standards

### Collapsed Sizes
- `COLLAPSED_SIZES.C1` - 60×60px (icons)
- `COLLAPSED_SIZES.C1W` - 120×60px (wide inputs)
- `COLLAPSED_SIZES.C2` - 120×120px (medium)
- `COLLAPSED_SIZES.C3` - 180×180px (large previews)

### Expanded Fixed Sizes
- `EXPANDED_FIXED_SIZES.FE1` - 120×120px (standard)
- `EXPANDED_FIXED_SIZES.FE1H` - 120×180px (tall forms)
- `EXPANDED_FIXED_SIZES.FE2` - 180×180px (rich editors)
- `EXPANDED_FIXED_SIZES.FE3` - 240×240px (dashboards)

### Expanded Variable Sizes
- `EXPANDED_VARIABLE_SIZES.VE1` - 120px wide × auto height
- `EXPANDED_VARIABLE_SIZES.VE2` - 180px wide × auto height
- `EXPANDED_VARIABLE_SIZES.VE3` - 240px wide × auto height

## 🎨 Categories & Theming

- **CREATE** - Blue theme, content generation
- **VIEW** - Gray theme, data visualization  
- **TRIGGER** - Purple theme, flow control
- **TEST** - Yellow theme, debugging/QA
- **CYCLE** - Green theme, scheduled operations

## ⚡ Performance Features

- **Lazy Loading**: Nodes load only when needed
- **Tree Shaking**: Unused nodes excluded from bundle
- **Code Splitting**: Dynamic imports for better performance
- **Memory Safety**: Automatic cleanup and error boundaries

## 🛠️ Troubleshooting

### Plop Not Working
```bash
# Ensure plopfile.js exists (not .ts)
ls plopfile.js

# Check if plop is installed
pnpm list plop
```

### ts-node Issues
```bash
# Use the Node.js config
npx ts-node --project tsconfig.node.json your-script.ts
```

### Import Errors
Ensure you're importing from the correct paths:
```typescript
import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
```

## 📁 File Structure

```
features/business-logic-modern/
├── node-domain/
│   ├── index.ts                     # Central exports
│   ├── create/
│   │   └── myNode.node.tsx         # Single-file nodes
│   ├── view/
│   ├── trigger/
│   └── test/
├── infrastructure/
│   ├── node-core/
│   │   ├── NodeSpec.ts             # Type definitions
│   │   └── withNodeScaffold.tsx    # HOC wrapper
│   ├── node-registry/
│   │   └── modern-node-loader.ts   # Lazy loading
│   └── theming/
│       ├── categories.ts           # Category constants
│       └── sizing.ts               # Size constants
└── tooling/
    ├── dev-scripts/
    │   └── plop-templates/
    │       └── node.tsx.hbs        # Generation template
    └── migration-scripts/
        └── migrate-all-nodes.ts    # Migration utility
```

## 🎉 Migration Status

✅ **All legacy nodes successfully migrated**  
✅ **Plop generator working**  
✅ **ts-node configuration fixed**  
✅ **Lazy loading implemented**  
✅ **Type safety enforced**  

The system is ready for production use! 