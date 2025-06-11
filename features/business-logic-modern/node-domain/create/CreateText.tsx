/**
 * CREATE TEXT NODE - Text input and creation component
 *
 * • Text creation node with inline editing and trigger-based output control
 * • Supports boolean trigger connections for conditional text output
 * • Factory-created component with comprehensive error handling
 * • Enhanced input validation and memory-safe text processing
 * • Vibe mode error injection support for testing scenarios
 * • Integrated with category registry for enhanced theming and validation
 *
 * Keywords: text-creation, inline-editing, triggers, error-handling, factory, validation, category-registry
 */

"use client";

/* -------------------------------------------------------------------------- */
/*  CreateTextRefactor - Enterprise Factory Implementation                    */
/*  – Carbon copy of CreateText using new refactored factory system          */
/*  – Preserves all styling, functionality, and error handling               */
/* -------------------------------------------------------------------------- */

import { useRef } from "react";
import { useTextInputShortcuts } from "../../infrastructure/flow-engine/hooks/useTextInputShortcuts";
import { getNodeHandles } from "../../infrastructure/node-creation/core/factory";
import { STANDARD_SIZE_PATTERNS } from "../../infrastructure/node-creation/core/factory/constants/sizes";
import {
  useAutoOptimizedTextInput,
  useHighPerformanceTextInput,
} from "../../infrastructure/node-creation/core/factory/hooks/performance/useOptimizedTextInput";
import {
  createNodeComponent,
  type BaseNodeData,
  type HandleConfig,
} from "../../infrastructure/node-creation/core/factory/NodeFactory";

// MODERN FACTORY INTEGRATION

// ============================================================================
// DEBUG: IDENTIFY COMPONENT USAGE
// ============================================================================

// ============================================================================
// NODE DATA INTERFACE - Enhanced with category registry integration
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
// ENTERPRISE NODE CONFIGURATION - Enhanced Factory with Registry Integration
// ============================================================================

// LOAD HANDLES FROM CENTRALIZED CONSTANTS - No circular dependency
const nodeHandles: HandleConfig[] = getNodeHandles("createText");
// Debug logging removed for cleaner console

