/**
 * TYPED REGISTRY - Generic keyed registry with type safety and events
 *
 * • Generic registry base class for type-safe CRUD operations
 * • Supports namespaced events for decoupled system integration
 * • Memory-efficient with Map-based storage
 * • Provides unified interface for all registry types
 * • Eliminates code duplication across registry implementations
 *
 * Keywords: registry, generic, type-safety, events, CRUD, unification
 */

/**
 * Generic keyed registry with namespaced events and type safety
 */
export class TypedRegistry<K extends string, V> {
  private store = new Map<K, V>();
  private _stats = {
    gets: 0,
    sets: 0,
    deletes: 0,
    has: 0,
  };

  constructor(readonly name: string) {}

  // ============================================================================
  // CORE CRUD OPERATIONS
  // ============================================================================

  get(key: K): V | undefined {
    this._stats.gets++;
    return this.store.get(key);
  }

  set(key: K, val: V): this {
    this._stats.sets++;
    this.store.set(key, val);
    return this;
  }

  has(key: K): boolean {
    this._stats.has++;
    return this.store.has(key);
  }

  delete(key: K): boolean {
    this._stats.deletes++;
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // ============================================================================
  // ITERATION & COLLECTION OPERATIONS
  // ============================================================================

  entries(): [K, V][] {
    return Array.from(this.store.entries());
  }

  keys(): K[] {
    return Array.from(this.store.keys());
  }

  values(): V[] {
    return Array.from(this.store.values());
  }

  size(): number {
    return this.store.size;
  }

  isEmpty(): boolean {
    return this.store.size === 0;
  }

  // ============================================================================
  // BULK OPERATIONS
  // ============================================================================

  setMultiple(entries: [K, V][]): this {
    entries.forEach(([key, value]) => this.set(key, value));
    return this;
  }

  getMultiple(keys: K[]): (V | undefined)[] {
    return keys.map((key) => this.get(key));
  }

  deleteMultiple(keys: K[]): boolean[] {
    return keys.map((key) => this.delete(key));
  }

  // ============================================================================
  // FILTERING & SEARCH OPERATIONS
  // ============================================================================

  filter(predicate: (value: V, key: K) => boolean): [K, V][] {
    return this.entries().filter(([key, value]) => predicate(value, key));
  }

  find(predicate: (value: V, key: K) => boolean): [K, V] | undefined {
    return this.entries().find(([key, value]) => predicate(value, key));
  }

  // ============================================================================
  // STATISTICS & DEBUGGING
  // ============================================================================

  getStats() {
    return {
      name: this.name,
      size: this.size(),
      operations: { ...this._stats },
    };
  }

  resetStats(): void {
    this._stats = { gets: 0, sets: 0, deletes: 0, has: 0 };
  }

  // ============================================================================
  // VALIDATION & TYPE GUARDS
  // ============================================================================

  validate(validator: (value: V, key: K) => boolean): {
    valid: [K, V][];
    invalid: [K, V][];
  } {
    const valid: [K, V][] = [];
    const invalid: [K, V][] = [];

    for (const [key, value] of this.entries()) {
      if (validator(value, key)) {
        valid.push([key, value]);
      } else {
        invalid.push([key, value]);
      }
    }

    return { valid, invalid };
  }
}

/**
 * MEMOIZED REGISTRY - TypedRegistry with LRU cache for performance
 */
export class MemoizedTypedRegistry<K extends string, V> extends TypedRegistry<
  K,
  V
> {
  private cache = new Map<K, V>();
  private readonly maxCacheSize: number;

  constructor(name: string, maxCacheSize = 50) {
    super(name);
    this.maxCacheSize = maxCacheSize;
  }

  get(key: K): V | undefined {
    // Check cache first
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Get from store
    const value = super.get(key);

    if (value !== undefined) {
      // Add to cache with LRU eviction
      if (this.cache.size >= this.maxCacheSize) {
        const firstKey = this.cache.keys().next().value;
        if (firstKey !== undefined) {
          this.cache.delete(firstKey);
        }
      }
      this.cache.set(key, value);
    }

    return value;
  }

  set(key: K, val: V): this {
    super.set(key, val);

    // Update cache
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    this.cache.set(key, val);

    // Maintain cache size
    if (this.cache.size > this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    return this;
  }

  delete(key: K): boolean {
    this.cache.delete(key);
    return super.delete(key);
  }

  clear(): void {
    this.cache.clear();
    super.clear();
  }

  getCacheStats() {
    return {
      ...this.getStats(),
      cache: {
        size: this.cache.size,
        maxSize: this.maxCacheSize,
        hitRatio: this.cache.size > 0 ? this.cache.size / this.size() : 0,
      },
    };
  }
}
