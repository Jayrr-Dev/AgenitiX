/**
 * ENHANCED NODESPEC - Mini Programmable Computer Architecture
 *
 * • Each node is a fully independent programmable computer
 * • Complete execution environment with memory, CPU, and I/O
 * • Event-driven programming model with lifecycle hooks
 * • Built-in scheduling and task management
 * • Inter-node communication protocols
 * • Resource management and monitoring
 *
 * Keywords: programmable-computer, execution-environment, event-driven, scheduling
 */

import type { NodeCategory } from "@/features/business-logic-modern/infrastructure/theming/categories";
import type {
  COLLAPSED_SIZES,
  EXPANDED_SIZES,
} from "@/features/business-logic-modern/infrastructure/theming/sizing";
import type { z } from "zod";
import type { NodeMemoryConfig } from "./NodeMemory";

/**
 * CPU Configuration for node execution
 */
export interface NodeCPUConfig {
  /** Maximum execution time per operation (ms) */
  maxExecutionTime?: number;
  /** CPU priority (1-10, higher = more priority) */
  priority?: number;
  /** Enable parallel execution */
  parallelExecution?: boolean;
  /** Maximum concurrent operations */
  maxConcurrency?: number;
  /** Enable execution profiling */
  profiling?: boolean;
}

/**
 * I/O Configuration for node communication
 */
export interface NodeIOConfig {
  /** Maximum input buffer size */
  maxInputBuffer?: number;
  /** Maximum output buffer size */
  maxOutputBuffer?: number;
  /** Enable input validation */
  validateInputs?: boolean;
  /** Enable output transformation */
  transformOutputs?: boolean;
  /** Communication protocols */
  protocols?: ('http' | 'websocket' | 'grpc' | 'custom')[];
}

/**
 * Scheduling configuration for node operations
 */
export interface NodeSchedulerConfig {
  /** Enable built-in scheduler */
  enabled?: boolean;
  /** Default interval for periodic tasks (ms) */
  defaultInterval?: number;
  /** Maximum scheduled tasks */
  maxTasks?: number;
  /** Enable cron-like scheduling */
  cronSupport?: boolean;
  /** Timezone for scheduling */
  timezone?: string;
}

/**
 * Event system configuration
 */
export interface NodeEventConfig {
  /** Enable event system */
  enabled?: boolean;
  /** Maximum event listeners */
  maxListeners?: number;
  /** Event buffer size */
  eventBufferSize?: number;
  /** Enable event persistence */
  persistEvents?: boolean;
  /** Custom event types */
  customEvents?: string[];
}

/**
 * Security configuration for node execution
 */
export interface NodeSecurityConfig {
  /** Enable sandbox mode */
  sandbox?: boolean;
  /** Allowed APIs */
  allowedAPIs?: string[];
  /** Blocked APIs */
  blockedAPIs?: string[];
  /** Enable resource limits */
  resourceLimits?: boolean;
  /** Enable audit logging */
  auditLogging?: boolean;
}

/**
 * Monitoring and observability configuration
 */
export interface NodeObservabilityConfig {
  /** Enable metrics collection */
  metrics?: boolean;
  /** Enable distributed tracing */
  tracing?: boolean;
  /** Enable logging */
  logging?: boolean;
  /** Log level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  /** Custom metrics */
  customMetrics?: string[];
}

/**
 * Lifecycle hooks for node execution
 */
export interface NodeLifecycleHooks {
  /** Called when node is created */
  onCreate?: string;
  /** Called when node is initialized */
  onInit?: string;
  /** Called before execution */
  onBeforeExecute?: string;
  /** Called after execution */
  onAfterExecute?: string;
  /** Called on error */
  onError?: string;
  /** Called when node is destroyed */
  onDestroy?: string;
  /** Called on data change */
  onDataChange?: string;
  /** Called on connection change */
  onConnectionChange?: string;
}

/**
 * Inter-node communication configuration
 */
export interface NodeCommunicationConfig {
  /** Enable inter-node messaging */
  messaging?: boolean;
  /** Message queue size */
  messageQueueSize?: number;
  /** Enable broadcast messaging */
  broadcast?: boolean;
  /** Enable direct messaging */
  directMessaging?: boolean;
  /** Communication channels */
  channels?: string[];
}

/**
 * Plugin system configuration
 */
