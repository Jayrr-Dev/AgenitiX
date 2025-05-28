/* -------------------------------------------------------------------------- */
/*  Sidebar.tsx – React-Flow stencil sidebar + hover panel                    */
/* -------------------------------------------------------------------------- */
'use client';

import React, { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

import { SidebarTabs } from './sidebar/SidebarTabs';
import { VariantSelector } from './sidebar/VariantSelector';
import { ToggleButton } from './sidebar/ToggleButton';
import { useSidebarState } from './sidebar/hooks/useSidebarState';
import { SidebarVariant } from './sidebar/types';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const [isHidden, setIsHidden] = useState(false);
  const { 
    variant, 
    activeTab, 
    setVariant, 
    setActiveTab, 
    customNodes, 
    addCustomNode, 
    removeCustomNode,
    reorderCustomNodes
  } = useSidebarState();
  const { addNodes } = useReactFlow();

  const toggleVisibility = useCallback(() => {
    setIsHidden(prev => !prev);
  }, []);

  const handleCreateNode = useCallback(
    (nodeType: string) => {
      addNodes({
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position: { x: 100, y: 100 },
        data: {},
      });
    },
    [addNodes],
  );

  return (
    <div className={className}>
      <VariantSelector
        variant={variant}
        onVariantChange={setVariant}
        isHidden={isHidden}
      />

      <SidebarTabs
        variant={variant}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onDoubleClickCreate={handleCreateNode}
        isHidden={isHidden}
        customNodes={customNodes}
        onAddCustomNode={addCustomNode}
        onRemoveCustomNode={removeCustomNode}
        onReorderCustomNodes={reorderCustomNodes}
      />

      <ToggleButton
        isHidden={isHidden}
        onToggle={toggleVisibility}
      />
    </div>
  );
}
