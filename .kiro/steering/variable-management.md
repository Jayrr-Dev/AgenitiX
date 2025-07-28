/**
 * File: .kiro/steering/variable-management.md
 * VARIABLE MANAGEMENT STANDARDS - Unified variable management for React/Next.js/TypeScript
 * 
 * • Immutability by default with smallest possible scope and zero side-effects
 * • SSR/RSC/Client boundary awareness for Next.js App Router
 * • Environment variable management with Zod validation
 * • Lazy loading patterns for dynamic and heavy resources
 * • Single source of truth with proper tree-shaking optimization
 * • Integration with Convex, Zustand, and AgenitiX architecture patterns
 * 
 * Keywords: variable-management, immutability, ssr-rsc, environment-variables, lazy-loading
 */

# Variable Management Standards

## Overview

This document establishes unified variable management rules for the AgenitiX platform, ensuring immutability by default, minimal scope, and zero side-effects at import time. These standards are specifically adapted for SSR, RSC, and client/server boundaries that Next.js 13+ App Router introduces.

## Core Principles (8 Rules)

### 1. Default to `const`; Use `let` Only When Reassignment is Required

**Rule**: Never use `var`. Default to `const` and reach for `let` only when you must reassign.

**Why**: Eliminates accidental re-binding bugs and keeps functions referentially transparent in React components.

```typescript
// ❌ Bad - using var or unnecessary let
var userName = 'John';
let apiUrl = 'https://api.example.com'; // Never reassigned

// ✅ Good - const by default
const USER_NAME = 'John';
const API_URL = 'https://api.example.com';

// ✅ Good - let when reassignment is needed
let currentStep = 1;
const nextStep = () => {
  currentStep += 1;
};
```

### 2. Keep Scope as Tight as Possible

**Rule**: Declare variables inside components, hooks, or utility functions—not module-wide—unless they're true constants.

**Why**: Narrow scope prevents unexpected re-renders in React components and improves tree-shaking for both client and server bundles.

```typescript
// ❌ Bad - module-wide scope for runtime values
let userPreferences = {};
let currentTheme = 'dark';

export const UserProfile = () => {
  // Component uses module-wide variables
  return <div className={currentTheme}>...</div>;
};

// ✅ Good - tight scope within component
export const UserProfile = () => {
  const [userPreferences, setUserPreferences] = useState({});
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  return <div className={currentTheme}>...</div>;
};

// ✅ Good - true constants at module level
const DEFAULT_THEME = 'dark' as const;
const MAX_RETRY_ATTEMPTS = 3;
```

### 3. Hoist Only Pure, Cheap, Environment-Agnostic Constants

**Rule**: Only move pure, cheap, environment-agnostic constants to module top level (RegExps, Zod schemas, design tokens).

**Why**: Avoids running heavyweight code at request start-up (server) or on page load (client).

```typescript
// ✅ Good - pure, cheap constants at top level
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FLOW_STATUS_OPTIONS = Object.freeze({
  DRAFT: 'draft',
  ACTIVE: 'active',
  ARCHIVED: 'archived',
} as const);

const VALIDATION_SCHEMA = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// ❌ Bad - heavy computation at module level
const EXPENSIVE_CALCULATION = heavyComputeFunction(); // Runs at import time!

// ✅ Good - lazy computation
const getExpensiveValue = () => heavyComputeFunction();
```

### 4. Load Dynamic, Heavy, or Environment-Specific Values Lazily

**Rule**: Put dynamic/heavy/env-specific values behind factories, React context providers, or custom hooks.

**Why**: Next.js may execute files in both edge/server and client bundles—lazy factories ensure each runtime gets the right values and keeps RSC compatible.

```typescript
// ❌ Bad - reading env at module level
const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL, // Runs at import time
  dbUrl: process.env.DATABASE_URL,
};

// ✅ Good - lazy factory pattern
export interface AppConfig {
  apiUrl: string;
  dbUrl: string;
  convexUrl: string;
}

export const createConfig = (): AppConfig => {
  return {
    apiUrl: process.env.NEXT_PUBLIC_API_URL!,
    dbUrl: process.env.DATABASE_URL!,
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  };
};

// ✅ Good - custom hook for client-side config
export const useAppConfig = (): AppConfig => {
  return useMemo(() => createConfig(), []);
};
```

