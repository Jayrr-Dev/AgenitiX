# Nodes Overview

This document provides a comprehensive overview of all available nodes in the Agenitix-2 system.

## 📊 Statistics

- **Total Nodes:** 1
- **Total Domains:** 4
- **Total Categories:** 1
- **Last Updated:** 7/22/2025, 12:04:29 PM

## 🎯 Quick Navigation

### Create Domain
- [create](#create-create) (1 nodes)

### View Domain

### Trigger Domain

### Test Domain

## Create Domain

Nodes that create or generate data, content, or resources

### Create Category

Data creation and generation nodes

**Nodes (1):**

#### createText

- **Type:** `createText`
- **Domain:** create
- **Category:** create
- **Description:** CREATE TEXT NODE - Clean content-focused implementation
 
  • Focuses ONLY on content and layout - no structural styling
  • withNodeScaffold handles all borders, sizing, theming, interactive states
  • Schema-driven controls in Node Inspector
  • Type-safe data validation with Zod schema
  • Clean separation of concerns for maximum maintainability
 
  Keywords: create-text, content-focused, schema-driven, type-safe, clean-architecture
- **Features:** Type-safe validation, Schema-driven controls, Enterprise validation
- **Theming:** create category
  - **Design Tokens:** var(--node-create-bg), var(--node-create-border), var(--node-create-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\create\createText.node.tsx`
- **Documentation:** [Markdown](./create/createText.md) | [HTML](./create/createText.html)

## View Domain

Nodes that display, visualize, or present data

## Trigger Domain

Nodes that respond to events, conditions, or triggers

## Test Domain

Nodes for testing, validation, and quality assurance

## 🚀 Usage

### Creating New Nodes

```bash
# Generate a new node
pnpm new:node

# This will automatically:
# ✅ Create the node file
# ✅ Update all registries  
# ✅ Generate documentation
# ✅ Add to this overview
```

### Viewing Documentation

```bash
# Open node documentation
open documentation/nodes/

# View specific node docs
open documentation/nodes/create/your-node.html
```

## 📁 File Structure

```
features/business-logic-modern/node-domain/
├── create/           # Create domain nodes
├── view/            # View domain nodes
├── trigger/         # Trigger domain nodes
├── test/            # Test domain nodes
├── cycle/           # Cycle domain nodes
└── custom/          # Custom domain nodes
```

## 🎨 Node Standards

All nodes follow these standards:

- ✅ **Type-safe** - Full TypeScript support with Zod validation
- ✅ **Schema-driven** - Controls auto-generated from data schema
- ✅ **Themed** - Category-specific design system integration
- ✅ **Expandable** - Collapsed and expanded UI states
- ✅ **Validated** - Enterprise-grade error handling
- ✅ **Documented** - Auto-generated comprehensive documentation

---

*This overview is automatically generated and updated when new nodes are created.*
