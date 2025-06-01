import { useCallback, useRef } from 'react';

interface UseTextInputShortcutsOptions {
  onEnter?: () => void;
  value?: string;
  setValue?: (value: string) => void;
}

/**
 * ERGONOMIC TEXT INPUT SHORTCUTS HOOK
 * 
 * Provides Alt+Q (backspace) and Alt+W (enter) functionality for text input fields.
 * Keeps hands in the Alt key area for efficient typing without reaching for backspace/enter.
 */
export function useTextInputShortcuts(options: UseTextInputShortcutsOptions = {}) {
  const { onEnter, value = '', setValue } = options;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // ALT+Q - Ergonomic backspace
    if (e.altKey && e.key.toLowerCase() === 'q') {
      e.preventDefault();
      const input = e.currentTarget;
      const cursorPos = input.selectionStart || 0;
      
      if (cursorPos > 0 && setValue) {
        const newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
        setValue(newValue);
        
        // Restore cursor position after state update
        setTimeout(() => {
          if (input) {
            input.setSelectionRange(cursorPos - 1, cursorPos - 1);
          }
        }, 0);
      }
      return;
    }

    // ALT+W - Ergonomic enter
    if (e.altKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      if (onEnter) {
        onEnter();
      } else {
        // Default behavior: blur the input
        e.currentTarget.blur();
      }
      return;
    }
  }, [value, setValue, onEnter]);

  return {
    inputRef,
    handleKeyDown,
    // Helper for input props
    getInputProps: () => ({
      ref: inputRef,
      onKeyDown: handleKeyDown,
    }),
  };
} 