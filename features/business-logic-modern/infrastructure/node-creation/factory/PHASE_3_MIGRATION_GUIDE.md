# Phase 3 Migration Guide: Integration Consolidation

## Overview

Phase 3 consolidates the three separate integration files into a single unified integration system:

- ✅ **`integrations/factoryIntegration.ts`** → **`deprecated/`**
- ✅ **`utils/nodeFactoryIntegrated.ts`** → **`deprecated/`**
- ✅ **`adapters/jsonRegistryAdapter.ts`** → **Still available** (adapter-specific logic preserved)

**New Single Source:** `core/UnifiedIntegration.ts`

## Breaking Changes

### Import Path Changes

```typescript
// BEFORE (Phase 2)
import { IntegratedNodeFactory } from "./utils/nodeFactoryIntegrated";
import { createIntegratedFactory } from "./integrations/factoryIntegration";
import { JsonNodeFactory } from "./adapters/jsonRegistryAdapter";

// AFTER (Phase 3)
import {
  IntegratedNodeFactory,
  createIntegratedFactory,
  unifiedFactory,
} from "./core/UnifiedIntegration";

// JsonRegistryAdapter still available for direct access
import { JsonRegistryAdapter } from "./adapters/jsonRegistryAdapter";
```

### API Changes

#### ✅ **Backward Compatible**

All existing APIs are preserved through the unified integration:

```typescript
// These all work exactly the same
const node = IntegratedNodeFactory.createNode(type, position);
const component = createIntegratedFactory(nodeType, config);
const copied = IntegratedNodeFactory.copyNode(originalNode);
```

#### 🆕 **New Unified API**

```typescript
// Get the unified factory instance
const factory = unifiedFactory;

// Or create with custom configuration
const customFactory = createUnifiedFactory({
  strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
  enableCaching: true,
  enableMetrics: true,
  fallbackBehavior: "warn",
});

// Use with same methods
const node = factory.createNode(type, position);
const component = factory.createComponent(config);
```

## New Features

### 1. **Integration Strategies**

Choose how node creation is prioritized:

```typescript
import {
  createUnifiedFactory,
  IntegrationStrategy,
} from "./core/UnifiedIntegration";

// JSON Registry first (default)
const factory1 = createUnifiedFactory({
  strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
});

// Basic Factory first
const factory2 = createUnifiedFactory({
  strategy: IntegrationStrategy.BASIC_FACTORY_FIRST,
});

// Only JSON Registry
const factory3 = createUnifiedFactory({
  strategy: IntegrationStrategy.JSON_REGISTRY_ONLY,
});

// Only Basic Factory
const factory4 = createUnifiedFactory({
  strategy: IntegrationStrategy.BASIC_FACTORY_ONLY,
});
```

### 2. **Performance Monitoring**

Built-in metrics for development:

```typescript
const factory = createUnifiedFactory({
  enableMetrics: true,
});

// After some operations
const metrics = factory.getMetrics();
console.log(metrics);
// {
//   jsonRegistryHits: 15,
//   basicFactoryHits: 3,
//   cacheHits: 8,
//   fallbacks: 2,
//   errors: 0
// }
```

### 3. **Intelligent Caching**

Automatic caching with cache management:

```typescript
const factory = createUnifiedFactory({
  enableCaching: true,
});

// Clear cache when needed
factory.clearCache();

// Reset metrics
factory.resetMetrics();
```

### 4. **Error Handling Strategies**

Configurable error behavior:

```typescript
const factory = createUnifiedFactory({
  fallbackBehavior: "throw" | "warn" | "silent",
});
```

## Migration Checklist

### For Existing Code

- [ ] **Replace import paths** to use `./core/UnifiedIntegration`
- [ ] **Test existing functionality** - should work without changes
- [ ] **Update any direct imports** from deprecated files
- [ ] **Consider using new unified API** for new code

### For New Code

- [ ] **Use unified factory** for all node operations
- [ ] **Configure integration strategy** based on needs
- [ ] **Enable metrics** in development
- [ ] **Use type-safe interfaces** provided

## Examples

### Basic Migration

```typescript
// OLD
import { IntegratedNodeFactory } from "./utils/nodeFactoryIntegrated";

export function createMyNode(type: string, position: { x: number; y: number }) {
  return IntegratedNodeFactory.createNode(type, position);
}

// NEW (same code works!)
import { IntegratedNodeFactory } from "./core/UnifiedIntegration";

export function createMyNode(type: string, position: { x: number; y: number }) {
  return IntegratedNodeFactory.createNode(type, position);
}
```

### Advanced Usage

```typescript
// NEW - Using unified factory with custom config
import {
  createUnifiedFactory,
  IntegrationStrategy,
} from "./core/UnifiedIntegration";

const nodeFactory = createUnifiedFactory({
  strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
  enableCaching: true,
  enableMetrics: process.env.NODE_ENV === "development",
  fallbackBehavior: "warn",
});

export function createOptimizedNode(
  type: string,
  position: { x: number; y: number }
) {
  const node = nodeFactory.createNode(type, position);

  if (process.env.NODE_ENV === "development") {
    console.log("Factory metrics:", nodeFactory.getMetrics());
  }

  return node;
}
```

## Benefits

### ✅ **Single Source of Truth**

- No more confusion between 3 different integration files
- Clear, unified API for all node operations
- Centralized configuration and behavior

### 🚀 **Enhanced Performance**

- Intelligent caching reduces redundant operations
- Configurable strategies optimize for your use case
- Built-in metrics help identify bottlenecks

### 🔧 **Better Developer Experience**

- Type-safe interfaces throughout
- Clear error messages and fallback behavior
- Development-time metrics and debugging

### 🏗️ **Future-Proof Architecture**

- Easy to extend with new integration strategies
- Modular design allows selective feature usage
- Maintains backward compatibility while enabling innovation

## Rollback Plan

If issues arise, deprecated files are preserved in `deprecated/` folder:

1. Restore deprecated files to original locations
2. Revert import changes in `index.ts`
3. Update imports back to old paths

**Note:** Consider this a temporary fallback only - the unified integration is the recommended path forward.

## Support

- The JsonRegistryAdapter remains available for direct adapter usage
- All original functionality is preserved through compatibility layers
- New unified API is additive, not replacement

**Phase 3 provides a clean, powerful, and backward-compatible integration layer that sets the foundation for future factory system enhancements.**
