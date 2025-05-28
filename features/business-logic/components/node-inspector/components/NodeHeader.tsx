import React, { useState, useCallback } from 'react';
import type { AgenNode } from '../../../FlowEditor';
import { NODE_TYPE_CONFIG } from '../constants';
import { useNodeDisplay } from '../../../flow-editor/contexts/NodeDisplayContext';

interface NodeHeaderProps {
  node: AgenNode;
  onUpdateNodeId?: (oldId: string, newId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
}

export const NodeHeader: React.FC<NodeHeaderProps> = ({ node, onUpdateNodeId, onDeleteNode, onDuplicateNode }) => {
  const nodeConfig = NODE_TYPE_CONFIG[node.type];
  const [isEditingId, setIsEditingId] = useState(false);
  const [editingId, setEditingId] = useState(node.id);
  const { showNodeIds, setShowNodeIds } = useNodeDisplay();

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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleIdSave();
    } else if (e.key === 'Escape') {
      handleIdCancel();
    }
  }, [handleIdSave, handleIdCancel]);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {nodeConfig.displayName}
      </h3>
      
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
              className="text-[10px] px-1 py-0.5 border border-blue-300 dark:border-blue-600 rounded
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0 flex-1"
              autoFocus
              style={{ fontSize: '10px', minWidth: '60px', width: `${Math.max(60, editingId.length * 6)}px` }}
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
          <span className="text-gray-500 dark:text-gray-400">Show Node IDs</span>
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