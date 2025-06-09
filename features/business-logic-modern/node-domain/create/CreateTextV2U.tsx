/**
 * CREATE TEXT V2U – Enhanced defineNode() with V2U Architecture
 *
 * ▸ Bridge solution: defineNode() + enterprise styling integration
 * ▸ Maintains V2U architectural integrity
 * ▸ Gets enterprise styling automatically via enhanced defineNode()
 */

"use client";

import { Position } from "@xyflow/react";
import React, { useRef } from "react";

import { useTextInputShortcuts } from "../../infrastructure/flow-engine/hooks/useTextInputShortcuts";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";
import { defineNode } from "../../infrastructure/node-creation";
import { useAutoOptimizedTextInput } from "../../infrastructure/node-creation/core/factory/hooks/performance/useOptimizedTextInput";

// -----------------------------------------------------------------------------
// 1 ▸ Type Definitions
// -----------------------------------------------------------------------------

interface CreateTextV2UData extends BaseNodeData {
  text: string;
  heldText: string;
  /** V2U migration meta */
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
  /** Enhanced error states */
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

type ErrorLevel = NonNullable<CreateTextV2UData["errorType"]> | "local";

interface ErrorStyle {
  text: string;
  bg?: string;
  border?: string;
  indicator: string;
  ringColor?: string;
}

// -----------------------------------------------------------------------------
// 2 ▸ Shared Helpers
// -----------------------------------------------------------------------------

const pickFirstTruthy = (values: any[]) =>
  values.find((v) => v !== undefined && v !== null);

function getSingleInputValue(nodesData: any[]): any {
  const first = nodesData?.[0];
  return first && typeof first === "object"
    ? pickFirstTruthy(Object.values(first))
    : null;
}

const isTruthy = (v: any): boolean =>
  v == null
    ? false
    : typeof v === "string"
      ? v.trim().length > 0
      : typeof v === "object"
        ? Array.isArray(v)
          ? v.length > 0
          : Object.keys(v).length > 0
        : Boolean(v);

const errorStyles: Record<ErrorLevel, ErrorStyle> = {
  warning: {
    text: "text-yellow-700 dark:text-yellow-300",
    indicator: "⚠️",
  },
  error: {
    text: "text-orange-700 dark:text-orange-300",
    indicator: "🚨",
  },
  critical: {
    text: "text-red-700 dark:text-red-300",
    indicator: "💥",
  },
  local: {
    text: "text-orange-700 dark:text-orange-300",
    indicator: "🚨",
  },
};

// -----------------------------------------------------------------------------
// 3 ▸ Custom Text Input Component
// -----------------------------------------------------------------------------

const TextInput: React.FC<{
  /** current node id for hooks */
  id: string;
  data: CreateTextV2UData;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}> = ({ id, data, updateNodeData, disabled, placeholder, className }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  const optimised = useAutoOptimizedTextInput(id, data.heldText || "", (_, d) =>
    updateNodeData(d)
  );

  // Add ergonomic text input shortcuts for fast deletion (matching CreateText)
  const textInputShortcuts = useTextInputShortcuts({
    value: optimised.value,
    setValue: (value: string) => updateNodeData({ heldText: value }),
  });

  // Combined keyboard handler for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cast to work with the hook's expected type
    textInputShortcuts.handleKeyDown(e as any);
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={optimised.value}
        onChange={optimised.onChange}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        style={{
          lineHeight: "1.4",
          fontFamily: "inherit",
          overflow: "auto",
        }}
        onFocus={(e) => e.target.select()}
        onWheel={(e) => e.stopPropagation()}
        title="Fast deletion: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
      />
      {/* Performance indicator */}
      {optimised.isPending && (
        <div className="absolute top-0 right-1 text-xs text-blue-500 opacity-75">
          ⚡
        </div>
      )}
      {/* Validation error */}
      {optimised.validationError && (
        <div className="text-xs text-red-500 mt-1">
          {optimised.validationError}
        </div>
      )}
    </div>
  );
};

// -----------------------------------------------------------------------------
// 4 ▸ Node Renderers
// -----------------------------------------------------------------------------

