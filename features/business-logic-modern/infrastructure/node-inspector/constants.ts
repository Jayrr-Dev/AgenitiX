/**
 * NODE INSPECTOR CONSTANTS V2U - Enhanced configuration for V2U system integration
 *
 * 🎯 V2U UPGRADE: Complete configuration for defineNode() system integration
 * • Enhanced registry integration with V2U defineNode() metadata
 * • Lifecycle monitoring configuration and thresholds
 * • Security monitoring and violation tracking constants
 * • Performance monitoring thresholds and optimization settings
 * • Event system configuration for real-time updates
 * • Plugin architecture support configuration
 * • Advanced error categorization and recovery settings
 *
 * Keywords: v2u-constants, defineNode, lifecycle, security, performance, events, plugins
 */

// ============================================================================
// ENHANCED REGISTRY INTEGRATION
// ============================================================================

// Import from enhanced registry instead of maintaining duplicate configuration
export { getNodeTypeConfig } from "@/features/business-logic-modern/infrastructure/flow-engine/constants";

// ============================================================================
// V2U SYSTEM CONFIGURATION
// ============================================================================

/**
 * V2U Inspector Configuration - Core system settings
 */
export const V2U_INSPECTOR_CONFIG = {
  // Inspector behavior
  DEFAULT_REFRESH_INTERVAL: 5000, // 5 seconds
  MAX_EVENT_HISTORY: 100,
  MAX_ERROR_HISTORY: 50,
  AUTO_REFRESH_ON_CHANGES: true,

  // Debug mode settings
  DEBUG_MODE_STORAGE_KEY: "v2u-inspector-debug-mode",
  SHOW_INTERNAL_EVENTS: false,
  SHOW_SYSTEM_METRICS: true,

  // UI behavior
  COLLAPSE_EMPTY_SECTIONS: true,
  HIGHLIGHT_PERFORMANCE_ISSUES: true,
  HIGHLIGHT_SECURITY_VIOLATIONS: true,

  // Data retention
  METRICS_RETENTION_MINUTES: 60,
  EVENT_RETENTION_MINUTES: 30,
  ERROR_RETENTION_MINUTES: 120,
} as const;

/**
 * V2U Lifecycle Monitoring Configuration
 */
export const V2U_LIFECYCLE_CONFIG = {
  // Monitoring thresholds
  SLOW_MOUNT_THRESHOLD_MS: 100,
  SLOW_UNMOUNT_THRESHOLD_MS: 50,
  SLOW_DATA_CHANGE_THRESHOLD_MS: 10,
  SLOW_VALIDATION_THRESHOLD_MS: 5,

  // Hook execution limits
  MAX_MOUNT_DURATION_MS: 5000,
  MAX_UNMOUNT_DURATION_MS: 2000,
  MAX_DATA_CHANGE_DURATION_MS: 1000,
  MAX_VALIDATION_DURATION_MS: 500,

  // Error recovery
  RETRY_FAILED_HOOKS: true,
  MAX_HOOK_RETRIES: 3,
  HOOK_RETRY_DELAY_MS: 1000,

  // Logging
  LOG_ALL_HOOK_EXECUTIONS: false,
  LOG_SLOW_HOOKS: true,
  LOG_FAILED_HOOKS: true,
} as const;

/**
 * V2U Security Monitoring Configuration
 */
export const V2U_SECURITY_CONFIG = {
  // Rate limiting thresholds
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_WARNING_THRESHOLD: 0.8, // 80% of limit
  RATE_LIMIT_CRITICAL_THRESHOLD: 0.95, // 95% of limit

  // Security violation thresholds
  MAX_AUTH_FAILURES_PER_HOUR: 10,
  MAX_PERMISSION_VIOLATIONS_PER_HOUR: 5,
  SECURITY_COOLDOWN_PERIOD_MS: 300000, // 5 minutes

  // Access level permissions
  ACCESS_LEVELS: {
    read: ["node:read", "data:read"],
    write: ["node:read", "node:write", "data:read", "data:write"],
    admin: ["node:*", "data:*", "system:admin"],
  },

  // Security event types
  SECURITY_EVENT_TYPES: {
    AUTH_FAILURE: "auth_failure",
    PERMISSION_DENIED: "permission_denied",
    RATE_LIMIT: "rate_limit",
    DATA_ACCESS: "data_access",
  },

  // Security styling
  SECURITY_SEVERITY_COLORS: {
    low: "text-yellow-600 bg-yellow-50 border-yellow-200",
    medium: "text-orange-600 bg-orange-50 border-orange-200",
    high: "text-red-600 bg-red-50 border-red-200",
    critical: "text-red-800 bg-red-100 border-red-300",
  },
} as const;