export interface NodePluginConfig {
  /** Enable plugin system */
  enabled?: boolean;
  /** Allowed plugins */
  allowedPlugins?: string[];
  /** Plugin configuration */
  pluginConfig?: Record<string, any>;
  /** Enable hot-swapping */
  hotSwap?: boolean;
}

/**
 * Enhanced NodeSpec - Complete Mini Computer Architecture
 */
export interface EnhancedNodeSpec {
  /**
   * BASIC IDENTIFICATION
   */
  kind: string;
  displayName: string;
  category: NodeCategory;
  version?: number;

  /**
   * VISUAL CONFIGURATION
   */
  size: {
    expanded: (typeof EXPANDED_SIZES)[keyof typeof EXPANDED_SIZES];
    collapsed: (typeof COLLAPSED_SIZES)[keyof typeof COLLAPSED_SIZES];
  };
  handles: NodeHandleSpec[];
  inspector: { key: string };

  /**
   * DATA MANAGEMENT
   */
  initialData: Record<string, any>;
  dataSchema?: z.ZodSchema<any>;
  controls?: ControlsConfig;

  /**
   * MINI COMPUTER ARCHITECTURE
   */
  
  /** Memory subsystem - RAM for the mini computer */
  memory?: NodeMemoryConfig;
  
  /** CPU subsystem - Processing unit configuration */
  cpu?: NodeCPUConfig;
  
  /** I/O subsystem - Input/output management */
  io?: NodeIOConfig;
  
  /** Scheduler subsystem - Task scheduling and timing */
  scheduler?: NodeSchedulerConfig;
  
  /** Event subsystem - Event-driven programming */
  events?: NodeEventConfig;
  
  /** Security subsystem - Sandboxing and permissions */
  security?: NodeSecurityConfig;
  
  /** Observability subsystem - Monitoring and debugging */
  observability?: NodeObservabilityConfig;
  
  /** Communication subsystem - Inter-node messaging */
  communication?: NodeCommunicationConfig;
  
  /** Plugin subsystem - Extensibility */
  plugins?: NodePluginConfig;

  /**
   * EXECUTION ENVIRONMENT
   */
  
  /** Runtime executor mapping */
  runtime?: {
    /** Main execution handler */
    execute?: string;
    /** Initialization handler */
    init?: string;
    /** Cleanup handler */
    cleanup?: string;
    /** Error handler */
    error?: string;
  };
  
  /** Lifecycle hooks */
  lifecycle?: NodeLifecycleHooks;
  
  /** Environment variables */
  environment?: Record<string, string>;
  
  /** Dependencies */
  dependencies?: string[];
  
  /** Capabilities */
  capabilities?: string[];
}

/**
 * Node execution context - Runtime environment for mini computer
 */
export interface NodeExecutionContext {
  /** Node instance ID */
  nodeId: string;
  
  /** Flow context */
  flowId: string;
  
  /** User context */
  userId: string;
  
  /** Memory manager */
  memory: any; // NodeMemoryManager
  
  /** CPU scheduler */
  scheduler: any; // NodeScheduler
  
  /** Event emitter */
  events: any; // NodeEventEmitter
  
  /** I/O manager */
  io: any; // NodeIOManager
  
  /** Logger */
  logger: any; // NodeLogger
  
  /** Metrics collector */
  metrics: any; // NodeMetrics
  
  /** Communication channel */
  comm: any; // NodeCommunication
  
  /** Plugin manager */
  plugins: any; // NodePluginManager
  
  /** Security context */
  security: any; // NodeSecurity
  
  /** Global state access */
  global: any; // GlobalState
  
  /** Utilities */
  utils: {
    fetch: typeof fetch;
    setTimeout: typeof setTimeout;
    setInterval: typeof setInterval;
    crypto: typeof crypto;
    [key: string]: any;
  };
}

/**
 * Node computer interface - Main API for mini computer
 */
export interface NodeComputer {
  /** Node specification */
  spec: EnhancedNodeSpec;
  
  /** Execution context */
  context: NodeExecutionContext;
  
  /** Current state */
  state: 'idle' | 'running' | 'paused' | 'error' | 'destroyed';
  
