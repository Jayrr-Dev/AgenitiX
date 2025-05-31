import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS, COPY_PASTE_OFFSET } from '../constants';

interface KeyboardShortcutsProps {
  onCopy: () => void;
  onPaste: () => void;
  onToggleHistory: () => void;
  onSelectAll?: () => void; // Optional select all handler for Ctrl+A
  onDelete?: () => void; // Optional delete handler for Alt+Q
  onToggleVibeMode?: () => void; // Optional vibe mode toggle for Ctrl+X
  onToggleInspectorLock?: () => void; // Optional inspector lock toggle for Alt+A
  onDuplicateNode?: () => void; // Optional node duplication for Alt+W
  onToggleSidebar?: () => void; // Optional sidebar toggle for Alt+S
}

export function useKeyboardShortcuts({
  onCopy,
  onPaste,
  onToggleHistory,
  onSelectAll,
  onDelete,
  onToggleVibeMode,
  onToggleInspectorLock,
  onDuplicateNode,
  onToggleSidebar
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      const alt = e.altKey;
      
      // Check if user is currently focused on an input field
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        (activeElement as HTMLElement).contentEditable === 'true' ||
        activeElement.hasAttribute('contenteditable')
      );
      
      const key = e.key.toLowerCase();
      
      // ReactFlow handles delete keys natively, so we don't need custom handling
      
      // Handle Ctrl-based shortcuts
      if (ctrl && !isInputFocused) {
        switch (key) {
          case KEYBOARD_SHORTCUTS.TOGGLE_HISTORY:
            onToggleHistory();
            e.preventDefault();
            break;
            
          case KEYBOARD_SHORTCUTS.COPY:
            onCopy();
            e.preventDefault();
            break;
            
          case KEYBOARD_SHORTCUTS.PASTE:
            onPaste();
            e.preventDefault();
            break;
            
          case KEYBOARD_SHORTCUTS.SELECT_ALL:
            // Ctrl+A for select all nodes (prevent default text selection)
            if (onSelectAll) {
              onSelectAll();
              e.preventDefault();
            }
            break;
            
          case 'x':
            // Ctrl+X for vibe mode toggle (only when not in input field)
            if (onToggleVibeMode) {
              onToggleVibeMode();
              e.preventDefault();
            }
            break;
        }
      }
      
      // Handle Alt-based shortcuts
      if (alt && !isInputFocused) {
        switch (key) {
          case KEYBOARD_SHORTCUTS.DELETE_NODES:
            // Alt+Q for node deletion
            if (onDelete) {
              onDelete();
              e.preventDefault();
            }
            break;
            
          case KEYBOARD_SHORTCUTS.TOGGLE_INSPECTOR:
            // Alt+A for inspector lock/unlock toggle
            if (onToggleInspectorLock) {
              onToggleInspectorLock();
              e.preventDefault();
            }
            break;
            
          case KEYBOARD_SHORTCUTS.DUPLICATE_NODE:
            // Alt+W for node duplication
            if (onDuplicateNode) {
              onDuplicateNode();
              e.preventDefault();
            }
            break;
            
          case KEYBOARD_SHORTCUTS.TOGGLE_SIDEBAR:
            // Alt+S for sidebar toggle
            if (onToggleSidebar) {
              onToggleSidebar();
              e.preventDefault();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste, onToggleHistory, onSelectAll, onDelete, onToggleVibeMode, onToggleInspectorLock, onDuplicateNode, onToggleSidebar]);
} 