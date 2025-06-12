/**
 * VIEW OUTPUT V2U - Complete defineNode() Migration
 *
 * 🎯 WEEK 8 MIGRATION: Converted from legacy createNodeComponent to defineNode()
 * • Modern single-file architecture with enterprise features
 * • Enhanced data viewing with type-aware value extraction
 * • Smart filtering and professional data visualization
 * • Integrated with V2U DevTools and monitoring systems
 * • Professional error handling and validation
 *
 * Keywords: v2u-migration, defineNode, data-visualization, type-indicators
 */

"use client";

import { Position } from "@xyflow/react";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";
import { defineNode } from "../../infrastructure/node-creation";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface ViewOutputV2UData extends BaseNodeData {
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
  }>;
  // V2U metadata tracking
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function extractNodeValue(data: any): any {
  if (!data || typeof data !== "object") return data;

  // Look for common output properties
  if ("text" in data) return data.text;
  if ("value" in data) return data.value;
  if ("output" in data) return data.output;
  if ("result" in data) return data.result;

  return data;
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return String(obj);
  }
}

// Helper function to get data type information and colors
const getDataTypeInfo = (content: any) => {
  if (typeof content === "string")
    return { type: "s", color: "#3b82f6", label: "string" };
  if (typeof content === "number")
    return { type: "n", color: "#f59e42", label: "number" };
  if (typeof content === "boolean")
    return { type: "b", color: "#10b981", label: "boolean" };
  if (typeof content === "bigint")
    return { type: "N", color: "#a21caf", label: "bigint" };
  if (Array.isArray(content))
    return { type: "a", color: "#f472b6", label: "array" };
  if (content === null) return { type: "∅", color: "#ef4444", label: "null" };
  if (content === undefined)
    return { type: "u", color: "#d1d5db", label: "undefined" };
  if (typeof content === "symbol")
    return { type: "S", color: "#eab308", label: "symbol" };
  if (typeof content === "object")
    return { type: "j", color: "#6366f1", label: "object" };
  return { type: "x", color: "#6b7280", label: "any" };
};

// Helper function to format content for display
const formatContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (typeof content === "number") {
    if (Number.isNaN(content)) return "NaN";
    if (!Number.isFinite(content))
      return content > 0 ? "Infinity" : "-Infinity";
    return content.toString();
  }
  if (typeof content === "boolean") return content ? "true" : "false";
  if (typeof content === "bigint") return content.toString() + "n";
  try {
    return safeStringify(content);
  } catch {
    return String(content);
  }
};

// ============================================================================
// DEFINE NODE - V2U ARCHITECTURE
// ============================================================================

