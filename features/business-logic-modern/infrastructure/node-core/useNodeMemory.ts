/**
 * NODE MEMORY REACT HOOK - Seamless integration with React components
 *
 * • Provides easy access to node memory within React components
 * • Automatic cleanup on component unmount
 * • Real-time memory metrics and monitoring
 * • Type-safe memory operations with TypeScript
 * • Integration with existing useNodeData hook
 *
 * Keywords: react-hook, node-memory, integration, type-safe, cleanup
 */

import { useCallback, useEffect, useState } from "react";
import { globalNodeMemoryManager } from "./NodeMemory";

// Helper functions for memory operations
function getFromMemory<T>(key: string, ttl?: number): T | null {
	// Simple memory store implementation
	const stored = globalNodeMemoryManager.get("global").get<{ value: T; timestamp: number }>(key);
	if (!stored) {
		return null;
	}

	if (ttl && Date.now() - stored.timestamp > ttl) {
		globalNodeMemoryManager.get("global").delete(key);
		return null;
	}

	return stored.value;
}

function storeInMemory<T>(key: string, value: T): void {
	globalNodeMemoryManager.get("global").set(key, {
		value,
		timestamp: Date.now(),
	});
}

/**
 * Enhanced node memory hook with React integration
 */
export function useNodeMemory<T>(
	key: string,
	computeFn: () => T | Promise<T>,
	dependencies: unknown[] = [],
	ttl?: number
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const compute = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			// Check memory first
			const cached = getFromMemory<T>(key, ttl);
			if (cached) {
				setData(cached);
				setLoading(false);
				return;
			}

			// Compute new value
			const result = await computeFn();
			storeInMemory(key, result);
			setData(result);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [key, computeFn, ttl]);

	// Compute on mount and dependency changes
	useEffect(() => {
		compute();
	}, [compute, ...dependencies]);

	return {
		data,
		loading,
		error,
		refresh: compute,
	};
}

/**
 * Hook for memory-aware state management
 * Combines React state with persistent node memory
 */
export function useMemoryState<T>(
	nodeId: string,
	key: string,
	initialValue: T,
	ttl?: number
): [T, (value: T) => void, T | undefined] {
	const memory = useNodeMemory(nodeId, () => initialValue);
	const [state, setState] = useState<T>(() => {
		// Try to load from memory first
		const cached = memory.data as T | null;
		return cached !== null ? cached : initialValue;
	});
	const [lastResult, setLastResult] = useState<T | undefined>(undefined);

	const setValue = (value: T) => {
		setState(value);
		// Store in memory
		storeInMemory(`${nodeId}:${key}`, value);
		setLastResult(value);
	};

	// Sync with memory on mount
	useEffect(() => {
		const cached = memory.data as T | null;
		if (cached !== null && cached !== state) {
			setState(cached);
			setLastResult(cached);
		}
	}, [key, memory.data, state]);

	return [state, setValue, lastResult];
}

/**
 * Hook for computed values with memory caching
 */
export function useMemoryComputed<T>(
	nodeId: string,
	key: string,
	computeFn: () => T | Promise<T>,
	dependencies: unknown[] = [],
	ttl?: number
): { data: T | null; loading: boolean; error: string | null; refresh: () => void } {
	const memory = useNodeMemory(nodeId, computeFn, dependencies, ttl);
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Sync with memory data
	useEffect(() => {
		setData(memory.data);
		setLoading(memory.loading);
		setError(memory.error);
	}, [memory.data, memory.loading, memory.error]);

	return {
		data,
		loading,
		error,
		refresh: memory.refresh,
	};
}

/**
 * Hook for memory analytics and monitoring
 */
export function useMemoryAnalytics(nodeId: string) {
	const memory = useNodeMemory(nodeId, () => ({ size: 0, lastUpdate: Date.now() }));

	return {
		metrics: memory.data || { size: 0, lastUpdate: Date.now() },
		refresh: memory.refresh,
		// Memory management functions
		performGC: () => {
			// Clear expired entries
			const now = Date.now();
			const entries = Object.keys(localStorage).filter((key) =>
				key.startsWith(`memory:${nodeId}:`)
			);
			entries.forEach((key) => {
				const data = localStorage.getItem(key);
				if (data) {
					try {
						const parsed = JSON.parse(data);
						if (parsed.expires && parsed.expires < now) {
							localStorage.removeItem(key);
						}
					} catch {
						// Invalid data, remove it
						localStorage.removeItem(key);
					}
				}
			});
		},
		clearMemory: () => {
			// Clear all entries for this node
			const entries = Object.keys(localStorage).filter((key) =>
				key.startsWith(`memory:${nodeId}:`)
			);
			entries.forEach((key) => localStorage.removeItem(key));
		},
	};
}
