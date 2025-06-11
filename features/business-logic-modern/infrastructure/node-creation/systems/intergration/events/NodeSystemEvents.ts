import { EventEmitter } from "events";

// Event type definitions
export interface NodeSystemEvents {
  // Registry Events
  "registry:initializing": () => void;
  "registry:ready": () => void;
  "registry:error": (error: Error) => void;
  "registry:node-registered": (nodeType: string, config: any) => void;
  "registry:node-updated": (
    nodeType: string,
    config: any,
    oldConfig: any
  ) => void;
  "registry:validation-failed": (nodeType: string, errors: string[]) => void;

  // Node Lifecycle Events
  "node:created": (nodeId: string, nodeType: string, data: any) => void;
  "node:updated": (
    nodeId: string,
    nodeType: string,
    data: any,
    oldData: any
  ) => void;
  "node:deleted": (nodeId: string, nodeType: string) => void;
  "node:error": (nodeId: string, nodeType: string, error: Error) => void;
  "node:processing-start": (nodeId: string, nodeType: string) => void;
  "node:processing-complete": (
    nodeId: string,
    nodeType: string,
    result: any
  ) => void;

  // V2 Specific Events
  "v2:registry-initialized": () => void;
  "v2:node-generated": (nodeType: string, generator: string) => void;
  "v2:validation-passed": (nodeType: string, validator: string) => void;
  "v2:fallback-activated": (nodeType: string, reason: string) => void;
  "v2:performance-warning": (
    nodeType: string,
    metric: string,
    value: number
  ) => void;

  // Inspector Events
  "inspector:control-loaded": (nodeType: string, controlType: string) => void;
  "inspector:control-failed": (
    nodeType: string,
    controlType: string,
    error: Error
  ) => void;
  "inspector:fallback-used": (nodeType: string, fallbackType: string) => void;

  // System Events
  "system:startup": () => void;
  "system:shutdown": () => void;
  "system:memory-warning": (usage: number, threshold: number) => void;
  "system:performance-metric": (
    metric: string,
    value: number,
    nodeType?: string
  ) => void;
}

// Event data interfaces
export interface NodeEventData {
  nodeId: string;
  nodeType: string;
  timestamp: number;
  data?: any;
}

export interface RegistryEventData {
  nodeType: string;
  timestamp: number;
  config?: any;
  errors?: string[];
}

export interface PerformanceEventData {
  metric: string;
  value: number;
  threshold?: number;
  nodeType?: string;
  timestamp: number;
}

// Main event system class
class NodeSystemEventEmitter extends EventEmitter {
  private static instance: NodeSystemEventEmitter;
  private listenerTracker: Map<string, Set<Function>> = new Map();
  private eventHistory: Array<{ event: string; data: any; timestamp: number }> =
    [];
  private maxHistorySize = 1000;

  private constructor() {
    super();
    this.setMaxListeners(100); // Increase limit for development
  }

  static getInstance(): NodeSystemEventEmitter {
    if (!NodeSystemEventEmitter.instance) {
      NodeSystemEventEmitter.instance = new NodeSystemEventEmitter();
    }
    return NodeSystemEventEmitter.instance;
  }

  /**
   * Enhanced emit with automatic logging and history
   */
  emitV2<K extends keyof NodeSystemEvents>(
    event: K,
    ...args: Parameters<NodeSystemEvents[K]>
  ): boolean {
    const timestamp = Date.now();

    // Add to history
    this.eventHistory.push({
      event,
      data: args,
      timestamp,
    });

    // Trim history if needed
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }

    // Debug logging removed for cleaner console

