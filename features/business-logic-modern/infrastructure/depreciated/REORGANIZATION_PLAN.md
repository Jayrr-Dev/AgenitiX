# Factory System Reorganization Plan

## Current Issues

### 1. Integration Layer Confusion

- `integrations/factoryIntegration.ts` (Component-Data bridge)
- `utils/nodeFactoryIntegrated.ts` (Registry-Factory bridge)
- `adapters/jsonRegistryAdapter.ts` (JSON registry adapter)

**Problem**: Overlapping responsibilities, scattered locations

### 2. Oversized Main Factory (1600+ lines)

- Safety layers, Node parking, Object pooling, Error boundaries, Component creation
  **Problem**: Violates single responsibility principle

### 3. Unorganized Hooks (12+ hooks)

- Mixed state management, processing, performance, UI hooks
  **Problem**: Hard to locate related functionality

## Proposed New Structure

```
factory/
├── core/                                # Core factory functionality
│   ├── NodeFactory.tsx                  # Main factory (slimmed to ~400 lines)
│   ├── SafetyLayers.tsx                 # Enterprise safety systems
│   ├── UnifiedIntegration.ts            # Single integration point
│   └── FactoryProvider.tsx              # Context and providers
│
├── adapters/                            # External system adapters
│   ├── RegistryAdapter.ts               # JSON registry integration
│   ├── ReactFlowAdapter.ts              # React Flow integration
│   └── ThemeAdapter.ts                  # Theme system integration
│
├── components/                          # UI Components (keep current)
│   ├── containers/
│   │   ├── NodeContainer.tsx
│   │   └── NodeContent.tsx
│   ├── controls/
│   │   ├── ExpandCollapseButton.tsx
│   │   └── FloatingNodeId.tsx
│   └── index.ts
│
├── hooks/                               # Reorganized by responsibility
│   ├── state/                           # State management
│   │   ├── useNodeState.ts
│   │   ├── useNodeRegistration.ts
│   │   └── index.ts
│   ├── processing/                      # Data processing
│   │   ├── useNodeProcessing.ts
│   │   ├── useActivationCalculation.ts
│   │   ├── useMainProcessingLogic.ts
│   │   ├── useJsonInputProcessing.ts
│   │   └── index.ts
│   ├── ui/                              # UI and rendering
│   │   ├── useNodeStyling.ts
│   │   ├── useNodeHandles.ts
│   │   ├── useNodeConnections.ts
│   │   └── index.ts
│   ├── performance/                     # Performance optimizations
│   │   ├── useGPUAcceleration.ts
│   │   ├── useOptimizedTextInput.ts
│   │   └── index.ts
│   └── error/                           # Error handling
│       ├── useErrorInjectionProcessing.ts
│       └── index.ts
│
├── systems/                             # Complex subsystems
│   ├── propagation/
│   │   ├── UltraFastPropagationEngine.tsx
│   │   ├── PropagationEngine.ts
│   │   └── index.ts
│   ├── performance/
│   │   ├── ObjectPool.ts
│   │   ├── NodeParkingManager.ts
│   │   ├── Scheduler.ts
│   │   └── index.ts
│   └── safety/
│       ├── ErrorBoundary.tsx
│       ├── ValidationLayer.ts
│       └── index.ts
│
├── config/                              # Configuration
│   ├── constants/
│   │   ├── nodeTypes.ts
│   │   ├── handles.ts
│   │   ├── sizes.ts
│   │   └── index.ts
│   ├── defaults/
│   │   ├── nodeDefaults.ts
│   │   └── index.ts
│   └── validation/
│       ├── configValidation.ts
│       └── index.ts
│
├── utils/                               # Focused utilities
│   ├── creation/
│   │   ├── nodeFactory.ts
│   │   ├── handleUtils.ts
│   │   └── index.ts
│   ├── processing/
│   │   ├── jsonProcessor.ts
│   │   ├── propagationEngine.ts
│   │   └── index.ts
│   ├── validation/
│   │   ├── typeSafeConnections.ts
│   │   ├── handleDiagnostics.ts
│   │   └── index.ts
│   └── optimization/
│       ├── cacheManager.ts
│       ├── updateManager.ts
│       └── index.ts
│
├── types/                               # Type definitions (keep current)
│   ├── index.ts
│   └── connections.ts
│
├── templates/                           # Node templates (keep current)
│   └── CreateTextTemplate.tsx
│
├── testing/                             # Tests (keep current)
│   └── *.test.tsx
│
└── index.ts                             # Main exports
```

## Key Improvements

### 1. **Single Integration Point**

- Merge 3 integration files into `core/UnifiedIntegration.ts`
- Clear separation of concerns
- Single point of truth for integration logic

### 2. **Modular Main Factory**

- Extract safety layers to `core/SafetyLayers.tsx`
- Extract performance systems to `systems/performance/`
- Main factory focuses only on component creation

### 3. **Grouped Hooks by Responsibility**

- `hooks/state/` - State management
- `hooks/processing/` - Data processing
- `hooks/ui/` - UI and rendering
- `hooks/performance/` - Performance optimizations
- `hooks/error/` - Error handling

### 4. **Complex Systems Extraction**

- `systems/propagation/` - Propagation engine
- `systems/performance/` - Performance optimizations
- `systems/safety/` - Safety and validation

### 5. **Cleaner Configuration**

- `config/constants/` - All constants
- `config/defaults/` - Default configurations
- `config/validation/` - Validation logic

### 6. **Focused Utils**

- `utils/creation/` - Node creation utilities
- `utils/processing/` - Data processing utilities
- `utils/validation/` - Validation utilities
- `utils/optimization/` - Performance utilities

## Migration Strategy

### Phase 1: Extract Complex Systems

1. Move `UltraFastPropagationEngine.tsx` to `systems/propagation/`
2. Extract safety layers from `NodeFactory.tsx` to `systems/safety/`
3. Extract performance systems to `systems/performance/`

### Phase 2: Reorganize Hooks

1. Create hook subdirectories
2. Move hooks to appropriate categories
3. Create index files for clean imports

### Phase 3: Consolidate Integration

1. Merge integration files into `core/UnifiedIntegration.ts`
2. Update imports throughout codebase
3. Remove duplicate functionality

### Phase 4: Refactor Main Factory

1. Slim down `NodeFactory.tsx` to core functionality
2. Use extracted systems through providers
3. Clean up imports and exports

### Phase 5: Update Configuration

1. Consolidate constants into `config/constants/`
2. Move validation logic to `config/validation/`
3. Update main index exports

## Benefits

1. **Improved Maintainability**: Clear separation of concerns
2. **Better Navigation**: Logical grouping of related functionality
3. **Reduced Complexity**: Smaller, focused files
4. **Enhanced Reusability**: Modular systems can be reused
5. **Easier Testing**: Isolated components are easier to test
6. **Better Performance**: Reduced circular dependencies
7. **Cleaner Imports**: Organized exports through index files

## Breaking Changes

- Import paths will change for most factory components
- Some interfaces may need consolidation
- Configuration access patterns may change

## Implementation Notes

- Maintain backward compatibility during migration
- Use barrel exports (index.ts) for clean imports
- Keep comprehensive JSDoc documentation
- Preserve all existing functionality during reorganization
