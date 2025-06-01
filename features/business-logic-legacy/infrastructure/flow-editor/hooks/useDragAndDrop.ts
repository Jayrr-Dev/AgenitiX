import { useCallback, useRef } from 'react';
import { ReactFlowInstance } from '@xyflow/react';
import type { AgenNode, NodeType } from '../types';
import { createNode, isValidNodeType } from '../utils/nodeFactory';

interface DragAndDropProps {
  flowInstance: React.RefObject<ReactFlowInstance<AgenNode, any> | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onNodeAdd: (node: AgenNode) => void;
}

export function useDragAndDrop({
  flowInstance,
  wrapperRef,
  onNodeAdd
}: DragAndDropProps) {
  // ============================================================================
  // DRAG OVER HANDLER
  // ============================================================================
  
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // ============================================================================
  // DROP HANDLER
  // ============================================================================
  
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    console.log('Drop event triggered');
    
    if (!wrapperRef.current || !flowInstance.current) {
      console.log('Missing refs:', { wrapper: !!wrapperRef.current, flow: !!flowInstance.current });
      return;
    }

    const type = e.dataTransfer.getData('application/reactflow');
    console.log('Drag data type:', type);
    
    if (!type || !isValidNodeType(type)) {
      console.log('Invalid node type:', type, 'Valid:', isValidNodeType(type));
      return;
    }

    // Calculate drop position
    const bounds = wrapperRef.current.getBoundingClientRect();
    const position = flowInstance.current.screenToFlowPosition({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });

    console.log('Creating node:', { type, position });

    // Create new node
    const newNode = createNode(type as NodeType, position);
    console.log('Created node:', newNode);
    onNodeAdd(newNode);
  }, [flowInstance, wrapperRef, onNodeAdd]);

  // ============================================================================
  // RETURN HANDLERS
  // ============================================================================
  
  return {
    onDragOver,
    onDrop
  };
} 