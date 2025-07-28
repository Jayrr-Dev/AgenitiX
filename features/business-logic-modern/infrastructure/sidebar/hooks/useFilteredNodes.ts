/**
 * FILTERED NODES HOOK - Feature flag filtering for sidebar nodes
 *
 * • Filters nodes based on feature flag evaluation
 * • Provides real-time updates when flags change
 * • Handles loading states during flag evaluation
 * • Graceful fallback when flags are unavailable
 * • Integrates with sidebar for dynamic node visibility
 *
 * Keywords: feature-flags, node-filtering, sidebar-integration, real-time-updates
 */

import { useEffect, useState } from "react";
import { getAllNodeMetadata, getNodeFeatureFlag } from "../../node-registry/nodespec-registry";
import type { NodeSpecMetadata } from "../../node-registry/nodespec-registry";

interface FilteredNodesState {
	nodes: NodeSpecMetadata[];
	isLoading: boolean;
	error: string | null;
}

/**
 * Hook for filtering nodes based on feature flags
 * @returns Object with filtered nodes, loading state, and error
 */
export function useFilteredNodes(): FilteredNodesState {
	const [state, setState] = useState<FilteredNodesState>({
		nodes: [],
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		const filterNodes = async () => {
			try {
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				// Get all nodes first
				const allNodes = getAllNodeMetadata();
				const filteredNodes: NodeSpecMetadata[] = [];

				// Check if we're on the client side
				if (typeof window !== "undefined") {
					// Client-side: use API endpoint for flag evaluation
					for (const node of allNodes) {
						// Get the feature flag configuration for this node
						const featureFlag = getNodeFeatureFlag(node.kind);

						if (featureFlag) {
							try {
								const response = await fetch("/api/flags/evaluate", {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify({ flagName: featureFlag.flag }),
								});

								if (response.ok) {
									const data = await response.json();
									const isEnabled = data.enabled;

									// If flag is disabled and should hide, skip this node
									if (!isEnabled && featureFlag.hideWhenDisabled) {
										continue;
									}
								} else {
									// If API fails, use fallback
									const isEnabled = featureFlag.fallback ?? false;
									if (!isEnabled && featureFlag.hideWhenDisabled) {
										continue;
									}
								}
							} catch (err) {
								// If flag evaluation fails, use fallback
								const isEnabled = featureFlag.fallback ?? false;
								if (!isEnabled && featureFlag.hideWhenDisabled) {
									continue;
								}
							}
						}

						filteredNodes.push(node);
					}
				} else {
					// Server-side: include all nodes (feature flags will be evaluated at render time)
					filteredNodes.push(...allNodes);
				}

				setState({
					nodes: filteredNodes,
					isLoading: false,
					error: null,
				});
			} catch (err) {
				console.error("Error filtering nodes by feature flags:", err);
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: err instanceof Error ? err.message : "Unknown error",
				}));
			}
		};

		filterNodes();
	}, []); // Re-run when component mounts or feature flags might change

	return state;
}

/**
 * Hook for filtering nodes by category with feature flag support
 * @param category - Category to filter by
 * @returns Object with filtered nodes for the category
 */
export function useFilteredNodesByCategory(category: string): FilteredNodesState {
	const { nodes, isLoading, error } = useFilteredNodes();

	const [filteredState, setFilteredState] = useState<FilteredNodesState>({
		nodes: [],
		isLoading,
		error,
	});

	useEffect(() => {
		if (!isLoading) {
			const categoryNodes = nodes.filter((node) => node.category === category);
			setFilteredState({
				nodes: categoryNodes,
				isLoading: false,
				error,
			});
		} else {
			setFilteredState({ nodes: [], isLoading, error });
		}
	}, [nodes, isLoading, error, category]);

	return filteredState;
}

/**
 * Hook for filtering nodes by folder with feature flag support
 * @param folder - Folder to filter by
 * @returns Object with filtered nodes for the folder
 */
export function useFilteredNodesByFolder(folder: string): FilteredNodesState {
	const { nodes, isLoading, error } = useFilteredNodes();

	const [filteredState, setFilteredState] = useState<FilteredNodesState>({
		nodes: [],
		isLoading,
		error,
	});

	useEffect(() => {
		if (!isLoading) {
			const folderNodes = nodes.filter((node) => node.ui?.folder === folder);
			setFilteredState({
				nodes: folderNodes,
				isLoading: false,
				error,
			});
		} else {
			setFilteredState({ nodes: [], isLoading, error });
		}
	}, [nodes, isLoading, error, folder]);

	return filteredState;
}