/**
 * V2U Performance Monitoring Configuration
 */
export const V2U_PERFORMANCE_CONFIG = {
  // Performance thresholds
  SLOW_EXECUTION_THRESHOLD_MS: 100,
  VERY_SLOW_EXECUTION_THRESHOLD_MS: 1000,
  MEMORY_WARNING_THRESHOLD_MB: 50,
  MEMORY_CRITICAL_THRESHOLD_MB: 100,

  // Cache performance
  CACHE_HIT_RATE_WARNING: 0.7, // Below 70%
  CACHE_HIT_RATE_CRITICAL: 0.5, // Below 50%

  // Retry behavior
  MAX_PERFORMANCE_RETRIES: 3,
  RETRY_BACKOFF_MULTIPLIER: 2,
  BASE_RETRY_DELAY_MS: 100,

  // Memory monitoring
  MEMORY_CHECK_INTERVAL_MS: 10000, // 10 seconds
  GARBAGE_COLLECTION_THRESHOLD: 0.8, // 80% memory usage

  // Performance event types
  PERFORMANCE_EVENT_TYPES: {
    TIMEOUT: "timeout",
    MEMORY_LIMIT: "memory_limit",
    SLOW_EXECUTION: "slow_execution",
    CACHE_MISS: "cache_miss",
    RETRY_EXHAUSTED: "retry_exhausted",
  },

  // Performance styling
  PERFORMANCE_SEVERITY_COLORS: {
    good: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    poor: "text-orange-600 bg-orange-50 border-orange-200",
    critical: "text-red-600 bg-red-50 border-red-200",
  },
} as const;

/**
 * V2U Event System Configuration
 */
export const V2U_EVENT_CONFIG = {
  // Event monitoring
  TRACK_ALL_EVENTS: false,
  TRACK_SYSTEM_EVENTS: true,
  TRACK_USER_EVENTS: true,
  TRACK_ERROR_EVENTS: true,

  // Event filtering
  IGNORED_EVENT_TYPES: ["internal:heartbeat", "internal:gc", "debug:trace"],

  // Event batching
  EVENT_BATCH_SIZE: 10,
  EVENT_BATCH_TIMEOUT_MS: 1000,

  // Real-time updates
  REAL_TIME_UPDATES: true,
  UPDATE_DEBOUNCE_MS: 100,

  // Event history
  MAX_EVENTS_PER_NODE: 50,
  EVENT_CLEANUP_INTERVAL_MS: 30000, // 30 seconds

  // Event categories
  EVENT_CATEGORIES: {
    LIFECYCLE: "lifecycle",
    SECURITY: "security",
    PERFORMANCE: "performance",
    USER: "user",
    SYSTEM: "system",
    ERROR: "error",
  },
} as const;

/**
 * V2U Plugin System Configuration
 */
export const V2U_PLUGIN_CONFIG = {
  // Plugin loading
  AUTO_LOAD_PLUGINS: true,
  PLUGIN_LOAD_TIMEOUT_MS: 5000,
  PLUGIN_RETRY_ATTEMPTS: 2,

  // Plugin monitoring
  TRACK_PLUGIN_EVENTS: true,
  TRACK_PLUGIN_PERFORMANCE: true,
  PLUGIN_HEALTH_CHECK_INTERVAL_MS: 30000, // 30 seconds

  // Plugin lifecycle
  PLUGIN_INIT_TIMEOUT_MS: 3000,
  PLUGIN_CLEANUP_TIMEOUT_MS: 2000,

  // Plugin status
  PLUGIN_STATUS_TYPES: {
    ACTIVE: "active",
    INACTIVE: "inactive",
    ERROR: "error",
    LOADING: "loading",
    DISABLED: "disabled",
  },

  // Built-in plugins
  CORE_PLUGINS: [
    "analytics",
    "validation",
    "performance",
    "security",
    "debugging",
  ],
} as const;

// ============================================================================
// NODE INSPECTOR SPECIFIC CONSTANTS (ENHANCED)
// ============================================================================

export const DEFAULT_VALUES = {
  DURATION: "500",
  COUNT: "0",
  MULTIPLIER: "1",
  DELAY: "1000",
  COUNT_SPEED: 1000,
  CYCLE_DURATION: 2000,
  PULSE_DURATION: 500,
  ON_DURATION: 4000,
  OFF_DURATION: 4000,
  TOTAL_CYCLES: 1,

  // V2U Enhanced defaults
  V2U_REFRESH_INTERVAL: 5000,
  V2U_TAB_INDEX: 0,
  V2U_DEBUG_MODE: false,
  V2U_METRICS_EXPANDED: false,
} as const;

