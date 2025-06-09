/**
 * MEMORY CLEANUP UTILITY - Comprehensive memory leak prevention system
 *
 * • Clears global caches, maps, and accumulated data across all systems
 * • Handles NodeFactory, PropagationEngine, and cycle node state cleanup
 * • Removes global event listeners and React internal state references
 * • Provides memory usage tracking and garbage collection hints
 * • Emergency cleanup for complete application memory reset
 *
 * Keywords: memory-leaks, caches, garbage-collection, global-state, cleanup
 */

// COMPREHENSIVE MEMORY CLEANUP UTILITY
// Clears all global caches, maps, and accumulated data to prevent memory leaks

import { emergencyCleanupAllTimers } from "./timerCleanup";

// ============================================================================
// MEMORY LEAK SOURCES TO CLEAN
// ============================================================================

interface MemoryStats {
  clearedCaches: number;
  clearedTimers: number;
  clearedMaps: number;
  clearedEventListeners: number;
  beforeMemoryMB: number;
  afterMemoryMB: number;
}

/**
 * Get current memory usage (if available)
 */
const getMemoryUsage = (): number => {
  if (typeof window !== "undefined" && "memory" in performance) {
    return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
  }
  return 0;
};

/**
 * Clear NodeFactory global caches
 */
const clearNodeFactoryCaches = (): number => {
  let clearedCount = 0;

  try {
    // Import the global caches directly
    const {
      calculationCache,
      debouncedUpdates,
      NODE_INSPECTOR_REGISTRY,
    } = require("../factory/NodeFactory");

    // Clear calculation cache
    if (calculationCache && calculationCache.size > 0) {
      const size = calculationCache.size;
      calculationCache.clear();
      clearedCount += size;
      console.log(`Cleared ${size} calculation cache entries`);
    }

    // Clear debounced updates
    if (debouncedUpdates && debouncedUpdates.size > 0) {
      debouncedUpdates.forEach((timeoutId: number) => {
        clearTimeout(timeoutId);
      });
      const size = debouncedUpdates.size;
      debouncedUpdates.clear();
      clearedCount += size;
      console.log(`Cleared ${size} debounced updates`);
    }

    // Clear NODE_INSPECTOR_REGISTRY
    if (NODE_INSPECTOR_REGISTRY && NODE_INSPECTOR_REGISTRY.size > 0) {
      const size = NODE_INSPECTOR_REGISTRY.size;
      NODE_INSPECTOR_REGISTRY.clear();
      clearedCount += size;
      console.log(`Cleared ${size} inspector registry entries`);
    }
  } catch (error) {
    console.warn("Could not clear NodeFactory caches:", error);
  }

  return clearedCount;
};

/**
 * Clear UltraFastPropagationEngine caches
 */
const clearPropagationEngineCaches = (): number => {
  let clearedCount = 0;

  // Clear any global instances
  try {
    // These might be accessible through global references
    if (typeof window !== "undefined") {
      const windowAny = window as any;

      // Clear any global propagation engine instances
      if (windowAny.ultraFastPropagationEngineInstances) {
        windowAny.ultraFastPropagationEngineInstances.forEach((engine: any) => {
          if (engine && typeof engine.cleanup === "function") {
            engine.cleanup();
          }
        });
        clearedCount += windowAny.ultraFastPropagationEngineInstances.length;
        windowAny.ultraFastPropagationEngineInstances = [];
      }
    }
  } catch (error) {
    console.warn("Could not clear UltraFastPropagationEngine caches:", error);
  }

  return clearedCount;
};

/**
 * Clear cycle node timers and state
 */
