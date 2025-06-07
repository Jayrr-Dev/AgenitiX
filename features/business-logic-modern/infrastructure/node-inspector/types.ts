/**
 * NODE INSPECTOR TYPES - Type definitions for node inspection and editing
 *
 * • Defines interfaces for node inspector components and their props
 * • Provides type safety for error handling and logging functionality
 * • Includes base control types for extensible node property editors
 * • Defines inspector state and editing control interfaces
 * • Centralizes all node inspector type definitions for consistency
 *
 * Keywords: types, interfaces, node-inspector, props, errors, controls, state
 */

import type {
  AgenEdge,
  AgenNode,
} from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

/**
 * NODE INSPECTOR TYPES V2U - Enhanced type definitions for V2U system integration
 *
 * 🎯 V2U UPGRADE: Complete integration with defineNode() system
 * • Enhanced node inspector with V2U defineNode() metadata support
 * • Lifecycle hooks monitoring and debugging capabilities
 * • Security and performance metrics tracking
 * • Event system integration for real-time monitoring
 * • Plugin architecture support and debugging
 * • Advanced error handling with categorization and recovery
 *
 * Keywords: v2u-inspector, defineNode, lifecycle, security, performance, events, plugins
 */

// ============================================================================
// V2U DEFINENODE INTEGRATION TYPES
// ============================================================================

/**
 * V2U Node Metadata - Enhanced metadata from defineNode() system
 */
export interface V2UNodeMetadata {
  nodeType: string;
  category: string;
  displayName: string;
  description?: string;
  icon?: string;
  folder?: string;
  version?: string;
  author?: string;
  tags?: string[];
  experimental?: boolean;
  // V2U system metadata
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
  _v2uVersion?: string;
  registryPath?: string;
}

/**
 * V2U Lifecycle State - Track lifecycle hook execution
 */
export interface V2ULifecycleState {
  onMount?: {
    executed: boolean;
    timestamp?: number;
    duration?: number;
    error?: string;
  };
  onUnmount?: {
    executed: boolean;
    timestamp?: number;
    duration?: number;
    error?: string;
  };
  onDataChange?: {
    lastExecuted?: number;
    executionCount: number;
    averageDuration?: number;
    lastError?: string;
  };
  onValidation?: {
    lastExecuted?: number;
    lastResult?: boolean | string;
    executionCount: number;
  };
  onError?: {
    lastExecuted?: number;
    executionCount: number;
    lastRecovery?: boolean;
  };
}

/**
 * V2U Security State - Track security metrics and violations
 */
export interface V2USecurityState {
  requiresAuth: boolean;
  permissions: string[];
  dataAccessLevel: "read" | "write" | "admin";
  maxExecutionsPerMinute: number;
  currentExecutions: number;
  rateLimitViolations: number;
  authFailures: number;
  permissionViolations: number;
  lastSecurityEvent?: {
    type: "auth_failure" | "permission_denied" | "rate_limit" | "data_access";
    timestamp: number;
    details?: string;
  };
}

/**
 * V2U Performance State - Track performance metrics and bottlenecks
 */
export interface V2UPerformanceState {
  timeout: number;
  maxMemoryMB: number;
  priority: "low" | "normal" | "high";
  retryAttempts: number;
  retryDelay: number;
  cacheable: boolean;

  // Runtime metrics
  executionCount: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  memoryUsage: number;
  cacheHitRate?: number;
  timeoutViolations: number;
  memoryViolations: number;
  retryCount: number;

  // Performance events
  lastPerformanceEvent?: {
    type: "timeout" | "memory_limit" | "slow_execution" | "cache_miss";
    timestamp: number;
    value?: number;
    threshold?: number;
  };
}

/**
 * V2U Event State - Track event system integration
 */
export interface V2UEventState {
  eventsEmitted: number;
  eventsReceived: number;
  lastEvent?: {
    type: string;
    timestamp: number;
    data?: any;
  };
  eventHistory: Array<{
    type: string;
    timestamp: number;
    direction: "emit" | "receive";
    data?: any;
  }>;
}

/**
 * V2U Plugin State - Track plugin integration and status
 */
export interface V2UPluginState {
  enabledPlugins: string[];
  pluginStatus: Record<
    string,
    {
      active: boolean;
      version?: string;
      lastError?: string;
      initTimestamp?: number;
    }
  >;
  pluginEvents: Array<{
    plugin: string;
    event: string;
    timestamp: number;
    data?: any;
  }>;
}

/**
 * Complete V2U Node State - Aggregated V2U system state
 */
export interface V2UNodeState {
  metadata: V2UNodeMetadata;
  lifecycle: V2ULifecycleState;
  security: V2USecurityState;
  performance: V2UPerformanceState;
  events: V2UEventState;
  plugins: V2UPluginState;

  // System status
  isV2UNode: boolean;
  registryStatus: "registered" | "unregistered" | "error";
  systemHealth: "healthy" | "warning" | "error" | "critical";
  lastSystemCheck: number;
}

// ============================================================================
// ENHANCED NODE INSPECTOR TYPES
// ============================================================================

