# Category Management System

## Overview

The Category Management System provides a **single source of truth** approach for managing node categories across the entire Agenitix-2 codebase. Instead of manually updating 25+ files when adding or removing categories, this system automates the entire process through a Plop generator.

## 🎯 **Why This System?**

### **Before (Manual Approach)**
- ❌ **25+ files** to update manually
- ❌ **High risk** of missing files
- ❌ **Inconsistent** updates
- ❌ **Time-consuming** process
- ❌ **Error-prone** manual work

### **After (Automated Approach)**
- ✅ **Single command** to add/remove categories
- ✅ **Consistent** updates across all files
- ✅ **Zero risk** of missing files
- ✅ **Fast** and reliable
- ✅ **Maintainable** system

## 🚀 **Quick Start**

### **Add a New Category**
```bash
# Interactive mode
pnpm new:category

# Or directly
pnpm plop category
```

### **List Current Categories**
```bash
pnpm plop category
# Then select "List current categories"
```

## 📋 **Category Management Commands**

### **1. Add New Category**
```bash
pnpm new:category
```

**Prompts:**
- **Action**: "Add a new category"
- **Category Name**: UPPERCASE name (e.g., `PROCESS`, `ANALYZE`, `TRANSFORM`)
- **Domain Name**: lowercase name (e.g., `process`, `analyze`, `transform`)
- **Description**: What this category is for
- **Color**: Hex color for theming (e.g., `#3b82f6`)
- **Add to Sidebar**: Whether to include in sidebar tabs

### **2. List Categories**
```bash
pnpm plop category
# Select "List current categories"
```

### **3. Remove Category** (Future Feature)
```bash
pnpm plop category
# Select "Remove an existing category"
```

## 🔧 **What Gets Updated Automatically**

When you add a new category, the system updates **26 files** across the codebase:

### **Core Definitions**
1. **`categories.ts`** - Main category definitions
2. **`nodeData.ts`** - TypeScript type definitions
3. **`sidebar/types.ts`** - Sidebar tab configuration
4. **`sidebar/constants.ts`** - Sidebar variant configuration

### **Theming System**
5. **`nodeStyleStore.ts`** - Category theme definitions
6. **`BaseControl.tsx`** - Inspector control styling
7. **`NodeOutput.tsx`** - Output component styling
8. **`ThemedMiniMap.tsx`** - Mini-map color mapping

### **Documentation & Scripts**
9. **`generate-nodes-overview.ts`** - Documentation generation
10. **`gen-docs-tokens.ts`** - Token documentation
11. **`generate-handle-docs.ts`** - Handle documentation
12. **`validate-adapter-logic.js`** - Validation scripts

### **Configuration Files**
13. **`plopfile.js`** - Plop generator choices
14. **`tsconfig.json`** - TypeScript path mappings
15. **`package.json`** - Script definitions

### **Directory Structure**
16. **Domain directory** - `node-domain/{domain}/`
17. **Documentation directory** - `documentation/nodes/{domain}/`

### **Generated Files**
18. **CSS tokens** - Auto-generated via `pnpm generate:tokens`
19. **Documentation** - Auto-generated via `pnpm generate:node-docs`

## 📁 **File Structure After Adding a Category**

```
features/business-logic-modern/
├── node-domain/
│   ├── create/
│   ├── view/
│   ├── trigger/
│   ├── test/
│   ├── cycle/
│   └── {new-domain}/          # ← New domain directory
│       └── .gitkeep
├── infrastructure/
│   ├── theming/
│   │   ├── categories.ts      # ← Updated with new category
│   │   └── stores/
│   │       └── nodeStyleStore.ts  # ← Updated with theme
│   ├── sidebar/
│   │   ├── types.ts           # ← Updated with tab config
│   │   └── constants.ts       # ← Updated with variants
│   └── node-inspector/
│       ├── controls/
│       │   └── BaseControl.tsx    # ← Updated with styling
│       └── components/
│           └── NodeOutput.tsx     # ← Updated with styling
└── flow-engine/
    └── types/
        └── nodeData.ts        # ← Updated with domain type

documentation/
└── nodes/
    └── {new-domain}/          # ← New documentation directory
        └── .gitkeep

scripts/
├── generate-nodes-overview.ts # ← Updated with domain
├── gen-docs-tokens.ts         # ← Updated with tokens
└── generate-handle-docs.ts    # ← Updated with domains
```

