# Import Aliases Guide - Modern System

## 🎯 Overview

Instead of using long relative paths like `../../../infrastructure/components/modern/components/Button`, we now have clean, semantic aliases that make imports much more readable and maintainable.

---

## 📚 Available Aliases

### 🏢 Domain Aliases (Business Logic)
```typescript
// DOMAIN ROOT
@domains/*          → features/business-logic-modern/domains/*

// SPECIFIC DOMAINS  
@content/*          → domains/content-creation/*
@automation/*       → domains/automation-triggers/*
@visualization/*    → domains/data-visualization/*
@testing/*          → domains/testing-debugging/*
```

### 🏗️ Infrastructure Aliases (Shared Services)
```typescript
// INFRASTRUCTURE ROOT
@infrastructure/*   → features/business-logic-modern/infrastructure/*

// SPECIFIC INFRASTRUCTURE
@components/*       → infrastructure/components/modern/components/*
@ui/*              → infrastructure/components/modern/components/* (same as @components)
@theming/*         → infrastructure/theming/modern/*
@stores/*          → infrastructure/theming/modern/stores/*
@flow-engine/*     → infrastructure/flow-engine/*
@registries/*      → infrastructure/registries/modern/*
```

### 🔧 Utility Aliases
```typescript
// MODERN SYSTEM
@modern/*          → features/business-logic-modern/*

// DOCUMENTATION & TOOLING
@modern-docs/*     → documentation/*
@modern-tooling/*  → tooling/*
@modern-testing/*  → testing/*

// LEGACY SYSTEM (for comparison)
@legacy/*          → features/business-logic-legacy/*
```

---

## 🚀 Before & After Examples

### Example 1: Importing Components

**❌ Before (Relative Paths):**
```typescript
import Sidebar from '../../../infrastructure/components/modern/components/Sidebar';
import NodeInspector from '../../../infrastructure/components/modern/components/node-inspector/NodeInspector';
import ActionToolbar from '../../../infrastructure/components/modern/components/ActionToolbar';
```

**✅ After (Clean Aliases):**
```typescript
import Sidebar from '@components/Sidebar';
import NodeInspector from '@components/node-inspector/NodeInspector';
import ActionToolbar from '@components/ActionToolbar';
```

### Example 2: Importing from Registries

**❌ Before:**
```typescript
import { getNodeTypes } from '../../../infrastructure/registries/modern/EnhancedNodeRegistry';
```

**✅ After:**
```typescript
import { getNodeTypes } from '@registries/EnhancedNodeRegistry';
```

### Example 3: Importing Domain Nodes

**❌ Before:**
```typescript
import { CreateTextEnhanced } from '../../../domains/content-creation/nodes/CreateTextEnhanced';
import { CyclePulseEnhanced } from '../../../domains/automation-triggers/nodes/CyclePulseEnhanced';
```

**✅ After:**
```typescript
import { CreateTextEnhanced } from '@content/nodes/CreateTextEnhanced';
import { CyclePulseEnhanced } from '@automation/nodes/CyclePulseEnhanced';
```

### Example 4: Importing Stores

**❌ Before:**
```typescript
import { useFlowStore } from '../../../infrastructure/theming/modern/stores/flowStore';
import { useVibeModeStore } from '../../../infrastructure/theming/modern/stores/vibeModeStore';
```

**✅ After:**
```typescript
import { useFlowStore } from '@stores/flowStore';
import { useVibeModeStore } from '@stores/vibeModeStore';
```

---

## 🎯 Usage Guidelines

### 1. **Choose the Most Specific Alias**
```typescript
// ✅ GOOD - Use specific domain alias
import MyNode from '@content/nodes/MyNode';

// 🔶 OK - Use broader alias
import MyNode from '@domains/content-creation/nodes/MyNode';

// ❌ AVOID - Use relative paths
import MyNode from '../../../domains/content-creation/nodes/MyNode';
```

### 2. **Consistent Import Grouping**
```typescript
// GROUP 1: External libraries
import React from 'react';
import { ReactFlow } from '@xyflow/react';

// GROUP 2: Domain imports (business logic)
import { CreateTextEnhanced } from '@content/nodes/CreateTextEnhanced';
import { CyclePulseEnhanced } from '@automation/nodes/CyclePulseEnhanced';

// GROUP 3: Infrastructure imports (shared services)
import Sidebar from '@components/Sidebar';
import { useFlowStore } from '@stores/flowStore';

// GROUP 4: Types and utilities
import type { AgenNode } from '@flow-engine/flow-editor/types';
```

### 3. **Domain-Specific Best Practices**

**Content Creation Domain:**
```typescript
// All content-related imports
import CreateTextNode from '@content/nodes/CreateTextEnhanced';
import TextRefactor from '@content/nodes/CreateTextRefactor';
```

**Automation Domain:**
```typescript
// All automation-related imports  
import CyclePulse from '@automation/nodes/CyclePulseEnhanced';
import TriggerToggle from '@automation/nodes/TriggerToggleEnhanced';
```

**Infrastructure Components:**
```typescript
// UI components
import Button from '@components/Button';
import Modal from '@components/Modal';

// Or use @ui alias (same thing)
import Button from '@ui/Button';
import Modal from '@ui/Modal';
```

---

## 🔧 IDE Configuration

### VS Code IntelliSense

These aliases will work automatically in VS Code with TypeScript. You'll get:
- ✅ **Autocomplete** when typing `@content/`
- ✅ **Go to Definition** (Ctrl+Click)
- ✅ **Import suggestions**
- ✅ **Refactoring support**

### WebStorm/IntelliJ

