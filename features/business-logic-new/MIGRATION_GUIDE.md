# 🔄 **Migration Guide: Legacy to Enterprise Architecture**

## 📋 **Overview**

This guide helps you migrate from the old monolithic structure to the new **enterprise domain-driven architecture**. The migration is designed to be **safe**, **gradual**, and **non-breaking**.

## 🎯 **Migration Strategy**

### **Phase 1: Infrastructure Setup** ✅ **COMPLETE**
- [x] Created new domain structure
- [x] Moved documentation to organized sections
- [x] Organized nodes by business domains
- [x] Setup infrastructure components

### **Phase 2: Import Path Updates** 🚧 **CURRENT**
- [ ] Update imports to use new domain paths
- [ ] Create compatibility layer
- [ ] Test all imports work correctly

### **Phase 3: Legacy Isolation** 📋 **NEXT**
- [ ] Complete legacy system isolation
- [ ] Update registry references
- [ ] Test backward compatibility

### **Phase 4: Modern Enhancement** 🔮 **FUTURE**
- [ ] Enhance domain boundaries
- [ ] Add domain-specific features
- [ ] Complete modernization

## 🔄 **Import Path Changes**

### **Before (Old Structure)**
```typescript
// Old monolithic imports
import CreateText from 'features/business-logic/nodes/media/CreateText';
import { CreateTextEnhanced } from 'features/business-logic/nodes/main/CreateTextEnhanced';
import { ENHANCED_NODE_REGISTRY } from 'features/business-logic/nodes/nodeRegistry';
import { useNodeStyleClasses } from 'features/business-logic/stores/nodeStyleStore';
```

### **After (New Structure)**
```typescript
// New domain-based imports
import CreateText from 'features/business-logic-new/domains/content-creation/legacy/nodes/CreateText';
import { CreateTextEnhanced } from 'features/business-logic-new/domains/content-creation/modern/nodes';
import { ENHANCED_NODE_REGISTRY } from 'features/business-logic-new/infrastructure/registries/modern/EnhancedNodeRegistry';
import { useNodeStyleClasses } from 'features/business-logic-new/infrastructure/theming/modern/stores/nodeStyleStore';
```

## 📁 **Node Migration Map**

### **Content Creation Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/media/CreateText.tsx` | `domains/content-creation/legacy/nodes/CreateText.tsx` | Legacy |
| `nodes/media/CreateTextRefactor.tsx` | `domains/content-creation/modern/nodes/CreateTextRefactor.tsx` | Modern |
| `nodes/main/CreateTextEnhanced.tsx` | `domains/content-creation/modern/nodes/CreateTextEnhanced.tsx` | Modern |
| `nodes/media/TurnToText.tsx` | `domains/content-creation/legacy/nodes/TurnToText.tsx` | Legacy |
| `nodes/media/TurnToUppercase.tsx` | `domains/content-creation/legacy/nodes/TurnToUppercase.tsx` | Legacy |

### **Logic Operations Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/main/LogicAnd.tsx` | `domains/logic-operations/legacy/nodes/LogicAnd.tsx` | Legacy |
| `nodes/main/LogicOr.tsx` | `domains/logic-operations/legacy/nodes/LogicOr.tsx` | Legacy |
| `nodes/main/LogicNot.tsx` | `domains/logic-operations/legacy/nodes/LogicNot.tsx` | Legacy |
| `nodes/main/LogicXor.tsx` | `domains/logic-operations/legacy/nodes/LogicXor.tsx` | Legacy |
| `nodes/main/LogicXnor.tsx` | `domains/logic-operations/legacy/nodes/LogicXnor.tsx` | Legacy |

### **Automation Triggers Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/main/TriggerToggleEnhanced.tsx` | `domains/automation-triggers/modern/nodes/TriggerToggleEnhanced.tsx` | Modern |
| `nodes/main/CyclePulseEnhanced.tsx` | `domains/automation-triggers/modern/nodes/CyclePulseEnhanced.tsx` | Modern |
| `nodes/automation/TriggerOnToggleRefactor.tsx` | `domains/automation-triggers/modern/nodes/TriggerOnToggleRefactor.tsx` | Modern |
| `nodes/automation/TriggerOnClick.tsx` | `domains/automation-triggers/legacy/nodes/TriggerOnClick.tsx` | Legacy |
| `nodes/automation/TriggerOnPulse.tsx` | `domains/automation-triggers/legacy/nodes/TriggerOnPulse.tsx` | Legacy |
| `nodes/automation/TriggerOnToggle.tsx` | `domains/automation-triggers/legacy/nodes/TriggerOnToggle.tsx` | Legacy |
| `nodes/automation/CyclePulse.tsx` | `domains/automation-triggers/legacy/nodes/CyclePulse.tsx` | Legacy |
| `nodes/automation/CycleToggle.tsx` | `domains/automation-triggers/legacy/nodes/CycleToggle.tsx` | Legacy |

