import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { SidebarVariant, NodeStencil } from './types';
import { VARIANT_CONFIG } from './constants';
import { StencilInfoPanel, HoveredStencil } from '../StencilInfoPanel';
import { TabContent } from './components/TabContent';
import { NodeSearchModal } from './components/NodeSearchModal';
import { SearchBar } from './components/SearchBar';

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
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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

  // Keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchVisible(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isHidden) return null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <aside className="absolute bottom-0 right-0 z-30 h-[280px] w-[450px] border bg-background pl-6 pr-5 pt-2 rounded-lg">
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
          
          {/* Search Button */}
          <button
            onClick={() => setIsSearchVisible(true)}
            className="px-3 py-1.5 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            title="Search all nodes (Ctrl+K)"
          >
            <Search className="h-4 w-4" />
            {/* <span className="hidden sm:inline">Search</span> */}
            {/* <span className="hidden lg:inline text-xs text-gray-500">⌘K</span> */}
          </button>
        </TabsList>

        <div className="max-h-[230px] overflow-y-auto scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden pb-2">
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
          
          {/* Search Overlay */}
          <SearchBar
            isVisible={isSearchVisible}
            onClose={() => setIsSearchVisible(false)}
            onNativeDragStart={handleNativeDragStart}
            onDoubleClickCreate={onDoubleClickCreate}
            setHovered={setHovered}
          />
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