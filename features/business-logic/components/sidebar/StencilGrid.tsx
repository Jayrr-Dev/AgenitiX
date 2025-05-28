import React, { useCallback, useMemo } from 'react';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { NodeStencil } from './types';
import { SortableStencil } from './SortableStencil';
import { useDragSensors } from './hooks/useDragSensors';
import { HoveredStencil } from '../StencilInfoPanel';

interface StencilGridProps {
  stencils: NodeStencil[];
  setStencils: (s: NodeStencil[]) => void;
  onNativeDragStart: (e: React.DragEvent<HTMLDivElement>, nodeType: string) => void;
  onDoubleClickCreate: (nodeType: string) => void;
  setHovered: (s: HoveredStencil | null) => void;
  onRemoveStencil?: (stencilId: string) => void;
  showRemoveButtons?: boolean;
}

export function StencilGrid({
  stencils,
  setStencils,
  onNativeDragStart,
  onDoubleClickCreate,
  setHovered,
  onRemoveStencil,
  showRemoveButtons = false,
}: StencilGridProps) {
  const sensors = useDragSensors();
  const ids = useMemo(() => stencils.map((s) => s.id), [stencils]);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      
      const oldIdx = stencils.findIndex((s) => s.id === active.id);
      const newIdx = stencils.findIndex((s) => s.id === over.id);
      setStencils(arrayMove(stencils, oldIdx, newIdx));
    },
    [stencils, setStencils],
  );

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter} 
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="flex flex-wrap justify-evenly gap-2 sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center sm:mx-auto">
          {stencils.map((stencil) => (
            <SortableStencil
              key={stencil.id}
              stencil={stencil}
              onNativeDragStart={onNativeDragStart}
              onDoubleClickCreate={onDoubleClickCreate}
              setHovered={setHovered}
              onRemove={onRemoveStencil}
              showRemoveButton={showRemoveButtons}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
} 