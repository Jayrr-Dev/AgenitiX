/**
 * TEST ERROR V2U - Pure React Component
 *
 * ▸ Modern, declarative node built with pure React.
 * ▸ Configuration is driven by the associated `meta.json` file.
 * ▸ Allows manual generation of errors for testing purposes.
 */

"use client";

import { NodeProps } from "@xyflow/react";
import React, { useEffect } from "react";
import { NodeScaffold } from "@/components/nodes/NodeScaffold";
import { useNodeData } from "@/hooks/useNodeData";

// ============================================================================
// NODE DATA INTERFACE
// ============================================================================

interface TestErrorV2UData {
  handles: any[];
  errorMessage: string;
  errorType: "warning" | "error" | "critical";
  isGeneratingError: boolean;
  text: string;
  json: string;
}

// ============================================================================
// NODE COMPONENT
// ============================================================================

const TestErrorV2UNode: React.FC<NodeProps<TestErrorV2UData>> = ({ id, data }) => {
  const { nodeData, updateNodeData } = useNodeData(id, data);

  const handleToggle = () => {
    updateNodeData({ isGeneratingError: !nodeData.isGeneratingError });
  };

  const handleErrorMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNodeData({ errorMessage: e.target.value });
  };

  const handleErrorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData({
      errorType: e.target.value as "warning" | "error" | "critical",
    });
  };

  useEffect(() => {
    let text = "";
    let json = "";
    if (nodeData.isGeneratingError) {
      text = nodeData.errorMessage;
      json = JSON.stringify({
        error: nodeData.errorMessage,
        type: nodeData.errorType,
        timestamp: Date.now(),
      });
    }
    // Avoid unnecessary updates
    if (text !== nodeData.text || json !== nodeData.json) {
      updateNodeData({ text, json });
    }
  }, [nodeData.isGeneratingError, nodeData.errorMessage, nodeData.errorType, nodeData.text, nodeData.json, updateNodeData]);

  return (
    <NodeScaffold handles={data.handles || []}>
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-center">Test Error Generator</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Error Message
          </label>
          <input
            type="text"
            value={nodeData.errorMessage}
            onChange={handleErrorMessageChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Error Type
          </label>
          <select
            value={nodeData.errorType}
            onChange={handleErrorTypeChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600"
          >
            <option>warning</option>
            <option>error</option>
            <option>critical</option>
          </select>
        </div>
        <button
          onClick={handleToggle}
          className={`w-full py-2 px-4 rounded-md font-semibold text-white transition-colors ${
            nodeData.isGeneratingError
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {nodeData.isGeneratingError ? "Deactivate Error" : "Activate Error"}
        </button>
      </div>
    </NodeScaffold>
  );
};

export default TestErrorV2UNode;
