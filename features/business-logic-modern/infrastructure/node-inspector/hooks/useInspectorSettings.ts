/**
 * INSPECTOR SETTINGS HOOK - Persistent card visibility settings for node inspector
 *
 * • Manages card visibility toggles with localStorage persistence
 * • Provides toggle functions for individual card sections
 * • Maintains default visibility state for new users
 * • SSR-safe hydration with fallback to defaults
 * • Type-safe settings management
 *
 * Keywords: inspector-settings, localStorage, card-visibility, persistence
 */

import { useEffect, useState } from "react";
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
	'nodeInfo',
	'nodeData',
	'output',
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

	// Hydrate from localStorage after component mounts, basically load saved settings on first render
	useEffect(() => {
		const loadedSettings = loadSettingsFromStorage(user?.id);
		setSettings(loadedSettings);
		setIsLoaded(true);
	}, [user?.id]);

	// Save to localStorage whenever settings change, basically persist changes immediately
	useEffect(() => {
		if (isLoaded && user?.id) {
			saveSettingsToStorage(settings, user.id);
		}
	}, [settings, isLoaded, user?.id]);

	// Toggle function for individual settings, basically flip visibility state for a card
	const toggleSetting = (key: keyof InspectorSettings): void => {
		setSettings(prev => ({
			...prev,
			[key]: !prev[key],
		}));
	};

	// Update card order function, basically rearrange cards in inspector
	const updateCardOrder = (newOrder: CardType[]): void => {
		setSettings(prev => ({
			...prev,
			cardOrder: newOrder,
		}));
	};

	// Reset to defaults function, basically restore original visibility settings and order
	const resetToDefaults = (): void => {
		setSettings(DEFAULT_SETTINGS_WITH_ORDER);
	};

	// Check if all settings are enabled, basically determine if all cards are visible
	const allEnabled = Object.values({
		nodeInfo: settings.nodeInfo,
		nodeData: settings.nodeData,
		output: settings.output,
		controls: settings.controls,
		handles: settings.handles,
		connections: settings.connections,
		errors: settings.errors,
		size: settings.size,
	}).every(Boolean);

	// Check if any settings are disabled, basically determine if any cards are hidden
	const anyDisabled = Object.values({
		nodeInfo: settings.nodeInfo,
		nodeData: settings.nodeData,
		output: settings.output,
		controls: settings.controls,
		handles: settings.handles,
		connections: settings.connections,
		errors: settings.errors,
		size: settings.size,
	}).some(value => !value);

	return {
		settings,
		toggleSetting,
		updateCardOrder,
		resetToDefaults,
		isLoaded,
		allEnabled,
		anyDisabled,
	};
}