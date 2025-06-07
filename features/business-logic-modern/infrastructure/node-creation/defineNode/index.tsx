import { Position } from "@xyflow/react";
import React from "react";
import { BaseNodeData } from "../../flow-engine/types/nodeData";
import { nodeSystemEvents } from "../events/NodeSystemEvents";

// CATEGORY THEMING INTEGRATION
import {
  enableCategoryTheming,
  useCategoryTheme,
  useNodeCategoryBaseClasses,
} from "../../theming/stores/nodeStyleStore";

// Enhanced type definitions for defineNode
export interface NodeHandle {
  id: string;
  type: "source" | "target";
  position: Position;
  dataType: string;
  description?: string;
  enabled?: boolean;
  validation?: (data: any) => boolean;
}

export interface NodeMetadata {
  nodeType: string;
  category: "create" | "transform" | "output" | "utility" | "testing";
  displayName: string;
  description: string;
  icon: string;
  folder: "main" | "testing" | "experimental";
  order?: number;
  version?: string;
  author?: string;
  tags?: string[];
  deprecated?: boolean;
  experimental?: boolean;
}

export interface NodeSecurity {
  requiresAuth?: boolean;
  permissions?: string[];
  allowedRoles?: string[];
  maxExecutionsPerMinute?: number;
  dataAccessLevel?: "read" | "write" | "admin";
}

export interface NodePerformance {
  timeout?: number;
  maxMemoryMB?: number;
  priority?: "low" | "normal" | "high";
  retryAttempts?: number;
  retryDelay?: number;
  cacheable?: boolean;
  cacheKeyGenerator?: (data: any) => string;
}

export interface NodeLifecycle<TData extends BaseNodeData> {
  onMount?: (context: NodeExecutionContext<TData>) => void | Promise<void>;
  onUnmount?: (context: NodeExecutionContext<TData>) => void | Promise<void>;
  onDataChange?: (
    newData: TData,
    oldData: TData,
    context: NodeExecutionContext<TData>
  ) => void | Promise<void>;
  onError?: (
    error: Error,
    context: NodeExecutionContext<TData>
  ) => void | Promise<void>;
  onValidation?: (data: TData) => boolean | string | Promise<boolean | string>;
}

export interface NodeExecutionContext<TData extends BaseNodeData> {
  nodeId: string;
  data: TData;
  updateNodeData: (newData: Partial<TData>) => void;
  setError: (error: string | null) => void;
  getConnections: () => any[]; // TODO: Type properly
  emitEvent: (eventType: string, payload?: any) => void;
  performance: {
    startTime: number;
    executionCount: number;
    lastExecution?: number;
  };
  security: {
    userId?: string;
    permissions: string[];
    canExecute: boolean;
  };
}

