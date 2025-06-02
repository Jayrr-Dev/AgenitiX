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

// USE MODERN REGISTRY SYSTEM
import {
  getNodeMetadata,
  isValidNodeType,
} from "@node-creation/node-registry/nodeRegistry";

// USE FACTORY UTILITIES
import { NodeFactory } from "@factory/utils/nodeFactory";

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
  // DROP HANDLER - Using Modern Registry System
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

      // VALIDATE USING MODERN REGISTRY
      if (!nodeType || !isValidNodeType(nodeType)) {
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
        // CREATE NODE USING FACTORY
        const factoryNode = NodeFactory.createNode(nodeType as any, position);

        // GET REGISTRY METADATA
        const metadata = getNodeMetadata(nodeType);

        // TRANSFORM TO FLOW ENGINE FORMAT
        const flowNode: AgenNode = {
          ...factoryNode,
          type: nodeType,
          data: {
            ...factoryNode.data,
            // Ensure isActive is set
            isActive: false,
            // Add any domain-specific defaults based on metadata
            ...(metadata?.hasToggle && { showUI: false }),
          },
        } as AgenNode;

        console.log("✅ Created node:", flowNode);
        onNodeAdd(flowNode);
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
