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

import React, { useEffect, useState } from "react";
import type { FeatureFlagConfig } from "./NodeSpec";

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

				// Check if we're on the client side
				if (typeof window !== "undefined") {
					// Client-side: use API endpoint
					const response = await fetch("/api/flags/evaluate", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({ flagName: featureFlag.flag }),
					});

					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const data = await response.json();
					setIsEnabled(data.enabled);
				} else {
					// Server-side: import and evaluate flag directly
					const { testFlag } = await import("@/flag");
					const flagValue = await testFlag();
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
	}, [featureFlag]);

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
export function withFeatureFlag(
	Component: React.ComponentType<any>,
	featureFlag?: FeatureFlagConfig
) {
	return React.forwardRef((props: any, ref: any) => {
		const flagState = useNodeFeatureFlag(featureFlag);

		// If flag is loading, show loading state
		if (flagState.isLoading) {
			return (
				<div className="flex items-center justify-center p-4 text-muted-foreground text-sm">
					Loading feature...
				</div>
			);
		}

		// If flag is disabled and should hide, return null
		if (!flagState.isEnabled && flagState.hideWhenDisabled) {
			return null;
		}

		// If flag is disabled, show disabled message or alternative
		if (!flagState.isEnabled) {
			return (
				<div className="flex items-center justify-center rounded-lg border border-muted-foreground/20 border-dashed p-4 text-muted-foreground text-sm">
					{flagState.disabledMessage}
				</div>
			);
		}

		// Flag is enabled, render the component
		return <Component {...props} ref={ref} />;
	});
}
