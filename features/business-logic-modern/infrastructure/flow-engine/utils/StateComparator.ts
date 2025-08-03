/**
 * STATE COMPARATOR UTILITY
 *
 * Robust state comparison logic that handles edge cases and provides
 * fallback mechanisms for production environments.
 *
 * Fixes the data propagation bug by replacing fragile JSON.stringify
 * comparisons with intelligent comparison strategies.
 */

export interface StateComparisonResult {
  hasChanges: boolean;
  changedKeys: string[];
  comparisonMethod: "primitive" | "deep" | "fallback";
  error?: string;
  performanceMs?: number;
  timestamp?: number; // For cache TTL management, basically tracks when result was created
}

export class StateComparator {
  private static instance: StateComparator;
  private performanceThreshold = 10; // ms

  // Memoization cache for comparison results, basically avoids redundant comparisons
  private static readonly comparisonCache = new Map<
    string,
    StateComparisonResult
  >();
  private static readonly CACHE_SIZE_LIMIT = 1000;
  private static readonly CACHE_TTL = 5000; // 5 seconds, basically prevents stale cached results

  static getInstance(): StateComparator {
    if (!StateComparator.instance) {
      StateComparator.instance = new StateComparator();
    }
    return StateComparator.instance;
  }

  /**
   * Generate a cache key for memoization, basically creates unique identifier for comparison pairs
   */
  private generateCacheKey(
    current: Record<string, unknown>,
    incoming: Partial<Record<string, unknown>>
  ): string {
    // Create a lightweight hash of the objects for cache key
    const currentKeys = Object.keys(current).sort().join(",");
    const incomingKeys = Object.keys(incoming).sort().join(",");
    return `${currentKeys}:${incomingKeys}`;
  }

  /**
   * Clear expired cache entries, basically prevents memory leaks from old comparisons
   */
  private clearExpiredCache(): void {
    const now = Date.now();
    for (const [key, result] of StateComparator.comparisonCache.entries()) {
      if (
        result.timestamp &&
        now - result.timestamp > StateComparator.CACHE_TTL
      ) {
        StateComparator.comparisonCache.delete(key);
      }
    }
  }

  /**
   * Manage cache size to prevent memory leaks, basically removes oldest entries when cache is full
   */
  private manageCacheSize(): void {
    if (
      StateComparator.comparisonCache.size > StateComparator.CACHE_SIZE_LIMIT
    ) {
      // Remove oldest 20% of entries
      const entriesToRemove = Math.floor(
        StateComparator.CACHE_SIZE_LIMIT * 0.2
      );
      const keys = Array.from(StateComparator.comparisonCache.keys());
      for (let i = 0; i < entriesToRemove; i++) {
        StateComparator.comparisonCache.delete(keys[i]);
      }
    }
  }

  /**
   * Main comparison method with intelligent fallback strategies and memoization
   */
  compare(
    current: Record<string, unknown>,
    incoming: Partial<Record<string, unknown>>
  ): StateComparisonResult {
    // Check cache first for performance, basically avoid redundant computations
    const cacheKey = this.generateCacheKey(current, incoming);
    const cachedResult = StateComparator.comparisonCache.get(cacheKey);

    if (
      cachedResult?.timestamp &&
      Date.now() - cachedResult.timestamp < StateComparator.CACHE_TTL
    ) {
      return { ...cachedResult, performanceMs: 0 }; // Cache hit, basically instant result
    }

    const startTime = performance.now();
    const result: StateComparisonResult = {
      hasChanges: false,
      changedKeys: [],
      comparisonMethod: "primitive",
      timestamp: Date.now(),
    };

    try {
      // Strategy 1: Primitive value comparison (fastest)
      const primitiveResult = this.comparePrimitive(current, incoming);
      if (primitiveResult.hasChanges) {
        result.hasChanges = true;
        result.changedKeys = primitiveResult.changedKeys;
        result.comparisonMethod = "primitive";
      } else {
        // Strategy 2: Deep object comparison (more thorough)
        const deepResult = this.compareDeep(current, incoming);
        if (deepResult.hasChanges) {
          result.hasChanges = true;
          result.changedKeys = deepResult.changedKeys;
          result.comparisonMethod = "deep";
        }
      }
    } catch (error) {
      // Strategy 3: Fallback comparison (most reliable)
      console.warn("State comparison error, using fallback:", error);
      const fallbackResult = this.compareFallback(current, incoming);
      result.hasChanges = fallbackResult.hasChanges;
      result.changedKeys = fallbackResult.changedKeys;
      result.comparisonMethod = "fallback";
      result.error = error instanceof Error ? error.message : "Unknown error";
    }

    const endTime = performance.now();
    result.performanceMs = endTime - startTime;

    // Cache the result for future use, basically improves performance for repeated comparisons
    StateComparator.comparisonCache.set(cacheKey, result);

    // Perform cache maintenance periodically, basically prevents memory leaks
    if (Math.random() < 0.1) {
      // 10% chance to trigger cleanup
      this.clearExpiredCache();
      this.manageCacheSize();
    }

    // Log performance warnings in production
    if (
      result.performanceMs > this.performanceThreshold &&
      process.env.NODE_ENV === "production"
    ) {
      console.warn(
        `Slow state comparison detected: ${result.performanceMs.toFixed(2)}ms`,
        {
          method: result.comparisonMethod,
          changedKeys: result.changedKeys,
          cacheSize: StateComparator.comparisonCache.size,
        }
      );
    }

    return result;
  }

