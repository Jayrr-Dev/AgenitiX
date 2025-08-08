/**
 * USE PIE MENU ACTIONS HOOK - Action definitions for workflow pie menu
 *
 * • Defines all available actions for the pie menu system
 * • Integrates with flow store operations and node management
 * • Provides context-aware actions based on current selection
 * • Maps keyboard shortcuts to pie menu actions
 * • Optimized action generation with memoization
 *
 * Keywords: pie-menu-actions, workflow-operations, context-aware, shortcuts, node-operations
 */

import type { PieMenuAction, PieMenuSubItem } from "@/components/ui/pie-menu";
import { usePieMenu } from "@/components/ui/pie-menu";
import { useCallback, useMemo } from "react";
import { getAllNodeSpecMetadata } from "@/features/business-logic-modern/infrastructure/node-registry/nodespec-registry";
import { useUndoRedo } from "../../action-toolbar/history/undo-redo-context";
import {
  useAddNode,
  useFlowStore,
  useRemoveNode,
  useSelectedNode,
  useSelectedNodeId,
} from "../stores/flowStore";
import type { AgenNode } from "../types/nodeData";
import { generateNodeId } from "../utils/nodeUtils";

export interface UsePieMenuActionsOptions {
  /** Current mouse position for context-aware actions */
  mousePosition?: { x: number; y: number };
  /** Whether to include debug/development actions */
  includeDebugActions?: boolean;
}

/**
 * Generate sub-menu items for node creation
 */
function generateNodeSubMenuItems(pieMenuPosition: { x: number; y: number }): PieMenuSubItem[] {
  const allNodes = getAllNodeSpecMetadata();

  return allNodes.map(node => ({
    id: node.kind,
    label: node.displayName,
    icon: node.icon || "Circle",
    category: node.category,
    action: () => {
      console.log(`🎯 Creating node: ${node.kind} at pie menu center`);

      // Create node at pie menu position
      const newNode = {
        id: generateNodeId(),
        type: node.kind,
        position: {
          x: pieMenuPosition.x - 60, // Offset to center the node
          y: pieMenuPosition.y - 30,
        },
        deletable: true,
        data: {
          ...node.initialData,
          isActive: false,
        },
      };

      // Add node to flow
      const event = new CustomEvent('create-node-direct', {
        detail: { node: newNode }
      });
      window.dispatchEvent(event);
    },
  }));
}

/**
 * Hook that provides context-aware pie menu actions
 * Actions change based on current selection and context
 */
