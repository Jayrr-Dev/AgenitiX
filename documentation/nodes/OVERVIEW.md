# Nodes Overview

This document provides a comprehensive overview of all available nodes in the Agenitix-2 system.

## 📊 Statistics

- **Total Nodes:** 8
- **Total Domains:** 9
- **Total Categories:** 6
- **Last Updated:** 7/29/2025, 2:43:47 PM

## 🎯 Quick Navigation

### Create Domain
- [create](#create-create) (2 nodes)

### View Domain
- [view](#view-view) (1 nodes)

### Trigger Domain
- [trigger](#trigger-trigger) (1 nodes)

### Test Domain
- [test](#test-test) (1 nodes)

### Store Domain

### Ai Domain
- [ai](#ai-ai) (1 nodes)

### Email Domain
- [email](#email-email) (2 nodes)

### Flow Domain

### Time Domain

## Create Domain

Nodes that create or generate data, content, or resources

### Create Category

Data creation and generation nodes

**Nodes (2):**

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

#### Store In Memory

- **Type:** `storeInMemory`
- **Domain:** create
- **Category:** create
- **Description:** storeInMemory NODE – Runtime memory storage for workflow data
 
  • Stores data in memory during workflow execution
  • Provides get/set operations for temporary data storage
  • Auto-clears on workflow restart or page refresh
  • Type-safe with Zod schema validation
  • Supports multiple data types (string, number, boolean, JSON)
 
  Keywords: storage, memory, runtime, temporary, workflow-data
- **Features:** Type-safe validation, JSON I/O
- **Theming:** create category
  - **Design Tokens:** var(--node-create-bg), var(--node-create-border), var(--node-create-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\create\storeInMemory.node.tsx`
- **Documentation:** [Markdown](./create/storeInMemory.md) | [HTML](./create/storeInMemory.html)

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
  - **Accessibility:** ⌨️🎯 Supported
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

## Ai Domain

Nodes that handle ai operations

### Ai Category

Nodes that handle ai operations

**Nodes (1):**

#### AiAgent

- **Type:** `aiAgent`
- **Domain:** ai
- **Category:** ai
- **Description:** AiAgent NODE – Content‑focused, schema‑driven, type‑safe
 
  • Shows only internal layout; the scaffold provides borders, sizing, theming, and interactivity.
  • Zod schema auto‑generates type‑checked Inspector controls.
  • Dynamic sizing (expandedSize / collapsedSize) drives the spec.
  • Output propagation is gated by `isActive` and `isEnabled` to prevent runaway loops.
  • Code is fully commented and follows current React + TypeScript best practices.
 
  Keywords: ai-agent, schema-driven, type‑safe, clean‑architecture
- **Features:** JSON I/O
- **Theming:** ai category
  - **Design Tokens:** var(--node-ai-bg), var(--node-ai-border), var(--node-ai-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\ai\aiAgent.node.tsx`
- **Documentation:** [Markdown](./ai/aiAgent.md) | [HTML](./ai/aiAgent.html)

## Email Domain

Nodes for email operations

### Email Category

email category nodes

**Nodes (2):**

#### Email Account

- **Type:** `emailAccount`
- **Domain:** email
- **Category:** email
- **Description:** emailAccount NODE – Email account configuration and authentication
 
  • Handles OAuth2 and manual email account setup
  • Provides secure credential management with Convex integration
  • Supports Gmail, Outlook, IMAP, and SMTP providers
  • Real-time connection validation and status updates
  • Type-safe with comprehensive error handling
 
  Keywords: email-account, oauth2, authentication, providers
- **Features:** Type-safe validation, JSON I/O
- **Theming:** email category
  - **Design Tokens:** var(--node-email-bg), var(--node-email-border), var(--node-email-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\email\emailAccount.node.tsx`
- **Documentation:** [Markdown](./email/emailAccount.md) | [HTML](./email/emailAccount.html)

#### Email Reader

- **Type:** `emailReader`
- **Domain:** email
- **Category:** email
- **Description:** emailReader NODE – Email inbox parsing and message retrieval
 
  • Reads emails from configured email accounts (Gmail, Outlook, IMAP)
  • Provides message filtering and search capabilities
  • Supports real-time monitoring and batch processing
  • Extracts message content, attachments, and metadata
  • Type-safe with comprehensive error handling and caching
 
  Keywords: email-reader, inbox, messages, filtering, real-time
- **Features:** Type-safe validation, JSON I/O
- **Theming:** email category
  - **Design Tokens:** var(--node-email-bg), var(--node-email-border), var(--node-email-text)
  - **Responsive:**  Not optimized
  - **Accessibility:** 🎯 Supported
- **File:** `\features\business-logic-modern\node-domain\email\emailReader.node.tsx`
- **Documentation:** [Markdown](./email/emailReader.md) | [HTML](./email/emailReader.html)

## Flow Domain

Nodes for flow operations

## Time Domain

Nodes for time operations

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
