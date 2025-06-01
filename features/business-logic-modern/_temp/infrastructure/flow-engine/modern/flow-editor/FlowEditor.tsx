'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// COMPONENT IMPORTS - Fixed paths for modern system
import Sidebar, { SidebarRef } from '../../../components/modern/components/Sidebar';
import DebugTool from '../../../components/modern/components/DebugTool';
import UndoRedoManager, { ActionHistoryEntry } from '../../../components/modern/components/UndoRedoManager';
import { UndoRedoProvider } from '../../../components/modern/components/UndoRedoContext';
import { FlowCanvas } from './components/FlowCanvas';
import { NodeDisplayProvider } from './contexts/NodeDisplayContext';

// STORE IMPORTS - Fixed paths for modern system
import { useFlowStore } from '../../../theming/modern/stores/flowStore';
import { useVibeModeStore } from '../../../theming/modern/stores/vibeModeStore';

// HOOK IMPORTS
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useReactFlowHandlers } from './hooks/useReactFlowHandlers';
import { useMultiSelectionCopyPaste } from './hooks/useMultiSelectionCopyPaste';
import { useFlowEditorState } from './hooks/useFlowEditorState';

// TYPE IMPORTS
import type { Node, Edge } from '@xyflow/react';
import type { AgenNode, AgenEdge } from './types';
import { getNodeOutput } from './utils/outputUtils';

// UTILITY IMPORTS
import { syncNodeTypeConfigWithRegistry } from './constants';

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

interface FlowEditorHandlers {
  handleNodesChange: (changes: any[]) => void;
  handleEdgesChange: (changes: any[]) => void;
  handleSelectionChange: (selection: any) => void;
  handleInit: (instance: any) => void;
  handleDeleteNode: (nodeId: string) => void;
  handleDuplicateNode: (nodeId: string) => void;
  handleUpdateNodeId: (oldId: string, newId: string) => void;
}

interface KeyboardShortcutHandlers {
  handleSelectAllNodes: () => void;
  handleClearSelection: () => void;
  handleToggleInspectorLock: () => void;
  handleDuplicateSelectedNode: () => void;
  handleToggleSidebar: () => void;
  handleMultiDelete: () => void;
}

interface ZustandActions {
  setNodes: (nodes: AgenNode[]) => void;
  setEdges: (edges: AgenEdge[]) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  removeNode: (id: string) => void;
  removeEdge: (id: string) => void;
  selectNode: (id: string) => void;
  selectEdge: (id: string) => void;
  clearSelection: () => void;
  addNode: (node: AgenNode) => void;
  setInspectorLocked: (locked: boolean) => void;
}

// ============================================================================
// LOADING COMPONENT
// ============================================================================

/**
 * Loading screen component with proper hydration handling
 */
function FlowEditorLoading({ mounted, hasHydrated }: { mounted: boolean; hasHydrated: boolean }) {
  const loadingMessage = !mounted ? 'Loading Flow Editor...' : 'Loading saved data...';
  
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg">{loadingMessage}</div>
    </div>
  );
}

// ============================================================================
// ERROR LOGGING HOOK
// ============================================================================

/**
 * Custom hook for setting up error logging with proper cleanup
 */
