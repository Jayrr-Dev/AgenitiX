// nodes/CreateText.tsx
"use client";

/* -------------------------------------------------------------------------- */
/*  CreateText - Converted to NodeFactory                                    */
/*  – Creates text output with optional trigger input                        */
/* -------------------------------------------------------------------------- */

import { Position } from "@xyflow/react";
import React, { useRef } from "react";
import {
  createNodeComponent,
  type BaseNodeData,
  type HandleConfig,
} from "../factory/NodeFactory";
import { getSingleInputValue, isTruthyValue } from "../utils/nodeUtils";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface CreateTextData extends BaseNodeData {
  text: string;
  heldText: string;
  // Vibe Mode error injection properties (set by Error Generator)
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// NODE CONFIGURATION
// ============================================================================

const CreateText = createNodeComponent<CreateTextData>({
  nodeType: "createText",
  category: "create", // This will give it blue styling
  displayName: "Create Text",
  defaultData: {
    text: "",
    heldText: "",
  },

  // DEBUG: Log this component loading
  handles: (() => {
    const handles: HandleConfig[] = [
      { id: "b", dataType: "b", position: Position.Left, type: "target" },
      { id: "s", dataType: "s", position: Position.Right, type: "source" },
    ];
    console.log("🏭 [LEGACY CreateText] Loading with handles:", handles);
    return handles;
  })(),

  // Processing logic - preserve the exact original trigger logic + handle JSON updates
  processLogic: ({
    data,
    connections,
    nodesData,
    updateNodeData,
    id,
    setError,
  }) => {
    try {
      // Filter for trigger connections (boolean handle 'b')
      const triggerConnections = connections.filter(
        (c) => c.targetHandle === "b"
      );

      // Get trigger value from connected trigger nodes
      const triggerValue = getSingleInputValue(nodesData);
      const isActive = isTruthyValue(triggerValue);

      // Get the held text (what user has typed or received via JSON in Vibe Mode)
      const outputText = typeof data.heldText === "string" ? data.heldText : "";

      // Validate text length (prevent memory issues)
      if (outputText.length > 100000) {
        throw new Error("Text too long (max 100,000 characters)");
      }

      // Output logic: output text if no trigger connected OR trigger is active
      const finalOutput =
        triggerConnections.length === 0 || isActive ? outputText : "";

      updateNodeData(id, {
        text: finalOutput,
      });
    } catch (updateError) {
      console.error(`CreateText ${id} - Update error:`, updateError);
      const errorMessage =
        updateError instanceof Error ? updateError.message : "Unknown error";
      setError(errorMessage);

      // Try to update with error state
      updateNodeData(id, {
        text: "",
      });
    }
  },

  // Collapsed state rendering with inline text editing
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
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

    // Get error-specific styling
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
          className={`text-xs font-semibold mt-1 mb-1 ${finalError && errorStyle ? errorStyle.text : ""}`}
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
            <CreateTextInput
              data={data}
              updateNodeData={updateNodeData}
              id={id}
            />
          </div>
        )}
      </div>
    );
  },

  // Expanded state rendering with full text editing
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    // Check for Vibe Mode injected error state
    const isVibeError = data.isErrorState === true;
    const vibeErrorMessage = data.error || "Error state active";
    const vibeErrorType = data.errorType || "error";

    // Determine final error state and styling
    const finalError = error || (isVibeError ? vibeErrorMessage : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    // Get error-specific styling
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
          <CreateTextExpanded
            data={data}
            error={finalError}
            errorStyle={errorStyle}
            categoryTextTheme={categoryTextTheme}
            updateNodeData={updateNodeData}
            id={id}
          />
        </div>
      </div>
    );
  },

  // Error recovery data
  errorRecoveryData: {
    text: "",
    heldText: "",
  },
});

// ============================================================================
// HELPER COMPONENTS FOR TEXT EDITING
// ============================================================================

// Collapsed text input component
const CreateTextInput = ({
  data,
  updateNodeData,
  id,
}: {
  data: CreateTextData;
  updateNodeData: (id: string, data: Partial<CreateTextData>) => void;
  id: string;
}) => {
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;

      // Validate input
      if (newText.length > 100000) {
        return; // Just ignore if too long
      }

      // Update held text via factory's updateNodeData
      updateNodeData(id, { heldText: newText });
    } catch (inputError) {
      console.error("CreateText - Input error:", inputError);
    }
  };

  return (
    <textarea
      className="w-full h-8 px-2 py-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 focus:ring-blue-500"
      value={currentText}
      onChange={handleTextChange}
      placeholder="Enter text..."
      style={{
        lineHeight: "1.2",
        fontFamily: "inherit",
      }}
      onFocus={(e) => e.target.select()}
      onWheel={(e) => e.stopPropagation()}
    />
  );
};

// Expanded text input component
const CreateTextExpanded = ({
  data,
  error,
  errorStyle,
  categoryTextTheme,
  updateNodeData,
  id,
}: {
  data: CreateTextData;
  error: string | null;
  errorStyle: {
    text: string;
    bg: string;
    border: string;
    indicator: string;
    ringColor: string;
  } | null;
  categoryTextTheme: any;
  updateNodeData: (id: string, data: Partial<CreateTextData>) => void;
  id: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newText = e.target.value;

      // Validate input
      if (newText.length > 100000) {
        return; // Just ignore if too long
      }

      // Update held text via factory's updateNodeData
      updateNodeData(id, { heldText: newText });
    } catch (inputError) {
      console.error("CreateText - Input error:", inputError);
    }
  };

  return (
    <textarea
      ref={textareaRef}
      className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
        error && errorStyle
          ? `${errorStyle.border} ${errorStyle.text} ${errorStyle.ringColor}`
          : `${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`
      }`}
      value={currentText}
      onChange={handleTextChange}
      placeholder={
        error
          ? "Error state active - text editing disabled"
          : "Enter your text here..."
      }
      disabled={!!error}
      style={{
        lineHeight: "1.4",
        fontFamily: "inherit",
      }}
    />
  );
};

export default CreateText;
