import React, { useState, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarVariant, NodeStencil } from './types';
import { VARIANT_CONFIG } from './constants';
import { StencilInfoPanel, HoveredStencil } from '../StencilInfoPanel';
import { TabContent } from './components/TabContent';
import { NodeSearchModal } from './components/NodeSearchModal';

interface SidebarTabsProps {
  variant: SidebarVariant;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  isHidden: boolean;
  customNodes: NodeStencil[];
  onAddCustomNode: (node: NodeStencil) => void;
  onRemoveCustomNode: (nodeId: string) => void;
  onReorderCustomNodes: (newOrder: NodeStencil[]) => void;
}

export function SidebarTabs({
  variant,
  activeTab,
  onTabChange,
  onDoubleClickCreate,
  isHidden,
  customNodes,
  onAddCustomNode,
  onRemoveCustomNode,
  onReorderCustomNodes,
}: SidebarTabsProps) {
  const { tabs } = VARIANT_CONFIG[variant];
  const [hovered, setHovered] = useState<HoveredStencil | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Get existing node types in custom section to prevent duplicates
  const existingCustomNodeTypes = customNodes.map(node => node.nodeType);

  const handleNativeDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, nodeType: string) => {
      console.log('Drag start:', nodeType);
      e.dataTransfer.setData('application/reactflow', nodeType);
      e.dataTransfer.effectAllowed = 'move';
    },
    [],
  );

  if (isHidden) return null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <aside className="absolute bottom-0 right-0 z-30 h-[225px] w-[450px] border bg-background pl-6 pr-5 pt-2">
        <StencilInfoPanel stencil={hovered} />

        <TabsList className="bg-background  items-stretch justify-between w-full gap-1 ">
          {tabs.map(({ key, label }) => (
            <TabsTrigger
              key={key}
              value={key}
              className=" data-[state=active]:bg-white data-[state=active]:brightness-110 dark:data-[state=active]:bg-gray-700"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="max-h-[180px] overflow-y-auto scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden pb-2">
          {tabs.map(({ key }) => {
            const isCustomTab = variant === 'e' && key === 'custom';
            
            return (
              <TabContent
                key={key}
                variant={variant}
                tabKey={key}
                onNativeDragStart={handleNativeDragStart}
                onDoubleClickCreate={onDoubleClickCreate}
                setHovered={setHovered}
                isCustomTab={isCustomTab}
                customNodes={isCustomTab ? customNodes : undefined}
                onAddCustomNode={isCustomTab ? () => setIsSearchModalOpen(true) : undefined}
                onRemoveCustomNode={isCustomTab ? onRemoveCustomNode : undefined}
                onReorderCustomNodes={isCustomTab ? onReorderCustomNodes : undefined}
              />
            );
          })}
        </div>

        <NodeSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          onAddNode={onAddCustomNode}
          existingNodes={existingCustomNodeTypes}
        />
      </aside>
    </Tabs>
  );
} 