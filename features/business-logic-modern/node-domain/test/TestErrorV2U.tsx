/**
 * TEST ERROR V2U - Complete defineNode() Migration
 */

"use client";

import { Position } from "@xyflow/react";
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

  handles: [
    {
      id: "trigger",
      type: "target",
      position: Position.Left,
      dataType: "boolean",
      description: "Trigger input",
      enabled: true,
      validation: () => true,
    },
    {
      id: "text",
      type: "source",
      position: Position.Right,
      dataType: "string",
      description: "Error message output",
      enabled: true,
    },
  ],

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

  renderCollapsed: ({ data, updateNodeData, error, isSelected }) => {
    const isActive = data.isGeneratingError || data.isManuallyActivated;

    const handleToggle = () => {
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
          _errorCount: (data._errorCount || 0) + 1,
          _lastErrorTime: Date.now(),
        });
      }
    };

    return (
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center px-2 ${
          isSelected ? "ring-2 ring-blue-500" : ""
        } border rounded`}
      >
        <div className="text-xs font-semibold mb-2">Test Error V2U</div>

        <button
          onClick={handleToggle}
          className={`px-3 py-1 text-xs rounded font-medium ${
            isActive ? "bg-red-500 text-white" : "bg-green-500 text-white"
          }`}
        >
          {isActive ? "Reset" : "Activate"}
        </button>

        {data._v2uMigrated && (
          <div className="absolute top-1 right-1 text-xs text-blue-500 opacity-75">
            V2U
          </div>
        )}
      </div>
    );
  },

  renderExpanded: ({ data, updateNodeData, error, isSelected }) => {
    return (
      <div className="absolute inset-0 flex flex-col bg-white border rounded-lg">
        <div className="p-2 border-b">
          <span className="text-sm font-medium">Test Error V2U</span>
        </div>
        <div className="flex-1 p-2">
          <div className="text-sm">
            Error testing node with V2U architecture
          </div>
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
