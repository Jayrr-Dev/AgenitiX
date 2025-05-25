// nodes/TextNode.tsx
'use client'
import { memo, useEffect } from 'react'
import {
  Handle,
  Position,
  useReactFlow,
  useNodeConnections,
  useNodesData,
  type NodeProps,
  type Node,
} from '@xyflow/react'
import { TextNodeData } from '../initialElements'
import CustomHandle from '../../handles/CustomHandle'

function TextNode({ id, data }: NodeProps<Node<TextNodeData & Record<string, unknown>>>) {
  const { updateNodeData } = useReactFlow()

  // --- TRIGGER HANDLE LOGIC ---
  const triggerConnections = useNodeConnections({ handleType: 'target' }).filter(c => c.targetHandle === 'b')
  const triggerSourceIds = triggerConnections.map((c) => c.source)
  const triggerNodesData = useNodesData(triggerSourceIds)
  // If any connected trigger node is triggered, allow data to flow
  const isTriggered = triggerNodesData.some((n) => n.data.triggered)

  // --- Set heldText to defaultText on mount if not set ---
  useEffect(() => {
    if (typeof data.heldText !== 'string' && typeof data.defaultText === 'string') {
      updateNodeData(id, { heldText: data.defaultText })
    }
  }, [data.heldText, data.defaultText, id, updateNodeData])

  // Only output value when triggered, otherwise output empty string
  useEffect(() => {
    if (triggerSourceIds.length === 0) {
      // No trigger connected, always output value
      updateNodeData(id, { text: data.heldText ?? '' })
    } else if (isTriggered) {
      // Output value as long as trigger is ON
      updateNodeData(id, { text: data.heldText ?? '' })
    } else {
      // Output empty string when not triggered
      updateNodeData(id, { text: '' })
    }
  }, [isTriggered, triggerSourceIds.length, data.heldText, id, updateNodeData])

  return (
    <div className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <div className="text-xs mb-1 text-neutral-500">Text node {id}</div>

      <input
        className="xy-theme__input w-40"
        value={typeof data.heldText === 'string' ? data.heldText : ''}
        onChange={(e) => updateNodeData(id, { heldText: e.target.value })}
        placeholder={'Type here…'}
      />

      {/* TRIGGER INPUT HANDLE (left, boolean, id and dataType = 'b') */}
      <CustomHandle type="target" position={Position.Left} id="b" dataType="b" />
      {/* DATA OUTPUT HANDLE (right, string, id and dataType = 's') */}
      <CustomHandle type="source" position={Position.Right} id="s" dataType="s" />
      {/* Example for union: id="s|n" dataType="s" */}
      {/* <CustomHandle type="source" position={Position.Right} id="s|n" dataType="s" /> */}
      {/* Example for any: id="x" dataType="x" */}
      {/* <CustomHandle type="source" position={Position.Right} id="x" dataType="x" /> */}
      {/* Example for custom: id="customType" dataType="customType" */}
      {/* <CustomHandle type="source" position={Position.Right} id="customType" dataType="customType" /> */}
    </div>
  )
}

export default memo(TextNode)