  /** Performance metrics */
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    ioOperations: number;
    uptime: number;
    executionCount: number;
    errorCount: number;
  };
  
  /** Control methods */
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  restart(): Promise<void>;
  destroy(): Promise<void>;
  
  /** Execution methods */
  execute(inputs?: any): Promise<any>;
  schedule(task: string, interval: number): string;
  unschedule(taskId: string): boolean;
  
  /** Communication methods */
  send(nodeId: string, message: any): Promise<void>;
  broadcast(message: any): Promise<void>;
  subscribe(event: string, handler: Function): string;
  unsubscribe(subscriptionId: string): boolean;
  
  /** Memory methods */
  store(key: string, value: any, ttl?: number): Promise<boolean>;
  retrieve(key: string): Promise<any>;
  compute(key: string, fn: Function, ttl?: number): Promise<any>;
  
  /** Utility methods */
  log(level: string, message: string, data?: any): void;
  emit(event: string, data?: any): void;
  getMetrics(): any;
  getHealth(): { status: string; issues: string[] };
}

/**
 * Factory function to create a mini computer from NodeSpec
 */
export function createNodeComputer(
  spec: EnhancedNodeSpec,
  nodeId: string,
  context: Partial<NodeExecutionContext>
): NodeComputer {
  // Implementation would create a full mini computer instance
  // This is a conceptual interface showing the capabilities
  throw new Error('Implementation needed');
}

/**
 * Example enhanced node specification
 */
export const ExampleEnhancedNodeSpec: EnhancedNodeSpec = {
  // Basic identification
  kind: "aiEmailProcessor",
  displayName: "AI Email Processor",
  category: "CREATE" as NodeCategory,
  version: 1,
  
  // Visual configuration
  size: {
    expanded: { width: 300, height: 400 },
    collapsed: { width: 120, height: 60 }
  },
  handles: [
    { id: "email-input", position: "left", type: "target" },
    { id: "processed-output", position: "right", type: "source" }
  ],
  inspector: { key: "AIEmailProcessorInspector" },
  
  // Data management
  initialData: { model: "gpt-4", temperature: 0.7 },
  dataSchema: z.object({
    model: z.string().default("gpt-4"),
    temperature: z.number().min(0).max(2).default(0.7)
  }),
  
  // Mini computer architecture
  memory: {
    maxSize: 50 * 1024 * 1024, // 50MB
    evictionPolicy: 'LRU',
    persistent: true
  },
  
  cpu: {
    maxExecutionTime: 30000, // 30 seconds
    priority: 5,
    parallelExecution: true,
    maxConcurrency: 3,
    profiling: true
  },
  
  io: {
    maxInputBuffer: 1024 * 1024, // 1MB
    maxOutputBuffer: 1024 * 1024,
    validateInputs: true,
    protocols: ['http', 'websocket']
  },
  
  scheduler: {
    enabled: true,
    defaultInterval: 60000, // 1 minute
    maxTasks: 10,
    cronSupport: true
  },
  
  events: {
    enabled: true,
    maxListeners: 50,
    eventBufferSize: 1000,
    persistEvents: true,
    customEvents: ['email-processed', 'ai-response', 'error']
  },
  
  security: {
    sandbox: true,
    allowedAPIs: ['fetch', 'crypto'],
    resourceLimits: true,
    auditLogging: true
  },
  
  observability: {
    metrics: true,
    tracing: true,
    logging: true,
    logLevel: 'info',
    customMetrics: ['ai-tokens-used', 'processing-time']
  },
  
  communication: {
    messaging: true,
    messageQueueSize: 100,
    broadcast: true,
    channels: ['ai-updates', 'email-status']
  },
  
  plugins: {
    enabled: true,
    allowedPlugins: ['openai-plugin', 'email-validator'],
    hotSwap: true
  },
  
  // Execution environment
  runtime: {
    execute: "aiEmailProcessor_execute_v1",
    init: "aiEmailProcessor_init_v1",
    cleanup: "aiEmailProcessor_cleanup_v1"
  },
  
  lifecycle: {
    onCreate: "aiEmailProcessor_onCreate",
    onInit: "aiEmailProcessor_onInit",
    onBeforeExecute: "aiEmailProcessor_beforeExecute",
    onAfterExecute: "aiEmailProcessor_afterExecute",
    onError: "aiEmailProcessor_onError"
  },
  
  environment: {
    OPENAI_API_KEY: "env:OPENAI_API_KEY",
    NODE_ENV: "env:NODE_ENV"
  },
  
  dependencies: ["openai", "zod", "crypto"],
  capabilities: ["ai-processing", "email-parsing", "async-execution"]
};

// Re-export existing interfaces for compatibility
export type {
  ControlFieldConfig,
  ControlsConfig,
  NodeHandleSpec
} from "./NodeSpec";

export type { NodeMemoryConfig } from "./NodeMemory