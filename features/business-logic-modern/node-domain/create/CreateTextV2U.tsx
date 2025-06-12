/**
 * CREATE TEXT V2U – Pure React Component
 *
 * ▸ Modern, declarative node built with pure React and composed UI components.
 * ▸ All configuration is driven by the associated `meta.json` file.
 * ▸ Styling is handled directly with Tailwind CSS.
 */

"use client";

import { NodeProps } from "@xyflow/react";
import React, { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import { NodeScaffold } from "@/components/nodes/NodeScaffold";
import { useNodeData } from "@/hooks/useNodeData";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";

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
  const [localText, setLocalText] = useState(data.heldText || "");
  const [debouncedText] = useDebounce(localText, 500);

  // Effect to update the global store when debounced text changes
  useEffect(() => {
    if (debouncedText !== data.heldText) {
      updateNodeData({ heldText: debouncedText });
    }
  }, [debouncedText, data.heldText, updateNodeData]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Blur on Enter, but allow Shift+Enter for newlines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
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
        title="Press Enter to unfocus"
      />
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
  const { data, error, updateNodeData, id, categoryTheme, categoryClasses } = props;

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
// 5 ▸ Main Node Component
// -----------------------------------------------------------------------------

const CreateTextV2UNode: React.FC<NodeProps> = ({
  id,
  data,
  type,
  selected = false,
}) => {
  const { nodeData, updateNodeData } = useNodeData(id, data);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ensure nodeData has the correct type by merging with defaults
  const safeNodeData: CreateTextV2UData = {
    text: "",
    heldText: "",
    isActive: true,
    ...nodeData,
  } as CreateTextV2UData;

  const derivedError =
    safeNodeData.error || (safeNodeData.isErrorState ? "Error state active" : null);

  const onToggleCollapse = () => setIsCollapsed((prev) => !prev);

  // Determine node states for theming
  const isError = !!derivedError;
  const isActive = safeNodeData.isActive ?? true; // Default to active

  return (
    <NodeScaffold
      nodeId={id}
      nodeType={type}
      isCollapsed={isCollapsed}
      onToggleCollapse={onToggleCollapse}
      isSelected={selected}
      isError={isError}
      isActive={isActive}
    >
      {isCollapsed ? (
        <CollapsedView
          id={id}
          data={safeNodeData}
          error={derivedError}
          updateNodeData={updateNodeData}
        />
      ) : (
        <ExpandedView
          id={id}
          data={safeNodeData}
          error={derivedError}
          updateNodeData={updateNodeData}
        />
      )}
    </NodeScaffold>
  );
};

export default CreateTextV2UNode;
