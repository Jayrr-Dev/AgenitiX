/**
 * V2U CONTROL WRAPPER COMPONENT - Automatic V2U control resolution and rendering
 *
 * 🎯 V2U CONTROL WRAPPER: Smart wrapper that automatically detects and renders appropriate controls
 * • Automatic V2U node detection and control resolution
 * • Seamless fallback to legacy controls for non-V2U nodes
 * • Enhanced V2U status information and debugging
 * • Integration with V2U metadata and analytics
 * • Consistent styling and interaction patterns
 * • Extensible architecture for new control types
 *
 * Keywords: v2u-wrapper, automatic-resolution, smart-controls, fallback, metadata, debugging
 */

import React from "react";
import { BaseControlProps } from "../types";
import {
  getV2UMetadata,
  isV2UNode,
  resolveV2UControl,
} from "../V2UControlRegistry";

// ============================================================================
// V2U CONTROL WRAPPER INTERFACES
// ============================================================================

interface V2UControlWrapperProps extends BaseControlProps {
  showV2UInfo?: boolean;
  enableDebugMode?: boolean;
  forceV2UMode?: boolean;
  customControlType?: string;
}

// ============================================================================
// V2U CONTROL WRAPPER COMPONENT
// ============================================================================

/**
 * Wrapper component that automatically resolves and renders the appropriate V2U control
 */
export const V2UControlWrapper: React.FC<V2UControlWrapperProps> = ({
  node,
  updateNodeData,
  v2uState,
  debugMode: propDebugMode = false,
  showV2UInfo = true,
  enableDebugMode = false,
  forceV2UMode = false,
  customControlType,
  ...otherProps
}) => {
  const resolution = resolveV2UControl(node, propDebugMode || enableDebugMode);
  const { ControlComponent, isV2UControl, controlType, metadata } = resolution;

  const finalDebugMode = propDebugMode || enableDebugMode;
  const nodeMetadata = getV2UMetadata(node);
  const isNodeV2U = isV2UNode(node);

  // If no control component was resolved, show a fallback
  if (!ControlComponent) {
    return (
      <div className="space-y-3">
        {showV2UInfo && (
          <div className="text-xs border rounded p-2 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <span>⚠️</span>
              <span className="font-semibold">No Control Available</span>
            </div>
            <div className="mt-1 text-red-600 dark:text-red-400">
              No control component found for node type: {node.type}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 dark:text-gray-400 p-4 text-center border rounded bg-gray-50 dark:bg-gray-900">
          <div className="text-lg mb-2">🚫</div>
          <div>No controls available for this node type</div>
          <div className="mt-1 text-xs">
            Node type "{node.type}" is not supported by the V2U control system
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* V2U Status Info */}
      {showV2UInfo && (
        <div className="text-xs border rounded p-2 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Control System
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isV2UControl
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                }`}
              >
                {isV2UControl ? "V2U Enhanced" : "Legacy"}
              </span>
              {controlType && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded text-xs">
                  {controlType}
                </span>
              )}
            </div>
          </div>

          {metadata && (
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div>Node Type: {metadata.nodeType}</div>
              <div>Category: {metadata.controlConfig.category}</div>
              {metadata.isV2UNode && metadata.metadata?.version && (
                <div>V2U Version: {metadata.metadata.version}</div>
              )}
              {metadata.isV2UNode && metadata.metadata?.migrationDate && (
                <div>
                  Migrated:{" "}
                  {new Date(
                    metadata.metadata.migrationDate
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {/* Enhanced Features List */}
          {isV2UControl && metadata && finalDebugMode && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Enhanced Features:
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.controlConfig.enhancedFeatures.map(
                  (feature: string, index: number) => (
                    <span
                      key={index}
                      className="px-1 py-0.5 bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300 rounded text-xs"
                    >
                      {feature}
                    </span>
                  )
                )}
              </div>
            </div>
          )}

          {/* V2U System Status */}
          {isNodeV2U && finalDebugMode && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                V2U System Status:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-1 rounded ${
                    nodeMetadata.migrated
                      ? "bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}
                >
                  Migration: {nodeMetadata.migrated ? "Complete" : "Pending"}
                </div>
                {nodeMetadata.version && (
                  <div className="p-1 bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded">
                    Version: {nodeMetadata.version}
                  </div>
                )}
                {v2uState && (
                  <>
                    <div className="p-1 bg-purple-50 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded">
                      Health: {v2uState.systemHealth}
                    </div>
                    <div className="p-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 rounded">
                      Registry: {v2uState.registryStatus}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actual Control Component */}
      <div className="border rounded p-3 bg-white dark:bg-gray-800">
        <ControlComponent
          node={node}
          updateNodeData={updateNodeData}
          v2uState={v2uState}
          debugMode={finalDebugMode}
          {...otherProps}
        />
      </div>

      {/* V2U Debug Panel */}
      {finalDebugMode && v2uState && (
        <div className="text-xs border rounded p-2 bg-gray-100 dark:bg-gray-800">
          <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
            🔍 V2U Debug Information
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Node ID:
                </span>
                <span className="ml-1 font-mono">{node.id}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="ml-1 font-mono">{node.type}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Control:
                </span>
                <span className="ml-1">{controlType || "None"}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">V2U:</span>
                <span
                  className={`ml-1 ${isV2UControl ? "text-green-600" : "text-orange-600"}`}
                >
                  {isV2UControl ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {v2uState && (
              <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
                <div className="text-gray-600 dark:text-gray-400 mb-1">
                  V2U State:
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Lifecycle:</span>
                    <div className="font-mono">
                      {
                        Object.values(v2uState.lifecycle).filter(
                          (h) => h?.executed
                        ).length
                      }{" "}
                      hooks
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Performance:</span>
                    <div className="font-mono">
                      {v2uState.performance.averageExecutionTime}ms avg
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Events:</span>
                    <div className="font-mono">
                      {v2uState.events.eventsEmitted} emitted
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default V2UControlWrapper;
