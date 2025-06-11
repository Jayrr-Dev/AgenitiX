/**
 * JSON REGISTRY ADAPTER - Bridge between JSON node registry and factory system
 *
 * • Provides seamless integration between JSON registry and factory
 * • Transforms JSON registry data into factory-compatible configurations
 * • Maintains type safety while supporting dynamic node types
 * • Handles factory node creation with JSON registry data
 * • Enables factory system to work with modern JSON-based architecture
 *
 * Keywords: adapter, json-registry, factory-integration, type-safety, node-creation
 */

import { Position } from "@xyflow/react";
import type {
  AgenNode,
  BaseNodeData,
  HandleConfig,
  NodeFactoryConfig,
} from "../types";

// ============================================================================
// JSON REGISTRY IMPORTS
// ============================================================================
/**
 * Imports the generated node registry
 * @description Imports the generated node registry
 * @example
 * ```ts
 * import { GENERATED_NODE_REGISTRY } from "../../registries/json-node-registry/generated/nodeRegistry";
 * ```
 */
import { GENERATED_NODE_REGISTRY } from "../../registries/json-node-registry/generated";

// ============================================================================
// ADAPTER TYPES
/**
 * JsonNodeConfig interface
 * @description JsonNodeConfig interface
 * @example
 * ```ts
 * interface JsonNodeConfig {
 *   nodeType: string;
 *   category: string;
 *   displayName: string;
 *   description: string;
 *   icon: string;
 *   folder: string;
 *   order: number;
 *   iconWidth: number;
 *   iconHeight: number;
 *   expandedWidth: number;
 *   expandedHeight: number;
 *   size?: { width: number; height: number };
 *   hasToggle: boolean;
 *   isEnabled: boolean;
 *   isExperimental: boolean;
 *   handles: HandleConfig[];
 *   defaultData: Record<string, any>;
 *   component: () => Promise<any>;
 *   inspectorComponent?: () => Promise<any>;
 * }
 * ```
 */
// ============================================================================
export interface JsonNodeConfig {
  nodeType: string;
  category: string;
  displayName: string;
  description: string;
  icon: string;
  folder: string;
  order: number;
  iconWidth: number;
  iconHeight: number;
  expandedWidth: number;
  expandedHeight: number;
  size?: { width: number; height: number };
  hasToggle: boolean;
  isEnabled: boolean;
  isExperimental: boolean;
  handles: HandleConfig[];
  defaultData: Record<string, any>;
  component: () => Promise<any>;
  inspectorComponent?: () => Promise<any>;
}

// ============================================================================
// REGISTRY ADAPTER CLASS
/**
 * JsonRegistryAdapter class
 * @description JsonRegistryAdapter class
 * @example
 * ```ts
 * const adapter = new JsonRegistryAdapter();
 * ```
 */
// ============================================================================

