/**
 * USE KEYBOARD SHORTCUTS HOOK - Global keyboard event handler system
 *
 * • Registers and manages global keyboard shortcuts for flow editor
 * • Handles Ctrl-based shortcuts for copy, paste, select all, vibe mode
 * • Manages Alt-based shortcuts for deletion, duplication, inspector lock
 * • Prevents shortcuts when input fields are focused
 * • Supports both Mac and Windows modifier key combinations
 *
 * Keywords: keyboard, shortcuts, global-events, modifiers, Ctrl-Alt, input-focus
 */

import { useEffect } from "react";
import { KEYBOARD_SHORTCUTS } from "../constants";

interface KeyboardShortcutsProps {
  onCopy: () => void;
  onPaste: () => void;
  onToggleHistory: () => void;
  onUndo?: () => void; // Optional undo handler for Ctrl+Z
  onRedo?: () => void; // Optional redo handler for Ctrl+Y
  onSelectAll?: () => void; // Optional select all handler for Ctrl+A
  onClearSelection?: () => void; // Optional clear selection handler for Esc
  onDelete?: () => void; // Optional delete handler for Alt+Q
  onToggleVibeMode?: () => void; // Optional vibe mode toggle for Ctrl+X
  onToggleInspectorLock?: () => void; // Optional inspector lock toggle for Alt+A
  onDuplicateNode?: () => void; // Optional node duplication for Alt+W
  onToggleSidebar?: () => void; // Optional sidebar toggle for Alt+S
  onPieMenu?: (e: KeyboardEvent) => void; // Optional pie menu activation for G key
}

/**
 * Helper function to check if user is currently focused on an input field
 */
const isInputFocused = (): boolean => {
  const activeElement = document.activeElement;
  return !!(
    activeElement &&
    (activeElement.tagName === "INPUT" ||
      activeElement.tagName === "TEXTAREA" ||
      (activeElement as HTMLElement).contentEditable === "true" ||
      activeElement.hasAttribute("contenteditable"))
  );
};

/**
 * Helper function to get platform-specific modifier keys
 */
const getModifierKeys = (e: KeyboardEvent) => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
  const ctrl = isMac ? e.metaKey : e.ctrlKey;
  const alt = e.altKey;
  return { ctrl, alt };
};

/**
 * Helper function to handle Escape key shortcuts
 */
const handleEscapeShortcuts = (
  e: KeyboardEvent,
  handlers: Pick<KeyboardShortcutsProps, "onClearSelection">
): boolean => {
  if (e.key === KEYBOARD_SHORTCUTS.ESCAPE && !isInputFocused()) {
    if (handlers.onClearSelection) {
      handlers.onClearSelection();
      e.preventDefault();
      return true;
    }
  }
  return false;
};

/**
 * Helper function to handle Ctrl-based shortcuts
 */
const handleCtrlShortcuts = (
  e: KeyboardEvent,
  key: string,
  handlers: Pick<
    KeyboardShortcutsProps,
    | "onToggleHistory"
    | "onCopy"
    | "onPaste"
    | "onSelectAll"
    | "onUndo"
    | "onRedo"
    | "onToggleVibeMode"
  >
): boolean => {
  if (isInputFocused()) {
    return false;
  }

  switch (key) {
    case KEYBOARD_SHORTCUTS.TOGGLE_HISTORY:
      handlers.onToggleHistory();
      e.preventDefault();
      return true;

    case KEYBOARD_SHORTCUTS.COPY:
      handlers.onCopy();
      e.preventDefault();
      return true;

    case KEYBOARD_SHORTCUTS.PASTE:
      handlers.onPaste();
      e.preventDefault();
      return true;

    case KEYBOARD_SHORTCUTS.SELECT_ALL:
      // Ctrl+A for select all nodes (prevent default text selection)
      if (handlers.onSelectAll) {
        handlers.onSelectAll();
        e.preventDefault();
        return true;
      }
      break;

    case "z":
      // Ctrl+Z for undo (Ctrl+Shift+Z for redo on some platforms)
      if (!e.shiftKey && handlers.onUndo) {
        handlers.onUndo();
        e.preventDefault();
        return true;
      }
      if (e.shiftKey && handlers.onRedo) {
        handlers.onRedo();
        e.preventDefault();
        return true;
      }
      break;

    case "y":
      // Ctrl+Y for redo (Windows/Linux style)
      if (handlers.onRedo) {
        handlers.onRedo();
        e.preventDefault();
        return true;
      }
      break;

    case "x":
      // Ctrl+X for vibe mode toggle (only when not in input field)
      if (handlers.onToggleVibeMode) {
        handlers.onToggleVibeMode();
        e.preventDefault();
        return true;
      }
      break;
  }
  return false;
};

