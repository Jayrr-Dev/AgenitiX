/**
 * File: .kiro/steering/development-standards.md
 * DEVELOPMENT STANDARDS & BEST PRACTICES - Comprehensive coding guidelines for AgenitiX
 * 
 * • Complete development workflow standards and naming conventions
 * • Domain-driven design architecture patterns and file organization
 * • React best practices with TypeScript, JSDoc, and modern patterns
 * • UI/UX guidelines with Shadcn, dark theme optimization, and mobile-first design
 * • Code quality standards with systematic approach and maintainability focus
 * • Integration patterns for Convex, Sentry, and other platform tools
 * 
 * Keywords: development-standards, best-practices, domain-driven-design, react-patterns, ui-guidelines
 */

# Development Standards & Best Practices

## Overview

This document establishes comprehensive development standards for the AgenitiX platform, ensuring consistency, maintainability, and scalability across all code contributions. These standards integrate with our existing Convex, Sentry, and architectural guidelines.

## Core Development Principles

### 1. Systematic Approach
- **Always reference documentation first** to understand best practices
- **Act systematically** - plan before implementing
- **Single source of truth** - optimize data and state management
- **Top-level constants** - make all variables maintainable constants
- **Documentation-driven development** - document intent and architecture

### 2. Code Quality Standards
- **JSDoc documentation** for all functions, components, and complex logic
- **TypeScript strict mode** with comprehensive type coverage
- **Modern React patterns** with hooks, context, and functional components
- **Performance optimization** with proper memoization and lazy loading
- **Error handling** with consistent patterns and Sentry integration

## Naming Conventions

### File Naming Standards

```typescript
// ✅ Correct file naming patterns
components/
├── ui/
│   ├── button.tsx              // Shadcn components: kebab-case
│   ├── input.tsx
│   └── dialog.tsx
├── TaskList.tsx                // React components: PascalCase
├── CreateFlowModal.tsx
└── UserProfile.tsx

hooks/
├── use-auth.ts                 // Custom hooks: use-prefix + kebab-case
├── use-flow-data.ts
└── use-email-analytics.ts

lib/
├── utils.ts                    // Utility files: kebab-case
├── api-client.ts
└── validation-schemas.ts

types/
├── user-types.ts               // Type definition files: kebab-case
├── flow-types.ts
└── email-types.ts
```

### Component and Function Naming

```typescript
// ✅ Component naming - PascalCase
export const TaskList = () => { /* ... */ };
export const CreateFlowModal = () => { /* ... */ };
export const UserProfileCard = () => { /* ... */ };

// ✅ Hook naming - use prefix + camelCase
export const useAuth = () => { /* ... */ };
export const useFlowData = () => { /* ... */ };
export const useEmailAnalytics = () => { /* ... */ };

// ✅ Function naming - camelCase with descriptive names
export const validateEmailTemplate = () => { /* ... */ };
export const formatUserDisplayName = () => { /* ... */ };
export const calculateFlowExecutionTime = () => { /* ... */ };
```

### Convex Naming Convention
Follow the established [convex-naming-convention.md](.kiro/steering/convex-naming-convention.md):

```typescript
// ✅ Table names: domain_resource_plural (snake_case)
auth_users
email_templates
email_logs
workflow_runs
flow_nodes

// ✅ Join tables: alphabetical singular entities
project_users
user_roles
tag_posts
```

## JSDoc Documentation Standards

### Component Documentation

```typescript
/**
 * TaskList Component - Displays a paginated list of user tasks with filtering
 * 
 * Renders tasks in a responsive grid layout with real-time updates from Convex.
 * Supports filtering by status, priority, and date range with optimistic updates.
 * 
 * @component
 * @example
 * ```tsx
 * <TaskList 
 *   userId="user_123" 
 *   filters={{ status: 'active', priority: 'high' }}
 *   onTaskSelect={(task) => console.log('Selected:', task)}
 * />
 * ```
 * 
 * @param {Object} props - Component props
 * @param {string} props.userId - ID of the user whose tasks to display
 * @param {TaskFilters} [props.filters] - Optional filters to apply to task list
 * @param {(task: Task) => void} [props.onTaskSelect] - Callback when task is selected
 * @param {boolean} [props.showCompleted=false] - Whether to show completed tasks
 * 
 * @returns {JSX.Element} Rendered task list component
 * 
 * @see {@link useTaskData} - Hook for task data management
 * @see {@link TaskFilters} - Type definition for filter options
 * 
 * @since 1.0.0
 * @author AgenitiX Team
 */
export const TaskList: React.FC<TaskListProps> = ({
  userId,
  filters,
  onTaskSelect,
  showCompleted = false
}) => {
  // Implementation...
};
```

