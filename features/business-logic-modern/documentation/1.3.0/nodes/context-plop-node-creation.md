# Context: Plop Node Creation System

## Overview

This document provides a comprehensive guide to the **NodeSpec + Plop** architecture used in Agenitix-2 for creating and managing workflow nodes. This system represents a modern, enterprise-grade approach to node-based workflow development with **fully automated scaffolding**, type safety, and comprehensive validation.

## Architecture Philosophy

### Single Source of Truth

Each node is defined in a single `.node.tsx` file that contains:

- **NodeSpec**: Metadata, configuration, and schema
- **Component**: React UI component
- **Validation**: Zod schema with enterprise error handling
- **Export**: Both the component and spec for registry access

### Zero-Configuration Automation

The system provides **complete automation** through Plop generators:

- **No manual registry updates required**
- **Automatic registration across all systems**
- **Dynamic metadata generation from NodeSpec**
- **Self-maintaining import/export chains**

### Enterprise Standards

- **Type Safety**: Full TypeScript support with Zod validation
- **Error Handling**: Comprehensive validation with reporting
- **Metrics**: Real-time health scoring and monitoring
- **Audit Trail**: Data update tracking and validation logs

## System Components

### 1. NodeSpec Architecture

#### File Structure

```
features/business-logic-modern/node-domain/
├── create/
│   └── createText.node.tsx
├── view/
│   └── viewOutputV2U.node.tsx
├── trigger/
│   └── triggerOnToggleV2U.node.tsx
├── test/
│   └── testErrorV2U.node.tsx
└── index.ts
```

#### NodeSpec Interface

```typescript
interface NodeSpec {
  kind: string; // Unique identifier (camelCase)
  displayName: string; // Human-readable name
  category: NodeCategory; // Functional category (CREATE, VIEW, etc.)
  size: {
    expanded: SizeConfig; // Expanded state dimensions
    collapsed: SizeConfig; // Collapsed state dimensions
  };
  handles: HandleSpec[]; // Input/output connection points
  inspector: {
    key: string; // Inspector component identifier
  };
  initialData: any; // Default data from Zod schema
}
```

### 2. Plop Generator System

#### Command

```bash
pnpm new:node
```

#### Interactive Prompts

1. **Kind**: Node identifier (e.g., `createText`, `viewCsv`)
2. **Domain**: Functional domain (`create`, `view`, `trigger`, `test`, `cycle`, `custom`)
3. **Category**: UI category (`CREATE`, `VIEW`, `TRIGGER`, `TEST`, `CYCLE`)
4. **Collapsed Size**: Standard collapsed dimensions (`C1`, `C1W`, `C2`, `C3`)
5. **Expanded Size**: Standard expanded dimensions (`FE0`, `FE1`, `FE1H`, `FE2`, `FE3`, `VE0`, `VE1`, `VE2`, `VE3`)
6. **TypeScript Symbol**: Optional TS symbol for primary output handle

#### Fully Automated File Updates

Plop automatically updates **all** of the following files:

##### 1. Node File Creation

- **Creates**: `features/business-logic-modern/node-domain/{domain}/{kind}.node.tsx`
- **Template**: Complete NodeSpec + Component + Validation

##### 2. React Flow Registration

- **Updates**: `features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts`
- **Adds**: Import statement and nodeTypes object entry
- **Result**: Node immediately available in React Flow

##### 3. Registry Registration

- **Updates**: `features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts`
- **Adds**: Import statement and nodeSpecs object entry
- **Result**: Node metadata automatically available to sidebar, inspector, theming

##### 4. Domain Exports

- **Updates**: `features/business-logic-modern/node-domain/index.ts`
- **Adds**: Export statement for the new node
- **Result**: Clean module imports across the system

### 3. Registry System Architecture

#### NodeSpec Registry (Single Source of Truth)

**File**: `features/business-logic-modern/infrastructure/node-registry/nodespec-registry.ts`

**Core Principle**: Uses NodeSpec as the **only** source of metadata

```typescript
// All specs collected automatically by Plop
const nodeSpecs: Record<string, NodeSpec> = {
  // Auto-updated by Plop - NO MANUAL ADDITIONS NEEDED
  createText: createTextSpec,
  // New nodes automatically added here by Plop
};

// Metadata generated dynamically from NodeSpec
export function getNodeSpecMetadata(nodeType: string): NodeSpecMetadata | null {
  const spec = nodeSpecs[nodeType];
  if (!spec) return null;

  return {
    kind: spec.kind,
    displayName: spec.displayName,
    category: spec.category,
    size: spec.size,
    handles: spec.handles,
    initialData: spec.initialData,
    inspector: spec.inspector,
    // All metadata derived from NodeSpec - no duplication
  };
}
```

