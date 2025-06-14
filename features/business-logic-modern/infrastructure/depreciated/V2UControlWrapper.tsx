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

import React, { useMemo } from "react";
import { BaseControlProps } from "../node-inspector/types";
import {
  getV2UMetadata,
  isV2UNode,
  resolveV2UControl,
} from "./V2UControlRegistry";

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
  // Enhanced debug mode logic
  const finalDebugMode = useMemo(() => {
    return (
      propDebugMode || enableDebugMode || process.env.NODE_ENV === "development"
    );
  }, [propDebugMode, enableDebugMode]);

  const resolution = resolveV2UControl(node, finalDebugMode);
  const { ControlComponent, isV2UControl, controlType, metadata } = resolution;

  const nodeMetadata = getV2UMetadata(node);
  const isNodeV2U = isV2UNode(node);

  // If no control component was resolved, show a fallback
  if (!ControlComponent) {
    return (
      <div className="space-y-3">
        {showV2UInfo && (
          <div className="text-xs border rounded p-2 bg-control-error border-control-error">
            <div className="flex items-center gap-2 text-control-error">
              <span>⚠️</span>
              <span className="font-semibold">No Control Available</span>
            </div>
            <div className="mt-1 text-control-error">
              No control component found for node type: {node.type}
            </div>
          </div>
        )}

        <div className="text-xs text-control-debug p-4 text-center border rounded bg-control-debug">
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
        <div className="text-xs border rounded p-2 bg-control-debug border-control-input">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-control-debug">
              Control System
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  isV2UControl
                    ? "bg-control-success text-control-success border-control-success"
                    : "bg-control-warning text-control-warning border-control-warning"
                }`}
              >
                {isV2UControl ? "V2U Enhanced" : "Legacy"}
              </span>
              {controlType && (
                <span className="px-2 py-1 bg-node-create text-node-create-text border-node-create rounded text-xs">
                  {controlType}
                </span>
              )}
            </div>
          </div>

          {metadata && (
            <div className="grid grid-cols-2 gap-2 text-xs text-control-debug">
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
            <div className="mt-2 pt-2 border-t border-control-group">
              <div className="text-xs text-control-debug mb-1">
                Enhanced Features:
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.controlConfig.enhancedFeatures.map(
                  (feature: string, index: number) => (
                    <span
                      key={index}
                      className="px-1 py-0.5 bg-node-create text-node-create-text border-node-create rounded text-xs"
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
            <div className="mt-2 pt-2 border-t border-control-group">
              <div className="text-xs text-control-debug mb-1">
                V2U System Status:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div
                  className={`p-1 rounded ${
                    nodeMetadata.migrated
                      ? "bg-control-success text-control-success border-control-success"
                      : "bg-control-error text-control-error border-control-error"
                  }`}
                >
                  Migration: {nodeMetadata.migrated ? "Complete" : "Pending"}
                </div>
                {nodeMetadata.version && (
                  <div className="p-1 bg-node-create text-node-create-text border-node-create rounded">
                    Version: {nodeMetadata.version}
                  </div>
                )}
                {v2uState && (
                  <>
                    <div className="p-1 bg-node-trigger text-node-trigger-text border-node-trigger rounded">
                      Health: {v2uState.systemHealth}
                    </div>
                    <div className="p-1 bg-node-test text-node-test-text border-node-test rounded">
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
      <div className="border rounded p-3 bg-control-input border-control-input">
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
        <div className="text-xs border rounded p-2 bg-control-debug border-control-input">
          <div className="font-semibold text-control-debug mb-2">
            🔍 V2U Debug Information
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-control-debug">Node ID:</span>
                <span className="ml-1 font-mono">{node.id}</span>
              </div>
              <div>
                <span className="text-control-debug">Type:</span>
                <span className="ml-1 font-mono">{node.type}</span>
              </div>
              <div>
                <span className="text-control-debug">Control:</span>
                <span className="ml-1">{controlType || "None"}</span>
              </div>
              <div>
                <span className="text-control-debug">V2U:</span>
                <span
                  className={`ml-1 ${isV2UControl ? "text-control-success" : "text-control-warning"}`}
                >
                  {isV2UControl ? "Yes" : "No"}
                </span>
              </div>
            </div>

            {v2uState && (
              <div className="pt-2 border-t border-control-group">
                <div className="text-control-debug mb-1">V2U State:</div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-control-debug">Lifecycle:</span>
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
                    <span className="text-control-debug">Performance:</span>
                    <div className="font-mono">
                      {v2uState.performance.averageExecutionTime}ms avg
                    </div>
                  </div>
                  <div>
                    <span className="text-control-debug">Events:</span>
                    <div className="font-mono">
                      {v2uState.events.eventsEmitted} emitted
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {v2uState?.performance && (
              <div className="pt-2 border-t border-control-group">
                <div className="text-control-debug mb-1">
                  Performance Metrics:
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-control-debug">Avg Execution:</span>
                    <div className="font-mono text-control-success">
                      {v2uState.performance.averageExecutionTime}ms
                    </div>
                  </div>
                  <div>
                    <span className="text-control-debug">Status:</span>
                    <div className="font-mono text-control-debug">Active</div>
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
