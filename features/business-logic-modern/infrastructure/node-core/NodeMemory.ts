/**
 * NODE MEMORY SYSTEM - Per-node programmable cache and state management
 *
 * • Each node gets its own isolated memory space with configurable limits
 * • Persistent storage across workflow executions
 * • Built-in cache with TTL, LRU eviction, and size limits
 * • Memory analytics and monitoring for optimization
 * • Secure isolation between nodes
 * • Garbage collection and cleanup mechanisms
 *
 * Keywords: node-memory, cache, isolation, programmable, state-management
 */

import { z } from "zod";

/**
 * Memory configuration for individual nodes
 */
export interface NodeMemoryConfig {
  /** Maximum memory size in bytes (default: 1MB) */
  maxSize?: number;
  /** Maximum number of cache entries (default: 1000) */
  maxEntries?: number;
  /** Default TTL for cache entries in milliseconds (default: 1 hour) */
  defaultTTL?: number;
  /** Enable persistent storage across sessions (default: false) */
  persistent?: boolean;
  /** Memory cleanup strategy */
  evictionPolicy?: 'LRU' | 'LFU' | 'FIFO' | 'TTL';
  /** Enable memory analytics (default: true) */
  analytics?: boolean;
  /** Custom serialization for complex objects */
  serializer?: 'json' | 'msgpack' | 'custom';
}

/**
 * Memory entry with metadata
 */
export interface MemoryEntry<T = any> {
  key: string;
  value: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  ttl?: number;
  size: number;
  tags?: string[];
}

/**
 * Memory analytics and metrics
 */
export interface MemoryMetrics {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
  lastCleanup: number;
  memoryPressure: number; // 0-1 scale
}

/**
 * Memory operation result
 */
export type MemoryResult<T> = 
  | { success: true; data: T; fromCache: boolean }
  | { success: false; error: string; code: 'NOT_FOUND' | 'MEMORY_FULL' | 'INVALID_KEY' | 'SERIALIZATION_ERROR' };

/**
 * Node Memory Manager - Isolated memory space for each node
 */
export class NodeMemoryManager {
  private cache = new Map<string, MemoryEntry>();
  private config: Required<NodeMemoryConfig>;
  private metrics: MemoryMetrics;
  private nodeId: string;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(nodeId: string, config: NodeMemoryConfig = {}) {
    this.nodeId = nodeId;
    this.config = {
      maxSize: config.maxSize ?? 1024 * 1024, // 1MB default
      maxEntries: config.maxEntries ?? 1000,
      defaultTTL: config.defaultTTL ?? 60 * 60 * 1000, // 1 hour
      persistent: config.persistent ?? false,
      evictionPolicy: config.evictionPolicy ?? 'LRU',
      analytics: config.analytics ?? true,
      serializer: config.serializer ?? 'json'
    };

    this.metrics = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      missRate: 0,
      evictionCount: 0,
      lastCleanup: Date.now(),
      memoryPressure: 0
    };

    // Start periodic cleanup
    this.startCleanupTimer();

