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

import type { PieMenuAction } from "@/components/ui/pie-menu";
import { usePieMenu } from "@/components/ui/pie-menu";
import { useCallback, useMemo } from "react";
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

<<<<<<< Updated upstream
    // CREATION ACTIONS - Add new nodes at mouse position
    if (mousePosition) {
      baseActions.push({
        id: "add-node",
        label: "Add Node",
        icon: "Plus",
        shortcut: "Tab",
        action: () => {
          // Open sidebar or node creation modal at mouse position
          // This would integrate with your existing node creation system
        },
      });
    }
=======
    // CREATION ACTIONS - Add new nodes at pie menu center
    baseActions.push({
      id: "add-node",
      label: "Add Node",
      icon: "Plus",
      shortcut: "Tab",
      action: () => { 
        // Use pie menu center, but fallback to mouse position if pie menu position is not initialized
        // Fixed: Detect if pieMenu has been actually shown vs. initial {x: 0, y: 0} state
        const isPieMenuInitialized = pieMenuPosition && 
          typeof pieMenuPosition.x === 'number' && 
          typeof pieMenuPosition.y === 'number' &&
          !isNaN(pieMenuPosition.x) && 
          !isNaN(pieMenuPosition.y) &&
          // Additional check: if position is {0,0} but pieMenu has never been shown with actions,
          // it's likely the initial uninitialized state
          !(pieMenuPosition.x === 0 && pieMenuPosition.y === 0 && pieMenuActions.length === 0);
        
        const isValidPosition = isPieMenuInitialized;
        
        // Determine the best position to use
        let targetPosition;
        if (isValidPosition) {
          targetPosition = pieMenuPosition;
        } else if (mousePosition && mousePosition.x > 0 && mousePosition.y > 0) {
          targetPosition = mousePosition;
        } else {
          // Ultimate fallback: center of screen
          targetPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        }
        
        // Determine which position source was used
        let positionSource;
        if (isValidPosition) {
          positionSource = 'pieMenu center';
        } else if (mousePosition && mousePosition.x > 0 && mousePosition.y > 0) {
          positionSource = 'mouse position';
        } else {
          positionSource = 'screen center (ultimate fallback)';
        }
        
        console.log('🎯 PieMenu: Dispatching show-add-node-menu event', {
          pieMenuPosition,
          mousePosition,
          targetPosition,
          isValidPosition,
          positionSource,
          usingPieMenuCenter: isValidPosition,
          pieMenuState: {
            actionsCount: pieMenuActions.length,
            isVisible: pieMenuVisible,
            isInitialState: pieMenuPosition.x === 0 && pieMenuPosition.y === 0 && pieMenuActions.length === 0
          }
        });
        
        const event = new CustomEvent('show-add-node-menu', {
          detail: { position: targetPosition }
        });
        window.dispatchEvent(event);
        console.log('✅ PieMenu: Event dispatched successfully');
      },
    });
>>>>>>> Stashed changes

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