### 5. Never Mutate Top-Level Bindings

**Rule**: Centralize mutable app-state in stores (Zustand, Redux Toolkit) or React Context.

**Why**: Guarantees predictable render trees; supports fast refresh and concurrent rendering.

```typescript
// ❌ Bad - mutable top-level state
let globalUserState = {};
let flowEditorState = {};

export const updateUser = (user: User) => {
  globalUserState = { ...globalUserState, ...user }; // Mutation!
};

// ✅ Good - Zustand store for mutable state
interface UserState {
  user: User | null;
  updateUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  updateUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

// ✅ Good - React Context for component-scoped state
interface FlowEditorContextType {
  nodes: FlowNode[];
  edges: FlowEdge[];
  updateNode: (id: string, data: Partial<FlowNode>) => void;
}

export const FlowEditorContext = createContext<FlowEditorContextType | null>(null);
```

### 6. Name & Type for Intent

**Rule**: Use consistent naming conventions and explicit TypeScript types.

- `ALL_CAPS` for cross-module constants
- `camelCase` for runtime values
- `PascalCase` for types & components
- Annotate with explicit TS types or `as const`

```typescript
// ✅ Good - consistent naming and typing
const MAX_FILE_SIZE_MB = 10 as const;
const DEFAULT_FLOW_SETTINGS = Object.freeze({
  autoSave: true,
  showGrid: false,
  snapToGrid: true,
}) as const;

type FlowSettings = typeof DEFAULT_FLOW_SETTINGS;

interface CreateFlowData {
  readonly name: string;
  readonly description?: string;
  readonly settings: FlowSettings;
}

const createFlowMutation = async (data: CreateFlowData): Promise<Flow> => {
  // Implementation...
};

// ❌ Bad - inconsistent naming and missing types
const maxsize = 10; // Should be MAX_FILE_SIZE_MB
const settings = { autoSave: true }; // Should be typed and frozen
const createflow = async (data) => { }; // Should be createFlowMutation with types
```

### 7. SSR/RSC Awareness

**Rule**: Don't read browser globals in Server Components, and don't import Node-only libs into Client Components.

**Why**: Prevents hydration errors and bundle bloat.

```typescript
// ❌ Bad - browser globals in Server Component
export default function ServerPage() {
  const userAgent = window.navigator.userAgent; // Error: window not available
  return <div>{userAgent}</div>;
}

// ✅ Good - browser globals in Client Component
'use client';

export const ClientUserAgent = () => {
  const [userAgent, setUserAgent] = useState('');
  
  useEffect(() => {
    setUserAgent(window.navigator.userAgent);
  }, []);
  
  return <div>{userAgent}</div>;
};

// ❌ Bad - Node.js imports in Client Component
'use client';
import fs from 'fs'; // Error: fs not available in browser

export const ClientFileReader = () => {
  // This will break the client bundle
};

// ✅ Good - Node.js operations in Server Component
import fs from 'fs/promises';

export default async function ServerFileReader() {
  const fileContent = await fs.readFile('data.json', 'utf-8');
  return <pre>{fileContent}</pre>;
};
```

### 8. Single Source of Truth

**Rule**: Export & import constants instead of duplicating them. Leverage Next.js tree-shaker.

**Why**: Reduces drift between client and server logic and enables automatic dead code elimination.

```typescript
// ❌ Bad - duplicated constants
// file1.ts
const API_TIMEOUT = 5000;

// file2.ts  
const API_TIMEOUT = 5000; // Duplicated!

// ✅ Good - single source of truth
// lib/constants/api-constants.ts
export const API_CONSTANTS = {
  TIMEOUT_MS: 5000,
  MAX_RETRIES: 3,
  BASE_URL: '/api/v1',
} as const;

// file1.ts
import { API_CONSTANTS } from '@/lib/constants/api-constants';

// file2.ts
import { API_CONSTANTS } from '@/lib/constants/api-constants';
```

