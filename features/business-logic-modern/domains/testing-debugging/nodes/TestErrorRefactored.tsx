import {
  createNodeComponent,
  createTriggeredNodeConfig,
  type BaseNodeData,
} from "@/features/business-logic-modern/infrastructure/node-creation/factory/RefactoredNodeFactory";
import { useFlowStore } from "@/features/business-logic-modern/infrastructure/theming/stores/flowStore";
import { getSingleInputValue, isTruthyValue } from "@factory/utils/nodeUtils";
import { Position, useNodeConnections, useNodesData } from "@xyflow/react";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TestErrorData extends BaseNodeData {
  errorMessage: string;
  errorType: "warning" | "error" | "critical";
  triggerMode: "always" | "trigger_on" | "trigger_off";
  isGeneratingError: boolean;
  isManuallyActivated: boolean;
  text: string;
  json: any;
}

// ============================================================================
// ACTIVATE/RESET BUTTON COMPONENTS
// ============================================================================

// Base button component without hooks - IDENTICAL to original
const BaseActivateResetButton = ({
  data,
  updateNodeData,
  id,
  size = "normal",
  onReset,
}: {
  data: TestErrorData;
  updateNodeData: (id: string, updates: Partial<TestErrorData>) => void;
  id: string;
  size?: "normal" | "compact";
  onReset?: () => void;
}) => {
  // More reliable state detection - ensure we're truly in an active state
  const isActive =
    data.isGeneratingError === true || data.isManuallyActivated === true;

  const handleActivate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`🔥 Error Generator ${id}: ACTIVATING manually`);
    console.log(`🔥 Error Generator ${id}: Current data:`, data);
    console.log(
      `🔥 Error Generator ${id}: updateNodeData function:`,
      updateNodeData
    );

    updateNodeData(id, {
      isManuallyActivated: true,
    });

    console.log(
      `🔥 Error Generator ${id}: Update called with isManuallyActivated: true`
    );
  };

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log(`🔄 Error Generator ${id}: RESETTING - clearing all states`);

    // Reset connected nodes FIRST (before clearing our own state)
    if (onReset) {
      console.log(
        `🔗 Error Generator ${id}: Resetting connected nodes immediately...`
      );
      onReset();
    }

    // Complete reset - clear ALL activation and error states in one atomic operation
    const completeResetData = {
      isManuallyActivated: false,
      isGeneratingError: false,
      text: "",
      json: "",
      // Keep user configuration but clear states
      errorMessage: data.errorMessage || "Custom error message",
      errorType: data.errorType || "error",
      triggerMode: data.triggerMode || "trigger_on",
      // Explicitly clear any error properties that might be lingering
      error: undefined,
    };

    console.log(`📝 Error Generator ${id}: Reset data:`, completeResetData);
    updateNodeData(id, completeResetData);
  };

  const buttonClasses =
    size === "compact" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-xs";

  return (
    <button
      className={`nodrag nopan ${buttonClasses} rounded font-medium transition-colors relative z-10 cursor-pointer ${
        isActive
          ? "bg-red-500 hover:bg-red-600 text-white border border-red-600"
          : "bg-green-500 hover:bg-green-600 text-white border border-green-600"
      }`}
      onClick={isActive ? handleReset : handleActivate}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onTouchStart={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      style={{ pointerEvents: "auto" }}
    >
      {isActive ? (
        <>
          <span className="mr-1">↻</span>
          Reset
        </>
      ) : (
        <>
          <span className="mr-1">⚡</span>
          Activate
        </>
      )}
    </button>
  );
};

