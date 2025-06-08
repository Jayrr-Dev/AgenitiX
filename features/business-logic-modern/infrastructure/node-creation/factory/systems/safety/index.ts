/**
 * SAFETY SYSTEM - Enterprise-grade error handling and validation
 *
 * • Exports error boundaries and validation utilities
 * • Provides comprehensive configuration validation
 * • Implements bulletproof error isolation and recovery
 * • Features immutable configuration management
 * • Advanced debugging and performance monitoring
 *
 * Keywords: safety, error-handling, validation, isolation, enterprise, debugging
 */

// Enhanced Error Boundary System
export {
  createErrorBoundary,
  getErrorMetrics,
  getNodeErrorCount,
  NodeErrorBoundary,
  resetErrorMetrics,
} from "./ErrorBoundary";

export type {
  ErrorBoundaryProps,
  ErrorBoundaryState,
  ErrorMetrics,
  VibeErrorInjection,
} from "./ErrorBoundary";

// Enhanced Debug System
export {
  clearLogs,
  configureDebug,
  createPerformanceTimer,
  debug,
  debugError,
  debugFactory,
  debugLifecycle,
  debugLog,
  debugNetwork,
  debugPerformance,
  debugState,
  disableDebug,
  enableDebug,
  enableDebugCategories,
  exportLogs,
  getDebugConfig,
  getDebugSummary,
  getLogEntries,
  getPerformanceMetrics,
  measureMemoryUsage,
  resetPerformanceMetrics,
} from "./DebugSystem";

export type {
  DebugCategory,
  DebugOptions,
  LogEntry,
  LogLevel,
  PerformanceMetrics,
} from "./DebugSystem";

// Legacy Validation Layer (kept for backward compatibility)
export {
  createValidationReport,
  validateConfigurations,
  validateHandles,
  validateNodeIntegrity,
  validateNodeSize,
} from "./ValidationLayer";

// Note: freezeConfig and validateNodeConfig moved to config/validation