## AgenitiX Implementation Patterns

### Project Structure for Variable Management

```
lib/
├── constants/
│   ├── api-constants.ts        # API endpoints, timeouts, retry configs
│   ├── ui-constants.ts         # Design tokens, breakpoints, z-indexes
│   ├── flow-constants.ts       # Flow editor constants and defaults
│   └── validation-schemas.ts   # Zod schemas for data validation
├── config/
│   ├── env.ts                  # Environment variable parsing (server-only)
│   ├── create-app-config.ts    # Lazy config factory
│   └── create-convex-config.ts # Convex-specific configuration
├── stores/
│   ├── user-store.ts           # User state management
│   ├── flow-editor-store.ts    # Flow editor state
│   └── ui-store.ts             # UI state (sidebar, modals, etc.)
└── hooks/
    ├── use-app-config.ts       # Client-side config access
    ├── use-flow-data.ts        # Flow data management
    └── use-environment.ts      # Environment detection
```

### Environment Variable Management

```typescript
/**
 * File: lib/config/env.ts
 * ENVIRONMENT VARIABLES - Server-only environment variable parsing with Zod
 * 
 * • Strict validation with Zod schemas
 * • Type-safe environment variable access
 * • Fails fast on invalid configuration
 * • Server-only execution with proper error handling
 * 
 * Keywords: environment-variables, zod-validation, server-only, type-safety
 */

import { z } from 'zod';

// Environment schema with validation rules
const EnvSchema = z.object({
  // Public variables (available to client)
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']),
  
  // Server-only variables
  DATABASE_URL: z.string().url(),
  CONVEX_DEPLOY_KEY: z.string().min(1),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().min(1),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'test', 'production']),
});

/**
 * Parsed and validated environment variables
 * 
 * ⚠️ SERVER-ONLY: This will throw an error if imported in client components
 * Use createAppConfig() or useAppConfig() for client-side access to public vars
 */
export const env = EnvSchema.parse(process.env);

// Type export for use in other files
export type Environment = z.infer<typeof EnvSchema>;
```

### Configuration Factory Pattern

```typescript
/**
 * File: lib/config/create-app-config.ts
 * APP CONFIG FACTORY - Lazy configuration factory for runtime config
 * 
 * • Lazy loading of environment-dependent configuration
 * • Separate client and server configuration interfaces
 * • Integration with Convex, Sentry, and other services
 * • Type-safe configuration with proper defaults
 * 
 * Keywords: config-factory, lazy-loading, client-server, type-safety
 */

import { env } from './env';
import { API_CONSTANTS } from '@/lib/constants/api-constants';
import { FEATURE_FLAGS_DEFAULT } from '@/lib/constants/feature-flags';

// Client-safe configuration (only public env vars)
export interface ClientConfig {
  readonly convexUrl: string;
  readonly sentryDsn?: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly apiTimeout: number;
  readonly featureFlags: typeof FEATURE_FLAGS_DEFAULT;
}

// Server-only configuration (includes private env vars)
export interface ServerConfig extends ClientConfig {
  readonly databaseUrl: string;
  readonly convexDeployKey: string;
  readonly resendApiKey: string;
}

/**
 * Creates client-safe configuration
 * Safe to call in both server and client components
 */
export const createClientConfig = (): ClientConfig => {
  return {
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_APP_ENV as ClientConfig['environment'],
    apiTimeout: API_CONSTANTS.TIMEOUT_MS,
    featureFlags: { ...FEATURE_FLAGS_DEFAULT },
  };
};

/**
 * Creates full server configuration
 * ⚠️ SERVER-ONLY: Will throw error if called in client components
 */
export const createServerConfig = (): ServerConfig => {
  const clientConfig = createClientConfig();
  
  return {
    ...clientConfig,
    databaseUrl: env.DATABASE_URL,
    convexDeployKey: env.CONVEX_DEPLOY_KEY,
    resendApiKey: env.RESEND_API_KEY,
  };
};
```

### Constants Organization

