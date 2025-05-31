import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search } from 'lucide-react';
import { SidebarVariant, NodeStencil, VARIANT_NAMES } from './types';
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
  onVariantChange: (variant: SidebarVariant) => void;
  onToggle: () => void;
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
  onVariantChange,
  onToggle,
}: SidebarTabsProps) {
  const { tabs } = VARIANT_CONFIG[variant];
  const [hovered, setHovered] = useState<HoveredStencil | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Store current stencils for keyboard shortcuts
  const currentStencilsRef = useRef<Record<string, NodeStencil[]>>({});

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

  // Callback to update current stencils for a tab
  const updateTabStencils = useCallback((tabKey: string, stencils: NodeStencil[]) => {
    currentStencilsRef.current[tabKey] = stencils;
  }, []);

  // Keyboard shortcut for search (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input field
      const activeElement = document.activeElement;
      const isTyping = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // Skip shortcuts if user is typing in an input field
      if (isTyping) {
        return;
      }

      // Search shortcut (Ctrl+K / Cmd+K)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchVisible(true);
      }
      
      // Variant switching shortcuts (Alt+1-5)
      if (e.altKey && e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        
        const variantMap: Record<string, SidebarVariant> = {
          '1': 'a', // Main
          '2': 'b', // Media
          '3': 'c', // Integration
          '4': 'd', // Automation
          '5': 'e', // Misc
        };
        
        const targetVariant = variantMap[e.key];
        if (targetVariant) {
          onVariantChange(targetVariant);
        }
        return; // Exit early to avoid processing other shortcuts
      }
      
      // Sidebar toggle shortcut (Alt+Q)
      if (e.altKey && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        onToggle();
        return; // Exit early to avoid processing other shortcuts
      }
      
      // Tab shortcuts (1-5 for tabs, 6 for search)
      if (e.key >= '1' && e.key <= '6') {
        e.preventDefault();
        
        if (e.key === '6') {
          // Key 6 opens search
          setIsSearchVisible(true);
        } else {
          // Keys 1-5 switch to corresponding tab
          const tabIndex = parseInt(e.key) - 1;
          if (tabIndex < tabs.length) {
            const targetTab = tabs[tabIndex];
            onTabChange(targetTab.key);
          }
        }
      }

      // Node grid shortcuts (QWERTY layout)
      const isCustomTab = variant === 'e' && activeTab === 'custom';
      
      if (isCustomTab) {
        // Special mapping for custom tab: q = add node, w-b shifted positions
        if (e.key.toLowerCase() === 'q') {
          e.preventDefault();
          // Open the add node modal
          setIsSearchModalOpen(true);
          return;
        }
        
        const customGridKeyMap: Record<string, number> = {
          // Row 1: wert (positions 0-3, shifted from qwer)
          'w': 0, 'e': 1, 'r': 2, 't': 3,
          // Row 2: asdfg (positions 4-8, shifted from asdg)
          'a': 4, 's': 5, 'd': 6, 'f': 7, 'g': 8,
          // Row 3: zxcvb (positions 9-13, shifted from zxcv)
          'z': 9, 'x': 10, 'c': 11, 'v': 12, 'b': 13,
        };

        if (customGridKeyMap.hasOwnProperty(e.key.toLowerCase())) {
          e.preventDefault();
          
          const position = customGridKeyMap[e.key.toLowerCase()];
          
          // Check if there's a node at this position in custom nodes
          if (position < customNodes.length) {
            const stencil = customNodes[position];
            onDoubleClickCreate(stencil.nodeType);
          }
        }
      } else {
        // Original mapping for all other tabs
        const gridKeyMap: Record<string, number> = {
          // Row 1: qwert (positions 0-4)
          'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4,
          // Row 2: asdfg (positions 5-9)
          'a': 5, 's': 6, 'd': 7, 'f': 8, 'g': 9,
          // Row 3: zxcvb (positions 10-14)
          'z': 10, 'x': 11, 'c': 12, 'v': 13, 'b': 14,
        };

        if (gridKeyMap.hasOwnProperty(e.key.toLowerCase())) {
          e.preventDefault();
          
          // Get current stencils from the active tab
          const currentStencils = currentStencilsRef.current[activeTab] || [];
          const position = gridKeyMap[e.key.toLowerCase()];
          
          // Check if there's a node at this position
          if (position < currentStencils.length) {
            const stencil = currentStencils[position];
            onDoubleClickCreate(stencil.nodeType);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [tabs, onTabChange, variant, activeTab, customNodes, onDoubleClickCreate, onVariantChange, onToggle]);

  if (isHidden) return null;

  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <aside className="absolute bottom-0 right-0 z-30 h-[200px] sm:h-[280px] w-full sm:w-[400px] lg:w-[450px] border bg-background pl-3 sm:pl-6 pr-3 sm:pr-5 pt-2 rounded-lg sm:rounded-lg rounded-b-none">
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

        <div className="max-h-[150px] sm:max-h-[230px] overflow-y-auto scrollbar *:scrollbar-thumb-gray-400 *:scrollbar-track-transparent *:scrollbar-arrow-hidden pb-2">
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
                onStencilsChange={!isCustomTab ? updateTabStencils : undefined}
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