/**
 * SHARED TYPES BARREL - Centralized type exports and re-exports
 *
 * • Re-exports third-party types for centralized management
 * • Provides single source of truth for type imports
 * • Reduces coupling to external library APIs
 * • Enables easy type source changes in one place
 *
 * Keywords: types, barrel, re-exports, centralization, decoupling
 */

// ============================================================================
// THIRD-PARTY TYPE RE-EXPORTS
// ============================================================================

// ReactFlow types
export type { Position } from "@xyflow/react";

// React types
export type { ComponentType, ReactNode } from "react";

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

/**
 * Make all properties optional except specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Make specified properties required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extract function parameters type
 */
export type Parameters<T extends (...args: any[]) => any> = T extends (
  ...args: infer P
) => any
  ? P
  : never;

/**
 * Extract function return type
 */
export type ReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

/**
 * Create union of object values
 */
export type ValueOf<T> = T[keyof T];

/**
 * Create readonly version of object
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Create mutable version of readonly object
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Branded type for type safety
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * JSON serializable types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];

// ============================================================================
// REGISTRY-SPECIFIC TYPES
// ============================================================================

/**
 * Generic registry key constraint
 */
export type RegistryKey = string;

/**
 * Registry operation result
 */
export interface RegistryOperationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  name: string;
  size: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    has: number;
  };
}

/**
 * Registry validation result
 */
export interface ValidationResult<T = unknown> {
  valid: [string, T][];
  invalid: [string, T][];
}

// ============================================================================
// EVENT SYSTEM TYPES
// ============================================================================

/**
 * Event listener function
 */
export type EventListener<T = unknown> = (data: T) => void;

/**
 * Event unsubscribe function
 */
export type EventUnsubscribe = () => void;

/**
 * Registry event types
 */
export interface RegistryEventMap<K extends RegistryKey, V> {
  set: { key: K; value: V; previous?: V };
  delete: { key: K; value: V };
  clear: { size: number };
  get: { key: K; value?: V };
}

// ============================================================================
// PERFORMANCE TYPES
// ============================================================================

/**
 * LRU Cache statistics
 */
export interface CacheStats extends RegistryStats {
  cache: {
    size: number;
    maxSize: number;
    hitRatio: number;
  };
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  averageGetTime: number;
  averageSetTime: number;
  cacheHitRate: number;
  memoryUsage?: number;
}