function CollapsedView(props: {
  data: CreateTextV2UData;
  id: string;
  error: string | null;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
}) {
  const { data, error, updateNodeData, id } = props;

  const currentText = typeof data.heldText === "string" ? data.heldText : "";
  const previewText =
    currentText.length > 20
      ? currentText.substring(0, 20) + "..."
      : currentText;

  // Check for Vibe Mode injected error state
  const isVibeError = data.isErrorState === true;
  const vibeErrorMessage = data.error || "Error state active";
  const vibeErrorType = data.errorType || "error";

  // Determine final error state and styling
  const finalError = error || (isVibeError ? vibeErrorMessage : null);
  const finalErrorType = error ? "local" : vibeErrorType;

  // Get error-specific styling (matching CreateText)
  const getErrorStyling = (errorType: string) => {
    switch (errorType) {
      case "warning":
        return {
          text: "text-yellow-700 dark:text-yellow-300",
          bg: "bg-yellow-50 dark:bg-yellow-900/30",
          border: "border-yellow-300 dark:border-yellow-700",
          indicator: "●",
        };
      case "critical":
        return {
          text: "text-red-700 dark:text-red-300",
          bg: "bg-red-50 dark:bg-red-900/30",
          border: "border-red-300 dark:border-red-700",
          indicator: "●",
        };
      case "error":
      case "local":
      default:
        return {
          text: "text-orange-700 dark:text-orange-300",
          bg: "bg-orange-50 dark:bg-orange-900/30",
          border: "border-orange-300 dark:border-orange-700",
          indicator: "●",
        };
    }
  };

  const errorStyle = finalError ? getErrorStyling(finalErrorType) : null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
      <div
        className={`text-xs font-semibold mt-1 mb-0 ${finalError && errorStyle ? errorStyle.text : ""}`}
      >
        {finalError && errorStyle ? (
          <div className="flex items-center gap-1">
            <span>{errorStyle.indicator}</span>
            <span>
              {finalErrorType === "local"
                ? "Error"
                : finalErrorType.toUpperCase()}
            </span>
          </div>
        ) : (
          "Create Text"
        )}
      </div>
      {finalError && errorStyle ? (
        <div className={`text-xs text-center break-words ${errorStyle.text}`}>
          {finalError}
        </div>
      ) : (
        <div
          className="nodrag nowheel w-full flex-1 flex items-center justify-center"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <TextInput
            id={id}
            data={data}
            updateNodeData={updateNodeData}
            placeholder="Enter text..."
            className="w-full h-8 px-2 pt-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 focus:ring-blue-500"
          />
        </div>
      )}
    </div>
  );
}