    // Emit the event
    return this.emit(event, ...args);
  }

  /**
   * Register a typed event listener
   */
  onV2<K extends keyof NodeSystemEvents>(
    event: K,
    listener: NodeSystemEvents[K]
  ): this {
    // Track listeners for debugging
    if (!this.listenerTracker.has(event)) {
      this.listenerTracker.set(event, new Set());
    }
    this.listenerTracker.get(event)!.add(listener);

    return this.on(event, listener);
  }

  /**
   * Remove a typed event listener
   */
  offV2<K extends keyof NodeSystemEvents>(
    event: K,
    listener: NodeSystemEvents[K]
  ): this {
    if (this.listenerTracker.has(event)) {
      this.listenerTracker.get(event)!.delete(listener);
    }

    return this.off(event, listener);
  }

  /**
   * One-time event listener
   */
  onceV2<K extends keyof NodeSystemEvents>(
    event: K,
    listener: NodeSystemEvents[K]
  ): this {
    return this.once(event, listener);
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(eventType?: keyof NodeSystemEvents, limit: number = 50) {
    let history = this.eventHistory;

    if (eventType) {
      history = history.filter((entry) => entry.event === eventType);
    }

    return history.slice(-limit).reverse();
  }

  /**
   * Get current listener count for an event
   */
  getListenerCount(event: keyof NodeSystemEvents): number {
    return this.listenerTracker.get(event)?.size || 0;
  }

  /**
   * Get all active event types
   */
  getActiveEvents(): string[] {
    return Array.from(this.listenerTracker.keys());
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Performance monitoring helpers
   */
  startPerformanceTracking(nodeType: string, operation: string): () => void {
    const startTime = performance.now();

    return () => {
      const duration = performance.now() - startTime;
      this.emitV2(
        "system:performance-metric",
        `${operation}_duration`,
        duration,
        nodeType
      );

      // Warn if operation is slow
      if (duration > 100) {
        // 100ms threshold
        this.emitV2("v2:performance-warning", nodeType, operation, duration);
      }
    };
  }
}

// Singleton instance
export const nodeSystemEvents = NodeSystemEventEmitter.getInstance();

// Utility functions for common event patterns
export const NodeEventUtils = {
  /**
   * Track node creation with automatic cleanup
   */
  trackNodeCreation(nodeId: string, nodeType: string, data: any) {
    nodeSystemEvents.emitV2("node:created", nodeId, nodeType, data);

    // Set up automatic cleanup tracking
    const cleanup = () => {
      nodeSystemEvents.emitV2("node:deleted", nodeId, nodeType);
    };

    return cleanup;
  },

  /**
   * Track registry operations
   */
  trackRegistryOperation<T>(nodeType: string, operation: () => T): T {
    const endTracking = nodeSystemEvents.startPerformanceTracking(
      nodeType,
      "registry_operation"
    );

    try {
      const result = operation();
      nodeSystemEvents.emitV2("registry:node-registered", nodeType, result);
      return result;
    } catch (error) {
      nodeSystemEvents.emitV2("registry:error", error as Error);
      throw error;
    } finally {
      endTracking();
    }
  },

  /**
   * Track V2 node processing
   */
  async trackNodeProcessing<T>(
    nodeId: string,
    nodeType: string,
    processor: () => Promise<T>
  ): Promise<T> {
    nodeSystemEvents.emitV2("node:processing-start", nodeId, nodeType);
    const endTracking = nodeSystemEvents.startPerformanceTracking(
      nodeType,
      "node_processing"
    );

    try {
      const result = await processor();
      nodeSystemEvents.emitV2(
        "node:processing-complete",
        nodeId,
        nodeType,
        result
      );
      return result;
    } catch (error) {
      nodeSystemEvents.emitV2("node:error", nodeId, nodeType, error as Error);
      throw error;
    } finally {
      endTracking();
    }
  },

  /**
   * Initialize event-driven analytics
   */
  initializeAnalytics() {
    // Track registry performance
    nodeSystemEvents.onV2("registry:ready", () => {
      console.log("[V2 Analytics] Registry initialized successfully");
    });

    nodeSystemEvents.onV2(
      "v2:performance-warning",
      (nodeType, metric, value) => {
        console.warn(
          `[V2 Analytics] Performance warning for ${nodeType}: ${metric} = ${value}ms`
        );
      }
    );

    nodeSystemEvents.onV2("node:error", (nodeId, nodeType, error) => {
      console.error(
        `[V2 Analytics] Node error in ${nodeType} (${nodeId}):`,
        error
      );
    });

    // Track system health
    nodeSystemEvents.onV2("system:memory-warning", (usage, threshold) => {
      console.warn(
        `[V2 Analytics] Memory usage warning: ${usage}MB (threshold: ${threshold}MB)`
      );
    });
  },
};

// Development helpers
export const DevEventHelpers = {
  /**
   * Log all events for debugging
   */
  enableEventLogging() {
    const originalEmit = nodeSystemEvents.emitV2;

    nodeSystemEvents.emitV2 = function <K extends keyof NodeSystemEvents>(
      event: K,
      ...args: Parameters<NodeSystemEvents[K]>
    ) {
      console.log(`[V2 Event Debug] ${event}:`, args);
      return (originalEmit as any).call(this, event, ...args);
    };
  },

  /**
   * Get event statistics
   */
  getEventStats() {
    const history = nodeSystemEvents.getEventHistory();
    const stats: Record<string, number> = {};

    history.forEach((entry) => {
      stats[entry.event] = (stats[entry.event] || 0) + 1;
    });

    return {
      totalEvents: history.length,
      eventCounts: stats,
      activeListeners: nodeSystemEvents.getActiveEvents().length,
    };
  },

  /**
   * Monitor performance metrics
   */
  startPerformanceMonitoring() {
    nodeSystemEvents.onV2(
      "system:performance-metric",
      (metric, value, nodeType) => {
        console.log(
          `[V2 Performance] ${nodeType || "System"} - ${metric}: ${value.toFixed(2)}ms`
        );
      }
    );
  },
};

// Initialize analytics in development
if (process.env.NODE_ENV === "development") {
  NodeEventUtils.initializeAnalytics();
}

// Export main instance and types
export default nodeSystemEvents;
// Types are already exported above
