/**
 * ENHANCED NODE CONTROLS - Advanced control generation with Plop integration
 *
 * • Provides enhanced control interfaces for nodes with custom controls
 * • Integrates with NodeInspectorAdapter for clean architecture
 * • Supports common control patterns with extensible design
 * • Handles validation and error states gracefully
 * • Reduces maintenance overhead through systematic approach
 *
 * Keywords: enhanced-controls, adapter-integration, validation, extensible, systematic
 */

"use client";

import React, { useCallback, useState } from "react";
import type { AgenNode } from "../../flow-engine/types/nodeData";
import type { InspectorNodeInfo } from "../adapters/NodeInspectorAdapter";
import { NodeInspectorAdapter } from "../adapters/NodeInspectorAdapter";
import {
  BaseControl,
  EnhancedInput,
  EnhancedTextarea,
  StatusBadge,
} from "../controls/BaseControl";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface EnhancedNodeControlsProps {
  node: AgenNode;
  nodeInfo: InspectorNodeInfo;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  onLogError: (nodeId: string, message: string) => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EnhancedNodeControls: React.FC<EnhancedNodeControlsProps> = ({
  node,
  nodeInfo,
  updateNodeData,
  onLogError,
}) => {
  // State for tracking pending updates and validation
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, unknown>>(
    {}
  );
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Get current node data with defaults
  const nodeData = NodeInspectorAdapter.getNodeDataWithDefaults(node);

  /**
   * Handle field updates with validation
   */
  const handleFieldUpdate = useCallback(
    (fieldKey: string, value: unknown) => {
      const updates = { ...pendingUpdates, [fieldKey]: value };
      setPendingUpdates(updates);

      // Validate the update through the adapter
      const result = NodeInspectorAdapter.updateNodeData(node, updates);

      if (result.success) {
        // Apply the update immediately
        updateNodeData(node.id, { [fieldKey]: value });

        // Clear pending updates and errors
        setPendingUpdates((prev) => {
          const newPending = { ...prev };
          delete newPending[fieldKey];
          return newPending;
        });
        setValidationErrors([]);
      } else {
        // Set validation errors
        setValidationErrors(result.errors);

        // Log error
        onLogError(node.id, `Validation failed: ${result.errors.join(", ")}`);
      }
    },
    [node, pendingUpdates, updateNodeData, onLogError]
  );

  // ============================================================================
  // RENDER BASIC CONTROLS
  // ============================================================================

  const renderBasicControls = () => {
    const hasTextFields =
      nodeData.text !== undefined || nodeData.label !== undefined;
    const hasNumberFields =
      nodeData.duration !== undefined || nodeData.count !== undefined;

    if (!hasTextFields && !hasNumberFields) {
      return (
        <div className="text-xs text-control-placeholder p-3 text-center italic">
          This node type does not have configurable properties.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Text field */}
        {nodeData.text !== undefined && (
          <div>
            <label className="text-xs font-medium text-control-input block mb-1">
              Text Content
            </label>
            <EnhancedTextarea
              value={String(pendingUpdates.text ?? nodeData.text ?? "")}
              onChange={(value) => handleFieldUpdate("text", value)}
              placeholder="Enter text content..."
              nodeType={node.type}
              rows={3}
            />
          </div>
        )}

        {/* Label field */}
        {nodeData.label !== undefined && (
          <div>
            <label className="text-xs font-medium text-control-input block mb-1">
              Label
            </label>
            <EnhancedInput
              value={String(pendingUpdates.label ?? nodeData.label ?? "")}
              onChange={(value) => handleFieldUpdate("label", value)}
              placeholder="Enter label..."
              nodeType={node.type}
            />
          </div>
        )}

        {/* Duration field */}
        {nodeData.duration !== undefined && (
          <div>
            <label className="text-xs font-medium text-control-input block mb-1">
              Duration (ms)
            </label>
            <EnhancedInput
              value={String(pendingUpdates.duration ?? nodeData.duration ?? 0)}
              onChange={(value) =>
                handleFieldUpdate("duration", parseFloat(value) || 0)
              }
              placeholder="Enter duration in milliseconds..."
              nodeType={node.type}
              type="number"
            />
          </div>
        )}

        {/* Count field */}
        {nodeData.count !== undefined && (
          <div>
            <label className="text-xs font-medium text-control-input block mb-1">
              Count
            </label>
            <EnhancedInput
              value={String(pendingUpdates.count ?? nodeData.count ?? 0)}
              onChange={(value) =>
                handleFieldUpdate("count", parseInt(value) || 0)
              }
              placeholder="Enter count..."
              nodeType={node.type}
              type="number"
            />
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const hasPendingUpdates = Object.keys(pendingUpdates).length > 0;
  const hasValidationErrors = validationErrors.length > 0;

  return (
    <BaseControl
      title={`${nodeInfo.displayName} Configuration`}
      nodeType={node.type}
    >
      <div className="space-y-4">
        {/* Basic Controls */}
        {renderBasicControls()}

        {/* Status and Actions */}
        {(hasPendingUpdates || hasValidationErrors) && (
          <div className="mt-4 p-3 bg-control-debug rounded border-control-input">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-control-input">
                Update Status
              </div>
              <StatusBadge
                status={!hasValidationErrors}
                trueLabel="VALID"
                falseLabel="ERRORS"
                nodeType={node.type}
              />
            </div>

            {hasValidationErrors && (
              <div className="mb-3 space-y-1">
                {validationErrors.map((error, index) => (
                  <div key={index} className="text-xs text-control-error">
                    • {error}
                  </div>
                ))}
              </div>
            )}

            {hasPendingUpdates && (
              <div className="text-xs text-control-placeholder mb-2">
                {Object.keys(pendingUpdates).length} pending changes
              </div>
            )}
          </div>
        )}

        {/* Debug Information (Development Only) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-2 bg-control-warning rounded text-xs border-control-input">
            <div className="font-medium text-control-input mb-1">
              🔧 Enhanced Controls Debug:
            </div>
            <div className="space-y-0.5 text-control-placeholder">
              <div>Node Type: {node.type}</div>
              <div>Category: {nodeInfo.category}</div>
              <div>Has Controls: {nodeInfo.hasControls ? "✅" : "❌"}</div>
              <div>Pending Updates: {Object.keys(pendingUpdates).length}</div>
            </div>
          </div>
        )}
      </div>
    </BaseControl>
  );
};
