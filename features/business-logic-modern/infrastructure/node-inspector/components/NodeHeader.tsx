/**
 * NODE HEADER COMPONENT - Node identification and action controls interface
 *
 * • Displays node type, ID, and label with inline editing capabilities
 * • Provides node action buttons (duplicate, delete, rename) with tooltips
 * • Shows node status indicators and validation states
 * • Includes inspector lock controls and keyboard shortcut support
 * • Renders node metadata and connection information
 * • Enhanced with modern registry integration for rich metadata
 *
 * Keywords: node-header, inline-editing, actions, status, shortcuts, metadata, registry-integration
 */

"use client";

import { useNodeDisplay } from "@/features/business-logic-modern/infrastructure/flow-engine/contexts/NodeDisplayContext";
import { useTextInputShortcuts } from "@flow-engine/hooks/useTextInputShortcuts";
import React, { useCallback, useMemo, useState } from "react";

// MODERN REGISTRY INTEGRATION - Import proper types and registry
import { NODE_TYPE_CONFIG } from "../../flow-engine/constants";
import type { AgenNode, NodeType } from "../../flow-engine/types/nodeData";
import {
  getNodeMetadata,
  isValidNodeType,
  type EnhancedNodeRegistration,
} from "../../node-creation/node-registry/nodeRegistry";

// ============================================================================
// COMPONENT INTERFACE
// ============================================================================

