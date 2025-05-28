import { useState } from 'react';
import { SidebarVariant, TabKey, NodeStencil } from '../types';

export function useSidebarState() {
  const [variant, setVariant] = useState<SidebarVariant>('a');
  const [tabA, setTabA] = useState<TabKey<'a'>>('core');
  const [tabB, setTabB] = useState<TabKey<'b'>>('images');
  const [tabC, setTabC] = useState<TabKey<'c'>>('api');
  const [tabD, setTabD] = useState<TabKey<'d'>>('triggers');
  const [tabE, setTabE] = useState<TabKey<'e'>>('special');
  
  // Custom nodes state for variant E
  const [customNodes, setCustomNodes] = useState<NodeStencil[]>([]);

  const activeTab = 
    variant === 'a' ? tabA : 
    variant === 'b' ? tabB : 
    variant === 'c' ? tabC :
    variant === 'd' ? tabD : 
    tabE;
  
  const setActiveTab = (tab: string) => {
    if (variant === 'a') {
      setTabA(tab as TabKey<'a'>);
    } else if (variant === 'b') {
      setTabB(tab as TabKey<'b'>);
    } else if (variant === 'c') {
      setTabC(tab as TabKey<'c'>);
    } else if (variant === 'd') {
      setTabD(tab as TabKey<'d'>);
    } else {
      setTabE(tab as TabKey<'e'>);
    }
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