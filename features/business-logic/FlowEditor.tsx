// components/FlowEditor.tsx
/* -------------------------------------------------------------------------- */
/*  FLOW EDITOR – unified version                                             */
/*  – Adds "UppercaseNode", "TextNode", and "ResultNode" from CustomNodeFlow  */
/*  – Keeps your drag-and-drop sidebar, theming, custom edges, etc.           */
/* -------------------------------------------------------------------------- */
'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
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
  reconnectEdge,
  Panel,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toast } from 'sonner';

/* -------  Custom components --------------------------------------------- */
import Sidebar   from './components/Sidebar';
import DebugTool from './components/DebugTool';
import NodeInspector from './components/NodeInspector';
/* -------  Custom nodes --------------------------------------------------- */
import TextNode        from './nodes/main/TextNode';
import TextUppercaseNode   from './nodes/main/TextUppercaseNode';
import OutputNode      from './nodes/main/OutputNode';
import TriggerOnClick  from './nodes/main/TriggerOnClick';
import TriggerOnPulse  from './nodes/main/TriggerOnPulse';
import TriggerOnPulseCycle from './nodes/main/TriggerOnPulseCycle';
import TriggerOnToggle from './nodes/main/TriggerOnToggle';
import TriggerOnToggleCycle from './nodes/main/TriggerOnToggleCycle';
import LogicAnd from './nodes/main/LogicAnd';
import LogicOr from './nodes/main/LogicOr';
import LogicNot from './nodes/main/LogicNot'
import { parseTypes } from './handles/CustomHandle'; // Reuse parseTypes for type logic
import TextConverterNode from './nodes/main/TextConverterNode';
import BooleanConverterNode from './nodes/main/BooleanConverterNode';
import InputTesterNode from './nodes/main/InputTesterNode';
import ObjectEditorNode from './nodes/main/ObjectEditorNode';
import ArrayEditorNode from './nodes/main/ArrayEditorNode';

/* -------  Custom edges --------------------------------------------------- */
import CustomEdge from './edges/StraightPath';
import StepEdge   from './edges/StepEdge';

/* -------  Theme ---------------------------------------------------------- */
import { useTheme } from 'next-themes';

/* -------------------------------------------------------------------------- */
/*  STRICT NODE/EDGE TYPE-SAFETY                                              */
/* -------------------------------------------------------------------------- */
interface TextNodeData        { text: string }
interface TextUppercaseNodeData   { text: string }
interface OutputNodeData      { label: string }
interface TriggerOnClickData  { triggered: boolean }
interface TriggerOnPulseData  { triggered: boolean }
interface TriggerOnPulseCycleData {
  triggered: boolean;
  initialState?: boolean;
  cycleDuration?: number;
  pulseDuration?: number;
  infinite?: boolean;
}
interface TriggerOnToggleData { triggered: boolean }
interface TriggerOnToggleCycleData {
  triggered: boolean;
  initialState?: boolean;
  onDuration?: number;
  offDuration?: number;
  infinite?: boolean;
}
interface LogicAndData { value: boolean; inputCount?: number }
interface LogicOrData { value: boolean; inputCount?: number }
interface LogicNotData {
  value: boolean;
}
interface TextConverterNodeData { value?: unknown }
interface BooleanConverterNodeData { value?: unknown; triggered?: boolean }
interface InputTesterNodeData { value?: unknown }
interface ObjectEditorNodeData { value?: Record<string, unknown> }
interface ArrayEditorNodeData { value?: unknown[] }

