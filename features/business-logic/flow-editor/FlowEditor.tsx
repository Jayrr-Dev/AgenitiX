'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactFlowProvider, applyNodeChanges, applyEdgeChanges, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Import components
import Sidebar, { SidebarRef } from '../components/Sidebar';
import DebugTool from '../components/DebugTool';
import UndoRedoManager, { ActionHistoryEntry } from '../components/UndoRedoManager';
import { UndoRedoProvider } from '../components/UndoRedoContext';
import { FlowCanvas } from './components/FlowCanvas';
import { NodeDisplayProvider } from './contexts/NodeDisplayContext';

// Import Zustand store
import { useFlowStore } from '../stores/flowStore';
import { useVibeModeStore } from '../stores/vibeModeStore';

// Import hooks (only the ones we still need)
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useReactFlowHandlers } from './hooks/useReactFlowHandlers';
import { useMultiSelectionCopyPaste } from './hooks/useMultiSelectionCopyPaste';

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
  const { _hasHydrated } = useFlowStore();

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
          <FlowEditorContent />
        </NodeDisplayProvider>
      </UndoRedoProvider>
    </ReactFlowProvider>
  );
}

/**
 * FlowEditorContent - The main flow editor logic that runs inside ReactFlow context
 */
function FlowEditorContent() {
  // ============================================================================
  // REFS
  // ============================================================================
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const flowInstanceRef = useRef<any>(null);
  const sidebarRef = useRef<SidebarRef>(null);

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

  // ============================================================================
  // UNDO/REDO STATE (keeping for now, can be moved to Zustand later)
  // ============================================================================
  
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================================================
  // MULTI-SELECTION COPY/PASTE (Now inside ReactFlow context)
  // ============================================================================
  
  const multiSelectionCopyPaste = useMultiSelectionCopyPaste();

  // Install mouse tracking for smart paste positioning
  useEffect(() => {
    return multiSelectionCopyPaste.installMouseTracking();
  }, [multiSelectionCopyPaste.installMouseTracking]);

  // ============================================================================
  // MULTI-SELECTION DELETE
  // ============================================================================
  
  const handleMultiDelete = useCallback(() => {
    // Get all selected nodes and edges
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    // Remove selected nodes from Zustand store
    selectedNodes.forEach(node => {
      removeNode(node.id);
    });
    
    // Remove selected edges from Zustand store
    selectedEdges.forEach(edge => {
      removeEdge(edge.id);
    });
    
    console.log(`Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges`);
  }, [nodes, edges, removeNode, removeEdge]);

  // ============================================================================
  // VIBE MODE
  // ============================================================================
  
  const { toggleVibeMode } = useVibeModeStore();

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

  // ============================================================================
  // REACTFLOW CHANGE HANDLERS
  // ============================================================================
  
  /**
   * Handle node changes from ReactFlow
   * 
   * This function creates a deep copy of nodes before applying changes to avoid
   * read-only property errors caused by Zustand's immer middleware. The immer
   * middleware creates immutable objects, and ReactFlow's applyNodeChanges tries
   * to directly mutate properties like 'width', 'height', etc.
   */
  const handleNodesChange = useCallback((changes: any[]) => {
    // Create a deep copy of nodes to avoid read-only property issues with Zustand immer
    // Using JSON serialization for a clean deep copy that preserves all properties
    const nodesCopy = JSON.parse(JSON.stringify(nodes)) as AgenNode[];

    // Apply changes to ReactFlow's nodes array first
    const updatedNodes = applyNodeChanges(changes, nodesCopy);
    setNodes(updatedNodes);
    
    // Also update our Zustand store for specific operations
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
  }, [nodes, setNodes, updateNodePosition, removeNode, selectNode]);

  /**
   * Handle edge changes from ReactFlow
   * 
   * Similar to handleNodesChange, this creates a deep copy to avoid
   * immutability issues with Zustand's immer middleware.
   */
  const handleEdgesChange = useCallback((changes: any[]) => {
    // Create a deep copy of edges to avoid read-only property issues with Zustand immer
    const edgesCopy = JSON.parse(JSON.stringify(edges)) as AgenEdge[];
    
    // Apply changes to ReactFlow's edges array first
    const updatedEdges = applyEdgeChanges(changes, edgesCopy);
    setEdges(updatedEdges);
    
    // Also update our Zustand store for specific operations
    changes.forEach(change => {
      if (change.type === 'remove') {
        removeEdge(change.id);
      } else if (change.type === 'select') {
        if (change.selected) {
          selectEdge(change.id);
        }
      }
    });
  }, [edges, setEdges, removeEdge, selectEdge]);

  /**
   * Handle selection changes in ReactFlow
   * 
   * Updates the Zustand store when nodes or edges are selected/deselected
   */
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
  
  // SELECT ALL NODES HANDLER (Ctrl+A)
  const handleSelectAllNodes = useCallback(() => {
    // Get ReactFlow instance to access and modify node selection
    const reactFlowInstance = flowInstanceRef.current;
    if (!reactFlowInstance) {
      console.warn(`⚠️ ReactFlow instance not available`);
      return;
    }

    // Get all nodes in the canvas
    const allNodes = nodes;
    
    if (allNodes.length === 0) {
      console.log(`⚠️ No nodes available to select`);
      return;
    }

    console.log(`🎯 Selecting all ${allNodes.length} nodes (Ctrl+A)`);

    // Update all nodes to be selected
    const updatedNodes = allNodes.map(node => ({
      ...node,
      selected: true
    }));

    // Apply the selection changes
    setNodes(updatedNodes);
    
    // Clear edge selection
    const updatedEdges = edges.map(edge => ({
      ...edge,
      selected: false
    }));
    setEdges(updatedEdges);
  }, [nodes, edges, setNodes, setEdges]);
  
  // CLEAR SELECTION HANDLER (Esc)
  const handleClearSelection = useCallback(() => {
    // Count currently selected items for feedback
    const selectedNodes = nodes.filter(node => node.selected);
    const selectedEdges = edges.filter(edge => edge.selected);
    const totalSelected = selectedNodes.length + selectedEdges.length;
    
    if (totalSelected === 0) {
      console.log(`⚠️ No items selected to clear`);
      return;
    }

    console.log(`🔄 Clearing selection of ${selectedNodes.length} nodes and ${selectedEdges.length} edges (Esc)`);

    // Clear selection on all nodes
    const updatedNodes = nodes.map(node => ({
      ...node,
      selected: false
    }));
    setNodes(updatedNodes);
    
    // Clear selection on all edges
    const updatedEdges = edges.map(edge => ({
      ...edge,
      selected: false
    }));
    setEdges(updatedEdges);
    
    // Also clear the Zustand store selection
    clearSelection();
  }, [nodes, edges, setNodes, setEdges, clearSelection]);
  
  // INSPECTOR LOCK TOGGLE HANDLER (Alt+A)
  const handleToggleInspectorLock = useCallback(() => {
    setInspectorLocked(!inspectorLocked);
    console.log(`🔒 Inspector ${!inspectorLocked ? 'locked' : 'unlocked'} (Alt+A)`);
  }, [inspectorLocked, setInspectorLocked]);
  
  // NODE DUPLICATION HANDLER (Alt+W) - Multi-selection aware
  const handleDuplicateSelectedNode = useCallback(() => {
    // Get ReactFlow instance to access selected nodes
    const reactFlowInstance = flowInstanceRef.current;
    if (!reactFlowInstance) {
      console.warn(`⚠️ ReactFlow instance not available`);
      return;
    }

    // Get all currently selected nodes from ReactFlow
    const selectedNodes = nodes.filter(node => node.selected);
    
    if (selectedNodes.length === 0) {
      console.log(`⚠️ No nodes selected to duplicate`);
      return;
    }

    console.log(`📋 Duplicating ${selectedNodes.length} selected node(s) (Alt+W)`);

    // Create duplicates with proper positioning
    const duplicatedNodes = selectedNodes.map((nodeToDuplicate, index) => {
      const newId = `${nodeToDuplicate.id}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      
      // Offset each duplicate slightly to avoid stacking
      const offsetX = 40 + (index * 10); // Slight stagger for multiple nodes
      const offsetY = 40 + (index * 10);
      
      return {
        ...nodeToDuplicate,
        id: newId,
        position: { 
          x: nodeToDuplicate.position.x + offsetX, 
          y: nodeToDuplicate.position.y + offsetY 
        },
        selected: false, // Start unselected
        data: { ...nodeToDuplicate.data }
      } as AgenNode;
    });

    // Add all duplicated nodes to the store
    duplicatedNodes.forEach(newNode => {
      addNode(newNode);
    });
    
    // Clear current selection and select the first duplicated node for feedback
    clearSelection();
    if (duplicatedNodes.length > 0) {
      selectNode(duplicatedNodes[0].id);
    }
  }, [nodes, addNode, selectNode, clearSelection]);
  
  // SIDEBAR TOGGLE HANDLER (Alt+S) - Connected to sidebar ref
  const handleToggleSidebar = useCallback(() => {
    if (sidebarRef.current) {
      sidebarRef.current.toggle();
      console.log(`📋 Sidebar toggled (Alt+S)`);
    } else {
      console.warn(`⚠️ Sidebar ref not available`);
    }
  }, []);
  
  // Using ReactFlow's built-in delete functionality (deleteKeyCode prop) for Delete/Backspace
  // and custom Alt+Q for bulk delete operations
  useKeyboardShortcuts({
    onCopy: multiSelectionCopyPaste.copySelectedElements,
    onPaste: multiSelectionCopyPaste.pasteElements,
    onDelete: handleMultiDelete, // Alt+Q for deletion
    onToggleHistory: toggleHistoryPanel,
    onToggleVibeMode: toggleVibeMode, // Ctrl+X for vibe mode toggle
    onToggleInspectorLock: handleToggleInspectorLock, // Alt+A for inspector lock
    onDuplicateNode: handleDuplicateSelectedNode, // Alt+W for node duplication
    onToggleSidebar: handleToggleSidebar, // Alt+S for sidebar toggle
    onSelectAll: handleSelectAllNodes, // Ctrl+A for selecting all nodes
    onClearSelection: handleClearSelection // Esc for clearing selection
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

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* SIDEBAR */}
      <Sidebar ref={sidebarRef} />
      
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
          nodes={nodes}
          edges={edges}
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
  );
} 