---
inclusion: fileMatch
fileMatchPattern: "**/stores/**/*", "**/store.ts", "**/useStore.ts", "**/*Store.ts", "**/*store.ts"
---

# Zustand State Management Standards

## Overview

AgenitiX uses [Zustand](https://github.com/pmndrs/zustand) for client-side state management. Zustand is a lightweight (1.1kB gzipped), unopinionated state management solution that provides a simple API for creating global stores with selector-based subscriptions.

## Core Principles

Following [TkDodo's Zustand best practices](https://tkdodo.eu/blog/working-with-zustand), our state management follows these principles:

1. **Custom Hook Pattern**: Only export custom hooks, never raw stores
2. **Atomic Selectors**: Prefer single-value selectors for optimal performance
3. **Separate Actions**: Organize actions separately from state
4. **Event-Driven Actions**: Model actions as events, not setters
5. **Small Store Scope**: Keep individual stores focused and composable

## Store Architecture Pattern

### Basic Store Structure

```typescript
// lib/stores/bearStore.ts
import { create } from 'zustand';

interface BearState {
  bears: number;
  fish: number;
  actions: {
    increasePopulation: (by: number) => void;
    eatFish: () => void;
    removeAllBears: () => void;
  };
}

// ⬇️ Not exported - prevents direct store access
const useBearStore = create<BearState>((set) => ({
  bears: 0,
  fish: 0,
  
  // ⬇️ Separate "namespace" for actions
  actions: {
    increasePopulation: (by: number) =>
      set((state) => ({ bears: state.bears + by })),
    eatFish: () => 
      set((state) => ({ fish: state.fish - 1 })),
    removeAllBears: () => 
      set({ bears: 0 }),
  },
}));

// 💡 Exported custom hooks - atomic selectors
export const useBears = () => useBearStore((state) => state.bears);
export const useFish = () => useBearStore((state) => state.fish);

// 🎉 Single selector for all actions (actions never change)
export const useBearActions = () => useBearStore((state) => state.actions);
```

## AgenitiX Store Patterns

### Node Store Example

```typescript
// lib/stores/nodeStore.ts
import { create } from 'zustand';
import type { Node } from '@xyflow/react';
import type { AgenNode } from '@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData';

interface NodeState {
  selectedNodeId: string | null;
  copiedNodes: AgenNode[];
  isDragging: boolean;
  showHistoryPanel: boolean;
  actions: {
    selectNode: (nodeId: string | null) => void;
    copyNodes: (nodes: AgenNode[]) => void;
    clearCopiedNodes: () => void;
    setDragging: (isDragging: boolean) => void;
    toggleHistoryPanel: () => void;
    resetSelection: () => void;
  };
}

const useNodeStore = create<NodeState>((set, get) => ({
  selectedNodeId: null,
  copiedNodes: [],
  isDragging: false,
  showHistoryPanel: false,
  
  actions: {
    selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
    
    copyNodes: (nodes) => {
      set({ copiedNodes: nodes });
      // Event-driven: log the copy action
      console.log(`Copied ${nodes.length} nodes`);
    },
    
    clearCopiedNodes: () => set({ copiedNodes: [] }),
    
    setDragging: (isDragging) => set({ isDragging }),
    
    toggleHistoryPanel: () => 
      set((state) => ({ showHistoryPanel: !state.showHistoryPanel })),
      
    resetSelection: () => set({
      selectedNodeId: null,
      copiedNodes: [],
      isDragging: false,
    }),
  },
}));

// Atomic selectors - export only what components need
export const useSelectedNodeId = () => useNodeStore((state) => state.selectedNodeId);
export const useCopiedNodes = () => useNodeStore((state) => state.copiedNodes);
export const useIsDragging = () => useNodeStore((state) => state.isDragging);
export const useShowHistoryPanel = () => useNodeStore((state) => state.showHistoryPanel);

// Actions hook
export const useNodeActions = () => useNodeStore((state) => state.actions);
```

### Theme Store Example

```typescript
// lib/stores/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  sidebarCollapsed: boolean;
  reducedMotion: boolean;
  actions: {
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    toggleSidebar: () => void;
    toggleReducedMotion: () => void;
  };
}

const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'system',
      sidebarCollapsed: false,
      reducedMotion: false,
      
      actions: {
        setTheme: (theme) => set({ theme }),
        toggleSidebar: () => 
          set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        toggleReducedMotion: () =>
          set((state) => ({ reducedMotion: !state.reducedMotion })),
      },
    }),
    {
      name: 'agenitix-theme-storage',
      partialize: (state) => ({ 
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        reducedMotion: state.reducedMotion,
      }),
    }
  )
);

// Atomic selectors
export const useTheme = () => useThemeStore((state) => state.theme);
export const useSidebarCollapsed = () => useThemeStore((state) => state.sidebarCollapsed);
export const useReducedMotion = () => useThemeStore((state) => state.reducedMotion);

// Actions
export const useThemeActions = () => useThemeStore((state) => state.actions);
```

## Store Composition Patterns

### Combining Stores with Custom Hooks

```typescript
// hooks/useNodeSelection.ts
import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useSelectedNodeId, useNodeActions } from '@/lib/stores/nodeStore';

export const useNodeSelection = () => {
  const selectedNodeId = useSelectedNodeId();
  const { selectNode } = useNodeActions();
  const { getNode, getNodes } = useReactFlow();
  
  const selectedNode = selectedNodeId ? getNode(selectedNodeId) : null;
  
  const selectNodeById = useCallback((nodeId: string | null) => {
    selectNode(nodeId);
    
    // Additional side effects for node selection
    if (nodeId) {
      const node = getNode(nodeId);
      if (node) {
        console.log(`Selected node: ${node.type} (${nodeId})`);
      }
    }
  }, [selectNode, getNode]);
  
  const clearSelection = useCallback(() => {
    selectNode(null);
  }, [selectNode]);
  
  return {
    selectedNodeId,
    selectedNode,
    selectNodeById,
    clearSelection,
  };
};
```

### Combining with Server State (Convex)

```typescript
// hooks/useUserPreferences.ts
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useTheme, useThemeActions } from '@/lib/stores/themeStore';

export const useUserPreferences = () => {
  const localTheme = useTheme();
  const { setTheme } = useThemeActions();
  
  // Server state
  const serverPreferences = useQuery(api.users.getPreferences);
  const updatePreferences = useMutation(api.users.updatePreferences);
  
  const syncTheme = async (theme: 'light' | 'dark' | 'system') => {
    // Update local state immediately
    setTheme(theme);
    
    // Sync to server
    try {
      await updatePreferences({ theme });
    } catch (error) {
      console.error('Failed to sync theme preference:', error);
      // Could revert local state here if needed
    }
  };
  
  return {
    theme: localTheme,
    serverPreferences,
    syncTheme,
    isLoading: serverPreferences === undefined,
  };
};
```

## Performance Best Practices

### Avoiding Over-Subscription

```typescript
// ❌ Bad: Subscribing to entire store
const badExample = () => {
  const { bears, fish } = useBearStore(); // Subscribes to everything!
  return <div>{bears}</div>;
};

// ✅ Good: Atomic selectors
const goodExample = () => {
  const bears = useBears(); // Only subscribes to bears
  return <div>{bears}</div>;
};
```

### Shallow Comparison for Objects

```typescript
// When you must return objects, use shallow comparison
import { shallow } from 'zustand/shallow';

const useMultipleValues = () => 
  useBearStore(
    (state) => ({ 
      bears: state.bears, 
      fish: state.fish 
    }),
    shallow
  );

// ✅ Better: Use multiple atomic selectors
const useBearsAndFish = () => ({
  bears: useBears(),
  fish: useFish(),
});
```

## File Organization

```
lib/stores/
├── index.ts              # Export all stores
├── nodeStore.ts          # Node editor state
├── themeStore.ts         # Theme and UI preferences
├── errorStore.ts         # Error tracking and notifications
├── authStore.ts          # Authentication state (if needed)
└── __tests__/            # Store tests
    ├── nodeStore.test.ts
    ├── themeStore.test.ts
    └── errorStore.test.ts

hooks/
├── useNodeSelection.ts   # Composed node hooks
├── useUserPreferences.ts # Server/client state composition
└── useErrorHandler.ts    # Error handling composition
```

## Integration Guidelines

### With ReactFlow

```typescript
// Integrate Zustand store with ReactFlow state
const FlowEditor = () => {
  const selectedNodeId = useSelectedNodeId();
  const { selectNode } = useNodeActions();
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    selectNode(node.id);
  }, [selectNode]);
  
  return (
    <ReactFlow
      onNodeClick={onNodeClick}
      // ... other props
    />
  );
};
```

### With Convex

```typescript
// Sync local state changes to server
const useSyncNodeState = () => {
  const selectedNodeId = useSelectedNodeId();
  const updateUserState = useMutation(api.users.updateState);
  
  useEffect(() => {
    if (selectedNodeId) {
      updateUserState({ lastSelectedNode: selectedNodeId });
    }
  }, [selectedNodeId, updateUserState]);
};
```

## Common Anti-Patterns to Avoid

### ❌ Exporting Raw Stores

```typescript
// Don't do this
export const bearStore = create(/* ... */);

// Components might do this (bad)
const { bears } = bearStore(); // Subscribes to everything!
```

### ❌ Using Setters Instead of Events

```typescript
// ❌ Bad: Setter-style actions
actions: {
  setBears: (bears) => set({ bears }),
  setFish: (fish) => set({ fish }),
}

// ✅ Good: Event-style actions
actions: {
  increasePopulation: (by) => set((state) => ({ bears: state.bears + by })),
  eatFish: () => set((state) => ({ fish: state.fish - 1 })),
}
```

### ❌ Large Monolithic Stores

```typescript
// ❌ Bad: Everything in one store
const useAppStore = create(() => ({
  user: {},
  nodes: [],
  theme: 'light',
  errors: [],
  // ... 50 more properties
}));

// ✅ Good: Separate focused stores
const useUserStore = create(/* user state */);
const useNodeStore = create(/* node state */);
const useThemeStore = create(/* theme state */);
```

## File References

- **Store Examples**: #[[file:lib/stores/]]
- **Custom Hook Patterns**: #[[file:hooks/useNodeData.ts]]
- **ReactFlow Integration**: #[[file:components/flow-editor/]]
- **Convex Integration**: #[[file:convex/]]
- **Testing Utilities**: #[[file:__tests__/stores/]]

## External References

- [TkDodo's Zustand Best Practices](https://tkdodo.eu/blog/working-with-zustand)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Zustand Middleware](https://github.com/pmndrs/zustand#middleware)