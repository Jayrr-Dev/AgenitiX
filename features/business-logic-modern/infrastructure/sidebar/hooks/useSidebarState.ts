/**
 * SIDEBAR STATE HOOK - Manages sidebar variant, tabs, and custom nodes with localStorage persistence
 *
 * • Handles hydration-safe state management for SSR compatibility
 * • Manages sidebar variant selection with validation
 * • Tracks active tabs per variant with persistence
 * • Manages custom nodes with CRUD operations
 * • Provides localStorage persistence with error handling
 * • Ensures consistent server/client rendering to prevent hydration mismatches
 *
 * Keywords: sidebar-state, localStorage, hydration-safe, SSR, variant-management
 */

import { useEffect, useState } from "react";
import {
  AnyTabKey,
  NodeStencil,
  SidebarVariant,
  TAB_CONFIG_A,
  TAB_CONFIG_B,
  TAB_CONFIG_C,
  TAB_CONFIG_D,
  TAB_CONFIG_E,
  TabKeyA,
  TabKeyB,
  TabKeyC,
  TabKeyD,
  TabKeyE,
} from "../types";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Storage keys for localStorage persistence */
const STORAGE_KEYS = {
  CUSTOM_NODES: "agenitix-custom-nodes",
  SIDEBAR_VARIANT: "agenitix-sidebar-variant",
  SIDEBAR_TABS: "agenitix-sidebar-tabs",
} as const;

/** Default state values for consistent SSR/client rendering */
const DEFAULT_VARIANT: SidebarVariant = "A";
const DEFAULT_TABS = {
  A: "MAIN" as TabKeyA,
  B: "CREATE" as TabKeyB,
  C: "ALL" as TabKeyC,
  D: "TOP_NODES" as TabKeyD,
  E: "ESSENTIALS" as TabKeyE,
};
const DEFAULT_CUSTOM_NODES: NodeStencil[] = [];

// ============================================================================
// TYPES
// ============================================================================

/** Type for the tabs state object */
type TabsState = {
  [key in SidebarVariant]: AnyTabKey;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely loads data from localStorage with fallback
 * @template T - The type of data to load
 * @param {string} key - The localStorage key
 * @param {T} fallback - The fallback value if loading fails
 * @returns {T} The loaded data or fallback
 */
const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;

  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
};

/**
 * Safely saves data to localStorage
 * @template T - The type of data to save
 * @param {string} key - The localStorage key
 * @param {T} value - The data to save
 */
const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

/**
 * Validates and normalizes a sidebar variant
 * @param {string} variant - The variant to validate
 * @returns {SidebarVariant} The validated variant
 */
const validateAndNormalizeVariant = (variant: string): SidebarVariant => {
  const normalizedVariant = variant.toUpperCase();
  const validVariants = ["A", "B", "C", "D", "E"];

  if (validVariants.includes(normalizedVariant)) {
    return normalizedVariant as SidebarVariant;
  }

  console.warn(`Invalid variant '${variant}'. Falling back to 'A'`);
  return "A";
};

/**
 * Validates and fixes tab keys for a given variant
 * @param {SidebarVariant} variant - The variant to validate against
 * @param {string} tabKey - The tab key to validate
 * @returns {AnyTabKey} The validated tab key
 */
const validateAndFixTabKey = (
  variant: SidebarVariant,
  tabKey: string
): AnyTabKey => {
  const validTabs = {
    A: TAB_CONFIG_A.map((tab) => tab.key),
    B: TAB_CONFIG_B.map((tab) => tab.key),
    C: TAB_CONFIG_C.map((tab) => tab.key),
    D: TAB_CONFIG_D.map((tab) => tab.key),
    E: TAB_CONFIG_E.map((tab) => tab.key),
  };

  const validTabsForVariant = validTabs[variant];

  if (validTabsForVariant.includes(tabKey)) {
    return tabKey as AnyTabKey;
  }

  // Invalid tab key, return the first valid tab for this variant
  console.warn(
    `Invalid tab key '${tabKey}' for variant '${variant}'. Falling back to '${validTabsForVariant[0]}'`
  );
  return validTabsForVariant[0] as AnyTabKey;
};

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * useSidebarState - Manages sidebar state with hydration-safe localStorage persistence
 *
 * This hook provides a complete state management solution for the sidebar component,
 * handling variant selection, tab management, and custom nodes with localStorage
 * persistence. It ensures consistent server/client rendering to prevent hydration
 * mismatches in Next.js applications.
 *
 * Features:
 * - Hydration-safe state initialization
 * - Variant selection with validation
 * - Tab management per variant
 * - Custom nodes CRUD operations
 * - localStorage persistence with error handling
 * - Consistent SSR/client rendering
 *
 * @returns {Object} The sidebar state and setter functions
 *
 * @example
 * ```tsx
 * const {
 *   variant,
 *   activeTab,
 *   setVariant,
 *   setActiveTab,
 *   customNodes,
 *   addCustomNode,
 *   removeCustomNode,
 *   reorderCustomNodes
 * } = useSidebarState();
 * ```
 */
