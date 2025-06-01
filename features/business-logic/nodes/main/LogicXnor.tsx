"use client";

import {
  Position,
  useNodeConnections,
  useNodesData,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import React from "react";
import CustomHandle from "../../handles/TypesafeHandle";
import { useFlowStore } from "../../stores/flowStore";
import { getInputValues, isTruthyValue } from "../utils/nodeUtils";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------
interface LogicXnorData {
  value: boolean;
}

// -----------------------------------------------------------------------------
// LOGIC XNOR NODE COMPONENT
// -----------------------------------------------------------------------------
const LogicXnor: React.FC<
  NodeProps<Node<LogicXnorData & Record<string, unknown>>>
> = ({ id, data }) => {
  // Get all boolean input connections (single handle, multiple connections)
  const connections = useNodeConnections({ handleType: "target" });
  const boolInputConnections = connections.filter(
    (c) => c.targetHandle === "b"
  );
  const boolInputSourceIds = boolInputConnections.map((c) => c.source);
  const boolInputNodesData = useNodesData(boolInputSourceIds);

  // Extract input values using safe utility
  const inputValues = getInputValues(boolInputNodesData);

  // XNOR logic: true if all inputs have the same value (all truthy or all falsy)
  const trueInputs = inputValues.filter((value) => isTruthyValue(value)).length;
  const totalInputs = inputValues.length;
  const xnorResult =
    totalInputs > 0 && (trueInputs === 0 || trueInputs === totalInputs);

  // Add showUI state
  const [showUI, setShowUI] = React.useState(false);

  // Set output value in node data for downstream nodes
  const updateNodeData = useFlowStore((state) => state.updateNodeData);
  React.useEffect(() => {
    updateNodeData(id, {
      triggered: xnorResult,
      value: xnorResult,
    });
  }, [xnorResult, updateNodeData, id]);

  // RENDER
  return (
    <div
      className={`relative ${showUI ? "px-4 py-3 min-w-[120px] min-h-[120px]" : "w-[60px] h-[60px] flex items-center justify-center"} rounded-lg bg-cyan-100 dark:bg-cyan-900 shadow border border-cyan-300 dark:border-cyan-800`}
    >
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? "Collapse node" : "Expand node"}
        title={showUI ? "Collapse" : "Expand"}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-cyan-300 dark:border-cyan-800 text-xs hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors shadow"
        type="button"
      >
        {showUI ? "⦿" : "⦾"}
      </button>

      {/* INPUT HANDLE (left, boolean, allow multiple) */}
      <CustomHandle
        type="target"
        position={Position.Left}
        id="b"
        dataType="b"
      />

      {/* COLLAPSED: Only Icon */}
      {!showUI && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 flex items-center justify-center">
            <div
              className={`text-sm font-bold ${xnorResult ? "text-cyan-700 dark:text-cyan-300" : "text-cyan-400 dark:text-cyan-600"}`}
            >
              XNOR
            </div>
          </div>
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <>
          <div className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
            XNOR
          </div>
          <div className="text-xs text-cyan-800 dark:text-cyan-200 mb-2">
            Output: <span className="font-mono">{String(xnorResult)}</span>
          </div>
          <div className="text-xs text-cyan-800 dark:text-cyan-200 mb-2">
            True inputs: {trueInputs}/{totalInputs}
          </div>
          <div className="text-xs text-cyan-800 dark:text-cyan-200 mb-2">
            Inputs: {boolInputConnections.length}
          </div>
        </>
      )}

      {/* OUTPUT HANDLE (right, boolean) */}
      <CustomHandle
        type="source"
        position={Position.Right}
        id="b"
        dataType="b"
      />
    </div>
  );
};

export default LogicXnor;
