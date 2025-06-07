import React from "react";
import { z } from "zod";

// Plugin lifecycle states
export type PluginLifecycleState =
  | "unloaded"
  | "loading"
  | "loaded"
  | "active"
  | "error"
  | "disabled";

// Plugin priority levels
export type PluginPriority = "low" | "normal" | "high" | "critical";

// Plugin categories
export type PluginCategory =
  | "analytics"
  | "theme"
  | "validator"
  | "security"
  | "performance"
  | "ui"
  | "data"
  | "integration"
  | "utility";

// Base plugin metadata
export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: PluginCategory;
  priority: PluginPriority;

  // Dependencies and compatibility
  dependencies?: string[];
  conflicts?: string[];
  minimumSystemVersion?: string;
  supportedNodeTypes?: string[];

  // Plugin features
  features: string[];
  permissions?: string[];

  // Configuration
  configurable: boolean;
  configSchema?: z.ZodSchema;
  defaultConfig?: Record<string, any>;

  // UI elements
  icon?: string;
  homepage?: string;
  documentation?: string;

  // Lifecycle flags
  autoEnable?: boolean;
  canDisable?: boolean;
  requiresRestart?: boolean;
}

// Plugin execution context
export interface PluginContext {
  // Node information
  nodeId: string;
  nodeType: string;
  nodeData: Record<string, any>;

  // System context
  userId?: string;
  userPermissions?: string[];
  timestamp: number;

  // Plugin utilities
  logger: PluginLogger;
  storage: PluginStorage;
  events: PluginEventEmitter;

  // System integration
  getNodeRegistry: () => any;
  getSystemConfig: () => Record<string, any>;

  // Helper functions
  validateData: (data: any, schema: z.ZodSchema) => boolean;
  emitEvent: (eventName: string, data?: any) => void;

  // Plugin management
  getPlugin: (pluginId: string) => NodePlugin | undefined;
  getActivePlugins: () => NodePlugin[];
}

// Plugin logger interface
export interface PluginLogger {
  debug: (message: string, data?: any) => void;
  info: (message: string, data?: any) => void;
  warn: (message: string, data?: any) => void;
  error: (message: string, error?: Error, data?: any) => void;

  // Structured logging
  log: (
    level: "debug" | "info" | "warn" | "error",
    message: string,
    data?: any
  ) => void;

  // Performance logging
  startTimer: (operation: string) => () => void; // Returns a stop function
  logPerformance: (operation: string, duration: number, metadata?: any) => void;
}

// Plugin storage interface
export interface PluginStorage {
  // Scoped storage (per plugin)
  get: <T = any>(key: string) => Promise<T | null>;
  set: <T = any>(key: string, value: T) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => Promise<void>;

  // Global storage (shared between plugins)
  getGlobal: <T = any>(key: string) => Promise<T | null>;
  setGlobal: <T = any>(key: string, value: T) => Promise<void>;

  // Cache with TTL
  cache: {
    get: <T = any>(key: string) => Promise<T | null>;
    set: <T = any>(key: string, value: T, ttlSeconds?: number) => Promise<void>;
    invalidate: (key: string) => Promise<void>;
    flush: () => Promise<void>;
  };
}

// Plugin event emitter interface
export interface PluginEventEmitter {
  on: (event: string, handler: (data: any) => void) => void;
  off: (event: string, handler: (data: any) => void) => void;
  emit: (event: string, data?: any) => void;
  once: (event: string, handler: (data: any) => void) => void;

  // Typed events
  onNodeEvent: (
    nodeId: string,
    eventType: string,
    handler: (data: any) => void
  ) => void;
  onSystemEvent: (eventType: string, handler: (data: any) => void) => void;
}

// Plugin hook types for different lifecycle events
export interface PluginHooks {
  // Node lifecycle hooks
  onNodeCreate?: (context: PluginContext) => Promise<void> | void;
  onNodeUpdate?: (
    context: PluginContext,
    oldData: any,
    newData: any
  ) => Promise<void> | void;
  onNodeDelete?: (context: PluginContext) => Promise<void> | void;
  onNodeExecute?: (context: PluginContext, input?: any) => Promise<any> | any;

  // System lifecycle hooks
  onSystemStart?: () => Promise<void> | void;
  onSystemStop?: () => Promise<void> | void;
  onConfigChange?: (newConfig: any, oldConfig: any) => Promise<void> | void;

  // Validation hooks
  onValidateNode?: (context: PluginContext) => Promise<boolean> | boolean;
  onValidateData?: (
    data: any,
    schema: z.ZodSchema
  ) => Promise<boolean> | boolean;

  // UI hooks
  onRenderNode?: (context: PluginContext) => React.ComponentType | null;
  onRenderInspector?: (context: PluginContext) => React.ComponentType | null;
  onRenderToolbar?: (context: PluginContext) => React.ComponentType | null;

  // Performance hooks
  onPerformanceIssue?: (
    context: PluginContext,
    issue: PerformanceIssue
  ) => Promise<void> | void;
  onCacheEvent?: (
    eventType: "hit" | "miss" | "invalidate",
    key: string
  ) => Promise<void> | void;

  // Security hooks
  onSecurityCheck?: (
    context: PluginContext,
    action: string
  ) => Promise<boolean> | boolean;
  onPermissionCheck?: (
    context: PluginContext,
    permission: string
  ) => Promise<boolean> | boolean;
}

// Performance issue interface
export interface PerformanceIssue {
  type: "slow_execution" | "memory_leak" | "high_cpu" | "timeout";
  nodeId: string;
  nodeType: string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, any>;
  timestamp: number;
}