    // Load persistent data if enabled
    if (this.config.persistent) {
      this.loadPersistentData();
    }
  }

  /**
   * Store data in node memory with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): MemoryResult<T> {
    try {
      // Validate key
      if (!this.isValidKey(key)) {
        return { success: false, error: 'Invalid key format', code: 'INVALID_KEY' };
      }

      // Calculate size
      const serializedValue = this.serialize(value);
      const size = this.calculateSize(serializedValue);

      // Check memory limits
      if (size > this.config.maxSize) {
        return { success: false, error: 'Value too large for memory limit', code: 'MEMORY_FULL' };
      }

      // Evict if necessary
      this.evictIfNecessary(size);

      // Create entry
      const entry: MemoryEntry<T> = {
        key,
        value,
        createdAt: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 1,
        ttl: ttl ?? this.config.defaultTTL,
        size,
        tags: []
      };

      // Store entry
      this.cache.set(key, entry);
      this.updateMetrics('set', size);

      // Persist if enabled
      if (this.config.persistent) {
        this.persistEntry(key, entry);
      }

      return { success: true, data: value, fromCache: false };
    } catch (error) {
      return { 
        success: false, 
        error: `Serialization failed: ${error}`, 
        code: 'SERIALIZATION_ERROR' 
      };
    }
  }

  /**
   * Retrieve data from node memory
   */
  get<T>(key: string): MemoryResult<T> {
    const entry = this.cache.get(key) as MemoryEntry<T> | undefined;

    if (!entry) {
      this.updateMetrics('miss');
      return { success: false, error: 'Key not found', code: 'NOT_FOUND' };
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.updateMetrics('miss');
      return { success: false, error: 'Key expired', code: 'NOT_FOUND' };
    }

    // Update access metadata
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    this.updateMetrics('hit');
    return { success: true, data: entry.value, fromCache: true };
  }

  /**
   * Check if key exists in memory
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete key from memory
   */
  delete(key: string): boolean {
    const existed = this.cache.has(key);
    if (existed) {
      const entry = this.cache.get(key)!;
      this.cache.delete(key);
      this.updateMetrics('delete', -entry.size);
      
      if (this.config.persistent) {
        this.deletePersistentEntry(key);
      }
    }
    return existed;
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.cache.clear();
    this.metrics.totalSize = 0;
    this.metrics.entryCount = 0;
    this.metrics.evictionCount = 0;
    
    if (this.config.persistent) {
      this.clearPersistentData();
    }
  }

  /**
   * Get all keys in memory
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get memory size in bytes
   */
  size(): number {
    return this.metrics.totalSize;
  }

  /**
   * Get entry count
   */
  count(): number {
    return this.cache.size;
  }

  /**
   * Get memory metrics
   */
  getMetrics(): MemoryMetrics {
    return { ...this.metrics };
  }

  /**
   * Compute cached value or store new computation
   */
  async compute<T>(
    key: string, 
    computeFn: () => Promise<T> | T, 
    ttl?: number
  ): Promise<MemoryResult<T>> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached.success) {
      return cached;
    }

    try {
      // Compute new value
      const value = await computeFn();
      
      // Store in cache
      return this.set(key, value, ttl);
    } catch (error) {
      return { 
        success: false, 
        error: `Computation failed: ${error}`, 
        code: 'SERIALIZATION_ERROR' 
      };
    }
  }

  /**
   * Batch operations for efficiency
   */
  batch(): NodeMemoryBatch {
    return new NodeMemoryBatch(this);
  }

  /**
   * Tag-based operations
   */
  setWithTags<T>(key: string, value: T, tags: string[], ttl?: number): MemoryResult<T> {
    const result = this.set(key, value, ttl);
    if (result.success) {
      const entry = this.cache.get(key)!;
      entry.tags = tags;
    }
    return result;
  }

  /**
   * Get all keys with specific tag
   */
  getByTag(tag: string): string[] {
    return Array.from(this.cache.entries())
      .filter(([_, entry]) => entry.tags?.includes(tag))
      .map(([key]) => key);
  }

  /**
   * Delete all entries with specific tag
   */
  deleteByTag(tag: string): number {
    const keysToDelete = this.getByTag(tag);
    keysToDelete.forEach(key => this.delete(key));
    return keysToDelete.length;
  }

  /**
   * Memory pressure management
   */
  getMemoryPressure(): number {
    const sizeRatio = this.metrics.totalSize / this.config.maxSize;
    const countRatio = this.metrics.entryCount / this.config.maxEntries;
    return Math.max(sizeRatio, countRatio);
  }

  /**
   * Force garbage collection
   */
  gc(): { evicted: number; freed: number } {
    const beforeCount = this.cache.size;
    const beforeSize = this.metrics.totalSize;

    // Remove expired entries
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
      }
    }

    // Update metrics
    const evicted = beforeCount - this.cache.size;
    const freed = beforeSize - this.metrics.totalSize;
    
    this.metrics.lastCleanup = Date.now();
    
    return { evicted, freed };
  }

  /**
   * Cleanup and destroy memory manager
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    if (this.config.persistent) {
      this.savePersistentData();
    }
    
    this.clear();
  }

  // Private methods

  private isValidKey(key: string): boolean {
    return typeof key === 'string' && key.length > 0 && key.length <= 250;
  }

  private serialize<T>(value: T): string {
    switch (this.config.serializer) {
      case 'json':
        return JSON.stringify(value);
      case 'msgpack':
        // Would use msgpack library
        return JSON.stringify(value); // Fallback
      case 'custom':
        // Custom serialization logic
        return JSON.stringify(value); // Fallback
      default:
        return JSON.stringify(value);
    }
  }

  private calculateSize(serializedValue: string): number {
    return new Blob([serializedValue]).size;
  }

  private isExpired(entry: MemoryEntry): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.createdAt > entry.ttl;
  }

  private evictIfNecessary(newEntrySize: number): void {
    // Check if we need to evict
    const wouldExceedSize = this.metrics.totalSize + newEntrySize > this.config.maxSize;
    const wouldExceedCount = this.cache.size >= this.config.maxEntries;

    if (!wouldExceedSize && !wouldExceedCount) return;

    // Perform eviction based on policy
    switch (this.config.evictionPolicy) {
      case 'LRU':
        this.evictLRU(newEntrySize);
        break;
      case 'LFU':
        this.evictLFU(newEntrySize);
        break;
      case 'FIFO':
        this.evictFIFO(newEntrySize);
        break;
      case 'TTL':
        this.evictExpired();
        break;
    }
  }

  private evictLRU(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;
      this.metrics.evictionCount++;
      
      if (freedSpace >= requiredSpace) break;
    }
  }

  private evictLFU(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.accessCount - b.accessCount);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;
      this.metrics.evictionCount++;
      
      if (freedSpace >= requiredSpace) break;
    }
  }

  private evictFIFO(requiredSpace: number): void {
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.createdAt - b.createdAt);

    let freedSpace = 0;
    for (const [key, entry] of entries) {
      this.cache.delete(key);
      freedSpace += entry.size;
      this.metrics.evictionCount++;
      
      if (freedSpace >= requiredSpace) break;
    }
  }

  private evictExpired(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        this.metrics.evictionCount++;
      }
    }
  }

  private updateMetrics(operation: 'set' | 'hit' | 'miss' | 'delete', sizeChange = 0): void {
    if (!this.config.analytics) return;

    switch (operation) {
      case 'set':
        this.metrics.totalSize += sizeChange;
        this.metrics.entryCount = this.cache.size;
        break;
      case 'hit':
        this.metrics.hitRate = (this.metrics.hitRate * 0.9) + (1 * 0.1); // Exponential moving average
        break;
      case 'miss':
        this.metrics.missRate = (this.metrics.missRate * 0.9) + (1 * 0.1);
        break;
      case 'delete':
        this.metrics.totalSize += sizeChange; // sizeChange is negative
        this.metrics.entryCount = this.cache.size;
        break;
    }

    this.metrics.memoryPressure = this.getMemoryPressure();
  }

  private startCleanupTimer(): void {
    // Run cleanup every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.gc();
    }, 5 * 60 * 1000);
  }

  // Persistence methods (simplified - would use IndexedDB or similar)
  private async loadPersistentData(): Promise<void> {
    try {
      const key = `node_memory_${this.nodeId}`;
      const data = localStorage.getItem(key);
      if (data) {
        const entries = JSON.parse(data);
        for (const [k, entry] of Object.entries(entries)) {
          this.cache.set(k, entry as MemoryEntry);
        }
      }
    } catch (error) {
      console.warn(`Failed to load persistent data for node ${this.nodeId}:`, error);
    }
  }

  private async savePersistentData(): Promise<void> {
    try {
      const key = `node_memory_${this.nodeId}`;
      const entries = Object.fromEntries(this.cache.entries());
      localStorage.setItem(key, JSON.stringify(entries));
    } catch (error) {
      console.warn(`Failed to save persistent data for node ${this.nodeId}:`, error);
    }
  }

  private persistEntry(key: string, entry: MemoryEntry): void {
    // Individual entry persistence (for real-time updates)
    if (this.config.persistent) {
      this.savePersistentData(); // Simplified - would be more efficient
    }
  }

  private deletePersistentEntry(key: string): void {
    if (this.config.persistent) {
      this.savePersistentData(); // Simplified
    }
  }

  private clearPersistentData(): void {
    try {
      const key = `node_memory_${this.nodeId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to clear persistent data for node ${this.nodeId}:`, error);
    }
  }
}

/**
 * Batch operations for efficient memory management
 */
