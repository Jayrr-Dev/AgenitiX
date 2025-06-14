/**
 * SIDEBAR - Enhanced node creation and management panel with registry integration
 *
 * • Registry-enhanced node stencils with rich metadata and validation
 * • Tabbed interface organizing nodes by category from modern registry
 * • Double-click node creation with registry-validated node types
 * • Enhanced custom node management with registry metadata support
 * • Variant selector with registry-based node organization
 * • Performance optimized with registry-based node validation
 *
 * Keywords: sidebar, node-creation, stencils, tabs, drag-drop, registry-integration, validation
 */

/* -------------------------------------------------------------------------- */
/*  Sidebar.tsx – Enhanced React-Flow stencil sidebar with registry support   */
/* -------------------------------------------------------------------------- */
"use client";

import { useReactFlow } from "@xyflow/react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";

import { useFlowStore } from "@/features/business-logic-modern/infrastructure/flow-engine/stores/flowStore";
import type { NodeType } from "@/features/business-logic-modern/infrastructure/flow-engine/types/nodeData";

// REGISTRY INTEGRATION - Imports from the new NodeSpec registry
import {
  getNodeSpecMetadata as getNodeMetadata,
  hasNodeSpec,
} from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
// import { nanoid } from "nanoid"; // Removed due to resolver issues
import type { Node as ReactFlowNode } from "@xyflow/react";

// Simple validation function to replace validateNode
const validateNode = (nodeType: string) => ({
  isValid: hasNodeSpec(nodeType),
  warnings: hasNodeSpec(nodeType)
    ? []
    : [`Node type '${nodeType}' not found in registry`],
  suggestions: hasNodeSpec(nodeType)
    ? []
    : ["Check available node types in the registry"],
});

// FACTORY INTEGRATION - REMOVED

import { SidebarTabs } from "./SidebarTabs";
import { VariantSelector } from "./SidebarVariantSelector";
import { ToggleButton } from "./ToggleButton";
import { useSidebarState } from "./hooks/useSidebarState";

// REGISTRY ENHANCEMENTS - Additional utility imports
import {
  getSidebarStatistics,
  validateSidebarConfiguration,
} from "./constants";

// DEBUGGING UTILITIES - Development helpers
import "./utils/debugUtils";

// ============================================================================
// ENHANCED INTERFACES - Registry Integration
// ============================================================================

interface SidebarProps {
  className?: string;
  /** Enable registry debug mode for development */
  enableDebug?: boolean;
  /** Custom node creation handler for advanced integrations */
  onNodeCreated?: (nodeType: NodeType, nodeId: string) => void;
  /** Error handler for node creation failures */
  onCreationError?: (error: string, nodeType?: string) => void;
}

export interface SidebarRef {
  toggle: () => void;
  /** Registry-enhanced methods */
  refreshFromRegistry: () => void;
  getRegistryStats: () => ReturnType<typeof getSidebarStatistics>;
  validateConfiguration: () => ReturnType<typeof validateSidebarConfiguration>;
  createNodeAt: (
    nodeType: string,
    position: { x: number; y: number }
  ) => boolean;
}

// ============================================================================
// ENHANCED SIDEBAR COMPONENT
// ============================================================================

