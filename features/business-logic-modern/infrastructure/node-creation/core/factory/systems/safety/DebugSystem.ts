/**
 * FACTORY DEBUG SYSTEM
 *
 * Provides comprehensive debugging, logging, and development utilities for the node factory system.
 * Includes performance monitoring, error tracking, and detailed operation logging.
 *
 * FEATURES:
 * • Development-time debugging with tree-shaking for production
 * • Performance monitoring and metrics collection
 * • Detailed operation logging with categorization
 * • Memory usage tracking and leak detection
 * • Error correlation and debugging assistance
 * • Runtime inspection and state monitoring
 *
 * DEBUG CATEGORIES:
 * • FACTORY: Core factory operations and node creation
 * • STATE: State management and updates
 * • PERFORMANCE: Performance metrics and optimization
 * • ERROR: Error handling and recovery
 * • LIFECYCLE: Component lifecycle and cleanup
 * • NETWORK: Data flow and propagation
 *
 * @author Factory Debug Team
 * @since v3.0.0
 * @keywords debugging, logging, monitoring, development, performance
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type DebugCategory =
  | "FACTORY"
  | "STATE"
  | "PERFORMANCE"
  | "ERROR"
  | "LIFECYCLE"
  | "NETWORK"
  | "GENERAL";

export type LogLevel = "trace" | "debug" | "info" | "warn" | "error";

export interface DebugOptions {
  /** Whether debugging is enabled */
  enabled?: boolean;
  /** Minimum log level to display */
  logLevel?: LogLevel;
  /** Categories to enable (empty array = all categories) */
  categories?: DebugCategory[];
  /** Whether to include timestamps */
  includeTimestamp?: boolean;
  /** Whether to include stack traces for errors */
  includeStackTrace?: boolean;
  /** Maximum number of log entries to keep in memory */
  maxLogEntries?: number;
  /** Whether to enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
}

export interface LogEntry {
  /** Unique identifier for the log entry */
  id: string;
  /** Timestamp when the log was created */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Debug category */
  category: DebugCategory;
  /** Log message */
  message: string;
  /** Additional data associated with the log */
  data?: any[];
  /** Node ID if applicable */
  nodeId?: string;
  /** Stack trace if applicable */
  stackTrace?: string;
}

export interface PerformanceMetrics {
  /** Number of debug calls per category */
  callsByCategory: Map<DebugCategory, number>;
  /** Average execution time for debug operations */
  averageExecutionTime: number;
  /** Total memory usage by debug system */
  memoryUsage: number;
  /** Number of log entries in memory */
  logEntryCount: number;
  /** Start time for performance monitoring */
  startTime: number;
}

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

const IS_DEBUG = process.env.NEXT_PUBLIC_NODE_FACTORY_DEBUG === "true";
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

const DEFAULT_OPTIONS: DebugOptions = {
  enabled: IS_DEBUG || IS_DEVELOPMENT,
  logLevel: "debug",
  categories: [], // Empty = all categories
  includeTimestamp: true,
  includeStackTrace: true,
  maxLogEntries: 1000,
  enablePerformanceMonitoring: IS_DEVELOPMENT,
};

// ============================================================================
// GLOBAL DEBUG STATE
// ============================================================================

let debugOptions: DebugOptions = { ...DEFAULT_OPTIONS };
let logEntries: LogEntry[] = [];
let performanceMetrics: PerformanceMetrics = {
  callsByCategory: new Map(),
  averageExecutionTime: 0,
  memoryUsage: 0,
  logEntryCount: 0,
  startTime: Date.now(),
};

let logIdCounter = 0;
const executionTimes: number[] = [];

// ============================================================================
// LOG LEVEL HIERARCHY
// ============================================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
};

// ============================================================================
// CORE DEBUG FUNCTIONS
// ============================================================================

/**
 * Main debug logging function with comprehensive features
 * Tree-shaken in production builds when debug is disabled
 *
 * @param category - Debug category for organization
 * @param level - Log level for filtering
 * @param message - Primary log message
 * @param data - Additional data to log
 * @param nodeId - Optional node ID for context
 *
 * @example
 * ```typescript
 * debugLog("FACTORY", "info", "Node created", { nodeType: "trigger" }, "node-123");
 * debugLog("ERROR", "error", "Validation failed", error, nodeId);
 * ```
 */
