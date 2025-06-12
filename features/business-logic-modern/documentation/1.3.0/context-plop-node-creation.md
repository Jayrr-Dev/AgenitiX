# Context: Plop Node Creation System

## Overview

This document provides a comprehensive guide to the **NodeSpec + Plop** architecture used in Agenitix-2 for creating and managing workflow nodes. This system represents a modern, enterprise-grade approach to node-based workflow development with automated scaffolding, type safety, and comprehensive validation.

## Architecture Philosophy

### Single Source of Truth
Each node is defined in a single `.node.tsx` file that contains:
- **NodeSpec**: Metadata, configuration, and schema
- **Component**: React UI component
- **Validation**: Zod schema with enterprise error handling
- **Export**: Both the component and spec for registry access

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
  kind: string;                    // Unique identifier (camelCase)
  displayName: string;             // Human-readable name
  category: NodeCategory;          // Functional category (CREATE, VIEW, etc.)
  size: {
    expanded: SizeConfig;          // Expanded state dimensions
    collapsed: SizeConfig;         // Collapsed state dimensions
  };
  handles: HandleSpec[];           // Input/output connection points
  inspector: {
    key: string;                   // Inspector component identifier
  };
  initialData: any;                // Default data from Zod schema
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

#### Generated Files
- **Node File**: `features/business-logic-modern/node-domain/{domain}/{kind}.node.tsx`
- **Registry Updates**: Automatic registration in `useDynamicNodeTypes.ts`
- **Index Updates**: Export added to domain index

### 3. Registry System

#### Modern Node Registry
**File**: `features/business-logic-modern/infrastructure/node-registry/modern-node-registry.ts`

**Purpose**: 
- Provides metadata for sidebar, inspector, and theming
- Maintains backward compatibility with existing systems
- Bridges NodeSpec architecture with legacy interfaces

#### Dynamic Node Types
**File**: `features/business-logic-modern/infrastructure/flow-engine/hooks/useDynamicNodeTypes.ts`

**Purpose**:
- Provides `nodeTypes` object for React Flow
- Maps node type strings to actual components
- Automatically updated by Plop generator

## Node Creation Workflow

### 1. Using Plop Generator

```bash
# Start the generator
pnpm new:node

# Follow prompts:
# ? What is the kind of the node? → myCustomNode
# ? What is the domain of the node? → create
# ? What is the functional category of the node? → CREATE
```

### 2. Generated Node Structure

```typescript
// myCustomNode.node.tsx
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

// 1. DATA SCHEMA (Enterprise Validation)
const MyCustomNodeDataSchema = z.object({
  // Define your node's data structure
}).strict();

type MyCustomNodeData = z.infer<typeof MyCustomNodeDataSchema>;

// 2. NODE SPECIFICATION
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
    // Add your specific handles
  ],
  inspector: {
    key: 'MyCustomNodeInspector',
  },
  initialData: MyCustomNodeDataSchema.parse({}),
};

// 3. COMPONENT (Enterprise Standards)
const MyCustomNodeComponent = ({ data, id }: NodeProps) => {
  const [isExpanded, setExpanded] = useState(true);
  
  // Enterprise validation
  const validationResult = validateNodeData(data);
  const nodeData = validationResult.data;
  
  // Error reporting
  if (!validationResult.success) {
    reportValidationError('MyCustomNode', id, validationResult.errors, {
      originalData: validationResult.originalData,
      component: 'MyCustomNodeComponent',
    });
  }

  // Real-time validation hook
  const { updateData, getHealthScore } = useNodeDataValidation(
    MyCustomNodeDataSchema,
    'MyCustomNode',
    nodeData,
    id
  );

  // UI implementation...
  return (
    <>
      <ExpandCollapseButton isExpanded={isExpanded} onToggle={() => setExpanded(!isExpanded)} />
      {/* Your node UI */}
    </>
  );
};

// 4. EXPORT (HOC + Spec)
export default withNodeScaffold(spec, MyCustomNodeComponent);
export { spec }; // For registry access
```

### 3. Automatic Registration

Plop automatically updates:

#### useDynamicNodeTypes.ts
```typescript
// Auto-added import
import myCustomNode from '../../../node-domain/create/myCustomNode.node';

// Auto-added to nodeTypes
const nodeTypes = useMemo(() => ({
  testErrorV2U,
  viewOutputV2U,
  myCustomNode, // ← Added automatically
}), []);
```

#### modern-node-registry.ts
```typescript
// Manual addition required (for now)
const nodeMetadata = {
  // existing nodes...
  myCustomNode: {
    nodeType: 'myCustomNode',
    displayName: 'My Custom Node',
    category: CATEGORIES.CREATE,
    // ... metadata
  },
};
```

## Node Standards

### Visual States
All nodes must implement:
1. **Collapsed State**: Minimal icon representation
2. **Expanded State**: Full controls and configuration