export function useSidebarState() {
  // ========================================================================
  // STATE - Initialize with defaults for hydration-safe SSR
  // ========================================================================

  /** Current sidebar variant - starts with default, hydrates from localStorage */
  const [variant, setVariant] = useState<SidebarVariant>(DEFAULT_VARIANT);

  /** Active tabs for each variant - starts with defaults, hydrates from localStorage */
  const [tabs, setTabs] = useState<TabsState>(DEFAULT_TABS);

  /** Custom nodes array - starts empty, hydrates from localStorage */
  const [customNodes, setCustomNodes] =
    useState<NodeStencil[]>(DEFAULT_CUSTOM_NODES);

  // ========================================================================
  // EFFECTS - Hydrate from localStorage after mount
  // ========================================================================

  /**
   * Hydrate state from localStorage after component mounts
   * This runs only on the client side to prevent hydration mismatches
   */
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Load and validate variant from localStorage
    const storedVariant = loadFromStorage(
      STORAGE_KEYS.SIDEBAR_VARIANT,
      DEFAULT_VARIANT
    );
    const validatedVariant = validateAndNormalizeVariant(storedVariant);
    if (validatedVariant !== DEFAULT_VARIANT) {
      setVariant(validatedVariant);
    }

    // Load and validate tabs from localStorage
    const storedTabs = loadFromStorage(STORAGE_KEYS.SIDEBAR_TABS, DEFAULT_TABS);
    const validatedTabs: TabsState = {} as TabsState;
    let hasChanges = false;

    for (const variantKey of ["A", "B", "C", "D", "E"] as SidebarVariant[]) {
      const tabKey = storedTabs[variantKey] || DEFAULT_TABS[variantKey];
      const validatedTabKey = validateAndFixTabKey(variantKey, tabKey);
      validatedTabs[variantKey] = validatedTabKey;

      if (validatedTabKey !== DEFAULT_TABS[variantKey]) {
        hasChanges = true;
      }
    }

    if (hasChanges) {
      setTabs(validatedTabs);
    }

    // Load custom nodes from localStorage
    const storedCustomNodes = loadFromStorage(
      STORAGE_KEYS.CUSTOM_NODES,
      DEFAULT_CUSTOM_NODES
    );
    if (storedCustomNodes.length > 0) {
      setCustomNodes(storedCustomNodes);
    }
  }, []);

  /**
   * Save variant to localStorage whenever it changes
   */
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_VARIANT, variant);
  }, [variant]);

  /**
   * Save tabs to localStorage whenever they change
   */
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_TABS, tabs);
  }, [tabs]);

  /**
   * Save custom nodes to localStorage whenever they change
   */
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOM_NODES, customNodes);
  }, [customNodes]);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  /** Currently active tab for the selected variant */
  const activeTab = tabs[variant];

  // ========================================================================
  // HANDLERS
  // ========================================================================

  /**
   * Sets the active tab for the current variant
   * @param {string} tab - The tab key to set as active
   */
  const setActiveTab = (tab: string) => {
    setTabs((prev) => ({
      ...prev,
      [variant]: tab,
    }));
  };

  /**
   * Adds a new custom node to the collection
   * @param {NodeStencil} node - The custom node to add
   */
  const addCustomNode = (node: NodeStencil) => {
    setCustomNodes((prev) => [...prev, node]);
  };

  /**
   * Removes a custom node by ID
   * @param {string} nodeId - The ID of the node to remove
   */
  const removeCustomNode = (nodeId: string) => {
    setCustomNodes((prev) => prev.filter((node) => node.id !== nodeId));
  };

  /**
   * Reorders the custom nodes array
   * @param {NodeStencil[]} newOrder - The new order of custom nodes
   */
  const reorderCustomNodes = (newOrder: NodeStencil[]) => {
    setCustomNodes(newOrder);
  };

  /**
   * Sets the sidebar variant with validation
   * @param {SidebarVariant | string} newVariant - The new variant to set
   */
  const setValidatedVariant = (newVariant: SidebarVariant | string) => {
    const validatedVariant = validateAndNormalizeVariant(String(newVariant));
    setVariant(validatedVariant);
  };

  // ========================================================================
  // RETURN
  // ========================================================================

  return {
    variant,
    activeTab,
    setVariant: setValidatedVariant,
    setActiveTab,
    customNodes,
    addCustomNode,
    removeCustomNode,
    reorderCustomNodes,
  };
}
