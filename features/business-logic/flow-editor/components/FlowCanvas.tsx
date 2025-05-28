import React, { useRef, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Panel,
  SelectionMode,
  ColorMode,
  PanOnScrollMode
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
  // RESPONSIVE STATE MANAGEMENT
  // ============================================================================
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // ============================================================================
  // DYNAMIC POSITIONING VARIABLES
  // ============================================================================
  
  const controlsPosition = isMobile ? 'center-right' : 'top-left';
  const controlsClassName = isMobile ? ' translate-y-1/2 translate-x-1' : '';
  const deleteButtonPosition = isMobile ? 'center-right' : 'top-right';
  const deleteButtonStyle = isMobile ? { marginTop: '100px', marginRight: '14px' } : { marginTop: '70px' };

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
      style={{ touchAction: 'none' }}
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
        panOnDrag={true}
        panOnScroll={true}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnDoubleClick={false}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
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
        <Controls position={controlsPosition} showInteractive={false} className={controlsClassName} />
        
        {/* BACKGROUND */}
        <Background gap={12} size={1} color="#aaa" />
        
        {/* UNDO/REDO TOOLBAR */}
        <Panel position="top-right" className="m-2">
          <UndoRedoToolbar
            showHistoryPanel={showHistoryPanel}
            onToggleHistory={onToggleHistory}
          />
        </Panel>

        {/* MOBILE DELETE BUTTON - Only visible on mobile when node or edge is selected */}
        {(selectedNode || selectedEdge) && (
          <Panel position={deleteButtonPosition} className={`md:hidden ${controlsClassName}`} style={deleteButtonStyle}>
            <button
              onClick={() => {
                if (selectedNode) {
                  onDeleteNode?.(selectedNode.id);
                } else if (selectedEdge) {
                  onDeleteEdge?.(selectedEdge.id);
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-lg transition-colors"
              title={
                selectedNode 
                  ? `Delete ${selectedNode.data?.label || selectedNode.type} node`
                  : selectedEdge
                  ? `Delete connection`
                  : 'Delete'
              }
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </Panel>
        )}

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