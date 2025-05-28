import { useEffect } from 'react';
import { KEYBOARD_SHORTCUTS, COPY_PASTE_OFFSET } from '../constants';

interface KeyboardShortcutsProps {
  onCopy: () => void;
  onPaste: () => void;
  onToggleHistory: () => void;
}

export function useKeyboardShortcuts({
  onCopy,
  onPaste,
  onToggleHistory
}: KeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      
      if (!ctrl) return;
      
      const key = e.key.toLowerCase();
      
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCopy, onPaste, onToggleHistory]);
} 