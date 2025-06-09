import { BaseNodeData } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { Position } from "@xyflow/react";
import { useState } from "react";
import { z } from "zod";
import {
  defineNode,
  NodeExecutionContext,
  NodeRenderContext,
} from "../../node-creation";

// Data interface for API Integration Node
interface APIIntegrationData extends BaseNodeData {
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers: Record<string, string>;
  body?: string;
  timeout: number;
  retryCount: number;
  cache: boolean;
  cacheExpiry: number; // in seconds

  // Response data
  lastResponse?: any;
  lastError?: string;
  isLoading: boolean;

  // V2 metadata
  _v2RegistryVersion?: string;
  _v2CreatedAt?: number;
  _v2NodeType?: string;
}

// Zod schema for validation
const APIIntegrationSchema = z.object({
  endpoint: z.string().url("Must be a valid URL"),
  method: z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]),
  headers: z.record(z.string()),
  body: z.string().optional(),
  timeout: z.number().min(1000).max(30000),
  retryCount: z.number().min(0).max(5),
  cache: z.boolean(),
  cacheExpiry: z.number().min(60).max(3600),
});

// Advanced cache manager
class APICache {
  private static cache = new Map<string, { data: any; expiry: number }>();

  static set(key: string, data: any, expirySeconds: number): void {
    const expiry = Date.now() + expirySeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  static get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  static clear(): void {
    this.cache.clear();
  }
}

// API execution logic with advanced features
async function executeAPIRequest(
  context: NodeExecutionContext<APIIntegrationData>
): Promise<void> {
  const { data, updateNodeData, emitEvent } = context;

  // Validate input data
  try {
    APIIntegrationSchema.parse(data);
  } catch (error) {
    updateNodeData({
      lastError: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      isLoading: false,
    });
    return;
  }

  // Generate cache key
  const cacheKey = `${data.method}:${data.endpoint}:${JSON.stringify(data.headers)}:${data.body}`;

  // Check cache if enabled
  if (data.cache) {
    const cached = APICache.get(cacheKey);
    if (cached) {
      updateNodeData({
        lastResponse: cached,
        lastError: undefined,
        isLoading: false,
      });
      emitEvent("api:cache-hit", { endpoint: data.endpoint });
      return;
    }
  }

  // Set loading state
  updateNodeData({ isLoading: true, lastError: undefined });
  emitEvent("api:request-start", {
    endpoint: data.endpoint,
    method: data.method,
  });

  let attempt = 0;
  const maxAttempts = data.retryCount + 1;

  while (attempt < maxAttempts) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), data.timeout);

      const requestOptions: RequestInit = {
        method: data.method,
        headers: {
          "Content-Type": "application/json",
          ...data.headers,
        },
        signal: controller.signal,
      };

      if (data.body && ["POST", "PUT", "PATCH"].includes(data.method)) {
        requestOptions.body = data.body;
      }

      const response = await fetch(data.endpoint, requestOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Cache successful response
      if (data.cache) {
        APICache.set(cacheKey, responseData, data.cacheExpiry);
      }

      updateNodeData({
        lastResponse: responseData,
        lastError: undefined,
        isLoading: false,
      });

      emitEvent("api:request-success", {
        endpoint: data.endpoint,
        responseSize: JSON.stringify(responseData).length,
      });

      return; // Success, exit retry loop
    } catch (error) {
      attempt++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (attempt >= maxAttempts) {
        // Final failure
        updateNodeData({
          lastError: `Failed after ${maxAttempts} attempts: ${errorMessage}`,
          isLoading: false,
        });

        emitEvent("api:request-failed", {
          endpoint: data.endpoint,
          error: errorMessage,
          attempts: attempt,
        });
      } else {
        // Retry with exponential backoff
        const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s...
        emitEvent("api:retry", {
          endpoint: data.endpoint,
          attempt,
          delay,
        });

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}

// Create the API Integration Node
export const APIIntegrationNode = defineNode<APIIntegrationData>({
  metadata: {
    nodeType: "apiIntegration",
    category: "transform",
    displayName: "API Integration",
    description:
      "Advanced API integration with caching, retries, and error handling",
    icon: "api",
    folder: "main",
    order: 10,
    version: "2.0.0",
    author: "V2U System",
    tags: ["api", "http", "integration", "advanced"],
    experimental: false,
  },

  handles: [
    {
      id: "trigger",
      type: "target",
      position: Position.Left,
      dataType: "trigger",
      description: "Trigger the API request",
    },
    {
      id: "response",
      type: "source",
      position: Position.Right,
      dataType: "object",
      description: "API response data",
    },
    {
      id: "error",
      type: "source",
      position: Position.Bottom,
      dataType: "string",
      description: "Error message if request fails",
    },
  ],

  defaultData: {
    endpoint: "https://api.example.com/data",
    method: "GET",
    headers: {
      "User-Agent": "V2U-API-Node/2.0.0",
    },
    timeout: 10000,
    retryCount: 3,
    cache: true,
    cacheExpiry: 300, // 5 minutes
    isLoading: false,
  },

  size: {
    collapsed: { width: 280, height: 120 },
    expanded: { width: 400, height: 300 },
  },

  processLogic: executeAPIRequest,

  // Advanced lifecycle management
  lifecycle: {
    onMount: async (context) => {
      console.log(`[API Node] Mounted: ${context.nodeId}`);
      context.emitEvent("api:node-mounted", { nodeId: context.nodeId });
    },

    onUnmount: async (context) => {
      console.log(`[API Node] Unmounted: ${context.nodeId}`);
      context.emitEvent("api:node-unmounted", { nodeId: context.nodeId });
    },

    onDataChange: async (newData, oldData, context) => {
      // Auto-trigger request if endpoint changes
      if (newData.endpoint !== oldData.endpoint && newData.endpoint) {
        console.log(`[API Node] Endpoint changed, auto-triggering request`);
        setTimeout(() => executeAPIRequest(context), 100);
      }
    },

    onValidation: (data) => {
      try {
        APIIntegrationSchema.parse(data);
        return true;
      } catch (error) {
        return error instanceof Error ? error.message : "Validation failed";
      }
    },
  },

  // Security constraints
  security: {
    requiresAuth: false,
    permissions: ["api:read", "api:write"],
    maxExecutionsPerMinute: 30,
    dataAccessLevel: "read",
  },

  // Performance configuration
  performance: {
    timeout: 30000,
    maxMemoryMB: 50,
    priority: "normal",
    retryAttempts: 3,
    retryDelay: 1000,
    cacheable: true,
    cacheKeyGenerator: (data) =>
      `api:${data.method}:${data.endpoint}:${JSON.stringify(data.headers)}`,
  },

  // Validation schemas
  dataSchema: APIIntegrationSchema,

  renderCollapsed: ({
    data,
    error,
    context,
  }: NodeRenderContext<APIIntegrationData>) => {
    const statusColor = data.isLoading
      ? "text-blue-600"
      : data.lastError
        ? "text-red-600"
        : data.lastResponse
          ? "text-green-600"
          : "text-gray-600";

    return (
      <div className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Status indicator */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            API Integration
          </h3>
          <div className={`text-xs font-medium ${statusColor}`}>
            {data.isLoading
              ? "Loading..."
              : data.lastError
                ? "Error"
                : data.lastResponse
                  ? "Success"
                  : "Ready"}
          </div>
        </div>

        {/* Endpoint display */}
        <div className="text-xs text-gray-600 dark:text-gray-400 truncate mb-1">
          {data.method} {data.endpoint}
        </div>

        {/* Loading indicator */}
        {data.isLoading && (
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div className="bg-blue-600 h-1 rounded-full animate-pulse w-1/2"></div>
          </div>
        )}

        {/* Error display */}
        {data.lastError && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1 truncate">
            ⚠️ {data.lastError}
          </div>
        )}

        {/* Success indicator */}
        {data.lastResponse && !data.isLoading && (
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✅ Response received
          </div>
        )}
      </div>
    );
  },

  renderExpanded: ({
    data,
    updateNodeData,
    context,
  }: NodeRenderContext<APIIntegrationData>) => {
    const [activeTab, setActiveTab] = useState<"config" | "response" | "debug">(
      "config"
    );

    const handleExecute = () => {
      executeAPIRequest(context);
    };

    const handleClearCache = () => {
      APICache.clear();
      updateNodeData({ lastResponse: undefined, lastError: undefined });
    };

    return (
      <div className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            API Integration
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExecute}
              disabled={data.isLoading}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {data.isLoading ? "Loading..." : "Execute"}
            </button>
            <button
              onClick={handleClearCache}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-600 mb-3">
          {["config", "response", "debug"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1 text-sm capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "config" && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Method</label>
                <select
                  value={data.method}
                  onChange={(e) =>
                    updateNodeData({ method: e.target.value as any })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={data.timeout}
                  onChange={(e) =>
                    updateNodeData({ timeout: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="1000"
                  max="30000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Endpoint URL
              </label>
              <input
                type="url"
                value={data.endpoint}
                onChange={(e) => updateNodeData({ endpoint: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="https://api.example.com/endpoint"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Retry Count
                </label>
                <input
                  type="number"
                  value={data.retryCount}
                  onChange={(e) =>
                    updateNodeData({ retryCount: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="0"
                  max="5"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={data.cache}
                    onChange={(e) =>
                      updateNodeData({ cache: e.target.checked })
                    }
                  />
                  Enable Cache
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Cache Expiry (s)
                </label>
                <input
                  type="number"
                  value={data.cacheExpiry}
                  onChange={(e) =>
                    updateNodeData({ cacheExpiry: parseInt(e.target.value) })
                  }
                  className="w-full px-2 py-1 border rounded text-sm"
                  min="60"
                  disabled={!data.cache}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "response" && (
          <div className="space-y-3">
            {data.lastResponse ? (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Response Data
                </label>
                <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(data.lastResponse, null, 2)}
                </pre>
              </div>
            ) : data.lastError ? (
              <div>
                <label className="block text-sm font-medium mb-1 text-red-600">
                  Error
                </label>
                <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-sm text-red-700 dark:text-red-400">
                  {data.lastError}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No response data yet. Execute the API request to see results.
              </div>
            )}
          </div>
        )}

        {activeTab === "debug" && (
          <div className="space-y-3 text-xs">
            <div>
              <strong>Node ID:</strong> {context.nodeId}
            </div>
            <div>
              <strong>Performance:</strong> Start time:{" "}
              {new Date(context.performance.startTime).toLocaleTimeString()}
            </div>
            <div>
              <strong>Security:</strong> Can execute:{" "}
              {context.security.canExecute ? "Yes" : "No"}
            </div>
            <div>
              <strong>Cache Key:</strong>{" "}
              {`api:${data.method}:${data.endpoint}`}
            </div>
          </div>
        )}
      </div>
    );
  },

  renderInspector: ({
    data,
    updateNodeData,
  }: NodeRenderContext<APIIntegrationData>) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <h3 className="text-sm font-medium">API Integration Settings</h3>
        <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
          V2
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Headers (JSON)</label>
        <textarea
          value={JSON.stringify(data.headers, null, 2)}
          onChange={(e) => {
            try {
              const headers = JSON.parse(e.target.value);
              updateNodeData({ headers });
            } catch {
              // Invalid JSON, ignore
            }
          }}
          className="w-full px-2 py-1 border rounded text-sm font-mono"
          rows={4}
        />
      </div>

      {["POST", "PUT", "PATCH"].includes(data.method) && (
        <div>
          <label className="block text-sm font-medium mb-1">Request Body</label>
          <textarea
            value={data.body || ""}
            onChange={(e) => updateNodeData({ body: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm font-mono"
            rows={6}
            placeholder="Request body (JSON, XML, etc.)"
          />
        </div>
      )}
    </div>
  ),
});

export default APIIntegrationNode;
