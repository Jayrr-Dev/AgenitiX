/**
 * NODE MEMORY REACT HOOK - Seamless integration with React components
 *
 * • Provides easy access to node memory within React components
 * • Automatic cleanup on component unmount
 * • Real-time memory metrics and monitoring
 * • Type-safe memory operations with TypeScript
 * • Integration with existing useNodeData hook
 *
 * Keywords: react-hook, node-memory, integration, type-safe, cleanup
 */

import { useEffect, useRef, useState } from "react";
import { globalNodeMemoryManager, type NodeMemoryConfig, type MemoryMetrics } from "./NodeMemory";

/**
 * Enhanced node memory hook with React integration
 */
export function useNodeMemory(nodeId: string, config?: NodeMemoryConfig) {
  const memoryRef = useRef(globalNodeMemoryManager.get(nodeId, config));
  const [metrics, setMetrics] = useState<MemoryMetrics>(memoryRef.current.stats());

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(memoryRef.current.stats());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't destroy memory on unmount - it should persist across component re-renders
      // Memory is only destroyed when the node is deleted from the flow
    };
  }, []);

  const memory = memoryRef.current;

  return {
    // Core memory operations
    set: <T>(key: string, value: T, ttl?: number) => memory.set(key, value, ttl),
    get: <T>(key: string) => memory.get<T>(key),
    has: (key: string) => memory.has(key),
    delete: (key: string) => memory.delete(key),
    clear: () => memory.clear(),

    // Advanced operations
    compute: <T>(key: string, computeFn: () => Promise<T> | T, ttl?: number) =>
      memory.compute(key, computeFn, ttl),

    // Memory management
    gc: () => memory.gc(),
    stats: () => memory.stats(),

    // React-specific features
    metrics, // Real-time metrics state
    memoryPressure: metrics.pressure,
    isHealthy: metrics.pressure < 0.8,

    // Utility functions
    size: () => memory.size(),
    count: () => memory.count(),
  };
}

/**
 * Hook for memory-aware state management
 * Combines React state with persistent node memory
 */
export function useMemoryState<T>(
  nodeId: string,
  key: string,
  initialValue: T,
  ttl?: number
): [T, (value: T) => void, T | undefined] {
  const memory = useNodeMemory(nodeId);
  const [state, setState] = useState<T>(() => {
    // Try to load from memory first
    const cached = memory.get<T>(key);
    return cached !== undefined ? cached : initialValue;
  });
  const [lastResult, setLastResult] = useState<T | undefined>(undefined);

  const setValue = (value: T) => {
    setState(value);
    const result = memory.set(key, value, ttl);
    setLastResult(result);
  };

  // Sync with memory on mount
  useEffect(() => {
    const cached = memory.get<T>(key);
    if (cached !== undefined && cached !== state) {
      setState(cached);
      setLastResult(cached);
    }
  }, [key, memory, state]);

  return [state, setValue, lastResult];
}

/**
 * Hook for computed values with memory caching
 */
export function useMemoryComputed<T>(
  nodeId: string,
  key: string,
  computeFn: () => T | Promise<T>,
  dependencies: any[] = [],
  ttl?: number
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
  const memory = useNodeMemory(nodeId);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compute = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await memory.compute(key, computeFn, ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Compute on mount and dependency changes
  useEffect(() => {
    compute();
  }, [key, ...dependencies]);

  return {
    data,
    loading,
    error,
    refresh: compute
  };
}

/**
 * Hook for memory analytics and monitoring
 */
export function useMemoryAnalytics(nodeId: string) {
  const memory = useNodeMemory(nodeId);
  const [analytics, setAnalytics] = useState({
    metrics: memory.stats(),
    history: [] as MemoryMetrics[]
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMetrics = memory.stats();
      setAnalytics(prev => ({
        metrics: currentMetrics,
        history: [...prev.history.slice(-59), currentMetrics] // Keep last 60 data points
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [memory]);

  return {
    ...analytics,
    isHealthy: analytics.metrics.pressure < 0.8,
    needsCleanup: analytics.metrics.pressure > 0.9,
    performGC: memory.gc,
    clearMemory: memory.clear
  };
}