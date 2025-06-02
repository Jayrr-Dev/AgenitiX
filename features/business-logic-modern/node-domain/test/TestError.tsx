/**
 * TEST ERROR NODE - Error generation and testing component
 *
 * • Error generator node for testing and debugging error handling systems
 * • Supports multiple error types (warning, error, critical) with configurable modes
 * • Manual activation and automatic triggering based on input connections
 * • Propagates error states to connected nodes for comprehensive testing
 * • Factory-created component with enhanced error management controls
 * • Integrated with category registry for enhanced theming and validation
 *
 * Keywords: error-testing, debugging, error-propagation, activation, factory, configurable, category-registry
 */

import { Position } from "@xyflow/react";

// FACTORY AND UTILITIES - Fixed imports to infrastructure layer
import {
  createNodeComponent,
  type BaseNodeData,
} from "../../infrastructure/node-creation/factory/NodeFactory";

// UTILITY FUNCTIONS - Inline implementations
function getSingleInputValue(nodesData: any[]): any {
  if (!nodesData || nodesData.length === 0) return null;
  const firstNode = nodesData[0];
  if (!firstNode || !firstNode.data) return null;

  if ("text" in firstNode.data) return firstNode.data.text;
  if ("value" in firstNode.data) return firstNode.data.value;
  if ("output" in firstNode.data) return firstNode.data.output;

  return null;
}

function isTruthyValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return value !== 0 && !isNaN(value);
  return Boolean(value);
}

// ============================================================================
// NODE DATA INTERFACE - Enhanced with category registry integration
// ============================================================================

interface TestErrorData extends BaseNodeData {
  errorMessage: string;
  errorType: "warning" | "error" | "critical";
  triggerMode: "always" | "trigger_on" | "trigger_off";
  isGeneratingError: boolean;
  isManuallyActivated?: boolean;
  text: string;
  json: string;
}

// ============================================================================
// SIMPLE TOGGLE BUTTON COMPONENT
// ============================================================================

const SimpleActivateButton = ({
  data,
  updateNodeData,
  id,
}: {
  data: TestErrorData;
  updateNodeData: (id: string, updates: Partial<TestErrorData>) => void;
  id: string;
}) => {
  const isActive = data.isGeneratingError || data.isManuallyActivated;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isActive) {
      // Reset/deactivate
      updateNodeData(id, {
        isGeneratingError: false,
        isManuallyActivated: false,
        text: "",
        json: "",
      });
    } else {
      // Activate
      updateNodeData(id, {
        isGeneratingError: true,
        isManuallyActivated: true,
      });
    }
  };

  return (
    <button
      className={`nodrag nopan px-3 py-1.5 text-xs rounded font-medium transition-colors ${
        isActive
          ? "bg-red-500 hover:bg-red-600 text-white"
          : "bg-green-500 hover:bg-green-600 text-white"
      }`}
      onClick={handleToggle}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {isActive ? "Reset" : "Activate"}
    </button>
  );
};

// ============================================================================
// ENTERPRISE NODE CONFIGURATION - Enhanced Factory with Registry Integration
// ============================================================================