#### Dynamic Node Types

**File**: `features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts`

**Auto-Updated Structure**:

```typescript
// Imports automatically added by Plop
import createText from "../../../node-domain/create/createText.node";
// New imports automatically added here

export function useDynamicNodeTypes() {
  const nodeTypes = useMemo(
    () => ({
      // Entries automatically added by Plop
      createText,
      // New entries automatically added here
    }),
    []
  );

  return nodeTypes;
}
```

## Fully Automated Node Creation Workflow

### 1. Generation Command

```bash
pnpm new:node
```

### 2. Interactive Configuration

```
? What is the kind of the node? → myCustomNode
? What is the domain of the node? → create
? What is the functional category of the node? → CREATE
? Select collapsed size → C1
? Select expanded size → FE1
? Optional: TypeScript symbol for primary output handle → (leave blank)
```

### 3. Automatic File Generation and Updates

#### Generated Node Structure

```typescript
// myCustomNode.node.tsx - AUTOMATICALLY CREATED
import type { NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { z } from 'zod';

import { withNodeScaffold } from '@/features/business-logic-modern/infrastructure/node-core/withNodeScaffold';
import type { NodeSpec } from '@/features/business-logic-modern/infrastructure/node-core/NodeSpec';
import {
  createNodeValidator,
  CommonSchemas,
  reportValidationError,
  useNodeDataValidation
} from '@/features/business-logic-modern/infrastructure/node-core/validation';
import { CATEGORIES, COLLAPSED_SIZES, EXPANDED_SIZES } from '@/features/business-logic-modern/infrastructure/node-core/constants';

// 1. DATA SCHEMA (Enterprise Validation)
const MyCustomNodeDataSchema = z.object({
  // Define your node's data structure here
  text: CommonSchemas.text.default('Default text'),
  isEnabled: CommonSchemas.boolean.default(true),
}).strict();

type MyCustomNodeData = z.infer<typeof MyCustomNodeDataSchema>;

// 2. NODE SPECIFICATION (Single Source of Truth)
const spec: NodeSpec = {
  kind: 'myCustomNode',
  displayName: 'My Custom Node',
  category: CATEGORIES.CREATE,
  size: {
    expanded: EXPANDED_SIZES.FE1,
    collapsed: COLLAPSED_SIZES.C1,
  },
  handles: [
    { id: 'json-input', dataType: 'j', position: 'left', type: 'target' },
    { id: 'output', dataType: 'j', position: 'right', type: 'source' },
  ],
  inspector: {
    key: 'MyCustomNodeInspector',
  },
  initialData: MyCustomNodeDataSchema.parse({}),
};

// 3. COMPONENT (Enterprise Standards)
const MyCustomNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);

  // Enterprise validation with health scoring
  const validateNodeData = createNodeValidator(MyCustomNodeDataSchema, 'MyCustomNode');
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;

  // Error reporting with audit trail
  if (!validationResult.success) {
    reportValidationError('MyCustomNode', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'MyCustomNodeComponent',
    });
  }

  // Real-time validation with health metrics
  const { updateData, getHealthScore } = useNodeDataValidation(
    MyCustomNodeDataSchema,
    'MyCustomNode',
    nodeData,
    id
  );

  // Component implementation...
  return (
    <>
      <ExpandCollapseButton isExpanded={isExpanded} onToggle={() => setExpanded(!isExpanded)} />
      <div className="node-content">
        {/* Your custom node UI here */}
        <div>Health Score: {getHealthScore()}%</div>
      </div>
    </>
  );
};

// 4. EXPORT (HOC + Spec for Registry)
export default withNodeScaffold(spec, MyCustomNodeComponent);
export { spec }; // Essential for registry automation
```

#### Automatic System Updates

**useDynamicNodeTypes.ts** - AUTOMATICALLY UPDATED:

```typescript
// Auto-added import by Plop
import myCustomNode from "../../../node-domain/create/myCustomNode.node";

const nodeTypes = useMemo(
  () => ({
    createText,
    myCustomNode, // ← AUTOMATICALLY ADDED BY PLOP
  }),
  []
);
```