// Plugin error types
export interface PluginError extends Error {
  pluginId: string;
  pluginVersion: string;
  errorType:
    | "initialization"
    | "execution"
    | "validation"
    | "configuration"
    | "dependency";
  context?: PluginContext;
  recoverable: boolean;
}

// Plugin configuration UI component props
export interface PluginConfigProps {
  pluginId: string;
  config: Record<string, any>;
  schema: z.ZodSchema;
  onChange: (newConfig: Record<string, any>) => void;
  onValidate: (config: Record<string, any>) => boolean;
}

// Main NodePlugin interface
export interface NodePlugin {
  // Plugin metadata
  readonly metadata: PluginMetadata;

  // Plugin state
  state: PluginLifecycleState;
  config: Record<string, any>;

  // Core lifecycle methods
  initialize: (context: PluginContext) => Promise<void>;
  activate: () => Promise<void>;
  deactivate: () => Promise<void>;
  dispose: () => Promise<void>;

  // Hook implementations
  hooks: PluginHooks;

  // Configuration management
  getConfig: () => Record<string, any>;
  setConfig: (config: Record<string, any>) => Promise<void>;
  validateConfig: (config: Record<string, any>) => boolean;
  resetConfig: () => void;

  // Plugin utilities
  getLogger: () => PluginLogger;
  getStorage: () => PluginStorage;
  getEvents: () => PluginEventEmitter;

  // Health checks
  isHealthy: () => boolean;
  getHealthStatus: () => PluginHealthStatus;
  runHealthCheck: () => Promise<PluginHealthStatus>;

  // Development utilities
  getDebugInfo: () => Record<string, any>;
  exportState: () => Record<string, any>;
  importState: (state: Record<string, any>) => Promise<void>;

  // UI components (optional)
  ConfigComponent?: React.ComponentType<PluginConfigProps>;
  StatusComponent?: React.ComponentType<{ plugin: NodePlugin }>;
  DebugComponent?: React.ComponentType<{ plugin: NodePlugin }>;
}

// Plugin health status
export interface PluginHealthStatus {
  healthy: boolean;
  status: "excellent" | "good" | "warning" | "error" | "critical";
  issues: PluginHealthIssue[];
  metrics: {
    memoryUsage?: number;
    executionTime?: number;
    errorRate?: number;
    cacheHitRate?: number;
  };
  lastCheck: number;
}

// Plugin health issue
export interface PluginHealthIssue {
  type: "performance" | "memory" | "error" | "configuration" | "dependency";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  details?: Record<string, any>;
  suggestion?: string;
}

// Plugin installation info
export interface PluginInstallationInfo {
  pluginId: string;
  version: string;
  source: "npm" | "file" | "url" | "builtin";
  installPath: string;
  installedAt: number;
  installedBy: string;

  // Installation metadata
  checksum?: string;
  signature?: string;
  verified: boolean;

  // Update information
  updateAvailable?: boolean;
  latestVersion?: string;
  updateChannel?: "stable" | "beta" | "alpha";
}

// Plugin registry entry
export interface PluginRegistryEntry {
  metadata: PluginMetadata;
  installation: PluginInstallationInfo;
  plugin?: NodePlugin; // Lazy loaded

  // Runtime state
  enabled: boolean;
  autoStart: boolean;
  loadError?: PluginError;

  // Statistics
  stats: {
    activationCount: number;
    executionCount: number;
    errorCount: number;
    lastExecuted?: number;
    averageExecutionTime?: number;
  };
}

// Validation schema for plugin metadata
export const PluginMetadataSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9-_]*$/),
  name: z.string().min(1).max(200),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().min(10).max(1000),
  author: z.string().min(1).max(100),
  category: z.enum([
    "analytics",
    "theme",
    "validator",
    "security",
    "performance",
    "ui",
    "data",
    "integration",
    "utility",
  ]),
  priority: z.enum(["low", "normal", "high", "critical"]),

  dependencies: z.array(z.string()).optional(),
  conflicts: z.array(z.string()).optional(),
  minimumSystemVersion: z.string().optional(),
  supportedNodeTypes: z.array(z.string()).optional(),

  features: z.array(z.string()).min(1),
  permissions: z.array(z.string()).optional(),

  configurable: z.boolean(),
  defaultConfig: z.record(z.unknown()).optional(),

  icon: z.string().optional(),
  homepage: z.string().url().optional(),
  documentation: z.string().url().optional(),

  autoEnable: z.boolean().optional().default(false),
  canDisable: z.boolean().optional().default(true),
  requiresRestart: z.boolean().optional().default(false),
});

// Export utility types
export type PluginFactory = (context: PluginContext) => NodePlugin;
export type PluginLoader = (pluginPath: string) => Promise<PluginFactory>;
export type PluginValidator = (plugin: NodePlugin) => Promise<boolean>;

// Plugin system events
export const PLUGIN_SYSTEM_EVENTS = {
  PLUGIN_LOADED: "plugin:loaded",
  PLUGIN_ACTIVATED: "plugin:activated",
  PLUGIN_DEACTIVATED: "plugin:deactivated",
  PLUGIN_ERROR: "plugin:error",
  PLUGIN_CONFIG_CHANGED: "plugin:config-changed",
  PLUGIN_HEALTH_CHECK: "plugin:health-check",
  SYSTEM_STARTED: "system:started",
  SYSTEM_STOPPED: "system:stopped",
} as const;
