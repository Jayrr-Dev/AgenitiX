'use client';

import React from 'react';
import { FaSearch, FaLock } from 'react-icons/fa';
import { NodeInspectorProps } from './types';
import { NODE_TYPE_CONFIG } from './constants';
import { useInspectorState } from './hooks/useInspectorState';
import { JsonHighlighter } from './utils/JsonHighlighter';
import { NodeHeader } from './components/NodeHeader';
import { NodeOutput } from './components/NodeOutput';
import { NodeControls } from './components/NodeControls';
import { ErrorLog } from './components/ErrorLog';

const NodeInspector = React.memo<NodeInspectorProps>(function NodeInspector({
  node,
  updateNodeData,
  output,
  errors,
  onClearErrors,
  onLogError,
  onUpdateNodeId,
}) {
  const inspectorState = useInspectorState(node);

  // Early return for locked or no node state
  if (!node || inspectorState.locked) {
    return (
      <div className="flex items-center justify-center h-5 w-4">
        <button
          aria-label={inspectorState.locked ? "Unlock Inspector" : "Lock Inspector"}
          title={inspectorState.locked ? "Unlock Inspector" : "Lock Inspector"}
          onClick={() => inspectorState.setLocked(!inspectorState.locked)}
          className={`
            text-gray-400 
            ${inspectorState.locked 
              ? 'hover:text-orange-500 hover:border-orange-300 dark:hover:border-orange-700 dark:hover:text-orange-400'
              : 'hover:text-blue-500 hover:border-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-400'
            }
            dark:text-gray-600
            text-3xl
            p-2
            rounded-full
            border
            border-transparent
            transition-colors
          `}
        >
          {inspectorState.locked ? <FaLock className="w-5 h-5" /> : <FaSearch className="w-5 h-5" />}
        </button>
      </div>
    );
  }

  const nodeConfig = NODE_TYPE_CONFIG[node.type];
  const hasRightColumn = nodeConfig.hasOutput || nodeConfig.hasControls;

  return (
    <div id="node-info-container" className="flex gap-3">
      {/* COLUMN 1: NODE LABEL + NODE DATA */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
        <NodeHeader node={node} onUpdateNodeId={onUpdateNodeId} />
        
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

      {/* COLUMN 2: OUTPUT + CONTROLS */}
      {hasRightColumn && (
        <div className="flex-1 flex flex-col gap-3 min-w-[100px]">
          {nodeConfig.hasOutput && (
            <NodeOutput output={output} nodeType={node.type} />
          )}

          {nodeConfig.hasControls && (
            <NodeControls
              node={node}
              updateNodeData={updateNodeData}
              onLogError={onLogError}
              inspectorState={inspectorState}
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
});

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector; 