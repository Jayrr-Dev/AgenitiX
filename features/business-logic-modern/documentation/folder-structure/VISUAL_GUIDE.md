# Visual Architecture Guide

## 🎯 System Overview - Bird's Eye View

```
📦 MODERN BUSINESS LOGIC SYSTEM
│
├── 🏢 DOMAINS (Business Areas)
│   ├── 📝 Content Creation    ← Text, media nodes
│   ├── ⚡ Automation Triggers ← Timers, events  
│   ├── 📊 Data Visualization  ← Charts, outputs
│   └── 🐛 Testing & Debugging ← Error handling
│
├── 🏗️ INFRASTRUCTURE (Shared Services)
│   ├── 🎨 Theming           ← Colors, styles
│   ├── 📦 Components        ← Reusable UI
│   ├── ⚙️ Flow Engine       ← Visual editor
│   ├── 📋 Registries        ← Node catalogs
│   └── 🔄 Data Flow         ← State management
│
├── 📚 DOCUMENTATION ← You are here!
├── 🔧 TOOLING       ← Dev scripts
└── 🧪 TESTING       ← Test files
```

---

## 🔄 How Data Flows Through the System

```
USER INTERACTION FLOW:

1. 👤 User opens Flow Editor
          ↓
2. 🏗️ Infrastructure/Flow-Engine loads
          ↓
3. 📋 Registries provide available nodes
          ↓
4. 🏢 Domains provide actual node components
          ↓
5. 🎨 Theming applies colors & styles
          ↓
6. 📦 Components render the UI
          ↓
7. 👤 User sees the complete interface
```

---

## 🏗️ Detailed Infrastructure Layout

```
infrastructure/
│
├── 🎨 theming/modern/
│   ├── stores/          ← State management (Zustand)
│   ├── styles/          ← CSS, Tailwind configs
│   └── themes/          ← Dark/light mode
│
├── 📦 components/modern/components/
│   ├── Sidebar.tsx      ← Left panel with nodes
│   ├── NodeInspector.tsx ← Bottom property panel
│   ├── DebugTool.tsx    ← Development helpers
│   └── ActionToolbar.tsx ← Top toolbar buttons
│
├── ⚙️ flow-engine/flow-editor/
│   ├── FlowEditor.tsx   ← Main editor component
│   ├── components/      ← Editor-specific UI
│   ├── hooks/           ← Custom React hooks
│   └── utils/           ← Helper functions
│
├── 📋 registries/modern/
│   └── EnhancedNodeRegistry.ts ← Central node catalog
│
└── 🔄 data-flow/
    └── stores/          ← Global state management
```

---

## 🏢 Domain Structure Pattern

Each domain follows the same pattern:

```
domain-name/
└── nodes/               ← Business logic components
    ├── NodeType1.tsx    ← Actual node implementation
    ├── NodeType2.tsx    ← Another node
    └── ...
```

**Real Examples:**
```
content-creation/nodes/
├── CreateTextEnhanced.tsx
└── CreateTextRefactor.tsx

automation-triggers/nodes/
├── CyclePulseEnhanced.tsx
├── TriggerToggleEnhanced.tsx
└── TriggerOnToggleRefactor.tsx
```

---

## 🔗 Component Relationships

```
COMPONENT HIERARCHY:

FlowEditor.tsx (Main Container)
├── ReactFlowProvider
├── UndoRedoProvider  
└── FlowEditorContent
    ├── Sidebar.tsx           ← Node palette
    ├── DebugTool.tsx         ← Dev tools
    └── FlowCanvas.tsx        ← Main drawing area
        ├── ReactFlow         ← Core editor
        ├── NodeInspector.tsx ← Properties panel
        ├── ActionToolbar.tsx ← Buttons
        └── Node Components   ← From domains
```

---

## 📊 Registry System Visualization

```
HOW NODES GET REGISTERED:

1. Domain creates node:
   domains/content-creation/nodes/CreateText.tsx

2. Registry imports it:
   registries/EnhancedNodeRegistry.ts
   ↓
   import { CreateText } from '../../../domains/...'

3. Registry exports mapping:
   getNodeTypes() {
     return {
       'createText': CreateText,
       // ... other nodes
     }
   }

4. Flow Engine uses mapping:
   FlowCanvas.tsx imports getNodeTypes()
   ↓
   ReactFlow uses nodeTypes prop
   ↓
   Renders correct component for each node
```

---

## 🎯 File Placement Decision Tree

```
"Where should I put my new file?"

📄 NEW FILE
    ↓
Is it business logic? (nodes, domain-specific features)
    ↓ YES
🏢 Put in domains/[relevant-domain]/
    ↓ NO
Is it shared UI? (buttons, panels, reusable components)  
    ↓ YES
📦 Put in infrastructure/components/modern/
    ↓ NO
Is it styling? (colors, themes, CSS)
    ↓ YES  
🎨 Put in infrastructure/theming/modern/
    ↓ NO
Is it core editor functionality?
    ↓ YES
⚙️ Put in infrastructure/flow-engine/
    ↓ NO
Is it documentation?
    ↓ YES
📚 Put in documentation/
    ↓ NO
🤔 Ask for help - might need new category!
```

---

## 🚀 Development Workflow Diagram

```
ADDING A NEW NODE:

1. 📝 Create node component
   domains/[domain]/nodes/MyNewNode.tsx
          ↓
2. 📋 Register the node  
   registries/EnhancedNodeRegistry.ts
   → Add import
   → Add to getNodeTypes()
          ↓
3. 🎨 Style if needed
   theming/modern/ (if custom styles)
          ↓
4. 🧪 Test the node
   testing/ (add tests)
          ↓
5. 📚 Document it
   documentation/ (update docs)
          ↓
6. ✅ Ready to use!
   Node appears in sidebar automatically
```

---

## 🔍 Finding Files Quick Reference

**Need to find:**

| What you're looking for | Go to |
|------------------------|-------|
| 🎯 **Node implementations** | `domains/[domain]/nodes/` |
| 🎨 **Colors, themes** | `infrastructure/theming/modern/` |
| 📦 **UI components** | `infrastructure/components/modern/` |
| ⚙️ **Main editor** | `infrastructure/flow-engine/flow-editor/` |
| 📋 **Node registration** | `infrastructure/registries/modern/` |
| 🔄 **State management** | `infrastructure/theming/modern/stores/` |
| 📚 **Documentation** | `documentation/` |
| 🧪 **Tests** | `testing/` |
| 🔧 **Dev tools** | `tooling/` |

---

## 🎪 Real-World Analogy

Think of this system like a **modern shopping mall**:

```
🏬 THE MALL (Modern Business Logic System)
│
├── 🏪 STORES (Domains)
│   ├── 📚 Bookstore (Content Creation)
│   ├── ⚡ Electronics (Automation)  
│   ├── 🎨 Art Gallery (Data Viz)
│   └── 🔧 Repair Shop (Testing)
│
├── 🏢 MALL SERVICES (Infrastructure)
│   ├── 🚽 Restrooms (Components - everyone uses)
│   ├── 🎵 PA System (Theming - affects whole mall)
│   ├── 🗺️ Directory (Registry - shows what's where)
│   └── 🛠️ Maintenance (Flow Engine - keeps it running)
│
├── 📋 Mall Map (Documentation)
├── 🔧 Management Office (Tooling)
└── 🛡️ Security (Testing)
```

**Key insight**: 
- Each store (domain) has its own specialty
- Mall services (infrastructure) serve everyone
- Directory (registry) helps people find stores
- Management keeps everything organized

This is exactly how our code is organized! 🎯 