```typescript
/**
 * File: lib/constants/flow-constants.ts
 * FLOW EDITOR CONSTANTS - Flow editor configuration and defaults
 * 
 * • Node type definitions and categories
 * • Default flow settings and validation rules
 * • Editor UI constants and interaction settings
 * • Integration with AgenitiX node domain architecture
 * 
 * Keywords: flow-editor, node-types, defaults, ui-constants
 */

// Node categories following AgenitiX architecture
export const NODE_CATEGORIES = Object.freeze({
  CREATE: 'create',
  VIEW: 'view',
  TRIGGER: 'trigger',
  TEST: 'test',
  CYCLE: 'cycle',
} as const);

export type NodeCategory = typeof NODE_CATEGORIES[keyof typeof NODE_CATEGORIES];

// Flow editor defaults
export const FLOW_EDITOR_DEFAULTS = Object.freeze({
  snapToGrid: true,
  showGrid: false,
  gridSize: 20,
  autoSave: true,
  autoSaveInterval: 30000, // 30 seconds
  maxUndoSteps: 50,
  defaultZoom: 1,
  minZoom: 0.1,
  maxZoom: 3,
} as const);

// Node validation rules
export const NODE_VALIDATION = Object.freeze({
  maxNameLength: 100,
  maxDescriptionLength: 500,
  maxInputs: 10,
  maxOutputs: 10,
  requiredFields: ['id', 'type', 'position'] as const,
} as const);

// Flow execution constants
export const FLOW_EXECUTION = Object.freeze({
  maxExecutionTime: 300000, // 5 minutes
  maxConcurrentRuns: 5,
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const);

// Export types for use in other files
export type FlowEditorDefaults = typeof FLOW_EDITOR_DEFAULTS;
export type NodeValidation = typeof NODE_VALIDATION;
export type FlowExecution = typeof FLOW_EXECUTION;
```

### Store Management with Zustand

