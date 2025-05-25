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

function UppercaseNode({ id, data }: NodeProps<Node<UppercaseNodeData & Record<string, unknown>>>) {
  const { updateNodeData } = useReactFlow()

  /* -------------------------------------------------------------- */
  /* 1️⃣  Which edges enter THIS node?                               */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  const sourceIds   = connections.map((c) => c.source)

  /* -------------------------------------------------------------- */
  /* 2️⃣  Subscribe to all connected source nodes                    */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<MyNode>(sourceIds)

  /* -------------------------------------------------------------- */
  /* 3️⃣  Derive the transformed text                                */
  /* -------------------------------------------------------------- */
  const transformed = useMemo(() => {
    const texts = nodesData
      .filter((n): n is MyNode & { type: 'textNode' } => n.type === 'textNode')
      .map((n) => (n.data as TextNodeData).text)
      .filter((text): text is string => Boolean(text))

    return texts.join(' ')

    return texts.length ? texts.join(' ').toUpperCase() : ''
  }, [nodesData])

  /* -------------------------------------------------------------- */
  /* 4️⃣  Push the value to our own data                             */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    updateNodeData(id, { text: transformed })
  }, [id, transformed, updateNodeData])

  /* -------------------------------------------------------------- */
  /* 5️⃣  Render                                                    */
  /* -------------------------------------------------------------- */
  return (
    <div className="px-2 py-1 rounded bg-sky-100 dark:bg-sky-900">
      {/* allow unlimited inputs */}
      <Handle type="target" position={Position.Left} />

      <div className="text-xs font-semibold mb-1">Uppercase</div>
      <div className="text-sm font-mono break-all">
        {transformed || <span className="text-neutral-400">—</span>}
      </div>

      {/* single output */}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(UppercaseNode)
