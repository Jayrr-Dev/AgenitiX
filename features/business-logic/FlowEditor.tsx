// components/FlowEditor.tsx
/* -------------------------------------------------------------------------- */
/*  FLOW EDITOR – unified version                                             */
/*  – Adds “UppercaseNode”, “TextNode”, and “ResultNode” from CustomNodeFlow  */
/*  – Keeps your drag-and-drop sidebar, theming, custom edges, etc.           */
/* -------------------------------------------------------------------------- */
'use client'

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  Position,
  MarkerType,
  ReactFlowInstance,
  SelectionMode,
  type OnConnect,
  ColorMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import Sidebar from './components/Sidebar'

/* -------  Custom nodes & edges ------------------------------------------- */
import TextUpdaterNode from './nodes/main/TextUpdaterNode'
import TextNode from './nodes/main/TextNode'
import UppercaseNode from './nodes/main/UppercaseNode'
import ResultNode from './nodes/main/ResultNode'

import CustomEdge from './edges/StraightPath'
import StepEdge from './edges/StepEdge'

/* -------  Theme ---------------------------------------------------------- */
import { useTheme } from 'next-themes'

/* -------------------------------------------------------------------------- */
/*  STRICT NODE/EDGE TYPE-SAFETY                                              */
/* -------------------------------------------------------------------------- */

/** Data carried by each node type */
interface TextUpdaterNodeData { value: number }
interface TextNodeData { text: string }
interface UppercaseNodeData { text: string }
interface OutputNodeData { label: string }

/** Allowed node union – keyed by `type` prop */
export type AgenNode =
  | (Node<TextUpdaterNodeData & Record<string, unknown>> & { type: 'textUpdater' })
  | (Node<TextNodeData & Record<string, unknown>> & { type: 'textNode' })
  | (Node<UppercaseNodeData & Record<string, unknown>> & { type: 'uppercaseNode' })
  | (Node<OutputNodeData & Record<string, unknown>> & { type: 'output'; targetPosition: Position })

/** Allowed edges – keep your custom & step variants */
export type AgenEdge = Edge & {
  sourceHandle?: string
  type: 'custom' | 'step'
}

/* -------------------------------------------------------------------------- */
/*  INITIAL DEMO GRAPH – mirrors CustomNodeFlow                              */
/* -------------------------------------------------------------------------- */
const initialNodes: AgenNode[] = [
  {
    id: '1',
    type: 'textNode',
    position: { x: -100, y: -50 },
    data: { text: 'hello' },
  },
  {
    id: '2',
    type: 'textNode',
    position: { x: 0, y: 100 },
    data: { text: 'world' },
  },
  {
    id: '3',
    type: 'uppercaseNode',
    position: { x: 100, y: -100 },
    data: { text: '' },
  },
  {
    id: '4',
    type: 'output',
    position: { x: 300, y: -75 },
    targetPosition: Position.Top,
    data: { label: 'Result' },
  },
]

const initialEdges: AgenEdge[] = [
  { id: 'e1-3', source: '1', target: '3', type: 'custom', markerEnd: { type: MarkerType.Arrow } },
  { id: 'e3-4', source: '3', target: '4', type: 'custom', markerEnd: { type: MarkerType.Arrow } },
  { id: 'e2-4', source: '2', target: '4', type: 'custom', markerEnd: { type: MarkerType.Arrow } },
]

/* -------------------------------------------------------------------------- */
/*  FLOW EDITOR COMPONENT                                                     */
/* -------------------------------------------------------------------------- */
export default function FlowEditor() {
  /* ------------- THEME --------------------------------------------------- */
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  /* ------------- REFS ---------------------------------------------------- */
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flowInstance = useRef<ReactFlowInstance | null>(null)

  /* ------------- STATE --------------------------------------------------- */
  const [nodes, setNodes] = useState<AgenNode[]>(initialNodes)
  const [edges, setEdges] = useState<AgenEdge[]>(initialEdges)

  /* ------------- CALLBACKS – generic RF handlers ------------------------ */
  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as AgenNode[]),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds) as AgenEdge[]),
    []
  )

  const onConnect: OnConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'custom',
            markerEnd: { type: MarkerType.Arrow },
          },
          eds
        )
      ),
    []
  )

  /* ------------- REGISTRIES -------------------------------------------- */
  const nodeTypes = useMemo(
    () => ({
      textUpdater: TextUpdaterNode,
      textNode: TextNode,
      uppercaseNode: UppercaseNode,      // NEW
      output: ResultNode,
    }),
    []
  )

  const edgeTypes = useMemo(
    () => ({
      custom: CustomEdge,
      step: StepEdge,
    }),
    []
  )

  /* ------------- DRAG-AND-DROP ----------------------------------------- */
  const onDragOver = useCallback((evt: React.DragEvent) => {
    evt.preventDefault()
    evt.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (evt: React.DragEvent) => {
      evt.preventDefault()
      if (!wrapperRef.current || !flowInstance.current) return

      const type = evt.dataTransfer.getData('application/reactflow')
      if (!type) return

      const bounds = wrapperRef.current.getBoundingClientRect()
      const position = flowInstance.current.screenToFlowPosition({
        x: evt.clientX - bounds.left,
        y: evt.clientY - bounds.top,
      })

      /* --- Choose sensible default data for each stencil type --------- */
      const newNode: AgenNode = {
        id: `node-${Date.now()}`,
        type: type as AgenNode['type'],
        position,
        data:
          type === 'textUpdater'
            ? { value: 0 }
            : type === 'textNode'
            ? { text: '' }
            : type === 'uppercaseNode'
            ? { text: '' }
            : { label: `${type} node` }, // output node fallback
        ...(type === 'output' ? { targetPosition: Position.Top } : {}),
      } as AgenNode

      setNodes((nds) => nds.concat(newNode))
    },
    []
  )

  /* ------------- MOUNT GUARD (for `next-themes`) ------------------------ */
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  /* ------------- RENDER ------------------------------------------------- */
  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full">
        {/* Left-hand draggable sidebar */}
        <Sidebar />

        {/* Canvas --------------------------------------------------------- */}
        <div
          ref={wrapperRef}
          className="relative flex-1"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(rf) => (flowInstance.current = rf as unknown as ReactFlowInstance)}
            fitView
            selectionMode={SelectionMode.Partial}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={['Delete', 'Backspace']}
            colorMode={resolvedTheme === 'dark' ? 'dark' : ('light' satisfies ColorMode)}
          >
            <MiniMap position="bottom-left" />
            <Controls position="top-left" showInteractive={false} />
            <Background gap={12} size={1} color="#aaa" />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  )
}
