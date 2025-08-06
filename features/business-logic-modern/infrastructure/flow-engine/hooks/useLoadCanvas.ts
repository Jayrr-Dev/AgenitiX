/**
 * LOAD CANVAS HOOK - Load canvas state from Convex
 *
 * • Loads canvas state (nodes and edges) from Convex when flow opens
 * • Handles authentication and permission checks
 * • Provides loading status and error handling
 * • Integrates with flow store for state management
 *
 * Keywords: load-canvas, convex, flow-store, authentication
 */

import { useAuthContext } from "@/components/auth/AuthProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useFlowMetadataOptional } from "../contexts/flow-metadata-context";
import { useFlowStore } from "../stores/flowStore";

interface UseLoadCanvasResult {
	/** Whether canvas data is currently loading */
	isLoading: boolean;
	/** Error message if loading failed */
	error: string | null;
	/** Whether canvas data has been loaded */
	hasLoaded: boolean;
}

export function useLoadCanvas(): UseLoadCanvasResult {
	const { user } = useAuthContext();
	const { flow } = useFlowMetadataOptional() || { flow: null };
	const { setNodes, setEdges } = useFlowStore();

	const [hasLoaded, setHasLoaded] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Query canvas data from Convex
	const canvasData = useQuery(
		api.flows.loadFlowCanvas,
		flow?.id
			? {
					flow_id: flow.id as Id<"flows">,
					user_id: user?.id as any,
				}
			: "skip"
	);

	// Load canvas data into store when available
	useEffect(() => {
		if (!canvasData || hasLoaded) {
			return;
		}

		try {
			// Clear localStorage persistence to prevent conflicts
			localStorage.removeItem('flow-editor-storage');
			
			// Load nodes and edges into the flow store
			if (canvasData.nodes && Array.isArray(canvasData.nodes)) {
				setNodes(canvasData.nodes);
			} else {
				setNodes([]);
			}

			if (canvasData.edges && Array.isArray(canvasData.edges)) {
				setEdges(canvasData.edges);
			} else {
				setEdges([]);
			}

			setHasLoaded(true);
			setError(null);
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : "Failed to load canvas data";
			setError(errorMessage);
			console.error("Failed to load canvas data:", err);
		}
	}, [canvasData, hasLoaded, setNodes, setEdges]);

	// Reset state when flow changes
	useEffect(() => {
		setHasLoaded(false);
		setError(null);
		// Clear localStorage when switching flows to prevent data contamination
		localStorage.removeItem('flow-editor-storage');
	}, [flow?.id]);

	return {
		isLoading: canvasData === undefined && !hasLoaded && !error,
		error,
		hasLoaded,
	};
}
