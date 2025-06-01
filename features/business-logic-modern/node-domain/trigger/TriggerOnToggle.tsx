/**
 * TRIGGER ON TOGGLE NODE - Boolean state toggle trigger component
 *
 * • Toggle trigger node with boolean state management and external triggering
 * • Supports manual toggle and external boolean input connections
 * • Provides visual state indicator with ON/OFF status display
 * • Factory-created component with enhanced error handling
 * • Inspector controls for runtime toggle and state monitoring
 *
 * Keywords: trigger, toggle, boolean, state-management, factory, external-input
 */

"use client";

import { Position } from "@xyflow/react";
import { createNodeComponent } from "../factory/RefactoredNodeFactory";
import type { BaseNodeData } from "../factory/types";
import IconForToggle from "../node-icons/IconForToggle";

// TYPES
interface TriggerOnToggleRefactorData extends BaseNodeData {
  triggered: boolean;
  // Error injection support
  isErrorState?: boolean;
  errorType?: "warning" | "error" | "critical";
  error?: string;
}

// TRIGGER ON TOGGLE REFACTOR - NOW USING REFACTORED FACTORY
const TriggerOnToggleRefactor =
  createNodeComponent<TriggerOnToggleRefactorData>({
    nodeType: "triggerOnToggleRefactor",
    category: "trigger", // Use proper category
    displayName: "🔧 Toggle Trigger (Refactored)",

    // DEFAULT DATA
    defaultData: {
      triggered: false,
    },

    // SIZE CONFIGURATION - MATCH ORIGINAL (60x60 collapsed, 120x120 expanded)
    size: {
      collapsed: {
        width: "w-[60px]",
        height: "h-[60px]",
      },
      expanded: {
        width: "w-[120px]",
      },
    },

    // PROCESSING LOGIC
    processLogic: ({
      data,
      connections,
      nodesData,
      updateNodeData,
      id,
      setError,
    }) => {
      try {
        // Handle error injection (only if JSON input is connected in future versions)
        if (data.isErrorState) {
          setError(data.error || "Trigger is in error state");
          return;
        }

        // Filter for boolean trigger connections using the unique handle ID
        const boolInputConnections = connections.filter(
          (c) => c.targetHandle === "b_in"
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
            type: "TriggerOnToggleRefactor",
            label: "🔧 Toggle Trigger (Refactored)",
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
        console.error(`TriggerOnToggleRefactor ${id} error:`, error);
        setError(error instanceof Error ? error.message : "Processing error");
      }
    },

    // HANDLE CONFIGURATION - UNIQUE IDs WITH BOOLEAN TYPE COMPATIBILITY
    handles: [
      { type: "target", position: Position.Left, dataType: "b", id: "b_in" }, // Boolean input (unique ID)
      { type: "source", position: Position.Right, dataType: "b", id: "b_out" }, // Boolean output (unique ID)
    ],

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
          <div className="font-semibold text-violet-900 dark:text-violet-100 mb-3">
            🔧 Toggle Trigger (Refactored)
          </div>
          <IconForToggle
            isOn={data.triggered || false}
            onClick={handleToggle}
            size={48}
          />
          <div className="text-xs text-violet-800 dark:text-violet-200 mt-2">
            Status:{" "}
            <span className="font-mono">{data.triggered ? "ON" : "OFF"}</span>
          </div>
          <div className="text-xs text-violet-600 dark:text-violet-300 mt-1 italic">
            Enhanced Registry + Factory
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
            className="w-full px-3 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm rounded transition-colors"
          >
            Toggle
          </button>

          {/* Debug info */}
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <div>Value: {String(node.data.triggered)}</div>
            <div>Factory: RefactoredNodeFactory</div>
            <div>Registry: Enhanced</div>
          </div>
        </div>
      );
    },
  });

export default TriggerOnToggleRefactor;