/**
 * Helper function to handle Alt-based shortcuts
 */
const handleAltShortcuts = (
  e: KeyboardEvent,
  key: string,
  handlers: Pick<
    KeyboardShortcutsProps,
    "onDelete" | "onToggleInspectorLock" | "onDuplicateNode" | "onToggleSidebar"
  >
): boolean => {
  if (isInputFocused()) {
    return false;
  }

  switch (key) {
    case KEYBOARD_SHORTCUTS.DELETE_NODES:
      // Alt+Q for node deletion
      if (handlers.onDelete) {
        handlers.onDelete();
        e.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.TOGGLE_INSPECTOR:
      // Alt+A for inspector lock/unlock toggle
      if (handlers.onToggleInspectorLock) {
        handlers.onToggleInspectorLock();
        e.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.DUPLICATE_NODE:
      // Alt+W for node duplication
      if (handlers.onDuplicateNode) {
        handlers.onDuplicateNode();
        e.preventDefault();
        return true;
      }
      break;

    case KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR:
      // Alt+S for sidebar toggle
      if (handlers.onToggleSidebar) {
        handlers.onToggleSidebar();
        e.preventDefault();
        return true;
      }
      break;
  }
  return false;
};

export function useKeyboardShortcuts({
  onCopy,
  onPaste,
  onToggleHistory,
  onUndo,
  onRedo,
  onSelectAll,
  onClearSelection,
  onDelete,
  onToggleVibeMode,
  onToggleInspectorLock,
  onDuplicateNode,
  onToggleSidebar,
  onPieMenu,
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const { ctrl, alt } = getModifierKeys(e);
      const key = e.key.toLowerCase();

      // ReactFlow handles delete keys natively, so we don't need custom handling

      // Handle Escape key (clear selection) - works regardless of modifier keys
      if (handleEscapeShortcuts(e, { onClearSelection })) {
        return;
      }

      // Handle Pie Menu (G key) - no modifiers, basically simple activation
      if (
        key === KEYBOARD_SHORTCUTS.PIE_MENU &&
        !ctrl &&
        !alt &&
        !e.shiftKey &&
        !isInputFocused()
      ) {
        if (onPieMenu) {
          onPieMenu(e);
          e.preventDefault();
          return;
        }
      }

      // Handle Ctrl-based shortcuts
      if (ctrl) {
        if (
          handleCtrlShortcuts(e, key, {
            onToggleHistory,
            onCopy,
            onPaste,
            onSelectAll,
            onUndo,
            onRedo,
            onToggleVibeMode,
          })
        ) {
          return;
        }
      }

      // Handle Alt-based shortcuts
      if (alt) {
        handleAltShortcuts(e, key, {
          onDelete,
          onToggleInspectorLock,
          onDuplicateNode,
          onToggleSidebar,
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onCopy,
    onPaste,
    onToggleHistory,
    onUndo,
    onRedo,
    onSelectAll,
    onClearSelection,
    onDelete,
    onToggleVibeMode,
    onToggleInspectorLock,
    onDuplicateNode,
    onToggleSidebar,
    onPieMenu,
  ]);
}