function useErrorLogging(
  selectedNodeId: string | null, 
  logNodeError: (nodeId: string, message: string, type?: 'error' | 'warning' | 'info', source?: string) => void
) {
  useEffect(() => {
    // Store original console methods for restoration
    const originalError = console.error;
    const originalWarn = console.warn;

    // Helper function to check if error is from React internals
    const isReactInternalError = (message: string): boolean => {
      return message.includes('React') || 
             message.includes('static flag') || 
             message.includes('Expected') ||
             message.includes('Internal React error');
    };

    // Helper function to check if warning is from React internals
    const isReactInternalWarning = (message: string): boolean => {
      return message.includes('React') || 
             message.includes('Warning:') ||
             message.includes('validateDOMNesting');
    };

    // Override console.error for user error tracking
    console.error = (...args) => {
      originalError(...args);
      
      const message = args.join(' ');
      const isUserError = !isReactInternalError(message);
      
      if (selectedNodeId && isUserError) {
        logNodeError(selectedNodeId, message, 'error', 'console.error');
      }
    };

    // Override console.warn for user warning tracking
    console.warn = (...args) => {
      originalWarn(...args);
      
      const message = args.join(' ');
      const isUserWarning = !isReactInternalWarning(message);
      
      if (selectedNodeId && isUserWarning) {
        logNodeError(selectedNodeId, message, 'warning', 'console.warn');
      }
    };

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [selectedNodeId, logNodeError]);
}

// ============================================================================
// FLOW EDITOR HANDLERS HOOK
// ============================================================================

/**
 * Custom hook for managing ReactFlow event handlers with proper typing
 */
function useFlowEditorHandlers(
  nodes: AgenNode[],
  edges: AgenEdge[],
  flowInstanceRef: React.MutableRefObject<any>,
  zustandActions: ZustandActions
): FlowEditorHandlers {
  
  const { 
    setNodes, 
    setEdges, 
    updateNodePosition, 
    removeNode, 
    removeEdge, 
    selectNode, 
    selectEdge, 
    clearSelection, 
    addNode 
  } = zustandActions;

  // REACTFLOW CHANGE HANDLERS
  const handleNodesChange = useCallback((changes: any[]) => {
    // Create deep copy to avoid read-only property issues with Zustand immer
    const nodesCopy = JSON.parse(JSON.stringify(nodes)) as AgenNode[];
    const updatedNodes = require('@xyflow/react').applyNodeChanges(changes, nodesCopy);
    setNodes(updatedNodes);
    
    // Update Zustand store for specific operations
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateNodePosition(change.id, change.position);
      } else if (change.type === 'remove') {
        removeNode(change.id);
      } else if (change.type === 'select' && change.selected) {
        selectNode(change.id);
      }
    });
  }, [nodes, setNodes, updateNodePosition, removeNode, selectNode]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    // Create deep copy to avoid read-only property issues with Zustand immer
    const edgesCopy = JSON.parse(JSON.stringify(edges)) as AgenEdge[];
    const updatedEdges = require('@xyflow/react').applyEdgeChanges(changes, edgesCopy);
    setEdges(updatedEdges);
    
    // Update Zustand store for specific operations
    changes.forEach(change => {
      if (change.type === 'remove') {
        removeEdge(change.id);
      } else if (change.type === 'select' && change.selected) {
        selectEdge(change.id);
      }
    });
  }, [edges, setEdges, removeEdge, selectEdge]);

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

  // NODE ACTION HANDLERS
  const handleDeleteNode = useCallback((nodeId: string) => {
    removeNode(nodeId);
    // Clear selection if the deleted node was selected
    const currentSelectedId = nodes.find(n => n.selected)?.id;
    if (currentSelectedId === nodeId) {
      clearSelection();
    }
  }, [removeNode, nodes, clearSelection]);

  const handleDuplicateNode = useCallback((nodeId: string) => {
    const nodeToDuplicate = nodes.find(n => n.id === nodeId);
    if (!nodeToDuplicate) return;

    // Helper function to generate unique node ID
    const generateUniqueId = (originalId: string): string => {
      return `${originalId}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    };

    // Helper function to calculate offset position
    const calculateOffset = (originalPosition: { x: number; y: number }): { x: number; y: number } => {
      return {
        x: originalPosition.x + 40,
        y: originalPosition.y + 40
      };
    };

    // Create duplicated node
    const newId = generateUniqueId(nodeId);
    const offsetPosition = calculateOffset(nodeToDuplicate.position);
    
    const newNode = {
      ...nodeToDuplicate,
      id: newId,
      position: offsetPosition,
      selected: false,
      data: { ...nodeToDuplicate.data }
    } as AgenNode;

    addNode(newNode);
    selectNode(newId);
  }, [nodes, addNode, selectNode]);

  const handleUpdateNodeId = useCallback((oldId: string, newId: string) => {
    // Feature not implemented yet - keeping placeholder for future development
    console.log('Update node ID not implemented yet:', oldId, newId);
  }, []);
  return {
    handleNodesChange,
    handleEdgesChange,
    handleSelectionChange,
    handleInit,
    handleDeleteNode,
    handleDuplicateNode,
    handleUpdateNodeId,
  };
}

// ============================================================================
// KEYBOARD SHORTCUT HANDLERS HOOK
// ============================================================================

/**
 * Custom hook for managing keyboard shortcut handlers with proper separation of concerns
 */
function useKeyboardShortcutHandlers(
  nodes: AgenNode[],
  edges: AgenEdge[],
  sidebarRef: React.RefObject<SidebarRef | null>,
  zustandActions: ZustandActions,
  inspectorLocked: boolean
): KeyboardShortcutHandlers {

  const { 
    setNodes, 
    setEdges, 
    removeNode, 
    removeEdge, 
    addNode, 
    selectNode, 
    clearSelection, 
    setInspectorLocked 
  } = zustandActions;

  // HELPER FUNCTIONS FOR NODE/EDGE OPERATIONS
  const selectAllNodes = useCallback((nodeList: AgenNode[]): AgenNode[] => {
    return nodeList.map(node => ({ ...node, selected: true }));
  }, []);

  const deselectAllNodes = useCallback((nodeList: AgenNode[]): AgenNode[] => {
    return nodeList.map(node => ({ ...node, selected: false }));
  }, []);

  const deselectAllEdges = useCallback((edgeList: AgenEdge[]): AgenEdge[] => {
    return edgeList.map(edge => ({ ...edge, selected: false }));
  }, []);

  const getSelectedNodes = useCallback((nodeList: AgenNode[]): AgenNode[] => {
    return nodeList.filter(node => node.selected);
  }, []);

  const getSelectedEdges = useCallback((edgeList: AgenEdge[]): AgenEdge[] => {
    return edgeList.filter(edge => edge.selected);
  }, []);

  // SELECT ALL NODES HANDLER (Ctrl+A)
  const handleSelectAllNodes = useCallback(() => {
    if (nodes.length === 0) {
      console.log('⚠️ No nodes available to select');
      return;
    }

    console.log(`🎯 Selecting all ${nodes.length} nodes (Ctrl+A)`);
    const updatedNodes = selectAllNodes(nodes);
    const updatedEdges = deselectAllEdges(edges);
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
  }, [nodes, edges, setNodes, setEdges, selectAllNodes, deselectAllEdges]);
  
  // CLEAR SELECTION HANDLER (Esc)
  const handleClearSelection = useCallback(() => {
    const selectedNodes = getSelectedNodes(nodes);
    const selectedEdges = getSelectedEdges(edges);
    const totalSelected = selectedNodes.length + selectedEdges.length;
    
    if (totalSelected === 0) {
      console.log('⚠️ No items selected to clear');
      return;
    }

    console.log(`🔄 Clearing selection of ${selectedNodes.length} nodes and ${selectedEdges.length} edges (Esc)`);
    const updatedNodes = deselectAllNodes(nodes);
    const updatedEdges = deselectAllEdges(edges);
    
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    clearSelection();
  }, [nodes, edges, setNodes, setEdges, clearSelection, getSelectedNodes, getSelectedEdges, deselectAllNodes, deselectAllEdges]);
  
  // INSPECTOR LOCK TOGGLE HANDLER (Alt+A)
  const handleToggleInspectorLock = useCallback(() => {
    const newLockState = !inspectorLocked;
    setInspectorLocked(newLockState);
    console.log(`🔒 Inspector ${newLockState ? 'locked' : 'unlocked'} (Alt+A)`);
  }, [inspectorLocked, setInspectorLocked]);
  
  // NODE DUPLICATION HANDLER (Alt+W)
  const handleDuplicateSelectedNode = useCallback(() => {
    const selectedNodes = getSelectedNodes(nodes);
    
    if (selectedNodes.length === 0) {
      console.log('⚠️ No nodes selected to duplicate');
      return;
    }

    console.log(`📋 Duplicating ${selectedNodes.length} selected node(s) (Alt+W)`);

    // Helper function to create duplicated nodes
    const createDuplicatedNodes = (selectedNodeList: AgenNode[]): AgenNode[] => {
      return selectedNodeList.map((nodeToDuplicate, index) => {
        const newId = `${nodeToDuplicate.id}-copy-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        // Stagger multiple duplicates slightly
        const offsetX = 40 + (index * 10);
        const offsetY = 40 + (index * 10);
        const newPosition = {
          x: nodeToDuplicate.position.x + offsetX,
          y: nodeToDuplicate.position.y + offsetY
        };
        
        return {
          ...nodeToDuplicate,
          id: newId,
          position: newPosition,
          selected: false,
          data: { ...nodeToDuplicate.data }
        } as AgenNode;
      });
    };

    const duplicatedNodes = createDuplicatedNodes(selectedNodes);
    
    // Add all duplicated nodes
    duplicatedNodes.forEach(newNode => addNode(newNode));
    
    // Select first duplicated node for feedback
    clearSelection();
    if (duplicatedNodes.length > 0) {
      selectNode(duplicatedNodes[0].id);
    }
  }, [nodes, addNode, selectNode, clearSelection, getSelectedNodes]);
  
  // SIDEBAR TOGGLE HANDLER (Alt+S)
  const handleToggleSidebar = useCallback(() => {
    if (sidebarRef.current) {
      sidebarRef.current.toggle();
      console.log('📋 Sidebar toggled (Alt+S)');
    } else {
      console.warn('⚠️ Sidebar ref not available');
    }
  }, [sidebarRef]);
  
  // MULTI-SELECTION DELETE HANDLER (Alt+Q)
  const handleMultiDelete = useCallback(() => {
    const selectedNodes = getSelectedNodes(nodes);
    const selectedEdges = getSelectedEdges(edges);
    
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
    
    // Remove selected items
    selectedNodes.forEach(node => removeNode(node.id));
    selectedEdges.forEach(edge => removeEdge(edge.id));
    
    console.log(`Deleted ${selectedNodes.length} nodes and ${selectedEdges.length} edges`);
  }, [nodes, edges, removeNode, removeEdge, getSelectedNodes, getSelectedEdges]);

  return {
    handleSelectAllNodes,
    handleClearSelection,
    handleToggleInspectorLock,
    handleDuplicateSelectedNode,
    handleToggleSidebar,
    handleMultiDelete,
  };
}

