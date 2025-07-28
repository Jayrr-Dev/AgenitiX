/**
 * MEMORY CLEANUP UTILITY - Advanced memory management for flow nodes
 *
 * • Comprehensive memory cleanup for DOM elements, events, and observers
 * • Automatic registration and tracking of memory-consuming resources
 * • Safe creation functions with built-in cleanup registration
 * • Node-specific and global memory cleanup with statistics tracking
 * • Performance monitoring and memory usage reporting
 *
 * Keywords: memory-cleanup, DOM-refs, event-listeners, observers, tracking, performance
 */

// ============================================================================
// FLOW ENGINE MEMORY CLEANUP UTILITY
// ============================================================================
// Comprehensive memory cleanup for flow nodes and editor components
// Enhanced version with better TypeScript support and monitoring

import { emergencyCleanupAllTimers, getTimerStats } from "./timerCleanup";

// ============================================================================
// MEMORY TRACKING INTERFACES
// ============================================================================

interface MemoryCleanupStats {
	timersCleared: {
		nodeCount: number;
		totalTimeouts: number;
		totalIntervals: number;
		totalRAFs: number;
		customCleanupCount: number;
	};
	cacheCleared: {
		domElementRefs: number;
		eventListeners: number;
		observers: number;
	};
	performanceMetrics: {
		cleanupDuration: number;
		memoryBeforeCleanup: number;
		memoryAfterCleanup: number;
		memoryFreed: number;
	};
}

// ============================================================================
// MEMORY REGISTRIES
// ============================================================================

// DOM Element References Registry
const domElementRefs = new Map<string, WeakRef<Element>>();

// Event Listener Registry
const eventListeners = new Map<
	string,
	Array<{
		element: Element;
		event: string;
		handler: EventListener;
		options?: boolean | AddEventListenerOptions;
	}>
>();

// Observer Registry (Intersection, Mutation, Resize observers)
const observers = new Map<
	string,
	Array<{
		observer: IntersectionObserver | MutationObserver | ResizeObserver;
		type: "intersection" | "mutation" | "resize";
	}>
>();

// ============================================================================
// MEMORY REGISTRATION FUNCTIONS
// ============================================================================

/**
 * REGISTER DOM ELEMENT REF
 * Register a DOM element reference for cleanup tracking
 */
export const registerDOMElement = (nodeId: string, element: Element): void => {
	domElementRefs.set(`${nodeId}-${Date.now()}`, new WeakRef(element));
};

/**
 * REGISTER EVENT LISTENER
 * Register an event listener for cleanup tracking
 */
export const registerEventListener = (
	nodeId: string,
	element: Element,
	event: string,
	handler: EventListener,
	options?: boolean | AddEventListenerOptions
): void => {
	if (!eventListeners.has(nodeId)) {
		eventListeners.set(nodeId, []);
	}

	eventListeners.get(nodeId)?.push({
		element,
		event,
		handler,
		options,
	});
};

/**
 * REGISTER OBSERVER
 * Register an observer for cleanup tracking
 */
export const registerObserver = (
	nodeId: string,
	observer: IntersectionObserver | MutationObserver | ResizeObserver,
	type: "intersection" | "mutation" | "resize"
): void => {
	if (!observers.has(nodeId)) {
		observers.set(nodeId, []);
	}

	observers.get(nodeId)?.push({
		observer,
		type,
	});
};

// ============================================================================
// SAFE CREATION FUNCTIONS
// ============================================================================

/**
 * SAFE ADD EVENT LISTENER
 * Add event listener with automatic cleanup registration
 */
export const safeAddEventListener = (
	nodeId: string,
	element: Element,
	event: string,
	handler: EventListener,
	options?: boolean | AddEventListenerOptions
): void => {
	element.addEventListener(event, handler, options);
	registerEventListener(nodeId, element, event, handler, options);
};

/**
 * SAFE CREATE INTERSECTION OBSERVER
 * Create intersection observer with automatic cleanup registration
 */
export const safeCreateIntersectionObserver = (
	nodeId: string,
	callback: IntersectionObserverCallback,
	options?: IntersectionObserverInit
): IntersectionObserver => {
	const observer = new IntersectionObserver(callback, options);
	registerObserver(nodeId, observer, "intersection");
	return observer;
};

/**
 * SAFE CREATE MUTATION OBSERVER
 * Create mutation observer with automatic cleanup registration
 */
export const safeCreateMutationObserver = (
	nodeId: string,
	callback: MutationCallback
): MutationObserver => {
	const observer = new MutationObserver(callback);
	registerObserver(nodeId, observer, "mutation");
	return observer;
};

/**
 * SAFE CREATE RESIZE OBSERVER
 * Create resize observer with automatic cleanup registration
 */
export const safeCreateResizeObserver = (
	nodeId: string,
	callback: ResizeObserverCallback
): ResizeObserver => {
	const observer = new ResizeObserver(callback);
	registerObserver(nodeId, observer, "resize");
	return observer;
};

// ============================================================================
// NODE-SPECIFIC CLEANUP FUNCTIONS
// ============================================================================

/**
 * CLEANUP NODE MEMORY
 * Clean up all memory references for a specific node
 */
