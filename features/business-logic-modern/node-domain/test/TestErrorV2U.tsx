/**
 * TEST ERROR V2U - Complete defineNode() Migration
 */

"use client";

import { BaseNodeData } from "../../infrastructure/flow-engine/types/nodeData";
import { defineNode } from "../../infrastructure/node-creation";

// Node data interface
interface TestErrorV2UData extends BaseNodeData {
  errorMessage: string;
  errorType: "warning" | "error" | "critical";
  triggerMode: "always" | "trigger_on" | "trigger_off";
  isGeneratingError: boolean;
  isManuallyActivated?: boolean;
  text: string;
  json: string;
  _v2uMigrated?: boolean;
  _v2uMigrationDate?: number;
  _errorCount?: number;
  _lastErrorTime?: number;
}

// Export the V2U node
export default defineNode<TestErrorV2UData>({
  metadata: {
    nodeType: "testErrorV2U",
    category: "testing",
    displayName: "Test Error (V2U)",
    description: "Enhanced error generation with V2U architecture",
    icon: "🧪",
    folder: "main",
    version: "2.0.0",
    author: "V2U Migration Team",
    tags: ["testing", "error", "v2u"],
    experimental: false,
  },
  // Handles are defined in the constants/handles.ts file
  handles: [],

  defaultData: {
    errorMessage: "Custom error message",
    errorType: "error",
    triggerMode: "trigger_on",
    isGeneratingError: false,
    text: "",
    json: "",
    _v2uMigrated: true,
    _v2uMigrationDate: Date.now(),
    _errorCount: 0,
  },

  size: {
    collapsed: { width: 120, height: 100 },
    expanded: { width: 300, height: 200 },
  },

  processLogic: async ({ data, updateNodeData, setError, nodeId }) => {
    try {
      let shouldGenerate = data.isManuallyActivated || false;

      if (data.triggerMode === "always") {
        shouldGenerate = true;
      }

      const updates: Partial<TestErrorV2UData> = {
        isGeneratingError: shouldGenerate,
        _v2uMigrated: true,
      };

      if (shouldGenerate) {
        updates.text = data.errorMessage;
        updates.json = JSON.stringify({
          error: data.errorMessage,
          type: data.errorType,
          timestamp: Date.now(),
        });
      } else {
        updates.text = "";
        updates.json = "";
      }

      updateNodeData(updates);
      setError(null);
    } catch (error) {
      setError("Processing error");
    }
  },

  renderCollapsed: ({ data, updateNodeData, error }) => {
    const isActive = data.isGeneratingError || data.isManuallyActivated;

    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isActive) {
        updateNodeData({
          isGeneratingError: false,
          isManuallyActivated: false,
          text: "",
          json: "",
        });
      } else {
        updateNodeData({
          isGeneratingError: true,
          isManuallyActivated: true,
        });
      }
    };

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
      </div>
    );
  },

  renderExpanded: ({ data, updateNodeData, error }) => {
    const isActive = data.isGeneratingError || data.isManuallyActivated;

    const handleErrorMessageChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      updateNodeData({ errorMessage: e.target.value });
    };

    const handleErrorTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData({
        errorType: e.target.value as "warning" | "error" | "critical",
      });
    };

    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isActive) {
        updateNodeData({
          isGeneratingError: false,
          isManuallyActivated: false,
          text: "",
          json: "",
        });
      } else {
        updateNodeData({
          isGeneratingError: true,
          isManuallyActivated: true,
        });
      }
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

  lifecycle: {
    onMount: async ({ nodeId }) => {
      console.log(`[TestErrorV2U] Node ${nodeId} mounted`);
    },
    onUnmount: async ({ nodeId }) => {
      console.log(`[TestErrorV2U] Node ${nodeId} unmounted`);
    },
    onValidation: (data) => {
      if (!data.errorMessage) return "Error message required";
      return true;
    },
  },

  security: {
    requiresAuth: false,
    permissions: ["node:read", "node:write"],
    maxExecutionsPerMinute: 100,
    dataAccessLevel: "write",
  },

  performance: {
    timeout: 3000,
    maxMemoryMB: 5,
    priority: "low",
    retryAttempts: 1,
    retryDelay: 1000,
    cacheable: false,
    cacheKeyGenerator: (data) => `testErrorV2U:${data.errorType}`,
  },

  autoRegister: true,
  registryPath: "test/testErrorV2U",
});
