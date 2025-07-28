/**
 * TIMER CLEANUP UTILITY - Memory leak prevention for timers and animations
 *
 * • Comprehensive timer management preventing memory leaks in flow nodes
 * • Safe creation functions for timeouts, intervals, and animation frames
 * • Automatic cleanup registration and tracking per node
 * • Emergency cleanup functions for critical memory situations
 * • Performance monitoring and timer statistics reporting
 *
 * Keywords: timer-cleanup, memory-leaks, timeouts, intervals, RAF, tracking, performance
 */

// ============================================================================
// FLOW ENGINE TIMER CLEANUP UTILITY
// ============================================================================
// Prevents memory leaks from timers, intervals, and RAF in flow nodes
// Enhanced version with better TypeScript support and modern patterns

interface TimerRegistry {
	timeouts: Set<number>;
	intervals: Set<number>;
	rafs: Set<number>;
	customCleanup: Set<() => void>;
}

// GLOBAL TIMER REGISTRY PER NODE
const nodeTimers = new Map<string, TimerRegistry>();

// ============================================================================
// TIMER REGISTRATION FUNCTIONS
// ============================================================================

/**
 * REGISTER TIMEOUT
 * Register a setTimeout for cleanup tracking
 */
export const registerTimeout = (nodeId: string, timeoutId: number): void => {
	if (!nodeTimers.has(nodeId)) {
		nodeTimers.set(nodeId, {
			timeouts: new Set(),
			intervals: new Set(),
			rafs: new Set(),
			customCleanup: new Set(),
		});
	}
	nodeTimers.get(nodeId)?.timeouts.add(timeoutId);
};

/**
 * REGISTER INTERVAL
 * Register a setInterval for cleanup tracking
 */
export const registerInterval = (nodeId: string, intervalId: number): void => {
	if (!nodeTimers.has(nodeId)) {
		nodeTimers.set(nodeId, {
			timeouts: new Set(),
			intervals: new Set(),
			rafs: new Set(),
			customCleanup: new Set(),
		});
	}
	nodeTimers.get(nodeId)?.intervals.add(intervalId);
};

/**
 * REGISTER ANIMATION FRAME
 * Register a requestAnimationFrame for cleanup tracking
 */
export const registerRAF = (nodeId: string, rafId: number): void => {
	if (!nodeTimers.has(nodeId)) {
		nodeTimers.set(nodeId, {
			timeouts: new Set(),
			intervals: new Set(),
			rafs: new Set(),
			customCleanup: new Set(),
		});
	}
	nodeTimers.get(nodeId)?.rafs.add(rafId);
};

/**
 * REGISTER CUSTOM CLEANUP
 * Register a custom cleanup function
 */
export const registerCustomCleanup = (nodeId: string, cleanupFn: () => void): void => {
	if (!nodeTimers.has(nodeId)) {
		nodeTimers.set(nodeId, {
			timeouts: new Set(),
			intervals: new Set(),
			rafs: new Set(),
			customCleanup: new Set(),
		});
	}
	nodeTimers.get(nodeId)?.customCleanup.add(cleanupFn);
};

// ============================================================================
// SAFE TIMER CREATION FUNCTIONS
// ============================================================================

/**
 * SAFE SET TIMEOUT
 * Safe setTimeout that auto-registers for cleanup
 */
export const safeSetTimeout = (nodeId: string, callback: () => void, delay: number): number => {
	// SSR Safety: Only run in browser environment
	if (typeof window === "undefined") {
		console.warn("safeSetTimeout called on server-side, skipping");
		return 0;
	}

	const timeoutId = window.setTimeout(() => {
		callback();
		// Auto-remove from registry when completed
		const registry = nodeTimers.get(nodeId);
		if (registry) {
			registry.timeouts.delete(timeoutId);
		}
	}, delay);

	registerTimeout(nodeId, timeoutId);
	return timeoutId;
};

/**
 * SAFE SET INTERVAL
 * Safe setInterval that auto-registers for cleanup
 */
