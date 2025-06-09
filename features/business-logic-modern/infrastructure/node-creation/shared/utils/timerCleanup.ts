/**
 * TIMER CLEANUP UTILITY - Prevents memory leaks from timers and intervals
 *
 * • Centralized registry tracking timeouts, intervals, and RAF per node
 * • Safe timer creation functions with auto-registration for cleanup
 * • Node-specific cleanup when nodes are removed from workflow
 * • Emergency cleanup for all timers across entire application
 * • SSR-safe timer handling with browser environment checks
 *
 * Keywords: memory-leaks, timers, intervals, RAF, cleanup, node-lifecycle
 */

// CENTRALIZED TIMER CLEANUP UTILITY
// Prevents memory leaks from timers, intervals, and RAF

interface TimerRegistry {
  timeouts: Set<number>;
  intervals: Set<number>;
  rafs: Set<number>;
  customCleanup: Set<() => void>;
}

// GLOBAL TIMER REGISTRY PER NODE
const nodeTimers = new Map<string, TimerRegistry>();

// ============================================================================
// TIMER REGISTRATION FUNCTIONS
// ============================================================================

/**
 * Register a setTimeout for cleanup tracking
 */
export const registerTimeout = (nodeId: string, timeoutId: number): void => {
  if (!nodeTimers.has(nodeId)) {
    nodeTimers.set(nodeId, {
      timeouts: new Set(),
      intervals: new Set(),
      rafs: new Set(),
      customCleanup: new Set(),
    });
  }
  nodeTimers.get(nodeId)!.timeouts.add(timeoutId);
};

/**
 * Register a setInterval for cleanup tracking
 */
export const registerInterval = (nodeId: string, intervalId: number): void => {
  if (!nodeTimers.has(nodeId)) {
    nodeTimers.set(nodeId, {
      timeouts: new Set(),
      intervals: new Set(),
      rafs: new Set(),
      customCleanup: new Set(),
    });
  }
  nodeTimers.get(nodeId)!.intervals.add(intervalId);
};

/**
 * Register a requestAnimationFrame for cleanup tracking
 */
export const registerRAF = (nodeId: string, rafId: number): void => {
  if (!nodeTimers.has(nodeId)) {
    nodeTimers.set(nodeId, {
      timeouts: new Set(),
      intervals: new Set(),
      rafs: new Set(),
      customCleanup: new Set(),
    });
  }
  nodeTimers.get(nodeId)!.rafs.add(rafId);
};

/**
 * Register a custom cleanup function
 */
export const registerCustomCleanup = (
  nodeId: string,
  cleanupFn: () => void
): void => {
  if (!nodeTimers.has(nodeId)) {
    nodeTimers.set(nodeId, {
      timeouts: new Set(),
      intervals: new Set(),
      rafs: new Set(),
      customCleanup: new Set(),
    });
  }
  nodeTimers.get(nodeId)!.customCleanup.add(cleanupFn);
};

// ============================================================================
// SAFE TIMER CREATION FUNCTIONS
// ============================================================================

/**
 * Safe setTimeout that auto-registers for cleanup
 */
export const safeSetTimeout = (
  nodeId: string,
  callback: () => void,
  delay: number
): number => {
  // SSR Safety: Only run in browser environment
  if (typeof window === "undefined") {
    console.warn("safeSetTimeout called on server-side, skipping");
    return 0;
  }

  const timeoutId = window.setTimeout(() => {
    callback();
    // Auto-remove from registry when completed
    const registry = nodeTimers.get(nodeId);
    if (registry) {
      registry.timeouts.delete(timeoutId);
    }
  }, delay);

  registerTimeout(nodeId, timeoutId);
  return timeoutId;
};

/**
 * Safe setInterval that auto-registers for cleanup
 */
export const safeSetInterval = (
  nodeId: string,
  callback: () => void,
  interval: number
): number => {
  // SSR Safety: Only run in browser environment
  if (typeof window === "undefined") {
    console.warn("safeSetInterval called on server-side, skipping");
    return 0;
  }

  const intervalId = window.setInterval(callback, interval);
  registerInterval(nodeId, intervalId);
  return intervalId;
};

/**
 * Safe requestAnimationFrame that auto-registers for cleanup
 */
export const safeRequestAnimationFrame = (
  nodeId: string,
  callback: (time: DOMHighResTimeStamp) => void
): number => {
  // SSR Safety: Only run in browser environment
  if (typeof window === "undefined") {
    console.warn("safeRequestAnimationFrame called on server-side, skipping");
    return 0;
  }

  const rafId = window.requestAnimationFrame((time) => {
    callback(time);
    // Auto-remove from registry when completed
    const registry = nodeTimers.get(nodeId);
    if (registry) {
      registry.rafs.delete(rafId);
    }
  });

  registerRAF(nodeId, rafId);
  return rafId;
};

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up all timers for a specific node
 */
export const cleanupNodeTimers = (nodeId: string): void => {
  const registry = nodeTimers.get(nodeId);
  if (!registry) return;

  console.log(`🧹 Cleaning up timers for node ${nodeId}`);

  // Clear all timeouts
  registry.timeouts.forEach((timeoutId) => {
    window.clearTimeout(timeoutId);
  });

  // Clear all intervals
  registry.intervals.forEach((intervalId) => {
    window.clearInterval(intervalId);
  });

  // Cancel all RAF
  registry.rafs.forEach((rafId) => {
    window.cancelAnimationFrame(rafId);
  });

  // Run custom cleanup functions
  registry.customCleanup.forEach((cleanupFn) => {
    try {
      cleanupFn();
    } catch (error) {
      console.error(`Cleanup function failed for node ${nodeId}:`, error);
    }
  });

  // Remove registry
  nodeTimers.delete(nodeId);
};

/**
 * Emergency cleanup - clears ALL timers for ALL nodes
 */
export const emergencyCleanupAllTimers = (): void => {
  console.warn("🚨 Emergency cleanup - clearing ALL node timers");

  const allNodeIds = Array.from(nodeTimers.keys());
  for (const nodeId of allNodeIds) {
    cleanupNodeTimers(nodeId);
  }

  nodeTimers.clear();
};

/**
 * Get timer statistics for debugging
 */
export const getTimerStats = (): {
  nodeCount: number;
  totalTimeouts: number;
  totalIntervals: number;
  totalRAFs: number;
  customCleanupCount: number;
} => {
  let totalTimeouts = 0;
  let totalIntervals = 0;
  let totalRAFs = 0;
  let customCleanupCount = 0;

  const allRegistries = Array.from(nodeTimers.values());
  for (const registry of allRegistries) {
    totalTimeouts += registry.timeouts.size;
    totalIntervals += registry.intervals.size;
    totalRAFs += registry.rafs.size;
    customCleanupCount += registry.customCleanup.size;
  }

  return {
    nodeCount: nodeTimers.size,
    totalTimeouts,
    totalIntervals,
    totalRAFs,
    customCleanupCount,
  };
};

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Make available in dev mode for debugging (client-side only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).nodeTimerDebug = {
    getStats: getTimerStats,
    cleanup: cleanupNodeTimers,
    emergencyCleanup: emergencyCleanupAllTimers,
    registry: nodeTimers,
  };
}
