import { useState, useEffect } from 'react';
import { SidebarVariant, TabKey, NodeStencil, TabKeyA, TabKeyB, TabKeyC, TabKeyD, TabKeyE } from '../types';

// Helper functions for localStorage
const STORAGE_KEYS = {
  CUSTOM_NODES: 'agenitix-custom-nodes',
  SIDEBAR_VARIANT: 'agenitix-sidebar-variant',
  SIDEBAR_TABS: 'agenitix-sidebar-tabs',
} as const;

// Type for the tabs state object
type TabsState = {
  a: TabKeyA;
  b: TabKeyB;
  c: TabKeyC;
  d: TabKeyD;
  e: TabKeyE;
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

export function useSidebarState() {
  // Load initial states from localStorage
  const [variant, setVariant] = useState<SidebarVariant>(() => 
    loadFromStorage(STORAGE_KEYS.SIDEBAR_VARIANT, 'a')
  );
  
  const [tabs, setTabs] = useState<TabsState>(() =>
    loadFromStorage(STORAGE_KEYS.SIDEBAR_TABS, {
      a: 'core' as TabKeyA,
      b: 'images' as TabKeyB, 
      c: 'api' as TabKeyC,
      d: 'triggers' as TabKeyD,
      e: 'special' as TabKeyE,
    })
  );
  
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

  return {
    variant,
    activeTab,
    setVariant,
    setActiveTab,
    customNodes,
    addCustomNode,
    removeCustomNode,
    reorderCustomNodes,
  };
} 