**nodespec-registry.ts** - AUTOMATICALLY UPDATED:

```typescript
// Auto-added import by Plop
import myCustomNode, {
  spec as myCustomNodeSpec,
} from "../../node-domain/create/myCustomNode.node";

const nodeSpecs: Record<string, NodeSpec> = {
  createText: createTextSpec,
  myCustomNode: myCustomNodeSpec, // ← AUTOMATICALLY ADDED BY PLOP
};
```

**node-domain/index.ts** - AUTOMATICALLY UPDATED:

```typescript
// Auto-added export by Plop
export { default as myCustomNode } from "./create/myCustomNode.node";
```

### 4. Immediate Availability

After running `pnpm new:node`, the node is **immediately available** in:

- ✅ **React Flow Canvas** (via useDynamicNodeTypes)
- ✅ **Sidebar** (via registry metadata)
- ✅ **Node Inspector** (via registry metadata)
- ✅ **Theming System** (via category-based styling)
- ✅ **Type System** (full TypeScript support)

## Node Standards (Automatically Enforced)

### Visual States

All generated nodes implement:

1. **Collapsed State**: Minimal icon representation (60x60, 120x60)
2. **Expanded State**: Full controls and configuration (120x120+)

### Standard Features (Built into Template)

- **JSON Input**: For programmatic control
- **Expand/Collapse Button**: Top-left toggle
- **Selection State**: White glow when selected
- **Activation State**: Green glow when active
- **Error State**: Red indication for validation errors
- **Health Scoring**: Real-time 0-100% health metrics

### Data Flow Architecture

- **Internal Data**: Node's private state with Zod validation
- **Output Data**: Type-safe data passed to connected nodes
- **Input Validation**: Enterprise-grade with error reporting
- **Audit Trail**: Complete data change history

### Size Standards (Enforced by Constants)

```typescript
// Collapsed sizes
COLLAPSED_SIZES = {
  C1: { width: 60, height: 60 }, // Standard icon
  C1W: { width: 120, height: 60 }, // Wide icon
  C2: { width: 90, height: 90 }, // Medium icon
  C3: { width: 120, height: 90 }, // Large icon
};

// Expanded sizes
EXPANDED_SIZES = {
  FE0: { width: 120, height: 120 }, // Minimal expanded
  FE1: { width: 180, height: 140 }, // Standard expanded
  FE1H: { width: 180, height: 180 }, // Tall expanded
  FE2: { width: 240, height: 160 }, // Wide expanded
  FE3: { width: 300, height: 200 }, // Large expanded
};
```

## Enterprise Validation System

### Automatic Zod Integration

Every generated node includes:

```typescript
const NodeDataSchema = z
  .object({
    text: CommonSchemas.text.default("Default text"),
    number: CommonSchemas.number.default(0),
    isEnabled: CommonSchemas.boolean.default(true),
    url: CommonSchemas.url.optional(),
  })
  .strict();
```

### Common Schemas (Security-First)

- `CommonSchemas.text`: XSS-protected text input with sanitization
- `CommonSchemas.number`: Validated numeric input with range checking
- `CommonSchemas.boolean`: Boolean flag with type coercion
- `CommonSchemas.url`: URL validation with protocol checking
- `CommonSchemas.email`: Email validation with domain verification

### Automatic Validation Features

- **Real-time Validation**: Updates on every data change
- **Error Reporting**: Centralized error tracking with context
- **Health Scoring**: 0-100% health metrics with trend analysis
- **Audit Trail**: Complete data change history with timestamps
- **Performance Monitoring**: Validation timing and memory usage

## Zero-Configuration Development Workflow

### Complete Node Creation Process

1. **Generate Node**:

   ```bash
   pnpm new:node
   # Follow interactive prompts - takes 30 seconds
   ```

2. **Customize Implementation**:

   ```typescript
   // Edit the generated .node.tsx file
   // - Update Zod schema for your data
   // - Implement your UI component
   // - Add any custom validation logic
   ```

3. **Test Immediately**:

   ```bash
   # Node is automatically available - no build step needed
   # Open browser, drag from sidebar, start using
   ```

4. **Deploy**:
   ```bash
   # Node is production-ready with enterprise validation
   ```

### Node Management Commands

#### Create Node

```bash
pnpm new:node
```

