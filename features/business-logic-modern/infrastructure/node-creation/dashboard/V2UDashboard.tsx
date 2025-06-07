// V2U Interactive Development Dashboard
// Professional development interface for V2U node system management

import React, { useCallback, useEffect, useMemo, useState } from "react";

// Types
interface NodeMetrics {
  totalNodes: number;
  activeNodes: number;
  errorNodes: number;
  categories: string[];
  averageRenderTime: number;
  memoryUsage: number;
  lastUpdated: string;
}

interface PerformanceMetrics {
  registryLookupTime: number;
  componentRenderTime: number;
  memoryUsage: number;
  eventQueueSize: number;
  cacheHitRate: number;
  bundleSize: number;
}

interface ValidationResult {
  totalIssues: number;
  errors: number;
  warnings: number;
  healthScore: number;
  issues: Array<{
    nodeType: string;
    severity: "error" | "warning";
    message: string;
    suggestion?: string;
  }>;
}

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  status: "active" | "inactive" | "error";
  category: string;
  description: string;
  performance: {
    loadTime: number;
    memoryUsage: number;
    errorCount: number;
  };
}

export const V2UDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Data state
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetrics | null>(null);
  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [validationResults, setValidationResults] =
    useState<ValidationResult | null>(null);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [systemHealth, setSystemHealth] = useState<
    "healthy" | "warning" | "error"
  >("healthy");

  // Auto-refresh functionality
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      refreshDashboardData();
    }, 30000); // Refresh every 30 seconds

    // Initial load
    refreshDashboardData();

    return () => clearInterval(refreshInterval);
  }, []);

  // Refresh dashboard data
  const refreshDashboardData = useCallback(async () => {
    setIsLoading(true);

    try {
      // Simulate API calls - in real implementation, these would call actual V2U APIs
      await Promise.all([
        loadNodeMetrics(),
        loadPerformanceMetrics(),
        loadValidationResults(),
        loadPluginData(),
      ]);

      setLastRefresh(new Date());
    } catch (error) {
      console.error("[V2U Dashboard] Error refreshing data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load node metrics
  const loadNodeMetrics = async () => {
    // Mock data - replace with actual V2U registry API calls
    const mockMetrics: NodeMetrics = {
      totalNodes: 47,
      activeNodes: 44,
      errorNodes: 3,
      categories: ["create", "transform", "output", "utility", "testing"],
      averageRenderTime: 12.5,
      memoryUsage: 156.7,
      lastUpdated: new Date().toISOString(),
    };

    setNodeMetrics(mockMetrics);
  };

  // Load performance metrics
  const loadPerformanceMetrics = async () => {
    const mockPerformance: PerformanceMetrics = {
      registryLookupTime: 2.3,
      componentRenderTime: 8.7,
      memoryUsage: 234.5,
      eventQueueSize: 12,
      cacheHitRate: 94.2,
      bundleSize: 1.2,
    };

    setPerformanceMetrics(mockPerformance);
  };

  // Load validation results
  const loadValidationResults = async () => {
    const mockValidation: ValidationResult = {
      totalIssues: 5,
      errors: 2,
      warnings: 3,
      healthScore: 87,
      issues: [
        {
          nodeType: "createTextV2",
          severity: "error",
          message: "Missing required handle configuration",
          suggestion: "Add output handle for text data",
        },
        {
          nodeType: "transformDataV2",
          severity: "warning",
          message: "Performance optimization recommended",
          suggestion: "Consider memoizing expensive calculations",
        },
      ],
    };

    setValidationResults(mockValidation);

    // Update system health based on validation
    if (mockValidation.errors > 0) {
      setSystemHealth("error");
    } else if (mockValidation.warnings > 2) {
      setSystemHealth("warning");
    } else {
      setSystemHealth("healthy");
    }
  };

  // Load plugin data
  const loadPluginData = async () => {
    const mockPlugins: PluginInfo[] = [
      {
        id: "analytics-plugin",
        name: "Analytics Plugin",
        version: "1.2.0",
        status: "active",
        category: "analytics",
        description: "Real-time performance analytics and monitoring",
        performance: {
          loadTime: 45,
          memoryUsage: 12.3,
          errorCount: 0,
        },
      },
      {
        id: "theme-plugin",
        name: "Theme Manager",
        version: "2.1.0",
        status: "active",
        category: "ui",
        description: "Dynamic theme switching and customization",
        performance: {
          loadTime: 23,
          memoryUsage: 8.7,
          errorCount: 0,
        },
      },
      {
        id: "validator-plugin",
        name: "Advanced Validator",
        version: "1.0.5",
        status: "error",
        category: "validation",
        description: "Enhanced node validation with custom rules",
        performance: {
          loadTime: 67,
          memoryUsage: 15.2,
          errorCount: 3,
        },
      },
    ];

    setPlugins(mockPlugins);
  };

  // Computed values
  const healthColor = useMemo(() => {
    switch (systemHealth) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  }, [systemHealth]);

  // Event handlers
  const handleRunValidation = async () => {
    setIsLoading(true);
    await loadValidationResults();
    setIsLoading(false);
  };

  const handleExportData = () => {
    const exportData = {
      nodeMetrics,
      performanceMetrics,
      validationResults,
      plugins,
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `v2u-dashboard-export-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
  };

  const handlePluginToggle = (pluginId: string) => {
    setPlugins((prev) =>
      prev.map((plugin) =>
        plugin.id === pluginId
          ? {
              ...plugin,
              status: plugin.status === "active" ? "inactive" : "active",
            }
          : plugin
      )
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              V2U Development Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Professional development tools for V2U node system management
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>🕒</span>
              <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
            </div>

            <button
              onClick={refreshDashboardData}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "🔄" : "↻"} Refresh
            </button>

            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              📥 Export
            </button>
          </div>
        </div>

        {/* System Health Alert */}
        {systemHealth !== "healthy" && (
          <div
            className={`p-4 rounded-lg border ${
              systemHealth === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-yellow-50 border-yellow-200 text-yellow-800"
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2">
                {systemHealth === "error" ? "❌" : "⚠️"}
              </span>
              <div>
                <h3 className="font-semibold">
                  System Health: {systemHealth.toUpperCase()}
                </h3>
                <p className="text-sm">
                  {systemHealth === "error"
                    ? "Critical issues detected. Please review the validation results."
                    : "Some issues detected. Consider reviewing the warnings."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <div className="bg-white rounded-lg shadow">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                "overview",
                "performance",
                "plugins",
                "validation",
                "testing",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          System Health
                        </p>
                        <p className={`text-2xl font-bold ${healthColor}`}>
                          {systemHealth.charAt(0).toUpperCase() +
                            systemHealth.slice(1)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {validationResults?.healthScore}% health score
                        </p>
                      </div>
                      <span className="text-2xl">
                        {systemHealth === "healthy"
                          ? "✅"
                          : systemHealth === "warning"
                            ? "⚠️"
                            : "❌"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Nodes
                        </p>
                        <p className="text-2xl font-bold">
                          {nodeMetrics?.totalNodes || 0}
                        </p>
                        <p className="text-xs text-gray-500">
                          {nodeMetrics?.activeNodes || 0} active,{" "}
                          {nodeMetrics?.errorNodes || 0} errors
                        </p>
                      </div>
                      <span className="text-2xl">📦</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Avg Render Time
                        </p>
                        <p className="text-2xl font-bold">
                          {nodeMetrics?.averageRenderTime || 0}ms
                        </p>
                        <p className="text-xs text-gray-500">
                          {performanceMetrics?.cacheHitRate || 0}% cache hit
                          rate
                        </p>
                      </div>
                      <span className="text-2xl">⚡</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Memory Usage
                        </p>
                        <p className="text-2xl font-bold">
                          {nodeMetrics?.memoryUsage || 0}MB
                        </p>
                        <p className="text-xs text-gray-500">
                          {performanceMetrics?.bundleSize || 0}MB bundle size
                        </p>
                      </div>
                      <span className="text-2xl">💾</span>
                    </div>
                  </div>
                </div>

                {/* Node Categories */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">
                    Node Categories
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {nodeMetrics?.categories.map((category) => (
                      <div key={category} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.floor(Math.random() * 15) + 5}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {category}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">
                    Recent Activity
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-green-600">✅</span>
                      <span className="text-sm">
                        Registry validation completed successfully
                      </span>
                      <span className="text-xs text-gray-500">
                        2 minutes ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-blue-600">📊</span>
                      <span className="text-sm">
                        Performance metrics updated
                      </span>
                      <span className="text-xs text-gray-500">
                        5 minutes ago
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-purple-600">📦</span>
                      <span className="text-sm">
                        New node registered: CreateImageV2
                      </span>
                      <span className="text-xs text-gray-500">
                        12 minutes ago
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">
                      Registry Performance
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Lookup Time</span>
                        <span className="font-mono text-sm">
                          {performanceMetrics?.registryLookupTime}ms
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: "85%" }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Cache Hit Rate</span>
                        <span className="font-mono text-sm">
                          {performanceMetrics?.cacheHitRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${performanceMetrics?.cacheHitRate || 0}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">
                      Component Performance
                    </h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Render Time</span>
                        <span className="font-mono text-sm">
                          {performanceMetrics?.componentRenderTime}ms
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-600 h-2 rounded-full"
                          style={{ width: "65%" }}
                        ></div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-sm">Event Queue</span>
                        <span className="font-mono text-sm">
                          {performanceMetrics?.eventQueueSize} events
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full"
                          style={{ width: "30%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">
                    Performance Trends
                  </h3>
                  <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <span className="text-4xl mb-2 block">📊</span>
                      <p>Performance chart will be displayed here</p>
                      <p className="text-sm">Real-time metrics visualization</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Plugins Tab */}
            {activeTab === "plugins" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">Plugin Management</h3>
                    <p className="text-gray-600">
                      Manage and monitor V2U system plugins
                    </p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    📦 Install Plugin
                  </button>
                </div>

                <div className="space-y-4">
                  {plugins.map((plugin) => (
                    <div
                      key={plugin.id}
                      className="bg-white p-6 rounded-lg border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{plugin.name}</h4>
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {plugin.version}
                              </span>
                              <span
                                className={`px-2 py-1 text-xs rounded ${
                                  plugin.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : plugin.status === "error"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {plugin.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {plugin.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>Load: {plugin.performance.loadTime}ms</span>
                              <span>
                                Memory: {plugin.performance.memoryUsage}MB
                              </span>
                              <span>
                                Errors: {plugin.performance.errorCount}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePluginToggle(plugin.id)}
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                          >
                            {plugin.status === "active" ? "Disable" : "Enable"}
                          </button>
                          <button className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200">
                            ⚙️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Tab */}
            {activeTab === "validation" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">System Validation</h3>
                    <p className="text-gray-600">
                      Validate node configurations and system health
                    </p>
                  </div>
                  <button
                    onClick={handleRunValidation}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    🛡️ Run Validation
                  </button>
                </div>

                {/* Validation Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {validationResults?.healthScore || 0}%
                    </div>
                    <div className="text-sm text-gray-600">Health Score</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {validationResults?.errors || 0}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {validationResults?.warnings || 0}
                    </div>
                    <div className="text-sm text-gray-600">Warnings</div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {validationResults?.totalIssues || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Issues</div>
                  </div>
                </div>

                {/* Validation Issues */}
                {validationResults?.issues &&
                  validationResults.issues.length > 0 && (
                    <div className="bg-white p-6 rounded-lg border">
                      <h3 className="text-lg font-semibold mb-4">
                        Validation Issues
                      </h3>
                      <div className="space-y-3">
                        {validationResults.issues.map((issue, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <span className="text-lg">
                                {issue.severity === "error" ? "❌" : "⚠️"}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium">
                                    {issue.nodeType}
                                  </span>
                                  <span
                                    className={`px-2 py-1 text-xs rounded ${
                                      issue.severity === "error"
                                        ? "bg-red-100 text-red-800"
                                        : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {issue.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {issue.message}
                                </p>
                                {issue.suggestion && (
                                  <p className="text-sm text-blue-600 mt-1">
                                    💡 {issue.suggestion}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Testing Tab */}
            {activeTab === "testing" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">
                    Node Testing Interface
                  </h3>
                  <p className="text-gray-600">
                    Test individual nodes and system components
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Quick Test */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Quick Test</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Select Node Type
                        </label>
                        <select className="w-full p-2 border rounded-md">
                          <option>createTextV2</option>
                          <option>transformDataV2</option>
                          <option>outputFileV2</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Test Data</label>
                        <textarea
                          className="w-full p-2 border rounded-md h-20"
                          placeholder="Enter test data (JSON format)"
                        />
                      </div>

                      <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        ▶️ Run Test
                      </button>
                    </div>
                  </div>

                  {/* Test Results */}
                  <div className="bg-white p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Test Results</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-600">✅</span>
                          <span className="text-sm">createTextV2</span>
                        </div>
                        <span className="text-xs text-green-600">
                          PASSED (12ms)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-red-600">❌</span>
                          <span className="text-sm">transformDataV2</span>
                        </div>
                        <span className="text-xs text-red-600">
                          FAILED (45ms)
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <span className="text-yellow-600">🕒</span>
                          <span className="text-sm">outputFileV2</span>
                        </div>
                        <span className="text-xs text-yellow-600">RUNNING</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test Coverage */}
                <div className="bg-white p-6 rounded-lg border">
                  <h3 className="text-lg font-semibold mb-4">Test Coverage</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        87%
                      </div>
                      <div className="text-sm text-gray-600">
                        Overall Coverage
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">42</div>
                      <div className="text-sm text-gray-600">Tests Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <div className="text-sm text-gray-600">Tests Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">2</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default V2UDashboard;