// Button for use within node context (can access connections) - IDENTICAL to original
const NodeContextActivateResetButton = ({
  data,
  updateNodeData,
  id,
  size = "normal",
}: {
  data: TestErrorData;
  updateNodeData: (id: string, updates: Partial<TestErrorData>) => void;
  id: string;
  size?: "normal" | "compact";
}) => {
  const updateFlowNodeData = useFlowStore((state) => state.updateNodeData);
  const connections = useNodeConnections({ handleType: "source" });
  const targetNodeIds = connections.map((c) => c.target);
  const targetNodesData = useNodesData(targetNodeIds);

  const handleConnectedNodesReset = () => {
    // Reset connected nodes that have error states
    if (targetNodesData.length > 0) {
      console.log(
        `🔗 Error Generator ${id}: Found ${targetNodesData.length} connected nodes to check for reset`
      );

      targetNodesData.forEach((node) => {
        if (node.data?.isErrorState) {
          console.log(
            `🧹 Error Generator ${id}: Resetting error state on node ${node.id}`,
            {
              before: {
                isErrorState: node.data.isErrorState,
                errorType: node.data.errorType,
                error: node.data.error,
              },
              after: {
                isErrorState: false,
                errorType: undefined,
                error: undefined,
              },
            }
          );

          updateFlowNodeData(node.id, {
            isErrorState: false,
            errorType: undefined,
            error: undefined,
          });
        } else {
          console.log(
            `⭕ Error Generator ${id}: Node ${node.id} has no error state to reset`
          );
        }
      });
    } else {
      console.log(
        `🔗 Error Generator ${id}: No connected nodes found to reset`
      );
    }
  };

  return (
    <BaseActivateResetButton
      data={data}
      updateNodeData={updateNodeData}
      id={id}
      size={size}
      onReset={handleConnectedNodesReset}
    />
  );
};

// Button for use in inspector context (no connections access) - IDENTICAL to original
const InspectorContextActivateResetButton = ({
  data,
  updateNodeData,
  id,
  size = "normal",
}: {
  data: TestErrorData;
  updateNodeData: (id: string, updates: Partial<TestErrorData>) => void;
  id: string;
  size?: "normal" | "compact";
}) => {
  return (
    <BaseActivateResetButton
      data={data}
      updateNodeData={updateNodeData}
      id={id}
      size={size}
    />
  );
};

// ============================================================================
// NODE CONFIGURATION - PORTED TO NEW REFACTORED SYSTEM
// ============================================================================

