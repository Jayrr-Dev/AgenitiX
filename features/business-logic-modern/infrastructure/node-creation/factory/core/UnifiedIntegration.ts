/**
 * UNIFIED INTEGRATION - Single point of integration for all factory systems
 *
 * This module provides a comprehensive, enterprise-grade solution for node creation
 * and management across different factory systems. It consolidates functionality
 * from multiple integration layers into a single, optimized interface.
 *
 * KEY FEATURES:
 * • Single source of truth for all node operations
 * • Intelligent fallback strategies with configurable behaviors
 * • Performance optimization through intelligent caching
 * • Comprehensive error handling and monitoring
 * • Type-safe operations with proper generic support
 * • Enterprise-grade logging and debugging capabilities
 *
 * INTEGRATION STRATEGIES:
 * • JSON_REGISTRY_FIRST: Prioritizes JSON registry, falls back to basic factory
 * • BASIC_FACTORY_FIRST: Prioritizes basic factory, falls back to JSON registry
 * • JSON_REGISTRY_ONLY: Exclusively uses JSON registry (throws on failure)
 * • BASIC_FACTORY_ONLY: Exclusively uses basic factory (throws on failure)
 *
 * PERFORMANCE OPTIMIZATIONS:
 * • Intelligent cache key generation (avoiding expensive serialization)
 * • LRU-style cache eviction with configurable size limits
 * • Metrics tracking for performance monitoring
 * • Lazy loading and on-demand initialization
 *
 * REPLACES:
 * - integrations/factoryIntegration.ts
 * - utils/nodeFactoryIntegrated.ts
 * - adapters/jsonRegistryAdapter.ts (adapter logic moved to dedicated adapters)
 *
 * @example
 * ```typescript
 * // Create factory with custom config
 * const factory = createUnifiedFactory({
 *   strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
 *   enableCaching: true,
 *   fallbackBehavior: 'warn'
 * });
 *
 * // Create a node
 * const node = factory.createNode('trigger', { x: 100, y: 200 });
 *
 * // Create a complete node with component
 * const { nodeData, component } = factory.createCompleteNode(
 *   'processor',
 *   { x: 300, y: 400 },
 *   { nodeType: 'processor', title: 'Data Processor' }
 * );
 * ```
 *
 * @author Factory Integration Team
 * @since v2.0.0
 * @keywords unified-integration, factory-consolidation, enterprise-grade, performance
 */

import React from "react";
import type {
  AgenNode,
  BaseNodeData,
  HandleConfig,
  NodeFactoryConfig,
  NodeType,
} from "../types";

// Import core systems
import { createNodeComponent } from "../NodeFactory";
import { JsonNodeFactory } from "../adapters/jsonRegistryAdapter";
import { TOGGLE_SYMBOLS } from "../constants";
import { NodeFactory as BasicNodeFactory } from "../utils/nodeFactory";

// ============================================================================
// UNIFIED INTEGRATION INTERFACE
// ============================================================================

export interface UnifiedNodeFactory {
  // CORE CREATION METHODS
  createNode: (
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ) => AgenNode | null;

  createComponent: <T extends BaseNodeData>(
    config: NodeFactoryConfig<T>
  ) => React.ComponentType<any>;

  createCompleteNode: <T extends BaseNodeData>(
    type: NodeType | string,
    position: { x: number; y: number },
    config?: NodeFactoryConfig<T>
  ) => {
    nodeData: AgenNode | null;
    component?: React.ComponentType<any>;
  };

  // DATA MANIPULATION
  copyNode: (
    originalNode: AgenNode,
    offset?: { x: number; y: number }
  ) => AgenNode | null;

  toggleNodeUI: (node: AgenNode) => AgenNode;

  // CONFIGURATION ACCESS
  getNodeConfig: (type: string) => any;
  getNodeHandles: (type: string) => HandleConfig[];
  getNodeMetadata: (type: string) => any;
  getNodeSize: (
    type: string,
    showUI: boolean
  ) => { width: number; height: number };

  // VALIDATION
  isValidNodeType: (type: string) => boolean;
  getNodeDefaultData: (type: string) => Record<string, any>;