const Sidebar = forwardRef<SidebarRef, SidebarProps>(
  (
    { className = "", enableDebug = false, onNodeCreated, onCreationError },
    ref
  ) => {
    const [isHidden, setIsHidden] = useState(false);
    const [registryStats, setRegistryStats] = useState<ReturnType<
      typeof getSidebarStatistics
    > | null>(null);

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

    // PERFORMANCE OPTIMIZATION - Track mouse position
    const mousePositionRef = useRef({ x: 300, y: 200 });

    // REGISTRY VALIDATION - Memoized validation results
    const validationResults = useMemo(() => {
      if (!enableDebug) return null;
      return validateSidebarConfiguration();
    }, [enableDebug]);

    // REGISTRY STATISTICS - Update statistics periodically
    useEffect(() => {
      if (enableDebug) {
        const updateStats = () => {
          setRegistryStats(getSidebarStatistics());
        };

        updateStats();
        const interval = setInterval(updateStats, 30000); // Update every 30s
        return () => clearInterval(interval);
      }
    }, [enableDebug]);

    // MOUSE TRACKING - Update mouse position for accurate node placement
    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
      };

      document.addEventListener("mousemove", handleMouseMove);
      return () => document.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // ============================================================================
    // ENHANCED NODE CREATION - Registry Integration
    // ============================================================================

    /**
     * REGISTRY-ENHANCED NODE CREATION
     * Creates nodes with full registry validation and metadata
     */
    const handleCreateNode = useCallback(
      (nodeType: string, customPosition?: { x: number; y: number }) => {
        try {
          // STEP 1: Registry validation with detailed feedback
          const validation = validateNode(nodeType);

          if (!validation.isValid) {
            const errorMsg = `Invalid node type '${nodeType}': ${validation.warnings.join(
              ", "
            )}`;
            console.error("❌ Node creation failed:", errorMsg);
            console.error("💡 Suggestions:", validation.suggestions);
            onCreationError?.(errorMsg, nodeType);
            return false;
          }

          // STEP 2: Get enhanced metadata from the new registry
          const metadata = getNodeMetadata(nodeType);
          if (!metadata) {
            const errorMsg = `Failed to get metadata for '${nodeType}'`;
            console.error("❌ Metadata retrieval failed:", errorMsg);
            onCreationError?.(errorMsg, nodeType);
            return false;
          }

          // Debug info available but not logged to console

          // STEP 3: Calculate position (custom or mouse-based)
          const targetPosition = customPosition || {
            x: mousePositionRef.current.x,
            y: mousePositionRef.current.y,
          };

          // Convert screen coordinates to flow coordinates
          const flowPosition = screenToFlowPosition(targetPosition);

          // STEP 4: Create a new node object directly
          const newNode: ReactFlowNode = {
            id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            type: metadata.kind,
            position: flowPosition,
            data: {
              // Populate initial data from metadata defaults
              ...metadata.initialData,
            },
          };

          // STEP 5: Add node to the store
          addNode(newNode as any);

          // STEP 6: Success feedback (debug info available but not logged)

          // STEP 7: Optional callback
          onNodeCreated?.(metadata.kind as NodeType, newNode.id);

          return true;
        } catch (error) {
          const errorMsg = `Node creation failed: ${
            error instanceof Error ? error.message : String(error)
          }`;
          console.error("❌ Critical node creation error:", error);
          onCreationError?.(errorMsg, nodeType);
          return false;
        }
      },
      [
        addNode,
        screenToFlowPosition,
        enableDebug,
        onNodeCreated,
        onCreationError,
      ]
    );

    // ============================================================================
    // UI INTERACTION HANDLERS
    // ============================================================================

    const toggleVisibility = useCallback(() => {
      setIsHidden((prev) => !prev);
    }, []);

    const refreshFromRegistry = useCallback(() => {
      if (enableDebug) {
        setRegistryStats(getSidebarStatistics());
      }
    }, [enableDebug]);

    // ============================================================================
    // REF INTERFACE - Enhanced with Registry Features
    // ============================================================================

    useImperativeHandle(
      ref,
      () => ({
        toggle: toggleVisibility,
        refreshFromRegistry,
        getRegistryStats: () => registryStats || getSidebarStatistics(),
        validateConfiguration: () => validateSidebarConfiguration(),
        createNodeAt: (nodeType: string, position: { x: number; y: number }) =>
          handleCreateNode(nodeType, position),
      }),
      [toggleVisibility, refreshFromRegistry, registryStats, handleCreateNode]
    );

    // ============================================================================
    // DEBUG INFORMATION - Development Only
    // ============================================================================

    useEffect(() => {
      if (enableDebug && process.env.NODE_ENV === "development") {
        // Debug info available but not logged to console
      }
    }, [enableDebug, registryStats, validationResults]);

    // ============================================================================
    // ENHANCED RENDER
    // ============================================================================

    return (
      <div
        className={`
        bg-infra-sidebar
        border-infra-sidebar
        text-infra-sidebar
        border-r
        transition-all
        duration-300
        ease-in-out
        ${isHidden ? "w-0 overflow-hidden" : "w-80"}
        ${className}
        ${enableDebug ? "debug-mode" : ""}
      `}
      >
        {/* REGISTRY DEBUG PANEL - Development Only */}
        {enableDebug && process.env.NODE_ENV === "development" && (
          <div className="bg-infra-sidebar-hover border-infra-sidebar-hover p-2 text-xs border-b">
            <div className="text-infra-sidebar font-semibold mb-1">
              🔧 Registry Integration
            </div>
            {registryStats && (
              <div className="space-y-1 text-infra-sidebar-secondary">
                <div>Total Nodes: {registryStats.totalNodes}</div>
                <div>Categories: {registryStats.categories.length}</div>
                <div>Folders: {registryStats.folders.length}</div>
              </div>
            )}
            {validationResults && !validationResults.isValid && (
              <div className="text-error mt-1">
                ⚠️ {validationResults.errors.length} validation errors
              </div>
            )}
          </div>
        )}

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
