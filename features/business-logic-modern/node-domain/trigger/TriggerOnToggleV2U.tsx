/**
 * TRIGGER ON TOGGLE V2U - Pure React Component
 *
 * ▸ Modern, declarative node built with pure React and composed UI components.
 * ▸ All configuration is driven by the associated `meta.json` file.
 * ▸ Provides a simple toggle UI to control a boolean state.
 */

"use client";

import { NodeProps } from "@xyflow/react";
import React, { useState } from "react";
import { NodeScaffold } from "@/components/nodes/NodeScaffold";
import { useNodeData } from "@/hooks/useNodeData";
import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TriggerOnToggleV2UData extends BaseNodeData {
  isActive: boolean;
  triggerState: "active" | "inactive";
}

// ============================================================================
// UI COMPONENTS
// ============================================================================

const ToggleSwitch = ({
  isOn,
  onToggle,
  disabled,
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        isOn ? "bg-green-600" : "bg-gray-400"
      }`}
      aria-pressed={isOn}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          isOn ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
};

const CollapsedView = ({ isActive }: { isActive: boolean }) => (
  <div className="p-4 flex flex-col items-center justify-center">
    <p className="text-sm font-bold dark:text-gray-200">Toggle</p>
    <p className="text-xs text-gray-500 dark:text-gray-400">
      {isActive ? "Active" : "Inactive"}
    </p>
  </div>
);

const ExpandedView = ({
  id,
  isActive,
  onToggle,
}: {
  id: string;
  isActive: boolean;
  onToggle: () => void;
}) => (
  <div className="p-4 pt-8 flex flex-col items-center justify-center space-y-3">
    <label htmlFor={`toggle-${id}`} className="font-bold text-gray-800 dark:text-gray-200">
      Toggle Trigger
    </label>
    <ToggleSwitch isOn={isActive} onToggle={onToggle} />
    <p className="text-sm text-gray-500 dark:text-gray-400">
      State: <span className="font-semibold">{isActive ? "Active" : "Inactive"}</span>
    </p>
  </div>
);

// ============================================================================
// NODE COMPONENT
// ============================================================================

const TriggerOnToggleV2UNode: React.FC<NodeProps<TriggerOnToggleV2UData>> = ({ id, data, type }) => {
  const { nodeData, updateNodeData } = useNodeData<TriggerOnToggleV2UData>(id, data);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const handleToggle = () => {
    const newIsActive = !nodeData.isActive;
    updateNodeData({
      isActive: newIsActive,
      triggerState: newIsActive ? "active" : "inactive",
    });
  };

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <NodeScaffold
      nodeId={id}
      nodeType={type}
      isCollapsed={isCollapsed}
      onToggleCollapse={handleToggleCollapse}
    >
      {isCollapsed ? (
        <CollapsedView isActive={!!nodeData.isActive} />
      ) : (
        <ExpandedView id={id} isActive={!!nodeData.isActive} onToggle={handleToggle} />
      )}
    </NodeScaffold>
  );
};

export default TriggerOnToggleV2UNode;