export function debugLog(
  category: DebugCategory,
  level: LogLevel,
  message: string,
  data?: any,
  nodeId?: string
): void {
  if (!debugOptions.enabled) return;

  const startTime = performance.now();

  // Check if this category and level should be logged
  if (!shouldLog(category, level)) {
    return;
  }

  // Create log entry
  const logEntry: LogEntry = {
    id: `log-${++logIdCounter}`,
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data: data ? [data] : undefined,
    nodeId,
    stackTrace:
      debugOptions.includeStackTrace && level === "error"
        ? new Error().stack
        : undefined,
  };

  // Add to log entries with size limit
  addLogEntry(logEntry);

  // Console output with formatting
  outputToConsole(logEntry);

  // Update performance metrics
  updatePerformanceMetrics(category, performance.now() - startTime);
}

/**
 * Legacy debug function for backward compatibility
 * Maintains the original simple interface
 *
 * @param message - Debug message
 * @param args - Additional arguments to log
 */
export function debug(message: string, ...args: any[]): void {
  debugLog("GENERAL", "debug", message, args.length > 0 ? args : undefined);
}

/**
 * Specialized debug functions for different categories
 */
export const debugFactory = (message: string, data?: any, nodeId?: string) =>
  debugLog("FACTORY", "debug", message, data, nodeId);

export const debugState = (message: string, data?: any, nodeId?: string) =>
  debugLog("STATE", "debug", message, data, nodeId);

export const debugPerformance = (
  message: string,
  data?: any,
  nodeId?: string
) => debugLog("PERFORMANCE", "info", message, data, nodeId);

export const debugError = (message: string, error?: any, nodeId?: string) =>
  debugLog("ERROR", "error", message, error, nodeId);

export const debugLifecycle = (message: string, data?: any, nodeId?: string) =>
  debugLog("LIFECYCLE", "debug", message, data, nodeId);

export const debugNetwork = (message: string, data?: any, nodeId?: string) =>
  debugLog("NETWORK", "debug", message, data, nodeId);

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

/**
 * Performance timer for measuring operation duration
 *
 * @example
 * ```typescript
 * const timer = createPerformanceTimer("FACTORY", "Node creation");
 * // ... perform operation
 * timer.end({ nodeType: "trigger" });
 * ```
 */
export function createPerformanceTimer(
  category: DebugCategory,
  operation: string
) {
  const startTime = performance.now();

  return {
    end: (data?: any) => {
      const duration = performance.now() - startTime;
      debugLog(
        category,
        "info",
        `${operation} completed in ${duration.toFixed(2)}ms`,
        data
      );
      return duration;
    },

    lap: (lapName: string, data?: any) => {
      const lapTime = performance.now() - startTime;
      debugLog(
        category,
        "debug",
        `${operation} - ${lapName}: ${lapTime.toFixed(2)}ms`,
        data
      );
      return lapTime;
    },
  };
}

/**
 * Memory usage monitoring
 * @param label - Label for the memory measurement
 * @returns Current memory usage information
 */