### **Data Visualization Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/main/ViewOutputEnhanced.tsx` | `domains/data-visualization/modern/nodes/ViewOutputEnhanced.tsx` | Modern |
| `nodes/main/ViewOutputRefactor.tsx` | `domains/data-visualization/modern/nodes/ViewOutputRefactor.tsx` | Modern |
| `nodes/main/ViewOutput.tsx` | `domains/data-visualization/legacy/nodes/ViewOutput.tsx` | Legacy |

### **Testing & Debugging Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/test/TestErrorRefactored.tsx` | `domains/testing-debugging/modern/nodes/TestErrorRefactored.tsx` | Modern |
| `nodes/test/TestError.tsx` | `domains/testing-debugging/legacy/nodes/TestError.tsx` | Legacy |
| `nodes/test/TestInput.tsx` | `domains/testing-debugging/legacy/nodes/TestInput.tsx` | Legacy |
| `nodes/test/TestJson.tsx` | `domains/testing-debugging/legacy/nodes/TestJson.tsx` | Legacy |

### **Data Manipulation Domain**
| Old Path | New Path | Type |
|----------|----------|------|
| `nodes/main/EditObject.tsx` | `domains/data-manipulation/legacy/nodes/EditObject.tsx` | Legacy |
| `nodes/main/EditArray.tsx` | `domains/data-manipulation/legacy/nodes/EditArray.tsx` | Legacy |

## 🏗️ **Infrastructure Migration Map**

| Old Path | New Path | Purpose |
|----------|----------|---------|
| `nodes/nodeRegistry.ts` | `infrastructure/registries/modern/EnhancedNodeRegistry.ts` | Modern registry |
| `flow-editor/` | `infrastructure/flow-engine/modern/flow-editor/` | Flow engine |
| `stores/` | `infrastructure/theming/modern/stores/` | Theming system |
| `components/` | `infrastructure/components/modern/` | Shared components |

## 📚 **Documentation Migration Map**

| Old Path | New Path | Category |
|----------|----------|----------|
| `ENTERPRISE-SOLUTION-SUMMARY.md` | `documentation/modern-system/architecture/` | Modern Architecture |
| `AI-PROMPT-NEW-NODE.md` | `documentation/modern-system/development/` | Modern Development |
| `docs/NODE_FACTORY_DOCUMENTATION.md` | `documentation/modern-system/development/` | Modern Development |
| `docs/DATA_FLOW_ARCHITECTURE.md` | `documentation/modern-system/architecture/` | Modern Architecture |
| `ENTERPRISE-MIGRATION-GUIDE.md` | `documentation/legacy-system/migration/` | Legacy Migration |
| `docs/NODE_REGISTRATION_GUIDE.md` | `documentation/legacy-system/maintenance/` | Legacy Maintenance |
| `docs/UNIVERSAL_JSON_GUIDE.md` | `documentation/shared/` | Shared |
| `docs/VIBE_MODE_DOCUMENTATION.md` | `documentation/shared/` | Shared |
| `docs/GLOW_SYSTEM_DOCUMENTATION.md` | `documentation/shared/` | Shared |

## 🔧 **Step-by-Step Migration Process**

### **Step 1: Update Registry Imports**
```typescript
// OLD
import { ENHANCED_NODE_REGISTRY } from 'features/business-logic/nodes/nodeRegistry';

// NEW
import { ENHANCED_NODE_REGISTRY } from 'features/business-logic-new/infrastructure/registries/modern/EnhancedNodeRegistry';
```

### **Step 2: Update Node Imports**
```typescript
// OLD - Mixed imports
import CreateText from 'features/business-logic/nodes/media/CreateText';
import { CreateTextEnhanced } from 'features/business-logic/nodes/main/CreateTextEnhanced';

// NEW - Domain-based imports
import CreateText from 'features/business-logic-new/domains/content-creation/legacy/nodes/CreateText';
import { CreateTextEnhanced } from 'features/business-logic-new/domains/content-creation/modern/nodes';
```

