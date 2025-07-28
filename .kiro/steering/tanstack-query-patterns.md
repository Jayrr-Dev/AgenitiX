---
inclusion: fileMatch
fileMatchPattern: "**/queries/**/*", "**/hooks/use*Query.ts", "**/hooks/use*Mutation.ts", "**/*query.ts", "**/services/**/*", "**/types/**/*"
---

# TanStack Query Best Practices

## Overview

AgenitiX uses [TanStack Query](https://tanstack.com/query/latest) for server state management with a **scalable, maintainable architecture** that separates concerns and prevents common pitfalls. This approach ensures queries remain reusable, type-safe, and error-free across your application.

## Core Architecture Principles

1. **Separation of Concerns**: Split queries into hooks, services, types, and constants
2. **Single Source of Truth**: Each query is defined once and reused everywhere
3. **Type Safety**: Full TypeScript support with proper return types
4. **Consistency**: Centralized query keys prevent typos and invalidation issues
5. **Maintainability**: Easy to modify, test, and debug

## ❌ Anti-Pattern: Inline Queries in Components

```typescript
// ❌ DON'T DO THIS - Error-prone, not reusable, no type safety
const BadComponent = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['flows'], // Typo-prone, inconsistent
    queryFn: async () => {
      const response = await axios.get('/api/flows'); // Direct API call
      return response.data;
    },
  });

  // Repeated in every component that needs flows...
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error occurred</div>;
  
  return <div>{/* Component logic */}</div>;
};
```

## ✅ Proper Pattern: Organized Query Architecture

### File Structure

```
src/
├── hooks/                    # Custom query hooks
│   ├── useFlowsQuery.ts
│   ├── useNodesQuery.ts
│   └── useUserQuery.ts
├── services/                 # API service functions
│   ├── flowsService.ts
│   ├── nodesService.ts
│   └── userService.ts
├── types/                    # Type definitions
│   ├── flows.ts
│   ├── nodes.ts
│   └── user.ts
├── constants/                # Query keys and constants
│   ├── queryKeys.ts
│   └── apiConstants.ts
```

### 1. Types Definition

```typescript
// types/flows.ts
/**
 * FLOWS TYPES - Type definitions for flow-related data
 *
 * • Defines all flow-related interfaces
 * • Ensures type safety across the application
 * • Single source of truth for flow data structure
 * • Integrates with Convex-generated types
 *
 * Keywords: types, flows, typescript, data-structure
 */

export interface Flow {
  _id: string;
  name: string;
  description?: string;
  category: string;
  isPublished: boolean;
  nodes: FlowNode[];
  edges: FlowEdge[];
  createdAt: number;
  updatedAt: number;
  userId: string;
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface CreateFlowRequest {
  name: string;
  description?: string;
  category?: string;
}

export interface UpdateFlowRequest {
  flowId: string;
  data: Partial<Omit<Flow, '_id' | 'createdAt' | 'userId'>>;
}

export interface FlowFilters {
  search?: string;
  category?: string;
  isPublished?: boolean;
  userId?: string;
}
```

### 2. Constants for Query Keys

```typescript
// constants/queryKeys.ts
/**
 * QUERY KEYS CONSTANTS - Centralized query key management
 *
 * • Prevents typos in query keys
 * • Enables consistent invalidation
 * • Supports hierarchical key structure
 * • Type-safe query key generation
 *
 * Keywords: query-keys, constants, invalidation, type-safety
 */

export const QUERY_KEYS = {
  // Flows
  FLOWS: ['flows'] as const,
  FLOWS_LIST: (filters: FlowFilters) => [...QUERY_KEYS.FLOWS, 'list', filters] as const,
  FLOW_DETAIL: (flowId: string) => [...QUERY_KEYS.FLOWS, 'detail', flowId] as const,
  FLOW_NODES: (flowId: string) => [...QUERY_KEYS.FLOWS, 'nodes', flowId] as const,
  
  // Nodes
  NODES: ['nodes'] as const,
  NODE_DETAIL: (nodeId: string) => [...QUERY_KEYS.NODES, 'detail', nodeId] as const,
  NODE_METRICS: (nodeId: string) => [...QUERY_KEYS.NODES, 'metrics', nodeId] as const,
  
  // Users
  USERS: ['users'] as const,
  USER_PROFILE: (userId: string) => [...QUERY_KEYS.USERS, 'profile', userId] as const,
  USER_FLOWS: (userId: string) => [...QUERY_KEYS.USERS, 'flows', userId] as const,
} as const;

// Helper function for dynamic query keys
export const createQueryKey = (base: readonly string[], ...params: (string | number | object)[]) => {
  return [...base, ...params] as const;
};
```

### 3. API Service Functions

```typescript
// services/flowsService.ts
/**
 * FLOWS SERVICE - API service for flow operations
 *
 * • Centralized API logic for flows
 * • Type-safe request/response handling
 * • Integration with Convex mutations/queries
 * • Reusable across different hooks
 *
 * Keywords: api-service, flows, convex, type-safety
 */

import { convex } from '@/lib/convex';
import { api } from '@/convex/_generated/api';
import type { 
  Flow, 
  CreateFlowRequest, 
  UpdateFlowRequest, 
  FlowFilters 
} from '@/types/flows';

export const flowsService = {
  // Get paginated flows with filters
  getFlows: async (filters: FlowFilters = {}, pageParam = 0, pageSize = 20): Promise<Flow[]> => {
    return await convex.query(api.flows.getFlows, {
      ...filters,
      limit: pageSize,
      offset: pageParam * pageSize,
    });
  },

  // Get single flow by ID
  getFlow: async (flowId: string): Promise<Flow> => {
    const flow = await convex.query(api.flows.getFlow, { flowId });
    if (!flow) {
      throw new Error(`Flow with ID ${flowId} not found`);
    }
    return flow;
  },

  // Create new flow
  createFlow: async (data: CreateFlowRequest): Promise<Flow> => {
    return await convex.mutation(api.flows.createFlow, data);
  },

  // Update existing flow
  updateFlow: async ({ flowId, data }: UpdateFlowRequest): Promise<Flow> => {
    return await convex.mutation(api.flows.updateFlow, { flowId, data });
  },

  // Delete flow
  deleteFlow: async (flowId: string): Promise<void> => {
    await convex.mutation(api.flows.deleteFlow, { flowId });
  },

  // Duplicate flow
  duplicateFlow: async (flowId: string, newName?: string): Promise<Flow> => {
    return await convex.mutation(api.flows.duplicateFlow, { 
      flowId, 
      newName: newName || `Copy of Flow` 
    });
  },

  // Get user flows
  getUserFlows: async (userId: string): Promise<Flow[]> => {
    return await convex.query(api.flows.getUserFlows, { userId });
  },
};

export default flowsService;
```

### 4. Custom Query Hooks

```typescript
// hooks/useFlowsQuery.ts
/**
 * FLOWS QUERY HOOK - Reusable flows data fetching
 *
 * • Single source of truth for flows queries
 * • Type-safe data and error handling
 * • Consistent loading states across components
 * • Built-in caching and background updates
 *
 * Keywords: flows-query, reusable, type-safe, caching
 */

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { flowsService } from '@/services/flowsService';
import type { FlowFilters } from '@/types/flows';

// Infinite query for paginated flows
export const useFlowsQuery = (filters: FlowFilters = {}, pageSize = 20) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.FLOWS_LIST(filters),
    queryFn: ({ pageParam = 0 }) => 
      flowsService.getFlows(filters, pageParam, pageSize),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000,    // 5 minutes
  });
};

// Convenience hook for flat flows list
export const useFlowsList = (filters: FlowFilters = {}) => {
  const query = useFlowsQuery(filters);
  
  const flows = query.data?.pages.flat() ?? [];
  
  return {
    ...query,
    flows,
    totalCount: flows.length,
    isEmpty: flows.length === 0 && !query.isLoading,
  };
};

// Single flow query
export const useFlowQuery = (flowId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.FLOW_DETAIL(flowId),
    queryFn: () => flowsService.getFlow(flowId),
    enabled: !!flowId,
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 404s
      if (error?.message?.includes('not found')) return false;
      return failureCount < 3;
    },
  });
};

// User flows query
export const useUserFlowsQuery = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER_FLOWS(userId),
    queryFn: () => flowsService.getUserFlows(userId),
    enabled: !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
};

// Transform data with select
export const useFlowsForSelect = (filters: FlowFilters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.FLOWS_LIST(filters),
    queryFn: () => flowsService.getFlows(filters, 0, 100), // Get more for select
    select: (data) => data.map(flow => ({
      value: flow._id,
      label: flow.name,
      category: flow.category,
    })),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

### 5. Mutation Hooks

```typescript
// hooks/useFlowsMutation.ts
/**
 * FLOWS MUTATION HOOKS - Flow modification operations
 *
 * • Centralized mutation logic for flows
 * • Optimistic updates with rollback
 * • Consistent error handling and notifications
 * • Automatic cache invalidation
 *
 * Keywords: mutations, flows, optimistic-updates, cache-invalidation
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { flowsService } from '@/services/flowsService';
import { toast } from 'sonner';
import type { CreateFlowRequest, UpdateFlowRequest } from '@/types/flows';

// Create flow mutation
export const useCreateFlowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: flowsService.createFlow,
    onSuccess: (newFlow) => {
      // Invalidate flows list to show the new flow
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FLOWS });
      
      // Add to cache for immediate access
      queryClient.setQueryData(
        QUERY_KEYS.FLOW_DETAIL(newFlow._id), 
        newFlow
      );
      
      toast.success(`Flow "${newFlow.name}" created successfully!`);
    },
    onError: (error: Error) => {
      console.error('Create flow error:', error);
      toast.error('Failed to create flow. Please try again.');
    },
  });
};

// Update flow mutation with optimistic updates
export const useUpdateFlowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: flowsService.updateFlow,
    
    // Optimistic update
    onMutate: async ({ flowId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: QUERY_KEYS.FLOW_DETAIL(flowId) 
      });
      
      // Snapshot previous value
      const previousFlow = queryClient.getQueryData(
        QUERY_KEYS.FLOW_DETAIL(flowId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        QUERY_KEYS.FLOW_DETAIL(flowId),
        (old: any) => ({ ...old, ...data })
      );
      
      return { previousFlow, flowId };
    },
    
    onSuccess: (updatedFlow, { flowId }) => {
      // Update with real data
      queryClient.setQueryData(
        QUERY_KEYS.FLOW_DETAIL(flowId),
        updatedFlow
      );
      
      // Invalidate flows list to update any cached lists
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FLOWS });
      
      toast.success('Flow updated successfully!');
    },
    
    onError: (error, { flowId }, context) => {
      // Rollback optimistic update
      if (context?.previousFlow) {
        queryClient.setQueryData(
          QUERY_KEYS.FLOW_DETAIL(flowId),
          context.previousFlow
        );
      }
      
      console.error('Update flow error:', error);
      toast.error('Failed to update flow. Please try again.');
    },
  });
};

// Delete flow mutation
export const useDeleteFlowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: flowsService.deleteFlow,
    onSuccess: (_, flowId) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: QUERY_KEYS.FLOW_DETAIL(flowId) 
      });
      
      // Invalidate flows list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FLOWS });
      
      toast.success('Flow deleted successfully!');
    },
    onError: (error: Error) => {
      console.error('Delete flow error:', error);
      toast.error('Failed to delete flow. Please try again.');
    },
  });
};

// Duplicate flow mutation
export const useDuplicateFlowMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ flowId, newName }: { flowId: string; newName?: string }) =>
      flowsService.duplicateFlow(flowId, newName),
    onSuccess: (duplicatedFlow) => {
      // Invalidate flows list to show the duplicated flow
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FLOWS });
      
      // Cache the new flow
      queryClient.setQueryData(
        QUERY_KEYS.FLOW_DETAIL(duplicatedFlow._id),
        duplicatedFlow
      );
      
      toast.success(`Flow "${duplicatedFlow.name}" duplicated successfully!`);
    },
    onError: (error: Error) => {
      console.error('Duplicate flow error:', error);
      toast.error('Failed to duplicate flow. Please try again.');
    },
  });
};
```

### 6. Clean Component Usage

```typescript
// components/FlowsList.tsx
/**
 * FLOWS LIST COMPONENT - Clean, reusable flows display
 *
 * • Uses organized query hooks for data fetching
 * • Type-safe data handling
 * • Consistent loading and error states
 * • No duplicate query logic
 *
 * Keywords: flows-list, clean-components, reusable, type-safe
 */

import React from 'react';
import { useFlowsList } from '@/hooks/useFlowsQuery';
import { useCreateFlowMutation, useDeleteFlowMutation } from '@/hooks/useFlowsMutation';
import type { FlowFilters } from '@/types/flows';

interface FlowsListProps {
  filters?: FlowFilters;
}

export const FlowsList: React.FC<FlowsListProps> = ({ filters = {} }) => {
  // ✅ Clean, one-line data fetching
  const { flows, isLoading, isError, error, isEmpty } = useFlowsList(filters);
  const createFlowMutation = useCreateFlowMutation();
  const deleteFlowMutation = useDeleteFlowMutation();
  
  // Handle loading state
  if (isLoading) {
    return <div>Loading flows...</div>;
  }
  
  // Handle error state
  if (isError) {
    return <div>Error loading flows: {error?.message}</div>;
  }
  
  // Handle empty state
  if (isEmpty) {
    return <div>No flows found. Create your first flow!</div>;
  }
  
  // ✅ Type-safe data access
  return (
    <div className="flows-list">
      {flows.map((flow) => (
        <div key={flow._id} className="flow-item">
          <h3>{flow.name}</h3>
          <p>{flow.description}</p>
          <span className="category">{flow.category}</span>
          <button 
            onClick={() => deleteFlowMutation.mutate(flow._id)}
            disabled={deleteFlowMutation.isPending}
          >
            {deleteFlowMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 7. Select Component Example

```typescript
// components/FlowsSelect.tsx
/**
 * FLOWS SELECT COMPONENT - Reusable flow selection
 *
 * • Reuses the same data source as FlowsList
 * • Transformed data for select options
 * • Type-safe option handling
 * • No duplicate API calls
 *
 * Keywords: flows-select, reusable, type-safe, transformed-data
 */

import React from 'react';
import { useFlowsForSelect } from '@/hooks/useFlowsQuery';

interface FlowsSelectProps {
  onSelect: (flowId: string) => void;
  value?: string;
  placeholder?: string;
}

export const FlowsSelect: React.FC<FlowsSelectProps> = ({ 
  onSelect, 
  value, 
  placeholder = "Select a flow..." 
}) => {
  // ✅ Reuses the same query hook with data transformation
  const { data: flowOptions, isLoading, isError } = useFlowsForSelect();
  
  if (isLoading) return <div>Loading flows...</div>;
  if (isError) return <div>Error loading flows</div>;
  
  return (
    <select 
      value={value || ''} 
      onChange={(e) => onSelect(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {flowOptions?.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label} ({option.category})
        </option>
      ))}
    </select>
  );
};
```

## Benefits of This Architecture

### ✅ **Maintainability**
- **Single Source of Truth**: Each query is defined once and reused everywhere
- **Easy Refactoring**: Change API logic in one place, updates everywhere
- **Consistent Error Handling**: Standardized error states across components

### ✅ **Type Safety**
- **Full TypeScript Support**: Types flow from service → hook → component
- **IDE Support**: Auto-completion and error detection
- **Runtime Safety**: Catch type errors at compile time

### ✅ **Developer Experience**
- **Clean Components**: Components focus on UI, not data fetching logic
- **Reusable Hooks**: Write once, use everywhere
- **Testability**: Easy to mock services and test hooks independently

### ✅ **Performance**
- **Automatic Caching**: TanStack Query handles caching automatically
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Smart Invalidation**: Consistent query key structure enables precise cache updates

### ✅ **Consistency**
- **No Typos**: Centralized query keys prevent invalidation bugs
- **Standardized Patterns**: All queries follow the same structure
- **Predictable Behavior**: Same loading/error states across the app

## Migration from Inline Queries

### Step 1: Identify Inline Queries
```typescript
// ❌ Find patterns like this in your components
const { data, isLoading } = useQuery({
  queryKey: ['flows'],
  queryFn: async () => {
    const response = await axios.get('/api/flows');
    return response.data;
  },
});
```

### Step 2: Extract to Service
```typescript
// ✅ Move API logic to service
export const getFlows = async (): Promise<Flow[]> => {
  const response = await axios.get('/api/flows');
  return response.data;
};
```

### Step 3: Create Query Hook
```typescript
// ✅ Create reusable hook
export const useFlowsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.FLOWS,
    queryFn: getFlows,
  });
};
```

### Step 4: Update Components
```typescript
// ✅ Clean component usage
const { data: flows, isLoading } = useFlowsQuery();
```

## File References

- **Query Hooks**: #[[file:hooks/queries/]]
- **API Services**: #[[file:services/]]
- **Type Definitions**: #[[file:types/]]
- **Query Keys**: #[[file:constants/queryKeys.ts]]
- **Example Components**: #[[file:components/]]

## External References

- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [Scalable React Query Architecture](https://youtu.be/1cq3g7kh9hY)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/)
- [Clean Code Principles](https://clean-code-developer.com/)