/**
 * AUTO-SAVE CANVAS HOOK - Real-time canvas state persistence
 *
 * • Automatically saves canvas state (nodes and edges) to Convex
 * • Debounced saving to prevent excessive API calls
 * • Handles authentication and error states
 * • Provides save status feedback
 * • Optimized for real-time collaboration
 *
 * Keywords: auto-save, canvas, debounce, real-time, convex
 */

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useFlowMetadataOptional } from "../contexts/FlowMetadataContext";
import { useFlowStore } from "../stores/flowStore";

interface UseAutoSaveCanvasOptions {
	/** Debounce delay in milliseconds (default: 1000) */
	debounceMs?: number;
	/** Enable/disable auto-save (default: true) */
	enabled?: boolean;
	/** Show toast notifications for save status (default: false) */
	showNotifications?: boolean;
}

interface AutoSaveStatus {
	/** Whether auto-save is currently enabled */
	isEnabled: boolean;
	/** Whether a save operation is in progress */
	isSaving: boolean;
	/** Last save timestamp */
	lastSaved: Date | null;
	/** Last error that occurred during saving */
	lastError: string | null;
	/** Manually trigger a save */
	saveNow: () => void;
}

export function useAutoSaveCanvas(options: UseAutoSaveCanvasOptions = {}): AutoSaveStatus {
	const { debounceMs = 1000, enabled = true, showNotifications = false } = options;

	// Hooks
	const { user } = useAuthContext();
	const { flow } = useFlowMetadataOptional() || { flow: null };
	const { nodes, edges } = useFlowStore();
	const saveFlowCanvas = useMutation(api.flows.saveFlowCanvas);

	// State refs
	const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const lastSavedDataRef = useRef<string>("");
	const lastSavedRef = useRef<Date | null>(null);
	const lastErrorRef = useRef<string | null>(null);
	const isSavingRef = useRef(false);

	// Create stable serialized data for comparison
	const currentData = JSON.stringify({ nodes, edges });

	// Save function
	const performSave = useCallback(async () => {
		if (!(user?.id && flow?.id && flow.canEdit)) {
			return;
		}

		// Skip if data hasn't changed
		if (currentData === lastSavedDataRef.current) {
			return;
		}

		isSavingRef.current = true;
		lastErrorRef.current = null;

		try {
			await saveFlowCanvas({
				flow_id: flow.id as any,
				user_id: user.id,
				nodes,
				edges,
			});

			lastSavedDataRef.current = currentData;
			lastSavedRef.current = new Date();

			if (showNotifications) {
				toast.success("Canvas saved", {
					duration: 1000,
				});
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Failed to save canvas";
			lastErrorRef.current = errorMessage;

			console.error("Auto-save failed:", error);

			if (showNotifications) {
				toast.error(`Save failed: ${errorMessage}`, {
					duration: 3000,
				});
			}
		} finally {
			isSavingRef.current = false;
		}
	}, [
		user?.id,
		flow?.id,
		flow?.canEdit,
		currentData,
		nodes,
		edges,
		saveFlowCanvas,
		showNotifications,
	]);

	// Manual save function
	const saveNow = useCallback(() => {
		// Clear any pending debounced save
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
			debounceTimeoutRef.current = null;
		}

		performSave();
	}, [performSave]);

	// Auto-save effect with debouncing
	useEffect(() => {
		if (!(enabled && user?.id && flow?.id && flow.canEdit)) {
			return;
		}

		// Skip if data hasn't changed
		if (currentData === lastSavedDataRef.current) {
			return;
		}

		// Clear existing timeout
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		// Set new debounced save
		debounceTimeoutRef.current = setTimeout(() => {
			performSave();
		}, debounceMs);

		// Cleanup function
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
				debounceTimeoutRef.current = null;
			}
		};
	}, [enabled, user?.id, flow?.id, flow?.canEdit, currentData, debounceMs, performSave]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, []);

	// Return status object
	return {
		isEnabled: enabled && !!user?.id && !!flow?.id && !!flow?.canEdit,
		isSaving: isSavingRef.current,
		lastSaved: lastSavedRef.current,
		lastError: lastErrorRef.current,
		saveNow,
	};
}