```typescript
/**
 * File: lib/stores/flow-editor-store.ts
 * FLOW EDITOR STORE - Zustand store for flow editor state management
 * 
 * • Immutable state updates with proper TypeScript typing
 * • Integration with Convex for real-time synchronization
 * • Undo/redo functionality with history management
 * • Performance optimized with selective subscriptions
 * 
 * Keywords: zustand-store, flow-editor, immutable-state, real-time-sync
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { FLOW_EDITOR_DEFAULTS } from '@/lib/constants/flow-constants';

import type { FlowNode, FlowEdge, FlowSettings } from '@/types/flow-types';
import type { Id } from '@/convex/_generated/dataModel';

interface FlowEditorState {
  // Current flow data
  readonly flowId: Id<'flows'> | null;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowEdge[];
  readonly settings: FlowSettings;
  
  // Editor state
  readonly selectedNodeIds: readonly string[];
  readonly selectedEdgeIds: readonly string[];
  readonly isExecuting: boolean;
  readonly lastSaved: number | null;
  readonly hasUnsavedChanges: boolean;
  
  // History for undo/redo
  readonly history: readonly {
    nodes: readonly FlowNode[];
    edges: readonly FlowEdge[];
    timestamp: number;
  }[];
  readonly historyIndex: number;
}

interface FlowEditorActions {
  // Flow management
  loadFlow: (flowId: Id<'flows'>, nodes: FlowNode[], edges: FlowEdge[]) => void;
  clearFlow: () => void;
  
  // Node operations
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  
  // Edge operations
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, updates: Partial<FlowEdge>) => void;
  deleteEdge: (id: string) => void;
  
  // Selection
  selectNodes: (nodeIds: string[]) => void;
  selectEdges: (edgeIds: string[]) => void;
  clearSelection: () => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // Settings
  updateSettings: (settings: Partial<FlowSettings>) => void;
  
  // Execution
  setExecuting: (isExecuting: boolean) => void;
  markSaved: () => void;
}

type FlowEditorStore = FlowEditorState & FlowEditorActions;

const INITIAL_STATE: FlowEditorState = {
  flowId: null,
  nodes: [],
  edges: [],
  settings: { ...FLOW_EDITOR_DEFAULTS },
  selectedNodeIds: [],
  selectedEdgeIds: [],
  isExecuting: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  history: [],
  historyIndex: -1,
};

/**
 * Flow Editor Store - Manages flow editor state with immutable updates
 * 
 * Uses Zustand with Immer middleware for immutable state updates and
 * subscribeWithSelector for performance optimization.
 */
export const useFlowEditorStore = create<FlowEditorStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...INITIAL_STATE,
      
      // Flow management
      loadFlow: (flowId, nodes, edges) => set((state) => {
        state.flowId = flowId;
        state.nodes = nodes;
        state.edges = edges;
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
        state.hasUnsavedChanges = false;
        state.lastSaved = Date.now();
        state.history = [];
        state.historyIndex = -1;
      }),
      
      clearFlow: () => set((state) => {
        Object.assign(state, INITIAL_STATE);
      }),
      
      // Node operations
      addNode: (node) => set((state) => {
        state.nodes = [...state.nodes, node];
        state.hasUnsavedChanges = true;
      }),
      
      updateNode: (id, updates) => set((state) => {
        const index = state.nodes.findIndex(node => node.id === id);
        if (index !== -1) {
          state.nodes = state.nodes.map((node, i) => 
            i === index ? { ...node, ...updates } : node
          );
          state.hasUnsavedChanges = true;
        }
      }),
      
      deleteNode: (id) => set((state) => {
        state.nodes = state.nodes.filter(node => node.id !== id);
        state.edges = state.edges.filter(edge => 
          edge.source !== id && edge.target !== id
        );
        state.selectedNodeIds = state.selectedNodeIds.filter(nodeId => nodeId !== id);
        state.hasUnsavedChanges = true;
      }),
      
      // Edge operations
      addEdge: (edge) => set((state) => {
        state.edges = [...state.edges, edge];
        state.hasUnsavedChanges = true;
      }),
      
      updateEdge: (id, updates) => set((state) => {
        const index = state.edges.findIndex(edge => edge.id === id);
        if (index !== -1) {
          state.edges = state.edges.map((edge, i) => 
            i === index ? { ...edge, ...updates } : edge
          );
          state.hasUnsavedChanges = true;
        }
      }),
      
      deleteEdge: (id) => set((state) => {
        state.edges = state.edges.filter(edge => edge.id !== id);
        state.selectedEdgeIds = state.selectedEdgeIds.filter(edgeId => edgeId !== id);
        state.hasUnsavedChanges = true;
      }),
      
      // Selection
      selectNodes: (nodeIds) => set((state) => {
        state.selectedNodeIds = nodeIds;
      }),
      
      selectEdges: (edgeIds) => set((state) => {
        state.selectedEdgeIds = edgeIds;
      }),
      
      clearSelection: () => set((state) => {
        state.selectedNodeIds = [];
        state.selectedEdgeIds = [];
      }),
      
      // History
      saveToHistory: () => set((state) => {
        const snapshot = {
          nodes: state.nodes,
          edges: state.edges,
          timestamp: Date.now(),
        };
        
        // Remove future history if we're not at the end
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(snapshot);
        
        // Limit history size
        if (newHistory.length > FLOW_EDITOR_DEFAULTS.maxUndoSteps) {
          newHistory.shift();
        } else {
          state.historyIndex += 1;
        }
        
        state.history = newHistory;
      }),
      
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex -= 1;
          const snapshot = state.history[state.historyIndex];
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.hasUnsavedChanges = true;
        }
      }),
      
      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex += 1;
          const snapshot = state.history[state.historyIndex];
          state.nodes = snapshot.nodes;
          state.edges = snapshot.edges;
          state.hasUnsavedChanges = true;
        }
      }),
      
      // Settings
      updateSettings: (settings) => set((state) => {
        state.settings = { ...state.settings, ...settings };
        state.hasUnsavedChanges = true;
      }),
      
      // Execution
      setExecuting: (isExecuting) => set((state) => {
        state.isExecuting = isExecuting;
      }),
      
      markSaved: () => set((state) => {
        state.hasUnsavedChanges = false;
        state.lastSaved = Date.now();
      }),
    }))
  )
);

// Selector hooks for performance optimization
export const useFlowNodes = () => useFlowEditorStore(state => state.nodes);
export const useFlowEdges = () => useFlowEditorStore(state => state.edges);
export const useFlowSelection = () => useFlowEditorStore(state => ({
  selectedNodeIds: state.selectedNodeIds,
  selectedEdgeIds: state.selectedEdgeIds,
}));
export const useFlowHistory = () => useFlowEditorStore(state => ({
  canUndo: state.historyIndex > 0,
  canRedo: state.historyIndex < state.history.length - 1,
  undo: state.undo,
  redo: state.redo,
}));
```

