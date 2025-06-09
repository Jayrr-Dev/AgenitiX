/**
 * NODE DATA BUFFER SYSTEM
 *
 * Provides efficient storage and sharing of large numeric datasets using ArrayBuffer.
 * Optimized for high-performance scenarios with large data processing requirements.
 *
 * FEATURES:
 * • Zero-copy data sharing between nodes
 * • Typed array views for efficient data access
 * • Memory-efficient storage for large datasets
 * • Automatic view management and cleanup
 *
 * PERFORMANCE BENEFITS:
 * • Reduces memory allocation overhead
 * • Enables zero-copy data sharing
 * • Optimized for numerical computations
 * • Prevents garbage collection pressure
 *
 * @author Factory Performance Team
 * @since v3.0.0
 * @keywords arraybuffer, performance, zero-copy, data-sharing
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface NodeDataBufferOptions {
  /** Buffer size in bytes (default: 1MB) */
  sizeInBytes?: number;
  /** Whether to use SharedArrayBuffer if available */
  useSharedBuffer?: boolean;
}

export interface DataView {
  /** Unique identifier for the view */
  nodeId: string;
  /** Byte offset in the buffer */
  offset: number;
  /** Length in elements (not bytes) */
  length: number;
  /** The actual typed array view */
  view: Float32Array;
}

// ============================================================================
// NODE DATA BUFFER CLASS
// ============================================================================

/**
 * Efficient storage and sharing of large numeric datasets using ArrayBuffer
 * Provides typed array views for optimal performance with numerical data
 */
export class NodeDataBuffer {
  private buffer: ArrayBuffer | SharedArrayBuffer;
  private views: Map<string, Float32Array> = new Map();
  private allocatedBytes = 0;
  private readonly sizeInBytes: number;

  constructor(options: NodeDataBufferOptions = {}) {
    const { sizeInBytes = 1024 * 1024, useSharedBuffer = false } = options;
    this.sizeInBytes = sizeInBytes;

    // Use SharedArrayBuffer if available and requested (for web workers)
    if (useSharedBuffer && typeof SharedArrayBuffer !== "undefined") {
      this.buffer = new SharedArrayBuffer(sizeInBytes);
    } else {
      this.buffer = new ArrayBuffer(sizeInBytes);
    }
  }

  /**
   * Create a typed array view for a node's numeric data
   *
   * @param nodeId - Unique identifier for the node
   * @param offset - Byte offset in the buffer
   * @param length - Number of Float32 elements
   * @returns Float32Array view of the buffer
   *
   * @example
   * ```typescript
   * const buffer = new NodeDataBuffer();
   * const nodeView = buffer.createView('node-1', 0, 100);
   * nodeView[0] = 42.5; // Write to buffer
   * ```
   */
  createView(nodeId: string, offset: number, length: number): Float32Array {
    // Validate parameters
    if (offset < 0 || offset >= this.sizeInBytes) {
      throw new Error(`Offset ${offset} is out of bounds`);
    }

    const byteLength = length * Float32Array.BYTES_PER_ELEMENT;
    if (offset + byteLength > this.sizeInBytes) {
      throw new Error(
        `View extends beyond buffer bounds (${offset + byteLength} > ${this.sizeInBytes})`
      );
    }

    // Create the view
    const view = new Float32Array(this.buffer, offset, length);
    this.views.set(nodeId, view);

    // Track allocation
    this.allocatedBytes = Math.max(this.allocatedBytes, offset + byteLength);

    return view;
  }

  /**
   * Get existing view for a node
   *
   * @param nodeId - Node identifier
   * @returns Float32Array view or undefined if not found
   */
  getView(nodeId: string): Float32Array | undefined {
    return this.views.get(nodeId);
  }

  /**
   * Remove view when node is destroyed
   * This doesn't deallocate the buffer space but removes the reference
   *
   * @param nodeId - Node identifier
   */
  removeView(nodeId: string): void {
    this.views.delete(nodeId);
  }