interface NodeHeaderProps {
  node: AgenNode;
  onUpdateNodeId?: (oldId: string, newId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  inspectorState: {
    locked: boolean;
    setLocked: (locked: boolean) => void;
  };
}

// ============================================================================
// ENHANCED METADATA HELPERS
// ============================================================================

/**
 * GET ENHANCED NODE METADATA
 * Retrieves comprehensive metadata from the modern registry
 */
function getEnhancedNodeMetadata(nodeType: string): {
  displayName: string;
  description?: string;
  icon?: string;
  category?: string;
  isValid: boolean;
  metadata: EnhancedNodeRegistration | null;
} {
  // Validate node type
  if (!isValidNodeType(nodeType)) {
    return {
      displayName: nodeType,
      isValid: false,
      metadata: null,
    };
  }

  // Get metadata from registry
  const metadata = getNodeMetadata(nodeType as NodeType);
  if (!metadata) {
    return {
      displayName: nodeType,
      isValid: false,
      metadata: null,
    };
  }

  return {
    displayName: metadata.displayName,
    description: metadata.description,
    icon: metadata.icon,
    category: metadata.category,
    isValid: true,
    metadata,
  };
}

/**
 * GET SAFE NODE CONFIG
 * Gets node config with proper type safety
 */
function getSafeNodeConfig(nodeType: string) {
  if (!isValidNodeType(nodeType)) {
    return null;
  }
  return NODE_TYPE_CONFIG[nodeType as NodeType] || null;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  node,
  onUpdateNodeId,
  onDeleteNode,
  onDuplicateNode,
  inspectorState,
}) => {
  // STATE MANAGEMENT
  const [isEditingId, setIsEditingId] = useState(false);
  const [editingId, setEditingId] = useState(node.id);
  const { showNodeIds, setShowNodeIds } = useNodeDisplay();

  // ENHANCED REGISTRY METADATA - Safe access with fallbacks
  const nodeMetadata = useMemo(() => {
    return getEnhancedNodeMetadata(node.type);
  }, [node.type]);

  // LEGACY CONFIG - For backwards compatibility
  const nodeConfig = useMemo(() => {
    return getSafeNodeConfig(node.type);
  }, [node.type]);

  // COMPUTED DISPLAY VALUES - Registry-first with fallbacks
  const displayValues = useMemo(() => {
    return {
      displayName:
        nodeMetadata.displayName || nodeConfig?.displayName || node.type,
      description: nodeMetadata.description,
      icon: nodeMetadata.icon,
      category: nodeMetadata.category,
    };
  }, [nodeMetadata, nodeConfig, node.type]);

  // NODE STATUS INDICATORS
  const statusInfo = useMemo(() => {
    const isRegistryValid = nodeMetadata.isValid;
    const hasConfig = !!nodeConfig;
    const hasEnhancedMetadata = !!nodeMetadata.metadata;

    return {
      isRegistryValid,
      hasConfig,
      hasEnhancedMetadata,
      statusIcon:
        isRegistryValid && hasEnhancedMetadata ? "✅" : hasConfig ? "⚠️" : "❌",
      statusTooltip:
        isRegistryValid && hasEnhancedMetadata
          ? "Registry-enhanced node"
          : hasConfig
            ? "Legacy configuration only"
            : "Missing configuration",
    };
  }, [nodeMetadata, nodeConfig]);

  // EVENT HANDLERS
  const handleIdEdit = useCallback(() => {
    setIsEditingId(true);
    setEditingId(node.id);
  }, [node.id]);

  const handleIdSave = useCallback(() => {
    const trimmedId = editingId.trim();

    // Validate the new ID
    if (!trimmedId) {
      setEditingId(node.id);
      setIsEditingId(false);
      return;
    }

    // If ID changed and we have an update handler, call it
    if (trimmedId !== node.id && onUpdateNodeId) {
      onUpdateNodeId(node.id, trimmedId);
    }

    setIsEditingId(false);
  }, [editingId, node.id, onUpdateNodeId]);

  const handleIdCancel = useCallback(() => {
    setEditingId(node.id);
    setIsEditingId(false);
  }, [node.id]);

  // ERGONOMIC TEXT INPUT SHORTCUTS - Alt+Q (backspace) and Alt+W (enter)
  const textInputShortcuts = useTextInputShortcuts({
    value: editingId,
    setValue: setEditingId,
    onEnter: handleIdSave,
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // First, let the text input shortcuts handle Alt+Q and Alt+W
      textInputShortcuts.handleKeyDown(e);

      // Then handle existing shortcuts (Enter/Escape) if not already handled
      if (!e.defaultPrevented) {
        if (e.key === "Enter") {
          handleIdSave();
        } else if (e.key === "Escape") {
          handleIdCancel();
        }
      }
    },
    [handleIdSave, handleIdCancel, textInputShortcuts]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
      {/* HEADER ROW - Icon, Name, Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* REGISTRY-ENHANCED ICON */}
          {displayValues.icon && (
            <span
              className="text-lg"
              title={`${displayValues.displayName} • Category: ${displayValues.category}`}
            >
              {displayValues.icon}
            </span>
          )}

          {/* DISPLAY NAME - Registry-enhanced */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {displayValues.displayName}
          </h3>

          {/* STATUS INDICATOR - Shows registry integration status */}
          <span
            className="text-xs cursor-help"
            title={statusInfo.statusTooltip}
          >
            {statusInfo.statusIcon}
          </span>
        </div>
      </div>

      {/* ENHANCED DESCRIPTION - From registry metadata */}
      {displayValues.description && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">
          {displayValues.description}
        </div>
      )}

      {/* NODE CATEGORY BADGE - From registry */}
      {displayValues.category && (
        <div className="mt-1">
          <span
            className="inline-block px-2 py-0.5 text-[10px] bg-blue-100 dark:bg-blue-900
                          text-blue-800 dark:text-blue-200 rounded-full capitalize"
          >
            {displayValues.category}
          </span>
        </div>
      )}

      {/* NODE ID EDITING INTERFACE */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-gray-500 dark:text-gray-400">
          Node ID:
        </span>

        {isEditingId ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editingId}
              onChange={(e) => setEditingId(e.target.value)}
              onBlur={handleIdSave}
              onKeyDown={handleKeyDown}
              title="Edit node ID • Alt+Q = backspace • Alt+W = enter"
              className="text-[10px] px-1 py-0.5 border border-blue-300 dark:border-blue-600 rounded
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
              autoFocus
              style={{
                fontSize: "10px",
                minWidth: "60px",
                width: `${Math.max(60, editingId.length * 6)}px`,
              }}
            />
            <button
              onClick={handleIdSave}
              className="text-[8px] px-1 py-0.5 bg-green-500 text-white rounded hover:bg-green-600
                         transition-colors"
              title="Save ID"
            >
              ✓
            </button>
            <button
              onClick={handleIdCancel}
              className="text-[8px] px-1 py-0.5 bg-red-500 text-white rounded hover:bg-red-600
                         transition-colors"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={handleIdEdit}
            className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300
                       hover:underline cursor-pointer transition-colors"
            title="Click to edit ID"
          >
            {node.id}
          </button>
        )}
      </div>

      {/* GLOBAL SETTINGS */}
      <div className="mt-2">
        <label className="flex items-center gap-2 text-[10px]">
          <span className="text-gray-500 dark:text-gray-400">
            Show Node IDs
          </span>
          <input
            type="checkbox"
            checked={showNodeIds}
            onChange={(e) => setShowNodeIds(e.target.checked)}
            className="w-3 h-3"
          />
        </label>
      </div>

      {/* DEBUG INFO - Show registry integration status in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-[10px]">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
            🔧 Registry Debug Info:
          </div>
          <div className="space-y-0.5 text-gray-600 dark:text-gray-400">
            <div>
              Node Type: <code>{node.type}</code>
            </div>
            <div>Valid: {statusInfo.isRegistryValid ? "✅" : "❌"}</div>
            <div>Enhanced: {statusInfo.hasEnhancedMetadata ? "✅" : "❌"}</div>
            <div>Legacy Config: {statusInfo.hasConfig ? "✅" : "❌"}</div>
            {nodeMetadata.metadata && (
              <div>Handles: {nodeMetadata.metadata.handles.length}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