function ExpandedView(props: {
  data: CreateTextV2UData;
  id: string;
  error: string | null;
  updateNodeData(partial: Partial<CreateTextV2UData>): void;
  categoryTheme?: Record<string, string>;
  categoryClasses?: Record<string, string>;
}) {
  const { data, error, updateNodeData, id, categoryClasses } = props;

  // Check for Vibe Mode injected error state
  const isVibeError = data.isErrorState === true;
  const vibeErrorMessage = data.error || "Error state active";
  const vibeErrorType = data.errorType || "error";

  // Determine final error state and styling
  const finalError = error || (isVibeError ? vibeErrorMessage : null);
  const finalErrorType = error ? "local" : vibeErrorType;

  // Get error-specific styling (matching CreateText)
  const getErrorStyling = (errorType: string) => {
    switch (errorType) {
      case "warning":
        return {
          text: "text-yellow-700 dark:text-yellow-300",
          bg: "bg-yellow-50 dark:bg-yellow-900/30",
          border: "border-yellow-300 dark:border-yellow-700",
          indicator: "●",
          ringColor: "focus:ring-yellow-500",
        };
      case "critical":
        return {
          text: "text-red-700 dark:text-red-300",
          bg: "bg-red-50 dark:bg-red-900/30",
          border: "border-red-300 dark:border-red-700",
          indicator: "●",
          ringColor: "focus:ring-red-500",
        };
      case "error":
      case "local":
      default:
        return {
          text: "text-orange-700 dark:text-orange-300",
          bg: "bg-orange-50 dark:bg-orange-900/30",
          border: "border-orange-300 dark:border-orange-700",
          indicator: "●",
          ringColor: "focus:ring-orange-500",
        };
    }
  };

  const errorStyle = finalError ? getErrorStyling(finalErrorType) : null;
  const categoryTextTheme = categoryClasses || {
    primary: "text-blue-900 dark:text-blue-100",
    border: "border-blue-300 dark:border-blue-700",
    focus: "focus:ring-blue-500",
  };

  return (
    <div className="flex text-xs flex-col w-auto">
      <div
        className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}
      >
        <span>
          {finalError
            ? `${finalErrorType === "local" ? "Error" : finalErrorType.toUpperCase()}`
            : "Create Text"}
        </span>
        {finalError && errorStyle && (
          <span className={`text-xs ${errorStyle.text}`}>
            {errorStyle.indicator} {finalError.substring(0, 30)}
            {finalError.length > 30 ? "..." : ""}
          </span>
        )}
      </div>

      {finalError && errorStyle && (
        <div
          className={`mb-2 p-2 ${errorStyle.bg} border ${errorStyle.border} rounded text-xs ${errorStyle.text}`}
        >
          <div className="font-semibold mb-1">
            {finalErrorType === "local"
              ? "Error Details:"
              : `${finalErrorType.toUpperCase()} Details:`}
          </div>
          <div className="mb-2">{finalError}</div>
          {isVibeError && (
            <div className="text-xs opacity-75 mt-1">
              ⚡ Set via Vibe Mode from Error Generator
            </div>
          )}
        </div>
      )}

      <div
        className="nodrag nowheel"
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <TextInput
          id={id}
          data={data}
          updateNodeData={updateNodeData}
          disabled={!!finalError}
          placeholder={
            finalError
              ? "Error state active - text editing disabled"
              : "Enter your text here..."
          }
          className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
            finalError && errorStyle
              ? `${errorStyle.border} ${errorStyle.text} ${errorStyle.ringColor}`
              : `${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`
          }`}
        />
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5 ▸ Enhanced defineNode() with V2U Architecture
// -----------------------------------------------------------------------------

export default defineNode<CreateTextV2UData>({
  // ─────────────────────────────────────────── Metadata
  metadata: {
    nodeType: "createTextV2U",
    category: "create",
    displayName: "Create Text (V2U)",
    description:
      "Enhanced text creation node with V2U architecture – auto-integrated with enterprise styling",
    icon: "📝",
    folder: "main",
    version: "2.0.0",
    author: "V2U Migration Team",
    tags: ["text", "input", "v2u", "enterprise-ready"],
  },

  // ─────────────────────────────────────────── Handles
  handles: [
    {
      id: "trigger",
      type: "target",
      position: Position.Left,
      dataType: "boolean",
      description:
        "Optional trigger – when connected, text outputs only when trigger is true",
    },
    {
      id: "text",
      type: "source",
      position: Position.Right,
      dataType: "string",
      description: "Text output",
    },
  ],

  // ─────────────────────────────────────────── Defaults & Size
  defaultData: {
    text: "",
    heldText: "",
    _v2uMigrated: true,
    _v2uMigrationDate: Date.now(),
  },
  size: {
    collapsed: { width: 200, height: 80 },
    expanded: { width: 300, height: 160 },
  },

  // ─────────────────────────────────────────── Processing
  async processLogic({
    data,
    updateNodeData,
    getConnections,
    setError,
    nodeId,
  }) {
    const started = performance.now();
    try {
      const triggerConns = getConnections().filter(
        (c) => c.targetHandle === "trigger"
      );
      const triggerVal = getSingleInputValue([]);
      const isActive = isTruthy(triggerVal);

      const text = data.heldText ?? "";
      if (text.length > 100_000) throw new Error("Text too long (100 k max)");

      const out = triggerConns.length === 0 || isActive ? text : "";
      updateNodeData({ text: out, _v2uMigrated: true });
      setError(null);
    } catch (err: any) {
      console.error(`[CreateTextV2U] ${nodeId} –`, err);
      setError(err.message ?? "Unknown error");
      updateNodeData({
        text: "",
        isErrorState: true,
        error: err.message,
        errorType: "error",
      });
    } finally {
      const ms = performance.now() - started;
      if (ms > 50)
        console.warn(`[CreateTextV2U] slow execution (${ms.toFixed(1)} ms)`);
    }
  },

  // ─────────────────────────────────────────── Renderers
  renderCollapsed: CollapsedView,
  renderExpanded: ExpandedView,

  // ─────────────────────────────────────────── V2U Features
  lifecycle: {
    onMount: async ({ nodeId, emitEvent }) =>
      emitEvent("v2u:node-mounted", { nodeType: "createTextV2U", nodeId }),
    onUnmount: async ({ nodeId, emitEvent }) =>
      emitEvent("v2u:node-unmounted", { nodeType: "createTextV2U", nodeId }),
    onDataChange: async (n, o, { nodeId, emitEvent }) => {
      if (n.heldText !== o.heldText) {
        await emitEvent("v2u:text-changed", {
          nodeId,
          oldLength: o.heldText?.length ?? 0,
          newLength: n.heldText?.length ?? 0,
        });
      }
    },
  },

  // ─────────────────────────────────────────── Enhanced Bridge Features
  // 🚀 Bridge: Enterprise features automatically added by enhanced defineNode()

  // ─────────────────────────────────────────── Registry
  autoRegister: true,
  registryPath: "create/createTextV2U",
});
