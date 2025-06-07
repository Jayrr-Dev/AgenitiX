/**
 * CREATE TEXT V2 NODE - Pure V2 Registry System Implementation
 *
 * 🚀 TESTING THE V2 SYSTEM - This component ONLY uses the new V2 registry API
 * • Demonstrates the modern registry approach vs legacy compatibility layer
 * • Uses Category.get(), Node.get(), Inspector.get() instead of legacy functions
 * • Shows proper V2 initialization with ready() Promise pattern
 * • Type-safe operations with proper error handling
 * • Zero legacy function dependencies
 *
 * Keywords: v2-registry, modern-api, type-safe, promise-based, clean-architecture
 */

"use client";

/* -------------------------------------------------------------------------- */
/*  CreateTextV2 - Pure V2 System Implementation                             */
/*  – Uses ONLY the new V2 registry API                                      */
/*  – Zero legacy function dependencies                                      */
/*  – Demonstrates the modern architecture                                   */
/* -------------------------------------------------------------------------- */

import { Position } from "@xyflow/react";
import { useEffect, useRef, useState } from "react";

// V2 REGISTRY IMPORTS - Modern API only
import {
  Category,
  Node,
  normaliseHandleType,
  ready,
  stats,
} from "../../infrastructure/node-creation/json-node-registry/unifiedRegistry";

// FACTORY INTEGRATION - Modern factory system
import {
  createNodeComponent,
  type BaseNodeData,
  type HandleConfig,
} from "../../infrastructure/node-creation/factory/NodeFactory";

// MODERN HOOKS - Factory hooks for optimized input handling
import { useTextInputShortcuts } from "../../infrastructure/flow-engine/hooks/useTextInputShortcuts";
import {
  useAutoOptimizedTextInput,
  useHighPerformanceTextInput,
} from "../../infrastructure/node-creation/factory/hooks/useOptimizedTextInput";

// MODERN CONSTANTS - Factory size patterns
import { STANDARD_SIZE_PATTERNS } from "../../infrastructure/node-creation/factory/constants/sizes";

// ============================================================================
// V2 REGISTRY INITIALIZATION & DEBUGGING
// ============================================================================

/**
 * V2 Registry Initialization Hook
 * Demonstrates proper V2 initialization pattern
 */