export class NodeMemoryBatch {
  private operations: Array<() => void> = [];
  
  constructor(private memory: NodeMemoryManager) {}

  set<T>(key: string, value: T, ttl?: number): this {
    this.operations.push(() => this.memory.set(key, value, ttl));
    return this;
  }

  delete(key: string): this {
    this.operations.push(() => this.memory.delete(key));
    return this;
  }

  execute(): void {
    this.operations.forEach(op => op());
    this.operations = [];
  }
}

/**
 * Memory configuration schema for validation
 */
export const NodeMemoryConfigSchema = z.object({
  maxSize: z.number().positive().optional(),
  maxEntries: z.number().positive().optional(),
  defaultTTL: z.number().positive().optional(),
  persistent: z.boolean().optional(),
  evictionPolicy: z.enum(['LRU', 'LFU', 'FIFO', 'TTL']).optional(),
  analytics: z.boolean().optional(),
  serializer: z.enum(['json', 'msgpack', 'custom']).optional()
}).optional();

/**
 * Global memory manager for all nodes
 */
class GlobalNodeMemoryManager {
  private nodeMemories = new Map<string, NodeMemoryManager>();
  private globalConfig: NodeMemoryConfig = {};

  setGlobalConfig(config: NodeMemoryConfig): void {
    this.globalConfig = config;
  }

