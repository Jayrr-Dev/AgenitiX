import React, { useRef, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  SelectionMode,
  ColorMode
} from '@xyflow/react';
import { useTheme } from 'next-themes';
import type { AgenNode, AgenEdge } from '../types';

// Import node components
import TextNode from '../../nodes/media/TextNode';
import TextUppercaseNode from '../../nodes/media/TextUppercaseNode';
import OutputNode from '../../nodes/main/OutputNode';
import TriggerOnClick from '../../nodes/automation/TriggerOnClick';
import TriggerOnPulse from '../../nodes/automation/TriggerOnPulse';
import TriggerOnPulseCycle from '../../nodes/automation/TriggerOnPulseCycle';
import TriggerOnToggle from '../../nodes/automation/TriggerOnToggle';
import TriggerOnToggleCycle from '../../nodes/automation/TriggerOnToggleCycle';
import LogicAnd from '../../nodes/main/LogicAnd';
import LogicOr from '../../nodes/main/LogicOr';
import LogicNot from '../../nodes/main/LogicNot';
import LogicXor from '../../nodes/main/LogicXor';
import LogicXnor from '../../nodes/main/LogicXnor';
import TextConverterNode from '../../nodes/media/TextConverterNode';
import BooleanConverterNode from '../../nodes/automation/BooleanConverterNode';
import InputTesterNode from '../../nodes/main/InputTesterNode';
import ObjectEditorNode from '../../nodes/main/ObjectEditorNode';
import ArrayEditorNode from '../../nodes/main/ArrayEditorNode';
import CounterNode from '../../nodes/automation/CounterNode';
import DelayNode from '../../nodes/automation/DelayNode';

// Import components
import NodeInspector from '../../components/NodeInspector';
import UndoRedoToolbar from '../../components/UndoRedoToolbar';
import HistoryPanel from '../../components/HistoryPanel';
import { ActionHistoryEntry } from '../../components/UndoRedoManager';

interface FlowCanvasProps {
  nodes: AgenNode[];
  edges: AgenEdge[];
  selectedNode: AgenNode | null;
  selectedEdge: AgenEdge | null;
  selectedOutput: string | null;
  nodeErrors: Record<string, any[]>;
  showHistoryPanel: boolean;
  actionHistory: ActionHistoryEntry[];
  historyIndex: number;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  updateNodeData: (id: string, patch: Record<string, unknown>) => void;
  updateNodeId?: (oldId: string, newId: string) => void;
  logNodeError: (nodeId: string, message: string, type?: any, source?: string) => void;
  clearNodeErrors: (nodeId: string) => void;
  onToggleHistory: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDeleteNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteEdge?: (edgeId: string) => void;
  reactFlowHandlers: {
    onReconnectStart: () => void;
    onReconnect: (oldEdge: any, newConn: any) => void;
    onReconnectEnd: (event: any, edge: any) => void;
    onConnect: (connection: any) => void;
    onNodesChange: (changes: any[]) => void;
    onEdgesChange: (changes: any[]) => void;
    onSelectionChange: (selection: any) => void;
    onInit: (instance: any) => void;
  };
}

export const FlowCanvas: React.FC<FlowCanvasProps> = ({
  nodes,
  edges,
  selectedNode,
  selectedEdge,
  selectedOutput,
  nodeErrors,
  showHistoryPanel,
  actionHistory,
  historyIndex,
  wrapperRef,
  updateNodeData,
  updateNodeId,
  logNodeError,
  clearNodeErrors,
  onToggleHistory,
  onDragOver,
  onDrop,
  onDeleteNode,
  onDuplicateNode,
  onDeleteEdge,
  reactFlowHandlers
}) => {
  const { resolvedTheme } = useTheme();

  // ============================================================================
  // NODE TYPES REGISTRY
  // ============================================================================
  
  const nodeTypes = useMemo(
    () => ({
      textNode: TextNode,
      uppercaseNode: TextUppercaseNode,
      outputnode: OutputNode,
      triggerOnClick: TriggerOnClick,
      triggerOnPulse: TriggerOnPulse,
      triggerOnPulseCycle: TriggerOnPulseCycle,
      triggerOnToggle: TriggerOnToggle,
      triggerOnToggleCycle: TriggerOnToggleCycle,
      logicAnd: LogicAnd,
      logicOr: LogicOr,
      logicNot: LogicNot,
      logicXor: LogicXor,
      logicXnor: LogicXnor,
      textConverterNode: TextConverterNode,
      booleanConverterNode: BooleanConverterNode,
      inputTesterNode: InputTesterNode,
      objectEditorNode: ObjectEditorNode,
      arrayEditorNode: ArrayEditorNode,
      counterNode: CounterNode,
      delayNode: DelayNode,
    }),
    []
  );

  const edgeTypes = useMemo(() => ({}), []);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
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
        onReconnect={reactFlowHandlers.onReconnect}
        onReconnectStart={reactFlowHandlers.onReconnectStart}
        onReconnectEnd={reactFlowHandlers.onReconnectEnd}
        onConnect={reactFlowHandlers.onConnect}
        onNodesChange={reactFlowHandlers.onNodesChange}
        onEdgesChange={reactFlowHandlers.onEdgesChange}
        onSelectionChange={reactFlowHandlers.onSelectionChange}
        onInit={reactFlowHandlers.onInit}
        fitView
        selectionMode={SelectionMode.Partial}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={['Delete', 'Backspace']}
        colorMode={resolvedTheme === 'dark' ? 'dark' : ('light' satisfies ColorMode)}
      >
        {/* NODE INSPECTOR PANEL */}
        <Panel
          position="bottom-center"
          className="hidden md:block rounded bg-white/90 dark:bg-zinc-800/90 p-4 shadow max-w-4xl max-h-[250px] overflow-y-auto scrollbar-none"
        >
          <NodeInspector 
            node={selectedNode} 
            selectedEdge={selectedEdge}
            allNodes={nodes}
            updateNodeData={updateNodeData} 
            output={selectedOutput}
            errors={selectedNode ? nodeErrors[selectedNode.id] || [] : []}
            onClearErrors={selectedNode ? () => clearNodeErrors(selectedNode.id) : undefined}
            onLogError={logNodeError}
            onUpdateNodeId={updateNodeId}
            onDeleteNode={onDeleteNode}
            onDuplicateNode={onDuplicateNode}
            onDeleteEdge={onDeleteEdge}
          />
        </Panel>

        {/* MINIMAP */}
        <MiniMap position="bottom-left" className="hidden md:block" />
        
        {/* CONTROLS */}
        <Controls position="top-left" showInteractive={false} />
        
        {/* BACKGROUND */}
        <Background gap={12} size={1} color="#aaa" />
        
        {/* UNDO/REDO TOOLBAR */}
        <Panel position="top-right" className="m-2">
          <UndoRedoToolbar
            showHistoryPanel={showHistoryPanel}
            onToggleHistory={onToggleHistory}
          />
        </Panel>

        {/* FLOATING HISTORY PANEL */}
        {showHistoryPanel && (
          <Panel position="top-right" className="mr-2" style={{ marginTop: '70px' }}>
            <div className="w-80 max-h-96">
              <HistoryPanel
                history={actionHistory}
                currentIndex={historyIndex}
                className="shadow-lg"
              />
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}; 