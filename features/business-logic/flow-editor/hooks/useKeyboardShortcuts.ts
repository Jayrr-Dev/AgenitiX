import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS, COPY_PASTE_OFFSET } from '../constants';

interface KeyboardShortcutsProps {
  onCopy: () => void;
  onPaste: () => void;
  onToggleHistory: () => void;
  onDelete?: () => void; // Optional delete handler for Ctrl+Q
  onToggleVibeMode?: () => void; // Optional vibe mode toggle for Ctrl+X
}

export function useKeyboardShortcuts({
  onCopy,
  onPaste,
  onToggleHistory,
  onDelete,
  onToggleVibeMode
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      
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
      if (!ctrl) return;
      
      switch (key) {
        case KEYBOARD_SHORTCUTS.TOGGLE_HISTORY:
          onToggleHistory();
          e.preventDefault();
          break;
          
        case KEYBOARD_SHORTCUTS.COPY:
          // Only prevent default if not in an input field
          if (!isInputFocused) {
            onCopy();
            e.preventDefault();
          }
          break;
          
        case KEYBOARD_SHORTCUTS.PASTE:
          // Only prevent default if not in an input field
          if (!isInputFocused) {
            onPaste();
            e.preventDefault();
          }
          break;
          
        case 'q':
          // Ctrl+Q for multi-selection delete
          if (!isInputFocused && onDelete) {
            onDelete();
            e.preventDefault();
          }
          break;
          
        case 'x':
          // Ctrl+X for vibe mode toggle (only when not in input field)
          if (!isInputFocused && onToggleVibeMode) {
            onToggleVibeMode();
            e.preventDefault();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste, onToggleHistory, onDelete, onToggleVibeMode]);
} 