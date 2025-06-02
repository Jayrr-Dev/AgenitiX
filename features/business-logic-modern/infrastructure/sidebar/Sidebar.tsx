/**
 * SIDEBAR - Node creation and management panel
 *
 * • Collapsible sidebar with node stencils for drag-and-drop creation
 * • Tabbed interface organizing nodes by category and functionality
 * • Double-click node creation at mouse cursor position
 * • Custom node management with add, remove, and reorder capabilities
 * • Variant selector for different sidebar layouts and styles
 *
 * Keywords: sidebar, node-creation, stencils, tabs, drag-drop, custom-nodes
 */

/* -------------------------------------------------------------------------- */
/*  Sidebar.tsx – React-Flow stencil sidebar + hover panel                    */
/* -------------------------------------------------------------------------- */
"use client";

import { useReactFlow } from "@xyflow/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  createNode,
  isValidNodeType,
} from "@/features/business-logic-modern/_temp/nodeFactory";
import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { NodeType } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";
import { SidebarTabs } from "./SidebarTabs";
import { ToggleButton } from "./ToggleButton";
import { VariantSelector } from "./VariantSelector";
import { useSidebarState } from "./hooks/useSidebarState";

interface SidebarProps {
  className?: string;
}

export interface SidebarRef {
  toggle: () => void;
}

const Sidebar = forwardRef<SidebarRef, SidebarProps>(
  ({ className = "" }, ref) => {
    const [isHidden, setIsHidden] = useState(false);
    const {
      variant,
      activeTab,
      setVariant,
      setActiveTab,
      customNodes,
      addCustomNode,
      removeCustomNode,
      reorderCustomNodes,
    } = useSidebarState();
    const { screenToFlowPosition } = useReactFlow();
    const { addNode } = useFlowStore();

    // Track mouse position
    const mousePositionRef = useRef({ x: 300, y: 200 });

    // Update mouse position on mouse move
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    const toggleVisibility = useCallback(() => {
      setIsHidden((prev) => !prev);
    }, []);

    // EXPOSE TOGGLE FUNCTION TO PARENT VIA REF
    useImperativeHandle(
      ref,
      () => ({
        toggle: toggleVisibility,
      }),
      [toggleVisibility]
    );

    const handleCreateNode = useCallback(
      (nodeType: string) => {
        // Validate node type
        if (!isValidNodeType(nodeType)) {
          console.error("Invalid node type:", nodeType);
          return;
        }

        try {
          // Convert mouse screen coordinates to flow coordinates
          const flowPosition = screenToFlowPosition({
            x: mousePositionRef.current.x,
            y: mousePositionRef.current.y,
          });

          // Use the same createNode function as drag and drop
          const newNode = createNode(nodeType as NodeType, flowPosition);

          // Use store's addNode instead of ReactFlow's addNodes
          addNode(newNode);
        } catch (error) {
          console.error("Error creating node:", error);
        }
      },
      [addNode, screenToFlowPosition]
    );

    return (
      <div className={`${className}`}>
        <VariantSelector
          variant={variant}
          onVariantChange={setVariant}
          isHidden={isHidden}
        />

        <SidebarTabs
          variant={variant}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onDoubleClickCreate={handleCreateNode}
          isHidden={isHidden}
          customNodes={customNodes}
          onAddCustomNode={addCustomNode}
          onRemoveCustomNode={removeCustomNode}
          onReorderCustomNodes={reorderCustomNodes}
          onVariantChange={setVariant}
          onToggle={toggleVisibility}
        />

        <ToggleButton isHidden={isHidden} onToggle={toggleVisibility} />
      </div>
    );
  }
);

Sidebar.displayName = "Sidebar";

export default Sidebar;
