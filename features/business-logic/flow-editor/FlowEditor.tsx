'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import components
import Sidebar from '../components/Sidebar';
import DebugTool from '../components/DebugTool';
import UndoRedoManager, { ActionHistoryEntry } from '../components/UndoRedoManager';
import { UndoRedoProvider } from '../components/UndoRedoContext';
import { FlowCanvas } from './components/FlowCanvas';
import { NodeDisplayProvider } from './contexts/NodeDisplayContext';

// Import hooks
import { useFlowEditorState } from './hooks/useFlowEditorState';
import { useReactFlowHandlers } from './hooks/useReactFlowHandlers';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Import types
import type { Node, Edge } from '@xyflow/react';
import type { AgenNode, AgenEdge } from './types';

/**
 * FlowEditor - Main component for the visual flow editor
 * 
 * This component has been refactored from a monolithic 748-line file into a modular
 * architecture with clear separation of concerns:
 * 
 * - State management: useFlowEditorState hook
 * - ReactFlow handlers: useReactFlowHandlers hook  
 * - Drag & drop: useDragAndDrop hook
 * - Keyboard shortcuts: useKeyboardShortcuts hook
 * - UI rendering: FlowCanvas component
 * 
 * Benefits:
 * - Much easier to test individual pieces
 * - Clear separation of concerns
 * - Reusable hooks
 * - Better performance with targeted re-renders
 * - Easier to extend and maintain
 */
export default function FlowEditor() {
  // ============================================================================
  // MOUNT GUARD
  // ============================================================================
  
  const [mounted, setMounted] = useState(false);
  
  // ============================================================================
  // REFS
  // ============================================================================
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const flowState = useFlowEditorState();

  // ============================================================================
  // UNDO/REDO STATE
  // ============================================================================
  
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // REACTFLOW HANDLERS
  // ============================================================================
  
  const reactFlowHandlers = useReactFlowHandlers({
    nodes: flowState.nodes,
    edges: flowState.edges,
    setNodes: flowState.setNodes,
    setEdges: flowState.setEdges,
    onSelectionChange: flowState.selectNode,
    onEdgeSelectionChange: flowState.selectEdge
  });

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================
  
  const dragAndDrop = useDragAndDrop({
    flowInstance: reactFlowHandlers.flowInstance,
    wrapperRef,
    onNodeAdd: flowState.addNode
  });

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useKeyboardShortcuts({
    onCopy: flowState.copySelectedNodes,
    onPaste: flowState.pasteNodes,
    onToggleHistory: flowState.toggleHistoryPanel
  });

  // ============================================================================
  // NODE ACTIONS
  // ============================================================================
  
  const handleDeleteNode = useCallback((nodeId: string) => {
    flowState.removeNode(nodeId);
    // Clear selection if the deleted node was selected
    if (flowState.selectedNodeId === nodeId) {
      flowState.clearSelection();
    }
  }, [flowState]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = flowState.nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    // Create a new node with a unique ID and offset position
    const newId = `${nodeId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newNode = {
      ...nodeToDuplicate,
      id: newId,
      position: { 
        x: nodeToDuplicate.position.x + 40, 
        y: nodeToDuplicate.position.y + 40 
      },
      selected: false,
      data: { ...nodeToDuplicate.data }
    } as AgenNode;

    flowState.addNode(newNode);
    
    // Select the new duplicated node
    flowState.selectNode(newId);
  }, [flowState]);

  // ============================================================================
  // UNDO/REDO HANDLERS
  // ============================================================================
  
  const handleHistoryChange = useCallback((history: ActionHistoryEntry[], currentIndex: number) => {
    setActionHistory(history);
    setHistoryIndex(currentIndex);
  }, []);

  const handleNodesChangeWithHistory = useCallback((newNodes: Node[]) => {
    flowState.setNodes(newNodes as AgenNode[]);
  }, [flowState]);

  const handleEdgesChangeWithHistory = useCallback((newEdges: Edge[]) => {
    flowState.setEdges(newEdges as AgenEdge[]);
  }, [flowState]);

  // ============================================================================
  // ERROR LOGGING SETUP
  // ============================================================================
  
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      originalError(...args);
      
      // Only log user errors, not React internal errors
      const message = args.join(' ');
      const isReactInternal = message.includes('React') || 
                             message.includes('static flag') || 
                             message.includes('Expected') ||
                             message.includes('Internal React error');
      
      if (flowState.selectedNodeId && !isReactInternal) {
        flowState.logNodeError(flowState.selectedNodeId, message, 'error', 'console.error');
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      
      // Only log user warnings, not React internal warnings
      const message = args.join(' ');
      const isReactInternal = message.includes('React') || 
                             message.includes('Warning:') ||
                             message.includes('validateDOMNesting');
      
      if (flowState.selectedNodeId && !isReactInternal) {
        flowState.logNodeError(flowState.selectedNodeId, message, 'warning', 'console.warn');
      }
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [flowState.selectedNodeId, flowState.logNodeError]);

  // ============================================================================
  // MOUNT EFFECT
  // ============================================================================
  
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <NodeDisplayProvider>
      <UndoRedoProvider>
        <ReactFlowProvider>
        <div className="flex h-full w-full">
          <Sidebar />
          <DebugTool />

          <FlowCanvas
            nodes={flowState.nodes}
            edges={flowState.edges}
            selectedNode={flowState.selectedNode}
            selectedEdge={flowState.selectedEdge}
            selectedOutput={flowState.selectedOutput}
            nodeErrors={flowState.nodeErrors}
            showHistoryPanel={flowState.showHistoryPanel}
            actionHistory={actionHistory}
            historyIndex={historyIndex}
            wrapperRef={wrapperRef}
            updateNodeData={flowState.updateNodeData}
            updateNodeId={flowState.updateNodeId}
            logNodeError={flowState.logNodeError}
            clearNodeErrors={flowState.clearNodeErrors}
            onToggleHistory={flowState.toggleHistoryPanel}
            onDragOver={dragAndDrop.onDragOver}
            onDrop={dragAndDrop.onDrop}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onDeleteEdge={flowState.removeEdge}
            reactFlowHandlers={reactFlowHandlers}
            inspectorLocked={flowState.inspectorLocked}
            setInspectorLocked={flowState.setInspectorLocked}
          />

          {/* UNDO/REDO MANAGER */}
          <UndoRedoManager
            nodes={flowState.nodes}
            edges={flowState.edges}
            onNodesChange={handleNodesChangeWithHistory}
            onEdgesChange={handleEdgesChangeWithHistory}
            onHistoryChange={handleHistoryChange}
            config={{
              maxHistorySize: 100,
              debounceMs: 300,
              enableViewportTracking: false,
              enableAutoSave: true,
              compressionThreshold: 50
            }}
          />
        </div>
        </ReactFlowProvider>
      </UndoRedoProvider>
    </NodeDisplayProvider>
  );
} 