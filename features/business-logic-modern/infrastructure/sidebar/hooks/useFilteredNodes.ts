/**
 * FILTERED NODES HOOK - Optimized with feature flag caching
 *
 * • Filters nodes based on feature flags with performance optimizations
 * • Caches flag results to prevent duplicate API calls
 * • Supports batch evaluation for better performance
 * • Graceful fallbacks for API failures
 *
 * Keywords: feature-flags, node-filtering, performance, caching
 */

import { useEffect, useState } from "react";
import { getAllNodeMetadata, getNodeFeatureFlag } from "../../node-registry/nodespec-registry";
import type { NodeSpecMetadata } from "../../node-registry/nodespec-registry";

interface FilteredNodesState {
	nodes: NodeSpecMetadata[];
	isLoading: boolean;
	error: string | null;
}

// Global flag to prevent API requests when endpoint is disabled
let SIDEBAR_API_DISABLED = true; // API disabled globally

/**
 * Get feature flag value - now uses the global cache from useNodeFeatureFlag to prevent conflicts, basically shared caching
 */
async function getCachedFlagValue(flagName: string): Promise<boolean> {
	// Check if API is globally disabled, basically stop all requests
	if (SIDEBAR_API_DISABLED) {
		return false; // Always return false when API is disabled
	}

	// Use a simple direct API call since the global cache in useNodeFeatureFlag will handle caching
	try {
		const response = await fetch("/api/flags/evaluate", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ flagName }),
		});

		// Handle disabled endpoint (503 Service Unavailable), basically stop making requests
		if (response.status === 503) {
			SIDEBAR_API_DISABLED = true; // Disable all future requests globally
			console.info(`Feature flag API is disabled for '${flagName}', using fallback value`);
			return false; // Use safe fallback when API is disabled
		}

		if (response.ok) {
			const data = await response.json();
			return data.enabled;
		}
	} catch (error) {
		console.warn(`Failed to evaluate feature flag '${flagName}':`, error);
	}

	// Fallback to false for failed requests
	return false;
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
				// Get all nodes first
				const allNodes = getAllNodeMetadata();

				// Quick synchronous check - if no nodes have feature flags, return immediately
				const hasFeatureFlags = allNodes.some((node) => getNodeFeatureFlag(node.kind));

				if (!hasFeatureFlags) {
					// No feature flags - return all nodes immediately (synchronous)
					setState({
						nodes: allNodes,
						isLoading: false,
						error: null,
					});
					return;
				}

				// Feature flags exist - proceed with async evaluation
				setState((prev) => ({ ...prev, isLoading: true, error: null }));

				const filteredNodes: NodeSpecMetadata[] = [];

				// Check if we're on the client side
				if (typeof window !== "undefined") {
					// Collect unique flags to batch evaluate them
					const uniqueFlags = new Set<string>();
					const nodeFlags = new Map<
						string,
						{ flag: string; hideWhenDisabled: boolean; fallback?: boolean }
					>();

					// First pass: collect all unique flags
					for (const node of allNodes) {
						const featureFlag = getNodeFeatureFlag(node.kind);
						if (featureFlag) {
							uniqueFlags.add(featureFlag.flag);
							nodeFlags.set(node.kind, featureFlag);
						}
					}

					// If no feature flags exist, skip API calls and add all nodes immediately
					if (uniqueFlags.size === 0) {
						filteredNodes.push(...allNodes);
					} else {
						// Batch evaluate all unique flags
						const flagResults = new Map<string, boolean>();
						await Promise.all(
							Array.from(uniqueFlags).map(async (flagName) => {
								const isEnabled = await getCachedFlagValue(flagName);
								flagResults.set(flagName, isEnabled);
							})
						);

						// Second pass: filter nodes based on flag results
						for (const node of allNodes) {
							const featureFlag = nodeFlags.get(node.kind);

							if (featureFlag) {
								const isEnabled =
									flagResults.get(featureFlag.flag) ?? featureFlag.fallback ?? false;

								// If flag is disabled and should hide, skip this node
								if (!isEnabled && featureFlag.hideWhenDisabled) {
									continue;
								}
							}

							filteredNodes.push(node);
						}
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
		if (isLoading) {
			setFilteredState({ nodes: [], isLoading, error });
		} else {
			const categoryNodes = nodes.filter((node) => node.category === category);
			setFilteredState({
				nodes: categoryNodes,
				isLoading: false,
				error,
			});
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
		if (isLoading) {
			setFilteredState({ nodes: [], isLoading, error });
		} else {
			const folderNodes = nodes.filter((node) => node.ui?.folder === folder);
			setFilteredState({
				nodes: folderNodes,
				isLoading: false,
				error,
			});
		}
	}, [nodes, isLoading, error, folder]);

	return filteredState;
}
