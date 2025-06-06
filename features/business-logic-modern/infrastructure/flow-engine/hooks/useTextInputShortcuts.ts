import { useCallback, useRef } from "react";

interface UseTextInputShortcutsOptions {
  onEnter?: () => void;
  value?: string;
  setValue?: (value: string) => void;
}

/**
 * ERGONOMIC TEXT INPUT SHORTCUTS HOOK
 *
 * Provides enhanced Alt+Q (backspace) and Alt+W (enter) functionality for text input fields.
 * Keeps hands in the Alt key area for efficient typing without reaching for backspace/enter.
 *
 * Enhanced backspace features:
 * - Alt+Q: Delete single character (with key repeat support)
 * - Alt+Shift+Q: Delete entire word
 * - Alt+Ctrl+Q: Delete from cursor to beginning of line
 * - Supports text selection deletion
 */
export function useTextInputShortcuts(
  options: UseTextInputShortcutsOptions = {}
) {
  const { onEnter, value = "", setValue } = options;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // ALT+Q - Enhanced ergonomic backspace
      if (e.altKey && e.key.toLowerCase() === "q") {
        e.preventDefault();
        const input = e.currentTarget;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        if (!setValue) return;

        // If there's a selection, delete the selected text
        if (start !== end) {
          const newValue = value.slice(0, start) + value.slice(end);
          setValue(newValue);
          // Immediate cursor positioning for fast deletion
          requestAnimationFrame(() => {
            if (input) {
              input.setSelectionRange(start, start);
            }
          });
          return;
        }

        // If cursor is at the beginning, do nothing
        if (start === 0) return;

        // Alt+Ctrl+Q - Delete from cursor to beginning of line
        if (e.ctrlKey) {
          const newValue = value.slice(start);
          setValue(newValue);
          // Immediate cursor positioning for fast deletion
          requestAnimationFrame(() => {
            if (input) {
              input.setSelectionRange(0, 0);
            }
          });
          return;
        }

        // Alt+Shift+Q - Delete entire word
        if (e.shiftKey) {
          const beforeCursor = value.slice(0, start);
          const afterCursor = value.slice(start);

          // Find the start of the current word by looking backwards
          let wordStart = beforeCursor.length;

          // Skip trailing whitespace
          while (wordStart > 0 && /\s/.test(beforeCursor[wordStart - 1])) {
            wordStart--;
          }

          // Find the start of the word (non-whitespace to whitespace boundary)
          while (wordStart > 0 && !/\s/.test(beforeCursor[wordStart - 1])) {
            wordStart--;
          }

          const newValue = beforeCursor.slice(0, wordStart) + afterCursor;
          setValue(newValue);
          // Immediate cursor positioning for fast deletion
          requestAnimationFrame(() => {
            if (input) {
              input.setSelectionRange(wordStart, wordStart);
            }
          });
          return;
        }

        // Alt+Q - Delete single character (standard behavior)
        const newValue = value.slice(0, start - 1) + value.slice(start);
        setValue(newValue);
        // Immediate cursor positioning for fast deletion
        requestAnimationFrame(() => {
          if (input) {
            input.setSelectionRange(start - 1, start - 1);
          }
        });
        return;
      }

      // ALT+W - Ergonomic enter
      if (e.altKey && e.key.toLowerCase() === "w") {
        e.preventDefault();
        if (onEnter) {
          onEnter();
        } else {
          // Default behavior: blur the input
          e.currentTarget.blur();
        }
        return;
      }
    },
    [value, setValue, onEnter]
  );

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