export type AgenNode =
  | (Node<TextNodeData        & Record<string, unknown>> & { type: 'textNode' })
  | (Node<TextUppercaseNodeData   & Record<string, unknown>> & { type: 'uppercaseNode' })
  | (Node<OutputNodeData      & Record<string, unknown>> & { type: 'output'; targetPosition: Position })
  | (Node<TriggerOnClickData  & Record<string, unknown>> & { type: 'triggerOnClick' })
  | (Node<TriggerOnPulseData  & Record<string, unknown>> & { type: 'triggerOnPulse' })
  | (Node<TriggerOnPulseCycleData & Record<string, unknown>> & { type: 'triggerOnPulseCycle' })
  | (Node<TriggerOnToggleData & Record<string, unknown>> & { type: 'triggerOnToggle' })
  | (Node<TriggerOnToggleCycleData & Record<string, unknown>> & { type: 'triggerOnToggleCycle' })
  | (Node<LogicAndData & Record<string, unknown>> & { type: 'logicAnd' })
  | (Node<LogicOrData & Record<string, unknown>> & { type: 'logicOr' })
  | (Node<LogicNotData & Record<string, unknown>> & { type: 'logicNot' })
  | (Node<TextConverterNodeData & Record<string, unknown>> & { type: 'textConverterNode' })
  | (Node<BooleanConverterNodeData & Record<string, unknown>> & { type: 'booleanConverterNode' })
  | (Node<InputTesterNodeData & Record<string, unknown>> & { type: 'inputTesterNode' })
  | (Node<ObjectEditorNodeData & Record<string, unknown>> & { type: 'objectEditorNode' })
  | (Node<ArrayEditorNodeData & Record<string, unknown>> & { type: 'arrayEditorNode' });

export type AgenEdge = Edge & {
  sourceHandle?: string | null;
  targetHandle?: string | null;
  type: 'custom' | 'step' | 'default';
  style?: { stroke: string; strokeWidth: number };
};

/* -------------------------------------------------------------------------- */
/*  INITIAL DEMO GRAPH                                                        */
/* -------------------------------------------------------------------------- */
const initialNodes: AgenNode[] = [
  { id: '1', type: 'textNode',      position: { x: -100, y: -50 }, data: { text: 'hello', heldText: 'hello', defaultText: 'hello' } },
  { id: '2', type: 'textNode',      position: { x:   0,  y: 100 }, data: { text: 'world', heldText: 'world', defaultText: 'world' } },
  { id: '3', type: 'uppercaseNode', position: { x: 100,  y: -100 }, data: { text: '' } },
  { id: '4', type: 'output',        position: { x: 300,  y:  -75 }, targetPosition: Position.Top, data: { label: 'Result' } },
];

// TYPE LEGEND & COLORS (sync with CustomHandle)
const typeMap: Record<string, { label: string; color: string }> = {
  s: { label: 's', color: '#3b82f6' },      // string - blue
  n: { label: 'n', color: '#f59e42' },      // number - orange
  b: { label: 'b', color: '#10b981' },      // boolean - green
  j: { label: 'j', color: '#6366f1' },      // JSON - indigo
  a: { label: 'a', color: '#f472b6' },      // array - pink
  N: { label: 'N', color: '#a21caf' },      // Bigint - purple
  f: { label: 'f', color: '#fbbf24' },      // float - yellow
  x: { label: 'x', color: '#6b7280' },      // any - gray
  u: { label: 'u', color: '#d1d5db' },      // undefined - light gray
  S: { label: 'S', color: '#eab308' },      // symbol - gold
  '∅': { label: '∅', color: '#ef4444' },    // null - red
}

