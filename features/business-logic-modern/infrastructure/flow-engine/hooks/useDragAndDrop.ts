/**
 * USE DRAG AND DROP HOOK - Node creation through drag and drop
 *
 * • Handles drag and drop functionality for creating nodes from sidebar
 * • Manages drop target validation and position calculation
 * • Integrates with ReactFlow's coordinate system for precise placement
 * • Uses modern node registry for validation and node creation
 * • Provides event handlers for drag over and drop interactions
 *
 * Keywords: drag-drop, node-creation, sidebar, ReactFlow, positioning, registry
 */

import type { ReactFlowInstance } from "@xyflow/react";
import { useCallback } from "react";

// USE UNIFIED TYPES FROM FLOW ENGINE
import type { AgenNode } from "@infrastructure/flow-engine/types/nodeData";

// USE INTEGRATED JSON REGISTRY + FACTORY SYSTEM
import { NodeFactory } from "@/features/business-logic-modern/infrastructure/node-creation/factory";

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
  // DROP HANDLER - Using Integrated JSON Registry + Factory System
  // ============================================================================

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      console.log("🎯 Drop event triggered");

      if (!wrapperRef.current || !flowInstance.current) {
        console.log("❌ Missing refs:", {
          wrapper: !!wrapperRef.current,
          flow: !!flowInstance.current,
        });
        return;
      }

      const nodeType = e.dataTransfer.getData("application/reactflow");
      console.log("🔍 Validating node type:", nodeType);

      // VALIDATE USING INTEGRATED JSON REGISTRY + FACTORY
      if (!nodeType || !NodeFactory.isValidNodeType(nodeType)) {
        console.log("❌ Invalid node type:", nodeType);
        return;
      }

      // Calculate drop position
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = flowInstance.current.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      console.log("📍 Creating node at position:", { nodeType, position });

      try {
        // CREATE NODE USING INTEGRATED JSON REGISTRY + FACTORY
        const flowNode = NodeFactory.createNode(nodeType, position, {
          isActive: false,
          showUI: false,
        });

        if (!flowNode) {
          console.error("❌ Failed to create node:", nodeType);
          return;
        }

        console.log("✅ Created node:", flowNode);
        onNodeAdd(flowNode as AgenNode);
      } catch (error) {
        console.error("❌ Failed to create node:", error);
      }
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