const TestError = createNodeComponent<TestErrorData>({
  nodeType: "testError", // Match the registry nodeType
  category: "test", // Enhanced category registry integration
  displayName: "Test Error",
  defaultData: {
    errorMessage: "Custom error message",
    errorType: "error",
    triggerMode: "trigger_on",
    isGeneratingError: false,
    text: "",
    json: "",
  },

  // Enhanced size configuration
  size: {
    collapsed: {
      width: "60px",
      height: "60px",
    },
    expanded: {
      width: "150px",
    },
  },

  // HANDLE CONFIGURATION
  handles: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "error", dataType: "S", position: Position.Right, type: "source" },
  ],

  // PROCESSING LOGIC - Enhanced with registry integration
  processLogic: ({
    data,
    connections,
    nodesData,
    updateNodeData,
    id,
    setError,
  }) => {
    try {
      // Check if manually activated or triggered
      let shouldGenerate = data.isManuallyActivated || false;

      // Check trigger connections
      const triggerConnections = connections.filter(
        (c) => c.targetHandle === "trigger"
      );

      if (triggerConnections.length > 0) {
        const triggerValue = getSingleInputValue(nodesData);
        const isTriggered = isTruthyValue(triggerValue);

        // Apply trigger mode logic
        if (data.triggerMode === "trigger_on" && isTriggered) {
          shouldGenerate = true;
        } else if (data.triggerMode === "trigger_off" && !isTriggered) {
          shouldGenerate = true;
        } else if (data.triggerMode === "always") {
          shouldGenerate = true;
        }
      }

      // Update state based on whether we should generate error
      const updates: Partial<TestErrorData> = {
        isGeneratingError: shouldGenerate,
      };

      if (shouldGenerate) {
        // Generate error output
        updates.text = data.errorMessage;
        updates.json = JSON.stringify({
          error: data.errorMessage,
          type: data.errorType,
          timestamp: Date.now(),
        });
      } else {
        // Clear outputs
        updates.text = "";
        updates.json = "";
      }

      updateNodeData(id, updates);
      setError(null);
    } catch (processingError) {
      console.error(`TestError ${id} - Processing error:`, processingError);
      const errorMessage =
        processingError instanceof Error
          ? processingError.message
          : "Unknown error";
      setError(errorMessage);
    }
  },

  // COLLAPSED STATE RENDERER
  renderCollapsed: ({ data, updateNodeData, id, error }) => {
    const isActive = data.isGeneratingError || data.isManuallyActivated;

    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-1">
        <div
          className={`text-xs font-medium mb-1 ${
            error
              ? "text-red-600"
              : isActive
                ? "text-yellow-600"
                : "text-gray-600"
          }`}
        >
          {error ? "Error" : isActive ? "Active" : "Test Error"}
        </div>
        <SimpleActivateButton
          data={data}
          updateNodeData={updateNodeData}
          id={id}
        />
      </div>
    );
  },

  // EXPANDED STATE RENDERER
  renderExpanded: ({ data, updateNodeData, id, error }) => {
    const isActive = data.isGeneratingError || data.isManuallyActivated;

    const handleErrorMessageChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      updateNodeData(id, { errorMessage: e.target.value });
    };

    const handleErrorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(id, {
        errorType: e.target.value as "warning" | "error" | "critical",
      });
    };

    return (
      <div className="flex flex-col p-2 space-y-2">
        <div className="font-semibold text-yellow-900 dark:text-yellow-100 text-center">
          Test Error Generator
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Error Message:
            </label>
            <input
              type="text"
              value={data.errorMessage}
              onChange={handleErrorMessageChange}
              className="w-full px-2 py-1 text-xs border rounded"
              placeholder="Enter error message"
            />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400">
              Error Type:
            </label>
            <select
              value={data.errorType}
              onChange={handleErrorTypeChange}
              className="w-full px-2 py-1 text-xs border rounded"
            >
              <option value="warning">Warning</option>
              <option value="error">Error</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <SimpleActivateButton
            data={data}
            updateNodeData={updateNodeData}
            id={id}
          />

          <div
            className={`text-xs text-center ${
              isActive ? "text-yellow-600" : "text-gray-500"
            }`}
          >
            Status: {isActive ? "Generating Errors" : "Inactive"}
          </div>

          {error && (
            <div className="text-xs text-red-600 text-center">{error}</div>
          )}
        </div>
      </div>
    );
  },

  // INSPECTOR CONTROLS RENDERER
  renderInspectorControls: ({ node, updateNodeData }) => {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium">Test Error Controls</div>

        <div>
          <label className="text-xs">Error Message:</label>
          <input
            type="text"
            value={node.data.errorMessage || ""}
            onChange={(e) =>
              updateNodeData(node.id, { errorMessage: e.target.value })
            }
            className="w-full px-2 py-1 text-xs border rounded"
          />
        </div>

        <div>
          <label className="text-xs">Error Type:</label>
          <select
            value={node.data.errorType || "error"}
            onChange={(e) =>
              updateNodeData(node.id, {
                errorType: e.target.value as "warning" | "error" | "critical",
              })
            }
            className="w-full px-2 py-1 text-xs border rounded"
          >
            <option value="warning">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Status: {node.data.isGeneratingError ? "Active" : "Inactive"}
        </div>
      </div>
    );
  },
});

export default TestError;
