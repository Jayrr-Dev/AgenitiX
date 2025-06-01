/**
 * USE DRAG AND DROP HOOK - Node creation through drag and drop
 *
 * • Handles drag and drop functionality for creating nodes from sidebar
 * • Manages drop target validation and position calculation
 * • Integrates with ReactFlow's coordinate system for precise placement
 * • Validates node types and creates new nodes at drop position
 * • Provides event handlers for drag over and drop interactions
 *
 * Keywords: drag-drop, node-creation, sidebar, ReactFlow, positioning, validation
 */

import { ReactFlowInstance } from "@xyflow/react";
import { useCallback } from "react";
import { createNode, isValidNodeType } from "../../../_temp/nodeFactory";
import type { AgenNode, NodeType } from "../types";

interface DragAndDropProps {
  flowInstance: React.RefObject<ReactFlowInstance<AgenNode, any> | null>;
  wrapperRef: React.RefObject<HTMLDivElement | null>;
  onNodeAdd: (node: AgenNode) => void;
}

export function useDragAndDrop({
  flowInstance,
  wrapperRef,
  onNodeAdd,
}: DragAndDropProps) {
  // ============================================================================
  // DRAG OVER HANDLER
  // ============================================================================

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // ============================================================================
  // DROP HANDLER
  // ============================================================================

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      console.log("Drop event triggered");

      if (!wrapperRef.current || !flowInstance.current) {
        console.log("Missing refs:", {
          wrapper: !!wrapperRef.current,
          flow: !!flowInstance.current,
        });
        return;
      }

      const type = e.dataTransfer.getData("application/reactflow");
      console.log("Drag data type:", type);

      if (!type || !isValidNodeType(type)) {
        console.log(
          "Invalid node type:",
          type,
          "Valid:",
          isValidNodeType(type)
        );
        return;
      }

      // Calculate drop position
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = flowInstance.current.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      console.log("Creating node:", { type, position });

      // Create new node
      const newNode = createNode(type as NodeType, position);
      console.log("Created node:", newNode);
      onNodeAdd(newNode);
    },
    [flowInstance, wrapperRef, onNodeAdd]
  );

  // ============================================================================
  // RETURN HANDLERS
  // ============================================================================

  return {
    onDragOver,
    onDrop,
  };
}