### Hook Documentation

```typescript
/**
 * useFlowData Hook - Manages flow data with real-time Convex integration
 * 
 * Provides CRUD operations for flows with optimistic updates, error handling,
 * and automatic cache invalidation. Integrates with Convex for real-time sync.
 * 
 * @hook
 * @example
 * ```tsx
 * const { flows, createFlow, updateFlow, deleteFlow, isLoading, error } = useFlowData({
 *   userId: 'user_123',
 *   filters: { status: 'active' }
 * });
 * 
 * const handleCreateFlow = async () => {
 *   await createFlow({ name: 'New Flow', description: 'Flow description' });
 * };
 * ```
 * 
 * @param {Object} options - Hook configuration options
 * @param {string} options.userId - ID of the user whose flows to manage
 * @param {FlowFilters} [options.filters] - Optional filters for flow queries
 * @param {boolean} [options.enableRealtime=true] - Enable real-time updates
 * 
 * @returns {Object} Flow data and operations
 * @returns {Flow[]} returns.flows - Array of user flows
 * @returns {(data: CreateFlowData) => Promise<Flow>} returns.createFlow - Create new flow
 * @returns {(id: string, data: UpdateFlowData) => Promise<Flow>} returns.updateFlow - Update existing flow
 * @returns {(id: string) => Promise<void>} returns.deleteFlow - Delete flow
 * @returns {boolean} returns.isLoading - Loading state indicator
 * @returns {Error | null} returns.error - Current error state
 * 
 * @throws {ConvexError} When Convex operations fail
 * @throws {ValidationError} When input data is invalid
 * 
 * @see {@link Flow} - Flow type definition
 * @see {@link useConvexAuth} - Authentication hook dependency
 * 
 * @since 1.0.0
 */
export const useFlowData = (options: UseFlowDataOptions): UseFlowDataReturn => {
  // Implementation...
};
```

### Utility Function Documentation