export default defineNode<ViewOutputV2UData>({
  // METADATA: Enhanced V2U configuration
  metadata: {
    nodeType: "viewOutputV2U",
    category: "output",
    displayName: "View Output (V2U)",
    description:
      "Enhanced data viewing component with V2U architecture - displays values from connected nodes with type indicators",
    icon: "👁️",
    folder: "main",
    version: "2.0.0",
    author: "V2U Migration Team",
    tags: ["view", "output", "display", "v2u", "migrated"],
    experimental: false,
  },

  // HANDLES: Enhanced configuration
  handles: [
    {
      id: "input",
      type: "target",
      position: Position.Left,
      dataType: "any",
      description:
        "Data input from any node - automatically extracts and displays values",
      enabled: true,
      validation: () => true, // Accept any data type
    },
  ],

  // DEFAULT DATA: Enhanced with V2U metadata
  defaultData: {
    displayedValues: [],
    _v2uMigrated: true,
    _v2uMigrationDate: Date.now(),
  },

  // SIZE CONFIGURATION: Large interactive display
  size: {
    collapsed: { width: 180, height: 100 },
    expanded: { width: 320, height: 240 },
  },

  // PROCESSING LOGIC: Enhanced with V2U error handling and validation
  processLogic: async ({
    data,
    getConnections,
    getNodes,
    updateNodeData,
    setError,
    nodeId,
    performance,
  }) => {
    try {
      // Performance tracking
      const startTime = Date.now();

      // Get connections and all nodes from the context
      const allConnections = getConnections();
      const allNodes = getNodes();

      // Find connections targeting this specific node
      const incomingConnections = allConnections.filter(
        (conn) => conn.target === nodeId
      );

      // If no connections, clear displayed values and exit
      if (incomingConnections.length === 0) {
        if (data.displayedValues && data.displayedValues.length > 0) {
          updateNodeData({ displayedValues: [] });
        }
        return;
      }

      // Get the IDs of the source nodes
      const sourceNodeIds = new Set(
        incomingConnections.map((conn) => conn.source)
      );

      // Get the actual data from the connected source nodes
      const connectedNodes = allNodes.filter((node) =>
        sourceNodeIds.has(node.id)
      );

      // Extract values from connected nodes using safe extraction
      const values = connectedNodes
        .map((node) => {
          try {
            const extractedValue = extractNodeValue(node.data);
            return {
              type: node.type || "unknown",
              content: extractedValue,
              id: node.id,
            };
          } catch (nodeError) {
            console.warn(
              `[ViewOutputV2U] ${nodeId} - Error processing node ${node.id}:`,
              nodeError
            );
            return {
              type: node.type || "unknown",
              content: "Error processing node",
              id: node.id || "unknown",
            };
          }
        })
        .filter((item) => {
          // V2U: Enhanced filtering - remove empty/undefined/inactive values
          if (!item || typeof item !== "object") return false;
          // Do not display 'false' boolean values, as they indicate an off state
          if (item.content === false) return false;
          if (item.content === undefined || item.content === null) return false;
          if (typeof item.content === "string" && item.content.trim() === "")
            return false;
          return true;
        });

      // Update displayed values only if they have actually changed
      if (safeStringify(data.displayedValues) !== safeStringify(values)) {
        updateNodeData({
          displayedValues: values,
        });
      }

      // Clear any existing errors
      setError(null);

      // V2U: Performance metrics
      const executionTime = Date.now() - startTime;
      if (executionTime > 100) {
        console.warn(
          `[ViewOutputV2U] Slow execution: ${executionTime}ms for node ${nodeId}`
        );
      }
    } catch (updateError) {
      console.error(`[ViewOutputV2U] ${nodeId} - Update error:`, updateError);
      const errorMessage =
        updateError instanceof Error ? updateError.message : "Unknown error";
      setError(errorMessage);

      // Fallback data update
      updateNodeData({
        displayedValues: [],
        _v2uMigrated: true,
      });
    }
  },

  // COLLAPSED RENDER: Carbon copy of ViewOutput styling
  renderCollapsed: ({ data, error }) => {
    const values = data.displayedValues || [];

    return (
      <div className="absolute inset-0 flex flex-col px-2 py-2 overflow-hidden">
        <div className="flex items-center justify-center mb-1">
          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
            {error ? "Error" : "📤 View Output"}
          </div>
        </div>

        {error ? (
          <div className="text-xs text-center text-red-600 dark:text-red-400 break-words flex-1 flex items-center justify-center">
            {error}
          </div>
        ) : values.length ? (
          <div className="space-y-1 flex-1 overflow-hidden">
            {values.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="bg-white/50 dark:bg-black/20 rounded px-1 py-0.5 overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {formatContent(item.content)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs italic text-gray-600 dark:text-gray-400 flex-1 flex items-center justify-center text-center">
            Connect nodes
          </div>
        )}
      </div>
    );
  },

  // EXPANDED RENDER: Carbon copy of ViewOutput styling
  renderExpanded: ({ data, error }) => {
    const values = data.displayedValues || [];
    const categoryTextTheme = {
      primary: "text-gray-900 dark:text-gray-100",
      secondary: "text-gray-600 dark:text-gray-400",
    };

    return (
      <div className="flex text-xs flex-col w-full h-[156px] overflow-hidden">
        <div
          className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}
        >
          <span>{error ? "Error" : "View Output"}</span>
          {error ? (
            <span className="text-xs text-red-600 dark:text-red-400">
              ● {error}
            </span>
          ) : (
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {values.length} input{values.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {error && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
            <div className="font-semibold mb-1">Error Details:</div>
            <div className="mb-2">{error}</div>
          </div>
        )}

        {values.length ? (
          <div
            className="nodrag nowheel space-y-2 flex-1 overflow-y-auto max-h-[120px] pr-1"
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ touchAction: "pan-y" }}
          >
            {values.map((item, index) => {
              const typeInfo = getDataTypeInfo(item.content);
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-white/50 dark:bg-black/20 rounded px-2 py-2"
                >
                  {/* Type indicator with colored icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: typeInfo.color }}
                      title={typeInfo.label}
                    >
                      {typeInfo.type}
                    </div>
                    <span
                      className={`text-xs font-medium ${categoryTextTheme.secondary}`}
                    >
                      {typeInfo.label}
                    </span>
                  </div>

                  {/* Content */}
                  <div
                    className={`text-xs font-mono break-all ${categoryTextTheme.primary}`}
                  >
                    {formatContent(item.content)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={`text-xs italic ${categoryTextTheme.secondary} flex-1 flex items-center justify-center text-center`}
          >
            {error
              ? "Fix error to view outputs"
              : "Connect any node with output"}
          </div>
        )}
      </div>
    );
  },

  // V2U LIFECYCLE: Enhanced event handling
  lifecycle: {
    onMount: async ({ nodeId }) => {
      console.log(`[ViewOutputV2U] Node ${nodeId} mounted`);
    },

    onUnmount: async ({ nodeId }) => {
      console.log(`[ViewOutputV2U] Node ${nodeId} unmounted`);
    },

    onDataChange: async (newData, oldData, { nodeId }) => {
      // Track value display changes for analytics
      const oldCount = oldData.displayedValues?.length || 0;
      const newCount = newData.displayedValues?.length || 0;

      if (oldCount !== newCount) {
        console.log(
          `[ViewOutputV2U] Values changed for ${nodeId}: ${oldCount} -> ${newCount}`
        );
      }
    },

    onValidation: (data) => {
      // V2U: Enhanced validation
      if (!Array.isArray(data.displayedValues)) {
        return "displayedValues must be an array";
      }
      return true;
    },
  },

  // V2U SECURITY: Enterprise-grade configuration
  security: {
    requiresAuth: false,
    permissions: ["node:read"],
    maxExecutionsPerMinute: 1000,
    dataAccessLevel: "read",
  },

  // V2U PERFORMANCE: Optimized configuration
  performance: {
    timeout: 3000,
    maxMemoryMB: 20,
    priority: "normal",
    retryAttempts: 2,
    retryDelay: 1000,
    cacheable: true,
    cacheKeyGenerator: (data) =>
      `viewOutputV2U:${data.displayedValues?.length || 0}`,
  },

  // V2U AUTO-REGISTRATION
  autoRegister: true,
  registryPath: "view/viewOutputV2U",
});