export class JsonRegistryAdapter {
  private static instance: JsonRegistryAdapter;
  private registryCache: Record<string, JsonNodeConfig> = {};
  private initialized = false;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): JsonRegistryAdapter {
    if (!JsonRegistryAdapter.instance) {
      JsonRegistryAdapter.instance = new JsonRegistryAdapter();
    }
    return JsonRegistryAdapter.instance;
  }

  // ============================================================================
  // INITIALIZATION
  /**
   * Initializes the JSON registry adapter
   * @description Initializes the JSON registry adapter
   * @example
   * ```ts
   * const adapter = JsonRegistryAdapter.getInstance();
   * adapter.initialize();
   * ```
   */
  // ============================================================================

  private initialize(): void {
    if (this.initialized) return;

    try {
      // Cache all registry data for fast access
      Object.entries(GENERATED_NODE_REGISTRY).forEach(([nodeType, config]) => {
        this.registryCache[nodeType] = config as unknown as JsonNodeConfig;
      });

      this.initialized = true;
          // Debug logging removed for cleaner console
    } catch (error) {
      console.error("❌ [JsonRegistryAdapter] Failed to initialize:", error);
    }
  }

  // ============================================================================
  // FACTORY COMPATIBILITY METHODS
  // ============================================================================

  /**
   * Gets all available node types from JSON registry
   */
  public getNodeTypes(): string[] {
    return Object.keys(this.registryCache);
  }

  /**
   * Checks if a node type is valid in the JSON registry
   */
  public isValidNodeType(nodeType: string): boolean {
    return nodeType in this.registryCache;
  }

  /**
   * Gets node configuration in factory-compatible format
   */
  public getNodeConfig(nodeType: string): any {
    const config = this.registryCache[nodeType];
    if (!config) return null;

    return {
      label: config.displayName,
      icon: config.icon,
      defaultData: config.defaultData || {},
      width: config.iconWidth || 60,
      height: config.iconHeight || 60,
      hasTargetPosition: true,
      targetPosition: Position.Top,
    };
  }

  /**
   * Gets default data for a node type
   */
  public getNodeDefaultData(nodeType: string): Record<string, any> {
    const config = this.registryCache[nodeType];
    return config?.defaultData || {};
  }

  /**
   * Gets handle configuration for a node type
   */
  public getNodeHandles(nodeType: string): HandleConfig[] {
    const config = this.registryCache[nodeType];
    return config?.handles || [];
  }

  /**
   * Gets complete node metadata from JSON registry
   */
  public getNodeMetadata(nodeType: string): JsonNodeConfig | null {
    return this.registryCache[nodeType] || null;
  }

  // ============================================================================
  // FACTORY NODE CREATION
  // ============================================================================

  /**
   * Creates a factory-compatible node using JSON registry data
   */
  public createNode(
    nodeType: string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    const config = this.registryCache[nodeType];
    if (!config) {
      console.warn(`[JsonRegistryAdapter] Unknown node type: ${nodeType}`);
      return null;
    }

    const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Merge default data with custom data
    const nodeData = {
      ...config.defaultData,
      ...customData,
      showUI: Boolean(customData?.showUI) ?? false,
      isActive: Boolean(customData?.isActive) ?? false,
    };

    // Create base node structure
    const node: AgenNode = {
      id,
      type: nodeType as any, // Type assertion for factory compatibility
      position,
      deletable: true,
      data: nodeData,
    };

    // Add target position if supported
    if (config.hasToggle) {
      node.targetPosition = Position.Top;
    }

    return node;
  }

  /**
   * Copies a node with new ID and offset position
   */
  public copyNode(
    originalNode: AgenNode,
    offset: { x: number; y: number } = { x: 40, y: 40 }
  ): AgenNode {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const newId = `${originalNode.id}-copy-${timestamp}-${randomId}`;

    return {
      ...originalNode,
      id: newId,
      position: {
        x: originalNode.position.x + offset.x,
        y: originalNode.position.y + offset.y,
      },
      selected: false,
      data: {
        ...originalNode.data,
        selected: false,
      },
    };
  }

  /**
   * Toggles the UI state of a node
   */
  public toggleNodeUI(node: AgenNode): AgenNode {
    return {
      ...node,
      data: {
        ...node.data,
        showUI: !node.data.showUI,
      },
    };
  }

  // ============================================================================
  // FACTORY CONFIGURATION GENERATION
  // ============================================================================

  /**
   * Generates factory-compatible configuration for all nodes
   */
  public generateFactoryConfig(): Record<string, any> {
    const factoryConfig: Record<string, any> = {};

    Object.entries(this.registryCache).forEach(([nodeType, config]) => {
      factoryConfig[nodeType] = {
        label: config.displayName,
        icon: config.icon,
        defaultData: config.defaultData || {},
        width: config.iconWidth || 60,
        height: config.iconHeight || 60,
        hasTargetPosition: true,
        targetPosition: Position.Top,
      };
    });

    return factoryConfig;
  }

  /**
   * Generates Node Factory configurations for advanced nodes
   */
  public generateNodeFactoryConfig<T extends BaseNodeData>(
    nodeType: string
  ): NodeFactoryConfig<T> | null {
    const config = this.registryCache[nodeType];
    if (!config) return null;

    return {
      nodeType,
      category: config.category as any,
      displayName: config.displayName,
      size: config.size
        ? {
            collapsed: {
              width: `w-[${config.size.width}px]` as any,
              height: `h-[${config.size.height}px]` as any,
            },
            expanded: {
              width: `w-[${config.expandedWidth || 120}px]` as any,
              height: `h-[${config.expandedHeight || 120}px]` as any,
            },
          }
        : undefined,
      handles: config.handles,
      defaultData: config.defaultData as T,
      processLogic: () => {}, // Placeholder - implement based on node type
      renderCollapsed: () => null, // Placeholder - implement based on node type
      renderExpanded: () => null, // Placeholder - implement based on node type
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Gets statistics about the JSON registry
   */
  public getRegistryStats() {
    const stats = {
      totalNodes: Object.keys(this.registryCache).length,
      categories: new Set<string>(),
      folders: new Set<string>(),
      enabledNodes: 0,
      experimentalNodes: 0,
    };

    Object.values(this.registryCache).forEach((config) => {
      stats.categories.add(config.category);
      stats.folders.add(config.folder);
      if (config.isEnabled) stats.enabledNodes++;
      if (config.isExperimental) stats.experimentalNodes++;
    });

    return {
      ...stats,
      categories: Array.from(stats.categories),
      folders: Array.from(stats.folders),
    };
  }

  /**
   * Refreshes the registry cache (useful for development)
   */
  public refresh(): void {
    this.initialized = false;
    this.registryCache = {};
    this.initialize();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Singleton instance
export const jsonRegistryAdapter = JsonRegistryAdapter.getInstance();

// Factory-compatible interface
export const JsonNodeFactory = {
  createNode: (
    nodeType: string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ) => jsonRegistryAdapter.createNode(nodeType, position, customData),
  isValidNodeType: (type: string) => jsonRegistryAdapter.isValidNodeType(type),
  getNodeDefaultData: (type: string) =>
    jsonRegistryAdapter.getNodeDefaultData(type),
  getNodeConfig: (type: string) => jsonRegistryAdapter.getNodeConfig(type),
  copyNode: (originalNode: AgenNode, offset?: { x: number; y: number }) =>
    jsonRegistryAdapter.copyNode(originalNode, offset),
  toggleNodeUI: (node: AgenNode) => jsonRegistryAdapter.toggleNodeUI(node),
  getNodeHandles: (type: string) => jsonRegistryAdapter.getNodeHandles(type),
  getNodeMetadata: (type: string) => jsonRegistryAdapter.getNodeMetadata(type),
} as const;
