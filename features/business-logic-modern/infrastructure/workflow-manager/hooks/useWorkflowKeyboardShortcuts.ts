/**
 * WORKFLOW KEYBOARD SHORTCUTS HOOK - Centralized keyboard shortcut management
 *
 * • Provides configurable keyboard shortcuts for workflow actions
 * • Implements proper event handling and cleanup
 * • Supports platform-specific modifiers (Cmd/Ctrl)
 * • Follows accessibility best practices
 *
 * Keywords: keyboard-shortcuts, accessibility, event-handling, cross-platform
 */

import { useEffect, useCallback } from "react";

export interface WorkflowKeyboardShortcuts {
	onExport?: () => void;
	onRun?: () => void;
	onSettings?: () => void;
	onReturnToDashboard?: () => void;
}

export interface UseWorkflowKeyboardShortcutsOptions {
	enabled?: boolean;
	shortcuts?: WorkflowKeyboardShortcuts;
}

/**
 * Hook to register keyboard shortcuts for workflow actions
 * Automatically handles platform detection (Mac vs Windows/Linux)
 */
export function useWorkflowKeyboardShortcuts({
	enabled = true,
	shortcuts = {},
}: UseWorkflowKeyboardShortcutsOptions = {}) {
	const {
		onExport,
		onRun,
		onSettings,
		onReturnToDashboard,
	} = shortcuts;

	const handleKeyDown = useCallback((event: KeyboardEvent) => {
		if (!enabled) return;

		// Detect platform modifier key, basically handles Mac vs PC differences
		const isModified = event.metaKey || event.ctrlKey;

		if (isModified) {
			switch (event.key.toLowerCase()) {
				case 'e':
					if (onExport) {
						event.preventDefault();
						onExport();
					}
					break;
				case 'r':
					if (onRun) {
						event.preventDefault();
						onRun();
					}
					break;
				case ',':
					if (onSettings) {
						event.preventDefault();
						onSettings();
					}
					break;
			}
		}

		// Escape key for returning to dashboard
		if (event.key === 'Escape' && onReturnToDashboard) {
			event.preventDefault();
			onReturnToDashboard();
		}
	}, [enabled, onExport, onRun, onSettings, onReturnToDashboard]);

	useEffect(() => {
		if (!enabled) return;

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [enabled, handleKeyDown]);

	// Return platform-specific modifier for display purposes
	const getModifierKey = useCallback(() => {
		return navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+';
	}, []);

	return {
		getModifierKey,
	};
}