### Custom Hooks for Configuration

```typescript
/**
 * File: lib/hooks/use-app-config.ts
 * APP CONFIG HOOK - Client-side configuration access with caching
 * 
 * • Memoized configuration access for client components
 * • Environment detection and feature flag management
 * • Integration with Next.js App Router and SSR/RSC patterns
 * • Type-safe configuration with proper error handling
 * 
 * Keywords: config-hook, client-side, memoization, feature-flags
 */

import { useMemo } from 'react';
import { createClientConfig } from '@/lib/config/create-app-config';

import type { ClientConfig } from '@/lib/config/create-app-config';

/**
 * Hook for accessing client-safe application configuration
 * 
 * Memoizes configuration to prevent unnecessary re-creation on re-renders.
 * Safe to use in both client and server components.
 * 
 * @returns {ClientConfig} Client-safe application configuration
 */
export const useAppConfig = (): ClientConfig => {
  return useMemo(() => createClientConfig(), []);
};

/**
 * Hook for environment detection
 * 
 * @returns {Object} Environment information and utilities
 */
export const useEnvironment = () => {
  const config = useAppConfig();
  
  return useMemo(() => ({
    isDevelopment: config.environment === 'development',
    isStaging: config.environment === 'staging',
    isProduction: config.environment === 'production',
    environment: config.environment,
  }), [config.environment]);
};

/**
 * Hook for feature flag access
 * 
 * @returns {Object} Feature flags and utilities
 */
export const useFeatureFlags = () => {
  const config = useAppConfig();
  
  return useMemo(() => ({
    flags: config.featureFlags,
    isEnabled: (flag: keyof typeof config.featureFlags) => config.featureFlags[flag],
  }), [config.featureFlags]);
};
```

## ESLint Configuration

```javascript
/**
 * File: .eslintrc.cjs
 * ESLINT CONFIGURATION - Variable management rule enforcement
 * 
 * • Enforces immutability and const usage patterns
 * • Prevents var usage and encourages proper scoping
 * • React-specific rules for hooks and component patterns
 * • TypeScript integration for type safety
 * 
 * Keywords: eslint-config, immutability, react-rules, typescript
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'functional', 'react-hooks'],
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:functional/stylistic'
  ],
  rules: {
    // Rule 1: Default to const
    'no-var': 'error',
    'prefer-const': ['error', { destructuring: 'all' }],
    
    // Rule 2: Proper scoping
    'block-scoped-var': 'error',
    'no-implicit-globals': 'error',
    
    // Rule 5: Immutability
    'functional/no-let': 'warn',
    'functional/immutable-data': [
      'error',
      { ignoreImmediateMutation: true }
    ],
    'functional/prefer-readonly-type': 'warn',
    
    // React-specific rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // TypeScript rules
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    
    // Import organization
    'import/order': ['error', {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always',
      alphabetize: { order: 'asc' }
    }],
  },
  overrides: [
    {
      // Server-only files
      files: ['**/env.ts', '**/config/create-*-config.ts'],
      rules: {
        'functional/no-let': 'off', // Allow let in config factories
      }
    },
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'functional/immutable-data': 'off', // Allow mutations in tests
        'functional/no-let': 'off',
      }
    }
  ]
};
```

## TypeScript Configuration

```json
/**
 * File: tsconfig.json (additions)
 * TYPESCRIPT CONFIGURATION - Enhanced type safety for variable management
 */
{
  "compilerOptions": {
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "strict": true
  }
}
```

