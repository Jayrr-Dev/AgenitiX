# Migration Phase 1: Extract Complex Systems

## Quick Start - Immediate Improvements

### Step 1: Create New Folder Structure

```bash
mkdir -p factory/core
mkdir -p factory/systems/propagation
mkdir -p factory/systems/performance
mkdir -p factory/systems/safety
```

### Step 2: Extract Propagation System

Move `visuals/UltraFastPropagationEngine.tsx` → `systems/propagation/`

**Create `systems/propagation/index.ts`:**

```typescript
export {
  UltraFastPropagationEngine,
  useUltraFastPropagation,
} from "./UltraFastPropagationEngine";
export type {
  PropagationEngineError,
  NodeState,
  TransitionEvent,
} from "./UltraFastPropagationEngine";
```

### Step 3: Extract Safety Systems from NodeFactory.tsx

**Create `systems/safety/ErrorBoundary.tsx`:**

```typescript
// Extract NodeErrorBoundary class and related error handling
// Move error boundary logic from NodeFactory.tsx
```

**Create `systems/safety/ValidationLayer.ts`:**

```typescript
// Extract validation functions like validateNodeConfig, validateNodeIntegrity
```

**Create `systems/safety/SafetyLayers.tsx`:**

```typescript
// Extract SafeStateLayer, SafeDataFlowController, SafetyLayersProvider
```

### Step 4: Extract Performance Systems

**Create `systems/performance/ObjectPool.ts`:**

```typescript
// Extract ObjectPool class from NodeFactory.tsx
```

**Create `systems/performance/NodeParkingManager.ts`:**

```typescript
// Extract createNodeParkingManager and related functionality
```

**Create `systems/performance/Scheduler.ts`:**

```typescript
// Extract createScheduler and DeferUntilIdle functionality
```

### Step 5: Update NodeFactory.tsx Imports

```typescript
// Replace internal implementations with imports
import { SafetyLayersProvider } from "../systems/safety/SafetyLayers";
import { NodeErrorBoundary } from "../systems/safety/ErrorBoundary";
import { ObjectPool } from "../systems/performance/ObjectPool";
import { createScheduler } from "../systems/performance/Scheduler";
import { UltraFastPropagationEngine } from "../systems/propagation";
```

## Benefits of Phase 1

1. **Immediate File Size Reduction**: NodeFactory.tsx drops from 1600+ to ~800 lines
2. **Better Separation**: Complex systems are isolated and reusable
3. **Easier Testing**: Each system can be tested independently
4. **Reduced Complexity**: Main factory focuses on core functionality

## Before/After Comparison

### Before (NodeFactory.tsx - 1600+ lines):

- Node component creation
- Safety layers
- Error boundaries
- Object pooling
- Scheduling
- Propagation engine integration
- Parking manager
- Validation logic

### After (NodeFactory.tsx - ~800 lines):

- Node component creation ✓
- Safety layer imports ✓
- Clean system integration ✓

### New System Files:

- `systems/safety/` - 400 lines across 3 files
- `systems/performance/` - 300 lines across 3 files
- `systems/propagation/` - 200 lines (moved)

## Implementation Priority

1. **High Impact, Low Risk**: Extract PropagationEngine (already isolated)
2. **Medium Impact, Low Risk**: Extract ObjectPool and Scheduler
3. **High Impact, Medium Risk**: Extract Safety Layers (used throughout)

## Testing Strategy

- Move systems with their existing tests
- Add integration tests for extracted systems
- Verify main factory still works with new imports

## Next Phase Preview

Phase 2 will reorganize the hooks folder by responsibility, making the system even more navigable and maintainable.