const initialEdges: AgenEdge[] = [
  { id: 'e1-3', source: '1', target: '3', type: 'default', style: { stroke: typeMap['s'].color, strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', type: 'default', style: { stroke: typeMap['s'].color, strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', type: 'default', style: { stroke: typeMap['s'].color, strokeWidth: 2 } },
];

/* -------------------------------------------------------------------------- */
/*  FLOW EDITOR COMPONENT                                                     */
/* -------------------------------------------------------------------------- */
export default function FlowEditor() {
  /* ------------- THEME --------------------------------------------------- */
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  /* ------------- REFS ---------------------------------------------------- */
  const wrapperRef        = useRef<HTMLDivElement>(null);
  const flowInstance      = useRef<ReactFlowInstance<AgenNode, AgenEdge> | null>(null);
  const edgeReconnectFlag = useRef(true);

  /* ------------- STATE --------------------------------------------------- */
  const [nodes, setNodes]         = useState<AgenNode[]>(initialNodes);
  const [edges, setEdges]         = useState<AgenEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // --- COPY/PASTE STATE ---
  const [copiedNodes, setCopiedNodes] = useState<AgenNode[]>([]);
  const [copiedEdges, setCopiedEdges] = useState<AgenEdge[]>([]);

  const selectedNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) ?? null : null),
    [nodes, selectedNodeId]
  );
  const getNodeOutput = (
    node: AgenNode,
    allNodes: AgenNode[],
    allEdges: AgenEdge[]
  ): string | null => {
    if (node.type === 'textNode')          return node.data.text;
    if (node.type === 'uppercaseNode')     return node.data.text;
    if (node.type === 'triggerOnClick')    return node.data.triggered ? 'Triggered' : 'Not Triggered';
    if (node.type === 'output') {
      const incoming = allEdges
        .filter((e) => e.target === node.id)
        .map((e) => allNodes.find((n) => n.id === e.source))
        .filter(Boolean) as AgenNode[];
  
      const texts = incoming.map((n) => {
        if (n.type === 'textNode') {
          return {
            type: 'text',
            content: n.data.text
          };
        } else if (n.type === 'uppercaseNode') {
          return {
            type: 'uppercase',
            content: n.data.text
          };
        }
        return null;
      }).filter((item): item is { type: 'text' | 'uppercase', content: string } => 
        item !== null && Boolean(item.content)
      );
  
      return texts.map(t => t.content).join(', ');
    }
    return null;
  };
  const selectedOutput = selectedNode
    ? getNodeOutput( selectedNode, nodes, edges)
    : null;

  /* ------------- CALLBACKS – generic RF handlers ------------------------ */
  const onReconnectStart = useCallback(() => {
    edgeReconnectFlag.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConn: Connection) => {
      edgeReconnectFlag.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConn, els) as AgenEdge[]);
    },
    []
  );

  const onReconnectEnd = useCallback((_: any, edge: Edge) => {
    if (!edgeReconnectFlag.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeReconnectFlag.current = true;
  }, []);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds) as AgenNode[]),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds) as AgenEdge[]),
    []
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      // --- TYPE-SAFE EDGE COLORING & VALIDATION ---
      let dataType = 's'; // fallback
      if (connection.sourceHandle) {
        // Use parseTypes to support union/any/custom
        const types = parseTypes(connection.sourceHandle);
        // Use first type for color (or 'x' for any)
        dataType = types[0] || 's';
      }
      // --- Prevent boolean-to-string (or any invalid) connections ---
      if (connection.sourceHandle && connection.targetHandle) {
        const sourceTypes = parseTypes(connection.sourceHandle);
        const targetTypes = parseTypes(connection.targetHandle);
        // Allow if either side is 'x' (any)
        const valid = sourceTypes.includes('x') || targetTypes.includes('x') || sourceTypes.some((st: string) => targetTypes.includes(st));
        if (!valid) {
          toast.error('Type mismatch: cannot connect these handles.');
          return; // Block invalid connection
        }
      }
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'default',
            style: { stroke: typeMap[dataType]?.color || '#6b7280', strokeWidth: 2 },
          },
          eds
        )
      )
    },
    []
  );

  /* 🔖 Selection change → keep first selected node (if any) */
  const onSelectionChange: OnSelectionChangeFunc<AgenNode, AgenEdge> = useCallback(
    ({ nodes: sel }) => setSelectedNodeId(sel.length ? sel[0].id : null),
    []
  );
  
  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? ({ ...n, data: { ...n.data, ...patch } } as AgenNode) : n
        )
      );
    },
    []
  );
 

  /* ------------- REGISTRIES -------------------------------------------- */
  const nodeTypes = useMemo(
    () => ({
      textNode:     TextNode,
      uppercaseNode: TextUppercaseNode,
      output:       OutputNode,
      triggerOnClick: TriggerOnClick,
      triggerOnPulse: TriggerOnPulse,
      triggerOnPulseCycle: TriggerOnPulseCycle,
      triggerOnToggle: TriggerOnToggle,
      triggerOnToggleCycle: TriggerOnToggleCycle,
      logicAnd: LogicAnd,
      logicOr: LogicOr,
      logicNot: LogicNot,
      textConverterNode: TextConverterNode,
      booleanConverterNode: BooleanConverterNode,
      inputTesterNode: InputTesterNode,
      objectEditorNode: ObjectEditorNode,
      arrayEditorNode: ArrayEditorNode,
    }),
    []
  );

  const edgeTypes = useMemo(() => ({}), [])

  /* ------------- DRAG-AND-DROP ----------------------------------------- */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!wrapperRef.current || !flowInstance.current) return;

    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const bounds   = wrapperRef.current.getBoundingClientRect();
    const position = flowInstance.current.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });

    const newNode: AgenNode = {
      id: `node-${Date.now()}`,
      type: type as AgenNode['type'],
      position,
      data:
        type === 'textNode'      ? { text: '' } :
        type === 'uppercaseNode' ? { text: '' } :
        type === 'triggerOnClick' ? { triggered: false } :
        type === 'triggerOnPulse' ? { triggered: false } :
        type === 'triggerOnPulseCycle' ? { triggered: false } :
        type === 'triggerOnToggle' ? { triggered: false } :
        type === 'triggerOnToggleCycle' ? { triggered: false, initialState: false, onDuration: 4000, offDuration: 4000, infinite: true } :
        type === 'logicAnd' ? { value: false, inputCount: 2 } :
        type === 'logicOr' ? { value: false, inputCount: 2 } :
        type === 'logicNot' ? { value: false } :
        type === 'textConverterNode' ? { value: '' } :
        type === 'booleanConverterNode' ? { value: '', triggered: false } :
        type === 'inputTesterNode' ? { value: undefined } :
        type === 'objectEditorNode' ? { value: {} } :
        type === 'arrayEditorNode' ? { value: [] } :
                                   { label: `${type} node` },
      ...(type === 'output' ? { targetPosition: Position.Top } : {}),
    } as AgenNode;

    setNodes((nds) => nds.concat(newNode));
  }, []);

  /* ------------- COPY/PASTE HANDLERS --- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      // --- COPY ---
      if (ctrl && e.key.toLowerCase() === 'c') {
        const selected = nodes.filter(n => n.selected);
        if (selected.length === 0) return;
        // Copy selected nodes and their connecting edges
        setCopiedNodes(selected);
        setCopiedEdges(
          edges.filter(e =>
            selected.some(n => n.id === e.source) && selected.some(n => n.id === e.target)
          )
        );
        e.preventDefault();
      }
      // --- PASTE ---
      if (ctrl && e.key.toLowerCase() === 'v') {
        if (copiedNodes.length === 0) return;
        // Offset pasted nodes
        const offset = 40;
        const idMap: Record<string, string> = {};
        const newNodes = copiedNodes.map((n) => {
          const newId = `${n.id}-copy-${Date.now()}-${Math.floor(Math.random()*10000)}`;
          idMap[n.id] = newId;
          // Ensure required fields for each node type
          let newData: any = { ...n.data };
          if (n.type === 'textNode') {
            newData = {
              text: (n.data as any).text ?? '',
              heldText: (n.data as any).heldText ?? (n.data as any).text ?? '',
              defaultText: (n.data as any).defaultText ?? (n.data as any).text ?? '',
            };
          } else if (n.type === 'uppercaseNode') {
            newData = { text: (n.data as any).text ?? '' };
          } else if (n.type === 'output') {
            newData = { label: (n.data as any).label ?? 'Result' };
          } else if (n.type === 'triggerOnClick') {
            newData = { triggered: (n.data as any).triggered ?? false };
          } else if (n.type === 'triggerOnPulse') {
            newData = {
              triggered: (n.data as any).triggered ?? false,
              duration: (n.data as any).duration ?? 500,
            };
          } else if (n.type === 'triggerOnPulseCycle') {
            newData = {
              triggered: (n.data as any).triggered ?? false,
              initialState: (n.data as any).initialState ?? false,
              cycleDuration: (n.data as any).cycleDuration ?? 2000,
              pulseDuration: (n.data as any).pulseDuration ?? 500,
              infinite: (n.data as any).infinite ?? true,
            };
          } else if (n.type === 'triggerOnToggle') {
            newData = { triggered: (n.data as any).triggered ?? false };
          } else if (n.type === 'triggerOnToggleCycle') {
            newData = {
              triggered: (n.data as any).triggered ?? false,
              initialState: (n.data as any).initialState ?? false,
              onDuration: (n.data as any).onDuration ?? 4000,
              offDuration: (n.data as any).offDuration ?? 4000,
              infinite: (n.data as any).infinite ?? true,
            };
          } else if (n.type === 'logicAnd') {
            newData = {
              value: (n.data as any).value ?? false,
              inputCount: (n.data as any).inputCount ?? 2,
            };
          } else if (n.type === 'logicOr') {
            newData = {
              value: (n.data as any).value ?? false,
              inputCount: (n.data as any).inputCount ?? 2,
            };
          } else if (n.type === 'logicNot') {
            newData = { value: (n.data as any).value ?? false };
          }
          return {
            ...n,
            id: newId,
            position: { x: n.position.x + offset, y: n.position.y + offset },
            selected: false,
            data: newData,
          };
        });
        const newEdges = copiedEdges.map((e) => {
          // Only paste edges if both source and target are in the copied set
          if (idMap[e.source] && idMap[e.target]) {
            return {
              ...e,
              id: `${e.id}-copy-${Date.now()}-${Math.floor(Math.random()*10000)}`,
              source: idMap[e.source],
              target: idMap[e.target],
              selected: false,
            };
          }
          return null;
        }).filter(Boolean) as AgenEdge[];
        setNodes((nds) => nds.concat(newNodes));
        setEdges((eds) => eds.concat(newEdges));
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, copiedNodes, copiedEdges]);

  /* ------------- MOUNT GUARD ------------------------------------------- */
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  /* ------------- RENDER ------------------------------------------------- */
  return (
    <ReactFlowProvider>
      <div className="flex h-full w-full">
        <Sidebar />
        <DebugTool />

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
            snapToGrid
            onReconnect={onReconnect}
            onReconnectStart={onReconnectStart}
            onReconnectEnd={onReconnectEnd}
            onConnect={onConnect}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onSelectionChange={onSelectionChange}          
            onInit={(rf) => (flowInstance.current  = rf)}
            fitView
            selectionMode={SelectionMode.Partial}
            proOptions={{ hideAttribution: true }}
            deleteKeyCode={['Delete', 'Backspace']}
            colorMode={resolvedTheme === 'dark' ? 'dark' : ('light' satisfies ColorMode)}
          >
            <Panel
              position="bottom-center"
              className="rounded bg-white/90 dark:bg-zinc-800/90 p-4 shadow max-w-xs"
            >
              {selectedNode && (
                <NodeInspector 
                  node={selectedNode} 
                  updateNodeData={updateNodeData} 
                  output={selectedOutput} 
                />
              )}
            </Panel>
            <MiniMap position="bottom-left" />
            <Controls position="top-left" showInteractive={false} />
            <Background gap={12} size={1} color="#aaa" />
          </ReactFlow>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
