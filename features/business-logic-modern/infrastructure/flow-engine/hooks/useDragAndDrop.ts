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

// USE MODERN UNIFIED REGISTRY DIRECTLY
import {
  getEnhancedNodeRegistration,
  getLegacyModernNodeRegistry,
  isValidNodeType,
} from "@/features/business-logic-modern/infrastructure/node-creation/json-node-registry/unifiedRegistry";

// DEBUG: Make modern registry available globally for testing
if (typeof window !== "undefined") {
  (window as any).UnifiedRegistry = {
    isValidNodeType,
    getEnhancedNodeRegistration,
    getLegacyModernNodeRegistry,
  };
  (window as any).testV2UNodes = () => {
    const v2uNodes = [
      "createTextV2U",
      "viewOutputV2U",
      "triggerOnToggleV2U",
      "testErrorV2U",
    ];
    console.log("🧪 Testing V2U Node Modern Registry:");
    v2uNodes.forEach((nodeType) => {
      const isValid = isValidNodeType(nodeType);
      const registration = getEnhancedNodeRegistration(nodeType);
      console.log(`  - ${nodeType}: ${isValid ? "VALID ✅" : "INVALID ❌"}`);
      if (registration) {
        console.log(
          `    Category: ${registration.category}, Folder: ${registration.folder}`
        );
      }
    });
  };
}

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
      if (!nodeType) {
        console.log("❌ Node type is empty:", nodeType);
        return;
      }

      const isValid = isValidNodeType(nodeType);
      console.log("🎯 Modern Registry validation result:", {
        nodeType,
        isValid,
      });

      if (!isValid) {
        console.log("❌ Invalid node type:", nodeType);
        console.log(
          "🔍 Available in unified registry:",
          !!getEnhancedNodeRegistration(nodeType)
        );
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
        // CREATE NODE USING MODERN UNIFIED REGISTRY
        const registration = getEnhancedNodeRegistration(nodeType);
        if (!registration) {
          console.error("❌ No registration found for:", nodeType);
          return;
        }

        // Create node with modern registry data
        const id = `node_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const flowNode: AgenNode = {
          id,
          type: nodeType as any,
          position,
          deletable: true,
          data: {
            ...registration.defaultData,
            isActive: false,
            showUI: false,
          },
        };

        console.log("✅ Created node using modern registry:", flowNode);
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
