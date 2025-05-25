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
  UppercaseNodeData,
} from '../initialElements'
import CustomHandle from '../../handles/CustomHandle'

/* -------------------------------------------------------------------------- */
/*  OUTPUT NODE                                                               */
/*  – Displays text from both TextNodes and UppercaseNodes                    */
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
  /*  3. Extract text content from connected nodes                   */
  /* -------------------------------------------------------------- */
  const texts = nodesData.map((node) => {
    if (node.type === 'textNode') {
      return {
        type: 'text',
        content: (node.data as TextNodeData).text,
        id: node.id
      }
    } else if (node.type === 'uppercaseNode') {
      return {
        type: 'uppercase',
        content: (node.data as UppercaseNodeData).text,
        id: node.id
      }
    }
    return null
  }).filter((item): item is { type: 'text' | 'uppercase', content: string, id: string } => 
    item !== null && Boolean(item.content)
  )

  /* -------------------------------------------------------------- */
  /*  4. Render                                                     */
  /* -------------------------------------------------------------- */
  return (
    <div className="px-4 py-3 rounded-lg bg-amber-100 dark:bg-amber-900 shadow-sm border border-amber-200 dark:border-amber-800">
      {/* INPUT HANDLE (left, string, id and dataType = 's') */}
      <CustomHandle 
        type="target" 
        position={Position.Left}
        id="s"
        dataType="s"
      />
      {/* Example for union: id="s|n" dataType="s" */}
      {/* <CustomHandle type="target" position={Position.Left} id="s|n" dataType="s" /> */}
      {/* Example for any: id="x" dataType="x" /> */}
      {/* Example for custom: id="customType" dataType="customType" /> */}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">Output</div>
          <div className="text-xs text-amber-600 dark:text-amber-400">
            {texts.length} input{texts.length !== 1 ? 's' : ''}
          </div>
        </div>

        {texts.length ? (
          <div className="space-y-2">
            {texts.map((item) => (
              <div 
                key={item.id}
                className={`text-sm font-mono break-all bg-white/50 dark:bg-black/20 rounded px-2 py-1 ${
                  item.type === 'uppercase' ? 'text-sky-600 dark:text-sky-400' : ''
                }`}
              >
                {item.content}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs italic text-neutral-500">
            Connect text or uppercase nodes
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(OutputNode)
