/**
 * VIEW OUTPUT NODE - Enhanced data viewing component
 *
 * • Refactored view output node displaying values from connected nodes
 * • Type-aware value extraction with smart filtering of empty values
 * • Collapsed and expanded display modes with type indicators
 * • Factory-created component using centralized registry system
 * • Enhanced error handling and data type visualization
 * • Integrated with category registry for enhanced theming and validation
 *
 * Keywords: view-output, data-display, type-indicators, filtering, factory, registry, category-registry
 */

"use client";

/* -------------------------------------------------------------------------- */
/*  ViewOutput - Converted to NodeFactory                                    */
/*  – Displays values from connected nodes with type indicators               */
/* -------------------------------------------------------------------------- */

// FACTORY AND UTILITIES - Fixed imports to infrastructure layer
import {
  createNodeComponent,
  type BaseNodeData,
  type HandleConfig,
} from "../../infrastructure/node-creation/factory/NodeFactory";
import { getNodeHandles } from "../../infrastructure/node-creation/factory/constants/handles";
import { STANDARD_SIZE_PATTERNS } from "../../infrastructure/node-creation/factory/constants/sizes";

// KEY UTILITIES - Standardized React key generation
import { generateDisplayValueKey } from "../../infrastructure/node-creation/factory/utils/ui/keyUtils";

// UTILITY FUNCTIONS - Inline implementations
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

// ============================================================================
// NODE DATA INTERFACE - Enhanced with category registry integration
// ============================================================================

interface ViewOutputData extends BaseNodeData {
  displayedValues: Array<{
    type: string;
    content: any;
    id: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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
// NODE CONFIGURATION - Carbon Copy of Legacy
// ============================================================================

// LOAD HANDLES FROM CENTRALIZED CONSTANTS - No circular dependency
const nodeHandles: HandleConfig[] = getNodeHandles("viewOutput");
console.log(
  `🔗 [ViewOutput] Loaded ${nodeHandles.length} handles from centralized constants:`,
  nodeHandles
);

const ViewOutput = createNodeComponent<ViewOutputData>({
  nodeType: "viewOutput", // Match the registry nodeType
  category: "view", // VIEW category for gray theme (was incorrectly set to "test")
  displayName: "View Output",
  defaultData: {
    displayedValues: [],
  },

  // ✨ HANDLES LOADED FROM CENTRALIZED CONSTANTS (above)
  handles: nodeHandles,

  // Enhanced size configuration using new standards (large interactive node pattern)
  size: STANDARD_SIZE_PATTERNS.LARGE_INTERACTIVE,

  // Processing logic - extract and format values from connected nodes
  processLogic: ({
    data,
    connections,
    nodesData,
    updateNodeData,
    id,
    setError,
  }) => {
    try {
      // SAFETY CHECK - Ensure nodesData is valid
      if (!Array.isArray(nodesData)) {
        console.warn(
          `ViewOutput ${id} - nodesData is not an array:`,
          nodesData
        );
        return; // Exit early if nodesData is invalid
      }

      // SAFETY CHECK - Ensure connections exist before processing
      if (!connections || connections.length === 0) {
        // No connections, clear displayed values if they exist
        if (data.displayedValues && data.displayedValues.length > 0) {
          updateNodeData(id, {
            displayedValues: [],
          });
        }
        return;
      }

      // Extract values from connected nodes using safe extraction
      const values = nodesData
        .filter((node) => {
          // SAFETY CHECK - Ensure node has required properties
          return node && typeof node === "object" && node.id && node.type;
        })
        .map((node) => {
          try {
            // Special handling for TestInput nodes - use 'value' property directly
            let extractedValue;
            if (node.type === "testInput") {
              extractedValue = node.data?.value;
            } else {
              extractedValue = extractNodeValue(node.data);
            }

            return {
              type: node.type,
              content: extractedValue,
              id: node.id,
            };
          } catch (nodeError) {
            console.warn(
              `ViewOutput ${id} - Error processing node ${node.id}:`,
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
          // SAFETY CHECK - Ensure item is valid
          if (!item || typeof item !== "object") {
            return false;
          }

          // Filter out truly meaningless values
          const content = item.content;

          // Exclude undefined and null
          if (content === undefined || content === null) {
            return false;
          }

          // For strings, exclude empty or whitespace-only strings
          if (typeof content === "string" && content.trim() === "") {
            return false;
          }

          // For objects/arrays, exclude empty ones
          if (typeof content === "object" && content !== null) {
            try {
              if (Array.isArray(content)) {
                return content.length > 0;
              }
              // For objects, check if they have enumerable properties
              return Object.keys(content).length > 0;
            } catch (objError) {
              console.warn(
                `ViewOutput ${id} - Error checking object content:`,
                objError
              );
              return false;
            }
          }

          // Include meaningful values: numbers (including 0), booleans (including false), etc.
          return true;
        });

      // SAFETY CHECK - Ensure we have valid current data
      const currentValues = Array.isArray(data.displayedValues)
        ? data.displayedValues
        : [];

      // Only update if the values have actually changed
      let hasChanged = false;

      try {
        hasChanged =
          values.length !== currentValues.length ||
          values.some((value, index) => {
            const current = currentValues[index];
            return (
              !current ||
              current.id !== value.id ||
              current.type !== value.type ||
              current.content !== value.content
            );
          });
      } catch (comparisonError) {
        console.warn(
          `ViewOutput ${id} - Error comparing values:`,
          comparisonError
        );
        hasChanged = true; // Force update on comparison error
      }

      if (hasChanged) {
        updateNodeData(id, {
          displayedValues: values,
        });
      }
    } catch (updateError) {
      console.error(`ViewOutput ${id} - Critical update error:`, updateError);
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : "Unknown processing error";

      // Set error state
      if (setError) {
        setError(errorMessage);
      }

      // Try to update with safe error state
      try {
        updateNodeData(id, {
          displayedValues: [],
        });
      } catch (recoveryError) {
        console.error(
          `ViewOutput ${id} - Recovery update failed:`,
          recoveryError
        );
      }
    }
  },

  // Collapsed state rendering - show preview of values (same as legacy)
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
                key={generateDisplayValueKey(item, index, "collapsed")}
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

  // Expanded state rendering - full UI with type indicators (same as legacy)
  renderExpanded: ({ data, error, categoryTextTheme }) => {
    const values = data.displayedValues || [];

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
                  key={generateDisplayValueKey(item, index, "expanded")}
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

  // Error recovery data
  errorRecoveryData: {
    displayedValues: [],
  },
});

export default ViewOutput;
