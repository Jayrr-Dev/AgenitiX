// nodes/UppercaseNode.tsx
'use client'

/* -------------------------------------------------------------------------- */
/*  UppercaseNode                                                              */
/*  – Listens to any connected TextNodes, concatenates & upper-cases their     */
/*    `data.text` values, then exposes the result through its own `text` field */
/*    (so other nodes can read it)                                            */
/* -------------------------------------------------------------------------- */

import { memo, useMemo, useEffect } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'

import {
  MyNode,
  TextNodeData,
  UppercaseNodeData,
  isTextNode,
} from '../initialElements'

import CustomHandle from '../../handles/CustomHandle'

function UppercaseNode({ id, data }: NodeProps<Node<UppercaseNodeData & Record<string, unknown>>>) {
  const { updateNodeData } = useReactFlow()

  /* -------------------------------------------------------------- */
  /* 1️⃣  Which edges enter THIS node?                               */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  const sourceIds = connections.map((c) => c.source)

  /* -------------------------------------------------------------- */
  /* 2️⃣  Subscribe to all connected source nodes                    */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<MyNode>(sourceIds)

  /* -------------------------------------------------------------- */
  /* 3️⃣  Derive the transformed text                                */
  /* -------------------------------------------------------------- */
  const transformed = useMemo(() => {
    // Filter for text nodes and get their text content
    const texts = nodesData
      .filter((n): n is MyNode & { type: 'textNode' } => n.type === 'textNode')
      .map((n) => (n.data as TextNodeData).text)
      .filter((text): text is string => Boolean(text))

    // If no valid text nodes are connected, return empty string
    if (!texts.length) return ''

    // Join texts with spaces and convert to uppercase
    return texts.join(' ').toUpperCase()
  }, [nodesData])

  /* -------------------------------------------------------------- */
  /* 4️⃣  Push the value to our own data                             */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    // Ensure we're updating the node data with the transformed text
    updateNodeData(id, { text: transformed })
  }, [id, transformed, updateNodeData])

  /* -------------------------------------------------------------- */
  /* 5️⃣  Render                                                    */
  /* -------------------------------------------------------------- */
  return (
    <div className="px-4 py-3 rounded-lg bg-sky-100 dark:bg-sky-900 shadow-sm border border-sky-200 dark:border-sky-800">
      {/* INPUT HANDLE (left, string, id and dataType = 's') */}
      <CustomHandle 
        type="target" 
        position={Position.Left}
        id="s"
        dataType="s"
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-sky-900 dark:text-sky-100">Uppercase</div>
          <div className="text-xs text-sky-600 dark:text-sky-400">
            {sourceIds.length} input{sourceIds.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="min-h-[24px] text-sm font-mono break-all bg-white/50 dark:bg-black/20 rounded px-2 py-1">
          {transformed || (
            <span className="text-neutral-400 italic">
              {sourceIds.length ? 'No text input' : 'Connect text nodes'}
            </span>
          )}
        </div>
      </div>

      {/* OUTPUT HANDLE (right, string, id and dataType = 's') */}
      <CustomHandle 
        type="source" 
        position={Position.Right}
        id="s"
        dataType="s"
      />
      {/* Example for union: id="s|n" dataType="s" */}
      {/* <CustomHandle type="source" position={Position.Right} id="s|n" dataType="s" /> */}
      {/* Example for any: id="x" dataType="x" /> */}
      {/* Example for custom: id="customType" dataType="customType" /> */}
    </div>
  )
}

export default memo(UppercaseNode)
