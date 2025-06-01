# 🏗️ **Enterprise Business Logic Architecture**

## 📋 **Overview**

This is the **new enterprise-grade architecture** for the business logic layer, implementing **Domain-Driven Design (DDD)** and **Clean Architecture** principles. The system is organized by **business domains** with clear separation between **modern** and **legacy** systems.

## 🎯 **Architecture Principles**

### **1. Domain-Driven Design (DDD)**
- **Feature-first organization** - code organized by business capabilities
- **Clear domain boundaries** - each domain is self-contained
- **Ubiquitous language** - consistent terminology within domains

### **2. Clean Architecture**
- **Dependency Inversion** - domains depend on abstractions, not implementations
- **Separation of Concerns** - UI, business logic, and infrastructure are separated
- **Testability** - each layer can be tested independently

### **3. Legacy System Isolation**
- **Zero contamination** - legacy code cannot affect modern systems
- **Independent evolution** - legacy and modern systems evolve separately
- **Safe migration path** - gradual modernization without breaking changes

## 📁 **Directory Structure**

```
features/business-logic-new/
├── 🎯 domains/                          # BUSINESS DOMAINS (Feature-First)
│   ├── content-creation/                # Text, media, data creation
│   │   ├── modern/                      # ✨ Refactored nodes only
│   │   │   ├── nodes/                   # Enhanced & refactored components
│   │   │   ├── types/                   # TypeScript interfaces
│   │   │   ├── stores/                  # Domain-specific state
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── utils/                   # Domain utilities
│   │   │   └── __tests__/               # Domain tests
│   │   └── legacy/                      # 🔧 Legacy nodes isolated
│   │       ├── nodes/                   # Original implementations
│   │       ├── controls/                # Legacy UI controls
│   │       ├── types/                   # Legacy type definitions
│   │       └── docs/                    # Legacy documentation
│   │
│   ├── logic-operations/                # Boolean logic, gates
│   ├── automation-triggers/             # Triggers, cycles, timing
│   ├── data-visualization/              # View outputs, displays
│   ├── testing-debugging/               # Error generation, testing
│   └── data-manipulation/               # Edit objects, arrays, conversions
│
├── 🏗️ infrastructure/                   # CROSS-CUTTING CONCERNS
│   ├── registries/                      # Node registration systems
│   │   ├── modern/                      # Enhanced registry system
│   │   └── legacy/                      # Backward compatibility
│   ├── flow-engine/                     # ReactFlow integration
│   ├── theming/                        # Styling and themes
│   ├── components/                     # Shared UI components
│   └── data-flow/                      # Data propagation
│
├── 📚 documentation/                    # ORGANIZED DOCUMENTATION
│   ├── modern-system/                  # Refactored architecture docs
│   ├── legacy-system/                  # Legacy system docs
│   ├── shared/                         # Cross-system documentation
│   └── operations/                     # DevOps and deployment
│
├── 🧪 testing/                         # TESTING INFRASTRUCTURE
├── 🔧 tooling/                         # DEVELOPMENT TOOLS
└── 📦 packages/                        # SHARED PACKAGES
```

## 🎯 **Domain Organization**

### **Content Creation Domain**
- **Purpose**: Text creation, media processing, content generation
- **Modern Nodes**: `CreateTextEnhanced`, `CreateTextRefactor`
- **Legacy Nodes**: `CreateText`, `TurnToText`, `TurnToUppercase`

### **Logic Operations Domain**
- **Purpose**: Boolean logic, gates, conditional operations
- **Modern Nodes**: *(Future enhanced logic nodes)*
- **Legacy Nodes**: `LogicAnd`, `LogicOr`, `LogicNot`, `LogicXor`, `LogicXnor`

### **Automation Triggers Domain**
- **Purpose**: Triggers, cycles, timing, automation
- **Modern Nodes**: `TriggerToggleEnhanced`, `CyclePulseEnhanced`, `TriggerOnToggleRefactor`
- **Legacy Nodes**: `TriggerOnClick`, `TriggerOnPulse`, `CyclePulse`, `CycleToggle`

### **Data Visualization Domain**
- **Purpose**: View outputs, displays, data presentation
- **Modern Nodes**: `ViewOutputEnhanced`, `ViewOutputRefactor`
- **Legacy Nodes**: `ViewOutput`

### **Testing & Debugging Domain**
- **Purpose**: Error generation, testing, debugging tools
- **Modern Nodes**: `TestErrorRefactored`
- **Legacy Nodes**: `TestError`, `TestInput`, `TestJson`

