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

// Import Zustand store
import { useFlowStore } from '../stores/flowStore';

// Import hooks (only the ones we still need)
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useReactFlowHandlers } from './hooks/useReactFlowHandlers';

// Import types
import type { Node, Edge } from '@xyflow/react';
import type { AgenNode, AgenEdge } from './types';
import { getNodeOutput } from './utils/outputUtils';

/**
 * FlowEditor - Main component for the visual flow editor
 * 
 * This component has been refactored to use Zustand for state management,
 * providing a single source of truth and eliminating synchronization issues.
 * 
 * Benefits:
 * - Centralized state management with Zustand
 * - Automatic reactivity across components
 * - No more manual state synchronization
 * - Better performance with optimized re-renders
 * - Easier debugging with Zustand DevTools
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
  const flowInstanceRef = useRef<any>(null);

  // ============================================================================
  // ZUSTAND STORE
  // ============================================================================
  
  const {
    // State
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    showHistoryPanel,
    inspectorLocked,
    nodeErrors,
    _hasHydrated,
    
    // Actions
    updateNodeData,
    addNode,
    removeNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    selectNode,
    selectEdge,
    clearSelection,
    toggleHistoryPanel,
    setInspectorLocked,
    logNodeError,
    clearNodeErrors,
    copySelectedNodes,
    pasteNodes,
    setNodes,
    setEdges,
    forceReset,
  } = useFlowStore();

  // ============================================================================
  // DERIVED STATE
  // ============================================================================
  
  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find(e => e.id === selectedEdgeId) || null : null;
  const selectedOutput = selectedNode ? getNodeOutput(selectedNode, nodes, edges) : null;
  const errors = selectedNodeId ? nodeErrors[selectedNodeId] || [] : [];

  // Sync ReactFlow's selection system with our custom selection state
  const nodesWithSelection = nodes.map(node => ({
    ...node,
    selected: node.id === selectedNodeId
  }));

  const edgesWithSelection = edges.map(edge => ({
    ...edge,
    selected: edge.id === selectedEdgeId
  }));

  // ============================================================================
  // UNDO/REDO STATE (keeping for now, can be moved to Zustand later)
  // ============================================================================
  
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // REACTFLOW HANDLERS
  // ============================================================================
  
  // Wrapper functions to match useReactFlowHandlers interface
  const setNodesWrapper = useCallback((nodesOrFn: AgenNode[] | ((prev: AgenNode[]) => AgenNode[])) => {
    if (typeof nodesOrFn === 'function') {
      setNodes(nodesOrFn(nodes));
    } else {
      setNodes(nodesOrFn);
    }
  }, [nodes, setNodes]);

  const setEdgesWrapper = useCallback((edgesOrFn: AgenEdge[] | ((prev: AgenEdge[]) => AgenEdge[])) => {
    if (typeof edgesOrFn === 'function') {
      setEdges(edgesOrFn(edges));
    } else {
      setEdges(edgesOrFn);
    }
  }, [edges, setEdges]);
  
  // Get the color-coded connection handlers from useReactFlowHandlers
  const { 
    onConnect: colorCodedOnConnect,
    onReconnectStart,
    onReconnect,
    onReconnectEnd
  } = useReactFlowHandlers({
    nodes,
    edges,
    setNodes: setNodesWrapper,
    setEdges: setEdgesWrapper,
    onSelectionChange: selectNode,
    onEdgeSelectionChange: selectEdge
  });

  // Original handlers for nodes and edges to preserve drag and drop
  const handleNodesChange = useCallback((changes: any[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateNodePosition(change.id, change.position);
      } else if (change.type === 'remove') {
        removeNode(change.id);
      } else if (change.type === 'select') {
        if (change.selected) {
          selectNode(change.id);
        }
      }
    });
  }, [updateNodePosition, removeNode, selectNode]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    changes.forEach(change => {
      if (change.type === 'remove') {
        removeEdge(change.id);
      } else if (change.type === 'select') {
        if (change.selected) {
          selectEdge(change.id);
        }
      }
    });
  }, [removeEdge, selectEdge]);

  const handleSelectionChange = useCallback((selection: any) => {
    if (selection.nodes.length > 0) {
      selectNode(selection.nodes[0].id);
    } else if (selection.edges.length > 0) {
      selectEdge(selection.edges[0].id);
    } else {
      clearSelection();
    }
  }, [selectNode, selectEdge, clearSelection]);

  const handleInit = useCallback((instance: any) => {
    flowInstanceRef.current = instance;
  }, []);

  // Combine handlers - use color-coded handlers from useReactFlowHandlers but original node/edge change handlers
  const reactFlowHandlers = {
    onConnect: colorCodedOnConnect, // Color-coded from useReactFlowHandlers
    onReconnectStart, // From useReactFlowHandlers for edge dragging
    onReconnect, // From useReactFlowHandlers for edge reconnection
    onReconnectEnd, // From useReactFlowHandlers for edge disconnection
    onNodesChange: handleNodesChange, // Original to preserve drag and drop
    onEdgesChange: handleEdgesChange, // Original to preserve drag and drop
    onSelectionChange: handleSelectionChange,
    onInit: handleInit,
  };

  // ============================================================================
  // DRAG AND DROP
  // ============================================================================
  
  const dragAndDrop = useDragAndDrop({
    flowInstance: flowInstanceRef,
    wrapperRef,
    onNodeAdd: addNode
  });

  // ============================================================================
  // NODE ACTIONS
  // ============================================================================
  
  const handleDeleteNode = useCallback((nodeId: string) => {
    removeNode(nodeId);
    // Clear selection if the deleted node was selected
    if (selectedNodeId === nodeId) {
      clearSelection();
    }
  }, [removeNode, selectedNodeId, clearSelection]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
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

    addNode(newNode);
    
    // Select the new duplicated node
    selectNode(newId);
  }, [nodes, addNode, selectNode]);

  const handleUpdateNodeId = useCallback((oldId: string, newId: string) => {
    // For now, we'll keep the old ID (this feature can be implemented later if needed)
    console.log('Update node ID not implemented yet:', oldId, newId);
  }, []);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  // Using ReactFlow's built-in delete functionality (deleteKeyCode prop)
  // instead of custom delete handlers for better reliability
  useKeyboardShortcuts({
    onCopy: copySelectedNodes,
    onPaste: pasteNodes,
    onToggleHistory: toggleHistoryPanel
    // Removed onDelete - using ReactFlow's built-in delete functionality
  });

  // ============================================================================
  // UNDO/REDO HANDLERS
  // ============================================================================
  
  const handleHistoryChange = useCallback((history: ActionHistoryEntry[], currentIndex: number) => {
    setActionHistory(history);
    setHistoryIndex(currentIndex);
  }, []);

  const handleNodesChangeWithHistory = useCallback((newNodes: Node[]) => {
    setNodes(newNodes as AgenNode[]);
  }, [setNodes]);

  const handleEdgesChangeWithHistory = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges as AgenEdge[]);
  }, [setEdges]);

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
      
      if (selectedNodeId && !isReactInternal) {
        logNodeError(selectedNodeId, message, 'error', 'console.error');
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      
      // Only log user warnings, not React internal warnings
      const message = args.join(' ');
      const isReactInternal = message.includes('React') || 
                             message.includes('Warning:') ||
                             message.includes('validateDOMNesting');
      
      if (selectedNodeId && !isReactInternal) {
        logNodeError(selectedNodeId, message, 'warning', 'console.warn');
      }
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [selectedNodeId]);

  // ============================================================================
  // MOUNT EFFECT
  // ============================================================================
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  if (!mounted || !_hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">
          {!mounted ? 'Loading Flow Editor...' : 'Loading saved data...'}
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <UndoRedoProvider>
        <NodeDisplayProvider>
          <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
            {/* SIDEBAR */}
            <Sidebar />
            
            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col">
              {/* UNDO/REDO TOOLBAR */}
              <UndoRedoManager
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChangeWithHistory}
                onEdgesChange={handleEdgesChangeWithHistory}
                onHistoryChange={handleHistoryChange}
              />
              
              {/* FLOW CANVAS */}
              <FlowCanvas
                nodes={nodesWithSelection}
                edges={edgesWithSelection}
                selectedNode={selectedNode}
                selectedEdge={selectedEdge}
                selectedOutput={selectedOutput}
                nodeErrors={nodeErrors}
                showHistoryPanel={showHistoryPanel}
                actionHistory={actionHistory}
                historyIndex={historyIndex}
                wrapperRef={wrapperRef}
                updateNodeData={updateNodeData}
                updateNodeId={handleUpdateNodeId}
                logNodeError={logNodeError}
                clearNodeErrors={clearNodeErrors}
                onToggleHistory={toggleHistoryPanel}
                onDragOver={dragAndDrop.onDragOver}
                onDrop={dragAndDrop.onDrop}
                onDeleteNode={handleDeleteNode}
                onDuplicateNode={handleDuplicateNode}
                onDeleteEdge={removeEdge}
                inspectorLocked={inspectorLocked}
                setInspectorLocked={setInspectorLocked}
                reactFlowHandlers={reactFlowHandlers}
              />
              
              {/* DEBUG TOOL */}
              <DebugTool />
            </div>
          </div>
        </NodeDisplayProvider>
      </UndoRedoProvider>
    </ReactFlowProvider>
  );
} 