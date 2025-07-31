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
	errors: false,
	size: false,
};

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safely loads settings from localStorage with fallback, basically loads user preferences from browser storage
 */
const loadSettingsFromStorage = (userId?: string): InspectorSettings => {
	if (typeof window === "undefined") {
		return DEFAULT_SETTINGS;
	}

	// Generate user-specific storage key, basically create unique key per user
	const storageKey = userId 
		? `${STORAGE_KEY_BASE}-user-${userId}` 
		: STORAGE_KEY_BASE;

	try {
		const stored = localStorage.getItem(storageKey);
		if (!stored) {
			return DEFAULT_SETTINGS;
		}

		const parsed = JSON.parse(stored) as Partial<InspectorSettings>;
		
		// Merge with defaults to ensure all properties exist, basically fill in missing settings
		return {
			...DEFAULT_SETTINGS,
			...parsed,
		};
	} catch (error) {
		console.warn("Failed to load inspector settings from localStorage:", error);
		return DEFAULT_SETTINGS;
	}
};

/**
 * Safely saves settings to localStorage, basically persists user preferences to browser storage
 */
const saveSettingsToStorage = (settings: InspectorSettings, userId?: string): void => {
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
 * Hook for managing persistent inspector card visibility settings
 */
export function useInspectorSettings() {
	// Get authenticated user for user-specific settings, basically access current user
	const { user } = useAuthContext();
	
	// Initialize with defaults for SSR safety, basically start with safe values
	const [settings, setSettings] = useState<InspectorSettings>(DEFAULT_SETTINGS);
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

	// Reset to defaults function, basically restore original visibility settings
	const resetToDefaults = (): void => {
		setSettings(DEFAULT_SETTINGS);
	};

	// Check if all settings are enabled, basically determine if all cards are visible
	const allEnabled = Object.values(settings).every(Boolean);

	// Check if any settings are disabled, basically determine if any cards are hidden
	const anyDisabled = Object.values(settings).some(value => !value);

	return {
		settings,
		toggleSetting,
		resetToDefaults,
		isLoaded,
		allEnabled,
		anyDisabled,
	};
}