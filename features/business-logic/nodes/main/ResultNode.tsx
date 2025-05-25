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
} from '@xyflow/react'
import {
  MyNode,
  isTextNode,
  TextNodeData,
} from '../initialElements'

function ResultNode() {
  /* -------------------------------------------------------------- */
  /*  1. Which edges arrive at *this* node?                         */
  /* -------------------------------------------------------------- */
  const connections = useNodeConnections({ handleType: 'target' })
  /* connections === NodeConnection[] where each entry looks like:
     { id, source, target, sourceHandle, targetHandle }             */

  /* -------------------------------------------------------------- */
  /*  2. Fetch the *source* nodes’ live data                        */
  /* -------------------------------------------------------------- */
  const nodesData = useNodesData<MyNode>(
    connections.map((c: NodeConnection) => c.source)
  )

  /* -------------------------------------------------------------- */
  /*  3. Filter only text nodes + pluck their values                */
  /* -------------------------------------------------------------- */
  // Extract text content from connected nodes
  const texts = nodesData
    .filter((node): node is MyNode & { type: 'textNode' } => node.type === 'textNode')
    .map((node) => (node.data as TextNodeData).text)
    .filter((text): text is string => Boolean(text))

  /* -------------------------------------------------------------- */
  /*  4. Render                                                     */
  /* -------------------------------------------------------------- */
  return (
    <div className="px-3 py-2 rounded bg-amber-100 dark:bg-amber-900">
      <Handle type="target" position={Position.Left} />

      <div className="text-sm font-semibold">Incoming texts:</div>
      {texts.length ? (
        <ul className="list-disc list-inside text-xs">
          {texts.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      ) : (
        <div className="text-xs italic text-neutral-500">none</div>
      )}
    </div>
  )
}

export default memo(ResultNode)