const TestErrorRefactored = createNodeComponent<TestErrorData>(
  createTriggeredNodeConfig<TestErrorData>({
    nodeType: "testErrorRefactored",
    category: "test", // Will get proper category theming from new system
    displayName: "Error Generator (Refactored)",
    defaultData: {
      errorMessage: "Custom error message",
      errorType: "error",
      triggerMode: "trigger_on",
      isGeneratingError: false,
      isManuallyActivated: false,
      text: "",
      json: "",
    },

    // Standard icon node size (square when collapsed) - IDENTICAL to original
    size: {
      collapsed: {
        width: "w-[120px]",
        height: "h-[120px]",
      },
      expanded: {
        width: "w-[200px]",
      },
    },

    // Define handles (trigger input added automatically, plus JSON output for Vibe Mode) - IDENTICAL to original
    handles: [
      { id: "j", dataType: "j", position: Position.Bottom, type: "source" },
    ],

    // Enhanced processing logic with trigger and error generation - IDENTICAL logic, new system
    processLogic: ({
      data,
      connections,
      nodesData,
      updateNodeData,
      id,
      setError,
    }) => {
      try {
        // Detect complete reset state - if both flags are false and outputs are cleared, ensure clean state
        if (
          data.isManuallyActivated === false &&
          data.isGeneratingError === false &&
          (!data.text || data.text === "") &&
          (!data.json || data.json === "")
        ) {
          setError(null); // Clear any lingering system errors
          console.log(
            `🧹 Error Generator ${id}: Detected complete reset - ensuring clean state`
          );
          return; // Exit early to prevent re-processing
        }

        // Filter for trigger connections (boolean handle 'b')
        const triggerConnections = connections.filter(
          (c) => c.targetHandle === "b"
        );

        // Get trigger value from connected trigger nodes
        const triggerValue = getSingleInputValue(nodesData);
        const isTriggerActive = isTruthyValue(triggerValue);

        // Determine if we should generate an error based on trigger mode and manual activation
        let shouldGenerateError = false;
        let activationReason = "";

        // Check for manual activation first
        if (data.isManuallyActivated) {
          shouldGenerateError = true;
          activationReason = "manually activated";
        } else {
          // Use trigger mode logic
          switch (data.triggerMode) {
            case "always":
              shouldGenerateError = true;
              activationReason = "always mode";
              break;
            case "trigger_on":
              shouldGenerateError =
                triggerConnections.length === 0 || isTriggerActive;
              activationReason =
                triggerConnections.length === 0
                  ? "no trigger connected"
                  : `trigger ${isTriggerActive ? "ON" : "OFF"}`;
              break;
            case "trigger_off":
              shouldGenerateError =
                triggerConnections.length > 0 && !isTriggerActive;
              activationReason = `trigger ${isTriggerActive ? "ON" : "OFF"} (trigger_off mode)`;
              break;
          }
        }

        if (shouldGenerateError) {
          // Generate error state
          const errorMsg = data.errorMessage || "Custom error message";
          const errorType = data.errorType || "error"; // Safety fallback

          console.log(
            `⚡ Error Generator ${id}: GENERATING ${errorType.toUpperCase()} error (${activationReason})`
          );
          console.log(`📄 Error Generator ${id}: Message: "${errorMsg}"`);

          // Create actual console errors for testing
          switch (errorType) {
            case "warning":
              console.warn(
                `⚠️ TEST WARNING from Error Generator ${id}: ${errorMsg}`
              );
              break;
            case "error":
              console.error(
                `🚨 TEST ERROR from Error Generator ${id}: ${errorMsg}`
              );
              break;
            case "critical":
              console.error(
                `🔥 TEST CRITICAL ERROR from Error Generator ${id}: ${errorMsg}`
              );
              // For critical errors, also create a stack trace
              const testError = new Error(`CRITICAL: ${errorMsg}`);
              testError.name = "TestCriticalError";
              console.error(testError);
              break;
          }

          // Create JSON output for Vibe Mode to set error states on connected nodes
          const errorJson = {
            error: errorMsg,
            errorType: errorType,
            isErrorState: true,
            timestamp: new Date().toISOString(),
          };

          console.log(
            `🔮 Error Generator ${id}: Vibe Mode JSON output:`,
            errorJson
          );

          // Set our own error state based on error type
          if (errorType === "critical") {
            setError(`CRITICAL: ${errorMsg}`);
            console.log(`🔴 Error Generator ${id}: Set CRITICAL system error`);
          } else if (errorType === "error") {
            setError(errorMsg);
            console.log(`🟠 Error Generator ${id}: Set ERROR system error`);
          } else {
            setError(null); // Don't show visual error for warnings
            console.log(
              `🟡 Error Generator ${id}: Generated WARNING (no system error)`
            );
          }

          updateNodeData(id, {
            isGeneratingError: true,
            text: `${errorType.toUpperCase()}: ${errorMsg}`,
            json: errorJson,
          });

          console.log(`✅ Error Generator ${id}: Error generation complete`);
        } else {
          // Not generating error - clear states
          console.log(
            `💤 Error Generator ${id}: Not generating error (${activationReason})`
          );
          setError(null);

          updateNodeData(id, {
            isGeneratingError: false,
            text: "",
            json: "",
          });
        }
      } catch (processingError) {
        console.error(
          `❌ Error Generator ${id}: Processing error:`,
          processingError
        );
        const errorMessage =
          processingError instanceof Error
            ? processingError.message
            : "Processing error";
        setError(`System Error: ${errorMessage}`);

        updateNodeData(id, {
          isGeneratingError: false,
          isManuallyActivated: false,
          text: "",
          json: "",
        });
      }
    },

    // Collapsed state rendering with error indicators - IDENTICAL styling, enhanced with new system
    renderCollapsed: ({ data, error, updateNodeData, id }) => {
      const errorType = data.errorType || "error"; // Safety fallback
      const displayText = data.isGeneratingError
        ? `${errorType.toUpperCase()}`
        : "Error Gen";

      const statusColor = data.isGeneratingError
        ? errorType === "critical"
          ? "text-red-600"
          : errorType === "error"
            ? "text-orange-600"
            : "text-yellow-600"
        : "text-gray-500";

      // Create enhanced reset function that clears both data and system errors
      const enhancedUpdateNodeData = (
        nodeId: string,
        updates: Partial<TestErrorData>
      ) => {
        // If we're resetting (isManuallyActivated: false), also clear the error recovery data
        if (updates.isManuallyActivated === false) {
          const fullResetData = {
            ...updates,
            errorMessage: data.errorMessage || "Custom error message", // Keep user's message
            errorType: data.errorType || "error", // Keep user's error type
            triggerMode: data.triggerMode || "trigger_on", // Keep user's trigger mode
            isGeneratingError: false,
            text: "",
            json: "",
            // Clear any system error properties
            error: undefined,
          };
          updateNodeData(nodeId, fullResetData);
        } else {
          updateNodeData(nodeId, updates);
        }
      };

      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-2">
          <div className="text-xs font-semibold mb-2">
            {error ? "System Error" : "Error Gen"}
          </div>

          {/* Status Display */}
          {!error && (
            <div
              className={`text-xs text-center font-medium leading-tight mb-2 ${statusColor}`}
            >
              {data.isGeneratingError ? (
                <>
                  <div>{errorType.toUpperCase()}</div>
                  <div className="text-xs opacity-75">Active</div>
                </>
              ) : (
                <>
                  <div>Ready</div>
                  <div className="text-xs opacity-75">
                    {data.triggerMode || "trigger_on"}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error Message (when system error) */}
          {error && (
            <div className="text-xs text-center text-red-600 break-words overflow-hidden leading-tight mb-2">
              System Error
            </div>
          )}

          {/* Always show the button - use enhanced update function when there's a system error */}
          <NodeContextActivateResetButton
            data={data}
            updateNodeData={error ? enhancedUpdateNodeData : updateNodeData}
            id={id}
            size="compact"
          />
        </div>
      );
    },

    // Expanded state rendering with full error configuration - IDENTICAL to original
    renderExpanded: ({
      data,
      error,
      categoryTextTheme,
      updateNodeData,
      id,
    }) => {
      const errorType = data.errorType || "error"; // Safety fallback

      return (
        <div className="flex text-xs flex-col w-auto">
          <div
            className={`font-semibold mb-2 flex items-center justify-between ${categoryTextTheme.primary}`}
          >
            <span>
              {error ? "System Error" : "Error Generator (Refactored)"}
            </span>
            {data.isGeneratingError && (
              <span
                className={`text-xs px-1 py-0.5 rounded text-white ${
                  errorType === "critical"
                    ? "bg-red-600"
                    : errorType === "error"
                      ? "bg-orange-600"
                      : "bg-yellow-600"
                }`}
              >
                {errorType.toUpperCase()}
              </span>
            )}
          </div>

          {error && (
            <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
              <div className="font-semibold mb-1">System Error:</div>
              <div>{error}</div>
            </div>
          )}

          {/* Activate/Reset Button */}
          <div className="mb-3">
            <NodeContextActivateResetButton
              data={data}
              updateNodeData={updateNodeData}
              id={id}
              size="normal"
            />
          </div>

          <div className="space-y-2">
            {/* Error Message Input */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Error Message:
              </label>
              <textarea
                className="w-full text-xs min-h-[50px] px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 nodrag nowheel"
                value={data.errorMessage || ""}
                onChange={(e) =>
                  updateNodeData(id, { errorMessage: e.target.value })
                }
                placeholder="Enter error message..."
                onWheel={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              />
            </div>

            {/* Error Type Selection */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Error Type:
              </label>
              <select
                className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                value={errorType}
                onChange={(e) =>
                  updateNodeData(id, {
                    errorType: e.target.value as
                      | "warning"
                      | "error"
                      | "critical",
                  })
                }
              >
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Error (Orange)</option>
                <option value="critical">Critical (Red)</option>
              </select>
            </div>

            {/* Trigger Mode Selection */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Trigger Mode:
              </label>
              <select
                className="w-full text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                value={data.triggerMode || "trigger_on"}
                onChange={(e) =>
                  updateNodeData(id, {
                    triggerMode: e.target.value as
                      | "always"
                      | "trigger_on"
                      | "trigger_off",
                  })
                }
              >
                <option value="always">Always Generate</option>
                <option value="trigger_on">Generate When Triggered ON</option>
                <option value="trigger_off">Generate When Triggered OFF</option>
              </select>
            </div>

            {/* Status Display */}
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded">
              <div className="text-xs font-medium mb-1">Status:</div>
              <div
                className={`text-xs ${
                  data.isGeneratingError
                    ? errorType === "critical"
                      ? "text-red-600"
                      : errorType === "error"
                        ? "text-orange-600"
                        : "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                {data.isGeneratingError
                  ? `Generating ${errorType} error${data.isManuallyActivated ? " (manually activated)" : ""}`
                  : "Ready to generate errors"}
              </div>
            </div>

            {/* JSON Output Preview */}
            {data.isGeneratingError && data.json && (
              <div>
                <label className="block text-xs font-medium mb-1">
                  JSON Output (for Vibe Mode):
                </label>
                <div className="text-xs bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded px-2 py-1 font-mono max-h-[60px] overflow-y-auto">
                  {JSON.stringify(data.json, null, 2)}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    },

    // Inspector controls for detailed error configuration - IDENTICAL to original
    renderInspectorControls: ({ node, updateNodeData }) => (
      <div className="space-y-4">
        {/* Activate/Reset Button */}
        <div className="flex justify-center">
          <InspectorContextActivateResetButton
            data={node.data}
            updateNodeData={updateNodeData}
            id={node.id}
            size="normal"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Error Message:
          </label>
          <textarea
            className="w-full rounded border px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400"
            rows={3}
            value={node.data.errorMessage || ""}
            onChange={(e) =>
              updateNodeData(node.id, { errorMessage: e.target.value })
            }
            placeholder="Enter custom error message..."
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Error Type:
          </label>
          <select
            className="w-full rounded border px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
            value={node.data.errorType || "error"}
            onChange={(e) =>
              updateNodeData(node.id, { errorType: e.target.value })
            }
          >
            <option
              value="warning"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Warning
            </option>
            <option
              value="error"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Error
            </option>
            <option
              value="critical"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Critical
            </option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-300">
            Trigger Mode:
          </label>
          <select
            className="w-full rounded border px-2 py-1 text-xs bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400 cursor-pointer"
            value={node.data.triggerMode || "trigger_on"}
            onChange={(e) =>
              updateNodeData(node.id, { triggerMode: e.target.value })
            }
          >
            <option
              value="always"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Always Generate
            </option>
            <option
              value="trigger_on"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Generate When Triggered ON
            </option>
            <option
              value="trigger_off"
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              Generate When Triggered OFF
            </option>
          </select>
        </div>

        {node.data.isGeneratingError && (
          <div className="p-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded">
            <div className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">
              Currently Generating Error:
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Type: {node.data.errorType || "error"}
              <br />
              Message: {node.data.errorMessage || "Custom error message"}
              {node.data.isManuallyActivated && (
                <>
                  <br />
                  Mode: Manually Activated
                </>
              )}
            </div>
          </div>
        )}
      </div>
    ),

    // Error recovery data - IDENTICAL to original
    errorRecoveryData: {
      errorMessage: "Custom error message",
      errorType: "error",
      triggerMode: "trigger_on",
      isGeneratingError: false,
      isManuallyActivated: false,
      text: "",
      json: "",
    },
  })
);

export default TestErrorRefactored;