  /**
   * Share buffer between nodes (zero-copy)
   * Returns the underlying buffer for zero-copy sharing
   *
   * @returns The underlying ArrayBuffer or SharedArrayBuffer
   */
  shareBuffer(): ArrayBuffer | SharedArrayBuffer {
    return this.buffer;
  }

  /**
   * Get buffer statistics
   * @returns Buffer usage statistics
   */
  getStats() {
    return {
      totalSize: this.sizeInBytes,
      allocatedBytes: this.allocatedBytes,
      viewCount: this.views.size,
      utilizationRatio: this.allocatedBytes / this.sizeInBytes,
      isSharedBuffer: this.buffer instanceof SharedArrayBuffer,
    };
  }

  /**
   * Clear all views and reset allocation tracking
   */
  clear(): void {
    this.views.clear();
    this.allocatedBytes = 0;
  }

  /**
   * Copy data from one view to another
   *
   * @param sourceNodeId - Source node identifier
   * @param targetNodeId - Target node identifier
   * @returns boolean indicating success
   */
  copyViewData(sourceNodeId: string, targetNodeId: string): boolean {
    const sourceView = this.views.get(sourceNodeId);
    const targetView = this.views.get(targetNodeId);

    if (!sourceView || !targetView) {
      return false;
    }

    const copyLength = Math.min(sourceView.length, targetView.length);
    targetView.set(sourceView.subarray(0, copyLength));
    return true;
  }

  /**
   * Auto-allocate a view with automatic offset calculation
   * Finds the next available space in the buffer
   *
   * @param nodeId - Node identifier
   * @param length - Number of Float32 elements
   * @returns Float32Array view or null if insufficient space
   */
  autoAllocateView(nodeId: string, length: number): Float32Array | null {
    const byteLength = length * Float32Array.BYTES_PER_ELEMENT;
    const offset = this.allocatedBytes;

    if (offset + byteLength > this.sizeInBytes) {
      return null; // Insufficient space
    }

    return this.createView(nodeId, offset, length);
  }
}

// ============================================================================
// GLOBAL BUFFER INSTANCE
// ============================================================================

/**
 * Global data buffer for sharing large datasets between nodes
 * Pre-allocated 1MB buffer for general use
 */
export const globalDataBuffer = new NodeDataBuffer({
  sizeInBytes: 1024 * 1024, // 1MB
  useSharedBuffer: false, // Safe default
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a specialized buffer for high-performance scenarios
 *
 * @param sizeInMB - Buffer size in megabytes
 * @param useSharedBuffer - Whether to use SharedArrayBuffer
 * @returns New NodeDataBuffer instance
 */
export function createHighPerformanceBuffer(
  sizeInMB: number = 10,
  useSharedBuffer: boolean = false
): NodeDataBuffer {
  return new NodeDataBuffer({
    sizeInBytes: sizeInMB * 1024 * 1024,
    useSharedBuffer,
  });
}

/**
 * Check if SharedArrayBuffer is available in current environment
 * @returns boolean indicating availability
 */
export function isSharedArrayBufferSupported(): boolean {
  return typeof SharedArrayBuffer !== "undefined";
}

/**
 * Calculate optimal buffer size based on expected data volume
 *
 * @param nodeCount - Expected number of nodes
 * @param dataPointsPerNode - Average data points per node
 * @param safetyMultiplier - Safety multiplier for extra space
 * @returns Recommended buffer size in bytes
 */
export function calculateOptimalBufferSize(
  nodeCount: number,
  dataPointsPerNode: number,
  safetyMultiplier: number = 1.5
): number {
  const bytesPerDataPoint = Float32Array.BYTES_PER_ELEMENT;
  const totalBytes = nodeCount * dataPointsPerNode * bytesPerDataPoint;
  return Math.ceil(totalBytes * safetyMultiplier);
}
