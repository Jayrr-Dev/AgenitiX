import { useState, useEffect } from 'react';
import { SidebarVariant, NodeStencil, TabKeyA, TabKeyB, TabKeyC, TabKeyD, TabKeyE, AnyTabKey, TAB_CONFIG_A, TAB_CONFIG_B, TAB_CONFIG_C, TAB_CONFIG_D, TAB_CONFIG_E } from '../types';

// Helper functions for localStorage
const STORAGE_KEYS = {
  CUSTOM_NODES: 'agenitix-custom-nodes',
  SIDEBAR_VARIANT: 'agenitix-sidebar-variant',
  SIDEBAR_TABS: 'agenitix-sidebar-tabs',
} as const;

// Type for the tabs state object
type TabsState = {
  [key in SidebarVariant]: AnyTabKey;
};

const loadFromStorage = <T>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key} from localStorage:`, error);
    return fallback;
  }
};

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to save ${key} to localStorage:`, error);
  }
};

// Helper function to validate and normalize variant
const validateAndNormalizeVariant = (variant: string): SidebarVariant => {
  const normalizedVariant = variant.toUpperCase();
  const validVariants = ['A', 'B', 'C', 'D', 'E'];
  
  if (validVariants.includes(normalizedVariant)) {
    return normalizedVariant as SidebarVariant;
  }
  
  console.warn(`Invalid variant '${variant}'. Falling back to 'A'`);
  return 'A';
};

// Helper function to validate and fix tab keys
const validateAndFixTabKey = (variant: SidebarVariant, tabKey: string): AnyTabKey => {
  const validTabs = {
    A: TAB_CONFIG_A.map(tab => tab.key),
    B: TAB_CONFIG_B.map(tab => tab.key),
    C: TAB_CONFIG_C.map(tab => tab.key),
    D: TAB_CONFIG_D.map(tab => tab.key),
    E: TAB_CONFIG_E.map(tab => tab.key),
  };
  
  const validTabsForVariant = validTabs[variant];
  
  if (validTabsForVariant.includes(tabKey)) {
    return tabKey as AnyTabKey;
  }
  
  // Invalid tab key, return the first valid tab for this variant
  console.warn(`Invalid tab key '${tabKey}' for variant '${variant}'. Falling back to '${validTabsForVariant[0]}'`);
  return validTabsForVariant[0] as AnyTabKey;
};

export function useSidebarState() {
  // Load initial states from localStorage with validation
  const [variant, setVariant] = useState<SidebarVariant>(() => {
    const storedVariant = loadFromStorage(STORAGE_KEYS.SIDEBAR_VARIANT, 'A');
    return validateAndNormalizeVariant(storedVariant);
  });
  
  const [tabs, setTabs] = useState<TabsState>(() => {
    const defaultTabs = {
      A: 'MAIN' as TabKeyA,
      B: 'CREATE' as TabKeyB, 
      C: 'ALL' as TabKeyC,
      D: 'TOP_NODES' as TabKeyD,
      E: 'ESSENTIALS' as TabKeyE,
    };
    
    const storedTabs = loadFromStorage(STORAGE_KEYS.SIDEBAR_TABS, defaultTabs);
    
    // Validate and fix any invalid tab keys
    const validatedTabs: TabsState = {} as TabsState;
    for (const variant of ['A', 'B', 'C', 'D', 'E'] as SidebarVariant[]) {
      const tabKey = storedTabs[variant] || defaultTabs[variant];
      validatedTabs[variant] = validateAndFixTabKey(variant, tabKey);
    }
    
    return validatedTabs;
  });
  
  // Custom nodes state with localStorage persistence
  const [customNodes, setCustomNodes] = useState<NodeStencil[]>(() =>
    loadFromStorage(STORAGE_KEYS.CUSTOM_NODES, [])
  );

  // Save to localStorage whenever variant changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_VARIANT, variant);
  }, [variant]);

  // Save to localStorage whenever tabs change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SIDEBAR_TABS, tabs);
  }, [tabs]);

  // Save to localStorage whenever custom nodes change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOM_NODES, customNodes);
  }, [customNodes]);

  const activeTab = tabs[variant];
  
  const setActiveTab = (tab: string) => {
    setTabs(prev => ({
      ...prev,
      [variant]: tab
    }));
  };

  const addCustomNode = (node: NodeStencil) => {
    setCustomNodes(prev => [...prev, node]);
  };

  const removeCustomNode = (nodeId: string) => {
    setCustomNodes(prev => prev.filter(node => node.id !== nodeId));
  };

  const reorderCustomNodes = (newOrder: NodeStencil[]) => {
    setCustomNodes(newOrder);
  };

  // Wrap setVariant to ensure it always gets valid variants
  const setValidatedVariant = (newVariant: SidebarVariant | string) => {
    const validatedVariant = validateAndNormalizeVariant(String(newVariant));
    setVariant(validatedVariant);
  };

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