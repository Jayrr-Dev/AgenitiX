import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { SidebarVariant, TabKey, NodeStencil } from '../types';
import { VARIANT_CONFIG } from '../constants';
import { StencilGrid } from '../StencilGrid';
import { useStencilStorage } from '../hooks/useStencilStorage';
import { AddNodeButton } from './AddNodeButton';
import { HoveredStencil } from '../../StencilInfoPanel';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableStencil } from '../SortableStencil';
import { useDragSensors } from '../hooks/useDragSensors';

interface TabContentProps {
  variant: SidebarVariant;
  tabKey: string;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  // Custom tab props
  isCustomTab?: boolean;
  customNodes?: NodeStencil[];
  onAddCustomNode?: () => void;
  onRemoveCustomNode?: (nodeId: string) => void;
  onReorderCustomNodes?: (newOrder: NodeStencil[]) => void;
  // Callback to notify parent of stencil changes
  onStencilsChange?: (tabKey: string, stencils: NodeStencil[]) => void;
}

export function TabContent({
  variant,
  tabKey,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  isCustomTab = false,
  customNodes = [],
  onAddCustomNode,
  onRemoveCustomNode,
  onReorderCustomNodes,
  onStencilsChange,
}: TabContentProps) {
  const { defaults } = VARIANT_CONFIG[variant];
  const sensors = useDragSensors();

  // KEYBOARD SHORTCUT MAPPING - Different for custom vs regular tabs
  const getKeyboardShortcut = React.useCallback((index: number): string => {
    if (isCustomTab) {
      // Custom tab mapping: q = add node, w-b shifted positions
      const customGridKeyMap: Record<number, string> = {
        // Row 1: wert (positions 0-3, shifted from qwer)
        0: 'W', 1: 'E', 2: 'R', 3: 'T',
        // Row 2: asdfg (positions 4-8, shifted from asdg)
        4: 'A', 5: 'S', 6: 'D', 7: 'F', 8: 'G',
        // Row 3: zxcvb (positions 9-13, shifted from zxcv)
        9: 'Z', 10: 'X', 11: 'C', 12: 'V', 13: 'B',
      };
      return customGridKeyMap[index] || '';
    } else {
      // Regular tab mapping: full QWERTY grid
      const gridKeyMap: Record<number, string> = {
        // Row 1: qwert (positions 0-4)
        0: 'Q', 1: 'W', 2: 'E', 3: 'R', 4: 'T',
        // Row 2: asdfg (positions 5-9)
        5: 'A', 6: 'S', 7: 'D', 8: 'F', 9: 'G',
        // Row 3: zxcvb (positions 10-14)
        10: 'Z', 11: 'X', 12: 'C', 13: 'V', 14: 'B',
      };
      return gridKeyMap[index] || '';
    }
  }, [isCustomTab]);

  // Get the correct defaults for this specific variant and tab
  const getDefaultStencils = (): NodeStencil[] => {
    if (isCustomTab) return [];
    
    // Safely access the defaults with proper type checking
    const tabDefaults = defaults[tabKey as keyof typeof defaults];
    return Array.isArray(tabDefaults) ? tabDefaults : [];
  };

  // For custom tab, don't use stencil storage
  const [stencils, setStencils] = isCustomTab 
    ? [[], () => {}] 
    : useStencilStorage(
        variant,
        tabKey as TabKey<typeof variant>,
        getDefaultStencils(),
      );

  // Notify parent of stencil changes for keyboard shortcuts
  React.useEffect(() => {
    if (!isCustomTab && onStencilsChange) {
      onStencilsChange(tabKey, stencils);
    }
  }, [stencils, tabKey, onStencilsChange, isCustomTab]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isCustomTab || !onReorderCustomNodes) return;
    
    const oldIndex = customNodes.findIndex((node) => node.id === active.id);
    const newIndex = customNodes.findIndex((node) => node.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(customNodes, oldIndex, newIndex);
      onReorderCustomNodes(newOrder);
    }
  };

  if (isCustomTab) {
    const nodeIds = customNodes.map((node) => node.id);
    
    return (
      <TabsContent value={tabKey}>
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={nodeIds} strategy={rectSortingStrategy}>
            <div className="flex flex-wrap justify-evenly gap-2 sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center sm:mx-auto">
              {/* Add Node Button as first item in grid */}
              <div className="flex items-center justify-center">
                <AddNodeButton onClick={onAddCustomNode || (() => {})} title="Add Node (Q)" />
              </div>
              
              {/* Custom nodes - now sortable */}
              {customNodes.map((stencil, index) => (
                <SortableStencil
                  key={stencil.id}
                  stencil={stencil}
                  onNativeDragStart={onNativeDragStart}
                  onDoubleClickCreate={onDoubleClickCreate}
                  setHovered={setHovered}
                  onRemove={onRemoveCustomNode}
                  showRemoveButton={true}
                  keyboardShortcut={getKeyboardShortcut(index)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </TabsContent>
    );
  }

  return (
    <TabsContent value={tabKey}>
      <StencilGrid
        stencils={stencils}
        setStencils={setStencils}
        onNativeDragStart={onNativeDragStart}
        onDoubleClickCreate={onDoubleClickCreate}
        setHovered={setHovered}
        getKeyboardShortcut={getKeyboardShortcut}
      />
    </TabsContent>
  );
} 