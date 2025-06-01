import { useCallback, useRef } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../stores/flowStore';

/**
 * Hook for handling multi-selection copy and paste with ReactFlow
 * Provides enhanced copy/paste that works with ReactFlow's native selection
 */
export function useMultiSelectionCopyPaste() {
  const reactFlow = useReactFlow();
  const { pasteNodesAtPosition } = useFlowStore();
  
  // Track mouse position for smart paste positioning
  const mousePositionRef = useRef({ x: 200, y: 200 });

  // Update mouse position tracking
  const updateMousePosition = useCallback((e: MouseEvent) => {
    mousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  // Enhanced copy function that works with ReactFlow's multi-selection
  const copySelectedElements = useCallback(() => {
    const nodes = reactFlow.getNodes();
    const edges = reactFlow.getEdges();
    
    // Find all selected nodes
    const selectedNodes = nodes.filter(node => node.selected);
    if (selectedNodes.length === 0) return;

    // Find selected edges
    const selectedEdges = edges.filter(edge => edge.selected);
    
    // Also include edges between selected nodes (even if edge isn't explicitly selected)
    const selectedNodeIds = new Set(selectedNodes.map(n => n.id));
    const edgesBetweenSelectedNodes = edges.filter(edge => 
      selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target)
    );
    
    // Combine explicitly selected edges with edges between selected nodes
    const allRelevantEdges = [...selectedEdges];
    edgesBetweenSelectedNodes.forEach(edge => {
      if (!allRelevantEdges.find(e => e.id === edge.id)) {
        allRelevantEdges.push(edge);
      }
    });

    // Store in our copy buffer using the store's state
    useFlowStore.setState((state) => ({
      ...state,
      copiedNodes: [...selectedNodes],
      copiedEdges: allRelevantEdges
    }));
    
    console.log(`Copied ${selectedNodes.length} nodes and ${allRelevantEdges.length} edges`);
  }, [reactFlow]);

  // Enhanced paste function that uses mouse position for smart placement
  const pasteElements = useCallback(() => {
    // Convert screen coordinates to flow coordinates
    const flowPosition = reactFlow.screenToFlowPosition({
      x: mousePositionRef.current.x,
      y: mousePositionRef.current.y
    });
    
    // Use the enhanced paste function with position
    pasteNodesAtPosition(flowPosition);
  }, [reactFlow, pasteNodesAtPosition]);

  // Install mouse tracking when component mounts
  const installMouseTracking = useCallback(() => {
    document.addEventListener('mousemove', updateMousePosition);
    return () => document.removeEventListener('mousemove', updateMousePosition);
  }, [updateMousePosition]);

  return {
    copySelectedElements,
    pasteElements,
    installMouseTracking,
  };
} 