  // UTILITY
  getToggleSymbol: (showUI: boolean) => string;

  // PERFORMANCE & MONITORING
  getMetrics: () => {
    jsonRegistryHits: number;
    basicFactoryHits: number;
    cacheHits: number;
    fallbacks: number;
    errors: number;
    cacheSize: number;
    cacheMaxSize: number;
    strategy: string;
  };
  clearCache: () => number;
  resetMetrics: () => void;
  getCacheStats: () => {
    size: number;
    maxSize: number;
    hitRate: number;
    enabled: boolean;
  };
}

// ============================================================================
// INTEGRATION STRATEGIES
// ============================================================================

enum IntegrationStrategy {
  JSON_REGISTRY_FIRST = "json_registry_first", // Try JSON registry first, fallback to basic
  BASIC_FACTORY_FIRST = "basic_factory_first", // Try basic factory first, fallback to JSON
  JSON_REGISTRY_ONLY = "json_registry_only", // Only use JSON registry
  BASIC_FACTORY_ONLY = "basic_factory_only", // Only use basic factory
}

interface IntegrationConfig {
  strategy: IntegrationStrategy;
  enableCaching: boolean;
  enableMetrics: boolean;
  fallbackBehavior: "throw" | "warn" | "silent";
}

// ============================================================================
// UNIFIED FACTORY IMPLEMENTATION
// ============================================================================

class UnifiedFactoryImpl implements UnifiedNodeFactory {
  private config: IntegrationConfig;
  private cache = new Map<string, any>();
  private cacheKeyPrefix = "unified_factory";
  private maxCacheSize = 1000;
  private metrics = {
    jsonRegistryHits: 0,
    basicFactoryHits: 0,
    cacheHits: 0,
    fallbacks: 0,
    errors: 0,
  };

  constructor(config: Partial<IntegrationConfig> = {}) {
    this.config = {
      strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
      enableCaching: true,
      enableMetrics: process.env.NODE_ENV === "development",
      fallbackBehavior: "warn",
      ...config,
    };
  }

  // CORE CREATION METHODS
  createNode(
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    // Improved cache key generation - avoiding expensive JSON.stringify
    const cacheKey = this.generateCacheKey(
      "createNode",
      type,
      position,
      customData
    );

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      this.recordMetric("cacheHits");
      return this.cache.get(cacheKey);
    }

    let result: AgenNode | null = null;