function useV2Registry() {
  const [isReady, setIsReady] = useState(false);
  const [registryStats, setRegistryStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    // V2 INITIALIZATION: Use ready() Promise instead of legacy initialization
    ready()
      .then(() => {
        if (!mounted) return;

        console.log("🚀 [CreateTextV2] V2 Registry initialized successfully");

        // V2 STATS: Use modern stats() function
        const currentStats = stats();
        setRegistryStats(currentStats);
        setIsReady(true);

        console.log("📊 [CreateTextV2] Registry stats:", currentStats);
      })
      .catch((err) => {
        if (!mounted) return;

        console.error(
          "❌ [CreateTextV2] V2 Registry initialization failed:",
          err
        );
        setError(err.message || "Registry initialization failed");
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, registryStats, error };
}

/**
 * V2 Node Metadata Hook
 * Demonstrates V2 API usage for node information
 */
function useV2NodeMetadata(nodeType: string) {
  const [metadata, setMetadata] = useState<any>(null);
  const [category, setCategory] = useState<any>(null);
  const [handles, setHandles] = useState<HandleConfig[]>([]);

  useEffect(() => {
    // V2 NODE API: Use Node.get() instead of getNodeMetadata()
    const nodeData = Node.get(nodeType);
    if (nodeData) {
      setMetadata(nodeData);
      console.log("🔍 [CreateTextV2] Node metadata via V2 API:", nodeData);

      // V2 CATEGORY API: Use Category.get() instead of getCategoryMetadata()
      const categoryData = Category.get(nodeData.category);
      if (categoryData) {
        setCategory(categoryData);
        console.log(
          "📁 [CreateTextV2] Category metadata via V2 API:",
          categoryData
        );
      }

      // V2 HANDLES: Extract handles directly from node registration
      if (nodeData.handles && Array.isArray(nodeData.handles)) {
        const processedHandles: HandleConfig[] = nodeData.handles.map(
          (handle: any) => ({
            id: handle.id,
            dataType: normaliseHandleType(
              handle.dataType
            ) as HandleConfig["dataType"], // V2 normalization with proper typing
            position:
              handle.position === "left"
                ? Position.Left
                : handle.position === "right"
                  ? Position.Right
                  : handle.position === "top"
                    ? Position.Top
                    : handle.position === "bottom"
                      ? Position.Bottom
                      : handle.position,
            type: handle.type as HandleConfig["type"],
          })
        );

        setHandles(processedHandles);
        console.log("🔗 [CreateTextV2] Handles via V2 API:", processedHandles);
      }
    } else {
      console.warn(
        "⚠️ [CreateTextV2] Node not found in V2 registry:",
        nodeType
      );
    }
  }, [nodeType]);

  return { metadata, category, handles };
}

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface CreateTextV2Data extends BaseNodeData {
  text: string;
  heldText: string;
  // V2 metadata tracking
  _v2RegistryVersion?: string;
  _v2CreatedAt?: number;
  // Error states
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// V2 COMPONENT CONFIGURATION
// ============================================================================

/**
 * V2 Synchronous Fallback Configuration
 * Used when registry isn't ready yet - provides safe defaults
 * FIXED: No longer depends on registry during module initialization
 */
function createV2FallbackConfiguration() {
  return {
    nodeType: "createTextV2" as const,
    category: "create" as const,
    displayName: "Create Text V2",
    defaultData: {
      text: "",
      heldText: "",
      _v2RegistryVersion: "2.0.0",
      _v2CreatedAt: Date.now(),
    } as CreateTextV2Data,
    size: STANDARD_SIZE_PATTERNS.WIDE_TEXT,
    handles: [
      {
        id: "trigger",
        dataType: "b" as const,
        position: Position.Left,
        type: "target" as const,
      },
      {
        id: "output",
        dataType: "s" as const,
        position: Position.Right,
        type: "source" as const,
      },
    ] as HandleConfig[],
  };
}

// ============================================================================
// V2 COMPONENT CREATION
// ============================================================================

const CreateTextV2 = createNodeComponent<CreateTextV2Data>({
  ...createV2FallbackConfiguration(),

  // V2 PROCESSING LOGIC: Enhanced with registry integration
  processLogic: ({
    data,
    connections,
    nodesData,
    updateNodeData,
    id,
    setError,
  }) => {
    try {
      // V2 TRIGGER LOGIC: Enhanced trigger handling
      const triggerConnections = connections.filter(
        (c) => c.targetHandle === "trigger"
      );

      // Get trigger value using V2 patterns
      const triggerValue = getSingleInputValue(nodesData);
      const isActive = isTruthyValue(triggerValue);

      // V2 TEXT PROCESSING: Enhanced validation
      const outputText = typeof data.heldText === "string" ? data.heldText : "";

      // V2 VALIDATION: Enhanced memory protection
      if (outputText.length > 100000) {
        throw new Error("Text too long (max 100,000 characters)");
      }

      // V2 OUTPUT LOGIC: Enhanced conditional output
      const shouldOutput = triggerConnections.length === 0 || isActive;
      const finalOutput = shouldOutput ? outputText : "";

      // V2 UPDATE: Include registry metadata
      updateNodeData(id, {
        text: finalOutput,
        _v2RegistryVersion: "2.0.0", // Track V2 usage
      });

      setError(null);

      console.log("⚙️ [CreateTextV2] Processing complete:", {
        nodeId: id,
        triggerConnections: triggerConnections.length,
        isActive,
        outputLength: finalOutput.length,
        v2Version: "2.0.0",
      });
    } catch (updateError) {
      console.error(`❌ [CreateTextV2] ${id} - Processing error:`, updateError);
      const errorMessage =
        updateError instanceof Error ? updateError.message : "Unknown error";
      setError(errorMessage);

      updateNodeData(id, {
        text: "",
        error: errorMessage,
        isErrorState: true,
        errorType: "error",
      });
    }
  },

  // V2 COLLAPSED RENDER: Enhanced with V2 debugging
  renderCollapsed: ({ data, error, updateNodeData, id }) => {
    const { isReady, registryStats, error: registryError } = useV2Registry();
    const { metadata, category } = useV2NodeMetadata("createText");

    const currentText = typeof data.heldText === "string" ? data.heldText : "";
    const previewText =
      currentText.length > 20
        ? currentText.substring(0, 20) + "..."
        : currentText;

    // V2 ERROR HANDLING: Enhanced error display
    const isVibeError = data.isErrorState === true;
    const vibeErrorMessage = data.error || "Error state active";
    const vibeErrorType = data.errorType || "error";

    const finalError =
      error || (isVibeError ? vibeErrorMessage : null) || registryError;
    const finalErrorType = error ? "local" : vibeErrorType;

    // V2 STYLING: Enhanced with category theming
    const getV2ErrorStyling = (errorType: string) => {
      switch (errorType) {
        case "warning":
          return {
            text: "text-yellow-700 dark:text-yellow-300",
            bg: "bg-yellow-50 dark:bg-yellow-900/30",
            border: "border-yellow-300 dark:border-yellow-700",
            indicator: "⚠️",
          };
        case "critical":
          return {
            text: "text-red-700 dark:text-red-300",
            bg: "bg-red-50 dark:bg-red-900/30",
            border: "border-red-300 dark:border-red-700",
            indicator: "💥",
          };
        case "error":
        case "local":
        default:
          return {
            text: "text-orange-700 dark:text-orange-300",
            bg: "bg-orange-50 dark:bg-orange-900/30",
            border: "border-orange-300 dark:border-orange-700",
            indicator: "🚨",
          };
      }
    };

    const errorStyle = finalError ? getV2ErrorStyling(finalErrorType) : null;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
        {/* V2 HEADER: Enhanced with registry status */}
        <div
          className={`text-xs font-semibold mt-1 mb-1 ${finalError && errorStyle ? errorStyle.text : ""}`}
        >
          {finalError && errorStyle ? (
            <div className="flex items-center gap-1">
              <span>{errorStyle.indicator}</span>
              <span>
                V2{" "}
                {finalErrorType === "local"
                  ? "Error"
                  : finalErrorType.toUpperCase()}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <span>📝</span>
              <span>Create Text V2</span>
              {!isReady && <span className="text-yellow-500">⏳</span>}
              {isReady && <span className="text-green-500">✓</span>}
            </div>
          )}
        </div>

        {/* V2 CONTENT: Enhanced error handling */}
        {finalError && errorStyle ? (
          <div
            className={`text-xs text-center break-words ${errorStyle.text} p-1 rounded`}
          >
            <div className="font-medium">V2 System Error:</div>
            <div>{finalError}</div>
          </div>
        ) : (
          <div
            className="nodrag nowheel w-full flex-1 flex items-center justify-center"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <CreateTextV2Input
              data={data}
              updateNodeData={updateNodeData}
              id={id}
              isV2Ready={isReady}
            />
          </div>
        )}

        {/* V2 DEBUG INFO: Development only */}
        {process.env.NODE_ENV === "development" && isReady && (
          <div className="absolute bottom-0 right-0 text-xs text-blue-500 opacity-75">
            V2:{data._v2RegistryVersion || "N/A"}
          </div>
        )}
      </div>
    );
  },

  // V2 EXPANDED RENDER: Enhanced with full V2 integration
  renderExpanded: ({ data, error, categoryTextTheme, updateNodeData, id }) => {
    const { isReady, registryStats } = useV2Registry();
    const { metadata, category } = useV2NodeMetadata("createText");

    // V2 ERROR PROCESSING: Enhanced error state management
    const isVibeError = data.isErrorState === true;
    const vibeErrorMessage = data.error || "Error state active";
    const vibeErrorType = data.errorType || "error";

    const finalError = error || (isVibeError ? vibeErrorMessage : null);
    const finalErrorType = error ? "local" : vibeErrorType;

    // V2 STYLING: Enhanced category-based styling
    const getV2ErrorStyling = (errorType: string) => {
      switch (errorType) {
        case "warning":
          return {
            text: "text-yellow-700 dark:text-yellow-300",
            bg: "bg-yellow-50 dark:bg-yellow-900/30",
            border: "border-yellow-300 dark:border-yellow-700",
            indicator: "⚠️",
            ringColor: "focus:ring-yellow-500",
          };
        case "critical":
          return {
            text: "text-red-700 dark:text-red-300",
            bg: "bg-red-50 dark:bg-red-900/30",
            border: "border-red-300 dark:border-red-700",
            indicator: "💥",
            ringColor: "focus:ring-red-500",
          };
        case "error":
        case "local":
        default:
          return {
            text: "text-orange-700 dark:text-orange-300",
            bg: "bg-orange-50 dark:bg-orange-900/30",
            border: "border-orange-300 dark:border-orange-700",
            indicator: "🚨",
            ringColor: "focus:ring-orange-500",
          };
      }
    };

    const errorStyle = finalError ? getV2ErrorStyling(finalErrorType) : null;

    return (
      <div className="flex text-xs flex-col w-auto" key={`createtext-v2-${id}`}>
        {/* V2 HEADER: Enhanced with registry information */}
        <div
          className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}
        >
          <div className="flex items-center gap-1">
            <span>📝</span>
            <span>Create Text V2</span>
            {!isReady && (
              <span className="text-yellow-500 text-xs">⏳ Loading</span>
            )}
            {isReady && <span className="text-green-500 text-xs">✓ Ready</span>}
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

        {/* V2 REGISTRY INFO: Development debugging */}
        {process.env.NODE_ENV === "development" && isReady && (
          <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded text-xs">
            <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">
              🚀 V2 Registry Status:
            </div>
            <div className="space-y-1 text-blue-600 dark:text-blue-400">
              <div>Version: {data._v2RegistryVersion || "Unknown"}</div>
              <div>Category: {category?.displayName || "Unknown"}</div>
              <div>Nodes: {registryStats?.nodes?.totalRegistered || 0}</div>
              <div>Ready: {isReady ? "✓" : "✗"}</div>
            </div>
          </div>
        )}

        {/* V2 ERROR DISPLAY: Enhanced error information */}
        {finalError && errorStyle && (
          <div
            className={`mb-2 p-2 ${errorStyle.bg} border ${errorStyle.border} rounded text-xs ${errorStyle.text}`}
          >
            <div className="font-semibold mb-1 flex items-center gap-1">
              <span>{errorStyle.indicator}</span>
              <span>
                V2{" "}
                {finalErrorType === "local"
                  ? "Error"
                  : finalErrorType.toUpperCase()}{" "}
                Details:
              </span>
            </div>
            <div className="mb-2">{finalError}</div>
            {isVibeError && (
              <div className="text-xs opacity-75 mt-1">
                ⚡ Set via Vibe Mode from Error Generator (V2 Compatible)
              </div>
            )}
          </div>
        )}

        {/* V2 INPUT COMPONENT: Enhanced text editing */}
        <div
          className="nodrag nowheel"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          <CreateTextV2Expanded
            data={data}
            error={finalError}
            errorStyle={errorStyle}
            categoryTextTheme={categoryTextTheme}
            updateNodeData={updateNodeData}
            id={id}
            isV2Ready={isReady}
            metadata={metadata}
          />
        </div>
      </div>
    );
  },

  // V2 ERROR RECOVERY: Enhanced recovery with V2 metadata
  errorRecoveryData: {
    text: "",
    heldText: "",
    _v2RegistryVersion: "2.0.0",
    _v2CreatedAt: Date.now(),
  },
});

// ============================================================================
// V2 HELPER COMPONENTS
// ============================================================================

/**
 * V2 Collapsed Input Component
 * Enhanced with V2 registry integration
 */
const CreateTextV2Input = ({
  data,
  updateNodeData,
  id,
  isV2Ready,
}: {
  data: CreateTextV2Data;
  updateNodeData: (id: string, data: Partial<CreateTextV2Data>) => void;
  id: string;
  isV2Ready: boolean;
}) => {
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  // V2 OPTIMIZED INPUT: Enhanced performance monitoring
  const optimizedInput = useHighPerformanceTextInput(
    id,
    currentText,
    updateNodeData
  );

  // V2 SHORTCUTS: Enhanced keyboard shortcuts
  const textInputShortcuts = useTextInputShortcuts({
    value: currentText,
    setValue: (value: string) =>
      updateNodeData(id, {
        heldText: value,
        _v2RegistryVersion: "2.0.0", // Track V2 usage
      }),
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    textInputShortcuts.handleKeyDown(e as any);
  };

  return (
    <div className="relative">
      <textarea
        className={`w-full h-8 px-2 py-2 mb-2 text-xs text-center rounded border bg-transparent placeholder-opacity-60 resize-none focus:outline-none focus:ring-1 focus:border-transparent transition-colors overflow-y-auto ${
          isV2Ready
            ? "border-green-300 dark:border-green-700 text-green-900 dark:text-green-100 focus:ring-green-500"
            : "border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 focus:ring-yellow-500"
        }`}
        value={optimizedInput.value}
        onChange={optimizedInput.onChange}
        onKeyDown={handleKeyDown}
        placeholder={
          isV2Ready ? "Enter text... (V2 Ready)" : "Loading V2 Registry..."
        }
        title="V2 Enhanced: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
        disabled={!isV2Ready}
        style={{
          lineHeight: "1.2",
          fontFamily: "inherit",
        }}
        onFocus={(e) => e.target.select()}
        onWheel={(e) => e.stopPropagation()}
      />

      {/* V2 STATUS INDICATORS */}
      <div className="absolute top-0 right-1 flex items-center gap-1 text-xs">
        {optimizedInput.isPending && (
          <span className="text-blue-500" title="V2 Update pending">
            ⚡
          </span>
        )}
        {isV2Ready ? (
          <span className="text-green-500" title="V2 Registry Ready">
            ✓
          </span>
        ) : (
          <span className="text-yellow-500" title="V2 Registry Loading">
            ⏳
          </span>
        )}
      </div>

      {/* V2 VALIDATION ERROR */}
      {optimizedInput.validationError && (
        <div className="text-xs text-red-500 mt-1 p-1 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="font-medium">V2 Input Error:</span>{" "}
          {optimizedInput.validationError}
        </div>
      )}
    </div>
  );
};

/**
 * V2 Expanded Input Component
 * Enhanced with full V2 registry integration
 */
const CreateTextV2Expanded = ({
  data,
  error,
  errorStyle,
  categoryTextTheme,
  updateNodeData,
  id,
  isV2Ready,
  metadata,
}: {
  data: CreateTextV2Data;
  error: string | null;
  errorStyle: any;
  categoryTextTheme: any;
  updateNodeData: (id: string, data: Partial<CreateTextV2Data>) => void;
  id: string;
  isV2Ready: boolean;
  metadata: any;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const currentText = typeof data.heldText === "string" ? data.heldText : "";

  // V2 AUTO-OPTIMIZED INPUT: Enhanced for larger text areas
  const optimizedInput = useAutoOptimizedTextInput(
    id,
    currentText,
    updateNodeData
  );

  // V2 ENHANCED SHORTCUTS
  const textInputShortcuts = useTextInputShortcuts({
    value: currentText,
    setValue: (value: string) =>
      updateNodeData(id, {
        heldText: value,
        _v2RegistryVersion: "2.0.0",
      }),
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    textInputShortcuts.handleKeyDown(e as any);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`w-full text-xs min-h-[65px] px-3 py-2 rounded border bg-white dark:bg-blue-800 placeholder-blue-400 dark:placeholder-blue-500 resize-both focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          error && errorStyle
            ? `${errorStyle.border} ${errorStyle.text} ${errorStyle.ringColor}`
            : isV2Ready
              ? `border-green-300 dark:border-green-700 text-green-900 dark:text-green-100 focus:ring-green-500`
              : `border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 focus:ring-yellow-500`
        }`}
        value={optimizedInput.value}
        onChange={optimizedInput.onChange}
        onKeyDown={handleKeyDown}
        placeholder={
          error
            ? "V2 Error state active - text editing disabled"
            : isV2Ready
              ? "Enter your text here... (V2 Enhanced)"
              : "Loading V2 Registry..."
        }
        title="V2 Enhanced: Alt+Q = backspace • Alt+Shift+Q = delete word • Alt+Ctrl+Q = delete to start"
        disabled={!!error || !isV2Ready}
        style={{
          lineHeight: "1.4",
          fontFamily: "inherit",
        }}
      />

      {/* V2 ENHANCED INDICATORS */}
      <div className="absolute top-1 right-1 flex space-x-1 text-xs opacity-60">
        {optimizedInput.isPending && (
          <span className="text-blue-500" title="V2 Update pending">
            ⚡
          </span>
        )}
        {isV2Ready && optimizedInput.metrics.charactersPerSecond > 10 && (
          <span
            className="text-green-500"
            title="V2 High-speed typing detected"
          >
            🚀
          </span>
        )}
        {optimizedInput.metrics.errorCount > 0 && (
          <span
            className="text-red-500"
            title={`V2 ${optimizedInput.metrics.errorCount} errors`}
          >
            ⚠️
          </span>
        )}
        {isV2Ready ? (
          <span className="text-green-500" title="V2 Registry Ready">
            ✓
          </span>
        ) : (
          <span className="text-yellow-500" title="V2 Registry Loading">
            ⏳
          </span>
        )}
      </div>

      {/* V2 VALIDATION ERRORS */}
      {optimizedInput.validationError && (
        <div className="text-xs text-red-500 mt-1 p-1 bg-red-50 dark:bg-red-900/20 rounded">
          <span className="font-medium">V2 Input Error:</span>{" "}
          {optimizedInput.validationError}
        </div>
      )}

      {/* V2 PERFORMANCE METRICS - Development only */}
      {process.env.NODE_ENV === "development" &&
        isV2Ready &&
        optimizedInput.metrics.updateCount > 0 && (
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <div className="font-semibold text-green-600">
              V2 Performance Metrics:
            </div>
            <div>Updates: {optimizedInput.metrics.updateCount}</div>
            <div>
              Avg time: {optimizedInput.metrics.averageUpdateTime.toFixed(1)}ms
            </div>
            {optimizedInput.metrics.charactersPerSecond > 0 && (
              <div>
                Speed: {optimizedInput.metrics.charactersPerSecond} chars/sec
              </div>
            )}
            <div>Registry: {metadata?.displayName || "Unknown"}</div>
          </div>
        )}
    </div>
  );
};

// ============================================================================
// V2 HELPER FUNCTIONS
// ============================================================================

/**
 * V2 Enhanced Input Value Processing
 */
function getSingleInputValue(nodesData: any[]): any {
  if (!nodesData || nodesData.length === 0) return null;

  const firstNode = nodesData[0];
  if (!firstNode || !firstNode.data) return null;

  // V2 ENHANCED: Check V2-specific properties first
  if ("_v2Output" in firstNode.data) return firstNode.data._v2Output;

  // Standard properties with V2 priority
  if ("outputValue" in firstNode.data) return firstNode.data.outputValue;
  if ("triggered" in firstNode.data) return firstNode.data.triggered;
  if ("value" in firstNode.data) return firstNode.data.value;
  if ("output" in firstNode.data) return firstNode.data.output;
  if ("text" in firstNode.data) return firstNode.data.text;

  return null;
}

/**
 * V2 Enhanced Truthy Value Detection
 */
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

export default CreateTextV2;
