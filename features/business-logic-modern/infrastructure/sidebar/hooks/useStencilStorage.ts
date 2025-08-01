import { useEffect, useState, useCallback, useRef } from "react";
import { STORAGE_PREFIX } from "../constants";
import type { NodeStencil, SidebarVariant, TabKey } from "../types";

// Cache for storage keys to prevent repeated string concatenation, basically improve key lookup performance
const STORAGE_KEY_CACHE = new Map<string, string>();

// Debounced storage writes to prevent excessive localStorage operations, basically improve I/O performance
let storageTimeoutId: NodeJS.Timeout | null = null;
const debouncedStorageWrite = (key: string, data: NodeStencil[]) => {
	if (storageTimeoutId) {
		clearTimeout(storageTimeoutId);
	}
	storageTimeoutId = setTimeout(() => {
		if (typeof window !== "undefined") {
			try {
				window.localStorage.setItem(key, JSON.stringify(data));
			} catch (error) {
				console.warn(`Failed to save stencils to localStorage for key: ${key}`, error);
			}
		}
		storageTimeoutId = null;
	}, 300); // 300ms debounce
};

export function useStencilStorage<V extends SidebarVariant, K extends TabKey<V>>(
	variant: V,
	tab: K,
	defaults: NodeStencil[]
) {
	// Memoized storage key to prevent recreation, basically stable key reference
	const key = (() => {
		const cacheKey = `${variant}-${tab}`;
		let storageKey = STORAGE_KEY_CACHE.get(cacheKey);
		if (!storageKey) {
			storageKey = `${STORAGE_PREFIX}-${variant}-${tab}`;
			STORAGE_KEY_CACHE.set(cacheKey, storageKey);
		}
		return storageKey;
	})();

	// Track if initial load is complete to prevent saving defaults, basically avoid unnecessary writes
	const hasLoadedInitial = useRef(false);

	const [stencils, setStencils] = useState<NodeStencil[]>(() => {
		if (typeof window === "undefined") {
			return defaults;
		}

		try {
			const raw = window.localStorage.getItem(key);
			const parsed = raw ? (JSON.parse(raw) as NodeStencil[]) : undefined;
			const result = parsed?.length ? parsed : defaults;
			hasLoadedInitial.current = true;
			return result;
		} catch (error) {
			console.warn(`Failed to load stencils from localStorage for key: ${key}`, error);
			hasLoadedInitial.current = true;
			return defaults;
		}
	});

	// Optimized setter with memoization, basically prevent function recreation
	const setStencilsOptimized = useCallback((newStencils: NodeStencil[] | ((prev: NodeStencil[]) => NodeStencil[])) => {
		setStencils(prev => {
			const result = typeof newStencils === 'function' ? newStencils(prev) : newStencils;
			return result;
		});
	}, []);

	// Debounced storage effect with better dependencies, basically efficient localStorage operations
	useEffect(() => {
		if (hasLoadedInitial.current) {
			debouncedStorageWrite(key, stencils);
		}
	}, [key, stencils]);

	return [stencils, setStencilsOptimized] as const;
}