// ============================================================================
// FLOW EDITOR CONTENT COMPONENT
// ============================================================================

/**
 * FlowEditorContent - Main flow editor logic within ReactFlow context
 * 
 * This component orchestrates all the flow editor functionality using
 * custom hooks for better separation of concerns and maintainability.
 */
function FlowEditorContent() {
  // ============================================================================
  // REFS
  // ============================================================================
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const flowInstanceRef = useRef<any>(null);
  const sidebarRef = useRef<SidebarRef>(null);

  // ============================================================================
  // ZUSTAND STORE STATE
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
  // CUSTOM HOOKS
  // ============================================================================
  
  // Use existing flow editor state hook (removed duplicate)
  const flowEditorState = useFlowEditorState();
  
  // Create local state for action history (since it's not in the main hook)
  const [actionHistory, setActionHistory] = useState<ActionHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Zustand actions for handlers
  const zustandActions: ZustandActions = {
    setNodes,
    setEdges,
    updateNodePosition,
    removeNode,
    removeEdge,
    selectNode,
    selectEdge,
    clearSelection,
    addNode,
    setInspectorLocked,
  };

  // Flow editor handlers
  const flowHandlers = useFlowEditorHandlers(nodes, edges, flowInstanceRef, zustandActions);

  // Keyboard shortcut handlers
  const keyboardHandlers = useKeyboardShortcutHandlers(
    nodes, 
    edges, 
    sidebarRef, 
    zustandActions,
    inspectorLocked
  );

  // Multi-selection copy/paste functionality
  const multiSelectionCopyPaste = useMultiSelectionCopyPaste();

  // Drag and drop functionality
  const dragAndDrop = useDragAndDrop({
    flowInstance: flowInstanceRef,
    wrapperRef,
    onNodeAdd: addNode
  });

  // Error logging setup
  useErrorLogging(selectedNodeId, logNodeError);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================
  
  const selectedNode = selectedNodeId ? nodes.find((n: AgenNode) => n.id === selectedNodeId) || null : null;
  const selectedEdge = selectedEdgeId ? edges.find((e: AgenEdge) => e.id === selectedEdgeId) || null : null;
  const selectedOutput = selectedNode ? getNodeOutput(selectedNode, nodes, edges) : null;

  // ============================================================================
  // VIBE MODE
  // ============================================================================
  
  const { toggleVibeMode } = useVibeModeStore();

  // ============================================================================
  // REACTFLOW HANDLERS SETUP
  // ============================================================================
  
  // Wrapper functions for ReactFlow handlers
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
  
  // Get color-coded connection handlers
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

  // Combine handlers for FlowCanvas
  const reactFlowHandlers = {
    onConnect: colorCodedOnConnect,
    onReconnectStart,
    onReconnect,
    onReconnectEnd,
    onNodesChange: flowHandlers.handleNodesChange,
    onEdgesChange: flowHandlers.handleEdgesChange,
    onSelectionChange: flowHandlers.handleSelectionChange,
    onInit: flowHandlers.handleInit,
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS SETUP
  // ============================================================================
  
  useKeyboardShortcuts({
    onCopy: multiSelectionCopyPaste.copySelectedElements,
    onPaste: multiSelectionCopyPaste.pasteElements,
    onDelete: keyboardHandlers.handleMultiDelete,
    onToggleHistory: toggleHistoryPanel,
    onToggleVibeMode: toggleVibeMode,
    onToggleInspectorLock: keyboardHandlers.handleToggleInspectorLock,
    onDuplicateNode: keyboardHandlers.handleDuplicateSelectedNode,
    onToggleSidebar: keyboardHandlers.handleToggleSidebar,
    onSelectAll: keyboardHandlers.handleSelectAllNodes,
    onClearSelection: keyboardHandlers.handleClearSelection
  });

  // ============================================================================
  // MOUSE TRACKING FOR PASTE POSITIONING
  // ============================================================================
  
  useEffect(() => {
    return multiSelectionCopyPaste.installMouseTracking();
  }, [multiSelectionCopyPaste.installMouseTracking]);

  // ============================================================================
  // UNDO/REDO HANDLERS
  // ============================================================================
  
  const handleHistoryChange = useCallback((history: ActionHistoryEntry[], currentIndex: number) => {
    // Note: This could be moved to Zustand store in future iterations
  }, []);

  const handleNodesChangeWithHistory = useCallback((newNodes: Node[]) => {
    setNodes(newNodes as AgenNode[]);
  }, [setNodes]);

  const handleEdgesChangeWithHistory = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges as AgenEdge[]);
  }, [setEdges]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* SIDEBAR */}
      <Sidebar ref={sidebarRef} />
      
      {/* DEBUG TOOLS */}
      <DebugTool />
      
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
          updateNodeId={flowHandlers.handleUpdateNodeId}
          logNodeError={logNodeError}
          clearNodeErrors={clearNodeErrors}
          onToggleHistory={toggleHistoryPanel}
          onDragOver={dragAndDrop.onDragOver}
          onDrop={dragAndDrop.onDrop}
          onDeleteNode={flowHandlers.handleDeleteNode}
          onDuplicateNode={flowHandlers.handleDuplicateNode}
          onDeleteEdge={removeEdge}
          inspectorLocked={inspectorLocked}
          setInspectorLocked={setInspectorLocked}
          reactFlowHandlers={reactFlowHandlers}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN FLOW EDITOR COMPONENT
// ============================================================================

/**
 * FlowEditor - Main component for the visual flow editor
 * 
 * Refactored to use Zustand for state management and modular architecture
 * for better maintainability and performance.
 */
export default function FlowEditor() {
  // ============================================================================
  // MOUNT STATE AND HYDRATION
  // ============================================================================
  
  const [mounted, setMounted] = useState(false);
  const { _hasHydrated } = useFlowStore();

  // ============================================================================
  // REGISTRY INITIALIZATION
  // ============================================================================
  
  useEffect(() => {
    const syncSuccess = syncNodeTypeConfigWithRegistry();
    if (!syncSuccess) {
      console.warn('⚠️ [FlowEditor] Registry sync failed - some controls may not appear');
    }
  }, []);

  // ============================================================================
  // MOUNT EFFECT
  // ============================================================================
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // ============================================================================
  // EARLY RETURN FOR LOADING STATE
  // ============================================================================
  
  if (!mounted || !_hasHydrated) {
    return <FlowEditorLoading mounted={mounted} hasHydrated={_hasHydrated} />;
  }

  // ============================================================================
  // RENDER MAIN FLOW EDITOR
  // ============================================================================

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