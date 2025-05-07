'use client';

import {
  ReactFlow,
  Controls,
  Background,
  SelectionMode,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  addEdge,
  Position,
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';
import TextUpdaterNode from './nodes/TextUpdaterNode';

const initialNodes: Node[] = [
  {
    id: 'node-1',
    type: 'textUpdater',
    position: { x: 0, y: 0 },
    data: { value: 123 },
  },
  {
    id: 'node-2',
    type: 'output',
    targetPosition: Position.Top,
    position: { x: 0, y: 200 },
    data: { label: 'node 2' },
  },
  {
    id: 'node-3',
    type: 'output',
    targetPosition: Position.Top,
    position: { x: 200, y: 200 },
    data: { label: 'node 3' },
  },
];
 
const initialEdges = [
  { id: 'edge-1', source: 'node-1', target: 'node-2', sourceHandle: 'a' },
  { id: 'edge-2', source: 'node-1', target: 'node-3', sourceHandle: 'b' },
];
 


export default function Logic() {
const nodeTypes = useMemo(() => ({
    textUpdater: TextUpdaterNode,
  }), []);


  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const isTouch = useIsTouchDevice();
 
  // panOnDrag: only enable full drag on touch, mouse gets [1, 2]
  const panOnDrag = isTouch ? true : [1, 2];

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

 

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  // Mobile: handle double-tap reset
  useEffect(() => {
    if (!isTouch) return;

    const wrapper = document.getElementById('flow-wrapper');
    if (!wrapper) return;

    let lastTap = 0;
    const handleTouchEnd = () => {
      const now = Date.now();
      if (now - lastTap < 300) {
        reactFlowInstance.current?.fitView();
      }
      lastTap = now;
    };

    wrapper.addEventListener('touchend', handleTouchEnd);
    return () => wrapper.removeEventListener('touchend', handleTouchEnd);
  }, [isTouch]);


  //stops hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div
      id="flow-wrapper"
      className="flex flex-col h-screen w-screen touch-manipulation overflow-hidden"
    >
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
        }}
        panOnDrag={panOnDrag}
        panOnScroll
        zoomOnPinch
        zoomOnScroll
        zoomOnDoubleClick={false}
        preventScrolling={false}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={!isTouch} 
        connectOnClick={false}
        colorMode={resolvedTheme === 'dark' ? 'dark' : 'light'}
        fitView
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