### Standard Features
- **JSON Input**: For programmatic control
- **Expand/Collapse Button**: Top-left toggle
- **Selection State**: White glow when selected
- **Activation State**: Green glow when active
- **Error State**: Red indication for validation errors

### Data Flow
- **Internal Data**: Node's private state
- **Output Data**: Passed to connected nodes
- **Input Validation**: Type-safe with Zod schemas
- **Error Handling**: Comprehensive with reporting

### Sizing Standards
- **Collapsed**: 60x60 or 120x60
- **Expanded**: 120x120 or larger based on content

## Enterprise Validation System

### Zod Schema Integration
```typescript
const NodeDataSchema = z.object({
  text: CommonSchemas.text.default('Default text'),
  number: CommonSchemas.number.default(0),
  isEnabled: CommonSchemas.boolean,
  url: CommonSchemas.url,
}).strict();
```

### Common Schemas
- `CommonSchemas.text`: XSS-protected text input
- `CommonSchemas.number`: Validated numeric input
- `CommonSchemas.boolean`: Boolean flag
- `CommonSchemas.url`: URL validation
- `CommonSchemas.email`: Email validation

### Validation Features
- **Real-time Validation**: Updates on every change
- **Error Reporting**: Centralized error tracking
- **Health Scoring**: 0-100% health metrics
- **Audit Trail**: Complete data change history

## Development Workflow

### Creating a New Node

1. **Generate**: `pnpm new:node`
2. **Customize**: Edit the generated `.node.tsx` file
3. **Test**: Node automatically available in React Flow
4. **Register**: Add metadata to registry (manual step)
5. **Deploy**: Node ready for production

### Best Practices

#### Naming Conventions
- **Kind**: camelCase (e.g., `createText`, `viewCsv`)
- **Files**: `{kind}.node.tsx`
- **Components**: `{PascalCase}Component`
- **Schemas**: `{PascalCase}DataSchema`

#### Code Organization
- Keep schemas at the top
- Define spec before component
- Use enterprise validation hooks
- Export both component and spec

#### Error Handling
- Always validate input data
- Report validation errors
- Provide fallback values
- Log health metrics in development

## Integration Points

### React Flow Integration
```typescript
// FlowCanvas.tsx
const nodeTypes = useDynamicNodeTypes();

<ReactFlow
  nodeTypes={nodeTypes}
  // ... other props
/>
```

### Sidebar Integration
```typescript
// Sidebar uses registry metadata
const metadata = getNodeMetadata(nodeType);
// Creates draggable stencils
```

### Inspector Integration
```typescript
// NodeInspector uses registry metadata
const metadata = getNodeMetadata(selectedNode.type);
// Renders appropriate controls
```

## Migration from Legacy System

### Old System (Deprecated)
- Separate `meta.json` files
- Component-only `.tsx` files
- Manual registry maintenance
- Limited validation

### New System (Current)
- Single `.node.tsx` files
- Embedded NodeSpec
- Automatic Plop generation
- Enterprise validation

### Migration Steps
1. Create new `.node.tsx` file using Plop
2. Copy component logic from old file
3. Define Zod schema for data
4. Update registry metadata
5. Test and validate

## Troubleshooting

### Common Issues

#### Node Not Appearing in Sidebar
- Check registry metadata is added
- Verify category is correct
- Ensure node is exported properly

#### TypeScript Errors
- Verify Zod schema matches data structure
- Check NodeProps typing
- Ensure proper imports

#### Runtime Errors
- Validate initial data with schema
- Check handle specifications
- Verify component exports

### Debug Tools
- Development health scores
- Validation error reporting
- Registry debug utilities
- Console logging in dev mode

## Future Enhancements

### Planned Features
- **Automatic Registry Updates**: Plop updates registry metadata
- **Visual Node Builder**: GUI for creating nodes
- **Schema Generator**: Auto-generate Zod schemas
- **Testing Framework**: Automated node testing

### Performance Optimizations
- **Lazy Loading**: Dynamic imports for large node sets
- **Caching**: Registry metadata caching
- **Bundle Splitting**: Per-domain code splitting

## Conclusion

The NodeSpec + Plop system provides a robust, scalable foundation for node-based workflow development. It combines the best practices of modern React development with enterprise-grade validation and automated tooling, ensuring consistency, type safety, and maintainability across the entire node ecosystem.

Key benefits:
- **Developer Experience**: Automated scaffolding with Plop
- **Type Safety**: Full TypeScript + Zod validation
- **Maintainability**: Single source of truth per node
- **Enterprise Ready**: Comprehensive error handling and monitoring
- **Scalable**: Easy to add new nodes and domains

This system represents a significant advancement over traditional node-based architectures and provides a solid foundation for complex workflow applications. 