```typescript
/**
 * validateEmailTemplate - Validates email template data structure and content
 * 
 * Performs comprehensive validation of email template including:
 * - Required field validation (subject, body, variables)
 * - HTML content sanitization and structure validation
 * - Variable placeholder validation and consistency checks
 * - Template size and complexity limits
 * 
 * @function
 * @example
 * ```typescript
 * const template = {
 *   subject: 'Welcome {{name}}!',
 *   body: '<h1>Hello {{name}}</h1><p>Welcome to {{platform}}</p>',
 *   variables: ['name', 'platform']
 * };
 * 
 * const result = validateEmailTemplate(template);
 * if (result.isValid) {
 *   console.log('Template is valid');
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 * 
 * @param {EmailTemplate} template - Email template object to validate
 * @param {Object} [options] - Validation options
 * @param {boolean} [options.strictMode=false] - Enable strict validation rules
 * @param {number} [options.maxVariables=50] - Maximum allowed variables
 * @param {number} [options.maxBodyLength=100000] - Maximum body content length
 * 
 * @returns {ValidationResult} Validation result object
 * @returns {boolean} returns.isValid - Whether template passes validation
 * @returns {ValidationError[]} returns.errors - Array of validation errors
 * @returns {string[]} returns.warnings - Array of validation warnings
 * @returns {EmailTemplate} returns.sanitized - Sanitized template data
 * 
 * @throws {TypeError} When template parameter is not an object
 * @throws {ValidationError} When critical validation rules fail
 * 
 * @see {@link EmailTemplate} - Template type definition
 * @see {@link sanitizeHtmlContent} - HTML sanitization utility
 * 
 * @since 1.0.0
 * @version 1.2.0 - Added HTML sanitization
 */
export const validateEmailTemplate = (
  template: EmailTemplate,
  options: ValidationOptions = {}
): ValidationResult => {
  // Implementation...
};
```

## Domain-Driven Design Architecture

### Project Structure

```
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Theme + Convex providers
│   ├── providers/
│   │   ├── theme-provider.tsx     # Dark theme optimization
│   │   └── convex-client-provider.tsx
│   └── (feature-routes)/
│       ├── tasks/
│       │   ├── page.tsx           # Server Component (list view)
│       │   ├── task-form.tsx      # Client Component (create)
│       │   └── actions.ts         # Server Actions → use-cases
│       └── flows/
│           ├── page.tsx
│           ├── flow-editor.tsx
│           └── actions.ts
├── convex/                        # Convex backend
│   ├── schema.ts                  # Database schema
│   ├── tasks.ts                   # Query + Mutation functions
│   └── flows.ts
├── domain/                        # Pure business rules
│   ├── task/
│   │   ├── entities/
│   │   │   ├── task.ts           # Task entity with business logic
│   │   │   └── task-status.ts    # Value objects
│   │   ├── repositories/
│   │   │   └── task-repository.ts # Repository interface
│   │   └── services/
│   │       └── task-service.ts    # Domain services
│   └── flow/
│       ├── entities/
│       ├── repositories/
│       └── services/
├── application/                   # Use-cases + DTOs
│   ├── use-cases/
│   │   ├── create-task.ts        # Application use cases
│   │   └── update-task-status.ts
│   ├── dtos/
│   │   ├── task-dto.ts           # Data transfer objects
│   │   └── flow-dto.ts
│   └── events/
│       └── task-created-event.ts  # Domain events
├── infrastructure/                # External concerns
│   ├── convex/
│   │   ├── task-convex-repository.ts # Convex implementation
│   │   └── flow-convex-repository.ts
│   ├── email/
│   │   ├── mailer.ts             # Resend client
│   │   └── templates/
│   │       └── task-created.tsx   # Email templates
│   └── external-apis/
│       └── third-party-client.ts
├── lib/                          # Shared utilities
│   ├── di.ts                     # Dependency injection container
│   ├── stores/
│   │   └── task-store.ts         # Zustand + Convex live query
│   ├── utils/
│   │   ├── validation.ts         # Validation utilities
│   │   └── formatting.ts         # Formatting utilities
│   └── constants/
│       ├── api-endpoints.ts      # API endpoint constants
│       └── ui-constants.ts       # UI-related constants
└── components/                   # UI components
    ├── ui/                       # Shadcn base components
    ├── forms/                    # Form components
    ├── layouts/                  # Layout components
    └── features/                 # Feature-specific components
```

### File Header Documentation

Every file must include a descriptive header comment:

```typescript
/**
 * File: domain/task/entities/task.ts
 * TASK ENTITY - Core business logic for task management
 * 
 * • Task entity with business rules and validation
 * • Status transitions and workflow management
 * • Priority calculation and deadline handling
 * • Integration with flow execution system
 * • Audit trail and change tracking capabilities
 * • Domain events for task lifecycle changes
 * 
 * Keywords: task-entity, business-logic, domain-model, workflow, audit-trail
 */

/**
 * File: components/ui/task-card.tsx
 * TASK CARD COMPONENT - Reusable task display component
 * 
 * • Mobile-first responsive task card with dark theme optimization
 * • Interactive states with proper contrast and accessibility
 * • Drag-and-drop support for task reordering
 * • Real-time status updates with optimistic UI
 * • Integrated with Shadcn design system
 * • Keyboard navigation and screen reader support
 * 
 * Keywords: task-card, mobile-first, dark-theme, accessibility, shadcn, real-time
 */
```

## React Best Practices

### Component Structure

```typescript
/**
 * File: components/features/task-list.tsx
 * TASK LIST COMPONENT - Comprehensive task management interface
 * 
 * • Real-time task list with Convex integration and optimistic updates
 * • Mobile-first responsive design with dark theme optimization
 * • Advanced filtering, sorting, and search capabilities
 * • Drag-and-drop task reordering with persistence
 * • Keyboard shortcuts and accessibility compliance
 * • Error boundaries and loading states with skeleton UI
 * 
 * Keywords: task-list, real-time, mobile-first, accessibility, convex-integration
 */

import React, { useMemo, useCallback, useState } from 'react';
import { useQuery } from 'convex/react';
import * as Sentry from '@sentry/nextjs';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTaskData } from '@/hooks/use-task-data';
import { validateTaskFilters } from '@/lib/utils/validation';
import { TASK_STATUS_OPTIONS, UI_CONSTANTS } from '@/lib/constants';

import type { Task, TaskFilters, TaskSortOptions } from '@/types/task-types';

// Top-level constants for maintainability
const DEFAULT_PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;
const MAX_TASKS_PER_PAGE = 100;

const FILTER_OPTIONS = {
  status: TASK_STATUS_OPTIONS,
  priority: ['low', 'medium', 'high', 'urgent'] as const,
  sortBy: ['createdAt', 'updatedAt', 'priority', 'dueDate'] as const,
} as const;

interface TaskListProps {
  /** ID of the user whose tasks to display */
  userId: string;
  /** Optional filters to apply to task list */
  filters?: TaskFilters;
  /** Callback when task is selected */
  onTaskSelect?: (task: Task) => void;
  /** Whether to show completed tasks */
  showCompleted?: boolean;
  /** Custom CSS classes for styling */
  className?: string;
}

