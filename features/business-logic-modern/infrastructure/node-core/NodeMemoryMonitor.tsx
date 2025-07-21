/**
 * NODE MEMORY MONITOR - Visual memory management component
 *
 * • Real-time memory usage visualization
 * • Memory pressure indicators and alerts
 * • Manual garbage collection controls
 * • Memory analytics and performance metrics
 * • Integration with Node Inspector
 *
 * Keywords: memory-monitor, visualization, analytics, performance, inspector
 */

import React, { useState } from "react";
import { useMemoryAnalytics } from "./useNodeMemory";
import type { MemoryMetrics } from "./NodeMemory";

interface NodeMemoryMonitorProps {
  nodeId: string;
  compact?: boolean;
  showControls?: boolean;
}

/**
 * Memory usage visualization component
 */
export const NodeMemoryMonitor: React.FC<NodeMemoryMonitorProps> = ({
  nodeId,
  compact = false,
  showControls = true
}) => {
  const {
    metrics,
    history,
    isHealthy,
    needsCleanup,
    performGC,
    clearMemory
  } = useMemoryAnalytics(nodeId);

  const [showDetails, setShowDetails] = useState(false);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatPercentage = (value: number): string => {
    return (value * 100).toFixed(1) + '%';
  };

  const getMemoryPressureColor = (pressure: number): string => {
    if (pressure < 0.5) return 'text-green-600';
    if (pressure < 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMemoryPressureBackground = (pressure: number): string => {
    if (pressure < 0.5) return 'bg-green-100';
    if (pressure < 0.8) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-2 text-xs">
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-red-400'}`} />
        <span className="text-gray-600">
          {formatBytes(metrics.totalSize)} / {metrics.entryCount} items
        </span>
        {needsCleanup && (
          <button
            onClick={performGC}
            className="px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs hover:bg-yellow-200"
          >
            GC
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-3 bg-white border rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900">Node Memory</h4>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className={`text-xs ${getMemoryPressureColor(metrics.memoryPressure)}`}>
            {formatPercentage(metrics.memoryPressure)} pressure
          </span>
        </div>
      </div>

      {/* Memory Usage Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Memory Usage</span>
          <span>{formatBytes(metrics.totalSize)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              metrics.memoryPressure < 0.5 ? 'bg-green-500' :
              metrics.memoryPressure < 0.8 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(metrics.memoryPressure * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
        <div>
          <div className="text-gray-500">Entries</div>
          <div className="font-medium">{metrics.entryCount}</div>
        </div>
        <div>
          <div className="text-gray-500">Hit Rate</div>
          <div className="font-medium">{formatPercentage(metrics.hitRate)}</div>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex space-x-2 mb-3">
          <button
            onClick={performGC}
            className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200 transition-colors"
          >
            Garbage Collect
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200 transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          <button
            onClick={clearMemory}
            className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200 transition-colors"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetails && (
        <div className="border-t pt-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-gray-500">Miss Rate</div>
              <div>{formatPercentage(metrics.missRate)}</div>
            </div>
            <div>
              <div className="text-gray-500">Evictions</div>
              <div>{metrics.evictionCount}</div>
            </div>
          </div>
          
          <div>
            <div className="text-gray-500">Last Cleanup</div>
            <div>{new Date(metrics.lastCleanup).toLocaleTimeString()}</div>
          </div>

          {/* Memory History Chart (Simple) */}
          {history.length > 1 && (
            <div className="mt-3">
              <div className="text-gray-500 mb-1">Memory Usage History</div>
              <div className="flex items-end space-x-0.5 h-8">
                {history.slice(-20).map((metric, index) => (
                  <div
                    key={index}
                    className={`w-1 ${getMemoryPressureBackground(metric.memoryPressure)} opacity-70`}
                    style={{ height: `${Math.max(metric.memoryPressure * 100, 5)}%` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {needsCleanup && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
          <div className="flex items-center space-x-1">
            <span className="text-yellow-600">⚠️</span>
            <span className="text-yellow-800">High memory pressure detected. Consider running garbage collection.</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Minimal memory indicator for node headers
 */
export const NodeMemoryIndicator: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const { metrics, isHealthy, needsCleanup } = useMemoryAnalytics(nodeId);

  if (metrics.entryCount === 0) return null;

  return (
    <div className="flex items-center space-x-1">
      <div className={`w-1.5 h-1.5 rounded-full ${
        isHealthy ? 'bg-green-400' : needsCleanup ? 'bg-red-400' : 'bg-yellow-400'
      }`} />
      <span className="text-xs text-gray-500">
        {metrics.entryCount}
      </span>
    </div>
  );
};

/**
 * Memory usage chart component
 */
export const NodeMemoryChart: React.FC<{ nodeId: string; height?: number }> = ({ 
  nodeId, 
  height = 100 
}) => {
  const { history } = useMemoryAnalytics(nodeId);

  if (history.length < 2) {
    return (
      <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
        Collecting memory data...
      </div>
    );
  }

  const maxSize = Math.max(...history.map(h => h.totalSize));
  const maxEntries = Math.max(...history.map(h => h.entryCount));

  return (
    <div className="relative" style={{ height }}>
      <svg width="100%" height="100%" className="overflow-visible">
        {/* Memory Size Line */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={history.map((metric, index) => 
            `${(index / (history.length - 1)) * 100},${100 - (metric.totalSize / maxSize) * 80}`
          ).join(' ')}
        />
        
        {/* Entry Count Line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="3,3"
          points={history.map((metric, index) => 
            `${(index / (history.length - 1)) * 100},${100 - (metric.entryCount / maxEntries) * 80}`
          ).join(' ')}
        />
      </svg>
      
      {/* Legend */}
      <div className="absolute top-2 right-2 text-xs space-y-1">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-blue-500" />
          <span>Size</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-0.5 bg-green-500 border-dashed border-t" />
          <span>Entries</span>
        </div>
      </div>
    </div>
  );
};