export const safeSetInterval = (nodeId: string, callback: () => void, interval: number): number => {
	// SSR Safety: Only run in browser environment
	if (typeof window === "undefined") {
		console.warn("safeSetInterval called on server-side, skipping");
		return 0;
	}

	const intervalId = window.setInterval(callback, interval);
	registerInterval(nodeId, intervalId);
	return intervalId;
};

/**
 * SAFE REQUEST ANIMATION FRAME
 * Safe requestAnimationFrame that auto-registers for cleanup
 */
export const safeRequestAnimationFrame = (
	nodeId: string,
	callback: (time: DOMHighResTimeStamp) => void
): number => {
	// SSR Safety: Only run in browser environment
	if (typeof window === "undefined") {
		console.warn("safeRequestAnimationFrame called on server-side, skipping");
		return 0;
	}

	const rafId = window.requestAnimationFrame((time) => {
		callback(time);
		// Auto-remove from registry when completed
		const registry = nodeTimers.get(nodeId);
		if (registry) {
			registry.rafs.delete(rafId);
		}
	});

	registerRAF(nodeId, rafId);
	return rafId;
};

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * CLEANUP NODE TIMERS
 * Clean up all timers for a specific node
 */
export const cleanupNodeTimers = (nodeId: string): void => {
	const registry = nodeTimers.get(nodeId);
	if (!registry) {
		return;
	}

	// Clear all timeouts
	registry.timeouts.forEach((timeoutId) => {
		window.clearTimeout(timeoutId);
	});

	// Clear all intervals
	registry.intervals.forEach((intervalId) => {
		window.clearInterval(intervalId);
	});

	// Cancel all RAF
	registry.rafs.forEach((rafId) => {
		window.cancelAnimationFrame(rafId);
	});

	// Run custom cleanup functions
	registry.customCleanup.forEach((cleanupFn) => {
		try {
			cleanupFn();
		} catch (error) {
			console.error(`Cleanup function failed for node ${nodeId}:`, error);
		}
	});

	// Remove registry
	nodeTimers.delete(nodeId);
};

/**
 * EMERGENCY CLEANUP ALL TIMERS
 * Emergency cleanup - clears ALL timers for ALL nodes
 */
export const emergencyCleanupAllTimers = (): void => {
	console.warn("🚨 Emergency cleanup - clearing ALL node timers");

	let _totalTimeouts = 0;
	let _totalIntervals = 0;
	let _totalRAFs = 0;
	let _totalCustomCleanup = 0;

	nodeTimers.forEach((registry, nodeId) => {
		_totalTimeouts += registry.timeouts.size;
		_totalIntervals += registry.intervals.size;
		_totalRAFs += registry.rafs.size;
		_totalCustomCleanup += registry.customCleanup.size;

		cleanupNodeTimers(nodeId);
	});
};

// ============================================================================
// DIAGNOSTICS & MONITORING
// ============================================================================

/**
 * GET TIMER STATS
 * Get statistics about timer usage across all nodes
 */
export const getTimerStats = (): {
	nodeCount: number;
	totalTimeouts: number;
	totalIntervals: number;
	totalRAFs: number;
	customCleanupCount: number;
} => {
	let totalTimeouts = 0;
	let totalIntervals = 0;
	let totalRAFs = 0;
	let customCleanupCount = 0;

	nodeTimers.forEach((registry) => {
		totalTimeouts += registry.timeouts.size;
		totalIntervals += registry.intervals.size;
		totalRAFs += registry.rafs.size;
		customCleanupCount += registry.customCleanup.size;
	});

	return {
		nodeCount: nodeTimers.size,
		totalTimeouts,
		totalIntervals,
		totalRAFs,
		customCleanupCount,
	};
};

/**
 * GET NODE TIMER DETAILS
 * Get detailed timer information for a specific node
 */
export const getNodeTimerDetails = (nodeId: string) => {
	const registry = nodeTimers.get(nodeId);
	if (!registry) {
		return null;
	}

	return {
		nodeId,
		timeouts: Array.from(registry.timeouts),
		intervals: Array.from(registry.intervals),
		rafs: Array.from(registry.rafs),
		customCleanupCount: registry.customCleanup.size,
	};
};
