# NodeCore Documentation

## Overview

This section contains **auto-generated documentation** for the core node infrastructure components. All documentation is automatically generated from the actual source code and updated when the code changes.

## 📚 Available Documentation

### NodeSpec System
- **[NodeSpec.md](./NodeSpec.md)** - Complete interface analysis and type definitions
- **[NodeSpec.html](./NodeSpec.html)** - Interactive HTML documentation with search

The NodeSpec system is the **core contract and blueprint** for all nodes in the flow engine. It defines:
- **Visual appearance** (size, icon, colors, theming)
- **Data structure** (schema, initial data, validation)
- **Connections** (input/output handles with type safety)
- **Behavior** (runtime execution, memory, controls)
- **Metadata** (author, description, tags, categorization)

### withNodeScaffold System
- **[withNodeScaffold.md](./withNodeScaffold.md)** - Function analysis and usage patterns
- **[withNodeScaffold.html](./withNodeScaffold.html)** - Interactive HTML documentation

The withNodeScaffold system provides **automated scaffolding and infrastructure** for all node components:
- **Consistent UI patterns** - Borders, backgrounds, shadows, hover states
- **Dynamic sizing** - Automatic expansion/collapse based on node data
- **Theming integration** - Category-based colors and styling
- **Interaction handling** - Drag, select, focus, resize behaviors
- **Accessibility** - ARIA labels, keyboard navigation, screen reader support

## 🔄 Auto-Generation

All documentation in this folder is **automatically generated** from the actual source code:

### Source Files Analyzed
- `features/business-logic-modern/infrastructure/node-core/NodeSpec.ts`
- `features/business-logic-modern/infrastructure/node-core/withNodeScaffold.tsx`

### Generation Process
1. **TypeScript AST Analysis** - Parses actual source code
2. **Interface Extraction** - Extracts real interfaces and types
3. **Usage Analysis** - Scans codebase for usage patterns
4. **Documentation Generation** - Creates markdown and HTML
5. **Statistics Collection** - Tracks adoption rates and patterns

### Regenerating Documentation
```bash
# Generate fresh documentation from source code
pnpm generate:nodespec-docs

# This will:
# ✅ Analyze actual source code
# ✅ Extract real interfaces and types
# ✅ Update all documentation files
# ✅ Generate usage statistics
```

## 📊 Current Statistics

### NodeSpec Analysis
- **Interfaces Found**: 4
- **Types Defined**: 0
- **Required Properties**: 12
- **Optional Properties**: 15

### Scaffold Analysis
- **Functions Found**: 1
- **Types Defined**: 0
- **Usage Statistics**: 3/4 nodes use scaffold
- **Adoption Rate**: 75.0%
- **Common Patterns**: Dynamic spec pattern

## 🎯 Usage Examples

### NodeSpec Usage
```typescript
const nodeSpec: NodeSpec = {
  kind: "createText",
  displayName: "Create Text",
  category: "CREATE",
  size: {
    expanded: EXPANDED_SIZES.VE2,
    collapsed: COLLAPSED_SIZES.C2
  },
  handles: [
    { id: "output", position: "right", type: "source", dataType: "String" }
  ],
  initialData: {
    store: "Default text",
    isEnabled: true,
    isExpanded: false
  }
};
```

### Scaffold Usage
```typescript
// Basic usage
const MyNodeWithScaffold = withNodeScaffold(spec, MyNodeComponent);

// Dynamic spec pattern
const MyNodeWithDynamicSpec = (props: NodeProps) => {
  const { nodeData } = useNodeData(props.id, props.data);
  
  const dynamicSpec = useMemo(() => ({
    ...baseSpec,
    size: {
      expanded: EXPANDED_SIZES[nodeData.expandedSize] || EXPANDED_SIZES.VE2,
      collapsed: COLLAPSED_SIZES[nodeData.collapsedSize] || COLLAPSED_SIZES.C2
    }
  }), [nodeData.expandedSize, nodeData.collapsedSize]);
  
  const ScaffoldedNode = useMemo(
    () => withNodeScaffold(dynamicSpec, MyNodeComponent),
    [dynamicSpec]
  );
  
  return <ScaffoldedNode {...props} spec={dynamicSpec} />;
};
```

## 🔗 Integration Points

### NodeSpec Integration
- **Node Registry** - Registers and manages node types
- **Flow Editor** - Creates nodes from specs
- **Node Inspector** - Generates controls from schema
- **Theming System** - Applies visual styling
- **Memory System** - Configures per-node caching
- **Runtime Engine** - Executes node logic
- **Handle System** - Manages connections with type safety

### Scaffold Integration
- **NodeSpec System** - Uses spec for sizing, theming, metadata
- **Theme System** - Applies category-based and custom theming
- **Flow Editor** - Handles drag, select, focus interactions
- **Node Inspector** - Provides edit and configuration access
- **Memory System** - Preserves state across interactions
- **Accessibility System** - Provides ARIA labels and keyboard navigation

## 📝 Development Workflow

### 1. Modify Source Code
Edit `NodeSpec.ts` or `withNodeScaffold.tsx` as needed.

### 2. Regenerate Documentation
```bash
pnpm generate:nodespec-docs
```

### 3. Review Changes
Check the generated documentation to ensure it reflects your changes.

### 4. Commit Changes
Include both source code and updated documentation in your commit.

## 🎨 Documentation Features

### Auto-Generated Content
- **Interface Analysis** - Complete property breakdown with types
- **Function Analysis** - Parameter types and return values
- **Usage Statistics** - Real adoption rates and patterns
- **Type Definitions** - Actual TypeScript types from source
- **JSDoc Comments** - Preserved documentation from source

### Interactive Features
- **Search & Filter** - Find specific interfaces or properties
- **Type Navigation** - Click through to related types
- **Usage Tracking** - See how components are actually used
- **Statistics Dashboard** - Visual representation of adoption

---

*This documentation is auto-generated from the actual source code. Any changes to the source files will be reflected in the next generation.* 