export function measureMemoryUsage(label: string = "Memory Usage"): any {
  if (
    !debugOptions.enablePerformanceMonitoring ||
    typeof window === "undefined"
  ) {
    return null;
  }

  const memoryInfo = (performance as any).memory;
  if (!memoryInfo) return null;

  const usage = {
    usedJSMemory: Math.round(memoryInfo.usedJSMemory / 1024 / 1024),
    totalJSMemory: Math.round(memoryInfo.totalJSMemory / 1024 / 1024),
    jsMemoryLimit: Math.round(memoryInfo.jsMemoryLimit / 1024 / 1024),
    timestamp: Date.now(),
  };

  debugLog("PERFORMANCE", "info", label, usage);
  return usage;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if a log should be output based on current configuration
 */
function shouldLog(category: DebugCategory, level: LogLevel): boolean {
  // Check log level
  if (LOG_LEVELS[level] < LOG_LEVELS[debugOptions.logLevel || "debug"]) {
    return false;
  }

  // Check category filter
  if (debugOptions.categories && debugOptions.categories.length > 0) {
    return debugOptions.categories.includes(category);
  }

  return true;
}

/**
 * Add log entry to the in-memory log with size management
 */
function addLogEntry(entry: LogEntry): void {
  logEntries.push(entry);

  // Maintain size limit
  const maxEntries = debugOptions.maxLogEntries || 1000;
  if (logEntries.length > maxEntries) {
    logEntries.shift(); // Remove oldest entry
  }

  performanceMetrics.logEntryCount = logEntries.length;
}

/**
 * Output log entry to console with formatting
 */
function outputToConsole(entry: LogEntry): void {
  const prefix = debugOptions.includeTimestamp
    ? `[${entry.timestamp}] [${entry.category}]`
    : `[${entry.category}]`;

  const message = entry.nodeId
    ? `${prefix} [${entry.nodeId}] ${entry.message}`
    : `${prefix} ${entry.message}`;

  // Choose appropriate console method
  switch (entry.level) {
    case "trace":
      console.trace(message, ...(entry.data || []));
      break;
    case "debug":
      console.debug(message, ...(entry.data || []));
      break;
    case "info":
      console.info(message, ...(entry.data || []));
      break;
    case "warn":
      console.warn(message, ...(entry.data || []));
      break;
    case "error":
      console.error(message, ...(entry.data || []));
      if (entry.stackTrace) {
        console.error("Stack trace:", entry.stackTrace);
      }
      break;
  }
}

/**
 * Update performance metrics
 */
function updatePerformanceMetrics(
  category: DebugCategory,
  executionTime: number
): void {
  if (!debugOptions.enablePerformanceMonitoring) return;

  // Update category call count
  const currentCount = performanceMetrics.callsByCategory.get(category) || 0;
  performanceMetrics.callsByCategory.set(category, currentCount + 1);

  // Update average execution time
  executionTimes.push(executionTime);
  if (executionTimes.length > 100) {
    executionTimes.shift(); // Keep only recent measurements
  }

  performanceMetrics.averageExecutionTime =
    executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;

  // Estimate memory usage (rough calculation)
  performanceMetrics.memoryUsage = logEntries.length * 500; // Rough estimate of bytes per log entry
}

// ============================================================================
// CONFIGURATION MANAGEMENT
// ============================================================================

/**
 * Configure debug options
 * @param options - New debug options to merge with defaults
 */
export function configureDebug(options: Partial<DebugOptions>): void {
  debugOptions = { ...debugOptions, ...options };
  debugLog("GENERAL", "info", "Debug configuration updated", options);
}

/**
 * Get current debug configuration
 * @returns Current debug options
 */
export function getDebugConfig(): DebugOptions {
  return { ...debugOptions };
}

/**
 * Enable debug for specific categories
 * @param categories - Categories to enable
 */
export function enableDebugCategories(categories: DebugCategory[]): void {
  configureDebug({ categories });
}

/**
 * Disable debug system
 */
export function disableDebug(): void {
  configureDebug({ enabled: false });
}

/**
 * Enable debug system
 */
export function enableDebug(): void {
  configureDebug({ enabled: true });
}

// ============================================================================
// LOG MANAGEMENT
// ============================================================================

/**
 * Get all log entries
 * @param filter - Optional filter for log entries
 * @returns Array of log entries
 */
export function getLogEntries(filter?: {
  category?: DebugCategory;
  level?: LogLevel;
  nodeId?: string;
  since?: string;
}): LogEntry[] {
  if (!filter) return [...logEntries];

  return logEntries.filter((entry) => {
    if (filter.category && entry.category !== filter.category) return false;
    if (filter.level && LOG_LEVELS[entry.level] < LOG_LEVELS[filter.level])
      return false;
    if (filter.nodeId && entry.nodeId !== filter.nodeId) return false;
    if (filter.since && entry.timestamp < filter.since) return false;
    return true;
  });
}

/**
 * Clear all log entries
 */
export function clearLogs(): void {
  logEntries.length = 0;
  performanceMetrics.logEntryCount = 0;
  debugLog("GENERAL", "info", "Debug logs cleared");
}

/**
 * Export logs as JSON string
 * @param filter - Optional filter for logs to export
 * @returns JSON string of filtered logs
 */
export function exportLogs(
  filter?: Parameters<typeof getLogEntries>[0]
): string {
  const logs = getLogEntries(filter);
  return JSON.stringify(logs, null, 2);
}

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**
 * Get current performance metrics
 * @returns Performance metrics object
 */
export function getPerformanceMetrics(): PerformanceMetrics {
  return {
    ...performanceMetrics,
    callsByCategory: new Map(performanceMetrics.callsByCategory),
  };
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics(): void {
  performanceMetrics = {
    callsByCategory: new Map(),
    averageExecutionTime: 0,
    memoryUsage: 0,
    logEntryCount: logEntries.length,
    startTime: Date.now(),
  };
  executionTimes.length = 0;
  debugLog("PERFORMANCE", "info", "Performance metrics reset");
}

/**
 * Get summary of debug system usage
 * @returns Summary object with key metrics
 */
export function getDebugSummary() {
  return {
    enabled: debugOptions.enabled,
    logLevel: debugOptions.logLevel,
    totalLogs: logEntries.length,
    categoryCounts: Object.fromEntries(performanceMetrics.callsByCategory),
    averageExecutionTime: performanceMetrics.averageExecutionTime,
    memoryUsage: performanceMetrics.memoryUsage,
    uptime: Date.now() - performanceMetrics.startTime,
  };
}
