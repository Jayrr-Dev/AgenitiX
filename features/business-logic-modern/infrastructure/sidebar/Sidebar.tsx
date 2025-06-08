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

// REGISTRY INTEGRATION - Enhanced imports
import {
  getLegacyModernNodeRegistry,
  getNodeCapabilities,
  getNodeMetadata,
  safeNodeTypeCast,
  validateNodeForInspector,
} from "../node-creation/json-node-registry/unifiedRegistry";

// Create the MODERN_NODE_REGISTRY alias for backward compatibility
const MODERN_NODE_REGISTRY = getLegacyModernNodeRegistry();

// FACTORY INTEGRATION - Enhanced node creation
import { createNode } from "@/features/business-logic-modern/infrastructure/node-creation/factory/utils/nodeFactory";

import { SidebarTabs } from "./SidebarTabs";
import { ToggleButton } from "./ToggleButton";
import { VariantSelector } from "./VariantSelector";
import { useSidebarState } from "./hooks/useSidebarState";

// REGISTRY ENHANCEMENTS - Additional utility imports
import {
  getSidebarStatistics,
  validateSidebarConfiguration,
} from "./constants";

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
          const validation = validateNodeForInspector(nodeType);

          if (!validation.isValid) {
            const errorMsg = `Invalid node type '${nodeType}': ${validation.warnings.join(", ")}`;
            console.error("❌ Node creation failed:", errorMsg);
            console.error("💡 Suggestions:", validation.suggestions);
            onCreationError?.(errorMsg, nodeType);
            return false;
          }

          // STEP 2: Safe type casting with registry validation
          const validNodeType = safeNodeTypeCast(nodeType);
          if (!validNodeType) {
            const errorMsg = `Failed to cast '${nodeType}' to valid NodeType`;
            console.error("❌ Type casting failed:", errorMsg);
            onCreationError?.(errorMsg, nodeType);
            return false;
          }

          // STEP 3: Get enhanced metadata from registry
          const metadata = getNodeMetadata(validNodeType);
          const capabilities = getNodeCapabilities(validNodeType);

          if (enableDebug) {
            console.log("🏭 Creating node with registry metadata:", {
              nodeType: validNodeType,
              displayName: metadata?.displayName,
              category: capabilities.category,
              folder: capabilities.folder,
              hasOutput: capabilities.hasOutput,
              hasControls: capabilities.hasControls,
            });
          }

          // STEP 4: Calculate position (custom or mouse-based)
          const targetPosition = customPosition || {
            x: mousePositionRef.current.x,
            y: mousePositionRef.current.y,
          };

          // Convert screen coordinates to flow coordinates
          const flowPosition = screenToFlowPosition(targetPosition);

          // STEP 5: Create node using factory with registry defaults
          const factoryNode = createNode(
            validNodeType as NodeType,
            flowPosition
          );

          // STEP 6: Enhance factory node with registry metadata (preserve original structure)
          if (metadata) {
            factoryNode.data = {
              ...factoryNode.data,
              // Registry metadata enhancement (non-breaking addition)
              _registryMetadata: {
                displayName: metadata.displayName,
                description: metadata.description,
                category: metadata.category,
                folder: metadata.folder,
                icon: metadata.icon,
              },
            };
          }

          // STEP 7: Add node to store using factory node (compatible by design)
          addNode(factoryNode as any); // Safe cast - factory nodes are designed to be compatible

          // STEP 8: Success feedback
          if (enableDebug) {
            console.log("✅ Node created successfully:", {
              id: factoryNode.id,
              type: factoryNode.type,
              position: factoryNode.position,
              hasRegistryData: !!factoryNode.data._registryMetadata,
            });
          }

          // STEP 9: Optional callback
          onNodeCreated?.(validNodeType as NodeType, factoryNode.id);

          return true;
        } catch (error) {
          const errorMsg = `Node creation failed: ${error instanceof Error ? error.message : String(error)}`;
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
        console.log("🔄 Refreshing sidebar from registry...");
        setRegistryStats(getSidebarStatistics());
        console.log("✅ Registry refresh complete");
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
        console.log("🔧 SIDEBAR DEBUG INFO");
        console.log("=====================");
        console.log("📊 Registry Stats:", registryStats);
        console.log("✅ Validation:", validationResults);
        console.log(
          "🎯 Available Node Types:",
          Object.keys(MODERN_NODE_REGISTRY)
        );
      }
    }, [enableDebug, registryStats, validationResults]);

    // ============================================================================
    // ENHANCED RENDER
    // ============================================================================

    return (
      <div className={`${className} ${enableDebug ? "debug-mode" : ""}`}>
        {/* REGISTRY DEBUG PANEL - Development Only */}
        {enableDebug && process.env.NODE_ENV === "development" && (
          <div className="bg-gray-100 dark:bg-gray-800 p-2 text-xs border-b">
            <div className="text-blue-600 dark:text-blue-400 font-semibold mb-1">
              🔧 Registry Integration
            </div>
            {registryStats && (
              <div className="space-y-1">
                <div>Total Nodes: {registryStats.totalNodes}</div>
                <div>
                  Categories:{" "}
                  {Object.keys(registryStats.nodesByCategory).length}
                </div>
                <div>
                  Folders: {Object.keys(registryStats.nodesByFolder).length}
                </div>
              </div>
            )}
            {validationResults && !validationResults.isValid && (
              <div className="text-red-600 dark:text-red-400 mt-1">
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
