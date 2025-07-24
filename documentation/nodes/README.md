# Node Documentation

Welcome to the comprehensive node documentation for Agenitix-2. This documentation is automatically generated when new nodes are created with Plop.

## 📚 Documentation Structure

### Node Documentation
Each node includes:
- **📄 Markdown Documentation** - Comprehensive guides with examples
- **🌐 HTML Documentation** - Interactive documentation with search and navigation
- **🔧 API Reference** - TypeScript types and interfaces
- **💡 Usage Examples** - Real-world implementation examples
- **🔍 Troubleshooting** - Common issues and solutions

### System Overview
- **📋 Nodes Overview** - Complete inventory of all available nodes
- **🎯 Category Navigation** - Browse nodes by domain and category
- **📊 Statistics Dashboard** - Node counts and system metrics
- **🔍 Quick Search** - Find nodes by type, category, or features

### Handle System Documentation
- **🔗 Handle System** - Complete handle type system and validation
- **📚 Type Reference** - Handle type compatibility and usage patterns
- **🎨 Visual Documentation** - Interactive HTML with examples and statistics
- **📊 Handle Analysis** - Usage patterns and system recommendations

### NodeCore Infrastructure Documentation
- **[NodeCore Documentation](../NodeCore/README.md)** - Core node infrastructure components
- **NodeSpec System** - Complete interface analysis and type definitions
- **withNodeScaffold System** - Function analysis and usage patterns
- **Auto-Generated Documentation** - Always up-to-date from source code

## 🎯 Node Categories

### Create Nodes
Nodes that create or generate data.

### View Nodes  
Nodes that display or visualize data.

### Trigger Nodes
Nodes that respond to events or conditions.

### Test Nodes
Nodes for testing and validation.

### Cycle Nodes
Nodes that handle iterative or loop operations.

## 🚀 Quick Start

### Creating a New Node
```bash
# Generate a new node with Plop
pnpm new:node

# This will automatically:
# ✅ Create the node file
# ✅ Update all registries
# ✅ Generate documentation
# ✅ Regenerate CSS tokens
# ✅ Add to sidebar
```

### Viewing Documentation
```bash
# Open documentation in browser
open documentation/nodes/

# View nodes overview
open documentation/nodes/overview.html

# View handle system documentation
open documentation/handles/handle-system.html

# Or view specific node docs
open documentation/nodes/create/your-node.html
```

## 📖 Documentation Features

### Auto-Generated Content
- **Node Specification** - Complete NodeSpec configuration
- **Data Schema** - Zod schema with validation rules
- **Input/Output Documentation** - All handles and connections
- **Usage Examples** - Basic and advanced usage patterns
- **Integration Guides** - Theming, validation, and inspector controls
- **Troubleshooting** - Common issues and solutions

### Interactive Features
- **Search & Filter** - Find specific tokens or properties
- **Category Navigation** - Browse by node category
- **Code Examples** - Syntax-highlighted TypeScript examples
- **API Reference** - Complete TypeScript interfaces

## 🎨 Theming Integration

All nodes automatically integrate with the design system:

- **Category Colors** - Each category has specific theming tokens
- **CSS Variables** - Automatic generation from `tokens.json`
- **Responsive Design** - Works across all screen sizes
- **Dark/Light Mode** - Automatic theme switching

## 🔧 Development Workflow

### 1. Create Node
```bash
pnpm new:node
```

### 2. Customize Node
Edit the generated node file to add your specific functionality.

### 3. Test Node
```bash
pnpm dev
```

### 4. Update Documentation
Documentation is automatically updated when you modify the node schema.

## 📁 File Structure

```
documentation/
├── nodes/               # Node documentation
│   ├── create/          # Create node documentation
│   ├── view/            # View node documentation  
│   ├── trigger/         # Trigger node documentation
│   ├── test/            # Test node documentation
│   ├── cycle/           # Cycle node documentation
│   ├── overview.html    # Interactive nodes overview
│   ├── OVERVIEW.md      # Markdown nodes overview
│   └── README.md        # This file
├── handles/             # Handle system documentation
│   ├── HANDLE_SYSTEM.md # Complete handle documentation
│   ├── TYPE_REFERENCE.md # Type reference and compatibility
│   └── handle-system.html # Interactive HTML documentation
├── api/                 # API reference files
└── tokens-preview.html  # Design tokens documentation
```

## 🎯 Node Standards

All nodes follow these standards:

- ✅ **Type-safe** - Full TypeScript support with Zod validation
- ✅ **Schema-driven** - Controls auto-generated from data schema
- ✅ **Themed** - Category-specific design system integration
- ✅ **Expandable** - Collapsed and expanded UI states
- ✅ **Validated** - Enterprise-grade error handling
- ✅ **Documented** - Auto-generated comprehensive documentation

## 🔍 Finding Documentation

### By Category
- **Create Nodes**: `documentation/nodes/create/`
- **View Nodes**: `documentation/nodes/view/`
- **Trigger Nodes**: `documentation/nodes/trigger/`
- **Test Nodes**: `documentation/nodes/test/`
- **Cycle Nodes**: `documentation/nodes/cycle/`

### By Node Type
Each node has three documentation files:
- `node-name.md` - Markdown documentation
- `node-name.html` - Interactive HTML documentation
- `api/node-name.ts` - API reference

### Handle System
- **Handle System**: `documentation/handles/HANDLE_SYSTEM.md`
- **Type Reference**: `documentation/handles/TYPE_REFERENCE.md`
- **Interactive Docs**: `documentation/handles/handle-system.html`

## 🚀 Next Steps

1. **Browse Existing Nodes** - Check out the documentation for existing nodes
2. **Create Your First Node** - Use `pnpm new:node` to create a new node
3. **Customize Documentation** - Modify the generated documentation as needed
4. **Share Knowledge** - Add examples and use cases to help others

---

*This documentation is automatically generated and maintained by the Node Documentation Generator.* 
- [Create Text](./create/createText.md) - The Create Text node provides functionality for create operations in the CREATE category.

- [createText](./create/createText.md) - The createText node provides functionality for create operations in the CREATE category.





- [View Text](./view/viewText.md) - The View Text node provides functionality for view operations in the VIEW category.



- [testNode](./test/testNode.md) - The testNode node provides functionality for test operations in the TEST category.

- [triggerToggle](./trigger/triggerToggle.md) - The triggerToggle node provides functionality for trigger operations in the TRIGGER category.
