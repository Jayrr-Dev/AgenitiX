/**
 * TRIGGER ON TOGGLE NODE - Boolean state toggle trigger component
 *
 * • Toggle trigger node with boolean state management and external triggering
 * • Supports manual toggle and external boolean input connections
 * • Provides visual state indicator with ON/OFF status display
 * • Factory-created component with enhanced error handling
 * • Inspector controls for runtime toggle and state monitoring
 * • Integrated with category registry for enhanced theming and validation
 *
 * Keywords: trigger, toggle, boolean, state-management, factory, external-input, category-registry
 */

"use client";

import { Position } from "@xyflow/react";

// FACTORY AND UTILITIES - Fixed imports to infrastructure layer
import {
  createNodeComponent,
  type BaseNodeData,
} from "../../infrastructure/node-creation/factory/NodeFactory";

// ICON COMPONENT - Simple inline toggle icon
const IconForToggle = ({
  isOn,
  onClick,
  size,
}: {
  isOn: boolean;
  onClick: () => void;
  size: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center justify-center
        border-2 rounded-full transition-all duration-200
        ${
          isOn
            ? "bg-green-500 border-green-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-600 dark:text-gray-400"
        }
        hover:scale-110 active:scale-95
      `}
      style={{ width: size, height: size }}
      title={`Toggle ${isOn ? "OFF" : "ON"}`}
    >
      {isOn ? "●" : "○"}
    </button>
  );
};

// ============================================================================
// NODE DATA INTERFACE - Enhanced with category registry integration
// ============================================================================

interface TriggerOnToggleData extends BaseNodeData {
  triggered: boolean;
  value: boolean;
  outputValue: boolean;
  type: string;
  label: string;
  inputCount: number;
  hasExternalInputs: boolean;
  // Internal state tracking
  _lastExternalTrigger?: boolean;
  // Error injection support
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// ============================================================================
// ENTERPRISE NODE CONFIGURATION - Enhanced Factory with Registry Integration
// ============================================================================

const TriggerOnToggle = createNodeComponent<TriggerOnToggleData>({
  nodeType: "triggerOnToggle", // Match the registry nodeType
  category: "trigger", // Enhanced category registry integration
  displayName: "Trigger On Toggle",
  defaultData: {
    triggered: false,
    value: false,
    outputValue: false,
    type: "TriggerOnToggle",
    label: "Toggle Trigger",
    inputCount: 0,
    hasExternalInputs: false,
  },

  // Enhanced size configuration
  size: {
    collapsed: {
      width: "w-[60px]",
      height: "h-[60px]",
    },
    expanded: {
      width: "w-[120px]",
    },
  },

  // HANDLE CONFIGURATION - Updated with correct IDs
  handles: [
    { id: "trigger", dataType: "b", position: Position.Left, type: "target" },
    { id: "output", dataType: "b", position: Position.Right, type: "source" },
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
      // Handle error injection
      if (data.isErrorState) {
        setError(data.error || "Trigger is in error state");
        return;
      }

      // Filter for boolean trigger connections using the correct handle ID
      const boolInputConnections = connections.filter(
        (c) => c.targetHandle === "trigger"
      );

      // Check for external boolean trigger from connected nodes
      const hasExternalTrigger =
        boolInputConnections.length > 0 &&
        nodesData.some((node) => {
          const value =
            node?.data?.value || node?.data?.triggered || node?.data?.output;
          return (
            value === true ||
            value === "true" ||
            (typeof value === "string" && value.toLowerCase() === "true")
          );
        });

      // If external trigger received and different from last state, toggle
      if (hasExternalTrigger && !data._lastExternalTrigger) {
        const newTriggered = !data.triggered;
        updateNodeData(id, {
          triggered: newTriggered,
          value: newTriggered,
          outputValue: newTriggered,
          type: "TriggerOnToggle",
          label: "Toggle Trigger",
          _lastExternalTrigger: true,
        });
      } else if (!hasExternalTrigger && data._lastExternalTrigger) {
        // Reset external trigger tracking when no trigger
        updateNodeData(id, {
          _lastExternalTrigger: false,
        });
      }

      // Clear any existing errors
      setError(null);
    } catch (error) {
      console.error(`TriggerOnToggle ${id} error:`, error);
      setError(error instanceof Error ? error.message : "Processing error");
    }
  },

  // COLLAPSED STATE RENDERER
  renderCollapsed: ({ data, updateNodeData, id }) => {
    const handleToggle = () => {
      const newTriggered = !data.triggered;
      updateNodeData(id, {
        triggered: newTriggered,
        value: newTriggered,
        outputValue: newTriggered,
      });
    };

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <IconForToggle
          isOn={data.triggered || false}
          onClick={handleToggle}
          size={40}
        />
      </div>
    );
  },

  // EXPANDED STATE RENDERER
  renderExpanded: ({ data, updateNodeData, id, error }) => {
    const handleToggle = () => {
      const newTriggered = !data.triggered;
      updateNodeData(id, {
        triggered: newTriggered,
        value: newTriggered,
        outputValue: newTriggered,
      });
    };

    return (
      <div className="flex flex-col items-center">
        <div className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
          Trigger On Toggle
        </div>
        <IconForToggle
          isOn={data.triggered || false}
          onClick={handleToggle}
          size={48}
        />
        <div className="text-xs text-purple-800 dark:text-purple-200 mt-2">
          Status:{" "}
          <span className="font-mono">{data.triggered ? "ON" : "OFF"}</span>
        </div>
        <div className="text-xs text-purple-600 dark:text-purple-300 mt-1 italic">
          Enhanced Registry Integration
        </div>
        {error && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {error}
          </div>
        )}
      </div>
    );
  },

  // INSPECTOR CONTROLS RENDERER
  renderInspectorControls: ({ node, updateNodeData }) => {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs">Status:</span>
          <span
            className={`px-2 py-1 rounded text-xs text-white ${
              node.data.triggered ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            {node.data.triggered ? "ON" : "OFF"}
          </span>
        </div>

        <button
          onClick={() =>
            updateNodeData(node.id, {
              triggered: !node.data.triggered,
              value: !node.data.triggered,
              outputValue: !node.data.triggered,
            })
          }
          className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm rounded transition-colors"
        >
          Toggle
        </button>

        {/* Debug info */}
        <div className="text-xs text-gray-500 mt-2 space-y-1">
          <div>Value: {String(node.data.triggered)}</div>
          <div>Factory: Enhanced NodeFactory</div>
          <div>Registry: Category Integrated</div>
        </div>
      </div>
    );
  },
});

export default TriggerOnToggle;
