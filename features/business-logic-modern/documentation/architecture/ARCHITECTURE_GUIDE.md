# Modern Business Logic System - Architecture Guide

## 🏗️ What is This System?

The **Modern Business Logic System** is built using **Domain-Driven Design (DDD)** principles. Think of it like organizing a library - instead of throwing all books randomly on shelves, we group them by subject (domains) and provide common services (infrastructure) that all subjects can use.

---

## 📚 Core Concepts (Simple Explanations)

### What is Domain-Driven Design?

- **Traditional approach**: Put all files by type (all components together, all utilities together)
- **Domain approach**: Put all files by business purpose (all text-creation stuff together, all automation stuff together)
- **Why better**: When you need to work on "text creation", everything you need is in one place

### What are Domains?

Domains are **business areas** - think of them as departments in a company:

- **Content Creation**: Making text, media, content
- **Automation Triggers**: Starting processes, timers, events
- **Data Visualization**: Showing results, charts, outputs
- **Testing & Debugging**: Finding and fixing problems

### What is Infrastructure?

Infrastructure provides **shared services** that all domains use:

- Like the company's IT department, HR, building maintenance
- Things like UI components, data storage, themes that everyone needs

---

## 🗂️ Directory Structure Explained

```
features/business-logic-modern/
├── 📁 domains/              # BUSINESS AREAS (The "Departments")
├── 📁 infrastructure/       # SHARED SERVICES (The "Common Resources")
├── 📁 documentation/        # GUIDES & DOCS
├── 📁 tooling/             # DEVELOPMENT TOOLS
├── 📁 testing/             # TEST FILES
└── 📄 README.md            # MAIN OVERVIEW
```

---

## 🏢 Domains Directory - "The Business Departments"

Each domain contains everything needed for that business area:

```
domains/
├── content-creation/        # 📝 Text, media creation
├── automation-triggers/     # ⚡ Timers, events, triggers
├── data-visualization/      # 📊 Charts, outputs, displays
└── testing-debugging/       # 🐛 Error handling, testing
```

### Inside Each Domain:

```
content-creation/
└── nodes/                   # The actual business logic components
    ├── CreateTextEnhanced.tsx
    ├── CreateTextRefactor.tsx
    └── ...
```

**When to add to domains:**

- ✅ Creating a new text editor → `content-creation/nodes/`
- ✅ Adding a new timer → `automation-triggers/nodes/`
- ✅ Building a chart → `data-visualization/nodes/`

---

## 🏗️ Infrastructure Directory - "The Shared Services"

Infrastructure provides services that multiple domains use:

```
infrastructure/
├── components/             # 📦 UI components (buttons, panels)
├── flow-engine/           # ⚙️ Visual editor engine
├── registries/            # 📋 Central catalogs/lists
├── theming/              # 🎨 Colors, styles, themes
├── data-flow/            # 🔄 Data management
└── infrastructure/        # 🔧 Core systems
```

### Key Infrastructure Parts:

#### 1. **Components** (`infrastructure/components/modern/`)

- **What**: Reusable UI pieces (buttons, sidebars, inspectors)
- **Think of it as**: Company's standard office supplies
- **Example**: A sidebar that any domain can use

#### 2. **Flow Engine** (`infrastructure/flow-engine/`)

- **What**: The visual drag-and-drop editor
- **Think of it as**: The main workspace where people build flows
- **Contains**: Canvas, tools, editing features

#### 3. **Registries** (`infrastructure/registries/modern/`)

- **What**: Central lists of all available nodes/components
- **Think of it as**: Company phone directory
- **Purpose**: Tells the system "what nodes exist and where to find them"

#### 4. **Theming** (`infrastructure/theming/modern/`)

- **What**: Colors, fonts, dark/light mode
- **Think of it as**: Company branding guidelines
- **Contains**: Styles, theme switching, color schemes

---

## 🔧 How Components Work Together

### The Flow Editor Journey:

1. **User opens editor** → Flow Engine loads
2. **Flow Engine asks** → "What nodes are available?" → Registries respond
3. **User drags node** → Registry knows which domain has that node
4. **Node needs UI** → Uses Infrastructure components
5. **Node needs styling** → Uses Infrastructure theming

### Example: Adding a Text Node

```
1. User drags "Create Text" from sidebar
   ↓
2. Registry says: "That's in content-creation/nodes/CreateTextEnhanced"
   ↓
3. Flow Engine loads the component
   ↓
4. Component uses Infrastructure/components for UI
   ↓
5. Component uses Infrastructure/theming for colors
```

---

## 📁 Where to Put New Files

### Adding Business Logic (Nodes):

```
✅ CORRECT: domains/[business-area]/nodes/YourNewNode.tsx
❌ WRONG: infrastructure/components/YourNewNode.tsx
```

### Adding UI Components:

```
✅ CORRECT: infrastructure/components/modern/components/YourComponent.tsx
❌ WRONG: domains/content-creation/YourComponent.tsx
```

### Adding Utilities/Helpers:

```
✅ CORRECT: infrastructure/[relevant-area]/utils/yourHelper.ts
❌ WRONG: domains/content-creation/yourHelper.ts
```

---

## 🚀 Getting Started Workflow

### As a New Developer:

1. **Find your area of work:**

   - Working on text features? → `domains/content-creation/`
   - Working on automation? → `domains/automation-triggers/`
   - Working on UI components? → `infrastructure/components/`

2. **Follow the pattern:**

   - Look at existing files in that area
   - Copy the structure and naming
   - Update the registries if adding new nodes

3. **Common tasks:**
   - **Add new node**: Create in domain → Register in `infrastructure/registries/`
   - **Modify UI**: Edit in `infrastructure/components/`
   - **Change colors**: Edit in `infrastructure/theming/`

---

## 🔍 Key Files to Know

### The Central Registry:

```
infrastructure/registries/modern/EnhancedNodeRegistry.ts
```

- **Purpose**: Lists all available nodes
- **When to edit**: Adding new node types
- **Contains**: Mapping of node names to components

### The Main Editor:

```
infrastructure/flow-engine/flow-editor/FlowEditor.tsx
```

- **Purpose**: The main visual editor
- **When to edit**: Adding editor features
- **Contains**: Canvas, toolbars, interaction logic

### Component Library:

```
infrastructure/components/modern/components/
```

- **Purpose**: Reusable UI pieces
- **When to edit**: Creating shared components
- **Contains**: Sidebars, inspectors, buttons, panels

---

## 🎯 Best Practices

### DO:

- ✅ Put business logic in domains
- ✅ Put shared UI in infrastructure
- ✅ Keep related files together
- ✅ Follow existing naming patterns
- ✅ Update registries when adding nodes

### DON'T:

- ❌ Mix business logic with infrastructure
- ❌ Create domain-specific components in infrastructure
- ❌ Duplicate code across domains
- ❌ Forget to register new nodes

---

## 🆘 Common Questions

**Q: Where do I put a new text editing node?**
**A:** `domains/content-creation/nodes/` then register it

**Q: Where do I put a new sidebar component?**
**A:** `infrastructure/components/modern/components/`

**Q: I need to change colors/themes?**
**A:** `infrastructure/theming/modern/`

**Q: The editor isn't showing my new node?**
**A:** Check if it's registered in `EnhancedNodeRegistry.ts`

**Q: Can I put UI components in domains?**
**A:** Only if they're very specific to that domain. Otherwise use infrastructure.

---

## 🔮 Future Scalability

This architecture grows well because:

- **New domains**: Just add new folder in `domains/`
- **New infrastructure**: Add to `infrastructure/` subdirectories
- **Team collaboration**: Teams can work on different domains independently
- **Maintenance**: Related code stays together

**Think of it like a well-organized city**: residential areas (domains), business district (infrastructure), and clear roads (registries) connecting everything together.
