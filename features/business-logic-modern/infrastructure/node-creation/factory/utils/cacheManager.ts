/**
 * CACHE MANAGER UTILITY - High-performance caching and memory management
 *
 * • Provides intelligent caching system for node calculations and state
 * • Implements TTL-based cache invalidation and memory optimization
 * • Supports pattern-based cache clearing and statistics tracking
 * • Features debounced update tracking for smooth performance
 * • Integrates with factory systems for optimal memory usage
 *
 * Keywords: cache-manager, memory-optimization, ttl-invalidation, statistics, debouncing, performance
 */

import { CACHE_TTL } from "../constants";
import type { CacheEntry } from "../types";

// ============================================================================
// CACHE STORAGE
// ============================================================================

/**
 * CALCULATION CACHE
 * Performance optimization through smart caching
 */
export const calculationCache = new Map<string, CacheEntry>();

/**
 * DEBOUNCED UPDATES TRACKING
 * Track pending updates for smooth activation
 */
export const debouncedUpdates = new Map<
  string,
  ReturnType<typeof setTimeout>
>();

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

/**
 * CREATE CACHE KEY
 * Generates unique cache keys for optimization
 */
export const createCacheKey = (
  type: "head" | "downstream",
  nodeId: string,
  data?: any,
  connections?: any[],
  nodesData?: any[]
): string => {
  if (type === "head") {
    return `head-${nodeId}-${JSON.stringify(data)}`;
  }
  return `downstream-${nodeId}-${connections?.length || 0}-${nodesData?.map((n) => n.id).join(",") || ""}`;
};

// ============================================================================
// CACHE VALIDATION
// ============================================================================

/**
 * IS CACHE VALID
 * Checks if cached result is still valid
 */
export const isCacheValid = (
  cached: CacheEntry | undefined,
  bypassCache: boolean
): boolean => {
  if (bypassCache || !cached) return false;
  return Date.now() - cached.timestamp < CACHE_TTL;
};

// ============================================================================
// CACHE OPERATIONS
// ============================================================================

/**
 * SET CACHE ENTRY
 * Stores a new cache entry with timestamp
 */
export const setCacheEntry = (key: string, result: boolean): void => {
  calculationCache.set(key, { result, timestamp: Date.now() });
};

/**
 * GET CACHE ENTRY
 * Retrieves a cache entry if it exists
 */
export const getCacheEntry = (key: string): CacheEntry | undefined => {
  return calculationCache.get(key);
};

/**
 * CLEAR CACHE
 * Clears specific cache entries or entire cache
 */
export const clearCache = (pattern?: string): void => {
  if (!pattern) {
    calculationCache.clear();
    return;
  }

  // Clear cache entries matching pattern
  const keysToDelete: string[] = [];
  calculationCache.forEach((_, key) => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => calculationCache.delete(key));
};

/**
 * CLEAR EXPIRED CACHE
 * Removes expired cache entries
 */
export const clearExpiredCache = (): void => {
  const now = Date.now();
  const keysToDelete: string[] = [];

  calculationCache.forEach((entry, key) => {
    if (now - entry.timestamp > CACHE_TTL) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => calculationCache.delete(key));
};

/**
 * GET CACHE STATS
 * Returns cache usage statistics
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  calculationCache.forEach((entry) => {
    if (now - entry.timestamp < CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  });

  return {
    total: calculationCache.size,
    valid: validEntries,
    expired: expiredEntries,
    hitRate: validEntries / (validEntries + expiredEntries) || 0,
  };
};
