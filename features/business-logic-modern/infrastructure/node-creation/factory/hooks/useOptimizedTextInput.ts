/**
 * OPTIMIZED TEXT INPUT HOOK - Solves text lag with enterprise-grade optimizations
 *
 * FEATURES:
 * • Smart debouncing with configurable delays
 * • Input validation and sanitization
 * • Performance monitoring and metrics
 * • Memory leak prevention
 * • Error recovery and fallback handling
 * • Configurable update strategies
 * • Built-in performance safeguards
 *
 * PERFORMANCE OPTIMIZATIONS:
 * • Debounced updates prevent cascade re-renders
 * • Local state for immediate UI feedback
 * • Batch validation for multiple inputs
 * • Automatic cleanup and memory management
 * • Performance metrics and alerting
 *
 * @author Enterprise Team
 * @version 1.0.0
 */

import { useCallback, useEffect, useRef, useState } from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TextInputConfig {
  /** Debounce delay in milliseconds (default: 150ms for smooth typing) */
  debounceMs?: number;
  /** Maximum text length (default: 100000) */
  maxLength?: number;
  /** Minimum update interval to prevent excessive calls (default: 50ms) */
  minUpdateInterval?: number;
  /** Enable performance monitoring (default: true in development) */
  enableMetrics?: boolean;
  /** Update strategy: 'debounced' | 'throttled' | 'immediate' */
  updateStrategy?: "debounced" | "throttled" | "immediate";
  /** Custom validation function */
  validator?: (text: string) => boolean | string;
  /** Error recovery callback */
  onError?: (error: Error) => void;
}

interface TextInputMetrics {
  updateCount: number;
  averageUpdateTime: number;
  lastUpdateTime: number;
  errorCount: number;
  charactersPerSecond: number;
}

interface OptimizedTextInputReturn {
  /** Current text value for controlled input */
  value: string;
  /** Optimized change handler */
  onChange: (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => void;
  /** Manual update trigger */
  flush: () => void;
  /** Clear all pending updates */
  clear: () => void;
  /** Performance metrics */
  metrics: TextInputMetrics;
  /** Whether update is pending */
  isPending: boolean;
  /** Current validation error */
  validationError: string | null;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class TextInputPerformanceMonitor {
  private metrics: Map<string, TextInputMetrics> = new Map();
  private readonly PERFORMANCE_THRESHOLD_MS = 100;
  private readonly HIGH_FREQUENCY_THRESHOLD = 20; // updates per second

  updateMetrics(nodeId: string, updateDuration: number): void {
    const existing = this.metrics.get(nodeId) || {
      updateCount: 0,
      averageUpdateTime: 0,
      lastUpdateTime: 0,
      errorCount: 0,
      charactersPerSecond: 0,
    };

    const newMetrics: TextInputMetrics = {
      updateCount: existing.updateCount + 1,
      averageUpdateTime:
        (existing.averageUpdateTime * existing.updateCount + updateDuration) /
        (existing.updateCount + 1),
      lastUpdateTime: Date.now(),
      errorCount: existing.errorCount,
      charactersPerSecond: this.calculateCPS(nodeId),
    };

    this.metrics.set(nodeId, newMetrics);

    // Performance warnings
    if (updateDuration > this.PERFORMANCE_THRESHOLD_MS) {
      console.warn(
        `[TextInput] Slow update detected for node ${nodeId}: ${updateDuration}ms`
      );
    }

    if (newMetrics.charactersPerSecond > this.HIGH_FREQUENCY_THRESHOLD) {
      console.warn(
        `[TextInput] High frequency typing detected for node ${nodeId}: ${newMetrics.charactersPerSecond} CPS`
      );
    }
  }

  recordError(nodeId: string): void {
    const existing = this.metrics.get(nodeId);
    if (existing) {
      existing.errorCount++;
    }
  }

  private calculateCPS(nodeId: string): number {
    const metrics = this.metrics.get(nodeId);
    if (!metrics || metrics.updateCount < 2) return 0;

    const timeWindow = 1000; // 1 second
    const now = Date.now();
    const timeSinceLastUpdate = now - metrics.lastUpdateTime;

    if (timeSinceLastUpdate > timeWindow) return 0;

    return Math.round(metrics.updateCount / (timeSinceLastUpdate / 1000));
  }

  getMetrics(nodeId: string): TextInputMetrics {
    return (
      this.metrics.get(nodeId) || {
        updateCount: 0,
        averageUpdateTime: 0,
        lastUpdateTime: 0,
        errorCount: 0,
        charactersPerSecond: 0,
      }
    );
  }

  cleanup(nodeId: string): void {
    this.metrics.delete(nodeId);
  }
}

// Global performance monitor
const performanceMonitor = new TextInputPerformanceMonitor();

// ============================================================================
// DEBOUNCING UTILITIES
// ============================================================================

class SmartDebouncer {
  private timeouts = new Map<string, Timer>();
  private lastCallTimes = new Map<string, number>();

  debounce<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    delay: number,
    minInterval: number = 0
  ): T {
    return ((...args: any[]) => {
      const now = Date.now();
      const lastCall = this.lastCallTimes.get(key) || 0;

      // Enforce minimum interval between calls
      if (minInterval > 0 && now - lastCall < minInterval) {
        return;
      }

      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        this.lastCallTimes.set(key, Date.now());
        this.timeouts.delete(key);
        fn(...args);
      }, delay);

      this.timeouts.set(key, timeout);
    }) as T;
  }

  throttle<T extends (...args: any[]) => void>(
    key: string,
    fn: T,
    delay: number
  ): T {
    return ((...args: any[]) => {
      const now = Date.now();
      const lastCall = this.lastCallTimes.get(key) || 0;

      if (now - lastCall >= delay) {
        this.lastCallTimes.set(key, now);
        fn(...args);
      }
    }) as T;
  }

  flush(key: string): void {
    const timeout = this.timeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(key);
    }
  }

  cleanup(key: string): void {
    this.flush(key);
    this.lastCallTimes.delete(key);
  }
}