    try {
      switch (this.config.strategy) {
        case IntegrationStrategy.JSON_REGISTRY_FIRST:
          result = this.createNodeWithJsonFirst(type, position, customData);
          break;

        case IntegrationStrategy.BASIC_FACTORY_FIRST:
          result = this.createNodeWithBasicFirst(type, position, customData);
          break;

        case IntegrationStrategy.JSON_REGISTRY_ONLY:
          result = this.tryJsonRegistryCreateNode(type, position, customData);
          break;

        case IntegrationStrategy.BASIC_FACTORY_ONLY:
          result = this.tryBasicFactoryCreateNode(type, position, customData);
          break;

        default:
          throw new Error(
            `Unknown integration strategy: ${this.config.strategy}`
          );
      }

      if (result && this.config.enableCaching) {
        this.setCacheWithLimit(cacheKey, result);
      }

      return result;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError(`createNode failed for type "${type}"`, error);
      return null;
    }
  }

  createComponent<T extends BaseNodeData>(
    config: NodeFactoryConfig<T>
  ): React.ComponentType<any> {
    try {
      return createNodeComponent(config);
    } catch (error) {
      this.recordMetric("errors");
      this.handleError(`createComponent failed for ${config.nodeType}`, error);
      throw error;
    }
  }

  createCompleteNode<T extends BaseNodeData>(
    type: NodeType | string,
    position: { x: number; y: number },
    config?: NodeFactoryConfig<T>
  ) {
    const nodeData = this.createNode(type, position);
    let component: React.ComponentType<any> | undefined;

    if (config) {
      try {
        component = this.createComponent(config);
      } catch (error) {
        this.handleError(
          `createCompleteNode component creation failed for ${type}`,
          error
        );
      }
    }

    return { nodeData, component };
  }

  // DATA MANIPULATION
  copyNode(
    originalNode: AgenNode,
    offset: { x: number; y: number } = { x: 40, y: 40 }
  ): AgenNode | null {
    try {
      // Try JSON registry first
      const jsonResult = JsonNodeFactory.copyNode(originalNode, offset);
      if (jsonResult) {
        this.recordMetric("jsonRegistryHits");
        return jsonResult as AgenNode;
      }
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("JSON registry copyNode failed", error);
    }

    // Fallback to basic factory
    try {
      const basicResult = BasicNodeFactory.copyNode(originalNode, offset);
      this.recordMetric("basicFactoryHits");
      return basicResult;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both copyNode methods failed", error);
      return null;
    }
  }

  toggleNodeUI(node: AgenNode): AgenNode {
    try {
      // Try JSON registry first
      const jsonResult = JsonNodeFactory.toggleNodeUI(node);
      if (jsonResult) {
        this.recordMetric("jsonRegistryHits");
        return jsonResult as AgenNode;
      }
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("JSON registry toggleNodeUI failed", error);
    }

    // Fallback to basic factory
    try {
      const basicResult = BasicNodeFactory.toggleNodeUI(node);
      this.recordMetric("basicFactoryHits");
      return basicResult;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both toggleNodeUI methods failed", error);
      return node; // Return original node if both fail
    }
  }

  // CONFIGURATION ACCESS
  getNodeConfig(type: string): any {
    const cacheKey = `getNodeConfig:${type}`;

    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      this.recordMetric("cacheHits");
      return this.cache.get(cacheKey);
    }

    try {
      // Try JSON registry first
      const jsonConfig = JsonNodeFactory.getNodeConfig(type);
      if (jsonConfig && Object.keys(jsonConfig).length > 0) {
        this.recordMetric("jsonRegistryHits");
        if (this.config.enableCaching) {
          this.cache.set(cacheKey, jsonConfig);
        }
        return jsonConfig;
      }
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("JSON registry getNodeConfig failed", error);
    }

    // Fallback to basic factory
    try {
      const basicConfig = BasicNodeFactory.getNodeConfig(type as NodeType);
      this.recordMetric("basicFactoryHits");
      if (this.config.enableCaching) {
        this.cache.set(cacheKey, basicConfig);
      }
      return basicConfig;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both getNodeConfig methods failed", error);
      return null;
    }
  }

  getNodeHandles(type: string): HandleConfig[] {
    try {
      return JsonNodeFactory.getNodeHandles(type) || [];
    } catch (error) {
      this.handleError("getNodeHandles failed", error);
      return [];
    }
  }

  getNodeMetadata(type: string): any {
    try {
      return JsonNodeFactory.getNodeMetadata(type);
    } catch (error) {
      this.handleError("getNodeMetadata failed", error);
      return null;
    }
  }

  getNodeSize(
    type: string,
    showUI: boolean
  ): { width: number; height: number } {
    const config = this.getNodeConfig(type);

    if (!config) {
      // Default fallback sizes
      return showUI ? { width: 120, height: 120 } : { width: 60, height: 60 };
    }

    if (showUI) {
      return { width: 120, height: 120 };
    }

    return {
      width: config.width || 60,
      height: config.height || 60,
    };
  }

  // VALIDATION
  isValidNodeType(type: string): boolean {
    return (
      JsonNodeFactory.isValidNodeType(type) ||
      BasicNodeFactory.isValidNodeType(type)
    );
  }

  getNodeDefaultData(type: string): Record<string, any> {
    try {
      const jsonData = JsonNodeFactory.getNodeDefaultData(type);
      if (jsonData && Object.keys(jsonData).length > 0) {
        this.recordMetric("jsonRegistryHits");
        return jsonData;
      }
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("JSON registry getNodeDefaultData failed", error);
    }

    try {
      const basicData = BasicNodeFactory.getNodeDefaultData(type as NodeType);
      this.recordMetric("basicFactoryHits");
      return basicData;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both getNodeDefaultData methods failed", error);
      return {};
    }
  }

  // UTILITY
  getToggleSymbol(showUI: boolean): string {
    return showUI ? TOGGLE_SYMBOLS.EXPANDED : TOGGLE_SYMBOLS.COLLAPSED;
  }

  // PRIVATE HELPER METHODS
  private generateCacheKey(
    operation: string,
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): string {
    const positionKey = `${position.x},${position.y}`;
    const dataKey = customData
      ? Object.keys(customData).sort().join(",")
      : "none";
    return `${this.cacheKeyPrefix}:${operation}:${type}:${positionKey}:${dataKey}`;
  }

  private setCacheWithLimit(key: string, value: any): void {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry (first in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  private tryJsonRegistryCreateNode(
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    try {
      const result = JsonNodeFactory.createNode(type, position, customData);
      this.recordMetric("jsonRegistryHits");
      return result as AgenNode;
    } catch (error) {
      this.recordMetric("errors");
      throw error;
    }
  }

  private tryBasicFactoryCreateNode(
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    try {
      const result = BasicNodeFactory.createNode(
        type as NodeType,
        position,
        customData
      );
      this.recordMetric("basicFactoryHits");
      return result;
    } catch (error) {
      this.recordMetric("errors");
      throw error;
    }
  }

  private createNodeWithJsonFirst(
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    try {
      const jsonResult = JsonNodeFactory.createNode(type, position, customData);
      if (jsonResult) {
        this.recordMetric("jsonRegistryHits");
        return jsonResult as AgenNode;
      }
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("JSON registry createNode failed", error);
    }

    // Fallback to basic factory
    try {
      const basicResult = BasicNodeFactory.createNode(
        type as NodeType,
        position,
        customData
      );
      this.recordMetric("basicFactoryHits");
      return basicResult;
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both createNode methods failed", error);
      return null;
    }
  }

  private createNodeWithBasicFirst(
    type: NodeType | string,
    position: { x: number; y: number },
    customData?: Record<string, unknown>
  ): AgenNode | null {
    try {
      const basicResult = BasicNodeFactory.createNode(
        type as NodeType,
        position,
        customData
      );
      this.recordMetric("basicFactoryHits");
      return basicResult;
    } catch (error) {
      this.recordMetric("fallbacks");
      this.handleError("Basic factory createNode failed", error);
    }

    // Fallback to JSON registry
    try {
      const jsonResult = JsonNodeFactory.createNode(type, position, customData);
      if (jsonResult) {
        this.recordMetric("jsonRegistryHits");
        return jsonResult as AgenNode;
      }
    } catch (error) {
      this.recordMetric("errors");
      this.handleError("Both createNode methods failed", error);
      return null;
    }

    return null;
  }

  private recordMetric(metric: keyof typeof this.metrics): void {
    if (this.config.enableMetrics) {
      this.metrics[metric]++;
    }
  }

  private handleError(message: string, error: unknown): void {
    const errorDetails = error instanceof Error ? error.message : String(error);
    const timestamp = new Date().toISOString();
    const errorMessage = `[UnifiedIntegration] ${timestamp} - ${message}: ${errorDetails}`;

    // Log error details for debugging
    if (this.config.enableMetrics && process.env.NODE_ENV === "development") {
      console.debug(`Full error context:`, {
        message,
        error,
        stack: error instanceof Error ? error.stack : undefined,
        metrics: this.metrics,
        strategy: this.config.strategy,
      });
    }

    switch (this.config.fallbackBehavior) {
      case "throw":
        throw new Error(errorMessage);
      case "warn":
        console.warn(errorMessage);
        break;
      case "silent":
        // Still log to debug in development
        if (process.env.NODE_ENV === "development") {
          console.debug(errorMessage);
        }
        break;
      default:
        console.warn(
          `Unknown fallback behavior: ${this.config.fallbackBehavior}`
        );
        console.warn(errorMessage);
    }
  }

  /**
   * Type guard to check if a value is a valid AgenNode
   */
  private isValidAgenNode(value: unknown): value is AgenNode {
    return (
      typeof value === "object" &&
      value !== null &&
      "id" in value &&
      "type" in value &&
      "position" in value &&
      "data" in value
    );
  }

  /**
   * Safely extract node type from various input formats
   */
  private normalizeNodeType(type: NodeType | string): string {
    if (typeof type === "string") {
      return type;
    }
    return String(type);
  }

  // PUBLIC METRICS ACCESS
  /**
   * Get current performance metrics
   * @returns Copy of current metrics to prevent external modification
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.cache.size,
      cacheMaxSize: this.maxCacheSize,
      strategy: this.config.strategy,
    };
  }

  /**
   * Clear all cached data
   * @returns Number of items cleared from cache
   */
  clearCache(): number {
    const count = this.cache.size;
    this.cache.clear();
    return count;
  }

  /**
   * Reset all performance metrics to zero
   */
  resetMetrics(): void {
    Object.keys(this.metrics).forEach((key) => {
      this.metrics[key as keyof typeof this.metrics] = 0;
    });
  }

  /**
   * Get cache statistics and health information
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      hitRate:
        this.metrics.cacheHits /
          (this.metrics.cacheHits +
            this.metrics.jsonRegistryHits +
            this.metrics.basicFactoryHits) || 0,
      enabled: this.config.enableCaching,
    };
  }
}

// ============================================================================
// FACTORY CREATION FUNCTIONS
// ============================================================================

/**
 * Create a unified factory instance with custom configuration
 */
export function createUnifiedFactory(
  config?: Partial<IntegrationConfig>
): UnifiedNodeFactory {
  return new UnifiedFactoryImpl(config);
}

/**
 * Default unified factory instance (JSON registry first strategy)
 */
export const unifiedFactory = createUnifiedFactory({
  strategy: IntegrationStrategy.JSON_REGISTRY_FIRST,
  enableCaching: true,
  enableMetrics: process.env.NODE_ENV === "development",
  fallbackBehavior: "warn",
});

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

// Re-export main methods for easy access
export const {
  createNode,
  createComponent,
  createCompleteNode,
  copyNode,
  toggleNodeUI,
  getNodeConfig,
  getNodeHandles,
  getNodeMetadata,
  getNodeSize,
  isValidNodeType,
  getNodeDefaultData,
  getToggleSymbol,
} = unifiedFactory;

// Export types and configuration
export { IntegrationStrategy };
export type { IntegrationConfig };

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migration helper for existing factoryIntegration.ts users
 */
export function createIntegratedFactory<T extends BaseNodeData>(
  nodeType: NodeType,
  componentConfig: NodeFactoryConfig<T>
) {
  return {
    createNodeData: (
      type: NodeType,
      position: { x: number; y: number },
      customData?: Record<string, unknown>
    ) => unifiedFactory.createNode(type, position, customData),

    createNodeComponent: (config: NodeFactoryConfig<T>) =>
      unifiedFactory.createComponent(config),

    createCompleteNode: (
      type: NodeType,
      position: { x: number; y: number },
      config: NodeFactoryConfig<T>
    ) => unifiedFactory.createCompleteNode(type, position, config),

    toggleNodeState: (node: AgenNode) => unifiedFactory.toggleNodeUI(node),
    getToggleSymbol: (showUI: boolean) =>
      unifiedFactory.getToggleSymbol(showUI),
    getNodeSize: (type: NodeType, showUI: boolean) =>
      unifiedFactory.getNodeSize(type, showUI),
  };
}

/**
 * Migration helper for existing nodeFactoryIntegrated.ts users
 */
export const IntegratedNodeFactory = {
  createNode: unifiedFactory.createNode,
  isValidNodeType: unifiedFactory.isValidNodeType,
  getNodeDefaultData: unifiedFactory.getNodeDefaultData,
  getNodeConfig: unifiedFactory.getNodeConfig,
  getNodeHandles: unifiedFactory.getNodeHandles,
  getNodeMetadata: unifiedFactory.getNodeMetadata,
  copyNode: unifiedFactory.copyNode,
  toggleNodeUI: unifiedFactory.toggleNodeUI,
  getNodeSize: unifiedFactory.getNodeSize,
} as const;
