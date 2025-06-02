# Import Aliases Cheat Sheet 📋

## 🚀 Quick Reference

| Instead of this mess... | Use this clean alias! |
|------------------------|----------------------|
| `../../../infrastructure/components/modern/components/Button` | `@components/Button` |
| `../../../infrastructure/registries/modern/EnhancedNodeRegistry` | `@registries/EnhancedNodeRegistry` |
| `../../theming/modern/stores/flowStore` | `@stores/flowStore` |
| `../../../domains/content-creation/nodes/CreateText` | `@content/nodes/CreateText` |

---

## 📚 All Available Aliases

### 🏢 Domains (Business Logic)
```typescript
@content/*     → domains/content-creation/*
@automation/*  → domains/automation-triggers/*  
@visualization/* → domains/data-visualization/*
@testing/*     → domains/testing-debugging/*
@domains/*     → domains/* (any domain)
```

### 🏗️ Infrastructure (Shared Services)
```typescript
@components/*  → infrastructure/components/modern/components/*
@ui/*         → infrastructure/components/modern/components/* (same)
@stores/*     → infrastructure/theming/modern/stores/*
@theming/*    → infrastructure/theming/modern/*
@flow-engine/* → infrastructure/flow-engine/*
@registries/* → infrastructure/registries/modern/*
```

### 🔧 System
```typescript
@modern/*     → features/business-logic-modern/*
@legacy/*     → features/business-logic-legacy/*
```

---

## 💡 Most Common Patterns

### Import Components:
```typescript
import Button from '@components/Button';
import Sidebar from '@components/Sidebar';
import NodeInspector from '@components/node-inspector/NodeInspector';
```

### Import Stores:
```typescript
import { useFlowStore } from '@stores/flowStore';
import { useVibeModeStore } from '@stores/vibeModeStore';
```

### Import Domain Nodes:
```typescript
import CreateText from '@content/nodes/CreateTextEnhanced';
import CyclePulse from '@automation/nodes/CyclePulseEnhanced';
import ViewOutput from '@visualization/nodes/ViewOutputEnhanced';
```

### Import Registry:
```typescript
import { getNodeTypes } from '@registries/EnhancedNodeRegistry';
```

---

## 🎯 VS Code Tips

1. **Type `@` and get autocomplete** for all available aliases
2. **Ctrl+Click** to go to definition  
3. **Auto import suggestions** when you type component names
4. **Refactoring support** when moving files

---

## 🔄 Quick Migration

**PowerShell (Windows - Recommended):**
```powershell
# Preview changes first
.\tooling\migrate-imports.ps1 -WhatIf

# Apply migration
.\tooling\migrate-imports.ps1
```

**Node.js (Cross-platform):**
```bash
node tooling/migrate-imports.js
```

**Manual Find & Replace in VS Code (Ctrl+Shift+H):**

1. **Components**: 
   - Find: `from ['"](\.\./)*infrastructure/components/modern/components/([^'"]+)['"]`
   - Replace: `from '@components/$2'`

2. **Stores**:
   - Find: `from ['"](\.\./)*infrastructure/theming/modern/stores/([^'"]+)['"]`
   - Replace: `from '@stores/$2'`

---

## 🎨 Code Style

### ✅ Good Import Grouping:
```typescript
// External libraries
import React from 'react';
import { ReactFlow } from '@xyflow/react';

// Domain imports (business logic)  
import CreateText from '@content/nodes/CreateTextEnhanced';
import CyclePulse from '@automation/nodes/CyclePulseEnhanced';

// Infrastructure imports (shared services)
import Button from '@components/Button';
import { useFlowStore } from '@stores/flowStore';

// Types
import type { AgenNode } from '@flow-engine/flow-editor/types';
```

### ❌ Avoid Mixing:
```typescript
// Don't mix alias and relative imports
import Button from '@components/Button';
import Modal from '../../../infrastructure/components/modern/components/Modal'; // ❌
```

---

**💡 Pro Tip**: Bookmark this page! Keep it open while coding for quick reference. 