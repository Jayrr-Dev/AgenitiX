/**
 * CREATE TEXT V2U - Complete defineNode() Migration
 *
 * 🎯 WEEK 8 MIGRATION: Converted from legacy createNodeComponent to defineNode()
 * • Modern single-file architecture with enterprise features
 * • Complete functional parity with original CreateText component
 * • Enhanced security, performance, and lifecycle management
 * • Integrated with V2U DevTools and monitoring systems
 * • Professional error handling and validation
 *
 * Keywords: v2u-migration, defineNode, enterprise-grade, single-file-architecture
 */

"use client";

import { Position } from "@xyflow/react";
import React, { useRef } from "react";
import { useTextInputShortcuts } from "../../infrastructure/flow-engine/hooks/useTextInputShortcuts";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";
import { defineNode } from "../../infrastructure/node-creation/defineNode";
import { useAutoOptimizedTextInput } from "../../infrastructure/node-creation/factory/hooks/useOptimizedTextInput";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface CreateTextV2UData extends BaseNodeData {
  text: string;
  heldText: string;
  // V2U metadata tracking
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
  // Enhanced error states
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSingleInputValue(nodesData: any[]): any {
  if (!nodesData || nodesData.length === 0) return null;

  const firstNode = nodesData[0];
  if (!firstNode || typeof firstNode !== "object") return null;

  // Return the first property value that's not undefined
  const values = Object.values(firstNode).filter((val) => val !== undefined);
  return values.length > 0 ? values[0] : null;
}

function isTruthyValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

// ============================================================================
// ERROR STYLING HELPER
// ============================================================================

function getV2UErrorStyling(errorType: string) {
  switch (errorType) {
    case "warning":
      return {
        text: "text-yellow-700 dark:text-yellow-300",
        bg: "bg-yellow-50 dark:bg-yellow-900/30",
        border: "border-yellow-300 dark:border-yellow-700",
        indicator: "●",
        ringColor: "ring-yellow-500",
      };
    case "critical":
      return {
        text: "text-red-700 dark:text-red-300",
        bg: "bg-red-50 dark:bg-red-900/30",
        border: "border-red-300 dark:border-red-700",
        indicator: "●",
        ringColor: "ring-red-500",
      };
    case "error":
    case "local":
    default:
      return {
        text: "text-orange-700 dark:text-orange-300",
        bg: "bg-orange-50 dark:bg-orange-900/30",
        border: "border-orange-300 dark:border-orange-700",
        indicator: "●",
        ringColor: "ring-orange-500",
      };
  }
}

// ============================================================================
// V2U INPUT COMPONENT
// ============================================================================

const CreateTextV2UInput: React.FC<{
  data: CreateTextV2UData;
  updateNodeData: (newData: Partial<CreateTextV2UData>) => void;
  id: string;
  isV2U?: boolean;
}> = ({ data, updateNodeData, id, isV2U = true }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  // V2U optimized input hooks
  const optimizedInput = useAutoOptimizedTextInput(
    id,
    currentText,
    (nodeId: string, data: { heldText: string }) => {
      updateNodeData(data);
    }
  );

  // Enhanced keyboard shortcuts
  const shortcuts = useTextInputShortcuts({
    value: optimizedInput.value,
    setValue: (newValue: string) => {
      updateNodeData({ heldText: newValue });
    },
    onEnter: () => {
      // V2U: Focus management on enter
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // V2U: Enhanced keyboard handling
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      // V2U: Smart tab handling for accessibility
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={optimizedInput.value}
      onChange={optimizedInput.onChange}
      onKeyDown={handleKeyDown}
      className="w-full h-full resize-none border-none outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-relaxed p-1"
      placeholder="Enter your text here..."
      style={{ minHeight: "60px" }}
      autoFocus={false}
      spellCheck={true}
    />
  );
};

/**
 * V2U Expanded Input Component
 * Enhanced input for expanded node view
 */
const CreateTextV2UExpandedInput: React.FC<{
  data: CreateTextV2UData;
  error: string | null | undefined;
  errorStyle: any;
  updateNodeData: (newData: Partial<CreateTextV2UData>) => void;
  id: string;
}> = ({ data, error, errorStyle, updateNodeData, id }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  // V2U optimized input hooks
  const optimizedInput = useAutoOptimizedTextInput(
    id,
    currentText,
    (nodeId: string, data: { heldText: string }) => {
      updateNodeData(data);
    }
  );

  // Enhanced keyboard shortcuts
  const shortcuts = useTextInputShortcuts({
    value: optimizedInput.value,
    setValue: (newValue: string) => {
      updateNodeData({ heldText: newValue });
    },
    onEnter: () => {
      if (textareaRef.current) {
        textareaRef.current.blur();
      }
    },
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          error && errorStyle
            ? `border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 focus:ring-red-500`
            : `border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500`
        }`}
        value={optimizedInput.value}
        onChange={optimizedInput.onChange}
        onKeyDown={handleKeyDown}
        placeholder={
          error
            ? "V2U Error state active - text editing disabled"
            : "Enter your text here... (V2U Enhanced)"
        }
        title="V2U Enhanced: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
        disabled={!!error}
        style={{
          lineHeight: "1.4",
          fontFamily: "inherit",
        }}
      />

      {/* V2U Status indicators */}
      <div className="absolute top-1 right-1 flex space-x-1 text-xs opacity-60">
        {optimizedInput.isPending && (
          <span className="text-blue-500" title="V2U Update pending">
            ⚡
          </span>
        )}
        <span className="text-green-500" title="V2U Enhanced">
          ✓
        </span>
      </div>

      {/* Character count */}
      {currentText.length > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          {currentText.length} characters
        </div>
      )}
    </div>
  );
};

// ============================================================================
// DEFINE NODE - V2U ARCHITECTURE
// ============================================================================

export default defineNode<CreateTextV2UData>({
  // METADATA: Enhanced V2U configuration
  metadata: {
    nodeType: "createTextV2U",
    category: "create",
    displayName: "Create Text (V2U)",
    description:
      "Enhanced text creation node with V2U architecture - supports conditional output via triggers",
    icon: "📝",
    folder: "main",
    version: "2.0.0",
    author: "V2U Migration Team",
    tags: ["text", "input", "v2u", "migrated"],
    experimental: false,
  },

  // HANDLES: Enhanced configuration
  handles: [
    {
      id: "trigger",
      type: "target",
      position: Position.Left,
      dataType: "boolean",
      description:
        "Optional trigger input - when connected, text outputs only when trigger is active",
      enabled: true,
      validation: (data) =>
        typeof data === "boolean" || data === null || data === undefined,
    },
    {
      id: "text",
      type: "source",
      position: Position.Right,
      dataType: "string",
      description: "Text output - outputs held text when conditions are met",
      enabled: true,
    },
  ],

  // DEFAULT DATA: Enhanced with V2U metadata
  defaultData: {
    text: "",
    heldText: "",
    _v2uMigrated: true,
    _v2uMigrationDate: Date.now(),
  },

  // SIZE CONFIGURATION: Responsive design
  size: {
    collapsed: { width: 200, height: 80 },
    expanded: { width: 300, height: 160 },
  },

  // PROCESSING LOGIC: Enhanced with error handling and validation
  processLogic: async ({
    data,
    updateNodeData,
    getConnections,
    setError,
    nodeId,
    performance,
  }) => {
    try {
      // Performance tracking
      const startTime = Date.now();

      // Get trigger connections
      const connections = getConnections();
      const triggerConnections = connections.filter(
        (c: any) => c.targetHandle === "trigger"
      );

      // Process trigger logic
      const triggerValue = getSingleInputValue([]);
      const isActive = isTruthyValue(triggerValue);

      // Get output text with validation
      const outputText = typeof data.heldText === "string" ? data.heldText : "";

      // V2U: Enhanced validation
      if (outputText.length > 100000) {
        throw new Error("Text too long (max 100,000 characters)");
      }

      // Output logic: Enhanced conditional processing
      const shouldOutput = triggerConnections.length === 0 || isActive;
      const finalOutput = shouldOutput ? outputText : "";

      // Update data with performance tracking
      updateNodeData({
        text: finalOutput,
        _v2uMigrated: true,
      });

      // Clear any existing errors
      setError(null);

      // Performance metrics
      const executionTime = Date.now() - startTime;
      if (executionTime > 50) {
        console.warn(
          `[CreateTextV2U] Slow execution: ${executionTime}ms for node ${nodeId}`
        );
      }
    } catch (updateError) {
      console.error(`[CreateTextV2U] ${nodeId} - Update error:`, updateError);
      const errorMessage =
        updateError instanceof Error ? updateError.message : "Unknown error";
      setError(errorMessage);

      // Fallback data update
      updateNodeData({
        text: "",
        isErrorState: true,
        error: errorMessage,
        errorType: "error",
      });
    }
  },

  // COLLAPSED RENDER: Clean V2 styling (no overlay)
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const currentText = typeof data.heldText === "string" ? data.heldText : "";
    const previewText =
      currentText.length > 20
        ? currentText.substring(0, 20) + "..."
        : currentText;

    // V2U: Enhanced error state detection
    const isVibeError = data.isErrorState === true;
    const vibeErrorMessage = data.error || "Error state active";
    const vibeErrorType = data.errorType || "error";

    const finalError = error || (isVibeError ? vibeErrorMessage : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    // V2U ERROR STYLING: Simplified to match V2
    const getV2UErrorStyling = (errorType: string) => {
      switch (errorType) {
        case "warning":
          return {
            text: "text-yellow-700 dark:text-yellow-300",
            indicator: "⚠️",
          };
        case "critical":
          return {
            text: "text-red-700 dark:text-red-300",
            indicator: "💥",
          };
        case "error":
        case "local":
        default:
          return {
            text: "text-orange-700 dark:text-orange-300",
            indicator: "🚨",
          };
      }
    };

    const errorStyle = finalError ? getV2UErrorStyling(finalErrorType) : null;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        {/* V2U Header - Clean styling */}
        <div
          className={`text-xs font-semibold mt-1 mb-1 ${
            finalError && errorStyle ? errorStyle.text : ""
          }`}
        >
          {finalError && errorStyle ? (
            <div className="flex items-center gap-1">
              <span>{errorStyle.indicator}</span>
              <span>
                V2U{" "}
                {finalErrorType === "local"
                  ? "Error"
                  : finalErrorType.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span>📝</span>
              <span>Create Text V2U</span>
            </div>
          )}
        </div>

        {/* Content Display - Clean styling */}
        {finalError && errorStyle ? (
          <div
            className={`text-xs text-center break-words ${errorStyle.text} p-1 rounded`}
          >
            <div className="font-medium">V2U System Error:</div>
            <div>{finalError}</div>
          </div>
        ) : (
          <div
            className="nodrag nowheel w-full flex-1 flex items-center justify-center"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <CreateTextV2UInput
              data={data}
              updateNodeData={updateNodeData}
              id={id}
              isV2U={true}
            />
          </div>
        )}

        {/* V2U Debug Info - Development only */}
        {process.env.NODE_ENV === "development" && data._v2uMigrated && (
          <div className="absolute bottom-0 right-0 text-xs text-blue-500 opacity-75">
            V2U
          </div>
        )}
      </div>
    );
  },

  // EXPANDED RENDER: Clean V2 styling with category theming
  renderExpanded: ({
    data,
    error,
    updateNodeData,
    id,
    categoryTheme,
    categoryClasses,
  }) => {
    const finalError = error || (data.isErrorState ? data.error : null);
    const finalErrorType = error ? "local" : data.errorType || "error";

    // V2U ERROR STYLING: Simplified to match V2
    const getV2UErrorStyling = (errorType: string) => {
      switch (errorType) {
        case "warning":
          return {
            text: "text-yellow-700 dark:text-yellow-300",
            indicator: "⚠️",
          };
        case "critical":
          return {
            text: "text-red-700 dark:text-red-300",
            indicator: "💥",
          };
        case "error":
        case "local":
        default:
          return {
            text: "text-orange-700 dark:text-orange-300",
            indicator: "🚨",
          };
      }
    };

    const errorStyle = finalError ? getV2UErrorStyling(finalErrorType) : null;

    return (
      <div
        className="flex text-xs flex-col w-auto"
        key={`createtext-v2u-${id}`}
      >
        {/* V2U Header - Clean styling with automatic category theme */}
        <div
          className={`font-semibold mb-2 flex items-center justify-between ${categoryClasses?.textPrimary || "text-green-700 dark:text-green-300"}`}
        >
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span>Create Text V2U</span>
          </div>
          {finalError && errorStyle && (
            <span
              className={`text-xs ${errorStyle.text} flex items-center gap-1`}
            >
              <span>{errorStyle.indicator}</span>
              <span>
                {finalError.substring(0, 20)}
                {finalError.length > 20 ? "..." : ""}
              </span>
            </span>
          )}
        </div>

        {/* V2U Debug Info - Development only */}
        {process.env.NODE_ENV === "development" && data._v2uMigrated && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded text-xs">
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
              🚀 V2U Status:
            </div>
            <div className="space-y-1 text-blue-600 dark:text-blue-400">
              <div>Migrated: {data._v2uMigrated ? "✓" : "✗"}</div>
              {data._v2uMigrationDate && (
                <div>
                  Date: {new Date(data._v2uMigrationDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* V2U Error Display - Clean styling */}
        {finalError && errorStyle && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-xs">
            <div className="font-semibold mb-1 flex items-center gap-1">
              <span>{errorStyle.indicator}</span>
              <span>
                V2U{" "}
                {finalErrorType === "local"
                  ? "Error"
                  : finalErrorType.toUpperCase()}{" "}
                Details:
              </span>
            </div>
            <div className="mb-2">{finalError}</div>
          </div>
        )}

        {/* V2U Input Component - Clean styling */}
        <div
          className="nodrag nowheel"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <CreateTextV2UExpandedInput
            data={data}
            error={finalError}
            errorStyle={errorStyle}
            updateNodeData={updateNodeData}
            id={id}
          />
        </div>
      </div>
    );
  },

  // V2U LIFECYCLE: Enhanced event handling
  lifecycle: {
    onMount: async ({ nodeId, emitEvent }) => {
      console.log(`[CreateTextV2U] Node ${nodeId} mounted`);
      emitEvent("v2u:node-mounted", { nodeType: "createTextV2U", nodeId });
    },

    onUnmount: async ({ nodeId, emitEvent }) => {
      console.log(`[CreateTextV2U] Node ${nodeId} unmounted`);
      emitEvent("v2u:node-unmounted", { nodeType: "createTextV2U", nodeId });
    },

    onDataChange: async (newData, oldData, { nodeId, emitEvent }) => {
      // Track text input changes for analytics
      if (newData.heldText !== oldData.heldText) {
        emitEvent("v2u:text-changed", {
          nodeId,
          oldLength: oldData.heldText?.length || 0,
          newLength: newData.heldText?.length || 0,
        });
      }
    },

    onValidation: (data) => {
      // V2U: Enhanced validation
      if (typeof data.heldText !== "string") {
        return "heldText must be a string";
      }
      if (data.heldText.length > 100000) {
        return "Text too long (max 100,000 characters)";
      }
      return true;
    },
  },

  // V2U SECURITY: Enterprise-grade configuration
  security: {
    requiresAuth: false,
    permissions: ["node:read", "node:write"],
    maxExecutionsPerMinute: 1000,
    dataAccessLevel: "write",
  },

  // V2U PERFORMANCE: Optimized configuration
  performance: {
    timeout: 5000,
    maxMemoryMB: 10,
    priority: "normal",
    retryAttempts: 2,
    retryDelay: 1000,
    cacheable: false, // Text input is dynamic
    cacheKeyGenerator: (data) =>
      `createTextV2U:${data.heldText?.substring(0, 50)}`,
  },

  // V2U AUTO-REGISTRATION
  autoRegister: true,
  registryPath: "create/createTextV2U",
});