## 🎨 **Category Theming**

Each category gets automatic theming support:

### **CSS Variables Generated**
```css
/* Light mode */
--node-{domain}-bg: {color};
--node-{domain}-bg-hover: {color-hover};
--node-{domain}-border: {border-color};
--node-{domain}-text: {text-color};
--node-{domain}-text-secondary: {secondary-text};

/* Dark mode */
--node-{domain}-bg-dark: {dark-color};
--node-{domain}-bg-hover-dark: {dark-hover};
--node-{domain}-border-dark: {dark-border};
--node-{domain}-text-dark: {dark-text};
--node-{domain}-text-secondary-dark: {dark-secondary};
```

### **Component Classes**
```typescript
// Automatic class generation
`bg-node-${domain}`
`border-node-${domain}`
`text-node-${domain}-text`
`hover:bg-node-${domain}-hover`
```

## 🔍 **Validation Rules**

### **Category Name**
- ✅ Must be UPPERCASE
- ✅ Letters, numbers, and underscores only
- ✅ Maximum 20 characters
- ✅ Cannot be empty

### **Domain Name**
- ✅ Must be lowercase
- ✅ Letters and numbers only
- ✅ Maximum 20 characters
- ✅ Cannot be empty

### **Color**
- ✅ Must be valid hex color
- ✅ Format: `#RRGGBB`
- ✅ Example: `#3b82f6`

## 📊 **Current Categories**

| Category | Domain | Description | Color |
|----------|--------|-------------|-------|
| CREATE | create | Nodes that create or generate data | #3b82f6 |
| VIEW | view | Nodes that display or visualize data | #10b981 |
| TRIGGER | trigger | Nodes that respond to events or conditions | #f59e0b |
| TEST | test | Nodes for testing and validation | #ef4444 |
| CYCLE | cycle | Nodes that handle iterative or loop operations | #8b5cf6 |

## 🛠️ **Advanced Usage**

### **Custom Category Configuration**
```bash
# Example: Adding a PROCESS category
pnpm new:category

# Prompts:
# Category Name: PROCESS
# Domain Name: process
# Description: Nodes that handle data processing and transformation
# Color: #06b6d4
# Add to Sidebar: Yes
```

### **Batch Operations** (Future)
```bash
# Future: Add multiple categories at once
pnpm plop category-batch

# Future: Migrate categories between systems
pnpm plop category-migrate
```

## 🔧 **Troubleshooting**

### **Common Issues**

1. **Category already exists**
   - Error: "Category PROCESS already exists"
   - Solution: Choose a different name or remove existing first

2. **Invalid color format**
   - Error: "Please enter a valid hex color"
   - Solution: Use format `#RRGGBB` (e.g., `#3b82f6`)

3. **Domain name conflicts**
   - Error: "Domain name must be unique"
   - Solution: Choose a different domain name

### **Manual Override**
If the generator fails, you can manually update files:

1. **Core files** (required):
   - `features/business-logic-modern/infrastructure/theming/categories.ts`
   - `features/business-logic-modern/infrastructure/flow-engine/types/nodeData.ts`

2. **Regenerate everything**:
   ```bash
   pnpm generate:tokens
   pnpm generate:node-docs
   ```

## 📈 **Benefits**

### **For Developers**
- ✅ **Faster development** - No manual file updates
- ✅ **Consistent codebase** - Automated consistency
- ✅ **Reduced errors** - No missed files
- ✅ **Better maintainability** - Single source of truth

### **For the Project**
- ✅ **Scalable architecture** - Easy to add new categories
- ✅ **Consistent theming** - Automatic color and style generation
- ✅ **Complete documentation** - Auto-generated docs
- ✅ **Type safety** - Full TypeScript support

## 🔮 **Future Enhancements**

### **Planned Features**
- [ ] **Category removal** - Automated cleanup
- [ ] **Category migration** - Move nodes between categories
- [ ] **Batch operations** - Add multiple categories at once
- [ ] **Category templates** - Predefined category configurations
- [ ] **Category validation** - Check for unused categories

### **Integration Points**
- [ ] **CI/CD integration** - Validate category consistency
- [ ] **Documentation auto-generation** - Category-specific docs
- [ ] **Testing automation** - Category-specific test suites
- [ ] **Performance monitoring** - Category usage analytics

---

*This documentation is auto-generated and maintained by the Category Management System.* 