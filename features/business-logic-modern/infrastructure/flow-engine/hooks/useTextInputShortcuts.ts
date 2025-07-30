/**
 * TEXT INPUT SHORTCUTS HOOK - Enhanced keyboard shortcuts for text inputs
 *
 * • ALT+Q: Enhanced ergonomic backspace for better text editing
 * • Custom word boundary detection for better editing flow
 * • Prevents event bubbling to avoid conflicts
 * • Optimized for developer productivity
 *
 * Keywords: keyboard-shortcuts, text-editing, ergonomic, productivity
 */

import type React from "react";
import { useCallback, useRef } from "react";

interface UseTextInputShortcutsOptions {
	onEnter?: () => void;
	value?: string;
	setValue?: (value: string) => void;
}

/**
 * Helper function to position cursor after text deletion
 */
const positionCursor = (input: HTMLInputElement, position: number): void => {
	requestAnimationFrame(() => {
		if (input) {
			input.setSelectionRange(position, position);
		}
	});
};

/**
 * Helper function to handle selected text deletion
 */
const handleSelectionDeletion = (
	value: string,
	start: number,
	end: number,
	setValue: (value: string) => void,
	input: HTMLInputElement
): void => {
	const newValue = value.slice(0, start) + value.slice(end);
	setValue(newValue);
	positionCursor(input, start);
};

/**
 * Helper function to handle deletion from cursor to beginning of line
 */
const handleLineStartDeletion = (
	value: string,
	start: number,
	setValue: (value: string) => void,
	input: HTMLInputElement
): void => {
	const newValue = value.slice(start);
	setValue(newValue);
	positionCursor(input, 0);
};

/**
 * Helper function to handle word deletion
 */
const handleWordDeletion = (
	value: string,
	start: number,
	setValue: (value: string) => void,
	input: HTMLInputElement
): void => {
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
	positionCursor(input, wordStart);
};

/**
 * Helper function to handle single character deletion
 */
const handleCharacterDeletion = (
	value: string,
	start: number,
	setValue: (value: string) => void,
	input: HTMLInputElement
): void => {
	const newValue = value.slice(0, start - 1) + value.slice(start);
	setValue(newValue);
	positionCursor(input, start - 1);
};

/**
 * Helper function to handle Alt+Q deletion logic
 */
const handleAltQDeletion = (
	e: React.KeyboardEvent<HTMLInputElement>,
	value: string,
	setValue: (value: string) => void
): void => {
	e.preventDefault();
	const input = e.currentTarget;
	const start = input.selectionStart || 0;
	const end = input.selectionEnd || 0;

	if (!setValue) {
		return;
	}

	// If there's a selection, delete the selected text
	if (start !== end) {
		handleSelectionDeletion(value, start, end, setValue, input);
		return;
	}

	// If cursor is at the beginning, do nothing
	if (start === 0) {
		return;
	}

	// Alt+Ctrl+Q - Delete from cursor to beginning of line
	if (e.ctrlKey) {
		handleLineStartDeletion(value, start, setValue, input);
		return;
	}

	// Alt+Shift+Q - Delete entire word
	if (e.shiftKey) {
		handleWordDeletion(value, start, setValue, input);
		return;
	}

	// Alt+Q - Delete single character (standard behavior)
	handleCharacterDeletion(value, start, setValue, input);
};

/**
 * Helper function to handle Alt+W enter logic
 */
const handleAltWEnter = (e: React.KeyboardEvent<HTMLInputElement>, onEnter?: () => void): void => {
	e.preventDefault();
	if (onEnter) {
		onEnter();
	} else {
		// Default behavior: blur the input
		e.currentTarget.blur();
	}
};

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
export function useTextInputShortcuts(options: UseTextInputShortcutsOptions = {}) {
	const { onEnter, value = "", setValue } = options;
	const inputRef = useRef<HTMLInputElement>(null);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>) => {
			// ALT+Q - Enhanced ergonomic backspace
			if (e.altKey && e.key.toLowerCase() === "q") {
				if (setValue) {
					handleAltQDeletion(e, value, setValue);
				}
				return;
			}

			// ALT+W - Ergonomic enter
			if (e.altKey && e.key.toLowerCase() === "w") {
				handleAltWEnter(e, onEnter);
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
