// nodes/ResultNode.tsx
'use client'
import { memo, useState, useMemo } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type NodeConnection,
  NodeToolbar
} from '@xyflow/react'
import type { AgenNode } from '../../flow-editor/types'
import CustomHandle from '../../handles/CustomHandle'
import { extractNodeValue, safeStringify } from '../utils/nodeUtils'
import { FloatingNodeId } from '../components/FloatingNodeId'

/* -------------------------------------------------------------------------- */
/*  OUTPUT NODE                                                               */
/*  – Displays text from both TextNodes and TextUppercaseNodes                    */
/* -------------------------------------------------------------------------- */

function OutputNode({ id }: { id: string }) {
  const [showUI, setShowUI] = useState(false)

  /* -------------------------------------------------------------- */
  /*  1. Which edges arrive at *this* node?                         */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  const sourceIds = connections.map((c: NodeConnection) => c.source)

  /* -------------------------------------------------------------- */
  /*  2. Fetch the *source* nodes' live data                        */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<AgenNode>(sourceIds)

  /* -------------------------------------------------------------- */
  /*  3. Extract values from connected nodes using safe extraction   */
  /* -------------------------------------------------------------- */
  const values = nodesData
    .map((node) => {
      // Special handling for TestInput nodes - use 'value' property directly
      let extractedValue;
      if (node.type === 'testInput') {
        extractedValue = node.data?.value;
      } else {
        extractedValue = extractNodeValue(node.data);
      }
      
      return {
        type: node.type,
        content: extractedValue,
        id: node.id
      }
    })
    .filter(item => {
      // Allow all values except undefined and null
      // This ensures false, 0, empty string, etc. are all displayed
      return item.content !== undefined && item.content !== null;
    });

  // Create preview text for collapsed state
  const previewText = values.length > 0 
    ? (() => {
        const firstValue = values[0].content;
        let text = '';
        if (typeof firstValue === 'string') text = firstValue;
        else if (typeof firstValue === 'number') text = firstValue.toString();
        else if (typeof firstValue === 'boolean') text = firstValue ? 'true' : 'false';
        else text = safeStringify(firstValue);
        return text.length > 15 ? text.substring(0, 15) + '...' : text;
      })()
    : '';

  /* -------------------------------------------------------------- */
  /*  4. Render                                                     */
  /* -------------------------------------------------------------- */
  // Helper function to get data type and color
  const getDataTypeInfo = (content: any) => {
    if (typeof content === 'string') return { type: 's', color: '#3b82f6', label: 'string' };
    if (typeof content === 'number') return { type: 'n', color: '#f59e42', label: 'number' };
    if (typeof content === 'boolean') return { type: 'b', color: '#10b981', label: 'boolean' };
    if (typeof content === 'bigint') return { type: 'N', color: '#a21caf', label: 'bigint' };
    if (Array.isArray(content)) return { type: 'a', color: '#f472b6', label: 'array' };
    if (content === null) return { type: '∅', color: '#ef4444', label: 'null' };
    if (content === undefined) return { type: 'u', color: '#d1d5db', label: 'undefined' };
    if (typeof content === 'symbol') return { type: 'S', color: '#eab308', label: 'symbol' };
    if (typeof content === 'object') return { type: 'j', color: '#6366f1', label: 'object' };
    return { type: 'x', color: '#6b7280', label: 'any' };
  };

  return (
    <div className={`relative ${showUI ? 'w-[180px] max-h-[360px] px-3 py-3' : 'w-[120px] h-[120px] flex items-center justify-center'} rounded-lg bg-amber-100 dark:bg-amber-900 shadow-sm border border-amber-200 dark:border-amber-800`}>
      {/* Floating Node ID */}
      <FloatingNodeId nodeId={id} />
      
      {/* TOGGLE BUTTON (top-left) */}
      <button
        aria-label={showUI ? 'Collapse node' : 'Expand node'}
        title={showUI ? 'Collapse' : 'Expand'}
        onClick={() => setShowUI((v) => !v)}
        className="absolute top-1 left-1 cursor-pointer z-10 w-2 h-2 flex items-center justify-center rounded-full bg-white/80 dark:bg-black/40 border border-amber-300 dark:border-amber-800 text-xs hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors shadow"
        type="button"
      >
        {showUI ? '⦿' : '⦾'}
      </button>

      {/* INPUT HANDLE (left, any type, id and dataType = 'x') */}
      <CustomHandle 
        type="target" 
        position={Position.Left}
        id="x"
        dataType="x"
      />

      {/* COLLAPSED: Show as many outputs as possible */}
      {!showUI && (
        <div className="absolute inset-0 flex flex-col px-2 py-2 overflow-hidden">
          <div className="flex items-center justify-center mb-1">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-100">📤 React Node</div>
          </div>
          
          {values.length ? (
            <div className="space-y-1 flex-1 overflow-hidden">
              {values.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white/50 dark:bg-black/20 rounded px-1 py-0.5 overflow-hidden"
                  style={{ 
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {(() => {
                    const content = item.content;
                    if (typeof content === 'string') return content;
                    if (typeof content === 'number') {
                      if (Number.isNaN(content)) return 'NaN';
                      if (!Number.isFinite(content)) return content > 0 ? 'Infinity' : '-Infinity';
                      return content.toString();
                    }
                    if (typeof content === 'boolean') return content ? 'true' : 'false';
                    if (typeof content === 'bigint') return content.toString() + 'n';
                    try {
                      return safeStringify(content);
                    } catch {
                      return String(content);
                    }
                  })()}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs italic text-amber-600 dark:text-amber-400 flex-1 flex items-center justify-center text-center">
              Connect nodes
            </div>
          )}
        </div>
      )}

      {/* EXPANDED: Full UI */}
      {showUI && (
        <div className="flex text-xs flex-col w-full h-full overflow-hidden">
          <div className="font-semibold text-amber-900 dark:text-amber-100 mb-2 flex items-center justify-between">
            <span>React Node</span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {values.length} input{values.length !== 1 ? 's' : ''}
            </span>
          </div>

          {values.length ? (
            <div 
              className="nodrag space-y-2 flex-1 overflow-y-auto max-h-[280px] pr-1"
              onWheel={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              style={{ touchAction: 'pan-y' }}
            >
              {values.map((item) => {
                const typeInfo = getDataTypeInfo(item.content);
                return (
                  <div 
                    key={item.id}
                    className="bg-white/50 dark:bg-black/20 rounded px-2 py-2"
                  >
                    {/* Type indicator with colored icon */}
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: typeInfo.color }}
                        title={typeInfo.label}
                      >
                        {typeInfo.type}
                      </div>
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                        {typeInfo.label}
                      </span>
                    </div>
                    
                    {/* Content */}
                    <div className="text-xs font-mono break-all text-amber-900 dark:text-amber-100">
                      {(() => {
                        const content = item.content;
                        if (typeof content === 'string') return content;
                        if (typeof content === 'number') {
                          if (Number.isNaN(content)) return 'NaN';
                          if (!Number.isFinite(content)) return content > 0 ? 'Infinity' : '-Infinity';
                          return content.toString();
                        }
                        if (typeof content === 'boolean') return content ? 'true' : 'false';
                        if (typeof content === 'bigint') return content.toString() + 'n';
                        try {
                          return safeStringify(content);
                        } catch {
                          return String(content);
                        }
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs italic text-amber-600 dark:text-amber-400 flex-1 flex items-center justify-center">
              Connect any node with output
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(OutputNode)