export function usePieMenuActions(options: UsePieMenuActionsOptions = {}) {
  const { mousePosition, includeDebugActions = false } = options;

  // Get pie menu context to access center position and state
  const { position: pieMenuPosition, actions: pieMenuActions, isVisible: pieMenuVisible } = usePieMenu();

  // Flow store hooks
  const selectedNodeId = useSelectedNodeId();
  const selectedNode = useSelectedNode();
  const addNode = useAddNode();
  const removeNode = useRemoveNode();

  // Flow store methods, basically direct access to store actions
  const copySelectedNodes = useFlowStore((state) => state.copySelectedNodes);
  const pasteNodes = useFlowStore((state) => state.pasteNodes);
  const clearSelection = useFlowStore((state) => state.clearSelection);
  const toggleHistoryPanel = useFlowStore((state) => state.toggleHistoryPanel);

  // Undo/redo from context
  const { undo, redo } = useUndoRedo();

  // Select all nodes function, basically selects all nodes in the canvas
  const selectAllNodes = useCallback(() => {
    const { nodes, setNodes } = useFlowStore.getState();
    const updatedNodes = nodes.map((node) => ({ ...node, selected: true }));
    setNodes(updatedNodes);
  }, []);

  // Generate actions based on context, basically provide different menus for different situations
  const actions = useMemo((): PieMenuAction[] => {
    const baseActions: PieMenuAction[] = [];

    // NODE OPERATIONS - Available when node is selected
    if (selectedNodeId && selectedNode) {
      baseActions.push(
        {
          id: "duplicate-node",
          label: "Duplicate",
          icon: "Copy",
          shortcut: "Alt+W",
          action: () => {
            if (!selectedNode) return;

            // Create duplicated node with offset position
            const newNode = {
              ...selectedNode,
              id: generateNodeId(),
              position: {
                x: selectedNode.position.x + 50,
                y: selectedNode.position.y + 50,
              },
              data: { ...selectedNode.data },
            } as AgenNode;

            addNode(newNode);
          },
        },
        {
          id: "delete-node",
          label: "Delete",
          icon: "Trash2",
          shortcut: "Alt+Q",
          action: () => {
            if (selectedNodeId) {
              removeNode(selectedNodeId);
            }
          },
        },
        {
          id: "copy-node",
          label: "Copy",
          icon: "Copy",
          shortcut: "Ctrl+C",
          action: copySelectedNodes,
        }
      );
    }

    // CREATION ACTIONS - Add new nodes with expandable sub-menu
    baseActions.push({
      id: "add-node",
      label: "Add Node",
      icon: "Plus",
      shortcut: "Tab",
      action: () => {
        // Default action if clicked directly (fallback)
        console.log('🎯 PieMenu: Add Node clicked directly - showing first available node');
      },
      subMenu: {
        items: generateNodeSubMenuItems(pieMenuPosition),
        onHover: () => {
          console.log('🎯 PieMenu: Add Node hovered - showing sub-menu');
        },
        onLeave: () => {
          console.log('🎯 PieMenu: Add Node hover left');
        },
      },
    });

    // SELECTION ACTIONS
    baseActions.push(
      {
        id: "select-all",
        label: "Select All",
        icon: "Layers",
        shortcut: "Ctrl+A",
        action: selectAllNodes,
      },
      {
        id: "clear-selection",
        label: "Clear Selection",
        icon: "Square",
        shortcut: "Esc",
        action: clearSelection,
      }
    );

    // EDIT ACTIONS
    baseActions.push(
      {
        id: "undo",
        label: "Undo",
        icon: "RotateCcw",
        shortcut: "Ctrl+Z",
        action: undo,
      },
      {
        id: "redo",
        label: "Redo",
        icon: "RotateCw",
        shortcut: "Ctrl+Y",
        action: redo,
      },
      {
        id: "paste",
        label: "Paste",
        icon: "Copy",
        shortcut: "Ctrl+V",
        action: pasteNodes,
      }
    );

    // UI ACTIONS
    baseActions.push({
      id: "history",
      label: "History",
      icon: "History",
      shortcut: "Ctrl+H",
      action: toggleHistoryPanel,
    });

    // DEBUG ACTIONS - Only in development
    if (includeDebugActions && process.env.NODE_ENV === "development") {
      baseActions.push({
        id: "debug-info",
        label: "Debug Info",
        icon: "Settings",
        action: () => {
          // Debug info action - silent in production
        },
      });
    }

    return baseActions;
  }, [
    selectedNodeId,
    selectedNode,
    mousePosition,
    includeDebugActions,
    addNode,
    removeNode,
    copySelectedNodes,
    pasteNodes,
    clearSelection,
    selectAllNodes,
    toggleHistoryPanel,
    undo,
    redo,
  ]);

  // Filter out disabled actions, basically remove actions that can't be performed
  const enabledActions = useMemo(() => {
    return actions.filter((action) => !action.disabled);
  }, [actions]);

  return {
    actions: enabledActions,
    hasSelectedNode: !!selectedNodeId,
    selectedNodeId,
  };
}

// ============================================================================
// PRESET ACTION GROUPS
// ============================================================================

/**
 * Predefined action groups for common scenarios
 */
export const PIE_MENU_PRESETS = {
  /** Basic workflow actions - universal pie menu */
  BASIC: "basic",
  /** Node-focused actions - when node is selected */
  NODE_OPERATIONS: "node-operations",
  /** Creation-focused actions - for adding new elements */
  CREATION: "creation",
  /** Edit-focused actions - for editing operations */
  EDITING: "editing",
} as const;

export type PieMenuPreset =
  (typeof PIE_MENU_PRESETS)[keyof typeof PIE_MENU_PRESETS];