#### Delete Node (with Complete Cleanup)

```bash
pnpm plop delete-node
# Automatically removes:
# - Node file
# - All registry entries
# - All import/export statements
# - Clean removal from all systems
```

### Best Practices (Automatically Enforced)

#### Naming Conventions

- **Kind**: camelCase (e.g., `createText`, `viewCsv`, `triggerWebhook`)
- **Files**: `{kind}.node.tsx` (automatically enforced)
- **Components**: `{PascalCase}Component` (template standard)
- **Schemas**: `{PascalCase}DataSchema` (template standard)

#### Code Organization Standards

```typescript
// Template automatically enforces this structure:
// 1. Imports (dependencies)
// 2. Zod Schema (data validation)
// 3. NodeSpec (single source of truth)
// 4. Component (UI implementation)
// 5. Exports (HOC + spec)
```

#### Error Handling (Built-in)

- **Validation Errors**: Automatically reported with context
- **Runtime Errors**: Caught and logged with stack traces
- **Performance Issues**: Automatically detected and reported
- **Memory Leaks**: Monitored and alerted

## System Integration Points

### Automatic Integration

The system provides **zero-configuration integration** with:

#### React Flow

```typescript
// Automatically updated - no manual work
const nodeTypes = useDynamicNodeTypes();

<ReactFlow nodeTypes={nodeTypes} />
// New nodes immediately available for dragging/dropping
```

#### Sidebar System

```typescript
// Registry automatically provides metadata
const metadata = getNodeSpecMetadata(nodeType);
// Automatic stencil creation with proper theming
```

#### Node Inspector

```typescript
// Automatic inspector component mapping
const inspector = metadata.inspector.key;
// Dynamic control rendering based on NodeSpec
```

#### Theming System

```typescript
// Category-based theming automatically applied
const theme = getCategoryTheme(metadata.category);
// Consistent visual styling across all nodes
```

## Advanced Features

### Health Monitoring (Automatic)

Every node automatically gets:

```typescript
const { getHealthScore, getPerformanceMetrics } = useNodeDataValidation();

// Real-time metrics:
// - Validation success rate
// - Error frequency
// - Performance timing
// - Memory usage
// - Update frequency
```

### Audit Trail (Automatic)

```typescript
// Every data change automatically logged:
{
  nodeId: "node_123",
  timestamp: "2024-01-15T10:30:00Z",
  oldValue: { text: "old" },
  newValue: { text: "new" },
  validationResult: { success: true, healthScore: 95 },
  context: { component: "TextInput", user: "developer" }
}
```

### Type Safety (Comprehensive)

```typescript
// Full end-to-end type safety:
type MyNodeData = z.infer<typeof MyNodeDataSchema>; // Data types
type MyNodeProps = NodeProps<MyNodeData>; // Component props
type MyNodeMetadata = NodeSpecMetadata; // Registry metadata
type MyNodeHandles = HandleSpec[]; // Connection types
```

## Migration and Maintenance

### Zero-Maintenance Registry

The registry is **completely self-maintaining**:

- ✅ **No manual updates required**
- ✅ **Automatic import management**
- ✅ **Dynamic metadata generation**
- ✅ **Consistent across all systems**

### Backward Compatibility

The system maintains **full backward compatibility**:

```typescript
// Legacy interfaces still work
export function getNodeMetadata(nodeType: string) {
  return getNodeSpecMetadata(nodeType); // Redirects to new system
}

// Old registry format still supported
export const modernNodeRegistry = new Map(
  getAllNodeSpecMetadata().map((m) => [m.kind, m])
);
```

### Migration from Legacy Nodes

For existing nodes:

1. **Generate equivalent** with `pnpm new:node`
2. **Copy component logic** from old files
3. **Define Zod schema** for existing data
4. **Test validation** with existing workflows
5. **Deploy incrementally** - both systems coexist

## Performance and Scalability

### Bundle Optimization

- **Dynamic Imports**: Nodes loaded on-demand
- **Tree Shaking**: Unused nodes automatically excluded
- **Code Splitting**: Per-domain bundle separation

### Development Performance

- **Hot Reloading**: Instant updates during development
- **TypeScript Compilation**: Incremental builds only
- **Validation Caching**: Schema compilation cached

### Production Performance

- **Lazy Loading**: Nodes loaded when first used
- **Memory Management**: Automatic cleanup of unused components
- **Error Boundaries**: Isolated failure handling per node

