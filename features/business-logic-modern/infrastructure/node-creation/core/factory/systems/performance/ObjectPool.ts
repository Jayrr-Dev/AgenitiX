/**
 * OBJECT POOL SYSTEM - Memory-optimized object reuse
 *
 * • Provides high-performance object pooling for memory optimization
 * • Implements automatic object recycling and cleanup
 * • Supports configurable pool sizes and custom reset functions
 * • Features thread-safe operations and memory leak prevention
 *
 * Keywords: object-pool, memory-optimization, performance, recycling, thread-safe
 */

// ============================================================================
// OBJECT POOL IMPLEMENTATION
// ============================================================================

/**
 * Generic object pool for memory optimization and performance
 * Reduces garbage collection pressure by reusing objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;
  private maxSize: number;

  constructor(
    createFn: () => T,
    resetFn: (obj: T) => void,
    maxSize: number = 50
  ) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
  }

  /**
   * Acquire an object from the pool or create new one
   * @returns Object instance ready for use
   */
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }

  /**
   * Release an object back to the pool for reuse
   * @param obj - Object to return to pool
   */
  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      this.resetFn(obj);
      this.pool.push(obj);
    }
    // If pool is full, let object be garbage collected
  }

  /**
   * Get current pool statistics
   * @returns Pool usage information
   */
  getStats(): {
    poolSize: number;
    maxSize: number;
    utilizationRate: number;
  } {
    return {
      poolSize: this.pool.length,
      maxSize: this.maxSize,
      utilizationRate: this.pool.length / this.maxSize,
    };
  }

  /**
   * Clear all objects from the pool
   */
  clear(): void {
    this.pool.length = 0;
  }

  /**
   * Resize the pool maximum capacity
   * @param newMaxSize - New maximum pool size
   */
  resize(newMaxSize: number): void {
    this.maxSize = newMaxSize;
    // Trim pool if it's larger than new max size
    if (this.pool.length > newMaxSize) {
      this.pool.length = newMaxSize;
    }
  }
}

// ============================================================================
// NODE DATA BUFFER
// ============================================================================

/**
 * Specialized buffer for node data with SharedArrayBuffer support
 * Provides high-performance data sharing between worker threads
 */
export class NodeDataBuffer {
  private buffer: ArrayBuffer | SharedArrayBuffer;
  private views: Map<string, Float32Array> = new Map();

  constructor(sizeInBytes: number = 1024 * 1024) {
    // Try to use SharedArrayBuffer for worker thread support, fallback to ArrayBuffer
    try {
      this.buffer = new SharedArrayBuffer(sizeInBytes);
    } catch {
      this.buffer = new ArrayBuffer(sizeInBytes);
    }
  }

  /**
   * Create a typed array view for a specific node
   * @param nodeId - Unique identifier for the node
   * @param offset - Byte offset in the buffer
   * @param length - Number of elements in the view
   * @returns Float32Array view of the buffer
   */
  createView(nodeId: string, offset: number, length: number): Float32Array {
    const view = new Float32Array(this.buffer, offset, length);
    this.views.set(nodeId, view);
    return view;
  }

  /**
   * Get existing view for a node
   * @param nodeId - Node identifier
   * @returns Existing view or undefined
   */
  getView(nodeId: string): Float32Array | undefined {
    return this.views.get(nodeId);
  }

  /**
   * Remove view for a node
   * @param nodeId - Node identifier
   */
  removeView(nodeId: string): void {
    this.views.delete(nodeId);
  }

  /**
   * Get the underlying buffer for worker thread sharing
   * @returns The shared array buffer
   */
  shareBuffer(): ArrayBuffer | SharedArrayBuffer {
    return this.buffer;
  }

  /**
   * Get buffer usage statistics
   * @returns Buffer usage information
   */
  getStats(): {
    totalSize: number;
    usedViews: number;
    isShared: boolean;
  } {
    return {
      totalSize: this.buffer.byteLength,
      usedViews: this.views.size,
      isShared: this.buffer instanceof SharedArrayBuffer,
    };
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a standard object pool for node components
 * @param maxSize - Maximum pool size
 * @returns Configured object pool
 */
export function createNodeObjectPool(
  maxSize: number = 50
): ObjectPool<Record<string, any>> {
  return new ObjectPool(
    () => ({}) as Record<string, any>, // Create empty object
    (obj: Record<string, any>) => {
      // Reset object properties
      Object.keys(obj).forEach((key) => delete obj[key]);
    },
    maxSize
  );
}

/**
 * Create a specialized pool for node data objects
 * @param maxSize - Maximum pool size
 * @returns Configured data object pool
 */
export function createNodeDataPool(
  maxSize: number = 100
): ObjectPool<Record<string, any>> {
  return new ObjectPool(
    () => ({}) as Record<string, any>,
    (obj: Record<string, any>) => {
      // Reset object properties
      Object.keys(obj).forEach((key) => delete obj[key]);
    },
    maxSize
  );
}

// ============================================================================
// PREDEFINED OBJECT POOLS
// ============================================================================

/**
 * Style object pool for frequent style updates
 * Optimized for CSS-in-JS style object reuse
 */
export const styleObjectPool = new ObjectPool(
  () => ({}) as Record<string, any>,
  (obj: Record<string, any>) => {
    for (const key in obj) {
      delete obj[key];
    }
  },
  20
);

/**
 * Handle object pool for frequent handle operations
 * Optimized for XYFlow handle object reuse
 */
export const handleObjectPool = new ObjectPool(
  () => ({
    id: "",
    dataType: "",
    position: "left" as const,
    type: "source" as const,
  }),
  (obj) => {
    obj.id = "";
    obj.dataType = "";
    obj.position = "left";
    obj.type = "source";
  },
  100
);