const CreateText = createNodeComponent<CreateTextData>({
  nodeType: "createText", // Match the registry nodeType
  category: "create", // Enhanced category registry integration
  displayName: "Create Text",
  defaultData: {
    text: "",
    heldText: "",
  },

  // Enhanced size configuration using new standards (wide text node pattern)
  size: STANDARD_SIZE_PATTERNS.WIDE_TEXT,

  // ✨ HANDLES LOADED FROM CENTRALIZED CONSTANTS (above)
  handles: nodeHandles,

  // PROCESSING LOGIC: Enhanced trigger logic with registry integration
  processLogic: ({
    data,
    connections,
    nodesData,
    updateNodeData,
    id,
    setError,
  }) => {
    try {
      // Filter for trigger connections (boolean handle 'trigger')
      const triggerConnections = connections.filter(
        (c) => c.targetHandle === "trigger"
      );

      // Get trigger value from connected trigger nodes
      const triggerValue = getSingleInputValue(nodesData);
      const isActive = isTruthyValue(triggerValue);

      // Get the held text (what user has typed)
      const outputText = typeof data.heldText === "string" ? data.heldText : "";

      // Validate text length (prevent memory issues)
      if (outputText.length > 100000) {
        throw new Error("Text too long (max 100,000 characters)");
      }

      // Output logic: output text if no trigger connected OR trigger is active
      const shouldOutput = triggerConnections.length === 0 || isActive;
      const finalOutput = shouldOutput ? outputText : "";

      updateNodeData(id, {
        text: finalOutput,
      });

      // Clear any existing errors
      setError(null);
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

  // COLLAPSED STATE: Inline text editing with full error handling
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

    // Get error-specific styling (identical to original)
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

  // EXPANDED STATE: Full text editing with comprehensive error display
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    // Check for Vibe Mode injected error state
    const isVibeError = data.isErrorState === true;
    const vibeErrorMessage = data.error || "Error state active";
    const vibeErrorType = data.errorType || "error";

    // Determine final error state and styling
    const finalError = error || (isVibeError ? vibeErrorMessage : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    // Get error-specific styling (identical to original)
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

  // ERROR RECOVERY: Reset to clean state
  errorRecoveryData: {
    text: "",
    heldText: "",
  },
});

// ============================================================================
// HELPER COMPONENTS FOR TEXT EDITING - CARBON COPY WITH ENTERPRISE BENEFITS
// ============================================================================

// COLLAPSED TEXT INPUT: Enterprise-optimized with debouncing and performance monitoring
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

  // Use optimized text input hook with smart defaults
  const optimizedInput = useHighPerformanceTextInput(
    id,
    currentText,
    updateNodeData
  );

  // Add ergonomic text input shortcuts for fast deletion
  const textInputShortcuts = useTextInputShortcuts({
    value: currentText,
    setValue: (value: string) => updateNodeData(id, { heldText: value }),
  });

  // Combined keyboard handler for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cast to work with the hook's expected type
    textInputShortcuts.handleKeyDown(e as any);
  };

  return (
    <div className="relative">
      <textarea
        className="w-full h-8 px-2 py-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 focus:ring-blue-500"
        value={optimizedInput.value}
        onChange={optimizedInput.onChange}
        onKeyDown={handleKeyDown}
        placeholder="Enter text..."
        title="Fast deletion: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
        style={{
          lineHeight: "1.2",
          fontFamily: "inherit",
        }}
        onFocus={(e) => e.target.select()}
        onWheel={(e) => e.stopPropagation()}
      />
      {/* Performance indicator */}
      {optimizedInput.isPending && (
        <div className="absolute top-0 right-1 text-xs text-blue-500 opacity-75">
          ⚡
        </div>
      )}
      {/* Validation error */}
      {optimizedInput.validationError && (
        <div className="text-xs text-red-500 mt-1">
          {optimizedInput.validationError}
        </div>
      )}
    </div>
  );
};

// EXPANDED TEXT INPUT: Full-featured text editing with enterprise optimizations
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

  // Use auto-optimized text input for larger text areas
  const optimizedInput = useAutoOptimizedTextInput(
    id,
    currentText,
    updateNodeData
  );

  // Add ergonomic text input shortcuts for fast deletion
  const textInputShortcuts = useTextInputShortcuts({
    value: currentText,
    setValue: (value: string) => updateNodeData(id, { heldText: value }),
  });

  // Combined keyboard handler for textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Cast to work with the hook's expected type
    textInputShortcuts.handleKeyDown(e as any);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          error && errorStyle
            ? `${errorStyle.border} ${errorStyle.text} ${errorStyle.ringColor}`
            : `${categoryTextTheme.border} ${categoryTextTheme.primary} ${categoryTextTheme.focus}`
        }`}
        value={optimizedInput.value}
        onChange={optimizedInput.onChange}
        onKeyDown={handleKeyDown}
        placeholder={
          error
            ? "Error state active - text editing disabled"
            : "Enter your text here..."
        }
        title="Fast deletion: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
        disabled={!!error}
        style={{
          lineHeight: "1.4",
          fontFamily: "inherit",
        }}
      />
      {/* Performance metrics and indicators */}
      <div className="absolute top-1 right-1 flex space-x-1 text-xs opacity-60">
        {optimizedInput.isPending && (
          <span className="text-blue-500" title="Update pending">
            ⚡
          </span>
        )}
        {optimizedInput.metrics.charactersPerSecond > 10 && (
          <span className="text-green-500" title="High-speed typing detected">
            🚀
          </span>
        )}
        {optimizedInput.metrics.errorCount > 0 && (
          <span
            className="text-red-500"
            title={`${optimizedInput.metrics.errorCount} errors`}
          >
            ⚠️
          </span>
        )}
      </div>
      {/* Validation error display */}
      {optimizedInput.validationError && (
        <div className="text-xs text-red-500 mt-1 p-1 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="font-medium">Input Error:</span>{" "}
          {optimizedInput.validationError}
        </div>
      )}
      {/* Performance metrics (development only) */}
      {process.env.NODE_ENV === "development" &&
        optimizedInput.metrics.updateCount > 0 && (
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <div>Updates: {optimizedInput.metrics.updateCount}</div>
            <div>
              Avg time: {optimizedInput.metrics.averageUpdateTime.toFixed(1)}ms
            </div>
            {optimizedInput.metrics.charactersPerSecond > 0 && (
              <div>
                Speed: {optimizedInput.metrics.charactersPerSecond} chars/sec
              </div>
            )}
          </div>
        )}
    </div>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// UTILITY FUNCTIONS - Fixed trigger logic
function getSingleInputValue(nodesData: any[]): any {
  if (!nodesData || nodesData.length === 0) return null;

  // Get the first node's output value
  const firstNode = nodesData[0];
  if (!firstNode || !firstNode.data) return null;

  // ENHANCED: Check multiple properties for trigger values
  // Priority order: outputValue, triggered, value, output, text
  if ("outputValue" in firstNode.data) return firstNode.data.outputValue;
  if ("triggered" in firstNode.data) return firstNode.data.triggered;
  if ("value" in firstNode.data) return firstNode.data.value;
  if ("output" in firstNode.data) return firstNode.data.output;
  if ("text" in firstNode.data) return firstNode.data.text;

  return null;
}

function isTruthyValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return trimmed !== "" && trimmed !== "false" && trimmed !== "0";
  }
  if (typeof value === "number") return value !== 0 && !isNaN(value);
  return Boolean(value);
}

export default CreateText;
