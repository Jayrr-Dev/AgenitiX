/**
 * NODE FEATURE FLAG HOOK - Feature flag evaluation for nodes
 *
 * • Evaluates feature flags for individual nodes
 * • Provides fallback behavior when flags are unavailable
 * • Integrates with Hypertune for type-safe flag evaluation
 * • Supports node-level feature toggles with graceful degradation
 * • Handles loading states and error conditions
 * • Uses API endpoint for client-side flag evaluation
 *
 * Keywords: feature-flags, node-evaluation, hypertune-integration, graceful-degradation
 */

import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FeatureFlagConfig } from "./NodeSpec";

// Global cache for feature flag results to prevent duplicate API calls, basically avoid spamming the API
interface FlagCacheEntry {
	enabled: boolean;
	timestamp: number;
}

const GLOBAL_FLAG_CACHE = new Map<string, FlagCacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache to prevent API spam

// Global flag to completely disable all API requests to /api/flags/evaluate
let API_DISABLED = true; // API disabled globally

/**
 * Hook for evaluating feature flags in node components
 * @param featureFlag - Feature flag configuration from NodeSpec
 * @returns Object with flag status and loading state
 */
export function useNodeFeatureFlag(featureFlag?: FeatureFlagConfig) {
	const [isEnabled, setIsEnabled] = useState<boolean>(true);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// If no feature flag config, node is always enabled
		if (!featureFlag?.flag) {
			setIsEnabled(true);
			return;
		}

		const evaluateFlag = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Check cache first to prevent API spam, basically avoid duplicate requests
				const cached = GLOBAL_FLAG_CACHE.get(featureFlag.flag!);
				if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
					setIsEnabled(cached.enabled);
					setIsLoading(false);
					return;
				}

				// Check if we're on the client side
				if (typeof window !== "undefined") {
					// Check if API is globally disabled, basically stop all requests
					if (API_DISABLED) {
						const fallbackValue = featureFlag.fallback ?? false;
						setIsEnabled(fallbackValue);
						return;
					}

					// Client-side: use API endpoint
					const response = await fetch("/api/flags/evaluate", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ flagName: featureFlag.flag }),
					});

					// Handle disabled endpoint (503 Service Unavailable)
					if (response.status === 503) {
						// API is disabled globally, use fallback value and prevent ALL future requests
						API_DISABLED = true;
						const fallbackValue = featureFlag.fallback ?? false;
						GLOBAL_FLAG_CACHE.set(featureFlag.flag!, {
							enabled: fallbackValue,
							timestamp: Date.now(),
						});
						setIsEnabled(fallbackValue);
						return; // Exit early to prevent further processing
					}

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();
					
					// Handle warning messages from API
					if (data.warning) {
						console.warn("Feature flag warning:", data.warning);
					}
					
					// Cache the result to prevent future API spam, basically store for other nodes
					GLOBAL_FLAG_CACHE.set(featureFlag.flag!, {
						enabled: data.enabled,
						timestamp: Date.now(),
					});
					
					setIsEnabled(data.enabled);
				} else {
					// Server-side: import and evaluate flag directly
					const { testFlag } = await import("@/flag");
					const flagValue = await testFlag();
					
					// Cache server-side results too, basically prevent duplicate evaluations
					GLOBAL_FLAG_CACHE.set(featureFlag.flag!, {
						enabled: flagValue,
						timestamp: Date.now(),
					});
					
					setIsEnabled(flagValue);
				}
			} catch (err) {
				console.error("Error evaluating feature flag for node:", err);
				setError(err instanceof Error ? err.message : "Unknown error");

				// Use fallback value if available, otherwise disable
				setIsEnabled(featureFlag.fallback ?? false);
			} finally {
				setIsLoading(false);
			}
		};

		evaluateFlag();
	}, [featureFlag?.flag, featureFlag?.fallback]); // Only depend on specific properties to prevent infinite loops, basically stable dependencies

	return {
		isEnabled,
		isLoading,
		error,
		disabledMessage: featureFlag?.disabledMessage || "This feature is currently disabled",
		hideWhenDisabled: featureFlag?.hideWhenDisabled ?? false,
		alternativeNode: featureFlag?.alternativeNode,
	};
}

/**
 * Higher-order component that wraps nodes with feature flag evaluation
 * @param Component - The node component to wrap
 * @param featureFlag - Feature flag configuration
 * @returns Wrapped component with feature flag logic
 */
export function withFeatureFlag<T extends Record<string, unknown>>(
	Component: React.ComponentType<T>,
	featureFlag?: FeatureFlagConfig
) {
	return function WrappedComponent(props: T) {
		const flagState = useNodeFeatureFlag(featureFlag);

		if (!flagState.isEnabled) {
			if (flagState.hideWhenDisabled) {
				return null;
			}
			return (
				<div className="flex items-center justify-center rounded-lg border border-muted-foreground/20 border-dashed p-4 text-muted-foreground text-sm">
					{flagState.disabledMessage}
				</div>
			);
		}

		return <Component {...props} />;
	};
}