  getNodeMemory(nodeId: string, config?: NodeMemoryConfig): NodeMemoryManager {
    if (!this.nodeMemories.has(nodeId)) {
      const mergedConfig = { ...this.globalConfig, ...config };
      this.nodeMemories.set(nodeId, new NodeMemoryManager(nodeId, mergedConfig));
    }
    return this.nodeMemories.get(nodeId)!;
  }

  destroyNodeMemory(nodeId: string): void {
    const memory = this.nodeMemories.get(nodeId);
    if (memory) {
      memory.destroy();
      this.nodeMemories.delete(nodeId);
    }
  }

  getAllMetrics(): Record<string, MemoryMetrics> {
    const metrics: Record<string, MemoryMetrics> = {};
    for (const [nodeId, memory] of this.nodeMemories.entries()) {
      metrics[nodeId] = memory.getMetrics();
    }
    return metrics;
  }

  getTotalMemoryUsage(): number {
    let total = 0;
    for (const memory of this.nodeMemories.values()) {
      total += memory.size();
    }
    return total;
  }

  gcAll(): { totalEvicted: number; totalFreed: number } {
    let totalEvicted = 0;
    let totalFreed = 0;
    
    for (const memory of this.nodeMemories.values()) {
      const result = memory.gc();
      totalEvicted += result.evicted;
      totalFreed += result.freed;
    }
    
    return { totalEvicted, totalFreed };
  }
}

// Export singleton instance
export const globalNodeMemoryManager = new GlobalNodeMemoryManager();

/**
 * React hook for using node memory in components
 */
export function useNodeMemory(nodeId: string, config?: NodeMemoryConfig) {
  const memory = globalNodeMemoryManager.getNodeMemory(nodeId, config);
  
  return {
    set: memory.set.bind(memory),
    get: memory.get.bind(memory),
    has: memory.has.bind(memory),
    delete: memory.delete.bind(memory),
    clear: memory.clear.bind(memory),
    compute: memory.compute.bind(memory),
    batch: memory.batch.bind(memory),
    getMetrics: memory.getMetrics.bind(memory),
    gc: memory.gc.bind(memory)
  };
}