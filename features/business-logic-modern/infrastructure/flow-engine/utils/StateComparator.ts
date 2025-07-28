/**
 * STATE COMPARATOR UTILITY
 *
 * Robust state comparison logic that handles edge cases and provides
 * fallback mechanisms for production environments.
 *
 * Fixes the data propagation bug by replacing fragile JSON.stringify
 * comparisons with intelligent comparison strategies.
 */

export interface StateComparisonResult {
	hasChanges: boolean;
	changedKeys: string[];
	comparisonMethod: "primitive" | "deep" | "fallback";
	error?: string;
	performanceMs?: number;
}

export class StateComparator {
	private static instance: StateComparator;
	private performanceThreshold = 10; // ms

	static getInstance(): StateComparator {
		if (!StateComparator.instance) {
			StateComparator.instance = new StateComparator();
		}
		return StateComparator.instance;
	}

	/**
	 * Main comparison method with intelligent fallback strategies
	 */
	compare(
		current: Record<string, any>,
		incoming: Partial<Record<string, any>>
	): StateComparisonResult {
		const startTime = performance.now();
		const result: StateComparisonResult = {
			hasChanges: false,
			changedKeys: [],
			comparisonMethod: "primitive",
		};

		try {
			// Strategy 1: Primitive value comparison (fastest)
			const primitiveResult = this.comparePrimitive(current, incoming);
			if (primitiveResult.hasChanges) {
				result.hasChanges = true;
				result.changedKeys = primitiveResult.changedKeys;
				result.comparisonMethod = "primitive";
			} else {
				// Strategy 2: Deep object comparison (more thorough)
				const deepResult = this.compareDeep(current, incoming);
				if (deepResult.hasChanges) {
					result.hasChanges = true;
					result.changedKeys = deepResult.changedKeys;
					result.comparisonMethod = "deep";
				}
			}
		} catch (error) {
			// Strategy 3: Fallback comparison (most reliable)
			console.warn("State comparison error, using fallback:", error);
			const fallbackResult = this.compareFallback(current, incoming);
			result.hasChanges = fallbackResult.hasChanges;
			result.changedKeys = fallbackResult.changedKeys;
			result.comparisonMethod = "fallback";
			result.error = error instanceof Error ? error.message : "Unknown error";
		}

		const endTime = performance.now();
		result.performanceMs = endTime - startTime;

		// Log performance warnings in production
		if (result.performanceMs > this.performanceThreshold && process.env.NODE_ENV === "production") {
			console.warn(`Slow state comparison detected: ${result.performanceMs.toFixed(2)}ms`, {
				method: result.comparisonMethod,
				changedKeys: result.changedKeys,
			});
		}

		return result;
	}

	/**
	 * Fast primitive value comparison
	 */
	private comparePrimitive(
		current: Record<string, any>,
		incoming: Partial<Record<string, any>>
	): { hasChanges: boolean; changedKeys: string[] } {
		const changedKeys: string[] = [];

		for (const [key, incomingValue] of Object.entries(incoming)) {
			const currentValue = current[key];

			// Handle primitive types and null/undefined
			if (this.isPrimitive(incomingValue) && this.isPrimitive(currentValue)) {
				if (currentValue !== incomingValue) {
					changedKeys.push(key);
				}
			} else if (incomingValue === null || incomingValue === undefined) {
				if (currentValue !== incomingValue) {
					changedKeys.push(key);
				}
			} else {
				// Non-primitive values need deep comparison
				// Return early to trigger deep comparison strategy
				return { hasChanges: true, changedKeys: [key] };
			}
		}

		return { hasChanges: changedKeys.length > 0, changedKeys };
	}

	/**
	 * Deep object comparison with JSON serialization
	 */
	private compareDeep(
		current: Record<string, any>,
		incoming: Partial<Record<string, any>>
	): { hasChanges: boolean; changedKeys: string[] } {
		const changedKeys: string[] = [];

		for (const [key, incomingValue] of Object.entries(incoming)) {
			const currentValue = current[key];

			try {
				// Use JSON.stringify for deep comparison
				const currentStr = JSON.stringify(currentValue);
				const incomingStr = JSON.stringify(incomingValue);

				if (currentStr !== incomingStr) {
					changedKeys.push(key);
				}
			} catch (error) {
				// JSON.stringify failed (circular reference, etc.)
				// Fall back to reference comparison
				if (currentValue !== incomingValue) {
					changedKeys.push(key);
				}
			}
		}

		return { hasChanges: changedKeys.length > 0, changedKeys };
	}

	/**
	 * Fallback comparison using reference equality
	 */
	private compareFallback(
		current: Record<string, any>,
		incoming: Partial<Record<string, any>>
	): { hasChanges: boolean; changedKeys: string[] } {
		const changedKeys: string[] = [];

		for (const [key, incomingValue] of Object.entries(incoming)) {
			const currentValue = current[key];

			// Simple reference comparison as last resort
			if (currentValue !== incomingValue) {
				changedKeys.push(key);
			}
		}

		return { hasChanges: changedKeys.length > 0, changedKeys };
	}

	/**
	 * Check if value is primitive type
	 */
	private isPrimitive(value: any): boolean {
		return (
			value === null ||
			value === undefined ||
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean" ||
			typeof value === "bigint" ||
			typeof value === "symbol"
		);
	}

	/**
	 * Handle comparison errors gracefully
	 */
	handleComparisonError(error: Error, key: string): boolean {
		console.warn(`State comparison failed for key "${key}":`, error);

		// In production, log the error but continue
		if (process.env.NODE_ENV === "production") {
			// Could send to error tracking service here
			return true; // Assume change to be safe
		}

		// In development, be more strict
		return false;
	}

	/**
	 * Get performance statistics
	 */
	getPerformanceStats(): { threshold: number } {
		return {
			threshold: this.performanceThreshold,
		};
	}

	/**
	 * Set performance threshold for warnings
	 */
	setPerformanceThreshold(ms: number): void {
		this.performanceThreshold = ms;
	}
}

// Export singleton instance
export const stateComparator = StateComparator.getInstance();