/**
 * TaskList Component - Displays a paginated list of user tasks with filtering
 * 
 * Renders tasks in a responsive grid layout with real-time updates from Convex.
 * Supports filtering by status, priority, and date range with optimistic updates.
 * 
 * @component
 * @example
 * ```tsx
 * <TaskList 
 *   userId="user_123" 
 *   filters={{ status: 'active', priority: 'high' }}
 *   onTaskSelect={(task) => console.log('Selected:', task)}
 * />
 * ```
 */
export const TaskList: React.FC<TaskListProps> = ({
  userId,
  filters = {},
  onTaskSelect,
  showCompleted = false,
  className = '',
}) => {
  // State management with proper typing
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOptions, setSortOptions] = useState<TaskSortOptions>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // Custom hook for task data management
  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  } = useTaskData({
    userId,
    filters: {
      ...filters,
      showCompleted,
      search: searchQuery,
    },
    sortOptions,
  });

  // Memoized computed values
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  // Event handlers with useCallback for performance
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleTaskClick = useCallback((task: Task) => {
    return Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Task Selection',
      },
      (span) => {
        span.setAttribute('taskId', task._id);
        span.setAttribute('taskStatus', task.status);
        
        onTaskSelect?.(task);
      }
    );
  }, [onTaskSelect]);

  const handleSortChange = useCallback((newSortOptions: TaskSortOptions) => {
    setSortOptions(newSortOptions);
  }, []);

  // Error handling
  if (error) {
    Sentry.captureException(error);
    return (
      <div className="flex items-center justify-center p-8 text-destructive">
        <p>Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full"
          />
        </div>
        
        {/* Sort Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSortChange({
              ...sortOptions,
              sortOrder: sortOptions.sortOrder === 'asc' ? 'desc' : 'asc'
            })}
          >
            Sort {sortOptions.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Task List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onClick={() => handleTaskClick(task)}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? 'No tasks match your search.' : 'No tasks found.'}
          </p>
        </div>
      )}
    </div>
  );
};

// Export component with display name for debugging
TaskList.displayName = 'TaskList';
```

### Custom Hook Pattern

```typescript
/**
 * File: hooks/use-task-data.ts
 * TASK DATA HOOK - Comprehensive task data management with Convex integration
 * 
 * • Real-time task synchronization with optimistic updates
 * • CRUD operations with error handling and retry logic
 * • Advanced filtering, sorting, and pagination support
 * • Cache management and automatic invalidation
 * • Integration with Sentry for error tracking
 * • TypeScript strict mode with comprehensive type safety
 * 
 * Keywords: task-data, convex-integration, real-time, optimistic-updates, error-handling
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import * as Sentry from '@sentry/nextjs';

import { api } from '@/convex/_generated/api';
import { validateTaskData } from '@/lib/utils/validation';
import { TASK_DEFAULTS } from '@/lib/constants';

import type { Task, CreateTaskData, UpdateTaskData, TaskFilters, TaskSortOptions } from '@/types/task-types';
import type { Id } from '@/convex/_generated/dataModel';

interface UseTaskDataOptions {
  /** ID of the user whose tasks to manage */
  userId: string;
  /** Optional filters for task queries */
  filters?: TaskFilters;
  /** Sort options for task ordering */
  sortOptions?: TaskSortOptions;
  /** Enable real-time updates */
  enableRealtime?: boolean;
}

interface UseTaskDataReturn {
  /** Array of user tasks */
  tasks: Task[] | undefined;
  /** Loading state indicator */
  isLoading: boolean;
  /** Current error state */
  error: Error | null;
  /** Create new task */
  createTask: (data: CreateTaskData) => Promise<Task>;
  /** Update existing task */
  updateTask: (id: Id<'tasks'>, data: UpdateTaskData) => Promise<Task>;
  /** Delete task */
  deleteTask: (id: Id<'tasks'>) => Promise<void>;
  /** Refresh task data */
  refresh: () => void;
}

/**
 * useTaskData Hook - Manages task data with real-time Convex integration
 * 
 * Provides CRUD operations for tasks with optimistic updates, error handling,
 * and automatic cache invalidation. Integrates with Convex for real-time sync.
 * 
 * @hook
 * @example
 * ```tsx
 * const { tasks, createTask, updateTask, deleteTask, isLoading, error } = useTaskData({
 *   userId: 'user_123',
 *   filters: { status: 'active' }
 * });
 * 
 * const handleCreateTask = async () => {
 *   await createTask({ title: 'New Task', description: 'Task description' });
 * };
 * ```
 */
export const useTaskData = (options: UseTaskDataOptions): UseTaskDataReturn => {
  const {
    userId,
    filters = {},
    sortOptions = TASK_DEFAULTS.sortOptions,
    enableRealtime = true,
  } = options;

  // Local state for optimistic updates
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // Convex queries and mutations
  const tasks = useQuery(
    api.tasks.getUserTasks,
    enableRealtime ? { userId, filters, sortOptions } : 'skip'
  );

  const createTaskMutation = useMutation(api.tasks.createTask);
  const updateTaskMutation = useMutation(api.tasks.updateTask);
  const deleteTaskMutation = useMutation(api.tasks.deleteTask);

  // Memoized computed values
  const isLoading = useMemo(() => {
    return tasks === undefined && enableRealtime;
  }, [tasks, enableRealtime]);

  const finalTasks = useMemo(() => {
    if (!enableRealtime) return optimisticTasks;
    return tasks || [];
  }, [tasks, optimisticTasks, enableRealtime]);

  // CRUD operations with error handling
  const createTask = useCallback(async (data: CreateTaskData): Promise<Task> => {
    return Sentry.startSpan(
      {
        op: 'task.create',
        name: 'Create Task',
      },
      async (span) => {
        try {
          // Validate input data
          const validationResult = validateTaskData(data);
          if (!validationResult.isValid) {
            throw new Error(`Validation failed: ${validationResult.errors.join(', ')}`);
          }

          span.setAttribute('taskTitle', data.title);
          span.setAttribute('userId', userId);

          // Optimistic update
          const optimisticTask: Task = {
            _id: `temp_${Date.now()}` as Id<'tasks'>,
            _creationTime: Date.now(),
            ...data,
            userId,
            status: data.status || 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          setOptimisticTasks(prev => [optimisticTask, ...prev]);

          // Perform mutation
          const newTask = await createTaskMutation({
            ...data,
            userId,
          });

          // Remove optimistic update
          setOptimisticTasks(prev => 
            prev.filter(task => task._id !== optimisticTask._id)
          );

          setError(null);
          return newTask;

        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to create task');
          setError(error);
          Sentry.captureException(error);
          
          // Remove failed optimistic update
          setOptimisticTasks(prev => 
            prev.filter(task => !task._id.startsWith('temp_'))
          );
          
          throw error;
        }
      }
    );
  }, [userId, createTaskMutation]);

  const updateTask = useCallback(async (
    id: Id<'tasks'>, 
    data: UpdateTaskData
  ): Promise<Task> => {
    return Sentry.startSpan(
      {
        op: 'task.update',
        name: 'Update Task',
      },
      async (span) => {
        try {
          span.setAttribute('taskId', id);
          span.setAttribute('updateFields', Object.keys(data).join(','));

          const updatedTask = await updateTaskMutation({
            id,
            ...data,
            updatedAt: Date.now(),
          });

          setError(null);
          return updatedTask;

        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to update task');
          setError(error);
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }, [updateTaskMutation]);

  const deleteTask = useCallback(async (id: Id<'tasks'>): Promise<void> => {
    return Sentry.startSpan(
      {
        op: 'task.delete',
        name: 'Delete Task',
      },
      async (span) => {
        try {
          span.setAttribute('taskId', id);

          await deleteTaskMutation({ id });
          setError(null);

        } catch (err) {
          const error = err instanceof Error ? err : new Error('Failed to delete task');
          setError(error);
          Sentry.captureException(error);
          throw error;
        }
      }
    );
  }, [deleteTaskMutation]);

  const refresh = useCallback(() => {
    setError(null);
    setOptimisticTasks([]);
  }, []);

  return {
    tasks: finalTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    refresh,
  };
};
```

## UI/UX Guidelines

### Shadcn Integration & Dark Theme Optimization

```typescript
/**
 * File: components/ui/task-card.tsx
 * TASK CARD COMPONENT - Mobile-first task display with dark theme optimization
 * 
 * • Responsive task card with proper contrast ratios for accessibility
 * • Dark theme optimized colors with subtle gradients and shadows
 * • Interactive states with smooth transitions and hover effects
 * • Keyboard navigation support with focus indicators
 * • Integration with Shadcn design system and theme tokens
 * • Mobile-first responsive design with touch-friendly interactions
 * 
 * Keywords: task-card, mobile-first, dark-theme, accessibility, shadcn, responsive
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Task } from '@/types/task-types';

// Top-level constants for maintainability
const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

const STATUS_COLORS = {
  pending: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-green-500/10 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

interface TaskCardProps {
  /** Task data to display */
  task: Task;
  /** Click handler for task selection */
  onClick?: () => void;
  /** Update handler for task modifications */
  onUpdate?: (id: string, data: Partial<Task>) => Promise<void>;
  /** Delete handler for task removal */
  onDelete?: (id: string) => Promise<void>;
  /** Custom CSS classes */
  className?: string;
}

/**
 * TaskCard Component - Displays individual task with interactive controls
 * 
 * Mobile-first responsive card component optimized for dark theme with
 * proper contrast ratios and accessibility features.
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  onUpdate,
  onDelete,
  className,
}) => {
  return (
    <Card
      className={cn(
        // Base styles with dark theme optimization
        'group relative overflow-hidden transition-all duration-200',
        'bg-card/50 backdrop-blur-sm border-border/50',
        'hover:bg-card/80 hover:border-border hover:shadow-lg',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        
        // Mobile-first responsive design
        'w-full min-h-[120px]',
        'sm:min-h-[140px]',
        
        // Interactive states
        onClick && 'cursor-pointer hover:scale-[1.02]',
        
        className
      )}
      onClick={onClick}
    >
      {/* Priority indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 w-1 h-full',
          task.priority === 'urgent' && 'bg-red-500',
          task.priority === 'high' && 'bg-orange-500',
          task.priority === 'medium' && 'bg-yellow-500',
          task.priority === 'low' && 'bg-blue-500'
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2 text-foreground">
            {task.title}
          </CardTitle>
          
          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-xs',
              STATUS_COLORS[task.status]
            )}
          >
            {task.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {task.description}
          </p>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between">
          {/* Priority badge */}
          <Badge
            variant="outline"
            className={cn(
              'text-xs',
              PRIORITY_COLORS[task.priority]
            )}
          >
            {task.priority}
          </Badge>

          {/* Due date */}
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              Due {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Action buttons - only visible on hover/focus */}
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {onUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(task._id, { 
                  status: task.status === 'completed' ? 'active' : 'completed' 
                });
              }}
            >
              {task.status === 'completed' ? 'Reopen' : 'Complete'}
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(task._id);
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

TaskCard.displayName = 'TaskCard';
```

### Mobile-First Responsive Design

```typescript
/**
 * File: components/layouts/responsive-layout.tsx
 * RESPONSIVE LAYOUT - Mobile-first layout system with dark theme optimization
 * 
 * • Mobile-first responsive design with progressive enhancement
 * • Dark theme optimized with proper contrast ratios
 * • Flexible grid system with breakpoint-aware components
 * • Touch-friendly interactions with appropriate sizing
 * • Accessibility compliance with keyboard navigation
 * • Performance optimized with lazy loading and code splitting
 * 
 * Keywords: responsive-layout, mobile-first, dark-theme, accessibility, performance
 */

import React from 'react';
import { cn } from '@/lib/utils';

// Top-level responsive breakpoint constants
const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

const CONTAINER_SIZES = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md', 
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
} as const;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  /** Container max width */
  maxWidth?: keyof typeof CONTAINER_SIZES;
  /** Padding configuration */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom CSS classes */
  className?: string;
}

/**
 * ResponsiveLayout Component - Mobile-first responsive container
 * 
 * Provides consistent responsive behavior across the application with
 * mobile-first design principles and dark theme optimization.
 */
export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  maxWidth = 'xl',
  padding = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        // Base container styles
        'mx-auto w-full',
        CONTAINER_SIZES[maxWidth],
        
        // Mobile-first padding
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-4 sm:p-6',
        padding === 'md' && 'p-4 sm:p-6 lg:p-8',
        padding === 'lg' && 'p-6 sm:p-8 lg:p-12',
        
        className
      )}
    >
      {children}
    </div>
  );
};