## Quick Reference Checklist

Before every PR, verify:

### Variable Declaration
- [ ] **No `var` usage** - All variables use `const` or `let`
- [ ] **`const` by default** - Only use `let` when reassignment is required
- [ ] **Proper scoping** - Variables declared in narrowest possible scope
- [ ] **No module-level mutations** - Mutable state in stores/context only

### Constants & Configuration
- [ ] **Pure constants hoisted** - Only cheap, environment-agnostic constants at module level
- [ ] **Lazy loading** - Dynamic/heavy/env-specific values behind factories
- [ ] **Single source of truth** - No duplicated constants across files
- [ ] **Proper naming** - ALL_CAPS for constants, camelCase for runtime values

### SSR/RSC Compliance
- [ ] **No browser globals in Server Components** - window, document, etc.
- [ ] **No Node.js imports in Client Components** - fs, path, etc.
- [ ] **Environment variables properly handled** - Server-only parsing with Zod
- [ ] **Client/server boundaries respected** - Proper use of 'use client' directive

### Type Safety
- [ ] **Explicit types** - All variables properly typed
- [ ] **`as const` assertions** - For immutable objects and arrays
- [ ] **Readonly types** - For configuration and constant objects
- [ ] **No `any` types** - Strict TypeScript compliance

### Performance
- [ ] **Memoized configuration** - Config hooks use useMemo
- [ ] **Selective store subscriptions** - Zustand selectors for performance
- [ ] **Tree-shaking friendly** - Proper ES module exports
- [ ] **No side effects at import** - All heavy operations lazy-loaded

## Integration Examples

### Server Component with Configuration

```typescript
/**
 * Server Component example with proper variable management
 */
import { createServerConfig } from '@/lib/config/create-app-config';
import { FLOW_EDITOR_DEFAULTS } from '@/lib/constants/flow-constants';

export default async function FlowEditorPage() {
  // ✅ Lazy config creation in Server Component
  const config = createServerConfig();
  
  // ✅ Using constants from single source of truth
  const editorSettings = {
    ...FLOW_EDITOR_DEFAULTS,
    convexUrl: config.convexUrl,
  };
  
  return (
    <div>
      <h1>Flow Editor</h1>
      <pre>{JSON.stringify(editorSettings, null, 2)}</pre>
    </div>
  );
}
```

### Client Component with Store Integration

```typescript
/**
 * Client Component example with Zustand store and configuration
 */
'use client';

import { useAppConfig } from '@/lib/hooks/use-app-config';
import { useFlowEditorStore } from '@/lib/stores/flow-editor-store';
import { FLOW_EXECUTION } from '@/lib/constants/flow-constants';

export const FlowExecutionPanel = () => {
  // ✅ Memoized config access
  const config = useAppConfig();
  
  // ✅ Selective store subscription
  const { isExecuting, setExecuting } = useFlowEditorStore(state => ({
    isExecuting: state.isExecuting,
    setExecuting: state.setExecuting,
  }));
  
  // ✅ Constants from single source
  const maxExecutionTime = FLOW_EXECUTION.maxExecutionTime;
  
  const handleExecute = async () => {
    setExecuting(true);
    
    try {
      // Execution logic with timeout
      const timeoutId = setTimeout(() => {
        setExecuting(false);
      }, maxExecutionTime);
      
      // Clear timeout on completion
      clearTimeout(timeoutId);
    } finally {
      setExecuting(false);
    }
  };
  
  return (
    <button 
      onClick={handleExecute}
      disabled={isExecuting}
    >
      {isExecuting ? 'Executing...' : 'Execute Flow'}
    </button>
  );
};
```

## Resources

- [Development Standards](.kiro/steering/development-standards.md)
- [Convex Best Practices](.kiro/steering/convex-best-practices.md)
- [React useEffect Best Practices](.kiro/steering/useeffect-best-practices.md)
- [Project Structure Guidelines](.kiro/steering/structure.md)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Zod Documentation](https://zod.dev/)