The aliases will be recognized automatically from `tsconfig.json`.

---

## 📁 Alias Reference Table

| Alias | Points To | Use For |
|-------|-----------|---------|
| `@modern/*` | `features/business-logic-modern/*` | Root access |
| `@domains/*` | `domains/*` | Any domain |
| `@content/*` | `domains/content-creation/*` | Text, media nodes |
| `@automation/*` | `domains/automation-triggers/*` | Timers, triggers |
| `@visualization/*` | `domains/data-visualization/*` | Charts, outputs |
| `@testing/*` | `domains/testing-debugging/*` | Error handling |
| `@infrastructure/*` | `infrastructure/*` | Any infrastructure |
| `@components/*` | `infrastructure/components/modern/components/*` | UI components |
| `@ui/*` | `infrastructure/components/modern/components/*` | UI components (alt) |
| `@theming/*` | `infrastructure/theming/modern/*` | Themes, styles |
| `@stores/*` | `infrastructure/theming/modern/stores/*` | State management |
| `@flow-engine/*` | `infrastructure/flow-engine/*` | Editor engine |
| `@registries/*` | `infrastructure/registries/modern/*` | Node catalogs |

---

## 🎨 Real-World Examples

### Creating a New Node Component
```typescript
// domains/content-creation/nodes/AdvancedTextNode.tsx
import React from 'react';
import Button from '@components/Button';           // UI component
import { useFlowStore } from '@stores/flowStore';  // State management

interface AdvancedTextNodeProps {
  data: { text: string; isActive: boolean };
  id: string;
}

export default function AdvancedTextNode({ data, id }: AdvancedTextNodeProps) {
  const { updateNodeData } = useFlowStore();
  
  return (
    <div className="bg-white border rounded p-3">
      <h3>Advanced Text Node</h3>
      <p>{data.text}</p>
      <Button onClick={() => updateNodeData(id, { text: 'Updated!' })}>
        Update Text
      </Button>
    </div>
  );
}
```

### Registering the Node
```typescript
// infrastructure/registries/modern/EnhancedNodeRegistry.ts
import AdvancedTextNode from '@content/nodes/AdvancedTextNode';  // Clean import!

export const getNodeTypes = () => ({
  // ... other nodes
  advancedTextNode: AdvancedTextNode,
});
```

### Using in Flow Editor
```typescript
// infrastructure/flow-engine/flow-editor/components/FlowCanvas.tsx
import { getNodeTypes } from '@registries/EnhancedNodeRegistry';  // Clean!
import NodeInspector from '@components/node-inspector/NodeInspector';  // Clean!
import { useFlowStore } from '@stores/flowStore';  // Clean!
```

---

## 🚫 Common Mistakes to Avoid

### ❌ Mixing Relative and Alias Imports
```typescript
// DON'T mix these styles
import Button from '@components/Button';
import Modal from '../../../infrastructure/components/modern/components/Modal';
```

### ❌ Using Wrong Alias Level
```typescript
// TOO VERBOSE - use more specific alias
import Button from '@infrastructure/components/modern/components/Button';

// BETTER - use specific alias
import Button from '@components/Button';
```

### ❌ Inconsistent Grouping
```typescript
// BAD - mixed grouping
import React from 'react';
import Button from '@components/Button';
import { useState } from 'react';
import MyNode from '@content/nodes/MyNode';

// GOOD - consistent grouping
import React, { useState } from 'react';
import Button from '@components/Button';
import MyNode from '@content/nodes/MyNode';
```

---

## 🔄 Migration Guide

### Automatic Migration Options

#### Option 1: PowerShell Script (Recommended for Windows)
```powershell
# Navigate to the modern system directory
cd features/business-logic-modern

# Preview changes (safe - doesn't modify files)
.\tooling\migrate-imports.ps1 -WhatIf

# Apply the migration
.\tooling\migrate-imports.ps1

# Run with detailed output
.\tooling\migrate-imports.ps1 -Verbose

# Show examples of what gets changed
.\tooling\migrate-imports.ps1 -ShowExamples
```

#### Option 2: Node.js Script (Cross-platform)
```bash
# Navigate to the modern system directory
cd features/business-logic-modern

# Run the migration
node tooling/migrate-imports.js

# Show help
node tooling/migrate-imports.js --help

# Show examples
node tooling/migrate-imports.js --examples
```

### Manual Find & Replace

Use VS Code's find & replace (Ctrl+Shift+H) with regex enabled:

**Replace Component Imports:**
- Find: `from ['"]\.\./\.\./\.\./infrastructure/components/modern/components/([^'"]+)['"]`
- Replace: `from '@components/$1'`

**Replace Registry Imports:**
- Find: `from ['"]\.\./\.\./\.\./infrastructure/registries/modern/([^'"]+)['"]`
- Replace: `from '@registries/$1'`

**Replace Store Imports:**
- Find: `from ['"]\.\./\.\./\.\./infrastructure/theming/modern/stores/([^'"]+)['"]`
- Replace: `from '@stores/$1'`

---

## ✅ Benefits of Using Aliases

1. **🎯 Readability**: `@components/Button` vs `../../../infrastructure/components/modern/components/Button`
2. **🔧 Maintainability**: Move files without breaking imports
3. **⚡ Development Speed**: Faster typing, better autocomplete  
4. **🧠 Mental Model**: Aliases match our domain architecture
5. **🔍 Searchability**: Easy to find all component imports with `@components`
6. **📁 Refactoring**: Easier to restructure folders

---

🎉 **Start using these aliases immediately!** They'll make your imports much cleaner and more maintainable. The IDE will provide full IntelliSense support automatically. 