export const VALIDATION = {
  MIN_DURATION: 50,
  MIN_DELAY: 0,
  MIN_CYCLES: 1,
  MAX_CYCLES: 1000,
  MIN_COUNT_SPEED: 100,

  // V2U Enhanced validation
  MIN_TIMEOUT: 100,
  MAX_TIMEOUT: 300000,
  MIN_MEMORY_MB: 1,
  MAX_MEMORY_MB: 1000,
  MIN_RETRY_ATTEMPTS: 0,
  MAX_RETRY_ATTEMPTS: 10,
} as const;

// Default durations for various node operations (in milliseconds)
export const DEFAULT_DURATIONS = {
  DELAY: 1000,
  TIMEOUT: 5000,
  ANIMATION: 300,
  DEBOUNCE: 500,

  // V2U Enhanced durations
  V2U_STATE_REFRESH: 5000,
  V2U_METRICS_UPDATE: 1000,
  V2U_EVENT_DEBOUNCE: 100,
  V2U_PLUGIN_TIMEOUT: 3000,
} as const;

// Error type configurations (Enhanced)
export const ERROR_TYPES = {
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
  SECURITY: "security",
  PERFORMANCE: "performance",
  LIFECYCLE: "lifecycle",
} as const;

// Error severity levels for styling and prioritization (Enhanced)
export const ERROR_SEVERITY = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
} as const;

// Enhanced error categories
export const ERROR_CATEGORIES = {
  SYSTEM: "system",
  USER: "user",
  NETWORK: "network",
  VALIDATION: "validation",
  SECURITY: "security",
  PERFORMANCE: "performance",
  LIFECYCLE: "lifecycle",
  PLUGIN: "plugin",
} as const;

// Input validation constants (Enhanced)
export const VALIDATION_RULES = {
  MAX_INPUT_LENGTH: 1000,
  MIN_DELAY: 0,
  MAX_DELAY: 60000,
  MIN_COUNT: 1,
  MAX_COUNT: 100,

  // V2U Enhanced validation rules
  MAX_NODE_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_ERROR_MESSAGE_LENGTH: 500,
  MAX_EVENT_DATA_SIZE: 1024, // bytes
  MIN_REFRESH_INTERVAL: 1000,
  MAX_REFRESH_INTERVAL: 60000,
} as const;

// ============================================================================
// V2U UI CONFIGURATION
// ============================================================================

/**
 * V2U Inspector UI Configuration
 */
export const V2U_UI_CONFIG = {
  // Tab configuration
  TABS: [
    { id: "overview", label: "Overview", icon: "📋" },
    { id: "lifecycle", label: "Lifecycle", icon: "🔄" },
    { id: "security", label: "Security", icon: "🔒" },
    { id: "performance", label: "Performance", icon: "⚡" },
    { id: "events", label: "Events", icon: "📡" },
    { id: "plugins", label: "Plugins", icon: "🧩" },
    { id: "debug", label: "Debug", icon: "🐛" },
  ],

  // Color schemes
  STATUS_COLORS: {
    healthy: "text-green-600 bg-green-50 border-green-200",
    warning: "text-yellow-600 bg-yellow-50 border-yellow-200",
    error: "text-red-600 bg-red-50 border-red-200",
    critical: "text-red-800 bg-red-100 border-red-300",
    unknown: "text-gray-600 bg-gray-50 border-gray-200",
  },

  // Animation settings
  ANIMATION_DURATION_MS: 200,
  FADE_DURATION_MS: 150,
  SLIDE_DURATION_MS: 300,

  // Layout settings
  SIDEBAR_WIDTH: 320,
  TAB_HEIGHT: 40,
  SECTION_PADDING: 16,

  // Icons and indicators
  ICONS: {
    V2U_NODE: "🚀",
    LEGACY_NODE: "📄",
    SECURITY_VIOLATION: "🚨",
    PERFORMANCE_ISSUE: "⚠️",
    LIFECYCLE_EVENT: "🔄",
    PLUGIN_ACTIVE: "✅",
    PLUGIN_INACTIVE: "❌",
    DEBUG_MODE: "🐛",
    LOADING: "⏳",
    SUCCESS: "✅",
    ERROR: "❌",
    WARNING: "⚠️",
    INFO: "ℹ️",
  },
} as const;

// ============================================================================
// BACKWARDS COMPATIBILITY
// ============================================================================

// Ensure backwards compatibility with existing code
export const LEGACY_CONSTANTS = {
  DEFAULT_VALUES,
  VALIDATION,
  DEFAULT_DURATIONS,
  ERROR_TYPES,
  ERROR_SEVERITY,
  VALIDATION_RULES,
} as const;
