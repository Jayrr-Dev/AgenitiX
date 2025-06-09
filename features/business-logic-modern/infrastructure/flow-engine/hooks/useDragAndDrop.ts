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
} from "../../node-creation/core/registries/json-node-registry/unifiedRegistry";

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

      console.log("🎯 [DragDrop] Drop event triggered");

      if (!wrapperRef.current || !flowInstance.current) {
        console.log("❌ [DragDrop] Missing refs:", {
          wrapper: !!wrapperRef.current,
          flow: !!flowInstance.current,
        });
        return;
      }

      const nodeType = e.dataTransfer.getData("application/reactflow");
      console.log(
        "🔍 [DragDrop] Extracted node type from drag data:",
        nodeType
      );

      // VALIDATE USING INTEGRATED JSON REGISTRY + FACTORY
      if (!nodeType) {
        console.log("❌ [DragDrop] Node type is empty:", nodeType);
        return;
      }

      // Enhanced validation logging for V2U nodes
      console.log("🧪 [DragDrop] Starting V2U validation for:", nodeType);
      const isValid = isValidNodeType(nodeType);
      console.log("🎯 [DragDrop] isValidNodeType result:", {
        nodeType,
        isValid,
        isV2U: nodeType.includes("V2U"),
      });

      if (!isValid) {
        console.log("❌ [DragDrop] Node type validation FAILED:", nodeType);

        // Additional debugging for V2U nodes
        const registration = getEnhancedNodeRegistration(nodeType);
        console.log("🔍 [DragDrop] Enhanced registration check:", {
          nodeType,
          hasRegistration: !!registration,
          registrationData: registration
            ? {
                category: registration.category,
                folder: registration.folder,
                displayName: registration.displayName,
              }
            : null,
        });
        return;
      }

      console.log("✅ [DragDrop] Node type validation PASSED for:", nodeType);

      // Calculate drop position
      const bounds = wrapperRef.current.getBoundingClientRect();
      const position = flowInstance.current.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      console.log("📍 [DragDrop] Calculated drop position:", {
        nodeType,
        position,
      });

      try {
        // CREATE NODE USING MODERN UNIFIED REGISTRY
        console.log("🏭 [DragDrop] Fetching registration for node creation...");
        const registration = getEnhancedNodeRegistration(nodeType);

        if (!registration) {
          console.error("❌ [DragDrop] No registration found for:", nodeType);
          console.error(
            "🔍 [DragDrop] This should not happen after validation passed!"
          );
          return;
        }

        console.log("✅ [DragDrop] Registration found:", {
          nodeType: registration.nodeType,
          category: registration.category,
          folder: registration.folder,
          hasDefaultData: !!registration.defaultData,
          defaultDataKeys: registration.defaultData
            ? Object.keys(registration.defaultData)
            : [],
        });

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

        console.log("✅ [DragDrop] Created node object:", {
          id: flowNode.id,
          type: flowNode.type,
          position: flowNode.position,
          dataKeys: Object.keys(flowNode.data || {}),
          isV2U: nodeType.includes("V2U"),
        });

        console.log("🚀 [DragDrop] Calling onNodeAdd with node...");
        onNodeAdd(flowNode);
        console.log("✅ [DragDrop] onNodeAdd call completed successfully");
      } catch (error) {
        console.error("❌ [DragDrop] Failed to create node:", error);
        console.error("🔍 [DragDrop] Error details:", {
          nodeType,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
        });
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
