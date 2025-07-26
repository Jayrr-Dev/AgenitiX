/**
 * INSTALL APP FEATURE FLAG HOOK - Controls PWA install prompt visibility
 *
 * • Provides easy access to the install app feature flag
 * • Handles graceful degradation if flag evaluation fails
 * • Returns loading state for better UX
 * • Integrates with Hypertune for type-safe flag evaluation
 *
 * Keywords: feature-flag, pwa-install, hypertune, type-safety, graceful-degradation
 */

import { useState, useEffect } from "react";

interface UseInstallAppFlagReturn {
	isEnabled: boolean;
	isLoading: boolean;
	error: Error | null;
}

/**
 * Hook to check if the PWA install prompt should be shown
 * @returns Object with flag state and loading status
 */
export function useInstallAppFlag(): UseInstallAppFlagReturn {
	const [isEnabled, setIsEnabled] = useState(true); // Default to true for graceful degradation
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		const checkFlag = async () => {
			try {
				setIsLoading(true);
				setError(null);
				
				// Fetch flag value from server-side API
				const response = await fetch("/api/flags/install-app");
				const data = await response.json();
				
				if (data.success) {
					setIsEnabled(data.isEnabled);
				} else {
					console.warn("Flag evaluation failed, using fallback:", data.error);
					setIsEnabled(true); // Fallback to enabled
				}
			} catch (err) {
				console.warn("Failed to check install app feature flag, defaulting to enabled:", err);
				setError(err instanceof Error ? err : new Error("Unknown error"));
				setIsEnabled(true); // Graceful degradation
			} finally {
				setIsLoading(false);
			}
		};

		checkFlag();
	}, []);

	return { isEnabled, isLoading, error };
} 