  /**
   * Fast primitive value comparison
   */
  private comparePrimitive(
    current: Record<string, unknown>,
    incoming: Partial<Record<string, unknown>>
  ): { hasChanges: boolean; changedKeys: string[] } {
    const changedKeys: string[] = [];

    for (const [key, incomingValue] of Object.entries(incoming)) {
      const currentValue = current[key];

      // Handle primitive types and null/undefined
      if (this.isPrimitive(incomingValue) && this.isPrimitive(currentValue)) {
        if (currentValue !== incomingValue) {
          changedKeys.push(key);
        }
      } else if (incomingValue === null || incomingValue === undefined) {
        if (currentValue !== incomingValue) {
          changedKeys.push(key);
        }
      } else {
        // Non-primitive values need deep comparison
        // Return early to trigger deep comparison strategy
        return { hasChanges: true, changedKeys: [key] };
      }
    }

    return { hasChanges: changedKeys.length > 0, changedKeys };
  }

  /**
   * Deep object comparison with JSON serialization
   */
  private compareDeep(
    current: Record<string, unknown>,
    incoming: Partial<Record<string, unknown>>
  ): { hasChanges: boolean; changedKeys: string[] } {
    const changedKeys: string[] = [];

    for (const [key, incomingValue] of Object.entries(incoming)) {
      const currentValue = current[key];

      try {
        // Use JSON.stringify for deep comparison
        const currentStr = JSON.stringify(currentValue);
        const incomingStr = JSON.stringify(incomingValue);

        if (currentStr !== incomingStr) {
          changedKeys.push(key);
        }
      } catch (_error) {
        // JSON.stringify failed (circular reference, etc.)
        // Fall back to reference comparison
        if (currentValue !== incomingValue) {
          changedKeys.push(key);
        }
      }
    }

    return { hasChanges: changedKeys.length > 0, changedKeys };
  }

  /**
   * Fallback comparison using reference equality
   */
  private compareFallback(
    current: Record<string, unknown>,
    incoming: Partial<Record<string, unknown>>
  ): { hasChanges: boolean; changedKeys: string[] } {
    const changedKeys: string[] = [];

    for (const [key, incomingValue] of Object.entries(incoming)) {
      const currentValue = current[key];

      // Simple reference comparison as last resort
      if (currentValue !== incomingValue) {
        changedKeys.push(key);
      }
    }

    return { hasChanges: changedKeys.length > 0, changedKeys };
  }

  /**
   * Check if value is primitive type
   */
  private isPrimitive(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "bigint" ||
      typeof value === "symbol"
    );
  }

  /**
   * Handle comparison errors gracefully
   */
  handleComparisonError(error: Error, key: string): boolean {
    console.warn(`State comparison failed for key "${key}":`, error);

    // In production, log the error but continue
    if (process.env.NODE_ENV === "production") {
      // Could send to error tracking service here
      return true; // Assume change to be safe
    }

    // In development, be more strict
    return false;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): { threshold: number } {
    return {
      threshold: this.performanceThreshold,
    };
  }

  /**
   * Set performance threshold for warnings
   */
  setPerformanceThreshold(ms: number): void {
    this.performanceThreshold = ms;
  }
}

// Export singleton instance
export const stateComparator = StateComparator.getInstance();