// Grid system component
interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Grid columns configuration */
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  /** Gap between grid items */
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = 'md',
  className,
}) => {
  return (
    <div
      className={cn(
        'grid',
        
        // Mobile-first grid columns
        `grid-cols-${cols.default}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        
        // Gap configuration
        gap === 'sm' && 'gap-2 sm:gap-3',
        gap === 'md' && 'gap-4 sm:gap-6',
        gap === 'lg' && 'gap-6 sm:gap-8',
        
        className
      )}
    >
      {children}
    </div>
  );
};
```

## Constants and Configuration

### Top-Level Constants Pattern

```typescript
/**
 * File: lib/constants/ui-constants.ts
 * UI CONSTANTS - Centralized UI configuration and design tokens
 * 
 * • Design system constants with dark theme optimization
 * • Responsive breakpoints and spacing scales
 * • Animation durations and easing functions
 * • Color palette with accessibility compliance
 * • Typography scales and font configurations
 * • Component sizing and interaction states
 * 
 * Keywords: ui-constants, design-system, dark-theme, accessibility, responsive
 */

// Animation constants
export const ANIMATION = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
  easing: {
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

// Spacing scale (mobile-first)
export const SPACING = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

// Component sizes
export const COMPONENT_SIZES = {
  button: {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  },
  input: {
    sm: 'h-8 text-xs',
    md: 'h-10 text-sm',
    lg: 'h-12 text-base',
  },
  card: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
} as const;

// Z-index scale
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;

// Accessibility constants
export const A11Y = {
  minContrastRatio: 4.5,
  minTouchTarget: '44px',
  focusRingWidth: '2px',
  focusRingOffset: '2px',
} as const;
```

### API Constants

```typescript
/**
 * File: lib/constants/api-constants.ts
 * API CONSTANTS - Centralized API configuration and endpoints
 * 
 * • RESTful API endpoint definitions with versioning
 * • HTTP status codes and error message constants
 * • Request timeout and retry configuration
 * • Rate limiting and throttling parameters
 * • Authentication and authorization constants
 * • Environment-specific API base URLs
 * 
 * Keywords: api-constants, endpoints, http-status, authentication, rate-limiting
 */

// API base URLs (environment-specific)
export const API_BASE_URLS = {
  development: 'http://localhost:3000/api',
  staging: 'https://staging-api.agenitix.com',
  production: 'https://api.agenitix.com',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
  },
  tasks: {
    list: '/tasks',
    create: '/tasks',
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
  },
  flows: {
    list: '/flows',
    create: '/flows',
    update: (id: string) => `/flows/${id}`,
    execute: (id: string) => `/flows/${id}/execute`,
  },
} as const;

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request configuration
export const REQUEST_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  maxRetryDelay: 10000, // 10 seconds
} as const;
```

## Error Handling & Logging

### Consistent Error Patterns

```typescript
/**
 * File: lib/utils/error-handling.ts
 * ERROR HANDLING UTILITIES - Centralized error management with Sentry integration
 * 
 * • Consistent error handling patterns across the application
 * • Sentry integration for error tracking and monitoring
 * • User-friendly error messages with internationalization support
 * • Error boundary components with fallback UI
 * • Retry logic and graceful degradation strategies
 * • Development vs production error handling differences
 * 
 * Keywords: error-handling, sentry-integration, user-experience, error-boundaries
 */

import * as Sentry from '@sentry/nextjs';

// Error types for consistent handling
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    
    // Capture stack trace
    Error.captureStackTrace(this, AppError);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

// Error handling utility functions
export const handleError = (error: unknown, context?: string): AppError => {
  // Log error to Sentry
  Sentry.captureException(error, {
    tags: {
      context: context || 'unknown',
    },
  });

  // Convert unknown errors to AppError
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      false
    );
  }

  return new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500,
    false
  );
};

// User-friendly error messages
export const getErrorMessage = (error: AppError): string => {
  const errorMessages: Record<string, string> = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTHENTICATION_ERROR: 'Please sign in to continue.',
    AUTHORIZATION_ERROR: 'You do not have permission to perform this action.',
    NETWORK_ERROR: 'Please check your internet connection and try again.',
    SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  };

  return errorMessages[error.code] || error.message;
};
```

## Testing Standards

### Component Testing

```typescript
/**
 * File: components/features/__tests__/task-list.test.tsx
 * TASK LIST COMPONENT TESTS - Comprehensive testing suite
 * 
 * • Unit tests for component rendering and user interactions
 * • Integration tests with Convex data layer
 * • Accessibility testing with screen reader simulation
 * • Mobile responsiveness testing across breakpoints
 * • Error state and loading state testing
 * • Performance testing with large datasets
 * 
 * Keywords: component-testing, accessibility, mobile-testing, integration-tests
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ConvexTestingHelper } from 'convex/testing';

import { TaskList } from '../task-list';
import { mockTasks } from '@/lib/test-utils/mock-data';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test setup
const defaultProps = {
  userId: 'user_123',
  onTaskSelect: jest.fn(),
};

describe('TaskList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders task list with proper structure', async () => {
      render(<TaskList {...defaultProps} />);
      
      expect(screen.getByPlaceholderText('Search tasks...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
    });

    it('displays tasks when data is loaded', async () => {
      const t = new ConvexTestingHelper();
      t.withIdentity({ subject: 'user_123' });
      
      // Mock task data
      await t.mutation(api.tasks.createTask, mockTasks[0]);
      
      render(<TaskList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(mockTasks[0].title)).toBeInTheDocument();
      });
    });

    it('shows loading state initially', () => {
      render(<TaskList {...defaultProps} />);
      
      expect(screen.getAllByRole('generic')).toHaveLength(3); // Skeleton items
    });

    it('shows empty state when no tasks', async () => {
      render(<TaskList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('No tasks found.')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('handles search input correctly', async () => {
      render(<TaskList {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      fireEvent.change(searchInput, { target: { value: 'test task' } });
      
      expect(searchInput).toHaveValue('test task');
    });

    it('calls onTaskSelect when task is clicked', async () => {
      const onTaskSelect = jest.fn();
      render(<TaskList {...defaultProps} onTaskSelect={onTaskSelect} />);
      
      await waitFor(() => {
        const taskCard = screen.getByText(mockTasks[0].title);
        fireEvent.click(taskCard);
        
        expect(onTaskSelect).toHaveBeenCalledWith(mockTasks[0]);
      });
    });

    it('toggles sort order when sort button is clicked', () => {
      render(<TaskList {...defaultProps} />);
      
      const sortButton = screen.getByRole('button', { name: /sort/i });
      
      expect(sortButton).toHaveTextContent('Sort ↓');
      
      fireEvent.click(sortButton);
      
      expect(sortButton).toHaveTextContent('Sort ↑');
    });
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<TaskList {...defaultProps} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation', async () => {
      render(<TaskList {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search tasks...');
      
      // Tab navigation
      fireEvent.keyDown(searchInput, { key: 'Tab' });
      
      const sortButton = screen.getByRole('button', { name: /sort/i });
      expect(sortButton).toHaveFocus();
    });

    it('has proper ARIA labels and roles', () => {
      render(<TaskList {...defaultProps} />);
      
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sort/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<TaskList {...defaultProps} />);
      
      const container = screen.getByRole('main');
      expect(container).toHaveClass('flex-col'); // Mobile layout
    });

    it('uses grid layout for larger screens', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(<TaskList {...defaultProps} />);
      
      const taskGrid = screen.getByTestId('task-grid');
      expect(taskGrid).toHaveClass('lg:grid-cols-3'); // Desktop grid
    });
  });

  describe('Error Handling', () => {
    it('displays error message when data loading fails', async () => {
      // Mock error state
      const mockError = new Error('Failed to load tasks');
      
      render(<TaskList {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load tasks. Please try again.')).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      // Mock network error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<TaskList {...defaultProps} />);
      
      // Simulate network error
      fireEvent.error(window);
      
      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });
});
```

## Summary Checklist

Before committing code, ensure:

### Code Quality
- [ ] **JSDoc documentation** - All functions and components documented
- [ ] **TypeScript strict mode** - No `any` types, comprehensive typing
- [ ] **File headers** - Descriptive comments with keywords
- [ ] **Top-level constants** - All magic numbers and strings extracted
- [ ] **Error handling** - Consistent patterns with Sentry integration

### Naming Conventions
- [ ] **Files** - kebab-case for utilities, PascalCase for components
- [ ] **Components** - PascalCase with descriptive names
- [ ] **Hooks** - use-prefix with kebab-case
- [ ] **Convex tables** - domain_resource_plural format
- [ ] **Functions** - camelCase with descriptive verbs

### Architecture
- [ ] **Domain-driven design** - Proper separation of concerns
- [ ] **Single source of truth** - Optimized state management
- [ ] **Helper functions** - Business logic in pure functions
- [ ] **Dependency injection** - Proper abstraction layers
- [ ] **Performance optimization** - Memoization and lazy loading

### UI/UX Standards
- [ ] **Shadcn integration** - Consistent design system usage
- [ ] **Dark theme optimization** - Proper contrast ratios
- [ ] **Mobile-first design** - Responsive breakpoints
- [ ] **Accessibility compliance** - WCAG 2.1 AA standards
- [ ] **No emojis in UI** - Professional interface design

### Testing & Quality
- [ ] **Unit tests** - Component and function testing
- [ ] **Integration tests** - End-to-end user flows
- [ ] **Accessibility tests** - Screen reader compatibility
- [ ] **Mobile responsiveness** - Cross-device testing
- [ ] **Error boundary coverage** - Graceful error handling

## Resources

- [Convex Best Practices](.kiro/steering/convex-best-practices.md)
- [Convex Naming Convention](.kiro/steering/convex-naming-convention.md)
- [Sentry Integration Rules](.kiro/steering/sentry-rules.md)
- [useEffect Best Practices](.kiro/steering/useeffect-best-practices.md)
- [GitHub Workflow](.kiro/steering/github-workflow.md)
- [Project Structure](.kiro/steering/structure.md)
- [Technology Stack](.kiro/steering/tech.md)