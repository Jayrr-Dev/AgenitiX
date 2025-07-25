# Nodes Overview

This document provides a comprehensive overview of all available nodes in the Agenitix-2 system.

## 📊 Statistics

- **Total Nodes:** 4
- **Total Domains:** 5
- **Total Categories:** 4
- **Last Updated:** 7/24/2025, 6:00:30 PM

## 🎯 Quick Navigation

### Create Domain
- [create](#create-create) (1 nodes)

### View Domain
- [view](#view-view) (1 nodes)

### Trigger Domain
- [trigger](#trigger-trigger) (1 nodes)

### Test Domain
- [test](#test-test) (1 nodes)

### Store Domain

## Create Domain

Nodes that create or generate data, content, or resources

### Create Category

Data creation and generation nodes

**Nodes (1):**

#### Create Text

- **Type:** `createText`
- **Domain:** create
- **Category:** create
- **Description:** createText NODE – Content‑focused, schema‑driven, type‑safe
 
  • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
  • Zod schema auto‑generates type‑checked Inspector controls.
  • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
  • Output propagation is gated by `isActive` and `isEnabled` to prevent runaway loops.
  • Code is fully commented and follows current React + TypeScript best practices.
 
  Keywords: create-text, schema-driven, type‑safe, clean‑architecture
- **Features:** JSON I/O
- **Theming:** create category
  - **Design Tokens:** var(--node-create-bg), var(--node-create-border), var(--node-create-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\create\createText.node.tsx`
- **Documentation:** [Markdown](./create/createText.md) | [HTML](./create/createText.html)

## View Domain

Nodes that display, visualize, or present data

### View Category

Data visualization and display nodes

**Nodes (1):**

#### View Text

- **Type:** `viewText`
- **Domain:** view
- **Category:** view
- **Description:** viewText NODE – Content‑focused, schema‑driven, type‑safe
 
  • Presents incoming text with ZERO structural styling – the surrounding scaffold handles
    borders, sizing, themes, drag/selection states, etc.
  • Zod‑based schema gives auto‑generated, type‑checked Inspector controls.
  • Dynamic sizing is driven directly by node data (expandedSize / collapsedSize).
  • All data handling is funnelled through one formatter (formatValue) to avoid duplication.
  • Strict separation of responsibilities:
      – createDynamicSpec: returns a NodeSpec based only on data               (pure)
      – ViewTextNode:      deals with React‑Flow store & data propagation       (impure)
  • Memoised helpers & refs prevent unnecessary renders / infinite loops.
- **Features:** JSON I/O
- **Theming:** view category
  - **Design Tokens:** var(--node-view-bg), var(--node-view-border), var(--node-view-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\view\viewText.node.tsx`
- **Documentation:** [Markdown](./view/viewText.md) | [HTML](./view/viewText.html)

## Trigger Domain

Nodes that respond to events, conditions, or triggers

### Trigger Category

Event-driven and conditional nodes

**Nodes (1):**

#### Toggle

- **Type:** `triggerToggle`
- **Domain:** trigger
- **Category:** trigger
- **Description:** TriggerToggle NODE – Boolean toggle with circular design
 
  ✔ Cycles between ON / OFF and propagates the value to connected nodes.
  ✔ Subscribes to global React‑Flow store so updates ripple automatically.
  ✔ Fully type‑safe (Zod) + focus‑preserving scaffold memoisation.
 
  Keywords: toggle‑button, boolean‑state, circular‑design, trigger‑control
- **Theming:** trigger category
  - **Design Tokens:** var(--node-trigger-bg), var(--node-trigger-border), var(--node-trigger-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\trigger\triggerToggle.node.tsx`
- **Documentation:** [Markdown](./trigger/triggerToggle.md) | [HTML](./trigger/triggerToggle.html)

## Test Domain

Nodes for testing, validation, and quality assurance

### Test Category

Testing and validation nodes

**Nodes (1):**

#### TestNode

- **Type:** `testNode`
- **Domain:** test
- **Category:** test
- **Description:** TestNode NODE – Content‑focused, schema‑driven, type‑safe
 
  • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
  • Zod schema auto‑generates type‑checked Inspector controls.
  • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
  • Output propagation is gated by `isActive` and `isEnabled` to prevent runaway loops.
  • Code is fully commented and follows current React + TypeScript best practices.
 
  Keywords: test-node, schema-driven, type‑safe, clean‑architecture
- **Features:** JSON I/O
- **Theming:** test category
  - **Design Tokens:** var(--node-test-bg), var(--node-test-border), var(--node-test-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\test\testNode.node.tsx`
- **Documentation:** [Markdown](./test/testNode.md) | [HTML](./test/testNode.html)

## Store Domain

For nodes that store data

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
