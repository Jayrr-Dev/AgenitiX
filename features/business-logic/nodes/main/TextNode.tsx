// nodes/TextNode.tsx
'use client'
import { memo } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
} from '@xyflow/react'
import { TextNodeData } from '../initialElements'

function TextNode({ id, data }: NodeProps<Node<TextNodeData & Record<string, unknown>>>) {
  const { updateNodeData } = useReactFlow()

  return (
    <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <div className="text-xs mb-1 text-neutral-500">Text node {id}</div>

      <input
        className="xy-theme__input w-40"
        value={data.text}
        onChange={(e) => updateNodeData(id, { text: e.target.value })}
        placeholder="Type here…"
      />

      {/* single output handle */}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(TextNode)
