/**
 * INSPECTOR SETTINGS HOOK - Persistent card visibility settings for node inspector
 *
 * Performance optimizations:
 * • Debounced localStorage writes to prevent excessive disk I/O
 * • Memoized callback functions to prevent child re-renders  
 * • Cached settings computation to avoid object recreation
 * • Optimized state updates with useCallback and useMemo
 * • Reduced effect dependencies for better performance
 *
 * Keywords: inspector-settings, localStorage, card-visibility, persistence, performance
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuthContext } from "@/components/auth/AuthProvider";

// ============================================================================
// STORAGE CONSTANTS
// ============================================================================

// Base storage key, basically the prefix for all inspector settings
const STORAGE_KEY_BASE = "agenitix-node-inspector-settings";

// ============================================================================
// TYPES
// ============================================================================

export interface InspectorSettings {
	nodeInfo: boolean;
	nodeData: boolean;
	output: boolean;
	controls: boolean;
	handles: boolean;
	connections: boolean;
	errors: boolean;
	size: boolean;
}

// Card order type for drag-and-drop functionality
export type CardType = keyof InspectorSettings;

export interface InspectorSettingsWithOrder extends InspectorSettings {
	cardOrder: CardType[];
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

const DEFAULT_SETTINGS: InspectorSettings = {
	nodeInfo: true,
	nodeData: false,
	output: false,
	controls: false,
	handles: false,
	connections: false,
	errors: true,
	size: false,
};

// Default card order, basically the initial layout sequence
const DEFAULT_CARD_ORDER: CardType[] = [
	'output',
	'nodeInfo',
	'nodeData',
	'controls',
	'handles',
	'connections',
	'size',
	'errors'
];

const DEFAULT_SETTINGS_WITH_ORDER: InspectorSettingsWithOrder = {
	...DEFAULT_SETTINGS,
	cardOrder: DEFAULT_CARD_ORDER,
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safely loads settings from localStorage with fallback, basically loads user preferences from browser storage
 */
const loadSettingsFromStorage = (userId?: string): InspectorSettingsWithOrder => {
	if (typeof window === "undefined") {
		return DEFAULT_SETTINGS_WITH_ORDER;
	}

	// Generate user-specific storage key, basically create unique key per user
	const storageKey = userId 
		? `${STORAGE_KEY_BASE}-user-${userId}` 
		: STORAGE_KEY_BASE;

	try {
		const stored = localStorage.getItem(storageKey);
		if (!stored) {
			return DEFAULT_SETTINGS_WITH_ORDER;
		}

		const parsed = JSON.parse(stored) as Partial<InspectorSettingsWithOrder>;
		
		// Merge with defaults to ensure all properties exist, basically fill in missing settings
		const merged: InspectorSettingsWithOrder = {
			...DEFAULT_SETTINGS_WITH_ORDER,
			...parsed,
		};

		// Ensure card order includes all possible cards, basically validate and fix order array
		const validCardOrder = DEFAULT_CARD_ORDER.filter(cardType => 
			merged.cardOrder?.includes(cardType)
		);
		
		// Add any missing cards to the end, basically append new cards that weren't in saved order
		const missingCards = DEFAULT_CARD_ORDER.filter(cardType => 
			!merged.cardOrder?.includes(cardType)
		);
		
		merged.cardOrder = [...validCardOrder, ...missingCards];
		
		return merged;
	} catch (error) {
		console.warn("Failed to load inspector settings from localStorage:", error);
		return DEFAULT_SETTINGS_WITH_ORDER;
	}
};

/**
 * Safely saves settings to localStorage, basically persists user preferences to browser storage
 */
const saveSettingsToStorage = (settings: InspectorSettingsWithOrder, userId?: string): void => {
	if (typeof window === "undefined") {
		return;
	}

	// Generate user-specific storage key, basically create unique key per user
	const storageKey = userId 
		? `${STORAGE_KEY_BASE}-user-${userId}` 
		: STORAGE_KEY_BASE;

	try {
		localStorage.setItem(storageKey, JSON.stringify(settings));
	} catch (error) {
		console.warn("Failed to save inspector settings to localStorage:", error);
	}
};

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

// Debounced localStorage save function, basically prevent excessive disk writes
let saveTimeoutId: NodeJS.Timeout | null = null;
const debouncedSave = (settings: InspectorSettingsWithOrder, userId?: string) => {
	if (saveTimeoutId) {
		clearTimeout(saveTimeoutId);
	}
	saveTimeoutId = setTimeout(() => {
		saveSettingsToStorage(settings, userId);
		saveTimeoutId = null;
	}, 300); // 300ms debounce
};

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook for managing persistent inspector card visibility settings and order
 */
export function useInspectorSettings() {
	// Get authenticated user for user-specific settings, basically access current user
	const { user } = useAuthContext();
	
	// Initialize with defaults for SSR safety, basically start with safe values
	const [settings, setSettings] = useState<InspectorSettingsWithOrder>(DEFAULT_SETTINGS_WITH_ORDER);
	const [isLoaded, setIsLoaded] = useState(false);
	
	// Ref to track if initial load is complete, basically prevent saving defaults on mount
	const hasLoadedInitial = useRef(false);

	// Hydrate from localStorage after component mounts, basically load saved settings on first render
	useEffect(() => {
		const loadedSettings = loadSettingsFromStorage(user?.id);
		setSettings(loadedSettings);
		setIsLoaded(true);
		hasLoadedInitial.current = true;
	}, [user?.id]);

	// Debounced save to localStorage when settings change, basically persist changes with delay
	useEffect(() => {
		if (hasLoadedInitial.current && isLoaded) {
			debouncedSave(settings, user?.id);
		}
	}, [settings, isLoaded, user?.id]);

	// Memoized toggle function, basically prevent function recreation on every render
	const toggleSetting = useCallback((key: keyof InspectorSettings): void => {
		setSettings(prev => ({
			...prev,
			[key]: !prev[key],
		}));
	}, []);

	// Memoized update card order function, basically prevent function recreation 
	const updateCardOrder = useCallback((newOrder: CardType[]): void => {
		setSettings(prev => ({
			...prev,
			cardOrder: newOrder,
		}));
	}, []);

	// Memoized reset function, basically prevent function recreation
	const resetToDefaults = useCallback((): void => {
		setSettings(DEFAULT_SETTINGS_WITH_ORDER);
	}, []);

	// Memoized state computations, basically avoid recalculating unless settings change
	const derivedState = useMemo(() => {
		const settingsValues = {
			nodeInfo: settings.nodeInfo,
			nodeData: settings.nodeData,
			output: settings.output,
			controls: settings.controls,
			handles: settings.handles,
			connections: settings.connections,
			errors: settings.errors,
			size: settings.size,
		};
		
		const allEnabled = Object.values(settingsValues).every(Boolean);
		const anyDisabled = Object.values(settingsValues).some(value => !value);
		
		return { allEnabled, anyDisabled };
	}, [settings.nodeInfo, settings.nodeData, settings.output, settings.controls, settings.handles, settings.connections, settings.errors, settings.size]);

	return {
		settings,
		toggleSetting,
		updateCardOrder,
		resetToDefaults,
		isLoaded,
		allEnabled: derivedState.allEnabled,
		anyDisabled: derivedState.anyDisabled,
	};
}