// Global debouncer instance
const smartDebouncer = new SmartDebouncer();

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

const defaultValidator = (text: string): boolean | string => {
  if (text.length > 100000) {
    return "Text exceeds maximum length of 100,000 characters";
  }

  // Check for potentially problematic patterns
  const suspiciousPatterns = [
    /(.)\1{1000,}/, // Repeated character spam
    /<script[^>]*>.*?<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript URLs
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return "Text contains potentially harmful content";
    }
  }

  return true;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Optimized text input hook with enterprise-grade performance optimizations
 *
 * @param nodeId - Unique identifier for the node
 * @param initialValue - Initial text value
 * @param updateCallback - Callback to update node data
 * @param config - Configuration options
 * @returns Optimized text input handlers and state
 */
export function useOptimizedTextInput(
  nodeId: string,
  initialValue: string,
  updateCallback: (nodeId: string, data: { heldText: string }) => void,
  config: TextInputConfig = {}
): OptimizedTextInputReturn {
  // Configuration with smart defaults
  const {
    debounceMs = 50, // Reduced for faster deletion (was 150ms)
    maxLength = 100000,
    minUpdateInterval = 25, // Reduced for faster updates (was 50ms)
    enableMetrics = process.env.NODE_ENV === "development",
    updateStrategy = "debounced",
    validator = defaultValidator,
    onError,
  } = config;

  // Local state for immediate UI feedback
  const [localValue, setLocalValue] = useState(initialValue);
  const [isPending, setIsPending] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Refs for stable references
  const updateCallbackRef = useRef(updateCallback);
  const pendingValueRef = useRef<string | null>(null);

  // Update callback ref when it changes
  useEffect(() => {
    updateCallbackRef.current = updateCallback;
  }, [updateCallback]);

  // Sync local value with prop changes
  useEffect(() => {
    if (initialValue !== localValue && !isPending) {
      setLocalValue(initialValue);
    }
  }, [initialValue, localValue, isPending]);

  // Create optimized update function
  const performUpdate = useCallback(
    (value: string) => {
      const startTime = Date.now();

      try {
        // Validate input
        const validationResult = validator(value);
        if (validationResult !== true) {
          setValidationError(
            typeof validationResult === "string"
              ? validationResult
              : "Invalid input"
          );
          return;
        }

        setValidationError(null);

        // Perform update
        updateCallbackRef.current(nodeId, { heldText: value });
        setIsPending(false);
        pendingValueRef.current = null;

        // Record metrics
        if (enableMetrics) {
          const duration = Date.now() - startTime;
          performanceMonitor.updateMetrics(nodeId, duration);
        }
      } catch (error) {
        console.error(`[TextInput] Update failed for node ${nodeId}:`, error);
        performanceMonitor.recordError(nodeId);
        onError?.(error as Error);
        setIsPending(false);
      }
    },
    [nodeId, validator, enableMetrics, onError]
  );

  // Create debounced/throttled update function based on strategy
  const debouncedUpdate = useCallback(
    (() => {
      const updateKey = `text-input-${nodeId}`;

      switch (updateStrategy) {
        case "immediate":
          return performUpdate;
        case "throttled":
          return smartDebouncer.throttle(updateKey, performUpdate, debounceMs);
        case "debounced":
        default:
          return smartDebouncer.debounce(
            updateKey,
            performUpdate,
            debounceMs,
            minUpdateInterval
          );
      }
    })(),
    [nodeId, performUpdate, updateStrategy, debounceMs, minUpdateInterval]
  );

  // Optimized change handler
  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      const newValue = e.target.value;

      // Immediate length check
      if (newValue.length > maxLength) {
        return; // Silently ignore overly long input
      }

      // Update local state immediately for responsive UI
      setLocalValue(newValue);
      setIsPending(true);
      pendingValueRef.current = newValue;

      // Trigger optimized update
      debouncedUpdate(newValue);
    },
    [maxLength, debouncedUpdate]
  );

  // Manual flush function
  const flush = useCallback(() => {
    const updateKey = `text-input-${nodeId}`;
    smartDebouncer.flush(updateKey);

    if (pendingValueRef.current !== null) {
      performUpdate(pendingValueRef.current);
    }
  }, [nodeId, performUpdate]);

  // Clear function
  const clear = useCallback(() => {
    const updateKey = `text-input-${nodeId}`;
    smartDebouncer.flush(updateKey);
    setIsPending(false);
    pendingValueRef.current = null;
    setValidationError(null);
  }, [nodeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const updateKey = `text-input-${nodeId}`;
      smartDebouncer.cleanup(updateKey);
      performanceMonitor.cleanup(nodeId);
    };
  }, [nodeId]);

  // Get current metrics
  const metrics = enableMetrics
    ? performanceMonitor.getMetrics(nodeId)
    : {
        updateCount: 0,
        averageUpdateTime: 0,
        lastUpdateTime: 0,
        errorCount: 0,
        charactersPerSecond: 0,
      };

  return {
    value: localValue,
    onChange,
    flush,
    clear,
    metrics,
    isPending,
    validationError,
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for text input with automatic performance optimization (faster deletion)
 */
export function useAutoOptimizedTextInput(
  nodeId: string,
  initialValue: string,
  updateCallback: (nodeId: string, data: { heldText: string }) => void
) {
  return useOptimizedTextInput(nodeId, initialValue, updateCallback, {
    // Faster defaults optimized for deletion speed
    debounceMs: initialValue.length > 1000 ? 50 : 25, // Reduced from 300/150ms
    minUpdateInterval: initialValue.length > 1000 ? 16 : 8, // Added faster updates
    updateStrategy: initialValue.length > 5000 ? "throttled" : "debounced",
    enableMetrics: true,
  });
}

/**
 * Hook for high-performance text input (ultra-fast for deletion)
 */
export function useHighPerformanceTextInput(
  nodeId: string,
  initialValue: string,
  updateCallback: (nodeId: string, data: { heldText: string }) => void
) {
  return useOptimizedTextInput(nodeId, initialValue, updateCallback, {
    debounceMs: 16, // Reduced from 100ms to 16ms (1 frame at 60fps)
    minUpdateInterval: 8, // Reduced from 25ms to 8ms
    updateStrategy: "debounced",
    enableMetrics: true,
  });
}

/**
 * Hook for large text input (optimized for heavy content)
 */
export function useLargeTextInput(
  nodeId: string,
  initialValue: string,
  updateCallback: (nodeId: string, data: { heldText: string }) => void
) {
  return useOptimizedTextInput(nodeId, initialValue, updateCallback, {
    debounceMs: 100, // Reduced from 500ms for faster deletion
    minUpdateInterval: 25, // Reduced from 100ms
    updateStrategy: "throttled",
    maxLength: 1000000,
    enableMetrics: true,
  });
}

/**
 * Hook for instant text input (no debouncing for maximum deletion speed)
 */
export function useInstantTextInput(
  nodeId: string,
  initialValue: string,
  updateCallback: (nodeId: string, data: { heldText: string }) => void
) {
  return useOptimizedTextInput(nodeId, initialValue, updateCallback, {
    debounceMs: 0, // No debouncing
    minUpdateInterval: 0, // No throttling
    updateStrategy: "immediate", // Instant updates
    enableMetrics: true,
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useOptimizedTextInput;
export type { OptimizedTextInputReturn, TextInputConfig, TextInputMetrics };
