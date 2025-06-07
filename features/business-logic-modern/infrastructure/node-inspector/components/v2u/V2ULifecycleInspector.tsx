/**
 * V2U LIFECYCLE INSPECTOR - Advanced lifecycle hooks monitoring and debugging
 *
 * 🎯 V2U UPGRADE: Complete lifecycle hooks inspection and debugging
 * • Real-time lifecycle hook execution monitoring
 * • Detailed timing metrics and performance analysis
 * • Hook execution history and error tracking
 * • Manual lifecycle trigger capabilities for testing
 * • Visual indicators for hook states and performance
 * • Advanced debugging tools and diagnostics
 *
 * Keywords: v2u-lifecycle, hooks, monitoring, debugging, performance, testing
 */

import { formatDistanceToNow } from "date-fns";
import React, { useState } from "react";
import { V2U_LIFECYCLE_CONFIG } from "../../constants";
import type {
  V2ULifecycleInspectorProps,
  V2ULifecycleState,
} from "../../types";

// ============================================================================
// LIFECYCLE INSPECTOR COMPONENT
// ============================================================================

export const V2ULifecycleInspector: React.FC<V2ULifecycleInspectorProps> = ({
  node,
  v2uState,
  onRefresh,
  debugMode,
  onTriggerLifecycle,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [isTriggering, setIsTriggering] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleTriggerHook = async (hook: keyof V2ULifecycleState) => {
    if (!onTriggerLifecycle || isTriggering) return;

    setIsTriggering(hook);
    try {
      await onTriggerLifecycle(hook);
      await onRefresh();
    } catch (error) {
      console.error(`Failed to trigger ${hook}:`, error);
    } finally {
      setIsTriggering(null);
    }
  };

  const getHookStatusColor = (hook: any) => {
    if (!hook || !hook.executed) return "text-gray-500 bg-gray-50";
    if (hook.error) return "text-red-600 bg-red-50";
    if (
      hook.duration &&
      hook.duration > V2U_LIFECYCLE_CONFIG.SLOW_MOUNT_THRESHOLD_MS
    ) {
      return "text-yellow-600 bg-yellow-50";
    }
    return "text-green-600 bg-green-50";
  };

  const getHookStatusIcon = (hook: any) => {
    if (!hook || !hook.executed) return "⭕";
    if (hook.error) return "❌";
    if (
      hook.duration &&
      hook.duration > V2U_LIFECYCLE_CONFIG.SLOW_MOUNT_THRESHOLD_MS
    ) {
      return "⚠️";
    }
    return "✅";
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return "N/A";
    return duration < 1000
      ? `${duration}ms`
      : `${(duration / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const lifecycle = v2uState.lifecycle;
  const hasExecutedHooks = Object.values(lifecycle).some(
    (hook) => hook?.executed
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Lifecycle Hooks
          </h3>
          {hasExecutedHooks && (
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="Refresh lifecycle state"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Executed Hooks
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {Object.values(lifecycle).filter((hook) => hook?.executed).length}
          </div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Data Changes
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {lifecycle.onDataChange?.executionCount || 0}
          </div>
        </div>
      </div>

      {/* Lifecycle Hooks List */}
      <div className="space-y-3">
        {/* onMount Hook */}
        <div className="border border-gray-200 dark:border-gray-700 rounded">
          <button
            onClick={() => toggleSection("onMount")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {getHookStatusIcon(lifecycle.onMount)}
              </span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  onMount
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {lifecycle.onMount?.executed
                    ? `Executed ${formatTimestamp(lifecycle.onMount.timestamp)}`
                    : "Not executed"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lifecycle.onMount?.duration && (
                <span
                  className={`text-xs px-2 py-1 rounded ${getHookStatusColor(lifecycle.onMount)}`}
                >
                  {formatDuration(lifecycle.onMount.duration)}
                </span>
              )}
              <span className="text-gray-400">
                {expandedSections.has("onMount") ? "▼" : "▶"}
              </span>
            </div>
          </button>

          {expandedSections.has("onMount") && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:{" "}
                    </span>
                    <span className={getHookStatusColor(lifecycle.onMount)}>
                      {lifecycle.onMount?.executed ? "Executed" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Duration:{" "}
                    </span>
                    <span>{formatDuration(lifecycle.onMount?.duration)}</span>
                  </div>
                </div>

                {lifecycle.onMount?.error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium">Error:</div>
                    <div className="mt-1">{lifecycle.onMount.error}</div>
                  </div>
                )}

                {debugMode && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleTriggerHook("onMount")}
                      disabled={isTriggering === "onMount"}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isTriggering === "onMount"
                        ? "⏳ Triggering..."
                        : "🧪 Test Hook"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* onUnmount Hook */}
        <div className="border border-gray-200 dark:border-gray-700 rounded">
          <button
            onClick={() => toggleSection("onUnmount")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {getHookStatusIcon(lifecycle.onUnmount)}
              </span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  onUnmount
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {lifecycle.onUnmount?.executed
                    ? `Executed ${formatTimestamp(lifecycle.onUnmount.timestamp)}`
                    : "Not executed"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lifecycle.onUnmount?.duration && (
                <span
                  className={`text-xs px-2 py-1 rounded ${getHookStatusColor(lifecycle.onUnmount)}`}
                >
                  {formatDuration(lifecycle.onUnmount.duration)}
                </span>
              )}
              <span className="text-gray-400">
                {expandedSections.has("onUnmount") ? "▼" : "▶"}
              </span>
            </div>
          </button>

          {expandedSections.has("onUnmount") && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Status:{" "}
                    </span>
                    <span className={getHookStatusColor(lifecycle.onUnmount)}>
                      {lifecycle.onUnmount?.executed ? "Executed" : "Pending"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Duration:{" "}
                    </span>
                    <span>{formatDuration(lifecycle.onUnmount?.duration)}</span>
                  </div>
                </div>

                {lifecycle.onUnmount?.error && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium">Error:</div>
                    <div className="mt-1">{lifecycle.onUnmount.error}</div>
                  </div>
                )}

                {debugMode && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleTriggerHook("onUnmount")}
                      disabled={isTriggering === "onUnmount"}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isTriggering === "onUnmount"
                        ? "⏳ Triggering..."
                        : "🧪 Test Hook"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* onDataChange Hook */}
        <div className="border border-gray-200 dark:border-gray-700 rounded">
          <button
            onClick={() => toggleSection("onDataChange")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {lifecycle.onDataChange?.executionCount ? "✅" : "⭕"}
              </span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  onDataChange
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {lifecycle.onDataChange?.executionCount
                    ? `${lifecycle.onDataChange.executionCount} executions`
                    : "No executions"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lifecycle.onDataChange?.averageDuration && (
                <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  avg: {formatDuration(lifecycle.onDataChange.averageDuration)}
                </span>
              )}
              <span className="text-gray-400">
                {expandedSections.has("onDataChange") ? "▼" : "▶"}
              </span>
            </div>
          </button>

          {expandedSections.has("onDataChange") && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Executions:{" "}
                    </span>
                    <span>{lifecycle.onDataChange?.executionCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Executed:{" "}
                    </span>
                    <span>
                      {formatTimestamp(lifecycle.onDataChange?.lastExecuted)}
                    </span>
                  </div>
                </div>

                {lifecycle.onDataChange?.lastError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    <div className="font-medium">Last Error:</div>
                    <div className="mt-1">
                      {lifecycle.onDataChange.lastError}
                    </div>
                  </div>
                )}

                {debugMode && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleTriggerHook("onDataChange")}
                      disabled={isTriggering === "onDataChange"}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isTriggering === "onDataChange"
                        ? "⏳ Triggering..."
                        : "🧪 Test Hook"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* onValidation Hook */}
        <div className="border border-gray-200 dark:border-gray-700 rounded">
          <button
            onClick={() => toggleSection("onValidation")}
            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm">
                {lifecycle.onValidation?.executionCount ? "✅" : "⭕"}
              </span>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  onValidation
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {lifecycle.onValidation?.executionCount
                    ? `${lifecycle.onValidation.executionCount} validations`
                    : "No validations"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {lifecycle.onValidation?.lastResult && (
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    lifecycle.onValidation.lastResult === true
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {lifecycle.onValidation.lastResult === true
                    ? "Valid"
                    : "Invalid"}
                </span>
              )}
              <span className="text-gray-400">
                {expandedSections.has("onValidation") ? "▼" : "▶"}
              </span>
            </div>
          </button>

          {expandedSections.has("onValidation") && (
            <div className="px-3 pb-3 border-t border-gray-200 dark:border-gray-700">
              <div className="space-y-2 mt-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Validations:{" "}
                    </span>
                    <span>{lifecycle.onValidation?.executionCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">
                      Last Result:{" "}
                    </span>
                    <span>
                      {lifecycle.onValidation?.lastResult === true
                        ? "Valid"
                        : lifecycle.onValidation?.lastResult === false
                          ? "Invalid"
                          : typeof lifecycle.onValidation?.lastResult ===
                              "string"
                            ? lifecycle.onValidation.lastResult
                            : "N/A"}
                    </span>
                  </div>
                </div>

                {debugMode && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleTriggerHook("onValidation")}
                      disabled={isTriggering === "onValidation"}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                    >
                      {isTriggering === "onValidation"
                        ? "⏳ Triggering..."
                        : "🧪 Test Hook"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No Hooks Message */}
      {!hasExecutedHooks && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="text-2xl mb-2">🔄</div>
          <div className="text-sm">
            No lifecycle hooks have been executed yet
          </div>
          <div className="text-xs mt-1">
            Hooks will appear here when the node executes its lifecycle methods
          </div>
        </div>
      )}
    </div>
  );
};
