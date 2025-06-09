/**
 * KEY UTILITIES - Standardized React key generation
 *
 * • Prevents React key duplication errors across all components
 * • Provides consistent key generation patterns
 * • Handles edge cases with fallback strategies
 * • Optimized for performance with minimal string operations
 * • Type-safe key generation with TypeScript support
 *
 * Keywords: react-keys, uniqueness, performance, standardized, type-safe
 */

// ============================================================================
// UNIQUE KEY GENERATORS
// ============================================================================

/**
 * GENERATE UNIQUE ITEM KEY
 * Creates guaranteed unique keys for array items with multiple fallbacks
 */
export function generateUniqueItemKey(
  item: { id?: string; type?: string },
  index: number,
  suffix?: string
): string {
  const id = item.id || "unknown";
  const type = item.type || "item";
  const suffixPart = suffix ? `-${suffix}` : "";

  return `${id}-${type}-${index}${suffixPart}`;
}

/**
 * GENERATE DISPLAY VALUE KEY
 * Specialized for display value arrays (like ViewOutput components)
 */
export function generateDisplayValueKey(
  item: { id: string; type: string; content?: any },
  index: number,
  state: "collapsed" | "expanded"
): string {
  // Add content hash for extra uniqueness if available
  const contentHash =
    item.content !== undefined
      ? String(item.content)
          .slice(0, 8)
          .replace(/[^a-zA-Z0-9]/g, "")
      : "";

  return `${item.id}-${item.type}-${index}-${state}${contentHash ? `-${contentHash}` : ""}`;
}

/**
 * GENERATE NODE LIST KEY
 * For node lists with enhanced uniqueness
 */
export function generateNodeListKey(
  nodeId: string,
  nodeType: string,
  index: number,
  timestamp?: number
): string {
  const timestampPart = timestamp ? `-t${timestamp}` : "";
  return `node-${nodeId}-${nodeType}-${index}${timestampPart}`;
}

/**
 * GENERATE CONTROL KEY
 * For form controls and interactive elements
 */
export function generateControlKey(
  controlId: string,
  controlType: string,
  parentId?: string
): string {
  const parentPart = parentId ? `${parentId}-` : "";
  return `${parentPart}control-${controlId}-${controlType}`;
}

/**
 * GENERATE HANDLE KEY
 * For node handles with position and type safety
 */
export function generateHandleKey(
  handleId: string,
  handleType: "source" | "target",
  dataType: string,
  nodeId?: string
): string {
  const nodePart = nodeId ? `${nodeId}-` : "";
  return `${nodePart}handle-${handleId}-${handleType}-${dataType}`;
}

/**
 * GENERATE HISTORY KEY
 * For historical data entries with timestamps
 */
export function generateHistoryKey(
  entryId: string | number,
  timestamp: number,
  index: number
): string {
  return `history-${entryId}-${timestamp}-${index}`;
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * VALIDATE KEY UNIQUENESS
 * Development helper to check for potential key conflicts
 */
export function validateKeyUniqueness(keys: string[]): {
  isUnique: boolean;
  duplicates: string[];
  conflictMap: Record<string, number>;
} {
  const keyCount = new Map<string, number>();
  const duplicates: string[] = [];

  keys.forEach((key) => {
    const count = (keyCount.get(key) || 0) + 1;
    keyCount.set(key, count);

    if (count === 2) {
      duplicates.push(key);
    }
  });

  const conflictMap: Record<string, number> = {};
  keyCount.forEach((count, key) => {
    if (count > 1) {
      conflictMap[key] = count;
    }
  });

  return {
    isUnique: duplicates.length === 0,
    duplicates,
    conflictMap,
  };
}

/**
 * DEBUG KEY CONFLICTS
 * Development utility to log key conflicts with context
 */
export function debugKeyConflicts(
  keys: string[],
  componentName: string,
  context?: string
): void {
  if (process.env.NODE_ENV !== "development") return;

  const validation = validateKeyUniqueness(keys);

  if (!validation.isUnique) {
    console.warn(
      `🔑 Key conflicts detected in ${componentName}${context ? ` (${context})` : ""}:`,
      validation.conflictMap
    );
    console.warn("Affected keys:", validation.duplicates);
    console.warn("All keys:", keys);
  }
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * KEY CACHE MANAGER
 * Caches frequently generated keys for performance
 */
class KeyCacheManager {
  private cache = new Map<string, string>();
  private maxSize = 1000;

  generateCachedKey(generator: () => string, cacheKey: string): string {
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const key = generator();

    // Simple LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(cacheKey, key);
    return key;
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

export const keyCache = new KeyCacheManager();

// ============================================================================
// BACKWARDS COMPATIBILITY
// ============================================================================

/**
 * LEGACY KEY MIGRATOR
 * Helps migrate from old key patterns to new safe patterns
 */
export function migrateLegacyKey(
  legacyKey: string,
  fallbackId: string,
  fallbackType: string,
  index: number
): string {
  // If legacy key looks safe, use it
  if (legacyKey && legacyKey.includes("-") && legacyKey.length > 10) {
    return legacyKey;
  }

  // Otherwise generate new safe key
  console.warn(`Migrating unsafe key "${legacyKey}" to safe pattern`);
  return generateUniqueItemKey(
    { id: fallbackId, type: fallbackType },
    index,
    "migrated"
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateUniqueItemKey,
  generateDisplayValueKey,
  generateNodeListKey,
  generateControlKey,
  generateHandleKey,
  generateHistoryKey,
  validateKeyUniqueness,
  debugKeyConflicts,
  keyCache,
  migrateLegacyKey,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*
// ViewOutput component usage:
{values.map((item, index) => (
  <div key={generateDisplayValueKey(item, index, 'collapsed')}>
    {formatContent(item.content)}
  </div>
))}

// Form controls usage:
{controls.map((control, index) => (
  <input
    key={generateControlKey(control.id, control.type, nodeId)}
    type={control.type}
  />
))}

// Node handles usage:
{handles.map((handle) => (
  <Handle
    key={generateHandleKey(handle.id, handle.type, handle.dataType, nodeId)}
    id={handle.id}
  />
))}

// Development validation:
if (process.env.NODE_ENV === 'development') {
  const keys = values.map((item, index) =>
    generateDisplayValueKey(item, index, 'expanded')
  );
  debugKeyConflicts(keys, 'ViewOutput', 'expanded state');
}
*/
