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
}: TabContentProps) {
  const { defaults } = VARIANT_CONFIG[variant];
  const sensors = useDragSensors();

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
                <AddNodeButton onClick={onAddCustomNode || (() => {})} />
              </div>
              
              {/* Custom nodes - now sortable */}
              {customNodes.map((stencil) => (
                <SortableStencil
                  key={stencil.id}
                  stencil={stencil}
                  onNativeDragStart={onNativeDragStart}
                  onDoubleClickCreate={onDoubleClickCreate}
                  setHovered={setHovered}
                  onRemove={onRemoveCustomNode}
                  showRemoveButton={true}
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
      />
    </TabsContent>
  );
} 