const clearCycleNodeState = (): number => {
  let clearedCount = 0;

  try {
    // Clear CyclePulse state
    const cyclePulseModule = require("../automation/CyclePulse");
    if (cyclePulseModule.activeCycles) {
      const size = cyclePulseModule.activeCycles.size;
      cyclePulseModule.activeCycles.clear();
      clearedCount += size;
    }
    if (cyclePulseModule.cycleTimers) {
      const size = cyclePulseModule.cycleTimers.size;
      cyclePulseModule.cycleTimers.clear();
      clearedCount += size;
    }

    // Clear CycleToggle state
    const cycleToggleModule = require("../automation/CycleToggle");
    if (cycleToggleModule.activeCycles) {
      const size = cycleToggleModule.activeCycles.size;
      cycleToggleModule.activeCycles.clear();
      clearedCount += size;
    }
  } catch (error) {
    console.warn("Could not clear cycle node state:", error);
  }

  return clearedCount;
};

/**
 * Clear global event listeners that might be accumulating
 */
const clearGlobalEventListeners = (): number => {
  let clearedCount = 0;

  if (typeof window === "undefined") return 0;

  try {
    // Remove common global listeners that might accumulate
    const events = [
      "resize",
      "scroll",
      "keydown",
      "mousemove",
      "touchmove",
      "touchend",
    ];

    events.forEach((eventType) => {
      // Create a new element to remove all listeners
      const oldElement = document.body;
      const newElement = oldElement.cloneNode(true);
      if (oldElement.parentNode) {
        oldElement.parentNode.replaceChild(newElement, oldElement);
        clearedCount++;
      }
    });
  } catch (error) {
    console.warn("Could not clear global event listeners:", error);
  }

  return clearedCount;
};

/**
 * Force garbage collection (if available)
 */
const forceGarbageCollection = (): void => {
  if (typeof window !== "undefined") {
    const windowAny = window as any;

    // Chrome DevTools garbage collection
    if (windowAny.gc && typeof windowAny.gc === "function") {
      try {
        windowAny.gc();
        console.log("🗑️ Forced garbage collection");
      } catch (error) {
        console.warn("Could not force garbage collection:", error);
      }
    }

    // Alternative garbage collection hints
    try {
      // Create and immediately discard large objects to trigger GC
      const gcTrigger = new Array(1000000).fill(null);
      gcTrigger.length = 0;
    } catch (error) {
      // Ignore GC trigger errors
    }
  }
};

/**
 * Clear React internal state (aggressive cleanup)
 */
const clearReactInternalState = (): void => {
  if (typeof window === "undefined") return;

  try {
    const windowAny = window as any;

    // Clear React DevTools state if present
    if (windowAny.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = windowAny.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.reactDevtoolsAgent) {
        // Clear any accumulated React state
        hook.reactDevtoolsAgent = null;
      }
    }

    // Clear any React Fiber references
    if (windowAny._reactInternalFiber) {
      windowAny._reactInternalFiber = null;
    }
  } catch (error) {
    console.warn("Could not clear React internal state:", error);
  }
};

/**
 * Clear accumulated error logs and state
 */
const clearErrorLogs = (): number => {
  let clearedCount = 0;

  if (typeof window === "undefined") return 0;

  try {
    // Clear console history (if accessible)
    if (typeof console.clear === "function") {
      console.clear();
      clearedCount += 1;
    }

    // Clear any global error state
    const windowAny = window as any;

    // Clear React error boundary state
    if (windowAny.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__) {
      windowAny.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__.clearErrorStack?.();
      clearedCount += 1;
    }

    // Clear any accumulated error logs in development
    if (windowAny.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = windowAny.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.onCommitFiberRoot) {
        // Clear accumulated dev tools data
        hook.getFiberRoots?.(1)?.forEach((root: any) => {
          if (root.errorBoundaryErrors) {
            root.errorBoundaryErrors.clear?.();
            clearedCount += 1;
          }
        });
      }
    }

    console.log(`Cleared ${clearedCount} error log sources`);
  } catch (error) {
    console.warn("Could not clear error logs:", error);
  }

  return clearedCount;
};

/**
 * Clear FlowStore error state
 */