## Troubleshooting

### Common Issues (Rare with Automation)

#### Node Not Appearing

- **Check**: Registry import/export (automatically handled)
- **Verify**: NodeSpec export in `.node.tsx` file
- **Ensure**: Unique `kind` identifier

#### TypeScript Errors

- **Validate**: Zod schema matches initialData
- **Check**: Proper NodeProps typing
- **Verify**: All required imports present

#### Runtime Validation Errors

- **Review**: Zod schema strictness
- **Check**: initialData parsing
- **Verify**: Handle specifications

### Debug Tools (Built-in)

```typescript
// Development debugging automatically available:
console.log("Node Health:", getHealthScore());
console.log("Validation Errors:", getValidationErrors());
console.log("Performance Metrics:", getPerformanceMetrics());
console.log("Registry Status:", validateNode(nodeType));
```

## Conclusion

The NodeSpec + Plop system provides a **fully automated**, enterprise-grade foundation for node-based workflow development. The system eliminates manual maintenance, ensures consistency, and provides comprehensive validation and monitoring out of the box.

### Key Advantages:

- **🚀 Zero Configuration**: Complete automation from creation to deployment
- **🔒 Enterprise Security**: Built-in XSS protection, validation, and audit trails
- **⚡ Developer Experience**: 30-second node creation, immediate availability
- **🎯 Type Safety**: End-to-end TypeScript + Zod validation
- **📊 Monitoring**: Real-time health scoring and performance metrics
- **🔧 Maintainability**: Single source of truth, zero manual registry updates
- **🌐 Scalability**: Dynamic loading, bundle optimization, memory management

### Workflow Summary:

```bash
# Create a new node (30 seconds)
pnpm new:node

# Customize implementation (5-30 minutes)
# Edit generated .node.tsx file

# Test immediately (0 seconds)
# Node automatically available in browser

# Deploy (0 seconds configuration)
# Enterprise validation and monitoring included
```

This system represents a significant advancement in node-based architecture, providing the automation, safety, and enterprise features needed for complex workflow applications while maintaining an exceptional developer experience.

### Future Enhancements (Already Planned):

- **Visual Node Builder**: GUI for non-developers
- **Schema Generator**: AI-assisted Zod schema creation
- **Testing Framework**: Automated node behavior testing
- **Analytics Dashboard**: Node usage and performance analytics

# Node Creation with Plop - Unified Theming System

## Overview

The Plop node template has been updated to use the **unified theming system** with semantic tokens. All new nodes created with `pnpm run create-node` will automatically:

- ✅ Use semantic tokens for consistent styling
- ✅ Support automatic light/dark mode switching
- ✅ Maintain visual consistency across all nodes
- ✅ Follow enterprise-grade styling patterns

## Unified Theming Features

### Semantic Token Integration

New nodes automatically use semantic tokens:

```tsx
// Old approach (manual Tailwind)
className =
  "bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700";

// New approach (semantic tokens)
className =
  "bg-[hsl(var(--core-node-bg))] border-[hsl(var(--core-node-border))]";
```

### Centralized Style Constants

The template includes `UNIFIED_NODE_STYLES` constants for:

- Container styling (background, borders, hover states)
- Content area layouts (expanded/collapsed)
- Header styling (titles, health indicators)
- Main content styling (icons, text, centering)

### Automatic Theme Consistency

All new nodes will automatically match:

- Node Inspector theming
- Sidebar component styling
- Action Toolbar appearance
- History Panel colors
- Canvas and Controls theming

## Usage

Create a new node with unified theming:

```bash
pnpm run create-node
```

The generated node will include:

- Semantic token-based styling
- Consistent color scheme
- Proper contrast ratios
- Smooth transitions
- Enterprise validation patterns

## Customization

To customize node appearance while maintaining consistency:

1. **Modify UNIFIED_NODE_STYLES**: Update the style constants in your generated node
2. **Add semantic tokens**: Extend the token system in `tokens.json` if needed
3. **Use arbitrary values**: Apply semantic tokens with `bg-[hsl(var(--your-token))]` syntax

## Migration

Existing nodes can be migrated to use the unified theming system by:

1. Replacing manual Tailwind classes with semantic tokens
2. Adding the `UNIFIED_NODE_STYLES` constants
3. Using the centralized styling approach

This ensures all nodes maintain visual consistency and automatically adapt to theme changes.