export interface NodeInspectorProps {
  /** The currently selected node (or null if none) */
  node: AgenNode | null;
  /** The currently selected edge (or null if none) */
  selectedEdge: AgenEdge | null;
  /** All nodes in the flow (needed for edge source/target info) */
  allNodes: AgenNode[];
  /** Helper that mutates node.data; same fn you already have in FlowEditor */
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  /** Computed output string (optional) */
  output: string | null;
  /** Array of errors for the current node */
  errors: NodeError[];
  /** Function to clear errors for the current node */
  onClearErrors?: () => void;
  /** Function to log new errors */
  onLogError: (
    nodeId: string,
    message: string,
    type?: ErrorType,
    source?: string
  ) => void;
  /** Function to update node ID (optional) */
  onUpdateNodeId?: (oldId: string, newId: string) => void;
  /** Function to delete the current node (optional) */
  onDeleteNode?: (nodeId: string) => void;
  /** Function to duplicate the current node (optional) */
  onDuplicateNode?: (nodeId: string) => void;
  /** Function to delete the current edge (optional) */
  onDeleteEdge?: (edgeId: string) => void;
  /** Whether the inspector is locked */
  inspectorLocked: boolean;
  /** Function to set the inspector lock state */
  setInspectorLocked: (locked: boolean) => void;

  // V2U ENHANCED PROPS
  /** V2U system state for the selected node */
  v2uState?: V2UNodeState;
  /** Function to refresh V2U state */
  onRefreshV2UState?: (nodeId: string) => Promise<V2UNodeState>;
  /** V2U debug mode flag */
  v2uDebugMode?: boolean;
  /** Function to toggle V2U debug mode */
  setV2UDebugMode?: (enabled: boolean) => void;
}

// ============================================================================
// ENHANCED ERROR TYPES
// ============================================================================

export interface NodeError {
  timestamp: number;
  message: string;
  type: ErrorType;
  source?: string;
  // V2U Enhanced error properties
  category?:
    | "system"
    | "user"
    | "network"
    | "validation"
    | "security"
    | "performance";
  severity?: "low" | "medium" | "high" | "critical";
  recoverable?: boolean;
  nodeId?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

export type ErrorType =
  | "error"
  | "warning"
  | "info"
  | "security"
  | "performance"
  | "lifecycle";

// ============================================================================
// V2U INSPECTOR COMPONENT TYPES
// ============================================================================

export interface V2UInspectorTabProps {
  node: AgenNode;
  v2uState: V2UNodeState;
  onRefresh: () => Promise<void>;
  debugMode: boolean;
}

export interface V2ULifecycleInspectorProps extends V2UInspectorTabProps {
  onTriggerLifecycle?: (hook: keyof V2ULifecycleState) => Promise<void>;
}

export interface V2USecurityInspectorProps extends V2UInspectorTabProps {
  onSecurityAction?: (
    action: "reset_rate_limit" | "clear_violations"
  ) => Promise<void>;
}

export interface V2UPerformanceInspectorProps extends V2UInspectorTabProps {
  onPerformanceAction?: (action: "clear_metrics" | "force_gc") => Promise<void>;
}

export interface V2UEventInspectorProps extends V2UInspectorTabProps {
  onEventAction?: (
    action: "clear_history" | "emit_test_event"
  ) => Promise<void>;
}

export interface V2UPluginInspectorProps extends V2UInspectorTabProps {
  onPluginAction?: (
    plugin: string,
    action: "enable" | "disable" | "reload"
  ) => Promise<void>;
}

// ============================================================================
// EXISTING TYPES (ENHANCED)
// ============================================================================

export interface BaseControlProps {
  node: AgenNode;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  // V2U Enhanced props
  v2uState?: V2UNodeState;
  debugMode?: boolean;
}

export interface JsonHighlighterProps {
  data: unknown;
  className?: string;
  // V2U Enhanced props
  showV2UMetadata?: boolean;
  highlightV2UFields?: boolean;
}

export interface NodeControlsProps extends BaseControlProps {
  onLogError: (
    nodeId: string,
    message: string,
    type?: ErrorType,
    source?: string
  ) => void;
  // V2U Enhanced props
  v2uState?: V2UNodeState;
  onV2UAction?: (action: string, data?: any) => Promise<void>;
}

export interface InspectorState {
  durationInput: string;
  countInput: string;
  multiplierInput: string;
  delayInput: string;
  // V2U Enhanced state
  v2uTabIndex: number;
  v2uDebugExpanded: boolean;
  v2uMetricsExpanded: boolean;
}

export interface EditingRefs {
  isEditingCount: boolean;
  isEditingMultiplier: boolean;
  // V2U Enhanced editing states
  isEditingV2UConfig: boolean;
  isEditingV2UMetadata: boolean;
}

// Node type mappings for better type safety
export type NodeType = AgenNode["type"];

export interface NodeTypeConfig {
  hasOutput: boolean;
  hasControls: boolean;
  displayName: string;
  // V2U Enhanced config
  isV2UNode?: boolean;
  v2uVersion?: string;
  supportsLifecycle?: boolean;
  supportsSecurity?: boolean;
  supportsPerformance?: boolean;
  supportsPlugins?: boolean;
}

// ============================================================================
// V2U SYSTEM INTEGRATION TYPES
// ============================================================================

/**
 * V2U System Hook Integration
 */
export interface V2USystemHooks {
  onNodeSelect?: (nodeId: string, node: AgenNode) => void;
  onNodeUpdate?: (nodeId: string, oldData: any, newData: any) => void;
  onV2UStateChange?: (nodeId: string, state: V2UNodeState) => void;
  onSecurityViolation?: (nodeId: string, violation: any) => void;
  onPerformanceIssue?: (nodeId: string, issue: any) => void;
  onLifecycleEvent?: (nodeId: string, hook: string, result: any) => void;
}

/**
 * V2U Inspector Configuration
 */
export interface V2UInspectorConfig {
  enableLifecycleMonitoring: boolean;
  enableSecurityMonitoring: boolean;
  enablePerformanceMonitoring: boolean;
  enableEventMonitoring: boolean;
  enablePluginMonitoring: boolean;
  debugMode: boolean;
  refreshInterval: number;
  maxEventHistory: number;
  maxErrorHistory: number;
}