export const cleanupNodeMemory = (nodeId: string): void => {
	// Clean up event listeners
	const nodeEventListeners = eventListeners.get(nodeId);
	if (nodeEventListeners) {
		nodeEventListeners.forEach(({ element, event, handler, options }) => {
			try {
				element.removeEventListener(event, handler, options);
			} catch (error) {
				console.warn(`Failed to remove event listener for node ${nodeId}:`, error);
			}
		});
		eventListeners.delete(nodeId);
	}

	// Clean up observers
	const nodeObservers = observers.get(nodeId);
	if (nodeObservers) {
		nodeObservers.forEach(({ observer, type }) => {
			try {
				observer.disconnect();
			} catch (error) {
				console.warn(`Failed to disconnect ${type} observer for node ${nodeId}:`, error);
			}
		});
		observers.delete(nodeId);
	}

	// Clean up DOM element references
	const keysToDelete: string[] = [];
	domElementRefs.forEach((_weakRef, key) => {
		if (key.startsWith(nodeId)) {
			keysToDelete.push(key);
		}
	});
	keysToDelete.forEach((key) => domElementRefs.delete(key));
};

// ============================================================================
// COMPLETE MEMORY CLEANUP
// ============================================================================

/**
 * PERFORM COMPLETE MEMORY CLEANUP
 * Comprehensive cleanup of all accumulated memory references
 */
export const performCompleteMemoryCleanup = (): MemoryCleanupStats => {
	const startTime = performance.now();
	const memoryBefore = getMemoryUsage();

	console.warn("🧹 Performing complete memory cleanup");

	// Get timer stats before cleanup
	const timerStatsBefore = getTimerStats();

	// Clean up all timers
	emergencyCleanupAllTimers();

	// Count cache items before cleanup
	const domRefsCount = domElementRefs.size;
	const eventListenersCount = Array.from(eventListeners.values()).reduce(
		(total, listeners) => total + listeners.length,
		0
	);
	const observersCount = Array.from(observers.values()).reduce(
		(total, observerList) => total + observerList.length,
		0
	);

	// Clean up all event listeners
	eventListeners.forEach((listeners, _nodeId) => {
		listeners.forEach(({ element, event, handler, options }) => {
			try {
				element.removeEventListener(event, handler, options);
			} catch (error) {
				console.warn("Failed to remove event listener during cleanup:", error);
			}
		});
	});
	eventListeners.clear();

	// Clean up all observers
	observers.forEach((observerList, _nodeId) => {
		observerList.forEach(({ observer, type }) => {
			try {
				observer.disconnect();
			} catch (error) {
				console.warn(`Failed to disconnect ${type} observer during cleanup:`, error);
			}
		});
	});
	observers.clear();

	// Clean up DOM element references
	domElementRefs.clear();

	// Force garbage collection if available (development only)
	if (typeof window !== "undefined" && "gc" in window) {
		try {
			(window as any).gc();
		} catch (_error) {
			// Garbage collection not available, continue
		}
	}

	const endTime = performance.now();
	const memoryAfter = getMemoryUsage();

	const stats: MemoryCleanupStats = {
		timersCleared: timerStatsBefore,
		cacheCleared: {
			domElementRefs: domRefsCount,
			eventListeners: eventListenersCount,
			observers: observersCount,
		},
		performanceMetrics: {
			cleanupDuration: endTime - startTime,
			memoryBeforeCleanup: memoryBefore,
			memoryAfterCleanup: memoryAfter,
			memoryFreed: memoryBefore - memoryAfter,
		},
	};
	return stats;
};

// ============================================================================
// MEMORY MONITORING UTILITIES
// ============================================================================

/**
 * GET MEMORY USAGE
 * Get current memory usage (if available)
 */
export const getMemoryUsage = (): number => {
	if (typeof window !== "undefined" && "performance" in window && "memory" in performance) {
		return (performance as any).memory.usedJSHeapSize || 0;
	}
	return 0;
};

/**
 * GET MEMORY STATS
 * Get detailed memory statistics
 */
export const getMemoryStats = () => {
	const domRefsCount = domElementRefs.size;
	const eventListenersCount = Array.from(eventListeners.values()).reduce(
		(total, listeners) => total + listeners.length,
		0
	);
	const observersCount = Array.from(observers.values()).reduce(
		(total, observerList) => total + observerList.length,
		0
	);

	return {
		domElementRefs: domRefsCount,
		eventListeners: {
			nodeCount: eventListeners.size,
			totalListeners: eventListenersCount,
		},
		observers: {
			nodeCount: observers.size,
			totalObservers: observersCount,
		},
		memoryUsage: getMemoryUsage(),
	};
};

/**
 * GET NODE MEMORY DETAILS
 * Get memory details for a specific node
 */
export const getNodeMemoryDetails = (nodeId: string) => {
	const nodeEventListeners = eventListeners.get(nodeId) || [];
	const nodeObservers = observers.get(nodeId) || [];

	const domRefCount = Array.from(domElementRefs.keys()).filter((key) =>
		key.startsWith(nodeId)
	).length;

	return {
		nodeId,
		eventListeners: nodeEventListeners.length,
		observers: nodeObservers.length,
		domElementRefs: domRefCount,
		details: {
			eventTypes: nodeEventListeners.map(({ event }) => event),
			observerTypes: nodeObservers.map(({ type }) => type),
		},
	};
};
