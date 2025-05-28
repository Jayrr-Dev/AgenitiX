'use client';

import React from 'react';
import { FaSearch, FaLock, FaLockOpen } from 'react-icons/fa';
import { NodeInspectorProps } from './types';
import { NODE_TYPE_CONFIG } from './constants';
import { useInspectorState } from './hooks/useInspectorState';
import { JsonHighlighter } from './utils/JsonHighlighter';
import { NodeHeader } from './components/NodeHeader';
import { NodeOutput } from './components/NodeOutput';
import { NodeControls } from './components/NodeControls';
import { ErrorLog } from './components/ErrorLog';
import { EdgeInspector } from './components/EdgeInspector';

const NodeInspector = React.memo<NodeInspectorProps>(function NodeInspector({
  node,
  selectedEdge,
  allNodes,
  updateNodeData,
  output,
  errors,
  onClearErrors,
  onLogError,
  onUpdateNodeId,
  onDeleteNode,
  onDuplicateNode,
  onDeleteEdge,
  inspectorLocked,
  setInspectorLocked,
}) {
  const inspectorState = useInspectorState(node);

  // Create combined inspector state with lock from props
  const combinedInspectorState = {
    ...inspectorState,
    locked: inspectorLocked,
    setLocked: setInspectorLocked,
  };

  // Early return for locked state
  if (inspectorLocked) {
    return (
      <div className="flex items-center justify-center h-5 w-4">
        <button
          aria-label="Unlock Inspector"
          title="Unlock Inspector"
          onClick={() => setInspectorLocked(false)}
          className="text-gray-400 hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 dark:hover:text-orange-400 dark:text-gray-600 text-3xl p-2 rounded-full border border-transparent transition-colors"
        >
          <FaLock className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Show node inspector if node is selected (prioritize nodes over edges)
  if (node) {
    const nodeConfig = NODE_TYPE_CONFIG[node.type];
    const hasRightColumn = nodeConfig.hasOutput || nodeConfig.hasControls;

    return (
      <div id="node-info-container" className="flex gap-3">
        {/* COLUMN 1: NODE LABEL + NODE DATA */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          <NodeHeader 
            node={node} 
            onUpdateNodeId={onUpdateNodeId} 
            onDeleteNode={onDeleteNode} 
            onDuplicateNode={onDuplicateNode}
            inspectorState={combinedInspectorState}
          />
          
          {/* Node Data */}
          <div className="flex-1 flex flex-col min-w-0 w-full">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Node Data:
            </h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border p-3 overflow-y-auto overflow-x-auto flex-1 min-w-0 w-full">
              <JsonHighlighter data={node.data} className="w-full min-w-0 flex-1" />
            </div>
          </div>
        </div>

        {/* COLUMN 2: ACTION BUTTONS + OUTPUT + CONTROLS */}
        {hasRightColumn && (
          <div className="flex-1 flex flex-col gap-3 min-w-[100px]">
            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2">
              {/* Lock Button */}
              <button
                onClick={() => setInspectorLocked(!inspectorLocked)}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={inspectorLocked ? "Unlock Inspector" : "Lock Inspector"}
              >
                {inspectorLocked ? (
                  <FaLock className="w-3 h-3" />
                ) : (
                  <FaLockOpen className="w-3 h-3" />
                )}
              </button>
              
              {onDuplicateNode && (
                <button
                  onClick={() => onDuplicateNode(node.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  title="Duplicate Node"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
              
              {onDeleteNode && (
                <button
                  onClick={() => onDeleteNode(node.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                  title="Delete Node"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {nodeConfig.hasOutput && (
              <NodeOutput output={output} nodeType={node.type} />
            )}

            {nodeConfig.hasControls && (
              <NodeControls
                node={node}
                updateNodeData={updateNodeData}
                onLogError={onLogError}
                inspectorState={combinedInspectorState}
              />
            )}
          </div>
        )}

        {/* COLUMN 3: ERROR LOG (only show when there are errors) */}
        {errors.length > 0 && (
          <div className="flex-1 flex flex-col gap-3">
            <ErrorLog 
              errors={errors} 
              onClearErrors={onClearErrors} 
            />
          </div>
        )}
      </div>
    );
  }

  // Show edge inspector if edge is selected (only when no node is selected)
  if (selectedEdge && allNodes) {
    return (
      <div id="edge-info-container" className="flex gap-3">
        <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
          <EdgeInspector 
            edge={selectedEdge} 
            allNodes={allNodes} 
            onDeleteEdge={onDeleteEdge} 
          />
        </div>
      </div>
    );
  }

  // Show empty state if no node or edge selected
  return (
    <div className="flex items-center justify-center h-5 w-4">
      <button
        aria-label="Lock Inspector"
        title="Lock Inspector - Keep current view when selecting nodes"
        onClick={() => setInspectorLocked(true)}
        className="text-gray-400 hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-400 dark:text-gray-600 text-3xl p-2 rounded-full border border-transparent transition-colors"
      >
        <FaSearch className="w-5 h-5" />
      </button>
    </div>
  );
});

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector; 