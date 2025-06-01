/**
 * NODE HEADER COMPONENT - Node identification and action controls interface
 *
 * • Displays node type, ID, and label with inline editing capabilities
 * • Provides node action buttons (duplicate, delete, rename) with tooltips
 * • Shows node status indicators and validation states
 * • Includes inspector lock controls and keyboard shortcut support
 * • Renders node metadata and connection information
 *
 * Keywords: node-header, inline-editing, actions, status, shortcuts, metadata
 */

"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useNodeDisplay } from "../../../flow-editor/contexts/NodeDisplayContext";
import type { AgenNode } from "../../../flow-editor/types";
import { useTextInputShortcuts } from "../../../hooks/useTextInputShortcuts";
import { NODE_TYPE_CONFIG } from "../constants";

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

export const NodeHeader: React.FC<NodeHeaderProps> = ({
  node,
  onUpdateNodeId,
  onDeleteNode,
  onDuplicateNode,
  inspectorState,
}) => {
  const nodeConfig = NODE_TYPE_CONFIG[node.type];
  const [isEditingId, setIsEditingId] = useState(false);
  const [editingId, setEditingId] = useState(node.id);
  const { showNodeIds, setShowNodeIds } = useNodeDisplay();

  // ENHANCED REGISTRY INTEGRATION - Get additional metadata
  const registryMetadata = useMemo(() => {
    try {
      // Lazy import to avoid circular dependency
      const { ENHANCED_NODE_REGISTRY } = require("../../../nodes/nodeRegistry");
      return ENHANCED_NODE_REGISTRY[node.type] || null;
    } catch (error) {
      // Fallback to static config if registry unavailable
      return null;
    }
  }, [node.type]);

  // GET DISPLAY NAME WITH REGISTRY FALLBACK
  const displayName = useMemo(() => {
    // Priority 1: Enhanced registry display name
    if (registryMetadata?.ui?.label) {
      return registryMetadata.ui.label;
    }

    // Priority 2: Static config display name
    if (nodeConfig?.displayName) {
      return nodeConfig.displayName;
    }

    // Priority 3: Fallback to node type
    return node.type;
  }, [registryMetadata, nodeConfig, node.type]);

  // GET NODE DESCRIPTION FROM REGISTRY
  const nodeDescription = useMemo(() => {
    return registryMetadata?.ui?.description || null;
  }, [registryMetadata]);

  // GET NODE ICON FROM REGISTRY
  const nodeIcon = useMemo(() => {
    if (registryMetadata?.ui?.icon) {
      return registryMetadata.ui.icon;
    }

    // Fallback icons based on node type patterns
    if (node.type.includes("trigger")) return "⚡";
    if (node.type.includes("logic")) return "🧮";
    if (node.type.includes("text") || node.type.includes("Text")) return "📝";
    if (node.type.includes("view") || node.type.includes("View")) return "👁️";
    if (node.type.includes("cycle")) return "🔄";

    return null;
  }, [registryMetadata, node.type]);

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

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* ENHANCED REGISTRY ICON */}
          {nodeIcon && (
            <span className="text-lg" title="Node Type Icon">
              {nodeIcon}
            </span>
          )}

          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {displayName}
          </h3>
        </div>
      </div>

      {/* ENHANCED REGISTRY DESCRIPTION */}
      {nodeDescription && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400 italic">
          {nodeDescription}
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
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

      {/* Show Node IDs Setting */}
      <div className="mt-0">
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
    </div>
  );
};