export interface NodeRenderContext<TData extends BaseNodeData> {
  data: TData;
  error: string | null;
  updateNodeData: (newData: Partial<TData>) => void;
  id: string;
  isSelected: boolean;
  isExpanded: boolean;
  context: NodeExecutionContext<TData>;
  // Category theming support
  categoryTheme?: any;
  categoryClasses?: {
    background: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export interface NodeConfiguration<TData extends BaseNodeData> {
  // Core configuration
  metadata: NodeMetadata;
  handles: NodeHandle[];
  defaultData: TData;

  // UI Configuration
  size: {
    collapsed: { width: number; height: number };
    expanded: { width: number; height: number };
  };

  // Processing logic
  processLogic: (context: NodeExecutionContext<TData>) => void | Promise<void>;

  // Rendering
  renderCollapsed: (context: NodeRenderContext<TData>) => React.ReactElement;
  renderExpanded: (context: NodeRenderContext<TData>) => React.ReactElement;
  renderInspector?: (context: NodeRenderContext<TData>) => React.ReactElement;

  // Advanced features
  lifecycle?: NodeLifecycle<TData>;
  security?: NodeSecurity;
  performance?: NodePerformance;

  // Validation
  dataSchema?: any; // Zod schema
  configSchema?: any; // Zod schema

  // Auto-registration
  autoRegister?: boolean;
  registryPath?: string;
}

// Auto-registration system
class NodeRegistry {
  private static instance: NodeRegistry;
  private registeredNodes = new Map<string, NodeConfiguration<any>>();
  private pendingRegistrations = new Set<string>();

  static getInstance(): NodeRegistry {
    if (!NodeRegistry.instance) {
      NodeRegistry.instance = new NodeRegistry();
    }
    return NodeRegistry.instance;
  }

  register<TData extends BaseNodeData>(config: NodeConfiguration<TData>): void {
    const { nodeType } = config.metadata;

    // Prevent duplicate registration
    if (this.registeredNodes.has(nodeType)) {
      console.warn(
        `[defineNode] Node type '${nodeType}' is already registered`
      );
      return;
    }

    // Validate configuration
    this.validateConfiguration(config);

    // Register the node
    this.registeredNodes.set(nodeType, config);

    // Emit registration event
    nodeSystemEvents.emitV2("registry:node-registered", nodeType, config);

    // Auto-generate registry files if enabled
    if (config.autoRegister !== false) {
      this.scheduleRegistryUpdate();
    }

    console.log(`[defineNode] Registered node: ${nodeType}`);
  }

  get(nodeType: string): NodeConfiguration<any> | undefined {
    return this.registeredNodes.get(nodeType);
  }

  getAll(): Map<string, NodeConfiguration<any>> {
    return new Map(this.registeredNodes);
  }

  private validateConfiguration<TData extends BaseNodeData>(
    config: NodeConfiguration<TData>
  ): void {
    const errors: string[] = [];

    // Validate metadata
    if (!config.metadata.nodeType) {
      errors.push("metadata.nodeType is required");
    }

    if (!config.metadata.displayName) {
      errors.push("metadata.displayName is required");
    }

    if (!config.metadata.category) {
      errors.push("metadata.category is required");
    }

    // Validate handles
    if (!Array.isArray(config.handles)) {
      errors.push("handles must be an array");
    } else {
      const handleIds = config.handles.map((h) => h.id);
      const duplicates = handleIds.filter(
        (id, index) => handleIds.indexOf(id) !== index
      );
      if (duplicates.length > 0) {
        errors.push(`Duplicate handle IDs: ${duplicates.join(", ")}`);
      }
    }

    // Validate required functions
    if (typeof config.processLogic !== "function") {
      errors.push("processLogic must be a function");
    }

    if (typeof config.renderCollapsed !== "function") {
      errors.push("renderCollapsed must be a function");
    }

    if (typeof config.renderExpanded !== "function") {
      errors.push("renderExpanded must be a function");
    }

    if (errors.length > 0) {
      throw new Error(
        `[defineNode] Invalid configuration for ${config.metadata.nodeType}: ${errors.join(", ")}`
      );
    }
  }

  private scheduleRegistryUpdate(): void {
    if (this.pendingRegistrations.size === 0) {
      setTimeout(() => {
        this.generateRegistryFiles();
        this.pendingRegistrations.clear();
      }, 100);
    }
  }

  private generateRegistryFiles(): void {
    // TODO: Implement auto-generation of registry files
    console.log("[defineNode] Auto-generating registry files...");

    // This would generate the traditional registry format
    // for backward compatibility with existing systems
  }
}

export function defineNode<TData extends BaseNodeData>(
  config: NodeConfiguration<TData>
): {
  nodeType: string;
  component: React.ComponentType<any>;
  configuration: NodeConfiguration<TData>;
} {
  // Get or create registry instance
  const registry = NodeRegistry.getInstance();

  // Auto-register if enabled
  if (config.autoRegister !== false) {
    registry.register(config);
  }

  // Create enhanced default data with V2 metadata
  const enhancedDefaultData = {
    ...config.defaultData,
    _v2RegistryVersion: "2.0.0",
    _v2CreatedAt: Date.now(),
    _v2NodeType: config.metadata.nodeType,
  };

  // Create the React component
  const NodeComponent: React.FC<any> = (props) => {
    const { data, error, updateNodeData, id, isSelected = false } = props;
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [executionContext, setExecutionContext] =
      React.useState<NodeExecutionContext<TData>>();

    // CATEGORY THEMING: Get theme for this node's category
    const categoryTheme = useCategoryTheme(config.metadata.nodeType);
    const categoryClasses = useNodeCategoryBaseClasses(
      config.metadata.nodeType
    );

    // Enable category theming system if not already enabled
    React.useEffect(() => {
      enableCategoryTheming();
    }, []);

    // Create execution context
    React.useEffect(() => {
      const context: NodeExecutionContext<TData> = {
        nodeId: id,
        data: data || enhancedDefaultData,
        updateNodeData,
        setError: () => {}, // Placeholder
        getConnections: () => [], // Placeholder
        emitEvent: (eventType, payload) => {
          nodeSystemEvents.emitV2(
            "node:processing-start",
            id,
            config.metadata.nodeType
          );
        },
        performance: {
          startTime: Date.now(),
          executionCount: 0,
          lastExecution: undefined,
        },
        security: {
          userId: undefined,
          permissions: config.security?.permissions || [],
          canExecute: true,
        },
      };
      setExecutionContext(context);

      // Call lifecycle hooks
      if (config.lifecycle?.onMount) {
        config.lifecycle.onMount(context);
      }

      return () => {
        if (config.lifecycle?.onUnmount) {
          config.lifecycle.onUnmount(context);
        }
      };
    }, [id, data, updateNodeData]);

    // Handle data changes
    React.useEffect(() => {
      if (executionContext && config.lifecycle?.onDataChange) {
        const oldData = executionContext.data;
        const newData = data || enhancedDefaultData;
        if (oldData !== newData) {
          config.lifecycle.onDataChange(newData, oldData, executionContext);
        }
      }
    }, [data, executionContext]);

    // Create render context with category theming
    const renderContext: NodeRenderContext<TData> = {
      data: data || enhancedDefaultData,
      error,
      updateNodeData,
      id,
      isSelected,
      isExpanded,
      context: executionContext || ({} as NodeExecutionContext<TData>),
      categoryTheme,
      categoryClasses,
    };

    const toggleExpanded = () => setIsExpanded(!isExpanded);

    return (
      <div className="relative">
        {/* Toggle button - following cursor rules */}
        <button
          onClick={toggleExpanded}
          className="absolute top-1 left-1 z-10 w-4 h-4 bg-gray-200 hover:bg-gray-300 rounded text-xs flex items-center justify-center"
        >
          {isExpanded ? "−" : "+"}
        </button>

        {/* Node content - following cursor rules with category theming */}
        <div
          className={`${categoryClasses.background} ${categoryClasses.border} rounded-lg ${
            isSelected ? "ring-2 ring-white" : ""
          } ${error ? "ring-2 ring-red-500" : ""}`}
          style={{
            width: isExpanded
              ? config.size.expanded.width
              : config.size.collapsed.width,
            height: isExpanded
              ? config.size.expanded.height
              : config.size.collapsed.height,
          }}
        >
          {isExpanded
            ? config.renderExpanded(renderContext)
            : config.renderCollapsed(renderContext)}
        </div>
      </div>
    );
  };

  return {
    nodeType: config.metadata.nodeType,
    component: NodeComponent,
    configuration: config,
  };
}

// Utility functions for easier node creation
export const defineNodeUtils = {
  /**
   * Create a simple node with minimal configuration
   */
  simple<TData extends BaseNodeData>(
    nodeType: string,
    displayName: string,
    processLogic: (
      context: NodeExecutionContext<TData>
    ) => void | Promise<void>,
    defaultData: TData
  ) {
    return defineNode({
      metadata: {
        nodeType,
        category: "utility",
        displayName,
        description: `Simple ${displayName} node`,
        icon: "box",
        folder: "main",
      },
      handles: [],
      defaultData,
      size: {
        collapsed: { width: 120, height: 60 },
        expanded: { width: 200, height: 120 },
      },
      processLogic,
      renderCollapsed: ({ data }) => (
        <div className="p-2 bg-white border rounded">
          <h3 className="text-sm font-semibold">{displayName}</h3>
        </div>
      ),
      renderExpanded: ({ data, updateNodeData }) => (
        <div className="p-3 bg-white border rounded">
          <h3 className="text-sm font-semibold mb-2">{displayName}</h3>
          <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
        </div>
      ),
    });
  },

  /**
   * Validate a node configuration
   */
  validate<TData extends BaseNodeData>(
    config: NodeConfiguration<TData>
  ): boolean {
    try {
      NodeRegistry.getInstance()["validateConfiguration"](config);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get the current registry instance
   */
  getRegistry: () => NodeRegistry.getInstance(),
};

export { NodeRegistry };