### **Data Manipulation Domain**
- **Purpose**: Edit objects, arrays, data transformations
- **Modern Nodes**: *(Future enhanced data nodes)*
- **Legacy Nodes**: `EditObject`, `EditArray`

## 🚀 **Usage Guide**

### **Importing Modern Nodes**
```typescript
// Import from domain
import { CreateTextEnhanced } from './domains/content-creation/modern/nodes';

// Import types
import type { CreateTextEnhancedData } from './domains/content-creation/modern/nodes';
```

### **Importing Legacy Nodes**
```typescript
// Import from legacy section
import CreateText from './domains/content-creation/legacy/nodes/CreateText';
```

### **Infrastructure Components**
```typescript
// Modern registry
import { ENHANCED_NODE_REGISTRY } from './infrastructure/registries/modern/EnhancedNodeRegistry';

// Modern theming
import { useNodeStyleClasses } from './infrastructure/theming/modern/nodeStyleStore';
```

## 🔄 **Migration Strategy**

### **Phase 1: Infrastructure Setup** ✅
- [x] Create domain structure
- [x] Move documentation
- [x] Organize nodes by domain
- [x] Setup infrastructure

### **Phase 2: Domain Consolidation** 🚧
- [ ] Create domain-specific index files
- [ ] Update import paths
- [ ] Test domain isolation
- [ ] Update registry references

### **Phase 3: Legacy Isolation** 📋
- [ ] Create legacy compatibility layer
- [ ] Update legacy imports
- [ ] Test backward compatibility
- [ ] Document migration paths

### **Phase 4: Modern Enhancement** 🔮
- [ ] Enhance domain boundaries
- [ ] Add domain-specific utilities
- [ ] Implement domain tests
- [ ] Create domain documentation

## 🛡️ **Safety Measures**

### **Backward Compatibility**
- All existing imports continue to work
- Legacy nodes remain functional
- No breaking changes to public APIs

### **Gradual Migration**
- Domains can be migrated independently
- Modern and legacy systems coexist
- Safe rollback at any point

### **Testing Strategy**
- Domain-specific test suites
- Integration tests across domains
- Legacy compatibility tests

## 📖 **Documentation**

### **Modern System Docs**
- `documentation/modern-system/architecture/` - Architecture guides
- `documentation/modern-system/development/` - Development guides
- `documentation/modern-system/domain-guides/` - Domain-specific docs

### **Legacy System Docs**
- `documentation/legacy-system/migration/` - Migration guides
- `documentation/legacy-system/maintenance/` - Legacy maintenance
- `documentation/legacy-system/deprecated/` - Deprecated features

### **Shared Documentation**
- `documentation/shared/` - Cross-system documentation
- `documentation/operations/` - DevOps and deployment

## 🔧 **Development Tools**

### **Code Generation**
- `tooling/code-generation/` - Automated code generators
- `tooling/dev-scripts/` - Development utilities

### **Migration Scripts**
- `tooling/migration-scripts/` - Legacy to modern migration
- `tooling/migration-scripts/data-migration.ts` - Data migration utilities

## 🎉 **Benefits**

### **For Developers**
- **Clear organization** - easy to find relevant code
- **Domain expertise** - focus on specific business areas
- **Safe refactoring** - isolated changes with minimal risk

### **For Architecture**
- **Scalability** - domains can grow independently
- **Maintainability** - clear boundaries and responsibilities
- **Testability** - isolated testing strategies

### **For Business**
- **Feature velocity** - faster development in focused domains
- **Risk reduction** - legacy isolation prevents regressions
- **Future-proofing** - modern architecture supports growth

## 🚨 **Important Notes**

### **DO NOT**
- ❌ Mix legacy and modern code in the same domain section
- ❌ Import legacy components in modern systems
- ❌ Modify legacy code without migration plan

### **DO**
- ✅ Use domain-specific imports
- ✅ Follow the established patterns
- ✅ Test changes thoroughly
- ✅ Document domain decisions

---

## 🔗 **Quick Links**

- [Modern System Architecture](./documentation/modern-system/architecture/)
- [Legacy Migration Guide](./documentation/legacy-system/migration/)
- [Development Tools](./tooling/)
- [Domain Guides](./documentation/modern-system/domain-guides/)

**Status**: 🚧 **Phase 1 Complete** - Infrastructure setup and initial organization complete 