### **Step 3: Update Infrastructure Imports**
```typescript
// OLD
import { useNodeStyleClasses } from 'features/business-logic/stores/nodeStyleStore';
import { FlowEditor } from 'features/business-logic/flow-editor/FlowEditor';

// NEW
import { useNodeStyleClasses } from 'features/business-logic-new/infrastructure/theming/modern/stores/nodeStyleStore';
import { FlowEditor } from 'features/business-logic-new/infrastructure/flow-engine/modern/flow-editor/FlowEditor';
```

### **Step 4: Update Type Imports**
```typescript
// OLD
import type { CreateTextData } from 'features/business-logic/flow-editor/types';

// NEW
import type { CreateTextData } from 'features/business-logic-new/infrastructure/flow-engine/modern/flow-editor/types';
```

## 🛡️ **Safety Checklist**

### **Before Migration**
- [ ] Backup current codebase
- [ ] Run all tests to establish baseline
- [ ] Document current import patterns
- [ ] Identify all files that import business logic

### **During Migration**
- [ ] Update imports one domain at a time
- [ ] Test after each domain migration
- [ ] Verify no TypeScript errors
- [ ] Check that all nodes still appear in UI

### **After Migration**
- [ ] Run full test suite
- [ ] Verify all functionality works
- [ ] Update documentation
- [ ] Clean up old imports

## 🚨 **Common Issues & Solutions**

### **Issue: Import Path Not Found**
```typescript
// Error: Module not found
import CreateText from 'features/business-logic-new/domains/content-creation/legacy/nodes/CreateText';

// Solution: Check if file exists and use correct path
import CreateText from 'features/business-logic-new/domains/content-creation/legacy/nodes/CreateText.tsx';
```

### **Issue: Type Import Errors**
```typescript
// Error: Type not exported
import type { CreateTextData } from 'features/business-logic-new/domains/content-creation/modern/nodes';

// Solution: Import from correct types location
import type { CreateTextData } from 'features/business-logic-new/infrastructure/flow-engine/modern/flow-editor/types';
```

### **Issue: Registry Not Found**
```typescript
// Error: Registry undefined
import { ENHANCED_NODE_REGISTRY } from 'old/path';

// Solution: Update to new registry path
import { ENHANCED_NODE_REGISTRY } from 'features/business-logic-new/infrastructure/registries/modern/EnhancedNodeRegistry';
```

## 🔄 **Rollback Plan**

If issues arise during migration:

1. **Immediate Rollback**: Revert to old import paths
2. **Partial Rollback**: Keep successfully migrated domains, revert problematic ones
3. **Full Rollback**: Return to original structure entirely

### **Rollback Commands**
```bash
# Revert specific domain
git checkout HEAD~1 -- features/business-logic-new/domains/content-creation/

# Revert all changes
git checkout HEAD~1 -- features/business-logic-new/
```

## 📊 **Migration Progress Tracking**

### **Phase 1: Infrastructure** ✅ **COMPLETE**
- [x] Domain structure created
- [x] Documentation organized
- [x] Nodes moved to domains
- [x] Infrastructure components moved

### **Phase 2: Import Updates** 🚧 **IN PROGRESS**
- [ ] Registry imports updated
- [ ] Node imports updated
- [ ] Infrastructure imports updated
- [ ] Type imports updated

### **Phase 3: Testing** 📋 **PENDING**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] UI functionality verified
- [ ] Performance benchmarks met

### **Phase 4: Cleanup** 🔮 **FUTURE**
- [ ] Old structure removed
- [ ] Documentation updated
- [ ] Team training completed
- [ ] Migration guide archived

## 🎯 **Next Steps**

1. **Review this migration guide** thoroughly
2. **Start with one domain** (recommend content-creation)
3. **Update imports gradually** and test each change
4. **Document any issues** encountered
5. **Complete one domain** before moving to next

## 📞 **Support**

If you encounter issues during migration:

1. **Check this guide** for common solutions
2. **Review the README** for architecture understanding
3. **Test in isolation** to identify specific problems
4. **Document new issues** for future reference

---

**Remember**: This migration is designed to be **safe** and **gradual**. Take your time and test thoroughly at each step. 