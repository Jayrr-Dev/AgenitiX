// nodes/ResultNode.tsx
'use client'
import { memo } from 'react'
import {
  Handle,
  Position,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type NodeConnection,
  NodeToolbar
} from '@xyflow/react'
import {
  MyNode,
  isTextNode,
  TextNodeData,
  TextUppercaseNodeData,
} from '../initialElements'
import CustomHandle from '../../handles/CustomHandle'
import { extractNodeValue, safeStringify } from '../utils/nodeUtils'

/* -------------------------------------------------------------------------- */
/*  OUTPUT NODE                                                               */
/*  – Displays text from both TextNodes and TextUppercaseNodes                    */
/* -------------------------------------------------------------------------- */

function OutputNode() {
  /* -------------------------------------------------------------- */
  /*  1. Which edges arrive at *this* node?                         */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  const sourceIds = connections.map((c: NodeConnection) => c.source)

  /* -------------------------------------------------------------- */
  /*  2. Fetch the *source* nodes' live data                        */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<MyNode>(sourceIds)

  /* -------------------------------------------------------------- */
  /*  3. Extract values from connected nodes using safe extraction   */
  /* -------------------------------------------------------------- */
  const values = nodesData
    .map((node) => {
      const extractedValue = extractNodeValue(node.data)
      return {
        type: node.type,
        content: extractedValue,
        id: node.id
      }
    })
    .filter(item => item.content !== undefined && item.content !== null);

  /* -------------------------------------------------------------- */
  /*  4. Render                                                     */
  /* -------------------------------------------------------------- */
  return (
    <div className="px-4 py-3 rounded-lg bg-amber-100 dark:bg-amber-900 shadow-sm border border-amber-200 dark:border-amber-800">
      {/* INPUT HANDLE (left, any type, id and dataType = 'x') */}
      <CustomHandle 
        type="target" 
        position={Position.Left}
        id="x"
        dataType="x"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Output</div>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {values.length} input{values.length !== 1 ? 's' : ''}
          </div>
        </div>

        {values.length ? (
          <div className="space-y-2">
            {values.map((item) => (
              <div 
                key={item.id}
                className={`text-sm font-mono break-all bg-white/50 dark:bg-black/20 rounded px-2 py-1`}
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
          <div className="text-xs italic text-neutral-500">
            Connect any node with output
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(OutputNode)