const clearFlowStoreErrors = (): number => {
  let clearedCount = 0;

  try {
    // Access FlowStore and clear node errors
    const flowStoreModule = require("../../stores/flowStore");
    const useFlowStore = flowStoreModule.useFlowStore;

    // Get the store state
    const state = useFlowStore.getState();

    if (state.nodeErrors && typeof state.nodeErrors === "object") {
      const errorCount = Object.keys(state.nodeErrors).length;

      // Clear all node errors
      Object.keys(state.nodeErrors).forEach((nodeId) => {
        state.clearNodeErrors(nodeId);
      });

      clearedCount = errorCount;
      console.log(`Cleared ${errorCount} node error logs`);
    }
  } catch (error) {
    console.warn("Could not clear FlowStore errors:", error);
  }

  return clearedCount;
};

// ============================================================================
// MAIN CLEANUP FUNCTIONS
// ============================================================================

/**
 * Comprehensive memory cleanup - clears ALL accumulated data
 */
export const performCompleteMemoryCleanup = (): MemoryStats => {
  console.warn("🧹 Starting comprehensive memory cleanup...");

  const beforeMemory = getMemoryUsage();
  let totalCleared = 0;

  // 1. Clear all timers first
  emergencyCleanupAllTimers();

  // 2. Clear NodeFactory caches
  const clearedCaches = clearNodeFactoryCaches();
  totalCleared += clearedCaches;

  // 3. Clear propagation engine state
  const clearedPropagation = clearPropagationEngineCaches();
  totalCleared += clearedPropagation;

  // 4. Clear cycle node state
  const clearedCycleState = clearCycleNodeState();
  totalCleared += clearedCycleState;

  // 5. Clear event listeners
  const clearedListeners = clearGlobalEventListeners();

  // 6. Clear React state
  clearReactInternalState();

  // 7. Clear error logs
  const clearedErrorLogs = clearErrorLogs();
  totalCleared += clearedErrorLogs;

  // 8. Clear FlowStore errors
  const clearedFlowStoreErrors = clearFlowStoreErrors();
  totalCleared += clearedFlowStoreErrors;

  // 9. Force garbage collection
  setTimeout(() => {
    forceGarbageCollection();
  }, 100);

  const afterMemory = getMemoryUsage();

  const stats: MemoryStats = {
    clearedCaches,
    clearedTimers: 0, // Handled by timer cleanup
    clearedMaps: totalCleared,
    clearedEventListeners: clearedListeners,
    beforeMemoryMB: beforeMemory,
    afterMemoryMB: afterMemory,
  };

  console.log("✅ Memory cleanup complete:", stats);

  return stats;
};

/**
 * Emergency memory cleanup - for when things get really bad
 */
export const emergencyMemoryCleanup = (): void => {
  console.error("🚨 EMERGENCY MEMORY CLEANUP INITIATED");

  try {
    // Aggressive cleanup
    performCompleteMemoryCleanup();

    // Clear localStorage to reset everything
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.warn("Could not clear storage:", error);
      }
    }

    // Multiple GC attempts
    setTimeout(() => forceGarbageCollection(), 0);
    setTimeout(() => forceGarbageCollection(), 500);
    setTimeout(() => forceGarbageCollection(), 1000);

    console.log("🆘 Emergency cleanup complete - consider refreshing the page");
  } catch (error) {
    console.error("Emergency cleanup failed:", error);
    console.log("💀 Please refresh the page immediately");
  }
};

// ============================================================================
// DEVELOPMENT HELPERS
// ============================================================================

// Make available in dev mode for debugging
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).memoryCleanupDebug = {
    performCleanup: performCompleteMemoryCleanup,
    emergencyCleanup: emergencyMemoryCleanup,
    getMemoryUsage,
    clearCaches: clearNodeFactoryCaches,
    clearPropagation: clearPropagationEngineCaches,
    clearCycleState: clearCycleNodeState,
    clearErrorLogs,
    clearFlowStoreErrors,
  };
}
